# Phase 12 — Backlog

Structure : **Epic → Story → sous-tâches**. Priorité MoSCoW (Must/Should/Could/Won't). Complexité en points (Fibonacci). Estimation indicative (j-h ≈ complexité×0,7). Risque L/M/H.

> AC détaillés : voir `03-CAHIER-DES-CHARGES.md`. Ordonnancement : voir `13-ROADMAP.md`.
> **Mono-org (D1=A)** : l'EPIC « multi-tenant » et l'EPIC « Enterprise » sont supprimés. A2/A3/A4 (Organisation/RLS/séquences par org) abandonnés.

---

## EPIC A — Socle (fondation)
| Story | Prio | Cx | Risque | Sous-tâches | État |
|-------|------|----|--------|-------------|------|
| A1 Passer à Prisma Migrate (baseline) | Must | 5 | H | baseline schéma, pipeline migrate deploy, doc rollback | ✅ fait |
| A5 Chiffrement PII (IBAN/banque) | Must | 5 | M | chiffrement applicatif, masquage UI | |

## EPIC B — Sécurité & auth
| B1 Refresh silencieux (intercepteur FE) | Must | 3 | M | rotation, retry file, logout si révoqué |
| B2 Rate-limit + lockout login | Must | 3 | M | compteur Redis, email alerte |
| B3 2FA TOTP | Should | 5 | M | secret chiffré, enable/verify, recovery codes |
| B4 Reset password | Must | 3 | L | token, email, form |
| B5 Politique mot de passe + seed prod-safe | Must | 2 | L | zxcvbn, comptes démo hors prod (✅ seed fait) |
| B6 Secrets hors dépôt (coffre) + rotation DS-02 | Must | 3 | M | SOPS/Docker secrets, roter DB/PAT/SMTP exposés |

## EPIC C — Éditorial
| C1 Machine à états serveur (sujets) | Must | 5 | M | transitions, 409, tests |
| C2 Uploads médias résumables (multipart) | Must | 13 | H | init/complete, reprise, quota, statut |
| C3 Pipeline média async (vignettes/AV/transcodage) | Should | 13 | H | workers, HLS preview, scan |
| C4 Validation liée aux versions + motifs | Should | 5 | M | versionRef, motifs normalisés |
| C5 Fil d'activité sujet | Could | 3 | L | events → timeline |

## EPIC D — Pige & finance
| D1 Génération mensuelle en masse (brouillons) | Must | 8 | M | job, snapshot tarifs |
| D2 Verrou de période | Must | 3 | M | flag, 409, audit ré-ouverture |
| D3 Snapshot tarif sur lignes | Must | 3 | M | copie tarif au calcul |
| D4 Relances impayés graduées J+15/30/45 | Should | 3 | L | seuils, notifications |
| D5 Reçu PDF + notif JRI payé | Should | 3 | L | template, event |
| D6 Historisation taux + gel sur documents | Should | 5 | M | TauxChange, blocage si taux manquant |
| D7 Fusion Finance⊃Budgets + alerte dépassement temps réel | Should | 5 | M | event budget.exceeded |
| D8 Attestation annuelle (auto janvier) | Could | 3 | L | job planifié |

## EPIC E — Parc & dotations
| E1 Barème dégradation configurable (table) | Should | 5 | M | extraire de calc.ts, UI |
| E2 Scan QR mobile remise/retour | Should | 8 | M | PWA caméra, deep link |
| E3 Fiche responsabilité PDF + signature hash | Should | 5 | M | hash+timestamp, PDF |
| E4 Alerte dotation non signée | Should | 2 | L | (fait) généraliser |
| E5 QR auto à la création + backfill | Must | 3 | L | hook création, script |

## EPIC F — Notifications & alertes
| F1 File asynchrone (BullMQ) | Must | 8 | M | workers, retries, DLQ |
| F2 Cron → jobs repeatable + lock | Must | 5 | M | migrer node-cron |
| F3 Préférences par utilisateur/canal | Should | 5 | L | table, UI |
| F4 SMS/push fallback | Could | 5 | M | provider SMS, web push |
| F5 Digest hebdo par rôle | Should | 3 | L | job, template |

## EPIC G — Frontend & UX
| G1 Réduire `use client` (RSC/SSR) | Should | 13 | M | migrer pages liste en serveur |
| G2 Design System (Storybook, Radix) | Should | 13 | M | tokens, composants, dark mode |
| G3 Dark mode | Should | 5 | L | tokens, toggle |
| G4 PWA offline + file d'uploads | Should | 8 | H | SW, IndexedDB queue |
| G5 Onboarding guidé + import Excel | Should | 8 | M | wizard, parser xlsx |
| G6 Accessibilité AA (audit + fixes) | Must | 8 | M | clavier, ARIA, contrastes |
| G7 i18n complet (pages staff) | Should | 5 | L | clés manquantes |
| G8 Recherche globale (FTS) | Should | 5 | M | tsvector, UI |

## EPIC H — Observabilité & qualité
| H1 Logs structurés + requestId | Must | 3 | L | pino, middleware | ✅ fait |
| H2 Métriques + traces (OTel/Prometheus) | Should | 8 | M | instrumentation, Grafana |
| H3 Sentry (erreurs FE/BE) | Must | 2 | L | SDK, sourcemaps (besoin DSN) |
| H4 Tests API (supertest) parcours critiques | Must | 8 | M | auth, sujets, paie, dotations |
| H5 Tests E2E (Playwright) | Should | 8 | M | login→sujet→valider→payer |
| H6 CI (lint/typecheck/test/migrate/audit) | Must | 5 | M | GitHub Actions | ✅ fait |
| H7 Tests de charge (k6) endpoints chauds | Could | 3 | L | scénarios |

## EPIC I — Infra
| I1a Backup quotidien Postgres | Must | 3 | L | service compose | ✅ fait |
| I1b PITR (WAL archivé) + backup offsite | Should | 5 | M | archive_command, rsync distant |
| I2 Réplicas backend/worker (stateless) | Could | 5 | M | proxy, healthchecks (charge interne faible) |
| I3 CDN devant médias | Could | 3 | L | preview publics |

## Récapitulatif priorités (mono-org)
- **Fait (Sprint 0)** : A1, B5, F(cron alertes existant), H1, H6, I1a.
- **Must (V1)** : A5, B1, B2, B3, B4, B6, C1, D1, D2, D3, DM-01, E5, F1, F2, H3, H4.
- **Should (V1/V2)** : C2, C3, C4, D4, D5, D6, D7, E1, E3, F3, F5, G1, G2, G3, G6, G7, G8, H2, H5, I1b.
- **Could/plus tard** : C5, D8, E2, F4, G4, H7, I2, I3.
- **Abandonné (mono-org)** : A2/A3/A4 (multi-tenant), tout l'ex-EPIC Enterprise (SSO, API publique, webhooks, K8s-HA, WORM), G5 onboarding self-service.
