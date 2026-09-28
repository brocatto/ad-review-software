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
npm run db:seed             # creates admin@adverse.com / admin123
npm run dev                 # nest start --watch
npm run build
npm test                    # jest, picks up src/**/*.spec.ts
npx jest src/modules/batches/batches.service.spec.ts   # single test file
npm run db:studio           # Prisma Studio
npm run db:generate         # regenerate the client after editing schema.prisma

# Frontend (port 5173). VITE_API_URL defaults to http://localhost:3000
cd frontend
npm install
npm run dev
npm run build               # tsc && vite build, so this is also the typecheck
```

What's missing so far:
- There are no `*.spec.ts` tests yet, so `npm test` finds nothing.
- Neither project has an ESLint config file, so `npm run lint` fails until one is added. Use `npm run build` to typecheck.

## Architecture

### Two access paths into the same data
1. **Internal team (admin panel):** JWT auth (`POST /auth/login`, Passport `JwtAuthGuard`). Every admin controller (`batches`, `creatives`, `clients`, `users`, `activity-logs`) is guarded at the class level. The frontend keeps the token in `localStorage` and adds it in an axios interceptor (`frontend/src/lib/api.ts`). Any 401 clears the token and redirects to `/login`.
2. **Clients (no login):** each `Batch` has a unique `accessToken` (a UUID). `ApprovalsController` serves the unauthenticated `/public/batch/:accessToken` endpoints, which the frontend route `/approve/:accessToken` (`ApprovalPage.tsx`, the swipe UI) calls. The public GET returns only creatives whose approval is `PENDING`, plus `allCreativesCount` for progress.

### Creative lifecycle (spread across the creatives, approvals and batches services)
- **Upload** (`POST /creatives/batch/:batchId`, multipart `files`, up to 50 files, 10MB each) creates a `Creative`, its v1 `CreativeVersion`, a `PENDING` `Approval` and a `NOT_STARTED` `InternalAdjustmentStatus`. It then sends a "batch sent" Slack notification.
- **Client decision:** approve or reject (reject can include feedback). This is allowed only while the approval is `PENDING`.
- **Revision** (`POST /creatives/:id/revision`) is allowed only on `REJECTED` creatives. It bumps `currentVersion`/`revisionCount`, adds a `CreativeVersion`, resets the approval to `PENDING`, and sets the adjustment status to `RESENT`. The creative then shows up again on the client's link.
- After any change to approvals, call `BatchesService.updateCounts(batchId)`. It recomputes the denormalized counters on `Batch` (`total/approved/rejected/pendingCount`), derives `status` (`PENDING` → `PARTIAL` → `COMPLETED`), and sends the Slack "completed" notification on the transition to `COMPLETED`.

### Cross-cutting
- **Activity log is a core feature:** every state change goes through `ActivityLogService.log({ batchId, creativeId, userId, action, details })`. `details` is stored as a JSON string. Actions use SCREAMING_SNAKE names such as `CREATIVE_APPROVED`.
- **Status fields are plain `String` columns**, not Prisma enums (a leftover from SQLite). The valid values live only in service code and `frontend/src/types/index.ts`.
- **File storage:** if `CLOUDINARY_CLOUD_NAME` is set, uploads go to Cloudinary (`config/cloudinary.service.ts`) and `fileUrl` is an absolute URL. Otherwise `main.ts` serves `/uploads` as static files. However, multer uses `memoryStorage`, so nothing is written to disk and the local fallback stores a placeholder path. In practice, uploads need Cloudinary to work. The frontend's `getFileUrl()` adds the API URL in front of relative paths.
- **Notifications:** `NotificationsService` formats the messages and `SlackService` posts them to `SLACK_WEBHOOK_URL`. Both are controlled by `SLACK_ENABLED`.
- A global `ValidationPipe` runs with `whitelist` + `forbidNonWhitelisted`, so any request body field missing from the DTO is rejected. A global `ThrottlerGuard` limits requests to 100/min, and Helmet and CORS (`FRONTEND_URL`) are set in `main.ts`.

### Known inconsistency: Prisma migrations
`schema.prisma` targets **postgresql**, but `prisma/migrations/` (and `migration_lock.toml`) were generated for **sqlite**. `20251119025423_add_projects` also creates a `projects` table that the current schema no longer has, because `Batch` links straight to `Client`. `prisma migrate deploy` against Postgres will fail until the migrations are regenerated. Keep this in mind before adding or running migrations.

## Design System

Apple-like, minimalist, monochrome dark UI:
- Black `#000000`, white `#FFFFFF`, grays `#111111`, `#1C1C1E`, `#2C2C2E`, `#3A3A3C`, `#8E8E93`
- SF Pro / Inter, weights 300–700; generous whitespace; iOS-style blurred modals
- Client approval screen: mobile-first, swipe gestures (Framer Motion + `@use-gesture/react`). Admin panel: desktop-first and information-dense.
