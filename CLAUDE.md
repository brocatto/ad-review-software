# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AdReviewOS** — B2B SaaS for creative approval workflows: the internal team uploads ad creatives in batches (lotes) and clients approve/reject them by swiping through a public link. MVP implemented and running.

- `descricao_app.md` is the product spec (Portuguese) and the source of truth for features and business rules. If the spec and the code disagree, raise it; don't silently pick one.
- `promopt_app.md` holds the original implementation brief; `Design System Dark.md` the visual system; `DEPLOY.md` deployment (Railway/Vercel/Docker).
- UI text, error messages and Slack messages are pt-BR. Keep them that way (backend exceptions included).
- Synkra AIOS framework rules live in `.claude/CLAUDE.md` and `.claude/rules/`.

## Commands

Backend (`backend/`, NestJS + Prisma + PostgreSQL) and frontend (`frontend/`, React + Vite + Tailwind) are separate npm projects. Run commands inside each directory.

```bash
docker compose up -d postgres     # local Postgres: db "ad_review", user/pass postgres

cd backend
npm install
npm run db:migrate                # prisma migrate dev
SEED_ADMIN_PASSWORD=xxxxxxxx npm run db:seed   # creates/updates the admin (SEED_ADMIN_EMAIL, default admin@adverse.com)
npm run dev                       # nest start --watch, port 3000
npm run build                     # nest build -> dist/main.js
npm test                          # jest, src/**/*.spec.ts (hand-written Prisma mocks, no test DB)
npx jest src/modules/batches      # one folder / file
npm run lint                      # eslint --fix
npm run db:migrate:create -- --name <name>   # after editing schema.prisma; commit the SQL
# (non-interactive shells: npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<ts>_<name>/migration.sql && npx prisma migrate deploy)
stripe listen --forward-to localhost:3000/webhooks/stripe   # local Stripe webhooks (set STRIPE_WEBHOOK_SECRET to the printed whsec_)

cd frontend
npm install
npm run dev                       # vite, port 5173; VITE_API_URL defaults to http://localhost:3000
npm run build                     # tsc && vite build (this is the typecheck)
npm run lint                      # --max-warnings 0
```

CI (`.github/workflows/ci.yml`) runs backend typecheck/build/tests and the frontend build on pushes to `master` and `aios-version`.

## Architecture

### SaaS layer (self-signup, trial, billing)
- Public routes: landing page at `/`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`. Backend: `POST /auth/signup` (e-mail + password, account starts with `TRIAL_PERIOD_DAYS`, must confirm e-mail before login), `GET /auth/verify-email?token`, `POST /auth/google` (Google Identity Services ID token verified with `google-auth-library`; links by e-mail or creates a trial account), `POST /auth/forgot-password` / `reset-password` (1h tokens).
- `SubscriptionGuard` (after `JwtAuthGuard` on clients, batches and creatives) allows `role ADMIN`, running trials and `ACTIVE` subscriptions; otherwise it throws `403 SUBSCRIPTION_REQUIRED`, which the frontend axios interceptor turns into a redirect to `/billing?expired=true`. `/billing/*` and `/activity-logs` are JWT-only on purpose.
- `BillingModule`: `POST /billing/checkout` (Stripe Checkout, subscription mode, `STRIPE_PRICE_ID_MONTHLY`), `POST /billing/portal`, `GET /billing/status`, and `POST /webhooks/stripe` (raw body, signature-verified, `@SkipThrottle`). Webhooks mirror the Stripe subscription into `Plan`/`Subscription` and `User.subscriptionStatus` (`NONE | TRIAL | ACTIVE | PAST_DUE | CANCELED`).
- `EmailModule` (Resend) sends verification, welcome, password-reset and billing e-mails in pt-BR; without `RESEND_API_KEY` it logs them (links included) instead. Stripe, Resend and Google are optional in development and validated as required in production by `config/env.validation.ts`.
- Accounts provisioned by an admin (`POST /users`, seed) are created verified with `subscriptionStatus ACTIVE`; the migration `20261031160000_add_saas_auth_billing` grandfathered all pre-existing users the same way.
- History: this layer was built in Jan 2026 on a detached HEAD, orphaned by the AIOS bootstrap on 2026-02-25 and recovered from the reflog on 2026-10-31 (local branch `recovered/saas-2026-01`, docs in `docs/plano-saas-2026-01.md` and `docs/landing-page.md`).

### Production hardening (added 2026-11-02)
- Verification and reset tokens are stored as SHA-256 hashes (`hashToken` in `auth.service.ts`); only the e-mailed link carries the raw token.
- `config/sentry.ts`: `initSentry()` + `SentryExceptionFilter` report 5xx to Sentry when `SENTRY_DSN` is set (frontend: `lib/sentry.ts` + `components/ErrorBoundary.tsx` with `VITE_SENTRY_DSN`). Both are no-ops without a DSN.
- `billing/trial-reminder.service.ts` (`@nestjs/schedule`, daily 10:00 America/Sao_Paulo) e-mails self-service trials ending in 3 days.
- Legal pages `/termos` and `/privacidade` (`pages/legal/*`, texts reference `lib/legal.ts`), linked from signup and the landing footer. SEO assets in `frontend/public` (favicon, og-image, robots, sitemap) and Open Graph tags in `index.html`.
- Ops scripts: `scripts/smoke-api.mjs`, `scripts/smoke-saas.mjs`, `scripts/railway-env.sh`, `backend/scripts/stripe-setup.mjs` (idempotent product/price/webhook/portal). Railway config in `backend/railway.json`; production env template in `backend/.env.production.example`. Launch runbook: `docs/launch-checklist.md`.

### Two access paths into the same data
1. **Internal team (admin panel):** JWT (`POST /auth/login`, Passport `JwtAuthGuard`). Every admin controller is guarded at class level. Roles: `ADMIN` and `MANAGER`; admin-only routes add `RolesGuard` + `@Roles('ADMIN')` (see `UsersController`). **Ownership is enforced in the services**: clients belong to the user that created them (`Client.userId`), batches to `createdByUserId`, and creatives/activity logs are checked through their batch (`BatchesService.verifyOwnership`). Every service method that touches these entities takes the `userId` from `req.user`.
2. **Clients (no login):** each `Batch` has a UUID `accessToken`. `ApprovalsController` serves the unauthenticated `/public/batch/:accessToken` endpoints used by the frontend route `/approve/:accessToken` (`ApprovalPage.tsx`, swipe UI). The public GET returns only `PENDING` creatives plus `allCreativesCount` for the progress bar.

### Creative lifecycle
- **Upload** (`POST /creatives/batch/:batchId`, multipart `files`, up to 50) creates `Creative` + v1 `CreativeVersion` + `PENDING` `Approval` + `NOT_STARTED` `InternalAdjustmentStatus` in one nested write, then sends the "batch sent" Slack notification.
- **Client decision:** approve/reject (reject may carry feedback), only while `PENDING`.
- **Revision** (`POST /creatives/:id/revision`) only on `REJECTED` creatives: bumps `currentVersion`/`revisionCount`, adds a `CreativeVersion`, resets the approval to `PENDING` and sets the adjustment status to `RESENT`. The creative reappears on the client link.
- After any approval change call `BatchesService.updateCounts(batchId)`: recomputes the denormalized counters, derives `status` (`PENDING` → `PARTIAL` → `COMPLETED`) and sends the "completed" Slack notification exactly once (conditional `updateMany`).
- **Concurrency pattern:** transitions use conditional `updateMany` (`where: { status: 'PENDING' }`) and check `count`. Follow it for any new transition.

### Cross-cutting
- **Activity log is a core feature:** every state change goes through `ActivityLogService.log({ batchId, creativeId, userId, action, details })`; `details` is a JSON string. Actions: `BATCH_CREATED`, `CREATIVES_UPLOADED`, `CREATIVE_APPROVED`, `CREATIVE_REJECTED`, `REVISION_UPLOADED`, `ADJUSTMENT_STATUS_UPDATED`, `CREATIVE_RENAMED`, `CREATIVE_DELETED`. When adding one, add its pt-BR description to `describeActivity()` in `frontend/src/lib/activity.ts` (feeds Histórico, the batch timeline and the per-creative timeline) and an icon to `components/ActivityIcon.tsx`. `GET /activity-logs?limit&before` is the paginated global history (owner-scoped).
- **File storage:** multer is configured once in `creatives.module.ts` (disk temp dir, `MAX_FILE_SIZE`, image/video filter). `StorageService` (`config/storage.service.ts`) picks the provider by env: Cloudinary (`CLOUDINARY_CLOUD_NAME`), then Vercel Blob (`BLOB_READ_WRITE_TOKEN`, store `adreviewos-uploads`, public URLs under `blob.vercel-storage.com`), then the local `UPLOAD_DIR` (served at `/uploads` by `main.ts`); the temp file is always removed. Production refuses to boot without a remote provider unless `ALLOW_LOCAL_UPLOADS_IN_PRODUCTION=true`. `fileUrl` is absolute for remote providers and `/uploads/<uuid>.<ext>` locally; `getFileUrl()` on the frontend handles both. Deleting a creative or batch also removes its files.
- Status fields are plain `String` columns (not enums); valid values live in DTOs/services and `frontend/src/types/index.ts`.
- Global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted`: use DTOs for bodies and `ParseUUIDPipe` for ids (except upload routes, which must reach the service to discard temp files).
- Global throttler 300 req/min per IP; login and password change 10/min. `trust proxy` is on for Railway-style deployments. Helmet and CORS (`FRONTEND_URL`) in `main.ts`; `config/env.validation.ts` refuses to boot without `DATABASE_URL`/`JWT_SECRET` (strong secret required in production).
- Frontend keeps token/user in `localStorage` (`lib/api.ts` axios interceptor). Any 401 except from `/auth/login` clears the session and redirects to `/login`.

## Design System

Apple-like, minimalist, monochrome **dark** UI (see `Design System Dark.md` and `frontend/src/styles/globals.css` for the `.card`, `.card-static`, `.btn-*`, `.input`, `.badge-*`, `.alert-*` classes and the `text-text-*` / `glass` Tailwind tokens):
- Black/white/grays only; status colors reserved for approved/rejected/pending
- Inter, weights 300–700; generous whitespace; iOS-style blurred modals
- Client approval screen: mobile-first with swipe gestures (Framer Motion + `@use-gesture/react`). Admin panel: desktop-first, information-dense.
