import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getActiveLogins, getAllActiveLogins, fetchSelfieBlob, getNearestPlant } from '../../services/activeLoginService';

// Fires fetchFn for each item but keeps at most `limit` in-flight at once
async function throttledFetch(items, limit, fetchFn) {
    let idx = 0;
    const worker = async () => {
        while (idx < items.length) {
            const item = items[idx++];
            await fetchFn(item).catch(() => {});
        }
    };
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

// Always show login times in IST, whatever the viewer's computer time zone is.
// The API sends an offset (e.g. "+05:30"); a value without one is treated as IST.
const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/;
const fmtDateTime = str => {
    if (!str) return '—';
    const d = new Date(HAS_ZONE.test(str) ? str : `${str}+05:30`);
    return isNaN(d) ? str : d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
};

const th = { padding: '10px 12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, background: '#166534', color: '#fff', whiteSpace: 'nowrap' };
const td = { padding: '10px 12px', fontSize: '13px', borderBottom: '1px solid #e5e7eb', verticalAlign: 'middle' };

const PAGE_SIZES = [5, 10, 20, 25];

// Shimmer placeholder used while rows / plant info load
const SKELETON_CSS = `
@keyframes al-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
.al-skel { display: inline-block; height: 12px; border-radius: 6px;
  background: linear-gradient(90deg, #eef2ef 0px, #dfe7e2 120px, #eef2ef 240px);
  background-size: 800px 100%; animation: al-shimmer 1.2s linear infinite; }
`;
const Skel = ({ w = '80%', h = 12, r }) => (
    <span className="al-skel" style={{ width: w, height: h, borderRadius: r ?? h / 2 }} />
);
// Widths per column so placeholder rows look like the real table
const SKELETON_COLS = [
    <Skel w={18} />, <Skel w="70%" />, <Skel w={64} h={18} />, <Skel w="80%" />,
    <Skel w="60%" />, <Skel w="60%" />,
    <><Skel w={90} /><div style={{ marginTop: 6 }}><Skel w={150} h={10} /></div></>,
    <Skel w={48} h={24} r={6} />,
];

const typeBadge = t => {
    const map = { ERC: ['#fef3c7', '#92400e'], SLEEPER: ['#dbeafe', '#1e40af'], RAIL_PAD: ['#f3e8ff', '#6b21a8'] };
    const [bg, col] = map[t] || ['#f3f4f6', '#374151'];
    return <span style={{ background: bg, color: col, padding: '2px 6px', borderRadius: '999px', fontSize: '10px', fontWeight: 700 }}>{t}</span>;
};

export default function ActiveLoginDashboard() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selfie, setSelfie] = useState(null);
    const [modalData, setModalData] = useState(null);       // full modal { userName, data }
    // map: userId -> { loading, np: NearestPlantDto|null, error }
    const [plantMap, setPlantMap] = useState({});
    const [exportingExcel, setExportingExcel] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);


    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        setPlantMap({});
        getActiveLogins({ page, size, search: query })
            .then(data => {
                const content = data.content || [];
                setRows(content);
                setTotal(data.totalElements || 0);
                setTotalPages(data.totalPages || 0);
                // auto-fetch nearest plant — max 5 in-flight at once to avoid overloading backend
                const withLocation = content.filter(r => r.latitude != null && r.userId != null);
                // mark all as loading up-front so spinners appear immediately
                setPlantMap(prev => {
                    const next = { ...prev };
                    withLocation.forEach(r => { next[String(r.userId)] = { loading: true }; });
                    return next;
                });
                throttledFetch(withLocation, 5, r => {
                    const uid = String(r.userId);
                    return getNearestPlant(uid)
                        .then(d => {
                            const rd = d.responseData || d.data || d;
                            setPlantMap(prev => ({ ...prev, [uid]: { loading: false, np: rd.nearestPlant || null, data: rd } }));
                        })
                        .catch(() => {
                            setPlantMap(prev => ({ ...prev, [uid]: { loading: false, np: null } }));
                        });
                });
            })
            .catch(e => setError(e.message || 'Failed to load active logins'))
            .finally(() => setLoading(false));
    }, [page, size, query]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        const t = setTimeout(() => { setQuery(search.trim()); setPage(0); }, 400);
        return () => clearTimeout(t);
    }, [search]);

    const selfieObjectUrlRef = useRef(null);

    const openSelfie = id => {
        // Revoke any previous object URL to prevent memory leaks
        if (selfieObjectUrlRef.current) {
            URL.revokeObjectURL(selfieObjectUrlRef.current);
            selfieObjectUrlRef.current = null;
        }
        setSelfie({ id, loading: true });
        fetchSelfieBlob(id)
            .then(objectUrl => {
                selfieObjectUrlRef.current = objectUrl;
                setSelfie({ id, src: objectUrl });
            })
            .catch(() => setSelfie({ id, src: null }));
    };

    const closeSelfie = () => {
        if (selfieObjectUrlRef.current) {
            URL.revokeObjectURL(selfieObjectUrlRef.current);
            selfieObjectUrlRef.current = null;
        }
        setSelfie(null);
    };

    const openModal = (userId, userName) => {
        const uid = String(userId);
        const cached = plantMap[uid];
        if (cached && cached.data) {
            setModalData({ userName, data: cached.data });
        } else {
            setModalData({ userName, loading: true });
            getNearestPlant(uid)
                .then(d => setModalData({ userName, data: d.responseData || d.data || d }))
                .catch(e => setModalData({ userName, error: e.message || 'Failed' }));
        }
    };

    const from = total === 0 ? 0 : page * size + 1;
    const to = Math.min((page + 1) * size, total);

    const enrichWithPlants = async (records) => {
        const currentPlantMap = { ...plantMap };
        const needFetch = records.filter(r => r.latitude != null && r.userId != null && !currentPlantMap[String(r.userId)]?.np);
        if (needFetch.length > 0) {
            await throttledFetch(needFetch, 10, async r => {
                const uid = String(r.userId);
                try {
                    const d = await getNearestPlant(uid);
                    const rd = d.responseData || d.data || d;
                    currentPlantMap[uid] = { loading: false, np: rd?.nearestPlant || null, data: rd };
                } catch {
                    currentPlantMap[uid] = { loading: false, np: null };
                }
            });
            setPlantMap(currentPlantMap);
        }
        return records.map(r => {
            const uid = String(r.userId);
            const pm = currentPlantMap[uid];
            return {
                ...r,
                nearestPlant: pm?.np || null
            };
        });
    };

    const handleExportExcel = async () => {
        setExportingExcel(true);
        try {
            const allLogins = await getAllActiveLogins({ search: query });
            if (!allLogins || allLogins.length === 0) {
                alert('No active logins found to export.');
                return;
            }
            const enriched = await enrichWithPlants(allLogins);

            const exportData = enriched.map((r, i) => {
                const np = r.nearestPlant;
                return {
                    'S.No': i + 1,
                    'Name': r.userName || '—',
                    'Status': r.status || 'AUTHENTICATED',
                    'Login Time': fmtDateTime(r.verifiedAt),
                    'Latitude': r.latitude != null ? r.latitude : '—',
                    'Longitude': r.longitude != null ? r.longitude : '—',
                    'Plant Type': np?.type || '—',
                    'Nearest Plant': np ? (np.plantName || np.plantId || '—') : (r.latitude != null ? 'No plant mapped' : '—'),
                    'Distance (m)': np?.distanceMeters != null ? np.distanceMeters : '—',
                    'Company': np?.companyName || '—',
                    'Plant Address': np?.address || '—',
                    'Selfie': r.hasSelfie ? 'Available' : 'No',
                    'Device Info': r.deviceInfo || '—',
                    'IP Address': r.ipAddress || '—',
                };
            });

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Active Logins');

            // Auto-size columns
            const colWidths = Object.keys(exportData[0] || {}).map(key => {
                const maxLen = Math.max(
                    ...exportData.map(row => String(row[key] ?? '').length),
                    key.length
                );
                return { wch: Math.min(Math.max(maxLen + 2, 10), 45) };
            });
            ws['!cols'] = colWidths;

            const dateStr = new Date().toISOString().slice(0, 10);
            XLSX.writeFile(wb, `Active_Logins_${dateStr}.xlsx`);
        } catch (err) {
            console.error('Failed to export Excel:', err);
            alert('Failed to export Excel: ' + (err.message || 'Unknown error'));
        } finally {
            setExportingExcel(false);
        }
    };

    const handleExportPdf = async () => {
        setExportingPdf(true);
        try {
            const allLogins = await getAllActiveLogins({ search: query });
            if (!allLogins || allLogins.length === 0) {
                alert('No active logins found to export.');
                return;
            }
            const enriched = await enrichWithPlants(allLogins);

            const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

            // Title
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(22, 101, 52); // #166534
            doc.text('SARTHI - Active Login Details', 30, 32);

            // Subtitle
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            const genDate = new Date().toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            const subtitle = `Generated on: ${genDate} IST  |  Total Active Users: ${enriched.length}${query ? `  |  Filter: "${query}"` : ''}`;
            doc.text(subtitle, 30, 46);

            const tableHead = [[
                '#', 'Name', 'Status', 'Login Time', 'Latitude', 'Longitude', 'Nearest Plant / Unit', 'Distance', 'Selfie'
            ]];

            const tableBody = enriched.map((r, i) => {
                const np = r.nearestPlant;
                const plantText = np ? (np.plantName || np.plantId || '—') : (r.latitude != null ? 'No plant mapped' : '—');
                const plantDisplay = np?.type ? `[${np.type}] ${plantText}` : plantText;
                const distDisplay = np?.distanceMeters != null ? `${np.distanceMeters} m` : '—';
                return [
                    i + 1,
                    r.userName || '—',
                    r.status || 'AUTHENTICATED',
                    fmtDateTime(r.verifiedAt),
                    r.latitude != null ? String(r.latitude) : '—',
                    r.longitude != null ? String(r.longitude) : '—',
                    plantDisplay,
                    distDisplay,
                    r.hasSelfie ? 'Yes' : 'No'
                ];
            });

            const runAutoTable = typeof autoTable === 'function' ? autoTable : autoTable.default;
            runAutoTable(doc, {
                startY: 58,
                head: tableHead,
                body: tableBody,
                styles: { fontSize: 8, cellPadding: 5, valign: 'middle' },
                headStyles: { fillColor: [22, 101, 52], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: {
                    0: { cellWidth: 26, halign: 'center' },
                    1: { cellWidth: 110, fontStyle: 'bold' },
                    2: { cellWidth: 70, halign: 'center' },
                    3: { cellWidth: 95 },
                    4: { cellWidth: 55 },
                    5: { cellWidth: 55 },
                    6: { cellWidth: 240 },
                    7: { cellWidth: 55, halign: 'right' },
                    8: { cellWidth: 40, halign: 'center' },
                }
            });

            // Add page numbers
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(
                    `Page ${i} of ${pageCount}`,
                    doc.internal.pageSize.getWidth() - 70,
                    doc.internal.pageSize.getHeight() - 15
                );
            }

            const dateStr = new Date().toISOString().slice(0, 10);
            doc.save(`Active_Logins_${dateStr}.pdf`);
        } catch (err) {
            console.error('Failed to export PDF:', err);
            alert('Failed to export PDF: ' + (err.message || 'Unknown error'));
        } finally {
            setExportingPdf(false);
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <style>{SKELETON_CSS}</style>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center' }}>
                    <i className="fa-solid fa-id-card" style={{ marginRight: '8px' }}></i>
                    Active Login ({total})
                </h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        placeholder="Search name…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', minWidth: '220px', height: '36px', boxSizing: 'border-box' }}
                    />
                    <button className="sub-tab-btn active" onClick={load} disabled={loading} style={{ margin: 0, padding: '0 16px', height: '36px', display: 'inline-flex', alignItems: 'center' }}>
                        <i className={`fa-solid fa-rotate${loading ? ' fa-spin' : ''}`} style={{ marginRight: '6px' }}></i>
                        {loading ? 'Loading…' : 'Refresh'}
                    </button>
                    <button
                        onClick={handleExportExcel}
                        disabled={exportingExcel || exportingPdf || total === 0}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            height: '36px',
                            padding: '0 14px',
                            backgroundColor: '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '13px',
                            cursor: (exportingExcel || exportingPdf || total === 0) ? 'not-allowed' : 'pointer',
                            opacity: (exportingExcel || exportingPdf || total === 0) ? 0.65 : 1,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            transition: 'all 0.15s ease'
                        }}
                        title="Download all active login details in Excel"
                    >
                        <i className={`fa-solid ${exportingExcel ? 'fa-spinner fa-spin' : 'fa-file-excel'}`}></i>
                        {exportingExcel ? 'Exporting…' : 'Download Excel'}
                    </button>
                    <button
                        onClick={handleExportPdf}
                        disabled={exportingExcel || exportingPdf || total === 0}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            height: '36px',
                            padding: '0 14px',
                            backgroundColor: '#dc2626',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '13px',
                            cursor: (exportingExcel || exportingPdf || total === 0) ? 'not-allowed' : 'pointer',
                            opacity: (exportingExcel || exportingPdf || total === 0) ? 0.65 : 1,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            transition: 'all 0.15s ease'
                        }}
                        title="Download all active login details in PDF"
                    >
                        <i className={`fa-solid ${exportingPdf ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`}></i>
                        {exportingPdf ? 'Generating…' : 'Download PDF'}
                    </button>
                </div>
            </div>

            {error && <div style={{ color: '#b91c1c', marginBottom: '12px' }}>{error}</div>}

            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            {['#', 'Name', 'Status', 'Login Time', 'Latitude', 'Longitude', 'Plant', 'Selfie'].map(h => <th key={h} style={th}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && Array.from({ length: Math.min(size, 10) }, (_, i) => (
                            <tr key={`skel-${i}`} aria-hidden="true">
                                {SKELETON_COLS.map((cell, c) => <td key={c} style={td}>{cell}</td>)}
                            </tr>
                        ))}
                        {!loading && rows.length === 0 && (
                            <tr>
                                <td colSpan={8} style={{ ...td, textAlign: 'center', padding: '40px 12px', color: '#6b7280' }}>
                                    <i className="fa-solid fa-user-clock" style={{ fontSize: '28px', color: '#86efac', marginBottom: '10px', display: 'block' }}></i>
                                    <div style={{ fontWeight: 600, color: '#374151' }}>
                                        {query ? `No active users match "${query}"` : 'No users are logged in right now'}
                                    </div>
                                </td>
                            </tr>
                        )}
                        {!loading && rows.map((r, i) => {
                            const uid = String(r.userId);
                            const pm = plantMap[uid];
                            return (
                                <tr key={r.id}>
                                    <td style={td}>{page * size + i + 1}</td>
                                    <td style={{ ...td, fontWeight: 600 }}>{r.userName || '—'}</td>
                                    <td style={td}>
                                        <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>{r.status}</span>
                                    </td>
                                    <td style={td}>{fmtDateTime(r.verifiedAt)}</td>
                                    <td style={td}>{r.latitude ?? '—'}</td>
                                    <td style={td}>{r.longitude ?? '—'}</td>
                                    <td style={{ ...td, minWidth: '200px' }}>
                                        {r.latitude == null ? '—' : !pm || pm.loading ? (
                                            <div aria-label="Finding nearest plant">
                                                <Skel w={90} />
                                                <div style={{ marginTop: 6 }}><Skel w={150} h={10} /></div>
                                            </div>
                                        ) : pm.np ? (
                                            <button
                                                onClick={() => openModal(r.userId, r.userName)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                                                title="Click to see all mapped plants"
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                    {typeBadge(pm.np.type)}
                                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#166534' }}>{pm.np.distanceMeters} m</span>
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#374151', marginTop: '2px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {pm.np.plantName || pm.np.plantId}
                                                </div>
                                            </button>
                                        ) : (
                                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>No plant mapped</span>
                                        )}
                                    </td>
                                    <td style={td}>
                                        {r.hasSelfie
                                            ? <button className="sub-tab-btn" onClick={() => openSelfie(r.id)}>View</button>
                                            : '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', gap: '12px', flexWrap: 'wrap', fontSize: '13px' }}>
                <span>Showing {from}–{to} of {total}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label>
                        Rows per page{' '}
                        <select value={size} onChange={e => { setSize(Number(e.target.value)); setPage(0); }} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                            {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </label>
                    <button className="sub-tab-btn" disabled={page === 0 || loading} onClick={() => setPage(p => p - 1)}>Previous</button>
                    <span>Page {totalPages === 0 ? 0 : page + 1} of {totalPages}</span>
                    <button className="sub-tab-btn" disabled={page + 1 >= totalPages || loading} onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
            </div>

            {/* Selfie modal */}
            {selfie && (
                <div onClick={closeSelfie} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: '16px', borderRadius: '12px', maxWidth: '90vw', maxHeight: '90vh', position: 'relative' }}>
                        <button onClick={closeSelfie} style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>✕</button>
                        {selfie.loading ? (
                            <div style={{ padding: '32px 48px', color: '#6b7280', fontSize: 14 }}>Loading…</div>
                        ) : selfie.src ? (
                            <img src={selfie.src} alt="Selfie" style={{ maxWidth: '80vw', maxHeight: '80vh', display: 'block', borderRadius: 8, marginTop: 8 }} />
                        ) : (
                            <div style={{ padding: '32px 48px', color: '#b91c1c', fontSize: 14 }}>Selfie unavailable</div>
                        )}
                    </div>
                </div>
            )}

            {/* Nearest plant detail modal */}
            {modalData && (
                <div onClick={() => setModalData(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '14px', padding: '24px', width: '560px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,.18)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', color: '#166534' }}>
                                📍 Nearest Plant — {modalData.userName}
                            </h3>
                            <button onClick={() => setModalData(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
                        </div>

                        {modalData.loading && <p style={{ color: '#6b7280' }}>Finding nearest plant…</p>}
                        {modalData.error && <p style={{ color: '#b91c1c' }}>{modalData.error}</p>}

                        {modalData.data && (() => {
                            const { ieLatitude, ieLongitude, nearestPlant: np, allPlants } = modalData.data;
                            return (
                                <>
                                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
                                        <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600, marginBottom: '4px' }}>IE Location</div>
                                        <div style={{ fontSize: '13px', color: '#374151' }}>Lat: {ieLatitude} &nbsp;|&nbsp; Lng: {ieLongitude}</div>
                                    </div>

                                    {np ? (
                                        <div style={{ background: '#166534', color: '#fff', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '6px', opacity: 0.8 }}>NEAREST PLANT</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                                <div>
                                                    <div style={{ fontSize: '15px', fontWeight: 700 }}>{np.plantName || np.plantId}</div>
                                                    <div style={{ fontSize: '12px', opacity: 0.85 }}>{np.companyName}</div>
                                                    {np.address && <div style={{ fontSize: '12px', opacity: 0.75, marginTop: '2px' }}>{np.address}</div>}
                                                    {np.plantLatitude != null && <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>📍 {np.plantLatitude}, {np.plantLongitude}</div>}
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '22px', fontWeight: 800 }}>{np.distanceMeters} m</div>
                                                    <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>{typeBadge(np.type)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : <p style={{ color: '#6b7280' }}>No mapped plants with coordinates found.</p>}

                                    {allPlants && allPlants.length > 1 && (
                                        <>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>All Mapped Plants ({allPlants.length})</div>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                                <thead>
                                                    <tr>
                                                        {['#', 'Type', 'Plant / Unit', 'Company', 'Distance (m)'].map(h => (
                                                            <th key={h} style={{ padding: '6px 8px', background: '#f9fafb', borderBottom: '2px solid #e5e7eb', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {allPlants.map((p, idx) => (
                                                        <tr key={idx} style={{ background: idx === 0 ? '#f0fdf4' : 'transparent' }}>
                                                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #f3f4f6' }}>{idx + 1}</td>
                                                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #f3f4f6' }}>{typeBadge(p.type)}</td>
                                                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #f3f4f6', fontWeight: idx === 0 ? 600 : 400 }}>{p.plantName || p.plantId}</td>
                                                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>{p.companyName || '—'}</td>
                                                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #f3f4f6', fontWeight: 600, color: idx === 0 ? '#166534' : '#374151' }}>{p.distanceMeters} m</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
