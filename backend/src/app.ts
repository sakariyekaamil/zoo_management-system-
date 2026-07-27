import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();

app.set('trust proxy', 1);

const corsOrigins = [
  config.frontendUrl,
  'http://127.0.0.1:5173',
  'http://localhost:5173',
].filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.resolve(config.uploadDir)));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false, xForwardedForHeader: false },
});
app.use('/api', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false, xForwardedForHeader: false },
});
app.use('/api/auth/login', authLimiter);

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'WARRAN-CADDE Zoo API is running',
    health: '/api/health',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'WARRAN-CADDE Zoo API is running' });
});

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
