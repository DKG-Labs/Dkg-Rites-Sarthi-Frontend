import { useState } from 'react';
import ScrapImageUploader from './ScrapImageUploader';
import { updateScrapEntry, scrapImageProxyUrl } from '../../services/scrapEntryService';
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

  // Initialise uploader with existing Azure Blob URLs so thumbnails are visible immediately
  const [images, setImages] = useState(() =>
    (entry.imageUrls || []).map((url, i) => ({ fileName: `photo-${i + 1}.jpg`, url: scrapImageProxyUrl(url) }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const reasonOk = form.reason.trim().length >= 5;

  const handleSubmit = async () => {
    if (!reasonOk || loading) return;
    setLoading(true);
    setError('');
    try {
      // Images with base64Data are new uploads; images with only url are kept existing ones.
      const newUploads = images.filter(img => img.base64Data);
      const keptUrls = images.filter(img => !img.base64Data).map(img => img.url);
      const result = await updateScrapEntry(entry.entryId, {
        scrappingDate: form.scrappingDate,
        shift: form.shift,
        noOfPiecesScrapped: parseInt(form.noOfPiecesScrapped),
        remarks: form.remarks,
        reason: form.reason,
        actionBy: String(ieUserId),
        images: newUploads.length > 0
          ? newUploads.map(img => ({ fileName: img.fileName, base64Data: img.base64Data }))
          : undefined,
        keptImageUrls: keptUrls.length > 0 ? keptUrls : undefined,
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
          <div className="rs-modal-title"><span>✏️</span> Edit Disposal Entry</div>
          <button className="rs-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="rs-modal-body">
          {error && <div className="rs-error-box"><span>⚠️</span>{error}</div>}

          <div className="rs-sv-chip">
            <span>🔖</span> {entry.scrapVerificationId}
          </div>

          <div className="rs-form-grid" style={{ marginBottom: 16 }}>
            <div className="rs-field">
              <label className="rs-field-label">Disposal Date</label>
              <input className="rs-input" type="date" value={form.scrappingDate} onChange={e => set('scrappingDate', e.target.value)} />
            </div>
            <div className="rs-field">
              <label className="rs-field-label">Shift</label>
              <select className="rs-input" value={form.shift} onChange={e => set('shift', e.target.value)}>
                {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="rs-field">
              <label className="rs-field-label">Pieces Disposed</label>
              <input className="rs-input" type="number" min={1} value={form.noOfPiecesScrapped} onChange={e => set('noOfPiecesScrapped', e.target.value)} />
            </div>
          </div>

          <div className="rs-field" style={{ marginBottom: 16 }}>
            <label className="rs-field-label">Remarks</label>
            <textarea className="rs-input" value={form.remarks} onChange={e => set('remarks', e.target.value)} />
          </div>

          <div className="rs-field" style={{ marginBottom: 16 }}>
            <label className="rs-field-label">After-Disposal Photos</label>
            <ScrapImageUploader
              images={images}
              onAdd={img => setImages(p => [...p, img])}
              onRemove={idx => setImages(p => p.filter((_, i) => i !== idx))}
            />
            {images.some(img => !img.base64Data) && (
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                📎 Existing photos shown above — remove to replace, or add new ones
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
