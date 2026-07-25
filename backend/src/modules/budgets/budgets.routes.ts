import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../lib/http.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { audit } from '../../lib/audit.js';

export const budgetsRouter = Router();
budgetsRouter.use(authenticate, requireRole('ADMIN', 'COMPTABLE', 'REDACTEUR'));

// Liste des budgets d'une période
budgetsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const annee = Number(req.query.annee) || new Date().getFullYear();
    const mois = Number(req.query.mois) || new Date().getMonth() + 1;
    const budgets = await prisma.budget.findMany({ where: { annee, mois }, orderBy: { rubrique: 'asc' } });
    res.json(budgets);
  }),
);

// Définir / mettre à jour un budget (ADMIN/COMPTABLE)
const upsertSchema = z.object({
  rubrique: z.string().min(1),
  annee: z.number().int(),
  mois: z.number().int().min(1).max(12),
  montantPrevu: z.number().nonnegative(),
});
budgetsRouter.post(
  '/',
  requireRole('ADMIN', 'COMPTABLE'),
  asyncHandler(async (req, res) => {
    const data = upsertSchema.parse(req.body);
    const budget = await prisma.budget.upsert({
      where: { rubrique_annee_mois: { rubrique: data.rubrique, annee: data.annee, mois: data.mois } },
      create: data,
      update: { montantPrevu: data.montantPrevu },
    });
    await audit({ userId: req.user!.sub, action: 'UPSERT', entite: 'Budget', entiteId: budget.id, details: data, ip: req.ip });
    res.json(budget);
  }),
);

// Comparatif prévu vs réel par rubrique
budgetsRouter.get(
  '/comparatif',
  asyncHandler(async (req, res) => {
    const annee = Number(req.query.annee) || new Date().getFullYear();
    const mois = Number(req.query.mois) || new Date().getMonth() + 1;
    const debut = new Date(annee, mois - 1, 1);
    const fin = new Date(annee, mois, 1);

    // Coût réel : sujets validés de la période, coût = tarif JRI/sujet + minutes × tarif/minute
    const sujets = await prisma.sujet.findMany({
      where: { statut: 'VALIDE', valideLe: { gte: debut, lt: fin }, rubrique: { not: null } },
      select: { rubrique: true, dureeMinutes: true, jri: { select: { jriProfile: { select: { tarifParSujet: true, tarifParMinute: true } } } } },
    });
    const reelParRubrique = new Map<string, number>();
    for (const s of sujets) {
      const p = s.jri?.jriProfile;
      const cout = p ? Number(p.tarifParSujet) + s.dureeMinutes * Number(p.tarifParMinute) : 0;
      reelParRubrique.set(s.rubrique!, (reelParRubrique.get(s.rubrique!) ?? 0) + cout);
    }

    const budgets = await prisma.budget.findMany({ where: { annee, mois } });
    const prevuParRubrique = new Map(budgets.map((b) => [b.rubrique, Number(b.montantPrevu)]));

    const rubriques = new Set([...prevuParRubrique.keys(), ...reelParRubrique.keys()]);
    const lignes = [...rubriques].sort().map((rubrique) => {
      const prevu = prevuParRubrique.get(rubrique) ?? 0;
      const reel = reelParRubrique.get(rubrique) ?? 0;
      return { rubrique, prevu, reel, ecart: prevu - reel };
    });

    res.json({ annee, mois, lignes });
  }),
);
