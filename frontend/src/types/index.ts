export type UserRole = 'ADMIN' | 'MANAGER' | 'VETERINARIAN' | 'KEEPER' | 'CASHIER' | 'GUIDE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: string | number | undefined;
}

export interface DashboardStats {
  totalAnimals: number;
  healthyAnimals: number;
  sickAnimals: number;
  employees: number;
  visitorsToday: number;
  ticketsSoldToday: number;
  todayRevenue: number;
  monthlyRevenue: number;
  foodInventory: number;
  lowStockFoods: number;
  totalExpenses: number;
}

export interface DashboardCharts {
  monthlyVisitors: { month: string; visitors: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
  animalCategories: { name: string; count: number }[];
  animalHealth: { status: string; count: number }[];
  foodConsumption: { name: string; quantity: number }[];
  ticketSales: { name: string; count: number }[];
}

export interface Animal {
  id: string;
  name: string;
  speciesId: string;
  enclosureId: string;
  gender: string;
  dateOfBirth?: string;
  healthStatus: string;
  quantity: number;
  origin?: 'BIRTH' | 'OTHER' | string;
  originPlace?: string;
  originDescription?: string;
  weight?: number;
  photo?: string;
  photoFile?: File;
  arrivalDate: string;
  notes?: string;
  species?: Species;
  enclosure?: Enclosure;
}

export interface Species {
  id: string;
  name: string;
  scientificName?: string;
  habitat?: string;
  conservationStatus?: string;
  description?: string;
}

export interface Enclosure {
  id: string;
  name: string;
  location?: string;
  capacity: number;
  temperature?: number;
  maintenanceStatus: string;
  description?: string;
  _count?: { animals: number };
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  salary: number;
  hireDate: string;
  isActive: boolean;
}

export interface ZooSettings {
  id: string;
  zooName: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  openingTime?: string;
  closingTime?: string;
  description?: string;
}
