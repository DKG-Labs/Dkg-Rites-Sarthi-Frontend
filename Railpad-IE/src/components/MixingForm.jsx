import React, { useState, useEffect } from 'react';
import { approvedQAPService } from '../services/plantDeclarationService';
import CustomSelect from './common/CustomSelect';

const PAD_TYPES = ["6.00mm GRSP", "10.00mm GRSP", "6.20mm CGRSP", "10.00mm CGRSP", "6.00mm NCRGRSP", "10.00mm NCRGRSP"];

const MixingForm = ({ onSubmit, onCancel, editData, plantId, isViewOnly, isSubmitting }) => {
  const [isFormLoading, setIsFormLoading] = useState(true);
  const [formData, setFormData] = useState({
    railPadType: '',
    batchNo: '',
    mixingTime: '',
    mixingTemp: '',
    waterCirculation: 'Yes',
    dustCollector: 'Yes'
  });

  const [qaps, setQaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFormLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchQAPs = async () => {
      try {
        setLoading(true);
        const activePlantId = plantId || "1";
        const data = await approvedQAPService.getByPlantId(activePlantId);
        // Only keep VERIFIED/COMPLETED/APPROVED QAPs
        const verifiedQAPs = (data || []).filter(e => 
          ['COMPLETED', 'VERIFIED', 'APPROVED'].includes(e.status)
        );
        setQaps(verifiedQAPs);
        setFetchError(null);
      } catch (err) {
        console.error("Error fetching QAPs in MixingForm:", err);
        setFetchError("Failed to load QAP validations.");
      } finally {
        setLoading(false);
      }
    };

    fetchQAPs();
  }, [plantId]);

  useEffect(() => {
    if (editData) {
      setFormData({
        railPadType: editData.railPadType || editData.railpadType || '',
        batchNo: editData.batchNo || '',
        mixingTime: editData.mixingTime || '',
        mixingTemp: editData.mixingTemp || '',
        waterCirculation: editData.waterCirculation || 'Yes',
        dustCollector: editData.dustCollector || 'Yes',
        id: editData.id,
        timestamp: editData.timestamp
      });
    }
  }, [editData]);

  // Find active limits for selected rail pad type
  const getQapLimits = () => {
    if (!formData.railPadType) return null;
    for (const qap of qaps) {
      if (qap.productDetails) {
        const detail = qap.productDetails.find(d => d.padType === formData.railPadType);
        if (detail) {
          return {
            minMixingTime: detail.minMixingTime,
            maxMixingTime: detail.maxMixingTime,
            minMixingTemp: detail.minMixingTemp,
            maxMixingTemp: detail.maxMixingTemp
          };
        }
      }
    }
    return null;
  };

  const activeLimits = getQapLimits();
  const hasVerifiedQAP = !!activeLimits;

  // Live validation
  useEffect(() => {
    let newErrors = {};

    if (formData.railPadType) {
      if (!activeLimits) {
        newErrors.railPadType = "No verified QAP limits found for this Rail Pad Type.";
      } else {
        const time = parseFloat(formData.mixingTime);
        const temp = parseFloat(formData.mixingTemp);

        if (formData.mixingTime !== '' && !isNaN(time)) {
          if (activeLimits.minMixingTime !== null && activeLimits.minMixingTime !== undefined && time < activeLimits.minMixingTime) {
            newErrors.mixingTime = `Value must be at least ${activeLimits.minMixingTime} min (QAP Min Limit)`;
          } else if (activeLimits.maxMixingTime !== null && activeLimits.maxMixingTime !== undefined && time > activeLimits.maxMixingTime) {
            newErrors.mixingTime = `Value must be at most ${activeLimits.maxMixingTime} min (QAP Max Limit)`;
          }
        }

        if (formData.mixingTemp !== '' && !isNaN(temp)) {
          if (activeLimits.minMixingTemp !== null && activeLimits.minMixingTemp !== undefined && temp < activeLimits.minMixingTemp) {
            newErrors.mixingTemp = `Value must be at least ${activeLimits.minMixingTemp} °C (QAP Min Limit)`;
          } else if (activeLimits.maxMixingTemp !== null && activeLimits.maxMixingTemp !== undefined && temp > activeLimits.maxMixingTemp) {
            newErrors.mixingTemp = `Value must be at most ${activeLimits.maxMixingTemp} °C (QAP Max Limit)`;
          }
        }
      }
    }

    setErrors(newErrors);
  }, [formData.railPadType, formData.mixingTime, formData.mixingTemp, qaps]);

  const validateOnSubmit = () => {
    let newErrors = {};
    if (!formData.railPadType) {
      newErrors.railPadType = "Type of Rail Pad is required";
    } else if (!activeLimits) {
      newErrors.railPadType = "No verified QAP limits found for this Rail Pad Type.";
    }

    const time = parseFloat(formData.mixingTime);
    const temp = parseFloat(formData.mixingTemp);

    if (formData.mixingTime === '' || isNaN(time)) {
      newErrors.mixingTime = "Mixing Time is required";
    } else if (activeLimits) {
      if (activeLimits.minMixingTime !== null && activeLimits.minMixingTime !== undefined && time < activeLimits.minMixingTime) {
        newErrors.mixingTime = `Value must be at least ${activeLimits.minMixingTime} min`;
      } else if (activeLimits.maxMixingTime !== null && activeLimits.maxMixingTime !== undefined && time > activeLimits.maxMixingTime) {
        newErrors.mixingTime = `Value must be at most ${activeLimits.maxMixingTime} min`;
      }
    }

    if (formData.mixingTemp === '' || isNaN(temp)) {
      newErrors.mixingTemp = "Mixing Temperature is required";
    } else if (activeLimits) {
      if (activeLimits.minMixingTemp !== null && activeLimits.minMixingTemp !== undefined && temp < activeLimits.minMixingTemp) {
        newErrors.mixingTemp = `Value must be at least ${activeLimits.minMixingTemp} °C`;
      } else if (activeLimits.maxMixingTemp !== null && activeLimits.maxMixingTemp !== undefined && temp > activeLimits.maxMixingTemp) {
        newErrors.mixingTemp = `Value must be at most ${activeLimits.maxMixingTemp} °C`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewOnly) return;
    
    if (!formData.railPadType || !hasVerifiedQAP) {
      alert("Submission blocked. Verified QAP values are required for the selected Rail Pad Type.");
      return;
    }

    const time = parseFloat(formData.mixingTime);
    const temp = parseFloat(formData.mixingTemp);

    const isValid = validateOnSubmit();
    const status = (isValid && formData.waterCirculation === 'Yes' && formData.dustCollector === 'Yes') ? 'OK' : 'Not OK';

    onSubmit({
      ...formData,
      status,
      timestamp: formData.timestamp || new Date().toLocaleString()
    });
  };

  const limitsBannerStyle = {
    background: 'rgba(33, 128, 141, 0.05)',
    border: '1px solid rgba(33, 128, 141, 0.2)',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '8px',
    fontSize: '0.85rem',
    color: '#1a545e',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  };

  const warningBannerStyle = {
    background: '#fff5f5',
    border: '1px solid #feb2b2',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '8px',
    fontSize: '0.85rem',
    color: '#9b2c2c',
    fontWeight: '500'
  };

  const isFormValid = formData.railPadType && hasVerifiedQAP && Object.keys(errors).length === 0;

  const isSubmitDisabled = !formData.railPadType || !hasVerifiedQAP;

  if (isFormLoading) {
    return (
      <div className="form-modal-container">
        <div className="form-modal-header">
          <h2 className="form-header-title">{isViewOnly ? 'View' : (editData ? 'Edit' : 'Add')} Mixing at Kneader & Mixing Mill</h2>
        </div>
        <div className="form-modal-body">
          <div className="form-group">
            <div className="skeleton-bar" style={{ width: '120px', height: '14px', marginBottom: '8px' }} />
            <div className="skeleton-bar" style={{ width: '100%', height: '40px', borderRadius: '6px' }} />
          </div>
          <div className="form-group" style={{ marginTop: '12px' }}>
            <div className="skeleton-bar" style={{ width: '90px', height: '14px', marginBottom: '8px' }} />
            <div className="skeleton-bar" style={{ width: '100%', height: '40px', borderRadius: '6px' }} />
          </div>
          <div className="form-grid" style={{ marginTop: '12px' }}>
            <div className="form-group">
              <div className="skeleton-bar" style={{ width: '150px', height: '14px', marginBottom: '8px' }} />
              <div className="skeleton-bar" style={{ width: '100%', height: '40px', borderRadius: '6px' }} />
            </div>
            <div className="form-group">
              <div className="skeleton-bar" style={{ width: '130px', height: '14px', marginBottom: '8px' }} />
              <div className="skeleton-bar" style={{ width: '100%', height: '40px', borderRadius: '6px' }} />
            </div>
          </div>
          <div className="form-grid" style={{ marginTop: '12px' }}>
            <div className="form-group">
              <div className="skeleton-bar" style={{ width: '180px', height: '14px', marginBottom: '8px' }} />
              <div className="skeleton-bar" style={{ width: '100%', height: '40px', borderRadius: '6px' }} />
            </div>
            <div className="form-group">
              <div className="skeleton-bar" style={{ width: '130px', height: '14px', marginBottom: '8px' }} />
              <div className="skeleton-bar" style={{ width: '100%', height: '40px', borderRadius: '6px' }} />
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
    <form onSubmit={handleSubmit} className="form-modal-container">
      <div className="form-modal-header">
        <h2 className="form-header-title">{isViewOnly ? 'View' : (editData ? 'Edit' : 'Add')} Mixing at Kneader & Mixing Mill</h2>
      </div>

      <div className="form-modal-body">
        {fetchError && (
          <div style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '12px', fontWeight: 'bold' }}>
            ⚠️ {fetchError}
          </div>
        )}

        <fieldset disabled={isViewOnly} style={{ border: 'none', padding: 0, margin: 0, width: '100%' }}>
          <div className="form-group">
            <label>Type of Rail Pad *</label>
            <CustomSelect
              options={PAD_TYPES}
              value={formData.railPadType}
              onChange={val => setFormData({ ...formData, railPadType: val })}
              placeholder="Select Type of Rail Pad..."
              disabled={isViewOnly}
            />

            {formData.railPadType && !loading && (
              <>
                {hasVerifiedQAP ? (
                  <div style={limitsBannerStyle}>
                    <strong style={{ fontSize: '0.9rem' }}>✓ Verified QAP Limits</strong>
                    <div>⏱️ Mixing Time: {activeLimits.minMixingTime} - {activeLimits.maxMixingTime} min</div>
                    <div>🌡️ Mixing Temp: {activeLimits.minMixingTemp} - {activeLimits.maxMixingTemp} °C</div>
                  </div>
                ) : (
                  <div style={warningBannerStyle}>
                    ⚠️ No verified QAP values found for this Rail Pad Type. Submission is blocked.
                  </div>
                )}
              </>
            )}

            {formData.railPadType && loading && (
              <div style={{ ...limitsBannerStyle, border: '1px solid rgba(148, 163, 184, 0.15)', background: '#f8fafc' }}>
                <div className="skeleton-bar" style={{ width: '40%', height: '14px', marginBottom: '8px' }} />
                <div className="skeleton-bar" style={{ width: '70%', height: '12px', marginBottom: '6px' }} />
                <div className="skeleton-bar" style={{ width: '65%', height: '12px' }} />
              </div>
            )}

            {errors.railPadType && <p className="text-danger" style={{ fontSize: '0.75rem', marginTop: '4px' }}>{errors.railPadType}</p>}
          </div>

          <div className="form-group">
            <label>Batch Number</label>
            <input
              type="text"
              required
              placeholder="e.g. 101A"
              value={formData.batchNo}
              onChange={e => setFormData({ ...formData, batchNo: e.target.value.replace(/-/g, '') })}
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
            <span className={`status-badge ${isFormValid && formData.waterCirculation === 'Yes' && formData.dustCollector === 'Yes' ? 'status-ok' : 'status-not-ok'}`}>
              {isFormValid && formData.waterCirculation === 'Yes' && formData.dustCollector === 'Yes' ? 'OK' : 'Not OK'}
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
            disabled={isSubmitDisabled || isSubmitting}
            style={{ opacity: (isSubmitDisabled || isSubmitting) ? 0.6 : 1, cursor: (isSubmitDisabled || isSubmitting) ? 'not-allowed' : 'pointer' }}
          >
            {isSubmitting ? 'Saving...' : (editData ? 'Save Changes' : 'Submit Entry')}
          </button>
        )}
      </div>
    </form>
  );
};

export default MixingForm;
