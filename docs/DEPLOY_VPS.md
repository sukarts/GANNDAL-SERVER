# Déploiement — VPS unique Ubuntu (full self-host)

Tout sur un seul serveur : backend + frontend + PostgreSQL + MinIO (stockage) derrière Nginx,
via Docker Compose. **Aucune limite d'upload** (contrairement à Supabase Storage Free).
Indépendant de Supabase.

```
Internet ──► Nginx :80/:443
              ├─ /            ► frontend (Next.js :3000)
              ├─ /api/        ► backend  (Express :4000)
              └─ /files/      ► MinIO    (:9000, fichiers publics)
backend ──► postgres:5432   backend ──► minio:9000
```

## Prérequis serveur
- VPS Ubuntu 22.04+ (2 vCPU / 4 Go RAM conseillé ; disque selon volume vidéo)
- Un nom de domaine pointant (A record) vers l'IP du VPS

## 1. Installer Docker
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin git ufw
sudo systemctl enable --now docker
sudo usermod -aG docker $USER   # se reconnecter ensuite
```

## 2. Pare-feu
```bash
sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable
```

## 3. Récupérer le code
```bash
git clone https://github.com/sukarts/GANNDAL-SERVER.git /opt/ganndal
cd /opt/ganndal/deploy
```

## 4. Configurer les secrets
```bash
cp .env.prod.example .env
nano .env    # remplir POSTGRES_PASSWORD, JWT (openssl rand -hex 32 x2),
             # CORS_ORIGIN=https://TON-DOMAINE, S3_SECRET_KEY, S3_PUBLIC_URL
```
Adapter le domaine dans `nginx.conf` (`server_name`).

## 5. Lancer
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```
Au démarrage : Postgres + MinIO montent, le bucket `ganndal` est créé, le backend
applique le schéma (`prisma db push`) puis démarre, le frontend est buildé avec `/api`.

## 6. Seed initial (comptes + devises + catégories)
```bash
docker compose -f docker-compose.prod.yml exec backend npx tsx prisma/seed.ts
```

## 7. HTTPS (Let's Encrypt)
```bash
sudo apt install -y certbot
sudo docker compose -f docker-compose.prod.yml stop nginx
sudo certbot certonly --standalone -d TON-DOMAINE
mkdir -p certs
sudo cp /etc/letsencrypt/live/TON-DOMAINE/fullchain.pem certs/
sudo cp /etc/letsencrypt/live/TON-DOMAINE/privkey.pem  certs/
# décommenter le bloc 443 dans nginx.conf + la redirection 80->443
docker compose -f docker-compose.prod.yml up -d nginx
```
Renouvellement auto (crontab -e) :
```
0 3 * * * certbot renew --quiet && docker compose -f /opt/ganndal/deploy/docker-compose.prod.yml restart nginx
```

## 8. Vérifs
```bash
curl -s https://TON-DOMAINE/api/health          # {"status":"ok"}
# login admin@ganndal.media / Admin123! sur le site
```
Tester un upload d'élément sur un sujet → le fichier doit être accessible via
`https://TON-DOMAINE/files/ganndal/...`.

## Migrations de schéma (Prisma Migrate)

La prod applique désormais des **migrations versionnées** (`prisma migrate deploy`), plus `db push`.

### Bascule initiale (une seule fois, base existante issue de `db push`)
Le schéma est déjà en place → on marque la migration baseline comme **déjà appliquée** (sinon `migrate deploy` tenterait de recréer les tables et échouerait). Ordre important : **backup → build → resolve → up**.
```bash
cd /opt/ganndal
# 1. backup de sécurité
docker compose -f deploy/docker-compose.prod.yml exec backup sh /pg-backup.sh || true
# 2. code + nouvelle image (contient le dossier prisma/migrations)
git pull
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env build backend
# 3. marquer la baseline comme appliquée (avant tout migrate deploy)
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env run --rm \
  --entrypoint sh backend -c "npx prisma migrate resolve --applied 00000000000000_init"
# 4. démarrer (le backend joue `migrate deploy` → aucune migration en attente)
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env up -d
docker compose -f deploy/docker-compose.prod.yml restart nginx
# 5. vérifier
docker compose -f deploy/docker-compose.prod.yml run --rm --entrypoint sh backend -c "npx prisma migrate status"
```
Après cette étape, chaque déploiement joue automatiquement `migrate deploy` (dans la commande du conteneur `backend`).

### Créer une nouvelle migration (en dev, jamais en prod)
```bash
cd backend && npx prisma migrate dev --name description_du_changement
git add prisma/migrations && git commit && git push
```
> ⚠️ Ne jamais revenir à `prisma db push` en prod : perte de l'historique et risque de données.

## Mises à jour
```bash
cd /opt/ganndal && git pull
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env up -d --build
```

## Sauvegarde base de données (automatique)
Le service `backup` du compose dump Postgres au démarrage puis toutes les 24 h vers
`deploy/backups/` (format custom `pg_restore`, rétention `BACKUP_KEEP_DAYS`, défaut 30 j).
Rien à installer — actif dès `up -d`.

```bash
# Vérifier
docker compose -f deploy/docker-compose.prod.yml logs backup | tail
ls -lh /opt/ganndal/deploy/backups

# Restaurer un dump (⚠️ écrase les données actuelles)
docker compose -f deploy/docker-compose.prod.yml exec -T postgres \
  pg_restore -U ganndal -d ganndal --clean --if-exists \
  < /opt/ganndal/deploy/backups/ganndal-AAAAMMJJ-HHMMSS.dump
```

**Fichiers MinIO** (médias/photos) — sauvegarde séparée conseillée, ex. cron.daily :
```bash
D=$(date +%F)
docker run --rm -v ganndal_miniodata:/data -v /var/backups:/backup alpine \
  tar czf /backup/ganndal-files-$D.tar.gz -C /data .
find /var/backups -name 'ganndal-files-*' -mtime +30 -delete
```

> Emporter les dumps hors du serveur (rsync/objet distant) pour survivre à une perte du VPS.

## Notes
- **Vidéos volumineuses** : `client_max_body_size 2048M` déjà réglé dans `nginx.conf`.
  MinIO n'a pas de limite par fichier ; surveiller l'espace disque.
- **Garder Supabase comme DB** (au lieu du Postgres local) : retirer le service `postgres`
  du compose et pointer `DATABASE_URL`/`DIRECT_URL` vers Supabase dans `deploy/.env`.
- **Console MinIO** (admin fichiers) : exposer temporairement le port 9001 si besoin.
