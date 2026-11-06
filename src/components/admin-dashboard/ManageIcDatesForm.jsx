import React, { useState } from 'react';
import './ManageIcDatesForm.css';
import { getIcDetails, updateIcDate, getIcViewUrl } from '../../services/adminIcService';
import { Snackbar, Alert, Slide } from '@mui/material';

const ManageIcDatesForm = () => {
  const [callNo, setCallNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [icData, setIcData] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleFetch = async () => {
    if (!callNo.trim()) {
      setErrors({ callNo: 'Call number is required' });
      return;
    }

    setFetchLoading(true);
    setErrors({});
    try {
      const data = await getIcDetails(callNo);
      setIcData(data);
      setNewDate(data?.currentDate || '');
    } catch (err) {
      setErrors({ fetch: err.message || 'IC not found' });
      setIcData(null);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newDate) {
      setErrors({ newDate: 'New date is required' });
      return;
    }

    // Validate date is not in future
    const selectedDate = new Date(newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      setErrors({ newDate: 'Cannot set future dates' });
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      await updateIcDate(callNo.trim(), newDate);
      setSnackbar({ open: true, message: `IC date updated successfully: ${newDate}`, severity: 'success' });
      setIcData(null);
      setCallNo('');
      setNewDate('');
    } catch (error) {
      const errorMsg = error.message || 'Failed to update IC date';
      setErrors({ submit: errorMsg });
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'left' }}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          className={`mic-toast mic-toast--${snackbar.severity}`}
        >
          <div className="mic-toast__title">
            {snackbar.severity === 'success' ? 'Saved' : snackbar.severity === 'error' ? 'Something went wrong' : 'Notice'}
          </div>
          <div className="mic-toast__msg">{snackbar.message}</div>
          <span className="mic-toast__bar" />
        </Alert>
      </Snackbar>

      <div className="manage-ic-dates-container">
        <div className="manage-ic-dates-header">
        <h2>Manage IC Dates</h2>
        <p>Search for an IC by call number and update its creation date</p>
      </div>

      <div className="manage-ic-dates-form">
        {/* Call Number Input */}
        <div className="form-group">
          <label htmlFor="callNo">Call Number *</label>
          <div className="input-group">
            <input
              type="text"
              id="callNo"
              placeholder="e.g., RPF-081826001, EP-1016260001"
              value={callNo}
              onChange={(e) => setCallNo(e.target.value)}
              disabled={!!icData}
              className={errors.callNo ? 'error' : ''}
            />
            <button
              onClick={handleFetch}
              disabled={fetchLoading || !!icData}
              className="btn-fetch"
            >
              {fetchLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {errors.callNo && <span className="error-msg">{errors.callNo}</span>}
        </div>

        {errors.fetch && <div className="error-box">{errors.fetch}</div>}

        {/* IC Details (after fetch) */}
        {icData && (
          <div className="ic-details">
            <div className="details-grid">
              <div className="detail-item">
                <label>Call Number</label>
                <p>{icData.callNo}</p>
              </div>

              <div className="detail-item">
                <label>IC Number</label>
                <p>{icData.icNumber}</p>
              </div>

              <div className="detail-item">
                <label>Current Date</label>
                <p>{icData.currentDate}</p>
              </div>

              <div className="detail-item">
                <label>IC Document</label>
                <a
                  href={getIcViewUrl(icData.icLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-view-ic"
                >
                  View IC →
                </a>
              </div>
            </div>

            {/* Date Picker */}
            <div className="form-group">
              <label htmlFor="newDate">New Date *</label>
              <input
                type="date"
                id="newDate"
                value={newDate}
                onChange={(e) => {
                  setNewDate(e.target.value);
                  setErrors({ ...errors, newDate: '' });
                }}
                className={errors.newDate ? 'error' : ''}
              />
              {errors.newDate && <span className="error-msg">{errors.newDate}</span>}
              <small>Cannot set future dates. Date must be today or earlier.</small>
            </div>

            {errors.submit && <div className="error-box">{errors.submit}</div>}

            {/* Action Buttons */}
            <div className="form-actions">
              <button
                onClick={handleSave}
                disabled={loading}
                className="btn-save"
              >
                {loading ? 'Saving...' : 'Save Date'}
              </button>

              <button
                onClick={() => {
                  setIcData(null);
                  setCallNo('');
                  setNewDate('');
                  setErrors({});
                }}
                disabled={loading}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default ManageIcDatesForm;
