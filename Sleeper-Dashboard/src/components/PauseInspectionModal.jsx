import React, { useState, useEffect } from 'react';

const PAUSE_REASONS = [
  {
    id: 'SEND_SAMPLE',
    label: 'Send sample for testing',
    defaultRemarks: 'Inspection paused: Samples sent for testing (cube / water curing / MR)'
  },
  {
    id: 'NEXT_SCHEDULE',
    label: 'Pause for next schedule',
    defaultRemarks: 'Inspection paused for next schedule'
  },
  {
    id: 'SHIFT_COMPLETED',
    label: 'Shift completed (Resume in next shift/day)',
    defaultRemarks: 'Inspection paused: Shift completed'
  },
  {
    id: 'EQUIPMENT_DOWNTIME',
    label: 'Testing equipment / Plant downtime',
    defaultRemarks: 'Inspection paused due to equipment downtime'
  },
  {
    id: 'OTHER',
    label: 'Other Reason',
    defaultRemarks: ''
  }
];

/**
 * PauseInspectionModal (Sleeper)
 */
const PauseInspectionModal = ({
  isOpen,
  onClose,
  onConfirm,
  callNo = '',
  productType = 'Concrete Sleeper Inspection',
  isSubmitting = false
}) => {
  const [selectedReason, setSelectedReason] = useState(PAUSE_REASONS[0].id);
  const [remarks, setRemarks] = useState(PAUSE_REASONS[0].defaultRemarks);
  const [remarksError, setRemarksError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedReason(PAUSE_REASONS[0].id);
      setRemarks(PAUSE_REASONS[0].defaultRemarks);
      setRemarksError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReasonSelect = (reasonId) => {
    setSelectedReason(reasonId);
    const found = PAUSE_REASONS.find(r => r.id === reasonId);
    if (found) {
      setRemarks(found.defaultRemarks);
    }
    setRemarksError('');
  };

  const handleConfirm = () => {
    if (!remarks || !remarks.trim()) {
      setRemarksError('Please enter remarks for pausing the inspection.');
      return;
    }
    const chosen = PAUSE_REASONS.find(r => r.id === selectedReason);
    if (onConfirm) {
      onConfirm({
        pauseReason: chosen ? chosen.label : selectedReason,
        remarks: remarks.trim()
      });
    }
  };

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
          maxWidth: '520px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: '#c2410c',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}
            >
              ⏸️
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                Pause Inspection
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#ffedd5' }}>
                {productType} • Call No: <strong style={{ color: '#ffffff' }}>{callNo || 'N/A'}</strong>
              </p>
            </div>
          </div>
          {!isSubmitting && (
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#fed7aa', fontSize: '22px', cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}
              title="Close"
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>
              Select Reason for Pause <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {PAUSE_REASONS.map((r) => {
                const isSelected = selectedReason === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => !isSubmitting && handleReasonSelect(r.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #ea580c' : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? '#fff7ed' : '#ffffff',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <input
                      type="radio"
                      name="pauseReason"
                      checked={isSelected}
                      onChange={() => handleReasonSelect(r.id)}
                      disabled={isSubmitting}
                      style={{ cursor: 'pointer', accentColor: '#ea580c', width: '17px', height: '17px' }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: isSelected ? '700' : '500', color: isSelected ? '#9a3412' : '#334155' }}>
                      {r.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
              Inspection Remarks <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                if (e.target.value.trim()) setRemarksError('');
              }}
              disabled={isSubmitting}
              placeholder="Enter remarks or details about the pause..."
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
            gap: '12px'
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
              backgroundColor: '#ea580c',
              color: '#ffffff',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(234, 88, 12, 0.25)',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? '⏳ Pausing...' : 'Confirm & Pause Inspection'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PauseInspectionModal;
