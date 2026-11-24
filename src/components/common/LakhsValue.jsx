import React from 'react';
import CountUp from './CountUp';

// Shows a quantity in lakhs: 65288457 → "652.88 Lakhs" (2 decimals).
// The exact number is kept in the tooltip.
const LakhsValue = ({ value }) => {
  const n = Number(value) || 0;
  const lakhs = (n / 100000).toFixed(2);
  return (
    <span className="lakhs-value" title={`${n.toLocaleString('en-IN')} Nos.`} style={{ whiteSpace: 'nowrap' }}>
      <CountUp value={lakhs} />
      <span style={{ fontSize: '0.5em', fontWeight: 700, marginLeft: '4px' }}>Lakhs</span>
    </span>
  );
};

export default LakhsValue;
