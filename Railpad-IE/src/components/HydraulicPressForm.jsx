import React, { useState, useEffect } from 'react';

const HydraulicPressForm = ({ onSubmit, onCancel, editData, currentShift }) => {
  const [formData, setFormData] = useState({
    batchNo: '',
    pressId: '',
    timeOfCheck: '',
    curingTime: '',
    curingTemp: '',
    curingPressure: '',
    status: 'Not OK' // Default
  });

  const [error, setError] = useState('');

  // Mock QAP Limits
  const QAP_LIMITS = {
    minTime: 12, maxTime: 15,
    minTemp: 140, maxTemp: 160,
    minPressure: 150, maxPressure: 180
  };

  useEffect(() => {
    if (editData) {
      setFormData(editData);
    } else {
      const now = new Date();
      const timeString = now.toTimeString().slice(0, 5);
      setFormData(prev => ({ ...prev, timeOfCheck: timeString }));
    }
  }, [editData]);

  // Validate QAP
  useEffect(() => {
    const time = parseFloat(formData.curingTime);
    const temp = parseFloat(formData.curingTemp);
    const pressure = parseFloat(formData.curingPressure);

    const isTimeValid = !isNaN(time) && time >= QAP_LIMITS.minTime && time <= QAP_LIMITS.maxTime;
    const isTempValid = !isNaN(temp) && temp >= QAP_LIMITS.minTemp && temp <= QAP_LIMITS.maxTemp;
    const isPressureValid = !isNaN(pressure) && pressure >= QAP_LIMITS.minPressure && pressure <= QAP_LIMITS.maxPressure;

    const isOk = isTimeValid && isTempValid && isPressureValid && formData.batchNo && formData.pressId;
    setFormData(prev => ({ ...prev, status: isOk ? 'OK' : 'Not OK' }));
  }, [formData.curingTime, formData.curingTemp, formData.curingPressure, formData.batchNo, formData.pressId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    onSubmit({
      ...formData,
      date: currentShift.date,
      shift: currentShift.shift,
      timestamp: formData.timestamp || new Date().toLocaleString()
    });
  };

  const timeError = formData.curingTime && (parseFloat(formData.curingTime) < QAP_LIMITS.minTime || parseFloat(formData.curingTime) > QAP_LIMITS.maxTime);
  const tempError = formData.curingTemp && (parseFloat(formData.curingTemp) < QAP_LIMITS.minTemp || parseFloat(formData.curingTemp) > QAP_LIMITS.maxTemp);
  const pressureError = formData.curingPressure && (parseFloat(formData.curingPressure) < QAP_LIMITS.minPressure || parseFloat(formData.curingPressure) > QAP_LIMITS.maxPressure);

  // Mock dynamic press options
  const pressOptions = ["Press 1", "Press 2", "Press 3", "Press 4", "Press 5"];

  return (
    <form onSubmit={handleSubmit} className="form-modal-container">
      <div className="form-modal-header">
        <h2 className="form-header-title">
          {editData ? 'Edit' : 'Add'} Moulding at Hydraulic Press
        </h2>
      </div>

      <div className="form-modal-body">
        {error && (
          <div className="validation-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <div style={{ 
          background: '#f8fafc', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <div>
            <label style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Date of Inspection</label>
            <div style={{ fontWeight: '600' }}>{currentShift.date}</div>
          </div>
          <div>
            <label style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Shift</label>
            <div style={{ fontWeight: '600' }}>Shift {currentShift.shift}</div>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Batch No.</label>
            <input
              type="number"
              required
              placeholder="Enter numerical batch ID"
              value={formData.batchNo}
              onChange={e => setFormData({ ...formData, batchNo: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Press ID / Number</label>
            <select
              required
              value={formData.pressId}
              onChange={e => setFormData({ ...formData, pressId: e.target.value })}
            >
              <option value="" disabled>Select Press</option>
              {pressOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Time of Check</label>
            <input
              type="time"
              readOnly
              style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
              value={formData.timeOfCheck}
            />
          </div>
          <div className="form-group">
            <label>
              Curing Time (min) 
              <span style={{fontSize: '10px', fontWeight: 'normal', color: '#64748b', marginLeft: '6px'}}>QAP: {QAP_LIMITS.minTime}-{QAP_LIMITS.maxTime}</span>
            </label>
            <input
              type="number"
              step="0.1"
              required
              placeholder="Enter curing time"
              value={formData.curingTime}
              style={timeError ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}
              onChange={e => setFormData({ ...formData, curingTime: e.target.value })}
            />
            {timeError && <div style={{color: '#ef4444', fontSize: '11px', marginTop: '4px'}}>Deviation from approved QAP limits.</div>}
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>
              Curing Temp. (°C)
              <span style={{fontSize: '10px', fontWeight: 'normal', color: '#64748b', marginLeft: '6px'}}>QAP: {QAP_LIMITS.minTemp}-{QAP_LIMITS.maxTemp}</span>
            </label>
            <input
              type="number"
              step="0.1"
              required
              placeholder="Enter temperature"
              value={formData.curingTemp}
              style={tempError ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}
              onChange={e => setFormData({ ...formData, curingTemp: e.target.value })}
            />
            {tempError && <div style={{color: '#ef4444', fontSize: '11px', marginTop: '4px'}}>Deviation from approved QAP limits.</div>}
          </div>
          <div className="form-group">
             <label>
              Curing Pressure (Kg/cm²)
              <span style={{fontSize: '10px', fontWeight: 'normal', color: '#64748b', marginLeft: '6px'}}>QAP: {QAP_LIMITS.minPressure}-{QAP_LIMITS.maxPressure}</span>
            </label>
            <input
              type="number"
              step="0.1"
              required
              placeholder="Enter pressure"
              value={formData.curingPressure}
              style={pressureError ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}
              onChange={e => setFormData({ ...formData, curingPressure: e.target.value })}
            />
            {pressureError && <div style={{color: '#ef4444', fontSize: '11px', marginTop: '4px'}}>Deviation from approved QAP limits.</div>}
          </div>
        </div>

        <div className="status-summary-card" style={{ marginTop: '20px' }}>
          <span className="status-label">Status:</span>
          <span className={`status-badge ${formData.status === 'OK' ? 'status-ok' : 'status-not-ok'}`}>
            {formData.status}
          </span>
        </div>
      </div>

      <div className="form-footer">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-submit">{editData ? 'Save Changes' : 'Submit Entry'}</button>
      </div>
    </form>
  );
};

export default HydraulicPressForm;
