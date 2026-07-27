import { useQuery } from '@tanstack/react-query';
import {
  HeartIcon, UserGroupIcon, TicketIcon, CurrencyDollarIcon,
  CubeIcon, UsersIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { dashboardApi } from '../services/resources';
import { StatCard } from '../components/ui/Card';
import { Card } from '../components/ui/Card';
import { PageHeader, LoadingSkeleton } from '../components/ui/Common';
import { formatCurrency } from '../utils';
import { DashboardStats, DashboardCharts } from '../types';

const COLORS = ['#16a34a', '#84cc16', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export const DashboardPage = () => {
  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
  });

  const { data: chartsRes, isLoading: chartsLoading } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: () => dashboardApi.getCharts(),
  });

  const stats = statsRes?.data?.data as DashboardStats | undefined;
  const charts = chartsRes?.data?.data as DashboardCharts | undefined;

  if (statsLoading) return <LoadingSkeleton rows={8} />;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of WARRAN-CADDE Zoo operations"
      />

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div variants={item}>
          <StatCard title="Total Animals" value={stats?.totalAnimals ?? 0} icon={<HeartIcon className="w-6 h-6" />} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Healthy Animals" value={stats?.healthyAnimals ?? 0} icon={<HeartIcon className="w-6 h-6" />} color="bg-green-100 dark:bg-green-900/30 text-green-700" />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Sick Animals" value={stats?.sickAnimals ?? 0} icon={<ExclamationTriangleIcon className="w-6 h-6" />} color="bg-red-100 dark:bg-red-900/30 text-red-700" />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Employees" value={stats?.employees ?? 0} icon={<UsersIcon className="w-6 h-6" />} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Visitors Today" value={stats?.visitorsToday ?? 0} icon={<UserGroupIcon className="w-6 h-6" />} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Tickets Sold Today" value={stats?.ticketsSoldToday ?? 0} icon={<TicketIcon className="w-6 h-6" />} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Today's Revenue" value={formatCurrency(stats?.todayRevenue ?? 0)} icon={<CurrencyDollarIcon className="w-6 h-6" />} color="bg-lime-100 dark:bg-lime-900/30 text-lime-700" />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Monthly Revenue" value={formatCurrency(stats?.monthlyRevenue ?? 0)} icon={<CurrencyDollarIcon className="w-6 h-6" />} color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700" />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Food Inventory" value={stats?.foodInventory ?? 0} icon={<CubeIcon className="w-6 h-6" />} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Low Stock Foods" value={stats?.lowStockFoods ?? 0} icon={<ExclamationTriangleIcon className="w-6 h-6" />} color="bg-orange-100 dark:bg-orange-900/30 text-orange-700" />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Total Expenses" value={formatCurrency(stats?.totalExpenses ?? 0)} icon={<CurrencyDollarIcon className="w-6 h-6" />} />
        </motion.div>
      </motion.div>

      {!chartsLoading && charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-semibold mb-4">Monthly Visitors</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={charts.monthlyVisitors}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="visitors" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="font-semibold mb-4">Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={charts.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Line type="monotone" dataKey="revenue" stroke="#84cc16" strokeWidth={2} dot={{ fill: '#84cc16' }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="font-semibold mb-4">Animal Categories</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={charts.animalCategories} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {charts.animalCategories.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="font-semibold mb-4">Animal Health</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={charts.animalHealth}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="font-semibold mb-4">Food Consumption</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={charts.foodConsumption} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#4ade80" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="font-semibold mb-4">Ticket Sales</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={charts.ticketSales} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label>
                  {charts.ticketSales.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
};
