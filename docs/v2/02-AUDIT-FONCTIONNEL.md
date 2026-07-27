# Phase 2 — Audit fonctionnel

Grille par fonctionnalité : objectif · utilisateur · valeur · fréquence · dépendances · règles métier · données · risques · UX actuelle → UX idéale · améliorations.

Légende valeur/fréquence : ⭐ (1–5) / [quotidien|hebdo|mensuel|rare].

---

## F1 — Authentification & sessions
- **Objectif** : accès sécurisé, sessions révocables. **Utilisateur** : tous. **Valeur** ⭐⭐⭐⭐⭐ · quotidien.
- **Dépendances** : User, RefreshToken. **Règles** : JWT access 15 min + refresh révocable ; bcrypt ; rôles.
- **Données** : email, hash, rôle, tokens. **Risques** : pas de 2FA, pas de rate-limit login, mots de passe démo, expiration 15 min = re-login fréquent.
- **UX actuelle** : login basique ; « Token invalide ou expiré » brutal. **UX idéale** : refresh silencieux, « rester connecté », reset password, 2FA optionnel, verrouillage après N échecs.
- **Améliorations** : refresh auto (intercepteur), rate-limit + lockout, 2FA TOTP, politique mot de passe, invitations (déjà présent) généralisées.

## F2 — Gestion des utilisateurs & profils JRI
- **Objectif** : CRUD comptes, tarifs JRI, coordonnées de paiement. **Utilisateur** : admin. **Valeur** ⭐⭐⭐⭐ · hebdo.
- **Dépendances** : User, JriProfile. **Règles** : tarif/sujet, tarif/minute, tarif custom ; IBAN/banque/pays/mode préféré ; invitation email.
- **Données** : identité, rôle, tarifs, coordonnées bancaires (**sensibles**). **Risques** : PII bancaire non chiffrée au repos, pas de séparation des devoirs.
- **UX actuelle** : fiche éditable, invitations. **UX idéale** : fiche 360° JRI (sujets, revenus, matériel, historique), statut actif/inactif clair.
- **Améliorations** : chiffrement au repos des coordonnées, masquage IBAN, audit renforcé, champs contrat.

## F3 — Sujets (reportages) & planning
- **Objectif** : créer/assigner/suivre les sujets. **Utilisateur** : rédac, JRI (lecture/statut). **Valeur** ⭐⭐⭐⭐⭐ · quotidien.
- **Dépendances** : Sujet, User, rubrique. **Règles** : statuts ASSIGNE→EN_COURS→LIVRE→VALIDE/REJETE ; priorité ; échéance ; référence auto SUJ-AAAA-NNNN ; `livreLe`/`valideLe`.
- **Données** : titre, description, rubrique, échéance, priorité, durée min. **Risques** : transitions de statut non contraintes côté API (kanban optimiste).
- **UX actuelle** : liste + kanban drag&drop + calendrier (bon). **UX idéale** : filtres avancés, vue « mes sujets », rappels d'échéance (livrés : voir alertes).
- **Améliorations** : machine à états serveur stricte, commentaires/fil de discussion, pièces jointes de brief, gabarits de sujet.

## F4 — Médias / éléments livrés
- **Objectif** : uploader vidéos/audio/photos/docs, versionner. **Utilisateur** : JRI (dépôt), rédac (revue). **Valeur** ⭐⭐⭐⭐⭐ · quotidien.
- **Dépendances** : SujetElement, S3/MinIO. **Règles** : type, version, taille ; URL présignée.
- **Données** : fichier, type, version, taille. **Risques** : uploads lourds sur réseau faible (échecs), pas de reprise, pas de scan antivirus, pas de transcodage.
- **UX actuelle** : médiathèque en grille (récemment paginée/i18n). **UX idéale** : upload résumable + progress, prévisualisation, tri par sujet.
- **Améliorations** : **uploads multipart résumables** (tus/S3 multipart), génération de vignettes (worker), transcodage HLS pour preview, quotas par tenant.

## F5 — Validation éditoriale
- **Objectif** : valider/rejeter avec commentaires horodatés. **Utilisateur** : rédac. **Valeur** ⭐⭐⭐⭐⭐ · quotidien.
- **Dépendances** : Validation, Sujet. **Règles** : action VALIDE/REJETE, commentaire, timestamp ; passe le sujet en VALIDE/REJETE.
- **Données** : action, commentaire, auteur, date. **Risques** : pas d'historique de corrections lié aux versions de médias.
- **UX idéale** : diff entre versions, checklist de conformité, escalade (alerte ajoutée).
- **Améliorations** : lier validation ↔ version de média, motifs de rejet normalisés.

## F6 — Calcul de pige & fiches de paiement
- **Objectif** : calculer la rémunération mensuelle par JRI. **Utilisateur** : compta/admin. **Valeur** ⭐⭐⭐⭐⭐ · mensuel.
- **Dépendances** : FichePaiement, PaiementLigne, Sujet, JriProfile. **Règles** : base = sujets validés du mois × tarif/sujet + minutes × tarif/minute ± bonus/pénalités ; statuts fiche (GENEREE/PAYEE).
- **Données** : lignes, montants GNF, période. **Risques** : recalcul manuel un par un (pas d'auto), pas de verrou de période, montants figés vs re-calcul.
- **UX actuelle** : « Calculer une pige » manuel + validation paiement (mode/référence). **UX idéale** : génération de masse mensuelle en brouillon, verrouillage de période, aperçu avant validation.
- **Améliorations** : **génération auto mensuelle** (brouillons), snapshot des tarifs au moment du calcul, ré-ouverture contrôlée.

## F7 — Paiements (documents & validation)
- **Objectif** : produire bordereau/fiche, enregistrer le paiement effectué. **Utilisateur** : compta. **Valeur** ⭐⭐⭐⭐⭐ · mensuel.
- **Règles** (décision D4) : **pas d'intégration de paiement** ; document généré + référence/mode/date saisis à la validation.
- **Données** : mode (Virement/WU/MoneyGram/Wave/Espèces), référence, date. **Risques** : pas de rapprochement bancaire, saisie manuelle.
- **UX idéale** : statut de paiement clair, relances graduées (J+15/30/45), reçu PDF pour le JRI.
- **Améliorations** : relances impayés graduées, notification au JRI quand payé, export SEPA/CSV optionnel.

## F8 — Multi-devise
- **Objectif** : afficher/convertir dans plusieurs devises. **Utilisateur** : tous. **Valeur** ⭐⭐⭐⭐ · quotidien.
- **Dépendances** : Currency (tauxGnf). **Règles** : GNF pivot, taux manuels, conversion à l'affichage.
- **Risques** : taux manuels périmés, pas d'historisation des taux (impact sur documents passés).
- **Améliorations** (D3) : devise pivot par organisation, historisation des taux, source de taux optionnelle, gel du taux sur documents émis.

## F9 — Budgets par rubrique
- **Objectif** : suivre budget vs réalisé par rubrique/mois. **Utilisateur** : admin/compta. **Valeur** ⭐⭐⭐ · mensuel.
- **Dépendances** : Budget (rubrique/annee/mois unique). **Risques** : alerte de dépassement seulement au digest.
- **Améliorations** : alerte temps réel au dépassement, projection de fin de mois.

## F10 — Finance consolidée
- **Objectif** : vue masse salariale piges + coûts. **Utilisateur** : admin/compta. **Valeur** ⭐⭐⭐⭐ · mensuel.
- **Risques** : recouvre budgets/paiements/rapports (redondance possible).
- **Améliorations** : tableau de bord financier unique, drill-down, export.

## F11 — Matériel (parc)
- **Objectif** : catalogue équipements, états, garanties, QR, maintenance, incidents. **Utilisateur** : rédac/logistique. **Valeur** ⭐⭐⭐⭐ · hebdo.
- **Dépendances** : CategorieMateriel, Materiel, Maintenance, IncidentMateriel. **Règles** : réf/n° inventaire/série, coût, garantie, statut, QR.
- **Risques** : QR généré au détail (backfill nécessaire), pas de check-out mobile par scan.
- **Améliorations** : scan QR mobile pour remise/retour, journal de maintenance, alertes garantie (présentes).

## F12 — Dotations (remises/retours)
- **Objectif** : remettre/reprendre du matériel avec preuve. **Utilisateur** : rédac/JRI. **Valeur** ⭐⭐⭐⭐ · hebdo.
- **Dépendances** : Dotation, Materiel, User. **Règles** : dateRemise, étatRemise, photos remise/retour, e-signature, statut EN_COURS/RESTITUE, **calcul de dégradation** (BAREME_DEGRADATION).
- **Risques** : dépend de photos (réseau), signature non horodatée cryptographiquement.
- **Améliorations** : fiche de responsabilité PDF, signature horodatée + hash, relance non-signée (alerte ajoutée).

## F13 — Notifications
- **Objectif** : informer (interne/email/WhatsApp). **Valeur** ⭐⭐⭐⭐ · quotidien.
- **Dépendances** : Notification, mailer, WhatsApp Cloud API. **Risques** : envoi synchrone dans le flux métier (latence), pas de file d'attente, WhatsApp fragile.
- **Améliorations** : **file asynchrone (worker/queue)**, préférences par utilisateur, digest, SMS/push fallback (D5).

## F14 — Alertes planifiées (cron)
- **Objectif** : scan quotidien (garantie, non-restitué, entretien, retard, échéance J-2, escalade validation, impayés). **Valeur** ⭐⭐⭐⭐ · quotidien (auto).
- **Risques** : mono-instance (si scale horizontal → double exécution). **Améliorations** : lock distribué (advisory lock / BullMQ repeatable), configurable par tenant.

## F15 — Rapports
- **Objectif** : quotidien/hebdo/mensuel, classement JRI. **Valeur** ⭐⭐⭐ · hebdo/mensuel.
- **Améliorations** : rapports programmés par email (PDF), personnalisables, export.

## F16 — Audit / journal
- **Objectif** : tracer les mutations sensibles. **Valeur** ⭐⭐⭐⭐ · continu.
- **Dépendances** : AuditLog. **Risques** : couverture partielle, pas d'UI de recherche avancée.
- **Améliorations** : audit systématique (middleware), recherche/filtre, rétention, immutabilité (append-only).

## F17 — Dashboard
- **Objectif** : KPI par rôle. **Valeur** ⭐⭐⭐⭐ · quotidien. **Améliorations** : widgets configurables, vues par rôle affinées, tendances.

## F18 — i18n FR/EN
- **Objectif** : JRI internationaux. **Valeur** ⭐⭐⭐ · continu. **Risques** : couverture partielle (pages staff). **Améliorations** : compléter EN, ajouter locales (PT/AR ?), formats date/nombre par locale.

## F19 — Exports (PDF/Excel)
- **Objectif** : bordereau, fiche, attestation annuelle, export comptable. **Valeur** ⭐⭐⭐⭐ · mensuel/annuel. **Améliorations** : génération asynchrone pour gros volumes, modèles personnalisables (logo tenant).

---

## Liste de fonctionnalités optimisée (V2)

**Conserver & renforcer** : F1–F7, F11–F17, F19.
**Faire évoluer structurellement** :
- Multi-tenant (transverse, D1).
- Uploads résumables + pipeline média asynchrone (F4).
- Notifications asynchrones via queue (F13).
- Génération auto des fiches de paie (F6).
- Machine à états serveur pour les sujets (F3/F5).

**Fusionner** :
- **Finance (F10) ⊃ Budgets (F9)** : un module « Finance » avec onglet Budgets, pour éviter la redondance avec Paiements/Rapports.
- **Sujets (F3) + Planning** : déjà cohérent, garder unifié.

**Ajouter (nouveau, concurrentiel — voir Phase 15)** :
- Onboarding guidé + import Excel (adoption).
- PWA offline / uploads terrain robustes.
- Contrats JRI + e-signature.
- Portail JRI simplifié (mobile-first).
- Historisation des taux de change + gel sur documents.
- API publique + webhooks (Enterprise).

**Supprimer/repousser** :
- Moteur de recherche externe (Meilisearch) : repoussé (D6, Postgres FTS suffit).
- Microservices : non justifiés au volume cible → monolithe modulaire (Phase 5).
