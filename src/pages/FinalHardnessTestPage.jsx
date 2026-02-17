import { useState, useMemo, useEffect } from "react";
import { useInspection } from "../context/InspectionContext";
import FinalSubmoduleNav from "../components/FinalSubmoduleNav";
import ExcelImport from "../components/ExcelImport";
import Pagination from "../components/Pagination";
import "./FinalHardnessTestPage.css";
import { getHardnessToeLoadAQL } from "../utils/is2500Calculations";
import { getHardnessTestsByCall } from "../services/finalInspectionSubmoduleService";

const FinalHardnessTestPage = ({ onBack, onNavigateSubmodule }) => {
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

  /* --- LOT AQL Info --- */
  const availableLots = useMemo(() => {
    return lotsFromVendor.map((lot) => {
      // Handle both API response format (lotNumber, heatNumber) and mapped format (lotNo, heatNo)
      const lotNo = lot.lotNo || lot.lotNumber;
      const heatNo = lot.heatNo || lot.heatNumber;
      const lotSize = lot.lotSize || lot.offeredQty || 0;

      const aql = getHardnessToeLoadAQL(lotSize);
      return {
        lotNo: lotNo,
        heatNo: heatNo,
        quantity: lotSize,
        sampleSize: aql.n1,
        accpNo: aql.ac1,
        rejNo: aql.re1,
        sample2Size: aql.n2,
        cummRejNo: aql.cummRej,
        singleSampling: aql.useSingleSampling || false,
      };
    });
  }, [lotsFromVendor]);

  /* --- Initial Hardness Data Storage --- */
  const [lotData, setLotData] = useState(() => {
    // Get callNo for localStorage key
    const currentCallNo = selectedCall?.call_no || sessionStorage.getItem('selectedCallNo');

    // ✅ CRITICAL: Try to load from localStorage first on page load
    if (currentCallNo) {
      const persistedData = localStorage.getItem(`hardnessTestData_${currentCallNo}`);
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
          hardness1st: Array(lot.sampleSize).fill(""),
          hardness2nd: Array(lot.sample2Size).fill(""),
          remarks: "",
        },
      }),
      {}
    );
  });

  // Load data from database or localStorage when page loads
  useEffect(() => {
    if (availableLots.length > 0 && callNo) {
      const loadData = async () => {
        try {
          // Try to load persisted draft data first (highest priority)
          const persistedData = localStorage.getItem(`hardnessTestData_${callNo}`);
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
          console.log('📥 Fetching hardness test data from database for call:', callNo);
          const response = await getHardnessTestsByCall(callNo);
          const dbData = response?.responseData || [];

          console.log('Hardness test data from DB:', dbData);

          // Merge database data with initialized lot data
          const mergedData = { ...availableLots.reduce((acc, lot) => ({
            ...acc,
            [lot.lotNo]: {
              hardness1st: Array(lot.sampleSize).fill(""),
              hardness2nd: Array(lot.sample2Size).fill(""),
              remarks: "",
            }
          }), {}) };

          // Map database records to frontend format
          dbData.forEach(record => {
            if (mergedData[record.lotNo]) {
              // Extract samples by sampling number
              const samples1st = record.samples?.filter(s => s.samplingNo === 1) || [];
              const samples2nd = record.samples?.filter(s => s.samplingNo === 2) || [];

              // Populate 1st sampling - preserve full array size
              if (samples1st.length > 0) {
                const sortedSamples = samples1st.sort((a, b) => a.sampleNo - b.sampleNo);
                sortedSamples.forEach(s => {
                  if (s.sampleNo > 0 && s.sampleNo <= mergedData[record.lotNo].hardness1st.length) {
                    mergedData[record.lotNo].hardness1st[s.sampleNo - 1] = s.sampleValue ? String(s.sampleValue) : "";
                  }
                });
              }

              // Populate 2nd sampling - preserve full array size
              if (samples2nd.length > 0) {
                const sortedSamples = samples2nd.sort((a, b) => a.sampleNo - b.sampleNo);
                sortedSamples.forEach(s => {
                  if (s.sampleNo > 0 && s.sampleNo <= mergedData[record.lotNo].hardness2nd.length) {
                    mergedData[record.lotNo].hardness2nd[s.sampleNo - 1] = s.sampleValue ? String(s.sampleValue) : "";
                  }
                });
              }

              mergedData[record.lotNo].remarks = record.remarks || "";
            }
          });

          setLotData(mergedData);
          // ✅ CRITICAL: Persist fetched data to localStorage immediately
          localStorage.setItem(`hardnessTestData_${callNo}`, JSON.stringify(mergedData));
          console.log('✅ Loaded data from database, merged, and persisted to localStorage');
        } catch (error) {
          console.error('Error loading data from database:', error);
          // Initialize empty data on error
          const emptyData = availableLots.reduce((acc, lot) => ({
            ...acc,
            [lot.lotNo]: {
              hardness1st: Array(lot.sampleSize).fill(""),
              hardness2nd: Array(lot.sample2Size).fill(""),
              remarks: "",
            }
          }), {});
          setLotData(emptyData);
        }
      };

      loadData();
    }
  }, [callNo, availableLots]);

  // Persist data whenever lotData changes
  useEffect(() => {
    if (Object.keys(lotData).length > 0 && callNo) {
      localStorage.setItem(`hardnessTestData_${callNo}`, JSON.stringify(lotData));
    }
  }, [lotData, callNo]);

  /* ------------------------------
     PAGINATION - ROWS HANDLER
  ------------------------------ */

  // Default rows per page = desktop: 20, mobile: 10
  const isMobile = window.innerWidth < 768;
  const defaultRows = isMobile ? 10 : 20;

  // Store row count per lot (1st sampling)
  const [rowsPerPageMap, setRowsPerPageMap] = useState({});
  // Store page number per lot (1st sampling)
  const [pageMap, setPageMap] = useState({});

  // Same for 2nd sampling
  const [rowsPerPageMap2, setRowsPerPageMap2] = useState({});
  const [pageMap2, setPageMap2] = useState({});

  const setRowsAndResetPage = (lotNo, value, second = false) => {
    if (second) {
      setRowsPerPageMap2((prev) => ({ ...prev, [lotNo]: value }));
      setPageMap2((prev) => ({ ...prev, [lotNo]: 0 }));
    } else {
      setRowsPerPageMap((prev) => ({ ...prev, [lotNo]: value }));
      setPageMap((prev) => ({ ...prev, [lotNo]: 0 }));
    }
  };

  /* ------------------------------
     2ND SAMPLING LOGIC
  ------------------------------ */
  const [show2ndSamplingMap, setShow2ndSamplingMap] = useState({});
  const [popupLot, setPopupLot] = useState(null);

 useEffect(() => {
  availableLots.forEach((lot) => {
    const data = lotData[lot.lotNo];
    if (!data) return;

    const R1 = data.hardness1st.filter(
      (v) => v && (parseFloat(v) < 40 || parseFloat(v) > 44)
    ).length;

    const AC = lot.accpNo;
    const RE = lot.rejNo;

    const secondRequired = R1 > AC && R1 < RE;
    const secondNotRequired = R1 <= AC || R1 >= RE;

    const shown = !!show2ndSamplingMap[lot.lotNo];

    // Auto-open when required
    if (secondRequired && !shown) {
      setShow2ndSamplingMap((prev) => ({
        ...prev,
        [lot.lotNo]: true,
      }));
    }

    // Check if any 2nd sampling value is entered
    const has2ndData = data.hardness2nd.some((v) => v !== "");

    // Auto-hide or popup when 2nd sampling becomes unnecessary
    if (secondNotRequired && shown && !popupLot) {
      if (has2ndData) {
        // Show popup only if user had entered something
        setPopupLot(lot.lotNo);
      } else {
        // Auto-hide silently (no popup)
        setShow2ndSamplingMap((prev) => ({
          ...prev,
          [lot.lotNo]: false,
        }));
      }
    }
  });
}, [lotData, availableLots, popupLot, show2ndSamplingMap]);
 /* ------------------------------
     INPUT HANDLERS
  ------------------------------ */

  const handleHardnessChange = (lotNo, idx, value, is2nd = false) => {
    setLotData((prev) => {
      const updated = { ...prev[lotNo] };
      const arr = is2nd
        ? [...updated.hardness2nd]
        : [...updated.hardness1st];

      arr[idx] = value;

      return {
        ...prev,
        [lotNo]: {
          ...updated,
          [is2nd ? "hardness2nd" : "hardness1st"]: arr,
        },
      };
    });
  };

  const handleExcelImport = (lotNo, values, is2nd = false) => {
    setLotData((prev) => ({
      ...prev,
      [lotNo]: {
        ...prev[lotNo],
        [is2nd ? "hardness2nd" : "hardness1st"]: values,
      },
    }));
  };

  const getValueStatus = (v) => {
    if (!v) return "";
    const num = parseFloat(v);
    return num >= 40 && num <= 44 ? "pass" : "fail";
  };

  /* ------------------------------
     POPUP ACTIONS
  ------------------------------ */

  const handlePopupYesKeep = () => {
    if (!popupLot) return;
    setShow2ndSamplingMap((prev) => ({ ...prev, [popupLot]: false }));
    setPopupLot(null);
  };

  const handlePopupNoDelete = () => {
    if (!popupLot) return;
    const lot = availableLots.find((l) => l.lotNo === popupLot);
    if (!lot) return;

    setShow2ndSamplingMap((prev) => ({ ...prev, [popupLot]: false }));

    setLotData((prev) => ({
      ...prev,
      [popupLot]: {
        ...prev[popupLot],
        hardness2nd: Array(lot.sample2Size).fill(""),
      },
    }));

    setPopupLot(null);
  };

  /* ------------------------------
     COMPONENT RENDER
  ------------------------------ */

  return (
    <div className="fh-page">
      {/* Popup */}
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
      <div className="fh-header">
        <div>
          <h1>Hardness Test</h1>
          <p>Final Product Inspection — IS 2500</p>
        </div>
        <button className="btn btn-outline" onClick={onBack}>
          ← Back
        </button>
      </div>

      <FinalSubmoduleNav
        currentSubmodule="final-hardness-test"
        onNavigate={onNavigateSubmodule}
      />

      {/* LOT LOOP */}
      {availableLots.map((lot) => {
        const data = lotData[lot.lotNo];
        const R1 = data.hardness1st.filter(
          (v) => v && (v < 40 || v > 44)
        ).length;
        const R2 = data.hardness2nd.filter(
          (v) => v && (v < 40 || v > 44)
        ).length;

        const totalRejected = R1 + R2;
        const show2ndSampling = !!show2ndSamplingMap[lot.lotNo];

        /* Calculate result status */
        let result = 'PENDING';
        let color = '#f59e0b';
        const hasInput = data.hardness1st.some(v => v !== '');

        if (hasInput) {
          if (R1 <= lot.accpNo) {
            result = 'OK'; color = '#16a34a';
          } else if (R1 >= lot.rejNo) {
            result = 'NOT OK'; color = '#dc2626';
          } else if (show2ndSampling) {
            if (totalRejected < lot.cummRejNo) {
              result = 'OK'; color = '#16a34a';
            } else if (totalRejected >= lot.cummRejNo) {
              result = 'NOT OK'; color = '#dc2626';
            }
          }
        }

        /* ------------------------------
           PAGINATION VALUES (1st sampling)
        ------------------------------ */
        const rows = rowsPerPageMap[lot.lotNo] || defaultRows;
        const page = pageMap[lot.lotNo] || 0;

        const start = page * rows;
        const end = Math.min(start + rows, lot.sampleSize);

        const paginated1 = data.hardness1st.slice(start, end);

        const totalPages = Math.ceil(lot.sampleSize / rows);

        /* ------------------------------
           PAGINATION VALUES (2nd sampling)
        ------------------------------ */
        const rows2 = rowsPerPageMap2[lot.lotNo] || defaultRows;
        const page2 = pageMap2[lot.lotNo] || 0;

        const start2 = page2 * rows2;
        const end2 = Math.min(start2 + rows2, lot.sample2Size);

        const paginated2 = data.hardness2nd.slice(start2, end2);
        const totalPages2 = Math.ceil(lot.sample2Size / rows2);

        return (
          <div key={lot.lotNo} className="lot-section">
            <div className="lot-header">
              📦 {lot.lotNo} | Heat {lot.heatNo} | Qty {lot.quantity}
            </div>

            <div className="limit-box">
              Ac1: <b>{lot.accpNo}</b> | Re1: <b>{lot.rejNo}</b> | Cumm:{" "}
              <b>{lot.cummRejNo}</b>
            </div>

            {/* FIRST SAMPLING */}
            <div className="sampling-header">
              <h3>1st Sampling (n1: {lot.sampleSize})</h3>

              <ExcelImport
                templateName={`${lot.lotNo}_Hardness_1st`}
                sampleSize={lot.sampleSize}
                valueLabel="Hardness"
                onImport={(values) =>
                  handleExcelImport(lot.lotNo, values, false)
                }
              />
            </div>

            <div className="values-grid">
              {paginated1.map((val, i) => {
                const actualIdx = start + i;
                const status = getValueStatus(val);
                return (
                  <div key={actualIdx} className="input-wrapper">
                    <label className="input-label">#{actualIdx + 1}</label>
                    <input
                      type="number"
                      step="0.1"
                      className={`value-input ${status}`}
                      value={val}
                      onChange={(e) =>
                        handleHardnessChange(lot.lotNo, actualIdx, e.target.value)
                      }
                      placeholder="0.0"
                    />
                  </div>
                );
              })}
            </div>

            <div className="compact-row">
              <div className="summary-item">
                Rejected (R1): <strong className="r1-value">{R1}</strong>
              </div>
              <div className="summary-item">
                Accp No.: <strong>{lot.accpNo}</strong> | Rej No.: <strong>{lot.rejNo}</strong> | Cumm. Rej: <strong>{lot.cummRejNo}</strong>
              </div>
              <div className="result-box small" style={{ borderColor: color, color: color }}>{result}</div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                start={start}
                end={end}
                totalCount={lot.sampleSize}
                rows={rows}
                onRowsChange={(newRows) => setRowsAndResetPage(lot.lotNo, newRows)}
                onPageChange={(p) =>
                setPageMap((prev) => ({ ...prev, [lot.lotNo]: p }))
                }
              />
            </div>

            {/* SECOND SAMPLING */}
            {show2ndSampling && (
              <>
                <div className="sampling-header yellow-bg">
                  <h3>⚠️ 2nd Sampling (n2: {lot.sample2Size})</h3>
                  <ExcelImport
                    templateName={`${lot.lotNo}_Hardness_2nd`}
                    sampleSize={lot.sample2Size}
                    valueLabel="Hardness"
                    onImport={(values) =>
                      handleExcelImport(lot.lotNo, values, true)
                    }
                  />
                </div>

                <div className="values-grid">
                  {paginated2.map((val, i) => {
                    const actualIdx = start2 + i;
                    const status = getValueStatus(val);
                    return (
                      <div key={actualIdx} className="input-wrapper">
                        <label className="input-label">#{actualIdx + 1}</label>
                        <input
                          type="number"
                          step="0.1"
                          className={`value-input ${status}`}
                          value={val}
                          onChange={(e) =>
                            handleHardnessChange(
                              lot.lotNo,
                              actualIdx,
                              e.target.value,
                              true
                            )
                          }
                          placeholder="0.0"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="compact-row">
                  <div className="summary-item">
                    Rejected (R2): <strong className="r2-value">{R2}</strong>
                  </div>
                  <div className="summary-item">
                    Total (R1 + R2): <strong className={totalRejected >= lot.cummRejNo ? 'fail-value' : 'ok-value'}>{totalRejected}</strong>
                  </div>
                  <div className="result-box small" style={{ borderColor: color, color: color }}>{result}</div>
                  <Pagination
                    currentPage={page2}
                    totalPages={totalPages2}
                    start={start2}
                    end={end2}
                    totalCount={lot.sample2Size}
                    rows={rows2}
                    onRowsChange={(newRows) =>
                      setRowsAndResetPage(lot.lotNo, newRows, true)
                    }
                    onPageChange={(p) =>
                      setPageMap2((prev) => ({ ...prev, [lot.lotNo]: p }))
                    }
                  />
                </div>

              </>
            )}

            {/* REMARKS */}
            <div className="final-row">
              <div className="remarks-section">
                <label className="label">Remarks</label>
                <textarea
                  className="remarks-box"
                  rows="3"
                  placeholder="Enter remarks..."
                  value={data.remarks}
                  onChange={(e) =>
                    setLotData((prev) => ({
                      ...prev,
                      [lot.lotNo]: {
                        ...prev[lot.lotNo],
                        remarks: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* Bottom Buttons */}
      {/* <div className="bottom-actions">
        <button className="btn btn-outline" onClick={onBack}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={() => alert("Saved!")}
        >
          Save & Continue
        </button>
      </div> */}
    </div>
  );
};

export default FinalHardnessTestPage;
