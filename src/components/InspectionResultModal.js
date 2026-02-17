/**
 * Inspection Result Modal Component
 * Displays professional success/result notifications for inspection actions
 * (Pause, Finish, Save Draft)
 *
 * Features:
 * - Success indicator with checkmark icon
 * - Inspection call number display (prominently shown)
 * - Action-specific messaging
 * - Professional styling with action-specific color scheme
 * - Solid white background with proper contrast
 * - Auto-close or manual close with callback
 */

import React from 'react';

const InspectionResultModal = ({
  isOpen,
  onClose,
  actionType = 'pause', // 'pause', 'finish', 'draft'
  callNumber,
  message,
  additionalInfo
}) => {
  if (!isOpen) return null;

  // Determine styling and messaging based on action type
  const getActionConfig = () => {
    switch (actionType) {
      case 'finish':
        return {
          title: '✅ Inspection Completed',
          icon: '✓',
          color: '#10b981',
          headerBg: '#f0fdf4',
          borderColor: '#10b981'
        };
      case 'pause':
        return {
          title: '⏸️ Inspection Paused',
          icon: '⏸',
          color: '#f59e0b',
          headerBg: '#fffbeb',
          borderColor: '#f59e0b'
        };
      case 'draft':
        return {
          title: '💾 Draft Saved',
          icon: '✓',
          color: '#3b82f6',
          headerBg: '#eff6ff',
          borderColor: '#3b82f6'
        };
      case 'error':
        return {
          title: '❌ Error',
          icon: '✕',
          color: '#ef4444',
          headerBg: '#fef2f2',
          borderColor: '#ef4444'
        };
      default:
        return {
          title: '✅ Success',
          icon: '✓',
          color: '#10b981',
          headerBg: '#f0fdf4',
          borderColor: '#10b981'
        };
    }
  };

  const config = getActionConfig();

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
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
            {config.title}
          </h2>
          <button
            className="modal-close"
            onClick={onClose}
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
            background: '#ffffff',
            flex: 1
          }}
        >
          {/* Success Message */}
          <p
            style={{
              fontSize: '16px',
              color: '#1f2937',
              marginBottom: '20px',
              lineHeight: '1.6'
            }}
          >
            {message || getDefaultMessage(actionType)}
          </p>

          {/* Inspection Call Number - Prominently Displayed */}
          {callNumber && (
            <div
              style={{
                background: '#f9fafb',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: `2px solid ${config.borderColor}`
              }}
            >
              <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '12px', fontWeight: '500' }}>
                Inspection Call Number
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '20px',
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

          {/* Additional Info */}
          {additionalInfo && (
            <div
              style={{
                background: '#f9fafb',
                padding: '14px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#4b5563',
                lineHeight: '1.6',
                border: '1px solid #e5e7eb'
              }}
            >
              {additionalInfo}
            </div>
          )}

          {/* Resume Info for Pause */}
          {actionType === 'pause' && (
            <p
              style={{
                fontSize: '13px',
                color: '#6b7280',
                fontStyle: 'italic',
                margin: '16px 0 0 0'
              }}
            >
              You can resume this inspection from the IE Landing Page
            </p>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="modal-footer"
          style={{
            borderTop: '1px solid #e5e7eb',
            background: '#ffffff',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <button
            className="btn btn-primary"
            onClick={onClose}
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to get default message based on action type
const getDefaultMessage = (actionType) => {
  switch (actionType) {
    case 'finish':
      return 'Raw Material Inspection has been completed successfully!';
    case 'pause':
      return 'Inspection has been paused successfully.';
    case 'draft':
      return 'Draft has been saved successfully.';
    case 'error':
      return 'An error occurred. Please try again.';
    default:
      return 'Operation completed successfully!';
  }
};

export default InspectionResultModal;

