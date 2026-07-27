"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const createAuditLog = async (req, action, entity, entityId, details) => {
    try {
        await prisma_1.default.auditLog.create({
            data: {
                userId: req.user?.userId,
                action,
                entity,
                entityId,
                details,
                ipAddress: req.ip || req.socket.remoteAddress,
            },
        });
    }
    catch {
        // Non-blocking audit logging
    }
};
exports.createAuditLog = createAuditLog;
//# sourceMappingURL=auditService.js.map