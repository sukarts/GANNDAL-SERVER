# GANNDAL — notes projet

Monorepo : `backend/` (API Express + Prisma + PostgreSQL), `frontend/` (Next.js 14).
Devise de base = GNF, multi-devises à l'affichage.

## Commandes

```bash
# Backend
cd backend && npm install && npm run build      # tsc → dist/
npm run dev                                       # tsx watch
npx prisma migrate deploy && npx tsx prisma/seed.ts

# Frontend
cd frontend && npm install && npm run build      # next build
```

Test : aucune suite automatisée pour l'instant (à ajouter : Vitest + supertest).

## Deploy Configuration

Cible retenue : **VPS unique Ubuntu** (full self-host, Docker Compose).

- Platform: VPS Ubuntu, `deploy/docker-compose.prod.yml` (backend + frontend + Postgres + MinIO + Nginx)
- Database: PostgreSQL conteneur local (`db push`, pas de migrations)
- Storage: MinIO conteneur local (bucket `ganndal`, servi via nginx `/files/`) — aucune limite d'upload
- Frontend: Next.js, `NEXT_PUBLIC_API_URL=/api` (même origine derrière nginx, injecté au build)
- Production URL: (à renseigner après déploiement)
- Health check: `GET /api/health`

Guide pas-à-pas : [docs/DEPLOY_VPS.md](docs/DEPLOY_VPS.md).
Alternatives conservées : Render+Vercel (`render.yaml`, `frontend/vercel.json`), Supabase ([docs/SUPABASE.md](docs/SUPABASE.md)).

## Conventions

- Montants métier stockés en GNF (Decimal). Conversion devise à l'affichage / export.
- Toute mutation sensible → `audit()` (table `AuditLog`).
- Prisma `where` typé via `Prisma.*WhereInput` (jamais `Record<string, unknown>` — casse le build tsc).
