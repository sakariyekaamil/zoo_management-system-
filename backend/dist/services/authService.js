"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../config/prisma"));
const jwt_1 = require("../utils/jwt");
const errorHandler_1 = require("../middleware/errorHandler");
const sanitizeUser = (user) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    avatar: user.avatar,
    createdAt: user.createdAt,
});
exports.authService = {
    async login(email, password) {
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user || !user.isActive)
            throw new errorHandler_1.AppError('Invalid credentials', 401);
        const valid = await bcryptjs_1.default.compare(password, user.password);
        if (!valid)
            throw new errorHandler_1.AppError('Invalid credentials', 401);
        const payload = { userId: user.id, email: user.email, role: user.role };
        const accessToken = (0, jwt_1.generateAccessToken)(payload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(payload);
        await prisma_1.default.user.update({ where: { id: user.id }, data: { refreshToken } });
        return { user: sanitizeUser(user), accessToken, refreshToken };
    },
    async refresh(refreshToken) {
        const decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
        const user = await prisma_1.default.user.findUnique({ where: { id: decoded.userId } });
        if (!user || !user.isActive || user.refreshToken !== refreshToken) {
            throw new errorHandler_1.AppError('Invalid refresh token', 401);
        }
        const payload = { userId: user.id, email: user.email, role: user.role };
        const accessToken = (0, jwt_1.generateAccessToken)(payload);
        const newRefreshToken = (0, jwt_1.generateRefreshToken)(payload);
        await prisma_1.default.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });
        return { accessToken, refreshToken: newRefreshToken };
    },
    async logout(userId) {
        await prisma_1.default.user.update({ where: { id: userId }, data: { refreshToken: null } });
    },
    async forgotPassword(email) {
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user)
            return { message: 'If email exists, reset link sent' };
        const resetToken = (0, jwt_1.generateResetToken)();
        const resetTokenExpiry = new Date(Date.now() + 3600000);
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { resetToken, resetTokenExpiry },
        });
        return { message: 'If email exists, reset link sent', resetToken };
    },
    async resetPassword(token, newPassword) {
        const user = await prisma_1.default.user.findFirst({
            where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
        });
        if (!user)
            throw new errorHandler_1.AppError('Invalid or expired reset token', 400);
        const hashed = await bcryptjs_1.default.hash(newPassword, 12);
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { password: hashed, resetToken: null, resetTokenExpiry: null },
        });
    },
    async changePassword(userId, currentPassword, newPassword) {
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        const valid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!valid)
            throw new errorHandler_1.AppError('Current password is incorrect', 400);
        const hashed = await bcryptjs_1.default.hash(newPassword, 12);
        await prisma_1.default.user.update({ where: { id: userId }, data: { password: hashed } });
    },
    async getProfile(userId) {
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        return sanitizeUser(user);
    },
};
//# sourceMappingURL=authService.js.map