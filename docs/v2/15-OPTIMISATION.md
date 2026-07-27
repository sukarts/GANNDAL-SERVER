# Phase 15 — Optimisation concurrentielle

Objectif : passer de « meilleur qu'Excel » à « incontournable ». Chaque idée : proposition → justification → priorité.

## 15.1 Différenciateurs produit

1. **Portail JRI mobile-first PWA offline** *(Must V2)*
   Le JRI travaille sur le terrain, réseau faible. Un portail installable qui met en file les uploads et fonctionne hors ligne = avantage décisif vs tout concurrent généraliste. → *Justif* : c'est le point de douleur n°1 des personas P3.

2. **Uploads résumables + preview transcodée** *(Must V2)*
   Vidéos lourdes sans échec, preview HLS légère pour valider sans télécharger l'original. → *Justif* : réduit les allers-retours de validation et l'abandon d'upload.

3. **Paie « zéro Excel » : génération de masse + verrou + snapshot + attestation auto** *(Must)*
   Un clic = toutes les fiches du mois, tarifs figés, période verrouillée, reçus et attestation annuelle automatiques. → *Justif* : supprime la douleur n°1 de la compta et les litiges.

4. **Multi-devise à valeur probante (taux gelés + historisation)** *(Should)*
   Les documents émis conservent leur taux ; aucun concurrent du segment ne le fait proprement. → *Justif* : conformité comptable pour équipes internationales.

5. **Responsabilité matériel « preuve forte » : signature horodatée+hash, fiche PDF, QR scan mobile** *(Should)*
   Transforme la dotation en document opposable. → *Justif* : récupère l'argent des dégradations, réduit les pertes.

6. **Onboarding self-service + import Excel** *(Must V2)*
   Migration depuis l'existant (Excel) en un import. → *Justif* : lève le frein d'adoption majeur (habitude Excel).

## 15.2 Différenciateurs techniques

7. **Multi-tenant RLS souverain, auto-hébergeable** *(Must)*
   Vendable en SaaS mutualisé **ou** déployable chez le client (souveraineté des données — argument fort en Afrique francophone). → *Justif* : couvre deux marchés avec une base de code.

8. **Recherche FTS instantanée + raccourcis clavier** *(Should)*
   Productivité staff type outil « pro ». → *Justif* : rétention des power users.

9. **Automatisations natives** *(Should)* — déjà amorcées (alertes) :
   échéance J-2, escalade validation, relances impayées graduées, digest hebdo, backup quotidien. Étendre à des **règles configurables par org**. → *Justif* : l'outil « travaille tout seul ».

10. **API + webhooks (Enterprise)** *(Could)*
    Intégration à la compta/CMS du client. → *Justif* : verrou d'intégration, montée en gamme.

## 15.3 Idées à réinventer

- **Fusion Finance/Budgets/Rapports** en un **cockpit financier** unique avec drill-down (supprime la redondance actuelle).
- **Fil d'activité par sujet** (type timeline) au lieu de statuts éparpillés : lisibilité du « qui a fait quoi quand ».
- **Notation/scoring JRI** (ponctualité, taux de validation, dégradations) pour aider l'assignation — *option, éthique à cadrer* (transparence vis-à-vis du JRI).
- **Marketplace de piges** (long terme) : publier un sujet ouvert, des JRI candidatent. Effet réseau.

## 15.4 Optimisations performance/coût

- **Tiering stockage médias** : originaux en stockage froid après validation, preview en chaud/CDN → coût maîtrisé (poste n°1).
- **Cache d'agrégats dashboard** (Redis, invalidation événementielle) → dashboards instantanés.
- **RSC/SSR** → moins de JS, TTI réduit, meilleure perception sur mobiles bas de gamme.
- **Read-replica** pour rapports lourds → n'impacte pas l'OLTP.

## 15.5 Priorisation (impact × effort)

| Idée | Impact | Effort | Verdict |
|------|--------|--------|---------|
| Portail JRI PWA offline (1) | Élevé | Moyen | **V2 prioritaire** |
| Paie zéro-Excel (3) | Élevé | Moyen | **MVP/V1** |
| Onboarding + import (6) | Élevé | Moyen | **V2** |
| Multi-tenant souverain (7) | Élevé | Élevé | **MVP (fondation)** |
| Uploads/preview (2) | Élevé | Élevé | **V1/V2** |
| Taux gelés (4) | Moyen | Moyen | **V1** |
| Preuve matériel (5) | Moyen | Moyen | **V1** |
| API/webhooks (10) | Moyen | Élevé | **Enterprise** |
| Marketplace | Élevé | Très élevé | **Vision (post-V3)** |
