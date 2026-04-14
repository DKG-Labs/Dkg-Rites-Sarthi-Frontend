import React, { useState } from 'react';
import './SleeperSummary.css';

const SleeperLwclReport = () => {
    const [filters, setFilters] = useState({
        manufacturer: '',
        plant: '',
        batchNo: ''
    });

    // Mock Data for filters
    const manufacturers = ['Patil Industries', 'Concrete Sleepers India', 'Dayal Sleepers'];
    const plants = ['Kargi Road', 'Wadiyaram', 'Noida Unit'];
    const batches = ['B-2024-05-001', 'B-2024-05-002', 'B-2024-06-015'];

    // Mock results
    const lwclData = filters.batchNo ? [
        { label: 'Batch Number', value: filters.batchNo, icon: '📦' },
        { label: 'Manufacturer', value: filters.manufacturer || 'Patil Industries', icon: '🏭' },
        { label: 'Casting Date', value: '2024-05-12', icon: '📅' },
        { label: 'Closing Status', value: 'CLOSED', icon: '✅', status: 'success' },
    ] : [];

    const details = filters.batchNo ? [
        { stage: 'Production Phase', qty: 500, date: '2024-05-12', result: 'Completed' },
        { stage: 'Steam Curing', qty: 500, date: '2024-05-13', result: 'Passed' },
        { stage: 'Demoulding', qty: 495, date: '2024-05-14', result: '5 Rejected' },
        { stage: 'Water Curing (14 Days)', qty: 495, date: '2024-05-28', result: 'Completed' },
        { stage: 'Final Inspection', qty: 495, date: '2024-05-30', result: '492 Accepted' },
    ] : [];

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="sleeper-report-container animate-up">
            <div className="sec-title mb-4">
                <span>Lot Wise Closed Loop Analysis (Sleeper)</span>
            </div>

            <div className="prof-card mb-6" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div className="g3" style={{ padding: '5px' }}>
                    <div className="filter-group">
                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>MANUFACTURER</label>
                        <select
                            className="prof-select"
                            value={filters.manufacturer}
                            onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
                        >
                            <option value="">Select Manufacturer</option>
                            {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>PLANT</label>
                        <select
                            className="prof-select"
                            value={filters.plant}
                            onChange={(e) => handleFilterChange('plant', e.target.value)}
                        >
                            <option value="">Select Plant</option>
                            {plants.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>BATCH NUMBER</label>
                        <select
                            className="prof-select"
                            value={filters.batchNo}
                            onChange={(e) => handleFilterChange('batchNo', e.target.value)}
                        >
                            <option value="">Select Batch</option>
                            {batches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {filters.batchNo ? (
                <div className="lwcl-results fade-in">
                    <div className="g4 mb-6">
                        {lwclData.map((item, idx) => (
                            <div key={idx} className="prof-card text-center" style={{ padding: '15px' }}>
                                <div style={{ fontSize: '20px', marginBottom: '8px' }}>{item.icon}</div>
                                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>{item.label}</div>
                                <div style={{ fontSize: '15px', fontWeight: '700', color: item.status === 'success' ? '#10b981' : '#1e293b', marginTop: '4px' }}>
                                    {item.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="prof-card">
                        <h4 className="card-title-sm mb-4">Tracking Closed Loop Lifecycle</h4>
                        <div className="timeline-container">
                            <table className="prof-table sm">
                                <thead>
                                    <tr>
                                        <th>INSPECTION / PRODUCTION STAGE</th>
                                        <th className="text-right">QUANTITY</th>
                                        <th>DATE</th>
                                        <th>REMARKS / RESULT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {details.map((d, i) => (
                                        <tr key={i} className={i % 2 === 0 ? 'row-odd' : 'row-even'}>
                                            <td className="font-medium text-slate-700">{d.stage}</td>
                                            <td className="text-right text-blue-600 font-bold">{d.qty}</td>
                                            <td>{d.date}</td>
                                            <td>
                                                <span className={`prof-badge sm ${d.result.includes('Rejected') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                    {d.result}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="prof-card p-12 text-center" style={{ border: '2px dashed #e2e8f0', background: 'transparent' }}>
                    <div style={{ fontSize: '3rem', opacity: 0.3 }}>🔍</div>
                    <h3 className="mt-4 text-slate-400 font-medium">Please select a Batch Number to view the Closed Loop Analysis</h3>
                </div>
            )}
        </div>
    );
};

export default SleeperLwclReport;
