import React, { useState, useEffect } from 'react';

const SheetingForm = ({ onSubmit, onCancel, editData, isViewOnly }) => {
  const [isFormLoading, setIsFormLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [formData, setFormData] = useState({
    batchNo: '',
    sheeting: 'Ensured',
    remarks: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewOnly) return;
    
    if (!formData.batchNo.trim()) {
      setNotification({ type: 'error', message: 'Batch Number is required.' });
      return;
    }

    setIsSubmitting(true);
    setNotification({ type: '', message: '' });
    
    const status = formData.sheeting === 'Ensured' ? 'OK' : 'Not OK';
    
    try {
      await onSubmit({
        ...formData,
        status,
        timestamp: formData.timestamp || new Date().toLocaleString()
      });
      // form is closed by parent on success
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: error.message || 'Failed to save entry. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFormLoading) {
    return (
      <div className="form-modal-container">
        <div className="form-modal-header">
          <h2 className="form-header-title">{isViewOnly ? 'View' : (editData ? 'Edit' : 'Add')} Sheeting / Sizing</h2>
        </div>
        <div className="form-modal-body">
          <div className="form-group">
            <div className="skeleton-bar" style={{ width: '120px', height: '14px', marginBottom: '8px' }} />
            <div className="skeleton-bar" style={{ width: '100%', height: '40px', borderRadius: '6px' }} />
          </div>
          <div className="form-group" style={{ marginTop: '12px' }}>
            <div className="skeleton-bar" style={{ width: '150px', height: '14px', marginBottom: '8px' }} />
            <div className="skeleton-bar" style={{ width: '100%', height: '40px', borderRadius: '6px' }} />
          </div>
          <div className="form-group" style={{ marginTop: '12px' }}>
            <div className="skeleton-bar" style={{ width: '160px', height: '14px', marginBottom: '8px' }} />
            <div className="skeleton-bar" style={{ width: '100%', height: '100px', borderRadius: '6px' }} />
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
        <h2 className="form-header-title">{isViewOnly ? 'View' : (editData ? 'Edit' : 'Add')} Sheeting / Sizing</h2>
      </div>

      <div className="form-modal-body">
        {notification.message && (
          <div style={{
            padding: '12px',
            marginBottom: '16px',
            borderRadius: '6px',
            backgroundColor: notification.type === 'error' ? '#fef2f2' : '#ecfdf5',
            color: notification.type === 'error' ? '#dc2626' : '#059669',
            border: `1px solid ${notification.type === 'error' ? '#f87171' : '#34d399'}`,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {notification.type === 'error' ? '⚠️' : '✅'} {notification.message}
          </div>
        )}

        <fieldset disabled={isViewOnly || isSubmitting} style={{ border: 'none', padding: 0, margin: 0, width: '100%' }}>
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
        </fieldset>
      </div>

      <div className="form-footer">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSubmitting}>
          {isViewOnly ? 'Close' : 'Cancel'}
        </button>
        {!isViewOnly && (
          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (editData ? 'Save Changes' : 'Submit Entry')}
          </button>
        )}
      </div>
    </form>
  );
};

export default SheetingForm;
