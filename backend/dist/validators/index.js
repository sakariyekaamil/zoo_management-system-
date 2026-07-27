"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.foodPurchaseValidator = exports.assignmentValidator = exports.transferValidator = exports.maintenanceValidator = exports.expenseValidator = exports.vaccinationValidator = exports.veterinaryValidator = exports.feedingScheduleValidator = exports.foodInventoryValidator = exports.supplierValidator = exports.paymentValidator = exports.ticketValidator = exports.ticketTypeValidator = exports.visitorValidator = exports.employeeValidator = exports.enclosureValidator = exports.speciesValidator = exports.animalValidator = exports.userValidator = exports.changePasswordValidator = exports.resetPasswordValidator = exports.forgotPasswordValidator = exports.refreshValidator = exports.loginValidator = void 0;
const express_validator_1 = require("express-validator");
exports.loginValidator = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
exports.refreshValidator = [
    (0, express_validator_1.body)('refreshToken').notEmpty().withMessage('Refresh token is required'),
];
exports.forgotPasswordValidator = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email required'),
];
exports.resetPasswordValidator = [
    (0, express_validator_1.body)('token').notEmpty().withMessage('Token is required'),
    (0, express_validator_1.body)('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];
exports.changePasswordValidator = [
    (0, express_validator_1.body)('currentPassword').notEmpty().withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];
exports.userValidator = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('firstName').trim().notEmpty(),
    (0, express_validator_1.body)('lastName').trim().notEmpty(),
    (0, express_validator_1.body)('role').isIn(['ADMIN', 'MANAGER', 'VETERINARIAN', 'KEEPER', 'CASHIER', 'GUIDE']),
    (0, express_validator_1.body)('password').optional().isLength({ min: 8 }),
];
exports.animalValidator = [
    (0, express_validator_1.body)('name').trim().notEmpty(),
    (0, express_validator_1.body)('speciesId').isUUID(),
    (0, express_validator_1.body)('enclosureId').isUUID(),
    (0, express_validator_1.body)('quantity').optional().isInt({ min: 1 }),
    (0, express_validator_1.body)('gender').optional().isIn(['MALE', 'FEMALE', 'UNKNOWN']),
    (0, express_validator_1.body)('healthStatus').optional().isIn(['HEALTHY', 'SICK', 'RECOVERING', 'CRITICAL', 'DECEASED']),
];
exports.speciesValidator = [
    (0, express_validator_1.body)('name').trim().notEmpty(),
    (0, express_validator_1.body)('scientificName').optional({ checkFalsy: true }).trim(),
];
exports.enclosureValidator = [
    (0, express_validator_1.body)('name').trim().notEmpty(),
    (0, express_validator_1.body)('capacity').isInt({ min: 1 }),
];
exports.employeeValidator = [
    (0, express_validator_1.body)('firstName').trim().notEmpty(),
    (0, express_validator_1.body)('lastName').trim().notEmpty(),
    (0, express_validator_1.body)('email').isEmail(),
    (0, express_validator_1.body)('position').trim().notEmpty(),
    (0, express_validator_1.body)('salary').isFloat({ min: 0 }),
];
exports.visitorValidator = [
    (0, express_validator_1.body)('firstName').trim().notEmpty(),
    (0, express_validator_1.body)('lastName').trim().notEmpty(),
];
exports.ticketTypeValidator = [
    (0, express_validator_1.body)('name').trim().notEmpty(),
    (0, express_validator_1.body)('price').isFloat({ min: 0 }),
];
exports.ticketValidator = [
    (0, express_validator_1.body)('visitorId').isUUID(),
    (0, express_validator_1.body)('ticketTypeId').isUUID(),
    (0, express_validator_1.body)('quantity').isInt({ min: 1 }),
];
exports.paymentValidator = [
    (0, express_validator_1.body)('ticketId').isUUID(),
    (0, express_validator_1.body)('amount').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('discount').optional().isFloat({ min: 0, max: 100 }),
    (0, express_validator_1.body)('paymentMethod').isIn(['CASH', 'CARD', 'MOBILE_MONEY']),
];
exports.supplierValidator = [
    (0, express_validator_1.body)('name').trim().notEmpty(),
];
exports.foodInventoryValidator = [
    (0, express_validator_1.body)('name').trim().notEmpty(),
    (0, express_validator_1.body)('category').trim().notEmpty(),
    (0, express_validator_1.body)('quantity').isFloat({ min: 0 }),
    (0, express_validator_1.body)('unit').trim().notEmpty(),
];
exports.feedingScheduleValidator = [
    (0, express_validator_1.body)('animalId').isUUID(),
    (0, express_validator_1.body)('foodId').isUUID(),
    (0, express_validator_1.body)('scheduledTime').isISO8601(),
    (0, express_validator_1.body)('quantity').isFloat({ min: 0 }),
    (0, express_validator_1.body)('frequency').isIn(['DAILY', 'WEEKLY', 'MONTHLY']),
];
exports.veterinaryValidator = [
    (0, express_validator_1.body)('animalId').isUUID(),
    (0, express_validator_1.body)('diagnosis').trim().notEmpty(),
];
exports.vaccinationValidator = [
    (0, express_validator_1.body)('animalId').isUUID(),
    (0, express_validator_1.body)('vaccineName').trim().notEmpty(),
];
exports.expenseValidator = [
    (0, express_validator_1.body)('category').isIn(['SALARY', 'FOOD', 'MAINTENANCE', 'UTILITIES', 'MEDICAL', 'EQUIPMENT', 'MARKETING', 'OTHER']),
    (0, express_validator_1.body)('employeeId').optional({ nullable: true, checkFalsy: true }).isUUID(),
    (0, express_validator_1.body)('description').trim().notEmpty(),
    (0, express_validator_1.body)('bonus').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('amount').isFloat({ min: 0 }),
];
exports.maintenanceValidator = [
    (0, express_validator_1.body)('enclosureId').isUUID(),
    (0, express_validator_1.body)('description').trim().notEmpty(),
    (0, express_validator_1.body)('scheduledDate').isISO8601(),
];
exports.transferValidator = [
    (0, express_validator_1.body)('animalId').isUUID(),
    (0, express_validator_1.body)('toEnclosureId').isUUID(),
    (0, express_validator_1.body)('reason').trim().notEmpty(),
];
exports.assignmentValidator = [
    (0, express_validator_1.body)('animalId').isUUID(),
    (0, express_validator_1.body)('employeeId').isUUID(),
    (0, express_validator_1.body)('role').isIn(['KEEPER', 'VETERINARIAN']),
];
exports.foodPurchaseValidator = [
    (0, express_validator_1.body)('foodId').isUUID(),
    (0, express_validator_1.body)('supplierId').isUUID(),
    (0, express_validator_1.body)('quantity').isFloat({ min: 0 }),
    (0, express_validator_1.body)('unitPrice').isFloat({ min: 0 }),
];
//# sourceMappingURL=index.js.map