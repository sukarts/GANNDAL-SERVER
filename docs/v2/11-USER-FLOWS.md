# Phase 11 — User Flows

## 11.1 Inscription via invitation
```mermaid
sequenceDiagram
  actor Admin
  participant API
  participant Mail
  actor Invité
  Admin->>API: POST /invitations {email, rôle}
  API->>API: token unique + expiry
  API->>Mail: email d'invitation (lien)
  Mail-->>Invité: lien
  Invité->>API: GET /invitations/:token
  API-->>Invité: org + rôle
  Invité->>API: POST /invitations/:token/accept {nom, mdp}
  API->>API: crée User (org), invalide token
  API-->>Invité: tokens + redirection onboarding
```

## 11.2 Connexion (avec refresh & 2FA)
```mermaid
flowchart TD
  A[Saisie email+mdp] --> B{Valide ?}
  B -- non --> B1[Erreur / incrément échecs] --> B2{≥5 échecs ?}
  B2 -- oui --> B3[Verrouillage + email] --> A
  B2 -- non --> A
  B -- oui --> C{2FA activée ?}
  C -- oui --> D[Saisie code TOTP] --> E{Code ok ?}
  E -- non --> D
  E -- oui --> F[Tokens émis]
  C -- non --> F
  F --> G[Accès dashboard]
  G -.access expiré.-> H[Refresh silencieux] --> G
  H -.refresh révoqué.-> A
```

## 11.3 Onboarding (première organisation)
```mermaid
flowchart LR
  S[1. Org + devise] --> T[2. Inviter équipe] --> U[3. Import Excel JRI/Matériel] --> V[4. 1er sujet] --> W[Dashboard activé]
  T -. passer .-> U
  U -. passer .-> V
```

## 11.4 Cycle éditorial (création → validation)
```mermaid
stateDiagram-v2
  [*] --> ASSIGNE: créer + assigner
  ASSIGNE --> EN_COURS: JRI démarre
  EN_COURS --> LIVRE: upload médias complet
  LIVRE --> VALIDE: rédacteur valide
  LIVRE --> REJETE: rédacteur rejette (motif)
  REJETE --> EN_COURS: JRI corrige
  VALIDE --> [*]
  note right of LIVRE: livreLe horodaté, rédac notifié
  note right of VALIDE: éligible au calcul de pige
```

## 11.5 Livraison média résumable (réseau faible)
```mermaid
sequenceDiagram
  actor JRI
  participant FE as PWA
  participant API
  participant S3
  JRI->>FE: sélectionne vidéo 1.2Go
  FE->>API: POST /medias/init
  API->>S3: crée upload multipart
  API-->>FE: uploadId + URLs de parts
  loop chaque part
    FE->>S3: PUT part (retry si coupure)
  end
  Note over FE,S3: coupure réseau → reprise des parts manquantes
  FE->>API: POST /medias/complete
  API->>S3: complete multipart
  API->>API: crée SujetElement, sujet→LIVRE
  API-->>FE: ok + notif rédacteur
```

## 11.6 Génération & paiement des piges
```mermaid
sequenceDiagram
  actor Compta
  participant API
  participant Worker
  Compta->>API: POST /paiements/generer {annee, mois}
  API->>API: pour chaque JRI: fiche BROUILLON (tarifs figés)
  API-->>Compta: liste brouillons
  Compta->>API: vérifie / ajuste bonus-pénalités
  Compta->>API: POST /periodes/2026/07/verrouiller
  Compta->>API: POST /paiements/:id/pdf
  API->>Worker: job export PDF
  Worker-->>API: pdfKey
  Compta->>API: PATCH /paiements/:id/payer {mode, ref, date}
  API->>API: statut PAYEE (immuable)
  API->>Worker: notifier JRI "payé" + reçu
```

## 11.7 Dotation : remise, suivi, retour avec dégradation
```mermaid
flowchart TD
  A[Remise: photos + signature] --> B[Dotation EN_COURS · matériel AFFECTE]
  B --> C{Signée ?}
  C -- non J+X --> C1[Alerte non-signée] --> B
  B --> D[Retour: état constaté + photos]
  D --> E{Écart d'état ?}
  E -- oui --> F[Calcul dégradation via barème] --> G[Ligne facturable + incident]
  E -- non --> H[RESTITUE · matériel DISPONIBLE]
  G --> H
```

## 11.8 Recherche
```mermaid
flowchart LR
  Q[🔎 requête] --> R{Portée}
  R --> S[Sujets FTS]
  R --> J[JRI]
  R --> M[Matériel]
  S & J & M --> Res[Résultats groupés + accès direct]
```

## 11.9 Modification / Suppression (soft delete)
```mermaid
flowchart TD
  E[Éditer] --> V{Validation Zod}
  V -- ko --> E
  V -- ok --> S[Sauvegarde + audit]
  D[Supprimer] --> C{Confirmer ?}
  C -- non --> X[Annulé]
  C -- oui --> SD{Entité métier ?}
  SD -- oui --> SDA[Soft delete deletedAt + audit]
  SD -- non/RGPD --> HD[Hard delete + anonymisation audit]
```

## 11.10 Support
```mermaid
flowchart LR
  U[Utilisateur] --> H[Centre d'aide / FAQ]
  H -- non résolu --> T[Créer ticket / email support]
  T --> A[Accusé + suivi]
```

## 11.11 Administration (paramètres org)
```mermaid
flowchart LR
  A[Admin] --> O[Org: devise, taux, logo, seuils]
  A --> Ro[Rôles & utilisateurs]
  A --> Ca[Catégories & barème]
  A --> Au[Audit / export]
  O -.devise verrouillée si docs émis.-> O
```

## 11.12 Gestion des erreurs & cas limites
```mermaid
flowchart TD
  R[Requête] --> C{Résultat}
  C -- 401 --> A1[Refresh → sinon login]
  C -- 403 --> A2[Page accès refusé]
  C -- 409 --> A3[Conflit métier: message + relire état]
  C -- 429 --> A4[Backoff + Retry-After]
  C -- 5xx --> A5[Toast + retry + report Sentry]
  C -- offline --> A6[File locale, resync auto]
```
**Cas limites traités** : upload interrompu (reprise), double calcul de pige (idempotence + unicité mois), période verrouillée (409), fiche payée éditée (409), taux de change manquant (bloque l'émission + alerte), dotation supprimée en cours (interdit), JRI supprimé avec fiches (soft delete + conservation documents), concurrence kanban (optimistic + rollback), token invité expiré (410).
