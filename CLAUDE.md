# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Plataforma de Aprovação de Criativos** ("Tinder de Aprovação de Anúncios"): a B2B internal tool where the internal team uploads ad creatives in batches (lotes) and clients approve or reject them by swiping through a public link.

- `descricao_app.md` is the product spec (Portuguese) and the source of truth for features and business rules. If the spec and the code disagree, raise it; don't silently pick one.
- `promopt_app.md` holds the original implementation brief. `DEPLOY.md` covers Railway/Vercel/Docker deployment.
- The UI text, error messages and Slack messages are in Portuguese (pt-BR). Keep them that way.

## Commands

The backend (`backend/`, NestJS + Prisma + PostgreSQL) and the frontend (`frontend/`, React + Vite + Tailwind) are separate npm projects with no root package.json. Run commands from inside each directory.

```bash
# Local Postgres (docker-compose also defines backend/frontend prod images)
docker-compose up -d postgres

# Backend (port 3000). Copy .env.example to .env first
cd backend
npm install
npm run db:migrate          # prisma migrate dev
npm run db:seed             # creates admin@adverse.com / admin123 (+ a sample client)
npm run dev                 # nest start --watch
npm run build               # also compiles prisma/seed.ts to dist/prisma/seed.js
npm test                    # jest, picks up src/**/*.spec.ts
npx jest src/modules/batches/batches.service.spec.ts   # single test file
npx jest -t "notifies once" # single test by name
npm run lint                # eslint --fix
npm run db:studio           # Prisma Studio
npm run db:generate         # regenerate the client after editing schema.prisma

# Frontend (port 5173). VITE_API_URL defaults to http://localhost:3000
cd frontend
npm install
npm run dev
npm run build               # tsc && vite build, so this is also the typecheck
npm run lint                # --max-warnings 0, so warnings fail too
```

Backend unit tests construct services directly with hand-written Prisma mocks (see `approvals.service.spec.ts`); there is no test database and no frontend test setup.

Production (see `DEPLOY.md`): the backend Docker image runs `prisma migrate deploy` on every start, and the first admin is created once with `npm run db:seed:prod` (requires `ADMIN_PASSWORD`). `prisma` is a runtime dependency on purpose, so the migrate CLI version matches the client.

## Architecture

### Two access paths into the same data
1. **Internal team (admin panel):** JWT auth (`POST /auth/login`, Passport `JwtAuthGuard`). Every admin controller (`batches`, `creatives`, `clients`, `users`, `activity-logs`) is guarded at the class level. Roles are `ADMIN` and `MANAGER`; for admin-only routes, add `RolesGuard` after `JwtAuthGuard` along with `@Roles('ADMIN')`, as `UsersController` does. The frontend keeps the token and user in `localStorage` and adds the token in an axios interceptor (`frontend/src/lib/api.ts`). Any 401 except from the login call clears the session and redirects to `/login`.
2. **Clients (no login):** each `Batch` has a unique `accessToken` (a UUID). `ApprovalsController` serves the unauthenticated `/public/batch/:accessToken` endpoints, which the frontend route `/approve/:accessToken` (`ApprovalPage.tsx`, the swipe UI) calls. The public GET returns only creatives whose approval is `PENDING`, plus `allCreativesCount` for progress.

### Creative lifecycle (spread across the creatives, approvals and batches services)
- **Upload** (`POST /creatives/batch/:batchId`, multipart `files`, up to 50 files, 10MB each) creates a `Creative`, its v1 `CreativeVersion`, a `PENDING` `Approval` and a `NOT_STARTED` `InternalAdjustmentStatus`. It then sends a "batch sent" Slack notification.
- **Client decision:** approve or reject (reject can include feedback). This is allowed only while the approval is `PENDING`.
- **Revision** (`POST /creatives/:id/revision`) is allowed only on `REJECTED` creatives. It bumps `currentVersion`/`revisionCount`, adds a `CreativeVersion`, resets the approval to `PENDING`, and sets the adjustment status to `RESENT`. The creative then shows up again on the client's link.
- After any change to approvals, call `BatchesService.updateCounts(batchId)`. It recomputes the denormalized counters on `Batch` (`total/approved/rejected/pendingCount`), derives `status` (`PENDING` → `PARTIAL` → `COMPLETED`), and sends the Slack "completed" notification on the transition to `COMPLETED`.
- **Concurrency pattern:** status transitions use a conditional `updateMany` (for example `where: { creativeId, status: 'PENDING' }`) and check `count`. A plain read-then-`update` lets two concurrent requests both succeed, which duplicates log entries and Slack messages. Follow this pattern for any new transition.

### Cross-cutting
- **Activity log is a core feature:** every state change goes through `ActivityLogService.log({ batchId, creativeId, userId, action, details })`. `details` is stored as a JSON string. Actions use SCREAMING_SNAKE names such as `CREATIVE_APPROVED`. When you add an action, also add its pt-BR description to `describeActivity()` in `frontend/src/lib/activity.ts`, which feeds both the Histórico page and the per-creative timeline. Logs with a `creativeId` are cascade-deleted along with their creative.
- **Status fields are plain `String` columns**, not Prisma enums (a leftover from SQLite). The valid values live only in service code and `frontend/src/types/index.ts`.
- **File storage:** multer is configured once in `creatives.module.ts` and writes each upload to the OS temp dir, with the size limit taken from `MAX_FILE_SIZE`. `StorageService` (`config/storage.service.ts`) then either uploads the file to Cloudinary, when `CLOUDINARY_CLOUD_NAME` is set, or copies it into `UPLOAD_DIR`, which `main.ts` serves at `/uploads`. Either way it deletes the temp file. `fileUrl` is an absolute URL for Cloudinary and `/uploads/<uuid>.<ext>` for local storage. The frontend's `getFileUrl()` handles both. Deleting a creative or a batch also deletes its files through `StorageService.remove()`.
- **Notifications:** `NotificationsService` formats the messages and `SlackService` posts them to `SLACK_WEBHOOK_URL`. Both are controlled by `SLACK_ENABLED`.
- A global `ValidationPipe` runs with `whitelist` + `forbidNonWhitelisted`, so any request body field missing from the DTO is rejected. Use DTOs for bodies and `ParseUUIDPipe` for `:id` params.
- A global `ThrottlerGuard` allows 300 requests/min per IP. Login and password change are limited to 10/min through `@Throttle`. Behind a proxy, `TRUST_PROXY` must be set or every user shares a single bucket. Helmet and CORS (`FRONTEND_URL`) are set in `main.ts`, which also refuses to start in production if `JWT_SECRET` is weak.
- **Migrations:** Postgres only. After editing `schema.prisma`, run `npm run db:migrate:create -- --name <name>` and commit the generated SQL.

## Design System

Apple-like, minimalist, monochrome dark UI:
- Black `#000000`, white `#FFFFFF`, grays `#111111`, `#1C1C1E`, `#2C2C2E`, `#3A3A3C`, `#8E8E93`
- SF Pro / Inter, weights 300–700; generous whitespace; iOS-style blurred modals
- Client approval screen: mobile-first, swipe gestures (Framer Motion + `@use-gesture/react`). Admin panel: desktop-first and information-dense.
