import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { InspectionProvider } from './context/InspectionContext';
import { ROUTES } from './routes';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import { getStoredUser } from './services/authService';

// Page Wrappers
import LandingPageWrapper from './pages/wrappers/LandingPageWrapper';
import InitiationPageWrapper from './pages/wrappers/InitiationPageWrapper';

import { ROLE_LANDING_ROUTE } from './routes';
import {
  RawMaterialDashboardWrapper,
  CalibrationDocumentsWrapper,
  VisualInspectionWrapper,
  DimensionalCheckWrapper,
  MaterialTestingWrapper,
  PackingStorageWrapper,
  SummaryReportsWrapper,
} from './pages/wrappers/RawMaterialWrappers';
import {
  ProcessDashboardWrapper,
  ProcessCalibrationWrapper,
  ProcessStaticCheckWrapper,
  ProcessOilTankWrapper,
  ProcessParametersWrapper,
  ProcessSummaryWrapper,
} from './pages/wrappers/ProcessWrappers';
import {
  FinalProductDashboardWrapper,
  FinalCalibrationWrapper,
  FinalVisualDimensionalWrapper,
  FinalChemicalWrapper,
  FinalHardnessWrapper,
  FinalInclusionWrapper,
  FinalDeflectionWrapper,
  FinalToeLoadWrapper,
  FinalWeightWrapper,
  FinalReportsWrapper,
} from './pages/wrappers/FinalProductWrappers';
import {
  MultiInitiationWrapper,
  RawMaterialCertificateWrapper,
  ProcessMaterialCertificateWrapper,
  FinalProductCertificateWrapper,
} from './pages/wrappers/OtherWrappers';
import { CMDashboardWrapper } from './pages/wrappers/CMWrappers';
import { CallDeskDashboardWrapper } from './pages/wrappers/CallDeskWrapper';
import { FinanceDashboardWrapper } from './pages/wrappers/FinanceWrapper';
import { RailwayBoardDashboardWrapper } from './pages/wrappers/RailwayBoardWrapper';
import { AdminDashboardWrapper } from './pages/wrappers/AdminDashboardWrapper';
import { SmsDashboardWrapper } from './pages/wrappers/SmsWrapper';
import AnnexurePage from './pages/AnnexurePage';
import { useNavigate } from 'react-router-dom';
import ProfileDashboard from './pages/UserProfile/ProfileDashboard';
/**
 * Role-based redirect component
 */
// const RoleBasedRedirect = () => {
//   const currentUser = getStoredUser();

//   if (currentUser?.roleName === 'CM') {
//     return <Navigate to={ROUTES.CM_DASHBOARD} replace />;
//   } else if (currentUser?.roleName === 'CALL_DESK') {
//     return <Navigate to={ROUTES.CALL_DESK} replace />;
//   } else if (currentUser?.roleName === 'Finance') {
//     return <Navigate to={ROUTES.FINANCE} replace />;
//   } else {
//     return <Navigate to={ROUTES.LANDING} replace />;
//   }
// };




const RoleBasedRedirect = () => {
  const user = getStoredUser();
  const roleName = user?.roleName;

  // Handle external redirection for sub-apps
  if (isSleeperRole(roleName)) {
    window.location.href = '/sleeper/';
    return null;
  }

  // Handle internal SMS redirect
  if (isSmsRole(roleName)) {
    return <Navigate to="/sms" replace />;
  }

  if (isRailpadRole(roleName)) {
    // If we are already on the railpad path, don't redirect to avoid loops.
    // The server proxy should handle this, but if the main app loads, we stay silent.
    if (window.location.pathname.startsWith('/railpad')) {
      return null;
    }
    window.location.href = '/railpad/';
    return null;
  }

  let target = ROUTES.LOGIN;
  const roles = typeof roleName === 'string' ? roleName.split(',').map(r => r.trim()) : [roleName];
  
  for (const r of roles) {
    if (ROLE_LANDING_ROUTE[r]) {
      target = ROLE_LANDING_ROUTE[r];
      break;
    }
  }
  
  return <Navigate to={target} replace />;
};

/**
 * Role-based Landing Page Guard
 * Redirects non-IE users to their respective dashboards
 */
// const LandingPageGuard = () => {
//   const currentUser = getStoredUser();

//   // Redirect Finance, CM, and Call Desk users to their dashboards
//   if (currentUser?.roleName === 'Finance') {
//     return <Navigate to={ROUTES.FINANCE} replace />;
//   } else if (currentUser?.roleName === 'CM') {
//     return <Navigate to={ROUTES.CM_DASHBOARD} replace />;
//   } else if (currentUser?.roleName === 'CALL_DESK') {
//     return <Navigate to={ROUTES.CALL_DESK} replace />;
//   }

//   // IE users can access Landing Page
//   return <LandingPageWrapper />;
// };

const LandingPageGuard = () => {
  const user = getStoredUser();
  const roleName = user?.roleName;

  // Handle external redirection for sub-apps
  if (isSleeperRole(roleName)) {
    window.location.href = '/sleeper/';
    return null;
  }

  // Handle internal SMS redirect
  if (isSmsRole(roleName)) {
    return <Navigate to="/sms" replace />;
  }

  if (isRailpadRole(roleName)) {
    // If we are already on the railpad path, don't redirect to avoid loops.
    if (window.location.pathname.startsWith('/railpad')) {
      return null;
    }
    window.location.href = '/railpad/';
    return null;
  }

  const ieRoles = ['IE', 'Process IE'];
  const userRoles = typeof roleName === 'string' ? roleName.split(',').map(r => r.trim()) : [roleName];
  
  const isIe = userRoles.some(r => ieRoles.includes(r));
  if (!isIe) {
    let target = ROUTES.LOGIN;
    for (const r of userRoles) {
      if (ROLE_LANDING_ROUTE[r]) {
        target = ROLE_LANDING_ROUTE[r];
        break;
      }
    }
    return <Navigate to={target} replace />;
  }

  return <LandingPageWrapper />;
};

// Wrapper for AnnexurePage to provide onBack logic
const AnnexureRouteWrapper = () => {
  const navigate = useNavigate();
  return <AnnexurePage onBack={() => navigate(ROUTES.LANDING)} />;
};

/**
 * Main App Component with React Router
 * Uses BrowserRouter for URL-based navigation that persists on refresh
 */
const App = () => {
  return (
    <BrowserRouter>
      <InspectionProvider>
        <Routes>
          {/* Login Route - Public */}
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />

          {/* Protected Routes with Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Landing Page - with role-based guard (Guard handles IE/Process IE only) */}
            <Route path={ROUTES.LANDING} element={<LandingPageGuard />} />

            {/* Profile Route - Available to all authenticated users */}
            <Route path={ROUTES.PROFILE} element={<ProfileDashboard />} />

            {/* IE & Process IE Restricted Routes */}
            <Route element={<ProtectedRoute allowedRoles={['IE', 'Process IE']} />}>
              {/* Inspection Initiation */}
              <Route path={ROUTES.INITIATION} element={<InitiationPageWrapper />} />
              <Route path={ROUTES.MULTI_INITIATION} element={<MultiInitiationWrapper />} />

              {/* Raw Material Routes */}
              <Route path={ROUTES.RAW_MATERIAL} element={<RawMaterialDashboardWrapper />} />
              <Route path={ROUTES.RAW_MATERIAL_CALIBRATION} element={<CalibrationDocumentsWrapper />} />
              <Route path={ROUTES.RAW_MATERIAL_VISUAL} element={<VisualInspectionWrapper />} />
              <Route path={ROUTES.RAW_MATERIAL_DIMENSIONAL} element={<DimensionalCheckWrapper />} />
              <Route path={ROUTES.RAW_MATERIAL_TESTING} element={<MaterialTestingWrapper />} />
              <Route path={ROUTES.RAW_MATERIAL_PACKING} element={<PackingStorageWrapper />} />
              <Route path={ROUTES.RAW_MATERIAL_SUMMARY} element={<SummaryReportsWrapper />} />

              {/* Process Routes */}
              <Route path={ROUTES.PROCESS} element={<ProcessDashboardWrapper />} />
              <Route path={ROUTES.PROCESS_CALIBRATION} element={<ProcessCalibrationWrapper />} />
              <Route path={ROUTES.PROCESS_STATIC_CHECK} element={<ProcessStaticCheckWrapper />} />
              <Route path={ROUTES.PROCESS_OIL_TANK} element={<ProcessOilTankWrapper />} />
              <Route path={ROUTES.PROCESS_PARAMETERS} element={<ProcessParametersWrapper />} />
              <Route path={ROUTES.PROCESS_SUMMARY} element={<ProcessSummaryWrapper />} />

              {/* Final Product Routes */}
              <Route path={ROUTES.FINAL_PRODUCT} element={<FinalProductDashboardWrapper />} />
              <Route path={ROUTES.FINAL_CALIBRATION} element={<FinalCalibrationWrapper />} />
              <Route path={ROUTES.FINAL_VISUAL_DIMENSIONAL} element={<FinalVisualDimensionalWrapper />} />
              <Route path={ROUTES.FINAL_CHEMICAL} element={<FinalChemicalWrapper />} />
              <Route path={ROUTES.FINAL_HARDNESS} element={<FinalHardnessWrapper />} />
              <Route path={ROUTES.FINAL_INCLUSION} element={<FinalInclusionWrapper />} />
              <Route path={ROUTES.FINAL_DEFLECTION} element={<FinalDeflectionWrapper />} />
              <Route path={ROUTES.FINAL_TOE_LOAD} element={<FinalToeLoadWrapper />} />
              <Route path={ROUTES.FINAL_WEIGHT} element={<FinalWeightWrapper />} />
              <Route path={ROUTES.FINAL_REPORTS} element={<FinalReportsWrapper />} />

              {/* IC (Inspection Certificate) Routes */}
              <Route path={ROUTES.IC_RAW_MATERIAL} element={<RawMaterialCertificateWrapper />} />
              <Route path={ROUTES.IC_PROCESS} element={<ProcessMaterialCertificateWrapper />} />
              <Route path={ROUTES.IC_FINAL_PRODUCT} element={<FinalProductCertificateWrapper />} />

              {/* Annexures Route */}
              <Route path={ROUTES.ANNEXURES} element={<AnnexureRouteWrapper />} />
            </Route>

            {/* Role-Specific Dashboards */}
            <Route
              path={ROUTES.CM_DASHBOARD}
              element={
                <ProtectedRoute allowedRoles={['CM', 'Control Manager', 'Controlling Manager', 'Rites Admin', 'Rites ADMin', 'SBU Head']}>
                  <CMDashboardWrapper />
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.CALL_DESK}
              element={
                <ProtectedRoute allowedRoles={['CALL_DESK', 'RIO Help Desk']}>
                  <CallDeskDashboardWrapper />
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.FINANCE}
              element={
                <ProtectedRoute allowedRoles={['Finance']}>
                  <FinanceDashboardWrapper />
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.RAILWAY_BOARD_DASHBOARD}
              element={
                <ProtectedRoute allowedRoles={['RAILWAY_BOARD', 'Rites Admin', 'Rites ADMin', 'ZONAL RAILWAY', 'Zonal Railway']}>
                  <RailwayBoardDashboardWrapper />
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.RITES_ADMIN_DASHBOARD}
              element={
                <ProtectedRoute allowedRoles={['Rites Admin', 'Rites ADMin']}>
                  <RailwayBoardDashboardWrapper />
                </ProtectedRoute>
              }
            />

            <Route
              path="/rites admin"
              element={
                <ProtectedRoute allowedRoles={['Rites Admin', 'Rites ADMin']}>
                  <RailwayBoardDashboardWrapper />
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.ADMIN_DASHBOARD}
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'Admin']}>
                  <AdminDashboardWrapper />
                </ProtectedRoute>
              }
            />

            {/* SMS Module Route */}
            <Route 
              path="/sms/*"
              element={
                <ProtectedRoute allowedRoles={['Rail SMS']}>
                  <SmsDashboardWrapper />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all redirect - role-based */}
          <Route path="*" element={<RoleBasedRedirect />} />
        </Routes>
      </InspectionProvider>
    </BrowserRouter>
  );
};

/**
 * Helper to identify if a role belongs to the Sleeper Dashboard
 * Added at the bottom for better code readability as requested
 */
const isSleeperRole = (role) => {
  if (!role) return false;
  // If it's a Rail-related role, it belongs to Railpad, not Sleeper
  if (typeof role === 'string' && role.includes('Rail')) return false;

  const sleeperRoles = ['Sleeper Process IE', 'Main IE'];
  return sleeperRoles.some(r =>
    role === r || (typeof role === 'string' && role.includes(r))
  );
};

/**
 * Helper to identify if a role belongs to the Railpad Dashboard
 */
const isRailpadRole = (role) => {
  if (!role) return false;
  const railpadRoles = ['Railpad IE', 'Rail Process IE', 'Rail Main IE'];
  return railpadRoles.some(r =>
    role === r || (typeof role === 'string' && role.includes(r))
  );
};

/**
 * Helper to identify if a role belongs to the SMS Dashboard
 */
const isSmsRole = (role) => {
  if (!role) return false;
  return role === 'Rail SMS' || (typeof role === 'string' && role.includes('Rail SMS'));
};

export default App;