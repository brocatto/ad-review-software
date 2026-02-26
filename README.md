# AdReviewOS

Plataforma de Aprovação de Criativos - Uma solução B2B para acelerar o fluxo de aprovação de criativos entre times de marketing e clientes.

## Stack

- **Backend:** Node.js + NestJS + Prisma + PostgreSQL
- **Frontend:** React + Vite + Tailwind CSS + Framer Motion

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

## Instalação

### 1. Clone e instale dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure o banco de dados

Crie um banco PostgreSQL:

```sql
CREATE DATABASE adreviewos;
```

### 3. Configure variáveis de ambiente

O arquivo `.env` já está configurado para desenvolvimento local. Ajuste se necessário:

```bash
# backend/.env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/adreviewos?schema=public"
```

### 4. Execute as migrações e seed

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

## Executando

### Terminal 1 - Backend (porta 3000)

```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend (porta 5173)

```bash
cd frontend
npm run dev
```

## Acesso

- **Painel Admin:** http://localhost:5173
- **Credenciais:** admin@adreviewos.com / admin123

## Fluxo de Uso

1. Faça login no painel admin
2. Crie um novo lote selecionando um cliente
3. Faça upload dos criativos (imagens/vídeos)
4. Copie o link gerado e envie ao cliente
5. O cliente acessa pelo celular e faz swipe para aprovar/reprovar
6. Acompanhe os feedbacks no painel admin

## Estrutura

```
├── backend/           # API NestJS
│   ├── src/
│   │   ├── modules/   # Módulos (auth, batches, creatives, etc.)
│   │   └── config/    # Configurações (Prisma, etc.)
│   └── prisma/        # Schema e migrations
├── frontend/          # React + Vite
│   └── src/
│       ├── pages/     # Páginas da aplicação
│       ├── components/# Componentes reutilizáveis
│       └── lib/       # API client e utilitários
└── docs/              # Documentação adicional
```

## Comandos Úteis

```bash
# Backend
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run db:studio    # Prisma Studio (visualizar DB)

# Frontend
npm run dev          # Desenvolvimento
npm run build        # Build produção
```
