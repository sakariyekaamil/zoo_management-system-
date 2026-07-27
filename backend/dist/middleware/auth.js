"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authorize = exports.authenticate = exports.validate = void 0;
const express_validator_1 = require("express-validator");
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const permissions_1 = require("../config/permissions");
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return (0, response_1.sendError)(res, 'Validation failed', 422, errors.array());
    }
    next();
};
exports.validate = validate;
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.accessToken;
        if (!token) {
            return (0, response_1.sendError)(res, 'Authentication required', 401);
        }
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        req.user = decoded;
        next();
    }
    catch {
        return (0, response_1.sendError)(res, 'Invalid or expired token', 401);
    }
};
exports.authenticate = authenticate;
const authorize = (...resources) => {
    return (req, res, next) => {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'Authentication required', 401);
        }
        const allowed = resources.some((resource) => (0, permissions_1.hasPermission)(req.user.role, resource));
        if (!allowed) {
            return (0, response_1.sendError)(res, 'Forbidden: insufficient permissions', 403);
        }
        next();
    };
};
exports.authorize = authorize;
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'Authentication required', 401);
        }
        if (!roles.includes(req.user.role)) {
            return (0, response_1.sendError)(res, 'Forbidden: insufficient role', 403);
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
//# sourceMappingURL=auth.js.map