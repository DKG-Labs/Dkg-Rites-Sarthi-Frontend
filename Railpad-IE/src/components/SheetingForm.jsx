import React, { useState, useEffect } from 'react';

const SheetingForm = ({ onSubmit, onCancel, editData }) => {
  const [formData, setFormData] = useState({
    batchNo: '',
    sheeting: 'Ensured',
    remarks: ''
  });

  useEffect(() => {
    if (editData) {
      setFormData(editData);
    }
  }, [editData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const status = formData.sheeting === 'Ensured' ? 'OK' : 'Not OK';
    onSubmit({
      ...formData,
      status,
      timestamp: formData.timestamp || new Date().toLocaleString()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="form-modal-container">
      <div className="form-modal-header">
        <h2 className="form-header-title">{editData ? 'Edit' : 'Add'} Sheeting / Sizing</h2>
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

        <div className="form-group">
          <label>Sheeting of Tireform</label>
          <select
            value={formData.sheeting}
            onChange={e => setFormData({ ...formData, sheeting: e.target.value })}
          >
            <option value="Ensured">Ensured</option>
            <option value="Not Ensured">Not Ensured</option>
          </select>
        </div>

        <div className="form-group">
          <label>Visual Remarks (Optional)</label>
          <textarea
            rows="4"
            placeholder="Log any specific observations..."
            value={formData.remarks}
            onChange={e => setFormData({ ...formData, remarks: e.target.value })}
          />
        </div>

        <div className="status-summary-card">
          <span className="status-label">Calculated Status:</span>
          <span className={`status-badge ${formData.sheeting === 'Ensured' ? 'status-ok' : 'status-not-ok'}`}>
            {formData.sheeting === 'Ensured' ? 'OK' : 'Not OK'}
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

export default SheetingForm;
