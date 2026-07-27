"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.createCrudController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../config/prisma"));
const response_1 = require("../utils/response");
const errorHandler_1 = require("../middleware/errorHandler");
const auditService_1 = require("../services/auditService");
const params_1 = require("../utils/params");
const createCrudController = (model, options = {}) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma_1.default[model];
    const buildWhere = (query) => {
        const where = {};
        const { search, ...filters } = query;
        if (search && options.searchFields?.length) {
            where.OR = options.searchFields.map((field) => ({
                [field]: { contains: String(search), mode: 'insensitive' },
            }));
        }
        Object.entries(filters).forEach(([key, value]) => {
            if (value && !['page', 'limit', 'sortBy', 'sortOrder', 'search'].includes(key)) {
                where[key] = value;
            }
        });
        return where;
    };
    return {
        getAll: async (req, res, next) => {
            try {
                const { page, limit, skip } = (0, response_1.getPagination)(req.query);
                const where = buildWhere(req.query);
                const sortBy = String(req.query.sortBy || 'createdAt');
                const sortOrder = req.query.sortOrder || 'desc';
                const [data, total] = await Promise.all([
                    db.findMany({
                        where,
                        skip,
                        take: limit,
                        orderBy: { [sortBy]: sortOrder },
                        include: options.include,
                    }),
                    db.count({ where }),
                ]);
                (0, response_1.sendPaginated)(res, data, { page, limit, total });
            }
            catch (error) {
                next(error);
            }
        },
        getById: async (req, res, next) => {
            try {
                const record = await db.findUnique({
                    where: { id: (0, params_1.paramId)(req) },
                    include: options.include,
                });
                if (!record)
                    throw new errorHandler_1.AppError(`${String(model)} not found`, 404);
                (0, response_1.sendSuccess)(res, record);
            }
            catch (error) {
                next(error);
            }
        },
        create: async (req, res, next) => {
            try {
                let data = options.sanitize ? options.sanitize(req.body) : req.body;
                if (options.beforeCreate)
                    data = await options.beforeCreate(data, req);
                const record = await db.create({ data, include: options.include });
                if (options.afterCreate)
                    await options.afterCreate(record, req);
                await (0, auditService_1.createAuditLog)(req, 'CREATE', String(model), record.id, JSON.stringify(data));
                (0, response_1.sendSuccess)(res, record, 'Created successfully', 201);
            }
            catch (error) {
                next(error);
            }
        },
        update: async (req, res, next) => {
            try {
                let data = options.sanitize ? options.sanitize(req.body) : req.body;
                if (options.beforeUpdate)
                    data = await options.beforeUpdate(data, req);
                const id = (0, params_1.paramId)(req);
                const record = await db.update({
                    where: { id },
                    data,
                    include: options.include,
                });
                if (options.afterUpdate)
                    await options.afterUpdate(record, req);
                await (0, auditService_1.createAuditLog)(req, 'UPDATE', String(model), record.id);
                (0, response_1.sendSuccess)(res, record, 'Updated successfully');
            }
            catch (error) {
                if (error.code === 'P2025') {
                    return (0, response_1.sendError)(res, 'Record not found', 404);
                }
                next(error);
            }
        },
        remove: async (req, res, next) => {
            try {
                const id = (0, params_1.paramId)(req);
                await db.delete({ where: { id } });
                if (options.afterDelete)
                    await options.afterDelete(id, req);
                await (0, auditService_1.createAuditLog)(req, 'DELETE', String(model), id);
                (0, response_1.sendSuccess)(res, null, 'Deleted successfully');
            }
            catch (error) {
                if (error.code === 'P2025') {
                    return (0, response_1.sendError)(res, 'Record not found', 404);
                }
                next(error);
            }
        },
    };
};
exports.createCrudController = createCrudController;
// User-specific controller
exports.userController = {
    ...(0, exports.createCrudController)('user', {
        searchFields: ['email', 'firstName', 'lastName'],
        sanitize: (data) => {
            const { password, ...rest } = data;
            return rest;
        },
        beforeCreate: async (data) => {
            if (!data.password)
                throw new errorHandler_1.AppError('Password is required', 400);
            data.password = await bcryptjs_1.default.hash(String(data.password), 12);
            return data;
        },
        beforeUpdate: async (data) => {
            if (data.password) {
                data.password = await bcryptjs_1.default.hash(String(data.password), 12);
            }
            return data;
        },
    }),
    toggleActive: async (req, res, next) => {
        try {
            const id = (0, params_1.paramId)(req);
            const user = await prisma_1.default.user.findUnique({ where: { id } });
            if (!user)
                throw new errorHandler_1.AppError('User not found', 404);
            const updated = await prisma_1.default.user.update({
                where: { id },
                data: { isActive: !user.isActive },
                select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
            });
            await (0, auditService_1.createAuditLog)(req, 'UPDATE', 'User', updated.id, `Active: ${updated.isActive}`);
            (0, response_1.sendSuccess)(res, updated);
        }
        catch (error) {
            next(error);
        }
    },
    resetUserPassword: async (req, res, next) => {
        try {
            const { newPassword } = req.body;
            const hashed = await bcryptjs_1.default.hash(newPassword, 12);
            await prisma_1.default.user.update({
                where: { id: (0, params_1.paramId)(req) },
                data: { password: hashed },
            });
            (0, response_1.sendSuccess)(res, null, 'Password reset successfully');
        }
        catch (error) {
            next(error);
        }
    },
};
//# sourceMappingURL=crudController.js.map