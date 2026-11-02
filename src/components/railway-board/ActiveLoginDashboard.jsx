import React, { useState, useEffect, useCallback } from 'react';
import { getActiveLogins, getActiveLoginSelfie, getNearestPlant } from '../../services/activeLoginService';

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

const fmtDateTime = str => {
    if (!str) return '—';
    const d = new Date(str);
    return isNaN(d) ? str : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const th = { padding: '10px 12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, background: '#166534', color: '#fff', whiteSpace: 'nowrap' };
const td = { padding: '10px 12px', fontSize: '13px', borderBottom: '1px solid #e5e7eb', verticalAlign: 'middle' };

const PAGE_SIZES = [5, 10, 20, 25];

const typeBadge = t => {
    const map = { ERC: ['#fef3c7', '#92400e'], SLEEPER: ['#dbeafe', '#1e40af'], RAIL_PAD: ['#f3e8ff', '#6b21a8'] };
    const [bg, col] = map[t] || ['#f3f4f6', '#374151'];
    return <span style={{ background: bg, color: col, padding: '2px 6px', borderRadius: '999px', fontSize: '10px', fontWeight: 700 }}>{t}</span>;
};

export default function ActiveLoginDashboard({ fromDate, toDate }) {
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


    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        setPlantMap({});
        getActiveLogins({ page, size, search: query, from: fromDate, to: toDate })
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
    }, [page, size, query, fromDate, toDate]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        const t = setTimeout(() => { setQuery(search.trim()); setPage(0); }, 400);
        return () => clearTimeout(t);
    }, [search]);

    const openSelfie = id => {
        setSelfie({ id, loading: true });
        getActiveLoginSelfie(id)
            .then(d => setSelfie({ id, src: d.selfieImageUrl }))
            .catch(() => setSelfie({ id, src: null }));
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

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '20px' }}>
                    <i className="fa-solid fa-id-card" style={{ marginRight: '8px' }}></i>
                    Active Login ({total})
                </h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        placeholder="Search name…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', minWidth: '260px' }}
                    />
                    <button className="sub-tab-btn active" onClick={load} disabled={loading}>
                        <i className="fa-solid fa-rotate" style={{ marginRight: '6px' }}></i>Refresh
                    </button>
                </div>
            </div>

            {error && <div style={{ color: '#b91c1c', marginBottom: '12px' }}>{error}</div>}

            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            {['#', 'Name', 'Status', 'Login Time', 'Latitude', 'Longitude', 'Accuracy (m)', 'Plant', 'Selfie'].map(h => <th key={h} style={th}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td style={td} colSpan={9}>Loading…</td></tr>}
                        {!loading && rows.length === 0 && <tr><td style={td} colSpan={9}>No active logins found</td></tr>}
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
                                    <td style={td}>{r.accuracyMeters != null ? Number(r.accuracyMeters).toFixed(2) : '—'}</td>
                                    <td style={{ ...td, minWidth: '200px' }}>
                                        {r.latitude == null ? '—' : !pm || pm.loading ? (
                                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>⏳ Loading…</span>
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
                <div onClick={() => setSelfie(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: '16px', borderRadius: '12px', maxWidth: '90vw', maxHeight: '90vh' }}>
                        {selfie.loading ? 'Loading…' : selfie.src
                            ? <img src={selfie.src} alt="Selfie" style={{ maxWidth: '80vw', maxHeight: '80vh' }} />
                            : 'Selfie unavailable'}
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
