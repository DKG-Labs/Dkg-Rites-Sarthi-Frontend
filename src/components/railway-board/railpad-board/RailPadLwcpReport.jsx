import React, { useState, useEffect, useRef, useMemo } from 'react';
import reportService from '../../../services/reportService';
import { ExportButton, downloadExcel } from '../SharedComponents';
import './RailPadSummary.css';

// Searchable, scrollable dropdown for the filter bar
const SearchableSelect = ({ options = [], value, onChange, placeholder = 'Select...', labelKey = 'label', valueKey = 'value', disabled = false }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef(null);
    const inputRef = useRef(null);

    const selected = useMemo(() => options.find(o => String(o[valueKey]) === String(value)), [options, value, valueKey]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return q ? options.filter(o => String(o[labelKey] || '').toLowerCase().includes(q)) : options;
    }, [options, search, labelKey]);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

    const handleSelect = (val) => { onChange(val); setSearch(''); setOpen(false); };
    const handleClear = (e) => { e.stopPropagation(); onChange(''); setSearch(''); };

    return (
        <div ref={ref} style={{ position: 'relative', width: '100%' }}>
            {/* Trigger */}
            <div
                onClick={() => { if (!disabled) setOpen(o => !o); }}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderRadius: 10, border: `2px solid ${disabled ? '#e2e8f0' : '#10b981'}`,
                    padding: '8px 12px', background: disabled ? '#f8fafc' : '#fff',
                    fontSize: 13, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
                    minHeight: 38, color: selected ? '#1e293b' : '#94a3b8',
                    transition: 'border-color 0.15s', boxSizing: 'border-box',
                    ...(open ? { borderColor: '#059669', boxShadow: '0 0 0 3px rgba(16,185,129,0.15)' } : {})
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {selected ? selected[labelKey] : placeholder}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {selected && !disabled && (
                        <span onClick={handleClear} style={{ fontSize: 11, color: '#94a3b8', cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}>✕</span>
                    )}
                    <span style={{ fontSize: 10, color: '#64748b', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                </div>
            </div>

            {/* Dropdown panel */}
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    background: '#fff', border: '1.5px solid #d1fae5', borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 1000,
                    overflow: 'hidden'
                }}>
                    {/* Search input */}
                    <div style={{ padding: '8px 10px', borderBottom: '1px solid #f0fdf4', background: '#f8fffc' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1.5px solid #a7f3d0', borderRadius: 8, padding: '5px 10px' }}>
                            <span style={{ fontSize: 12, color: '#10b981' }}>🔍</span>
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onClick={e => e.stopPropagation()}
                                placeholder="Search..."
                                style={{ border: 'none', outline: 'none', flex: 1, fontSize: 12, color: '#1e293b', background: 'transparent' }}
                            />
                            {search && (
                                <span onClick={() => setSearch('')} style={{ fontSize: 11, color: '#94a3b8', cursor: 'pointer' }}>✕</span>
                            )}
                        </div>
                    </div>

                    {/* Options list */}
                    <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: '14px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No results found</div>
                        ) : filtered.map((o, i) => {
                            const isSelected = String(o[valueKey]) === String(value);
                            return (
                                <div
                                    key={i}
                                    onClick={() => handleSelect(String(o[valueKey]))}
                                    style={{
                                        padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                                        background: isSelected ? '#ecfdf5' : 'transparent',
                                        color: isSelected ? '#059669' : '#1e293b',
                                        fontWeight: isSelected ? 600 : 400,
                                        borderLeft: isSelected ? '3px solid #10b981' : '3px solid transparent',
                                        transition: 'background 0.1s',
                                    }}
                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f0fdf4'; }}
                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    {o[labelKey]}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

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
            <div className="prof-card mb" style={{ position: 'relative', zIndex: 50, overflow: 'visible', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    
                    {/* Manufacturer */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Manufacturer</label>
                        <SearchableSelect
                            options={manufacturers.map(m => ({ label: m.companyName, value: m.vendorCode }))}
                            value={filters.manufacturer}
                            onChange={handleManufacturerChange}
                            placeholder="Select Manufacturer"
                        />
                    </div>

                    {/* Plant */}
                    {filters.manufacturer && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Plant</label>
                            <SearchableSelect
                                options={plants.map(p => ({ label: p.plantName, value: String(p.plantId) }))}
                                value={filters.plant}
                                onChange={handlePlantChange}
                                placeholder="Select Plant"
                            />
                        </div>
                    )}

                    {/* Year of Production */}
                    {filters.plant && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Year of Production</label>
                            <SearchableSelect
                                options={[{label:'2026',value:'2026'},{label:'2025',value:'2025'},{label:'2024',value:'2024'}]}
                                value={filters.year}
                                onChange={handleYearChange}
                                placeholder="Select Year"
                            />
                        </div>
                    )}

                    {/* Lot Number */}
                    {filters.plant && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Lot Number</label>
                            <SearchableSelect
                                options={lots.map(l => ({ label: `${l.lotNo} (${l.callNo})`, value: String(l.lotId) }))}
                                value={filters.lotId}
                                onChange={handleLotChange}
                                placeholder="Select Lot Number"
                            />
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
