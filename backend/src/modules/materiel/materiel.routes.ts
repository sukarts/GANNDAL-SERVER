import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notFound } from '../../lib/http.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { audit } from '../../lib/audit.js';
import { genererQrMateriel } from '../../lib/qrcode.js';
import { env } from '../../config/env.js';
import { Prisma } from '@prisma/client';

export const materielRouter = Router();
materielRouter.use(authenticate);

// ---- Catégories ----
materielRouter.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    res.json(await prisma.categorieMateriel.findMany({ orderBy: { nom: 'asc' } }));
  }),
);

materielRouter.post(
  '/categories',
  requireRole('ADMIN', 'REDACTEUR'),
  asyncHandler(async (req, res) => {
    const nom = z.object({ nom: z.string().min(1) }).parse(req.body).nom;
    const cat = await prisma.categorieMateriel.create({ data: { nom } });
    res.status(201).json(cat);
  }),
);

// ---- Inventaire (tableau de bord parc) ----
materielRouter.get(
  '/inventaire',
  requireRole('ADMIN', 'REDACTEUR', 'COMPTABLE'),
  asyncHandler(async (_req, res) => {
    const [total, parStatut, valeur] = await Promise.all([
      prisma.materiel.count(),
      prisma.materiel.groupBy({ by: ['statut'], _count: true }),
      prisma.materiel.aggregate({ _sum: { coutAcquisition: true } }),
    ]);
    const stat = (s: string) => parStatut.find((x) => x.statut === s)?._count ?? 0;
    res.json({
      total,
      disponible: stat('DISPONIBLE'),
      affecte: stat('AFFECTE'),
      maintenance: stat('MAINTENANCE'),
      perdu: stat('PERDU'),
      vole: stat('VOLE'),
      valeurParc: Number(valeur._sum.coutAcquisition ?? 0),
    });
  }),
);

// ---- CRUD matériel ----
const materielSchema = z.object({
  reference: z.string().min(1),
  numInventaire: z.string().min(1),
  categorieId: z.string(),
  marque: z.string().optional(),
  modele: z.string().optional(),
  numSerie: z.string().optional(),
  dateAchat: z.coerce.date().optional(),
  fournisseur: z.string().optional(),
  coutAcquisition: z.number().nonnegative().optional(),
  garantieFin: z.coerce.date().optional(),
  etat: z.enum(['NEUF', 'BON_ETAT', 'A_REPARER', 'HORS_SERVICE', 'PERDU', 'VOLE']).optional(),
});

materielRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const where: Prisma.MaterielWhereInput = {};
    if (req.query.statut) where.statut = req.query.statut as Prisma.MaterielWhereInput['statut'];
    if (req.query.categorieId) where.categorieId = req.query.categorieId as string;
    const materiels = await prisma.materiel.findMany({
      where,
      include: { categorie: true },
      orderBy: { reference: 'asc' },
    });
    res.json(materiels);
  }),
);

materielRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const m = await prisma.materiel.findUnique({
      where: { id: req.params.id },
      include: {
        categorie: true,
        dotations: { include: { jri: { select: { nom: true, prenom: true } } }, orderBy: { dateRemise: 'desc' } },
        maintenances: { orderBy: { datePanne: 'desc' } },
        incidents: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!m) throw notFound();
    res.json(m);
  }),
);

materielRouter.post(
  '/',
  requireRole('ADMIN', 'REDACTEUR'),
  asyncHandler(async (req, res) => {
    const data = materielSchema.parse(req.body);
    const m = await prisma.materiel.create({ data });
    // QR Code automatique pointant vers la fiche
    const ficheUrl = `${env.corsOrigin}/materiel/${m.id}`;
    const qr = await genererQrMateriel(m.id, ficheUrl);
    const updated = await prisma.materiel.update({
      where: { id: m.id },
      data: { qrCodeData: qr.data, qrCodeUrl: qr.url },
      include: { categorie: true },
    });
    await audit({ userId: req.user!.sub, action: 'CREATE', entite: 'Materiel', entiteId: m.id, ip: req.ip });
    res.status(201).json(updated);
  }),
);

materielRouter.patch(
  '/:id',
  requireRole('ADMIN', 'REDACTEUR'),
  asyncHandler(async (req, res) => {
    const data = materielSchema.partial().parse(req.body);
    const m = await prisma.materiel.update({ where: { id: req.params.id }, data });
    await audit({ userId: req.user!.sub, action: 'UPDATE', entite: 'Materiel', entiteId: m.id, details: data, ip: req.ip });
    res.json(m);
  }),
);

// ---- Maintenance ----
const maintenanceSchema = z.object({
  datePanne: z.coerce.date(),
  description: z.string().min(1),
  prestataire: z.string().optional(),
  cout: z.number().nonnegative().optional(),
  dateRemiseEnService: z.coerce.date().optional(),
});

materielRouter.post(
  '/:id/maintenance',
  requireRole('ADMIN', 'REDACTEUR'),
  asyncHandler(async (req, res) => {
    const data = maintenanceSchema.parse(req.body);
    const ticket = await prisma.maintenance.create({ data: { materielId: req.params.id, ...data } });
    await prisma.materiel.update({
      where: { id: req.params.id },
      data: { statut: data.dateRemiseEnService ? 'DISPONIBLE' : 'MAINTENANCE' },
    });
    await audit({ userId: req.user!.sub, action: 'CREATE', entite: 'Maintenance', entiteId: ticket.id, ip: req.ip });
    res.status(201).json(ticket);
  }),
);

// ---- Incident (perte / vol / panne) ----
const incidentSchema = z.object({
  type: z.enum(['PANNE', 'PERTE', 'VOL', 'DEGRADATION']),
  description: z.string().min(1),
});

materielRouter.post(
  '/:id/incident',
  asyncHandler(async (req, res) => {
    const data = incidentSchema.parse(req.body);
    const incident = await prisma.incidentMateriel.create({
      data: { materielId: req.params.id, declareById: req.user!.sub, ...data },
    });
    const map = { PERTE: 'PERDU', VOL: 'VOLE', PANNE: 'MAINTENANCE', DEGRADATION: 'MAINTENANCE' } as const;
    await prisma.materiel.update({ where: { id: req.params.id }, data: { statut: map[data.type] } });
    await audit({ userId: req.user!.sub, action: 'INCIDENT', entite: 'Materiel', entiteId: req.params.id, details: data, ip: req.ip });
    res.status(201).json(incident);
  }),
);
