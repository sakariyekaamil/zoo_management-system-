import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import { ProtectedRoute } from '../components/layouts/ProtectedRoute';
import { LoginPage } from '../pages/auth/LoginPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { DashboardPage } from '../pages/DashboardPage';
import { AnimalsPage } from '../pages/modules/AnimalsPage';
import { SpeciesPage } from '../pages/modules/SpeciesPage';
import { EnclosuresPage } from '../pages/modules/EnclosuresPage';
import { EmployeesPage } from '../pages/modules/EmployeesPage';
import { AssignmentsPage, VeterinaryPage, VaccinationsPage } from '../pages/modules/AssignmentsVetPage';
import {
  FoodInventoryPage, FeedingSchedulePage, VisitorsPage, TicketTypesPage,
  TicketsPage, PaymentsPage, SuppliersPage, FoodPurchasesPage, ExpensesPage,
  UsersPage,
} from '../pages/modules/OperationsPages';
import { ReportsPage, SettingsPage } from '../pages/modules/ReportsSettingsPage';

const withPermission = (permission: string, element: React.ReactNode) => (
  <ProtectedRoute permission={permission}>{element}</ProtectedRoute>
);

export const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/forbidden" element={<ForbiddenPage />} />

    <Route path="/" element={<DashboardLayout />}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={withPermission('dashboard', <DashboardPage />)} />
      <Route path="animals" element={withPermission('animals', <AnimalsPage />)} />
      <Route path="species" element={withPermission('species', <SpeciesPage />)} />
      <Route path="enclosures" element={withPermission('enclosures', <EnclosuresPage />)} />
      <Route path="employees" element={withPermission('employees', <EmployeesPage />)} />
      <Route path="assignments" element={withPermission('assignments', <AssignmentsPage />)} />
      <Route path="veterinary" element={withPermission('veterinary', <VeterinaryPage />)} />
      <Route path="vaccinations" element={withPermission('vaccinations', <VaccinationsPage />)} />
      <Route path="food-inventory" element={withPermission('food-inventory', <FoodInventoryPage />)} />
      <Route path="feeding-schedule" element={withPermission('feeding-schedule', <FeedingSchedulePage />)} />
      <Route path="visitors" element={withPermission('visitors', <VisitorsPage />)} />
      <Route path="ticket-types" element={withPermission('ticket-types', <TicketTypesPage />)} />
      <Route path="tickets" element={withPermission('tickets', <TicketsPage />)} />
      <Route path="payments" element={withPermission('payments', <PaymentsPage />)} />
      <Route path="suppliers" element={withPermission('suppliers', <SuppliersPage />)} />
      <Route path="food-purchases" element={withPermission('food-purchases', <FoodPurchasesPage />)} />
      <Route path="expenses" element={withPermission('expenses', <ExpensesPage />)} />
      <Route path="users" element={withPermission('users', <UsersPage />)} />
      <Route path="reports" element={withPermission('reports', <ReportsPage />)} />
      <Route path="settings" element={withPermission('settings', <SettingsPage />)} />
    </Route>

    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);
