#!/usr/bin/env bash
# One-shot backend deployment on Railway (project + Postgres + API service + variables + deploy + domains).
# The only manual step is the login, which needs a browser:
#   railway login
#   cp backend/.env.production.example backend/.env.production   # fill the values
#   scripts/railway-setup.sh backend/.env.production
# Re-running is safe: existing project/services are reused.
set -euo pipefail

ENV_FILE="${1:-backend/.env.production}"
PROJECT="${RAILWAY_PROJECT:-adreviewos}"
SERVICE="${RAILWAY_SERVICE:-api}"
API_DOMAIN="${API_DOMAIN:-api.adreviewos.com}"

[ -f "$ENV_FILE" ] || { echo "env file not found: $ENV_FILE (copy backend/.env.production.example and fill it)" >&2; exit 1; }
command -v railway >/dev/null 2>&1 || { echo "railway CLI missing: npm i -g @railway/cli" >&2; exit 1; }
railway whoami >/dev/null 2>&1 || { echo "not logged in: run 'railway login' first" >&2; exit 1; }

ENV_FILE="$(cd "$(dirname "$ENV_FILE")" && pwd)/$(basename "$ENV_FILE")"
cd "$(dirname "$0")/../backend"

echo "==> project"
railway status >/dev/null 2>&1 || railway init --name "$PROJECT"

echo "==> postgres + api service (errors here usually mean they already exist)"
railway add --database postgres || true
railway add --service "$SERVICE" || true
railway service "$SERVICE"

echo "==> variables from $ENV_FILE"
args=()
while IFS= read -r line || [ -n "$line" ]; do
  line="${line%$'\r'}"
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  key="${line%%=*}"; value="${line#*=}"
  value="${value%\"}"; value="${value#\"}"
  [ -z "$value" ] && { echo "   skipping empty $key"; continue; }
  args+=(--set "$key=$value")
done < "$ENV_FILE"
# The database URL comes from the Postgres service through a variable reference
args+=(--set 'DATABASE_URL=${{Postgres.DATABASE_URL}}')
railway variables "${args[@]}" --skip-deploys

echo "==> deploy (Dockerfile + railway.json: migrate deploy on start, healthcheck /health)"
railway up --detach

echo "==> domains"
railway domain || true                 # Railway-provided *.up.railway.app
railway domain "$API_DOMAIN" || true   # custom domain: prints the CNAME to create at the DNS provider

cat <<EOF

Próximos passos:
  1. Acompanhe o deploy:      railway logs
  2. Crie o admin (uma vez):  railway ssh -- node prisma/seed.js
  3. DNS: CNAME ${API_DOMAIN#*.}  ->  valor mostrado acima por 'railway domain'
  4. Teste:                   curl https://$API_DOMAIN/health
EOF
