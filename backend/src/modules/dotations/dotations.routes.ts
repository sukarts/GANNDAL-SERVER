import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notFound, badRequest } from '../../lib/http.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';
import { uploadObject } from '../../lib/s3.js';
import { audit } from '../../lib/audit.js';
import { pageParams, setTotal } from '../../lib/pagination.js';
import { notify } from '../../lib/notify.js';
import { montantDegradation } from '../../lib/calc.js';
import { Prisma } from '@prisma/client';

export const dotationsRouter = Router();
dotationsRouter.use(authenticate);

const ETAT = ['NEUF', 'BON_ETAT', 'A_REPARER', 'HORS_SERVICE', 'PERDU', 'VOLE'] as const;

// Liste — JRI ne voit que ses dotations
dotationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const where: Prisma.DotationWhereInput = {};
    if (req.user!.role === 'JRI') where.jriId = req.user!.sub;
    else if (req.query.jriId) where.jriId = req.query.jriId as string;
    if (req.query.statut) where.statut = req.query.statut as Prisma.DotationWhereInput['statut'];
    const { skip, take } = pageParams(req);
    const [total, dotations] = await Promise.all([
      prisma.dotation.count({ where }),
      prisma.dotation.findMany({
        where,
        include: { materiel: { include: { categorie: true } }, jri: { select: { nom: true, prenom: true } } },
        orderBy: { dateRemise: 'desc' },
        skip,
        take,
      }),
    ]);
    setTotal(res, total);
    res.json(dotations);
  }),
);

// Remise: attribuer un matériel à un JRI
const remiseSchema = z.object({
  materielId: z.string(),
  jriId: z.string(),
  etatRemise: z.enum(ETAT),
  observations: z.string().optional(),
  photosRemise: z.array(z.string()).optional(),
  signatureUrl: z.string().optional(),
});

dotationsRouter.post(
  '/',
  requireRole('ADMIN', 'REDACTEUR'),
  asyncHandler(async (req, res) => {
    const data = remiseSchema.parse(req.body);
    const materiel = await prisma.materiel.findUnique({ where: { id: data.materielId } });
    if (!materiel) throw notFound('Matériel introuvable');
    if (materiel.statut !== 'DISPONIBLE') throw badRequest('Matériel non disponible');

    const [dotation] = await prisma.$transaction([
      prisma.dotation.create({
        data: {
          materielId: data.materielId,
          jriId: data.jriId,
          responsableId: req.user!.sub,
          etatRemise: data.etatRemise,
          observations: data.observations,
          photosRemise: data.photosRemise ?? [],
          signatureUrl: data.signatureUrl,
          statut: 'EN_COURS',
        },
      }),
      prisma.materiel.update({ where: { id: data.materielId }, data: { statut: 'AFFECTE' } }),
    ]);
    await audit({ userId: req.user!.sub, action: 'ASSIGN', entite: 'Dotation', entiteId: dotation.id, ip: req.ip });
    await notify({ userId: data.jriId, titre: 'Matériel attribué', message: `${materiel.reference} vous a été remis.`, canaux: ['INTERNE', 'EMAIL'] });
    res.status(201).json(dotation);
  }),
);

// Upload photo / signature liée à une dotation
dotationsRouter.post(
  '/:id/fichier',
  upload.single('fichier'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw badRequest('Aucun fichier');
    const kind = (req.body.kind as string) ?? 'photo'; // photo | signature | photoRetour
    const key = `dotations/${req.params.id}/${kind}-${Date.now()}-${req.file.originalname}`;
    const url = await uploadObject(key, req.file.buffer, req.file.mimetype);

    // Persiste le fichier sur la dotation selon son type
    const dotation = await prisma.dotation.findUnique({ where: { id: req.params.id } });
    if (!dotation) throw notFound();
    if (kind === 'signature') {
      await prisma.dotation.update({ where: { id: dotation.id }, data: { signatureUrl: url } });
    } else if (kind === 'photoRetour') {
      await prisma.dotation.update({ where: { id: dotation.id }, data: { photosRetour: { push: url } } });
    } else {
      await prisma.dotation.update({ where: { id: dotation.id }, data: { photosRemise: { push: url } } });
    }
    res.status(201).json({ url });
  }),
);

// Restitution: contrôle d'état + calcul dégradation
const restitutionSchema = z.object({
  etatRetour: z.enum(ETAT),
  photosRetour: z.array(z.string()).optional(),
  observationsRetour: z.string().optional(),
  montantDegradation: z.number().nonnegative().optional(),
});

dotationsRouter.post(
  '/:id/restitution',
  requireRole('ADMIN', 'REDACTEUR'),
  asyncHandler(async (req, res) => {
    const data = restitutionSchema.parse(req.body);
    const dotation = await prisma.dotation.findUnique({ where: { id: req.params.id }, include: { materiel: true } });
    if (!dotation) throw notFound();
    if (dotation.statut === 'RESTITUE') throw badRequest('Déjà restitué');

    // Dégradation auto si non fournie (barème par état × coût d'acquisition)
    const cout = Number(dotation.materiel.coutAcquisition);
    const degradation = data.montantDegradation ?? montantDegradation(dotation.etatRemise, data.etatRetour, cout);

    const nouveauStatutMateriel =
      data.etatRetour === 'PERDU' ? 'PERDU' : data.etatRetour === 'VOLE' ? 'VOLE'
      : data.etatRetour === 'A_REPARER' || data.etatRetour === 'HORS_SERVICE' ? 'MAINTENANCE'
      : 'DISPONIBLE';

    const [updated] = await prisma.$transaction([
      prisma.dotation.update({
        where: { id: dotation.id },
        data: {
          statut: 'RESTITUE',
          dateRetour: new Date(),
          etatRetour: data.etatRetour,
          photosRetour: data.photosRetour ?? [],
          observationsRetour: data.observationsRetour,
          montantDegradation: degradation,
          validateurId: req.user!.sub,
        },
      }),
      prisma.materiel.update({ where: { id: dotation.materielId }, data: { statut: nouveauStatutMateriel, etat: data.etatRetour } }),
    ]);
    await audit({ userId: req.user!.sub, action: 'RESTITUTION', entite: 'Dotation', entiteId: dotation.id, details: { montantDegradation: degradation }, ip: req.ip });
    res.json(updated);
  }),
);
