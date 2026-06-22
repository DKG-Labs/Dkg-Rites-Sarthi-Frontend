import { useState, useEffect, useCallback, useMemo } from 'react';
import RawMaterialSubmoduleNav from '../components/RawMaterialSubmoduleNav';
import { getLadleValuesByCallNo, getMaterialTesting } from '../services/rmInspectionService';
import './MaterialTestingPage.css';

const STORAGE_KEY = 'material_testing_draft_data';

// Helper to get current shift from sessionStorage for shift-specific storage
const getShiftSuffix = () => {
  const shift = sessionStorage.getItem('inspectionShift');
  return shift ? `_${shift}` : '';
};

/**
 * Specification limits for raw material testing
 * Based on validation rules from specification document
 * Note: C, Si, Mn also have ±tolerance from ladle analysis (to be validated when ladle data available)
 */
const SPEC_LIMITS = {
  c: { min: 0.50, max: 0.60 },      // %C: 0.5-0.6 (also ±0.03 from ladle analysis)
  si: { min: 1.50, max: 2.00 },     // %Si: 1.5-2.0 (also ±0.05 from ladle analysis)
  mn: { min: 0.80, max: 1.00 },     // %Mn: 0.8-1.0 (also ±0.04 from ladle analysis)
  p: { min: 0, max: 0.030 },        // %P: ≤0.030 max
  s: { min: 0, max: 0.030 },        // %S: ≤0.030 max
  grainSize: { min: 6, max: 999 },  // Grain Size: ≥6
  decarb: { min: 0, max: 0.25 },    // Depth of Decarb: ≤0.25mm
  inclA: { min: 0, max: 2.0 },      // Inclusion A: ≤2.0
  inclB: { min: 0, max: 2.0 },      // Inclusion B: ≤2.0
  inclC: { min: 0, max: 2.0 },      // Inclusion C: ≤2.0
  inclD: { min: 0, max: 2.0 },      // Inclusion D: ≤2.0
  // Note: Hardness (HRC) has no specific range - just Required, Float
};

/**
 * Tolerance from ladle value (Same as Final Chemical Analysis) - TEMPORARILY COMMENTED OUT
 */
/*
const TOLERANCES = {
  c: 0.03,
  mn: 0.04,
  si: 0.05,
  s: 0.005,
  p: 0.005,
};
*/


/**
 * Material Testing Page - Raw Material Sub-module
 * Chemical Analysis & Mechanical Properties (2 samples per Heat)
 */
const MaterialTestingPage = ({ onBack, heats = [], productModel, onNavigateSubmodule, inspectionCallNo = '' }) => {
  // 1. Decarb Tolerance based on Product Model
  // MK-III: Max 0.2064 mm
  // MK-V: Max 0.23 mm
  const isMkV = productModel?.toString().toUpperCase().includes('MK-V');
  const decarbLimit = isMkV ? 0.23 : 0.2064;

  /**
   * Get validation status for a value based on specification limits
   * Returns 'pass' (green), 'fail' (red), or '' (no color)
   */
  const getValueStatus = (field, value, ladleVal = null) => {
    if (value === '' || value === null || value === undefined) return '';

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';

    // Special rule for Decarb - Dynamic Limit with Strict Rejection
    if (field === 'decarb') {
      return numValue <= decarbLimit ? 'pass' : 'fail';
    }

    const limits = SPEC_LIMITS[field];
    if (!limits) return '';

    // 1. Ladle Tolerance Check (if ladle analysis is available) - TEMPORARILY COMMENTED OUT
    /*
    if (ladleVal !== null && ladleVal !== undefined && TOLERANCES[field] !== undefined) {
      const lVal = parseFloat(ladleVal);
      const tolerance = TOLERANCES[field];

      if (!isNaN(lVal)) {
        // Standard rule for Carbon, Silicon, Manganese (± tolerance)
        // Rule: Must be within absolute spec AND within tolerance from ladle
        const diff = Math.abs(numValue - lVal);
        const withinTolerance = diff <= (tolerance + 0.0001); // Standard floating point buffer

        // Strict spec check (not expanded)
        const withinSpec = numValue >= (limits.min - 0.0001) && numValue <= (limits.max + 0.0001);

        // Sulphur and Phosphorus: must be within absolute spec AND not cross (Ladle + 0.005)
        if (field === "s" || field === "p") {
          return (withinSpec && numValue <= (lVal + tolerance)) ? "pass" : "fail";
        }

        return (withinTolerance && withinSpec) ? 'pass' : 'fail';
      }
    }
    */

    // 2. Fallback: Basic Specification Check (for non-chemical fields or if ladle is missing)
    const withinSpec = (numValue >= (limits.min - 0.0001) && numValue <= (limits.max + 0.0001));
    return withinSpec ? 'pass' : 'fail';
  };
  const [activeHeatTab, setActiveHeatTab] = useState(0);
  const [ladleValues, setLadleValues] = useState([]);
  const [isLoadingLadle, setIsLoadingLadle] = useState(false);

  // Load draft data from localStorage or initialize empty
  const loadDraftData = useCallback(() => {
    const storageKey = `${STORAGE_KEY}_${inspectionCallNo}${getShiftSuffix()}`;
    const savedDraft = localStorage.getItem(storageKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        return parsed?.materialData || null;
      } catch (e) {
        console.error('Error parsing draft data:', e);
      }
    }
    return null;
  }, [inspectionCallNo]);

  // Empty sample template
  const createEmptyHeat = useCallback(() => ({
    samples: [
      { c: '', si: '', mn: '', p: '', s: '', grainSize: '', inclTypeA: '', inclA: '', inclTypeB: '', inclB: '', inclTypeC: '', inclC: '', inclTypeD: '', inclD: '', hardness: '', decarb: '', remarks: '' },
      { c: '', si: '', mn: '', p: '', s: '', grainSize: '', inclTypeA: '', inclA: '', inclTypeB: '', inclB: '', inclTypeC: '', inclC: '', inclTypeD: '', inclD: '', hardness: '', decarb: '', remarks: '' }
    ]
  }), []);

  // Material testing state - now keyed by heatNo for stability
  const [materialData, setMaterialData] = useState(() => {
    const draft = loadDraftData();
    const state = {};
    
    // Migration/Initialization logic
    heats.forEach((h, idx) => {
      const hNo = (h.heatNo || h.heat_no || `Heat-${idx + 1}`).toString().trim().toUpperCase();
      
      // 1. Try to find in draft by heatNo (New format)
      if (draft && typeof draft === 'object' && !Array.isArray(draft) && draft[hNo]) {
        state[hNo] = draft[hNo];
      } 
      // 2. Fallback: Try to find in draft by index (Old format)
      else if (draft && Array.isArray(draft) && draft[idx]) {
        state[hNo] = draft[idx];
      }
      // 3. Default: Empty state
      else {
        state[hNo] = createEmptyHeat();
      }
    });
    return state;
  });

  // Keep materialData in sync when heats change
  useEffect(() => {
    setMaterialData(prev => {
      const next = { ...prev };
      let changed = false;
      heats.forEach((h, idx) => {
        const hNo = (h.heatNo || h.heat_no || `Heat-${idx + 1}`).toString().trim().toUpperCase();
        if (!next[hNo]) {
          next[hNo] = createEmptyHeat();
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [heats, createEmptyHeat]);

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Helper to check if material data is essentially empty
  const isMaterialDataEmpty = useCallback((data) => {
    if (!data) return true;
    
    // Handle both Object and Array formats
    const heatEntries = typeof data === 'object' && !Array.isArray(data) 
      ? Object.values(data) 
      : (Array.isArray(data) ? data : []);
      
    if (heatEntries.length === 0) return true;

    return heatEntries.every(heat => 
      heat.samples?.every(sample => 
        !sample.c && !sample.si && !sample.mn && !sample.p && !sample.s && 
        !sample.grainSize && !sample.hardness && !sample.decarb && !sample.remarks &&
        !sample.inclA && !sample.inclB && !sample.inclC && !sample.inclD
      )
    );
  }, []);

  // Auto-save to localStorage on materialData change
  useEffect(() => {
    const storageKey = `${STORAGE_KEY}_${inspectionCallNo}${getShiftSuffix()}`;
    localStorage.setItem(storageKey, JSON.stringify({ materialData }));
  }, [materialData, inspectionCallNo]);

  const updateMaterialField = (heatIdx, sampleIndex, field, value) => {
    const heat = heats[heatIdx];
    if (!heat) return;
    const hNo = (heat.heatNo || heat.heat_no || `Heat-${heatIdx + 1}`).toString().trim().toUpperCase();

    setMaterialData(prev => {
      const next = { ...prev };
      // Defensive check: ensure the heat object exists
      if (!next[hNo]) {
        next[hNo] = createEmptyHeat();
      }
      
      // Ensure samples array exists and copy it
      const heatObj = { ...next[hNo] };
      heatObj.samples = [...(heatObj.samples || createEmptyHeat().samples)];
      
      // Ensure specific sample exists and copy it
      heatObj.samples[sampleIndex] = { ...heatObj.samples[sampleIndex], [field]: value };
      
      next[hNo] = heatObj;
      return next;
    });
    
    // Ensure we mark as loaded when user starts editing
    if (!isDataLoaded) setIsDataLoaded(true);
  };

  const currentHeat = useMemo(() => heats[activeHeatTab] || {}, [heats, activeHeatTab]);
  const heatIndex = activeHeatTab;

  // Fetch ladle values from RM Chemical Analysis table via API
  useEffect(() => {
    const fetchLadleValues = async () => {
      if (!inspectionCallNo) return;

      setIsLoadingLadle(true);
      try {
        console.log('🔬 Fetching ladle values from API for call:', inspectionCallNo);
        const data = await getLadleValuesByCallNo(inspectionCallNo);
        console.log('✅ Ladle values fetched:', data);
        console.log('📊 Ladle heat numbers:', data?.map(l => l.heatNo));
        setLadleValues(data || []);
      } catch (error) {
        console.error('❌ Error fetching ladle values:', error);
        setLadleValues([]);
      } finally {
        setIsLoadingLadle(false);
      }
    };

    fetchLadleValues();
  }, [inspectionCallNo]);

  // Load existing material testing data from backend if available
  // ONLY load from backend if localStorage is empty (preserve user edits)
  useEffect(() => {
    const loadExistingData = async () => {
      if (!inspectionCallNo) return;

      // Check if localStorage already has MEANINGFUL data
      const storageKey = `${STORAGE_KEY}_${inspectionCallNo}${getShiftSuffix()}`;
      const existingLocalData = localStorage.getItem(storageKey);

      if (existingLocalData) {
        try {
          const parsed = JSON.parse(existingLocalData);
          const draft = parsed?.materialData;
          if (draft && !isMaterialDataEmpty(draft)) {
            console.log('⏭️ Skipping backend load - valid draft exists in localStorage');
            setIsDataLoaded(true);
            return;
          }
          console.log('🔄 Local draft is empty, proceeding with backend load');
        } catch (e) {
          console.error('Error checking local data:', e);
        }
      }

      try {
        console.log('📥 Loading existing material testing data from backend for call:', inspectionCallNo);
        const existingData = await getMaterialTesting(inspectionCallNo);

        if (existingData && Array.isArray(existingData) && existingData.length > 0) {
          console.log('✅ Existing material testing data loaded from backend:', existingData);

          // Convert backend data to frontend format
          const materialDataByHeat = {};

          existingData.forEach(record => {
            const heatNo = (record.heatNo || '').toString().trim().toUpperCase();
            const sampleNum = record.sampleNumber || 1;

            if (!materialDataByHeat[heatNo]) {
              materialDataByHeat[heatNo] = {
                samples: [
                  { c: '', si: '', mn: '', p: '', s: '', grainSize: '', inclTypeA: '', inclA: '', inclTypeB: '', inclB: '', inclTypeC: '', inclC: '', inclTypeD: '', inclD: '', hardness: '', decarb: '', remarks: '' },
                  { c: '', si: '', mn: '', p: '', s: '', grainSize: '', inclTypeA: '', inclA: '', inclTypeB: '', inclB: '', inclTypeC: '', inclC: '', inclTypeD: '', inclD: '', hardness: '', decarb: '', remarks: '' }
                ]
              };
            }

            const sampleIndex = sampleNum - 1;
            if (sampleIndex >= 0 && sampleIndex < 2) {
              materialDataByHeat[heatNo].samples[sampleIndex] = {
                c: record.carbonPercent !== null && record.carbonPercent !== undefined ? record.carbonPercent : '',
                si: record.siliconPercent !== null && record.siliconPercent !== undefined ? record.siliconPercent : '',
                mn: record.manganesePercent !== null && record.manganesePercent !== undefined ? record.manganesePercent : '',
                p: record.phosphorusPercent !== null && record.phosphorusPercent !== undefined ? record.phosphorusPercent : '',
                s: record.sulphurPercent !== null && record.sulphurPercent !== undefined ? record.sulphurPercent : '',
                grainSize: record.grainSize !== null && record.grainSize !== undefined ? record.grainSize : '',
                inclTypeA: record.inclusionTypeA || '',
                inclA: record.inclusionA !== null && record.inclusionA !== undefined ? record.inclusionA : '',
                inclTypeB: record.inclusionTypeB || '',
                inclB: record.inclusionB !== null && record.inclusionB !== undefined ? record.inclusionB : '',
                inclTypeC: record.inclusionTypeC || '',
                inclC: record.inclusionC !== null && record.inclusionC !== undefined ? record.inclusionC : '',
                inclTypeD: record.inclusionTypeD || '',
                inclD: record.inclusionD !== null && record.inclusionD !== undefined ? record.inclusionD : '',
                hardness: record.hardnessHrc !== null && record.hardnessHrc !== undefined ? record.hardnessHrc : '',
                decarb: record.decarbDepthMm !== null && record.decarbDepthMm !== undefined ? record.decarbDepthMm : '',
                remarks: record.remarks || ''
              };
            }
          });

          // Convert backend data to state
          setMaterialData(prev => ({ ...prev, ...materialDataByHeat }));
          console.log('✅ Material testing data loaded from backend and saved to state');
        } else {
          console.log('ℹ️ No existing material testing data found on backend');
        }
      } catch (error) {
        console.error('❌ Error loading existing material testing data:', error);
      } finally {
        setIsDataLoaded(true);
      }
    };

    loadExistingData();
  }, [inspectionCallNo, heats, createEmptyHeat, isMaterialDataEmpty]);

  // Get ladle values for the currently selected heat
  const currentLadleHeat = useMemo(() => {
    const currentHeatNo = (currentHeat?.heatNo || currentHeat?.heat_no || '').toString().trim().toUpperCase();

    if (!currentHeatNo) {
      console.log('⚠️ No heat number available for current heat');
      return {};
    }

    // Find ladle values matching the current heat number
    const ladleData = ladleValues.find(ladle => {
      const ladleHeatNo = (ladle.heatNo || ladle.heat_no || '').toString().trim().toUpperCase();
      return ladleHeatNo === currentHeatNo;
    });

    if (ladleData) {
      return ladleData;
    }

    console.log('⚠️ No ladle values found for heat:', currentHeatNo);
    return {};
  }, [ladleValues, currentHeat]);

  // Format ladle value for display
  // IMPORTANT: Must handle 0 as a valid value (not falsy)
  const formatLadleValue = (value) => {
    // Only return '-' for truly missing values (null, undefined, empty string)
    // DO NOT treat 0 as missing - it's a valid chemical composition value
    if (value === '' || value === null || value === undefined) {
      return '-';
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return '-';
    }

    // Return formatted number (including 0.000 if value is 0)
    return numValue.toFixed(3);
  };

  return (
    <div className="material-testing-page-container">
      <div className="material-testing-page-header">
        <h1 className="material-testing-page-title">🧪 Material Testing</h1>
        <button className="material-testing-back-btn" onClick={onBack}>
          ← Back to Raw Material Dashboard
        </button>
      </div>

      <RawMaterialSubmoduleNav
        currentSubmodule="material-testing"
        onNavigate={onNavigateSubmodule}
      />

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Material Testing (2 samples per Heat)</h3>
          <p className="card-subtitle">Chemical Analysis &amp; Mechanical Properties</p>
        </div>
        <div className="alert alert-info" style={{ marginBottom: '16px' }}>
          ℹ️ Calibration status of testing instruments is verified and valid
        </div>

        {/* Specification Limits Info Box */}
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '24px'
        }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#0369a1', fontSize: '0.9rem' }}>📋 Specification Limits (Green = Pass, Red = Fail)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem', color: '#0c4a6e' }}>
            <span><strong>%C:</strong> 0.50-0.60</span>
            <span><strong>%Si:</strong> 1.50-2.00</span>
            <span><strong>%Mn:</strong> 0.80-1.00</span>
            <span><strong>%P:</strong> ≤0.030</span>
            <span><strong>%S:</strong> ≤0.030</span>
            <span><strong>Grain Size:</strong> ≥6</span>
            <span><strong>Decarb ({productModel?.toString().toUpperCase().includes('MK-V') ? 'MK-V' : 'MK-III'}):</strong> ≤{decarbLimit}mm</span>
            <span><strong>Inclusions (A/B/C/D):</strong> ≤2.0 each</span>
          </div>
        </div>

        {/* Heat Toggle */}
        {(() => {
          // Check if all heats have the same heat number
          const uniqueHeatNumbers = new Set(heats.map(h => h.heatNo || h.heat_no));
          const hasSingleUniqueHeat = uniqueHeatNumbers.size === 1;

          if (hasSingleUniqueHeat) {
            return (
              <div className="material-heat-toggle material-heat-single">
                <span className="heat-single-label">Heat {heats[0].heatNo || heats[0].heat_no || `#1`}</span>
              </div>
            );
          }

          return (
            <div className="material-heat-toggle">
              <span className="heat-toggle-label">Select Heat:</span>
              <div className="heat-toggle-buttons">
                {heats.map((heat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`heat-toggle-btn ${idx === activeHeatTab ? 'active' : ''}`}
                    onClick={() => setActiveHeatTab(idx)}
                  >
                    Heat {heat.heatNo || heat.heat_no || `#${idx + 1}`}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {heats.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '12px' }}>Heat: {currentHeat.heatNo || currentHeat.heat_no || `#${heatIndex + 1}`} — Material Testing (2 samples)</h4>

            {/* Chemical Composition Table */}
            <div className="material-testing-table-wrapper" style={{ marginBottom: '24px' }}>
              <table className="material-testing-table">
                <thead>
                  <tr>
                    <th>Sample</th>
                    <th>%C</th>
                    <th>%Si</th>
                    <th>%Mn</th>
                    <th>%P</th>
                    <th>%S</th>
                    <th>Grain Size</th>
                    <th>Hardness ( HBW/HRC/HV )</th>
                    <th>Decarb (mm)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Ladle Values Row - Fetched from RM Chemical Analysis Table */}
                  <tr style={{ background: '#fffbeb' }}>
                    <td style={{ fontWeight: 600, color: '#92400e' }}>
                      Ladle Values
                      {isLoadingLadle && <span style={{ fontSize: '0.75rem', marginLeft: '8px', color: '#92400e' }}>(Loading...)</span>}
                    </td>
                    <td style={{ color: '#92400e', fontWeight: 500 }}>{formatLadleValue(currentLadleHeat.percentC)}</td>
                    <td style={{ color: '#92400e', fontWeight: 500 }}>{formatLadleValue(currentLadleHeat.percentSi)}</td>
                    <td style={{ color: '#92400e', fontWeight: 500 }}>{formatLadleValue(currentLadleHeat.percentMn)}</td>
                    <td style={{ color: '#92400e', fontWeight: 500 }}>{formatLadleValue(currentLadleHeat.percentP)}</td>
                    <td style={{ color: '#92400e', fontWeight: 500 }}>{formatLadleValue(currentLadleHeat.percentS)}</td>
                    <td style={{ color: '#94a3b8', fontStyle: 'italic' }}>N/A</td>
                    <td style={{ color: '#94a3b8', fontStyle: 'italic' }}>N/A</td>
                    <td style={{ color: '#94a3b8', fontStyle: 'italic' }}>N/A</td>
                  </tr>
                  {[0, 1].map(sampleIndex => {
                    const activeHeatNo = (heats[activeHeatTab]?.heatNo || heats[activeHeatTab]?.heat_no || `Heat-${activeHeatTab + 1}`).toString().trim().toUpperCase();
                    const sample = materialData[activeHeatNo]?.samples[sampleIndex] || {};
                    return (
                      <tr key={sampleIndex}>
                        <td data-label="Sample"><strong>Sample {sampleIndex + 1}</strong></td>
                        <td data-label="%C">
                          <input type="number" step="0.001" className={`form-control ${getValueStatus('c', sample.c, currentLadleHeat.percentC)}`} value={sample.c} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'c', e.target.value)} />
                        </td>
                        <td data-label="%Si">
                          <input type="number" step="0.001" className={`form-control ${getValueStatus('si', sample.si, currentLadleHeat.percentSi)}`} value={sample.si} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'si', e.target.value)} />
                        </td>
                        <td data-label="%Mn">
                          <input type="number" step="0.001" className={`form-control ${getValueStatus('mn', sample.mn, currentLadleHeat.percentMn)}`} value={sample.mn} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'mn', e.target.value)} />
                        </td>
                        <td data-label="%P">
                          <input type="number" step="0.001" className={`form-control ${getValueStatus('p', sample.p, currentLadleHeat.percentP)}`} value={sample.p} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'p', e.target.value)} />
                        </td>
                        <td data-label="%S">
                          <input type="number" step="0.001" className={`form-control ${getValueStatus('s', sample.s, currentLadleHeat.percentS)}`} value={sample.s} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 's', e.target.value)} />
                        </td>
                        <td data-label="Grain Size">
                          <input type="number" step="1" className={`form-control ${getValueStatus('grainSize', sample.grainSize)}`} value={sample.grainSize} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'grainSize', e.target.value)} />
                        </td>
                        <td data-label="Hardness">
                          <input type="number" step="1" className={`form-control ${getValueStatus('hardness', sample.hardness)}`} value={sample.hardness} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'hardness', e.target.value)} />
                        </td>
                        <td data-label="Decarb">
                          <input type="number" step="0.01" className={`form-control ${getValueStatus('decarb', sample.decarb)}`} value={sample.decarb} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'decarb', e.target.value)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Inclusion Rating Section */}
            <div className="inclusion-section">
              <h5 className="inclusion-section-title">Inclusion Rating (Type)</h5>
              {[0, 1].map(sampleIndex => {
                const activeHeatNo = (heats[activeHeatTab]?.heatNo || heats[activeHeatTab]?.heat_no || `Heat-${activeHeatTab + 1}`).toString().trim().toUpperCase();
                const sample = materialData[activeHeatNo]?.samples[sampleIndex] || {};
                return (
                  <div key={sampleIndex} className="inclusion-sample-card">
                    <div className="inclusion-sample-label">Sample {sampleIndex + 1}</div>
                    <div className="inclusion-rating-grid">
                      {['A', 'B', 'C', 'D'].map(type => {
                        const fieldName = `incl${type}`;
                        const fieldValue = sample[fieldName];
                        return (
                          <div key={type} className="inclusion-rating-item">
                            <label className="inclusion-rating-label">
                              Inclusion ({type}) <span className="required-star">*</span>
                            </label>
                            <div className="inclusion-rating-inputs">
                              <select className="form-control" value={sample[`inclType${type}`]} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, `inclType${type}`, e.target.value)}>
                                <option value="">Type</option>
                                <option value="Thick">Thick</option>
                                <option value="Thin">Thin</option>
                              </select>
                              <input
                                type="number"
                                step="0.1"
                                className={`form-control ${getValueStatus(fieldName, fieldValue)}`}
                                max="2.0"
                                value={fieldValue}
                                onChange={(e) => updateMaterialField(heatIndex, sampleIndex, fieldName, e.target.value)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialTestingPage;

