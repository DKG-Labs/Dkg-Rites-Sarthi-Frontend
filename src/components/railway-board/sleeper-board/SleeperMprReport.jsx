import React from 'react';
import './SleeperSummary.css';

const SleeperMprReport = ({ mprData = [], loading = false }) => {
    // Helper to format manufacturer name (take the first part before ~)
    const formatManufacturer = (name) => {
        if (!name) return 'N/A';
        return name.split('~')[0];
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

    const data = Array.isArray(mprData) ? mprData : [];

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
                            <th>RLY</th>
                            <th>PO NUMBER</th>
                            <th>MANUFACTURER</th>
                            <th className="text-right">PO QTY</th>
                            <th className="text-right">DISPATCHED (MONTH)</th>
                            <th className="text-right">TOTAL DISPATCHED</th>
                            <th className="text-right">BALANCE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? (
                            data.map((row, idx) => (
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
