import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notFound, badRequest } from '../../lib/http.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { audit } from '../../lib/audit.js';

export const usersRouter = Router();
usersRouter.use(authenticate);

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  telephone: z.string().optional(),
  role: z.enum(['ADMIN', 'REDACTEUR', 'JRI', 'COMPTABLE']),
  // Profil JRI optionnel
  tarifParSujet: z.number().nonnegative().optional(),
  tarifParMinute: z.number().nonnegative().optional(),
  tarifPersonnalise: z.any().optional(),
  specialite: z.string().optional(),
  iban: z.string().optional(),
});

// Liste des utilisateurs (filtre par rôle)
usersRouter.get(
  '/',
  requireRole('ADMIN', 'REDACTEUR', 'COMPTABLE'),
  asyncHandler(async (req, res) => {
    const role = req.query.role as string | undefined;
    const users = await prisma.user.findMany({
      where: role ? { role: role as never } : undefined,
      include: { jriProfile: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users.map(({ passwordHash, ...u }) => u));
  }),
);

// Création d'un profil (utilisateur ou JRI)
usersRouter.post(
  '/',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw badRequest('Email déjà utilisé');

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: await bcrypt.hash(data.password, 10),
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone,
        role: data.role,
        jriProfile:
          data.role === 'JRI'
            ? {
                create: {
                  tarifParSujet: data.tarifParSujet ?? 0,
                  tarifParMinute: data.tarifParMinute ?? 0,
                  tarifPersonnalise: data.tarifPersonnalise,
                  specialite: data.specialite,
                  iban: data.iban,
                },
              }
            : undefined,
      },
      include: { jriProfile: true },
    });
    await audit({ userId: req.user!.sub, action: 'CREATE', entite: 'User', entiteId: user.id, ip: req.ip });
    const { passwordHash, ...safe } = user;
    res.status(201).json(safe);
  }),
);

// Fiche d'un JRI: profil + historique des livraisons
usersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        jriProfile: true,
        sujetsAssignes: { orderBy: { createdAt: 'desc' }, take: 50 },
        dotationsBenef: { include: { materiel: true }, orderBy: { dateRemise: 'desc' } },
        fichesPaiement: { orderBy: [{ annee: 'desc' }, { mois: 'desc' }] },
      },
    });
    if (!user) throw notFound();
    const { passwordHash, ...safe } = user;
    res.json(safe);
  }),
);

// Mise à jour tarifs / profil JRI
const updateJriSchema = z.object({
  tarifParSujet: z.number().nonnegative().optional(),
  tarifParMinute: z.number().nonnegative().optional(),
  tarifPersonnalise: z.any().optional(),
  specialite: z.string().optional(),
  iban: z.string().optional(),
});

usersRouter.patch(
  '/:id/jri-profile',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const data = updateJriSchema.parse(req.body);
    const profile = await prisma.jriProfile.upsert({
      where: { userId: req.params.id },
      create: { userId: req.params.id, ...data },
      update: data,
    });
    await audit({ userId: req.user!.sub, action: 'UPDATE', entite: 'JriProfile', entiteId: profile.id, details: data, ip: req.ip });
    res.json(profile);
  }),
);

usersRouter.patch(
  '/:id/toggle-actif',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw notFound();
    const updated = await prisma.user.update({ where: { id: user.id }, data: { actif: !user.actif } });
    await audit({ userId: req.user!.sub, action: 'UPDATE', entite: 'User', entiteId: user.id, details: { actif: updated.actif }, ip: req.ip });
    res.json({ id: updated.id, actif: updated.actif });
  }),
);
