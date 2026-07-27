import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { apiRouter } from './routes.js';
import { errorHandler } from './middleware/error.js';

export function createApp() {
  const app = express();
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

  app.use('/api', apiRouter);
  app.use(errorHandler);
  return app;
}
