import React, { useState, useEffect, useMemo } from 'react';
import { performTransitionAction } from '../services/workflowService';
import { getStoredUser } from '../services/authService';
import { fetchCallLetterDetails } from '../call-desk-module/src/services/callLetterApi';
import { message } from 'antd';
import { generateCancellationBlankFormatPDF } from '../utils/cancellationFormatPdf';

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
  // Form State
  const [cancellationBasis, setCancellationBasis] = useState('CHARGEABLE'); // 'CHARGEABLE' | 'NON_CHARGEABLE'
  const [visitStatus, setVisitStatus]             = useState('BEFORE_VISIT'); // 'BEFORE_VISIT' | 'AFTER_VISIT'
  const [selectedReasons, setSelectedReasons]     = useState([]);
  const [description, setDescription]             = useState('');
  const [file, setFile]                           = useState(null);

  // Calculation Fields - Fully Dynamic
  const [materialValue, setMaterialValue] = useState('');
  const [percentage, setPercentage]       = useState('0.9');
  const [maxCap, setMaxCap]               = useState('11000'); // Auto-updated based on Visit Status

  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [formErrors, setFormErrors]       = useState({});

  // Initialize Material Value dynamically from Call/PO object or async backend fetch
  useEffect(() => {
    let isMounted = true;
    if (call) {
      const poVal = call.material_value || call.materialValue || call.po_value || call.poValue || 
                    call.total_value || call.totalValue || call.po_amount || call.poAmount || 
                    call.offeredValue || call.value || call.totalPoValue || 
                    call.poHeader?.poValue || call.poDetails?.poValue;
      if (poVal !== undefined && poVal !== null && poVal !== '') {
        const numericVal = String(poVal).replace(/[^0-9.]/g, '');
        if (numericVal) {
          setMaterialValue(numericVal);
          return;
        }
      }

      // If not present directly on call object, fetch PO details from backend API
      const callNo = call.call_no || call.callNumber;
      if (callNo) {
        fetchCallLetterDetails(callNo).then((details) => {
          if (!isMounted || !details) return;
          const fetchedVal = details.poValue || details.totalPoValue || details.material_value || details.materialValue || details.poHeader?.poValue || details.poItem?.materialValue;
          if (fetchedVal) {
            const numericVal = String(fetchedVal).replace(/[^0-9.]/g, '');
            if (numericVal) setMaterialValue(numericVal);
          }
        }).catch((err) => {
          console.log('PO material value fetch info:', err);
        });
      }
    }
    return () => { isMounted = false; };
  }, [call]);

  // SRS 8.2 Maximum Cap Logic: Auto-populate cap based on Visit Status
  useEffect(() => {
    if (cancellationBasis === 'CHARGEABLE') {
      if (visitStatus === 'BEFORE_VISIT') {
        setMaxCap('11000');
      } else if (visitStatus === 'AFTER_VISIT') {
        setMaxCap('22000');
      }
    }
  }, [visitStatus, cancellationBasis]);

  // SRS 8.3 Calculations Logic
  const matValueNum = useMemo(() => parseFloat(materialValue) || 0, [materialValue]);
  const pctNum      = useMemo(() => parseFloat(percentage) || 0, [percentage]);
  const capNum      = useMemo(() => parseFloat(maxCap) || 0, [maxCap]);

  // Calculated Charges = Material Value × Percentage
  const calculatedCharges = useMemo(() => {
    return Math.round((matValueNum * pctNum) / 100);
  }, [matValueNum, pctNum]);

  // Final Cancellation Charges = MIN(Calculated Charges, Maximum Cap)
  const finalCancellationCharges = useMemo(() => {
    if (cancellationBasis !== 'CHARGEABLE') return 0;
    return Math.min(calculatedCharges, capNum);
  }, [cancellationBasis, calculatedCharges, capNum]);

  const notify = (msg, type = 'success') => {
    if (showNotification) {
      showNotification(msg, type);
    } else {
      if (type === 'error') message.error(msg);
      else if (type === 'info') message.info(msg);
      else message.success(msg);
    }
  };

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

  // Download prescribed Cancellation Format Template (2-page PDF)
  const handleDownloadTemplate = async () => {
    try {
      await generateCancellationBlankFormatPDF(call);
      notify('Call Cancellation blank formats (2-Page PDF) downloaded successfully', 'info');
    } catch (err) {
      console.error('Error generating cancellation format PDF:', err);
      notify('Failed to generate cancellation format PDF', 'error');
    }
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

      const finalRemarks = `[${cancellationBasis}] ${visitStatus ? '(' + visitStatus + ') ' : ''}Reasons: ${selectedReasons.join(', ')}${description.trim() ? ' - Desc: ' + description.trim() : ''}${cancellationBasis === 'CHARGEABLE' ? ` | Final Cancellation Charges: ₹${finalCancellationCharges.toLocaleString('en-IN')}` : ''}`;

      const workflowActionData = {
        workflowTransitionId: call.workflowTransitionId || call.id,
        requestId: call.call_no || call.callNumber,
        action: 'VERIFY_MATERIAL_AVAILABILITY',
        remarks: finalRemarks,
        actionBy: userId,
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
        documentName: file ? file.name : null
      };

      await performTransitionAction(workflowActionData);

      const msg = cancellationBasis === 'CHARGEABLE'
        ? `✓ Call ${call.call_no || call.callNumber} cancelled successfully. Financial liability of ₹${finalCancellationCharges.toLocaleString('en-IN')} logged against vendor.`
        : `✓ Call ${call.call_no || call.callNumber} cancelled on non-chargeable basis.`;

      notify(msg, 'success');
      if (onSuccess) onSuccess(workflowActionData);
      onClose();
      window.location.reload();
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
              Cancel Call — {call.call_no || call.callNumber}
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
          
          {/* Call Summary Banner */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>Vendor Name</span>
              <strong style={{ color: '#1e293b' }}>{call.vendor_name || call.vendorName || 'N/A'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>PO Number</span>
              <strong style={{ color: '#1e293b' }}>{call.po_no || call.poNumber || 'N/A'}</strong>
            </div>
          </div>

          {/* Section 3: Cancellation Basis */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
              3. Cancellation Basis <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={cancellationBasis}
              onChange={(e) => setCancellationBasis(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px',
                border: formErrors.cancellationBasis ? '2px solid #ef4444' : '1px solid #cbd5e1',
                fontSize: '14px', fontWeight: '600', color: '#0f172a', background: '#fff'
              }}
            >
              <option value="CHARGEABLE">Cancellation on Chargeable Basis</option>
              <option value="NON_CHARGEABLE">Cancellation on Non-Chargeable Basis</option>
            </select>
            {formErrors.cancellationBasis && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{formErrors.cancellationBasis}</span>}
          </div>

          {/* Section 4: Visit Status (Conditional) */}
          {cancellationBasis === 'CHARGEABLE' && (
            <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '12px', padding: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#854d0e', marginBottom: '8px' }}>
                4. Visit Status <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={visitStatus}
                onChange={(e) => setVisitStatus(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px',
                  border: formErrors.visitStatus ? '2px solid #ef4444' : '1px solid #ca8a04',
                  fontSize: '14px', fontWeight: '600', color: '#713f12', background: '#fff'
                }}
              >
                <option value="BEFORE_VISIT">Before Visit of IE to Vendor's Premises</option>
                <option value="AFTER_VISIT">After Visit of IE to Vendor's Premises</option>
              </select>
              {formErrors.visitStatus && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{formErrors.visitStatus}</span>}
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
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#0369a1', display: 'block' }}>7. Cancellation Document (PDF Format)</label>
                <span style={{ fontSize: '11px', color: '#0284c7' }}>Upload official signed cancellation request or document</span>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                style={{
                  background: '#ffffff', border: '1px solid #0284c7', color: '#0284c7',
                  borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '700',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                📥 Download Blank Format
              </button>
            </div>

            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0] || null)}
              style={{ fontSize: '13px', color: '#334155' }}
            />
            {file && <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: '600' }}>✓ Selected File: {file.name}</div>}
          </div>

          {/* Section 8: Cancellation Charges Calculation (Chargeable Only) */}
          {cancellationBasis === 'CHARGEABLE' && (
            <div style={{ background: '#faf5ff', border: '1.5px solid #d8b4fe', borderRadius: '16px', padding: '20px' }}>
              <h4 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '800', color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                💳 8. Cancellation Charges Calculation
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#7e22ce', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Material Value (₹) [Editable]
                  </label>
                  <input
                    type="number"
                    value={materialValue}
                    onChange={(e) => setMaterialValue(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #c084fc', fontSize: '14px', fontWeight: '700', color: '#4c1d95', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#7e22ce', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Percentage (%) [Default 0.9%]
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #c084fc', fontSize: '14px', fontWeight: '700', color: '#4c1d95', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#7e22ce', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Calculated Charges (₹) [System]
                  </label>
                  <div style={{ padding: '8px 12px', background: '#f3e8ff', borderRadius: '8px', border: '1px solid #d8b4fe', fontSize: '14px', fontWeight: '800', color: '#581c87' }}>
                    ₹{calculatedCharges.toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#7e22ce', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Maximum Cap (₹) [Auto-populated]
                  </label>
                  <input
                    type="number"
                    value={maxCap}
                    onChange={(e) => setMaxCap(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #c084fc', fontSize: '14px', fontWeight: '700', color: '#4c1d95', boxSizing: 'border-box' }}
                  />
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
                    Final Cancellation Charges = MIN(Calculated, Cap)
                  </span>
                  <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>
                    MIN(₹{calculatedCharges.toLocaleString('en-IN')}, ₹{capNum.toLocaleString('en-IN')})
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
    </div>
  );
};

export default CallCancellationModal;
