"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const requireEnv = (name) => {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};
const jwtSecret = isProduction
    ? requireEnv('JWT_SECRET')
    : (process.env.JWT_SECRET || 'dev-secret');
const jwtRefreshSecret = isProduction
    ? requireEnv('JWT_REFRESH_SECRET')
    : (process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret');
if (isProduction) {
    requireEnv('DATABASE_URL');
    if (jwtSecret.length < 32 || jwtRefreshSecret.length < 32) {
        throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be at least 32 characters in production');
    }
    if (jwtSecret === 'dev-secret' || jwtRefreshSecret === 'dev-refresh-secret') {
        throw new Error('Default JWT secrets are not allowed in production');
    }
}
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv,
    isProduction,
    jwt: {
        secret: jwtSecret,
        refreshSecret: jwtRefreshSecret,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    uploadDir: process.env.UPLOAD_DIR || './uploads',
};
//# sourceMappingURL=index.js.map