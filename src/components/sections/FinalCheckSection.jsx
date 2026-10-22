import React, { useState } from 'react';
import './FinalCheckSection.css';
import { getToleranceStyle, checkTolerance, getRejectionStyle, getSelectToleranceStyle } from '../../utils/toleranceValidation';

const FinalCheckSection = ({
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

  const updateData = (idx, field, value, sampleIndex = null) => {
    const newData = [...data];
    if (sampleIndex !== null && Array.isArray(newData[idx][field])) {
      const fieldArray = [...newData[idx][field]];
      fieldArray[sampleIndex] = value;
      newData[idx][field] = fieldArray;
    } else {
      newData[idx][field] = value;
    }
    onDataChange(newData);
  };

  const clearHour = (updated, idx) => {
    const base = updated[idx] || {};
    updated[idx] = {
      ...base,
      lotNo: '',
      boxGauge: [],
      flatBearingArea: [],
      fallingGauge: [],
      surfaceDefect: [],
      embossingDefect: [],
      marking: [],
      temperingHardness: [],
      boxGaugeRejected: '0',
      flatBearingAreaRejected: '0',
      fallingGaugeRejected: '0',
      surfaceDefectRejected: '0',
      embossingDefectRejected: '0',
      markingRejected: '0',
      temperingHardnessRejected: '0',
      remarks: '',
      noProduction: true
    };
  };

  const wrappedUpdateData = (idx, field, value, sampleIndex = null) => {
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

    if (sampleIndex !== null) {
      if (!Array.isArray(newData[idx][field])) newData[idx][field] = [];
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

    if (field === 'temperingHardness') {
      return row.temperingHardness?.some(val => {
        const { isValid, isApplicable } = checkTolerance('temperingHardness', val, productType);
        return isApplicable && !isValid;
      });
    }

    // For dropdowns (OK/NOT OK)
    // Fields: boxGauge, flatBearingArea, fallingGauge, surfaceDefect, embossingDefect, marking
    return row[field]?.some(val => String(val || '').trim().toUpperCase() === 'NOT OK');
  };

  return (
    <div className="final-check-section">
      <div className="final-check-section__header">
        <div>
          <h3 className="final-check-section__title">Final Check Section</h3>
          <p className="final-check-section__subtitle">Enter hourly final check data</p>
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
          className="btn btn-secondary final-check-section__toggle"
          onClick={onToggleShowAll}
          title={showAll ? 'Show current hour only' : 'Show all 8 hours'}
        >
          {showAll ? '\u2212' : '+'}
        </button>
      </div>

      {expanded && (
        <div className="final-check-table-wrapper">
          {/* Desktop Table Layout */}
          <table className="final-check-table">
            <tbody>
              {visibleRows(data, showAll).map(({ row, idx }) => (
                <React.Fragment key={row.hour}>
                  {/* Header row for this hour block */}
                  <tr className="final-check-header-row">
                    <th className="final-check-th final-check-th--time">Time Range</th>
                    <th className="final-check-th final-check-th--checkbox">No Production</th>
                    <th className="final-check-th final-check-th--lot">Lot No.</th>
                    <th className="final-check-th final-check-th--box-gauge">Box Gauge</th>
                    <th className="final-check-th final-check-th--flat-bearing">Flat Bearing Area</th>
                    <th className="final-check-th final-check-th--falling-gauge">Falling Gauge</th>
                    <th className="final-check-th final-check-th--surface-defect">Surface Defect</th>
                    <th className="final-check-th final-check-th--embossing-defect">Embossing Defect</th>
                    <th className="final-check-th final-check-th--marking">Marking</th>
                    <th className="final-check-th final-check-th--tempering-hardness">Tempering Hardness (HRC)</th>
                  </tr>
                  {/* Row 1: First sample */}

                  <tr className={`final-check-row${row.noProduction ? ' no-production' : ''}`}>

                    <td rowSpan="4" className="final-check-td final-check-td--time">
                      <strong>{hourLabels[idx]}</strong>
                    </td>
                    <td rowSpan="4" className="final-check-td final-check-td--checkbox">
                      <input
                        type="checkbox"
                        checked={row.noProduction}
                        onChange={e => wrappedUpdateData(idx, 'noProduction', e.target.checked)}
                        className="final-check-checkbox"
                      />
                    </td>
                    <td rowSpan="2" className="final-check-td final-check-td--lot">
                      <select
                        className="form-control final-check-select"
                        value={row.lotNo}
                        onChange={e => wrappedUpdateData(idx, 'lotNo', e.target.value)}
                        disabled={row.noProduction}
                      >
                        <option value="">Select Lot No.</option>
                        {availableLotNumbers.map(lot => (
                          <option key={lot} value={lot}>{lot}</option>
                        ))}
                      </select>
                    </td>
                    <td className="final-check-td final-check-td--box-gauge-input">
                      <select
                        className="form-control final-check-select"
                        value={row.boxGauge[0] || ''}
                        onChange={e => wrappedUpdateData(idx, 'boxGauge', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getSelectToleranceStyle(row.boxGauge[0])}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="Not OK">Not OK</option>
                      </select>
                    </td>
                    <td className="final-check-td final-check-td--flat-bearing-input">
                      <select
                        className="form-control final-check-select"
                        value={row.flatBearingArea[0] || ''}
                        onChange={e => wrappedUpdateData(idx, 'flatBearingArea', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getSelectToleranceStyle(row.flatBearingArea[0])}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="Not OK">Not OK</option>
                      </select>
                    </td>
                    <td className="final-check-td final-check-td--falling-gauge-input">
                      <select
                        className="form-control final-check-select"
                        value={row.fallingGauge[0] || ''}
                        onChange={e => wrappedUpdateData(idx, 'fallingGauge', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getSelectToleranceStyle(row.fallingGauge[0])}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="Not OK">Not OK</option>
                      </select>
                    </td>
                    <td className="final-check-td final-check-td--surface-defect-input">
                      <select
                        className="form-control final-check-select"
                        value={row.surfaceDefect[0] || ''}
                        onChange={e => wrappedUpdateData(idx, 'surfaceDefect', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getSelectToleranceStyle(row.surfaceDefect[0])}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="Not OK">Not OK</option>
                      </select>
                    </td>
                    <td className="final-check-td final-check-td--embossing-defect-input">
                      <select
                        className="form-control final-check-select"
                        value={row.embossingDefect[0] || ''}
                        onChange={e => wrappedUpdateData(idx, 'embossingDefect', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getSelectToleranceStyle(row.embossingDefect[0])}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="Not OK">Not OK</option>
                      </select>
                    </td>
                    <td className="final-check-td final-check-td--marking-input">
                      <select
                        className="form-control final-check-select"
                        value={row.marking[0] || ''}
                        onChange={e => wrappedUpdateData(idx, 'marking', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getSelectToleranceStyle(row.marking[0])}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="Not OK">Not OK</option>
                      </select>
                    </td>
                    <td className="final-check-td final-check-td--tempering-hardness-input">
                      <input
                        type="number"
                        className="form-control final-check-input"
                        placeholder="HRC"
                        value={row.temperingHardness[0] || ''}
                        onChange={e => wrappedUpdateData(idx, 'temperingHardness', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getToleranceStyle('temperingHardness', row.temperingHardness[0], productType)}
                      />
                    </td>
                  </tr>
                  {/* Row 2: Second sample */}
                  <tr className={`final-check-row${row.noProduction ? ' no-production' : ''}`}>
                    <td className="final-check-td final-check-td--box-gauge-input">
                      <select
                        className="form-control final-check-select"
                        value={row.boxGauge[1] || ''}
                        onChange={e => wrappedUpdateData(idx, 'boxGauge', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getSelectToleranceStyle(row.boxGauge[1])}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="Not OK">Not OK</option>
                      </select>
                    </td>
                    <td className="final-check-td final-check-td--flat-bearing-input">
                      <select
                        className="form-control final-check-select"
                        value={row.flatBearingArea[1] || ''}
                        onChange={e => wrappedUpdateData(idx, 'flatBearingArea', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getSelectToleranceStyle(row.flatBearingArea[1])}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="Not OK">Not OK</option>
                      </select>
                    </td>
                    <td className="final-check-td final-check-td--falling-gauge-input">
                      <select
                        className="form-control final-check-select"
                        value={row.fallingGauge[1] || ''}
                        onChange={e => wrappedUpdateData(idx, 'fallingGauge', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getSelectToleranceStyle(row.fallingGauge[1])}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="Not OK">Not OK</option>
                      </select>
                    </td>
                    <td className="final-check-td final-check-td--surface-defect-input">
                      <select
                        className="form-control final-check-select"
                        value={row.surfaceDefect[1] || ''}
                        onChange={e => wrappedUpdateData(idx, 'surfaceDefect', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getSelectToleranceStyle(row.surfaceDefect[1])}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="Not OK">Not OK</option>
                      </select>
                    </td>
                    <td className="final-check-td final-check-td--embossing-defect-input">
                      <select
                        className="form-control final-check-select"
                        value={row.embossingDefect[1] || ''}
                        onChange={e => wrappedUpdateData(idx, 'embossingDefect', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getSelectToleranceStyle(row.embossingDefect[1])}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="Not OK">Not OK</option>
                      </select>
                    </td>
                    <td className="final-check-td final-check-td--marking-input">
                      <select
                        className="form-control final-check-select"
                        value={row.marking[1] || ''}
                        onChange={e => wrappedUpdateData(idx, 'marking', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getSelectToleranceStyle(row.marking[1])}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="Not OK">Not OK</option>
                      </select>
                    </td>
                    <td className="final-check-td final-check-td--tempering-hardness-input">
                      <input
                        type="number"
                        className="form-control final-check-input"
                        placeholder="HRC"
                        value={row.temperingHardness[1] || ''}
                        onChange={e => wrappedUpdateData(idx, 'temperingHardness', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getToleranceStyle('temperingHardness', row.temperingHardness[1], productType)}
                      />
                    </td>
                  </tr>
                  {/* Row 3: Rejected No. - 7 separate inputs */}
                  <tr className={`final-check-row${row.noProduction ? ' no-production' : ''}`}>
                    <td className="final-check-td final-check-td--lot">
                      <span className="final-check-rejected-label">Rejected No.</span>
                    </td>
                    <td className="final-check-td final-check-td--rejected-input">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="form-control final-check-input"
                        value={!isRejectionEnabled(row, 'boxGauge') ? '0' : (row.boxGaugeRejected ?? '0')}
                        onChange={e => wrappedUpdateData(idx, 'boxGaugeRejected', e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={() => {
                          if (!row.boxGaugeRejected && row.boxGaugeRejected !== 0) {
                            wrappedUpdateData(idx, 'boxGaugeRejected', '0');
                          }
                        }}
                        disabled={!isRejectionEnabled(row, 'boxGauge')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'boxGauge'))}
                      />
                    </td>
                    <td className="final-check-td final-check-td--rejected-input">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="form-control final-check-input"
                        value={!isRejectionEnabled(row, 'flatBearingArea') ? '0' : (row.flatBearingAreaRejected ?? '0')}
                        onChange={e => updateData(idx, 'flatBearingAreaRejected', e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={() => {
                          if (!row.flatBearingAreaRejected && row.flatBearingAreaRejected !== 0) {
                            updateData(idx, 'flatBearingAreaRejected', '0');
                          }
                        }}
                        disabled={!isRejectionEnabled(row, 'flatBearingArea')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'flatBearingArea'))}
                      />
                    </td>
                    <td className="final-check-td final-check-td--rejected-input">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="form-control final-check-input"
                        value={!isRejectionEnabled(row, 'fallingGauge') ? '0' : (row.fallingGaugeRejected ?? '0')}
                        onChange={e => updateData(idx, 'fallingGaugeRejected', e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={() => {
                          if (!row.fallingGaugeRejected && row.fallingGaugeRejected !== 0) {
                            updateData(idx, 'fallingGaugeRejected', '0');
                          }
                        }}
                        disabled={!isRejectionEnabled(row, 'fallingGauge')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'fallingGauge'))}
                      />
                    </td>
                    <td className="final-check-td final-check-td--rejected-input">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="form-control final-check-input"
                        value={!isRejectionEnabled(row, 'surfaceDefect') ? '0' : (row.surfaceDefectRejected ?? '0')}
                        onChange={e => updateData(idx, 'surfaceDefectRejected', e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={() => {
                          if (!row.surfaceDefectRejected && row.surfaceDefectRejected !== 0) {
                            updateData(idx, 'surfaceDefectRejected', '0');
                          }
                        }}
                        disabled={!isRejectionEnabled(row, 'surfaceDefect')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'surfaceDefect'))}
                      />
                    </td>
                    <td className="final-check-td final-check-td--rejected-input">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="form-control final-check-input"
                        value={!isRejectionEnabled(row, 'embossingDefect') ? '0' : (row.embossingDefectRejected ?? '0')}
                        onChange={e => updateData(idx, 'embossingDefectRejected', e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={() => {
                          if (!row.embossingDefectRejected && row.embossingDefectRejected !== 0) {
                            updateData(idx, 'embossingDefectRejected', '0');
                          }
                        }}
                        disabled={!isRejectionEnabled(row, 'embossingDefect')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'embossingDefect'))}
                      />
                    </td>
                    <td className="final-check-td final-check-td--rejected-input">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="form-control final-check-input"
                        value={!isRejectionEnabled(row, 'marking') ? '0' : (row.markingRejected ?? '0')}
                        onChange={e => updateData(idx, 'markingRejected', e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={() => {
                          if (!row.markingRejected && row.markingRejected !== 0) {
                            updateData(idx, 'markingRejected', '0');
                          }
                        }}
                        disabled={!isRejectionEnabled(row, 'marking')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'marking'))}
                      />
                    </td>
                    <td className="final-check-td final-check-td--rejected-input">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="form-control final-check-input"
                        value={!isRejectionEnabled(row, 'temperingHardness') ? '0' : (row.temperingHardnessRejected ?? '0')}
                        onChange={e => updateData(idx, 'temperingHardnessRejected', e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={() => {
                          if (!row.temperingHardnessRejected && row.temperingHardnessRejected !== 0) {
                            updateData(idx, 'temperingHardnessRejected', '0');
                          }
                        }}
                        disabled={!isRejectionEnabled(row, 'temperingHardness')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'temperingHardness'))}
                      />
                    </td>
                  </tr>
                  {/* Row 4: Remarks */}
                  <tr className={`final-check-row${row.noProduction ? ' no-production' : ''}`}>
                    <td className="final-check-td final-check-td--remarks-label">
                      <span className="final-check-remarks-label">Remarks</span>
                    </td>
                    <td colSpan="8" className="final-check-td final-check-td--remarks-input">
                      <input
                        type="text"
                        className="form-control final-check-input"
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
          <div className="final-check-mobile-cards">
            {visibleRows(data, showAll).map(({ row, idx }) => (
              <div key={row.hour} className="final-check-mobile-card">
                <div className="final-check-mobile-card__header">
                  <span className="final-check-mobile-card__time">{hourLabels[idx]}</span>
                  <label className="final-check-mobile-checkbox-label">
                    <input
                      type="checkbox"
                      checked={row.noProduction}
                      onChange={e => updateData(idx, 'noProduction', e.target.checked)}
                      className="final-check-checkbox"
                    />
                    <span>No Prod</span>
                  </label>
                </div>
                <div className="final-check-mobile-card__body">
                  <div className="final-check-mobile-field">
                    <span className="final-check-mobile-field__label">Lot No.</span>
                    <div className="final-check-mobile-field__value">
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
                  <div className="final-check-mobile-field">
                    <span className="final-check-mobile-field__label">Box Gauge</span>
                    <div className="final-check-mobile-field__value final-check-mobile-field__value--multi">
                      {[0, 1].map(sampleIdx => (
                        <select
                          key={sampleIdx}
                          value={row.boxGauge[sampleIdx] || ''}
                          onChange={e => updateData(idx, 'boxGauge', e.target.value, sampleIdx)}
                          disabled={row.noProduction || !row.lotNo}
                          style={getSelectToleranceStyle(row.boxGauge[sampleIdx])}
                        >
                          <option value="">S{sampleIdx + 1}</option>
                          <option value="OK">OK</option>
                          <option value="Not OK">Not OK</option>
                        </select>
                      ))}
                    </div>
                  </div>
                  <div className="final-check-mobile-field">
                    <span className="final-check-mobile-field__label">Flat Bearing Area</span>
                    <div className="final-check-mobile-field__value final-check-mobile-field__value--multi">
                      {[0, 1].map(sampleIdx => (
                        <select
                          key={sampleIdx}
                          value={row.flatBearingArea[sampleIdx] || ''}
                          onChange={e => updateData(idx, 'flatBearingArea', e.target.value, sampleIdx)}
                          disabled={row.noProduction || !row.lotNo}
                          style={getSelectToleranceStyle(row.flatBearingArea[sampleIdx])}
                        >
                          <option value="">S{sampleIdx + 1}</option>
                          <option value="OK">OK</option>
                          <option value="Not OK">Not OK</option>
                        </select>
                      ))}
                    </div>
                  </div>
                  <div className="final-check-mobile-field">
                    <span className="final-check-mobile-field__label">Falling Gauge</span>
                    <div className="final-check-mobile-field__value final-check-mobile-field__value--multi">
                      {[0, 1].map(sampleIdx => (
                        <select
                          key={sampleIdx}
                          value={row.fallingGauge[sampleIdx] || ''}
                          onChange={e => updateData(idx, 'fallingGauge', e.target.value, sampleIdx)}
                          disabled={row.noProduction || !row.lotNo}
                          style={getSelectToleranceStyle(row.fallingGauge[sampleIdx])}
                        >
                          <option value="">S{sampleIdx + 1}</option>
                          <option value="OK">OK</option>
                          <option value="Not OK">Not OK</option>
                        </select>
                      ))}
                    </div>
                  </div>
                  <div className="final-check-mobile-field">
                    <span className="final-check-mobile-field__label">Surface Defect</span>
                    <div className="final-check-mobile-field__value final-check-mobile-field__value--multi">
                      {[0, 1].map(sampleIdx => (
                        <select
                          key={sampleIdx}
                          value={row.surfaceDefect[sampleIdx] || ''}
                          onChange={e => updateData(idx, 'surfaceDefect', e.target.value, sampleIdx)}
                          disabled={row.noProduction || !row.lotNo}
                          style={getSelectToleranceStyle(row.surfaceDefect[sampleIdx])}
                        >
                          <option value="">S{sampleIdx + 1}</option>
                          <option value="OK">OK</option>
                          <option value="Not OK">Not OK</option>
                        </select>
                      ))}
                    </div>
                  </div>
                  <div className="final-check-mobile-field">
                    <span className="final-check-mobile-field__label">Embossing Defect</span>
                    <div className="final-check-mobile-field__value final-check-mobile-field__value--multi">
                      {[0, 1].map(sampleIdx => (
                        <select
                          key={sampleIdx}
                          value={row.embossingDefect[sampleIdx] || ''}
                          onChange={e => updateData(idx, 'embossingDefect', e.target.value, sampleIdx)}
                          disabled={row.noProduction || !row.lotNo}
                          style={getSelectToleranceStyle(row.embossingDefect[sampleIdx])}
                        >
                          <option value="">S{sampleIdx + 1}</option>
                          <option value="OK">OK</option>
                          <option value="Not OK">Not OK</option>
                        </select>
                      ))}
                    </div>
                  </div>
                  <div className="final-check-mobile-field">
                    <span className="final-check-mobile-field__label">Marking</span>
                    <div className="final-check-mobile-field__value final-check-mobile-field__value--multi">
                      {[0, 1].map(sampleIdx => (
                        <select
                          key={sampleIdx}
                          value={row.marking[sampleIdx] || ''}
                          onChange={e => updateData(idx, 'marking', e.target.value, sampleIdx)}
                          disabled={row.noProduction || !row.lotNo}
                          style={getSelectToleranceStyle(row.marking[sampleIdx])}
                        >
                          <option value="">S{sampleIdx + 1}</option>
                          <option value="OK">OK</option>
                          <option value="Not OK">Not OK</option>
                        </select>
                      ))}
                    </div>
                  </div>
                  <div className="final-check-mobile-field">
                    <span className="final-check-mobile-field__label">Tempering Hardness (HRC)</span>
                    <div className="final-check-mobile-field__value final-check-mobile-field__value--multi">
                      {[0, 1].map(sampleIdx => (
                        <input
                          key={sampleIdx}
                          type="number"
                          placeholder={`S${sampleIdx + 1}`}
                          value={row.temperingHardness?.[sampleIdx] || ''}
                          onChange={e => updateData(idx, 'temperingHardness', e.target.value, sampleIdx)}
                          disabled={row.noProduction || !row.lotNo}
                          style={getToleranceStyle('temperingHardness', row.temperingHardness?.[sampleIdx], productType)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="final-check-mobile-field">
                    <span className="final-check-mobile-field__label">Rejected No. (Box Gauge)</span>
                    <div className="final-check-mobile-field__value">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={!isRejectionEnabled(row, 'boxGauge') ? '0' : (row.boxGaugeRejected ?? '0')}
                        onChange={e => updateData(idx, 'boxGaugeRejected', e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={() => {
                          if (!row.boxGaugeRejected && row.boxGaugeRejected !== 0) {
                            updateData(idx, 'boxGaugeRejected', '0');
                          }
                        }}
                        disabled={!isRejectionEnabled(row, 'boxGauge')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'boxGauge'))}
                      />
                    </div>
                  </div>
                  <div className="final-check-mobile-field">
                    <span className="final-check-mobile-field__label">Rejected No. (Flat Bearing)</span>
                    <div className="final-check-mobile-field__value">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={!isRejectionEnabled(row, 'flatBearingArea') ? '0' : (row.flatBearingAreaRejected ?? '0')}
                        onChange={e => updateData(idx, 'flatBearingAreaRejected', e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={() => {
                          if (!row.flatBearingAreaRejected && row.flatBearingAreaRejected !== 0) {
                            updateData(idx, 'flatBearingAreaRejected', '0');
                          }
                        }}
                        disabled={!isRejectionEnabled(row, 'flatBearingArea')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'flatBearingArea'))}
                      />
                    </div>
                  </div>
                  <div className="final-check-mobile-field">
                    <span className="final-check-mobile-field__label">Rejected No. (Falling Gauge)</span>
                    <div className="final-check-mobile-field__value">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={!isRejectionEnabled(row, 'fallingGauge') ? '0' : (row.fallingGaugeRejected ?? '0')}
                        onChange={e => updateData(idx, 'fallingGaugeRejected', e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={() => {
                          if (!row.fallingGaugeRejected && row.fallingGaugeRejected !== 0) {
                            updateData(idx, 'fallingGaugeRejected', '0');
                          }
                        }}
                        disabled={!isRejectionEnabled(row, 'fallingGauge')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'fallingGauge'))}
                      />
                    </div>
                  </div>
                  <div className="final-check-mobile-field">
                    <span className="final-check-mobile-field__label">Rejected No. (Surface Defect)</span>
                    <div className="final-check-mobile-field__value">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={!isRejectionEnabled(row, 'surfaceDefect') ? '0' : (row.surfaceDefectRejected ?? '0')}
                        onChange={e => updateData(idx, 'surfaceDefectRejected', e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={() => {
                          if (!row.surfaceDefectRejected && row.surfaceDefectRejected !== 0) {
                            updateData(idx, 'surfaceDefectRejected', '0');
                          }
                        }}
                        disabled={!isRejectionEnabled(row, 'surfaceDefect')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'surfaceDefect'))}
                      />
                    </div>
                  </div>
                  <div className="final-check-mobile-field">
                    <span className="final-check-mobile-field__label">Rejected No. (Embossing Defect)</span>
                    <div className="final-check-mobile-field__value">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={!isRejectionEnabled(row, 'embossingDefect') ? '0' : (row.embossingDefectRejected ?? '0')}
                        onChange={e => updateData(idx, 'embossingDefectRejected', e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={() => {
                          if (!row.embossingDefectRejected && row.embossingDefectRejected !== 0) {
                            updateData(idx, 'embossingDefectRejected', '0');
                          }
                        }}
                        disabled={!isRejectionEnabled(row, 'embossingDefect')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'embossingDefect'))}
                      />
                    </div>
                  </div>
                  <div className="final-check-mobile-field">
                    <span className="final-check-mobile-field__label">Rejected No. (Marking)</span>
                    <div className="final-check-mobile-field__value">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={!isRejectionEnabled(row, 'marking') ? '0' : (row.markingRejected ?? '0')}
                        onChange={e => updateData(idx, 'markingRejected', e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={() => {
                          if (!row.markingRejected && row.markingRejected !== 0) {
                            updateData(idx, 'markingRejected', '0');
                          }
                        }}
                        disabled={!isRejectionEnabled(row, 'marking')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'marking'))}
                      />
                    </div>
                  </div>
                  <div className="final-check-mobile-field">
                    <span className="final-check-mobile-field__label">Rejected No. (Tempering Hardness)</span>
                    <div className="final-check-mobile-field__value">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={!isRejectionEnabled(row, 'temperingHardness') ? '0' : (row.temperingHardnessRejected ?? '0')}
                        onChange={e => updateData(idx, 'temperingHardnessRejected', e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={() => {
                          if (!row.temperingHardnessRejected && row.temperingHardnessRejected !== 0) {
                            updateData(idx, 'temperingHardnessRejected', '0');
                          }
                        }}
                        disabled={!isRejectionEnabled(row, 'temperingHardness')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'temperingHardness'))}
                      />
                    </div>
                  </div>
                  <div className="final-check-mobile-field">
                    <span className="final-check-mobile-field__label">Remarks</span>
                    <div className="final-check-mobile-field__value">
                      <input
                        type="text"
                        value={row.remarks}
                        onChange={e => updateData(idx, 'remarks', e.target.value)}
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

export default FinalCheckSection;

