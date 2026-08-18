import { useState, useMemo, useEffect } from 'react';
import { useInspection } from '../context/InspectionContext';
import FinalSubmoduleNav from '../components/FinalSubmoduleNav';
import {
  getDepthOfDecarburizationByCall,
  getInclusionRatingByCall,
  getMicrostructureTestByCall,
  getFreedomFromDefectsTestByCall
} from '../services/finalInspectionSubmoduleService';
import { getHardnessToeLoadAQL } from '../utils/is2500Calculations';
import { normalizeErcType } from '../utils/ercUtils';

const FinalInclusionRatingPage = ({ onBack, productModel: propProductModel, onNavigateSubmodule }) => {
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

  // State for lot selection toggle
  const [activeLotTab, setActiveLotTab] = useState(0);

  // 2nd Sampling visibility and confirmation modal state
  const [showSubsamplingMap, setShowSubsamplingMap] = useState({}); // { lotNo: { microstructure: bool, decarb: bool, inclusion: bool, defects: bool } }
  const [popupLot, setPopupLot] = useState(null); // { lotNo, section, sectionLabel }

  // Get live lot data from context
  const { getFpCachedData, selectedCall } = useInspection();

  // Get the call number - use selectedCall or fallback to sessionStorage
  const callNo = selectedCall?.call_no || sessionStorage.getItem('selectedCallNo');

  // Get cached dashboard data with fallback to sessionStorage
  const cachedData = getFpCachedData(callNo);

  // Derive product model from cache or props, same as Toe Load logic
  const productModel = useMemo(() => {
    return normalizeErcType(
      cachedData?.dashboardData?.inspectionCall?.ercType ||
      cachedData?.inspectionCall?.ercType ||
      selectedCall?.ercType ||
      propProductModel
    );
  }, [cachedData, selectedCall, propProductModel]);

  // Memoize lotsFromVendor to ensure stable reference for useMemo dependency
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

  /*
    Calculate sample size for each lot based on Hardness Test Sample Size (IS 2500)
    Rules:
    - General (Decarb, Microstructure, Defects): 5% of Hardness Sample Size (ceil)
    - Inclusion: Max(6, General Sample Size)
  */
  const lotsWithSampleSize = useMemo(() => {
    return lotsFromVendor.map((lot) => {
      // Handle both API response format (lotNumber, heatNumber) and mapped format (lotNo, heatNo)
      const lotNo = lot.lotNo || lot.lotNumber;
      const heatNo = lot.heatNo || lot.heatNumber;
      const lotSize = lot.lotSize || lot.offeredQty || 0;

      // Sample Size based on Hardness Test Sample Size (IS 2500)
      const hardnessAQL = getHardnessToeLoadAQL(lotSize);
      const hardnessSampleSize = hardnessAQL.n1;

      // Sample for inclusions and other tests = 5% of hardness sample or 6 whichever is higher
      const sampleSize = Math.max(6, Math.ceil(hardnessSampleSize * 0.05));

      return {
        ...lot,
        lotNo,
        heatNo,
        quantity: lotSize,
        generalSampleSize: sampleSize,
        inclusionSampleSize: sampleSize,
        // Dynamic Decarb limit based on Product Model
        // MK-III: Max 0.2064 mm
        // MK-V: Max 0.23 mm
        maxDecarb: productModel?.toString().toUpperCase().includes('MK-V') ? 0.23 : 0.2064
      };
    });
  }, [lotsFromVendor, productModel]);

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
        /* Microstructure - uses generalSampleSize */
        microstructure1st: Array(lot.generalSampleSize).fill(''),
        microstructure2nd: Array(lot.generalSampleSize).fill(''),
        /* Decarb - uses generalSampleSize */
        decarb1st: Array(lot.generalSampleSize).fill(''),
        decarb2nd: Array(lot.generalSampleSize).fill(''),
        /* Inclusion - uses inclusionSampleSize */
        inclusion1st: Array(lot.inclusionSampleSize).fill(null).map(() => ({
          A: '', AType: '',
          B: '', BType: '',
          C: '', CType: '',
          D: '', DType: ''
        })),
        inclusion2nd: Array(lot.inclusionSampleSize).fill(null).map(() => ({
          A: '', AType: '',
          B: '', BType: '',
          C: '', CType: '',
          D: '', DType: ''
        })),
        /* Freedom from Defects - uses generalSampleSize */
        defects1st: Array(lot.generalSampleSize).fill(''),
        defects2nd: Array(lot.generalSampleSize).fill(''),
        /* Separate remarks for each section */
        microstructureRemarks: '',
        decarbRemarks: '',
        inclusionRemarks: '',
        defectsRemarks: ''
      };
    });
    return initial;
  });

  // Persist data whenever lotData changes (debounced to avoid performance lag)
  useEffect(() => {
    if (Object.keys(lotData).length === 0 || !callNo) return;

    const timeoutId = setTimeout(() => {
      localStorage.setItem(`inclusionRatingData_${callNo}`, JSON.stringify(lotData));
      console.log('💾 Persisted inclusion rating data to localStorage (debounced)');
    }, 1000);

    return () => clearTimeout(timeoutId);
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
              microstructure1st: Array(lot.generalSampleSize).fill(''),
              microstructure2nd: Array(lot.generalSampleSize).fill(''),
              decarb1st: Array(lot.generalSampleSize).fill(''),
              decarb2nd: Array(lot.generalSampleSize).fill(''),
              inclusion1st: Array(lot.inclusionSampleSize).fill(null).map(() => ({
                A: '', AType: '',
                B: '', BType: '',
                C: '', CType: '',
                D: '', DType: ''
              })),
              inclusion2nd: Array(lot.inclusionSampleSize).fill(null).map(() => ({
                A: '', AType: '',
                B: '', BType: '',
                C: '', CType: '',
                D: '', DType: ''
              })),
              defects1st: Array(lot.generalSampleSize).fill(''),
              defects2nd: Array(lot.generalSampleSize).fill(''),
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
                      AType: (sample.sampleValueA && sample.sampleTypeA) ? sample.sampleTypeA : '',
                      B: sample.sampleValueB || '',
                      BType: (sample.sampleValueB && sample.sampleTypeB) ? sample.sampleTypeB : '',
                      C: sample.sampleValueC || '',
                      CType: (sample.sampleValueC && sample.sampleTypeC) ? sample.sampleTypeC : '',
                      D: sample.sampleValueD || '',
                      DType: (sample.sampleValueD && sample.sampleTypeD) ? sample.sampleTypeD : ''
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
                    if (sample.samplingNo === 1) {
                      mergedData[lotNo].microstructure1st[sample.sampleNo - 1] = sample.sampleType || '';
                    } else if (sample.samplingNo === 2) {
                      mergedData[lotNo].microstructure2nd[sample.sampleNo - 1] = sample.sampleType || '';
                    }
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
                ['microstructure1st', 'microstructure2nd', 'decarb1st', 'decarb2nd', 'defects1st', 'defects2nd'].forEach((key) => {
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
                      if (sample && typeof sample === 'object' && mergedData[lotNo][key][idx]) {
                        ['A', 'B', 'C', 'D', 'AType', 'BType', 'CType', 'DType'].forEach((field) => {
                          const val = sample[field];
                          if (val !== '' && val !== null && val !== undefined) {
                            // Fix: If persisting a Type (e.g. AType) but the Value (A) is empty/missing, 
                            // ignore the Type and let it default to Select (''). 
                            // This clears old "Thick" defaults from local storage for empty rows.
                            if (field.endsWith('Type')) {
                              const valueField = field.replace('Type', '');
                              const valueContent = sample[valueField];
                              if (valueContent === '' || valueContent === null || valueContent === undefined) {
                                return;
                              }
                            }
                            mergedData[lotNo][key][idx][field] = val;
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

  /* ------------------------------
     2ND SAMPLING LOGIC & POPUP
  ------------------------------ */
  useEffect(() => {
    lotsWithSampleSize.forEach((lot) => {
      const data = lotData[lot.lotNo];
      if (!data) return;

      const lotNo = lot.lotNo;
      const currentVisibility = showSubsamplingMap[lotNo] || {
        microstructure: false,
        decarb: false,
        inclusion: false,
        defects: false
      };

      // 1. Calculate R1 for each section
      const micro1st = data.microstructure1st || [];
      const decarb1st = data.decarb1st || [];
      const defects1st = data.defects1st || [];
      const micro2nd = data.microstructure2nd || [];
      const decarb2nd = data.decarb2nd || [];
      const defects2nd = data.defects2nd || [];

      const microstructureRej1st = micro1st.filter((v) => v === 'Not Tempered Martensite').length;
      const decarbRej1st = decarb1st.filter((v) => v !== '' && parseFloat(v) > lot.maxDecarb).length;
      const dInclusion = data.inclusion1st || [];
      const inclusionRej1st = dInclusion.filter((sample) => {
        if (!sample || typeof sample !== 'object') return false;
        return ['A', 'B', 'C', 'D'].some((field) => sample[field] !== '' && parseFloat(sample[field]) > 2.0);
      }).length;
      const defectsRej1st = defects1st.filter((v) => v === 'NOT OK').length;

      // 2. Determine if 2nd sampling is required based on R1 (Ac1=0, Re1=2)
      const required = {
        microstructure: microstructureRej1st === 1,
        decarb: decarbRej1st === 1,
        inclusion: inclusionRej1st === 1,
        defects: defectsRej1st === 1
      };

      // 3. Check for data in 2nd sampling sections
      const dInclusion2nd = data.inclusion2nd || [];
      const has2ndData = {
        microstructure: micro2nd.some(v => v !== ''),
        decarb: decarb2nd.some(v => v !== ''),
        inclusion: dInclusion2nd.some(s => s && typeof s === 'object' && ['A', 'B', 'C', 'D'].some(k => s[k] !== '')),
        defects: defects2nd.some(v => v !== '')
      };

      // 4. Handle visibility changes
      const sections = [
        { key: 'microstructure', label: 'Microstructure' },
        { key: 'decarb', label: 'Depth of Decarburization' },
        { key: 'inclusion', label: 'Inclusion Rating' },
        { key: 'defects', label: 'Freedom from Defects' }
      ];

      let visibilityUpdated = false;
      const nextVisibility = { ...currentVisibility };

      for (const section of sections) {
        const isReq = required[section.key];
        const isShown = !!currentVisibility[section.key];
        const hasData = has2ndData[section.key];

        if (isReq && !isShown) {
          // Auto-show
          nextVisibility[section.key] = true;
          visibilityUpdated = true;
        } else if (!isReq && isShown && !popupLot) {
          // Condition for hiding met
          if (hasData) {
            // Data exists -> Trigger popup
            setPopupLot({ lotNo, section: section.key, sectionLabel: section.label });
          } else {
            // No data -> Auto-hide
            nextVisibility[section.key] = false;
            visibilityUpdated = true;
          }
        }
      }

      if (visibilityUpdated) {
        setShowSubsamplingMap(prev => ({ ...prev, [lotNo]: nextVisibility }));
      }
    });
  }, [lotData, lotsWithSampleSize, popupLot, showSubsamplingMap]);

  const handlePopupYesKeep = () => {
    if (!popupLot) return;
    const { lotNo, section } = popupLot;
    setShowSubsamplingMap(prev => ({
      ...prev,
      [lotNo]: { ...prev[lotNo], [section]: false }
    }));
    setPopupLot(null);
  };

  const handlePopupNoDelete = () => {
    if (!popupLot) return;
    const { lotNo, section } = popupLot;
    const lot = lotsWithSampleSize.find(l => l.lotNo === lotNo);
    if (!lot) return;

    // Clear data
    setLotData(prev => {
      const updatedLot = { ...prev[lotNo] };
      if (section === 'microstructure') updatedLot.microstructure2nd = Array(lot.generalSampleSize).fill('');
      if (section === 'decarb') updatedLot.decarb2nd = Array(lot.generalSampleSize).fill('');
      if (section === 'inclusion') updatedLot.inclusion2nd = Array(lot.inclusionSampleSize).fill(null).map(() => ({
        A: '', AType: '', B: '', BType: '', C: '', CType: '', D: '', DType: ''
      }));
      if (section === 'defects') updatedLot.defects2nd = Array(lot.generalSampleSize).fill('');

      return { ...prev, [lotNo]: updatedLot };
    });

    // Hide
    setShowSubsamplingMap(prev => ({
      ...prev,
      [lotNo]: { ...prev[lotNo], [section]: false }
    }));
    setPopupLot(null);
  };

  /* Handler for Microstructure change */
  const handleMicrostructureChange = (lotNo, idx, value, is2nd = false) => {
    setLotData((prev) => {
      const key = is2nd ? 'microstructure2nd' : 'microstructure1st';
      const arr = [...prev[lotNo][key]];
      arr[idx] = value;
      return { ...prev, [lotNo]: { ...prev[lotNo], [key]: arr } };
    });
  };

  const handleMicrostructureBulkChange = (lotNo, value, is2nd = false) => {
    if (!value || value === '') return;
    setLotData((prev) => {
      const key = is2nd ? 'microstructure2nd' : 'microstructure1st';
      const lot = prev[lotNo];
      const updatedArr = lot[key].map(() => value);
      return { ...prev, [lotNo]: { ...lot, [key]: updatedArr } };
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
  const handleInclusionChange = (lotNo, sampleIdx, field, value, is2nd = false) => {
    setLotData((prev) => {
      const key = is2nd ? 'inclusion2nd' : 'inclusion1st';
      const arr = [...prev[lotNo][key]];
      arr[sampleIdx] = { ...arr[sampleIdx], [field]: value };
      return { ...prev, [lotNo]: { ...prev[lotNo], [key]: arr } };
    });
  };

  const handleInclusionBulkTypeChange = (lotNo, type, is2nd = false) => {
    if (!type || type === '') return;
    setLotData((prev) => {
      const key = is2nd ? 'inclusion2nd' : 'inclusion1st';
      const lot = prev[lotNo];
      const updatedArr = lot[key].map(sample => ({
        ...sample,
        AType: type,
        BType: type,
        CType: type,
        DType: type,
      }));
      return { ...prev, [lotNo]: { ...lot, [key]: updatedArr } };
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

  const handleDefectsBulkChange = (lotNo, value, is2nd = false) => {
    if (!value || value === '') return;
    setLotData((prev) => {
      const key = is2nd ? 'defects2nd' : 'defects1st';
      const lot = prev[lotNo];
      const updatedArr = lot[key].map(() => value);
      return { ...prev, [lotNo]: { ...lot, [key]: updatedArr } };
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
    // Strict upper-bound check (no rounding buffer)
    return num <= maxDecarb ? 'pass' : 'fail';
  };

  const getInclusionStatus = (value) => {
    if (!value || value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num <= 2.0 ? 'pass' : 'fail';
  };

  const getDefectsStatus = (value) => {
    if (!value || value === '') return '';
    return value === 'OK' ? 'pass' : 'fail';
  };

  /* Calculate rejections per lot - per test basis */
  const getLotRejections = (lot) => {
    const data = lotData[lot.lotNo];
    if (!data) return {};

    /* Microstructure */
    const micro1st = data.microstructure1st || [];
    const micro2nd = data.microstructure2nd || [];
    const microstructureRej1st = micro1st.filter((v) => v === 'Not Tempered Martensite').length;
    const microstructureRej2nd = micro2nd.filter((v) => v === 'Not Tempered Martensite').length;
    const isMicroFull1 = micro1st.length > 0 && micro1st.every(v => v !== '');
    const isMicroFull2 = micro2nd.length > 0 && micro2nd.every(v => v !== '');

    /* Decarb */
    const decarb1st = data.decarb1st || [];
    const decarb2nd = data.decarb2nd || [];
    const decarbRej1st = decarb1st.filter((v) => v !== '' && parseFloat(v) > lot.maxDecarb).length;
    const decarbRej2nd = decarb2nd.filter((v) => v !== '' && parseFloat(v) > lot.maxDecarb).length;
    const isDecarbFull1 = decarb1st.length > 0 && decarb1st.every(v => v !== '');
    const isDecarbFull2 = decarb2nd.length > 0 && decarb2nd.every(v => v !== '');

    /* Inclusion */
    const dInclusion1 = data.inclusion1st || [];
    const inclusionRej1st = dInclusion1.filter((sample) => {
      if (!sample || typeof sample !== 'object') return false;
      return ['A', 'B', 'C', 'D'].some((field) => sample[field] !== '' && parseFloat(sample[field]) > 2.0);
    }).length;
    const dInclusion2 = data.inclusion2nd || [];
    const inclusionRej2nd = dInclusion2.filter((sample) => {
      if (!sample || typeof sample !== 'object') return false;
      return ['A', 'B', 'C', 'D'].some((field) => sample[field] !== '' && parseFloat(sample[field]) > 2.0);
    }).length;
    const isInclusionFull1 = dInclusion1.length > 0 && dInclusion1.every(s => s && typeof s === 'object' && ['A', 'B', 'C', 'D'].some(k => s[k] !== ''));
    const isInclusionFull2 = dInclusion2.length > 0 && dInclusion2.every(s => s && typeof s === 'object' && ['A', 'B', 'C', 'D'].some(k => s[k] !== ''));

    /* Defects */
    const defects1st = data.defects1st || [];
    const defects2nd = data.defects2nd || [];
    const defectsRej1st = defects1st.filter((v) => v === 'NOT OK').length;
    const defectsRej2nd = defects2nd.filter((v) => v === 'NOT OK').length;
    const isDefectsFull1 = defects1st.length > 0 && defects1st.every(v => v !== '');
    const isDefectsFull2 = defects2nd.length > 0 && defects2nd.every(v => v !== '');

    const getStatus = (r1, r2, full1, full2) => {
      if (r1 > 1 || (r1 + r2) > 1) return 'REJECTED';
      if (r1 === 0) return full1 ? 'ACCEPTED' : 'PENDING';
      if (r1 === 1) return (full1 && full2) ? 'ACCEPTED' : 'PENDING';
      return 'PENDING';
    };

    const microStatus = getStatus(microstructureRej1st, microstructureRej2nd, isMicroFull1, isMicroFull2);
    const decarbStatus = getStatus(decarbRej1st, decarbRej2nd, isDecarbFull1, isDecarbFull2);
    const inclusionStatus = getStatus(inclusionRej1st, inclusionRej2nd, isInclusionFull1, isInclusionFull2);
    const defectsStatus = getStatus(defectsRej1st, defectsRej2nd, isDefectsFull1, isDefectsFull2);

    const statuses = [microStatus, decarbStatus, inclusionStatus, defectsStatus];
    const hasAnyRejected = statuses.includes('REJECTED');
    const allAccepted = statuses.every(s => s === 'ACCEPTED');

    let lotStatus = 'PENDING';
    if (hasAnyRejected) lotStatus = 'REJECTED';
    else if (allAccepted) lotStatus = 'ACCEPTED';

    return {
      microstructureRej1st, microstructureRej2nd,
      decarbRej1st, inclusionRej1st, defectsRej1st,
      decarbRej2nd, inclusionRej2nd, defectsRej2nd,
      showMicrostructure2nd: microstructureRej1st === 1,
      showDecarb2nd: decarbRej1st === 1,
      showInclusion2nd: inclusionRej1st === 1,
      showDefects2nd: defectsRej1st === 1,
      show2nd: (microstructureRej1st === 1 || decarbRej1st === 1 || inclusionRej1st === 1 || defectsRej1st === 1),
      microStatus, decarbStatus, inclusionStatus, defectsStatus,
      lotStatus
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
      /* Lot Selector Component */
      .lot-selector {
        display: flex;
        gap: 10px;
        margin-bottom: 16px;
        padding: 0 4px;
        flex-wrap: wrap;
      }
      .lot-single {
        margin-bottom: 16px;
        padding: 4px 12px;
        background: #f1f5f9;
        border-radius: 6px;
        display: inline-block;
        font-weight: 600;
        color: #475569;
        border: 1px solid #e2e8f0;
      }
      .lot-btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid #e2e8f0;
        background: white;
        color: #64748b;
      }
      .lot-btn:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }
      .lot-btn.active {
        background: #0ea5e9;
        color: white;
        border-color: #0ea5e9;
        box-shadow: 0 2px 4px rgba(14, 165, 233, 0.2);
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
    .ir-cell-flex {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
    .ir-series-select {
      font-size: 10px;
      padding: 2px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      background: #f8fafc;
      width: 58px;
      cursor: pointer;
      height: 26px;
    }
    .ir-inclusion-table input {
      width: 42px;
      padding: 4px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      text-align: center;
      font-size: 12px;
      height: 26px;
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
      /* Popup Styles */
      .popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }
      .popup-box {
        background: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        text-align: center;
        max-width: 400px;
        width: 90%;
      }
      .popup-box p {
        font-size: 16px;
        color: #334155;
        margin-bottom: 20px;
        line-height: 1.5;
        font-weight: 500;
      }
      .popup-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }
      .popup-btn {
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid #e2e8f0;
        background: #f1f5f9;
        color: #475569;
      }
      .popup-btn:hover { background: #e2e8f0; }
      .popup-btn.primary {
        background: #0d9488;
        color: white;
        border-color: #0d9488;
      }
      .popup-btn.primary:hover { background: #0f766e; }
    }
  `;


  return (
    <div>
      <style>{pageStyles}</style>

      {/* Confirmation Popup */}
      {popupLot && (
        <div className="popup-overlay">
          <div className="popup-box">
            <p>
              2nd Sampling for <strong>{popupLot.sectionLabel}</strong> is no longer required.
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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 className="page-title">Inclusion Rating, Depth of Decarb, Freedom from Defects</h1>
          <p className="page-subtitle">Sample size = 5% of Hardness test sample size (Minimum 6)</p>
        </div>
        <button className="btn btn-outline" onClick={onBack}>← Back</button>
      </div>

      <FinalSubmoduleNav currentSubmodule="final-inclusion-rating" onNavigate={onNavigateSubmodule} />

      {/* Lot Selector – shown only when multiple lots */}
      {lotsWithSampleSize.length > 1 && (
        <div className="lot-selector">
          {lotsWithSampleSize.map((lot, idx) => (
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
              <strong>Acceptance Condition (IS 3195) for {productModel?.toString().toUpperCase().includes('MK-V') ? 'MK-V' : 'MK-III'}:</strong> Depth of decarburization shall not exceed {productModel?.toString().toUpperCase().includes('MK-V') ? '0.23' : '0.2064'}mm.
            </div>
            {lotsWithSampleSize.map((lot, idx) => {
              if (activeLotTab !== idx) return null;
              const data = lotData[lot.lotNo];
              const rej = getLotRejections(lot);
              return (
                <div key={lot.lotNo} className="ir-lot-block">
                  <div className="ir-lot-header" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', alignItems: 'center', gap: '10px' }}>
                    <div style={{ textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }}>
                      📦 {lot.lotNo} | Heat: {lot.heatNo} | Qty: {lot.quantity || lot.lotSize} | Sample: {lot.generalSampleSize}
                    </div>
                    <div style={{ textAlign: 'center', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                      Ac1: 0 | Re1: 2 | Cumm: 2
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      ERC Type: {productModel}
                    </div>
                  </div>
                  {/* 1st Sampling */}
                  <div className="ir-sampling-label">1st Sampling (n1: {lot.generalSampleSize})</div>
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
                  {/* 2nd Sampling - show only if decarb rejected == 1 */}
                  {showSubsamplingMap[lot.lotNo]?.decarb && (
                    <div className="ir-2nd-sampling">
                      <div className="ir-2nd-title">⚠️ 2nd Sampling (R1: {rej.decarbRej1st})</div>
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
            {lotsWithSampleSize.map((lot, idx) => {
              if (activeLotTab !== idx) return null;
              const data = lotData[lot.lotNo];
              const rej = getLotRejections(lot);
              return (
                <div key={lot.lotNo} className="ir-lot-block">
                  <div className="ir-lot-header" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', alignItems: 'center', gap: '10px' }}>
                    <div style={{ textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }}>
                      📦 {lot.lotNo} | Heat: {lot.heatNo} | Qty: {lot.quantity || lot.lotSize} | Sample: {lot.inclusionSampleSize}
                    </div>
                    <div style={{ textAlign: 'center', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                      Ac1: 0 | Re1: 2 | Cumm: 2
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      ERC Type: {productModel}
                    </div>
                  </div>
                  {/* 1st Sampling Table */}
                  <div className="ir-sampling-label" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>1st Sampling (n1: {lot.inclusionSampleSize})</span>
                    <select
                      className="ir-series-select"
                      style={{ width: 'auto', height: '28px' }}
                      onChange={(e) => handleInclusionBulkTypeChange(lot.lotNo, e.target.value)}
                    >
                      <option value="">Set All Series</option>
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
                            {['A', 'B', 'C', 'D'].map((field) => {
                              const status = getInclusionStatus(sample[field]);
                              return (
                                <td key={field}>
                                  <div className="ir-cell-flex">
                                    <input
                                      type="number"
                                      step="0.1"
                                      className={status}
                                      value={sample[field]}
                                      onChange={(e) => handleInclusionChange(lot.lotNo, idx, field, e.target.value)}
                                    />
                                    <select
                                      className="ir-series-select"
                                      value={sample[field + 'Type']}
                                      onChange={(e) => handleInclusionChange(lot.lotNo, idx, field + 'Type', e.target.value)}
                                    >
                                      <option value="">Select</option>
                                      <option value="Thick">Thick</option>
                                      <option value="Thin">Thin</option>
                                    </select>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* 2nd Sampling - show only if inclusion rejected == 1 */}
                  {showSubsamplingMap[lot.lotNo]?.inclusion && (
                    <div className="ir-2nd-sampling">
                      <div className="ir-2nd-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span>⚠️ 2nd Sampling (R1: {rej.inclusionRej1st})</span>
                        <select
                          className="ir-series-select"
                          style={{ width: 'auto', height: '28px', background: 'white' }}
                          onChange={(e) => handleInclusionBulkTypeChange(lot.lotNo, e.target.value, true)}
                        >
                          <option value="">Set All Series</option>
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
                                {['A', 'B', 'C', 'D'].map((field) => {
                                  const status = getInclusionStatus(sample[field]);
                                  return (
                                    <td key={field}>
                                      <div className="ir-cell-flex">
                                        <input
                                          type="number"
                                          step="0.1"
                                          className={status}
                                          value={sample[field]}
                                          onChange={(e) => handleInclusionChange(lot.lotNo, idx, field, e.target.value, true)}
                                        />
                                        <select
                                          className="ir-series-select"
                                          value={sample[field + 'Type']}
                                          onChange={(e) => handleInclusionChange(lot.lotNo, idx, field + 'Type', e.target.value, true)}
                                        >
                                          <option value="">Select</option>
                                          <option value="Thick">Thick</option>
                                          <option value="Thin">Thin</option>
                                        </select>
                                      </div>
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
            {lotsWithSampleSize.map((lot, idx) => {
              if (activeLotTab !== idx) return null;
              const data = lotData[lot.lotNo];
              const rej = getLotRejections(lot);
              return (
                <div key={lot.lotNo} className="ir-lot-block">
                  <div className="ir-lot-header" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', alignItems: 'center', gap: '10px' }}>
                    <div style={{ textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }}>
                      📦 {lot.lotNo} | Heat: {lot.heatNo} | Qty: {lot.quantity || lot.lotSize} | Sample: {lot.generalSampleSize}
                    </div>
                    <div style={{ textAlign: 'center', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                      Ac1: 0 | Re1: 2 | Cumm: 2
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      ERC Type: {productModel}
                    </div>
                  </div>
                  <div className="ir-sampling-label" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>Samples (n: {lot.generalSampleSize})</span>
                    <select
                      className="ir-defect-select"
                      style={{ width: 'auto', height: '28px', padding: '0 8px' }}
                      onChange={(e) => handleMicrostructureBulkChange(lot.lotNo, e.target.value)}
                    >
                      <option value="">Set All Status</option>
                      <option value="Tempered Martensite">Tempered Martensite</option>
                      <option value="Not Tempered Martensite">Not Tempered Martensite</option>
                    </select>
                  </div>
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
                  {/* 2nd Sampling - show only if microstructure rejected == 1 */}
                  {showSubsamplingMap[lot.lotNo]?.microstructure && (
                    <div className="ir-2nd-sampling">
                      <div className="ir-2nd-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span>⚠️ 2nd Sampling (R1: {rej.microstructureRej1st})</span>
                        <select
                          className="ir-defect-select"
                          style={{ width: 'auto', height: '28px', padding: '0 8px', background: 'white' }}
                          onChange={(e) => handleMicrostructureBulkChange(lot.lotNo, e.target.value, true)}
                        >
                          <option value="">Set All Status</option>
                          <option value="Tempered Martensite">Tempered Martensite</option>
                          <option value="Not Tempered Martensite">Not Tempered Martensite</option>
                        </select>
                      </div>
                      <div className="ir-values-grid">
                        {data.microstructure2nd.map((val, idx) => {
                          const status = getMicrostructureStatus(val);
                          return (
                            <select
                              key={idx}
                              className={`ir-defect-select ${status}`}
                              value={val}
                              onChange={(e) => handleMicrostructureChange(lot.lotNo, idx, e.target.value, true)}
                            >
                              <option value="">Select</option>
                              <option value="Tempered Martensite">Tempered Martensite</option>
                              <option value="Not Tempered Martensite">Not Tempered Martensite</option>
                            </select>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="ir-rej-info">
                    R1: {rej.microstructureRej1st} {rej.showMicrostructure2nd && `| R2: ${rej.microstructureRej2nd}`}
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
            {lotsWithSampleSize.map((lot, idx) => {
              if (activeLotTab !== idx) return null;
              const data = lotData[lot.lotNo];
              const rej = getLotRejections(lot);
              return (
                <div key={lot.lotNo} className="ir-lot-block">
                  <div className="ir-lot-header" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', alignItems: 'center', gap: '10px' }}>
                    <div style={{ textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }}>
                      📦 {lot.lotNo} | Heat: {lot.heatNo} | Qty: {lot.quantity || lot.lotSize} | Sample: {lot.generalSampleSize}
                    </div>
                    <div style={{ textAlign: 'center', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                      Ac1: 0 | Re1: 2 | Cumm: 2
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      ERC Type: {productModel}
                    </div>
                  </div>
                  {/* 1st Sampling */}
                  <div className="ir-sampling-label" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>1st Sampling (n1: {lot.generalSampleSize})</span>
                    <select
                      className="ir-defect-select"
                      style={{ width: 'auto', height: '28px', padding: '0 8px' }}
                      onChange={(e) => handleDefectsBulkChange(lot.lotNo, e.target.value)}
                    >
                      <option value="">Set All Status</option>
                      <option value="OK">OK</option>
                      <option value="NOT OK">NOT OK</option>
                    </select>
                  </div>
                  <div className="ir-values-grid">
                    {data.defects1st.map((val, idx) => (
                      <select
                        key={idx}
                        className={`ir-defect-select ${getDefectsStatus(val)}`}
                        value={val}
                        onChange={(e) => handleDefectsChange(lot.lotNo, idx, e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="NOT OK">NOT OK</option>
                      </select>
                    ))}
                  </div>
                  {/* 2nd Sampling - show only if defects rejected == 1 */}
                  {showSubsamplingMap[lot.lotNo]?.defects && (
                    <div className="ir-2nd-sampling">
                      <div className="ir-2nd-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span>⚠️ 2nd Sampling (R1: {rej.defectsRej1st})</span>
                        <select
                          className="ir-defect-select"
                          style={{ width: 'auto', height: '28px', padding: '0 8px', background: 'white' }}
                          onChange={(e) => handleDefectsBulkChange(lot.lotNo, e.target.value, true)}
                        >
                          <option value="">Set All Status</option>
                          <option value="OK">OK</option>
                          <option value="NOT OK">NOT OK</option>
                        </select>
                      </div>
                      <div className="ir-values-grid">
                        {data.defects2nd.map((val, idx) => (
                          <select
                            key={idx}
                            className={`ir-defect-select ${getDefectsStatus(val)}`}
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
            {lotsWithSampleSize.map((lot, idx) => {
              if (activeLotTab !== idx) return null;
              const rej = getLotRejections(lot);
              const data = lotData[lot.lotNo];

              const status = rej.lotStatus; // 'ACCEPTED', 'REJECTED', 'PENDING'
              const isAccepted = status === 'ACCEPTED';
              const isPending = status === 'PENDING';

              /* Helper for individual badge styles */
              const getBadgeStyle = (s) => {
                if (s === 'REJECTED') return { background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' };
                if (s === 'ACCEPTED') return { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
                return { background: '#f1f5f9', color: '#475569', border: 'none' };
              };

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
                      <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', ...getBadgeStyle(rej.microStatus) }}>
                        Microstructure: {rej.microstructureRej1st}{rej.showMicrostructure2nd && `+${rej.microstructureRej2nd}`}
                      </span>
                      <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', ...getBadgeStyle(rej.decarbStatus) }}>
                        Decarb: {rej.decarbRej1st}{rej.showDecarb2nd && `+${rej.decarbRej2nd}`}
                      </span>
                      <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', ...getBadgeStyle(rej.inclusionStatus) }}>
                        Inclusion: {rej.inclusionRej1st}{rej.showInclusion2nd && `+${rej.inclusionRej2nd}`}
                      </span>
                      <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', ...getBadgeStyle(rej.defectsStatus) }}>
                        Defects: {rej.defectsRej1st}{rej.showDefects2nd && `+${rej.defectsRej2nd}`}
                      </span>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '11px',
                        background: isAccepted ? '#dcfce7' : (isPending ? '#fef3c7' : '#fee2e2'),
                        color: isAccepted ? '#166534' : (isPending ? '#92400e' : '#991b1b'),
                        border: isAccepted ? '1px solid #bbf7d0' : (isPending ? '1px solid #fde68a' : '1px solid #fecaca')
                      }}>
                        {isAccepted ? '✓ OK' : (isPending ? '⏳ PENDING' : '✗ NOT OK')}
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