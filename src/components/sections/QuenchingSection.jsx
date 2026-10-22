import React, { useState } from 'react';
import './QuenchingSection.css';
import { getToleranceStyle, checkTolerance, getRejectionStyle, getSelectToleranceStyle } from '../../utils/toleranceValidation';

const QuenchingSection = ({
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
      quenchingTemperature: ['', ''],
      quenchingDuration: ['', ''],
      quenchingHardness: ['', ''],
      boxGauge: ['', ''],
      flatBearingArea: ['', ''],
      fallingGauge: ['', ''],
      quenchingTemperatureRejected: '0',
      quenchingDurationRejected: '0',
      quenchingHardnessRejected: '0',
      boxGaugeRejected: '0',
      flatBearingAreaRejected: '0',
      fallingGaugeRejected: '0',
      rejectedQty: '0',
      remarks: ''
    };
  };

  const updateData = (idx, field, value, sampleIndex = null) => {
    const newData = [...data];
    // handle noProduction specially: if set true, clear the hour
    if (field === 'noProduction') {
      newData[idx].noProduction = !!value;
      if (value) {
        clearHour(newData, idx);
      }
      onDataChange(newData);
      return;
    }

    // normal updates
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

    if (field === 'quenchingTemperature') {
      const v0 = row.quenchingTemperature?.[0];
      const v1 = row.quenchingTemperature?.[1];
      const r0 = checkTolerance('quenchingTemperature', v0, productType);
      const r1 = checkTolerance('quenchingTemperature', v1, productType);
      return (r0.isApplicable && !r0.isValid) || (r1.isApplicable && !r1.isValid);
    }

    if (field === 'quenchingDuration' || field === 'quenchingHardness') {
      return false;
    }

    // For dropdowns (OK/NOT OK)
    // Fields: boxGauge, flatBearingArea, fallingGauge
    return row[field]?.some(val => String(val || '').trim().toUpperCase() === 'NOT OK');
  };



  return (
    <div className="quenching-section">
      <div className="quenching-section__header">
        <div>
          <h3 className="quenching-section__title">Quenching Section - 8 Hour Grid</h3>
          <p className="quenching-section__subtitle">Enter hourly quenching production data</p>
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
          className="btn btn-secondary quenching-section__toggle"
          onClick={onToggleShowAll}
          title={showAll ? 'Show current hour only' : 'Show all 8 hours'}
        >
          {showAll ? '\u2212' : '+'}
        </button>
      </div>

      {expanded && (
        <div className="quenching-table-wrapper">
          {/* Desktop Table Layout */}
          <table className="quenching-table">
            <tbody>
              {visibleRows(data, showAll).map(({ row, idx }) => (
                <React.Fragment key={row.hour}>
                  {/* Header row for this hour block */}
                  <tr className={`quenching-header-row ${row.noProduction ? 'no-production' : ''}`}>
                    <th className="quenching-th quenching-th--time">Time Range</th>
                    <th className="quenching-th quenching-th--checkbox">No Production</th>
                    <th className="quenching-th quenching-th--lot">Lot No.</th>
                    <th className="quenching-th quenching-th--temp">Quenching Temp. (°C)</th>
                    <th className="quenching-th quenching-th--duration">Quenching Duration</th>
                    <th className="quenching-th quenching-th--hardness">Quenching Hardness (HRC)</th>
                    <th className="quenching-th quenching-th--box-gauge">Box Gauge</th>
                    <th className="quenching-th quenching-th--flat-bearing">Flat Bearing Area</th>
                    <th className="quenching-th quenching-th--falling-gauge">Falling Gauge</th>
                  </tr>
                  {/* Row 1: First sample */}
                  <tr className={`quenching-row ${row.noProduction ? 'no-production' : ''}`}>
                    <td rowSpan="4" className="quenching-td quenching-td--time">
                      <strong>{hourLabels[idx]}</strong>
                    </td>
                    <td rowSpan="4" className="quenching-td quenching-td--checkbox">
                      <input
                        type="checkbox"
                        checked={row.noProduction}
                        onChange={e => updateData(idx, 'noProduction', e.target.checked)}
                        className="quenching-checkbox"
                      />
                    </td>
                    <td rowSpan="2" className="quenching-td quenching-td--lot">
                      <select
                        className="form-control quenching-select"
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
                    <td className="quenching-td quenching-td--temp-input">
                      <input
                        type="number"
                        className="form-control quenching-input"
                        placeholder="°C"
                        value={row.quenchingTemperature[0] || ''}
                        onChange={e => updateData(idx, 'quenchingTemperature', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getToleranceStyle('quenchingTemperature', row.quenchingTemperature[0], productType)}
                      />
                    </td>
                    <td className="quenching-td quenching-td--duration-input">
                      <input
                        type="number"
                        className="form-control quenching-input"
                        placeholder="Float"
                        value={row.quenchingDuration[0] || ''}
                        onChange={e => updateData(idx, 'quenchingDuration', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                      />
                    </td>
                    <td className="quenching-td quenching-td--hardness-input">
                      <input
                        type="number"
                        className="form-control quenching-input"
                        placeholder="Integer"
                        value={row.quenchingHardness[0] || ''}
                        onChange={e => updateData(idx, 'quenchingHardness', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                      />
                    </td>
                    <td className="quenching-td quenching-td--box-gauge-input">
                      <select
                        className="form-control quenching-select"
                        value={row.boxGauge[0] || ''}
                        onChange={e => updateData(idx, 'boxGauge', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getSelectToleranceStyle(row.boxGauge[0])}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="NOT OK">NOT OK</option>
                      </select>
                    </td>
                    <td className="quenching-td quenching-td--flat-bearing-input">
                      <select
                        className="form-control quenching-select"
                        value={row.flatBearingArea[0] || ''}
                        onChange={e => updateData(idx, 'flatBearingArea', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getSelectToleranceStyle(row.flatBearingArea[0])}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="NOT OK">NOT OK</option>
                      </select>
                    </td>
                    <td className="quenching-td quenching-td--falling-gauge-input">
                      <select
                        className="form-control quenching-select"
                        value={row.fallingGauge[0] || ''}
                        onChange={e => updateData(idx, 'fallingGauge', e.target.value, 0)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getSelectToleranceStyle(row.fallingGauge[0])}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="NOT OK">NOT OK</option>
                      </select>
                    </td>
                  </tr>
                  {/* Row 2: Second sample */}
                  <tr className={`quenching-row ${row.noProduction ? 'no-production' : ''}`}>
                    <td className="quenching-td quenching-td--temp-input">
                      <input
                        type="number"
                        className="form-control quenching-input"
                        placeholder="°C"
                        value={row.quenchingTemperature[1] || ''}
                        onChange={e => updateData(idx, 'quenchingTemperature', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getToleranceStyle('quenchingTemperature', row.quenchingTemperature[1], productType)}
                      />
                    </td>
                    <td className="quenching-td quenching-td--duration-input">
                      <input
                        type="number"
                        className="form-control quenching-input"
                        placeholder="Float"
                        value={row.quenchingDuration[1] || ''}
                        onChange={e => updateData(idx, 'quenchingDuration', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                      />
                    </td>
                    <td className="quenching-td quenching-td--hardness-input">
                      <input
                        type="number"
                        className="form-control quenching-input"
                        placeholder="Integer"
                        value={row.quenchingHardness[1] || ''}
                        onChange={e => updateData(idx, 'quenchingHardness', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                      />
                    </td>
                    <td className="quenching-td quenching-td--box-gauge-input">
                      <select
                        className="form-control quenching-select"
                        value={row.boxGauge[1] || ''}
                        onChange={e => updateData(idx, 'boxGauge', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getSelectToleranceStyle(row.boxGauge[1])}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="NOT OK">NOT OK</option>
                      </select>
                    </td>
                    <td className="quenching-td quenching-td--flat-bearing-input">
                      <select
                        className="form-control quenching-select"
                        value={row.flatBearingArea[1] || ''}
                        onChange={e => updateData(idx, 'flatBearingArea', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getSelectToleranceStyle(row.flatBearingArea[1])}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="NOT OK">NOT OK</option>
                      </select>
                    </td>
                    <td className="quenching-td quenching-td--falling-gauge-input">
                      <select
                        className="form-control quenching-select"
                        value={row.fallingGauge[1] || ''}
                        onChange={e => updateData(idx, 'fallingGauge', e.target.value, 1)}
                        disabled={row.noProduction || !row.lotNo}
                        style={getSelectToleranceStyle(row.fallingGauge[1])}
                      >
                        <option value="">Select</option>
                        <option value="OK">OK</option>
                        <option value="NOT OK">NOT OK</option>
                      </select>
                    </td>
                  </tr>
                  {/* Row 3: Rejected No. - 6 separate inputs */}
                  <tr className={`quenching-row quenching-row--rejected ${row.noProduction ? 'no-production' : ''}`}>
                    <td className="quenching-td quenching-td--lot">
                      <span className="quenching-rejected-label">Rejected No.</span>
                    </td>
                    <td className="quenching-td quenching-td--rejected-input">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="form-control quenching-input"
                        value={!isRejectionEnabled(row, 'quenchingTemperature') ? '0' : (row.quenchingTemperatureRejected ?? '0')}
                        onChange={e => updateData(idx, 'quenchingTemperatureRejected', e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={() => {
                          if (!row.quenchingTemperatureRejected && row.quenchingTemperatureRejected !== 0) {
                            updateData(idx, 'quenchingTemperatureRejected', '0');
                          }
                        }}
                        disabled={!isRejectionEnabled(row, 'quenchingTemperature')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'quenchingTemperature'))}
                      />
                    </td>
                    <td className="quenching-td quenching-td--rejected-input">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="form-control quenching-input"
                        value={!isRejectionEnabled(row, 'quenchingDuration') ? '0' : (row.quenchingDurationRejected ?? '0')}
                        onChange={e => updateData(idx, 'quenchingDurationRejected', e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={() => {
                          if (!row.quenchingDurationRejected && row.quenchingDurationRejected !== 0) {
                            updateData(idx, 'quenchingDurationRejected', '0');
                          }
                        }}
                        disabled={!isRejectionEnabled(row, 'quenchingDuration')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'quenchingDuration'))}
                      />
                    </td>
                    <td className="quenching-td quenching-td--rejected-input">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="form-control quenching-input"
                        value={!isRejectionEnabled(row, 'quenchingHardness') ? '0' : (row.quenchingHardnessRejected ?? '0')}
                        onChange={e => updateData(idx, 'quenchingHardnessRejected', e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={() => {
                          if (!row.quenchingHardnessRejected && row.quenchingHardnessRejected !== 0) {
                            updateData(idx, 'quenchingHardnessRejected', '0');
                          }
                        }}
                        disabled={!isRejectionEnabled(row, 'quenchingHardness')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'quenchingHardness'))}
                      />
                    </td>
                    <td className="quenching-td quenching-td--rejected-input">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="form-control quenching-input"
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
                    </td>
                    <td className="quenching-td quenching-td--rejected-input">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="form-control quenching-input"
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
                    <td className="quenching-td quenching-td--rejected-input">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="form-control quenching-input"
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
                  </tr>
                  {/* Row 4: Remarks */}
                  <tr className={`quenching-row quenching-row--remarks ${row.noProduction ? 'no-production' : ''}`}>
                    <td className="quenching-td quenching-td--remarks-label">
                      <span className="quenching-remarks-label">Remarks</span>
                    </td>
                    <td colSpan="7" className="quenching-td quenching-td--remarks-input">
                      <input
                        type="text"
                        className="form-control quenching-input"
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
          <div className="quenching-mobile-cards">
            {visibleRows(data, showAll).map(({ row, idx }) => (
              <div key={row.hour} className={`quenching-mobile-card ${row.noProduction ? 'no-production' : ''}`}>
                <div className="quenching-mobile-card__header">
                  <span className="quenching-mobile-card__time">{hourLabels[idx]}</span>
                  <input
                    type="checkbox"
                    checked={row.noProduction}
                    onChange={e => updateData(idx, 'noProduction', e.target.checked)}
                    className="quenching-checkbox"
                  />
                </div>
                <div className="quenching-mobile-card__body">
                  <div className="quenching-mobile-field">
                    <span className="quenching-mobile-field__label">Lot No.</span>
                    <div className="quenching-mobile-field__value">
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
                  {[0, 1].map(sampleIdx => (
                    <div key={sampleIdx}>
                      <div className="quenching-mobile-field">
                        <span className="quenching-mobile-field__label">Quenching Temp. (S{sampleIdx + 1}) (°C)</span>
                        <div className="quenching-mobile-field__value">
                          <input
                            type="number"
                            placeholder="°C"
                            value={row.quenchingTemperature[sampleIdx] || ''}
                            onChange={e => updateData(idx, 'quenchingTemperature', e.target.value, sampleIdx)}
                            disabled={row.noProduction || !row.lotNo}
                            style={getToleranceStyle('quenchingTemperature', row.quenchingTemperature[sampleIdx], productType)}
                          />
                        </div>
                      </div>
                      <div className="quenching-mobile-field">
                        <span className="quenching-mobile-field__label">Quenching Duration (S{sampleIdx + 1})</span>
                        <div className="quenching-mobile-field__value">
                          <input
                            type="number"
                            placeholder="Float"
                            value={row.quenchingDuration[sampleIdx] || ''}
                            onChange={e => updateData(idx, 'quenchingDuration', e.target.value, sampleIdx)}
                            disabled={row.noProduction || !row.lotNo}
                          />
                        </div>
                      </div>
                      <div className="quenching-mobile-field">
                        <span className="quenching-mobile-field__label">Quenching Hardness (S{sampleIdx + 1}) (HRC)</span>
                        <div className="quenching-mobile-field__value">
                          <input
                            type="number"
                            placeholder="Integer"
                            value={row.quenchingHardness[sampleIdx] || ''}
                            onChange={e => updateData(idx, 'quenchingHardness', e.target.value, sampleIdx)}
                            disabled={row.noProduction || !row.lotNo}
                          />
                        </div>
                      </div>
                      <div className="quenching-mobile-field">
                        <span className="quenching-mobile-field__label">Box Gauge (S{sampleIdx + 1})</span>
                        <div className="quenching-mobile-field__value">
                          <select
                            value={row.boxGauge[sampleIdx] || ''}
                            onChange={e => updateData(idx, 'boxGauge', e.target.value, sampleIdx)}
                            disabled={row.noProduction || !row.lotNo}
                            style={getSelectToleranceStyle(row.boxGauge[sampleIdx])}
                          >
                            <option value="">Select</option>
                            <option value="OK">OK</option>
                            <option value="NOT OK">NOT OK</option>
                          </select>
                        </div>
                      </div>
                      <div className="quenching-mobile-field">
                        <span className="quenching-mobile-field__label">Flat Bearing Area (S{sampleIdx + 1})</span>
                        <div className="quenching-mobile-field__value">
                          <select
                            value={row.flatBearingArea[sampleIdx] || ''}
                            onChange={e => updateData(idx, 'flatBearingArea', e.target.value, sampleIdx)}
                            disabled={row.noProduction || !row.lotNo}
                            style={getSelectToleranceStyle(row.flatBearingArea[sampleIdx])}
                          >
                            <option value="">Select</option>
                            <option value="OK">OK</option>
                            <option value="NOT OK">NOT OK</option>
                          </select>
                        </div>
                      </div>
                      <div className="quenching-mobile-field">
                        <span className="quenching-mobile-field__label">Falling Gauge (S{sampleIdx + 1})</span>
                        <div className="quenching-mobile-field__value">
                          <select
                            value={row.fallingGauge[sampleIdx] || ''}
                            onChange={e => updateData(idx, 'fallingGauge', e.target.value, sampleIdx)}
                            disabled={row.noProduction || !row.lotNo}
                            style={getSelectToleranceStyle(row.fallingGauge[sampleIdx])}
                          >
                            <option value="">Select</option>
                            <option value="OK">OK</option>
                            <option value="NOT OK">NOT OK</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="quenching-mobile-field quenching-mobile-field--rejected">
                    <span className="quenching-mobile-field__label">Quenching Temp Rejected</span>
                    <div className="quenching-mobile-field__value">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={!isRejectionEnabled(row, 'quenchingTemperature') ? '0' : (row.quenchingTemperatureRejected ?? '0')}
                        onChange={e => updateData(idx, 'quenchingTemperatureRejected', e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={() => {
                          if (!row.quenchingTemperatureRejected && row.quenchingTemperatureRejected !== 0) {
                            updateData(idx, 'quenchingTemperatureRejected', '0');
                          }
                        }}
                        disabled={!isRejectionEnabled(row, 'quenchingTemperature')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'quenchingTemperature'))}
                      />
                    </div>
                  </div>
                  <div className="quenching-mobile-field quenching-mobile-field--rejected">
                    <span className="quenching-mobile-field__label">Quenching Duration Rejected</span>
                    <div className="quenching-mobile-field__value">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={!isRejectionEnabled(row, 'quenchingDuration') ? '0' : (row.quenchingDurationRejected ?? '0')}
                        onChange={e => updateData(idx, 'quenchingDurationRejected', e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={() => {
                          if (!row.quenchingDurationRejected && row.quenchingDurationRejected !== 0) {
                            updateData(idx, 'quenchingDurationRejected', '0');
                          }
                        }}
                        disabled={!isRejectionEnabled(row, 'quenchingDuration')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'quenchingDuration'))}
                      />
                    </div>
                  </div>
                  <div className="quenching-mobile-field quenching-mobile-field--rejected">
                    <span className="quenching-mobile-field__label">Quenching Hardness Rejected</span>
                    <div className="quenching-mobile-field__value">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={!isRejectionEnabled(row, 'quenchingHardness') ? '0' : (row.quenchingHardnessRejected ?? '0')}
                        onChange={e => updateData(idx, 'quenchingHardnessRejected', e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={() => {
                          if (!row.quenchingHardnessRejected && row.quenchingHardnessRejected !== 0) {
                            updateData(idx, 'quenchingHardnessRejected', '0');
                          }
                        }}
                        disabled={!isRejectionEnabled(row, 'quenchingHardness')}
                        style={getRejectionStyle(isRejectionEnabled(row, 'quenchingHardness'))}
                      />
                    </div>
                  </div>
                  <div className="quenching-mobile-field quenching-mobile-field--rejected">
                    <span className="quenching-mobile-field__label">Box Gauge Rejected</span>
                    <div className="quenching-mobile-field__value">
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
                  <div className="quenching-mobile-field quenching-mobile-field--rejected">
                    <span className="quenching-mobile-field__label">Flat Bearing Area Rejected</span>
                    <div className="quenching-mobile-field__value">
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
                  <div className="quenching-mobile-field quenching-mobile-field--rejected">
                    <span className="quenching-mobile-field__label">Falling Gauge Rejected</span>
                    <div className="quenching-mobile-field__value">
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
                  <div className="quenching-mobile-field">
                    <span className="quenching-mobile-field__label">Remarks</span>
                    <div className="quenching-mobile-field__value">
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

export default QuenchingSection;

