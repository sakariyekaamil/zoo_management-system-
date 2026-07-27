import { UserRole } from '../types';

export const APP_NAME = 'WARRAN-CADDE ZOO';
export const APP_SUBTITLE = 'Management System';

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  VETERINARIAN: 'Veterinarian',
  KEEPER: 'Keeper',
  CASHIER: 'Cashier',
  GUIDE: 'Guide',
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: ['*'],
  MANAGER: [
    'dashboard', 'animals', 'species', 'enclosures', 'employees', 'assignments',
    'veterinary', 'vaccinations', 'food-inventory', 'feeding-schedule',
    'visitors', 'ticket-types', 'tickets', 'payments', 'suppliers',
    'food-purchases', 'expenses', 'reports', 'settings',
  ],
  VETERINARIAN: ['dashboard', 'animals', 'veterinary', 'vaccinations', 'reports'],
  KEEPER: ['dashboard', 'animals', 'food-inventory', 'feeding-schedule', 'reports'],
  CASHIER: ['dashboard', 'visitors', 'ticket-types', 'tickets', 'payments', 'reports'],
  GUIDE: ['dashboard', 'visitors', 'animals', 'reports'],
};

export const hasPermission = (role: UserRole, resource: string): boolean => {
  const perms = ROLE_PERMISSIONS[role];
  return perms.includes('*') || perms.includes(resource);
};

export const HEALTH_STATUS_COLORS: Record<string, string> = {
  HEALTHY: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  SICK: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  RECOVERING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  CRITICAL: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  DECEASED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export const EXPENSE_CATEGORIES = [
  'SALARY', 'FOOD', 'MAINTENANCE', 'UTILITIES', 'MEDICAL', 'EQUIPMENT', 'MARKETING', 'OTHER',
];

export const PAYMENT_METHODS = ['CASH', 'CARD', 'MOBILE_MONEY'];

export const REPORT_TYPES = [
  { value: 'animals', label: 'Animals Report' },
  { value: 'visitors', label: 'Visitors Report' },
  { value: 'revenue', label: 'Revenue Report' },
  { value: 'expenses', label: 'Expenses Report' },
  { value: 'inventory', label: 'Inventory Report' },
  { value: 'veterinary', label: 'Veterinary Report' },
  { value: 'vaccinations', label: 'Vaccinations Report' },
  { value: 'payments', label: 'Payments Report' },
];
