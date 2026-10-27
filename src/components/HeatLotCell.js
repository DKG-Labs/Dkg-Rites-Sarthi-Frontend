import React, { useState, useEffect } from 'react';
import { extractSynchronousData, fetchHeatOrLotDetails, normalizeCallNo } from '../services/heatLotService';

/**
 * HeatLotCell component for rendering in DataTables.
 * Displays:
 * - Heat No. for Raw Material (RM) calls
 * - Lot No. for Process & Final calls
 * - If multiple numbers exist, shows the primary number with a "+N" indicator badge and hover tooltip.
 */
const HeatLotCell = ({ call }) => {
  const callNo = normalizeCallNo(call);

  // Initialize with synchronous data if already available on call object
  const [data, setData] = useState(() => extractSynchronousData(call));
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    let isMounted = true;

    // Check synchronous data first
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

  if (loading && !data) {
    return (
      <span style={{ color: '#94a3b8', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <span
          style={{
            display: 'inline-block',
            width: '12px',
            height: '12px',
            border: '2px solid #cbd5e1',
            borderTopColor: '#0ea5e9',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}
        />
        <span>...</span>
      </span>
    );
  }

  const primary = data?.primary && data.primary !== '-' ? data.primary : '-';
  const count = data?.count || (primary !== '-' ? 1 : 0);
  const extraCount = count > 1 ? count - 1 : 0;
  const isRM = data?.type === 'RM';
  const tooltipText = data?.rawString || primary;

  if (primary === '-') {
    return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>-</span>;
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        maxWidth: '100%',
        whiteSpace: 'nowrap'
      }}
      title={`${isRM ? 'Heat No(s):' : 'Lot No(s):'} ${tooltipText}`}
    >
      <span
        style={{
          fontFamily: 'monospace, "Roboto Mono", Consolas, sans-serif',
          fontWeight: 600,
          fontSize: '13px',
          color: isRM ? '#c2410c' : '#0369a1',
          background: isRM ? '#fff7ed' : '#f0f9ff',
          padding: '2px 7px',
          borderRadius: '5px',
          border: `1px solid ${isRM ? '#ffedd5' : '#e0f2fe'}`,
          letterSpacing: '0.02em'
        }}
      >
        {primary}
      </span>

      {extraCount > 0 && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#ffffff',
            background: isRM ? '#ea580c' : '#0284c7',
            padding: '1px 6px',
            borderRadius: '10px',
            cursor: 'help',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
          title={`+${extraCount} more: ${tooltipText}`}
        >
          +{extraCount}
        </span>
      )}
    </div>
  );
};

export default HeatLotCell;
