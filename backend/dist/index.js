"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = __importDefault(require("./utils/logger"));
const app = (0, express_1.default)();
if (config_1.config.isProduction) {
    app.set('trust proxy', 1);
}
const corsOrigins = config_1.config.isProduction
    ? [config_1.config.frontendUrl]
    : [config_1.config.frontendUrl, 'http://127.0.0.1:5173', 'http://localhost:5173'];
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: config_1.config.isProduction ? undefined : false,
}));
app.use((0, cors_1.default)({
    origin: corsOrigins,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
const uploadPath = path_1.default.resolve(config_1.config.uploadDir);
if (!fs_1.default.existsSync(uploadPath)) {
    fs_1.default.mkdirSync(uploadPath, { recursive: true });
}
app.use('/uploads', express_1.default.static(uploadPath));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: config_1.config.isProduction ? 300 : 200,
    message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api', limiter);
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Too many login attempts' },
});
app.use('/api/auth/login', authLimiter);
app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'WARRAN-CADDE Zoo API is running' });
});
app.use('/api', routes_1.default);
const frontendDistCandidates = [
    path_1.default.resolve(__dirname, '../../frontend/dist'),
    path_1.default.resolve(process.cwd(), '../frontend/dist'),
    path_1.default.resolve(process.cwd(), 'public'),
];
const frontendDist = frontendDistCandidates.find((candidate) => fs_1.default.existsSync(path_1.default.join(candidate, 'index.html')));
if (frontendDist) {
    app.use(express_1.default.static(frontendDist));
    app.get(/^(?!\/api)(?!\/uploads).*/, (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD')
            return next();
        res.sendFile(path_1.default.join(frontendDist, 'index.html'), (error) => {
            if (error)
                next(error);
        });
    });
}
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
app.listen(config_1.config.port, () => {
    logger_1.default.info(`Server running on port ${config_1.config.port} in ${config_1.config.nodeEnv} mode`);
    if (frontendDist) {
        logger_1.default.info(`Serving frontend from ${frontendDist}`);
    }
});
exports.default = app;
//# sourceMappingURL=index.js.map