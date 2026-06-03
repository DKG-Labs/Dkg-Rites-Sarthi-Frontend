import React, { useState } from 'react';
import ReactDOM from 'react-dom';

const MOCK_ENTRIES = {
  'natural-rubber': [
    { id: 1, vendor: 'Rubber Corp', plant: 'Mumbai-01', batchNo: 'NR2024-101', quantity: '500 kg', date: '2026-03-18', status: 'Unverified', invoice: 'INV-001', remarks: 'Standard quality' },
    { id: 2, vendor: 'Eco Rubber', plant: 'Pune-02', batchNo: 'NR2024-102', quantity: '300 kg', date: '2026-03-19', status: 'Verified', invoice: 'INV-005', verifiedBy: 'Process IE - John', verifiedAt: '2026-03-19 14:20' },
    { id: 3, vendor: 'Rubber Corp', plant: 'Mumbai-01', batchNo: 'NR2024-103', quantity: '450 kg', date: '2026-03-20', status: 'Unverified', invoice: 'INV-009', remarks: 'Batch A' }
  ],
  'rss1': [
    { id: 4, vendor: 'Thai Smoked', plant: 'Mumbai-01', batchNo: 'RSS1-99', quantity: '850 kg', date: '2026-03-17', status: 'Unverified', invoice: 'INV-T1', remarks: 'Imported' },
    { id: 21, vendor: 'Global Latex', plant: 'Pune-02', batchNo: 'RSS1-104', quantity: '400 kg', date: '2026-03-19', status: 'Unverified', invoice: 'INV-G4' }
  ],
  'rss2': [
    { id: 22, vendor: 'Kottayam Rubber', plant: 'Pune-02', batchNo: 'RSS2-M1', quantity: '1200 kg', date: '2026-03-20', status: 'Unverified', invoice: 'INV-K1', remarks: 'Kerala source' },
    { id: 23, vendor: 'Global Latex', plant: 'Mumbai-01', batchNo: 'RSS2-G5', quantity: '900 kg', date: '2026-03-18', status: 'Verified', invoice: 'INV-G5', verifiedBy: 'Proc IE - Sarah', verifiedAt: '2026-03-18 10:45' }
  ],
  'rss3': [
    { id: 5, vendor: 'Local Agro', plant: 'Pune-02', batchNo: 'RSS3-X', quantity: '200 kg', date: '2026-03-15', status: 'Unverified', invoice: 'INV-33', remarks: 'Local source' },
    { id: 6, vendor: 'Local Agro', plant: 'Mumbai-01', batchNo: 'RSS3-Y', quantity: '250 kg', date: '2026-03-16', status: 'Unverified', invoice: 'INV-34', remarks: 'Local source' }
  ],
  'sbr': [
    { id: 7, vendor: 'Polymer India', plant: 'Surat-07', batchNo: 'SBR-S1', quantity: '1500 kg', date: '2026-03-19', status: 'Unverified', invoice: 'INV-P1', remarks: 'Synthetic' }
  ],
  'pbr': [
    { id: 8, vendor: 'Polymer India', plant: 'Surat-07', batchNo: 'PBR-P1', quantity: '1000 kg', date: '2026-03-10', status: 'Unverified', invoice: 'INV-P2', remarks: 'Synthetic' },
    { id: 9, vendor: 'Polymer India', plant: 'Surat-07', batchNo: 'PBR-P2', quantity: '1200 kg', date: '2026-03-11', status: 'Unverified', invoice: 'INV-P3', remarks: 'Synthetic' },
    { id: 10, vendor: 'Polymer India', plant: 'Surat-07', batchNo: 'PBR-P3', quantity: '1000 kg', date: '2026-03-12', status: 'Unverified', invoice: 'INV-P4', remarks: 'Synthetic' }
  ],
  'carbon-black': [
    { id: 11, vendor: 'Black Fillers', plant: 'Mumbai-01', batchNo: 'CB-X1', quantity: '2000 kg', date: '2026-03-18', status: 'Unverified', invoice: 'INV-B1' },
    { id: 12, vendor: 'Black Fillers', plant: 'Pune-02', batchNo: 'CB-X2', quantity: '3000 kg', date: '2026-03-19', status: 'Unverified', invoice: 'INV-B2' }
  ]
};

const IE_MAPPED_PLANTS = ['Mumbai-01', 'Pune-02', 'Surat-07'];

const RawMaterialVerificationList = ({ materialId, loggedInUser }) => {
  const allMaterialEntries = MOCK_ENTRIES[materialId] || [];
  
  // Filter entries based on mapped plants (Location-Mapped Visibility)
  const [entries, setEntries] = useState(
    allMaterialEntries.filter(e => IE_MAPPED_PLANTS.includes(e.plant))
  );
  
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const pendingEntries = entries.filter(e => e.status === 'Unverified');
  const verifiedEntries = entries.filter(e => e.status === 'Verified');
  const displayedEntries = activeTab === 'pending' ? pendingEntries : verifiedEntries;

  const handleView = (entry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const handleVerify = () => {
    if (!selectedEntry) return;

    const updatedEntries = entries.map(e => 
      e.id === selectedEntry.id 
        ? { 
            ...e, 
            status: 'Verified', 
            verifiedBy: `Process IE - ${loggedInUser?.userName || 'System'}`,
            verifiedAt: new Date().toLocaleString()
          } 
        : e
    );

    setEntries(updatedEntries);
    setSelectedEntry(updatedEntries.find(e => e.id === selectedEntry.id));
    
    // In a real app, we would call an API here
    alert('Material Verified Successfully!');
  };

  return (
    <div className="verification-list-container">

      {/* ── Tab Bar ── */}
      <div style={{
        display: 'inline-flex',
        background: '#f1f5f9',
        borderRadius: '12px',
        padding: '4px',
        marginBottom: '20px',
        gap: '4px'
      }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '700',
            transition: 'all 0.2s ease',
            background: activeTab === 'pending' ? 'white' : 'transparent',
            color: activeTab === 'pending' ? '#0f766e' : '#64748b',
            boxShadow: activeTab === 'pending' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          Pending Verification
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '22px',
            height: '22px',
            borderRadius: '11px',
            fontSize: '11px',
            fontWeight: '800',
            padding: '0 6px',
            background: activeTab === 'pending' ? '#0f766e' : '#cbd5e1',
            color: 'white'
          }}>
            {pendingEntries.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('verified')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '700',
            transition: 'all 0.2s ease',
            background: activeTab === 'verified' ? 'white' : 'transparent',
            color: activeTab === 'verified' ? '#0f766e' : '#64748b',
            boxShadow: activeTab === 'verified' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          Verified
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '22px',
            height: '22px',
            borderRadius: '11px',
            fontSize: '11px',
            fontWeight: '800',
            padding: '0 6px',
            background: activeTab === 'verified' ? '#0f766e' : '#cbd5e1',
            color: 'white'
          }}>
            {verifiedEntries.length}
          </span>
        </button>
      </div>

      {/* ── Table ── */}
      <div style={{
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        background: 'white'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px'
        }}>
          <thead>
            <tr style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderBottom: '2px solid #e2e8f0'
            }}>
              {['Date', 'Vendor', 'Plant', 'Batch No.', 'Quantity', 'Status', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedEntries.length > 0 ? displayedEntries.map((entry, idx) => (
              <tr 
                key={entry.id}
                style={{
                  background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                  borderBottom: '1px solid #f1f5f9',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0fdfa'}
                onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#f8fafc'}
              >
                <td style={{ padding: '12px 16px', color: '#334155', fontWeight: '500' }}>{entry.date}</td>
                <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: '600' }}>{entry.vendor}</td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>{entry.plant}</td>
                <td style={{ padding: '12px 16px' }}>
                  <code style={{
                    background: '#f1f5f9',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#334155'
                  }}>{entry.batchNo}</code>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: '600', color: '#334155' }}>{entry.quantity}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '700',
                    background: entry.status === 'Verified' ? '#ecfdf5' : '#fff7ed',
                    color: entry.status === 'Verified' ? '#065f46' : '#9a3412',
                    border: `1px solid ${entry.status === 'Verified' ? '#a7f3d0' : '#fed7aa'}`
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: entry.status === 'Verified' ? '#10b981' : '#f97316' }} />
                    {entry.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button 
                    onClick={() => handleView(entry)}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '6px 16px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(59, 130, 246, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = '0 3px 8px rgba(59, 130, 246, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(59, 130, 246, 0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '32px', opacity: 0.6 }}>
                      {activeTab === 'pending' ? '✅' : '📋'}
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#475569', margin: 0 }}>
                      {activeTab === 'pending' ? 'All caught up! No pending verifications.' : 'No verified entries yet.'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                      {activeTab === 'pending' ? 'All vendor submissions for this material have been verified.' : 'Verified material entries will appear here.'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Table Footer */}
        {displayedEntries.length > 0 && (
          <div style={{
            padding: '10px 16px',
            borderTop: '1px solid #f1f5f9',
            background: '#fafbfc',
            fontSize: '12px',
            color: '#64748b',
            fontWeight: '500',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Showing <strong style={{ color: '#334155' }}>{displayedEntries.length}</strong> {activeTab === 'pending' ? 'pending' : 'verified'} {displayedEntries.length === 1 ? 'entry' : 'entries'}</span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Total: {entries.length} records</span>
          </div>
        )}
      </div>

      {isModalOpen && selectedEntry && ReactDOM.createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.65)',
            zIndex: 99999,
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <div style={{
            background: 'white',
            width: '95%',
            maxWidth: '640px',
            maxHeight: '85vh',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            animation: 'fadeInScale 0.2s ease-out'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '20px 24px',
              background: '#FBF6EC',
              borderBottom: '1px solid #e2e8f0',
              flexShrink: 0
            }}>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '800', color: '#13343b' }}>Material Entry Details</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '32px', cursor: 'pointer', color: '#13343b', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <div style={{ 
              padding: '24px', 
              flex: 1, 
              overflowY: 'auto',
              background: '#fff'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vendor</label>
                  <p style={{ margin: '4px 0 0 0', fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{selectedEntry.vendor}</p>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plant Name</label>
                  <p style={{ margin: '4px 0 0 0', fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{selectedEntry.plant}</p>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Material</label>
                  <p style={{ margin: '4px 0 0 0', fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{materialId.replace('-', ' ').toUpperCase()}</p>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Batch Number</label>
                  <p style={{ margin: '4px 0 0 0', fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{selectedEntry.batchNo}</p>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity</label>
                  <p style={{ margin: '4px 0 0 0', fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{selectedEntry.quantity}</p>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice No.</label>
                  <p style={{ margin: '4px 0 0 0', fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{selectedEntry.invoice}</p>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date Submitted</label>
                  <p style={{ margin: '4px 0 0 0', fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{selectedEntry.date}</p>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
                  <div style={{ marginTop: '4px' }}>
                    <span className={`status-badge ${selectedEntry.status === 'Verified' ? 'status-ok' : 'status-pending'}`} style={{
                      background: selectedEntry.status === 'Verified' ? '#ecfdf5' : '#fff7ed',
                      color: selectedEntry.status === 'Verified' ? '#065f46' : '#9a3412',
                      border: `1px solid ${selectedEntry.status === 'Verified' ? '#10b981' : '#f97316'}`
                    }}>
                      {selectedEntry.status}
                    </span>
                  </div>
                </div>
              </div>

              {selectedEntry.remarks && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Remarks</label>
                  <p style={{ margin: '4px 0 0 0', color: '#475569', fontSize: '14px' }}>{selectedEntry.remarks}</p>
                </div>
              )}

              {selectedEntry.status === 'Verified' && (
                <div style={{ 
                  background: '#f8fafc', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0',
                  marginTop: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', marginBottom: '8px' }}>
                    <span style={{ fontSize: '18px' }}>🛡️</span>
                    <span style={{ fontWeight: '800', fontSize: '13px', textTransform: 'uppercase' }}>Verification Recorded</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Verified By</span>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{selectedEntry.verifiedBy}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Verified On</span>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{selectedEntry.verifiedAt}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ 
              padding: '20px 24px', 
              background: '#f8fafc', 
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              flexShrink: 0
            }}>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: '10px 24px',
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  color: '#374151',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              {selectedEntry.status === 'Unverified' && (
                <button 
                  type="button" 
                  onClick={handleVerify}
                  style={{ 
                    background: '#10b981', 
                    color: 'white', 
                    border: 'none', 
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                  }}
                >
                  Verify material entry
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default RawMaterialVerificationList;
