import React, { useState, useMemo } from 'react';
import './SleeperSummary.css';

const SleeperMprReport = ({ mprData = [], loading = false }) => {
    // Helper to format manufacturer name (take the first part before ~)
    const formatManufacturer = (name) => {
        if (!name) return 'N/A';
        return name.split('~')[0];
    };

    const data = Array.isArray(mprData) ? mprData : [];

    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
        let sortableItems = [...data];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Formatting before sort if necessary
                if (sortConfig.key === 'manufacturer') {
                    aValue = formatManufacturer(aValue) || '';
                    bValue = formatManufacturer(bValue) || '';
                } else if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = (bValue || '').toLowerCase();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig]);

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) {
            return <span style={{ opacity: 0.3, marginLeft: '4px', fontSize: '10px' }}>↕</span>;
        }
        return sortConfig.direction === 'asc' ? <span style={{ marginLeft: '4px', fontSize: '12px' }}>↑</span> : <span style={{ marginLeft: '4px', fontSize: '12px' }}>↓</span>;
    };

    if (loading) {
        return (
            <div className="sleeper-report-container animate-up" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                <div className="text-center">
                    <div className="spinner-border text-emerald-600 mb-3" style={{ width: '3rem', height: '3rem' }}></div>
                    <p className="text-slate-500 font-medium">Fetching Monthly Progress Report...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="sleeper-report-container animate-up">
            <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span>Monthly Progress Report (Sleeper)</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-export" style={{ padding: '8px 16px', background: '#1e293b', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                        📥 Export Excel
                    </button>
                    <input type="text" placeholder="Search PO, Rly..." className="prof-search" style={{ height: '36px', fontSize: '13px' }} />
                </div>
            </div>

            <div className="table-responsive prof-card">
                <table className="prof-table">
                    <thead>
                        <tr>
                            <th>S.NO.</th>
                            <th onClick={() => requestSort('rly')} style={{ cursor: 'pointer' }}>RLY {getSortIndicator('rly')}</th>
                            <th onClick={() => requestSort('poNo')} style={{ cursor: 'pointer' }}>PO NUMBER {getSortIndicator('poNo')}</th>
                            <th onClick={() => requestSort('manufacturer')} style={{ cursor: 'pointer' }}>MANUFACTURER {getSortIndicator('manufacturer')}</th>
                            <th onClick={() => requestSort('poQty')} className="text-right" style={{ cursor: 'pointer' }}>PO QTY {getSortIndicator('poQty')}</th>
                            <th onClick={() => requestSort('dispatchedInPeriod')} className="text-right" style={{ cursor: 'pointer' }}>DISPATCHED (MONTH) {getSortIndicator('dispatchedInPeriod')}</th>
                            <th onClick={() => requestSort('totalDispatched')} className="text-right" style={{ cursor: 'pointer' }}>TOTAL DISPATCHED {getSortIndicator('totalDispatched')}</th>
                            <th onClick={() => requestSort('balance')} className="text-right" style={{ cursor: 'pointer' }}>BALANCE {getSortIndicator('balance')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.length > 0 ? (
                            sortedData.map((row, idx) => (
                                <tr key={row.id || idx} className={idx % 2 === 0 ? 'row-odd' : 'row-even'}>
                                    <td>{idx + 1}</td>
                                    <td><span className="prof-badge" style={{ background: '#f1f5f9', color: '#475569' }}>{row.rly}</span></td>
                                    <td className="font-bold text-blue-700">{row.poNo}</td>
                                    <td>{formatManufacturer(row.manufacturer)}</td>
                                    <td className="text-right">{row.poQty?.toLocaleString()}</td>
                                    <td className="text-right text-emerald-600 font-medium">+{row.dispatchedInPeriod?.toLocaleString() || 0}</td>
                                    <td className="text-right font-bold">{row.totalDispatched?.toLocaleString() || 0}</td>
                                    <td className="text-right">
                                        <span
                                            className="font-bold"
                                            style={{ color: row.balance === 0 ? '#10b981' : '#64748b' }}
                                        >
                                            {row.balance?.toLocaleString() || 0}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="text-center p-8 text-slate-400">No report data found for the selected period.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 p-4 prof-card" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    <div className="text-center">
                        <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total PO Qty</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                            {data.reduce((acc, curr) => acc + (curr.poQty || 0), 0).toLocaleString()}
                        </div>
                    </div>
                    <div style={{ width: '1px', height: '30px', background: '#cbd5e1' }}></div>
                    <div className="text-center">
                        <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Dispatched</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                            {data.reduce((acc, curr) => acc + (curr.totalDispatched || 0), 0).toLocaleString()}
                        </div>
                    </div>
                    <div style={{ width: '1px', height: '30px', background: '#cbd5e1' }}></div>
                    <div className="text-center">
                        <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall Balance</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>
                            {data.reduce((acc, curr) => acc + (curr.balance || 0), 0).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SleeperMprReport;
