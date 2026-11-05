import React, { useEffect, useRef, useState } from 'react';
import { addScrapVerification, getPendingScrap, updateScrapVerification } from '../../services/railpadScrapService';

export const DECLARATION_TEXT =
  'I certify that the rejected rail pads have been cut into pieces and made unusable as per IRS T-55 specifications.';
const SHIFTS = ['A', 'B', 'C', 'General'];
const MAX_PHOTOS = 5;
const MAX_INPUT_MB = 15;

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Resize to max 2400px and re-encode as JPEG so phone photos upload quickly */
const compressImage = (file) => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) return reject(new Error(`${file.name} is not an image`));
  if (file.size > MAX_INPUT_MB * 1024 * 1024) return reject(new Error(`${file.name} is larger than ${MAX_INPUT_MB} MB`));
  const reader = new FileReader();
  reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
  reader.onload = () => {
    const img = new Image();
    img.onerror = () => reject(new Error(`Could not open ${file.name}`));
    img.onload = () => {
      const scale = Math.min(1, 2400 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve({ fileName: file.name.replace(/\.[^.]+$/, '') + '.jpg', base64Data: dataUrl, preview: dataUrl });
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

const PhotoPicker = ({ label, hint, photos, setPhotos, onError, disabled, stepNumber }) => {
  const inputRef = useRef(null);
  const [zoom, setZoom] = useState(null);

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (photos.length + files.length > MAX_PHOTOS) {
      onError(`A maximum of ${MAX_PHOTOS} photos is allowed for "${label}".`);
      return;
    }
    try {
      const done = await Promise.all(files.map(compressImage));
      setPhotos(prev => [...prev, ...done]);
    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <div className="rb-photo-card">
      <div className="rb-photo-card-head">
        <div className="rb-photo-badge-wrap">
          {stepNumber && <span className="rb-step-pill">Step {stepNumber}</span>}
          <label className="rb-photo-label">{label} <span className="rb-req">*</span></label>
        </div>
        <span className={`rb-photo-count ${photos.length === MAX_PHOTOS ? 'is-max' : ''}`}>
          {photos.length}/{MAX_PHOTOS}
        </span>
      </div>
      {hint && <p className="rb-photo-hint">{hint}</p>}

      {photos.length === 0 ? (
        <div
          className={`rb-photo-dropzone ${disabled ? 'is-disabled' : ''}`}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <div className="rb-photo-dropzone-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <div className="rb-photo-dropzone-title">Click to capture or upload</div>
          <div className="rb-photo-dropzone-sub">Camera or gallery · Max 5 · Compressed automatically</div>
        </div>
      ) : (
        <div className="rb-photos">
          {photos.map((p, i) => (
            <div className="rb-photo" key={i}>
              <img src={p.preview} alt={`${label} ${i + 1}`} onClick={() => setZoom(p.preview)} />
              {!disabled && (
                <button
                  type="button"
                  className="rb-photo-x"
                  aria-label="Remove photo"
                  onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                >
                  ×
                </button>
              )}
              <div className="rb-photo-num">#{i + 1}</div>
            </div>
          ))}
          {!disabled && photos.length < MAX_PHOTOS && (
            <button
              type="button"
              className="rb-photo-add-more"
              onClick={() => inputRef.current?.click()}
              title="Add another photo"
            >
              <div className="rb-photo-add-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <span className="rb-photo-add-text">Add More</span>
            </button>
          )}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" capture="environment" multiple hidden onChange={onPick} />
      {zoom && (
        <div className="rb-lightbox" onClick={() => setZoom(null)}>
          <img src={zoom} alt="Preview" />
        </div>
      )}
    </div>
  );
};

/**
 * Add a scrap verification, or edit one within its 1-hour window.
 * Props: mode ('add' | 'edit'), basketRow ({plantId, manufacturer, placeOfInspection, productType}),
 *        entry (existing record when editing), onClose(), onSaved(record)
 */
export default function ScrapVerificationModal({ mode = 'add', basketRow, entry, onClose, onSaved }) {
  const isEdit = mode === 'edit';
  const [pending, setPending] = useState(null);
  const [loadingPending, setLoadingPending] = useState(!isEdit);
  const [scrappingDate, setScrappingDate] = useState(entry?.scrappingDate || todayIso());
  const [shift, setShift] = useState(entry?.shift || '');
  const [qty, setQty] = useState(entry?.qtyScrapped ? String(entry.qtyScrapped) : '');
  const [before, setBefore] = useState([]);
  const [after, setAfter] = useState([]);
  const [declaration, setDeclaration] = useState(isEdit);
  const [remarks, setRemarks] = useState(entry?.remarks || '');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    getPendingScrap(basketRow.plantId, basketRow.productType)
      .then(d => { if (alive) setPending(d?.pendingScrapQty ?? 0); })
      .catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoadingPending(false); });
    return () => { alive = false; };
  }, [basketRow.plantId, basketRow.productType]);

  // When editing, this entry's own quantity counts as available again
  const available = pending == null ? null : pending + (isEdit ? (entry?.qtyScrapped || 0) : 0);

  const validate = () => {
    const n = Number(qty);
    if (!Number.isInteger(n) || n <= 0) return 'Quantity witnessed for scrapping must be a whole number greater than zero.';
    if (available != null && n > available) return `Quantity cannot exceed the available pending scrap quantity (${available.toLocaleString('en-IN')}).`;
    if (!scrappingDate) return 'Please select the scrapping date.';
    if (scrappingDate > todayIso()) return 'Scrapping date cannot be in the future.';
    if (!isEdit) {
      if (before.length === 0) return 'Please add at least one photo before scrapping.';
      if (after.length === 0) return 'Please add at least one photo after scrapping showing the pads cut into pieces.';
      if (!declaration) return 'Please accept the IRS T-55 compliance declaration.';
    }
    if (isEdit && reason.trim().length < 5) return 'Please give a reason (at least 5 characters) for this change.';
    return '';
  };

  const submit = async () => {
    const msg = validate();
    if (msg) { setError(msg); return; }
    setError('');
    setSaving(true);
    const strip = (list) => list.map(({ fileName, base64Data }) => ({ fileName, base64Data }));
    try {
      const payload = {
        plantId: basketRow.plantId,
        productType: basketRow.productType,
        scrappingDate,
        shift: shift || null,
        qtyScrapped: Number(qty),
        remarks,
        beforePhotos: before.length ? strip(before) : null,
        afterPhotos: after.length ? strip(after) : null,
      };
      const saved = isEdit
        ? await updateScrapVerification(entry.id, { ...payload, reason: reason.trim() })
        : await addScrapVerification({ ...payload, declarationAccepted: true });
      onSaved(saved);
    } catch (e) {
      setError(e.message || 'Could not save the scrap verification.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rb-overlay" onClick={e => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className="rb-modal" role="dialog" aria-modal="true">
        <div className="rb-modal-head">
          <div className="rb-modal-title-wrap">
            <div className="rb-modal-badge-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <div>
              <h3>{isEdit ? `Edit Scrap Verification ${entry?.verificationNo || ''}` : 'Add Scrap Verification'}</h3>
              <p className="rb-modal-subtitle">IRS T-55 witnessed destruction &amp; scrapping record</p>
            </div>
          </div>
          <button className="rb-close" onClick={onClose} disabled={saving} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="rb-modal-body">
          <div className="rb-info-banner">
            <div className="rb-info-plant">
              <div className="rb-info-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18M5 21V7l8-4v18M13 10l6-3v14M9 10h.01M9 14h.01M9 18h.01M17 14h.01M17 18h.01" />
                </svg>
              </div>
              <div>
                <div className="rb-info-company">{basketRow.manufacturer || '-'}</div>
                <div className="rb-info-location">{basketRow.placeOfInspection || basketRow.plantId}</div>
              </div>
            </div>
            <div className="rb-info-metrics">
              <div className="rb-info-chip">
                <span className="rb-info-chip-label">Product Type</span>
                <span className="rb-info-chip-val">{basketRow.productType}</span>
              </div>
              <div className="rb-info-chip rb-info-chip--pending">
                <span className="rb-info-chip-label">Available Pending Scrap</span>
                <span className="rb-info-chip-val">
                  {loadingPending ? 'Loading…' : (available ?? 0).toLocaleString('en-IN')}{' '}
                  <span className="rb-info-chip-unit">pcs</span>
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="rb-error">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="rb-form-grid">
            <div className="rb-field">
              <div className="rb-field-head">
                <label>Quantity Witnessed (Pieces) <span className="rb-req">*</span></label>
                {available != null && available > 0 && !saving && (
                  <button
                    type="button"
                    className="rb-field-pill-btn"
                    onClick={() => setQty(String(available))}
                    title="Fill with all available pending scrap"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Fill Max ({available.toLocaleString('en-IN')})
                  </button>
                )}
              </div>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                placeholder="Enter pieces"
                value={qty}
                onChange={e => setQty(e.target.value.replace(/[^\d]/g, ''))}
                disabled={saving}
                className="rb-input"
              />
            </div>
            <div className="rb-field">
              <label>Scrapping Date <span className="rb-req">*</span></label>
              <input
                type="date"
                value={scrappingDate}
                max={todayIso()}
                onChange={e => setScrappingDate(e.target.value)}
                disabled={saving}
                className="rb-input"
              />
            </div>
            <div className="rb-field">
              <label>Shift <span className="rb-req">*</span></label>
              <select
                value={shift}
                onChange={e => setShift(e.target.value)}
                disabled={saving}
                className="rb-input rb-select"
              >
                <option value="">Select shift</option>
                {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="rb-photo-grid">
            <PhotoPicker
              stepNumber="1"
              label={isEdit ? 'Replace before-scrapping photos (optional)' : 'Before scrapping photographs'}
              hint="Rejected pads stacked for destruction."
              photos={before}
              setPhotos={setBefore}
              onError={setError}
              disabled={saving}
            />
            <PhotoPicker
              stepNumber="2"
              label={isEdit ? 'Replace after-scrapping photos (optional)' : 'After scrapping photographs'}
              hint="Must clearly show the pads cut into pieces."
              photos={after}
              setPhotos={setAfter}
              onError={setError}
              disabled={saving}
            />
          </div>

          <div className="rb-field" style={{ minWidth: 0 }}>
            <label>Remarks</label>
            <textarea
              className="rb-textarea"
              placeholder="Add any inspector notes, observations, or disposal details (optional)..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              disabled={saving}
            />
          </div>

          {isEdit ? (
            <div className="rb-field" style={{ minWidth: 0 }}>
              <label>Reason for change <span className="rb-req">*</span> (recorded in the audit trail)</label>
              <textarea
                className="rb-textarea"
                placeholder="Provide reason for editing this record..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                disabled={saving}
              />
            </div>
          ) : (
            <label className="rb-declaration-card">
              <input
                type="checkbox"
                checked={declaration}
                onChange={e => setDeclaration(e.target.checked)}
                disabled={saving}
              />
              <div className="rb-declaration-body">
                <div className="rb-declaration-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                  IRS T-55 Witnessed Scrapping Certification
                </div>
                <p className="rb-declaration-text">{DECLARATION_TEXT}</p>
              </div>
            </label>
          )}
        </div>

        <div className="rb-modal-foot">
          <button type="button" className="rb-btn rb-btn--cancel" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="rb-btn rb-btn--primary rb-btn--submit"
            onClick={submit}
            disabled={saving || loadingPending}
          >
            {saving ? (
              'Saving…'
            ) : isEdit ? (
              'Save Changes'
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Submit Scrap Verification
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
