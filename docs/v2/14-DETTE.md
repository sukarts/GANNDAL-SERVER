# Phase 14 — Audit qualité & dette

Sévérité : 🔴 critique · 🟠 majeure · 🟡 mineure. Chaque item : constat → correction → story liée.

## Dette technique
| ID | Sév | Constat | Correction | Story |
|----|-----|---------|-----------|-------|
| DT-01 | 🔴 | Prod sur `prisma db push --accept-data-loss` : pas d'historique, risque perte données | Prisma Migrate versionné + baseline | A1 |
| DT-02 | 🔴 | Mono-tenant : non vendable en SaaS | Organisation + RLS | A2/A3 |
| DT-03 | 🟠 | Frontend 100 % `'use client'` : pas de SSR, JS lourd, SEO faible | Migrer listes/detail en RSC/SSR | G1 |
| DT-04 | 🟠 | Notifications envoyées **synchrones** dans le flux métier (latence, couplage) | File BullMQ | F1 |
| DT-05 | 🟠 | `node-cron` mono-instance : double exécution si scale horizontal | Jobs repeatable + lock | F2 |
| DT-06 | 🟠 | Pas de tests API/E2E (seulement calc) | supertest + Playwright | H4/H5 |
| DT-07 | 🟠 | Barème dégradation en dur (`calc.ts`) | Table configurable/org | E1 |
| DT-08 | 🟡 | Composants dupliqués (badges, money) divergents | Design System + composants uniques | G2 |
| DT-09 | 🟡 | Emoji comme icônes UI (☰ 🔔) | Set Lucide | G2 |
| DT-10 | 🟠 | Pas de pipeline média (pas de vignette/transcodage/AV) | Workers média | C3 |
| DT-11 | 🟡 | Taux de change non historisés (documents passés faussés si taux change) | TauxChange + gel | D6 |
| DT-12 | 🟠 | Transitions de statut sujet non contraintes serveur (confiance client) | Machine à états API | C1 |

## Dette UX
| ID | Sév | Constat | Correction | Story |
|----|-----|---------|-----------|-------|
| DU-01 | 🟠 | Access token 15 min → « Token invalide » brutal, re-login fréquent | Refresh silencieux | B1 |
| DU-02 | 🟠 | Pas d'onboarding : premier usage aride | Wizard + import Excel | G5 |
| DU-03 | 🟡 | États vides/erreur non standardisés | Motifs empty/error | G6/DS |
| DU-04 | 🟠 | Uploads lourds sans reprise sur réseau faible (terrain JRI) | Uploads résumables + PWA offline | C2/G4 |
| DU-05 | 🟡 | i18n EN incomplète (pages staff) | Compléter clés | G7 |
| DU-06 | 🟠 | Accessibilité non vérifiée (drag&drop, contrastes, clavier) | Audit AA + fixes | G6 |
| DU-07 | 🟡 | Pas de dark mode | Tokens + toggle | G3 |

## Dette produit
| ID | Sév | Constat | Correction | Story |
|----|-----|---------|-----------|-------|
| DP-01 | 🟠 | Calcul de pige manuel un par un (pénible en volume) | Génération de masse | D1 |
| DP-02 | 🟡 | Finance/Budgets/Rapports se recouvrent | Fusion Finance⊃Budgets | D7 |
| DP-03 | 🟡 | Pas de relances impayés graduées | J+15/30/45 | D4 |
| DP-04 | 🟡 | Pas de portail JRI dédié mobile | Bottom nav + vues JRI | G (V2) |
| DP-05 | 🟡 | Pas de recherche globale | FTS | G8 |

## Dette métier
| ID | Sév | Constat | Correction | Story |
|----|-----|---------|-----------|-------|
| DM-01 | 🔴 | Fiche `PAYEE` potentiellement modifiable (pas d'invariant fort) | Immutabilité RG-02 | D2/D3 |
| DM-02 | 🟠 | Pas de verrou de période comptable | Verrou + audit ré-ouverture | D2 |
| DM-03 | 🟠 | Tarif non figé sur les lignes (recalcul rétroactif possible) | Snapshot RG-03 | D3 |
| DM-04 | 🟡 | Devise pivot globale (GNF) inadaptée au multi-org international | Devise pivot/org | D6/A2 |
| DM-05 | 🟡 | Signature dotation sans horodatage/hash (valeur probante faible) | Hash + timestamp | E3 |

## Dette sécurité
| ID | Sév | Constat | Correction | Story |
|----|-----|---------|-----------|-------|
| DS-01 | 🔴 | Comptes démo (`Admin123!`) en prod | Supprimer/roter, forcer reset | B5 |
| DS-02 | 🔴 | Secrets sensibles ont transité en clair (chat) : DB pwd, PAT GitHub, clé SMTP Brevo | **Révoquer/roter tous**, coffre à secrets | B6 |
| DS-03 | 🟠 | Pas de rate-limit / lockout login (brute force) | Rate-limit + lockout | B2 |
| DS-04 | 🟠 | Pas de 2FA | TOTP | B3 |
| DS-05 | 🟠 | PII bancaire (IBAN) non chiffrée au repos | Chiffrement | A5 |
| DS-06 | 🟠 | Isolation tenant absente (avant RLS) | RLS + tests | A3 |
| DS-07 | 🟡 | Pas de CSP stricte / audit dépendances | helmet CSP + `npm audit`/Trivy en CI | H6 |
| DS-08 | 🟡 | Audit métier à couverture partielle | Middleware audit systématique | J4 |

## Plan de remboursement (ordre)
1. **Bloquants prod/vente** : DS-01, DS-02, DT-01, DT-02/DS-06, DM-01/DM-03. → Sprint 0 + MVP.
2. **Confiance** : DT-04/05/06/12, DU-01/04, DS-03/04/05. → MVP/V1.
3. **Qualité/adoption** : DT-03/07/08/10/11, DU-02/03/05/06/07, DP-*, DM-*. → V1/V2.
