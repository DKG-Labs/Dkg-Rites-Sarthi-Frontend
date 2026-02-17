import { useState, useEffect, useCallback } from 'react';
import RawMaterialSubmoduleNav from '../components/RawMaterialSubmoduleNav';
import HeatToggle from '../components/HeatToggle';
import './PackingStoragePage.css';

const STORAGE_KEY = 'packing_storage_draft_data';

/**
 * Packing & Storage Verification Page - Raw Material Sub-module
 * Verification of packing conditions and storage requirements
 * Now supports per-heat data entry with heat toggle
 */
const PackingStoragePage = ({ onBack, heats = [], onNavigateSubmodule, inspectionCallNo = '' }) => {

  // Active heat index for toggle
  const [activeHeatIndex, setActiveHeatIndex] = useState(0);

  // Load draft data from localStorage
  const loadDraftData = useCallback(() => {
    const storageKey = `${STORAGE_KEY}_${inspectionCallNo}`;
    const savedDraft = localStorage.getItem(storageKey);
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (e) {
        console.error('Error parsing draft data:', e);
      }
    }
    return null;
  }, [inspectionCallNo]);

  // Packing checklist state - now per heat
  const [packingDataByHeat, setPackingDataByHeat] = useState(() => {
    const draft = loadDraftData();
    if (draft?.packingDataByHeat) {
      return draft.packingDataByHeat;
    }
    // Initialize empty data for each heat
    const initialData = {};
    heats.forEach((heat, idx) => {
      initialData[idx] = {
        storedHeatWise: '',
        suppliedInBundles: '',
        heatNumberEnds: '',
        packingStripWidth: '',
        bundleTiedLocations: '',
        identificationTagBundle: '',
        metalTagInformation: '',
        remarks: ''
      };
    });
    return initialData;
  });

  // Auto-save to localStorage
  useEffect(() => {
    const storageKey = `${STORAGE_KEY}_${inspectionCallNo}`;
    localStorage.setItem(storageKey, JSON.stringify({ packingDataByHeat }));
  }, [packingDataByHeat, inspectionCallNo]);

  // Update checklist for current heat
  const updateChecklist = (field, value) => {
    setPackingDataByHeat(prev => ({
      ...prev,
      [activeHeatIndex]: {
        ...prev[activeHeatIndex],
        [field]: value
      }
    }));
  };

  // Handle heat change
  const handleHeatChange = (newIndex) => {
    setActiveHeatIndex(newIndex);
  };

  // Get current heat's data
  const currentHeatData = packingDataByHeat[activeHeatIndex] || {
    storedHeatWise: '',
    suppliedInBundles: '',
    heatNumberEnds: '',
    packingStripWidth: '',
    bundleTiedLocations: '',
    identificationTagBundle: '',
    metalTagInformation: '',
    remarks: ''
  };

  const checklistItems = [
    { id: 'storedHeatWise', label: '1. Stored in Heat wise Stacks' },
    { id: 'suppliedInBundles', label: '2. Supplied in Bundles and tied with Binding Wires' },
    { id: 'heatNumberEnds', label: '3. Paint or Sticker related to heat number provided at extreme ends' },
    { id: 'packingStripWidth', label: '4. Packing strip width is between 18 to 33mm' },
    { id: 'bundleTiedLocations', label: '5. Bundle tied at 3-4 locations using 18-33mm wide packing strip' },
    { id: 'identificationTagBundle', label: '6. Identification Tag provided for each bundle' },
    { id: 'metalTagInformation', label: '7. Metal Tag have information on Firm Details, PO number, Heat No., Date, Grade, Size & Length' }
  ];

  return (
    <div className="packing-storage-page-container">
      <div className="packing-storage-page-header">
        <h1 className="packing-storage-page-title">📦 Packing & Storage Verification</h1>
        <button className="packing-storage-back-btn" onClick={onBack}>
          ← Back to Raw Material Dashboard
        </button>
      </div>

      <RawMaterialSubmoduleNav
        currentSubmodule="packing-storage"
        onNavigate={onNavigateSubmodule}
      />

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Packing & Storage Checklist</h3>
          <p className="card-subtitle">Verify packing conditions and storage requirements</p>
        </div>

        {/* Acceptance Criteria Info Box */}
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px'
        }}>
          <span style={{ fontSize: '18px' }}>ℹ️</span>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: '#0369a1', fontSize: '0.9rem' }}>Acceptance Criteria</p>
            <p style={{ margin: '4px 0 0', color: '#0c4a6e', fontSize: '0.85rem' }}>
              <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ OK</span> — All checklist items are "Yes"
              <span style={{ margin: '0 12px', color: '#94a3b8' }}>|</span>
              <span style={{ color: '#dc2626', fontWeight: 600 }}>✗ NOT OK</span> — Any checklist item is "No"
            </p>
          </div>
        </div>

        {/* Heat Toggle */}
        <div className="packing-heat-summary">
          <h4 className="packing-summary-title">Heats Being Inspected:</h4>
          <HeatToggle
            heats={heats}
            activeHeatIndex={activeHeatIndex}
            onHeatChange={handleHeatChange}
          />
        </div>

        {/* Checklist */}
        <div className="packing-checklist">
          {checklistItems.map(item => (
            <div key={item.id} className="packing-checklist-item">
              <div className="packing-checklist-label">
                <span className="packing-checklist-text">{item.label}</span>
              </div>
              <div className="packing-checklist-options">
                <label className="packing-radio-label">
                  <input
                    type="radio"
                    name={`${item.id}_${activeHeatIndex}`}
                    value="Yes"
                    checked={currentHeatData[item.id] === 'Yes'}
                    onChange={(e) => updateChecklist(item.id, e.target.value)}
                  />
                  <span className="packing-radio-text packing-radio-yes">Yes</span>
                </label>
                <label className="packing-radio-label">
                  <input
                    type="radio"
                    name={`${item.id}_${activeHeatIndex}`}
                    value="No"
                    checked={currentHeatData[item.id] === 'No'}
                    onChange={(e) => updateChecklist(item.id, e.target.value)}
                  />
                  <span className="packing-radio-text packing-radio-no">No</span>
                </label>
                <label className="packing-radio-label">
                  <input
                    type="radio"
                    name={`${item.id}_${activeHeatIndex}`}
                    value="NA"
                    checked={currentHeatData[item.id] === 'NA'}
                    onChange={(e) => updateChecklist(item.id, e.target.value)}
                  />
                  <span className="packing-radio-text packing-radio-na">N/A</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Remarks */}
        <div className="packing-remarks-section">
          <label className="packing-remarks-label">Overall Remarks</label>
          <textarea
            className="form-control packing-remarks-textarea"
            rows="4"
            placeholder="Enter any additional remarks or observations..."
            value={currentHeatData.remarks || ''}
            onChange={(e) => updateChecklist('remarks', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default PackingStoragePage;

