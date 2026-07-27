import dotenv from 'dotenv';
dotenv.config();

const isVercel = Boolean(process.env.VERCEL);

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
  // Vercel filesystem is ephemeral; /tmp is writable per invocation.
  uploadDir: process.env.UPLOAD_DIR || (isVercel ? '/tmp/uploads' : './uploads'),
};
