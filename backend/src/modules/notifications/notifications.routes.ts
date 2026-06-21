import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../lib/http.js';
import { authenticate } from '../../middleware/auth.js';

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

notificationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const notifs = await prisma.notification.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const nonLues = notifs.filter((n) => !n.lu).length;
    res.json({ notifications: notifs, nonLues });
  }),
);

notificationsRouter.patch(
  '/:id/lu',
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.sub },
      data: { lu: true },
    });
    res.json({ ok: true });
  }),
);

notificationsRouter.patch(
  '/tout-lu',
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({ where: { userId: req.user!.sub, lu: false }, data: { lu: true } });
    res.json({ ok: true });
  }),
);
