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

cd frontend
npm install
npm run dev                       # vite, port 5173; VITE_API_URL defaults to http://localhost:3000
npm run build                     # tsc && vite build (this is the typecheck)
npm run lint                      # --max-warnings 0
```

CI (`.github/workflows/ci.yml`) runs backend typecheck/build/tests and the frontend build on pushes to `master` and `aios-version`.

## Architecture

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
- **File storage:** multer is configured once in `creatives.module.ts` (disk temp dir, `MAX_FILE_SIZE`, image/video filter). `StorageService` (`config/storage.service.ts`) uploads to Cloudinary when `CLOUDINARY_CLOUD_NAME` is set, otherwise copies into `UPLOAD_DIR` (served at `/uploads` by `main.ts`), always removing the temp file. `fileUrl` is absolute for Cloudinary and `/uploads/<uuid>.<ext>` locally; `getFileUrl()` on the frontend handles both. Deleting a creative or batch also removes its files.
- Status fields are plain `String` columns (not enums); valid values live in DTOs/services and `frontend/src/types/index.ts`.
- Global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted`: use DTOs for bodies and `ParseUUIDPipe` for ids (except upload routes, which must reach the service to discard temp files).
- Global throttler 300 req/min per IP; login and password change 10/min. `trust proxy` is on for Railway-style deployments. Helmet and CORS (`FRONTEND_URL`) in `main.ts`; `config/env.validation.ts` refuses to boot without `DATABASE_URL`/`JWT_SECRET` (strong secret required in production).
- Frontend keeps token/user in `localStorage` (`lib/api.ts` axios interceptor). Any 401 except from `/auth/login` clears the session and redirects to `/login`.

## Design System

Apple-like, minimalist, monochrome **dark** UI (see `Design System Dark.md` and `frontend/src/styles/globals.css` for the `.card`, `.card-static`, `.btn-*`, `.input`, `.badge-*`, `.alert-*` classes and the `text-text-*` / `glass` Tailwind tokens):
- Black/white/grays only; status colors reserved for approved/rejected/pending
- Inter, weights 300–700; generous whitespace; iOS-style blurred modals
- Client approval screen: mobile-first with swipe gestures (Framer Motion + `@use-gesture/react`). Admin panel: desktop-first, information-dense.
