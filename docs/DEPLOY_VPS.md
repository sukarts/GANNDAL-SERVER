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

## ⚠️ Build sur ce VPS (contournement DNS obligatoire)

Le résolveur DNS de l'hôte est le stub systemd-resolved (`/etc/resolv.conf` → `nameserver 127.0.0.53`).
Un conteneur en réseau par défaut **ne peut pas joindre `127.0.0.53`** → `npm`/`prisma generate`
échouent avec `EAI_AGAIN getaddrinfo registry.npmjs.org`. `docker compose build` (BuildKit) est touché.

**Toujours builder le backend en réseau hôte** (hérite du DNS de l'hôte) :
```bash
cd /opt/ganndal && git pull
DOCKER_BUILDKIT=0 docker build --network=host -t deploy-backend ./backend
DOCKER_BUILDKIT=0 docker build --network=host -t deploy-frontend \
  --build-arg NEXT_PUBLIC_API_URL=/api ./frontend
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env up -d   # sans --build
docker compose -f deploy/docker-compose.prod.yml restart nginx
```
> Ne pas utiliser `up -d --build` ni `docker compose build` ici : ils passent par BuildKit et cassent sur le DNS.
> `deploy-backend` / `deploy-frontend` = noms d'image attendus par compose (projet `deploy`).

## ⚠️ Coupure 80/443 après déploiement (nftables + Docker) — RÉSOLU

**Symptôme** : après un `docker compose up` / `restart` / `systemctl restart docker` / reboot, le site
renvoie `ERR_CONNECTION_TIMED_OUT` de l'extérieur, alors que le VPS lui-même sert (`curl localhost` = 200)
et que le SSH (port 22) marche. Le SYN externe **arrive** (vérifié au tcpdump) mais aucun SYN-ACK ne repart.

**Cause** : iptables en backend **nf_tables** (`iptables --version` → `nf_tables`) + politique
`FORWARD DROP`. À chaque événement Docker, les règles d'ACCEPT du forwarding se désynchronisent → le
trafic externe forwardé vers le conteneur nginx est droppé (le trafic local passe par `OUTPUT`, d'où le 200 en loopback).

**Correctif appliqué (permanent)** — règle d'acceptation dans la chaîne `DOCKER-USER` (préservée par Docker),
réappliquée à chaque boot via un service systemd :
```bash
# immédiat
iptables -I DOCKER-USER -j ACCEPT
# persistance au reboot
cat > /etc/systemd/system/docker-forward-fix.service <<'EOF'
[Unit]
Description=Reouvre le forwarding Docker (DOCKER-USER) apres docker
After=docker.service
Requires=docker.service
[Service]
Type=oneshot
ExecStart=/usr/sbin/iptables -I DOCKER-USER -j ACCEPT
RemainAfterExit=yes
[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload && systemctl enable docker-forward-fix.service
```
> Si la coupure réapparaît un jour : `iptables -P FORWARD ACCEPT` débloque immédiatement, puis vérifier
> que le service `docker-forward-fix` est bien `enabled` (`systemctl status docker-forward-fix`).

## Mises à jour

Voir le bloc ci-dessus (build réseau hôte). En résumé : `git pull` → `docker build --network=host` (backend + frontend si changé) → `up -d` → `restart nginx`. Les migrations s'appliquent seules au démarrage du backend (`migrate deploy`).

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
