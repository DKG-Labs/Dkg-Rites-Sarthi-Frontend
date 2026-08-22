import { useState, useEffect, useMemo } from 'react';
import RawMaterialSubmoduleNav from '../components/RawMaterialSubmoduleNav';
import HeatToggle from '../components/HeatToggle';
import { useInspection } from '../context/InspectionContext';
import { fetchPoDataForSections } from '../services/poDataService';
import { getInspectionDataByCallNo } from '../services/rmInspectionService';
import './SummaryReportsPage.css';

// Helper to get divisor for ERC type weight calculation
// MK-V: 1.14, MK-III: 0.91, J-Type: 0.915
const getErcDivisor = (modelName) => {
  if (!modelName) return 1.14; // Default
  const normalizedModel = String(modelName).toUpperCase().replace(/\s+/g, '');
  if (normalizedModel.includes('MK-III') || normalizedModel.includes('MKIII') || normalizedModel.includes('MK3')) return 0.91;
  if (normalizedModel.includes('MK-V') || normalizedModel.includes('MKV') || normalizedModel.includes('MK5')) return 1.14;
  if (normalizedModel.includes('J-TYPE') || normalizedModel.includes('JTYPE') || normalizedModel.includes('ERC-J') || normalizedModel === 'J') return 0.915;
  return 1.14; // Default fallback
};

const SPEC_LIMITS = {
  c: { min: 0.50, max: 0.60 },
  si: { min: 1.50, max: 2.00 },
  mn: { min: 0.80, max: 1.00 },
  p: { min: 0, max: 0.030 },
  s: { min: 0, max: 0.030 },
  grainSize: { min: 6, max: 999 },
  inclA: { min: 0, max: 2.0 },
  inclB: { min: 0, max: 2.0 },
  inclC: { min: 0, max: 2.0 },
  inclD: { min: 0, max: 2.0 }
};

const SummaryReportsPage = ({ onBack, heats = [], productModel = 'MK-III', inspectionCallNo = '', onNavigateSubmodule }) => {
  const { selectedCall } = useInspection();
  const [activeHeatIndex, setActiveHeatIndex] = useState(0);
  const [backendData, setBackendData] = useState(null);
  const [poDetails, setPoDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const poNo = selectedCall?.po_no || selectedCall?.rawPoNo || '';
  const cleanPoNo = useMemo(() => {
    return typeof poNo === 'string' ? poNo.replace(/\s*\/\s*/g, '/') : poNo;
  }, [poNo]);

  // Fetch backend data and PO details
  useEffect(() => {
    const loadData = async () => {
      if (!inspectionCallNo) return;
      setIsLoading(true);
      try {
        const data = await getInspectionDataByCallNo(inspectionCallNo);
        setBackendData(data);
      } catch (err) {
        console.error("Failed to load inspection data in SummaryReportsPage:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [inspectionCallNo]);

  useEffect(() => {
    if (cleanPoNo && inspectionCallNo) {
      fetchPoDataForSections(cleanPoNo, inspectionCallNo)
        .then(res => setPoDetails(res))
        .catch(err => console.error("Failed to load PO Details in SummaryReportsPage:", err));
    }
  }, [cleanPoNo, inspectionCallNo]);

  // Helper to compile data for a single heat
  const heatSummaries = useMemo(() => {
    const shift = sessionStorage.getItem('inspectionShift');
    const shiftSuffix = shift ? `_${shift}` : '';

    const mainKey = `rm_main_inspection_data_${inspectionCallNo}${shiftSuffix}`;
    const visualKey = `visual_inspection_draft_data_${inspectionCallNo}${shiftSuffix}`;
    const dimKey = `dimensional_check_draft_data_${inspectionCallNo}${shiftSuffix}`;
    const matKey = `material_testing_draft_data_${inspectionCallNo}${shiftSuffix}`;
    const packKey = `packing_storage_draft_data_${inspectionCallNo}${shiftSuffix}`;
    const calKey = `calibration_draft_data_${inspectionCallNo}${shiftSuffix}`;

    const loadLocalJson = (key) => {
      try {
        const val = localStorage.getItem(key) || localStorage.getItem(key.replace(shiftSuffix, ''));
        return val ? JSON.parse(val) : null;
      } catch {
        return null;
      }
    };

    const localMain = loadLocalJson(mainKey);
    const localVisual = loadLocalJson(visualKey);
    const localDim = loadLocalJson(dimKey);
    const localMat = loadLocalJson(matKey);
    const localPack = loadLocalJson(packKey);
    const localCal = loadLocalJson(calKey);

    const getFromDraft = (draftData, hNo, idx) => {
      if (!draftData) return null;
      const nh = (hNo || '').toString().trim().toUpperCase();
      if (typeof draftData === 'object' && !Array.isArray(draftData) && draftData[nh]) {
        return draftData[nh];
      }
      if (Array.isArray(draftData) && draftData[idx]) {
        return draftData[idx];
      }
      return null;
    };

    return heats.map((heat, heatIndex) => {
      const heatNo = heat.heatNo || heat.heat_no || `Heat-${heatIndex + 1}`;
      const normalizedHNo = heatNo.toString().trim().toUpperCase();

      // ==================== VISUAL DATA ====================
      let visualDefects = [];
      let visualDefectCounts = {};
      let visualRemarks = '';
      let visualWeightRejected = 0;
      let visualTotalLengthRejected = 0;
      let visualStatus = 'Pending';

      const draftVisualHeat = getFromDraft(localVisual, normalizedHNo, heatIndex);
      if (draftVisualHeat) {
        const selected = draftVisualHeat.selectedDefects || {};
        const counts = draftVisualHeat.defectCounts || {};
        visualRemarks = draftVisualHeat.otherRemarks || '';
        
        if (selected['No Defect']) {
          visualStatus = 'OK';
        } else {
          const activeDefects = Object.entries(selected).filter(([k, v]) => v && k !== 'No Defect').map(([k]) => k);
          if (activeDefects.length > 0) {
            visualDefects = activeDefects;
            activeDefects.forEach(d => {
              const l = parseFloat(counts[d]) || 0;
              visualDefectCounts[d] = l;
              visualTotalLengthRejected += l;
            });
            const wFactor = productModel?.toUpperCase().includes('V') ? 0.00326 : 0.00263;
            visualWeightRejected = visualTotalLengthRejected * wFactor;
            visualStatus = 'NOT OK';
          }
        }
      } else {
        const backendVisualItem = backendData?.visualInspectionData?.find(
          item => (item.heatNo || '').toString().trim().toUpperCase() === normalizedHNo
        );
        if (backendVisualItem) {
          const selected = backendVisualItem.defects || {};
          const lengths = backendVisualItem.defectLengths || {};
          visualRemarks = backendVisualItem.otherRemarks || '';
          visualWeightRejected = backendVisualItem.weightRejected || 0;
          
          if (selected['No Defect']) {
            visualStatus = 'OK';
          } else {
            const activeDefects = Object.entries(selected).filter(([k, v]) => v && k !== 'No Defect').map(([k]) => k);
            if (activeDefects.length > 0) {
              visualDefects = activeDefects;
              activeDefects.forEach(d => {
                const l = parseFloat(lengths[d]) || 0;
                visualDefectCounts[d] = l;
                visualTotalLengthRejected += l;
              });
              visualStatus = 'NOT OK';
            }
          }
        }
      }

      // ==================== DIMENSIONAL DATA ====================
      let dimSamples = Array.from({ length: 20 }).map(() => ({ diameter: '' }));
      let dimStatus = 'Pending';
      let dimFailedCount = 0;
      let dimFilledCount = 0;

      const draftDimHeat = getFromDraft(localDim?.heatDimData, normalizedHNo, heatIndex);
      if (draftDimHeat && draftDimHeat.dimSamples) {
        dimSamples = draftDimHeat.dimSamples;
      } else {
        const backendDimItem = backendData?.dimensionalCheckData?.find(
          item => (item.heatNo || '').toString().trim().toUpperCase() === normalizedHNo
        );
        if (backendDimItem && backendDimItem.sampleDiameters) {
          dimSamples = backendDimItem.sampleDiameters.map(d => ({ diameter: d !== null ? String(d) : '' }));
        }
      }

      const dimSpecs = productModel?.toUpperCase().includes('V')
        ? { min: 22.81, max: 23.23 }
        : { min: 20.47, max: 20.84 };

      dimSamples.forEach(s => {
        const val = s?.diameter ? parseFloat(s.diameter) : null;
        if (val !== null && !isNaN(val)) {
          dimFilledCount++;
          if (val < dimSpecs.min || val > dimSpecs.max) {
            dimFailedCount++;
          }
        }
      });

      if (dimFilledCount === 0) {
        dimStatus = 'Pending';
      } else if (dimFailedCount > 2) {
        dimStatus = 'NOT OK';
      } else if (dimFilledCount < 20) {
        dimStatus = 'Pending'; // Incomplete
      } else {
        dimStatus = 'OK';
      }

      // ==================== MATERIAL TESTING DATA ====================
      let matSamples = [
        { c: '', si: '', mn: '', p: '', s: '', grainSize: '', inclTypeA: '', inclA: '', inclTypeB: '', inclB: '', inclTypeC: '', inclC: '', inclTypeD: '', inclD: '', hardness: '', decarb: '', remarks: '' },
        { c: '', si: '', mn: '', p: '', s: '', grainSize: '', inclTypeA: '', inclA: '', inclTypeB: '', inclB: '', inclTypeC: '', inclC: '', inclTypeD: '', inclD: '', hardness: '', decarb: '', remarks: '' }
      ];
      let matStatus = 'Pending';

      const draftMatHeat = getFromDraft(localMat?.materialData, normalizedHNo, heatIndex);
      if (draftMatHeat && draftMatHeat.samples) {
        matSamples = draftMatHeat.samples;
      } else {
        const backendMatItems = backendData?.materialTestingData?.filter(
          item => (item.heatNo || '').toString().trim().toUpperCase() === normalizedHNo
        ) || [];
        if (backendMatItems.length > 0) {
          backendMatItems.forEach(item => {
            const idx = (item.sampleNumber || 1) - 1;
            if (idx >= 0 && idx < 2) {
              matSamples[idx] = {
                c: item.carbonPercent !== null ? String(item.carbonPercent) : '',
                si: item.siliconPercent !== null ? String(item.siliconPercent) : '',
                mn: item.manganesePercent !== null ? String(item.manganesePercent) : '',
                p: item.phosphorusPercent !== null ? String(item.phosphorusPercent) : '',
                s: item.sulphurPercent !== null ? String(item.sulphurPercent) : '',
                grainSize: item.grainSize !== null ? String(item.grainSize) : '',
                hardness: item.hardnessHrc !== null ? String(item.hardnessHrc) : '',
                decarb: item.decarbDepthMm !== null ? String(item.decarbDepthMm) : '',
                inclTypeA: item.inclusionTypeA || '',
                inclA: item.inclusionA !== null ? String(item.inclusionA) : '',
                inclTypeB: item.inclusionTypeB || '',
                inclB: item.inclusionB !== null ? String(item.inclusionB) : '',
                inclTypeC: item.inclusionTypeC || '',
                inclC: item.inclusionC !== null ? String(item.inclusionC) : '',
                inclTypeD: item.inclusionTypeD || '',
                inclD: item.inclusionD !== null ? String(item.inclusionD) : '',
                remarks: item.remarks || ''
              };
            }
          });
        }
      }

      // Check if chemical values exist
      const matAnyFilled = matSamples.some(sample => 
        Object.values(sample).some(v => v !== null && v !== undefined && String(v).trim() !== '')
      );

      const matAllFilled = matSamples.every(sample => {
        const isFilled = (val) => val !== null && val !== undefined && String(val).trim() !== '';
        return isFilled(sample.c) && isFilled(sample.si) && isFilled(sample.mn) && isFilled(sample.p) && isFilled(sample.s) &&
          isFilled(sample.grainSize) && isFilled(sample.decarb) && isFilled(sample.hardness) &&
          isFilled(sample.inclA) && isFilled(sample.inclB) && isFilled(sample.inclC) && isFilled(sample.inclD);
      });

      if (!matAnyFilled) {
        matStatus = 'Pending';
      } else if (!matAllFilled) {
        matStatus = 'Pending';
      } else {
        const decarbLimit = productModel?.toUpperCase().includes('V') ? 0.23 : 0.2064;
        const matHasFailure = matSamples.some(sample => {
          const cVal = parseFloat(sample.c);
          const siVal = parseFloat(sample.si);
          const mnVal = parseFloat(sample.mn);
          const pVal = parseFloat(sample.p);
          const sVal = parseFloat(sample.s);
          const gs = parseFloat(sample.grainSize);
          const dc = parseFloat(sample.decarb);
          const ia = parseFloat(sample.inclA);
          const ib = parseFloat(sample.inclB);
          const ic = parseFloat(sample.inclC);
          const id = parseFloat(sample.inclD);

          return (
            cVal < SPEC_LIMITS.c.min || cVal > SPEC_LIMITS.c.max ||
            siVal < SPEC_LIMITS.si.min || siVal > SPEC_LIMITS.si.max ||
            mnVal < SPEC_LIMITS.mn.min || mnVal > SPEC_LIMITS.mn.max ||
            pVal > SPEC_LIMITS.p.max ||
            sVal > SPEC_LIMITS.s.max ||
            gs < SPEC_LIMITS.grainSize.min ||
            dc > decarbLimit ||
            ia > SPEC_LIMITS.inclA.max ||
            ib > SPEC_LIMITS.inclB.max ||
            ic > SPEC_LIMITS.inclC.max ||
            id > SPEC_LIMITS.inclD.max
          );
        });
        matStatus = matHasFailure ? 'NOT OK' : 'OK';
      }

      // ==================== PACKING DETAILS DATA ====================
      let packingInfo = {
        storedHeatWise: '', suppliedInBundles: '', heatNumberEnds: '',
        packingStripWidth: '', bundleTiedLocations: '', identificationTagBundle: '',
        metalTagInformation: '', remarks: ''
      };
      let packingStatus = 'Pending';

      const draftPackHeat = getFromDraft(localPack?.packingDataByHeat, normalizedHNo, heatIndex);
      if (draftPackHeat) {
        packingInfo = draftPackHeat;
      } else {
        const backendPackItem = backendData?.packingStorageData?.find(
          item => (item.heatNo || '').toString().trim().toUpperCase() === normalizedHNo
        );
        if (backendPackItem) {
          packingInfo = {
            storedHeatWise: backendPackItem.storedHeatWise || '',
            suppliedInBundles: backendPackItem.suppliedInBundles || '',
            heatNumberEnds: backendPackItem.heatNumberEnds || '',
            packingStripWidth: backendPackItem.packingStripWidth || '',
            bundleTiedLocations: backendPackItem.bundleTiedLocations || '',
            identificationTagBundle: backendPackItem.identificationTagBundle || '',
            metalTagInformation: backendPackItem.metalTagInformation || '',
            remarks: backendPackItem.remarks || ''
          };
        }
      }

      const packItems = ['storedHeatWise', 'suppliedInBundles', 'heatNumberEnds', 'packingStripWidth', 'bundleTiedLocations', 'identificationTagBundle', 'metalTagInformation'];
      const packAnyAnswered = packItems.some(k => packingInfo[k] === 'Yes' || packingInfo[k] === 'No' || packingInfo[k] === 'N/A');
      const packAllAnswered = packItems.every(k => packingInfo[k] === 'Yes' || packingInfo[k] === 'No' || packingInfo[k] === 'N/A');
      
      if (!packAnyAnswered) {
        packingStatus = 'Pending';
      } else if (!packAllAnswered) {
        packingStatus = 'Pending';
      } else {
        const hasNo = packItems.some(k => packingInfo[k] === 'No');
        packingStatus = hasNo ? 'NOT OK' : 'OK';
      }

      // ==================== CALIBRATION / LADLE DATA ====================
      let ladleChemicalValues = { percentC: null, percentSi: null, percentMn: null, percentP: null, percentS: null };
      let calibrationStatus = 'Pending';

      if (localCal && localCal.heats) {
        const savedCalHeat = localCal.heats.find(h => (h.heatNo || '').toString().trim().toUpperCase() === normalizedHNo);
        if (savedCalHeat) {
          ladleChemicalValues = {
            percentC: savedCalHeat.percentC,
            percentSi: savedCalHeat.percentSi,
            percentMn: savedCalHeat.percentMn,
            percentP: savedCalHeat.percentP,
            percentS: savedCalHeat.percentS
          };
        }
        const hasNotOk = localCal.heats.some(item => item.inspectionStatus === 'NOT OK' || item.calibrationStatus === 'Expired');
        calibrationStatus = hasNotOk ? 'NOT OK' : 'OK';
      } else {
        const backendCalItem = backendData?.calibrationDocumentsData?.find(
          item => (item.heatNo || '').toString().trim().toUpperCase() === normalizedHNo
        );
        if (backendCalItem) {
          ladleChemicalValues = {
            percentC: backendCalItem.ladleCarbonPercent,
            percentSi: backendCalItem.ladleSiliconPercent,
            percentMn: backendCalItem.ladleManganesePercent,
            percentP: backendCalItem.ladlePhosphorusPercent,
            percentS: backendCalItem.ladleSulphurPercent
          };
          const hasNotOk = backendData?.calibrationDocumentsData?.some(
            item => item.inspectionStatus === 'NOT OK' || item.calibrationStatus === 'Expired'
          );
          calibrationStatus = hasNotOk ? 'NOT OK' : 'OK';
        }
      }

      // ==================== MAIN INSPECTION / SEALING DATA ====================
      let totalBundles = localMain?.numberOfBundles || backendData?.preInspectionData?.numberOfBundles || '';
      let sourceOfRawMaterial = localMain?.sourceOfRawMaterial || backendData?.preInspectionData?.sourceOfRawMaterial || '';
      let sealingType = localMain?.heatSealingType?.[heatNo] || backendData?.heatFinalResults?.find(r => r.heatNo === heatNo)?.sealingType || '';
      let steelStampNumber = localMain?.heatSteelStampNumber?.[heatNo] || backendData?.heatFinalResults?.find(r => r.heatNo === heatNo)?.steelStampNumber || '';
      let hologramEntries = localMain?.heatHologramEntries?.[heatNo] || [];

      if (hologramEntries.length === 0) {
        const backendResult = backendData?.heatFinalResults?.find(r => r.heatNo === heatNo);
        if (backendResult?.hologramDetails) {
          hologramEntries = backendResult.hologramDetails.split(', ').map(entry => {
            if (entry.startsWith('Range: ')) {
              const parts = entry.replace('Range: ', '').split(' to ');
              return { type: 'range', from: parts[0] || '', to: parts[1] || '' };
            } else if (entry.startsWith('Single: ')) {
              return { type: 'single', value: entry.replace('Single: ', '') };
            }
            return null;
          }).filter(Boolean);
        }
      }

      let remarks = localMain?.heatRemarks?.[heatNo] || backendData?.heatFinalResults?.find(r => r.heatNo === heatNo)?.remarks || '';

      // ==================== CALCULATE MASS/PIECE RESULTS ====================
      const divisor = getErcDivisor(productModel);
      const heatWeightOffered = parseFloat(heat.weight) || 0;
      const totalOfferedPieces = Math.floor((heatWeightOffered * 1000) / divisor);

      let rejectedWeight = 0;
      let acceptedWeight = 0;
      let acceptedPieces = 0;
      let rejectedPieces = 0;
      let overallStatus = 'PENDING';

      const heatIsEntirelyRejected = dimStatus === 'NOT OK' || matStatus === 'NOT OK';

      if (heatIsEntirelyRejected) {
        rejectedWeight = heatWeightOffered;
        acceptedWeight = 0;
        acceptedPieces = 0;
        rejectedPieces = totalOfferedPieces;
        overallStatus = 'REJECTED';
      } else {
        rejectedWeight = visualWeightRejected;
        acceptedWeight = Math.max(0, heatWeightOffered - rejectedWeight);
        acceptedPieces = Math.floor((acceptedWeight * 1000) / divisor);
        rejectedPieces = Math.floor((rejectedWeight * 1000) / divisor);

        const anyPending = visualStatus === 'Pending' || dimStatus === 'Pending' || matStatus === 'Pending' || packingStatus === 'Pending';
        if (anyPending) {
          overallStatus = 'PENDING';
        } else if (acceptedWeight === heatWeightOffered) {
          overallStatus = 'ACCEPTED';
        } else if (acceptedWeight > 0) {
          overallStatus = 'PARTIALLY_ACCEPTED';
        } else {
          overallStatus = 'REJECTED';
        }
      }

      return {
        heatNo,
        weightOffered: heatWeightOffered,
        weightAccepted: acceptedWeight,
        weightRejected: rejectedWeight,
        piecesOffered: totalOfferedPieces,
        piecesAccepted: acceptedPieces,
        piecesRejected: rejectedPieces,
        overallStatus,
        
        visualStatus,
        visualDefects,
        visualDefectCounts,
        visualRemarks,
        visualWeightRejected,
        visualTotalLengthRejected,
        
        dimStatus,
        dimSamples,
        dimFailedCount,
        dimFilledCount,
        dimSpecs,
        
        matStatus,
        matSamples,
        
        packingStatus,
        packingInfo,
        
        calibrationStatus,
        ladleChemicalValues,
        
        totalBundles,
        sourceOfRawMaterial,
        sealingType,
        steelStampNumber,
        hologramEntries,
        remarks
      };
    });
  }, [heats, backendData, inspectionCallNo, productModel]);

  // Overall consolidated totals
  const consolidatedTotals = useMemo(() => {
    let weightOffered = 0;
    let weightAccepted = 0;
    let weightRejected = 0;
    let piecesOffered = 0;
    let piecesAccepted = 0;
    let piecesRejected = 0;
    let pendingCount = 0;
    let acceptedCount = 0;
    let rejectedCount = 0;
    // eslint-disable-next-line no-unused-vars
    let partiallyAcceptedCount = 0;

    heatSummaries.forEach(s => {
      weightOffered += s.weightOffered;
      weightAccepted += s.weightAccepted;
      weightRejected += s.weightRejected;
      piecesOffered += s.piecesOffered;
      piecesAccepted += s.piecesAccepted;
      piecesRejected += s.piecesRejected;

      if (s.overallStatus === 'PENDING') pendingCount++;
      else if (s.overallStatus === 'ACCEPTED') acceptedCount++;
      else if (s.overallStatus === 'REJECTED') rejectedCount++;
      else if (s.overallStatus === 'PARTIALLY_ACCEPTED') partiallyAcceptedCount++;
    });

    let overallStatus = 'PENDING';
    if (heatSummaries.length > 0) {
      if (pendingCount > 0) {
        overallStatus = 'PENDING';
      } else if (acceptedCount === heatSummaries.length) {
        overallStatus = 'ACCEPTED';
      } else if (rejectedCount === heatSummaries.length) {
        overallStatus = 'REJECTED';
      } else {
        overallStatus = 'PARTIALLY_ACCEPTED';
      }
    }

    return {
      weightOffered,
      weightAccepted,
      weightRejected,
      piecesOffered,
      piecesAccepted,
      piecesRejected,
      overallStatus
    };
  }, [heatSummaries]);

  // Helper to format values
  const formatNum = (num, decimals = 3) => {
    if (num === null || num === undefined || isNaN(num)) return '-';
    return Number(num).toFixed(decimals);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'OK':
      case 'ACCEPTED':
        return 'summary-badge summary-badge-success';
      case 'NOT OK':
      case 'REJECTED':
        return 'summary-badge summary-badge-danger';
      case 'PARTIALLY_ACCEPTED':
        return 'summary-badge summary-badge-warning';
      case 'Pending':
      case 'PENDING':
      default:
        return 'summary-badge summary-badge-info';
    }
  };

  const selectedHeat = heatSummaries[activeHeatIndex] || null;

  // Render chemistry value helper
  const checkChemValid = (field, val) => {
    if (val === '' || val === null || val === undefined) return '';
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    const limit = SPEC_LIMITS[field];
    if (!limit) return '';
    return (num >= limit.min && num <= limit.max) ? 'summary-chem-pass' : 'summary-chem-fail';
  };

  // Render mechanical/other testing value helper
  const checkValueValid = (field, val, maxVal) => {
    if (val === '' || val === null || val === undefined) return '';
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    if (field === 'decarb') {
      const decarbLimit = productModel?.toUpperCase().includes('V') ? 0.23 : 0.2064;
      return num <= decarbLimit ? 'summary-chem-pass' : 'summary-chem-fail';
    }
    const limit = SPEC_LIMITS[field];
    if (!limit) return '';
    return (num >= limit.min && num <= limit.max) ? 'summary-chem-pass' : 'summary-chem-fail';
  };

  return (
    <div className="summary-page-container">
      {/* Header */}
      <div className="summary-page-header">
        <div>
          <h1 className="summary-page-title">📊 Raw Material Inspection Summary</h1>
          <p className="summary-page-subtitle">Auto-compiled consolidated reports for Call: {inspectionCallNo}</p>
        </div>
        <button className="summary-back-btn" onClick={onBack}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Navigation Tabs */}
      <RawMaterialSubmoduleNav
        currentSubmodule="summary-reports"
        onNavigate={onNavigateSubmodule}
      />

      {isLoading ? (
        <div className="summary-loading-container">
          <div className="summary-spinner"></div>
          <p>Compiling inspection reports from drafts and database...</p>
        </div>
      ) : (
        <>
          {/* Top Metrics Row */}
          <div className="summary-metrics-grid">
            <div className="summary-metric-card summary-metric-blue">
              <span className="summary-metric-icon">⚖️</span>
              <div className="summary-metric-details">
                <span className="summary-metric-label">Total Qty Offered</span>
                <span className="summary-metric-value">{formatNum(consolidatedTotals.weightOffered, 2)} MT</span>
                <span className="summary-metric-sub">{consolidatedTotals.piecesOffered.toLocaleString()} Pieces</span>
              </div>
            </div>

            <div className="summary-metric-card summary-metric-green">
              <span className="summary-metric-icon">✅</span>
              <div className="summary-metric-details">
                <span className="summary-metric-label">Total Qty Accepted</span>
                <span className="summary-metric-value">{formatNum(consolidatedTotals.weightAccepted, 2)} MT</span>
                <span className="summary-metric-sub">{consolidatedTotals.piecesAccepted.toLocaleString()} Pieces</span>
              </div>
            </div>

            <div className="summary-metric-card summary-metric-red">
              <span className="summary-metric-icon">❌</span>
              <div className="summary-metric-details">
                <span className="summary-metric-label">Total Qty Rejected</span>
                <span className="summary-metric-value">{formatNum(consolidatedTotals.weightRejected, 6)} MT</span>
                <span className="summary-metric-sub">{consolidatedTotals.piecesRejected.toLocaleString()} Pieces</span>
              </div>
            </div>

            <div className="summary-metric-card summary-metric-orange">
              <span className="summary-metric-icon">📋</span>
              <div className="summary-metric-details">
                <span className="summary-metric-label">Overall Call Status</span>
                <span className={getStatusBadgeClass(consolidatedTotals.overallStatus)}>
                  {consolidatedTotals.overallStatus}
                </span>
                <span className="summary-metric-sub">Across {heats.length} Heats</span>
              </div>
            </div>
          </div>

          {/* Heat Selector */}
          <div className="summary-section-header">
            <h2 className="summary-section-h2">🔬 Per Heat Inspection Results</h2>
          </div>
          <HeatToggle
            heats={heats}
            activeHeatIndex={activeHeatIndex}
            onHeatChange={setActiveHeatIndex}
          />

          {selectedHeat && (
            <div className="summary-report-dashboard">
              {/* Heat Info Header */}
              <div className="summary-heat-header">
                <div className="summary-heat-title-box">
                  <span className="summary-heat-label">Heat Number</span>
                  <h3 className="summary-heat-h3">{selectedHeat.heatNo}</h3>
                </div>
                <div className="summary-heat-status-box">
                  <span className="summary-heat-label">Heat Evaluation</span>
                  <span className={getStatusBadgeClass(selectedHeat.overallStatus)}>
                    {selectedHeat.overallStatus}
                  </span>
                </div>
                <div className="summary-heat-summary-box">
                  <span className="summary-heat-label">Qty Accepted / Offered</span>
                  <span className="summary-heat-summary-weight">
                    {formatNum(selectedHeat.weightAccepted, 2)} / {formatNum(selectedHeat.weightOffered, 2)} MT
                  </span>
                </div>
              </div>

              {/* 2x2 Grid of Module Cards */}
              <div className="summary-grid">
                
                {/* CARD 1: VISUAL INSPECTION */}
                <div className="summary-card">
                  <div className="summary-card-header">
                    <h4 className="summary-card-title">👁️ Visual Inspection</h4>
                    <span className={getStatusBadgeClass(selectedHeat.visualStatus)}>{selectedHeat.visualStatus}</span>
                  </div>
                  <div className="summary-card-body">
                    {selectedHeat.visualDefects.length === 0 ? (
                      <div className="summary-empty-state">
                        <span className="summary-empty-icon">✓</span>
                        <p>No visual defects found. Material is completely sound.</p>
                      </div>
                    ) : (
                      <>
                        <table className="summary-card-table">
                          <thead>
                            <tr>
                              <th>Defect Type</th>
                              <th>Rejected Length (m)</th>
                              <th>Rejected Wt (MT)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedHeat.visualDefects.map(defect => {
                              const len = selectedHeat.visualDefectCounts[defect] || 0;
                              const wFactor = productModel?.toUpperCase().includes('V') ? 0.00326 : 0.00263;
                              const wt = len * wFactor;
                              return (
                                <tr key={defect}>
                                  <td>{defect}</td>
                                  <td>{formatNum(len, 3)} m</td>
                                  <td className="summary-text-danger">{formatNum(wt, 6)} MT</td>
                                </tr>
                              );
                            })}
                            <tr className="summary-table-total-row">
                              <td><strong>Total</strong></td>
                              <td><strong>{formatNum(selectedHeat.visualTotalLengthRejected, 3)} m</strong></td>
                              <td className="summary-text-danger"><strong>{formatNum(selectedHeat.visualWeightRejected, 6)} MT</strong></td>
                            </tr>
                          </tbody>
                        </table>
                        {selectedHeat.visualRemarks && (
                          <div className="summary-remarks-box">
                            <strong>Remarks:</strong> {selectedHeat.visualRemarks}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* CARD 2: DIMENSIONAL CHECK */}
                <div className="summary-card">
                  <div className="summary-card-header">
                    <h4 className="summary-card-title">📐 Dimensional Check</h4>
                    <span className={getStatusBadgeClass(selectedHeat.dimStatus)}>{selectedHeat.dimStatus}</span>
                  </div>
                  <div className="summary-card-body">
                    <div className="summary-dim-meta">
                      <div>
                        <span className="summary-dim-label">Tolerance Spec:</span>
                        <strong className="summary-dim-val">
                          {selectedHeat.dimSpecs.min} - {selectedHeat.dimSpecs.max} mm ({productModel})
                        </strong>
                      </div>
                      <div>
                        <span className="summary-dim-label">Rejections:</span>
                        <strong className={`summary-dim-val ${selectedHeat.dimFailedCount > 0 ? 'summary-text-danger' : 'summary-text-success'}`}>
                          {selectedHeat.dimFailedCount} samples rejected out of 20
                        </strong>
                      </div>
                    </div>

                    {selectedHeat.dimFilledCount === 0 ? (
                      <div className="summary-empty-state summary-empty-pending">
                        <span className="summary-empty-icon">⏳</span>
                        <p>Dimensional samples have not been checked yet.</p>
                      </div>
                    ) : (
                      <div className="summary-dim-grid">
                        {selectedHeat.dimSamples.map((sample, idx) => {
                          const val = sample?.diameter ? parseFloat(sample.diameter) : null;
                          let sampleClass = 'summary-dim-dot-pending';
                          let titleText = `Sample ${idx + 1}: Not measured`;

                          if (val !== null && !isNaN(val)) {
                            const isWithin = val >= selectedHeat.dimSpecs.min && val <= selectedHeat.dimSpecs.max;
                            sampleClass = isWithin ? 'summary-dim-dot-valid' : 'summary-dim-dot-invalid';
                            titleText = `Sample ${idx + 1}: ${val} mm (${isWithin ? 'OK' : 'OUTSIDE TOLERANCE'})`;
                          }
                          return (
                            <div
                              key={idx}
                              className={`summary-dim-dot ${sampleClass}`}
                              title={titleText}
                            >
                              {sample.diameter ? formatNum(sample.diameter, 1) : '-'}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD 3: MATERIAL TESTING */}
                <div className="summary-card summary-card-full-width">
                  <div className="summary-card-header">
                    <h4 className="summary-card-title">🧪 Material Testing (Chemical &amp; Metallurgical)</h4>
                    <span className={getStatusBadgeClass(selectedHeat.matStatus)}>{selectedHeat.matStatus}</span>
                  </div>
                  <div className="summary-card-body">
                    {/* Chemical Analysis Table */}
                    <h5 className="summary-sub-title">Chemical &amp; Mechanical Properties (2 samples)</h5>
                    <div className="summary-table-container">
                      <table className="summary-card-table summary-testing-table">
                        <thead>
                          <tr>
                            <th>Sample</th>
                            <th>%C <span className="summary-limit">(0.50-0.60)</span></th>
                            <th>%Si <span className="summary-limit">(1.50-2.00)</span></th>
                            <th>%Mn <span className="summary-limit">(0.80-1.00)</span></th>
                            <th>%P <span className="summary-limit">(≤0.030)</span></th>
                            <th>%S <span className="summary-limit">(≤0.030)</span></th>
                            <th>Grain Size <span className="summary-limit">(≥6)</span></th>
                            <th>Hardness <span className="summary-limit">(HRC)</span></th>
                            <th>Decarb <span className="summary-limit">(≤{productModel?.toUpperCase().includes('V') ? '0.23' : '0.206'}mm)</span></th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Ladle Chemistry Row */}
                          <tr className="summary-ladle-row">
                            <td><strong>Ladle analysis</strong></td>
                            <td>{formatNum(selectedHeat.ladleChemicalValues.percentC)}</td>
                            <td>{formatNum(selectedHeat.ladleChemicalValues.percentSi)}</td>
                            <td>{formatNum(selectedHeat.ladleChemicalValues.percentMn)}</td>
                            <td>{formatNum(selectedHeat.ladleChemicalValues.percentP)}</td>
                            <td>{formatNum(selectedHeat.ladleChemicalValues.percentS)}</td>
                            <td className="summary-text-muted">N/A</td>
                            <td className="summary-text-muted">N/A</td>
                            <td className="summary-text-muted">N/A</td>
                          </tr>
                          {selectedHeat.matSamples.map((sample, idx) => (
                            <tr key={idx}>
                              <td><strong>Sample {idx + 1}</strong></td>
                              <td className={checkChemValid('c', sample.c)}>{formatNum(sample.c)}</td>
                              <td className={checkChemValid('si', sample.si)}>{formatNum(sample.si)}</td>
                              <td className={checkChemValid('mn', sample.mn)}>{formatNum(sample.mn)}</td>
                              <td className={checkChemValid('p', sample.p)}>{formatNum(sample.p)}</td>
                              <td className={checkChemValid('s', sample.s)}>{formatNum(sample.s)}</td>
                              <td className={checkValueValid('grainSize', sample.grainSize)}>{sample.grainSize || '-'}</td>
                              <td>{sample.hardness ? `${sample.hardness} HRC` : '-'}</td>
                              <td className={checkValueValid('decarb', sample.decarb)}>{sample.decarb ? `${formatNum(sample.decarb, 2)} mm` : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Inclusion Ratings */}
                    <h5 className="summary-sub-title" style={{ marginTop: '20px' }}>Inclusion Ratings (Type &amp; Rating ≤ 2.0)</h5>
                    <div className="summary-inclusion-row">
                      {selectedHeat.matSamples.map((sample, idx) => (
                        <div key={idx} className="summary-inclusion-card">
                          <span className="summary-inclusion-header">Sample {idx + 1} Inclusions</span>
                          <div className="summary-inclusion-grid">
                            {['A', 'B', 'C', 'D'].map(type => {
                              const rating = sample[`incl${type}`];
                              const structType = sample[`inclType${type}`];
                              const isValid = rating ? parseFloat(rating) <= 2.0 : true;
                              return (
                                <div key={type} className="summary-inclusion-item">
                                  <span className="summary-inclusion-label">Type {type}</span>
                                  <strong className={`summary-inclusion-value ${isValid ? 'summary-text-success' : 'summary-text-danger'}`}>
                                    {rating ? `${rating} (${structType || 'Thin'})` : '-'}
                                  </strong>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CARD 4: PACKING & MARKING DETAILS */}
                <div className="summary-card">
                  <div className="summary-card-header">
                    <h4 className="summary-card-title">📦 Packing Verification</h4>
                    <span className={getStatusBadgeClass(selectedHeat.packingStatus)}>{selectedHeat.packingStatus}</span>
                  </div>
                  <div className="summary-card-body">
                    <ul className="summary-detail-list">
                      <li>
                        <span className="summary-detail-label">Heat Number:</span>
                        <strong className="summary-detail-val">{selectedHeat.heatNo}</strong>
                      </li>
                      <li>
                        <span className="summary-detail-label">Total Bundles:</span>
                        <strong className="summary-detail-val">{selectedHeat.totalBundles || '-'}</strong>
                      </li>
                      <li>
                        <span className="summary-detail-label">Bundles Tied with Wire/Strap:</span>
                        <strong className={`summary-detail-val ${selectedHeat.packingInfo.suppliedInBundles === 'Yes' ? 'summary-text-success' : (selectedHeat.packingInfo.suppliedInBundles === 'No' ? 'summary-text-danger' : '')}`}>
                          {selectedHeat.packingInfo.suppliedInBundles || 'Pending'}
                        </strong>
                      </li>
                      <li>
                        <span className="summary-detail-label">Total Pieces Offered:</span>
                        <strong className="summary-detail-val">{selectedHeat.piecesOffered.toLocaleString()} nos</strong>
                      </li>
                      <li>
                        <span className="summary-detail-label">Stored Heat-Wise Stacked:</span>
                        <strong className="summary-detail-val">{selectedHeat.packingInfo.storedHeatWise || 'Pending'}</strong>
                      </li>
                      <li>
                        <span className="summary-detail-label">Identification Tag on Bundle:</span>
                        <strong className="summary-detail-val">{selectedHeat.packingInfo.identificationTagBundle || 'Pending'}</strong>
                      </li>
                      <li>
                        <span className="summary-detail-label">Packing Strip Width (18-33mm):</span>
                        <strong className="summary-detail-val">{selectedHeat.packingInfo.packingStripWidth || 'Pending'}</strong>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* CARD 5: MARKING & SEALING */}
                <div className="summary-card">
                  <div className="summary-card-header">
                    <h4 className="summary-card-title">🏷️ Marking &amp; Sealing details</h4>
                    <span className="summary-badge summary-badge-success">OK</span>
                  </div>
                  <div className="summary-card-body">
                    <ul className="summary-detail-list">
                      <li>
                        <span className="summary-detail-label">Mfg Name:</span>
                        <strong className="summary-detail-val">
                          {poDetails?.vendorName || selectedCall?.vendor_name || heats[activeHeatIndex]?.manufacturerName || 'N/A'}
                        </strong>
                      </li>
                      <li>
                        <span className="summary-detail-label">Heat Number:</span>
                        <strong className="summary-detail-val">{selectedHeat.heatNo}</strong>
                      </li>
                      <li>
                        <span className="summary-detail-label">Material Description:</span>
                        <div className="summary-detail-multiline">
                          {poDetails?.itemDescription || selectedCall?.po_description || 'N/A'}
                        </div>
                      </li>
                      <li className="summary-divider"></li>
                      <li>
                        <span className="summary-detail-label">Sealing Type Selected:</span>
                        <strong className="summary-detail-val">
                          {selectedHeat.sealingType === 'RITES_STEEL_PUNCH' ? 'Steel Punch Seal' : (selectedHeat.sealingType === 'RITES_HOLOGRAM' ? 'Hologram Seal' : 'Pending')}
                        </strong>
                      </li>
                      {selectedHeat.sealingType === 'RITES_STEEL_PUNCH' && (
                        <li>
                          <span className="summary-detail-label">IE Steel Stamp No:</span>
                          <strong className="summary-detail-val summary-text-blue">{selectedHeat.steelStampNumber || '-'}</strong>
                        </li>
                      )}
                      {selectedHeat.sealingType === 'RITES_HOLOGRAM' && (
                        <li>
                          <span className="summary-detail-label">Hologram Details:</span>
                          <div className="summary-hologram-tags">
                            {selectedHeat.hologramEntries.length === 0 ? (
                              <span className="summary-text-muted">No holograms entered</span>
                            ) : (
                              selectedHeat.hologramEntries.map((holo, hIdx) => (
                                <span key={hIdx} className="summary-hologram-tag">
                                  {holo.type === 'range' ? `Range: ${holo.from} - ${holo.to}` : `Single: ${holo.value}`}
                                </span>
                              ))
                            )}
                          </div>
                        </li>
                      )}
                      {selectedHeat.remarks && (
                        <li className="summary-remarks-list-item">
                          <span className="summary-detail-label">Overall Heat Remarks:</span>
                          <div className="summary-remarks-val">{selectedHeat.remarks}</div>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SummaryReportsPage;
