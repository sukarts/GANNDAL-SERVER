# Déploiement avec Supabase

Supabase fournit **Postgres + Storage** managés. Il **n'héberge pas** le backend Express
ni le frontend Next.js — ceux-ci tournent ailleurs (Render, Railway, Fly.io, VPS ; front sur Vercel).

```
Frontend (Vercel)  ──►  Backend Express (Render/VPS)  ──►  Supabase Postgres
                                     │
                                     └──►  Supabase Storage (S3)
```

## 1. Créer le projet Supabase
1. https://supabase.com → New project. Noter **project ref** + **mot de passe DB** + **région**.
2. SQL/Database est prêt immédiatement.

## 2. Récupérer les URLs Postgres
Dashboard → **Project Settings → Database → Connection string** :
- **Pooler** (Transaction, port 6543) → `DATABASE_URL` (ajouter `?pgbouncer=true`)
- **Direct** (port 5432) → `DIRECT_URL` (utilisé par `prisma migrate`)

```env
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

Le schéma Prisma déclare déjà `directUrl` → aucune modif de code.

## 3. Storage (remplace MinIO)
1. Dashboard → **Storage → New bucket** : nom `ganndal`, **Public** (lecture des fichiers servis).
2. **Storage → Settings → S3 connection** → activer, générer **Access key / Secret key**.
3. Renseigner les variables `S3_*` (voir `backend/.env.example`, bloc Supabase) :
```env
S3_ENDPOINT=https://[REF].storage.supabase.co/storage/v1/s3
S3_REGION=[REGION]
S3_BUCKET=ganndal
S3_ACCESS_KEY=[S3_ACCESS_KEY_ID]
S3_SECRET_KEY=[S3_SECRET_ACCESS_KEY]
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_URL=https://[REF].supabase.co/storage/v1/object/public/ganndal
```
Notre `lib/s3.ts` (AWS SDK v3) parle nativement à l'endpoint S3 Supabase.

> ⚠️ Limite d'upload : le plan Free Supabase plafonne la taille de fichier (~50 Mo).
> Pour les vidéos (2 Go), passer à un plan payant et relever la limite du bucket,
> ou garder un S3 dédié (Scaleway/Wasabi/AWS) juste pour les vidéos.

## 4. Migrer le schéma + seed
Depuis ta machine (avec le `.env` rempli Supabase) :
```bash
cd backend
npm install
npx prisma migrate deploy   # applique les migrations sur Supabase (via DIRECT_URL)
npx tsx prisma/seed.ts       # comptes + catégories + devises
```

## 5. Déployer le backend (ex : Render)
1. New → **Web Service** → connecter le repo, root = `backend`.
2. Build : `npm install && npx prisma generate && npm run build`
3. Start : `node dist/server.js`
4. Variables d'env : toutes celles de `backend/.env.example` (bloc Supabase + JWT forts + SMTP + `CORS_ORIGIN` = URL du frontend).
5. (Render n'exécute pas les migrations au build → les lancer en étape 4 ci-dessus, ou ajouter un `prisma migrate deploy` en pre-deploy command.)

## 6. Déployer le frontend (ex : Vercel)
1. Import repo, root = `frontend`.
2. Variable : `NEXT_PUBLIC_API_URL=https://<backend>.onrender.com/api`
3. Deploy.

## 7. Vérifs
- `GET https://<backend>/api/health` → `{"status":"ok"}`
- Login `admin@ganndal.media / Admin123!`
- Upload d'un élément → fichier visible dans le bucket `ganndal` (Supabase Storage)
- Générer un PDF de pige → présent dans `paiements/` du bucket

## Pourquoi pas Supabase Auth ?
GANNDAL utilise sa propre auth JWT + rôles métier (ADMIN/REDACTEUR/JRI/COMPTABLE) liés à la table `User`.
On garde Supabase pour Postgres + Storage uniquement. Migration vers Supabase Auth = chantier séparé (non requis).

## Checklist sécurité
- [ ] `DATABASE_URL` = pooler `?pgbouncer=true` ; `DIRECT_URL` = port 5432
- [ ] Secrets JWT forts (`openssl rand -hex 32`)
- [ ] `CORS_ORIGIN` = domaine front exact
- [ ] Bucket `ganndal` public en lecture seule ; écriture via clés S3 serveur uniquement
- [ ] Limite de taille du bucket adaptée aux vidéos
- [ ] Comptes démo désactivés en prod
