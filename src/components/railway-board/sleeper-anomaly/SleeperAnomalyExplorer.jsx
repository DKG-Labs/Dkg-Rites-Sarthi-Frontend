import React, { useState } from 'react';

const padBench = (num) => String(num).padStart(3, '0');

const SleeperAnomalyExplorer = ({ benches, onInspect }) => {
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('bench-asc');

    // Apply filters and searches
    let filtered = benches.filter(b => {
        if (filter === 'normal' && b.Anomaly_Prediction !== 1) return false;
        if (filter === 'anomaly' && b.Anomaly_Prediction !== -1) return false;
        
        if (search.trim() !== '') {
            const query = search.toLowerCase();
            const benchStr = `bench ${b.Bench_No}`.toLowerCase();
            const batchStr = `batch ${b.Batch_No}`.toLowerCase();
            if (!benchStr.includes(query) && !batchStr.includes(query) && !b.Bench_No.toString().includes(query) && !b.Batch_No.toString().includes(query)) {
                return false;
            }
        }
        return true;
    });
    
    // Apply sorting
    filtered.sort((a, b) => {
        if (sort === 'bench-asc') return a.Bench_No - b.Bench_No;
        if (sort === 'batch-asc') return a.Batch_No - b.Batch_No;
        if (sort === 'score-desc') return b.Anomaly_Score - a.Anomaly_Score;
        if (sort === 'score-asc') return a.Anomaly_Score - b.Anomaly_Score;
        return 0;
    });

    return (
        <section className="panel active" id="panel-explorer">
            <div className="explorer-card glass-panel">
                {/* Filters Header */}
                <div className="explorer-filters">
                    <div className="filter-search">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input 
                            type="text" 
                            placeholder="Filter by Batch or Bench ID..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-buttons">
                        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Benches</button>
                        <button className={`filter-btn text-green ${filter === 'normal' ? 'active' : ''}`} onClick={() => setFilter('normal')}>Normal</button>
                        <button className={`filter-btn text-red ${filter === 'anomaly' ? 'active' : ''}`} onClick={() => setFilter('anomaly')}>Anomalies</button>
                    </div>
                    
                    <div className="filter-sort">
                        <label htmlFor="select-explorer-sort">Sort By</label>
                        <select id="select-explorer-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                            <option value="score-desc">Anomaly Score (Highest First)</option>
                            <option value="score-asc">Anomaly Score (Lowest First)</option>
                            <option value="bench-asc">Bench ID (Ascending)</option>
                            <option value="batch-asc">Batch ID (Ascending)</option>
                        </select>
                    </div>
                </div>
                
                {/* Table Registry */}
                <div className="table-container">
                    <table className="registry-table">
                        <thead>
                            <tr>
                                <th>BENCH ID</th>
                                <th>BATCH ID</th>
                                <th>STATUS</th>
                                <th>ANOMALY SCORE</th>
                                <th>TOP CRITICAL DEVIATION / ALERTS</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center">No benches found matching current search/filter settings.</td>
                                </tr>
                            ) : (
                                filtered.map((b, idx) => {
                                    const isAnom = b.Anomaly_Prediction === -1;
                                    let diagMsg = 'All parameters operating within normal control limits.';
                                    if (isAnom && b.deviations && b.deviations.length > 0) {
                                        const topDev = b.deviations[0];
                                        diagMsg = <span className="text-orange font-weight-500">Alert: {topDev.feature}: {topDev.value.toFixed(1)} (Z: {topDev.z_score.toFixed(1)}&sigma;)</span>;
                                    }

                                    return (
                                        <tr key={idx}>
                                            <td><span className={`bench-badge ${isAnom ? 'anomaly-highlight' : ''}`}>BENCH-{padBench(b.Bench_No)}</span></td>
                                            <td className="text-secondary">Batch {b.Batch_No}</td>
                                            <td>
                                                {isAnom ? (
                                                    <span className="badge red">
                                                        <svg className="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: '12px', height: '12px', marginRight: '4px'}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                                        ANOMALY
                                                    </span>
                                                ) : (
                                                    <span className="badge green">
                                                        <svg className="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: '12px', height: '12px', marginRight: '4px'}}><polyline points="20 6 9 17 4 12"/></svg>
                                                        NORMAL
                                                    </span>
                                                )}
                                            </td>
                                            <td className={`font-mono ${isAnom ? 'text-red' : ''}`}>{b.Anomaly_Score.toFixed(4)}</td>
                                            <td className="text-secondary" style={{maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{diagMsg}</td>
                                            <td>
                                                <button className="stream-btn-inspect" onClick={() => onInspect(b.Batch_No, b.Bench_No)}>Inspect Drawer</button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination & Count */}
                <div className="table-footer">
                    <span>Showing {filtered.length} of {benches.length} benches</span>
                </div>
            </div>
        </section>
    );
};

export default SleeperAnomalyExplorer;
