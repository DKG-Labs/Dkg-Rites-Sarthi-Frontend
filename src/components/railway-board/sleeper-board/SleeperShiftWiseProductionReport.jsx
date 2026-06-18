import React, { useState, useEffect } from 'react';
import { ExportButton, downloadExcel, SearchableDropdown } from '../SharedComponents';
import reportService from '../../../services/reportService';

const SleeperShiftWiseProductionReport = () => {
    // ── Filter State ──
    const [manufacturer, setManufacturer] = useState('All Manufacturers');
    const [plant, setPlant] = useState('All Plants');
    const [selectedPlantId, setSelectedPlantId] = useState('');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // ── Data State ──
    const [manufacturers, setManufacturers] = useState([]);
    const [plants, setPlants] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    // ── Fetch Manufacturers (company names) on mount ──
    useEffect(() => {
        const fetchManufacturers = async () => {
            try {
                const res = await reportService.getSleeperVendorPlantCompanies();
                const data = res?.responseData || res || [];
                if (Array.isArray(data)) {
                    setManufacturers(data);
                }
            } catch (err) {
                console.error('Error loading sleeper manufacturers:', err);
            }
        };
        fetchManufacturers();
    }, []);

    // ── Fetch Plants when Manufacturer changes ──
    useEffect(() => {
        const fetchPlants = async () => {
            if (manufacturer === 'All Manufacturers' || !manufacturer) {
                setPlants([]);
                setPlant('All Plants');
                setSelectedPlantId('');
                return;
            }
            try {
                const res = await reportService.getSleeperVendorPlantsByCompany(manufacturer);
                const data = res?.responseData || res || [];
                if (Array.isArray(data)) {
                    setPlants(data);
                } else {
                    setPlants([]);
                }
                setPlant('All Plants');
                setSelectedPlantId('');
            } catch (err) {
                console.error('Error loading sleeper plants:', err);
                setPlants([]);
                setPlant('All Plants');
                setSelectedPlantId('');
            }
        };
        fetchPlants();
    }, [manufacturer]);

    // ── Fetch Report Data when plant is selected ──
    useEffect(() => {
        const fetchReportData = async () => {
            if (!selectedPlantId) {
                setReportData([]);
                return;
            }
            setLoading(true);
            try {
                const res = await reportService.getSleeperShiftWiseProduction({
                    startDate,
                    endDate,
                    plantId: selectedPlantId
                });
                const data = res?.responseData || res || [];
                setReportData(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error loading sleeper SWP report data:', err);
                setReportData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, [selectedPlantId, startDate, endDate]);

    // ── Dropdown Options ──
    const manufacturerOptions = [
        { label: 'All Manufacturers', value: 'All Manufacturers' },
        ...manufacturers.map(m => ({ label: m, value: m }))
    ];

    const formatPlantId = (plantId) => {
        if (!plantId) return '';
        const parts = plantId.split('/');
        return parts[parts.length - 1];
    };

    const plantOptions = [
        { label: 'All Plants', value: 'All Plants' },
        ...plants.map(p => ({ label: formatPlantId(p.plantId), value: p.plantId }))
    ];

    // ── Handle Plant Selection ──
    const handlePlantChange = (val) => {
        if (val === 'All Plants') {
            setPlant('All Plants');
            setSelectedPlantId('');
        } else {
            const selected = plants.find(p => p.plantId === val);
            setPlant(selected ? formatPlantId(selected.plantId) : formatPlantId(val));
            setSelectedPlantId(val);
        }
    };

    // ── Format Date for display ──
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const parts = dateString.split('-');
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
        } catch { /* fallback */ }
        return dateString;
    };

    // ── Export Handler ──
    const handleExport = () => {
        const headers = [
            { label: 'Date', key: 'date' },
            { label: 'Shift', key: 'shift' },
            { label: 'Line / Shed No.', key: 'lineOrShedNo' },
            { label: 'No. of Batches', key: 'noOfBatches' },
            { label: 'No. of Sleepers', key: 'noOfSleepers' },
            { label: 'Sleeper Types & Counts', key: 'sleeperTypesAndCounts' },
            { label: 'Rej. (Process)', key: 'processRejectedSleepers' },
            { label: 'Rej. (Final)', key: 'finalRejectedSleepers' },
            { label: 'ET Sleepers', key: 'etRejectedSleepers' }
        ];

        const exportData = reportData.map(row => ({
            ...row,
            date: formatDate(row.date)
        }));

        downloadExcel(exportData, headers, 'Sleeper_Shift_Wise_Production_Report');
    };

    return (
        <div className="report-content fade-in">
            <div className="prof-card" style={{ marginBottom: '20px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div className="sec-title" style={{ color: '#1e40af', fontWeight: 'bold', fontSize: '16px', margin: 0 }}>
                        Record - Shift Wise Production (Sleeper)
                    </div>
                    <ExportButton onClick={handleExport} disabled={reportData.length === 0} />
                </div>
                
                {/* Filters Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Manufacturer</label>
                        <SearchableDropdown 
                            value={manufacturer}
                            onChange={(val) => setManufacturer(val)}
                            options={manufacturerOptions}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Plant</label>
                        <SearchableDropdown 
                            value={plant === 'All Plants' ? 'All Plants' : selectedPlantId}
                            onChange={handlePlantChange}
                            options={plantOptions}
                        />
                    </div>
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
                                <th className="text-center">Date</th>
                                <th className="text-center">Shift</th>
                                <th className="text-center">Line / Shed No.</th>
                                <th className="text-center">No. of Batches</th>
                                <th className="text-center">No. of Sleepers</th>
                                <th className="text-center">Sleeper Types & Counts</th>
                                <th className="text-center">Rej. (Process)</th>
                                <th className="text-center">Rej. (Final)</th>
                                <th className="text-center">ET Sleepers</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="text-center p-8 text-slate-400">Loading records...</td>
                                </tr>
                            ) : reportData.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="text-center p-8 text-slate-400">
                                        {!selectedPlantId ? 'Please select a Manufacturer and Plant to view data.' : 'No records found.'}
                                    </td>
                                </tr>
                            ) : (
                                reportData.map((row, i) => (
                                    <tr key={i} className={i % 2 === 0 ? 'row-odd' : 'row-even'}>
                                        <td className="text-center" style={{ whiteSpace: 'nowrap' }}>{formatDate(row.date)}</td>
                                        <td className="text-center"><span className="prof-badge" style={{ background: '#eff6ff', color: '#1e40af' }}>{row.shift}</span></td>
                                        <td className="text-center" style={{ fontWeight: '600' }}>{row.lineOrShedNo}</td>
                                        <td className="text-center">{(row.noOfBatches || 0).toLocaleString()}</td>
                                        <td className="text-center" style={{ fontWeight: 'bold' }}>{(row.noOfSleepers || 0).toLocaleString()}</td>
                                        <td className="text-center" style={{ fontSize: '12px', color: '#475569' }}>{row.sleeperTypesAndCounts}</td>
                                        <td className="text-center" style={{ color: '#dc2626' }}>{(row.processRejectedSleepers || 0).toLocaleString()}</td>
                                        <td className="text-center" style={{ color: '#b91c1c', fontWeight: 'bold' }}>{(row.finalRejectedSleepers || 0).toLocaleString()}</td>
                                        <td className="text-center" style={{ color: '#0891b2' }}>{(row.etRejectedSleepers || 0).toLocaleString()}</td>
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

export default SleeperShiftWiseProductionReport;
