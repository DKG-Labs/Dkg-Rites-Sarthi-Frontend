import { useState, useCallback, useEffect } from "react";
import FormField from "../components/FormField";
import { formatDate, formatPoNoWithSerial } from "../utils/helpers";
import { markAsWithheld } from '../services/callStatusService';
import { useInspection } from '../context/InspectionContext';
import {
  getFinalDashboardData,
  saveCumulativeResults,
  saveInspectionSummary,
  saveLotResults
} from '../services/finalProductInspectionService';
import { getHardnessToeLoadAQL, getDimensionWeightAQL } from '../utils/is2500Calculations';
import { finishInspection } from '../services/finalInspectionSubmoduleService';
import { performTransitionAction } from '../services/workflowService';
import { getStoredUser } from '../services/authService';
import "./FinalProductDashboard.css";

// Reason options for withheld inspection
const WITHHELD_REASONS = [
  { value: '', label: 'Select Reason *' },
  { value: 'MATERIAL_NOT_AVAILABLE', label: 'Full quantity of material not available with firm at the time of inspection' },
  { value: 'PLACE_NOT_AS_PER_PO', label: 'Place of inspection is not as per the PO' },
  { value: 'VENDOR_WITHDRAWN', label: 'Vendor has withdrawn the inspection call' },
  { value: 'ANY_OTHER', label: 'Any other' },
];

// localStorage key for dashboard draft data
const DASHBOARD_DRAFT_KEY = 'fp_dashboard_draft_';

export default function FinalProductDashboard({ onBack, onNavigateToSubModule }) {
  const { selectedCall, getFpCachedData, updateFpDashboardDataCache } = useInspection();

  // State for live data
  const [poData, setPoData] = useState(null);
  const [lotsFromVendorCall, setLotsFromVendorCall] = useState([]);
  const [testResultsPerLot, setTestResultsPerLot] = useState({});
  const [rejectedCountsPerLot, setRejectedCountsPerLot] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [pauseSuccessData, setPauseSuccessData] = useState(null); // for pause success modal
  const [pauseErrorData, setPauseErrorData] = useState(null);    // for pause failure modal
  const [showPauseConfirm, setShowPauseConfirm] = useState(false); // for pause confirmation modal

  // Calculate Rejected Counts (R1 + R2) per lot from all submodules
  useEffect(() => {
    if (!selectedCall?.call_no || lotsFromVendorCall.length === 0) return;

    const callNo = selectedCall.call_no;
    const counts = {};

    lotsFromVendorCall.forEach(lot => {
      let totalRejected = 0;

      // 1. Visual & Dimensional
      try {
        const stored = localStorage.getItem(`visualDimensionalData_${callNo}`);
        if (stored) {
          const data = JSON.parse(stored)[lot.lotNo];
          if (data) {
            // Visual R1 + R2
            totalRejected += (parseInt(data.visualR1) || 0) + (parseInt(data.visualR2) || 0);

            // Dimensional (Go/NoGo/Flat) for 1st & 2nd sampling
            // Note: In FinalVisualDimensionalPage, they are stored as separate fields
            const dim1 = (parseInt(data.dimGo1) || 0) + (parseInt(data.dimNoGo1) || 0) + (parseInt(data.dimFlat1) || 0);
            const dim2 = (parseInt(data.dimGo2) || 0) + (parseInt(data.dimNoGo2) || 0) + (parseInt(data.dimFlat2) || 0);
            totalRejected += dim1 + dim2;
          }
        }
      } catch (e) { console.error('Error reading Visual/Dim data:', e); }

      // 2. Hardness (Values outside 40-44)
      try {
        const stored = localStorage.getItem(`hardnessTestData_${callNo}`);
        if (stored) {
          const data = JSON.parse(stored)[lot.lotNo];
          if (data) {
            const r1 = (data.hardness1st || []).filter(v => v && (parseFloat(v) < 40 || parseFloat(v) > 44)).length;
            const r2 = (data.hardness2nd || []).filter(v => v && (parseFloat(v) < 40 || parseFloat(v) > 44)).length;
            totalRejected += r1 + r2;
          }
        }
      } catch (e) { console.error('Error reading Hardness data:', e); }

      // 3. Toe Load (Values outside tolerance based on Spring Type)
      try {
        const stored = localStorage.getItem(`toeLoadTestData_${callNo}`);
        if (stored) {
          const data = JSON.parse(stored)[lot.lotNo];
          if (data) {
            const springType = lot.springType || selectedCall?.ercType || 'MK-III';
            const min = springType === 'MK-V' ? 1200 : (springType === 'ERC-J' ? 650 : 850);
            const max = springType === 'MK-V' ? 1500 : (springType === 'ERC-J' ? Infinity : 1100);

            const check = (v) => {
              if (!v) return false;
              const val = parseFloat(v);
              if (isNaN(val)) return false;
              if (springType === 'ERC-J') return val <= 650; // ERC-J > 650 is Pass, so <= 650 is Fail
              return val < min || val > max;
            };

            const r1 = (data.toe1st || []).filter(check).length;
            const r2 = (data.toe2nd || []).filter(check).length;

            // ERC-J special case: value > 650 is PASS. So <= 650 is FAIL.
            // MK-III/V: value within range is PASS. Outside is FAIL.
            totalRejected += r1 + r2;
          }
        }
      } catch (e) { console.error('Error reading Toe Load data:', e); }

      // 4. Weight (Values < Min Weight)
      try {
        const stored = localStorage.getItem(`weightTestData_${callNo}`);
        if (stored) {
          const data = JSON.parse(stored)[lot.lotNo];
          if (data) {
            const springType = lot.springType || selectedCall?.ercType || 'MK-III';
            const minWeight = springType === 'MK-V' ? 1068 : 904; // ERC-J and MK-III are 904

            const check = (v) => v && !isNaN(parseFloat(v)) && parseFloat(v) < minWeight;

            const r1 = (data.weight1st || []).filter(check).length;
            const r2 = (data.weight2nd || []).filter(check).length;
            totalRejected += r1 + r2;
          }
        }
      } catch (e) { console.error('Error reading Weight data:', e); }

      // 5. Deflection & Application Test (plus Dimensional if stored here)
      try {
        const stored = localStorage.getItem(`deflectionTestData_${callNo}`);
        if (stored) {
          const data = JSON.parse(stored)[lot.lotNo];
          if (data) {
            // Application & Deflection R1 + R2
            const defR1 = parseInt(data.deflectionR1) || 0;
            const defR2 = parseInt(data.deflectionR2) || 0;
            totalRejected += defR1 + defR2;

            // Dimensional (Go/NoGo/Flat) - stored here as well in FinalApplicationDeflectionPage
            const dim1 = (parseInt(data.dimGo1) || 0) + (parseInt(data.dimNoGo1) || 0) + (parseInt(data.dimFlat1) || 0);
            const dim2 = (parseInt(data.dimGo2) || 0) + (parseInt(data.dimNoGo2) || 0) + (parseInt(data.dimFlat2) || 0);
            totalRejected += dim1 + dim2;
          }
        }
      } catch (e) { console.error('Error reading Deflection/App data:', e); }

      // 6. Inclusion Rating, Decarb, Microstructure, Freedom from Defects
      try {
        const stored = localStorage.getItem(`inclusionRatingData_${callNo}`);
        if (stored) {
          const data = JSON.parse(stored)[lot.lotNo];
          if (data) {
            // Microstructure Rejection
            const micro1 = (data.microstructure1st || []).filter(v => v === 'Not Tempered Martensite').length;
            const micro2 = (data.microstructure2nd || []).filter(v => v === 'Not Tempered Martensite').length;

            // Decarb Rejection (Max 0.8)
            const maxDecarb = lot.maxDecarb || 0.8;
            const decarb1 = (data.decarb1st || []).filter(v => v !== '' && parseFloat(v) > maxDecarb).length;
            const decarb2 = (data.decarb2nd || []).filter(v => v !== '' && parseFloat(v) > maxDecarb).length;

            // Inclusion Rejection (> 2.0)
            const checkInc = (sample) => ['A', 'B', 'C', 'D'].some(k => sample[k] !== '' && parseFloat(sample[k]) > 2.0);
            const inc1 = (data.inclusion1st || []).filter(checkInc).length;
            const inc2 = (data.inclusion2nd || []).filter(checkInc).length;

            // Defects Rejection
            const def1 = (data.defects1st || []).filter(v => v === 'NOT OK').length;
            const def2 = (data.defects2nd || []).filter(v => v === 'NOT OK').length;

            totalRejected += (micro1 + micro2 + decarb1 + decarb2 + inc1 + inc2 + def1 + def2);
          }
        }
      } catch (e) { console.error('Error reading Inclusion Rating data:', e); }

      counts[lot.lotNo] = totalRejected;
    });

    setRejectedCountsPerLot(counts);
  }, [selectedCall?.call_no, lotsFromVendorCall, testResultsPerLot, selectedCall?.ercType]);

  // Fetch live data from backend with caching
  useEffect(() => {
    const fetchLiveData = async () => {
      if (!selectedCall?.call_no) {
        console.warn('⚠️ No selected call found');
        setIsLoading(false);
        setLoadError('No inspection call selected');
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);
        console.log('📥 Fetching Final Product dashboard data for call:', selectedCall.call_no);

        // Check cache first - IMPORTANT: Use cached data to avoid unnecessary API calls
        const cachedData = getFpCachedData(selectedCall.call_no);
        if (cachedData.isCached && cachedData.dashboardData) {
          console.log('✅ Using cached dashboard data for call:', selectedCall.call_no);
          console.log('💾 Cache is fresh - skipping API call');
          const dashboardData = cachedData.dashboardData;
          processDashboardData(dashboardData);
          setIsLoading(false);
          return;
        }

        // Only fetch from API if cache is not available or expired
        console.log('🔄 Cache expired or not available - fetching dashboard data from API...');
        const dashboardData = await getFinalDashboardData(selectedCall.call_no);
        console.log('✅ Dashboard data fetched from API:', dashboardData);

        // Cache the data for future navigation
        updateFpDashboardDataCache(selectedCall.call_no, dashboardData);
        console.log('💾 Dashboard data cached for call:', selectedCall.call_no);
        console.log('💾 Cached finalLotDetails:', dashboardData?.finalLotDetails);

        // Process the data
        processDashboardData(dashboardData);
      } catch (error) {
        console.error('❌ Error fetching Final Product dashboard data:', error);
        setLoadError(error.message || 'Failed to load inspection data');
      } finally {
        setIsLoading(false);
      }
    };

    // Helper function to process dashboard data
    const processDashboardData = (dashboardData) => {
      // Extract and set PO data - Map backend response to frontend format
      if (dashboardData?.poData) {
        const mappedPoData = {
          po_no: formatPoNoWithSerial(dashboardData.poData.poNo, dashboardData.poData.poSerialNo),
          po_date: dashboardData.poData.poDate || '',
          contractor: dashboardData.poData.vendorName || '',
          manufacturer: dashboardData.poData.vendorName || (dashboardData.finalLotDetails?.[0]?.manufacturer || ''),
          // Additional fields for reference
          poSerialNo: dashboardData.poData.poSerialNo || '',
          inspPlace: dashboardData.poData.inspPlace || '',
          itemDesc: dashboardData.poData.itemDesc || '',
          unit: dashboardData.poData.unit || 'Nos.',
          poQty: dashboardData.poData.poQty || 0,
          poSrQty: dashboardData.poData.poSrQty || 0,
          cummQtyOfferedPreviously: dashboardData.poData.cummQtyOfferedPreviously || 0,
          cummQtyPassedPreviously: dashboardData.poData.cummQtyPassedPreviously || 0,
          cummQtyRejectedPreviously: dashboardData.poData.cummQtyRejectedPreviously || 0,
          rlyCd: dashboardData.poData.rlyCd || '',
          rlyShortName: dashboardData.poData.rlyShortName || '',
          place_of_inspection: dashboardData.poData.companyName
            ? `${dashboardData.poData.companyName}${dashboardData.poData.unitName ? ' (' + dashboardData.poData.unitName + ')' : ''}${dashboardData.poData.unitAddress ? ' - ' + dashboardData.poData.unitAddress : ''}`
            : (dashboardData.poData.inspPlace || '')
        };
        setPoData(mappedPoData);
        console.log('✅ PO Data mapped and set:', mappedPoData);
      } else {
        console.warn('⚠️ No PO data in response');
        setPoData({});
      }

      // Extract and set lots
      if (dashboardData?.finalLotDetails && Array.isArray(dashboardData.finalLotDetails)) {
        const mappedLots = dashboardData.finalLotDetails.map(lot => ({
          lotNo: lot.lotNumber,
          heatNo: lot.heatNumber,
          lotSize: lot.offeredQty || 0,
          noOfBags: lot.noOfBags || 0,
          manufacturer: lot.manufacturer,
          manufacturerHeat: lot.manufacturerHeat,
          springType: lot.springType || selectedCall?.ercType // Store spring type
        }));
        setLotsFromVendorCall(mappedLots);
        console.log('✅ Lots set:', mappedLots);
      } else {
        console.warn('⚠️ No lots in response');
        setLotsFromVendorCall([]);
      }

      // Initialize test results
      const results = {};
      if (dashboardData?.finalLotDetails && Array.isArray(dashboardData.finalLotDetails)) {
        dashboardData.finalLotDetails.forEach(lot => {
          results[lot.lotNumber] = {
            calibration: "Pending",
            visualDim: "Pending",
            hardness: "Pending",
            inclusion: "Pending",
            deflection: "Pending",
            toeLoad: "Pending",
            weight: "Pending",
            chemical: "Pending"
          };
        });
      }
      setTestResultsPerLot(results);
      console.log('✅ Test results initialized:', results);

      console.log('✅ All dashboard data loaded successfully');
    };

    fetchLiveData();
  }, [selectedCall?.call_no, selectedCall?.po_no, getFpCachedData, updateFpDashboardDataCache, selectedCall?.ercType]);

  // Validation function for calibration data
  // Calibration is call-level (not per-lot): all 5 checkboxes must be verified
  const validateCalibrationData = useCallback((data) => {
    if (!data) return 'Pending';
    const requiredKeys = ['rdsoApproval', 'rawMaterialIC', 'dimensionCheck', 'packingList', 'rdsoGauges'];
    const allVerified = requiredKeys.every(key => data[key]?.verified === true);
    return allVerified ? 'OK' : 'Pending';
  }, []);

  // Validation function for visual & dimensional data
  const validateVisualDimensionalData = useCallback((lotData, lot) => {
    if (!lotData) return 'Pending';
    // Check if any visual or dimensional data is filled
    const hasVisualData = lotData.visualR1 || lotData.visualR2;
    const hasDimData = lotData.dimGo1 || lotData.dimNoGo1 || lotData.dimFlat1;

    if (!hasVisualData && !hasDimData) return 'Pending';

    // Get AQL values based on Lot Size using central utility
    const aql = getDimensionWeightAQL(lot?.lotSize || 0);

    // Check Visual
    const vR1 = parseInt(lotData.visualR1) || 0;
    const vR2 = parseInt(lotData.visualR2) || 0;
    const vTotal = vR1 + vR2;

    if (vR1 >= aql.re1) return 'NOT OK';
    if (!aql.useSingleSampling && vTotal >= aql.cummRej) return 'NOT OK';

    // Check Dimensional (Sum of Go/NoGo/Flat)
    const dR1 = (parseInt(lotData.dimGo1) || 0) + (parseInt(lotData.dimNoGo1) || 0) + (parseInt(lotData.dimFlat1) || 0);
    const dR2 = (parseInt(lotData.dimGo2) || 0) + (parseInt(lotData.dimNoGo2) || 0) + (parseInt(lotData.dimFlat2) || 0);
    const dTotal = dR1 + dR2;

    if (dR1 >= aql.re1) return 'NOT OK';
    if (!aql.useSingleSampling && dTotal >= aql.cummRej) return 'NOT OK';

    return 'OK';
  }, []);

  // Validation function for hardness test data
  const validateHardnessData = useCallback((lotData, lot) => {
    if (!lotData) return 'Pending';
    // Get AQL using central utility
    const aql = getHardnessToeLoadAQL(lot?.lotSize || 0);

    const h1 = (lotData.hardness1st || []).filter(v => v && (parseFloat(v) < 40 || parseFloat(v) > 44)).length;
    const h2 = (lotData.hardness2nd || []).filter(v => v && (parseFloat(v) < 40 || parseFloat(v) > 44)).length;

    const hasData = (lotData.hardness1st || []).some(v => !!v);
    if (!hasData) return 'Pending';

    if (h1 >= aql.re1) return 'NOT OK';
    if (!aql.useSingleSampling && (h1 + h2) >= aql.cummRej) return 'NOT OK';

    return 'OK';
  }, []);

  const validateInclusionData = useCallback((lotData, lot) => {
    if (!lotData) return 'Pending';

    // Check if any data exists
    const hasData = (lotData.microstructure1st || []).some(v => v) ||
      (lotData.decarb1st || []).some(v => v) ||
      (lotData.defects1st || []).some(v => v);

    // Also check inclusion object array
    const hasIncData = (lotData.inclusion1st || []).some(s => s.A || s.B || s.C || s.D);

    if (!hasData && !hasIncData && !lotData.remarks) return 'Pending';

    // Calculate Failures
    // Microstructure
    const micro1 = (lotData.microstructure1st || []).filter(v => v === 'Not Tempered Martensite').length;
    const micro2 = (lotData.microstructure2nd || []).filter(v => v === 'Not Tempered Martensite').length;

    // Decarb (Max 0.8)
    const maxDecarb = lot.maxDecarb || 0.8;
    const decarb1 = (lotData.decarb1st || []).filter(v => v !== '' && parseFloat(v) > maxDecarb).length;
    const decarb2 = (lotData.decarb2nd || []).filter(v => v !== '' && parseFloat(v) > maxDecarb).length;

    // Inclusion (> 2.0)
    const checkInc = (sample) => ['A', 'B', 'C', 'D'].some(k => sample[k] !== '' && parseFloat(sample[k]) > 2.0);
    const inc1 = (lotData.inclusion1st || []).filter(checkInc).length;
    const inc2 = (lotData.inclusion2nd || []).filter(checkInc).length;

    // Defects
    const def1 = (lotData.defects1st || []).filter(v => v === 'NOT OK').length;
    const def2 = (lotData.defects2nd || []).filter(v => v === 'NOT OK').length;



    // Logic from FinalInclusionRatingPage: Ac1: 0 | Re1: 2 | Cumm: 2
    // Failing if any individual test has R1 > 1 or R1+R2 > 1
    const microFail = micro1 > 1 || (micro1 + micro2) > 1;
    const decarbFail = decarb1 > 1 || (decarb1 + decarb2) > 1;
    const incFail = inc1 > 1 || (inc1 + inc2) > 1;
    const defFail = def1 > 1 || (def1 + def2) > 1;

    if (microFail || decarbFail || incFail || defFail) return 'NOT OK';

    return 'OK';
  }, []);

  // Validation function for deflection test data
  const validateDeflectionData = useCallback((lotData, lot) => {
    if (!lotData) return 'Pending';

    // Check if data exists
    const hasData = lotData.deflectionR1 || lotData.deflectionR2 || lotData.dimGo1 || lotData.dimNoGo1; // Check both defl and dim fields
    if (!hasData) return 'Pending';

    // AQL Check (Same as Visual/Dim AQL)
    const aql = getDimensionWeightAQL(lot.lotSize || 0);

    // 1. Check Deflection Failures
    const defR1 = parseInt(lotData.deflectionR1) || 0;
    const defR2 = parseInt(lotData.deflectionR2) || 0;
    const defTotal = defR1 + defR2;

    if (defR1 >= aql.re1) return 'NOT OK';
    if (!aql.useSingleSampling && defTotal >= aql.cummRej) return 'NOT OK';

    // 2. Check Dimensional Failures (if stored here)
    const dim1 = (parseInt(lotData.dimGo1) || 0) + (parseInt(lotData.dimNoGo1) || 0) + (parseInt(lotData.dimFlat1) || 0);
    const dim2 = (parseInt(lotData.dimGo2) || 0) + (parseInt(lotData.dimNoGo2) || 0) + (parseInt(lotData.dimFlat2) || 0);
    const dimTotal = dim1 + dim2;

    if (dim1 >= aql.re1) return 'NOT OK';
    if (!aql.useSingleSampling && dimTotal >= aql.cummRej) return 'NOT OK';

    return 'OK';
  }, []);

  // Validation function for toe load test data
  const validateToeLoadData = useCallback((lotData, lot) => {
    if (!lotData) return 'Pending';

    // Spring Type Logic
    const springType = lot.springType || 'MK-III';
    const min = springType === 'MK-V' ? 1200 : (springType === 'ERC-J' ? 650 : 850);
    const max = springType === 'MK-V' ? 1500 : (springType === 'ERC-J' ? Infinity : 1100);

    // Get AQL using central utility
    const aql = getHardnessToeLoadAQL(lot.lotSize || 0);

    const check = (v) => {
      if (!v) return false;
      const val = parseFloat(v);
      if (isNaN(val)) return false;
      if (springType === 'ERC-J') return val <= 650;
      return val < min || val > max;
    };

    const r1 = (lotData.toe1st || []).filter(check).length;
    const r2 = (lotData.toe2nd || []).filter(check).length;

    const hasData = (lotData.toe1st || []).some(v => !!v);
    if (!hasData) return 'Pending';

    if (r1 >= aql.re1) return 'NOT OK';
    if ((r1 + r2) >= aql.cummRej) return 'NOT OK';

    return 'OK';
  }, []);

  // Validation function for weight test data
  const validateWeightData = useCallback((lotData, lot) => {
    if (!lotData) return 'Pending';

    const springType = lot.springType || 'MK-III';
    const minWeight = springType === 'MK-V' ? 1068 : 904;

    // Get AQL using central utility
    const aql = getDimensionWeightAQL(lot?.lotSize || 0);

    const check = (v) => v && !isNaN(parseFloat(v)) && parseFloat(v) < minWeight;

    const r1 = (lotData.weight1st || []).filter(check).length;
    const r2 = (lotData.weight2nd || []).filter(check).length;

    const hasData = (lotData.weight1st || []).some(v => !!v);
    if (!hasData) return 'Pending';

    if (r1 >= aql.re1) return 'NOT OK';
    if (!aql.useSingleSampling && (r1 + r2) >= aql.cummRej) return 'NOT OK';

    return 'OK';
  }, []);

  // Validation function for chemical analysis data
  const validateChemicalData = useCallback((allChemData, lot) => {
    if (!allChemData || !allChemData.chemValues) return 'Pending';

    const lotNo = lot.lotNo;
    const heatNo = lot.heatNo;
    const chemValues = allChemData.chemValues[lotNo];
    const ladleValues = allChemData.ladleValues || [];

    if (!chemValues || Object.keys(chemValues).length === 0) return 'Pending';

    // Find ladle values for this lot
    const ladleData = ladleValues.find(l => l.lotNo === lotNo || l.heatNo === heatNo);
    if (!ladleData) return 'Pending';

    const ladleAnalysis = {
      c: ladleData.percentC || 0,
      si: ladleData.percentSi || 0,
      mn: ladleData.percentMn || 0,
      s: ladleData.percentS || 0,
      p: ladleData.percentP || 0
    };

    const elementRanges = {
      c: { min: 0.5, max: 0.6 },
      mn: { min: 0.8, max: 1.0 },
      si: { min: 1.5, max: 2.0 },
      s: { min: 0, max: 0.03 },
      p: { min: 0, max: 0.03 },
    };

    const tolerances = {
      c: 0.03,
      mn: 0.04,
      si: 0.05,
      s: 0.005,
      p: 0.005,
    };

    const elements = ['c', 'si', 'mn', 's', 'p'];

    for (const element of elements) {
      const productValue = chemValues[element];
      const ladleValue = ladleAnalysis[element];

      if (productValue === undefined || productValue === "") return 'Pending';

      const pVal = parseFloat(productValue);
      const lVal = parseFloat(ladleValue);
      const range = elementRanges[element];
      const tolerance = tolerances[element];

      if (isNaN(pVal)) return 'Pending';

      // Special rule for Sulphur and Phosphorus: only upper bound check against ladle
      if (element === "s" || element === "p") {
        if (pVal > (lVal + tolerance)) return 'NOT OK';
      } else {
        // Standard rule for Carbon, Silicon, Manganese (± tolerance)
        const diff = Math.abs(pVal - lVal);
        const withinTolerance = diff <= (tolerance + 0.0001);

        // Ensure it's within "Permissible Variation" limits
        const expandedMin = range.min - tolerance;
        const expandedMax = range.max + tolerance;
        const withinExpandedRange = pVal >= (expandedMin - 0.0001) && pVal <= (expandedMax + 0.0001);

        if (!withinTolerance || !withinExpandedRange) return 'NOT OK';
      }
    }

    return 'OK';
  }, []);

  // Update test results from submodule data stored in sessionStorage
  const updateTestResultsFromStorage = useCallback(() => {
    const callNo = selectedCall?.call_no;
    if (!callNo || lotsFromVendorCall.length === 0) return;

    setTestResultsPerLot(prevResults => {
      const updatedResults = { ...prevResults };
      let hasUpdates = false;

      // Check each submodule's stored data and update test results
      const submoduleKeys = [
        { key: 'calibrationDocumentsData_', testName: 'calibration', validator: validateCalibrationData },
        { key: 'visualDimensionalData_', testName: 'visualDim', validator: validateVisualDimensionalData },
        { key: 'hardnessTestData_', testName: 'hardness', validator: validateHardnessData },
        { key: 'inclusionRatingData_', testName: 'inclusion', validator: validateInclusionData },
        { key: 'deflectionTestData_', testName: 'deflection', validator: validateDeflectionData },
        { key: 'toeLoadTestData_', testName: 'toeLoad', validator: validateToeLoadData },
        { key: 'weightTestData_', testName: 'weight', validator: validateWeightData },
        { key: 'chemicalAnalysisData_', testName: 'chemical', validator: validateChemicalData }
      ];

      submoduleKeys.forEach(({ key, testName, validator }) => {
        const storageKey = `${key}${callNo}`;
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
          try {
            const data = JSON.parse(storedData);
            // Update test results for each lot based on stored data
            lotsFromVendorCall.forEach(lot => {
              const lotNo = lot.lotNo;
              // Calibration and chemical are call-level (not per-lot), pass whole data object
              const lotData = (testName === 'chemical' || testName === 'calibration') ? data : data[lotNo];
              // Pass lot object to validator for AQL checks
              const status = validator(lotData, lot);

              if (!updatedResults[lotNo]) updatedResults[lotNo] = {}; // Ensure lot object exists

              if (updatedResults[lotNo][testName] !== status) {
                // console.log(`📊 Status update for lot ${lotNo}, test ${testName}: ${updatedResults[lotNo][testName]} -> ${status}`);
                updatedResults[lotNo][testName] = status;
                hasUpdates = true;
              }
            });
          } catch (e) {
            console.error(`Error reading ${storageKey}:`, e);
          }
        }
      });

      if (hasUpdates) {
        console.log('✅ Test results updated:', updatedResults);
      }
      return hasUpdates ? updatedResults : prevResults;
    });
  }, [selectedCall?.call_no, lotsFromVendorCall, validateCalibrationData, validateVisualDimensionalData, validateHardnessData, validateInclusionData, validateDeflectionData, validateToeLoadData, validateWeightData, validateChemicalData]);

  // Update test results when component mounts or when returning from submodule
  useEffect(() => {
    updateTestResultsFromStorage();
  }, [selectedCall?.call_no, updateTestResultsFromStorage]);

  // Listen for storage changes (when user saves data in submodules)
  useEffect(() => {
    const handleStorageChange = () => updateTestResultsFromStorage();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, [updateTestResultsFromStorage]);

  /* -------------------- IS 2500 AQL LOGIC -------------------- */

  /* Table 2 - Double Sampling for Dimension & Weight AQL 2.5
   * Returns 1st SAMPLE (n1) based on Lot Size Range
   * For lots 2-150: Double sampling not provided → use single sampling
   */
  const calculateSampleSize = (lotSz) => {
    if (lotSz <= 0) return 0;
    /* 2-150: Double sampling not provided, use single sampling (Table 1) */
    if (lotSz <= 8) return 2;
    if (lotSz <= 15) return 3;
    if (lotSz <= 25) return 5;
    if (lotSz <= 50) return 8;
    if (lotSz <= 90) return 13;
    if (lotSz <= 150) return 20;
    /* 151+ : Use Table 2 - 1st SAMPLE (n1) */
    if (lotSz <= 280) return 20;    /* 151-280 → n1=20 */
    if (lotSz <= 500) return 32;    /* 281-500 → n1=32 */
    if (lotSz <= 1200) return 50;   /* 501-1200 → n1=50 */
    if (lotSz <= 3200) return 80;   /* 1201-3200 → n1=80 */
    if (lotSz <= 10000) return 125; /* 3201-10000 → n1=125 */
    if (lotSz <= 35000) return 200; /* 10001-35000 → n1=200 */
    if (lotSz <= 150000) return 315;/* 35001-150000 → n1=315 */
    if (lotSz <= 500000) return 500;/* 150001-500000 → n1=500 */
    return 500;
  };

  /* Table 1 - Sample Size for Bags for Sampling calculation */
  const calculateBagsForSampling = (quantity) => {
    if (quantity <= 0) return 0;
    if (quantity <= 8) return 2;
    if (quantity <= 15) return 3;
    if (quantity <= 25) return 5;
    if (quantity <= 50) return 8;
    if (quantity <= 90) return 13;
    if (quantity <= 150) return 20;
    if (quantity <= 280) return 32;
    if (quantity <= 500) return 50;
    if (quantity <= 1200) return 80;
    if (quantity <= 3200) return 125;
    if (quantity <= 10000) return 200;
    if (quantity <= 35000) return 315;
    if (quantity <= 150000) return 500;
    if (quantity <= 500000) return 800;
    return 1250;
  };


  /* -------------------- LOTS DATA (Fetched from Backend) -------------------- */
  // lotsFromVendorCall is now fetched from backend in useEffect above

  /* Calculate Sample Size for each lot based on Lot Size (IS 2500 Table 2) */
  const lotsWithSampling = (lotsFromVendorCall && Array.isArray(lotsFromVendorCall) && lotsFromVendorCall.length > 0)
    ? lotsFromVendorCall.map((lot) => {
      const sampleSize = calculateSampleSize(lot.lotSize);
      return { ...lot, sampleSize };
    })
    : [];

  /* Calculate totals */
  const totalQtyOffered = lotsWithSampling.reduce((sum, l) => sum + (l.lotSize || 0), 0);
  const totalSampleSize = lotsWithSampling.reduce((sum, l) => sum + (l.sampleSize || 0), 0);
  const bagsForSampling = calculateBagsForSampling(totalSampleSize);

  /* No. of Bags Offered - Auto-fetched from Vendor Call */
  const bagsOffered = (lotsFromVendorCall && Array.isArray(lotsFromVendorCall) && lotsFromVendorCall.length > 0)
    ? lotsFromVendorCall.reduce((sum, lot) => sum + (parseInt(lot.noOfBags) || 0), 0)
    : 0;

  /* -------------------- FINAL INSPECTION RESULTS DATA -------------------- */
  /* Test results per lot - Fetched from backend in useEffect above */
  // testResultsPerLot is now fetched from backend

  /* State for each lot's final inspection data */
  const [lotInspectionData, setLotInspectionData] = useState(() => {
    const callNo = selectedCall?.call_no;

    // Try to load persisted data first
    if (callNo) {
      const persistedData = localStorage.getItem(`fpLotInspectionData_${callNo}`);
      if (persistedData) {
        try {
          console.log('✅ Restoring lot inspection data from localStorage for call:', callNo);
          return JSON.parse(persistedData);
        } catch (e) {
          console.error('Error loading persisted lot inspection data:', e);
        }
      }
    }

    // Return empty object - will be initialized in useEffect when lots are loaded
    return {};
  });

  // Initialize lot inspection data when lots are first loaded
  useEffect(() => {
    const callNo = selectedCall?.call_no;
    if (!callNo || !lotsFromVendorCall || lotsFromVendorCall.length === 0) return;

    // Check if data is already initialized for these lots
    setLotInspectionData(prev => {
      const needsInitialization = lotsFromVendorCall.some(lot => !prev[lot.lotNo]);

      if (!needsInitialization) {
        // All lots already have data, don't reinitialize
        return prev;
      }

      // Initialize missing lots
      const updated = { ...prev };
      lotsFromVendorCall.forEach(lot => {
        if (lot && lot.lotNo && !updated[lot.lotNo]) {
          updated[lot.lotNo] = {
            stdPackingNo: 50,
            bagsStdPacking: '',
            nonStdBagsCount: '',
            nonStdBagsQty: [],
            holograms: [{ type: 'range', from: '', to: '' }],
            remarks: '',
            ercUsedForTesting: ''
          };
        }
      });
      console.log('✅ Lot inspection data initialized for new lots');
      return updated;
    });
  }, [selectedCall?.call_no, lotsFromVendorCall]);

  // Restore form state from localStorage on component mount
  useEffect(() => {
    const callNo = selectedCall?.call_no;
    if (callNo) {
      try {
        const persistedData = localStorage.getItem(`fpLotInspectionData_${callNo}`);
        if (persistedData) {
          const data = JSON.parse(persistedData);
          setLotInspectionData(data);
          console.log('✅ Lot inspection data restored from localStorage');
        }

        const persistedPackedInHDPE = localStorage.getItem(`fpPackedInHDPE_${callNo}`);
        if (persistedPackedInHDPE !== null) {
          setPackedInHDPE(persistedPackedInHDPE === 'true');
          console.log('✅ Packed in HDPE state restored from localStorage');
        }

        const persistedCleanedWithCoating = localStorage.getItem(`fpCleanedWithCoating_${callNo}`);
        if (persistedCleanedWithCoating !== null) {
          setCleanedWithCoating(persistedCleanedWithCoating === 'true');
          console.log('✅ Cleaned with coating state restored from localStorage');
        }
      } catch (error) {
        console.error('Error restoring form state from localStorage:', error);
      }
    }
  }, [selectedCall?.call_no]);

  // Persist lot inspection data to localStorage whenever it changes
  useEffect(() => {
    const callNo = selectedCall?.call_no;
    if (callNo && lotInspectionData && Object.keys(lotInspectionData).length > 0) {
      localStorage.setItem(`fpLotInspectionData_${callNo}`, JSON.stringify(lotInspectionData));
    }
  }, [lotInspectionData, selectedCall?.call_no]);

  /* Get overall lot status: 'REJECTED' | 'PENDING' | 'ACCEPTED' */
  const getLotStatus = (lotNo) => {
    const tests = testResultsPerLot[lotNo];
    if (!tests || Object.keys(tests).length === 0) return 'PENDING';
    if (Object.values(tests).some(v => v === 'NOT OK')) return 'REJECTED';
    if (Object.values(tests).some(v => v === 'Pending')) return 'PENDING';
    return 'ACCEPTED';
  };

  /* Keep isLotRejected for backward-compat with qty calculations */
  const isLotRejected = (lotNo) => getLotStatus(lotNo) === 'REJECTED';

  /* Packing verification checkboxes - with localStorage persistence */
  const [packedInHDPE, setPackedInHDPE] = useState(() => {
    const callNo = selectedCall?.call_no;
    if (callNo) {
      const persisted = localStorage.getItem(`fpPackedInHDPE_${callNo}`);
      if (persisted !== null) {
        return persisted === 'true';
      }
    }
    return false;
  });

  const [cleanedWithCoating, setCleanedWithCoating] = useState(() => {
    const callNo = selectedCall?.call_no;
    if (callNo) {
      const persisted = localStorage.getItem(`fpCleanedWithCoating_${callNo}`);
      if (persisted !== null) {
        return persisted === 'true';
      }
    }
    return false;
  });

  // Persist packing verification states to localStorage
  useEffect(() => {
    const callNo = selectedCall?.call_no;
    if (callNo) {
      localStorage.setItem(`fpPackedInHDPE_${callNo}`, String(packedInHDPE));
      localStorage.setItem(`fpCleanedWithCoating_${callNo}`, String(cleanedWithCoating));
      console.log('✅ Packing verification states persisted to localStorage');
    }
  }, [packedInHDPE, cleanedWithCoating, selectedCall?.call_no]);

  /* Save Draft state */
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  /* Withheld modal state */
  const [showWithheldModal, setShowWithheldModal] = useState(false);
  const [withheldReason, setWithheldReason] = useState('');
  const [withheldRemarks, setWithheldRemarks] = useState('');
  const [withheldError, setWithheldError] = useState('');

  /* Finish inspection state */
  const [isFinishingInspection, setIsFinishingInspection] = useState(false);

  /* Pause inspection state */
  const [isPausingInspection, setIsPausingInspection] = useState(false);

  /* -------------------- SUBMODULE LIST -------------------- */
  const SUBMODULES = [
    { key: "final-calibration-documents", icon: "📄", title: "Calibration & Documents", desc: "Verify calibration" },
    { key: "final-visual-dimensional", icon: "📏", title: "Visual & Dimensional", desc: "Surface & dimensions" },
    { key: "final-chemical-analysis", icon: "🧪", title: "Chemical Analysis", desc: "Composition check" },
    { key: "final-hardness-test", icon: "💎", title: "Hardness Test", desc: "HRC measurement" },
    { key: "final-inclusion-rating", icon: "🔬", title: "Inclusion & Decarb", desc: "Metallurgical exam" },
    { key: "final-application-deflection", icon: "📐", title: "Deflection Test", desc: "Load-deflection" },
    { key: "final-toe-load-test", icon: "🎯", title: "Toe Load Test", desc: "Load verification" },
    { key: "final-weight-test", icon: "⚖️", title: "Weight Test", desc: "Weight check" },
    { key: "final-reports", icon: "📊", title: "Reports", desc: "Summary & reports" }
  ];

  /* -------------------- LOT DATA UPDATE HANDLERS -------------------- */
  const updateLotData = (lotNo, field, value) => {
    setLotInspectionData(prev => ({
      ...prev,
      [lotNo]: { ...prev[lotNo], [field]: value }
    }));
  };

  const updateNonStdBagsCount = (lotNo, count) => {
    // Allow empty string so user can clear the field; coerce to number only for array resize
    const raw = count === '' ? '' : count;
    const num = parseInt(count) || 0;
    setLotInspectionData(prev => ({
      ...prev,
      [lotNo]: {
        ...prev[lotNo],
        nonStdBagsCount: raw,
        nonStdBagsQty: Array(num).fill('').slice(0, num)
      }
    }));
  };

  const updateNonStdBagQty = (lotNo, idx, value) => {
    setLotInspectionData(prev => {
      const arr = [...prev[lotNo].nonStdBagsQty];
      arr[idx] = value;
      return { ...prev, [lotNo]: { ...prev[lotNo], nonStdBagsQty: arr } };
    });
  };

  /* -------------------- HOLOGRAM HANDLERS -------------------- */
  const addHologram = (lotNo, type) => {
    setLotInspectionData(prev => ({
      ...prev,
      [lotNo]: {
        ...(prev[lotNo] || {}),
        holograms: [...(prev[lotNo]?.holograms || []), type === 'range' ? { type: 'range', from: '', to: '' } : { type: 'single', value: '' }]
      }
    }));
  };

  const removeHologram = (lotNo, idx) => {
    setLotInspectionData(prev => ({
      ...prev,
      [lotNo]: {
        ...(prev[lotNo] || {}),
        holograms: (prev[lotNo]?.holograms || []).filter((_, i) => i !== idx)
      }
    }));
  };

  const updateHologram = (lotNo, idx, field, value) => {
    setLotInspectionData(prev => {
      const arr = [...(prev[lotNo]?.holograms || [])];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...prev, [lotNo]: { ...(prev[lotNo] || {}), holograms: arr } };
    });
  };

  /* -------------------- WITHHELD MODAL HANDLERS -------------------- */
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

    try {
      const callNo = selectedCall?.call_no;
      if (!callNo) {
        setWithheldError('Call number not found');
        return;
      }

      const actionData = {
        callNo: callNo,
        actionType: 'WITHHELD',
        reason: withheldReason,
        remarks: withheldRemarks.trim(),
        status: 'WITHHELD',
        actionDate: new Date().toISOString()
      };

      console.log('🏭 Final Product: Withheld saved to localStorage only (no API call)');
      console.log('Withheld Data:', actionData);

      // Mark call as withheld in local storage
      markAsWithheld(callNo, withheldRemarks.trim());

      // Clear draft data
      localStorage.removeItem(`${DASHBOARD_DRAFT_KEY}${callNo}`);

      alert('✅ Inspection has been withheld successfully');
      handleCloseWithheldModal();
      onBack();
    } catch (error) {
      console.error('Error withholding inspection:', error);
      setWithheldError('Failed to save. Please try again.');
    }
  };

  /* -------------------- SAVE DRAFT HANDLER -------------------- */
  /**
   * Cache Invalidation Strategy:
   * - Dashboard data is cached for 5 minutes (see InspectionContext)
   * - When user saves draft, form data is persisted to localStorage
   * - When user navigates back from submodules, cached data is used (no API call)
   * - Form data is restored from localStorage on component mount
   * - Cache automatically expires after 5 minutes, triggering fresh API call
   * - This ensures data consistency while avoiding unnecessary API calls
   */
  const handleSaveDraft = useCallback(() => {
    const callNo = selectedCall?.call_no;
    if (!callNo) {
      alert('❌ Call number not found. Cannot save draft.');
      return;
    }

    setIsSavingDraft(true);

    try {
      // Collect all dashboard form data
      const draftData = {
        savedAt: new Date().toISOString(),
        lotInspectionData: lotInspectionData,
        packedInHDPE: packedInHDPE,
        cleanedWithCoating: cleanedWithCoating
      };

      // Save to localStorage with call number as key
      const storageKey = `${DASHBOARD_DRAFT_KEY}${callNo}`;
      localStorage.setItem(storageKey, JSON.stringify(draftData));

      // Also persist individual form states for recovery on navigation
      localStorage.setItem(`fpLotInspectionData_${callNo}`, JSON.stringify(lotInspectionData));
      localStorage.setItem(`fpPackedInHDPE_${callNo}`, String(packedInHDPE));
      localStorage.setItem(`fpCleanedWithCoating_${callNo}`, String(cleanedWithCoating));

      console.log('✅ Draft and form states saved to localStorage');
      alert(`✅ Draft saved successfully at ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error('Error saving draft:', error);
      alert(`Failed to save draft: ${error.message}`);
    } finally {
      setIsSavingDraft(false);
    }
  }, [selectedCall?.call_no, lotInspectionData, packedInHDPE, cleanedWithCoating]);

  // Load draft data from localStorage on mount
  useEffect(() => {
    if (!selectedCall?.call_no) return;

    try {
      const storageKey = `${DASHBOARD_DRAFT_KEY}${selectedCall.call_no}`;
      const savedDraft = localStorage.getItem(storageKey);

      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        console.log('📦 Loading draft data from localStorage:', draftData);

        // Restore form data
        if (draftData.lotInspectionData) setLotInspectionData(draftData.lotInspectionData);
        if (draftData.packedInHDPE !== undefined) setPackedInHDPE(draftData.packedInHDPE);
        if (draftData.cleanedWithCoating !== undefined) setCleanedWithCoating(draftData.cleanedWithCoating);

        console.log('✅ Draft data loaded successfully');
      }
    } catch (error) {
      console.error('Error loading draft data:', error);
    }
  }, [selectedCall?.call_no]);

  /* -------------------- FINISH INSPECTION HANDLER -------------------- */
  const handleFinishInspection = async () => {
    const callNo = selectedCall?.call_no;
    if (!callNo) {
      alert('❌ Call number not found. Cannot finish inspection.');
      return;
    }

    // Confirm before finishing
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to finish the inspection? This will save all submodule data to the database.'
    );
    if (!confirmed) return;

    setIsFinishingInspection(true);

    try {
      console.log('🚀 Starting finish inspection process for call:', callNo);

      // Prepare all data first
      const ercUsed = lotsWithSampling.reduce((sum, lot) => sum + (parseInt(lotInspectionData[lot.lotNo]?.ercUsedForTesting) || 0), 0);
      const qtyRejected = lotsWithSampling.filter(lot => isLotRejected(lot.lotNo)).reduce((sum, lot) => sum + lot.lotSize, 0);
      const qtyNowPassed = totalQtyOffered - ercUsed - qtyRejected;
      const poQty = poData?.poQty || 10000;
      const poSrQty = poData?.poSrQty || 0;
      const cummPassed = poData?.cummQtyPassedPreviously || 0;
      const qtyStillDue = poSrQty - cummPassed - qtyNowPassed;

      // Get current user for audit fields
      const currentUser = getStoredUser()?.userId || 'SYSTEM';
      const now = new Date().toISOString();

      // 1. Prepare cumulative results data
      const cumulativeData = {
        inspectionCallNo: callNo,
        poNo: poData?.po_no || selectedCall?.po_no,
        poQty: poQty,
        cummQtyOfferedPreviously: poData?.cummQtyOfferedPreviously || 0,
        cummQtyPassedPreviously: cummPassed,
        qtyNowOffered: totalQtyOffered,
        qtyNowPassed: qtyNowPassed,
        qtyNowRejected: qtyRejected,
        qtyStillDue: qtyStillDue,
        totalSampleSize: totalSampleSize,
        bagsForSampling: bagsForSampling,
        bagsOffered: bagsOffered,
        // Audit fields - backend will use createdBy/createdAt for new records, updatedBy/updatedAt for updates
        createdBy: currentUser,
        createdAt: now,
        updatedBy: currentUser,
        updatedAt: now
      };

      // 2. Prepare inspection summary data
      const summaryData = {
        inspectionCallNo: callNo,
        packedInHdpe: packedInHDPE,
        cleanedWithCoating: cleanedWithCoating,
        inspectionStatus: 'COMPLETED',
        // Audit fields - backend will use createdBy/createdAt for new records, updatedBy/updatedAt for updates
        createdBy: currentUser,
        createdAt: now,
        updatedBy: currentUser,
        updatedAt: now
      };

      // 3. Prepare lot results data for all lots
      const lotResultsDataArray = lotsWithSampling.map(lot => {
        const lotData = lotInspectionData[lot.lotNo] || {};
        const tests = testResultsPerLot[lot.lotNo] || {};

        return {
          inspectionCallNo: callNo,
          lotNo: lot.lotNo,
          heatNo: lot.heatNo,
          calibrationStatus: tests.calibration || 'PENDING',
          visualDimStatus: tests.visualDim || 'PENDING',
          hardnessStatus: tests.hardness || 'PENDING',
          inclusionStatus: tests.inclusion || 'PENDING',
          deflectionStatus: tests.deflection || 'PENDING',
          toeLoadStatus: tests.toeLoad || 'PENDING',
          weightStatus: tests.weight || 'PENDING',
          chemicalStatus: tests.chemical || 'PENDING',
          ercUsedForTesting: parseInt(lotData.ercUsedForTesting) || 0,
          stdPackingNo: parseInt(lotData.stdPackingNo) || 50,
          bagsWithStdPacking: parseInt(lotData.bagsStdPacking) || 0,
          nonStdBagsCount: parseInt(lotData.nonStdBagsCount) || 0,
          nonStdBagsQty: JSON.stringify(lotData.nonStdBagsQty || []),
          hologramDetails: JSON.stringify(lotData.holograms || []),
          remarks: lotData.remarks || '',
          lotStatus: isLotRejected(lot.lotNo) ? 'REJECTED' : 'ACCEPTED',
          // Audit fields - backend will use createdBy/createdAt for new records, updatedBy/updatedAt for updates
          createdBy: currentUser,
          createdAt: now,
          updatedBy: currentUser,
          updatedAt: now
        };
      });

      // Determine overall inspection status
      const acceptedLots = lotsWithSampling.filter(lot => !isLotRejected(lot.lotNo)).length;
      const rejectedLots = lotsWithSampling.filter(lot => isLotRejected(lot.lotNo)).length;
      let overallInspectionStatus = 'PENDING';
      if (acceptedLots === lotsWithSampling.length) {
        overallInspectionStatus = 'ACCEPTED';
      } else if (rejectedLots === lotsWithSampling.length) {
        overallInspectionStatus = 'REJECTED';
      } else if (acceptedLots > 0 && rejectedLots > 0) {
        overallInspectionStatus = 'PARTIALLY_ACCEPTED';
      }

      console.log(`📊 Overall Inspection Status: ${overallInspectionStatus} (${acceptedLots} accepted, ${rejectedLots} rejected out of ${lotsWithSampling.length} lots)`);

      // Step 1: Save dashboard results in parallel
      console.log('💾 Saving dashboard results (cumulative, summary, and lot results)...');
      const dashboardSavePromises = [
        saveCumulativeResults(cumulativeData),
        saveInspectionSummary(summaryData),
        ...lotResultsDataArray.map(lotData => saveLotResults(lotData))
      ];

      await Promise.all(dashboardSavePromises);
      console.log('✅ Dashboard results saved successfully');

      // Step 2: Call the finish inspection API for submodules
      console.log('💾 Saving submodule data...');
      const results = await finishInspection(callNo);
      console.log('✅ Finish inspection completed:', results);

      // Step 3: Trigger workflow API for Finish Inspection
      console.log('🔄 Triggering workflow API for Finish Inspection...');
      const currentUserObj = getStoredUser();
      const userId = currentUserObj?.userId || 0;

      const workflowActionData = {
        workflowTransitionId: selectedCall?.workflowTransitionId || selectedCall?.id,
        requestId: callNo,
        action: 'INSPECTION_COMPLETE_CONFIRM',
        remarks: `Final Product Inspection completed with status: ${overallInspectionStatus}`,
        actionBy: userId,
        pincode: selectedCall?.pincode || '560001'
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

      // Show summary
      const summary = `
✅ Inspection Finished Successfully!

Dashboard Results Saved:
  ✓ Cumulative Results
  ✓ Inspection Summary
  ✓ Lot Results (${lotsWithSampling.length} lots)

Saved Modules: ${results.success.length}
${results.success.map(m => `  ✓ ${m}`).join('\n')}

${results.skipped.length > 0 ? `Skipped (No Data): ${results.skipped.length}\n${results.skipped.map(m => `  - ${m}`).join('\n')}\n` : ''}

${results.failed.length > 0 ? `Failed: ${results.failed.length}\n${results.failed.map(f => `  ✗ ${f.module}: ${f.error}`).join('\n')}` : ''}

Workflow Status: ✅ Transitioned to COMPLETED
      `;

      alert(summary);

      // Clear draft data
      localStorage.removeItem(`${DASHBOARD_DRAFT_KEY}${callNo}`);

      // Navigate back
      onBack();
    } catch (error) {
      console.error('❌ Error finishing inspection:', error);
      const errorMsg = error.message || 'Failed to finish inspection. Please try again.';
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setIsFinishingInspection(false);
    }
  };

  /* -------------------- PAUSE INSPECTION HANDLER -------------------- */
  const handlePauseInspection = () => {
    const callNo = selectedCall?.call_no;
    if (!callNo) {
      setPauseErrorData({ message: 'Call number not found. Cannot pause inspection.' });
      return;
    }
    setShowPauseConfirm(true);
  };

  const confirmPauseInspection = async () => {
    setShowPauseConfirm(false);
    const callNo = selectedCall?.call_no;
    setIsPausingInspection(true);

    try {
      console.log('🚀 Starting pause inspection process for call:', callNo);

      // Prepare all data first (same as finish inspection)
      const ercUsed = lotsWithSampling.reduce((sum, lot) => sum + (parseInt(lotInspectionData[lot.lotNo]?.ercUsedForTesting) || 0), 0);
      const qtyRejected = lotsWithSampling.filter(lot => isLotRejected(lot.lotNo)).reduce((sum, lot) => sum + lot.lotSize, 0);
      const qtyNowPassed = totalQtyOffered - ercUsed - qtyRejected;
      const poQty = poData?.poQty || 10000;
      const poSrQty = poData?.poSrQty || 0;
      const cummPassed = poData?.cummQtyPassedPreviously || 0;
      const qtyStillDue = poSrQty - cummPassed - qtyNowPassed;

      // Get current user for audit fields
      const currentUser = getStoredUser()?.userId || 'SYSTEM';
      const now = new Date().toISOString();

      // 1. Prepare cumulative results data
      const cumulativeData = {
        inspectionCallNo: callNo,
        poNo: poData?.po_no || selectedCall?.po_no,
        poQty: poQty,
        cummQtyOfferedPreviously: poData?.cummQtyOfferedPreviously || 0,
        cummQtyPassedPreviously: cummPassed,
        qtyNowOffered: totalQtyOffered,
        qtyNowPassed: qtyNowPassed,
        qtyNowRejected: qtyRejected,
        qtyStillDue: qtyStillDue,
        totalSampleSize: totalSampleSize,
        bagsForSampling: bagsForSampling,
        bagsOffered: bagsOffered,
        createdBy: currentUser,
        createdAt: now,
        updatedBy: currentUser,
        updatedAt: now
      };

      // 2. Prepare inspection summary data
      const summaryData = {
        inspectionCallNo: callNo,
        packedInHdpe: packedInHDPE,
        cleanedWithCoating: cleanedWithCoating,
        inspectionStatus: 'PAUSED',
        createdBy: currentUser,
        createdAt: now,
        updatedBy: currentUser,
        updatedAt: now
      };

      // 3. Prepare lot results data for all lots
      const lotResultsDataArray = lotsWithSampling.map(lot => {
        const lotData = lotInspectionData[lot.lotNo] || {};
        const tests = testResultsPerLot[lot.lotNo] || {};

        return {
          inspectionCallNo: callNo,
          lotNo: lot.lotNo,
          heatNo: lot.heatNo,
          calibrationStatus: tests.calibration || 'PENDING',
          visualDimStatus: tests.visualDim || 'PENDING',
          hardnessStatus: tests.hardness || 'PENDING',
          inclusionStatus: tests.inclusion || 'PENDING',
          deflectionStatus: tests.deflection || 'PENDING',
          toeLoadStatus: tests.toeLoad || 'PENDING',
          weightStatus: tests.weight || 'PENDING',
          chemicalStatus: tests.chemical || 'PENDING',
          ercUsedForTesting: parseInt(lotData.ercUsedForTesting) || 0,
          stdPackingNo: parseInt(lotData.stdPackingNo) || 50,
          bagsWithStdPacking: parseInt(lotData.bagsStdPacking) || 0,
          nonStdBagsCount: parseInt(lotData.nonStdBagsCount) || 0,
          nonStdBagsQty: JSON.stringify(lotData.nonStdBagsQty || []),
          hologramDetails: JSON.stringify(lotData.holograms || []),
          remarks: lotData.remarks || '',
          lotStatus: isLotRejected(lot.lotNo) ? 'REJECTED' : 'ACCEPTED',
          createdBy: currentUser,
          createdAt: now,
          updatedBy: currentUser,
          updatedAt: now
        };
      });

      console.log('💾 Saving dashboard results (cumulative, summary, and lot results)...');
      const dashboardSavePromises = [
        saveCumulativeResults(cumulativeData),
        saveInspectionSummary(summaryData),
        ...lotResultsDataArray.map(lotData => saveLotResults(lotData))
      ];

      await Promise.all(dashboardSavePromises);
      console.log('✅ Dashboard results saved successfully');

      // Step 2: Call the finish inspection API for submodules
      console.log('💾 Saving submodule data...');
      const results = await finishInspection(callNo);
      console.log('✅ Submodule data saved:', results);

      // Step 3: Trigger workflow API for Pause Inspection
      console.log('🔄 Triggering workflow API for Pause Inspection...');
      const currentUserObj = getStoredUser();
      const userId = currentUserObj?.userId || 0;

      const workflowActionData = {
        workflowTransitionId: selectedCall?.workflowTransitionId || selectedCall?.id,
        requestId: callNo,
        action: 'PAUSE_INSPECTION_RESUME_NEXT_DAY',
        remarks: 'Final Product Inspection paused - will resume next day',
        actionBy: userId,
        pincode: selectedCall?.pincode || '560001'
      };

      console.log('Workflow Action Data:', workflowActionData);

      try {
        await performTransitionAction(workflowActionData);
        console.log('✅ Workflow transition successful');
      } catch (workflowError) {
        console.error('❌ Workflow API error:', workflowError);
        console.warn('Inspection saved but workflow transition failed');
      }

      // Show custom modal instead of browser alert
      setPauseSuccessData({
        callNo,
        savedModules: results.success,
        skippedModules: results.skipped,
        failedModules: results.failed,
        lotCount: lotsWithSampling.length
      });
      // onBack() is called when the user clicks OK in the modal
    } catch (error) {
      console.error('❌ Error pausing inspection:', error);
      const errorMsg = error.message || 'Failed to pause inspection. Please try again.';
      setPauseErrorData({ message: errorMsg });
    } finally {
      setIsPausingInspection(false);
    }
  };

  /* -------------------- MAIN JSX -------------------- */
  return (
    <div className="fp-container">
      {/* BREADCRUMB */}
      <div className="fp-breadcrumb">
        <span className="fp-link" onClick={onBack}>
          Landing Page
        </span>{" "}
        / Inspection Initiation / <b>ERC Final Product</b>
      </div>

      <h1 className="fp-title">ERC Final Product Inspection - {selectedCall?.call_no}</h1>

      {/* LOADING STATE */}
      {isLoading && (
        <div className="fp-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ fontSize: '16px', color: '#666' }}>📥 Loading inspection data...</p>
        </div>
      )}

      {/* ERROR STATE */}
      {loadError && (
        <div className="fp-card" style={{ backgroundColor: '#fee', borderLeft: '4px solid #f44', padding: '16px' }}>
          <p style={{ color: '#c33', margin: 0 }}>❌ Error: {loadError}</p>
        </div>
      )}

      {/* MAIN CONTENT - Only show when data is loaded */}
      {!isLoading && !loadError && (
        <>
          {/* STATIC INSPECTION DATA */}
          <div className="fp-card" style={{ background: 'var(--color-gray-100)', marginBottom: 'var(--space-24)' }}>
            <div className="fp-card-header" style={{ marginBottom: '16px' }}>
              <h2 className="fp-card-title">Inspection Details</h2>
              {/* <p className="fp-card-subtitle" style={{ fontSize: '12px', color: '#ecececff', marginTop: '4px' }}>
                Auto-fetched from PO/Sub PO information
              </p> */}
            </div>
            <div className="fp-grid">
              <div className="fp-form-group">
                <label className="fp-form-label">PO Number / PO Sr No</label>
                <input
                  className="fp-input"
                  value={poData?.po_no || ''}
                  disabled
                />
              </div>
              <div className="fp-form-group">
                <label className="fp-form-label">PO Date</label>
                <input
                  className="fp-input"
                  value={poData?.sub_po_date || poData?.po_date ? formatDate(poData?.sub_po_date || poData?.po_date) : ''}
                  disabled
                />
              </div>
              <div className="fp-form-group">
                <label className="fp-form-label">Contractor</label>
                <input className="fp-input" value={poData?.contractor || ''} disabled />
              </div>
              <div className="fp-form-group">
                <label className="fp-form-label">Manufacturer</label>
                <input className="fp-input" value={poData?.manufacturer || ''} disabled />
              </div>
              <div className="fp-form-group" style={{ gridColumn: 'span 2' }}>
                <label className="fp-form-label">Place of Inspection</label>
                <textarea
                  className="fp-input"
                  value={poData?.place_of_inspection || ''}
                  disabled
                  style={{ height: 'auto', minHeight: '38px', resize: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* PRE-INSPECTION DATA ENTRY */}
          <div className="fp-card">
            <h2 className="fp-card-title">Pre-Inspection Data Entry</h2>
            {/* <p className="fp-card-subtitle">
          Lots auto-fetched from Vendor Call (Lot No., Heat No. &amp; Lot Size
          from Process IC). Sample size and AQL limits are auto calculated as
          per IS 2500.
        </p> */}

            {/* Lot-wise info table - Acc/Rej/Cumm will be in respective submodules */}
            <div className="fp-lots-table-wrapper">
              <table className="fp-lots-table">
                <thead>
                  <tr>
                    <th>Lot No.</th>
                    <th>Heat No.</th>
                    <th>Lot Size</th>
                    <th>No. of Bags</th>
                    <th>Sample Size</th>
                    <th>No. of Sample Bags</th>
                  </tr>
                </thead>
                <tbody>
                  {(lotsWithSampling && Array.isArray(lotsWithSampling)) ? lotsWithSampling.map((lotRow) => (
                    <tr key={lotRow.lotNo}>
                      <td className="fp-lot-cell">{lotRow.lotNo}</td>
                      <td className="fp-lot-cell">{lotRow.heatNo}</td>
                      <td className="fp-lot-cell">{lotRow.lotSize}</td>
                      <td className="fp-lot-cell">{lotRow.noOfBags}</td>
                      <td className="fp-lot-cell">{lotRow.sampleSize}</td>
                      <td className="fp-lot-cell" style={{ fontWeight: 'bold', color: '#0d9488' }}>
                        {calculateBagsForSampling(lotRow.noOfBags)}
                      </td>
                    </tr>
                  )) : null}
                </tbody>
              </table>
            </div>

            {/* Summary Row */}
            <div className="fp-summary-row fp-summary-4col">
              <FormField label="Total Qty Offered">
                <input className="fp-input" value={totalQtyOffered || "-"} disabled />
              </FormField>

              <FormField label="Total Sample Size">
                <input className="fp-input" value={totalSampleSize || "-"} disabled />
              </FormField>


              <FormField label="Total No.of Bags Offered">
                <input
                  type="number"
                  className="fp-input"
                  value={bagsOffered || "-"}
                  disabled
                />
              </FormField>

              <FormField label="Total No.of Sampling Bags">
                <input className="fp-input" value={lotsWithSampling.reduce((sum, lot) => sum + calculateBagsForSampling(lot.noOfBags), 0) || "-"} disabled />
              </FormField>
            </div>
          </div>

          {/* SUBMODULE GRID */}
          <div className="fp-submodule-section">
            <h2 className="fp-section-title">Sub Modules</h2>
            <div className="fp-submodule-grid">
              {SUBMODULES.map((m) => (
                <button
                  key={m.key}
                  className="fp-submodule-btn"
                  onClick={() => onNavigateToSubModule(m.key)}
                >
                  <span className="fp-submodule-icon">{m.icon}</span>
                  <span className="fp-submodule-title">{m.title}</span>
                  <span className="fp-submodule-desc">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* PACKING VERIFICATION CHECKBOXES */}
          <div className="fp-card">
            <h2 className="fp-card-title">Packing Verification</h2>
            <div className="fp-checkbox-group">
              <label className="fp-checkbox-item">
                <input
                  type="checkbox"
                  checked={packedInHDPE}
                  onChange={(e) => setPackedInHDPE(e.target.checked)}
                />
                <span>Packed in double HDPE Bags</span>
              </label>
              <label className="fp-checkbox-item">
                <input
                  type="checkbox"
                  checked={cleanedWithCoating}
                  onChange={(e) => setCleanedWithCoating(e.target.checked)}
                />
                <span>Cleaned & protected with coating</span>
              </label>
            </div>
          </div>
          {/* CUMULATIVE RESULTS SECTION */}
          <div className="fp-card">
            <h2 className="fp-card-title">Cumulative Results</h2>
            <div className="fp-cumulative-grid">
              <FormField label="1. Po Sr Qty">
                <input className="fp-input" value={poData?.poSrQty || 0} disabled />
              </FormField>
              <FormField label="2. Cumm. Qty Offered Previously">
                <input className="fp-input" value={poData?.cummQtyOfferedPreviously || 0} disabled />
              </FormField>
              <FormField label="3. Cumm. Qty Passed Previously">
                <input className="fp-input" value={poData?.cummQtyPassedPreviously || 0} disabled />
              </FormField>
              <FormField label="4. Cumm. Qty Rejected Previously">
                <input className="fp-input" value={poData?.cummQtyRejectedPreviously || 0} disabled />
              </FormField>
              <FormField label="5. Qty Now Offered">
                <input className="fp-input" value={totalQtyOffered} disabled />
              </FormField>
              <FormField label="6. Qty Now Passed">
                <input
                  className="fp-input"
                  value={(() => {
                    const ercUsed = lotsWithSampling.reduce((sum, lot) => sum + (parseInt(lotInspectionData[lot.lotNo]?.ercUsedForTesting) || 0), 0);
                    const qtyRejected = lotsWithSampling.reduce((sum, lot) => {
                      if (isLotRejected(lot.lotNo)) {
                        return sum + lot.lotSize;
                      }
                      return sum + (rejectedCountsPerLot[lot.lotNo] || 0);
                    }, 0);
                    return totalQtyOffered - ercUsed - qtyRejected;
                  })()}
                  disabled
                />
              </FormField>
              <FormField label="7. Qty Now Rejected">
                <input
                  className="fp-input"
                  value={lotsWithSampling.reduce((sum, lot) => {
                    if (isLotRejected(lot.lotNo)) {
                      return sum + lot.lotSize;
                    }
                    return sum + (rejectedCountsPerLot[lot.lotNo] || 0);
                  }, 0)}
                  disabled
                />
              </FormField>
              <FormField label="8. Qty Still Due">
                <input
                  className="fp-input"
                  value={(() => {
                    // Recalculate based on newly available data
                    const ercUsed = lotsWithSampling.reduce((sum, lot) => sum + (parseInt(lotInspectionData[lot.lotNo]?.ercUsedForTesting) || 0), 0);
                    const qtyRejected = lotsWithSampling.reduce((sum, lot) => {
                      if (isLotRejected(lot.lotNo)) {
                        return sum + lot.lotSize;
                      }
                      return sum + (rejectedCountsPerLot[lot.lotNo] || 0);
                    }, 0);
                    const qtyNowPassed = totalQtyOffered - ercUsed - qtyRejected;

                    const poSrQty = poData?.poSrQty || 0;
                    const cummPassed = poData?.cummQtyPassedPreviously || 0;
                    return poSrQty - cummPassed - qtyNowPassed;
                  })()}
                  disabled
                />
              </FormField>

            </div>
          </div>

          {/* FINAL INSPECTION RESULTS - Each Lot Displayed Separately */}
          <div className="fp-card">
            <h2 className="fp-card-title">Final Inspection Results</h2>

            {(lotsWithSampling && Array.isArray(lotsWithSampling)) ? lotsWithSampling.map(lot => {
              const data = lotInspectionData[lot.lotNo] || {
                stdPackingNo: 50,
                bagsStdPacking: '',
                nonStdBagsCount: '',
                nonStdBagsQty: [],
                holograms: [{ type: 'range', from: '', to: '' }],
                remarks: '',
                ercUsedForTesting: ''
              };
              const rejected = isLotRejected(lot.lotNo);
              const tests = testResultsPerLot[lot.lotNo];
              const bagsStdCount = Math.ceil(lot.lotSize / (data?.stdPackingNo || 50));

              return (
                <div
                  key={lot.lotNo}
                  className="fp-lot-result-block"
                  style={{
                    background: rejected ? '#fef2f2' : '#f0fdf4',
                    border: `1px solid ${rejected ? '#fecaca' : '#bbf7d0'}`,
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '16px'
                  }}
                >
                  {/* Lot Header with Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>
                      📦 {lot.lotNo} | Heat: {lot.heatNo} | Qty: {lot.lotSize}
                    </div>
                    {(() => {
                      const lotStatus = getLotStatus(lot.lotNo);
                      const styleMap = {
                        ACCEPTED: { bg: '#dcfce7', color: '#166534', label: '✓ LOT ACCEPTED' },
                        REJECTED: { bg: '#fee2e2', color: '#991b1b', label: '✗ LOT REJECTED' },
                        PENDING: { bg: '#fef9c3', color: '#854d0e', label: '⏳ LOT PENDING' }
                      };
                      const s = styleMap[lotStatus];
                      return (
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '12px',
                          background: s.bg,
                          color: s.color
                        }}>
                          {s.label}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Test Results Summary - All 8 Submodules */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                      📊 Submodule Status:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '6px' }}>
                      {(tests && typeof tests === 'object') ? Object.entries(tests).map(([test, status]) => {
                        // Map test names to display labels
                        const testLabels = {
                          'calibration': '📄 Calibration',
                          'visualDim': '📏 Visual & Dim',
                          'hardness': '💎 Hardness',
                          'inclusion': '🔬 Inclusion',
                          'deflection': '📐 Deflection',
                          'toeLoad': '⚖️ Toe Load',
                          'weight': '⚖️ Weight',
                          'chemical': '🧪 Chemical'
                        };
                        return (
                          <span key={test} style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            background: status === 'OK' ? '#dcfce7' : (status === 'Pending' ? '#fef9c3' : '#fee2e2'),
                            color: status === 'OK' ? '#166534' : (status === 'Pending' ? '#854d0e' : '#991b1b'),
                            border: status === 'OK' ? '1px solid #86efac' : (status === 'Pending' ? '1px solid #fde047' : '1px solid #fca5a5'),
                            whiteSpace: 'nowrap'
                          }}>
                            {testLabels[test] || test}: {status === 'OK' ? '✓' : (status === 'Pending' ? '⏳' : '✗')}
                          </span>
                        );
                      }).sort((a) => {
                        // Sort by status: PENDING first, then OK
                        const aStatus = tests[a.key.split(':')[0].trim()];
                        return aStatus === 'OK' ? 1 : -1;
                      }) : null}
                    </div>
                  </div>

                  {/* Packing Info Grid */}
                  <div className="fp-grid" style={{ marginBottom: '12px' }}>
                    <FormField label="No. of ERC used for Testing">
                      <input
                        className="fp-input"
                        type="number"
                        min="0"
                        value={data.ercUsedForTesting}
                        onChange={(e) => updateLotData(lot.lotNo, 'ercUsedForTesting', e.target.value)}
                        placeholder="Enter count"
                        style={{ fontSize: '12px', padding: '6px' }}
                      />
                    </FormField>
                    <FormField label="Std. Packing No.">
                      <input className="fp-input" value={data.stdPackingNo} disabled style={{ fontSize: '12px', padding: '6px' }} />
                    </FormField>
                    <FormField label="Bags with Std. Packing">
                      <input
                        className="fp-input"
                        type="number"
                        value={data.bagsStdPacking !== undefined && data.bagsStdPacking !== null ? data.bagsStdPacking : bagsStdCount}
                        onChange={(e) => updateLotData(lot.lotNo, 'bagsStdPacking', e.target.value)}
                        style={{ fontSize: '12px', padding: '6px' }}
                      />
                    </FormField>
                    <FormField label="Non-Std Bags Count">
                      <input
                        className="fp-input"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="0"
                        value={data.nonStdBagsCount ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d+$/.test(val)) updateNonStdBagsCount(lot.lotNo, val);
                        }}
                        style={{ fontSize: '12px', padding: '6px' }}
                      />
                    </FormField>
                  </div>

                  {/* Non-Std Bags Qty Inputs */}
                  {data.nonStdBagsCount > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                        Qty in Each Non-Std Bag ({data.nonStdBagsCount} bags)
                      </label>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {Array.from({ length: data.nonStdBagsCount }).map((_, idx) => (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '9px', color: '#64748b' }}>Bag {idx + 1}</span>
                            <input
                              type="number"
                              className="fp-input"
                              value={data.nonStdBagsQty[idx] || ''}
                              onChange={(e) => updateNonStdBagQty(lot.lotNo, idx, e.target.value)}
                              style={{ width: '60px', fontSize: '11px', padding: '4px', textAlign: 'center' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hologram Section */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>
                        Hologram Details
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="fp-btn-sm"
                          onClick={() => addHologram(lot.lotNo, 'range')}
                        >
                          + Range
                        </button>
                        <button
                          type="button"
                          className="fp-btn-sm"
                          onClick={() => addHologram(lot.lotNo, 'single')}
                        >
                          + Single
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(data.holograms && Array.isArray(data.holograms)) ? data.holograms.map((holo, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', color: '#64748b', width: '50px' }}>
                            {holo.type === 'range' ? 'Range:' : 'Single:'}
                          </span>
                          {holo.type === 'range' ? (
                            <>
                              <input
                                className="fp-input"
                                placeholder="From"
                                value={holo.from || ''}
                                onChange={(e) => updateHologram(lot.lotNo, idx, 'from', e.target.value)}
                                style={{ width: '80px', fontSize: '11px', padding: '4px' }}
                              />
                              <span style={{ fontSize: '10px' }}>to</span>
                              <input
                                className="fp-input"
                                placeholder="To"
                                value={holo.to || ''}
                                onChange={(e) => updateHologram(lot.lotNo, idx, 'to', e.target.value)}
                                style={{ width: '80px', fontSize: '11px', padding: '4px' }}
                              />
                            </>
                          ) : (
                            <input
                              className="fp-input"
                              placeholder="Hologram No."
                              value={holo.value || ''}
                              onChange={(e) => updateHologram(lot.lotNo, idx, 'value', e.target.value)}
                              style={{ width: '120px', fontSize: '11px', padding: '4px' }}
                            />
                          )}
                          {data.holograms.length > 1 && (
                            <button
                              type="button"
                              className="fp-btn-danger-sm"
                              onClick={() => removeHologram(lot.lotNo, idx)}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )) : null}
                    </div>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Remarks
                    </label>
                    <textarea
                      rows="1"
                      className="fp-textarea"
                      value={data.remarks}
                      onChange={(e) => updateLotData(lot.lotNo, 'remarks', e.target.value)}
                      placeholder="Enter remarks..."
                      style={{ fontSize: '11px', padding: '6px' }}
                    />
                  </div>
                </div>
              );
            }) : null}
          </div>


          {/* ACTION BUTTONS */}
          <div className="fp-actions">
            <button
              className="btn btn-outline"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
            >
              {isSavingDraft ? '💾 Saving...' : '💾 Save Draft'}
            </button>
            <button
              className="btn btn-outline"
              onClick={handlePauseInspection}
              disabled={isPausingInspection}
            >
              {isPausingInspection ? '⏸️ Pausing...' : '⏸️ Pause Inspection'}
            </button>
            <button className="btn btn-outline" onClick={handleOpenWithheldModal}>Withheld Inspection</button>
            <button
              className="btn btn-primary"
              onClick={handleFinishInspection}
              disabled={isFinishingInspection}
            >
              {isFinishingInspection ? '⏳ Finishing...' : '✅ Finish Inspection'}
            </button>
          </div>
        </>
      )}

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
                  value={withheldReason}
                  onChange={(e) => { setWithheldReason(e.target.value); setWithheldError(''); }}
                >
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
                    value={withheldRemarks}
                    onChange={(e) => { setWithheldRemarks(e.target.value); setWithheldError(''); }}
                  />
                </div>
              )}

              {withheldError && <div className="modal-error">{withheldError}</div>}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary modal-actions__btn" onClick={handleCloseWithheldModal}>
                Cancel
              </button>
              <button type="button" className="btn btn-warning modal-actions__btn" onClick={handleSubmitWithheld}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RETURN */}
      <button className="btn btn-secondary fp-return" onClick={onBack}>
        Return to Landing Page
      </button>

      {/* PAUSE SUCCESS MODAL */}
      {pauseSuccessData && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '32px 36px',
            maxWidth: '480px', width: '90%', boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
            textAlign: 'center'
          }}>
            {/* Green checkmark icon */}
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: '#dcfce7', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px'
            }}>
              <span style={{ fontSize: '28px' }}>✓</span>
            </div>

            <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: '700', color: '#166534' }}>
              Inspection Paused Successfully
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
              Call No: <strong style={{ color: '#1e293b' }}>{pauseSuccessData.callNo}</strong>
            </p>

            <div style={{
              background: '#f8fafc', borderRadius: '8px', padding: '16px',
              textAlign: 'center', marginBottom: '20px', fontSize: '14px', color: '#475569',
              lineHeight: '1.6'
            }}>
              All inspection data for <strong style={{ color: '#1e293b' }}>{pauseSuccessData.lotCount} lots</strong> has been securely saved.
              <br /><br />
              You can safely resume this call from the <strong>Inspection Initiation</strong> page whenever you are ready.
            </div>

            <button
              onClick={() => { setPauseSuccessData(null); onBack(); }}
              style={{
                background: '#16a34a', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '10px 40px', fontSize: '15px',
                fontWeight: '600', cursor: 'pointer', width: '100%'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* PAUSE ERROR MODAL */}
      {pauseErrorData && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '32px 36px',
            maxWidth: '420px', width: '90%', boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
            textAlign: 'center'
          }}>
            {/* Red X icon */}
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: '#fee2e2', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px'
            }}>
              <span style={{ fontSize: '28px', color: '#dc2626' }}>✗</span>
            </div>

            <h2 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: '700', color: '#991b1b' }}>
              Pause Inspection Failed
            </h2>
            <p style={{
              margin: '0 0 24px', fontSize: '13px', color: '#64748b',
              background: '#fef2f2', borderRadius: '8px', padding: '12px',
              border: '1px solid #fecaca'
            }}>
              {pauseErrorData.message}
            </p>

            <button
              onClick={() => setPauseErrorData(null)}
              style={{
                background: '#dc2626', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '10px 40px', fontSize: '15px',
                fontWeight: '600', cursor: 'pointer', width: '100%'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* PAUSE CONFIRMATION MODAL */}
      {showPauseConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '32px 36px',
            maxWidth: '420px', width: '90%', boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: '#fff7ed', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px'
            }}>
              <span style={{ fontSize: '28px', color: '#ea580c' }}>⚠️</span>
            </div>

            <h2 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: '700', color: '#9a3412' }}>
              Pause and Resume Later?
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
              Would you like to save your current progress and pause this inspection? You can safely resume this call from where you left off at any time.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowPauseConfirm(false)}
                style={{
                  background: '#f1f5f9', color: '#475569', border: 'none',
                  borderRadius: '8px', padding: '10px 20px', fontSize: '15px',
                  fontWeight: '600', cursor: 'pointer', flex: 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmPauseInspection}
                style={{
                  background: '#ea580c', color: '#fff', border: 'none',
                  borderRadius: '8px', padding: '10px 20px', fontSize: '15px',
                  fontWeight: '600', cursor: 'pointer', flex: 1
                }}
              >
                Yes, Pause
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
