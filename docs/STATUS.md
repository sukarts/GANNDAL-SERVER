# État d'implémentation

## ✅ Implémenté (fonctionnel)
- Schéma BDD complet (Prisma) — toutes les entités des deux modules
- Auth JWT (login, refresh, logout, /me) + rôles + middleware
- Utilisateurs / profils JRI + tarifs + historique
- Sujets : CRUD, attribution, statuts, validation/rejet/correction (horodatée), upload éléments S3 + versioning
- Comptabilisation auto des piges + bonus/pénalités, fiche mensuelle
- Export PDF (pdfkit) + Excel (exceljs)
- Module équipements : catalogue, catégories, QR Code auto, inventaire, maintenance, incidents
- Dotations : remise (photos/signature), restitution + calcul auto des dégradations
- Tableaux de bord admin & JRI
- Rapports : activité (jour/semaine/mois), classement JRI, inventaire, dotations par JRI
- Multi-devises : devise de base GNF, table `Currency`, convertisseur API, sélecteur frontend, PDF dans devise choisie (taux figé)
- Alertes équipements : scan quotidien (node-cron 07:00) + `POST /alertes/run` — garantie proche, matériel non restitué, entretien en attente ; dédoublonnage 7 j
- Notifications (interne + email + **WhatsApp Cloud API réel**) ; journal d'audit
- Frontend Next.js : login, dashboards, listes + **formulaires de création** (sujet, JRI, équipement+QR, dotation, calcul de pige, PDF, marquer payée), fiches détail sujet/matériel, signature électronique, photos matériel, changement mot de passe, cloche notifications, export Excel, responsive mobile
- Tests : Vitest — logique pure (calc, 9 tests) + endpoints supertest (5 tests) = 14 tests
- Déploiement : Docker Compose (dev + prod), Dockerfiles, Nginx, scripts one-shot (deploy.sh, deploy-https.sh), CI GitHub Actions (`.github/workflows/ci.yml`)

## 🟡 À compléter / brancher
- **Tests d'intégration DB** : supertest avec base de test jetable (endpoints DB-dépendants)
- **Pagination/filtre UI** : l'API pagine l'audit ; généraliser aux autres listes
- **Graphiques** : dashboard utilise un graphe maison ; option lib (Recharts) pour rapports
