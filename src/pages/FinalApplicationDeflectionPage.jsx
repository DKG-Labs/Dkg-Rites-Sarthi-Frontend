import { useMemo, useState, useEffect, useRef } from "react";
import { useInspection } from "../context/InspectionContext";
import FinalSubmoduleNav from '../components/FinalSubmoduleNav';
import { getDimensionWeightAQL } from '../utils/is2500Calculations';
import {
  getDimensionalInspectionByCallNo,
  getApplicationDeflectionByCallNo
} from '../services/finalInspectionSubmoduleService';
import "./FinalApplicationDeflectionPage.css";

const FinalApplicationDeflectionPage = ({ onBack, onNavigateSubmodule }) => {
  // Get live lot data from context
  const { getFpCachedData, selectedCall } = useInspection();

  // Get the call number - use selectedCall or fallback to sessionStorage
  const callNo = selectedCall?.call_no || sessionStorage.getItem('selectedCallNo');

  // Get cached dashboard data with fallback to sessionStorage
  const cachedData = getFpCachedData(callNo);

  // Memoize lotsFromVendor to ensure stable reference for useMemo dependency
  const lotsFromVendor = useMemo(() => {
    let lots = cachedData?.dashboardData?.finalLotDetails || [];

    // Fallback: Check sessionStorage directly if context cache is empty
    if (lots.length === 0 && callNo) {
      try {
        const storedCache = sessionStorage.getItem('fpDashboardDataCache');
        if (storedCache) {
          const cacheData = JSON.parse(storedCache);
          lots = cacheData[callNo]?.finalLotDetails || [];
        }
      } catch (e) {
        console.error('Error reading from sessionStorage:', e);
      }
    }
    return lots;
  }, [cachedData, callNo]);

  /* Active tab state */
  const [activeTab, setActiveTab] = useState('dimension');

  /* Build lot data with IS 2500 Table 2 - Dimension & Weight (AQL 2.5) */
  const lotsData = useMemo(() => lotsFromVendor.map(lot => {
    const lotNo = lot.lotNo || lot.lotNumber;
    const heatNo = lot.heatNo || lot.heatNumber;
    const quantity = lot.lotSize || lot.offeredQty || 0;

    const aql = getDimensionWeightAQL(quantity);
    return {
      lotNo,
      heatNo,
      quantity,
      sampleSize: aql.n1,
      sampleSize2nd: aql.n2,
      accpNo: aql.ac1,
      rejNo: aql.re1,
      cummRejNo: aql.cummRej,
      useSingleSampling: aql.useSingleSampling
    };
  }), [lotsFromVendor]);

  // Track if we've already loaded data to prevent infinite loops
  const dataLoadedRef = useRef(false);

  /* State for all lots - both dimension and deflection data */
  const [lotStates, setLotStates] = useState(() => {
    // Try to load persisted data first
    const persistedData = localStorage.getItem(`deflectionTestData_${callNo}`);

    if (persistedData) {
      try {
        return JSON.parse(persistedData);
      } catch (e) {
        console.error('Error parsing persisted deflection test data:', e);
      }
    }

    // Return empty object - will be initialized in useEffect when lotsData is available
    return {};
  });

  // Load data from database or localStorage when page loads
  useEffect(() => {
    if (callNo && !dataLoadedRef.current) {
      dataLoadedRef.current = true;

      const loadData = async () => {
        try {
          // Try to load persisted draft data first (highest priority)
          const persistedData = localStorage.getItem(`deflectionTestData_${callNo}`);
          if (persistedData) {
            try {
              const parsedData = JSON.parse(persistedData);
              setLotStates(parsedData);
              console.log('✅ Loaded draft data from localStorage');
              return;
            } catch (e) {
              console.error('Error parsing persisted data:', e);
            }
          }

          // If no draft data, fetch from database
          console.log('📥 Fetching dimensional inspection and application deflection data from database for call:', callNo);
          const [dimResponse, deflResponse] = await Promise.all([
            getDimensionalInspectionByCallNo(callNo),
            getApplicationDeflectionByCallNo(callNo)
          ]);

          const dimData = dimResponse?.responseData || [];
          const deflData = deflResponse?.responseData || [];

          console.log('Dimensional inspection data from DB:', dimData);
          console.log('Application deflection data from DB:', deflData);

          // Initialize merged data structure - use lotsFromVendor instead of lotsData to avoid dependency
          const mergedData = { ...lotsFromVendor.reduce((acc, lot) => ({
            ...acc,
            [lot.lotNo || lot.lotNumber]: {
              dimGo1: "", dimNoGo1: "", dimFlat1: "",
              dimGo2: "", dimNoGo2: "", dimFlat2: "",
              dimRemarks: "",
              deflectionR1: "", deflectionR2: "",
              deflectionRemarks: ""
            }
          }), {}) };

          // Map dimensional inspection data (NEW PARENT-CHILD STRUCTURE)
          dimData.forEach(record => {
            if (mergedData[record.lotNo]) {
              // Extract samples by sampling number
              const samples1st = record.samples?.filter(s => s.samplingNo === 1) || [];
              const samples2nd = record.samples?.filter(s => s.samplingNo === 2) || [];

              // For 1st sampling - map each field separately
              if (samples1st.length > 0) {
                const sample = samples1st[0];
                mergedData[record.lotNo].dimGo1 = sample.goGaugeFailed > 0 ? String(sample.goGaugeFailed) : "";
                mergedData[record.lotNo].dimNoGo1 = sample.noGoGaugeFailed > 0 ? String(sample.noGoGaugeFailed) : "";
                mergedData[record.lotNo].dimFlat1 = sample.flatnessFailed > 0 ? String(sample.flatnessFailed) : "";
              }
              // For 2nd sampling - map each field separately
              if (samples2nd.length > 0) {
                const sample = samples2nd[0];
                mergedData[record.lotNo].dimGo2 = sample.goGaugeFailed > 0 ? String(sample.goGaugeFailed) : "";
                mergedData[record.lotNo].dimNoGo2 = sample.noGoGaugeFailed > 0 ? String(sample.noGoGaugeFailed) : "";
                mergedData[record.lotNo].dimFlat2 = sample.flatnessFailed > 0 ? String(sample.flatnessFailed) : "";
              }
              mergedData[record.lotNo].dimRemarks = record.remarks || "";
            }
          });

          // Map application deflection data (NEW PARENT-CHILD STRUCTURE)
          deflData.forEach(record => {
            if (mergedData[record.lotNo]) {
              // Extract samples by sampling number
              const samples1st = record.samples?.filter(s => s.samplingNo === 1) || [];
              const samples2nd = record.samples?.filter(s => s.samplingNo === 2) || [];

              // For deflection test, store the failed counts (R1, R2)
              if (samples1st.length > 0) {
                const failedCount = samples1st[0].noOfSamplesFailed || 0;
                mergedData[record.lotNo].deflectionR1 = failedCount > 0 ? String(failedCount) : "";
              }
              if (samples2nd.length > 0) {
                const failedCount = samples2nd[0].noOfSamplesFailed || 0;
                mergedData[record.lotNo].deflectionR2 = failedCount > 0 ? String(failedCount) : "";
              }
              mergedData[record.lotNo].deflectionRemarks = record.remarks || "";
            }
          });

          setLotStates(mergedData);
          // ✅ CRITICAL: Persist fetched data to localStorage immediately
          localStorage.setItem(`deflectionTestData_${callNo}`, JSON.stringify(mergedData));
          console.log('✅ Loaded data from database, merged, and persisted to localStorage');
        } catch (error) {
          console.error('Error loading data from database:', error);
          // Initialize empty data on error - use lotsFromVendor instead of lotsData
          const emptyData = lotsFromVendor.reduce((acc, lot) => ({
            ...acc,
            [lot.lotNo || lot.lotNumber]: {
              dimGo1: "", dimNoGo1: "", dimFlat1: "",
              dimGo2: "", dimNoGo2: "", dimFlat2: "",
              dimRemarks: "",
              deflectionR1: "", deflectionR2: "",
              deflectionRemarks: ""
            }
          }), {});
          setLotStates(emptyData);
        }
      };

      loadData();
    }
  }, [callNo, lotsFromVendor]);

  // Persist data whenever lotStates changes
  useEffect(() => {
    if (Object.keys(lotStates).length > 0 && callNo) {
      localStorage.setItem(`deflectionTestData_${callNo}`, JSON.stringify(lotStates));
    }
  }, [lotStates, callNo]);

  /* Helper to safely parse number */
  const safe = (val) => {
    const num = parseInt(val);
    return isNaN(num) ? 0 : num;
  };

  /* Handle dimension field changes */
  const handleDimChange = (lotNo, field, value) => {
    setLotStates(prev => ({
      ...prev,
      [lotNo]: { ...prev[lotNo], [field]: value }
    }));
  };

  /* Handle deflection R1 change */
  const handleDeflectionR1Change = (lotNo, value) => {
    const numVal = value === '' ? '' : Math.max(0, parseInt(value) || 0);
    setLotStates(prev => ({
      ...prev,
      [lotNo]: { ...prev[lotNo], deflectionR1: numVal }
    }));
  };

  /* Handle deflection R2 change */
  const handleDeflectionR2Change = (lotNo, value) => {
    const numVal = value === '' ? '' : Math.max(0, parseInt(value) || 0);
    setLotStates(prev => ({
      ...prev,
      [lotNo]: { ...prev[lotNo], deflectionR2: numVal }
    }));
  };

  /* Handle deflection remarks change */
  const handleDeflectionRemarksChange = (lotNo, value) => {
    setLotStates(prev => ({
      ...prev,
      [lotNo]: { ...prev[lotNo], deflectionRemarks: value }
    }));
  };

  /* Handle dimension remarks change */
  const handleDimRemarksChange = (lotNo, value) => {
    setLotStates(prev => ({
      ...prev,
      [lotNo]: { ...prev[lotNo], dimRemarks: value }
    }));
  };

  /* Calculate summary for dimension test */
  const getDimSummary = (lot) => {
    const state = lotStates[lot.lotNo];

    // Return default values if state is not initialized yet
    if (!state) {
      return { r1: 0, r2: 0, total: 0, showSecond: false, result: 'PENDING', color: '#f59e0b' };
    }

    const r1 = safe(state.dimGo1) + safe(state.dimNoGo1) + safe(state.dimFlat1);
    const r2 = safe(state.dimGo2) + safe(state.dimNoGo2) + safe(state.dimFlat2);
    const total = r1 + r2;
    const hasR1Input = state.dimGo1 !== '' || state.dimNoGo1 !== '' || state.dimFlat1 !== '';

    /* Show 2nd sampling if R1 > Acceptance No. AND R1 < Rejection No. */
    const showSecond = hasR1Input && r1 > lot.accpNo && r1 < lot.rejNo;

    let result = 'PENDING';
    let color = '#f59e0b';

    if (hasR1Input) {
      if (r1 <= lot.accpNo) {
        result = 'OK'; color = '#16a34a';
      } else if (r1 >= lot.rejNo) {
        result = 'NOT OK'; color = '#dc2626';
      } else if (showSecond && (state.dimGo2 !== '' || state.dimNoGo2 !== '' || state.dimFlat2 !== '')) {
        if (total < lot.cummRejNo) {
          result = 'OK'; color = '#16a34a';
        } else {
          result = 'NOT OK'; color = '#dc2626';
        }
      }
    }

    return { r1, r2, total, showSecond, result, color };
  };

  /* Calculate summary for deflection test */
  const getDeflectionSummary = (lot) => {
    const state = lotStates[lot.lotNo];

    // Return default values if state is not initialized yet
    if (!state) {
      return { r1: 0, r2: 0, total: 0, showSecond: false, result: 'PENDING', color: '#f59e0b' };
    }

    const r1 = state.deflectionR1 === '' ? 0 : parseInt(state.deflectionR1);
    const r2 = state.deflectionR2 === '' ? 0 : parseInt(state.deflectionR2);
    const total = r1 + r2;
    const hasR1Input = state.deflectionR1 !== '';

    /* Show 2nd sampling if R1 > Acceptance No. AND R1 < Rejection No. */
    const showSecond = hasR1Input && r1 > lot.accpNo && r1 < lot.rejNo;

    let result = 'PENDING';
    let color = '#f59e0b';

    if (hasR1Input) {
      if (r1 <= lot.accpNo) {
        result = 'OK'; color = '#16a34a';
      } else if (r1 >= lot.rejNo) {
        result = 'NOT OK'; color = '#dc2626';
      } else if (showSecond && state.deflectionR2 !== '') {
        if (total < lot.cummRejNo) {
          result = 'OK'; color = '#16a34a';
        } else {
          result = 'NOT OK'; color = '#dc2626';
        }
      }
    }

    return { r1, r2, total, showSecond, result, color };
  };

  return (
    <div className="ad-container">
      {/* HEADER */}
      <div className="ad-header">
        <div>
          <h1 className="ad-title">Dimension & Application Deflection Test</h1>
          <p className="ad-subtitle">Final Product Inspection — Dimension & Load Deflection (IS 2500 Table 2 - AQL 2.5)</p>
        </div>
        <button className="ad-btn ad-btn-outline" onClick={onBack}>← Back</button>
      </div>

      {/* Submodule Navigation */}
      <FinalSubmoduleNav currentSubmodule="final-application-deflection" onNavigate={onNavigateSubmodule} />

      {/* TABS */}
      <div className="ad-tabs">
        <button
          className={`ad-tab ${activeTab === 'dimension' ? 'active' : ''}`}
          onClick={() => setActiveTab('dimension')}
        >
          📏 Dimensional Inspection
        </button>
        <button
          className={`ad-tab ${activeTab === 'deflection' ? 'active' : ''}`}
          onClick={() => setActiveTab('deflection')}
        >
          📊 Application & Deflection Test
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'dimension' && (
        <div className="ad-tab-content">
          {lotsData.map(lot => {
            const state = lotStates[lot.lotNo];
            const summary = getDimSummary(lot);

            return (
              <div key={lot.lotNo} className="ad-card">
                {/* Lot Header */}
                <div className="ad-lot-header">
                  <div className="ad-lot-info">
                    <span className="ad-lot-badge">📦 Lot: <strong>{lot.lotNo}</strong></span>
                    <span className="ad-lot-meta">Heat: {lot.heatNo}</span>
                    <span className="ad-lot-meta">Qty: {lot.quantity}</span>
                    <span className="ad-lot-meta">Sample: <strong>{lot.sampleSize}</strong></span>
                    <span className="ad-lot-meta">Ac: <strong>{lot.accpNo}</strong></span>
                    <span className="ad-lot-meta">Re: <strong>{lot.rejNo}</strong></span>
                    <span className="ad-lot-meta">Cumm: <strong>{lot.cummRejNo}</strong></span>
                  </div>
                </div>

                {/* 1st Sampling */}
                <div className="ad-sampling-label">1st Sampling (n1: {lot.sampleSize})</div>
                <div className="ad-dim-grid">
                  <div className="ad-field">
                    <label className="ad-label">GO Gauge Failed</label>
                    <input
                      type="number"
                      min="0"
                      className="ad-input"
                      value={state?.dimGo1 || ""}
                      onChange={(e) => handleDimChange(lot.lotNo, 'dimGo1', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="ad-field">
                    <label className="ad-label">NO-GO Gauge Failed</label>
                    <input
                      type="number"
                      min="0"
                      className="ad-input"
                      value={state?.dimNoGo1 || ""}
                      onChange={(e) => handleDimChange(lot.lotNo, 'dimNoGo1', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="ad-field">
                    <label className="ad-label">Flatness Failed</label>
                    <input
                      type="number"
                      min="0"
                      className="ad-input"
                      value={state?.dimFlat1 || ""}
                      onChange={(e) => handleDimChange(lot.lotNo, 'dimFlat1', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* 2nd Sampling */}
                {summary.showSecond && (
                  <>
                    <div className="ad-sampling-label ad-sampling-second-label">⚠️ 2nd Sampling (n2: {lot.sampleSize2nd}) - R1: {summary.r1}</div>
                    <div className="ad-dim-grid">
                      <div className="ad-field">
                        <label className="ad-label">GO Gauge Failed</label>
                        <input
                          type="number"
                          min="0"
                          className="ad-input"
                          value={state?.dimGo2 || ""}
                          onChange={(e) => handleDimChange(lot.lotNo, 'dimGo2', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="ad-field">
                        <label className="ad-label">NO-GO Gauge Failed</label>
                        <input
                          type="number"
                          min="0"
                          className="ad-input"
                          value={state?.dimNoGo2 || ""}
                          onChange={(e) => handleDimChange(lot.lotNo, 'dimNoGo2', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="ad-field">
                        <label className="ad-label">Flatness Failed</label>
                        <input
                          type="number"
                          min="0"
                          className="ad-input"
                          value={state?.dimFlat2 || ""}
                          onChange={(e) => handleDimChange(lot.lotNo, 'dimFlat2', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Summary */}
                <div className="ad-summary-row">
                  <div className="ad-summary-item">
                    <span>R1: <strong>{summary.r1}</strong></span>
                  </div>
                  {summary.showSecond && (
                    <>
                      <div className="ad-summary-item">
                        <span>R2: <strong>{summary.r2}</strong></span>
                      </div>
                      <div className="ad-summary-item">
                        <span>Total: <strong>{summary.total}</strong></span>
                      </div>
                    </>
                  )}
                  <div className="ad-summary-item">
                    <span>Result: <strong style={{ color: summary.color }}>{summary.result}</strong></span>
                  </div>
                </div>

                {/* Remarks */}
                <div className="ad-field">
                  <label className="ad-label">Remarks</label>
                  <textarea
                    className="ad-input ad-textarea"
                    rows="2"
                    value={state?.dimRemarks || ""}
                    onChange={(e) => handleDimRemarksChange(lot.lotNo, e.target.value)}
                    placeholder="Enter remarks..."
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'deflection' && (
        <div className="ad-tab-content">
          {lotsData.map(lot => {
            const state = lotStates[lot.lotNo];
            const summary = getDeflectionSummary(lot);

            return (
              <div key={lot.lotNo} className="ad-card">
                {/* Lot Header */}
                <div className="ad-lot-header">
                  <div className="ad-lot-info">
                    <span className="ad-lot-badge">📦 Lot: <strong>{lot.lotNo}</strong></span>
                    <span className="ad-lot-meta">Heat: {lot.heatNo}</span>
                    <span className="ad-lot-meta">Qty: {lot.quantity}</span>
                    <span className="ad-lot-meta">Sample: <strong>{lot.sampleSize}</strong></span>
                  </div>
                </div>

                {/* Test Info Row */}
                <div className="ad-test-info">
                  <div className="ad-info-item">
                    <span className="ad-info-label">Sample Size (1st)</span>
                    <span className="ad-info-value">{lot.sampleSize}</span>
                  </div>
                  <div className="ad-info-item">
                    <span className="ad-info-label">Sample Size (2nd)</span>
                    <span className="ad-info-value">{lot.sampleSize2nd}</span>
                  </div>
                  <div className="ad-info-item">
                    <span className="ad-info-label">Accp No.</span>
                    <span className="ad-info-value">{lot.accpNo}</span>
                  </div>
                  <div className="ad-info-item">
                    <span className="ad-info-label">Rej No.</span>
                    <span className="ad-info-value">{lot.rejNo}</span>
                  </div>
                  <div className="ad-info-item">
                    <span className="ad-info-label">Cumm. Rej No.</span>
                    <span className="ad-info-value">{lot.cummRejNo}</span>
                  </div>
                </div>

                {/* 1st Sampling */}
                <div className="ad-sampling-block">
                  <div className="ad-sampling-header">
                    <div className="ad-sampling-title">1st Sampling</div>
                  </div>
                  <div className="ad-simple-input-row">
                    <div className="ad-simple-input-group">
                      <label className="ad-label">No. of Samples Failed (R1)</label>
                      <input
                        type="number"
                        min="0"
                        max={lot.sampleSize}
                        className="ad-input ad-input-r1"
                        value={state?.deflectionR1 || ""}
                        onChange={(e) => handleDeflectionR1Change(lot.lotNo, e.target.value)}
                        placeholder="Enter failed count"
                      />
                    </div>
                    <div className="ad-simple-input-info">
                      <span>Accp No.: <strong>{lot.accpNo}</strong></span>
                      <span>Rej No.: <strong>{lot.rejNo}</strong></span>
                    </div>
                  </div>
                </div>

                {/* 2nd Sampling */}
                {summary.showSecond && (
                  <div className="ad-sampling-block ad-sampling-second">
                    <div className="ad-sampling-header">
                      <div className="ad-sampling-title">2nd Sampling (Sample Size: {lot.sampleSize2nd})</div>
                    </div>
                    <div className="ad-simple-input-row">
                      <div className="ad-simple-input-group">
                        <label className="ad-label">No. of Samples Failed (R2)</label>
                        <input
                          type="number"
                          min="0"
                          max={lot.sampleSize2nd}
                          className="ad-input ad-input-r2"
                          value={state?.deflectionR2 || ""}
                          onChange={(e) => handleDeflectionR2Change(lot.lotNo, e.target.value)}
                          placeholder="Enter failed count"
                        />
                      </div>
                      <div className="ad-simple-input-info">
                        <span>R1: <strong className="ad-r1">{summary.r1}</strong></span>
                        <span>R2: <strong className="ad-r2">{summary.r2}</strong></span>
                        <span>Total (R1+R2): <strong className={summary.total >= lot.cummRejNo ? 'ad-fail' : 'ad-ok'}>{summary.total}</strong></span>
                        <span>Cumm. Rej No.: <strong>{lot.cummRejNo}</strong></span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Result & Remarks */}
                <div className="ad-final-row">
                  <div className="ad-final-result">
                    <label className="ad-label">Result of Application & Deflection Test</label>
                    <div className="ad-result-box" style={{ borderColor: summary.color, color: summary.color }}>{summary.result}</div>
                  </div>
                  <div className="ad-remarks">
                    <label className="ad-label">Remarks</label>
                    <textarea
                      className="ad-input ad-textarea"
                      rows="2"
                      value={state?.deflectionRemarks || ""}
                      onChange={(e) => handleDeflectionRemarksChange(lot.lotNo, e.target.value)}
                      placeholder="Enter remarks..."
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Page Actions */}
      {/* <div className="ad-actions">
        <button className="ad-btn ad-btn-outline" onClick={onBack}>Cancel</button>
        <button className="ad-btn ad-btn-primary" onClick={() => alert('Saved!')}>Save & Continue</button>
      </div> */}
    </div>
  );
};

export default FinalApplicationDeflectionPage;
