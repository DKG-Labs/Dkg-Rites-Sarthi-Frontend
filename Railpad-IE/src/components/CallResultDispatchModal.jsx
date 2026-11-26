import React, { useState, useEffect } from 'react';

/**
 * CallResultDispatchModal (Railpad)
 */
const CallResultDispatchModal = ({
  isOpen,
  onClose,
  onConfirm,
  systemStatus = 'ACCEPTED',
  callNo = '',
  productType = 'Rail Pad Inspection',
  allowPartiallyAccepted = true,
  isSubmitting = false
}) => {
  const rawNormalizedStatus = (systemStatus || 'ACCEPTED').toUpperCase().replace(/\s+/g, '_');
  const canonicalStatus = rawNormalizedStatus === 'PARTIAL' ? 'PARTIALLY_ACCEPTED' : rawNormalizedStatus;
  const normalizedSystemStatus =
    canonicalStatus === 'REJECTED'
      ? 'REJECTED'
      : canonicalStatus === 'PARTIALLY_ACCEPTED' && allowPartiallyAccepted
      ? 'PARTIALLY_ACCEPTED'
      : 'ACCEPTED';
  const displayCallNo = (callNo !== null && callNo !== undefined && String(callNo).trim() !== '') ? String(callNo).trim() : 'N/A';
  
  const [selectedResult, setSelectedResult] = useState('ACCEPTED');
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedResult(normalizedSystemStatus);
      setRemarks('');
      setRemarksError('');
    }
  }, [isOpen, normalizedSystemStatus]);

  if (!isOpen) return null;

  const isAdverseSelection = selectedResult === 'PARTIALLY_ACCEPTED' || selectedResult === 'REJECTED';
  const isMismatch = selectedResult !== normalizedSystemStatus;
  const isSystemAcceptedIeRejected = normalizedSystemStatus === 'ACCEPTED' && selectedResult === 'REJECTED';
  const isSystemAcceptedIePartial = normalizedSystemStatus === 'ACCEPTED' && selectedResult === 'PARTIALLY_ACCEPTED';
  const isSystemRejectedIeAccepted = normalizedSystemStatus === 'REJECTED' && selectedResult === 'ACCEPTED';
  const isRemarksMandatory = isMismatch || selectedResult === 'REJECTED';

  const handleResultChange = (e) => {
    setSelectedResult(e.target.value);
    setRemarksError('');
  };

  const handleConfirm = () => {
    if (isRemarksMandatory && (!remarks || !remarks.trim())) {
      setRemarksError('Remarks / justification are mandatory for this decision.');
      return;
    }
    if (onConfirm) {
      onConfirm({
        callResult: selectedResult,
        remarks: remarks.trim(),
        systemStatus: normalizedSystemStatus
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return { label: 'ACCEPTED', color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0', icon: '✅' };
      case 'PARTIALLY_ACCEPTED':
      case 'PARTIAL':
        return { label: 'PARTIALLY ACCEPTED', color: '#92400e', bg: '#fffbeb', border: '#fde68a', icon: '⚠️' };
      case 'REJECTED':
        return { label: 'REJECTED', color: '#991b1b', bg: '#fef2f2', border: '#fecaca', icon: '❌' };
      default:
        return { label: status, color: '#1e3a8a', bg: '#eff6ff', border: '#bfdbfe', icon: '📋' };
    }
  };

  const systemBadge = getStatusBadge(normalizedSystemStatus);
  const selectedBadge = getStatusBadge(selectedResult);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          animation: 'fadeInModal 0.2s ease-out'
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1e293b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}
            >
              📋
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                Finish Inspection — Call Result Dispatch
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                {productType} • Call No: <strong style={{ color: '#f8fafc' }}>{displayCallNo}</strong>
              </p>
            </div>
          </div>
          {!isSubmitting && (
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '22px', cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}
              title="Close"
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: systemBadge.bg,
              border: `1px solid ${systemBadge.border}`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                System Evaluated Status
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Based on automated tolerances, test lots, and check rules
              </div>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: '700',
                color: systemBadge.color,
                backgroundColor: '#ffffff',
                border: `1px solid ${systemBadge.border}`,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              {systemBadge.icon} {systemBadge.label}
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
              Select Call Result (IE Final Decision) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={selectedResult}
              onChange={handleResultChange}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                fontWeight: '600',
                borderRadius: '10px',
                border: isMismatch ? '2px solid #f59e0b' : '1.5px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                outline: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="ACCEPTED">Accepted — Call Accepted</option>
              {allowPartiallyAccepted && (
                <option value="PARTIALLY_ACCEPTED">Partially Accepted — Call Partially Accepted</option>
              )}
              <option value="REJECTED">Rejected — Call Rejected</option>
            </select>
          </div>

          {isAdverseSelection && !isMismatch && (
            <div
              style={{
                padding: '14px 16px',
                backgroundColor: selectedResult === 'REJECTED' ? '#fef2f2' : '#fffbeb',
                border: `1px solid ${selectedResult === 'REJECTED' ? '#fca5a5' : '#fcd34d'}`,
                borderRadius: '10px',
                display: 'flex',
                gap: '12px'
              }}
            >
              <span style={{ fontSize: '20px', lineHeight: 1 }}>⚠️</span>
              <div style={{ fontSize: '13px', color: selectedResult === 'REJECTED' ? '#991b1b' : '#92400e', lineHeight: '1.5' }}>
                <strong>Adverse Decision Notice:</strong> You have selected <strong>{selectedBadge.label}</strong>.
                Please verify that all sample test sheets, hardness tests, and dimensions have been inspected before submitting.
              </div>
            </div>
          )}

          {isMismatch && (
            <div
              style={{
                padding: '16px',
                backgroundColor: isSystemAcceptedIeRejected ? '#fef2f2' : '#fffbeb',
                border: `1.5px solid ${isSystemAcceptedIeRejected ? '#ef4444' : '#f59e0b'}`,
                borderRadius: '10px',
                display: 'flex',
                gap: '12px'
              }}
            >
              <span style={{ fontSize: '24px', lineHeight: 1 }}>⚠️</span>
              <div style={{ fontSize: '13px', color: isSystemAcceptedIeRejected ? '#7f1d1d' : '#78350f', lineHeight: '1.5' }}>
                <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                  System Status Mismatch Detected!
                </strong>
                {isSystemAcceptedIeRejected && (
                  <span>
                    The system computed status is <strong>ACCEPTED</strong>, but you are marking the call as <strong>REJECTED</strong>.
                  </span>
                )}
                {isSystemAcceptedIePartial && (
                  <span>
                    The system computed status is <strong>ACCEPTED</strong>, but you are selecting <strong>PARTIALLY ACCEPTED</strong>.
                  </span>
                )}
                {isSystemRejectedIeAccepted && (
                  <span>
                    The system computed status is <strong>REJECTED</strong>, but you have selected <strong>ACCEPTED</strong>.
                  </span>
                )}
                <div style={{ marginTop: '6px', fontWeight: '700', color: isSystemAcceptedIeRejected ? '#991b1b' : '#b45309' }}>
                  Mandatory justification remarks are required below explaining this decision.
                </div>
              </div>
            </div>
          )}

          {selectedResult === 'REJECTED' && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                fontSize: '12.5px',
                color: '#334155',
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
              }}
            >
              <span style={{ fontSize: '18px' }}>🚫</span>
              <span>
                <strong>IBS Integration:</strong> Finalizing as <strong>REJECTED</strong> will dispatch a rejection payload to IBS and may trigger vendor blocking or penalty charges as per quality guidelines.
              </span>
            </div>
          )}

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13.5px', fontWeight: '700', color: '#1e293b' }}>
                Remarks / Justification {isRemarksMandatory && <span style={{ color: '#ef4444' }}>*(Mandatory)</span>}
              </label>
              {isRemarksMandatory && (
                <span style={{ fontSize: '12px', color: '#b45309', fontWeight: '600' }}>
                  Required for {selectedBadge.label}
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                if (e.target.value.trim()) setRemarksError('');
              }}
              disabled={isSubmitting}
              placeholder={
                isMismatch
                  ? `Explain why ${selectedBadge.label} was selected instead of system's ${systemBadge.label}...`
                  : selectedResult === 'REJECTED'
                  ? 'Specify exact reasons for call rejection...'
                  : 'Enter any inspection summary remarks or observations (optional)...'
              }
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                borderRadius: '8px',
                border: remarksError ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
            {remarksError && (
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>
                ❌ {remarksError}
              </p>
            )}
          </div>
        </div>

        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            alignItems: 'center'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '700',
              borderRadius: '8px',
              border: 'none',
              backgroundColor:
                selectedResult === 'REJECTED'
                  ? '#dc2626'
                  : selectedResult === 'PARTIALLY_ACCEPTED'
                  ? '#d97706'
                  : '#16a34a',
              color: '#ffffff',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              opacity: isSubmitting ? 0.7 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isSubmitting ? '⏳ Processing & Dispatching...' : `Confirm & Finish (${selectedBadge.label})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallResultDispatchModal;
