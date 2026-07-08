import { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { API_ENDPOINTS, getAuthHeaders, handleResponse } from '../services/apiConfig';
import { formatDate } from '../utils/helpers';

/* ── Inject keyframes once ──────────────────────── */
if (!document.getElementById('pds-keyframes')) {
    const s = document.createElement('style');
    s.id = 'pds-keyframes';
    s.textContent = `
    @keyframes pds-spin { to { transform: rotate(360deg); } }
    @keyframes pds-fade-up { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pds-fade-in { from { opacity:0; } to { opacity:1; } }
    @keyframes pds-scale-in { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
    @keyframes pds-pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }
    .pds-tile:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.14) !important; }
    .pds-tile { transition: transform 0.2s, box-shadow 0.2s; }
    .pds-tr:hover td { background: #f0f9ff !important; }
    .pds-custom-select-option:hover { background: #f0fdf4 !important; color: #059669 !important; }
    .pds-custom-select-option { transition: all 0.2s ease; }
    .complex-table th, .complex-table td { border: 1px solid #000 !important; }
  `;
    document.head.appendChild(s);
}

export default function ProcessDefectSummaryPage() {
    const [callNoInput, setCallNoInput] = useState('');
    const [submittedCallNo, setSubmittedCallNo] = useState('');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [icNumbers, setIcNumbers] = useState([]);
    const [fetchingIcNumbers, setFetchingIcNumbers] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchIc, setSearchIc] = useState('');

    // Fetch IC numbers list for the logged-in user
    const fetchIcNumbersList = async () => {
        const userId = localStorage.getItem('userId');
        if (!userId) return;
        setFetchingIcNumbers(true);
        try {
            const res = await fetch(`${API_ENDPOINTS.REPORTS}/process/ic-numbers/${userId}`, { headers: getAuthHeaders() });
            const json = await handleResponse(res);
            setIcNumbers(Array.isArray(json) ? json : []);
        } catch (e) {
            console.error('Failed to fetch IC numbers:', e);
        } finally {
            setFetchingIcNumbers(false);
        }
    };

    // Load IC numbers on mount
    useEffect(() => {
        fetchIcNumbersList();
    }, []);

    const fetchData = async (callNo) => {
        if (!callNo) return;
        const trimmed = callNo.trim();
        setLoading(true); setError(''); setData([]);
        try {
            const res = await fetch(`${API_ENDPOINTS.REPORTS}/4thLevelReportICData/${trimmed}`, { headers: getAuthHeaders() });
            const json = await handleResponse(res);
            // API wraps payload: { responseStatus: {...}, responseData: [...] }
            const rows = json?.responseData ?? json;
            setData(Array.isArray(rows) ? rows : []);
            setSubmittedCallNo(trimmed);
        } catch (e) {
            setError(e?.message || 'Failed to fetch. Please check the Call No.');
        } finally { setLoading(false); }
    };

    const handleSelectOption = (val) => {
        setCallNoInput(val);
        setDropdownOpen(false);
        if (val) fetchData(val);
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = () => setDropdownOpen(false);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // Also clear search when dropdown closes
    useEffect(() => {
        if (!dropdownOpen) setSearchIc('');
    }, [dropdownOpen]);


    const handleClear = () => { setCallNoInput(''); setSubmittedCallNo(''); setData([]); setError(''); };

    const exportColumns = [
        { label: 'Date', getValue: (s) => s.basicDetails?.date ? formatDate(s.basicDetails.date) : '—' },
        { label: 'Shift', getValue: (s) => s.basicDetails?.shift || '—' },
        { label: 'Sl.', getValue: (s, idx) => idx + 1 },
        { label: 'PO_Sr. No.', getValue: (s) => s.basicDetails?.poSrNo || '—' },
        { label: 'Lot No.', getValue: (s) => s.basicDetails?.lotNumber || '—' },
        { label: 'Accepted Qty', getValue: (s) => s.basicDetails?.totalAcceptedQty ?? 0 },
        { label: 'Rejected Qty', getValue: (s) => s.basicDetails?.totalRejectionQty ?? 0 },
        { label: 'Shearing Prod', getValue: (s) => s.processQty?.shearingProductionQty ?? 0 },
        { label: 'Shearing Rej', getValue: (s) => s.processQty?.shearingRejectionQty ?? 0 },
        { label: 'Turning Prod', getValue: (s) => s.processQty?.turningProductionQty ?? 0 },
        { label: 'Turning Rej', getValue: (s) => s.processQty?.turningRejectionQty ?? 0 },
        { label: 'MPI Prod', getValue: (s) => s.processQty?.mpiProductionQty ?? 0 },
        { label: 'MPI Rej', getValue: (s) => s.processQty?.mpiRejectionQty ?? 0 },
        { label: 'Forging Prod', getValue: (s) => s.processQty?.forgingProductionQty ?? 0 },
        { label: 'Forging Rej', getValue: (s) => s.processQty?.forgingRejectionQty ?? 0 },
        { label: 'Quenching Prod', getValue: (s) => s.processQty?.quenchingProductionQty ?? 0 },
        { label: 'Quenching Rej', getValue: (s) => s.processQty?.quenchingRejectionQty ?? 0 },
        { label: 'Tempering Prod', getValue: (s) => s.processQty?.temperingProductionQty ?? 0 },
        { label: 'Tempering Rej', getValue: (s) => s.processQty?.temperingRejectionQty ?? 0 },
        { label: 'Shearing Cut Len', getValue: (s) => s.shearingDefects?.lengthOfCutBar ?? 0 },
        { label: 'Shearing Ovality', getValue: (s) => s.shearingDefects?.ovalityImproperDiaAtEnd ?? 0 },
        { label: 'Shearing Sharp Edges', getValue: (s) => s.shearingDefects?.sharpEdges ?? 0 },
        { label: 'Shearing Cracks', getValue: (s) => s.shearingDefects?.crackedEdges ?? 0 },
        { label: 'Turning Para Len', getValue: (s) => s.turningDefects?.parallelLength ?? 0 },
        { label: 'Turning Full Turn', getValue: (s) => s.turningDefects?.fullTurningLength ?? 0 },
        { label: 'Turning Turn Dia', getValue: (s) => s.turningDefects?.turningDia ?? 0 },
        { label: 'MPI MPI Rej', getValue: (s) => s.processQty?.mpiRejectionQty ?? 0 },
        { label: 'Forging Forge Temp', getValue: (s) => s.forgingDefects?.forgingTemperature ?? 0 },
        { label: 'Forging Stabilise', getValue: (s) => s.forgingDefects?.forgingStabilisationRejection ?? 0 },
        { label: 'Forging Improper', getValue: (s) => s.forgingDefects?.improperForging ?? 0 },
        { label: 'Forging Defect', getValue: (s) => s.forgingDefects?.forgingMarksNotches ?? 0 },
        { label: 'Quenching Hardness', getValue: (s) => s.quenchingDefects?.quenchingHardness ?? 0 },
        { label: 'Tempering Temp.', getValue: (s) => s.temperingDefects?.temperingTemp ?? 0 },
        { label: 'Tempering Dur.', getValue: (s) => s.temperingDefects?.temperingDuration ?? 0 },
        { label: 'Dimensional Box Gauge', getValue: (s) => s.dimensionalDefects?.boxGauge ?? 0 },
        { label: 'Dimensional Bearing Area', getValue: (s) => s.dimensionalDefects?.flatBearingArea ?? 0 },
        { label: 'Dimensional Falling', getValue: (s) => s.dimensionalDefects?.fallingGauge ?? 0 },
        { label: 'Visual Surface', getValue: (s) => s.visualDefects?.surfaceDefect ?? 0 },
        { label: 'Visual Embossing', getValue: (s) => s.visualDefects?.embossingDefect ?? 0 },
        { label: 'Visual Marking', getValue: (s) => s.visualDefects?.marking ?? 0 },
        { label: 'Testing Temp Hard', getValue: (s) => s.testingDefects?.temperingHardness ?? 0 },
        { label: 'Testing Toe Load', getValue: (s) => s.testingDefects?.toeLoad ?? 0 },
        { label: 'Testing Weight', getValue: (s) => s.testingDefects?.weight ?? 0 },
        { label: 'Finishing Paint ID', getValue: (s) => s.finishingDefects?.paintIdentification ?? 0 },
        { label: 'Finishing Coating', getValue: (s) => s.finishingDefects?.ercCoating ?? 0 }
    ];

    const downloadExcel = async () => {
        if (!data || data.length === 0) return;
        const displayTitle = `Process Defect Summary - Call No: ${submittedCallNo || ''}`;
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Report');

        const titleRow = worksheet.addRow([displayTitle]);
        titleRow.font = { bold: true, size: 14 };
        if (exportColumns.length > 1) {
            worksheet.mergeCells(1, 1, 1, exportColumns.length);
        }
        
        worksheet.addRow([]);
        
        const headerRow = worksheet.addRow(exportColumns.map(col => col.label));
        headerRow.font = { bold: true };
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
            cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });

        data.forEach((shift, idx) => {
            const rowData = exportColumns.map(col => {
                const val = col.getValue(shift, idx);
                return (val === null || val === undefined) ? '' : val;
            });
            worksheet.addRow(rowData);
        });

        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                let columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxLength) maxLength = columnLength;
            });
            column.width = maxLength < 10 ? 10 : maxLength + 2;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Process_Defect_Summary_${submittedCallNo}.xlsx`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalAccepted = data.reduce((s, r) => s + (r.basicDetails?.totalAcceptedQty ?? 0), 0);
    const totalRejected = data.reduce((s, r) => s + (r.basicDetails?.totalRejectionQty ?? 0), 0);
    const totalProduced = totalAccepted + totalRejected;
    const rejPct = totalProduced > 0 ? ((totalRejected / totalProduced) * 100).toFixed(1) : '0.0';

    /* ── KPI config ── */
    // eslint-disable-next-line no-unused-vars
    const kpis = [
        { label: 'Shifts Recorded', value: data.length, icon: '📅', gradient: 'linear-gradient(135deg,#1e40af,#3b82f6)', accent: '#dbeafe' },
        { label: 'Total Produced', value: totalProduced.toLocaleString(), icon: '🏭', gradient: 'linear-gradient(135deg,#4f46e5,#8b5cf6)', accent: '#ede9fe' },
        { label: 'Total Accepted', value: totalAccepted.toLocaleString(), icon: '✅', gradient: 'linear-gradient(135deg,#065f46,#10b981)', accent: '#d1fae5' },
        { label: 'Total Rejected', value: totalRejected.toLocaleString(), icon: '❌', gradient: totalRejected > 0 ? 'linear-gradient(135deg,#991b1b,#ef4444)' : 'linear-gradient(135deg,#065f46,#10b981)', accent: totalRejected > 0 ? '#fee2e2' : '#d1fae5' },
        { label: 'Rejection %', value: `${rejPct}%`, icon: '📉', gradient: parseFloat(rejPct) > 5 ? 'linear-gradient(135deg,#92400e,#f59e0b)' : 'linear-gradient(135deg,#065f46,#10b981)', accent: parseFloat(rejPct) > 5 ? '#fef3c7' : '#d1fae5' },
    ];
    /* ── Report-style table headers: no colour, white bg, dark text ── */
    const thC = {
        background: '#f9fafb', color: '#111827', fontWeight: 700,
        fontSize: '11px', padding: '7px 10px', textAlign: 'center',
        border: '1px solid #000', textTransform: 'uppercase',
        letterSpacing: '0.04em', whiteSpace: 'nowrap',
    };
    const TH = {
        base: { ...thC },
        accepted: { ...thC, color: '#065f46', background: '#f0fdf4' },
        rejected: { ...thC, color: '#991b1b', background: '#fff5f5' },
        proc: { ...thC, background: '#f3f4f6' },
        procSub: { ...thC, background: '#fff', fontWeight: 600, fontSize: '10px', padding: '5px 8px', textTransform: 'none', letterSpacing: '0.02em' },
        rej: { ...thC, background: '#f3f4f6' },
        rejSub: { ...thC, background: '#fff', fontWeight: 600, fontSize: '10px', padding: '5px 8px', textTransform: 'none', letterSpacing: '0.02em' },
        tempering: { ...thC, background: '#f5f3ff', color: '#5b21b6' },
        leaf: { ...thC, background: '#fff', fontWeight: 500, fontSize: '10px', padding: '5px 8px', textTransform: 'none', letterSpacing: '0.01em', color: '#374151' },
    };


    return (
        <div style={{ animation: 'pds-fade-up .35s ease' }}>

            {/* ═══════════════════════════════════════════════════
          HERO BANNER
      ═══════════════════════════════════════════════════ */}
            <div style={{
                background: 'linear-gradient(135deg, #052e16 0%, #14532d 55%, #166534 100%)',
                borderRadius: '14px',
                padding: '0',
                marginBottom: '20px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 8px 32px rgba(20,83,45,0.30)',
            }}>
                {/* Decorative circles */}
                <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -60, left: 180, width: 220, height: 220, borderRadius: '50%', background: 'rgba(99,179,237,0.07)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: 10, left: 260, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                        {/* Icon box */}
                        <div style={{
                            width: 56, height: 56, borderRadius: 14,
                            background: 'linear-gradient(135deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06))',
                            border: '1px solid rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 26, flexShrink: 0,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                        }}>📊</div>
                        <div>
                            <div style={{ color: 'rgba(147,210,255,0.85)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>
                                Railway Board &nbsp;·&nbsp; Process Inspection
                            </div>
                            <div style={{ color: '#fff', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                                Process Defect Summary
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginTop: 4 }}>
                                Shift-wise defect breakdown by call number
                            </div>
                        </div>
                    </div>

                    {/* Active call badge */}
                    {submittedCallNo && (
                        <div style={{
                            padding: '10px 20px',
                            background: 'rgba(255,255,255,0.12)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: 30,
                            display: 'flex', alignItems: 'center', gap: 8,
                            animation: 'pds-fade-up .3s ease',
                        }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pds-pulse-dot 2s infinite' }} />
                            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{submittedCallNo}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════
          SEARCH CARD
      ═══════════════════════════════════════════════════ */}
            <div style={{
                background: '#fff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                marginBottom: 20,
                overflow: 'visible', // Allow dropdown overflow
                boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)',
                transition: 'all 0.4s ease',
            }}>
                {/* Card top stripe */}
                <div style={{ height: '3px', background: 'linear-gradient(90deg, #064e3b, #10b981, #064e3b)' }} />

                <div style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>

                        {/* Compact Custom Dropdown */}
                        <div
                            style={{ position: 'relative', flex: '1 1 280px', maxWidth: 450 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div
                                onClick={() => !fetchingIcNumbers && setDropdownOpen(!dropdownOpen)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: dropdownOpen ? '#fff' : '#f8fafc',
                                    border: dropdownOpen ? '2px solid #059669' : '2px solid #e2e8f0',
                                    borderRadius: '12px',
                                    padding: '0 14px',
                                    height: '46px',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: dropdownOpen ? '0 8px 20px -6px rgba(5, 150, 105, 0.15)' : 'none',
                                    cursor: fetchingIcNumbers ? 'wait' : 'pointer',
                                    userSelect: 'none',
                                }}
                            >
                                <div style={{
                                    width: 30, height: 30, borderRadius: '8px',
                                    background: dropdownOpen ? '#ecfdf5' : '#f1f5f9',
                                    color: dropdownOpen ? '#059669' : '#64748b',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginRight: 10, transition: 'all 0.3s ease', flexShrink: 0
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </div>

                                <div style={{
                                    flex: 1,
                                    fontSize: '14px',
                                    color: callNoInput ? '#0f172a' : '#94a3b8',
                                    fontWeight: callNoInput ? 700 : 500,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {fetchingIcNumbers ? 'Loading call records...' : (callNoInput || 'Select Call Number')}
                                </div>

                                <div style={{
                                    color: dropdownOpen ? '#059669' : '#94a3b8',
                                    transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    marginLeft: 8,
                                    display: 'flex',
                                }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </div>
                            </div>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 8px)',
                                        left: 0,
                                        right: 0,
                                        background: '#fff',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 12px 30px -8px rgba(0,0,0,0.15)',
                                        zIndex: 1000,
                                        maxHeight: '260px',
                                        overflowY: 'auto',
                                        padding: '6px',
                                        animation: 'pds-scale-in 0.2s ease-out forwards',
                                    }}>
                                    <div style={{ padding: '4px 6px', marginBottom: '4px' }}>
                                        <input
                                            type="text"
                                            placeholder="Search Call No..."
                                            value={searchIc}
                                            onChange={(e) => setSearchIc(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                border: '1px solid #cbd5e1',
                                                fontSize: '13px',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                    {icNumbers.filter(ic => ic.toLowerCase().includes(searchIc.toLowerCase())).length === 0 ? (
                                        <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                                            No call numbers found
                                        </div>
                                    ) : (
                                        icNumbers.filter(ic => ic.toLowerCase().includes(searchIc.toLowerCase())).map(ic => (
                                            <div
                                                key={ic}
                                                className="pds-custom-select-option"
                                                onClick={() => handleSelectOption(ic)}
                                                style={{
                                                    padding: '10px 14px',
                                                    borderRadius: '8px',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    color: callNoInput === ic ? '#059669' : '#334155',
                                                    background: callNoInput === ic ? '#f0fdf4' : 'transparent',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between'
                                                }}
                                            >
                                                <span>{ic}</span>

                                                {callNoInput === ic && (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                        <path d="M20 6L9 17l-5-5" />
                                                    </svg>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Loading / Status */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {loading && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '6px 12px', background: '#ecfdf5', borderRadius: '30px',
                                    border: '1px solid #d1fae5', animation: 'pds-fade-in .3s ease'
                                }}>
                                    <span style={{
                                        display: 'inline-block', width: 12, height: 12,
                                        border: '2px solid #059669', borderTopColor: 'transparent',
                                        borderRadius: '50%', animation: 'pds-spin 0.6s linear infinite'
                                    }} />
                                    <span style={{ color: '#065f46', fontSize: '10px', fontWeight: 800, letterSpacing: '0.04em' }}>
                                        FETCHING
                                    </span>
                                </div>
                            )}

                            {!loading && submittedCallNo && (
                                <div style={{
                                    padding: '6px 12px', background: '#f8fafc', borderRadius: '30px',
                                    border: '1px solid #e2e8f0', color: '#059669', fontSize: '11px',
                                    fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6
                                }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                    LOADED
                                </div>
                            )}

                            {(submittedCallNo || error) && (
                                <button
                                    onClick={handleClear}
                                    style={{
                                        border: 'none', background: 'transparent', color: '#94a3b8',
                                        fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '4px 8px'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            marginTop: 12, padding: '8px 16px', background: '#fff1f2', border: '1px solid #fecdd3',
                            borderRadius: '10px', color: '#9f1239', fontSize: '12px', display: 'flex',
                            alignItems: 'center', gap: 10, animation: 'pds-fade-up .3s ease'
                        }}>
                            <span style={{ fontWeight: 800 }}>!</span> {error}
                        </div>
                    )}
                </div>
            </div>


            {/* ═══════════════════════════════════════════════════
          KPI TILES — temporarily hidden, code preserved
          {!loading && submittedCallNo && data.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 20, animation: 'pds-fade-up .35s ease' }}>
                  {kpis.map((k, i) => (
                      <div key={k.label} className="pds-tile" style={{
                          borderRadius: 12, overflow: 'hidden',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.10)',
                          cursor: 'default',
                          animation: `pds-fade-up .35s ease ${i * 0.06}s both`,
                      }}>
                          <div style={{ background: k.gradient, padding: '16px 18px 12px' }}>
                              <div style={{ fontSize: 22, marginBottom: 8 }}>{k.icon}</div>
                              <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{k.value}</div>
                          </div>
                          <div style={{ background: '#fff', padding: '8px 18px 12px', borderTop: 'none' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      ═══════════════════════════════════════════════════ */}

            {/* ═══════════════════════════════════════════════════
          TABLE CARD
      ═══════════════════════════════════════════════════ */}
            <div style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                animation: 'pds-fade-up .4s ease .1s both',
            }}>
                {/* Toolbar */}
                <div style={{
                    padding: '13px 20px',
                    borderBottom: '1px solid #000',
                    background: 'linear-gradient(to right, #f8fafc, #fff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'linear-gradient(135deg,#0369a1,#7c3aed)', boxShadow: '0 0 6px rgba(3,105,161,.4)' }} />
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Shift-wise Defect Breakdown
                        </span>
                    </div>
                    {data.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: '3px 12px', background: '#eff6ff', borderRadius: 20, fontSize: '11px', fontWeight: 700, color: '#1d4ed8' }}>
                                {data.length} shift{data.length !== 1 ? 's' : ''}
                            </div>
                            <button
                                onClick={downloadExcel}
                                style={{
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 14px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#059669'}
                                onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '2px' }}>
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                                </svg>
                                Export Excel
                            </button>
                        </div>
                    )}
                </div>

                {/* Spinner */}
                {loading && (
                    <div style={{ padding: '72px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-block', width: 36, height: 36, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#0369a1', animation: 'pds-spin 0.8s linear infinite', marginBottom: 16 }} />
                        <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Fetching defect data…</div>
                    </div>
                )}

                {!loading && (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table complex-table" style={{ minWidth: 1100, fontSize: '12px', borderCollapse: 'collapse', border: '1px solid #000', marginTop: '-1px' }}>
                            <thead>
                                {/* ── Row 1: top-level groups ── */}
                                <tr>
                                    <th rowSpan={3} style={TH.base}>Date</th>
                                    <th rowSpan={3} style={TH.base}>Shift</th>
                                    <th rowSpan={3} style={TH.base}>Sl.</th>
                                    <th rowSpan={3} style={{ ...TH.base, whiteSpace: 'nowrap' }}>PO_Sr. No.</th>
                                    <th rowSpan={3} style={TH.base}>Lot No.</th>
                                    <th rowSpan={3} style={TH.accepted}>Accepted Qty</th>
                                    <th rowSpan={3} style={TH.rejected}>Rejected Qty</th>
                                    {/* Process Production */}
                                    <th colSpan={2} style={TH.proc}>Shearing</th>
                                    <th colSpan={2} style={TH.proc}>Turning</th>
                                    <th colSpan={2} style={TH.proc}>MPI</th>
                                    <th colSpan={2} style={TH.proc}>Forging</th>
                                    <th colSpan={2} style={TH.proc}>Quenching</th>
                                    <th colSpan={2} style={TH.proc}>Tempering</th>
                                    {/* Rejection Classification */}
                                    <th colSpan={26} style={TH.rej}>Rejection Classification</th>
                                </tr>
                                {/* ── Row 2: sub-group labels ── */}
                                <tr>
                                    <th rowSpan={2} style={TH.procSub}>Prod</th><th rowSpan={2} style={TH.procSub}>Rej</th>
                                    <th rowSpan={2} style={TH.procSub}>Prod</th><th rowSpan={2} style={TH.procSub}>Rej</th>
                                    <th rowSpan={2} style={TH.procSub}>Prod</th><th rowSpan={2} style={TH.procSub}>Rej</th>
                                    <th rowSpan={2} style={TH.procSub}>Prod</th><th rowSpan={2} style={TH.procSub}>Rej</th>
                                    <th rowSpan={2} style={TH.procSub}>Prod</th><th rowSpan={2} style={TH.procSub}>Rej</th>
                                    <th rowSpan={2} style={TH.procSub}>Prod</th><th rowSpan={2} style={TH.procSub}>Rej</th>
                                    <th colSpan={4} style={TH.rejSub}>Shearing Defects</th>
                                    <th colSpan={3} style={TH.rejSub}>Turning Defects</th>
                                    <th style={TH.rejSub}>MPI</th>
                                    <th colSpan={4} style={TH.rejSub}>Forging Defects</th>
                                    <th style={TH.rejSub}>Quenching</th>
                                    <th colSpan={2} style={TH.tempering}>Tempering Defects</th>
                                    <th colSpan={3} style={TH.rejSub}>Dimensional</th>
                                    <th colSpan={3} style={TH.rejSub}>Visual</th>
                                    <th colSpan={3} style={TH.rejSub}>Testing</th>
                                    <th colSpan={2} style={TH.rejSub}>Finishing</th>
                                </tr>
                                {/* ── Row 3: leaf column names ── */}
                                <tr>
                                    <th style={TH.leaf}>Cut Len</th><th style={TH.leaf}>Ovality</th>
                                    <th style={TH.leaf}>Sharp Edges</th><th style={TH.leaf}>Cracks</th>
                                    <th style={TH.leaf}>Para Len</th><th style={TH.leaf}>Full Turn</th><th style={TH.leaf}>Turn Dia</th>
                                    <th style={TH.leaf}>MPI Rej</th>
                                    <th style={TH.leaf}>Forge Temp</th><th style={TH.leaf}>Stabilise</th>
                                    <th style={TH.leaf}>Improper</th><th style={TH.leaf}>Defect</th>
                                    <th style={TH.leaf}>Hardness</th>
                                    <th style={TH.leaf}>Temp.</th><th style={TH.leaf}>Dur.</th>
                                    <th style={TH.leaf}>Box Gauge</th><th style={TH.leaf}>Bearing Area</th><th style={TH.leaf}>Falling</th>
                                    <th style={TH.leaf}>Surface</th><th style={TH.leaf}>Embossing</th><th style={TH.leaf}>Marking</th>
                                    <th style={TH.leaf}>Temp Hard</th><th style={TH.leaf}>Toe Load</th><th style={TH.leaf}>Weight</th>
                                    <th style={TH.leaf}>Paint ID</th><th style={TH.leaf}>Coating</th>
                                </tr>
                            </thead>

                            <tbody>
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={43} style={{ padding: '72px 20px', textAlign: 'center', background: '#fafbfc' }}>
                                            <div style={{
                                                display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                                                padding: '32px 48px',
                                                background: '#fff',
                                                borderRadius: 16,
                                                border: '1px dashed #cbd5e1',
                                                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                            }}>
                                                <div style={{ fontSize: 48, lineHeight: 1 }}>{submittedCallNo ? '📭' : '🔎'}</div>
                                                <div style={{ fontSize: '15px', fontWeight: 700, color: '#334155' }}>
                                                    {submittedCallNo ? 'No data found' : 'Ready to search'}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#94a3b8', maxWidth: 260, textAlign: 'center', lineHeight: 1.5 }}>
                                                    {submittedCallNo
                                                        ? `No defect records found for call ${submittedCallNo}. Please verify the call number.`
                                                        : 'Select a Process call number from the dropdown above to load shift-wise defect data.'}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((shift, idx) => {
                                        const even = idx % 2 === 0;
                                        const rejQty = shift.basicDetails?.totalRejectionQty ?? 0;
                                        return (
                                            <tr key={idx} className={`pds-tr ${even ? 'row-odd' : 'row-even'}`}>
                                                <td style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{shift.basicDetails?.date ? formatDate(shift.basicDetails.date) : '—'}</td>
                                                <td>
                                                    <span style={{ display: 'inline-block', padding: '2px 10px', background: '#1e293b', color: '#fff', borderRadius: 12, fontSize: '11px', fontWeight: 700 }}>
                                                        {shift.basicDetails?.shift || '—'}
                                                    </span>
                                                </td>
                                                <td style={{ color: '#94a3b8', fontSize: '11px' }}>{idx + 1}</td>
                                                <td style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{shift.basicDetails?.poSrNo || '—'}</td>
                                                <td>{shift.basicDetails?.lotNumber || '—'}</td>
                                                <td>
                                                    <span style={{ color: '#15803d', fontWeight: 700 }}>{shift.basicDetails?.totalAcceptedQty ?? 0}</span>
                                                </td>
                                                <td>
                                                    {rejQty > 0
                                                        ? <span style={{ display: 'inline-block', padding: '2px 8px', background: '#fef2f2', color: '#dc2626', borderRadius: 8, fontWeight: 700, fontSize: '12px' }}>{rejQty}</span>
                                                        : <span style={{ color: '#94a3b8' }}>0</span>
                                                    }
                                                </td>
                                                <td>{shift.processQty?.shearingProductionQty ?? 0}</td>
                                                <td>{shift.processQty?.shearingRejectionQty ?? 0}</td>
                                                <td>{shift.processQty?.turningProductionQty ?? 0}</td>
                                                <td>{shift.processQty?.turningRejectionQty ?? 0}</td>
                                                <td>{shift.processQty?.mpiProductionQty ?? 0}</td>
                                                <td>{shift.processQty?.mpiRejectionQty ?? 0}</td>
                                                <td>{shift.processQty?.forgingProductionQty ?? 0}</td>
                                                <td>{shift.processQty?.forgingRejectionQty ?? 0}</td>
                                                <td>{shift.processQty?.quenchingProductionQty ?? 0}</td>
                                                <td>{shift.processQty?.quenchingRejectionQty ?? 0}</td>
                                                <td>{shift.processQty?.temperingProductionQty ?? 0}</td>
                                                <td>{shift.processQty?.temperingRejectionQty ?? 0}</td>
                                                <td>{shift.shearingDefects?.lengthOfCutBar ?? 0}</td>
                                                <td>{shift.shearingDefects?.ovalityImproperDiaAtEnd ?? 0}</td>
                                                <td>{shift.shearingDefects?.sharpEdges ?? 0}</td>
                                                <td>{shift.shearingDefects?.crackedEdges ?? 0}</td>
                                                <td>{shift.turningDefects?.parallelLength ?? 0}</td>
                                                <td>{shift.turningDefects?.fullTurningLength ?? 0}</td>
                                                <td>{shift.turningDefects?.turningDia ?? 0}</td>
                                                <td>{shift.processQty?.mpiRejectionQty ?? 0}</td>
                                                <td>{shift.forgingDefects?.forgingTemperature ?? 0}</td>
                                                <td>{shift.forgingDefects?.forgingStabilisationRejection ?? 0}</td>
                                                <td>{shift.forgingDefects?.improperForging ?? 0}</td>
                                                <td>{shift.forgingDefects?.forgingMarksNotches ?? 0}</td>
                                                <td>{shift.quenchingDefects?.quenchingHardness ?? 0}</td>
                                                <td>{shift.temperingDefects?.temperingTemp ?? 0}</td>
                                                <td>{shift.temperingDefects?.temperingDuration ?? 0}</td>

                                                <td>{shift.dimensionalDefects?.boxGauge ?? 0}</td>
                                                <td>{shift.dimensionalDefects?.flatBearingArea ?? 0}</td>
                                                <td>{shift.dimensionalDefects?.fallingGauge ?? 0}</td>
                                                <td>{shift.visualDefects?.surfaceDefect ?? 0}</td>
                                                <td>{shift.visualDefects?.embossingDefect ?? 0}</td>
                                                <td>{shift.visualDefects?.marking ?? 0}</td>
                                                <td>{shift.testingDefects?.temperingHardness ?? 0}</td>
                                                <td>{shift.testingDefects?.toeLoad ?? 0}</td>
                                                <td>{shift.testingDefects?.weight ?? 0}</td>
                                                <td>{shift.finishingDefects?.paintIdentification ?? 0}</td>
                                                <td>{shift.finishingDefects?.ercCoating ?? 0}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div >
    );
}
