import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../lib/http.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { Prisma } from '@prisma/client';

export const auditRouter = Router();
auditRouter.use(authenticate, requireRole('ADMIN'));

// Journal d'audit filtrable
auditRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const where: Prisma.AuditLogWhereInput = {};
    if (req.query.entite) where.entite = req.query.entite as string;
    if (req.query.action) where.action = req.query.action as string;
    if (req.query.userId) where.userId = req.query.userId as string;

    const page = Math.max(1, Number(req.query.page ?? 1));
    const take = 50;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { nom: true, prenom: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * take,
        take,
      }),
      prisma.auditLog.count({ where }),
    ]);
    res.json({ logs, total, page, pages: Math.ceil(total / take) });
  }),
);
