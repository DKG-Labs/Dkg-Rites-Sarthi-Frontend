import { useState, useEffect, useRef, useMemo } from 'react';
import { getBoardSummary, getLedger, getRejectionBreakup } from '../../services/scrapEntryService';
import ScrapLedgerTable from '../rejection-scrapping/ScrapLedgerTable';
import RejectionBreakupModal from './RejectionBreakupModal';
import './RailwayBoardRejectionScrap.css';

function SearchableSelect({ label, value, onChange, options, placeholder = 'All', disabled = false, searchable = true }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter(o => o.toLowerCase().includes(q)) : options;
  }, [options, query]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayValue = value || placeholder;
  const isActive = !!value;

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="ss-wrap" ref={ref}>
      {label && <span className="ss-label">{label}</span>}
      <button
        type="button"
        className={`ss-trigger ${open ? 'open' : ''} ${isActive ? 'active' : ''} ${disabled ? 'ss-disabled' : ''}`}
        onClick={() => { if (!disabled) setOpen(o => !o); }}
        disabled={disabled}
      >
        <span className="ss-trigger-text">{displayValue}</span>
        <svg className={`ss-chevron ${open ? 'up' : ''}`} viewBox="0 0 12 8" fill="none">
          <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </button>
      {open && (
        <div className="ss-dropdown">
          {searchable && (
          <div className="ss-search-wrap">
            <svg className="ss-search-icon" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input
              ref={inputRef}
              className="ss-search-input"
              placeholder="Search…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className="ss-search-clear" onClick={() => setQuery('')}>✕</button>
            )}
          </div>
          )}
          <div className="ss-options">
            <button
              className={`ss-option ${!value ? 'selected' : ''}`}
              onClick={() => handleSelect('')}
            >
              <span>{placeholder}</span>
              {!value && <svg className="ss-check" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
            {filtered.length === 0 ? (
              <div className="ss-no-results">No matches</div>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt}
                  className={`ss-option ${value === opt ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt)}
                >
                  <span>{opt}</span>
                  {value === opt && <svg className="ss-check" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SortTh({ col, label, sortCol, sortDir, onSort }) {
  const active = sortCol === col;
  return (
    <th
      onClick={() => onSort(col)}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 1, opacity: active ? 1 : 0.3 }}>
          <svg width="7" height="5" viewBox="0 0 7 5" fill={active && sortDir === 'asc' ? '#3b82f6' : '#94a3b8'}><path d="M3.5 0L7 5H0z"/></svg>
          <svg width="7" height="5" viewBox="0 0 7 5" fill={active && sortDir === 'desc' ? '#3b82f6' : '#94a3b8'}><path d="M3.5 5L0 0h7z"/></svg>
        </span>
      </span>
    </th>
  );
}

const UnderDevelopmentBanner = ({ product }) => (
  <div className="rbrs-under-dev">
    <div className="rbrs-under-dev-icon">🚧</div>
    <h3 className="rbrs-under-dev-title">Under Development</h3>
    <p className="rbrs-under-dev-sub">
      Rejection &amp; Scrapping Monitoring for <strong>{product}</strong> is coming soon.
    </p>
  </div>
);

const SummarySkeletonRows = () => (
  <>
    {[1, 2, 3, 4, 5].map(i => (
      <tr key={i} className="rbrs-skel-row">
        {[80, 140, 100, 70, 70, 70, 90].map((w, j) => (
          <td key={j}><div className="rbrs-skeleton" style={{ width: w }} /></td>
        ))}
      </tr>
    ))}
  </>
);

export default function RailwayBoardRejectionScrap({ selectedProduct }) {
  const [view, setView] = useState('list');
  const [selectedPoi, setSelectedPoi] = useState(null);

  const [summaryRows, setSummaryRows] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const [ledgerData, setLedgerData] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const [breakupRow, setBreakupRow] = useState(null);
  const [breakupData, setBreakupData] = useState(null);
  const [breakupLoading, setBreakupLoading] = useState(false);
  const [breakupError, setBreakupError] = useState('');

  // Filters
  const [filterCompany, setFilterCompany] = useState('');
  const [filterPlant, setFilterPlant] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL | PENDING | COMPLETED

  // Sorting
  const [sortCol, setSortCol] = useState('totalRejected');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const PAGE_SIZES = [10, 15, 25, 50];

  useEffect(() => {
    if (selectedProduct !== 'ERC') return;
    setSummaryLoading(true);
    setSummaryError('');
    getBoardSummary('ERC')
      .then(data => setSummaryRows(data || []))
      .catch(e => setSummaryError(e.message || 'Failed to load summary'))
      .finally(() => setSummaryLoading(false));
  }, [selectedProduct]);

  useEffect(() => {
    if (view !== 'detail' || !selectedPoi) return;
    setLedgerLoading(true);
    getLedger(selectedPoi.poiCode)
      .then(data => setLedgerData(data))
      .catch(() => setLedgerData(null))
      .finally(() => setLedgerLoading(false));
  }, [view, selectedPoi]);

  const companies = useMemo(() => [...new Set(summaryRows.map(r => r.companyName).filter(Boolean))].sort(), [summaryRows]);
  const plants = useMemo(() => {
    const source = filterCompany
      ? summaryRows.filter(r => r.companyName === filterCompany)
      : summaryRows;
    return [...new Set(source.map(r => r.unitName).filter(Boolean))].sort();
  }, [summaryRows, filterCompany]);

  const filteredRows = useMemo(() => {
    return summaryRows.filter(r => {
      if (filterCompany && r.companyName !== filterCompany) return false;
      if (filterPlant && r.unitName !== filterPlant) return false;
      if (filterStatus === 'PENDING' && r.pendingBalance <= 0) return false;
      if (filterStatus === 'COMPLETED' && r.pendingBalance > 0) return false;
      return true;
    });
  }, [summaryRows, filterCompany, filterPlant, filterStatus]);

  // Reset to page 1 when filters, sort or page size change
  useEffect(() => { setPage(1); }, [filterCompany, filterPlant, filterStatus, pageSize, sortCol, sortDir]);

  const sortedRows = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      const av = a[sortCol] ?? '';
      const bv = b[sortCol] ?? '';
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filteredRows, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const pageRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);

  const handleRowClick = (row) => {
    setSelectedPoi(row);
    setView('detail');
    setLedgerData(null);
  };

  const handleBack = () => {
    setView('list');
    setSelectedPoi(null);
    setLedgerData(null);
  };

  const handleRejectionClick = async (row) => {
    setBreakupRow(row);
    setBreakupData(null);
    setBreakupError('');
    setBreakupLoading(true);
    try {
      const data = await getRejectionBreakup(
        selectedPoi.poiCode,
        row.entryDate,
        row.stageOfInspection,
        row.shift,
        row.unitLineShedNo
      );
      setBreakupData(data);
    } catch (e) {
      setBreakupError(e.message || 'Failed to load breakdown');
    } finally {
      setBreakupLoading(false);
    }
  };

  if (selectedProduct !== 'ERC') {
    return <UnderDevelopmentBanner product={selectedProduct} />;
  }

  if (view === 'detail' && selectedPoi) {
    return (
      <>
      <div className="rbrs-detail">

        {/* ── Hero banner ── */}
        <div className="rbrs-hero">
          <div className="rbrs-hero-top">
            <button className="rbrs-back-btn" onClick={handleBack}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
            <nav className="rbrs-breadcrumb">
              <span className="rbrs-bc-root">Rejection &amp; Scrapping</span>
              <span className="rbrs-bc-sep">›</span>
              <span className="rbrs-bc-current">
                {selectedPoi.companyName || selectedPoi.poiCode}
                {selectedPoi.unitName ? ` — ${selectedPoi.unitName}` : ''}
              </span>
            </nav>
          </div>

          <div className="rbrs-hero-body">
            <div className="rbrs-hero-plant">
              <div className="rbrs-hero-plant-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="10" width="4" height="12" rx="1" fill="currentColor" opacity=".7"/>
                  <rect x="8" y="6" width="4" height="16" rx="1" fill="currentColor"/>
                  <rect x="14" y="8" width="4" height="14" rx="1" fill="currentColor" opacity=".7"/>
                  <rect x="20" y="12" width="2" height="10" rx="1" fill="currentColor" opacity=".5"/>
                  <line x1="2" y1="22" x2="22" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div className="rbrs-hero-company">{selectedPoi.companyName || selectedPoi.poiCode}</div>
                {selectedPoi.unitName && <div className="rbrs-hero-unit">{selectedPoi.unitName}</div>}
              </div>
            </div>
            <span className="rbrs-hero-poi-badge">{selectedPoi.poiCode}</span>
          </div>

          {/* ── KPI stat cards ── */}
          <div className="rbrs-stat-row">
            <div className="rbrs-stat rbrs-stat-rejected">
              <div className="rbrs-stat-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="rbrs-stat-body">
                <div className="rbrs-stat-label">Total Rejected</div>
                <div className="rbrs-stat-value">{(selectedPoi.totalRejected || 0).toLocaleString()}</div>
                <div className="rbrs-stat-unit">pieces</div>
              </div>
            </div>

            <div className="rbrs-stat rbrs-stat-scrapped">
              <div className="rbrs-stat-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="rbrs-stat-body">
                <div className="rbrs-stat-label">Total Scrapped</div>
                <div className="rbrs-stat-value">{(selectedPoi.totalScrapped || 0).toLocaleString()}</div>
                <div className="rbrs-stat-unit">pieces</div>
              </div>
            </div>

            <div className={`rbrs-stat ${selectedPoi.pendingBalance > 0 ? 'rbrs-stat-pending' : 'rbrs-stat-clear'}`}>
              <div className="rbrs-stat-icon-wrap">
                {selectedPoi.pendingBalance > 0 ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div className="rbrs-stat-body">
                <div className="rbrs-stat-label">Balance Pending</div>
                <div className="rbrs-stat-value">{(selectedPoi.pendingBalance || 0).toLocaleString()}</div>
                <div className="rbrs-stat-unit">{selectedPoi.pendingBalance > 0 ? 'awaiting scrapping' : 'fully scrapped'}</div>
              </div>
            </div>

            {selectedPoi.lastScrappingDate && (
              <div className="rbrs-stat rbrs-stat-date">
                <div className="rbrs-stat-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M7 2v4M13 2v4M3 8h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="rbrs-stat-body">
                  <div className="rbrs-stat-label">Last Scrapping</div>
                  <div className="rbrs-stat-value rbrs-stat-date-val">{selectedPoi.lastScrappingDate}</div>
                  <div className="rbrs-stat-unit">scrapping date</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Ledger section ── */}
        <div className="rbrs-ledger-section">
          <div className="rbrs-ledger-section-header">
            <div>
              <span className="rbrs-ledger-section-title">Rejection &amp; Scrapping Ledger</span>
              <span className="rbrs-ledger-section-sub">Full history for this plant · Read-only</span>
            </div>
            <div className="rbrs-ledger-section-badge">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="#94a3b8" strokeWidth="1.4"/>
                <path d="M7 4v3l2 2" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              Click a date to see defect breakdown
            </div>
          </div>
          <ScrapLedgerTable
            rows={ledgerData?.rows || null}
            loading={ledgerLoading}
            readOnly={true}
            onRejectionClick={handleRejectionClick}
          />
        </div>

      </div>

      {breakupRow && (
        <RejectionBreakupModal
          row={breakupRow}
          data={breakupData}
          loading={breakupLoading}
          error={breakupError}
          onClose={() => { setBreakupRow(null); setBreakupData(null); setBreakupError(''); }}
        />
      )}
    </>
    );
  }

  const totalRejected = filteredRows.reduce((s, r) => s + (r.totalRejected || 0), 0);
  const totalScrapped = filteredRows.reduce((s, r) => s + (r.totalScrapped || 0), 0);
  const totalPending  = filteredRows.reduce((s, r) => s + (r.pendingBalance || 0), 0);

  const getAvatar = (name) => (name ? name.trim()[0].toUpperCase() : '?');

  return (
    <div className="rbrs-wrap">
      <div className="rbrs-header">
        <h2 className="rbrs-title">Rejection &amp; Scrapping Monitoring</h2>
        <p className="rbrs-subtitle">ERC — All Plants Overview</p>
      </div>

      {/* KPI + Filters in one row */}
      <div className="rbrs-topbar">
        {!summaryLoading && filteredRows.length > 0 && (
          <div className="rbrs-kpi-strip">
            <div className="rbrs-kpi-card">
              <div className="rbrs-kpi-icon red">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="rbrs-kpi-body">
                <div className="rbrs-kpi-val">{totalRejected.toLocaleString()}</div>
                <div className="rbrs-kpi-lbl">Total Rejected</div>
              </div>
            </div>
            <div className="rbrs-kpi-card">
              <div className="rbrs-kpi-icon green">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10h12M16 10l-4-4M16 10l-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="rbrs-kpi-body">
                <div className="rbrs-kpi-val">{totalScrapped.toLocaleString()}</div>
                <div className="rbrs-kpi-lbl">Total Scrapped</div>
              </div>
            </div>
            <div className="rbrs-kpi-card">
              <div className="rbrs-kpi-icon orange">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="rbrs-kpi-body">
                <div className="rbrs-kpi-val">{totalPending.toLocaleString()}</div>
                <div className="rbrs-kpi-lbl">Balance Pending</div>
              </div>
            </div>
          </div>
        )}

        <div className="rbrs-filters">
          <SearchableSelect
            label="Manufacturer"
            value={filterCompany}
            onChange={v => { setFilterCompany(v); setFilterPlant(''); }}
            options={companies}
            placeholder="All manufacturers"
          />
          <SearchableSelect
            label="Plant"
            value={filterPlant}
            onChange={setFilterPlant}
            options={plants}
            placeholder={filterCompany ? 'All plants' : 'Select manufacturer first'}
            disabled={!filterCompany}
          />
          <SearchableSelect
            label="Status"
            value={filterStatus === 'ALL' ? '' : filterStatus}
            onChange={v => setFilterStatus(v || 'ALL')}
            options={['PENDING', 'COMPLETED']}
            placeholder="All statuses"
            searchable={false}
          />
        </div>
      </div>

      {summaryError && (
        <div className="rbrs-error">{summaryError}</div>
      )}

      <div className="rbrs-table-wrap">
        <table className="rbrs-table">
          <thead>
            <tr>
              <th style={{ width: 48 }}>S.No</th>
              <SortTh col="companyName" label="Manufacturer & Plant" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <SortTh col="totalRejected" label="Total Rejected" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <SortTh col="totalScrapped" label="Total Scrapped" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <SortTh col="pendingBalance" label="Balance Pending" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <SortTh col="lastScrappingDate" label="Last Scrapping" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <SortTh col="status" label="Status" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <th style={{ width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {summaryLoading ? (
              <SummarySkeletonRows />
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="rbrs-empty">
                    <div className="rbrs-empty-icon">📋</div>
                    <p className="rbrs-empty-title">No data found</p>
                    <p className="rbrs-empty-sub">No rejection or scrapping records match the current filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              pageRows.map((row, idx) => {
                const isPending = row.pendingBalance > 0;
                return (
                  <tr
                    key={row.poiCode}
                    className={`rbrs-row ${isPending ? 'row-pending' : 'row-done'}`}
                    onClick={() => handleRowClick(row)}
                  >
                    <td className="rbrs-sr"><span>{(page - 1) * pageSize + idx + 1}</span></td>
                    <td>
                      <div className="rbrs-co-cell">
                        <div className="rbrs-co-avatar">{getAvatar(row.companyName)}</div>
                        <div className="rbrs-co-info">
                          <span className="rbrs-co-name">{row.companyName || '—'}</span>
                          <span className="rbrs-co-unit">{row.unitName || row.poiCode}</span>
                        </div>
                      </div>
                    </td>
                    <td className="rbrs-rejected">
                      <div className="rbrs-num-cell">
                        <span className="rbrs-num-val">{row.totalRejected?.toLocaleString() || 0}</span>
                        <span className="rbrs-num-label">pcs</span>
                      </div>
                    </td>
                    <td className="rbrs-scrapped">
                      <div className="rbrs-num-cell">
                        <span className="rbrs-num-val">{row.totalScrapped?.toLocaleString() || 0}</span>
                        <span className="rbrs-num-label">pcs</span>
                      </div>
                    </td>
                    <td className={isPending ? 'rbrs-bal-high' : 'rbrs-bal-ok'}>
                      <div className="rbrs-num-cell">
                        <span className="rbrs-num-val">{row.pendingBalance?.toLocaleString() || 0}</span>
                        <span className="rbrs-num-label">{isPending ? 'pending' : 'cleared'}</span>
                      </div>
                    </td>
                    <td className="rbrs-date"><span>{row.lastScrappingDate || '—'}</span></td>
                    <td>
                      <span>
                        <span className={`rbrs-status-badge ${isPending ? 'pending' : 'completed'}`}>
                          {isPending ? 'Pending' : 'Completed'}
                        </span>
                      </span>
                    </td>
                    <td><span className="rbrs-row-arrow">›</span></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!summaryLoading && sortedRows.length > 0 && (
        <div className="rbrs-pagination">
          <div className="rbrs-pg-info">
            Showing {Math.min((page - 1) * pageSize + 1, sortedRows.length)}–{Math.min(page * pageSize, sortedRows.length)} of {sortedRows.length} plants
          </div>
          <div className="rbrs-pg-controls">
            <span className="rbrs-pg-label">Rows per page:</span>
            <select
              className="rbrs-pg-size"
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="rbrs-pg-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
            <button className="rbrs-pg-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
            <span className="rbrs-pg-current">Page {page} / {totalPages}</span>
            <button className="rbrs-pg-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
            <button className="rbrs-pg-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
          </div>
        </div>
      )}
    </div>
  );
}
