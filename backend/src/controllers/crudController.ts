import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { sendSuccess, sendPaginated, sendError, getPagination } from '../utils/response';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { createAuditLog } from '../services/auditService';
import { Prisma } from '@prisma/client';
import { paramId } from '../utils/params';

type WhereInput = Record<string, unknown>;

export const createCrudController = <T extends string>(
  model: T,
  options: {
    searchFields?: string[];
    include?: Record<string, boolean | object>;
    sanitize?: (data: Record<string, unknown>) => Record<string, unknown>;
    beforeCreate?: (data: Record<string, unknown>, req: AuthRequest) => Promise<Record<string, unknown>>;
    beforeUpdate?: (data: Record<string, unknown>, req: AuthRequest) => Promise<Record<string, unknown>>;
    afterCreate?: (record: unknown, req: AuthRequest) => Promise<void>;
    afterUpdate?: (record: unknown, req: AuthRequest) => Promise<void>;
    afterDelete?: (id: string, req: AuthRequest) => Promise<void>;
  } = {}
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma[model as keyof typeof prisma] as any;

  const buildWhere = (query: Record<string, unknown>): WhereInput => {
    const where: WhereInput = {};
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
    getAll: async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const { page, limit, skip } = getPagination(req.query as Record<string, unknown>);
        const where = buildWhere(req.query as Record<string, unknown>);
        const sortBy = String(req.query.sortBy || 'createdAt');
        const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

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

        sendPaginated(res, data, { page, limit, total });
      } catch (error) {
        next(error);
      }
    },

    getById: async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const record = await db.findUnique({
          where: { id: paramId(req) },
          include: options.include,
        });
        if (!record) throw new AppError(`${String(model)} not found`, 404);
        sendSuccess(res, record);
      } catch (error) {
        next(error);
      }
    },

    create: async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        let data = options.sanitize ? options.sanitize(req.body) : req.body;
        if (options.beforeCreate) data = await options.beforeCreate(data, req);

        const record = await db.create({ data, include: options.include });
        if (options.afterCreate) await options.afterCreate(record, req);
        await createAuditLog(req, 'CREATE', String(model), record.id, JSON.stringify(data));

        sendSuccess(res, record, 'Created successfully', 201);
      } catch (error) {
        next(error);
      }
    },

    update: async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        let data = options.sanitize ? options.sanitize(req.body) : req.body;
        if (options.beforeUpdate) data = await options.beforeUpdate(data, req);

        const id = paramId(req);
        const record = await db.update({
          where: { id },
          data,
          include: options.include,
        });
        if (options.afterUpdate) await options.afterUpdate(record, req);
        await createAuditLog(req, 'UPDATE', String(model), record.id);

        sendSuccess(res, record, 'Updated successfully');
      } catch (error) {
        if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2025') {
          return sendError(res, 'Record not found', 404);
        }
        next(error);
      }
    },

    remove: async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const id = paramId(req);
        await db.delete({ where: { id } });
        if (options.afterDelete) await options.afterDelete(id, req);
        await createAuditLog(req, 'DELETE', String(model), id);
        sendSuccess(res, null, 'Deleted successfully');
      } catch (error) {
        if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2025') {
          return sendError(res, 'Record not found', 404);
        }
        next(error);
      }
    },
  };
};

// User-specific controller
export const userController = {
  ...createCrudController('user', {
    searchFields: ['email', 'firstName', 'lastName'],
    sanitize: (data) => {
      const { password, ...rest } = data;
      return rest;
    },
    beforeCreate: async (data) => {
      if (!data.password) throw new AppError('Password is required', 400);
      data.password = await bcrypt.hash(String(data.password), 12);
      return data;
    },
    beforeUpdate: async (data) => {
      if (data.password) {
        data.password = await bcrypt.hash(String(data.password), 12);
      }
      return data;
    },
  }),

  toggleActive: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = paramId(req);
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) throw new AppError('User not found', 404);

      const updated = await prisma.user.update({
        where: { id },
        data: { isActive: !user.isActive },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
      });

      await createAuditLog(req, 'UPDATE', 'User', updated.id, `Active: ${updated.isActive}`);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  },

  resetUserPassword: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { newPassword } = req.body;
      const hashed = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: paramId(req) },
        data: { password: hashed },
      });
      sendSuccess(res, null, 'Password reset successfully');
    } catch (error) {
      next(error);
    }
  },
};
