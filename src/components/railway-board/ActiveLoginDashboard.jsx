import React, { useState, useEffect, useCallback } from 'react';
import { getActiveLogins, getActiveLoginSelfie } from '../../services/activeLoginService';

const fmtDateTime = str => {
    if (!str) return '—';
    const d = new Date(str);
    return isNaN(d) ? str : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const th = { padding: '10px 12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, background: '#166534', color: '#fff', whiteSpace: 'nowrap' };
const td = { padding: '10px 12px', fontSize: '13px', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top' };

const PAGE_SIZES = [5, 10, 20, 25];

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

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        getActiveLogins({ page, size, search: query })
            .then(data => {
                setRows(data.content || []);
                setTotal(data.totalElements || 0);
                setTotalPages(data.totalPages || 0);
            })
            .catch(e => setError(e.message || 'Failed to load active logins'))
            .finally(() => setLoading(false));
    }, [page, size, query]);

    useEffect(() => { load(); }, [load]);

    // Debounce the name search so each keystroke doesn't hit the server
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
                            {['#', 'Name', 'Status', 'Login Time', 'Latitude', 'Longitude', 'Accuracy (m)', 'Selfie'].map(h => <th key={h} style={th}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td style={td} colSpan={8}>Loading…</td></tr>}
                        {!loading && rows.length === 0 && <tr><td style={td} colSpan={8}>No active logins found</td></tr>}
                        {!loading && rows.map((r, i) => (
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
                                <td style={td}>
                                    {r.hasSelfie
                                        ? <button className="sub-tab-btn" onClick={() => openSelfie(r.id)}>View</button>
                                        : '—'}
                                </td>
                            </tr>
                        ))}
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

            {selfie && (
                <div onClick={() => setSelfie(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: '16px', borderRadius: '12px', maxWidth: '90vw', maxHeight: '90vh' }}>
                        {selfie.loading ? 'Loading…' : selfie.src
                            ? <img src={selfie.src} alt="Selfie" style={{ maxWidth: '80vw', maxHeight: '80vh' }} />
                            : 'Selfie unavailable'}
                    </div>
                </div>
            )}
        </div>
    );
}
