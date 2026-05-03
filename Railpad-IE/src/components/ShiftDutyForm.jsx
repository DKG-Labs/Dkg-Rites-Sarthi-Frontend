import React, { useState } from 'react';

const ShiftDutyForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    shift: '',
    company: '',
    date: new Date().toISOString().split('T')[0],
    unit: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.shift && formData.company && formData.date && formData.unit) {
      onSubmit(formData);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div className="modal-content" style={{
        background: '#fff',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '480px',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'modalFadeIn 0.3s ease-out'
      }}>
        {/* Header Bar */}
        <div style={{
          background: '#fffbeb',
          padding: '16px 20px',
          borderBottom: '1px solid #fef3c7',
          textAlign: 'center'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '19px',
            fontWeight: '700',
            color: '#064e3b',
            letterSpacing: '-0.01em'
          }}>
            Initialize Shift Duty
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
          {/* Shift Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#8b9bb4', marginBottom: '8px' }}>
              Shift Selection
            </label>
            <select 
              name="shift" 
              value={formData.shift} 
              onChange={handleChange}
              required
              style={{
                width: '100%',
                height: '46px',
                padding: '0 16px',
                borderRadius: '10px',
                border: '1px solid #d1dbe5',
                background: 'white',
                fontSize: '14px',
                color: formData.shift ? '#1e293b' : '#94a3b8',
                fontWeight: '500',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="" disabled>Select Shift</option>
              <option value="A">Shift A (06:00 - 14:00)</option>
              <option value="B">Shift B (14:00 - 22:00)</option>
              <option value="C">Shift C (22:00 - 06:00)</option>
            </select>
          </div>

          {/* Company Name */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#8b9bb4', marginBottom: '8px' }}>
              Company Name
            </label>
            <select 
              name="company" 
              value={formData.company} 
              onChange={handleChange}
              required
              style={{
                width: '100%',
                height: '46px',
                padding: '0 16px',
                borderRadius: '10px',
                border: '1px solid #d1dbe5',
                background: 'white',
                fontSize: '14px',
                color: formData.company ? '#1e293b' : '#94a3b8',
                fontWeight: '500',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="" disabled>Select Company</option>
              <option value="DKG Plastics">DKG Plastics</option>
              <option value="Rites Ltd">Rites Ltd</option>
              <option value="Sarthi Infra">Sarthi Infra</option>
            </select>
          </div>

          {/* Casting Date */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#8b9bb4', marginBottom: '8px' }}>
              Casting Date
            </label>
            <input 
              type="date" 
              name="date" 
              value={formData.date} 
              onChange={handleChange}
              required
              style={{
                width: '100%',
                height: '46px',
                padding: '0 16px',
                borderRadius: '10px',
                border: '1px solid #d1dbe5',
                background: 'white',
                fontSize: '14px',
                color: '#1e293b',
                fontWeight: '500',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Production Unit */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#8b9bb4', marginBottom: '8px' }}>
              Production Unit
            </label>
            <select 
              name="unit" 
              value={formData.unit} 
              onChange={handleChange}
              required
              style={{
                width: '100%',
                height: '46px',
                padding: '0 16px',
                borderRadius: '10px',
                border: '1px solid #d1dbe5',
                background: 'white',
                fontSize: '14px',
                color: formData.unit ? '#1e293b' : '#94a3b8',
                fontWeight: '500',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="" disabled>Select Unit</option>
              <option value="Unit 1 - Moulding">Unit 1 - Moulding</option>
              <option value="Unit 2 - Finishing">Unit 2 - Finishing</option>
              <option value="Unit 3 - QA">Unit 3 - QA</option>
            </select>
          </div>

          <div style={{
            height: '1px',
            background: '#f1f5f9',
            margin: '32px 0 24px 0'
          }} />

          <div style={{
            display: 'flex',
            gap: '24px',
            alignItems: 'center'
          }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '30px',
                border: '1px solid #d1dbe5',
                background: 'white',
                color: '#8b9bb4',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1.5,
                padding: '12px',
                borderRadius: '30px',
                border: 'none',
                background: '#338691',
                color: 'white',
                fontSize: '15px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(51, 134, 145, 0.3)'
              }}
            >
              Begin Logging
            </button>
          </div>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}} />
    </div>
  );
};

export default ShiftDutyForm;
