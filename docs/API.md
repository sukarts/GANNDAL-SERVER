# API REST — GANNDAL

Base URL : `/api`. Auth : header `Authorization: Bearer <accessToken>` (sauf `/auth/login`, `/auth/refresh`, `/health`).

Réponses d'erreur : `{ "error": string, "details"?: any }` avec le code HTTP approprié.

## Authentification
| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| POST | `/auth/login` | public | `{ email, password }` → `{ accessToken, refreshToken, user }` |
| POST | `/auth/refresh` | public | `{ refreshToken }` → `{ accessToken }` |
| POST | `/auth/logout` | auth | révoque le refresh token |
| GET | `/auth/me` | auth | profil courant (+ jriProfile) |
| PATCH | `/auth/profile` | auth | met à jour son profil (nom, prénom, téléphone) |
| POST | `/auth/change-password` | auth | change son mot de passe (révoque les sessions) |
| GET | `/auth/invitation/:token` | public | valide un token d'invitation |
| POST | `/auth/accept-invitation` | public | définit le mot de passe, active, connecte |

## Utilisateurs / JRI
| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| GET | `/users?role=JRI` | ADMIN, REDACTEUR, COMPTABLE | liste (filtre rôle) |
| POST | `/users` | ADMIN | création (tous rôles ; crée JriProfile si role=JRI) |
| POST | `/users/invite` | ADMIN | invite par email (compte inactif + lien d'activation 7 j) |
| GET | `/users/:id` | auth | fiche + historique livraisons / dotations / fiches |
| PATCH | `/users/:id` | ADMIN | édition (nom, prénom, email, téléphone, rôle, actif) |
| PATCH | `/users/:id/jri-profile` | ADMIN | tarifs (sujet/minute/personnalisé), IBAN, spécialité |
| PATCH | `/users/:id/toggle-actif` | ADMIN | activer/désactiver |
| POST | `/users/:id/reset-password` | ADMIN | réinitialise le mot de passe |

## Sujets
| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| GET | `/sujets?statut=&jriId=` | auth | liste (JRI = ses sujets) |
| GET | `/sujets/:id` | auth | détail + éléments + validations |
| POST | `/sujets` | ADMIN, REDACTEUR | création + attribution |
| PATCH | `/sujets/:id` | ADMIN, REDACTEUR | mise à jour / réattribution |
| PATCH | `/sujets/:id/statut` | auth (JRI) | `{ statut: EN_COURS\|LIVRE }` |
| POST | `/sujets/:id/validation` | ADMIN, REDACTEUR | `{ action, commentaire }` (VALIDE/REJETE/CORRECTION) |
| POST | `/sujets/:id/elements` | auth | upload `multipart/form-data` (`fichier`, `type`) → S3 + versioning |

## Piges & paiements
| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| POST | `/paiements/calculer` | ADMIN, COMPTABLE | `{ jriId, annee, mois, bonus?, penalites? }` → calcul auto |
| GET | `/paiements?jriId=&annee=&mois=` | auth | liste (JRI = ses fiches) |
| GET | `/paiements/:id` | auth | détail fiche + lignes |
| POST | `/paiements/:id/pdf` | ADMIN, COMPTABLE | génère le PDF (S3) |
| GET | `/paiements/export/excel?annee=&mois=` | ADMIN, COMPTABLE | export XLSX |
| PATCH | `/paiements/:id/payer` | ADMIN, COMPTABLE | marque payée + notifie |

## Équipements
| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| GET | `/materiel/categories` | auth | liste catégories |
| POST | `/materiel/categories` | ADMIN, REDACTEUR | crée une catégorie |
| GET | `/materiel/inventaire` | ADMIN, REDACTEUR, COMPTABLE | tableau de bord parc |
| GET | `/materiel?statut=&categorieId=` | auth | liste |
| GET | `/materiel/:id` | auth | fiche + dotations + maintenances + incidents |
| POST | `/materiel` | ADMIN, REDACTEUR | création + QR Code auto |
| PATCH | `/materiel/:id` | ADMIN, REDACTEUR | mise à jour |
| POST | `/materiel/:id/maintenance` | ADMIN, REDACTEUR | ticket de maintenance |
| POST | `/materiel/:id/incident` | auth | déclaration (panne/perte/vol/dégradation) |

## Dotations
| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| GET | `/dotations?jriId=&statut=` | auth | liste (JRI = les siennes) |
| POST | `/dotations` | ADMIN, REDACTEUR | remise matériel → JRI |
| POST | `/dotations/:id/fichier` | auth | upload photo/signature (`kind`) |
| POST | `/dotations/:id/restitution` | ADMIN, REDACTEUR | retour + calcul dégradation auto |

## Tableau de bord & rapports
| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| GET | `/dashboard/admin` | ADMIN, REDACTEUR, COMPTABLE | KPIs globaux + stats mensuelles |
| GET | `/dashboard/jri` | JRI | KPIs personnels |
| GET | `/rapports/activite?periode=jour\|semaine\|mois` | ADMIN, REDACTEUR, COMPTABLE | rapport d'activité |
| GET | `/rapports/classement-jri?periode=` | idem | classement JRI |
| GET | `/rapports/inventaire` | idem | rapport parc matériel |
| GET | `/rapports/dotations-par-jri` | idem | dotations par JRI |

## Devises (multi-currency)
Devise de base = **GNF** (`tauxGnf = 1`). Tous les montants sont stockés en GNF ; la conversion se fait à l'affichage/export.
| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| GET | `/currencies?all=true` | auth | liste des devises (actives, ou toutes) |
| GET | `/currencies/convert?amount=&from=&to=` | auth | convertit un montant |
| POST | `/currencies` | ADMIN | crée une devise `{ code, nom, symbole, tauxGnf }` |
| PATCH | `/currencies/:code` | ADMIN | met à jour taux / nom / symbole / actif |
| PATCH | `/currencies/:code/defaut` | ADMIN | définit la devise par défaut |

`POST /paiements/:id/pdf?devise=USD` génère le PDF dans la devise demandée (taux figé imprimé).

## Alertes (module équipements)
Scan quotidien automatique (cron 07:00) + déclenchement manuel. Génère des notifications
(interne + email) vers ADMIN/REDACTEUR pour : garantie proche d'expiration (30 j),
matériel non restitué (> 90 j), entretien en attente (> 7 j). Dédoublonnage 7 j.
| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| POST | `/alertes/run` | ADMIN, REDACTEUR | lance le scan, retourne `{ garantie, nonRestitue, entretien, total }` |

## Notifications & audit
| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| GET | `/notifications` | auth | mes notifications + nb non lues |
| PATCH | `/notifications/:id/lu` | auth | marquer lue |
| PATCH | `/notifications/tout-lu` | auth | tout marquer lu |
| GET | `/audit?entite=&action=&userId=&page=` | ADMIN | journal paginé |

## Exemple

```bash
# Login
curl -X POST localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@ganndal.media","password":"Admin123!"}'

# Créer un sujet (avec le token reçu)
curl -X POST localhost:4000/api/sujets \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"titre":"Reportage X","jriId":"<id>","priorite":"HAUTE","dureeMinutes":4}'
```
