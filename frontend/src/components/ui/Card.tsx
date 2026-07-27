import { ReactNode } from 'react';
import { cn } from '../../utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export const Card = ({ children, className, padding = true }: CardProps) => (
  <div
    className={cn(
      'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800',
      'shadow-sm',
      padding && 'p-6',
      className
    )}
  >
    {children}
  </div>
);

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  color?: string;
}

export const StatCard = ({ title, value, icon, trend, color = 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' }: StatCardProps) => (
  <Card className="flex items-start justify-between">
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      {trend && <p className="text-xs text-gray-400 mt-1">{trend}</p>}
    </div>
    <div className={cn('p-3 rounded-xl', color)}>{icon}</div>
  </Card>
);
