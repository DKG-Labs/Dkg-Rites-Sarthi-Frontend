import React, { useState, useEffect, useRef, useMemo } from 'react';
import reportService from '../../../services/reportService';
import { ExportButton, downloadExcel } from '../SharedComponents';
import './RailPadSummary.css';
import '../erc-board/ProcessInspectionQualityTable.css';
import './RailPadQualityReport.css';

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

const RailPadLwcpReport = ({ refreshTick = 0 }) => {
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
    }, [refreshTick]);

    // Refresh Data: reload lots and the selected lot's details, keeping current filters
    useEffect(() => {
        if (refreshTick === 0) return;
        if (filters.plant && filters.year) fetchLots(filters.plant, parseInt(filters.year));
        if (filters.lotId) handleLotChange(filters.lotId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshTick]);

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

    const batches = (reportData && Array.isArray(reportData.batches)) ? reportData.batches : [];
    const suppliedTotal = batches.reduce((s, b) => s + (Number(b.quantity) || 0), 0);
    const lotSize = Number(reportData?.lotSize) || 0;
    const coveragePct = lotSize > 0 ? Math.min(100, (suppliedTotal * 100) / lotSize) : 0;
    const selectedLot = lots.find(l => String(l.lotId) === String(filters.lotId));

    const steps = [
        { key: 'manufacturer', label: 'Manufacturer', done: !!filters.manufacturer },
        { key: 'plant', label: 'Plant', done: !!filters.plant },
        { key: 'year', label: 'Year', done: !!filters.year && !!filters.plant },
        { key: 'lot', label: 'Lot', done: !!filters.lotId },
    ];

    const kpis = reportData ? [
        { label: 'PO Sr. No.', value: reportData.rlyPoSrNo || 'N/A', icon: 'fa-file-contract', tone: '#1d4ed8', small: true },
        { label: 'Batches', value: batches.length.toLocaleString(), icon: 'fa-layer-group', tone: '#7c3aed' },
        { label: 'Lot Size', value: `${lotSize.toLocaleString()} Nos.`, icon: 'fa-boxes-stacked', tone: '#15803d' },
        { label: 'Final Inspection', value: formatDate(reportData.dateOfInspection), icon: 'fa-clipboard-check', tone: '#0d9488' },
    ] : [];

    return (
        <div className="piq-container rpq-glass lwcl-root">
            {/* Title */}
            <div className="piq-topbar" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <div className="piq-title-area">
                    <h2 className="piq-heading">Lot Wise Closed Loop Analysis</h2>
                    <span className="piq-badge">Rail Pad</span>
                </div>
            </div>

            {/* Filter card */}
            <div className="lwcl-filter-card">
                <div className="lwcl-steps" aria-hidden="true">
                    {steps.map((s, i) => (
                        <React.Fragment key={s.key}>
                            <span className={`lwcl-step ${s.done ? 'is-done' : ''}`}>
                                <span className="lwcl-step-dot">{s.done ? <i className="fa-solid fa-check"></i> : i + 1}</span>
                                {s.label}
                            </span>
                            {i < steps.length - 1 && <span className={`lwcl-step-line ${s.done ? 'is-done' : ''}`}></span>}
                        </React.Fragment>
                    ))}
                </div>

                <div className="lwcl-filter-grid">
                    {/* Manufacturer */}
                    <div className="lwcl-field">
                        <label><i className="fa-solid fa-industry"></i>Manufacturer</label>
                        <SearchableSelect
                            options={manufacturers.map(m => ({ label: m.companyName, value: m.vendorCode }))}
                            value={filters.manufacturer}
                            onChange={handleManufacturerChange}
                            placeholder="Select Manufacturer"
                        />
                    </div>

                    {/* Plant */}
                    {filters.manufacturer && (
                        <div className="lwcl-field">
                            <label><i className="fa-solid fa-location-dot"></i>Plant</label>
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
                        <div className="lwcl-field">
                            <label><i className="fa-regular fa-calendar"></i>Year of Production</label>
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
                        <div className="lwcl-field">
                            <label><i className="fa-solid fa-hashtag"></i>Lot Number</label>
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
                <div className="lwcl-result-card">
                    <div className="rp-kpis">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="rp-kpi">
                                <span className="rp-kpi-icon rpq-skeleton" style={{ borderRadius: '12px' }}></span>
                                <div className="rp-kpi-text">
                                    <span className="rpq-skeleton" style={{ width: '70px', height: '10px' }}></span>
                                    <span className="rpq-skeleton" style={{ width: '110px', height: '16px' }}></span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="lwcl-loading-row">
                        <span className="rpq-loading-ring" style={{ width: '26px', height: '26px' }}></span>
                        <span>Fetching lot closed loop data
                            <span className="rpq-loading-dots" style={{ marginLeft: '8px' }}><span></span><span></span><span></span></span>
                        </span>
                    </div>
                </div>
            ) : reportData ? (
                <div className="lwcl-result-card">
                    {/* KPI cards */}
                    <div className="rp-kpis">
                        {kpis.map(k => (
                            <div key={k.label} className="rp-kpi">
                                <span className="rp-kpi-icon" style={{ color: k.tone, background: `${k.tone}14` }}>
                                    <i className={`fa-solid ${k.icon}`}></i>
                                </span>
                                <div className="rp-kpi-text">
                                    <span className="rp-kpi-label">{k.label}</span>
                                    <strong className="rp-kpi-value" style={k.small ? { fontSize: '13px', wordBreak: 'break-all' } : undefined}>{k.value}</strong>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Section header */}
                    <div className="lwcl-section-head">
                        <div>
                            <div className="lwcl-section-title">Lot Closed Loop Details</div>
                            <div className="lwcl-section-sub">
                                {selectedLot ? `${selectedLot.lotNo} · Call ${selectedLot.callNo}` : ''}
                                {lotSize > 0 && (
                                    <span className="lwcl-coverage">
                                        <span className="rp-progress-track" style={{ width: '120px' }}>
                                            <span className={`rp-progress-fill ${coveragePct >= 100 ? 'is-done' : ''}`} style={{ width: `${coveragePct}%`, display: 'block' }}></span>
                                        </span>
                                        {suppliedTotal.toLocaleString()} / {lotSize.toLocaleString()} Nos. traced
                                    </span>
                                )}
                            </div>
                        </div>
                        <ExportButton onClick={handleExport} label="Download Excel" />
                    </div>

                    {/* Table */}
                    <div className="piq-table-wrapper" style={{ overflowX: 'auto' }}>
                        <table style={{ minWidth: '900px', width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '12px' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...thBase, textAlign: 'left', width: '25%' }}>PO Sr. No. for which supplied</th>
                                    <th style={{ ...thBase, width: '15%' }}>Batch Number</th>
                                    <th style={{ ...thBase, width: '15%' }}>Date of Production</th>
                                    <th style={{ ...thBlue, width: '15%' }}>Qty Supplied</th>
                                    <th style={{ ...thGreen, width: '15%' }}>Total Qty</th>
                                    <th style={{ ...thTeal, width: '15%' }}>Date of Final Inspection</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batches.length > 0 ? (
                                    batches.map((b, i) => (
                                        <tr key={i} className="piq-row">
                                            {i === 0 && (
                                                <td rowSpan={batches.length} style={{ ...tdCell, ...tdMerged, textAlign: 'left' }}>
                                                    <span className="lwcl-po">{reportData.rlyPoSrNo || 'N/A'}</span>
                                                </td>
                                            )}
                                            <td style={tdCell}><span className="lwcl-batch">{b.batchNo}</span></td>
                                            <td style={tdCell}>{formatDate(b.productionDate)}</td>
                                            <td style={{ ...tdCell, background: '#eff6ff', color: '#1d4ed8', fontWeight: 700 }}>
                                                {(Number(b.quantity) || 0).toLocaleString()} <small style={unit}>Nos.</small>
                                            </td>
                                            {i === 0 && (
                                                <td rowSpan={batches.length} style={{ ...tdCell, ...tdMerged, background: '#f0fdf4', color: '#15803d', fontWeight: 700, fontSize: '13px' }}>
                                                    {lotSize.toLocaleString()} <small style={unit}>Nos.</small>
                                                </td>
                                            )}
                                            {i === 0 && (
                                                <td rowSpan={batches.length} style={{ ...tdCell, ...tdMerged }}>
                                                    <span className="lwcl-date-chip"><i className="fa-regular fa-calendar-check"></i>{formatDate(reportData.dateOfInspection)}</span>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" style={{ ...tdCell, padding: '28px', color: '#94a3b8' }}>
                                            <i className="fa-solid fa-inbox" style={{ marginRight: '8px' }}></i>No batches mapped to this inspection lot.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="lwcl-empty">
                    <span className={`lwcl-empty-icon ${filters.lotId ? 'is-warn' : ''}`}>
                        <i className={`fa-solid ${filters.lotId ? 'fa-triangle-exclamation' : 'fa-magnifying-glass-chart'}`}></i>
                    </span>
                    <strong>{filters.lotId ? 'No closed loop data for this lot' : 'Select a lot to trace its closed loop'}</strong>
                    <span>
                        {filters.lotId
                            ? 'This lot has no batch-to-inspection mapping yet. Try another lot.'
                            : 'Choose Manufacturer → Plant → Year → Lot Number above.'}
                    </span>
                </div>
            )}

            <style>{`
                .lwcl-root .lwcl-filter-card,
                .lwcl-root .lwcl-result-card {
                    position: relative;
                    margin-top: 16px;
                    padding: 18px 20px;
                    border-radius: 18px;
                    background: rgba(255, 255, 255, 0.85);
                    border: 1px solid rgba(226, 232, 240, 0.9);
                    box-shadow: 0 14px 30px -24px rgba(15, 23, 42, 0.3);
                    animation: rpq-row-in 0.4s ease-out both;
                }
                .lwcl-root .lwcl-filter-card { z-index: 50; overflow: visible; }
                .lwcl-steps { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
                .lwcl-step { display: inline-flex; align-items: center; gap: 7px; font-size: 11.5px; font-weight: 600; color: #94a3b8; }
                .lwcl-step-dot { width: 22px; height: 22px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
                    font-size: 10.5px; font-weight: 700; background: #f1f5f9; color: #94a3b8; border: 1px solid #e2e8f0; transition: all .25s; }
                .lwcl-step.is-done { color: #166534; }
                .lwcl-step.is-done .lwcl-step-dot { background: linear-gradient(135deg, #16a34a, #0d9488); color: #fff; border-color: transparent;
                    box-shadow: 0 4px 10px -4px rgba(22,163,74,.7); }
                .lwcl-step-line { flex: 0 0 34px; height: 2px; border-radius: 2px; background: #e2e8f0; transition: background .25s; }
                .lwcl-step-line.is-done { background: #86efac; }
                .lwcl-filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; }
                .lwcl-field { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
                .lwcl-field > label { display: inline-flex; align-items: center; gap: 6px; margin: 0; font-size: 10.5px; font-weight: 700;
                    letter-spacing: .6px; text-transform: uppercase; color: #64748b; }
                .lwcl-field > label i { color: #16a34a; font-size: 11px; }
                .lwcl-section-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin: 6px 0 12px; }
                .lwcl-section-title { font-size: 13px; font-weight: 700; color: #14532d; letter-spacing: .3px; text-transform: uppercase; }
                .lwcl-section-sub { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 4px; font-size: 12px; color: #64748b; }
                .lwcl-coverage { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: #475569; }
                .lwcl-po { font-weight: 700; color: #0f172a; word-break: break-all; }
                .lwcl-batch { display: inline-block; padding: 3px 10px; border-radius: 8px; font-weight: 700; color: #6d28d9;
                    background: rgba(237, 233, 254, .85); border: 1px solid rgba(196, 181, 253, .6); }
                .lwcl-date-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-weight: 700;
                    color: #0f766e; background: rgba(204, 251, 241, .8); border: 1px solid rgba(94, 234, 212, .6); }
                .lwcl-loading-row { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 26px 0 10px;
                    font-size: 13px; font-weight: 600; color: #475569; }
                .lwcl-empty { margin-top: 16px; padding: 42px 20px; border-radius: 18px; text-align: center; display: flex; flex-direction: column;
                    align-items: center; gap: 8px; background: rgba(255,255,255,.7); border: 1.5px dashed #cbd5e1; animation: rpq-row-in .4s ease-out both; }
                .lwcl-empty strong { font-size: 15px; color: #0f172a; }
                .lwcl-empty span:not(.lwcl-empty-icon) { font-size: 12.5px; color: #64748b; }
                .lwcl-empty-icon { width: 54px; height: 54px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center;
                    font-size: 22px; color: #16a34a; background: linear-gradient(180deg, #ecfdf5, #d1fae5); border: 1px solid rgba(134,239,172,.7); margin-bottom: 4px; }
                .lwcl-empty-icon.is-warn { color: #b45309; background: linear-gradient(180deg, #fffbeb, #fef3c7); border-color: rgba(252,211,77,.7); }
                @media (max-width: 600px) {
                    .lwcl-root .lwcl-filter-card, .lwcl-root .lwcl-result-card { padding: 14px 12px; }
                    .lwcl-step-line { flex-basis: 16px; }
                    .lwcl-filter-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

export default RailPadLwcpReport;

/* Header cells: light pastel tints, same palette as the other Rail Pad reports */
const thBase = {
    padding: '12px 10px',
    fontWeight: '700',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    textAlign: 'center',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
    border: '1px solid rgba(255, 255, 255, 0.9)',
    background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
    color: '#334155',
    '--rpq-th': '#334155',
};
const thGreen = { ...thBase, background: 'linear-gradient(180deg, #dcfce7 0%, #bbf7d0 100%)', color: '#166534', '--rpq-th': '#166534' };
const thBlue = { ...thBase, background: 'linear-gradient(180deg, #dbeafe 0%, #bfdbfe 100%)', color: '#1e40af', '--rpq-th': '#1e40af' };
const thTeal = { ...thBase, background: 'linear-gradient(180deg, #ccfbf1 0%, #99f6e4 100%)', color: '#115e59', '--rpq-th': '#115e59' };

const tdCell = {
    padding: '11px 10px',
    textAlign: 'center',
    borderBottom: '1px solid #f1f5f9',
    borderRight: '1px solid #e2e8f0',
    whiteSpace: 'nowrap',
    fontSize: '12px',
    color: '#334155',
};
const tdMerged = { verticalAlign: 'middle', background: '#ffffff' };
const unit = { color: '#94a3b8', fontSize: '10px', fontWeight: 600 };
