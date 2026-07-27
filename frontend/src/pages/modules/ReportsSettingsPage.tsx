import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { DocumentArrowDownIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { PageHeader, LoadingSkeleton, EmptyState } from '../../components/ui/Common';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { reportsApi, settingsApi } from '../../services/resources';
import { authApi } from '../../services/resources';
import { REPORT_TYPES } from '../../constants';
import { downloadCSV, formatCurrency, formatDate, getErrorMessage } from '../../utils';
import { useAuth } from '../../contexts/AuthContext';

type ReportRow = Record<string, unknown>;
type ReportColumn = {
  key: string;
  label: string;
  value?: (row: ReportRow) => unknown;
  format?: 'currency' | 'date';
};
type ReportConfig = { title: string; description: string; columns: ReportColumn[] };

const nestedValue = (row: ReportRow, path: string): unknown =>
  path.split('.').reduce<unknown>((value, key) => (
    value && typeof value === 'object' ? (value as ReportRow)[key] : undefined
  ), row);

const fullName = (value: unknown) => {
  const person = value as ReportRow | undefined;
  return [person?.firstName, person?.lastName].filter(Boolean).join(' ') || '-';
};

const REPORT_CONFIGS: Record<string, ReportConfig> = {
  animals: {
    title: 'Animals Report',
    description: 'Animal registry, location, and health overview',
    columns: [
      { key: 'name', label: 'Animal' },
      { key: 'species.name', label: 'Species' },
      { key: 'enclosure.name', label: 'Enclosure' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'gender', label: 'Gender' },
      { key: 'healthStatus', label: 'Health Status' },
      { key: 'arrivalDate', label: 'Arrival Date', format: 'date' },
    ],
  },
  visitors: {
    title: 'Visitors Report',
    description: 'Visitor contacts and ticket activity',
    columns: [
      { key: 'name', label: 'Visitor', value: (row) => fullName(row) },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'tickets', label: 'Tickets', value: (row) => Array.isArray(row.tickets) ? row.tickets.length : 0 },
      { key: 'createdAt', label: 'Registered', format: 'date' },
    ],
  },
  revenue: {
    title: 'Revenue Report',
    description: 'Completed payment revenue',
    columns: [
      { key: 'ticket.ticketNumber', label: 'Ticket' },
      { key: 'visitor', label: 'Visitor', value: (row) => fullName(nestedValue(row, 'ticket.visitor')) },
      { key: 'ticket.totalAmount', label: 'Ticket Price', format: 'currency' },
      { key: 'discount', label: 'Discount', value: (row) => `${Number(row.discount ?? 0)}%` },
      { key: 'amount', label: 'Total', format: 'currency' },
      { key: 'paymentMethod', label: 'Method' },
      { key: 'paymentDate', label: 'Date', format: 'date' },
    ],
  },
  expenses: {
    title: 'Expenses Report',
    description: 'Operational expense history',
    columns: [
      { key: 'category', label: 'Category' },
      { key: 'employee', label: 'Employee', value: (row) => fullName(row.employee) },
      { key: 'description', label: 'Description' },
      { key: 'baseSalary', label: 'Base Salary', value: (row) => (
        row.category === 'SALARY'
          ? Number(nestedValue(row, 'employee.salary') ?? Number(row.amount) - Number(row.bonus ?? 0))
          : null
      ), format: 'currency' },
      { key: 'bonus', label: 'Bonus', value: (row) => row.category === 'SALARY' ? Number(row.bonus ?? 0) : null, format: 'currency' },
      { key: 'amount', label: 'Total', format: 'currency' },
      { key: 'recorder', label: 'Recorded By', value: (row) => fullName(row.recorder) },
      { key: 'expenseDate', label: 'Date', format: 'date' },
    ],
  },
  inventory: {
    title: 'Inventory Report',
    description: 'Current food inventory stock',
    columns: [
      { key: 'name', label: 'Food Item' },
      { key: 'category', label: 'Category' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'unit', label: 'Unit' },
      { key: 'minStockLevel', label: 'Minimum Stock' },
      { key: 'supplier.name', label: 'Supplier' },
    ],
  },
  veterinary: {
    title: 'Veterinary Report',
    description: 'Animal diagnosis and treatment history',
    columns: [
      { key: 'animal.name', label: 'Animal' },
      { key: 'animal.species.name', label: 'Species' },
      { key: 'diagnosis', label: 'Diagnosis' },
      { key: 'treatment', label: 'Treatment' },
      { key: 'medicine', label: 'Medicine' },
      { key: 'visitDate', label: 'Visit Date', format: 'date' },
    ],
  },
  vaccinations: {
    title: 'Vaccinations Report',
    description: 'Animal vaccination history and due dates',
    columns: [
      { key: 'animal.name', label: 'Animal' },
      { key: 'animal.species.name', label: 'Species' },
      { key: 'vaccineName', label: 'Vaccine' },
      { key: 'administeredDate', label: 'Administered', format: 'date' },
      { key: 'expiryDate', label: 'Expires', format: 'date' },
      { key: 'nextDueDate', label: 'Next Due', format: 'date' },
      { key: 'administeredBy', label: 'Administered By' },
    ],
  },
  payments: {
    title: 'Payments Report',
    description: 'Complete payment transaction history',
    columns: [
      { key: 'ticket.ticketNumber', label: 'Ticket' },
      { key: 'visitor', label: 'Visitor', value: (row) => fullName(nestedValue(row, 'ticket.visitor')) },
      { key: 'ticket.totalAmount', label: 'Ticket Price', format: 'currency' },
      { key: 'discount', label: 'Discount', value: (row) => `${Number(row.discount ?? 0)}%` },
      { key: 'amount', label: 'Total', format: 'currency' },
      { key: 'paymentMethod', label: 'Method' },
      { key: 'status', label: 'Status' },
      { key: 'transactionId', label: 'Transaction ID' },
      { key: 'paymentDate', label: 'Date', format: 'date' },
    ],
  },
};

const EXPENSE_CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'SALARY', label: 'Salary' },
  { value: 'FOOD', label: 'Food' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'MEDICAL', label: 'Medical' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'OTHER', label: 'Other' },
];

const getColumnValue = (row: ReportRow, column: ReportColumn) =>
  column.value ? column.value(row) : nestedValue(row, column.key);

const formatReportValue = (value: unknown, format?: ReportColumn['format']) => {
  if (value === null || value === undefined || value === '') return '-';
  if (format === 'currency') return formatCurrency(Number(value));
  if (format === 'date') return formatDate(String(value));
  return String(value).replaceAll('_', ' ');
};

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const printReport = (rows: ReportRow[], config: ReportConfig) => {
  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) {
    toast.error('Please allow pop-ups to print reports');
    return;
  }

  const body = rows.map((row) => `
    <tr>${config.columns.map((column) => (
      `<td>${escapeHtml(formatReportValue(getColumnValue(row, column), column.format))}</td>`
    )).join('')}</tr>
  `).join('');

  printWindow.document.write(`
    <!doctype html><html><head><title>${escapeHtml(config.title)}</title>
    <style>
      *{box-sizing:border-box} body{margin:0;padding:32px;font-family:Arial,sans-serif;color:#172554}
      header{display:flex;justify-content:space-between;align-items:end;border-bottom:3px solid #166534;padding-bottom:16px;margin-bottom:24px}
      h1{margin:0 0 6px;font-size:25px} p{margin:0;color:#64748b;font-size:13px}.meta{text-align:right}
      table{width:100%;border-collapse:collapse;font-size:12px} th{background:#14532d;color:#fff;text-align:left;padding:10px}
      td{padding:10px;border-bottom:1px solid #dbe3dd} tr:nth-child(even){background:#f6faf7}
      footer{margin-top:24px;color:#64748b;font-size:11px;text-align:center}@media print{body{padding:14px}}
    </style></head><body>
    <header><div><h1>WARRAN-CADDE ZOO</h1><p>${escapeHtml(config.title)}</p></div>
    <div class="meta"><p>${rows.length} record${rows.length === 1 ? '' : 's'}</p><p>${escapeHtml(new Date().toLocaleString())}</p></div></header>
    <table><thead><tr>${config.columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')}</tr></thead>
    <tbody>${body}</tbody></table><footer>Generated by WARRAN-CADDE Zoo Management System</footer>
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();};</script>
    </body></html>
  `);
  printWindow.document.close();
};

export const ReportsPage = () => {
  const [reportType, setReportType] = useState('animals');
  const [expenseCategory, setExpenseCategory] = useState('ALL');
  const config = REPORT_CONFIGS[reportType];
  const { data, isLoading, error } = useQuery({
    queryKey: ['report', reportType],
    queryFn: () => reportsApi.getSummary(reportType),
    enabled: Boolean(reportType),
  });
  const rows = (Array.isArray(data?.data?.data) ? data.data.data : []) as ReportRow[];
  const displayedRows = reportType === 'expenses' && expenseCategory !== 'ALL'
    ? rows.filter((row) => row.category === expenseCategory)
    : rows;
  const hasAmount = config.columns.some((column) => column.key === 'amount');
  const amountTotal = displayedRows.reduce((total, row) => total + (typeof row.amount === 'number' ? row.amount : 0), 0);

  const handleExport = () => {
    if (!displayedRows.length) return toast.error('No data to export');
    const flattenedRows = displayedRows.map((row) => Object.fromEntries(
      config.columns.map((column) => [
        column.label,
        formatReportValue(getColumnValue(row, column), column.format),
      ])
    ));
    const categorySuffix = reportType === 'expenses' && expenseCategory !== 'ALL'
      ? `-${expenseCategory.toLowerCase()}`
      : '';
    downloadCSV(flattenedRows, `warran-cadde-${reportType}${categorySuffix}-report`);
    toast.success('Report exported as CSV');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Explore, export, and print zoo data" />

      <Card className="overflow-hidden relative border-0 !bg-primary-900 bg-linear-to-br from-primary-900 via-primary-800 to-emerald-700 !text-white">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-medium text-primary-100 mb-2">REPORT CENTER</p>
            <h2 className="text-2xl font-bold">{config.title}</h2>
            <p className="text-primary-100 mt-2">{config.description}</p>
            <div className="mt-5 max-w-md">
              <label className="block text-sm font-medium text-white mb-1">Select Report</label>
              <Select
                options={REPORT_TYPES}
                value={reportType}
                onChange={(event) => setReportType(event.target.value)}
                className="!bg-white !text-gray-900 dark:!bg-white dark:!text-gray-900"
              />
            </div>
            {reportType === 'expenses' && (
              <div className="mt-4 max-w-md">
                <label className="block text-sm font-medium text-white mb-1">Expense Category</label>
                <Select
                  options={EXPENSE_CATEGORY_OPTIONS}
                  value={expenseCategory}
                  onChange={(event) => setExpenseCategory(event.target.value)}
                  className="!bg-white !text-gray-900 dark:!bg-white dark:!text-gray-900"
                />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20" onClick={handleExport} disabled={!displayedRows.length}>
              <DocumentArrowDownIcon className="w-4 h-4" /> Export CSV
            </Button>
            <Button className="bg-black text-primary-800 hover:bg-primary-50" onClick={() => printReport(displayedRows, config)} disabled={!displayedRows.length}>
              <PrinterIcon className="w-4 h-4" /> Print All
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card><p className="text-sm text-gray-500">Total Records</p><p className="mt-1 text-3xl font-bold">{displayedRows.length}</p></Card>
        <Card>
          <p className="text-sm text-gray-500">{hasAmount ? 'Total Amount' : 'Report Columns'}</p>
          <p className="mt-1 text-3xl font-bold">{hasAmount ? formatCurrency(amountTotal) : config.columns.length}</p>
        </Card>
      </div>

      <Card padding={false} className="overflow-hidden">
        <div className="border-b border-gray-200 p-5 dark:border-gray-800">
          <h3 className="font-semibold">{config.title}</h3>
          <p className="text-sm text-gray-500">Select a report above to view its latest data.</p>
        </div>
        {isLoading ? (
          <div className="p-6"><LoadingSkeleton rows={6} /></div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{getErrorMessage(error)}</div>
        ) : displayedRows.length === 0 ? (
          <EmptyState title="No report data" description={`No records found for ${config.title.toLowerCase()}.`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60"><tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">#</th>
                {config.columns.map((column) => <th key={column.key} className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-500">{column.label}</th>)}
                <th className="px-4 py-3 text-right font-medium text-gray-500">Print</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {displayedRows.map((row, index) => (
                  <tr key={String(row.id ?? index)} className="hover:bg-primary-50/40 dark:hover:bg-gray-800/40">
                    <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                    {config.columns.map((column) => (
                      <td key={column.key} className="max-w-xs whitespace-nowrap px-4 py-3">{formatReportValue(getColumnValue(row, column), column.format)}</td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => printReport([row], config)}>
                        <PrinterIcon className="h-4 w-4" /> Print Row
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

const settingsSchema = z.object({
  zooName: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  description: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const SettingsPage = () => {
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();

  const { data: settingsRes, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
  });

  const settings = settingsRes?.data?.data;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(settingsSchema),
  });

  const { register: regPw, handleSubmit: handlePw, formState: { errors: pwErrors } } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (settings) reset(settings);
  }, [settings, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => settingsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => toast.success('Password changed'),
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const logoMutation = useMutation({
    mutationFn: (file: File) => settingsApi.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Logo uploaded');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) return <LoadingSkeleton rows={6} />;

  return (
    <div>
      <PageHeader title="Settings" description="Zoo information and account settings" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-4">Zoo Information</h3>
          <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
            <Input label="Zoo Name" error={errors.zooName?.message as string} defaultValue={settings?.zooName} {...register('zooName')} />
            <Textarea label="Address" rows={2} defaultValue={settings?.address} {...register('address')} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone" defaultValue={settings?.phone} {...register('phone')} />
              <Input label="Email" defaultValue={settings?.email} {...register('email')} />
            </div>
            <Input label="Website" defaultValue={settings?.website} {...register('website')} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Opening Time" defaultValue={settings?.openingTime} {...register('openingTime')} />
              <Input label="Closing Time" defaultValue={settings?.closingTime} {...register('closingTime')} />
            </div>
            <Textarea label="Description" rows={3} defaultValue={settings?.description} {...register('description')} />
            <Button type="submit" loading={updateMutation.isPending}>Save Settings</Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold mb-4">Logo Upload</h3>
            {settings?.logo && (
              <img src={settings.logo} alt="Zoo Logo" className="w-24 h-24 object-contain mb-4 rounded-lg border" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && logoMutation.mutate(e.target.files[0])}
              className="text-sm"
            />
          </Card>

          <Card>
            <h3 className="font-semibold mb-4">Change Password</h3>
            <form onSubmit={handlePw((d) => passwordMutation.mutate(d))} className="space-y-4">
              <Input label="Current Password" type="password" error={pwErrors.currentPassword?.message as string} {...regPw('currentPassword')} />
              <Input label="New Password" type="password" error={pwErrors.newPassword?.message as string} {...regPw('newPassword')} />
              <Button type="submit" loading={passwordMutation.isPending}>Change Password</Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
