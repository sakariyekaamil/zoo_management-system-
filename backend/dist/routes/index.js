"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const authCtrl = __importStar(require("../controllers/authController"));
const dashCtrl = __importStar(require("../controllers/dashboardController"));
const crudController_1 = require("../controllers/crudController");
const resourceControllers_1 = require("../controllers/resourceControllers");
const validators_1 = require("../validators");
const router = (0, express_1.Router)();
// Auth routes (public)
router.post('/auth/login', validators_1.loginValidator, auth_1.validate, authCtrl.login);
router.post('/auth/refresh', validators_1.refreshValidator, auth_1.validate, authCtrl.refresh);
router.post('/auth/forgot-password', validators_1.forgotPasswordValidator, auth_1.validate, authCtrl.forgotPassword);
router.post('/auth/reset-password', validators_1.resetPasswordValidator, auth_1.validate, authCtrl.resetPassword);
// Protected auth routes
router.post('/auth/logout', auth_1.authenticate, authCtrl.logout);
router.get('/auth/profile', auth_1.authenticate, authCtrl.getProfile);
router.post('/auth/change-password', auth_1.authenticate, validators_1.changePasswordValidator, auth_1.validate, authCtrl.changePassword);
// Dashboard
router.get('/dashboard/stats', auth_1.authenticate, (0, auth_1.authorize)('dashboard'), dashCtrl.getDashboardStats);
router.get('/dashboard/charts', auth_1.authenticate, (0, auth_1.authorize)('dashboard'), dashCtrl.getDashboardCharts);
// Users (Admin only)
router.get('/users', auth_1.authenticate, (0, auth_1.authorize)('users'), crudController_1.userController.getAll);
router.get('/users/:id', auth_1.authenticate, (0, auth_1.authorize)('users'), crudController_1.userController.getById);
router.post('/users', auth_1.authenticate, (0, auth_1.authorizeRoles)('ADMIN'), validators_1.userValidator, auth_1.validate, crudController_1.userController.create);
router.put('/users/:id', auth_1.authenticate, (0, auth_1.authorizeRoles)('ADMIN'), validators_1.userValidator, auth_1.validate, crudController_1.userController.update);
router.delete('/users/:id', auth_1.authenticate, (0, auth_1.authorizeRoles)('ADMIN'), crudController_1.userController.remove);
router.patch('/users/:id/toggle-active', auth_1.authenticate, (0, auth_1.authorizeRoles)('ADMIN'), crudController_1.userController.toggleActive);
router.patch('/users/:id/reset-password', auth_1.authenticate, (0, auth_1.authorizeRoles)('ADMIN'), crudController_1.userController.resetUserPassword);
// Animals
router.get('/animals', auth_1.authenticate, (0, auth_1.authorize)('animals'), resourceControllers_1.animalController.getAll);
router.get('/animals/:id', auth_1.authenticate, (0, auth_1.authorize)('animals'), resourceControllers_1.animalController.getById);
router.get('/animals/:id/profile', auth_1.authenticate, (0, auth_1.authorize)('animals'), resourceControllers_1.animalController.getProfile);
router.post('/animals', auth_1.authenticate, (0, auth_1.authorize)('animals'), validators_1.animalValidator, auth_1.validate, resourceControllers_1.animalController.create);
router.put('/animals/:id', auth_1.authenticate, (0, auth_1.authorize)('animals'), validators_1.animalValidator, auth_1.validate, resourceControllers_1.animalController.update);
router.delete('/animals/:id', auth_1.authenticate, (0, auth_1.authorize)('animals'), resourceControllers_1.animalController.remove);
router.post('/animals/:id/photo', auth_1.authenticate, (0, auth_1.authorize)('animals'), upload_1.upload.single('photo'), resourceControllers_1.animalController.uploadPhoto);
router.post('/animals/:id/transfer', auth_1.authenticate, (0, auth_1.authorize)('animals'), validators_1.transferValidator, auth_1.validate, resourceControllers_1.animalController.transfer);
// Species
router.get('/species', auth_1.authenticate, (0, auth_1.authorize)('species'), resourceControllers_1.speciesController.getAll);
router.get('/species/:id', auth_1.authenticate, (0, auth_1.authorize)('species'), resourceControllers_1.speciesController.getById);
router.post('/species', auth_1.authenticate, (0, auth_1.authorize)('species'), validators_1.speciesValidator, auth_1.validate, resourceControllers_1.speciesController.create);
router.put('/species/:id', auth_1.authenticate, (0, auth_1.authorize)('species'), validators_1.speciesValidator, auth_1.validate, resourceControllers_1.speciesController.update);
router.delete('/species/:id', auth_1.authenticate, (0, auth_1.authorize)('species'), resourceControllers_1.speciesController.remove);
// Enclosures
router.get('/enclosures', auth_1.authenticate, (0, auth_1.authorize)('enclosures'), resourceControllers_1.enclosureController.getAll);
router.get('/enclosures/available', auth_1.authenticate, (0, auth_1.authorize)('enclosures'), resourceControllers_1.enclosureController.getAvailable);
router.get('/enclosures/:id', auth_1.authenticate, (0, auth_1.authorize)('enclosures'), resourceControllers_1.enclosureController.getById);
router.post('/enclosures', auth_1.authenticate, (0, auth_1.authorize)('enclosures'), validators_1.enclosureValidator, auth_1.validate, resourceControllers_1.enclosureController.create);
router.put('/enclosures/:id', auth_1.authenticate, (0, auth_1.authorize)('enclosures'), validators_1.enclosureValidator, auth_1.validate, resourceControllers_1.enclosureController.update);
router.delete('/enclosures/:id', auth_1.authenticate, (0, auth_1.authorize)('enclosures'), resourceControllers_1.enclosureController.remove);
// Employees
router.get('/employees', auth_1.authenticate, (0, auth_1.authorize)('employees'), resourceControllers_1.employeeController.getAll);
router.get('/employees/:id', auth_1.authenticate, (0, auth_1.authorize)('employees'), resourceControllers_1.employeeController.getById);
router.post('/employees', auth_1.authenticate, (0, auth_1.authorize)('employees'), validators_1.employeeValidator, auth_1.validate, resourceControllers_1.employeeController.create);
router.put('/employees/:id', auth_1.authenticate, (0, auth_1.authorize)('employees'), validators_1.employeeValidator, auth_1.validate, resourceControllers_1.employeeController.update);
router.delete('/employees/:id', auth_1.authenticate, (0, auth_1.authorize)('employees'), resourceControllers_1.employeeController.remove);
// Assignments
router.get('/assignments', auth_1.authenticate, (0, auth_1.authorize)('assignments'), resourceControllers_1.assignmentController.getAll);
router.get('/assignments/:id', auth_1.authenticate, (0, auth_1.authorize)('assignments'), resourceControllers_1.assignmentController.getById);
router.post('/assignments', auth_1.authenticate, (0, auth_1.authorize)('assignments'), validators_1.assignmentValidator, auth_1.validate, resourceControllers_1.assignmentController.create);
router.put('/assignments/:id', auth_1.authenticate, (0, auth_1.authorize)('assignments'), resourceControllers_1.assignmentController.update);
router.delete('/assignments/:id', auth_1.authenticate, (0, auth_1.authorize)('assignments'), resourceControllers_1.assignmentController.remove);
// Veterinary
router.get('/veterinary', auth_1.authenticate, (0, auth_1.authorize)('veterinary'), resourceControllers_1.veterinaryController.getAll);
router.get('/veterinary/:id', auth_1.authenticate, (0, auth_1.authorize)('veterinary'), resourceControllers_1.veterinaryController.getById);
router.post('/veterinary', auth_1.authenticate, (0, auth_1.authorize)('veterinary'), validators_1.veterinaryValidator, auth_1.validate, resourceControllers_1.veterinaryController.create);
router.put('/veterinary/:id', auth_1.authenticate, (0, auth_1.authorize)('veterinary'), validators_1.veterinaryValidator, auth_1.validate, resourceControllers_1.veterinaryController.update);
router.post('/veterinary/:id/certificate', auth_1.authenticate, (0, auth_1.authorize)('veterinary'), upload_1.upload.single('certificate'), resourceControllers_1.veterinaryController.uploadCertificate);
router.delete('/veterinary/:id', auth_1.authenticate, (0, auth_1.authorize)('veterinary'), resourceControllers_1.veterinaryController.remove);
// Vaccinations
router.get('/vaccinations', auth_1.authenticate, (0, auth_1.authorize)('vaccinations'), resourceControllers_1.vaccinationController.getAll);
router.get('/vaccinations/upcoming', auth_1.authenticate, (0, auth_1.authorize)('vaccinations'), resourceControllers_1.vaccinationController.getUpcoming);
router.get('/vaccinations/expired', auth_1.authenticate, (0, auth_1.authorize)('vaccinations'), resourceControllers_1.vaccinationController.getExpired);
router.get('/vaccinations/:id', auth_1.authenticate, (0, auth_1.authorize)('vaccinations'), resourceControllers_1.vaccinationController.getById);
router.post('/vaccinations', auth_1.authenticate, (0, auth_1.authorize)('vaccinations'), validators_1.vaccinationValidator, auth_1.validate, resourceControllers_1.vaccinationController.create);
router.put('/vaccinations/:id', auth_1.authenticate, (0, auth_1.authorize)('vaccinations'), validators_1.vaccinationValidator, auth_1.validate, resourceControllers_1.vaccinationController.update);
router.delete('/vaccinations/:id', auth_1.authenticate, (0, auth_1.authorize)('vaccinations'), resourceControllers_1.vaccinationController.remove);
// Food Inventory
router.get('/food-inventory', auth_1.authenticate, (0, auth_1.authorize)('food-inventory'), resourceControllers_1.foodInventoryController.getAll);
router.get('/food-inventory/low-stock', auth_1.authenticate, (0, auth_1.authorize)('food-inventory'), resourceControllers_1.foodInventoryController.getLowStock);
router.get('/food-inventory/:id', auth_1.authenticate, (0, auth_1.authorize)('food-inventory'), resourceControllers_1.foodInventoryController.getById);
router.post('/food-inventory', auth_1.authenticate, (0, auth_1.authorize)('food-inventory'), validators_1.foodInventoryValidator, auth_1.validate, resourceControllers_1.foodInventoryController.create);
router.put('/food-inventory/:id', auth_1.authenticate, (0, auth_1.authorize)('food-inventory'), validators_1.foodInventoryValidator, auth_1.validate, resourceControllers_1.foodInventoryController.update);
router.delete('/food-inventory/:id', auth_1.authenticate, (0, auth_1.authorize)('food-inventory'), resourceControllers_1.foodInventoryController.remove);
router.patch('/food-inventory/:id/stock-in', auth_1.authenticate, (0, auth_1.authorize)('food-inventory'), resourceControllers_1.foodInventoryController.stockIn);
router.patch('/food-inventory/:id/stock-out', auth_1.authenticate, (0, auth_1.authorize)('food-inventory'), resourceControllers_1.foodInventoryController.stockOut);
// Feeding Schedule
router.get('/feeding-schedule', auth_1.authenticate, (0, auth_1.authorize)('feeding-schedule'), resourceControllers_1.feedingScheduleController.getAll);
router.get('/feeding-schedule/:id', auth_1.authenticate, (0, auth_1.authorize)('feeding-schedule'), resourceControllers_1.feedingScheduleController.getById);
router.post('/feeding-schedule', auth_1.authenticate, (0, auth_1.authorize)('feeding-schedule'), validators_1.feedingScheduleValidator, auth_1.validate, resourceControllers_1.feedingScheduleController.create);
router.put('/feeding-schedule/:id', auth_1.authenticate, (0, auth_1.authorize)('feeding-schedule'), validators_1.feedingScheduleValidator, auth_1.validate, resourceControllers_1.feedingScheduleController.update);
router.delete('/feeding-schedule/:id', auth_1.authenticate, (0, auth_1.authorize)('feeding-schedule'), resourceControllers_1.feedingScheduleController.remove);
router.patch('/feeding-schedule/:id/complete', auth_1.authenticate, (0, auth_1.authorize)('feeding-schedule'), resourceControllers_1.feedingScheduleController.completeFeeding);
// Visitors
router.get('/visitors', auth_1.authenticate, (0, auth_1.authorize)('visitors'), resourceControllers_1.visitorController.getAll);
router.get('/visitors/:id', auth_1.authenticate, (0, auth_1.authorize)('visitors'), resourceControllers_1.visitorController.getById);
router.post('/visitors', auth_1.authenticate, (0, auth_1.authorize)('visitors'), validators_1.visitorValidator, auth_1.validate, resourceControllers_1.visitorController.create);
router.put('/visitors/:id', auth_1.authenticate, (0, auth_1.authorize)('visitors'), validators_1.visitorValidator, auth_1.validate, resourceControllers_1.visitorController.update);
router.delete('/visitors/:id', auth_1.authenticate, (0, auth_1.authorize)('visitors'), resourceControllers_1.visitorController.remove);
// Ticket Types
router.get('/ticket-types', auth_1.authenticate, (0, auth_1.authorize)('ticket-types'), resourceControllers_1.ticketTypeController.getAll);
router.get('/ticket-types/:id', auth_1.authenticate, (0, auth_1.authorize)('ticket-types'), resourceControllers_1.ticketTypeController.getById);
router.post('/ticket-types', auth_1.authenticate, (0, auth_1.authorize)('ticket-types'), validators_1.ticketTypeValidator, auth_1.validate, resourceControllers_1.ticketTypeController.create);
router.put('/ticket-types/:id', auth_1.authenticate, (0, auth_1.authorize)('ticket-types'), validators_1.ticketTypeValidator, auth_1.validate, resourceControllers_1.ticketTypeController.update);
router.delete('/ticket-types/:id', auth_1.authenticate, (0, auth_1.authorize)('ticket-types'), resourceControllers_1.ticketTypeController.remove);
// Tickets
router.get('/tickets', auth_1.authenticate, (0, auth_1.authorize)('tickets'), resourceControllers_1.ticketController.getAll);
router.get('/tickets/:id', auth_1.authenticate, (0, auth_1.authorize)('tickets'), resourceControllers_1.ticketController.getById);
router.post('/tickets', auth_1.authenticate, (0, auth_1.authorize)('tickets'), validators_1.ticketValidator, auth_1.validate, resourceControllers_1.ticketController.create);
router.put('/tickets/:id', auth_1.authenticate, (0, auth_1.authorize)('tickets'), resourceControllers_1.ticketController.update);
router.delete('/tickets/:id', auth_1.authenticate, (0, auth_1.authorize)('tickets'), resourceControllers_1.ticketController.remove);
// Payments
router.get('/payments', auth_1.authenticate, (0, auth_1.authorize)('payments'), resourceControllers_1.paymentController.getAll);
router.get('/payments/:id', auth_1.authenticate, (0, auth_1.authorize)('payments'), resourceControllers_1.paymentController.getById);
router.post('/payments', auth_1.authenticate, (0, auth_1.authorize)('payments'), validators_1.paymentValidator, auth_1.validate, resourceControllers_1.paymentController.create);
router.put('/payments/:id', auth_1.authenticate, (0, auth_1.authorize)('payments'), resourceControllers_1.paymentController.update);
router.delete('/payments/:id', auth_1.authenticate, (0, auth_1.authorize)('payments'), resourceControllers_1.paymentController.remove);
// Suppliers
router.get('/suppliers', auth_1.authenticate, (0, auth_1.authorize)('suppliers'), resourceControllers_1.supplierController.getAll);
router.get('/suppliers/:id', auth_1.authenticate, (0, auth_1.authorize)('suppliers'), resourceControllers_1.supplierController.getById);
router.post('/suppliers', auth_1.authenticate, (0, auth_1.authorize)('suppliers'), validators_1.supplierValidator, auth_1.validate, resourceControllers_1.supplierController.create);
router.put('/suppliers/:id', auth_1.authenticate, (0, auth_1.authorize)('suppliers'), validators_1.supplierValidator, auth_1.validate, resourceControllers_1.supplierController.update);
router.delete('/suppliers/:id', auth_1.authenticate, (0, auth_1.authorize)('suppliers'), resourceControllers_1.supplierController.remove);
// Food Purchases
router.get('/food-purchases', auth_1.authenticate, (0, auth_1.authorize)('food-purchases'), resourceControllers_1.foodPurchaseController.getAll);
router.get('/food-purchases/:id', auth_1.authenticate, (0, auth_1.authorize)('food-purchases'), resourceControllers_1.foodPurchaseController.getById);
router.post('/food-purchases', auth_1.authenticate, (0, auth_1.authorize)('food-purchases'), validators_1.foodPurchaseValidator, auth_1.validate, resourceControllers_1.foodPurchaseController.create);
router.put('/food-purchases/:id', auth_1.authenticate, (0, auth_1.authorize)('food-purchases'), resourceControllers_1.foodPurchaseController.update);
router.delete('/food-purchases/:id', auth_1.authenticate, (0, auth_1.authorize)('food-purchases'), resourceControllers_1.foodPurchaseController.remove);
// Expenses
router.get('/expenses', auth_1.authenticate, (0, auth_1.authorize)('expenses'), resourceControllers_1.expenseController.getAll);
router.get('/expenses/:id', auth_1.authenticate, (0, auth_1.authorize)('expenses'), resourceControllers_1.expenseController.getById);
router.post('/expenses', auth_1.authenticate, (0, auth_1.authorize)('expenses'), validators_1.expenseValidator, auth_1.validate, resourceControllers_1.expenseController.create);
router.put('/expenses/:id', auth_1.authenticate, (0, auth_1.authorize)('expenses'), validators_1.expenseValidator, auth_1.validate, resourceControllers_1.expenseController.update);
router.delete('/expenses/:id', auth_1.authenticate, (0, auth_1.authorize)('expenses'), resourceControllers_1.expenseController.remove);
// Maintenance
router.get('/maintenance', auth_1.authenticate, (0, auth_1.authorize)('maintenance'), resourceControllers_1.maintenanceController.getAll);
router.get('/maintenance/:id', auth_1.authenticate, (0, auth_1.authorize)('maintenance'), resourceControllers_1.maintenanceController.getById);
router.post('/maintenance', auth_1.authenticate, (0, auth_1.authorize)('maintenance'), validators_1.maintenanceValidator, auth_1.validate, resourceControllers_1.maintenanceController.create);
router.put('/maintenance/:id', auth_1.authenticate, (0, auth_1.authorize)('maintenance'), validators_1.maintenanceValidator, auth_1.validate, resourceControllers_1.maintenanceController.update);
router.delete('/maintenance/:id', auth_1.authenticate, (0, auth_1.authorize)('maintenance'), resourceControllers_1.maintenanceController.remove);
// Transfers
router.get('/transfers', auth_1.authenticate, (0, auth_1.authorize)('transfers'), resourceControllers_1.transferController.getAll);
router.get('/transfers/:id', auth_1.authenticate, (0, auth_1.authorize)('transfers'), resourceControllers_1.transferController.getById);
// Audit Logs
router.get('/audit-logs', auth_1.authenticate, (0, auth_1.authorize)('audit-logs'), resourceControllers_1.auditLogController.getAll);
// Reports
router.get('/reports', auth_1.authenticate, (0, auth_1.authorize)('reports'), resourceControllers_1.reportController.getSummary);
// Settings
router.get('/settings', auth_1.authenticate, (0, auth_1.authorize)('settings'), resourceControllers_1.settingsController.get);
router.put('/settings', auth_1.authenticate, (0, auth_1.authorize)('settings'), resourceControllers_1.settingsController.update);
router.post('/settings/logo', auth_1.authenticate, (0, auth_1.authorize)('settings'), upload_1.upload.single('logo'), resourceControllers_1.settingsController.uploadLogo);
exports.default = router;
//# sourceMappingURL=index.js.map