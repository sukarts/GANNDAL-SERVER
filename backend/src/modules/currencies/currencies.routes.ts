import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notFound, badRequest } from '../../lib/http.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { audit } from '../../lib/audit.js';
import { convert } from '../../lib/currency.js';

export const currenciesRouter = Router();
currenciesRouter.use(authenticate);

// Liste des devises actives
currenciesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const all = req.query.all === 'true';
    const devises = await prisma.currency.findMany({
      where: all ? undefined : { actif: true },
      orderBy: [{ parDefaut: 'desc' }, { code: 'asc' }],
    });
    res.json(devises);
  }),
);

// Convertisseur: /currencies/convert?amount=1000&from=GNF&to=USD
currenciesRouter.get(
  '/convert',
  asyncHandler(async (req, res) => {
    const amount = Number(req.query.amount);
    const from = String(req.query.from ?? '');
    const to = String(req.query.to ?? '');
    if (!Number.isFinite(amount) || !from || !to) throw badRequest('Paramètres amount/from/to requis');
    const result = await convert(amount, from, to);
    res.json({ amount, from, to, result: Math.round(result * 100) / 100 });
  }),
);

const upsertSchema = z.object({
  code: z.string().min(3).max(4),
  nom: z.string().min(1),
  symbole: z.string().min(1),
  tauxGnf: z.number().positive(),
  actif: z.boolean().optional(),
});

// Créer une devise (ADMIN)
currenciesRouter.post(
  '/',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const data = upsertSchema.parse(req.body);
    const devise = await prisma.currency.create({ data });
    await audit({ userId: req.user!.sub, action: 'CREATE', entite: 'Currency', entiteId: devise.code, ip: req.ip });
    res.status(201).json(devise);
  }),
);

// Mettre à jour taux / état (ADMIN)
currenciesRouter.patch(
  '/:code',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const data = upsertSchema.partial().omit({ code: true }).parse(req.body);
    const devise = await prisma.currency.update({ where: { code: req.params.code }, data });
    await audit({ userId: req.user!.sub, action: 'UPDATE', entite: 'Currency', entiteId: devise.code, details: data, ip: req.ip });
    res.json(devise);
  }),
);

// Définir la devise par défaut (ADMIN)
currenciesRouter.patch(
  '/:code/defaut',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const exists = await prisma.currency.findUnique({ where: { code: req.params.code } });
    if (!exists) throw notFound();
    await prisma.$transaction([
      prisma.currency.updateMany({ data: { parDefaut: false } }),
      prisma.currency.update({ where: { code: req.params.code }, data: { parDefaut: true, actif: true } }),
    ]);
    await audit({ userId: req.user!.sub, action: 'UPDATE', entite: 'Currency', entiteId: req.params.code, details: { parDefaut: true }, ip: req.ip });
    res.json({ ok: true });
  }),
);
