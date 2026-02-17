import React, { useState } from 'react';
import './TurningSection.css';
import { getToleranceStyle, checkTolerance } from '../../utils/toleranceValidation';

const TurningSection = ({
  data,
  onDataChange,
  availableLotNumbers,
  hourLabels,
  visibleRows,
  showAll,
  onToggleShowAll,
  productType
}) => {
  const [expanded] = useState(true);

  const clearHour = (updated, idx) => {
    const base = updated[idx] || {};
    updated[idx] = {
      ...base,
      lotNo: '',
      parallelLength: [],
      fullTurningLength: [],
      turningDia: [],
      remarks: '',
      noProduction: true
    };
  };

  const updateData = (idx, field, value, sampleIdx = null) => {
    const newData = [...data];

    if (field === 'noProduction') {
      if (value === true) {
        clearHour(newData, idx);
        onDataChange(newData);
        return;
      }
      newData[idx] = { ...(newData[idx] || {}), noProduction: false };
      onDataChange(newData);
      return;
    }

    if (sampleIdx !== null) {
      if (!Array.isArray(newData[idx][field])) newData[idx][field] = [];
      const arr = [...newData[idx][field]];
      arr[sampleIdx] = value;
      newData[idx][field] = arr;
    } else {
      newData[idx][field] = value;
    }
    onDataChange(newData);
  };

  // Handle master "No Production" checkbox (toggle all 8 hours)
  const handleMasterNoProduction = (checked) => {
    const newData = [...data];
    newData.forEach((row, idx) => {
      row.noProduction = checked;
      if (checked) {
        clearHour(newData, idx);
      }
    });
    onDataChange(newData);
  };

  // Check if all hours are marked as "No Production"
  const allNoProduction = data.every(row => row.noProduction);

  // Helper to determine if rejection input should be enabled
  const isRejectionEnabled = (row, type) => {
    if (row.noProduction || !row.lotNo) return false;

    switch (type) {
      case 'parallel': // Column 4: Parallel Length
        return row.parallelLength?.some(val => {
          const { isValid, isApplicable } = checkTolerance('parallelLength', val, productType);
          return isApplicable && !isValid;
        });
      case 'full': // Column 5: Full Turning Length
        return row.fullTurningLength?.some(val => {
          const { isValid, isApplicable } = checkTolerance('fullLength', val, productType);
          return isApplicable && !isValid;
        });
      case 'dia': // Column 6: Turning Dia
        return row.turningDia?.some(val => {
          const { isValid, isApplicable } = checkTolerance('turningDia', val, productType);
          return isApplicable && !isValid;
        });
      default:
        return false;
    }
  };

  return (
    <div className="turning-section">
      <div className="turning-section__header">
        <div>
          <h3 className="turning-section__title">Turning Section - 8 Hour Grid</h3>
          <p className="turning-section__subtitle">Enter hourly turning production data</p>
        </div>
        <label className="section-master-no-production-label">
          <input
            type="checkbox"
            checked={allNoProduction}
            onChange={(e) => handleMasterNoProduction(e.target.checked)}
            className="section-master-checkbox"
          />
          <span>No Production (All Hours)</span>
        </label>
        <button
          type="button"
          className="btn btn-secondary turning-section__toggle"
          onClick={onToggleShowAll}
          title={showAll ? 'Show current hour only' : 'Show all 8 hours'}
        >
          {showAll ? '\u2212' : '+'}
        </button>
      </div>

      {expanded && (
        <div className="turning-table-wrapper">
          {/* Desktop Table Layout */}
          <table className="turning-table">
            <tbody>
              {visibleRows(data, showAll).map(({ row, idx }) => (
                <React.Fragment key={`${row.hour}-group`}>
                  {/* Header row for this hour block */}
                  <tr className={`turning-header-row${row.noProduction ? ' no-production' : ''}`}>
                    <th className="turning-th turning-th--time">Time Range</th>
                    <th className="turning-th turning-th--checkbox">No Production</th>
                    <th className="turning-th turning-th--lot">Lot No.</th>
                    <th className="turning-th turning-th--parallel">Parallel Length (mm)</th>
                    <th className="turning-th turning-th--full">Full Turning Length (mm)</th>
                    <th className="turning-th turning-th--dia">Turning Dia (mm)</th>
                  </tr>
                  {/* Row 1: First sample */}
                  <tr className={`turning-row${row.noProduction ? ' no-production' : ''}`}>
                    <td rowSpan="4" className="turning-td turning-td--time">
                      <strong>{hourLabels[idx]}</strong>
                    </td>
                    <td rowSpan="4" className="turning-td turning-td--checkbox">
                      <input
                        type="checkbox"
                        checked={row.noProduction}
                        onChange={e => updateData(idx, 'noProduction', e.target.checked)}
                        className="turning-checkbox"
                      />
                    </td>
                    <td rowSpan="3" className="turning-td turning-td--lot">
                      <select
                        className="form-control turning-select"
                        value={row.lotNo}
                        onChange={e => updateData(idx, 'lotNo', e.target.value)}
                        disabled={row.noProduction}
                      >
                        <option value="">Select Lot No.</option>
                        {availableLotNumbers.map(lot => (
                          <option key={lot} value={lot}>{lot}</option>
                        ))}
                      </select>
                    </td>
                    <td className="turning-td turning-td--parallel-input">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control turning-parallel-input"
                        value={row.parallelLength[0] || ''}
                        onChange={e => updateData(idx, 'parallelLength', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                        placeholder="float"
                        style={getToleranceStyle('parallelLength', row.parallelLength[0], productType)}
                      />
                    </td>
                    <td className="turning-td turning-td--full-input">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control turning-full-input"
                        value={row.fullTurningLength[0] || ''}
                        onChange={e => updateData(idx, 'fullTurningLength', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                        placeholder="mm"
                        style={getToleranceStyle('fullLength', row.fullTurningLength[0], productType)}
                      />
                    </td>
                    <td className="turning-td turning-td--dia-input">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control turning-dia-input"
                        value={row.turningDia[0] || ''}
                        onChange={e => updateData(idx, 'turningDia', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                        placeholder="mm"
                        style={getToleranceStyle('turningDia', row.turningDia[0], productType)}
                      />
                    </td>
                  </tr>
                  {/* Row 2: Second sample */}
                  <tr key={`${row.hour}-r2`} className="turning-row">
                    <td className="turning-td turning-td--parallel-input">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control turning-parallel-input"
                        value={row.parallelLength[1] || ''}
                        onChange={e => updateData(idx, 'parallelLength', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                        placeholder="mm"
                        style={getToleranceStyle('parallelLength', row.parallelLength[1], productType)}
                      />
                    </td>
                    <td className="turning-td turning-td--full-input">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control turning-full-input"
                        value={row.fullTurningLength[1] || ''}
                        onChange={e => updateData(idx, 'fullTurningLength', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                        placeholder="mm"
                        style={getToleranceStyle('fullLength', row.fullTurningLength[1], productType)}
                      />
                    </td>
                    <td className="turning-td turning-td--dia-input">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control turning-dia-input"
                        value={row.turningDia[1] || ''}
                        onChange={e => updateData(idx, 'turningDia', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                        placeholder="mm"
                        style={getToleranceStyle('turningDia', row.turningDia[1], productType)}
                      />
                    </td>
                  </tr>
                  {/* Row 3: Third sample */}
                  <tr key={`${row.hour}-r3`} className="turning-row">
                    <td className="turning-td turning-td--parallel-input">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control turning-parallel-input"
                        value={row.parallelLength[2] || ''}
                        onChange={e => updateData(idx, 'parallelLength', e.target.value, 2)}
                        disabled={row.noProduction || !row.lotNo}
                        placeholder="mm"
                        style={getToleranceStyle('parallelLength', row.parallelLength[2], productType)}
                      />
                    </td>
                    <td className="turning-td turning-td--full-input">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control turning-full-input"
                        value={row.fullTurningLength[2] || ''}
                        onChange={e => updateData(idx, 'fullTurningLength', e.target.value, 2)}
                        disabled={row.noProduction || !row.lotNo}
                        placeholder="mm"
                        style={getToleranceStyle('fullLength', row.fullTurningLength[2], productType)}
                      />
                    </td>
                    <td className="turning-td turning-td--dia-input">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control turning-dia-input"
                        value={row.turningDia[2] || ''}
                        onChange={e => updateData(idx, 'turningDia', e.target.value, 2)}
                        disabled={row.noProduction || !row.lotNo}
                        placeholder="mm"
                        style={getToleranceStyle('turningDia', row.turningDia[2], productType)}
                      />
                    </td>
                  </tr>
                  {/* Row 4: Rejected No. */}
                  <tr key={`${row.hour}-r4`} className="turning-row turning-row--rejected">
                    <td className="turning-td turning-td--rejected-label">
                      <span className="turning-rejected-label">Rejected No.</span>
                    </td>
                    <td className="turning-td turning-td--rejected-input">
                      <input
                        type="number"
                        className="form-control turning-input turning-input--rejected"
                        value={row.rejectedQty[0] || ''}
                        onChange={e => updateData(idx, 'rejectedQty', e.target.value, 0)}
                        disabled={!isRejectionEnabled(row, 'parallel')}
                      />
                    </td>
                    <td className="turning-td turning-td--rejected-input">
                      <input
                        type="number"
                        className="form-control turning-input turning-input--rejected"
                        value={row.rejectedQty[1] || ''}
                        onChange={e => updateData(idx, 'rejectedQty', e.target.value, 1)}
                        disabled={!isRejectionEnabled(row, 'full')}
                      />
                    </td>
                    <td className="turning-td turning-td--rejected-input">
                      <input
                        type="number"
                        className="form-control turning-input turning-input--rejected"
                        value={row.rejectedQty[2] || ''}
                        onChange={e => updateData(idx, 'rejectedQty', e.target.value, 2)}
                        disabled={!isRejectionEnabled(row, 'dia')}
                      />
                    </td>
                  </tr>
                  {/* Row 5: Remarks */}
                  <tr key={`${row.hour}-r5`} className="turning-row turning-row--remarks">
                    <td className="turning-td turning-td--remarks-label">
                      <span className="turning-remarks-label">Remarks</span>
                    </td>
                    <td colSpan="5" className="turning-td turning-td--remarks-input">
                      <input
                        type="text"
                        className="form-control turning-input"
                        value={row.remarks}
                        onChange={e => updateData(idx, 'remarks', e.target.value)}
                        disabled={row.noProduction}
                      />
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Mobile Card Layout */}
          <div className="turning-mobile-cards">
            {visibleRows(data, showAll).map(({ row, idx }) => (
              <div key={row.hour} className="turning-mobile-card">
                <div className="turning-mobile-card__header">
                  <span className="turning-mobile-card__time">{hourLabels[idx]}</span>
                  <input
                    type="checkbox"
                    checked={row.noProduction}
                    onChange={e => updateData(idx, 'noProduction', e.target.checked)}
                    className="turning-checkbox"
                  />
                </div>
                <div className="turning-mobile-card__body">
                  <div className="turning-mobile-field">
                    <span className="turning-mobile-field__label">Lot No.</span>
                    <div className="turning-mobile-field__value">
                      <select
                        value={row.lotNo}
                        onChange={e => updateData(idx, 'lotNo', e.target.value)}
                        disabled={row.noProduction}
                      >
                        <option value="">Select Lot No.</option>
                        {availableLotNumbers.map(lot => (
                          <option key={lot} value={lot}>{lot}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="turning-mobile-field">
                    <span className="turning-mobile-field__label">Parallel Length (S1) (mm)</span>
                    <div className="turning-mobile-field__value">
                      <input
                        type="number"
                        step="0.01"
                        value={row.parallelLength[0] || ''}
                        onChange={e => updateData(idx, 'parallelLength', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                        placeholder="mm"
                      />
                    </div>
                  </div>
                  <div className="turning-mobile-field">
                    <span className="turning-mobile-field__label">Parallel Length (S2) (mm)</span>
                    <div className="turning-mobile-field__value">
                      <input
                        type="number"
                        step="0.01"
                        value={row.parallelLength[1] || ''}
                        onChange={e => updateData(idx, 'parallelLength', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                        placeholder="mm"
                      />
                    </div>
                  </div>
                  <div className="turning-mobile-field">
                    <span className="turning-mobile-field__label">Parallel Length (S3) (mm)</span>
                    <div className="turning-mobile-field__value">
                      <input
                        type="number"
                        step="0.01"
                        value={row.parallelLength[2] || ''}
                        onChange={e => updateData(idx, 'parallelLength', e.target.value, 2)}
                        disabled={row.noProduction || !row.lotNo}
                        placeholder="mm"
                      />
                    </div>
                  </div>
                  <div className="turning-mobile-field">
                    <span className="turning-mobile-field__label">Full Turning Length (S1) (mm)</span>
                    <div className="turning-mobile-field__value">
                      <input
                        type="number"
                        step="0.01"
                        value={row.fullTurningLength[0] || ''}
                        onChange={e => updateData(idx, 'fullTurningLength', e.target.value, 0)}
                        disabled={row.noProduction}
                        placeholder="float"
                      />
                    </div>
                  </div>
                  <div className="turning-mobile-field">
                    <span className="turning-mobile-field__label">Full Turning Length (S2) (mm)</span>
                    <div className="turning-mobile-field__value">
                      <input
                        type="number"
                        step="0.01"
                        value={row.fullTurningLength[1] || ''}
                        onChange={e => updateData(idx, 'fullTurningLength', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                        placeholder="mm"
                      />
                    </div>
                  </div>
                  <div className="turning-mobile-field">
                    <span className="turning-mobile-field__label">Full Turning Length (S3) (mm)</span>
                    <div className="turning-mobile-field__value">
                      <input
                        type="number"
                        step="0.01"
                        value={row.fullTurningLength[2] || ''}
                        onChange={e => updateData(idx, 'fullTurningLength', e.target.value, 2)}
                        disabled={row.noProduction || !row.lotNo}
                        placeholder="mm"
                      />
                    </div>
                  </div>
                  <div className="turning-mobile-field">
                    <span className="turning-mobile-field__label">Turning Dia (S1) (mm)</span>
                    <div className="turning-mobile-field__value">
                      <input
                        type="number"
                        step="0.01"
                        value={row.turningDia[0] || ''}
                        onChange={e => updateData(idx, 'turningDia', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                        placeholder="mm"
                      />
                    </div>
                  </div>
                  <div className="turning-mobile-field">
                    <span className="turning-mobile-field__label">Turning Dia (S2) (mm)</span>
                    <div className="turning-mobile-field__value">
                      <input
                        type="number"
                        step="0.01"
                        value={row.turningDia[1] || ''}
                        onChange={e => updateData(idx, 'turningDia', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                        placeholder="mm"
                      />
                    </div>
                  </div>
                  <div className="turning-mobile-field">
                    <span className="turning-mobile-field__label">Turning Dia (S3) (mm)</span>
                    <div className="turning-mobile-field__value">
                      <input
                        type="number"
                        step="0.01"
                        value={row.turningDia[2] || ''}
                        onChange={e => updateData(idx, 'turningDia', e.target.value, 2)}
                        disabled={row.noProduction || !row.lotNo}
                        placeholder="mm"
                      />
                    </div>
                  </div>
                  <div className="turning-mobile-field">
                    <span className="turning-mobile-field__label">Remarks</span>
                    <div className="turning-mobile-field__value">
                      <input
                        type="text"
                        value={row.remarks}
                        onChange={e => updateData(idx, 'remarks', e.target.value)}
                        disabled={row.noProduction}
                      />
                    </div>
                  </div>
                  <div className="turning-mobile-field turning-mobile-field--rejected">
                    <span className="turning-mobile-field__label">Rejected No. 1</span>
                    <div className="turning-mobile-field__value">
                      <input
                        type="number"
                        value={row.rejectedQty[0] || ''}
                        onChange={e => updateData(idx, 'rejectedQty', e.target.value, 0)}
                        disabled={!isRejectionEnabled(row, 'parallel')}
                      />
                    </div>
                  </div>
                  <div className="turning-mobile-field turning-mobile-field--rejected">
                    <span className="turning-mobile-field__label">Rejected No. 2</span>
                    <div className="turning-mobile-field__value">
                      <input
                        type="number"
                        value={row.rejectedQty[1] || ''}
                        onChange={e => updateData(idx, 'rejectedQty', e.target.value, 1)}
                        disabled={!isRejectionEnabled(row, 'full')}
                      />
                    </div>
                  </div>
                  <div className="turning-mobile-field turning-mobile-field--rejected">
                    <span className="turning-mobile-field__label">Rejected No. 3</span>
                    <div className="turning-mobile-field__value">
                      <input
                        type="number"
                        value={row.rejectedQty[2] || ''}
                        onChange={e => updateData(idx, 'rejectedQty', e.target.value, 2)}
                        disabled={!isRejectionEnabled(row, 'dia')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TurningSection;

