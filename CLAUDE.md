# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Plataforma de Aprovação de Criativos** ("Tinder de Aprovação de Anúncios") - A B2B SaaS internal tool for creative approval workflows between performance/creative teams and clients.

**Current Status:** Specification phase only - no implementation code yet.

## Source of Truth

- `descricao_app.md` - Complete product specification (Portuguese). Always prioritize this file for features, workflows, and requirements.
- `promopt_app.md` - Implementation guidance and architectural decisions.

## Architecture

### Two User Personas
1. **Clients** - Access via unique link (no login), mobile-first swipe interface
2. **Internal Team** - JWT authentication, desktop-first admin panel

### Tech Stack (Recommended)
- **Backend:** Node.js + TypeScript + NestJS/Fastify + Prisma + PostgreSQL
- **Frontend:** React + Vite/Next.js + TypeScript + Tailwind CSS
- **Animations:** Framer Motion + react-use-gesture (for swipes)
- **File Storage:** Cloudinary / AWS S3 / Supabase Storage

### Core Entities
- User, Client, Batch (Lote), Creative (Criativo), Approval, InternalAdjustmentStatus, ActivityLog

### Key Patterns
- JWT auth for admin, token-based public access for clients
- Activity logging for complete audit trail (core feature)
- Stateless backend for horizontal scaling

## Design System

Apple-like minimalist monochromatic design:
- **Colors:** Black (#000000), White (#FFFFFF), Grays (#111111, #1C1C1E, #2C2C2E, #3A3A3C, #8E8E93)
- **Typography:** SF Pro, Inter (weights 300-700)
- **Philosophy:** Maximum whitespace, attention on creative assets, blur modals (iOS style)

## Development Commands

```bash
# Installation
cd backend && npm install && npm run db:migrate
cd frontend && npm install

# Development
cd backend && npm run dev      # Backend API
cd frontend && npm run dev     # Frontend app

# Build & Test
npm run build
npm test
npm run lint
npm run format

# Database
npm run db:migrate              # Run migrations
npm run db:migrate:create -- --name migration_name
```

## Implementation Notes

- Treat `descricao_app.md` as absolute source of truth
- Document architectural decisions in `docs/arquitetura.md`
- Activity logging is critical - every approval/rejection must be tracked
- Client interface: gesture-based, mobile-first
- Admin interface: information-dense, desktop-first
