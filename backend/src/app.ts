import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { apiRouter } from './routes.js';
import { errorHandler } from './middleware/error.js';
import { apiLimiter } from './middleware/rateLimit.js';

export function createApp() {
  const app = express();
  // Derrière nginx : faire confiance au 1er proxy pour obtenir la vraie IP client (rate-limit).
  app.set('trust proxy', 1);
  app.use(helmet());
  // X-Total-Count exposé pour la pagination côté client
  app.use(cors({ origin: env.corsOrigin, credentials: true, exposedHeaders: ['X-Total-Count'] }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logs structurés + identifiant de requête (corrélation). Silencieux en test.
  if (env.nodeEnv !== 'test') {
    app.use(
      pinoHttp({
        logger,
        genReqId: (req, res) => {
          const id = (req.headers['x-request-id'] as string) || randomUUID();
          res.setHeader('X-Request-Id', id);
          return id;
        },
      }),
    );
  }

  // Limiteur global (sauf en test). L'auth a un limiteur dédié plus strict.
  if (env.nodeEnv !== 'test') app.use('/api', apiLimiter);
  app.use('/api', apiRouter);
  app.use(errorHandler);
  return app;
}
