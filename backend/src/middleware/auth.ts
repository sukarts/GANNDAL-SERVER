import type { Request, Response, NextFunction } from 'express';
import { verifyAccess, type JwtPayload } from '../lib/jwt.js';
import { unauthorized, forbidden } from '../lib/http.js';
import type { Role } from '@prisma/client';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw unauthorized();
  try {
    req.user = verifyAccess(header.slice(7));
    next();
  } catch {
    throw unauthorized('Token invalide ou expiré');
  }
}

// Restriction par rôle: requireRole('ADMIN', 'REDACTEUR')
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw unauthorized();
    if (!roles.includes(req.user.role)) throw forbidden('Rôle insuffisant');
    next();
  };
}
