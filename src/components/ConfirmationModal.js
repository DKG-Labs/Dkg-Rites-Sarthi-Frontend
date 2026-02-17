/**
 * Confirmation Modal Component
 * Displays professional confirmation dialogs for critical actions
 * Replaces browser window.confirm() with a styled modal
 *
 * Features:
 * - Warning icon and styling
 * - Custom title and message
 * - OK and Cancel buttons
 * - Callback functions for both actions
 * - Professional styling with warning color scheme
 * - Solid white background with proper contrast
 */

import React from 'react';

const ConfirmationModal = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'OK',
  cancelText = 'Cancel',
  isDangerous = false, // If true, use red color scheme
  callNumber = null // Optional: inspection call number to display
}) => {
  if (!isOpen) return null;

  const config = isDangerous
    ? {
        color: '#ef4444',
        headerBg: '#fef2f2',
        borderColor: '#ef4444',
        icon: '⚠️'
      }
    : {
        color: '#f59e0b',
        headerBg: '#fffbeb',
        borderColor: '#f59e0b',
        icon: '❓'
      };

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '600px',
          width: '90%',
          border: `2px solid ${config.borderColor}`,
          background: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div
          className="modal-header"
          style={{
            borderBottom: `2px solid ${config.borderColor}`,
            background: config.headerBg,
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h2
            className="modal-title"
            style={{
              color: config.color,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: 0,
              fontSize: '18px',
              fontWeight: '600'
            }}
          >
            <span style={{ fontSize: '24px' }}>{config.icon}</span>
            {title}
          </h2>
          <button
            className="modal-close"
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: config.color,
              fontSize: '28px',
              cursor: 'pointer',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div
          className="modal-body"
          style={{
            textAlign: 'center',
            padding: '20px 24px',
            fontSize: '16px',
            color: '#1f2937',
            lineHeight: '1.6',
            background: '#ffffff',
            flex: 1
          }}
        >
          {/* Message */}
          <p style={{ margin: '0 0 20px 0' }}>
            {message}
          </p>

          {/* Call Number Display */}
          {callNumber && (
            <div
              style={{
                background: '#f9fafb',
                padding: '14px',
                borderRadius: '8px',
                marginTop: '16px',
                border: `1px solid ${config.borderColor}`
              }}
            >
              <p style={{ margin: '0 0 6px 0', color: '#6b7280', fontSize: '12px', fontWeight: '500' }}>
                Inspection Call Number
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '700',
                  color: config.color,
                  fontFamily: 'monospace',
                  letterSpacing: '0.5px'
                }}
              >
                {callNumber}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="modal-footer"
          style={{
            borderTop: `1px solid #e5e7eb`,
            background: '#ffffff',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            style={{
              padding: '10px 32px',
              fontSize: '14px',
              fontWeight: '600',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {cancelText}
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            style={{
              background: config.color,
              borderColor: config.color,
              color: 'white',
              padding: '10px 32px',
              fontSize: '14px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

