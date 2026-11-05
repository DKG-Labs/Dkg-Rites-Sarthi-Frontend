import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getRejectionBasket,
  getScrapLedger,
  getScrapVerification,
  deleteScrapVerification,
  fetchScrapPhoto
} from '../../services/railpadScrapService';
import ScrapVerificationModal from './ScrapVerificationModal';
import SearchSelect from './SearchSelect';
import { exportExcel, exportPdf } from './basketExport';
import './RejectionBasket.css';

const n = (v) => Number(v || 0).toLocaleString('en-IN');
const PAGE_SIZES = [10, 20, 30, 50];

/** Authed lightbox image loader that uses bearer token proxy to load private blob photos */
const AuthedLightboxImg = ({ url, alt }) => {
  const [src, setSrc] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    let objectUrl = null;
    fetchScrapPhoto(url)
      .then(u => {
        objectUrl = u;
        if (alive) setSrc(u);
        else URL.revokeObjectURL(u);
      })
      .catch(() => alive && setErr(true));

    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (err) return <div style={{ color: '#fca5a5', padding: 18, fontSize: 13 }}>Photo could not be loaded</div>;
  if (!src) return <div style={{ color: '#cbd5e1', padding: 18, fontSize: 13 }}>Loading photo…</div>;
  return <img src={src} alt={alt} onClick={e => e.stopPropagation()} />;
};

export default function RejectionBasket({ dutyPlantId, readOnly = false, ieType = 'PROCESS_IE' }) {
  const [basketRows, setBasketRows] = useState([]);
  const [basketLoading, setBasketLoading] = useState(true);

  const [selectedPlant, setSelectedPlant] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');

  const [ledger, setLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL | REJECTION | SCRAP
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [lightboxUrls, setLightboxUrls] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  // 1. Load summary basket to get all mapped plants & products
  const loadBasket = useCallback(async () => {
    setBasketLoading(true);
    try {
      const data = await getRejectionBasket();
      setBasketRows(Array.isArray(data) ? data : []);
    } catch {
      setBasketRows([]);
    } finally {
      setBasketLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBasket();
  }, [loadBasket]);

  // Distinct plants
  const plantList = useMemo(() => {
    const map = new Map();
    basketRows.forEach(r => {
      if (r.plantId && !map.has(r.plantId)) {
        map.set(r.plantId, {
          plantId: r.plantId,
          vendorCode: r.vendorCode,
          manufacturer: r.manufacturer,
          placeOfInspection: r.placeOfInspection,
          canScrap: r.canScrap,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => (a.manufacturer || '').localeCompare(b.manufacturer || ''));
  }, [basketRows]);

  // Auto-select plant (dutyPlantId priority -> 1 plant auto -> fallback first)
  useEffect(() => {
    if (plantList.length === 0) return;
    if (dutyPlantId && plantList.some(p => p.plantId === dutyPlantId)) {
      setSelectedPlant(dutyPlantId);
    } else if (!selectedPlant || !plantList.some(p => p.plantId === selectedPlant)) {
      setSelectedPlant(plantList[0].plantId);
    }
  }, [plantList, dutyPlantId, selectedPlant]);

  // Distinct products for selected plant
  const productList = useMemo(() => {
    if (!selectedPlant) return [];
    return [...new Set(basketRows.filter(r => r.plantId === selectedPlant).map(r => r.productType).filter(Boolean))].sort();
  }, [basketRows, selectedPlant]);

  // Auto-select product
  useEffect(() => {
    if (productList.length === 0) {
      setSelectedProduct('');
    } else if (!selectedProduct || !productList.includes(selectedProduct)) {
      setSelectedProduct(productList[0]);
    }
  }, [productList, selectedProduct]);

  // Options for SearchSelect
  const plantOptions = useMemo(() => {
    return plantList.map(p => ({
      value: p.plantId,
      label: p.manufacturer
        ? `${p.manufacturer} — ${p.placeOfInspection} (${p.plantId})`
        : (p.placeOfInspection ? `${p.placeOfInspection} (${p.plantId})` : p.plantId),
    }));
  }, [plantList]);

  const productOptions = useMemo(() => {
    return productList.map(p => ({
      value: p,
      label: p,
    }));
  }, [productList]);

  // Selected plant details
  const selectedPlantObj = useMemo(() => {
    return plantList.find(p => p.plantId === selectedPlant);
  }, [plantList, selectedPlant]);

  // 2. Load ledger for selected plant and product
  const loadLedger = useCallback(async (pId, pType) => {
    if (!pId) return;
    setLedgerLoading(true);
    try {
      const data = await getScrapLedger({ plantId: pId, productType: pType || undefined });
      setLedger(data);
    } catch {
      setLedger(null);
    } finally {
      setLedgerLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPlant && selectedProduct) {
      loadLedger(selectedPlant, selectedProduct);
    } else {
      setLedger(null);
    }
  }, [selectedPlant, selectedProduct, loadLedger]);

  // Reset page when filter or selections change
  useEffect(() => {
    setPage(1);
  }, [typeFilter, pageSize, selectedPlant, selectedProduct]);

  // Rejection & Scrap counts
  const rawRows = ledger?.rows || [];
  const rejectionCount = rawRows.filter(r => r.rowType === 'REJECTION' && (r.rejectedQty ?? 0) > 0).length;
  const scrapCount = rawRows.filter(r => r.rowType === 'SCRAP').length;
  const allCount = rawRows.filter(r => !(r.rowType === 'REJECTION' && (r.rejectedQty ?? 0) === 0)).length;

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rawRows.filter(r => {
      if (r.rowType === 'REJECTION' && (r.rejectedQty ?? 0) === 0) return false;
      if (typeFilter === 'REJECTION') return r.rowType === 'REJECTION';
      if (typeFilter === 'SCRAP') return r.rowType === 'SCRAP';
      return true;
    });
  }, [rawRows, typeFilter]);

  const size = Number(pageSize) || 10;
  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / size));
  const safePage = Math.max(1, Math.min(page, totalPages));

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * size;
    return filteredRows.slice(start, start + size);
  }, [filteredRows, safePage, size]);

  // Actions
  const handleAddSuccess = (res) => {
    setShowAddModal(false);
    showToast(`Disposal entry submitted — SV ID: ${res?.verificationNo || res?.scrapVerificationId || 'Recorded'}`);
    loadBasket();
    if (selectedPlant && selectedProduct) loadLedger(selectedPlant, selectedProduct);
  };

  const handleEditClick = async (row) => {
    try {
      const detail = await getScrapVerification(row.verificationId);
      setEditEntry(detail);
    } catch (e) {
      showToast(e.message || 'Could not load entry details', 'error');
    }
  };

  const handleEditSuccess = (res) => {
    setEditEntry(null);
    showToast(`Disposal entry ${res?.verificationNo || ''} updated successfully.`);
    loadBasket();
    if (selectedPlant && selectedProduct) loadLedger(selectedPlant, selectedProduct);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleteReason.trim().length < 5 || deleting) return;
    setDeleting(true);
    try {
      await deleteScrapVerification(deleteTarget.verificationId, deleteReason.trim());
      setDeleteTarget(null);
      setDeleteReason('');
      showToast('Disposal entry deleted. Pending balance restored.');
      loadBasket();
      if (selectedPlant && selectedProduct) loadLedger(selectedPlant, selectedProduct);
    } catch (e) {
      showToast(e.message || 'Could not delete entry', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openPhotos = async (row) => {
    if (row.imageUrls && row.imageUrls.length > 0) {
      setLightboxUrls(row.imageUrls);
      return;
    }
    if (row.verificationId) {
      try {
        const detail = await getScrapVerification(row.verificationId);
        const photos = [...(detail.beforePhotos || []), ...(detail.afterPhotos || [])];
        if (photos.length > 0) {
          setLightboxUrls(photos);
        } else {
          showToast('No photos uploaded for this entry.', 'error');
        }
      } catch {
        showToast('Could not load photos.', 'error');
      }
    }
  };

  // Exports
  const handleExport = (kind) => {
    if (!filteredRows.length) return;
    const plantName = selectedPlantObj?.manufacturer || selectedPlant;
    const fileStamp = new Date().toISOString().slice(0, 10);
    const title = `Rail Pad Rejection & Disposal Ledger - ${plantName}`;
    const subtitle = `Product: ${selectedProduct} | Total Rejected: ${ledger?.totalRejected ?? 0} | Total Disposed: ${ledger?.totalScrapped ?? 0} | Pending Balance: ${ledger?.pendingScrapQty ?? 0}`;
    const cols = [
      { header: 'Type', value: r => (r.rowType === 'REJECTION' ? 'Rejection' : 'Disposal') },
      { header: 'Date', value: r => r.entryDate || r.date || '-' },
      { header: 'Shift', value: r => r.shift || r.callOrShift || '-' },
      { header: 'Unit / Line', value: r => r.unitLineShedNo || r.placeOfInspection || '-' },
      { header: 'Stage', value: r => r.stage || r.stageOfInspection || '-' },
      { header: 'Rejected', value: r => (r.rowType === 'REJECTION' ? r.rejectedQty : '-') },
      { header: 'Disposed', value: r => (r.rowType === 'SCRAP' ? r.scrappedQty : '-') },
      { header: 'Balance', value: r => r.pendingBalance ?? '-' },
      { header: 'IE Name', value: r => r.ieName || r.engineer || '-' },
      { header: 'SV ID', value: r => r.reference || r.scrapVerificationId || '-' },
    ];
    if (kind === 'pdf') exportPdf(`Railpad_Disposal_${fileStamp}`, title, subtitle, cols, filteredRows);
    else exportExcel(`Railpad_Disposal_${fileStamp}`, title, cols, filteredRows);
  };

  const canScrap = !readOnly && Boolean(ledger?.canScrap ?? selectedPlantObj?.canScrap);
  const pendingScrapQty = ledger?.pendingScrapQty ?? 0;

  return (
    <div className="rs-wrapper">
      {/* ── Top Bar ── */}
      <div className="rs-topbar">
        <div className="rs-title-block">
          <h2 className="rs-title">
            <span className="rs-title-icon">🗑️</span>
            Rejection &amp; Disposal
          </h2>
          <p className="rs-subtitle">
            Railpad IE — Track and record the disposal of rejected pieces
          </p>
        </div>

        <div className="rs-top-actions">
          {ledger && (
            <>
              <button className="rs-export-btn" onClick={() => handleExport('excel')} title="Export current ledger to Excel">
                📊 Excel
              </button>
              <button className="rs-export-btn" onClick={() => handleExport('pdf')} title="Export current ledger to PDF">
                📄 PDF
              </button>
            </>
          )}
          {selectedPlant && !readOnly && (
            <button
              type="button"
              className="rs-add-btn"
              onClick={() => setShowAddModal(true)}
              title="Record disposal verification"
            >
              + Add Disposal Entry
            </button>
          )}
        </div>
      </div>

      {/* ── Controls Panel: Plant Selector + Product Type + 3 KPI Tiles ── */}
      <div className="rs-controls-panel">
        <div className="rs-controls">
          <div className="rs-selectors-row">
            {/* Plant Dropdown / Chip */}
            <div className="rs-plant-block">
              <span className="rs-label">Plant / POI</span>
              {basketLoading ? (
                <div className="rs-skeleton-select" />
              ) : plantList.length === 0 ? (
                <div className="rs-no-plants">⚠️ No mapped plants found for this IE</div>
              ) : plantList.length === 1 ? (
                <div className="rs-plant-chip" title={plantList[0].label}>
                  <span className="rs-plant-chip-name">
                    {plantList[0].manufacturer || plantList[0].placeOfInspection || plantList[0].plantId}
                    {plantList[0].placeOfInspection ? ` — ${plantList[0].placeOfInspection}` : ''}
                  </span>
                  <span className="rs-plant-chip-code">{plantList[0].plantId}</span>
                </div>
              ) : (
                <SearchSelect
                  value={selectedPlant}
                  onChange={v => setSelectedPlant(v)}
                  options={plantOptions}
                  placeholder="— Select Plant —"
                />
              )}
            </div>

            {/* Product Type Dropdown / Chip */}
            {selectedPlant && productList.length > 0 && (
              <div className="rs-plant-block" style={{ minWidth: 200, flex: '1 1 200px' }}>
                <span className="rs-label">Product Type</span>
                {productList.length === 1 ? (
                  <div className="rs-plant-chip">
                    <span className="rs-plant-chip-name">{productList[0]}</span>
                  </div>
                ) : (
                  <SearchSelect
                    value={selectedProduct}
                    onChange={v => setSelectedProduct(v)}
                    options={productOptions}
                    placeholder="— Select Product Type —"
                  />
                )}
              </div>
            )}
          </div>

          {/* 3 KPI Cards */}
          {ledger && (
            <div className="rs-kpi-row">
              <div className="rs-kpi">
                <div className="rs-kpi-label">Total Rejected</div>
                <div className={`rs-kpi-value ${(ledger.totalRejected ?? 0) > 0 ? 'red' : 'green'}`}>
                  {n(ledger.totalRejected)}
                </div>
              </div>
              <div className="rs-kpi">
                <div className="rs-kpi-label">Total Disposed</div>
                <div className="rs-kpi-value green">
                  {n(ledger.totalScrapped)}
                </div>
              </div>
              <div className="rs-kpi">
                <div className="rs-kpi-label">Pending Balance</div>
                <div className={`rs-kpi-value ${(ledger.pendingScrapQty ?? 0) > 0 ? 'orange' : 'green'}`}>
                  {n(ledger.pendingScrapQty)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Card: Filter Pills + Ledger Table ── */}
      <div className="rs-card">
        {!selectedPlant ? (
          <div className="rs-prompt">
            <span className="rs-prompt-icon">🏭</span>
            <span className="rs-prompt-text">Select a plant above to view the rejection &amp; disposal ledger</span>
          </div>
        ) : (
          <>
            {/* Filter pills */}
            {!ledgerLoading && rawRows.length > 0 && (
              <div className="rs-type-filter">
                {[
                  { key: 'ALL', label: 'All', count: allCount },
                  { key: 'REJECTION', label: 'Rejection', count: rejectionCount },
                  { key: 'SCRAP', label: 'Disposal', count: scrapCount },
                ].map(({ key, label, count }) => (
                  <button
                    key={key}
                    type="button"
                    className={`rs-filter-pill${typeFilter === key ? ' active' : ''} ${key.toLowerCase()}`}
                    onClick={() => setTypeFilter(key)}
                  >
                    {label} <span className="rs-filter-count">{count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Table */}
            <div className="rs-table-wrap">
              <table className="rs-table">
                <thead>
                  <tr>
                    <th className="center" style={{ width: 46 }}>#</th>
                    <th style={{ width: 110 }}>Type</th>
                    <th style={{ width: 100 }}>Date</th>
                    <th style={{ width: 140 }}>Shift</th>
                    <th style={{ width: 180 }}>Unit / Line / Shed</th>
                    <th style={{ width: 95 }}>Stage</th>
                    <th className="num" style={{ width: 95 }}>Rejected</th>
                    <th className="num" style={{ width: 95 }}>Disposed</th>
                    <th className="num" style={{ width: 105 }}>Balance</th>
                    <th style={{ width: 150 }}>IE Name</th>
                    <th style={{ width: 120 }}>SV ID</th>
                    <th className="center" style={{ width: 85 }}>Photos</th>
                    {!readOnly && <th className="center" style={{ width: 85 }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {ledgerLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="rs-skel-row">
                        {Array.from({ length: readOnly ? 12 : 13 }).map((__, j) => (
                          <td key={j}><div className="rs-skeleton" style={{ width: j === 0 ? 30 : j === 1 ? 80 : 60 }} /></td>
                        ))}
                      </tr>
                    ))
                  ) : !ledger || rawRows.length === 0 ? (
                    <tr>
                      <td colSpan={readOnly ? 12 : 13}>
                        <div className="rs-empty">
                          <div className="rs-empty-icon">📋</div>
                          <p className="rs-empty-title">No entries for this plant yet</p>
                          <p className="rs-empty-sub">Rejection and disposal records will appear here</p>
                        </div>
                      </td>
                    </tr>
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={readOnly ? 12 : 13}>
                        <div className="rs-empty">
                          <div className="rs-empty-icon">🔍</div>
                          <p className="rs-empty-title">
                            No {typeFilter === 'REJECTION' ? 'rejection' : 'disposal'} entries found
                          </p>
                          <p className="rs-empty-sub">Try switching the filter above</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((row, idx) => {
                      const isScrap = row.rowType === 'SCRAP';
                      const hasPhotos = (row.imageUrls && row.imageUrls.length > 0) || (isScrap && row.verificationId);
                      return (
                        <tr key={`${row.rowType}-${row.verificationId || row.sourceId || idx}`}>
                          {/* # (Sr No) */}
                          <td className="center" style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>
                            {(safePage - 1) * size + idx + 1}
                          </td>

                          {/* Type */}
                          <td>
                            <span className={`rs-badge ${isScrap ? 'scrap' : 'rejection'}`}>
                              {isScrap ? '✓ Disposal' : '✕ Rejection'}
                            </span>
                          </td>

                          {/* Date */}
                          <td style={{ whiteSpace: 'nowrap' }}>{row.entryDate || row.date || '—'}</td>

                          {/* Shift */}
                          <td style={{ fontSize: 12.5, color: '#475569' }}>{row.shift || row.callOrShift || '—'}</td>

                          {/* Unit / Line / Shed */}
                          <td style={{ fontSize: 12.5 }}>{row.unitLineShedNo || row.placeOfInspection || selectedPlantObj?.placeOfInspection || '—'}</td>

                          {/* Stage */}
                          <td style={{ whiteSpace: 'nowrap' }}>{row.stage || row.stageOfInspection || '—'}</td>

                          {/* Rejected */}
                          <td className="num">
                            {!isScrap && (row.rejectedQty ?? 0) > 0 ? (
                              <span style={{ color: '#dc2626', fontWeight: 600 }}>{n(row.rejectedQty)}</span>
                            ) : (
                              <span style={{ color: '#cbd5e1' }}>—</span>
                            )}
                          </td>

                          {/* Disposed */}
                          <td className="num">
                            {isScrap && (row.scrappedQty ?? 0) > 0 ? (
                              <span style={{ color: '#16a34a', fontWeight: 600 }}>{n(row.scrappedQty)}</span>
                            ) : (
                              <span style={{ color: '#cbd5e1' }}>—</span>
                            )}
                          </td>

                          {/* Balance */}
                          <td className="num">
                            <span className={(row.pendingBalance ?? 0) > 0 ? 'rs-balance-high' : 'rs-balance-ok'}>
                              {row.pendingBalance != null ? n(row.pendingBalance) : '—'}
                            </span>
                          </td>

                          {/* IE Name */}
                          <td>{row.ieName || row.engineer || '—'}</td>

                          {/* SV ID */}
                          <td style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                            {isScrap ? (row.scrapVerificationId && row.scrapVerificationId !== '—' ? row.scrapVerificationId : (row.reference || '—')) : '—'}
                          </td>

                          {/* Photos */}
                          <td className="center">
                            {hasPhotos ? (
                              <button
                                type="button"
                                className="rs-photo-btn"
                                onClick={() => openPhotos(row)}
                                title="View photos"
                              >
                                📷 {row.imageUrls?.length || 1}
                              </button>
                            ) : (
                              <span style={{ color: '#cbd5e1' }}>—</span>
                            )}
                          </td>

                          {/* Actions */}
                          {!readOnly && (
                            <td className="center">
                              {isScrap ? (
                                row.editable ? (
                                  <div className="rs-action-cell">
                                    <button
                                      type="button"
                                      className="rs-icon-btn edit"
                                      onClick={() => handleEditClick(row)}
                                      title="Edit within 1 hour of recording"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      type="button"
                                      className="rs-icon-btn del"
                                      onClick={() => { setDeleteTarget(row); setDeleteReason(''); }}
                                      title="Delete within 1 hour of recording"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                ) : (
                                  <span className="rs-lock-icon" title="Edit window expired (1 hour)">🔒</span>
                                )
                              ) : (
                                <span style={{ color: '#cbd5e1' }}>—</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!ledgerLoading && totalRows > 0 && (
              <div className="rs-pagination">
                <div className="rs-pagination-info">
                  Showing {totalRows === 0 ? 0 : (safePage - 1) * size + 1}–{Math.min(safePage * size, totalRows)} of {totalRows} entries
                </div>
                <div className="rs-pagination-controls">
                  <span className="rs-pagination-label">Rows per page:</span>
                  <select
                    className="rs-page-size-select"
                    value={size}
                    onChange={e => {
                      const newSize = Number(e.target.value) || 10;
                      setPageSize(newSize);
                      setPage(1);
                    }}
                  >
                    {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="rs-pagination-nav">
                    <button
                      type="button"
                      className="rs-page-btn"
                      onClick={() => setPage(1)}
                      disabled={safePage === 1}
                      title="First page"
                    >
                      «
                    </button>
                    <button
                      type="button"
                      className="rs-page-btn"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      title="Previous page"
                    >
                      ‹
                    </button>
                    <span className="rs-page-indicator">{safePage} / {totalPages}</span>
                    <button
                      type="button"
                      className="rs-page-btn"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      title="Next page"
                    >
                      ›
                    </button>
                    <button
                      type="button"
                      className="rs-page-btn"
                      onClick={() => setPage(totalPages)}
                      disabled={safePage === totalPages}
                      title="Last page"
                    >
                      »
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Add Disposal Entry Modal ── */}
      {showAddModal && selectedPlant && (
        <ScrapVerificationModal
          mode="add"
          basketRow={{
            plantId: selectedPlant,
            productType: selectedProduct,
            manufacturer: selectedPlantObj?.manufacturer || '',
            placeOfInspection: selectedPlantObj?.placeOfInspection || selectedPlant,
            pendingScrapQty: ledger?.pendingScrapQty || 0,
          }}
          onClose={() => setShowAddModal(false)}
          onSaved={handleAddSuccess}
        />
      )}

      {/* ── Edit Disposal Entry Modal ── */}
      {editEntry && (
        <ScrapVerificationModal
          mode="edit"
          basketRow={{
            plantId: selectedPlant,
            productType: selectedProduct,
            manufacturer: selectedPlantObj?.manufacturer || '',
            placeOfInspection: selectedPlantObj?.placeOfInspection || selectedPlant,
            pendingScrapQty: ledger?.pendingScrapQty || 0,
          }}
          entry={editEntry}
          onClose={() => setEditEntry(null)}
          onSaved={handleEditSuccess}
        />
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="rs-overlay" onClick={e => { if (e.target === e.currentTarget && !deleting) setDeleteTarget(null); }}>
          <div className="rs-modal" role="dialog" aria-modal="true">
            <div className="rs-modal-header">
              <h3 className="rs-modal-title">Delete Disposal Entry</h3>
              <button
                type="button"
                className="rs-modal-close"
                onClick={() => !deleting && setDeleteTarget(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="rs-modal-body">
              <p style={{ margin: '0 0 12px', fontSize: 14, color: '#334155' }}>
                Are you sure you want to delete disposal entry{' '}
                <strong>{deleteTarget.reference || deleteTarget.scrapVerificationId || `#${deleteTarget.verificationId}`}</strong>?
              </p>
              <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#64748b' }}>
                The scrapped quantity will be restored to the plant pending balance. This action will be audited.
              </p>
              <label className="rs-label" style={{ marginBottom: 6, display: 'block' }}>
                Reason for Deletion * (minimum 5 characters)
              </label>
              <textarea
                className="rs-textarea"
                rows={3}
                placeholder="State why this disposal verification is being removed…"
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                disabled={deleting}
              />
            </div>
            <div className="rs-modal-footer">
              <button
                type="button"
                className="rs-btn rs-btn-ghost"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rs-btn rs-btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deleteReason.trim().length < 5 || deleting}
              >
                {deleting ? 'Deleting…' : 'Delete Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox for Photos ── */}
      {lightboxUrls && (
        <div className="rs-lightbox" onClick={() => setLightboxUrls(null)}>
          <button
            type="button"
            className="rs-lightbox-close"
            onClick={() => setLightboxUrls(null)}
            aria-label="Close lightbox"
          >
            ✕
          </button>
          {lightboxUrls.map((url, i) => (
            <AuthedLightboxImg key={i} url={url} alt={`Scrap Photo ${i + 1}`} />
          ))}
        </div>
      )}

      {/* ── Toast Notification ── */}
      {toast && (
        <div className={`rs-toast ${toast.type}`}>
          <span className="rs-toast-icon">{toast.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{toast.msg}</span>
          <button type="button" className="rs-toast-close" onClick={() => setToast(null)}>✕</button>
        </div>
      )}
    </div>
  );
}
