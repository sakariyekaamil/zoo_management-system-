"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROUTE_PERMISSIONS = exports.hasPermission = exports.ROLE_PERMISSIONS = void 0;
exports.ROLE_PERMISSIONS = {
    ADMIN: ['*'],
    MANAGER: [
        'dashboard', 'animals', 'species', 'enclosures', 'employees', 'assignments',
        'veterinary', 'vaccinations', 'food-inventory', 'feeding-schedule',
        'visitors', 'ticket-types', 'tickets', 'payments', 'suppliers',
        'food-purchases', 'expenses', 'maintenance', 'transfers', 'audit-logs',
        'reports', 'settings',
    ],
    VETERINARIAN: ['dashboard', 'animals', 'veterinary', 'vaccinations', 'reports'],
    KEEPER: ['dashboard', 'animals', 'food-inventory', 'feeding-schedule', 'reports'],
    CASHIER: ['dashboard', 'visitors', 'ticket-types', 'tickets', 'payments', 'reports'],
    GUIDE: ['dashboard', 'visitors', 'animals', 'reports'],
};
const hasPermission = (role, resource) => {
    const permissions = exports.ROLE_PERMISSIONS[role];
    if (permissions.includes('*'))
        return true;
    return permissions.includes(resource);
};
exports.hasPermission = hasPermission;
exports.ROUTE_PERMISSIONS = {
    '/api/users': 'users',
    '/api/animals': 'animals',
    '/api/species': 'species',
    '/api/enclosures': 'enclosures',
    '/api/employees': 'employees',
    '/api/assignments': 'assignments',
    '/api/veterinary': 'veterinary',
    '/api/vaccinations': 'vaccinations',
    '/api/food-inventory': 'food-inventory',
    '/api/feeding-schedule': 'feeding-schedule',
    '/api/visitors': 'visitors',
    '/api/ticket-types': 'ticket-types',
    '/api/tickets': 'tickets',
    '/api/payments': 'payments',
    '/api/suppliers': 'suppliers',
    '/api/food-purchases': 'food-purchases',
    '/api/expenses': 'expenses',
    '/api/maintenance': 'maintenance',
    '/api/transfers': 'transfers',
    '/api/audit-logs': 'audit-logs',
    '/api/reports': 'reports',
    '/api/settings': 'settings',
    '/api/dashboard': 'dashboard',
};
//# sourceMappingURL=permissions.js.map