import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { getBaseUrl, getDefaultHeaders } from '../../services/apiConfig';
import { performTransitionAction } from '../../services/workflowService';
import { fetchCallImages, saveCallImages } from '../../services/imageService';
import { getImages, saveImages } from '../../utils/imageStorage';
import ImageCaptureComponent from '../ImageCaptureComponent';
import Notification from '../Notification';
import AnnexureLoader from '../annexures/AnnexureLoader';
import { NCRGRSP_CATALOG, resolveNcrgrspCatalogKey, normalizeDwg } from './ncrgrspCatalog';
import './ProcessInspection.css';

// SVG Icons for clean, modern, zero-dependency rendering
const ClipboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1677ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
    <path d="M9 14l2 2 4-4"></path>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#52c41a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const RailpadProcessInspectionDashboard = ({ user, call, currentShift, onBack, onUpdateCall, onPauseComplete }) => {
  const [batches, setBatches] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState({});
  const [capturedImages, setCapturedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'info' });
  const [remarks, setRemarks] = useState('');
  const [reasonForRejection, setReasonForRejection] = useState('');
  const [lotRangeFrom, setLotRangeFrom] = useState('');
  const [lotRangeTo, setLotRangeTo] = useState('');
  const [summary, setSummary] = useState(null);
  const [drawingNo, setDrawingNo] = useState('');
  const [expandedDates, setExpandedDates] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [selectedBatchesModalData, setSelectedBatchesModalData] = useState(null);
  const [isSectionCExpanded, setIsSectionCExpanded] = useState(true);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
  const [showNcrgrspAckModal, setShowNcrgrspAckModal] = useState(false);
  const [incompleteNcrDrawings, setIncompleteNcrDrawings] = useState([]);

  const getDraftKey = () => `process_ic_draft_state_v5_${call.requestId || call.callNo}`;

  // Persist draft in localStorage
  useEffect(() => {
    if (isDataLoaded) {
      try {
        const draftState = {
          selectedBatches,
          remarks,
          reasonForRejection,
          lotRangeFrom,
          lotRangeTo,
          expandedDates
        };
        localStorage.setItem(getDraftKey(), JSON.stringify(draftState));
      } catch (e) {
        console.error('Error persisting active draft state', e);
      }
    }
  }, [selectedBatches, remarks, reasonForRejection, lotRangeFrom, lotRangeTo, expandedDates, isDataLoaded]);

  useEffect(() => {
    fetchData();
  }, [call]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers = getDefaultHeaders(user?.token || localStorage.getItem('authToken'));
      const callId = encodeURIComponent(call.requestId || call.callNo);

      // 0. Fetch Summary Data
      const summaryRes = await fetch(`${getBaseUrl()}/rail-inspection-call/summary/${callId}`, { method: 'GET', headers }).then(r => r.json());
      const summaryData = summaryRes?.responseData || {};
      setSummary(summaryData);

      const fetchedDrawingNo = summaryData.drawingNo || '';
      setDrawingNo(fetchedDrawingNo);

      // 1. Fetch Draft Data from server
      const draftReq = await fetch(`${getBaseUrl()}/rail-inspection-call/process/inspect/${callId}`, {
        method: 'GET',
        headers
      });
      const draftRes = await draftReq.json();
      const draft = draftRes?.responseData;

      // 2. Fetch Available Batches
      const railPadType = summaryData.ercType || call.railPadType;
      const poNo = summaryData.poNo || call.poNo;

      const batchesReq = await fetch(
        `${getBaseUrl()}/rail-inspection-call/process/available-batches?poNo=${encodeURIComponent(poNo)}&railPadType=${encodeURIComponent(railPadType)}&callNo=${encodeURIComponent(call.requestId || call.callNo)}`,
        { method: 'GET', headers }
      );
      const batchesRes = await batchesReq.json();

      let allBatches = batchesRes?.responseData?.batches || [];

      // Filter batches by drawing number if specified during call raising
      if (fetchedDrawingNo) {
        const filtered = allBatches.filter(b => b.drawingNo === fetchedDrawingNo);
        if (filtered.length > 0) {
          allBatches = filtered;
        }
      }

      const newSelectedBatches = {};

      if (draft) {
        setRemarks(draft.remarks || '');
        setReasonForRejection(draft.reasonForRejection || '');
        setLotRangeFrom(draft.lotRangeFrom || '');
        setLotRangeTo(draft.lotRangeTo || '');

        if (draft.batches && draft.batches.length > 0) {
          const draftBatches = draft.batches.map(b => ({
            declarationBatchId: b.declarationBatchId,
            batchNo: b.batchNo,
            drawingNo: b.drawingNo,
            reasonForRejection: b.reasonForRejection,
            productionDate: b.productionDate,
            qtyManufactured: b.qtyManufactured,
            availableQty: b.qtyAvailable !== undefined ? b.qtyAvailable : b.qtyManufactured,
            qtyAccepted: b.qtyAccepted,
            qtyRejected: b.qtyRejected,
            qtyRemaining: b.qtyRemaining
          }));

          const combinedBatches = [...allBatches, ...draftBatches];
          const uniqueBatchesMap = new Map();
          combinedBatches.forEach(b => {
            if (!uniqueBatchesMap.has(b.declarationBatchId)) {
              uniqueBatchesMap.set(b.declarationBatchId, b);
            }
          });
          allBatches = Array.from(uniqueBatchesMap.values());

          // Pre-select drafted batches
          draft.batches.forEach(b => {
            const avail = b.qtyAvailable !== undefined ? b.qtyAvailable : b.qtyManufactured;
            const rej = b.qtyRejected || 0;
            const netAcc = Math.max(0, avail - rej);
            const acc = (b.qtyAccepted !== undefined && b.qtyAccepted !== null) ? b.qtyAccepted : netAcc;
            const finalAcc = (rej > 0 && acc > netAcc) ? netAcc : acc;
            newSelectedBatches[b.declarationBatchId] = {
              declarationBatchId: b.declarationBatchId,
              batchNo: b.batchNo,
              drawingNo: b.drawingNo,
              qtyManufactured: b.qtyManufactured,
              availableQty: avail,
              acceptedQty: finalAcc,
              qtyRejected: rej,
              qtyRemaining: b.qtyRemaining !== undefined ? b.qtyRemaining : Math.max(0, avail - finalAcc - rej),
              productionDate: b.productionDate
            };
          });
        }
      }

      // 3. Check for any active user selections in local storage to preserve across refresh
      try {
        const localDraftStr = localStorage.getItem(getDraftKey());
        if (localDraftStr) {
          const savedLocalDraft = JSON.parse(localDraftStr);
          if (savedLocalDraft) {
            if (savedLocalDraft.remarks !== undefined) setRemarks(savedLocalDraft.remarks || '');
            if (savedLocalDraft.reasonForRejection !== undefined) setReasonForRejection(savedLocalDraft.reasonForRejection || '');
            if (savedLocalDraft.lotRangeFrom !== undefined) setLotRangeFrom(savedLocalDraft.lotRangeFrom || '');
            if (savedLocalDraft.lotRangeTo !== undefined) setLotRangeTo(savedLocalDraft.lotRangeTo || '');
            if (savedLocalDraft.expandedDates && savedLocalDraft.expandedDates.length > 0) {
              setExpandedDates(savedLocalDraft.expandedDates);
            }

            if (savedLocalDraft.selectedBatches && typeof savedLocalDraft.selectedBatches === 'object') {
              Object.keys(savedLocalDraft.selectedBatches).forEach(batchId => {
                const foundBatch = allBatches.find(b => b.declarationBatchId.toString() === batchId.toString());
                if (foundBatch) {
                  const saved = savedLocalDraft.selectedBatches[batchId] || {};
                  const avail = foundBatch.availableQty !== undefined ? foundBatch.availableQty : foundBatch.qtyManufactured;
                  const acc = (saved.acceptedQty !== undefined && saved.acceptedQty !== null && saved.acceptedQty !== '')
                    ? saved.acceptedQty
                    : avail;
                  newSelectedBatches[batchId] = {
                    ...saved,
                    availableQty: avail,
                    acceptedQty: acc,
                    qtyRemaining: Math.max(0, avail - (typeof acc === 'number' ? acc : (parseInt(acc, 10) || 0)))
                  };
                }
              });
            }
          }
        }
      } catch (e) {
        console.error('Error restoring local draft state', e);
      }

      // 4. Fetch inspection images
      try {
        const rawCallNo = call.requestId || call.callNo;
        const serverImages = await fetchCallImages(rawCallNo, 'RAILPAD_PROCESS');
        if (serverImages && serverImages.length > 0) {
          setCapturedImages(serverImages);
        } else {
          const cachedImages = await getImages(getDraftKey() + '_images');
          if (cachedImages && cachedImages.length > 0) {
            setCapturedImages(cachedImages);
          }
        }
      } catch (imgErr) {
        console.warn('Error fetching process inspection images:', imgErr);
      }

      setBatches(allBatches);
      setSelectedBatches(newSelectedBatches);
      setIsDataLoaded(true);

    } catch (error) {
      console.error(error);
      showNotification('Failed to fetch data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: 'info' }), 5000);
  };

  // Toggle single batch selection
  const handleBatchToggle = (batch) => {
    setSelectedBatches(prev => {
      const next = { ...prev };
      if (next[batch.declarationBatchId]) {
        delete next[batch.declarationBatchId];
      } else {
        const avail = batch.availableQty !== undefined ? batch.availableQty : batch.qtyManufactured;
        const rej = batch.verificationRejectedQty || 0;
        const defaultAccepted = Math.max(0, avail - rej);
        next[batch.declarationBatchId] = {
          declarationBatchId: batch.declarationBatchId,
          batchNo: batch.batchNo,
          drawingNo: batch.drawingNo,
          qtyManufactured: batch.qtyManufactured,
          availableQty: avail,
          acceptedQty: defaultAccepted,
          qtyRejected: rej,
          qtyRemaining: Math.max(0, avail - defaultAccepted - rej),
          productionDate: batch.productionDate,
          rejections: batch.rejections || []
        };
      }
      return next;
    });
  };

  // Toggle all batches under a specific date
  const handleDateGroupToggle = (dateBatches) => {
    const allSelected = dateBatches.every(b => !!selectedBatches[b.declarationBatchId]);

    setSelectedBatches(prev => {
      const next = { ...prev };
      if (allSelected) {
        dateBatches.forEach(b => {
          delete next[b.declarationBatchId];
        });
      } else {
        dateBatches.forEach(b => {
          if (!next[b.declarationBatchId]) {
            const avail = b.availableQty !== undefined ? b.availableQty : b.qtyManufactured;
            const rej = b.verificationRejectedQty || 0;
            const defaultAccepted = Math.max(0, avail - rej);
            next[b.declarationBatchId] = {
              declarationBatchId: b.declarationBatchId,
              batchNo: b.batchNo,
              drawingNo: b.drawingNo,
              qtyManufactured: b.qtyManufactured,
              availableQty: avail,
              acceptedQty: defaultAccepted,
              qtyRejected: rej,
              qtyRemaining: Math.max(0, avail - defaultAccepted - rej),
              productionDate: b.productionDate,
              rejections: b.rejections || []
            };
          }
        });
      }
      return next;
    });
  };

  // Handle accepted quantity edit for a batch
  const handleAcceptedQtyChange = (batchId, val) => {
    setSelectedBatches(prev => {
      if (!prev[batchId]) return prev;
      const avail = prev[batchId].availableQty !== undefined ? prev[batchId].availableQty : prev[batchId].qtyManufactured;
      const rej = prev[batchId].qtyRejected || 0;
      const maxAllowed = Math.max(0, avail - rej);
      const parsed = val === '' ? '' : parseInt(val, 10);
      const num = typeof parsed === 'number' && !isNaN(parsed) ? parsed : 0;
      const rem = typeof parsed === 'number' ? Math.max(0, avail - num - rej) : Math.max(0, avail - rej);
      return {
        ...prev,
        [batchId]: {
          ...prev[batchId],
          acceptedQty: parsed,
          qtyRemaining: rem
        }
      };
    });
  };

  // Calculate totals and check for invalid accepted quantities
  const totals = useMemo(() => {
    let totalManufactured = 0;
    let totalRejected = 0;
    let totalAccepted = 0;
    let hasInvalidQty = false;

    Object.values(selectedBatches).forEach(b => {
      const avail = b.availableQty !== undefined ? b.availableQty : b.qtyManufactured;
      const rej = b.qtyRejected || 0;
      const maxAllowed = Math.max(0, avail - rej);
      totalManufactured += (b.qtyManufactured || avail);
      totalRejected += rej;

      const rawAcc = (b.acceptedQty !== undefined && b.acceptedQty !== null) ? b.acceptedQty : maxAllowed;
      const acc = typeof rawAcc === 'number' ? rawAcc : (rawAcc === '' ? NaN : parseInt(rawAcc, 10));
      if (rawAcc === '' || isNaN(acc) || acc < 0 || acc > maxAllowed) {
        hasInvalidQty = true;
      }
      totalAccepted += (!isNaN(acc) && acc > 0 ? acc : 0);
    });

    return { totalManufactured, totalRejected, totalAccepted, hasInvalidQty };
  }, [selectedBatches]);

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear().toString().slice(2)}`;
  };

  // Group batches date-wise
  const groupedBatches = useMemo(() => {
    return batches.reduce((acc, batch) => {
      const date = formatDate(batch.productionDate);
      if (!acc[date]) acc[date] = [];
      acc[date].push(batch);
      return acc;
    }, {});
  }, [batches]);

  const areAllBatchesSelected = batches.length > 0 && batches.every(b => !!selectedBatches[b.declarationBatchId]);
  const isSomeBatchesSelected = batches.some(b => !!selectedBatches[b.declarationBatchId]) && !areAllBatchesSelected;

  const handleSelectAllToggle = () => {
    if (areAllBatchesSelected) {
      setSelectedBatches({});
    } else {
      const next = {};
      batches.forEach(b => {
        const avail = b.availableQty !== undefined ? b.availableQty : b.qtyManufactured;
        const rej = b.verificationRejectedQty || 0;
        const defaultAccepted = Math.max(0, avail - rej);
        next[b.declarationBatchId] = {
          declarationBatchId: b.declarationBatchId,
          batchNo: b.batchNo,
          drawingNo: b.drawingNo,
          qtyManufactured: b.qtyManufactured,
          availableQty: avail,
          acceptedQty: defaultAccepted,
          qtyRejected: rej,
          qtyRemaining: Math.max(0, avail - defaultAccepted - rej),
          productionDate: b.productionDate,
          rejections: b.rejections || []
        };
      });
      setSelectedBatches(next);
    }
  };

  useEffect(() => {
    if (Object.keys(groupedBatches).length > 0 && expandedDates.length === 0) {
      setExpandedDates([Object.keys(groupedBatches)[0]]);
    }
  }, [groupedBatches]);

  const toggleDateGroup = (dateStr) => {
    setExpandedDates(prev =>
      prev.includes(dateStr)
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  // ── NCRGRSP Catalog & Section C Master Table Calculation ──
  const currentRailPadType = summary?.ercType || call?.railPadType || '';
  const isNcrgrsp = /NCR\s*GRSP/i.test(currentRailPadType);
  const displayDrawingNo = drawingNo || call?.drawingNo || summary?.drawingNo || '';

  const candidateDrawings = useMemo(() => batches.map(b => b.drawingNo).filter(Boolean), [batches]);
  const ncrgrspCatalogKey = useMemo(() => {
    return resolveNcrgrspCatalogKey(displayDrawingNo || currentRailPadType, candidateDrawings);
  }, [displayDrawingNo, currentRailPadType, candidateDrawings]);

  const ncrCatalogItems = useMemo(() => {
    if (!isNcrgrsp || !ncrgrspCatalogKey) return [];
    return NCRGRSP_CATALOG[ncrgrspCatalogKey] || [];
  }, [isNcrgrsp, ncrgrspCatalogKey]);

  const offeredSets = useMemo(() => {
    return parseInt(summary?.totalOfferedQty || call?.qtyDesiredForFinal || call?.callQty || call?.totalQty || 0, 10) || 0;
  }, [summary, call]);

  // Section C Drawing Requirement Summary Data
  const drawingSummaryData = useMemo(() => {
    if (!isNcrgrsp || ncrCatalogItems.length === 0) return [];

    // Map total inventory per drawing across all batches
    const inventoryMap = {};
    batches.forEach(b => {
      const dwg = b.drawingNo || '';
      const avail = b.availableQty !== undefined ? b.availableQty : b.qtyManufactured;
      const norm = normalizeDwg(dwg);
      inventoryMap[norm] = (inventoryMap[norm] || 0) + (avail || 0);
    });

    // Map offered (accepted) per drawing from selectedBatches
    const offeredMap = {};
    Object.values(selectedBatches).forEach(b => {
      const dwg = b.drawingNo || '';
      const acc = typeof b.acceptedQty === 'number' ? b.acceptedQty : parseInt(b.acceptedQty, 10) || 0;
      const norm = normalizeDwg(dwg);
      offeredMap[norm] = (offeredMap[norm] || 0) + (acc > 0 ? acc : 0);
    });

    return ncrCatalogItems.map((item, idx) => {
      const normTarget = normalizeDwg(item.drawingNo);
      const reqQty = (item.qtyPerSet || 1) * offeredSets;
      const offQty = offeredMap[normTarget] || 0;
      const availInv = inventoryMap[normTarget] || 0;
      const isComplete = reqQty > 0 && offQty === reqQty;
      const isExceeded = reqQty > 0 && offQty > reqQty;
      const progressPercent = reqQty > 0 ? Math.min(100, Math.round((offQty / reqQty) * 100)) : 0;

      const matchingBatches = Object.values(selectedBatches).filter(
        b => normalizeDwg(b.drawingNo) === normTarget
      ).map(b => {
        const avail = b.availableQty !== undefined ? b.availableQty : b.qtyManufactured;
        const acc = typeof b.acceptedQty === 'number' ? b.acceptedQty : (parseInt(b.acceptedQty, 10) || avail);
        return {
          ...b,
          acceptedQty: acc,
          availableQty: avail,
          qtyRejected: b.qtyRejected !== undefined ? b.qtyRejected : (b.verificationRejectedQty || 0),
          remainingQty: Math.max(0, avail - acc)
        };
      });

      return {
        sl: idx + 1,
        drawingNo: item.drawingNo,
        description: item.description,
        qtyPerSet: item.qtyPerSet || 1,
        requiredQty: reqQty,
        offeredQty: offQty,
        availableInventory: availInv,
        isComplete,
        isExceeded,
        progressPercent,
        selectedBatchesList: matchingBatches
      };
    });
  }, [isNcrgrsp, ncrCatalogItems, offeredSets, batches, selectedBatches]);

  const totalRequiredQty = useMemo(() => {
    return drawingSummaryData.reduce((acc, row) => acc + row.requiredQty, 0);
  }, [drawingSummaryData]);

  const totalOfferedDrawingQty = useMemo(() => {
    return drawingSummaryData.reduce((acc, row) => acc + row.offeredQty, 0);
  }, [drawingSummaryData]);

  // Standard (Non-NCRGRSP) Drawing Summary Data
  const standardDrawingSummaryData = useMemo(() => {
    if (isNcrgrsp) return [];
    const map = {};
    batches.forEach(b => {
      const dwg = b.drawingNo || displayDrawingNo || 'Standard';
      if (!map[dwg]) {
        map[dwg] = { drawingNo: dwg, selectedCount: 0, totalAvailable: 0, acceptedQty: 0, rejectedQty: 0, remainingQty: 0, selectedBatchesList: [] };
      }
      const avail = b.availableQty !== undefined ? b.availableQty : b.qtyManufactured;
      map[dwg].totalAvailable += avail;
    });

    Object.values(selectedBatches).forEach(b => {
      const dwg = b.drawingNo || displayDrawingNo || 'Standard';
      if (!map[dwg]) {
        map[dwg] = { drawingNo: dwg, selectedCount: 0, totalAvailable: 0, acceptedQty: 0, rejectedQty: 0, remainingQty: 0, selectedBatchesList: [] };
      }
      map[dwg].selectedCount += 1;
      const acc = typeof b.acceptedQty === 'number' ? b.acceptedQty : parseInt(b.acceptedQty, 10) || 0;
      map[dwg].acceptedQty += (acc > 0 ? acc : 0);
      map[dwg].rejectedQty += (b.qtyRejected || 0);
      const avail = b.availableQty !== undefined ? b.availableQty : b.qtyManufactured;
      map[dwg].remainingQty += Math.max(0, avail - acc);
      map[dwg].selectedBatchesList.push({
        ...b,
        acceptedQty: acc,
        availableQty: avail,
        qtyRejected: b.qtyRejected !== undefined ? b.qtyRejected : (b.verificationRejectedQty || 0),
        remainingQty: Math.max(0, avail - acc)
      });
    });

    return Object.values(map);
  }, [isNcrgrsp, batches, selectedBatches, displayDrawingNo]);

  // Save / Finish Execution
  const handleSaveOrFinish = async (actionType) => {
    const isFinish = actionType === 'FINISH';

    if (Object.keys(selectedBatches).length === 0) {
      showNotification('Please select at least one batch to inspect.', 'warning');
      return;
    }

    if (totals.hasInvalidQty) {
      showNotification('Please enter a valid accepted quantity (greater than 0 and not exceeding available) for all selected batches.', 'error');
      return;
    }

    if (isFinish) {
      if (!lotRangeFrom || !lotRangeTo) {
        showNotification('Lot Range (From and To) is mandatory to proceed.', 'error');
        return;
      }
      if (!remarks || remarks.trim() === '') {
        showNotification('Remarks are mandatory to proceed.', 'error');
        return;
      }

      if (!capturedImages || capturedImages.length < 5) {
        showNotification(`At least 5 inspection images are required to finish inspection (Currently: ${capturedImages?.length || 0})`, 'error');
        return;
      }

      // Check NCRGRSP Allocation Status < 100%
      if (isNcrgrsp && drawingSummaryData && drawingSummaryData.length > 0) {
        const incompleteDrawings = drawingSummaryData.filter(
          row => row.requiredQty > 0 && (row.progressPercent < 100 || row.offeredQty < row.requiredQty)
        );

        if (incompleteDrawings.length > 0) {
          setIncompleteNcrDrawings(incompleteDrawings);
          setPendingAction(actionType);
          setShowNcrgrspAckModal(true);
          return;
        }
      }

      setPendingAction(actionType);
      setShowConfirmModal(true);
      return;
    }

    await executeSaveOrFinish(actionType);
  };

  const executeSaveOrFinish = async (actionType) => {
    const isFinish = actionType === 'FINISH';
    setIsSubmitting(true);
    try {
      // Compile reason for rejection from selected batches
      let compiledReason = reasonForRejection;
      if (!compiledReason) {
        const rejectedBatchesList = batches.filter(
          (b) => selectedBatches[b.declarationBatchId] && selectedBatches[b.declarationBatchId].qtyRejected > 0
        );

        const allRejectionDrawings = new Set();
        rejectedBatchesList.forEach(batch => {
          if (batch.rejections && batch.rejections.length > 0) {
            batch.rejections.forEach(rej => {
              const dwg = rej.drawingNo || batch.drawingNo;
              if (dwg) allRejectionDrawings.add(dwg.trim().toUpperCase());
            });
          } else if (batch.drawingNo) {
            allRejectionDrawings.add(batch.drawingNo.trim().toUpperCase());
          }
        });
        const hasMultipleDrawings = allRejectionDrawings.size > 1;

        const reasonItems = [];
        rejectedBatchesList.forEach(batch => {
          const selectedBatchInfo = selectedBatches[batch.declarationBatchId];
          const totalBatchRejected = selectedBatchInfo ? selectedBatchInfo.qtyRejected : 0;

          if (batch.rejections && batch.rejections.length > 0) {
            const drawingGroups = {};
            batch.rejections.forEach(rej => {
              const dwg = rej.drawingNo || batch.drawingNo || 'General';
              if (!drawingGroups[dwg]) drawingGroups[dwg] = [];
              const qtyStr = rej.rejectedQty != null ? ` (${rej.rejectedQty} Nos)` : '';
              drawingGroups[dwg].push(`${rej.reason || 'Rejected'}${qtyStr}`);
            });

            const dwgParts = Object.keys(drawingGroups).map(dwg => {
              const reasonsStr = drawingGroups[dwg].join(', ');
              return (hasMultipleDrawings && dwg !== 'General') ? `Drawing ${dwg}: [${reasonsStr}]` : `[${reasonsStr}]`;
            });

            reasonItems.push(`Batch ${batch.batchNo}: ${dwgParts.join('; ')}`);
          } else if (batch.verificationRejectedReason) {
            const dwgStr = hasMultipleDrawings && batch.drawingNo ? ` (Drawing ${batch.drawingNo})` : '';
            reasonItems.push(`Batch ${batch.batchNo}${dwgStr}: ${totalBatchRejected} Nos - [${batch.verificationRejectedReason}]`);
          } else {
            const dwgStr = hasMultipleDrawings && batch.drawingNo ? ` (Drawing ${batch.drawingNo})` : '';
            reasonItems.push(`Batch ${batch.batchNo}${dwgStr}: ${totalBatchRejected} Nos rejected`);
          }
        });
        compiledReason = reasonItems.join(' | ');
      }

      const calculatedCallQty = summary?.totalOfferedQty || call.qtyDesiredForFinal || call.callQty || call.totalQty || 0;

      const payload = {
        callNo: call.requestId || call.callNo,
        callQty: calculatedCallQty,
        totalManufacturedQty: totals.totalManufactured,
        totalRejectedQty: totals.totalRejected,
        totalAcceptedQty: totals.totalAccepted,
        reasonForRejection: compiledReason,
        lotRangeFrom: lotRangeFrom,
        lotRangeTo: lotRangeTo,
        remarks: remarks,
        inspectionStartDate: call.inspectionStartDate || new Date().toISOString().split('T')[0],
        inspectionEndDate: new Date().toISOString().split('T')[0],
        shift: currentShift?.shift,
        inspectionDate: currentShift?.date,
        createdBy: user?.userId || 1,
        updatedBy: user?.userId || 1,
        isFinish: isFinish,
        batches: Object.keys(selectedBatches).map(id => {
          const batchData = selectedBatches[id];
          const originalBatch = batches.find(b => b.declarationBatchId.toString() === id.toString()) || {};
          const avail = batchData.availableQty !== undefined ? batchData.availableQty : (originalBatch.availableQty || batchData.qtyManufactured);
          const rej = batchData.qtyRejected || 0;
          const maxAllowed = Math.max(0, avail - rej);
          const rawAcc = typeof batchData.acceptedQty === 'number' ? batchData.acceptedQty : parseInt(batchData.acceptedQty, 10);
          const acc = (!isNaN(rawAcc) && rawAcc >= 0) ? Math.min(rawAcc, maxAllowed) : maxAllowed;
          const rem = Math.max(0, avail - acc - rej);

          let batchRejectionReason = null;
          if (batchData.qtyRejected > 0) {
            if (originalBatch.rejections && originalBatch.rejections.length > 0) {
              batchRejectionReason = originalBatch.rejections
                .map(r => `${r.reason || 'Rejected'}${r.rejectedQty != null ? ` (${r.rejectedQty} Nos)` : ''}`)
                .join(', ');
            } else if (originalBatch.verificationRejectedReason) {
              batchRejectionReason = originalBatch.verificationRejectedReason;
            }
          }

          return {
            declarationBatchId: id,
            batchNo: originalBatch.batchNo || batchData.batchNo,
            drawingNo: originalBatch.drawingNo || batchData.drawingNo || displayDrawingNo || '',
            reasonForRejection: batchRejectionReason,
            productionDate: originalBatch.productionDate || batchData.productionDate,
            qtyManufactured: originalBatch.qtyManufactured || batchData.qtyManufactured,
            qtyAvailable: avail,
            qtyAccepted: acc,
            qtyRejected: batchData.qtyRejected || 0,
            qtyRemaining: rem
          };
        })
      };

      const headers = getDefaultHeaders(user?.token || localStorage.getItem('authToken'));
      const req = await fetch(`${getBaseUrl()}/rail-inspection-call/process/inspect`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!req.ok) throw new Error('Failed to save inspection data');

      // Save captured images
      if (capturedImages && capturedImages.length > 0) {
        try {
          await saveCallImages(call.requestId || call.callNo, {
            typeOfCall: 'RAILPAD_PROCESS',
            capturedImages,
            shift: currentShift?.shift || 'A',
            dateOfInspection: currentShift?.date,
            userId: String(user?.userId || 1)
          });
          await saveImages(getDraftKey() + '_images', capturedImages);
        } catch (imgErr) {
          console.error('Error saving process inspection images:', imgErr);
        }
      }

      if (actionType === 'FINISH') {
        const transitionPayload = {
          workflowTransitionId: call.workflowTransitionId || call.id,
          requestId: call.requestId || call.callNo,
          action: 'FINISH',
          fromState: 'PENDING_INSPECTION',
          toState: 'INSPECTION_DONE',
          remarks: remarks || 'Process Inspection completed',
          actionBy: user?.userId || 1,
          role: 'Rail Main IE',
          userName: user?.userName || 'Railpad IE'
        };
        await performTransitionAction(transitionPayload);
      } else if (actionType === 'PAUSE') {
        const transitionPayload = {
          workflowTransitionId: call.workflowTransitionId || call.id,
          requestId: call.requestId || call.callNo,
          action: 'PAUSE',
          fromState: 'PENDING_INSPECTION',
          toState: 'PAUSE',
          remarks: 'Inspection progress paused',
          actionBy: user?.userId || 1,
          role: 'Rail Main IE',
          userName: user?.userName || 'Railpad IE'
        };
        await performTransitionAction(transitionPayload);
      }

      if (actionType === 'PAUSE' || actionType === 'FINISH') {
        try {
          localStorage.removeItem(getDraftKey());
        } catch (e) {}
      }

      if (isFinish) {
        if (onUpdateCall) onUpdateCall({ status: 'FINISHED' });
        showNotification('Inspection Finished successfully!', 'success');
        setTimeout(() => onPauseComplete(), 1500);
      } else if (actionType === 'PAUSE') {
        showNotification('Inspection Paused successfully!', 'success');
        setTimeout(() => onPauseComplete(), 1500);
      } else if (actionType === 'DRAFT') {
        showNotification('Draft saved successfully.', 'success');
        setIsSubmitting(false);
      }
    } catch (error) {
      showNotification(error.message || 'Failed to save inspection', 'error');
      setIsSubmitting(false);
    }
  };

  if (!call) {
    return (
      <div className="process-ic-dashboard fade-in" style={{ padding: '20px', textAlign: 'center' }}>
        <h3>No Call Selected</h3>
        <p>Please return to the dashboard and select a call to inspect.</p>
        <button onClick={onPauseComplete} className="modern-btn primary" style={{ marginTop: '10px' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnnexureLoader
          title="Fetching Process Call Details"
          subtitle="Gathering latest production declarations and batches from Sarthi workflow..."
        />
      </div>
    );
  }

  const displayPoNo = summary?.poNo || call.poNo || 'N/A';
  const displayQty = summary?.totalOfferedQty || call.qtyDesiredForFinal || call.callQty || 0;
  const displayRailPadType = summary?.ercType || call.railPadType || 'N/A';
  const displayPoSr = summary?.rlyPoNoSerial || call.poSr || 'N/A';

  const isFinishDisabled = isSubmitting || Object.keys(selectedBatches).length === 0 || totals.hasInvalidQty;

  return (
    <div className="process-ic-dashboard fade-in">
      {notification.message && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: 'info' })} />
      )}

      {/* Dashboard Header */}
      <header className="dashboard-header" style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', borderRadius: '12px 12px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#0f3a5e', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '10px', fontSize: '20px', transition: 'all 0.2s', marginTop: '2px' }}
              title="Back to Dashboard"
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              &larr;
            </button>
          )}
          <div>
            <h2 className="dashboard-title" style={{ margin: '0 0 6px 0', fontSize: '26px', color: '#0f3a5e', fontWeight: '800' }}>Process Inspection Dashboard</h2>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Select batches and specify accepted quantities for this Process IC</div>
          </div>
        </div>

        {currentShift && (
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px 32px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Shift</span>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f3a5e' }}>{currentShift.shift}</div>
            </div>
            <div style={{ width: '1px', height: '36px', backgroundColor: '#cbd5e1' }}></div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Date</span>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f3a5e' }}>{currentShift.date}</div>
            </div>
          </div>
        )}
      </header>

      <div className="dashboard-content">
        {/* Left Panel: Info, Master Table & Batch Selection */}
        <div className="left-panel">
          {/* Call Information Card */}
          <div className="info-card">
            <h3>Information Displayed to Main IE</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Call No</label>
                <div className="value">{call.requestId || call.callNo}</div>
              </div>
              <div className="info-item">
                <label>Quantity Offered Now</label>
                <div className="value">
                  <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f3a5e' }}>
                    {displayQty} {isNcrgrsp ? 'Sets' : (summary?.unit || 'Nos.')}
                  </span>
                </div>
              </div>
              <div className="info-item">
                <label>RailPad Type</label>
                <div className="value">{displayRailPadType}</div>
              </div>
              {displayDrawingNo && (
                <div className="info-item">
                  <label>Drawing No / Type</label>
                  <div className="value" style={{ fontWeight: '700', color: '#0284c7' }}>{displayDrawingNo}</div>
                </div>
              )}
              <div className="info-item">
                <label>PO Serial No</label>
                <div className="value">{displayPoSr}</div>
              </div>
            </div>
          </div>

          {/* SECTION C – DRAWING REQUIREMENT SUMMARY (for NCRGRSP) */}
          {isNcrgrsp && (
            <div className="ncr-summary-card">
              <div
                className="ncr-summary-header"
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setIsSectionCExpanded(prev => !prev)}
                title="Click to collapse / expand Section C"
              >
                <div className="ncr-summary-title">
                  <ClipboardIcon />
                  <span> Drawing Requirement Summary ({ncrgrspCatalogKey})</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="ncr-badge-req">
                    Total Required Qty: {totalRequiredQty.toLocaleString()}
                  </span>
                  <span className="ncr-badge-offered">
                    Total Qty to be Offered: {totalOfferedDrawingQty.toLocaleString()}
                  </span>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    backgroundColor: '#e2e8f0',
                    color: '#0f3a5e',
                    fontSize: '13px',
                    fontWeight: '800',
                    transition: 'transform 0.3s ease',
                    transform: isSectionCExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </div>
                </div>
              </div>

              {isSectionCExpanded && (
                <div className="ncr-table-container">
                  <table className="ncr-table">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'center', width: '50px' }}>Sl.</th>
                        <th>Drawing No.</th>
                        <th style={{ textAlign: 'center' }}>Qty/Set</th>
                        <th style={{ textAlign: 'center' }}>Required Qty</th>
                        <th style={{ textAlign: 'center', color: '#0958d9' }}>Qty to be Offered</th>
                        <th style={{ textAlign: 'center' }}>Available Inventory</th>
                        <th style={{ textAlign: 'center', minWidth: '150px' }}>Allocation Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drawingSummaryData.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                            No drawings configured for this NCRGRSP turnout type.
                          </td>
                        </tr>
                      ) : (
                        drawingSummaryData.map((row) => (
                          <tr key={row.drawingNo}>
                            <td style={{ textAlign: 'center', fontWeight: '600', color: '#64748b' }}>{row.sl}</td>
                            <td style={{ fontWeight: '700', color: '#1677ff' }}>{row.drawingNo}</td>
                            <td style={{ textAlign: 'center' }}>{row.qtyPerSet}</td>
                            <td style={{ textAlign: 'center', fontWeight: '800' }}>{row.requiredQty.toLocaleString()}</td>
                            <td style={{ textAlign: 'center', fontWeight: '800', color: '#0958d9' }}>
                              {row.offeredQty > 0 ? (
                                <button
                                  type="button"
                                  className="selected-batches-click-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBatchesModalData({
                                      title: `Selected Batches: ${row.drawingNo}`,
                                      drawingNo: row.drawingNo,
                                      batches: row.selectedBatchesList
                                    });
                                  }}
                                  title="Click to view details of selected batches"
                                >
                                  <span>{row.offeredQty.toLocaleString()}</span>
                                  <span className="view-tag">({row.selectedBatchesList?.length || 0} batches) 👁️</span>
                                </button>
                              ) : (
                                <span>0</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center', color: '#64748b', fontWeight: '600' }}>
                              {row.availableInventory.toLocaleString()}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {row.isComplete ? (
                                <span className="ncr-status-complete">
                                  <CheckCircleIcon /> Complete
                                </span>
                              ) : row.isExceeded ? (
                                <span className="ncr-status-exceeded">
                                  Exceeded by {(row.offeredQty - row.requiredQty).toLocaleString()}
                                </span>
                              ) : (
                                <div className="ncr-progress-container">
                                  <div className="ncr-progress-bar-bg">
                                    <div className="ncr-progress-bar-fill" style={{ width: `${row.progressPercent}%` }} />
                                  </div>
                                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#0958d9', minWidth: '32px' }}>
                                    {row.progressPercent}%
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Standard Drawing Summary (Non-NCRGRSP) */}
          {!isNcrgrsp && standardDrawingSummaryData.length > 0 && (
            <div className="ncr-summary-card">
              <div
                className="ncr-summary-header"
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setIsSummaryExpanded(prev => !prev)}
                title="Click to collapse / expand summary"
              >
                <div className="ncr-summary-title">
                  <ClipboardIcon />
                  <span>DRAWING-WISE ACCEPTED SUMMARY</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  backgroundColor: '#e2e8f0',
                  color: '#0f3a5e',
                  fontSize: '13px',
                  fontWeight: '800',
                  transition: 'transform 0.3s ease',
                  transform: isSummaryExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>
                  ▼
                </div>
              </div>

              {isSummaryExpanded && (
                <div className="ncr-table-container">
                  <table className="ncr-table">
                    <thead>
                      <tr>
                        <th>Drawing No.</th>
                        <th style={{ textAlign: 'center' }}>Selected Batches</th>
                        <th style={{ textAlign: 'center' }}>Total Available</th>
                        <th style={{ textAlign: 'center', color: '#0958d9' }}>Qty Accepted</th>
                        <th style={{ textAlign: 'center', color: '#dc2626' }}>Qty Rejected</th>
                        <th style={{ textAlign: 'center' }}>Balance Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standardDrawingSummaryData.map((row) => (
                        <tr key={row.drawingNo}>
                          <td style={{ fontWeight: '700', color: '#1677ff' }}>{row.drawingNo}</td>
                          <td style={{ textAlign: 'center' }}>
                            {row.selectedCount > 0 ? (
                              <button
                                type="button"
                                className="selected-batches-click-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBatchesModalData({
                                    title: `Selected Batches: ${row.drawingNo}`,
                                    drawingNo: row.drawingNo,
                                    batches: row.selectedBatchesList
                                  });
                                }}
                                title="Click to view details of selected batches"
                              >
                                <span className="count-num">{row.selectedCount} {row.selectedCount === 1 ? 'Batch' : 'Batches'}</span>
                                <span className="view-tag">👁️ View</span>
                              </button>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>0</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: '600' }}>{row.totalAvailable.toLocaleString()}</td>
                          <td style={{ textAlign: 'center', fontWeight: '800', color: '#0958d9' }}>
                            {row.acceptedQty.toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: '700', color: '#dc2626' }}>
                            {row.rejectedQty.toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: '600', color: '#475569' }}>
                            {row.remainingQty.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Batches Selection Card */}
          <div className="batches-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: 0 }}>ACCEPTED INVENTORY (DATE-WISE)</h3>
              {batches.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#0f3a5e',
                    userSelect: 'none',
                    backgroundColor: areAllBatchesSelected ? '#e0f2fe' : '#f1f5f9',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: areAllBatchesSelected ? '#38bdf8' : '#cbd5e1',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}>
                    <input
                      type="checkbox"
                      className="custom-checkbox"
                      checked={areAllBatchesSelected}
                      ref={el => { if (el) el.indeterminate = isSomeBatchesSelected; }}
                      onChange={handleSelectAllToggle}
                    />
                    <span>{areAllBatchesSelected ? 'Deselect All Dates' : 'Select All Dates'}</span>
                  </label>
                </div>
              )}
            </div>
            <p className="helper-text">
              Select batches to include in this Process IC. Specify accepted quantities per batch/sub-drawing. Balance quantities remain available for subsequent calls.
            </p>

            {Object.keys(groupedBatches).length === 0 ? (
              <div className="no-data">No uninspected batches available for this PO and Product Type.</div>
            ) : (
              <div className="date-groups">
                {Object.entries(groupedBatches).map(([date, dateBatches]) => {
                  const allSelected = dateBatches.every(b => !!selectedBatches[b.declarationBatchId]);
                  const someSelected = dateBatches.some(b => !!selectedBatches[b.declarationBatchId]) && !allSelected;
                  const isExpanded = expandedDates.includes(date);

                  return (
                    <div key={date} className="date-group" style={{ marginBottom: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
                      <div
                        className="date-header"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#f8fafc', cursor: 'pointer' }}
                        onClick={() => toggleDateGroup(date)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="checkbox"
                            className="custom-checkbox"
                            checked={allSelected}
                            ref={el => { if (el) el.indeterminate = someSelected; }}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleDateGroupToggle(dateBatches);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="date-label" style={{ fontSize: '17px', color: '#0f3a5e', fontWeight: '800' }}>
                            {date}
                          </div>
                          <div className="badge" style={{ backgroundColor: '#e2e8f0', color: '#334155', fontWeight: '800', padding: '3px 10px', borderRadius: '12px', fontSize: '12px' }}>
                            {dateBatches.length} Batches
                          </div>
                        </div>
                        <div style={{ color: '#64748b', fontSize: '14px', transition: 'transform 0.3s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                          ▼
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="batches-grid">
                          {dateBatches.map(batch => {
                            const isSelected = !!selectedBatches[batch.declarationBatchId];
                            const batchSelection = selectedBatches[batch.declarationBatchId] || {};
                            const availableQty = batch.availableQty !== undefined ? batch.availableQty : batch.qtyManufactured;
                            const acceptedVal = batchSelection.acceptedQty !== undefined ? batchSelection.acceptedQty : availableQty;
                            const isInvalid = isSelected && (acceptedVal === '' || acceptedVal <= 0 || acceptedVal > availableQty);

                            return (
                              <div
                                key={batch.declarationBatchId}
                                className={`modern-batch-card ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleBatchToggle(batch)}
                                style={{ cursor: 'pointer' }}
                              >
                                <div className="batch-card-header">
                                  <input
                                    type="checkbox"
                                    className="custom-checkbox"
                                    checked={isSelected}
                                    readOnly
                                    style={{ marginTop: '2px' }}
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px', gap: '4px' }}>
                                      <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f3a5e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        Batch: {batch.batchNo}
                                      </span>
                                      {batch.drawingNo && (
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: '5px', whiteSpace: 'nowrap' }}>
                                          {batch.drawingNo}
                                        </span>
                                      )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '6px', fontSize: '11px', color: '#64748b', marginTop: '2px', flexWrap: 'wrap' }}>
                                      <span>Decl: <b>{batch.qtyManufactured}</b></span>
                                      <span>Avail: <b style={{ color: '#0f3a5e' }}>{availableQty}</b></span>
                                      {batch.verificationRejectedQty > 0 && (
                                        <span style={{ color: '#dc2626', fontWeight: '700' }}>
                                          Rej: {batch.verificationRejectedQty}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {isSelected && (
                                  <div className="qty-input-group" onClick={(e) => e.stopPropagation()}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                      <span className="qty-input-label">Accepted:</span>
                                      <input
                                        type="number"
                                        min="1"
                                        max={availableQty}
                                        className={`qty-number-input ${isInvalid ? 'input-error' : ''}`}
                                        value={acceptedVal}
                                        onChange={(e) => handleAcceptedQtyChange(batch.declarationBatchId, e.target.value)}
                                        disabled={isSubmitting}
                                      />
                                    </div>
                                    <span className="balance-pill">
                                      Bal: <b>{Math.max(0, availableQty - (parseInt(acceptedVal, 10) || 0))}</b>
                                    </span>
                                    {isInvalid && (
                                      <div className="error-pill" style={{ width: '100%', marginTop: '3px', fontSize: '10px' }}>
                                        {acceptedVal === '' || acceptedVal <= 0
                                          ? 'Must be > 0'
                                          : `Max: ${availableQty}`}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Inspection Findings & Actions */}
        <div className="right-panel">
          <div className="summary-card">
            <h3>Inspection Findings</h3>

            <div className="summary-stats">
              <div className="stat-box primary">
                <label>Qty Offered</label>
                <div className="stat-val">{totals.totalManufactured}</div>
              </div>
              <div className="stat-box danger">
                <label>Qty Rejected</label>
                <div className="stat-val">{totals.totalRejected}</div>
              </div>
              <div className="stat-box success">
                <label>Qty Accepted</label>
                <div className="stat-val">{totals.totalAccepted}</div>
              </div>
            </div>

            {/* Lot Range Inputs */}
            <div className="form-group" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '14px', margin: 0, fontWeight: '600', color: '#0f3a5e' }}>
                Lot Range <span style={{ color: 'red' }}>*</span>
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '4px 8px',
                borderRadius: '6px',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                width: '260px'
              }}>
                <input
                  type="text"
                  placeholder="From (e.g. L-100)"
                  value={lotRangeFrom}
                  onChange={(e) => setLotRangeFrom(e.target.value)}
                  disabled={isSubmitting}
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px', background: 'transparent' }}
                />
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>&rarr;</span>
                <input
                  type="text"
                  placeholder="To (e.g. L-200)"
                  value={lotRangeTo}
                  onChange={(e) => setLotRangeTo(e.target.value)}
                  disabled={isSubmitting}
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px', background: 'transparent' }}
                />
              </div>
            </div>

            {/* Reason for Rejection Section */}
            <div className="reason-container" style={{ marginTop: '20px' }}>
              <label>Reason for Rejection</label>
              {(() => {
                const rejectedBatchesList = batches.filter(
                  (b) => selectedBatches[b.declarationBatchId] && selectedBatches[b.declarationBatchId].qtyRejected > 0
                );

                if (rejectedBatchesList.length === 0) {
                  return (
                    <div style={{ color: '#64748b', fontStyle: 'italic', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                      No rejected batches selected.
                    </div>
                  );
                }

                return (
                  <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                          <th style={{ padding: '8px 12px', fontWeight: '600', color: '#475569' }}>Batch No</th>
                          {isNcrgrsp && (
                            <th style={{ padding: '8px 12px', fontWeight: '600', color: '#475569' }}>Drawing No</th>
                          )}
                          <th style={{ padding: '8px 12px', fontWeight: '600', color: '#475569' }}>Rej Qty</th>
                          <th style={{ padding: '8px 12px', fontWeight: '600', color: '#475569' }}>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rejectedBatchesList.flatMap((batch, index) => {
                          if (batch.rejections && batch.rejections.length > 0) {
                            return batch.rejections.map((rej, rIdx) => (
                              <tr key={`${batch.declarationBatchId}-${rIdx}`} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                                <td style={{ padding: '8px 12px', color: '#0f3a5e', fontWeight: '600' }}>{batch.batchNo}</td>
                                {isNcrgrsp && (
                                  <td style={{ padding: '8px 12px', color: '#0ea5e9', fontWeight: '600' }}>{rej.drawingNo || batch.drawingNo || 'N/A'}</td>
                                )}
                                <td style={{ padding: '8px 12px', color: '#dc2626', fontWeight: '700' }}>{rej.rejectedQty}</td>
                                <td style={{ padding: '8px 12px', color: '#334155' }}>{rej.reason || 'N/A'}</td>
                              </tr>
                            ));
                          } else {
                            return (
                              <tr key={batch.declarationBatchId} style={{ borderBottom: index === rejectedBatchesList.length - 1 ? 'none' : '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                                <td style={{ padding: '8px 12px', color: '#0f3a5e', fontWeight: '600' }}>{batch.batchNo}</td>
                                {isNcrgrsp && (
                                  <td style={{ padding: '8px 12px', color: '#0ea5e9', fontWeight: '600' }}>{batch.drawingNo || 'N/A'}</td>
                                )}
                                <td style={{ padding: '8px 12px', color: '#dc2626', fontWeight: '700' }}>{selectedBatches[batch.declarationBatchId].qtyRejected}</td>
                                <td style={{ padding: '8px 12px', color: '#334155' }}>{batch.verificationRejectedReason || 'N/A'}</td>
                              </tr>
                            );
                          }
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Visual Inspection Photo Capture */}
            <ImageCaptureComponent
              images={capturedImages}
              onImagesChange={(imgs) => {
                setCapturedImages(imgs);
                saveImages(getDraftKey() + '_images', imgs);
              }}
              minImages={5}
              maxImages={10}
            />

            {/* Remarks Input */}
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>Remarks <span style={{ color: 'red' }}>*</span></label>
              <textarea
                className="modern-textarea"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add process inspection observations & remarks..."
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="dashboard-footer" style={{ marginTop: '24px', padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <button
          onClick={() => handleSaveOrFinish('DRAFT')}
          disabled={isSubmitting}
          style={{ backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', padding: '12px 24px', fontSize: '15px', fontWeight: '600', borderRadius: '8px', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: isSubmitting ? 0.7 : 1 }}
          onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
          onMouseLeave={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
        >
          {isSubmitting ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          onClick={() => handleSaveOrFinish('PAUSE')}
          disabled={isSubmitting}
          style={{ backgroundColor: '#ffffff', color: '#0f3a5e', border: '1px solid #0f3a5e', padding: '12px 24px', fontSize: '15px', fontWeight: '600', borderRadius: '8px', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: isSubmitting ? 0.7 : 1 }}
          onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
          onMouseLeave={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = '#ffffff'; }}
        >
          {isSubmitting ? 'Pausing...' : 'Pause Inspection'}
        </button>
        <button
          onClick={() => handleSaveOrFinish('FINISH')}
          disabled={isFinishDisabled}
          title={totals.hasInvalidQty ? 'Please ensure all selected batches have a valid accepted quantity' : ''}
          style={{
            backgroundColor: isFinishDisabled ? '#94a3b8' : '#10b981',
            color: '#ffffff',
            border: 'none',
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: '700',
            borderRadius: '8px',
            cursor: isFinishDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: isFinishDisabled ? 'none' : '0 2px 4px rgba(16, 185, 129, 0.2)',
            opacity: isFinishDisabled ? 0.65 : 1
          }}
          onMouseEnter={(e) => { if (!isFinishDisabled) e.currentTarget.style.backgroundColor = '#059669'; }}
          onMouseLeave={(e) => { if (!isFinishDisabled) e.currentTarget.style.backgroundColor = '#10b981'; }}
        >
          {isSubmitting ? 'Processing...' : 'Finish Inspection'}
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && ReactDOM.createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999
        }}>
          <div className="fade-in" style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '90%',
            maxWidth: '420px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '24px' }}>📋</span>
            </div>

            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
              Finish Process Inspection
            </h3>

            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
              Are you sure you want to finish this Process Inspection? Total Accepted Quantity: <b>{totals.totalAccepted.toLocaleString()} Nos</b> across {Object.keys(selectedBatches).length} batches.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowConfirmModal(false);
                  await executeSaveOrFinish(pendingAction || 'FINISH');
                }}
                disabled={isSubmitting}
                style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: '700', cursor: 'pointer' }}
              >
                {isSubmitting ? 'Finishing...' : 'Confirm & Finish'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Pop-up Modal: NCRGRSP Incomplete Allocation Acknowledgement */}
      {showNcrgrspAckModal && ReactDOM.createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '20px'
        }}>
          <div className="fade-in" style={{
            background: 'white',
            borderRadius: '16px',
            padding: '28px',
            width: '95%',
            maxWidth: '560px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#fffbeb',
                border: '1.5px solid #fde68a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                  Incomplete Drawing Allocation Status
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>
                  NCRGRSP Turnout Allocation Warning
                </p>
              </div>
            </div>

            <div style={{
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '16px'
            }}>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#9a3412', lineHeight: '1.5', fontWeight: '600' }}>
                The following Drawing No(s) have an <b>Allocation Status of less than 100%</b>:
              </p>
            </div>

            {/* List of Incomplete Drawings */}
            <div style={{
              maxHeight: '220px',
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              marginBottom: '18px',
              background: '#f8fafc'
            }}>
              <table className="ncr-table" style={{ width: '100%', margin: 0, fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 14px' }}>Drawing No.</th>
                    <th style={{ textAlign: 'center', padding: '10px 10px' }}>Required</th>
                    <th style={{ textAlign: 'center', padding: '10px 10px' }}>Offered</th>
                    <th style={{ textAlign: 'center', padding: '10px 14px' }}>Allocation Status</th>
                  </tr>
                </thead>
                <tbody>
                  {incompleteNcrDrawings.map((d) => (
                    <tr key={d.drawingNo}>
                      <td style={{ fontWeight: '700', color: '#1677ff', padding: '10px 14px' }}>
                        {d.drawingNo}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '700', color: '#334155', padding: '10px 10px' }}>
                        {d.requiredQty.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '800', color: '#0958d9', padding: '10px 10px' }}>
                        {d.offeredQty.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center', padding: '10px 14px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '800',
                          background: d.progressPercent === 0 ? '#fee2e2' : '#fef3c7',
                          color: d.progressPercent === 0 ? '#dc2626' : '#d97706'
                        }}>
                          {d.progressPercent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#1e293b', fontWeight: '600', lineHeight: '1.5' }}>
              Drawing allocation is less than 100%. Are you sure you want to finish the inspection?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'auto' }}>
              <button
                type="button"
                onClick={() => setShowNcrgrspAckModal(false)}
                disabled={isSubmitting}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: 'white',
                  color: '#475569',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                Review Allocation (Cancel)
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowNcrgrspAckModal(false);
                  await executeSaveOrFinish('FINISH');
                }}
                disabled={isSubmitting}
                style={{
                  padding: '10px 22px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#d97706',
                  color: 'white',
                  fontWeight: '700',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)'
                }}
              >
                {isSubmitting ? 'Finishing...' : 'Yes, Finish Inspection'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Pop-up Modal: Selected Batches Breakdown */}
      {selectedBatchesModalData && ReactDOM.createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div className="fade-in" style={{
            background: 'white',
            borderRadius: '16px',
            width: '95%',
            maxWidth: '1060px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ClipboardIcon />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f3a5e' }}>
                    {selectedBatchesModalData.title}
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>
                    Breakdown of batches selected for this drawing in the current call
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBatchesModalData(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  lineHeight: '1',
                  borderRadius: '6px'
                }}
                title="Close"
              >
                ×
              </button>
            </div>

            {/* Modal Badges Banner */}
            <div style={{
              padding: '14px 24px',
              background: '#ffffff',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <span className="ncr-badge-req" style={{ fontSize: '12px', padding: '5px 14px' }}>
                Selected Batches: <b>{selectedBatchesModalData.batches?.length || 0}</b>
              </span>
              <span className="ncr-badge-offered" style={{ fontSize: '12px', padding: '5px 14px' }}>
                Total Accepted Qty: <b>
                  {(selectedBatchesModalData.batches || []).reduce((sum, b) => {
                    const acc = typeof b.acceptedQty === 'number' ? b.acceptedQty : (parseInt(b.acceptedQty, 10) || 0);
                    return sum + acc;
                  }, 0).toLocaleString()} Nos.
                </b>
              </span>
              <span className="ncr-badge-rejected" style={{ fontSize: '12px', padding: '5px 14px' }}>
                Total Rejected Qty: <b>
                  {(selectedBatchesModalData.batches || []).reduce((sum, b) => {
                    const rej = typeof b.qtyRejected === 'number' ? b.qtyRejected : (parseInt(b.qtyRejected, 10) || 0);
                    return sum + rej;
                  }, 0).toLocaleString()} Nos.
                </b>
              </span>
            </div>

            {/* Modal Table Content */}
            <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
              <table className="ncr-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center', width: '45px', whiteSpace: 'nowrap' }}>Sl.</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Batch No.</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Drawing No.</th>
                    <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Batch Date</th>
                    <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Available Qty</th>
                    <th style={{ textAlign: 'center', color: '#0958d9', whiteSpace: 'nowrap' }}>Accepted Qty</th>
                    <th style={{ textAlign: 'center', color: '#dc2626', whiteSpace: 'nowrap' }}>Rejected Qty</th>
                    <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {(!selectedBatchesModalData.batches || selectedBatchesModalData.batches.length === 0) ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No batches currently selected for this drawing.
                      </td>
                    </tr>
                  ) : (
                    selectedBatchesModalData.batches.map((b, idx) => {
                      const avail = b.availableQty !== undefined ? b.availableQty : b.qtyManufactured;
                      const acc = typeof b.acceptedQty === 'number' ? b.acceptedQty : (parseInt(b.acceptedQty, 10) || avail);
                      const rej = typeof b.qtyRejected === 'number' ? b.qtyRejected : (parseInt(b.qtyRejected, 10) || 0);
                      const rem = Math.max(0, avail - acc);
                      return (
                        <tr key={b.declarationBatchId || idx}>
                          <td style={{ textAlign: 'center', fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap' }}>
                            {idx + 1}
                          </td>
                          <td style={{ fontWeight: '800', color: '#0f3a5e', whiteSpace: 'nowrap' }}>
                            {b.batchNo}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span style={{
                              fontWeight: '700',
                              color: '#0284c7',
                              background: '#e0f2fe',
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              whiteSpace: 'nowrap',
                              display: 'inline-block'
                            }}>
                              {b.drawingNo || selectedBatchesModalData.drawingNo || 'N/A'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: '600', color: '#334155', whiteSpace: 'nowrap' }}>
                            {formatDate(b.productionDate)}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>
                            {avail.toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: '800', color: '#0958d9', fontSize: '14px', whiteSpace: 'nowrap' }}>
                            {acc.toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: '700', color: rej > 0 ? '#dc2626' : '#94a3b8', whiteSpace: 'nowrap' }}>
                            {rej.toLocaleString()}
                          </td>
                          <td style={{
                            textAlign: 'center',
                            fontWeight: '700',
                            color: rem > 0 ? '#d97706' : '#16a34a',
                            whiteSpace: 'nowrap'
                          }}>
                            {rem.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              backgroundColor: '#f8fafc'
            }}>
              <button
                type="button"
                onClick={() => setSelectedBatchesModalData(null)}
                style={{
                  padding: '9px 22px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: 'white',
                  color: '#334155',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default RailpadProcessInspectionDashboard;
