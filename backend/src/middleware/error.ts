import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../lib/http.js';
import { logger } from '../lib/logger.js';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation échouée', details: err.flatten() });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  // Erreur non maîtrisée : journalisée avec l'id de requête pour corrélation.
  const log = (req as Request & { log?: typeof logger }).log ?? logger;
  log.error({ err }, 'Erreur interne non gérée');
  res.status(500).json({ error: 'Erreur interne du serveur' });
}
