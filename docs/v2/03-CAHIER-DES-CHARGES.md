# Phase 3 — Cahier des charges V2

## 3.1 Vision

> **GANNDAL** est le système d'exploitation des rédactions de pigistes : produire les reportages, rémunérer les journalistes où qu'ils soient, et gérer le parc matériel — dans une seule plateforme traçable, multi-devise et multi-organisation.

## 3.2 Objectifs

| Objectif | Indicateur de succès |
|----------|----------------------|
| Réduire le temps administratif de paie | −80 % vs Excel, 0 litige de calcul |
| Fiabiliser la chaîne éditoriale | 100 % des sujets tracés, délai de validation < 48 h |
| Tracer le parc matériel | Taux de restitution > 95 %, dégradations facturées |
| Vendre en multi-tenant (D1=B) | 1re organisation cliente payante en < 6 mois |
| Fiabilité de service | Disponibilité 99,5 % (V2), 99,9 % (Enterprise) |

## 3.3 Périmètre

**Inclus V2** : multi-tenant, auth+RBAC+2FA, sujets/planning, médias résumables, validation, pige+paie documentaire, multi-devise pivot/org, parc+dotations, budgets/finance, notifications asynchrones, alertes, rapports, audit, i18n FR/EN, API interne, exports.

**Inclus Enterprise** : SSO (SAML/OIDC), API publique + webhooks, SLA, hébergement dédié, audit avancé/immutable, contrats+e-signature.

**Exclus (hors périmètre)** : intégration de paiement bancaire (D4), comptabilité générale complète (on exporte vers l'outil compta), CMS de publication (on gère la production, pas la mise en ligne).

## 3.4 Contraintes

- **Techniques** : Postgres (multi-tenant RLS), S3/MinIO, Node/TypeScript, Next.js. Auto-hébergeable.
- **Métier** : devise pivot GNF par défaut ; pas de paiement intégré ; multi-devise obligatoire.
- **Réseau** : JRI en connectivité faible → mobile-first, offline partiel, uploads résumables.
- **Budget/équipe** : petite équipe → **monolithe modulaire** (pas de microservices, D-Phase5).
- **Conformité** : socle RGPD (D8).

## 3.5 Exigences non fonctionnelles (NFR)

| Domaine | Exigence |
|---------|----------|
| Performance | p95 API < 300 ms (hors upload) ; TTI dashboard < 2,5 s ; uploads résumables |
| Disponibilité | 99,5 % V2 ; RPO ≤ 24 h (backup quotidien) → cible RPO ≤ 1 h ; RTO ≤ 4 h |
| Sécurité | OWASP ASVS L2, chiffrement TLS + au repos (PII bancaire), 2FA, rate-limit, RLS tenant |
| Scalabilité | backend/worker stateless horizontalement scalables ; Postgres vertical + read-replica |
| Observabilité | logs structurés, métriques, traces, alerting |
| Accessibilité | WCAG 2.1 AA |
| i18n | FR/EN complet, formats locaux |
| Auditabilité | mutations sensibles journalisées, append-only |

## 3.6 User stories & critères d'acceptation (extraits clés)

> Format : « En tant que [rôle], je veux [action] afin de [valeur] ». AC en Gherkin condensé. Backlog complet en `12-BACKLOG.md`.

### US-AUTH-01 — Connexion sécurisée
En tant qu'utilisateur, je veux me connecter et rester connecté, afin de travailler sans re-login constant.
- **AC1** : identifiants valides → access token + refresh ; session persistante.
- **AC2** : access expiré → refresh silencieux, aucune interruption visible.
- **AC3** : 5 échecs en 10 min → verrouillage temporaire + email d'alerte.
- **AC4** : 2FA activée → code TOTP requis après mot de passe.

### US-SUJ-01 — Assigner un sujet
En tant que rédacteur, je veux assigner un sujet à un JRI avec échéance/priorité/tarif, afin de cadrer la production.
- **AC1** : référence `SUJ-AAAA-NNNN` auto-générée, unique par organisation.
- **AC2** : statut initial `ASSIGNE`, JRI notifié (interne + email).
- **AC3** : transition de statut invalide refusée par l'API (409).

### US-MED-01 — Livrer un média (terrain, réseau faible)
En tant que JRI, je veux uploader une vidéo lourde en reprise sur coupure, afin de livrer malgré une mauvaise connexion.
- **AC1** : upload multipart résumable ; reprise après coupure sans repartir de zéro.
- **AC2** : barre de progression + vitesse ; version incrémentée.
- **AC3** : à la fin, sujet passe `LIVRE`, `livreLe` horodaté, rédacteur notifié.

### US-PAIE-01 — Générer les fiches du mois
En tant que comptable, je veux générer en un clic les fiches de pige du mois, afin d'éviter le calcul manuel.
- **AC1** : pour chaque JRI ayant des sujets validés du mois, une fiche `BROUILLON` est créée.
- **AC2** : montant = Σ(sujets validés × tarif/sujet) + Σ(minutes × tarif/minute) ± bonus/pénalités, **au tarif figé (snapshot)**.
- **AC3** : période verrouillable ; ré-ouverture tracée en audit.

### US-PAIE-02 — Valider un paiement
En tant que comptable, je veux enregistrer le paiement effectué avec sa référence, afin de justifier en compta.
- **AC1** : mode + référence + date saisis ; fiche passe `PAYEE`.
- **AC2** : reçu PDF généré ; JRI notifié « payé ».
- **AC3** : impayé > seuil → relance graduée (J+15/30/45).

### US-DOT-01 — Remettre du matériel
En tant que logisticien, je veux remettre un équipement avec photos + signature, afin d'engager la responsabilité du JRI.
- **AC1** : photos d'état + signature horodatée (hash) obligatoires.
- **AC2** : fiche de responsabilité PDF générée.
- **AC3** : au retour, écart d'état → calcul de dégradation (barème) → ligne facturable.

## 3.7 Workflows métier (résumé, détail en `11-USER-FLOWS.md`)

1. **Éditorial** : Créer sujet → Assigner → EN_COURS → Livrer médias → Valider/Rejeter → (si rejeté) corriger → VALIDE.
2. **Paie** : Fin de mois → Générer brouillons → Vérifier → Verrouiller période → Générer documents → Payer → Enregistrer référence → Notifier JRI.
3. **Parc** : Cataloguer → Remettre (dotation signée) → Suivre → Retour + contrôle état → Dégradation éventuelle → Maintenance si besoin.

## 3.8 Règles métier (invariants)

- **RG-01** : montants métier stockés en devise pivot de l'organisation (Decimal), conversion à l'affichage.
- **RG-02** : une fiche de pige `PAYEE` est immuable (aucune modification de lignes).
- **RG-03** : le tarif appliqué à une ligne de pige est celui **figé** au calcul (snapshot JriProfile).
- **RG-04** : transitions de statut sujet contraintes par machine à états serveur.
- **RG-05** : une dotation `EN_COURS` ne peut être supprimée ; seulement restituée.
- **RG-06** : toute donnée est cloisonnée par `organisationId` (RLS).
- **RG-07** : suppression = **soft delete** (archivage) pour les entités métier ; hard delete réservé RGPD.
- **RG-08** : le taux de change utilisé sur un document émis est gelé (historisation).

## 3.9 Sécurité (voir aussi Plan de sécurité §16)

Auth JWT court + refresh révocable ; 2FA TOTP ; RBAC 4 rôles + permissions fines ; RLS Postgres par tenant ; rate-limiting (login, API) ; chiffrement TLS partout + PII bancaire chiffrée au repos ; secrets hors dépôt (coffre) ; en-têtes helmet/CSP ; validation Zod systématique ; audit append-only.

## 3.10 Conformité (D8 — socle RGPD)

Registre de traitement ; base légale ; consentement notifications ; droit d'accès/export (JSON) ; droit à l'effacement (hard delete + anonymisation audit) ; DPA multi-tenant ; rétention documents (fiscale) vs données perso ; localisation d'hébergement paramétrable.

## 3.11 Performance, disponibilité, monitoring

- **Performance** : voir NFR ; cache Redis (sessions, listes, taux de change) ; pagination partout ; index ciblés.
- **Disponibilité** : health checks, restart policies, backups quotidiens externalisés, plan HA (Phase 5/18).
- **Monitoring** : métriques (RED/USE), logs structurés JSON, traces distribuées, alerting (voir Plan de monitoring §16).

## 3.12 Reporting

Rapports quotidien/hebdo/mensuel ; classement JRI ; finance consolidée ; budget vs réalisé ; parc (dispo, dégradations) ; exports PDF/Excel ; rapports programmés par email.

## 3.13 Administration

Gestion organisation (paramètres, devise pivot, taux, logo) ; utilisateurs & rôles ; catégories matériel ; barème de dégradation ; modèles de documents ; seuils d'alertes ; journal d'audit.

## 3.14 Notifications

Canaux : interne (cloche), email (garanti), WhatsApp (optionnel), SMS/push (fallback D5). File **asynchrone**. Préférences par utilisateur. Déduplication. Digest hebdo. Événements : assignation, échéance J-2, retard, validation en attente, payé, dotation non signée, garantie, impayé.

## 3.15 API

REST versionnée `/api/v1` (interne) ; API publique + webhooks (Enterprise) ; auth Bearer/API key ; pagination/tri/filtre/recherche standardisés ; OpenAPI. Détail `07-API.md`.

## 3.16 Logs

Logs applicatifs structurés (niveau, requestId, tenantId, userId) ; logs d'accès (morgan → JSON) ; **audit métier** séparé (AuditLog, append-only) ; rétention et export ; jamais de secret/PII en clair dans les logs.
