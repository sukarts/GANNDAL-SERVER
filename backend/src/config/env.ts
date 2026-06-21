import dotenv from 'dotenv';
dotenv.config();

function req(key: string, fallback?: string): string {
  const v = process.env[key] ?? fallback;
  if (v === undefined) throw new Error(`Variable d'environnement manquante: ${key}`);
  return v;
}

export const env = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',

  jwt: {
    accessSecret: req('JWT_ACCESS_SECRET', 'dev-access'),
    refreshSecret: req('JWT_REFRESH_SECRET', 'dev-refresh'),
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },

  s3: {
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    region: process.env.S3_REGION ?? 'us-east-1',
    bucket: process.env.S3_BUCKET ?? 'ganndal',
    accessKey: process.env.S3_ACCESS_KEY ?? 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY ?? 'minioadmin',
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
    publicUrl: process.env.S3_PUBLIC_URL ?? 'http://localhost:9000/ganndal',
  },

  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.MAIL_FROM ?? 'GANNDAL <no-reply@ganndal.media>',
  },

  whatsapp: {
    token: process.env.WHATSAPP_TOKEN ?? '',
    phoneId: process.env.WHATSAPP_PHONE_ID ?? '',
  },
};
