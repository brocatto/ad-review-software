# Roteiro de lançamento — AdReviewOS

Estado em 2026-11-02. O que já está feito está marcado; o restante são os poucos passos que exigem
contas e cadastros em nome da empresa. Ordem recomendada: Stripe → Cloudinary → Railway → DNS → testes.

## Já feito

- [x] Código de produção: ownership, validação, rate limit, Helmet, CORS, tokens com hash, Sentry opcional, job de fim de trial, ErrorBoundary, páginas de Termos e Privacidade, SEO/OG, 66 testes e CI verde.
- [x] **Frontend publicado na Vercel** (projeto `adreviewos`, time `brocattos-projects`), produção em `https://adreviewos.vercel.app`, com `VITE_API_URL=https://api.adreviewos.com` e `VITE_GOOGLE_CLIENT_ID` já configurados para Production e Preview.
- [x] Domínios `adreviewos.com` e `www.adreviewos.com` já adicionados ao projeto da Vercel (faltam só os registros DNS, abaixo).
- [x] Stripe modo teste: produto, preço R$ 99/mês, webhook e portal configurados pelo script. Resend: domínio `news.adreviewos.com` verificado.
- [x] Scripts prontos: `backend/scripts/stripe-setup.mjs`, `scripts/railway-setup.sh`, `scripts/smoke-api.mjs`, template `backend/.env.production.example`.
- [x] **Armazenamento de arquivos resolvido:** store Vercel Blob `adreviewos-uploads` criado e testado (upload, leitura pública e exclusão). Cloudinary virou opcional.
- [x] `backend/.env.production` pré-preenchido nesta máquina; a senha do admin de produção está nele (`SEED_ADMIN_PASSWORD`).

## 1. Stripe (modo live) — ~15 min

1. Dashboard do Stripe → ativar a conta (dados da empresa, representante, conta bancária). A conta `acct_1StJbb…` já existe no Brasil com o nome "AdReview OS".
2. Developers → API keys (modo live) → copie a `sk_live_…`.
3. Na sua máquina, dentro de `backend/`:
   ```bash
   STRIPE_SECRET_KEY=sk_live_... API_URL=https://api.adreviewos.com node scripts/stripe-setup.mjs
   ```
   O script cria produto, preço mensal (R$ 99, mude com `PRICE_BRL_CENTS`), webhook `https://api.adreviewos.com/webhooks/stripe` e o portal do cliente, e imprime `STRIPE_PRICE_ID_MONTHLY` e `STRIPE_WEBHOOK_SECRET` para o `.env.production`.
4. Opcional: em Settings → Payment methods, ative Pix para o checkout em BRL.

## 2. Arquivos dos criativos — já resolvido

O store **Vercel Blob** `adreviewos-uploads` (acesso público) já foi criado na sua conta e o backend já sabe usá-lo: basta `BLOB_READ_WRITE_TOKEN` no `.env.production` (já pré-preenchido em `backend/.env.production` nesta máquina; se precisar de novo, Vercel → Storage → adreviewos-uploads → token, ou `cd frontend && vercel env pull`).
Cloudinary continua opcional: se um dia preencher `CLOUDINARY_*`, ele passa a ter prioridade. Fique de olho na cota do Blob no plano Hobby; para vídeos pesados em volume, Cloudinary (25 GB grátis) ou um upgrade na Vercel.

## 3. Google Sign-In — ~3 min

Google Cloud Console → APIs & Services → Credentials → o client `1013369614849-…`:
- Authorized JavaScript origins: `https://adreviewos.com`, `https://www.adreviewos.com`, `https://adreviewos.vercel.app` (e `http://localhost:5173` para dev).
- OAuth consent screen → Publishing status **In production** (escopos básicos não exigem verificação).

## 4. Backend + banco no Railway — ~15 min

O CLI do Railway (5.71) já está instalado nesta máquina. Só o login precisa de navegador; o resto é um script.

`backend/.env.production` já existe nesta máquina (ignorado pelo git), pré-preenchido com JWT_SECRET novo, senha do admin, Blob, Google, Resend, Slack e FRONTEND_URL. Só faltam as três variáveis do Stripe live (saída do passo 1) e, se quiser, `SENTRY_DSN`.

```bash
railway login                                            # abre o navegador
# edite backend/.env.production: cole STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID_MONTHLY
scripts/railway-setup.sh backend/.env.production         # projeto + Postgres + serviço api + variáveis + deploy + domínios
railway logs                                             # acompanhe até "Nest application successfully started"
cd backend && railway ssh -- node prisma/seed.js         # cria o admin (uma vez)
```

O script cria o projeto `adreviewos`, o Postgres, o serviço `api`, envia todas as variáveis, referencia `DATABASE_URL` ao Postgres, faz o deploy usando `backend/railway.json` e gera o domínio `*.up.railway.app` mais o custom `api.adreviewos.com` (ele imprime o CNAME para o passo 5).
Gere o `JWT_SECRET` com `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`. Ative o backup do banco em Settings do Postgres.

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
