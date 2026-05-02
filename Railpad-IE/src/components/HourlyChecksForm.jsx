import React, { useState, useEffect } from 'react';

const HourlyChecksForm = ({ onSubmit, onCancel, editData, currentShift }) => {
  const [formData, setFormData] = useState({
    machineNo: '',
    temperature: '',
    pressureTime: '',
    defectsCheck: 'ok',
    defectsRemarks: '',
    visualRemarks: '',
    status: 'OK'
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (editData) {
      setFormData(editData);
    }
  }, [editData]);

  // Update status automatically based on selections
  useEffect(() => {
    const isOk = formData.defectsCheck === 'ok';
    setFormData(prev => ({ ...prev, status: isOk ? 'OK' : 'Not OK' }));
  }, [formData.defectsCheck]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    onSubmit({
      ...formData,
      date: currentShift.date,
      shift: currentShift.shift,
      timestamp: formData.timestamp || new Date().toLocaleString()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="form-modal-container">
      <div className="form-modal-header">
        <h2 className="form-header-title">
          {editData ? 'Edit' : 'Add'} Hourly Check
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
            <label>Machine / Mould Number</label>
            <input
              type="text"
              required
              placeholder="Enter machine or mould number"
              value={formData.machineNo}
              onChange={e => setFormData({ ...formData, machineNo: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Temperature (°C)</label>
            <input
              type="number"
              required
              placeholder="Enter temperature"
              value={formData.temperature}
              onChange={e => setFormData({ ...formData, temperature: e.target.value })}
            />
          </div>
        </div>

        <div className="form-grid">
            <div className="form-group">
              <label>Pressure / Time</label>
              <input
                type="text"
                required
                placeholder="Enter pressure or time"
                value={formData.pressureTime}
                onChange={e => setFormData({ ...formData, pressureTime: e.target.value })}
              />
            </div>
          <div className="form-group">
            <label>Defects Check</label>
            <select
              value={formData.defectsCheck}
              onChange={e => setFormData({ ...formData, defectsCheck: e.target.value })}
            >
              <option value="ok">ok</option>
              <option value="Not ok">Not ok</option>
            </select>
          </div>
        </div>

        {formData.defectsCheck === 'Not ok' && (
          <div className="form-group">
            <label>Remarks (Defects Check)</label>
            <input
              type="text"
              required
              placeholder="List defects observed"
              value={formData.defectsRemarks}
              onChange={e => setFormData({ ...formData, defectsRemarks: e.target.value })}
            />
          </div>
        )}

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label>Visual Remarks (Optional)</label>
          <textarea
            placeholder="Log any specific observations..."
            rows="3"
            value={formData.visualRemarks}
            onChange={e => setFormData({ ...formData, visualRemarks: e.target.value })}
          />
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

export default HourlyChecksForm;
