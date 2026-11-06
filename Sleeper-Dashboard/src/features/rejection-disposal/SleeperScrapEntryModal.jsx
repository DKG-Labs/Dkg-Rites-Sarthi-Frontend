import React, { useEffect, useMemo, useState } from 'react';
import ScrapImageUploader from './ScrapImageUploader';
import PendingSleepersGrid from './PendingSleepersGrid';
import { sleeperRefKey } from './sleeperRef';
import {
  getPendingSleepers,
  addSleeperScrapVerification,
  updateSleeperScrapVerification,
} from '../../services/sleeperScrapService';
import './RejectionScrapping.css';

const SHIFTS = ['A', 'B', 'C', 'General'];
const DECLARATION = 'I certify that the selected sleepers have been permanently damaged.';
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Scrap Verification form (IRS T-39 / T-45): pick the specific pending sleepers, attach before / after
 * scrapping photos, accept the declaration. mode="edit" changes an entry within 1 hour (reason required).
 */
export default function SleeperScrapEntryModal({ mode = 'add', plantId, plantLabel, entry, defaultShift, pendingSleepers, onClose, onSuccess }) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState(() => ({
    scrappingDate: isEdit ? (entry?.scrappingDate || today()) : today(),
    shift: isEdit ? (entry?.shift || '') : (SHIFTS.includes(defaultShift) ? defaultShift : ''),
    remarks: isEdit ? (entry?.remarks || '') : '',
    declarationAccepted: isEdit,
    reason: '',
  }));
  // Uses the pending list the screen already loaded with the ledger; fetches only if none was passed
  const [pending, setPending] = useState(pendingSleepers || null);
  const [pendingLoading, setPendingLoading] = useState(!pendingSleepers);
  const [selected, setSelected] = useState(() => {
    const m = new Map();
    if (isEdit) (entry?.sleepers || []).forEach(s => m.set(sleeperRefKey(s), s));
    return m;
  });
  const [beforeImages, setBeforeImages] = useState(() =>
    isEdit ? (entry?.beforePhotos || []).map((url, i) => ({ fileName: `before-${i + 1}.jpg`, url })) : []);
  const [afterImages, setAfterImages] = useState(() =>
    isEdit ? (entry?.afterPhotos || []).map((url, i) => ({ fileName: `after-${i + 1}.jpg`, url })) : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!plantId || pendingSleepers) return;
    setPendingLoading(true);
    getPendingSleepers(plantId)
      .then(d => setPending(d?.sleepers || []))
      .catch(e => { setPending([]); setError(`Could not load pending sleepers — ${e.message}`); })
      .finally(() => setPendingLoading(false));
  }, [plantId, pendingSleepers]);

  // On edit the entry's own sleepers are selectable too (they are not in the pending basket)
  const choices = useMemo(() => {
    const list = [...(pending || [])];
    if (isEdit) {
      const have = new Set(list.map(sleeperRefKey));
      (entry?.sleepers || []).forEach(s => { if (!have.has(sleeperRefKey(s))) list.unshift({ ...s, addedBy: s.addedBy || 'This entry' }); });
    }
    return list;
  }, [pending, isEdit, entry]);

  const selectedKeys = useMemo(() => new Set(selected.keys()), [selected]);
  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const toggle = (s) => setSelected(prev => {
    const next = new Map(prev);
    const k = sleeperRefKey(s);
    if (next.has(k)) next.delete(k); else next.set(k, s);
    return next;
  });
  const toggleMany = (list, check) => setSelected(prev => {
    const next = new Map(prev);
    list.forEach(s => { const k = sleeperRefKey(s); if (check) next.set(k, s); else next.delete(k); });
    return next;
  });

  const qty = selected.size;
  const reasonOk = form.reason.trim().length >= 5;
  const canSubmit = isEdit
    ? reasonOk && qty > 0 && form.scrappingDate && beforeImages.length >= 1 && afterImages.length >= 1
    : form.scrappingDate && form.shift && qty > 0 && beforeImages.length >= 1 && afterImages.length >= 1 && form.declarationAccepted;

  // On edit, photos of a type are sent (and replace the old ones) only when new photos were added
  const photosPayload = (images) => {
    const fresh = images.filter(img => img.base64Data);
    return fresh.length ? fresh.map(img => ({ fileName: img.fileName, base64Data: img.base64Data })) : undefined;
  };

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError('');
    try {
      const sleepers = [...selected.values()].map(s => ({ batchNo: s.batchNo, sleeperNo: s.sleeperNo }));
      const result = isEdit
        ? await updateSleeperScrapVerification(entry.id, {
          scrappingDate: form.scrappingDate,
          shift: form.shift,
          remarks: form.remarks,
          sleepers,
          beforePhotos: photosPayload(beforeImages),
          afterPhotos: photosPayload(afterImages),
          reason: form.reason.trim(),
        })
        : await addSleeperScrapVerification({
          plantId,
          scrappingDate: form.scrappingDate,
          shift: form.shift,
          remarks: form.remarks,
          sleepers,
          declarationAccepted: true,
          beforePhotos: photosPayload(beforeImages) || [],
          afterPhotos: photosPayload(afterImages) || [],
        });
      onSuccess(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const keptOld = (images) => images.some(img => !img.base64Data) && images.some(img => img.base64Data);

  return (
    <div className="rs-overlay" onClick={e => e.target === e.currentTarget && !loading && onClose()}>
      <div className="rs-modal rs-modal-xl">
        <div className="rs-modal-header">
          <div className="rs-modal-title">
            {isEdit ? <><span>✏️</span> Edit Disposal Entry</> : <><span>🗑️</span> Add Disposal Entry — Scrap Verification</>}
          </div>
          <button className="rs-modal-close" onClick={onClose} disabled={loading}>✕</button>
        </div>

        <div className="rs-modal-body">
          {error && <div className="rs-error-box"><span>⚠️</span>{error}</div>}

          {isEdit && (
            <div className="rs-sv-chip"><span>🔖</span> {entry.verificationNo}</div>
          )}
          {plantLabel && <div className="rs-modal-plant">🏭 {plantLabel}</div>}

          <div className="rs-form-grid rs-form-grid-4" style={{ marginBottom: 16 }}>
            <div className="rs-field">
              <label className="rs-field-label required">Disposal Date</label>
              <input className="rs-input" type="date" max={today()} value={form.scrappingDate} onChange={e => set('scrappingDate', e.target.value)} />
            </div>
            <div className="rs-field">
              <label className={`rs-field-label${isEdit ? '' : ' required'}`}>Shift</label>
              <select className="rs-input" value={form.shift} onChange={e => set('shift', e.target.value)}>
                <option value="">Select Shift</option>
                {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="rs-field">
              <label className="rs-field-label">Pending Sleepers (auto)</label>
              <div className="rs-pending-display">
                <span className={`rs-pending-value${pending && pending.length === 0 ? ' zero' : ''}`}>
                  {pendingLoading ? '—' : (pending || []).length}
                </span>
                <span className="rs-pending-unit">{pendingLoading ? 'loading…' : 'in basket'}</span>
              </div>
            </div>
            <div className="rs-field">
              <label className="rs-field-label">Quantity Witnessed (auto)</label>
              <div className="rs-pending-display">
                <span className={`rs-pending-value rs-qty-value${qty === 0 ? ' none' : ''}`}>{qty}</span>
                <span className="rs-pending-unit">sleeper{qty === 1 ? '' : 's'} selected</span>
              </div>
            </div>
          </div>

          <div className="rs-field" style={{ marginBottom: 16 }}>
            <label className="rs-field-label required">Select Sleepers to Scrap</label>
            <div className="rs-grid-box">
              <PendingSleepersGrid
                sleepers={choices}
                loading={pendingLoading}
                selectable
                selectedKeys={selectedKeys}
                onToggle={toggle}
                onToggleMany={toggleMany}
              />
            </div>
            {qty > 0 && (
              <div className="rs-selected-list">
                <span className="rs-selected-list-label">Selected Sleepers:</span>
                {[...selected.values()].map(s => (
                  <span key={sleeperRefKey(s)} className="rs-sleeper-chip removable" title={`Batch ${s.batchNo || '-'}`}>
                    {s.sleeperNo}<small> · B{s.batchNo || '-'}</small>
                    <button type="button" onClick={() => toggle(s)} aria-label={`Remove ${s.sleeperNo}`}>✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rs-form-grid" style={{ marginBottom: 16 }}>
            <div className="rs-field">
              <label className="rs-field-label required">Before Scrapping Photos</label>
              <ScrapImageUploader
                images={beforeImages}
                hint="Painted rejection marks / Sleeper ID"
                onAdd={img => setBeforeImages(p => [...p, img])}
                onRemove={idx => setBeforeImages(p => p.filter((_, i) => i !== idx))}
              />
              {isEdit && keptOld(beforeImages) && (
                <div className="rs-photo-note">New photos replace all existing before-scrapping photos</div>
              )}
            </div>
            <div className="rs-field">
              <label className="rs-field-label required">After Scrapping Photos</label>
              <ScrapImageUploader
                images={afterImages}
                hint="Crushed concrete & exposed wires"
                onAdd={img => setAfterImages(p => [...p, img])}
                onRemove={idx => setAfterImages(p => p.filter((_, i) => i !== idx))}
              />
              {isEdit && keptOld(afterImages) && (
                <div className="rs-photo-note">New photos replace all existing after-scrapping photos</div>
              )}
            </div>
          </div>

          <div className="rs-field" style={{ marginBottom: 16 }}>
            <label className="rs-field-label">Remarks</label>
            <textarea className="rs-input" value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Optional remarks…" />
          </div>

          {isEdit ? (
            <div className="rs-field">
              <label className="rs-reason-label">Reason for Edit * (min. 5 characters — audited)</label>
              <input
                className={`rs-input${!reasonOk && form.reason ? ' error' : ''}`}
                value={form.reason}
                onChange={e => set('reason', e.target.value)}
                placeholder="Mandatory — explain why this entry is being changed"
              />
            </div>
          ) : (
            <div className="rs-declaration">
              <label>
                <input
                  type="checkbox"
                  checked={form.declarationAccepted}
                  onChange={e => set('declarationAccepted', e.target.checked)}
                />
                {DECLARATION}
              </label>
            </div>
          )}
        </div>

        <div className="rs-modal-footer">
          {!canSubmit && !loading && (
            <span className="rs-footer-hint">
              {qty === 0 ? 'Select at least one sleeper'
                : beforeImages.length === 0 || afterImages.length === 0 ? 'Add before and after scrapping photos'
                  : isEdit ? (!reasonOk ? 'Give a reason for the edit' : '')
                    : !form.shift ? 'Select the shift'
                      : !form.declarationAccepted ? 'Accept the declaration' : ''}
            </span>
          )}
          <button className="rs-btn rs-btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="rs-btn rs-btn-primary" onClick={handleSubmit} disabled={!canSubmit || loading}>
            {loading ? (isEdit ? '⏳ Saving…' : '⏳ Submitting…') : (isEdit ? '✓ Save Changes' : `✓ Submit Entry${qty ? ` (${qty})` : ''}`)}
          </button>
        </div>
      </div>
    </div>
  );
}
