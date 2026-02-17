import React from 'react';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';
import { getDisplayStatus as getDisplayStatusFromMapper, getAvailableActions, API_STATUS } from '../utils/statusMapper';

/**
 * AddNewCallModal Component
 * Replaces the inline modal logic in ProcessDashboard.jsx.
 * Displays a table of available calls with status-based actions.
 */
const AddNewCallModal = ({
    isOpen,
    onClose,
    availableCalls,
    onStart,
    onResume,
    onWithheld,
    onCancel,
    onShowInfo,
    onSchedule,
    isLoading = false
}) => {
    if (!isOpen) return null;

    const columns = [
        { key: 'call_no', label: 'Call No.' },
        { key: 'po_no', label: 'PO No.' },
        { key: 'vendor_name', label: 'Vendor Name', render: (val) => val || '-' },
        { key: 'product_type', label: 'Product Type', render: (val) => val || '-' },
        {
            key: 'status',
            label: 'Status',
            render: (val) => {
                const displayStatus = getDisplayStatusFromMapper(val || API_STATUS.CALL_REGISTERED);
                return <StatusBadge status={displayStatus} />;
            }
        }
    ];

    const rowActions = (row) => {
        const apiStatus = row.status || API_STATUS.CALL_REGISTERED;
        const availableActions = getAvailableActions(apiStatus);

        return (
            <div style={{ display: 'flex', gap: '8px' }}>
                {availableActions.includes('start') && (
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={() => onStart(row)}
                    >
                        START
                    </button>
                )}
                {availableActions.includes('resume') && (
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={() => onResume(row, true)}
                    >
                        RESUME
                    </button>
                )}
                {availableActions.includes('enterShiftDetails') && (
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={() => onResume(row, false)}
                    >
                        ENTER SHIFT DETAILS
                    </button>
                )}
                {(availableActions.includes('schedule') || availableActions.includes('reschedule')) && (
                    <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => onSchedule(row, availableActions.includes('reschedule'))}
                    >
                        {availableActions.includes('reschedule') ? 'RESCHEDULE' : 'SCHEDULE'}
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{
                maxWidth: '1100px',
                width: '95%',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div className="modal-header" style={{ flexShrink: 0 }}>
                    <h3 className="modal-title">Add New Call Number</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body" style={{
                    padding: '20px',
                    overflowY: 'auto',
                    flex: 1
                }}>
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>Loading available calls...</div>
                    ) : availableCalls.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                            No available calls found for your region.
                        </div>
                    ) : (
                        <div className="pending-calls-table-container">
                            <DataTable
                                columns={columns}
                                data={availableCalls}
                                actions={rowActions}
                                selectable={false} // Multiple selection removed per user request
                                initialPageSize={5}
                                hidePageSize={true}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddNewCallModal;
