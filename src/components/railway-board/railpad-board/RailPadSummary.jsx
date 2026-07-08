import React from 'react';
import './RailPadSummary.css';

const RailPadSummary = ({ summaryData = {}, onPoIssuedClick, onInspectionCallClick }) => {
    // Real data from backend; fallback to 0 when not yet loaded
    const data = {
        totalPoIssued: summaryData.railPadPoIssued || 0,
        totalPoQtyOnOrder: {
            nos: summaryData.railPadPoQuantityNos || 0,
            set: summaryData.railPadPoQuantitySet || 0
        },
        totalPoQtyAccepted: {
            nos: summaryData.totalAcceptedNos || 0,
            set: summaryData.totalAcceptedSet || 0
        },
        inspectionCalls: {
            pending: summaryData.pendingCalls || 0,
            underInspection: summaryData.underInspectionCalls || 0
        },
        avgProductionPerDay: summaryData.railPadAvgProductionPerDay || summaryData.avgProductionPerDay || 0,
        rejectedInProcess: summaryData.rejectedInProcess || 0,
        rejectedInFinal: summaryData.rejectedInFinal || 0,
        rejectionRate: summaryData.railPadRejectionPercentage || 0
    };

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

            {/* KPI Cards Row 2 */}
            <div className="g3 mb">
                <div className="prof-card" style={{ 
                    borderLeft: '4px solid #f59e0b',
                    background: 'linear-gradient(135deg, #fff7ed, #ffedd5)'
                }}>
                    <div className="kpi-lbl" style={{ color: '#9a3412' }}>Inspection Calls</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                        <div 
                            style={{ cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'all 0.2s' }}
                            onClick={() => onInspectionCallClick && onInspectionCallClick('Railpad', 'Pending')}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            title="Click to view Pending calls"
                        >
                            <div style={{ fontSize: '11px', color: '#9a3412', fontWeight: '600' }}>PENDING</div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: '#ea580c' }}>{data.inspectionCalls.pending}</div>
                        </div>
                        <div 
                            style={{ textAlign: 'right', cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'all 0.2s' }}
                            onClick={() => onInspectionCallClick && onInspectionCallClick('Railpad', 'Under Inspection')}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            title="Click to view Under Inspection calls"
                        >
                            <div style={{ fontSize: '11px', color: '#9a3412', fontWeight: '600' }}>UNDER INSP.</div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b' }}>{data.inspectionCalls.underInspection}</div>
                        </div>
                    </div>
                </div>
                <div className="prof-card card-spring-green" style={{ textAlign: 'center' }}>
                    <div className="kpi-lbl">Avg Production/Day</div>
                    <div className="kpi-val">{data.avgProductionPerDay}</div>
                    <div className="kpi-sub">Across all units</div>
                </div>
                <div className="prof-card card-gold" style={{ textAlign: 'center' }}>
                    <div className="kpi-lbl">Overall Rejection Rate</div>
                    <div className="kpi-val">{Number(data.rejectionRate || 0).toFixed(2)}%</div>
                    <div className="prof-prog">
                        <div className="prof-prog-f" style={{ width: `${Math.min(100, Number(data.rejectionRate || 0) * 10)}%`, background: '#eab308' }}></div>
                    </div>
                    <div className="kpi-sub">Process + Final</div>
                </div>
            </div>

            {/* KPI Cards Row 3 */}
            <div className="g2">
                <div className="prof-card card-mint" style={{ textAlign: 'center' }}>
                    <div className="kpi-lbl">Rejected in Process Inspection</div>
                    <div className="kpi-val">{data.rejectedInProcess}</div>
                    <div className="kpi-sub">Porosity, Blow holes, Dimensions, Flash</div>
                </div>
                <div className="prof-card card-ruby" style={{ textAlign: 'center' }}>
                    <div className="kpi-lbl">Rejected in Final Inspection</div>
                    <div className="kpi-val">{data.rejectedInFinal}</div>
                    <div className="kpi-sub">Weight, Dimensions, Physical, Chemical</div>
                </div>
            </div>

            <div className="railpad-footer-note" style={{ textAlign: 'center', marginTop: '2rem', color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>
                * Data synchronized with IREPS and RITES Inspection systems.
            </div>
        </div>
    );
};

export default RailPadSummary;
