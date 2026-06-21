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
- Notifications (interne + email ; WhatsApp stub) ; journal d'audit
- Frontend Next.js : login, dashboards, listes (sujets, JRI, piges, matériel, dotations, rapports, audit)
- Déploiement : Docker Compose (dev + prod), Dockerfiles, Nginx, systemd, sauvegarde

## 🟡 À compléter / brancher
- **WhatsApp Cloud API** : appel réel à implémenter dans `lib/notify.ts` (stub présent)
- **Alertes équipements** (garantie proche, entretien programmé, matériel non restitué, inventaire) :
  modèles prêts — ajouter un planificateur (cron/`node-cron`) qui scanne et appelle `notify()`
- **Formulaires de création** côté frontend (sujets, matériel, dotation) : les pages sont en lecture ;
  les endpoints POST existent, brancher les modales/formulaires
- **Signature électronique** : champ `signatureUrl` prêt ; intégrer un canvas de signature côté frontend
- **Pagination/filtre UI** : l'API pagine l'audit ; généraliser aux autres listes
- **Tests automatisés** : non inclus (ajouter Vitest/Jest + supertest)

## Prochaines étapes recommandées
1. `npm install` dans `backend/` et `frontend/`
2. `docker compose up -d postgres minio` puis `npx prisma migrate dev` + `npm run seed`
3. Brancher les formulaires de création et le planificateur d'alertes
4. Ajouter une suite de tests + CI
