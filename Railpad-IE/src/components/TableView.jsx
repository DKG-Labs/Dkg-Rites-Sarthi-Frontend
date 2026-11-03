import React, { useState, useEffect } from 'react';

const PAGE_SIZES = [10, 25, 50];

// Page numbers to show, e.g. [1, '…', 4, 5, 6, '…', 12]
const pageList = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
};

const wrapCell = { whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: '260px' };

// Data columns per card type. `label` is the desktop header AND the label shown on mobile cards.
// Status and Actions are added to every type below.
const COLUMNS = {
  'mould-verification': [
    { label: 'Mould / Drawing No.', render: e => e.mouldNumber, style: wrapCell },
    { label: 'Time Checked', render: e => e.timeOfCheck },
    { label: 'Dim. Accuracy', render: e => e.dimensionalAccuracy },
    { label: 'Defects Check', render: e => e.freedomFromDefects },
  ],
  'raw-material': [
    { label: 'Batch No.', render: e => e.batchNo },
    { label: 'Total Weight', render: e => `${e.totalWeight} kg` },
    { label: '% Rubber', render: e => `${e.rubberPercentage}%` },
    { label: 'Verification', render: e => e.acceptedMaterials },
  ],
  mixing: [
    { label: 'Batch No.', render: e => e.batchNo },
    { label: 'Time (min)', render: e => e.mixingTime },
    { label: 'Temp (°C)', render: e => e.mixingTemp },
    { label: 'Water/Dust', render: e => `W: ${e.waterCirculation} | D: ${e.dustCollector}` },
  ],
  sheeting: [
    { label: 'Batch No.', render: e => e.batchNo },
    { label: 'Sheeting', render: e => e.sheeting },
    { label: 'Remarks', render: e => e.remarks || '-' },
  ],
  rheometer: [
    { label: 'Batch No.', render: e => e.batchNo },
    { label: 'Vulcan. Time', render: e => `${e.vulcanTime} min` },
    { label: 'Vulcan. Temp', render: e => `${e.vulcanTemp} °C` },
    { label: 'Ensured', render: e => e.ensured },
  ],
  'hydraulic-press': [
    { label: 'Batch No.', render: e => e.batchNo },
    { label: 'Press ID', render: e => e.pressId },
    { label: 'Curing Time (min)', render: e => e.curingTime },
    { label: 'Curing Temp (°C)', render: e => e.curingTemp },
    { label: 'Curing Pressure', render: e => e.curingPressure },
  ],
  'visual-inspection': [
    { label: 'Sample Qty', render: e => e.sampleQuantity },
    { label: 'Clear Cut Sides', render: e => e.clearCutSides },
    { label: 'Smooth Surface', render: e => e.smoothSurface },
  ],
};

const TableView = ({ type, data, isShiftActive, onEdit, onView, onDelete, isLoading }) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Back to page 1 when switching cards; stay in range after a delete
  useEffect(() => { setPage(1); }, [type]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const start = (page - 1) * pageSize;
  const pageRows = data.slice(start, start + pageSize);

  const columns = COLUMNS[type] || [];
  const colCount = columns.length + 2; // + Status + Actions

  const renderRow = (entry, index) => (
    <tr key={entry.id ?? index}>
      {columns.map(col => (
        <td key={col.label} data-label={col.label} style={col.style}>
          {col.render(entry)}
        </td>
      ))}
      <td data-label="Status" className="cell-status">
        <span className={`status-badge ${entry.status === 'OK' ? 'status-ok' : 'status-not-ok'}`}>
          {entry.status}
        </span>
      </td>
      <td className="cell-actions">
        <div className="row-actions">
          <button onClick={() => onView(entry, index)} className="btn-pill-small-view">
            View
          </button>
          {isShiftActive && (
            <>
              <button onClick={() => onEdit(entry, index)} className="btn-pill-small">
                Edit
              </button>
              <button onClick={() => onDelete(entry, index)} className="btn-pill-small-delete">
                Delete
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => <th key={col.label}>{col.label}</th>)}
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                {Array.from({ length: colCount }).map((_, colIdx) => (
                  <td key={colIdx}>
                    <div className="skeleton-bar" style={{ width: `${Math.floor(Math.random() * 40) + 45}%` }} />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={colCount} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No entries found for this shift.
              </td>
            </tr>
          ) : (
            // Pass the index in the full list so Edit/Delete still target the right record
            pageRows.map((entry, i) => renderRow(entry, start + i))
          )}
        </tbody>
      </table>

      {!isLoading && total > 0 && (
        <div className="tv-pager">
          <span className="tv-pager-info">
            Showing {start + 1}–{Math.min(start + pageSize, total)} of {total}
          </span>
          <div className="tv-pager-controls">
            <label className="tv-pager-size">
              Rows
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              >
                {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <div className="tv-pager-pages">
              <button
                type="button"
                className="tv-page-btn"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                aria-label="Previous page"
              >
                ‹
              </button>
              {pageList(page, totalPages).map((p, i) =>
                p === '…' ? (
                  <span key={`gap-${i}`} className="tv-page-gap">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    className={`tv-page-btn${p === page ? ' active' : ''}`}
                    onClick={() => setPage(p)}
                    aria-current={p === page ? 'page' : undefined}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                type="button"
                className="tv-page-btn"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableView;
