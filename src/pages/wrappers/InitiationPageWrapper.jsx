import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import InspectionInitiationPage from '../InspectionInitiationPage';
import { useInspection } from '../../context/InspectionContext';
import { ROUTES } from '../../routes';

/**
 * Wrapper for InspectionInitiationPage - connects to router and context
 */
const InitiationPageWrapper = () => {
  const navigate = useNavigate();
  const {
    selectedCall,
    setProcessShift,
    setProcessSelectedLines,
    setProcessProductionLines,
    setLandingActiveTab
  } = useInspection();

  const handleProceed = useCallback((productType, shift, date) => {
    console.log('handleProceed called:', { productType, shift, date });

    // Determine route based on product type
    let route = null;
    let inspectionType = null;

    // Safe check for productType
    const type = productType || '';

    if (type === 'Raw Material') {
      route = ROUTES.RAW_MATERIAL;
      inspectionType = 'raw-material';
    } else if (type === 'ERC Process' || type.includes('Process')) {
      route = ROUTES.PROCESS;
      inspectionType = 'process';
    } else if (type === 'Final Product' || type.includes('Final')) {
      route = ROUTES.FINAL_PRODUCT;
      inspectionType = 'final-product';
    }

    if (route) {
      console.log('Navigating to:', route);
      // Save inspection type, shift, and date to sessionStorage
      if (inspectionType) {
        sessionStorage.setItem('activeInspectionType', inspectionType);
      }
      if (shift) {
        sessionStorage.setItem('inspectionShift', shift);
        // Also set processShift for grid page
        if (inspectionType === 'process') {
          sessionStorage.setItem('processShift', shift);
        }
      }
      if (date) {
        sessionStorage.setItem('inspectionDate', date);
      }
      // Force navigation using window.location for reliability
      window.location.href = route;
    } else {
      console.log('No matching product type, not navigating. ProductType was:', productType);
    }
  }, []);

  const handleBack = useCallback(() => {
    setLandingActiveTab('pending');
    navigate(ROUTES.LANDING);
  }, [navigate, setLandingActiveTab]);

  // If no call is selected, redirect to landing
  if (!selectedCall) {
    navigate(ROUTES.LANDING);
    return null;
  }

  return (
    <InspectionInitiationPage
      call={selectedCall}
      onProceed={handleProceed}
      onBack={handleBack}
      onShiftChange={setProcessShift}
      onSelectedLinesChange={setProcessSelectedLines}
      onProductionLinesChange={setProcessProductionLines}
    />
  );
};

export default InitiationPageWrapper;

