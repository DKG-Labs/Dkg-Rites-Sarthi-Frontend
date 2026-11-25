import React, { useState, useMemo } from 'react';

// Cards whose table gets the date-wise overview
const DATE_OVERVIEW_TYPES = new Set(['mould-verification']);

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

// Day of an entry (yyyy-mm-dd): its inspection date, else the day it was saved
const dayOf = (e) => (e.castingDate || (e.timestamp ? String(e.timestamp).slice(0, 10) : '') || '').slice(0, 10);
const fmtDate = (d) => {
  if (!d) return '-';
  const [y, m, day] = d.split('-');
  return y && m && day ? `${day}-${m}-${y}` : d;
};

/**
 * Date-wise overview (cards that carry a date): one chip per day with the number of checks,
 * OK / Not OK and shifts. Clicking a day filters the table to that day.
 */
const DateOverview = ({ data, selected, onSelect }) => {
  const days = useMemo(() => {
    const map = new Map();
    data.forEach(e => {
      const d = dayOf(e);
      if (!map.has(d)) map.set(d, { day: d, total: 0, ok: 0, notOk: 0, shifts: new Set() });
      const g = map.get(d);
      g.total += 1;
      if (e.status === 'OK') g.ok += 1; else g.notOk += 1;
      if (e.shift) g.shifts.add(e.shift);
    });
    return [...map.values()].sort((a, b) => (a.day < b.day ? 1 : -1));   // latest day first
  }, [data]);
  if (days.length === 0) return null;
  return (
    <div className="tv-days" role="tablist" aria-label="Date-wise overview">
      <button type="button" role="tab" aria-selected={!selected}
        className={`tv-day${!selected ? ' active' : ''}`} onClick={() => onSelect('')}>
        <strong>All dates</strong>
        <span>{data.length} checks · {days.length} days</span>
      </button>
      {days.map(g => (
        <button key={g.day || 'none'} type="button" role="tab" aria-selected={selected === g.day}
          className={`tv-day${selected === g.day ? ' active' : ''}`} onClick={() => onSelect(g.day)}>
          <strong>{fmtDate(g.day)}</strong>
          <span>
            {g.total} {g.total === 1 ? 'mould' : 'moulds'}
            {g.shifts.size > 0 && ` · Shift ${[...g.shifts].sort().join(', ')}`}
          </span>
          <span className="tv-day-counts">
            <em className="ok">{g.ok} OK</em>
            {g.notOk > 0 && <em className="not-ok">{g.notOk} Not OK</em>}
          </span>
        </button>
      ))}
    </div>
  );
};

// Data columns per card type. `label` is the desktop header AND the label shown on mobile cards.
// Status and Actions are added to every type below.
const COLUMNS = {
  'mould-verification': [
    { label: 'Date', render: e => fmtDate(dayOf(e)) },
    { label: 'Shift', render: e => e.shift || '-' },
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
    { label: 'Freedom from Defects', render: e => e.freedomFromDefects || 'Satisfactory' },
  ],
};

const TableView = ({ type, data, isShiftActive, onEdit, onView, onDelete, isLoading }) => {
  const [pageState, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedDay, setSelectedDay] = useState('');   // date-wise overview: '' = all dates
  const [prevType, setPrevType] = useState(type);

  // Switching cards: back to page 1, all dates (adjusted during render, no effect needed)
  if (type !== prevType) {
    setPrevType(type);
    setPage(1);
    setSelectedDay('');
  }

  const withOverview = DATE_OVERVIEW_TYPES.has(type);
  // A selected day that no longer has entries (e.g. its last entry was deleted) falls back to all dates
  const day = selectedDay && data.some(e => dayOf(e) === selectedDay) ? selectedDay : '';
  const selectDay = (d) => { setSelectedDay(d); setPage(1); };
  // Keep each row's index in the full list so Edit / Delete still target the right record
  const rows = useMemo(() => {
    const all = data.map((entry, index) => ({ entry, index }));
    if (!withOverview) return all;
    const filtered = day ? all.filter(r => dayOf(r.entry) === day) : all;
    // latest day first, then latest check first
    return [...filtered].sort((a, b) => {
      const da = dayOf(a.entry), db = dayOf(b.entry);
      if (da !== db) return da < db ? 1 : -1;
      return String(b.entry.timeOfCheck || '').localeCompare(String(a.entry.timeOfCheck || ''));
    });
  }, [data, day, withOverview]);

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // stay in range after a delete
  const page = Math.min(pageState, totalPages);

  const start = (page - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

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
      {withOverview && !isLoading && <DateOverview data={data} selected={day} onSelect={selectDay} />}
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
            pageRows.map(r => renderRow(r.entry, r.index))
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
                onClick={() => setPage(page - 1)}
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
                onClick={() => setPage(page + 1)}
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
