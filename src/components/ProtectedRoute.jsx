import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getStoredUser } from '../services/authService';
import { ROUTES, ROLE_LANDING_ROUTE } from '../routes';

/**
 * ProtectedRoute - Wrapper component for authentication and authorization
 * 1. Redirects to login if user is not authenticated
 * 2. Redirects to designated role-landing page if user doesn't have required role
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const user = getStoredUser();

  // 1. Check Authentication
  if (!isAuthenticated()) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // 2. Check Authorization (Roles)
  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user?.roleName)) {
      console.warn(`🛑 Unauthorized access attempt. User ${user?.userName} (Role: ${user?.roleName}) tried to access ${location.pathname}`);
      
      // Redirect unauthorized user back to their designated home/dashboard
      const fallbackTarget = ROLE_LANDING_ROUTE[user?.roleName] || ROUTES.LANDING;
      return <Navigate to={fallbackTarget} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

