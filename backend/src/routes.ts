import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { sujetsRouter } from './modules/sujets/sujets.routes.js';
import { paiementsRouter } from './modules/paiements/paiements.routes.js';
import { materielRouter } from './modules/materiel/materiel.routes.js';
import { dotationsRouter } from './modules/dotations/dotations.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { rapportsRouter } from './modules/rapports/rapports.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';
import { auditRouter } from './modules/audit/audit.routes.js';
import { currenciesRouter } from './modules/currencies/currencies.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/sujets', sujetsRouter);
apiRouter.use('/paiements', paiementsRouter);
apiRouter.use('/materiel', materielRouter);
apiRouter.use('/dotations', dotationsRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/rapports', rapportsRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/audit', auditRouter);
apiRouter.use('/currencies', currenciesRouter);
