import React, { useState, useEffect, useMemo } from 'react';
import { performTransitionAction } from '../services/workflowService';
import { getStoredUser } from '../services/authService';
import { generateCancellationBlankFormatPDF } from '../utils/cancellationFormatPdf';
import { getBaseUrl } from '../services/apiConfig';
import Notification from './Notification';

// SRS 12 Reasons for Cancellation
export const CANCELLATION_REASONS = [
  'Material Not Found',
  'Call letter received after expiry of delivery period',
  'Call letter not submitted in prescribed format',
  'Refusal to undertake tests in approved independent test house/RITES lab at vendor\'s cost',
  'Material offered at premises where adequate room or lighting is not available for proper sampling/inspection',
  'Internal inspection and test records incomplete/not as per contractual requirement',
  'Packing list showing quantities offered item-wise and consignee-wise not available/readable',
  'Lot mixed and not segregated; re-offer required after proper segregation',
  'Inspection could not be arranged despite personal contact/phone discussion with vendor',
  'Required documents (Drawing/Specification/Purchase Order etc.) not produced at the time of inspection',
  'Call Withdrawn by Vendor',
  'Others (Specify)'
];

const CallCancellationModal = ({
  isOpen,
  onClose,
  call,
  showNotification,
  onSuccess
}) => {
  // Toast State
  const [toast, setToast] = useState(null);

  const notify = (msg, type = 'success') => {
    setToast({ message: msg, type });
    if (showNotification) {
      showNotification(msg, type);
    }
  };

  // Form State
  const [cancellationBasis, setCancellationBasis] = useState('CHARGEABLE'); // 'CHARGEABLE' | 'NON_CHARGEABLE'
  const [visitStatus, setVisitStatus]             = useState('BEFORE_VISIT'); // 'BEFORE_VISIT' | 'AFTER_VISIT'
  const [selectedReasons, setSelectedReasons]     = useState([]);
  const [description, setDescription]             = useState('');
  const [file, setFile]                           = useState(null);

  // SRS PO Date & Category State (Category A, B, C)
  const [poCategory, setPoCategory] = useState('B'); // 'A' | 'B' | 'C'
  const [poDate, setPoDate]         = useState('');
  const [poQty, setPoQty]           = useState('');
  const [poValue, setPoValue]       = useState('');
  const [offeredQty, setOfferedQty] = useState('');
  const [derivedRate, setDerivedRate] = useState('');

  // Calculation Fields - Fully Dynamic
  const [materialValue, setMaterialValue] = useState('');
  const [percentage, setPercentage]       = useState('0.90');

  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [formErrors, setFormErrors]       = useState({});
  const [isFetchingPoDetails, setIsFetchingPoDetails] = useState(false);

  // Helper to fetch enriched PO & Call details from API
  const fetchPoDetailsForCall = async (requestId, poNo, itemSrNo) => {
    const rawBase = getBaseUrl();
    const cleanBase = rawBase ? rawBase.replace(/\/api\/?$/, '') : '';
    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    let result = {};

    // 1. Direct Railpad Summary API
    if (requestId) {
      try {
        const railUrl = `${cleanBase}/api/rail-inspection-call/summary/${encodeURIComponent(requestId)}`;
        const resp = await fetch(railUrl, { method: 'GET', headers });
        if (resp.ok) {
          const json = await resp.json();
          const data = json.responseData ?? json.data ?? json;
          if (data) {
            result = { ...result, ...data };
          }
        }
      } catch (e) {
        console.warn('Could not fetch rail summary:', e);
      }
    }

    // 2. Direct PO Item Details Endpoint (queries po_item and po_header by call / poNo / itemSrNo)
    try {
      const params = new URLSearchParams();
      if (requestId) params.append('callNo', requestId);
      if (poNo) params.append('poNo', poNo);
      if (itemSrNo) params.append('itemSrNo', itemSrNo);

      const resp = await fetch(`${cleanBase}/api/call/po-item-details?${params.toString()}`, { method: 'GET', headers });
      if (resp.ok) {
        const json = await resp.json();
        const data = json.responseData ?? json.data ?? json;
        if (data) {
          result = { ...result, ...data };
        }
      }
    } catch (e) {
      console.warn('Could not fetch from /api/call/po-item-details:', e);
    }

    return Object.keys(result).length > 0 ? result : null;
  };

  // Initialize & Auto-fetch PO Details, Date, Category, Rate & Material Value
  useEffect(() => {
    let isMounted = true;

    const loadCallAndPoDetails = async () => {
      if (!call) return;

      const callNumber = call.call_no || call.callNumber || call.requestId || call.icNumber || call.callNo;
      const rawPo = call.po_no || call.poNumber || call.poNo || '';
      const rawSr = call.po_sr || call.poSerialNo || call.itemSrNo || call.poSrNo || '';
      
      // 1. Initial values from call object
      let q = call.po_qty || call.poQty || call.qty || call.poSrQty || call.po_sr_qty || call.poItem?.qty || '';
      let v = call.po_value || call.poValue || call.poSrValue || call.po_sr_value || call.poItem?.value || call.poItem?.basicValue || '';
      let r = call.rate || call.poRate || call.poItem?.rate || '';
      let offQ = call.totalOfferedQty || call.total_offered_qty || call.totalQty || call.total_qty || 
                 call.offered_quantity || call.offeredQuantity || call.lot_size || call.lotSize || 
                 call.totalDeclaredQuantity || call.total_offered || call.totalOffered || 
                 call.call_qty || call.callQty || call.quantity || call.offeredQty || '';
      let pDate = call.po_date || call.poDate || call.poHeader?.poDate || call.poDetails?.poDate || call.podate || '';

      // 2. Fetch enriched details from backend to ensure PO Sr No QTY, VALUE, and Offered QTY are auto-fetched
      if (callNumber || rawPo) {
        setIsFetchingPoDetails(true);
        try {
          const details = await fetchPoDetailsForCall(callNumber, rawPo, rawSr);
          if (details && isMounted) {
            if (details.poSrQty || details.poQty || details.poQuantity) {
              q = String(details.poSrQty || details.poQty || details.poQuantity);
            }
            if (details.poSrValue || details.poValue || details.poItemValue) {
              v = String(details.poSrValue || details.poValue || details.poItemValue);
            }
            if (details.rate || details.poItemRate) {
              r = String(details.rate || details.poItemRate);
            }
            if (details.totalOfferedQty !== undefined && details.totalOfferedQty !== null && details.totalOfferedQty !== '') {
              offQ = String(details.totalOfferedQty);
            } else if (details.offeredQty !== undefined && details.offeredQty !== null && details.offeredQty !== '') {
              offQ = String(details.offeredQty);
            } else if (details.totalQty !== undefined && details.totalQty !== null && details.totalQty !== '') {
              offQ = String(details.totalQty);
            } else if (details.callQty || details.totalOffered) {
              const numericCallQty = String(details.callQty || details.totalOffered).replace(/[^0-9.]/g, '');
              if (numericCallQty) offQ = numericCallQty;
            }
            if (details.poDate) {
              pDate = details.poDate;
            }
          }
        } catch (err) {
          console.warn('Auto-fetch PO details notice:', err);
        } finally {
          if (isMounted) setIsFetchingPoDetails(false);
        }
      }

      if (!isMounted) return;

      // Update states
      if (q) setPoQty(String(q));
      if (v) setPoValue(String(v));
      if (offQ) setOfferedQty(String(offQ));
      if (pDate) setPoDate(String(pDate).split('T')[0]);

      // Calculate Derived Rate
      let derivedRateVal = '';
      if (r && parseFloat(r) > 0) {
        derivedRateVal = parseFloat(r).toFixed(2);
      } else if (q && v && parseFloat(q) > 0) {
        derivedRateVal = (parseFloat(v) / parseFloat(q)).toFixed(2);
      }
      setDerivedRate(derivedRateVal);

      // Calculate Material Value
      if (derivedRateVal && offQ && parseFloat(offQ) > 0) {
        setMaterialValue((parseFloat(derivedRateVal) * parseFloat(offQ)).toFixed(2));
      } else {
        const directMatVal = call.material_value || call.materialValue || call.offered_material_value || call.offeredMaterialValue || 
                             call.offeredValue || call.value || call.total_value || call.totalValue || call.po_amount || call.poAmount;
        if (directMatVal !== undefined && directMatVal !== null && directMatVal !== '') {
          const numericVal = String(directMatVal).replace(/[^0-9.]/g, '');
          if (numericVal) setMaterialValue(numericVal);
        }
      }

      // Detect PO Category
      const isNonRailway = call.isNonRailway || call.orderType === 'NON_RAILWAY' || (call.rly_cd && String(call.rly_cd).toUpperCase().includes('NON'));
      const isLoa = call.isLoa || call.orderType === 'LOA' || (call.po_no && String(call.po_no).toUpperCase().startsWith('LOA'));
      let cat = 'B';
      if (isNonRailway) {
        cat = 'C';
      } else if (isLoa) {
        cat = 'A';
      } else if (pDate) {
        const cutoff = new Date('2022-11-25');
        let parsedDate = new Date(pDate);
        if (isNaN(parsedDate.getTime()) && pDate.includes('/')) {
          const parts = pDate.split('/');
          if (parts.length === 3) {
            parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        }
        if (!isNaN(parsedDate.getTime()) && parsedDate < cutoff) {
          cat = 'A';
        } else {
          cat = 'B';
        }
      }
      setPoCategory(cat);
    };

    loadCallAndPoDetails();

    return () => {
      isMounted = false;
    };
  }, [call]);

  // Recalculate Material Value when Rate or Offered Qty changes
  const handleRateOrQtyChange = (newQty, newPoVal, newOffQ) => {
    if (newQty && newPoVal && parseFloat(newQty) > 0) {
      const r = parseFloat(newPoVal) / parseFloat(newQty);
      setDerivedRate(r.toFixed(2));
      if (newOffQ && parseFloat(newOffQ) > 0) {
        setMaterialValue((r * parseFloat(newOffQ)).toFixed(2));
      }
    }
  };

  // SRS 8.3 & Section 7-12 Calculations Logic
  const matValueNum = useMemo(() => parseFloat(materialValue) || 0, [materialValue]);
  const pctNum      = useMemo(() => parseFloat(percentage) || 0, [percentage]);

  // Base Inspection Fee = Material Value * Percentage (0.90%)
  const baseInspectionFee = useMemo(() => {
    return (matValueNum * pctNum) / 100;
  }, [matValueNum, pctNum]);

  // Calculated Charges & Max Cap based on PO Category (A, B, C) and Visit Status
  const { calculatedCharges, maxCapDisplay, capNum, finalCancellationCharges, formulaSummary } = useMemo(() => {
    if (cancellationBasis !== 'CHARGEABLE') {
      return { 
        calculatedCharges: 0, 
        maxCapDisplay: '₹0 (Non-Chargeable)', 
        capNum: 0,
        finalCancellationCharges: 0,
        formulaSummary: 'Non-Chargeable Basis: ₹0 (No liability)'
      };
    }

    if (poCategory === 'C') {
      // Category C: Non-Railway Orders
      const charge = visitStatus === 'BEFORE_VISIT' ? 2500 : 10000;
      return {
        calculatedCharges: charge,
        maxCapDisplay: 'Flat Rate',
        capNum: charge,
        finalCancellationCharges: charge,
        formulaSummary: visitStatus === 'BEFORE_VISIT' 
          ? 'Category C: Flat ₹2,500 per case'
          : 'Category C: Flat ₹10,000 per case'
      };
    } else if (poCategory === 'B') {
      // Category B: Railway PO >= 25.11.2022 (TPI Tender)
      if (visitStatus === 'BEFORE_VISIT') {
        return {
          calculatedCharges: 0,
          maxCapDisplay: 'NIL (₹0)',
          capNum: 0,
          finalCancellationCharges: 0,
          formulaSummary: 'Category B (Before Visit): NIL (₹0 as per TPI Tender)'
        };
      } else {
        // After Visit: 50% of inspection charges @ 0.90%, max ₹11,000
        const calc = Math.round(baseInspectionFee * 0.50);
        const finalCharge = Math.min(calc, 11000);
        return {
          calculatedCharges: calc,
          maxCapDisplay: '₹11,000',
          capNum: 11000,
          finalCancellationCharges: finalCharge,
          formulaSummary: `Category B (After Visit): MIN(50% of ₹${Math.round(baseInspectionFee).toLocaleString('en-IN')}, ₹11,000) = ₹${finalCharge.toLocaleString('en-IN')}`
        };
      }
    } else {
      // Category A: Railway PO < 25.11.2022 / LOA
      if (visitStatus === 'BEFORE_VISIT') {
        // 50% of inspection charges calculated @ 0.90%, max ₹11,000
        const calc = Math.round(baseInspectionFee * 0.50);
        const finalCharge = Math.min(calc, 11000);
        return {
          calculatedCharges: calc,
          maxCapDisplay: '₹11,000',
          capNum: 11000,
          finalCancellationCharges: finalCharge,
          formulaSummary: `Category A (Before Visit): MIN(50% of ₹${Math.round(baseInspectionFee).toLocaleString('en-IN')}, ₹11,000) = ₹${finalCharge.toLocaleString('en-IN')}`
        };
      } else {
        // After Visit: Twice the charge applicable for cancellation before IE visit
        const beforeCalc = Math.round(baseInspectionFee * 0.50);
        const beforeFinal = Math.min(beforeCalc, 11000);
        const afterFinal = Math.min(beforeFinal * 2, 22000);
        return {
          calculatedCharges: beforeCalc * 2,
          maxCapDisplay: '₹22,000 (2 × Before Visit)',
          capNum: 22000,
          finalCancellationCharges: afterFinal,
          formulaSummary: `Category A (After Visit): 2 × (Before Visit ₹${beforeFinal.toLocaleString('en-IN')}) = ₹${afterFinal.toLocaleString('en-IN')}`
        };
      }
    }
  }, [cancellationBasis, poCategory, visitStatus, baseInspectionFee]);

  if (!isOpen || !call) return null;

  // Toggle multi-select reasons
  const handleReasonToggle = (reason) => {
    setSelectedReasons((prev) => {
      const exists = prev.includes(reason);
      const updated = exists ? prev.filter((r) => r !== reason) : [...prev, reason];
      return updated;
    });
    setFormErrors((prev) => ({ ...prev, reasons: null }));
  };

  // Download prescribed Cancellation Format Template
  const handleDownloadTemplate = async () => {
    try {
      await generateCancellationBlankFormatPDF(call);
      notify('Call Cancellation blank formats downloaded successfully', 'info');
    } catch (err) {
      console.error('Error generating cancellation format PDF:', err);
      notify('Failed to generate cancellation format PDF', 'error');
    }
  };

  // Handle File Change with 2MB limit validation
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) {
      setFile(null);
      return;
    }

    if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      setFormErrors((prev) => ({ ...prev, file: 'Only PDF format (.pdf) is supported.' }));
      setFile(null);
      e.target.value = '';
      return;
    }

    const maxSizeBytes = 2 * 1024 * 1024; // 2 MB
    if (selected.size > maxSizeBytes) {
      const sizeMB = (selected.size / (1024 * 1024)).toFixed(2);
      setFormErrors((prev) => ({
        ...prev,
        file: `File size exceeds 2 MB limit (Selected: ${sizeMB} MB). Please select a file smaller than 2 MB.`
      }));
      setFile(null);
      e.target.value = '';
      return;
    }

    setFile(selected);
    setFormErrors((prev) => ({ ...prev, file: null }));
  };

  // Validation Check
  const validateForm = () => {
    const errors = {};
    if (!cancellationBasis) {
      errors.cancellationBasis = 'Please select cancellation basis';
    }
    if (cancellationBasis === 'CHARGEABLE' && !visitStatus) {
      errors.visitStatus = 'Please select visit status';
    }
    if (selectedReasons.length === 0) {
      errors.reasons = 'Please select at least one reason for cancellation';
    }
    // Mandatory Cancellation Document Check
    if (!file) {
      errors.file = 'Cancellation document (PDF format, max 2 MB) is mandatory. Please upload the official signed document.';
    } else if (file.size > 2 * 1024 * 1024) {
      errors.file = `File size exceeds 2 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please upload a file smaller than 2 MB.`;
    }

    // Additional Requirement: If "Others (Specify)" is selected: description mandatory & min 20 chars
    if (selectedReasons.includes('Others (Specify)')) {
      if (!description.trim()) {
        errors.description = 'Cancellation description is required when "Others (Specify)" is selected';
      } else if (description.trim().length < 20) {
        errors.description = `Cancellation description must be at least 20 characters (current: ${description.trim().length} chars)`;
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const currentUser = getStoredUser();
      const userId = currentUser?.userId || 0;
      const safeCallNo = (call.call_no || call.callNumber || call.requestId || '').replace(/[/\\?%*:|"<>]/g, '_');
      const docFileName = `Cancellation_${safeCallNo}_${Date.now()}.pdf`;

      // Read file to Base64 and upload to compressed blob storage
      let uploadedDocName = file ? file.name : null;
      if (file) {
        try {
          const fileBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
          });

          const uploadResp = await fetch(`${getBaseUrl()}/certificate/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              icNumber: call.call_no || call.callNumber || call.requestId,
              signedData: fileBase64,
              fileName: docFileName,
              uploadedBy: currentUser?.fullName || `IE (${currentUser?.employeeCode || userId})`
            })
          });

          if (uploadResp.ok) {
            uploadedDocName = docFileName;
          }
        } catch (uploadErr) {
          console.warn('Document storage upload notice:', uploadErr);
        }
      }

      const finalRemarks = `[${cancellationBasis}] ${visitStatus ? '(' + visitStatus + ') ' : ''}Reasons: ${selectedReasons.join(', ')}${description.trim() ? ' - Desc: ' + description.trim() : ''}${cancellationBasis === 'CHARGEABLE' ? ` | Final Cancellation Charges: ₹${finalCancellationCharges.toLocaleString('en-IN')}` : ''}`;

      const workflowActionData = {
        workflowTransitionId: call.workflowTransitionId || call.id,
        requestId: call.call_no || call.callNumber || call.requestId,
        action: 'VERIFY_MATERIAL_AVAILABILITY',
        remarks: finalRemarks,
        actionBy: Number(userId),
        pincode: call.pincode || call.pinCode || call.pincode_no || '',
        vendorCode: call.vendor_code || call.vendorCode || call.vendor_name || call.vendorName || '',
        materialAvailable: 'NO',
        cancellationBasis,
        visitStatus: cancellationBasis === 'CHARGEABLE' ? visitStatus : null,
        cancellationReasons: selectedReasons,
        cancellationDescription: description.trim(),
        materialValue: matValueNum,
        cancellationPercentage: pctNum,
        calculatedCharges,
        maximumCap: capNum,
        finalCancellationCharges,
        documentName: uploadedDocName || (file ? file.name : null)
      };

      await performTransitionAction(workflowActionData);

      const msg = cancellationBasis === 'CHARGEABLE'
        ? `✓ Call ${call.call_no || call.callNumber || call.requestId} cancelled successfully. Financial liability of ₹${finalCancellationCharges.toLocaleString('en-IN')} logged against vendor.`
        : `✓ Call ${call.call_no || call.callNumber || call.requestId} cancelled on non-chargeable basis.`;

      notify(msg, 'success');
      if (onSuccess) onSuccess(workflowActionData);
      onClose();
    } catch (err) {
      console.error('Call cancellation failed:', err);
      notify(err.message || 'Failed to complete call cancellation', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOthersSelected = selectedReasons.includes('Others (Specify)');

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
      }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '92vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          borderBottom: '1px solid #fecaca',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <span style={{
              background: '#ef4444', color: '#fff',
              fontSize: '11px', fontWeight: '800',
              padding: '3px 10px', borderRadius: '12px',
              textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              Call Cancellation Window
            </span>
            <h2 style={{ margin: '6px 0 0', fontSize: '18px', fontWeight: '800', color: '#991b1b' }}>
              Cancel Call — {call.call_no || call.callNumber || call.requestId}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: '#ffffff', border: '1px solid #fecaca', borderRadius: '50%',
              width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#991b1b', fontSize: '18px', fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Call Summary & PO Category Banner */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>Vendor Name</span>
              <strong style={{ color: '#1e293b' }}>{call.vendor_name || call.vendorName || call.vendorCode || 'N/A'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>PO Number</span>
              <strong style={{ color: '#1e293b' }}>{call.po_no || call.poNumber || call.poNo || 'N/A'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>PO Date</span>
              <span style={{ color: '#0f172a', fontWeight: '600' }}>{poDate || 'Not Available'}</span>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>PO Category</span>
              <select
                value={poCategory}
                onChange={(e) => setPoCategory(e.target.value)}
                style={{
                  padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                  border: '1px solid #94a3b8', background: poCategory === 'B' ? '#eff6ff' : (poCategory === 'A' ? '#fef3c7' : '#f3e8ff'),
                  color: poCategory === 'B' ? '#1d4ed8' : (poCategory === 'A' ? '#b45309' : '#7e22ce')
                }}
              >
                <option value="B">Category B (Railway PO ≥ 25.11.2022 / TPI)</option>
                <option value="A">Category A (Railway PO &lt; 25.11.2022 / LOA)</option>
                <option value="C">Category C (Non-Railway Orders)</option>
              </select>
            </div>
          </div>

          {/* PO Sr. No. & Material Value Derivation Card (SRS Step 1 & 2) */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📊 Rate & Material Value Derivation (SRS Step 1 & 2)
                {isFetchingPoDetails && <span style={{ fontSize: '11px', color: '#0369a1', fontWeight: '500' }}>⏳ Loading PO data...</span>}
              </span>
              <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '600' }}>
                Rate = PO Value ÷ PO Qty
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#166534', textTransform: 'uppercase', display: 'block' }}>PO Sr. No. QTY</label>
                <input
                  type="number"
                  placeholder="PO Qty"
                  value={poQty}
                  onChange={(e) => {
                    setPoQty(e.target.value);
                    handleRateOrQtyChange(e.target.value, poValue, offeredQty);
                  }}
                  style={{ width: '100%', padding: '4px 8px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '12px', fontWeight: '600' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#166534', textTransform: 'uppercase', display: 'block' }}>PO Sr. No. VALUE (₹)</label>
                <input
                  type="number"
                  placeholder="PO Value"
                  value={poValue}
                  onChange={(e) => {
                    setPoValue(e.target.value);
                    handleRateOrQtyChange(poQty, e.target.value, offeredQty);
                  }}
                  style={{ width: '100%', padding: '4px 8px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '12px', fontWeight: '600' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#166534', textTransform: 'uppercase', display: 'block' }}>Derived Rate (₹)</label>
                <div style={{ padding: '5px 8px', background: '#dcfce7', borderRadius: '6px', border: '1px solid #86efac', fontSize: '12px', fontWeight: '800', color: '#14532d' }}>
                  {derivedRate ? `₹${derivedRate}` : '₹0.00'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#166534', textTransform: 'uppercase', display: 'block' }}>Offered Qty</label>
                <input
                  type="number"
                  placeholder="Offered Qty"
                  value={offeredQty}
                  onChange={(e) => {
                    setOfferedQty(e.target.value);
                    handleRateOrQtyChange(poQty, poValue, e.target.value);
                  }}
                  style={{ width: '100%', padding: '4px 8px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '12px', fontWeight: '600' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#166534', textTransform: 'uppercase', display: 'block' }}>Offered Value (₹)</label>
                <div style={{ padding: '5px 8px', background: '#dcfce7', borderRadius: '6px', border: '1px solid #86efac', fontSize: '12px', fontWeight: '800', color: '#14532d' }}>
                  ₹{matValueNum.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Cancellation Basis */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '10px' }}>
              3. Cancellation Basis <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div 
                onClick={() => setCancellationBasis('CHARGEABLE')}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: cancellationBasis === 'CHARGEABLE' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: cancellationBasis === 'CHARGEABLE' ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  boxShadow: cancellationBasis === 'CHARGEABLE' ? '0 4px 12px rgba(37, 99, 235, 0.12)' : 'none'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: cancellationBasis === 'CHARGEABLE' ? '6px solid #2563eb' : '2px solid #94a3b8',
                  background: '#ffffff',
                  flexShrink: 0
                }}></div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: cancellationBasis === 'CHARGEABLE' ? '#1e40af' : '#1e293b' }}>
                    Chargeable Basis
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Charges logged against vendor
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setCancellationBasis('NON_CHARGEABLE')}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: cancellationBasis === 'NON_CHARGEABLE' ? '2px solid #059669' : '1px solid #cbd5e1',
                  background: cancellationBasis === 'NON_CHARGEABLE' ? '#f0fdf4' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  boxShadow: cancellationBasis === 'NON_CHARGEABLE' ? '0 4px 12px rgba(5, 150, 105, 0.12)' : 'none'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: cancellationBasis === 'NON_CHARGEABLE' ? '6px solid #059669' : '2px solid #94a3b8',
                  background: '#ffffff',
                  flexShrink: 0
                }}></div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: cancellationBasis === 'NON_CHARGEABLE' ? '#065f46' : '#1e293b' }}>
                    Non-Chargeable Basis
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    No financial liability for vendor
                  </div>
                </div>
              </div>
            </div>
            {formErrors.cancellationBasis && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{formErrors.cancellationBasis}</span>}
          </div>

          {/* Section 4: Visit Status (Conditional) */}
          {cancellationBasis === 'CHARGEABLE' && (
            <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '14px', padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: '800', color: '#854d0e', margin: 0 }}>
                  4. Visit Status <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#a16207', background: '#fef9c3', padding: '2px 8px', borderRadius: '6px' }}>
                  Auto-caps cancellation fee
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div 
                  onClick={() => setVisitStatus('BEFORE_VISIT')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: visitStatus === 'BEFORE_VISIT' ? '2px solid #ca8a04' : '1px solid #e2e8f0',
                    background: visitStatus === 'BEFORE_VISIT' ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                    boxShadow: visitStatus === 'BEFORE_VISIT' ? '0 4px 10px rgba(202, 138, 4, 0.15)' : 'none'
                  }}
                >
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: visitStatus === 'BEFORE_VISIT' ? '5px solid #ca8a04' : '2px solid #94a3b8',
                    background: '#ffffff',
                    flexShrink: 0
                  }}></div>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#713f12' }}>
                      Before Visit
                    </div>
                    <div style={{ fontSize: '11px', color: '#a16207', fontWeight: '600' }}>
                      Max Cap: ₹11,000
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => setVisitStatus('AFTER_VISIT')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: visitStatus === 'AFTER_VISIT' ? '2px solid #ca8a04' : '1px solid #e2e8f0',
                    background: visitStatus === 'AFTER_VISIT' ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                    boxShadow: visitStatus === 'AFTER_VISIT' ? '0 4px 10px rgba(202, 138, 4, 0.15)' : 'none'
                  }}
                >
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: visitStatus === 'AFTER_VISIT' ? '5px solid #ca8a04' : '2px solid #94a3b8',
                    background: '#ffffff',
                    flexShrink: 0
                  }}></div>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#713f12' }}>
                      After Visit
                    </div>
                    <div style={{ fontSize: '11px', color: '#a16207', fontWeight: '600' }}>
                      Max Cap: ₹22,000
                    </div>
                  </div>
                </div>
              </div>
              {formErrors.visitStatus && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', display: 'block' }}>{formErrors.visitStatus}</span>}
            </div>
          )}

          {/* Section 5: Reason for Cancellation (Multi-Select) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                5. Reason for Cancellation (Multi-Select) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <span style={{ fontSize: '11px', color: '#64748b' }}>{selectedReasons.length} selected</span>
            </div>

            <div style={{
              maxHeight: '180px', overflowY: 'auto', border: formErrors.reasons ? '2px solid #ef4444' : '1px solid #cbd5e1',
              borderRadius: '12px', padding: '10px 14px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '8px'
            }}>
              {CANCELLATION_REASONS.map((reason, idx) => {
                const isSelected = selectedReasons.includes(reason);
                return (
                  <label key={idx} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer',
                    fontSize: '13px', color: isSelected ? '#1e293b' : '#475569', fontWeight: isSelected ? '700' : '500',
                    padding: '6px 8px', borderRadius: '8px', background: isSelected ? '#eff6ff' : 'transparent',
                    border: isSelected ? '1px solid #bfdbfe' : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleReasonToggle(reason)}
                      style={{ marginTop: '2px', accentColor: '#2563eb' }}
                    />
                    <span>{reason}</span>
                  </label>
                );
              })}
            </div>
            {formErrors.reasons && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{formErrors.reasons}</span>}
          </div>

          {/* Section 6: Cancellation Description */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                Cancellation Description {isOthersSelected && <span style={{ color: '#ef4444' }}>* (Min 20 characters)</span>}
              </label>
              <span style={{ fontSize: '11px', color: isOthersSelected && description.trim().length < 20 ? '#ef4444' : '#64748b' }}>
                {description.trim().length} chars
              </span>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (formErrors.description) setFormErrors((prev) => ({ ...prev, description: null }));
              }}
              placeholder={isOthersSelected ? 'Enter detailed description (minimum 20 characters required)…' : 'Enter cancellation description (optional)…'}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px',
                border: formErrors.description ? '2px solid #ef4444' : '1px solid #cbd5e1',
                fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box'
              }}
            />
            {formErrors.description && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{formErrors.description}</span>}
          </div>

          {/* Section 7: Cancellation Document Upload & Download Template */}
          <div style={{
            background: formErrors.file ? '#fef2f2' : '#f0f9ff',
            border: formErrors.file ? '1.5px solid #f87171' : '1px solid #bae6fd',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: formErrors.file ? '#b91c1c' : '#0369a1', display: 'block' }}>
                  7. Cancellation Document (PDF Format) <span style={{ color: '#ef4444' }}>* (Mandatory, Max 2 MB)</span>
                </label>
                <span style={{ fontSize: '11px', color: formErrors.file ? '#dc2626' : '#0284c7' }}>
                  Upload official signed cancellation request or document (PDF only, max size 2 MB)
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                style={{
                  background: '#ffffff',
                  border: '1px solid #0284c7',
                  color: '#0284c7',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                📥 Download Blank Format
              </button>
            </div>

            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              style={{ fontSize: '13px', color: '#334155' }}
            />

            {file && (
              <div style={{
                fontSize: '12px',
                color: '#0284c7',
                fontWeight: '700',
                background: '#e0f2fe',
                padding: '6px 12px',
                borderRadius: '6px',
                display: 'inline-block'
              }}>
                ✓ Selected File: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}

            {formErrors.file && (
              <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: '600', display: 'block' }}>
                ⚠️ {formErrors.file}
              </span>
            )}
          </div>

          {/* Section 8: Cancellation Charges Calculation (Chargeable Only) */}
          {cancellationBasis === 'CHARGEABLE' && (
            <div style={{ background: '#faf5ff', border: '1.5px solid #d8b4fe', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  💳 8. Cancellation Charges Calculation (SRS Step 3)
                </h4>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#7e22ce', background: '#f3e8ff', padding: '2px 8px', borderRadius: '6px' }}>
                  PO Category: {poCategory}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#7e22ce', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Material Value (₹) [Editable]
                  </label>
                  <input
                    type="number"
                    value={materialValue}
                    onChange={(e) => setMaterialValue(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #c084fc', fontSize: '13px', fontWeight: '700', color: '#4c1d95', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#7e22ce', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Inspection % [Default 0.90%]
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #c084fc', fontSize: '13px', fontWeight: '700', color: '#4c1d95', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#7e22ce', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Base Inspection Fee (₹)
                  </label>
                  <div style={{ padding: '8px 12px', background: '#f3e8ff', borderRadius: '8px', border: '1px solid #d8b4fe', fontSize: '13px', fontWeight: '800', color: '#581c87' }}>
                    ₹{Math.round(baseInspectionFee).toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#7e22ce', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Maximum Cap / Rule
                  </label>
                  <div style={{ padding: '8px 12px', background: '#f3e8ff', borderRadius: '8px', border: '1px solid #d8b4fe', fontSize: '13px', fontWeight: '800', color: '#581c87' }}>
                    {maxCapDisplay}
                  </div>
                </div>
              </div>

              {/* Final Cancellation Charges Summary Box */}
              <div style={{
                background: 'linear-gradient(135deg, #6b21a8 0%, #581c87 100%)',
                color: '#ffffff', borderRadius: '12px', padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
              }}>
                <div>
                  <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', opacity: 0.9 }}>
                    Final Cancellation Charges
                  </span>
                  <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px' }}>
                    {formulaSummary}
                  </div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.02em' }}>
                  ₹{finalCancellationCharges.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '12px 24px', borderRadius: '10px',
                border: '1px solid #cbd5e1', background: '#ffffff',
                color: '#475569', fontWeight: '700', fontSize: '14px', cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '12px 28px', borderRadius: '10px',
                border: 'none', background: '#ef4444',
                color: '#ffffff', fontWeight: '800', fontSize: '14px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}
            >
              {isSubmitting ? 'Submitting…' : 'Confirm & Submit Cancellation'}
            </button>
          </div>

        </form>
      </div>

      {toast && (
        <Notification 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default CallCancellationModal;
