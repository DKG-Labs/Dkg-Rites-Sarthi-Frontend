/**
 * Inspection Result Modal Component
 * Displays a premium, handcrafted, modern success notification card for inspection actions
 * (Pause, Finish, Save Draft, Error)
 *
 * Design features:
 * - Glassmorphism dark background blur overlay
 * - Handcrafted double-ring status badges with gradient icons
 * - Clean visual hierarchy (removed busy container boxes for metadata)
 * - Monospace call number card with copy-to-clipboard functionality
 * - Sleek, low-contrast timestamp display with subtle inline icon
 * - Premium primary button with arrow hover micro-animation
 */

import React, { useState } from 'react';

const InspectionResultModal = ({
  isOpen,
  onClose,
  actionType = 'pause', // 'pause', 'finish', 'draft', 'error'
  callNumber,
  message,
  additionalInfo
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (callNumber) {
      navigator.clipboard.writeText(callNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Determine styling and messaging based on action type
  const getActionConfig = () => {
    switch (actionType) {
      case 'finish':
        return {
          title: 'Inspection Completed',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <polyline points="9 11 11 13 15 9"></polyline>
            </svg>
          ),
          colorStart: '#10b981',
          colorEnd: '#059669',
          rgb: '16, 185, 129',
          bgGradient: 'linear-gradient(135deg, #f0fdf4 0%, #e6fcf5 100%)',
          cardGradient: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          textColor: '#0f172a',
          brandColor: '#10b981',
          shadowColor: 'rgba(16, 185, 129, 0.22)',
          badgeBg: '#f0fdf4',
          badgeBorder: 'rgba(16, 185, 129, 0.2)',
          buttonText: 'Finish & Return'
        };
      case 'pause':
        return {
          title: 'Inspection Paused',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="10" y1="15" x2="10" y2="9"></line>
              <line x1="14" y1="15" x2="14" y2="9"></line>
            </svg>
          ),
          colorStart: '#f59e0b',
          colorEnd: '#d97706',
          rgb: '245, 158, 11',
          bgGradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          cardGradient: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          textColor: '#0f172a',
          brandColor: '#f59e0b',
          shadowColor: 'rgba(245, 158, 11, 0.22)',
          badgeBg: '#fffbeb',
          badgeBorder: 'rgba(245, 158, 11, 0.2)',
          buttonText: 'Exit to Dashboard'
        };
      case 'draft':
        return {
          title: 'Draft Saved Successfully',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          ),
          colorStart: '#3b82f6',
          colorEnd: '#2563eb',
          rgb: '59, 130, 246',
          bgGradient: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)',
          cardGradient: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          textColor: '#0f172a',
          brandColor: '#3b82f6',
          shadowColor: 'rgba(59, 130, 246, 0.22)',
          badgeBg: '#eff6ff',
          badgeBorder: 'rgba(59, 130, 246, 0.2)',
          buttonText: 'Continue Inspection'
        };
      case 'error':
        return {
          title: 'System Alert',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          ),
          colorStart: '#ef4444',
          colorEnd: '#dc2626',
          rgb: '239, 68, 68',
          bgGradient: 'linear-gradient(135deg, #fef2f2 0%, #ffe4e6 100%)',
          cardGradient: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          textColor: '#0f172a',
          brandColor: '#ef4444',
          shadowColor: 'rgba(239, 68, 68, 0.22)',
          badgeBg: '#fef2f2',
          badgeBorder: 'rgba(239, 68, 68, 0.2)',
          buttonText: 'Dismiss'
        };
      default:
        return {
          title: 'Success',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ),
          colorStart: '#10b981',
          colorEnd: '#059669',
          rgb: '16, 185, 129',
          bgGradient: 'linear-gradient(135deg, #f0fdf4 0%, #e6fcf5 100%)',
          cardGradient: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          textColor: '#0f172a',
          brandColor: '#10b981',
          shadowColor: 'rgba(16, 185, 129, 0.22)',
          badgeBg: '#f0fdf4',
          badgeBorder: 'rgba(16, 185, 129, 0.2)',
          buttonText: 'Close'
        };
    }
  };

  const config = getActionConfig();

  const getDefaultMessage = (type) => {
    switch (type) {
      case 'finish':
        return 'All inspection data has been compiled and submitted to the backend. The inspection is now marked as Completed.';
      case 'pause':
        return 'Your progress has been saved to the backend database. You can resume later.';
      case 'draft':
        return 'All active entries and submodules have been saved as a draft. You can continue working without losing any details.';
      case 'error':
        return 'Something went wrong while processing your request. Please try again.';
      default:
        return 'Your action has been completed successfully!';
    }
  };

  // Extract pure timestamp from additionalInfo if it matches "Saved at hh:mm:ss AM/PM"
  const getFormattedTime = () => {
    if (!additionalInfo) return new Date().toLocaleTimeString();
    return additionalInfo.replace(/Saved\s+at\s+/i, '');
  };

  const styleTag = (
    <style>{`
      @keyframes modalOverlayFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes modalContentSlideIn {
        from { opacity: 0; transform: scale(0.96) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes iconBadgePulse {
        0% { box-shadow: 0 0 0 0 rgba(${config.rgb}, 0.2); }
        70% { box-shadow: 0 0 0 8px rgba(${config.rgb}, 0); }
        100% { box-shadow: 0 0 0 0 rgba(${config.rgb}, 0); }
      }
      .modal-overlay-animated {
        animation: modalOverlayFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .modal-content-animated {
        animation: modalContentSlideIn 0.28s cubic-bezier(0.34, 1.25, 0.64, 1) forwards;
      }
      .icon-badge-animated {
        animation: iconBadgePulse 2.2s infinite;
      }
      .btn-modern-primary {
        background: linear-gradient(135deg, ${config.colorStart}, ${config.colorEnd});
        box-shadow: 0 4px 12px ${config.shadowColor};
        transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        display: inline-flex;
        align-items: center;
        justifyContent: center;
        gap: 6px;
      }
      .btn-modern-primary:hover {
        transform: translateY(-1.5px);
        box-shadow: 0 6px 16px ${config.shadowColor};
        filter: brightness(1.02);
      }
      .btn-modern-primary:hover .btn-arrow {
        transform: translateX(3px);
      }
      .btn-modern-primary:active {
        transform: translateY(0);
        box-shadow: 0 3px 8px ${config.shadowColor};
      }
      .btn-arrow {
        transition: transform 0.2s ease;
      }
      .btn-copy {
        transition: all 0.2s ease;
      }
      .btn-copy:hover {
        background-color: #f1f5f9 !important;
        color: ${config.brandColor} !important;
        transform: scale(1.05);
      }
      .close-icon-hover {
        transition: all 0.2s ease;
      }
      .close-icon-hover:hover {
        background-color: #f1f5f9;
        color: #334155 !important;
        transform: rotate(90deg);
      }
    `}</style>
  );

  return (
    <div
      className="modal-overlay modal-overlay-animated"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        fontFamily: '"Outfit", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {styleTag}
      <div
        className="modal-content modal-content-animated"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '380px',
          width: '100%',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 20px 40px -8px rgba(15, 23, 42, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          padding: '32px 24px 24px 24px',
          border: '1px solid rgba(241, 245, 249, 0.8)'
        }}
      >
        {/* Floating Close Button */}
        <button
          className="close-icon-hover"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            padding: 0
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Modal Center Header / Handcrafted Badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '16px' }}>
          <div
            className="icon-badge-animated"
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: config.badgeBg,
              color: config.brandColor,
              border: `1px solid ${config.badgeBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}
          >
            {config.icon}
          </div>
          <h2
            style={{
              color: '#0f172a',
              margin: '0 0 6px 0',
              fontSize: '19px',
              fontWeight: '700',
              letterSpacing: '-0.3px'
            }}
          >
            {config.title}
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: '#64748b',
              margin: 0,
              lineHeight: '1.45',
              fontWeight: '400'
            }}
          >
            {message || getDefaultMessage(actionType)}
          </p>
        </div>

        {/* Prominent Call Number Card */}
        {callNumber && (
          <div
            style={{
              background: config.cardGradient,
              padding: '12px 16px',
              borderRadius: '16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid #e2e8f0'
            }}
          >
            <div>
              <p style={{ margin: '0 0 2px 0', color: '#64748b', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Inspection Call Reference
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '17px',
                  fontWeight: '800',
                  color: '#0f172a',
                  fontFamily: 'monospace',
                  letterSpacing: '0.2px'
                }}
              >
                {callNumber}
              </p>
            </div>
            <button
              className="btn-copy"
              onClick={handleCopy}
              title="Copy Reference"
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#64748b',
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
            >
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              )}
            </button>
          </div>
        )}

        {/* Clean, Non-boxy Clock Timestamp & Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {/* Timestamp Sub-element */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#64748b', fontSize: '12px', fontWeight: '500' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Saved at {getFormattedTime()}</span>
          </div>

          {/* Pause Info */}
          {actionType === 'pause' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: config.textColor, fontSize: '12px', fontWeight: '500', textAlign: 'center' }}>
              💡 Resume anytime from the landing page.
            </div>
          )}

          {/* Optional Additional Text details */}
          {additionalInfo && !additionalInfo.startsWith('Saved') && (
            <div style={{ padding: '0 8px', fontSize: '12px', color: '#64748b', lineHeight: '1.4', textAlign: 'center', fontStyle: 'italic' }}>
              {additionalInfo}
            </div>
          )}
        </div>

        {/* Close Button / Bottom Actions */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            className="btn-modern-primary"
            onClick={onClose}
            style={{
              color: 'white',
              width: '100%',
              padding: '11px 20px',
              fontSize: '14px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '14px',
              cursor: 'pointer'
            }}
          >
            <span>{config.buttonText}</span>
            <svg className="btn-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InspectionResultModal;
