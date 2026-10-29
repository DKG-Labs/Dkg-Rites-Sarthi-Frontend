import { useState } from 'react';
import ScrapImageUploader from './ScrapImageUploader';
import { updateScrapEntry } from '../../services/scrapEntryService';
import './RejectionScrapping.css';

const SHIFTS = ['A', 'B', 'C', 'General'];

export default function EditScrapEntryModal({ entry, ieUserId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    scrappingDate: entry.entryDate || '',
    shift: entry.shift || '',
    noOfPiecesScrapped: entry.scrappedQty || '',
    remarks: entry.remarks || '',
    reason: '',
  });
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const reasonOk = form.reason.trim().length >= 5;

  const handleSubmit = async () => {
    if (!reasonOk || loading) return;
    setLoading(true);
    setError('');
    try {
      const result = await updateScrapEntry(entry.entryId, {
        scrappingDate: form.scrappingDate,
        shift: form.shift,
        noOfPiecesScrapped: parseInt(form.noOfPiecesScrapped),
        remarks: form.remarks,
        reason: form.reason,
        actionBy: String(ieUserId),
        images: newImages.length > 0
          ? newImages.map(img => ({ fileName: img.fileName, base64Data: img.base64Data }))
          : undefined,
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
          <div className="rs-modal-title"><span>✏️</span> Edit Scrapping Entry</div>
          <button className="rs-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="rs-modal-body">
          {error && <div className="rs-error-box"><span>⚠️</span>{error}</div>}

          <div className="rs-sv-chip">
            <span>🔖</span> {entry.scrapVerificationId}
          </div>

          <div className="rs-form-grid" style={{ marginBottom: 16 }}>
            <div className="rs-field">
              <label className="rs-field-label">Scrapping Date</label>
              <input className="rs-input" type="date" value={form.scrappingDate} onChange={e => set('scrappingDate', e.target.value)} />
            </div>
            <div className="rs-field">
              <label className="rs-field-label">Shift</label>
              <select className="rs-input" value={form.shift} onChange={e => set('shift', e.target.value)}>
                {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="rs-field">
              <label className="rs-field-label">Pieces Scrapped</label>
              <input className="rs-input" type="number" min={1} value={form.noOfPiecesScrapped} onChange={e => set('noOfPiecesScrapped', e.target.value)} />
            </div>
          </div>

          <div className="rs-field" style={{ marginBottom: 16 }}>
            <label className="rs-field-label">Remarks</label>
            <textarea className="rs-input" value={form.remarks} onChange={e => set('remarks', e.target.value)} />
          </div>

          <div className="rs-field" style={{ marginBottom: 16 }}>
            <label className="rs-field-label">Replace Photos (leave empty to keep existing)</label>
            <ScrapImageUploader
              images={newImages}
              onAdd={img => setNewImages(p => [...p, img])}
              onRemove={idx => setNewImages(p => p.filter((_, i) => i !== idx))}
            />
            {(entry.imageUrls || []).length > 0 && newImages.length === 0 && (
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                📎 {entry.imageUrls.length} existing photo(s) will be kept
              </div>
            )}
          </div>

          <div className="rs-field">
            <label className="rs-reason-label">Reason for Edit * (min. 5 characters — audited)</label>
            <input
              className={`rs-input${!reasonOk && form.reason ? ' error' : ''}`}
              value={form.reason}
              onChange={e => set('reason', e.target.value)}
              placeholder="Mandatory — explain why this entry is being changed"
            />
          </div>
        </div>

        <div className="rs-modal-footer">
          <button className="rs-btn rs-btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            className="rs-btn rs-btn-primary"
            onClick={handleSubmit}
            disabled={!reasonOk || loading}
          >
            {loading ? '⏳ Saving…' : '✓ Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
