import React, { useState } from 'react';
import './ShearingSection.css';
import { getToleranceStyle, checkTolerance } from '../../utils/toleranceValidation';

const ShearingSection = ({
  data,
  onDataChange,
  availableLotNumbers = [],
  hourLabels = [],
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
      lengthCutBar: [],
      qualityDia: [],
      sharpEdges: [],
      crackedEdges: [],
      rejectedQty: [],
      remarks: '',
      noProduction: true
    };
  };

  const updateData = (index, field, value, sampleIndex = null) => {
    const updated = [...data];

    // When marking No Production = true, clear the entire hour
    if (field === 'noProduction') {
      if (value === true) {
        clearHour(updated, index);
        onDataChange(updated);
        return;
      }
      // If unchecking No Production, just set the flag to false
      updated[index] = { ...(updated[index] || {}), noProduction: false };
      onDataChange(updated);
      return;
    }

    // Handle array fields (lengthCutBar, qualityDia, sharpEdges, crackedEdges, rejectedQty)
    if (sampleIndex !== null) {
      if (!Array.isArray(updated[index][field])) {
        updated[index][field] = [];
      }
      const fieldArray = [...updated[index][field]];
      fieldArray[sampleIndex] = value;
      updated[index][field] = fieldArray;
    } else {
      // Handle non-array fields (remarks, lotNo)
      updated[index][field] = value;
    }
    onDataChange(updated);
  };

  // Handle master "No Production" checkbox (toggle all 8 hours)
  const handleMasterNoProduction = (checked) => {
    const updated = [...data];
    updated.forEach((row, idx) => {
      row.noProduction = checked;
      if (checked) {
        clearHour(updated, idx);
      }
    });
    onDataChange(updated);
  };

  // Check if all hours are marked as "No Production"
  const allNoProduction = data.every(row => row.noProduction);

  // Helper to determine if rejection input should be enabled
  const isRejectionEnabled = (row, type) => {
    if (row.noProduction || !row.lotNo) return false;

    switch (type) {
      case 'length': // Column 1: Length of Cut Bar
        return row.lengthCutBar?.some(val => {
          const { isValid, isApplicable } = checkTolerance('lengthCutBar', val, productType);
          return isApplicable && !isValid;
        });
      case 'quality': // Column 2: Quality / Improper Dia
        return row.qualityDia?.some(val => val === 'NOT OK');
      case 'sharpEdges': // Column 3: Sharp Edges
        return row.sharpEdges?.some(val => val === 'NOT OK');
      case 'crackedEdges': // Column 4: Cracked Edges
        return row.crackedEdges?.some(val => val === 'NOT OK');
      default:
        return false;
    }
  };

  return (
    <div className="card shearing-section">
      <div className="card-header shearing-section__header">
        <div>
          <h3 className="card-title">Shearing Section</h3>
          <p className="card-subtitle">Enter hourly shearing production data</p>
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
        <div className="shearing-section__actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onToggleShowAll}
            title={showAll ? 'Show current hour only' : 'Show all 8 hours'}
          >
            {showAll ? '−' : '+'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="shearing-table-wrapper">
          {/* Desktop Table Layout - 4 rows per time slot */}
          <table className="shearing-table">
            <tbody>
              {visibleRows(data, showAll).map(({ row, idx }) => (
                <React.Fragment key={`${row.hour}-group`}>
                  {/* Header row for this hour block */}
                  <tr className={`shearing-header-row${row.noProduction ? ' no-production' : ''}`}>
                    <th className="shearing-th shearing-th--time">Time Range</th>
                    <th className="shearing-th shearing-th--checkbox">No Production</th>
                    <th className="shearing-th shearing-th--lot">Lot No.</th>
                    <th className="shearing-th shearing-th--length">Length of Cut Bar (mm)</th>
                    <th className="shearing-th shearing-th--quality">Quality / Improper Dia at end</th>
                    <th className="shearing-th shearing-th--edges">Sharp Edges</th>
                    <th className="shearing-th shearing-th--cracked">Cracked Edges</th>
                  </tr>
                  {/* Row 1: First sample */}
                  <tr key={`${row.hour}-r1`} className={`shearing-row${row.noProduction ? ' no-production' : ''}`}>
                    <td rowSpan="4" className="shearing-td shearing-td--time">
                      <strong>{hourLabels[idx]}</strong>
                    </td>
                    <td rowSpan="4" className="shearing-td shearing-td--checkbox">
                      <input
                        type="checkbox"
                        checked={row.noProduction}
                        onChange={e => updateData(idx, 'noProduction', e.target.checked)}
                        className="shearing-checkbox"
                      />
                    </td>
                    <td rowSpan="3" className="shearing-td shearing-td--lot">
                      <select
                        className="form-control shearing-select"
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
                    <td className="shearing-td shearing-td--length-input">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control shearing-length-input"
                        value={row.lengthCutBar[0] || ''}
                        onChange={e => updateData(idx, 'lengthCutBar', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                        placeholder="mm"
                        style={getToleranceStyle('lengthCutBar', row.lengthCutBar[0], productType)}
                      />
                    </td>
                    <td className="shearing-td shearing-td--quality-input">
                      <select
                        className="form-control shearing-select"
                        value={row.qualityDia[0] || ''}
                        onChange={e => updateData(idx, 'qualityDia', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="NOT OK">Not OK</option>
                      </select>
                    </td>
                    <td className="shearing-td shearing-td--edge-dropdown">
                      <select
                        className="form-control shearing-select"
                        value={row.sharpEdges[0] || ''}
                        onChange={e => updateData(idx, 'sharpEdges', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="NOT OK">Not OK</option>
                      </select>
                    </td>
                    <td className="shearing-td shearing-td--cracked-dropdown">
                      <select
                        className="form-control shearing-select"
                        value={row.crackedEdges[0] || ''}
                        onChange={e => updateData(idx, 'crackedEdges', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="NOT OK">Not OK</option>
                      </select>
                    </td>
                  </tr>
                  {/* Row 2: Second sample */}

                  <tr key={`${row.hour}-r2`} className={`shearing-row${row.noProduction ? ' no-production' : ''}`}>
                    <td className="shearing-td shearing-td--length-input">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control shearing-length-input"
                        value={row.lengthCutBar[1] || ''}
                        onChange={e => updateData(idx, 'lengthCutBar', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                        placeholder="mm"
                        style={getToleranceStyle('lengthCutBar', row.lengthCutBar[1], productType)}
                      />
                    </td>
                    <td className="shearing-td shearing-td--quality-input">
                      <select
                        className="form-control shearing-select"
                        value={row.qualityDia[1] || ''}
                        onChange={e => updateData(idx, 'qualityDia', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="NOT OK">Not OK</option>
                      </select>
                    </td>
                    <td className="shearing-td shearing-td--edge-dropdown">
                      <select
                        className="form-control shearing-select"
                        value={row.sharpEdges[1] || ''}
                        onChange={e => updateData(idx, 'sharpEdges', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="NOT OK">Not OK</option>
                      </select>
                    </td>
                    <td className="shearing-td shearing-td--cracked-dropdown">
                      <select
                        className="form-control shearing-select"
                        value={row.crackedEdges[1] || ''}
                        onChange={e => updateData(idx, 'crackedEdges', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="NOT OK">Not OK</option>
                      </select>
                    </td>
                  </tr>
                  {/* Row 3: Third sample */}
                  <tr key={`${row.hour}-r3`} className={`shearing-row${row.noProduction ? ' no-production' : ''}`}>
                    <td className="shearing-td shearing-td--length-input">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control shearing-length-input"
                        value={row.lengthCutBar[2] || ''}
                        onChange={e => updateData(idx, 'lengthCutBar', e.target.value, 2)}
                        disabled={row.noProduction || !row.lotNo}
                        placeholder="mm"
                        style={getToleranceStyle('lengthCutBar', row.lengthCutBar[2], productType)}
                      />
                    </td>
                    <td className="shearing-td shearing-td--quality-input">
                      <select
                        className="form-control shearing-select"
                        value={row.qualityDia[2] || ''}
                        onChange={e => updateData(idx, 'qualityDia', e.target.value, 2)}
                        disabled={row.noProduction || !row.lotNo}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="NOT OK">Not OK</option>
                      </select>
                    </td>
                    <td className="shearing-td shearing-td--edge-dropdown">
                      <select
                        className="form-control shearing-select"
                        value={row.sharpEdges[2] || ''}
                        onChange={e => updateData(idx, 'sharpEdges', e.target.value, 2)}
                        disabled={row.noProduction || !row.lotNo}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="NOT OK">Not OK</option>
                      </select>
                    </td>
                    <td className="shearing-td shearing-td--cracked-dropdown">
                      <select
                        className="form-control shearing-select"
                        value={row.crackedEdges[2] || ''}
                        onChange={e => updateData(idx, 'crackedEdges', e.target.value, 2)}
                        disabled={row.noProduction || !row.lotNo}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="NOT OK">Not OK</option>
                      </select>
                    </td>
                  </tr>
                  {/* Row 4: Rejected No. of ERC */}
                  <tr key={`${row.hour}-r4`} className={`shearing-row${row.noProduction ? ' no-production' : ''}`}>
                    <td className="shearing-td shearing-td--rejected-label">
                      <span className="shearing-rejected-label">No. of ERC Rejected</span>
                    </td>
                    <td className="shearing-td shearing-td--rejected-input">
                      <input
                        type="number"
                        className="form-control shearing-input shearing-input--rejected"
                        value={row.rejectedQty[0] || ''}
                        onChange={e => updateData(idx, 'rejectedQty', e.target.value, 0)}
                        disabled={!isRejectionEnabled(row, 'length')}
                        title={!isRejectionEnabled(row, 'length') ? "Reject enabled only if Length is out of tolerance" : ""}
                      />
                    </td>
                    <td className="shearing-td shearing-td--rejected-input">
                      <input
                        type="number"
                        className="form-control shearing-input shearing-input--rejected"
                        value={row.rejectedQty[1] || ''}
                        onChange={e => updateData(idx, 'rejectedQty', e.target.value, 1)}
                        disabled={!isRejectionEnabled(row, 'quality')}
                        title={!isRejectionEnabled(row, 'quality') ? "Reject enabled only if Quality is NOT OK" : ""}
                      />
                    </td>
                    <td className="shearing-td shearing-td--rejected-input">
                      <input
                        type="number"
                        className="form-control shearing-input shearing-input--rejected"
                        value={row.rejectedQty[2] || ''}
                        onChange={e => updateData(idx, 'rejectedQty', e.target.value, 2)}
                        disabled={!isRejectionEnabled(row, 'sharpEdges')}
                        title={!isRejectionEnabled(row, 'sharpEdges') ? "Reject enabled only if Sharp Edge is NOT OK" : ""}
                      />
                    </td>
                    <td className="shearing-td shearing-td--rejected-input">
                      <input
                        type="number"
                        className="form-control shearing-input shearing-input--rejected"
                        value={row.rejectedQty[3] || ''}
                        onChange={e => updateData(idx, 'rejectedQty', e.target.value, 3)}
                        disabled={!isRejectionEnabled(row, 'crackedEdges')}
                        title={!isRejectionEnabled(row, 'crackedEdges') ? "Reject enabled only if Cracked Edge is NOT OK" : ""}
                      />
                    </td>
                  </tr>
                  {/* Row 5: Remarks */}
                  <tr key={`${row.hour}-r5`} className={`shearing-row${row.noProduction ? ' no-production' : ''}`}>
                    <td className="shearing-td shearing-td--remarks-label">
                      <span className="shearing-remarks-label">Remarks</span>
                    </td>
                    <td colSpan="6" className="shearing-td shearing-td--remarks-input">
                      <input
                        type="text"
                        className="form-control shearing-input"
                        value={row.remarks}
                        onChange={e => updateData(idx, 'remarks', e.target.value)}
                        disabled={row.noProduction || !row.lotNo}
                      />
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Mobile Card Layout */}
          <div className="shearing-mobile-cards">
            {visibleRows(data, showAll).map(({ row, idx }) => (
              <div key={row.hour} className="shearing-mobile-card">
                <div className="shearing-mobile-card__header">
                  <span>{hourLabels[idx]}</span>
                  <input
                    type="checkbox"
                    checked={row.noProduction}
                    onChange={e => updateData(idx, 'noProduction', e.target.checked)}
                    className="shearing-mobile-checkbox"
                  />
                  <span style={{ fontSize: '11px' }}>No Production</span>
                </div>
                <div className="shearing-mobile-card__body">
                  <div className="shearing-mobile-field">
                    <div className="shearing-mobile-field__label">Lot No.</div>
                    <div className="shearing-mobile-field__value">
                      <select
                        className="form-control"
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
                  <div className="shearing-mobile-field">
                    <div className="shearing-mobile-field__label">Rejected No.</div>
                    <div className="shearing-mobile-field__value shearing-mobile-field__value--rejected">
                      <div className="shearing-mobile-rejected-inputs">
                        {[0, 1].map(sampleIdx => (
                          <div key={sampleIdx} className="shearing-mobile-rejected-item">
                            <input
                              type="number"
                              className="form-control"
                              value={row.rejectedQty[sampleIdx] || ''}
                              onChange={e => updateData(idx, 'rejectedQty', e.target.value, sampleIdx)}
                              disabled={!isRejectionEnabled(row, sampleIdx === 0 ? 'length' : 'quality')}
                              placeholder={`Qty ${sampleIdx + 1}`}
                              title={!isRejectionEnabled(row, sampleIdx === 0 ? 'length' : 'quality') ? "Reject enabled only if out of tolerance/NOT OK" : ""}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="shearing-mobile-field">
                    <div className="shearing-mobile-field__label">Length of Cut Bar (mm)</div>
                    <div className="shearing-mobile-field__value">
                      <div className="shearing-mobile-length-inputs">
                        {[0, 1, 2].map(sampleIdx => (
                          <div key={sampleIdx} className="shearing-mobile-length-item">
                            <input
                              type="text"
                              className="form-control"
                              value={row.lengthCutBar[sampleIdx] || ''}
                              onChange={e => updateData(idx, 'lengthCutBar', e.target.value, sampleIdx)}
                              disabled={row.noProduction || !row.lotNo}
                              placeholder={`S${sampleIdx + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="shearing-mobile-field">
                    <div className="shearing-mobile-field__label">No Sharp Edges</div>
                    <div className="shearing-mobile-field__value">
                      <div className="shearing-mobile-edges">
                        {[0, 1, 2].map(sampleIdx => (
                          <div key={sampleIdx} className="shearing-mobile-edge-item">
                            <input
                              type="checkbox"
                              checked={row.sharpEdges[sampleIdx] || false}
                              onChange={e => updateData(idx, 'sharpEdges', e.target.checked, sampleIdx)}
                              disabled={row.noProduction || !row.lotNo}
                              className="shearing-mobile-checkbox"
                            />
                            <span>S{sampleIdx + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="shearing-mobile-field">
                    <div className="shearing-mobile-field__label">Remarks</div>
                    <div className="shearing-mobile-field__value">
                      <input
                        type="text"
                        className="form-control"
                        value={row.remarks}
                        onChange={e => updateData(idx, 'remarks', e.target.value)}
                        disabled={row.noProduction || !row.lotNo}
                        placeholder="Enter remarks"
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

export default ShearingSection;

