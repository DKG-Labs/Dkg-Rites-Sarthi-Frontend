import React, { useState, useEffect } from 'react';

// Dummy QAP Limits
const QAP_LIMITS = {
  minMixingTime: 10,
  maxMixingTime: 20,
  minMixingTemp: 80,
  maxMixingTemp: 120
};

const MixingForm = ({ onSubmit, onCancel, editData }) => {
  const [formData, setFormData] = useState({
    batchNo: '',
    mixingTime: '',
    mixingTemp: '',
    waterCirculation: 'Yes',
    dustCollector: 'Yes'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editData) {
      setFormData(editData);
    }
  }, [editData]);

  const validate = () => {
    let newErrors = {};
    const time = parseFloat(formData.mixingTime);
    const temp = parseFloat(formData.mixingTemp);

    if (time < QAP_LIMITS.minMixingTime || time > QAP_LIMITS.maxMixingTime) {
      newErrors.mixingTime = `Value must be between ${QAP_LIMITS.minMixingTime} and ${QAP_LIMITS.maxMixingTime} (QAP Limit)`;
    }

    if (temp < QAP_LIMITS.minMixingTemp || temp > QAP_LIMITS.maxMixingTemp) {
      newErrors.mixingTemp = `Value must be between ${QAP_LIMITS.minMixingTemp} and ${QAP_LIMITS.maxMixingTemp} (QAP Limit)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const isValid = validate();

    const status = (isValid && formData.waterCirculation === 'Yes' && formData.dustCollector === 'Yes') ? 'OK' : 'Not OK';

    onSubmit({
      ...formData,
      status,
      timestamp: formData.timestamp || new Date().toLocaleString()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="form-modal-container">
      <div className="form-modal-header">
        <h2 className="form-header-title">{editData ? 'Edit' : 'Add'} Mixing at Kneader & Mixing Mill</h2>
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
            <label>Mixing Time (minutes)</label>
            <input
              type="number"
              step="0.1"
              required
              placeholder="0.0"
              value={formData.mixingTime}
              onChange={e => setFormData({ ...formData, mixingTime: e.target.value })}
            />
            {errors.mixingTime && <p className="text-danger" style={{ fontSize: '0.75rem', marginTop: '4px' }}>{errors.mixingTime}</p>}
          </div>
          <div className="form-group">
            <label>Mixing Temp (°C)</label>
            <input
              type="number"
              step="0.1"
              required
              placeholder="0.0"
              value={formData.mixingTemp}
              onChange={e => setFormData({ ...formData, mixingTemp: e.target.value })}
            />
            {errors.mixingTemp && <p className="text-danger" style={{ fontSize: '0.75rem', marginTop: '4px' }}>{errors.mixingTemp}</p>}
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Water Circulation Maintained</label>
            <select
              value={formData.waterCirculation}
              onChange={e => setFormData({ ...formData, waterCirculation: e.target.value })}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div className="form-group">
            <label>Dust Collector ON</label>
            <select
              value={formData.dustCollector}
              onChange={e => setFormData({ ...formData, dustCollector: e.target.value })}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>

        <div className="status-summary-card">
          <span className="status-label">Calculated Status:</span>
          <span className={`status-badge ${Object.keys(errors).length === 0 && formData.waterCirculation === 'Yes' && formData.dustCollector === 'Yes' ? 'status-ok' : 'status-not-ok'}`}>
            {Object.keys(errors).length === 0 && formData.waterCirculation === 'Yes' && formData.dustCollector === 'Yes' ? 'OK' : 'Not OK'}
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

export default MixingForm;
