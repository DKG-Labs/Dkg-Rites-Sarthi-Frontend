import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Tabs from '../components/Tabs';

// Responsive styles for the page
const pageStyles = `
  :root {
    --defect-gap-matching: 8px;
    --defect-gap-non-matching: 28px;
  }

  .submodule-page-container {
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .submodule-page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #e2e8f0;
  }

  .submodule-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 500;
    color: #3b82f6;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .submodule-back-btn:hover {
    background: #dbeafe;
    border-color: #93c5fd;
  }

  .submodule-page-title {
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }

  /* 3-column grid layout */
  .vm-form-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 20px;
  }

  .vm-form-group {
    display: flex;
    flex-direction: column;
  }

  .vm-form-label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
  }

  .vm-form-input {
    width: 100%;
    min-height: 44px;
    padding: 10px 14px;
    font-size: 14px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background-color: #ffffff;
    box-sizing: border-box;
  }

  .vm-form-input:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
  }

  .vm-form-hint {
    font-size: 12px;
    color: #6b7280;
    margin-top: 4px;
  }

  .dimensional-samples-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin-top: 12px;
  }

  .dimensional-sample-card {
    padding: 12px;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .dimensional-sample-card .vm-form-input {
    min-height: 36px;
    font-size: 13px;
    padding: 8px 10px;
  }

  .visual-defect-row {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
    background: #ffffff;
    transition: border-color 0.25s ease, background-color 0.25s ease;
  }

  .visual-defect-row.matching {
    border-color: #d1fae5;
    background: #f0fdf4;
  }

  .visual-defect-row input[type="checkbox"] {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    margin-right: 8px;
  }

  .visual-defect-row label {
    margin-right: 8px;
    white-space: nowrap;
    font-weight: 500;
    color: #1f2937;
  }

  @media (max-width: 1024px) {
    .vm-form-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .dimensional-samples-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 768px) {
    .submodule-page-container {
      padding: 16px;
    }

    .submodule-page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .visual-defect-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      width: 100%;
    }

    :root {
      --defect-gap-matching: 6px;
      --defect-gap-non-matching: 20px;
    }

    .submodule-back-btn {
      width: 100%;
      justify-content: center;
    }

    .submodule-page-title {
      font-size: 20px;
    }

    .vm-form-grid {
      grid-template-columns: 1fr;
    }

    .vm-form-input {
      font-size: 16px;
      min-height: 48px;
    }

    .dimensional-samples-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 480px) {
    .submodule-page-title {
      font-size: 18px;
    }

    .dimensional-samples-grid {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
  }

  /* ===== Material Testing Responsive Styles ===== */

  /* Desktop: Make table fit screen without horizontal scroll */
  .material-testing-table-wrapper {
    width: 100%;
    overflow-x: visible;
  }

  .material-testing-table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
  }

  .material-testing-table th,
  .material-testing-table td {
    padding: 10px 8px;
    text-align: center;
    border-bottom: 1px solid #e5e7eb;
    font-size: 14px;
  }

  .material-testing-table th {
    background: #f8fafc;
    font-weight: 600;
    font-size: 13px;
    color: #475569;
    white-space: nowrap;
  }

  .material-testing-table th:first-child {
    width: 60px;
  }

  .material-testing-table .form-control {
    width: 100%;
    min-width: 0;
    padding: 8px 6px;
    font-size: 14px;
    text-align: center;
  }

  /* Inclusion Rating Grid - Desktop */
  .inclusion-rating-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .inclusion-rating-item {
    display: flex;
    flex-direction: column;
  }

  .inclusion-rating-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 6px;
    color: #64748b;
  }

  .inclusion-rating-inputs {
    display: flex;
    gap: 8px;
  }

  .inclusion-rating-inputs .form-control {
    flex: 1;
    min-width: 0;
  }

  /* Tablet: 2 columns for inclusion */
  @media (max-width: 1024px) {
    .inclusion-rating-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Mobile: Card-based layout for Material Testing */
  @media (max-width: 768px) {
    .material-testing-table-wrapper {
      overflow: visible;
    }

    .material-testing-table {
      display: block;
    }

    .material-testing-table thead {
      display: none;
    }

    .material-testing-table tbody {
      display: block;
    }

    .material-testing-table tbody tr {
      display: block;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .material-testing-table tbody td {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border: none;
      border-bottom: 1px solid #f1f5f9;
    }

    .material-testing-table tbody td:last-child {
      border-bottom: none;
    }

    .material-testing-table tbody td::before {
      content: attr(data-label);
      font-weight: 600;
      color: #475569;
      font-size: 13px;
      flex-shrink: 0;
      margin-right: 12px;
      min-width: 120px;
    }

    .material-testing-table tbody td .form-control {
      width: 120px;
      flex-shrink: 0;
    }

    /* Inclusion Rating - Mobile: 1 column */
    .inclusion-rating-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .inclusion-rating-item {
      background: #f8fafc;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .inclusion-rating-label {
      font-size: 14px;
      margin-bottom: 8px;
    }

    .inclusion-rating-inputs {
      gap: 12px;
    }

    .inclusion-rating-inputs .form-control {
      min-height: 44px;
      font-size: 16px;
    }
  }

  @media (max-width: 480px) {
    .material-testing-table tbody td::before {
      min-width: 100px;
      font-size: 12px;
    }

    .material-testing-table tbody td .form-control {
      width: 100px;
    }
  }
`;

const VisualMaterialTestingPage = ({ onBack, heats = [], productModel = 'ERC-12' }) => {
  const [activeTab, setActiveTab] = useState('visual');
  const [activeHeatTab, setActiveHeatTab] = useState(0);

  const tabs = [
    { id: 'visual', label: 'Visual & Dimensional Check' },
    { id: 'material', label: 'Material Testing' },
    { id: 'packing', label: 'Packing & Storage Verification' },
  ];

  // Visual Defects List
  const defectList = useMemo(() => ([
    'No Defect', 'Distortion', 'Twist', 'Kink', 'Not Straight', 'Fold',
    'Lap', 'Crack', 'Pit', 'Groove', 'Excessive Scaling', 'Internal Defect (Piping, Segregation)'
  ]), []);

  // Per-heat Visual & Dimensional state
  const [heatVisualData, setHeatVisualData] = useState(() => (
    heats.map(() => ({
      selectedDefects: defectList.reduce((acc, d) => { acc[d] = false; return acc; }, {}),
      defectCounts: defectList.reduce((acc, d) => { acc[d] = ''; return acc; }, {}),
      dimSamples: Array.from({ length: 20 }).map(() => ({ diameter: '' })),
    }))
  ));

  // Keep heatVisualData in sync when heats change
  useEffect(() => {
    setHeatVisualData(prev => {
      const next = heats.map((_, idx) => prev[idx] || {
        selectedDefects: defectList.reduce((acc, d) => { acc[d] = false; return acc; }, {}),
        defectCounts: defectList.reduce((acc, d) => { acc[d] = ''; return acc; }, {}),
        dimSamples: Array.from({ length: 20 }).map(() => ({ diameter: '' })),
      });
      if (activeHeatTab >= heats.length) setActiveHeatTab(Math.max(0, heats.length - 1));
      return next;
    });
  }, [heats, defectList, activeHeatTab]);

  // Defect handlers
  const handleDefectToggle = useCallback((defectName) => {
    setHeatVisualData(prev => {
      const next = [...prev];
      const hv = { ...next[activeHeatTab] };
      const sel = { ...hv.selectedDefects };
      const counts = { ...hv.defectCounts };
      if (defectName === 'No Defect') {
        // Toggle No Defect - if already selected, deselect it
        if (sel['No Defect']) {
          sel['No Defect'] = false;
        } else {
          // Selecting No Defect clears all other defects
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

  const handleDimSampleChange = useCallback((idx, value) => {
    setHeatVisualData(prev => {
      const next = [...prev];
      const hv = { ...next[activeHeatTab] };
      const samples = [...hv.dimSamples];
      samples[idx] = { ...samples[idx], diameter: value };
      hv.dimSamples = samples;
      next[activeHeatTab] = hv;
      return next;
    });
  }, [activeHeatTab]);

  // Standard diameter derived from product model
  const standardDiameter = useMemo(() => {
    const modelNum = productModel.match(/\d+/)?.[0];
    const parsed = modelNum ? parseFloat(modelNum) : NaN;
    return Number.isNaN(parsed) ? '' : parsed;
  }, [productModel]);

  // Material testing state
  const [materialData, setMaterialData] = useState(() => heats.map(() => ({
    samples: [
      { c: '', si: '', mn: '', p: '', s: '', grainSize: '', inclTypeA: '', inclA: '', inclTypeB: '', inclB: '', inclTypeC: '', inclC: '', inclTypeD: '', inclD: '', hardness: '', decarb: '', remarks: '' },
      { c: '', si: '', mn: '', p: '', s: '', grainSize: '', inclTypeA: '', inclA: '', inclTypeB: '', inclB: '', inclTypeC: '', inclC: '', inclTypeD: '', inclD: '', hardness: '', decarb: '', remarks: '' }
    ]
  })));

  const updateMaterialField = (heatIndex, sampleIndex, field, value) => {
    setMaterialData(prev => {
      const next = [...prev];
      next[heatIndex] = { ...next[heatIndex], samples: [...next[heatIndex].samples] };
      next[heatIndex].samples[sampleIndex] = { ...next[heatIndex].samples[sampleIndex], [field]: value };
      return next;
    });
  };

  // Packing & Storage Verification state
  const [packingData, setPackingData] = useState({
    isPaintMarkingAvailable: false,
    paintMarkingRemarks: '',
    areBarStoredHeatWise: false,
    areBarsBundled: false,
    isMetalTagPresent: false,
    packingRemarks: '',
  });

  const [packingErrors, setPackingErrors] = useState({
    paintMarkingRemarks: false,
    packingRemarks: false,
  });

  const [packingSubmitted, setPackingSubmitted] = useState(false);

  const handlePackingChange = (field, value) => {
    setPackingData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (field === 'paintMarkingRemarks' || field === 'packingRemarks') {
      if (value.trim()) {
        setPackingErrors(prev => ({ ...prev, [field]: false }));
      }
    }
  };

  const validatePackingForm = () => {
    const errors = {
      paintMarkingRemarks: !packingData.paintMarkingRemarks.trim(),
      packingRemarks: !packingData.packingRemarks.trim(),
    };
    setPackingErrors(errors);
    return !errors.paintMarkingRemarks && !errors.packingRemarks;
  };

  const handlePackingSubmit = () => {
    if (validatePackingForm()) {
      setPackingSubmitted(true);
      const jsonOutput = {
        isPaintMarkingAvailable: packingData.isPaintMarkingAvailable,
        paintMarkingRemarks: packingData.paintMarkingRemarks,
        areBarStoredHeatWise: packingData.areBarStoredHeatWise,
        areBarsBundled: packingData.areBarsBundled,
        isMetalTagPresent: packingData.isMetalTagPresent,
        packingRemarks: packingData.packingRemarks,
      };
      console.log('Packing & Storage Verification Data:', JSON.stringify(jsonOutput, null, 2));
      alert('Packing & Storage data saved successfully!\n\nCheck console for JSON output.');
      return jsonOutput;
    }
    return null;
  };

  return (
    <div className="submodule-page-container">
      <style>{pageStyles}</style>

      <div className="submodule-page-header">
        <h1 className="submodule-page-title">🔬 Visual & Material Testing</h1>
        <button className="submodule-back-btn" onClick={onBack}>
          ← Back to Sub Module Session
        </button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'visual' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Visual &amp; Dimensional Check (20 samples per Heat)</h3>
            <p className="card-subtitle">Raw Material Specific - Check for material defects and dimensional accuracy</p>
          </div>

          {/* Heat selector buttons */}
          <div style={{ marginBottom: '20px' }}>
            {(() => {
              // Check if all heats have the same heat number
              const uniqueHeatNumbers = new Set(heats.map(h => h.heatNo || h.heat_no));
              const hasSingleUniqueHeat = uniqueHeatNumbers.size === 1;

              if (hasSingleUniqueHeat) {
                return (
                  <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#166534' }}>{`Heat ${heats[0].heatNo || `#1`}`}</span>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
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

            {/* Visual Defects Checklist */}
            <h4 style={{ marginBottom: '12px' }}>Visual Defects Checklist</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
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
                    <div key={d} className={rowClassName}>
                      <input
                        type="checkbox"
                        id={`defect-${d}`}
                        checked={!!checked}
                        onChange={() => handleDefectToggle(d)}
                        disabled={disabled}
                      />
                      <label htmlFor={`defect-${d}`} style={{ minWidth: '100px' }}>{d}</label>
                      {!isNoDefect && selected[d] && (
                        <input
                          type="number"
                          className="form-control"
                          style={{ width: '140px', marginLeft: '0' }}
                          value={counts[d]}
                          onChange={(e) => handleDefectCountChange(d, e.target.value)}
                          placeholder={`${d} Count`}
                          min="0"
                        />
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Dimensional Check - 3 column grid */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '16px' }}>Standard Diameter</h4>
            <div className="vm-form-grid">
              <div className="vm-form-group">
                <label className="vm-form-label">Product Model</label>
                <input type="text" className="vm-form-input" value={productModel} disabled />
              </div>
              <div className="vm-form-group">
                <label className="vm-form-label">Standard Rod Diameter (mm)</label>
                <input type="text" className="vm-form-input" value={standardDiameter || 'NA'} disabled />
              </div>
            </div>
          </div>

          {/* Dimensional Samples Grid */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '16px' }}>Dimensional Check (20 samples)</h4>
            <div className="dimensional-samples-grid">
              {(() => {
                const hv = heatVisualData[activeHeatTab] || {};
                const samples = hv.dimSamples || [];
                return samples.map((s, idx) => (
                  <div key={idx} className="vm-form-group dimensional-sample-card">
                    <label className="vm-form-label" style={{ marginBottom: '8px' }}>
                      Sample {idx + 1}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="vm-form-input"
                      value={s.diameter}
                      onChange={(e) => handleDimSampleChange(idx, e.target.value)}
                      placeholder="Bar Diameter (mm)"
                    />
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'material' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Material Testing (2 samples per Heat)</h3>
            <p className="card-subtitle">Chemical Analysis &amp; Mechanical Properties - Raw Material Specific</p>
          </div>
          <div className="alert alert-info" style={{ marginBottom: '24px' }}>
            ℹ️ Calibration status of testing instruments is verified and valid
          </div>

          {heats.map((heat, heatIndex) => (
              <div key={heatIndex} style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4>Heat: {heat.heatNo || `#${heatIndex + 1}`} — Material Testing (2 samples)</h4>
                </div>

                {/* Chemical Composition & Mechanical Properties Table */}
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
                        <th>Hardness (HRC)</th>
                        <th>Decarb (mm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[0, 1].map(sampleIndex => {
                        const sample = materialData[heatIndex]?.samples[sampleIndex] || {};
                        return (
                          <tr key={sampleIndex}>
                            <td data-label="Sample"><strong>Sample {sampleIndex + 1}</strong></td>
                            <td data-label="%C (Carbon)">
                              <input type="number" step="0.01" className="form-control" required
                                value={sample.c} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'c', e.target.value)} />
                            </td>
                            <td data-label="%Si (Silicon)">
                              <input type="number" step="0.01" className="form-control" required
                                value={sample.si} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'si', e.target.value)} />
                            </td>
                            <td data-label="%Mn (Manganese)">
                              <input type="number" step="0.01" className="form-control" required
                                value={sample.mn} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'mn', e.target.value)} />
                            </td>
                            <td data-label="%P (Phosphorus)">
                              <input type="number" step="0.01" className="form-control" required
                                value={sample.p} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'p', e.target.value)} />
                            </td>
                            <td data-label="%S (Sulphur)">
                              <input type="number" step="0.01" className="form-control" required
                                value={sample.s} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 's', e.target.value)} />
                            </td>
                            <td data-label="Grain Size (≥6)">
                              <input type="number" step="1" className="form-control" required min="6"
                                value={sample.grainSize} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'grainSize', e.target.value)}
                                placeholder="≥6" />
                            </td>
                            <td data-label="Hardness (HRC)">
                              <input type="number" step="1" className="form-control" required
                                value={sample.hardness} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'hardness', e.target.value)} />
                            </td>
                            <td data-label="Decarb (≤0.25mm)">
                              <input type="number" step="0.01" className="form-control" required max="0.25"
                                value={sample.decarb} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'decarb', e.target.value)}
                                placeholder="≤0.25" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Inclusion Rating (Type) - Separate Section */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h5 style={{ marginBottom: '16px', color: '#334155' }}>Inclusion Rating (Type)</h5>

                  {[0, 1].map(sampleIndex => {
                    const sample = materialData[heatIndex]?.samples[sampleIndex] || {};
                    return (
                      <div key={sampleIndex} style={{ marginBottom: sampleIndex === 0 ? '16px' : '0', padding: '12px', background: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontWeight: '600', marginBottom: '12px', color: '#475569' }}>Sample {sampleIndex + 1}</div>
                        <div className="inclusion-rating-grid">
                          {/* Inclusion A */}
                          <div className="inclusion-rating-item">
                            <label className="inclusion-rating-label">
                              Inclusion Rating (A) <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div className="inclusion-rating-inputs">
                              <select className="form-control" required
                                value={sample.inclTypeA} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'inclTypeA', e.target.value)}>
                                <option value="">Type</option>
                                <option value="Thick">Thick</option>
                                <option value="Thin">Thin</option>
                              </select>
                              <input type="number" step="0.1" className="form-control" required max="2.0"
                                value={sample.inclA} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'inclA', e.target.value)}
                                placeholder="≤2.0" />
                            </div>
                          </div>

                          {/* Inclusion B */}
                          <div className="inclusion-rating-item">
                            <label className="inclusion-rating-label">
                              Inclusion Rating (B) <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div className="inclusion-rating-inputs">
                              <select className="form-control" required
                                value={sample.inclTypeB} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'inclTypeB', e.target.value)}>
                                <option value="">Type</option>
                                <option value="Thick">Thick</option>
                                <option value="Thin">Thin</option>
                              </select>
                              <input type="number" step="0.1" className="form-control" required max="2.0"
                                value={sample.inclB} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'inclB', e.target.value)}
                                placeholder="≤2.0" />
                            </div>
                          </div>

                          {/* Inclusion C */}
                          <div className="inclusion-rating-item">
                            <label className="inclusion-rating-label">
                              Inclusion Rating (C) <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div className="inclusion-rating-inputs">
                              <select className="form-control" required
                                value={sample.inclTypeC} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'inclTypeC', e.target.value)}>
                                <option value="">Type</option>
                                <option value="Thick">Thick</option>
                                <option value="Thin">Thin</option>
                              </select>
                              <input type="number" step="0.1" className="form-control" required max="2.0"
                                value={sample.inclC} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'inclC', e.target.value)}
                                placeholder="≤2.0" />
                            </div>
                          </div>

                          {/* Inclusion D */}
                          <div className="inclusion-rating-item">
                            <label className="inclusion-rating-label">
                              Inclusion Rating (D) <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div className="inclusion-rating-inputs">
                              <select className="form-control" required
                                value={sample.inclTypeD} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'inclTypeD', e.target.value)}>
                                <option value="">Type</option>
                                <option value="Thick">Thick</option>
                                <option value="Thin">Thin</option>
                              </select>
                              <input type="number" step="0.1" className="form-control" required max="2.0"
                                value={sample.inclD} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'inclD', e.target.value)}
                                placeholder="≤2.0" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            ))}
        </div>
      )}

      {/* Packing & Storage Verification Tab */}
      {activeTab === 'packing' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📦 Packing & Storage Verification</h3>
            <p className="card-subtitle">Verify packing conditions and storage compliance</p>
          </div>

          <div style={{ padding: '20px' }}>
            {/* Checkbox Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>

              {/* 1. Is Paint Marking available at end of Bars */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <input
                  type="checkbox"
                  id="isPaintMarkingAvailable"
                  checked={packingData.isPaintMarkingAvailable}
                  onChange={(e) => handlePackingChange('isPaintMarkingAvailable', e.target.checked)}
                  style={{ width: '20px', height: '20px', marginTop: '2px', cursor: 'pointer' }}
                />
                <label htmlFor="isPaintMarkingAvailable" style={{ fontSize: '15px', fontWeight: '500', color: '#334155', cursor: 'pointer' }}>
                  Is Paint Marking available at end of Bars
                </label>
              </div>

              {/* 2. Paint Marking at End of Bars – Remarks (Required) */}
              <div style={{ padding: '16px', background: '#fff', borderRadius: '8px', border: packingErrors.paintMarkingRemarks ? '1px solid #ef4444' : '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>
                  Paint Marking at End of Bars – Remarks <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={packingData.paintMarkingRemarks}
                  onChange={(e) => handlePackingChange('paintMarkingRemarks', e.target.value)}
                  placeholder="Enter remarks about paint marking..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    border: packingErrors.paintMarkingRemarks ? '1px solid #ef4444' : '1px solid #d1d5db',
                    resize: 'vertical'
                  }}
                  required
                />
                {packingErrors.paintMarkingRemarks && (
                  <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    ⚠ This field is required
                  </span>
                )}
              </div>

              {/* 3. Are Bars stored in heat wise stacks */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <input
                  type="checkbox"
                  id="areBarStoredHeatWise"
                  checked={packingData.areBarStoredHeatWise}
                  onChange={(e) => handlePackingChange('areBarStoredHeatWise', e.target.checked)}
                  style={{ width: '20px', height: '20px', marginTop: '2px', cursor: 'pointer' }}
                />
                <label htmlFor="areBarStoredHeatWise" style={{ fontSize: '15px', fontWeight: '500', color: '#334155', cursor: 'pointer' }}>
                  Are Bars stored in heat wise stacks
                </label>
              </div>

              {/* 4. Are bars bundled with binding wires & packing strips */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <input
                  type="checkbox"
                  id="areBarsBundled"
                  checked={packingData.areBarsBundled}
                  onChange={(e) => handlePackingChange('areBarsBundled', e.target.checked)}
                  style={{ width: '20px', height: '20px', marginTop: '2px', cursor: 'pointer' }}
                />
                <label htmlFor="areBarsBundled" style={{ fontSize: '15px', fontWeight: '500', color: '#334155', cursor: 'pointer', lineHeight: '1.5' }}>
                  Are bars bundled with binding wires &amp; packing strips at minimum 3 locations having manufacturer's seal/name/logo/code
                </label>
              </div>

              {/* 5. Is Metal Tag present */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <input
                  type="checkbox"
                  id="isMetalTagPresent"
                  checked={packingData.isMetalTagPresent}
                  onChange={(e) => handlePackingChange('isMetalTagPresent', e.target.checked)}
                  style={{ width: '20px', height: '20px', marginTop: '2px', cursor: 'pointer' }}
                />
                <label htmlFor="isMetalTagPresent" style={{ fontSize: '15px', fontWeight: '500', color: '#334155', cursor: 'pointer', lineHeight: '1.5' }}>
                  Is Metal Tag present with PO Number, Heat Number, Date, Grade, Size &amp; Length
                </label>
              </div>

              {/* 6. Packing Remarks (Required) */}
              <div style={{ padding: '16px', background: '#fff', borderRadius: '8px', border: packingErrors.packingRemarks ? '1px solid #ef4444' : '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>
                  Packing Remarks <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={packingData.packingRemarks}
                  onChange={(e) => handlePackingChange('packingRemarks', e.target.value)}
                  placeholder="Enter packing remarks..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    border: packingErrors.packingRemarks ? '1px solid #ef4444' : '1px solid #d1d5db',
                    resize: 'vertical'
                  }}
                  required
                />
                {packingErrors.packingRemarks && (
                  <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    ⚠ This field is required
                  </span>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={handlePackingSubmit}
                style={{
                  padding: '12px 32px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#fff',
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => e.target.style.background = '#1d4ed8'}
                onMouseOut={(e) => e.target.style.background = '#2563eb'}
              >
                Save Packing & Storage Data
              </button>
            </div>

            {/* Success Message */}
            {packingSubmitted && (
              <div style={{ marginTop: '16px', padding: '12px 16px', background: '#d1fae5', border: '1px solid #10b981', borderRadius: '8px', color: '#065f46' }}>
                ✅ Packing & Storage Verification data saved successfully!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualMaterialTestingPage;

