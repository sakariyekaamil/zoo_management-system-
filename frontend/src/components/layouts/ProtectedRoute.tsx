import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedRoute = ({
  children,
  permission,
}: {
  children: ReactNode;
  permission: string;
}) => {
  const { isAuthenticated, isLoading, canAccess } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!canAccess(permission)) return <Navigate to="/forbidden" replace />;

  return <>{children}</>;
};
