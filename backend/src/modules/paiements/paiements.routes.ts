import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notFound, badRequest } from '../../lib/http.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { audit } from '../../lib/audit.js';
import { pageParams, setTotal } from '../../lib/pagination.js';
import { notify } from '../../lib/notify.js';
import { uploadObject } from '../../lib/s3.js';
import { genererFichePaiementPdf, genererBordereauPdf, genererAttestationPdf } from '../../lib/pdf.js';
import { genererPaieExcel, genererComptableExcel } from '../../lib/excel.js';
import { getDevise } from '../../lib/currency.js';
import { calculerPige } from '../../lib/calc.js';
import { Prisma } from '@prisma/client';

export const paiementsRouter = Router();
paiementsRouter.use(authenticate);

// Calcul automatique d'une fiche de pige pour un JRI sur une période
const calcSchema = z.object({
  jriId: z.string(),
  annee: z.number().int(),
  mois: z.number().int().min(1).max(12),
  bonus: z.number().nonnegative().optional(),
  penalites: z.number().nonnegative().optional(),
});

paiementsRouter.post(
  '/calculer',
  requireRole('ADMIN', 'COMPTABLE'),
  asyncHandler(async (req, res) => {
    const { jriId, annee, mois, bonus = 0, penalites = 0 } = calcSchema.parse(req.body);
    const profile = await prisma.jriProfile.findUnique({ where: { userId: jriId } });
    if (!profile) throw badRequest('Profil JRI introuvable');

    const debut = new Date(annee, mois - 1, 1);
    const fin = new Date(annee, mois, 1);

    // Base de calcul: sujets VALIDÉS sur la période (date de validation)
    const sujets = await prisma.sujet.findMany({
      where: { jriId, statut: 'VALIDE', valideLe: { gte: debut, lt: fin } },
    });

    const nbSujets = sujets.length;
    const totalMinutes = sujets.reduce((s, x) => s + x.dureeMinutes, 0);
    const tarifSujet = Number(profile.tarifParSujet);
    const tarifMinute = Number(profile.tarifParMinute);
    const { montantSujets, montantMinutes, montantBase, montantTotal } =
      calculerPige({ nbSujets, totalMinutes, tarifSujet, tarifMinute, bonus, penalites });

    const reference = `PIGE-${annee}-${String(mois).padStart(2, '0')}-${jriId.slice(-4)}`;

    const fiche = await prisma.fichePaiement.upsert({
      where: { jriId_annee_mois: { jriId, annee, mois } },
      create: {
        reference, jriId, annee, mois, nbSujets, totalMinutes,
        montantBase, bonus, penalites, montantTotal, statut: 'GENEREE',
        lignes: {
          create: [
            { libelle: `Sujets validés (${nbSujets})`, quantite: nbSujets, tarif: tarifSujet, montant: montantSujets },
            { libelle: `Minutes produites (${totalMinutes})`, quantite: totalMinutes, tarif: tarifMinute, montant: montantMinutes },
          ],
        },
      },
      update: {
        nbSujets, totalMinutes, montantBase, bonus, penalites, montantTotal, statut: 'GENEREE',
        lignes: {
          deleteMany: {},
          create: [
            { libelle: `Sujets validés (${nbSujets})`, quantite: nbSujets, tarif: tarifSujet, montant: montantSujets },
            { libelle: `Minutes produites (${totalMinutes})`, quantite: totalMinutes, tarif: tarifMinute, montant: montantMinutes },
          ],
        },
      },
      include: { jri: true, lignes: true },
    });

    await audit({ userId: req.user!.sub, action: 'CREATE', entite: 'FichePaiement', entiteId: fiche.id, ip: req.ip });
    res.status(201).json(fiche);
  }),
);

// Liste des fiches — un JRI ne voit que les siennes
paiementsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const where: Prisma.FichePaiementWhereInput = {};
    if (req.user!.role === 'JRI') where.jriId = req.user!.sub;
    else if (req.query.jriId) where.jriId = req.query.jriId as string;
    if (req.query.annee) where.annee = Number(req.query.annee);
    if (req.query.mois) where.mois = Number(req.query.mois);

    const { skip, take } = pageParams(req);
    const [total, fiches] = await Promise.all([
      prisma.fichePaiement.count({ where }),
      prisma.fichePaiement.findMany({
        where,
        include: { jri: { select: { nom: true, prenom: true } } },
        orderBy: [{ annee: 'desc' }, { mois: 'desc' }],
        skip,
        take,
      }),
    ]);
    setTotal(res, total);
    res.json(fiches);
  }),
);

paiementsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const fiche = await prisma.fichePaiement.findUnique({
      where: { id: req.params.id },
      include: { jri: true, lignes: true },
    });
    if (!fiche) throw notFound();
    if (req.user!.role === 'JRI' && fiche.jriId !== req.user!.sub) throw notFound();
    res.json(fiche);
  }),
);

// Génération du PDF (stocké S3 + retourné). ADMIN/COMPTABLE, ou le JRI pour sa fiche.
paiementsRouter.post(
  '/:id/pdf',
  asyncHandler(async (req, res) => {
    const fiche = await prisma.fichePaiement.findUnique({
      where: { id: req.params.id },
      include: { jri: true, lignes: true },
    });
    if (!fiche) throw notFound();
    if (req.user!.role === 'JRI' && fiche.jriId !== req.user!.sub) throw notFound();
    const codeDevise = (req.query.devise as string) ?? (req.body?.devise as string) ?? 'GNF';
    const devise = await getDevise(codeDevise);
    const buffer = await genererFichePaiementPdf(fiche, devise);
    const suffix = codeDevise !== 'GNF' ? `-${codeDevise}` : '';
    const key = `paiements/${fiche.reference}${suffix}.pdf`;
    const url = await uploadObject(key, buffer, 'application/pdf');
    await prisma.fichePaiement.update({ where: { id: fiche.id }, data: { pdfUrl: url } });
    res.json({ pdfUrl: url });
  }),
);

// Export Excel d'une paie (période complète)
paiementsRouter.get(
  '/export/excel',
  requireRole('ADMIN', 'COMPTABLE'),
  asyncHandler(async (req, res) => {
    const annee = Number(req.query.annee);
    const mois = Number(req.query.mois);
    const fiches = await prisma.fichePaiement.findMany({ where: { annee, mois }, include: { jri: true } });
    const buffer = await genererPaieExcel(fiches);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="paie-${annee}-${mois}.xlsx"`);
    res.send(buffer);
  }),
);

// Ordre de paiement (bordereau) PDF des fiches générées d'une période
paiementsRouter.get(
  '/bordereau',
  requireRole('ADMIN', 'COMPTABLE'),
  asyncHandler(async (req, res) => {
    const annee = Number(req.query.annee) || new Date().getFullYear();
    const mois = Number(req.query.mois) || new Date().getMonth() + 1;
    const fiches = await prisma.fichePaiement.findMany({
      where: { annee, mois, statut: 'GENEREE' },
      include: { jri: { include: { jriProfile: true } } },
      orderBy: { jri: { nom: 'asc' } },
    });
    const buffer = await genererBordereauPdf(fiches, annee, mois);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bordereau-paiement-${annee}-${mois}.pdf"`);
    res.send(buffer);
  }),
);

// Attestation annuelle de revenus (PDF). JRI = la sienne ; ADMIN/COMPTABLE = tous.
paiementsRouter.get(
  '/attestation',
  asyncHandler(async (req, res) => {
    const annee = Number(req.query.annee) || new Date().getFullYear();
    let jriId = req.query.jriId as string | undefined;
    if (req.user!.role === 'JRI') jriId = req.user!.sub;
    if (!jriId) throw badRequest('jriId requis');

    const jri = await prisma.user.findUnique({ where: { id: jriId } });
    if (!jri) throw notFound();
    const fiches = await prisma.fichePaiement.findMany({
      where: { jriId, annee, statut: 'PAYEE' },
      select: { mois: true, montantTotal: true },
    });
    const buffer = await genererAttestationPdf(jri, annee, fiches);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="attestation-${jri.nom}-${annee}.pdf"`);
    res.send(buffer);
  }),
);

// Export comptable annuel (Excel) — toutes les fiches de l'année
paiementsRouter.get(
  '/export/comptable',
  requireRole('ADMIN', 'COMPTABLE'),
  asyncHandler(async (req, res) => {
    const annee = Number(req.query.annee) || new Date().getFullYear();
    const fiches = await prisma.fichePaiement.findMany({
      where: { annee },
      include: { jri: true, lignes: true },
      orderBy: [{ mois: 'asc' }, { jri: { nom: 'asc' } }],
    });
    const buffer = await genererComptableExcel(fiches);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="comptabilite-${annee}.xlsx"`);
    res.send(buffer);
  }),
);

// Marquer payée avec référence de paiement
const payerSchema = z.object({
  modePaiement: z.string().optional(),
  referencePaiement: z.string().optional(),
  payeeLe: z.coerce.date().optional(),
});
paiementsRouter.patch(
  '/:id/payer',
  requireRole('ADMIN', 'COMPTABLE'),
  asyncHandler(async (req, res) => {
    const data = payerSchema.parse(req.body ?? {});
    const fiche = await prisma.fichePaiement.update({
      where: { id: req.params.id },
      data: {
        statut: 'PAYEE',
        payeeLe: data.payeeLe ?? new Date(),
        modePaiement: data.modePaiement,
        referencePaiement: data.referencePaiement,
      },
    });
    await audit({ userId: req.user!.sub, action: 'UPDATE', entite: 'FichePaiement', entiteId: fiche.id, details: { statut: 'PAYEE', ref: data.referencePaiement }, ip: req.ip });
    await notify({ userId: fiche.jriId, titre: 'Pige payée', message: `Votre fiche ${fiche.reference} a été réglée${data.referencePaiement ? ` (réf. ${data.referencePaiement})` : ''}.`, canaux: ['INTERNE', 'EMAIL', 'WHATSAPP'] });
    res.json(fiche);
  }),
);
