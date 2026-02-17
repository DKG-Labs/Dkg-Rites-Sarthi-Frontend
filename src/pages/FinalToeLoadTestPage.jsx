import { useState, useMemo, useEffect } from 'react';
import { useInspection } from '../context/InspectionContext';
import FinalSubmoduleNav from '../components/FinalSubmoduleNav';
import ExcelImport from '../components/ExcelImport';
import Pagination from '../components/Pagination';
import { getHardnessToeLoadAQL } from '../utils/is2500Calculations';
import { getToeLoadTestsByCall } from '../services/finalInspectionSubmoduleService';
import './FinalToeLoadTestPage.css';

/**
 * Tolerance band by spring type (used internally for validation)
 * MK-III : 850–1100
 * MK-V   : 1200–1500
 * ERC-J  : > 650
 */
const TOLERANCES = {
  'MK-III': { min: 850, max: 1100 },
  'MK-V': { min: 1200, max: 1500 },
  'ERC-J': { min: 650, max: Infinity }
};

const FinalToeLoadTestPage = ({ onBack, onNavigateSubmodule }) => {
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

  /**
   * Compute sample size & AQL values for each lot using IS 2500 Table 2
   */
  const lotsWithSampleSize = useMemo(
    () =>
      lotsFromVendor.map(lot => {
        const lotNo = lot.lotNo || lot.lotNumber;
        const heatNo = lot.heatNo || lot.heatNumber;
        const quantity = lot.lotSize || lot.offeredQty || 0;

        const aql = getHardnessToeLoadAQL(quantity);
        return {
          lotNo,
          heatNo,
          quantity,
          springType: lot.springType || 'MK-III',
          sampleSize: aql.n1,
          sampleSize2nd: aql.n2,
          accpNo: aql.ac1,
          rejNo: aql.re1,
          cummRejNo: aql.cummRej,
          singleSampling: aql.useSingleSampling || false
        };
      }),
    [lotsFromVendor]
  );

  /**
   * Per-lot state:
   *  toe1st: array(sampleSize) – 1st sampling toe-load values
   *  toe2nd: array(sampleSize2nd) – 2nd sampling toe-load values
   *  remarks: string
   */
  const [lotData, setLotData] = useState(() => {
    // Get callNo for localStorage key
    const currentCallNo = selectedCall?.call_no || sessionStorage.getItem('selectedCallNo');

    // ✅ CRITICAL: Try to load from localStorage first on page load
    if (currentCallNo) {
      const persistedData = localStorage.getItem(`toeLoadTestData_${currentCallNo}`);
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
    // Note: We use lotsFromVendor here because lotsWithSampleSize is not yet computed
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
        const aql = getHardnessToeLoadAQL(lot.lotSize || lot.offeredQty || 0);
        return {
          ...acc,
          [lotNo]: {
            toe1st: Array(aql.n1).fill(''),
            toe2nd: Array(aql.n2).fill(''),
            remarks: ''
          }
        };
      },
      {}
    );
  });

  // Initialize state when lotsWithSampleSize becomes available
  useEffect(() => {
    if (lotsWithSampleSize.length > 0 && Object.keys(lotData).length === 0) {
      console.log('🔧 Initializing lot data for', lotsWithSampleSize.length, 'lots');
      const initialState = lotsWithSampleSize.reduce(
        (acc, lot) => ({
          ...acc,
          [lot.lotNo]: {
            toe1st: Array(lot.sampleSize).fill(''),
            toe2nd: Array(lot.sampleSize2nd).fill(''),
            remarks: ''
          }
        }),
        {}
      );
      setLotData(initialState);
      console.log('✅ Initialized lot data:', initialState);
    }
  }, [lotsWithSampleSize, lotData]);

  // Load data from database or localStorage when page loads
  useEffect(() => {
    if (lotsWithSampleSize.length > 0) {
      const loadData = async () => {
        try {
          // Try to load persisted draft data first (highest priority)
          const persistedData = localStorage.getItem(`toeLoadTestData_${callNo}`);
          if (persistedData) {
            try {
              const parsedData = JSON.parse(persistedData);
              setLotData(parsedData);
              console.log('✅ Loaded draft data from localStorage');
              return;
            } catch (e) {
              console.error('Error parsing persisted data:', e);
            }
          }

          // If no draft data, fetch from database
          console.log('📥 Fetching toe load test data from database for call:', callNo);
          const response = await getToeLoadTestsByCall(callNo);
          const dbData = response?.responseData || [];

          console.log('Toe load test data from DB:', dbData);

          // Merge database data with initialized lot data
          const mergedData = { ...lotsWithSampleSize.reduce((acc, lot) => ({
            ...acc,
            [lot.lotNo]: {
              toe1st: Array(lot.sampleSize).fill(''),
              toe2nd: Array(lot.sampleSize2nd).fill(''),
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
              const lot = lotsWithSampleSize.find(l => l.lotNo === record.lotNo);
              if (!lot) return;

              // Map samples to toe load values, maintaining correct array size
              if (samples1st.length > 0) {
                const sortedSamples = samples1st.sort((a, b) => a.sampleNo - b.sampleNo);
                mergedData[record.lotNo].toe1st = Array(lot.sampleSize).fill('');
                sortedSamples.forEach(s => {
                  if (s.sampleNo > 0 && s.sampleNo <= lot.sampleSize) {
                    mergedData[record.lotNo].toe1st[s.sampleNo - 1] = s.sampleValue ? String(s.sampleValue) : '';
                  }
                });
              }

              if (samples2nd.length > 0) {
                const sortedSamples = samples2nd.sort((a, b) => a.sampleNo - b.sampleNo);
                mergedData[record.lotNo].toe2nd = Array(lot.sampleSize2nd).fill('');
                sortedSamples.forEach(s => {
                  if (s.sampleNo > 0 && s.sampleNo <= lot.sampleSize2nd) {
                    mergedData[record.lotNo].toe2nd[s.sampleNo - 1] = s.sampleValue ? String(s.sampleValue) : '';
                  }
                });
              }

              mergedData[record.lotNo].remarks = record.remarks || '';
            }
          });

          setLotData(mergedData);
          // ✅ CRITICAL: Persist fetched data immediately to localStorage
          localStorage.setItem(`toeLoadTestData_${callNo}`, JSON.stringify(mergedData));
          console.log('✅ Loaded and persisted data from database');
        } catch (error) {
          console.error('Error loading toe load test data:', error);
        }
      };

      loadData();
    }
  }, [callNo, lotsWithSampleSize]);

  // Persist data whenever lotData changes
  useEffect(() => {
    if (Object.keys(lotData).length > 0 && callNo) {
      localStorage.setItem(`toeLoadTestData_${callNo}`, JSON.stringify(lotData));
    }
  }, [lotData, callNo]);

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

  /** Helper: is a single toe-load value rejected for given lot? */
  const isRejectedValue = (lot, raw) => {
    if (raw === '' || raw === null || raw === undefined) return false;
    const v = parseFloat(String(raw).replace(',', '.'));
    if (Number.isNaN(v)) return false;

    const tol = TOLERANCES[lot.springType] || { min: 0, max: Infinity };

    if (lot.springType === 'ERC-J') {
      /* ERC-J: value must be > 650, so ≤650 is rejected */
      return !(v > tol.min);
    }
    /* Other types: value must be within min-max band */
    return v < tol.min || v > tol.max;
  };

  /* 2nd Sampling auto-show/hide logic with popup */
  useEffect(() => {
    lotsWithSampleSize.forEach(lot => {
      const state = lotData[lot.lotNo];
      if (!state) return;

      const r1 = state.toe1st.filter(v => isRejectedValue(lot, v)).length;

      const secondRequired = !lot.singleSampling && r1 > lot.accpNo && r1 < lot.rejNo;
      const secondNotRequired = r1 <= lot.accpNo || r1 >= lot.rejNo;
      const shown = !!show2ndSamplingMap[lot.lotNo];

      /* Auto-open when required */
      if (secondRequired && !shown) {
        setShow2ndSamplingMap(prev => ({ ...prev, [lot.lotNo]: true }));
      }

      /* Check if 2nd sampling has data */
      const has2ndData = state.toe2nd.some(v => v !== '');

      /* Auto-hide or show popup when no longer required */
      if (secondNotRequired && shown && !popupLot) {
        if (has2ndData) {
          setPopupLot(lot.lotNo);
        } else {
          setShow2ndSamplingMap(prev => ({ ...prev, [lot.lotNo]: false }));
        }
      }
    });
  }, [lotData, lotsWithSampleSize, popupLot, show2ndSamplingMap]);

  /* Popup handlers */
  const handlePopupYesKeep = () => {
    if (!popupLot) return;
    setShow2ndSamplingMap(prev => ({ ...prev, [popupLot]: false }));
    setPopupLot(null);
  };

  const handlePopupNoDelete = () => {
    if (!popupLot) return;
    const lot = lotsWithSampleSize.find(l => l.lotNo === popupLot);
    if (!lot) return;
    setShow2ndSamplingMap(prev => ({ ...prev, [popupLot]: false }));
    setLotData(prev => ({
      ...prev,
      [popupLot]: { ...prev[popupLot], toe2nd: Array(lot.sampleSize2nd).fill('') }
    }));
    setPopupLot(null);
  };

  /** Update toe-load value (1st or 2nd sampling) */
  const handleToeChange = (lotNo, index, value, isSecond = false) => {
    setLotData(prev => {
      const lotState = prev[lotNo];
      const key = isSecond ? 'toe2nd' : 'toe1st';
      const arr = [...lotState[key]];
      arr[index] = value;
      return {
        ...prev,
        [lotNo]: { ...lotState, [key]: arr }
      };
    });
  };

  /** Update remarks per lot */
  const handleRemarksChange = (lotNo, value) => {
    setLotData(prev => ({
      ...prev,
      [lotNo]: { ...prev[lotNo], remarks: value }
    }));
  };

  /** Handle Excel import for toe load values */
  const handleExcelImport = (lotNo, values, isSecond) => {
    setLotData(prev => ({
      ...prev,
      [lotNo]: {
        ...prev[lotNo],
        [isSecond ? 'toe2nd' : 'toe1st']: values
      }
    }));
  };

  /**
   * Compute R1, R2, total & final result for a lot
   */
  const computeLotSummary = (lot) => {
    const state = lotData[lot.lotNo];
    if (!state) {
      return { r1: 0, r2: 0, showSecond: false, total: 0, result: 'PENDING', color: '#fbbf24' };
    }

    const r1 = state.toe1st.filter(v => isRejectedValue(lot, v)).length;
    const showSecond = !!show2ndSamplingMap[lot.lotNo];
    const r2 = showSecond ? state.toe2nd.filter(v => isRejectedValue(lot, v)).length : 0;
    const total = r1 + r2;

    /* Determine final result based on the spec */
    let result = 'PENDING';
    let color = '#fbbf24';

    const anyEntered = state.toe1st.some(v => v !== '');

    if (!anyEntered) {
      result = 'PENDING';
      color = '#fbbf24';
    } else if (r1 <= lot.accpNo) {
      result = 'OK';
      color = '#16a34a';
    } else if (r1 > lot.accpNo && r1 < lot.rejNo) {
      /* 2nd sampling required - check combined */
      if (total < lot.cummRejNo) {
        result = 'OK';
        color = '#16a34a';
      } else {
        result = 'NOT OK';
        color = '#dc2626';
      }
    } else if (r1 >= lot.rejNo) {
      result = 'NOT OK';
      color = '#dc2626';
    }

    return { r1, r2, showSecond, total, result, color };
  };

  /* Get value status for color coding */
  const getValueStatus = (lot, v) => {
    if (!v) return '';
    return isRejectedValue(lot, v) ? 'fail' : 'pass';
  };

  return (
    <div className="tlp-page">
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

      {/* Header */}
      <div className="tlp-header">
        <div>
          <h1 className="tlp-title">Toe Load Test</h1>
          <p className="tlp-sub">
            Final Product Inspection – Toe load test for each lot (sample size as per IS 2500)
          </p>
        </div>
        <button className="tlp-btn tlp-btn-outline" onClick={onBack}>
          ← Back
        </button>
      </div>

      {/* Submodule Navigation */}
      <FinalSubmoduleNav
        currentSubmodule="final-toe-load-test"
        onNavigate={onNavigateSubmodule}
      />

      {/* One section per lot */}
      {lotsWithSampleSize.map(lot => {
        const summary = computeLotSummary(lot);
        const state = lotData[lot.lotNo] || {
          toe1st: Array(lot.sampleSize).fill(''),
          toe2nd: Array(lot.sampleSize2nd).fill(''),
          remarks: ''
        };

        /* Pagination values for 1st sampling */
        const rows = rowsPerPageMap[lot.lotNo] || defaultRows;
        const page = pageMap[lot.lotNo] || 0;
        const start = page * rows;
        const end = Math.min(start + rows, lot.sampleSize);
        const paginated1 = state.toe1st.slice(start, end);
        const totalPages = Math.ceil(lot.sampleSize / rows);

        /* Pagination values for 2nd sampling */
        const rows2 = rowsPerPageMap2[lot.lotNo] || defaultRows;
        const page2 = pageMap2[lot.lotNo] || 0;
        const start2 = page2 * rows2;
        const end2 = Math.min(start2 + rows2, lot.sampleSize2nd);
        const paginated2 = state.toe2nd.slice(start2, end2);
        const totalPages2 = Math.ceil(lot.sampleSize2nd / rows2);

        return (
          <div key={lot.lotNo} className="tlp-card">
            {/* Lot header */}
            <div className="tlp-lot-header">
              <div>
                <strong>📦 Lot: {lot.lotNo}</strong> &nbsp; | &nbsp; Heat: {lot.heatNo} &nbsp; | &nbsp;
                Qty: {lot.quantity}
              </div>
              <div className="tlp-lot-meta">
                Sample Size (IS 2500): <strong>{lot.sampleSize}</strong>
              </div>
            </div>

            {/* 1st Sampling */}
            <div className="tlp-sampling-block">
              <div className="tlp-sampling-header">
                <div className="tlp-sampling-title">1st Sampling – Toe Load Value (Kgf) (n1: {lot.sampleSize})</div>
                <ExcelImport
                  templateName={`${lot.lotNo}_ToeLoad_1st`}
                  sampleSize={lot.sampleSize}
                  valueLabel="Toe Load (Kgf)"
                  onImport={(values) => handleExcelImport(lot.lotNo, values, false)}
                />
              </div>

              <div className="tlp-input-grid">
                {paginated1.map((val, idx) => {
                  const actualIndex = start + idx;
                  const status = getValueStatus(lot, val);
                  return (
                    <div key={actualIndex} className="tlp-input-wrapper">
                      <label className="tlp-input-label">{actualIndex + 1}</label>
                      <input
                        type="number"
                        step="0.1"
                        className={`tlp-input ${status}`}
                        value={val}
                        onChange={(e) => handleToeChange(lot.lotNo, actualIndex, e.target.value, false)}
                        placeholder="0.0"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="tlp-compact-row">
                <div className="tlp-summary-item">
                  Rejected (R1): <strong className="tlp-r1">{summary.r1}</strong>
                </div>
                <div className="tlp-summary-item">
                  Accp No.: <strong>{lot.accpNo}</strong> | Rej No.: <strong>{lot.rejNo}</strong> | Cumm. Rej: <strong>{lot.cummRejNo}</strong>
                </div>
                <div className="tlp-result-box small" style={{ borderColor: summary.color, color: summary.color }}>{summary.result}</div>
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

            {/* 2nd Sampling - only if triggered */}
            {summary.showSecond && (
              <div className="tlp-sampling-block tlp-sampling-second">
                <div className="tlp-sampling-header">
                  <div className="tlp-sampling-title">2nd Sampling – Toe Load Value (Kgf) (n2: {lot.sampleSize2nd})</div>
                  <ExcelImport
                    templateName={`${lot.lotNo}_ToeLoad_2nd`}
                    sampleSize={lot.sampleSize2nd}
                    valueLabel="Toe Load (Kgf)"
                    onImport={(values) => handleExcelImport(lot.lotNo, values, true)}
                  />
                </div>

                <div className="tlp-input-grid">
                  {paginated2.map((val, idx) => {
                    const actualIndex = start2 + idx;
                    const status = getValueStatus(lot, val);
                    return (
                      <input
                        key={actualIndex}
                        type="number"
                        step="0.1"
                        className={`value-input ${status}`}
                        value={val}
                        onChange={(e) => handleToeChange(lot.lotNo, actualIndex, e.target.value, true)}
                      />
                    );
                  })}
                </div>

                <div className="tlp-compact-row">
                  <div className="tlp-summary-item">
                    Rejected (R2): <strong className="tlp-r2">{summary.r2}</strong>
                  </div>
                  <div className="tlp-summary-item">
                    Total (R1 + R2): <strong className={summary.total >= lot.cummRejNo ? 'tlp-fail' : 'tlp-ok'}>{summary.total}</strong>
                  </div>
                  <div className="tlp-result-box small" style={{ borderColor: summary.color, color: summary.color }}>{summary.result}</div>
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
            <div className="tlp-final-row">
              <div className="tlp-remarks-section">
                <label className="tlp-label">Remarks</label>
                <textarea
                  rows={3}
                  className="tlp-input tlp-textarea"
                  value={state.remarks}
                  onChange={e => handleRemarksChange(lot.lotNo, e.target.value)}
                  placeholder="Enter remarks..."
                />
              </div>
            </div>
          </div>
        );
      })}

    </div>
  );
};

export default FinalToeLoadTestPage;
