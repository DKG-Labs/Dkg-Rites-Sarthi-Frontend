import React, { useState, useEffect } from 'react';
import { getStoredUser } from '../services/authService';
import { getBaseUrl, API_ENDPOINTS, getDefaultHeaders } from '../services/apiConfig';

const ShiftDutyForm = ({ onSubmit, onCancel, hideCompanyAndUnit = false, initialData = {} }) => {
  const [formData, setFormData] = useState({
    shift: initialData.shift || '',
    company: initialData.company || '',
    date: initialData.date || new Date().toISOString().split('T')[0],
    unit: initialData.unit || ''
  });
  const [companies, setCompanies] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [units, setUnits] = useState([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoadingCompanies(true);
      try {
        const user = getStoredUser();
        if (!user || !user.userId) return;

        const response = await fetch(`${getBaseUrl()}${API_ENDPOINTS.RAILPAD_WORKFLOW.GET_MAPPED_COMPANIES}?userId=${user.userId}`, {
          headers: getDefaultHeaders(user.token)
        });
        
        const data = await response.json();
        if (data.responseStatus?.statusCode === 0) {
          setCompanies(data.responseData || []);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, []);

  useEffect(() => {
    const fetchUnits = async () => {
      if (!formData.company) {
        setUnits([]);
        return;
      }

      setIsLoadingUnits(true);
      try {
        const user = getStoredUser();
        const response = await fetch(`${getBaseUrl()}${API_ENDPOINTS.RAILPAD_WORKFLOW.GET_PLANTS_BY_COMPANY}?companyName=${encodeURIComponent(formData.company)}`, {
          headers: getDefaultHeaders(user?.token)
        });
        
        const data = await response.json();
        if (data.responseStatus?.statusCode === 0) {
          setUnits(data.responseData || []);
        }
      } catch (error) {
        console.error('Error fetching units:', error);
      } finally {
        setIsLoadingUnits(false);
      }
    };

    fetchUnits();
  }, [formData.company]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value,
      ...(name === 'company' ? { unit: '' } : {}) // Reset unit when company changes
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const isCompanyValid = hideCompanyAndUnit || formData.company;
    const isUnitValid = hideCompanyAndUnit || formData.unit;

    if (formData.shift && isCompanyValid && formData.date && isUnitValid) {
      setIsSubmitting(true);
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
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px'
    }}>
      <div className="modal-content-duty" style={{
        background: '#fff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '380px', // Set to 380px for a perfectly balanced sleek width
        overflow: 'hidden',
        boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.05)',
        animation: 'modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        border: '1px solid rgba(255, 255, 255, 0.8)'
      }}>
        {/* Header Bar with Teal Gradient */}
        <div style={{
          background: 'linear-gradient(135deg, #21808d 0%, #155e67 100%)',
          padding: '16px 16px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2px'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h2 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '800',
            color: '#ffffff',
            letterSpacing: '-0.01em'
          }}>
            Initialize Shift Duty
          </h2>
          <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.75)', fontWeight: '500' }}>
            Set up your current duty environment
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '16px' }}>
          {/* Shift Selection */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Shift Selection <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select 
              name="shift" 
              value={formData.shift} 
              onChange={handleChange}
              required
              className="form-input-premium"
              style={{
                color: formData.shift ? '#1e293b' : '#64748b',
              }}
            >
              <option value="" disabled>Select Shift</option>
              <option value="A">Shift A</option>
              <option value="B">Shift B</option>
              <option value="C">Shift C</option>
              <option value="General">General Shift</option>
            </select>
          </div>

          {/* Company Name */}
          {!hideCompanyAndUnit && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Company Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select 
                name="company" 
                value={formData.company} 
                onChange={handleChange}
                required
                disabled={isLoadingCompanies}
                className="form-input-premium"
                style={{
                  color: formData.company ? '#1e293b' : '#64748b',
                  cursor: isLoadingCompanies ? 'wait' : 'pointer'
                }}
              >
                <option value="" disabled>{isLoadingCompanies ? 'Loading...' : 'Select Company'}</option>
                {companies.map((company, index) => (
                  <option key={index} value={company}>{company}</option>
                ))}
              </select>
            </div>
          )}

          {/* Casting Date */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Casting Date <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input 
              type="date" 
              name="date" 
              value={formData.date} 
              onChange={handleChange}
              required
              className="form-input-premium"
              style={{
                color: '#1e293b',
              }}
            />
          </div>

          {/* Production Unit */}
          {!hideCompanyAndUnit && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Production Unit <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select 
                name="unit" 
                value={formData.unit} 
                onChange={handleChange}
                required
                disabled={isLoadingUnits || !formData.company}
                className="form-input-premium"
                style={{
                  color: formData.unit ? '#1e293b' : '#64748b',
                  cursor: (isLoadingUnits || !formData.company) ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="" disabled>
                  {!formData.company ? 'Select company first' : (isLoadingUnits ? 'Loading units...' : 'Select Unit')}
                </option>
                {units.map((unit, index) => (
                  <option key={index} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{
            height: '1px',
            background: '#e2e8f0',
            margin: '16px 0 12px 0'
          }} />

          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <button
              type="button"
              onClick={onCancel}
              className="btn-cancel-premium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit-premium"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Verifying...' : 'Begin Logging'}
            </button>
          </div>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .modal-content-duty {
          max-width: 380px !important; /* Force override of the global max-width: 600px !important from index.css */
          max-height: 90vh !important;
        }

        .form-input-premium {
          width: 100%;
          height: 36px;
          padding: 0 10px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          font-size: 13px;
          font-weight: 500;
          outline: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
        }

        .form-input-premium:focus {
          border-color: #21808d;
          background: white;
          box-shadow: 0 0 0 3px rgba(33, 128, 141, 0.12);
        }

        .form-input-premium:hover:not(:disabled) {
          border-color: #94a3b8;
          background: #f1f5f9;
        }

        .btn-cancel-premium {
          flex: 1;
          padding: 8px;
          border-radius: 50px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: center;
          outline: none;
        }

        .btn-cancel-premium:hover {
          background: #f1f5f9;
          color: #334155;
          border-color: #94a3b8;
          transform: translateY(-1px);
        }

        .btn-cancel-premium:active {
          transform: translateY(0);
        }

        .btn-submit-premium {
          flex: 1.4;
          padding: 8px;
          border-radius: 50px;
          border: none;
          background: linear-gradient(135deg, #21808d 0%, #155e67 100%);
          color: white;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 10px rgba(33, 128, 141, 0.2);
          text-align: center;
          outline: none;
        }

        .btn-submit-premium:hover {
          background: linear-gradient(135deg, #2a9ba9 0%, #1a747e 100%);
          box-shadow: 0 5px 15px rgba(33, 128, 141, 0.35);
          transform: translateY(-1px);
        }

        .btn-submit-premium:active {
          transform: translateY(0);
        }

        .btn-submit-premium:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
      `}} />
    </div>
  );
};

export default ShiftDutyForm;
