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

const SleeperSummary = ({ summaryData = {}, onPoIssuedClick, refreshTick }) => {
    const [rejectedInProcess, setRejectedInProcess] = useState(0);
    const [rejectedInFinal, setRejectedInFinal] = useState(0);
    const [rejectionPercentage, setRejectionPercentage] = useState(0);
    const [pendingCalls, setPendingCalls] = useState(0);
    const [underInspectionCalls, setUnderInspectionCalls] = useState(0);

    useEffect(() => {
        const fetchCounts = async () => {
            if (cachedSleeperSummary && lastRefreshTick_SleeperSummary === refreshTick) {
                setRejectedInProcess(cachedSleeperSummary.rejectedInProcess);
                setRejectedInFinal(cachedSleeperSummary.rejectedInFinal);
                setRejectionPercentage(cachedSleeperSummary.rejectionPercentage);
                setPendingCalls(cachedSleeperSummary.pendingCalls);
                setUnderInspectionCalls(cachedSleeperSummary.underInspectionCalls);
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

                // Store in cache
                cachedSleeperSummary = {
                    rejectedInProcess: rejProcess,
                    rejectedInFinal: rejFinal,
                    rejectionPercentage: rejPct,
                    pendingCalls: pendCalls,
                    underInspectionCalls: underInspCalls
                };
                lastRefreshTick_SleeperSummary = refreshTick;

            } catch (error) {
                console.error("Error fetching sleeper rejection metrics:", error);
            }
        };
        fetchCounts();
    }, [refreshTick]);

    const actualSummary = (summaryData?.responseData && typeof summaryData.responseData === 'object') 
        ? summaryData.responseData 
        : (summaryData || {});

    // Data based on the provided requirements
    const data = {
        poIssued: extractNumber(actualSummary.sleeperPoIssued),
        poQuantity: {
            nos: extractNumber(actualSummary.sleeperPoQuantityNos),
            set: extractNumber(actualSummary.sleeperPoQuantitySet),
            rmt: 0
        },
        finalInspectionQty: {
            nos: extractNumber(actualSummary.finalInspectionQuantity),
            set: extractNumber(actualSummary.totalAcceptedSet),
            rmt: 0
        },
        newSleepersInPipeline: extractNumber(actualSummary.newSleepersInPipeline),
        sleepersRejectedInProcess: extractNumber(rejectedInProcess),
        sleepersRejectedInFinal: extractNumber(rejectedInFinal),
        rejectionPercentage: (Number.isFinite(rejectionPercentage) ? rejectionPercentage : 0).toFixed(2)
    };

    return (
        <div className="sleeper-summary-container fade-in">
            {/* KPI Cards Row 1 */}
            <div className="g3 mb">
                <div className="prof-card card-dark-green" 
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    onClick={onPoIssuedClick}
                >
                    <div className="kpi-lbl">PO Issued</div>
                    <div className="kpi-val">{data.poIssued}</div>
                    <div className="kpi-sub">Sum of all POs</div>
                </div>
                <div className="prof-card card-ocean" style={{ textAlign: 'center' }}>
                    <div className="kpi-lbl">PO Quantity</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '4px' }}>
                        <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '8px' }}>
                            <div className="kpi-val" style={{ fontSize: '13px' }}>{data.poQuantity.nos}</div>
                            <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>Nos.</div>
                        </div>
                        <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)', paddingX: '8px' }}>
                            <div className="kpi-val" style={{ fontSize: '13px' }}>{data.poQuantity.set}</div>
                            <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>Set</div>
                        </div>
                        <div style={{ paddingLeft: '8px' }}>
                            <div className="kpi-val" style={{ fontSize: '13px' }}>{data.poQuantity.rmt}</div>
                            <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>RMT</div>
                        </div>
                    </div>
                </div>
                <div className="prof-card card-indigo" style={{ textAlign: 'center' }}>
                    <div className="kpi-lbl">Final Inspection Quantity</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '4px' }}>
                        <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '8px' }}>
                            <div className="kpi-val" style={{ fontSize: '13px' }}>{data.finalInspectionQty.nos}</div>
                            <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>Nos.</div>
                        </div>
                        <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)', paddingX: '8px' }}>
                            <div className="kpi-val" style={{ fontSize: '13px' }}>{data.finalInspectionQty.set}</div>
                            <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>Set</div>
                        </div>
                        <div style={{ paddingLeft: '8px' }}>
                            <div className="kpi-val" style={{ fontSize: '13px' }}>{data.finalInspectionQty.rmt}</div>
                            <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>RMT</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards Row 2 */}
            <div className="g3 mb">
                <div className="prof-card card-mint" style={{ textAlign: 'center' }}>
                    <div className="kpi-lbl">Sleepers Rejected in Process</div>
                    <div className="kpi-val">{data.sleepersRejectedInProcess}</div>
                    <div className="kpi-sub">Rejected in demoulding</div>
                </div>
                <div className="prof-card card-ruby" style={{ textAlign: 'center' }}>
                    <div className="kpi-lbl">Sleepers Rejected in Final</div>
                    <div className="kpi-val">{data.sleepersRejectedInFinal}</div>
                    <div className="kpi-sub">Final Inspection + Water Cube + MR</div>
                </div>
                <div className="prof-card card-gold" style={{ textAlign: 'center' }}>
                    <div className="kpi-lbl">Rejection Percentage</div>
                    <div className="kpi-val">{data.rejectionPercentage}%</div>
                    <div className="prof-prog">
                        <div className="prof-prog-f" style={{ width: `${Math.min(100, data.rejectionPercentage * 10)}%`, background: '#eab308' }}></div>
                    </div>
                    <div className="kpi-sub">(Process + Final) / Total Manufactured</div>
                </div>
            </div>

            {/* KPI Cards Row 3 */}
            <div className="g2 mb">
                <div className="prof-card card-amber" style={{ textAlign: 'center' }}>
                    <div className="kpi-lbl">Final Inspection Call Status (Pending)</div>
                    <div className="kpi-val">{pendingCalls}</div>
                    <div className="kpi-sub">Calls awaiting inspection</div>
                </div>
                <div className="prof-card card-blue" style={{ textAlign: 'center' }}>
                    <div className="kpi-lbl">Final Inspection Call Status (Under Inspection)</div>
                    <div className="kpi-val">{underInspectionCalls}</div>
                    <div className="kpi-sub">Calls currently being inspected</div>
                </div>
            </div>

            <div className="sleeper-footer-note" style={{ textAlign: 'center', marginTop: '2rem', color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>
                * All quantities are tracked in Nos., Set, and RMT as per standard measurement units.
            </div>
        </div>
    );
};

export default SleeperSummary;
