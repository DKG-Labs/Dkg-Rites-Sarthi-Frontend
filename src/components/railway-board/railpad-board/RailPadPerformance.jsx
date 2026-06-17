import React from 'react';
import { downloadExcel } from '../SharedComponents';

const RailPadPerformance = ({ perfData, loading, error }) => {
    // Format ie.name to Title Case
    const formatIeName = (name) => {
        if (!name || name === 'N/A' || name === 'null') return 'N/A';
        return name
            .split('.')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Map the performance data dynamically from props
    const performanceData = (perfData && perfData.length > 0) ? perfData.map(row => ({
        plant: row.manufacturerName || row.plant || 'N/A',
        rio: row.rio || 'N/A',
        ieName: formatIeName(row.username || row.ieName),
        stage: row.stage || 'PROCESS',
        inspected: Number(row.inspectedQty ?? row.inspected ?? 0),
        accepted: Number(row.acceptedQty ?? row.accepted ?? 0),
        rejected: Number(row.rejectedQty ?? row.rejected ?? 0),
        rejPct: Number(row.rejectionPercentage ?? row.rejPct ?? 0)
    })) : [];

    if (error) {
        return (
            <div className="railpad-performance-container fade-in" style={{ padding: '20px' }}>
                <div className="alert alert-danger" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', padding: '15px', borderRadius: '8px' }}>
                    <h5 style={{ fontWeight: 'bold', marginBottom: '8px' }}>⚠️ Data Fetch Error</h5>
                    <p style={{ margin: 0, fontSize: '14px' }}>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="railpad-performance-container fade-in">
            <div className="prof-card">
                <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>
                        Performance Monitoring Matrix
                    </span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            className="prof-badge" 
                            style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', cursor: 'pointer' }}
                            onClick={() => {
                                const headers = [
                                    { label: 'MANUFACTURING PLANT', key: 'plant' },
                                    { label: 'RIO', key: 'rio' },
                                    { label: 'INSPECTING ENGINEER (IE)', key: 'ieName' },
                                    { label: 'STAGE', key: 'stage' },
                                    { label: 'INSPECTED (PCS)', key: 'inspected' },
                                    { label: 'ACCEPTED (PCS)', key: 'accepted' },
                                    { label: 'REJECTED (PCS)', key: 'rejected' },
                                    { label: 'REJECTION %', key: 'rejPct' }
                                ];
                                const excelData = performanceData.map((row, i) => ({
                                    ...row,
                                    rejPct: `${row.rejPct.toFixed(2)}%`
                                }));
                                downloadExcel(excelData, headers, 'RailPad_Performance_Monitoring_Matrix');
                            }}
                        >
                            <i className="fa-solid fa-download" style={{ marginRight: '6px' }}></i> Export Excel
                        </button>
                    </div>
                </div>

                <div className="table-responsive" style={{ position: 'relative', minHeight: loading ? '200px' : 'auto' }}>
                    {loading && (
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(255,255,255,0.7)', zIndex: 10,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div className="spinner-small" style={{ width: '24px', height: '24px', border: '3px solid #f3f3f3', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        </div>
                    )}
                    <table className="prof-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>MANUFACTURING PLANT</th>
                                <th>RIO</th>
                                <th>INSPECTING ENGINEER (IE)</th>
                                <th>STAGE</th>
                                <th className="text-right">INSPECTED (PCS)</th>
                                <th className="text-right">ACCEPTED (PCS)</th>
                                <th className="text-right">REJECTED (PCS)</th>
                                <th className="text-right">REJECTION %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {performanceData.length > 0 ? (
                                performanceData.map((row, i) => (
                                    <tr key={i} className={i % 2 === 0 ? 'row-odd' : 'row-even'}>
                                        <td>{i + 1}</td>
                                        <td style={{ fontWeight: '600' }}>{row.plant}</td>
                                        <td><span className="prof-badge" style={{ background: '#f0fdf4', color: '#166534' }}>{row.rio}</span></td>
                                        <td>👤 {row.ieName}</td>
                                        <td>
                                            <span className="prof-badge" style={{ 
                                                background: row.stage === 'PROCESS' ? '#f0f9ff' : '#f5f3ff', 
                                                color: row.stage === 'PROCESS' ? '#075985' : '#5b21b6' 
                                            }}>
                                                {row.stage}
                                            </span>
                                        </td>
                                        <td className="text-right">{row.inspected.toLocaleString()}</td>
                                        <td className="text-right" style={{ color: '#16a34a' }}>{row.accepted.toLocaleString()}</td>
                                        <td className="text-right" style={{ color: '#dc2626' }}>{row.rejected.toLocaleString()}</td>
                                        <td className="text-right">
                                            <span className="prof-badge" style={{ 
                                                background: '#fff7ed', 
                                                color: '#9a3412',
                                                minWidth: '50px',
                                                textAlign: 'center'
                                            }}>
                                                {(Number(row.rejPct) || 0).toFixed(2)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                        No performance records found matching the filter criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RailPadPerformance;
