import api from './api';
import { ApiResponse, AuthResponse, User, PaginationParams, PaginatedResponse } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get<ApiResponse<User>>('/auth/profile'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
};

export const createResourceApi = <T,>(basePath: string) => ({
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<T>>(basePath, { params }),
  getById: (id: string) => api.get<ApiResponse<T>>(`${basePath}/${id}`),
  create: (data: Partial<T>) => api.post<ApiResponse<T>>(basePath, data),
  update: (id: string, data: Partial<T>) => api.put<ApiResponse<T>>(`${basePath}/${id}`, data),
  delete: (id: string) => api.delete(`${basePath}/${id}`),
});

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getCharts: () => api.get('/dashboard/charts'),
};

export const animalsApi = {
  ...createResourceApi('/animals'),
  getProfile: (id: string) => api.get(`/animals/${id}/profile`),
  uploadPhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post(`/animals/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  transfer: (id: string, data: { toEnclosureId: string; reason: string; notes?: string }) =>
    api.post(`/animals/${id}/transfer`, data),
};

export const speciesApi = createResourceApi('/species');
export const enclosuresApi = {
  ...createResourceApi('/enclosures'),
  getAvailable: () => api.get('/enclosures/available'),
};
export const employeesApi = createResourceApi('/employees');
export const assignmentsApi = createResourceApi('/assignments');
const withoutCertificateFile = (data: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'certificateFile'));

export const veterinaryApi = {
  ...createResourceApi('/veterinary'),
  create: (data: Record<string, unknown>) =>
    api.post('/veterinary', withoutCertificateFile(data)),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/veterinary/${id}`, withoutCertificateFile(data)),
  uploadCertificate: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('certificate', file);
    return api.post(`/veterinary/${id}/certificate`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
export const vaccinationsApi = {
  ...createResourceApi('/vaccinations'),
  getUpcoming: () => api.get('/vaccinations/upcoming'),
  getExpired: () => api.get('/vaccinations/expired'),
};
export const foodInventoryApi = {
  ...createResourceApi('/food-inventory'),
  getLowStock: () => api.get('/food-inventory/low-stock'),
  stockIn: (id: string, quantity: number) => api.patch(`/food-inventory/${id}/stock-in`, { quantity }),
  stockOut: (id: string, quantity: number) => api.patch(`/food-inventory/${id}/stock-out`, { quantity }),
};
export const feedingScheduleApi = {
  ...createResourceApi('/feeding-schedule'),
  complete: (id: string) => api.patch(`/feeding-schedule/${id}/complete`),
};
export const visitorsApi = createResourceApi('/visitors');
export const ticketTypesApi = createResourceApi('/ticket-types');
export const ticketsApi = createResourceApi('/tickets');
export const paymentsApi = createResourceApi('/payments');
export const suppliersApi = createResourceApi('/suppliers');
export const foodPurchasesApi = createResourceApi('/food-purchases');
export const expensesApi = createResourceApi('/expenses');
export const usersApi = {
  ...createResourceApi('/users'),
  toggleActive: (id: string) => api.patch(`/users/${id}/toggle-active`),
  resetPassword: (id: string, newPassword: string) =>
    api.patch(`/users/${id}/reset-password`, { newPassword }),
};
export const reportsApi = {
  getSummary: (type: string) => api.get('/reports', { params: { type } }),
};
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: Record<string, unknown>) => api.put('/settings', data),
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
