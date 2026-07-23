import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { apiRouter } from './routes.js';
import { errorHandler } from './middleware/error.js';

export function createApp() {
  const app = express();
  app.use(helmet());
  // X-Total-Count exposé pour la pagination côté client
  app.use(cors({ origin: env.corsOrigin, credentials: true, exposedHeaders: ['X-Total-Count'] }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (env.nodeEnv !== 'test') app.use(morgan('dev'));

  app.use('/api', apiRouter);
  app.use(errorHandler);
  return app;
}
