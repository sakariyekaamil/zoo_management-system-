"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.logout = exports.refresh = exports.login = void 0;
const authService_1 = require("../services/authService");
const response_1 = require("../utils/response");
const auditService_1 = require("../services/auditService");
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService_1.authService.login(email, password);
        await (0, auditService_1.createAuditLog)(req, 'LOGIN', 'User', result.user.id, `User ${email} logged in`);
        (0, response_1.sendSuccess)(res, result, 'Login successful');
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const result = await authService_1.authService.refresh(refreshToken);
        (0, response_1.sendSuccess)(res, result, 'Token refreshed');
    }
    catch (error) {
        next(error);
    }
};
exports.refresh = refresh;
const logout = async (req, res, next) => {
    try {
        if (req.user) {
            await authService_1.authService.logout(req.user.userId);
            await (0, auditService_1.createAuditLog)(req, 'LOGOUT', 'User', req.user.userId);
        }
        (0, response_1.sendSuccess)(res, null, 'Logged out successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
const forgotPassword = async (req, res, next) => {
    try {
        const result = await authService_1.authService.forgotPassword(req.body.email);
        (0, response_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res, next) => {
    try {
        await authService_1.authService.resetPassword(req.body.token, req.body.newPassword);
        (0, response_1.sendSuccess)(res, null, 'Password reset successful');
    }
    catch (error) {
        next(error);
    }
};
exports.resetPassword = resetPassword;
const changePassword = async (req, res, next) => {
    try {
        await authService_1.authService.changePassword(req.user.userId, req.body.currentPassword, req.body.newPassword);
        (0, response_1.sendSuccess)(res, null, 'Password changed successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.changePassword = changePassword;
const getProfile = async (req, res, next) => {
    try {
        const profile = await authService_1.authService.getProfile(req.user.userId);
        (0, response_1.sendSuccess)(res, profile);
    }
    catch (error) {
        next(error);
    }
};
exports.getProfile = getProfile;
//# sourceMappingURL=authController.js.map