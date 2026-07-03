import { Router } from 'express';
import { asyncHandler } from '../../lib/http.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { audit } from '../../lib/audit.js';
import { runAlertes } from './alertes.service.js';

export const alertesRouter = Router();
alertesRouter.use(authenticate, requireRole('ADMIN', 'REDACTEUR'));

// Déclenchement manuel du scan d'alertes (le cron le fait quotidiennement)
alertesRouter.post(
  '/run',
  asyncHandler(async (req, res) => {
    const resume = await runAlertes();
    await audit({ userId: req.user!.sub, action: 'RUN_ALERTES', entite: 'Alerte', details: resume, ip: req.ip });
    res.json(resume);
  }),
);
