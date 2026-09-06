import React from 'react';
import { useVersionCheck } from '../../hooks/useVersionCheck';

/**
 * Accessible, non-intrusive floating update banner.
 * Notifies the user when a newer version has been deployed.
 */
const VersionUpdateBanner = () => {
  const { updateAvailable, latestVersion, currentVersion, dismissUpdate } = useVersionCheck();

  if (!updateAvailable) {
    return null;
  }

  const handleUpdate = () => {
    // Normal page reload to fetch new HTML and latest hashed bundles
    window.location.reload();
  };

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Application Update Notice"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 999999,
        maxWidth: '420px',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        borderRadius: '12px',
        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        animation: 'slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div
          aria-hidden="true"
          style={{
            backgroundColor: '#0d9488',
            color: '#ffffff',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            flexShrink: 0
          }}
        >
          🚀
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#ffffff', marginBottom: '2px' }}>
            New Sarthi Update Available
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.4 }}>
            Version <strong style={{ color: '#5eead4' }}>{latestVersion || 'latest'}</strong> is ready.
            {currentVersion && (
              <span style={{ fontSize: '11px', display: 'block', color: '#64748b', marginTop: '2px' }}>
                Current: v{currentVersion}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
        <button
          type="button"
          onClick={dismissUpdate}
          style={{
            backgroundColor: 'transparent',
            color: '#94a3b8',
            border: '1px solid #334155',
            padding: '7px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1e293b';
            e.currentTarget.style.color = '#f1f5f9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          Dismiss
        </button>

        <button
          type="button"
          onClick={handleUpdate}
          style={{
            backgroundColor: '#0d9488',
            color: '#ffffff',
            border: 'none',
            padding: '7px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(13, 148, 136, 0.4)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0f766e';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#0d9488';
          }}
        >
          Update Now
        </button>
      </div>
    </aside>
  );
};

export default VersionUpdateBanner;
