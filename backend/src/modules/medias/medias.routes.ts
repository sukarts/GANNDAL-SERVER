import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../lib/http.js';
import { authenticate } from '../../middleware/auth.js';
import { pageParams, setTotal } from '../../lib/pagination.js';
import { Prisma } from '@prisma/client';

export const mediasRouter = Router();
mediasRouter.use(authenticate);

// Médiathèque : tous les éléments déposés, filtrables. JRI = ses sujets uniquement.
mediasRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const where: Prisma.SujetElementWhereInput = {};
    if (req.query.type) where.type = req.query.type as Prisma.SujetElementWhereInput['type'];
    if (req.query.q) where.nomFichier = { contains: String(req.query.q), mode: 'insensitive' };
    if (req.user!.role === 'JRI') where.sujet = { jriId: req.user!.sub };

    const { skip, take } = pageParams(req);
    const [total, elements] = await Promise.all([
      prisma.sujetElement.count({ where }),
      prisma.sujetElement.findMany({
        where,
        include: { sujet: { select: { id: true, reference: true, titre: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);
    setTotal(res, total);
    // BigInt non sérialisable en JSON
    res.json(elements.map((e) => ({ ...e, tailleOctets: e.tailleOctets.toString() })));
  }),
);
