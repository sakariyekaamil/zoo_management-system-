import dotenv from 'dotenv';

// Do not override env vars already set by Vercel.
dotenv.config({ override: false });

const isVercel = Boolean(process.env.VERCEL);

const parseOrigins = (value?: string) =>
  (value || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  /** Comma-separated list via FRONTEND_URL or ALLOWED_ORIGINS */
  corsOrigins: [
    ...parseOrigins(process.env.ALLOWED_ORIGINS),
    ...parseOrigins(process.env.FRONTEND_URL || 'http://localhost:5173'),
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    'http://localhost:5176',
    'https://zoo-management-system-oh9g.vercel.app',
  ].filter((origin, index, list) => origin && list.indexOf(origin) === index),
  // Vercel filesystem is ephemeral; /tmp is writable per invocation.
  uploadDir: process.env.UPLOAD_DIR || (isVercel ? '/tmp/uploads' : './uploads'),
};
