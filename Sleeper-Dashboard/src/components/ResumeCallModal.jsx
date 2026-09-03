import React, { useState, useEffect } from 'react';

/**
 * ResumeCallModal Component
 * Popup modal for selecting Shift and Date of Inspection when Starting or Resuming an inspection.
 */
const ResumeCallModal = ({
    isOpen,
    onClose,
    call,
    onConfirm,
    isResume = true,
    isSubmitting = false
}) => {
    const [shift, setShift] = useState('');
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [remarks, setRemarks] = useState('');
    const [error, setError] = useState('');
    const [localSubmitting, setLocalSubmitting] = useState(false);

    const isBusy = isSubmitting || localSubmitting;

    useEffect(() => {
        if (isOpen && call) {
            setShift('');
            const initialDate = call.dateOfInspection || call.inspectionDate || call.date || new Date().toISOString().split('T')[0];
            setDate(initialDate.includes('T') ? initialDate.split('T')[0] : initialDate);
            setRemarks('');
            setError('');
            setLocalSubmitting(false);
        }
    }, [isOpen, call]);

    if (!isOpen || !call) return null;

    const callNumber = call.call_no || call.callNumber || call.requestId || call.id || '-';
    const poNumber = call.po_no || call.poNumber || call.poNo || '-';
    const vendor = call.vendor_name || call.vendorName || call.vendorCode || '-';

    const handleConfirm = async () => {
        if (!shift) {
            setError('Please select a shift');
            return;
        }
        if (!date) {
            setError('Please select an inspection date');
            return;
        }
        if (isBusy) return;
        setLocalSubmitting(true);
        try {
            await onConfirm({
                shift,
                date,
                remarks
            });
        } catch (err) {
            console.error("Error during shift confirmation:", err);
            setLocalSubmitting(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
        }}>
            <div style={{
                background: '#ffffff',
                width: '100%',
                maxWidth: '520px',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                animation: 'modalSlideIn 0.2s ease-out'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(to right, #0f172a, #1e293b)',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#ffffff'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            background: '#0ea5e9',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px'
                        }}>
                            ⏱️
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>
                                {isResume ? 'Resume Inspection' : 'Enter Shift Details'}
                            </h3>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                Call: {callNumber}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: '#ffffff',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px' }}>
                    {/* Call Summary Banner */}
                    <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        marginBottom: '20px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px'
                    }}>
                        <div>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Call Number</span>
                            <span style={{ fontSize: '13px', color: '#0284c7', fontWeight: '800' }}>{callNumber}</span>
                        </div>
                        <div>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>PO Number</span>
                            <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700' }}>{poNumber}</span>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Vendor</span>
                            <span style={{ fontSize: '12px', color: '#334155', fontWeight: '600' }}>{vendor}</span>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            padding: '10px 14px',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            borderRadius: '8px',
                            fontSize: '13px',
                            marginBottom: '16px',
                            fontWeight: '600',
                            border: '1px solid #fecaca'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Shift Selection */}
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px', display: 'block', letterSpacing: '0.04em' }}>
                                Shift of Inspection <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <select
                                value={shift}
                                onChange={(e) => {
                                    setShift(e.target.value);
                                    setError('');
                                }}
                                disabled={isBusy}
                                style={{
                                    width: '100%',
                                    height: '44px',
                                    borderRadius: '10px',
                                    border: '1.5px solid #cbd5e1',
                                    padding: '0 14px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: shift ? '#0f172a' : '#94a3b8',
                                    backgroundColor: isBusy ? '#f1f5f9' : '#ffffff',
                                    outline: 'none',
                                    cursor: isBusy ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <option value="">Select Shift</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="General">General</option>
                            </select>
                        </div>

                        {/* Date of Inspection */}
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px', display: 'block', letterSpacing: '0.04em' }}>
                                Date of Inspection <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => {
                                    setDate(e.target.value);
                                    setError('');
                                }}
                                disabled={isBusy}
                                style={{
                                    width: '100%',
                                    height: '44px',
                                    borderRadius: '10px',
                                    border: '1.5px solid #cbd5e1',
                                    padding: '0 14px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#0f172a',
                                    backgroundColor: isBusy ? '#f1f5f9' : '#ffffff',
                                    outline: 'none',
                                    cursor: isBusy ? 'not-allowed' : 'pointer'
                                }}
                            />
                        </div>

                        {/* Optional Remarks */}
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px', display: 'block', letterSpacing: '0.04em' }}>
                                Remarks / Inspection Notes <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '500' }}>(Optional)</span>
                            </label>
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Enter any notes or remarks for this shift..."
                                rows={2}
                                disabled={isBusy}
                                style={{
                                    width: '100%',
                                    borderRadius: '10px',
                                    border: '1.5px solid #cbd5e1',
                                    padding: '10px 14px',
                                    fontSize: '13px',
                                    color: '#0f172a',
                                    backgroundColor: isBusy ? '#f1f5f9' : '#ffffff',
                                    outline: 'none',
                                    resize: 'none',
                                    cursor: isBusy ? 'not-allowed' : 'text'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    background: '#f8fafc',
                    padding: '16px 24px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    borderTop: '1px solid #e2e8f0'
                }}>
                    <button
                        onClick={onClose}
                        disabled={isBusy}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '10px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#475569',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: isBusy ? 'not-allowed' : 'pointer',
                            opacity: isBusy ? 0.65 : 1
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isBusy}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '10px',
                            border: 'none',
                            background: isBusy ? '#94a3b8' : '#2563eb',
                            color: '#ffffff',
                            fontSize: '13px',
                            fontWeight: '800',
                            cursor: isBusy ? 'not-allowed' : 'pointer',
                            boxShadow: isBusy ? 'none' : '0 4px 6px -1px rgba(37, 99, 235, 0.25)',
                            opacity: isBusy ? 0.75 : 1
                        }}
                    >
                        {isBusy ? 'Proceeding...' : (isResume ? 'Resume Inspection →' : 'Start Inspection →')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResumeCallModal;
