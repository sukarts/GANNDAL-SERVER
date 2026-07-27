# Phase 16-17 — Documentation & Plans

Regroupe : documentation (dev/API/admin/user) + guides (déploiement/maintenance/montée de version) + plans (tests, déploiement, monitoring, sécurité, scalabilité).

---

## A. Documentation développeur

- **Prérequis** : Node 20, Docker, pnpm/npm, Postgres, Redis, MinIO.
- **Setup local** :
  ```bash
  # backend
  cd backend && npm i && cp .env.example .env
  npx prisma migrate dev && npx tsx prisma/seed.ts
  npm run dev
  # frontend
  cd frontend && npm i && npm run dev
  ```
- **Structure** : `backend/src/{modules,lib,middleware,config}`, `frontend/src/{app,components,lib}`.
- **Conventions** : montants en devise pivot (Decimal) ; `Prisma.*WhereInput` typé (jamais `Record<string,unknown>`) ; mutations sensibles → `audit()` ; services émettent des événements ; validation Zod à l'entrée.
- **Ajouter un module** : `routes → controller → service → repository`, brancher les événements, ajouter tests API, doc OpenAPI.
- **Tests** : `npm test` (Vitest unitaires), `npm run test:api` (supertest), `npm run test:e2e` (Playwright).
- **Git** : branches par feature, PR obligatoire, CI verte, revue. Commits conventionnels.

## B. Documentation API

- Spec **OpenAPI 3.1** générée (`/api/v1/openapi.json`), rendue en portail (Swagger UI/Redoc).
- Auth, pagination/tri/filtre/recherche, format d'erreur, versioning : voir `07-API.md`.
- SDK client TypeScript généré depuis OpenAPI (optionnel Enterprise).
- Collection Postman/Bruno versionnée dans `docs/`.

## C. Documentation administrateur

- **Gestion organisation** : devise pivot (verrou si documents émis), taux de change, logo, seuils d'alertes, barème de dégradation, modèles de documents.
- **Utilisateurs & rôles** : inviter, activer/désactiver, réinitialiser 2FA, matrice de permissions (`ROLES`).
- **Catégories matériel**, **budgets**, **verrou de période comptable**.
- **Audit** : consultation/recherche/export du journal.
- **Sauvegardes** : vérifier le service `backup`, tester une restauration (voir DEPLOY_VPS).

## D. Documentation utilisateur (par rôle)

- **JRI** : voir mes sujets, démarrer, livrer (upload résumable), signer une dotation, suivre mes paiements, télécharger mon attestation.
- **Rédacteur** : créer/assigner, planning kanban, valider/rejeter, suivre les délais.
- **Comptable** : générer les fiches du mois, vérifier, verrouiller, produire bordereaux/exports, enregistrer les paiements, relances.
- **Admin** : dashboard, paramètres, utilisateurs, finance, rapports, audit.
- Format : centre d'aide in-app + captures + courtes vidéos ; FAQ.

## E. Guide de déploiement (voir `docs/DEPLOY_VPS.md`, complété V2)

- **V2 (Compose)** : postgres + redis + minio + backend(×N) + workers(×N) + frontend + nginx + backup. Migrations jouées avant bascule. Secrets via coffre. HTTPS Let's Encrypt.
- **Étapes** : provisionner → secrets → `migrate deploy` → build images → up → smoke test → bascule.
- **Enterprise (K8s)** : Helm chart, HPA (autoscaling), PodDisruptionBudget, Ingress, cert-manager, PVC MinIO distribué, Postgres opéré (CNPG).

## F. Guide de maintenance

- **Backups** : quotidiens + PITR ; **tester la restauration mensuellement** ; externaliser hors VPS.
- **Rotations** : refresh tokens expirés, notifications lues > 90j, logs.
- **Mises à jour dépendances** : `npm audit`/Renovate + Trivy en CI.
- **Surveillance** : dashboards Grafana, alertes ; runbooks d'incident.
- **Purge RGPD** : procédure d'effacement + anonymisation audit.

## G. Guide de montée de version

- **Schéma** : toujours via migration Prisma (jamais `db push` en prod). Migrations **additives** d'abord (expand), déploiement, puis **contract** (suppression) une version plus tard — zéro downtime.
- **API** : changements additifs non cassants ; cassants → `/v2` + dépréciation `/v1` (`Sunset`).
- **Rollback** : image précédente + migration `down` testée ; feature flags pour découpler déploiement et activation.
- **Checklist release** : CI verte, migrations testées sur copie, changelog, backups frais, fenêtre + plan de rollback.

---

## 14. Plan de tests

| Niveau | Outil | Couverture cible | Contenu |
|--------|-------|------------------|---------|
| Unitaire | Vitest | logique métier 100 % | calc pige, dégradation, machine à états, conversion devise |
| Intégration API | supertest | endpoints critiques | auth, RLS isolation, sujets, paie, dotations, permissions |
| E2E | Playwright | parcours clés | login→sujet→livrer→valider→générer paie→payer ; dotation remise/retour |
| Sécurité | ZAP/`npm audit`/Trivy | continue | OWASP, dépendances, images |
| Charge | k6 | endpoints chauds | listes, upload init, dashboard |
| Accessibilité | axe-core | AA | pages principales |
- **Isolation tenant** : test dédié prouvant qu'un tenant ne lit jamais les données d'un autre (RLS). Bloquant.
- **Qualité** : PR sans tests refusée ; couverture minimale en CI ; données de test factices (pas de PII réelle).

## 15. Plan de déploiement

- **Environnements** : `preview` (par PR, éphémère), `staging` (miroir prod), `production`.
- **Pipeline** : lint → typecheck → tests → build → scan → push registry → migrate → deploy → smoke test → bascule.
- **Stratégie** : rolling (V2) ; blue-green (Enterprise). Migrations expand/contract (zéro downtime).
- **Rollback** : image N-1 + migration down ; feature flags.
- **Config** : 12-factor, secrets en coffre, `.env` jamais committé.

## 16. Plan de monitoring

- **Métriques (RED/USE)** : latence p50/p95/p99, taux d'erreur, débit, saturation CPU/mém/IO ; Prometheus + Grafana.
- **Logs** : structurés JSON (pino), `requestId`/`traceId`/`tenantId` ; Loki.
- **Traces** : OpenTelemetry → Tempo (chemin requête, DB, queue).
- **Erreurs** : Sentry (FE+BE), sourcemaps.
- **Alerting** (Alertmanager) : erreur 5xx > seuil, p95 API > 500 ms, queue en retard, DLQ non vide, disque > 80 %, backup échoué, certificat < 15 j.
- **SLO** : dispo 99,5 % (V2), p95 < 300 ms ; error budget suivi.
- **Business** : tableaux MRR/activation/churn (post-multi-tenant).

## 17. Plan de sécurité

- **AuthN/AuthZ** : JWT court + refresh révocable (denylist Redis), 2FA TOTP, RBAC + RLS tenant.
- **Données** : TLS partout ; PII bancaire chiffrée au repos ; secrets en coffre ; **révoquer immédiatement** les secrets exposés en clair (DB pwd, PAT GitHub, clé SMTP — cf. DS-02).
- **Application** : validation Zod, helmet + CSP stricte, CORS liste blanche, rate-limit/lockout, anti-CSRF sur cookies, upload (type/scan AV/quota).
- **Supply chain** : `npm audit`/Renovate, Trivy images, lockfiles, moindre privilège conteneurs.
- **Gouvernance** : registre de traitement RGPD, DPA, droits d'accès/effacement, audit append-only, revue d'accès trimestrielle, plan de réponse à incident + runbooks.
- **Cible** : OWASP ASVS niveau 2 ; test d'intrusion avant l'offre Enterprise.

## 18. Plan de scalabilité

- **Stateless horizontal** : backend & workers répliqués derrière le proxy ; sessions/état en Redis/PG/S3.
- **Base** : Postgres vertical + **read-replica** (rapports) ; index par `organisationId` ; partitionnement des grosses tables (AuditLog, Notification) par date si nécessaire ; PgBouncer.
- **Async** : BullMQ absorbe les pics (notifs, média, exports) ; back-pressure + DLQ.
- **Stockage** : S3/MinIO scalable ; **tiering** originaux froids / preview chaude + CDN ; quotas par tenant.
- **Cache** : Redis pour agrégats dashboard, listes, taux ; invalidation événementielle.
- **Paliers** : V2 mono-VPS (Compose) → V3 multi-nœuds → Enterprise K8s + autoscaling (HPA) + MinIO distribué + Postgres opéré (CNPG) + multi-AZ.
- **Limites & garde-fous** : timeouts, circuit breakers (mail/WhatsApp), pagination obligatoire, taille d'upload par plan, rate-limit par tenant.
