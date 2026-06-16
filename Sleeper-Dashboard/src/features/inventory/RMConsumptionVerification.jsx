import React, { useState, useEffect } from 'react';
import './RMConsumptionVerification.css';

const MOCK_CONSUMPTION_DATA = {
    pending: [
        { id: 'C101', date: '2026-06-15', subType: 'OPC-53', usedFor: 'Sleeper Production', sleepersProduced: 120, estimatedQty: '48 MT', actualQty: '48.5 MT' },
        { id: 'C102', date: '2026-06-16', subType: 'OPC-53', usedFor: 'Sleeper Production', sleepersProduced: 100, estimatedQty: '40 MT', actualQty: '40.2 MT' },
    ],
    verified: [
        { id: 'C098', date: '2026-06-10', subType: 'OPC-53', usedFor: 'Sleeper Production', sleepersProduced: 250, estimatedQty: '100 MT', actualQty: '100.5 MT', status: 'Approved' },
        { id: 'C099', date: '2026-06-12', subType: 'OPC-53', usedFor: 'Sleeper Production', sleepersProduced: 300, estimatedQty: '120 MT', actualQty: '121 MT', status: 'Approved' }
    ]
};

const RMConsumptionVerification = ({ rmCategory }) => {
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(false);

    // Simulate API fetch
    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [rmCategory, activeTab]);

    const dataList = activeTab === 'pending' ? MOCK_CONSUMPTION_DATA.pending : MOCK_CONSUMPTION_DATA.verified;

    return (
        <div className="rm-consumption-verification fade-in">
            <header className="cv-header">
                <div>
                    <h2>IE {rmCategory.name} Consumption Verification</h2>
                    <p>Verify RM consumption and wastage entries submitted by the Vendor.</p>
                </div>
            </header>

            <div className="cv-tabs">
                <button 
                    className={`cv-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending Verification
                    {activeTab !== 'pending' && <span className="tab-badge">{MOCK_CONSUMPTION_DATA.pending.length}</span>}
                </button>
                <button 
                    className={`cv-tab-btn ${activeTab === 'verified' ? 'active' : ''}`}
                    onClick={() => setActiveTab('verified')}
                >
                    Verified
                </button>
            </div>

            {loading ? (
                <div className="loading-state">Loading data...</div>
            ) : (
                <div className="table-container">
                    <table className="cv-table">
                        <thead>
                            <tr>
                                <th>Date of Use</th>
                                <th>RM & Sub-Type</th>
                                <th>RM Used For</th>
                                <th>No. of Sleepers Produced</th>
                                <th>Estimated Qty Used</th>
                                <th>Actual Qty Used Declared</th>
                                {activeTab === 'pending' && <th>Actions</th>}
                                {activeTab === 'verified' && <th>Status</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {dataList.length === 0 ? (
                                <tr>
                                    <td colSpan={activeTab === 'pending' ? 7 : 7} style={{ textAlign: 'center', padding: '2rem' }}>
                                        No records found.
                                    </td>
                                </tr>
                            ) : (
                                dataList.map(row => (
                                    <tr key={row.id}>
                                        <td>{row.date}</td>
                                        <td>{rmCategory.name} - {row.subType}</td>
                                        <td>{row.usedFor}</td>
                                        <td>{row.sleepersProduced}</td>
                                        <td>{row.estimatedQty}</td>
                                        <td>
                                            <span className="qty-highlight">{row.actualQty}</span>
                                        </td>
                                        {activeTab === 'pending' && (
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="approve-btn" title="Approve">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                    </button>
                                                    <button className="reject-btn" title="Reject">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                        {activeTab === 'verified' && (
                                            <td>
                                                <span className="status-badge-table verified">{row.status}</span>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default RMConsumptionVerification;
