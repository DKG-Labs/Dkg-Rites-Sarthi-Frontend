import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getHourLabels } from '../utils/helpers';
import ProcessLineToggle from '../components/ProcessLineToggle';
import ProcessSubmoduleNav from '../components/ProcessSubmoduleNav';
import ShearingSection from '../components/sections/ShearingSection';
import TurningSection from '../components/sections/TurningSection';
import MpiSection from '../components/sections/MpiSection';
import ForgingSection from '../components/sections/ForgingSection';
import QuenchingSection from '../components/sections/QuenchingSection';
import FinalCheckSection from '../components/sections/FinalCheckSection';
import TemperingSection from '../components/sections/TemperingSection';
import TestingFinishingSection from '../components/sections/TestingFinishingSection';
import {
  shearingDataService,
  turningDataService,
  mpiDataService,
  forgingDataService,
  quenchingDataService,
  temperingDataService,
  finalCheckDataService
} from '../services/processMaterialService';
import {
  saveGridDataForLine,
  loadGridDataForLine
} from '../services/processLocalStorageService';
import { isSessionEnded } from '../utils/inspectionSessionControl';
import './ProcessParametersGridPage.css';

const ProcessParametersGridPage = ({ call, onBack, lotNumbers = [], shift: selectedShift = 'A', selectedLines = [], onNavigateSubmodule, productionLines = [], allCallOptions = [], callInitiationDataCache = {}, mapping = null }) => {
  const [activeLine, setActiveLine] = useState((selectedLines && selectedLines[0]) || 'Line-1');

  // Get line index for active line
  const activeLineIndex = useMemo(() => {
    return parseInt(activeLine.replace('Line-', '')) - 1;
  }, [activeLine]);

  // Get current production line data (has icNumber, poNumber structure from dashboard)
  const currentProductionLine = useMemo(() => {
    return productionLines[activeLineIndex] || null;
  }, [activeLineIndex, productionLines]);

  // Get the call data from allCallOptions based on the icNumber selected in production line
  const currentCallData = useMemo(() => {
    if (currentProductionLine?.icNumber) {
      return allCallOptions.find(c => c.call_no === currentProductionLine.icNumber) || null;
    }
    return null;
  }, [currentProductionLine, allCallOptions]);

  // Get PO number for active line
  const activeLinePoNo = useMemo(() => {
    // First try from production line (poNumber field)
    if (currentProductionLine?.poNumber) {
      return currentProductionLine.poNumber;
    }
    // Then try from call data (po_no field)
    if (currentCallData?.po_no) {
      return currentCallData.po_no;
    }
    // Fallback to main call
    return call?.po_no || '';
  }, [currentProductionLine, currentCallData, call]);

  const poNo = activeLinePoNo;

  // Get cached initiation data for the current line's selected call
  const currentLineInitiationData = useMemo(() => {
    if (currentProductionLine?.icNumber) {
      return callInitiationDataCache[currentProductionLine.icNumber] || null;
    }
    return null;
  }, [currentProductionLine, callInitiationDataCache]);

  // Determine product type for tolerance validation and turning section visibility
  const productType = useMemo(() => {
    const type = currentProductionLine?.productType ||
      currentCallData?.productType ||
      currentCallData?.ercType ||
      currentLineInitiationData?.typeOfErc ||
      currentLineInitiationData?.ercType ||
      call?.erc_type ||
      call?.ercType ||
      call?.product_type ||
      '';

    console.log('🔍 [Grid Page] Resolved productType:', type);
    return type;
  }, [currentProductionLine, currentCallData, currentLineInitiationData, call]);

  // Determine if Turning Section should be hidden (for ERC Mk-III)
  const shouldHideTurningSection = useMemo(() => {
    const ercTypeLower = String(productType).toLowerCase().trim();

    // Hide turning section ONLY for Mk-III (exact match, case-insensitive)
    const isMkIII = ercTypeLower === 'mk-iii' ||
      ercTypeLower === 'mk-3' ||
      ercTypeLower === 'mkiii' ||
      ercTypeLower === 'mk3';

    console.log('🔍 [Turning Section] Should hide turning section:', isMkIII);
    return isMkIII;
  }, [productType]);

  // Get lot numbers for active line - ONLY use cached initiation data (same source as Pre-Inspection)
  const availableLotNumbers = useMemo(() => {
    console.log('📋 [Grid Lot Numbers] Current line initiation data:', currentLineInitiationData);
    console.log('📋 [Grid Lot Numbers] Current production line:', currentProductionLine);

    // ONLY use lot numbers from cached initiation data (same source as Pre-Inspection)
    // This ensures the lot numbers in the grid match exactly what's shown in Pre-Inspection
    if (currentLineInitiationData) {
      // Check if lotDetailsList is available (contains all lots for this inspection)
      if (currentLineInitiationData.lotDetailsList && currentLineInitiationData.lotDetailsList.length > 0) {
        console.log('📋 [Grid Lot Numbers] Using lotDetailsList from API:', currentLineInitiationData.lotDetailsList);

        // Extract all lot numbers from lotDetailsList
        const allLotNumbers = currentLineInitiationData.lotDetailsList.map(lot => lot.lotNumber);
        console.log('✅ [Grid Lot Numbers] Using all lot numbers from lotDetailsList:', allLotNumbers);
        return allLotNumbers;
      } else {
        // Fallback to main lot number if lotDetailsList is not available
        const mainLotNumber = currentLineInitiationData.lotNumber || '';
        console.log('📋 [Grid Lot Numbers] Lot number from cached initiation data:', mainLotNumber);

        if (mainLotNumber) {
          console.log('✅ [Grid Lot Numbers] Using main lot number:', [mainLotNumber]);
          return [mainLotNumber];
        }
      }
    }

    // If no cached data, return empty array (no mock data)
    console.log('⚠️ [Grid Lot Numbers] No cached initiation data available, returning empty array');
    return [];
  }, [currentLineInitiationData, currentProductionLine]);

  const [shearingData, setShearingData] = useState(
    Array(8).fill(null).map((_, i) => ({
      hour: i + 1,
      noProduction: false,
      lotNo: '',
      // 3 inputs for Length of Cut Bar (float values)
      lengthCutBar: ['', '', ''],
      // 3 dropdowns for Quality / Improper Dia at end (OK / Not OK)
      qualityDia: ['', '', ''],
      // 3 dropdowns for Sharp Edges (OK / Not OK)
      sharpEdges: ['', '', ''],
      // 3 dropdowns for Cracked Edges (OK / Not OK)
      crackedEdges: ['', '', ''],
      // 4 inputs for Rejected Quantity (one below each column: Length, Quality, Sharp Edges, Cracked Edges)
      rejectedQty: ['', '', '', ''],
      remarks: ''
    }))
  );

  const [turningData, setTurningData] = useState(
    Array(8).fill(null).map((_, i) => ({
      hour: i + 1,
      noProduction: false,
      lotNo: '',
      // 3 inputs for Parallel Length (float values)
      parallelLength: ['', '', ''],
      // 3 inputs for Full Turning Length (float values)
      fullTurningLength: ['', '', ''],
      // 3 inputs for Turning Dia (float values)
      turningDia: ['', '', ''],
      // 3 inputs for Rejected Quantity (one below each column: Parallel Length, Full Turning Length, Turning Dia)
      rejectedQty: ['', '', ''],
      remarks: ''
    }))
  );

  // MPI Section - 8 Hour Grid
  const [mpiData, setMpiData] = useState(
    Array(8).fill(null).map((_, i) => ({
      hour: i + 1,
      noProduction: false,
      lotNo: '',
      // 3 dropdowns for MPI Results (OK / Not OK)
      testResults: ['', '', ''],
      // 1 input for Rejected Quantity
      rejectedQty: '',
      remarks: ''
    }))
  );

  // Forging Section - 8 Hour Grid
  const [forgingData, setForgingData] = useState(
    Array(8).fill(null).map((_, i) => ({
      hour: i + 1,
      noProduction: false,
      lotNo: '',
      // 2 inputs for Forging Temp. (float values)
      forgingTemperature: ['', ''],
      // 2 dropdowns for Forging Stabilisation Rejection (OK / Not OK)
      forgingStabilisation: ['', ''],
      // 2 dropdowns for Improper Forging (OK / Not OK)
      improperForging: ['', ''],
      // 2 dropdowns for Forging Defect (Marks/Notches) (OK / Not OK)
      forgingDefect: ['', ''],
      // 2 dropdowns for Embossing Defect (OK / Not OK)
      embossingDefect: ['', ''],
      // 5 separate rejection fields
      forgingTemperatureRejected: '',
      forgingStabilisationRejected: '',
      improperForgingRejected: '',
      forgingDefectRejected: '',
      embossingDefectRejected: '',
      remarks: ''
    }))
  );

  // Quenching Section - 8 Hour Grid
  const [quenchingData, setQuenchingData] = useState(
    Array(8).fill(null).map((_, i) => ({
      hour: i + 1,
      noProduction: false,
      lotNo: '',
      // 2 float inputs for Quenching Temp.
      quenchingTemperature: ['', ''],
      // 2 float inputs for Quenching Duration
      quenchingDuration: ['', ''],
      // 2 integer inputs for Quenching Hardness
      quenchingHardness: ['', ''],
      // 2 dropdowns for Box Gauge (OK / Not OK)
      boxGauge: ['', ''],
      // 2 dropdowns for Flat Bearing Area (OK / Not OK)
      flatBearingArea: ['', ''],
      // 2 dropdowns for Falling Gauge (OK / Not OK)
      fallingGauge: ['', ''],
      // 6 separate rejection fields
      quenchingTemperatureRejected: '',
      quenchingDurationRejected: '',
      quenchingHardnessRejected: '',
      boxGaugeRejected: '',
      flatBearingAreaRejected: '',
      fallingGaugeRejected: '',
      remarks: ''
    }))
  );

  // Tempering Section - 8 Hour Grid
  const [temperingData, setTemperingData] = useState(
    Array(8).fill(null).map((_, i) => ({
      hour: i + 1,
      noProduction: false,
      lotNo: '',
      temperingTemperature: ['', ''],
      temperingTemperatureRejected: '',
      temperingDuration: ['', ''],
      temperingDurationRejected: '',
      remarks: ''
    }))
  );

  // Final Check Section - 8 Hour Grid
  const [finalCheckData, setFinalCheckData] = useState(
    Array(8).fill(null).map((_, i) => ({
      hour: i + 1,
      noProduction: false,
      lotNo: '',
      // 2 dropdowns for Box Gauge (OK / Not OK)
      boxGauge: ['', ''],
      // 2 dropdowns for Flat Bearing Area (OK / Not OK)
      flatBearingArea: ['', ''],
      // 2 dropdowns for Falling Gauge (OK / Not OK)
      fallingGauge: ['', ''],
      // 2 dropdowns for Surface Defect (OK / Not OK)
      surfaceDefect: ['', ''],
      // 2 dropdowns for Embossing Defect (OK / Not OK)
      embossingDefect: ['', ''],
      // 2 dropdowns for Marking (OK / Not OK)
      marking: ['', ''],
      // 2 integer inputs for Tempering Hardness
      temperingHardness: ['', ''],
      // Rejection inputs for each measurement
      boxGaugeRejected: '',
      flatBearingAreaRejected: '',
      fallingGaugeRejected: '',
      surfaceDefectRejected: '',
      embossingDefectRejected: '',
      markingRejected: '',
      temperingHardnessRejected: '',
      remarks: ''
    }))
  );

  // Testing & Finishing Section - 8 Hour Grid
  const [testingFinishingData, setTestingFinishingData] = useState(
    Array(8).fill(null).map((_, i) => ({
      hour: i + 1,
      noProduction: false,
      lotNo: '',
      // 2 float inputs for Toe Load
      toeLoad: ['', ''],
      // 2 float inputs for Weight
      weight: ['', ''],
      // 2 dropdowns for Paint Identification (OK / not ok)
      paintIdentification: ['', ''],
      // 2 dropdowns for ERC Coating (Linseed Oil) (OK / not ok)
      ercCoating: ['', ''],
      // Rejection inputs for each measurement
      toeLoadRejected: '',
      weightRejected: '',
      paintIdentificationRejected: '',
      ercCoatingRejected: '',
      remarks: ''
    }))
  );

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  const inspectionCallNo = currentCallData?.call_no || call?.call_no || '';

  const shift = selectedShift; // A, B, C, G - provided by parent (Section B)

  // Track previous line to save data before switching
  const prevLineRef = useRef(activeLine);
  const prevPoNoRef = useRef(poNo);

  // Flag to prevent saving during initial load (prevents overwriting data with empty state)
  const isInitialLoadComplete = useRef(false);
  const hasDataBeenModified = useRef(false);

  /**
   * Save current grid data to localStorage
   * Only saves if initial load is complete and data has been modified
   */
  const saveCurrentDataToLocalStorage = useCallback(() => {
    // Check if session has ended (finish/shift complete/withhold)
    if (isSessionEnded()) {
      console.log('🛑 Session ended - blocking autosave');
      return;
    }

    if (!inspectionCallNo || !poNo) {
      console.log('Cannot save - missing inspectionCallNo or poNo:', { inspectionCallNo, poNo });
      return;
    }

    // Don't save during initial load to prevent overwriting existing data with empty state
    if (!isInitialLoadComplete.current) {
      console.log('Skipping save - initial load not complete');
      return;
    }

    // Only save if data has been modified by user
    if (!hasDataBeenModified.current) {
      console.log('Skipping save - no data modifications');
      return;
    }

    console.log('Saving grid data to localStorage:', { inspectionCallNo, poNo, activeLine });
    saveGridDataForLine(inspectionCallNo, poNo, activeLine, {
      shearing: shearingData,
      turning: turningData,
      mpi: mpiData,
      forging: forgingData,
      quenching: quenchingData,
      tempering: temperingData,
      finalCheck: finalCheckData,
      testingFinishing: testingFinishingData
    });
  }, [inspectionCallNo, poNo, activeLine, shearingData, turningData, mpiData, forgingData, quenchingData, temperingData, finalCheckData, testingFinishingData]);



  // Use refs to track current data and context for saving (avoids stale closure issues)
  const currentDataRef = useRef({
    shearing: shearingData,
    turning: turningData,
    mpi: mpiData,
    forging: forgingData,
    quenching: quenchingData,
    tempering: temperingData,
    finalCheck: finalCheckData,
    testingFinishing: testingFinishingData
  });

  const currentContextRef = useRef({
    inspectionCallNo,
    poNo,
    activeLine
  });

  // Compute hour labels - must be before useEffect that uses it
  const hourLabels = useMemo(() => getHourLabels(shift), [shift]);

  // Keep refs updated with latest data
  // Inject shift and hourLabel into each row before saving
  useEffect(() => {
    const enrich = (data) => {
      if (!data) return [];
      return data.map((row, idx) => ({
        ...row,
        shift: shift,
        hourLabel: hourLabels[idx] || ''
      }));
    };

    currentDataRef.current = {
      shearing: enrich(shearingData),
      turning: enrich(turningData),
      mpi: enrich(mpiData),
      forging: enrich(forgingData),
      quenching: enrich(quenchingData),
      tempering: enrich(temperingData),
      finalCheck: enrich(finalCheckData),
      testingFinishing: enrich(testingFinishingData)
    };
  }, [shearingData, turningData, mpiData, forgingData, quenchingData, temperingData, finalCheckData, testingFinishingData, shift, hourLabels]);

  // Keep context ref updated
  useEffect(() => {
    currentContextRef.current = {
      inspectionCallNo,
      poNo,
      activeLine
    };
  }, [inspectionCallNo, poNo, activeLine]);

  // Save to localStorage when data changes (debounced 500ms for faster persistence)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveCurrentDataToLocalStorage();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [shearingData, turningData, mpiData, forgingData, quenchingData, temperingData, finalCheckData, testingFinishingData, saveCurrentDataToLocalStorage]);

  // Save to localStorage on browser refresh/close and visibility change (uses refs to avoid stale closures)
  useEffect(() => {
    const saveCurrentData = () => {
      // Only save if initial load is complete and data has been modified
      if (!isInitialLoadComplete.current || !hasDataBeenModified.current) {
        console.log('Skipping beforeunload/visibility save - no modifications or initial load incomplete');
        return;
      }

      const { inspectionCallNo: callNo, poNo: po, activeLine: line } = currentContextRef.current;
      if (callNo && po && line) {
        console.log('Saving data on beforeunload/visibilitychange:', { callNo, po, line });
        saveGridDataForLine(callNo, po, line, currentDataRef.current);
      }
    };

    const saveOnUnmount = () => {
      // Check if session has ended (finish/shift complete/withhold)
      if (isSessionEnded()) {
        console.log('🛑 Session ended - blocking unmount save');
        return;
      }

      // Save immediately on unmount without checks - always save if we have context
      const { inspectionCallNo: callNo, poNo: po, activeLine: line } = currentContextRef.current;
      if (callNo && po && line && hasDataBeenModified.current) {
        console.log('Saving data on component unmount:', { callNo, po, line });
        saveGridDataForLine(callNo, po, line, currentDataRef.current);
      }
    };

    const handleBeforeUnload = () => {
      saveCurrentData();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveCurrentData();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Save on unmount using refs
      saveOnUnmount();
    };
  }, []); // Empty dependency - uses refs which always have latest values

  // Migrate old shearing data structure to new structure
  const migrateShearingData = useCallback((oldData) => {
    if (!oldData || oldData.length === 0) return oldData;

    return oldData.map(row => ({
      hour: row.hour,
      noProduction: row.noProduction || false,
      lotNo: row.lotNo || '',
      lengthCutBar: row.lengthCutBar || ['', '', ''],
      qualityDia: row.qualityDia || ['', '', ''], // New field
      sharpEdges: Array.isArray(row.sharpEdges) ?
        (typeof row.sharpEdges[0] === 'boolean' ? ['', '', ''] : row.sharpEdges) :
        ['', '', ''],
      crackedEdges: Array.isArray(row.crackedEdges) ?
        (typeof row.crackedEdges[0] === 'boolean' ? ['', '', ''] : row.crackedEdges) :
        ['', '', ''], // New field
      // Convert old rejectedQty to 4-element array
      rejectedQty: Array.isArray(row.rejectedQty) ?
        (row.rejectedQty.length === 4 ? row.rejectedQty : [...row.rejectedQty, '', '', ''].slice(0, 4)) :
        ['', '', '', ''],
      remarks: row.remarks || ''
    }));
  }, []);

  // Migrate old forging data structure to new structure
  const migrateForgingData = useCallback((oldData) => {
    if (!oldData || oldData.length === 0) return oldData;

    return oldData.map(row => ({
      hour: row.hour,
      noProduction: row.noProduction || false,
      lotNo: row.lotNo || '',
      // Convert old forgingTemperature (3 elements) to new structure (2 elements)
      forgingTemperature: Array.isArray(row.forgingTemperature) ?
        row.forgingTemperature.slice(0, 2) :
        ['', ''],
      // New fields
      forgingStabilisation: row.forgingStabilisation || ['', ''],
      improperForging: row.improperForging || ['', ''],
      forgingDefect: row.forgingDefect || ['', ''],
      embossingDefect: row.embossingDefect || ['', ''],
      // 5 separate rejection fields
      forgingTemperatureRejected: row.forgingTemperatureRejected || '',
      forgingStabilisationRejected: row.forgingStabilisationRejected || '',
      improperForgingRejected: row.improperForgingRejected || '',
      forgingDefectRejected: row.forgingDefectRejected || '',
      embossingDefectRejected: row.embossingDefectRejected || '',
      remarks: row.remarks || ''
    }));
  }, []);

  // Migrate old quenching data structure to new structure
  const migrateQuenchingData = useCallback((oldData) => {
    if (!oldData || oldData.length === 0) return oldData;

    return oldData.map(row => ({
      hour: row.hour,
      noProduction: row.noProduction || false,
      lotNo: row.lotNo || '',
      // Convert old quenchingTemperature (string) to new structure (2-element array)
      quenchingTemperature: typeof row.quenchingTemperature === 'string' ?
        [row.quenchingTemperature, ''] :
        (Array.isArray(row.quenchingTemperature) ? row.quenchingTemperature : ['', '']),
      // Convert old quenchingDuration (string) to new structure (2-element array)
      quenchingDuration: typeof row.quenchingDuration === 'string' ?
        [row.quenchingDuration, ''] :
        (Array.isArray(row.quenchingDuration) ? row.quenchingDuration : ['', '']),
      // Keep quenchingHardness as is (already 2-element array)
      quenchingHardness: Array.isArray(row.quenchingHardness) ? row.quenchingHardness : ['', ''],
      // New fields
      boxGauge: row.boxGauge || ['', ''],
      flatBearingArea: row.flatBearingArea || ['', ''],
      fallingGauge: row.fallingGauge || ['', ''],
      // 6 separate rejection fields
      quenchingTemperatureRejected: row.quenchingTemperatureRejected || '',
      quenchingDurationRejected: row.quenchingDurationRejected || '',
      quenchingHardnessRejected: row.quenchingHardnessRejected || '',
      boxGaugeRejected: row.boxGaugeRejected || '',
      flatBearingAreaRejected: row.flatBearingAreaRejected || '',
      fallingGaugeRejected: row.fallingGaugeRejected || '',
      remarks: row.remarks || ''
    }));
  }, []);

  // Migrate old tempering data structure to new structure
  const migrateTemperingData = useCallback((oldData) => {
    if (!oldData || oldData.length === 0) return oldData;

    return oldData.map(row => ({
      hour: row.hour,
      noProduction: row.noProduction || false,
      lotNo: row.lotNo || '',
      // Convert old single values to 2-element arrays
      temperingTemperature: typeof row.temperingTemperature === 'string' ?
        [row.temperingTemperature, ''] :
        (Array.isArray(row.temperingTemperature) ? row.temperingTemperature : ['', '']),
      temperingTemperatureRejected: row.temperingTemperatureRejected || '',
      temperingDuration: typeof row.temperingDuration === 'string' ?
        [row.temperingDuration, ''] :
        (Array.isArray(row.temperingDuration) ? row.temperingDuration : ['', '']),
      temperingDurationRejected: row.temperingDurationRejected || '',
      remarks: row.remarks || ''
    }));
  }, []);

  // Migrate old final check data structure to new structure
  const migrateFinalCheckData = useCallback((oldData) => {
    if (!oldData || oldData.length === 0) return oldData;

    return oldData.map(row => ({
      hour: row.hour,
      noProduction: row.noProduction || false,
      lotNo: row.lotNo || '',
      // New fields with default values
      boxGauge: row.boxGauge || ['', ''],
      flatBearingArea: row.flatBearingArea || ['', ''],
      fallingGauge: row.fallingGauge || ['', ''],
      surfaceDefect: row.surfaceDefect || ['', ''],
      embossingDefect: row.embossingDefect || ['', ''],
      marking: row.marking || ['', ''],
      temperingHardness: row.temperingHardness || ['', ''],
      // Rejection inputs for each measurement
      boxGaugeRejected: row.boxGaugeRejected || '',
      flatBearingAreaRejected: row.flatBearingAreaRejected || '',
      fallingGaugeRejected: row.fallingGaugeRejected || '',
      surfaceDefectRejected: row.surfaceDefectRejected || '',
      embossingDefectRejected: row.embossingDefectRejected || '',
      markingRejected: row.markingRejected || '',
      temperingHardnessRejected: row.temperingHardnessRejected || '',
      remarks: row.remarks || ''
    }));
  }, []);

  // Migrate old testing & finishing data structure to new structure
  const migrateTestingFinishingData = useCallback((oldData) => {
    if (!oldData || oldData.length === 0) return oldData;

    return oldData.map(row => ({
      hour: row.hour,
      noProduction: row.noProduction || false,
      lotNo: row.lotNo || '',
      // New fields with default values
      toeLoad: row.toeLoad || ['', ''],
      weight: row.weight || ['', ''],
      paintIdentification: row.paintIdentification || ['', ''],
      ercCoating: row.ercCoating || ['', ''],
      // 4 separate rejection fields
      toeLoadRejected: row.toeLoadRejected || '',
      weightRejected: row.weightRejected || '',
      paintIdentificationRejected: row.paintIdentificationRejected || '',
      ercCoatingRejected: row.ercCoatingRejected || '',
      remarks: row.remarks || ''
    }));
  }, []);

  // Default empty data generators for each section
  const getDefaultShearingData = useCallback(() =>
    Array(8).fill(null).map((_, i) => ({
      hour: i + 1, noProduction: false, lotNo: '',
      lengthCutBar: ['', '', ''], qualityDia: ['', '', ''], sharpEdges: ['', '', ''],
      crackedEdges: ['', '', ''], rejectedQty: ['', '', '', ''], remarks: ''
    })), []);

  const getDefaultTurningData = useCallback(() =>
    Array(8).fill(null).map((_, i) => ({
      hour: i + 1, noProduction: false, lotNo: '',
      parallelLength: ['', '', ''], fullTurningLength: ['', '', ''],
      turningDia: ['', '', ''], rejectedQty: ['', '', ''], remarks: ''
    })), []);

  const getDefaultMpiData = useCallback(() =>
    Array(8).fill(null).map((_, i) => ({
      hour: i + 1, noProduction: false, lotNo: '',
      testResults: ['', '', ''], rejectedQty: '', remarks: ''
    })), []);

  const getDefaultForgingData = useCallback(() =>
    Array(8).fill(null).map((_, i) => ({
      hour: i + 1, noProduction: false, lotNo: '',
      forgingTemperature: ['', ''], forgingStabilisation: ['', ''], improperForging: ['', ''],
      forgingDefect: ['', ''], embossingDefect: ['', ''],
      // 5 separate rejection fields
      forgingTemperatureRejected: '',
      forgingStabilisationRejected: '',
      improperForgingRejected: '',
      forgingDefectRejected: '',
      embossingDefectRejected: '',
      remarks: ''
    })), []);

  const getDefaultQuenchingData = useCallback(() =>
    Array(8).fill(null).map((_, i) => ({
      hour: i + 1, noProduction: false, lotNo: '',
      quenchingTemperature: ['', ''], quenchingDuration: ['', ''],
      quenchingHardness: ['', ''], boxGauge: ['', ''], flatBearingArea: ['', ''],
      fallingGauge: ['', ''],
      // 6 separate rejection fields
      quenchingTemperatureRejected: '',
      quenchingDurationRejected: '',
      quenchingHardnessRejected: '',
      boxGaugeRejected: '',
      flatBearingAreaRejected: '',
      fallingGaugeRejected: '',
      remarks: ''
    })), []);

  const getDefaultTemperingData = useCallback(() =>
    Array(8).fill(null).map((_, i) => ({
      hour: i + 1, noProduction: false, lotNo: '',
      temperingTemperature: ['', ''], temperingTemperatureRejected: '',
      temperingDuration: ['', ''], temperingDurationRejected: '',
      remarks: ''
    })), []);

  const getDefaultFinalCheckData = useCallback(() =>
    Array(8).fill(null).map((_, i) => ({
      hour: i + 1, noProduction: false, lotNo: '',
      boxGauge: ['', ''], flatBearingArea: ['', ''], fallingGauge: ['', ''],
      surfaceDefect: ['', ''], embossingDefect: ['', ''], marking: ['', ''],
      temperingHardness: ['', ''],
      boxGaugeRejected: '', flatBearingAreaRejected: '', fallingGaugeRejected: '',
      surfaceDefectRejected: '', embossingDefectRejected: '', markingRejected: '',
      temperingHardnessRejected: '', remarks: ''
    })), []);

  const getDefaultTestingFinishingData = useCallback(() =>
    Array(8).fill(null).map((_, i) => ({
      hour: i + 1, noProduction: false, lotNo: '',
      toeLoad: ['', ''], weight: ['', ''], paintIdentification: ['', ''],
      ercCoating: ['', ''],
      // 4 separate rejection fields
      toeLoadRejected: '',
      weightRejected: '',
      paintIdentificationRejected: '',
      ercCoatingRejected: '',
      remarks: ''
    })), []);

  /**
   * Fetch all 8-hour grid data - first from localStorage, then from backend
   * Reset to empty data if no saved data exists for the line
   */
  const fetchAllGridData = useCallback(async () => {
    if (!inspectionCallNo || !poNo) {
      console.log('fetchAllGridData: missing inspectionCallNo or poNo');
      return;
    }

    // Reset flags when loading new data
    isInitialLoadComplete.current = false;
    hasDataBeenModified.current = false;

    // Save previous line's data before loading new line (only if data was modified)
    if (prevLineRef.current && prevPoNoRef.current &&
      (prevLineRef.current !== activeLine || prevPoNoRef.current !== poNo)) {
      console.log('Saving previous line data before loading new line:', prevLineRef.current);
      // Force save when switching lines (bypass the modification check)
      saveGridDataForLine(inspectionCallNo, prevPoNoRef.current, prevLineRef.current, currentDataRef.current);
    }

    // Update refs to current line
    prevLineRef.current = activeLine;
    prevPoNoRef.current = poNo;

    console.log('fetchAllGridData: Loading data for', { inspectionCallNo, poNo, activeLine });

    // First try to load from localStorage directly
    const storedData = loadGridDataForLine(inspectionCallNo, poNo, activeLine);
    console.log('fetchAllGridData: storedData from localStorage:', storedData);

    // Check if any data exists for this line
    const hasShearing = storedData.shearing && storedData.shearing.length > 0;
    const hasTurning = storedData.turning && storedData.turning.length > 0;
    const hasMpi = storedData.mpi && storedData.mpi.length > 0;
    const hasForging = storedData.forging && storedData.forging.length > 0;
    const hasQuenching = storedData.quenching && storedData.quenching.length > 0;
    const hasTempering = storedData.tempering && storedData.tempering.length > 0;
    const hasFinalCheck = storedData.finalCheck && storedData.finalCheck.length > 0;

    console.log('fetchAllGridData: Has data flags:', {
      hasShearing, hasTurning, hasMpi, hasForging, hasQuenching, hasTempering, hasFinalCheck,
      shearingData: storedData.shearing
    });

    // Set data from localStorage if exists, otherwise reset to empty defaults
    if (hasShearing) {
      console.log('Setting shearing data from localStorage:', storedData.shearing);
      // Migrate old data structure to new structure
      const migratedData = migrateShearingData(storedData.shearing);
      setShearingData(migratedData);
    } else {
      setShearingData(getDefaultShearingData());
    }

    if (hasTurning) {
      console.log('Setting turning data from localStorage:', storedData.turning);
      setTurningData(storedData.turning);
    } else {
      setTurningData(getDefaultTurningData());
    }

    if (hasMpi) {
      setMpiData(storedData.mpi);
    } else {
      setMpiData(getDefaultMpiData());
    }

    if (hasForging) {
      console.log('Setting forging data from localStorage:', storedData.forging);
      // Migrate old data structure to new structure
      const migratedData = migrateForgingData(storedData.forging);
      setForgingData(migratedData);
    } else {
      setForgingData(getDefaultForgingData());
    }

    if (hasQuenching) {
      console.log('Setting quenching data from localStorage:', storedData.quenching);
      // Migrate old data structure to new structure
      const migratedData = migrateQuenchingData(storedData.quenching);
      setQuenchingData(migratedData);
    } else {
      setQuenchingData(getDefaultQuenchingData());
    }

    if (hasTempering) {
      console.log('Setting tempering data from localStorage:', storedData.tempering);
      // Migrate old data structure to new structure
      const migratedData = migrateTemperingData(storedData.tempering);
      setTemperingData(migratedData);
    } else {
      setTemperingData(getDefaultTemperingData());
    }

    if (hasFinalCheck) {
      console.log('Setting final check data from localStorage:', storedData.finalCheck);
      // Migrate old data structure to new structure
      const migratedData = migrateFinalCheckData(storedData.finalCheck);
      setFinalCheckData(migratedData);
    } else {
      setFinalCheckData(getDefaultFinalCheckData());
    }

    const hasTestingFinishing = storedData && storedData.testingFinishing;
    if (hasTestingFinishing) {
      console.log('Setting testing & finishing data from localStorage:', storedData.testingFinishing);
      // Migrate old data structure to new structure
      const migratedData = migrateTestingFinishingData(storedData.testingFinishing);
      setTestingFinishingData(migratedData);
    } else {
      setTestingFinishingData(getDefaultTestingFinishingData());
    }

    const hasLocalData = hasShearing || hasTurning || hasMpi || hasForging || hasQuenching || hasTempering || hasFinalCheck || hasTestingFinishing;

    // Mark initial load as complete after setting state from localStorage
    // Use setTimeout to ensure this runs after React state updates
    setTimeout(() => {
      isInitialLoadComplete.current = true;
      console.log('Initial load complete for line:', activeLine);
    }, 100);

    if (hasLocalData) {
      console.log('Grid data loaded from localStorage for line:', activeLine);
      return;
    }

    // If no localStorage data, fetch from backend
    setIsLoading(true);
    try {
      const [shearing, turning, mpi, forging, quenching, tempering, finalCheck] = await Promise.allSettled([
        shearingDataService.getByPoLine(inspectionCallNo, poNo, activeLine),
        turningDataService.getByPoLine(inspectionCallNo, poNo, activeLine),
        mpiDataService.getByPoLine(inspectionCallNo, poNo, activeLine),
        forgingDataService.getByPoLine(inspectionCallNo, poNo, activeLine),
        quenchingDataService.getByPoLine(inspectionCallNo, poNo, activeLine),
        temperingDataService.getByPoLine(inspectionCallNo, poNo, activeLine),
        finalCheckDataService.getByPoLine(inspectionCallNo, poNo, activeLine)
      ]);

      // Process fetched data if available
      if (shearing.status === 'fulfilled' && shearing.value?.responseData?.length > 0) {
        console.log('Shearing data loaded from backend');
      }
      if (turning.status === 'fulfilled' && turning.value?.responseData?.length > 0) {
        console.log('Turning data loaded from backend');
      }
      if (mpi.status === 'fulfilled' && mpi.value?.responseData?.length > 0) {
        console.log('MPI data loaded from backend');
      }
      if (forging.status === 'fulfilled' && forging.value?.responseData?.length > 0) {
        console.log('Forging data loaded from backend');
      }
      if (quenching.status === 'fulfilled' && quenching.value?.responseData?.length > 0) {
        console.log('Quenching data loaded from backend');
      }
      if (tempering.status === 'fulfilled' && tempering.value?.responseData?.length > 0) {
        console.log('Tempering data loaded from backend');
      }
      if (finalCheck.status === 'fulfilled' && finalCheck.value?.responseData?.length > 0) {
        console.log('Final Check data loaded from backend');
      }
    } catch (err) {
      console.log('Using default grid data:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [inspectionCallNo, poNo, activeLine, getDefaultShearingData, getDefaultTurningData, getDefaultMpiData, getDefaultForgingData, getDefaultQuenchingData, getDefaultTemperingData, getDefaultFinalCheckData, getDefaultTestingFinishingData, migrateShearingData, migrateForgingData, migrateQuenchingData, migrateTemperingData, migrateFinalCheckData, migrateTestingFinishingData]);

  // Load data on mount and when line/PO changes
  useEffect(() => {
    fetchAllGridData();
  }, [fetchAllGridData]);

  // transformToDto removed — was unused after removing the manual save handler

  // The manual SaveAll handler was removed (not used in UI).

  // Compute 8 one-hour labels based on shift
  const SHIFT_STARTS = {
    A: { h: 6, m: 0 },
    B: { h: 14, m: 0 },
    C: { h: 22, m: 0 },
    G: { h: 9, m: 0 },
    GENERAL: { h: 9, m: 0 }  // General shift: 9 AM - 5 PM
  };
  const pad = (n) => n.toString().padStart(2, '0');
  const format = (h, m) => `${((h % 12) || 12)}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
  const addHours = (h, m, dh) => ({ h: (h + dh) % 24, m });

  // Normalize shift to uppercase for consistent lookup (handles "General" vs "GENERAL")
  const normalizedShift = (shift || 'A').toString().trim().toUpperCase();

  const shiftLabel = (() => {
    const s = SHIFT_STARTS[normalizedShift] || SHIFT_STARTS.A;
    const end = addHours(s.h, s.m, 8);
    return `${shift} (${format(s.h, s.m)} - ${format(end.h, end.m)})`;
  })();

  const currentHourIndex = (() => {
    const now = new Date();
    const s = SHIFT_STARTS[normalizedShift] || SHIFT_STARTS.A;
    const base = new Date(now);
    base.setHours(s.h, s.m, 0, 0);
    // For C shift (22:00-06:00 next day), if now is after midnight but before 06:00, treat base as yesterday 22:00
    if (normalizedShift === 'C' && now.getHours() < 6) {
      base.setDate(base.getDate() - 1);
    }
    let diffMs = now.getTime() - base.getTime();
    let idx = Math.floor(diffMs / (60 * 60 * 1000));
    if (isNaN(idx) || idx < 0) idx = 0;
    if (idx > 7) idx = 7;
    return idx;
  })();

  // Per-section hour expand/collapse (current hour only vs all 8 hours)
  const [showAllShearing, setShowAllShearing] = useState(false);
  const [showAllTurning, setShowAllTurning] = useState(false);
  const [showAllMpi, setShowAllMpi] = useState(false);
  const [showAllForging, setShowAllForging] = useState(false);
  const [showAllQuenching, setShowAllQuenching] = useState(false);
  const [showAllTempering, setShowAllTempering] = useState(false);
  const [showAllDimension, setShowAllDimension] = useState(false);
  const [showAllTestingFinishing, setShowAllTestingFinishing] = useState(false);

  // Helper to select rows to render: all 8 hours or only the current hour (per-section)
  const visibleRows = (arr, showAll) => (
    (showAll ? arr.map((row, idx) => ({ row, idx }))
      : arr.map((row, idx) => ({ row, idx })).filter(({ idx }) => idx === currentHourIndex))
  );

  // Master "No Production" checkbox - toggles all sections at once
  // Check if ALL hours across ALL sections are marked as noProduction
  const allSectionsNoProduction = useMemo(() => {
    const allSections = [
      shearingData,
      turningData,
      mpiData,
      forgingData,
      quenchingData,
      temperingData,
      finalCheckData,
      testingFinishingData
    ];

    return allSections.every(sectionData =>
      sectionData.every(row => row.noProduction === true)
    );
  }, [shearingData, turningData, mpiData, forgingData, quenchingData, temperingData, finalCheckData, testingFinishingData]);

  // Handler for master "No Production" checkbox
  const handleMasterNoProduction = useCallback((checked) => {
    // Helper function to update all hours in a section
    const updateAllHours = (data, setterFn, resetFn) => {
      const newData = data.map((row, i) => {
        if (checked) {
          // When marking No Production = true, clear the entire hour data
          return {
            ...resetFn(i),
            noProduction: true
          };
        } else {
          // If unchecking No Production, just set the flag to false
          return {
            ...row,
            noProduction: false
          };
        }
      });
      setterFn(newData);
    };

    // Mark as modified
    hasDataBeenModified.current = true;

    // Update all sections with their specific reset logic
    updateAllHours(shearingData, setShearingData, (i) => ({
      hour: i + 1, lotNo: '', lengthCutBar: ['', '', ''], qualityDia: ['', '', ''],
      sharpEdges: ['', '', ''], crackedEdges: ['', '', ''], rejectedQty: ['', '', '', ''], remarks: ''
    }));

    updateAllHours(turningData, setTurningData, (i) => ({
      hour: i + 1, lotNo: '', parallelLength: ['', '', ''], fullTurningLength: ['', '', ''],
      turningDia: ['', '', ''], rejectedQty: ['', '', ''], remarks: ''
    }));

    updateAllHours(mpiData, setMpiData, (i) => ({
      hour: i + 1, lotNo: '', testResults: ['', '', ''], rejectedQty: '', remarks: ''
    }));

    updateAllHours(forgingData, setForgingData, (i) => ({
      hour: i + 1, lotNo: '', forgingTemperature: ['', ''], forgingStabilisation: ['', ''],
      improperForging: ['', ''], forgingDefect: ['', ''], embossingDefect: ['', ''],
      forgingTemperatureRejected: '', forgingStabilisationRejected: '', improperForgingRejected: '',
      forgingDefectRejected: '', embossingDefectRejected: '', remarks: ''
    }));

    updateAllHours(quenchingData, setQuenchingData, (i) => ({
      hour: i + 1, lotNo: '', quenchingTemperature: ['', ''], quenchingDuration: ['', ''],
      quenchingHardness: ['', ''], boxGauge: ['', ''], flatBearingArea: ['', ''],
      fallingGauge: ['', ''], quenchingTemperatureRejected: '', quenchingDurationRejected: '',
      quenchingHardnessRejected: '', boxGaugeRejected: '', flatBearingAreaRejected: '',
      fallingGaugeRejected: '', remarks: ''
    }));

    updateAllHours(temperingData, setTemperingData, (i) => ({
      hour: i + 1, lotNo: '', temperingTemperature: ['', ''], temperingTemperatureRejected: '',
      temperingDuration: ['', ''], temperingDurationRejected: '', remarks: ''
    }));

    updateAllHours(finalCheckData, setFinalCheckData, (i) => ({
      hour: i + 1, lotNo: '', boxGauge: ['', ''], flatBearingArea: ['', ''],
      fallingGauge: ['', ''], surfaceDefect: ['', ''], embossingDefect: ['', ''],
      marking: ['', ''], temperingHardness: ['', ''], boxGaugeRejected: '',
      flatBearingAreaRejected: '', fallingGaugeRejected: '', surfaceDefectRejected: '',
      embossingDefectRejected: '', markingRejected: '', temperingHardnessRejected: '', remarks: ''
    }));

    updateAllHours(testingFinishingData, setTestingFinishingData, (i) => ({
      hour: i + 1, lotNo: '', toeLoad: ['', ''], weight: ['', ''],
      paintIdentification: ['', ''], ercCoating: ['', ''], toeLoadRejected: '',
      weightRejected: '', paintIdentificationRejected: '', ercCoatingRejected: '', remarks: ''
    }));
  }, [shearingData, turningData, mpiData, forgingData, quenchingData, temperingData, finalCheckData, testingFinishingData]);

  // Wrapper functions to mark data as modified when user changes data
  const handleShearingChange = useCallback((newData) => {
    hasDataBeenModified.current = true;
    setShearingData(newData);
  }, []);

  const handleTurningChange = useCallback((newData) => {
    hasDataBeenModified.current = true;
    setTurningData(newData);
  }, []);

  const handleMpiChange = useCallback((newData) => {
    hasDataBeenModified.current = true;
    setMpiData(newData);
  }, []);

  const handleForgingChange = useCallback((newData) => {
    hasDataBeenModified.current = true;
    setForgingData(newData);
  }, []);

  const handleQuenchingChange = useCallback((newData) => {
    hasDataBeenModified.current = true;
    setQuenchingData(newData);
  }, []);

  const handleTemperingChange = useCallback((newData) => {
    hasDataBeenModified.current = true;
    setTemperingData(newData);
  }, []);

  const handleFinalCheckChange = useCallback((newData) => {
    hasDataBeenModified.current = true;
    setFinalCheckData(newData);
  }, []);

  const handleTestingFinishingChange = useCallback((newData) => {
    hasDataBeenModified.current = true;
    setTestingFinishingData(newData);
  }, []);

  return (
    <div>
      {/* 1. Submodule Navigation - Above everything */}
      <ProcessSubmoduleNav
        currentSubmodule="process-parameters-grid"
        onNavigate={onNavigateSubmodule}
      />

      {/* 2. Line Toggle */}
      {selectedLines && selectedLines.length > 0 && (
        <ProcessLineToggle selectedLines={selectedLines} activeLine={activeLine} onChange={setActiveLine} mapping={mapping} />
      )}

      {/* 3. Heading with Inspection Call Number */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-24)', gap: 'var(--space-16)', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Process Parameters - 8 Hour Grid {inspectionCallNo && <span style={{ color: '#0d9488', fontSize: 'var(--font-size-lg)' }}>- IC: {inspectionCallNo}</span>}</h1>
          <p className="page-subtitle">Process Material Inspection - Hourly production data entry</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, padding: '6px 10px', border: '1px solid var(--color-gray-300)', borderRadius: '8px', background: '#fff' }}>{shiftLabel}</span>
          <button className="btn btn-outline" onClick={onBack}>
            ← Back to Process Dashboard
          </button>
        </div>
      </div>

      {/* Master "No Production" Checkbox - Controls All Sections */}
      <div className="master-no-production-container">
        <label className="master-no-production-label">
          <input
            type="checkbox"
            checked={allSectionsNoProduction}
            onChange={(e) => handleMasterNoProduction(e.target.checked)}
            className="master-no-production-checkbox"
          />
          <span className="master-no-production-text">
            🚫 No Production (All Sections & All Hours)
          </span>
        </label>
        <p className="master-no-production-hint">
          Check this to mark all sections as "No Production" at once
        </p>
      </div>

      {/* Shearing Section */}
      <ShearingSection
        data={shearingData}
        onDataChange={handleShearingChange}
        availableLotNumbers={availableLotNumbers}
        hourLabels={hourLabels}
        visibleRows={visibleRows}
        showAll={showAllShearing}
        onToggleShowAll={() => setShowAllShearing(v => !v)}
        productType={productType}
      />

      {/* Debug indicator for turning section visibility */}
      {shouldHideTurningSection && (
        <div style={{ padding: '12px', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', marginBottom: '16px' }}>
          <strong>ℹ️ Turning Section Hidden:</strong> This section is not applicable for MK-III products.
        </div>
      )}

      {/* Turning Section - Hidden for ERC Mk-III */}
      {!shouldHideTurningSection && (
        <TurningSection
          data={turningData}
          onDataChange={handleTurningChange}
          availableLotNumbers={availableLotNumbers}
          hourLabels={hourLabels}
          visibleRows={visibleRows}
          showAll={showAllTurning}
          onToggleShowAll={() => setShowAllTurning(v => !v)}
          productType={productType}
        />
      )}

      {/* MPI Section - 8 Hour Grid */}
      <MpiSection
        data={mpiData}
        onDataChange={handleMpiChange}
        availableLotNumbers={availableLotNumbers}
        hourLabels={hourLabels}
        visibleRows={visibleRows}
        showAll={showAllMpi}
        onToggleShowAll={() => setShowAllMpi(v => !v)}
      />

      {/* Forging Section - 8 Hour Grid */}
      <ForgingSection
        data={forgingData}
        onDataChange={handleForgingChange}
        availableLotNumbers={availableLotNumbers}
        hourLabels={hourLabels}
        visibleRows={visibleRows}
        showAll={showAllForging}
        onToggleShowAll={() => setShowAllForging(v => !v)}
        productType={productType}
      />

      {/* Quenching Section - 8 Hour Grid */}
      <QuenchingSection
        data={quenchingData}
        onDataChange={handleQuenchingChange}
        availableLotNumbers={availableLotNumbers}
        hourLabels={hourLabels}
        visibleRows={visibleRows}
        showAll={showAllQuenching}
        onToggleShowAll={() => setShowAllQuenching(v => !v)}
        productType={productType}
      />

      {/* Tempering Section - 8 Hour Grid */}
      <TemperingSection
        data={temperingData}
        onDataChange={handleTemperingChange}
        availableLotNumbers={availableLotNumbers}
        hourLabels={hourLabels}
        visibleRows={visibleRows}
        showAll={showAllTempering}
        onToggleShowAll={() => setShowAllTempering(v => !v)}
        finalCheckData={finalCheckData}
        productType={productType}
      />

      {/* Final Check Section - 8 Hour Grid */}
      <FinalCheckSection
        data={finalCheckData}
        onDataChange={handleFinalCheckChange}
        availableLotNumbers={availableLotNumbers}
        hourLabels={hourLabels}
        visibleRows={visibleRows}
        showAll={showAllDimension}
        onToggleShowAll={() => setShowAllDimension(v => !v)}
        productType={productType}
      />

      {/* Testing & Finishing Section - 8 Hour Grid */}
      <TestingFinishingSection
        data={testingFinishingData}
        onDataChange={handleTestingFinishingChange}
        availableLotNumbers={availableLotNumbers}
        hourLabels={hourLabels}
        visibleRows={visibleRows}
        showAll={showAllTestingFinishing}
        onToggleShowAll={() => setShowAllTestingFinishing(v => !v)}
        productType={productType}
      />

      {isLoading && (
        <div className="alert alert-info" style={{ marginBottom: 'var(--space-16)' }}>
          Loading grid data...
        </div>
      )}

      {/* <div style={{ marginTop: 'var(--space-24)', display: 'flex', gap: 'var(--space-16)', justifyContent: 'flex-end' }}>
        <button className="btn btn-outline" onClick={onBack}>Cancel</button>
        <button
          className="btn btn-primary"
          onClick={handleSaveAll}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save & Continue'}
        </button>
      </div> */}
    </div>
  );
};

export default ProcessParametersGridPage;

