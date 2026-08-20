import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProcessDashboard from '../ProcessDashboard';
import ProcessCalibrationDocumentsPage from '../ProcessCalibrationDocumentsPage';
import ProcessStaticPeriodicCheckPage from '../ProcessStaticPeriodicCheckPage';
import ProcessOilTankCounterPage from '../ProcessOilTankCounterPage';
import ProcessParametersGridPage from '../ProcessParametersGridPage';
import ProcessSummaryReportsPage from '../ProcessSummaryReportsPage';
import { useInspection } from '../../context/InspectionContext';
import { ROUTES, PROCESS_SUBMODULE_ROUTES } from '../../routes';
import { formatDate } from '../../utils/helpers';
import { getStoredUser } from '../../services/authService';

/**
 * Safe helper: reads & parses processCurrentLineData from sessionStorage.
 * Always returns the most up-to-date value at call time.
 */
const readLineDataFromSession = () => {
  try {
    const raw = sessionStorage.getItem('processCurrentLineData');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Wrapper for ProcessDashboard
 */
export const ProcessDashboardWrapper = () => {
  const { selectedCall, selectedCalls, processProductionLines, processShift, setLandingActiveTab, setSelectedCall, setSelectedCalls } = useInspection();

  const handleBack = () => {
    // Clear the selected call so the landing page doesn't auto-resume back to /process
    setSelectedCall(null);
    setSelectedCalls([]);
    setLandingActiveTab('pending');
    // Clear tab from sessionStorage so landing page restores to 'pending'
    try {
      sessionStorage.setItem('ie_landing_active_tab', 'pending');
      sessionStorage.setItem('ie_landing_force_refresh', '1');
    } catch (e) { /* ignore */ }
    // Use hard navigation so any lingering React state/context doesn't block the route
    window.location.href = '/';
  };

  const handleNavigateToSubModule = (subModule, lineData = null) => {
    // Store line data in sessionStorage for sub-modules to access
    if (lineData) {
      try {
        // Inject shift into lineData so submodules have it
        const enrichedLineData = { ...lineData, shift: processShift };
        sessionStorage.setItem('processCurrentLineData', JSON.stringify(enrichedLineData));
      } catch (e) {
        console.warn('Could not serialize full lineData to sessionStorage, storing compact lineData:', e);
        try {
          const compactLineData = {
            selectedLine: lineData.selectedLine,
            productionLines: lineData.productionLines,
            mapping: lineData.mapping,
            lotNumbers: lineData.lotNumbers,
            shift: processShift
          };
          sessionStorage.setItem('processCurrentLineData', JSON.stringify(compactLineData));
        } catch (err) {
          console.error('Failed to store compact lineData:', err);
        }
      }
    }
    const route = PROCESS_SUBMODULE_ROUTES[subModule];
    if (route) {
      window.location.href = route;
    }
  };

  // Build availableCalls from selectedCalls for dropdown with full PO data
  const availableCalls = selectedCalls.map(call => ({
    call_no: call.call_no,
    po_no: call.po_no,
    po_date: call.po_date,
    vendor_name: call.vendor_name,
    place_of_inspection: call.place_of_inspection,
    rawMaterialICs: (() => {
      if (!call.rm_heat_tc_mapping) return '';
      const uniqueIcs = new Set();
      return call.rm_heat_tc_mapping
        .map(m => {
          if (!m.subPoNumber) return null;
          const formattedDate = m.subPoDate ? formatDate(m.subPoDate).replace(/-/g, '/') : '';
          const combined = formattedDate && formattedDate !== '-' && formattedDate !== 'Invalid Date'
            ? `${m.subPoNumber} dated ${formattedDate}`
            : m.subPoNumber;
          if (uniqueIcs.has(combined)) return null;
          uniqueIcs.add(combined);
          return combined;
        })
        .filter(Boolean)
        .join(', ');
    })() || '',
    productType: call.product_type || 'ERC Process',
    // Additional fields for PO formatting
    poSerialNo: call.po_serial_no || call.serial_no || '',
    rlyShortName: call.rly_short_name || call.rly_cd || '',
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
      shift={processShift}
    />
  );
};

/**
 * Wrapper for ProcessCalibrationDocumentsPage
 */
export const ProcessCalibrationWrapper = () => {
  const navigate = useNavigate();
  const { selectedCall, processSelectedLines } = useInspection();

  const [lineData, setLineData] = useState(() => readLineDataFromSession());

  useEffect(() => {
    const fresh = readLineDataFromSession();
    if (fresh) setLineData(fresh);
  }, []);

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
    if (route) window.location.href = route;
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
      vendorCode={selectedCall?.createdBy || ''}
      vendorName={selectedCall?.vendor_name || selectedCall?.company_name || ''}
    />
  );
};

/**
 * Wrapper for ProcessStaticPeriodicCheckPage
 */
export const ProcessStaticCheckWrapper = () => {
  const navigate = useNavigate();
  const { selectedCall, processSelectedLines } = useInspection();

  const [lineData, setLineData] = useState(() => readLineDataFromSession());

  useEffect(() => {
    const fresh = readLineDataFromSession();
    if (fresh) setLineData(fresh);
  }, []);

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
    if (route) window.location.href = route;
  };

  const lotNumbers = lineData?.lotNumbers || [];

  return (
    <ProcessStaticPeriodicCheckPage
      call={selectedCall}
      onBack={handleBack}
      selectedLines={allLines}
      lotNumbers={lotNumbers}
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

  const [lineData, setLineData] = useState(() => readLineDataFromSession());

  useEffect(() => {
    const fresh = readLineDataFromSession();
    if (fresh) setLineData(fresh);
  }, []);

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
    if (route) window.location.href = route;
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

  // Use state to hold lineData so React always sees the latest sessionStorage value on mount.
  const [lineData, setLineData] = useState(() => readLineDataFromSession());

  useEffect(() => {
    const fresh = readLineDataFromSession();
    if (fresh) {
      setLineData(fresh);
    }
  }, []);

  // Get all production lines and their call options
  const productionLines = lineData?.productionLines || [];
  const allCallOptions = lineData?.allCallOptions || [];

  // Safe helper to get cached initiation data if not directly provided in lineData
  const callInitiationDataCache = useMemo(() => {
    if (lineData?.callInitiationDataCache && Object.keys(lineData.callInitiationDataCache).length > 0) {
      return lineData.callInitiationDataCache;
    }
    try {
      const user = getStoredUser();
      const userPrefix = user?.employeeCode ? `${user.employeeCode}_` : (user?.userId ? `${user.userId}_` : '');
      const callNoForScoping = selectedCall?.call_no;
      const cacheKey = callNoForScoping ? `processCallInitiationDataCache_${userPrefix}${callNoForScoping}_${processShift}` : `processCallInitiationDataCache_${userPrefix}`;
      const legacyCacheKey = callNoForScoping ? `processCallInitiationDataCache_${callNoForScoping}_${processShift}` : 'processCallInitiationDataCache';
      const saved = localStorage.getItem(cacheKey) || sessionStorage.getItem(cacheKey) || localStorage.getItem(legacyCacheKey) || sessionStorage.getItem(legacyCacheKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading fallback callInitiationDataCache:', e);
    }
    return {};
  }, [lineData, selectedCall, processShift]);

  const selectedLine = lineData?.selectedLine || (processSelectedLines && processSelectedLines[0]) || 'Line-1';

  // Build all lines array from production lines
  const allLines = productionLines.length > 0
    ? productionLines.map((_, idx) => `Line-${idx + 1}`)
    : [selectedLine];

  const handleBack = () => navigate(ROUTES.PROCESS);
  const handleNavigateSubmodule = (subModule) => {
    const route = PROCESS_SUBMODULE_ROUTES[subModule];
    if (route) window.location.href = route;
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
      initialLine={selectedLine}
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

  const [lineData, setLineData] = useState(() => readLineDataFromSession());

  useEffect(() => {
    const fresh = readLineDataFromSession();
    if (fresh) setLineData(fresh);
  }, []);

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
    if (route) window.location.href = route;
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


