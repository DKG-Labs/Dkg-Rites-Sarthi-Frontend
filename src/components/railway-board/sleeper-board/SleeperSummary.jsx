import React from 'react';
import './SleeperSummary.css';

const SleeperSummary = ({ summaryData = {} }) => {
    // Mock data based on the provided requirements
    const data = {
        poIssued: summaryData.poIssued || 124,
        poQuantity: {
            nos: summaryData.poQuantityNos || 850000,
            set: summaryData.poQuantitySet || 0,
            rmt: summaryData.poQuantityRmt || 0
        },
        finalInspectionQty: {
            nos: summaryData.finalInspectionQtyNos || 125000,
            set: 0,
            rmt: 0
        },
        newSleepersInPipeline: summaryData.newSleepersInPipeline || 45000,
        sleepersRejectedInProcess: summaryData.sleepersRejectedInProcess || 1200,
        sleepersRejectedInFinal: summaryData.sleepersRejectedInFinal || 850,
        rejectionPercentage: summaryData.rejectionPercentage || 1.64
    };

    return (
        <div className="sleeper-summary-container fade-in">
            {/* KPI Cards Row 1 */}
            <div className="g3 mb">
                <div className="prof-card card-dark-green" style={{ textAlign: 'center' }}>
                    <div className="kpi-lbl">PO Issued</div>
                    <div className="kpi-val">{data.poIssued.toLocaleString()}</div>
                    <div className="kpi-sub">Sum of all POs</div>
                </div>
                <div className="prof-card card-ocean" style={{ textAlign: 'center' }}>
                    <div className="kpi-lbl">PO Quantity</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '4px' }}>
                        <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '4px' }}>
                            <div className="kpi-val" style={{ fontSize: '22px' }}>{data.poQuantity.nos.toLocaleString()}</div>
                            <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>Nos.</div>
                        </div>
                        <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)', paddingX: '4px' }}>
                            <div className="kpi-val" style={{ fontSize: '22px' }}>{data.poQuantity.set.toLocaleString()}</div>
                            <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>Set</div>
                        </div>
                        <div style={{ paddingLeft: '4px' }}>
                            <div className="kpi-val" style={{ fontSize: '22px' }}>{data.poQuantity.rmt.toLocaleString()}</div>
                            <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>RMT</div>
                        </div>
                    </div>
                </div>
                <div className="prof-card card-indigo" style={{ textAlign: 'center' }}>
                    <div className="kpi-lbl">Final Inspection Quantity</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '4px' }}>
                        <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '4px' }}>
                            <div className="kpi-val" style={{ fontSize: '22px' }}>{data.finalInspectionQty.nos.toLocaleString()}</div>
                            <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>Nos.</div>
                        </div>
                        <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)', paddingX: '4px' }}>
                            <div className="kpi-val" style={{ fontSize: '22px' }}>{data.finalInspectionQty.set.toLocaleString()}</div>
                            <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>Set</div>
                        </div>
                        <div style={{ paddingLeft: '4px' }}>
                            <div className="kpi-val" style={{ fontSize: '22px' }}>{data.finalInspectionQty.rmt.toLocaleString()}</div>
                            <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>RMT</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards Row 2 */}
            <div className="g3 mb">
                <div className="prof-card card-spring-green" style={{ textAlign: 'center' }}>
                    <div className="kpi-lbl">New Sleepers in Pipeline</div>
                    <div className="kpi-val">{data.newSleepersInPipeline.toLocaleString()}</div>
                    <div className="kpi-sub">Manufactured but not cleared</div>
                </div>
                <div className="prof-card card-amber" style={{ textAlign: 'center' }}>
                    <div className="kpi-lbl">Sleepers Rejected in Process</div>
                    <div className="kpi-val">{data.sleepersRejectedInProcess.toLocaleString()}</div>
                    <div className="kpi-sub">Rejected in demoulding</div>
                </div>
                <div className="prof-card card-ruby" style={{ textAlign: 'center' }}>
                    <div className="kpi-lbl">Sleepers Rejected in Final</div>
                    <div className="kpi-val">{data.sleepersRejectedInFinal.toLocaleString()}</div>
                    <div className="kpi-sub">Final Inspection + Water Cube + MR</div>
                </div>
            </div>

            {/* Rejection Percentage Row */}
            <div className="prof-card card-gold" style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
                <div className="kpi-lbl">Rejection Percentage</div>
                <div className="kpi-val">{data.rejectionPercentage}%</div>
                <div className="prof-prog">
                    <div className="prof-prog-f" style={{ width: `${Math.min(100, data.rejectionPercentage * 10)}%`, background: '#eab308' }}></div>
                </div>
                <div className="kpi-sub">(Process + Final) / Total Manufactured</div>
            </div>

            <div className="sleeper-footer-note" style={{ textAlign: 'center', marginTop: '2rem', color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>
                * All quantities are tracked in Nos., Set, and RMT as per standard measurement units.
            </div>
        </div>
    );
};

export default SleeperSummary;
