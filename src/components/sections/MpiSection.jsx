import React, { useState } from 'react';
import './MpiSection.css';

const MpiSection = ({
  data,
  onDataChange,
  availableLotNumbers,
  hourLabels,
  visibleRows,
  showAll,
  onToggleShowAll
}) => {
  const [expanded] = useState(true);

  const clearHour = (updated, idx) => {
    const base = updated[idx] || {};
    updated[idx] = {
      ...base,
      lotNo: '',
      testResults: [],
      rejectedQty: '',
      remarks: '',
      noProduction: true
    };
  };

  const updateData = (idx, field, value, arrayIndex = null) => {
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

    if (arrayIndex !== null) {
      const arr = [...(newData[idx][field] || [])];
      arr[arrayIndex] = value;
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

  // Helper to determine if rejection input should be enabled
  const isRejectionEnabled = (row) => {
    if (row.noProduction || !row.lotNo) return false;
    // Enable if any test result is 'NOT OK'
    return row.testResults?.some(val => val === 'NOT OK');
  };

  // Check if all hours are marked as "No Production"
  const allNoProduction = data.every(row => row.noProduction);

  return (
    <div className="mpi-section">
      <div className="mpi-section__header">
        <div>
          <h3 className="mpi-section__title">MPI Section</h3>
          <p className="mpi-section__subtitle">Enter hourly MPI (Magnetic Particle Inspection) production data</p>
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
          className="btn btn-secondary mpi-section__toggle"
          onClick={onToggleShowAll}
          title={showAll ? 'Show current hour only' : 'Show all 8 hours'}
        >
          {showAll ? '\u2212' : '+'}
        </button>
      </div>

      {expanded && (
        <div className="mpi-table-wrapper">
          {/* Desktop Table Layout */}
          <table className="mpi-table">
            <tbody>
              {visibleRows(data, showAll).map(({ row, idx }) => (
                <React.Fragment key={`${row.hour}-group`}>
                  {/* Header row for this hour block */}
                  <tr className={`mpi-header-row${row.noProduction ? ' no-production' : ''}`}>
                    <th className="mpi-th mpi-th--time">Time Range</th>
                    <th className="mpi-th mpi-th--checkbox">No Production</th>
                    <th className="mpi-th mpi-th--lot">Lot No.</th>
                    <th className="mpi-th mpi-th--results">MPI Results</th>
                  </tr>
                  {/* Row 1: First sample */}
                  <tr key={`${row.hour}-r1`} className={`mpi-row${row.noProduction ? ' no-production' : ''}`}>
                    <td rowSpan="4" className="mpi-td mpi-td--time">
                      <strong>{hourLabels[idx]}</strong>
                    </td>
                    <td rowSpan="4" className="mpi-td mpi-td--checkbox">
                      <input
                        type="checkbox"
                        checked={row.noProduction}
                        onChange={e => updateData(idx, 'noProduction', e.target.checked)}
                        className="mpi-checkbox"
                      />
                    </td>
                    <td rowSpan="3" className="mpi-td mpi-td--lot">
                      <select
                        className="form-control mpi-select"
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
                    <td className="mpi-td mpi-td--results-input">
                      <select
                        className="form-control mpi-results-select"
                        value={row.testResults[0] || ''}
                        onChange={e => updateData(idx, 'testResults', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="NOT OK">NOT OK</option>
                      </select>
                    </td>
                  </tr>
                  {/* Row 2: Second sample */}
                  <tr key={`${row.hour}-r2`} className={`mpi-row${row.noProduction ? ' no-production' : ''}`}>
                    <td className="mpi-td mpi-td--results-input">
                      <select
                        className="form-control mpi-results-select"
                        value={row.testResults[1] || ''}
                        onChange={e => updateData(idx, 'testResults', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="NOT OK">NOT OK</option>
                      </select>
                    </td>
                  </tr>
                  {/* Row 3: Third sample */}
                  <tr key={`${row.hour}-r3`} className={`mpi-row${row.noProduction ? ' no-production' : ''}`}>
                    <td className="mpi-td mpi-td--results-input">
                      <select
                        className="form-control mpi-results-select"
                        value={row.testResults[2] || ''}
                        onChange={e => updateData(idx, 'testResults', e.target.value, 2)}
                        disabled={row.noProduction || !row.lotNo}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="NOT OK">NOT OK</option>
                      </select>
                    </td>
                  </tr>
                  {/* Row 4: Rejected No. */}
                  <tr key={`${row.hour}-r4`} className={`mpi-row mpi-row--rejected${row.noProduction ? ' no-production' : ''}`}>
                    <td className="mpi-td mpi-td--rejected-label">
                      <span className="mpi-rejected-label">Rejected No.</span>
                    </td>
                    <td className="mpi-td mpi-td--rejected-input">
                      <input
                        type="number"
                        className="form-control mpi-input mpi-input--rejected"
                        value={row.rejectedQty || ''}
                        onChange={e => updateData(idx, 'rejectedQty', e.target.value)}
                        disabled={!isRejectionEnabled(row)}
                      />
                    </td>
                  </tr>
                  {/* Row 5: Remarks */}
                  <tr key={`${row.hour}-r5`} className={`mpi-row mpi-row--remarks${row.noProduction ? ' no-production' : ''}`}>
                    <td className="mpi-td mpi-td--remarks-label">
                      <span className="mpi-remarks-label">Remarks</span>
                    </td>
                    <td colSpan="3" className="mpi-td mpi-td--remarks-input">
                      <input
                        type="text"
                        className="form-control mpi-input"
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
          <div className="mpi-mobile-cards">
            {visibleRows(data, showAll).map(({ row, idx }) => (
              <div key={row.hour} className="mpi-mobile-card">
                <div className="mpi-mobile-card__header">
                  <span className="mpi-mobile-card__time">{hourLabels[idx]}</span>
                  <input
                    type="checkbox"
                    checked={row.noProduction}
                    onChange={e => updateData(idx, 'noProduction', e.target.checked)}
                    className="mpi-checkbox"
                  />
                </div>
                <div className="mpi-mobile-card__body">
                  <div className="mpi-mobile-field">
                    <span className="mpi-mobile-field__label">Lot No.</span>
                    <div className="mpi-mobile-field__value">
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
                  {[0, 1, 2].map(sampleIdx => (
                    <div key={sampleIdx} className="mpi-mobile-field">
                      <span className="mpi-mobile-field__label">MPI Results (S{sampleIdx + 1})</span>
                      <div className="mpi-mobile-field__value">
                        <select
                          value={row.testResults[sampleIdx] || ''}
                          onChange={e => updateData(idx, 'testResults', e.target.value, sampleIdx)}
                          disabled={row.noProduction}
                        >
                          <option value="">Select</option>
                          <option value="OK">OK</option>
                          <option value="Not OK">Not OK</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  <div className="mpi-mobile-field">
                    <span className="mpi-mobile-field__label">Remarks</span>
                    <div className="mpi-mobile-field__value">
                      <input
                        type="text"
                        value={row.remarks}
                        onChange={e => updateData(idx, 'remarks', e.target.value)}
                        disabled={row.noProduction || !row.lotNo}
                      />
                    </div>
                  </div>
                  <div className="mpi-mobile-field mpi-mobile-field--rejected">
                    <span className="mpi-mobile-field__label">Rejected No.</span>
                    <div className="mpi-mobile-field__value">
                      <input
                        type="number"
                        value={row.rejectedQty || ''}
                        onChange={e => updateData(idx, 'rejectedQty', e.target.value)}
                        disabled={!isRejectionEnabled(row)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div >
  );
};

export default MpiSection;