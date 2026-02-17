import { useState, useMemo, useEffect, useCallback } from 'react';
import RawMaterialSubmoduleNav from '../components/RawMaterialSubmoduleNav';
import './RawMaterialDimensionalPage.css';

const STORAGE_KEY = 'dimensional_check_draft_data';

// Standard Rod Diameter and Tolerance values based on Product Model
const PRODUCT_SPECS = {
  'MK-III': {
    standardDiameter: 20.64,
    toleranceMin: 20.47,
    toleranceMax: 20.84
  },
  'MK-V': {
    standardDiameter: 23,
    toleranceMin: 22.81,
    toleranceMax: 23.23
  }
};

/**
 * Dimensional Check Page - Raw Material Sub-module
 * Handles dimensional samples (20 samples per heat)
 * Data persists while switching submodules until user submits
 */
const RawMaterialDimensionalPage = ({ onBack, heats = [], productModel = 'MK-III', onNavigateSubmodule, inspectionCallNo = '' }) => {
  const [activeHeatTab, setActiveHeatTab] = useState(0);

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

  // Per-heat Dimensional state (20 samples per heat)
  const [heatDimData, setHeatDimData] = useState(() => {
    const draft = loadDraftData();
    if (draft?.heatDimData) {
      return draft.heatDimData;
    }
    return heats.map(() => ({
      dimSamples: Array.from({ length: 20 }).map(() => ({ diameter: '' })),
    }));
  });

  // Keep heatDimData in sync when heats change
  useEffect(() => {
    setHeatDimData(prev => {
      const next = heats.map((_, idx) => prev[idx] || {
        dimSamples: Array.from({ length: 20 }).map(() => ({ diameter: '' })),
      });
      if (activeHeatTab >= heats.length) setActiveHeatTab(Math.max(0, heats.length - 1));
      return next;
    });
  }, [heats, activeHeatTab]);

  const handleDimSampleChange = useCallback((idx, value) => {
    setHeatDimData(prev => {
      const next = [...prev];
      const hd = { ...next[activeHeatTab] };
      const samples = [...hd.dimSamples];
      samples[idx] = { ...samples[idx], diameter: value };
      hd.dimSamples = samples;
      next[activeHeatTab] = hd;
      return next;
    });
  }, [activeHeatTab]);

  // Normalize product model to match keys (e.g., "MK-III" or "MK-V")
  const normalizedModel = useMemo(() => {
    const model = (productModel || '').toUpperCase();
    if (model.includes('III') || model.includes('3')) return 'MK-III';
    if (model.includes('V') || model.includes('5')) return 'MK-V';
    return 'MK-III'; // Default to MK-III
  }, [productModel]);

  // Get specs for current product model
  const specs = PRODUCT_SPECS[normalizedModel] || PRODUCT_SPECS['MK-III'];

  // Standard diameter derived from product model
  const standardDiameter = specs.standardDiameter;

  // Validate sample value against tolerance range
  const validateSample = useCallback((value) => {
    if (!value || value === '') return null; // No validation for empty values
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;
    if (numValue >= specs.toleranceMin && numValue <= specs.toleranceMax) {
      return 'valid'; // Within tolerance - green
    }
    return 'invalid'; // Outside tolerance - red
  }, [specs.toleranceMin, specs.toleranceMax]);

  // Auto-save to localStorage (persist while switching submodules)
  useEffect(() => {
    const storageKey = `${STORAGE_KEY}_${inspectionCallNo}`;
    const draftData = { heatDimData };
    localStorage.setItem(storageKey, JSON.stringify(draftData));
  }, [heatDimData, inspectionCallNo]);

  return (
    <div className="dimensional-page-container">
      <div className="dimensional-page-header">
        <h1 className="dimensional-page-title">📐 Dimensional Check</h1>
        <button className="dimensional-back-btn" onClick={onBack}>
          ← Back to Raw Material Dashboard
        </button>
      </div>

      {/* Submodule Navigation */}
      <RawMaterialSubmoduleNav
        currentSubmodule="dimensional-check"
        onNavigate={onNavigateSubmodule}
      />

      <div className="card">
          <div className="card-header">
            <h3 className="card-title">Dimensional Check (20 samples per Heat)</h3>
            <p className="card-subtitle">Check dimensional accuracy of raw material bars</p>
          </div>

          {/* Heat selector buttons */}
          {(() => {
            // Check if all heats have the same heat number
            const uniqueHeatNumbers = new Set(heats.map(h => h.heatNo || h.heat_no));
            const hasSingleUniqueHeat = uniqueHeatNumbers.size === 1;

            if (hasSingleUniqueHeat) {
              return (
                <div className="dim-heat-selector dim-heat-single">
                  <span className="dim-heat-single-label">{`Heat ${heats[0].heatNo || `#1`}`}</span>
                </div>
              );
            }

            return (
              <div className="dim-heat-selector">
                {heats.map((h, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={idx === activeHeatTab ? 'btn btn-primary' : 'btn btn-outline'}
                    onClick={() => setActiveHeatTab(idx)}
                  >
                    {`Heat ${h.heatNo || `#${idx + 1}`}`}
                  </button>
                ))}
              </div>
            );
          })()}

          {/* Standard Diameter Info */}
          <div className="dim-form-grid">
            <div className="dim-form-group">
              <label className="dim-form-label">Product Model</label>
              <input type="text" className="dim-form-input" value={productModel} disabled />
            </div>
            <div className="dim-form-group">
              <label className="dim-form-label">Standard Rod Diameter (mm)</label>
              <input type="text" className="dim-form-input" value={standardDiameter} disabled />
            </div>
            <div className="dim-form-group">
              <label className="dim-form-label">Tolerance Range (mm)</label>
              <input
                type="text"
                className="dim-form-input"
                value={`${specs.toleranceMin} - ${specs.toleranceMax}`}
                disabled
              />
            </div>
          </div>

          {/* Acceptance Criteria Info Box */}
          {/* <div style={{
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
                <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Green</span> — Value within {specs.toleranceMin} - {specs.toleranceMax} mm
                <span style={{ margin: '0 12px', color: '#94a3b8' }}>|</span>
                <span style={{ color: '#dc2626', fontWeight: 600 }}>✗ Red</span> — Value outside tolerance range
              </p>
            </div>
          </div> */}

          {/* Dimensional Samples Grid */}
          <h4 style={{ marginBottom: '16px', marginTop: '20px' }}>Dimensional Check (20 samples)</h4>
          <div className="dimensional-samples-grid">
            {(() => {
              const hd = heatDimData[activeHeatTab] || {};
              const samples = hd.dimSamples || [];
              return samples.map((s, idx) => {
                // Handle null or undefined sample objects
                const sample = s || { diameter: '' };
                const validationStatus = validateSample(sample.diameter);
                const inputClassName = `dim-form-input${validationStatus === 'valid' ? ' dim-input--valid' : ''}${validationStatus === 'invalid' ? ' dim-input--invalid' : ''}`;
                return (
                  <div key={idx} className="dim-form-group dimensional-sample-card">
                    <label className="dim-form-label" style={{ marginBottom: '8px' }}>
                      Sample {idx + 1}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className={inputClassName}
                      value={sample.diameter}
                      onChange={(e) => handleDimSampleChange(idx, e.target.value)}
                      placeholder="Bar Diameter (mm)"
                    />
                  </div>
                );
              });
            })()}
          </div>
        </div>
    </div>
  );
};

export default RawMaterialDimensionalPage;

