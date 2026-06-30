/* eslint-disable */
import React, { useState } from 'react';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import _ from 'lodash';

const capitalizeCamelCase = (str) => {
  const words = _.words(_.camelCase(str));
  const capitalizedWords = words.map(word => _.capitalize(word));
  return capitalizedWords.join(' ');
};

const GeneralInfo = ({ data, children, minimizable = false, defaultMinimized = false }) => {
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);

  const toggleMinimize = () => setIsMinimized(!isMinimized);

  return (
    <div
      className="dkg-premium-card"
      style={{
        padding: '0',
        marginBottom: '1rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1.25rem',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          cursor: minimizable ? 'pointer' : 'default',
          borderLeft: `4px solid ${minimizable ? '#21808d' : '#21808d'}`,
          borderRadius: '12px 12px 0 0',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (minimizable) e.currentTarget.style.background = '#f8fafc';
        }}
        onMouseLeave={(e) => {
          if (minimizable) e.currentTarget.style.background = '#ffffff';
        }}
        onClick={minimizable ? toggleMinimize : undefined}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '3px', height: '16px', background: '#21808d', borderRadius: '4px', display: 'none' }} />
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 800,
              color: '#13343b',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Shift & Duty Information
          </span>
        </div>
        {minimizable && (
          <div style={{ 
            color: '#21808d', 
            fontSize: '0.75rem',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: '#21808d10'
          }}>
            {isMinimized ? <DownOutlined /> : <UpOutlined />}
          </div>
        )}
      </div>

      {/* Content Area */}
      {!isMinimized && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '2rem',
            padding: '1.25rem 1.5rem',
            backgroundColor: '#ffffff',
            borderRadius: '0 0 12px 12px',
          }}
        >
          {data && Object.keys(data).length > 0 ? (
            Object.keys(data)
              .filter(key => !['loading', 'error'].includes(key))
              .map((key) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    minWidth: '120px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#64748b',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {capitalizeCamelCase(key)}
                  </span>
                  <span
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      color: '#13343b',
                    }}
                  >
                    {data[key]?.toString() || '—'}
                  </span>
                </div>
              ))
          ) : (
            <div style={{ padding: '1rem', color: '#94a3b8', fontStyle: 'italic' }}>
              Waiting for duty details...
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

export default GeneralInfo;
