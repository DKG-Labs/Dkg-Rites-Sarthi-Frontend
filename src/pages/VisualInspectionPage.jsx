import { useState, useMemo, useEffect, useCallback } from 'react';
import Notification from '../components/Notification';
import RawMaterialSubmoduleNav from '../components/RawMaterialSubmoduleNav';
import { saveVisualInspectionPass } from '../services/rmInspectionService';
import './VisualInspectionPage.css';

const STORAGE_KEY = 'visual_inspection_draft_data';

// Weight calculation factors per metre
const WEIGHT_FACTORS = {
  'MK-III': 0.00263,  // tonnes per metre
  'MK-V': 0.00326     // tonnes per metre
};

// Defects that contribute to total defective length
// Includes all defect types: Distortion, Twist, Kink, Not Straight, Fold, Lap, Crack, Pit, Groove, Excessive Scaling, Internal Defect
const LENGTH_DEFECTS = ['Distortion', 'Twist', 'Kink', 'Not Straight', 'Fold', 'Lap', 'Crack', 'Pit', 'Groove', 'Excessive Scaling', 'Internal Defect (Piping, Segregation)'];

/**
 * Visual Inspection Page - Raw Material Sub-module
 * Handles visual defects checklist per heat
 * Data persists while switching tabs/submodules until user submits
 */
const VisualInspectionPage = ({ onBack, heats = [], productModel = 'MK-III', onNavigateSubmodule, inspectionCallNo = '' }) => {
  const [activeHeatTab, setActiveHeatTab] = useState(0);
  const [notification, setNotification] = useState({ message: '', type: 'error' });
  const [isSaving, setIsSaving] = useState(false);
  const [passedHeats, setPassedHeats] = useState({});

  const showNotification = (message, type = 'error', autoClose = true, delay = 4000) => {
    setNotification({ message, type });
    if (autoClose) {
      setTimeout(() => setNotification({ message: '', type }), delay);
    }
  };

  // Visual Defects List
  const defectList = useMemo(() => ([
    'No Defect', 'Distortion', 'Twist', 'Kink', 'Not Straight', 'Fold',
    'Lap', 'Crack', 'Pit', 'Groove', 'Excessive Scaling', 'Internal Defect (Piping, Segregation)'
  ]), []);

  // Load draft data from localStorage or initialize empty
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

  // Per-heat Visual state
  const [heatVisualData, setHeatVisualData] = useState(() => {
    const draft = loadDraftData();
    if (draft && draft.length > 0) {
      return draft;
    }
    return heats.map(() => ({
      selectedDefects: defectList.reduce((acc, d) => { acc[d] = false; return acc; }, {}),
      defectCounts: defectList.reduce((acc, d) => { acc[d] = ''; return acc; }, {}),
    }));
  });

  // Keep heatVisualData in sync when heats change
  useEffect(() => {
    setHeatVisualData(prev => {
      const next = heats.map((_, idx) => prev[idx] || {
        selectedDefects: defectList.reduce((acc, d) => { acc[d] = false; return acc; }, {}),
        defectCounts: defectList.reduce((acc, d) => { acc[d] = ''; return acc; }, {}),
      });
      if (activeHeatTab >= heats.length) setActiveHeatTab(Math.max(0, heats.length - 1));
      return next;
    });
  }, [heats, defectList, activeHeatTab]);

  // Auto-save to localStorage on heatVisualData change (persist while switching tabs/submodules)
  useEffect(() => {
    const storageKey = `${STORAGE_KEY}_${inspectionCallNo}`;
    localStorage.setItem(storageKey, JSON.stringify(heatVisualData));
  }, [heatVisualData, inspectionCallNo]);

  // Load visual inspection data from backend on component mount
  // ONLY load from backend if localStorage is empty (preserve user edits)
  const loadVisualInspectionDataFromBackend = useCallback(async () => {
    // Check if localStorage already has data - if yes, don't overwrite with backend data
    const storageKey = `${STORAGE_KEY}_${inspectionCallNo}`;
    const existingLocalData = localStorage.getItem(storageKey);

    if (existingLocalData) {
      console.log('⏭️ Skipping backend load - localStorage data exists (preserving user edits)');
      return;
    }

    try {
      console.log('📥 Loading visual inspection data from backend for call:', inspectionCallNo);
      // Import the service function
      const { getVisualInspection } = await import('../services/rmInspectionService');
      const data = await getVisualInspection(inspectionCallNo);

      if (data && Array.isArray(data)) {
        console.log('✅ Visual inspection data loaded from backend:', data);
        // Group data by heat and defect
        const heatDataMap = {};
        const passedMap = {};

        data.forEach(item => {
          const heatIdx = item.heatIndex || 0;
          if (!heatDataMap[heatIdx]) {
            heatDataMap[heatIdx] = {
              selectedDefects: defectList.reduce((acc, d) => { acc[d] = false; return acc; }, {}),
              defectCounts: defectList.reduce((acc, d) => { acc[d] = ''; return acc; }, {}),
              isPassed: false
            };
          }

          // NEW FORMAT: Backend returns one record per heat with defects and defectLengths maps
          if (item.defects) {
            // Convert defects map to selectedDefects
            Object.entries(item.defects).forEach(([defectName, isSelected]) => {
              if (isSelected) {
                heatDataMap[heatIdx].selectedDefects[defectName] = true;
              }
            });
          }

          // Convert defectLengths map to defectCounts
          if (item.defectLengths) {
            Object.entries(item.defectLengths).forEach(([defectName, length]) => {
              if (length !== null && length !== undefined) {
                heatDataMap[heatIdx].defectCounts[defectName] = length.toString();
              }
            });
          }

          // Mark as passed if passedAt is set
          if (item.passedAt) {
            heatDataMap[heatIdx].isPassed = true;
            passedMap[item.heatNo] = true;
          }
        });

        // Set backend data to state (only runs if localStorage was empty)
        setHeatVisualData(prev => {
          return prev.map((heatData, idx) => {
            if (heatDataMap[idx]) {
              return {
                ...heatData,
                ...heatDataMap[idx]
              };
            }
            return heatData;
          });
        });

        // Update passed heats map
        setPassedHeats(passedMap);
        console.log('✅ Visual inspection data loaded from backend and saved to state');
      }
    } catch (error) {
      console.error('❌ Error loading visual inspection data from backend:', error);
      // Silently fail - use localStorage draft data as fallback
    }
  }, [inspectionCallNo, defectList]);

  // Load visual inspection data from backend on component mount
  useEffect(() => {
    if (inspectionCallNo) {
      loadVisualInspectionDataFromBackend();
    }
  }, [inspectionCallNo, loadVisualInspectionDataFromBackend]);

  // Defect handlers
  const handleDefectToggle = useCallback((defectName) => {
    setHeatVisualData(prev => {
      const next = [...prev];
      const hv = { ...next[activeHeatTab] };
      const sel = { ...hv.selectedDefects };
      const counts = { ...hv.defectCounts };
      if (defectName === 'No Defect') {
        if (sel['No Defect']) {
          sel['No Defect'] = false;
        } else {
          Object.keys(sel).forEach(k => { sel[k] = false; counts[k] = ''; });
          sel['No Defect'] = true;
        }
      } else {
        sel[defectName] = !sel[defectName];
        if (!sel[defectName]) counts[defectName] = '';
        if (sel['No Defect']) sel['No Defect'] = false;
      }
      hv.selectedDefects = sel;
      hv.defectCounts = counts;
      next[activeHeatTab] = hv;
      return next;
    });
  }, [activeHeatTab]);

  const handleDefectCountChange = useCallback((defectName, value) => {
    setHeatVisualData(prev => {
      const next = [...prev];
      const hv = { ...next[activeHeatTab] };
      hv.defectCounts = { ...hv.defectCounts, [defectName]: value };
      next[activeHeatTab] = hv;
      return next;
    });
  }, [activeHeatTab]);

  // Validation: ensure that if any length-defect is selected, its value must be filled
  const validateHeatData = useCallback((heatIdx) => {
    const hv = heatVisualData[heatIdx] || {};
    const selected = hv.selectedDefects || {};
    const counts = hv.defectCounts || {};

    for (let defect of LENGTH_DEFECTS) {
      if (selected[defect]) {
        const v = counts[defect];
        if (v === undefined || v === null || String(v).trim() === '') {
          showNotification(`Please enter value for ${defect} before leaving this tab.`, 'warning');
          return false;
        }
      }
    }
    return true;
  }, [heatVisualData]);

  const handleSelectHeat = useCallback((idx) => {
    // If trying to leave current heat, validate current heat
    if (activeHeatTab !== idx) {
      const ok = validateHeatData(activeHeatTab);
      if (!ok) return; // block change
    }
    setActiveHeatTab(idx);
  }, [activeHeatTab, validateHeatData]);

  // Wrap navigation and back handlers to validate current heat before allowing navigation
  const handleBackClick = useCallback(() => {
    const ok = validateHeatData(activeHeatTab);
    if (!ok) return;
    onBack();
  }, [activeHeatTab, validateHeatData, onBack]);

  const handleNavigateSubmodule = useCallback((sub) => {
    const ok = validateHeatData(activeHeatTab);
    if (!ok) return;
    if (onNavigateSubmodule) onNavigateSubmodule(sub);
  }, [activeHeatTab, validateHeatData, onNavigateSubmodule]);

  /**
   * Calculate total defective length for current heat
   * Sum of all length-based defects (Distortion, Twist, Kink, Not Straight, Fold, Lap, Crack, Pit, Groove, Excessive Scaling, Internal Defect)
   * Input is in metres, output is in metres
   */
  const calculateTotalDefectiveLength = useCallback((heatData) => {
    if (!heatData?.selectedDefects || !heatData?.defectCounts) return 0;

    const selected = heatData.selectedDefects;
    const counts = heatData.defectCounts;

    let totalMetres = 0;
    LENGTH_DEFECTS.forEach(defect => {
      if (selected[defect]) {
        const lengthMetres = parseFloat(counts[defect]) || 0;
        totalMetres += lengthMetres;
      }
    });

    return totalMetres;
  }, []);

  /**
   * Calculate weight rejected based on total defective length
   * Formula: MK-III: Length(m) * 0.00263, MK-V: Length(m) * 0.00326
   */
  const calculateWeightRejected = useCallback((totalLengthMetres) => {
    const model = productModel?.toUpperCase().includes('V') ? 'MK-V' : 'MK-III';
    const factor = WEIGHT_FACTORS[model];
    return totalLengthMetres * factor;
  }, [productModel]);

  // Handle Pass button click
  const handlePassVisualInspection = useCallback(async () => {
    const currentHeat = heats[activeHeatTab];
    if (!currentHeat) {
      showNotification('No heat selected', 'error');
      return;
    }

    const heatNo = currentHeat.heatNo || currentHeat.heat_no;
    if (!heatNo) {
      showNotification('Heat number not found', 'error');
      return;
    }

    // Get selected defects for current heat
    const currentHeatData = heatVisualData[activeHeatTab];
    const selectedDefects = Object.keys(currentHeatData.selectedDefects || {})
      .filter(defect => currentHeatData.selectedDefects[defect]);

    if (selectedDefects.length === 0) {
      showNotification('Please select at least one defect before passing', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // Get current user ID from localStorage
      const userId = localStorage.getItem('userId') || 'system';

      // Create payload with selected defects AND their lengths
      // Note: Allow multiple passes for same heat (multi-shift support)
      const payload = {
        inspectionCallNo,
        heatNo,
        heatIndex: activeHeatTab,
        createdBy: userId,
        selectedDefects: selectedDefects,
        defectLengths: selectedDefects.reduce((acc, defect) => {
          acc[defect] = currentHeatData.defectCounts[defect] || '';
          return acc;
        }, {})
      };

      await saveVisualInspectionPass(payload);

      // Update passed heats map - allows re-passing same heat
      setPassedHeats(prev => ({ ...prev, [heatNo]: true }));

      // Update localStorage draft data to mark this heat as passed
      // This ensures the status badge shows "Pass" in the dashboard
      // AND data persists in the Visual Inspection page
      const storageKey = `${STORAGE_KEY}_${inspectionCallNo}`;
      const updatedDraft = [...heatVisualData];
      if (updatedDraft[activeHeatTab]) {
        // Mark as passed but keep all the data intact
        updatedDraft[activeHeatTab].isPassed = true;
        // Data (selectedDefects, defectCounts) remains unchanged
      }
      localStorage.setItem(storageKey, JSON.stringify(updatedDraft));

      // Update state to reflect the pass
      // This keeps all the data visible on the page
      setHeatVisualData(updatedDraft);

      showNotification(`Heat ${heatNo} passed visual inspection successfully!`, 'success', true, 3000);
    } catch (error) {
      console.error('Error saving pass status:', error);
      showNotification('Failed to save pass status: ' + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [activeHeatTab, heats, inspectionCallNo, heatVisualData]);

  // Calculate values for current heat
  const currentHeatData = heatVisualData[activeHeatTab] || {};
  const totalDefectiveLength = calculateTotalDefectiveLength(currentHeatData);
  const weightRejected = calculateWeightRejected(totalDefectiveLength);
  const currentHeat = heats[activeHeatTab];
  const currentHeatNo = currentHeat?.heatNo || currentHeat?.heat_no;
  const isCurrentHeatPassed = passedHeats[currentHeatNo];

  // Calculate total offered qty for all heats with the same heat number
  const totalOfferedQty = useMemo(() => {
    if (!currentHeatNo) return 0;
    return heats
      .filter(h => (h.heatNo || h.heat_no) === currentHeatNo)
      .reduce((sum, h) => sum + (parseFloat(h.weight) || 0), 0);
  }, [heats, currentHeatNo]);

  // Validation: Check if rejected weight exceeds total offered qty
  const isValidationFailed = weightRejected > totalOfferedQty;

  // Calculate Accepted Qty (Tons) = Offered Qty - Rejected Weight
  // Note: acceptedQtyTons and wtAcceptedNumbers are calculated but not currently used in the UI
  // const acceptedQtyTons = totalOfferedQty - weightRejected;
  // const wtAcceptedNumbers = (acceptedQtyTons * 1000) / 1.15;

  // Show notification when validation fails
  useEffect(() => {
    if (isValidationFailed) {
      const message = `⚠️ Rejected weight (${weightRejected.toFixed(6)} T) exceeds offered quantity (${totalOfferedQty.toFixed(3)} T). Edit highlighted defect values to reduce weight.`;
      showNotification(message, 'warning', true, 8000);
    }
  }, [isValidationFailed, weightRejected, totalOfferedQty]);

  // Wrapper functions to check validation before allowing navigation
  const handleSelectHeatWithValidation = useCallback((idx) => {
    if (isValidationFailed) {
      showNotification('Please resolve the validation error before switching to another heat.', 'warning');
      return;
    }
    handleSelectHeat(idx);
  }, [isValidationFailed, handleSelectHeat]);

  const handleBackClickWithValidation = useCallback(() => {
    if (isValidationFailed) {
      showNotification('Please resolve the validation error before going back.', 'warning');
      return;
    }
    handleBackClick();
  }, [isValidationFailed, handleBackClick]);

  const handleNavigateSubmoduleWithValidation = useCallback((sub) => {
    if (isValidationFailed) {
      showNotification('Please resolve the validation error before navigating to another section.', 'warning');
      return;
    }
    handleNavigateSubmodule(sub);
  }, [isValidationFailed, handleNavigateSubmodule]);

  return (
    <div className="visual-page-container">
      <div className="visual-page-header">
        <h1 className="visual-page-title">👁️ Visual Inspection</h1>
        <button className="visual-back-btn" onClick={handleBackClickWithValidation}>
          ← Back to Raw Material Dashboard
        </button>
      </div>

      {/* Submodule Navigation */}
      <RawMaterialSubmoduleNav
        currentSubmodule="visual-inspection"
        onNavigate={handleNavigateSubmoduleWithValidation}
      />

      {/* App notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: '', type: notification.type })}
        autoClose={true}
        autoCloseDelay={notification.type === 'warning' ? 8000 : 4000}
      />

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Visual Defects Checklist</h3>
          <p className="card-subtitle">Check for material defects per heat</p>
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
              <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ OK</span> — "No Defect" is selected
              <span style={{ margin: '0 12px', color: '#94a3b8' }}>|</span>
              <span style={{ color: '#dc2626', fontWeight: 600 }}>✗ NOT OK</span> — Any defect is selected
            </p>
          </div>
        </div>

        {/* Heat selector buttons */}
        {(() => {
          // Check if all heats have the same heat number
          const uniqueHeatNumbers = new Set(heats.map(h => h.heatNo || h.heat_no));
          const hasSingleUniqueHeat = uniqueHeatNumbers.size === 1;

          if (hasSingleUniqueHeat) {
            return (
              <div className="visual-heat-selector visual-heat-single">
                <span className="visual-heat-single-label">{`Heat ${heats[0].heatNo || `#1`}`}</span>
              </div>
            );
          }

          return (
            <div className="visual-heat-selector">
              {heats.map((h, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={idx === activeHeatTab ? 'btn btn-primary' : 'btn btn-outline'}
                  onClick={() => handleSelectHeatWithValidation(idx)}
                >
                  {`Heat ${h.heatNo || `#${idx + 1}`}`}
                </button>
              ))}
            </div>
          );
        })()}

        {/* Visual Defects Grid */}
        <div className="visual-defect-grid">
          {(() => {
            const hv = heatVisualData[activeHeatTab] || {};
            const selected = hv.selectedDefects || {};
            const counts = hv.defectCounts || {};
            return defectList.map((d) => {
              const isNoDefect = d === 'No Defect';
              const checked = selected[d];
              const disabled = isNoDefect ? false : selected['No Defect'];
              const isMatchingDefectType = !!checked;
              const rowClassName = [
                'checkbox-item',
                'visual-defect-row',
                isMatchingDefectType ? 'matching' : 'non-matching'
              ].join(' ');
              return (
                <div key={d} className={rowClassName} style={{ opacity: isValidationFailed && !checked ? 0.5 : 1 }}>
                  <input
                    type="checkbox"
                    id={`defect-${d}`}
                    checked={!!checked}
                    onChange={() => handleDefectToggle(d)}
                    disabled={disabled || (isValidationFailed && !checked)}
                    title={isValidationFailed && !checked ? 'Cannot add more defects - rejected weight exceeds offered quantity' : ''}
                  />
                  <label htmlFor={`defect-${d}`}>{d}</label>
                  {!isNoDefect && selected[d] && (
                    <input
                      type="number"
                      className="form-control visual-defect-count"
                      value={counts[d] || ''}
                      onChange={(e) => handleDefectCountChange(d, e.target.value)}
                      placeholder="Length (m)"
                      min="0"
                      step="0.001"
                      style={{
                        backgroundColor: isValidationFailed ? '#fef3c7' : '#fff',
                        borderColor: isValidationFailed ? '#fcd34d' : '#e5e7eb'
                      }}
                      title={isValidationFailed ? 'Edit this value to reduce rejected weight' : ''}
                    />
                  )}
                </div>
              );
            });
          })()}
        </div>

        {/* Calculation Summary */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#64748b',
              marginBottom: '8px'
            }}>
              Offered Qty (tonnes)
            </label>
            <div style={{
              padding: '12px',
              background: '#fff',
              border: '2px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#0369a1'
            }}>
              {totalOfferedQty.toFixed(3)} T
            </div>
            <p style={{
              margin: '8px 0 0',
              fontSize: '0.75rem',
              color: '#94a3b8',
              fontStyle: 'italic'
            }}>
              Total offered quantity for all heats with number {currentHeatNo}
            </p>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#64748b',
              marginBottom: '8px'
            }}>
              Total Defective Length (metres)
            </label>
            <div style={{
              padding: '12px',
              background: '#fff',
              border: '2px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '1.125rem',
              fontWeight: 600,
              color: totalDefectiveLength > 0 ? '#dc2626' : '#64748b'
            }}>
              {totalDefectiveLength.toFixed(3)} m
            </div>
            <p style={{
              margin: '8px 0 0',
              fontSize: '0.75rem',
              color: '#94a3b8',
              fontStyle: 'italic'
            }}>
              Auto-calculated from: Distortion, Twist, Kink, Not Straight, Fold, Lap, Crack
            </p>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#64748b',
              marginBottom: '8px'
            }}>
              Weight Rejected (tonnes)
            </label>
            <div style={{
              padding: '12px',
              background: '#fff',
              border: `2px solid ${isValidationFailed ? '#dc2626' : '#e2e8f0'}`,
              borderRadius: '6px',
              fontSize: '1.125rem',
              fontWeight: 600,
              color: isValidationFailed ? '#dc2626' : (weightRejected > 0 ? '#dc2626' : '#64748b')
            }}>
              {weightRejected.toFixed(6)} T
            </div>
            <p style={{
              margin: '8px 0 0',
              fontSize: '0.75rem',
              color: '#94a3b8',
              fontStyle: 'italic'
            }}>
              Formula: {productModel?.toUpperCase().includes('V') ? 'MK-V' : 'MK-III'} = Length (m) × {productModel?.toUpperCase().includes('V') ? '0.00326' : '0.00263'}
            </p>
          </div>
        </div>

        {/* Validation Error Message - Inline Alert */}
        {isValidationFailed && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: '#fef3c7',
            border: '2px solid #fcd34d',
            borderRadius: '8px',
            color: '#92400e',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <span style={{ fontSize: '18px', marginTop: '2px' }}>⚠️</span>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>Validation Alert - Cannot Add New Defects</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', fontWeight: 400 }}>
                Rejected weight ({weightRejected.toFixed(6)} T) exceeds total offered quantity ({totalOfferedQty.toFixed(3)} T).
                <br />
                <strong>You can edit existing defect values</strong> (highlighted in yellow) to reduce the rejected weight, but cannot add new defects. Please adjust the defect lengths to proceed.
              </p>
            </div>
          </div>
        )}

        {/* Note for defective portion */}
        {/* <p className="visual-defect-note">
          <strong>Note:</strong> In case of defective, enter the total length of defective portion (in metres).
        </p> */}

        {/* Pass Button Section */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: isCurrentHeatPassed ? '#f0fdf4' : '#fffbeb',
          border: `2px solid ${isCurrentHeatPassed ? '#86efac' : '#fde68a'}`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: isCurrentHeatPassed ? '#166534' : '#92400e' }}>
              {isCurrentHeatPassed ? '✓ Heat Passed Visual Inspection' : 'Pass Remaining Material for Visual Inspection'}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: isCurrentHeatPassed ? '#15803d' : '#b45309' }}>
              {isCurrentHeatPassed
                ? `Heat ${currentHeatNo} has been marked as passed. Click "Pass" again to re-pass in another shift.`
                : 'Click "Pass" to mark the remaining material as passed'}
            </p>
          </div>
          <button
            onClick={handlePassVisualInspection}
            disabled={isSaving}
            style={{
              padding: '10px 20px',
              background: isSaving ? '#d1d5db' : '#22c55e',
              color: isSaving ? '#6b7280' : '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.6 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            {isSaving ? 'Saving...' : isCurrentHeatPassed ? 'Passed ✓ - Pass Again' : 'Pass Material'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default VisualInspectionPage;

