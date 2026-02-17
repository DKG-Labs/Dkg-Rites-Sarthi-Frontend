import { useNavigate } from 'react-router-dom';
import FinalProductDashboard from '../FinalProductDashboard';
import FinalCalibrationDocumentsPage from '../FinalCalibrationDocumentsPage';
import FinalVisualDimensionalPage from '../FinalVisualDimensionalPage';
import FinalChemicalAnalysisPage from '../FinalChemicalAnalysisPage';
import FinalHardnessTestPage from '../FinalHardnessTestPage';
import FinalInclusionRatingPage from '../FinalInclusionRatingPage';
import FinalApplicationDeflectionPage from '../FinalApplicationDeflectionPage';
import FinalToeLoadTestPage from '../FinalToeLoadTestPage';
import FinalWeightTestPage from '../FinalWeightTestPage';
import FinalReportsPage from '../FinalReportsPage';
import { useInspection } from '../../context/InspectionContext';
import { ROUTES, FINAL_PRODUCT_SUBMODULE_ROUTES } from '../../routes';

/**
 * Wrapper for FinalProductDashboard
 */
export const FinalProductDashboardWrapper = () => {
  const navigate = useNavigate();
  const { setLandingActiveTab, selectedCall } = useInspection();

  const handleBack = () => {
    setLandingActiveTab('pending');
    navigate(ROUTES.LANDING);
  };

  const handleNavigateToSubModule = (subModule) => {
    const route = FINAL_PRODUCT_SUBMODULE_ROUTES[subModule];
    if (route) {
      navigate(route);
    }
  };

  // Ensure selectedCall is available
  if (!selectedCall) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>⚠️ No inspection call selected. Please select a call from the landing page.</p>
        <button className="btn btn-secondary" onClick={handleBack}>
          Back to Landing Page
        </button>
      </div>
    );
  }

  return (
    <FinalProductDashboard
      onBack={handleBack}
      onNavigateToSubModule={handleNavigateToSubModule}
    />
  );
};

/**
 * Wrapper for FinalCalibrationDocumentsPage
 */
export const FinalCalibrationWrapper = () => {
  const navigate = useNavigate();

  const handleBack = () => navigate(ROUTES.FINAL_PRODUCT);
  const handleNavigateSubmodule = (subModule) => {
    const route = FINAL_PRODUCT_SUBMODULE_ROUTES[subModule];
    if (route) navigate(route);
  };

  return (
    <FinalCalibrationDocumentsPage
      onBack={handleBack}
      onNavigateSubmodule={handleNavigateSubmodule}
    />
  );
};

/**
 * Wrapper for FinalVisualDimensionalPage
 */
export const FinalVisualDimensionalWrapper = () => {
  const navigate = useNavigate();

  const handleBack = () => navigate(ROUTES.FINAL_PRODUCT);
  const handleNavigateSubmodule = (subModule) => {
    const route = FINAL_PRODUCT_SUBMODULE_ROUTES[subModule];
    if (route) navigate(route);
  };

  return (
    <FinalVisualDimensionalPage
      onBack={handleBack}
      onNavigateSubmodule={handleNavigateSubmodule}
    />
  );
};

/**
 * Wrapper for FinalChemicalAnalysisPage
 */
export const FinalChemicalWrapper = () => {
  const navigate = useNavigate();

  const handleBack = () => navigate(ROUTES.FINAL_PRODUCT);
  const handleNavigateSubmodule = (subModule) => {
    const route = FINAL_PRODUCT_SUBMODULE_ROUTES[subModule];
    if (route) navigate(route);
  };

  return (
    <FinalChemicalAnalysisPage
      onBack={handleBack}
      onNavigateSubmodule={handleNavigateSubmodule}
    />
  );
};

/**
 * Wrapper for FinalHardnessTestPage
 */
export const FinalHardnessWrapper = () => {
  const navigate = useNavigate();

  const handleBack = () => navigate(ROUTES.FINAL_PRODUCT);
  const handleNavigateSubmodule = (subModule) => {
    const route = FINAL_PRODUCT_SUBMODULE_ROUTES[subModule];
    if (route) navigate(route);
  };

  return (
    <FinalHardnessTestPage
      onBack={handleBack}
      onNavigateSubmodule={handleNavigateSubmodule}
    />
  );
};

/**
 * Wrapper for FinalInclusionRatingPage
 */
export const FinalInclusionWrapper = () => {
  const navigate = useNavigate();

  const handleBack = () => navigate(ROUTES.FINAL_PRODUCT);
  const handleNavigateSubmodule = (subModule) => {
    const route = FINAL_PRODUCT_SUBMODULE_ROUTES[subModule];
    if (route) navigate(route);
  };

  return (
    <FinalInclusionRatingPage
      onBack={handleBack}
      onNavigateSubmodule={handleNavigateSubmodule}
    />
  );
};

/**
 * Wrapper for FinalApplicationDeflectionPage
 */
export const FinalDeflectionWrapper = () => {
  const navigate = useNavigate();

  const handleBack = () => navigate(ROUTES.FINAL_PRODUCT);
  const handleNavigateSubmodule = (subModule) => {
    const route = FINAL_PRODUCT_SUBMODULE_ROUTES[subModule];
    if (route) navigate(route);
  };

  return (
    <FinalApplicationDeflectionPage
      onBack={handleBack}
      onNavigateSubmodule={handleNavigateSubmodule}
    />
  );
};

/**
 * Wrapper for FinalToeLoadTestPage
 */
export const FinalToeLoadWrapper = () => {
  const navigate = useNavigate();

  const handleBack = () => navigate(ROUTES.FINAL_PRODUCT);
  const handleNavigateSubmodule = (subModule) => {
    const route = FINAL_PRODUCT_SUBMODULE_ROUTES[subModule];
    if (route) navigate(route);
  };

  return (
    <FinalToeLoadTestPage
      onBack={handleBack}
      onNavigateSubmodule={handleNavigateSubmodule}
    />
  );
};

/**
 * Wrapper for FinalWeightTestPage
 */
export const FinalWeightWrapper = () => {
  const navigate = useNavigate();

  const handleBack = () => navigate(ROUTES.FINAL_PRODUCT);
  const handleNavigateSubmodule = (subModule) => {
    const route = FINAL_PRODUCT_SUBMODULE_ROUTES[subModule];
    if (route) navigate(route);
  };

  return (
    <FinalWeightTestPage
      onBack={handleBack}
      onNavigateSubmodule={handleNavigateSubmodule}
    />
  );
};

/**
 * Wrapper for FinalReportsPage
 */
export const FinalReportsWrapper = () => {
  const navigate = useNavigate();

  const handleBack = () => navigate(ROUTES.FINAL_PRODUCT);
  const handleNavigateSubmodule = (subModule) => {
    const route = FINAL_PRODUCT_SUBMODULE_ROUTES[subModule];
    if (route) navigate(route);
  };

  return (
    <FinalReportsPage
      onBack={handleBack}
      onNavigateSubmodule={handleNavigateSubmodule}
    />
  );
};

