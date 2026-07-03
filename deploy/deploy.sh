#!/usr/bin/env bash
# GANNDAL — déploiement one-shot sur VPS Ubuntu (full self-host).
# Usage:  sudo ./deploy.sh [domaine-ou-ip]
#   - avec domaine  : ./deploy.sh ganndal.media   (puis activer HTTPS, voir DEPLOY_VPS.md §7)
#   - sans argument : utilise l'IP publique en HTTP (test rapide)
set -euo pipefail

cd "$(dirname "$0")"

HOST="${1:-}"
if [ -z "$HOST" ]; then
  # Forcer l'IPv4 (sinon curl peut renvoyer l'IPv6, qui casse le CORS)
  HOST="$(curl -4 -s ifconfig.me || curl -4 -s ipinfo.io/ip)"
  SCHEME="http"
  echo "→ Aucun domaine fourni, utilisation de l'IP: $HOST (HTTP)"
else
  SCHEME="http"   # passer en https après certbot (voir DEPLOY_VPS.md)
  echo "→ Hôte: $HOST"
fi
BASE="$SCHEME://$HOST"

# --- 1. Docker (script officiel : inclut le plugin compose, contrairement au paquet Ubuntu) ---
if ! command -v docker >/dev/null 2>&1; then
  echo "→ Installation de Docker..."
  apt-get update -y && apt-get install -y curl git
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi
# Vérifie que le plugin compose est présent
if ! docker compose version >/dev/null 2>&1; then
  echo "→ Installation du plugin docker compose..."
  apt-get install -y docker-compose-plugin || true
fi

# --- 2. Génération du .env (idempotent : ne réécrit pas s'il existe) ---
if [ ! -f .env ]; then
  echo "→ Génération de deploy/.env (secrets aléatoires)..."
  PG_PW="$(openssl rand -hex 16)"
  MINIO_SECRET="$(openssl rand -hex 16)"
  JWT_A="$(openssl rand -hex 32)"
  JWT_R="$(openssl rand -hex 32)"

  cat > .env <<EOF
POSTGRES_USER=ganndal
POSTGRES_PASSWORD=$PG_PW
POSTGRES_DB=ganndal

NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://ganndal:$PG_PW@postgres:5432/ganndal?schema=public
DIRECT_URL=postgresql://ganndal:$PG_PW@postgres:5432/ganndal?schema=public

JWT_ACCESS_SECRET=$JWT_A
JWT_REFRESH_SECRET=$JWT_R
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

CORS_ORIGIN=$BASE

S3_ACCESS_KEY=ganndal-minio
S3_SECRET_KEY=$MINIO_SECRET
S3_BUCKET=ganndal
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_URL=$BASE/files/ganndal

PUBLIC_API_URL=/api

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM=GANNDAL <no-reply@$HOST>

WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
EOF
  echo "  .env créé. Secrets générés (sauvegarde-les si besoin)."
else
  echo "→ deploy/.env existe déjà, réutilisé."
fi

# --- 3. server_name nginx ---
sed -i "s/server_name .*/server_name $HOST;/" nginx.conf || true

# --- 4. Build + up ---
echo "→ Build et démarrage des conteneurs..."
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

# --- 5. Attente santé backend ---
echo "→ Attente du backend..."
for i in $(seq 1 30); do
  if curl -sf "http://localhost/api/health" >/dev/null 2>&1; then
    echo "  backend OK"; break
  fi
  sleep 3
done

# --- 6. Seed (si base vide) ---
echo "→ Seed initial..."
docker compose -f docker-compose.prod.yml exec -T backend npx -y tsx prisma/seed.ts || \
  echo "  (seed déjà appliqué ou à relancer manuellement)"

echo ""
echo "✅ GANNDAL déployé sur $BASE"
echo "   Health : $BASE/api/health"
echo "   Login  : admin@ganndal.media / Admin123!  (à changer !)"
echo ""
echo "HTTPS : configure un domaine puis suis docs/DEPLOY_VPS.md §7 (certbot)."
