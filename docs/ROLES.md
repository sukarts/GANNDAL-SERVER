# Rôles & permissions — GANNDAL

Quatre rôles, contrôlés côté API par `requireRole(...)` ([`backend/src/middleware/auth.ts`](../backend/src/middleware/auth.ts)).

## Matrice des permissions

| Fonctionnalité | ADMIN | RÉDACTEUR EN CHEF | JRI / PIGISTE | COMPTABLE |
|----------------|:-----:|:-----------------:|:-------------:|:---------:|
| Gérer les utilisateurs / rôles | ✅ | — | — | — |
| Créer / éditer profils JRI & tarifs | ✅ | — | — | — |
| Voir la liste des JRI | ✅ | ✅ | — | ✅ |
| Créer / attribuer un sujet | ✅ | ✅ | — | — |
| Voir tous les sujets | ✅ | ✅ | ses sujets | — |
| Changer statut (en cours / livré) | ✅ | ✅ | ses sujets | — |
| Déposer des éléments (upload) | ✅ | ✅ | ses sujets | — |
| Valider / rejeter / corriger | ✅ | ✅ | — | — |
| Calculer & générer les piges | ✅ | — | — | ✅ |
| Voir fiches de paiement | ✅ | — | ses fiches | ✅ |
| Marquer une pige payée / exports | ✅ | — | — | ✅ |
| Catalogue matériel (CRUD) | ✅ | ✅ | — | — |
| Inventaire / valeur du parc | ✅ | ✅ | — | ✅ |
| Dotations (remise / restitution) | ✅ | ✅ | ses dotations (lecture) | — |
| Déclarer un incident matériel | ✅ | ✅ | ✅ | ✅ |
| Maintenance | ✅ | ✅ | — | — |
| Rapports | ✅ | ✅ | — | ✅ |
| Journal d'audit | ✅ | — | — | — |
| Notifications (les siennes) | ✅ | ✅ | ✅ | ✅ |

## Description des rôles

- **Administrateur** — accès total. Gère les comptes, les rôles, les tarifs, le matériel et consulte l'audit.
- **Rédacteur en chef** — pilotage éditorial : création/attribution des sujets, validation des livrables, gestion du matériel et des dotations.
- **JRI / Pigiste** — exécution : voit ses sujets, dépose ses éléments, change le statut (en cours/livré), consulte ses piges et le matériel qu'il détient.
- **Comptable** — finances : calcule et génère les piges, exporte (PDF/Excel), marque les paiements, consulte rapports et inventaire (valeur).

## Sécurité

- JWT access token (courte durée) + refresh token persistant et révocable.
- Mots de passe hachés `bcrypt`.
- Filtrage des données au niveau requête (un JRI ne lit jamais les données d'un autre).
- Toute mutation sensible est journalisée (`AuditLog`).
