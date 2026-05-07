import React, { useState, useEffect } from 'react';
import './FinalInspectionScreen.css';
import { apiService } from '../../../services/api';
import { getStoredUser } from '../../../services/authService';

const FinalInspectionScreen = ({ call, onBack }) => {
    const isVerificationMode = call?.jobStatus !== 'PO_VERIFICATION' && call?.jobStatus !== 'INSPECTION';
    const [step, setStep] = useState(isVerificationMode ? 'po-verification' : 'inspection-form');
    const [poVerified, setPoVerified] = useState(false);

    useEffect(() => {
        // Handle Resuming from Pause or previously initiated steps
        if (call?.jobStatus === 'PAUSED' || call?.jobStatus === 'pause' || call?.jobStatus === 'PO_VERIFICATION') {
            setStep('inspection-form');
            setPoVerified(true);
            setSectionAStatus('approved');
            setSectionBStatus('approved');
        }
    }, [call]);
    
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

    const [expandedBatches, setExpandedBatches] = useState({});
    const [activeAction, setActiveAction] = useState(null); // 'rejection' or 'et'
    
    const [rejectionEntry, setRejectionEntry] = useState({ batchNo: '', sleeperNo: '', reason: '' });
    const [etEntry, setEtEntry] = useState({ batchNo: '', sleeperNo: '', reason: '' });

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
        productType: 'Sleeper',
        ercType: 'PSC Sleeper',
        poSrQty: '500 Nos.',
        consignee: 'SE/PWAY/STORE/BPL',
        origDp: '20/10/2025',
        extDp: '15/11/2025',
        origDpStart: '21/07/2025',
        stage: 'Final',
        callQty: '2000',
        qtyUnit: 'Nos',
        place: 'Dummy Po Hyd Company (Dummy address HYD)',
        processIc: 'W/EP-02190007/TIE2',
        remarks: 'IE has scheduled the call'
    });

    const [sectionAStatus, setSectionAStatus] = useState(null); // 'approved' or 'rejected'
    const [sectionBStatus, setSectionBStatus] = useState(null); // 'approved' or 'rejected'
    
    const [sectionAExpanded, setSectionAExpanded] = useState(true);
    const [sectionBExpanded, setSectionBExpanded] = useState(false);
    
    const [isSectionBVisible, setIsSectionBVisible] = useState(false);
    const [summaryData, setSummaryData] = useState(null);
    const [batchDetails, setBatchDetails] = useState([]);

    const formatDateISO = (dateStr) => {
        if (!dateStr || dateStr === 'N/A') return null;
        const datePart = dateStr.split('T')[0];
        const parts = datePart.split(/[-/]/);
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        return datePart;
    };

    const formatDateDMY = (dateStr) => {
        if (!dateStr || dateStr === 'N/A') return null;
        const datePart = dateStr.split('T')[0];
        const parts = datePart.split(/[-/]/);
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
            }
            return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
        }
        return datePart;
    };

    const handleSectionAOk = async () => {
        try {
            const user = getStoredUser();
            const payload = {
                callNo: call.requestId || icForm.callNo,
                rlyPoNo: poForm.poNo,
                poDate: formatDateISO(poForm.poDate) + "T00:00:00",
                poQty: parseInt(poForm.poQty) || 0,
                vendorName: poForm.vendorName,
                maNo: poForm.maNo === 'N/A' ? '' : poForm.maNo,
                maDate: formatDateISO(poForm.maDate),
                purchasingAuthority: poForm.purchasingAuthority,
                billPayingOfficer: poForm.billPayingOfficer,
                plantId: call.plantId || "",
                vendorCode: call.vendorCode || "",
                shift: "A",
                createdBy: Number(user?.userId || 0)
            };

            await apiService.saveSection1(payload);
            setSectionAStatus('approved');
            setIsSectionBVisible(true);
            setSectionBExpanded(true);
            setSectionAExpanded(false);
        } catch (error) {
            console.error("Error saving Section 1:", error);
            alert("Failed to save Section 1: " + error.message);
        }
    };

    const handleSectionBOk = async () => {
        try {
            const user = getStoredUser();
            const payload = {
                callNo: call.requestId || icForm.callNo,
                inspectionCallDate: formatDateISO(icForm.callDate) + "T00:00:00",
                inspectionDesiredDate: formatDateISO(icForm.desiredDate),
                rlyPoSr: icForm.rlyPoSr,
                itemDesc: icForm.itemDesc,
                productType: icForm.productType,
                typeOfErc: icForm.ercType,
                poSrQtyUnit: icForm.poSrQty,
                consignee: icForm.consignee,
                origDp: formatDateISO(icForm.origDp) + "T00:00:00",
                extDp: formatDateISO(icForm.extDp) + "T00:00:00",
                origDpStart: formatDateISO(icForm.origDpStart),
                stageOfInspection: icForm.stage,
                callQtyMt: parseInt(icForm.callQty) || 0,
                placeOfInspection: icForm.place,
                processIcNumbers: icForm.processIc,
                remarks: icForm.remarks,
                plantId: call.plantId || "",
                vendorCode: call.vendorCode || "",
                shift: "A",
                createdBy: Number(user?.userId || 0)
            };

            await apiService.saveSection2(payload);
            setSectionBStatus('approved');
        } catch (error) {
            console.error("Error saving Section 2:", error);
            alert("Failed to save Section 2: " + error.message);
        }
    };

    const handlePoVerify = async () => {
        try {
            const user = getStoredUser();
            // Call the workflow API to transition to the next state
            const payload = {
                workflowTransitionId: call.workflowTransitionId,
                moduleId: call.moduleId || 0,
                requestId: call.requestId,
                action: 'PO_VERIFICATION',
                remarks: "PO details verified",
                actionBy: Number(user?.userId || 0)
            };
            
            await apiService.performTransitionAction(payload);
            
            setPoVerified(true);
            setStep('inspection-form');
        } catch (error) {
            console.error("Error during PO Verification transition:", error);
            // Even if it fails, we proceed to allow the user to work
            setPoVerified(true);
            setStep('inspection-form');
        }
    };

    useEffect(() => {
        const fetchInspectionData = async () => {
            if (step === 'inspection-form' && call?.requestId) {
                const callNo = call.requestId;
                console.log(`Fetching inspection data for ${callNo}...`);
                
                let hasSavedData = false;

                // 1. Try fetching SAVED Inspection Data first
                try {
                    const savedHeader = await apiService.getSavedMainIeHeader(callNo);
                    if (savedHeader && savedHeader.responseData) {
                        setSummaryData({
                            ...savedHeader.responseData,
                            poNo: savedHeader.responseData.rlyPoNo,
                            poDate: savedHeader.responseData.poDate,
                            vendorName: savedHeader.responseData.vendorName,
                            quantityOnOrder: savedHeader.responseData.poQty,
                            maNo: savedHeader.responseData.maNo,
                            maDate: savedHeader.responseData.maDate,
                            totalAccepted: savedHeader.responseData.acceptedQty,
                            totalRejected: savedHeader.responseData.rejectedQty,
                            noOfEtSleepers: savedHeader.responseData.etSleepers,
                            callDate: savedHeader.responseData.callDate
                        });
                        hasSavedData = true;
                    }
                } catch (err) {
                    console.log("No saved header found, falling back to initial summary.");
                }

                try {
                    const savedBatches = await apiService.getSavedMainIeBatches(callNo);
                    if (savedBatches && savedBatches.responseData && Array.isArray(savedBatches.responseData) && savedBatches.responseData.length > 0) {
                        const mappedSaved = savedBatches.responseData.map(b => ({
                            batchNo: b.batchNo,
                            dateCasted: b.dateCasted,
                            qtyCasted: b.casted || 0,
                            offeredPrev: b.offeredPrev || 0,
                            offeredNow: b.offeredNow || 0,
                            passed: b.passed || 0,
                            rejected: b.rejected || 0,
                            unoffered: b.unoffered || 0,
                            // Reconstruct sleeper lists from the DTO arrays
                            acceptedSleepers: (b.goodSleepers || []).map(s => s.sleeperCode),
                            rejectedSleepers: (b.rejectedSleepers || []).map(s => s.sleeperCode),
                            etSleepers: (b.etSleepers || []).map(s => s.sleeperCode),
                            mfTestedSleepers: (b.mfSleepers || []).map(s => s.sleeperCode),
                            sleepers: [
                                ...(b.goodSleepers || []).map(s => s.sleeperCode), 
                                ...(b.rejectedSleepers || []).map(s => s.sleeperCode)
                            ]
                        }));
                        setBatches(mappedSaved);
                        hasSavedData = true;
                    }
                } catch (err) {
                    console.log("No saved batches found, falling back to initial batch details.");
                }

                // 2. If no saved data found, fallback to INITIAL Production Data
                if (!hasSavedData) {
                    // Fetch Initial Inspection Call Summary
                    try {
                        const summaryResp = await apiService.getInspectionCallSummary(callNo);
                        if (summaryResp && summaryResp.responseData) {
                            setSummaryData(summaryResp.responseData);
                        }
                    } catch (err) {
                        console.error("Error fetching initial inspection summary:", err);
                    }

                    // Fetch Initial Batch-wise details
                    try {
                        const batchResp = await apiService.getBatchWiseDetails(callNo);
                        if (batchResp && batchResp.responseData && Array.isArray(batchResp.responseData)) {
                            const mappedBatches = batchResp.responseData.map(b => ({
                                batchNo: b.batchNo,
                                dateCasted: b.castingDate,
                                qtyCasted: b.totalSleepersCasted || 0,
                                offeredPrev: 0,
                                offeredNow: b.offeredNow || 0,
                                passed: b.passed || 0,
                                rejected: b.rejected || 0,
                                unoffered: b.unoffered || 0,
                                sleepers: [...(b.acceptedSleepers || []), ...(b.rejectedSleepers || [])],
                                acceptedSleepers: b.acceptedSleepers || [],
                                rejectedSleepers: b.rejectedSleepers || [],
                                etSleepers: b.etSleepers || [],
                                mfTestedSleepers: []
                            }));
                            setBatches(mappedBatches);
                        }
                    } catch (err) {
                        console.error("Error fetching initial batch details:", err);
                    }
                }
            }
        };

        fetchInspectionData();
    }, [step, call?.requestId]);

    const handleWorkflowAction = async (actionName) => {
        try {
            const user = getStoredUser();
            const plantId = localStorage.getItem('plantId');
            
            // 1. Save Header Details
            const headerPayload = {
                rlyPoNo: summaryData?.poNo || poForm.poNo,
                poDate: formatDateDMY(summaryData?.poDate || poForm.poDate),
                vendorName: summaryData?.vendorName || poForm.vendorName,
                callNo: call.requestId,
                poQty: Number(String(summaryData?.quantityOnOrder || poForm.poQty).replace(/\D/g, '')),
                maNo: poForm.maNo === 'N/A' ? '' : poForm.maNo,
                maDate: formatDateDMY(poForm.maDate),
                qtyOfferedNow: totalOfferedNow,
                acceptedQty: totalAccepted,
                rejectedQty: totalRejected,
                etSleepers: totalEt,
                callDate: formatDateDMY(summaryData?.callDate || icForm.callDate),
                noOfBatches: batches.length,
                shift: icForm.shift || 'Day',
                plantId: plantId,
                vendorCode: call.vendorCode || icForm.vendorCode,
                createdBy: String(user?.userId || ''),
                updatedBy: String(user?.userId || '')
            };
            
            await apiService.saveMainIeInspectionHeader(headerPayload);

            // 2. Save Batch-wise details (Loop through each batch)
            for (const batch of batches) {
                const batchPayload = {
                    batchNo: batch.batchNo,
                    callNo: call.requestId,
                    dateCasted: formatDateDMY(batch.dateCasted),
                    casted: batch.qtyCasted,
                    offeredPrev: batch.offeredPrev,
                    offeredNow: batch.offeredNow,
                    passed: batch.passed,
                    rejected: batch.rejected,
                    totalOffered: totalOfferedNow,
                    totalAccepted: totalAccepted,
                    totalRejected: totalRejected,
                    shift: icForm.shift || 'Day',
                    plantId: plantId,
                    vendorCode: call.vendorCode || icForm.vendorCode,
                    createdBy: String(user?.userId || ''),
                    updatedBy: String(user?.userId || ''),
                    goodSleepers: (batch.acceptedSleepers || []).map(s => ({ sleeperCode: s })),
                    rejectedSleepers: (batch.rejectedSleepers || []).map(s => ({ 
                        sleeperCode: s, 
                        reason: 'Rejected', 
                        type: 'Main IE Rejection' 
                    })),
                    etSleepers: (batch.etSleepers || []).map(s => ({ sleeperCode: s })),
                    mfSleepers: (batch.mfTestedSleepers || []).map(s => ({ sleeperCode: s })),
                    finalRejections: (batch.rejectedSleepers || []).map(s => ({ 
                        sleeperCode: s, 
                        reason: 'Final Rejection', 
                        type: 'Final' 
                    }))
                };
                await apiService.saveMainIeInspectionBatch(batchPayload);
            }
            
            // 3. Workflow Transition
            const transitionPayload = {
                workflowTransitionId: call.workflowTransitionId,
                moduleId: call.moduleId || 0,
                requestId: call.requestId,
                action: actionName, 
                remarks: actionName === 'PAUSE' ? "Inspection paused" : "Inspection performed from inspection screen",
                actionBy: Number(user?.userId || 0)
            };
            await apiService.performTransitionAction(transitionPayload);
            
            // 4. Save local draft on PAUSE for extra safety
            const draftData = {
                batches,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem(`inspection_draft_${call.requestId}`, JSON.stringify(draftData));

            // 5. Clear local draft on completion
            if (actionName === 'FINISH') {
                localStorage.removeItem(`inspection_draft_${call.requestId}`);
            }
            
            onBack(); // Go back to dashboard after saving
        } catch (error) {
            console.error(`Error saving inspection data for ${actionName}:`, error);
            alert(`Failed to save inspection data: ` + (error.response?.data?.message || error.message));
        }
    };

    useEffect(() => {
        // Load draft if it exists for this call
        if (call?.requestId) {
            const savedDraft = localStorage.getItem(`inspection_draft_${call.requestId}`);
            if (savedDraft) {
                try {
                    const draft = JSON.parse(savedDraft);
                    if (draft && draft.batches) {
                        setBatches(draft.batches);
                        console.log("Loaded draft from local storage");
                    }
                } catch (e) {
                    console.error("Error parsing saved draft:", e);
                }
            }
        }
    }, [call?.requestId]);

    const toggleBatchExpand = (batchNo) => {
        setExpandedBatches(prev => ({ ...prev, [batchNo]: !prev[batchNo] }));
    };

    // Derived Section 1 Header Stats
    const totalOfferedNow = batches.reduce((sum, b) => sum + (b.offeredNow || 0), 0);
    const totalRejected = batches.reduce((sum, b) => sum + b.rejectedSleepers.length, 0);
    const totalEt = batches.reduce((sum, b) => sum + b.etSleepers.length, 0);
    const totalAccepted = totalOfferedNow - totalRejected; // ET sleepers are already included in (Offered - Rejected)

    const handleAddRejection = () => {
        if (!rejectionEntry.batchNo || !rejectionEntry.sleeperNo || !rejectionEntry.reason) return;

        setBatches(prev => prev.map(batch => {
            if (batch.batchNo === rejectionEntry.batchNo) {
                if (batch.rejectedSleepers.includes(rejectionEntry.sleeperNo)) return batch;
                const newAccepted = batch.acceptedSleepers.filter(s => s !== rejectionEntry.sleeperNo);
                const newRejected = [...batch.rejectedSleepers, rejectionEntry.sleeperNo];
                return {
                    ...batch,
                    acceptedSleepers: newAccepted,
                    rejectedSleepers: newRejected,
                    passed: newAccepted.length,
                    rejected: newRejected.length
                };
            }
            return batch;
        }));
        setExpandedBatches(prev => ({ ...prev, [rejectionEntry.batchNo]: true }));
        setRejectionEntry({ batchNo: '', sleeperNo: '', reason: '' });
    };

    const handleAddEt = () => {
        if (!etEntry.batchNo || !etEntry.sleeperNo || !etEntry.reason) return;

        setBatches(prev => prev.map(batch => {
            if (batch.batchNo === etEntry.batchNo) {
                if (batch.etSleepers.includes(etEntry.sleeperNo)) return batch;
                
                const newAccepted = batch.acceptedSleepers.filter(s => s !== etEntry.sleeperNo);
                return {
                    ...batch,
                    acceptedSleepers: newAccepted,
                    etSleepers: [...batch.etSleepers, etEntry.sleeperNo]
                };
            }
            return batch;
        }));
        setExpandedBatches(prev => ({ ...prev, [etEntry.batchNo]: true }));
        setEtEntry({ batchNo: '', sleeperNo: '', reason: '' });
    };

    const removeRejection = (batchNo, sleeperNo) => {
        setBatches(prev => prev.map(batch => {
            if (batch.batchNo === batchNo) {
                const newRejected = batch.rejectedSleepers.filter(s => s !== sleeperNo);
                const newAccepted = [...batch.acceptedSleepers, sleeperNo];
                return {
                    ...batch,
                    acceptedSleepers: newAccepted,
                    rejectedSleepers: newRejected,
                    passed: newAccepted.length,
                    rejected: newRejected.length
                };
            }
            return batch;
        }));
    };

    const removeEt = (batchNo, sleeperNo) => {
        setBatches(prev => prev.map(batch => {
            if (batch.batchNo === batchNo) {
                const newEt = batch.etSleepers.filter(s => s !== sleeperNo);
                const newAccepted = [...batch.acceptedSleepers, sleeperNo];
                return {
                    ...batch,
                    acceptedSleepers: newAccepted,
                    etSleepers: newEt
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
                                                <label>Type of Sleeper</label>
                                                <select 
                                                    className="input-field-mock"
                                                    value={icForm.ercType}
                                                    onChange={(e) => setIcForm({...icForm, ercType: e.target.value})}
                                                    style={{ width: '100%', height: '45px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                                >
                                                    <option value="PSC Sleeper">PSC Sleeper</option>
                                                    <option value="Normal Sleeper">Normal Sleeper</option>
                                                    <option value="Wide Gauge Sleeper">Wide Gauge Sleeper</option>
                                                    <option value="Bridge Sleeper">Bridge Sleeper</option>
                                                </select>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>PO_SR_QTY + UNIT</label>
                                                <div className="input-field-mock">{icForm.poSrQty}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>CONSIGNEE</label>
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
                                                <label>Call Qty (Nos/Set/RMT)</label>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <input 
                                                        type="text"
                                                        className="input-field-mock"
                                                        value={icForm.callQty}
                                                        onChange={(e) => setIcForm({...icForm, callQty: e.target.value})}
                                                        style={{ flex: 1, height: '45px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                                    />
                                                    <select 
                                                        className="input-field-mock"
                                                        value={icForm.qtyUnit}
                                                        onChange={(e) => setIcForm({...icForm, qtyUnit: e.target.value})}
                                                        style={{ width: '80px', height: '45px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                                    >
                                                        <option value="Nos">Nos</option>
                                                        <option value="Set">Set</option>
                                                        <option value="RMT">RMT</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>PLACE OF INSPECTION</label>
                                                <div className="input-field-mock">{icForm.place}</div>
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
                        <span className="call-ref">Call Ref: {call?.id || 'N/A'}</span>
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
                            <div className="data-item"><label>RLY + PO_NO:</label> <span>{summaryData?.poNo || poForm.poNo}</span></div>
                            <div className="data-item"><label>PO DATE:</label> <span>{summaryData?.poDate || poForm.poDate}</span></div>
                            <div className="data-item"><label>VENDOR_NAME:</label> <span>{summaryData?.vendorName || poForm.vendorName}</span></div>
                        </div>
                        <div className="summary-col">
                            <div className="data-item"><label>PO_QTY:</label> <span>{summaryData?.quantityOnOrder || poForm.poQty}</span></div>
                            <div className="data-item"><label>MA_NO:</label> <span>{summaryData?.maNo || poForm.maNo}</span></div>
                            <div className="data-item"><label>MA_DATE:</label> <span>{summaryData?.maDate || poForm.maDate}</span></div>
                        </div>
                        <div className="summary-col">
                            <div className="data-item highlight"><label>Qty Offered Now:</label> <span>{summaryData?.qtyOfferedNow || totalOfferedNow}</span></div>
                            <div className="data-item success"><label>Accepted:</label> <span>{totalAccepted}</span></div>
                            <div className="data-item danger"><label>Rejected:</label> <span>{totalRejected}</span></div>
                        </div>
                        <div className="summary-col">
                            <div className="data-item warning"><label>ET Sleepers:</label> <span>{totalEt}</span></div>
                            <div className="data-item"><label>Call Date:</label> <span>{summaryData?.callDate ? new Date(summaryData.callDate).toLocaleDateString() : (call.date || icForm.callDate)}</span></div>
                            <div className="data-item"><label>No. of Batches:</label> <span>{summaryData?.noOfBatches || batches.length}</span></div>
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
                        
                        <div className="entry-actions-row" style={{ display: 'flex', gap: '15px', alignItems: 'start' }}>
                            {/* Action A: Add Rejection */}
                            <div className={`collapsible-entry-card ${activeAction === 'rejection' ? 'active' : ''}`} style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}>
                                <div 
                                    className="card-header-toggle" 
                                    onClick={() => setActiveAction(activeAction === 'rejection' ? null : 'rejection')}
                                    style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#fff1f1' }}
                                >
                                    <h5 style={{ margin: 0, color: '#dc2626', fontSize: '0.9rem' }}>Add Rejection {activeAction === 'rejection' ? '▼' : '▶'}</h5>
                                </div>
                                {activeAction === 'rejection' && (
                                    <div className="entry-form" style={{ padding: '16px', borderTop: '1px solid #e2e8f0' }}>
                                        <div className="field-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                            <div className="field">
                                                <label style={{ fontSize: '0.75rem', fontWeight: '700' }}>Batch Number</label>
                                                <select 
                                                    style={{ width: '100%', height: '35px', fontSize: '0.8rem' }}
                                                    value={rejectionEntry.batchNo} 
                                                    onChange={(e) => setRejectionEntry({...rejectionEntry, batchNo: e.target.value, sleeperNo: ''})}
                                                >
                                                    <option value="">Select Batch</option>
                                                    {batches.map(b => <option key={b.batchNo} value={b.batchNo}>{b.batchNo}</option>)}
                                                </select>
                                            </div>
                                            <div className="field">
                                                <label style={{ fontSize: '0.75rem', fontWeight: '700' }}>Sleeper Number</label>
                                                <select 
                                                    style={{ width: '100%', height: '35px', fontSize: '0.8rem' }}
                                                    value={rejectionEntry.sleeperNo} 
                                                    onChange={(e) => setRejectionEntry({...rejectionEntry, sleeperNo: e.target.value})}
                                                    disabled={!rejectionEntry.batchNo}
                                                >
                                                    <option value="">Select Sleeper</option>
                                                    {rejectionEntry.batchNo && batches.find(b => b.batchNo === rejectionEntry.batchNo).acceptedSleepers
                                                        .map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="field" style={{ marginBottom: '15px' }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '700' }}>Reason for Rejection</label>
                                            <select 
                                                style={{ width: '100%', height: '35px', fontSize: '0.8rem' }}
                                                value={rejectionEntry.reason} 
                                                onChange={(e) => setRejectionEntry({...rejectionEntry, reason: e.target.value})}
                                            >
                                                <option value="">Select Reason</option>
                                                <option value="Surface Crack">Surface Crack</option>
                                                <option value="Dimensional Variation">Dimensional Variation</option>
                                                <option value="Honeycombing">Honeycombing</option>
                                                <option value="Broken Edge">Broken Edge</option>
                                                <option value="END DAMAGE">END DAMAGE</option>
                                            </select>
                                        </div>
                                        <button className="add-btn reject" onClick={handleAddRejection} style={{ width: '100%', padding: '10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', fontSize: '0.8rem' }}>Log Rejection</button>
                                    </div>
                                )}
                            </div>
    
                            {/* Action B: Add ET */}
                            <div className={`collapsible-entry-card ${activeAction === 'et' ? 'active' : ''}`} style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}>
                                <div 
                                    className="card-header-toggle" 
                                    onClick={() => setActiveAction(activeAction === 'et' ? null : 'et')}
                                    style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#f0f9ff' }}
                                >
                                    <h5 style={{ margin: 0, color: '#0284c7', fontSize: '0.9rem' }}>Add Epoxy Treatment (ET) {activeAction === 'et' ? '▼' : '▶'}</h5>
                                </div>
                                {activeAction === 'et' && (
                                    <div className="entry-form" style={{ padding: '16px', borderTop: '1px solid #e2e8f0' }}>
                                        <div className="field-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                            <div className="field">
                                                <label style={{ fontSize: '0.75rem', fontWeight: '700' }}>Batch Number</label>
                                                <select 
                                                    style={{ width: '100%', height: '35px', fontSize: '0.8rem' }}
                                                    value={etEntry.batchNo} 
                                                    onChange={(e) => setEtEntry({...etEntry, batchNo: e.target.value, sleeperNo: ''})}
                                                >
                                                    <option value="">Select Batch</option>
                                                    {batches.map(b => <option key={b.batchNo} value={b.batchNo}>{b.batchNo}</option>)}
                                                </select>
                                            </div>
                                            <div className="field">
                                                <label style={{ fontSize: '0.75rem', fontWeight: '700' }}>Sleeper Number</label>
                                                <select 
                                                    style={{ width: '100%', height: '35px', fontSize: '0.8rem' }}
                                                    value={etEntry.sleeperNo} 
                                                    onChange={(e) => setEtEntry({...etEntry, sleeperNo: e.target.value})}
                                                    disabled={!etEntry.batchNo}
                                                >
                                                    <option value="">Select Sleeper</option>
                                                    {etEntry.batchNo && batches.find(b => b.batchNo === etEntry.batchNo).acceptedSleepers
                                                        .map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="field" style={{ marginBottom: '15px' }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '700' }}>Reason for ET</label>
                                            <select 
                                                style={{ width: '100%', height: '35px', fontSize: '0.8rem' }}
                                                value={etEntry.reason} 
                                                onChange={(e) => setEtEntry({...etEntry, reason: e.target.value})}
                                            >
                                                <option value="">Select Reason</option>
                                                <option value="Surface Crack">Surface Crack</option>
                                                <option value="Dimensional Variation">Dimensional Variation</option>
                                                <option value="Honeycombing">Honeycombing</option>
                                                <option value="Broken Edge">Broken Edge</option>
                                                <option value="END DAMAGE">END DAMAGE</option>
                                            </select>
                                        </div>
                                        <button className="add-btn et" onClick={handleAddEt} style={{ width: '100%', padding: '10px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', fontSize: '0.8rem' }}>Log Epoxy Treatment</button>
                                    </div>
                                )}
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
                        {/* PAUSE INSPECTION button below now handles saving */}
                        {/* Section 4: Summary & Actions (Simplified to Footer Actions) */}
                        <div className="inspection-footer-actions">
                            <button className="btn-pause" onClick={() => handleWorkflowAction('PAUSE')}>
                                PAUSE INSPECTION
                            </button>
                            <button className="btn-withheld" onClick={() => handleWorkflowAction('WITHHELD')}>
                                WITHHELD
                            </button>
                            <button className="btn-complete" onClick={() => handleWorkflowAction('FINISH')}>
                                COMPLETE INSPECTION
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default FinalInspectionScreen;
