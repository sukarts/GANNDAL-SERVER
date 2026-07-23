import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../lib/http.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

export const rapportsRouter = Router();
rapportsRouter.use(authenticate);
rapportsRouter.use(requireRole('ADMIN', 'REDACTEUR', 'COMPTABLE'));

function bornes(periode: string): { debut: Date; fin: Date } {
  const fin = new Date();
  const debut = new Date(fin);
  if (periode === 'jour') debut.setDate(fin.getDate() - 1);
  else if (periode === 'semaine') debut.setDate(fin.getDate() - 7);
  else debut.setMonth(fin.getMonth() - 1); // mois par défaut
  return { debut, fin };
}

// Rapport d'activité (jour / semaine / mois)
rapportsRouter.get(
  '/activite',
  asyncHandler(async (req, res) => {
    const periode = (req.query.periode as string) ?? 'mois';
    const { debut, fin } = bornes(periode);
    const [crees, livres, valides, rejetes] = await Promise.all([
      prisma.sujet.count({ where: { createdAt: { gte: debut, lte: fin } } }),
      prisma.sujet.count({ where: { livreLe: { gte: debut, lte: fin } } }),
      prisma.sujet.count({ where: { valideLe: { gte: debut, lte: fin } } }),
      prisma.sujet.count({ where: { statut: 'REJETE', updatedAt: { gte: debut, lte: fin } } }),
    ]);
    res.json({ periode, debut, fin, crees, livres, valides, rejetes });
  }),
);

// Classement des JRI (par sujets validés sur la période)
rapportsRouter.get(
  '/classement-jri',
  asyncHandler(async (req, res) => {
    const periode = (req.query.periode as string) ?? 'mois';
    const { debut, fin } = bornes(periode);
    const grouped = await prisma.sujet.groupBy({
      by: ['jriId'],
      where: { statut: 'VALIDE', valideLe: { gte: debut, lte: fin }, jriId: { not: null } },
      _count: { _all: true },
      _sum: { dureeMinutes: true },
    });
    const jris = await prisma.user.findMany({ where: { id: { in: grouped.map((g) => g.jriId!).filter(Boolean) } } });
    const classement = grouped
      .map((g) => {
        const jri = jris.find((j) => j.id === g.jriId);
        return {
          jriId: g.jriId,
          nom: jri ? `${jri.prenom} ${jri.nom}` : '—',
          sujets: g._count._all,
          minutes: g._sum.dureeMinutes ?? 0,
        };
      })
      .sort((a, b) => b.sujets - a.sujets);
    res.json(classement);
  }),
);

// Évolution mensuelle des piges (montant total + nb de fiches) sur une année
rapportsRouter.get(
  '/evolution-piges',
  asyncHandler(async (req, res) => {
    const annee = Number(req.query.annee) || new Date().getFullYear();
    const fiches = await prisma.fichePaiement.findMany({
      where: { annee },
      select: { mois: true, montantTotal: true },
    });
    const parMois = Array.from({ length: 12 }, (_, i) => ({ mois: i + 1, montant: 0, fiches: 0 }));
    for (const f of fiches) {
      const idx = f.mois - 1;
      if (idx >= 0 && idx < 12) {
        parMois[idx].montant += Number(f.montantTotal);
        parMois[idx].fiches += 1;
      }
    }
    res.json({ annee, parMois });
  }),
);

// Rapport inventaire / parc matériel
rapportsRouter.get(
  '/inventaire',
  asyncHandler(async (_req, res) => {
    const parCategorie = await prisma.materiel.groupBy({
      by: ['categorieId'],
      _count: true,
      _sum: { coutAcquisition: true },
    });
    const cats = await prisma.categorieMateriel.findMany();
    const maintenance = await prisma.maintenance.aggregate({ _sum: { cout: true }, _count: true });
    const pertes = await prisma.incidentMateriel.count({ where: { type: { in: ['PERTE', 'VOL'] } } });
    res.json({
      parCategorie: parCategorie.map((p) => ({
        categorie: cats.find((c) => c.id === p.categorieId)?.nom ?? '—',
        nombre: p._count,
        valeur: Number(p._sum.coutAcquisition ?? 0),
      })),
      coutMaintenanceTotal: Number(maintenance._sum.cout ?? 0),
      nbTicketsMaintenance: maintenance._count,
      pertesEtVols: pertes,
    });
  }),
);

// Dotations par JRI
rapportsRouter.get(
  '/dotations-par-jri',
  asyncHandler(async (_req, res) => {
    const grouped = await prisma.dotation.groupBy({
      by: ['jriId', 'statut'],
      _count: true,
    });
    res.json(grouped);
  }),
);
