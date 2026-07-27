"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportController = exports.settingsController = exports.auditLogController = exports.transferController = exports.maintenanceController = exports.expenseController = exports.foodPurchaseController = exports.supplierController = exports.paymentController = exports.ticketController = exports.ticketTypeController = exports.visitorController = exports.feedingScheduleController = exports.foodInventoryController = exports.vaccinationController = exports.veterinaryController = exports.assignmentController = exports.employeeController = exports.enclosureController = exports.speciesController = exports.animalController = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("../config/prisma"));
const config_1 = require("../config");
const response_1 = require("../utils/response");
const errorHandler_1 = require("../middleware/errorHandler");
const auditService_1 = require("../services/auditService");
const crudController_1 = require("./crudController");
const response_2 = require("../utils/response");
const params_1 = require("../utils/params");
const animalInclude = {
    species: true,
    enclosure: true,
    assignments: { include: { employee: true }, where: { isActive: true } },
    veterinaryRecords: { orderBy: { visitDate: 'desc' }, take: 5 },
    transfers: { orderBy: { transferDate: 'desc' }, take: 5, include: { fromEnclosure: true, toEnclosure: true } },
};
const sanitizeAnimalData = (data) => {
    const cleaned = {
        name: data.name,
        speciesId: data.speciesId,
        enclosureId: data.enclosureId,
        gender: data.gender,
        healthStatus: data.healthStatus,
        quantity: Math.max(1, Number(data.quantity) || 1),
    };
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
exports.animalController = {
    ...(0, crudController_1.createCrudController)('animal', {
        searchFields: ['name', 'notes'],
        include: { species: true, enclosure: true },
        sanitize: sanitizeAnimalData,
        beforeCreate: async (data) => sanitizeAnimalData(data),
        beforeUpdate: async (data) => sanitizeAnimalData(data),
    }),
    getProfile: async (req, res, next) => {
        try {
            const animal = await prisma_1.default.animal.findUnique({
                where: { id: (0, params_1.paramId)(req) },
                include: animalInclude,
            });
            if (!animal)
                throw new errorHandler_1.AppError('Animal not found', 404);
            (0, response_1.sendSuccess)(res, animal);
        }
        catch (error) {
            next(error);
        }
    },
    uploadPhoto: async (req, res, next) => {
        try {
            if (!req.file)
                throw new errorHandler_1.AppError('No file uploaded', 400);
            const existing = await prisma_1.default.animal.findUnique({
                where: { id: (0, params_1.paramId)(req) },
                select: { photo: true },
            });
            if (!existing) {
                await removeUploadedFile(`/uploads/${req.file.filename}`);
                throw new errorHandler_1.AppError('Animal not found', 404);
            }
            const photo = `/uploads/${req.file.filename}`;
            const animal = await prisma_1.default.animal.update({
                where: { id: (0, params_1.paramId)(req) },
                data: { photo },
                include: { species: true, enclosure: true },
            });
            await removeUploadedFile(existing.photo).catch(() => undefined);
            (0, response_1.sendSuccess)(res, animal, 'Photo uploaded');
        }
        catch (error) {
            next(error);
        }
    },
    transfer: async (req, res, next) => {
        try {
            const { toEnclosureId, reason, notes } = req.body;
            const animal = await prisma_1.default.animal.findUnique({
                where: { id: (0, params_1.paramId)(req) },
                include: { enclosure: true },
            });
            if (!animal)
                throw new errorHandler_1.AppError('Animal not found', 404);
            const toEnclosure = await prisma_1.default.enclosure.findUnique({ where: { id: toEnclosureId } });
            if (!toEnclosure)
                throw new errorHandler_1.AppError('Target enclosure not found', 404);
            const occupancy = await prisma_1.default.animal.aggregate({
                where: { enclosureId: toEnclosureId },
                _sum: { quantity: true },
            });
            const currentCount = occupancy._sum.quantity || 0;
            if (currentCount + animal.quantity > toEnclosure.capacity) {
                throw new errorHandler_1.AppError('Target enclosure is at full capacity', 400);
            }
            const [transfer, updated] = await prisma_1.default.$transaction([
                prisma_1.default.animalTransfer.create({
                    data: {
                        animalId: animal.id,
                        fromEnclosureId: animal.enclosureId,
                        toEnclosureId,
                        reason,
                        notes,
                        transferredBy: req.user?.userId,
                    },
                }),
                prisma_1.default.animal.update({
                    where: { id: animal.id },
                    data: { enclosureId: toEnclosureId },
                    include: { species: true, enclosure: true },
                }),
            ]);
            await (0, auditService_1.createAuditLog)(req, 'CREATE', 'AnimalTransfer', transfer.id, reason);
            (0, response_1.sendSuccess)(res, { animal: updated, transfer }, 'Animal transferred');
        }
        catch (error) {
            next(error);
        }
    },
};
exports.speciesController = (0, crudController_1.createCrudController)('species', {
    searchFields: ['name', 'scientificName'],
    beforeCreate: async (data) => {
        if (!data.scientificName)
            data.scientificName = data.name;
        return data;
    },
});
exports.enclosureController = {
    ...(0, crudController_1.createCrudController)('enclosure', { searchFields: ['name', 'location'] }),
    getAvailable: async (req, res, next) => {
        try {
            const enclosures = await prisma_1.default.enclosure.findMany({
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
            (0, response_1.sendSuccess)(res, result);
        }
        catch (error) {
            next(error);
        }
    },
};
exports.employeeController = (0, crudController_1.createCrudController)('employee', {
    searchFields: ['firstName', 'lastName', 'email', 'position'],
    include: { user: { select: { id: true, role: true } } },
});
exports.assignmentController = (0, crudController_1.createCrudController)('animalAssignment', {
    include: { animal: { include: { species: true } }, employee: true },
});
const veterinaryInclude = {
    animal: { include: { species: true } },
    veterinarian: { select: { id: true, firstName: true, lastName: true } },
};
const removeUploadedFile = async (fileUrl) => {
    if (!fileUrl?.startsWith('/uploads/'))
        return;
    const filePath = path_1.default.resolve(config_1.config.uploadDir, path_1.default.basename(fileUrl));
    try {
        await promises_1.default.unlink(filePath);
    }
    catch (error) {
        const code = error.code;
        if (code !== 'ENOENT')
            throw error;
    }
};
const normalizeDateFields = (data, fields) => {
    const normalized = { ...data };
    for (const field of fields) {
        const value = normalized[field];
        if (value === '' || value === null || value === undefined) {
            delete normalized[field];
        }
        else {
            const parsed = new Date(String(value));
            if (Number.isNaN(parsed.getTime()))
                throw new errorHandler_1.AppError(`Invalid ${field}`, 400);
            normalized[field] = parsed;
        }
    }
    return normalized;
};
const normalizeVeterinaryDates = (data) => normalizeDateFields(data, ['visitDate', 'nextVisit']);
exports.veterinaryController = {
    ...(0, crudController_1.createCrudController)('veterinaryRecord', {
        searchFields: ['diagnosis', 'treatment', 'medicine'],
        include: veterinaryInclude,
        beforeCreate: async (data, req) => ({ ...normalizeVeterinaryDates(data), veterinarianId: req.user?.userId }),
        beforeUpdate: async (data) => normalizeVeterinaryDates(data),
    }),
    uploadCertificate: async (req, res, next) => {
        try {
            if (!req.file)
                throw new errorHandler_1.AppError('No certificate uploaded', 400);
            const recordId = (0, params_1.paramId)(req);
            const existing = await prisma_1.default.veterinaryRecord.findUnique({
                where: { id: recordId },
            });
            if (!existing) {
                await removeUploadedFile(`/uploads/${req.file.filename}`);
                throw new errorHandler_1.AppError('Veterinary record not found', 404);
            }
            const certificateUrl = `/uploads/${req.file.filename}`;
            const record = await prisma_1.default.veterinaryRecord.update({
                where: { id: recordId },
                data: { certificateUrl },
                include: veterinaryInclude,
            });
            await removeUploadedFile(existing.certificateUrl).catch(() => undefined);
            await (0, auditService_1.createAuditLog)(req, 'UPDATE', 'VeterinaryRecord', record.id, 'Medical certificate uploaded');
            (0, response_1.sendSuccess)(res, record, 'Medical certificate uploaded');
        }
        catch (error) {
            next(error);
        }
    },
};
const normalizeVaccinationDates = (data) => normalizeDateFields(data, ['administeredDate', 'expiryDate', 'nextDueDate']);
exports.vaccinationController = {
    ...(0, crudController_1.createCrudController)('vaccination', {
        include: { animal: { include: { species: true } } },
        beforeCreate: async (data) => normalizeVaccinationDates(data),
        beforeUpdate: async (data) => normalizeVaccinationDates(data),
    }),
    getUpcoming: async (req, res, next) => {
        try {
            const vaccinations = await prisma_1.default.vaccination.findMany({
                where: { nextDueDate: { gte: new Date() } },
                include: { animal: { include: { species: true } } },
                orderBy: { nextDueDate: 'asc' },
                take: 20,
            });
            (0, response_1.sendSuccess)(res, vaccinations);
        }
        catch (error) {
            next(error);
        }
    },
    getExpired: async (req, res, next) => {
        try {
            const vaccinations = await prisma_1.default.vaccination.findMany({
                where: { expiryDate: { lt: new Date() } },
                include: { animal: { include: { species: true } } },
                orderBy: { expiryDate: 'desc' },
            });
            (0, response_1.sendSuccess)(res, vaccinations);
        }
        catch (error) {
            next(error);
        }
    },
};
exports.foodInventoryController = {
    ...(0, crudController_1.createCrudController)('foodInventory', {
        searchFields: ['name', 'category'],
        include: { supplier: true },
    }),
    getLowStock: async (req, res, next) => {
        try {
            const items = await prisma_1.default.$queryRaw `
        SELECT fi.*, s.name as supplier_name
        FROM food_inventory fi
        LEFT JOIN suppliers s ON fi.supplier_id = s.id
        WHERE fi.quantity <= fi.min_stock_level
        ORDER BY fi.quantity ASC
      `;
            (0, response_1.sendSuccess)(res, items);
        }
        catch (error) {
            next(error);
        }
    },
    stockIn: async (req, res, next) => {
        try {
            const { quantity } = req.body;
            const item = await prisma_1.default.foodInventory.update({
                where: { id: (0, params_1.paramId)(req) },
                data: { quantity: { increment: parseFloat(quantity) } },
            });
            (0, response_1.sendSuccess)(res, item, 'Stock added');
        }
        catch (error) {
            next(error);
        }
    },
    stockOut: async (req, res, next) => {
        try {
            const { quantity } = req.body;
            const item = await prisma_1.default.foodInventory.findUnique({ where: { id: (0, params_1.paramId)(req) } });
            if (!item)
                throw new errorHandler_1.AppError('Food item not found', 404);
            if (item.quantity < parseFloat(quantity))
                throw new errorHandler_1.AppError('Insufficient stock', 400);
            const updated = await prisma_1.default.foodInventory.update({
                where: { id: (0, params_1.paramId)(req) },
                data: { quantity: { decrement: parseFloat(quantity) } },
            });
            (0, response_1.sendSuccess)(res, updated, 'Stock removed');
        }
        catch (error) {
            next(error);
        }
    },
};
const normalizeFeedingData = (data) => {
    const normalized = normalizeDateFields(data, ['scheduledTime']);
    if (normalized.keeperId === '' || normalized.keeperId === undefined) {
        normalized.keeperId = null;
    }
    return normalized;
};
exports.feedingScheduleController = {
    ...(0, crudController_1.createCrudController)('feedingSchedule', {
        include: { animal: { include: { species: true } }, food: true, keeper: true },
        beforeCreate: async (data) => normalizeFeedingData(data),
        beforeUpdate: async (data) => normalizeFeedingData(data),
    }),
    completeFeeding: async (req, res, next) => {
        try {
            const schedule = await prisma_1.default.feedingSchedule.findUnique({
                where: { id: (0, params_1.paramId)(req) },
                include: { food: true },
            });
            if (!schedule)
                throw new errorHandler_1.AppError('Schedule not found', 404);
            if (schedule.isCompleted)
                throw new errorHandler_1.AppError('Already completed', 400);
            if (schedule.food.quantity < schedule.quantity) {
                throw new errorHandler_1.AppError('Insufficient food inventory', 400);
            }
            const [updated] = await prisma_1.default.$transaction([
                prisma_1.default.feedingSchedule.update({
                    where: { id: (0, params_1.paramId)(req) },
                    data: { isCompleted: true, completedAt: new Date() },
                    include: { animal: true, food: true, keeper: true },
                }),
                prisma_1.default.foodInventory.update({
                    where: { id: schedule.foodId },
                    data: { quantity: { decrement: schedule.quantity } },
                }),
            ]);
            (0, response_1.sendSuccess)(res, updated, 'Feeding completed, inventory updated');
        }
        catch (error) {
            next(error);
        }
    },
};
exports.visitorController = (0, crudController_1.createCrudController)('visitor', {
    searchFields: ['firstName', 'lastName', 'email', 'phone'],
    include: { tickets: { include: { ticketType: true, payments: true } } },
});
exports.ticketTypeController = (0, crudController_1.createCrudController)('ticketType', {
    searchFields: ['name'],
});
exports.ticketController = {
    ...(0, crudController_1.createCrudController)('ticket', {
        include: { visitor: true, ticketType: true, payments: true },
    }),
    create: async (req, res, next) => {
        try {
            const { visitorId, ticketTypeId, quantity = 1 } = req.body;
            const ticketType = await prisma_1.default.ticketType.findUnique({ where: { id: ticketTypeId } });
            if (!ticketType)
                throw new errorHandler_1.AppError('Ticket type not found', 404);
            const totalAmount = ticketType.price * quantity;
            const ticket = await prisma_1.default.ticket.create({
                data: {
                    visitorId,
                    ticketTypeId,
                    ticketNumber: (0, response_2.generateTicketNumber)(),
                    quantity,
                    totalAmount,
                },
                include: { visitor: true, ticketType: true },
            });
            await (0, auditService_1.createAuditLog)(req, 'CREATE', 'Ticket', ticket.id);
            (0, response_1.sendSuccess)(res, ticket, 'Ticket created', 201);
        }
        catch (error) {
            next(error);
        }
    },
};
const calculatePaymentAmount = async (data, req) => {
    let ticketId = data.ticketId ? String(data.ticketId) : undefined;
    if (!ticketId) {
        const paymentId = req.params.id ? (0, params_1.paramId)(req) : '';
        if (paymentId) {
            const payment = await prisma_1.default.payment.findUnique({ where: { id: paymentId } });
            ticketId = payment?.ticketId;
        }
    }
    if (!ticketId)
        throw new errorHandler_1.AppError('Ticket is required', 400);
    const ticket = await prisma_1.default.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket)
        throw new errorHandler_1.AppError('Ticket not found', 404);
    const discount = Number(data.discount ?? 0);
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
        throw new errorHandler_1.AppError('Discount must be between 0 and 100', 400);
    }
    const amount = Math.round(ticket.totalAmount * (1 - discount / 100) * 100) / 100;
    return { ...data, ticketId, discount, amount };
};
exports.paymentController = (0, crudController_1.createCrudController)('payment', {
    include: { ticket: { include: { visitor: true, ticketType: true } } },
    beforeCreate: calculatePaymentAmount,
    beforeUpdate: calculatePaymentAmount,
});
exports.supplierController = (0, crudController_1.createCrudController)('supplier', {
    searchFields: ['name', 'contactPerson', 'email'],
    include: { _count: { select: { foodPurchases: true } } },
});
exports.foodPurchaseController = {
    ...(0, crudController_1.createCrudController)('foodPurchase', {
        include: { food: true, supplier: true },
    }),
    create: async (req, res, next) => {
        try {
            const { foodId, supplierId, quantity, unitPrice, purchaseDate, notes } = req.body;
            const totalCost = quantity * unitPrice;
            const [purchase] = await prisma_1.default.$transaction([
                prisma_1.default.foodPurchase.create({
                    data: { foodId, supplierId, quantity, unitPrice, totalCost, purchaseDate, notes },
                    include: { food: true, supplier: true },
                }),
                prisma_1.default.foodInventory.update({
                    where: { id: foodId },
                    data: { quantity: { increment: quantity } },
                }),
            ]);
            await (0, auditService_1.createAuditLog)(req, 'CREATE', 'FoodPurchase', purchase.id);
            (0, response_1.sendSuccess)(res, purchase, 'Purchase recorded, inventory updated', 201);
        }
        catch (error) {
            next(error);
        }
    },
};
const normalizeExpenseData = async (data) => {
    if (data.category !== 'SALARY')
        return { ...data, employeeId: null, bonus: 0 };
    if (!data.employeeId)
        throw new errorHandler_1.AppError('Employee is required for salary expenses', 400);
    const employee = await prisma_1.default.employee.findUnique({
        where: { id: String(data.employeeId) },
    });
    if (!employee)
        throw new errorHandler_1.AppError('Employee not found', 404);
    const bonus = Number(data.bonus ?? 0);
    if (!Number.isFinite(bonus) || bonus < 0) {
        throw new errorHandler_1.AppError('Bonus must be zero or greater', 400);
    }
    return {
        ...data,
        employeeId: employee.id,
        description: `Salary - ${employee.firstName} ${employee.lastName}`,
        bonus,
        amount: employee.salary + bonus,
    };
};
exports.expenseController = (0, crudController_1.createCrudController)('expense', {
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
exports.maintenanceController = (0, crudController_1.createCrudController)('maintenance', {
    include: { enclosure: true },
});
exports.transferController = (0, crudController_1.createCrudController)('animalTransfer', {
    include: {
        animal: { include: { species: true } },
        fromEnclosure: true,
        toEnclosure: true,
        transferrer: { select: { id: true, firstName: true, lastName: true } },
    },
});
exports.auditLogController = {
    getAll: async (req, res, next) => {
        try {
            const { page, limit, skip } = (0, response_1.getPagination)(req.query);
            const where = {};
            if (req.query.action)
                where.action = req.query.action;
            if (req.query.entity)
                where.entity = { contains: String(req.query.entity), mode: 'insensitive' };
            const [data, total] = await Promise.all([
                prisma_1.default.auditLog.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
                }),
                prisma_1.default.auditLog.count({ where }),
            ]);
            (0, response_1.sendPaginated)(res, data, { page, limit, total });
        }
        catch (error) {
            next(error);
        }
    },
};
exports.settingsController = {
    get: async (req, res, next) => {
        try {
            let settings = await prisma_1.default.zooSettings.findFirst();
            if (!settings) {
                settings = await prisma_1.default.zooSettings.create({ data: {} });
            }
            (0, response_1.sendSuccess)(res, settings);
        }
        catch (error) {
            next(error);
        }
    },
    update: async (req, res, next) => {
        try {
            let settings = await prisma_1.default.zooSettings.findFirst();
            if (!settings) {
                settings = await prisma_1.default.zooSettings.create({ data: req.body });
            }
            else {
                settings = await prisma_1.default.zooSettings.update({ where: { id: settings.id }, data: req.body });
            }
            (0, response_1.sendSuccess)(res, settings, 'Settings updated');
        }
        catch (error) {
            next(error);
        }
    },
    uploadLogo: async (req, res, next) => {
        try {
            if (!req.file)
                throw new errorHandler_1.AppError('No file uploaded', 400);
            const logo = `/uploads/${req.file.filename}`;
            let settings = await prisma_1.default.zooSettings.findFirst();
            if (!settings) {
                settings = await prisma_1.default.zooSettings.create({ data: { logo } });
            }
            else {
                settings = await prisma_1.default.zooSettings.update({ where: { id: settings.id }, data: { logo } });
            }
            (0, response_1.sendSuccess)(res, settings, 'Logo uploaded');
        }
        catch (error) {
            next(error);
        }
    },
};
exports.reportController = {
    getSummary: async (req, res, next) => {
        try {
            const { type } = req.query;
            let data;
            switch (type) {
                case 'animals':
                    data = await prisma_1.default.animal.findMany({ include: { species: true, enclosure: true } });
                    break;
                case 'visitors':
                    data = await prisma_1.default.visitor.findMany({ include: { tickets: true } });
                    break;
                case 'revenue':
                    data = await prisma_1.default.payment.findMany({
                        where: { status: 'COMPLETED' },
                        include: { ticket: { include: { visitor: true, ticketType: true } } },
                    });
                    break;
                case 'expenses':
                    data = await prisma_1.default.expense.findMany({ include: { recorder: true, employee: true } });
                    break;
                case 'inventory':
                    data = await prisma_1.default.foodInventory.findMany({ include: { supplier: true } });
                    break;
                case 'veterinary':
                    data = await prisma_1.default.veterinaryRecord.findMany({
                        include: { animal: { include: { species: true } } },
                    });
                    break;
                case 'payments':
                    data = await prisma_1.default.payment.findMany({
                        include: { ticket: { include: { visitor: true, ticketType: true } } },
                    });
                    break;
                default:
                    throw new errorHandler_1.AppError('Invalid report type', 400);
            }
            (0, response_1.sendSuccess)(res, data);
        }
        catch (error) {
            next(error);
        }
    },
};
//# sourceMappingURL=resourceControllers.js.map