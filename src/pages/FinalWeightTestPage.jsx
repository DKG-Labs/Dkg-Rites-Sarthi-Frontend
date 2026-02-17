// src/pages/FinalWeightTestPage.jsx
import { useMemo, useState, useEffect } from "react";
import { useInspection } from "../context/InspectionContext";
import FinalSubmoduleNav from '../components/FinalSubmoduleNav';
import ExcelImport from '../components/ExcelImport';
import Pagination from '../components/Pagination';
import { getDimensionWeightAQL } from '../utils/is2500Calculations';
import { getWeightTestsByCall } from '../services/finalInspectionSubmoduleService';
import "./FinalWeightTestPage.css";

/* Weight Tolerance Table from Excel */
const TOLERANCE = { "MK-III": 904, "MK-V": 1068, "ERC-J": 904 };

export default function FinalWeightTestPage({ onBack, onNavigateSubmodule }) {
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

  /* Build lot data with IS 2500 Table 2 calculations */
  const lotsData = useMemo(() => lotsFromVendor.map(lot => {
    const lotNo = lot.lotNo || lot.lotNumber;
    const heatNo = lot.heatNo || lot.heatNumber;
    const quantity = lot.lotSize || lot.offeredQty || 0;

    const aql = getDimensionWeightAQL(quantity);
    return {
      lotNo,
      heatNo,
      quantity,
      springType: lot.springType || "MK-III",
      sampleSize: aql.n1,
      sampleSize2nd: aql.n2,
      accpNo: aql.ac1,
      rejNo: aql.re1,
      cummRejNo: aql.cummRej,
      useSingleSampling: aql.useSingleSampling,
      minWeight: TOLERANCE[lot.springType] || 904
    };
  }), [lotsFromVendor]);

  /* State for all lots */
  const [lotStates, setLotStates] = useState(() => {
    // Get callNo for localStorage key
    const currentCallNo = selectedCall?.call_no || sessionStorage.getItem('selectedCallNo');

    // ✅ CRITICAL: Try to load from localStorage first on page load
    if (currentCallNo) {
      const persistedData = localStorage.getItem(`weightTestData_${currentCallNo}`);
      if (persistedData) {
        try {
          const parsed = JSON.parse(persistedData);
          console.log('✅ Loaded persisted data from localStorage on page load');
          return parsed;
        } catch (e) {
          console.error('Error parsing persisted data:', e);
        }
      }
    }

    // Fallback: Initialize empty data structure from lotsFromVendor
    // Note: We use lotsFromVendor here because lotsData is not yet computed
    let lots = cachedData?.dashboardData?.finalLotDetails || [];
    if (lots.length === 0 && currentCallNo) {
      try {
        const storedCache = sessionStorage.getItem('fpDashboardDataCache');
        if (storedCache) {
          const cacheData = JSON.parse(storedCache);
          lots = cacheData[currentCallNo]?.finalLotDetails || [];
        }
      } catch (e) {
        console.error('Error reading from sessionStorage:', e);
      }
    }

    return lots.reduce(
      (acc, lot) => {
        const lotNo = lot.lotNo || lot.lotNumber;
        const aql = getDimensionWeightAQL(lot.lotSize || lot.offeredQty || 0);
        return {
          ...acc,
          [lotNo]: {
            weight1st: Array(aql.n1).fill(''),
            weight2nd: Array(aql.n2).fill(''),
            remarks: ''
          }
        };
      },
      {}
    );
  });

  // Initialize state when lotsData becomes available
  useEffect(() => {
    if (lotsData.length > 0 && Object.keys(lotStates).length === 0) {
      console.log('🔧 Initializing lot states for', lotsData.length, 'lots');
      const initialState = lotsData.reduce(
        (acc, lot) => ({
          ...acc,
          [lot.lotNo]: {
            weight1st: Array(lot.sampleSize).fill(''),
            weight2nd: Array(lot.sampleSize2nd).fill(''),
            remarks: ''
          }
        }),
        {}
      );
      setLotStates(initialState);
      console.log('✅ Initialized lot states:', initialState);
    }
  }, [lotsData, lotStates]);

  // Load data from database or localStorage when page loads
  useEffect(() => {
    if (lotsData.length > 0) {
      const loadData = async () => {
        try {
          // Try to load persisted draft data first (highest priority)
          const persistedData = localStorage.getItem(`weightTestData_${callNo}`);
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
          console.log('📥 Fetching weight test data from database for call:', callNo);
          const response = await getWeightTestsByCall(callNo);
          const dbData = response?.responseData || [];

          console.log('Weight test data from DB:', dbData);

          // Merge database data with initialized lot data
          const mergedData = { ...lotsData.reduce((acc, lot) => ({
            ...acc,
            [lot.lotNo]: {
              weight1st: Array(lot.sampleSize).fill(''),
              weight2nd: Array(lot.sampleSize2nd).fill(''),
              remarks: ''
            }
          }), {}) };

          // Map database records to frontend format
          dbData.forEach(record => {
            if (mergedData[record.lotNo]) {
              // Extract samples by sampling number
              const samples1st = record.samples?.filter(s => s.samplingNo === 1) || [];
              const samples2nd = record.samples?.filter(s => s.samplingNo === 2) || [];

              // Find the lot to get correct sample sizes
              const lot = lotsData.find(l => l.lotNo === record.lotNo);
              if (!lot) return;

              // Map samples to weight values, maintaining correct array size
              if (samples1st.length > 0) {
                const sortedSamples = samples1st.sort((a, b) => a.sampleNo - b.sampleNo);
                mergedData[record.lotNo].weight1st = Array(lot.sampleSize).fill('');
                sortedSamples.forEach(s => {
                  if (s.sampleNo > 0 && s.sampleNo <= lot.sampleSize) {
                    mergedData[record.lotNo].weight1st[s.sampleNo - 1] = s.sampleValue ? String(s.sampleValue) : '';
                  }
                });
              }

              if (samples2nd.length > 0) {
                const sortedSamples = samples2nd.sort((a, b) => a.sampleNo - b.sampleNo);
                mergedData[record.lotNo].weight2nd = Array(lot.sampleSize2nd).fill('');
                sortedSamples.forEach(s => {
                  if (s.sampleNo > 0 && s.sampleNo <= lot.sampleSize2nd) {
                    mergedData[record.lotNo].weight2nd[s.sampleNo - 1] = s.sampleValue ? String(s.sampleValue) : '';
                  }
                });
              }

              mergedData[record.lotNo].remarks = record.remarks || '';
            }
          });

          setLotStates(mergedData);
          // ✅ CRITICAL: Persist fetched data immediately to localStorage
          localStorage.setItem(`weightTestData_${callNo}`, JSON.stringify(mergedData));
          console.log('✅ Loaded and persisted data from database');
        } catch (error) {
          console.error('Error loading weight test data:', error);
        }
      };

      loadData();
    }
  }, [callNo, lotsData]);

  // Persist data whenever lotStates changes
  useEffect(() => {
    if (Object.keys(lotStates).length > 0 && callNo) {
      localStorage.setItem(`weightTestData_${callNo}`, JSON.stringify(lotStates));
    }
  }, [lotStates, callNo]);

  /* 2nd Sampling visibility state and popup */
  const [show2ndSamplingMap, setShow2ndSamplingMap] = useState({});
  const [popupLot, setPopupLot] = useState(null);

  /* Pagination states */
  const isMobile = window.innerWidth < 768;
  const defaultRows = isMobile ? 10 : 20;
  const [rowsPerPageMap, setRowsPerPageMap] = useState({});
  const [pageMap, setPageMap] = useState({});
  const [rowsPerPageMap2, setRowsPerPageMap2] = useState({});
  const [pageMap2, setPageMap2] = useState({});

  const setRowsAndResetPage = (lotNo, value, second = false) => {
    if (second) {
      setRowsPerPageMap2(prev => ({ ...prev, [lotNo]: value }));
      setPageMap2(prev => ({ ...prev, [lotNo]: 0 }));
    } else {
      setRowsPerPageMap(prev => ({ ...prev, [lotNo]: value }));
      setPageMap(prev => ({ ...prev, [lotNo]: 0 }));
    }
  };

  /* 2nd Sampling auto-show/hide logic with popup */
  useEffect(() => {
    lotsData.forEach(lot => {
      const state = lotStates[lot.lotNo];
      if (!state) return;

      const r1 = state.weight1st.filter(v => {
        const num = parseFloat(v);
        return !isNaN(num) && num < lot.minWeight;
      }).length;

      const secondRequired = r1 > lot.accpNo && r1 < lot.rejNo;
      const secondNotRequired = r1 <= lot.accpNo || r1 >= lot.rejNo;
      const shown = !!show2ndSamplingMap[lot.lotNo];

      /* Auto-open when required */
      if (secondRequired && !shown) {
        setShow2ndSamplingMap(prev => ({ ...prev, [lot.lotNo]: true }));
      }

      /* Check if 2nd sampling has data */
      const has2ndData = state.weight2nd.some(v => v !== '');

      /* Auto-hide or show popup when no longer required */
      if (secondNotRequired && shown && !popupLot) {
        if (has2ndData) {
          setPopupLot(lot.lotNo);
        } else {
          setShow2ndSamplingMap(prev => ({ ...prev, [lot.lotNo]: false }));
        }
      }
    });
  }, [lotStates, lotsData, popupLot, show2ndSamplingMap]);

  /* Popup handlers */
  const handlePopupYesKeep = () => {
    if (!popupLot) return;
    setShow2ndSamplingMap(prev => ({ ...prev, [popupLot]: false }));
    setPopupLot(null);
  };

  const handlePopupNoDelete = () => {
    if (!popupLot) return;
    const lot = lotsData.find(l => l.lotNo === popupLot);
    if (!lot) return;
    setShow2ndSamplingMap(prev => ({ ...prev, [popupLot]: false }));
    setLotStates(prev => ({
      ...prev,
      [popupLot]: { ...prev[popupLot], weight2nd: Array(lot.sampleSize2nd).fill('') }
    }));
    setPopupLot(null);
  };

  /* Handle weight input change */
  const handleWeightChange = (lotNo, index, value, isSecond) => {
    setLotStates(prev => {
      const lotState = { ...prev[lotNo] };
      if (isSecond) {
        const arr = [...lotState.weight2nd];
        arr[index] = value;
        lotState.weight2nd = arr;
      } else {
        const arr = [...lotState.weight1st];
        arr[index] = value;
        lotState.weight1st = arr;
      }
      return { ...prev, [lotNo]: lotState };
    });
  };

  /* Handle remarks change */
  const handleRemarksChange = (lotNo, value) => {
    setLotStates(prev => ({
      ...prev,
      [lotNo]: { ...prev[lotNo], remarks: value }
    }));
  };

  /* Handle Excel import for weight values */
  const handleExcelImport = (lotNo, values, isSecond) => {
    setLotStates(prev => ({
      ...prev,
      [lotNo]: {
        ...prev[lotNo],
        [isSecond ? 'weight2nd' : 'weight1st']: values
      }
    }));
  };

  /* Calculate summary for a lot */
  const getSummary = (lot) => {
    const state = lotStates[lot.lotNo];
    const r1 = state.weight1st.filter(v => {
      const num = parseFloat(v);
      return !isNaN(num) && num < lot.minWeight;
    }).length;

    const showSecond = !!show2ndSamplingMap[lot.lotNo];

    const r2 = showSecond ? state.weight2nd.filter(v => {
      const num = parseFloat(v);
      return !isNaN(num) && num < lot.minWeight;
    }).length : 0;

    const total = r1 + r2;

    /* Determine result */
    let result = 'PENDING';
    let color = '#f59e0b';
    const hasInput = state.weight1st.some(v => v !== '');

    if (hasInput) {
      if (r1 <= lot.accpNo) {
        result = 'OK'; color = '#16a34a';
      } else if (r1 >= lot.rejNo) {
        result = 'NOT OK'; color = '#dc2626';
      } else if (showSecond) {
        if (total < lot.cummRejNo) {
          result = 'OK'; color = '#16a34a';
        } else if (total >= lot.cummRejNo) {
          result = 'NOT OK'; color = '#dc2626';
        }
      }
    }

    return { r1, r2, total, showSecond, result, color };
  };

  /* Get value status for color coding */
  const getValueStatus = (v, minWeight) => {
    if (!v) return '';
    const num = parseFloat(v);
    return !isNaN(num) && num >= minWeight ? 'pass' : 'fail';
  };

  return (
    <div className="wt-container">
      {/* Popup for 2nd Sampling */}
      {popupLot && (
        <div className="popup-overlay">
          <div className="popup-box">
            <p>
              2nd Sampling is no longer required.
              <br />
              Do you want to hide it?
            </p>
            <div className="popup-actions">
              <button className="popup-btn" onClick={handlePopupNoDelete}>
                No (Clear & Hide)
              </button>
              <button className="popup-btn primary" onClick={handlePopupYesKeep}>
                Yes (Hide Only)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="wt-header">
        <div>
          <h1 className="wt-title">Weight Test</h1>
          <p className="wt-subtitle">Final Product Inspection — Weight Measurement (IS 2500 Table 2 - AQL 2.5)</p>
        </div>
        <button className="wt-btn-outline" onClick={onBack}>← Back</button>
      </div>

      {/* Submodule Navigation */}
      <FinalSubmoduleNav currentSubmodule="final-weight-test" onNavigate={onNavigateSubmodule} />

      {/* ALL LOTS */}
      {lotsData.map(lot => {
        const state = lotStates[lot.lotNo] || {
          weight1st: Array(lot.sampleSize).fill(''),
          weight2nd: Array(lot.sampleSize2nd).fill(''),
          remarks: ''
        };

        const summary = getSummary(lot);

        /* Pagination values for 1st sampling */
        const rows = rowsPerPageMap[lot.lotNo] || defaultRows;
        const page = pageMap[lot.lotNo] || 0;
        const start = page * rows;
        const end = Math.min(start + rows, lot.sampleSize);
        const paginated1 = state.weight1st.slice(start, end);
        const totalPages = Math.ceil(lot.sampleSize / rows);

        /* Pagination values for 2nd sampling */
        const rows2 = rowsPerPageMap2[lot.lotNo] || defaultRows;
        const page2 = pageMap2[lot.lotNo] || 0;
        const start2 = page2 * rows2;
        const end2 = Math.min(start2 + rows2, lot.sampleSize2nd);
        const paginated2 = state.weight2nd.slice(start2, end2);
        const totalPages2 = Math.ceil(lot.sampleSize2nd / rows2);

        return (
          <div key={lot.lotNo} className="wt-card">
            {/* Lot Header */}
            <div className="wt-lot-header">
              <div className="wt-lot-info">
                <span className="wt-lot-badge">📦 Lot: <strong>{lot.lotNo}</strong></span>
                <span className="wt-lot-meta">Heat: {lot.heatNo}</span>
                <span className="wt-lot-meta">Qty: {lot.quantity}</span>
                <span className="wt-lot-meta">Type: {lot.springType}</span>
              </div>
              <div className="wt-lot-sample">
                Sample Size (IS 2500): <strong>{lot.sampleSize}</strong> | Min Weight: <strong>{lot.minWeight}g</strong>
              </div>
            </div>

            {/* 1st Sampling */}
            <div className="wt-sampling-block">
              <div className="wt-sampling-header">
                <div className="wt-sampling-title">1st Sampling – Weight (g) (n1: {lot.sampleSize})</div>
                <ExcelImport
                  templateName={`${lot.lotNo}_Weight_1st`}
                  sampleSize={lot.sampleSize}
                  valueLabel="Weight (g)"
                  onImport={(values) => handleExcelImport(lot.lotNo, values, false)}
                />
              </div>
              <div className="wt-input-grid">
                {paginated1.map((val, idx) => {
                  const actualIdx = start + idx;
                  const status = getValueStatus(val, lot.minWeight);
                  return (
                    <div key={actualIdx} className="wt-input-wrapper">
                      <label className="wt-input-label">{actualIdx + 1}</label>
                      <input
                        type="number"
                        step="0.1"
                        className={`wt-input-sm ${status}`}
                        value={val}
                        onChange={(e) => handleWeightChange(lot.lotNo, actualIdx, e.target.value, false)}
                        placeholder="0.0"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="wt-compact-row">
                <div className="wt-summary-item">Rejected (R1): <strong className="wt-r1">{summary.r1}</strong></div>
                <div className="wt-summary-item">Accp No.: <strong>{lot.accpNo}</strong> | Rej No.: <strong>{lot.rejNo}</strong> | Cumm. Rej: <strong>{lot.cummRejNo}</strong></div>
                <div className="wt-result-box small" style={{ borderColor: summary.color, color: summary.color }}>{summary.result}</div>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  start={start}
                  end={end}
                  totalCount={lot.sampleSize}
                  rows={rows}
                  onRowsChange={(newRows) => setRowsAndResetPage(lot.lotNo, newRows)}
                  onPageChange={(p) => setPageMap(prev => ({ ...prev, [lot.lotNo]: p }))}
                />
              </div>
            </div>

            {/* 2nd Sampling */}
            {summary.showSecond && (
              <div className="wt-sampling-block wt-sampling-second">
                <div className="wt-sampling-header">
                  <div className="wt-sampling-title">2nd Sampling – Weight (g) (n2: {lot.sampleSize2nd})</div>
                  <ExcelImport
                    templateName={`${lot.lotNo}_Weight_2nd`}
                    sampleSize={lot.sampleSize2nd}
                    valueLabel="Weight (g)"
                    onImport={(values) => handleExcelImport(lot.lotNo, values, true)}
                  />
                </div>
                <div className="wt-input-grid">
                  {paginated2.map((val, idx) => {
                    const actualIdx = start2 + idx;
                    const status = getValueStatus(val, lot.minWeight);
                    return (
                      <div key={actualIdx} className="wt-input-wrapper">
                        <label className="wt-input-label">#{actualIdx + 1}</label>
                        <input
                          type="number"
                          step="0.1"
                          className={`wt-input-sm ${status}`}
                          value={val}
                          onChange={(e) => handleWeightChange(lot.lotNo, actualIdx, e.target.value, true)}
                          placeholder="0.0"
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="wt-compact-row">
                  <div className="wt-summary-item">Rejected (R2): <strong className="wt-r2">{summary.r2}</strong></div>
                  <div className="wt-summary-item">Total (R1 + R2): <strong className={summary.total >= lot.cummRejNo ? 'wt-fail' : 'wt-ok'}>{summary.total}</strong></div>
                  <div className="wt-result-box small" style={{ borderColor: summary.color, color: summary.color }}>{summary.result}</div>
                  <Pagination
                    currentPage={page2}
                    totalPages={totalPages2}
                    start={start2}
                    end={end2}
                    totalCount={lot.sampleSize2nd}
                    rows={rows2}
                    onRowsChange={(newRows) => setRowsAndResetPage(lot.lotNo, newRows, true)}
                    onPageChange={(p) => setPageMap2(prev => ({ ...prev, [lot.lotNo]: p }))}
                  />
                </div>
              </div>
            )}

            {/* Remarks */}
            <div className="wt-final-row">
              <div className="wt-remarks-section">
                <label className="wt-label">Remarks</label>
                <textarea className="wt-input wt-textarea" rows="3" value={state.remarks} onChange={(e) => handleRemarksChange(lot.lotNo, e.target.value)} placeholder="Enter remarks..." />
              </div>
            </div>
          </div>
        );
      })}

    </div>
  );
}
