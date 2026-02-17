import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../services/authService';
import { ROUTES } from '../routes';

/**
 * ProtectedRoute - Wrapper component for authentication-protected routes
 * Redirects to login page if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  if (!isAuthenticated()) {
    // Redirect to login, preserving the intended destination
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;

