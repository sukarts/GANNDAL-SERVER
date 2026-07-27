# Phase 9 — Design System

Base existante conservée et formalisée : **police Inter**, **brand vert #1a7f37**, Tailwind. Objectif : cohérence, dark mode, WCAG AA.

## 9.1 Fondations

### Couleurs
```
Brand (vert éditorial)
  brand-50  #f0f8f3   brand-light #e8f3ec
  brand     #1a7f37   brand-dark  #14622b
Neutres (gris)
  50 #f9fafb · 100 #f3f4f6 · 200 #e5e7eb · 300 #d1d5db · 400 #9ca3af
  500 #6b7280 · 600 #4b5563 · 700 #374151 · 800 #1f2937 · 900 #111827
Sémantiques
  success #1a7f37 · warning #b45309 · danger #b91c1c · info #1d4ed8
Statuts sujet
  ASSIGNE gris · EN_COURS bleu · LIVRE ambre · VALIDE vert · REJETE rouge
Priorité (points)
  BASSE gris · NORMALE bleu · HAUTE ambre · URGENTE rouge
```
Contraste : tous les textes sur fond respectent ≥ 4,5:1 (vérifier `brand` sur blanc = 4,8:1 OK ; texte blanc sur `brand` OK).

### Dark mode
Tokens sémantiques (CSS variables) basculés via `prefers-color-scheme` + override `:root[data-theme]`.
```
--bg      light #f6f7f9  / dark #0f1115
--surface light #ffffff  / dark #171a21
--text    light #111827  / dark #e5e7eb
--muted   light #6b7280  / dark #9ca3af
--border  light #e5e7eb  / dark #2a2f3a
--brand   #1a7f37 (light) / #2f9e4f (dark, contraste relevé)
```

### Typographie (Inter)
```
Display  30/36  700
H1       24/32  700
H2       20/28  600
H3       16/24  600
Body     14/20  400
Small    12/16  400  (labels, méta)
Mono     JetBrains/UI mono — références (SUJ-…, PIGE-…)
```
`letter-spacing:-0.01em` sur les titres (déjà en place).

### Grille & espacements
- Échelle 4px : `1=4, 2=8, 3=12, 4=16, 6=24, 8=32, 12=48`.
- Conteneur max 1280px ; gouttières 24px desktop / 16px mobile.
- Sidebar 240px ; header 56px.
- Rayons : `md .5rem`, `xl .875rem` (cards) ; ombres `sm` et `card` (déjà définies).

### Icônes
Set unique **Lucide** (cohérent, tree-shakable), 1.5px stroke, taille 16/20/24. Pas d'emoji en UI (remplacer ☰ 🔔 par icônes).

## 9.2 Composants (spécifications)

### Boutons
| Variante | Usage | Style |
|----------|-------|-------|
| Primary | action principale | fond `brand`, texte blanc, hover `brand-dark` |
| Secondary | secondaire | bordure neutre, fond surface, hover gris-50 |
| Ghost | tertiaire | sans bordure, hover gris-50 |
| Danger | destructif | fond `danger`, confirmation requise |
États : hover, active (translateY .5px — déjà), focus ring `brand` 3px, disabled (opacity .5), loading (spinner + label). Tailles sm/md/lg.

### Formulaires
Champs : bordure neutre, focus ring vert (déjà globals.css), label au-dessus, aide/erreur en dessous (`aria-describedby`). Composants : Input, Textarea, Select, Combobox (recherche), Checkbox, Radio, Toggle, DatePicker, FileUploader (résumable, progress), SignaturePad, CurrencyInput, MoneyDisplay.

### Cards
`bg-surface rounded-xl shadow-card p-4`. Variantes : KPI (valeur + libellé + tendance), média (vignette + méta), liste.

### Badges
Pilule `rounded px-2 py-0.5 text-xs`, jeu de couleurs = statuts/priorité ci-dessus. Toujours **libellé + couleur** (jamais couleur seule).

### Data Tables
En-tête `bg-gray-50` sticky, `scope=col`, tri cliquable (indicateur), lignes hover (déjà), pagination en pied, densité compacte, colonnes numériques alignées à droite, actions en fin de ligne, sélection multiple optionnelle, responsive → cartes empilées sur mobile.

### Modales
Overlay `bg-black/40`, panneau centré `max-w`, focus trap, `Esc` ferme, titre `aria-labelledby`, action primaire à droite. Variante drawer latéral (mobile / formulaires longs).

### Dropdowns / Menus
Menu accessible (rôle `menu`, navigation flèches), position auto, séparateurs, items destructifs en rouge.

### Toasts
Coin haut-droit, `aria-live=polite`, auto-dismiss 3–5 s, variantes success/error/info/warning, action optionnelle (Annuler).

### Navigation
Sidebar (lien actif surligné — déjà), bottom nav mobile, breadcrumb, tabs.

### Feedback
Skeletons, empty states (illustration + CTA), progress (upload), spinners inline.

## 9.3 Animations

Transitions douces (150 ms) sur couleur/ombre/opacité (déjà). Micro-interactions : boutons, apparition de modale (fade+scale), toasts (slide). Respect `prefers-reduced-motion` (désactive les mouvements). Pas d'animation gratuite bloquant l'action.

## 9.4 Accessibilité WCAG 2.1 AA (checklist DS)

- [ ] Contraste texte ≥ 4,5:1, UI ≥ 3:1.
- [ ] Focus visible sur tous les interactifs.
- [ ] Tous les composants pilotables au clavier.
- [ ] Rôles/ARIA corrects (modale, menu, live regions).
- [ ] Cibles tactiles ≥ 44px.
- [ ] Formulaires : label + erreur programmatiques.
- [ ] Dark mode conforme aux mêmes ratios.
- [ ] `prefers-reduced-motion` respecté.

## 9.5 Implémentation

- Tailwind + tokens en CSS variables (thème clair/sombre). 
- Bibliothèque de composants **maison** basée sur **Radix UI primitives** (accessibilité éprouvée) + Tailwind, documentée en **Storybook**.
- Un seul `<MoneyDisplay>` (formatage devise, déjà `lib/money`) et `<StatutBadge>` réutilisés partout (supprime les divergences actuelles).
