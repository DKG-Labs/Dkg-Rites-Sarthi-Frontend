import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { getStoredUser } from '../services/authService';

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
  const [cancellationBasis, setCancellationBasis] = useState('CHARGEABLE'); // 'CHARGEABLE' | 'NON_CHARGEABLE'
  const [visitStatus, setVisitStatus] = useState('BEFORE_VISIT'); // 'BEFORE_VISIT' | 'AFTER_VISIT'
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [description, setDescription] = useState('');
  const [poQty, setPoQty] = useState('');
  const [poValue, setPoValue] = useState('');
  const [offeredQty, setOfferedQty] = useState('');
  const [derivedRate, setDerivedRate] = useState('');
  const [materialValue, setMaterialValue] = useState('');
  const [percentage, setPercentage] = useState('0.90');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!call) return;
    const q = call.poSrQty || call.poQty || call.qty || '';
    const v = call.poSrValue || call.poValue || '';
    const offQ = call.totalOfferedQty || call.totalQty || call.qtyOffered || call.callQty || '';
    
    if (q) setPoQty(String(q));
    if (v) setPoValue(String(v));
    if (offQ) setOfferedQty(String(offQ));

    let rate = '';
    if (q && v && parseFloat(q) > 0) {
      rate = (parseFloat(v) / parseFloat(q)).toFixed(2);
      setDerivedRate(rate);
    }
    if (rate && offQ && parseFloat(offQ) > 0) {
      setMaterialValue((parseFloat(rate) * parseFloat(offQ)).toFixed(2));
    }
  }, [call]);

  // Max Cap based on visit status
  const maximumCap = useMemo(() => {
    if (cancellationBasis === 'NON_CHARGEABLE') return 0;
    return visitStatus === 'BEFORE_VISIT' ? 10000 : 20000;
  }, [cancellationBasis, visitStatus]);

  // Calculated cancellation charges
  const calculatedCharges = useMemo(() => {
    if (cancellationBasis === 'NON_CHARGEABLE') return 0;
    const matVal = parseFloat(materialValue) || 0;
    const pct = parseFloat(percentage) || 0;
    return (matVal * pct) / 100;
  }, [cancellationBasis, materialValue, percentage]);

  // Final Cancellation Charges
  const finalCancellationCharges = useMemo(() => {
    if (cancellationBasis === 'NON_CHARGEABLE') return 0;
    return Math.min(calculatedCharges, maximumCap);
  }, [cancellationBasis, calculatedCharges, maximumCap]);

  if (!isOpen || !call) return null;

  const handleReasonToggle = (reason) => {
    if (selectedReasons.includes(reason)) {
      setSelectedReasons(selectedReasons.filter(r => r !== reason));
    } else {
      setSelectedReasons([...selectedReasons, reason]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedReasons.length === 0) {
      setFormErrors({ reasons: 'Please select at least one reason for cancellation' });
      return;
    }

    setIsSubmitting(true);
    try {
      const user = getStoredUser();
      const payload = {
        workflowTransitionId: call.workflowTransitionId || call.id,
        requestId: call.requestId || call.callNo,
        moduleId: call.moduleId || 0,
        action: 'CANCEL',
        remarks: description || selectedReasons.join(', '),
        actionBy: Number(user?.userId || 0),
        cancellationBasis,
        visitStatus,
        reasons: selectedReasons.join('; '),
        cancellationDescription: description,
        materialValue: parseFloat(materialValue) || 0,
        percentage: parseFloat(percentage) || 0,
        calculatedCharges,
        maximumCap,
        finalCancellationCharges
      };

      const res = await apiService.performTransitionAction(payload);
      if (res && (res.responseStatus?.statusCode === 0 || res.responseStatus?.statusCode === 1)) {
        if (showNotification) showNotification('Call cancelled successfully', 'success');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert(res?.responseStatus?.message || 'Failed to cancel call');
      }
    } catch (err) {
      console.error('Error cancelling call:', err);
      alert('Error cancelling call: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '750px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Cancel Inspection Call: {call.requestId || call.callNo}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              Vendor: {call.vendorName || call.vendorCode || '-'} | Plant: {call.plantId || '-'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px'
            }}
          >
            ×
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Cancellation Basis */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px' }}>
              Cancellation Basis *
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#1e293b' }}>
                <input
                  type="radio"
                  name="cancellationBasis"
                  value="CHARGEABLE"
                  checked={cancellationBasis === 'CHARGEABLE'}
                  onChange={() => setCancellationBasis('CHARGEABLE')}
                />
                Chargeable (Vendor Fault)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#1e293b' }}>
                <input
                  type="radio"
                  name="cancellationBasis"
                  value="NON_CHARGEABLE"
                  checked={cancellationBasis === 'NON_CHARGEABLE'}
                  onChange={() => setCancellationBasis('NON_CHARGEABLE')}
                />
                Non-Chargeable (Administrative / Other)
              </label>
            </div>
          </div>

          {/* Visit Status (Only if Chargeable) */}
          {cancellationBasis === 'CHARGEABLE' && (
            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px' }}>
                Visit Status *
              </label>
              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#1e293b' }}>
                  <input
                    type="radio"
                    name="visitStatus"
                    value="BEFORE_VISIT"
                    checked={visitStatus === 'BEFORE_VISIT'}
                    onChange={() => setVisitStatus('BEFORE_VISIT')}
                  />
                  Before Visit (Max ₹10,000 Cap)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#1e293b' }}>
                  <input
                    type="radio"
                    name="visitStatus"
                    value="AFTER_VISIT"
                    checked={visitStatus === 'AFTER_VISIT'}
                    onChange={() => setVisitStatus('AFTER_VISIT')}
                  />
                  After Visit (Max ₹20,000 Cap)
                </label>
              </div>
            </div>
          )}

          {/* Reasons */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px' }}>
              Select Reasons for Cancellation *
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '8px',
              maxHeight: '180px',
              overflowY: 'auto',
              padding: '12px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              background: '#f8fafc'
            }}>
              {CANCELLATION_REASONS.map(reason => (
                <label key={reason} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedReasons.includes(reason)}
                    onChange={() => handleReasonToggle(reason)}
                    style={{ marginTop: '2px' }}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
            {formErrors.reasons && (
              <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{formErrors.reasons}</div>
            )}
          </div>

          {/* Chargeable Breakdown Card */}
          {cancellationBasis === 'CHARGEABLE' && (
            <div style={{
              background: 'linear-gradient(135deg, #fff1f2 0%, #fff7ed 100%)',
              borderRadius: '12px',
              border: '1px solid #fecdd3',
              padding: '16px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#9a3412', display: 'block' }}>Material Value</label>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                    ₹{Number(materialValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#9a3412', display: 'block' }}>Rate (%)</label>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{percentage}%</div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#9a3412', display: 'block' }}>Calculated Charges</label>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                    ₹{Number(calculatedCharges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#9a3412', display: 'block' }}>Maximum Cap</label>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                    ₹{Number(maximumCap || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div style={{
                background: '#e11d48',
                color: '#ffffff',
                padding: '10px 16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Final Cancellation Charges:</span>
                <span style={{ fontSize: '18px', fontWeight: '900' }}>
                  ₹{Number(finalCancellationCharges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* Description / Remarks */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
              Detailed Description / Remarks
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter remarks or details..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                minHeight: '70px',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 24px',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? 'Cancelling Call...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CallCancellationModal;
