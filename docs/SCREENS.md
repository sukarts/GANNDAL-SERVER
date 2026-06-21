# Maquettes d'écran — GANNDAL

Wireframes basse fidélité des écrans clés. Les pages React correspondantes sont dans
[`frontend/src/app`](../frontend/src/app).

## 1. Connexion (`/login`)
```
            ┌───────────────────────────┐
            │          GANNDAL          │
            │   Gestion média digital   │
            │                           │
            │  Email    [____________]  │
            │  Mot passe[____________]  │
            │                           │
            │      [  Se connecter  ]   │
            └───────────────────────────┘
```

## 2. Tableau de bord Admin (`/dashboard`)
```
┌────────────┬──────────────────────────────────────────────┐
│ GANNDAL    │  Tableau de bord                               │
│            │  ┌─────────┐┌─────────┐┌─────────┐┌─────────┐  │
│ • Dashboard│  │ JRI: 12 ││Livrés:8 ││Validés ││À payer  │  │
│ • Sujets   │  │         ││         ││  : 31  ││ 1.2M GNF  │  │
│ • JRI      │  └─────────┘└─────────┘└─────────┘└─────────┘  │
│ • Piges    │  ┌──────────────────────────────────────────┐ │
│ • Matériel │  │ Statistiques mensuelles                  │ │
│ • Dotations│  │  ▁ ▃ ▅ █ ▆ ▄ ▂ ▃ ▅ ▇ ▄ ▂                 │ │
│ • Rapports │  │  J F M A M J J A S O N D                 │ │
│ • Audit    │  └──────────────────────────────────────────┘ │
│            │                                                │
│ Awa Diallo │                                                │
│ [Déconnex.]│                                                │
└────────────┴──────────────────────────────────────────────┘
```

## 3. Sujets (`/dashboard/sujets`)
```
Sujets                                            [+ Nouveau sujet]
┌──────────────┬───────────────┬────────┬─────────┬──────────┬─────────┐
│ Référence    │ Titre         │ JRI    │Priorité │Échéance  │ Statut  │
├──────────────┼───────────────┼────────┼─────────┼──────────┼─────────┤
│ SUJ-2026-0001│ Marché central│ O. Ba  │ HAUTE   │ 22/06    │ ASSIGNÉ │
│ SUJ-2026-0002│ Inondations   │ F. Sow │ URGENTE │ 21/06    │ LIVRÉ   │
└──────────────┴───────────────┴────────┴─────────┴──────────┴─────────┘
```

## 4. Détail sujet & validation
```
SUJ-2026-0002 — Inondations                            [Statut: LIVRÉ]
JRI: F. Sow   Durée: 4 min   Échéance: 21/06

Éléments déposés                          Validation (rédacteur)
┌─────────────────────────────┐          ○ Valider
│ 📹 reportage.mp4   v2  1.2Go │          ○ Demander correction
│ 🔊 itw.wav         v1  45Mo  │          ○ Rejeter
│ 🖼 photo1.jpg       v1  3Mo  │          Commentaire [__________]
└─────────────────────────────┘          [ Enregistrer la décision ]

Historique des validations (horodaté)
  20/06 14:02 — M. Ndiaye — CORRECTION : "revoir le montage"
```

## 5. Fiche de pige (`/dashboard/paiements`)
```
Piges & paiements                  [Calculer une pige] [Export Excel]
┌───────────────────┬────────┬────────┬───────┬───────┬─────────┬────────┐
│ Référence         │ JRI    │Période │Sujets │Minutes│ Total   │ Statut │
├───────────────────┼────────┼────────┼───────┼───────┼─────────┼────────┤
│ PIGE-2026-06-xxxx │ O. Ba  │ 06/2026│   6   │  18   │ 177 000 │ GÉNÉRÉE│
└───────────────────┴────────┴────────┴───────┴───────┴─────────┴────────┘
                                                  [PDF] [Marquer payée]
```

## 6. Inventaire matériel (`/dashboard/materiel`)
```
Équipements & inventaire
┌──────┐┌──────────┐┌────────┐┌───────────┐┌──────────┐┌──────────────┐
│Total ││Disponible││Affecté ││Maintenance││Perdu/Volé││Valeur parc   │
│ 48   ││   21     ││   23   ││    3      ││    1     ││ 62 500 000 GNF │
└──────┘└──────────┘└────────┘└───────────┘└──────────┘└──────────────┘
┌────────┬──────────────┬──────────┬─────────────┬───────┬───────────┐
│ Réf.   │ N° inventaire│Catégorie │Marque/Modèle│ État  │ Statut    │
├────────┼──────────────┼──────────┼─────────────┼───────┼───────────┤
│ CAM-001│ INV-2026-0001│ Caméras  │ Sony FX3    │ NEUF  │DISPONIBLE │
└────────┴──────────────┴──────────┴─────────────┴───────┴───────────┘
                                              [Fiche + QR] [Affecter]
```

## 7. Fiche matériel + QR
```
┌─────────────────────────────┬───────────────┐
│ CAM-001 — Sony FX3          │   ▄▄▄▄▄▄▄▄    │
│ N° série : SN123456         │   █ ▄▄▄ █     │  ← QR Code
│ Achat : 12/01/2026          │   █ █ █ █     │     (scan → fiche)
│ Garantie : 12/01/2028       │   ▀▀▀▀▀▀▀▀    │
│ Coût : 2 500 000 GNF          │               │
│ Affecté à : O. Ba (depuis 15/06)            │
│ [Restituer] [Maintenance] [Déclarer incident]│
└─────────────────────────────┴───────────────┘
```

## 8. Dotation / restitution
```
Remise de matériel                     Restitution
JRI       [O. Ba ▾]                    Date retour : 30/06
Matériel  [CAM-001 ▾]                  État retour  [A_REPARER ▾]
État      [BON_ETAT ▾]                 Photos retour [+]
Photos    [+ ajouter]                  Dégradation : 625 000 GNF (auto)
Signature ✍ ____________               Validé par   : M. Ndiaye
[ Valider la remise ]                  [ Valider la restitution ]
```

## Charte
- Couleur primaire : vert `#1a7f37` (barre latérale, accents, KPIs).
- Layout : barre latérale fixe + zone de contenu, responsive (mobile : menu repliable).
- Composants : cartes KPI, tableaux, badges de statut colorés, graphe à barres.
