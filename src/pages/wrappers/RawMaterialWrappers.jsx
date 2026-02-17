import { useNavigate } from 'react-router-dom';
import RawMaterialDashboard from '../RawMaterialDashboard';
import CalibrationDocumentsPage from '../CalibrationDocumentsPage';
import VisualInspectionPage from '../VisualInspectionPage';
import RawMaterialDimensionalPage from '../RawMaterialDimensionalPage';
import MaterialTestingPage from '../MaterialTestingPage';
import PackingStoragePage from '../PackingStoragePage';
import SummaryReportsPage from '../SummaryReportsPage';
import { useInspection } from '../../context/InspectionContext';
import { ROUTES, RAW_MATERIAL_SUBMODULE_ROUTES } from '../../routes';

/**
 * Wrapper for RawMaterialDashboard
 */
export const RawMaterialDashboardWrapper = () => {
  const navigate = useNavigate();
  const { selectedCall, setRmHeats, setRmProductModel, setRmLadleValues, setLandingActiveTab } = useInspection();

  const handleBack = () => {
    setLandingActiveTab('pending');
    navigate(ROUTES.LANDING);
  };

  const handleNavigateToSubModule = (subModule) => {
    const route = RAW_MATERIAL_SUBMODULE_ROUTES[subModule];
    if (route) {
      navigate(route);
    }
  };

  return (
    <RawMaterialDashboard
      call={selectedCall}
      onBack={handleBack}
      onNavigateToSubModule={handleNavigateToSubModule}
      onHeatsChange={setRmHeats}
      onProductModelChange={setRmProductModel}
      onLadleValuesChange={setRmLadleValues}
    />
  );
};

/**
 * Wrapper for CalibrationDocumentsPage
 */
export const CalibrationDocumentsWrapper = () => {
  const navigate = useNavigate();
  const { rmHeats, rmLadleValues, selectedCall } = useInspection();

  const handleBack = () => navigate(ROUTES.RAW_MATERIAL);
  const handleNavigateSubmodule = (subModule) => {
    const route = RAW_MATERIAL_SUBMODULE_ROUTES[subModule];
    if (route) navigate(route);
  };

  return (
    <CalibrationDocumentsPage
      onBack={handleBack}
      heats={rmHeats}
      ladleValues={rmLadleValues}
      inspectionCallNo={selectedCall?.call_no || ''}
      onNavigateSubmodule={handleNavigateSubmodule}
    />
  );
};

/**
 * Wrapper for VisualInspectionPage
 */
export const VisualInspectionWrapper = () => {
  const navigate = useNavigate();
  const { rmHeats, rmProductModel, selectedCall } = useInspection();

  const handleBack = () => navigate(ROUTES.RAW_MATERIAL);
  const handleNavigateSubmodule = (subModule) => {
    const route = RAW_MATERIAL_SUBMODULE_ROUTES[subModule];
    if (route) navigate(route);
  };

  return (
    <VisualInspectionPage
      onBack={handleBack}
      heats={rmHeats}
      productModel={rmProductModel}
      inspectionCallNo={selectedCall?.call_no || ''}
      onNavigateSubmodule={handleNavigateSubmodule}
    />
  );
};

/**
 * Wrapper for RawMaterialDimensionalPage
 */
export const DimensionalCheckWrapper = () => {
  const navigate = useNavigate();
  const { rmHeats, rmProductModel, selectedCall } = useInspection();

  const handleBack = () => navigate(ROUTES.RAW_MATERIAL);
  const handleNavigateSubmodule = (subModule) => {
    const route = RAW_MATERIAL_SUBMODULE_ROUTES[subModule];
    if (route) navigate(route);
  };

  return (
    <RawMaterialDimensionalPage
      onBack={handleBack}
      heats={rmHeats}
      productModel={rmProductModel}
      inspectionCallNo={selectedCall?.call_no || ''}
      onNavigateSubmodule={handleNavigateSubmodule}
    />
  );
};

/**
 * Wrapper for MaterialTestingPage
 */
export const MaterialTestingWrapper = () => {
  const navigate = useNavigate();
  const { rmHeats, selectedCall } = useInspection();

  const handleBack = () => navigate(ROUTES.RAW_MATERIAL);
  const handleNavigateSubmodule = (subModule) => {
    const route = RAW_MATERIAL_SUBMODULE_ROUTES[subModule];
    if (route) navigate(route);
  };

  return (
    <MaterialTestingPage
      onBack={handleBack}
      heats={rmHeats}
      inspectionCallNo={selectedCall?.call_no || ''}
      onNavigateSubmodule={handleNavigateSubmodule}
    />
  );
};

/**
 * Wrapper for PackingStoragePage
 */
export const PackingStorageWrapper = () => {
  const navigate = useNavigate();
  const { rmHeats, selectedCall } = useInspection();

  const handleBack = () => navigate(ROUTES.RAW_MATERIAL);
  const handleNavigateSubmodule = (subModule) => {
    const route = RAW_MATERIAL_SUBMODULE_ROUTES[subModule];
    if (route) navigate(route);
  };

  return (
    <PackingStoragePage
      onBack={handleBack}
      heats={rmHeats}
      inspectionCallNo={selectedCall?.call_no || ''}
      onNavigateSubmodule={handleNavigateSubmodule}
    />
  );
};

/**
 * Wrapper for SummaryReportsPage
 */
export const SummaryReportsWrapper = () => {
  const navigate = useNavigate();
  const { rmHeats, selectedCall } = useInspection();

  const handleBack = () => navigate(ROUTES.RAW_MATERIAL);
  const handleNavigateSubmodule = (subModule) => {
    const route = RAW_MATERIAL_SUBMODULE_ROUTES[subModule];
    if (route) navigate(route);
  };

  return (
    <SummaryReportsPage
      onBack={handleBack}
      heats={rmHeats}
      inspectionCallNo={selectedCall?.call_no || ''}
      onNavigateSubmodule={handleNavigateSubmodule}
    />
  );
};

