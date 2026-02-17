import { useNavigate } from 'react-router-dom';
import ProcessDashboard from '../ProcessDashboard';
import ProcessCalibrationDocumentsPage from '../ProcessCalibrationDocumentsPage';
import ProcessStaticPeriodicCheckPage from '../ProcessStaticPeriodicCheckPage';
import ProcessOilTankCounterPage from '../ProcessOilTankCounterPage';
import ProcessParametersGridPage from '../ProcessParametersGridPage';
import ProcessSummaryReportsPage from '../ProcessSummaryReportsPage';
import { useInspection } from '../../context/InspectionContext';
import { ROUTES, PROCESS_SUBMODULE_ROUTES } from '../../routes';

/**
 * Wrapper for ProcessDashboard
 */
export const ProcessDashboardWrapper = () => {
  const navigate = useNavigate();
  const { selectedCall, selectedCalls, processProductionLines, setLandingActiveTab } = useInspection();

  const handleBack = () => {
    // Ensure landing page shows Pending tab and forces a refresh of pending calls
    setLandingActiveTab('pending');
    try { sessionStorage.setItem('ie_landing_force_refresh', '1'); } catch (e) { /* ignore */ }
    navigate(ROUTES.LANDING);
  };

  const handleNavigateToSubModule = (subModule, lineData = null) => {
    // Store line data in sessionStorage for sub-modules to access
    if (lineData) {
      sessionStorage.setItem('processCurrentLineData', JSON.stringify(lineData));
    }
    const route = PROCESS_SUBMODULE_ROUTES[subModule];
    if (route) {
      navigate(route);
    }
  };

  // Build availableCalls from selectedCalls for dropdown with full PO data
  const availableCalls = selectedCalls.map(call => ({
    call_no: call.call_no,
    po_no: call.po_no,
    po_date: call.po_date,
    vendor_name: call.vendor_name,
    place_of_inspection: call.place_of_inspection,
    rawMaterialICs: call.rm_heat_tc_mapping?.map(m => m.subPoNumber).filter(Boolean).join(', ') || '',
    productType: call.product_type || 'ERC Process',
    // Additional fields for Inspection Details
    contractor: call.contractor || call.vendor_name || '',
    manufacturer: call.manufacturer || call.vendor_name || '',
    sub_po_no: call.sub_po_no || '',
    sub_po_date: call.sub_po_date || call.po_date,
    // Lot and Heat data from rm_heat_tc_mapping
    rm_heat_tc_mapping: call.rm_heat_tc_mapping || []
  }));

  return (
    <ProcessDashboard
      call={selectedCall}
      onBack={handleBack}
      onNavigateToSubModule={handleNavigateToSubModule}
      productionLines={processProductionLines}
      availableCalls={availableCalls}
    />
  );
};

/**
 * Wrapper for ProcessCalibrationDocumentsPage
 */
export const ProcessCalibrationWrapper = () => {
  const navigate = useNavigate();
  const { selectedCall, processSelectedLines } = useInspection();

  // Get line data from sessionStorage (passed from ProcessDashboard)
  const storedLineData = sessionStorage.getItem('processCurrentLineData');
  const lineData = storedLineData ? JSON.parse(storedLineData) : null;

  // Get all production lines and their call options
  const productionLines = lineData?.productionLines || [];
  const allCallOptions = lineData?.allCallOptions || [];
  const selectedLine = lineData?.selectedLine || (processSelectedLines && processSelectedLines[0]) || 'Line-1';

  // Build all lines array from production lines
  const allLines = productionLines.length > 0
    ? productionLines.map((_, idx) => `Line-${idx + 1}`)
    : [selectedLine];

  const handleBack = () => navigate(ROUTES.PROCESS);
  const handleNavigateSubmodule = (subModule) => {
    const route = PROCESS_SUBMODULE_ROUTES[subModule];
    if (route) navigate(route);
  };

  return (
    <ProcessCalibrationDocumentsPage
      call={selectedCall}
      onBack={handleBack}
      selectedLines={allLines}
      onNavigateSubmodule={handleNavigateSubmodule}
      lineData={lineData}
      productionLines={productionLines}
      allCallOptions={allCallOptions}
      mapping={lineData?.mapping}
    />
  );
};

/**
 * Wrapper for ProcessStaticPeriodicCheckPage
 */
export const ProcessStaticCheckWrapper = () => {
  const navigate = useNavigate();
  const { selectedCall, processSelectedLines } = useInspection();

  // Get line data from sessionStorage (passed from ProcessDashboard)
  const storedLineData = sessionStorage.getItem('processCurrentLineData');
  const lineData = storedLineData ? JSON.parse(storedLineData) : null;

  // Get all production lines and their call options
  const productionLines = lineData?.productionLines || [];
  const allCallOptions = lineData?.allCallOptions || [];
  const selectedLine = lineData?.selectedLine || (processSelectedLines && processSelectedLines[0]) || 'Line-1';

  // Build all lines array from production lines
  const allLines = productionLines.length > 0
    ? productionLines.map((_, idx) => `Line-${idx + 1}`)
    : [selectedLine];

  const handleBack = () => navigate(ROUTES.PROCESS);
  const handleNavigateSubmodule = (subModule) => {
    const route = PROCESS_SUBMODULE_ROUTES[subModule];
    if (route) navigate(route);
  };

  return (
    <ProcessStaticPeriodicCheckPage
      call={selectedCall}
      onBack={handleBack}
      selectedLines={allLines}
      onNavigateSubmodule={handleNavigateSubmodule}
      lineData={lineData}
      productionLines={productionLines}
      allCallOptions={allCallOptions}
      mapping={lineData?.mapping}
    />
  );
};

/**
 * Wrapper for ProcessOilTankCounterPage
 */
export const ProcessOilTankWrapper = () => {
  const navigate = useNavigate();
  const { selectedCall, processSelectedLines } = useInspection();

  // Get line data from sessionStorage (passed from ProcessDashboard)
  const storedLineData = sessionStorage.getItem('processCurrentLineData');
  const lineData = storedLineData ? JSON.parse(storedLineData) : null;

  // Get all production lines and their call options
  const productionLines = lineData?.productionLines || [];
  const allCallOptions = lineData?.allCallOptions || [];
  const selectedLine = lineData?.selectedLine || (processSelectedLines && processSelectedLines[0]) || 'Line-1';

  // Build all lines array from production lines
  const allLines = productionLines.length > 0
    ? productionLines.map((_, idx) => `Line-${idx + 1}`)
    : [selectedLine];

  const handleBack = () => navigate(ROUTES.PROCESS);
  const handleNavigateSubmodule = (subModule) => {
    const route = PROCESS_SUBMODULE_ROUTES[subModule];
    if (route) navigate(route);
  };

  return (
    <ProcessOilTankCounterPage
      call={selectedCall}
      onBack={handleBack}
      selectedLines={allLines}
      onNavigateSubmodule={handleNavigateSubmodule}
      lineData={lineData}
      productionLines={productionLines}
      allCallOptions={allCallOptions}
      mapping={lineData?.mapping}
    />
  );
};

/**
 * Wrapper for ProcessParametersGridPage
 */
export const ProcessParametersWrapper = () => {
  const navigate = useNavigate();
  const { selectedCall, processLotNumbers, processShift, processSelectedLines } = useInspection();

  // Get line data from sessionStorage (passed from ProcessDashboard)
  const storedLineData = sessionStorage.getItem('processCurrentLineData');
  const lineData = storedLineData ? JSON.parse(storedLineData) : null;

  // Get all production lines and their call options
  const productionLines = lineData?.productionLines || [];
  const allCallOptions = lineData?.allCallOptions || [];
  const callInitiationDataCache = lineData?.callInitiationDataCache || {};
  const selectedLine = lineData?.selectedLine || (processSelectedLines && processSelectedLines[0]) || 'Line-1';

  // Build all lines array from production lines
  const allLines = productionLines.length > 0
    ? productionLines.map((_, idx) => `Line-${idx + 1}`)
    : [selectedLine];

  const handleBack = () => navigate(ROUTES.PROCESS);
  const handleNavigateSubmodule = (subModule) => {
    const route = PROCESS_SUBMODULE_ROUTES[subModule];
    if (route) navigate(route);
  };

  // Use line data from sessionStorage if available, otherwise fall back to context
  const lotNumbers = lineData?.lotNumbers || processLotNumbers || [];

  return (
    <ProcessParametersGridPage
      call={selectedCall}
      onBack={handleBack}
      lotNumbers={lotNumbers}
      shift={processShift}
      selectedLines={allLines}
      onNavigateSubmodule={handleNavigateSubmodule}
      lineData={lineData}
      productionLines={productionLines}
      allCallOptions={allCallOptions}
      callInitiationDataCache={callInitiationDataCache}
      mapping={lineData?.mapping}
    />
  );
};

/**
 * Wrapper for ProcessSummaryReportsPage
 */
export const ProcessSummaryWrapper = () => {
  const navigate = useNavigate();
  const { selectedCall, processSelectedLines } = useInspection();

  // Get line data from sessionStorage (passed from ProcessDashboard)
  const storedLineData = sessionStorage.getItem('processCurrentLineData');
  const lineData = storedLineData ? JSON.parse(storedLineData) : null;

  // Get all production lines and their call options
  const productionLines = lineData?.productionLines || [];
  const allCallOptions = lineData?.allCallOptions || [];
  const selectedLine = lineData?.selectedLine || (processSelectedLines && processSelectedLines[0]) || 'Line-1';

  // Build all lines array from production lines
  const allLines = productionLines.length > 0
    ? productionLines.map((_, idx) => `Line-${idx + 1}`)
    : [selectedLine];

  const handleBack = () => navigate(ROUTES.PROCESS);
  const handleNavigateSubmodule = (subModule) => {
    const route = PROCESS_SUBMODULE_ROUTES[subModule];
    if (route) navigate(route);
  };

  return (
    <ProcessSummaryReportsPage
      call={selectedCall}
      onBack={handleBack}
      selectedLines={allLines}
      onNavigateSubmodule={handleNavigateSubmodule}
      lineData={lineData}
      productionLines={productionLines}
      allCallOptions={allCallOptions}
      mapping={lineData?.mapping}
    />
  );
};

