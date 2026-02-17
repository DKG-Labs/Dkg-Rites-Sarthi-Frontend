import React from 'react';

// A compact, reusable line selector bar matching the design shared by the user
// Props:
// - selectedLines: string[] like ["Line-1", "Line-2"]
// - activeLine: string
// - onChange: (line: string) => void
// - mapping: object mapping internal IDs to display labels
const ProcessLineToggle = ({ selectedLines = [], activeLine, onChange, mapping = null }) => {
  if (!selectedLines || selectedLines.length === 0) return null;
  return (
    <div
      className="process-line-toggle"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 'var(--space-16)',
        background: '#fef3e2',
        border: '1px solid #f59e0b',
        borderRadius: 8,
        padding: 8,
      }}
    >
      {selectedLines.map((line) => (
        <button
          key={line}
          type="button"
          onClick={() => onChange && onChange(line)}
          style={{
            flex: '1 1 140px',
            minWidth: 120,
            padding: '10px 12px',
            fontSize: 14,
            fontWeight: activeLine === line ? 600 : 400,
            color: activeLine === line ? '#fff' : '#374151',
            backgroundColor: activeLine === line ? '#0d9488' : 'transparent',
            border: activeLine === line ? '2px solid #0d9488' : '2px solid transparent',
            borderRadius: 6,
            cursor: 'pointer',
          }}
          aria-pressed={activeLine === line}
        >
          {mapping && mapping[line] ? mapping[line].displayLabel : line}
        </button>
      ))}
    </div>
  );
};

export default ProcessLineToggle;

