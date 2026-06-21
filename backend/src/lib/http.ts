import type { Request, Response, NextFunction, RequestHandler } from 'express';

// Wrapper pour propager les erreurs async vers le middleware d'erreur
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export const notFound = (msg = 'Ressource introuvable') => new HttpError(404, msg);
export const forbidden = (msg = 'Accès refusé') => new HttpError(403, msg);
export const badRequest = (msg = 'Requête invalide', details?: unknown) => new HttpError(400, msg, details);
export const unauthorized = (msg = 'Non authentifié') => new HttpError(401, msg);
