# Phase 12 — Backlog

Structure : **Epic → Story → sous-tâches**. Priorité MoSCoW (Must/Should/Could/Won't). Complexité en points (Fibonacci). Estimation indicative (j-h ≈ complexité×0,7). Risque L/M/H.

> AC détaillés : voir `03-CAHIER-DES-CHARGES.md`. Ordonnancement : voir `13-ROADMAP.md`.

---

## EPIC A — Socle multi-tenant & migrations (fondation)
| Story | Prio | Cx | Risque | Sous-tâches |
|-------|------|----|--------|-------------|
| A1 Passer à Prisma Migrate (baseline) | Must | 5 | H | baseline schéma, pipeline migrate deploy, doc rollback |
| A2 Modèle Organisation + `organisationId` partout | Must | 13 | H | migration additive, backfill, NOT NULL |
| A3 RLS Postgres + contexte tenant | Must | 8 | H | policies, `set app.org_id`, tests d'isolation |
| A4 Références/séquences par org | Must | 3 | M | SUJ/PIGE par org |
| A5 Chiffrement PII (IBAN/banque) | Must | 5 | M | pgcrypto/app-level, masquage UI |

## EPIC B — Sécurité & auth
| B1 Refresh silencieux (intercepteur FE) | Must | 3 | M | rotation, retry file, logout si révoqué |
| B2 Rate-limit + lockout login | Must | 3 | M | compteur Redis, email alerte |
| B3 2FA TOTP | Should | 5 | M | secret chiffré, enable/verify, recovery codes |
| B4 Reset password | Must | 3 | L | token, email, form |
| B5 Politique mot de passe + rotation démo | Must | 2 | L | zxcvbn, supprimer comptes démo prod |
| B6 Secrets hors dépôt (coffre) | Must | 3 | M | SOPS/Docker secrets |

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
| H1 Logs structurés + requestId/tenantId | Must | 3 | L | pino, middleware |
| H2 Métriques + traces (OTel/Prometheus) | Should | 8 | M | instrumentation, Grafana |
| H3 Sentry (erreurs FE/BE) | Must | 2 | L | SDK, sourcemaps |
| H4 Tests API (supertest) parcours critiques | Must | 8 | M | auth, sujets, paie, dotations |
| H5 Tests E2E (Playwright) | Should | 8 | M | login→sujet→valider→payer |
| H6 CI/CD (lint/typecheck/test/scan/deploy) | Must | 5 | M | GitHub Actions, envs |
| H7 Tests de charge (k6) endpoints chauds | Could | 3 | L | scénarios |

## EPIC I — Infra & HA
| I1 Backups externalisés + PITR | Must | 5 | M | WAL archivé, offsite |
| I2 Réplicas backend/worker (stateless) | Should | 5 | M | proxy, healthchecks |
| I3 CDN devant médias | Should | 3 | L | preview publics |
| I4 K8s (palier HA) | Won't(V2) | 13 | H | différé Enterprise |

## EPIC J — Enterprise
| J1 SSO SAML/OIDC | Could | 13 | M | |
| J2 API publique + clés | Could | 8 | M | quotas, OpenAPI |
| J3 Webhooks signés + retries | Could | 8 | M | HMAC, DLQ |
| J4 Audit immutable + rétention | Should | 5 | M | append-only, WORM |

## Récapitulatif priorités
- **Must (bloquant V2)** : A1–A5, B1–B2,B4–B6, C1–C2, D1–D3, E5, F1–F2, G6, H1,H3–H4,H6, I1.
- **Should** : le gros de C/D/E/F/G/H/I restants.
- **Could/Won't(V2)** : E2 scan, F4, H7, I4 K8s, EPIC J (Enterprise).
