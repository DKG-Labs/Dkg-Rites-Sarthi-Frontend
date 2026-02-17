import { useNavigate } from 'react-router-dom';
import IELandingPage from '../IELandingPage';
import { useInspection } from '../../context/InspectionContext';
import { ROUTES } from '../../routes';

/**
 * Wrapper for IELandingPage - connects to router and context
 */
const LandingPageWrapper = () => {
  const navigate = useNavigate();
  const {
    setSelectedCall,
    setSelectedCalls,
    landingActiveTab,
    setLandingActiveTab,
    setInspectionShift,
    setInspectionDate,
    setProcessShift
  } = useInspection();

  const handleStartInspection = (call) => {
    setSelectedCall(call);
    setSelectedCalls([call]);
    navigate(ROUTES.INITIATION);
  };

  const handleStartMultipleInspections = (calls) => {
    setSelectedCalls(calls);
    setSelectedCall(null);
    navigate(ROUTES.MULTI_INITIATION);
  };

  const handleSetCurrentPage = (page) => {
    console.log('🎯 handleSetCurrentPage called with page:', page);

    if (page === 'ic-rawmaterial') {
      console.log('📍 Navigating to IC_RAW_MATERIAL');
      navigate(ROUTES.IC_RAW_MATERIAL);
    } else if (page === 'ic-processmaterial') {
      console.log('📍 Navigating to IC_PROCESS');
      navigate(ROUTES.IC_PROCESS);
    } else if (page === 'ic-finalproduct') {
      console.log('📍 Navigating to IC_FINAL_PRODUCT');
      navigate(ROUTES.IC_FINAL_PRODUCT);
    } else if (page === 'rm-dashboard') {
      console.log('📍 Navigating to RAW_MATERIAL dashboard');
      navigate(ROUTES.RAW_MATERIAL);
    } else if (page === 'process-dashboard') {
      console.log('📍 Navigating to PROCESS dashboard');
      navigate(ROUTES.PROCESS);
    } else if (page === 'final-dashboard') {
      console.log('📍 Navigating to FINAL_PRODUCT dashboard');
      navigate(ROUTES.FINAL_PRODUCT);
    } else {
      console.warn('⚠️ Unknown page:', page);
    }
  };

  return (
    <IELandingPage
      onStartInspection={handleStartInspection}
      onStartMultipleInspections={handleStartMultipleInspections}
      setSelectedCall={setSelectedCall}
      setContextSelectedCalls={setSelectedCalls}
      setCurrentPage={handleSetCurrentPage}
      initialTab={landingActiveTab}
      onTabChange={setLandingActiveTab}
      setInspectionShift={setInspectionShift}
      setInspectionDate={setInspectionDate}
      setProcessShift={setProcessShift}
    />
  );
};

export default LandingPageWrapper;

