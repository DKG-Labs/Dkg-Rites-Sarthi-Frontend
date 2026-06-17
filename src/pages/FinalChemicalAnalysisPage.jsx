import { useState, useEffect, useMemo } from "react";
import { useInspection } from "../context/InspectionContext";
import FinalSubmoduleNav from "../components/FinalSubmoduleNav";
import { getChemicalAnalysisByCall, getLadleValuesByCall } from "../services/finalInspectionSubmoduleService";
import "./FinalChemicalAnalysisPage.css";

const FinalChemicalAnalysisPage = ({ onBack, onNavigateSubmodule }) => {
  // State for lot selection toggle
  const [activeLotTab, setActiveLotTab] = useState(0);

  // Get live lot data from context
  const { getFpCachedData, selectedCall } = useInspection();

  // Get the call number - use selectedCall or fallback to sessionStorage
  const callNo = selectedCall?.call_no || sessionStorage.getItem('selectedCallNo');

  // Get cached dashboard data with fallback to sessionStorage
  const cachedData = getFpCachedData(callNo);

  // Memoize lotsFromVendor
  const lotsFromVendor = useMemo(() => {
    let lots = cachedData?.finalLotDetails || [];

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

  // Declare state BEFORE using it in mappings
  const [chemValues, setChemValues] = useState(() => {
    const persistedData = localStorage.getItem(`chemicalAnalysisData_${callNo}`);
    if (persistedData) {
      try {
        const parsed = JSON.parse(persistedData);
        return parsed.chemValues || {};
      } catch (e) {
        console.error('Error parsing persisted chemical data:', e);
      }
    }
    return {};
  });

  const [remarks, setRemarks] = useState(() => {
    const persistedData = localStorage.getItem(`chemicalAnalysisData_${callNo}`);
    if (persistedData) {
      try {
        const parsed = JSON.parse(persistedData);
        return parsed.remarks || {};
      } catch (e) {
        console.error('Error parsing persisted remarks:', e);
      }
    }
    return {};
  });

  const [ladleValues, setLadleValues] = useState(() => {
    const persistedData = localStorage.getItem(`chemicalAnalysisData_${callNo}`);
    if (persistedData) {
      try {
        const parsed = JSON.parse(persistedData);
        return parsed.ladleValues || [];
      } catch (e) {
        console.error('Error parsing persisted ladle values:', e);
      }
    }
    return [];
  });

  // Map live lot data to component format (after state declarations)
  const availableLots = useMemo(() => lotsFromVendor.map(lot => {
    const lotNo = lot.lotNo || lot.lotNumber;
    const heatNo = lot.heatNo || lot.heatNumber;

    // Find ladle values for this lot
    const ladleData = ladleValues.find(l => l.lotNo === lotNo || l.heatNo === heatNo);

    return {
      lotNo: lotNo,
      heatNo: heatNo,
      quantity: lot.lotSize || lot.offeredQty || 0,
      ladleAnalysis: {
        c: ladleData?.percentC || 0,
        si: ladleData?.percentSi || 0,
        mn: ladleData?.percentMn || 0,
        s: ladleData?.percentS || 0,
        p: ladleData?.percentP || 0
      },
    };
  }), [lotsFromVendor, ladleValues]);

  const [expandedLot, setExpandedLot] = useState(availableLots[0]?.lotNo || ""); // Default to first lot

  // Fetch product values from backend
  useEffect(() => {
    if (callNo) {
      getChemicalAnalysisByCall(callNo)
        .then((chemicalResponse) => {
          // Extract product values (final composition analysis already entered)
          const chemicalData = chemicalResponse?.responseData || chemicalResponse?.data || [];
          if (Array.isArray(chemicalData) && chemicalData.length > 0) {
            const chemMap = {};
            const remarksMap = {};
            chemicalData.forEach((chem) => {
              const lotNo = chem.lotNo;
              if (!chemMap[lotNo]) {
                chemMap[lotNo] = {};
              }
              // Store product values by element
              chemMap[lotNo].c = chem.carbonPercent;
              chemMap[lotNo].si = chem.siliconPercent;
              chemMap[lotNo].mn = chem.manganesePercent;
              chemMap[lotNo].s = chem.sulphurPercent;
              chemMap[lotNo].p = chem.phosphorusPercent;
              // Extract remarks from API response
              remarksMap[lotNo] = chem.remarks || "";
            });

            // Merge with persisted data - persisted data takes priority (user edits)
            setChemValues((prevChemValues) => {
              const mergedValues = { ...chemMap };
              // If user has already edited values, keep them
              Object.keys(prevChemValues).forEach((lotNo) => {
                if (mergedValues[lotNo]) {
                  // Keep any non-empty user-edited values
                  Object.keys(prevChemValues[lotNo]).forEach((element) => {
                    if (prevChemValues[lotNo][element] !== "" && prevChemValues[lotNo][element] !== undefined) {
                      mergedValues[lotNo][element] = prevChemValues[lotNo][element];
                    }
                  });
                } else {
                  // If lot doesn't exist in API response, keep user's data
                  mergedValues[lotNo] = prevChemValues[lotNo];
                }
              });
              console.log('✅ Product values loaded and merged:', mergedValues);
              return mergedValues;
            });

            // Merge remarks with persisted data - persisted data takes priority (user edits)
            setRemarks((prevRemarks) => {
              const mergedRemarks = { ...remarksMap };
              // If user has already edited remarks, keep them
              Object.keys(prevRemarks).forEach((lotNo) => {
                if (prevRemarks[lotNo] !== "" && prevRemarks[lotNo] !== undefined) {
                  mergedRemarks[lotNo] = prevRemarks[lotNo];
                }
              });
              console.log('✅ Remarks loaded and merged:', mergedRemarks);
              return mergedRemarks;
            });
          } else {
            console.log('ℹ️ No product values found - starting fresh');
          }
        })
        .catch((error) => {
          console.error('❌ Error loading product values:', error);
          // Continue without data - they're optional
        });
    }
  }, [callNo]);

  // Fetch ladle values
  useEffect(() => {
    if (callNo) {
      getLadleValuesByCall(callNo)
        .then((response) => {
          const data = response?.responseData || [];
          console.log('✅ Ladle values fetched:', data);
          setLadleValues(data);
        })
        .catch((error) => {
          console.error('❌ Error fetching ladle values:', error);
        });
    }
  }, [callNo]);

  useEffect(() => {
    if (!callNo) return;

    const timeoutId = setTimeout(() => {
      localStorage.setItem(`chemicalAnalysisData_${callNo}`, JSON.stringify({
        chemValues,
        remarks,
        ladleValues // Save ladle values for dashboard validation
      }));
      console.log('💾 Persisted chemical data to localStorage (debounced)');
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [chemValues, remarks, ladleValues, callNo]);

  const chemicalFields = [
    { id: "c", label: "% C (Carbon)" },
    { id: "si", label: "% Si (Silicon)" },
    { id: "mn", label: "% Mn (Manganese)" },
    { id: "s", label: "% S (Sulphur)" },
    { id: "p", label: "% P (Phosphorus)" },
  ];

  /* Element specification ranges */
  const elementRanges = {
    c: { min: 0.5, max: 0.6 },
    mn: { min: 0.8, max: 1.0 },
    si: { min: 1.5, max: 2.0 },
    s: { min: 0, max: 0.03 },
    p: { min: 0, max: 0.03 },
  };

  /* Tolerance from ladle value - TEMPORARILY COMMENTED OUT */
  /*
  const tolerances = {
    c: 0.03,
    mn: 0.04,
    si: 0.05,
    s: 0.005,
    p: 0.005,
  };
  */

  const handleChemChange = (lotNo, element, value) => {
    setChemValues((prev) => ({
      ...prev,
      [lotNo]: { ...(prev[lotNo] || {}), [element]: value },
    }));
  };

  const toggleLot = (lotNo) => {
    setExpandedLot((prev) => (prev === lotNo ? null : lotNo));
  };

  /* Validation function for product value */
  const getValueStatus = (element, productValue, ladleValue) => {
    if (!productValue || productValue === "") return "";

    const pVal = parseFloat(productValue);

    if (isNaN(pVal)) return "";

    const range = elementRanges[element];

    // Rule: Must be within absolute spec AND within tolerance from ladle
    const withinSpec = pVal >= (range.min - 0.0001) && pVal <= (range.max + 0.0001);

    // TEMPORARILY COMMENTED OUT - Validation with Ladle values entered by vendor
    /*
    const lVal = parseFloat(ladleValue);
    if (isNaN(lVal)) return "";
    const tolerance = tolerances[element];
    // Special rule for Sulphur and Phosphorus
    if (element === "s" || element === "p") {
      // Must be within absolute spec AND not cross (Ladle + 0.005)
      return (withinSpec && pVal <= (lVal + tolerance)) ? "pass" : "fail";
    }

    // Standard rule for Carbon, Silicon, Manganese (± tolerance)
    const diff = Math.abs(pVal - lVal);
    const withinTolerance = diff <= (tolerance + 0.0001);

    return (withinTolerance && withinSpec) ? "pass" : "fail";
    */

    return withinSpec ? "pass" : "fail";
  };

  return (
    <div className="chem-page">
      {/* HEADER */}
      <div className="chem-header">
        <div className="chem-header-text">
          <h1>Chemical Analysis</h1>
          <p>Final Product Inspection - One section per Lot</p>
        </div>
        <button className="btn btn-outline back-btn" onClick={onBack}>
          ← Back
        </button>
      </div>

      <FinalSubmoduleNav
        currentSubmodule="final-chemical-analysis"
        onNavigate={onNavigateSubmodule}
      />

      {/* Lot Selector – shown only when multiple lots */}
      {availableLots.length > 1 && (
        <div className="lot-selector">
          {availableLots.map((lot, idx) => (
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


      {/* DESKTOP/TABLET VIEW */}
      <div className="desktop-fields">
        {availableLots.map((lot, idx) => {
          if (activeLotTab !== idx) return null;
          return (
            <div key={lot.lotNo} className="chem-section">
              <div className="chem-title">
                📦 Lot: {lot.lotNo} | Heat No: {lot.heatNo}
              </div>

              <div className="chem-label-grid">
                <span></span> {/* empty space for label column */}
                {chemicalFields.map((field) => (
                  <span key={field.id}>{field.label}</span>
                ))}
              </div>


              <div className="chem-row">
                <div className="chem-row-label">Ladle Values</div>
                <div className="chem-input-grid">
                  {chemicalFields.map((field) => (
                    <div key={field.id} className="ladle-value">
                      {lot.ladleAnalysis[field.id]?.toFixed(
                        field.id === "s" || field.id === "p" ? 3 : 2
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="chem-row">
                <div className="chem-row-label">Product Values</div>
                <div className="chem-input-grid">
                  {chemicalFields.map((field) => {
                    const productValue = chemValues[lot.lotNo]?.[field.id] || "";
                    const ladleValue = lot.ladleAnalysis[field.id];
                    const status = getValueStatus(field.id, productValue, ladleValue);

                    return (
                      <input
                        key={field.id}
                        type="number"
                        step="0.001"
                        className={`product-input ${status}`}
                        placeholder="Enter value"
                        value={productValue}
                        onChange={(e) =>
                          handleChemChange(lot.lotNo, field.id, e.target.value)
                        }
                      />
                    );
                  })}
                </div>
              </div>

              <div className="chem-row">
                <div className="chem-row-label">Remarks</div>
                <textarea
                  className="remarks-input"
                  placeholder="Enter remarks..."
                  value={remarks[lot.lotNo] || ""}
                  onChange={(e) =>
                    setRemarks((prev) => ({
                      ...prev,
                      [lot.lotNo]: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* MOBILE VIEW (COLLAPSIBLE) */}
      <div className="mobile-fields">
        {availableLots.map((lot, idx) => {
          if (activeLotTab !== idx) return null;
          return (
            <div
              key={lot.lotNo}
              className={`mobile-lot ${expandedLot === lot.lotNo ? "open" : ""
                }`}
            >
              <div
                className="mobile-lot-header"
                onClick={() => toggleLot(lot.lotNo)}
              >
                <span>
                  📦 {lot.lotNo} | {lot.heatNo}
                </span>
                <span className="arrow">{expandedLot === lot.lotNo ? "▲" : "▼"}</span>
              </div>

              <div className="mobile-lot-body">
                <div className="mobile-lot-body-content">
                  {chemicalFields.map((field) => {
                    const productValue = chemValues[lot.lotNo]?.[field.id] || "";
                    const ladleValue = lot.ladleAnalysis[field.id];
                    const status = getValueStatus(field.id, productValue, ladleValue);

                    return (
                      <div key={field.id} className="mobile-field-block">
                        <div className="mobile-field-label">{field.label}</div>
                        <div className="mobile-ladle">
                          <strong>Ladle:</strong>{" "}
                          {lot.ladleAnalysis[field.id]?.toFixed(
                            field.id === "s" || field.id === "p" ? 3 : 2
                          )}
                        </div>
                        <input
                          type="number"
                          step="0.001"
                          className={`mobile-product ${status}`}
                          placeholder="Enter product value"
                          value={productValue}
                          onChange={(e) =>
                            handleChemChange(lot.lotNo, field.id, e.target.value)
                          }
                        />
                      </div>
                    );
                  })}

                  <div className="mobile-field-block remarks-block">
                    <div className="mobile-field-label">Remarks</div>
                    <textarea
                      className="remarks-input"
                      placeholder="Enter remarks..."
                      value={remarks[lot.lotNo] || ""}
                      onChange={(e) =>
                        setRemarks((prev) => ({
                          ...prev,
                          [lot.lotNo]: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      {/* <div className="chem-footer">
        <button className="btn btn-outline" onClick={onBack}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={() => alert("Chemical Data Saved!")}
        >
          Save & Continue
        </button>
      </div> */}
    </div>
  );
};

export default FinalChemicalAnalysisPage;
