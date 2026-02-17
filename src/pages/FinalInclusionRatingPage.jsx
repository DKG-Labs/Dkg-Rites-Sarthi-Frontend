import { useState, useMemo, useEffect } from 'react';
import { useInspection } from '../context/InspectionContext';
import FinalSubmoduleNav from '../components/FinalSubmoduleNav';
import {
  getDepthOfDecarburizationByCall,
  getInclusionRatingByCall,
  getMicrostructureTestByCall,
  getFreedomFromDefectsTestByCall
} from '../services/finalInspectionSubmoduleService';

/*
  Lots Data - Auto-fetched from Final Product Dashboard
  barDia (d) comes from Pre-Inspection Data Entry where user enters Bar Diameter for each lot
  hardnessSampleSize comes from Hardness Test sample size (calculated via IS 2500)
*/

const FinalInclusionRatingPage = ({ onBack, onNavigateSubmodule }) => {
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

  /*
    Calculate sample size for each lot: 6 or 0.5% of lot size (whichever is higher)
    Formula: max(6, ceil(lotSize * 0.5 / 100)) = max(6, ceil(lotSize * 0.005))
  */
  const lotsWithSampleSize = useMemo(() => {
    return lotsFromVendor.map((lot) => {
      // Handle both API response format (lotNumber, heatNumber) and mapped format (lotNo, heatNo)
      const lotNo = lot.lotNo || lot.lotNumber;
      const heatNo = lot.heatNo || lot.heatNumber;
      const lotSize = lot.lotSize || lot.offeredQty || 0;

      const halfPercent = Math.ceil(lotSize * 0.005);
      const sampleSize = Math.max(6, halfPercent);
      /* Max decarb limit: ≤ 0.25mm (default) */
      const maxDecarb = 0.25;
      return {
        lotNo,
        heatNo,
        quantity: lotSize,
        sampleSize,
        maxDecarb
      };
    });
  }, [lotsFromVendor]);

  /* Initialize state for each lot */
  const [lotData, setLotData] = useState(() => {
    // Try to load persisted data first
    const persistedData = localStorage.getItem(`inclusionRatingData_${callNo}`);

    if (persistedData) {
      try {
        return JSON.parse(persistedData);
      } catch (e) {
        console.error('Error parsing persisted inclusion data:', e);
      }
    }

    // Initialize new data
    const initial = {};
    lotsWithSampleSize.forEach((lot) => {
      initial[lot.lotNo] = {
        /* Microstructure - array of dropdown values equal to sample size */
        microstructure1st: Array(lot.sampleSize).fill(''),
        /* Decarb - array of values equal to sample size */
        decarb1st: Array(lot.sampleSize).fill(''),
        decarb2nd: Array(lot.sampleSize).fill(''),
        /* Inclusion - array of samples, each sample has A, B, C, D ratings + Thick/Thin */
        inclusion1st: Array(lot.sampleSize).fill(null).map(() => ({ A: '', B: '', C: '', D: '', type: 'Thick' })),
        inclusion2nd: Array(lot.sampleSize).fill(null).map(() => ({ A: '', B: '', C: '', D: '', type: 'Thick' })),
        /* Freedom from Defects - array equal to sample size (default: empty string for "Select") */
        defects1st: Array(lot.sampleSize).fill(''),
        defects2nd: Array(lot.sampleSize).fill(''),
        /* Separate remarks for each section */
        microstructureRemarks: '',
        decarbRemarks: '',
        inclusionRemarks: '',
        defectsRemarks: ''
      };
    });
    return initial;
  });

  // Persist data whenever lotData changes
  useEffect(() => {
    if (Object.keys(lotData).length > 0 && callNo) {
      localStorage.setItem(`inclusionRatingData_${callNo}`, JSON.stringify(lotData));
    }
  }, [lotData, callNo]);

  // Load data from backend when page loads (after pause/resume)
  useEffect(() => {
    if (callNo) {
      const loadDataFromBackend = async () => {
        try {
          // Load persisted data for merging (to preserve user edits)
          let persistedData = null;
          const persistedDataStr = localStorage.getItem(`inclusionRatingData_${callNo}`);
          if (persistedDataStr) {
            try {
              persistedData = JSON.parse(persistedDataStr);
              console.log('📦 Loaded persisted data from localStorage for merging');
            } catch (e) {
              console.error('Error parsing persisted data:', e);
            }
          }

          // Always fetch from backend to get latest data
          console.log('📥 Fetching data from backend for call:', callNo);

          const [decarbResponse, inclusionResponse, microstructureResponse, defectsResponse] = await Promise.all([
            getDepthOfDecarburizationByCall(callNo),
            getInclusionRatingByCall(callNo),
            getMicrostructureTestByCall(callNo),
            getFreedomFromDefectsTestByCall(callNo)
          ]);

          // Extract responseData from each response (handleResponse returns full response object)
          const decarbData = decarbResponse?.responseData || [];
          const inclusionData = inclusionResponse?.responseData || [];
          const microstructureData = microstructureResponse?.responseData || [];
          const defectsData = defectsResponse?.responseData || [];

          console.log('✅ Backend responses received:', {
            decarb: decarbData?.length || 0,
            inclusion: inclusionData?.length || 0,
            microstructure: microstructureData?.length || 0,
            defects: defectsData?.length || 0
          });

          // Transform backend data to frontend format
          const mergedData = {};
          lotsWithSampleSize.forEach((lot) => {
            mergedData[lot.lotNo] = {
              microstructure1st: Array(lot.sampleSize).fill(''),
              decarb1st: Array(lot.sampleSize).fill(''),
              decarb2nd: Array(lot.sampleSize).fill(''),
              inclusion1st: Array(lot.sampleSize).fill(null).map(() => ({ A: '', B: '', C: '', D: '', type: 'Thick' })),
              inclusion2nd: Array(lot.sampleSize).fill(null).map(() => ({ A: '', B: '', C: '', D: '', type: 'Thick' })),
              defects1st: Array(lot.sampleSize).fill(''),
              defects2nd: Array(lot.sampleSize).fill(''),
              microstructureRemarks: '',
              decarbRemarks: '',
              inclusionRemarks: '',
              defectsRemarks: ''
            };
          });

          // Merge Depth of Decarburization data
          if (decarbData && Array.isArray(decarbData)) {
            console.log('🔄 Merging decarb data:', decarbData);
            decarbData.forEach((test) => {
              const lotNo = test.lotNo;
              if (lotNo && mergedData[lotNo]) {
                mergedData[lotNo].decarbRemarks = test.remarks || '';

                // Populate decarb samples
                if (test.samples && Array.isArray(test.samples)) {
                  test.samples.forEach((sample) => {
                    if (sample.samplingNo === 1) {
                      mergedData[lotNo].decarb1st[sample.sampleNo - 1] = sample.sampleValue || '';
                    } else if (sample.samplingNo === 2) {
                      mergedData[lotNo].decarb2nd[sample.sampleNo - 1] = sample.sampleValue || '';
                    }
                  });
                }
              }
            });
          }

          // Merge Inclusion Rating data
          if (inclusionData && Array.isArray(inclusionData)) {
            console.log('🔄 Merging inclusion data:', inclusionData);
            inclusionData.forEach((test) => {
              const lotNo = test.lotNo;
              if (lotNo && mergedData[lotNo]) {
                mergedData[lotNo].inclusionRemarks = test.remarks || '';

                // Populate inclusion samples
                if (test.samples && Array.isArray(test.samples)) {
                  test.samples.forEach((sample) => {
                    const sampleIndex = sample.sampleNo - 1;
                    const sampleData = {
                      A: sample.sampleValueA || '',
                      B: sample.sampleValueB || '',
                      C: sample.sampleValueC || '',
                      D: sample.sampleValueD || '',
                      type: 'Thick'
                    };

                    if (sample.samplingNo === 1) {
                      mergedData[lotNo].inclusion1st[sampleIndex] = sampleData;
                    } else if (sample.samplingNo === 2) {
                      mergedData[lotNo].inclusion2nd[sampleIndex] = sampleData;
                    }
                  });
                }
              }
            });
          }

          // Merge Microstructure data
          if (microstructureData && Array.isArray(microstructureData)) {
            console.log('🔄 Merging microstructure data:', microstructureData);
            microstructureData.forEach((test) => {
              const lotNo = test.lotNo;
              if (lotNo && mergedData[lotNo]) {
                mergedData[lotNo].microstructureRemarks = test.remarks || '';

                // Populate microstructure samples
                if (test.samples && Array.isArray(test.samples)) {
                  test.samples.forEach((sample) => {
                    mergedData[lotNo].microstructure1st[sample.sampleNo - 1] = sample.sampleType || '';
                  });
                }
              }
            });
          }

          // Merge Freedom from Defects data
          if (defectsData && Array.isArray(defectsData)) {
            console.log('🔄 Merging defects data:', defectsData);
            defectsData.forEach((test) => {
              const lotNo = test.lotNo;
              if (lotNo && mergedData[lotNo]) {
                mergedData[lotNo].defectsRemarks = test.remarks || '';

                // Populate defects samples
                if (test.samples && Array.isArray(test.samples)) {
                  test.samples.forEach((sample) => {
                    if (sample.samplingNo === 1) {
                      mergedData[lotNo].defects1st[sample.sampleNo - 1] = sample.sampleType || '';
                    } else if (sample.samplingNo === 2) {
                      mergedData[lotNo].defects2nd[sample.sampleNo - 1] = sample.sampleType || '';
                    }
                  });
                }
              }
            });
          }

          // Merge with persisted data - user edits take priority
          if (persistedData) {
            console.log('🔄 Merging API data with persisted user edits');
            Object.keys(persistedData).forEach((lotNo) => {
              if (mergedData[lotNo]) {
                // Preserve user-edited values from localStorage
                // For arrays: keep non-empty user values
                ['microstructure1st', 'decarb1st', 'decarb2nd', 'defects1st', 'defects2nd'].forEach((key) => {
                  if (persistedData[lotNo][key]) {
                    persistedData[lotNo][key].forEach((val, idx) => {
                      if (val !== '' && val !== null && val !== undefined) {
                        mergedData[lotNo][key][idx] = val;
                      }
                    });
                  }
                });

                // For inclusion arrays (objects with A, B, C, D)
                ['inclusion1st', 'inclusion2nd'].forEach((key) => {
                  if (persistedData[lotNo][key]) {
                    persistedData[lotNo][key].forEach((sample, idx) => {
                      if (sample && typeof sample === 'object') {
                        ['A', 'B', 'C', 'D', 'type'].forEach((field) => {
                          if (sample[field] !== '' && sample[field] !== null && sample[field] !== undefined) {
                            mergedData[lotNo][key][idx][field] = sample[field];
                          }
                        });
                      }
                    });
                  }
                });

                // Preserve remarks
                ['microstructureRemarks', 'decarbRemarks', 'inclusionRemarks', 'defectsRemarks'].forEach((key) => {
                  if (persistedData[lotNo][key]) {
                    mergedData[lotNo][key] = persistedData[lotNo][key];
                  }
                });
              }
            });
            console.log('✅ User edits merged with API data');
          }

          console.log('📊 Final merged data before setting state:', mergedData);
          setLotData(mergedData);
          // ✅ CRITICAL: Persist merged data to localStorage immediately
          localStorage.setItem(`inclusionRatingData_${callNo}`, JSON.stringify(mergedData));
          console.log('✅ Loaded data from backend, merged with user edits, and persisted to localStorage');
        } catch (error) {
          console.error('Error loading data from backend:', error);
          // Initialize empty data on error - data structure already initialized in useState
        }
      };

      loadDataFromBackend();
    }
  }, [callNo, lotsWithSampleSize]);

  /* Handler for Microstructure change */
  const handleMicrostructureChange = (lotNo, idx, value) => {
    setLotData((prev) => {
      const arr = [...prev[lotNo].microstructure1st];
      arr[idx] = value;
      return { ...prev, [lotNo]: { ...prev[lotNo], microstructure1st: arr } };
    });
  };

  /* Handler for Decarb change */
  const handleDecarbChange = (lotNo, idx, value, is2nd = false) => {
    setLotData((prev) => {
      const key = is2nd ? 'decarb2nd' : 'decarb1st';
      const arr = [...prev[lotNo][key]];
      arr[idx] = value;
      return { ...prev, [lotNo]: { ...prev[lotNo], [key]: arr } };
    });
  };

  /* Handler for Inclusion change */
  const handleInclusionChange = (lotNo, sampleIdx, type, value, is2nd = false) => {
    setLotData((prev) => {
      const key = is2nd ? 'inclusion2nd' : 'inclusion1st';
      const arr = [...prev[lotNo][key]];
      arr[sampleIdx] = { ...arr[sampleIdx], [type]: value };
      return { ...prev, [lotNo]: { ...prev[lotNo], [key]: arr } };
    });
  };

  /* Handler for Defects change */
  const handleDefectsChange = (lotNo, idx, value, is2nd = false) => {
    setLotData((prev) => {
      const key = is2nd ? 'defects2nd' : 'defects1st';
      const arr = [...prev[lotNo][key]];
      arr[idx] = value;
      return { ...prev, [lotNo]: { ...prev[lotNo], [key]: arr } };
    });
  };

  /* Handler for Section-specific Remarks */
  const handleSectionRemarksChange = (lotNo, section, value) => {
    const remarkKey = `${section}Remarks`;
    setLotData((prev) => ({
      ...prev,
      [lotNo]: { ...prev[lotNo], [remarkKey]: value }
    }));
  };

  /* Validation functions */
  const getMicrostructureStatus = (value) => {
    if (!value || value === '') return '';
    return value === 'Tempered Martensite' ? 'pass' : 'fail';
  };

  const getDecarbStatus = (value, maxDecarb) => {
    if (!value || value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num <= maxDecarb ? 'pass' : 'fail';
  };

  const getInclusionStatus = (value) => {
    if (!value || value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num <= 2.0 ? 'pass' : 'fail';
  };

  /* Calculate rejections per lot - per test basis */
  const getLotRejections = (lot) => {
    const data = lotData[lot.lotNo];

    /* Microstructure rejection: count "Not Tempered Martensite" values */
    const microstructureRej = data.microstructure1st.filter((v) => v === 'Not Tempered Martensite').length;

    /* Decarb rejection: count values exceeding max limit */
    const decarbRej1st = data.decarb1st.filter((v) => v !== '' && parseFloat(v) > lot.maxDecarb).length;
    const decarbRej2nd = data.decarb2nd.filter((v) => v !== '' && parseFloat(v) > lot.maxDecarb).length;

    /* Inclusion rejection: ONE rejection per sample if ANY of A/B/C/D > 2.0 */
    const inclusionRej1st = data.inclusion1st.filter((sample) => {
      return Object.values(sample).some((v) => v !== '' && parseFloat(v) > 2.0);
    }).length;
    const inclusionRej2nd = data.inclusion2nd.filter((sample) => {
      return Object.values(sample).some((v) => v !== '' && parseFloat(v) > 2.0);
    }).length;

    /* Defects rejection */
    const defectsRej1st = data.defects1st.filter((v) => v === 'NOT OK').length;
    const defectsRej2nd = data.defects2nd.filter((v) => v === 'NOT OK').length;

    /* 2nd Sampling opens if rejected pieces in ANY test > 1 */
    const showDecarb2nd = decarbRej1st > 1;
    const showInclusion2nd = inclusionRej1st > 1;
    const showDefects2nd = defectsRej1st > 1;
    const show2nd = showDecarb2nd || showInclusion2nd || showDefects2nd;

    const total1st = microstructureRej + decarbRej1st + inclusionRej1st + defectsRej1st;
    const total2nd = decarbRej2nd + inclusionRej2nd + defectsRej2nd;

    return {
      microstructureRej,
      decarbRej1st, inclusionRej1st, defectsRej1st, total1st,
      decarbRej2nd, inclusionRej2nd, defectsRej2nd, total2nd,
      showDecarb2nd, showInclusion2nd, showDefects2nd, show2nd,
      totalCombined: show2nd ? total1st + total2nd : total1st
    };
  };

  const pageStyles = `
    .ir-test-section {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
    }
    .ir-test-title {
      font-size: 15px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #0ea5e9;
    }
    .ir-note {
      font-size: 11px;
      color: #64748b;
      margin: 0 0 10px 0;
    }
    .ir-lot-block {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 10px;
    }
    .ir-lot-header {
      font-size: 12px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px dashed #cbd5e1;
    }
    .ir-sampling-label {
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 6px;
    }
    .ir-values-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .ir-value-input {
      width: 55px;
      padding: 5px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      font-size: 12px;
      text-align: center;
    }
    .ir-value-input:focus {
      outline: none;
      border-color: #0ea5e9;
    }
    .ir-value-input.pass {
      border-color: #22c55e;
      background: #f0fdf4;
    }
    .ir-value-input.fail {
      border-color: #ef4444;
      background: #fee2e2;
    }
    .ir-table-wrap {
      overflow-x: auto;
      margin-bottom: 6px;
    }
    .ir-inclusion-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .ir-inclusion-table th,
    .ir-inclusion-table td {
      border: 1px solid #e2e8f0;
      padding: 4px 6px;
      text-align: center;
    }
    .ir-inclusion-table th {
      background: #f1f5f9;
      font-weight: 600;
    }
    .ir-inclusion-table input {
      width: 40px;
      padding: 3px;
      border: 1px solid #e2e8f0;
      border-radius: 3px;
      text-align: center;
      font-size: 11px;
    }
    .ir-inclusion-table input:focus {
      outline: none;
      border-color: #0ea5e9;
    }
    .ir-inclusion-table input.pass {
      border-color: #22c55e;
      background: #f0fdf4;
    }
    .ir-inclusion-table input.fail {
      border-color: #ef4444;
      background: #fee2e2;
    }
    .ir-defect-select {
      padding: 4px 6px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      font-size: 11px;
      min-width: 60px;
    }
    .ir-defect-select.pass {
      border-color: #22c55e;
      background: #f0fdf4;
    }
    .ir-defect-select.fail {
      border-color: #ef4444;
      background: #fee2e2;
    }
    .ir-rej-info {
      font-size: 11px;
      color: #64748b;
      margin-top: 8px;
      padding: 4px 8px;
      background: #f1f5f9;
      border-radius: 4px;
      display: inline-block;
    }
    .ir-summary-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
    }
    .ir-summary-item {
      padding: 6px 10px;
      background: #f1f5f9;
      border-radius: 4px;
      font-size: 12px;
    }
    .ir-2nd-sampling {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 6px;
      padding: 10px;
      margin-top: 10px;
    }
    .ir-2nd-title {
      font-size: 12px;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 8px;
    }
    .ir-collapse-btn {
      font-size: 12px;
      padding: 2px 10px;
      min-width: 80px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .ir-collapse-btn:hover {
      background: #e0e7ef;
    }
    .ir-acceptance-condition {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 12px;
      font-size: 12px;
      color: #1e40af;
    }
    .ir-acceptance-condition strong {
      color: #1e3a8a;
    }
    .ir-type-select {
      padding: 3px 6px;
      border: 1px solid #e2e8f0;
      border-radius: 3px;
      font-size: 11px;
      margin-left: 8px;
      background: #fff;
    }
    .ir-section-remarks {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
    }
    .ir-section-remarks label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 4px;
    }
    .ir-section-remarks textarea {
      width: 100%;
      min-height: 50px;
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      font-size: 11px;
      resize: vertical;
    }
    @media (max-width: 768px) {
      .ir-value-input { width: 50px; font-size: 11px; }
      .ir-inclusion-table input { width: 35px; }
      .ir-defect-select { min-width: 55px; font-size: 10px; }
      .ir-test-section {
        padding: 8px;
        margin-bottom: 12px;
      }
      .ir-lot-block {
        padding: 6px;
        margin-bottom: 6px;
      }
      .ir-lot-header {
        font-size: 11px;
        padding-bottom: 4px;
      }
      .ir-summary-row {
        gap: 6px;
        margin-top: 6px;
        padding-top: 6px;
      }
      .ir-summary-item {
        padding: 4px 6px;
        font-size: 11px;
      }
      .ir-2nd-sampling {
        padding: 6px;
        margin-top: 6px;
      }
      .ir-2nd-title {
        font-size: 11px;
        margin-bottom: 6px;
      }
      .ir-collapse-btn {
        min-width: 60px;
        font-size: 11px;
        padding: 2px 6px;
      }
      .ir-test-title {
        font-size: 13px;
        padding-bottom: 4px;
      }
      .ir-values-grid {
        gap: 4px;
      }
      .ir-value-input {
        width: 40px;
        font-size: 10px;
      }
      .ir-inclusion-table input {
        width: 28px;
        font-size: 10px;
      }
      .ir-defect-select {
        min-width: 40px;
        font-size: 10px;
      }
      .ir-rej-info {
        font-size: 10px;
        padding: 2px 4px;
      }
      .ir-table-wrap {
        margin-bottom: 2px;
      }
      .ir-test-section {
        margin-bottom: 8px;
      }
      .ir-test-section:last-child {
        margin-bottom: 0;
      }
      .page-header {
        flex-direction: column;
        gap: 8px;
      }
      .page-title {
        font-size: 16px;
      }
      .page-subtitle {
        font-size: 11px;
      }
      .btn {
        font-size: 12px;
        padding: 8px 12px;
      }
    }
    @media (max-width: 480px) {
      .ir-test-section {
        padding: 4px;
      }
      .ir-lot-block {
        padding: 2px;
      }
      .ir-collapse-btn {
        min-width: 40px;
        font-size: 10px;
        padding: 1px 4px;
      }
      .btn {
        font-size: 11px;
        padding: 6px 8px;
      }
      .page-title {
        font-size: 13px;
      }
      .page-subtitle {
        font-size: 10px;
      }
    }
  `;

  // Collapse/expand state for each section
  const [collapsed, setCollapsed] = useState({
    decarb: false,
    inclusion: true,
    microstructure: true,
    defects: true,
    summary: true
  });

  const toggleCollapse = (key) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div>
      <style>{pageStyles}</style>

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 className="page-title">Inclusion Rating, Depth of Decarb, Freedom from Defects</h1>
          <p className="page-subtitle">No. of Readings: 6 or 0.5% of hardness sample size (whichever is higher)</p>
        </div>
        <button className="btn btn-outline" onClick={onBack}>← Back</button>
      </div>

      <FinalSubmoduleNav currentSubmodule="final-inclusion-rating" onNavigate={onNavigateSubmodule} />

      {/* ==================== SECTION 1: DEPTH OF DECARB ==================== */}
      <div className="ir-test-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h3 className="ir-test-title">📏 Depth of Decarburization (All Lots)</h3>
          <button className="ir-collapse-btn" onClick={() => toggleCollapse('decarb')}>
            {collapsed.decarb ? 'Expand' : 'Collapse'}
          </button>
        </div>
        {!collapsed.decarb && (
          <>
            <div className="ir-acceptance-condition">
              <strong>Acceptance Condition (IS 3195):</strong> Depth of decarburization shall not exceed 0.25mm or (d/100)mm, whichever is less. Where d = Bar Diameter.
            </div>
            {lotsWithSampleSize.map((lot) => {
              const data = lotData[lot.lotNo];
              const rej = getLotRejections(lot);
              return (
                <div key={lot.lotNo} className="ir-lot-block">
                  <div className="ir-lot-header">
                    📦 {lot.lotNo} | Heat: {lot.heatNo} | Qty: {lot.lotSize} | Sample: {lot.sampleSize} | Max Decarb: {lot.maxDecarb.toFixed(2)}mm
                  </div>
                  {/* 1st Sampling */}
                  <div className="ir-sampling-label">1st Sampling (n1: {lot.sampleSize})</div>
                  <div className="ir-values-grid">
                    {data.decarb1st.map((val, idx) => {
                      const status = getDecarbStatus(val, lot.maxDecarb);
                      return (
                        <input
                          key={idx}
                          type="number"
                          step="0.01"
                          className={`ir-value-input ${status}`}
                          value={val}
                          onChange={(e) => handleDecarbChange(lot.lotNo, idx, e.target.value)}
                          placeholder=""
                        />
                      );
                    })}
                  </div>
                  {/* 2nd Sampling - show only if decarb rejected > 1 */}
                  {rej.showDecarb2nd && (
                    <div className="ir-2nd-sampling">
                      <div className="ir-2nd-title">⚠️ 2nd Sampling (R1: {rej.decarbRej1st} &gt; 1)</div>
                      <div className="ir-values-grid">
                        {data.decarb2nd.map((val, idx) => {
                          const status = getDecarbStatus(val, lot.maxDecarb);
                          return (
                            <input
                              key={idx}
                              type="number"
                              step="0.01"
                              className={`ir-value-input ${status}`}
                              value={val}
                              onChange={(e) => handleDecarbChange(lot.lotNo, idx, e.target.value, true)}
                              placeholder=""
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="ir-rej-info">
                    R1: {rej.decarbRej1st} {rej.showDecarb2nd && `| R2: ${rej.decarbRej2nd}`}
                  </div>
                  {/* Remarks for this lot's decarb test */}
                  <div className="ir-section-remarks">
                    <label>Remarks (Decarb - {lot.lotNo}):</label>
                    <textarea
                      value={data.decarbRemarks}
                      onChange={(e) => handleSectionRemarksChange(lot.lotNo, 'decarb', e.target.value)}
                      placeholder="Enter remarks for decarburization test..."
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ==================== SECTION 2: INCLUSION RATING ==================== */}
      <div className="ir-test-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h3 className="ir-test-title">🔬 Inclusion Rating (All Lots)</h3>
          <button className="ir-collapse-btn" onClick={() => toggleCollapse('inclusion')}>
            {collapsed.inclusion ? 'Expand' : 'Collapse'}
          </button>
        </div>
        {!collapsed.inclusion && (
          <>
            <div className="ir-acceptance-condition">
              <strong>Acceptance Condition (IS 4163):</strong> All inclusion ratings (A, B, C, D) shall not exceed 2.0 for both Thick and Thin series.
            </div>
            {lotsWithSampleSize.map((lot) => {
              const data = lotData[lot.lotNo];
              const rej = getLotRejections(lot);
              return (
                <div key={lot.lotNo} className="ir-lot-block">
                  <div className="ir-lot-header">📦 {lot.lotNo} | Heat: {lot.heatNo} | Sample: {lot.sampleSize}</div>
                  {/* 1st Sampling Table */}
                  <div className="ir-sampling-label">
                    1st Sampling (n1: {lot.sampleSize})
                    <select
                      className="ir-type-select"
                      value={data.inclusion1st[0]?.type || 'Thick'}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setLotData((prev) => ({
                          ...prev,
                          [lot.lotNo]: {
                            ...prev[lot.lotNo],
                            inclusion1st: prev[lot.lotNo].inclusion1st.map(s => ({ ...s, type: newType }))
                          }
                        }));
                      }}
                    >
                      <option value="Thick">Thick</option>
                      <option value="Thin">Thin</option>
                    </select>
                  </div>
                  <div className="ir-table-wrap">
                    <table className="ir-inclusion-table">
                      <thead>
                        <tr>
                          <th>S#</th>
                          <th>A</th>
                          <th>B</th>
                          <th>C</th>
                          <th>D</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.inclusion1st.map((sample, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            {['A', 'B', 'C', 'D'].map((type) => {
                              const status = getInclusionStatus(sample[type]);
                              return (
                                <td key={type}>
                                  <input
                                    type="number"
                                    step="0.1"
                                    className={status}
                                    value={sample[type]}
                                    onChange={(e) => handleInclusionChange(lot.lotNo, idx, type, e.target.value)}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* 2nd Sampling - show only if inclusion rejected > 1 */}
                  {rej.showInclusion2nd && (
                    <div className="ir-2nd-sampling">
                      <div className="ir-2nd-title">
                        ⚠️ 2nd Sampling (R1: {rej.inclusionRej1st} &gt; 1)
                        <select
                          className="ir-type-select"
                          value={data.inclusion2nd[0]?.type || 'Thick'}
                          onChange={(e) => {
                            const newType = e.target.value;
                            setLotData((prev) => ({
                              ...prev,
                              [lot.lotNo]: {
                                ...prev[lot.lotNo],
                                inclusion2nd: prev[lot.lotNo].inclusion2nd.map(s => ({ ...s, type: newType }))
                              }
                            }));
                          }}
                        >
                          <option value="Thick">Thick</option>
                          <option value="Thin">Thin</option>
                        </select>
                      </div>
                      <div className="ir-table-wrap">
                        <table className="ir-inclusion-table">
                          <thead>
                            <tr>
                              <th>S#</th>
                              <th>A</th>
                              <th>B</th>
                              <th>C</th>
                              <th>D</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.inclusion2nd.map((sample, idx) => (
                              <tr key={idx}>
                                <td>{idx + 1}</td>
                                {['A', 'B', 'C', 'D'].map((type) => {
                                  const status = getInclusionStatus(sample[type]);
                                  return (
                                    <td key={type}>
                                      <input
                                        type="number"
                                        step="0.1"
                                        className={status}
                                        value={sample[type]}
                                        onChange={(e) => handleInclusionChange(lot.lotNo, idx, type, e.target.value, true)}
                                      />
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <div className="ir-rej-info">
                    R1: {rej.inclusionRej1st} {rej.showInclusion2nd && `| R2: ${rej.inclusionRej2nd}`}
                  </div>
                  {/* Remarks for this lot's inclusion test */}
                  <div className="ir-section-remarks">
                    <label>Remarks (Inclusion - {lot.lotNo}):</label>
                    <textarea
                      value={data.inclusionRemarks}
                      onChange={(e) => handleSectionRemarksChange(lot.lotNo, 'inclusion', e.target.value)}
                      placeholder="Enter remarks for inclusion rating test..."
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ==================== SECTION 3: MICROSTRUCTURE ==================== */}
      <div className="ir-test-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h3 className="ir-test-title">🔬 Microstructure (All Lots)</h3>
          <button className="ir-collapse-btn" onClick={() => toggleCollapse('microstructure')}>
            {collapsed.microstructure ? 'Expand' : 'Collapse'}
          </button>
        </div>
        {!collapsed.microstructure && (
          <>
            <div className="ir-acceptance-condition">
              <strong>Acceptance Condition:</strong> Microstructure shall be Tempered Martensite as per IS 3195.
            </div>
            {lotsWithSampleSize.map((lot) => {
              const data = lotData[lot.lotNo];
              const rej = getLotRejections(lot);
              return (
                <div key={lot.lotNo} className="ir-lot-block">
                  <div className="ir-lot-header">
                    📦 {lot.lotNo} | Heat: {lot.heatNo} | Qty: {lot.lotSize} | Sample: {lot.sampleSize}
                  </div>
                  <div className="ir-sampling-label">Samples (n: {lot.sampleSize})</div>
                  <div className="ir-values-grid">
                    {data.microstructure1st.map((val, idx) => {
                      const status = getMicrostructureStatus(val);
                      return (
                        <select
                          key={idx}
                          className={`ir-defect-select ${status}`}
                          value={val}
                          onChange={(e) => handleMicrostructureChange(lot.lotNo, idx, e.target.value)}
                        >
                          <option value="">Select</option>
                          <option value="Tempered Martensite">Tempered Martensite</option>
                          <option value="Not Tempered Martensite">Not Tempered Martensite</option>
                        </select>
                      );
                    })}
                  </div>
                  <div className="ir-rej-info">
                    Rejected: {rej.microstructureRej}
                  </div>
                  <div className="ir-section-remarks">
                    <label>Remarks (Microstructure - {lot.lotNo}):</label>
                    <textarea
                      value={data.microstructureRemarks}
                      onChange={(e) => handleSectionRemarksChange(lot.lotNo, 'microstructure', e.target.value)}
                      placeholder="Enter remarks for microstructure test..."
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ==================== SECTION 4: FREEDOM FROM DEFECTS ==================== */}
      <div className="ir-test-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h3 className="ir-test-title">🛡️ Freedom from Defects (All Lots)</h3>
          <button className="ir-collapse-btn" onClick={() => toggleCollapse('defects')}>
            {collapsed.defects ? 'Expand' : 'Collapse'}
          </button>
        </div>
        {!collapsed.defects && (
          <>
            <div className="ir-acceptance-condition">
              <strong>Acceptance Condition:</strong> Material shall be free from injurious surface defects such as cracks, seams, laps, and other visible defects as per IS 3195.
            </div>
            {lotsWithSampleSize.map((lot) => {
              const data = lotData[lot.lotNo];
              const rej = getLotRejections(lot);
              return (
                <div key={lot.lotNo} className="ir-lot-block">
                  <div className="ir-lot-header">📦 {lot.lotNo} | Heat: {lot.heatNo} | Sample: {lot.sampleSize}</div>
                  {/* 1st Sampling */}
                  <div className="ir-sampling-label">1st Sampling (n1: {lot.sampleSize})</div>
                  <div className="ir-values-grid">
                    {data.defects1st.map((val, idx) => (
                      <select
                        key={idx}
                        className="ir-defect-select"
                        value={val}
                        onChange={(e) => handleDefectsChange(lot.lotNo, idx, e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="NOT OK">NOT OK</option>
                      </select>
                    ))}
                  </div>
                  {/* 2nd Sampling - show only if defects rejected > 1 */}
                  {rej.showDefects2nd && (
                    <div className="ir-2nd-sampling">
                      <div className="ir-2nd-title">⚠️ 2nd Sampling (R1: {rej.defectsRej1st} &gt; 1)</div>
                      <div className="ir-values-grid">
                        {data.defects2nd.map((val, idx) => (
                          <select
                            key={idx}
                            className="ir-defect-select"
                            value={val}
                            onChange={(e) => handleDefectsChange(lot.lotNo, idx, e.target.value, true)}
                          >
                            <option value="">Select</option>
                            <option value="OK">OK</option>
                            <option value="NOT OK">NOT OK</option>
                          </select>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="ir-rej-info">
                    R1: {rej.defectsRej1st} {rej.showDefects2nd && `| R2: ${rej.defectsRej2nd}`}
                  </div>
                  {/* Remarks for this lot's defects test */}
                  <div className="ir-section-remarks">
                    <label>Remarks (Defects - {lot.lotNo}):</label>
                    <textarea
                      value={data.defectsRemarks}
                      onChange={(e) => handleSectionRemarksChange(lot.lotNo, 'defects', e.target.value)}
                      placeholder="Enter remarks for freedom from defects test..."
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ==================== OVERALL SUMMARY ==================== */}
      <div className="ir-test-section" style={{ background: '#f0f9ff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h3 className="ir-test-title">📊 Summary</h3>
          <button className="ir-collapse-btn" onClick={() => toggleCollapse('summary')}>
            {collapsed.summary ? 'Expand' : 'Collapse'}
          </button>
        </div>
        {!collapsed.summary && (
          <>
            {lotsWithSampleSize.map((lot) => {
              const rej = getLotRejections(lot);
              const data = lotData[lot.lotNo];
              /* Accept if no 2nd sampling needed (all tests R1 ≤ 1) OR if 2nd sampling and total ≤ 2 */
              const isAccepted = !rej.show2nd || rej.totalCombined <= 2;

              /* Concatenate all remarks with section and lot info */
              const allRemarks = [
                data.microstructureRemarks && `Microstructure (${lot.lotNo}): ${data.microstructureRemarks}`,
                data.decarbRemarks && `Decarb (${lot.lotNo}): ${data.decarbRemarks}`,
                data.inclusionRemarks && `Inclusion (${lot.lotNo}): ${data.inclusionRemarks}`,
                data.defectsRemarks && `Defects (${lot.lotNo}): ${data.defectsRemarks}`
              ].filter(Boolean).join(' | ');

              return (
                <div key={lot.lotNo} className="ir-lot-block">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>📦 {lot.lotNo}</span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', padding: '3px 8px', background: '#e2e8f0', borderRadius: '4px' }}>
                        Microstructure: {rej.microstructureRej}
                      </span>
                      <span style={{ fontSize: '11px', padding: '3px 8px', background: '#e2e8f0', borderRadius: '4px' }}>
                        Decarb: {rej.decarbRej1st}{rej.showDecarb2nd && `+${rej.decarbRej2nd}`}
                      </span>
                      <span style={{ fontSize: '11px', padding: '3px 8px', background: '#e2e8f0', borderRadius: '4px' }}>
                        Inclusion: {rej.inclusionRej1st}{rej.showInclusion2nd && `+${rej.inclusionRej2nd}`}
                      </span>
                      <span style={{ fontSize: '11px', padding: '3px 8px', background: '#e2e8f0', borderRadius: '4px' }}>
                        Defects: {rej.defectsRej1st}{rej.showDefects2nd && `+${rej.defectsRej2nd}`}
                      </span>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '11px',
                        background: isAccepted ? '#dcfce7' : '#fee2e2',
                        color: isAccepted ? '#166534' : '#991b1b'
                      }}>
                        {isAccepted ? '✓ OK' : '✗ NOT OK'}
                      </span>
                    </div>
                  </div>
                  {allRemarks && (
                    <div style={{
                      marginTop: '8px',
                      padding: '6px 8px',
                      background: '#fef3c7',
                      border: '1px solid #fbbf24',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#92400e'
                    }}>
                      <strong>Combined Remarks:</strong> {allRemarks}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Action Buttons */}
      {/* <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
        <button className="btn btn-outline" onClick={onBack}>Cancel</button>
        <button className="btn btn-primary" onClick={() => alert('Inclusion Rating data saved!')}>Save & Continue</button>
      </div> */}
    </div>
  );
};

export default FinalInclusionRatingPage;