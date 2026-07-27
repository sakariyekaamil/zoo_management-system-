"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFound = exports.AppError = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const response_1 = require("../utils/response");
const config_1 = require("../config");
class AppError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const notFound = (req, res) => {
    (0, response_1.sendError)(res, `Route ${req.originalUrl} not found`, 404);
};
exports.notFound = notFound;
const errorHandler = (err, req, res, _next) => {
    logger_1.default.error(`${err.message}`, { stack: err.stack, url: req.originalUrl });
    if (err instanceof AppError) {
        return (0, response_1.sendError)(res, err.message, err.statusCode);
    }
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        return (0, response_1.sendError)(res, `Database error: ${err.message}`, 400);
    }
    if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        return (0, response_1.sendError)(res, 'Invalid data provided', 400);
    }
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return (0, response_1.sendError)(res, 'Invalid or expired token', 401);
    }
    const message = config_1.config.nodeEnv === 'development' ? err.message : 'Internal server error';
    return (0, response_1.sendError)(res, message, 500);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map