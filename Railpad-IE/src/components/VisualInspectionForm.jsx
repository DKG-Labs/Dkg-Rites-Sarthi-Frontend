import React, { useState, useEffect } from 'react';

const VisualInspectionForm = ({ onSubmit, onCancel, editData, currentShift }) => {
  const [formData, setFormData] = useState({
    sampleQuantity: 2,
    timeOfCheck: '',
    clearCutSides: 'Yes',
    smoothSurface: 'Yes',
    defectRemarks: '',
    status: 'OK'
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (editData) {
      setFormData(editData);
    } else {
      const now = new Date();
      const timeString = now.toTimeString().slice(0, 5);
      setFormData(prev => ({ ...prev, timeOfCheck: timeString }));
    }
  }, [editData]);

  // Update status automatically based on visual checks
  useEffect(() => {
    const isOk = formData.clearCutSides === 'Yes' && formData.smoothSurface === 'Yes';
    setFormData(prev => ({ ...prev, status: isOk ? 'OK' : 'Not OK' }));
  }, [formData.clearCutSides, formData.smoothSurface]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.status === 'Not OK' && !formData.defectRemarks.trim()) {
      setError('Defect Remarks are mandatory when visual checks fail.');
      return;
    }
    
    setError('');
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
          {editData ? 'Edit' : 'Add'} Finishing (Visual Inspection)
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
            <label>Time of Check</label>
            <input
              type="time"
              readOnly
              style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
              value={formData.timeOfCheck}
            />
          </div>
          <div className="form-group">
            <label>Sample Quantity Inspected</label>
            <input
              type="number"
              required
              readOnly
              style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
              value={formData.sampleQuantity}
            />
            <span style={{fontSize: '10px', color: '#64748b', marginTop: '4px', display: 'block'}}>
              Mandate: Inspect 2 rail pads per hour.
            </span>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Clear Cut Sides</label>
            <select
              value={formData.clearCutSides}
              onChange={e => setFormData({ ...formData, clearCutSides: e.target.value })}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            <span style={{fontSize: '10px', color: '#64748b', marginTop: '4px', display: 'block'}}>
              Ensure that the Rail pads have clear cut sides.
            </span>
          </div>
          <div className="form-group">
            <label>Smooth Surface</label>
            <select
              value={formData.smoothSurface}
              onChange={e => setFormData({ ...formData, smoothSurface: e.target.value })}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            <span style={{fontSize: '10px', color: '#64748b', marginTop: '4px', display: 'block'}}>
              Ensure that the Rail pads have smooth surface free from defects.
            </span>
          </div>
        </div>

        {(formData.clearCutSides === 'No' || formData.smoothSurface === 'No') && (
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Defect Remarks <span style={{color: '#ef4444'}}>*</span></label>
            <textarea
              required
              placeholder="Log specific observations here..."
              rows="3"
              value={formData.defectRemarks}
              onChange={e => setFormData({ ...formData, defectRemarks: e.target.value })}
            />
          </div>
        )}

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

export default VisualInspectionForm;
