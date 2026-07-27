# Phase 7 — Documentation API

## 7.1 Principes

- **REST** JSON, versionnée : préfixe `/api/v1`. (GraphQL écarté : besoins CRUD standards, coût schéma/tooling non justifié.)
- **Auth** : `Authorization: Bearer <access>` ; API key (Enterprise) `X-Api-Key`.
- **Multi-tenant** : tenant déduit du token (jamais d'`organisationId` en paramètre client).
- **Format d'erreur** unifié :
```json
{ "error": { "code": "SUJET_TRANSITION_INVALIDE", "message": "…", "details": {…}, "requestId": "…" } }
```
- **Codes** : 200/201/204 ; 400 (validation Zod), 401, 403, 404, 409 (conflit métier), 410, 413/415 (upload), 422, 423 (verrouillé), 429 (rate-limit), 500.
- **Idempotence** : `Idempotency-Key` sur POST sensibles (calcul pige, paiement).

## 7.2 Conventions liste (pagination/tri/filtre/recherche)

Tous les endpoints de collection acceptent :
- `?page=1&limit=25` (max 100) → réponse avec en-tête `X-Total-Count` + corps `{ items, total, page, limit }`.
- `?sort=-createdAt` (préfixe `-` = desc), champs autorisés listés par ressource.
- `?q=texte` → recherche FTS (Postgres tsvector).
- Filtres typés par ressource : `?statut=EN_COURS&jriId=…&from=2026-01-01&to=2026-01-31`.

## 7.3 Endpoints par module

> Permissions : A=ADMIN, R=REDACTEUR, J=JRI, C=COMPTABLE. « self » = limité à ses propres ressources.

### Auth & IAM
| Méthode | Endpoint | Perms | Description |
|--------|----------|-------|-------------|
| POST | `/auth/login` | public | email+password → `{accessToken, refreshToken, user}` (+ `mfaRequired` si 2FA) |
| POST | `/auth/2fa/verify` | public(step) | code TOTP → tokens |
| POST | `/auth/refresh` | cookie/refresh | rotation du refresh, nouvel access |
| POST | `/auth/logout` | auth | révoque le refresh |
| POST | `/auth/password/forgot` | public | envoie email reset |
| POST | `/auth/password/reset` | public(token) | applique le nouveau mot de passe |
| GET | `/auth/me` | auth | profil courant |
| POST | `/auth/2fa/enable` / `/disable` | self | active/désactive TOTP |

**Exemple login**
```http
POST /api/v1/auth/login
{ "email": "fatou@ex.com", "password": "••••" }
→ 200 { "accessToken":"…", "refreshToken":"…", "user":{"id","role","organisationId"} }
→ 401 { "error": { "code":"IDENTIFIANTS_INVALIDES" } }
→ 423 { "error": { "code":"COMPTE_VERROUILLE","details":{"until":"…"} } }
```

### Invitations
| POST | `/invitations` | A | invite (email, rôle) |
| GET | `/invitations/:token` | public | détail invitation |
| POST | `/invitations/:token/accept` | public | crée le compte (nom, mdp) |

### Organisation & paramètres
| GET/PATCH | `/org` | A(read: tous) | paramètres org |
| GET/POST/PATCH/DELETE | `/currencies` | A (read: tous) | devises + taux |
| GET/POST/PATCH/DELETE | `/categories` | A/R | catégories matériel |
| GET/PUT | `/bareme` | A | barème de dégradation |

### Utilisateurs & JRI
| GET | `/users?role=JRI&q=&page=` | A/R/C | liste paginée |
| POST | `/users` | A | créer |
| GET/PATCH | `/users/:id` | A (self: `/auth/me`) | fiche |
| PATCH | `/users/:id/jri-profile` | A (self J) | tarifs, coordonnées |
| DELETE | `/users/:id` | A | soft delete |

### Sujets
| GET | `/sujets?statut=&jriId=&q=&sort=` | A/R/J(self) | liste |
| POST | `/sujets` | A/R | créer/assigner |
| GET/PATCH/DELETE | `/sujets/:id` | A/R (J: read self) | détail |
| PATCH | `/sujets/:id/statut` | A/R (J: EN_COURS/LIVRE self) | transition (machine à états) |
| POST | `/sujets/:id/validation` | A/R | valider/rejeter |

**Exemple transition invalide**
```http
PATCH /api/v1/sujets/abc/statut { "statut":"VALIDE" }
→ 409 { "error":{ "code":"SUJET_TRANSITION_INVALIDE","details":{"from":"ASSIGNE","to":"VALIDE"} } }
```

### Médias (upload résumable)
| POST | `/sujets/:id/medias/init` | J(self)/R | init multipart → `{uploadId, partUrls[]}` |
| POST | `/sujets/:id/medias/complete` | J/R | finalise → crée `SujetElement`, incrémente version |
| GET | `/medias?type=&q=&page=` | A/R/J(self) | médiathèque paginée |
| GET | `/medias/:id/download` | perms sujet | URL présignée courte |

### Pige & paiements
| GET | `/paiements?statut=&annee=&mois=` | A/C (J: self) | fiches |
| POST | `/paiements/generer` | A/C | génère les brouillons du mois (masse) |
| POST | `/paiements/calculer` | A/C | calcule une fiche (jriId, annee, mois, bonus?, penalites?) |
| POST | `/paiements/:id/pdf` | A/C | génère la fiche PDF |
| PATCH | `/paiements/:id/payer` | A/C | mode+référence+date → PAYEE |
| POST | `/periodes/:annee/:mois/verrouiller` | A/C | verrouille la période |
| GET | `/paiements/bordereau?annee=&mois=` | A/C | bordereau PDF |
| GET | `/paiements/export/excel?annee=&mois=` | A/C | export mensuel |
| GET | `/paiements/export/comptable?annee=` | A/C | export annuel |
| GET | `/attestations/:jriId?annee=` | A/C (J self) | attestation revenus |

### Finance & budgets
| GET/POST/PATCH/DELETE | `/budgets?annee=&rubrique=` | A/C (R read) | budgets |
| GET | `/finance/consolide?annee=&mois=` | A/C | masse salariale + coûts |

### Matériel & dotations
| GET/POST | `/materiel?statut=&q=` | A/R (C read) | parc |
| GET/PATCH/DELETE | `/materiel/:id` | A/R | détail |
| POST | `/materiel/:id/maintenance` | A/R | ticket |
| POST | `/materiel/:id/incident` | A/R/J | incident |
| GET | `/materiel/:id/qr` | A/R | QR (image) |
| GET/POST | `/dotations` | A/R (J read self) | remises |
| POST | `/dotations/:id/signer` | J(self) | signature |
| POST | `/dotations/:id/retour` | A/R | retour + dégradation |
| GET | `/dotations/:id/fiche` | perms | fiche responsabilité PDF |

### Notifications
| GET | `/notifications?lu=false&page=` | self | liste |
| PATCH | `/notifications/:id/lu` | self | marquer lu |
| PATCH | `/notifications/lu-tout` | self | tout marquer |
| GET/PUT | `/notifications/preferences` | self | préférences par canal/type |

### Alertes / rapports / audit / dashboard
| POST | `/alertes/run` | A/R | déclenche le scan |
| GET | `/rapports/:type?from=&to=` | A/R/C | quotidien/hebdo/mensuel/classement |
| GET | `/audit?entite=&entiteId=&userId=&q=&page=` | A | journal |
| GET | `/dashboard` | auth | KPI selon rôle |

### API publique & Webhooks (Enterprise)
| POST/GET/DELETE | `/webhooks` | A | endpoints sortants |
| — | Événements : `sujet.validated`, `fiche.paid`, `dotation.returned`, … | signés HMAC `X-Ganndal-Signature`, retries + DLQ |
| GET | `/openapi.json` | auth | spec OpenAPI 3.1 |

## 7.4 Versioning & dépréciation

- Version dans l'URL (`/v1`). Changement cassant → `/v2` en parallèle, `/v1` marqué `Deprecation`/`Sunset` (en-têtes) avec préavis.
- Champs additifs = non cassants. Suppressions = version majeure.

## 7.5 Sécurité API

Rate-limit par IP+compte (`429` + `Retry-After`) ; quotas Enterprise par API key ; validation Zod à l'entrée ; sorties filtrées (jamais de hash/PII non requise) ; CORS liste blanche ; en-têtes de sécurité ; journalisation `requestId`.
