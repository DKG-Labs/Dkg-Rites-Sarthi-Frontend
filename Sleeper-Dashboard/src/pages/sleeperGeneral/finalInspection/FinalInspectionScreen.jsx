import React, { useState, useEffect } from 'react';
import './FinalInspectionScreen.css';

const FinalInspectionScreen = ({ call, onBack }) => {
    const [step, setStep] = useState('po-verification'); // 'po-verification' or 'inspection-form'
    const [poVerified, setPoVerified] = useState(false);
    
    // Mock Batch and Sleeper Data
    const [batches, setBatches] = useState([
        { 
            batchNo: 'B-2024-001', 
            dateCasted: '2024-04-10', 
            qtyCasted: 100, 
            offeredPrev: 0, 
            offeredNow: 100, 
            passed: 100, 
            rejected: 0, 
            unoffered: 0,
            sleepers: Array.from({length: 100}, (_, i) => `S-001-${i+1}`),
            rejectedSleepers: [],
            etSleepers: [],
            mfTestedSleepers: [`S-001-10`, `S-001-50`]
        },
        { 
            batchNo: 'B-2024-002', 
            dateCasted: '2024-04-11', 
            qtyCasted: 150, 
            offeredPrev: 50, 
            offeredNow: 100, 
            passed: 100, 
            rejected: 0, 
            unoffered: 0,
            sleepers: Array.from({length: 100}, (_, i) => `S-002-${i+51}`),
            rejectedSleepers: [],
            etSleepers: [],
            mfTestedSleepers: []
        }
    ]);

    // Data Entry States
    const [rejectionEntry, setRejectionEntry] = useState({ batchNo: '', sleeperNo: '', reason: '', subReason: '' });
    const [etEntry, setEtEntry] = useState({ batchNo: '', sleeperNo: '' });
    const [expandedBatches, setExpandedBatches] = useState({});

    // Verification Form State
    const [poForm, setPoForm] = useState({
        poNo: 'WCR / DummyPo_001 / 001',
        poDate: '20-04-2024',
        poQty: '500 Nos',
        vendorName: 'Dummy Vendor',
        maNo: 'N/A',
        maDate: 'N/A',
        purchasingAuthority: 'Manager, Procurement',
        billPayingOfficer: 'BPO-001'
    });

    const [icForm, setIcForm] = useState({
        callNo: 'EF-02200002',
        callDate: '23/04/2026',
        desiredDate: '20/02/2026',
        rlyPoSr: 'WCR/DummyPo_001/001',
        itemDesc: 'Manufacture and Supply of Elastic Rail Clip MK-V with Flat Toe for 60 Kg UIC/ 52 Kg Rail Section (Alt. 2) RDSO Drg. No. T-5919 and As per corrigendum no.-1 of IRS specification No-T-31-2021 (Fifth Revision) with latest amendment. (The alteration/revision/amendment in Drawing and specification issued by RDSO as on date of publishing of tender shall be applicable to this tender). Make/Brand: kr',
        productType: 'Final',
        ercType: 'MK-V',
        poSrQty: '500 Nos.',
        consignee: 'SE/PWAY/STORE/BPL',
        origDp: '20/10/2025',
        extDp: '15/11/2025',
        origDpStart: '21/07/2025',
        stage: 'Final',
        callQty: '2000',
        place: 'Dummy Po Hyd Company (Dummy address HYD)',
        processIc: 'W/EP-02190007/TIE2',
        remarks: 'IE has scheduled the call'
    });

    const [sectionAStatus, setSectionAStatus] = useState(null); // 'approved' or 'rejected'
    const [sectionBStatus, setSectionBStatus] = useState(null); // 'approved' or 'rejected'
    
    const [sectionAExpanded, setSectionAExpanded] = useState(true);
    const [sectionBExpanded, setSectionBExpanded] = useState(false);
    
    const [isSectionBVisible, setIsSectionBVisible] = useState(false);

    const handleSectionAOk = () => {
        setSectionAStatus('approved');
        setIsSectionBVisible(true);
        setSectionBExpanded(true);
        setSectionAExpanded(false);
    };

    const handleSectionBOk = () => {
        setSectionBStatus('approved');
    };

    const handlePoVerify = () => {
        setPoVerified(true);
        setStep('inspection-form');
    };

    const toggleBatchExpand = (batchNo) => {
        setExpandedBatches(prev => ({ ...prev, [batchNo]: !prev[batchNo] }));
    };

    // Derived Section 1 Header Stats
    const totalOfferedNow = batches.reduce((sum, b) => sum + b.offeredNow, 0);
    const totalRejected = batches.reduce((sum, b) => sum + b.rejectedSleepers.length, 0);
    const totalAccepted = totalOfferedNow - totalRejected;
    const totalEt = batches.reduce((sum, b) => sum + b.etSleepers.length, 0);

    const handleAddRejection = () => {
        if (!rejectionEntry.batchNo || !rejectionEntry.sleeperNo || !rejectionEntry.reason) return;

        setBatches(prev => prev.map(batch => {
            if (batch.batchNo === rejectionEntry.batchNo) {
                if (batch.rejectedSleepers.includes(rejectionEntry.sleeperNo)) return batch;
                return {
                    ...batch,
                    rejectedSleepers: [...batch.rejectedSleepers, rejectionEntry.sleeperNo],
                    passed: batch.offeredNow - (batch.rejectedSleepers.length + 1)
                };
            }
            return batch;
        }));
        setRejectionEntry({ ...rejectionEntry, sleeperNo: '', reason: '', subReason: '' });
    };

    const handleAddEt = () => {
        if (!etEntry.batchNo || !etEntry.sleeperNo) return;

        setBatches(prev => prev.map(batch => {
            if (batch.batchNo === etEntry.batchNo) {
                if (batch.etSleepers.includes(etEntry.sleeperNo)) return batch;
                return {
                    ...batch,
                    etSleepers: [...batch.etSleepers, etEntry.sleeperNo]
                };
            }
            return batch;
        }));
        setEtEntry({ ...etEntry, sleeperNo: '' });
    };

    const removeRejection = (batchNo, sleeperNo) => {
        setBatches(prev => prev.map(batch => {
            if (batch.batchNo === batchNo) {
                return {
                    ...batch,
                    rejectedSleepers: batch.rejectedSleepers.filter(s => s !== sleeperNo),
                    passed: batch.offeredNow - (batch.rejectedSleepers.length - 1)
                };
            }
            return batch;
        }));
    };

    const removeEt = (batchNo, sleeperNo) => {
        setBatches(prev => prev.map(batch => {
            if (batch.batchNo === batchNo) {
                return {
                    ...batch,
                    etSleepers: batch.etSleepers.filter(s => s !== sleeperNo)
                };
            }
            return batch;
        }));
    };

    if (step === 'po-verification') {
        return (
            <div className="inspection-screen verification-mode">
                <div className="verification-card-modern scrollable">
                    <div className="verification-card-header sticky">
                        <div className="header-titles-left">
                            <h2>Inspection Initiation for {icForm.callNo}</h2>
                            <p className="subtitle">11/14/2025, 5:00:00 PM</p>
                        </div>
                    </div>

                    <div className="verification-content-wrapper">
                        {/* SECTION A */}
                        <div className="verification-collapsible-card">
                            <div className="card-header-toggle" onClick={() => setSectionAExpanded(!sectionAExpanded)}>
                                <h3>SECTION A: Main PO Information - {poForm.poNo}</h3>
                                <button className="toggle-btn">{sectionAExpanded ? '-' : '+'}</button>
                            </div>
                            
                            {sectionAExpanded && (
                                <div className="verification-form-body-modern">
                                    <div className="form-grid-modern-2col">
                                        <div className="form-group-modern">
                                            <label>RLY + PO_NO</label>
                                            <div className="input-field-mock">{poForm.poNo}</div>
                                        </div>
                                        <div className="form-group-modern">
                                            <label>PO DATE</label>
                                            <div className="input-field-mock">{poForm.poDate}</div>
                                            <span className="date-check-label">✓ PO Date ≤ Today</span>
                                        </div>
                                        <div className="form-group-modern">
                                            <label>PO_QTY</label>
                                            <div className="input-field-mock">{poForm.poQty}</div>
                                        </div>
                                        <div className="form-group-modern">
                                            <label>VENDOR_NAME</label>
                                            <div className="input-field-mock">{poForm.vendorName}</div>
                                        </div>
                                        <div className="form-group-modern">
                                            <label>MA_NO</label>
                                            <div className="input-field-mock">{poForm.maNo}</div>
                                        </div>
                                        <div className="form-group-modern">
                                            <label>MA_DATE</label>
                                            <div className="input-field-mock">{poForm.maDate}</div>
                                        </div>
                                        <div className="form-group-modern">
                                            <label>PURCHASING AUTHORITY</label>
                                            <div className="input-field-mock">{poForm.purchasingAuthority}</div>
                                        </div>
                                        <div className="form-group-modern">
                                            <label>BILL PAYING OFFICER</label>
                                            <div className="input-field-mock">{poForm.billPayingOfficer}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="section-status-actions">
                                        <button 
                                            className={`btn-status-not-ok ${sectionAStatus === 'rejected' ? 'active' : ''}`}
                                            onClick={() => setSectionAStatus('rejected')}
                                        >
                                            Not OK
                                        </button>
                                        <button 
                                            className={`btn-status-ok ${sectionAStatus === 'approved' ? 'active' : ''}`}
                                            onClick={handleSectionAOk}
                                        >
                                            OK
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SECTION B */}
                        {isSectionBVisible && (
                            <div className="verification-collapsible-card">
                                <div className="card-header-toggle" onClick={() => setSectionBExpanded(!sectionBExpanded)}>
                                    <h3>SECTION B: Inspection Call Details - {poForm.poNo}</h3>
                                    <button className="toggle-btn">{sectionBExpanded ? '-' : '+'}</button>
                                </div>

                                {sectionBExpanded && (
                                    <div className="verification-form-body-modern">
                                        <div className="form-grid-modern-2col">
                                            <div className="form-group-modern">
                                                <label>INSPECTION CALL NO.</label>
                                                <div className="input-field-mock">{icForm.callNo}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>INSPECTION CALL DATE</label>
                                                <div className="input-field-mock">{icForm.callDate}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>INSPECTION DESIRED DATE</label>
                                                <div className="input-field-mock">{icForm.desiredDate}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>RLY + PO_NO + PO_SR</label>
                                                <div className="input-field-mock">{icForm.rlyPoSr}</div>
                                            </div>
                                            <div className="form-group-modern full-width">
                                                <label>ITEM DESC</label>
                                                <div className="input-field-mock text-wrap">{icForm.itemDesc}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>PRODUCT TYPE</label>
                                                <div className="input-field-mock">{icForm.productType}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>TYPE OF ERC</label>
                                                <div className="input-field-mock">{icForm.ercType}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>PO_SR_QTY + UNIT</label>
                                                <div className="input-field-mock">{icForm.poSrQty}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>CONSIGNEE_RLY + CONSIGNEE</label>
                                                <div className="input-field-mock">{icForm.consignee}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>ORIG_DP</label>
                                                <div className="input-field-mock">{icForm.origDp}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>EXT_DP</label>
                                                <div className="input-field-mock">{icForm.extDp}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>ORIG_DP_START</label>
                                                <div className="input-field-mock">{icForm.origDpStart}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>STAGE OF INSPECTION</label>
                                                <div className="input-field-mock">{icForm.stage}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>CALL QTY (MT)</label>
                                                <div className="input-field-mock">{icForm.callQty}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>PLACE OF INSPECTION</label>
                                                <div className="input-field-mock">{icForm.place}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>PROCESS IC NUMBERS</label>
                                                <div className="input-field-mock">{icForm.processIc}</div>
                                            </div>
                                            <div className="form-group-modern full-width">
                                                <label>REMARKS</label>
                                                <div className="input-field-mock">{icForm.remarks}</div>
                                            </div>
                                        </div>

                                        <div className="section-status-actions">
                                            <button 
                                                className={`btn-status-not-ok ${sectionBStatus === 'rejected' ? 'active' : ''}`}
                                                onClick={() => setSectionBStatus('rejected')}
                                            >
                                                Not OK
                                            </button>
                                            <button 
                                                className={`btn-status-ok ${sectionBStatus === 'approved' ? 'active' : ''}`}
                                                onClick={handleSectionBOk}
                                            >
                                                OK
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className="verification-footer sticky">
                        <div className="footer-actions-left">
                            <button className="back-landing-btn" onClick={onBack}>Back to Landing Page</button>
                        </div>
                        <div className="footer-actions-right">
                            <button 
                                className="open-verify-btn" 
                                disabled={sectionBStatus !== 'approved'}
                                onClick={handlePoVerify}
                            >
                                Open & Verify Form
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="inspection-screen">
            <header className="inspection-header">
                <div className="header-left">
                    <button className="back-icon-btn" onClick={onBack}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <div>
                        <h1>Final Inspection Form</h1>
                        <span className="call-ref">Call Ref: {call.id}</span>
                    </div>
                </div>
                <div className="header-status">
                    <span className="status-indicator live">INSPECTION IN PROGRESS</span>
                    <span className="timer">00:45:12</span>
                </div>
            </header>

            <main className="inspection-layout">
                {/* Section 1: Header Summary */}
                <section className="section summary-header">
                    <div className="section-title">Section 1: Header Details</div>
                    <div className="summary-grid">
                        <div className="summary-col">
                            <div className="data-item"><label>RLY + PO_NO:</label> <span>{poForm.poNo}</span></div>
                            <div className="data-item"><label>PO DATE:</label> <span>{poForm.poDate}</span></div>
                            <div className="data-item"><label>VENDOR_NAME:</label> <span>{poForm.vendorName}</span></div>
                        </div>
                        <div className="summary-col">
                            <div className="data-item"><label>PO_QTY:</label> <span>{poForm.poQty}</span></div>
                            <div className="data-item"><label>MA_NO:</label> <span>{poForm.maNo}</span></div>
                            <div className="data-item"><label>MA_DATE:</label> <span>{poForm.maDate}</span></div>
                        </div>
                        <div className="summary-col">
                            <div className="data-item highlight"><label>Qty Offered Now:</label> <span>{totalOfferedNow}</span></div>
                            <div className="data-item success"><label>Accepted:</label> <span>{totalAccepted}</span></div>
                            <div className="data-item danger"><label>Rejected:</label> <span>{totalRejected}</span></div>
                        </div>
                        <div className="summary-col">
                            <div className="data-item warning"><label>ET Sleepers:</label> <span>{totalEt}</span></div>
                            <div className="data-item"><label>Call Date:</label> <span>{call.date}</span></div>
                            <div className="data-item"><label>No. of Batches:</label> <span>{batches.length}</span></div>
                        </div>
                    </div>
                </section>

                <div className="main-working-area">
                    {/* Section 2: Batch Details */}
                    <section className="section batch-details">
                        <div className="section-title">Section 2: Batch-Wise Summary</div>
                        <div className="batch-table-container">
                            <table className="batch-table">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Batch No.</th>
                                        <th>Date Casted</th>
                                        <th>Casted</th>
                                        <th>Offered Prev</th>
                                        <th>Offered Now</th>
                                        <th>Passed</th>
                                        <th>Rejected</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {batches.map(batch => (
                                        <React.Fragment key={batch.batchNo}>
                                            <tr className="batch-row" onClick={() => toggleBatchExpand(batch.batchNo)}>
                                                <td>{expandedBatches[batch.batchNo] ? '▼' : '▶'}</td>
                                                <td>{batch.batchNo}</td>
                                                <td>{batch.dateCasted}</td>
                                                <td>{batch.qtyCasted}</td>
                                                <td>{batch.offeredPrev}</td>
                                                <td>{batch.offeredNow}</td>
                                                <td className="text-success">{batch.passed}</td>
                                                <td className="text-danger">{batch.rejectedSleepers.length}</td>
                                            </tr>
                                            {expandedBatches[batch.batchNo] && (
                                                <tr className="expand-content">
                                                    <td colSpan="8">
                                                        <div className="expanded-details">
                                                            <div className="detail-list">
                                                                <h6>Rejected Sleepers ({batch.rejectedSleepers.length})</h6>
                                                                <div className="tag-container">
                                                                    {batch.rejectedSleepers.map(s => (
                                                                        <span key={s} className="tag rejected">{s} <i onClick={() => removeRejection(batch.batchNo, s)}>×</i></span>
                                                                    ))}
                                                                    {batch.rejectedSleepers.length === 0 && <span className="empty">None</span>}
                                                                </div>
                                                            </div>
                                                            <div className="detail-list">
                                                                <h6>Epoxy Treated (ET) ({batch.etSleepers.length})</h6>
                                                                <div className="tag-container">
                                                                    {batch.etSleepers.map(s => (
                                                                        <span key={s} className="tag et">{s} <i onClick={() => removeEt(batch.batchNo, s)}>×</i></span>
                                                                    ))}
                                                                    {batch.etSleepers.length === 0 && <span className="empty">None</span>}
                                                                </div>
                                                            </div>
                                                            <div className="detail-list">
                                                                <h6>MF Tested ({batch.mfTestedSleepers.length})</h6>
                                                                <div className="tag-container">
                                                                    {batch.mfTestedSleepers.map(s => (
                                                                        <span key={s} className="tag mf">{s}</span>
                                                                    ))}
                                                                    {batch.mfTestedSleepers.length === 0 && <span className="empty">None</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Section 3: Final Verdict Data Entry */}
                    <section className="section verdict-entry">
                        <div className="section-title">Section 3: Final Verdict (Data Entry)</div>
                        
                        <div className="entry-grid">
                            {/* Action A: Add Rejection */}
                            <div className="entry-card rejection">
                                <h5>Add Rejection</h5>
                                <div className="entry-form">
                                    <div className="field">
                                        <label>Batch Number</label>
                                        <select 
                                            value={rejectionEntry.batchNo} 
                                            onChange={(e) => setRejectionEntry({...rejectionEntry, batchNo: e.target.value, sleeperNo: ''})}
                                        >
                                            <option value="">Select Batch</option>
                                            {batches.map(b => <option key={b.batchNo} value={b.batchNo}>{b.batchNo}</option>)}
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Sleeper Number</label>
                                        <select 
                                            value={rejectionEntry.sleeperNo} 
                                            onChange={(e) => setRejectionEntry({...rejectionEntry, sleeperNo: e.target.value})}
                                            disabled={!rejectionEntry.batchNo}
                                        >
                                            <option value="">Select Sleeper</option>
                                            {rejectionEntry.batchNo && batches.find(b => b.batchNo === rejectionEntry.batchNo).sleepers.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Reason for Rejection</label>
                                        <select 
                                            value={rejectionEntry.reason} 
                                            onChange={(e) => setRejectionEntry({...rejectionEntry, reason: e.target.value})}
                                        >
                                            <option value="">Select Reason</option>
                                            <option value="Surface Crack">Surface Crack</option>
                                            <option value="Dimensional Variation">Dimensional Variation</option>
                                            <option value="Honeycombing">Honeycombing</option>
                                            <option value="Broken Edge">Broken Edge</option>
                                        </select>
                                    </div>
                                    <button className="add-btn reject" onClick={handleAddRejection}>Log Rejection</button>
                                </div>
                            </div>

                            {/* Action B: Add ET */}
                            <div className="entry-card et">
                                <h5>Add Epoxy Treatment (ET)</h5>
                                <div className="entry-form">
                                    <div className="field">
                                        <label>Batch Number</label>
                                        <select 
                                            value={etEntry.batchNo} 
                                            onChange={(e) => setEtEntry({...etEntry, batchNo: e.target.value, sleeperNo: ''})}
                                        >
                                            <option value="">Select Batch</option>
                                            {batches.map(b => <option key={b.batchNo} value={b.batchNo}>{b.batchNo}</option>)}
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Sleeper Number</label>
                                        <select 
                                            value={etEntry.sleeperNo} 
                                            onChange={(e) => setEtEntry({...etEntry, sleeperNo: e.target.value})}
                                            disabled={!etEntry.batchNo}
                                        >
                                            <option value="">Select Sleeper</option>
                                            {etEntry.batchNo && batches.find(b => b.batchNo === etEntry.batchNo).sleepers.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button className="add-btn et" onClick={handleAddEt}>Log ET Status</button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Section 4: Summary & Actions */}
                <section className="section actions-bar">
                    <div className="visual-summary">
                        <div className="summary-circle">
                            <svg viewBox="0 0 36 36" className="circular-chart">
                                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path className="circle" strokeDasharray={`${(totalAccepted/totalOfferedNow)*100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <div className="percentage">{Math.round((totalAccepted/totalOfferedNow)*100)}%</div>
                        </div>
                        <div className="summary-text">
                            <div><strong>Offered:</strong> {totalOfferedNow}</div>
                            <div className="text-success"><strong>Accepted:</strong> {totalAccepted}</div>
                            <div className="text-danger"><strong>Rejected:</strong> {totalRejected}</div>
                        </div>
                    </div>
                    
                    <div className="action-buttons">
                        <button className="btn secondary">Save Draft</button>
                        <button className="btn secondary">Pause Inspection</button>
                        <button className="btn warning">Withheld Inspection</button>
                        <button className="btn primary">Complete Inspection</button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default FinalInspectionScreen;
