import { useNavigate } from 'react-router-dom';
import MultiTabInspectionInitiationPage from '../MultiTabInspectionInitiationPage';
import RawMaterialCertificate from '../../IC/erc/rawmaterial';
import ProcessMaterialCertificate from '../../IC/erc/ProcessMaterial';
import FinalProductCertificate from '../../IC/erc/FinalProduct';
import { useInspection } from '../../context/InspectionContext';
import { ROUTES } from '../../routes';

/**
 * Wrapper for MultiTabInspectionInitiationPage
 */
export const MultiInitiationWrapper = () => {
  const navigate = useNavigate();
  const {
    selectedCalls,
    setSelectedCall,
    setActiveInspectionType,
    setInspectionShift,
    setProcessShift,
    setInspectionDate,
    setLandingActiveTab
  } = useInspection();

  const handleProceed = (productType, shift, date) => {
    // Set the first call as selectedCall for display purposes
    if (selectedCalls && selectedCalls.length > 0) {
      setSelectedCall(selectedCalls[0]);
    }

    // Save inspection shift and date
    if (shift) {
      setInspectionShift(shift);
      sessionStorage.setItem('inspectionShift', shift);

      // Also set processShift for grid page
      if (productType === 'ERC Process' || productType.includes('Process')) {
        setProcessShift(shift);
        sessionStorage.setItem('processShift', shift);
      }
    }
    if (date) {
      setInspectionDate(date);
      sessionStorage.setItem('inspectionDate', date);
    }

    if (productType === 'Raw Material') {
      setActiveInspectionType('raw-material');
      navigate(ROUTES.RAW_MATERIAL);
    } else if (productType === 'ERC Process' || productType.includes('Process')) {
      setActiveInspectionType('process');
      navigate(ROUTES.PROCESS);
    } else if (productType === 'Final Product' || productType.includes('Final')) {
      setActiveInspectionType('final-product');
      navigate(ROUTES.FINAL_PRODUCT);
    }
  };

  const handleBack = () => {
    setLandingActiveTab('pending');
    navigate(ROUTES.LANDING);
  };

  // If no calls selected, redirect to landing
  if (!selectedCalls || selectedCalls.length === 0) {
    navigate(ROUTES.LANDING);
    return null;
  }

  return (
    <MultiTabInspectionInitiationPage
      calls={selectedCalls}
      onProceed={handleProceed}
      onBack={handleBack}
    />
  );
};

/**
 * Wrapper for RawMaterialCertificate (IC)
 */
export const RawMaterialCertificateWrapper = () => {
  const navigate = useNavigate();
  const { selectedCall, setLandingActiveTab } = useInspection();

  const handleBack = () => {
    setLandingActiveTab('certificates');
    navigate(ROUTES.LANDING);
  };

  // If no call selected, redirect to landing
  if (!selectedCall) {
    navigate(ROUTES.LANDING);
    return null;
  }

  return (
    <RawMaterialCertificate
      call={selectedCall}
      onBack={handleBack}
    />
  );
};

/**
 * Wrapper for ProcessMaterialCertificate (IC)
 */
export const ProcessMaterialCertificateWrapper = () => {
  const navigate = useNavigate();
  const { selectedCall, setLandingActiveTab } = useInspection();

  const handleBack = () => {
    setLandingActiveTab('certificates');
    navigate(ROUTES.LANDING);
  };

  // If no call selected, redirect to landing
  if (!selectedCall) {
    navigate(ROUTES.LANDING);
    return null;
  }

  return (
    <ProcessMaterialCertificate
      call={selectedCall}
      onBack={handleBack}
    />
  );
};

/**
 * Wrapper for FinalProductCertificate (IC)
 */
export const FinalProductCertificateWrapper = () => {
  const navigate = useNavigate();
  const { selectedCall, setLandingActiveTab } = useInspection();

  const handleBack = () => {
    setLandingActiveTab('certificates');
    navigate(ROUTES.LANDING);
  };

  // If no call selected, redirect to landing
  if (!selectedCall) {
    navigate(ROUTES.LANDING);
    return null;
  }

  return (
    <FinalProductCertificate
      call={selectedCall}
      onBack={handleBack}
    />
  );
};

