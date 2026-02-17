import { Box } from '@mui/material';

// Chemical element fields with full names
const LADLE_FIELDS = [
  { key: 'percentC', label: '% C (Carbon)', shortLabel: '% C' },
  { key: 'percentSi', label: '% Si (Silicon)', shortLabel: '% Si' },
  { key: 'percentMn', label: '% Mn (Manganese)', shortLabel: '% Mn' },
  { key: 'percentS', label: '% S (Sulphur)', shortLabel: '% S' },
  { key: 'percentP', label: '% P (Phosphorus)', shortLabel: '% P' },
];

// Specification limits for ladle analysis validation
const LADLE_SPEC_LIMITS = {
  percentC: { min: 0.5, max: 0.6 },
  percentSi: { min: 1.5, max: 2.0 },
  percentMn: { min: 0.8, max: 1.0 },
  percentP: { min: 0, max: 0.030 },
  percentS: { min: 0, max: 0.030 },
};

// Format spec limits for display
const getSpecDisplay = (field) => {
  const limits = LADLE_SPEC_LIMITS[field];
  if (!limits) return '-';
  if (limits.min === 0) {
    return `≤ ${limits.max}`;
  }
  return `${limits.min} - ${limits.max}`;
};

/**
 * Get validation status for a value against spec limits
 * Returns 'pass' (green), 'fail' (red), or '' (no color)
 */
const getValueStatus = (field, productValue) => {
  if (productValue === '' || productValue === null || productValue === undefined) return '';

  const numProduct = parseFloat(productValue);
  if (isNaN(numProduct)) return '';

  const limits = LADLE_SPEC_LIMITS[field];
  if (!limits) return '';

  // Check if value is within acceptable range
  if (numProduct >= limits.min && numProduct <= limits.max) {
    return 'pass';
  }
  return 'fail';
};

const ladleStyles = `
  .ladle-card {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 1.75rem;
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
    margin-bottom: 1.5rem;
  }

  .ladle-card__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1.25rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .ladle-card__eyebrow {
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 0.35rem;
    font-weight: 500;
  }

  .ladle-card__heat {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    background: linear-gradient(90deg, #1e40af, #3b82f6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .ladle-section-title {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.35rem;
  }

  .ladle-section-subtitle {
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 1.25rem;
  }

  /* Table wrapper for horizontal scroll on mobile */
  .chem-table-wrapper {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Chemical Analysis Table Layout */
  .chem-analysis-table {
    width: 100%;
    min-width: 600px;
    border-collapse: separate;
    border-spacing: 0 8px;
    margin-top: 0.75rem;
  }

  .chem-analysis-table th {
    font-size: 0.8rem;
    font-weight: 600;
    color: #475569;
    text-align: center;
    padding: 0.75rem 0.75rem;
    background: transparent;
    white-space: nowrap;
  }

  .chem-analysis-table th:first-child {
    text-align: left;
    width: 140px;
    padding-left: 0;
  }

  .chem-analysis-table tbody tr {
    background: #f8fafc;
    border-radius: 12px;
  }

  .chem-analysis-table tbody tr:first-child {
    background: linear-gradient(90deg, #eff6ff, #f0f9ff);
  }

  .chem-analysis-table tbody tr:first-child td:first-child {
    color: #1e40af;
  }

  .chem-analysis-table tbody tr:last-child {
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .chem-analysis-table tbody tr:last-child td:first-child {
    color: #059669;
  }

  .chem-analysis-table td {
    padding: 0.75rem 0.5rem;
    text-align: center;
    vertical-align: middle;
  }

  .chem-analysis-table td:first-child {
    text-align: left;
    font-weight: 600;
    font-size: 0.9rem;
    color: #374151;
    padding-left: 1rem;
    border-radius: 12px 0 0 12px;
    white-space: nowrap;
  }

  .chem-analysis-table td:last-child {
    border-radius: 0 12px 12px 0;
  }

  .chem-analysis-table .ladle-value-cell {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    border-radius: 10px;
    padding: 0.65rem 1rem;
    font-weight: 700;
    font-size: 1rem;
    color: #1e40af;
    min-width: 90px;
    display: inline-block;
    box-shadow: inset 0 1px 2px rgba(30, 64, 175, 0.1);
  }

  .chem-analysis-table .product-input {
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    padding: 0.65rem 0.75rem;
    font-size: 0.95rem;
    font-weight: 500;
    color: #1e293b;
    background: #fff;
    width: 100%;
    max-width: 120px;
    text-align: center;
    transition: all 0.2s ease;
    outline: none;
  }

  .chem-analysis-table .product-input::placeholder {
    color: #94a3b8;
    font-size: 0.85rem;
    font-weight: 400;
  }

  .chem-analysis-table .product-input:hover {
    border-color: #94a3b8;
  }

  .chem-analysis-table .product-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
  }

  .chem-analysis-table .product-input.pass {
    border-color: #22c55e;
    background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    color: #166534;
  }

  .chem-analysis-table .product-input.fail {
    border-color: #ef4444;
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    color: #991b1b;
  }

  /* Mobile Cards Layout - Transform table to stacked cards */
  .chem-mobile-cards {
    display: none;
  }

  /* Tablet responsive - 1024px */
  @media (max-width: 1024px) {
    .ladle-card {
      padding: 1.5rem;
    }

    .chem-analysis-table .ladle-value-cell,
    .chem-analysis-table .product-input {
      min-width: 80px;
      max-width: 100px;
    }
  }

  /* Mobile responsive - 768px */
  @media (max-width: 768px) {
    .ladle-card {
      padding: 1rem;
      border-radius: 12px;
    }

    .ladle-card__header {
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
    }

    .ladle-card__heat {
      font-size: 1.1rem;
    }

    .ladle-section-title {
      font-size: 0.95rem;
    }

    .ladle-section-subtitle {
      font-size: 0.8rem;
      margin-bottom: 1rem;
    }

    /* Hide table on mobile, show card layout */
    .chem-table-wrapper {
      display: none;
    }

    .chem-mobile-cards {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .chem-mobile-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 1rem;
      border: 1px solid #e2e8f0;
    }

    .chem-mobile-card__header {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .chem-mobile-card__row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
    }

    .chem-mobile-card__row:not(:last-child) {
      border-bottom: 1px dashed #e2e8f0;
    }

    .chem-mobile-card__label {
      font-size: 0.85rem;
      font-weight: 500;
      color: #475569;
    }

    .chem-mobile-card__ladle {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      font-weight: 700;
      font-size: 0.9rem;
      color: #1e40af;
      min-width: 70px;
      text-align: center;
    }

    .chem-mobile-card__input {
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      font-size: 0.9rem;
      font-weight: 500;
      color: #1e293b;
      background: #fff;
      width: 100px;
      text-align: center;
      outline: none;
    }

    .chem-mobile-card__input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
    }

    .chem-mobile-card__input.pass {
      border-color: #22c55e;
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      color: #166534;
    }

    .chem-mobile-card__input.fail {
      border-color: #ef4444;
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      color: #991b1b;
    }
  }

  /* Small mobile - 480px */
  @media (max-width: 480px) {
    .ladle-card {
      padding: 0.85rem;
      margin-bottom: 1rem;
    }

    .ladle-card__eyebrow {
      font-size: 0.65rem;
    }

    .ladle-card__heat {
      font-size: 1rem;
    }

    .ladle-section-title {
      font-size: 0.9rem;
    }

    .ladle-section-subtitle {
      font-size: 0.75rem;
    }

    .chem-mobile-card {
      padding: 0.85rem;
    }

    .chem-mobile-card__header {
      font-size: 0.7rem;
    }

    .chem-mobile-card__label {
      font-size: 0.8rem;
    }

    .chem-mobile-card__ladle,
    .chem-mobile-card__input {
      font-size: 0.85rem;
      padding: 0.45rem 0.6rem;
      min-width: 65px;
    }

    .chem-mobile-card__input {
      width: 90px;
    }
  }
`;

/**
 * CalibrationHeatRow Component
 * Displays chemical analysis in table format with Product Values (IE input)
 */
const CalibrationHeatRow = ({
  heat,
  index,
  onUpdate
}) => {

  const handleChange = (field, value) => {
    // Enforce 3 decimal places precision
    if (value && !isNaN(value)) {
      const parts = value.toString().split('.');
      if (parts[1] && parts[1].length > 3) {
        return;
      }
    }
    onUpdate(index, field, value);
  };

  return (
    <Box className="ladle-card">
      <style>{ladleStyles}</style>

      <div className="ladle-card__header">
        <div>
          <p className="ladle-card__eyebrow">Heat No. of Raw Material</p>
          <p className="ladle-card__heat">{heat.heatNo || '-'}</p>
        </div>
      </div>

      <p className="ladle-section-title">
        Ladle Analysis of Each Heat as per TC
      </p>
      <p className="ladle-section-subtitle">
        Values of each element will be used as validation for Chemical Analysis test mentioned in sub module
      </p>

      {/* Desktop/Tablet Table Layout */}
      <div className="chem-table-wrapper">
        <table className="chem-analysis-table">
          <thead>
            <tr>
              <th></th>
              {LADLE_FIELDS.map(({ key, label }) => (
                <th key={key}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Specification Row - Shows acceptable ranges */}
            <tr style={{ background: '#f0f9ff' }}>
              <td style={{ fontWeight: 600, color: '#0369a1' }}>Specification</td>
              {LADLE_FIELDS.map(({ key }) => (
                <td key={key} style={{ color: '#0369a1', fontWeight: 500, fontSize: '0.85rem' }}>
                  {getSpecDisplay(key)}
                </td>
              ))}
            </tr>
            {/* Product Values Row - Editable by IE */}
            <tr>
              <td>Product Values</td>
              {LADLE_FIELDS.map(({ key }) => {
                const status = getValueStatus(key, heat[key]);
                return (
                  <td key={key}>
                    <input
                      type="number"
                      step="0.001"
                      inputMode="decimal"
                      className={`product-input ${status}`}
                      placeholder="Enter value"
                      value={heat[key] ?? ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                    />
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="chem-mobile-cards">
        {LADLE_FIELDS.map(({ key, label, shortLabel }) => {
          const status = getValueStatus(key, heat[key]);
          return (
            <div key={key} className="chem-mobile-card">
              <div className="chem-mobile-card__header">
                {shortLabel || label}
                <span style={{ marginLeft: '8px', color: '#0369a1', fontWeight: 500, fontSize: '0.75rem' }}>
                  (Spec: {getSpecDisplay(key)})
                </span>
              </div>
              <div className="chem-mobile-card__row">
                <span className="chem-mobile-card__label">Product Value</span>
                <input
                  type="number"
                  step="0.001"
                  inputMode="decimal"
                  className={`chem-mobile-card__input ${status}`}
                  placeholder="Enter"
                  value={heat[key] ?? ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Box>
  );
};

export default CalibrationHeatRow;

