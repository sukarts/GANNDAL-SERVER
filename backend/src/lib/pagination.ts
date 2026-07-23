import type { Request, Response } from 'express';

export interface PageParams {
  paginated: boolean;
  page: number;
  limit: number;
  skip?: number;
  take?: number;
}

const LIMITE_MAX = 200;
const LIMITE_DEFAUT = 25;

// Pagination optionnelle : sans ?page/?limit la liste complète est renvoyée
// (les <select> du frontend en dépendent). Avec, on découpe.
export function pageParams(req: Request): PageParams {
  const paginated = Boolean(req.query.page || req.query.limit);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(LIMITE_MAX, Math.max(1, Number(req.query.limit) || LIMITE_DEFAUT));
  return {
    paginated,
    page,
    limit,
    skip: paginated ? (page - 1) * limit : undefined,
    take: paginated ? limit : undefined,
  };
}

// Expose le total au client (header exposé via CORS dans app.ts)
export function setTotal(res: Response, total: number): void {
  res.setHeader('X-Total-Count', String(total));
}
