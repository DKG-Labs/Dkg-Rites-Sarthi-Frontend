/* eslint-disable */
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { message } from 'antd';
import { hasPermission } from '../../utils/permissions';

// Note: Role permissions are now centralized in utils/permissions.js

// Define route to permission mapping
const ROUTE_PERMISSIONS = {
  // Duty modules and permissions
  '/sms': 'duty-sms',
  '/sms/*': 'duty-sms',
  '/stage': 'duty-rolling',
  '/stage/*': 'duty-rolling',
  '/ndt': 'duty-ndt',
  '/ndt/*': 'duty-ndt',
  '/visual': 'duty-vi',
  '/visual/*': 'duty-vi',
  '/welding': 'duty-welding',
  '/welding/*': 'duty-welding',
  '/qct': 'admin',
  '/qct/*': 'admin',
  '/testing': 'admin',
  '/testing/*': 'admin',
  '/calibration': 'admin',
  '/calibration/*': 'admin',
  '/srInspection': 'admin',
  '/srInspection/*': 'admin',
  
  // Records Routes
  '/record': 'records',
  '/record/*': 'records',
  
  // Data Analysis Routes
  '/dashboard/aiSystem': 'data-analysis',
  '/dashboard/aiSystem/*': 'data-analysis',
  
  // AI System Routes
  '/ai': 'ai-system',
  '/ai/*': 'ai-system',
  
  // Admin Routes
  '/admin': 'admin',
  '/admin/*': 'admin',
  
  // BSP Routes (typically admin)
  '/bsp': 'admin',
  '/bsp/*': 'admin'
};

const RoleBasedRoute = ({ requiredPermission, children }) => {
  const { userType, token } = useSelector(state => state.auth);
  
  // If not authenticated, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // If no userType, redirect to login
  if (!userType) {
    message.error('User role not found. Please login again.');
    return <Navigate to="/login" replace />;
  }
  
  // Main Admin has full access
  if (userType === 'MAIN_ADMIN') {
    return children ? children : <Outlet />;
  }
  
  // Check if user has required permission using centralized function
  if (!hasPermission(userType, requiredPermission)) {
    message.error('You do not have permission to access this page.');
    return <Navigate to="/" replace />;
  }
  
  return children ? children : <Outlet />;
};

// Helper function to check if user has permission for a route
export const hasRoutePermission = (userType, routePath) => {
  if (userType === 'MAIN_ADMIN') return true;
  
  // Use centralized permission checking instead
  
  // Check exact match first
  if (ROUTE_PERMISSIONS[routePath]) {
    const requiredPermission = ROUTE_PERMISSIONS[routePath];
    return hasPermission(userType, requiredPermission);
  }

  // Check wildcard matches
  for (const [route, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (route.endsWith('/*')) {
      const baseRoute = route.slice(0, -2);
      if (routePath.startsWith(baseRoute)) {
        return hasPermission(userType, permission);
      }
    }
  }
  
  return false;
};

// Helper function to get user's accessible routes
export const getUserAccessibleRoutes = (userType) => {
  if (userType === 'MAIN_ADMIN') {
    return Object.keys(ROUTE_PERMISSIONS);
  }

  const accessibleRoutes = [];

  for (const [route, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (hasPermission(userType, permission)) {
      accessibleRoutes.push(route);
    }
  }

  return accessibleRoutes;
};

export default RoleBasedRoute;
