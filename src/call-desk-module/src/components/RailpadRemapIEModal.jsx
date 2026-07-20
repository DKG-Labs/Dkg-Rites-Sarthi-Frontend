import React, { useState, useEffect } from 'react';
import { fetchRailpadRemapAvailableUsers, submitRailpadRemap } from '../services/remapIeApi';

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: '20px', animation: 'fadeIn 0.2s ease-out',
  },
  modal: {
    backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '600px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
    display: 'flex', flexDirection: 'column', maxHeight: '90vh',
  },
  header: {
    padding: '20px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  title: {
    fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0,
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '24px', color: '#64748b',
    cursor: 'pointer', padding: '4px', lineHeight: 1, borderRadius: '6px',
    transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  body: {
    padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px',
  },
  sectionLabel: {
    fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase',
    letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px',
  },
  infoGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px',
  },
  infoCard: {
    backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  infoLabel: {
    fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '500',
  },
  infoValue: {
    fontSize: '14px', color: '#0f172a', fontWeight: '600',
  },
  formGroup: {
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  label: {
    fontSize: '14px', fontWeight: '600', color: '#334155',
  },
  select: {
    width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1',
    fontSize: '15px', color: '#0f172a', backgroundColor: '#ffffff', outline: 'none',
    cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px',
  },
  footer: {
    padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0',
    display: 'flex', justifyContent: 'flex-end', gap: '12px',
  },
  btnSecondary: {
    padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff', color: '#475569', fontSize: '14px', fontWeight: '600',
    cursor: 'pointer', transition: 'all 0.2s',
  },
  btnPrimary: {
    padding: '10px 24px', borderRadius: '8px', border: 'none',
    backgroundColor: '#0ea5e9', color: '#ffffff', fontSize: '14px', fontWeight: '600',
    cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px',
  },
  loadingState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '48px 24px', gap: '14px',
  },
  spinner: {
    width: '40px', height: '40px', border: '3px solid #e0f2fe',
    borderTop: '3px solid #0ea5e9', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

const RailpadRemapIEModal = ({ callNo, plantId, currentIeUserId, currentIeName, currentIeEmployeeCode, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedNewUserId, setSelectedNewUserId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetchRailpadRemapAvailableUsers();
        if (res?.responseStatus?.statusCode === 0) {
          setAvailableUsers(res.responseData || []);
        } else {
          setError('Failed to fetch available users');
        }
      } catch (err) {
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!selectedNewUserId) {
      setError('Please select a new Inspector.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      const payload = {
        callNo,
        plantId,
        oldUserId: currentIeUserId,
        newUserId: selectedNewUserId
      };
      
      const res = await submitRailpadRemap(payload);
      
      if (res?.responseStatus?.statusCode === 0) {
        onSuccess();
      } else {
        setError(res?.responseStatus?.message || 'Remapping failed');
      }
    } catch (err) {
      setError('Error connecting to server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>🔄 Reassign Main IE (RailPad)</h2>
          <button style={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner} />
            <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Loading details...</span>
          </div>
        ) : (
          <>
            <div style={styles.body}>
              {error && (
                <div style={{ padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              <div>
                <div style={styles.sectionLabel}>Call Details</div>
                <div style={styles.infoGrid}>
                  <div style={styles.infoCard}>
                    <div style={styles.infoLabel}>Call Number</div>
                    <div style={styles.infoValue}>{callNo}</div>
                  </div>
                  <div style={styles.infoCard}>
                    <div style={styles.infoLabel}>Stage</div>
                    <div style={styles.infoValue}>Final Static</div>
                  </div>
                  <div style={styles.infoCard}>
                    <div style={styles.infoLabel}>Plant ID</div>
                    <div style={styles.infoValue}>{plantId || 'N/A'}</div>
                  </div>
                  <div style={styles.infoCard}>
                    <div style={styles.infoLabel}>Current Assigned IE</div>
                    <div style={styles.infoValue}>
                      {currentIeName !== '-' && currentIeName ? currentIeName : 'Not Assigned'}
                      {currentIeEmployeeCode ? ` (${currentIeEmployeeCode})` : ''}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div style={styles.sectionLabel}>Reassignment</div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Select New Railpad Main IE</label>
                  <select
                    style={styles.select}
                    value={selectedNewUserId}
                    onChange={(e) => setSelectedNewUserId(e.target.value)}
                    disabled={submitting}
                  >
                    <option value="">-- Select Employee --</option>
                    {availableUsers.map(emp => (
                      <option key={emp.userId} value={emp.userId}>
                        {emp.fullName} ({emp.employeeCode}) - {emp.role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={styles.footer}>
              <button style={styles.btnSecondary} onClick={onClose} disabled={submitting}>Cancel</button>
              <button
                style={{ ...styles.btnPrimary, opacity: submitting || !selectedNewUserId ? 0.7 : 1 }}
                onClick={handleSubmit}
                disabled={submitting || !selectedNewUserId}
              >
                {submitting ? 'Processing...' : 'Confirm Remapping'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RailpadRemapIEModal;
