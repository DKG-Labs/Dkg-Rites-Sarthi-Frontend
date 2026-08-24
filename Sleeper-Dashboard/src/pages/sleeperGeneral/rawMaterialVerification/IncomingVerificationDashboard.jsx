import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../../../services/api';
import VerificationDetailModal from './VerificationDetailModal';
import { useShift } from '../../../context/ShiftContext';

// ─────────────────────────────────────────────
//  Constants – must match sleeper_module table
// ─────────────────────────────────────────────
// No hardcoded IDs used here anymore.


/**
 * sleeper_module table mapping:
 *  id | module_name
 *   1 | PLANT_PROFILE
 *   2 | BENCH_MOULD_MASTER
 *   3 | RAW_MATERIAL_SOURCE
 *   4 | MIX_DESIGN
 *   5 | HTS Wire
 *   6 | Cement
 *   7 | Admixture
 *   8 | Aggregates
 *   9 | SGCI Insert
 *  10 | Dowel
 */
const MODULE_CONFIG = [
    { moduleId: 1, label: 'Plant Profile', group: 'Plant Declaration', color: '#7c3aed' },
    { moduleId: 2, label: 'Bench / Mould', group: 'Plant Declaration', color: '#7c3aed' },
    { moduleId: 3, label: 'Raw Material Src', group: 'Plant Declaration', color: '#7c3aed' },
    { moduleId: 4, label: 'Mix Design', group: 'Plant Declaration', color: '#7c3aed' },
    { moduleId: 5, label: 'HTS Wire', group: 'Incoming Verification', color: '#0369a1' },
    { moduleId: 6, label: 'Cement', group: 'Incoming Verification', color: '#0369a1' },
    { moduleId: 7, label: 'Admixture', group: 'Incoming Verification', color: '#0369a1' },
    { moduleId: 8, label: 'Aggregates', group: 'Incoming Verification', color: '#0369a1' },
    { moduleId: 9, label: 'SGCI Insert', group: 'Incoming Verification', color: '#0369a1' },
    { moduleId: 10, label: 'Dowel', group: 'Incoming Verification', color: '#0369a1' },

    // Production Verification Group
    { moduleId: 11, label: 'Production Declaration', group: 'Production Verification', color: '#0891b2' },
];


// ─────────────────────────────────────────────
//  Sub-component: Record Detail Modal
// ─────────────────────────────────────────────
const DetailModal = ({ record, onClose, onAction, acting }) => {
    const [remarks, setRemarks] = useState('');
    const [pendingAction, setPendingAction] = useState(null); // 'VERIFY' | 'REQUEST_BACK'

    const handleConfirm = () => {
        if (pendingAction === 'REQUEST_BACK' && !remarks.trim()) {
            alert('Please enter remarks before requesting change.');
            return;
        }
        onAction(pendingAction, remarks.trim() || 'Verified by IE');
    };

    const detail = record.detail || {};

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={onClose}>
            <div style={{
                background: '#fff', borderRadius: '16px', padding: '28px',
                maxWidth: '640px', width: '90%', maxHeight: '85vh', overflowY: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
                            {record.moduleLabel} — Record #{record.requestId}
                        </h3>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                            Workflow Transition ID: {record.workflowTransitionId}
                        </span>
                    </div>
                    <button onClick={onClose} style={{
                        border: 'none', background: '#f1f5f9', borderRadius: '8px',
                        padding: '6px 12px', cursor: 'pointer', fontSize: '13px', color: '#475569'
                    }}>✕ Close</button>
                </div>

                {/* Record Data */}
                <div style={{
                    background: '#f8fafc', borderRadius: '12px', padding: '20px',
                    border: '1px solid #e2e8f0', marginBottom: '20px'
                }}>
                    <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
                        Record Details (Vendor Submitted)
                    </p>
                    {Object.keys(detail).length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '13px' }}>No detail data available from backend.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {Object.entries(detail).map(([key, val]) => {
                                if (typeof val === 'object' || val === null) return null;
                                return (
                                    <div key={key}>
                                        <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{String(val)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Action selection */}
                {!pendingAction ? (
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => setPendingAction('VERIFY')}
                            style={{
                                flex: 1, padding: '12px', border: 'none', borderRadius: '10px',
                                background: '#059669', color: '#fff', fontWeight: '700',
                                fontSize: '14px', cursor: 'pointer'
                            }}
                        >✓ Verify</button>
                        <button
                            onClick={() => setPendingAction('REQUEST_BACK')}
                            style={{
                                flex: 1, padding: '12px', border: 'none', borderRadius: '10px',
                                background: '#dc2626', color: '#fff', fontWeight: '700',
                                fontSize: '14px', cursor: 'pointer'
                            }}
                        >↩ Request Change</button>
                    </div>
                ) : (
                    <div style={{ border: `2px solid ${pendingAction === 'VERIFY' ? '#059669' : '#dc2626'}`, borderRadius: '12px', padding: '16px' }}>
                        <p style={{ margin: '0 0 10px', fontWeight: '700', color: pendingAction === 'VERIFY' ? '#059669' : '#dc2626' }}>
                            {pendingAction === 'VERIFY' ? '✓ Confirm Verification' : '↩ Confirm Request Change'}
                        </p>
                        <textarea
                            placeholder={pendingAction === 'VERIFY' ? 'Remarks (optional)…' : 'Enter clarification reason (required)…'}
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                            rows={3}
                            style={{
                                width: '100%', boxSizing: 'border-box', border: '1px solid #e2e8f0',
                                borderRadius: '8px', padding: '10px', fontSize: '13px',
                                resize: 'vertical', marginBottom: '12px'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={handleConfirm}
                                disabled={acting}
                                style={{
                                    flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
                                    background: pendingAction === 'VERIFY' ? '#059669' : '#dc2626',
                                    color: '#fff', fontWeight: '700', fontSize: '13px',
                                    cursor: acting ? 'not-allowed' : 'pointer',
                                    opacity: acting ? 0.6 : 1
                                }}
                            >{acting ? 'Submitting…' : 'Confirm'}</button>
                            <button
                                onClick={() => { setPendingAction(null); setRemarks(''); }}
                                style={{
                                    flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px',
                                    background: '#f8fafc', color: '#475569', fontWeight: '600',
                                    fontSize: '13px', cursor: 'pointer'
                                }}
                            >Back</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const MODULE_TABLE_FIELDS = {

    // 1️Plant Profile  ✅ already working
    1: [
        { label: "Plant Name", key: "plantNameLocation" },
        { label: "Vendor Code", key: "vendorCode" },
        { label: "Type Of Plant", key: "plantType" },
        { label: "Sheds / Lines", key: "numberOfSheds" }
    ],

    // 2️ Stress Bench / Mould Master
    2: [
        { label: "Entry Type", key: "entryType" },
        { label: "Bench(es)", key: "benchNo" },
        { label: "Category", key: "sleeperCategory" },
        { label: "Moulds/Bench", key: "mouldsPerBench" }
    ],

    // 3️ Raw Material Source
    3: [
        { label: "Material Type", key: "rawMaterialType" },
        { label: "Supplier Name", key: "supplierName" },
        { label: "Approval Ref", key: "approvalReference" }
    ],

    // 4️ Mix Design
    4: [
        { label: "Mix ID", key: "identification" },
        { label: "Authority", key: "concreteGrade" },
        { label: "A/C Ratio", key: "authorityOfApproval" }
    ],

    // 5️ HTS Wire
    5: [
        { label: "Manufacturer", key: "manufacturer" },
        { label: "Batch No", key: "invoiceNumber" },
        { label: "Diameter", key: "gradeSpec" }
    ],

    // 6️⃣ Cement
    6: [
        { label: "Brand", key: "manufacturer" },
        { label: "Grade", key: "gradeSpec" },
        { label: "Batch No", key: "invoiceNumber" }
    ],

    // 7️⃣ Admixture
    7: [
        { label: "Brand", key: "manufacturer" },
        { label: "Type", key: "gradeSpec" },
        { label: "Batch No", key: "invoiceNumber" }
    ],

    // 8️⃣ Aggregates
    8: [
        { label: "Source", key: "source" },
        { label: "Grade", key: "gradeSpec" },
        { label: "Challan No", key: "challanNumber" }
    ],

    // 9️⃣ SGCI Insert
    9: [
        { label: "Manufacturer", key: "manufacturer" },
        { label: "Batch No", key: "invoiceNumber" },
        { label: "Specification", key: "ritesIcNumber" },
        { label: "Test Date", key: "testDate" }
    ],

    // 🔟 Dowel
    10: [
        { label: "Manufacturer", key: "manufacturer" },
        { label: "Invoice No", key: "invoiceNumber" },
        { label: "Rites IC", key: "ritesIcNumber" }
    ],

    // 11 Production Declaration
    11: [
        { label: "Location", key: "productionUnit" },
        { label: "Date", key: "castingDate" },
        { label: "Batch No.", key: "batchNumber" },
        { label: "No. of Sleepers", key: "totalCastedSleepers" }
    ],
    // 12 Stress Bench / Mould Master
    12: [
        { label: "Entry Type", key: "entryType" },
        { label: "Bench(es)", key: "benchNo" },
        { label: "Category", key: "sleeperCategory" },
        { label: "Moulds/Bench", key: "mouldsPerBench" }
    ],
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

const parseToTimestamp = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const str = String(val).trim();
    if (!str) return 0;

    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        const t = new Date(str).getTime();
        if (!isNaN(t)) return t;
    }
    if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}/.test(str)) {
        const parts = str.split(/[\/-]/);
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d.getTime();
    }
    const t = new Date(str).getTime();
    return !isNaN(t) ? t : 0;
};

const getSecondarySortVal = (row) => {
    const detail = row.detail || {};
    const dateStr = row.createdDate || row.createdAt || detail.createdDate || detail.createdAt;
    if (dateStr) {
        const t = parseToTimestamp(dateStr);
        if (t > 0) return t;
    }
    const reqStr = String(row.requestId || detail.requestId || '').replace(/\D/g, '');
    if (reqStr) {
        const reqId = parseInt(reqStr, 10);
        if (!isNaN(reqId) && reqId > 0) return reqId;
    }
    if (row.workflowTransitionId) {
        const trId = Number(row.workflowTransitionId);
        if (!isNaN(trId) && trId > 0) return trId;
    }
    return 0;
};

const getDeclarationTimestamp = (item) => {
    const detail = item.detail || item;
    const dateStr = item.createdDate || item.createdAt || detail.createdDate || detail.createdAt;
    if (dateStr) {
        const t = parseToTimestamp(dateStr);
        if (t > 0) return t;
    }
    const reqStr = String(item.requestId || detail.requestId || item.workflowTransitionId || 0).replace(/\D/g, '');
    if (reqStr) {
        const reqId = parseInt(reqStr, 10);
        if (!isNaN(reqId) && reqId > 0) return reqId;
    }
    return 0;
};

// ─────────────────────────────────────────────
//  Sub-component: Record Table
// ─────────────────────────────────────────────
const RecordTable = ({ records, moduleId, onView, btnLabel, btnColor }) => {
    // Default sort by date / timestamp descending (latest declaration on top)
    const [sortConfig, setSortConfig] = useState({ key: 'castingDate', direction: 'desc' });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key) {
            direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            if (['date', 'castingDate', 'createdDate', 'index', 'batchNumber', 'totalCastedSleepers', 'noOfSleepers'].includes(key)) {
                direction = 'desc';
            }
        }
        setSortConfig({ key, direction });
    };

    const getRawFieldValue = (row, key) => {
        if (key === 'index') {
            return Number(row.requestId || row.workflowTransitionId || 0);
        }
        if (key === 'status') {
            return row.status || '';
        }
        const detail = row.detail || {};
        let rawVal = detail[key];

        if (key === 'manufacturer' || key === 'brand' || key === 'supplierName') {
            rawVal = detail.manufacturer || detail.brand || detail.source || detail.supplierName || '';
        }
        if (key === 'invoiceNo' || key === 'invoiceNumber' || key === 'challanNumber') {
            rawVal = detail.invoiceNo || detail.invoiceNumber || detail.challanNumber || detail.consignmentNo || detail.mtcNo || '';
        }
        if (key === 'dateOfReceipt' || key === 'castingDate' || key === 'date' || key === 'arrivalDate') {
            rawVal = detail.dateOfReceipt || detail.receivedDate || detail.arrivalDate || detail.castingDate || detail.createdDate || detail.createdAt || row.createdDate || row.createdAt || '';
        }
        return rawVal;
    };

    const sortedRecords = React.useMemo(() => {
        if (!records || !Array.isArray(records)) return [];
        const items = [...records];
        if (!sortConfig.key) return items;

        return items.sort((a, b) => {
            const rawA = getRawFieldValue(a, sortConfig.key);
            const rawB = getRawFieldValue(b, sortConfig.key);

            let valA = rawA ?? '';
            let valB = rawB ?? '';

            let primaryComp = 0;

            const timeA = parseToTimestamp(valA);
            const timeB = parseToTimestamp(valB);
            const isDateKey = ['date', 'castingDate', 'createdDate', 'dateOfReceipt', 'arrivalDate'].includes(sortConfig.key);

            if ((isDateKey || (timeA > 0 && timeB > 0)) && typeof valA === 'string' && typeof valB === 'string' && valA.length >= 8 && valB.length >= 8) {
                primaryComp = timeA - timeB;
            } else {
                const numA = Number(valA);
                const numB = Number(valB);
                const isNumA = !isNaN(numA) && typeof valA !== 'boolean' && String(valA).trim() !== '';
                const isNumB = !isNaN(numB) && typeof valB !== 'boolean' && String(valB).trim() !== '';

                if (isNumA && isNumB) {
                    primaryComp = numA - numB;
                } else {
                    const strA = String(valA).trim();
                    const strB = String(valB).trim();
                    primaryComp = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
                }
            }

            if (primaryComp !== 0) {
                return sortConfig.direction === 'asc' ? primaryComp : -primaryComp;
            }

            // TIE-BREAKER: When primary values match (e.g. same date 2026-08-07), sort latest declaration first!
            const secA = getSecondarySortVal(a);
            const secB = getSecondarySortVal(b);
            return secB - secA;
        });
    }, [records, sortConfig]);

    const renderSortIcon = (key) => {
        const isCurrent = sortConfig.key === key;
        return (
            <span style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                marginLeft: '6px',
                fontSize: '11px',
                color: isCurrent ? '#0891b2' : '#94a3b8',
                fontWeight: isCurrent ? 'bold' : 'normal'
            }}>
                {isCurrent ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
            </span>
        );
    };

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                    <tr style={{ background: '#f8fafc' }}>
                        <th 
                            style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleSort('index')}
                            title="Click to sort by index / ID"
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                # {renderSortIcon('index')}
                            </div>
                        </th>
                        {MODULE_TABLE_FIELDS[moduleId]?.map(col => (
                            <th 
                                key={col.key} 
                                style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
                                onClick={() => handleSort(col.key)}
                                title={`Click to sort by ${col.label}`}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    {col.label} {renderSortIcon(col.key)}
                                </div>
                            </th>
                        ))}
                        <th 
                            style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleSort('status')}
                            title="Click to sort by status"
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                Status {renderSortIcon('status')}
                            </div>
                        </th>
                        <th style={thStyle}>Details</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedRecords.map((row, idx) => {
                        const { label, bg, color } = getStatusDisplay(row.status);
                        return (
                            <tr key={row.workflowTransitionId || idx}
                                style={{ borderBottom: '1px solid #f1f5f9' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                            >
                                <td style={tdStyle}>{idx + 1}</td>
                                {MODULE_TABLE_FIELDS[moduleId]?.map(col => {
                                    const detail = row.detail || {};
                                    let rawVal = detail[col.key];

                                    if (col.key === 'manufacturer' || col.label === 'Vendor') {
                                        rawVal = detail.manufacturer || detail.brand || detail.source || detail.supplierName || '—';
                                    }
                                    if (col.key === 'invoiceNo' || col.key === 'invoiceNumber' || col.label === 'Invoice' || col.label === 'Consignment') {
                                        rawVal = detail.invoiceNo || detail.invoiceNumber || detail.challanNumber || detail.consignmentNo || detail.mtcNo || '—';
                                    }
                                    if (col.key === 'dateOfReceipt' || col.label === 'Date' || col.label === 'Arrival Date' || col.label === 'Casting Date') {
                                        rawVal = detail.dateOfReceipt || detail.receivedDate || detail.arrivalDate || detail.castingDate || detail.createdDate || detail.createdAt || '—';
                                    }

                                    const isDateValue = typeof rawVal === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(rawVal);
                                    const formattedVal = isDateValue ? new Date(rawVal).toLocaleDateString('en-GB') : (rawVal ?? '—');
                                    
                                    return (
                                        <td key={col.key} style={tdStyle}>
                                            {formattedVal}
                                        </td>
                                    );
                                })}
                                <td style={tdStyle}>
                                    <span style={{
                                        background: bg, color: color,
                                        padding: '3px 10px', borderRadius: '6px',
                                        fontSize: '11px', fontWeight: '700',
                                        border: `1px solid ${color}20`
                                    }}>
                                        {label}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <button
                                        onClick={() => onView(row)}
                                        style={{
                                            background: btnColor, color: '#fff',
                                            border: 'none', borderRadius: '8px',
                                            padding: '7px 14px', fontSize: '12px',
                                            fontWeight: '700', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            whiteSpace: 'nowrap', transition: 'background 0.15s',
                                        }}
                                    >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                        </svg>
                                        {btnLabel}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// ─────────────────────────────────────────────
//  Sub-component: Pagination Controls
// ─────────────────────────────────────────────
const PaginationControls = ({ page, setPage, pageSize, setPageSize, loading, totalItems }) => {
    const totalPages = Math.ceil((totalItems || 0) / pageSize);
    const hasNext = page < totalPages - 1;
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Fetch Size:</span>
                <select 
                    value={pageSize} 
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#334155', fontWeight: '600', outline: 'none', cursor: 'pointer' }}
                    disabled={loading}
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
                    style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: page === 0 ? '#f1f5f9' : '#fff', color: page === 0 ? '#94a3b8' : '#334155', cursor: page === 0 ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s' }}
                >Prev</button>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Page {page + 1} of {Math.max(1, totalPages)}</span>
                <button 
                    onClick={() => setPage(p => p + 1)} 
                    disabled={loading || !hasNext} 
                    style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#334155', cursor: !hasNext ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s', opacity: !hasNext ? 0.5 : 1 }}
                >Next</button>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
//  Main Dashboard Component
// ─────────────────────────────────────────────

const IncomingVerificationDashboard = ({ initialGroup = null, initialModuleId = null, hideHeader = false }) => {
    const { userId, dutyUnit } = useShift();
    const effectiveUserId = userId || localStorage.getItem('userId');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Records enriched with detail data per module
    const [enrichedByModule, setEnrichedByModule] = useState({}); // { moduleId: { pending: [], verified: [] } }

    const [selectedModuleId, setSelectedModuleId] = useState(null);
    const [detailModal, setDetailModal] = useState(null); // row to show in the detail modal
    const [activeSubTab, setActiveSubTab] = useState('pending'); // 'pending' or 'verified'
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPending, setTotalPending] = useState(0);
    const [totalVerified, setTotalVerified] = useState(0);
    const paginationCache = useRef({});

    // Filter MODULE_CONFIG by initialGroup or initialModuleId if provided
    const filteredModules = initialModuleId 
        ? MODULE_CONFIG.filter(m => m.moduleId === initialModuleId)
        : initialGroup
            ? MODULE_CONFIG.filter(m => m.group === initialGroup)
            : MODULE_CONFIG;

    const filteredModuleIds = filteredModules.map(m => m.moduleId);

    // ── Load Data ──
    const loadData = useCallback(async (forceRefresh) => {
        const isForceRefresh = forceRefresh === true; // explicitly boolean true
        
        if (isForceRefresh) {
            paginationCache.current = {};
        }

        const cacheKey = `${page}-${pageSize}`;

        const isModule11 = filteredModuleIds.length === 1 && filteredModuleIds[0] === 11;

        if (!isForceRefresh && isModule11 && paginationCache.current[cacheKey]) {
            setEnrichedByModule(paginationCache.current[cacheKey]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Fetch Pending First
            const pendingRes = isModule11
                ? await apiService.getAllPendingWorkflowTransitionsModuleWise('IE', 11, dutyUnit, page, pageSize)
                : await apiService.getAllPendingWorkflowTransitions('IE', effectiveUserId, dutyUnit);

            const parseRes = (res) => {
                if (Array.isArray(res)) return res;
                if (Array.isArray(res?.responseData)) return res.responseData;
                if (Array.isArray(res?.responseData?.content)) return res.responseData.content;
                return [];
            };
            const cleanStr = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const filterByModuleAndPlant = (list) => list.filter(r => {
                const isCorrectModule = filteredModuleIds.includes(r.moduleId);
                if (!isCorrectModule) return false;
                if (!dutyUnit) return true;
                const p1 = cleanStr(r.plantId);
                const p2 = cleanStr(dutyUnit);
                if (!p1) return true;
                return p1 === p2 || p1.includes(p2) || p2.includes(p1);
            });

            const pendingList = parseRes(pendingRes);
            let myPending = filterByModuleAndPlant(pendingList);

            if (isModule11) {
                myPending.sort((a, b) => getDeclarationTimestamp(b) - getDeclarationTimestamp(a));
                setTotalPending(pendingRes?.responseData?.totalElements ?? myPending.length);
            } else {
                setTotalPending(myPending.length);
            }

            const groupedPending = {};
            for (const mod of filteredModules) {
                groupedPending[mod.moduleId] = [];
            }
            myPending.forEach(item => {
                if (groupedPending[item.moduleId]) groupedPending[item.moduleId].push(item);
            });

            const enriched = {};
            for (const [modId, items] of Object.entries(groupedPending)) {
                const numId = Number(modId);
                const modConf = MODULE_CONFIG.find(m => m.moduleId === numId);
                enriched[numId] = {
                    pending: items.map(item => ({ ...item, detail: item, moduleLabel: modConf?.label || `Module ${numId}` })),
                    verified: []
                };
            }

            setEnrichedByModule(enriched);
            setLoading(false); // Render pending immediately!

            // Auto-select first module that has records if none selected
            if (filteredModules.length > 0 && selectedModuleId === null) {
                const firstWithRecords = filteredModules.find(m => (enriched[m.moduleId]?.pending || []).length > 0);
                setSelectedModuleId(firstWithRecords ? firstWithRecords.moduleId : filteredModules[0].moduleId);
            }

            // Now fetch Completed asynchronously
            (async () => {
                try {
                    const completedRes = isModule11
                        ? await apiService.getAllCompletedWorkflowTransitionsModuleWise(11, dutyUnit, page, pageSize)
                        : await apiService.getAllCompletedWorkflowTransitions(effectiveUserId, dutyUnit);

                    const verifiedList = parseRes(completedRes);
                    let myVerified = filterByModuleAndPlant(verifiedList);

                    if (isModule11) {
                        myVerified.sort((a, b) => getDeclarationTimestamp(b) - getDeclarationTimestamp(a));
                        setTotalVerified(completedRes?.responseData?.totalElements ?? myVerified.length);
                    } else {
                        setTotalVerified(myVerified.length);
                    }

                    setEnrichedByModule(prev => {
                        const newEnriched = { ...prev };
                        const verifiedGrouped = {};
                        for (const mod of filteredModules) { verifiedGrouped[mod.moduleId] = []; }
                        myVerified.forEach(item => { if (verifiedGrouped[item.moduleId]) verifiedGrouped[item.moduleId].push(item); });

                        for (const [modId, verifiedItems] of Object.entries(verifiedGrouped)) {
                            const numId = Number(modId);
                            const modConf = MODULE_CONFIG.find(m => m.moduleId === numId);
                            if (!newEnriched[numId]) {
                                newEnriched[numId] = { pending: [] };
                            }
                            newEnriched[numId].verified = verifiedItems.map(item => ({ ...item, detail: item, moduleLabel: modConf?.label || `Module ${numId}` }));
                        }
                        return newEnriched;
                    });
                } catch (err) {
                    console.error('Failed to load completed records.', err);
                }
            })();

        } catch (err) {
            setError(err.message || 'Failed to load records.');
            setLoading(false);
        }
    }, [initialGroup, effectiveUserId, dutyUnit, page, pageSize]); // eslint-disable-line

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Action is now handled inside VerificationDetailModal — kept only for API compatibility
    // loadData is passed to modal's onDone prop

    const pendingCount = Object.values(enrichedByModule).reduce((acc, curr) => acc + (curr.pending?.length || 0), 0);
    const verifiedCount = Object.values(enrichedByModule).reduce((acc, curr) => acc + (curr.verified?.length || 0), 0);
    
    const currentPending = enrichedByModule[selectedModuleId]?.pending || [];
    const currentVerified = enrichedByModule[selectedModuleId]?.verified || [];

    const filterBySearch = (items) => {
        if (!searchTerm.trim()) return items;
        const term = searchTerm.toLowerCase().trim();
        return items.filter(item => {
            const detail = item.detail || item;
            const fieldsToSearch = [
                item.requestId,
                item.batchNumber,
                detail.batchNumber,
                item.productionUnit,
                detail.productionUnit,
                item.castingDate,
                detail.castingDate,
                item.totalCastedSleepers,
                detail.totalCastedSleepers,
                item.status,
                detail.status,
                item.vendorCode,
                detail.vendorCode,
                item.plantId,
                detail.plantId,
                item.remarks,
                detail.remarks,
                ...(typeof detail === 'object' && detail !== null ? Object.values(detail).flatMap(v => {
                    if (typeof v === 'string' || typeof v === 'number') return [v];
                    if (Array.isArray(v)) return v.flatMap(i => typeof i === 'object' && i !== null ? Object.values(i) : [i]);
                    return [];
                }) : [])
            ].map(val => String(val || '').toLowerCase());

            return fieldsToSearch.some(str => str.includes(term));
        });
    };

    const filteredPending = filterBySearch(currentPending);
    const filteredVerified = filterBySearch(currentVerified);

    // ─────────────────────────────────────────────
    //  Render
    // ─────────────────────────────────────────────
    return (
        <div className="verification-dashboard cement-forms-scope" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Header */}
            {!hideHeader && (
                <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#13343b', margin: 0 }}>
                            IE {initialGroup || 'Verification'} Dashboard
                        </h2>
                        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px' }}>
                            Records assigned to User ID: {effectiveUserId || 'Unknown'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => loadData(true)}
                            disabled={loading}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                background: '#fff', color: '#334155', fontSize: '12px', fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                            {loading ? 'Refreshing…' : 'Refresh'}
                        </button>
                    </div>
                </header>
            )}

            {/* Summary banner */}
            <div style={{
                background: pendingCount > 0 ? '#fff7ed' : '#f0fdf4',
                border: `1px solid ${pendingCount > 0 ? '#fed7aa' : '#bbf7d0'}`,
                borderRadius: '12px', padding: '14px 20px',
                display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'
            }}>
                <span style={{ fontSize: '22px' }}>{pendingCount > 0 ? '🔔' : '✅'}</span>
                <div>
                    <strong style={{ fontSize: '14px', color: '#1e293b' }}>
                        {pendingCount > 0 ? `${pendingCount} record(s) pending your verification` : 'All records verified — no pending items'}
                    </strong>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Verified so far: {verifiedCount} record(s)
                    </div>
                </div>
            </div>

            {/* Error state */}
            {error && (
                <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px',
                    padding: '16px', marginBottom: '20px', color: '#dc2626', fontSize: '13px'
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Loading skeleton */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                    Loading pending workflow transitions…
                </div>
            )}

            {!loading && (
                <>
                    {/* Module Tab Cards - hide if only one module is selected via initialModuleId */}
                    {!initialModuleId && (
                        <div style={{
                            display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px'
                        }}>
                            {filteredModules.map(mod => {
                                const count = (enrichedByModule[mod.moduleId]?.pending || []).length;
                                const isActive = selectedModuleId === mod.moduleId;
                                return (
                                    <div
                                        key={mod.moduleId}
                                        onClick={() => setSelectedModuleId(mod.moduleId)}
                                        style={{
                                            minWidth: '130px', padding: '12px 16px',
                                            borderRadius: '10px', cursor: 'pointer',
                                            border: `2px solid ${isActive ? mod.color : '#e2e8f0'}`,
                                            background: isActive ? `${mod.color}10` : '#fff',
                                            transition: 'all 0.18s', userSelect: 'none'
                                        }}
                                    >
                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                                            {mod.group}
                                        </div>
                                        <div style={{ fontWeight: '700', fontSize: '13px', color: isActive ? mod.color : '#334155' }}>
                                            {mod.label}
                                        </div>
                                        <div style={{ marginTop: '6px' }}>
                                            {count > 0 ? (
                                                <span style={{
                                                    fontSize: '10px', fontWeight: '700',
                                                    background: '#fff7ed',
                                                    color: '#c2410c',
                                                    padding: '2px 8px', borderRadius: '10px',
                                                    border: '1px solid #fed7aa'
                                                }}>
                                                    {count} Pending
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '10px', color: '#94a3b8' }}>All Clear</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {selectedModuleId && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            
                            {/* Toggle Tabs */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                background: '#f1f5f9', 
                                padding: '4px', 
                                borderRadius: '16px', 
                                width: 'fit-content',
                                border: '1px solid #e2e8f0'
                            }}>
                                <button 
                                    onClick={() => setActiveSubTab('pending')} 
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '10px 20px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: activeSubTab === 'pending' ? '#fff' : 'transparent',
                                        boxShadow: activeSubTab === 'pending' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                                        cursor: 'pointer',
                                        fontWeight: '700',
                                        color: activeSubTab === 'pending' ? '#1e293b' : '#64748b',
                                        fontSize: '13px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div>
                                    {initialGroup === 'Production Verification' ? 'Pending Declaration' : 'Pending Verification'}
                                    <span style={{ 
                                        background: activeSubTab === 'pending' ? '#f1f5f9' : '#e2e8f0', 
                                        color: '#475569',
                                        padding: '2px 8px', 
                                        borderRadius: '8px', 
                                        fontSize: '11px',
                                        fontWeight: '800'
                                    }}>{currentPending.length}</span>
                                </button>
                                <button 
                                    onClick={() => setActiveSubTab('verified')} 
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '10px 20px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: activeSubTab === 'verified' ? '#fff' : 'transparent',
                                        boxShadow: activeSubTab === 'verified' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                                        cursor: 'pointer',
                                        fontWeight: '700',
                                        color: activeSubTab === 'verified' ? '#1e293b' : '#64748b',
                                        fontSize: '13px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                                    {initialGroup === 'Production Verification' ? 'Verified Production' : 'Verified Records'}
                                    <span style={{ 
                                        background: activeSubTab === 'verified' ? '#d1fae5' : '#e2e8f0', 
                                        color: activeSubTab === 'verified' ? '#065f46' : '#475569',
                                        padding: '2px 8px', 
                                        borderRadius: '8px', 
                                        fontSize: '11px',
                                        fontWeight: '800'
                                    }}>{currentVerified.length}</span>
                                </button>
                            </div>

                            {activeSubTab === 'pending' ? (
                                <div style={{
                                    background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden'
                                }}>
                                    <div style={{
                                        padding: '16px 24px', borderBottom: '1px solid #f1f5f9',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        background: '#fff7ed', flexWrap: 'wrap', gap: '12px'
                                    }}>
                                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#c2410c' }}>
                                            Pending Verification
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                background: '#fff', border: '1px solid #fed7aa', borderRadius: '8px',
                                                padding: '5px 12px', minWidth: '240px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                            }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                                </svg>
                                                <input
                                                    type="text"
                                                    placeholder="Search batch, location, date..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '12px', color: '#1e293b' }}
                                                />
                                                {searchTerm && (
                                                    <button
                                                        onClick={() => setSearchTerm('')}
                                                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '12px', padding: 0 }}
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                            <span style={{ fontSize: '10px', fontWeight: '700', color: '#c2410c', background: '#fff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #fed7aa' }}>
                                                {filteredPending.length} Items
                                            </span>
                                        </div>
                                    </div>

                                    {filteredPending.length === 0 ? (
                                        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                            <div style={{ fontSize: '24px', marginBottom: '10px' }}>{searchTerm ? '🔍' : '✅'}</div>
                                            <strong>{searchTerm ? `No matching records found for "${searchTerm}"` : 'No pending records for this module on the current page.'}</strong>
                                        </div>
                                    ) : (
                                        <RecordTable 
                                            records={filteredPending} 
                                            moduleId={selectedModuleId} 
                                            onView={setDetailModal} 
                                            btnLabel="Verify"
                                            btnColor="#0369a1"
                                        />
                                    )}
                                    {filteredModuleIds.length === 1 && filteredModuleIds[0] === 11 && (
                                        <PaginationControls page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} loading={loading} totalItems={totalPending} />
                                    )}
                                </div>
                            ) : (
                                <div style={{
                                    background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden'
                                }}>
                                    <div style={{
                                        padding: '16px 24px', borderBottom: '1px solid #f1f5f9',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        background: '#f0fdf4', flexWrap: 'wrap', gap: '12px'
                                    }}>
                                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#166534' }}>
                                            Verified Production Records
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                background: '#fff', border: '1px solid #bbf7d0', borderRadius: '8px',
                                                padding: '5px 12px', minWidth: '240px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                            }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                                </svg>
                                                <input
                                                    type="text"
                                                    placeholder="Search batch, location, date..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '12px', color: '#1e293b' }}
                                                />
                                                {searchTerm && (
                                                    <button
                                                        onClick={() => setSearchTerm('')}
                                                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '12px', padding: 0 }}
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                            <span style={{ fontSize: '10px', fontWeight: '700', color: '#166534', background: '#fff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                                                {filteredVerified.length} Items
                                            </span>
                                        </div>
                                    </div>

                                    {filteredVerified.length === 0 ? (
                                        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                            <div style={{ fontSize: '24px', marginBottom: '10px' }}>{searchTerm ? '🔍' : '📋'}</div>
                                            <strong>{searchTerm ? `No matching records found for "${searchTerm}"` : 'No records have been verified yet on the current page.'}</strong>
                                        </div>
                                    ) : (
                                        <RecordTable 
                                            records={filteredVerified} 
                                            moduleId={selectedModuleId} 
                                            onView={setDetailModal} 
                                            btnLabel="View Detail"
                                            btnColor="#64748b"
                                        />
                                    )}
                                    {filteredModuleIds.length === 1 && filteredModuleIds[0] === 11 && (
                                        <PaginationControls page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} loading={loading} totalItems={totalVerified} />
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ── Detail + Action Modal ── */}
            {detailModal && (
                <VerificationDetailModal
                    row={detailModal}
                    moduleLabel={MODULE_CONFIG.find(m => m.moduleId === detailModal.moduleId)?.label || `Module ${detailModal.moduleId}`}
                    actionBy={effectiveUserId}
                    onClose={() => setDetailModal(null)}
                    onDone={() => loadData(true)}
                />
            )}
        </div>
    );
};

// Shared table cell styles
const thStyle = {
    padding: '10px 16px', textAlign: 'left',
    fontSize: '11px', fontWeight: '700', color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    borderBottom: '1px solid #e2e8f0'
};
const tdStyle = {
    padding: '12px 16px', color: '#334155', verticalAlign: 'middle'
};

export default IncomingVerificationDashboard;
