import React, { useEffect, useRef } from 'react';
import './ConfirmDialog.css';

/**
 * Modern confirm dialog — use instead of window.confirm / window.alert.
 * tone: 'primary' (default) | 'danger' | 'warning'. Esc / backdrop = cancel, Enter = confirm.
 */
const ICONS = { primary: 'fa-circle-question', danger: 'fa-triangle-exclamation', warning: 'fa-circle-exclamation' };

export default function ConfirmDialog({
  open, title, message, details, confirmText = 'Confirm', cancelText = 'Cancel',
  tone = 'primary', busy = false, onConfirm, onCancel,
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    confirmRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onCancel?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="cfd-backdrop" onMouseDown={() => !busy && onCancel?.()}>
      <div className={`cfd ${tone}`} role="alertdialog" aria-modal="true" aria-labelledby="cfd-title"
        onMouseDown={(e) => e.stopPropagation()}>
        <div className="cfd-head">
          <span className="cfd-icon"><i className={`fa-solid ${ICONS[tone] || ICONS.primary}`} /></span>
          <h3 id="cfd-title">{title}</h3>
        </div>
        {message && <p className="cfd-msg">{message}</p>}
        {details && <div className="cfd-details">{details}</div>}
        <div className="cfd-actions">
          <button type="button" className="cfd-btn ghost" onClick={onCancel} disabled={busy}>{cancelText}</button>
          <button type="button" ref={confirmRef} className={`cfd-btn ${tone}`} onClick={onConfirm} disabled={busy}>
            {busy ? 'Please wait…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
