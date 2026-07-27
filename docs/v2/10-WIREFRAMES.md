# Phase 10 — Wireframes (textuels, façon Figma)

Convention : `┌─┐` conteneurs, `[Bouton]`, `▸` liste, `◻` case, `▤` tableau, `🔎` recherche. Breakpoints : Desktop ≥1024, Tablette 768–1023, Mobile <768.

## 10.1 Gabarit application (Desktop)
```
┌───────────────────────────────────────────────────────────────┐
│ [G] GANNDAL        🔎 Recherche globale…      [FR▾][GNF▾] 🔔 [AB▾]│  ← Header 56px
├────────────┬──────────────────────────────────────────────────┤
│ SIDEBAR    │  Sujets / SUJ-2026-0001            ← Breadcrumb    │
│ 240px      │ ┌──────────────────────────────────────────────┐ │
│ ▸ Dashboard│ │  Zone de contenu (cards / tables / formulaire) │ │
│ ▸ Planning │ │                                                │ │
│ ▸ Sujets ● │ │                                                │ │
│ ▸ Média    │ │                                                │ │
│ ▸ JRI      │ └──────────────────────────────────────────────┘ │
│ ▸ Piges    │                                                    │
│ …          │                                                    │
│ ────────── │                                                    │
│ AB Aïssatou│                                                    │
│ Admin      │                                                    │
│ Compte·Sortie                                                   │
└────────────┴──────────────────────────────────────────────────┘
```
**Tablette** : sidebar réductible en icônes (72px). **Mobile** : sidebar en drawer (overlay), bottom nav 5 items.

## 10.2 Login
```
Desktop / Mobile (carte centrée)
┌──────────────────────────┐
│         [G] GANNDAL       │
│   Connexion à votre espace│
│  Email    [______________]│
│  Mot de passe [________][👁]│
│              mot de passe oublié ?│
│        [   Se connecter   ]│  ← primary pleine largeur
│  (étape 2FA si activée : [_ _ _ _ _ _])│
└──────────────────────────┘
```

## 10.3 Dashboard (Admin)
```
┌ KPI ────────────────────────────────────────────────┐
│ [JRI actifs 24] [Sujets à valider 7] [À payer 3,2M GNF] [Parc dispo 88%]│
├ Graphiques ──────────────────────┬───────────────────┤
│ Masse salariale (barres 12 mois)  │ Parc par catégorie │
│                                   │ (donut)            │
├ À traiter ───────────────────────┴───────────────────┤
│ ▤ Sujets livrés en attente de validation  [Voir]     │
│ ▤ Fiches impayées > 15j                    [Voir]     │
└──────────────────────────────────────────────────────┘
Mobile : KPI en pile 1 col, graphes défilants, listes en cartes.
```

## 10.4 Planning — Kanban
```
┌ Planning éditorial            [Kanban|Calendrier]  [+ Sujet] ┐
│ ASSIGNE(3)  EN_COURS(5)  LIVRE(2)  VALIDE(9)  REJETE(1)      │
│ ┌───────┐  ┌───────┐    ┌───────┐ ┌───────┐  ┌───────┐      │
│ │●SUJ-12│  │●SUJ-08│    │●SUJ-04│ │ …     │  │ …     │      │
│ │Titre  │  │Titre  │    │Titre  │ │       │  │       │      │
│ │Fatou  │  │Mamadou│    │…  02/08│ │       │  │       │      │
│ └───────┘  └───────┘    └───────┘ └───────┘  └───────┘      │
│ (glisser-déposer entre colonnes — alternative clavier)      │
└─────────────────────────────────────────────────────────────┘
Mobile : colonnes en scroll horizontal ; carte = tap → détail.
```

## 10.5 Sujet — Détail
```
┌ ← Sujets   SUJ-2026-0001   [Badge EN_COURS]   Échéance 02/08 ┐
│ Titre · Rubrique · JRI assigné · Priorité●                   │
├ Médias ──────────────────────────────────────[⭱ Livrer]────┤
│ ◻vidéo v2 1.2Go [preview][télécharger]  ◻audio v1 …          │
│ (uploader résumable : barre progression + reprise)           │
├ Validation ──────────────────────────────────────────────── ┤
│ [Valider] [Rejeter]  Commentaire […………]                     │
├ Activité (fil horodaté) ───────────────────────────────────  │
│ • Assigné à Fatou — 28/07 • Livré v2 — 01/08 …               │
└─────────────────────────────────────────────────────────────┘
```

## 10.6 Piges & paiements
```
┌ Piges & paiements   [2026][07] [Bordereau][Export mois][Compta] [Générer le mois]┐
│ ▤ Réf | JRI | Période | Sujets | Min | Total | Statut | Actions                │
│   PIGE-… Fatou 07/2026 8 96 4,2M GNF  GENEREE  [PDF][Payer]                     │
│   PIGE-… Ken   07/2026 3 20 1,1M GNF  PAYEE·WU-8842                             │
│ [pagination]                                                                    │
└─────────────────────────────────────────────────────────────────────────────── ┘
Modale Payer : Montant • Mode[▾] • Référence[…] • Date[📅] • [Confirmer]
```

## 10.7 JRI — Fiche 360°
```
┌ ← JRI   Fatou Diallo   [Inviter/Actif]                        ┐
│ [Profil & tarifs] [Sujets] [Revenus] [Matériel] [Historique]  │  ← tabs
│ Tarif/sujet 350k · Tarif/min 12k · IBAN ••••3421 · Wave        │
│ ▤ Sujets (statuts)   |   Revenus (12 mois, barres)             │
│ ▤ Matériel détenu (dotations en cours)                         │
└────────────────────────────────────────────────────────────── ┘
```

## 10.8 Matériel — Détail
```
┌ ← Équipements   CAM-004 — Sony FX3   [Badge AFFECTE]          ┐
│ Infos (inventaire, série, achat, garantie, coût, état) │ [QR] │
│ [+ Ticket maintenance] [Déclarer incident]                    │
│ Maintenance ▸ …   Incidents ▸ …   Historique dotations ▸ …     │
└────────────────────────────────────────────────────────────── ┘
```

## 10.9 Dotation — Remise (mobile-first)
```
┌ Nouvelle dotation                                   ┐
│ Matériel [▾]  JRI [▾]  État remise [▾]              │
│ Photos [📷 + + +]                                   │
│ Signature du JRI :                                  │
│  ┌───────────────────────────────┐                 │
│  │      ✍  (zone tactile)         │  [Effacer]      │
│  └───────────────────────────────┘                 │
│ Observations […]           [Enregistrer & signer]   │
└─────────────────────────────────────────────────────┘
```

## 10.10 Onboarding (nouveau)
```
Étape 1/4 ─ Votre organisation : Nom [__] Devise pivot [GNF▾] Logo[⭱]
Étape 2/4 ─ Invitez votre équipe : email + rôle (répétable)   [Passer]
Étape 3/4 ─ Importez vos données : [Modèle Excel⭱] JRI / Matériel
Étape 4/4 ─ Créez votre 1er sujet → redirige vers le détail
[● ● ● ○]  progress
```

## 10.11 Empty / Erreur / Offline (motifs)
```
[Illustration]  Aucun sujet pour l'instant.
Créez votre premier reportage.      [+ Nouveau sujet]

[!] Une erreur est survenue au chargement.   [Réessayer]

[⚡offline] Hors ligne — vos envois reprendront automatiquement.
```
