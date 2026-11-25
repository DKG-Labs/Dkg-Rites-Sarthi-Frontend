import React, { useRef, useState } from 'react';
import './ManageIcDatesForm.css';
import { getIcDetails, updateIcDate, getIcViewUrl } from '../../services/adminIcService';
import { Snackbar, Alert, Slide } from '@mui/material';

/*
 * Super Admin – Manage IC Dates
 * 1. Search an IC by call number  2. Review the IC  3. Pick the new date (today or earlier) and save.
 */

const todayIso = () => new Date().toLocaleDateString('en-CA');            // yyyy-mm-dd (local)
const fmt = (d) => {                                                       // DD/MM/YYYY
  if (!d) return '-';
  const [y, m, day] = String(d).slice(0, 10).split('-');
  return y && m && day ? `${day}/${m}/${y}` : String(d);
};

const ManageIcDatesForm = () => {
  const [callNo, setCallNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [icData, setIcData] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const inputRef = useRef(null);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const reset = () => {
    setIcData(null);
    setCallNo('');
    setNewDate('');
    setErrors({});
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleFetch = async () => {
    if (!callNo.trim()) {
      setErrors({ callNo: 'Enter a call number' });
      return;
    }
    setFetchLoading(true);
    setErrors({});
    try {
      const data = await getIcDetails(callNo.trim());
      setIcData(data);
      setNewDate(data?.currentDate || '');
    } catch (err) {
      setErrors({ fetch: err.message || 'IC not found for this call number.' });
      setIcData(null);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newDate) {
      setErrors({ newDate: 'Select the new IC date' });
      return;
    }
    if (newDate > todayIso()) {
      setErrors({ newDate: 'The IC date cannot be in the future' });
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      await updateIcDate(callNo.trim(), newDate);
      setSnackbar({ open: true, message: `IC date of ${callNo.trim()} changed to ${fmt(newDate)}.`, severity: 'success' });
      reset();
    } catch (error) {
      const errorMsg = error.message || 'Could not update the IC date.';
      setErrors({ submit: errorMsg });
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const unchanged = icData && newDate === (icData.currentDate || '').slice(0, 10);

  return (
    <>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'left' }}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} className={`mic-toast mic-toast--${snackbar.severity}`}>
          <div className="mic-toast__title">
            {snackbar.severity === 'success' ? 'Saved' : snackbar.severity === 'error' ? 'Something went wrong' : 'Notice'}
          </div>
          <div className="mic-toast__msg">{snackbar.message}</div>
          <span className="mic-toast__bar" />
        </Alert>
      </Snackbar>

      <div className="manage-ic-dates-container">
        <header className="mic-head">
          <div>
            <h2>Manage IC Dates</h2>
            <p>Find an inspection certificate by its call number and correct its IC date.</p>
          </div>
        </header>

        {/* Search */}
        <section className="mic-card" aria-label="Find IC">
          <label htmlFor="callNo" className="mic-label">Call number <span className="mic-req">*</span></label>
          <div className="mic-search">
            <div className={`mic-search-box ${errors.callNo ? 'is-error' : ''}`}>
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                id="callNo"
                placeholder="e.g. RPF-081826001, EP-1016260001"
                value={callNo}
                autoComplete="off"
                onChange={(e) => { setCallNo(e.target.value); if (errors.callNo) setErrors({}); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !fetchLoading && !icData) handleFetch(); }}
                disabled={!!icData}
              />
              {icData && (
                <button type="button" className="mic-clear" onClick={reset} disabled={loading} aria-label="Search another call">
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>
            {!icData && (
              <button type="button" onClick={handleFetch} disabled={fetchLoading} className="mic-btn mic-btn-primary">
                {fetchLoading ? <span className="mic-spinner" aria-hidden="true" /> : null}
                {fetchLoading ? 'Searching…' : 'Search'}
              </button>
            )}
          </div>
          {errors.callNo && <span className="mic-error-msg">{errors.callNo}</span>}

          {errors.fetch && (
            <div className="mic-alert" role="alert">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              <span>{errors.fetch}</span>
              <button type="button" className="mic-link" onClick={handleFetch}>Retry</button>
            </div>
          )}

          {fetchLoading && (
            <div className="mic-skeleton" aria-hidden="true">
              <span /><span /><span /><span />
            </div>
          )}

          {!icData && !fetchLoading && !errors.fetch && (
            <ol className="mic-steps">
              <li><span>1</span>Enter the call number and press Search</li>
              <li><span>2</span>Check the IC details and open the IC if needed</li>
              <li><span>3</span>Pick the new date (today or earlier) and save</li>
            </ol>
          )}
        </section>

        {/* IC details + new date */}
        {icData && (
          <section className="mic-card" aria-label="IC details">
            <div className="mic-section-title">IC details</div>
            <div className="mic-details">
              <div className="mic-detail">
                <span>Call number</span>
                <strong>{icData.callNo}</strong>
              </div>
              <div className="mic-detail">
                <span>IC number</span>
                <strong>{icData.icNumber || '-'}</strong>
              </div>
              <div className="mic-detail">
                <span>Current IC date</span>
                <strong>{fmt(icData.currentDate)}</strong>
              </div>
              <div className="mic-detail">
                <span>IC document</span>
                {icData.icLink ? (
                  <a href={getIcViewUrl(icData.icLink)} target="_blank" rel="noopener noreferrer" className="mic-doc">
                    <i className="fa-regular fa-file-pdf" aria-hidden="true" /> View IC
                  </a>
                ) : <strong>-</strong>}
              </div>
            </div>

            <div className="mic-divider" />

            <div className="mic-change">
              <div className="mic-field">
                <label htmlFor="newDate" className="mic-label">New IC date <span className="mic-req">*</span></label>
                <input
                  type="date"
                  id="newDate"
                  value={newDate}
                  max={todayIso()}
                  onChange={(e) => { setNewDate(e.target.value); setErrors({ ...errors, newDate: '', submit: '' }); }}
                  className={errors.newDate ? 'is-error' : ''}
                />
                {errors.newDate
                  ? <span className="mic-error-msg">{errors.newDate}</span>
                  : <span className="mic-hint">Today or an earlier date.</span>}
              </div>

              {newDate && !unchanged && (
                <div className="mic-preview" aria-live="polite">
                  <span className="mic-old">{fmt(icData.currentDate)}</span>
                  <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                  <strong>{fmt(newDate)}</strong>
                </div>
              )}
            </div>

            {errors.submit && (
              <div className="mic-alert" role="alert">
                <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
                <span>{errors.submit}</span>
              </div>
            )}

            <div className="mic-actions">
              <button type="button" onClick={reset} disabled={loading} className="mic-btn mic-btn-secondary">Cancel</button>
              <button type="button" onClick={handleSave} disabled={loading || !newDate || unchanged} className="mic-btn mic-btn-primary">
                {loading ? <span className="mic-spinner" aria-hidden="true" /> : null}
                {loading ? 'Saving…' : 'Save date'}
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default ManageIcDatesForm;
