
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useInspection } from "../context/InspectionContext";
import FinalSubmoduleNav from "../components/FinalSubmoduleNav";
import { getVisualInspectionByCallNo, getDimensionalInspectionFlatByCallNo } from "../services/finalVisualDimensionalService";

// Table 2 mapping for Dimension & Weight AQL 2.5
const samplingTable = [
  // ✔ LOT SIZE 2–150 → single sampling ONLY
  { min: 2, max: 150, n1: 20, ac1: 0, re1: 3, n2: null, cumulative: null },

  { min: 151, max: 280, n1: 20, ac1: 0, re1: 3, n2: 20, cumulative: 4 },
  { min: 281, max: 500, n1: 32, ac1: 1, re1: 3, n2: 32, cumulative: 5 },
  { min: 501, max: 1200, n1: 50, ac1: 2, re1: 5, n2: 50, cumulative: 7 },
  { min: 1201, max: 3200, n1: 80, ac1: 3, re1: 6, n2: 125, cumulative: 10 },
  { min: 3201, max: 10000, n1: 125, ac1: 5, re1: 9, n2: 200, cumulative: 13 },
  { min: 10001, max: 35000, n1: 200, ac1: 7, re1: 11, n2: 315, cumulative: 19 },
  { min: 35001, max: 150000, n1: 315, ac1: 11, re1: 16, n2: 500, cumulative: 27 },
  { min: 150001, max: 500000, n1: 500, ac1: 11, re1: 16, n2: 800, cumulative: 27 }
];

function getSamplingValues(lotSize) {
  for (const row of samplingTable) {
    if (lotSize >= row.min && lotSize <= row.max) {
      return { ac: row.ac1, re: row.re1, sample: row.n1, cumulative: row.cumulative };
    }
  }
  return { ac: null, re: null, sample: null, cumulative: null };
}

// This will be populated from context with live data
// Fallback to empty array if no lots available
const getAvailableLots = (lotsFromVendor = []) => {
  if (!lotsFromVendor || lotsFromVendor.length === 0) {
    return [];
  }

  return lotsFromVendor.map(lot => {
    // Handle both API response format (lotNumber, heatNumber) and mapped format (lotNo, heatNo)
    const lotNo = lot.lotNo || lot.lotNumber;
    const heatNo = lot.heatNo || lot.heatNumber;
    const lotSize = lot.lotSize || lot.offeredQty || 0;

    const { ac, re, sample, cumulative } = getSamplingValues(lotSize);
    return {
      lotNo: lotNo,
      heatNo: heatNo,
      quantity: lotSize,
      sampleSize: sample,
      accpNo: ac,
      rejNo: re,
      cummRejNo: cumulative
    };
  });
};

const FinalVisualDimensionalPage = ({ onBack, onNavigateSubmodule }) => {
  // Get live lot data from context
  const { getFpCachedData, selectedCall } = useInspection();

  // Get the call number - use selectedCall or fallback to sessionStorage
  const callNo = selectedCall?.call_no || sessionStorage.getItem('selectedCallNo');

  // Get cached dashboard data with fallback to sessionStorage
  const lotsFromVendor = useMemo(() => {
    const cachedData = getFpCachedData(callNo);
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
  }, [callNo, getFpCachedData]);

  const availableLots = useMemo(() => getAvailableLots(lotsFromVendor), [lotsFromVendor]);

  // Track if we've already loaded data to prevent infinite loops
  const dataLoadedRef = useRef(false);

  /* Section collapse states */
  const [visualExpanded, setVisualExpanded] = useState(true);
  const [dimensionalExpanded, setDimensionalExpanded] = useState(true);

  /* 2nd Sampling visibility states */
  const [showVisual2ndMap, setShowVisual2ndMap] = useState({});
  const [showDim2ndMap, setShowDim2ndMap] = useState({});

  /* Popup states */
  const [visualPopupLot, setVisualPopupLot] = useState(null);
  const [dimPopupLot, setDimPopupLot] = useState(null);

  const [lotData, setLotData] = useState(() => {
    // Get callNo for localStorage key
    const currentCallNo = selectedCall?.call_no || sessionStorage.getItem('selectedCallNo');

    // ✅ CRITICAL: Try to load from localStorage first on page load
    if (currentCallNo) {
      const persistedData = localStorage.getItem(`visualDimensionalData_${currentCallNo}`);
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

    // Fallback: Initialize empty data structure
    return availableLots.reduce(
      (acc, lot) => ({
        ...acc,
        [lot.lotNo]: {
          visualR1: "",
          visualR2: "",
          visualRemark: "",
          dimGo1: "",
          dimNoGo1: "",
          dimFlat1: "",
          dimGo2: "",
          dimNoGo2: "",
          dimFlat2: "",
          dimRemark: ""
        }
      }),
      {}
    );
  });

  // Helper function to initialize lot data
  const initializeLotData = useCallback(() => {
    setLotData(prev => {
      const newLotData = { ...prev };
      availableLots.forEach(lot => {
        if (!newLotData[lot.lotNo]) {
          newLotData[lot.lotNo] = {
            visualR1: "",
            visualR2: "",
            visualRemark: "",
            dimGo1: "",
            dimNoGo1: "",
            dimFlat1: "",
            dimGo2: "",
            dimNoGo2: "",
            dimFlat2: "",
            dimRemark: ""
          };
        }
      });
      return newLotData;
    });
  }, [availableLots]);

  // Load data from database or localStorage when page loads
  useEffect(() => {
    if (availableLots.length > 0 && callNo && !dataLoadedRef.current) {
      dataLoadedRef.current = true;

      const loadData = async () => {
        try {
          // Try to load persisted draft data first (highest priority)
          const persistedData = localStorage.getItem(`visualDimensionalData_${callNo}`);
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
          console.log('📥 Fetching data from database for call:', callNo);
          const [visualResponse, dimensionalResponse] = await Promise.all([
            getVisualInspectionByCallNo(callNo),
            getDimensionalInspectionFlatByCallNo(callNo)
          ]);

          const visualData = visualResponse?.responseData || [];
          const dimensionalData = dimensionalResponse?.responseData || [];

          console.log('Visual data from DB:', visualData);
          console.log('Dimensional data from DB:', dimensionalData);

          // Merge database data with initialized lot data
          const mergedData = { ...availableLots.reduce((acc, lot) => ({
            ...acc,
            [lot.lotNo]: {
              visualR1: "",
              visualR2: "",
              visualRemark: "",
              dimGo1: "",
              dimNoGo1: "",
              dimFlat1: "",
              dimGo2: "",
              dimNoGo2: "",
              dimFlat2: "",
              dimRemark: ""
            }
          }), {}) };

          // Merge visual inspection data
          visualData.forEach(record => {
            if (mergedData[record.lotNo]) {
              mergedData[record.lotNo].visualR1 = record.firstSampleRejected > 0 ? String(record.firstSampleRejected) : "";
              mergedData[record.lotNo].visualR2 = record.secondSampleRejected > 0 ? String(record.secondSampleRejected) : "";
              mergedData[record.lotNo].visualRemark = record.remarks || "";
              console.log(`✅ Merged visual data for lot ${record.lotNo}:`, mergedData[record.lotNo]);
            }
          });

          // Merge dimensional inspection data (FLAT STRUCTURE)
          dimensionalData.forEach(record => {
            if (mergedData[record.lotNo]) {
              // 1st Sampling - map flat fields
              mergedData[record.lotNo].dimGo1 = record.firstSampleGoGaugeFail > 0 ? String(record.firstSampleGoGaugeFail) : "";
              mergedData[record.lotNo].dimNoGo1 = record.firstSampleNoGoFail > 0 ? String(record.firstSampleNoGoFail) : "";
              mergedData[record.lotNo].dimFlat1 = record.firstSampleFlatBearingFail > 0 ? String(record.firstSampleFlatBearingFail) : "";

              // 2nd Sampling - map flat fields
              mergedData[record.lotNo].dimGo2 = record.secondSampleGoGaugeFail > 0 ? String(record.secondSampleGoGaugeFail) : "";
              mergedData[record.lotNo].dimNoGo2 = record.secondSampleNoGoFail > 0 ? String(record.secondSampleNoGoFail) : "";
              mergedData[record.lotNo].dimFlat2 = record.secondSampleFlatBearingFail > 0 ? String(record.secondSampleFlatBearingFail) : "";

              mergedData[record.lotNo].dimRemark = record.remarks || "";
              console.log(`✅ Merged dimensional data for lot ${record.lotNo}:`, mergedData[record.lotNo]);
            }
          });

          setLotData(mergedData);
          // ✅ CRITICAL: Persist fetched data to localStorage immediately
          localStorage.setItem(`visualDimensionalData_${callNo}`, JSON.stringify(mergedData));
          console.log('✅ Loaded data from database, merged, and persisted to localStorage');
        } catch (error) {
          console.error('Error loading data from database:', error);
          initializeLotData();
        }
      };

      loadData();
    }
  }, [callNo, availableLots, initializeLotData]);

  // Persist data whenever lotData changes
  useEffect(() => {
    if (Object.keys(lotData).length > 0 && callNo) {
      localStorage.setItem(`visualDimensionalData_${callNo}`, JSON.stringify(lotData));
    }
  }, [lotData, callNo]);

  const handleChange = (lotNo, field, value) => {
    // Text fields: visualRemark, dimRemark - keep as string
    // Numeric fields: all others - convert to number
    const isTextField = field === "visualRemark" || field === "dimRemark";

    setLotData(prev => ({
      ...prev,
      [lotNo]: {
        ...prev[lotNo],
        [field]: isTextField ? value : (value === "" ? "" : Number(value))
      }
    }));
  };

  const safe = val => (val === "" || isNaN(val) ? 0 : Number(val));

  /* ------------------------------
     VISUAL 2ND SAMPLING LOGIC
     Rules:
     - If R1 <= Acceptance No., 2nd Sampling will not open and Lot accepted
     - If R1 > Acceptance No. and R1 < Rejection No., 2nd Sampling will open
     - If R1 >= Rejection No., 2nd sampling will not open and lot rejected
  ------------------------------ */
  useEffect(() => {
    availableLots.forEach((lot) => {
      const data = lotData[lot.lotNo];
      if (!data) return;

      const r1 = safe(data.visualR1);
      const AC = lot.accpNo;
      const RE = lot.rejNo;

      const secondRequired = r1 > AC && r1 < RE;
      const secondNotRequired = r1 <= AC || r1 >= RE;
      const shown = !!showVisual2ndMap[lot.lotNo];

      // Auto-open when required
      if (secondRequired && !shown) {
        setShowVisual2ndMap((prev) => ({
          ...prev,
          [lot.lotNo]: true,
        }));
      }

      // Check if any 2nd sampling value is entered
      const has2ndData = data.visualR2 !== "";

      // Auto-hide or popup when 2nd sampling becomes unnecessary
      if (secondNotRequired && shown && !visualPopupLot) {
        if (has2ndData) {
          // Show popup only if user had entered something
          setVisualPopupLot(lot.lotNo);
        } else {
          // Auto-hide silently (no popup)
          setShowVisual2ndMap((prev) => ({
            ...prev,
            [lot.lotNo]: false,
          }));
        }
      }
    });
  }, [lotData, visualPopupLot, showVisual2ndMap, availableLots]);

  /* ------------------------------
     DIMENSIONAL 2ND SAMPLING LOGIC
     Rules:
     - If R1 <= Acceptance No., 2nd Sampling will not open and Lot accepted
     - If R1 > Acceptance No. and R1 < Rejection No., 2nd Sampling will open
     - If R1 >= Rejection No., 2nd sampling will not open and lot rejected
  ------------------------------ */
  useEffect(() => {
    availableLots.forEach((lot) => {
      const data = lotData[lot.lotNo];
      if (!data) return;

      const r1 = safe(data.dimGo1) + safe(data.dimNoGo1) + safe(data.dimFlat1);
      const AC = lot.accpNo;
      const RE = lot.rejNo;

      const secondRequired = r1 > AC && r1 < RE;
      const secondNotRequired = r1 <= AC || r1 >= RE;
      const shown = !!showDim2ndMap[lot.lotNo];

      // Auto-open when required
      if (secondRequired && !shown) {
        setShowDim2ndMap((prev) => ({
          ...prev,
          [lot.lotNo]: true,
        }));
      }

      // Check if any 2nd sampling value is entered
      const has2ndData = data.dimGo2 !== "" || data.dimNoGo2 !== "" || data.dimFlat2 !== "";

      // Auto-hide or popup when 2nd sampling becomes unnecessary
      if (secondNotRequired && shown && !dimPopupLot) {
        if (has2ndData) {
          // Show popup only if user had entered something
          setDimPopupLot(lot.lotNo);
        } else {
          // Auto-hide silently (no popup)
          setShowDim2ndMap((prev) => ({
            ...prev,
            [lot.lotNo]: false,
          }));
        }
      }
    });
  }, [lotData, dimPopupLot, showDim2ndMap, availableLots]);

  /* ------------------------------
     VISUAL POPUP HANDLERS
  ------------------------------ */
  const handleVisualPopupYesKeep = () => {
    if (!visualPopupLot) return;
    setShowVisual2ndMap((prev) => ({ ...prev, [visualPopupLot]: false }));
    setVisualPopupLot(null);
  };

  const handleVisualPopupNoDelete = () => {
    if (!visualPopupLot) return;
    setShowVisual2ndMap((prev) => ({ ...prev, [visualPopupLot]: false }));
    setLotData((prev) => ({
      ...prev,
      [visualPopupLot]: {
        ...prev[visualPopupLot],
        visualR2: "",
      },
    }));
    setVisualPopupLot(null);
  };

  /* ------------------------------
     DIMENSIONAL POPUP HANDLERS
  ------------------------------ */
  const handleDimPopupYesKeep = () => {
    if (!dimPopupLot) return;
    setShowDim2ndMap((prev) => ({ ...prev, [dimPopupLot]: false }));
    setDimPopupLot(null);
  };

  const handleDimPopupNoDelete = () => {
    if (!dimPopupLot) return;
    setShowDim2ndMap((prev) => ({ ...prev, [dimPopupLot]: false }));
    setLotData((prev) => ({
      ...prev,
      [dimPopupLot]: {
        ...prev[dimPopupLot],
        dimGo2: "",
        dimNoGo2: "",
        dimFlat2: "",
      },
    }));
    setDimPopupLot(null);
  };

  const styles = `
    .section-wrapper {
      background: #ffffff;
      border: 1px solid #dce1e7;
      border-radius: 10px;
      margin-bottom: 24px;
      overflow: hidden;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      cursor: pointer;
    }
    .section-header:hover { background: #f1f5f9; }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .collapse-btn {
      background: #e2e8f0;
      border: none;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
    }
    .collapse-btn:hover { background: #cbd5e1; }
    .section-content { padding: 16px; }
    .lot-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .lot-card:last-child { margin-bottom: 0; }
    .lot-header {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .lot-header-item { display: flex; gap: 4px; }
    .lot-header-label { color: #64748b; font-weight: 500; }
    .sampling-label {
      font-size: 13px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 8px;
    }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 12px; font-weight: 600; color: #475569; }
    .input {
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid #d1d9e6;
      height: 38px;
      font-size: 14px;
    }
    .input:disabled { background: #f1f5f9; }
    /* Visual Lot Row - Desktop: All fields in one row */
    .visual-lot-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      align-items: end;
    }
    @media (min-width: 1024px) {
      .visual-lot-row { grid-template-columns: 1fr 1fr 120px 140px 1fr; gap: 16px; }
      .visual-lot-row.no-r2 { grid-template-columns: 1fr 120px 140px 1fr; }
    }
    @media (min-width: 768px) and (max-width: 1023px) {
      .visual-lot-row { grid-template-columns: repeat(2, 1fr); }
    }
    /* Dimensional Grid */
    .dimensional-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
    @media (min-width: 768px) {
      .dimensional-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
    }
    /* Summary Grid */
    .summary-grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin-top: 12px; }
    @media (min-width: 768px) {
      .summary-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
    }
    .result-box {
      padding: 8px;
      border-radius: 6px;
      text-align: center;
      font-weight: 700;
      border: 1px solid transparent;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .sampling-divider {
      font-size: 13px;
      font-weight: 600;
      color: #0ea5e9;
      margin: 16px 0 8px;
      padding-top: 12px;
      border-top: 1px dashed #cbd5e1;
    }
    /* Popup */
    .popup-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .popup-box {
      background: white;
      padding: 20px;
      border-radius: 10px;
      width: 320px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .popup-actions {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    .popup-btn {
      padding: 7px 14px;
      border-radius: 6px;
      background: #e2e8f0;
      border: none;
      cursor: pointer;
      font-weight: 500;
    }
    .popup-btn.primary {
      background: #0f766e;
      color: white;
    }
  `;

  return (
    <div>
      <style>{styles}</style>

      {/* Visual Popup */}
      {visualPopupLot && (
        <div className="popup-overlay">
          <div className="popup-box">
            <p>
              2nd Sampling is no longer required.
              <br />
              Do you want to hide it?
            </p>
            <div className="popup-actions">
              <button className="popup-btn" onClick={handleVisualPopupNoDelete}>
                No (Clear & Hide)
              </button>
              <button className="popup-btn primary" onClick={handleVisualPopupYesKeep}>
                Yes (Hide Only)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dimensional Popup */}
      {dimPopupLot && (
        <div className="popup-overlay">
          <div className="popup-box">
            <p>
              2nd Sampling is no longer required.
              <br />
              Do you want to hide it?
            </p>
            <div className="popup-actions">
              <button className="popup-btn" onClick={handleDimPopupNoDelete}>
                No (Clear & Hide)
              </button>
              <button className="popup-btn primary" onClick={handleDimPopupYesKeep}>
                Yes (Hide Only)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-24)' }}>
        <div>
          <h1 className="page-title">Visual & Dimensional Check</h1>
          <p className="page-subtitle">Final Product Inspection – each lot displayed separately</p>
        </div>
        <button className="btn btn-outline" onClick={onBack}>
          ← Back to Final Product Dashboard
        </button>
      </div>

      <FinalSubmoduleNav currentSubmodule="final-visual-dimensional" onNavigate={onNavigateSubmodule} />

      {/* Show message if no lots available */}
      {availableLots.length === 0 && (
        <div style={{
          padding: '20px',
          background: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '8px',
          marginBottom: '20px',
          color: '#92400e'
        }}>
          <p>⚠️ No lots available. Please ensure the dashboard has loaded lot data.</p>
        </div>
      )}

      {/* ---------------- VISUAL INSPECTION ---------------- */}
      <div className="section-wrapper">
        <div className="section-header" onClick={() => setVisualExpanded(!visualExpanded)}>
          <h2 className="section-title">👁️ Visual Inspection</h2>
          <button className="collapse-btn">
            {visualExpanded ? '▲ Collapse' : '▼ Expand'}
          </button>
        </div>

        {visualExpanded && (
          <div className="section-content">
            {availableLots.map(lot => {
              const d = lotData[lot.lotNo];
              const r1 = safe(d.visualR1);
              const r2 = safe(d.visualR2);
              const show2nd = !!showVisual2ndMap[lot.lotNo];
              const totalRejected = r1 + (show2nd ? r2 : 0);

              // Check if any data has been filled
              const hasData = d.visualR1 !== "" || d.visualR2 !== "" || d.visualRemark !== "";

              /* 2nd sampling logic: If R1 > Acceptance No., show 2nd sampling */
              /* Final status: OK if R1 <= AccpNo, NOT OK if total >= CummRejNo, PENDING if no data */
              const status =
                !hasData
                  ? { text: "PENDING", color: "#f59e0b" }
                  : r1 <= lot.accpNo
                  ? { text: "OK", color: "#22c55e" }
                  : totalRejected >= lot.cummRejNo
                  ? { text: "NOT OK", color: "#ef4444" }
                  : { text: "Pending", color: "#f59e0b" };

              return (
                <div key={lot.lotNo} className="lot-card">
                  <div className="lot-header">
                    <span className="lot-header-item">
                      <span className="lot-header-label">Lot:</span> {lot.lotNo}
                    </span>
                    <span className="lot-header-item">
                      <span className="lot-header-label">Heat:</span> {lot.heatNo}
                    </span>
                    <span className="lot-header-item">
                      <span className="lot-header-label">Qty:</span> {lot.quantity}
                    </span>
                    <span className="lot-header-item">
                      <span className="lot-header-label">Sample:</span> {lot.sampleSize}
                    </span>
                    <span className="lot-header-item">
                      <span className="lot-header-label">Ac:</span> {lot.accpNo}
                    </span>
                    <span className="lot-header-item">
                      <span className="lot-header-label">Re:</span> {lot.rejNo}
                    </span>
                  </div>

                  {/* 1st Sampling Row - All fields in one row on desktop */}
                  <div className="sampling-label">1st Sampling</div>
                  <div className={`visual-lot-row ${!show2nd ? 'no-r2' : ''}`}>
                    <div className="field">
                      <label className="label">Rejected Pieces (R1)</label>
                      <input
                        type="number"
                        min="0"
                        className="input"
                        value={d.visualR1}
                        onChange={e => handleChange(lot.lotNo, "visualR1", e.target.value)}
                        placeholder="Enter count"
                      />
                    </div>

                    {show2nd && (
                      <div className="field">
                        <label className="label">2nd Sampling - Rejected (R2)</label>
                        <input
                          type="number"
                          min="0"
                          className="input"
                          value={d.visualR2}
                          onChange={e => handleChange(lot.lotNo, "visualR2", e.target.value)}
                          placeholder="Enter count"
                        />
                      </div>
                    )}

                    <div className="field">
                      <label className="label">Total Rejected</label>
                      <input className="input" value={totalRejected} disabled />
                    </div>

                    <div className="field">
                      <label className="label">Result</label>
                      <div
                        className="result-box"
                        style={{ color: status.color, borderColor: status.color, background: status.color + "22" }}
                      >
                        {status.text}
                      </div>
                    </div>

                    <div className="field">
                      <label className="label">Remarks</label>
                      <input
                        type="text"
                        className="input"
                        value={d.visualRemark}
                        onChange={e => handleChange(lot.lotNo, "visualRemark", e.target.value)}
                        placeholder="Enter remarks"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------------- DIMENSIONAL INSPECTION ---------------- */}
      <div className="section-wrapper">
        <div className="section-header" onClick={() => setDimensionalExpanded(!dimensionalExpanded)}>
          <h2 className="section-title">📏 Dimensional Inspection</h2>
          <button className="collapse-btn">
            {dimensionalExpanded ? '▲ Collapse' : '▼ Expand'}
          </button>
        </div>

        {dimensionalExpanded && (
          <div className="section-content">
            {availableLots.map(lot => {
              const d = lotData[lot.lotNo];
              const r1 = safe(d.dimGo1) + safe(d.dimNoGo1) + safe(d.dimFlat1);
              const r2 = safe(d.dimGo2) + safe(d.dimNoGo2) + safe(d.dimFlat2);
              const show2nd = !!showDim2ndMap[lot.lotNo];
              const totalRejected = r1 + (show2nd ? r2 : 0);

              // Check if any data has been filled
              const hasData = d.dimGo1 !== "" || d.dimNoGo1 !== "" || d.dimFlat1 !== "" ||
                              d.dimGo2 !== "" || d.dimNoGo2 !== "" || d.dimFlat2 !== "" ||
                              d.dimRemark !== "";

              /* Final status: OK if R1 <= AccpNo, NOT OK if total >= CummRejNo, PENDING if no data */
              const status =
                !hasData
                  ? { text: "PENDING", color: "#f59e0b" }
                  : r1 <= lot.accpNo
                  ? { text: "OK", color: "#22c55e" }
                  : totalRejected >= lot.cummRejNo
                  ? { text: "NOT OK", color: "#ef4444" }
                  : { text: "Pending", color: "#f59e0b" };

              return (
                <div key={lot.lotNo} className="lot-card">
                  <div className="lot-header">
                    <span className="lot-header-item">
                      <span className="lot-header-label">Lot:</span> {lot.lotNo}
                    </span>
                    <span className="lot-header-item">
                      <span className="lot-header-label">Heat:</span> {lot.heatNo}
                    </span>
                    <span className="lot-header-item">
                      <span className="lot-header-label">Qty:</span> {lot.quantity}
                    </span>
                    <span className="lot-header-item">
                      <span className="lot-header-label">Sample:</span> {lot.sampleSize}
                    </span>
                    <span className="lot-header-item">
                      <span className="lot-header-label">Ac:</span> {lot.accpNo}
                    </span>
                    <span className="lot-header-item">
                      <span className="lot-header-label">Re:</span> {lot.rejNo}
                    </span>
                  </div>

                  {/* 1st Sampling */}
                  <div className="sampling-label">1st Sampling</div>
                  <div className="dimensional-grid">
                    <div className="field">
                      <label className="label">Go Gauge Fail</label>
                      <input className="input" type="number" min="0" value={d.dimGo1}
                        onChange={e => handleChange(lot.lotNo, "dimGo1", e.target.value)}
                        placeholder="0" />
                    </div>
                    <div className="field">
                      <label className="label">No-Go Fail</label>
                      <input className="input" type="number" min="0" value={d.dimNoGo1}
                        onChange={e => handleChange(lot.lotNo, "dimNoGo1", e.target.value)}
                        placeholder="0" />
                    </div>
                    <div className="field">
                      <label className="label">Flat Bearing Fail</label>
                      <input className="input" type="number" min="0" value={d.dimFlat1}
                        onChange={e => handleChange(lot.lotNo, "dimFlat1", e.target.value)}
                        placeholder="0" />
                    </div>
                  </div>

                  {/* 2nd Sampling - Shows when R1 > Acceptance No. */}
                  {show2nd && (
                    <>
                      <div className="sampling-divider">2nd Sampling (R1 &gt; Acceptance No.)</div>
                      <div className="dimensional-grid">
                        <div className="field">
                          <label className="label">Go Gauge Fail (2nd)</label>
                          <input className="input" type="number" min="0" value={d.dimGo2}
                            onChange={e => handleChange(lot.lotNo, "dimGo2", e.target.value)}
                            placeholder="0" />
                        </div>
                        <div className="field">
                          <label className="label">No-Go Fail (2nd)</label>
                          <input className="input" type="number" min="0" value={d.dimNoGo2}
                            onChange={e => handleChange(lot.lotNo, "dimNoGo2", e.target.value)}
                            placeholder="0" />
                        </div>
                        <div className="field">
                          <label className="label">Flat Bearing Fail (2nd)</label>
                          <input className="input" type="number" min="0" value={d.dimFlat2}
                            onChange={e => handleChange(lot.lotNo, "dimFlat2", e.target.value)}
                            placeholder="0" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Summary Row */}
                  <div className="summary-grid">
                    <div className="field">
                      <label className="label">Total Rejected</label>
                      <input className="input" value={totalRejected} disabled />
                    </div>
                    <div className="field">
                      <label className="label">Result</label>
                      <div
                        className="result-box"
                        style={{ color: status.color, borderColor: status.color, background: status.color + "22" }}
                      >
                        {status.text}
                      </div>
                    </div>
                    <div className="field">
                      <label className="label">Remarks</label>
                      <input
                        className="input"
                        value={d.dimRemark}
                        onChange={e => handleChange(lot.lotNo, "dimRemark", e.target.value)}
                        placeholder="Enter remarks"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default FinalVisualDimensionalPage;
