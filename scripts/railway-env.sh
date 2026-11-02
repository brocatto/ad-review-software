#!/usr/bin/env bash
# Pushes every KEY=VALUE line of an env file to the linked Railway service.
#   1. npm i -g @railway/cli && railway login && (cd backend && railway init|link)
#   2. cp backend/.env.production.example backend/.env.production  # fill the values
#   3. scripts/railway-env.sh backend/.env.production
set -euo pipefail

FILE="${1:-backend/.env.production}"
if [ ! -f "$FILE" ]; then
  echo "env file not found: $FILE" >&2
  exit 1
fi
if ! command -v railway >/dev/null 2>&1; then
  echo "railway CLI not installed: npm i -g @railway/cli" >&2
  exit 1
fi

args=()
while IFS= read -r line || [ -n "$line" ]; do
  line="${line%$'\r'}"
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  value="${value%\"}"; value="${value#\"}"
  [ -z "$value" ] && { echo "skipping empty $key"; continue; }
  args+=(--set "$key=$value")
done < "$FILE"

(cd "$(dirname "$FILE")" && railway variables "${args[@]}")
echo "done: $(( ${#args[@]} / 2 )) variables set"
