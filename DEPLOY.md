# Guia de Deploy - AdReviewOS

## O que já está pronto

### Backend
- PostgreSQL via Prisma (migration única `20260809000000_init`)
- Uploads em disco (`UPLOAD_DIR`) com Cloudinary opcional; limite por arquivo configurável (`MAX_FILE_SIZE`, padrão 100MB)
- Helmet, CORS restrito a `FRONTEND_URL` em produção, rate limiting (300 req/min por IP; login 10/min)
- Validação de env no boot (`DATABASE_URL`, `JWT_SECRET` forte em produção)
- Health check em `GET /health`
- Dockerfile multi-stage (Node 20); `prisma migrate deploy` automático no `docker-compose`

### Frontend
- URL da API via `VITE_API_URL` (resolvida em build-time)
- Docker + Nginx com SPA routing; `vercel.json` com rewrite para `/approve/<token>` funcionar na Vercel

---

## Opção 1: Railway (backend + PostgreSQL) + Vercel (frontend)

### Backend no Railway
1. New Project → Deploy from GitHub → `brocatto/ad-review-software` (Root Directory: `backend`)
2. Adicione um PostgreSQL (New → Database → PostgreSQL); `DATABASE_URL` é preenchida automaticamente
3. Variáveis de ambiente:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=[node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"]
JWT_EXPIRATION=7d
FRONTEND_URL=https://seu-dominio.vercel.app
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_ENABLED=true
CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=sua-api-key
CLOUDINARY_API_SECRET=seu-api-secret
MAX_FILE_SIZE=104857600
SEED_ADMIN_EMAIL=seu-email@empresa.com
SEED_ADMIN_PASSWORD=[senha forte, mínimo 8 caracteres]
# SaaS (obrigatórias em produção, ver "Integrações SaaS" abaixo)
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
RESEND_API_KEY=re_xxx
EMAIL_FROM=AdReviewOS <noreply@seudominio.com>
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID_MONTHLY=price_xxx
TRIAL_PERIOD_DAYS=30
```

4. Start command: `npx prisma migrate deploy && node dist/main.js`
5. Seed inicial (uma vez, pelo shell do Railway): `npm run db:seed`

> Sem Cloudinary os uploads ficam no disco do container e somem a cada deploy. Em produção, configure o Cloudinary (plano gratuito: 25GB).

### Frontend na Vercel
1. New Project → Import `brocatto/ad-review-software`
2. Root Directory: `frontend` · Framework: Vite · Build: `npm run build` · Output: `dist`
3. Variáveis: `VITE_API_URL=https://sua-api.up.railway.app` e `VITE_GOOGLE_CLIENT_ID=<mesmo client id do backend>`
4. Aponte o domínio (ex.: `adreviewos.com`, hoje estacionado na Hostinger) para a Vercel em Settings → Domains e ajuste o DNS no registrador

---

## Integrações SaaS

### Google Sign-In
1. Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application)
2. Authorized JavaScript origins: a URL do frontend (ex.: `https://adreviewos.com`) e `http://localhost:5173` para dev
3. Coloque o Client ID em `GOOGLE_CLIENT_ID` (backend) e `VITE_GOOGLE_CLIENT_ID` (frontend)

### Resend (e-mails transacionais)
1. Verifique o domínio de envio no Resend (SPF/DKIM) e use-o em `EMAIL_FROM`
2. `RESEND_API_KEY` no backend. Sem a chave, o backend apenas loga os e-mails (útil em dev)

### Stripe (assinatura mensal)
1. Crie o produto/preço recorrente mensal e copie o id para `STRIPE_PRICE_ID_MONTHLY`
2. Developers → Webhooks → endpoint `https://sua-api/webhooks/stripe` com os eventos `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`; copie o signing secret para `STRIPE_WEBHOOK_SECRET`
3. Ative o Customer Portal em Settings → Billing → Customer portal
4. Em dev: `stripe listen --forward-to localhost:3000/webhooks/stripe`
5. Contas `ADMIN` e contas criadas pelo admin não passam pela cobrança; as demais têm `TRIAL_PERIOD_DAYS` de teste e depois precisam assinar

---

## Opção 2: Docker Compose (VPS)

1. Crie `.env` na raiz:

```env
JWT_SECRET=gere-um-secret-forte-aqui
POSTGRES_PASSWORD=senha-forte-do-banco
FRONTEND_URL=http://seu-dominio.com
VITE_API_URL=http://seu-dominio.com:3000
SLACK_WEBHOOK_URL=sua-webhook-url
SLACK_ENABLED=true
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MAX_FILE_SIZE=104857600
SEED_ADMIN_EMAIL=seu-email@empresa.com
SEED_ADMIN_PASSWORD=senha-forte-de-admin
```

2. `docker compose up -d --build`
3. As migrations rodam no start do backend. Seed do admin: `docker compose exec backend npm run db:seed`
4. Acesse: frontend em `http://localhost`, API em `http://localhost:3000`, health em `/health`

Sem Cloudinary, os uploads ficam no volume `uploads_data`.

---

## Primeiro acesso
- `https://seu-frontend/login` com `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
- Troque a senha em **Configurações** e cadastre o time (somente Admin cria usuários)

## Endpoints úteis
- `GET /health` · `GET /` · `POST /auth/login` · `GET /batches` · `GET /public/batch/:token`

## Checklist pré-produção
- [ ] `JWT_SECRET` gerado (>= 32 chars)
- [ ] PostgreSQL provisionado e `DATABASE_URL` configurada
- [ ] Cloudinary configurado
- [ ] Migrations executadas (`prisma migrate deploy`)
- [ ] Seed executado (admin criado) e senha trocada
- [ ] `FRONTEND_URL` (backend) e `VITE_API_URL` (frontend) apontando um para o outro
- [ ] Google Sign-In, Resend e Stripe configurados (webhook ativo e `STRIPE_WEBHOOK_SECRET` definido)
- [ ] Teste: login, criar lote, upload, link público, aprovação/reprovação, revisão, notificação Slack
- [ ] Teste SaaS: cadastro → e-mail de confirmação → login → checkout com cartão de teste → status Ativo em Faturamento

## Troubleshooting
- **Database Connection Failed**: confira `DATABASE_URL` e se o Postgres está no ar.
- **P3005 no migrate deploy (banco não vazio)**: banco criado por versão anterior (`prisma db push`). Marque a migration inicial como aplicada: `npx prisma migrate resolve --applied 20260809000000_init`.
- **CORS**: `FRONTEND_URL` deve ser exatamente a origem do frontend (com https, sem barra final).
- **Upload falha com 413/400**: arquivo acima de `MAX_FILE_SIZE` ou tipo não permitido (só imagem/vídeo).
- **Slack não chega**: teste o webhook com `curl -X POST -H 'Content-type: application/json' --data '{"text":"teste"}' $SLACK_WEBHOOK_URL` e confira `SLACK_ENABLED=true`.

## Custos estimados (MVP)
- Railway (backend + PostgreSQL): grátis ($5 crédito/mês) · Vercel (hobby): grátis · Cloudinary: grátis (25GB)
