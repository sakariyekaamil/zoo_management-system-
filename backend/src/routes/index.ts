import { Router } from 'express';
import { authenticate, authorize, authorizeRoles, validate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as authCtrl from '../controllers/authController';
import * as dashCtrl from '../controllers/dashboardController';
import { userController } from '../controllers/crudController';
import {
  animalController, speciesController, enclosureController, employeeController,
  assignmentController, veterinaryController, vaccinationController,
  foodInventoryController, feedingScheduleController, visitorController,
  ticketTypeController, ticketController, paymentController, supplierController,
  foodPurchaseController, expenseController, maintenanceController,
  transferController, auditLogController, settingsController, reportController,
} from '../controllers/resourceControllers';
import {
  loginValidator, refreshValidator, forgotPasswordValidator, resetPasswordValidator,
  changePasswordValidator, userValidator, animalValidator, speciesValidator,
  enclosureValidator, employeeValidator, visitorValidator, ticketTypeValidator,
  ticketValidator, paymentValidator, supplierValidator, foodInventoryValidator,
  feedingScheduleValidator, veterinaryValidator, vaccinationValidator,
  expenseValidator, maintenanceValidator, transferValidator, assignmentValidator,
  foodPurchaseValidator,
} from '../validators';

const router = Router();

// Auth routes (public)
router.post('/auth/login', loginValidator, validate, authCtrl.login);
router.post('/auth/refresh', refreshValidator, validate, authCtrl.refresh);
router.post('/auth/forgot-password', forgotPasswordValidator, validate, authCtrl.forgotPassword);
router.post('/auth/reset-password', resetPasswordValidator, validate, authCtrl.resetPassword);

// Protected auth routes
router.post('/auth/logout', authenticate, authCtrl.logout);
router.get('/auth/profile', authenticate, authCtrl.getProfile);
router.post('/auth/change-password', authenticate, changePasswordValidator, validate, authCtrl.changePassword);

// Dashboard
router.get('/dashboard/stats', authenticate, authorize('dashboard'), dashCtrl.getDashboardStats);
router.get('/dashboard/charts', authenticate, authorize('dashboard'), dashCtrl.getDashboardCharts);

// Users (Admin only)
router.get('/users', authenticate, authorize('users'), userController.getAll);
router.get('/users/:id', authenticate, authorize('users'), userController.getById);
router.post('/users', authenticate, authorizeRoles('ADMIN'), userValidator, validate, userController.create);
router.put('/users/:id', authenticate, authorizeRoles('ADMIN'), userValidator, validate, userController.update);
router.delete('/users/:id', authenticate, authorizeRoles('ADMIN'), userController.remove);
router.patch('/users/:id/toggle-active', authenticate, authorizeRoles('ADMIN'), userController.toggleActive);
router.patch('/users/:id/reset-password', authenticate, authorizeRoles('ADMIN'), userController.resetUserPassword);

// Animals
router.get('/animals', authenticate, authorize('animals'), animalController.getAll);
router.get('/animals/:id', authenticate, authorize('animals'), animalController.getById);
router.get('/animals/:id/profile', authenticate, authorize('animals'), animalController.getProfile);
router.post('/animals', authenticate, authorize('animals'), animalValidator, validate, animalController.create);
router.put('/animals/:id', authenticate, authorize('animals'), animalValidator, validate, animalController.update);
router.delete('/animals/:id', authenticate, authorize('animals'), animalController.remove);
router.post('/animals/:id/photo', authenticate, authorize('animals'), upload.single('photo'), animalController.uploadPhoto);
router.post('/animals/:id/transfer', authenticate, authorize('animals'), transferValidator, validate, animalController.transfer);

// Species
router.get('/species', authenticate, authorize('species'), speciesController.getAll);
router.get('/species/:id', authenticate, authorize('species'), speciesController.getById);
router.post('/species', authenticate, authorize('species'), speciesValidator, validate, speciesController.create);
router.put('/species/:id', authenticate, authorize('species'), speciesValidator, validate, speciesController.update);
router.delete('/species/:id', authenticate, authorize('species'), speciesController.remove);

// Enclosures
router.get('/enclosures', authenticate, authorize('enclosures'), enclosureController.getAll);
router.get('/enclosures/available', authenticate, authorize('enclosures'), enclosureController.getAvailable);
router.get('/enclosures/:id', authenticate, authorize('enclosures'), enclosureController.getById);
router.post('/enclosures', authenticate, authorize('enclosures'), enclosureValidator, validate, enclosureController.create);
router.put('/enclosures/:id', authenticate, authorize('enclosures'), enclosureValidator, validate, enclosureController.update);
router.delete('/enclosures/:id', authenticate, authorize('enclosures'), enclosureController.remove);

// Employees
router.get('/employees', authenticate, authorize('employees'), employeeController.getAll);
router.get('/employees/:id', authenticate, authorize('employees'), employeeController.getById);
router.post('/employees', authenticate, authorize('employees'), employeeValidator, validate, employeeController.create);
router.put('/employees/:id', authenticate, authorize('employees'), employeeValidator, validate, employeeController.update);
router.delete('/employees/:id', authenticate, authorize('employees'), employeeController.remove);

// Assignments
router.get('/assignments', authenticate, authorize('assignments'), assignmentController.getAll);
router.get('/assignments/:id', authenticate, authorize('assignments'), assignmentController.getById);
router.post('/assignments', authenticate, authorize('assignments'), assignmentValidator, validate, assignmentController.create);
router.put('/assignments/:id', authenticate, authorize('assignments'), assignmentController.update);
router.delete('/assignments/:id', authenticate, authorize('assignments'), assignmentController.remove);

// Veterinary
router.get('/veterinary', authenticate, authorize('veterinary'), veterinaryController.getAll);
router.get('/veterinary/:id', authenticate, authorize('veterinary'), veterinaryController.getById);
router.post('/veterinary', authenticate, authorize('veterinary'), veterinaryValidator, validate, veterinaryController.create);
router.put('/veterinary/:id', authenticate, authorize('veterinary'), veterinaryValidator, validate, veterinaryController.update);
router.post('/veterinary/:id/certificate', authenticate, authorize('veterinary'), upload.single('certificate'), veterinaryController.uploadCertificate);
router.delete('/veterinary/:id', authenticate, authorize('veterinary'), veterinaryController.remove);

// Vaccinations
router.get('/vaccinations', authenticate, authorize('vaccinations'), vaccinationController.getAll);
router.get('/vaccinations/upcoming', authenticate, authorize('vaccinations'), vaccinationController.getUpcoming);
router.get('/vaccinations/expired', authenticate, authorize('vaccinations'), vaccinationController.getExpired);
router.get('/vaccinations/:id', authenticate, authorize('vaccinations'), vaccinationController.getById);
router.post('/vaccinations', authenticate, authorize('vaccinations'), vaccinationValidator, validate, vaccinationController.create);
router.put('/vaccinations/:id', authenticate, authorize('vaccinations'), vaccinationValidator, validate, vaccinationController.update);
router.delete('/vaccinations/:id', authenticate, authorize('vaccinations'), vaccinationController.remove);

// Food Inventory
router.get('/food-inventory', authenticate, authorize('food-inventory'), foodInventoryController.getAll);
router.get('/food-inventory/low-stock', authenticate, authorize('food-inventory'), foodInventoryController.getLowStock);
router.get('/food-inventory/:id', authenticate, authorize('food-inventory'), foodInventoryController.getById);
router.post('/food-inventory', authenticate, authorize('food-inventory'), foodInventoryValidator, validate, foodInventoryController.create);
router.put('/food-inventory/:id', authenticate, authorize('food-inventory'), foodInventoryValidator, validate, foodInventoryController.update);
router.delete('/food-inventory/:id', authenticate, authorize('food-inventory'), foodInventoryController.remove);
router.patch('/food-inventory/:id/stock-in', authenticate, authorize('food-inventory'), foodInventoryController.stockIn);
router.patch('/food-inventory/:id/stock-out', authenticate, authorize('food-inventory'), foodInventoryController.stockOut);

// Feeding Schedule
router.get('/feeding-schedule', authenticate, authorize('feeding-schedule'), feedingScheduleController.getAll);
router.get('/feeding-schedule/:id', authenticate, authorize('feeding-schedule'), feedingScheduleController.getById);
router.post('/feeding-schedule', authenticate, authorize('feeding-schedule'), feedingScheduleValidator, validate, feedingScheduleController.create);
router.put('/feeding-schedule/:id', authenticate, authorize('feeding-schedule'), feedingScheduleValidator, validate, feedingScheduleController.update);
router.delete('/feeding-schedule/:id', authenticate, authorize('feeding-schedule'), feedingScheduleController.remove);
router.patch('/feeding-schedule/:id/complete', authenticate, authorize('feeding-schedule'), feedingScheduleController.completeFeeding);

// Visitors
router.get('/visitors', authenticate, authorize('visitors'), visitorController.getAll);
router.get('/visitors/:id', authenticate, authorize('visitors'), visitorController.getById);
router.post('/visitors', authenticate, authorize('visitors'), visitorValidator, validate, visitorController.create);
router.put('/visitors/:id', authenticate, authorize('visitors'), visitorValidator, validate, visitorController.update);
router.delete('/visitors/:id', authenticate, authorize('visitors'), visitorController.remove);

// Ticket Types
router.get('/ticket-types', authenticate, authorize('ticket-types'), ticketTypeController.getAll);
router.get('/ticket-types/:id', authenticate, authorize('ticket-types'), ticketTypeController.getById);
router.post('/ticket-types', authenticate, authorize('ticket-types'), ticketTypeValidator, validate, ticketTypeController.create);
router.put('/ticket-types/:id', authenticate, authorize('ticket-types'), ticketTypeValidator, validate, ticketTypeController.update);
router.delete('/ticket-types/:id', authenticate, authorize('ticket-types'), ticketTypeController.remove);

// Tickets
router.get('/tickets', authenticate, authorize('tickets'), ticketController.getAll);
router.get('/tickets/:id', authenticate, authorize('tickets'), ticketController.getById);
router.post('/tickets', authenticate, authorize('tickets'), ticketValidator, validate, ticketController.create);
router.put('/tickets/:id', authenticate, authorize('tickets'), ticketController.update);
router.delete('/tickets/:id', authenticate, authorize('tickets'), ticketController.remove);

// Payments
router.get('/payments', authenticate, authorize('payments'), paymentController.getAll);
router.get('/payments/:id', authenticate, authorize('payments'), paymentController.getById);
router.post('/payments', authenticate, authorize('payments'), paymentValidator, validate, paymentController.create);
router.put('/payments/:id', authenticate, authorize('payments'), paymentController.update);
router.delete('/payments/:id', authenticate, authorize('payments'), paymentController.remove);

// Suppliers
router.get('/suppliers', authenticate, authorize('suppliers'), supplierController.getAll);
router.get('/suppliers/:id', authenticate, authorize('suppliers'), supplierController.getById);
router.post('/suppliers', authenticate, authorize('suppliers'), supplierValidator, validate, supplierController.create);
router.put('/suppliers/:id', authenticate, authorize('suppliers'), supplierValidator, validate, supplierController.update);
router.delete('/suppliers/:id', authenticate, authorize('suppliers'), supplierController.remove);

// Food Purchases
router.get('/food-purchases', authenticate, authorize('food-purchases'), foodPurchaseController.getAll);
router.get('/food-purchases/:id', authenticate, authorize('food-purchases'), foodPurchaseController.getById);
router.post('/food-purchases', authenticate, authorize('food-purchases'), foodPurchaseValidator, validate, foodPurchaseController.create);
router.put('/food-purchases/:id', authenticate, authorize('food-purchases'), foodPurchaseController.update);
router.delete('/food-purchases/:id', authenticate, authorize('food-purchases'), foodPurchaseController.remove);

// Expenses
router.get('/expenses', authenticate, authorize('expenses'), expenseController.getAll);
router.get('/expenses/:id', authenticate, authorize('expenses'), expenseController.getById);
router.post('/expenses', authenticate, authorize('expenses'), expenseValidator, validate, expenseController.create);
router.put('/expenses/:id', authenticate, authorize('expenses'), expenseValidator, validate, expenseController.update);
router.delete('/expenses/:id', authenticate, authorize('expenses'), expenseController.remove);

// Maintenance
router.get('/maintenance', authenticate, authorize('maintenance'), maintenanceController.getAll);
router.get('/maintenance/:id', authenticate, authorize('maintenance'), maintenanceController.getById);
router.post('/maintenance', authenticate, authorize('maintenance'), maintenanceValidator, validate, maintenanceController.create);
router.put('/maintenance/:id', authenticate, authorize('maintenance'), maintenanceValidator, validate, maintenanceController.update);
router.delete('/maintenance/:id', authenticate, authorize('maintenance'), maintenanceController.remove);

// Transfers
router.get('/transfers', authenticate, authorize('transfers'), transferController.getAll);
router.get('/transfers/:id', authenticate, authorize('transfers'), transferController.getById);

// Audit Logs
router.get('/audit-logs', authenticate, authorize('audit-logs'), auditLogController.getAll);

// Reports
router.get('/reports', authenticate, authorize('reports'), reportController.getSummary);

// Settings
router.get('/settings', authenticate, authorize('settings'), settingsController.get);
router.put('/settings', authenticate, authorize('settings'), settingsController.update);
router.post('/settings/logo', authenticate, authorize('settings'), upload.single('logo'), settingsController.uploadLogo);

export default router;
