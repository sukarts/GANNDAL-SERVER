import pino from 'pino';
import { env } from '../config/env.js';

// Logger structuré JSON. En dev, sortie lisible via pino-pretty si dispo.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (env.nodeEnv === 'production' ? 'info' : 'debug'),
  // Ne jamais logger de secret/PII : on masque les champs sensibles.
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.passwordHash', '*.token', '*.iban'],
    censor: '[redacted]',
  },
  ...(env.nodeEnv !== 'production'
    ? { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } } }
    : {}),
});
