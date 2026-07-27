import { body } from 'express-validator';

export const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const refreshValidator = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

export const forgotPasswordValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
];

export const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

export const userValidator = [
  body('email').isEmail().normalizeEmail(),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('role').isIn(['ADMIN', 'MANAGER', 'VETERINARIAN', 'KEEPER', 'CASHIER', 'GUIDE']),
  body('password').optional().isLength({ min: 8 }),
];

export const animalValidator = [
  body('name').trim().notEmpty(),
  body('speciesId').isUUID(),
  body('enclosureId').isUUID(),
  body('quantity').optional().isInt({ min: 1 }),
  body('gender').optional().isIn(['MALE', 'FEMALE', 'UNKNOWN']),
  body('healthStatus').optional().isIn(['HEALTHY', 'SICK', 'RECOVERING', 'CRITICAL', 'DECEASED']),
  body('origin').optional().isIn(['BIRTH', 'OTHER']),
  body('originPlace').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 255 }),
  body('originDescription').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 2000 }),
];

export const speciesValidator = [
  body('name').trim().notEmpty(),
  body('scientificName').optional({ checkFalsy: true }).trim(),
];

export const enclosureValidator = [
  body('name').trim().notEmpty(),
  body('capacity').isInt({ min: 1 }),
];

export const employeeValidator = [
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('email').isEmail(),
  body('position').trim().notEmpty(),
  body('salary').isFloat({ min: 0 }),
];

export const visitorValidator = [
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
];

export const ticketTypeValidator = [
  body('name').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('cardStyle').optional().isIn(['STANDARD', 'VIP', 'PREMIUM', 'FAMILY', 'CHILD', 'STUDENT', 'GROUP']),
];

export const ticketValidator = [
  body('visitorId').isUUID(),
  body('ticketTypeId').isUUID(),
  body('quantity').isInt({ min: 1 }),
];

export const paymentValidator = [
  body('ticketId').isUUID(),
  body('amount').optional().isFloat({ min: 0 }),
  body('discount').optional().isFloat({ min: 0, max: 100 }),
  body('paymentMethod').isIn(['CASH', 'CARD', 'MOBILE_MONEY']),
];

export const supplierValidator = [
  body('name').trim().notEmpty(),
];

export const foodInventoryValidator = [
  body('name').trim().notEmpty(),
  body('category').trim().notEmpty(),
  body('quantity').isFloat({ min: 0 }),
  body('unit').trim().notEmpty(),
];

export const feedingScheduleValidator = [
  body('animalId').isUUID(),
  body('foodId').isUUID(),
  body('scheduledTime').isISO8601(),
  body('quantity').isFloat({ min: 0 }),
  body('frequency').isIn(['DAILY', 'WEEKLY', 'MONTHLY']),
];

export const veterinaryValidator = [
  body('animalId').isUUID(),
  body('diagnosis').trim().notEmpty(),
];

export const vaccinationValidator = [
  body('animalId').isUUID(),
  body('vaccineName').trim().notEmpty(),
];

export const expenseValidator = [
  body('category').isIn(['SALARY', 'FOOD', 'MAINTENANCE', 'UTILITIES', 'MEDICAL', 'EQUIPMENT', 'MARKETING', 'OTHER']),
  body('employeeId').optional({ nullable: true, checkFalsy: true }).isUUID(),
  body('description').trim().notEmpty(),
  body('bonus').optional().isFloat({ min: 0 }),
  body('amount').isFloat({ min: 0 }),
];

export const maintenanceValidator = [
  body('enclosureId').isUUID(),
  body('description').trim().notEmpty(),
  body('scheduledDate').isISO8601(),
];

export const transferValidator = [
  body('animalId').isUUID(),
  body('toEnclosureId').isUUID(),
  body('reason').trim().notEmpty(),
];

export const assignmentValidator = [
  body('animalId').isUUID(),
  body('employeeId').isUUID(),
  body('role').isIn(['KEEPER', 'VETERINARIAN']),
];

export const foodPurchaseValidator = [
  body('foodId').isUUID(),
  body('supplierId').isUUID(),
  body('quantity').isFloat({ min: 0 }),
  body('unitPrice').isFloat({ min: 0 }),
];
