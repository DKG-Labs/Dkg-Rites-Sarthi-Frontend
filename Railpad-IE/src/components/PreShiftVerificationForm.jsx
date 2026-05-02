import React, { useState, useEffect } from 'react';

const PreShiftVerificationForm = ({ type, onSubmit, onCancel, editData, currentShift }) => {
  const [formData, setFormData] = useState({
    mouldNumber: '',
    timeOfCheck: '',
    dimensionalAccuracy: 'ok',
    dimensionalRemarks: '',
    freedomFromDefects: 'ok',
    defectsRemarks: '',
    visualRemarks: '',
    status: 'OK'
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (editData) {
      setFormData(editData);
    } else {
      // Auto-capture time when form opens
      const now = new Date();
      const timeString = now.toTimeString().slice(0, 5);
      setFormData(prev => ({
        ...prev,
        timeOfCheck: timeString
      }));
    }
  }, [editData]);

  // Update status automatically based on selections
  useEffect(() => {
    const isOk = formData.dimensionalAccuracy === 'ok' && formData.freedomFromDefects === 'ok';
    setFormData(prev => ({ ...prev, status: isOk ? 'OK' : 'Not OK' }));
  }, [formData.dimensionalAccuracy, formData.freedomFromDefects]);

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
          {editData ? 'Edit' : 'Add'} Mould Verification
        </h2>
      </div>

      <div className="form-modal-body">
        {error && (
          <div className="validation-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Auto-filled Section */}
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
            <label>Mould / Drawing Number</label>
            <input
              type="text"
              required
              placeholder="Enter mould or drawing number"
              value={formData.mouldNumber}
              onChange={e => setFormData({ ...formData, mouldNumber: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Time of Check</label>
            <input
              type="time"
              required
              value={formData.timeOfCheck}
              onChange={e => setFormData({ ...formData, timeOfCheck: e.target.value })}
            />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Dimensional Accuracy</label>
            <select
              value={formData.dimensionalAccuracy}
              onChange={e => setFormData({ ...formData, dimensionalAccuracy: e.target.value })}
            >
              <option value="ok">ok</option>
              <option value="Not ok">Not ok</option>
            </select>
          </div>
          {formData.dimensionalAccuracy === 'Not ok' && (
            <div className="form-group">
              <label>Remarks (Dimensional Accuracy)</label>
              <input
                type="text"
                required
                placeholder="Why not ok?"
                value={formData.dimensionalRemarks}
                onChange={e => setFormData({ ...formData, dimensionalRemarks: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Freedom from Defects</label>
            <select
              value={formData.freedomFromDefects}
              onChange={e => setFormData({ ...formData, freedomFromDefects: e.target.value })}
            >
              <option value="ok">ok</option>
              <option value="Not ok">Not ok</option>
            </select>
          </div>
          {formData.freedomFromDefects === 'Not ok' && (
            <div className="form-group">
              <label>Remarks (Freedom from Defects)</label>
              <input
                type="text"
                required
                placeholder="List defects observed"
                value={formData.defectsRemarks}
                onChange={e => setFormData({ ...formData, defectsRemarks: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label>Visual Remarks (Optional)</label>
          <textarea
            placeholder="Log any specific observations regarding mould conditions..."
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

export default PreShiftVerificationForm;
