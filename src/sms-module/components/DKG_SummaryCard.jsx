/* eslint-disable */
import React from 'react';

const DKG_SummaryCard = ({ label, value, color, highlight }) => {
  return (
    <div 
      className={`summary-card ${highlight ? 'highlight' : ''}`}
      style={color ? { borderLeftColor: color } : {}}
    >
      <span className="label">{label}</span>
      <span className="value" style={color ? { color: color } : {}}>
        {value}
      </span>
    </div>
  );
};

export default DKG_SummaryCard;
