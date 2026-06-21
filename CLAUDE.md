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

- Platform backend: Render (Blueprint `render.yaml`, rootDir `backend`)
- Platform frontend: Vercel (rootDir `frontend`, `frontend/vercel.json`)
- Database: Supabase Postgres (pooler `DATABASE_URL` + `DIRECT_URL`)
- Storage: Supabase Storage (S3-compatible, bucket `ganndal`)
- Production URL: (à renseigner après premier déploiement Vercel)
- Health check: `GET /api/health`

Guide pas-à-pas : [docs/SUPABASE.md](docs/SUPABASE.md).

## Conventions

- Montants métier stockés en GNF (Decimal). Conversion devise à l'affichage / export.
- Toute mutation sensible → `audit()` (table `AuditLog`).
- Prisma `where` typé via `Prisma.*WhereInput` (jamais `Record<string, unknown>` — casse le build tsc).
