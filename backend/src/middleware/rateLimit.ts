import rateLimit from 'express-rate-limit';

// Limiteur global de l'API : généreux, protège contre l'abus grossier.
export const apiLimiter = rateLimit({
  windowMs: 60_000, // 1 min
  limit: 300, // req/min/IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez dans un instant' },
});

// Limiteur strict pour l'authentification : freine le brute-force.
// Le verrouillage par compte (failedLoginCount/lockedUntil) complète cette limite par IP.
export const authLimiter = rateLimit({
  windowMs: 15 * 60_000, // 15 min
  limit: 20, // tentatives/15 min/IP sur les routes d'auth sensibles
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true, // ne compte que les échecs
  message: { error: 'Trop de tentatives de connexion, réessayez plus tard' },
});
