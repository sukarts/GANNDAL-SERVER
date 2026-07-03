#!/usr/bin/env bash
# GANNDAL — active HTTPS (Let's Encrypt) + firewall + renouvellement auto.
# À lancer sur le VPS APRÈS que le domaine pointe vers l'IP.
# Usage:  ./deploy-https.sh serveur.ganndal.media
set -euo pipefail
cd "$(dirname "$0")"

DOMAIN="${1:?Usage: ./deploy-https.sh <domaine>}"
IP="$(curl -4 -s ifconfig.me || true)"

# 1. Vérifie que le domaine pointe vers ce serveur
RES="$(getent hosts "$DOMAIN" | awk '{print $1}' | head -1 || true)"
if [ -n "$IP" ] && [ "$RES" != "$IP" ]; then
  echo "⚠ $DOMAIN résout vers '${RES:-rien}', pas vers $IP."
  echo "  Corrige le DNS (A record) et attends la propagation avant HTTPS."
  exit 1
fi
echo "→ DNS OK: $DOMAIN → $IP"

# 2. .env en HTTPS
sed -i "s#^CORS_ORIGIN=.*#CORS_ORIGIN=https://$DOMAIN#" .env
sed -i "s#^S3_PUBLIC_URL=.*#S3_PUBLIC_URL=https://$DOMAIN/files/ganndal#" .env

# 3. Certificat Let's Encrypt (nginx arrêté pour libérer le port 80)
command -v certbot >/dev/null 2>&1 || { apt-get update -y && apt-get install -y certbot; }
docker compose -f docker-compose.prod.yml stop nginx
certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN"
mkdir -p certs
cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" certs/
cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem"  certs/

# 4. Conf nginx HTTPS (redirection 80→443)
cat > nginx.conf <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}
server {
    listen 443 ssl;
    http2 on;
    server_name $DOMAIN;
    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    client_max_body_size 2048M;
    location /api/ {
        proxy_pass http://backend:4000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    location /files/ { proxy_pass http://minio:9000/; proxy_set_header Host \$host; }
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

# 5. Recrée backend (nouveau CORS/S3) puis nginx (résout la nouvelle IP backend)
docker compose -f docker-compose.prod.yml up -d --force-recreate backend
docker compose -f docker-compose.prod.yml up -d --force-recreate nginx

# 6. Pare-feu
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH >/dev/null 2>&1 || true
  ufw allow 80/tcp  >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
  ufw --force enable >/dev/null 2>&1 || true
  echo "→ Pare-feu ufw actif (22/80/443)"
fi

# 7. Renouvellement SSL automatique (hebdo)
DIR="$(pwd)"
CRON="0 3 * * 1 certbot renew --quiet --deploy-hook 'cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/letsencrypt/live/$DOMAIN/privkey.pem $DIR/certs/ && docker compose -f $DIR/docker-compose.prod.yml restart nginx'"
( crontab -l 2>/dev/null | grep -v 'certbot renew' ; echo "$CRON" ) | crontab -
echo "→ Renouvellement SSL auto configuré (cron lundi 03:00)"

echo ""
echo "✅ HTTPS actif : https://$DOMAIN"
