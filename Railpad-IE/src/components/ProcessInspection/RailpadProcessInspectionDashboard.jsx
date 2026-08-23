import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { getBaseUrl, getDefaultHeaders } from '../../services/apiConfig';
import { performTransitionAction } from '../../services/workflowService';
import Notification from '../Notification';
import AnnexureLoader from '../annexures/AnnexureLoader';
import './ProcessInspection.css'; // Let's make sure it's pretty and responsive

// Complete Master Catalog of required pieces per set for all NCRGRSP Turnout types
const NCRGRSP_SET_SIZES = {
  '4865': 216,  // RT-4865 (6mm Thick Pocket Type 1 in 8.5 Turnout)
  '6154': 345,  // RT-6154 (1 in 12 TWB Switch for 60 Kg)
  '4734': 67,   // RT-4734 (1 in 12 CMS x-ing B.G. for 52 Kg)
  '4733': 345,  // RT-4733 (1 in 12 O.R. T/out for 52 Kg)
  '4867': 216,  // RT-4867 (1 in 8.5 T/out for 52 Kg)
  '5691': 385,  // RT-5691 (6mm Thick 1 in 16 Turnout ORS)
  '5693': 86,   // RT-5693 (6mm Thick CMS Crossing 1 in 16)
  '5836': 80,   // RT-5836 (6mm Thick NCR GRSP Turnout)
  '4732': 332,  // RT-4732 (6mm Turnout)
  '10070': 403, // RT-10070 (10mm Thick 1 in 16 Turnout)
  '4218': 321,  // RT-4218 (60 kg 1 in 12 Turnout Alt.6)
  '8779': 351,  // RT-8779 (60 kg 1 in 12 Turnout per Set Alt-3)
  '10241': 385, // RT-10241 (6mm Thick TWS 1 in 16 Turnout, 60 kg)
  '10243': 86,  // RT-10243 (6mm Thick CMS Crossing 1 in 16, 60 kg)
  '8822': 60,   // RT-8822 (10mm Thick for TWSEJ)
  '9790': 351,  // RT-9790 (Pocket Type 1 in 12 Turnout for 25T Axle Load)
  '9841': 234,  // RT-9841 (10mm 1 in 8.5 60E1 Turnout)
  '9774': 234,  // RT-9774 (TWS 60 Kg 1 in 8.5 Alt-2)
  '9842': 132,  // RT-9842 to RT-9843 (10mm Turnout Series)
  '9843': 132,
  '6068': 80,   // RT-6068 (6mm Derailing Switch 1 in 8.5)
  '4220': 321,
  '4967': 216
};

const getQtyPerSet = (drawingStr, railPadTypeStr) => {
  const isNcr = railPadTypeStr && /NCR\s*GRSP/i.test(railPadTypeStr);
  if (!isNcr || !drawingStr) return null;

  for (const [key, qty] of Object.entries(NCRGRSP_SET_SIZES)) {
    if (drawingStr.includes(key)) {
      return qty;
    }
  }
  return null;
};

const RailpadProcessInspectionDashboard = ({ user, call, currentShift, onBack, onUpdateCall, onPauseComplete }) => {
  const [batches, setBatches] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState({}); // { declarationBatchId: { qtyRejected: 0 } }
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

  const getDraftKey = () => `process_ic_draft_state_v4_${call.requestId || call.callNo}`;

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

      // 0. Fetch Summary Data (this internally also fetches process call details for drawingNo)
      const summaryRes = await fetch(`${getBaseUrl()}/rail-inspection-call/summary/${callId}`, { method: 'GET', headers }).then(r => r.json());
      const summaryData = summaryRes?.responseData || {};
      setSummary(summaryData);

      // Extract Drawing No directly from the dedicated field in summary response
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
      // Use summaryData.ercType as railPadType if available, or fallback to call.railPadType
      const railPadType = summaryData.ercType || call.railPadType;
      const poNo = summaryData.poNo || call.poNo;

      const batchesReq = await fetch(
        `${getBaseUrl()}/rail-inspection-call/process/available-batches?poNo=${encodeURIComponent(poNo)}&railPadType=${encodeURIComponent(railPadType)}&callNo=${encodeURIComponent(call.requestId || call.callNo)}`,
        { method: 'GET', headers }
      );
      const batchesRes = await batchesReq.json();

      let allBatches = batchesRes?.responseData?.batches || [];

      // Filter batches by drawing number if one was specified during call raising
      if (fetchedDrawingNo) {
        const filtered = allBatches.filter(b => b.drawingNo === fetchedDrawingNo);
        // Only apply filter if it narrows things down (avoid filtering to empty if backend doesn't return drawingNo per batch)
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
            qtyManufactured: b.qtyManufactured
          }));

          // Combine available batches with draft batches
          // Prioritize allBatches since it contains the richer 'rejections' array from the backend
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
            newSelectedBatches[b.declarationBatchId] = {
              qtyRejected: b.qtyRejected || 0,
              qtyManufactured: b.qtyManufactured
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

            // Restore active local selected batches that are valid and present in allBatches
            if (savedLocalDraft.selectedBatches && typeof savedLocalDraft.selectedBatches === 'object') {
              Object.keys(savedLocalDraft.selectedBatches).forEach(batchId => {
                const batchExists = allBatches.some(b => b.declarationBatchId.toString() === batchId.toString());
                if (batchExists) {
                  newSelectedBatches[batchId] = savedLocalDraft.selectedBatches[batchId];
                }
              });
            }
          }
        }
      } catch (e) {
        console.error('Error restoring local draft state', e);
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

  const handleBatchToggle = (batch) => {
    setSelectedBatches(prev => {
      const next = { ...prev };
      if (next[batch.declarationBatchId]) {
        delete next[batch.declarationBatchId];
      } else {
        next[batch.declarationBatchId] = {
          qtyRejected: batch.verificationRejectedQty || 0,
          qtyManufactured: batch.qtyManufactured
        };
      }
      return next;
    });
  };

  const handleDateGroupToggle = (dateBatches) => {
    const allSelected = dateBatches.every(b => selectedBatches[b.declarationBatchId]);

    setSelectedBatches(prev => {
      const next = { ...prev };
      if (allSelected) {
        // deselect all
        dateBatches.forEach(b => {
          delete next[b.declarationBatchId];
        });
      } else {
        // select all
        dateBatches.forEach(b => {
          if (!next[b.declarationBatchId]) {
            next[b.declarationBatchId] = {
              qtyRejected: b.verificationRejectedQty || 0,
              qtyManufactured: b.qtyManufactured
            };
          }
        });
      }
      return next;
    });
  };

  const handleRejectedQtyChange = (batchId, val) => {
    const numericVal = parseInt(val, 10) || 0;
    setSelectedBatches(prev => {
      if (!prev[batchId]) return prev;
      const manufactured = prev[batchId].qtyManufactured;
      // Cannot reject more than manufactured
      const validRejected = Math.min(numericVal, manufactured);
      return {
        ...prev,
        [batchId]: { ...prev[batchId], qtyRejected: validRejected }
      };
    });
  };

  const calculateTotals = () => {
    let totalManufactured = 0;
    let totalRejected = 0;
    let totalAccepted = 0;

    Object.values(selectedBatches).forEach(b => {
      totalManufactured += b.qtyManufactured;
      totalRejected += b.qtyRejected;
      totalAccepted += (b.qtyManufactured - b.qtyRejected);
    });

    return { totalManufactured, totalRejected, totalAccepted };
  };

  const totals = calculateTotals();

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear().toString().slice(2)}`;
  };

  // Group batches by date
  const groupedBatches = batches.reduce((acc, batch) => {
    const date = formatDate(batch.productionDate);
    if (!acc[date]) acc[date] = [];
    acc[date].push(batch);
    return acc;
  }, {});

  const areAllBatchesSelected = batches.length > 0 && batches.every(b => !!selectedBatches[b.declarationBatchId]);
  const isSomeBatchesSelected = batches.some(b => !!selectedBatches[b.declarationBatchId]) && !areAllBatchesSelected;

  const handleSelectAllToggle = () => {
    if (areAllBatchesSelected) {
      // Deselect all
      setSelectedBatches({});
    } else {
      // Select all batches across all dates
      const next = {};
      batches.forEach(b => {
        next[b.declarationBatchId] = {
          qtyRejected: b.verificationRejectedQty || 0,
          qtyManufactured: b.qtyManufactured
        };
      });
      setSelectedBatches(next);
    }
  };

  useEffect(() => {
    if (Object.keys(groupedBatches).length > 0 && expandedDates.length === 0) {
      setExpandedDates([Object.keys(groupedBatches)[0]]);
    }
  }, [batches]);

  const toggleDateGroup = (dateStr) => {
    setExpandedDates(prev =>
      prev.includes(dateStr)
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const handleSaveOrFinish = async (actionType) => {
    // actionType can be 'DRAFT', 'PAUSE', or 'FINISH'
    const isFinish = actionType === 'FINISH';

    if (Object.keys(selectedBatches).length === 0) {
      showNotification('Please select at least one batch to inspect.', 'warning');
      return;
    }

    if (actionType === 'PAUSE' || actionType === 'FINISH') {
      if (!lotRangeFrom || !lotRangeTo) {
        showNotification('Lot Range (From and To) is mandatory to proceed.', 'error');
        return;
      }
      if (!remarks || remarks.trim() === '') {
        showNotification('Remarks are mandatory to proceed.', 'error');
        return;
      }
    }

    if (isFinish && totals.totalRejected > 0) {
      // Rejections are now fetched from production verification, so we no longer require a manual reason input
      // However, we can still verify that the selected batches actually have rejections if needed.
    }

    if (isFinish) {
      // Validation for NCRGRSP required quantity
      const currentRailPadType = summary?.ercType || call?.railPadType || '';
      const isNcrgrsp = /NCR\s*GRSP/i.test(currentRailPadType);
      const currentDrawing = drawingNo || call?.drawingNo || summary?.drawingNo || '';
      const qtyPerSet = isNcrgrsp ? getQtyPerSet(currentDrawing, currentRailPadType) : null;
      const offeredSets = Number(summary?.totalOfferedQty || call?.qtyDesiredForFinal || call?.callQty || call?.totalQty || 0);

      if (qtyPerSet && offeredSets > 0) {
        const minRequiredQty = offeredSets * qtyPerSet;
        if (totals.totalAccepted < minRequiredQty) {
          showNotification(
            `Cannot finish inspection: Total Accepted Quantity (${totals.totalAccepted.toLocaleString()} Nos) must be at least ${minRequiredQty.toLocaleString()} Nos (${offeredSets} Sets × ${qtyPerSet}). Please select more batches.`,
            'error'
          );
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
      // Compile reason for rejection from selected rejected batches supporting multiple drawings and reasons
      let compiledReason = reasonForRejection;
      if (!compiledReason) {
        const rejectedBatchesList = batches.filter(
          (b) => selectedBatches[b.declarationBatchId] && selectedBatches[b.declarationBatchId].qtyRejected > 0
        );

        // Check if there are multiple unique drawing numbers across all rejected batches
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
            // Group rejections by drawingNo
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
            drawingNo: originalBatch.drawingNo || drawingNo || '',
            reasonForRejection: batchRejectionReason,
            productionDate: originalBatch.productionDate || batchData.productionDate,
            qtyManufactured: batchData.qtyManufactured,
            qtyRejected: batchData.qtyRejected,
            qtyAccepted: batchData.qtyManufactured - batchData.qtyRejected
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

      // Clear draft on Pause or Finish
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
        // No transition action for draft, just save data
        showNotification('Draft saved successfully.', 'success');
        setIsSubmitting(false);
      }
    } catch (error) {
      showNotification(error.message || 'Failed to save inspection', 'error');
      setIsSubmitting(false); // only re-enable if there was an error
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
  const displayDrawingNo = drawingNo || call.drawingNo || '';

  const isNcrgrsp = /NCR\s*GRSP/i.test(displayRailPadType);
  const qtyPerSet = isNcrgrsp ? getQtyPerSet(displayDrawingNo, displayRailPadType) : null;
  const totalPiecesRequired = qtyPerSet ? (Number(displayQty) || 0) * qtyPerSet : null;
  const isSet = isNcrgrsp && (summary?.unit?.toLowerCase().includes('set') || (!summary?.unit && qtyPerSet));

  const isNcrInsufficient = isNcrgrsp && !!qtyPerSet && (Number(displayQty) > 0) && (totals.totalAccepted < totalPiecesRequired);
  const isFinishDisabled = isSubmitting || isNcrInsufficient;

  return (
    <div className="process-ic-dashboard fade-in">
      {notification.message && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: 'info' })} />
      )}

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
        {/* Left Panel: Information & Selection */}
        <div className="left-panel">
          <div className="info-card">
            <h3>Information Displayed to Main IE</h3>
            <div className="info-grid" style={{ gridTemplateColumns: qtyPerSet ? 'repeat(auto-fit, minmax(160px, 1fr))' : 'repeat(5, 1fr)' }}>
              <div className="info-item">
                <label>Call No</label>
                <div className="value">{call.requestId || call.callNo}</div>
              </div>
              <div className="info-item" style={{ minWidth: qtyPerSet ? '220px' : 'auto' }}>
                <label>Quantity Offered Now</label>
                <div className="value">
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f3a5e' }}>
                      {displayQty} {isSet ? 'Sets' : (summary?.unit || 'Nos.')}
                    </span>
                    {qtyPerSet && (
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#0284c7' }}>
                        ({displayQty} × {qtyPerSet} = {totalPiecesRequired.toLocaleString()} Nos)
                      </span>
                    )}
                  </div>
                  {qtyPerSet && (
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1', marginTop: '3px' }}>
                      1 Set = {qtyPerSet} required qty
                    </div>
                  )}
                </div>
              </div>
              <div className="info-item">
                <label>RailPad Type</label>
                <div className="value">{displayRailPadType}</div>
              </div>
              {displayDrawingNo && (
                <div className="info-item">
                  <label>Drawing No</label>
                  <div className="value" style={{ fontWeight: '700', color: '#0f3a5e' }}>{displayDrawingNo}</div>
                </div>
              )}
              <div className="info-item">
                <label>PO Serial No</label>
                <div className="value">{displayPoSr}</div>
              </div>
            </div>
          </div>

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
            <p className="helper-text">Select batches from Vendor Production Declaration to include in this Process IC.</p>

            {Object.keys(groupedBatches).length === 0 ? (
              <div className="no-data">No uninspected batches available for this PO and Product Type.</div>
            ) : (
              <div className="date-groups">
                {Object.entries(groupedBatches).map(([date, dateBatches]) => {
                  const allSelected = dateBatches.every(b => selectedBatches[b.declarationBatchId]);
                  const isExpanded = expandedDates.includes(date);
                  return (
                    <div key={date} className="date-group" style={{ marginBottom: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
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
                            onChange={(e) => {
                              e.stopPropagation();
                              handleDateGroupToggle(dateBatches);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="date-label" style={{ fontSize: '18px', color: '#0f3a5e', fontWeight: '900', letterSpacing: '0.5px' }}>
                            {date}
                          </div>
                          <div className="badge" style={{ backgroundColor: '#e2e8f0', color: '#334155', fontWeight: '800', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>
                            {dateBatches.length} Batches
                          </div>
                        </div>
                        <div style={{ color: '#64748b', fontSize: '14px', transition: 'transform 0.3s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                          ▼
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="batch-grid" style={{ padding: '16px' }}>
                          {dateBatches.map(batch => {
                            const isSelected = !!selectedBatches[batch.declarationBatchId];
                            return (
                              <div
                                key={batch.declarationBatchId}
                                className={`batch-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleBatchToggle(batch)}
                              >
                                <input
                                  type="checkbox"
                                  className="custom-checkbox"
                                  checked={isSelected}
                                  readOnly
                                />
                                <div className="batch-details" style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <span className="batch-no" style={{ fontSize: '15px', fontWeight: '800', color: '#0f3a5e' }}>
                                      Batch: {batch.batchNo}
                                    </span>
                                  </div>
                                  {batch.drawingNo && (
                                    <span className="batch-drawing" style={{ fontSize: '13px', fontWeight: '600', color: '#0ea5e9' }}>
                                      Drawing No: {batch.drawingNo}
                                    </span>
                                  )}
                                  <span className="batch-qty" style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>
                                    Qty: {batch.qtyManufactured}
                                  </span>
                                </div>
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

        {/* Right Panel: Inspection Inputs & Summary */}
        <div className="right-panel">
          <div className="summary-card">
            <h3>Inspection Findings</h3>

            <div className="summary-stats">
              <div className="stat-box primary">
                <label>Qty Manufactured</label>
                <div className="stat-val">{totals.totalManufactured}</div>
              </div>
              <div className="stat-box danger">
                <label>Qty Rejected</label>
                <div className="stat-val">{totals.totalRejected}</div>
              </div>
              <div className={`stat-box ${isNcrInsufficient ? 'danger' : 'success'}`} style={isNcrInsufficient ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}>
                <label style={isNcrInsufficient ? { color: '#b91c1c' } : {}}>Qty Accepted</label>
                <div className="stat-val" style={isNcrInsufficient ? { color: '#b91c1c' } : {}}>{totals.totalAccepted}</div>
                {isNcrgrsp && qtyPerSet && (
                  <div style={{ fontSize: '11px', fontWeight: '700', color: isNcrInsufficient ? '#dc2626' : '#16a34a', marginTop: '4px' }}>
                    {isNcrInsufficient 
                      ? `Min: ${totalPiecesRequired.toLocaleString()} (Short by ${(totalPiecesRequired - totals.totalAccepted).toLocaleString()} Nos)`
                      : `Req: ${totalPiecesRequired.toLocaleString()} (Met)`}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '400px' }}>
              <label style={{ fontSize: '14px', margin: 0, fontWeight: '600', color: '#0f3a5e' }}>Lot Range <span style={{color: 'red'}}>*</span></label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '2px 6px',
                borderRadius: '6px',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                width: '280px'
              }}>
                <input
                  type="text"
                  placeholder="From (e.g. L-100)"
                  value={lotRangeFrom}
                  onChange={(e) => setLotRangeFrom(e.target.value)}
                  disabled={isSubmitting}
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px', padding: '4px 0', background: 'transparent' }}
                />
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>&rarr;</span>
                <input
                  type="text"
                  placeholder="To (e.g. L-200)"
                  value={lotRangeTo}
                  onChange={(e) => setLotRangeTo(e.target.value)}
                  disabled={isSubmitting}
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px', padding: '4px 0', background: 'transparent' }}
                />
              </div>
            </div>

            <div className="reason-container" style={{ marginTop: '20px' }}>
              <label>Reason for Rejection</label>
              {(() => {
                const rejectedBatchesList = batches.filter(
                  (b) => selectedBatches[b.declarationBatchId] && selectedBatches[b.declarationBatchId].qtyRejected > 0
                );

                if (rejectedBatchesList.length === 0) {
                  return <div style={{ color: '#64748b', fontStyle: 'italic', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>No rejected batches selected.</div>;
                }

                return (
                  <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                      <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                          <th style={{ padding: '10px 16px', fontWeight: '600', color: '#475569' }}>Batch No</th>
                          {displayRailPadType?.includes('NCRGRSP') && (
                            <th style={{ padding: '10px 16px', fontWeight: '600', color: '#475569' }}>Drawing No</th>
                          )}
                          <th style={{ padding: '10px 16px', fontWeight: '600', color: '#475569' }}>Rejected Qty</th>
                          <th style={{ padding: '10px 16px', fontWeight: '600', color: '#475569' }}>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rejectedBatchesList.flatMap((batch, index) => {
                          if (batch.rejections && batch.rejections.length > 0) {
                            return batch.rejections.map((rej, rIdx) => (
                              <tr key={`${batch.declarationBatchId}-${rIdx}`} style={{ borderBottom: (index === rejectedBatchesList.length - 1 && rIdx === batch.rejections.length - 1) ? 'none' : '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                                <td style={{ padding: '10px 16px', color: '#0f3a5e', fontWeight: '500' }}>{batch.batchNo}</td>
                                {displayRailPadType?.includes('NCRGRSP') && (
                                  <td style={{ padding: '10px 16px', color: '#0ea5e9', fontWeight: '600' }}>{rej.drawingNo || batch.drawingNo || 'N/A'}</td>
                                )}
                                <td style={{ padding: '10px 16px', color: '#dc2626', fontWeight: '600' }}>{rej.rejectedQty}</td>
                                <td style={{ padding: '10px 16px', color: '#334155' }}>{rej.reason || 'N/A'}</td>
                              </tr>
                            ));
                          } else {
                            return (
                              <tr key={batch.declarationBatchId} style={{ borderBottom: index === rejectedBatchesList.length - 1 ? 'none' : '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                                <td style={{ padding: '10px 16px', color: '#0f3a5e', fontWeight: '500' }}>{batch.batchNo}</td>
                                {displayRailPadType?.includes('NCRGRSP') && (
                                  <td style={{ padding: '10px 16px', color: '#0ea5e9', fontWeight: '600' }}>{batch.drawingNo || 'N/A'}</td>
                                )}
                                <td style={{ padding: '10px 16px', color: '#dc2626', fontWeight: '600' }}>{selectedBatches[batch.declarationBatchId].qtyRejected}</td>
                                <td style={{ padding: '10px 16px', color: '#334155' }}>{batch.verificationRejectedReason || 'N/A'}</td>
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

            <div className="form-group">
              <label>Remarks <span style={{color: 'red'}}>*</span></label>
              <textarea
                className="modern-textarea"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any additional remarks..."
                disabled={isSubmitting}
              />
            </div>

          </div>
        </div>
      </div>

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
          title={isNcrInsufficient ? `Cannot finish: Total Accepted Quantity (${totals.totalAccepted.toLocaleString()} Nos) is less than the required ${totalPiecesRequired.toLocaleString()} Nos (${displayQty} Sets × ${qtyPerSet})` : ''}
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
            maxWidth: '400px',
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
              Finish Inspection
            </h3>
            
            <p style={{ margin: '0 0 24px 0', color: '#475569', fontSize: '15px', lineHeight: '1.5' }}>
              Are you sure you want to complete this inspection? All entered batch quantities and inspection details will be saved and submitted.
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: 'white',
                  color: '#334155',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  await executeSaveOrFinish(pendingAction);
                  setShowConfirmModal(false);
                }}
                disabled={isSubmitting}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#10b981',
                  color: 'white',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isSubmitting ? (
                  <>
                    <span style={{
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Processing...
                  </>
                ) : (
                  'Confirm & Submit'
                )}
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
