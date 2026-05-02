import React, { useState, useEffect } from 'react';
import './SleeperSummary.css';
import reportService from '../../../services/reportService';

const SleeperLwclReport = () => {
    const [filters, setFilters] = useState({
        manufacturer: '',
        plant: '',
        batchNo: ''
    });

    const [manufacturers, setManufacturers] = useState([]);
    const [plants, setPlants] = useState([]);
    const [batches, setBatches] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch manufacturers on mount
    useEffect(() => {
        fetchManufacturers();
    }, []);

    const fetchManufacturers = async () => {
        try {
            const response = await reportService.getSleeperCompanies();
            if (response && response.responseData) {
                setManufacturers(response.responseData);
            }
        } catch (error) {
            console.error("Error fetching manufacturers:", error);
        }
    };

    const handleManufacturerChange = async (vendorCode) => {
        setFilters({ manufacturer: vendorCode, plant: '', batchNo: '' });
        setPlants([]);
        setBatches([]);
        setReportData([]);

        if (vendorCode) {
            try {
                setLoading(true);
                const response = await reportService.getSleeperPlants(vendorCode);
                if (response && response.responseData) {
                    setPlants(response.responseData);
                }
            } catch (error) {
                console.error("Error fetching plants:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    const handlePlantChange = async (plantId) => {
        setFilters(prev => ({ ...prev, plant: plantId, batchNo: '' }));
        setBatches([]);
        setReportData([]);

        if (plantId) {
            try {
                setLoading(true);
                const response = await reportService.getSleeperBatches(plantId);
                if (response && response.responseData) {
                    setBatches(response.responseData);
                }
            } catch (error) {
                console.error("Error fetching batches:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBatchChange = async (batchId) => {
        setFilters(prev => ({ ...prev, batchNo: batchId }));
        setReportData([]);
        
        const selectedBatch = batches.find(b => b.id.toString() === batchId);

        if (batchId && selectedBatch) {
            try {
                setLoading(true);
                const response = await reportService.getSleeperLotWiseAnalysis({
                    id: selectedBatch.id,
                    batchId: selectedBatch.batchNumber
                });
                if (response && response.responseData) {
                    setReportData(response.responseData);
                }
            } catch (error) {
                console.error("Error fetching lot-wise analysis:", error);
            } finally {
                setLoading(false);
            }
        }
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
                            onChange={(e) => handleManufacturerChange(e.target.value)}
                        >
                            <option value="">Select Manufacturer</option>
                            {manufacturers.map(m => <option key={m.vendorCode} value={m.vendorCode}>{m.companyName}</option>)}
                        </select>
                    </div>
                    
                    {filters.manufacturer && (
                        <div className="filter-group">
                            <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>PLANT</label>
                            <select
                                className="prof-select"
                                value={filters.plant}
                                onChange={(e) => handlePlantChange(e.target.value)}
                            >
                                <option value="">Select Plant</option>
                                {plants.map(p => <option key={p.plantId} value={p.plantId}>{p.plantName}</option>)}
                            </select>
                        </div>
                    )}

                    {filters.plant && (
                        <div className="filter-group">
                            <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>BATCH NUMBER</label>
                            <select
                                className="prof-select"
                                value={filters.batchNo}
                                onChange={(e) => handleBatchChange(e.target.value)}
                            >
                                <option value="">Select Batch</option>
                                {batches.map(b => <option key={b.id} value={b.id}>{b.batchNumber}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center p-12">
                    <div className="loading-spinner"></div>
                    <p className="mt-4 text-slate-500">Fetching analysis data...</p>
                </div>
            ) : filters.batchNo && reportData.length > 0 ? (
                <div className="lwcl-results fade-in">
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
                                    {reportData.map((d, i) => (
                                        <tr key={i} className={i % 2 === 0 ? 'row-odd' : 'row-even'}>
                                            <td className="font-medium text-slate-700">{d.stageName}</td>
                                            <td className="text-right text-blue-600 font-bold">{d.quantity}</td>
                                            <td>{d.date}</td>
                                            <td>
                                                {d.remarks ? (
                                                    <span className={`prof-badge sm ${d.remarks.toLowerCase().includes('rejected') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                        {d.remarks}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : filters.batchNo ? (
                 <div className="prof-card p-12 text-center" style={{ border: '2px dashed #e2e8f0', background: 'transparent' }}>
                    <div style={{ fontSize: '3rem', opacity: 0.3 }}>⚠️</div>
                    <h3 className="mt-4 text-slate-400 font-medium">No lifecycle data found for the selected Batch Number</h3>
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
