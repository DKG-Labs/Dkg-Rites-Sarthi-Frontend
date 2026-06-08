import React, { useState, useEffect } from 'react';
import { ExportButton, downloadExcel } from '../SharedComponents';
import reportService from '../../../services/reportService';

const RailPadVwpqrReport = () => {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);

    // Filters state
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // Load report data when filters change
    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const params = { startDate, endDate };
                const res = await reportService.getRailPadVendorWiseQualityReport(params);
                const data = res?.responseData || res || [];
                setReportData(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error fetching VWPQR report:", err);
                setReportData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [startDate, endDate]);

    const handleExport = () => {
        const headers = [
            { label: 'MANUFACTURER & PLANT', key: 'manufacture' },
            { label: 'TOTAL INSPECTED (NOS.)', key: 'totalInspected' },
            { label: 'TOTAL ACCEPTED (NOS.)', key: 'totalAccepted' },
            { label: 'TOTAL REJECTED (NOS.)', key: 'totalRejected' },
            { label: 'REJECTION %', key: 'rejectionPercent' }
        ];
        downloadExcel(reportData, headers, 'RailPad_Vendor_Wise_Process_Quality_Report');
    };

    return (
        <div className="report-content fade-in">
            <div className="prof-card" style={{ marginBottom: '20px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div className="sec-title" style={{ color: '#166534', fontWeight: 'bold', fontSize: '16px', margin: 0 }}>
                        Vendor Wise Process Quality Report - Rail Pad
                    </div>
                    <ExportButton label="DOWNLOAD SUMMARY" onClick={handleExport} />
                </div>
                
                {/* Filters Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>From Date</label>
                        <input 
                            type="date" 
                            className="prof-search" 
                            style={{ width: '100%', height: '38px' }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>To Date</label>
                        <input 
                            type="date" 
                            className="prof-search" 
                            style={{ width: '100%', height: '38px' }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="prof-table">
                        <thead>
                            <tr>
                                <th>MANUFACTURER & PLANT</th>
                                <th className="text-center">TOTAL INSPECTED (NOS.)</th>
                                <th className="text-center">TOTAL ACCEPTED (NOS.)</th>
                                <th className="text-center">TOTAL REJECTED (NOS.)</th>
                                <th className="text-center">REJECTION %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center p-8 text-slate-400">Loading records...</td>
                                </tr>
                            ) : reportData.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center p-8 text-slate-400">No records found.</td>
                                </tr>
                            ) : (
                                reportData.map((row, i) => (
                                    <tr key={i} className={i % 2 === 0 ? 'row-odd' : 'row-even'}>
                                        <td style={{ fontWeight: '600' }}>{row.manufacture}</td>
                                        <td className="text-center">{row.totalInspected.toLocaleString()}</td>
                                        <td className="text-center" style={{ color: '#16a34a', fontWeight: 'bold' }}>
                                            {row.totalAccepted.toLocaleString()}
                                        </td>
                                        <td className="text-center" style={{ color: '#dc2626' }}>
                                            {row.totalRejected.toLocaleString()}
                                        </td>
                                        <td className="text-center" style={{ fontWeight: 'bold', color: row.totalRejected > 0 ? '#dc2626' : '#16a34a' }}>
                                            {row.rejectionPercent}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RailPadVwpqrReport;
