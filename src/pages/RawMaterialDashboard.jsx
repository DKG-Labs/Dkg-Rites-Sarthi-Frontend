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
import { normalizeErcType } from '../utils/ercUtils';
import './RawMaterialDashboard.css';

// Helper to get divisor for ERC type weight calculation
const getErcDivisor = (modelName) => {
  if (!modelName) return 1.133; // Default
  const normalizedModel = String(modelName).toUpperCase().replace(/\s+/g, '');
  if (normalizedModel.includes('MK-III') || normalizedModel.includes('MKIII')) return 0.928426;
  if (normalizedModel.includes('MK-V') || normalizedModel.includes('MKV')) return 1.133;
  if (normalizedModel.includes('J-TYPE') || normalizedModel.includes('JTYPE') || normalizedModel.includes('ERC-J') || normalizedModel === 'J') return 0.928;
  return 1.133; // Default fallback
};


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

// Helper to get current shift from sessionStorage for shift-specific storage
const getShiftSuffix = () => {
  const shift = sessionStorage.getItem('inspectionShift');
  return shift ? `_${shift}` : '';
};

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
  // Use lazy initializers to restore from localStorage synchronously on first render
  const [sourceOfRawMaterial, setSourceOfRawMaterial] = useState(() => {
    try {
      const callNo = call?.call_no;
      if (!callNo) return '';
      const saved = localStorage.getItem(`${STORAGE_KEYS.MAIN_INSPECTION}_${callNo}${getShiftSuffix()}`);
      return saved ? (JSON.parse(saved).sourceOfRawMaterial || '') : '';
    } catch { return ''; }
  });
  const [numberOfBundles, setNumberOfBundles] = useState(() => {
    try {
      const callNo = call?.call_no;
      if (!callNo) return '';
      const saved = localStorage.getItem(`${STORAGE_KEYS.MAIN_INSPECTION}_${callNo}${getShiftSuffix()}`);
      return saved ? (JSON.parse(saved).numberOfBundles || '') : '';
    } catch { return ''; }
  });
  // Per-heat remarks: { heatNo: 'remark text', ... }
  const [heatRemarks, setHeatRemarks] = useState(() => {
    try {
      const callNo = call?.call_no;
      if (!callNo) return {};
      const saved = localStorage.getItem(`${STORAGE_KEYS.MAIN_INSPECTION}_${callNo}${getShiftSuffix()}`);
      return saved ? (JSON.parse(saved).heatRemarks || {}) : {};
    } catch { return {}; }
  });

  const [heatSealingType, setHeatSealingType] = useState(() => {
    try {
      const callNo = call?.call_no;
      if (!callNo) return {};
      const saved = localStorage.getItem(`${STORAGE_KEYS.MAIN_INSPECTION}_${callNo}${getShiftSuffix()}`);
      return saved ? (JSON.parse(saved).heatSealingType || {}) : {};
    } catch { return {}; }
  });

  // Helpers to check if submodule data is essentially empty
  const isVisualDataEmpty = useCallback((data) => {
    if (!data || !Array.isArray(data)) return true;
    return data.every(heat => !heat.selectedDefects || Object.keys(heat.selectedDefects).length === 0);
  }, []);

  const isDimDataEmpty = useCallback((data) => {
    if (!data || !data.heatDimData || !Array.isArray(data.heatDimData)) return true;
    return data.heatDimData.every(heat => !heat.dimSamples || heat.dimSamples.every(s => !s?.diameter));
  }, []);

  const isMaterialDataEmpty = useCallback((data) => {
    if (!data || !data.materialData || !Array.isArray(data.materialData)) return true;
    return data.materialData.every(heat =>
      !heat.samples || heat.samples.every(sample =>
        !sample.c && !sample.si && !sample.mn && !sample.p && !sample.s &&
        !sample.grainSize && !sample.hardness && !sample.decarb &&
        !sample.inclA && !sample.inclB && !sample.inclC && !sample.inclD
      )
    );
  }, []);

  const isPackingDataEmpty = useCallback((data) => {
    if (!data || !data.packingDataByHeat) return true;
    const heats = Object.values(data.packingDataByHeat);
    if (heats.length === 0) return true;
    // Check if ALL heats have empty values for all fields
    return heats.every(h =>
      !h.storedHeatWise && !h.suppliedInBundles && !h.heatNumberEnds &&
      !h.packingStripWidth && !h.bundleTiedLocations &&
      !h.identificationTagBundle && !h.metalTagInformation
    );
  }, []);

  const isCalibrationDataEmpty = useCallback((data) => {
    if (!data) return true;
    // Check if it's just the default data or empty
    const isDefaultRDSO = !data.rdsoApprovalValidity || data.rdsoApprovalValidity.approvalId === 'RDSO/2023/ERC-001';
    const hasNoLadle = !data.heats || data.heats.every(h => !h.percentC && !h.percentSi && !h.percentMn && !h.percentP && !h.percentS);
    const hasNoGauges = !data.gaugesAvailable;
    return isDefaultRDSO && hasNoLadle && hasNoGauges;
  }, []);

  // Per-heat steel stamp number: { heatNo: 'stamp text', ... }
  const [heatSteelStampNumber, setHeatSteelStampNumber] = useState(() => {
    try {
      const callNo = call?.call_no;
      if (!callNo) return {};
      const saved = localStorage.getItem(`${STORAGE_KEYS.MAIN_INSPECTION}_${callNo}`);
      return saved ? (JSON.parse(saved).heatSteelStampNumber || {}) : {};
    } catch { return {}; }
  });

  // Per-heat hologram entries: { heatNo: [{type, from, to, value}, ...], ... }
  const [heatHologramEntries, setHeatHologramEntries] = useState(() => {
    try {
      const callNo = call?.call_no;
      if (!callNo) return {};
      const saved = localStorage.getItem(`${STORAGE_KEYS.MAIN_INSPECTION}_${callNo}`);
      return saved ? (JSON.parse(saved).heatHologramEntries || {}) : {};
    } catch { return {}; }
  });

  // Handler for sealing type change - clears the other fields when toggled
  // Handler for sealing type change - now allows multiple selections
  const handleSealingTypeChange = useCallback((heatNo, toggledType) => {
    setHeatSealingType(prev => {
      const current = prev[heatNo] || '';
      const types = current ? current.split(',').map(s => s.trim()) : [];

      let newTypes;
      if (types.includes(toggledType)) {
        // Remove if already present
        newTypes = types.filter(t => t !== toggledType);
      } else {
        // Add if not present
        newTypes = [...types, toggledType];
      }

      return { ...prev, [heatNo]: newTypes.join(', ') };
    });
    // Removed clearing logic to allow both values to persist
  }, []);
  // Collapsible state for Pre-Inspection Data Entry card
  const [isPreInspectionExpanded, setIsPreInspectionExpanded] = useState(true);

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
      // Use rawPoNo if available (from pending list DTO), fallback to po_no
      const poNo = call?.rawPoNo || call?.po_no;
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
        const mainKey = `${STORAGE_KEYS.MAIN_INSPECTION}_${callNo}${getShiftSuffix()}`;
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
            manufacturer: response.vendorName,
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
            erc_type: response.ercType || null, // Type of ERC from Section B (MK-III, MK-V, etc.)
            rlyShortName: response.rlyShortName || response.rlyCd || '',
            poSerialNo: response.poSerialNo || ''
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
            const mainKey = `${STORAGE_KEYS.MAIN_INSPECTION}_${call?.call_no}${getShiftSuffix()}`;
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

            // Also restore numberOfBundles, sourceOfRawMaterial, heatRemarks, and sealing/hologram data from localStorage
            if (savedData) {
              try {
                const parsed = JSON.parse(savedData);
                if (parsed.numberOfBundles) setNumberOfBundles(parsed.numberOfBundles);
                if (parsed.sourceOfRawMaterial) setSourceOfRawMaterial(parsed.sourceOfRawMaterial);
                if (parsed.heatRemarks) setHeatRemarks(parsed.heatRemarks);
                if (parsed.heatSealingType) setHeatSealingType(parsed.heatSealingType);
                if (parsed.heatSteelStampNumber) setHeatSteelStampNumber(parsed.heatSteelStampNumber);
                if (parsed.heatHologramEntries) setHeatHologramEntries(parsed.heatHologramEntries);
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

  // Use fetched data from backend (stabilized)
  const poData = useMemo(() => (fetchedPoData || {}), [fetchedPoData]);

  // Use fetched heat data from backend
  const activeHeats = useMemo(() => {
    if (!fetchedHeatData) return [];
    return [...fetchedHeatData].sort((a, b) =>
      (a.heatNo || a.heat_no || '').toString().localeCompare((b.heatNo || b.heat_no || '').toString(), undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [fetchedHeatData]);

  // Determine product model/type from Type of ERC field or product name parsing
  const productModel = useMemo(() => {
    return normalizeErcType(poData.erc_type) ||
      normalizeErcType(poData.product_name || poData.po_description) ||
      normalizeErcType(poData.model) ||
      'MK-III';
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
          heatNo, // Ensure heatNo property is explicitly set
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

    // Return sorted array to ensure stable indexing across submodules
    return Array.from(heatMap.values()).sort((a, b) =>
      (a.heatNo || '').toString().localeCompare((b.heatNo || '').toString(), undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [activeHeats]);

  // Fetch and restore paused inspection data
  useEffect(() => {
    const restorePausedData = async () => {
      const callNo = call?.call_no;
      if (!callNo) return;

      try {
        if (!consolidatedHeats || consolidatedHeats.length === 0) {
          console.log('⏳ Waiting for consolidatedHeats before restoring paused data...');
          return;
        }

        console.log('🔄 Checking for paused inspection data for call:', callNo);
        const pausedData = await getInspectionDataByCallNo(callNo);
        if (!pausedData) return;

        console.log('✅ Found paused inspection data:', pausedData);
        let restoredAny = false;

        const parseHologramString = (str) => {
          if (!str) return [];
          return str.split(', ').map(entry => {
            if (entry.startsWith('Range: ')) {
              const parts = entry.replace('Range: ', '').split(' to ');
              return { type: 'range', from: parts[0] || '', to: parts[1] || '' };
            } else if (entry.startsWith('Single: ')) {
              return { type: 'single', value: entry.replace('Single: ', '') };
            }
            return null;
          }).filter(Boolean);
        };

        // 1. Restore Visual Inspection - Per Heat Merge (Prioritize Heat Number)
        if (pausedData.visualInspectionData?.length > 0) {
          const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${callNo}${getShiftSuffix()}`;
          const existingRaw = localStorage.getItem(visualKey);
          let visualDataMap = existingRaw ? JSON.parse(existingRaw) : {};
          // Support migration from old array format
          if (Array.isArray(visualDataMap)) visualDataMap = {};

          let visualRestored = false;
          pausedData.visualInspectionData.forEach((item) => {
            const hNo = (item.heatNo || '').toString().trim().toUpperCase();
            if (!hNo) return;

            // STRICT Match by Heat Number
            const exists = consolidatedHeats.some(h =>
              (h.heatNo || h.heat_no || '').toString().trim().toUpperCase() === hNo
            );

            if (!exists) {
              console.warn(`[Visual Restoration] Could not match backend heat ${hNo} to current heats.`);
              return;
            }

            const localHeat = visualDataMap[hNo];
            const isLocalEmpty = !localHeat || (
              (!localHeat.selectedDefects || Object.keys(localHeat.selectedDefects).length === 0) &&
              (!localHeat.defectCounts || Object.keys(localHeat.defectCounts).length === 0)
            );

            if (isLocalEmpty) {
              const selectedDefects = {}; const defectCounts = {};
              if (item.defects) Object.entries(item.defects).forEach(([k, v]) => { if (v) selectedDefects[k] = true; });
              if (item.defectLengths) Object.entries(item.defectLengths).forEach(([k, v]) => { if (v != null) defectCounts[k] = v; });

              visualDataMap[hNo] = { selectedDefects, defectCounts };
              visualRestored = true;
            }
          });

          if (visualRestored) {
            localStorage.setItem(visualKey, JSON.stringify(visualDataMap));
            restoredAny = true;
          }
        }

        // 2. Restore Dimensional Check - Per Heat Merge (Prioritize Heat Number)
        if (pausedData.dimensionalCheckData?.length > 0) {
          const dimKey = `${STORAGE_KEYS.DIMENSIONAL_CHECK}_${callNo}${getShiftSuffix()}`;
          const existingRaw = localStorage.getItem(dimKey);
          const existingData = existingRaw ? JSON.parse(existingRaw) : { heatDimData: {} };
          let heatDimDataMap = existingData.heatDimData || {};
          // Support migration from old array format
          if (Array.isArray(heatDimDataMap)) heatDimDataMap = {};

          let dimRestored = false;
          pausedData.dimensionalCheckData.forEach(item => {
            const hNo = (item.heatNo || '').toString().trim().toUpperCase();
            if (!hNo) return;

            const hIdx = consolidatedHeats.findIndex(h =>
              (h.heatNo || h.heat_no || '').toString().trim().toUpperCase() === hNo
            );

            if (hIdx === -1) {
              console.warn(`[Dimensional Restoration] Could not match backend heat ${hNo} to current heats.`);
              return;
            }

            const localHeat = heatDimDataMap[hNo];
            const isLocalEmpty = !localHeat || !localHeat.dimSamples || localHeat.dimSamples.every(s => !s || s.diameter == null);

            if (isLocalEmpty) {
              heatDimDataMap[hNo] = {
                heatNo: item.heatNo,
                heatIndex: hIdx,
                dimSamples: (item.sampleDiameters || []).map(d => d != null ? { diameter: d } : null)
              };
              dimRestored = true;
            }
          });

          if (dimRestored) {
            localStorage.setItem(dimKey, JSON.stringify({ heatDimData: heatDimDataMap }));
            restoredAny = true;
          }
        }

        // 3. Restore Material Testing - Per Heat Merge (Prioritize Heat Number)
        if (pausedData.materialTestingData?.length > 0) {
          const matKey = `${STORAGE_KEYS.MATERIAL_TESTING}_${callNo}${getShiftSuffix()}`;
          const existingRaw = localStorage.getItem(matKey);
          const existingData = existingRaw ? JSON.parse(existingRaw) : { materialData: {} };
          let materialDataMap = existingData.materialData || {};
          // Support migration from old array format
          if (Array.isArray(materialDataMap)) materialDataMap = {};

          let matRestored = false;
          pausedData.materialTestingData.forEach(item => {
            const hNo = (item.heatNo || '').toString().trim().toUpperCase();
            if (!hNo) return;

            const exists = consolidatedHeats.some(h =>
              (h.heatNo || h.heat_no || '').toString().trim().toUpperCase() === hNo
            );

            if (!exists) {
              console.warn(`[Material Restoration] Could not match backend heat ${hNo} to current heats.`);
              return;
            }

            if (!materialDataMap[hNo]) materialDataMap[hNo] = { samples: [] };
            
            const sampleIdx = item.sampleNumber - 1;
            const currentSample = materialDataMap[hNo].samples[sampleIdx];
            
            // Only restore if this sample is empty
            const isSampleEmpty = !currentSample || Object.values(currentSample).every(v => !v);

            if (isSampleEmpty) {
              materialDataMap[hNo].samples[sampleIdx] = {
                c: item.carbonPercent, si: item.siliconPercent, mn: item.manganesePercent,
                p: item.phosphorusPercent, s: item.sulphurPercent, grainSize: item.grainSize,
                hardness: item.hardnessHrc, decarb: item.decarbDepthMm,
                inclTypeA: item.inclusionTypeA, inclA: item.inclusionA,
                inclTypeB: item.inclusionTypeB, inclB: item.inclusionB,
                inclTypeC: item.inclusionTypeC, inclC: item.inclusionC,
                inclTypeD: item.inclusionTypeD, inclD: item.inclusionD,
                remarks: item.remarks
              };
              matRestored = true;
            }
          });

          if (matRestored) {
            localStorage.setItem(matKey, JSON.stringify({ materialData: materialDataMap }));
            restoredAny = true;
          }
        }

        // 4. Restore Packing & Storage - Per Heat Merge (Prioritize Heat Number)
        if (pausedData.packingStorageData?.length > 0) {
          const packKey = `${STORAGE_KEYS.PACKING_STORAGE}_${callNo}${getShiftSuffix()}`;
          const existingRaw = localStorage.getItem(packKey);
          const existingData = existingRaw ? JSON.parse(existingRaw) : { packingDataByHeat: {} };
          const packByHeat = { ...existingData.packingDataByHeat };

          let packRestored = false;
          pausedData.packingStorageData.forEach(item => {
            const hNo = (item.heatNo || '').toString().trim().toUpperCase();
            if (!hNo) return;

            // STRICT Match by Heat Number
            const exists = consolidatedHeats.some(h =>
              (h.heatNo || h.heat_no || '').toString().trim().toUpperCase() === hNo
            );

            if (!exists) {
              console.warn(`[Packing Restoration] Could not match backend heat ${hNo} to current heats.`);
              return;
            }

            const currentHeatLocal = packByHeat[hNo];
            // Only restore if local data for THIS heat is empty
            const isLocalEmpty = !currentHeatLocal || (
              !currentHeatLocal.storedHeatWise && !currentHeatLocal.suppliedInBundles &&
              !currentHeatLocal.heatNumberEnds && !currentHeatLocal.packingStripWidth &&
              !currentHeatLocal.bundleTiedLocations && !currentHeatLocal.identificationTagBundle &&
              !currentHeatLocal.metalTagInformation
            );

            if (isLocalEmpty) {
              packByHeat[hNo] = {
                storedHeatWise: item.storedHeatWise, suppliedInBundles: item.suppliedInBundles,
                heatNumberEnds: item.heatNumberEnds, packingStripWidth: item.packingStripWidth,
                bundleTiedLocations: item.bundleTiedLocations, identificationTagBundle: item.identificationTagBundle,
                metalTagInformation: item.metalTagInformation, remarks: item.remarks
              };
              packRestored = true;
            }
          });

          if (packRestored) {
            localStorage.setItem(packKey, JSON.stringify({ packingDataByHeat: packByHeat }));
            restoredAny = true;
          }
        }

        // 5. Restore Calibration
        if (pausedData.calibrationDocumentsData?.length > 0) {
          const calKey = `${STORAGE_KEYS.CALIBRATION}_${callNo}${getShiftSuffix()}`;
          const existingRaw = localStorage.getItem(calKey);
          const existingData = existingRaw ? JSON.parse(existingRaw) : null;
          if (!existingData || isCalibrationDataEmpty(existingData)) {
            const calData = {
              heats: consolidatedHeats.map(h => {
                const hNo = (h.heatNo || h.heat_no || '').toString().trim().toUpperCase();
                const backendItem = pausedData.calibrationDocumentsData.find(item =>
                  (item.heatNo || '').toString().trim().toUpperCase() === hNo
                );

                if (backendItem) {
                  return {
                    heatNo: hNo,
                    percentC: backendItem.ladleCarbonPercent,
                    percentSi: backendItem.ladleSiliconPercent,
                    percentMn: backendItem.ladleManganesePercent,
                    percentP: backendItem.ladlePhosphorusPercent,
                    percentS: backendItem.ladleSulphurPercent
                  };
                }
                return { heatNo: hNo, percentC: null, percentSi: null, percentMn: null, percentP: null, percentS: null };
              }),
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
            restoredAny = true;
          }
        }

        // 6. Restore Pre-Inspection
        if (pausedData.preInspectionData) {
          const mainKey = `${STORAGE_KEYS.MAIN_INSPECTION}_${callNo}${getShiftSuffix()}`;
          const existingRaw = localStorage.getItem(mainKey);
          const existingData = existingRaw ? JSON.parse(existingRaw) : {};
          if (!existingData.numberOfBundles || !existingData.sourceOfRawMaterial) {
            const updatedData = {
              ...existingData,
              numberOfBundles: existingData.numberOfBundles || pausedData.preInspectionData.numberOfBundles,
              sourceOfRawMaterial: existingData.sourceOfRawMaterial || pausedData.preInspectionData.sourceOfRawMaterial
            };
            localStorage.setItem(mainKey, JSON.stringify(updatedData));
            setNumberOfBundles(updatedData.numberOfBundles);
            setSourceOfRawMaterial(updatedData.sourceOfRawMaterial);
            restoredAny = true;
          }
        }

        // 7. Restore Final Results (Remarks, Sealing)
        if (pausedData.heatFinalResults?.length > 0) {
          const mainKey = `${STORAGE_KEYS.MAIN_INSPECTION}_${callNo}${getShiftSuffix()}`;
          const mainData = localStorage.getItem(mainKey);
          const existingData = mainData ? JSON.parse(mainData) : {};
          const remarksMap = { ...existingData.heatRemarks };
          const sealingTypeMap = { ...existingData.heatSealingType };
          const steelStampMap = { ...existingData.heatSteelStampNumber };
          const hologramsMap = { ...existingData.heatHologramEntries };

          pausedData.heatFinalResults.forEach(res => {
            const hNo = res.heatNo;
            if (res.remarks && !remarksMap[hNo]) remarksMap[hNo] = res.remarks;
            if (res.sealingType && !sealingTypeMap[hNo]) sealingTypeMap[hNo] = res.sealingType;
            if (res.steelStampNumber && !steelStampMap[hNo]) steelStampMap[hNo] = res.steelStampNumber;
            if (res.hologramDetails && (!hologramsMap[hNo] || hologramsMap[hNo].length === 0)) {
              hologramsMap[hNo] = parseHologramString(res.hologramDetails);
            }
          });
          setHeatRemarks(remarksMap);
          setHeatSealingType(sealingTypeMap);
          setHeatSteelStampNumber(steelStampMap);
          setHeatHologramEntries(hologramsMap);
          restoredAny = true;
        }

        if (restoredAny) {
          console.log('✅ Some paused data restored to localStorage');
          window.dispatchEvent(new Event('focus'));
        }
      } catch (e) {
        console.log('ℹ️ No paused data found:', e.message);
      }
    };
    restorePausedData();
  }, [call?.call_no, isVisualDataEmpty, isDimDataEmpty, isMaterialDataEmpty, isPackingDataEmpty, isCalibrationDataEmpty, consolidatedHeats]);


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
   * ERC-J:  Weight * 1000 / 0.928 (weight per clip in MT)
   * MK-III: Weight / 0.000092 (weight per clip in MT)
   */
  const numberOfERC = useMemo(() => {
    const weightMT = parseFloat(totalQuantity) || 0;
    if (productModel === 'MK-V') {
      return Math.floor(weightMT / 0.00114);
    } else if (productModel === 'ERC-J') {
      return Math.floor((weightMT * 1000) / 0.928);
    } else {
      // MK-III
      return Math.floor(weightMT / 0.000092);
    }
  }, [totalQuantity, productModel]);

  // Sync consolidated heats and productModel to parent for submodule pages
  useEffect(() => {
    // Only sync if we have actual heats (prevents clearing context on mount)
    if (onHeatsChange && consolidatedHeats.length > 0) {
      onHeatsChange(consolidatedHeats);
    }
  }, [consolidatedHeats, onHeatsChange]);

  useEffect(() => {
    if (onProductModelChange) onProductModelChange(productModel);
  }, [productModel, onProductModelChange]);

  // Auto-save main inspection data to localStorage whenever values change
  // IMPORTANT: Skip saving while still loading — prevents overwriting persisted data with empty initial state
  useEffect(() => {
    const inspectionCallNo = call?.call_no;
    if (!inspectionCallNo) return;
    if (isLoading) return; // ← Don't save during initial data load (would overwrite with empty values)

    const mainKey = `${STORAGE_KEYS.MAIN_INSPECTION}_${inspectionCallNo}`;
    const dataToSave = {
      numberOfBundles,
      sourceOfRawMaterial,
      heatRemarks,
      heatSealingType,
      heatSteelStampNumber,
      heatHologramEntries,
      heatColorCodes: consolidatedHeats.reduce((acc, heat) => {
        const heatNo = heat.heatNo || heat.heat_no;
        if (heatNo && heat.colorCode) {
          acc[heatNo] = heat.colorCode;
        }
        return acc;
      }, {})
    };
    localStorage.setItem(mainKey, JSON.stringify(dataToSave));
  }, [call?.call_no, isLoading, numberOfBundles, sourceOfRawMaterial, heatRemarks, heatSealingType, heatSteelStampNumber, heatHologramEntries, consolidatedHeats]);

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
  const validateCalibrationHeat = useCallback((calData) => {
    // If no calibration data is entered/loaded yet (still in progress), consider it OK
    if (!calData || !Array.isArray(calData) || calData.length === 0) {
      return 'OK';
    }
    const hasNotOk = calData.some(item => item.inspectionStatus === 'NOT OK' || item.calibrationStatus === 'Expired');
    return hasNotOk ? 'NOT OK' : 'OK';
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
      return count !== null && count !== undefined && count.toString().trim() !== '';
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
    const filledSamples = dimSamples.filter(s => s?.diameter !== null && s?.diameter !== undefined && String(s.diameter).trim() !== '');

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
      const isFilled = (val) => val !== null && val !== undefined && String(val).trim() !== '';
      return isFilled(sample.c) &&
        isFilled(sample.si) &&
        isFilled(sample.mn) &&
        isFilled(sample.p) &&
        isFilled(sample.s) &&
        isFilled(sample.grainSize) &&
        isFilled(sample.decarb) &&
        isFilled(sample.inclA) &&
        isFilled(sample.inclB) &&
        isFilled(sample.inclC) &&
        isFilled(sample.inclD) &&
        isFilled(sample.hardness);
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
  const validatePackingStorage = useCallback((packingData, hNo) => {
    if (!packingData?.packingDataByHeat) return 'Pending';

    const normalizedHNo = (hNo || '').toString().trim().toUpperCase();
    const heatData = packingData.packingDataByHeat[normalizedHNo];
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
      const calKey = `${STORAGE_KEYS.CALIBRATION}_${inspectionCallNo}${getShiftSuffix()}`;
      const calRaw = localStorage.getItem(calKey);
      const calData = calRaw ? JSON.parse(calRaw) : null;

      // Get visual inspection data
      const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${inspectionCallNo}${getShiftSuffix()}`;
      const visualRaw = localStorage.getItem(visualKey);
      const visualData = visualRaw ? JSON.parse(visualRaw) : [];

      // Get dimensional check data
      const dimKey = `${STORAGE_KEYS.DIMENSIONAL_CHECK}_${inspectionCallNo}${getShiftSuffix()}`;
      const dimRaw = localStorage.getItem(dimKey);
      const dimData = dimRaw ? JSON.parse(dimRaw) : null;

      // Get material testing data
      const matKey = `${STORAGE_KEYS.MATERIAL_TESTING}_${inspectionCallNo}${getShiftSuffix()}`;
      const matRaw = localStorage.getItem(matKey);
      const matData = matRaw ? JSON.parse(matRaw) : null;

      // Get packing & storage data
      const packKey = `${STORAGE_KEYS.PACKING_STORAGE}_${inspectionCallNo}${getShiftSuffix()}`;
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

        const normalizedHNo = heatNo.toString().trim().toUpperCase();

        // Calibration: Validate overall submodule completion (Ladle Analysis removed)
        statuses.calibration = validateCalibrationHeat(calData);

        // Visual, Dimensional, etc. use the heatNo as key (with fallback to index for legacy support)
        const getHeatData = (storageData, hNo, idx) => {
          if (!storageData) return null;
          const nhNo = (hNo || '').toString().trim().toUpperCase();
          if (typeof storageData === 'object' && !Array.isArray(storageData) && storageData[nhNo]) return storageData[nhNo];
          if (Array.isArray(storageData) && storageData[idx]) return storageData[idx];
          return null;
        };

        const vh = getHeatData(visualData, normalizedHNo, heatIndex);
        if (vh) statuses.visual = validateVisualHeat(vh);

        const dh = getHeatData(dimData?.heatDimData, normalizedHNo, heatIndex);
        if (dh?.dimSamples) statuses.dimensional = validateDimensionalHeat(dh.dimSamples, productModel);

        const mh = getHeatData(matData?.materialData, normalizedHNo, heatIndex);
        if (mh) statuses.materialTest = validateMaterialTestHeat(mh);

        statuses.packing = validatePackingStorage(packData, normalizedHNo);

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
    if (!numberOfBundles || String(numberOfBundles).trim() === '') {
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
        const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${call?.call_no}${getShiftSuffix()}`;
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

    // Check if remarks and sealing details are entered for all heats
    for (const heat of consolidatedHeats) {
      const heatNo = heat.heatNo || heat.heat_no || 'Unknown';
      if (!heatRemarks[heatNo] || heatRemarks[heatNo].trim() === '') {
        return { canFinish: false, reason: `Heat ${heatNo}: Remarks are required` };
      }

      // Check Sealing Type details
      const sealingType = heatSealingType[heatNo];
      if (!sealingType) {
        return { canFinish: false, reason: `Heat ${heatNo}: Sealing type (Steel Punch or Hologram) must be selected` };
      }

      if (sealingType === 'RITES_STEEL_PUNCH') {
        const stampStr = heatSteelStampNumber[heatNo];
        if (!stampStr || stampStr.trim() === '') {
          return { canFinish: false, reason: `Heat ${heatNo}: IE Steel Stamp No is required when using Steel Punch` };
        }
      } else if (sealingType === 'RITES_HOLOGRAM') {
        const holoEntries = heatHologramEntries[heatNo] || [];
        if (holoEntries.length === 0) {
          return { canFinish: false, reason: `Heat ${heatNo}: At least one hologram entry must be added when using Holograms` };
        }

        // Ensure all added hologram entries are fully filled out
        const hasEmptyHoloData = holoEntries.some(holo => {
          if (holo.type === 'range') return !holo.from?.trim() || !holo.to?.trim();
          if (holo.type === 'single') return !holo.value?.trim();
          return true;
        });

        if (hasEmptyHoloData) {
          return { canFinish: false, reason: `Heat ${heatNo}: Please fill out all added hologram numbers completely` };
        }
      }
    }

    return { canFinish: true, reason: '' };
  }, [consolidatedHeats, heatSubmoduleStatuses, heatRemarks, heatSealingType, heatSteelStampNumber, heatHologramEntries, numberOfBundles, call?.call_no, calculateVisualRejectedWeight]);

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

      // Helper to map consolidated data to active heats
      // Supports both NEW object format (keyed by heatNo) and OLD array format (by index)
      const getConsolidatedDataForHeat = (storageData, hNo, logTag = 'Data') => {
        if (!storageData) return null;

        const normalizedHNo = (hNo || '').toString().trim().toUpperCase();

        // 1. Support NEW Object Format (keyed by heatNo)
        if (typeof storageData === 'object' && !Array.isArray(storageData)) {
          if (storageData[normalizedHNo]) {
            return storageData[normalizedHNo];
          }
        }

        // 2. Support OLD Array Format (fallback to index match in consolidatedHeats)
        if (Array.isArray(storageData)) {
          const foundIndex = consolidatedHeats.findIndex(h =>
            (h.heatNo || h.heat_no || '').toString().trim().toUpperCase() === normalizedHNo
          );
          if (foundIndex !== -1 && foundIndex < storageData.length) {
            return storageData[foundIndex];
          }
        }

        return null;
      };

      // Collect Visual Inspection data
      const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${inspectionCallNo}${getShiftSuffix()}`;
      const visualRaw = localStorage.getItem(visualKey);
      let visualInspectionData = [];
      if (visualRaw) {
        const visualParsed = JSON.parse(visualRaw);
        console.log('📦 Visual Inspection draft items:', Array.isArray(visualParsed) ? visualParsed.length : 'not an array');

        activeHeats.forEach((heat, heatIndex) => {
          const hNo = heat.heatNo || heat.heat_no || `Heat-${heatIndex + 1}`;
          const heatData = getConsolidatedDataForHeat(visualParsed, hNo, 'Visual');

          if (heatData?.selectedDefects) {
            const defects = {};
            const defectLengths = {};
            let defectCount = 0;
            let totalDefectiveLength = 0;

            Object.entries(heatData.selectedDefects).forEach(([defectName, isSelected]) => {
              defects[defectName] = isSelected || false;
              if (isSelected && defectName !== 'No Defect') defectCount++;
              if (isSelected && heatData.defectCounts?.[defectName]) {
                const val = parseFloat(heatData.defectCounts[defectName]);
                if (!isNaN(val)) {
                  defectLengths[defectName] = val;
                  if (defectName !== 'No Defect') totalDefectiveLength += val;
                }
              }
            });

            const wFactor = productModel?.toUpperCase().includes('V') ? 0.00326 : 0.00263;
            const weightRejected = defects['No Defect'] ? 0 : totalDefectiveLength * wFactor;
            if (defects['No Defect']) defectCount = 0;

            visualInspectionData.push({
              inspectionCallNo, heatNo: hNo, heatIndex, defects, defectLengths, defectCount, weightRejected
            });
          }
        });
      }

      // Collect Dimensional Check data
      const dimKey = `${STORAGE_KEYS.DIMENSIONAL_CHECK}_${inspectionCallNo}${getShiftSuffix()}`;
      const dimRaw = localStorage.getItem(dimKey);
      let dimensionalCheckData = [];
      if (dimRaw) {
        const dimParsed = JSON.parse(dimRaw);
        activeHeats.forEach((heat, heatIndex) => {
          const hNo = heat.heatNo || heat.heat_no;
          const heatData = getConsolidatedDataForHeat(dimParsed.heatDimData, hNo, 'Dimensional');

          if (heatData?.dimSamples && Array.isArray(heatData.dimSamples)) {
            const specs = productModel?.toUpperCase().includes('V') ? { min: 22.81, max: 23.23 } : { min: 20.47, max: 20.84 };
            let defectCount = 0;
            const sampleDiameters = heatData.dimSamples.map(sample => {
              const diameter = sample?.diameter;
              if (diameter !== null && diameter !== undefined && diameter !== '') {
                const val = parseFloat(diameter);
                if (!isNaN(val) && (val < specs.min || val > specs.max)) defectCount++;
                return val;
              }
              return null;
            });

            dimensionalCheckData.push({
              inspectionCallNo, heatNo: hNo, heatIndex, sampleDiameters, defectCount
            });
          }
        });
      }

      // Collect Material Testing data
      const matKey = `${STORAGE_KEYS.MATERIAL_TESTING}_${inspectionCallNo}${getShiftSuffix()}`;
      const matRaw = localStorage.getItem(matKey);
      let materialTestingData = [];
      const parseDecimal = (val) => {
        if (val === null || val === undefined || val === '') return null;
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
      };
      if (matRaw) {
        const matParsed = JSON.parse(matRaw);
        activeHeats.forEach((heat, heatIndex) => {
          const hNo = heat.heatNo || heat.heat_no || `Heat-${heatIndex + 1}`;
          const heatData = getConsolidatedDataForHeat(matParsed.materialData, hNo, 'Material');

          if (heatData?.samples && Array.isArray(heatData.samples)) {
            heatData.samples.forEach((sample, sampleIdx) => {
              materialTestingData.push({
                inspectionCallNo, heatNo: hNo, heatIndex, sampleNumber: sampleIdx + 1,
                carbonPercent: parseDecimal(sample.c), siliconPercent: parseDecimal(sample.si),
                manganesePercent: parseDecimal(sample.mn), phosphorusPercent: parseDecimal(sample.p),
                sulphurPercent: parseDecimal(sample.s), grainSize: parseDecimal(sample.grainSize),
                hardnessHrc: parseDecimal(sample.hardness), decarbDepthMm: parseDecimal(sample.decarb),
                inclusionTypeA: sample.inclTypeA || null, inclusionA: parseDecimal(sample.inclA),
                inclusionTypeB: sample.inclTypeB || null, inclusionB: parseDecimal(sample.inclB),
                inclusionTypeC: sample.inclTypeC || null, inclusionC: parseDecimal(sample.inclC),
                inclusionTypeD: sample.inclTypeD || null, inclusionD: parseDecimal(sample.inclD),
                remarks: sample.remarks || null
              });
            });
          }
        });
      }

      // Collect Packing & Storage data
      const packKey = `${STORAGE_KEYS.PACKING_STORAGE}_${inspectionCallNo}${getShiftSuffix()}`;
      const packRaw = localStorage.getItem(packKey);
      let packingStorageData = [];
      if (packRaw) {
        const packParsed = JSON.parse(packRaw);
        const packingData = packParsed.packingDataByHeat || {};
        console.log('📦 Packing draft items:', Object.keys(packingData).length);

        activeHeats.forEach((heat, heatIndex) => {
          const hNo = heat.heatNo || heat.heat_no;
          const heatData = getConsolidatedDataForHeat(Object.values(packingData), hNo, 'Packing');

          if (heatData) {
            packingStorageData.push({
              inspectionCallNo, heatNo: hNo, heatIndex,
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

      // Collect Calibration Documents data
      const calKey = `${STORAGE_KEYS.CALIBRATION}_${inspectionCallNo}${getShiftSuffix()}`;
      const calRaw = localStorage.getItem(calKey);
      let calibrationDocumentsData = [];
      if (calRaw) {
        const calParsed = JSON.parse(calRaw);
        console.log('📦 Calibration draft items:', Array.isArray(calParsed?.heats) ? calParsed.heats.length : 'missing');

        if (calParsed.heats && Array.isArray(calParsed.heats)) {
          activeHeats.forEach((heat, idx) => {
            const hNo = heat.heatNo || heat.heat_no || `Heat-${idx + 1}`;
            // Try to match by heatNo in calParsed.heats if available
            const savedHeat = calParsed.heats.find(h => (h.heatNo || '').toString().toUpperCase() === hNo.toString().toUpperCase()) || calParsed.heats[idx];

            if (savedHeat) {
              calibrationDocumentsData.push({
                inspectionCallNo,
                heatNo: hNo,
                heatIndex: idx,
                rdsoApprovalId: calParsed.rdsoApprovalValidity?.approvalId || null,
                rdsoValidFrom: calParsed.rdsoApprovalValidity?.validFrom || null,
                rdsoValidTo: calParsed.rdsoApprovalValidity?.validTo || null,
                gaugesAvailable: calParsed.gaugesAvailable || false,
                ladleCarbonPercent: parseDecimal(savedHeat.percentC),
                ladleSiliconPercent: parseDecimal(savedHeat.percentSi),
                ladleManganesePercent: parseDecimal(savedHeat.percentMn),
                ladlePhosphorusPercent: parseDecimal(savedHeat.percentP),
                ladleSulphurPercent: parseDecimal(savedHeat.percentS),
                vendorVerified: calParsed.vendorVerification?.verified || false,
                verifiedBy: calParsed.vendorVerification?.verifiedBy || null,
                verifiedAt: calParsed.vendorVerification?.verifiedAt || null
              });
            }
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
          const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${inspectionCallNo}${getShiftSuffix()}`;
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
            wtAcceptedNumbers = (acceptedQtyMt * 1000) / getErcDivisor(productModel);

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

        // Prepare hologram string for backend
        const hologramEntries = heatHologramEntries[heatNo] || [];
        const hologramString = hologramEntries.map(h => {
          if (h.type === 'range') return `Range: ${h.from} to ${h.to}`;
          return `Single: ${h.value}`;
        }).join(', ');

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

          // Sealing Details
          sealingType: heatSealingType[heatNo] || null,
          steelStampNumber: heatSteelStampNumber[heatNo] || null,
          hologramDetails: hologramString || null,

          // Cumulative Summary
          totalHeatsOffered: consolidatedHeats.length,
          totalQtyOfferedMt: consolidatedHeats.reduce((sum, h) => sum + h.weight, 0),
          noOfBundles: numberOfBundles ? parseInt(numberOfBundles) : 0,
          noOfErcFinished: numberOfERC ? parseInt(numberOfERC) : 0,

          // Remarks
          remarks: heatRemarks[heatNo] || null,

          // Audit Fields
          createdBy: userId,
          shift: shiftOfInspection,
          dateOfInspection: sessionStorage.getItem('inspectionDate') || new Date().toISOString().split('T')[0]
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
      localStorage.removeItem(`${STORAGE_KEYS.VISUAL_INSPECTION}_${inspectionCallNo}${getShiftSuffix()}`);
      localStorage.removeItem(`${STORAGE_KEYS.DIMENSIONAL_CHECK}_${inspectionCallNo}${getShiftSuffix()}`);
      localStorage.removeItem(`${STORAGE_KEYS.MATERIAL_TESTING}_${inspectionCallNo}${getShiftSuffix()}`);
      localStorage.removeItem(`${STORAGE_KEYS.PACKING_STORAGE}_${inspectionCallNo}${getShiftSuffix()}`);
      localStorage.removeItem(`${STORAGE_KEYS.CALIBRATION}_${inspectionCallNo}${getShiftSuffix()}`);
      localStorage.removeItem(`${STORAGE_KEYS.MAIN_INSPECTION}_${inspectionCallNo}${getShiftSuffix()}`);
      localStorage.removeItem(`${DASHBOARD_DRAFT_KEY}${inspectionCallNo}${getShiftSuffix()}`);

      // Reset context cache
      updateRmPoDataCache(null);
      updateRmCallDataCache(null);
      updateRmHeatDataCache([]);

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
  }, [call?.call_no, call?.id, call?.pincode, call?.workflowTransitionId, activeHeats, onBack, numberOfBundles, numberOfERC, sourceOfRawMaterial, poData, productModel, heatSubmoduleStatuses, heatRemarks, heatSealingType, heatSteelStampNumber, heatHologramEntries, calculateVisualRejectedWeight, consolidatedHeats, canFinishInspection, updateRmCallDataCache, updateRmHeatDataCache, updateRmPoDataCache]);

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
        const visKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${inspectionCallNo}${getShiftSuffix()}`;
        const dimKey = `${STORAGE_KEYS.DIMENSIONAL_CHECK}_${inspectionCallNo}${getShiftSuffix()}`;
        const matKey = `${STORAGE_KEYS.MATERIAL_TESTING}_${inspectionCallNo}${getShiftSuffix()}`;
        const packKey = `${STORAGE_KEYS.PACKING_STORAGE}_${inspectionCallNo}${getShiftSuffix()}`;
        const calKey = `${STORAGE_KEYS.CALIBRATION}_${inspectionCallNo}${getShiftSuffix()}`;
        const mainKey = `${STORAGE_KEYS.MAIN_INSPECTION}_${inspectionCallNo}${getShiftSuffix()}`;

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
      const currentUser = getStoredUser();
      const userId = currentUser?.userId || currentUser?.username || 'IE_USER';
      const shiftOfInspection = sessionStorage.getItem('inspectionShift') || null;

      const parseDecimal = (val) => {
        if (val === null || val === undefined || val === '') return null;
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
      };

      // Helper to map consolidated data to active heats
      // Supports both NEW object format (keyed by heatNo) and OLD array format (by index)
      const getConsolidatedDataForHeat = (storageData, hNo, logTag = 'Data') => {
        if (!storageData) return null;

        const normalizedHNo = (hNo || '').toString().trim().toUpperCase();

        // 1. Support NEW Object Format (keyed by heatNo)
        if (typeof storageData === 'object' && !Array.isArray(storageData)) {
          if (storageData[normalizedHNo]) {
            return storageData[normalizedHNo];
          }
        }

        // 2. Support OLD Array Format (fallback to index match in consolidatedHeats)
        if (Array.isArray(storageData)) {
          const foundIndex = consolidatedHeats.findIndex(h =>
            (h.heatNo || h.heat_no || '').toString().trim().toUpperCase() === normalizedHNo
          );
          if (foundIndex !== -1 && foundIndex < storageData.length) {
            return storageData[foundIndex];
          }
        }

        return null;
      };

      // Collect Visual Inspection data
      const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${inspectionCallNo}${getShiftSuffix()}`;
      const visualRaw = localStorage.getItem(visualKey);
      let visualInspectionData = [];
      if (visualRaw) {
        const visualParsed = JSON.parse(visualRaw);
        console.log('📦 Visual Inspection draft items:', Array.isArray(visualParsed) ? visualParsed.length : 'not an array');

        activeHeats.forEach((heat, heatIndex) => {
          const hNo = heat.heatNo || heat.heat_no || `Heat-${heatIndex + 1}`;
          const heatData = getConsolidatedDataForHeat(visualParsed, hNo, 'Visual');

          if (heatData?.selectedDefects) {
            const defects = {};
            const defectLengths = {};
            let defectCount = 0;
            let totalDefectiveLength = 0;

            Object.entries(heatData.selectedDefects).forEach(([defectName, isSelected]) => {
              defects[defectName] = isSelected || false;
              if (isSelected && defectName !== 'No Defect') defectCount++;
              if (isSelected && heatData.defectCounts?.[defectName]) {
                const val = parseFloat(heatData.defectCounts[defectName]);
                if (!isNaN(val)) {
                  defectLengths[defectName] = val;
                  if (defectName !== 'No Defect') totalDefectiveLength += val;
                }
              }
            });

            const wFactor = productModel?.toUpperCase().includes('V') ? 0.00326 : 0.00263;
            const weightRejected = defects['No Defect'] ? 0 : totalDefectiveLength * wFactor;
            if (defects['No Defect']) defectCount = 0;

            visualInspectionData.push({
              inspectionCallNo, heatNo: hNo, heatIndex, defects, defectLengths, defectCount, weightRejected
            });
          }
        });
      }

      // Collect Dimensional Check data
      const dimKey = `${STORAGE_KEYS.DIMENSIONAL_CHECK}_${inspectionCallNo}${getShiftSuffix()}`;
      const dimRaw = localStorage.getItem(dimKey);
      let dimensionalCheckData = [];
      if (dimRaw) {
        const dimParsed = JSON.parse(dimRaw);
        console.log('📦 Dimensional Check draft items:', Array.isArray(dimParsed?.heatDimData) ? dimParsed.heatDimData.length : 'missing');
        activeHeats.forEach((heat, heatIndex) => {
          const hNo = heat.heatNo || heat.heat_no;
          const heatData = getConsolidatedDataForHeat(dimParsed.heatDimData, hNo, 'Dimensional');

          if (heatData?.dimSamples && Array.isArray(heatData.dimSamples)) {
            const specs = productModel?.toUpperCase().includes('V') ? { min: 22.81, max: 23.23 } : { min: 20.47, max: 20.84 };
            let defectCount = 0;
            const sampleDiameters = heatData.dimSamples.map(sample => {
              const diameter = sample?.diameter;
              if (diameter !== null && diameter !== undefined && diameter !== '') {
                const val = parseFloat(diameter);
                if (!isNaN(val) && (val < specs.min || val > specs.max)) defectCount++;
                return val;
              }
              return null;
            });

            dimensionalCheckData.push({
              inspectionCallNo, heatNo: hNo, heatIndex, sampleDiameters, defectCount
            });
          }
        });
      }

      // Collect Material Testing data
      const matKey = `${STORAGE_KEYS.MATERIAL_TESTING}_${inspectionCallNo}${getShiftSuffix()}`;
      const matRaw = localStorage.getItem(matKey);
      let materialTestingData = [];
      if (matRaw) {
        const matParsed = JSON.parse(matRaw);
        console.log('📦 Material Testing draft items:', Array.isArray(matParsed?.materialData) ? matParsed.materialData.length : 'missing');

        activeHeats.forEach((heat, heatIndex) => {
          const hNo = heat.heatNo || heat.heat_no || `Heat-${heatIndex + 1}`;
          const heatData = getConsolidatedDataForHeat(matParsed.materialData, hNo, 'Material');

          if (heatData?.samples && Array.isArray(heatData.samples)) {
            heatData.samples.forEach((sample, sampleIdx) => {
              materialTestingData.push({
                inspectionCallNo, heatNo: hNo, heatIndex, sampleNumber: sampleIdx + 1,
                carbonPercent: parseDecimal(sample.c), siliconPercent: parseDecimal(sample.si),
                manganesePercent: parseDecimal(sample.mn), phosphorusPercent: parseDecimal(sample.p),
                sulphurPercent: parseDecimal(sample.s), grainSize: parseDecimal(sample.grainSize),
                hardnessHrc: parseDecimal(sample.hardness), decarbDepthMm: parseDecimal(sample.decarb),
                inclusionTypeA: sample.inclTypeA || null, inclusionA: parseDecimal(sample.inclA),
                inclusionTypeB: sample.inclTypeB || null, inclusionB: parseDecimal(sample.inclB),
                inclusionTypeC: sample.inclTypeC || null, inclusionC: parseDecimal(sample.inclC),
                inclusionTypeD: sample.inclTypeD || null, inclusionD: parseDecimal(sample.inclD),
                remarks: sample.remarks || null
              });
            });
          }
        });
      }

      // Collect Packing & Storage data
      const packKey = `${STORAGE_KEYS.PACKING_STORAGE}_${inspectionCallNo}${getShiftSuffix()}`;
      const packRaw = localStorage.getItem(packKey);
      let packingStorageData = [];
      if (packRaw) {
        const packParsed = JSON.parse(packRaw);
        const packingData = packParsed.packingDataByHeat || {};
        console.log('📦 Packing draft items:', Object.keys(packingData).length);

        activeHeats.forEach((heat, heatIndex) => {
          const hNo = heat.heatNo || heat.heat_no;
          const heatData = getConsolidatedDataForHeat(Object.values(packingData), hNo, 'Packing');

          if (heatData) {
            packingStorageData.push({
              inspectionCallNo, heatNo: hNo, heatIndex,
              storedHeatWise: heatData.storedHeatWise || null,
              suppliedInBundles: heatData.suppliedInBundles || null,
              heatNumberEnds: heatData.heatNumberEnds || null,
              packingStripWidth: heatData.packingStripWidth || null,
              bundleTiedLocations: heatData.bundleTiedLocations || null,
              identificationTagBundle: heatData.identificationTagBundle || null,
              metalTagInformation: heatData.metalTagInformation || null,
              remarks: heatData.remarks || null,
              shift: shiftOfInspection,
              dateOfInspection: sessionStorage.getItem('inspectionDate') || new Date().toISOString().split('T')[0]
            });
          }
        });
      }

      // Collect Calibration Documents data
      const calKey = `${STORAGE_KEYS.CALIBRATION}_${inspectionCallNo}${getShiftSuffix()}`;
      const calRaw = localStorage.getItem(calKey);
      let calibrationDocumentsData = [];
      if (calRaw) {
        const calParsed = JSON.parse(calRaw);
        console.log('📦 Calibration draft items:', Array.isArray(calParsed?.heats) ? calParsed.heats.length : 'missing');

        if (calParsed.heats && Array.isArray(calParsed.heats)) {
          activeHeats.forEach((heat, idx) => {
            const hNo = heat.heatNo || heat.heat_no || `Heat-${idx + 1}`;
            // Try to match by heatNo in calParsed.heats if available
            const savedHeat = calParsed.heats.find(h => (h.heatNo || '').toString().toUpperCase() === hNo.toString().toUpperCase()) || calParsed.heats[idx];

            if (savedHeat) {
              calibrationDocumentsData.push({
                inspectionCallNo,
                heatNo: hNo,
                heatIndex: idx,
                rdsoApprovalId: calParsed.rdsoApprovalValidity?.approvalId || null,
                rdsoValidFrom: calParsed.rdsoApprovalValidity?.validFrom || null,
                rdsoValidTo: calParsed.rdsoApprovalValidity?.validTo || null,
                gaugesAvailable: calParsed.gaugesAvailable || false,
                ladleCarbonPercent: parseDecimal(savedHeat.percentC),
                ladleSiliconPercent: parseDecimal(savedHeat.percentSi),
                ladleManganesePercent: parseDecimal(savedHeat.percentMn),
                ladlePhosphorusPercent: parseDecimal(savedHeat.percentP),
                ladleSulphurPercent: parseDecimal(savedHeat.percentS),
                vendorVerified: calParsed.vendorVerification?.verified || false,
                verifiedBy: calParsed.vendorVerification?.verifiedBy || null,
                verifiedAt: calParsed.vendorVerification?.verifiedAt || null
              });
            }
          });
        }
      }

      // Collect pre-inspection data
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
        const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${inspectionCallNo}${getShiftSuffix()}`;
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

        // Calculate Wt. Accepted (Numbers) depending on productModel
        const wtAcceptedNumbers = (acceptedQtyMt * 1000) / getErcDivisor(productModel);

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

        // Prepare hologram string for backend
        const hologramEntries = heatHologramEntries[heatNo] || [];
        const hologramString = hologramEntries.map(h => {
          if (h.type === 'range') return `Range: ${h.from} to ${h.to}`;
          return `Single: ${h.value}`;
        }).join(', ');

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

          // Sealing Details
          sealingType: heatSealingType[heatNo] || null,
          steelStampNumber: heatSteelStampNumber[heatNo] || null,
          hologramDetails: hologramString || null,
          colorCode: heat.colorCode || null,

          // Audit Fields
          createdBy: userId,
          shift: shiftOfInspection,
          dateOfInspection: sessionStorage.getItem('inspectionDate') || new Date().toISOString().split('T')[0]
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

      // Clear all inspection data from localStorage after successful pause
      localStorage.removeItem(`${STORAGE_KEYS.VISUAL_INSPECTION}_${inspectionCallNo}${getShiftSuffix()}`);
      localStorage.removeItem(`${STORAGE_KEYS.DIMENSIONAL_CHECK}_${inspectionCallNo}${getShiftSuffix()}`);
      localStorage.removeItem(`${STORAGE_KEYS.MATERIAL_TESTING}_${inspectionCallNo}${getShiftSuffix()}`);
      localStorage.removeItem(`${STORAGE_KEYS.PACKING_STORAGE}_${inspectionCallNo}${getShiftSuffix()}`);
      localStorage.removeItem(`${STORAGE_KEYS.CALIBRATION}_${inspectionCallNo}${getShiftSuffix()}`);
      localStorage.removeItem(`${STORAGE_KEYS.MAIN_INSPECTION}_${inspectionCallNo}${getShiftSuffix()}`);
      localStorage.removeItem(`${DASHBOARD_DRAFT_KEY}${inspectionCallNo}${getShiftSuffix()}`);

      // Reset context cache
      updateRmPoDataCache(null);
      updateRmCallDataCache(null);
      updateRmHeatDataCache([]);

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
  }, [call, onBack, activeHeats, numberOfBundles, numberOfERC, sourceOfRawMaterial, poData, productModel, heatSubmoduleStatuses, heatRemarks, heatSealingType, heatSteelStampNumber, heatHologramEntries, updateRmCallDataCache, updateRmHeatDataCache, updateRmPoDataCache]);

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
        heatSealingType: heatSealingType,
        heatSteelStampNumber: heatSteelStampNumber,
        heatHologramEntries: heatHologramEntries,
        // Save heat color codes
        heatColorCodes: fetchedHeatData.reduce((acc, heat) => {
          if (heat.heatNo && heat.colorCode) {
            acc[heat.heatNo] = heat.colorCode;
          }
          return acc;
        }, {})
      };

      // Save to localStorage with inspection call number as key
      const storageKey = `${DASHBOARD_DRAFT_KEY}${inspectionCallNo}${getShiftSuffix()}`;
      const mainKey = `${STORAGE_KEYS.MAIN_INSPECTION}_${inspectionCallNo}${getShiftSuffix()}`;

      localStorage.setItem(storageKey, JSON.stringify(draftData));
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
  }, [call?.call_no, numberOfBundles, sourceOfRawMaterial, heatRemarks, heatSealingType, heatSteelStampNumber, heatHologramEntries, fetchedHeatData]);

  // Load draft data from localStorage on mount (after heat data is loaded)
  useEffect(() => {
    const inspectionCallNo = call?.call_no;
    if (!inspectionCallNo || fetchedHeatData.length === 0 || hasLoadedDraftRef.current) return;

    // Mark as loaded to prevent re-running
    hasLoadedDraftRef.current = true;

    try {
      const storageKey = `${DASHBOARD_DRAFT_KEY}${inspectionCallNo}${getShiftSuffix()}`;
      const savedDraft = localStorage.getItem(storageKey);

      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        console.log('📦 Loading draft data from localStorage:', draftData);

        // Restore form data
        if (draftData.numberOfBundles) setNumberOfBundles(draftData.numberOfBundles);
        if (draftData.sourceOfRawMaterial) setSourceOfRawMaterial(draftData.sourceOfRawMaterial);
        if (draftData.heatRemarks) setHeatRemarks(draftData.heatRemarks);
        if (draftData.heatSealingType) setHeatSealingType(draftData.heatSealingType);
        if (draftData.heatSteelStampNumber) setHeatSteelStampNumber(draftData.heatSteelStampNumber);
        if (draftData.heatHologramEntries) setHeatHologramEntries(draftData.heatHologramEntries);

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

  // Auto-save dashboard fields to localStorage whenever they change
  useEffect(() => {
    const inspectionCallNo = call?.call_no;
    // VERY IMPORTANT: Prevent overwriting existing localStorage data with empty initial state
    // only save when data is fully loaded and we have heat data to save
    if (!inspectionCallNo || isLoading || fetchedHeatData.length === 0) return;

    try {
      const draftData = {
        savedAt: new Date().toISOString(),
        numberOfBundles,
        sourceOfRawMaterial,
        heatRemarks,
        heatSealingType,
        heatSteelStampNumber,
        heatHologramEntries,
        // Keep color codes in sync if available
        heatColorCodes: fetchedHeatData.reduce((acc, heat) => {
          if (heat.heatNo && heat.colorCode) {
            acc[heat.heatNo] = heat.colorCode;
          }
          return acc;
        }, {})
      };

      const storageKey = `${DASHBOARD_DRAFT_KEY}${inspectionCallNo}${getShiftSuffix()}`;
      const mainKey = `${STORAGE_KEYS.MAIN_INSPECTION}_${inspectionCallNo}${getShiftSuffix()}`;

      const serializedData = JSON.stringify(draftData);
      localStorage.setItem(storageKey, serializedData);
      localStorage.setItem(mainKey, serializedData);
    } catch (error) {
      console.error('Error in auto-save:', error);
    }
  }, [call?.call_no, numberOfBundles, sourceOfRawMaterial, heatRemarks, heatSealingType, heatSteelStampNumber, heatHologramEntries, fetchedHeatData, isLoading]);

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

      {/* Call Details Info Banner - Moved to Top */}
      <div className="card" style={{ background: '#f8fafc', marginBottom: 'var(--space-16)', padding: '16px 24px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            <span style={{ fontWeight: '600', color: '#1e293b', marginRight: '8px' }}>Call No:</span> {callNo}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            <span style={{ fontWeight: '600', color: '#1e293b', marginRight: '8px' }}>Shift:</span> {shiftOfInspection}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            <span style={{ fontWeight: '600', color: '#1e293b', marginRight: '8px' }}>Date of Inspection:</span> {formatDate(dateOfInspection)}
          </div>
        </div>
      </div>

      {/* Header with Static Data */}
      <div className="card" style={{ marginBottom: 'var(--space-24)', paddingBottom: '24px' }}>
        <div className="card-header rm-card-header" style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <h3 className="card-title rm-card-title" style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Inspection Details</h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          padding: '0 24px'
        }}>
          {/* Row 1 */}
          <div className="rm-form-group">
            <label className="rm-form-label" style={{ fontWeight: '500', marginBottom: '8px', color: '#374151' }}>PO Number</label>
            <input
              type="text"
              className="rm-form-input"
              style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#475569', borderRadius: '10px' }}
              value={(() => {
                const poNo = poData.po_no || poData.sub_po_no;
                const serial = poData.poSerialNo
                  ? poData.poSerialNo.includes('/') ? poData.poSerialNo.split('/').pop() : poData.poSerialNo
                  : '';
                return [poData.rlyShortName, poNo, serial].filter(Boolean).join(' / ');
              })()}
              disabled
            />
          </div>
          <div className="rm-form-group">
            <label className="rm-form-label" style={{ fontWeight: '500', marginBottom: '8px', color: '#374151' }}>PO Date</label>
            <input
              type="text"
              className="rm-form-input"
              style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#475569', borderRadius: '10px' }}
              value={formatDate(poData.po_date || poData.sub_po_date) || ''}
              disabled
            />
          </div>
          <div className="rm-form-group">
            <label className="rm-form-label" style={{ fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Contractor Name</label>
            <input
              type="text"
              className="rm-form-input"
              style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#475569', borderRadius: '10px' }}
              value={poData.contractor || poData.vendor_name || ''}
              disabled
            />
          </div>

          {/* Row 2 */}
          <div className="rm-form-group">
            <label className="rm-form-label" style={{ fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Manufacturer</label>
            <input
              type="text"
              className="rm-form-input"
              style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#475569', borderRadius: '10px' }}
              value={poData.contractor || poData.vendor_name || ''}
              disabled
            />
          </div>
          <div className="rm-form-group">
            <label className="rm-form-label" style={{ fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Place of Inspection</label>
            <input
              type="text"
              className="rm-form-input"
              style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#475569', borderRadius: '10px' }}
              value={poData.place_of_inspection || ''}
              disabled
            />
          </div>
          <div className="rm-form-group">
            <label className="rm-form-label" style={{ fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Stage of Inspection</label>
            <input
              type="text"
              className="rm-form-input"
              style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#475569', borderRadius: '10px' }}
              value="Raw Material Inspection"
              disabled
            />
          </div>
        </div>
      </div>

      {/* Pre-Inspection Data Entry */}
      <div className="card" style={{ marginBottom: 'var(--space-24)' }}>
        <div className="card-header rm-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 className="card-title rm-card-title" style={{ margin: 0 }}>Pre-Inspection Data Entry</h3>
          <button
            onClick={() => setIsPreInspectionExpanded(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#374151',
              fontWeight: 500,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            {isPreInspectionExpanded ? '▲ Collapse' : '▼ Expand'}
          </button>
        </div>

        {isPreInspectionExpanded && (
          <>
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
          </>
        )}
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
                const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${call?.call_no}${getShiftSuffix()}`;
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
              const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${call?.call_no}${getShiftSuffix()}`;
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
                          const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${callNo}${getShiftSuffix()}`;
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
                          const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${callNo}${getShiftSuffix()}`;
                          const visualRaw = localStorage.getItem(visualKey);
                          const visualData = visualRaw ? JSON.parse(visualRaw) : [];

                          const heatVisualData = Array.isArray(visualData) && heatIndex >= 0 ? visualData[heatIndex] : null;
                          const totalRejectedWeight = calculateVisualRejectedWeight(heatVisualData);

                          // Calculate: Accepted Qty (Tons) = Offered Qty - Rejected Weight
                          const offeredTons = parseFloat(heat.weight) || 0;
                          const acceptedQtyTons = offeredTons - totalRejectedWeight;

                          // Calculate: Wt. Accepted (Numbers) depending on productModel
                          const wtAcceptedNumbers = (acceptedQtyTons * 1000) / getErcDivisor(productModel);

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
                          const visualKey = `${STORAGE_KEYS.VISUAL_INSPECTION}_${callNo}${getShiftSuffix()}`;
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

                    {/* Are you sealing with section - Refined UX with Segmented Control */}
                    <div style={{
                      gridColumn: 'span 7',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '24px',
                      marginTop: '8px',
                      padding: '16px',
                      background: '#fffbeb',
                      borderRadius: '10px',
                      border: '1px solid #fde68a',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Are you sealing with:
                        </span>
                      </div>

                      {/* Segmented Control UI */}
                      <div style={{
                        display: 'flex',
                        background: '#fef3c7',
                        padding: '4px',
                        borderRadius: '8px',
                        border: '1px solid #fbbf24'
                      }}>
                        <button
                          onClick={() => handleSealingTypeChange(heat.heatNo, 'RITES_STEEL_PUNCH')}
                          style={{
                            padding: '8px 20px',
                            fontSize: '14px',
                            fontWeight: '600',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            border: 'none',
                            background: (heatSealingType[heat.heatNo] || '').includes('RITES_STEEL_PUNCH') ? '#fff' : 'transparent',
                            color: (heatSealingType[heat.heatNo] || '').includes('RITES_STEEL_PUNCH') ? '#b45309' : '#d97706',
                            boxShadow: (heatSealingType[heat.heatNo] || '').includes('RITES_STEEL_PUNCH') ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                          }}
                        >
                          <span style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '2px',
                            border: '2px solid',
                            background: (heatSealingType[heat.heatNo] || '').includes('RITES_STEEL_PUNCH') ? '#b45309' : 'transparent',
                            display: 'inline-block'
                          }}></span>
                          RITES Steel Punch
                        </button>
                        <button
                          onClick={() => handleSealingTypeChange(heat.heatNo, 'RITES_HOLOGRAM')}
                          style={{
                            padding: '8px 20px',
                            fontSize: '14px',
                            fontWeight: '600',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            border: 'none',
                            background: (heatSealingType[heat.heatNo] || '').includes('RITES_HOLOGRAM') ? '#fff' : 'transparent',
                            color: (heatSealingType[heat.heatNo] || '').includes('RITES_HOLOGRAM') ? '#b45309' : '#d97706',
                            boxShadow: (heatSealingType[heat.heatNo] || '').includes('RITES_HOLOGRAM') ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                          }}
                        >
                          <span style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '2px',
                            border: '2px solid',
                            background: (heatSealingType[heat.heatNo] || '').includes('RITES_HOLOGRAM') ? '#b45309' : 'transparent',
                            display: 'inline-block'
                          }}></span>
                          RITES Hologram
                        </button>
                      </div>

                      {/* IE Steel Stamp Number Inline - Enhanced Prominence */}
                      {(heatSealingType[heat.heatNo] || '').includes('RITES_STEEL_PUNCH') && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginLeft: 'auto',
                          background: '#fff',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '2px solid #fbbf24'
                        }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#b45309' }}>IE Steel Stamp No:</span>
                          <input
                            type="text"
                            className="rm-form-input"
                            placeholder="Type here..."
                            value={heatSteelStampNumber[heat.heatNo] || ''}
                            onChange={(e) => setHeatSteelStampNumber(prev => ({ ...prev, [heat.heatNo]: e.target.value }))}
                            style={{
                              width: '180px',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '15px',
                              fontWeight: '600',
                              height: '36px',
                              border: '1px solid #d1d5db',
                              outlineColor: '#fbbf24'
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Hologram Details Refined Section - High Discoverability */}
                    {(heatSealingType[heat.heatNo] || '').includes('RITES_HOLOGRAM') && (
                      <div style={{
                        gridColumn: 'span 7',
                        background: '#f0fdf4',
                        padding: '20px',
                        borderRadius: '10px',
                        border: '1px solid #bbf7d0',
                        marginTop: '4px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '24px', background: '#166534', borderRadius: '4px' }}></div>
                            <span style={{ fontSize: '16px', fontWeight: '700', color: '#166534' }}>Hologram Entries</span>
                          </div>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                              className="btn"
                              onClick={() => {
                                setHeatHologramEntries(prev => {
                                  const current = prev[heat.heatNo] || [];
                                  return { ...prev, [heat.heatNo]: [...current, { type: 'range', from: '', to: '' }] };
                                });
                              }}
                              style={{
                                padding: '8px 18px',
                                fontSize: '13px',
                                background: '#0284c7',
                                color: 'white',
                                borderRadius: '6px',
                                border: 'none',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#0369a1'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#0284c7'}
                            >
                              <span style={{ fontSize: '18px' }}>+</span> Add Range
                            </button>
                            <button
                              className="btn"
                              onClick={() => {
                                setHeatHologramEntries(prev => {
                                  const current = prev[heat.heatNo] || [];
                                  return { ...prev, [heat.heatNo]: [...current, { type: 'single', value: '' }] };
                                });
                              }}
                              style={{
                                padding: '8px 18px',
                                fontSize: '13px',
                                background: '#0284c7',
                                color: 'white',
                                borderRadius: '6px',
                                border: 'none',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#0369a1'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#0284c7'}
                            >
                              <span style={{ fontSize: '18px' }}>+</span> Add Single
                            </button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {(heatHologramEntries[heat.heatNo] || []).length === 0 && (
                            <div style={{ textAlign: 'center', padding: '20px', border: '2px dashed #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '14px', fontStyle: 'italic' }}>
                              No holograms added. Click the buttons above to add entries.
                            </div>
                          )}
                          {(heatHologramEntries[heat.heatNo] || []).map((holo, idx) => (
                            <div key={idx} style={{
                              display: 'flex',
                              gap: '16px',
                              alignItems: 'center',
                              background: '#fff',
                              padding: '12px 16px',
                              borderRadius: '8px',
                              border: '1px solid #bbf7d0',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                              <span style={{ fontSize: '14px', color: '#166534', minWidth: '70px', fontWeight: '700' }}>
                                {holo.type === 'range' ? 'RANGE' : 'SINGLE'}
                              </span>
                              {holo.type === 'range' ? (
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>FROM</span>
                                    <input
                                      className="rm-form-input"
                                      placeholder="Start No."
                                      value={holo.from || ''}
                                      onChange={(e) => {
                                        setHeatHologramEntries(prev => {
                                          const current = [...(prev[heat.heatNo] || [])];
                                          current[idx] = { ...current[idx], from: e.target.value };
                                          return { ...prev, [heat.heatNo]: current };
                                        });
                                      }}
                                      style={{ width: '140px', padding: '8px 12px', fontSize: '14px', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                                    />
                                  </div>
                                  <span style={{ fontSize: '14px', color: '#64748b', marginTop: '14px' }}>to</span>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>TO</span>
                                    <input
                                      className="rm-form-input"
                                      placeholder="End No."
                                      value={holo.to || ''}
                                      onChange={(e) => {
                                        setHeatHologramEntries(prev => {
                                          const current = [...(prev[heat.heatNo] || [])];
                                          current[idx] = { ...current[idx], to: e.target.value };
                                          return { ...prev, [heat.heatNo]: current };
                                        });
                                      }}
                                      style={{ width: '140px', padding: '8px 12px', fontSize: '14px', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>HOLOGRAM NUMBER</span>
                                  <input
                                    className="rm-form-input"
                                    placeholder="Enter number..."
                                    value={holo.value || ''}
                                    onChange={(e) => {
                                      setHeatHologramEntries(prev => {
                                        const current = [...(prev[heat.heatNo] || [])];
                                        current[idx] = { ...current[idx], value: e.target.value };
                                        return { ...prev, [heat.heatNo]: current };
                                      });
                                    }}
                                    style={{ width: '320px', padding: '8px 12px', fontSize: '14px', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                                  />
                                </div>
                              )}
                              <button
                                onClick={() => {
                                  setHeatHologramEntries(prev => {
                                    const current = [...(prev[heat.heatNo] || [])];
                                    current.splice(idx, 1);
                                    return { ...prev, [heat.heatNo]: current };
                                  });
                                }}
                                title="Remove Entry"
                                style={{
                                  background: '#fee2e2',
                                  border: '1px solid #fca5a5',
                                  color: '#dc2626',
                                  cursor: 'pointer',
                                  fontSize: '20px',
                                  width: '36px',
                                  height: '36px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: '8px',
                                  marginLeft: 'auto',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
