import React, { useState } from 'react';
import FinalInspectionScreen from './FinalInspectionScreen';
import './AttendingCallDashboard.css';

const AttendingCallDashboard = () => {
    const [activeTab, setActiveTab] = useState('pending');
    const [selectedCall, setSelectedCall] = useState(null);
    const [isInspecting, setIsInspecting] = useState(false);
    const [showDetailsPopup, setShowDetailsPopup] = useState(false);
    const [popupCall, setPopupCall] = useState(null);

    // Mock data based on requirements
    const [pendingCalls, setPendingCalls] = useState([
        { id: 'CALL-001', vendor: 'Vendor A', po: 'PO-2024-01', productType: 'Final', callDate: '23/04/2026', desiredDate: '20/02/2026', scheduledDate: '23/04/2026', status: 'Scheduled', checked: false },
        { id: 'CALL-002', vendor: 'Vendor B', po: 'PO-2024-02', productType: 'Wide Gauge', callDate: '23/04/2026', desiredDate: '20/02/2026', scheduledDate: '23/04/2026', status: 'Under Inspection', checked: true },
    ]);

    const [expandedActions, setExpandedActions] = useState({}); // Track which call has actions shown

    const [issuanceCalls, setIssuanceCalls] = useState([
        { id: 'CALL-003', vendor: 'Vendor C', po: 'PO-2024-03', productType: 'Final', qty: 450, accepted: 440, rejected: 10, callDate: '23/04/2026', status: 'ic_pending' },
    ]);

    const [completedCalls, setCompletedCalls] = useState([
        { id: 'CALL-004', vendor: 'Vendor D', po: 'PO-2024-04', productType: 'Final', qty: 600, accepted: 595, rejected: 5, callDate: '23/04/2026', status: 'ic_pending' },
    ]);

    const toggleCheck = (id) => {
        setPendingCalls(prev => prev.map(call => 
            call.id === id ? { ...call, checked: !call.checked } : call
        ));
    };

    const toggleActions = (id) => {
        setExpandedActions(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleInitiate = (call) => {
        setSelectedCall(call);
        setIsInspecting(true);
    };

    const handleViewDetails = (call) => {
        setPopupCall(call);
        setShowDetailsPopup(true);
    };

    if (isInspecting) {
        return <FinalInspectionScreen call={selectedCall} onBack={() => setIsInspecting(false)} />;
    }

    return (
        <div className="attending-call-container">
            <header className="dashboard-header">
                <h2>Attending the Call Raised</h2>
                <div className="dashboard-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        List of Calls Pending
                        <span className="badge">{pendingCalls.length}</span>
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'issuance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('issuance')}
                    >
                        Issuance of IC
                        <span className="badge">{issuanceCalls.length}</span>
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('completed')}
                    >
                        Completed Calls
                        <span className="badge">{completedCalls.length}</span>
                    </button>
                </div>
            </header>

            <div className="tab-content">
                {activeTab === 'pending' && (
                    <div className="table-container-modern">
                        <div className="table-search-header">
                            <input type="text" placeholder="Search..." className="search-input-modern" />
                        </div>
                        <div className="calls-table-wrapper-modern">
                            <table className="calls-table-modern">
                                <thead>
                                    <tr>
                                        <th className="checkbox-col"><input type="checkbox" /></th>
                                        <th>CALL NO.</th>
                                        <th>PO NO.</th>
                                        <th>VENDOR NAME</th>
                                        <th>PRODUCT TYPE</th>
                                        <th>CALL DATE</th>
                                        <th>DESIRED INSPECTION DATE</th>
                                        <th>SCHEDULED DATE</th>
                                        <th>STATUS</th>
                                        {pendingCalls.some(c => expandedActions[c.id]) && <th>ACTIONS</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingCalls.map(call => (
                                        <tr key={call.id} className={call.checked ? 'row-selected' : ''}>
                                            <td className="checkbox-col">
                                                <input 
                                                    type="checkbox" 
                                                    checked={call.checked} 
                                                    onChange={() => toggleCheck(call.id)} 
                                                />
                                            </td>
                                            <td>{call.id}</td>
                                            <td>{call.po}</td>
                                            <td>{call.vendor}</td>
                                            <td>{call.productType}</td>
                                            <td>{call.callDate}</td>
                                            <td>{call.desiredDate}</td>
                                            <td>{call.scheduledDate}</td>
                                            <td>
                                                <button 
                                                    className={`status-action-pill ${call.status.toLowerCase().replace(' ', '-')}`}
                                                    onClick={() => toggleActions(call.id)}
                                                >
                                                    {call.status}
                                                </button>
                                            </td>
                                            {expandedActions[call.id] && (
                                                <td>
                                                    <div className="table-actions-modern">
                                                        <button className="btn-reschedule">RESCHEDULE</button>
                                                        <button className="btn-start" onClick={() => handleInitiate(call)}>
                                                            {call.status === 'Under Inspection' ? 'RESUME' : 'START'}
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="table-footer-modern">
                            <div className="footer-info">
                                Showing 21 to 22 of 22 entries
                            </div>
                            <div className="footer-pagination">
                                <div className="page-size-selector">
                                    <select>
                                        <option>10 / page</option>
                                    </select>
                                </div>
                                <div className="pagination-controls">
                                    <button className="btn-page">Previous</button>
                                    <span className="page-info">Page 3 of 3</span>
                                    <button className="btn-page active">Next</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'issuance' && (
                    <div className="table-container-modern">
                        <div className="table-search-header">
                            <input type="text" placeholder="Search..." className="search-input-modern" />
                        </div>
                        <div className="calls-table-wrapper-modern">
                            <table className="calls-table-modern">
                                <thead>
                                    <tr>
                                        <th className="checkbox-col"><input type="checkbox" /></th>
                                        <th>CALL NO.</th>
                                        <th>VENDOR NAME</th>
                                        <th>PO NO.</th>
                                        <th>QTY OFFERED</th>
                                        <th>PASSED</th>
                                        <th>REJECTED</th>
                                        <th>DATE</th>
                                        <th>STATUS</th>
                                        {issuanceCalls.some(c => expandedActions[c.id]) && <th>ACTIONS</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {issuanceCalls.map(call => (
                                        <tr key={call.id}>
                                            <td className="checkbox-col"><input type="checkbox" /></td>
                                            <td>{call.id}</td>
                                            <td>{call.vendor}</td>
                                            <td>{call.po}</td>
                                            <td>{call.qty}</td>
                                            <td className="text-success">{call.accepted}</td>
                                            <td className="text-danger">{call.rejected}</td>
                                            <td>{call.callDate}</td>
                                            <td>
                                                <button 
                                                    className={`status-action-pill ${call.status}`}
                                                    onClick={() => toggleActions(call.id)}
                                                >
                                                    {call.status}
                                                </button>
                                            </td>
                                            {expandedActions[call.id] && (
                                                <td>
                                                    <div className="table-actions-modern">
                                                        <button className="btn-reschedule">Download IC</button>
                                                        <button className="btn-start">Download Annexures</button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="table-footer-modern">
                            <div className="footer-info">Showing 1 to {issuanceCalls.length} of {issuanceCalls.length} entries</div>
                            <div className="footer-pagination">
                                <div className="page-size-selector"><select><option>10 / page</option></select></div>
                                <div className="pagination-controls">
                                    <button className="btn-page">Previous</button>
                                    <span className="page-info">Page 1 of 1</span>
                                    <button className="btn-page active">Next</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'completed' && (
                    <div className="table-container-modern">
                        <div className="table-search-header">
                            <input type="text" placeholder="Search..." className="search-input-modern" />
                        </div>
                        <div className="calls-table-wrapper-modern">
                            <table className="calls-table-modern">
                                <thead>
                                    <tr>
                                        <th className="checkbox-col"><input type="checkbox" /></th>
                                        <th>CALL NO.</th>
                                        <th>VENDOR NAME</th>
                                        <th>PO NO.</th>
                                        <th>QTY OFFERED</th>
                                        <th>PASSED</th>
                                        <th>REJECTED</th>
                                        <th>DATE</th>
                                        <th>STATUS</th>
                                        {completedCalls.some(c => expandedActions[c.id]) && <th>ACTIONS</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {completedCalls.map(call => (
                                        <tr key={call.id}>
                                            <td className="checkbox-col"><input type="checkbox" /></td>
                                            <td>{call.id}</td>
                                            <td>{call.vendor}</td>
                                            <td>{call.po}</td>
                                            <td>{call.qty}</td>
                                            <td className="text-success">{call.accepted}</td>
                                            <td className="text-danger">{call.rejected}</td>
                                            <td>{call.callDate}</td>
                                            <td>
                                                <button 
                                                    className={`status-action-pill ${call.status}`}
                                                    onClick={() => toggleActions(call.id)}
                                                >
                                                    {call.status}
                                                </button>
                                            </td>
                                            {expandedActions[call.id] && (
                                                <td>
                                                    <div className="table-actions-modern">
                                                        <button className="btn-reschedule">Download IC</button>
                                                        <button className="btn-start">Download Annexures</button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="table-footer-modern">
                            <div className="footer-info">Showing 1 to {completedCalls.length} of {completedCalls.length} entries</div>
                            <div className="footer-pagination">
                                <div className="page-size-selector"><select><option>10 / page</option></select></div>
                                <div className="pagination-controls">
                                    <button className="btn-page">Previous</button>
                                    <span className="page-info">Page 1 of 1</span>
                                    <button className="btn-page active">Next</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showDetailsPopup && (
                <div className="modal-overlay" onClick={() => setShowDetailsPopup(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Inspection Details - {popupCall?.id}</h3>
                            <button className="modal-close-x" onClick={() => setShowDetailsPopup(false)}>×</button>
                        </div>
                        <div className="details-summary">
                            <div className="summary-item">
                                <label>PO Number</label>
                                <span>{popupCall?.po}</span>
                            </div>
                            <div className="summary-item">
                                <label>Sleeper Type</label>
                                <span>{popupCall?.sleeperType}</span>
                            </div>
                            <div className="summary-item">
                                <label>Total Offered</label>
                                <span>{popupCall?.qty}</span>
                            </div>
                            <div className="summary-item">
                                <label>Accepted</label>
                                <span className="text-success">{popupCall?.accepted}</span>
                            </div>
                            <div className="summary-item">
                                <label>Rejected</label>
                                <span className="text-danger">{popupCall?.rejected}</span>
                            </div>
                        </div>
                        <div className="modal-actions-horizontal">
                            {activeTab === 'issuance' ? (
                                <>
                                    <button className="issue-ic-btn">Issue IC</button>
                                    <button className="download-btn">Download Annexures</button>
                                </>
                            ) : (
                                <>
                                    <button className="download-btn">Download IC</button>
                                    <button className="download-btn">Download Annexures</button>
                                </>
                            )}
                        </div>
                        <button className="modal-footer-close" onClick={() => setShowDetailsPopup(false)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendingCallDashboard;
