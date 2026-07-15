import React, { useState, useEffect, useRef } from 'react';
import {
  fetchRemapPoiDetails,
  fetchRemapAssignedUser,
  fetchRemapAvailableEmployees,
  submitRemapIe,
} from '../services/remapIeApi';

// Custom searchable dropdown – avoids antd portal z-index issues inside custom modals
const SearchableSelect = ({ options, value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const selected = options.find(o => o.value === value);
  const filtered = options.filter(o =>
    `${o.empName} ${o.empCode}`.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (opt) => {
    onChange(opt.value);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', border: `1.5px solid ${open ? '#2563eb' : '#e2e8f0'}`,
          borderRadius: '10px', cursor: 'pointer', background: '#fff',
          transition: 'border-color 0.2s', userSelect: 'none',
          boxShadow: open ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
        }}
      >
        <span style={{ color: selected ? '#1e293b' : '#94a3b8', fontWeight: selected ? 600 : 400, fontSize: '0.875rem' }}>
          {selected ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {selected.empName}
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>{selected.empCode}</span>
            </span>
          ) : placeholder}
        </span>
        <span style={{ color: '#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: '0.8rem' }}>▾</span>
      </div>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)', zIndex: 9999, overflow: 'hidden',
        }}>
          {/* Search input */}
          <div style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or code..."
              style={{
                width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0',
                borderRadius: '8px', fontSize: '0.85rem', outline: 'none',
                color: '#1e293b', background: '#f8fafc',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Options list */}
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No employees found</div>
            ) : (
              filtered.map(opt => (
                <div
                  key={opt.key}
                  onClick={() => handleSelect(opt)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', cursor: 'pointer',
                    background: value === opt.value ? '#eff6ff' : 'transparent',
                    borderLeft: value === opt.value ? '3px solid #2563eb' : '3px solid transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (value !== opt.value) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { if (value !== opt.value) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{opt.empName}</span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>{opt.empCode}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};


const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 1200, padding: '1rem',
  },
  modal: {
    background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '720px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
    display: 'flex', flexDirection: 'column', maxHeight: '90vh',
  },
  header: {
    background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
    color: '#0369a1', padding: '20px 24px', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
    borderBottom: '1px solid #bae6fd',
  },
  headerTitle: { margin: 0, fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.01em', color: '#0c4a6e' },
  closeBtn: {
    background: 'rgba(3,105,161,0.12)', border: 'none', color: '#0369a1',
    borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer',
    fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.2s',
  },
  body: { padding: '24px', overflowY: 'auto', flex: 1 },
  section: { marginBottom: '20px' },
  sectionLabel: {
    fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.1em', color: '#64748b', marginBottom: '10px',
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  sectionLine: { flex: 1, height: '1px', background: '#e2e8f0' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  infoCard: {
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
    padding: '12px 14px',
  },
  infoLabel: { fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' },
  infoValue: { fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.4 },
  ieCard: {
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    border: '1px solid #bae6fd', borderRadius: '12px', padding: '16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
  },
  ieAvatar: {
    width: '42px', height: '42px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #38bdf8, #7dd3fc)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#0c4a6e', fontWeight: 700, fontSize: '1rem', flexShrink: 0,
  },
  ieName: { fontSize: '0.95rem', fontWeight: 700, color: '#0c4a6e' },
  ieCode: { fontSize: '0.78rem', color: '#0369a1', marginTop: '2px' },
  badge: {
    background: 'linear-gradient(135deg, #38bdf8, #7dd3fc)',
    color: '#0c4a6e', padding: '4px 12px', borderRadius: '20px',
    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0,
  },
  noIe: {
    background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '10px',
    padding: '12px 16px', color: '#be123c', fontWeight: 600, fontSize: '0.85rem',
  },
  selectWrapper: {
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px',
  },
  selectLabel: { fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' },
  footer: {
    padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0',
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', flexShrink: 0,
  },
  cancelBtn: {
    padding: '9px 24px', borderRadius: '10px', border: '1.5px solid #bae6fd',
    background: '#f0f9ff', color: '#0369a1', fontWeight: 600, fontSize: '0.875rem',
    cursor: 'pointer', transition: 'all 0.2s',
  },
  submitBtn: {
    padding: '9px 28px', borderRadius: '10px', border: 'none',
    background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
    color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
    transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(14,165,233,0.35)',
  },
  submitBtnDisabled: {
    opacity: 0.5, cursor: 'not-allowed', boxShadow: 'none',
  },
  errorBox: {
    background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px',
    padding: '10px 14px', color: '#be123c', fontSize: '0.82rem', fontWeight: 600, marginBottom: '14px',
  },
  loadingWrapper: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '48px 24px', gap: '14px',
  },
  spinner: {
    width: '40px', height: '40px', border: '3px solid #e0f2fe',
    borderTop: '3px solid #0ea5e9', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

const SectionHeader = ({ children }) => (
  <div style={styles.sectionLabel}>
    {children}
    <span style={styles.sectionLine} />
  </div>
);

const InfoCard = ({ label, value }) => (
  <div style={styles.infoCard}>
    <div style={styles.infoLabel}>{label}</div>
    <div style={styles.infoValue}>{value || '—'}</div>
  </div>
);

const RemapIEModal = ({ callNo, stage, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedNewEmpCode, setSelectedNewEmpCode] = useState('');

  // Deduce stage code for backend
  let stageCode = 'ER';
  let stageName = 'Raw Material';
  if (callNo.includes('EP')) { stageCode = 'EP'; stageName = 'Process'; }
  if (callNo.includes('EF')) { stageCode = 'EF'; stageName = 'Final'; }

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);

        // Step 1: POI details
        const poiData = await fetchRemapPoiDetails(callNo);
        if (!poiData.responseStatus || poiData.responseStatus.statusCode !== 0) {
          setError(poiData.responseStatus?.message || 'Failed to load POI details');
          setLoading(false);
          return;
        }
        const poiCode = poiData.responseData.poiCode;

        // Step 2: Assigned user + available employees in parallel
        const [userData, empData] = await Promise.all([
          fetchRemapAssignedUser(callNo, stageCode, poiCode),
          fetchRemapAvailableEmployees(stageCode),
        ]);

        if (userData.responseStatus?.statusCode === 0 && empData.responseStatus?.statusCode === 0) {
          setDetails({ ...poiData.responseData, ...userData.responseData, availableEmployees: empData.responseData });
        } else {
          setError(userData.responseStatus?.message || empData.responseStatus?.message || 'Failed to load details');
        }
      } catch (err) {
        setError('Failed to load mapping details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [callNo, stageCode]);

  const handleSubmit = async () => {
    if (!selectedNewEmpCode) { setError('Please select a new employee to reassign.'); return; }
    if (selectedNewEmpCode === details.currentMappedEmployeeCode) { setError('Selected employee is already mapped.'); return; }
    try {
      setSubmitting(true); setError('');
      const data = await submitRemapIe({
        callNo,
        poiCode: details.poiCode,
        previousEmpCode: details.currentMappedEmployeeCode,
        newEmpCode: selectedNewEmpCode,
        stage: stageCode,
      });
      if (data.responseStatus?.statusCode === 0) {
        setSuccessMsg('Inspection Engineer reassigned successfully!');
        setTimeout(() => onSuccess(), 1500);
      } else if (data.status === 'error') {
        setError(data.message || 'Reassignment failed');
      } else {
        setError('Reassignment failed');
      }
    } catch (err) {
      setError('Reassignment failed due to network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';
  const sortedEmployees = [...(details?.availableEmployees || [])].sort((a, b) => (a.employeeName || '').localeCompare(b.employeeName || ''));

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
      <div style={styles.overlay}>
        <div style={{ ...styles.modal, animation: 'fadeIn 0.2s ease-out' }}>

          {/* Header */}
          <div style={styles.header}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#0369a1', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Call Desk</div>
              <h5 style={styles.headerTitle}>Reassign Inspection Engineer</h5>
            </div>
            <button style={styles.closeBtn} onClick={onClose}>✕</button>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div style={{
              background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
              borderBottom: '1px solid #6ee7b7',
              padding: '12px 24px',
              display: 'flex', alignItems: 'center', gap: '10px',
              animation: 'slideDown 0.3s ease-out',
              color: '#065f46', fontWeight: 600, fontSize: '0.9rem',
            }}>
              <span style={{ fontSize: '1.2rem' }}>✓</span>
              {successMsg}
            </div>
          )}

          {/* Body */}
          <div style={styles.body}>
            {loading ? (
              <div style={styles.loadingWrapper}>
                <div style={styles.spinner} />
                <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>Loading details…</span>
              </div>
            ) : error && !details ? (
              <div style={styles.errorBox}>⚠ {error}</div>
            ) : details && (
              <>
                {/* Call + Stage — 2 per row */}
                <div style={styles.section}>
                  <SectionHeader>Call Information</SectionHeader>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <InfoCard label="Call Number" value={callNo} />
                    <InfoCard label="Stage" value={stageName} />
                  </div>
                </div>

                {/* Place of Inspection — 3 per row */}
                <div style={styles.section}>
                  <SectionHeader>Place of Inspection</SectionHeader>
                  <div style={styles.grid3}>
                    <InfoCard label="Company Name" value={details.companyName} />
                    <InfoCard label="Unit Name" value={details.unitName} />
                    <InfoCard label="Unit Address" value={details.unitAddress} />
                  </div>
                </div>

                {/* Currently Mapped IE */}
                <div style={styles.section}>
                  <SectionHeader>Currently Mapped IE</SectionHeader>
                  {details.currentMappedEmployeeCode ? (
                    <div style={styles.ieCard}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={styles.ieAvatar}>{initials(details.currentMappedEmployeeName)}</div>
                        <div>
                          <div style={styles.ieName}>{details.currentMappedEmployeeName}</div>
                          <div style={styles.ieCode}>Emp Code: {details.currentMappedEmployeeCode}</div>
                        </div>
                      </div>
                      <div style={styles.badge}>{details.currentMappedEmployeeRole}</div>
                    </div>
                  ) : (
                    <div style={styles.noIe}>⚠ No IE is currently mapped to this call.</div>
                  )}
                </div>

                {/* Reassign Section */}
                <div style={styles.section}>
                  <SectionHeader>Re Assign To New IE</SectionHeader>
                  {error && <div style={styles.errorBox}>⚠ {error}</div>}
                  <div style={styles.selectWrapper}>
                    <div style={styles.selectLabel}>Select Available Employee</div>
                    <SearchableSelect
                      value={selectedNewEmpCode}
                      onChange={setSelectedNewEmpCode}
                      placeholder="Click to select an employee..."
                      options={sortedEmployees
                        .filter(emp => emp.employeeCode && emp.employeeName)
                        .map(emp => ({
                          key: emp.userId,
                          value: emp.employeeCode,
                          empName: emp.employeeName,
                          empCode: emp.employeeCode,
                        }))
                      }
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <button style={styles.cancelBtn} onClick={onClose} disabled={submitting}>Cancel</button>
            <button
              style={{ ...styles.submitBtn, ...(loading || submitting || !details || !selectedNewEmpCode ? styles.submitBtnDisabled : {}) }}
              onClick={handleSubmit}
              disabled={loading || submitting || !details || !selectedNewEmpCode}
            >
              {submitting ? '⏳ Reassigning…' : '✓  Reassign IE'}
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default RemapIEModal;
