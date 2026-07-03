import React from 'react';
import { useInspection } from '../context/InspectionContext';
import CalibrationSubModule from '../components/CalibrationSubModule';
import FinalSubmoduleNav from '../components/FinalSubmoduleNav';

const FinalCalibrationDocumentsPage = ({ onBack, onNavigateSubmodule }) => {
  const { selectedCall } = useInspection();

  // Get the call number - use selectedCall or fallback to sessionStorage
  const callNo = selectedCall?.call_no || sessionStorage.getItem('selectedCallNo');
  // Get vendor code from the call's createdBy field
  const vendorCode = selectedCall?.createdBy || '';
  const vendorName = selectedCall?.vendor_name || selectedCall?.company_name || '';
  const poNo = selectedCall?.po_no || '';

  const pageStyles = `
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 12px;
      }
      .page-header .btn {
        width: 100%;
      }
    }
  `;

  return (
    <div>
      <style>{pageStyles}</style>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-24)' }}>
        <div>
          <h1 className="page-title">Calibration & Document Verification</h1>
          <p className="page-subtitle">Final Product Inspection - Verify instrument calibration and documents</p>
        </div>
        <button className="btn btn-outline" onClick={onBack}>
          ← Back to Final Product Dashboard
        </button>
      </div>

      {/* Submodule Navigation */}
      <FinalSubmoduleNav
        currentSubmodule="final-calibration-documents"
        onNavigate={onNavigateSubmodule}
      />

      {/* Instrument Calibration Section — Live vendor data */}
      <div className="card" style={{ marginBottom: 'var(--space-24)' }}>
        <div className="card-header">
          <h3 className="card-title">🔧 Instrument Calibration Information</h3>
          <p className="card-subtitle">Calibration details of all instruments used during inspection & document verification</p>
        </div>
        <CalibrationSubModule
          vendorCode={vendorCode}
          vendorName={vendorName}
          inspectionCallNo={callNo}
          poNo={poNo}
          moduleType="Final"
        />
      </div>


    </div>
  );
};

export default FinalCalibrationDocumentsPage;
