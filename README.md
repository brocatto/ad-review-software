# AdReviewOS

Plataforma de Aprovação de Criativos - Uma solução B2B para acelerar o fluxo de aprovação de criativos entre times de marketing e clientes.

O time interno cria um lote de criativos e envia um link único ao cliente, que aprova ou reprova cada peça com swipe no celular. Todo o fluxo fica registrado no painel interno.

## Stack

- **Backend:** Node.js + NestJS + Prisma + PostgreSQL (`backend/`)
- **Frontend:** React + Vite + Tailwind CSS + Framer Motion (`frontend/`)
- **Infra local:** Docker Compose (PostgreSQL) · Produção: Railway/Vercel ou Docker (ver `DEPLOY.md`)

## Pré-requisitos

- Node.js 20+
- Docker Desktop (para o PostgreSQL local) ou um PostgreSQL 14+ próprio

## Instalação

### 1. Banco de dados

```bash
docker compose up -d postgres   # cria o banco "ad_review" em localhost:5432 (postgres/postgres)
```

### 2. Backend

```bash
cd backend
cp .env.example .env            # ajuste DATABASE_URL se não usar o Docker acima
npm install
npm run db:migrate              # aplica as migrations (prisma migrate dev)
SEED_ADMIN_PASSWORD=uma-senha-forte npm run db:seed   # cria o admin (admin@adverse.com por padrão)
npm run dev                     # http://localhost:3000
```

No Windows (PowerShell): `$env:SEED_ADMIN_PASSWORD="uma-senha-forte"; npm run db:seed`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env            # VITE_API_URL=http://localhost:3000
npm install
npm run dev                     # http://localhost:5173
```

## Acesso

- **Painel Admin:** http://localhost:5173/login — e-mail `SEED_ADMIN_EMAIL` e senha `SEED_ADMIN_PASSWORD` usados no seed (não existe senha padrão).
- **Cliente:** link `http://localhost:5173/approve/<token>` gerado em cada lote (sem login).
- **Cadastro self-service:** http://localhost:5173/signup, a partir da landing page em `/`. Novas contas ganham 30 dias de teste e precisam confirmar o e-mail.

## Fluxo de Uso

1. Faça login no painel admin
2. Crie um novo lote selecionando (ou cadastrando) um cliente
3. Faça upload dos criativos (imagens/vídeos, até 100MB cada) e renomeie se quiser
4. Envie o link ao cliente por WhatsApp, e-mail ou copiando manualmente
5. O cliente acessa pelo celular e faz swipe para aprovar/reprovar (com feedback na reprovação)
6. Acompanhe feedbacks, status interno dos ajustes e a linha do tempo no painel; reenvie revisões dos reprovados

## SaaS: cadastro, teste grátis e assinatura

- A landing page (`/`) leva para `/signup`. O cadastro, por e-mail/senha ou Google, cria a conta com `TRIAL_PERIOD_DAYS` dias de teste e exige confirmação do e-mail antes do primeiro login. Há também "esqueci minha senha" com link por e-mail.
- Terminado o teste sem assinatura, a API responde `403 SUBSCRIPTION_REQUIRED` nas rotas do painel e o frontend leva o usuário para **Faturamento**, onde o Stripe Checkout cria a assinatura mensal. O webhook `POST /webhooks/stripe` mantém o status sincronizado e o Customer Portal cuida de cartão e cancelamento.
- O admin da plataforma (`role ADMIN`) e as contas criadas por ele em Configurações nunca são cobrados.
- Sem `RESEND_API_KEY`, os e-mails (confirmação, boas-vindas, redefinição de senha, cobrança) são apenas logados no console do backend, com os links. Sem chaves do Stripe, a página de Faturamento informa que a cobrança não está configurada. Sem `GOOGLE_CLIENT_ID`, o botão do Google não aparece.
- Para testar webhooks localmente: `stripe listen --forward-to localhost:3000/webhooks/stripe` e copie o `whsec_` para `STRIPE_WEBHOOK_SECRET`.
- Termos de Uso em `/termos` e Política de Privacidade em `/privacidade` (textos em `frontend/src/pages/legal`, dados da empresa em `frontend/src/lib/legal.ts`).
- Monitoramento opcional com Sentry (`SENTRY_DSN` no backend, `VITE_SENTRY_DSN` no frontend). Scripts de operação em `scripts/` e o roteiro de lançamento em `docs/launch-checklist.md`.

## Estrutura

```
├── backend/           # API NestJS
│   ├── src/
│   │   ├── modules/   # auth, users, clients, batches, creatives, approvals, activity-log, notifications
│   │   └── config/    # Prisma, storage (Cloudinary/disco local), validação de env
│   └── prisma/        # Schema, migrations e seed
├── frontend/          # React + Vite
│   └── src/
│       ├── pages/     # Landing, Login, Cadastro, Confirmação/Redefinição, Dashboard, Lotes, Criar Lote, Detalhe, Histórico, Faturamento, Configurações, Aprovação (cliente)
│       ├── components/
│       └── lib/       # API client, descrições do log de atividades
├── docker-compose.yml # postgres + backend + frontend (produção em container)
├── DEPLOY.md          # Guia de deploy
└── descricao_app.md   # Especificação do produto (fonte da verdade)
```

## Comandos Úteis

```bash
# Backend
npm run dev          # Desenvolvimento (watch)
npm run build        # Build produção
npm test             # Testes unitários (jest)
npm run lint         # ESLint
npm run db:studio    # Prisma Studio (visualizar DB)
npm run db:migrate:create -- --name nome   # Nova migration após editar schema.prisma

# Frontend
npm run dev          # Desenvolvimento
npm run build        # Typecheck + build produção
npm run lint         # ESLint (warnings falham)
```

## Variáveis de ambiente principais (backend)

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Conexão PostgreSQL |
| `JWT_SECRET` | Segredo do JWT (obrigatório; mínimo 32 chars em produção) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Admin criado pelo `db:seed` |
| `MAX_FILE_SIZE` | Limite por arquivo em bytes (padrão 100MB) |
| `UPLOAD_DIR` | Pasta dos uploads locais (padrão `./uploads`) |
| `CLOUDINARY_*` | Se definidos, uploads vão para o Cloudinary |
| `SLACK_WEBHOOK_URL` / `SLACK_ENABLED` | Notificações de lote enviado/concluído |
| `FRONTEND_URL` | Origem permitida no CORS, base dos links em e-mails/notificações e redirects do Stripe |
| `GOOGLE_CLIENT_ID` | Login com Google (o mesmo valor vai em `VITE_GOOGLE_CLIENT_ID` no frontend) |
| `RESEND_API_KEY` / `EMAIL_FROM` | E-mails transacionais via Resend (remetente precisa de domínio verificado) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_ID_MONTHLY` | Assinatura mensal via Stripe |
| `TRIAL_PERIOD_DAYS` | Dias de teste concedidos no cadastro (padrão 30) |
