/* eslint-disable */
import React from 'react';

/**
 * DKG_MainCard — Main dashboard card (rectangular)
 * Matches Sleeper Vendor's main module card design language.
 */
const MainCard = ({ title, subtitle, count, icon, onClick, isActive = false, hasBackground = false, className = '' }) => {
  return (
    <div
      onClick={onClick}
      className={`dkg-main-card ${className} ${isActive ? 'active' : ''}`}
      style={{
        background: isActive ? '#f0f7ff' : '#ffffff',
        border: `1px solid ${isActive ? '#3b82f6' : '#e5e7eb'}`,
        borderRadius: '10px !important',
        padding: '10px 14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '85px',
        width: '100%',
        boxSizing: 'border-box',
        boxShadow: isActive ? '0 0 0 1px #3b82f6' : 'none',
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        flex: 1,
        minWidth: 0
      }}>
        <span style={{
          fontWeight: '700',
          fontSize: '13px',
          color: isActive ? '#1e40af' : '#111827',
          lineHeight: '1.2',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {title}
        </span>
        <span style={{
          fontSize: '10px',
          color: isActive ? '#3b82f6' : '#6b7280',
          fontWeight: '500',
          lineHeight: '1.1',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {subtitle}
        </span>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: '6px'
      }}>
        {count !== undefined ? (
          <span style={{
            fontSize: '28px',
            fontWeight: '800',
            color: isActive ? '#2563eb' : '#000000',
            lineHeight: '1'
          }}>
            {count}
          </span>
        ) : (
          <div style={{
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: hasBackground ? '#3b82f6' : 'transparent',
            padding: hasBackground ? '6px' : '0',
            borderRadius: '4px',
            color: hasBackground ? '#ffffff' : (isActive ? '#3b82f6' : '#64748b')
          }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default MainCard;
