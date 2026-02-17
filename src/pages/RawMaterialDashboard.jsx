import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { formatDate } from '../utils/helpers';
import HeatNumberDetails from '../components/HeatNumberDetails';
import InspectionResultModal from '../components/InspectionResultModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { fetchPoDataForSections, updateColorCode } from '../services/poDataService';
import { finishInspection, pauseRawMaterialInspection, getInspectionDataByCallNo } from '../services/rmInspectionService';
import { useInspection } from '../context/InspectionContext';
import { markAsWithheld, markAsPaused } from '../services/callStatusService';
import { saveInspectionInitiation } from '../services/vendorInspectionService';
import { performTransitionAction } from '../services/workflowService';
import { getStoredUser } from '../services/authService';
import './RawMaterialDashboard.css';

// Reason options for withheld inspection
const WITHHELD_REASONS = [
  { value: '', label: 'Select Reason *' },
  { value: 'MATERIAL_NOT_AVAILABLE', label: 'Full quantity of material not available with firm at the time of inspection' },
  { value: 'PLACE_NOT_AS_PER_PO', label: 'Place of inspection is not as per the PO' },
  { value: 'VENDOR_WITHDRAWN', label: 'Vendor has withdrawn the inspection call' },
  { value: 'ANY_OTHER', label: 'Any other' },
];

// LocalStorage keys for submodule data
const STORAGE_KEYS = {
  VISUAL_INSPECTION: 'visual_inspection_draft_data',
  DIMENSIONAL_CHECK: 'dimensional_check_draft_data',
  MATERIAL_TESTING: 'material_testing_draft_data',
  PACKING_STORAGE: 'packing_storage_draft_data',
  CALIBRATION: 'calibration_draft_data',
  MAIN_INSPECTION: 'rm_main_inspection_data'
};

// localStorage key for dashboard draft data
const DASHBOARD_DRAFT_KEY = 'rm_dashboard_draft_';

const RawMaterialDashboard = ({ call, onBack, onNavigateToSubModule, onHeatsChange, onProductModelChange, onLadleValuesChange }) => {
  // Import cache functions from context
  const {
    getRmCachedData,
    updateRmPoDataCache,
    updateRmCallDataCache,
    updateRmHeatDataCache
  } = useInspection();

  // State for fetched data from backend
  const [fetchedPoData, setFetchedPoData] = useState(null);
  const [fetchedCallData, setFetchedCallData] = useState(null);
  const [fetchedHeatData, setFetchedHeatData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFromCache, setIsLoadingFromCache] = useState(false);

  // Pre-Inspection Data Entry State
  const [sourceOfRawMaterial, setSourceOfRawMaterial] = useState('');
  const [numberOfBundles, setNumberOfBundles] = useState('');
  // Per-heat remarks: { heatNo: 'remark text', ... }
  const [heatRemarks, setHeatRemarks] = useState({});

  // Finish Inspection state
  const [isSaving, setIsSaving] = useState(false);

  // Save Draft state
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Withheld modal state
  const [showWithheldModal, setShowWithheldModal] = useState(false);
  const [withheldReason, setWithheldReason] = useState('');
  const [withheldRemarks, setWithheldRemarks] = useState('');
  const [withheldError, setWithheldError] = useState('');

  // Inspection Result Modal state (for pause, finish, draft save)
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalConfig, setResultModalConfig] = useState({
    actionType: 'pause', // 'pause', 'finish', 'draft'
    callNumber: '',
    message: '',
    additionalInfo: ''
  });

  // Confirmation Modal state (for pause/finish confirmation)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: 'Confirm Action',
    message: 'Are you sure?',
    confirmText: 'OK',
    cancelText: 'Cancel',
    isDangerous: false,
    onConfirm: null
  });

  // Submodule status tracking per heat (auto-populated from localStorage)
  // Structure: { heatNo: { calibration: 'OK', visual: 'Pending', ... }, ... }
  const [heatSubmoduleStatuses, setHeatSubmoduleStatuses] = useState({});

  // Track whether finish button should be enabled
  const [canFinishInspectionState, setCanFinishInspectionState] = useState({ canFinish: false, reason: '' });

  // Ref to prevent duplicate API calls in React StrictMode
  const hasFetchedRef = useRef(false);
  const currentCallRef = useRef(null);
  const hasLoadedDraftRef = useRef(false);

  // Fetch data from new unified PO data API with caching
  useEffect(() => {
    const fetchInspectionData = async () => {
      // Get PO number and call number
      const poNo = call?.po_no;
      const callNo = call?.call_no;

      if (!poNo || !callNo) {
        console.log('No PO number or call number found');
        setIsLoading(false);
        return;
      }

      // Reset fetch flag if call changes
      if (currentCallRef.current !== callNo) {
        hasFetchedRef.current = false;
        hasLoadedDraftRef.current = false;
        currentCallRef.current = callNo;
      }

      // Prevent duplicate API calls (especially in React StrictMode)
      if (hasFetchedRef.current) {
        console.log('⏭️ Skipping duplicate API call (already fetched for this call)');
        return;
      }

      // Mark as fetched
      hasFetchedRef.current = true;

      // ==================== PERFORMANCE OPTIMIZATION: Check Cache First ====================
      const cachedData = getRmCachedData(callNo);

      if (cachedData.isCached) {
        console.log('✅ Using cached data for call:', callNo);
        setIsLoadingFromCache(true);

        // Load saved color codes from localStorage
        const mainKey = `${STORAGE_KEYS.MAIN_INSPECTION}_${callNo}`;
        const savedData = localStorage.getItem(mainKey);
        let savedColorCodes = {};
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            savedColorCodes = parsed.heatColorCodes || {};
            console.log('📦 Loaded saved color codes from localStorage:', savedColorCodes);
          } catch (e) {
            console.error('Error parsing saved color codes:', e);
          }
        }

        // Immediately set cached data (instant load!)
        if (cachedData.poData) setFetchedPoData(cachedData.poData);
        if (cachedData.callData) setFetchedCallData(cachedData.callData);
        if (cachedData.heatData) {
          // Merge color codes into cached heat data
          const heatsWithColorCodes = cachedData.heatData.map(heat => ({
            ...heat,
            colorCode: savedColorCodes[heat.heatNo] || heat.colorCode || ''
          }));
          setFetchedHeatData(heatsWithColorCodes);
        }

        setIsLoading(false);
        setIsLoadingFromCache(false);

        // Notify parent components
        if (cachedData.heatData && onHeatsChange) {
          onHeatsChange(cachedData.heatData);
        }

        console.log('📦 Cache hit! Data loaded instantly.');
        return;
      }

      // ==================== Cache Miss: Fetch from API ====================
      try {
        setIsLoading(true);
        console.log('🌐 Cache miss. Fetching PO data from API for PO Number:', poNo, 'Call Number:', callNo);

        const response = await fetchPoDataForSections(poNo, callNo);
        console.log('Fetched PO data:', response);

        if (response) {
          // Extract first heat details if available
          const firstHeat = response.rmHeatDetails && response.rmHeatDetails.length > 0
            ? response.rmHeatDetails[0]
            : null;

          // Map PO data from new unified API
          const poData = {
            po_no: response.poNo,
            po_date: response.poDate,
            po_description: response.itemDescription || response.itemDesc,
            po_qty: response.poQty,
            po_unit: response.unit || 'MT',
            vendor_name: response.vendorName,
            contractor: response.vendorName,
            manufacturer: firstHeat?.manufacturer || response.vendorName,
            place_of_inspection: response.inspPlace || call?.place_of_inspection || 'N/A',
            amendment_no: response.maNo || 'N/A',
            amendment_date: response.maDate || 'N/A',
            vendor_contact_name: '',
            vendor_contact_phone: '',
            rm_total_offered_qty_mt: firstHeat?.offeredQty || 0,
            rm_offered_qty_erc: 0,
            // Add sub PO details from first heat
            sub_po_no: firstHeat?.subPoNumber || response.poNo,
            sub_po_date: firstHeat?.subPoDate || response.poDate,
            sub_po_qty: firstHeat?.subPoQty || response.poQty,
            product_name: response.itemDescription || response.itemDesc,
            erc_type: response.ercType || null // Type of ERC from Section B (MK-III, MK-V, etc.)
          };
          setFetchedPoData(poData);
          updateRmPoDataCache(callNo, poData); // Cache it!

          // Map call details
          const callData = {
            inspectionCallNo: call?.call_no,
            typeOfCall: call?.type_of_call || 'Regular',
            desiredInspectionDate: call?.desired_inspection_date,
            status: call?.status,
            remarks: call?.remarks || '',
            qtyAlreadyInspectedRm: 0,
            qtyAlreadyInspectedProcess: 0,
            qtyAlreadyInspectedFinal: 0
          };
          setFetchedCallData(callData);
          updateRmCallDataCache(callNo, callData); // Cache it!

          // Map RM heat details to heat data format
          if (response.rmHeatDetails && response.rmHeatDetails.length > 0) {
            // Check if we have saved color codes in localStorage
            const mainKey = `${STORAGE_KEYS.MAIN_INSPECTION}_${call?.call_no}`;
            const savedData = localStorage.getItem(mainKey);
            let savedColorCodes = {};
            if (savedData) {
              try {
                const parsed = JSON.parse(savedData);
                savedColorCodes = parsed.heatColorCodes || {};
              } catch (e) {
                console.error('Error parsing saved color codes:', e);
              }
            }

            const heatsData = response.rmHeatDetails.map((heat, index) => {
              const heatNo = heat.heatNumber || '';
              return {
                id: heat.id || index + 1,
                heatNo,
                weight: heat.offeredQty || '',
                tcNo: heat.tcNumber || '',
                tcDate: heat.tcDate || '',
                manufacturerName: heat.manufacturer || '',
                invoiceNumber: heat.invoiceNumber || '',
                invoiceDate: heat.invoiceDate || '',
                subPoNumber: heat.subPoNumber || '',
                subPoDate: heat.subPoDate || '',
                subPoQty: heat.subPoQty || '',
                totalValueOfPo: heat.totalValueOfPo || '', // From inventory_entries.total_po
                tcQuantity: heat.tcQuantity || '', // From inventory_entries.tc_quantity
                offeredQty: heat.offeredQty || '',
                // Priority: localStorage > backend > empty
                // First check localStorage (user's latest changes), then backend (database), then empty
                colorCode: savedColorCodes[heatNo] || heat.colorCode || ''
              };
            });
            setFetchedHeatData(heatsData);
            updateRmHeatDataCache(callNo, heatsData); // Cache it!

            // Also restore numberOfBundles, sourceOfRawMaterial, and heatRemarks from localStorage
            if (savedData) {
              try {
                const parsed = JSON.parse(savedData);
                if (parsed.numberOfBundles) setNumberOfBundles(parsed.numberOfBundles);
                if (parsed.sourceOfRawMaterial) setSourceOfRawMaterial(parsed.sourceOfRawMaterial);
                if (parsed.heatRemarks) setHeatRemarks(parsed.heatRemarks);
              } catch (e) {
                console.error('Error restoring main inspection data:', e);
              }
            }
          }

          // Extract vendor ladle chemical composition values (if available in future)
          const ladleValues = {
            percentC: null,
            percentSi: null,
            percentMn: null,
            percentS: null,
            percentP: null
          };

          // Store ladle values in context if callback provided
          if (onLadleValuesChange) {
            onLadleValuesChange(ladleValues);
          }
        }
      } catch (error) {
        console.error('Error fetching PO data:', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInspectionData();
    // Only depend on call identifiers, not callbacks (prevents unnecessary re-fetches)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call?.po_no, call?.call_no]);

  // Fetch and restore paused inspection data
  // IMPORTANT: Only restore from backend if localStorage is empty (don't overwrite user edits)
  useEffect(() => {
    const restorePausedData = async () => {
      const callNo = call?.call_no;
      if (!callNo) return;

      try {
        console.log('🔄 Checking for paused inspection data for call:', callNo);
        const pausedData = await getInspectionDataByCallNo(callNo);

        if (pausedData) {
          console.log('✅ Found paused inspection data:', pausedData);

          // Restore Visual Inspection data - ONLY if localStorage is empty
          if (pausedData.visualInspectionData && pausedData.visualInspectionData.length > 0) {
            const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${callNo}`;
            const existingVisualData = localStorage.getItem(visualKey);

            // Only restore if no existing data in localStorage (preserve user edits)
            if (!existingVisualData) {
              // NEW FORMAT: Backend returns one record per heat with defects and defectLengths maps
              const visualArray = pausedData.visualInspectionData.map(item => {
                const selectedDefects = {};
                const defectCounts = {};

                // Convert defects map to selectedDefects
                if (item.defects) {
                  Object.entries(item.defects).forEach(([defectName, isSelected]) => {
                    if (isSelected) {
                      selectedDefects[defectName] = true;
                    }
                  });
                }

                // Convert defectLengths map to defectCounts
                if (item.defectLengths) {
                  Object.entries(item.defectLengths).forEach(([defectName, length]) => {
                    if (length !== null && length !== undefined) {
                      defectCounts[defectName] = length;
                    }
                  });
                }

                return { selectedDefects, defectCounts };
              });

              localStorage.setItem(visualKey, JSON.stringify(visualArray));
              console.log('✅ Restored visual inspection data from backend:', visualArray);
            } else {
              console.log('⏭️ Skipping visual inspection restore - user data already exists in localStorage');
            }
          }

          // Restore Dimensional Check data - ONLY if localStorage is empty
          if (pausedData.dimensionalCheckData && pausedData.dimensionalCheckData.length > 0) {
            const dimKey = `${STORAGE_KEYS.DIMENSIONAL_CHECK}_${callNo}`;
            const existingDimData = localStorage.getItem(dimKey);

            // Only restore if no existing data in localStorage (preserve user edits)
            if (!existingDimData) {
              // NEW FORMAT: Backend returns one record per heat with sampleDiameters array
              const heatDimData = pausedData.dimensionalCheckData.map(item => {
                // Convert sampleDiameters array to dimSamples format
                const dimSamples = (item.sampleDiameters || []).map(diameter =>
                  diameter !== null ? { diameter } : null
                );
                return { dimSamples };
              });

              localStorage.setItem(dimKey, JSON.stringify({ heatDimData }));
              console.log('✅ Restored dimensional check data from backend:', heatDimData);
            } else {
              console.log('⏭️ Skipping dimensional check restore - user data already exists in localStorage');
            }
          }

          // Restore Material Testing data - ONLY if localStorage is empty
          if (pausedData.materialTestingData && pausedData.materialTestingData.length > 0) {
            const matKey = `${STORAGE_KEYS.MATERIAL_TESTING}_${callNo}`;
            const existingMatData = localStorage.getItem(matKey);

            // Only restore if no existing data in localStorage (preserve user edits)
            if (!existingMatData) {
              const materialByHeat = {};
              pausedData.materialTestingData.forEach(item => {
                const heatIdx = item.heatIndex || 0;
                if (!materialByHeat[heatIdx]) {
                  materialByHeat[heatIdx] = { samples: [] };
                }
                const sampleIdx = item.sampleNumber - 1;
                materialByHeat[heatIdx].samples[sampleIdx] = {
                  c: item.carbonPercent,
                  si: item.siliconPercent,
                  mn: item.manganesePercent,
                  p: item.phosphorusPercent,
                  s: item.sulphurPercent,
                  grainSize: item.grainSize,
                  hardness: item.hardnessHrc,
                  decarb: item.decarbDepthMm,
                  inclTypeA: item.inclusionTypeA,
                  inclA: item.inclusionA,
                  inclTypeB: item.inclusionTypeB,
                  inclB: item.inclusionB,
                  inclTypeC: item.inclusionTypeC,
                  inclC: item.inclusionC,
                  inclTypeD: item.inclusionTypeD,
                  inclD: item.inclusionD,
                  remarks: item.remarks
                };
              });
              const materialArray = Object.keys(materialByHeat)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map(idx => materialByHeat[idx]);
              localStorage.setItem(matKey, JSON.stringify({ materialData: materialArray }));
              console.log('✅ Restored material testing data from backend');
            } else {
              console.log('⏭️ Skipping material testing restore - user data already exists in localStorage');
            }
          }

          // Restore Packing & Storage data - ONLY if localStorage is empty
          if (pausedData.packingStorageData && pausedData.packingStorageData.length > 0) {
            const packKey = `${STORAGE_KEYS.PACKING_STORAGE}_${callNo}`;
            const existingPackData = localStorage.getItem(packKey);

            // Only restore if no existing data in localStorage (preserve user edits)
            if (!existingPackData) {
              const packByHeat = {};
              pausedData.packingStorageData.forEach(item => {
                packByHeat[item.heatIndex] = {
                  bundlingSecure: item.bundlingSecure,
                  tagsAttached: item.tagsAttached,
                  labelsCorrect: item.labelsCorrect,
                  protectionAdequate: item.protectionAdequate,
                  storageCondition: item.storageCondition,
                  moistureProtection: item.moistureProtection,
                  stackingProper: item.stackingProper,
                  remarks: item.remarks
                };
              });
              localStorage.setItem(packKey, JSON.stringify({ packingDataByHeat: packByHeat }));
              console.log('✅ Restored packing & storage data from backend');
            } else {
              console.log('⏭️ Skipping packing storage restore - user data already exists in localStorage');
            }
          }

          // Restore Calibration Documents data - ONLY if localStorage is empty
          if (pausedData.calibrationDocumentsData && pausedData.calibrationDocumentsData.length > 0) {
            const calKey = `${STORAGE_KEYS.CALIBRATION}_${callNo}`;
            const existingCalData = localStorage.getItem(calKey);

            // Only restore if no existing data in localStorage (preserve user edits)
            if (!existingCalData) {
              const calData = {
                heats: pausedData.calibrationDocumentsData.map(item => ({
                  heatNo: item.heatNo,
                  percentC: item.ladleCarbonPercent,
                  percentSi: item.ladleSiliconPercent,
                  percentMn: item.ladleManganesePercent,
                  percentP: item.ladlePhosphorusPercent,
                  percentS: item.ladleSulphurPercent
                })),
                rdsoApprovalValidity: {
                  approvalId: pausedData.calibrationDocumentsData[0]?.rdsoApprovalId,
                  validFrom: pausedData.calibrationDocumentsData[0]?.rdsoValidFrom,
                  validTo: pausedData.calibrationDocumentsData[0]?.rdsoValidTo
                },
                gaugesAvailable: pausedData.calibrationDocumentsData[0]?.gaugesAvailable || false,
                vendorVerification: {
                  verified: pausedData.calibrationDocumentsData[0]?.vendorVerified || false,
                  verifiedBy: pausedData.calibrationDocumentsData[0]?.verifiedBy,
                  verifiedAt: pausedData.calibrationDocumentsData[0]?.verifiedAt
                }
              };
              localStorage.setItem(calKey, JSON.stringify(calData));
              console.log('✅ Restored calibration documents data from backend');
            } else {
              console.log('⏭️ Skipping calibration documents restore - user data already exists in localStorage');
            }
          }

          // Restore pre-inspection data
          if (pausedData.preInspectionData) {
            const mainKey = `${STORAGE_KEYS.MAIN_INSPECTION}_${callNo}`;
            const mainData = localStorage.getItem(mainKey);
            const existingData = mainData ? JSON.parse(mainData) : {};
            const updatedData = {
              ...existingData,
              numberOfBundles: pausedData.preInspectionData.numberOfBundles,
              sourceOfRawMaterial: pausedData.preInspectionData.sourceOfRawMaterial
            };
            localStorage.setItem(mainKey, JSON.stringify(updatedData));
            setNumberOfBundles(pausedData.preInspectionData.numberOfBundles);
            setSourceOfRawMaterial(pausedData.preInspectionData.sourceOfRawMaterial);
            console.log('✅ Restored pre-inspection data');
          }

          // Restore heat final results (remarks)
          if (pausedData.heatFinalResults && pausedData.heatFinalResults.length > 0) {
            const remarksMap = {};
            pausedData.heatFinalResults.forEach(result => {
              if (result.remarks) {
                remarksMap[result.heatNo] = result.remarks;
              }
            });
            setHeatRemarks(remarksMap);
            console.log('✅ Restored heat remarks');
          }

          console.log('✅ All paused inspection data restored successfully');
        }
      } catch (error) {
        console.log('ℹ️ No paused data found or error fetching:', error.message);
        // This is not an error - it just means there's no paused data
      }
    };

    restorePausedData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call?.call_no]);

  // Use fetched data from backend (stabilized)
  const poData = useMemo(() => (fetchedPoData || {}), [fetchedPoData]);

  // Use fetched heat data from backend
  const activeHeats = useMemo(() => {
    return fetchedHeatData;
  }, [fetchedHeatData]);

  // Determine product model/type from Type of ERC field (Section B) — fall back to product name parsing
  const productModel = useMemo(() => {
    // Priority 1: Use Type of ERC from Section B (inspection_call_details.type_of_erc)
    if (poData.erc_type) {
      const ercType = poData.erc_type.toString();
      if (/MK-III/i.test(ercType) || /MK III/i.test(ercType)) return 'MK-III';
      if (/MK-V/i.test(ercType) || /MK V/i.test(ercType)) return 'MK-V';
    }

    // Priority 2: Fall back to product name parsing (legacy behavior)
    const name = (poData.product_name || poData.po_description || '').toString();
    if (/MK-III/i.test(name) || /MK III/i.test(name)) return 'MK-III';
    if (/MK-V/i.test(name) || /MK V/i.test(name)) return 'MK-V';
    if (poData.model && /MK-III/i.test(poData.model)) return 'MK-III';
    if (poData.model && /MK-V/i.test(poData.model)) return 'MK-V';

    // Default: MK-III
    return 'MK-III';
  }, [poData]);

  /**
   * Consolidate heats by grouping duplicate heat numbers
   * Returns array of unique heats with aggregated weights
   */
  const consolidatedHeats = useMemo(() => {
    const heatMap = new Map();

    activeHeats.forEach((heat) => {
      const heatNo = heat.heatNo || heat.heat_no || 'Unknown';

      if (!heatMap.has(heatNo)) {
        heatMap.set(heatNo, {
          ...heat,
          weight: parseFloat(heat.weight) || parseFloat(heat.offeredQty) || 0,
          originalHeats: [heat]
        });
      } else {
        // Aggregate weight for duplicate heat numbers
        const existing = heatMap.get(heatNo);
        existing.weight += parseFloat(heat.weight) || parseFloat(heat.offeredQty) || 0;
        existing.originalHeats.push(heat);
      }
    });

    return Array.from(heatMap.values());
  }, [activeHeats]);

  // Auto-calculated values using consolidatedHeats (unique heats only)
  const totalQuantity = useMemo(() => {
    return consolidatedHeats.reduce((sum, heat) => sum + heat.weight, 0).toFixed(2);
  }, [consolidatedHeats]);

  const numberOfHeats = useMemo(() => {
    return consolidatedHeats.length;
  }, [consolidatedHeats]);

  /**
   * Calculate No. of ERC (Finished) based on product model
   * MK-V:   Weight / 0.00114 (weight per clip in MT)
   * MK-III: Weight / 0.000092 (weight per clip in MT)
   */
  const numberOfERC = useMemo(() => {
    const weightMT = parseFloat(totalQuantity) || 0;
    if (productModel === 'MK-V') {
      return Math.floor(weightMT / 0.00114);
    } else {
      // MK-III
      return Math.floor(weightMT / 0.000092);
    }
  }, [totalQuantity, productModel]);

  // Sync consolidated heats and productModel to parent for submodule pages
  useEffect(() => {
    if (onHeatsChange) onHeatsChange(consolidatedHeats);
  }, [consolidatedHeats, onHeatsChange]);

  useEffect(() => {
    if (onProductModelChange) onProductModelChange(productModel);
  }, [productModel, onProductModelChange]);

  // Save main inspection data to localStorage when it changes
  // Note: Restoration is done during API fetch to avoid race conditions
  useEffect(() => {
    const inspectionCallNo = call?.call_no;
    if (!inspectionCallNo) return;

    const mainKey = `${STORAGE_KEYS.MAIN_INSPECTION}_${inspectionCallNo}`;
    const dataToSave = {
      numberOfBundles,
      sourceOfRawMaterial,
      heatRemarks,
      heatColorCodes: consolidatedHeats.reduce((acc, heat) => {
        const heatNo = heat.heatNo || heat.heat_no;
        if (heatNo && heat.colorCode) {
          acc[heatNo] = heat.colorCode;
        }
        return acc;
      }, {})
    };
    localStorage.setItem(mainKey, JSON.stringify(dataToSave));
  }, [call?.call_no, numberOfBundles, sourceOfRawMaterial, heatRemarks, consolidatedHeats]);

  // Handler for heat data changes (e.g., colorCode updates from HeatNumberDetails)
  const handleHeatsUpdate = useCallback((updatedHeats) => {
    // If we receive updated heats from a component, we need to map them back to fetchedHeatData
    // Usually updatedHeats will be the consolidated ones.
    setFetchedHeatData(prev => {
      return prev.map(originalHeat => {
        const heatNo = originalHeat.heatNo || originalHeat.heat_no;
        const matchingUpdated = updatedHeats.find(h => (h.heatNo || h.heat_no) === heatNo);
        if (matchingUpdated) {
          return { ...originalHeat, colorCode: matchingUpdated.colorCode };
        }
        return originalHeat;
      });
    });
  }, []);

  // (defect lists and counts handled in visual module state)

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [sourceOfRawMaterial, activeHeats, numberOfBundles]);

  /**
   * Validate calibration product values for a heat
   * Rules:
   * - All fields (C, Si, Mn, P, S) must be filled to enable Accept/Reject
   * - C: 0.5-0.6, Si: 1.5-2.0, Mn: 0.8-1.0, P: ≤0.030, S: ≤0.030
   * - Returns 'Pending' if not all fields are filled
   * - Returns 'OK' if all fields pass validation
   * - Returns 'NOT OK' if any field fails validation
   */
  const validateCalibrationHeat = useCallback((heatData) => {
    if (!heatData) return 'Pending';

    const { percentC, percentSi, percentMn, percentP, percentS } = heatData;

    // Check if ALL required fields are filled (excluding remarks)
    const allFieldsFilled = percentC && percentC !== '' &&
      percentSi && percentSi !== '' &&
      percentMn && percentMn !== '' &&
      percentP && percentP !== '' &&
      percentS && percentS !== '';

    if (!allFieldsFilled) return 'Pending';

    // All fields are filled, now validate values
    const c = parseFloat(percentC);
    const si = parseFloat(percentSi);
    const mn = parseFloat(percentMn);
    const p = parseFloat(percentP);
    const s = parseFloat(percentS);

    const cFail = !isNaN(c) && (c < 0.5 || c > 0.6);
    const siFail = !isNaN(si) && (si < 1.5 || si > 2.0);
    const mnFail = !isNaN(mn) && (mn < 0.8 || mn > 1.0);
    const pFail = !isNaN(p) && p > 0.030;
    const sFail = !isNaN(s) && s > 0.030;

    return (cFail || siFail || mnFail || pFail || sFail) ? 'NOT OK' : 'OK';
  }, []);

  /**
   * Calculate rejected weight from visual defects for a heat
   * Formula: MK-III: Length(m) * 0.00263, MK-V: Length(m) * 0.00326
   * Defects considered: All defect types including Distortion, Twist, Kink, Not Straight, Fold, Lap, Crack, Pit, Groove, Excessive Scaling, Internal Defect
   * Input: Defect lengths in metres
   */
  const calculateVisualRejectedWeight = useCallback((heatVisualData) => {
    if (!heatVisualData?.selectedDefects || !heatVisualData?.defectCounts) return 0;

    const selected = heatVisualData.selectedDefects;
    const counts = heatVisualData.defectCounts;
    const lengthDefects = ['Distortion', 'Twist', 'Kink', 'Not Straight', 'Fold', 'Lap', 'Crack', 'Pit', 'Groove', 'Excessive Scaling', 'Internal Defect (Piping, Segregation)'];

    // Calculate total defective length in metres
    let totalMetres = 0;
    lengthDefects.forEach(defect => {
      if (selected[defect]) {
        const lengthMetres = parseFloat(counts[defect]) || 0;
        totalMetres += lengthMetres;
      }
    });

    // Calculate weight based on product model
    const weightFactor = productModel?.toUpperCase().includes('V') ? 0.00326 : 0.00263;
    return totalMetres * weightFactor;
  }, [productModel]);

  /**
   * Validate visual inspection for a heat
   * Rules:
   * 1. If heat has been marked as passed (isPassed flag), return 'Pass'
   * 2. If no defect is selected, return 'Pending'
   * 3. If "No Defect" is selected, return 'OK'
   * 4. If any other defect is selected:
   *    - If all selected defects have their lengths filled, return 'OK' or 'NOT OK' based on selection
   *    - If any selected defect is missing length, return 'Pending'
   */
  const validateVisualHeat = useCallback((heatVisualData) => {
    if (!heatVisualData?.selectedDefects) return 'Pending';

    // If heat has been marked as passed, return Pass
    // if (heatVisualData.isPassed) return 'Pass';

    const selected = heatVisualData.selectedDefects;
    const counts = heatVisualData.defectCounts || {};
    const hasAnySelection = Object.values(selected).some(v => v);

    // Must have at least one selection to proceed
    if (!hasAnySelection) return 'Pending';

    // If "No Defect" is selected, it's OK (no need to check counts)
    if (selected['No Defect']) return 'OK';

    // Check if any other defect is selected
    const selectedDefects = Object.entries(selected)
      .filter(([key, val]) => key !== 'No Defect' && val)
      .map(([key]) => key);

    if (selectedDefects.length === 0) return 'Pending';

    // Check if all selected defects have their counts/lengths filled
    const allCountsFilled = selectedDefects.every(defectName => {
      const count = counts[defectName];
      return count && count.toString().trim() !== '';
    });

    // If not all counts are filled, status is still Pending
    if (!allCountsFilled) return 'Pending';

    // All counts are filled, so it's NOT OK (defects found)
    return 'NOT OK';
  }, []);

  /**
  * Validate dimensional check for a heat
  * Rules:
  * - ALL 20 samples must be filled to enable Accept/Reject
  * - All samples must be within tolerance (MK-III: 20.47-20.84, MK-V: 22.81-23.23)
  * - Returns 'Pending' if not all 20 samples are filled
  * - Returns 'OK' if all samples pass OR if up to 2 samples fail
  * - Returns 'NOT OK' if more than 2 samples fail validation (3 or more)
  */
  const validateDimensionalHeat = useCallback((dimSamples, model) => {
    if (!dimSamples || !Array.isArray(dimSamples)) return 'Pending';

    // Get tolerance based on product model
    const specs = model?.toUpperCase().includes('V')
      ? { min: 22.81, max: 23.23 }
      : { min: 20.47, max: 20.84 }; // Default MK-III

    const REQUIRED_SAMPLES = 20; // Total samples required per heat
    const filledSamples = dimSamples.filter(s => s?.diameter && s.diameter !== '');

    // Now count failures among filled samples
    const failedSamples = filledSamples.filter(s => {
      const val = parseFloat(s.diameter);
      return !isNaN(val) && (val < specs.min || val > specs.max);
    });

    // If more than 2 samples fail, it is NOT OK immediately
    if (failedSamples.length > 2) return 'NOT OK';

    // If we haven't reached failure threshold, check if all 20 are filled
    if (filledSamples.length < REQUIRED_SAMPLES) return 'Pending';

    // All samples are filled and failed samples <= 2
    return 'OK';
  }, []);

  /**
   * Validate material testing for a heat
   * Rules:
   * - All required fields (C, Si, Mn, P, S, Grain Size, Decarb, Inclusions A/B/C/D, Hardness) must be filled for all samples
   * - C: 0.5-0.6, Si: 1.5-2.0, Mn: 0.8-1.0, P: ≤0.030, S: ≤0.030
   * - GrainSize: ≥6, Decarb: ≤0.25, Inclusions A/B/C/D: ≤2.0
   * - Returns 'Pending' if not all required fields are filled
   * - Returns 'OK' if all fields pass validation
   * - Returns 'NOT OK' if any field fails validation
   */
  const validateMaterialTestHeat = useCallback((heatMaterialData) => {
    if (!heatMaterialData?.samples || !Array.isArray(heatMaterialData.samples)) return 'Pending';

    const samples = heatMaterialData.samples;

    // Check if ALL required fields are filled for all samples (excluding remarks)
    const allFieldsFilled = samples.every(sample => {
      return sample.c && sample.c !== '' &&
        sample.si && sample.si !== '' &&
        sample.mn && sample.mn !== '' &&
        sample.p && sample.p !== '' &&
        sample.s && sample.s !== '' &&
        sample.grainSize && sample.grainSize !== '' &&
        sample.decarb && sample.decarb !== '' &&
        sample.inclA && sample.inclA !== '' &&
        sample.inclB && sample.inclB !== '' &&
        sample.inclC && sample.inclC !== '' &&
        sample.inclD && sample.inclD !== '' &&
        sample.hardness && sample.hardness !== '';
    });

    if (!allFieldsFilled) return 'Pending';

    // All fields are filled, now validate values
    const hasFailure = samples.some(sample => {
      const c = parseFloat(sample.c);
      const si = parseFloat(sample.si);
      const mn = parseFloat(sample.mn);
      const p = parseFloat(sample.p);
      const s = parseFloat(sample.s);
      const grainSize = parseFloat(sample.grainSize);
      const decarb = parseFloat(sample.decarb);
      const inclA = parseFloat(sample.inclA);
      const inclB = parseFloat(sample.inclB);
      const inclC = parseFloat(sample.inclC);
      const inclD = parseFloat(sample.inclD);

      return (
        (!isNaN(c) && (c < 0.5 || c > 0.6)) ||
        (!isNaN(si) && (si < 1.5 || si > 2.0)) ||
        (!isNaN(mn) && (mn < 0.8 || mn > 1.0)) ||
        (!isNaN(p) && p > 0.030) ||
        (!isNaN(s) && s > 0.030) ||
        (!isNaN(grainSize) && grainSize < 6) ||
        (!isNaN(decarb) && decarb > 0.25) ||
        (!isNaN(inclA) && inclA > 2.0) ||
        (!isNaN(inclB) && inclB > 2.0) ||
        (!isNaN(inclC) && inclC > 2.0) ||
        (!isNaN(inclD) && inclD > 2.0)
      );
    });

    return hasFailure ? 'NOT OK' : 'OK';
  }, []);

  /**
   * Validate packing & storage checklist - per heat
   * Rules:
   * - All checklist items must be answered (Yes/No) to enable Accept/Reject
   * - All items must be "Yes" for OK
   * - Any "No" = NOT OK
   * - Returns 'Pending' if not all items are answered
   */
  const validatePackingStorage = useCallback((packingData, heatIndex) => {
    if (!packingData?.packingDataByHeat) return 'Pending';

    const heatData = packingData.packingDataByHeat[heatIndex];
    if (!heatData) return 'Pending';

    const checkItems = [
      'storedHeatWise',
      'suppliedInBundles',
      'heatNumberEnds',
      'packingStripWidth',
      'bundleTiedLocations',
      'identificationTagBundle',
      'metalTagInformation'
    ];

    // Check if ALL checklist items are answered (Yes/No/N/A)
    const allItemsAnswered = checkItems.every(item =>
      heatData[item] === 'Yes' || heatData[item] === 'No' || heatData[item] === 'N/A'
    );

    if (!allItemsAnswered) return 'Pending';

    // All items are answered, now check if any is "No"
    const hasNo = checkItems.some(item => heatData[item] === 'No');
    return hasNo ? 'NOT OK' : 'OK';
  }, []);

  /**
   * Compute submodule statuses per heat from localStorage data
   * Runs on mount and when activeHeats changes
   */
  useEffect(() => {
    const inspectionCallNo = call?.call_no;
    if (!inspectionCallNo || !activeHeats?.length) return;

    const computeStatuses = () => {
      const heatStatuses = {};

      // Get calibration data
      const calKey = `${STORAGE_KEYS.CALIBRATION}_${inspectionCallNo}`;
      const calRaw = localStorage.getItem(calKey);
      const calData = calRaw ? JSON.parse(calRaw) : null;

      // Get visual inspection data
      const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${inspectionCallNo}`;
      const visualRaw = localStorage.getItem(visualKey);
      const visualData = visualRaw ? JSON.parse(visualRaw) : [];

      // Get dimensional check data
      const dimKey = `${STORAGE_KEYS.DIMENSIONAL_CHECK}_${inspectionCallNo}`;
      const dimRaw = localStorage.getItem(dimKey);
      const dimData = dimRaw ? JSON.parse(dimRaw) : null;

      // Get material testing data
      const matKey = `${STORAGE_KEYS.MATERIAL_TESTING}_${inspectionCallNo}`;
      const matRaw = localStorage.getItem(matKey);
      const matData = matRaw ? JSON.parse(matRaw) : null;

      // Get packing & storage data
      const packKey = `${STORAGE_KEYS.PACKING_STORAGE}_${inspectionCallNo}`;
      const packRaw = localStorage.getItem(packKey);
      const packData = packRaw ? JSON.parse(packRaw) : null;

      // Compute status for each heat
      consolidatedHeats.forEach((heat, heatIndex) => {
        const heatNo = heat.heatNo || heat.heat_no || 'Unknown';

        const statuses = {
          calibration: 'Pending',
          visual: 'Pending',
          dimensional: 'Pending',
          materialTest: 'Pending',
          packing: 'Pending'
        };

        // Calibration: Find this heat's product values and validate
        if (calData?.heats && Array.isArray(calData.heats)) {
          const heatCalData = calData.heats.find(h => h.heatNo === heatNo);
          statuses.calibration = validateCalibrationHeat(heatCalData);
        }

        // Visual, Dimensional, etc. use the index from consolidatedHeats
        if (Array.isArray(visualData) && visualData[heatIndex]) {
          statuses.visual = validateVisualHeat(visualData[heatIndex]);
        }

        if (Array.isArray(dimData?.heatDimData) && dimData.heatDimData[heatIndex]?.dimSamples) {
          statuses.dimensional = validateDimensionalHeat(dimData.heatDimData[heatIndex].dimSamples, productModel);
        }

        if (Array.isArray(matData?.materialData) && matData.materialData[heatIndex]) {
          statuses.materialTest = validateMaterialTestHeat(matData.materialData[heatIndex]);
        }

        statuses.packing = validatePackingStorage(packData, heatIndex);

        heatStatuses[heatNo] = statuses;
      });

      setHeatSubmoduleStatuses(heatStatuses);
    };

    computeStatuses();

    // Listen for storage changes (when user saves data in submodules)
    const handleStorageChange = () => computeStatuses();
    window.addEventListener('storage', handleStorageChange);

    // Also re-check when component regains focus (user navigates back)
    window.addEventListener('focus', handleStorageChange);

    // Listen for custom event dispatched when submodule data is saved
    const handleCustomRefresh = () => computeStatuses();
    window.addEventListener('rm:statusRefresh', handleCustomRefresh);

    // Poll for changes every 2 seconds (to catch same-window localStorage changes)
    const pollInterval = setInterval(computeStatuses, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
      window.removeEventListener('rm:statusRefresh', handleCustomRefresh);
      clearInterval(pollInterval);
    };
  }, [call?.call_no, activeHeats, consolidatedHeats, productModel, validateCalibrationHeat, validateVisualHeat, validateDimensionalHeat, validateMaterialTestHeat, validatePackingStorage]);

  /**
   * Check if inspection can be finished based on module statuses
   * Returns { canFinish: boolean, reason: string }
   */
  const canFinishInspection = useCallback(() => {
    // Check if all heats have been evaluated
    if (!consolidatedHeats || consolidatedHeats.length === 0) {
      return { canFinish: false, reason: 'No heats available for inspection' };
    }

    // Check if Number of Bundles is entered
    if (!numberOfBundles || numberOfBundles.trim() === '') {
      return { canFinish: false, reason: 'Number of Bundles is required in Pre-Inspection Data' };
    }

    // Check each heat's module statuses and color code
    for (const heat of consolidatedHeats) {
      const heatNo = heat.heatNo || heat.heat_no || 'Unknown';

      // Check for Color Code
      if (!heat.colorCode || heat.colorCode.trim() === '') {
        return { canFinish: false, reason: `Heat ${heatNo}: Color Code is required` };
      }

      const heatStatuses = heatSubmoduleStatuses[heatNo] || {
        calibration: 'Pending',
        visual: 'Pending',
        dimensional: 'Pending',
        materialTest: 'Pending',
        packing: 'Pending'
      };

      const allPending = Object.values(heatStatuses).every(s => s === 'Pending');
      const anyPending = Object.values(heatStatuses).some(s => s === 'Pending');
      const dimensionalNotOk = heatStatuses.dimensional === 'NOT OK';
      const materialTestNotOk = heatStatuses.materialTest === 'NOT OK';
      const visualNotOk = heatStatuses.visual === 'NOT OK';

      // Rule 1: If all modules are pending, can't finish
      if (allPending) {
        return { canFinish: false, reason: `Heat ${heatNo}: All modules are pending` };
      }

      // Rule 2: If Dimension or Material Testing is NOT OK, complete heat is rejected
      // This is allowed to finish
      if (dimensionalNotOk || materialTestNotOk) {
        continue;
      }

      // Rule 3: If Visual is NOT OK and complete amount rejected, can finish
      // Rule 4: If Visual is NOT OK with partial rejection and other modules pending, can't finish
      if (visualNotOk) {
        // Load visual data to check if complete rejection
        const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${call?.call_no}`;
        const visualRaw = localStorage.getItem(visualKey);
        const visualData = visualRaw ? JSON.parse(visualRaw) : [];

        // Find this unique heat's visual data index
        const uniqueHeatIndex = consolidatedHeats.findIndex(h => (h.heatNo || h.heat_no) === heatNo);
        const heatVisualData = Array.isArray(visualData) && uniqueHeatIndex >= 0 ? visualData[uniqueHeatIndex] : null;
        const rejectedWeight = calculateVisualRejectedWeight(heatVisualData);
        const offeredWeight = heat.weight;

        const isCompleteRejection = rejectedWeight >= offeredWeight;

        if (!isCompleteRejection && anyPending) {
          return { canFinish: false, reason: `Heat ${heatNo}: Visual has partial rejection and other modules are pending` };
        }
      }

      // Rule 5: If any module is OK and others are pending, can't finish
      const anyOk = Object.values(heatStatuses).some(s => s === 'OK');
      if (anyOk && anyPending) {
        return { canFinish: false, reason: `Heat ${heatNo}: Some modules are OK but others are still pending` };
      }
    }

    // Check if remarks are entered for all heats
    for (const heat of consolidatedHeats) {
      const heatNo = heat.heatNo || heat.heat_no || 'Unknown';
      if (!heatRemarks[heatNo] || heatRemarks[heatNo].trim() === '') {
        return { canFinish: false, reason: `Heat ${heatNo}: Remarks are required` };
      }
    }

    return { canFinish: true, reason: '' };
  }, [consolidatedHeats, heatSubmoduleStatuses, heatRemarks, numberOfBundles, call?.call_no, calculateVisualRejectedWeight]);

  // Update canFinishInspectionState whenever dependencies change
  useEffect(() => {
    const result = canFinishInspection();
    setCanFinishInspectionState(result);
  }, [canFinishInspection]);

  /**
   * Handle Finish Inspection - collect all submodule data from localStorage and save to backend
   */
  const handleFinishInspection = useCallback(async () => {
    const inspectionCallNo = call?.call_no;
    if (!inspectionCallNo) {
      setResultModalConfig({
        actionType: 'error',
        callNumber: call?.call_no || '',
        message: 'No inspection call number found',
        additionalInfo: 'Please ensure the inspection call is properly loaded.'
      });
      setShowResultModal(true);
      return;
    }

    // Check if inspection can be finished
    const { canFinish, reason } = canFinishInspection();
    if (!canFinish) {
      setResultModalConfig({
        actionType: 'error',
        callNumber: call?.call_no || '',
        message: 'Cannot Finish Inspection',
        additionalInfo: reason
      });
      setShowResultModal(true);
      return;
    }

    setIsSaving(true);
    try {
      const shiftOfInspection = sessionStorage.getItem('inspectionShift') || null;

      // Collect Visual Inspection data - stored as array per heat index
      // Structure: [{ selectedDefects: {defectName: bool}, defectCounts: {defectName: string} }, ...]
      // NEW STRUCTURE: one record per heat with all defects as maps
      const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${inspectionCallNo}`;
      const visualRaw = localStorage.getItem(visualKey);
      let visualInspectionData = [];
      if (visualRaw) {
        const visualParsed = JSON.parse(visualRaw);
        if (Array.isArray(visualParsed)) {
          visualParsed.forEach((heatData, heatIndex) => {
            const heatNo = activeHeats[heatIndex]?.heatNo || `Heat-${heatIndex + 1}`;
            if (heatData?.selectedDefects) {
              // Convert defects object to map format
              const defects = {};
              const defectLengths = {};

              Object.entries(heatData.selectedDefects).forEach(([defectName, isSelected]) => {
                defects[defectName] = isSelected || false;

                // Add length if defect is selected and has a value
                if (isSelected && heatData.defectCounts?.[defectName]) {
                  defectLengths[defectName] = parseFloat(heatData.defectCounts[defectName]) || null;
                }
              });

              visualInspectionData.push({
                inspectionCallNo,
                heatNo,
                heatIndex,
                defects,
                defectLengths
              });
            }
          });
        }
      }

      // Collect Dimensional Check data - stored as { heatDimData: [{ dimSamples: [{diameter: value}, ...] }, ...] }
      // NEW STRUCTURE: one record per heat with all 20 samples as list
      const dimKey = `${STORAGE_KEYS.DIMENSIONAL_CHECK}_${inspectionCallNo}`;
      const dimRaw = localStorage.getItem(dimKey);
      let dimensionalCheckData = [];
      if (dimRaw) {
        const dimParsed = JSON.parse(dimRaw);
        if (Array.isArray(dimParsed.heatDimData)) {
          dimParsed.heatDimData.forEach((heatData, heatIndex) => {
            const heat = activeHeats[heatIndex];
            if (heat && heatData?.dimSamples && Array.isArray(heatData.dimSamples)) {
              // Convert all 20 samples to a list
              const sampleDiameters = heatData.dimSamples.map(sample => {
                const diameter = sample?.diameter;
                return (diameter !== null && diameter !== undefined && diameter !== '')
                  ? parseFloat(diameter)
                  : null;
              });

              dimensionalCheckData.push({
                inspectionCallNo,
                heatNo: heat.heatNo,
                heatIndex,
                sampleDiameters
              });
            }
          });
        }
      }

      // Collect Material Testing data - stored as { materialData: [{ samples: [{...}] }, ...] }
      const matKey = `${STORAGE_KEYS.MATERIAL_TESTING}_${inspectionCallNo}`;
      const matRaw = localStorage.getItem(matKey);
      let materialTestingData = [];
      // Helper to safely parse decimal values
      const parseDecimal = (val) => {
        if (val === null || val === undefined || val === '') return null;
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
      };
      if (matRaw) {
        const matParsed = JSON.parse(matRaw);
        if (Array.isArray(matParsed.materialData)) {
          matParsed.materialData.forEach((heatData, heatIndex) => {
            const heatNo = activeHeats[heatIndex]?.heatNo || `Heat-${heatIndex + 1}`;
            if (heatData?.samples && Array.isArray(heatData.samples)) {
              heatData.samples.forEach((sample, sampleIdx) => {
                materialTestingData.push({
                  inspectionCallNo,
                  heatNo,
                  heatIndex,
                  sampleNumber: sampleIdx + 1,
                  carbonPercent: parseDecimal(sample.c),
                  siliconPercent: parseDecimal(sample.si),
                  manganesePercent: parseDecimal(sample.mn),
                  phosphorusPercent: parseDecimal(sample.p),
                  sulphurPercent: parseDecimal(sample.s),
                  grainSize: parseDecimal(sample.grainSize),
                  hardnessHrc: parseDecimal(sample.hardness),
                  decarbDepthMm: parseDecimal(sample.decarb),
                  inclusionTypeA: sample.inclTypeA || null,
                  inclusionA: parseDecimal(sample.inclA),
                  inclusionTypeB: sample.inclTypeB || null,
                  inclusionB: parseDecimal(sample.inclB),
                  inclusionTypeC: sample.inclTypeC || null,
                  inclusionC: parseDecimal(sample.inclC),
                  inclusionTypeD: sample.inclTypeD || null,
                  inclusionD: parseDecimal(sample.inclD),
                  remarks: sample.remarks || null
                });
              });
            }
          });
        }
      }

      // Collect Packing & Storage data - per heat
      const packKey = `${STORAGE_KEYS.PACKING_STORAGE}_${inspectionCallNo}`;
      const packRaw = localStorage.getItem(packKey);
      let packingStorageData = [];
      if (packRaw) {
        const packParsed = JSON.parse(packRaw);
        if (packParsed.packingDataByHeat) {
          // Convert per-heat object to array
          Object.keys(packParsed.packingDataByHeat).forEach(heatIdx => {
            const heatData = packParsed.packingDataByHeat[heatIdx];
            const heat = activeHeats[parseInt(heatIdx)];
            if (heat) {
              packingStorageData.push({
                inspectionCallNo,
                heatNo: heat.heatNo,
                heatIndex: parseInt(heatIdx),
                storedHeatWise: heatData.storedHeatWise || null,
                suppliedInBundles: heatData.suppliedInBundles || null,
                heatNumberEnds: heatData.heatNumberEnds || null,
                packingStripWidth: heatData.packingStripWidth || null,
                bundleTiedLocations: heatData.bundleTiedLocations || null,
                identificationTagBundle: heatData.identificationTagBundle || null,
                metalTagInformation: heatData.metalTagInformation || null,
                remarks: heatData.remarks || null,
                shift: shiftOfInspection
              });
            }
          });
        }
      }

      // Collect Calibration Documents data
      const calKey = `${STORAGE_KEYS.CALIBRATION}_${inspectionCallNo}`;
      const calRaw = localStorage.getItem(calKey);
      let calibrationDocumentsData = [];
      if (calRaw) {
        const calParsed = JSON.parse(calRaw);
        // Structure: { rdsoApprovalValidity: {...}, heats: [{heatNo, percentC, percentSi, ...}], gaugesAvailable, vendorVerification: {...} }
        if (calParsed.heats && Array.isArray(calParsed.heats)) {
          calParsed.heats.forEach((heat, idx) => {
            calibrationDocumentsData.push({
              inspectionCallNo,
              heatNo: heat.heatNo || activeHeats[idx]?.heatNo || `Heat-${idx + 1}`,
              heatIndex: idx,
              rdsoApprovalId: calParsed.rdsoApprovalValidity?.approvalId || null,
              rdsoValidFrom: calParsed.rdsoApprovalValidity?.validFrom || null,
              rdsoValidTo: calParsed.rdsoApprovalValidity?.validTo || null,
              gaugesAvailable: calParsed.gaugesAvailable || false,
              ladleCarbonPercent: parseDecimal(heat.percentC),
              ladleSiliconPercent: parseDecimal(heat.percentSi),
              ladleManganesePercent: parseDecimal(heat.percentMn),
              ladlePhosphorusPercent: parseDecimal(heat.percentP),
              ladleSulphurPercent: parseDecimal(heat.percentS),
              vendorVerified: calParsed.vendorVerification?.verified || false,
              verifiedBy: calParsed.vendorVerification?.verifiedBy || null,
              verifiedAt: calParsed.vendorVerification?.verifiedAt || null
            });
          });
        }
      }

      // Collect pre-inspection data (heats, weights, bundles)
      // Use consolidatedHeats to get unique heat count and aggregated weight
      const preInspectionData = {
        inspectionCallNo,
        totalHeatsOffered: consolidatedHeats.length,
        totalQtyOfferedMt: consolidatedHeats.reduce((sum, h) => sum + h.weight, 0),
        numberOfBundles: numberOfBundles ? parseInt(numberOfBundles) : null,
        numberOfErc: numberOfERC || null,
        productModel: productModel || null,
        poNo: poData?.po_no || null,
        poDate: poData?.po_date || null,
        vendorName: poData?.vendor_name || null,
        placeOfInspection: poData?.place_of_inspection || null,
        sourceOfRawMaterial: sourceOfRawMaterial || null
      };

      // Get current user for audit fields
      const currentUser = getStoredUser();
      const userId = currentUser?.userId || currentUser?.username || 'IE_USER';

      // Collect final results per heat (status, weights, remarks)
      // Use consolidatedHeats (already groups duplicate heat numbers)
      const heatFinalResults = consolidatedHeats.map((heat, heatIndex) => {
        const heatNo = heat.heatNo || heat.heat_no || 'Unknown';
        const heatStatuses = heatSubmoduleStatuses[heatNo] || {
          calibration: 'Pending',
          visual: 'Pending',
          dimensional: 'Pending',
          materialTest: 'Pending',
          packing: 'Pending'
        };
        const dimensionalNotOk = heatStatuses.dimensional === 'NOT OK';
        const materialTestNotOk = heatStatuses.materialTest === 'NOT OK';
        const weight = heat.weight; // Already aggregated in consolidatedHeats

        let totalRejectedWeight = 0;
        let acceptedQtyMt = 0;
        let wtAcceptedNumbers = 0;
        let overallStatus = 'PENDING';

        if (dimensionalNotOk || materialTestNotOk) {
          // Complete heat rejection
          totalRejectedWeight = weight;
          acceptedQtyMt = 0;
          wtAcceptedNumbers = 0;
          overallStatus = 'REJECTED';
        } else {
          // Calculate rejected weight from visual inspection data
          const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${inspectionCallNo}`;
          const visualRaw = localStorage.getItem(visualKey);
          const visualData = visualRaw ? JSON.parse(visualRaw) : [];

          // Use the index from consolidated list
          const heatVisualData = Array.isArray(visualData) && heatIndex >= 0 ? visualData[heatIndex] : null;
          totalRejectedWeight = calculateVisualRejectedWeight(heatVisualData);

          // Check if any modules are still pending
          const anyPending = Object.values(heatStatuses).some(s => s === 'Pending');

          if (anyPending) {
            acceptedQtyMt = 0;
            wtAcceptedNumbers = 0;
            overallStatus = 'PENDING';
          } else {
            // All modules are complete
            acceptedQtyMt = weight - totalRejectedWeight;
            wtAcceptedNumbers = (acceptedQtyMt * 1000) / 1.15;

            // Determine Heat Status based on weights and submodule results
            if (acceptedQtyMt === weight) {
              overallStatus = 'ACCEPTED';
            } else if (acceptedQtyMt > 0) {
              overallStatus = 'PARTIALLY_ACCEPTED';
            } else {
              overallStatus = 'REJECTED';
            }
          }
        }

        return {
          inspectionCallNo,
          heatNo,
          tcNo: heat.tcNo, // Keep TC for reference in the result

          // Weights (MT)
          weightOfferedMt: weight,
          weightAcceptedMt: acceptedQtyMt,
          weightRejectedMt: totalRejectedWeight,
          acceptedQtyMt: Math.floor(wtAcceptedNumbers),

          // Per-Submodule Status
          calibrationStatus: heatStatuses.calibration,
          visualStatus: heatStatuses.visual,
          dimensionalStatus: heatStatuses.dimensional,
          materialTestStatus: heatStatuses.materialTest,
          packingStatus: heatStatuses.packing,

          // Final Status
          status: overallStatus,
          overallStatus: overallStatus,

          // Cumulative Summary
          totalHeatsOffered: consolidatedHeats.length,
          totalQtyOfferedMt: consolidatedHeats.reduce((sum, h) => sum + h.weight, 0),
          noOfBundles: numberOfBundles ? parseInt(numberOfBundles) : 0,
          noOfErcFinished: numberOfERC ? parseInt(numberOfERC) : 0,

          // Remarks
          remarks: heatRemarks[heatNo] || null,

          // Audit Fields
          createdBy: userId,
          shift: shiftOfInspection
        };
      });

      // Calculate overall inspection status based on all heat results
      const acceptedHeats = heatFinalResults.filter(h => h.status === 'ACCEPTED').length;
      const rejectedHeats = heatFinalResults.filter(h => h.status === 'REJECTED').length;
      const partiallyAcceptedHeats = heatFinalResults.filter(h => h.status === 'PARTIALLY_ACCEPTED').length;
      const totalHeats = heatFinalResults.length;

      let overallInspectionStatus = 'PENDING';
      if (acceptedHeats === totalHeats && totalHeats > 0) {
        overallInspectionStatus = 'ACCEPTED';
      } else if (rejectedHeats === totalHeats && totalHeats > 0) {
        overallInspectionStatus = 'REJECTED';
      } else if (partiallyAcceptedHeats > 0 || (acceptedHeats > 0 && rejectedHeats > 0)) {
        overallInspectionStatus = 'PARTIALLY_ACCEPTED';
      }

      console.log(`📊 Overall Inspection Status: ${overallInspectionStatus} (${acceptedHeats} accepted, ${rejectedHeats} rejected out of ${totalHeats} heats)`);

      // Build the complete payload
      const payload = {
        inspectionCallNo,
        preInspectionData,
        heatFinalResults,
        visualInspectionData,
        dimensionalCheckData,
        materialTestingData,
        packingStorageData,
        calibrationDocumentsData,
        inspectorDetails: {
          finishedBy: localStorage.getItem('username') || 'IE_USER',
          finishedAt: new Date().toISOString(),
          inspectionDate: sessionStorage.getItem('inspectionDate') || new Date().toISOString().split('T')[0],
          shiftOfInspection: shiftOfInspection
        },
        createdBy: userId,
        updatedBy: userId
      };

      // Debug: Log what we're sending
      console.log('Finish Inspection Payload:', JSON.stringify(payload, null, 2));

      // Step 1: Update color codes for all heats before saving inspection
      console.log('Updating color codes for heats...');
      const colorCodeUpdatePromises = activeHeats
        .filter(heat => heat.colorCode && heat.colorCode.trim() !== '') // Only update if color code is provided
        .map(heat => {
          const heatId = heat.id; // Heat ID from rm_heat_quantities table
          const colorCode = heat.colorCode;
          console.log(`Updating color code for heat ID ${heatId}: ${colorCode}`);
          return updateColorCode(heatId, colorCode).catch(err => {
            console.error(`Failed to update color code for heat ${heatId}:`, err);
            // Don't throw - continue with other updates
            return null;
          });
        });

      // Wait for all color code updates to complete
      await Promise.all(colorCodeUpdatePromises);
      console.log('Color codes updated successfully');

      // Step 2: Call the backend API to save inspection data
      await finishInspection(payload);

      // Step 3: Trigger workflow API for Finish Inspection
      console.log('🔄 Triggering workflow API for Finish Inspection...');

      const workflowActionData = {
        workflowTransitionId: call.workflowTransitionId || call.id,
        requestId: inspectionCallNo,
        action: 'INSPECTION_COMPLETE_CONFIRM',
        remarks: `Inspection completed with status: ${overallInspectionStatus}`,
        actionBy: userId,
        pincode: call.pincode || '560001'
      };

      console.log('Workflow Action Data:', workflowActionData);

      try {
        await performTransitionAction(workflowActionData);
        console.log('✅ Workflow transition successful');
      } catch (workflowError) {
        console.error('❌ Workflow API error:', workflowError);
        // Don't fail the entire operation if workflow fails
        console.warn('Inspection saved but workflow transition failed');
      }

      // Clear localStorage after successful save
      localStorage.removeItem(visualKey);
      localStorage.removeItem(dimKey);
      localStorage.removeItem(matKey);
      localStorage.removeItem(packKey);
      localStorage.removeItem(calKey);

      // Show success modal instead of alert
      setResultModalConfig({
        actionType: 'finish',
        callNumber: inspectionCallNo,
        message: 'Raw Material Inspection has been completed successfully!',
        additionalInfo: `Status: ${overallInspectionStatus}`
      });
      setShowResultModal(true);

      // Navigate back after a short delay to allow user to see the modal
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error('Error finishing inspection:', error);
      setResultModalConfig({
        actionType: 'error',
        callNumber: call?.call_no || '',
        message: 'Failed to Save Inspection Data',
        additionalInfo: error.message || 'An unexpected error occurred. Please try again.'
      });
      setShowResultModal(true);
    } finally {
      setIsSaving(false);
    }
  }, [call?.call_no, call?.id, call?.pincode, call?.workflowTransitionId, activeHeats, onBack, numberOfBundles, numberOfERC, sourceOfRawMaterial, poData, productModel, heatSubmoduleStatuses, heatRemarks, calculateVisualRejectedWeight, consolidatedHeats, canFinishInspection]);

  // Withheld modal handlers
  const handleOpenWithheldModal = () => {
    setWithheldReason('');
    setWithheldRemarks('');
    setWithheldError('');
    setShowWithheldModal(true);
  };

  const handleCloseWithheldModal = () => {
    setShowWithheldModal(false);
    setWithheldReason('');
    setWithheldRemarks('');
    setWithheldError('');
  };

  const handleSubmitWithheld = async () => {
    if (!withheldReason) {
      setWithheldError('Please select a reason');
      return;
    }
    if (withheldReason === 'ANY_OTHER' && !withheldRemarks.trim()) {
      setWithheldError('Please provide remarks for "Any other" reason');
      return;
    }

    setIsSaving(true);
    try {
      const actionData = {
        inspectionRequestId: call?.api_id || null,
        callNo: call?.call_no,
        poNo: call?.po_no,
        actionType: 'WITHHELD',
        reason: withheldReason,
        remarks: withheldRemarks.trim(),
        status: 'WITHHELD',
        actionDate: new Date().toISOString()
      };

      // Raw Material: Call real API
      await saveInspectionInitiation(actionData);

      // Mark call as withheld in local storage
      markAsWithheld(call?.call_no, withheldRemarks.trim());

      // Clear all inspection data from localStorage
      const inspectionCallNo = call?.call_no;
      if (inspectionCallNo) {
        const visKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${inspectionCallNo}`;
        const dimKey = `${STORAGE_KEYS.DIMENSIONAL_CHECK}_${inspectionCallNo}`;
        const matKey = `${STORAGE_KEYS.MATERIAL_TESTING}_${inspectionCallNo}`;
        const packKey = `${STORAGE_KEYS.PACKING_STORAGE}_${inspectionCallNo}`;
        const calKey = `${STORAGE_KEYS.CALIBRATION}_${inspectionCallNo}`;
        const mainKey = `${STORAGE_KEYS.MAIN_INSPECTION}_${inspectionCallNo}`;

        localStorage.removeItem(visKey);
        localStorage.removeItem(dimKey);
        localStorage.removeItem(matKey);
        localStorage.removeItem(packKey);
        localStorage.removeItem(calKey);
        localStorage.removeItem(mainKey);
      }

      setResultModalConfig({
        actionType: 'withheld',
        callNumber: call?.call_no || '',
        message: 'Inspection Withheld Successfully',
        additionalInfo: `Reason: ${withheldReason === 'ANY_OTHER' ? withheldRemarks : WITHHELD_REASONS.find(r => r.value === withheldReason)?.label || withheldReason}`
      });
      setShowResultModal(true);
      handleCloseWithheldModal();
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error('Error withholding inspection:', error);
      setWithheldError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Show confirmation modal for pause inspection
  const handlePauseClick = () => {
    setConfirmModalConfig({
      title: 'Pause Inspection',
      message: 'Are you sure you want to pause this inspection? You can resume it later.',
      confirmText: 'Pause',
      cancelText: 'Cancel',
      isDangerous: false,
      actionType: 'pause',
      callNumber: call?.call_no || '',
      onConfirm: () => {
        setShowConfirmModal(false);
        handlePauseInspectionConfirmed();
      }
    });
    setShowConfirmModal(true);
  };

  // Show confirmation modal for finish inspection
  const handleFinishClick = () => {
    setConfirmModalConfig({
      title: 'Finish Inspection',
      message: 'Are you sure you want to finish this inspection? This action cannot be undone.',
      confirmText: 'Finish',
      cancelText: 'Cancel',
      isDangerous: true,
      actionType: 'finish',
      callNumber: call?.call_no || '',
      onConfirm: () => {
        setShowConfirmModal(false);
        handleFinishInspection();
      }
    });
    setShowConfirmModal(true);
  };

  // Pause Inspection handler - collects all data and saves to database
  const handlePauseInspectionConfirmed = useCallback(async () => {
    const inspectionCallNo = call?.call_no;
    if (!inspectionCallNo) {
      setResultModalConfig({
        actionType: 'error',
        callNumber: call?.call_no || '',
        message: 'No inspection call number found',
        additionalInfo: 'Please ensure the inspection call is properly loaded.'
      });
      setShowResultModal(true);
      return;
    }

    setIsSaving(true);
    try {
      // Helper to safely parse decimal values
      const parseDecimal = (val) => {
        if (val === null || val === undefined || val === '') return null;
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
      };

      // Collect Visual Inspection data - NEW STRUCTURE: one record per heat with all defects as maps
      const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${inspectionCallNo}`;
      const visualRaw = localStorage.getItem(visualKey);
      let visualInspectionData = [];
      if (visualRaw) {
        const visualParsed = JSON.parse(visualRaw);
        if (Array.isArray(visualParsed)) {
          visualParsed.forEach((heatData, heatIndex) => {
            const heatNo = activeHeats[heatIndex]?.heatNo || `Heat-${heatIndex + 1}`;
            if (heatData?.selectedDefects) {
              // Convert defects object to map format
              const defects = {};
              const defectLengths = {};

              Object.entries(heatData.selectedDefects).forEach(([defectName, isSelected]) => {
                defects[defectName] = isSelected || false;

                // Add length if defect is selected and has a value
                if (isSelected && heatData.defectCounts?.[defectName]) {
                  defectLengths[defectName] = parseFloat(heatData.defectCounts[defectName]) || null;
                }
              });

              visualInspectionData.push({
                inspectionCallNo,
                heatNo,
                heatIndex,
                defects,
                defectLengths
              });
            }
          });
        }
      }

      // Collect Dimensional Check data - NEW STRUCTURE: one record per heat with all 20 samples as list
      const dimKey = `${STORAGE_KEYS.DIMENSIONAL_CHECK}_${inspectionCallNo}`;
      const dimRaw = localStorage.getItem(dimKey);
      let dimensionalCheckData = [];
      if (dimRaw) {
        const dimParsed = JSON.parse(dimRaw);
        if (Array.isArray(dimParsed.heatDimData)) {
          dimParsed.heatDimData.forEach((heatData, heatIndex) => {
            const heat = activeHeats[heatIndex];
            if (heat && heatData?.dimSamples && Array.isArray(heatData.dimSamples)) {
              // Convert all 20 samples to a list
              const sampleDiameters = heatData.dimSamples.map(sample => {
                const diameter = sample?.diameter;
                return (diameter !== null && diameter !== undefined && diameter !== '')
                  ? parseFloat(diameter)
                  : null;
              });

              dimensionalCheckData.push({
                inspectionCallNo,
                heatNo: heat.heatNo,
                heatIndex,
                sampleDiameters
              });
            }
          });
        }
      }

      // Collect Material Testing data
      const matKey = `${STORAGE_KEYS.MATERIAL_TESTING}_${inspectionCallNo}`;
      const matRaw = localStorage.getItem(matKey);
      let materialTestingData = [];
      if (matRaw) {
        const matParsed = JSON.parse(matRaw);
        if (Array.isArray(matParsed.materialData)) {
          matParsed.materialData.forEach((heatData, heatIndex) => {
            const heatNo = activeHeats[heatIndex]?.heatNo || `Heat-${heatIndex + 1}`;
            if (heatData?.samples && Array.isArray(heatData.samples)) {
              heatData.samples.forEach((sample, sampleIdx) => {
                materialTestingData.push({
                  inspectionCallNo,
                  heatNo,
                  heatIndex,
                  sampleNumber: sampleIdx + 1,
                  carbonPercent: parseDecimal(sample.c),
                  siliconPercent: parseDecimal(sample.si),
                  manganesePercent: parseDecimal(sample.mn),
                  phosphorusPercent: parseDecimal(sample.p),
                  sulphurPercent: parseDecimal(sample.s),
                  grainSize: parseDecimal(sample.grainSize),
                  hardnessHrc: parseDecimal(sample.hardness),
                  decarbDepthMm: parseDecimal(sample.decarb),
                  inclusionTypeA: sample.inclTypeA || null,
                  inclusionA: parseDecimal(sample.inclA),
                  inclusionTypeB: sample.inclTypeB || null,
                  inclusionB: parseDecimal(sample.inclB),
                  inclusionTypeC: sample.inclTypeC || null,
                  inclusionC: parseDecimal(sample.inclC),
                  inclusionTypeD: sample.inclTypeD || null,
                  inclusionD: parseDecimal(sample.inclD),
                  remarks: sample.remarks || null
                });
              });
            }
          });
        }
      }

      // Collect Packing & Storage data
      const packKey = `${STORAGE_KEYS.PACKING_STORAGE}_${inspectionCallNo}`;
      const packRaw = localStorage.getItem(packKey);
      let packingStorageData = [];
      if (packRaw) {
        const packParsed = JSON.parse(packRaw);
        if (packParsed.packingDataByHeat) {
          Object.keys(packParsed.packingDataByHeat).forEach(heatIdx => {
            const heatData = packParsed.packingDataByHeat[heatIdx];
            const heat = activeHeats[parseInt(heatIdx)];
            if (heat) {
              packingStorageData.push({
                inspectionCallNo,
                heatNo: heat.heatNo,
                heatIndex: parseInt(heatIdx),
                storedHeatWise: heatData.storedHeatWise || null,
                suppliedInBundles: heatData.suppliedInBundles || null,
                heatNumberEnds: heatData.heatNumberEnds || null,
                packingStripWidth: heatData.packingStripWidth || null,
                bundleTiedLocations: heatData.bundleTiedLocations || null,
                identificationTagBundle: heatData.identificationTagBundle || null,
                metalTagInformation: heatData.metalTagInformation || null,
                remarks: heatData.remarks || null,
                shift: shiftOfInspection
              });
            }
          });
        }
      }

      // Collect Calibration Documents data
      const calKey = `${STORAGE_KEYS.CALIBRATION}_${inspectionCallNo}`;
      const calRaw = localStorage.getItem(calKey);
      let calibrationDocumentsData = [];
      if (calRaw) {
        const calParsed = JSON.parse(calRaw);
        if (calParsed.heats && Array.isArray(calParsed.heats)) {
          calParsed.heats.forEach((heat, idx) => {
            calibrationDocumentsData.push({
              inspectionCallNo,
              heatNo: heat.heatNo || activeHeats[idx]?.heatNo || `Heat-${idx + 1}`,
              heatIndex: idx,
              rdsoApprovalId: calParsed.rdsoApprovalValidity?.approvalId || null,
              rdsoValidFrom: calParsed.rdsoApprovalValidity?.validFrom || null,
              rdsoValidTo: calParsed.rdsoApprovalValidity?.validTo || null,
              gaugesAvailable: calParsed.gaugesAvailable || false,
              ladleCarbonPercent: parseDecimal(heat.percentC),
              ladleSiliconPercent: parseDecimal(heat.percentSi),
              ladleManganesePercent: parseDecimal(heat.percentMn),
              ladlePhosphorusPercent: parseDecimal(heat.percentP),
              ladleSulphurPercent: parseDecimal(heat.percentS),
              vendorVerified: calParsed.vendorVerification?.verified || false,
              verifiedBy: calParsed.vendorVerification?.verifiedBy || null,
              verifiedAt: calParsed.vendorVerification?.verifiedAt || null
            });
          });
        }
      }

      // Collect pre-inspection data using consolidatedHeats
      const preInspectionData = {
        inspectionCallNo,
        totalHeatsOffered: consolidatedHeats.length,
        totalQtyOfferedMt: consolidatedHeats.reduce((sum, h) => sum + h.weight, 0),
        numberOfBundles: numberOfBundles ? parseInt(numberOfBundles) : null,
        numberOfErc: numberOfERC || null,
        productModel: productModel || null,
        poNo: poData?.po_no || null,
        poDate: poData?.po_date || null,
        vendorName: poData?.vendor_name || null,
        placeOfInspection: poData?.place_of_inspection || null,
        sourceOfRawMaterial: sourceOfRawMaterial || null
      };

      // Get current user for audit fields
      const currentUser = getStoredUser();
      const userId = currentUser?.userId || currentUser?.username || 'IE_USER';
      const shiftOfInspection = sessionStorage.getItem('inspectionShift') || null;

      // Collect heat final results using consolidatedHeats to group duplicate heat numbers
      const heatFinalResults = consolidatedHeats.map((heat) => {
        const heatNo = heat.heatNo || heat.heat_no;
        const heatStatuses = heatSubmoduleStatuses[heatNo] || {
          calibration: 'Pending',
          visual: 'Pending',
          dimensional: 'Pending',
          materialTest: 'Pending',
          packing: 'Pending'
        };
        const hasNotOk = Object.values(heatStatuses).some(s => s === 'NOT OK');
        const allOk = Object.values(heatStatuses).every(s => s === 'OK');
        const isAccepted = allOk && !hasNotOk;
        const isRejected = hasNotOk;
        const weight = heat.weight; // Already aggregated in consolidatedHeats

        // Calculate rejected weight from visual inspection data
        const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${inspectionCallNo}`;
        const visualRaw = localStorage.getItem(visualKey);
        const visualData = visualRaw ? JSON.parse(visualRaw) : [];

        let totalRejectedWeight = 0;
        const processedHeatNumbers = new Set();
        if (heat.originalHeats && Array.isArray(heat.originalHeats)) {
          heat.originalHeats.forEach((originalHeat) => {
            const originalHeatNumber = originalHeat.heatNo || originalHeat.heat_no;
            if (!processedHeatNumbers.has(originalHeatNumber)) {
              const heatIndex = activeHeats.findIndex(h => (h.heatNo || h.heat_no) === originalHeatNumber);
              const heatVisualData = Array.isArray(visualData) && heatIndex >= 0 ? visualData[heatIndex] : null;
              const rejectedWeight = calculateVisualRejectedWeight(heatVisualData);
              totalRejectedWeight += rejectedWeight;
              processedHeatNumbers.add(originalHeatNumber);
            }
          });
        }

        // Calculate accepted qty: Offered Qty - Rejected Weight (in Tons)
        const acceptedQtyMt = weight - totalRejectedWeight;

        // Calculate Wt. Accepted (Numbers) = Accepted Qty (Tons) * 1000 / 1.15
        const wtAcceptedNumbers = (acceptedQtyMt * 1000) / 1.15;

        let overallStatus = 'PENDING';
        if (acceptedQtyMt === weight) {
          overallStatus = 'ACCEPTED';
        } else if (acceptedQtyMt > 0) {
          overallStatus = 'PARTIALLY_ACCEPTED';
        } else {
          overallStatus = 'REJECTED';
        }

        const anyPending = Object.values(heatStatuses).some(s => s === 'Pending');
        if (anyPending) {
          overallStatus = 'PENDING';
        }

        return {
          inspectionCallNo,
          heatNo,
          weightOfferedMt: weight,
          weightAcceptedMt: acceptedQtyMt,
          weightRejectedMt: totalRejectedWeight,
          acceptedQtyMt: Math.floor(wtAcceptedNumbers),
          calibrationStatus: heatStatuses.calibration,
          visualStatus: heatStatuses.visual,
          dimensionalStatus: heatStatuses.dimensional,
          materialTestStatus: heatStatuses.materialTest,
          packingStatus: heatStatuses.packing,
          status: isRejected ? 'REJECTED' : isAccepted ? 'ACCEPTED' : 'PENDING',
          overallStatus: overallStatus,
          totalHeatsOffered: consolidatedHeats.length,
          totalQtyOfferedMt: consolidatedHeats.reduce((sum, h) => sum + h.weight, 0),
          noOfBundles: numberOfBundles ? parseInt(numberOfBundles) : 0,
          noOfErcFinished: numberOfERC ? parseInt(numberOfERC) : 0,
          remarks: heatRemarks[heatNo] || null,

          // Audit Fields
          createdBy: userId,
          shift: shiftOfInspection
        };
      });

      // Build pause payload
      const pausePayload = {
        inspectionCallNo,
        preInspectionData,
        heatFinalResults,
        visualInspectionData,
        dimensionalCheckData,
        materialTestingData,
        packingStorageData,
        calibrationDocumentsData,
        inspectorDetails: {
          finishedBy: localStorage.getItem('username') || 'IE_USER',
          finishedAt: new Date().toISOString(),
          inspectionDate: sessionStorage.getItem('inspectionDate') || new Date().toISOString().split('T')[0],
          shiftOfInspection: shiftOfInspection
        },
        createdBy: userId,
        updatedBy: userId
      };

      console.log('Pause Inspection Payload:', JSON.stringify(pausePayload, null, 2));

      // Step 1: Update color codes for all heats
      console.log('Updating color codes for heats...');
      const colorCodeUpdatePromises = activeHeats
        .filter(heat => heat.colorCode && heat.colorCode.trim() !== '')
        .map(heat => {
          const heatId = heat.id;
          const colorCode = heat.colorCode;
          console.log(`Updating color code for heat ID ${heatId}: ${colorCode}`);
          return updateColorCode(heatId, colorCode).catch(err => {
            console.error(`Failed to update color code for heat ${heatId}:`, err);
            return null;
          });
        });

      await Promise.all(colorCodeUpdatePromises);
      console.log('Color codes updated successfully');

      // Step 2: Call the backend pause API
      console.log('💾 Saving inspection data (paused)...');
      await pauseRawMaterialInspection(pausePayload);
      console.log('✅ Inspection data saved successfully');

      // Step 3: Trigger workflow API
      console.log('🔄 Triggering workflow API for Pause Inspection...');

      const workflowActionData = {
        workflowTransitionId: call.workflowTransitionId || call.id,
        requestId: inspectionCallNo,
        action: 'PAUSE_INSPECTION_RESUME_NEXT_DAY',
        remarks: 'Inspection paused by IE',
        actionBy: userId,
        pincode: call.pincode || '560001'
      };

      console.log('Workflow Action Data:', workflowActionData);

      try {
        await performTransitionAction(workflowActionData);
        console.log('✅ Workflow transition successful');
      } catch (workflowError) {
        console.error('❌ Workflow API error:', workflowError);
        console.warn('Inspection saved but workflow transition failed');
      }

      // Mark as paused in local storage
      markAsPaused(inspectionCallNo);

      // Show success modal instead of alert
      setResultModalConfig({
        actionType: 'pause',
        callNumber: inspectionCallNo,
        message: 'Inspection has been paused successfully.',
        additionalInfo: 'You can resume this inspection from the IE Landing Page'
      });
      setShowResultModal(true);

      // Navigate back after a short delay to allow user to see the modal
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error('Error pausing inspection:', error);
      // Show error modal instead of alert
      setResultModalConfig({
        actionType: 'error',
        callNumber: inspectionCallNo,
        message: `Failed to pause inspection: ${error.message || 'Unknown error'}`,
        additionalInfo: 'Please try again or contact support if the issue persists'
      });
      setShowResultModal(true);
    } finally {
      setIsSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call, onBack, activeHeats, numberOfBundles, numberOfERC, sourceOfRawMaterial, poData, productModel, heatSubmoduleStatuses, heatRemarks]);

  // Save Draft handler
  const handleSaveDraft = useCallback(() => {
    const inspectionCallNo = call?.call_no;
    if (!inspectionCallNo) {
      setResultModalConfig({
        actionType: 'error',
        callNumber: '',
        message: 'Cannot save draft: No inspection call number found',
        additionalInfo: 'Please try again or contact support'
      });
      setShowResultModal(true);
      return;
    }

    setIsSavingDraft(true);

    try {
      // Collect all dashboard form data
      const draftData = {
        savedAt: new Date().toISOString(),
        numberOfBundles: numberOfBundles,
        sourceOfRawMaterial: sourceOfRawMaterial,
        heatRemarks: heatRemarks,
        // Save heat color codes
        heatColorCodes: fetchedHeatData.reduce((acc, heat) => {
          if (heat.heatNo && heat.colorCode) {
            acc[heat.heatNo] = heat.colorCode;
          }
          return acc;
        }, {})
      };

      // Save to localStorage with inspection call number as key
      const storageKey = `${DASHBOARD_DRAFT_KEY}${inspectionCallNo}`;
      localStorage.setItem(storageKey, JSON.stringify(draftData));

      // Also save to main inspection data key (for color codes)
      const mainKey = `${STORAGE_KEYS.MAIN_INSPECTION}_${inspectionCallNo}`;
      localStorage.setItem(mainKey, JSON.stringify(draftData));

      // Show success modal instead of alert
      setResultModalConfig({
        actionType: 'draft',
        callNumber: inspectionCallNo,
        message: 'Draft has been saved successfully!',
        additionalInfo: `Saved at ${new Date().toLocaleTimeString()}`
      });
      setShowResultModal(true);
    } catch (error) {
      console.error('Error saving draft:', error);
      // Show error modal instead of alert
      setResultModalConfig({
        actionType: 'error',
        callNumber: inspectionCallNo,
        message: `Failed to save draft: ${error.message}`,
        additionalInfo: 'Please try again or contact support'
      });
      setShowResultModal(true);
    } finally {
      setIsSavingDraft(false);
    }
  }, [call?.call_no, numberOfBundles, sourceOfRawMaterial, heatRemarks, fetchedHeatData]);

  // Load draft data from localStorage on mount (after heat data is loaded)
  useEffect(() => {
    const inspectionCallNo = call?.call_no;
    if (!inspectionCallNo || fetchedHeatData.length === 0 || hasLoadedDraftRef.current) return;

    // Mark as loaded to prevent re-running
    hasLoadedDraftRef.current = true;

    try {
      const storageKey = `${DASHBOARD_DRAFT_KEY}${inspectionCallNo}`;
      const savedDraft = localStorage.getItem(storageKey);

      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        console.log('📦 Loading draft data from localStorage:', draftData);

        // Restore form data
        if (draftData.numberOfBundles) setNumberOfBundles(draftData.numberOfBundles);
        if (draftData.sourceOfRawMaterial) setSourceOfRawMaterial(draftData.sourceOfRawMaterial);
        if (draftData.heatRemarks) setHeatRemarks(draftData.heatRemarks);

        // Restore color codes to heat data
        if (draftData.heatColorCodes && Object.keys(draftData.heatColorCodes).length > 0) {
          const heatsWithColorCodes = fetchedHeatData.map(heat => {
            const heatNo = heat.heatNo || heat.heat_no;
            return {
              ...heat,
              colorCode: draftData.heatColorCodes[heatNo] || heat.colorCode || ''
            };
          });
          setFetchedHeatData(heatsWithColorCodes);
          console.log('✅ Restored color codes to heat data');
        }

        console.log('✅ Draft data loaded successfully');
      }
    } catch (error) {
      console.error('Error loading draft data:', error);
    }
  }, [call?.call_no, fetchedHeatData]);

  // Show loading indicator while fetching data
  if (isLoading) {
    return (
      <div className="rm-dashboard-container">
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-32)' }}>
          <p>{isLoadingFromCache ? '📦 Loading from cache...' : '🌐 Loading inspection data...'}</p>
        </div>
      </div>
    );
  }

  // Get call details for display
  const callNo = fetchedCallData?.inspectionCallNo || call?.call_no || 'N/A';
  // Read shift and date from sessionStorage (saved during Initiation) or fallback to fetched data
  const shiftOfInspection = sessionStorage.getItem('inspectionShift') || fetchedCallData?.shiftOfInspection || 'N/A';
  const dateOfInspection = sessionStorage.getItem('inspectionDate') || fetchedCallData?.dateOfInspection || 'N/A';

  return (
    <div className="rm-dashboard-container">
      <div className="breadcrumb">
        <div className="breadcrumb-item" onClick={onBack} style={{ cursor: 'pointer' }}>Landing Page</div>
        <span className="breadcrumb-separator">/</span>
        <div className="breadcrumb-item">Inspection Initiation</div>
        <span className="breadcrumb-separator">/</span>
        <div className="breadcrumb-item breadcrumb-active">ERC Raw Material</div>
      </div>

      {/* <div className="rm-page-header">
        <h1>ERC Raw Material Inspection - {callNo}</h1>
        <button className="rm-back-button" onClick={onBack}>
          ← Back to Landing Page
        </button>
      </div> */}

      {/* Inspection Call Info Banner */}
      <div className="card" style={{ background: 'var(--color-primary-light)', marginBottom: 'var(--space-16)', padding: 'var(--space-16)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-24)', flexWrap: 'wrap' }}>
          <div><strong>Call No:</strong> {callNo}</div>
          <div><strong>Shift:</strong> {shiftOfInspection}</div>
          <div><strong>Date of Inspection:</strong> {dateOfInspection}</div>
        </div>
      </div>

      {/* Header with Static Data */}
      <div className="card" style={{ background: 'var(--color-gray-100)', marginBottom: 'var(--space-24)' }}>
        <div className="card-header rm-card-header">
          <h3 className="card-title rm-card-title">Inspection Details </h3>
          <p className="card-subtitle">Auto-fetched from PO/Sub PO information</p>
        </div>
        <div className="rm-form-grid">
          <div className="rm-form-group">
            <label className="rm-form-label">PO Number</label>
            <input type="text" className="rm-form-input" value={poData.po_no || poData.sub_po_no || ''} disabled />
          </div>
          <div className="rm-form-group">
            <label className="rm-form-label">PO Date</label>
            <input type="text" className="rm-form-input" value={formatDate(poData.po_date || poData.sub_po_date) || ''} disabled />
          </div>
          <div className="rm-form-group">
            <label className="rm-form-label">Contractor Name</label>
            <input type="text" className="rm-form-input" value={poData.contractor || poData.vendor_name || ''} disabled />
          </div>
          <div className="rm-form-group">
            <label className="rm-form-label">Manufacturer</label>
            <input type="text" className="rm-form-input" value={poData.manufacturer || ''} disabled />
          </div>
          <div className="rm-form-group">
            <label className="rm-form-label">Place of Inspection</label>
            <input type="text" className="rm-form-input" value={poData.place_of_inspection || ''} disabled />
          </div>
          <div className="rm-form-group">
            <label className="rm-form-label">Stage of Inspection</label>
            <input type="text" className="rm-form-input" value="Raw Material Inspection" disabled />
          </div>
        </div>
      </div>

      {/* Pre-Inspection Data Entry */}
      <div className="card" style={{ marginBottom: 'var(--space-24)' }}>
        <div className="card-header rm-card-header">
          <h3 className="card-title rm-card-title">Pre-Inspection Data Entry</h3>
          {/* <p className="card-subtitle">Heat data from vendor call + cumulative inspection summary</p> */}
        </div>

        {/* Section 1: Heat Data from Vendor Call (with Color Code manual entry) */}
        <HeatNumberDetails heats={activeHeats} onHeatsChange={handleHeatsUpdate} />

        {/* Section 2: Cumulative Data Summary - Single Row */}
        <div style={{ marginTop: '24px', padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#166534' }}>
            📊 Cumulative Data Summary
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
            {/* Total Heats Offered */}
            <div style={{ flex: '1 1 140px', minWidth: '120px' }}>
              <label className="rm-form-label" style={{ fontSize: '12px' }}>Total Heats Offered</label>
              <input type="text" className="rm-form-input" value={numberOfHeats || ''} disabled style={{ height: '38px' }} />
            </div>

            {/* Total Qty Offered */}
            <div style={{ flex: '1 1 140px', minWidth: '120px' }}>
              <label className="rm-form-label" style={{ fontSize: '12px' }}>Total Qty Offered (MT)</label>
              <input type="text" className="rm-form-input" value={totalQuantity || ''} disabled style={{ height: '38px' }} />
            </div>

            {/* No. of Bundles */}
            <div style={{ flex: '1 1 140px', minWidth: '120px' }}>
              <label className="rm-form-label required" style={{ fontSize: '12px' }}>No. of Bundles</label>
              <input
                type="number"
                className="rm-form-input"
                value={numberOfBundles || ''}
                onChange={(e) => setNumberOfBundles(e.target.value)}
                placeholder="Enter"
                style={{ backgroundColor: '#ffffff', height: '38px' }}
                required
              />
            </div>

            {/* No. of ERC */}
            <div style={{ flex: '1 1 140px', minWidth: '120px' }}>
              <label className="rm-form-label" style={{ fontSize: '12px' }}>No. of ERC (Finished)</label>
              <input type="text" className="rm-form-input" value={numberOfERC.toLocaleString()} disabled style={{ height: '38px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Sub Module Session */}
      <div className="submodule-session">
        <div className="submodule-session-header">
          <h3 className="submodule-session-title">📋 Sub Module Session</h3>
          <p className="submodule-session-subtitle">Select a module to proceed with inspection</p>
        </div>
        <div className="submodule-buttons">
          <button className="submodule-btn" onClick={() => onNavigateToSubModule('calibration-documents')}>
            <span className="submodule-btn-icon">📄</span>
            <p className="submodule-btn-title">Calibration & Documents</p>
            <p className="submodule-btn-desc">Verify instrument calibration</p>
          </button>
          <button className="submodule-btn" onClick={() => onNavigateToSubModule('visual-inspection')}>
            <span className="submodule-btn-icon">👁️</span>
            <p className="submodule-btn-title">Visual Inspection</p>
            <p className="submodule-btn-desc">Visual check & defects</p>
          </button>
          <button className="submodule-btn" onClick={() => onNavigateToSubModule('dimensional-check')}>
            <span className="submodule-btn-icon">📐</span>
            <p className="submodule-btn-title">Dimensional Check</p>
            <p className="submodule-btn-desc">Check bar dimensions</p>
          </button>
          <button className="submodule-btn" onClick={() => onNavigateToSubModule('material-testing')}>
            <span className="submodule-btn-icon">🧪</span>
            <p className="submodule-btn-title">Material Testing</p>
            <p className="submodule-btn-desc">Chemical & mechanical tests</p>
          </button>
          <button className="submodule-btn" onClick={() => onNavigateToSubModule('packing-storage')}>
            <span className="submodule-btn-icon">📦</span>
            <p className="submodule-btn-title">Packing & Storage</p>
            <p className="submodule-btn-desc">Verify packing conditions</p>
          </button>
          <button className="submodule-btn" onClick={() => onNavigateToSubModule('summary-reports')}>
            <span className="submodule-btn-icon">📊</span>
            <p className="submodule-btn-title">Summary and Reports</p>
            <p className="submodule-btn-desc">View consolidated results</p>
          </button>
        </div>
      </div>

      {/* Post Inspection Session - Always visible at bottom of page */}
      <div className="card" style={{ marginTop: '32px', borderTop: '4px solid var(--color-primary)' }}>
        {/* <div className="card-header rm-card-header" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
          <h3 className="card-title rm-card-title" style={{ fontSize: '20px', color: '#0369a1' }}>🔍 Post Inspection Session</h3>
          <p className="card-subtitle" style={{ color: '#0284c7' }}>Final results and decision for the inspection</p>
        </div> */}

        {/* Final Results - Raw Material - One Block Per Heat */}
        <div style={{ marginBottom: '24px' }}>
          {/* Info Banner */}
          {/* <div style={{
            padding: '12px 16px',
            marginBottom: '16px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#1e40af',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>ℹ️</span>
            <div>
              <strong>Status Logic:</strong> Each section shows <strong style={{ color: '#92400e' }}>Pending</strong> until all required fields are filled (remarks excluded).
              Once complete, status changes to <strong style={{ color: '#166534' }}>OK</strong> (all values pass) or <strong style={{ color: '#991b1b' }}>NOT OK</strong> (any value fails).
              Hover over pending badges for details.
            </div>
          </div> */}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Final Inspection Results</h4>

            {/* Refresh Status Button
            <button
              onClick={() => {
                // Manually trigger status recomputation
                const event = new Event('rm:statusRefresh');
                window.dispatchEvent(event);
              }}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#0369a1',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#e0f2fe';
                e.target.style.borderColor = '#7dd3fc';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#f0f9ff';
                e.target.style.borderColor = '#bae6fd';
              }}
            >
              <span style={{ fontSize: '14px' }}>🔄</span>
              Refresh Status
            </button> */}

            {/* Overall Status Badge */}
            {(() => {
              // Calculate statuses for all heats
              const heatResults = consolidatedHeats.map((heat, heatIndex) => {
                const heatNo = heat.heatNo || heat.heat_no;
                const heatStatuses = heatSubmoduleStatuses[heatNo] || {
                  calibration: 'Pending',
                  visual: 'Pending',
                  dimensional: 'Pending',
                  materialTest: 'Pending',
                  packing: 'Pending'
                };

                const dimensionalNotOk = heatStatuses.dimensional === 'NOT OK';
                const materialTestNotOk = heatStatuses.materialTest === 'NOT OK';
                const anyPending = Object.values(heatStatuses).some(s => s === 'Pending');

                if (anyPending) return 'PENDING';

                // Calculate accepted weight from visual inspection
                const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${call?.call_no}`;
                const visualRaw = localStorage.getItem(visualKey);
                const visualData = visualRaw ? JSON.parse(visualRaw) : [];
                const heatVisualData = Array.isArray(visualData) && heatIndex >= 0 ? visualData[heatIndex] : null;
                const totalRejectedWeight = calculateVisualRejectedWeight(heatVisualData);
                const offeredWeight = parseFloat(heat.weight) || 0;
                const acceptedWeight = offeredWeight - totalRejectedWeight;

                if (dimensionalNotOk || materialTestNotOk || acceptedWeight === 0) return 'REJECTED';
                if (acceptedWeight < offeredWeight) return 'PARTIALLY_ACCEPTED';
                return 'ACCEPTED';
              });

              const acceptedCount = heatResults.filter(s => s === 'ACCEPTED').length;
              const rejectedCount = heatResults.filter(s => s === 'REJECTED').length;
              const partialCount = heatResults.filter(s => s === 'PARTIALLY_ACCEPTED').length;
              const totalHeats = heatResults.length;

              let overallStatus = 'PENDING';
              let statusBg = '#fef3c7';
              let statusColor = '#92400e';
              let statusBorder = '#fcd34d';

              if (heatResults.some(s => s === 'PENDING')) {
                overallStatus = 'PENDING';
              } else if (acceptedCount === totalHeats && totalHeats > 0) {
                overallStatus = 'ACCEPTED';
                statusBg = '#dcfce7';
                statusColor = '#166534';
                statusBorder = '#86efac';
              } else if (rejectedCount === totalHeats && totalHeats > 0) {
                overallStatus = 'REJECTED';
                statusBg = '#fee2e2';
                statusColor = '#991b1b';
                statusBorder = '#fca5a5';
              } else if (totalHeats > 0) {
                overallStatus = 'PARTIALLY ACCEPTED';
                statusBg = '#fef3c7';
                statusColor = '#92400e';
                statusBorder = '#fcd34d';
              }

              return (
                <div style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  background: statusBg,
                  color: statusColor,
                  border: `2px solid ${statusBorder}`
                }}>
                  Overall Status: {overallStatus} ({acceptedCount} Accepted, {partialCount} Partial, {rejectedCount} Rejected)
                </div>
              );
            })()}
          </div>

          {/* Heat Blocks - Each unique heat has its own section with status tags (consolidated) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {consolidatedHeats.map((heat, heatIndex) => {
              const heatNo = heat.heatNo || heat.heat_no || 'Unknown';
              const heatStatuses = heatSubmoduleStatuses[heatNo] || {
                calibration: 'Pending',
                visual: 'Pending',
                dimensional: 'Pending',
                materialTest: 'Pending',
                packing: 'Pending'
              };

              // Determine overall heat status
              const dimensionalNotOk = heatStatuses.dimensional === 'NOT OK';
              const materialTestNotOk = heatStatuses.materialTest === 'NOT OK';
              const anyPending = Object.values(heatStatuses).some(s => s === 'Pending');

              // Calculate accepted weight to determine if partial rejection occurred
              const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${call?.call_no}`;
              const visualRaw = localStorage.getItem(visualKey);
              const visualData = visualRaw ? JSON.parse(visualRaw) : [];
              const heatVisualData = Array.isArray(visualData) && heatIndex >= 0 ? visualData[heatIndex] : null;
              const totalRejectedWeight = calculateVisualRejectedWeight(heatVisualData);
              const offeredWeight = parseFloat(heat.weight) || 0;
              const acceptedWeight = offeredWeight - totalRejectedWeight;

              let isAccepted = false;
              let isPartiallyAccepted = false;
              let isRejected = false;
              let isPending = anyPending;

              if (!isPending) {
                if (dimensionalNotOk || materialTestNotOk || acceptedWeight === 0) {
                  isRejected = true;
                } else if (acceptedWeight < offeredWeight) {
                  isPartiallyAccepted = true;
                } else {
                  isAccepted = true;
                }
              }

              // Container styling based on status
              const containerBg = isRejected ? '#fef2f2' : (isAccepted || isPartiallyAccepted) ? '#f0fdf4' : '#fffbeb';
              const containerBorder = isRejected ? '#fecaca' : (isAccepted || isPartiallyAccepted) ? '#bbf7d0' : '#fde68a';

              return (
                <div
                  key={heatNo}
                  style={{
                    background: containerBg,
                    border: `1px solid ${containerBorder}`,
                    borderRadius: '8px',
                    padding: '16px'
                  }}
                >
                  {/* Submodule Status Tags Row with Overall Status */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginBottom: '16px',
                    alignItems: 'center'
                  }}>
                    {/* Submodule Status Tags */}
                    {[
                      { key: 'calibration', label: 'Calibration', tooltip: 'Fill all chemical composition fields (C, Si, Mn, P, S)' },
                      { key: 'visual', label: 'Visual', tooltip: 'Select defect option and fill counts/lengths for selected defects' },
                      { key: 'dimensional', label: 'Dimensional', tooltip: 'Fill all 20 samples (Automatically marks NOT OK if 3+ defects found)' },
                      { key: 'materialTest', label: 'Material Test', tooltip: 'Fill all fields for all samples (C, Si, Mn, P, S, Grain Size, Decarb, Inclusions, Hardness)' },
                      { key: 'packing', label: 'Packing', tooltip: 'Answer all checklist items (Yes/No)' }
                    ].map(({ key, label, tooltip }) => {
                      const status = heatStatuses[key];
                      const isOk = status === 'OK';
                      const isNotOk = status === 'NOT OK';
                      const isPending = status === 'Pending';
                      const isPass = status === 'Pass';

                      return (
                        <span
                          key={key}
                          title={isPending ? `${tooltip} to enable Accept/Reject` : `${label}: ${status}`}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 500,
                            background: isPass ? '#dcfce7' : isOk ? '#dcfce7' : isNotOk ? '#fee2e2' : '#fef3c7',
                            color: isPass ? '#166534' : isOk ? '#166534' : isNotOk ? '#991b1b' : '#92400e',
                            border: `1px solid ${isPass ? '#86efac' : isOk ? '#86efac' : isNotOk ? '#fca5a5' : '#fcd34d'}`,
                            cursor: isPending ? 'help' : 'default'
                          }}
                        >
                          {label}: {status}
                        </span>
                      );
                    })}

                    {/* Overall Status Tag - at the end */}
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: isRejected ? '#fee2e2' : isPartiallyAccepted ? '#fef3c7' : isAccepted ? '#dcfce7' : '#fef3c7',
                        color: isRejected ? '#991b1b' : isPartiallyAccepted ? '#92400e' : isAccepted ? '#166534' : '#92400e',
                        border: `1px solid ${isRejected ? '#fca5a5' : isPartiallyAccepted ? '#fcd34d' : isAccepted ? '#86efac' : '#fcd34d'}`,
                        marginLeft: 'auto'
                      }}
                    >
                      Overall Status: {isRejected ? 'REJECTED' : isPartiallyAccepted ? 'PARTIALLY ACCEPTED' : isAccepted ? 'ACCEPTED' : 'PENDING'}
                    </span>
                  </div>

                  {/* Heat Details Row - Single Row Layout */}
                  <div
                    className="heat-details-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: '12px',
                      alignItems: 'end'
                    }}
                  >
                    {/* Heat No. */}
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Heat No.</span>
                      <strong style={{ fontSize: '14px', color: '#1e293b' }}>{heatNo}</strong>
                    </div>

                    {/* Status */}
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Status</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 600,
                          background: isRejected ? '#fee2e2' : (isAccepted || isPartiallyAccepted) ? '#dcfce7' : '#fef3c7',
                          color: isRejected ? '#991b1b' : (isAccepted || isPartiallyAccepted) ? '#166534' : '#92400e'
                        }}>
                          {isRejected ? 'Invalid' : (isAccepted || isPartiallyAccepted) ? 'Valid' : 'Pending'}
                        </span>
                        <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>
                          {isRejected ? 'Rejected' : isPartiallyAccepted ? 'Partially Accepted' : isAccepted ? 'Accepted' : 'Pending'}
                        </span>
                      </span>
                    </div>

                    {/* Weight Offered */}
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Wt. Offered (Tons)</span>
                      <strong style={{ fontSize: '14px', color: '#1e293b' }}>{heat.weight || '—'}</strong>
                    </div>

                    {/* Accepted Qty */}
                    <div>
                      <span style={{ fontSize: '11px', color: '#0369a1', display: 'block', marginBottom: '4px' }}>Wt.Accepted Qty (Tons)</span>
                      <strong style={{ fontSize: '14px', color: '#0369a1' }}>
                        {(() => {
                          const callNo = call?.call_no;
                          if (!callNo) return '—';

                          const heatNo = heat.heatNo || heat.heat_no || 'Unknown';
                          const heatStatuses = heatSubmoduleStatuses[heatNo] || {
                            calibration: 'Pending',
                            visual: 'Pending',
                            dimensional: 'Pending',
                            materialTest: 'Pending',
                            packing: 'Pending'
                          };

                          const dimensionalNotOk = heatStatuses.dimensional === 'NOT OK';
                          const materialTestNotOk = heatStatuses.materialTest === 'NOT OK';
                          const anyPending = Object.values(heatStatuses).some(s => s === 'Pending');

                          // If Dimension or Material Testing is NOT OK, complete heat is rejected
                          if (dimensionalNotOk || materialTestNotOk) {
                            return '0';
                          }

                          // If any module is pending, accepted material is 0
                          if (anyPending) {
                            return '0';
                          }

                          // Calculate rejected weight from visual inspection
                          const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${callNo}`;
                          const visualRaw = localStorage.getItem(visualKey);
                          const visualData = visualRaw ? JSON.parse(visualRaw) : [];

                          // Use unique index from consolidated list
                          const heatVisualData = Array.isArray(visualData) && heatIndex >= 0 ? visualData[heatIndex] : null;
                          const totalRejectedWeight = calculateVisualRejectedWeight(heatVisualData);

                          const offeredTons = parseFloat(heat.weight) || 0;
                          const acceptedQty = offeredTons - totalRejectedWeight;
                          return acceptedQty.toFixed(6);
                        })()}
                      </strong>
                    </div>

                    {/* Weight Accepted */}
                    <div>
                      <span style={{ fontSize: '11px', color: '#16a34a', display: 'block', marginBottom: '4px' }}>Accepted Qty In Numbers</span>
                      <strong style={{ fontSize: '14px', color: '#16a34a' }}>
                        {(() => {
                          const callNo = call?.call_no;
                          if (!callNo) return '—';

                          const heatNo = heat.heatNo || heat.heat_no;
                          const heatStatuses = heatSubmoduleStatuses[heatNo] || {
                            calibration: 'Pending',
                            visual: 'Pending',
                            dimensional: 'Pending',
                            materialTest: 'Pending',
                            packing: 'Pending'
                          };

                          const dimensionalNotOk = heatStatuses.dimensional === 'NOT OK';
                          const materialTestNotOk = heatStatuses.materialTest === 'NOT OK';
                          const anyPending = Object.values(heatStatuses).some(s => s === 'Pending');

                          // If Dimension or Material Testing is NOT OK, complete heat is rejected
                          if (dimensionalNotOk || materialTestNotOk) {
                            return '0';
                          }

                          // If any module is pending, accepted material is 0
                          if (anyPending) {
                            return '0';
                          }

                          // Calculate rejected weight from visual inspection
                          const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${callNo}`;
                          const visualRaw = localStorage.getItem(visualKey);
                          const visualData = visualRaw ? JSON.parse(visualRaw) : [];

                          const heatVisualData = Array.isArray(visualData) && heatIndex >= 0 ? visualData[heatIndex] : null;
                          const totalRejectedWeight = calculateVisualRejectedWeight(heatVisualData);

                          // Calculate: Accepted Qty (Tons) = Offered Qty - Rejected Weight
                          const offeredTons = parseFloat(heat.weight) || 0;
                          const acceptedQtyTons = offeredTons - totalRejectedWeight;

                          // Calculate: Wt. Accepted (Numbers) = Accepted Qty (Tons) * 1000 / 1.15
                          const wtAcceptedNumbers = (acceptedQtyTons * 1000) / 1.15;

                          // Return without decimals
                          return Math.floor(wtAcceptedNumbers);
                        })()}
                      </strong>
                    </div>

                    {/* Weight Rejected */}
                    <div>
                      <span style={{ fontSize: '11px', color: '#dc2626', display: 'block', marginBottom: '4px' }}>Wt. Rejected (Tons)</span>
                      <strong style={{ fontSize: '14px', color: '#dc2626' }}>
                        {(() => {
                          const callNo = call?.call_no;
                          if (!callNo) return '0';

                          const heatNo = heat.heatNo || heat.heat_no || 'Unknown';
                          const heatStatuses = heatSubmoduleStatuses[heatNo] || {
                            calibration: 'Pending',
                            visual: 'Pending',
                            dimensional: 'Pending',
                            materialTest: 'Pending',
                            packing: 'Pending'
                          };

                          const dimensionalNotOk = heatStatuses.dimensional === 'NOT OK';
                          const materialTestNotOk = heatStatuses.materialTest === 'NOT OK';

                          // If Dimension or Material Testing is NOT OK, complete heat is rejected
                          if (dimensionalNotOk || materialTestNotOk) {
                            const offeredTons = parseFloat(heat.weight) || 0;
                            return offeredTons.toFixed(6);
                          }

                          // Otherwise, calculate rejected weight from visual inspection
                          const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${callNo}`;
                          const visualRaw = localStorage.getItem(visualKey);
                          const visualData = visualRaw ? JSON.parse(visualRaw) : [];

                          const heatVisualData = Array.isArray(visualData) && heatIndex >= 0 ? visualData[heatIndex] : null;
                          const totalRejectedWeight = calculateVisualRejectedWeight(heatVisualData);

                          // Show calculated rejected weight from visual defects
                          if (totalRejectedWeight > 0) {
                            return totalRejectedWeight.toFixed(6);
                          }
                          return '0';
                        })()}
                      </strong>
                    </div>

                    {/* Remarks */}
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Remarks (Required)</span>
                      <input
                        type="text"
                        className="rm-form-input"
                        placeholder="Enter remarks..."
                        value={heatRemarks[heat.heatNo] || ''}
                        onChange={(e) => setHeatRemarks(prev => ({ ...prev, [heat.heatNo]: e.target.value }))}
                        required
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', fontSize: '13px', height: '32px' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Responsive styles for heat details grid */}
          <style>{`
            @media (max-width: 1024px) {
              .heat-details-grid {
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 16px !important;
              }
            }
            @media (max-width: 768px) {
              .heat-details-grid {
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 12px !important;
              }
            }
            @media (max-width: 480px) {
              .heat-details-grid {
                grid-template-columns: 1fr 1fr !important;
                gap: 10px !important;
              }
            }
          `}</style>
        </div>

        {/* Action Buttons */}
        <div className="rm-action-buttons" style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '24px' }}>
          <button
            className="btn btn-outline"
            style={{
              minHeight: '44px',
              padding: '10px 20px',
              backgroundColor: isSavingDraft ? '#f3f4f6' : '#fff',
              cursor: isSavingDraft ? 'not-allowed' : 'pointer'
            }}
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
          >
            {isSavingDraft ? '💾 Saving...' : '💾 Save Draft'}
          </button>
          <button
            className="btn btn-outline"
            onClick={handlePauseClick}
            disabled={isSaving}
          >
            {isSaving ? 'Pausing...' : 'Pause Inspection'}
          </button>
          <button className="btn btn-outline" onClick={handleOpenWithheldModal}>Withheld Inspection</button>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              className="btn btn-primary"
              onClick={handleFinishClick}
              disabled={isSaving || !canFinishInspectionState.canFinish}
              style={{
                opacity: (!canFinishInspectionState.canFinish && !isSaving) ? 0.6 : 1,
                cursor: (!canFinishInspectionState.canFinish && !isSaving) ? 'not-allowed' : 'pointer'
              }}
              title={!canFinishInspectionState.canFinish ? canFinishInspectionState.reason : ''}
            >
              {isSaving ? 'Saving...' : 'Finish Inspection'}
            </button>
            {!canFinishInspectionState.canFinish && !isSaving && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: '8px',
                padding: '8px 12px',
                backgroundColor: '#1e293b',
                color: '#fff',
                borderRadius: '6px',
                fontSize: '12px',
                maxWidth: '300px',
                whiteSpace: 'normal',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                zIndex: 1000,
                pointerEvents: 'none',
                opacity: 0,
                transition: 'opacity 0.2s',
                display: 'none'
              }}
                className="finish-button-tooltip"
              >
                {canFinishInspectionState.reason}
              </div>
            )}
          </div>
        </div>
        <style>{`
          .btn-primary:disabled:hover + .finish-button-tooltip,
          .btn-primary:disabled:focus + .finish-button-tooltip {
            opacity: 1 !important;
            display: block !important;
          }
        `}</style>
      </div>

      <div className="rm-action-buttons" style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
        <button className="rm-back-button" onClick={onBack} style={{ maxWidth: '300px' }}>
          ← Return to Landing Page
        </button>
      </div>

      {/* Withheld Modal */}
      {showWithheldModal && (
        <div className="modal-overlay" onClick={handleCloseWithheldModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Withheld Inspection</h3>
              <button className="modal-close" onClick={handleCloseWithheldModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Reason <span className="required">*</span></label>
                <select
                  className="modal-select"
                  value={withheldReason || ''}
                  onChange={(e) => { setWithheldReason(e.target.value); setWithheldError(''); }}
                >
                  <option value="">-- Select Reason --</option>
                  {WITHHELD_REASONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {withheldReason === 'ANY_OTHER' && (
                <div className="modal-field">
                  <label className="modal-label">Remarks <span className="required">*</span></label>
                  <textarea
                    className="modal-textarea"
                    placeholder="Please provide details..."
                    value={withheldRemarks || ''}
                    onChange={(e) => { setWithheldRemarks(e.target.value); setWithheldError(''); }}
                  />
                </div>
              )}

              {withheldError && <div className="modal-error">{withheldError}</div>}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary modal-actions__btn" onClick={handleCloseWithheldModal} disabled={isSaving}>
                Cancel
              </button>
              <button type="button" className="btn btn-warning modal-actions__btn" onClick={handleSubmitWithheld} disabled={isSaving}>
                {isSaving ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspection Result Modal (for pause, finish, draft save) */}
      <InspectionResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        actionType={resultModalConfig.actionType}
        callNumber={resultModalConfig.callNumber}
        message={resultModalConfig.message}
        additionalInfo={resultModalConfig.additionalInfo}
      />

      {/* Confirmation Modal (for pause/finish confirmation) */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setShowConfirmModal(false)}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        cancelText={confirmModalConfig.cancelText}
        isDangerous={confirmModalConfig.isDangerous}
        callNumber={confirmModalConfig.callNumber}
      />
    </div>
  );
};

export default RawMaterialDashboard;
