import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { getFinalIcSaveChanges, getFinalIcEditData } from '../services/certificateService';
import { 
    extractAnnexure1Data, 
    generateAnnexure1PDF, 
    getAnnexure1PDFBlob,
    formatIcDate,
    cleanDrawingNo
} from '../utils/annexure1Generator';

const AnnexuresModal = ({ isOpen, onClose, call, showNotification }) => {
    const [activeSubTab, setActiveSubTab] = useState('annexure-1');
    const [enrichedCall, setEnrichedCall] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pdfLoading, setPdfLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !call) return;

        let isMounted = true;
        const fetchDetails = async () => {
            setLoading(true);
            const callId = call.call_no || call.callNumber || call.requestId || call.id;
            try {
                let details = null;
                let icData = null;
                let editData = null;

                if (callId) {
                    // 1. Fetch Call Letter details (contains detailed batch breakdowns and PO metadata)
                    try {
                        const res = await apiService.getCallLetterDetails(callId);
                        details = res?.responseData || res || null;
                    } catch (err) {
                        console.warn('[AnnexuresModal] Could not fetch call letter details:', err);
                    }

                    // 2. Fetch Sleeper IC Data (from /sleeper-dashboard/sleeperIc/{callNo})
                    try {
                        const icRes = await apiService.getSleeperIc(callId);
                        icData = icRes?.data || icRes?.responseData || icRes || null;
                    } catch (err) {
                        console.warn('[AnnexuresModal] Could not fetch sleeper IC data:', err);
                    }

                    // 3. Fetch any draft or saved edits from certificateService
                    const candidateKeys = Array.from(new Set([
                        icData?.certificateNo,
                        icData?.icNo,
                        callId,
                        call?.certificateNo,
                        call?.icNo,
                        call?.callNo,
                        call?.call_no,
                        call?.requestId
                    ].filter(Boolean)));

                    for (const k of candidateKeys) {
                        try {
                            editData = await getFinalIcSaveChanges(k);
                            if (!editData) editData = await getFinalIcEditData(k);
                            if (editData && (editData.bookNo || editData.certificateNo || editData.setNo)) {
                                break;
                            }
                        } catch (_) {}
                    }
                }

                if (!isMounted) return;

                // 4. Resolve Book No, Set No, IC No, and IC Date strictly from IC sources
                const resolvedBookNo = editData?.bookNo || icData?.bookNo || call.bookNo || details?.bookNo || '-';
                const resolvedSetNo = editData?.setNo || icData?.setNo || call.setNo || details?.setNo || '-';
                const resolvedIcNo = editData?.certificateNo || icData?.certificateNo || icData?.icNo || call.certificateNo || call.icNo || call.callNo || call.callNumber || callId;

                const rawIcDate = editData?.certificateDate || editData?.date || icData?.date || icData?.certificateDate || call.certificateDate || call.callDate || call.createdDate || details?.callDate;
                const resolvedIcDate = formatIcDate(rawIcDate);

                // 5. Drawing No: keep original as was correct (e.g. "WB: RT-8746")
                let rawDrawing = call.drawingNo || call.sleeperType || call.product_type || call.productType || details?.drawingNo || editData?.drawingNo || icData?.drawingNo || '';
                let resolvedDrawingNo = cleanDrawingNo(rawDrawing);
                if ((!resolvedDrawingNo || resolvedDrawingNo === '-') && icData?.descriptionOfStores) {
                    const match = icData.descriptionOfStores.match(/\((RT-\d+)\)/i) || icData.descriptionOfStores.match(/\b(RT-\d+)\b/i);
                    if (match) resolvedDrawingNo = match[1];
                }

                let activePlant = null;
                try {
                    const sp = localStorage.getItem('selectedPlant');
                    if (sp) activePlant = JSON.parse(sp);
                } catch (e) {}

                const merged = {
                    ...call,
                    ...(details || {}),
                    bookNo: resolvedBookNo,
                    setNo: resolvedSetNo,
                    certificateNo: resolvedIcNo,
                    icNo: resolvedIcNo,
                    certificateDate: resolvedIcDate,
                    icDate: resolvedIcDate,
                    drawingNo: resolvedDrawingNo,
                    manufacturerName: (activePlant?.plantName && (!details?.manufacturerName || details?.manufacturerName === '-' || call.plantId === activePlant.plantId))
                        ? activePlant.plantName
                        : (details?.manufacturerName || details?.vendorName || details?.placeOfInspection || call.manufacturerName || call.vendorName || call.companyName || call.plantName || activePlant?.plantName),
                    callNo: call.call_no || call.callNumber || callId,
                    poNo: call.poNo || call.poNumber || details?.poNo || details?.rlyPoSr,
                    consignee: details?.consigneeDetail || call.consignee || call.consigneeDetail,
                    poDate: formatIcDate(details?.poDate || call.poDate),
                    batchesSelected: (details?.batchesSelected && details.batchesSelected.length > 0)
                        ? details.batchesSelected
                        : ((details?.heatDetails && details.heatDetails.length > 0)
                            ? details.heatDetails.map(h => ({
                                batchNo: h.heatNo,
                                castDate: formatIcDate(h.castDate),
                                totalCasted: h.totalCasted !== undefined ? h.totalCasted : (parseInt(h.qtyOffered) || 0),
                                previouslyOffered: h.previouslyOffered || 0,
                                goodSleepers: h.goodSleepers || h.goodCount || parseInt(h.qtyOffered) || 0,
                                badSleepers: h.badSleepers || h.badCount || 0,
                                etNo: h.etNo || '',
                                rejNo: h.rejNo || '',
                                mfNo: h.mfNo || '',
                                normAccepted: h.normAccepted || 0,
                                etAccepted: h.etAccepted || 0,
                                mftAccepted: h.mftAccepted || 0,
                                rejSurf: h.rejSurf || 0,
                                rejDim: h.rejDim || 0,
                                rejOth: h.rejOth !== undefined ? h.rejOth : (Array.isArray(h.badSleepers) ? h.badSleepers.length : (h.badCount || 0)),
                                rejSbt: h.rejSbt || 0,
                                notOffered: h.notOffered || 0
                            }))
                            : ((call.batchesSelected && call.batchesSelected.length > 0)
                                ? call.batchesSelected
                                : []))
                };

                setEnrichedCall(merged);
            } catch (err) {
                console.error('[AnnexuresModal] Error preparing call data:', err);
                if (isMounted) setEnrichedCall(call);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchDetails();

        return () => {
            isMounted = false;
        };
    }, [isOpen, call]);

    if (!isOpen || !call) return null;

    const data = extractAnnexure1Data(enrichedCall || call);

    const handleDownloadPdf = () => {
        setPdfLoading(true);
        try {
            generateAnnexure1PDF(enrichedCall || call, 'ANNEXURE 1 TO IC');
            if (showNotification) showNotification('Annexure 1 to IC PDF downloaded successfully!', 'success');
        } catch (e) {
            console.error('Error downloading Annexure 1 PDF:', e);
            if (showNotification) showNotification('Failed to generate Annexure 1 PDF.', 'error');
        } finally {
            setPdfLoading(false);
        }
    };

    const handlePreviewPdf = () => {
        try {
            const blobUrl = getAnnexure1PDFBlob(enrichedCall || call, 'ANNEXURE 1 TO IC');
            if (blobUrl) {
                window.open(blobUrl, '_blank');
            }
        } catch (e) {
            console.error('Error opening Annexure 1 PDF preview:', e);
            if (showNotification) showNotification('Failed to open PDF preview.', 'error');
        }
    };

    const callNumber = call.call_no || call.callNumber || call.requestId || '-';

    return (
        <div 
            className="modal-overlay" 
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10000,
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px'
            }}
        >
            <div 
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: '1240px',
                    width: '96vw',
                    maxHeight: '94vh',
                    borderRadius: '18px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                    overflow: 'hidden',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* ── Modal Header ── */}
                <div style={{
                    padding: '16px 24px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '38px', height: '38px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#ffffff', fontSize: '18px', boxShadow: '0 2px 4px rgba(109, 40, 217, 0.25)'
                        }}>
                            📑
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Annexures - <span style={{ color: '#4338ca' }}>{callNumber}</span>
                            </h2>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>
                                Inspection Dossiers & Certificate Annexures
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{
                            background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%',
                            width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.2s ease', color: '#64748b', fontSize: '1.2rem',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        title="Close"
                    >×</button>
                </div>

                {/* ── Annexure Card Selection Strip ── */}
                <div style={{
                    padding: '14px 24px',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    overflowX: 'auto'
                }}>
                    <div
                        onClick={() => setActiveSubTab('annexure-1')}
                        style={{
                            padding: '10px 18px',
                            border: activeSubTab === 'annexure-1' ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                            borderRadius: '12px',
                            background: activeSubTab === 'annexure-1' ? '#ffffff' : '#f8fafc',
                            color: activeSubTab === 'annexure-1' ? '#4c1d95' : '#475569',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'all 0.2s ease',
                            boxShadow: activeSubTab === 'annexure-1' ? '0 4px 14px rgba(124, 58, 237, 0.12)' : 'none',
                            minWidth: '240px'
                        }}
                    >
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: activeSubTab === 'annexure-1' ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : '#e2e8f0',
                            color: activeSubTab === 'annexure-1' ? '#ffffff' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '17px',
                            boxShadow: activeSubTab === 'annexure-1' ? '0 2px 5px rgba(124, 58, 237, 0.25)' : 'none',
                            flexShrink: 0
                        }}>
                            📋
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontWeight: '800',
                                fontSize: '13.5px',
                                color: activeSubTab === 'annexure-1' ? '#1e1b4b' : '#334155'
                            }}>
                                Annexure 1 to IC
                            </div>
                            <div style={{
                                fontSize: '11px',
                                color: '#64748b',
                                fontWeight: '500',
                                marginTop: '1px'
                            }}>
                                Offer List Annexure
                            </div>
                        </div>
                        <span style={{
                            fontSize: '10px',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            background: activeSubTab === 'annexure-1' ? '#ede9fe' : '#e2e8f0',
                            color: activeSubTab === 'annexure-1' ? '#7c3aed' : '#64748b',
                            fontWeight: '700'
                        }}>
                            Active
                        </span>
                    </div>
                </div>

                {/* ── Modal Body Content Area ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', backgroundColor: '#f1f5f9' }}>
                    {loading ? (
                        <div style={{ padding: '80px 20px', textAlign: 'center', color: '#64748b' }}>
                            <div style={{
                                width: '40px', height: '40px', border: '3px solid #e2e8f0',
                                borderTopColor: '#7c3aed', borderRadius: '50%',
                                animation: 'spin 1s linear infinite', margin: '0 auto 16px auto'
                            }}></div>
                            <div style={{ fontWeight: '700', fontSize: '15px', color: '#1e293b' }}>Loading Annexure 1 Details...</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>Retrieving IC Certificate and batch information for {callNumber}</div>
                        </div>
                    ) : (
                        <div>
                            {/* Action & Info Toolbar */}
                            <div style={{
                                display: 'flex',
                                justifySelf: 'stretch',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '12px',
                                background: '#ffffff',
                                padding: '14px 18px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                marginBottom: '18px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                                        Annexure 1 to IC
                                    </h3>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                        Offer list used as annexure with official heading: <strong>Annexure 1 to IC</strong>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={handlePreviewPdf}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            background: '#f8fafc',
                                            color: '#334155',
                                            fontWeight: '700',
                                            fontSize: '12.5px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            transition: 'all 0.15s ease'
                                        }}
                                        title="Open PDF preview in a new window"
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                        <span>Print / Preview PDF</span>
                                    </button>
                                    <button
                                        onClick={handleDownloadPdf}
                                        disabled={pdfLoading}
                                        style={{
                                            padding: '8px 18px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                                            color: '#ffffff',
                                            fontWeight: '700',
                                            fontSize: '12.5px',
                                            cursor: pdfLoading ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            boxShadow: '0 2px 4px rgba(109, 40, 217, 0.25)',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                        <span>{pdfLoading ? 'Generating...' : 'Download Annexure 1 PDF'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Document Sheet Display */}
                            {data && (
                                <div style={{
                                    background: '#ffffff',
                                    borderRadius: '10px',
                                    padding: '24px',
                                    border: '1.5px solid #000000',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)',
                                    color: '#000000',
                                    fontFamily: 'Helvetica, Arial, sans-serif'
                                }}>
                                    {/* 1. Header Box (Manufacturer name hidden) */}
                                    <div style={{
                                        border: '1.5px solid #000000',
                                        textAlign: 'center',
                                        marginBottom: '10px'
                                    }}>
                                        {/* Main Heading */}
                                        <div style={{
                                            padding: '10px 12px',
                                            fontSize: '18px',
                                            fontWeight: '900',
                                            letterSpacing: '0.04em',
                                            color: '#000000'
                                        }}>
                                            ANNEXURE 1 TO IC
                                        </div>
                                    </div>

                                    {/* 2. Metadata Box */}
                                    <div style={{
                                        border: '1.5px solid #000000',
                                        marginBottom: '14px',
                                        fontSize: '11px',
                                        fontWeight: '700'
                                    }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr' }}>
                                            {/* Column 1 */}
                                            <div style={{ borderRight: '1px solid #000000' }}>
                                                <div style={{ display: 'flex', borderBottom: '1px solid #000000', padding: '4px 8px' }}>
                                                    <span style={{ width: '130px', color: '#000' }}>Purchase Order No.</span>
                                                    <span style={{ color: '#dc2626' }}>: {data.header.poNo}</span>
                                                </div>
                                                <div style={{ display: 'flex', borderBottom: '1px solid #000000', padding: '4px 8px' }}>
                                                    <span style={{ width: '130px', color: '#000' }}>PO Date</span>
                                                    <span style={{ color: '#dc2626' }}>: {data.header.poDate}</span>
                                                </div>
                                                <div style={{ display: 'flex', borderBottom: '1px solid #000000', padding: '4px 8px' }}>
                                                    <span style={{ width: '130px', color: '#000' }}>Consignee</span>
                                                    <span style={{ color: '#dc2626' }}>: {data.header.consignee}</span>
                                                </div>
                                                <div style={{ display: 'flex', borderBottom: '1px solid #000000', padding: '4px 8px' }}>
                                                    <span style={{ width: '130px', color: '#000' }}>Drawing No.</span>
                                                    <span style={{ color: '#dc2626' }}>: {data.header.drawingNo}</span>
                                                </div>
                                                <div style={{ display: 'flex', borderBottom: '1px solid #000000', padding: '4px 8px' }}>
                                                    <span style={{ width: '130px', color: '#000' }}>Shed-1 Batch No.</span>
                                                    <span style={{ color: '#dc2626' }}>: {data.header.shed1BatchNo}</span>
                                                </div>
                                                <div style={{ display: 'flex', padding: '4px 8px' }}>
                                                    <span style={{ width: '130px', color: '#000' }}>Shed-2 Batch No.</span>
                                                    <span style={{ color: '#dc2626' }}>: {data.header.shed2BatchNo}</span>
                                                </div>
                                            </div>

                                            {/* Column 2 */}
                                            <div>
                                                <div style={{ display: 'flex', borderBottom: '1px solid #000000', padding: '4px 8px' }}>
                                                    <span style={{ width: '90px', color: '#000' }}>&nbsp;</span>
                                                    <span>&nbsp;</span>
                                                </div>
                                                <div style={{ display: 'flex', borderBottom: '1px solid #000000', padding: '4px 8px' }}>
                                                    <span style={{ width: '90px', color: '#000' }}>&nbsp;</span>
                                                    <span>&nbsp;</span>
                                                </div>
                                                <div style={{ display: 'flex', borderBottom: '1px solid #000000', padding: '4px 8px' }}>
                                                    <span style={{ width: '90px', color: '#000' }}>BOOK NO.</span>
                                                    <span style={{ color: '#dc2626' }}>: {data.header.bookNo}</span>
                                                </div>
                                                <div style={{ display: 'flex', borderBottom: '1px solid #000000', padding: '4px 8px' }}>
                                                    <span style={{ width: '90px', color: '#000' }}>SET NO.</span>
                                                    <span style={{ color: '#dc2626' }}>: {data.header.setNo}</span>
                                                </div>
                                                <div style={{ display: 'flex', borderBottom: '1px solid #000000', padding: '4px 8px' }}>
                                                    <span style={{ width: '90px', color: '#000' }}>IC NO.</span>
                                                    <span style={{ color: '#dc2626' }}>: {data.header.icNo}</span>
                                                </div>
                                                <div style={{ display: 'flex', padding: '4px 8px' }}>
                                                    <span style={{ width: '90px', color: '#000' }}>IC DATE.</span>
                                                    <span style={{ color: '#dc2626' }}>: {data.header.icDate}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Batches Table */}
                                    <div style={{ overflowX: 'auto', marginBottom: '14px' }}>
                                        <table style={{
                                            width: '100%',
                                            borderCollapse: 'collapse',
                                            fontSize: '10px',
                                            textAlign: 'center',
                                            border: '1.5px solid #000000'
                                        }}>
                                            <thead>
                                                <tr style={{ background: '#f8fafc', fontWeight: '800' }}>
                                                    <th rowSpan={2} style={{ border: '1px solid #000', padding: '4px 2px', width: '30px' }}>Sl. No.</th>
                                                    <th rowSpan={2} style={{ border: '1px solid #000', padding: '4px', minWidth: '70px' }}>Batch No.</th>
                                                    <th rowSpan={2} style={{ border: '1px solid #000', padding: '4px', minWidth: '75px' }}>Date of Casting</th>
                                                    <th rowSpan={2} style={{ border: '1px solid #000', padding: '4px', width: '45px' }}>Nos. Cast</th>
                                                    <th rowSpan={2} style={{ border: '1px solid #000', padding: '4px', width: '45px' }}>Prev- offrd</th>
                                                    <th rowSpan={2} style={{ border: '1px solid #000', padding: '4px', width: '45px' }}>Now offrd</th>
                                                    <th colSpan={3} style={{ border: '1px solid #000', padding: '4px' }}>Accepted Sleepers</th>
                                                    <th colSpan={4} style={{ border: '1px solid #000', padding: '4px' }}>Rejection</th>
                                                    <th rowSpan={2} style={{ border: '1px solid #000', padding: '4px', width: '45px' }}>Not Offrd</th>
                                                    <th colSpan={3} style={{ border: '1px solid #000', padding: '4px' }}>REMARKS</th>
                                                </tr>
                                                <tr style={{ background: '#f8fafc', fontWeight: '800', fontSize: '9px' }}>
                                                    <th style={{ border: '1px solid #000', padding: '3px', width: '38px' }}>Norm</th>
                                                    <th style={{ border: '1px solid #000', padding: '3px', width: '38px' }}>E.T.</th>
                                                    <th style={{ border: '1px solid #000', padding: '3px', width: '38px' }}>M.F.T</th>
                                                    <th style={{ border: '1px solid #000', padding: '3px', width: '35px' }}>Surf</th>
                                                    <th style={{ border: '1px solid #000', padding: '3px', width: '35px' }}>Dim</th>
                                                    <th style={{ border: '1px solid #000', padding: '3px', width: '35px' }}>Oth</th>
                                                    <th style={{ border: '1px solid #000', padding: '3px', width: '35px' }}>SBT</th>
                                                    <th style={{ border: '1px solid #000', padding: '3px', minWidth: '55px' }}>ET No</th>
                                                    <th style={{ border: '1px solid #000', padding: '3px', minWidth: '100px' }}>Rej No</th>
                                                    <th style={{ border: '1px solid #000', padding: '3px', minWidth: '50px' }}>MF No</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.tableRows.map((row, idx) => (
                                                    <tr key={idx} style={{ fontWeight: '700' }}>
                                                        <td style={{ border: '1px solid #000', padding: '4px 2px', color: '#000' }}>{row[0]}</td>
                                                        <td style={{ border: '1px solid #000', padding: '4px', color: '#dc2626' }}>{row[1]}</td>
                                                        <td style={{ border: '1px solid #000', padding: '4px', color: '#dc2626' }}>{row[2]}</td>
                                                        <td style={{ border: '1px solid #000', padding: '4px', color: '#dc2626' }}>{row[3]}</td>
                                                        <td style={{ border: '1px solid #000', padding: '4px', color: '#dc2626' }}>{row[4]}</td>
                                                        <td style={{ border: '1px solid #000', padding: '4px', color: '#dc2626' }}>{row[5]}</td>
                                                        <td style={{ border: '1px solid #000', padding: '4px', color: '#dc2626' }}>{row[6]}</td>
                                                        <td style={{ border: '1px solid #000', padding: '4px', color: '#dc2626' }}>{row[7]}</td>
                                                        <td style={{ border: '1px solid #000', padding: '4px', color: '#dc2626' }}>{row[8]}</td>
                                                        <td style={{ border: '1px solid #000', padding: '4px', color: '#dc2626' }}>{row[9]}</td>
                                                        <td style={{ border: '1px solid #000', padding: '4px', color: '#dc2626' }}>{row[10]}</td>
                                                        <td style={{ border: '1px solid #000', padding: '4px', color: '#dc2626' }}>{row[11]}</td>
                                                        <td style={{ border: '1px solid #000', padding: '4px', color: '#dc2626' }}>{row[12]}</td>
                                                        <td style={{ border: '1px solid #000', padding: '4px', color: '#dc2626' }}>{row[13]}</td>
                                                        <td style={{ border: '1px solid #000', padding: '4px', color: '#dc2626', fontSize: '9px' }}>{row[14] || '-'}</td>
                                                        <td style={{ border: '1px solid #000', padding: '4px', color: '#dc2626', fontSize: '8.5px', textAlign: 'left' }}>{row[15] || '-'}</td>
                                                        <td style={{ border: '1px solid #000', padding: '4px', color: '#dc2626', fontSize: '9px' }}>{row[16] || '-'}</td>
                                                    </tr>
                                                ))}

                                                {/* Total Row */}
                                                <tr style={{ background: '#f8fafc', fontWeight: '900', color: '#000' }}>
                                                    <td colSpan={3} style={{ border: '1px solid #000', padding: '5px', textAlign: 'left', paddingLeft: '12px' }}>Total</td>
                                                    <td style={{ border: '1px solid #000', padding: '5px' }}>{data.totals.totalCast}</td>
                                                    <td style={{ border: '1px solid #000', padding: '5px' }}>{data.totals.prevOffrd}</td>
                                                    <td style={{ border: '1px solid #000', padding: '5px' }}>{data.totals.nowOffrd}</td>
                                                    <td style={{ border: '1px solid #000', padding: '5px' }}>{data.totals.normAccepted}</td>
                                                    <td style={{ border: '1px solid #000', padding: '5px' }}>{data.totals.etAccepted}</td>
                                                    <td style={{ border: '1px solid #000', padding: '5px' }}>{data.totals.mftAccepted}</td>
                                                    <td style={{ border: '1px solid #000', padding: '5px' }}>{data.totals.surfRej}</td>
                                                    <td style={{ border: '1px solid #000', padding: '5px' }}>{data.totals.dimRej}</td>
                                                    <td style={{ border: '1px solid #000', padding: '5px' }}>{data.totals.othRej}</td>
                                                    <td style={{ border: '1px solid #000', padding: '5px' }}>{data.totals.sbtRej}</td>
                                                    <td style={{ border: '1px solid #000', padding: '5px' }}>{data.totals.notOffrd}</td>
                                                    <td colSpan={3} style={{ border: '1px solid #000', padding: '5px' }}></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* 4. Footer Box */}
                                    <div style={{
                                        border: '1.5px solid #000000',
                                        padding: '8px 10px',
                                        fontSize: '10.5px',
                                        fontWeight: '700'
                                    }}>
                                        <div style={{ marginBottom: '6px' }}>
                                            <span style={{ color: '#000' }}>Abbreviation: </span>
                                            <span style={{ fontSize: '9px', fontWeight: '600', color: '#334155' }}>
                                                -ET= Epoxy Treated, MF= Moment of Failure, RD= Reject by Damage, RC=Reject By Crack, RG=Reject By Gauge, SD- Surface Defect, RSL- Rail Seat loose, RST- Rail Seat Tight, RSD- Rail Seat Defect, TGL- Toe Gap Loose, TGT- Toe Gap Tight, IT- Insert Tilt, IO- Insert Out, IS-Insert Sink, OGL- Outer Gauge Loose, OGT- Outer Gauge Tight, EB- End Broken, ED- End Damage, NFTC- Not Fit For Track Circuit, SHC- Surface Honey Combe, EHC- End Honey Comb.
                                            </span>
                                        </div>

                                        <div style={{ borderTop: '1px solid #000', paddingTop: '6px', marginBottom: '6px' }}>
                                            <span style={{ color: '#000' }}>Rejection Sleepers: </span>
                                            <span style={{ color: '#dc2626', fontWeight: '800' }}>{data.rejSummaryText}</span>
                                        </div>

                                        <div style={{ borderTop: '1px solid #000', paddingTop: '6px', marginBottom: '6px' }}>
                                            <span style={{ color: '#000' }}>Remarks : </span>
                                            <span style={{ color: '#dc2626', fontWeight: '800' }}>Stores offered conforms to governing specification.</span>
                                        </div>

                                        <div style={{ borderTop: '1px solid #000', paddingTop: '6px' }}>
                                            <span style={{ color: '#000' }}>Inspecting Engineer: </span>
                                            <span style={{ color: '#dc2626', fontWeight: '800' }}>{data.ieName}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnnexuresModal;
