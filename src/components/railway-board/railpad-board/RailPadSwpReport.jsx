import React, { useState, useEffect } from 'react';
import { ExportButton, downloadExcel, SearchableDropdown } from '../SharedComponents';
import reportService from '../../../services/reportService';

const RailPadSwpReport = () => {
    const [loading, setLoading] = useState(false);
    const [vendors, setVendors] = useState([]);
    const [plants, setPlants] = useState([]);
    const [reportData, setReportData] = useState([]);

    // Filters state
    const [selectedVendor, setSelectedVendor] = useState('All Manufacturers');
    const [selectedPlant, setSelectedPlant] = useState('All Places');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // Load manufacturers on mount
    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const vendorRes = await reportService.getRailPadManufacturers();
                
                if (vendorRes?.responseData) {
                    setVendors(vendorRes.responseData);
                } else if (Array.isArray(vendorRes)) {
                    setVendors(vendorRes);
                }
            } catch (err) {
                console.error("Error loading vendors:", err);
            }
        };
        fetchVendors();
    }, []);

    // Load places of inspection dynamically when manufacturer changes
    useEffect(() => {
        const fetchPlants = async () => {
            try {
                const vendorCode = selectedVendor === 'All Manufacturers' ? '' : selectedVendor;
                const plantRes = await reportService.getRailPadPlaces(vendorCode);
                
                const data = plantRes?.responseData || plantRes || [];
                setPlants(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error loading plants:", err);
                setPlants([]);
            }
        };
        fetchPlants();
        setSelectedPlant('All Places');
    }, [selectedVendor]);

    // Load report data when filters change
    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const params = {
                    startDate,
                    endDate,
                    vendor: selectedVendor === 'All Manufacturers' ? '' : selectedVendor,
                    plant: selectedPlant === 'All Places' ? '' : selectedPlant
                };
                const res = await reportService.getRailPadShiftWiseProductionReport(params);
                const data = res?.responseData || res || [];
                setReportData(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error fetching SWP report:", err);
                setReportData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [selectedVendor, selectedPlant, startDate, endDate]);

    const handleExport = () => {
        const headers = [
            { label: 'Date', key: 'date' },
            { label: 'Shift', key: 'shift' },
            { label: 'PO Number', key: 'poNo' },
            { label: 'No. of Batches', key: 'noOfBatches' },
            { label: 'Produced Qty', key: 'producedQty' },
            { label: 'Accepted Qty', key: 'acceptedQty' },
            { label: 'Rejected Qty', key: 'rejectedQty' }
        ];
        downloadExcel(reportData, headers, 'RailPad_Shift_Wise_Production_Report');
    };

    // Deduplicate and format vendors for searchable dropdown using vendorCode as value
    const dropdownOptions = [{ label: 'All Manufacturers', value: 'All Manufacturers' }];
    const seenCodes = new Set();
    vendors.forEach(v => {
        if (v.vendorCode) {
            const code = v.vendorCode.trim();
            if (!seenCodes.has(code)) {
                seenCodes.add(code);
                dropdownOptions.push({
                    label: v.vendorName || code,
                    value: code
                });
            }
        }
    });

    return (
        <div className="report-content fade-in">
            <div className="prof-card" style={{ marginBottom: '20px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div className="sec-title" style={{ color: '#166534', fontWeight: 'bold', fontSize: '16px', margin: 0 }}>
                        Shift Wise Production Report - Rail Pad
                    </div>
                    <ExportButton onClick={handleExport} />
                </div>
                
                {/* Filters Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Manufacturer</label>
                        <SearchableDropdown 
                            value={selectedVendor}
                            onChange={(val) => setSelectedVendor(val)}
                            options={dropdownOptions}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Place of Inspection</label>
                        <select 
                            className="prof-select" 
                            style={{ width: '100%' }}
                            value={selectedPlant}
                            onChange={(e) => setSelectedPlant(e.target.value)}
                        >
                            <option value="All Places">All Places</option>
                            {plants.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
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
                                <th>Date</th>
                                <th>Shift</th>
                                <th>PO Number</th>
                                <th className="text-right">No. of Batches</th>
                                <th className="text-right">Produced Qty</th>
                                <th className="text-right">Accepted Qty</th>
                                <th className="text-right">Rejected Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center p-8 text-slate-400">Loading records...</td>
                                </tr>
                            ) : reportData.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center p-8 text-slate-400">No records found.</td>
                                </tr>
                            ) : (
                                reportData.map((row, i) => (
                                    <tr key={i} className={i % 2 === 0 ? 'row-odd' : 'row-even'}>
                                        <td>{row.date}</td>
                                        <td>
                                            <span className="prof-badge" style={{ background: '#f0f9ff', color: '#075985' }}>
                                                {row.shift}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: '600' }}>{row.poNo}</td>
                                        <td className="text-right">{row.noOfBatches}</td>
                                        <td className="text-right">{row.producedQty.toLocaleString()}</td>
                                        <td className="text-right" style={{ color: '#16a34a', fontWeight: 'bold' }}>
                                            {row.acceptedQty.toLocaleString()}
                                        </td>
                                        <td className="text-right" style={{ color: '#dc2626' }}>
                                            {row.rejectedQty.toLocaleString()}
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

export default RailPadSwpReport;
