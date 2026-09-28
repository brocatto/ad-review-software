# Guia de Deploy - Ad Review Software

Recomendado: **backend + PostgreSQL no Railway**, **frontend no Vercel**, **arquivos no Cloudinary**.

## Antes de começar

- **Cloudinary é obrigatório no Railway.** O disco do container é apagado a cada deploy, então uploads locais se perdem. Crie uma conta gratuita em https://cloudinary.com e anote Cloud Name, API Key e API Secret.
- Gere um `JWT_SECRET` forte (o backend não sobe em produção com menos de 32 caracteres):
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- Escolha a senha do primeiro admin (`ADMIN_PASSWORD`, mínimo 8 caracteres).

---

## 1. Backend + banco (Railway)

1. https://railway.app → New Project → Deploy from GitHub → `brocatto/ad-review-software`.
2. Em Settings do serviço, defina **Root Directory = `backend`** (o Railway usa o `Dockerfile`).
3. New → Database → PostgreSQL. O Railway preenche `DATABASE_URL`.
4. Variáveis de ambiente do serviço:

```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<valor gerado acima>
JWT_EXPIRATION=7d
FRONTEND_URL=https://seu-app.vercel.app
TRUST_PROXY=1
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_ENABLED=true
ADMIN_EMAIL=voce@suaempresa.com
ADMIN_PASSWORD=<senha forte>
```

`TRUST_PROXY=1` faz o limite de requisições usar o IP real de cada usuário (sem ele, todos compartilham o IP do proxy do Railway).

5. Deploy. **As migrations rodam sozinhas** a cada start (`prisma migrate deploy` no `CMD` do Dockerfile).
6. Crie o admin uma única vez (Railway → serviço → ⋯ → Run command, ou `railway run`):
   ```bash
   npm run db:seed:prod
   ```
   O seed nunca sobrescreve um usuário existente. Depois do primeiro login, a senha pode ser trocada em **Configurações**.

7. Confira: `GET https://sua-api.railway.app/health` deve responder com o banco conectado.

## 2. Frontend (Vercel)

1. https://vercel.com → New Project → importe o repositório.
2. **Root Directory = `frontend`**, Framework = Vite (build `npm run build`, output `dist`).
3. Variável de ambiente (usada no build, então redeploy após mudar):
   ```env
   VITE_API_URL=https://sua-api.railway.app
   ```
4. Deploy. O `frontend/vercel.json` já redireciona todas as rotas para o SPA, então os links `/approve/<token>` abertos direto pelo cliente funcionam.
5. Volte no Railway e confira se `FRONTEND_URL` é exatamente a URL do Vercel (CORS e links do Slack dependem dela).

---

## Alternativa: Docker Compose (VPS)

Crie `.env` na raiz:

```env
JWT_SECRET=<64+ caracteres aleatórios>
ADMIN_PASSWORD=<senha forte>
FRONTEND_URL=http://seu-dominio.com
VITE_API_URL=http://seu-dominio.com:3000
SLACK_WEBHOOK_URL=
SLACK_ENABLED=false
# Opcional: sem Cloudinary, os uploads ficam no volume `uploads`
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

```bash
docker compose up -d --build
docker compose exec backend npm run db:seed:prod
```

- Frontend: http://localhost · Backend: http://localhost:3000 · Health: http://localhost:3000/health
- Se colocar um proxy reverso (nginx, Caddy) na frente do backend, adicione `TRUST_PROXY=1` ao serviço `backend`.

---

## Checklist pré-produção

- [ ] Cloudinary configurado (obrigatório no Railway)
- [ ] `JWT_SECRET` forte, `ADMIN_PASSWORD` definido
- [ ] `FRONTEND_URL` (backend) e `VITE_API_URL` (frontend) apontando um para o outro
- [ ] `TRUST_PROXY=1` no Railway
- [ ] `npm run db:seed:prod` executado uma vez
- [ ] Login, upload, link público no celular (aprovar e reprovar), revisão e notificação no Slack testados

## Troubleshooting

- **Backend não sobe com "JWT_SECRET must be set..."**: o segredo está vazio, curto ou é o valor de exemplo.
- **CORS error**: `FRONTEND_URL` precisa ser exatamente a origem do frontend (com `https://`, sem barra no final).
- **Imagens quebradas**: sem Cloudinary no Railway, os arquivos somem no próximo deploy. Configure o Cloudinary e reenvie.
- **"Too Many Requests" para vários usuários ao mesmo tempo**: falta `TRUST_PROXY=1`.
- **Slack**: teste o webhook com `curl -X POST -H 'Content-type: application/json' --data '{"text":"teste"}' $SLACK_WEBHOOK_URL` e confira `SLACK_ENABLED=true`.

## Limites

- Uploads: até 50 arquivos por envio e 100MB por arquivo (`MAX_FILE_SIZE`). O plano gratuito do Cloudinary aceita imagens de até 10MB e vídeos de até 100MB.
- Rate limit: 300 req/min por IP; login e troca de senha, 10 req/min.
