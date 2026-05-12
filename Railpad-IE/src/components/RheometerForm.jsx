import React, { useState, useEffect } from 'react';

const RheometerForm = ({ onSubmit, onCancel, editData }) => {
  const [formData, setFormData] = useState({
    batchNo: '',
    vulcanTime: '',
    vulcanTemp: '',
    ensured: 'Ensured'
  });

  useEffect(() => {
    if (editData) {
      setFormData(editData);
    }
  }, [editData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const status = formData.ensured === 'Ensured' ? 'OK' : 'Not OK';
    onSubmit({
      ...formData,
      status,
      timestamp: formData.timestamp || new Date().toLocaleString()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="form-modal-container">
      <div className="form-modal-header">
        <h2 className="form-header-title">{editData ? 'Edit' : 'Add'} Rheometer Test</h2>
      </div>

      <div className="form-modal-body">
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
      </div>

      <div className="form-footer">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-submit">{editData ? 'Save Changes' : 'Submit Entry'}</button>
      </div>
    </form>
  );
};

export default RheometerForm;
