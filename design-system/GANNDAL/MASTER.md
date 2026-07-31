# GANNDAL — Design System (source de vérité implémentation)

> Style retenu : **Data-Dense Dashboard** (WCAG AA, light + dark). Marque verte `#1a7f37`, Inter (UI) + JetBrains Mono (chiffres/références). Rationale détaillée : `docs/v2/09-DESIGN-SYSTEM.md`. Ce fichier = tokens + specs prêts à coder.

## 1. Tokens couleur (CSS variables — light/dark)

À poser dans `globals.css` sous `:root` et `:root[data-theme="dark"]` (+ `@media prefers-color-scheme`).

```
/* Marque */
--brand         #1a7f37   /* dark: #2f9e4f (contraste relevé) */
--brand-dark    #14622b   /* dark: #1a7f37 */
--brand-light   #e8f3ec   /* dark: rgba(47,158,79,.15) */

/* Surfaces & texte (light / dark) */
--bg        #f6f7f9 / #0f1115
--surface   #ffffff / #171a21
--surface-2 #f9fafb / #1e222b   /* en-têtes de table, zones secondaires */
--text      #111827 / #e5e7eb
--muted     #6b7280 / #9ca3af
--border    #e5e7eb / #2a2f3a
--ring      #1a7f37 / #2f9e4f

/* Sémantiques (texte/fond utilisables les deux modes) */
--success   #1a7f37 / #2f9e4f
--warning   #b45309 / #f59e0b
--danger    #b91c1c / #f87171
--info      #1d4ed8 / #60a5fa
```

Règle : **jamais de hex brut dans les composants** — toujours via variable ou classe Tailwind mappée. Contraste texte ≥ 4,5:1 dans les deux modes.

## 2. Statuts & priorités (badges — libellé + couleur, jamais couleur seule)

```
Sujet   ASSIGNE=gris · EN_COURS=info · LIVRE=warning · VALIDE=success · REJETE=danger
Fiche   BROUILLON=gris · GENEREE=info · PAYEE=success
Dotation EN_COURS=warning · RESTITUE=success
Matériel DISPONIBLE=success · AFFECTE=info · MAINTENANCE=warning · PERDU/VOLE=danger
Priorité BASSE=gris · NORMALE=info · HAUTE=warning · URGENTE=danger (point coloré)
```

## 3. Typographie

- **Inter** : UI (déjà en place, `--font-inter`).
- **JetBrains Mono** : montants, `SUJ-…`, `PIGE-…`, n° inventaire, minutes → chiffres alignés. Variable `--font-mono`.
- Échelle : Display 30/700 · H1 24/700 · H2 20/600 · H3 16/600 · Body 14/400 · Small 12/400. Titres `letter-spacing:-0.01em`.

## 4. Espacement & grille (densité 8 — dashboard)

- Échelle 4px : `1=4 2=8 3=12 4=16 6=24 8=32`. Densité dense → padding tables `px-3 py-2`, cards `p-4`.
- Conteneur max 1280px ; sidebar 240px ; header 56px ; rayons `md .5rem`, `xl .875rem`.

## 5. Composants (specs)

### DataTable (cœur du produit)
- En-tête `bg-surface-2` sticky, `scope=col`, **tri cliquable** (indicateur ▲▼), lignes `hover:bg-surface-2`, densité compacte, **colonnes numériques alignées à droite + mono**.
- Barre d'outils : recherche (`q`), filtres typés (statut/période/JRI), pagination en pied (déjà `Pagination`).
- États : skeleton lignes au chargement, empty (illustration + CTA), erreur (bandeau + Réessayer).
- Mobile : bascule en cartes empilées (< 768px).

### StatutBadge (composant unique — supprime les divergences)
`<StatutBadge kind="sujet|fiche|dotation|materiel" value="VALIDE" />` → pilule `rounded px-2 py-0.5 text-xs` + libellé i18n + couleur sémantique.

### MoneyMono
`<MoneyMono value={n} />` → montant formaté (`lib/money`) en `font-mono tabular-nums`, aligné droite dans les tables.

### Boutons
Primary (brand), Secondary (bordure), Ghost, Danger. Focus ring brand 3px, hover 150ms, loading spinner+label, `cursor-pointer`.

### Autres
Modale (Radix, focus-trap, Esc), Toast (`aria-live`, 3–5s), Dropdown (rôle menu, flèches), Skeleton, EmptyState, ThemeToggle.

### Icônes
**Lucide** partout. Remplacer emoji `☰`→`Menu`, `🔔`→`Bell`, pastille logo `G` OK.

## 6. Dark mode

- Toggle dans le header (à côté de langue/devise), persiste `data-theme` sur `<html>` + localStorage.
- Défaut = `prefers-color-scheme`. Le toggle prime.

## 7. Accessibilité (bloquant)

Contraste ≥ 4,5:1 (les 2 modes) · focus visible partout · tout au clavier · cibles ≥ 44px · `aria-live` toasts/erreurs · pas d'info par couleur seule · `prefers-reduced-motion`.

## 8. Écrans — règles spécifiques (overrides dans `pages/`)

| Écran | Points clés |
|-------|-------------|
| Dashboard | Bandeau KPI cards (valeur mono + libellé + tendance) → graphes (Recharts, table alternative a11y) → listes « à traiter ». |
| Planning | Kanban dense, drag&drop + **alternative clavier** (menu statut). Calendrier → liste sur mobile. |
| Sujets/détail | En-tête statut+échéance, médias, panneau validation, fil d'activité horodaté. |
| Piges & paiements | DataTable dense, montants mono alignés droite, badge période verrouillée, modale paiement. |
| JRI | Fiche 360° en tabs (profil/tarifs·sujets·revenus·matériel), IBAN masqué. |
| Parc/Matériel | DataTable + QR ; détail = infos/maintenance/incidents/dotations. |
| Dotations | Mobile-first, SignaturePad, photos, états. |
| Finance/Budget | Cockpit unique, budget vs réalisé, drill-down. |
| Login | Carte centrée, sans identifiants pré-remplis, étape 2FA. |

## 9. Ordre d'implémentation (étape 2)

1. **Fondations** : tokens light/dark dans `globals.css` + `tailwind.config` (mono, sémantiques) + `ThemeToggle` + Lucide.
2. **Composants partagés** : `StatutBadge`, `MoneyMono`, `Button`, `Table` (tri), `EmptyState`, `Skeleton`, `Toast`.
3. **Par écran** : Dashboard → Planning → Sujets → Piges → Parc/Dotations → JRI → Finance → Login.
