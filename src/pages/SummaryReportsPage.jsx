import { useState } from 'react';
import RawMaterialSubmoduleNav from '../components/RawMaterialSubmoduleNav';
import HeatToggle from '../components/HeatToggle';
import './SummaryReportsPage.css';

const SummaryReportsPage = ({ onBack, heats = [], onNavigateSubmodule }) => {
  const [activeHeatIndex, setActiveHeatIndex] = useState(0);

  return (
    <div className="summary-page-container">
      <div className="summary-page-header">
        <h1 className="summary-page-title">📊 Summary and Reports</h1>
        <button className="summary-back-btn" onClick={onBack}>
          ← Back to Raw Material Dashboard
        </button>
      </div>

      {/* Submodule Navigation */}
      <RawMaterialSubmoduleNav
        currentSubmodule="summary-reports"
        onNavigate={onNavigateSubmodule}
      />

      {/* Heat Toggle */}
      <HeatToggle
        heats={heats}
        activeHeatIndex={activeHeatIndex}
        onHeatChange={setActiveHeatIndex}
      />

      <div className="card">
        {/* Commented out hardcoded summary as per user request
        <div className="card-header">
          <h3 className="card-title">Raw Material Inspection Summary - Auto-Compiled</h3>
          <p className="card-subtitle">Consolidated results from all RM inspection modules</p>
        </div>
        <div className="alert alert-success">
          ✓ Raw Material inspection completed successfully
        </div>
        <div className="summary-section">
          <h4 className="summary-section-title">Calibration Module Results:</h4>
          <p>All instruments calibrated and valid. 1 instrument expiring soon (Dimensional Gauge - Nov 10)</p>
        </div>
        <div className="summary-section">
          <h4 className="summary-section-title">Visual &amp; Dimensional Check Results:</h4>
          <p><strong>Samples Inspected:</strong> 20 samples per heat</p>
          <p><strong>Defects Found:</strong> 2 minor defects (Kink, Pit)</p>
          <p><strong>Dimensional Measurements:</strong> All within tolerance</p>
        </div>
        <div className="summary-section">
          <h4 className="summary-section-title">Material Testing Results:</h4>
          <p><strong>Chemical Analysis:</strong></p>
          <ul className="summary-list">
            <li>Carbon %: 0.55 (Valid - Range: 0.50-0.60)</li>
            <li>Grain Size: 5</li>
          </ul>
          <p><strong>Mechanical Properties:</strong></p>
          <ul className="summary-list">
            <li>Hardness: 48 HRC (Valid - Range: 45-55)</li>
            <li>Depth of Decarb: 0.2mm</li>
          </ul>
        </div>
        */}

        {/* Work in Progress UI */}
        <div style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px', animation: 'bounce 2s infinite' }}>🚧</div>
          <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>
            Summary Module Under Development
          </h3>
          <p style={{ color: '#64748b', fontSize: '17px', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
            We are currently working on a dynamic summary engine that will provide live, data-driven reports consolidated across all your inspection heats.
          </p>
          
          <div style={{ 
            marginTop: '40px', 
            padding: '16px 32px', 
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
            border: '1px solid #bae6fd', 
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            color: '#0369a1',
            fontWeight: '600',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <span style={{ fontSize: '20px' }}>⏳</span>
            Coming Soon: Live Report Compilation
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default SummaryReportsPage;

