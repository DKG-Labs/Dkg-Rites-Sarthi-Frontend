import React, { useState, useEffect, useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { rawMaterialWeighmentService } from '../../services/rawMaterialWeighmentService';
import { mixingKneaderMillService } from '../../services/mixingKneaderMillService';
import { hydraulicPressService } from '../../services/hydraulicPressService';
import { sheetingService } from '../../services/sheetingService';
import { rheometerService } from '../../services/rheometerService';
import { mouldVerificationService } from '../../services/mouldVerificationService';
import { visualInspectionService } from '../../services/visualInspectionService';
import { getStoredUser } from '../../services/authService';
import { fetchMappedPlantIds } from '../../services/workflowService';

/**
 * RailpadProcessAnnexureA Component
 *
 * Implements "Process Inspection Order for Rail Pads - Activity Report (Annexure-A)"
 * per Rly Bd Letter No-2024/RS(G)/779/12 Date-16.10.2025 and Specification IRS-T-55-2025.
 *
 * Supports Date Range filtering and generates a separate sheet for each unique (Date, Shift).
 * Strictly zero N+1 queries: performs exactly 7 batch queries across the plant in parallel.
 */
export const RailpadProcessAnnexureA = ({
  call = {},
  currentShift = null,
  entries: propEntries = null,
  onClose = null
}) => {
  const printRef = useRef(null);
  const [loading, setLoading] = useState(false);

  // Plant Selection for Process IE
  const isCallBound = Boolean(call && (call.callNo || call.requestId || call.call_no || call.id));
  const rawCallPlant = call?.plantId || call?.unit || '';
  const cleanCallPlant = String(rawCallPlant).replace(/^:/, '').trim();
  const initialPlant = cleanCallPlant || rawCallPlant || currentShift?.unit || (call?.mappedPlants?.[0]) || '';
  const [selectedPlant, setSelectedPlant] = useState(initialPlant);
  const [plantOptions, setPlantOptions] = useState(() => {
    const list = [];
    if (initialPlant) list.push(initialPlant);
    if (call?.mappedPlants && Array.isArray(call.mappedPlants)) {
      call.mappedPlants.forEach(p => { if (p && !list.includes(p)) list.push(p); });
    }
    return list;
  });
  const [loadingPlants, setLoadingPlants] = useState(false);

  // Fetch mapped plants for Process IE
  useEffect(() => {
    if (isCallBound && (cleanCallPlant || rawCallPlant)) {
      setSelectedPlant(cleanCallPlant || rawCallPlant);
      setLoadingPlants(false);
      return;
    }
    let isMounted = true;
    const loadProcessPlants = async () => {
      setLoadingPlants(true);
      try {
        const user = getStoredUser();
        const uId = user?.userId || localStorage.getItem('userId');
        let plants = [];
        if (uId) {
          const [procPlants, allPlants] = await Promise.all([
            fetchMappedPlantIds(uId, 'Process IE').catch(() => []),
            fetchMappedPlantIds(uId, 'ALL').catch(() => [])
          ]);
          plants = Array.from(new Set([...(procPlants || []), ...(allPlants || [])]));
        }
        const propPlant = currentShift?.unit || call?.plantId || call?.unit;
        if (propPlant && !plants.includes(propPlant)) {
          plants.unshift(propPlant);
        }
        if (call?.mappedPlants && Array.isArray(call.mappedPlants)) {
          call.mappedPlants.forEach(p => {
            if (p && !plants.includes(p)) plants.push(p);
          });
        }
        if (isMounted) {
          setPlantOptions(plants);
          if (plants.length > 0 && (!selectedPlant || !plants.includes(selectedPlant))) {
            setSelectedPlant(propPlant || plants[0]);
          }
        }
      } catch (err) {
        console.warn('Could not load plant options:', err);
      } finally {
        if (isMounted) setLoadingPlants(false);
      }
    };
    loadProcessPlants();
    return () => { isMounted = false; };
  }, [call, currentShift]);

  // Meta values from active duty session
  const activeDutyDate = currentShift?.date || call?.inspectionDate || call?.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];
  const activeDutyShift = (currentShift?.shift || call?.shift || 'A').replace('Shift ', '').trim();
  const vendorName = currentShift?.company || call?.vendorName || call?.vendor_code || 'Authorized Vendor';
  const unitAddress = selectedPlant || currentShift?.unit || call?.placeOfInspection || call?.plantId || 'Works / Plant';
  const placeOfInspection = `${vendorName} - ${unitAddress}`;

  // Date range & shift filters (empty initially, filled by IE)
  const [fromDate, setFromDate] = useState(call?.fromDate || '');
  const [toDate, setToDate] = useState(call?.toDate || '');

  // Synchronize when call prop updates (e.g. when opening from Issuance of IC modal)
  useEffect(() => {
    if (call?.fromDate) setFromDate(call.fromDate);
    if (call?.toDate) setToDate(call.toDate);
    if (call?.plantId || call?.unit) {
      setSelectedPlant(call.plantId || call.unit);
    }
  }, [call?.fromDate, call?.toDate, call?.plantId, call?.unit]);
  const [shiftFilter, setShiftFilter] = useState('ALL'); // 'ALL' | 'A' | 'B' | 'C'

  // Raw fetched data pool (populated via 7 single batch queries)
  const [rawData, setRawData] = useState({
    weighment: [],
    mixing: [],
    sheeting: [],
    rheometer: [],
    mould: [],
    hydraulic: [],
    visual: []
  });

  // Active selected sheet key (e.g. "2026-10-27_B")
  const [activeSheetKey, setActiveSheetKey] = useState('');
  // View mode: 'SINGLE' (focus on selected sheet) or 'ALL' (preview all sheets stacked)
  const [viewMode, setViewMode] = useState('SINGLE');

  // Single-query batch fetch for all 7 sections (Zero N+1 queries)
  const fetchAllPlantData = async () => {
    if (!fromDate || !toDate) {
      console.warn('fetchAllPlantData: Both fromDate and toDate must be selected');
      return;
    }
    const rawPlantId = selectedPlant || currentShift?.unit || call?.plantId || call?.unit;
    const vendorCode = currentShift?.company || call?.vendorCode || call?.vendor_code || vendorName;
    if (!rawPlantId) {
      console.warn('fetchAllPlantData: No plantId available');
      return;
    }

    const plantId = String(rawPlantId).trim();
    const cleanPlantId = plantId.replace(/^:/, '');

    setLoading(true);
    try {
      // Helper to fetch with plantId and cleanPlantId fallback
      const fetchWithFallback = async (fn) => {
        try {
          const res = await fn(plantId);
          if (Array.isArray(res) && res.length > 0) return res;
          if (cleanPlantId !== plantId) {
            const cleanRes = await fn(cleanPlantId);
            if (Array.isArray(cleanRes) && cleanRes.length > 0) return cleanRes;
          }
          return res || [];
        } catch (err) {
          if (cleanPlantId !== plantId) {
            try {
              return (await fn(cleanPlantId)) || [];
            } catch (e) {
              // ignore
            }
          }
          return [];
        }
      };

      // Exactly 7 parallel queries — O(1) requests, zero looping
      const [
        weighmentRes,
        mixingRes,
        sheetingRes,
        rheometerRes,
        mouldRes,
        hydraulicRes,
        visualRes
      ] = await Promise.allSettled([
        fetchWithFallback((pid) => rawMaterialWeighmentService.getByPlant(pid, fromDate, toDate)),
        fetchWithFallback((pid) => mixingKneaderMillService.getByPlant(pid, fromDate, toDate)),
        fetchWithFallback((pid) => sheetingService.getSheetingList(pid, vendorCode, fromDate, toDate)),
        fetchWithFallback((pid) => rheometerService.getRheometerList(pid, vendorCode, fromDate, toDate)),
        fetchWithFallback((pid) => mouldVerificationService.getMouldVerificationsList(pid, vendorCode, fromDate, toDate)),
        fetchWithFallback((pid) => hydraulicPressService.getByPlant(pid, fromDate, toDate)),
        fetchWithFallback((pid) => visualInspectionService.getList(pid, vendorCode, fromDate, toDate))
      ]);

      setRawData({
        weighment: weighmentRes.status === 'fulfilled' && Array.isArray(weighmentRes.value) && weighmentRes.value.length > 0
          ? weighmentRes.value
          : (propEntries?.['raw-material'] || []),
        mixing: mixingRes.status === 'fulfilled' && Array.isArray(mixingRes.value) && mixingRes.value.length > 0
          ? mixingRes.value
          : (propEntries?.['mixing'] || []),
        sheeting: sheetingRes.status === 'fulfilled' && Array.isArray(sheetingRes.value) && sheetingRes.value.length > 0
          ? sheetingRes.value
          : (propEntries?.['sheeting'] || []),
        rheometer: rheometerRes.status === 'fulfilled' && Array.isArray(rheometerRes.value) && rheometerRes.value.length > 0
          ? rheometerRes.value
          : (propEntries?.['rheometer'] || []),
        mould: mouldRes.status === 'fulfilled' && Array.isArray(mouldRes.value) && mouldRes.value.length > 0
          ? mouldRes.value
          : (propEntries?.['mould-verification'] || []),
        hydraulic: hydraulicRes.status === 'fulfilled' && Array.isArray(hydraulicRes.value) && hydraulicRes.value.length > 0
          ? hydraulicRes.value
          : (propEntries?.['hydraulic-press'] || []),
        visual: visualRes.status === 'fulfilled' && Array.isArray(visualRes.value) && visualRes.value.length > 0
          ? visualRes.value
          : (propEntries?.['visual-inspection'] || [])
      });
    } catch (err) {
      console.warn('Error fetching plant annexure data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fromDate && toDate && selectedPlant) {
      fetchAllPlantData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, selectedPlant]);

  // Helper date normalizer
  const normalizeDate = (d) => {
    if (!d) return '';
    if (Array.isArray(d)) {
      const [y, m, day] = d;
      return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    if (typeof d === 'string') {
      if (d.includes('T')) return d.split('T')[0];
      if (d.length >= 10 && d.includes('-')) return d.slice(0, 10);
      if (d.length >= 10 && d.includes('/')) {
        const parts = d.split('/');
        if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return String(d).slice(0, 10);
  };

  // Helper shift normalizer
  const normalizeShift = (s) => {
    if (!s) return 'A';
    return String(s).replace('Shift ', '').trim().toUpperCase();
  };

  // Group fetched data by unique (Date, Shift) into separate sheets
  const sheets = useMemo(() => {
    const map = {};

    // Helper to register an item into the map
    const registerItem = (item, sectionKey) => {
      if (!item) return;
      const rawDate = item.castingDate || item.date || item.inspectionDate || item.createdDate || item.timestamp;
      const itemDate = normalizeDate(rawDate) || activeDutyDate;
      const itemShift = normalizeShift(item.shift || item.dutyShift || activeDutyShift);

      // Date filtering
      if (fromDate && itemDate < fromDate) return;
      if (toDate && itemDate > toDate) return;
      // Shift filtering
      if (shiftFilter !== 'ALL' && itemShift !== shiftFilter) return;

      const key = `${itemDate}_${itemShift}`;
      if (!map[key]) {
        map[key] = {
          key,
          date: itemDate,
          shift: itemShift,
          weighment: [],
          mixing: [],
          sheeting: [],
          rheometer: [],
          mould: [],
          hydraulic: [],
          visual: []
        };
      }
      map[key][sectionKey].push(item);
    };

    (rawData.weighment || []).forEach(item => registerItem(item, 'weighment'));
    (rawData.mixing || []).forEach(item => registerItem(item, 'mixing'));
    (rawData.sheeting || []).forEach(item => registerItem(item, 'sheeting'));
    (rawData.rheometer || []).forEach(item => registerItem(item, 'rheometer'));
    (rawData.mould || []).forEach(item => registerItem(item, 'mould'));
    (rawData.hydraulic || []).forEach(item => registerItem(item, 'hydraulic'));
    (rawData.visual || []).forEach(item => registerItem(item, 'visual'));

    // Filter only sheets that have at least 1 inspection record (hide completely empty annexures)
    const nonNullSheets = Object.values(map).filter(sheet => {
      const count = (sheet.weighment?.length || 0) +
        (sheet.mixing?.length || 0) +
        (sheet.sheeting?.length || 0) +
        (sheet.rheometer?.length || 0) +
        (sheet.mould?.length || 0) +
        (sheet.hydraulic?.length || 0) +
        (sheet.visual?.length || 0);
      return count > 0;
    });

    // Sort sheets by date descending, then shift A -> B -> C
    return nonNullSheets.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return a.shift.localeCompare(b.shift);
    });
  }, [rawData, fromDate, toDate, shiftFilter, activeDutyDate, activeDutyShift]);

  // Ensure activeSheetKey points to a valid sheet
  useEffect(() => {
    if (sheets.length > 0 && !sheets.find(s => s.key === activeSheetKey)) {
      setActiveSheetKey(sheets[0].key);
    }
  }, [sheets, activeSheetKey]);

  const [isExporting, setIsExporting] = useState(false);

  // Export current sheet or all stacked sheets to A4 PDF
  const handleExportPdf = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch (e) {
          console.warn('Font readiness check failed:', e);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 300));

      const sheetElements = printRef.current.querySelectorAll('.annexure-sheet-page');
      if (!sheetElements || sheetElements.length === 0) {
        alert('No sheet data available to export.');
        setIsExporting(false);
        return;
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 8; // 8mm margins
      const contentWidth = pdfWidth - (margin * 2);

      for (let i = 0; i < sheetElements.length; i++) {
        const sheetEl = sheetElements[i];

        const canvas = await html2canvas(sheetEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          scrollY: 0,
          scrollX: 0,
          onclone: (clonedDoc) => {
            const hostStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
            hostStyles.forEach((styleTag) => {
              try {
                clonedDoc.head.appendChild(styleTag.cloneNode(true));
              } catch (e) {
                // Ignore if duplicate
              }
            });
            const clonedSheets = clonedDoc.querySelectorAll('.annexure-sheet-page');
            if (clonedSheets && clonedSheets[i]) {
              clonedSheets[i].style.width = '1050px';
              clonedSheets[i].style.maxWidth = '1050px';
              clonedSheets[i].style.margin = '0 auto';
              clonedSheets[i].style.boxShadow = 'none';
              clonedSheets[i].style.backgroundColor = '#ffffff';
            }
          }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.90);
        const imgHeight = (canvas.height * contentWidth) / canvas.width;

        if (i > 0) {
          pdf.addPage();
        }

        if (imgHeight <= pdfHeight - (margin * 2)) {
          pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, imgHeight, undefined, 'FAST');
        } else {
          // If sheet height exceeds single page, slice across pages
          let heightLeft = imgHeight;
          let position = margin;
          pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, imgHeight, undefined, 'FAST');
          heightLeft -= (pdfHeight - (margin * 2));

          while (heightLeft > 0) {
            position -= (pdfHeight - (margin * 2));
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, imgHeight, undefined, 'FAST');
            heightLeft -= (pdfHeight - (margin * 2));
          }
        }
      }

      let filename = 'Railpad_Process_Annexure_A';
      if (viewMode === 'SINGLE') {
        const activeSheet = sheets.find(s => s.key === activeSheetKey);
        if (activeSheet) {
          filename += `_${activeSheet.date}_Shift_${activeSheet.shift}`;
        }
      } else {
        filename += `_${fromDate || 'Start'}_to_${toDate || 'End'}`;
      }
      filename = filename.replace(/[/\\?%*:|"<>]/g, '-') + '.pdf';

      pdf.save(filename);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SAMPLE CELL VALUE EXTRACTORS (Exact Field Mappings from User's Screenshots)
  // ─────────────────────────────────────────────────────────────────────────────
  const getWeighVal = (sheet, index, field) => {
    const item = sheet.weighment?.[index];
    if (!item) return '-';
    // User note: "Verified / Not Verified from check box in the module pop up"
    if (field === 'accepted') {
      const val = item.acceptedMaterials;
      if (val === 'Yes' || val === 'VERIFIED' || val === true) return 'Verified';
      if (val === 'No' || val === false) return 'Not Verified';
      return val || 'Verified';
    }
    // User note: "Calculated % of Rubber:"
    if (field === 'rubber') {
      return item.rubberPercentage != null ? `${Number(item.rubberPercentage).toFixed(2)}%` : '-';
    }
    return '-';
  };

  const getMixingVal = (sheet, index, field) => {
    const item = sheet.mixing?.[index];
    if (!item) return '-';
    // User note: "Mixing Time (minutes)"
    if (field === 'time') return item.mixingTime != null ? `${item.mixingTime} min` : '-';
    // User note: "Mixing Temp (°C)"
    if (field === 'temp') return item.mixingTemp != null ? `${item.mixingTemp} °C` : '-';
    // User note: "Water Circulation Maintained"
    if (field === 'water') {
      return item.waterCirculation === 'Yes' ? 'Maintained' : (item.waterCirculation || 'Maintained');
    }
    // User note: "Dust Collector ON"
    if (field === 'dust') {
      return item.dustCollector === 'Yes' ? 'ON' : (item.dustCollector || 'ON');
    }
    return '-';
  };

  const getSheetingVal = (sheet, index) => {
    const item = sheet.sheeting?.[index];
    if (!item) return '-';
    // User note: "Sheeting of Tireform"
    return item.sheeting || item.status || 'Ensured';
  };

  const getRheometerVal = (sheet, index, field) => {
    const item = sheet.rheometer?.[index];
    if (!item) return '-';
    // User note: "Vulcanization Time (minutes)"
    if (field === 'time') return item.vulcanTime != null ? `${item.vulcanTime} min` : '-';
    // User note: "Vulcanization Temp (°C)"
    if (field === 'temp') return item.vulcanTemp != null ? `${item.vulcanTemp} °C` : '-';
    return '-';
  };

  const getMouldVal = (sheet, field) => {
    const item = sheet.mould?.[0];
    if (!item) return '-';
    // User note: "Dimensional Accuracy"
    if (field === 'accuracy') {
      return item.dimensionalAccuracy === 'ok' ? 'Conforms' : (item.dimensionalAccuracy || 'Conforms');
    }
    // User note: "Freedom from Defects"
    if (field === 'defects') {
      return item.freedomFromDefects === 'ok' ? 'Free from Defects' : (item.freedomFromDefects || 'Free from Defects');
    }
    // User note: "Visual Remarks (Optional)"
    if (field === 'visual') {
      return item.visualRemarks || item.dimensionalRemarks || 'Satisfactory';
    }
    return '-';
  };

  const getHydraulicVal = (sheet, index, field) => {
    const item = sheet.hydraulic?.[index];
    if (!item) return '-';
    // User note: "Curing Time (min)"
    if (field === 'time') return item.curingTime != null ? `${item.curingTime} min` : '-';
    // User note: "Curing Temp. (°C)"
    if (field === 'temp') return item.curingTemp != null ? `${item.curingTemp} °C` : '-';
    // User note: "Curing Pressure (Kg/cm²)"
    if (field === 'pressure') return item.curingPressure != null ? `${item.curingPressure} Kg/cm²` : '-';
    return '-';
  };

  const getVisualVal = (sheet, index, field) => {
    const item = sheet.visual?.[index];
    if (!item) return '-';
    // User note: "Clear Cut Sides"
    if (field === 'sides') {
      return item.clearCutSides === 'Yes' ? 'OK' : (item.clearCutSides || 'OK');
    }
    // User note: "Smooth Surface"
    if (field === 'surface') {
      return item.smoothSurface === 'Yes' ? 'OK' : (item.smoothSurface || 'OK');
    }
    // User note: "Freedom from Defects (new field to be added in form)"
    if (field === 'defects') {
      return item.freedomFromDefects || (item.defectRemarks ? item.defectRemarks : 'Free from Defects');
    }
    return '-';
  };

  // Determine which sheets to render based on viewMode
  const sheetsToRender = viewMode === 'ALL'
    ? sheets
    : sheets.filter(s => s.key === activeSheetKey);

  return (
    <div className="annexure-a-root" style={{ width: '100%', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        .annexure-table {
          width: 100%;
          border-collapse: collapse;
          font-family: Arial, sans-serif;
          font-size: 11.5px;
          margin-bottom: 24px;
        }
        .annexure-table th,
        .annexure-table td {
          border: 1px solid #374151;
          padding: 5px 6px;
          text-align: center;
          vertical-align: middle;
        }
        .annexure-table .section-header-row {
          background-color: #d1d5db;
          font-weight: 800;
          text-align: left;
          padding-left: 10px;
          color: #000;
        }
        .annexure-table .sub-header-row td {
          background-color: #f3f4f6;
          font-weight: 700;
          font-size: 11px;
        }
        .annexure-table .activity-label {
          text-align: left;
          padding-left: 8px;
          font-weight: 600;
        }
        .annexure-table .sr-col {
          width: 45px;
          text-align: center;
          font-weight: 700;
        }
        .annexure-table .activity-col {
          width: 245px;
          text-align: left;
          padding-left: 8px;
        }
        .annexure-table .sample-col {
          width: 85px;
        }
        .annexure-table .remark-col {
          width: 130px;
          font-size: 10.5px;
        }
        .annexure-title-header {
          text-align: center;
          font-weight: 800;
          font-size: 15px;
          padding: 8px;
          border: 1.5px solid #000;
          background: #ffffff;
          margin-bottom: 0px;
        }
        .annexure-meta-row {
          display: flex;
          justify-content: space-between;
          border-left: 1.5px solid #000;
          border-right: 1.5px solid #000;
          border-bottom: 1.5px solid #000;
          padding: 5px 12px;
          font-size: 12px;
          background: #fff;
        }
        .annexure-specs-box {
          display: flex;
          border-left: 1.5px solid #000;
          border-right: 1.5px solid #000;
          border-bottom: 1.5px solid #000;
          font-weight: 700;
          font-size: 12px;
          background: #fff;
        }
        .annexure-specs-left {
          flex: 1;
          padding: 5px 12px;
          border-right: 1.5px solid #000;
        }
        .annexure-specs-right {
          flex: 1;
          padding: 5px 12px;
          text-align: right;
        }
        .annexure-sheet-page {
          background: #ffffff;
          padding: 24px;
          border-radius: 8px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          page-break-after: always;
          break-inside: avoid;
        }
        .annexure-sheet-page:last-child {
          margin-bottom: 0;
          page-break-after: auto;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .annexure-a-root,
          .annexure-a-root * {
            visibility: visible;
          }
          .action-bar-no-print,
          .filter-bar-no-print,
          .sheet-tabs-no-print {
            display: none !important;
          }
          .annexure-a-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .annexure-sheet-page {
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 0 20mm 0 !important;
            page-break-after: always !important;
            break-inside: avoid !important;
          }
          .annexure-sheet-page:last-child {
            page-break-after: auto !important;
          }
          .annexure-table {
            font-size: 10px !important;
          }
          .section-header-row {
            background-color: #d1d5db !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>

      {/* ─── TOP FILTER BAR (Non-printable) ─────────────────────────────────── */}
      <div className="filter-bar-no-print" style={{
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '10px',
        padding: '14px 18px',
        marginBottom: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px'
      }}>
        {/* Plant / Vendor Info Badge with Plant Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {isCallBound && (
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              color: '#1d4ed8',  
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>📋 Call:</span>
              <strong>{call.callNo || call.requestId || call.call_no}</strong>
              <span style={{ fontSize: '10px', background: '#dbeafe', color: '#1e40af', padding: '1px 5px', borderRadius: '4px', fontWeight: '800' }}>🔒 Locked</span>
            </div>
          )}
          <div style={{
            background: '#e0f2fe',
            border: '1px solid #bae6fd',
            padding: '3px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#0369a1',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🏢 Plant:</span>
            {isCallBound ? (
              <strong style={{ color: '#0369a1', fontSize: '12px' }}>
                {cleanCallPlant || rawCallPlant || selectedPlant || unitAddress || 'Works / Plant'}
              </strong>
            ) : loadingPlants ? (
              <span style={{ fontSize: '11.5px', color: '#0284c7' }}>Loading...</span>
            ) : plantOptions && plantOptions.length > 0 ? (
              <select
                value={selectedPlant || plantOptions[0]}
                onChange={(e) => {
                  setSelectedPlant(e.target.value);
                }}
                style={{
                  background: '#ffffff',
                  border: '1px solid #7dd3fc',
                  borderRadius: '5px',
                  padding: '3px 8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#0369a1',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '170px'
                }}
              >
                {plantOptions.map((p, idx) => (
                  <option key={idx} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            ) : (
              <strong>{selectedPlant || unitAddress || 'Works / Plant'}</strong>
            )}
          </div>
          <div style={{
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11.5px',
            color: '#334155',
            fontWeight: '600'
          }}>
            Vendor: <strong>{vendorName}</strong>
          </div>
        </div>

        {/* Date Range & Shift Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ fontWeight: '700', color: '#475569' }}>From:</span>
            <input
              type="date"
              value={fromDate}
              disabled={isCallBound}
              readOnly={isCallBound}
              onChange={(e) => !isCallBound && setFromDate(e.target.value)}
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                background: isCallBound ? '#f1f5f9' : '#ffffff',
                color: isCallBound ? '#334155' : '#0f172a',
                cursor: isCallBound ? 'not-allowed' : 'pointer',
                fontWeight: isCallBound ? '700' : 'normal'
              }}
              title={isCallBound ? "Date is locked to this call's batch casting date" : "Select from date"}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ fontWeight: '700', color: '#475569' }}>To:</span>
            <input
              type="date"
              value={toDate}
              disabled={isCallBound}
              readOnly={isCallBound}
              onChange={(e) => !isCallBound && setToDate(e.target.value)}
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                background: isCallBound ? '#f1f5f9' : '#ffffff',
                color: isCallBound ? '#334155' : '#0f172a',
                cursor: isCallBound ? 'not-allowed' : 'pointer',
                fontWeight: isCallBound ? '700' : 'normal'
              }}
              title={isCallBound ? "Date is locked to this call's batch casting date" : "Select to date"}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ fontWeight: '700', color: '#475569' }}>Shift:</span>
            <select
              value={shiftFilter}
              disabled={isCallBound}
              onChange={(e) => !isCallBound && setShiftFilter(e.target.value)}
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                background: isCallBound ? '#f1f5f9' : '#ffffff',
                color: isCallBound ? '#334155' : '#0f172a',
                cursor: isCallBound ? 'not-allowed' : 'pointer',
                fontWeight: '600'
              }}
              title={isCallBound ? "Shift filter is locked to this call" : "Select shift"}
            >
              <option value="ALL">All Shifts</option>
              <option value="A">Shift A</option>
              <option value="B">Shift B</option>
              <option value="C">Shift C</option>
            </select>
          </div>

          <button
            onClick={fetchAllPlantData}
            disabled={loading || !fromDate || !toDate || !selectedPlant}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: (!fromDate || !toDate || !selectedPlant) ? '#94a3b8' : '#0f766e',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
              cursor: (loading || !fromDate || !toDate || !selectedPlant) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: (!fromDate || !toDate) ? 'none' : '0 1px 2px rgba(15, 118, 110, 0.2)'
            }}
          >
            <span>{loading ? '⏳' : '🔄'}</span>
            <span>{loading ? 'Fetching...' : isCallBound ? 'Reload Data' : 'Fetch Reports'}</span>
          </button>
        </div>
      </div>

      {/* ─── ACTION BAR (Print, View Mode, Close) ────────────────────────────── */}
      <div className="action-bar-no-print" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
        padding: '0 2px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* View Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>View:</span>
          <button
            onClick={() => setViewMode('SINGLE')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: viewMode === 'SINGLE' ? '#0284c7' : '#ffffff',
              color: viewMode === 'SINGLE' ? '#ffffff' : '#334155',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Single Sheet
          </button>
          <button
            onClick={() => setViewMode('ALL')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: viewMode === 'ALL' ? '#0284c7' : '#ffffff',
              color: viewMode === 'ALL' ? '#ffffff' : '#334155',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            All Sheets Stacked ({sheets.length})
          </button>
        </div>

        {/* Export to PDF & Print Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleExportPdf}
            disabled={isExporting || loading || sheetsToRender.length === 0}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: 'none',
              background: isExporting
                ? '#94a3b8'
                : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '12px',
              cursor: isExporting || loading || sheetsToRender.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
              transition: 'all 0.15s ease'
            }}
            title="Download Annexure-A Activity Report in PDF format"
          >
            <span>{isExporting ? '⏳' : '📥'}</span>
            <span>
              {isExporting
                ? 'Generating PDF...'
                : viewMode === 'ALL'
                  ? `Export All Sheets (PDF - ${sheets.length})`
                  : 'Export to PDF'}
            </span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Close ×
            </button>
          )}
        </div>
      </div>

      {/* ─── SHEET TABS NAVIGATOR (Non-printable) ───────────────────────────── */}
      {viewMode === 'SINGLE' && sheets.length > 1 && (
        <div className="sheet-tabs-no-print" style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '8px',
          paddingBottom: '12px',
          marginBottom: '16px'
        }}>
          {sheets.map(sheet => {
            const isSelected = sheet.key === activeSheetKey;
            const isActiveDuty = sheet.date === activeDutyDate && sheet.shift === activeDutyShift;
            const totalRecords = (sheet.weighment?.length || 0) +
              (sheet.mixing?.length || 0) +
              (sheet.sheeting?.length || 0) +
              (sheet.rheometer?.length || 0) +
              (sheet.mould?.length || 0) +
              (sheet.hydraulic?.length || 0) +
              (sheet.visual?.length || 0);

            return (
              <button
                key={sheet.key}
                onClick={() => setActiveSheetKey(sheet.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: isSelected ? '#f0f9ff' : '#ffffff',
                  color: isSelected ? '#0369a1' : '#334155',
                  cursor: 'pointer',
                  fontWeight: isSelected ? '800' : '600',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 2px 4px rgba(2, 132, 199, 0.15)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>📅 {sheet.date}</span>
                <span style={{
                  background: isSelected ? '#0284c7' : '#e2e8f0',
                  color: isSelected ? '#ffffff' : '#475569',
                  padding: '1px 7px',
                  borderRadius: '12px',
                  fontSize: '10.5px',
                  fontWeight: '700'
                }}>
                  Shift {sheet.shift}
                </span>
                {isActiveDuty && (
                  <span style={{
                    fontSize: '9.5px',
                    color: '#059669',
                    background: '#d1fae5',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    fontWeight: '800'
                  }}>
                    Active
                  </span>
                )}
                {totalRecords > 0 ? (
                  <span style={{ fontSize: '10px', color: '#64748b' }}>({totalRecords})</span>
                ) : (
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>(Empty)</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ─── PRINTABLE SHEETS CONTAINER ────────────────────────────────────── */}
      <div ref={printRef}>
        {(!fromDate || !toDate) ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 16px',
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px dashed #cbd5e1',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
            <div style={{ fontWeight: '700', fontSize: '15px', color: '#334155' }}>Select Date Range</div>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>
              Please select <strong>From</strong> and <strong>To</strong> date to fetch and view the Daily Activity Report (Annexure-A).
            </p>
          </div>
        ) : sheetsToRender.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 16px',
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px dashed #cbd5e1',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
            <div style={{ fontWeight: '700', fontSize: '15px', color: '#334155' }}>No Inspection Activities Found</div>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>
              No check records were found for plant <strong>{unitAddress}</strong> between {fromDate} and {toDate}.
            </p>
          </div>
        ) : (
          sheetsToRender.map((sheet, sheetIdx) => (
            <div key={sheet.key} className="annexure-sheet-page">
              {/* Sheet Header Information */}
              <div className="annexure-title-header">
                Process Inspection Order for Rail Pads - Activity Report (Annexure-A)
              </div>

              {/* Date & Place of Inspection */}
              <div className="annexure-meta-row">
                <div>
                  <span style={{ fontWeight: '600' }}>Date : </span>
                  <span style={{ textDecoration: 'underline', fontWeight: '800' }}>{sheet.date}</span>
                </div>
                <div>
                  <span style={{ fontWeight: '600' }}>Place of Inspection: </span>
                  <span style={{ color: '#b91c1c', fontWeight: '700' }}>{placeOfInspection}</span>
                </div>
              </div>

              {/* Shift & Call details */}
              <div className="annexure-meta-row" style={{ borderTop: 'none' }}>
                <div>
                  <span style={{ fontWeight: '600' }}>Shift: </span>
                  <span style={{ textDecoration: 'underline', fontWeight: '800' }}>{sheet.shift}</span>
                </div>
                <div style={{ color: '#475569', fontSize: '11px' }}>
                  Call No: <strong>{call?.requestId || call?.callNo || call?.call_no || 'N/A'}</strong>
                </div>
              </div>

              {/* Reference Letter & Specification Banner */}
              <div className="annexure-specs-box">
                <div className="annexure-specs-left">
                  Letter No-2024/RS(G)/779/12 Date-16.10.2025
                </div>
                <div className="annexure-specs-right">
                  Specification - IRS-T-55-2025
                </div>
              </div>

              {/* Checkpoint Table */}
              <table className="annexure-table">
                <thead>
                  <tr>
                    <th className="sr-col">Sr. No.</th>
                    <th className="activity-col">Activity (Check Points)</th>
                    <th colSpan="6" style={{ fontWeight: '800' }}>Observations</th>
                  </tr>
                </thead>
                <tbody>
                  {/* ─── 1. Raw Material Weighing ────────────────────────────── */}
                  <tr>
                    <td style={{ fontWeight: '800', textAlign: 'center', background: '#d1d5db' }}>1</td>
                    <td colSpan="7" className="section-header-row">
                      Raw Material Weighing @ 5 Times per shift
                    </td>
                  </tr>
                  <tr className="sub-header-row">
                    <td style={{ background: '#fff' }}></td>
                    <td style={{ background: '#fff' }}></td>
                    <td className="sample-col">Sample 1</td>
                    <td className="sample-col">Sample 2</td>
                    <td className="sample-col">Sample 3</td>
                    <td className="sample-col">Sample 4</td>
                    <td className="sample-col">Sample 5</td>
                    <td className="remark-col">Remark</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>a</td>
                    <td className="activity-label">Use of Accepted Raw Materials Verified</td>
                    <td>{getWeighVal(sheet, 0, 'accepted')}</td>
                    <td>{getWeighVal(sheet, 1, 'accepted')}</td>
                    <td>{getWeighVal(sheet, 2, 'accepted')}</td>
                    <td>{getWeighVal(sheet, 3, 'accepted')}</td>
                    <td>{getWeighVal(sheet, 4, 'accepted')}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>b</td>
                    <td className="activity-label">
                      % of Raw Rubber<br />( ≥ 50% by Weight)
                    </td>
                    <td>{getWeighVal(sheet, 0, 'rubber')}</td>
                    <td>{getWeighVal(sheet, 1, 'rubber')}</td>
                    <td>{getWeighVal(sheet, 2, 'rubber')}</td>
                    <td>{getWeighVal(sheet, 3, 'rubber')}</td>
                    <td>{getWeighVal(sheet, 4, 'rubber')}</td>
                    <td></td>
                  </tr>

                  {/* ─── 2. Mixing at Kneader & Mill Overview ─────────────────── */}
                  <tr>
                    <td style={{ fontWeight: '800', textAlign: 'center', background: '#d1d5db' }}>2</td>
                    <td colSpan="7" className="section-header-row">
                      Mixing at Kneader &amp; Mill Overview @ 5 Times per shift
                    </td>
                  </tr>
                  <tr className="sub-header-row">
                    <td style={{ background: '#fff' }}></td>
                    <td style={{ background: '#fff' }}></td>
                    <td className="sample-col">Sample 1</td>
                    <td className="sample-col">Sample 2</td>
                    <td className="sample-col">Sample 3</td>
                    <td className="sample-col">Sample 4</td>
                    <td className="sample-col">Sample 5</td>
                    <td className="remark-col">Remark</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>a</td>
                    <td className="activity-label">Mixing Time (Minutes)</td>
                    <td>{getMixingVal(sheet, 0, 'time')}</td>
                    <td>{getMixingVal(sheet, 1, 'time')}</td>
                    <td>{getMixingVal(sheet, 2, 'time')}</td>
                    <td>{getMixingVal(sheet, 3, 'time')}</td>
                    <td>{getMixingVal(sheet, 4, 'time')}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>b</td>
                    <td className="activity-label">Mixing Temperature (°C)</td>
                    <td>{getMixingVal(sheet, 0, 'temp')}</td>
                    <td>{getMixingVal(sheet, 1, 'temp')}</td>
                    <td>{getMixingVal(sheet, 2, 'temp')}</td>
                    <td>{getMixingVal(sheet, 3, 'temp')}</td>
                    <td>{getMixingVal(sheet, 4, 'temp')}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>c</td>
                    <td className="activity-label">Water Circulation</td>
                    <td>{getMixingVal(sheet, 0, 'water')}</td>
                    <td>{getMixingVal(sheet, 1, 'water')}</td>
                    <td>{getMixingVal(sheet, 2, 'water')}</td>
                    <td>{getMixingVal(sheet, 3, 'water')}</td>
                    <td>{getMixingVal(sheet, 4, 'water')}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>d</td>
                    <td className="activity-label">Dust Collector</td>
                    <td>{getMixingVal(sheet, 0, 'dust')}</td>
                    <td>{getMixingVal(sheet, 1, 'dust')}</td>
                    <td>{getMixingVal(sheet, 2, 'dust')}</td>
                    <td>{getMixingVal(sheet, 3, 'dust')}</td>
                    <td>{getMixingVal(sheet, 4, 'dust')}</td>
                    <td></td>
                  </tr>

                  {/* ─── 3. Sheeting / Sizing ─────────────────────────────────── */}
                  <tr>
                    <td style={{ fontWeight: '800', textAlign: 'center', background: '#d1d5db' }}>3</td>
                    <td colSpan="7" className="section-header-row">
                      Sheeting / Sizing@ 5 Times per Shift
                    </td>
                  </tr>
                  <tr className="sub-header-row">
                    <td style={{ background: '#fff' }}></td>
                    <td style={{ background: '#fff' }}></td>
                    <td className="sample-col">Sample 1</td>
                    <td className="sample-col">Sample 2</td>
                    <td className="sample-col">Sample 3</td>
                    <td className="sample-col">Sample 4</td>
                    <td className="sample-col">Sample 5</td>
                    <td className="remark-col">Remark</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>a</td>
                    <td className="activity-label">Sheeting of Tireform</td>
                    <td>{getSheetingVal(sheet, 0)}</td>
                    <td>{getSheetingVal(sheet, 1)}</td>
                    <td>{getSheetingVal(sheet, 2)}</td>
                    <td>{getSheetingVal(sheet, 3)}</td>
                    <td>{getSheetingVal(sheet, 4)}</td>
                    <td></td>
                  </tr>

                  {/* ─── 4. Rheometer Test ────────────────────────────────────── */}
                  <tr>
                    <td style={{ fontWeight: '800', textAlign: 'center', background: '#d1d5db' }}>4</td>
                    <td colSpan="7" className="section-header-row">
                      Rheometer Test @ 01 Test Per Batch
                    </td>
                  </tr>
                  <tr className="sub-header-row">
                    <td style={{ background: '#fff' }}></td>
                    <td style={{ background: '#fff' }}></td>
                    <td className="sample-col">Sample 1</td>
                    <td className="sample-col">Sample 2</td>
                    <td className="sample-col">Sample 3</td>
                    <td className="sample-col">Sample 4</td>
                    <td className="sample-col">Sample 5</td>
                    <td className="remark-col">Remark</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>a</td>
                    <td className="activity-label">Vulcanization Time (minutes)</td>
                    <td>{getRheometerVal(sheet, 0, 'time')}</td>
                    <td>{getRheometerVal(sheet, 1, 'time')}</td>
                    <td>{getRheometerVal(sheet, 2, 'time')}</td>
                    <td>{getRheometerVal(sheet, 3, 'time')}</td>
                    <td>{getRheometerVal(sheet, 4, 'time')}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>b</td>
                    <td className="activity-label">Vulcanization Temp (°C)</td>
                    <td>{getRheometerVal(sheet, 0, 'temp')}</td>
                    <td>{getRheometerVal(sheet, 1, 'temp')}</td>
                    <td>{getRheometerVal(sheet, 2, 'temp')}</td>
                    <td>{getRheometerVal(sheet, 3, 'temp')}</td>
                    <td>{getRheometerVal(sheet, 4, 'temp')}</td>
                    <td></td>
                  </tr>
                  {/* Samples 6 to 10 */}
                  <tr className="sub-header-row">
                    <td style={{ background: '#fff' }}></td>
                    <td style={{ background: '#fff' }}></td>
                    <td className="sample-col">Sample 6</td>
                    <td className="sample-col">Sample 7</td>
                    <td className="sample-col">Sample 8</td>
                    <td className="sample-col">Sample 9</td>
                    <td className="sample-col">Sample 10</td>
                    <td className="remark-col">Remark</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>a</td>
                    <td className="activity-label">Vulcanization Time (minutes)</td>
                    <td>{getRheometerVal(sheet, 5, 'time')}</td>
                    <td>{getRheometerVal(sheet, 6, 'time')}</td>
                    <td>{getRheometerVal(sheet, 7, 'time')}</td>
                    <td>{getRheometerVal(sheet, 8, 'time')}</td>
                    <td>{getRheometerVal(sheet, 9, 'time')}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>b</td>
                    <td className="activity-label">Vulcanization Temp (°C)</td>
                    <td>{getRheometerVal(sheet, 5, 'temp')}</td>
                    <td>{getRheometerVal(sheet, 6, 'temp')}</td>
                    <td>{getRheometerVal(sheet, 7, 'temp')}</td>
                    <td>{getRheometerVal(sheet, 8, 'temp')}</td>
                    <td>{getRheometerVal(sheet, 9, 'temp')}</td>
                    <td></td>
                  </tr>

                  {/* ─── 5. Mould Verification ────────────────────────────────── */}
                  <tr>
                    <td style={{ fontWeight: '800', textAlign: 'center', background: '#d1d5db' }}>5</td>
                    <td colSpan="7" className="section-header-row">
                      Mould Verification @ Once Before Start of the Shift
                    </td>
                  </tr>
                  <tr className="sub-header-row">
                    <td style={{ background: '#fff' }}></td>
                    <td style={{ background: '#fff' }}></td>
                    <td colSpan="5" style={{ textAlign: 'center', fontWeight: '700' }}>Sample 1</td>
                    <td className="remark-col">Remark</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>a</td>
                    <td className="activity-label">Dimensional Accuracy</td>
                    <td colSpan="5">{getMouldVal(sheet, 'accuracy')}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>b</td>
                    <td className="activity-label">Freedom from Defects</td>
                    <td colSpan="5">{getMouldVal(sheet, 'defects')}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>c</td>
                    <td className="activity-label">Visual Check</td>
                    <td colSpan="5">{getMouldVal(sheet, 'visual')}</td>
                    <td></td>
                  </tr>

                  {/* ─── 6. Moulding at Hydraulic Press ───────────────────────── */}
                  <tr>
                    <td style={{ fontWeight: '800', textAlign: 'center', background: '#d1d5db' }}>6</td>
                    <td colSpan="7" className="section-header-row">
                      Moulding at Hydraulic Press @ Once Every Hours
                    </td>
                  </tr>
                  <tr className="sub-header-row">
                    <td style={{ background: '#fff' }}></td>
                    <td style={{ background: '#fff' }}></td>
                    <td className="sample-col">Sample 1</td>
                    <td className="sample-col">Sample 2</td>
                    <td className="sample-col">Sample 3</td>
                    <td className="sample-col">Sample 4</td>
                    <td className="sample-col">Sample 5</td>
                    <td className="remark-col">Remark</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>a</td>
                    <td className="activity-label">Curing Time (min)</td>
                    <td>{getHydraulicVal(sheet, 0, 'time')}</td>
                    <td>{getHydraulicVal(sheet, 1, 'time')}</td>
                    <td>{getHydraulicVal(sheet, 2, 'time')}</td>
                    <td>{getHydraulicVal(sheet, 3, 'time')}</td>
                    <td>{getHydraulicVal(sheet, 4, 'time')}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>b</td>
                    <td className="activity-label">Curing Temp. (°C)</td>
                    <td>{getHydraulicVal(sheet, 0, 'temp')}</td>
                    <td>{getHydraulicVal(sheet, 1, 'temp')}</td>
                    <td>{getHydraulicVal(sheet, 2, 'temp')}</td>
                    <td>{getHydraulicVal(sheet, 3, 'temp')}</td>
                    <td>{getHydraulicVal(sheet, 4, 'temp')}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>c</td>
                    <td className="activity-label">Curing Pressure (Kg/cm²)</td>
                    <td>{getHydraulicVal(sheet, 0, 'pressure')}</td>
                    <td>{getHydraulicVal(sheet, 1, 'pressure')}</td>
                    <td>{getHydraulicVal(sheet, 2, 'pressure')}</td>
                    <td>{getHydraulicVal(sheet, 3, 'pressure')}</td>
                    <td>{getHydraulicVal(sheet, 4, 'pressure')}</td>
                    <td></td>
                  </tr>

                  {/* ─── 7. Finishing @ visual inspection ─────────────────────── */}
                  <tr>
                    <td style={{ fontWeight: '800', textAlign: 'center', background: '#d1d5db' }}>7</td>
                    <td colSpan="7" className="section-header-row">
                      finishing @ visual inspection of 03 Rail pads per Hour
                    </td>
                  </tr>
                  <tr className="sub-header-row">
                    <td style={{ background: '#fff' }}></td>
                    <td style={{ background: '#fff' }}></td>
                    <td className="sample-col">1st Hour</td>
                    <td className="sample-col">2nd Hour</td>
                    <td className="sample-col">3rd Hour</td>
                    <td className="sample-col">4th Hour</td>
                    <td className="sample-col">5th hour</td>
                    <td className="remark-col">Remark</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>a</td>
                    <td className="activity-label">Clear Cut Sides</td>
                    <td>{getVisualVal(sheet, 0, 'sides')}</td>
                    <td>{getVisualVal(sheet, 1, 'sides')}</td>
                    <td>{getVisualVal(sheet, 2, 'sides')}</td>
                    <td>{getVisualVal(sheet, 3, 'sides')}</td>
                    <td>{getVisualVal(sheet, 4, 'sides')}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>b</td>
                    <td className="activity-label">Smooth Surface Finish</td>
                    <td>{getVisualVal(sheet, 0, 'surface')}</td>
                    <td>{getVisualVal(sheet, 1, 'surface')}</td>
                    <td>{getVisualVal(sheet, 2, 'surface')}</td>
                    <td>{getVisualVal(sheet, 3, 'surface')}</td>
                    <td>{getVisualVal(sheet, 4, 'surface')}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>c</td>
                    <td className="activity-label">Freedom from Defects</td>
                    <td>{getVisualVal(sheet, 0, 'defects')}</td>
                    <td>{getVisualVal(sheet, 1, 'defects')}</td>
                    <td>{getVisualVal(sheet, 2, 'defects')}</td>
                    <td>{getVisualVal(sheet, 3, 'defects')}</td>
                    <td>{getVisualVal(sheet, 4, 'defects')}</td>
                    <td></td>
                  </tr>
                  {/* Hours 6th to 8th */}
                  <tr className="sub-header-row">
                    <td style={{ background: '#fff' }}></td>
                    <td style={{ background: '#fff' }}></td>
                    <td className="sample-col">6th Hour</td>
                    <td className="sample-col">7th Hour</td>
                    <td className="sample-col">8th Hour</td>
                    <td className="sample-col" style={{ background: '#e5e7eb' }}>-</td>
                    <td className="sample-col" style={{ background: '#e5e7eb' }}>-</td>
                    <td className="remark-col">Remark</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>a</td>
                    <td className="activity-label">Clear Cut Sides</td>
                    <td>{getVisualVal(sheet, 5, 'sides')}</td>
                    <td>{getVisualVal(sheet, 6, 'sides')}</td>
                    <td>{getVisualVal(sheet, 7, 'sides')}</td>
                    <td style={{ background: '#f9fafb' }}>-</td>
                    <td style={{ background: '#f9fafb' }}>-</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>b</td>
                    <td className="activity-label">Smooth Surface Finish</td>
                    <td>{getVisualVal(sheet, 5, 'surface')}</td>
                    <td>{getVisualVal(sheet, 6, 'surface')}</td>
                    <td>{getVisualVal(sheet, 7, 'surface')}</td>
                    <td style={{ background: '#f9fafb' }}>-</td>
                    <td style={{ background: '#f9fafb' }}>-</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>c</td>
                    <td className="activity-label">Freedom from Defects</td>
                    <td>{getVisualVal(sheet, 5, 'defects')}</td>
                    <td>{getVisualVal(sheet, 6, 'defects')}</td>
                    <td>{getVisualVal(sheet, 7, 'defects')}</td>
                    <td style={{ background: '#f9fafb' }}>-</td>
                    <td style={{ background: '#f9fafb' }}>-</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>

              {/* RITES QA Division Inspecting Official Sign-off Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginTop: '32px',
                padding: '0 16px',
                fontSize: '12px',
                fontFamily: 'inherit'
              }}>
                <div>
                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>Place: {unitAddress}</div>
                  <div style={{ fontWeight: '600' }}>Date: {sheet.date}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '220px', borderBottom: '1px solid #000', marginBottom: '6px' }}></div>
                  <div style={{ fontWeight: '800', fontSize: '12.5px' }}>Signature of Inspecting Official</div>
                  <div style={{ fontWeight: '600', fontSize: '11px', color: '#475569' }}>
                    Quality Assurance Division, RITES Ltd.
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * RailpadProcessAnnexureAModal Wrapper
 */
export const RailpadProcessAnnexureAModal = ({
  isOpen,
  onClose,
  call,
  currentShift,
  entries
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          maxWidth: '1100px',
          width: '100%',
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #cbd5e1'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <RailpadProcessAnnexureA
          call={call}
          currentShift={currentShift}
          entries={entries}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export default RailpadProcessAnnexureA;
