import React, { useState, useEffect } from 'react';
import { approvedQAPService } from '../services/plantDeclarationService';
import CustomSelect from './common/CustomSelect';

const PAD_TYPES = ["6.00mm GRSP", "10.00mm GRSP", "6.20mm CGRSP", "10.00mm CGRSP", "6.00mm NCRGRSP", "10.00mm NCRGRSP"];

const HydraulicPressForm = ({ onSubmit, onCancel, editData, currentShift, isViewOnly }) => {
  const [isFormLoading, setIsFormLoading] = useState(true);
  const [formData, setFormData] = useState({
    railPadType: '',
    batchNo: '',
    timeOfCheck: '',
    curingTime: '',
    curingTemp: '',
    curingPressure: '',
    status: 'Not OK' // Default
  });

  const [qaps, setQaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQAPs = async () => {
      try {
        setLoading(true);
        const activePlantId = (currentShift && currentShift.unit) || "1";
        const data = await approvedQAPService.getByPlantId(activePlantId);
        const verifiedQAPs = (data || []).filter(e => 
          ['COMPLETED', 'VERIFIED', 'APPROVED'].includes(e.status)
        );
        setQaps(verifiedQAPs);
        setFetchError(null);
      } catch (err) {
        console.error("Error fetching QAPs in HydraulicPressForm:", err);
        setFetchError("Failed to load QAP validations.");
      } finally {
        setLoading(false);
      }
    };

    fetchQAPs();
  }, [currentShift]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFormLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const getQapLimits = () => {
    if (!formData.railPadType) return null;
    for (const qap of qaps) {
      if (qap.productDetails) {
        const detail = qap.productDetails.find(d => d.padType === formData.railPadType);
        if (detail) {
          return {
            minCuringTime: detail.minCuringTime,
            maxCuringTime: detail.maxCuringTime,
            minCuringTemp: detail.minCuringTemp,
            maxCuringTemp: detail.maxCuringTemp,
            minCuringPressure: detail.minCuringPressure,
            maxCuringPressure: detail.maxCuringPressure
          };
        }
      }
    }
    return null;
  };

  const activeLimits = getQapLimits();
  const hasVerifiedQAP = !!activeLimits;

  useEffect(() => {
    if (editData) {
      setFormData({
        railPadType: editData.railPadType || editData.railpadType || '',
        batchNo: editData.batchNo || '',
        timeOfCheck: editData.timeOfCheck || '',
        curingTime: editData.curingTime || '',
        curingTemp: editData.curingTemp || '',
        curingPressure: editData.curingPressure || '',
        status: editData.status || 'Not OK',
        id: editData.id,
        timestamp: editData.timestamp
      });
    } else {
      const now = new Date();
      const timeString = now.toTimeString().slice(0, 5);
      setFormData(prev => ({ 
        ...prev, 
        timeOfCheck: timeString,
        railPadType: '',
        batchNo: '',
        curingTime: '',
        curingTemp: '',
        curingPressure: '',
        status: 'Not OK'
      }));
    }
  }, [editData]);

  useEffect(() => {
    let newErrors = {};

    if (formData.railPadType) {
      if (!activeLimits) {
        newErrors.railPadType = "No verified QAP limits found for this Rail Pad Type.";
      } else {
        const time = parseFloat(formData.curingTime);
        const temp = parseFloat(formData.curingTemp);
        const pressure = parseFloat(formData.curingPressure);

        if (formData.curingTime !== '' && !isNaN(time)) {
          if (activeLimits.minCuringTime !== null && activeLimits.minCuringTime !== undefined && time < activeLimits.minCuringTime) {
            newErrors.curingTime = `Value must be at least ${activeLimits.minCuringTime} min (QAP Min Limit)`;
          } else if (activeLimits.maxCuringTime !== null && activeLimits.maxCuringTime !== undefined && time > activeLimits.maxCuringTime) {
            newErrors.curingTime = `Value must be at most ${activeLimits.maxCuringTime} min (QAP Max Limit)`;
          }
        }

        if (formData.curingTemp !== '' && !isNaN(temp)) {
          if (activeLimits.minCuringTemp !== null && activeLimits.minCuringTemp !== undefined && temp < activeLimits.minCuringTemp) {
            newErrors.curingTemp = `Value must be at least ${activeLimits.minCuringTemp} °C (QAP Min Limit)`;
          } else if (activeLimits.maxCuringTemp !== null && activeLimits.maxCuringTemp !== undefined && temp > activeLimits.maxCuringTemp) {
            newErrors.curingTemp = `Value must be at most ${activeLimits.maxCuringTemp} °C (QAP Max Limit)`;
          }
        }

        if (formData.curingPressure !== '' && !isNaN(pressure)) {
          if (activeLimits.minCuringPressure !== null && activeLimits.minCuringPressure !== undefined && pressure < activeLimits.minCuringPressure) {
            newErrors.curingPressure = `Value must be at least ${activeLimits.minCuringPressure} Kg/cm² (QAP Min Limit)`;
          } else if (activeLimits.maxCuringPressure !== null && activeLimits.maxCuringPressure !== undefined && pressure > activeLimits.maxCuringPressure) {
            newErrors.curingPressure = `Value must be at most ${activeLimits.maxCuringPressure} Kg/cm² (QAP Max Limit)`;
          }
        }
      }
    }

    setErrors(newErrors);
  }, [formData.railPadType, formData.curingTime, formData.curingTemp, formData.curingPressure, qaps]);

  useEffect(() => {
    const time = parseFloat(formData.curingTime);
    const temp = parseFloat(formData.curingTemp);
    const pressure = parseFloat(formData.curingPressure);

    const isTimeValid = activeLimits && !isNaN(time) && time >= activeLimits.minCuringTime && time <= activeLimits.maxCuringTime;
    const isTempValid = activeLimits && !isNaN(temp) && temp >= activeLimits.minCuringTemp && temp <= activeLimits.maxCuringTemp;
    const isPressureValid = activeLimits && !isNaN(pressure) && pressure >= activeLimits.minCuringPressure && pressure <= activeLimits.maxCuringPressure;

    const isOk = isTimeValid && isTempValid && isPressureValid && formData.batchNo && formData.railPadType;
    setFormData(prev => ({ ...prev, status: isOk ? 'OK' : 'Not OK' }));
  }, [formData.curingTime, formData.curingTemp, formData.curingPressure, formData.batchNo, formData.railPadType, qaps]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewOnly) return;

    if (!formData.railPadType) {
      alert("Type of Rail Pad is required");
      return;
    }

    if (!hasVerifiedQAP) {
      alert("Submission blocked. Verified QAP values are required for the selected Rail Pad Type.");
      return;
    }

    const time = parseFloat(formData.curingTime);
    const temp = parseFloat(formData.curingTemp);
    const pressure = parseFloat(formData.curingPressure);

    if (activeLimits) {
      if (!isNaN(time) && ((activeLimits.minCuringTime !== null && time < activeLimits.minCuringTime) || (activeLimits.maxCuringTime !== null && time > activeLimits.maxCuringTime))) {
        alert(`Submission blocked: Curing Time (${time} min) is outside QAP limits.`);
        return;
      }
      if (!isNaN(temp) && ((activeLimits.minCuringTemp !== null && temp < activeLimits.minCuringTemp) || (activeLimits.maxCuringTemp !== null && temp > activeLimits.maxCuringTemp))) {
        alert(`Submission blocked: Curing Temp (${temp} °C) is outside QAP limits.`);
        return;
      }
      if (!isNaN(pressure) && ((activeLimits.minCuringPressure !== null && pressure < activeLimits.minCuringPressure) || (activeLimits.maxCuringPressure !== null && pressure > activeLimits.maxCuringPressure))) {
        alert(`Submission blocked: Curing Pressure (${pressure} Kg/cm²) is outside QAP limits.`);
        return;
      }
    }
    
    onSubmit({
      ...formData,
      date: currentShift.date,
      shift: currentShift.shift,
      timestamp: formData.timestamp || new Date().toLocaleString()
    });
  };

  const timeError = formData.curingTime && activeLimits && (
    (activeLimits.minCuringTime !== null && parseFloat(formData.curingTime) < activeLimits.minCuringTime) ||
    (activeLimits.maxCuringTime !== null && parseFloat(formData.curingTime) > activeLimits.maxCuringTime)
  );
  const tempError = formData.curingTemp && activeLimits && (
    (activeLimits.minCuringTemp !== null && parseFloat(formData.curingTemp) < activeLimits.minCuringTemp) ||
    (activeLimits.maxCuringTemp !== null && parseFloat(formData.curingTemp) > activeLimits.maxCuringTemp)
  );
  const pressureError = formData.curingPressure && activeLimits && (
    (activeLimits.minCuringPressure !== null && parseFloat(formData.curingPressure) < activeLimits.minCuringPressure) ||
    (activeLimits.maxCuringPressure !== null && parseFloat(formData.curingPressure) > activeLimits.maxCuringPressure)
  );

  const isSubmitDisabled = !formData.railPadType || !hasVerifiedQAP || !!timeError || !!tempError || !!pressureError || !formData.batchNo || !formData.curingTime || !formData.curingTemp || !formData.curingPressure;

  if (isFormLoading) {
    return (
      <div className="form-modal-container">
        <div className="form-modal-header">
          <h2 className="form-header-title">{isViewOnly ? 'View' : (editData ? 'Edit' : 'Add')} Moulding at Hydraulic Press</h2>
        </div>
        <div className="form-modal-body">
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <div className="skeleton-bar" style={{ width: '120px', height: '14px', marginBottom: '8px' }} />
            <div className="skeleton-bar" style={{ width: '100%', height: '40px', borderRadius: '6px' }} />
          </div>
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
              <div className="skeleton-bar" style={{ width: '80px', height: '10px', marginBottom: '6px' }} />
              <div className="skeleton-bar" style={{ width: '120px', height: '14px' }} />
            </div>
            <div>
              <div className="skeleton-bar" style={{ width: '40px', height: '10px', marginBottom: '6px' }} />
              <div className="skeleton-bar" style={{ width: '80px', height: '14px' }} />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <div className="skeleton-bar" style={{ width: '80px', height: '14px', marginBottom: '8px' }} />
              <div className="skeleton-bar" style={{ width: '100%', height: '40px', borderRadius: '6px' }} />
            </div>
            <div className="form-group">
              <div className="skeleton-bar" style={{ width: '100px', height: '14px', marginBottom: '8px' }} />
              <div className="skeleton-bar" style={{ width: '100%', height: '40px', borderRadius: '6px' }} />
            </div>
          </div>
          <div className="form-grid" style={{ marginTop: '12px' }}>
            <div className="form-group">
              <div className="skeleton-bar" style={{ width: '150px', height: '14px', marginBottom: '8px' }} />
              <div className="skeleton-bar" style={{ width: '100%', height: '40px', borderRadius: '6px' }} />
            </div>
            <div className="form-group">
              <div className="skeleton-bar" style={{ width: '150px', height: '14px', marginBottom: '8px' }} />
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
        <h2 className="form-header-title">
          {isViewOnly ? 'View' : (editData ? 'Edit' : 'Add')} Moulding at Hydraulic Press
        </h2>
      </div>

      <div className="form-modal-body">
        {fetchError && (
          <div style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '12px', fontWeight: 'bold' }}>
            ⚠️ {fetchError}
          </div>
        )}
        {error && (
          <div className="validation-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <fieldset disabled={isViewOnly} style={{ border: 'none', padding: 0, margin: 0, width: '100%' }}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px' }}>
              Type of Rail Pad <span className="required">*</span>
            </label>
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
                  <div style={{
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
                  }}>
                    <strong style={{ fontSize: '0.9rem' }}>✓ Verified QAP Curing Limits</strong>
                    <div>⏱️ Curing Time: {activeLimits.minCuringTime} - {activeLimits.maxCuringTime} min</div>
                    <div>🌡️ Curing Temp: {activeLimits.minCuringTemp} - {activeLimits.maxCuringTemp} °C</div>
                    <div>⚡ Curing Pressure: {activeLimits.minCuringPressure} - {activeLimits.maxCuringPressure} Kg/cm²</div>
                  </div>
                ) : (
                  <div style={{
                    background: '#fff5f5',
                    border: '1px solid #feb2b2',
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '8px',
                    fontSize: '0.85rem',
                    color: '#9b2c2c',
                    fontWeight: '500'
                  }}>
                    ⚠️ No verified QAP values found for this Rail Pad Type. Submission is blocked.
                  </div>
                )}
              </>
            )}

            {formData.railPadType && loading && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid rgba(148, 163, 184, 0.15)',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div className="skeleton-bar" style={{ width: '40%', height: '14px' }} />
                <div className="skeleton-bar" style={{ width: '70%', height: '12px' }} />
                <div className="skeleton-bar" style={{ width: '65%', height: '12px' }} />
              </div>
            )}

            {errors.railPadType && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{errors.railPadType}</p>}
          </div>

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
              <label>Batch No.</label>
              <input
                type="number"
                required
                placeholder="Enter numerical batch ID"
                value={formData.batchNo}
                onChange={e => setFormData({ ...formData, batchNo: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Time of Check</label>
              <input
                type="time"
                readOnly
                style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                value={formData.timeOfCheck}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>
                Curing Time (min) 
                {activeLimits && <span style={{fontSize: '10px', fontWeight: 'normal', color: '#64748b', marginLeft: '6px'}}>QAP: {activeLimits.minCuringTime}-{activeLimits.maxCuringTime}</span>}
              </label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="Enter curing time"
                value={formData.curingTime}
                style={timeError ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}
                onChange={e => setFormData({ ...formData, curingTime: e.target.value })}
              />
              {timeError && <div style={{color: '#ef4444', fontSize: '11px', marginTop: '4px'}}>Deviation from approved QAP limits.</div>}
            </div>
            <div className="form-group">
              <label>
                Curing Temp. (°C)
                {activeLimits && <span style={{fontSize: '10px', fontWeight: 'normal', color: '#64748b', marginLeft: '6px'}}>QAP: {activeLimits.minCuringTemp}-{activeLimits.maxCuringTemp}</span>}
              </label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="Enter temperature"
                value={formData.curingTemp}
                style={tempError ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}
                onChange={e => setFormData({ ...formData, curingTemp: e.target.value })}
              />
              {tempError && <div style={{color: '#ef4444', fontSize: '11px', marginTop: '4px'}}>Deviation from approved QAP limits.</div>}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
             <label>
              Curing Pressure (Kg/cm²)
              {activeLimits && <span style={{fontSize: '10px', fontWeight: 'normal', color: '#64748b', marginLeft: '6px'}}>QAP: {activeLimits.minCuringPressure}-{activeLimits.maxCuringPressure}</span>}
            </label>
            <input
              type="number"
              step="0.1"
              required
              placeholder="Enter pressure"
              value={formData.curingPressure}
              style={pressureError ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}
              onChange={e => setFormData({ ...formData, curingPressure: e.target.value })}
            />
            {pressureError && <div style={{color: '#ef4444', fontSize: '11px', marginTop: '4px'}}>Deviation from approved QAP limits.</div>}
          </div>

          <div className="status-summary-card" style={{ marginTop: '20px' }}>
            <span className="status-label">Status:</span>
            <span className={`status-badge ${formData.status === 'OK' ? 'status-ok' : 'status-not-ok'}`}>
              {formData.status}
            </span>
          </div>
        </fieldset>
      </div>

      <div className="form-footer">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          {isViewOnly ? 'Close' : 'Cancel'}
        </button>
        {!isViewOnly && (
          <button 
            type="submit" 
            className="btn-submit"
            disabled={isSubmitDisabled}
            style={{ opacity: isSubmitDisabled ? 0.6 : 1, cursor: isSubmitDisabled ? 'not-allowed' : 'pointer' }}
          >
            {editData ? 'Save Changes' : 'Submit Entry'}
          </button>
        )}
      </div>
    </form>
  );
};

export default HydraulicPressForm;
