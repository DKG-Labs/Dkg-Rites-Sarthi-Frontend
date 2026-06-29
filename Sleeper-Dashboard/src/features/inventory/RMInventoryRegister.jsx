import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiService } from '../../services/api';
import { useShift } from '../../context/ShiftContext';
import './RMInventoryRegister.css';

// ─── Module ID mapping: rmCategory.id → incoming module ID (workflow)
//  incoming: HTS=5, Cement=6, Admixture=7, Aggregates=8, SGCI=9, Dowel=10
//  consumption: HTS=13, Cement=14, Admixture=15, Aggregates=16, SGCI=17, Dowel=18
const CATEGORY_TO_MODULES = {
    hts:       { incoming: 5,  consumption: 13 },
    cement:    { incoming: 6,  consumption: 14 },
    admixture: { incoming: 7,  consumption: 15 },
    aggregate: { incoming: 8,  consumption: 16 },
    sgci:      { incoming: 9,  consumption: 17 },
    dowel:     { incoming: 10, consumption: 18 },
};

// getById fetchers for each incoming module
const INCOMING_FETCHERS = {
    5:  (id) => apiService.getHtsWireRecordById(id),
    6:  (id) => apiService.getCementRecordById(id),
    7:  (id) => apiService.getAdmixtureRecordById(id),
    8:  (id) => apiService.getAggregateRecordById(id),
    9:  (id) => apiService.getSgciRecordById(id),
    10: (id) => apiService.getDowelRecordById(id),
};

// Extract quantity from incoming RM record (field names differ per module)
const extractIncomingQty = (detail) => {
    if (!detail) return 0;
    return parseFloat(
        detail.totalQtyReceived ?? detail.quantity ?? detail.qty ?? detail.weight ?? detail.quantityReceived ?? detail.totalQuantity ?? 0
    );
};

// Extract subType from incoming RM record
const extractSubType = (detail) => {
    if (!detail) return '';
    return detail.gradeSpec ?? detail.grade ?? detail.subType ?? detail.type ?? '';
};

// Extract date from incoming RM record
const extractDate = (detail) => {
    if (!detail) return '';
    const raw = detail.dateOfReceipt ?? detail.receivedDate ?? detail.arrivalDate
        ?? detail.createdDate ?? detail.date ?? '';
    if (!raw) return '';
    
    // Normalise DD/MM/YYYY to YYYY-MM-DD
    if (typeof raw === 'string') {
        if (raw.includes('/')) {
            const [d, m, y] = raw.split('/');
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        if (raw.includes('-')) {
            const parts = raw.split('-');
            // if DD-MM-YYYY
            if (parts[0].length === 2 && parts[2].length === 4) {
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }
        return raw.split('T')[0];
    }
    return String(raw);
};

// ─── Skeleton row
const SkeletonRow = () => (
    <tr>
        {[1,2,3,4,5].map(i => (
            <td key={i} style={{ padding: '0.9rem 0.75rem' }}>
                <div style={{
                    height: 13, borderRadius: 6,
                    background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
                    backgroundSize: '400px 100%',
                    animation: 'reg-shimmer 1.4s ease-in-out infinite',
                    width: i === 2 ? '80%' : i === 5 ? '50%' : '70%'
                }} />
            </td>
        ))}
    </tr>
);

const RMInventoryRegister = ({ rmCategory }) => {
    const { dutyUnit } = useShift();
    const effectivePlantId = dutyUnit || localStorage.getItem('dutyUnit');

    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState(null);
    const [ledger, setLedger]           = useState([]);
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate]     = useState('');
    const [filterSubType, setFilterSubType]     = useState('');
    const [subTypeOptions, setSubTypeOptions]   = useState([]);

    const modules = CATEGORY_TO_MODULES[rmCategory?.id];

    const parseList = (res) => {
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.responseData)) return res.responseData;
        if (Array.isArray(res?.responseData?.content)) return res.responseData.content;
        return [];
    };

    const loadLedger = useCallback(async () => {
        if (!effectivePlantId || !modules) return;

        setLoading(true);
        setError(null);
        try {
            const { incoming: incomingModuleId, consumption: consumptionModuleId } = modules;

            // Fetch verified procurement + verified consumption + all consumption records in parallel
            const [completedIncomingRes, completedConsumptionRes, allConsumptionRes] = await Promise.all([
                apiService.getAllCompletedWorkflowTransitionsModuleWise(incomingModuleId, 0, 1000)
                    .catch(() => ({ responseData: [] })),
                apiService.getAllCompletedWorkflowTransitionsModuleWise(consumptionModuleId, 0, 1000)
                    .catch(() => ({ responseData: [] })),
                apiService.getRMConsumptionByPlantAll(effectivePlantId)
                    .catch(() => ({ responseData: [] })),
            ]);

            // ── Procurement rows (verified incoming RM records) ───────────────
            const incomingTransitions = parseList(completedIncomingRes)
                .filter(t => t.action !== 'REQUEST_BACK'); // only VERIFY actions

            // Fetch detail for each verified incoming record
            const fetcher = INCOMING_FETCHERS[incomingModuleId];
            const procuredRows = (
                await Promise.all(
                    incomingTransitions.map(async (t) => {
                        try {
                            const res = await fetcher(t.requestId);
                            const detail = res?.responseData ?? res;
                            if (!detail) return null;
                            return {
                                key: `proc-${t.requestId}`,
                                date: extractDate(detail),
                                subType: extractSubType(detail),
                                procured: extractIncomingQty(detail),
                                used: 0,
                                type: 'procured',
                            };
                        } catch {
                            return null;
                        }
                    })
                )
            ).filter(Boolean);

            // ── Consumption rows (verified consumption records) ────────────────
            const verifiedConsumptionRequestIds = new Set(
                parseList(completedConsumptionRes)
                    .filter(t => t.action !== 'REQUEST_BACK')
                    .map(t => String(t.requestId))
            );

            const allConsumption = parseList(allConsumptionRes);
            const usedRows = allConsumption
                .filter(r => verifiedConsumptionRequestIds.has(String(r.numericId)))
                .map(r => ({
                    key: `used-${r.numericId}`,
                    date: String(r.date ?? ''),
                    subType: r.subType ?? '',
                    procured: 0,
                    used: parseFloat(r.qty ?? 0),
                    type: 'used',
                }));

            // ── Merge and sort by date ascending ─────────────────────────────
            const merged = [...procuredRows, ...usedRows].sort((a, b) => {
                if (!a.date) return 1;
                if (!b.date) return -1;
                return a.date.localeCompare(b.date);
            });

            // ── Compute running balance ────────────────────────────────────────
            let balance = 0;
            const withBalance = merged.map(row => {
                balance += row.procured - row.used;
                return { ...row, balance };
            });

            setLedger(withBalance);

            // Collect unique subTypes for filter dropdown
            const types = [...new Set(withBalance.map(r => r.subType).filter(Boolean))];
            setSubTypeOptions(types);

        } catch (err) {
            setError(err.message || 'Failed to load inventory register.');
        } finally {
            setLoading(false);
        }
    }, [effectivePlantId, modules]);

    useEffect(() => {
        loadLedger();
    }, [loadLedger]);

    // Apply filters
    const filteredData = ledger.filter(row => {
        if (filterStartDate && row.date < filterStartDate) return false;
        if (filterEndDate   && row.date > filterEndDate)   return false;
        if (filterSubType   && row.subType !== filterSubType) return false;
        return true;
    });

    // Download PDF
    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(`${rmCategory.name} Inventory Register`, 14, 15);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

        autoTable(doc, {
            startY: 28,
            head: [['Date', 'Raw Material & Type', 'Quantity Procured', 'Quantity Used', 'Balance']],
            body: filteredData.map(row => [
                row.date,
                `${rmCategory.name}${row.subType ? ' - ' + row.subType : ''}`,
                row.procured > 0 ? `+${row.procured} ${rmCategory.unit || ''}` : '-',
                row.used     > 0 ? `-${row.used} ${rmCategory.unit || ''}` : '-',
                `${row.balance} ${rmCategory.unit || ''}`,
            ]),
            theme: 'striped',
            headStyles: { fillColor: [3, 105, 161] },
            styles: { fontSize: 9 },
            columnStyles: {
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right', fontStyle: 'bold' },
            },
        });

        doc.save(`${rmCategory.name}_Inventory_Register.pdf`);
    };

    const clearFilters = () => {
        setFilterStartDate('');
        setFilterEndDate('');
        setFilterSubType('');
    };

    return (
        <div className="rm-inventory-register fade-in">
            {/* Filter Bar */}
            <header className="reg-header">
                <div className="reg-filters">
                    <div className="filter-group">
                        <label>From Date</label>
                        <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
                    </div>
                    <div className="filter-group">
                        <label>To Date</label>
                        <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
                    </div>
                    <div className="filter-group">
                        <label>Sub-Type</label>
                        <select value={filterSubType} onChange={e => setFilterSubType(e.target.value)}>
                            <option value="">All Sub-Types</option>
                            {subTypeOptions.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <button className="clear-filter-btn" onClick={clearFilters}>Clear</button>
                    <button
                        style={{ marginLeft: '8px', padding: '0.4rem 0.75rem', background: '#0369a1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: filteredData.length === 0 ? 'not-allowed' : 'pointer', opacity: filteredData.length === 0 ? 0.5 : 1 }}
                        onClick={handleDownloadPDF}
                        disabled={filteredData.length === 0 || loading}
                    >
                        Download PDF
                    </button>
                </div>
            </header>

            {/* Error */}
            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    ⚠ {error}
                    <button onClick={loadLedger} style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 10px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>Retry</button>
                </div>
            )}

            {/* Table */}
            <div className="table-container">
                <table className="reg-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Raw Material &amp; Type</th>
                            <th className="num-col">Quantity Procured</th>
                            <th className="num-col">Quantity Used</th>
                            <th className="num-col">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                        ) : filteredData.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                    {ledger.length === 0
                                        ? 'No verified transactions found. Records appear here after both RM Procurement and RM Consumption are verified.'
                                        : 'No records match the current filters.'}
                                </td>
                            </tr>
                        ) : (
                            filteredData.map(row => (
                                <tr key={row.key}>
                                    <td>{row.date || '—'}</td>
                                    <td>
                                        <span style={{ color: '#0369a1', fontWeight: 600 }}>
                                            {rmCategory.name}
                                            {row.subType && <span style={{ color: '#64748b', fontWeight: 500 }}> — {row.subType}</span>}
                                        </span>
                                    </td>
                                    <td className="num-col positive">
                                        {row.procured > 0 ? `+${row.procured} ${rmCategory.unit}` : '-'}
                                    </td>
                                    <td className="num-col negative">
                                        {row.used > 0 ? `-${row.used} ${rmCategory.unit}` : '-'}
                                    </td>
                                    <td className="num-col balance-col">
                                        {row.balance} {rmCategory.unit}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Summary footer */}
            {!loading && filteredData.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', padding: '0.75rem 1rem', borderTop: '2px solid #e2e8f0', marginTop: 4, fontSize: '0.85rem', fontWeight: 700 }}>
                    <span style={{ color: '#059669' }}>
                        Total Procured: +{filteredData.reduce((s, r) => s + r.procured, 0)} {rmCategory.unit}
                    </span>
                    <span style={{ color: '#dc2626' }}>
                        Total Used: -{filteredData.reduce((s, r) => s + r.used, 0)} {rmCategory.unit}
                    </span>
                    <span style={{ color: '#0369a1' }}>
                        Current Balance: {filteredData[filteredData.length - 1]?.balance ?? 0} {rmCategory.unit}
                    </span>
                </div>
            )}
        </div>
    );
};

export default RMInventoryRegister;
