import React, { useState } from 'react';
import './TestingFinishingSection.css';
import { getToleranceStyle, checkTolerance } from '../../utils/toleranceValidation';

const TestingFinishingSection = ({
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

  const clearHour = (newData, idx) => {
    newData[idx] = {
      ...newData[idx],
      lotNo: '',
      toeLoad: ['', ''],
      weight: ['', ''],
      paintIdentification: ['', ''],
      ercCoating: ['', ''],
      toeLoadRejected: '',
      weightRejected: '',
      paintIdentificationRejected: '',
      ercCoatingRejected: '',
      remarks: ''
    };
  };

  const updateData = (idx, field, value, sampleIndex = null) => {
    const newData = [...data];
    if (field === 'noProduction') {
      newData[idx].noProduction = !!value;
      if (value) clearHour(newData, idx);
      onDataChange(newData);
      return;
    }

    if (sampleIndex !== null && Array.isArray(newData[idx][field])) {
      const fieldArray = [...newData[idx][field]];
      fieldArray[sampleIndex] = value;
      newData[idx][field] = fieldArray;
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
  const isRejectionEnabled = (row, field) => {
    if (row.noProduction || !row.lotNo) return false;

    if (field === 'toeLoad') {
      return row.toeLoad?.some(val => {
        const { isValid, isApplicable } = checkTolerance('toeLoad', val, productType);
        return isApplicable && !isValid;
      });
    }
    if (field === 'weight') {
      return row.weight?.some(val => {
        const { isValid, isApplicable } = checkTolerance('weight', val, productType);
        return isApplicable && !isValid;
      });
    }

    // For dropdowns (OK/not ok)
    // Fields: paintIdentification, ercCoating
    return row[field]?.some(val => val === 'not ok' || val === 'NOT OK');
  };

  return (
    <div className="testing-finishing-section">
      <div className="testing-finishing-section__header">
        <div>
          <h3 className="testing-finishing-section__title">Testing & Finishing Section</h3>
          <p className="testing-finishing-section__subtitle">Enter hourly testing and finishing data</p>
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
          className="btn btn-secondary testing-finishing-section__toggle"
          onClick={onToggleShowAll}
          title={showAll ? 'Show current hour only' : 'Show all 8 hours'}
        >
          {showAll ? '\u2212' : '+'}
        </button>
      </div>

      {expanded && (
        <div className="testing-finishing-table-wrapper">
          <table className="testing-finishing-table">
            <tbody>
              {visibleRows(data, showAll).map(({ row, idx }) => (
                <React.Fragment key={row.hour}>
                  <tr className={`testing-finishing-header-row ${row.noProduction ? 'no-production' : ''}`}>
                    <th className="testing-finishing-th testing-finishing-th--time">Time Range</th>
                    <th className="testing-finishing-th testing-finishing-th--checkbox">No Production</th>
                    <th className="testing-finishing-th testing-finishing-th--lot">Lot No.</th>
                    <th className="testing-finishing-th testing-finishing-th--toe-load">Toe Load</th>
                    <th className="testing-finishing-th testing-finishing-th--weight">Weight</th>
                    <th className="testing-finishing-th testing-finishing-th--paint">Paint Identification</th>
                    <th className="testing-finishing-th testing-finishing-th--erc-coating">ERC Coating (Linseed Oil)</th>
                  </tr>

                  <tr className={`testing-finishing-row ${row.noProduction ? 'no-production' : ''}`}>
                    <td rowSpan="4" className="testing-finishing-td testing-finishing-td--time">
                      <strong>{hourLabels[idx]}</strong>
                    </td>
                    <td rowSpan="4" className="testing-finishing-td testing-finishing-td--checkbox">
                      <input
                        type="checkbox"
                        checked={row.noProduction}
                        onChange={e => updateData(idx, 'noProduction', e.target.checked)}
                        className="testing-finishing-checkbox"
                      />
                    </td>
                    <td rowSpan="2" className="testing-finishing-td testing-finishing-td--lot">
                      <select
                        className="form-control testing-finishing-select"
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

                    <td className="testing-finishing-td testing-finishing-td--toe-load-input">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control testing-finishing-input"
                        placeholder="Float"
                        value={row.toeLoad[0] || ''}
                        onChange={e => updateData(idx, 'toeLoad', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getToleranceStyle('toeLoad', row.toeLoad[0], productType)}
                      />
                    </td>

                    <td className="testing-finishing-td testing-finishing-td--weight-input">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control testing-finishing-input"
                        placeholder="Float"
                        value={row.weight[0] || ''}
                        onChange={e => updateData(idx, 'weight', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getToleranceStyle('weight', row.weight[0], productType)}
                      />
                    </td>

                    <td className="testing-finishing-td testing-finishing-td--paint-input">
                      <select
                        className="form-control testing-finishing-select"
                        value={row.paintIdentification[0] || ''}
                        onChange={e => updateData(idx, 'paintIdentification', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="not ok">not ok</option>
                      </select>
                    </td>

                    <td className="testing-finishing-td testing-finishing-td--erc-coating-input">
                      <select
                        className="form-control testing-finishing-select"
                        value={row.ercCoating[0] || ''}
                        onChange={e => updateData(idx, 'ercCoating', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="not ok">not ok</option>
                      </select>
                    </td>
                  </tr>

                  <tr className={`testing-finishing-row ${row.noProduction ? 'no-production' : ''}`}>
                    <td className="testing-finishing-td testing-finishing-td--toe-load-input">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control testing-finishing-input"
                        placeholder="Float"
                        value={row.toeLoad[1] || ''}
                        onChange={e => updateData(idx, 'toeLoad', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getToleranceStyle('toeLoad', row.toeLoad[1], productType)}
                      />
                    </td>

                    <td className="testing-finishing-td testing-finishing-td--weight-input">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control testing-finishing-input"
                        placeholder="Float"
                        value={row.weight[1] || ''}
                        onChange={e => updateData(idx, 'weight', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getToleranceStyle('weight', row.weight[1], productType)}
                      />
                    </td>

                    <td className="testing-finishing-td testing-finishing-td--paint-input">
                      <select
                        className="form-control testing-finishing-select"
                        value={row.paintIdentification[1] || ''}
                        onChange={e => updateData(idx, 'paintIdentification', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="not ok">not ok</option>
                      </select>
                    </td>

                    <td className="testing-finishing-td testing-finishing-td--erc-coating-input">
                      <select
                        className="form-control testing-finishing-select"
                        value={row.ercCoating[1] || ''}
                        onChange={e => updateData(idx, 'ercCoating', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="not ok">not ok</option>
                      </select>
                    </td>
                  </tr>

                  <tr className={`testing-finishing-row testing-finishing-row--rejected ${row.noProduction ? 'no-production' : ''}`}>
                    <td className="testing-finishing-td testing-finishing-td--rejected-label">
                      <span className="testing-finishing-rejected-label">Rejected No.</span>
                    </td>
                    <td className="testing-finishing-td testing-finishing-td--rejected-input">
                      <input type="number" value={row.toeLoadRejected || ''} onChange={e => updateData(idx, 'toeLoadRejected', e.target.value)} disabled={!isRejectionEnabled(row, 'toeLoad')} />
                    </td>
                    <td className="testing-finishing-td testing-finishing-td--rejected-input">
                      <input type="number" value={row.weightRejected || ''} onChange={e => updateData(idx, 'weightRejected', e.target.value)} disabled={!isRejectionEnabled(row, 'weight')} />
                    </td>
                    <td className="testing-finishing-td testing-finishing-td--rejected-input">
                      <input type="number" value={row.paintIdentificationRejected || ''} onChange={e => updateData(idx, 'paintIdentificationRejected', e.target.value)} disabled={!isRejectionEnabled(row, 'paintIdentification')} />
                    </td>
                    <td className="testing-finishing-td testing-finishing-td--rejected-input">
                      <input type="number" value={row.ercCoatingRejected || ''} onChange={e => updateData(idx, 'ercCoatingRejected', e.target.value)} disabled={!isRejectionEnabled(row, 'ercCoating')} />
                    </td>
                  </tr>

                  <tr className={`testing-finishing-row testing-finishing-row--remarks ${row.noProduction ? 'no-production' : ''}`}>
                    <td className="testing-finishing-td testing-finishing-td--remarks-label">
                      <span className="testing-finishing-remarks-label">Remarks</span>
                    </td>
                    <td colSpan="4" className="testing-finishing-td testing-finishing-td--remarks-input">
                      <input
                        type="text"
                        className="form-control testing-finishing-input"
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
          <div className="testing-finishing-mobile-cards">
            {visibleRows(data, showAll).map(({ row, idx }) => (
              <div key={row.hour} className={`testing-finishing-mobile-card ${row.noProduction ? 'no-production' : ''}`}>
                <div className="testing-finishing-mobile-card__header">
                  <span className="testing-finishing-mobile-card__time">{hourLabels[idx]}</span>
                  <label className="testing-finishing-mobile-checkbox-label">
                    <input
                      type="checkbox"
                      checked={row.noProduction}
                      onChange={e => updateData(idx, 'noProduction', e.target.checked)}
                      className="testing-finishing-checkbox"
                    />
                    <span>No Prod</span>
                  </label>
                </div>
                <div className="testing-finishing-mobile-card__body">
                  <div className="testing-finishing-mobile-field">
                    <span className="testing-finishing-mobile-field__label">Lot No.</span>
                    <div className="testing-finishing-mobile-field__value">
                      <select
                        value={row.lotNo}
                        onChange={e => updateData(idx, 'lotNo', e.target.value)}
                        disabled={row.noProduction || !row.lotNo}
                      >
                        <option value="">Select Lot No.</option>
                        {availableLotNumbers.map(lot => (
                          <option key={lot} value={lot}>{lot}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="testing-finishing-mobile-field">
                    <span className="testing-finishing-mobile-field__label">Toe Load</span>
                    <div className="testing-finishing-mobile-field__value testing-finishing-mobile-field__value--multi">
                      {[0, 1].map(sampleIdx => (
                        <input
                          key={sampleIdx}
                          type="number"
                          step="0.01"
                          placeholder={`S${sampleIdx + 1}`}
                          value={row.toeLoad[sampleIdx] || ''}
                          onChange={e => updateData(idx, 'toeLoad', e.target.value, sampleIdx)}
                          disabled={row.noProduction || !row.lotNo}
                          style={getToleranceStyle('toeLoad', row.toeLoad[sampleIdx], productType)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="testing-finishing-mobile-field">
                    <span className="testing-finishing-mobile-field__label">Weight</span>
                    <div className="testing-finishing-mobile-field__value testing-finishing-mobile-field__value--multi">
                      {[0, 1].map(sampleIdx => (
                        <input
                          key={sampleIdx}
                          type="number"
                          step="0.01"
                          placeholder={`S${sampleIdx + 1}`}
                          value={row.weight[sampleIdx] || ''}
                          onChange={e => updateData(idx, 'weight', e.target.value, sampleIdx)}
                          disabled={row.noProduction || !row.lotNo}
                          style={getToleranceStyle('weight', row.weight[sampleIdx], productType)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="testing-finishing-mobile-field">
                    <span className="testing-finishing-mobile-field__label">Paint Identification</span>
                    <div className="testing-finishing-mobile-field__value testing-finishing-mobile-field__value--multi">
                      {[0, 1].map(sampleIdx => (
                        <select
                          key={sampleIdx}
                          value={row.paintIdentification[sampleIdx] || ''}
                          onChange={e => updateData(idx, 'paintIdentification', e.target.value, sampleIdx)}
                          disabled={row.noProduction || !row.lotNo}
                        >
                          <option value="">S{sampleIdx + 1}</option>
                          <option value="OK">OK</option>
                          <option value="not ok">not ok</option>
                        </select>
                      ))}
                    </div>
                  </div>

                  <div className="testing-finishing-mobile-field">
                    <span className="testing-finishing-mobile-field__label">ERC Coating (Linseed Oil)</span>
                    <div className="testing-finishing-mobile-field__value testing-finishing-mobile-field__value--multi">
                      {[0, 1].map(sampleIdx => (
                        <select
                          key={sampleIdx}
                          value={row.ercCoating[sampleIdx] || ''}
                          onChange={e => updateData(idx, 'ercCoating', e.target.value, sampleIdx)}
                          disabled={row.noProduction || !row.lotNo}
                        >
                          <option value="">S{sampleIdx + 1}</option>
                          <option value="OK">OK</option>
                          <option value="not ok">not ok</option>
                        </select>
                      ))}
                    </div>
                  </div>

                  <div className="testing-finishing-mobile-field">
                    <span className="testing-finishing-mobile-field__label">Rejected No. (Toe Load)</span>
                    <div className="testing-finishing-mobile-field__value">
                      <input
                        type="number"
                        value={row.toeLoadRejected || ''}
                        onChange={e => updateData(idx, 'toeLoadRejected', e.target.value)}
                        disabled={!isRejectionEnabled(row, 'toeLoad')}
                      />
                    </div>
                  </div>

                  <div className="testing-finishing-mobile-field">
                    <span className="testing-finishing-mobile-field__label">Rejected No. (Weight)</span>
                    <div className="testing-finishing-mobile-field__value">
                      <input
                        type="number"
                        value={row.weightRejected || ''}
                        onChange={e => updateData(idx, 'weightRejected', e.target.value)}
                        disabled={!isRejectionEnabled(row, 'weight')}
                      />
                    </div>
                  </div>

                  <div className="testing-finishing-mobile-field">
                    <span className="testing-finishing-mobile-field__label">Rejected No. (Paint ID)</span>
                    <div className="testing-finishing-mobile-field__value">
                      <input
                        type="number"
                        value={row.paintIdentificationRejected || ''}
                        onChange={e => updateData(idx, 'paintIdentificationRejected', e.target.value)}
                        disabled={!isRejectionEnabled(row, 'paintIdentification')}
                      />
                    </div>
                  </div>

                  <div className="testing-finishing-mobile-field">
                    <span className="testing-finishing-mobile-field__label">Rejected No. (ERC Coating)</span>
                    <div className="testing-finishing-mobile-field__value">
                      <input
                        type="number"
                        value={row.ercCoatingRejected || ''}
                        onChange={e => updateData(idx, 'ercCoatingRejected', e.target.value)}
                        disabled={!isRejectionEnabled(row, 'ercCoating')}
                      />
                    </div>
                  </div>

                  <div className="testing-finishing-mobile-field">
                    <span className="testing-finishing-mobile-field__label">Remarks</span>
                    <div className="testing-finishing-mobile-field__value">
                      <input
                        type="text"
                        value={row.remarks}
                        onChange={e => updateData(idx, 'remarks', e.target.value)}
                        disabled={row.noProduction}
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

export default TestingFinishingSection;

