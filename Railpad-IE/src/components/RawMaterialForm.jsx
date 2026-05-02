import React, { useState, useEffect } from 'react';

const RAW_MATERIALS = [
  'Natural Rubber', 'RSS1', 'RSS2', 'RSS3', 'SBR', 'PBR', 'Carbon Black'
];

const RUBBER_TYPES = ['Natural Rubber', 'RSS1', 'RSS2', 'RSS3', 'SBR', 'PBR'];

const RawMaterialForm = ({ onSubmit, onCancel, editData }) => {
  const [formData, setFormData] = useState({
    batchNo: '',
    totalWeight: '',
    acceptedMaterials: 'Yes',
    contract: 'IRS T-55-2025',
    materials: [{ name: '', weight: '' }]
  });

  const [rubberPercentage, setRubberPercentage] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editData) {
      setFormData(editData);
    }
  }, [editData]);

  useEffect(() => {
    const rubberWeight = formData.materials.reduce((sum, item) => {
      if (RUBBER_TYPES.includes(item.name)) {
        return sum + (parseFloat(item.weight) || 0);
      }
      return sum;
    }, 0);

    const total = parseFloat(formData.totalWeight) || 0;
    if (total > 0) {
      setRubberPercentage(((rubberWeight / total) * 100).toFixed(2));
    } else {
      setRubberPercentage(0);
    }
  }, [formData]);

  const addMaterial = () => {
    setFormData({
      ...formData,
      materials: [...formData.materials, { name: '', weight: '' }]
    });
  };

  const removeMaterial = (index) => {
    const newMaterials = [...formData.materials];
    newMaterials.splice(index, 1);
    setFormData({ ...formData, materials: newMaterials });
  };

  const handleMaterialChange = (index, field, value) => {
    const newMaterials = [...formData.materials];
    newMaterials[index][field] = value;
    setFormData({ ...formData, materials: newMaterials });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (formData.contract === 'IRS T-55-2025' && parseFloat(rubberPercentage) < 50) {
      setError('Validation Error: % of Rubber must be at least 50% for IRS T-55-2025 contract.');
      return;
    }

    const status = (formData.acceptedMaterials === 'Yes' &&
      (formData.contract !== 'IRS T-55-2025' || parseFloat(rubberPercentage) >= 50)) ? 'OK' : 'Not OK';

    onSubmit({
      ...formData,
      rubberPercentage,
      status,
      timestamp: formData.timestamp || new Date().toLocaleString()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="form-modal-container">
      <div className="form-modal-header">
        <h2 className="form-header-title">{editData ? 'Edit' : 'Add'} Raw Material Weighment</h2>
      </div>

      <div className="form-modal-body">
        {error && (
          <div className="validation-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <div className="form-grid">
          <div className="form-group">
            <label>Batch No.</label>
            <input
              type="number"
              required
              placeholder="e.g. 101"
              value={formData.batchNo}
              onChange={e => setFormData({ ...formData, batchNo: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Contract Type</label>
            <select
              value={formData.contract}
              onChange={e => setFormData({ ...formData, contract: e.target.value })}
            >
              <option>IRS T-55-2025</option>
              <option>IRS T-55-2023</option>
            </select>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Total Batch Weight (Kg)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={formData.totalWeight}
              onChange={e => setFormData({ ...formData, totalWeight: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Accepted Materials Verification</label>
            <select
              value={formData.acceptedMaterials}
              onChange={e => setFormData({ ...formData, acceptedMaterials: e.target.value })}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>

        <div className="dynamic-rows">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h4 style={{ margin: 0, color: 'var(--text-main)', fontWeight: '700' }}>Raw Materials Selection</h4>
            <button type="button" className="btn-add" style={{ padding: '0.4rem 1rem' }} onClick={addMaterial}>
              + Add Material
            </button>
          </div>

          {formData.materials.map((mat, index) => (
            <div key={index} className="row-item">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Material</label>
                <select
                  required
                  value={mat.name}
                  onChange={e => handleMaterialChange(index, 'name', e.target.value)}
                >
                  <option value="">Select Material</option>
                  {RAW_MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Weight (Kg)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={mat.weight}
                  onChange={e => handleMaterialChange(index, 'weight', e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>% Rubber</label>
                <input 
                  type="text" 
                  readOnly 
                  value={RUBBER_TYPES.includes(mat.name) ? 'Yes' : 'No'} 
                  style={{ background: '#f8fafc' }} 
                />
              </div>
              <button type="button" className="btn-remove" onClick={() => removeMaterial(index)}>×</button>
            </div>
          ))}
        </div>

        <div className="status-summary-card" style={{ background: 'var(--accent-bg)' }}>
          <span className="status-label">Calculated % of Rubber:</span>
          <span className="status-value" style={{ color: parseFloat(rubberPercentage) < 50 && formData.contract === 'IRS T-55-2025' ? 'var(--color-danger)' : 'var(--primary-color)' }}>
            {rubberPercentage}%
          </span>
        </div>
        
        <div className="status-summary-card">
          <span className="status-label">Calculated Status:</span>
          <span className={`status-badge ${(formData.acceptedMaterials === 'Yes' && (formData.contract !== 'IRS T-55-2025' || parseFloat(rubberPercentage) >= 50)) ? 'status-ok' : 'status-not-ok'}`}>
            {(formData.acceptedMaterials === 'Yes' && (formData.contract !== 'IRS T-55-2025' || parseFloat(rubberPercentage) >= 50)) ? 'OK' : 'Not OK'}
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

export default RawMaterialForm;
