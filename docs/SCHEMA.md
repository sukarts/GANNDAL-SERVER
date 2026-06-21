# Schéma de base de données — GANNDAL

Source de vérité : [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma) (PostgreSQL).

## Diagramme relationnel (texte)

```
User 1───1 JriProfile
User 1───* Sujet (createur)         User 1───* Sujet (jri assigné)
Sujet 1──* SujetElement             Sujet 1──* Validation
Sujet 1──* PaiementLigne
User 1───* FichePaiement (jri)      FichePaiement 1──* PaiementLigne
CategorieMateriel 1──* Materiel
Materiel 1──* Dotation              Materiel 1──* Maintenance      Materiel 1──* IncidentMateriel
User 1───* Dotation (jri / responsable / validateur)
User 1───* Notification             User 1───* AuditLog
User 1───* RefreshToken
```

## Entités principales

### Authentification & utilisateurs
| Table | Champs clés |
|-------|-------------|
| `User` | email (unique), passwordHash, nom, prenom, telephone, **role** (`ADMIN\|REDACTEUR\|JRI\|COMPTABLE`), actif |
| `RefreshToken` | token (unique), userId, expiresAt, revoked |
| `JriProfile` | userId (1:1), **tarifParSujet**, **tarifParMinute**, **tarifPersonnalise** (JSON), iban, specialite |

### Sujets
| Table | Champs clés |
|-------|-------------|
| `Sujet` | reference (unique), titre, jriId, createdById, dateLimite, **priorite**, **statut** (`ASSIGNE\|EN_COURS\|LIVRE\|VALIDE\|REJETE`), dureeMinutes, livreLe, valideLe |
| `SujetElement` | sujetId, **type** (`VIDEO\|AUDIO\|PHOTO\|DOCUMENT`), storageKey (S3), **version**, tailleOctets |
| `Validation` | sujetId, validateurId, **action** (`VALIDE\|REJETE\|CORRECTION_DEMANDEE`), commentaire, createdAt (horodatage) |

### Comptabilisation & paiements
| Table | Champs clés |
|-------|-------------|
| `FichePaiement` | reference, jriId, annee, mois (unique par JRI+période), nbSujets, totalMinutes, montantBase, **bonus**, **penalites**, montantTotal, **statut** (`BROUILLON\|GENEREE\|PAYEE`), pdfUrl |
| `PaiementLigne` | ficheId, sujetId, libelle, quantite, tarif, montant |

### Module équipements
| Table | Champs clés |
|-------|-------------|
| `CategorieMateriel` | nom (unique) |
| `Materiel` | reference, numInventaire (unique), categorieId, marque, modele, numSerie, dateAchat, fournisseur, coutAcquisition, garantieFin, **etat**, **statut** (`DISPONIBLE\|AFFECTE\|MAINTENANCE\|PERDU\|VOLE`), qrCodeData, qrCodeUrl |
| `Dotation` | materielId, jriId, responsableId, dateRemise, etatRemise, photosRemise[], signatureUrl, observations, **statut** + champs restitution (dateRetour, etatRetour, photosRetour[], validateurId, montantDegradation) |
| `Maintenance` | materielId, datePanne, description, prestataire, cout, dateRemiseEnService |
| `IncidentMateriel` | materielId, declareById, **type** (`PANNE\|PERTE\|VOL\|DEGRADATION`), description |

### Transverse
| Table | Champs clés |
|-------|-------------|
| `Currency` | code (PK, ISO 4217), nom, symbole, **tauxGnf** (1 unité = X GNF), actif, parDefaut |
| `Notification` | userId, **canal** (`INTERNE\|EMAIL\|WHATSAPP`), titre, message, lien, lu |
| `AuditLog` | userId, action, entite, entiteId, details (JSON), ip, createdAt |

## Énumérations

- `Role` : ADMIN, REDACTEUR, JRI, COMPTABLE
- `Priorite` : BASSE, NORMALE, HAUTE, URGENTE
- `StatutSujet` : ASSIGNE, EN_COURS, LIVRE, VALIDE, REJETE
- `TypeElement` : VIDEO, AUDIO, PHOTO, DOCUMENT
- `ActionValidation` : VALIDE, REJETE, CORRECTION_DEMANDEE
- `StatutFiche` : BROUILLON, GENEREE, PAYEE
- `EtatMateriel` : NEUF, BON_ETAT, A_REPARER, HORS_SERVICE, PERDU, VOLE
- `StatutMateriel` : DISPONIBLE, AFFECTE, MAINTENANCE, PERDU, VOLE
- `StatutDotation` : EN_COURS, RESTITUE
- `TypeIncident` : PANNE, PERTE, VOL, DEGRADATION
- `CanalNotif` : INTERNE, EMAIL, WHATSAPP

## Règles de gestion notables

- **Calcul de pige** : `montantBase = nbSujetsValidés × tarifParSujet + totalMinutes × tarifParMinute`, puis `montantTotal = montantBase + bonus − penalites`. Base = sujets au statut `VALIDE` dont `valideLe` tombe dans la période.
- **Dégradation matériel** : barème automatique par état au retour (% du coût d'acquisition) — voir `dotations.routes.ts`.
- **Versioning éléments** : un fichier re-déposé sous le même nom incrémente `version`.
- **Audit** : toute action sensible écrit une ligne `AuditLog` (utilisateur + horodatage + IP).
