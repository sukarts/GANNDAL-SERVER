import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../lib/http.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

// Tableau de bord admin
dashboardRouter.get(
  '/admin',
  requireRole('ADMIN', 'REDACTEUR', 'COMPTABLE'),
  asyncHandler(async (_req, res) => {
    const [nbJri, livres, valides, fichesAPayer] = await Promise.all([
      prisma.user.count({ where: { role: 'JRI', actif: true } }),
      prisma.sujet.count({ where: { statut: 'LIVRE' } }),
      prisma.sujet.count({ where: { statut: 'VALIDE' } }),
      prisma.fichePaiement.aggregate({
        where: { statut: { in: ['GENEREE', 'BROUILLON'] } },
        _sum: { montantTotal: true },
      }),
    ]);

    // Statistiques mensuelles (12 derniers mois) — sujets validés par mois
    const annee = new Date().getFullYear();
    const sujetsValides = await prisma.sujet.findMany({
      where: { statut: 'VALIDE', valideLe: { gte: new Date(annee, 0, 1) } },
      select: { valideLe: true },
    });
    const parMois = Array.from({ length: 12 }, (_, i) => ({ mois: i + 1, sujets: 0 }));
    sujetsValides.forEach((s) => {
      if (s.valideLe) parMois[s.valideLe.getMonth()].sujets++;
    });

    res.json({
      nbJri,
      sujetsLivres: livres,
      sujetsValides: valides,
      montantAPayer: Number(fichesAPayer._sum.montantTotal ?? 0),
      statistiquesMensuelles: parMois,
    });
  }),
);

// Tableau de bord JRI personnel
dashboardRouter.get(
  '/jri',
  requireRole('JRI'),
  asyncHandler(async (req, res) => {
    const jriId = req.user!.sub;
    const [assignes, enCours, valides, materiels, derniereFiche] = await Promise.all([
      prisma.sujet.count({ where: { jriId, statut: 'ASSIGNE' } }),
      prisma.sujet.count({ where: { jriId, statut: 'EN_COURS' } }),
      prisma.sujet.count({ where: { jriId, statut: 'VALIDE' } }),
      prisma.dotation.count({ where: { jriId, statut: 'EN_COURS' } }),
      prisma.fichePaiement.findFirst({ where: { jriId }, orderBy: [{ annee: 'desc' }, { mois: 'desc' }] }),
    ]);
    res.json({ assignes, enCours, valides, materielsDetenus: materiels, derniereFiche });
  }),
);
