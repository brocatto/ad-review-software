# Guia de Deploy - Ad Review Software

## 🚀 Preparação Concluída

O projeto está pronto para produção com as seguintes melhorias implementadas:

### ✅ Backend
- ✓ PostgreSQL (migrado de SQLite)
- ✓ Cloudinary para uploads (com fallback local)
- ✓ Security headers (Helmet)
- ✓ CORS configurável
- ✓ Rate limiting (100 req/min)
- ✓ Health check endpoint
- ✓ Docker support

### ✅ Frontend
- ✓ URLs configuráveis via .env
- ✓ Docker + Nginx
- ✓ SPA routing
- ✓ Asset caching

---

## 📋 Passo a Passo para Deploy

### 1. Push do Código (AÇÃO NECESSÁRIA)

O commit foi criado, mas o push falhou por falta de credenciais. Execute:

```bash
cd C:\Users\joao_\Desktop\coding\tinder-ad-software
git push origin master
```

### 2. Configurar Cloudinary

1. Acesse: https://cloudinary.com/users/register/free
2. Crie uma conta gratuita
3. No dashboard, copie:
   - Cloud Name
   - API Key
   - API Secret

### 3. Deploy Recomendado: Railway

#### Backend + Database

1. Acesse: https://railway.app
2. New Project → Deploy from GitHub
3. Selecione: `brocatto/ad-review-software`
4. Railway vai detectar automaticamente o Dockerfile

**Variáveis de Ambiente no Railway:**

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=[Railway vai gerar automaticamente ao adicionar PostgreSQL]
JWT_SECRET=[usar: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"]
JWT_EXPIRATION=7d
FRONTEND_URL=https://seu-dominio.vercel.app
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_ENABLED=true
CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=sua-api-key
CLOUDINARY_API_SECRET=seu-api-secret
```

5. Adicionar PostgreSQL:
   - Click em "New" → Database → PostgreSQL
   - Railway vai configurar DATABASE_URL automaticamente

6. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

7. Seed inicial:
   ```bash
   npm run db:seed
   ```
   - Email: admin@adverse.com
   - Senha: admin123

#### Frontend

1. Acesse: https://vercel.com
2. New Project → Import Git Repository
3. Selecione: `brocatto/ad-review-software`
4. Root Directory: `frontend`
5. Framework: Vite
6. Build Command: `npm run build`
7. Output Directory: `dist`

**Variáveis de Ambiente no Vercel:**

```env
VITE_API_URL=https://sua-api.railway.app
```

8. Deploy!

---

## 🐳 Alternativa: Deploy com Docker Compose

### Servidor Local/VPS

1. Instale Docker e Docker Compose
2. Clone o repositório
3. Crie `.env` na raiz:

```env
JWT_SECRET=gere-um-secret-forte-aqui
FRONTEND_URL=http://seu-dominio.com
SLACK_WEBHOOK_URL=sua-webhook-url
SLACK_ENABLED=true
CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=sua-api-key
CLOUDINARY_API_SECRET=seu-api-secret
```

4. Execute:

```bash
docker-compose up -d
```

5. Run migrations:

```bash
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run db:seed
```

6. Acesse:
   - Frontend: http://localhost
   - Backend: http://localhost:3000
   - Health: http://localhost:3000/health

---

## 🔐 Primeiro Acesso

Após deploy e seed:

**Admin Login:**
- URL: `https://seu-frontend.vercel.app/login`
- Email: `admin@adverse.com`
- Senha: `admin123`

**IMPORTANTE:** Altere a senha após primeiro login!

---

## 📊 Endpoints Úteis

- `GET /health` - Status da aplicação e DB
- `GET /` - Info da API
- `POST /auth/login` - Login
- `GET /batches` - Listar lotes

---

## ⚠️ Checklist Pré-Produção

- [ ] Push do código para GitHub
- [ ] Conta Cloudinary criada
- [ ] JWT_SECRET gerado (128 chars)
- [ ] Deploy backend no Railway
- [ ] PostgreSQL adicionado no Railway
- [ ] Migrations executadas
- [ ] Seed executado (admin criado)
- [ ] Deploy frontend no Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Teste de login
- [ ] Teste de upload de creative
- [ ] Teste de aprovação (link público)
- [ ] Notificação Slack funcionando

---

## 🆘 Troubleshooting

### Database Connection Failed
- Verifique DATABASE_URL no Railway
- Confirm que PostgreSQL addon está ativo

### CORS Error
- Adicione URL do frontend em FRONTEND_URL
- Verifique se frontend está usando VITE_API_URL correta

### Uploads Não Funcionam
- Confirme credenciais Cloudinary
- Teste health check endpoint

### Notificações Slack Não Chegam
- Teste webhook: `curl -X POST -H 'Content-type: application/json' --data '{"text":"teste"}' SLACK_WEBHOOK_URL`
- Verifique SLACK_ENABLED=true

---

## 📞 Próximos Passos

1. Faça o push: `git push origin master`
2. Configure Cloudinary
3. Deploy no Railway (backend)
4. Deploy no Vercel (frontend)
5. Teste com seu time!

---

## 💡 Custos Estimados (MVP/Teste)

- Railway (Backend + PostgreSQL): **GRÁTIS** ($5 crédito/mês)
- Vercel (Frontend): **GRÁTIS** (plan hobby)
- Cloudinary: **GRÁTIS** (25GB storage, 25GB bandwidth/mês)

**Total: $0/mês** para MVP com time pequeno 🎉

---

Gerado automaticamente por Claude Code
