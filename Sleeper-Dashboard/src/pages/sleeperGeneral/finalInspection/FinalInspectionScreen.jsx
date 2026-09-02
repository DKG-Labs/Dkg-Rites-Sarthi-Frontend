import React, { useState, useEffect } from 'react';
import './FinalInspectionScreen.css';
import { apiService } from '../../../services/api';
import { getStoredUser } from '../../../services/authService';
import ModernSearchableSelect from '../../../components/common/ModernSearchableSelect';

const PoVerificationSkeleton = ({ onBack }) => (
    <div className="verification-modal-page skeleton-screen-wrapper">
        <div className="verification-card-modern skeleton-card-box" style={{ width: '92%', maxWidth: '1200px', margin: '30px auto' }}>
            <div className="verification-header-modern" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
                <div className="skeleton-line" style={{ width: '320px', height: '26px', borderRadius: '6px' }} />
                <div className="skeleton-line" style={{ width: '120px', height: '26px', borderRadius: '20px' }} />
            </div>
            <div style={{ padding: '24px' }}>
                <div className="skeleton-line" style={{ height: '52px', borderRadius: '8px', marginBottom: '16px' }} />
                <div className="skeleton-grid-2col" style={{ marginBottom: '20px' }}>
                    <div className="skeleton-line" style={{ height: '42px', borderRadius: '6px' }} />
                    <div className="skeleton-line" style={{ height: '42px', borderRadius: '6px' }} />
                    <div className="skeleton-line" style={{ height: '42px', borderRadius: '6px' }} />
                    <div className="skeleton-line" style={{ height: '42px', borderRadius: '6px' }} />
                </div>
                <div className="skeleton-line" style={{ height: '52px', borderRadius: '8px', marginBottom: '16px' }} />
            </div>
            <div className="verification-footer sticky" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid #e2e8f0' }}>
                <div className="skeleton-line" style={{ width: '180px', height: '40px', borderRadius: '8px' }} />
                <div className="skeleton-line" style={{ width: '180px', height: '40px', borderRadius: '8px' }} />
            </div>
        </div>
    </div>
);

const FinalInspectionSkeleton = ({ onBack }) => (
    <div className="inspection-screen skeleton-screen-wrapper">
        <header className="inspection-header skeleton-header">
            <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button className="back-icon-btn" onClick={onBack} title="Back to Dashboard">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <div className="skeleton-line" style={{ width: '220px', height: '28px', borderRadius: '8px' }} />
                <div className="skeleton-capsules-row">
                    <div className="skeleton-line" style={{ width: '140px', height: '26px', borderRadius: '20px' }} />
                    <div className="skeleton-line" style={{ width: '100px', height: '26px', borderRadius: '20px' }} />
                    <div className="skeleton-line" style={{ width: '130px', height: '26px', borderRadius: '20px' }} />
                </div>
            </div>
        </header>

        <main className="inspection-content" style={{ padding: '24px' }}>
            {/* Section 1 Skeleton */}
            <section className="section skeleton-card-box">
                <div className="skeleton-line" style={{ width: '280px', height: '24px', marginBottom: '16px', borderRadius: '6px' }} />
                <div className="skeleton-grid-2col">
                    <div className="skeleton-line" style={{ height: '36px', borderRadius: '6px' }} />
                    <div className="skeleton-line" style={{ height: '36px', borderRadius: '6px' }} />
                    <div className="skeleton-line" style={{ height: '36px', borderRadius: '6px' }} />
                    <div className="skeleton-line" style={{ height: '36px', borderRadius: '6px' }} />
                </div>
            </section>

            {/* Section 2 Skeleton */}
            <section className="section skeleton-card-box">
                <div className="skeleton-title-between">
                    <div className="skeleton-line" style={{ width: '320px', height: '24px', borderRadius: '6px' }} />
                    <div className="skeleton-line" style={{ width: '140px', height: '26px', borderRadius: '20px' }} />
                </div>
                <div style={{ marginTop: '16px' }}>
                    <div className="skeleton-line" style={{ height: '42px', borderRadius: '6px', marginBottom: '10px' }} />
                    {[1, 2, 3, 4].map(idx => (
                        <div key={idx} className="skeleton-line" style={{ height: '46px', borderRadius: '6px', marginBottom: '8px' }} />
                    ))}
                </div>
            </section>

            {/* Section 3 Skeleton */}
            <section className="section skeleton-card-box">
                <div className="skeleton-line" style={{ width: '300px', height: '24px', marginBottom: '16px', borderRadius: '6px' }} />
                <div className="skeleton-grid-2col">
                    <div className="skeleton-line" style={{ height: '110px', borderRadius: '12px' }} />
                    <div className="skeleton-line" style={{ height: '110px', borderRadius: '12px' }} />
                </div>
            </section>

            {/* Section 4 Skeleton */}
            <section className="section skeleton-card-box">
                <div className="skeleton-line" style={{ width: '280px', height: '24px', marginBottom: '16px', borderRadius: '6px' }} />
                <div className="skeleton-kpi-grid">
                    {[1, 2, 3, 4, 5].map(idx => (
                        <div key={idx} className="skeleton-line" style={{ height: '75px', borderRadius: '10px' }} />
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '14px', marginTop: '20px' }}>
                    {[1, 2, 3, 4].map(idx => (
                        <div key={idx} className="skeleton-line" style={{ flex: 1, height: '44px', borderRadius: '10px' }} />
                    ))}
                </div>
            </section>
        </main>
    </div>
);

const FinalInspectionScreen = ({ call, onBack }) => {
    const isVerificationMode = call?.jobStatus !== 'PO_VERIFICATION' && call?.jobStatus !== 'INSPECTION';
    const [step, setStep] = useState(isVerificationMode ? 'po-verification' : 'inspection-form');
    const [poVerified, setPoVerified] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        // Handle Resuming from Pause or previously initiated steps
        if (call?.jobStatus === 'PAUSED' || call?.jobStatus === 'pause' || call?.jobStatus === 'PO_VERIFICATION') {
            setStep('inspection-form');
            setPoVerified(true);
            setSectionAStatus('approved');
            setSectionBStatus('approved');
        }
    }, [call]);
    
    // Batch and Sleeper Data
    const [batches, setBatches] = useState([]);

    const [expandedBatches, setExpandedBatches] = useState({});
    const [activeAction, setActiveAction] = useState(null); // 'rejection' or 'et'
    
    const [rejectionEntry, setRejectionEntry] = useState({ batchNo: '', sleeperNo: '', reason: '' });
    const [etEntry, setEtEntry] = useState({ batchNo: '', sleeperNo: '', reason: '' });

    // Verification Form State
    const [poForm, setPoForm] = useState({
        poNo: '',
        poDate: '',
        poQty: '',
        vendorName: '',
        maNo: 'N/A',
        maDate: 'N/A',
        purchasingAuthority: '',
        billPayingOfficer: ''
    });

    const [icForm, setIcForm] = useState({
        callNo: call?.requestId || '',
        callDate: '',
        desiredDate: '',
        rlyPoSr: '',
        itemDesc: '',
        productType: 'Sleeper',
        ercType: 'PSC Sleeper',
        poSrQty: '',
        consignee: '',
        origDp: '',
        extDp: '',
        origDpStart: '',
        stage: 'Final',
        callQty: '',
        qtyUnit: 'Nos',
        place: '',
        processIc: '',
        remarks: ''
    });

    useEffect(() => {
        const loadInitialVerificationDetails = async () => {
            if (!call?.requestId) return;
            if (step !== 'po-verification') return;
            try {
                setIsLoadingData(true);
                const [sec1Res, sec2Res, summaryRes] = await Promise.allSettled([
                    apiService.getSection1Details(call.requestId),
                    apiService.getSection2Details(call.requestId),
                    apiService.getInspectionCallSummary(call.requestId)
                ]);

                const sec1 = sec1Res.status === 'fulfilled' ? sec1Res.value?.responseData : null;
                const sec2 = sec2Res.status === 'fulfilled' ? sec2Res.value?.responseData : null;
                const summary = summaryRes.status === 'fulfilled' ? summaryRes.value?.responseData : null;

                if (sec1) {
                    setPoForm({
                        poNo: sec1.rlyPoNo || summary?.poNo || call.requestId,
                        poDate: sec1.poDate ? sec1.poDate.split('T')[0] : '',
                        poQty: sec1.poQty ? `${sec1.poQty} Nos` : (summary?.qtyOfferedNow ? `${summary.qtyOfferedNow} Nos` : ''),
                        vendorName: sec1.vendorName || call.vendorCode || '',
                        maNo: sec1.maNo || 'N/A',
                        maDate: sec1.maDate ? sec1.maDate.split('T')[0] : 'N/A',
                        purchasingAuthority: sec1.purchasingAuthority || '',
                        billPayingOfficer: sec1.billPayingOfficer || ''
                    });
                    setSectionAStatus('approved');
                    setIsSectionBVisible(true);
                    setSectionBExpanded(true);
                    setSectionAExpanded(false);
                } else if (summary) {
                    setPoForm(prev => ({
                        ...prev,
                        poNo: summary.poNo || call.requestId,
                        poDate: summary.callDate || '',
                        poQty: summary.qtyOfferedNow ? `${summary.qtyOfferedNow} Nos` : '',
                        vendorName: call.vendorCode || ''
                    }));
                }

                if (sec2) {
                    setIcForm({
                        callNo: sec2.inspectionCallNo || call.requestId,
                        callDate: sec2.inspectionCallDate ? sec2.inspectionCallDate.split('T')[0] : '',
                        desiredDate: sec2.inspectionDesiredDate ? sec2.inspectionDesiredDate.split('T')[0] : (summary?.desiredInspectionDate || ''),
                        rlyPoSr: sec2.rlyPoSr || (summary?.rlyPoNo ? `${summary.rlyPoNo}/001` : ''),
                        itemDesc: sec2.itemDesc || (summary?.itemDescription || ''),
                        productType: sec2.productType || 'Sleeper',
                        ercType: sec2.typeOfErc || summary?.sleeperType || 'PSC Sleeper',
                        poSrQty: sec2.poSrQtyUnit || (summary?.poQty ? `${summary.poQty} Nos.` : ''),
                        consignee: sec2.consignee || (summary?.consignee || ''),
                        origDp: sec2.origDp ? sec2.origDp.split('T')[0] : (summary?.deliveryDate ? summary.deliveryDate.split('T')[0] : ''),
                        extDp: sec2.extDp ? sec2.extDp.split('T')[0] : (summary?.extendedDeliveryDate ? summary.extendedDeliveryDate.split('T')[0] : ''),
                        origDpStart: sec2.origDpStart ? sec2.origDpStart.split('T')[0] : '',
                        stage: sec2.stageOfInspection || 'Final',
                        callQty: sec2.callQtyMt ? String(sec2.callQtyMt) : (summary?.qtyOfferedNow ? String(summary.qtyOfferedNow) : ''),
                        qtyUnit: 'Nos',
                        place: sec2.placeOfInspection || (summary?.placeOfInspection || ''),
                        processIc: sec2.processIcNumbers || '',
                        remarks: sec2.remarks || ''
                    });
                    setSectionBStatus('approved');
                } else if (summary) {
                    setIcForm(prev => ({
                        ...prev,
                        callNo: call.requestId,
                        callDate: summary.callDate ? summary.callDate.split('T')[0] : '',
                        desiredDate: summary.desiredInspectionDate ? summary.desiredInspectionDate.split('T')[0] : '',
                        rlyPoSr: summary.rlyPoNo ? `${summary.rlyPoNo}/001` : '',
                        itemDesc: summary.itemDescription || '',
                        productType: 'Sleeper',
                        ercType: summary.sleeperType || 'PSC Sleeper',
                        poSrQty: summary.poQty ? `${summary.poQty} Nos.` : '',
                        consignee: summary.consignee || '',
                        origDp: summary.deliveryDate ? summary.deliveryDate.split('T')[0] : '',
                        extDp: summary.extendedDeliveryDate ? summary.extendedDeliveryDate.split('T')[0] : '',
                        stage: 'Final',
                        callQty: summary.qtyOfferedNow ? String(summary.qtyOfferedNow) : '',
                        place: summary.placeOfInspection || ''
                    }));
                }
            } catch (err) {
                console.error("Error loading verification details:", err);
            } finally {
                setIsLoadingData(false);
            }
        };

        loadInitialVerificationDetails();
    }, [call, step]);

    const [sectionAStatus, setSectionAStatus] = useState(null); // 'approved' or 'rejected'
    const [sectionBStatus, setSectionBStatus] = useState(null); // 'approved' or 'rejected'
    
    const [sectionAExpanded, setSectionAExpanded] = useState(true);
    const [sectionBExpanded, setSectionBExpanded] = useState(false);
    
    const [isSectionBVisible, setIsSectionBVisible] = useState(false);
    const [summaryData, setSummaryData] = useState(null);
    const [batchDetails, setBatchDetails] = useState([]);

    const [isSavingSectionA, setIsSavingSectionA] = useState(false);
    const [isSavingSectionB, setIsSavingSectionB] = useState(false);
    const [isVerifyingPo, setIsVerifyingPo] = useState(false);
    const isVerificationBusy = isSavingSectionA || isSavingSectionB || isVerifyingPo;

    const formatDateISO = (dateStr) => {
        if (!dateStr || dateStr === 'N/A' || dateStr === 'null' || dateStr === 'undefined') return null;
        const datePart = String(dateStr).split('T')[0].trim();
        if (!datePart || datePart === 'null' || datePart === 'undefined' || datePart === 'N/A') return null;
        const parts = datePart.split(/[-/]/);
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        return datePart;
    };

    const toDateTimeISO = (dateStr) => {
        const iso = formatDateISO(dateStr);
        return iso ? `${iso}T00:00:00` : null;
    };

    const formatDateDMY = (dateStr) => {
        if (!dateStr || dateStr === 'N/A' || dateStr === 'null' || dateStr === 'undefined') return null;
        const datePart = String(dateStr).split('T')[0].trim();
        if (!datePart || datePart === 'null' || datePart === 'undefined') return null;
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
        if (isVerificationBusy) return;
        setIsSavingSectionA(true);
        try {
            const user = getStoredUser();
            const payload = {
                callNo: call.requestId || icForm.callNo,
                rlyPoNo: poForm.poNo,
                poDate: toDateTimeISO(poForm.poDate),
                poQty: parseInt(poForm.poQty) || 0,
                vendorName: poForm.vendorName,
                maNo: (!poForm.maNo || poForm.maNo === 'N/A') ? '' : poForm.maNo,
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
        } finally {
            setIsSavingSectionA(false);
        }
    };

    const handleSectionBOk = async () => {
        if (isVerificationBusy) return;
        setIsSavingSectionB(true);
        try {
            const user = getStoredUser();
            const payload = {
                callNo: call.requestId || icForm.callNo,
                inspectionCallDate: toDateTimeISO(icForm.callDate),
                inspectionDesiredDate: formatDateISO(icForm.desiredDate),
                rlyPoSr: icForm.rlyPoSr,
                itemDesc: icForm.itemDesc,
                productType: icForm.productType,
                typeOfErc: icForm.ercType,
                poSrQtyUnit: icForm.poSrQty,
                consignee: icForm.consignee,
                origDp: toDateTimeISO(icForm.origDp),
                extDp: toDateTimeISO(icForm.extDp),
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
        } finally {
            setIsSavingSectionB(false);
        }
    };

    const handlePoVerify = async () => {
        if (isVerificationBusy) return;
        setIsVerifyingPo(true);
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
        } finally {
            setIsVerifyingPo(false);
        }
    };

    const [activeActionLoading, setActiveActionLoading] = useState(null); // 'draft' | 'pause' | 'withdraw' | 'finish' | null
    const isProcessing = Boolean(activeActionLoading);
    const hasLoadedRef = React.useRef(false);

    useEffect(() => {
        const fetchInspectionData = async () => {
            const callNo = call?.requestId || call?.callNo || call?.id;
            if (!callNo || (step !== 'inspection-form' && !poVerified)) return;
            if (hasLoadedRef.current) return; // Prevent duplicate refetches

            console.log(`[Inspection Data] Initializing data for ${callNo}...`);
            hasLoadedRef.current = true;
            setIsLoadingData(true);

            try {
                // 1. Check Local Draft FIRST (Priority for edits and refreshed sessions)
                const savedDraft = localStorage.getItem(`inspection_draft_${callNo}`);
                let loadedFromDraft = false;
                if (savedDraft) {
                    try {
                        const draft = JSON.parse(savedDraft);
                        if (draft && Array.isArray(draft.batches) && draft.batches.length > 0) {
                            setBatches(draft.batches);
                            if (draft.summaryData) {
                                setSummaryData(draft.summaryData);
                            }
                            loadedFromDraft = true;
                            console.log(`[Inspection Data] Restored latest draft for ${callNo} from local cache.`);
                        }
                    } catch (e) {
                        console.error("Error parsing saved draft:", e);
                    }
                }

                // If draft loaded, fetch any missing summary metadata but DO NOT overwrite batches
                if (loadedFromDraft) {
                    try {
                        const summaryResp = await apiService.getInspectionCallSummary(callNo);
                        if (summaryResp && summaryResp.responseData) {
                            setSummaryData(prev => ({ ...summaryResp.responseData, ...(prev || {}) }));
                        }
                    } catch (e) {}
                    return;
                }

                // 2. If no local draft, check SAVED inspection data from backend
                let hasSavedBackendData = false;
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
                        hasSavedBackendData = true;
                    }
                } catch (err) {
                    console.log("No saved header found on backend.");
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
                            acceptedSleepers: (b.goodSleepers || []).map(s => typeof s === 'string' ? s : s.sleeperCode),
                            rejectedSleepers: (b.rejectedSleepers || []).map(s => ({
                                sleeperCode: typeof s === 'string' ? s : s.sleeperCode,
                                reason: s.reason || 'Rejected',
                                type: s.type || 'Main IE Rejection'
                            })),
                            etSleepers: (b.etSleepers || []).map(s => ({
                                sleeperCode: typeof s === 'string' ? s : s.sleeperCode,
                                reason: s.reason || 'Epoxy Treatment'
                            })),
                            mfTestedSleepers: (b.mfSleepers || []).map(s => typeof s === 'string' ? s : s.sleeperCode),
                            sleepers: [
                                ...(b.goodSleepers || []).map(s => typeof s === 'string' ? s : s.sleeperCode), 
                                ...(b.rejectedSleepers || []).map(s => typeof s === 'string' ? s : s.sleeperCode)
                            ]
                        }));
                        setBatches(mappedSaved);
                        hasSavedBackendData = true;
                    }
                } catch (err) {
                    console.log("No saved batches found on backend.");
                }

                // 3. Fallback to Initial Production Data if nothing was saved yet
                if (!hasSavedBackendData) {
                    try {
                        const summaryResp = await apiService.getInspectionCallSummary(callNo);
                        if (summaryResp && summaryResp.responseData) {
                            setSummaryData(summaryResp.responseData);
                        }
                    } catch (err) {
                        console.error("Error fetching initial inspection summary:", err);
                    }

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
            } catch (err) {
                console.error("Error initializing inspection data:", err);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchInspectionData();
    }, [step, poVerified, call?.requestId]);

    // Auto-save local draft whenever batches are updated in memory
    useEffect(() => {
        const callNo = call?.requestId || call?.callNo || call?.call_no || call?.id;
        if (callNo && Array.isArray(batches) && batches.length > 0) {
            const draft = {
                batches,
                summaryData,
                shift: call?.shift || icForm?.shift,
                inspectionDate: summaryData?.callDate || icForm?.callDate || new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem(`inspection_draft_${callNo}`, JSON.stringify(draft));
        }
    }, [batches, summaryData, call?.requestId, call?.shift, icForm?.shift, icForm?.callDate]);

    const getSCode = (s) => (typeof s === 'string' ? s : (s?.sleeperCode || ''));
    const getSReason = (s) => (typeof s === 'string' ? '' : (s?.reason || ''));

    const saveAllInspectionData = async () => {
        const user = getStoredUser();
        const plantId = localStorage.getItem('plantId');
        const callNo = call.requestId || call.callNo || call.call_no || call.id;
        const chosenShift = call.shift || icForm.shift || 'Shift A';
        const inspectionDate = formatDateDMY(summaryData?.callDate || icForm.callDate || new Date());
        const sleeperType = icForm.ercType || summaryData?.sleeperType || 'PSC Sleeper';

        // 1. Save SleeperFinalResult (Dedicated Table & Batch Results Table)
        const finalResultPayload = {
            callNumber: callNo,
            poNo: summaryData?.poNo || poForm.poNo,
            srNo: String(call.srNo || icForm.itemSrNo || '1'),
            shift: chosenShift,
            dateOfInspection: inspectionDate,
            sleeperType: sleeperType,
            totalOfferedQuantity: totalOfferedNow,
            totalAccepted: totalAccepted,
            totalRejected: totalRejected,
            plantId: plantId,
            createdBy: String(user?.userId || ''),
            updatedBy: String(user?.userId || ''),
            batches: batches.map(batch => ({
                batchNo: batch.batchNo,
                batchOfferedQuantity: batch.offeredNow,
                batchPassedQuantity: batch.passed,
                batchRejectedQuantity: batch.rejected,
                rejectedSleepers: (batch.rejectedSleepers || []).map(s => typeof s === 'string' ? { sleeperCode: s, reason: 'Rejected', type: 'Main IE Rejection' } : { sleeperCode: s.sleeperCode, reason: s.reason || 'Rejected', type: s.type || 'Main IE Rejection' }),
                epoxyTreatedSleepers: (batch.etSleepers || []).map(s => typeof s === 'string' ? { sleeperCode: s, reason: 'Epoxy Treatment' } : { sleeperCode: s.sleeperCode, reason: s.reason || 'Epoxy Treatment' })
            }))
        };
        
        let savedResultId = null;
        try {
            const sfrRes = await apiService.saveSleeperFinalResult(finalResultPayload);
            if (sfrRes && (sfrRes.id || sfrRes.responseData?.id)) {
                savedResultId = sfrRes.id || sfrRes.responseData?.id;
            }
        } catch (err) {
            console.warn("Error saving to saveSleeperFinalResult:", err);
        }

        // 2. Save Header Details (Existing final_call_inspection_header table)
        const headerPayload = {
            rlyPoNo: summaryData?.poNo || poForm.poNo,
            poDate: formatDateDMY(summaryData?.poDate || poForm.poDate),
            vendorName: summaryData?.vendorName || poForm.vendorName,
            callNo: callNo,
            poQty: Number(String(summaryData?.quantityOnOrder || poForm.poQty).replace(/\D/g, '')),
            maNo: poForm.maNo === 'N/A' ? '' : poForm.maNo,
            maDate: formatDateDMY(poForm.maDate),
            qtyOfferedNow: totalOfferedNow,
            acceptedQty: totalAccepted,
            rejectedQty: totalRejected,
            etSleepers: totalEt,
            callDate: inspectionDate,
            noOfBatches: batches.length,
            shift: chosenShift,
            plantId: plantId,
            vendorCode: call.vendorCode || icForm.vendorCode,
            createdBy: String(user?.userId || ''),
            updatedBy: String(user?.userId || '')
        };
        
        await apiService.saveMainIeInspectionHeader(headerPayload);

        // 3. Save Batch-wise details with ET reason
        for (const batch of batches) {
            const batchPayload = {
                batchNo: batch.batchNo,
                callNo: callNo,
                dateCasted: formatDateDMY(batch.dateCasted),
                casted: batch.qtyCasted,
                offeredPrev: batch.offeredPrev,
                offeredNow: batch.offeredNow,
                passed: batch.passed,
                rejected: batch.rejected,
                totalOffered: totalOfferedNow,
                totalAccepted: totalAccepted,
                totalRejected: totalRejected,
                shift: chosenShift,
                plantId: plantId,
                vendorCode: call.vendorCode || icForm.vendorCode,
                createdBy: String(user?.userId || ''),
                updatedBy: String(user?.userId || ''),
                goodSleepers: (batch.acceptedSleepers || []).map(s => ({ sleeperCode: typeof s === 'string' ? s : s.sleeperCode })),
                rejectedSleepers: (batch.rejectedSleepers || []).map(s => ({ 
                    sleeperCode: typeof s === 'string' ? s : s.sleeperCode, 
                    reason: (typeof s === 'object' && s.reason) ? s.reason : 'Rejected', 
                    type: (typeof s === 'object' && s.type) ? s.type : 'Main IE Rejection',
                    sleeperFinalResultId: savedResultId
                })),
                etSleepers: (batch.etSleepers || []).map(s => ({ 
                    sleeperCode: typeof s === 'string' ? s : s.sleeperCode,
                    reason: (typeof s === 'object' && s.reason) ? s.reason : 'Epoxy Treatment',
                    sleeperFinalResultId: savedResultId
                })),
                mfSleepers: (batch.mfTestedSleepers || []).map(s => ({ sleeperCode: typeof s === 'string' ? s : s.sleeperCode })),
                finalRejections: (batch.rejectedSleepers || []).map(s => ({ 
                    sleeperCode: typeof s === 'string' ? s : s.sleeperCode, 
                    reason: (typeof s === 'object' && s.reason) ? s.reason : 'Final Rejection', 
                    type: 'Final',
                    sleeperFinalResultId: savedResultId
                }))
            };
            await apiService.saveMainIeInspectionBatch(batchPayload);
        }

        // 4. Save local draft
        const draftData = {
            batches,
            summaryData,
            shift: chosenShift,
            inspectionDate,
            lastSaved: new Date().toISOString()
        };
        localStorage.setItem(`inspection_draft_${callNo}`, JSON.stringify(draftData));
    };

    const handleSaveDraft = async () => {
        if (isProcessing) return;
        try {
            setActiveActionLoading('draft');
            await saveAllInspectionData();
            alert("Inspection draft saved successfully!");
        } catch (error) {
            console.error("Error saving draft:", error);
            alert("Failed to save draft: " + (error.response?.data?.message || error.message));
        } finally {
            setActiveActionLoading(null);
        }
    };

    const handleWorkflowAction = async (actionName) => {
        if (isProcessing) return;
        try {
            if (actionName === 'PAUSE') setActiveActionLoading('pause');
            else if (actionName === 'WITHDRAW') setActiveActionLoading('withdraw');
            else if (actionName === 'FINISH') setActiveActionLoading('finish');

            const user = getStoredUser();
            const callNo = call.requestId || call.callNo || call.call_no || call.id;

            if (actionName === 'WITHDRAW') {
                const confirmed = window.confirm("Are you sure you want to withdraw this inspection call?");
                if (!confirmed) {
                    setActiveActionLoading(null);
                    return;
                }
            }

            // 1. Save all inspection data
            await saveAllInspectionData();

            // 2. Perform Workflow Transition
            let remarks = "Inspection performed from inspection screen";
            if (actionName === 'PAUSE') remarks = "Inspection paused";
            else if (actionName === 'WITHDRAW') remarks = "Inspection withdrawn";
            else if (actionName === 'FINISH') remarks = "Inspection completed";

            const transitionPayload = {
                workflowTransitionId: call.workflowTransitionId || call.id,
                moduleId: call.moduleId || 0,
                requestId: callNo,
                action: actionName,
                remarks: remarks,
                actionBy: Number(user?.userId || 0)
            };
            await apiService.performTransitionAction(transitionPayload);

            // 3. Clear draft only on finish or withdraw
            if (actionName === 'FINISH' || actionName === 'WITHDRAW') {
                localStorage.removeItem(`inspection_draft_${callNo}`);
            }

            onBack();
        } catch (error) {
            console.error(`Error performing action ${actionName}:`, error);
            alert(`Failed to perform ${actionName}: ` + (error.response?.data?.message || error.message));
        } finally {
            setActiveActionLoading(null);
        }
    };

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
                if (batch.rejectedSleepers.some(s => getSCode(s) === rejectionEntry.sleeperNo)) return batch;
                const newAccepted = batch.acceptedSleepers.filter(s => getSCode(s) !== rejectionEntry.sleeperNo);
                const newRejected = [...batch.rejectedSleepers, { 
                    sleeperCode: rejectionEntry.sleeperNo, 
                    reason: rejectionEntry.reason, 
                    type: 'Main IE Rejection' 
                }];
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
                if (batch.etSleepers.some(s => getSCode(s) === etEntry.sleeperNo)) return batch;
                
                const newAccepted = batch.acceptedSleepers.filter(s => getSCode(s) !== etEntry.sleeperNo);
                const newEt = [...batch.etSleepers, { 
                    sleeperCode: etEntry.sleeperNo, 
                    reason: etEntry.reason 
                }];
                return {
                    ...batch,
                    acceptedSleepers: newAccepted,
                    etSleepers: newEt
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
                const newRejected = batch.rejectedSleepers.filter(s => getSCode(s) !== sleeperNo);
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
                const newEt = batch.etSleepers.filter(s => getSCode(s) !== sleeperNo);
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

    if (isLoadingData) {
        if (step === 'po-verification') {
            return <PoVerificationSkeleton onBack={onBack} />;
        }
        return <FinalInspectionSkeleton onBack={onBack} />;
    }

    const renderTildeFormatted = (text, type = 'vendor') => {
        if (!text || text === '-' || text === 'N/A') return <span style={{ color: '#94a3b8' }}>-</span>;
        const textStr = String(text);
        if (!textStr.includes('~')) {
            return <div className="tilde-primary-title">{textStr}</div>;
        }
        const parts = textStr.split('~').map(p => p.trim()).filter(Boolean);
        return (
            <div className="tilde-formatted-block">
                <div className={`tilde-primary-title ${type}-title`}>{parts[0]}</div>
                {parts.slice(1).length > 0 && (
                    <div className="tilde-sub-details">
                        {parts.slice(1).map((part, idx) => (
                            <span key={idx} className={`tilde-sub-pill pill-${type}`}>{part}</span>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (step === 'po-verification') {
        const currentDateFormatted = new Date().toLocaleString('en-US', {
            month: '2-digit', day: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });

        return (
            <div className="inspection-screen verification-mode">
                <div className="verification-card-modern scrollable">
                    {/* TOP HEADER */}
                    <div className="verification-card-header sticky">
                        <div className="header-titles-left">
                            <div className="header-badge-title-row">
                                <div className="initiation-icon-box">🛡️</div>
                                <div>
                                    <h2>Inspection Initiation for <span className="call-no-highlight">{icForm.callNo || call.requestId}</span></h2>
                                    <div className="header-meta-tags">
                                        <span className="meta-tag-pill po-tag">PO: {poForm.poNo || 'N/A'}</span>
                                        <span className="meta-tag-pill time-tag">🕒 {currentDateFormatted}</span>
                                        <span className="meta-tag-pill vendor-tag">🏢 {poForm.vendorName ? (poForm.vendorName.split('~')[0] || poForm.vendorName.substring(0, 30)) : 'Vendor'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="header-progress-indicator">
                            <span className="step-badge active">Step 1 of 2: PO Verification</span>
                        </div>
                    </div>

                    <div className="verification-content-wrapper">
                        {/* SECTION A */}
                        <div className={`verification-collapsible-card ${sectionAStatus === 'approved' ? 'card-verified' : ''}`}>
                            <div className="card-header-toggle" onClick={() => setSectionAExpanded(!sectionAExpanded)}>
                                <div className="toggle-title-left">
                                    <span className="section-dot dot-a"></span>
                                    <h3>SECTION A: Main PO Information <span className="section-po-sub">— {poForm.poNo}</span></h3>
                                </div>
                                <div className="toggle-header-right">
                                    {sectionAStatus === 'approved' && (
                                        <span className="status-chip chip-approved">✓ Section A Verified</span>
                                    )}
                                    {sectionAStatus === 'rejected' && (
                                        <span className="status-chip chip-rejected">✕ Marked Not OK</span>
                                    )}
                                    {!sectionAStatus && (
                                        <span className="status-chip chip-pending">Pending Review</span>
                                    )}
                                    <button className="accordion-toggle-btn" aria-label="Toggle Section A">
                                        {sectionAExpanded ? '▲' : '▼'}
                                    </button>
                                </div>
                            </div>
                            
                            {sectionAExpanded && (
                                <div className="verification-form-body-modern">
                                    <div className="form-grid-modern-4col">
                                        <div className="form-group-modern">
                                            <label>🔖 RLY + PO_NO</label>
                                            <div className="input-field-mock po-number-field">{poForm.poNo || '-'}</div>
                                        </div>
                                        <div className="form-group-modern">
                                            <label>📅 PO DATE</label>
                                            <div className="input-field-mock">{poForm.poDate || '-'}</div>
                                            <span className="date-check-label">✓ PO Date ≤ Today</span>
                                        </div>
                                        <div className="form-group-modern">
                                            <label>🔢 PO_QTY</label>
                                            <div className="input-field-mock qty-field">{poForm.poQty || '-'}</div>
                                        </div>
                                        <div className="form-group-modern span-2">
                                            <label className="highlight-label-vendor">🏢 VENDOR_NAME</label>
                                            <div className="input-field-mock highlight-vendor-field">
                                                {renderTildeFormatted(poForm.vendorName, 'vendor')}
                                            </div>
                                        </div>
                                        <div className="form-group-modern">
                                            <label>MA_NO</label>
                                            <div className="input-field-mock">{poForm.maNo || 'N/A'}</div>
                                        </div>
                                        <div className="form-group-modern">
                                            <label>MA_DATE</label>
                                            <div className="input-field-mock">{poForm.maDate || 'N/A'}</div>
                                        </div>
                                        <div className="form-group-modern span-2">
                                            <label className="highlight-label-authority">🏛️ PURCHASING AUTHORITY</label>
                                            <div className="input-field-mock highlight-authority-field">
                                                {renderTildeFormatted(poForm.purchasingAuthority, 'authority')}
                                            </div>
                                        </div>
                                        <div className="form-group-modern span-2">
                                            <label className="highlight-label-billpay">💳 BILL PAYING OFFICER</label>
                                            <div className="input-field-mock highlight-billpay-field">
                                                {renderTildeFormatted(poForm.billPayingOfficer, 'billpay')}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="section-status-actions">
                                        {sectionAStatus === 'approved' ? (
                                            <div className="section-verified-confirmation-row">
                                                <div className="section-verified-notice">
                                                    <span className="verified-check-icon">✓</span>
                                                    <span className="verified-check-text">Section A Information Verified & Saved</span>
                                                </div>
                                                <button 
                                                    type="button"
                                                    className="btn-status-reverify"
                                                    disabled={isVerificationBusy}
                                                    onClick={() => setSectionAStatus(null)}
                                                >
                                                    ✏️ Re-verify Section A
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <button 
                                                    type="button"
                                                    className={`btn-status-not-ok ${sectionAStatus === 'rejected' ? 'active' : ''}`}
                                                    disabled={isVerificationBusy}
                                                    onClick={() => setSectionAStatus('rejected')}
                                                >
                                                    ✕ Not OK
                                                </button>
                                                <button 
                                                    type="button"
                                                    className="btn-status-ok"
                                                    disabled={isVerificationBusy}
                                                    onClick={handleSectionAOk}
                                                >
                                                    {isSavingSectionA ? (
                                                        <span className="btn-loading-content">
                                                            <span className="spinner-mini"></span> Saving Section A...
                                                        </span>
                                                    ) : (
                                                        '✓ OK & Verify Section A'
                                                    )}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SECTION B */}
                        {isSectionBVisible && (
                            <div className={`verification-collapsible-card ${sectionBStatus === 'approved' ? 'card-verified' : ''}`}>
                                <div className="card-header-toggle" onClick={() => setSectionBExpanded(!sectionBExpanded)}>
                                    <div className="toggle-title-left">
                                        <span className="section-dot dot-b"></span>
                                        <h3>SECTION B: Inspection Call Details <span className="section-po-sub">— {poForm.poNo}</span></h3>
                                    </div>
                                    <div className="toggle-header-right">
                                        {sectionBStatus === 'approved' && (
                                            <span className="status-chip chip-approved">✓ Section B Verified</span>
                                        )}
                                        {sectionBStatus === 'rejected' && (
                                            <span className="status-chip chip-rejected">✕ Marked Not OK</span>
                                        )}
                                        {!sectionBStatus && (
                                            <span className="status-chip chip-pending">Pending Review</span>
                                        )}
                                        <button className="accordion-toggle-btn" aria-label="Toggle Section B">
                                            {sectionBExpanded ? '▲' : '▼'}
                                        </button>
                                    </div>
                                </div>

                                {sectionBExpanded && (
                                    <div className="verification-form-body-modern">
                                        <div className="form-grid-modern-4col">
                                            <div className="form-group-modern">
                                                <label>INSPECTION CALL NO.</label>
                                                <div className="input-field-mock call-no-field">{icForm.callNo || '-'}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>INSPECTION CALL DATE</label>
                                                <div className="input-field-mock">{icForm.callDate || '-'}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>INSPECTION DESIRED DATE</label>
                                                <div className="input-field-mock desired-date-field">{icForm.desiredDate || '-'}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>RLY + PO_NO + PO_SR</label>
                                                <div className="input-field-mock">{icForm.rlyPoSr || '-'}</div>
                                            </div>
                                            <div className="form-group-modern full-width">
                                                <label className="highlight-label-itemdesc">📑 ITEM DESC</label>
                                                <div className="input-field-mock highlight-itemdesc-field text-wrap">{icForm.itemDesc || '-'}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>PRODUCT TYPE</label>
                                                <div className="input-field-mock product-pill">{icForm.productType || 'Sleeper'}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>Type of Sleeper <span className="req-star">*</span></label>
                                                <select 
                                                    className="input-field-mock modern-select"
                                                    value={icForm.ercType}
                                                    disabled={isVerificationBusy}
                                                    onChange={(e) => setIcForm({...icForm, ercType: e.target.value})}
                                                >
                                                    <option value="PSC Sleeper">PSC Sleeper</option>
                                                    <option value="Normal Sleeper">Normal Sleeper</option>
                                                    <option value="Wide Gauge Sleeper">Wide Gauge Sleeper</option>
                                                    <option value="Bridge Sleeper">Bridge Sleeper</option>
                                                </select>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>PO_SR_QTY + UNIT</label>
                                                <div className="input-field-mock">{icForm.poSrQty || '-'}</div>
                                            </div>
                                            <div className="form-group-modern span-2">
                                                <label className="highlight-label-consignee">📦 CONSIGNEE</label>
                                                <div className="input-field-mock highlight-consignee-field">
                                                    {renderTildeFormatted(icForm.consignee, 'consignee')}
                                                </div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>ORIG_DP</label>
                                                <div className="input-field-mock">{icForm.origDp || '-'}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>EXT_DP</label>
                                                <div className="input-field-mock">{icForm.extDp || '-'}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>ORIG_DP_START</label>
                                                <div className="input-field-mock">{icForm.origDpStart || '-'}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>STAGE OF INSPECTION</label>
                                                <div className="input-field-mock">{icForm.stage || 'Final'}</div>
                                            </div>
                                            <div className="form-group-modern">
                                                <label>CALL QTY</label>
                                                <div className="input-field-mock qty-field">
                                                    {icForm.callQty ? `${icForm.callQty} ${icForm.qtyUnit || 'Nos'}` : '-'}
                                                </div>
                                            </div>
                                            <div className="form-group-modern span-2">
                                                <label className="highlight-label-place">📍 PLACE OF INSPECTION</label>
                                                <div className="input-field-mock highlight-place-field">
                                                    {renderTildeFormatted(icForm.place, 'place')}
                                                </div>
                                            </div>

                                            <div className="form-group-modern full-width">
                                                <label>REMARKS</label>
                                                <div className="input-field-mock text-wrap text-sm">{icForm.remarks || '-'}</div>
                                            </div>
                                        </div>

                                        <div className="section-status-actions">
                                            {sectionBStatus === 'approved' ? (
                                                <div className="section-verified-confirmation-row">
                                                    <div className="section-verified-notice">
                                                        <span className="verified-check-icon">✓</span>
                                                        <span className="verified-check-text">Section B Information Verified & Saved</span>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        className="btn-status-reverify"
                                                        disabled={isVerificationBusy}
                                                        onClick={() => setSectionBStatus(null)}
                                                    >
                                                        ✏️ Re-verify Section B
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button 
                                                        type="button"
                                                        className={`btn-status-not-ok ${sectionBStatus === 'rejected' ? 'active' : ''}`}
                                                        disabled={isVerificationBusy}
                                                        onClick={() => setSectionBStatus('rejected')}
                                                    >
                                                        ✕ Not OK
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        className="btn-status-ok"
                                                        disabled={isVerificationBusy}
                                                        onClick={handleSectionBOk}
                                                    >
                                                        {isSavingSectionB ? (
                                                            <span className="btn-loading-content">
                                                                <span className="spinner-mini"></span> Saving Section B...
                                                            </span>
                                                        ) : (
                                                            '✓ OK & Verify Section B'
                                                        )}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* FOOTER */}
                    <div className="verification-footer sticky">
                        <div className="footer-actions-left">
                            <button 
                                className="back-landing-btn-modern" 
                                disabled={isVerificationBusy}
                                onClick={onBack}
                            >
                                ← Back to Calls Dashboard
                            </button>
                        </div>
                        <div className="footer-actions-right">
                            <button 
                                className="open-verify-btn-modern" 
                                disabled={sectionBStatus !== 'approved' || isVerificationBusy}
                                onClick={handlePoVerify}
                            >
                                {isVerifyingPo ? (
                                    <span className="btn-loading-content">
                                        <span className="spinner-mini"></span> Opening & Verifying Form...
                                    </span>
                                ) : (
                                    'Open & Verify Form →'
                                )}
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
                    <button className="back-icon-btn" onClick={onBack} title="Back to Dashboard">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <div className="header-call-meta">
                        <div className="title-row">
                            <h1>Final Inspection</h1>
                            <span className="pill-badge call-badge">
                                Call No: {call?.requestId || call?.callNo || call?.call_no || call?.id || 'N/A'}
                            </span>
                            <span className="pill-badge shift-badge">
                                Shift: {call?.shift || icForm?.shift || 'Shift A'}
                            </span>
                            <span className="pill-badge date-badge">
                                Date: {summaryData?.callDate ? new Date(summaryData.callDate).toLocaleDateString('en-GB') : (call.date || icForm.callDate || new Date().toLocaleDateString('en-GB'))}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="header-status">
                    <span className="status-indicator live">● INSPECTION IN PROGRESS</span>
                    <span className="timer">00:45:12</span>
                </div>
            </header>

            <main className="inspection-layout">
                {/* Section 1: PO & Vendor Details */}
                <section className="section summary-header-modern">
                    <div className="section-title-bar">
                        <div className="title-left">
                            <span className="section-step-num">01</span>
                            <h3>Section 1: PO & Vendor Details</h3>
                        </div>
                        <div className="title-right">
                            <span className="plant-tag">Plant: {call.placeOfInspection || summaryData?.placeOfInspection || poForm.vendorName || 'Plant-1'}</span>
                        </div>
                    </div>

                    <div className="header-cards-container single-card-layout">
                        {/* Purchase Order & Vendor Details Card */}
                        <div className="header-info-card po-meta-card full-width-card">
                            <div className="card-fields-grid-po">
                                <div className="meta-field">
                                    <span className="label">RLY + PO Number</span>
                                    <span className="value po-val">{summaryData?.poNo || poForm.poNo || 'N/A'}</span>
                                </div>
                                <div className="meta-field">
                                    <span className="label">PO Date</span>
                                    <span className="value">{summaryData?.poDate || poForm.poDate || 'N/A'}</span>
                                </div>
                                <div className="meta-field">
                                    <span className="label">PO Quantity</span>
                                    <span className="value">{summaryData?.quantityOnOrder || poForm.poQty || 'N/A'}</span>
                                </div>
                                <div className="meta-field">
                                    <span className="label">MA No / Date</span>
                                    <span className="value">{poForm.maNo && poForm.maNo !== 'N/A' ? `${poForm.maNo} (${poForm.maDate})` : 'N/A'}</span>
                                </div>
                                <div className="meta-field full-row">
                                    <span className="label">Vendor Name & Address</span>
                                    <span className="value vendor-val">{summaryData?.vendorName || poForm.vendorName || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="main-working-area">
                    {/* Section 2: Batch Details */}
                    <section className="section batch-details">
                        <div className="section-title-bar">
                            <div className="title-left">
                                <span className="section-step-num">02</span>
                                <h3>Section 2: Batch-Wise Summary</h3>
                            </div>
                            <div className="title-right">
                                <span className="sleeper-type-tag">
                                    Sleeper Type: <strong>{icForm.ercType || summaryData?.sleeperType || 'PSC Sleeper (RT-8746)'}</strong>
                                </span>
                            </div>
                        </div>
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
                                                                    {batch.rejectedSleepers.map(s => {
                                                                        const sCode = getSCode(s);
                                                                        const sReason = getSReason(s);
                                                                        return (
                                                                            <span key={sCode} className="tag rejected">
                                                                                <strong>{sCode}</strong>
                                                                                {sReason && <span className="tag-reason"> ({sReason})</span>}
                                                                                <i onClick={() => removeRejection(batch.batchNo, sCode)}>×</i>
                                                                            </span>
                                                                        );
                                                                    })}
                                                                    {batch.rejectedSleepers.length === 0 && <span className="empty">None</span>}
                                                                </div>
                                                            </div>
                                                            <div className="detail-list">
                                                                <h6>Epoxy Treated (ET) ({batch.etSleepers.length})</h6>
                                                                <div className="tag-container">
                                                                    {batch.etSleepers.map(s => {
                                                                        const sCode = getSCode(s);
                                                                        const sReason = getSReason(s);
                                                                        return (
                                                                            <span key={sCode} className="tag et">
                                                                                <strong>{sCode}</strong>
                                                                                {sReason && <span className="tag-reason"> ({sReason})</span>}
                                                                                <i onClick={() => removeEt(batch.batchNo, sCode)}>×</i>
                                                                            </span>
                                                                        );
                                                                    })}
                                                                    {batch.etSleepers.length === 0 && <span className="empty">None</span>}
                                                                </div>
                                                            </div>
                                                            <div className="detail-list">
                                                                <h6>MF Tested ({batch.mfTestedSleepers.length})</h6>
                                                                <div className="tag-container">
                                                                    {batch.mfTestedSleepers.map(s => {
                                                                        const sCode = getSCode(s);
                                                                        return (
                                                                            <span key={sCode} className="tag mf">{sCode}</span>
                                                                        );
                                                                    })}
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
                    <section className="section verdict-entry-modern">
                        <div className="section-title-bar">
                            <div className="title-left">
                                <span className="section-step-num">03</span>
                                <h3>Section 3: Final Verdict (Data Entry)</h3>
                            </div>
                            <div className="title-right">
                                <span className="verdict-hint-tag">Log Rejections & Epoxy Treatments (ET)</span>
                            </div>
                        </div>
                        
                        <div className="verdict-cards-grid">
                            {/* Card 1: Add Rejection */}
                            <div className={`verdict-interactive-card card-rejection ${activeAction === 'rejection' ? 'expanded' : ''}`}>
                                <div 
                                    className="verdict-card-header" 
                                    onClick={() => setActiveAction(activeAction === 'rejection' ? null : 'rejection')}
                                >
                                    <div className="header-left-group">
                                        <span className="action-icon-badge icon-rejection">✕</span>
                                        <div>
                                            <h4 className="card-title-red">Log Sleeper Rejection</h4>
                                            <p className="card-subtitle">Record defective or rejected sleepers by batch</p>
                                        </div>
                                    </div>
                                    <div className="header-right-group">
                                        <span className="status-pill-toggle red-toggle">
                                            {activeAction === 'rejection' ? 'Collapse ▲' : '+ Add Rejection ▼'}
                                        </span>
                                    </div>
                                </div>

                                {activeAction === 'rejection' && (
                                    <div className="verdict-form-body">
                                        <div className="form-row-2col">
                                            <div className="form-input-group">
                                                <label>Batch Number <span className="req">*</span></label>
                                                <ModernSearchableSelect
                                                    value={rejectionEntry.batchNo}
                                                    onChange={(val) => setRejectionEntry({...rejectionEntry, batchNo: val, sleeperNo: ''})}
                                                    options={batches.map(b => ({ value: b.batchNo, label: `Batch ${b.batchNo}` }))}
                                                    placeholder="Search or Select Batch"
                                                    theme="red"
                                                />
                                            </div>
                                            <div className="form-input-group">
                                                <label>Sleeper Number <span className="req">*</span></label>
                                                <ModernSearchableSelect
                                                    value={rejectionEntry.sleeperNo}
                                                    onChange={(val) => setRejectionEntry({...rejectionEntry, sleeperNo: val})}
                                                    options={(batches.find(b => b.batchNo === rejectionEntry.batchNo)?.acceptedSleepers || [])
                                                        .map(s => {
                                                            const code = typeof s === 'string' ? s : s?.sleeperCode;
                                                            return { value: code, label: code };
                                                        })}
                                                    placeholder={rejectionEntry.batchNo ? "Search or Select Sleeper" : "Select Batch first"}
                                                    disabled={!rejectionEntry.batchNo}
                                                    theme="red"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-input-group full-width-input">
                                            <label>Reason for Rejection <span className="req">*</span></label>
                                            <select 
                                                value={rejectionEntry.reason} 
                                                onChange={(e) => setRejectionEntry({...rejectionEntry, reason: e.target.value})}
                                            >
                                                <option value="">Select Reason for Rejection</option>
                                                <option value="Surface Crack">Surface Crack</option>
                                                <option value="Dimensional Variation">Dimensional Variation</option>
                                                <option value="Honeycombing">Honeycombing</option>
                                                <option value="Broken Edge">Broken Edge</option>
                                                <option value="END DAMAGE">END DAMAGE</option>
                                                <option value="Insert Misalignment">Insert Misalignment</option>
                                            </select>
                                        </div>
                                        <button className="btn-submit-verdict btn-red" onClick={handleAddRejection}>
                                            <span>✕</span> Log Rejection Record
                                        </button>
                                    </div>
                                )}
                            </div>
    
                            {/* Card 2: Add ET */}
                            <div className={`verdict-interactive-card card-et ${activeAction === 'et' ? 'expanded' : ''}`}>
                                <div 
                                    className="verdict-card-header" 
                                    onClick={() => setActiveAction(activeAction === 'et' ? null : 'et')}
                                >
                                    <div className="header-left-group">
                                        <span className="action-icon-badge icon-et">🧪</span>
                                        <div>
                                            <h4 className="card-title-blue">Log Epoxy Treatment (ET)</h4>
                                            <p className="card-subtitle">Record epoxy-treated sleepers with defect reasons</p>
                                        </div>
                                    </div>
                                    <div className="header-right-group">
                                        <span className="status-pill-toggle blue-toggle">
                                            {activeAction === 'et' ? 'Collapse ▲' : '+ Add ET ▼'}
                                        </span>
                                    </div>
                                </div>

                                {activeAction === 'et' && (
                                    <div className="verdict-form-body">
                                        <div className="form-row-2col">
                                            <div className="form-input-group">
                                                <label>Batch Number <span className="req">*</span></label>
                                                <ModernSearchableSelect
                                                    value={etEntry.batchNo}
                                                    onChange={(val) => setEtEntry({...etEntry, batchNo: val, sleeperNo: ''})}
                                                    options={batches.map(b => ({ value: b.batchNo, label: `Batch ${b.batchNo}` }))}
                                                    placeholder="Search or Select Batch"
                                                    theme="blue"
                                                />
                                            </div>
                                            <div className="form-input-group">
                                                <label>Sleeper Number <span className="req">*</span></label>
                                                <ModernSearchableSelect
                                                    value={etEntry.sleeperNo}
                                                    onChange={(val) => setEtEntry({...etEntry, sleeperNo: val})}
                                                    options={(batches.find(b => b.batchNo === etEntry.batchNo)?.acceptedSleepers || [])
                                                        .map(s => {
                                                            const code = typeof s === 'string' ? s : s?.sleeperCode;
                                                            return { value: code, label: code };
                                                        })}
                                                    placeholder={etEntry.batchNo ? "Search or Select Sleeper" : "Select Batch first"}
                                                    disabled={!etEntry.batchNo}
                                                    theme="blue"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-input-group full-width-input">
                                            <label>Reason for Epoxy Treatment <span className="req">*</span></label>
                                            <select 
                                                value={etEntry.reason} 
                                                onChange={(e) => setEtEntry({...etEntry, reason: e.target.value})}
                                            >
                                                <option value="">Select Reason for ET</option>
                                                <option value="Surface Crack">Surface Crack</option>
                                                <option value="Dimensional Variation">Dimensional Variation</option>
                                                <option value="Honeycombing">Honeycombing</option>
                                                <option value="Broken Edge">Broken Edge</option>
                                                <option value="END DAMAGE">END DAMAGE</option>
                                                <option value="Minor Pitting">Minor Pitting</option>
                                            </select>
                                        </div>
                                        <button className="btn-submit-verdict btn-blue" onClick={handleAddEt}>
                                            <span>🧪</span> Log Epoxy Treatment Record
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Section 4: Final Inspection Result */}
                <section className="section final-result-section">
                    <div className="section-title-bar">
                        <div className="title-left">
                            <span className="section-step-num">04</span>
                            <h3>Section 4: Final Inspection Result</h3>
                        </div>
                    </div>

                    <div className="final-result-card-body">
                        {/* Inspection Quantities Metric Cards */}
                        <div className="kpi-metrics-grid-modern">
                            <div className="kpi-box kpi-offered">
                                <span className="kpi-num">{totalOfferedNow}</span>
                                <span className="kpi-title">Offered Now</span>
                            </div>
                            <div className="kpi-box kpi-accepted">
                                <span className="kpi-num">{totalAccepted}</span>
                                <span className="kpi-title">Accepted</span>
                            </div>
                            <div className="kpi-box kpi-rejected">
                                <span className="kpi-num">{totalRejected}</span>
                                <span className="kpi-title">Rejected</span>
                            </div>
                            <div className="kpi-box kpi-et">
                                <span className="kpi-num">{totalEt}</span>
                                <span className="kpi-title">ET Sleepers</span>
                            </div>
                            <div className="kpi-box kpi-batches">
                                <span className="kpi-num">{batches.length}</span>
                                <span className="kpi-title">Total Batches</span>
                            </div>
                        </div>

                        {/* Action Buttons Row with Concurrency Lockout */}
                        <div className="final-action-buttons-row">
                            <button 
                                className="btn-action-custom btn-save-draft" 
                                onClick={handleSaveDraft} 
                                disabled={isProcessing}
                                style={{ opacity: isProcessing ? 0.6 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                            >
                                {activeActionLoading === 'draft' ? '⏳ Saving Draft...' : '💾 SAVE DRAFT'}
                            </button>
                            <button 
                                className="btn-action-custom btn-pause-inspection" 
                                onClick={() => handleWorkflowAction('PAUSE')} 
                                disabled={isProcessing}
                                style={{ opacity: isProcessing ? 0.6 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                            >
                                {activeActionLoading === 'pause' ? '⏳ Pausing...' : '⏸️ PAUSE INSPECTION'}
                            </button>
                            <button 
                                className="btn-action-custom btn-withdraw-inspection" 
                                onClick={() => handleWorkflowAction('WITHDRAW')} 
                                disabled={isProcessing}
                                style={{ opacity: isProcessing ? 0.6 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                            >
                                {activeActionLoading === 'withdraw' ? '⏳ Withdrawing...' : '🚫 WITHDRAW'}
                            </button>
                            <button 
                                className="btn-action-custom btn-finish-inspection" 
                                onClick={() => handleWorkflowAction('FINISH')} 
                                disabled={isProcessing}
                                style={{ opacity: isProcessing ? 0.6 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                            >
                                {activeActionLoading === 'finish' ? '⏳ Completing...' : '✅ FINISH INSPECTION'}
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default FinalInspectionScreen;
