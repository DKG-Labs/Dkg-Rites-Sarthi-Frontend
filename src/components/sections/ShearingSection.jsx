import React, { useState } from 'react';
import './ShearingSection.css';
import { getToleranceStyle, checkTolerance, getRejectionStyle, getSelectToleranceStyle } from '../../utils/toleranceValidation';

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
      rejectedQty: ['0', '0', '0', '0'],
      remarks: '',
      noProduction: true
    };
  };

  // Helper to determine if rejection input should be enabled (hoisted to support usage inside updates)
  const isRejectionEnabled = (row, type) => {
    if (row.noProduction || !row.lotNo) return false;

    switch (type) {
      case 'length': // Column 1: Length of Cut Bar
        return row.lengthCutBar?.some(val => {
          const { isValid, isApplicable } = checkTolerance('lengthCutBar', val, productType);
          return isApplicable && !isValid;
        });
      case 'quality': // Column 2: Quality / Improper Dia
        return row.qualityDia?.some(val => String(val).trim().toUpperCase() === 'NOT OK');
      case 'sharpEdges': // Column 3: Sharp Edges
        return row.sharpEdges?.some(val => String(val).trim().toUpperCase() === 'NOT OK');
      case 'crackedEdges': // Column 4: Cracked Edges
        return row.crackedEdges?.some(val => String(val).trim().toUpperCase() === 'NOT OK');
      default:
        return false;
    }
  };

  const autoClearRejections = (row) => {
    if (!Array.isArray(row.rejectedQty)) {
      row.rejectedQty = ['', '', '', ''];
    }
    const types = ['length', 'quality', 'sharpEdges', 'crackedEdges'];
    types.forEach((type, idx) => {
      if (!isRejectionEnabled(row, type)) {
        row.rejectedQty[idx] = '';
      }
    });
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
      autoClearRejections(updated[index]);
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

    autoClearRejections(updated[index]);
    onDataChange(updated);
  };

  // Handle master "No Production" checkbox (toggle all 8 hours)
  const handleMasterNoProduction = (checked) => {
    const updated = [...data];
    updated.forEach((row, idx) => {
      row.noProduction = checked;
      if (checked) {
        clearHour(updated, idx);
      } else {
        autoClearRejections(row);
      }
    });
    onDataChange(updated);
  };

  // Check if all hours are marked as "No Production"
  const allNoProduction = data.every(row => row.noProduction);

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
                        style={getSelectToleranceStyle(row.qualityDia[0])}
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
                        style={getSelectToleranceStyle(row.sharpEdges[0])}
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
                        style={getSelectToleranceStyle(row.crackedEdges[0])}
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
                        style={getSelectToleranceStyle(row.qualityDia[1])}
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
                        style={getSelectToleranceStyle(row.sharpEdges[1])}
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
                        style={getSelectToleranceStyle(row.crackedEdges[1])}
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
                        style={getSelectToleranceStyle(row.qualityDia[2])}
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
                        style={getSelectToleranceStyle(row.sharpEdges[2])}
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
                        style={getSelectToleranceStyle(row.crackedEdges[2])}
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
                        type="text"
                        inputMode="numeric"
                        className="form-control shearing-input shearing-input--rejected"
                        value={!isRejectionEnabled(row, 'length') ? '0' : (row.rejectedQty[0] ?? '0')}
                        onChange={e => updateData(idx, 'rejectedQty', e.target.value.replace(/[^0-9]/g, ''), 0)}
                        onBlur={() => { if (!row.rejectedQty[0] && row.rejectedQty[0] !== 0) updateData(idx, 'rejectedQty', '0', 0); }}
                        disabled={!isRejectionEnabled(row, 'length')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'length'))}
                        title={!isRejectionEnabled(row, 'length') ? "Reject enabled only if Length is out of tolerance" : ""}
                      />
                    </td>
                    <td className="shearing-td shearing-td--rejected-input">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="form-control shearing-input shearing-input--rejected"
                        value={!isRejectionEnabled(row, 'quality') ? '0' : (row.rejectedQty[1] ?? '0')}
                        onChange={e => updateData(idx, 'rejectedQty', e.target.value.replace(/[^0-9]/g, ''), 1)}
                        onBlur={() => { if (!row.rejectedQty[1] && row.rejectedQty[1] !== 0) updateData(idx, 'rejectedQty', '0', 1); }}
                        disabled={!isRejectionEnabled(row, 'quality')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'quality'))}
                        title={!isRejectionEnabled(row, 'quality') ? "Reject enabled only if Quality is NOT OK" : ""}
                      />
                    </td>
                    <td className="shearing-td shearing-td--rejected-input">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="form-control shearing-input shearing-input--rejected"
                        value={!isRejectionEnabled(row, 'sharpEdges') ? '0' : (row.rejectedQty[2] ?? '0')}
                        onChange={e => updateData(idx, 'rejectedQty', e.target.value.replace(/[^0-9]/g, ''), 2)}
                        onBlur={() => { if (!row.rejectedQty[2] && row.rejectedQty[2] !== 0) updateData(idx, 'rejectedQty', '0', 2); }}
                        disabled={!isRejectionEnabled(row, 'sharpEdges')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'sharpEdges'))}
                        title={!isRejectionEnabled(row, 'sharpEdges') ? "Reject enabled only if Sharp Edge is NOT OK" : ""}
                      />
                    </td>
                    <td className="shearing-td shearing-td--rejected-input">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="form-control shearing-input shearing-input--rejected"
                        value={!isRejectionEnabled(row, 'crackedEdges') ? '0' : (row.rejectedQty[3] ?? '0')}
                        onChange={e => updateData(idx, 'rejectedQty', e.target.value.replace(/[^0-9]/g, ''), 3)}
                        onBlur={() => { if (!row.rejectedQty[3] && row.rejectedQty[3] !== 0) updateData(idx, 'rejectedQty', '0', 3); }}
                        disabled={!isRejectionEnabled(row, 'crackedEdges')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'crackedEdges'))}
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
                        {[
                          { key: 'length', sIdx: 0, label: 'Length' },
                          { key: 'quality', sIdx: 1, label: 'Quality' },
                          { key: 'sharpEdges', sIdx: 2, label: 'Sharp' },
                          { key: 'crackedEdges', sIdx: 3, label: 'Cracked' }
                        ].map(({ key, sIdx, label }) => {
                          const active = isRejectionEnabled(row, key);
                          return (
                            <div key={sIdx} className="shearing-mobile-rejected-item">
                              <span style={{ fontSize: '10px', color: '#666', display: 'block' }}>{label}</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                className="form-control"
                                value={!active ? '0' : (row.rejectedQty[sIdx] ?? '0')}
                                onChange={e => updateData(idx, 'rejectedQty', e.target.value.replace(/[^0-9]/g, ''), sIdx)}
                                onBlur={() => { if (!row.rejectedQty[sIdx] && row.rejectedQty[sIdx] !== 0) updateData(idx, 'rejectedQty', '0', sIdx); }}
                                disabled={!active}
                                style={getRejectionStyle(active)}
                                title={!active ? "Reject enabled only if out of tolerance/NOT OK" : ""}
                              />
                            </div>
                          );
                        })}
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
                              style={getToleranceStyle('lengthCutBar', row.lengthCutBar[sampleIdx], productType)}
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

