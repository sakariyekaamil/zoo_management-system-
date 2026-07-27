import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  HomeIcon, HeartIcon, TagIcon, BuildingOfficeIcon, UsersIcon,
  ClipboardDocumentListIcon, BeakerIcon, ShieldCheckIcon, CubeIcon,
  CalendarIcon, UserGroupIcon, TicketIcon, CreditCardIcon, TruckIcon,
  ShoppingCartIcon, BanknotesIcon, UserCircleIcon, ChartBarIcon, Cog6ToothIcon,
  ArrowRightOnRectangleIcon, Bars3Icon, SunIcon, MoonIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { APP_NAME } from '../../constants';
import { cn } from '../../utils';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: HomeIcon, permission: 'dashboard' },
  { path: '/animals', label: 'Animals', icon: HeartIcon, permission: 'animals' },
  { path: '/species', label: 'Species', icon: TagIcon, permission: 'species' },
  { path: '/enclosures', label: 'Enclosures', icon: BuildingOfficeIcon, permission: 'enclosures' },
  { path: '/employees', label: 'Employees', icon: UsersIcon, permission: 'employees' },
  { path: '/assignments', label: 'Assignments', icon: ClipboardDocumentListIcon, permission: 'assignments' },
  { path: '/veterinary', label: 'Veterinary', icon: BeakerIcon, permission: 'veterinary' },
  { path: '/vaccinations', label: 'Vaccinations', icon: ShieldCheckIcon, permission: 'vaccinations' },
  { path: '/food-inventory', label: 'Food Inventory', icon: CubeIcon, permission: 'food-inventory' },
  { path: '/feeding-schedule', label: 'Feeding Schedule', icon: CalendarIcon, permission: 'feeding-schedule' },
  { path: '/visitors', label: 'Visitors', icon: UserGroupIcon, permission: 'visitors' },
  { path: '/ticket-types', label: 'Ticket Types', icon: TicketIcon, permission: 'ticket-types' },
  { path: '/tickets', label: 'Tickets', icon: TicketIcon, permission: 'tickets' },
  { path: '/payments', label: 'Payments', icon: CreditCardIcon, permission: 'payments' },
  { path: '/suppliers', label: 'Suppliers', icon: TruckIcon, permission: 'suppliers' },
  { path: '/food-purchases', label: 'Food Purchases', icon: ShoppingCartIcon, permission: 'food-purchases' },
  { path: '/expenses', label: 'Expenses', icon: BanknotesIcon, permission: 'expenses' },
  { path: '/users', label: 'Users', icon: UserCircleIcon, permission: 'users' },
  { path: '/reports', label: 'Reports', icon: ChartBarIcon, permission: 'reports' },
  { path: '/settings', label: 'Settings', icon: Cog6ToothIcon, permission: 'settings' },
];

export const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { canAccess, logout, user } = useAuth();
  const navigate = useNavigate();

  const filteredNav = navItems.filter((item) => canAccess(item.permission));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-primary-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">{APP_NAME}</h1>
            <p className="text-primary-300 text-xs">Management System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-1">
        {filteredNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-accent text-white shadow-lg'
                  : 'text-primary-200 hover:bg-primary-800 hover:text-white'
              )
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-primary-800">
        {user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-white text-sm font-medium">{user.firstName} {user.lastName}</p>
            <p className="text-primary-300 text-xs">{user.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-primary-200 hover:bg-red-600/20 hover:text-red-300 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-primary-900 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-y-0 left-0 w-64 bg-primary-900 z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <Bars3Icon className="w-6 h-6" />
        </button>

        <div className="hidden lg:block">
          <p className="text-sm text-gray-500">Welcome back,</p>
          <p className="font-semibold text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
