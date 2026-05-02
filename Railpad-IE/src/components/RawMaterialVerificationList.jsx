import React, { useState } from 'react';

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
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Vendor</th>
              <th>Plant Name</th>
              <th>Batch No.</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.length > 0 ? entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.date}</td>
                <td>{entry.vendor}</td>
                <td>{entry.plant}</td>
                <td>{entry.batchNo}</td>
                <td>{entry.quantity}</td>
                <td>
                  <span className={`status-badge ${entry.status === 'Verified' ? 'status-ok' : 'status-pending'}`} style={{
                    background: entry.status === 'Verified' ? '#ecfdf5' : '#fff7ed',
                    color: entry.status === 'Verified' ? '#065f46' : '#9a3412',
                    border: `1px solid ${entry.status === 'Verified' ? '#10b981' : '#f97316'}`
                  }}>
                    {entry.status}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => handleView(entry)}
                    className="btn-pill-small"
                    style={{ background: '#3b82f6', color: 'white', border: 'none' }}
                  >
                    View
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No entries found for this material.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedEntry && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.65)',
          zIndex: 99999,
          backdropFilter: 'blur(8px)',
          display: 'block'
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            width: '95%',
            maxWidth: '640px',
            maxHeight: '85vh',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
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
        </div>
      )}
    </div>
  );
};

export default RawMaterialVerificationList;
