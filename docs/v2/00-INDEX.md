# GANNDAL V2 — Dossier de conception complet

> Refonte pilotée par une équipe produit/technique virtuelle (CTO, Architecte, Staff Eng, PM, Designer, UX, DevOps, Sécurité, DBA, QA, Tech Lead, BA).
> Objectif : documentation prête à développer, sans question ouverte bloquante.

## Livrables (Phase 17)

| # | Livrable | Fichier |
|---|----------|---------|
| — | Index + registre de décisions | `00-INDEX.md` (ce fichier) |
| 1 | Audit stratégique (marché, SWOT, personas, JTBD) | `01-AUDIT.md` |
| 2 | Audit fonctionnel + liste optimisée | `02-AUDIT-FONCTIONNEL.md` |
| 3 | Cahier des charges V2 | `03-CAHIER-DES-CHARGES.md` |
| 4 | Architecture fonctionnelle (modules) | `04-ARCHI-FONCTIONNELLE.md` |
| 5 | Architecture technique + diagrammes | `05-ARCHI-TECHNIQUE.md` |
| 6 | Modèle de données + ERD Mermaid | `06-DATA-MODEL.md` |
| 7 | Documentation API | `07-API.md` |
| 8 | UX (écrans, états, accessibilité) | `08-UX.md` |
| 9 | Design System (UI, WCAG, dark mode) | `09-DESIGN-SYSTEM.md` |
| 10 | Wireframes textuels | `10-WIREFRAMES.md` |
| 11 | User flows + séquences Mermaid | `11-USER-FLOWS.md` |
| 12 | Backlog (epics → stories → AC) | `12-BACKLOG.md` |
| 13 | Roadmap (Sprint 0 → Enterprise) | `13-ROADMAP.md` |
| 14 | Audit dette (technique/UX/produit/sécu) | `14-DETTE.md` |
| 15 | Optimisation concurrentielle | `15-OPTIMISATION.md` |
| 16-18 | Docs (dev/API/admin/user) + plans (tests, déploiement, monitoring, sécurité, scalabilité) | `16-DOCS-ET-PLANS.md` |

---

## État des lieux (V1 auditée)

- **Backend** : Express + Prisma + PostgreSQL, TypeScript ESM. 14 modules, ~6 100 lignes TS/TSX.
- **Frontend** : Next.js 14 App Router — **toutes les pages `'use client'`** (aucun SSR/RSC exploité).
- **Stockage** : MinIO (S3 self-host). **Auth** : JWT access(15 min)+refresh révocable, bcrypt, Zod, RBAC 4 rôles.
- **Modules** : auth, users, sujets, medias, validations, currencies, paiements, budgets, materiel, dotations, dashboard, rapports, notifications, alertes (cron), audit.
- **Devise** : GNF base (Decimal), multi-devise à l'affichage. **i18n** FR/EN.
- **Déploiement** : VPS unique Contabo, Docker Compose (postgres+minio+backend+frontend+nginx+backup), HTTPS Let's Encrypt, `prisma db push` (**pas de migrations**).
- **Tests** : 18 tests Vitest (calc pige + dégradation). Pas de tests API/E2E.

---

## Registre de décisions (Règle n°1 — inconnues tranchées)

Chaque décision : **impact**, **options**, **recommandation**. À valider par le client (marqué 🔴 si structurant).

### ✅ D1 — Mono-organisation vs SaaS multi-tenant — **TRANCHÉ : A (mono-org, outil interne)**
- **Décision client (2026-07)** : GANNDAL est un **outil interne d'un seul média**. Pas de vente multi-clients.
- **Conséquences** (le dossier V2 supposait B — invalidé) :
  - ❌ Abandon : table `Organisation`, colonne `organisationId`, Row-Level Security, devise pivot par org, facturation/plans/MRR, onboarding self-service, isolation tenant.
  - ✅ Simplifications : une seule organisation implicite ; sécurité au **périmètre interne** (moins de surface, mais 2FA/secrets/audit restent utiles) ; GNF reste devise de base globale (voir D3=A).
  - 📉 Roadmap allégée : **la phase « MVP multi-tenant » est supprimée** → on passe du Sprint 0 directement au durcissement + fonctionnalités métier (voir 13-ROADMAP, à réviser).
  - Sections « analyse business / marché / concurrents / SaaS » (01-AUDIT) → informatives seulement, non prioritaires.
- **Ce qui reste 100 % valable** : audit fonctionnel, cahier des charges (hors multi-tenant), archi technique (monolithe modulaire — encore plus justifié), modèle de données (sans `organisationId`/RLS), API, UX/UI, design system, wireframes, flows, plans tests/déploiement/monitoring/sécurité/scalabilité.

### 🔴 D2 — Migrations vs `db push`
- **Manque** : la prod tourne sur `prisma db push --accept-data-loss` (pas d'historique de schéma).
- **Impact** : risque de **perte de données** sur changement de schéma, pas de rollback, pas d'audit du schéma.
- **Options** : (A) garder `db push` ; (B) passer à `prisma migrate` versionné.
- **Recommandation** : **B** dès Sprint 0. `db push` acceptable en prototypage, **inacceptable** pour un SaaS en prod avec données clients. Voir dette DT-01.

### ✅ D3 — Devise de base GNF — **TRANCHÉ : A (GNF global)**
- Mono-org (D1=A) → **GNF reste la devise pivot unique**, multi-devise à l'affichage (état actuel conservé). Pas de devise par organisation. Historisation des taux (RG-08) reste pertinente pour figer les documents émis.

### D4 — Paiement des pigistes
- **Établi** (décision client existante) : **pas d'intégration de paiement** (JRI dispersés mondialement). L'app **génère un document** (bordereau/fiche) et la compta **valide** avec référence de transaction. On conserve. Voir F-PAIE.

### D5 — Canal WhatsApp
- **Manque** : WhatsApp Cloud API branché mais dépend d'un numéro business + template approuvé.
- **Impact** : notifications « urgentes » (sujet en retard) partiellement fiables.
- **Recommandation** : garder WhatsApp **optionnel**, ajouter **SMS (fallback)** et push web. Email reste le canal garanti.

### D6 — Recherche
- **Manque** : recherche actuelle = `ILIKE` Postgres. Volume cible inconnu.
- **Recommandation** : Postgres **full-text (tsvector + GIN)** jusqu'à ~10⁶ lignes/tenant. Meilisearch/OpenSearch seulement si besoin avéré (repousser). Voir Phase 5.

### D7 — Cible de charge
- **Manque** : nb d'organisations, d'utilisateurs concurrents, volume médias.
- **Hypothèse de dimensionnement** (à confirmer) : 50–500 organisations, 20–2 000 JRI/org, médias vidéo jusqu'à plusieurs Go. Architecture conçue pour scaler horizontalement le stateless (backend/workers), Postgres vertical + read-replicas plus tard.

### D8 — Conformité
- **Manque** : juridiction des données (Guinée / UE / mixte).
- **Impact** : RGPD si utilisateurs UE, hébergement des données perso des JRI.
- **Recommandation** : appliquer un socle **RGPD-compatible** par défaut (consentement, export, suppression, registre de traitement, DPA). Détail Phase 3 §Conformité.
