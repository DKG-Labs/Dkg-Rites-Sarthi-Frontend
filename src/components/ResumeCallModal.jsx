import React, { useState } from 'react';
import Modal from './Modal';

/**
 * ResumeCallModal Component
 * Dedicated modal for entering shift details when resuming an inspection.
 * Matches the functionality of EnterShiftDetailsModal in IELandingPage.
 */
const ResumeCallModal = ({ isOpen, onClose, call, onConfirm, isResume = true, isSubmitting = false, initialShift = '', isShiftReadOnly = false }) => {
    const [shift, setShift] = useState(initialShift);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState('');

    // Update shift when initialShift changes and modal is opened
    React.useEffect(() => {
        if (isOpen && initialShift) {
            setShift(initialShift);
        }
    }, [isOpen, initialShift]);

    // Get date options for Shift C (today and yesterday)
    const getDateOptions = () => {
        const today = new Date();
        const yesterday = new Date(Date.now() - 86400000);
        return [
            { value: '', label: 'Select Date' },
            { value: today.toISOString().split('T')[0], label: `${today.toLocaleDateString('en-GB')} (Today)` },
            { value: yesterday.toISOString().split('T')[0], label: `${yesterday.toLocaleDateString('en-GB')} (Yesterday)` }
        ];
    };

    const handleConfirm = () => {
        if (!shift) {
            setError('Please select a shift');
            return;
        }
        if (!date) {
            setError('Please select a date');
            return;
        }
        onConfirm({ shift, date });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => !isSubmitting && onClose()}
            title={isResume ? `Resume Inspection - ${call?.call_no}` : `Enter Shift Details - ${call?.call_no}`}
            footer={
                <>
                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Confirming...' : 'Confirm'}
                    </button>
                </>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
                {error && (
                    <div style={{
                        padding: 'var(--space-12)',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        borderRadius: 'var(--radius-base)',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label required">Shift of Inspection</label>
                    <select
                        className="form-control"
                        value={shift}
                        onChange={(e) => {
                            setShift(e.target.value);
                            setError('');
                            if (e.target.value && e.target.value !== 'C') {
                                setDate(new Date().toISOString().split('T')[0]);
                            }
                        }}
                        disabled={isShiftReadOnly}
                    >
                        <option value="">Select Shift</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="General">General</option>
                    </select>
                    {isShiftReadOnly && (
                        <span style={{ fontSize: '12px', color: 'var(--color-primary)', marginTop: '4px', display: 'block' }}>
                            Ongoing shift: {shift}
                        </span>
                    )}
                </div>

                <div className="form-group">
                    <label className="form-label required">Date of Inspection</label>
                    {shift === 'C' ? (
                        <select
                            className="form-control"
                            value={date}
                            onChange={(e) => {
                                setDate(e.target.value);
                                setError('');
                            }}
                        >
                            {getDateOptions().map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            className="form-control"
                            value={date ? new Date(date).toLocaleDateString('en-GB') : ''}
                            disabled
                        />
                    )}
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
                        {shift === 'C' ? 'Shift C: Select today or yesterday' : 'Auto-set to today for shifts A, B, General'}
                    </span>
                </div>
            </div>
        </Modal>
    );
};

export default ResumeCallModal;
