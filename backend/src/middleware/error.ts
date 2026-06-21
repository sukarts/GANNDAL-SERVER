import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../lib/http.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation échouée', details: err.flatten() });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  console.error('[error]', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
}
