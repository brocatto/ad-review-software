# AdReviewOS - Development Plan

> **Last Updated:** 2025-01-25 (Phase 3 completed)

---

## Project Phases Overview

| Phase | Description | Status |
|-------|-------------|--------|
| 1. Production Readiness | Security, auth, billing improvements | COMPLETED |
| 2. Landing Page | High-conversion LP with dark glassmorphism | COMPLETED |
| 3. LP → Auth Integration | Conectar landing ao fluxo de signup/login | COMPLETED |
| 4. Production Deployment | Deploy, DNS, Stripe live | PENDING |

---

# Phase 1: Production Readiness

> **Status:** COMPLETED
> **Completed:** 2025-01-25

## Overview

Preparar o AdReviewOS para produção, corrigindo problemas críticos de segurança e funcionalidade identificados na revisão.

---

## Critical Issues - ALL RESOLVED

### 1. SubscriptionGuard Not Applied
- **Status:** [x] COMPLETED
- **Priority:** CRITICAL
- **Solution Applied:** Adicionado `@UseGuards(JwtAuthGuard, SubscriptionGuard)` em:
  - `batches.controller.ts`
  - `creatives.controller.ts`
  - `clients.controller.ts`
- **Modules updated:** AuthModule importado em batches, creatives, clients modules

### 2. Hardcoded Google Client ID
- **Status:** [x] COMPLETED
- **Priority:** CRITICAL
- **Solution Applied:** Substituído por `import.meta.env.VITE_GOOGLE_CLIENT_ID` em:
  - `LoginPage.tsx`
  - `SignupPage.tsx`

### 3. Test Credentials Exposed
- **Status:** [x] COMPLETED
- **Priority:** CRITICAL
- **Solution Applied:** Credenciais de teste removidas do `LoginPage.tsx`

### 4. No Rate Limiting
- **Status:** [x] COMPLETED
- **Priority:** CRITICAL
- **Solution Applied:**
  - Instalado `@nestjs/throttler`
  - Configurado `ThrottlerModule` em `app.module.ts` (10 req/min global)
  - Rate limiting específico em auth endpoints:
    - Login: 5 req/min
    - Signup: 3 req/min
    - Forgot password: 3 req/min

### 5. CORS Allows Localhost in Production
- **Status:** [x] COMPLETED
- **Priority:** HIGH
- **Solution Applied:** CORS dinâmico em `main.ts`:
  - Production: usa `FRONTEND_URL` do .env
  - Development: permite localhost:5173 e localhost:3000

### 6. Missing Security Headers
- **Status:** [x] COMPLETED
- **Priority:** HIGH
- **Solution Applied:**
  - Instalado `helmet`
  - Configurado `app.use(helmet())` em `main.ts`

### 7. Environment Variables Validation
- **Status:** [x] COMPLETED
- **Priority:** HIGH
- **Solution Applied:** Validação no bootstrap de:
  - `JWT_SECRET`
  - `STRIPE_SECRET_KEY`
  - `RESEND_API_KEY`

### 8. Missing Billing Emails
- **Status:** [x] COMPLETED
- **Priority:** MEDIUM
- **Solution Applied:** 4 novos templates em `email.service.ts`:
  - `sendPaymentSuccessEmail()` - confirmação de pagamento
  - `sendPaymentFailedEmail()` - falha no pagamento
  - `sendSubscriptionCanceledEmail()` - cancelamento
  - `sendTrialEndingEmail()` - aviso de fim do trial
- **Integration:** Webhooks em `billing.service.ts` disparam emails automaticamente

### 9. Missing Forgot Password
- **Status:** [x] COMPLETED
- **Priority:** MEDIUM
- **Solution Applied:**
  - Backend: `forgotPassword()` e `resetPassword()` em auth.service.ts
  - Endpoints: POST `/auth/forgot-password` e `/auth/reset-password`
  - Frontend: `ForgotPasswordPage.tsx` e `ResetPasswordPage.tsx`
  - Rotas adicionadas em `App.tsx`
  - Link "Esqueceu a senha?" no `LoginPage.tsx`
  - Email template: `sendPasswordResetEmail()` com token válido por 1h

### 10. Frontend .env.example Missing
- **Status:** [x] COMPLETED
- **Priority:** MEDIUM
- **Solution Applied:** Criado `frontend/.env.example`:
  ```env
  VITE_API_URL=http://localhost:3000
  VITE_GOOGLE_CLIENT_ID=your-google-client-id
  ```

---

## Execution Summary

| Agent | Scope | Status |
|-------|-------|--------|
| Agent 1 | SubscriptionGuard nos controllers | COMPLETED |
| Agent 2 | Rate Limiting, Helmet, CORS, Env Validation | COMPLETED |
| Agent 3 | Frontend env vars, remover hardcoded values | COMPLETED |
| Agent 4 | Billing email notifications | COMPLETED |
| Agent 5 | Forgot password flow completo | COMPLETED |

---

## Build Verification

- [x] Backend compila sem erros (`npm run build`)
- [x] Frontend compila sem erros (1815 módulos, 446KB bundle)

---

## Post-Implementation Checklist

### Testes Automatizados (build)
- [x] Backend starts without errors
- [x] Frontend starts without errors

### Testes Manuais (pendentes)
- [ ] Test login flow
- [ ] Test signup flow
- [ ] Test Google OAuth
- [ ] Test subscription guard blocking expired trial
- [ ] Test rate limiting (try 6+ login attempts)
- [ ] Test forgot password flow
- [ ] Verify security headers (helmet)
- [ ] Verify CORS with production domain
- [ ] Test Stripe webhook with emails

---

---

# Phase 4: Production Deployment (Future)

### 1. Configurar Variáveis de Ambiente de Produção

**Backend (.env):**
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=<gerar-secret-seguro-256-bits>
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID_MONTHLY=price_xxx
RESEND_API_KEY=re_xxx
FRONTEND_URL=https://app.seudominio.com
EMAIL_FROM=AdReviewOS <noreply@seudominio.com>
```

**Frontend (.env):**
```env
VITE_API_URL=https://api.seudominio.com
VITE_GOOGLE_CLIENT_ID=<seu-google-client-id-producao>
```

### 2. Configurar Google OAuth para Produção
1. Acessar Google Cloud Console
2. Adicionar domínio de produção nos Authorized JavaScript origins
3. Adicionar callback URL nos Authorized redirect URIs
4. Usar o Client ID de produção no `VITE_GOOGLE_CLIENT_ID`

### 3. Configurar Stripe para Produção
1. Ativar modo live no Stripe Dashboard
2. Configurar webhook endpoint: `https://api.seudominio.com/billing/webhook`
3. Adicionar eventos: `customer.subscription.*`, `invoice.payment_*`
4. Copiar `sk_live_` e `whsec_` para variáveis de ambiente

### 4. Configurar Resend para Produção
1. Verificar domínio no Resend
2. Configurar DNS (SPF, DKIM, DMARC)
3. Atualizar `EMAIL_FROM` com domínio verificado

### 5. Deploy
1. Build frontend: `npm run build`
2. Build backend: `npm run build`
3. Run migrations: `npx prisma migrate deploy`
4. Start server com PM2 ou similar

### 6. Testes Pós-Deploy
1. Verificar headers de segurança: `curl -I https://api.seudominio.com`
2. Testar fluxo completo de signup → verify email → login
3. Testar checkout Stripe com cartão de teste
4. Testar forgot password end-to-end
5. Testar rate limiting

---

## Notes

- Database migration não foi necessária (campos resetToken já existiam ou foram criados)
- Todos os emails seguem o Design System Dark do projeto

---

# Phase 2: Landing Page

> **Status:** COMPLETED
> **Completed:** 2025-01-25

## Overview

Landing page de alta conversão seguindo frameworks de direct response marketing (Schwartz, Halbert, Ogilvy, Hormozi, Brunson).

## Features Implementadas

- **Design:** Dark Glassmorphism (Design System Dark.md)
- **Sections:** Hero → Problema → Solução → Como Funciona → Testemunho → Antes/Depois → Preço → FAQ → CTA
- **Mobile:** Hamburger menu, sticky CTA, touch-friendly (52px targets)
- **Acessibilidade:** aria-labels, focus-visible, reduced motion support
- **Performance:** Framer Motion com lazy animations

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `frontend/src/pages/LandingPage.tsx` | Landing page completa |
| `frontend/src/App.tsx` | Rota `/landing` adicionada |
| `LANDING_PAGE_README.md` | Documentação da estratégia de copy |

## Acesso

```
http://localhost:5173/landing
```

---

# Phase 3: LP → Auth Integration

> **Status:** COMPLETED
> **Completed:** 2025-01-25

## Objetivo

Conectar a landing page ao fluxo de autenticação para converter leads em trial users.

## Tarefas - TODAS CONCLUÍDAS

### 3.1 Adicionar Link "Entrar" no Header
- [x] Desktop nav: link "Entrar" ao lado do CTA
- [x] Mobile menu: link "Entrar"
- [x] Destino: `/login`

### 3.2 Form Submit → Redirect to Signup
- [x] Alterar `handleSubmit` para redirecionar ao invés de mock
- [x] Destino: `/signup?email=${encodeURIComponent(email)}`
- [x] Adicionar `useNavigate` do react-router-dom

### 3.3 SignupPage: Pre-fill Email da URL
- [x] Adicionar `useSearchParams`
- [x] Ler `?email` da URL
- [x] Pre-preencher campo de email
- [x] Google OAuth continua disponível na página

### 3.4 Header CTAs → Signup Direto
- [x] Mudar "Começar grátis" de `#cta` para `/signup`
- [x] Desktop e mobile
- [x] Pricing section CTA → `/signup`
- [x] Mobile sticky CTA → `/signup`

## Fluxo Implementado

```
LANDING PAGE                         SIGNUP PAGE
┌─────────────────┐                  ┌─────────────────┐
│ [Entrar]────────│──────────────────│→ /login         │
│                 │                  │                 │
│ [Começar grátis]│──────────────────│→ /signup        │
│                 │                  │                 │
│ Form: email     │                  │ [Google OAuth]  │
│ [Submit] ───────│──/signup?email=──│→ Email pre-fill │
└─────────────────┘                  │ [Nome] [Senha]  │
                                     └─────────────────┘
```

## Arquivos Modificados

| Arquivo | Alterações |
|---------|------------|
| `frontend/src/pages/LandingPage.tsx` | + useNavigate, Link "Entrar" (desktop/mobile), handleSubmit redirect, todos CTAs para /signup |
| `frontend/src/pages/SignupPage.tsx` | + useSearchParams, pre-fill email da URL |

## Verificação

1. [x] Acessar `/landing` → Clicar "Entrar" → Vai para `/login`
2. [x] Inserir email no form → Clicar "Começar grátis" → Vai para `/signup?email=xxx`
3. [x] Na SignupPage → Email pre-preenchido
4. [x] Mobile: menu com "Entrar", sticky CTA vai para `/signup`
5. [x] TypeScript compila sem erros

---

# Appendix: Files Modified (Phase 1)

| File | Changes |
|------|---------|
| `backend/src/main.ts` | helmet, CORS, env validation |
| `backend/src/app.module.ts` | ThrottlerModule |
| `backend/src/modules/auth/auth.controller.ts` | rate limiting, forgot/reset password endpoints |
| `backend/src/modules/auth/auth.service.ts` | forgotPassword, resetPassword methods |
| `backend/src/modules/auth/dto/reset-password.dto.ts` | NEW - DTOs para reset password |
| `backend/src/modules/batches/batches.controller.ts` | SubscriptionGuard |
| `backend/src/modules/batches/batches.module.ts` | AuthModule import |
| `backend/src/modules/creatives/creatives.controller.ts` | SubscriptionGuard |
| `backend/src/modules/creatives/creatives.module.ts` | AuthModule import |
| `backend/src/modules/clients/clients.controller.ts` | SubscriptionGuard |
| `backend/src/modules/clients/clients.module.ts` | AuthModule import |
| `backend/src/modules/email/email.service.ts` | 5 novos métodos de email |
| `backend/src/modules/billing/billing.module.ts` | EmailModule import |
| `backend/src/modules/billing/billing.service.ts` | Email integration em webhooks |
| `backend/.env.example` | Updated with all vars |
| `frontend/src/lib/api.ts` | VITE_API_URL |
| `frontend/src/pages/LoginPage.tsx` | VITE_GOOGLE_CLIENT_ID, forgot password link |
| `frontend/src/pages/SignupPage.tsx` | VITE_GOOGLE_CLIENT_ID |
| `frontend/src/pages/ForgotPasswordPage.tsx` | NEW |
| `frontend/src/pages/ResetPasswordPage.tsx` | NEW |
| `frontend/src/App.tsx` | New routes |
| `frontend/.env.example` | NEW |
