# Phase 1 — Audit stratégique

## 1.1 Problème résolu

Les médias/agences de presse travaillant avec des **journalistes reporters d'images (JRI) pigistes** souffrent de trois douleurs cumulées, aujourd'hui gérées sur Excel + WhatsApp + email :

1. **Chaîne éditoriale opaque** : qui produit quoi, où en est un sujet, qui doit valider. Pas de source de vérité.
2. **Rémunération à la pige ingérable** : calcul manuel (nb sujets × tarif + minutes × tarif ± bonus/pénalités), erreurs, litiges, retards de paiement, pigistes dispersés à l'international.
3. **Parc matériel dispersé et non tracé** : caméras/micros confiés aux JRI, pertes, dégradations non facturées, garanties oubliées, aucune responsabilité formalisée.

GANNDAL unifie **production éditoriale + paie à la pige + gestion de parc** dans un seul outil, avec traçabilité (audit) et multi-devise pour des équipes internationales.

## 1.2 Marché

- **Cible primaire** : rédactions numériques, agences de presse, chaînes web/TV régionales en Afrique francophone (et diaspora), employant massivement des pigistes.
- **Cible secondaire** : boîtes de production audiovisuelle, agences de communication, collectifs de journalistes.
- **Taille** : marché de niche vertical. Valeur non pas dans le volume mais dans le **fit métier précis** (pige + parc + multi-devise GNF/XOF/EUR/USD) qu'aucun généraliste ne couvre.
- **Tendance** : explosion du pigisme et du travail distribué post-2020 ; besoin d'outillage de la « creator economy » journalistique.

## 1.3 Concurrents

| Catégorie | Exemples | Recouvrement | Faille exploitable |
|-----------|----------|--------------|--------------------|
| CMS/desk éditorial | WordPress VIP, Arc XP, Ghost | Production de contenu | Aucune gestion de pige ni de parc ; cher, lourd |
| Gestion de projet | Trello, Asana, Monday | Assignation/kanban | Générique, pas de calcul de pige, pas de médias lourds |
| Paie/freelance | Deel, Malt, Payoneer | Paiement freelances | Pas de workflow éditorial ni de parc ; frais élevés ; pas GNF |
| Asset/parc | Cheqroom, Rentman | Matériel | Pas d'éditorial ni de paie ; pas pensé JRI |
| Spécialistes presse | Newsroom tools maison | Éditorial | Sur-mesure, non vendables, chers |

**Positionnement** : GANNDAL est le seul à **verticaliser les trois** pour le pigisme journalistique francophone. Le concurrent réel = **Excel + WhatsApp** (statu quo), pas un SaaS établi.

## 1.4 Avantages (V1)

- Couverture métier rare : pige + éditorial + parc + multi-devise, en un outil.
- Multi-devise avec devise pivot (GNF) et conversion à l'affichage — inédit sur ce marché.
- Génération documentaire riche : bordereaux, fiches, attestations annuelles, exports comptables (PDF/Excel).
- Traçabilité (AuditLog) et e-signature des dotations.
- i18n FR/EN pour JRI internationaux.
- Auto-hébergeable (souveraineté des données, coût maîtrisé).

## 1.5 Faiblesses (V1)

- **Mono-tenant** : non vendable en l'état à plusieurs clients (voir D1).
- **`db push` en prod** : risque données (D2).
- **Frontend 100 % `'use client'`** : pas de SSR, perfs et SEO faibles, tout le fetch en client.
- **Sécurité incomplète** : mots de passe démo, pas de rate-limiting explicite, pas de 2FA, tokens 15 min = friction.
- **Observabilité absente** : pas de métriques/traces/alerting infra.
- **Tests partiels** : unitaires calc seulement, pas d'API/E2E.
- **MinIO/Postgres single-node** : SPOF, pas de HA, backup local seulement (récent).
- **Pas d'onboarding** : premier usage brutal.

## 1.6 Opportunités

- **Verrou par la donnée** : une fois pige + parc + historique dans l'outil, coût de sortie élevé → rétention forte.
- **Extension** : marketplace de piges, notation JRI, contrats + e-signature, comptabilité analytique, API publique/partenaires.
- **Effet réseau léger** : annuaire de JRI réutilisable entre rédactions d'un même groupe.
- **Souveraineté** : argument fort en Afrique francophone (hébergement local, GNF natif).

## 1.7 Risques

| Risque | Prob. | Impact | Mitigation |
|--------|-------|--------|------------|
| Rétrofit multi-tenant tardif | Élevée | Critique | Trancher D1 **avant** dev V2 |
| Perte de données (`db push`) | Moyenne | Critique | Migrations versionnées (DT-01) |
| Faible connectivité terrain (JRI) | Élevée | Moyen | Mode dégradé, uploads résumables, PWA offline |
| Dépendance mono-VPS | Moyenne | Élevé | Backups externalisés, plan HA (Phase 5) |
| Adoption (habitude Excel/WhatsApp) | Élevée | Élevé | Onboarding, import Excel, intégration WhatsApp |
| Conformité RGPD non traitée | Moyenne | Élevé | Socle RGPD (D8) |

## 1.8 Utilisateurs & personas

### P1 — Aïssatou, Administratrice (patronne de rédaction)
- **Objectifs** : vision globale, maîtrise des coûts, décisions.
- **Frustrations** : pas de vue consolidée, dépend des exports Excel de la compta.
- **Usage** : quotidien léger (dashboard), mensuel intense (validation paie, rapports).
- **KPI** : masse salariale/mois, sujets validés, coût parc.

### P2 — Mamadou, Rédacteur en chef
- **Objectifs** : assigner, suivre, valider les sujets dans les délais.
- **Frustrations** : relances manuelles, statuts éparpillés.
- **Usage** : quotidien intense (planning, validations).
- **KPI** : sujets livrés à temps, délai de validation.

### P3 — Fatou, JRI / Pigiste (terrain, mobile, connectivité variable)
- **Objectifs** : voir ses sujets, livrer des médias, savoir ce qu'on lui doit, gérer son matériel.
- **Frustrations** : uploads lourds sur réseau faible, opacité sur les paiements.
- **Usage** : quotidien mobile, uploads terrain.
- **KPI** : sujets livrés, revenus, délai de paiement.

### P4 — Ibrahima, Comptable
- **Objectifs** : payer juste et à temps, produire les documents comptables.
- **Frustrations** : recalculs manuels, coordonnées de paiement incomplètes.
- **Usage** : cycle mensuel (calcul, bordereaux, validation paiements).
- **KPI** : fiches payées à temps, exactitude, exports.

### P5 — Ken, Logisticien/gestionnaire de parc (souvent = rédacteur en V1)
- **Objectifs** : savoir où est chaque équipement, son état, sa garantie.
- **Frustrations** : pertes non tracées, dégradations non facturées.
- **Usage** : à chaque remise/retour de matériel.
- **KPI** : taux de restitution, coût des dégradations, dispo du parc.

## 1.9 Jobs To Be Done

1. *Quand j'assigne un reportage, je veux fixer échéance/priorité/tarif et suivre son avancement, afin de publier à temps sans relancer par WhatsApp.*
2. *Quand un JRI livre, je veux valider/rejeter avec commentaires horodatés, afin de garantir la qualité et tracer les corrections.*
3. *À la fin du mois, je veux calculer automatiquement ce que je dois à chaque pigiste, afin de payer juste sans Excel.*
4. *Quand je paie un JRI à l'étranger, je veux générer un document et enregistrer la référence de transaction, afin de justifier le paiement en compta.*
5. *Quand je confie du matériel, je veux une remise signée avec photos d'état, afin d'engager la responsabilité du JRI.*
6. *Au retour du matériel, je veux constater l'état et calculer une éventuelle dégradation, afin de facturer les dommages.*
7. *À tout moment, je veux une vue consolidée des coûts (pige + parc), afin de piloter le budget.*

## 1.10 SWOT (synthèse)

```
FORCES                              FAIBLESSES
- Fit métier vertical rare          - Mono-tenant (non vendable)
- Multi-devise pivot GNF            - db push (risque données)
- Génération doc riche              - Front 100% client, pas de SSR
- Auto-hébergeable / souverain      - Sécu partielle, pas d'observabilité
- Traçabilité + e-signature         - Tests partiels, SPOF infra

OPPORTUNITÉS                        MENACES
- Verrou par la donnée              - Rétrofit multi-tenant tardif
- Extensions (contrats, API)        - Connectivité terrain faible
- Souveraineté (Afrique franco.)    - Adoption vs Excel/WhatsApp
- Groupes multi-rédactions          - Conformité RGPD non traitée
```

## 1.11 Analyse de valeur

- **Value proposition** : « Le poste de pilotage unique de votre rédaction de pigistes : produire, payer, équiper — en toute traçabilité, quelle que soit la devise. »
- **Gains** : −80 % de temps administratif de paie, zéro litige de calcul, parc tracé, coûts consolidés.
- **Douleurs supprimées** : Excel de paie, relances WhatsApp, pertes de matériel, opacité JRI.
- **Différenciateur défendable** : verticalisation tri-domaine + multi-devise + souveraineté. Difficile à copier pour un généraliste (pas leur marché) et pour un maison-mère (pas vendable).

## 1.12 Analyse business

- **Modèle** (si D1=B) : SaaS B2B par abonnement, par organisation, palier au **nombre de JRI actifs**.
  - *Starter* (≤ 10 JRI) — éditorial + pige.
  - *Pro* (≤ 100) — + parc, multi-devise, exports compta, rapports.
  - *Enterprise* (illimité) — + SSO, API, SLA, hébergement dédié, audit avancé.
- **Coûts** : infra mutualisée (VPS/K8s), stockage médias (poste principal — vidéos lourdes → politique de rétention/tiering).
- **Métriques SaaS** : MRR, NRR, churn logo, activation (1er sujet validé + 1re paie), CAC vs LTV.
- **Go-to-market** : atterrissage direct sur groupes de presse francophones, bouche-à-oreille rédactionnel, offre souveraineté.
