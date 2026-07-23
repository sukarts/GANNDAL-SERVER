import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notFound, forbidden } from '../../lib/http.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';
import { uploadObject } from '../../lib/s3.js';
import { audit } from '../../lib/audit.js';
import { notify } from '../../lib/notify.js';
import { nextRef } from '../../lib/ref.js';
import { pageParams, setTotal } from '../../lib/pagination.js';
import { Prisma, type TypeElement } from '@prisma/client';

export const sujetsRouter = Router();
sujetsRouter.use(authenticate);

const createSchema = z.object({
  titre: z.string().min(1),
  description: z.string().optional(),
  jriId: z.string().optional(),
  dateLimite: z.coerce.date().optional(),
  priorite: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']).optional(),
  dureeMinutes: z.number().int().nonnegative().optional(),
});

// Liste — un JRI ne voit que ses sujets
sujetsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { statut, jriId } = req.query as Record<string, string>;
    const where: Prisma.SujetWhereInput = {};
    if (statut) where.statut = statut as Prisma.SujetWhereInput['statut'];
    if (req.user!.role === 'JRI') where.jriId = req.user!.sub;
    else if (jriId) where.jriId = jriId;

    const { skip, take } = pageParams(req);
    const [total, sujets] = await Promise.all([
      prisma.sujet.count({ where }),
      prisma.sujet.findMany({
        where,
        include: { jri: { select: { id: true, nom: true, prenom: true } }, _count: { select: { elements: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);
    setTotal(res, total);
    res.json(sujets);
  }),
);

sujetsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const sujet = await prisma.sujet.findUnique({
      where: { id: req.params.id },
      include: {
        jri: { select: { id: true, nom: true, prenom: true } },
        createur: { select: { id: true, nom: true, prenom: true } },
        elements: { orderBy: { createdAt: 'desc' } },
        validations: { include: { validateur: { select: { nom: true, prenom: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!sujet) throw notFound();
    if (req.user!.role === 'JRI' && sujet.jriId !== req.user!.sub) throw forbidden();
    res.json(sujet);
  }),
);

// Création + attribution
sujetsRouter.post(
  '/',
  requireRole('ADMIN', 'REDACTEUR'),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const sujet = await prisma.sujet.create({
      data: {
        reference: await nextRef('SUJ', 'sujet'),
        titre: data.titre,
        description: data.description,
        jriId: data.jriId,
        createdById: req.user!.sub,
        dateLimite: data.dateLimite,
        priorite: data.priorite ?? 'NORMALE',
        dureeMinutes: data.dureeMinutes ?? 0,
        statut: 'ASSIGNE',
      },
    });
    await audit({ userId: req.user!.sub, action: 'CREATE', entite: 'Sujet', entiteId: sujet.id, ip: req.ip });
    if (data.jriId) {
      await notify({
        userId: data.jriId,
        titre: 'Nouveau sujet assigné',
        message: `Le sujet « ${sujet.titre} » vous a été attribué.`,
        lien: `/sujets/${sujet.id}`,
        canaux: ['INTERNE', 'EMAIL'],
      });
    }
    res.status(201).json(sujet);
  }),
);

// Réattribution / mise à jour
const updateSchema = createSchema.partial();
sujetsRouter.patch(
  '/:id',
  requireRole('ADMIN', 'REDACTEUR'),
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body);
    const sujet = await prisma.sujet.update({ where: { id: req.params.id }, data });
    await audit({ userId: req.user!.sub, action: 'UPDATE', entite: 'Sujet', entiteId: sujet.id, details: data, ip: req.ip });
    res.json(sujet);
  }),
);

// Changement de statut par le JRI (EN_COURS / LIVRE)
const statutSchema = z.object({ statut: z.enum(['EN_COURS', 'LIVRE']) });
sujetsRouter.patch(
  '/:id/statut',
  asyncHandler(async (req, res) => {
    const { statut } = statutSchema.parse(req.body);
    const sujet = await prisma.sujet.findUnique({ where: { id: req.params.id } });
    if (!sujet) throw notFound();
    if (req.user!.role === 'JRI' && sujet.jriId !== req.user!.sub) throw forbidden();

    const updated = await prisma.sujet.update({
      where: { id: sujet.id },
      data: { statut, livreLe: statut === 'LIVRE' ? new Date() : sujet.livreLe },
    });
    await audit({ userId: req.user!.sub, action: 'UPDATE', entite: 'Sujet', entiteId: sujet.id, details: { statut }, ip: req.ip });
    if (statut === 'LIVRE') {
      const redacteurs = await prisma.user.findMany({ where: { role: { in: ['REDACTEUR', 'ADMIN'] } } });
      await Promise.all(
        redacteurs.map((r) =>
          notify({ userId: r.id, titre: 'Sujet livré', message: `« ${sujet.titre} » est livré et attend validation.`, lien: `/sujets/${sujet.id}` }),
        ),
      );
    }
    res.json(updated);
  }),
);

// Validation / rejet / correction par le rédacteur
const validationSchema = z.object({
  action: z.enum(['VALIDE', 'REJETE', 'CORRECTION_DEMANDEE']),
  commentaire: z.string().optional(),
});
sujetsRouter.post(
  '/:id/validation',
  requireRole('ADMIN', 'REDACTEUR'),
  asyncHandler(async (req, res) => {
    const { action, commentaire } = validationSchema.parse(req.body);
    const sujet = await prisma.sujet.findUnique({ where: { id: req.params.id } });
    if (!sujet) throw notFound();

    const nouveauStatut = action === 'VALIDE' ? 'VALIDE' : action === 'REJETE' ? 'REJETE' : 'EN_COURS';
    const [validation, updated] = await prisma.$transaction([
      prisma.validation.create({
        data: { sujetId: sujet.id, validateurId: req.user!.sub, action, commentaire },
      }),
      prisma.sujet.update({
        where: { id: sujet.id },
        data: { statut: nouveauStatut, valideLe: action === 'VALIDE' ? new Date() : null },
      }),
    ]);
    await audit({ userId: req.user!.sub, action: 'VALIDATE', entite: 'Sujet', entiteId: sujet.id, details: { action }, ip: req.ip });
    if (sujet.jriId) {
      await notify({
        userId: sujet.jriId,
        titre: `Sujet ${action === 'VALIDE' ? 'validé' : action === 'REJETE' ? 'rejeté' : 'à corriger'}`,
        message: `« ${sujet.titre} » : ${commentaire ?? action}`,
        lien: `/sujets/${sujet.id}`,
        canaux: ['INTERNE', 'EMAIL'],
      });
    }
    res.json({ validation, sujet: updated });
  }),
);

// Dépôt d'un élément (vidéo/audio/photo/document) — versioning automatique
sujetsRouter.post(
  '/:id/elements',
  upload.single('fichier'),
  asyncHandler(async (req, res) => {
    const sujet = await prisma.sujet.findUnique({ where: { id: req.params.id } });
    if (!sujet) throw notFound();
    if (req.user!.role === 'JRI' && sujet.jriId !== req.user!.sub) throw forbidden();
    if (!req.file) throw notFound('Aucun fichier');

    const type = (req.body.type as TypeElement) ?? 'DOCUMENT';
    const dernier = await prisma.sujetElement.findFirst({
      where: { sujetId: sujet.id, nomFichier: req.file.originalname },
      orderBy: { version: 'desc' },
    });
    const version = (dernier?.version ?? 0) + 1;
    const key = `sujets/${sujet.id}/${Date.now()}-v${version}-${req.file.originalname}`;
    const url = await uploadObject(key, req.file.buffer, req.file.mimetype);

    const element = await prisma.sujetElement.create({
      data: {
        sujetId: sujet.id,
        type,
        nomFichier: req.file.originalname,
        storageKey: key,
        url,
        mime: req.file.mimetype,
        tailleOctets: BigInt(req.file.size),
        version,
        uploadedById: req.user!.sub,
      },
    });
    await audit({ userId: req.user!.sub, action: 'CREATE', entite: 'SujetElement', entiteId: element.id, ip: req.ip });
    res.status(201).json({ ...element, tailleOctets: element.tailleOctets.toString() });
  }),
);
