# Scripts operacionais

| Script | Para quê | Como rodar |
|--------|----------|------------|
| `smoke-api.mjs` | Testa o fluxo interno de ponta a ponta contra uma API (login, lote, upload, link público, aprovação, revisão, histórico, exclusão). Cria e apaga os próprios dados. | `SMOKE_PASSWORD=<senha do admin> node scripts/smoke-api.mjs https://api.adreviewos.com` |
| `smoke-saas.mjs` | Testa cadastro, confirmação, trial, bloqueio, checkout, redefinição de senha. Lê tokens direto do Postgres do docker-compose, por isso é só para ambiente local. | `SMOKE_PASSWORD=<senha do admin> node scripts/smoke-saas.mjs http://localhost:3001` |
| `../backend/scripts/stripe-setup.mjs` | Cria/atualiza produto, preço mensal, webhook e portal no Stripe (teste ou live, conforme a chave). Idempotente. | `cd backend && STRIPE_SECRET_KEY=sk_live_... API_URL=https://api.adreviewos.com node scripts/stripe-setup.mjs` |
| `railway-setup.sh` | Deploy completo do backend no Railway após o `railway login`: projeto, Postgres, serviço, variáveis, deploy e domínios. Idempotente. | `scripts/railway-setup.sh backend/.env.production` |
| `railway-env.sh` | Só reenvia um arquivo `.env` para o serviço do Railway já linkado. | `scripts/railway-env.sh backend/.env.production` |

Depois de cada deploy: `smoke-api.mjs` contra a URL de produção com a senha do admin. Em produção os e-mails do fluxo SaaS são reais, então o `smoke-saas.mjs` fica restrito ao ambiente local.
