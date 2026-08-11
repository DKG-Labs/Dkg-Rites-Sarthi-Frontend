import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../../services/api';
import { getAllCompletedCalls } from '../../../services/workflowService';
import VerificationDetailModal from '../rawMaterialVerification/VerificationDetailModal';
import BenchMouldUpdateModal from './BenchMouldUpdateModal';
import { useShift } from '../../../context/ShiftContext';
import './PlantDeclarationVerification.css';

// ─────────────────────────────────────────────────────
//  Constants – must match sleeper_module table
// ─────────────────────────────────────────────────────
const LOGGED_IN_USER_ID = parseInt(localStorage.getItem('userId') || '119', 10);

/**
 * sleeper_module table mapping (Plant Declaration group):
 *  id | module_name
 *   1 | PLANT_PROFILE
 *   2 | BENCH_MOULD_MASTER
 *   3 | RAW_MATERIAL_SOURCE
 *   4 | MIX_DESIGN
 */
const PLANT_DECLARATION_MODULES = [
    { moduleId: 1, label: 'Plant Profile',     color: '#7c3aed' },
    { moduleId: 2, label: 'Bench / Mould',     color: '#7c3aed', hidden: true },
    { moduleId: 3, label: 'Raw Material Src',  color: '#7c3aed', isUnderDevelopment: true },
    { moduleId: 4, label: 'Mix Design',        color: '#7c3aed' },
    { moduleId: 12, label: 'Long Line',        color: '#7c3aed', hidden: true },
];

const MODULE_TABLE_FIELDS = {
    1: [
        { label: 'Plant Name',     key: 'plantName' },
        { label: 'Vendor Code',    key: 'vendorCode' },
        { label: 'Type Of Plant',  key: 'plantType' },
        { label: 'Sheds / Lines',  key: 'numberOfSheds' },
    ],
    2: [
        { label: 'Plant Type',     key: 'plantType' },
        { label: 'Category',       key: 'category' },
        { label: 'Sub-Category',   key: 'subCategory' },
        { label: 'Drawing No.',    key: 'drawingNo' },
        { label: 'Moulds Info',    key: 'mouldsIdentifier' }, // Custom cell for detail summary
    ],
    12: [
        { label: 'Plant Type',     key: 'plantType' },
        { label: 'Category',       key: 'category' },
        { label: 'Sub-Category',   key: 'subCategory' },
        { label: 'Drawing No.',    key: 'drawingNo' },
        { label: 'Moulds Info',    key: 'mouldsIdentifier' },
    ],
    3: [
        { label: 'Material Type',  key: 'rawMaterialType' },
        { label: 'Supplier Name',  key: 'supplierName' },
        { label: 'Approval Ref',   key: 'approvalReference' },
    ],
    4: [
        { label: 'Mix ID',         key: 'mixId' },
        { label: 'Grade',          key: 'concreteGrade' },
        { label: 'Authority',      key: 'authorityOfApproval' },
    ],
};

/** Fetch the actual record data for a given moduleId + requestId */
const fetchRecordDetail = async (moduleId, requestId) => {
    const fetchers = {
        1: apiService.getPlantProfileById,
        2: apiService.getBenchMouldStressLongLineById,
        3: apiService.getRawMaterialSourceById,
        4: apiService.getMixDesignById,
        12: apiService.getBenchMouldStressLongLineById,
    };
    const fn = fetchers[moduleId];
    if (!fn) return null;
    try {
        const res = await fn(requestId);
        return res?.responseData ?? res ?? null;
    } catch (err) {
        console.error('Error fetching record detail', err);
        return null;
    }
};

const getStatusDisplay = (status) => {
    if (!status) return { label: '-', bg: '#f1f5f9', color: '#475569' };
    const s = status.toUpperCase();
    if (s === 'CREATED' || s === 'PENDING' || s === 'IN-PROGRESS' || s === 'RESUBMITTED') {
        return { label: 'Verification Pending', bg: '#fff7ed', color: '#c2410c' }; // Orange/Yellow
    }
    if (s === 'COMPLETED' || s === 'VERIFIED') {
        return { label: 'Verified and Locked', bg: '#ecfdf5', color: '#047857' }; // Green
    }
    if (s === 'REJECTED_CLOSED' || s === 'REJECTED') {
        return { label: 'Rejected', bg: '#fef2f2', color: '#991b1b' }; // Red
    }
    return { label: status, bg: '#f1f5f9', color: '#475569' };
};

// Shared table cell styles
const thStyle = {
    padding: '10px 16px', textAlign: 'left',
    fontSize: '11px', fontWeight: '700', color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    borderBottom: '1px solid #e2e8f0',
};
const tdStyle = {
    padding: '12px 16px', color: '#334155', verticalAlign: 'middle',
};

// ─────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────
const PlantDeclarationVerification = () => {
    const { userId, dutyUnit } = useShift();
    const effectiveUserId = userId || localStorage.getItem('userId');
    const [loading, setLoading]                   = useState(false);
    const [error, setError]                       = useState(null);
    
    // Data states (raw lists for counts)
    const [rawPendingByModule, setRawPendingByModule]     = useState({}); 
    const [rawCompletedByModule, setRawCompletedByModule] = useState({});

    // Enriched states (with full record details for table)
    const [enrichedPending, setEnrichedPending]     = useState({});
    const [enrichedCompleted, setEnrichedCompleted] = useState({});

    const [selectedModuleId, setSelectedModuleId] = useState(null);
    const [detailModal, setDetailModal]           = useState(null); 
    const [benchType, setBenchType]               = useState('STRESS_BENCH'); 
    const [submitting, setSubmitting]             = useState(false);
    const [enriching, setEnriching]               = useState(false);

    // Pagination states
    const [pendingPage, setPendingPage] = useState(0);
    const [pendingPageSize, setPendingPageSize] = useState(10);
    const [totalPendingElements, setTotalPendingElements] = useState(0);

    const [completedPage, setCompletedPage] = useState(0);
    const [completedPageSize, setCompletedPageSize] = useState(10);
    const [totalCompletedElements, setTotalCompletedElements] = useState(0);

    // ── Load High-Level Lists ──
    const loadData = useCallback(async () => {
        // If no module is selected yet, let the useEffect set it and re-trigger
        if (!selectedModuleId) return;

        setLoading(true);
        setError(null);
        try {
            // For Bench/Mould (Module 2), we also need to fetch Long Line (Module 12)
            const modulesToFetch = selectedModuleId === 2 ? [2, 12] : [selectedModuleId];
            
            let allPending = [];
            let pTotal = 0;

            for (const mid of modulesToFetch) {
                const pendingRes = await apiService.getAllPendingWorkflowTransitionsModuleWise('IE', mid, dutyUnit, pendingPage, pendingPageSize);
                const pList = Array.isArray(pendingRes) ? pendingRes : (pendingRes?.responseData?.content || pendingRes?.responseData || []);
                allPending = [...allPending, ...pList];
                pTotal += pendingRes?.responseData?.totalElements ?? pList.length;
            }

            setTotalPendingElements(pTotal);

            const groupRecords = (list) => {
                const plantModuleIds = PLANT_DECLARATION_MODULES.map(m => m.moduleId);
                const plantRecords = list.filter(r => {
                    const isCorrectModule = plantModuleIds.includes(r.moduleId);
                    const isCorrectPlant = !dutyUnit || r.plantId === dutyUnit;
                    return isCorrectModule && isCorrectPlant;
                });
                
                const grouped = {};
                plantModuleIds.forEach(id => { grouped[id] = []; });
                plantRecords.forEach(item => {
                    if (grouped[item.moduleId]) grouped[item.moduleId].push(item);
                });
                return grouped;
            };

            const pGrouped = groupRecords(allPending);
            setRawPendingByModule(prev => ({ ...prev, ...pGrouped }));
            
            const initialEnrichedP = {};
            Object.keys(pGrouped).forEach(mid => {
                initialEnrichedP[mid] = pGrouped[mid].map(item => ({...item, detail: item}));
            });
            
            setEnrichedPending(prev => ({ ...prev, ...initialEnrichedP }));
            setLoading(false); // Stop loader and show pending immediately

            // Fetch Completed in the background
            (async () => {
                try {
                    let allCompleted = [];
                    let cTotal = 0;

                    for (const mid of modulesToFetch) {
                        const completedRes = await apiService.getAllCompletedWorkflowTransitionsModuleWise(mid, dutyUnit, completedPage, completedPageSize);
                        const cList = Array.isArray(completedRes) ? completedRes : (completedRes?.responseData?.content || completedRes?.responseData || []);
                        allCompleted = [...allCompleted, ...cList];
                        cTotal += completedRes?.responseData?.totalElements ?? cList.length;
                    }

                    setTotalCompletedElements(cTotal);
                    const cGrouped = groupRecords(allCompleted);
                    setRawCompletedByModule(prev => ({ ...prev, ...cGrouped }));

                    const initialEnrichedC = {};
                    Object.keys(cGrouped).forEach(mid => {
                        initialEnrichedC[mid] = cGrouped[mid].map(item => ({...item, detail: item}));
                    });
                    
                    setEnrichedCompleted(prev => ({ ...prev, ...initialEnrichedC }));
                } catch (err) {
                    console.error('Failed to load completed list:', err);
                }
            })();

        } catch (err) {
            setError(err.message || 'Failed to load list.');
            setLoading(false);
        }
    }, [selectedModuleId, dutyUnit, pendingPage, pendingPageSize, completedPage, completedPageSize]);

    useEffect(() => {
        if (selectedModuleId === null) {
            setSelectedModuleId(PLANT_DECLARATION_MODULES[0].moduleId);
        } else {
            // Reset pagination when module changes
            setPendingPage(0);
            setCompletedPage(0);
        }
    }, [selectedModuleId]);

    useEffect(() => {
        if (selectedModuleId !== null) {
            loadData();
        }
    }, [loadData, selectedModuleId]); // Run on mount and when selectedModuleId changes


    const handleAction = async (row, action) => {
        const confirmMsg = action === 'UNLOCK' 
            ? 'Are you sure you want to Unlock this record?' 
            : `Are you sure you want to perform ${action}?`;
            
        if (!window.confirm(confirmMsg)) return;

        setSubmitting(true);
        try {
            await apiService.performTransitionAction({
                workflowTransitionId: row.workflowTransitionId,
                moduleId: row.moduleId,
                requestId: row.requestId,
                action: action,
                actionBy: effectiveUserId,
                remarks: action === 'VERIFY' ? 'Verified by IE' : (action === 'UNLOCK' ? 'Unlocked by IE' : 'Returned for resubmission')
            });
            alert(`Succesfully performed: ${action}`);
            loadData();
        } catch (err) {
            alert(`Action failed: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const PaginationControls = ({ page, pageSize, setPage, setPageSize, totalElements }) => {
        const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
        const hasNext = page < totalPages - 1;

        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderRadius: '0 0 12px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>Rows per page:</span>
                    <select 
                        value={pageSize} 
                        onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }} 
                        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={20}>20</option>
                    </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                        onClick={() => setPage(p => Math.max(0, p - 1))} 
                        disabled={page === 0 || loading} 
                        style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: page === 0 ? '#f1f5f9' : '#fff', color: page === 0 ? '#94a3b8' : '#334155', cursor: page === 0 ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px' }}
                    >
                        Prev
                    </button>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Page {page + 1} of {totalPages}</span>
                    <button 
                        onClick={() => setPage(p => p + 1)} 
                        disabled={loading || !hasNext} 
                        style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#334155', cursor: !hasNext ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px', opacity: !hasNext ? 0.5 : 1 }}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    const renderTable = (records, isHistory = false) => {
        if (!records || records.length === 0) {
            return (
                <div className="pdv-api-empty" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌑</div>
                    <strong style={{ fontSize: '13px' }}>No records found.</strong>
                </div>
            );
        }

        return (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                    <tr style={{ background: '#f8fafc' }}>
                        <th style={thStyle}>#</th>
                        <th style={thStyle}>Request ID</th>
                        <th style={thStyle}>Transition ID</th>
                        <th style={thStyle}>Assigned</th>
                        {MODULE_TABLE_FIELDS[records[0]?.moduleId || selectedModuleId]?.map(col => (
                            <th key={col.key} style={thStyle}>{col.label}</th>
                        ))}
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((row, idx) => (
                        <tr key={row.workflowTransitionId || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={tdStyle}>{idx + 1}</td>
                            <td style={{ ...tdStyle, fontWeight: '700', color: '#7c3aed' }}>#{row.requestId}</td>
                            <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>{row.workflowTransitionId}</td>
                            <td style={tdStyle}>User {row.assignedTo}</td>
                            {MODULE_TABLE_FIELDS[row.moduleId || selectedModuleId]?.map(col => {
                                if (col.key === 'mouldsIdentifier') {
                                    const details = row.detail?.details || [];
                                    const totalMoulds = details.reduce((sum, d) => sum + (d.noOfMoulds || 0), 0);
                                    const entryCount = details.length;
                                    return <td key={col.key} style={tdStyle}>
                                        <div style={{ fontWeight: '700' }}>{totalMoulds} Moulds</div>
                                        <div style={{ fontSize: '10px', color: '#64748b' }}>({entryCount} entries)</div>
                                    </td>;
                                }
                                return <td key={col.key} style={tdStyle}>{row.detail?.[col.key] ?? '-'}</td>;
                            })}
                            <td style={tdStyle}>
                                {(() => {
                                    const { label, bg, color } = getStatusDisplay(row.status);
                                    return (
                                        <span style={{ 
                                            background: bg, color: color, padding: '3px 10px', 
                                            borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                                            border: `1px solid ${color}20`
                                        }}>
                                            {label}
                                        </span>
                                    );
                                })()}
                            </td>
                            <td style={tdStyle}>
                                {(row.moduleId === 2 || row.moduleId === 12) ? (
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {/* Pending Actions */}
                                        {!isHistory && (row.status === 'CREATED' || row.status?.toUpperCase() === 'UNLOCKED') && (
                                            <>
                                                <button onClick={() => handleAction(row, 'VERIFY')} disabled={submitting} className="pdv-verify-btn">Verify</button>
                                                <button style={{ display: 'none' }} onClick={() => handleAction(row, 'REQUEST_BACK')} disabled={submitting} className="pdv-return-btn">Return</button>
                                            </>
                                        )}
                                        <button onClick={() => setDetailModal(row)} className="pdv-view-mini">View</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setDetailModal(row)} className="pdv-view-full" style={{
                                        background: isHistory ? '#059669' : '#7c3aed',
                                        color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontWeight: '700', cursor: 'pointer'
                                    }}>View</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    // ── Render ──
    return (
        <div className="pdv-api-container" style={{ fontFamily: "'Inter', sans-serif" }}>
            <header className="pdv-api-header">
                <div>
                    <h2 className="pdv-api-title">Plant Declaration Verification</h2>
                    <p className="pdv-api-subtitle">Reviewing vendor declarations with integrated historical logs.</p>
                </div>
                <button onClick={loadData} disabled={loading} className="pdv-api-btn-secondary">
                    {loading ? 'Refreshing…' : 'Refresh Data'}
                </button>
            </header>



            {error && <div className="pdv-api-error">⚠️ {error}</div>}

            {loading ? (
                <div className="pdv-api-loading">Loading transitions…</div>
            ) : (
                <>
                    {/* Module Tabs */}
                    <div className="pdv-api-module-cards">
                        {PLANT_DECLARATION_MODULES.filter(m => !m.hidden).map(mod => {
                            let pCount = (rawPendingByModule[mod.moduleId] || []).length;
                            let hCount = (rawCompletedByModule[mod.moduleId] || []).length;
                            
                            // If it's the Bench/Mould tab, include Long Line (12) counts
                            if (mod.moduleId === 2) {
                                pCount += (rawPendingByModule[12] || []).length;
                                hCount += (rawCompletedByModule[12] || []).length;
                            }


                            const isActive = selectedModuleId === mod.moduleId;
                            return (
                                <div
                                    key={mod.moduleId}
                                    onClick={() => setSelectedModuleId(mod.moduleId)}
                                    className={`pdv-api-module-card ${isActive ? 'active' : ''}`}
                                    style={{ 
                                        borderColor: isActive ? mod.color : '#e2e8f0', 
                                        background: isActive ? `${mod.color}10` : '#fff',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div className="pdv-api-mod-label" style={{ color: isActive ? mod.color : '#334155' }}>
                                        {mod.label}
                                        {mod.isUnderDevelopment && (
                                            <span style={{ 
                                                display: 'block',
                                                fontSize: '9px',
                                                fontWeight: '800',
                                                color: '#d97706',
                                                background: '#fef3c7',
                                                padding: '1px 6px',
                                                borderRadius: '4px',
                                                marginTop: '4px',
                                                width: 'fit-content',
                                                textTransform: 'uppercase'
                                            }}>
                                                Under Development
                                            </span>
                                        )}
                                    </div>
                                    {!mod.isUnderDevelopment && (
                                        <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
                                            <span style={{ fontSize: '10px', background: '#fff7ed', color: '#c2410c', padding: '2px 6px', borderRadius: '4px' }}>P: {pCount}</span>
                                            <span style={{ fontSize: '10px', background: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: '4px' }}>V: {hCount}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Tables */}
                    {selectedModuleId && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '10px' }}>
                            
                            {/* Pending Table */}
                            <div className="pdv-api-table-card" style={{ borderTop: '4px solid #f59e0b' }}>
                                <div className="pdv-api-table-header">
                                    <h3 style={{ margin: 0, fontSize: '16px', color: '#92400e' }}>Pending Verification</h3>
                                    {selectedModuleId === 2 && (
                                        <div className="pdv-bench-toggle">
                                            <button onClick={() => setBenchType('STRESS_BENCH')} className={benchType === 'STRESS_BENCH' ? 'active' : ''}>Stress</button>
                                            <button onClick={() => setBenchType('LONG_LINE')} className={benchType === 'LONG_LINE' ? 'active' : ''}>Long Line</button>
                                        </div>
                                    )}
                                </div>
                                {enriching ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                                        <div className="pdv-spinner-inline" style={{ marginBottom: '10px' }}></div>
                                        Fetching record details...
                                    </div>
                                ) : (
                                    <>
                                        {renderTable(
                                            selectedModuleId === 2
                                                ? [...(enrichedPending[2] || []), ...(enrichedPending[12] || [])].filter(r => {
                                                    const type = r.detail?.plantType || '';
                                                    return benchType === 'STRESS_BENCH' 
                                                        ? type.toUpperCase().includes('STRESS')
                                                        : type.toUpperCase().includes('LONG');
                                                  })
                                                : (enrichedPending[selectedModuleId] || []),
                                            false
                                        )}
                                        <PaginationControls 
                                            page={pendingPage} 
                                            pageSize={pendingPageSize} 
                                            setPage={setPendingPage} 
                                            setPageSize={setPendingPageSize} 
                                            totalElements={totalPendingElements} 
                                        />
                                    </>
                                )}
                            </div>

                            {/* Completed Table */}
                            <div className="pdv-api-table-card" style={{ borderTop: '4px solid #10b981' }}>
                                <div className="pdv-api-table-header">
                                    <h3 style={{ margin: 0, fontSize: '16px', color: '#065f46' }}>Verified and Locked Log</h3>
                                    {selectedModuleId === 2 && (
                                        <div className="pdv-bench-toggle">
                                            <button onClick={() => setBenchType('STRESS_BENCH')} className={benchType === 'STRESS_BENCH' ? 'active' : ''}>Stress</button>
                                            <button onClick={() => setBenchType('LONG_LINE')} className={benchType === 'LONG_LINE' ? 'active' : ''}>Long Line</button>
                                        </div>
                                    )}
                                </div>
                                {enriching ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                                        <div className="pdv-spinner-inline" style={{ marginBottom: '10px' }}></div>
                                        Fetching record details...
                                    </div>
                                ) : (
                                    <>
                                        {renderTable(
                                            selectedModuleId === 2
                                                ? [...(enrichedCompleted[2] || []), ...(enrichedCompleted[12] || [])].filter(r => {
                                                    const type = r.detail?.plantType || '';
                                                    return benchType === 'STRESS_BENCH' 
                                                        ? type.toUpperCase().includes('STRESS')
                                                        : type.toUpperCase().includes('LONG');
                                                  })
                                                : (enrichedCompleted[selectedModuleId] || []),
                                            true
                                        )}
                                        <PaginationControls 
                                            page={completedPage} 
                                            pageSize={completedPageSize} 
                                            setPage={setCompletedPage} 
                                            setPageSize={setCompletedPageSize} 
                                            totalElements={totalCompletedElements} 
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {detailModal && (
                detailModal.moduleId === 2 || detailModal.moduleId === 12 ? (
                    <BenchMouldUpdateModal
                        row={detailModal}
                        onClose={() => setDetailModal(null)}
                        onDone={loadData}
                    />
                ) : (
                    <VerificationDetailModal
                        row={detailModal}
                        moduleLabel={PLANT_DECLARATION_MODULES.find(m => m.moduleId === detailModal.moduleId)?.label || `Module ${detailModal.moduleId}`}
                        actionBy={effectiveUserId}
                        onClose={() => setDetailModal(null)}
                        onDone={loadData}
                    />
                )
            )}
        </div>
    );
};

export default PlantDeclarationVerification;
