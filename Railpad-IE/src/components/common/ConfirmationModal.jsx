import React from 'react';
import './ConfirmationModal.css';

const renderModalIcon = (type) => {
  switch (type) {
    case 'warning':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'danger':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    case 'success':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case 'info':
    default:
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
  }
};

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  children,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  showCancel = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-modal-overlay">
      <div className="confirmation-modal-container" style={{ maxWidth: '480px' }}>
        <div className="confirmation-modal-header">
          <div className={`confirmation-modal-icon ${type}`}>
            {renderModalIcon(type)}
          </div>
          <h3>{title}</h3>
        </div>
        <div className="confirmation-modal-body">
          {children ? children : (typeof message === 'string' ? <p style={{ whiteSpace: 'pre-line' }}>{message}</p> : message)}
        </div>
        <div className="confirmation-modal-footer" style={{ gridTemplateColumns: showCancel ? '1fr 1fr' : '1fr' }}>
          {showCancel && <button className="btn-cancel" onClick={onCancel}>{cancelText}</button>}
          <button className={`btn-confirm ${type}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
