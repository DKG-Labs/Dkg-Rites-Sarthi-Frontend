import React from 'react';
import './RailPadSummary.css';

const RailPadSummary = ({
    summaryData = {},
    inspectionCallStatus = [],
    inspectionDetails = [],
    icIssuedData = {},
    totalCallsData = {},
    onPoIssuedClick,
    onInspectionCallClick,
    onTotalCallsClick,
    onIcIssuedClick
}) => {
    // Real data from backend; fallback to 0 when not yet loaded
    const data = {
        totalPoIssued: summaryData.railPadPoIssued ?? 0,
        totalPoQtyOnOrder: {
            nos: summaryData.railPadPoQuantityNos ?? 0,
            set: summaryData.railPadPoQuantitySet ?? 0
        },
        totalPoQtyAccepted: {
            nos: summaryData.totalAcceptedNos ?? 0,
            set: summaryData.totalAcceptedSet ?? 0
        },
        avgProductionPerDay: summaryData.railPadAvgProductionPerDay ?? summaryData.avgProductionPerDay ?? 0,
        rejectedInProcess: summaryData.rejectedInProcess ?? 0,
        rejectedInFinal: summaryData.rejectedInFinal ?? 0,
        rejectionRate: summaryData.railPadRejectionPercentage ?? 0
    };

    // Extract Inspection Details (Row 3)
    const processDetails = (inspectionDetails || []).find(x => x.name === 'Process') || {};
    const finalDetails = (inspectionDetails || []).find(x => x.name === 'Final') || {};

    const processAcceptedNos = processDetails.acceptedNos !== undefined ? processDetails.acceptedNos : (processDetails.accepted || 0);
    const processRejectedNos = summaryData.rejectedInProcess !== undefined && summaryData.rejectedInProcess !== null
        ? summaryData.rejectedInProcess
        : (processDetails.rejectedNos !== undefined ? processDetails.rejectedNos : (processDetails.rejected || 0));

    const finalAcceptedNos = finalDetails.acceptedNos !== undefined ? finalDetails.acceptedNos : (finalDetails.accepted || 0);
    const finalAcceptedSet = finalDetails.acceptedSet || 0;
    const finalRejectedNos = summaryData.rejectedInFinal !== undefined && summaryData.rejectedInFinal !== null
        ? summaryData.rejectedInFinal
        : (finalDetails.rejectedNos !== undefined ? finalDetails.rejectedNos : (finalDetails.rejected || 0));
    const finalRejectedSet = finalDetails.rejectedSet || 0;

    // Row 4 calculations (Production & Rejection)
    const avgProductionPerDay = summaryData.railPadAvgProductionPerDay ?? 0;
    const totalProcessProduced = summaryData.totalProcessProduced ?? 0;

    // Process Rejection %
    const processOfferedTotal = (processDetails.accepted || 0) + (processDetails.rejected || 0);
    const processRejectionPercentage = totalProcessProduced > 0 
        ? ((processRejectedNos / totalProcessProduced) * 100).toFixed(2) 
        : (processOfferedTotal > 0 ? ((processRejectedNos / processOfferedTotal) * 100).toFixed(2) : '0.00');

    // Final Rejection %
    const finalOfferedTotal = (finalDetails.accepted || 0) + (finalDetails.rejected || 0);
    const finalRejectionPercentage = finalOfferedTotal > 0 
        ? ((finalRejectedNos / finalOfferedTotal) * 100).toFixed(2) 
        : '0.00';

    // Overall Rejection % = (Process Rejection + Final Rejection) / Total Process Produced
    const overallRejectionPercentage = totalProcessProduced > 0
        ? (((processRejectedNos + finalRejectedNos) / totalProcessProduced) * 100).toFixed(2)
        : (summaryData.railPadRejectionPercentage !== undefined && summaryData.railPadRejectionPercentage !== null
            ? String(summaryData.railPadRejectionPercentage)
            : '0.00');

    // Extract stage-wise data from inspectionCallStatus prop
    const totalItem = inspectionCallStatus.find(x => x.name === 'Total' || x.category === 'Total');
    const processItem = inspectionCallStatus.find(x => x.name === 'Process' || x.category === 'Process');
    const finalItem = inspectionCallStatus.find(x => x.name === 'Final' || x.category === 'Final');

    const totalOpen = totalCallsData?.totalOpenCalls ?? ((totalItem?.under || 0) + (totalItem?.pending || 0));
    const totalUnder = totalCallsData?.totalUnderInspectionCalls ?? (totalItem?.under || 0);
    const totalPending = totalCallsData?.totalPendingCalls ?? (totalItem?.pending || 0);

    const processUnder = processItem?.under || 0;
    const processPending = processItem?.pending || 0;

    const finalUnder = finalItem?.under || 0;
    const finalPending = finalItem?.pending || 0;

    const icIssuedTotal = icIssuedData?.total ?? 0;

    return (
        <div className="railpad-summary-container fade-in">
            {/* KPI Cards Row 1 */}
            <div className="g3 mb">
                <div
                    className="prof-card card-dark-green"
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    onClick={onPoIssuedClick}
                >
                    <div className="kpi-lbl">Total PO Issued</div>
                    <div className="kpi-val">{data.totalPoIssued}</div>
                    <div className="kpi-sub">All Vendors (IREPS)</div>
                </div>
                <div className="prof-card card-ocean" style={{ textAlign: 'center' }}>
                    <div className="kpi-lbl">Total PO Qty on Order</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px' }}>
                        <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '8px' }}>
                            <div className="kpi-val" style={{ fontSize: '20px' }}>{data.totalPoQtyOnOrder.nos}</div>
                            <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>Nos.</div>
                        </div>
                        <div style={{ paddingLeft: '8px' }}>
                            <div className="kpi-val" style={{ fontSize: '20px' }}>{data.totalPoQtyOnOrder.set}</div>
                            <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>Set</div>
                        </div>
                    </div>
                </div>
                <div className="prof-card card-indigo" style={{ textAlign: 'center' }}>
                    <div className="kpi-lbl">Final Accepted Quantity</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px' }}>
                        <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '8px' }}>
                            <div className="kpi-val" style={{ fontSize: '20px' }}>{data.totalPoQtyAccepted.nos}</div>
                            <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>Nos.</div>
                        </div>
                        <div style={{ paddingLeft: '8px' }}>
                            <div className="kpi-val" style={{ fontSize: '20px' }}>{data.totalPoQtyAccepted.set}</div>
                            <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>Set</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards Row 2: Stagewise Inspection Call Status */}
            <div className="sec-title-flex" style={{ marginBottom: '12px', marginTop: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#166534' }}>Stagewise Inspection Call Status</span>
            </div>
            <div className="g4 mb">
                {/* 1. TOTAL CALLS */}
                <div className="prof-card" style={{ padding: '15px', borderLeft: '4px solid #3b82f6', background: '#eff6ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Total Calls</span>
                        <span className="prof-badge" style={{ background: '#bfdbfe', color: '#1e3a8a', fontSize: '10px' }}>Nos.</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', textAlign: 'center' }}>
                        <div onClick={() => onTotalCallsClick && onTotalCallsClick('Open')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.7)', padding: '8px 4px', borderRadius: '6px', transition: 'all 0.2s', flex: 1 }} onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.7)'} title="Click to view Open calls">
                            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', lineHeight: '1.2', marginBottom: '4px' }}>TOTAL<br />OPEN</span>
                            <span style={{ fontSize: '18px', fontWeight: '800', color: '#3b82f6' }}>{totalOpen}</span>
                        </div>
                        <div onClick={() => onTotalCallsClick && onTotalCallsClick('Under Inspection')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.7)', padding: '8px 4px', borderRadius: '6px', transition: 'all 0.2s', flex: 1 }} onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.7)'} title="Click to view Under Inspection calls">
                            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', lineHeight: '1.2', marginBottom: '4px' }}>UNDER<br />INSPECTION</span>
                            <span style={{ fontSize: '18px', fontWeight: '800', color: '#f59e0b' }}>{totalUnder}</span>
                        </div>
                        <div onClick={() => onTotalCallsClick && onTotalCallsClick('Pending')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.7)', padding: '8px 4px', borderRadius: '6px', transition: 'all 0.2s', flex: 1 }} onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.7)'} title="Click to view Pending calls">
                            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', lineHeight: '1.2', marginBottom: '4px' }}>PENDING<br />CALLS</span>
                            <span style={{ fontSize: '18px', fontWeight: '800', color: '#ef4444' }}>{totalPending}</span>
                        </div>
                    </div>
                </div>

                {/* 2. PROCESS */}
                <div className="prof-card" style={{ padding: '15px', borderLeft: '4px solid #f59e0b', background: '#fff7ed' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Process</span>
                        <span className="prof-badge" style={{ background: '#f8fafc', color: '#64748b', fontSize: '10px' }}>CALLS</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div
                            style={{ cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'all 0.2s' }}
                            onClick={() => onInspectionCallClick && onInspectionCallClick('Process', 'Under Inspection')}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            title="Click to view Under Inspection calls"
                        >
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>UNDER INSPECTION</div>
                            <div style={{ fontSize: '28px', fontWeight: '800', color: '#f59e0b' }}>{processUnder}</div>
                        </div>
                        <div
                            style={{ textAlign: 'right', cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'all 0.2s' }}
                            onClick={() => onInspectionCallClick && onInspectionCallClick('Process', 'Pending')}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            title="Click to view Pending calls"
                        >
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>PENDING</div>
                            <div style={{ fontSize: '28px', fontWeight: '800', color: '#ef4444' }}>{processPending}</div>
                        </div>
                    </div>
                </div>

                {/* 3. FINAL PRODUCT */}
                <div className="prof-card" style={{ padding: '15px', borderLeft: '4px solid #ef4444', background: '#fef2f2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Final Product</span>
                        <span className="prof-badge" style={{ background: '#f8fafc', color: '#64748b', fontSize: '10px' }}>CALLS</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div
                            style={{ cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'all 0.2s' }}
                            onClick={() => onInspectionCallClick && onInspectionCallClick('Final', 'Under Inspection')}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            title="Click to view Under Inspection calls"
                        >
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>UNDER INSPECTION</div>
                            <div style={{ fontSize: '28px', fontWeight: '800', color: '#f59e0b' }}>{finalUnder}</div>
                        </div>
                        <div
                            style={{ textAlign: 'right', cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'all 0.2s' }}
                            onClick={() => onInspectionCallClick && onInspectionCallClick('Final', 'Pending')}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            title="Click to view Pending calls"
                        >
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>PENDING</div>
                            <div style={{ fontSize: '28px', fontWeight: '800', color: '#ef4444' }}>{finalPending}</div>
                        </div>
                    </div>
                </div>

                {/* 4. IC ISSUED */}
                <div className="prof-card card-gold"
                    style={{ textAlign: 'center', cursor: 'pointer', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                    onClick={onIcIssuedClick}
                    title="Click to view stage-wise breakdown"
                >
                    <div className="kpi-lbl">IC Issued</div>
                    <div style={{ marginTop: '12px' }}>
                        <div className="kpi-val" style={{ fontSize: '32px' }}>{icIssuedTotal}</div>
                        <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px' }}>Total Calls</div>
                    </div>
                </div>
            </div>

            {/* KPI Cards Row 3: Inspection Details */}
            <div className="sec-title-flex" style={{ marginBottom: '12px', marginTop: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#166534' }}>Inspection Details</span>
            </div>
            <div className="g2 mb" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* 1. PROCESS */}
                <div className="prof-card" style={{ padding: '15px', borderLeft: '4px solid #7c3aed', background: '#f5f3ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Process</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {/* Accepted column */}
                        <div style={{ background: 'rgba(34, 197, 94, 0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: '#15803d', fontWeight: '700', marginBottom: '4px' }}>ACCEPTED (Nos.)</div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: '#22c55e' }}>{processAcceptedNos}</div>
                        </div>
                        {/* Rejected column */}
                        <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: '#b91c1c', fontWeight: '700', marginBottom: '4px' }}>REJECTED (Nos.)</div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444' }}>{processRejectedNos}</div>
                        </div>
                    </div>
                </div>

                {/* 2. FINAL PRODUCT */}
                <div className="prof-card" style={{ padding: '15px', borderLeft: '4px solid #db2777', background: '#fff1f2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Final Product</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {/* Accepted column */}
                        <div style={{ background: 'rgba(34, 197, 94, 0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                            <div style={{ fontSize: '11px', color: '#15803d', fontWeight: '700', marginBottom: '6px', textAlign: 'center' }}>ACCEPTED</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', textAlign: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#22c55e' }}>{finalAcceptedNos}</div>
                                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Nos.</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#22c55e' }}>{finalAcceptedSet}</div>
                                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Sets</div>
                                </div>
                            </div>
                        </div>
                        {/* Rejected column */}
                        <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <div style={{ fontSize: '11px', color: '#b91c1c', fontWeight: '700', marginBottom: '6px', textAlign: 'center' }}>REJECTED</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', textAlign: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#ef4444' }}>{finalRejectedNos}</div>
                                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Nos.</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#ef4444' }}>{finalRejectedSet}</div>
                                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Sets</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards Row 4: Production & Rejection */}
            <div className="sec-title-flex" style={{ marginBottom: '12px', marginTop: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#166534' }}>Production & Rejection</span>
            </div>
            <div className="g4 mb" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {/* 1. Avg Production Per Day */}
                <div className="prof-card" style={{ textAlign: 'center', padding: '16px', borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Avg Production / Day</div>
                    <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e3a8a' }}>{avgProductionPerDay}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Nos. / Day</div>
                    </div>
                </div>

                {/* 2. Process Rejection */}
                <div className="prof-card" style={{ textAlign: 'center', padding: '16px', borderLeft: '4px solid #ef4444' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Process Rejection</div>
                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#dc2626' }}>{processRejectedNos}</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>Nos.</div>
                        </div>
                        <div style={{ borderLeft: '1px solid #e2e8f0', height: '24px' }}></div>
                        <div>
                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#dc2626' }}>{processRejectionPercentage}%</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>Percentage</div>
                        </div>
                    </div>
                </div>

                {/* 3. Final Rejection */}
                <div className="prof-card" style={{ textAlign: 'center', padding: '16px', borderLeft: '4px solid #f97316' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Final Rejection</div>
                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#c2410c' }}>{finalRejectedNos}</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>Nos.</div>
                        </div>
                        <div style={{ borderLeft: '1px solid #e2e8f0', height: '24px' }}></div>
                        <div>
                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#c2410c' }}>{finalRejectionPercentage}%</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>Percentage</div>
                        </div>
                    </div>
                </div>

                {/* 4. Overall Rejection */}
                <div className="prof-card" style={{ textAlign: 'center', padding: '16px', borderLeft: '4px solid #8b5cf6' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Overall Rejection</div>
                    <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#6d28d9' }}>{overallRejectionPercentage}%</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Total Rejection Rate</div>
                    </div>
                </div>
            </div>

            {/* Footer note */}
            <div className="railpad-footer-note" style={{ textAlign: 'center', marginTop: '2rem', color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>
                * Data synchronized with IREPS and RITES Inspection systems.
            </div>
        </div>
    );
};

export default RailPadSummary;
