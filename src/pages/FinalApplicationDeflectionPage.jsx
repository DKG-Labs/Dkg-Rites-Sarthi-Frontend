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
  // State for lot selection toggle
  const [activeLotTab, setActiveLotTab] = useState(0);

  // State to track if 2nd sampling should be SHOWN in UI
  const [showSubsamplingMap, setShowSubsamplingMap] = useState({});

  // State for Confirmation Popup
  const [popupLot, setPopupLot] = useState(null); // { lotNo, type: 'dim' | 'defl' }

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
  const [activeTab, setActiveTab] = useState('deflection');

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
          const mergedData = {
            ...lotsFromVendor.reduce((acc, lot) => ({
              ...acc,
              [lot.lotNo || lot.lotNumber]: {
                dimGo1: "", dimNoGo1: "", dimFlat1: "",
                dimGo2: "", dimNoGo2: "", dimFlat2: "",
                dimRemarks: "",
                deflectionR1: "", deflectionR2: "",
                deflectionRemarks: ""
              }
            }), {})
          };

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

  useEffect(() => {
    if (Object.keys(lotStates).length > 0 && callNo) {
      localStorage.setItem(`deflectionTestData_${callNo}`, JSON.stringify(lotStates));
    }
  }, [lotStates, callNo]);

  // Handle auto-showing 2nd sampling and triggering confirmation popup
  useEffect(() => {
    const newShowMap = { ...showSubsamplingMap };
    let changed = false;

    lotsData.forEach(lot => {
      const state = lotStates[lot.lotNo];
      if (!state) return;

      const lotNo = lot.lotNo;
      if (!newShowMap[lotNo]) newShowMap[lotNo] = { dim: false, defl: false };

      // --- DIMENSION ---
      const r1Dim = safe(state.dimGo1) + safe(state.dimNoGo1) + safe(state.dimFlat1);
      const hasR1Dim = state.dimGo1 !== '' || state.dimNoGo1 !== '' || state.dimFlat1 !== '';
      const shouldShowDim = hasR1Dim && r1Dim > lot.accpNo && r1Dim < lot.rejNo;
      const hasDataDim = state.dimGo2 !== '' || state.dimNoGo2 !== '' || state.dimFlat2 !== '';

      if (shouldShowDim && !newShowMap[lotNo].dim) {
        newShowMap[lotNo].dim = true;
        changed = true;
      } else if (!shouldShowDim && newShowMap[lotNo].dim && hasDataDim) {
        // Condition cleared but data exists - trigger popup
        if (!popupLot || popupLot.lotNo !== lotNo || popupLot.type !== 'dim') {
          setPopupLot({ lotNo, type: 'dim' });
        }
      } else if (!shouldShowDim && !hasDataDim && newShowMap[lotNo].dim) {
        newShowMap[lotNo].dim = false;
        changed = true;
      }

      // --- DEFLECTION ---
      const r1Defl = state.deflectionR1 === '' ? 0 : parseInt(state.deflectionR1);
      const hasR1Defl = state.deflectionR1 !== '';
      const shouldShowDefl = hasR1Defl && r1Defl > lot.accpNo && r1Defl < lot.rejNo;
      const hasDataDefl = state.deflectionR2 !== '';

      if (shouldShowDefl && !newShowMap[lotNo].defl) {
        newShowMap[lotNo].defl = true;
        changed = true;
      } else if (!shouldShowDefl && newShowMap[lotNo].defl && hasDataDefl) {
        // Condition cleared but data exists - trigger popup
        if (!popupLot || popupLot.lotNo !== lotNo || popupLot.type !== 'defl') {
          setPopupLot({ lotNo, type: 'defl' });
        }
      } else if (!shouldShowDefl && !hasDataDefl && newShowMap[lotNo].defl) {
        newShowMap[lotNo].defl = false;
        changed = true;
      }
    });

    if (changed) setShowSubsamplingMap(newShowMap);
  }, [lotStates, lotsData, popupLot, showSubsamplingMap]);

  const handlePopupYesHideOnly = () => {
    if (!popupLot) return;
    const { lotNo, type } = popupLot;
    setShowSubsamplingMap(prev => ({
      ...prev,
      [lotNo]: { ...prev[lotNo], [type]: false }
    }));
    setPopupLot(null);
  };

  const handlePopupNoClearHide = () => {
    if (!popupLot) return;
    const { lotNo, type } = popupLot;

    setLotStates(prev => {
      const newState = { ...prev };
      if (type === 'dim') {
        newState[lotNo] = { ...newState[lotNo], dimGo2: "", dimNoGo2: "", dimFlat2: "" };
      } else {
        newState[lotNo] = { ...newState[lotNo], deflectionR2: "" };
      }
      return newState;
    });

    setShowSubsamplingMap(prev => ({
      ...prev,
      [lotNo]: { ...prev[lotNo], [type]: false }
    }));
    setPopupLot(null);
  };

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
    const isFullR1 = state.dimGo1 !== '' && state.dimNoGo1 !== '' && state.dimFlat1 !== '';
    const isFullR2 = state.dimGo2 !== '' && state.dimNoGo2 !== '' && state.dimFlat2 !== '';

    /* Show 2nd sampling based on visibility map */
    const showSecond = showSubsamplingMap[lot.lotNo]?.dim || false;

    let result = 'PENDING';
    let color = '#f59e0b';

    if (r1 >= lot.rejNo) {
      result = 'NOT OK'; color = '#dc2626';
    } else if (r1 <= lot.accpNo) {
      if (isFullR1) {
        result = 'OK'; color = '#16a34a';
      } else {
        result = 'PENDING'; color = '#f59e0b';
      }
    } else if (showSecond) {
      if (total >= lot.cummRejNo) {
        result = 'NOT OK'; color = '#dc2626';
      } else if (isFullR1 && isFullR2) {
        result = 'OK'; color = '#16a34a';
      } else {
        result = 'PENDING'; color = '#f59e0b';
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
    const isFullR1 = state.deflectionR1 !== '';
    const isFullR2 = state.deflectionR2 !== '';

    /* Show 2nd sampling based on visibility map */
    const showSecond = showSubsamplingMap[lot.lotNo]?.defl || false;

    let result = 'PENDING';
    let color = '#f59e0b';

    if (r1 >= lot.rejNo) {
      result = 'NOT OK'; color = '#dc2626';
    } else if (r1 <= lot.accpNo) {
      if (isFullR1) {
        result = 'OK'; color = '#16a34a';
      } else {
        result = 'PENDING'; color = '#f59e0b';
      }
    } else if (showSecond) {
      if (total >= lot.cummRejNo) {
        result = 'NOT OK'; color = '#dc2626';
      } else if (isFullR1 && isFullR2) {
        result = 'OK'; color = '#16a34a';
      } else {
        result = 'PENDING'; color = '#f59e0b';
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

      {/* Lot Selector – shown only when multiple lots */}
      {lotsData.length > 1 && (
        <div className="lot-selector">
          {lotsData.map((lot, idx) => (
            <button
              key={lot.lotNo}
              className={`lot-btn ${activeLotTab === idx ? 'active' : ''}`}
              onClick={() => setActiveLotTab(idx)}
            >
              Lot {lot.lotNo}
            </button>
          ))}
        </div>
      )}


      {/* TABS */}
      <div className="ad-tabs">
        {/* <button
          className={`ad-tab ${activeTab === 'dimension' ? 'active' : ''}`}
          onClick={() => setActiveTab('dimension')}
        >
          📏 Dimensional Inspection
        </button> */}
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
          {lotsData.map((lot, idx) => {
            if (activeLotTab !== idx) return null;
            const state = lotStates[lot.lotNo];
            const summary = getDimSummary(lot);

            return (
              <div key={lot.lotNo} className="ad-card">
                {/* Lot Header */}
                <div className="ad-lot-header">
                  <div className="ad-lot-info">
                    <span className="ad-lot-badge">📦 Lot: {lot.lotNo}</span>
                    <span className="ad-lot-meta">Heat: {lot.heatNo}</span>
                    <span className="ad-lot-meta">Qty: {lot.quantity}</span>
                    <span className="ad-lot-meta">Sample: {lot.sampleSize}</span>
                    <span className="ad-lot-meta">Ac: {lot.accpNo}</span>
                    <span className="ad-lot-meta">Re: {lot.rejNo}</span>
                    <span className="ad-lot-meta">Cumm: {lot.cummRejNo}</span>
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
          {lotsData.map((lot, idx) => {
            if (activeLotTab !== idx) return null;
            const state = lotStates[lot.lotNo];
            const summary = getDeflectionSummary(lot);

            return (
              <div key={lot.lotNo} className="ad-card">
                {/* Lot Header */}
                <div className="ad-lot-header">
                  <div className="ad-lot-info">
                    <span className="ad-lot-badge">📦 Lot: {lot.lotNo}</span>
                    <span className="ad-lot-meta">Heat: {lot.heatNo}</span>
                    <span className="ad-lot-meta">Qty: {lot.quantity}</span>
                    <span className="ad-lot-meta">Sample: {lot.sampleSize}</span>
                    <span className="ad-lot-meta">Ac: {lot.accpNo}</span>
                    <span className="ad-lot-meta">Re: {lot.rejNo}</span>
                    <span className="ad-lot-meta">Cumm: {lot.cummRejNo}</span>
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

      {/* ==================== CONFIRMATION POPUP ==================== */}
      {popupLot && (
        <div className="ad-popup-overlay">
          <div className="ad-popup-box">
            <p>
              2nd Sampling for <strong>{popupLot.type === 'dim' ? 'Dimensional' : 'Deflection'}</strong> is no longer required.<br />
              Do you want to hide it?
            </p>
            <div className="ad-popup-actions">
              <button className="ad-popup-btn" onClick={handlePopupNoClearHide}>
                No (Clear & Hide)
              </button>
              <button className="ad-popup-btn ad-popup-primary" onClick={handlePopupYesHideOnly}>
                Yes (Hide Only)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PAGE STYLES ==================== */}
      <style>{`
        .ad-popup-overlay {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.4);
          display: flex; align-items: center; justify-content: center;
          z-index: 10000;
        }
        .ad-popup-box {
          background: white; padding: 24px; border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          text-align: center; max-width: 400px; width: 90%;
        }
        .ad-popup-box p {
          font-size: 16px; color: #334155; margin-bottom: 20px;
          line-height: 1.5; font-weight: 500;
        }
        .ad-popup-actions { display: flex; gap: 12px; justify-content: center; }
        .ad-popup-btn {
          padding: 10px 20px; border-radius: 6px; font-size: 14px;
          font-weight: 600; cursor: pointer; transition: all 0.2s;
          border: 1px solid #e2e8f0; background: #f1f5f9; color: #475569;
        }
        .ad-popup-btn:hover { background: #e2e8f0; }
        .ad-popup-btn.ad-popup-primary {
          background: #0d9488; color: white; border-color: #0d9488;
        }
        .ad-popup-btn.ad-popup-primary:hover { background: #0f766e; }
      `}</style>
    </div>
  );
};

export default FinalApplicationDeflectionPage;
