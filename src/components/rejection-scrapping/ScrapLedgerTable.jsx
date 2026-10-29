import { useState, useEffect } from 'react';
import EditScrapEntryModal from './EditScrapEntryModal';
import { deleteScrapEntry } from '../../services/scrapEntryService';
import './RejectionScrapping.css';

const COLUMNS = ['Type', 'Date', 'Shift', 'Unit / Line / Shed', 'Stage', 'Rejected', 'Scrapped', 'Balance', 'IE Name', 'SV ID', 'Photos', 'Actions'];
const PAGE_SIZES = [10, 20, 30];

const RowTypeBadge = ({ type }) => (
  <span className={`rs-badge ${type === 'REJECTION' ? 'rejection' : 'scrap'}`}>
    {type === 'REJECTION' ? '✕ Rejection' : '✓ Scrap'}
  </span>
);

const SkeletonRows = () => (
  <>
    {[1, 2, 3, 4].map(i => (
      <tr key={i} className="rs-skel-row">
        {COLUMNS.map((_, j) => (
          <td key={j}><div className="rs-skeleton" style={{ width: j === 0 ? 80 : j === 8 ? 120 : 60 }} /></td>
        ))}
      </tr>
    ))}
  </>
);

export default function ScrapLedgerTable({ rows, loading, ieUserId, onRefresh }) {
  const [editEntry, setEditEntry] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [lightboxUrls, setLightboxUrls] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL | REJECTION | SCRAP

  // Reset to page 1 whenever rows, pageSize or typeFilter changes
  useEffect(() => { setPage(1); }, [rows, pageSize, typeFilter]);

  const filteredRows = rows
    ? (typeFilter === 'ALL' ? rows : rows.filter(r => r.rowType === typeFilter))
    : [];
  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = async () => {
    if (deleteReason.trim().length < 5 || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteScrapEntry(deleteTarget.entryId, deleteReason, String(ieUserId));
      setDeleteTarget(null);
      setDeleteReason('');
      onRefresh();
    } catch (e) {
      setDeleteError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const rejectionCount = rows ? rows.filter(r => r.rowType === 'REJECTION').length : 0;
  const scrapCount     = rows ? rows.filter(r => r.rowType === 'SCRAP').length : 0;

  return (
    <>
      {/* Type filter */}
      {!loading && rows && rows.length > 0 && (
        <div className="rs-type-filter">
          {[
            { key: 'ALL',       label: 'All',         count: rows.length },
            { key: 'REJECTION', label: 'Rejection',   count: rejectionCount },
            { key: 'SCRAP',     label: 'Scrap',       count: scrapCount },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              className={`rs-filter-pill${typeFilter === key ? ' active' : ''} ${key.toLowerCase()}`}
              onClick={() => setTypeFilter(key)}
            >
              {label} <span className="rs-filter-count">{count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="rs-table-wrap">
        <table className="rs-table">
          <thead>
            <tr>
              {COLUMNS.map(h => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : !rows || rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length}>
                  <div className="rs-empty">
                    <div className="rs-empty-icon">📋</div>
                    <p className="rs-empty-title">No entries for this plant yet</p>
                    <p className="rs-empty-sub">Rejection and scrapping records will appear here</p>
                  </div>
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length}>
                  <div className="rs-empty">
                    <div className="rs-empty-icon">🔍</div>
                    <p className="rs-empty-title">No {typeFilter === 'REJECTION' ? 'rejection' : 'scrap'} entries found</p>
                    <p className="rs-empty-sub">Try switching the filter above</p>
                  </div>
                </td>
              </tr>
            ) : (
              pageRows.map((row, idx) => (
                <tr key={`${row.rowType}-${row.entryId}-${idx}`}>
                  <td><RowTypeBadge type={row.rowType} /></td>
                  <td>{row.entryDate || '—'}</td>
                  <td>{row.shift || '—'}</td>
                  <td>{row.unitLineShedNo || '—'}</td>
                  <td>{row.stageOfInspection || '—'}</td>
                  <td style={{ color: row.rejectedQty > 0 ? '#dc2626' : '#94a3b8', fontWeight: row.rejectedQty > 0 ? 600 : 400 }}>
                    {row.rowType === 'REJECTION' ? (row.rejectedQty ?? '—') : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ color: row.scrappedQty > 0 ? '#16a34a' : '#94a3b8', fontWeight: row.scrappedQty > 0 ? 600 : 400 }}>
                    {row.rowType === 'SCRAP' ? (row.scrappedQty ?? '—') : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td>
                    <span className={row.pendingBalance > 0 ? 'rs-balance-high' : 'rs-balance-ok'}>
                      {row.pendingBalance ?? '—'}
                    </span>
                  </td>
                  <td>{row.ieName || '—'}</td>
                  <td style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                    {row.scrapVerificationId || '—'}
                  </td>
                  <td>
                    {row.imageUrls && row.imageUrls.length > 0 ? (
                      <button className="rs-photo-btn" onClick={() => setLightboxUrls(row.imageUrls)}>
                        📷 {row.imageUrls.length}
                      </button>
                    ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td>
                    {row.rowType === 'SCRAP' && (
                      row.editable ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="rs-icon-btn edit" onClick={() => setEditEntry(row)} title="Edit within 1 hour">✏️</button>
                          <button className="rs-icon-btn del" onClick={() => { setDeleteTarget(row); setDeleteReason(''); setDeleteError(''); }} title="Delete within 1 hour">🗑️</button>
                        </div>
                      ) : (
                        <span className="rs-lock-icon" title="Edit window expired (1 hour)">🔒</span>
                      )
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination bar */}
      {!loading && totalRows > 0 && (
        <div className="rs-pagination">
          <div className="rs-pagination-info">
            Showing {Math.min((page - 1) * pageSize + 1, totalRows)}–{Math.min(page * pageSize, totalRows)} of {totalRows} entries
          </div>
          <div className="rs-pagination-controls">
            <span className="rs-pagination-label">Rows per page:</span>
            <select
              className="rs-page-size-select"
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="rs-pagination-nav">
              <button
                className="rs-page-btn"
                onClick={() => setPage(1)}
                disabled={page === 1}
                title="First page"
              >«</button>
              <button
                className="rs-page-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                title="Previous page"
              >‹</button>
              <span className="rs-page-indicator">{page} / {totalPages}</span>
              <button
                className="rs-page-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                title="Next page"
              >›</button>
              <button
                className="rs-page-btn"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                title="Last page"
              >»</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editEntry && (
        <EditScrapEntryModal
          entry={editEntry}
          ieUserId={ieUserId}
          onClose={() => setEditEntry(null)}
          onSuccess={() => { setEditEntry(null); onRefresh(); }}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="rs-overlay" onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="rs-modal rs-modal-sm">
            <div className="rs-modal-header">
              <div className="rs-modal-title" style={{ color: '#dc2626' }}>
                <span>🗑️</span> Confirm Delete
              </div>
              <button className="rs-modal-close" onClick={() => setDeleteTarget(null)}>✕</button>
            </div>
            <div className="rs-modal-body">
              {deleteError && <div className="rs-error-box"><span>⚠️</span>{deleteError}</div>}
              <div className="rs-sv-chip" style={{ marginBottom: 14 }}>
                <span>🔖</span> {deleteTarget.scrapVerificationId}
                <span style={{ color: '#64748b', fontWeight: 400 }}>— {deleteTarget.scrappedQty} pcs on {deleteTarget.entryDate}</span>
              </div>
              <div className="rs-field">
                <label className="rs-reason-label">Reason for deletion * (min. 5 chars — audited)</label>
                <textarea
                  className="rs-input"
                  rows={3}
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  placeholder="Mandatory — this reason will be permanently recorded"
                />
              </div>
            </div>
            <div className="rs-modal-footer">
              <button className="rs-btn rs-btn-ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button
                className="rs-btn rs-btn-danger"
                onClick={handleDelete}
                disabled={deleteReason.trim().length < 5 || deleting}
              >
                {deleting ? '⏳ Deleting…' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrls && (
        <div className="rs-lightbox" onClick={() => setLightboxUrls(null)}>
          <button className="rs-lightbox-close" onClick={() => setLightboxUrls(null)} title="Close">✕</button>
          {lightboxUrls.map((url, i) => (
            <img key={i} src={url} alt={`${i + 1} of ${lightboxUrls.length}`} onClick={e => e.stopPropagation()} />
          ))}
        </div>
      )}
    </>
  );
}
