import { useState, useEffect } from 'react';
import ScrapImageUploader from './ScrapImageUploader';
import { getPendingQty, addScrapEntry } from '../../services/scrapEntryService';
import './RejectionScrapping.css';

const SHIFTS = ['A', 'B', 'C', 'General'];

export default function AddScrapEntryModal({ poiCode, ieUserId, ieType, onClose, onSuccess }) {
  const [form, setForm] = useState({
    unitLineShedNo: '',
    scrappingDate: new Date().toISOString().slice(0, 10),
    shift: '',
    noOfPiecesScrapped: '',
    remarks: '',
    declarationAccepted: false,
  });
  const [images, setImages] = useState([]);
  const [pendingQty, setPendingQty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!poiCode || !form.scrappingDate) { setPendingQty(null); return; }
    getPendingQty(poiCode, form.scrappingDate)
      .then(setPendingQty)
      .catch(() => setPendingQty(null));
  }, [poiCode, form.scrappingDate]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const piecesNum = Number(form.noOfPiecesScrapped);

  const canSubmit =
    form.unitLineShedNo.trim() &&
    form.scrappingDate &&
    form.shift &&
    piecesNum > 0 &&
    (pendingQty === null || piecesNum <= pendingQty) &&
    images.length >= 1 &&
    form.declarationAccepted;

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError('');
    try {
      const result = await addScrapEntry({
        poiCode,
        unitLineShedNo: form.unitLineShedNo.trim(),
        scrappingDate: form.scrappingDate,
        shift: form.shift,
        noOfPiecesScrapped: parseInt(form.noOfPiecesScrapped),
        remarks: form.remarks,
        declarationAccepted: true,
        ieUserId,
        ieType,
        actionBy: String(ieUserId),
        images: images.map(img => ({ fileName: img.fileName, base64Data: img.base64Data })),
      });
      onSuccess(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rs-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="rs-modal">
        <div className="rs-modal-header">
          <div className="rs-modal-title">
            <span>🗑️</span> Add Scrapping Entry
          </div>
          <button className="rs-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="rs-modal-body">
          {error && <div className="rs-error-box"><span>⚠️</span>{error}</div>}

          <div className="rs-form-grid" style={{ marginBottom: 16 }}>
            <div className="rs-field" style={{ gridColumn: '1 / -1' }}>
              <label className="rs-field-label required">Unit / Line / Shed No.</label>
              <input
                className="rs-input"
                value={form.unitLineShedNo}
                onChange={e => set('unitLineShedNo', e.target.value)}
                placeholder="e.g. Line-2 / Shed-A"
              />
            </div>

            <div className="rs-field">
              <label className="rs-field-label required">Scrapping Date</label>
              <input className="rs-input" type="date" value={form.scrappingDate} onChange={e => set('scrappingDate', e.target.value)} />
            </div>

            <div className="rs-field">
              <label className="rs-field-label required">Shift</label>
              <select className="rs-input" value={form.shift} onChange={e => set('shift', e.target.value)}>
                <option value="">Select Shift</option>
                {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="rs-field">
              <label className="rs-field-label">Pending Qty (auto)</label>
              <div className="rs-pending-display">
                <span className={`rs-pending-value${pendingQty === 0 ? ' zero' : ''}`}>
                  {pendingQty !== null ? pendingQty : '—'}
                </span>
                {pendingQty !== null && <span className="rs-pending-unit">pieces pending</span>}
                {pendingQty === null && (
                  <span className="rs-pending-unit">
                    {!form.scrappingDate ? 'select date above' : 'loading…'}
                  </span>
                )}
              </div>
            </div>

            <div className="rs-field">
              <label className="rs-field-label required">Pieces Scrapped</label>
              <input
                className="rs-input"
                type="number"
                min={1}
                max={pendingQty ?? undefined}
                value={form.noOfPiecesScrapped}
                onChange={e => {
                  const val = e.target.value;
                  if (pendingQty !== null && Number(val) > pendingQty) {
                    set('noOfPiecesScrapped', String(pendingQty));
                  } else {
                    set('noOfPiecesScrapped', val);
                  }
                }}
                placeholder="0"
              />
              {pendingQty !== null && pendingQty === 0 && (
                <div className="rs-field-error">No pending pieces available for scrapping</div>
              )}
            </div>
          </div>

          <div className="rs-field" style={{ marginBottom: 16 }}>
            <label className="rs-field-label">After-Scrap Photos</label>
            <ScrapImageUploader
              images={images}
              onAdd={img => setImages(p => [...p, img])}
              onRemove={idx => setImages(p => p.filter((_, i) => i !== idx))}
            />
          </div>

          <div className="rs-field" style={{ marginBottom: 16 }}>
            <label className="rs-field-label">Remarks</label>
            <textarea className="rs-input" value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Optional remarks…" />
          </div>

          <div className="rs-declaration">
            <label>
              <input
                type="checkbox"
                checked={form.declarationAccepted}
                onChange={e => set('declarationAccepted', e.target.checked)}
              />
              I declare that the information provided about the scrapped pieces is true and accurate to the best
              of my knowledge, and the scrapping has been carried out as per RITES guidelines.
            </label>
          </div>
        </div>

        <div className="rs-modal-footer">
          <button className="rs-btn rs-btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            className="rs-btn rs-btn-primary"
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading ? '⏳ Submitting…' : '✓ Submit Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
