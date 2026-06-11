import React, { useState, useEffect } from 'react';
import reportService from '../../../services/reportService';
import { ExportButton, downloadExcel } from '../SharedComponents';
import './RailPadSummary.css';

const RailPadLwcpReport = () => {
    const [filters, setFilters] = useState({
        manufacturer: '',
        plant: '',
        year: '2026',
        lotId: ''
    });

    const [manufacturers, setManufacturers] = useState([]);
    const [plants, setPlants] = useState([]);
    const [lots, setLots] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch manufacturers on mount
    useEffect(() => {
        const fetchManufacturers = async () => {
            try {
                setLoading(true);
                const res = await reportService.getRailPadClosedLoopManufacturers();
                const data = res.responseData || res || [];
                setManufacturers(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error fetching manufacturers:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchManufacturers();
    }, []);

    const handleManufacturerChange = async (vendorCode) => {
        setFilters({ manufacturer: vendorCode, plant: '', year: filters.year, lotId: '' });
        setPlants([]);
        setLots([]);
        setReportData(null);

        if (vendorCode) {
            try {
                setLoading(true);
                const res = await reportService.getRailPadClosedLoopPlants(vendorCode);
                const data = res.responseData || res || [];
                setPlants(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error fetching plants:", err);
            } finally {
                setLoading(false);
            }
        }
    };

    const fetchLots = async (plantId, year) => {
        try {
            setLoading(true);
            const res = await reportService.getRailPadClosedLoopLots(plantId, year);
            const data = res.responseData || res || [];
            setLots(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching lots:", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePlantChange = async (plantId) => {
        setFilters(prev => ({ ...prev, plant: plantId, lotId: '' }));
        setLots([]);
        setReportData(null);

        if (plantId && filters.year) {
            await fetchLots(plantId, parseInt(filters.year));
        }
    };

    const handleYearChange = async (year) => {
        setFilters(prev => ({ ...prev, year, lotId: '' }));
        setLots([]);
        setReportData(null);

        if (filters.plant && year) {
            await fetchLots(filters.plant, parseInt(year));
        }
    };

    const handleLotChange = async (lotId) => {
        setFilters(prev => ({ ...prev, lotId }));
        setReportData(null);

        if (lotId) {
            try {
                setLoading(true);
                const res = await reportService.getRailPadClosedLoopDetails(parseInt(lotId));
                const data = res.responseData || res || null;
                setReportData(data);
            } catch (err) {
                console.error("Error fetching lot details:", err);
            } finally {
                setLoading(false);
            }
        }
    };

    // Format date string for display
    const formatDate = (dateArr) => {
        if (!dateArr) return '-';
        if (typeof dateArr === 'string') return dateArr;
        if (Array.isArray(dateArr)) {
            // [year, month, day]
            const [y, m, d] = dateArr;
            return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
        }
        return String(dateArr);
    };

    const handleExport = () => {
        if (!reportData || !reportData.batches || reportData.batches.length === 0) return;
        
        const exportData = reportData.batches.map(b => ({
            rlyPoSrNo: reportData.rlyPoSrNo || 'N/A',
            batchNo: b.batchNo || 'N/A',
            productionDate: formatDate(b.productionDate),
            quantity: b.quantity || 0,
            totalQty: reportData.lotSize || 0,
            dateOfInspection: formatDate(reportData.dateOfInspection)
        }));

        const exportColumns = [
            { label: 'PO Sr. No. for which supplied', key: 'rlyPoSrNo' },
            { label: 'Batch Number', key: 'batchNo' },
            { label: 'Date of Production', key: 'productionDate' },
            { label: 'Quantity Supplied', key: 'quantity' },
            { label: 'Total Lot Qty', key: 'totalQty' },
            { label: 'Date of Final Inspection', key: 'dateOfInspection' }
        ];

        downloadExcel(exportData, exportColumns, `Lot_Closed_Loop_${filters.lotId}`);
    };

    return (
        <div className="report-content fade-in">
            <div className="sec-title" style={{ color: '#166534', fontWeight: 'bold', fontSize: '14px', marginBottom: '15px' }}>
                Lot Wise Closed Loop Analysis (Rail Pad)
            </div>

            {/* Filter Bar */}
            <div className="prof-card mb" style={{ padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    
                    {/* Manufacturer */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Manufacturer</label>
                        <select
                            className="prof-select"
                            style={{ width: '100%', borderRadius: '10px', border: '2px solid #10b981', padding: '8px 12px', background: '#fff', fontSize: '13px', fontWeight: '500', height: '38px' }}
                            value={filters.manufacturer}
                            onChange={(e) => handleManufacturerChange(e.target.value)}
                        >
                            <option value="">Select Manufacturer</option>
                            {manufacturers.map(m => (
                                <option key={m.vendorCode} value={m.vendorCode}>{m.companyName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Plant */}
                    {filters.manufacturer && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Plant</label>
                            <select
                                className="prof-select"
                                style={{ width: '100%', borderRadius: '10px', border: '2px solid #10b981', padding: '8px 12px', background: '#fff', fontSize: '13px', fontWeight: '500', height: '38px' }}
                                value={filters.plant}
                                onChange={(e) => handlePlantChange(e.target.value)}
                            >
                                <option value="">Select Plant</option>
                                {plants.map(p => (
                                    <option key={p.plantId} value={p.plantId}>{p.plantName}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Year of Production */}
                    {filters.plant && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Year of Production</label>
                            <select
                                className="prof-select"
                                style={{ width: '100%', borderRadius: '10px', border: '2px solid #10b981', padding: '8px 12px', background: '#fff', fontSize: '13px', fontWeight: '500', height: '38px' }}
                                value={filters.year}
                                onChange={(e) => handleYearChange(e.target.value)}
                            >
                                <option value="2026">2026</option>
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                            </select>
                        </div>
                    )}

                    {/* Lot Number */}
                    {filters.plant && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Lot Number</label>
                            <select
                                className="prof-select"
                                style={{ width: '100%', borderRadius: '10px', border: '2px solid #10b981', padding: '8px 12px', background: '#fff', fontSize: '13px', fontWeight: '500', height: '38px' }}
                                value={filters.lotId}
                                onChange={(e) => handleLotChange(e.target.value)}
                            >
                                <option value="">Select Lot Number</option>
                                {lots.map(l => (
                                    <option key={l.lotId} value={l.lotId}>
                                        {l.lotNo} ({l.callNo})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Results Section */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                    <div className="spinner-small" style={{ width: '30px', height: '30px', border: '4px solid #f3f3f3', borderTop: '4px solid #10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <span style={{ marginLeft: '12px', color: '#64748b', fontWeight: '500' }}>Fetching Lot Closed Loop Data...</span>
                </div>
            ) : reportData ? (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Unified Lot Closed Loop Table */}
                    <div className="prof-card" style={{ padding: '20px', borderRadius: '15px', border: '1px solid #cbd5e1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Lot Closed Loop Details
                            </div>
                            <ExportButton onClick={handleExport} />
                        </div>
                        <div className="table-responsive" style={{ border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                            <table className="prof-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '25%' }}>PO Sr. No. for which supplied</th>
                                        <th style={{ width: '15%' }}>Batch Number</th>
                                        <th style={{ width: '15%' }}>Date of Production</th>
                                        <th className="text-right" style={{ width: '15%' }}>Qty Supplied</th>
                                        <th className="text-right" style={{ width: '15%' }}>Total Qty</th>
                                        <th style={{ width: '15%' }}>Date of Final Inspection</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.batches && reportData.batches.length > 0 ? (
                                        reportData.batches.map((b, i) => (
                                            <tr key={i} className={i % 2 === 0 ? 'row-odd' : 'row-even'}>
                                                {i === 0 && (
                                                    <td rowSpan={reportData.batches.length} style={{ fontWeight: '600', verticalAlign: 'middle', background: '#ffffff', borderRight: '1px solid #e2e8f0' }}>
                                                        {reportData.rlyPoSrNo || 'N/A'}
                                                    </td>
                                                )}
                                                <td style={{ fontWeight: '600' }}>{b.batchNo}</td>
                                                <td>{formatDate(b.productionDate)}</td>
                                                <td className="text-right font-bold" style={{ color: '#0369a1' }}>
                                                    {b.quantity?.toLocaleString()} Nos.
                                                </td>
                                                {i === 0 && (
                                                    <td rowSpan={reportData.batches.length} className="text-right font-bold" style={{ verticalAlign: 'middle', color: '#166534', background: '#ffffff', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                                                        {reportData.lotSize?.toLocaleString()} Nos.
                                                    </td>
                                                )}
                                                {i === 0 && (
                                                    <td rowSpan={reportData.batches.length} style={{ verticalAlign: 'middle', fontWeight: '500', background: '#ffffff', borderLeft: '1px solid #e2e8f0' }}>
                                                        {formatDate(reportData.dateOfInspection)}
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center p-4 text-slate-400">No batches mapped to this inspection lot.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            ) : filters.lotId ? (
                <div className="prof-card p-12 text-center" style={{ border: '2px dashed #e2e8f0', background: 'transparent' }}>
                    <div style={{ fontSize: '3rem', opacity: 0.3 }}>⚠️</div>
                    <h3 className="mt-4 text-slate-400 font-medium">No closed loop lifecycle data found for the selected Lot</h3>
                </div>
            ) : (
                <div className="prof-card p-12 text-center" style={{ border: '2px dashed #e2e8f0', background: 'transparent' }}>
                    <div style={{ fontSize: '3rem', opacity: 0.3 }}>🔍</div>
                    <h3 className="mt-4 text-slate-400 font-medium">Please select Manufacturer, Plant, and Lot Number to inspect lifecycle.</h3>
                </div>
            )}
            
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default RailPadLwcpReport;
