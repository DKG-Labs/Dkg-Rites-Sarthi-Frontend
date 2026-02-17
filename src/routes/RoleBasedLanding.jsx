import { Navigate } from 'react-router-dom';
import { ROLE_LANDING_ROUTE, ROUTES } from './routes';

const RoleBasedLanding = () => {
  const roleName = localStorage.getItem('roleName');

  const redirectPath =
    ROLE_LANDING_ROUTE[roleName] || ROUTES.LANDING;

  return <Navigate to={redirectPath} replace />;
};

export default RoleBasedLanding;
