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

  const entries = data && typeof data === 'object'
    ? Object.keys(data).filter(key => !['loading', 'error', 'dutyId'].includes(key) && data[key] !== null && data[key] !== undefined && data[key] !== '')
    : [];

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderLeft: '4px solid #21808d',
        borderRadius: '10px',
        padding: '8px 14px',
        marginBottom: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        width: '100%'
      }}
    >
      {/* Desktop / Tablet View: Streamlined Single Line */}
      <div className="hidden sm:flex items-center justify-between gap-3 min-h-[28px] flex-wrap">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#21808d',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: 'rgba(33, 128, 141, 0.08)',
              padding: '3px 8px',
              borderRadius: '6px'
            }}
          >
            Shift Info
          </span>
        </div>

        <div className="flex items-center justify-evenly flex-wrap gap-x-4 gap-y-1 flex-1">
          {entries.length > 0 ? (
            entries.map((key) => (
              <div
                key={key}
                className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap"
              >
                <span className="text-gray-500 font-semibold uppercase text-[11px]">
                  {capitalizeCamelCase(key)}:
                </span>
                <span className="text-slate-900 font-bold text-xs">
                  {data[key]?.toString() || '—'}
                </span>
              </div>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">
              No duty details available
            </span>
          )}
        </div>

        {minimizable && (
          <div
            onClick={toggleMinimize}
            style={{
              color: '#21808d',
              fontSize: '0.75rem',
              width: '22px',
              height: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: '#21808d10',
              cursor: 'pointer'
            }}
          >
            {isMinimized ? <DownOutlined /> : <UpOutlined />}
          </div>
        )}
      </div>

      {/* Mobile View: Clean Structured Grid */}
      <div className="flex sm:hidden flex-col gap-2">
        <div className="flex items-center justify-between">
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              color: '#21808d',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: 'rgba(33, 128, 141, 0.08)',
              padding: '2px 8px',
              borderRadius: '5px'
            }}
          >
            Shift & Duty Information
          </span>

          {minimizable && (
            <div
              onClick={toggleMinimize}
              style={{
                color: '#21808d',
                fontSize: '0.7rem',
                cursor: 'pointer'
              }}
            >
              {isMinimized ? <DownOutlined /> : <UpOutlined />}
            </div>
          )}
        </div>

        {!isMinimized && (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
            {entries.length > 0 ? (
              entries.map((key) => (
                <div
                  key={key}
                  className="flex flex-col bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100"
                >
                  <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                    {capitalizeCamelCase(key)}
                  </span>
                  <span className="text-[12px] text-slate-900 font-bold leading-tight mt-0.5">
                    {data[key]?.toString() || '—'}
                  </span>
                </div>
              ))
            ) : (
              <span className="col-span-2 text-xs text-slate-400 italic py-1">
                No duty details available
              </span>
            )}
          </div>
        )}
      </div>

      {children && !isMinimized && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default GeneralInfo;
