import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_ENDPOINTS, getAuthHeaders, handleResponse } from '../../services/apiConfig';
import SearchSelect from './SearchSelect';
import './ErcRawMaterialReport.css';

const PAGE_SIZES = [10, 15, 25, 50];
const mt = (v) => Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const pcs = (v) => Number(v || 0).toLocaleString('en-IN');
const stamp = () => new Date().toISOString().slice(0, 10);

const COLUMNS = [
  { key: 'plant', label: 'Plant Name', num: false },
  { key: 'procuredMt', label: 'RM Procured (MT)', num: true },
  { key: 'inspectedMt', label: 'RM Inspected (MT)', num: true },
  { key: 'pendingInspectionMt', label: 'Pending for Inspection (MT)', sub: 'Procured − Inspected', num: true },
  { key: 'processedMt', label: 'Qty Processed (MT)', num: true },
  { key: 'pendingProcessingMt', label: 'Pending for Processing (MT)', sub: 'Procured − Processed', num: true },
];

/**
 * Railway Board · ERC: Raw Material Status Report combined by Vendor Code.
 * a. Plant Name (Vendor company name & associated units)
 * b. Quantity of Raw material Procured (MT) - Inventory added by vendor
 * c. Quantity of Raw Material Inspected (MT) - Raw Material offered by vendor for inspection
 * d. Quantity of Raw Material Pending for Inspection (MT) = (b - c)
 * e. Quantity Processed = Quantity of Raw Material Process Call has been Raised (MT)
 * f. Total Raw Material with plant pending for Processing (MT) = (b - e)
 */
export default function ErcRawMaterialReport() {
  const [data, setData] = useState({ rows: [], totals: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [company, setCompany] = useState([]);
  const [search, setSearch] = useState([]);
  const [sort, setSort] = useState({ col: 'plant', dir: 'asc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      if (fromDate) qs.set('fromDate', fromDate);
      if (toDate) qs.set('toDate', toDate);
      const res = await fetch(`${API_ENDPOINTS.REPORTS}/erc-raw-material-status${qs.toString() ? `?${qs}` : ''}`, { headers: getAuthHeaders() });
      const json = await handleResponse(res);
      const payload = json?.responseData ?? json;
      const rawRows = (payload?.rows || []).map(r => ({
        ...r,
        pendingProcessingMt: Math.max(0, Number(r.pendingProcessingMt || 0)),
        pendingInspectionMt: Math.max(0, Number(r.pendingInspectionMt || 0)),
      }));
      const rawTotals = {
        ...(payload?.totals || {}),
        pendingProcessingMt: Math.max(0, Number(payload?.totals?.pendingProcessingMt || 0)),
        pendingInspectionMt: Math.max(0, Number(payload?.totals?.pendingInspectionMt || 0)),
      };
      setData({ rows: rawRows, totals: rawTotals });
    } catch (e) {
      setError(e?.message || 'Could not load the raw material status report.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => { load(); }, [load]);

  const companies = useMemo(() => [...new Set(data.rows.map(r => r.companyName).filter(Boolean))].sort(), [data.rows]);

  // Plant (unit) options follow the selected manufacturers
  const plantOptions = useMemo(() => {
    const hasCompanyFilter = Array.isArray(company) && company.length > 0;
    const filteredRows = data.rows.filter(r => !hasCompanyFilter || company.includes(r.companyName));
    const seen = new Set();
    const result = [];
    for (const r of filteredRows) {
      const pois = (Array.isArray(r.poiCodes) && r.poiCodes.length > 0) ? r.poiCodes : [r.poiCode || r.vendorCode].filter(Boolean);
      for (const p of pois) {
        if (!seen.has(p)) {
          seen.add(p);
          result.push({
            value: p,
            label: (Array.isArray(company) && company.length === 1)
              ? `${p}`
              : `${r.companyName || ''} (${p})`,
          });
        }
      }
    }
    return result.sort((a, b) => a.label.localeCompare(b.label));
  }, [data.rows, company]);

  const onCompaniesChange = (newCompanies) => {
    setCompany(newCompanies);
    if (Array.isArray(newCompanies) && newCompanies.length > 0) {
      const validPois = new Set();
      data.rows
        .filter(r => newCompanies.includes(r.companyName))
        .forEach(r => {
          const pois = (Array.isArray(r.poiCodes) && r.poiCodes.length > 0) ? r.poiCodes : [r.poiCode || r.vendorCode].filter(Boolean);
          pois.forEach(p => validPois.add(p));
        });
      setSearch(prev => (Array.isArray(prev) ? prev.filter(p => validPois.has(p)) : []));
    }
  };

  const rows = useMemo(() => {
    const selectedCompanies = Array.isArray(company) ? company : (company ? [company] : []);
    const selectedPlants = Array.isArray(search) ? search : (search ? [search] : []);

    const list = data.rows
      .map(r => ({
        ...r,
        plant: `${r.companyName || ''} ${r.unitName || ''}`.trim() || r.vendorCode,
        pendingProcessingMt: Math.max(0, Number(r.pendingProcessingMt || 0)),
        pendingInspectionMt: Math.max(0, Number(r.pendingInspectionMt || 0)),
      }))
      .filter(r => {
        const matchCompany = selectedCompanies.length === 0 || selectedCompanies.includes(r.companyName);
        const rowPois = (Array.isArray(r.poiCodes) && r.poiCodes.length > 0) ? r.poiCodes : [r.poiCode, r.vendorCode].filter(Boolean);
        const matchPlant = selectedPlants.length === 0 || selectedPlants.some(p => rowPois.includes(p));
        return matchCompany && matchPlant;
      });

    const dir = sort.dir === 'asc' ? 1 : -1;
    return list.sort((a, b) => {
      if (sort.col === 'plant') return a.plant.localeCompare(b.plant) * dir;
      return (Number(a[sort.col] || 0) - Number(b[sort.col] || 0)) * dir;
    });
  }, [data.rows, company, search, sort]);

  // Totals follow the filters in view
  const totals = useMemo(() => rows.reduce((t, r) => {
    ['procuredMt', 'inspectedMt', 'pendingInspectionMt', 'processedMt', 'pendingProcessingMt', 'processedPieces', 'inspectedPieces']
      .forEach(k => { t[k] = (t[k] || 0) + Number(r[k] || 0); });
    return t;
  }, {}), [rows]);

  useEffect(() => { setPage(1); }, [company, search, sort, pageSize, fromDate, toDate]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const onSort = (col) => setSort(s => (s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: col === 'plant' ? 'asc' : 'desc' }));

  const periodLabel = fromDate || toDate ? `Period ${fromDate || '…'} to ${toDate || '…'}` : 'All periods';
  const exportRow = (r, i) => [
    i + 1,
    r.companyName || r.vendorCode,
    r.unitName || '-',
    r.vendorCode || '-',
    Number(r.procuredMt || 0),
    Number(r.inspectedMt || 0),
    Number(r.inspectedPieces || 0),
    Number(r.pendingInspectionMt || 0),
    Number(r.processedMt || 0),
    Number(r.processedPieces || 0),
    Number(r.pendingProcessingMt || 0),
  ];
  const exportHead = [
    'S.No',
    'Plant Name (Vendor)',
    'Associated Units',
    'Vendor Code',
    'RM Procured (MT)',
    'RM Inspected (MT)',
    'Inspected (Nos)',
    'Pending Inspection (MT) [Procured − Inspected]',
    'Qty Processed (MT)',
    'Processed (Nos)',
    'Pending Processing (MT) [Procured − Processed]',
  ];
  const totalRow = [
    '',
    'TOTAL',
    '',
    '',
    totals.procuredMt || 0,
    totals.inspectedMt || 0,
    totals.inspectedPieces || 0,
    totals.pendingInspectionMt || 0,
    totals.processedMt || 0,
    totals.processedPieces || 0,
    totals.pendingProcessingMt || 0,
  ];

  const exportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('RM Status');
    ws.addRow(['ERC Raw Material Status Report (Vendor-wise)']).font = { bold: true, size: 14 };
    ws.addRow([periodLabel]);
    ws.addRow([]);
    const head = ws.addRow(exportHead);
    head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    head.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; c.alignment = { wrapText: true, vertical: 'middle' }; });
    rows.forEach((r, i) => ws.addRow(exportRow(r, i)));
    ws.addRow(totalRow).font = { bold: true };
    ws.columns = [6, 32, 28, 14, 16, 16, 14, 18, 16, 14, 20].map(w => ({ width: w }));
    [5, 6, 8, 9, 11].forEach(c => { ws.getColumn(c).numFmt = '#,##0.000'; });
    [7, 10].forEach(c => { ws.getColumn(c).numFmt = '#,##0'; });
    const buf = await wb.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `ERC_RM_Status_VendorWise_${stamp()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('ERC Raw Material Status Report (Vendor-wise)', 14, 14);
    doc.setFontSize(9);
    doc.text(`${periodLabel} · Generated ${new Date().toLocaleString('en-IN')}`, 14, 20);
    const f = (v, d = 3) => Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
    const pdfHead = ['S.No', 'Plant Name (Vendor)', 'Units', 'Procured (MT)', 'Inspected (MT)', 'Pending Insp (MT)', 'Processed (MT)', 'Pending Proc (MT)'];
    const pdfRow = (r, i) => [
      i + 1,
      r.companyName || r.vendorCode,
      r.unitName || '-',
      f(r.procuredMt),
      f(r.inspectedMt),
      f(r.pendingInspectionMt),
      f(r.processedMt),
      f(r.pendingProcessingMt),
    ];
    const pdfTotal = [
      '',
      'TOTAL',
      '',
      f(totals.procuredMt),
      f(totals.inspectedMt),
      f(totals.pendingInspectionMt),
      f(totals.processedMt),
      f(totals.pendingProcessingMt),
    ];
    autoTable(doc, {
      startY: 25,
      head: [pdfHead],
      body: rows.map((r, i) => pdfRow(r, i)),
      foot: [pdfTotal],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138] },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' } },
    });
    doc.save(`ERC_RM_Status_VendorWise_${stamp()}.pdf`);
  };

  const neg = (v) => Number(v || 0) < 0;
  // % of procured, for the KPI progress bars
  const share = (v) => (Number(totals.procuredMt) > 0 ? Math.round((Number(v || 0) / Number(totals.procuredMt)) * 1000) / 10 : 0);
  const hasFilters = (Array.isArray(company) ? company.length > 0 : Boolean(company))
    || (Array.isArray(search) ? search.length > 0 : Boolean(search))
    || fromDate || toDate;
  const clearFilters = () => { setCompany([]); setSearch([]); setFromDate(''); setToDate(''); };

  return (
    <div className="rms-wrap">
      <div className="rms-head">
        <div>
          <h2 className="rms-title">Raw Material Status Report</h2>
          <p className="rms-sub">ERC · vendor-wise raw material procured, inspected and processed (MT)</p>
        </div>
        <div className="rms-actions">
          <button className="rms-btn" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : '⟳ Refresh'}</button>
          <button className="rms-btn" onClick={exportExcel} disabled={!rows.length}>Excel</button>
          <button className="rms-btn" onClick={exportPdf} disabled={!rows.length}>PDF</button>
        </div>
      </div>

      {!loading && rows.length > 0 && (
        <div className="rms-kpis">
          {[
            { k: 'procured', icon: '📦', label: 'RM Procured', val: totals.procuredMt, sub: 'Inventory added' },
            { k: 'inspected', icon: '🔍', label: 'RM Inspected', val: totals.inspectedMt, sub: totals.inspectedPieces ? `${pcs(totals.inspectedPieces)} nos` : 'Offered for inspection', pct: share(totals.inspectedMt) },
            { k: 'pending', icon: '⏳', label: 'Pending Inspection', val: totals.pendingInspectionMt, sub: 'Procured − Inspected', pct: share(totals.pendingInspectionMt) },
            { k: 'processed', icon: '⚙️', label: 'Qty Processed', val: totals.processedMt, sub: totals.processedPieces ? `${pcs(totals.processedPieces)} nos` : 'Process calls raised', pct: share(totals.processedMt) },
            { k: 'stock', icon: '🏭', label: 'Pending Processing', val: totals.pendingProcessingMt, sub: 'Procured − Processed', pct: share(totals.pendingProcessingMt) },
          ].map(c => (
            <div key={c.k} className={`rms-kpi rms-kpi--${c.k}`}>
              <div className="rms-kpi-top">
                <span className="rms-kpi-label">{c.label}</span>
                <span className="rms-kpi-icon">{c.icon}</span>
              </div>
              <div className="rms-kpi-val">{mt(c.val)}<small>MT</small></div>
              <div className="rms-kpi-foot">
                <span>{c.sub}</span>
                {c.pct != null && <b>{c.pct}%</b>}
              </div>
              {c.pct != null && <div className="rms-kpi-bar"><i style={{ width: `${Math.min(100, Math.max(0, c.pct))}%` }} /></div>}
            </div>
          ))}
        </div>
      )}

      <div className="rms-filters">
        <div className="rms-field">
          <SearchSelect
            label="Manufacturer"
            value={company}
            onChange={onCompaniesChange}
            options={companies}
            placeholder="All manufacturers"
            multiple
          />
        </div>
        <div className="rms-field">
          <SearchSelect
            label="Plant (Unit)"
            value={search}
            onChange={setSearch}
            options={plantOptions}
            placeholder="All plants"
            multiple
          />
        </div>
        <div className="rms-field rms-field--sm">
          <span className="rms-flabel">Calls from</span>
          <input type="date" value={fromDate} max={toDate || undefined} onChange={e => setFromDate(e.target.value)} />
        </div>
        <div className="rms-field rms-field--sm">
          <span className="rms-flabel">Calls to</span>
          <input type="date" value={toDate} min={fromDate || undefined} onChange={e => setToDate(e.target.value)} />
        </div>
        <button type="button" className="rms-clear" onClick={clearFilters} disabled={!hasFilters}>Clear</button>
      </div>

      {error && <div className="rms-error">{error}</div>}

      <div className="rms-table-wrap">
        <table className="rms-table">
          <thead>
            <tr>
              <th className="rms-th rms-th--sno"><div className="rms-th-label">S.No</div></th>
              {COLUMNS.map(c => (
                <th
                  key={c.key}
                  aria-sort={sort.col === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  className={`rms-th rms-sortable ${c.num ? 'rms-num' : ''} ${c.key === 'plant' ? 'rms-th--plant' : ''} ${sort.col === c.key ? 'rms-th--active' : ''}`}
                  onClick={() => onSort(c.key)}
                >
                  <div className="rms-th-box">
                    <button
                      type="button"
                      className="rms-th-label"
                      onClick={(e) => { e.stopPropagation(); onSort(c.key); }}
                      title={`Sort by ${c.label}`}
                    >
                      <span>{c.label}</span>
                      <span className="rms-sort">{sort.col === c.key ? (sort.dir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                    </button>
                    {c.sub && <span className="rms-th-chip">{c.sub}</span>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>{Array.from({ length: 7 }).map((__, j) => <td key={j}><div className="rms-skel" /></td>)}</tr>
            )) : !rows.length ? (
              <tr><td colSpan={7}><div className="rms-empty">📋<p>No raw material data found</p><span>No ERC raw material inventory or inspection calls match the current filters</span></div></td></tr>
            ) : pageRows.map((r, i) => (
              <tr key={r.vendorCode || r.poiCode || i}>
                <td className="rms-sr">{(safePage - 1) * pageSize + i + 1}</td>
                <td className="rms-td--plant">
                  <div className="rms-plant">
                    <div className="rms-avatar">{(r.companyName || r.vendorCode || '?').trim()[0]?.toUpperCase()}</div>
                    <div className="rms-plant-info">
                      <div className="rms-plant-name">{r.companyName || r.vendorCode}</div>
                      <div className="rms-plant-meta">
                        {r.vendorCode && (
                          <span className="rms-vendor-badge" title="Vendor Code">
                            Code: {String(r.vendorCode).replace(/^:+/, '')}
                          </span>
                        )}
                        {r.unitName && (
                          <span className="rms-plant-units" title="Associated Plants / Units">
                            {r.unitName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="rms-num">{mt(r.procuredMt)}</td>
                <td className="rms-num">
                  {mt(r.inspectedMt)}
                  {Number(r.inspectedPieces) > 0 && <div className="rms-muted">{pcs(r.inspectedPieces)} nos</div>}
                </td>
                <td className={`rms-num rms-strong ${neg(r.pendingInspectionMt) ? 'rms-neg' : 'rms-warn'}`}>{mt(r.pendingInspectionMt)}</td>
                <td className="rms-num">
                  {mt(r.processedMt)}
                  {Number(r.processedPieces) > 0 && <div className="rms-muted">{pcs(r.processedPieces)} nos</div>}
                </td>
                <td className={`rms-num rms-strong ${neg(r.pendingProcessingMt) ? 'rms-neg' : 'rms-info'}`}>{mt(r.pendingProcessingMt)}</td>
              </tr>
            ))}
          </tbody>
          {!loading && rows.length > 0 && (
            <tfoot>
              <tr>
                <td></td>
                <td>Total ({rows.length} vendors)</td>
                <td className="rms-num">{mt(totals.procuredMt)}</td>
                <td className="rms-num">
                  {mt(totals.inspectedMt)}
                  {Number(totals.inspectedPieces) > 0 && <div className="rms-muted">{pcs(totals.inspectedPieces)} nos</div>}
                </td>
                <td className="rms-num">{mt(totals.pendingInspectionMt)}</td>
                <td className="rms-num">
                  {mt(totals.processedMt)}
                  {Number(totals.processedPieces) > 0 && <div className="rms-muted">{pcs(totals.processedPieces)} nos</div>}
                </td>
                <td className="rms-num">{mt(totals.pendingProcessingMt)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {!loading && rows.length > 0 && (
        <div className="rms-pager">
          <div>Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, rows.length)} of {rows.length} vendors</div>
          <div className="rms-pager-ctrl">
            <span>Rows per page:</span>
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={() => setPage(1)} disabled={safePage === 1}>«</button>
            <button onClick={() => setPage(p => p - 1)} disabled={safePage === 1}>‹</button>
            <strong>Page {safePage} / {totalPages}</strong>
            <button onClick={() => setPage(p => p + 1)} disabled={safePage >= totalPages}>›</button>
            <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages}>»</button>
          </div>
        </div>
      )}

      <p className="rms-note">
        Combined by vendor code · <b>Plant Name</b>: Vendor / manufacturer and associated plants (units) ·
        <b>Procured</b>: Total raw material inventory added by vendor (MT) ·
        <b>Inspected</b>: Raw material offered by vendor for inspection (MT) ·
        <b>Pending Inspection</b>: Raw material awaiting inspection (Procured − Inspected) ·
        <b>Qty Processed</b>: ERC process inspection calls raised, converted to MT (0.91 kg MK-III, 0.915 kg J-type, 1.14 kg MK-V) ·
        <b>Pending Processing</b>: Total raw material with plant pending for processing (Procured − Processed).
      </p>
    </div>
  );
}
