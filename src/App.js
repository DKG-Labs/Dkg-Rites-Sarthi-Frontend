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
  const target =
    ROLE_LANDING_ROUTE[user?.roleName] || ROUTES.LOGIN;

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

  // Allow IE and Process IE users to access landing page
  const ieRoles = ['IE', 'Process IE'];
  if (!ieRoles.includes(user?.roleName)) {
    return (
      <Navigate
        to={ROLE_LANDING_ROUTE[user?.roleName]}
        replace
      />
    );
  }

  return <LandingPageWrapper />;
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
            {/* Landing Page - with role-based guard */}
            <Route path={ROUTES.LANDING} element={<LandingPageGuard />} />

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

            {/* CM (Controlling Manager) Routes */}
            <Route path={ROUTES.CM_DASHBOARD} element={<CMDashboardWrapper />} />

            {/* Call Desk Routes */}
            <Route path={ROUTES.CALL_DESK} element={<CallDeskDashboardWrapper />} />

            {/* Finance Routes */}
            <Route path={ROUTES.FINANCE} element={<FinanceDashboardWrapper />} />

            {/* Railway Board Routes */}
            <Route path={ROUTES.RAILWAY_BOARD_DASHBOARD} element={<RailwayBoardDashboardWrapper />} />
          </Route>

          {/* Catch-all redirect - role-based */}
          <Route path="*" element={<RoleBasedRedirect />} />
        </Routes>
      </InspectionProvider>
    </BrowserRouter>
  );
};

export default App;