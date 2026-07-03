# GANNDAL — Plateforme SaaS de gestion média digital

Plateforme de gestion d'un média digital employant des journalistes (JRI/pigistes) rémunérés à la pige, avec module complet de gestion des équipements et dotations.

## Stack technique

| Couche | Techno |
|--------|--------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Base de données | PostgreSQL 16 |
| Stockage fichiers | S3 compatible (AWS S3 / MinIO / Scaleway) |
| Auth | JWT (access + refresh) |
| Notifications | Email (SMTP), WhatsApp (API Cloud), notifications internes |
| Documents | PDF (pdfkit), Excel (exceljs), QR Code (qrcode) |

## Structure du monorepo

```
.
├── backend/      API REST Node/Express + Prisma
├── frontend/     Application Next.js
├── docs/         Schéma BDD, spec API, rôles, maquettes, déploiement
└── deploy/       docker-compose, nginx, systemd, scripts
```

## Démarrage rapide (dev)

```bash
# 1. Base de données + MinIO via Docker
cd deploy && docker compose up -d postgres minio

# 2. Backend
cd ../backend
cp .env.example .env          # ajuster les valeurs
npm install
npx prisma migrate dev        # crée les tables
npm run seed                  # comptes de démo + données
npm run dev                   # http://localhost:4000

# 3. Frontend
cd ../frontend
cp .env.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

## Comptes de démonstration (après seed)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | admin@ganndal.media | Admin123! |
| Rédacteur en chef | redacteur@ganndal.media | Redac123! |
| JRI / Pigiste | jri@ganndal.media | Jri123! |
| Comptable | comptable@ganndal.media | Compta123! |

## Documentation

- [Schéma base de données](docs/SCHEMA.md)
- [Spécification API REST](docs/API.md)
- [Rôles & permissions](docs/ROLES.md)
- [Maquettes d'écran](docs/SCREENS.md)
- [Déploiement VPS unique (recommandé)](docs/DEPLOY_VPS.md)
- [Plan de déploiement Ubuntu (natif/systemd)](docs/DEPLOYMENT.md)
- [Déploiement avec Supabase](docs/SUPABASE.md)

## État d'implémentation

Ce dépôt est une **fondation fonctionnelle**. Le schéma de données, l'authentification,
les rôles et les CRUD principaux sont implémentés. Certains endpoints secondaires
(exports avancés, intégrations WhatsApp réelles) sont marqués `TODO` dans le code.
Voir [docs/STATUS.md](docs/STATUS.md).
