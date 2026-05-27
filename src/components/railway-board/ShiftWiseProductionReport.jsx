import React, { useState, useEffect } from 'react';
import { ExportButton, downloadExcel, SearchableDropdown } from './SharedComponents';
import reportService from '../../services/reportService';

const ShiftWiseProductionReport = () => {
    const [manufacturer, setManufacturer] = useState('All Manufacturers');
    const [unit, setUnit] = useState('All Units');
    const [place, setPlace] = useState('All Places');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const [manufacturers, setManufacturers] = useState(['All Manufacturers']);
    const [units, setUnits] = useState(['All Units']);
    const [places, setPlaces] = useState(['All Places']);
    const [poiCode, setPoiCode] = useState('');
    
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch Manufacturers
    useEffect(() => {
        const fetchManufacturers = async () => {
            try {
                const res = await reportService.getAllCompanies();
                const data = res?.responseData || res || [];
                if (Array.isArray(data)) {
                    setManufacturers(['All Manufacturers', ...data]);
                }
            } catch (err) {
                console.error("Error loading manufacturers:", err);
            }
        };
        fetchManufacturers();
    }, []);

    // Fetch Units when Manufacturer changes
    useEffect(() => {
        const fetchUnits = async () => {
            if (manufacturer === 'All Manufacturers' || !manufacturer) {
                setUnits(['All Units']);
                setUnit('All Units');
                return;
            }
            try {
                const res = await reportService.getUnitsByCompany(manufacturer);
                const data = res?.responseData || res || [];
                if (Array.isArray(data)) {
                    setUnits(['All Units', ...data]);
                } else {
                    setUnits(['All Units']);
                }
                setUnit('All Units');
            } catch (err) {
                console.error("Error loading units:", err);
                setUnits(['All Units']);
                setUnit('All Units');
            }
        };
        fetchUnits();
    }, [manufacturer]);

    // Fetch POI details when Unit changes
    useEffect(() => {
        const fetchPoi = async () => {
            if (unit === 'All Units' || !unit || manufacturer === 'All Manufacturers') {
                setPlaces(['All Places']);
                setPlace('All Places');
                setPoiCode('');
                return;
            }
            try {
                const res = await reportService.getPoiByCompanyAndUnit(manufacturer, unit);
                const data = res?.responseData || res;
                if (data && data.address) {
                    // Split by newlines or use directly, for dropdown keep it simple
                    const formattedAddress = data.address.trim().replace(/\n/g, ', ');
                    setPlaces(['All Places', formattedAddress]);
                    setPlace(formattedAddress);
                    setPoiCode(data.poiCode || '');
                } else {
                    setPlaces(['All Places']);
                    setPlace('All Places');
                    setPoiCode('');
                }
            } catch (err) {
                console.error("Error loading POI details:", err);
                setPlaces(['All Places']);
                setPlace('All Places');
                setPoiCode('');
            }
        };
        fetchPoi();
    }, [unit, manufacturer]);

    // Fetch Report Data
    useEffect(() => {
        const fetchReportData = async () => {
            if (!poiCode) {
                setReportData([]);
                return;
            }
            setLoading(true);
            try {
                const res = await reportService.getPlantShiftWiseReport({ startDate, endDate, poiCode });
                const data = res?.responseData || res || [];
                setReportData(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error loading report data:", err);
                setReportData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, [startDate, endDate, poiCode]);

    const manufacturerOptions = manufacturers.map(m => ({ label: m, value: m }));
    const unitOptions = units.map(u => ({ label: u, value: u }));
    const placeOptions = places.map(p => ({ label: p, value: p }));

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const parts = dateString.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateString;
    };

    const handleExport = () => {
        const headers = [
            { label: 'Date', key: 'inspectionDate' },
            { label: 'Shift', key: 'shift' },
            { label: 'PO Numbers', key: 'poNumbersStr' },
            { label: 'Lot No.', key: 'lotNumbersStr' },
            { label: 'Production in Shearing', key: 'productionInShearing' },
            { label: 'Production in Tempering', key: 'productionInTempering' },
            { label: 'Accepted Quantity in Tempering', key: 'acceptedQtyInTempering' },
            { label: 'Total Rejection', key: 'totalRejected' }
        ];
        
        const exportData = reportData.map(row => ({
            ...row,
            inspectionDate: formatDate(row.inspectionDate),
            poNumbersStr: (row.poNumbers || []).join(', '),
            lotNumbersStr: (row.lotNumbers || []).join(', ')
        }));

        downloadExcel(exportData, headers, 'Shift_Wise_Production_Report');
    };

    return (
        <div className="report-content fade-in">
            <div className="prof-card" style={{ marginBottom: '20px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div className="sec-title" style={{ color: '#166534', fontWeight: 'bold', fontSize: '16px', margin: 0 }}>
                        Shift Wise Production Report - ERC
                    </div>
                    <ExportButton onClick={handleExport} disabled={reportData.length === 0} />
                </div>
                
                {/* Filters Row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ flex: '2 1 220px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Manufacturer</label>
                        <SearchableDropdown 
                            value={manufacturer}
                            onChange={(val) => setManufacturer(val)}
                            options={manufacturerOptions}
                        />
                    </div>
                    <div style={{ flex: '1.5 1 180px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Unit Name</label>
                        <SearchableDropdown 
                            value={unit}
                            onChange={(val) => setUnit(val)}
                            options={unitOptions}
                        />
                    </div>
                    <div style={{ flex: '2 1 220px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Place of Inspection</label>
                        <SearchableDropdown 
                            value={place}
                            onChange={(val) => setPlace(val)}
                            options={placeOptions}
                        />
                    </div>
                    <div style={{ flex: '1 1 130px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>From Date</label>
                        <input 
                            type="date" 
                            className="prof-search" 
                            style={{ width: '100%', height: '38px', boxSizing: 'border-box' }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div style={{ flex: '1 1 130px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>To Date</label>
                        <input 
                            type="date" 
                            className="prof-search" 
                            style={{ width: '100%', height: '38px', boxSizing: 'border-box' }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="prof-table">
                        <thead>
                            <tr>
                                <th className="text-center" style={{ whiteSpace: 'nowrap', minWidth: '100px' }}>Date</th>
                                <th className="text-center">Shift</th>
                                <th className="text-center">PO Number(s)</th>
                                <th className="text-center">Lot No(s).</th>
                                <th className="text-center">Production in Shearing</th>
                                <th className="text-center">Production in Tempering</th>
                                <th className="text-center">Accepted Quantity in Tempering</th>
                                <th className="text-center">Total Rejection</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center p-8 text-slate-400">Loading records...</td>
                                </tr>
                            ) : reportData.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center p-8 text-slate-400">
                                        {!poiCode ? 'Please select Manufacturer and Unit to view data.' : 'No records found.'}
                                    </td>
                                </tr>
                            ) : (
                                reportData.map((row, i) => (
                                    <tr key={i} className={i % 2 === 0 ? 'row-odd' : 'row-even'}>
                                        <td className="text-center" style={{ whiteSpace: 'nowrap' }}>{formatDate(row.inspectionDate)}</td>
                                        <td className="text-center"><span className="prof-badge" style={{ background: '#f0f9ff', color: '#075985' }}>{row.shift}</span></td>
                                        <td className="text-center" style={{ fontWeight: '600' }}>{(row.poNumbers || []).join(', ')}</td>
                                        <td className="text-center">{(row.lotNumbers || []).join(', ')}</td>
                                        <td className="text-center">{(row.productionInShearing || 0).toLocaleString()}</td>
                                        <td className="text-center">{(row.productionInTempering || 0).toLocaleString()}</td>
                                        <td className="text-center" style={{ color: '#16a34a', fontWeight: 'bold' }}>{(row.acceptedQtyInTempering || 0).toLocaleString()}</td>
                                        <td className="text-center" style={{ color: '#dc2626' }}>{(row.totalRejected || 0).toLocaleString()}</td>
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

export default ShiftWiseProductionReport;
