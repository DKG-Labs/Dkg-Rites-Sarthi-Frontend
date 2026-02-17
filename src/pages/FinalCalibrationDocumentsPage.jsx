import { useState, useEffect } from 'react';
import { useInspection } from '../context/InspectionContext';
import CalibrationModule from '../components/CalibrationModule';
import FinalSubmoduleNav from '../components/FinalSubmoduleNav';

const FinalCalibrationDocumentsPage = ({ onBack, onNavigateSubmodule }) => {
  const { selectedCall } = useInspection();

  // Get the call number - use selectedCall or fallback to sessionStorage
  const callNo = selectedCall?.call_no || sessionStorage.getItem('selectedCallNo');

  // Document verification states
  const [verifications, setVerifications] = useState(() => {
    // Try to load persisted data first
    const persistedData = localStorage.getItem(`calibrationDocumentsData_${callNo}`);

    if (persistedData) {
      try {
        return JSON.parse(persistedData);
      } catch (e) {
        console.error('Error parsing persisted calibration data:', e);
      }
    }

    // Initialize new data
    return {
      rdsoApproval: { verified: false, remarks: '', validityDate: '' },
      rawMaterialIC: { verified: false, remarks: '', icNumber: '' },
      dimensionCheck: { verified: false, remarks: '' },
      packingList: { verified: false, remarks: '' },
      rdsoGauges: { verified: false, remarks: '' }
    };
  });

  // Persist data whenever verifications change
  useEffect(() => {
    if (callNo) {
      localStorage.setItem(`calibrationDocumentsData_${callNo}`, JSON.stringify(verifications));
    }
  }, [verifications, callNo]);

  const handleVerificationChange = (field, key, value) => {
    setVerifications(prev => ({
      ...prev,
      [field]: { ...prev[field], [key]: value }
    }));
  };

  const documentFields = [
    {
      id: 'rdsoApproval',
      title: 'RDSO Approval & its Validity',
      description: 'Verify RDSO approval status and validity period',
      hasValidity: true,
      source: 'Verified (filled by Vendor before Call Request)'
    },
    {
      id: 'rawMaterialIC',
      title: 'Verification of Raw Material & Stage IC',
      description: 'As per the IC Number provided by Vendor during Call Requisition',
      hasICNumber: true,
      source: 'Verified (filled by Vendor before Call Request)'
    },
    {
      id: 'dimensionCheck',
      title: 'Verification of Internal Dimension Check Record',
      description: 'Internal dimension check records verification',
      source: 'Verified (filled by Vendor before Call Request)'
    },
    {
      id: 'packingList',
      title: 'Packing List',
      description: 'Verify packing list details',
      source: 'Verified (filled by Vendor before Call Request)'
    },
    {
      id: 'rdsoGauges',
      title: 'Availability of RDSO Approved Gauges',
      description: 'Check availability of RDSO approved measuring gauges',
      source: 'Verified (filled by Vendor before Call Request)'
    }
  ];

  const pageStyles = `
    .doc-verification-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 12px;
      transition: all 0.2s ease;
    }
    .doc-verification-card:hover {
      border-color: #0ea5e9;
      box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);
    }
    .doc-verification-card.verified {
      border-left: 4px solid #22c55e;
      background: #f0fdf4;
    }
    .doc-verification-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }
    .doc-verification-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 4px 0;
    }
    .doc-verification-desc {
      font-size: 12px;
      color: #64748b;
      margin: 0;
    }
    .doc-verification-source {
      font-size: 10px;
      color: #0ea5e9;
      background: #f0f9ff;
      padding: 4px 8px;
      border-radius: 4px;
      white-space: nowrap;
    }
    .doc-verification-fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-top: 12px;
    }
    .doc-field-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .doc-field-label {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
    }
    .doc-field-input {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 13px;
    }
    .doc-field-input:focus {
      outline: none;
      border-color: #0ea5e9;
    }
    .verification-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }
    .verification-checkbox {
      width: 20px;
      height: 20px;
      accent-color: #22c55e;
    }
    .verification-label {
      font-size: 13px;
      font-weight: 500;
      color: #1e293b;
    }
    @media (max-width: 768px) {
      .doc-verification-header {
        flex-direction: column;
      }
      .doc-verification-source {
        align-self: flex-start;
      }
      .doc-verification-fields {
        grid-template-columns: 1fr;
      }
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

      {/* Document Verification Section */}
      <div className="card" style={{ marginBottom: 'var(--space-24)' }}>
        <div className="card-header">
          <h3 className="card-title">📋 Document Verification</h3>
          <p className="card-subtitle">Verify all required documents as per vendor submission during Call Request</p>
        </div>

        {documentFields.map((field) => (
          <div
            key={field.id}
            className={`doc-verification-card ${verifications[field.id]?.verified ? 'verified' : ''}`}
          >
            <div className="doc-verification-header">
              <div>
                <h4 className="doc-verification-title">{field.title}</h4>
                <p className="doc-verification-desc">{field.description}</p>
              </div>
              <span className="doc-verification-source">{field.source}</span>
            </div>

            <div className="doc-verification-fields">
              <div className="verification-toggle">
                <input
                  type="checkbox"
                  className="verification-checkbox"
                  id={`verify-${field.id}`}
                  checked={verifications[field.id]?.verified || false}
                  onChange={(e) => handleVerificationChange(field.id, 'verified', e.target.checked)}
                />
                <label htmlFor={`verify-${field.id}`} className="verification-label">
                  {verifications[field.id]?.verified ? '✓ Verified' : 'Mark as Verified'}
                </label>
              </div>

              {field.hasValidity && (
                <div className="doc-field-group">
                  <label className="doc-field-label">Validity Date</label>
                  <input
                    type="date"
                    className="doc-field-input"
                    value={verifications[field.id]?.validityDate || ''}
                    onChange={(e) => handleVerificationChange(field.id, 'validityDate', e.target.value)}
                  />
                </div>
              )}

              {field.hasICNumber && (
                <div className="doc-field-group">
                  <label className="doc-field-label">IC Number</label>
                  <input
                    type="text"
                    className="doc-field-input"
                    placeholder="Enter IC Number"
                    value={verifications[field.id]?.icNumber || ''}
                    onChange={(e) => handleVerificationChange(field.id, 'icNumber', e.target.value)}
                  />
                </div>
              )}

              <div className="doc-field-group">
                <label className="doc-field-label">Remarks</label>
                <input
                  type="text"
                  className="doc-field-input"
                  placeholder="Enter remarks (if any)"
                  value={verifications[field.id]?.remarks || ''}
                  onChange={(e) => handleVerificationChange(field.id, 'remarks', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Instrument Calibration Section */}
      <div className="card" style={{ marginBottom: 'var(--space-24)' }}>
        <div className="card-header">
          <h3 className="card-title">🔧 Instrument Calibration Information</h3>
          <p className="card-subtitle">Calibration details of all instruments used during inspection & document verification</p>
        </div>
        <CalibrationModule />
      </div>

      {/* Action Buttons */}
      {/* <div style={{ marginTop: 'var(--space-24)', display: 'flex', gap: 'var(--space-16)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button className="btn btn-outline" onClick={onBack}>Cancel</button>
        <button className="btn btn-primary" onClick={() => { alert('Calibration & Documents verified!'); onBack(); }}>Save & Continue</button>
      </div> */}
    </div>
  );
};

export default FinalCalibrationDocumentsPage;

