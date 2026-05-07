import React, { useState, useEffect } from 'react';
import ProductionVerificationScreen from './ProductionVerificationScreen';
import '../../styles/ProductionVerification.css';

const MOCK_PENDING_DECLARATIONS = [
  {
    id: 'decl-101',
    vendorName: 'DKG Industries - Unit I',
    date: '2026-05-03',
    shift: 'A',
    line: 'Line 01',
    status: 'Pending',
    submittedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    items: [
      {
        productType: '6.00mm GRSP',
        batches: [
          { batchNo: 'RP/26/05/03-01', initialWeight: 120.5, finalWeight: 118.2, qtyProduced: 5000 },
          { batchNo: 'RP/26/05/03-02', initialWeight: 121.0, finalWeight: 118.8, qtyProduced: 5000 }
        ]
      },
      {
        productType: '6.20mm CGRSP',
        batches: [
          { 
            batchNo: 'C-GRP-101', 
            compoundA: 'A-901', 
            compoundB: 'B-901', 
            initialWeight: 210.0, 
            finalWeight: 205.5, 
            qtyProduced: 4000 
          }
        ]
      }
    ]
  },
  {
    id: 'decl-102',
    vendorName: 'Ritesh Enterprises',
    date: '2026-05-03',
    shift: 'A',
    line: 'Line 02',
    status: 'Pending',
    submittedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    items: [
      {
        productType: '10.00mm NCRGRSP',
        batches: [
          { batchNo: 'NCR-RP-501', initialWeight: 150.0, finalWeight: 147.5, qtyProduced: 3000 }
        ]
      }
    ]
  }
];

const ProductionVerificationDashboard = ({ activeCard, setActiveCard }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingDeclarations, setPendingDeclarations] = useState(MOCK_PENDING_DECLARATIONS);
  const [verifiedDeclarations, setVerifiedDeclarations] = useState([]);
  const [selectedDeclaration, setSelectedDeclaration] = useState(null);

  // Logic for 8-hour window
  useEffect(() => {
    const interval = setInterval(() => {
      // Refresh to check for expired modification windows
      setVerifiedDeclarations(prev => [...prev]);
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const isModifiable = (verifiedAt) => {
    const hours = (Date.now() - new Date(verifiedAt).getTime()) / (1000 * 60 * 60);
    return hours < 8;
  };

  const handleVerify = (declaration, rejectionData) => {
    const verifiedEntry = {
      ...declaration,
      status: 'Verified',
      verifiedAt: new Date().toISOString(),
      rejections: rejectionData.rejections,
      summary: rejectionData.summary
    };

    setVerifiedDeclarations(prev => [verifiedEntry, ...prev]);
    setPendingDeclarations(prev => prev.filter(d => d.id !== declaration.id));
    setSelectedDeclaration(null);
  };

  const handleDeleteVerified = (declaration) => {
    if (!isModifiable(declaration.verifiedAt)) return;

    if (window.confirm('Are you sure you want to delete this verified entry? It will return to the pending list.')) {
      const pendingEntry = {
        ...declaration,
        status: 'Pending',
        verifiedAt: null,
        rejections: [],
        summary: null
      };

      setPendingDeclarations(prev => [pendingEntry, ...prev]);
      setVerifiedDeclarations(prev => prev.filter(d => d.id !== declaration.id));
    }
  };

  if (selectedDeclaration) {
    return (
      <ProductionVerificationScreen 
        declaration={selectedDeclaration}
        onBack={() => setSelectedDeclaration(null)}
        onVerify={(rejectionData) => handleVerify(selectedDeclaration, rejectionData)}
      />
    );
  }

  return (
    <div className="pv-dashboard">
      <div className="pv-header">
        <div className="pv-header-info">
          <h2>Production Verification & Acceptance</h2>
          <p>Review vendor declarations and log process rejections</p>
        </div>
        <div className="pv-tabs">
          <button 
            className={`pv-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Production Pending for Verification
            <span className="pv-badge">{pendingDeclarations.length}</span>
          </button>
          <button 
            className={`pv-tab-btn ${activeTab === 'verified' ? 'active' : ''}`}
            onClick={() => setActiveTab('verified')}
          >
            Verified Production
            <span className="pv-badge">{verifiedDeclarations.length}</span>
          </button>
        </div>
      </div>

      <div className="pv-content">
        {activeTab === 'pending' ? (
          <div className="pv-list">
            {pendingDeclarations.length === 0 ? (
              <div className="pv-empty-state">
                <div className="pv-empty-icon">📂</div>
                <h3>No pending declarations</h3>
                <p>All vendor submissions have been verified.</p>
              </div>
            ) : (
              <table className="pv-table">
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Date / Shift</th>
                    <th>Production Line</th>
                    <th>Items</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDeclarations.map(decl => (
                    <tr key={decl.id}>
                      <td>
                        <div className="pv-vendor-cell">
                          <span className="pv-vendor-name">{decl.vendorName}</span>
                          <span className="pv-decl-id">ID: {decl.id}</span>
                        </div>
                      </td>
                      <td>
                        <div className="pv-date-cell">
                          <span className="pv-date">{decl.date}</span>
                          <span className="pv-shift-badge">Shift {decl.shift}</span>
                        </div>
                      </td>
                      <td>{decl.line}</td>
                      <td>
                        <div className="pv-items-preview">
                          {decl.items.map((item, idx) => (
                            <span key={idx} className="pv-item-tag">{item.productType}</span>
                          ))}
                        </div>
                      </td>
                      <td>{new Date(decl.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>
                        <button 
                          className="pv-action-btn verify"
                          onClick={() => setSelectedDeclaration(decl)}
                        >
                          Verify Now
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="pv-list">
            {verifiedDeclarations.length === 0 ? (
              <div className="pv-empty-state">
                <div className="pv-empty-icon">✅</div>
                <h3>No verified production yet</h3>
                <p>Completed verifications will appear here.</p>
              </div>
            ) : (
              <table className="pv-table">
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Date / Shift</th>
                    <th>Verified At</th>
                    <th>Accepted Qty</th>
                    <th>Rejected Qty</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {verifiedDeclarations.map(decl => {
                    const modifiable = isModifiable(decl.verifiedAt);
                    return (
                      <tr key={decl.id}>
                        <td>
                          <div className="pv-vendor-cell">
                            <span className="pv-vendor-name">{decl.vendorName}</span>
                          </div>
                        </td>
                        <td>{decl.date} / {decl.shift}</td>
                        <td>{new Date(decl.verifiedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td className="pv-qty-accepted">{decl.summary.totalAccepted.toLocaleString()}</td>
                        <td className="pv-qty-rejected">{decl.summary.totalRejected.toLocaleString()}</td>
                        <td>
                          <span className="pv-status-locked">
                            {modifiable ? '🔓 Modifiable' : '🔒 Locked'}
                          </span>
                        </td>
                        <td>
                          <div className="pv-row-actions">
                            {modifiable ? (
                              <button 
                                className="pv-icon-btn delete"
                                onClick={() => handleDeleteVerified(decl)}
                                title="Delete & Return to Pending"
                              >
                                🗑️
                              </button>
                            ) : (
                              <span className="pv-lock-icon" title="Permanently Locked">📑</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionVerificationDashboard;
