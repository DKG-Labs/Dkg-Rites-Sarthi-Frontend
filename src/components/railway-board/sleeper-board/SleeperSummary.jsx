import React, { useState, useEffect } from 'react';
import './SleeperSummary.css';
import reportService from '../../../services/reportService';

let cachedSleeperSummary = null;
let lastRefreshTick_SleeperSummary = -1;

const extractNumber = (val) => {
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (val && typeof val === 'object') {
        if (typeof val.responseData === 'number') return val.responseData;
        if (typeof val.data === 'number') return val.data;
        if (typeof val.count === 'number') return val.count;
    }
    const num = Number(val);
    return isNaN(num) ? 0 : num;
};

const SleeperSummary = ({
    summaryData = {},
    inspectionCallStatus = [],
    inspectionDetails = [],
    icIssuedData = {},
    totalCallsData = {},
    onPoIssuedClick,
    onInspectionCallClick,
    onTotalCallsClick,
    onIcIssuedClick,
    refreshTick,
    filterApplied = false,
    vendor = '',
    zone = '',
    plantId = '',
    companyName = '',
    filterStartDate = '',
    filterEndDate = '',
    filterMode = 'zonalwise',
    filterData = null,
    isDashboardLoading = false
}) => {
    const [rejectedInProcess, setRejectedInProcess] = useState(0);
    const [rejectedInFinal, setRejectedInFinal] = useState(0);
    const [rejectionPercentage, setRejectionPercentage] = useState(0);
    const [pendingCalls, setPendingCalls] = useState(0);
    const [underInspectionCalls, setUnderInspectionCalls] = useState(0);
    const [totalProduction, setTotalProduction] = useState(0);
    const [sleeperIcIssued, setSleeperIcIssued] = useState(0);

    useEffect(() => {
        if (filterData) {
            setRejectedInProcess(extractNumber(filterData.rejectedInProcess));
            setRejectedInFinal(extractNumber(filterData.rejectedInFinal));
            setRejectionPercentage(extractNumber(filterData.rejectionPercentage));
            setPendingCalls(extractNumber(filterData.pendingCalls));
            setUnderInspectionCalls(extractNumber(filterData.underInspectionCalls));
            setTotalProduction(extractNumber(filterData.totalProduction));
            setSleeperIcIssued(extractNumber(filterData.sleeperIcIssued));
            return;
        }

        const fetchCounts = async () => {
            if (cachedSleeperSummary && lastRefreshTick_SleeperSummary === refreshTick && !filterApplied) {
                setRejectedInProcess(cachedSleeperSummary.rejectedInProcess);
                setRejectedInFinal(cachedSleeperSummary.rejectedInFinal);
                setRejectionPercentage(cachedSleeperSummary.rejectionPercentage);
                setPendingCalls(cachedSleeperSummary.pendingCalls);
                setUnderInspectionCalls(cachedSleeperSummary.underInspectionCalls);
                setTotalProduction(cachedSleeperSummary.totalProduction || 0);
                setSleeperIcIssued(cachedSleeperSummary.sleeperIcIssued || 0);
                return;
            }

            try {
                // Fetch Demoulding Rejection
                const demouldingRes = await reportService.getDemouldingRejectedCount();
                const rejProcess = extractNumber(demouldingRes?.responseData !== undefined ? demouldingRes.responseData : demouldingRes);
                setRejectedInProcess(rejProcess);

                // Fetch Final Inspection Rejection
                const finalRes = await reportService.getFinalRejectedCount();
                const rejFinal = extractNumber(finalRes?.responseData !== undefined ? finalRes.responseData : finalRes);
                setRejectedInFinal(rejFinal);

                // Fetch Rejection Percentage
                const rejectionRes = await reportService.getRejectionPercentage();
                const rawPct = rejectionRes?.responseData !== undefined ? rejectionRes.responseData : rejectionRes;
                const rejPct = extractNumber(rawPct);
                setRejectionPercentage(rejPct);

                // Fetch Final Inspection Call Status Counts
                const callStatusRes = await reportService.getFinalInspectionCallStatusCounts();
                const callStatusData = (callStatusRes?.responseData && typeof callStatusRes.responseData === 'object')
                    ? callStatusRes.responseData
                    : (callStatusRes && typeof callStatusRes === 'object' && !callStatusRes.responseStatus ? callStatusRes : {});

                const pendCalls = extractNumber(callStatusData.pending);
                const underInspCalls = extractNumber(callStatusData.underInspection);
                
                setPendingCalls(pendCalls);
                setUnderInspectionCalls(underInspCalls);

                if (!filterApplied) {
                    cachedSleeperSummary = {
                        rejectedInProcess: rejProcess,
                        rejectedInFinal: rejFinal,
                        rejectionPercentage: rejPct,
                        pendingCalls: pendCalls,
                        underInspectionCalls: underInspCalls,
                        totalProduction: 0,
                        sleeperIcIssued: 0
                    };
                    lastRefreshTick_SleeperSummary = refreshTick;
                }

            } catch (error) {
                console.error("Error fetching sleeper rejection metrics:", error);
            }
        };
        fetchCounts();
    }, [refreshTick, filterData, filterApplied]);

    const actualSummary = (summaryData?.responseData && typeof summaryData.responseData === 'object') 
        ? summaryData.responseData 
        : (summaryData || {});

    // Sleeper PO Data (strictly PSC Mainline Sleeper from po_header / po_item)
    const totalPoIssued = extractNumber(actualSummary.sleeperPoIssued ?? 0);
    const totalPoQtyNos = extractNumber(actualSummary.sleeperPoQuantityNos ?? 0);
    const totalPoQtySet = extractNumber(actualSummary.sleeperPoQuantitySet ?? 0);

    // Sleeper Production from production_declaration table
    const prodTotal = totalProduction > 0 ? totalProduction : extractNumber(actualSummary.sleeperTotalProduction ?? 0);

    // Final Accepted Quantity (Total Casted - Final Rejected)
    const finalAcceptedNos = prodTotal > 0 ? Math.max(0, prodTotal - rejectedInFinal) : 0;
    const finalAcceptedSet = 0;

    // Process Accepted (Nos) (Total Casted - Demoulding Rejected)
    const processAcceptedNos = prodTotal > 0 ? Math.max(0, prodTotal - rejectedInProcess) : 0;
    const processRejectedNos = rejectedInProcess;

    const finalRejectedNos = rejectedInFinal;
    const finalRejectedSet = 0;

    // Production & Rejections
    const avgProductionPerDay = extractNumber(actualSummary.sleeperAvgProductionPerDay ?? (prodTotal > 0 ? Math.round(prodTotal / 30) : 0));
    const processRejectionPercentage = prodTotal > 0
        ? ((processRejectedNos / prodTotal) * 100).toFixed(2)
        : '0.00';
    const finalRejectionPercentage = prodTotal > 0
        ? ((finalRejectedNos / prodTotal) * 100).toFixed(2)
        : '0.00';
    const overallRejectionPercentage = (Number.isFinite(rejectionPercentage) ? rejectionPercentage : 0).toFixed(2);

    // Stage-wise Call Status (Sleeper Workflow 2: Final Call)
    const totalUnder = underInspectionCalls;
    const totalPending = pendingCalls;
    const totalOpen = totalUnder + totalPending;

    // IC Issued for Sleeper
    const icIssuedFromData = extractNumber(actualSummary.sleeperIcIssued ?? (icIssuedData?.total ?? icIssuedData?.finalCount ?? 0));
    const icIssuedTotal = sleeperIcIssued > 0 ? sleeperIcIssued : icIssuedFromData;

    return (
        <div className="sleeper-summary-container fade-in">
            {filterApplied && (
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '16px'
                }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                    <span>
                        Filtered: {(vendor || companyName) ? `Vendor: ${vendor || companyName} ` : ''}{(zone || plantId) ? `• Zone: ${zone || plantId} ` : ''}
                        {filterStartDate && filterEndDate ? `(${filterStartDate} to ${filterEndDate})` : ''}
                    </span>
                </div>
            )}

            {/* KPI Cards Row 1: Top Overview */}
            <div className="g3 mb">
                <div
                    className="prof-card card-dark-green"
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    onClick={onPoIssuedClick}
                >
                    <div className="kpi-lbl">Total PO Issued</div>
                    <div className="kpi-val">{totalPoIssued}</div>
                    <div className="kpi-sub">All Vendors (IREPS)</div>
                </div>
                <div className="prof-card card-ocean" style={{ textAlign: 'center' }}>
                    <div className="kpi-lbl">Total PO Qty on Order</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px' }}>
                        <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '8px' }}>
                            <div className="kpi-val" style={{ fontSize: '20px' }}>{totalPoQtyNos}</div>
                            <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>Nos.</div>
                        </div>
                        <div style={{ paddingLeft: '8px' }}>
                            <div className="kpi-val" style={{ fontSize: '20px' }}>{totalPoQtySet}</div>
                            <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>Set</div>
                        </div>
                    </div>
                </div>
                <div className="prof-card card-indigo" style={{ textAlign: 'center' }}>
                    <div className="kpi-lbl">Final Accepted Quantity</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px' }}>
                        <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '8px' }}>
                            <div className="kpi-val" style={{ fontSize: '20px' }}>{finalAcceptedNos}</div>
                            <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>Nos.</div>
                        </div>
                        <div style={{ paddingLeft: '8px' }}>
                            <div className="kpi-val" style={{ fontSize: '20px' }}>{finalAcceptedSet}</div>
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

                {/* 2. FINAL PRODUCT / FINAL CALL (Span 2) */}
                <div className="prof-card" style={{ padding: '15px', borderLeft: '4px solid #ef4444', background: '#fef2f2', gridColumn: 'span 2' }}>
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
                            <div style={{ fontSize: '28px', fontWeight: '800', color: '#f59e0b' }}>{underInspectionCalls}</div>
                        </div>
                        <div
                            style={{ textAlign: 'right', cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'all 0.2s' }}
                            onClick={() => onInspectionCallClick && onInspectionCallClick('Final', 'Pending')}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            title="Click to view Pending calls"
                        >
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>PENDING</div>
                            <div style={{ fontSize: '28px', fontWeight: '800', color: '#ef4444' }}>{pendingCalls}</div>
                        </div>
                    </div>
                </div>

                {/* 3. IC ISSUED */}
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
                {/* 1. PROCESS (DEMOULDING) */}
                <div className="prof-card" style={{ padding: '15px', borderLeft: '4px solid #7c3aed', background: '#f5f3ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Process (Demoulding)</span>
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
            <div className="sleeper-footer-note" style={{ textAlign: 'center', marginTop: '2rem', color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>
                * Data synchronized with IREPS and RITES Inspection systems.
            </div>
        </div>
    );
};

export default SleeperSummary;
