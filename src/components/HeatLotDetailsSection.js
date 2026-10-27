import React, { useState, useEffect } from 'react';
import { extractSynchronousData, fetchHeatOrLotDetails, normalizeCallNo, determineCallType } from '../services/heatLotService';

/**
 * HeatLotDetailsSection: Renders directly as a field inside the top summary grid
 * of the "VIEW ACTIONS" modal (for Pending, IC Issuance, Completed, and Closed calls).
 * 
 * Displays:
 * - Heat Number(s) for Raw Material (RM) calls
 * - Lot Number(s) for Process and Final calls
 * - Clean badges if single or multiple numbers exist
 */
const HeatLotDetailsSection = ({ call }) => {
  const callNo = normalizeCallNo(call);
  const callType = determineCallType(call);
  const isRM = callType === 'RM';
  const label = isRM ? 'Heat Number' : 'Lot Number';
  const pluralLabel = isRM ? 'Heat Numbers' : 'Lot Numbers';

  const [data, setData] = useState(() => extractSynchronousData(call));
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    let isMounted = true;

    const syncData = extractSynchronousData(call);
    if (syncData && syncData.items && syncData.items.length > 0) {
      setData(syncData);
      setLoading(false);
      return;
    }

    if (!callNo) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchHeatOrLotDetails(call)
      .then((res) => {
        if (isMounted && res) {
          setData(res);
        }
      })
      .catch(() => {
        if (isMounted) {
          setData(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [callNo, call]);

  if (!call) return null;

  const items = data?.items || [];
  const count = items.length;

  return (
    <div>
      <label
        style={{
          fontSize: '11px',
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: '700',
          marginBottom: '4px',
          display: 'block'
        }}
      >
        {count > 1 ? `${pluralLabel} (${count})` : label}
      </label>

      {/* Loading state */}
      {loading && !data && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '13px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              border: '2px solid #cbd5e1',
              borderTopColor: isRM ? '#ea580c' : '#0284c7',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }}
          />
          <span>Loading...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && count === 0 && (
        <div style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>-</div>
      )}

      {/* Single Number: Clean Badge */}
      {!loading && count === 1 && (
        <div
          style={{
            display: 'inline-block',
            background: isRM ? '#fff7ed' : '#f0f9ff',
            color: isRM ? '#c2410c' : '#0284c7',
            border: `1.5px solid ${isRM ? '#fed7aa' : '#bae6fd'}`,
            padding: '3px 10px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '700',
            fontFamily: 'monospace, Consolas, sans-serif',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}
        >
          {items[0].number}
        </div>
      )}

      {/* Multiple Numbers: Wrap Badges */}
      {!loading && count > 1 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            maxHeight: '80px',
            overflowY: 'auto'
          }}
        >
          {items.map((item, idx) => (
            <span
              key={`${item.number}-${idx}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: isRM ? '#fff7ed' : '#f0f9ff',
                color: isRM ? '#c2410c' : '#0284c7',
                border: `1.5px solid ${isRM ? '#fed7aa' : '#bae6fd'}`,
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '700',
                fontFamily: 'monospace, Consolas, sans-serif'
              }}
              title={`${label} ${idx + 1}`}
            >
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>#{idx + 1}</span>
              {item.number}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default HeatLotDetailsSection;
