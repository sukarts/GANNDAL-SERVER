# Plan de déploiement — Ubuntu 22.04 LTS

Deux options : **(A)** tout-en-un via Docker Compose (recommandé), **(B)** déploiement natif systemd.

---

## A. Déploiement Docker (recommandé)

### 1. Préparer le serveur
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin git ufw
sudo systemctl enable --now docker
sudo usermod -aG docker $USER   # reconnexion requise
```

### 2. Pare-feu
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. Récupérer le code
```bash
git clone <repo> /opt/ganndal && cd /opt/ganndal/deploy
```

### 4. Configurer les secrets
Créer `deploy/.env` :
```env
POSTGRES_USER=ganndal
POSTGRES_PASSWORD=<motdepasse-fort>
POSTGRES_DB=ganndal
DATABASE_URL=postgresql://ganndal:<motdepasse-fort>@postgres:5432/ganndal?schema=public
JWT_ACCESS_SECRET=<aléatoire-64>
JWT_REFRESH_SECRET=<aléatoire-64>
S3_ENDPOINT=http://minio:9000
S3_BUCKET=ganndal
S3_ACCESS_KEY=<clé>
S3_SECRET_KEY=<secret>
S3_PUBLIC_URL=https://ganndal.media/files
CORS_ORIGIN=https://ganndal.media
PUBLIC_API_URL=https://ganndal.media/api
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
```
Générer un secret : `openssl rand -hex 32`.

### 5. Lancer
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
# Les migrations Prisma s'exécutent au démarrage du backend (migrate deploy)
docker compose -f docker-compose.prod.yml exec backend npx tsx prisma/seed.ts  # optionnel
```

### 6. HTTPS (Let's Encrypt)
```bash
sudo apt install -y certbot
sudo certbot certonly --standalone -d ganndal.media -d www.ganndal.media
sudo cp /etc/letsencrypt/live/ganndal.media/fullchain.pem deploy/certs/
sudo cp /etc/letsencrypt/live/ganndal.media/privkey.pem  deploy/certs/
# décommenter le bloc 443 dans deploy/nginx.conf puis redémarrer nginx
docker compose -f docker-compose.prod.yml restart nginx
```
Renouvellement auto : `crontab -e` →
```
0 3 * * * certbot renew --quiet && docker compose -f /opt/ganndal/deploy/docker-compose.prod.yml restart nginx
```

---

## B. Déploiement natif (systemd)

### 1. Dépendances
```bash
sudo apt install -y nodejs npm postgresql nginx
# (Node 20 via NodeSource recommandé)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. PostgreSQL
```bash
sudo -u postgres psql -c "CREATE USER ganndal WITH PASSWORD 'xxx';"
sudo -u postgres psql -c "CREATE DATABASE ganndal OWNER ganndal;"
```

### 3. Stockage S3
- MinIO (auto-hébergé) **ou** un fournisseur S3 (AWS, Scaleway, Wasabi). Renseigner les variables `S3_*`.

### 4. Backend
```bash
cd /opt/ganndal/backend
npm ci
npx prisma migrate deploy
npm run build
npm run seed   # première fois
```

`/etc/systemd/system/ganndal-api.service` :
```ini
[Unit]
Description=GANNDAL API
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/ganndal/backend
EnvironmentFile=/opt/ganndal/backend/.env
ExecStart=/usr/bin/node dist/server.js
Restart=always
User=ganndal

[Install]
WantedBy=multi-user.target
```

### 5. Frontend
```bash
cd /opt/ganndal/frontend
npm ci && npm run build
```
`/etc/systemd/system/ganndal-web.service` :
```ini
[Unit]
Description=GANNDAL Web
After=network.target

[Service]
WorkingDirectory=/opt/ganndal/frontend
Environment=NEXT_PUBLIC_API_URL=https://ganndal.media/api
ExecStart=/usr/bin/npm run start
Restart=always
User=ganndal

[Install]
WantedBy=multi-user.target
```

### 6. Activer
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ganndal-api ganndal-web
sudo cp /opt/ganndal/deploy/nginx.conf /etc/nginx/sites-available/ganndal
sudo ln -s /etc/nginx/sites-available/ganndal /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## Sauvegarde automatique

`/etc/cron.daily/ganndal-backup` :
```bash
#!/bin/bash
DATE=$(date +%F)
# Base de données
pg_dump -U ganndal ganndal | gzip > /var/backups/ganndal-db-$DATE.sql.gz
# Fichiers S3/MinIO (si auto-hébergé)
mc mirror local/ganndal /var/backups/ganndal-files/
# Rétention 30 jours
find /var/backups -name 'ganndal-db-*' -mtime +30 -delete
```
```bash
sudo chmod +x /etc/cron.daily/ganndal-backup
```

## Supervision & logs
- Logs applicatifs : `journalctl -u ganndal-api -f` (ou `docker compose logs -f backend`).
- Healthcheck : `GET /api/health` → `{ "status": "ok" }`.
- Recommandé : monitoring (Uptime Kuma / Netdata) + alerte sur le healthcheck.

## Checklist mise en production
- [ ] Secrets forts (JWT, DB, S3) hors du dépôt
- [ ] HTTPS actif + renouvellement cron
- [ ] `client_max_body_size` adapté aux vidéos (2 Go)
- [ ] Sauvegarde quotidienne testée (restauration vérifiée)
- [ ] CORS limité au domaine de production
- [ ] Comptes de démo désactivés / mots de passe changés
