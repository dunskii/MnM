// ===========================================
// Protected Route Component
// ===========================================

import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Array<'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT'>;
  requiredRole?: 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';
}

export default function ProtectedRoute({ children, allowedRoles, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  const rolesToCheck = allowedRoles || (requiredRole ? [requiredRole] : undefined);
  if (rolesToCheck && user && !rolesToCheck.includes(user.role)) {
    // Redirect to dashboard if user doesn't have required role
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
