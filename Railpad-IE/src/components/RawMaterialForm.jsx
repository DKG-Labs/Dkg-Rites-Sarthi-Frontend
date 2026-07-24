import React, { useState, useEffect } from 'react';
import CustomSelect from './common/CustomSelect';

const RAW_MATERIALS = [
  'Natural Rubber', 'RSS1', 'RSS2', 'RSS3', 'SBR', 'PBR', 'Carbon Black'
];

const RUBBER_TYPES = ['Natural Rubber', 'RSS1', 'RSS2', 'RSS3', 'RSS4', 'SBR', 'PBR'];

const RAIL_PAD_TYPES = [
  '6.00mm GRSP',
  '10.00mm GRSP',
  '6.20mm CGRSP',
  '10.00mm CGRSP',
  '6.00mm NCRGRSP',
  '10.00mm NCRGRSP'
];

const RawMaterialForm = ({ onSubmit, onCancel, editData, isViewOnly, isSubmitting }) => {
  const [isFormLoading, setIsFormLoading] = useState(true);
  const [formData, setFormData] = useState({
    railPadType: '',
    batchNo: '',
    totalWeight: '',
    acceptedMaterials: 'No', // Boolean value represented as 'Yes' or 'No'
    contract: '',
    materials: [{ name: '', weight: '' }]
  });

  const [rubberPercentage, setRubberPercentage] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFormLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (editData) {
      setFormData({
        railPadType: editData.railPadType || '',
        batchNo: editData.batchNo || '',
        totalWeight: editData.totalWeight || '',
        acceptedMaterials: editData.acceptedMaterials || 'No',
        contract: editData.contract || '',
        materials: (editData.materials && editData.materials.length > 0)
          ? editData.materials.map(m => ({ name: m?.name || '', weight: m?.weight || '' }))
          : [{ name: '', weight: '' }]
      });
    }
  }, [editData]);

  useEffect(() => {
    if (!formData.materials || !Array.isArray(formData.materials)) {
      setRubberPercentage(0);
      return;
    }
    const rubberWeight = formData.materials.reduce((sum, item) => {
      if (item && item.name && RUBBER_TYPES.includes(item.name)) {
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

  const totalBatchWeightVal = parseFloat(formData.totalWeight) || 0;
  const currentTotalMaterialsWeight = Array.isArray(formData.materials) ? formData.materials.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0) : 0;
  const isWeightExceeded = totalBatchWeightVal > 0 && currentTotalMaterialsWeight > totalBatchWeightVal;

  const getRawMaterialsOptions = (contract) => {
    const base = ['Natural Rubber', 'RSS1', 'RSS2', 'RSS3', 'SBR', 'PBR', 'Carbon Black'];
    if (contract === 'IRS T-55-2023') {
      return ['Natural Rubber', 'RSS1', 'RSS2', 'RSS3', 'RSS4', 'SBR', 'PBR', 'Carbon Black'];
    }
    return base;
  };

  const handleContractChange = (newContract) => {
    setFormData(prev => {
      // If switching away from T-55-2023, filter out 'RSS4' if selected
      const updatedMaterials = prev.materials.map(m => {
        if (newContract !== 'IRS T-55-2023' && m.name === 'RSS4') {
          return { ...m, name: '' };
        }
        return m;
      });
      return {
        ...prev,
        contract: newContract,
        materials: updatedMaterials
      };
    });
  };

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
    if (isViewOnly) return;
    setError('');

    if (!formData.railPadType) {
      setError('Validation Error: Please select a Type of Rail Pad.');
      return;
    }

    if (!formData.contract) {
      setError('Validation Error: Please select a Specification No.');
      return;
    }

    // Clicking the checkbox is mandatory to enable submit, but extra check for security
    if (formData.acceptedMaterials !== 'Yes') {
      setError('Validation Error: You must verify that accepted raw materials are used.');
      return;
    }

    const hasRubber = Array.isArray(formData.materials) && formData.materials.some(m => m && RUBBER_TYPES.includes(m.name));

    const totalMaterialWeight = formData.materials.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
    const totalBatchWeight = parseFloat(formData.totalWeight) || 0;

    if (totalMaterialWeight > totalBatchWeight) {
      setError(`Validation Error: Total ingredients weight (${totalMaterialWeight.toFixed(2)} Kg) cannot exceed Total Batch Weight (${totalBatchWeight.toFixed(2)} Kg).`);
      return;
    }

    if (formData.contract === 'IRS T-55-2023' && !hasRubber) {
      setError('Validation Error: At least one rubber material must be added for IRS T-55-2023 specification.');
      return;
    }

    const status = (formData.acceptedMaterials === 'Yes' &&
      (formData.contract === 'IRS T-55-2023' ? hasRubber : parseFloat(rubberPercentage) >= 50)) ? 'OK' : 'Not OK';

    onSubmit({
      ...formData,
      rubberPercentage,
      status,
      timestamp: formData.timestamp || new Date().toLocaleString()
    });
  };

  if (isFormLoading) {
    return (
      <div className="form-modal-container" style={{ maxWidth: '520px' }}>
        <div className="form-modal-header">
          <h2 className="form-header-title">{isViewOnly ? 'View' : (editData ? 'Edit' : 'Add')} Raw Material Weighment</h2>
        </div>
        <div className="form-modal-body">
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <div className="skeleton-bar" style={{ width: '120px', height: '14px', marginBottom: '8px' }} />
            <div className="skeleton-bar" style={{ width: '100%', height: '40px', borderRadius: '6px' }} />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <div className="skeleton-bar" style={{ width: '80px', height: '14px', marginBottom: '8px' }} />
              <div className="skeleton-bar" style={{ width: '100%', height: '40px', borderRadius: '6px' }} />
            </div>
            <div className="form-group">
              <div className="skeleton-bar" style={{ width: '120px', height: '14px', marginBottom: '8px' }} />
              <div className="skeleton-bar" style={{ width: '100%', height: '40px', borderRadius: '6px' }} />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <div className="skeleton-bar" style={{ width: '150px', height: '14px', marginBottom: '8px' }} />
              <div className="skeleton-bar" style={{ width: '100%', height: '40px', borderRadius: '6px' }} />
            </div>
            <div className="form-group" style={{ justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                <div className="skeleton-bar" style={{ width: '18px', height: '18px', borderRadius: '3px' }} />
                <div className="skeleton-bar" style={{ width: '220px', height: '14px' }} />
              </div>
            </div>
          </div>
          <div className="dynamic-rows" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div className="skeleton-bar" style={{ width: '150px', height: '16px' }} />
              <div className="skeleton-bar" style={{ width: '100px', height: '30px', borderRadius: '6px' }} />
            </div>
            <div className="row-item" style={{ gridTemplateColumns: '2fr 1.2fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div className="skeleton-bar" style={{ width: '60px', height: '12px', marginBottom: '6px' }} />
                <div className="skeleton-bar" style={{ width: '100%', height: '38px', borderRadius: '6px' }} />
              </div>
              <div>
                <div className="skeleton-bar" style={{ width: '80px', height: '12px', marginBottom: '6px' }} />
                <div className="skeleton-bar" style={{ width: '100%', height: '38px', borderRadius: '6px' }} />
              </div>
            </div>
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
    <form onSubmit={handleSubmit} className="form-modal-container" style={{ maxWidth: '520px' }}>
      <div className="form-modal-header">
        <h2 className="form-header-title">{isViewOnly ? 'View' : (editData ? 'Edit' : 'Add')} Raw Material Weighment</h2>
      </div>

      <div className="form-modal-body">
        {error && (
          <div className="validation-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {isWeightExceeded && (
          <div style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '12px', fontWeight: 'bold', padding: '10px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px' }}>
            ⚠️ Total ingredients weight ({currentTotalMaterialsWeight.toFixed(2)} Kg) cannot exceed Total Batch Weight ({totalBatchWeightVal.toFixed(2)} Kg).
          </div>
        )}

        <fieldset disabled={isViewOnly} style={{ border: 'none', padding: 0, margin: 0, width: '100%' }}>
          {/* Type of Rail Pad Dropdown at top of form */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px' }}>
              Type of Rail Pad <span className="required">*</span>
            </label>
            <CustomSelect
              options={RAIL_PAD_TYPES}
              value={formData.railPadType}
              onChange={val => setFormData({ ...formData, railPadType: val })}
              placeholder="Select Type of Rail Pad..."
              disabled={isViewOnly}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Batch No. <span className="required">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. 101A"
                value={formData.batchNo}
                onChange={e => setFormData({ ...formData, batchNo: e.target.value.replace(/-/g, '') })}
              />
            </div>
            <div className="form-group">
              <label>Specification No. <span className="required">*</span></label>
              <select
                required
                value={formData.contract}
                onChange={e => handleContractChange(e.target.value)}
                style={{
                  color: formData.contract ? '#1e293b' : '#64748b'
                }}
              >
                <option value="" disabled>Select Specification No.</option>
                <option value="IRS T-55-2025">IRS T-55-2025</option>
                <option value="IRS T-55-2023">IRS T-55-2023</option>
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Total Batch Weight (Kg) <span className="required">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                onWheel={(e) => e.target.blur()}
                value={formData.totalWeight}
                onChange={e => setFormData({ ...formData, totalWeight: e.target.value })}
              />
            </div>
            
            {/* Checkbox - Use of Accepted Raw Materials Verified */}
            <div className="form-group" style={{ justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                <input
                  type="checkbox"
                  id="acceptedMaterialsVerified"
                  checked={formData.acceptedMaterials === 'Yes'}
                  onChange={e => setFormData({ ...formData, acceptedMaterials: e.target.checked ? 'Yes' : 'No' })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', margin: 0 }}
                />
                <label htmlFor="acceptedMaterialsVerified" style={{ cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>
                  Use of Accepted Raw Materials Verified <span className="required">*</span>
                </label>
              </div>
            </div>
          </div>

          <div className="dynamic-rows">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: 0, color: 'var(--text-main)', fontWeight: '700' }}>Raw Materials Selection</h4>
              {!isViewOnly && (
                <button type="button" className="btn-add" style={{ padding: '0.4rem 1rem' }} onClick={addMaterial}>
                  + Add Material
                </button>
              )}
            </div>

            {Array.isArray(formData.materials) && formData.materials.map((mat, index) => {
              if (!mat) return null;
              // Option Added in Previous Row will not be shown
              const selectedElsewhere = formData.materials
                .map((m, idx) => (m && idx !== index) ? m.name : '')
                .filter(name => name !== '');
              const availableOptions = getRawMaterialsOptions(formData.contract).filter(
                opt => !selectedElsewhere.includes(opt)
              );

              return (
                <div key={index} className="row-item" style={{ gridTemplateColumns: isViewOnly ? '2fr 1.2fr' : '2fr 1.2fr 40px', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Material</label>
                    <select
                      required
                      value={mat.name || ''}
                      onChange={e => handleMaterialChange(index, 'name', e.target.value)}
                    >
                      <option value="">Select Material</option>
                      {availableOptions.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={isWeightExceeded ? { color: '#dc2626' } : {}}>Weight (Kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      onWheel={(e) => e.target.blur()}
                      value={mat.weight || ''}
                      onChange={e => handleMaterialChange(index, 'weight', e.target.value)}
                      style={isWeightExceeded ? { borderColor: '#dc2626', color: '#dc2626', backgroundColor: '#fef2f2' } : {}}
                    />
                    {isWeightExceeded && (
                      <div style={{ color: '#dc2626', fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>
                        Exceeds total weight limit!
                      </div>
                    )}
                  </div>
                  {!isViewOnly && (
                    <button type="button" className="btn-remove" onClick={() => removeMaterial(index)}>×</button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Calculated % of Rubber: Hidden for T-55-2023 since minimum 50% is not checked */}
          {formData.contract === 'IRS T-55-2025' && (
            <div className="status-summary-card" style={{ background: 'var(--accent-bg)' }}>
              <span className="status-label">Calculated % of Rubber:</span>
              <span className="status-value" style={{ color: parseFloat(rubberPercentage) < 50 ? 'var(--color-danger)' : 'var(--primary-color)' }}>
                {rubberPercentage}%
              </span>
            </div>
          )}
          
          <div className="status-summary-card">
            <span className="status-label">Calculated Status:</span>
            <span className={`status-badge ${(formData.acceptedMaterials === 'Yes' && (formData.contract === 'IRS T-55-2023' ? (Array.isArray(formData.materials) && formData.materials.some(m => m && RUBBER_TYPES.includes(m.name))) : parseFloat(rubberPercentage) >= 50)) ? 'status-ok' : 'status-not-ok'}`}>
              {(formData.acceptedMaterials === 'Yes' && (formData.contract === 'IRS T-55-2023' ? (Array.isArray(formData.materials) && formData.materials.some(m => m && RUBBER_TYPES.includes(m.name))) : parseFloat(rubberPercentage) >= 50)) ? 'OK' : 'Not OK'}
            </span>
          </div>
        </fieldset>
      </div>

      <div className="form-footer">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSubmitting}>
          {isViewOnly ? 'Close' : 'Cancel'}
        </button>
        {!isViewOnly && (
          <button 
            type="submit" 
            className="btn-submit" 
            disabled={formData.acceptedMaterials !== 'Yes' || isWeightExceeded || isSubmitting}
            style={(isWeightExceeded || isSubmitting) ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          >
            {isSubmitting ? 'Saving...' : (editData ? 'Save Changes' : 'Submit Entry')}
          </button>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .btn-submit:disabled {
          background: #cbd5e1 !important;
          color: #94a3b8 !important;
          cursor: not-allowed !important;
          box-shadow: none !important;
          transform: none !important;
        }
      `}} />
    </form>
  );
};

export default RawMaterialForm;
