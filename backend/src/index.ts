import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import logger from './utils/logger';
import { ensureDatabaseConnection } from './config/prisma';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: [config.frontendUrl, 'http://127.0.0.1:5173', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.resolve(config.uploadDir)));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts' },
});
app.use('/api/auth/login', authLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'WARRAN-CADDE Zoo API is running' });
});

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

const start = async () => {
  try {
    await ensureDatabaseConnection();
    logger.info('Database connection ready');
  } catch (error) {
    logger.error('Database is unreachable. Check Neon status and DATABASE_URL.', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  });
};

start();

export default app;
