# Roteiro de lançamento — AdReviewOS

Estado em 2026-11-02. O que já está feito está marcado; o restante são os poucos passos que exigem
contas e cadastros em nome da empresa. Ordem recomendada: Stripe → Cloudinary → Railway → DNS → testes.

## Já feito

- [x] Código de produção: ownership, validação, rate limit, Helmet, CORS, tokens com hash, Sentry opcional, job de fim de trial, ErrorBoundary, páginas de Termos e Privacidade, SEO/OG, 66 testes e CI verde.
- [x] **Frontend publicado na Vercel** (projeto `adreviewos`, time `brocattos-projects`), produção em `https://adreviewos.vercel.app`, com `VITE_API_URL=https://api.adreviewos.com` e `VITE_GOOGLE_CLIENT_ID` já configurados para Production e Preview.
- [x] Domínios `adreviewos.com` e `www.adreviewos.com` já adicionados ao projeto da Vercel (faltam só os registros DNS, abaixo).
- [x] Stripe modo teste: produto, preço R$ 99/mês, webhook e portal configurados pelo script. Resend: domínio `news.adreviewos.com` verificado.
- [x] Scripts prontos: `backend/scripts/stripe-setup.mjs`, `scripts/railway-env.sh`, `scripts/smoke-api.mjs`, template `backend/.env.production.example`.

## 1. Stripe (modo live) — ~15 min

1. Dashboard do Stripe → ativar a conta (dados da empresa, representante, conta bancária). A conta `acct_1StJbb…` já existe no Brasil com o nome "AdReview OS".
2. Developers → API keys (modo live) → copie a `sk_live_…`.
3. Na sua máquina, dentro de `backend/`:
   ```bash
   STRIPE_SECRET_KEY=sk_live_... API_URL=https://api.adreviewos.com node scripts/stripe-setup.mjs
   ```
   O script cria produto, preço mensal (R$ 99, mude com `PRICE_BRL_CENTS`), webhook `https://api.adreviewos.com/webhooks/stripe` e o portal do cliente, e imprime `STRIPE_PRICE_ID_MONTHLY` e `STRIPE_WEBHOOK_SECRET` para o `.env.production`.
4. Opcional: em Settings → Payment methods, ative Pix para o checkout em BRL.

## 2. Cloudinary — ~5 min

1. Conta gratuita em cloudinary.com (25 GB).
2. Dashboard → copie Cloud name, API key e API secret para `CLOUDINARY_*` no `.env.production`.
   Sem isso os uploads ficam no disco do container e somem a cada deploy.

## 3. Google Sign-In — ~3 min

Google Cloud Console → APIs & Services → Credentials → o client `1013369614849-…`:
- Authorized JavaScript origins: `https://adreviewos.com`, `https://www.adreviewos.com`, `https://adreviewos.vercel.app` (e `http://localhost:5173` para dev).
- OAuth consent screen → Publishing status **In production** (escopos básicos não exigem verificação).

## 4. Backend + banco no Railway — ~15 min

```bash
npm i -g @railway/cli
railway login
cd backend
railway init            # novo projeto "adreviewos" (ou railway link se já existir)
railway add --database postgres
cp .env.production.example .env.production   # preencha: JWT_SECRET, SEED_ADMIN_PASSWORD, Cloudinary, Stripe live, Resend, Google
../scripts/railway-env.sh .env.production
railway up              # usa backend/railway.json: Dockerfile, migrate deploy no start, healthcheck /health
railway domain          # gere o domínio *.up.railway.app e depois adicione api.adreviewos.com em Settings → Networking
railway run npm run db:seed   # cria o admin (uma vez)
```

Gere o `JWT_SECRET` com `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`.
`DATABASE_URL` é injetada pelo Railway ao vincular o Postgres. Ative o backup do banco em Settings do Postgres.

## 5. DNS na Hostinger — ~5 min

No painel da Hostinger (DNS do domínio `adreviewos.com`, hoje nos nameservers `dns-parking.com`):

| Tipo  | Nome | Valor                         | Para quê            |
|-------|------|-------------------------------|---------------------|
| A     | @    | `76.76.21.21`                 | Vercel (landing/app) |
| CNAME | www  | `cname.vercel-dns.com`        | Vercel               |
| CNAME | api  | `<seu-servico>.up.railway.app` | Railway (API)        |

Mantenha os registros do Resend (`news.adreviewos.com`) como estão. A Vercel valida sozinha e emite o certificado; confira com `vercel domains inspect adreviewos.com`.

Se preferir, troque os nameservers para `ns1.vercel-dns.com` / `ns2.vercel-dns.com` e gerencie tudo na Vercel, mas aí os registros do Resend precisam ser recriados lá.

## 6. Depois do deploy — ~10 min

1. `curl https://api.adreviewos.com/health` → `database: connected`.
2. `SMOKE_PASSWORD=<senha do admin> node scripts/smoke-api.mjs https://api.adreviewos.com`
3. Fluxo real: cadastro em `https://adreviewos.com/signup` → e-mail de confirmação → login → Faturamento → checkout com cartão de teste do Stripe (em live use um cartão real e cancele pelo portal) → e-mail de confirmação de pagamento.
4. Stripe → Developers → Webhooks: o endpoint deve mostrar entregas com 200.
5. Opcional: crie projetos no sentry.io e preencha `SENTRY_DSN` (Railway) e `VITE_SENTRY_DSN` (Vercel → Settings → Environment Variables → redeploy).
6. Revise os textos legais em `frontend/src/pages/legal` e os dados em `frontend/src/lib/legal.ts` (razão social, CNPJ, e-mail de contato `contato@adreviewos.com`).

## Deploys futuros

- Frontend: `cd frontend && vercel deploy --prod` ou conecte o repositório GitHub ao projeto `adreviewos` (Root Directory `frontend`) para deploy automático a cada push em `aios-version`.
- Backend: `cd backend && railway up` ou conecte o repositório no Railway (Root Directory `backend`).
- Ambos os provedores aplicam as variáveis já salvas; migrations rodam no start do backend.
