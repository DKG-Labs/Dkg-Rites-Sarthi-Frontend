import React, { useState, useEffect } from 'react';

const RheometerForm = ({ onSubmit, onCancel, editData, isViewOnly }) => {
  const [isFormLoading, setIsFormLoading] = useState(true);
  const [formData, setFormData] = useState({
    batchNo: '',
    vulcanTime: '',
    vulcanTemp: '',
    ensured: 'Ensured'
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFormLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (editData) {
      setFormData(editData);
    }
  }, [editData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewOnly) return;
    const status = formData.ensured === 'Ensured' ? 'OK' : 'Not OK';
    onSubmit({
      ...formData,
      status,
      timestamp: formData.timestamp || new Date().toLocaleString()
    });
  };

  if (isFormLoading) {
    return (
      <div className="form-modal-container">
        <div className="form-modal-header">
          <h2 className="form-header-title">{isViewOnly ? 'View' : (editData ? 'Edit' : 'Add')} Rheometer Test</h2>
        </div>
        <div className="form-modal-body">
          <div className="form-group">
            <div className="skeleton-bar" style={{ width: '120px', height: '14px', marginBottom: '8px' }} />
            <div className="skeleton-bar" style={{ width: '100%', height: '40px', borderRadius: '6px' }} />
          </div>
          <div className="form-grid" style={{ marginTop: '12px' }}>
            <div className="form-group">
              <div className="skeleton-bar" style={{ width: '180px', height: '14px', marginBottom: '8px' }} />
              <div className="skeleton-bar" style={{ width: '100%', height: '40px', borderRadius: '6px' }} />
            </div>
            <div className="form-group">
              <div className="skeleton-bar" style={{ width: '180px', height: '14px', marginBottom: '8px' }} />
              <div className="skeleton-bar" style={{ width: '100%', height: '40px', borderRadius: '6px' }} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '12px' }}>
            <div className="skeleton-bar" style={{ width: '140px', height: '14px', marginBottom: '8px' }} />
            <div className="skeleton-bar" style={{ width: '100%', height: '40px', borderRadius: '6px' }} />
          </div>
          <div className="status-summary-card" style={{ marginTop: '20px' }}>
            <div className="skeleton-bar" style={{ width: '120px', height: '14px' }} />
            <div className="skeleton-bar" style={{ width: '60px', height: '20px', borderRadius: '12px' }} />
          </div>
        </div>
        <div className="form-footer">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {isViewOnly ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="form-modal-container">
      <div className="form-modal-header">
        <h2 className="form-header-title">{isViewOnly ? 'View' : (editData ? 'Edit' : 'Add')} Rheometer Test</h2>
      </div>

      <div className="form-modal-body">
        <fieldset disabled={isViewOnly} style={{ border: 'none', padding: 0, margin: 0, width: '100%' }}>
          <div className="form-group">
            <label>Batch Number</label>
            <input
              type="number"
              required
              placeholder="e.g. 101"
              value={formData.batchNo}
              onChange={e => setFormData({ ...formData, batchNo: e.target.value })}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Vulcanization Time (minutes)</label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="0.0"
                value={formData.vulcanTime}
                onChange={e => setFormData({ ...formData, vulcanTime: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Vulcanization Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="0.0"
                value={formData.vulcanTemp}
                onChange={e => setFormData({ ...formData, vulcanTemp: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Validation Check</label>
            <select
              value={formData.ensured}
              onChange={e => setFormData({ ...formData, ensured: e.target.value })}
            >
              <option value="Ensured">Ensured</option>
              <option value="Not Ensured">Not Ensured</option>
            </select>
          </div>

          <div className="status-summary-card">
            <span className="status-label">Calculated Status:</span>
            <span className={`status-badge ${formData.ensured === 'Ensured' ? 'status-ok' : 'status-not-ok'}`}>
              {formData.ensured === 'Ensured' ? 'OK' : 'Not OK'}
            </span>
          </div>
        </fieldset>
      </div>

      <div className="form-footer">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          {isViewOnly ? 'Close' : 'Cancel'}
        </button>
        {!isViewOnly && (
          <button type="submit" className="btn-submit">
            {editData ? 'Save Changes' : 'Submit Entry'}
          </button>
        )}
      </div>
    </form>
  );
};

export default RheometerForm;
