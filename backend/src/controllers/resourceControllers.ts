import { Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import prisma from '../config/prisma';
import { config } from '../config';
import { sendSuccess, sendPaginated, getPagination } from '../utils/response';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { createAuditLog } from '../services/auditService';
import { createCrudController } from './crudController';
import { generateTicketNumber } from '../utils/response';
import { paramId } from '../utils/params';

const animalInclude = {
  species: true,
  enclosure: true,
  assignments: { include: { employee: true }, where: { isActive: true } },
  veterinaryRecords: { orderBy: { visitDate: 'desc' as const }, take: 5 },
  transfers: { orderBy: { transferDate: 'desc' as const }, take: 5, include: { fromEnclosure: true, toEnclosure: true } },
};

const sanitizeAnimalData = (data: Record<string, unknown>) => {
  const origin = String(data.origin || 'BIRTH').toUpperCase();
  if (origin !== 'BIRTH' && origin !== 'OTHER') {
    throw new AppError('Origin must be BIRTH or OTHER', 400);
  }

  const cleaned: Record<string, unknown> = {
    name: data.name,
    speciesId: data.speciesId,
    enclosureId: data.enclosureId,
    gender: data.gender,
    healthStatus: data.healthStatus,
    quantity: Math.max(1, Number(data.quantity) || 1),
    origin,
  };

  if (origin === 'OTHER') {
    const originPlace = String(data.originPlace || '').trim();
    if (!originPlace) {
      throw new AppError('Transfer/purchase place is required when origin is OTHER', 400);
    }
    cleaned.originPlace = originPlace;
    const originDescription = String(data.originDescription || '').trim();
    cleaned.originDescription = originDescription || null;
  } else {
    cleaned.originPlace = null;
    cleaned.originDescription = null;
  }

  if (data.weight !== undefined && data.weight !== '' && data.weight !== null) {
    cleaned.weight = Number(data.weight);
  }

  if (data.dateOfBirth && String(data.dateOfBirth).trim() !== '') {
    cleaned.dateOfBirth = new Date(String(data.dateOfBirth));
  }

  if (data.notes && String(data.notes).trim() !== '') {
    cleaned.notes = data.notes;
  }

  return cleaned;
};

export const animalController = {
  ...createCrudController('animal', {
    searchFields: ['name', 'notes', 'originPlace', 'originDescription'],
    include: { species: true, enclosure: true },
    sanitize: sanitizeAnimalData,
    beforeCreate: async (data) => sanitizeAnimalData(data),
    beforeUpdate: async (data) => sanitizeAnimalData(data),
  }),

  getProfile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const animal = await prisma.animal.findUnique({
        where: { id: paramId(req) },
        include: animalInclude,
      });
      if (!animal) throw new AppError('Animal not found', 404);
      sendSuccess(res, animal);
    } catch (error) {
      next(error);
    }
  },

  uploadPhoto: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new AppError('No file uploaded', 400);
      const existing = await prisma.animal.findUnique({
        where: { id: paramId(req) },
        select: { photo: true },
      });
      if (!existing) {
        await removeUploadedFile(`/uploads/${req.file.filename}`);
        throw new AppError('Animal not found', 404);
      }

      const photo = `/uploads/${req.file.filename}`;
      const animal = await prisma.animal.update({
        where: { id: paramId(req) },
        data: { photo },
        include: { species: true, enclosure: true },
      });
      await removeUploadedFile(existing.photo).catch(() => undefined);
      sendSuccess(res, animal, 'Photo uploaded');
    } catch (error) {
      next(error);
    }
  },

  transfer: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { toEnclosureId, reason, notes } = req.body;
      const animal = await prisma.animal.findUnique({
        where: { id: paramId(req) },
        include: { enclosure: true },
      });
      if (!animal) throw new AppError('Animal not found', 404);

      const toEnclosure = await prisma.enclosure.findUnique({ where: { id: toEnclosureId } });
      if (!toEnclosure) throw new AppError('Target enclosure not found', 404);

      const occupancy = await prisma.animal.aggregate({
        where: { enclosureId: toEnclosureId },
        _sum: { quantity: true },
      });
      const currentCount = occupancy._sum.quantity || 0;
      if (currentCount + animal.quantity > toEnclosure.capacity) {
        throw new AppError('Target enclosure is at full capacity', 400);
      }

      const [transfer, updated] = await prisma.$transaction([
        prisma.animalTransfer.create({
          data: {
            animalId: animal.id,
            fromEnclosureId: animal.enclosureId,
            toEnclosureId,
            reason,
            notes,
            transferredBy: req.user?.userId,
          },
        }),
        prisma.animal.update({
          where: { id: animal.id },
          data: { enclosureId: toEnclosureId },
          include: { species: true, enclosure: true },
        }),
      ]);

      await createAuditLog(req, 'CREATE', 'AnimalTransfer', transfer.id, reason);
      sendSuccess(res, { animal: updated, transfer }, 'Animal transferred');
    } catch (error) {
      next(error);
    }
  },
};

export const speciesController = createCrudController('species', {
  searchFields: ['name', 'scientificName'],
  beforeCreate: async (data) => {
    if (!data.scientificName) data.scientificName = data.name;
    return data;
  },
});

export const enclosureController = {
  ...createCrudController('enclosure', { searchFields: ['name', 'location'] }),

  getAvailable: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const enclosures = await prisma.enclosure.findMany({
        include: { animals: { select: { quantity: true } } },
      });
      const result = enclosures.map(({ animals, ...enclosure }) => {
        const currentCount = animals.reduce((total, animal) => total + animal.quantity, 0);
        return {
          ...enclosure,
          currentCount,
          available: enclosure.capacity - currentCount,
        };
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },
};

export const employeeController = createCrudController('employee', {
  searchFields: ['firstName', 'lastName', 'email', 'position'],
  include: { user: { select: { id: true, role: true } } },
});

export const assignmentController = createCrudController('animalAssignment', {
  include: { animal: { include: { species: true } }, employee: true },
});

const veterinaryInclude = {
  animal: { include: { species: true } },
  veterinarian: { select: { id: true, firstName: true, lastName: true } },
};

const removeUploadedFile = async (fileUrl?: string | null) => {
  if (!fileUrl?.startsWith('/uploads/')) return;

  const filePath = path.resolve(config.uploadDir, path.basename(fileUrl));
  try {
    await fs.unlink(filePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') throw error;
  }
};

const normalizeDateFields = (data: Record<string, unknown>, fields: string[]) => {
  const normalized = { ...data };
  for (const field of fields) {
    const value = normalized[field];
    if (value === '' || value === null || value === undefined) {
      delete normalized[field];
    } else {
      const parsed = new Date(String(value));
      if (Number.isNaN(parsed.getTime())) throw new AppError(`Invalid ${field}`, 400);
      normalized[field] = parsed;
    }
  }
  return normalized;
};

const normalizeVeterinaryDates = (data: Record<string, unknown>) =>
  normalizeDateFields(data, ['visitDate', 'nextVisit']);

export const veterinaryController = {
  ...createCrudController('veterinaryRecord', {
    searchFields: ['diagnosis', 'treatment', 'medicine'],
    include: veterinaryInclude,
    beforeCreate: async (data, req) => ({ ...normalizeVeterinaryDates(data), veterinarianId: req.user?.userId }),
    beforeUpdate: async (data) => normalizeVeterinaryDates(data),
  }),

  uploadCertificate: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new AppError('No certificate uploaded', 400);
      const recordId = paramId(req);

      const existing = await prisma.veterinaryRecord.findUnique({
        where: { id: recordId },
      });
      if (!existing) {
        await removeUploadedFile(`/uploads/${req.file.filename}`);
        throw new AppError('Veterinary record not found', 404);
      }

      const certificateUrl = `/uploads/${req.file.filename}`;
      const record = await prisma.veterinaryRecord.update({
        where: { id: recordId },
        data: { certificateUrl },
        include: veterinaryInclude,
      });

      await removeUploadedFile(existing.certificateUrl).catch(() => undefined);
      await createAuditLog(req, 'UPDATE', 'VeterinaryRecord', record.id, 'Medical certificate uploaded');
      sendSuccess(res, record, 'Medical certificate uploaded');
    } catch (error) {
      next(error);
    }
  },
};

const normalizeVaccinationDates = (data: Record<string, unknown>) =>
  normalizeDateFields(data, ['administeredDate', 'expiryDate', 'nextDueDate']);

export const vaccinationController = {
  ...createCrudController('vaccination', {
    include: { animal: { include: { species: true } } },
    beforeCreate: async (data) => normalizeVaccinationDates(data),
    beforeUpdate: async (data) => normalizeVaccinationDates(data),
  }),

  getUpcoming: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const vaccinations = await prisma.vaccination.findMany({
        where: { nextDueDate: { gte: new Date() } },
        include: { animal: { include: { species: true } } },
        orderBy: { nextDueDate: 'asc' },
        take: 20,
      });
      sendSuccess(res, vaccinations);
    } catch (error) {
      next(error);
    }
  },

  getExpired: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const vaccinations = await prisma.vaccination.findMany({
        where: { expiryDate: { lt: new Date() } },
        include: { animal: { include: { species: true } } },
        orderBy: { expiryDate: 'desc' },
      });
      sendSuccess(res, vaccinations);
    } catch (error) {
      next(error);
    }
  },
};

export const foodInventoryController = {
  ...createCrudController('foodInventory', {
    searchFields: ['name', 'category'],
    include: { supplier: true },
  }),

  getLowStock: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const items = await prisma.$queryRaw`
        SELECT fi.*, s.name as supplier_name
        FROM food_inventory fi
        LEFT JOIN suppliers s ON fi.supplier_id = s.id
        WHERE fi.quantity <= fi.min_stock_level
        ORDER BY fi.quantity ASC
      `;
      sendSuccess(res, items);
    } catch (error) {
      next(error);
    }
  },

  stockIn: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { quantity } = req.body;
      const item = await prisma.foodInventory.update({
        where: { id: paramId(req) },
        data: { quantity: { increment: parseFloat(quantity) } },
      });
      sendSuccess(res, item, 'Stock added');
    } catch (error) {
      next(error);
    }
  },

  stockOut: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { quantity } = req.body;
      const item = await prisma.foodInventory.findUnique({ where: { id: paramId(req) } });
      if (!item) throw new AppError('Food item not found', 404);
      if (item.quantity < parseFloat(quantity)) throw new AppError('Insufficient stock', 400);

      const updated = await prisma.foodInventory.update({
        where: { id: paramId(req) },
        data: { quantity: { decrement: parseFloat(quantity) } },
      });
      sendSuccess(res, updated, 'Stock removed');
    } catch (error) {
      next(error);
    }
  },
};

const normalizeFeedingData = (data: Record<string, unknown>) => {
  const normalized = normalizeDateFields(data, ['scheduledTime']);
  if (normalized.keeperId === '' || normalized.keeperId === undefined) {
    normalized.keeperId = null;
  }
  return normalized;
};

export const feedingScheduleController = {
  ...createCrudController('feedingSchedule', {
    include: { animal: { include: { species: true } }, food: true, keeper: true },
    beforeCreate: async (data) => normalizeFeedingData(data),
    beforeUpdate: async (data) => normalizeFeedingData(data),
  }),

  completeFeeding: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const schedule = await prisma.feedingSchedule.findUnique({
        where: { id: paramId(req) },
        include: { food: true },
      });
      if (!schedule) throw new AppError('Schedule not found', 404);
      if (schedule.isCompleted) throw new AppError('Already completed', 400);

      if (schedule.food.quantity < schedule.quantity) {
        throw new AppError('Insufficient food inventory', 400);
      }

      const [updated] = await prisma.$transaction([
        prisma.feedingSchedule.update({
          where: { id: paramId(req) },
          data: { isCompleted: true, completedAt: new Date() },
          include: { animal: true, food: true, keeper: true },
        }),
        prisma.foodInventory.update({
          where: { id: schedule.foodId },
          data: { quantity: { decrement: schedule.quantity } },
        }),
      ]);

      sendSuccess(res, updated, 'Feeding completed, inventory updated');
    } catch (error) {
      next(error);
    }
  },
};

export const visitorController = createCrudController('visitor', {
  searchFields: ['firstName', 'lastName', 'email', 'phone'],
  include: { tickets: { include: { ticketType: true, payments: true } } },
});

export const ticketTypeController = createCrudController('ticketType', {
  searchFields: ['name'],
});

export const ticketController = {
  ...createCrudController('ticket', {
    include: { visitor: true, ticketType: true, payments: true },
  }),

  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { visitorId, ticketTypeId, quantity = 1 } = req.body;
      const ticketType = await prisma.ticketType.findUnique({ where: { id: ticketTypeId } });
      if (!ticketType) throw new AppError('Ticket type not found', 404);

      const totalAmount = ticketType.price * quantity;
      const ticket = await prisma.ticket.create({
        data: {
          visitorId,
          ticketTypeId,
          ticketNumber: generateTicketNumber(),
          quantity,
          totalAmount,
        },
        include: { visitor: true, ticketType: true },
      });

      await createAuditLog(req, 'CREATE', 'Ticket', ticket.id);
      sendSuccess(res, ticket, 'Ticket created', 201);
    } catch (error) {
      next(error);
    }
  },
};

const calculatePaymentAmount = async (
  data: Record<string, unknown>,
  req: AuthRequest,
) => {
  let ticketId = data.ticketId ? String(data.ticketId) : undefined;
  if (!ticketId) {
    const paymentId = req.params.id ? paramId(req) : '';
    if (paymentId) {
      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      ticketId = payment?.ticketId;
    }
  }
  if (!ticketId) throw new AppError('Ticket is required', 400);

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new AppError('Ticket not found', 404);

  const discount = Number(data.discount ?? 0);
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
    throw new AppError('Discount must be between 0 and 100', 400);
  }

  const amount = Math.round(ticket.totalAmount * (1 - discount / 100) * 100) / 100;
  return { ...data, ticketId, discount, amount };
};

export const paymentController = createCrudController('payment', {
  include: { ticket: { include: { visitor: true, ticketType: true } } },
  beforeCreate: calculatePaymentAmount,
  beforeUpdate: calculatePaymentAmount,
});

export const supplierController = createCrudController('supplier', {
  searchFields: ['name', 'contactPerson', 'email'],
  include: { _count: { select: { foodPurchases: true } } },
});

export const foodPurchaseController = {
  ...createCrudController('foodPurchase', {
    include: { food: true, supplier: true },
  }),

  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { foodId, supplierId, quantity, unitPrice, purchaseDate, notes } = req.body;
      const totalCost = quantity * unitPrice;

      const [purchase] = await prisma.$transaction([
        prisma.foodPurchase.create({
          data: { foodId, supplierId, quantity, unitPrice, totalCost, purchaseDate, notes },
          include: { food: true, supplier: true },
        }),
        prisma.foodInventory.update({
          where: { id: foodId },
          data: { quantity: { increment: quantity } },
        }),
      ]);

      await createAuditLog(req, 'CREATE', 'FoodPurchase', purchase.id);
      sendSuccess(res, purchase, 'Purchase recorded, inventory updated', 201);
    } catch (error) {
      next(error);
    }
  },
};

const normalizeExpenseData = async (data: Record<string, unknown>) => {
  if (data.category !== 'SALARY') return { ...data, employeeId: null, bonus: 0 };

  if (!data.employeeId) throw new AppError('Employee is required for salary expenses', 400);
  const employee = await prisma.employee.findUnique({
    where: { id: String(data.employeeId) },
  });
  if (!employee) throw new AppError('Employee not found', 404);
  const bonus = Number(data.bonus ?? 0);
  if (!Number.isFinite(bonus) || bonus < 0) {
    throw new AppError('Bonus must be zero or greater', 400);
  }

  return {
    ...data,
    employeeId: employee.id,
    description: `Salary - ${employee.firstName} ${employee.lastName}`,
    bonus,
    amount: employee.salary + bonus,
  };
};

export const expenseController = createCrudController('expense', {
  searchFields: ['description'],
  include: {
    recorder: { select: { id: true, firstName: true, lastName: true } },
    employee: { select: { id: true, firstName: true, lastName: true, salary: true } },
  },
  beforeCreate: async (data, req) => ({
    ...await normalizeExpenseData(data),
    recordedBy: req.user?.userId,
  }),
  beforeUpdate: async (data) => normalizeExpenseData(data),
});

export const maintenanceController = createCrudController('maintenance', {
  include: { enclosure: true },
});

export const transferController = createCrudController('animalTransfer', {
  include: {
    animal: { include: { species: true } },
    fromEnclosure: true,
    toEnclosure: true,
    transferrer: { select: { id: true, firstName: true, lastName: true } },
  },
});

export const auditLogController = {
  getAll: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, skip } = getPagination(req.query as Record<string, unknown>);
      const where: Record<string, unknown> = {};
      if (req.query.action) where.action = req.query.action;
      if (req.query.entity) where.entity = { contains: String(req.query.entity), mode: 'insensitive' };

      const [data, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        }),
        prisma.auditLog.count({ where }),
      ]);

      sendPaginated(res, data, { page, limit, total });
    } catch (error) {
      next(error);
    }
  },
};

export const settingsController = {
  get: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      let settings = await prisma.zooSettings.findFirst();
      if (!settings) {
        settings = await prisma.zooSettings.create({ data: {} });
      }
      sendSuccess(res, settings);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      let settings = await prisma.zooSettings.findFirst();
      if (!settings) {
        settings = await prisma.zooSettings.create({ data: req.body });
      } else {
        settings = await prisma.zooSettings.update({ where: { id: settings.id }, data: req.body });
      }
      sendSuccess(res, settings, 'Settings updated');
    } catch (error) {
      next(error);
    }
  },

  uploadLogo: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new AppError('No file uploaded', 400);
      const logo = `/uploads/${req.file.filename}`;
      let settings = await prisma.zooSettings.findFirst();
      if (!settings) {
        settings = await prisma.zooSettings.create({ data: { logo } });
      } else {
        settings = await prisma.zooSettings.update({ where: { id: settings.id }, data: { logo } });
      }
      sendSuccess(res, settings, 'Logo uploaded');
    } catch (error) {
      next(error);
    }
  },
};

export const reportController = {
  getSummary: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { type } = req.query;
      let data: unknown;

      switch (type) {
        case 'animals':
          data = await prisma.animal.findMany({ include: { species: true, enclosure: true } });
          break;
        case 'visitors':
          data = await prisma.visitor.findMany({ include: { tickets: true } });
          break;
        case 'revenue':
          data = await prisma.payment.findMany({
            where: { status: 'COMPLETED' },
            include: { ticket: { include: { visitor: true, ticketType: true } } },
          });
          break;
        case 'expenses':
          data = await prisma.expense.findMany({ include: { recorder: true, employee: true } });
          break;
        case 'inventory':
          data = await prisma.foodInventory.findMany({ include: { supplier: true } });
          break;
        case 'veterinary':
          data = await prisma.veterinaryRecord.findMany({
            include: { animal: { include: { species: true } } },
          });
          break;
        case 'vaccinations':
          data = await prisma.vaccination.findMany({
            include: { animal: { include: { species: true } } },
            orderBy: { administeredDate: 'desc' },
          });
          break;
        case 'payments':
          data = await prisma.payment.findMany({
            include: { ticket: { include: { visitor: true, ticketType: true } } },
          });
          break;
        default:
          throw new AppError('Invalid report type', 400);
      }

      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  },
};
