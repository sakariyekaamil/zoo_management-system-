import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { ResourcePage } from '../../components/ResourcePage';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Common';
import {
  foodInventoryApi, feedingScheduleApi, visitorsApi, ticketTypesApi,
  ticketsApi, paymentsApi, suppliersApi, foodPurchasesApi, expensesApi,
  usersApi,
} from '../../services/resources';
import { animalsApi, employeesApi } from '../../services/resources';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, ROLE_LABELS } from '../../constants';
import { formatCurrency, formatDate, formatDateTime } from '../../utils';
import { UserRole } from '../../types';
import type { TicketType } from './TicketTypesPage';

// Food Inventory
const foodSchema = z.object({
  name: z.string().min(1), category: z.string().min(1), quantity: z.coerce.number().min(0),
  unit: z.string().min(1), minStockLevel: z.coerce.number().min(0),
});
interface FoodItem { id: string; name: string; category: string; quantity: number; unit: string; minStockLevel: number; supplier?: { name: string } }

const FoodForm = ({ onSubmit, initialData, loading }: { onSubmit: (d: Partial<FoodItem>) => void; initialData?: FoodItem; loading: boolean }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(foodSchema), defaultValues: initialData || { unit: 'kg', minStockLevel: 10 } });
  useEffect(() => { if (initialData) reset(initialData); }, [initialData, reset]);
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Name" error={errors.name?.message as string} {...register('name')} />
      <Input label="Category" error={errors.category?.message as string} {...register('category')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Quantity" type="number" {...register('quantity')} />
        <Input label="Unit" {...register('unit')} />
      </div>
      <Input label="Min Stock Level" type="number" {...register('minStockLevel')} />
      <Button type="submit" loading={loading} className="w-full">Save</Button>
    </form>
  );
};

export const FoodInventoryPage = () => (
  <ResourcePage<FoodItem>
    title="Food Inventory" queryKey="food-inventory" api={foodInventoryApi}
    description="Manage animal food stock levels"
    columns={[
      { key: 'name', header: 'Name' }, { key: 'category', header: 'Category' },
      { key: 'quantity', header: 'Stock', render: (f) => `${f.quantity} ${f.unit}` },
      { key: 'minStockLevel', header: 'Min Level', render: (f) => `${f.minStockLevel} ${f.unit}` },
      { key: 'status', header: 'Status', render: (f) => (
        <Badge className={f.quantity <= f.minStockLevel ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
          {f.quantity <= f.minStockLevel ? 'Low Stock' : 'OK'}
        </Badge>
      )},
    ]}
    renderForm={(p) => <FoodForm {...p} />}
  />
);

// Feeding Schedule
const feedSchema = z.object({
  animalId: z.string().uuid(), foodId: z.string().uuid(), keeperId: z.string().optional(),
  scheduledTime: z.string().min(1), frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']), quantity: z.coerce.number().min(0),
});
interface FeedingSchedule { id: string; animalId: string; scheduledTime: string; frequency: string; quantity: number; isCompleted: boolean; animal?: { name: string }; food?: { name: string }; keeper?: { firstName: string; lastName: string } }

const FeedForm = ({ onSubmit, initialData, loading }: { onSubmit: (d: Partial<FeedingSchedule>) => void; initialData?: FeedingSchedule; loading: boolean }) => {
  const { data: animalsRes } = useQuery({ queryKey: ['animals-all'], queryFn: () => animalsApi.getAll({ limit: 100 }) });
  const { data: foodRes } = useQuery({ queryKey: ['food-all'], queryFn: () => foodInventoryApi.getAll({ limit: 100 }) });
  const { data: empRes } = useQuery({ queryKey: ['employees-all'], queryFn: () => employeesApi.getAll({ limit: 100 }) });
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(feedSchema), defaultValues: initialData || { frequency: 'DAILY' } });
  useEffect(() => { if (initialData) reset({ ...initialData, scheduledTime: initialData.scheduledTime?.slice(0, 16) }); }, [initialData, reset]);
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select label="Animal" options={(animalsRes?.data?.data || []).map((a: { id: string; name: string }) => ({ value: a.id, label: a.name }))} error={errors.animalId?.message as string} {...register('animalId')} />
      <Select label="Food" options={(foodRes?.data?.data || []).map((f: { id: string; name: string }) => ({ value: f.id, label: f.name }))} error={errors.foodId?.message as string} {...register('foodId')} />
      <Select label="Keeper" options={(empRes?.data?.data || []).map((e: { id: string; firstName: string; lastName: string }) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))} placeholder="Select keeper" {...register('keeperId')} />
      <Input label="Scheduled Time" type="datetime-local" error={errors.scheduledTime?.message as string} {...register('scheduledTime')} />
      <Select label="Frequency" options={['DAILY', 'WEEKLY', 'MONTHLY'].map((f) => ({ value: f, label: f }))} {...register('frequency')} />
      <Input label="Quantity" type="number" step="0.1" {...register('quantity')} />
      <Button type="submit" loading={loading} className="w-full">Save</Button>
    </form>
  );
};

export const FeedingSchedulePage = () => (
  <ResourcePage<FeedingSchedule>
    title="Feeding Schedule" queryKey="feeding-schedule" api={feedingScheduleApi}
    description="Daily, weekly, and monthly feeding schedules"
    columns={[
      { key: 'animal', header: 'Animal', render: (f) => f.animal?.name || '-' },
      { key: 'food', header: 'Food', render: (f) => f.food?.name || '-' },
      { key: 'scheduledTime', header: 'Scheduled', render: (f) => formatDateTime(f.scheduledTime) },
      { key: 'frequency', header: 'Frequency' },
      { key: 'quantity', header: 'Qty' },
      { key: 'isCompleted', header: 'Status', render: (f) => (
        <Badge className={f.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{f.isCompleted ? 'Done' : 'Pending'}</Badge>
      )},
    ]}
    renderForm={(p) => <FeedForm {...p} />}
  />
);

// Visitors
const visitorSchema = z.object({ firstName: z.string().min(1), lastName: z.string().min(1), email: z.string().email().optional().or(z.literal('')), phone: z.string().optional() });
interface Visitor { id: string; firstName: string; lastName: string; email?: string; phone?: string }

const VisitorForm = ({ onSubmit, initialData, loading }: { onSubmit: (d: Partial<Visitor>) => void; initialData?: Visitor; loading: boolean }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(visitorSchema), defaultValues: initialData });
  useEffect(() => { if (initialData) reset(initialData); }, [initialData, reset]);
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name" error={errors.firstName?.message as string} {...register('firstName')} />
        <Input label="Last Name" error={errors.lastName?.message as string} {...register('lastName')} />
      </div>
      <Input label="Email" type="email" {...register('email')} />
      <Input label="Phone" {...register('phone')} />
      <Button type="submit" loading={loading} className="w-full">Save</Button>
    </form>
  );
};

export const VisitorsPage = () => (
  <ResourcePage<Visitor>
    title="Visitors" queryKey="visitors" api={visitorsApi} description="Manage zoo visitors"
    columns={[
      { key: 'name', header: 'Name', render: (v) => `${v.firstName} ${v.lastName}` },
      { key: 'email', header: 'Email' }, { key: 'phone', header: 'Phone' },
    ]}
    renderForm={(p) => <VisitorForm {...p} />}
  />
);

export { TicketTypesPage } from './TicketTypesPage';

// Tickets
const ticketSchema = z.object({ visitorId: z.string().uuid(), ticketTypeId: z.string().uuid(), quantity: z.coerce.number().min(1) });
interface Ticket { id: string; ticketNumber: string; visitorId: string; quantity: number; totalAmount: number; status: string; visitDate: string; visitor?: { firstName: string; lastName: string }; ticketType?: { name: string } }

const TicketForm = ({ onSubmit, initialData, loading }: { onSubmit: (d: Partial<Ticket>) => void; initialData?: Ticket; loading: boolean }) => {
  const { data: visitorsRes } = useQuery({ queryKey: ['visitors-all'], queryFn: () => visitorsApi.getAll({ limit: 100 }) });
  const { data: ttRes } = useQuery({ queryKey: ['tt-all'], queryFn: () => ticketTypesApi.getAll({ limit: 100 }) });
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(ticketSchema), defaultValues: initialData || { quantity: 1 } });
  useEffect(() => { if (initialData) reset(initialData); }, [initialData, reset]);
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select label="Visitor" options={(visitorsRes?.data?.data || []).map((v: Visitor) => ({ value: v.id, label: `${v.firstName} ${v.lastName}` }))} error={errors.visitorId?.message as string} {...register('visitorId')} />
      <Select label="Ticket Type" options={(ttRes?.data?.data || []).map((t: TicketType) => ({ value: t.id, label: `${t.name} - ${formatCurrency(t.price)}` }))} error={errors.ticketTypeId?.message as string} {...register('ticketTypeId')} />
      <Input label="Quantity" type="number" min={1} {...register('quantity')} />
      <Button type="submit" loading={loading} className="w-full">Create Ticket</Button>
    </form>
  );
};

export const TicketsPage = () => (
  <ResourcePage<Ticket>
    title="Tickets" queryKey="tickets" api={ticketsApi} description="Issue and manage visitor tickets"
    columns={[
      { key: 'ticketNumber', header: 'Ticket #' },
      { key: 'visitor', header: 'Visitor', render: (t) => t.visitor ? `${t.visitor.firstName} ${t.visitor.lastName}` : '-' },
      { key: 'ticketType', header: 'Type', render: (t) => t.ticketType?.name || '-' },
      { key: 'quantity', header: 'Qty' },
      { key: 'totalAmount', header: 'Amount', render: (t) => formatCurrency(t.totalAmount) },
      { key: 'status', header: 'Status' },
      { key: 'visitDate', header: 'Visit Date', render: (t) => formatDate(t.visitDate) },
    ]}
    renderForm={(p) => <TicketForm {...p} />}
  />
);

// Payments
const paySchema = z.object({
  ticketId: z.string().uuid(),
  amount: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).max(100),
  paymentMethod: z.enum(['CASH', 'CARD', 'MOBILE_MONEY']),
});
interface Payment {
  id: string;
  ticketId: string;
  amount: number;
  discount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  ticket?: {
    ticketNumber: string;
    totalAmount: number;
    visitor?: { firstName: string; lastName: string };
  };
}

const PayForm = ({ onSubmit, initialData, loading }: { onSubmit: (d: Partial<Payment>) => void; initialData?: Payment; loading: boolean }) => {
  const { data: ticketsRes } = useQuery({ queryKey: ['tickets-all'], queryFn: () => ticketsApi.getAll({ limit: 100 }) });
  const tickets = (ticketsRes?.data?.data || []) as Ticket[];
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(paySchema),
    defaultValues: initialData || { paymentMethod: 'CASH', discount: 0, amount: 0 },
  });
  const selectedTicketId = watch('ticketId');
  const discount = Number(watch('discount') || 0);
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId);
  const ticketAmount = selectedTicket?.totalAmount ?? initialData?.ticket?.totalAmount ?? 0;
  const totalAmount = Math.max(0, Math.round(ticketAmount * (1 - discount / 100) * 100) / 100);

  useEffect(() => { if (initialData) reset(initialData); }, [initialData, reset]);
  useEffect(() => {
    setValue('amount', totalAmount, { shouldValidate: true });
  }, [setValue, totalAmount]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select label="Ticket" options={tickets.map((t) => ({ value: t.id, label: `${t.ticketNumber} - ${formatCurrency(t.totalAmount)}` }))} error={errors.ticketId?.message as string} {...register('ticketId')} />
      <Input label="Ticket Price" value={ticketAmount} readOnly />
      <Input label="Discount (%)" type="number" min={0} max={100} step="0.01" error={errors.discount?.message as string} {...register('discount')} />
      <Input label="Total After Discount" value={totalAmount} readOnly />
      <input type="hidden" {...register('amount')} />
      <div className="rounded-lg bg-primary-50 p-3 text-sm text-primary-800 dark:bg-primary-900/30 dark:text-primary-200">
        {formatCurrency(ticketAmount)} − {discount}% discount = <strong>{formatCurrency(totalAmount)}</strong>
      </div>
      <Select label="Payment Method" options={PAYMENT_METHODS.map((m) => ({ value: m, label: m.replace('_', ' ') }))} {...register('paymentMethod')} />
      <Button type="submit" loading={loading} className="w-full">Record Payment</Button>
    </form>
  );
};

export const PaymentsPage = () => (
  <ResourcePage<Payment>
    title="Payments" queryKey="payments" api={paymentsApi} description="Track ticket payments"
    columns={[
      { key: 'ticket', header: 'Ticket', render: (p) => p.ticket?.ticketNumber || '-' },
      { key: 'visitor', header: 'Visitor', render: (p) => p.ticket?.visitor ? `${p.ticket.visitor.firstName} ${p.ticket.visitor.lastName}` : '-' },
      { key: 'ticketAmount', header: 'Ticket Price', render: (p) => formatCurrency(p.ticket?.totalAmount ?? p.amount) },
      { key: 'discount', header: 'Discount', render: (p) => `${p.discount ?? 0}%` },
      { key: 'amount', header: 'Total', render: (p) => formatCurrency(p.amount) },
      { key: 'paymentMethod', header: 'Method', render: (p) => p.paymentMethod.replace('_', ' ') },
      { key: 'status', header: 'Status' },
      { key: 'paymentDate', header: 'Date', render: (p) => formatDate(p.paymentDate) },
    ]}
    renderForm={(p) => <PayForm {...p} />}
  />
);

// Suppliers
const supSchema = z.object({ name: z.string().min(1), contactPerson: z.string().optional(), email: z.string().optional(), phone: z.string().optional(), address: z.string().optional() });
interface Supplier { id: string; name: string; contactPerson?: string; email?: string; phone?: string }

const SupForm = ({ onSubmit, initialData, loading }: { onSubmit: (d: Partial<Supplier>) => void; initialData?: Supplier; loading: boolean }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(supSchema), defaultValues: initialData });
  useEffect(() => { if (initialData) reset(initialData); }, [initialData, reset]);
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Name" error={errors.name?.message as string} {...register('name')} />
      <Input label="Contact Person" {...register('contactPerson')} />
      <Input label="Email" {...register('email')} />
      <Input label="Phone" {...register('phone')} />
      <Input label="Address" {...register('address')} />
      <Button type="submit" loading={loading} className="w-full">Save</Button>
    </form>
  );
};

export const SuppliersPage = () => (
  <ResourcePage<Supplier>
    title="Suppliers" queryKey="suppliers" api={suppliersApi} description="Manage food and supply vendors"
    columns={[
      { key: 'name', header: 'Name' }, { key: 'contactPerson', header: 'Contact' },
      { key: 'email', header: 'Email' }, { key: 'phone', header: 'Phone' },
    ]}
    renderForm={(p) => <SupForm {...p} />}
  />
);

// Food Purchases
const fpSchema = z.object({ foodId: z.string().uuid(), supplierId: z.string().uuid(), quantity: z.coerce.number().min(0), unitPrice: z.coerce.number().min(0) });
interface FoodPurchase { id: string; quantity: number; unitPrice: number; totalCost: number; purchaseDate: string; food?: { name: string }; supplier?: { name: string } }

const FPForm = ({ onSubmit, initialData, loading }: { onSubmit: (d: Partial<FoodPurchase>) => void; initialData?: FoodPurchase; loading: boolean }) => {
  const { data: foodRes } = useQuery({ queryKey: ['food-all'], queryFn: () => foodInventoryApi.getAll({ limit: 100 }) });
  const { data: supRes } = useQuery({ queryKey: ['sup-all'], queryFn: () => suppliersApi.getAll({ limit: 100 }) });
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(fpSchema), defaultValues: initialData });
  useEffect(() => { if (initialData) reset(initialData); }, [initialData, reset]);
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select label="Food Item" options={(foodRes?.data?.data || []).map((f: FoodItem) => ({ value: f.id, label: f.name }))} error={errors.foodId?.message as string} {...register('foodId')} />
      <Select label="Supplier" options={(supRes?.data?.data || []).map((s: Supplier) => ({ value: s.id, label: s.name }))} error={errors.supplierId?.message as string} {...register('supplierId')} />
      <Input label="Quantity" type="number" {...register('quantity')} />
      <Input label="Unit Price" type="number" step="0.01" {...register('unitPrice')} />
      <Button type="submit" loading={loading} className="w-full">Record Purchase</Button>
    </form>
  );
};

export const FoodPurchasesPage = () => (
  <ResourcePage<FoodPurchase>
    title="Food Purchases" queryKey="food-purchases" api={foodPurchasesApi} description="Track food procurement (auto-updates inventory)"
    columns={[
      { key: 'food', header: 'Food', render: (p) => p.food?.name || '-' },
      { key: 'supplier', header: 'Supplier', render: (p) => p.supplier?.name || '-' },
      { key: 'quantity', header: 'Qty' },
      { key: 'unitPrice', header: 'Unit Price', render: (p) => formatCurrency(p.unitPrice) },
      { key: 'totalCost', header: 'Total', render: (p) => formatCurrency(p.totalCost) },
      { key: 'purchaseDate', header: 'Date', render: (p) => formatDate(p.purchaseDate) },
    ]}
    renderForm={(p) => <FPForm {...p} />}
  />
);

// Expenses
const expSchema = z.object({
  category: z.enum(['SALARY', 'FOOD', 'MAINTENANCE', 'UTILITIES', 'MEDICAL', 'EQUIPMENT', 'MARKETING', 'OTHER']),
  employeeId: z.string().uuid().optional(),
  description: z.string().min(1),
  bonus: z.coerce.number().min(0),
  amount: z.coerce.number().min(0),
});
interface SalaryEmployee { id: string; firstName: string; lastName: string; salary: number; isActive: boolean }
interface Expense {
  id: string;
  category: string;
  employeeId?: string;
  description: string;
  bonus: number;
  amount: number;
  expenseDate: string;
  employee?: SalaryEmployee;
}

const ExpForm = ({ onSubmit, initialData, loading }: { onSubmit: (d: Partial<Expense>) => void; initialData?: Expense; loading: boolean }) => {
  const { data: employeesRes } = useQuery({
    queryKey: ['employees-salary'],
    queryFn: () => employeesApi.getAll({ limit: 100 }),
  });
  const employees = (employeesRes?.data?.data || []) as SalaryEmployee[];
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(expSchema),
    defaultValues: initialData || { category: 'OTHER', bonus: 0 },
  });
  const category = watch('category');
  const employeeId = watch('employeeId');
  const bonus = Number(watch('bonus') || 0);
  const selectedEmployee = employees.find((employee) => employee.id === employeeId);

  useEffect(() => { if (initialData) reset(initialData); }, [initialData, reset]);
  useEffect(() => {
    if (category === 'SALARY' && selectedEmployee) {
      setValue('description', `Salary - ${selectedEmployee.firstName} ${selectedEmployee.lastName}`, { shouldValidate: true });
      setValue('amount', selectedEmployee.salary + bonus, { shouldValidate: true });
    }
  }, [bonus, category, selectedEmployee, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select label="Category" options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))} {...register('category')} />
      {category === 'SALARY' && (
        <Select
          label="Employee"
          placeholder="Select employee"
          options={employees.filter((employee) => employee.isActive).map((employee) => ({
            value: employee.id,
            label: `${employee.firstName} ${employee.lastName} - ${formatCurrency(employee.salary)}`,
          }))}
          error={errors.employeeId?.message as string}
          {...register('employeeId')}
        />
      )}
      <Input label="Description" readOnly={category === 'SALARY'} error={errors.description?.message as string} {...register('description')} />
      {category === 'SALARY' && (
        <Input label="Bonus" type="number" min={0} step="0.01" error={errors.bonus?.message as string} {...register('bonus')} />
      )}
      <Input label={category === 'SALARY' ? 'Total Salary' : 'Amount'} type="number" step="0.01" readOnly={category === 'SALARY'} error={errors.amount?.message as string} {...register('amount')} />
      {category === 'SALARY' && selectedEmployee && (
        <div className="rounded-lg bg-primary-50 p-3 text-sm text-primary-800 dark:bg-primary-900/30 dark:text-primary-200">
          Salary {formatCurrency(selectedEmployee.salary)} + Bonus {formatCurrency(bonus)} = <strong>{formatCurrency(selectedEmployee.salary + bonus)}</strong>
        </div>
      )}
      <Button type="submit" loading={loading} className="w-full">Save</Button>
    </form>
  );
};

export const ExpensesPage = () => (
  <ResourcePage<Expense>
    title="Expenses" queryKey="expenses" api={expensesApi} description="Track zoo operational expenses"
    columns={[
      { key: 'category', header: 'Category' },
      { key: 'employee', header: 'Employee', render: (e) => e.employee ? `${e.employee.firstName} ${e.employee.lastName}` : '-' },
      { key: 'description', header: 'Description' },
      { key: 'baseSalary', header: 'Base Salary', render: (e) => e.category === 'SALARY' ? formatCurrency(e.employee?.salary ?? e.amount - (e.bonus ?? 0)) : '-' },
      { key: 'bonus', header: 'Bonus', render: (e) => e.category === 'SALARY' ? formatCurrency(e.bonus ?? 0) : '-' },
      { key: 'amount', header: 'Total', render: (e) => formatCurrency(e.amount) },
      { key: 'expenseDate', header: 'Date', render: (e) => formatDate(e.expenseDate) },
    ]}
    renderForm={(p) => <ExpForm {...p} />}
  />
);

// Users
const userSchema = z.object({
  email: z.string().email(), firstName: z.string().min(1), lastName: z.string().min(1),
  role: z.enum(['ADMIN', 'MANAGER', 'VETERINARIAN', 'KEEPER', 'CASHIER', 'GUIDE']),
  password: z.string().min(8).optional(),
});
interface User { id: string; email: string; firstName: string; lastName: string; role: UserRole; isActive: boolean }

const UserForm = ({ onSubmit, initialData, loading }: { onSubmit: (d: Partial<User & { password?: string }>) => void; initialData?: User; loading: boolean }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(userSchema), defaultValues: initialData || { role: 'GUIDE' } });
  useEffect(() => { if (initialData) reset(initialData); }, [initialData, reset]);
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Email" type="email" error={errors.email?.message as string} {...register('email')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name" error={errors.firstName?.message as string} {...register('firstName')} />
        <Input label="Last Name" error={errors.lastName?.message as string} {...register('lastName')} />
      </div>
      <Select label="Role" options={Object.entries(ROLE_LABELS).map(([v, l]) => ({ value: v, label: l }))} {...register('role')} />
      {!initialData && <Input label="Password" type="password" error={errors.password?.message as string} {...register('password')} />}
      <Button type="submit" loading={loading} className="w-full">Save</Button>
    </form>
  );
};

export const UsersPage = () => (
  <ResourcePage<User>
    title="Users" queryKey="users" api={usersApi} description="System user management (Admin only)"
    columns={[
      { key: 'name', header: 'Name', render: (u) => `${u.firstName} ${u.lastName}` },
      { key: 'email', header: 'Email' },
      { key: 'role', header: 'Role', render: (u) => ROLE_LABELS[u.role] },
      { key: 'isActive', header: 'Status', render: (u) => (
        <Badge className={u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
      )},
    ]}
    renderForm={(p) => <UserForm {...p} />}
  />
);
