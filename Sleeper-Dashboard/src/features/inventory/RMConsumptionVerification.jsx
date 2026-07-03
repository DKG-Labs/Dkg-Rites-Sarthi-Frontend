import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';
import { useShift } from '../../context/ShiftContext';
import './RMConsumptionVerification.css';

// ─── Module ID Map (matches backend getModuleIdForMaterial) ─────
//  13 = HTS Wire RM Consumption
//  14 = Cement RM Consumption
//  15 = Admixture RM Consumption
//  16 = Aggregates RM Consumption
//  17 = SGCI Insert RM Consumption
//  18 = Dowel RM Consumption
const RM_MODULE_ID_MAP = {
    'hts wire':    13,
    'hts-wire':    13,
    'cement':      14,
    'admixture':   15,
    'aggregates':  16,
    'aggregate':   16,
    'sgci insert': 17,
    'sgci-insert': 17,
    'dowel':       18,
};

const getModuleIdForMaterial = (rawMaterial) => {
    if (!rawMaterial) return 13;
    return RM_MODULE_ID_MAP[rawMaterial.toLowerCase()] ?? 13;
};

// ─── Skeleton Row ───────────────────────────────────────────────
const SkeletonRow = ({ cols }) => (
    <tr className="cv-skeleton-row">
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i}>
                <div className="cv-skeleton-cell" />
            </td>
        ))}
    </tr>
);

// ─── Workflow Action Modal ───────────────────────────────────────
const WorkflowModal = ({ record, action, onClose, onConfirm, acting }) => {
    const [remarks, setRemarks] = useState('');
    const isAccept = action === 'VERIFY';

    const handleSubmit = () => {
        if (!isAccept && !remarks.trim()) {
            alert('Please enter a reason for rejection.');
            return;
        }
        onConfirm(remarks.trim() || (isAccept ? 'Accepted by IE' : ''));
    };

    return (
        <div className="cv-modal-overlay" onClick={onClose}>
            <div className="cv-modal-card" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="cv-modal-header" style={{ borderLeft: `4px solid ${isAccept ? '#10b981' : '#ef4444'}` }}>
                    <div className="cv-modal-title-row">
                        <div className={`cv-modal-icon ${isAccept ? 'accept' : 'reject'}`}>
                            {isAccept ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            )}
                        </div>
                        <div>
                            <h3 className="cv-modal-title">{isAccept ? 'Accept Record' : 'Reject Record'}</h3>
                            <span className="cv-modal-subtitle">ID: {record.id}</span>
                        </div>
                    </div>
                    <button className="cv-modal-close" onClick={onClose}>✕</button>
                </div>

                {/* Record Summary */}
                <div className="cv-modal-summary">
                    <div className="cv-modal-field">
                        <span className="cv-modal-label">Date</span>
                        <span className="cv-modal-value">{record.date}</span>
                    </div>
                    <div className="cv-modal-field">
                        <span className="cv-modal-label">Raw Material</span>
                        <span className="cv-modal-value">{record.rawMaterial} — {record.subType}</span>
                    </div>
                    <div className="cv-modal-field">
                        <span className="cv-modal-label">Used For</span>
                        <span className="cv-modal-value">{record.usedFor}</span>
                    </div>
                    <div className="cv-modal-field">
                        <span className="cv-modal-label">Qty Used</span>
                        <span className="cv-modal-value cv-modal-qty">{record.qty}</span>
                    </div>
                </div>

                {/* Remarks */}
                <div className="cv-modal-remarks">
                    <label className="cv-modal-label">
                        {isAccept ? 'Remarks (optional)' : 'Rejection Reason *'}
                    </label>
                    <textarea
                        className="cv-modal-textarea"
                        placeholder={isAccept ? 'Add optional remarks…' : 'Enter reason for rejection (required)…'}
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                        rows={3}
                    />
                </div>

                {/* Actions */}
                <div className="cv-modal-actions">
                    <button
                        className={`cv-modal-btn-confirm ${isAccept ? 'accept' : 'reject'}`}
                        onClick={handleSubmit}
                        disabled={acting}
                    >
                        {acting ? (
                            <span className="cv-btn-spinner" />
                        ) : (
                            isAccept ? '✓ Confirm Accept' : '✕ Confirm Reject'
                        )}
                    </button>
                    <button className="cv-modal-btn-cancel" onClick={onClose} disabled={acting}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Pagination Controls ─────────────────────────────────────────
const PaginationControls = ({ page, setPage, pageSize, setPageSize, totalItems, loading }) => {
    const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 25];
    const totalPages = Math.ceil((totalItems || 0) / pageSize) || 1;
    const hasNext = page < totalPages - 1;
    const hasPrev = page > 0;

    return (
        <div className="cv-pagination">
            <div className="cv-page-size">
                <span className="cv-page-label">Rows per page:</span>
                <select
                    className="cv-page-select"
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
                    disabled={loading}
                >
                    {PAGE_SIZE_OPTIONS.map(n => (
                        <option key={n} value={n}>{n}</option>
                    ))}
                </select>
            </div>

            <div className="cv-page-info">
                {totalItems > 0 && (
                    <span className="cv-page-count">
                        {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalItems)} of {totalItems}
                    </span>
                )}
                <button
                    className="cv-page-btn"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={!hasPrev || loading}
                >
                    ‹ Prev
                </button>
                <span className="cv-page-current">
                    {page + 1} / {totalPages}
                </span>
                <button
                    className="cv-page-btn"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasNext || loading}
                >
                    Next ›
                </button>
            </div>
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────
const RMConsumptionVerification = ({ rmCategory }) => {
    const { dutyUnit, userId } = useShift();
    const effectiveUserId = userId || localStorage.getItem('userId');
    const effectivePlantId = dutyUnit || localStorage.getItem('dutyUnit');

    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [records, setRecords] = useState([]);
    const [totalItems, setTotalItems] = useState(0);

    // Pagination
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(5);

    // Workflow modal state
    const [modalState, setModalState] = useState(null); // { record, action }
    const [acting, setActing] = useState(false);

    // Toast
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const getMaterialNameForCategory = (categoryId) => {
        switch (categoryId) {
            case 'hts': return 'HTS wire';
            case 'cement': return 'Cement';
            case 'admixture': return 'Admixture';
            case 'aggregate': return 'Aggregates';
            case 'sgci': return 'SGCI insert';
            case 'dowel': return 'Dowel';
            default: return 'HTS wire';
        }
    };

    const loadData = useCallback(async () => {
        if (!effectivePlantId) {
            setError('Plant ID not found. Please ensure your duty is active.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const materialName = getMaterialNameForCategory(rmCategory?.id);
            const consumptionModuleId = getModuleIdForMaterial(materialName);

            // Fetch consumption records for THIS material + pending/completed transitions for THIS module
            const [consumptionRes, pendingTransitionsRes, completedTransitionsRes] = await Promise.all([
                apiService.getRMConsumptionByPlantAndMaterial(effectivePlantId, materialName, page, pageSize),
                apiService.getAllPendingWorkflowTransitionsModuleWise('IE', consumptionModuleId, 0, 1000)
                    .catch(() => ({ responseData: [] })),
                apiService.getAllCompletedWorkflowTransitionsModuleWise(consumptionModuleId, 0, 1000)
                    .catch(() => ({ responseData: [] })),
            ]);

            const parseList = (res) => {
                if (Array.isArray(res)) return res;
                if (Array.isArray(res?.responseData)) return res.responseData;
                if (Array.isArray(res?.responseData?.content)) return res.responseData.content;
                return [];
            };

            const pendingList = parseList(pendingTransitionsRes);
            const completedList = parseList(completedTransitionsRes);

            // Build map: requestId -> workflowTransitionId (for pending)
            const pendingTransitionMap = {};
            pendingList.forEach(t => {
                if (t.requestId != null) {
                    pendingTransitionMap[String(t.requestId)] = {
                        workflowTransitionId: t.workflowTransitionId,
                        moduleId: t.moduleId,
                    };
                }
            });

            // Build set: requestIds that are COMPLETED (verified/rejected)
            const completedRequestIds = new Set();
            const completedInfoMap = {}; // requestId -> { action, remarks }
            completedList.forEach(t => {
                if (t.requestId != null) {
                    completedRequestIds.add(String(t.requestId));
                    completedInfoMap[String(t.requestId)] = {
                        action: t.action,
                        verifiedStatus: t.action === 'REQUEST_BACK' ? 'Rejected' : 'Verified',
                    };
                }
            });

            // Enrich each record with workflow info
            const data = (consumptionRes?.responseData ?? []).map(r => {
                const key = String(r.numericId);
                const isCompleted = completedRequestIds.has(key);
                const completedInfo = completedInfoMap[key];
                return {
                    ...r,
                    workflowTransitionId: pendingTransitionMap[key]?.workflowTransitionId ?? null,
                    // Derive workflow-aware status:
                    // - 'verified'  → appears in Verified tab
                    // - 'pending'   → appears in Pending tab (has a workflow in progress)
                    // - 'none'      → appears in Pending tab (no workflow yet, Awaiting Submission)
                    workflowStatus: isCompleted
                        ? 'verified'
                        : pendingTransitionMap[key]
                            ? 'pending'
                            : 'none',
                    verifiedStatus: completedInfo?.verifiedStatus ?? null,
                };
            });

            setRecords(data);
            setTotalItems(consumptionRes?.totalItems ?? data.length);
        } catch (err) {
            setError(err.message || 'Failed to load records.');
        } finally {
            setLoading(false);
        }
    }, [effectivePlantId, page, pageSize]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Reset page when tab changes
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setPage(0);
    };

    // Filter by workflow-derived status (not the raw DB status field)
    // workflowStatus: 'verified' | 'pending' | 'none'
    const pendingRecords  = records.filter(r => r.workflowStatus !== 'verified');
    const verifiedRecords = records.filter(r => r.workflowStatus === 'verified');
    const displayRecords  = activeTab === 'pending' ? pendingRecords : verifiedRecords;

    // Open workflow modal
    const openModal = (record, action) => {
        setModalState({ record, action });
    };

    // Perform workflow action via API
    const handleWorkflowAction = async (remarks) => {
        if (!modalState) return;
        const { record, action } = modalState;

        // workflowTransitionId is required by backend's performTransitionAction
        if (!record.workflowTransitionId) {
            showToast('No pending workflow found for this record. The vendor may not have submitted it yet.', 'error');
            setModalState(null);
            return;
        }

        setActing(true);
        try {
            const payload = {
                workflowTransitionId: record.workflowTransitionId,  // required — backend does findById on this
                requestId: String(record.numericId),
                action,                                              // 'VERIFY' or 'REQUEST_BACK'
                actionBy: Number(effectiveUserId),                   // must be Long
                remarks,
                moduleId: getModuleIdForMaterial(record.rawMaterial), // must be Long (number)
            };
            await apiService.performTransitionAction(payload);
            showToast(
                action === 'VERIFY'
                    ? `Record ${record.id} accepted successfully.`
                    : `Record ${record.id} rejected.`,
                action === 'VERIFY' ? 'success' : 'error'
            );
            setModalState(null);
            await loadData(); // refresh
        } catch (err) {
            showToast(err.message || 'Action failed. Please try again.', 'error');
        } finally {
            setActing(false);
        }
    };

    const SKELETON_COLS = activeTab === 'pending' ? 7 : 7;

    return (
        <div className="rm-consumption-verification fade-in">
            {/* Toast */}
            {toast && (
                <div className={`cv-toast ${toast.type}`}>
                    {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
                </div>
            )}

            {/* Tabs */}
            <div className="cv-tabs">
                <button
                    className={`cv-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => handleTabChange('pending')}
                >
                    Pending Verification
                    {pendingRecords.length > 0 && (
                        <span className="tab-badge pending-badge">{pendingRecords.length}</span>
                    )}
                </button>
                <button
                    className={`cv-tab-btn ${activeTab === 'verified' ? 'active' : ''}`}
                    onClick={() => handleTabChange('verified')}
                >
                    Verified
                    {verifiedRecords.length > 0 && (
                        <span className="tab-badge">{verifiedRecords.length}</span>
                    )}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="cv-error-banner">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {error}
                    <button onClick={loadData} className="cv-retry-btn">Retry</button>
                </div>
            )}

            {/* Table */}
            <div className="table-container">
                <table className="cv-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Date of Use</th>
                            <th>RM & Sub-Type</th>
                            <th>RM Used For</th>
                            <th>No. of Sleepers Produced</th>
                            <th>Estimated Qty Used</th>
                            <th>Actual Qty Declared</th>
                            {activeTab === 'pending' && <th>Actions</th>}
                            {activeTab === 'verified' && <th>Status</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: pageSize }).map((_, i) => (
                                <SkeletonRow key={i} cols={SKELETON_COLS} />
                            ))
                        ) : displayRecords.length === 0 ? (
                            <tr>
                                <td colSpan={SKELETON_COLS} className="cv-empty-cell">
                                    <div className="cv-empty-state">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
                                        <p>No {activeTab === 'pending' ? 'pending' : 'verified'} records found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            displayRecords.map((row, idx) => (
                                <tr key={row.id} className="cv-data-row">
                                    <td className="cv-serial">{page * pageSize + idx + 1}</td>
                                    <td>{row.date}</td>
                                    <td>
                                        <span className="cv-rm-tag">
                                            {row.rawMaterial}
                                            {row.subType && <em> — {row.subType}</em>}
                                        </span>
                                    </td>
                                    <td>{row.usedFor}</td>
                                    <td className="cv-num">{row.sleepersMade ?? '—'}</td>
                                    <td className="cv-num">{row.estimatedQty ?? '—'}</td>
                                    <td>
                                        <span className="qty-highlight">{row.qty}</span>
                                    </td>
                                    {activeTab === 'pending' && (
                                        <td>
                                            {row.workflowTransitionId ? (
                                                <div className="action-buttons">
                                                    <button
                                                        className="approve-btn"
                                                        title="Accept"
                                                        onClick={() => openModal(row, 'VERIFY')}
                                                    >
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                    </button>
                                                    <button
                                                        className="reject-btn"
                                                        title="Reject"
                                                        onClick={() => openModal(row, 'REQUEST_BACK')}
                                                    >
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="cv-no-workflow-badge" title="Workflow not initiated by vendor">
                                                    Awaiting Submission
                                                </span>
                                            )}
                                        </td>
                                    )}
                                    {activeTab === 'verified' && (
                                        <td>
                                            <span className={`status-badge-table ${row.verifiedStatus === 'Verified' ? 'verified' : 'rejected'}`}>
                                                {row.verifiedStatus ?? 'Verified'}
                                            </span>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!error && (
                <PaginationControls
                    page={page}
                    setPage={setPage}
                    pageSize={pageSize}
                    setPageSize={setPageSize}
                    totalItems={totalItems}
                    loading={loading}
                />
            )}

            {/* Workflow Modal */}
            {modalState && (
                <WorkflowModal
                    record={modalState.record}
                    action={modalState.action}
                    onClose={() => !acting && setModalState(null)}
                    onConfirm={handleWorkflowAction}
                    acting={acting}
                />
            )}
        </div>
    );
};

export default RMConsumptionVerification;
