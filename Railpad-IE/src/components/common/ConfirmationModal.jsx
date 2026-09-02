import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({ isOpen, title, message, children, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'info', showCancel = true }) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-modal-overlay">
      <div className="confirmation-modal-container" style={{ maxWidth: '460px' }}>
        <div className="confirmation-modal-header">
          <div className={`confirmation-modal-icon ${type}`}>
            {type === 'warning' ? '⚠️' : type === 'danger' ? '🚫' : type === 'success' ? '✅' : '💡'}
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
