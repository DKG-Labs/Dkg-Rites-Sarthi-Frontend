import CalibrationSubModule from '../components/CalibrationSubModule';
import RawMaterialSubmoduleNav from '../components/RawMaterialSubmoduleNav';
import './CalibrationDocumentsPage.css';

const CalibrationDocumentsPage = ({ onBack, onNavigateSubmodule, inspectionCallNo = '' }) => {
  return (
    <div className="calibration-page-container">
      <div className="calibration-page-header">
        <h1 className="calibration-page-title">📄 Calibration & Documents</h1>
        <button className="calibration-back-btn" onClick={onBack}>
          ← Back to Raw Material Dashboard
        </button>
      </div>

      {/* Submodule Navigation */}
      <RawMaterialSubmoduleNav
        currentSubmodule="calibration-documents"
        onNavigate={onNavigateSubmodule}
      />

      <CalibrationSubModule
        inspectionCallNo={inspectionCallNo}
      />
    </div>
  );
};

export default CalibrationDocumentsPage;

