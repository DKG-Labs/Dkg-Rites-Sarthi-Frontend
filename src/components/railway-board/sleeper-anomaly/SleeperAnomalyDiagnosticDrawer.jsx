import React from 'react';

const padBench = (num) => String(num).padStart(3, '0');

const formatParamName = (name) => {
    if (!name) return '';
    // Replace underscores with spaces, then add spacing before capitals if they are not already spaced
    let formatted = name.replace(/_/g, ' ');
    // Handle specific cases like 10%_LU or Vibrator1_RPM
    formatted = formatted.replace(/([0-9]+)/g, ' $1 ');
    formatted = formatted.replace(/\s+/g, ' ').trim();
    // Capitalize first letter of each word
    return formatted.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const SleeperAnomalyDiagnosticDrawer = ({ bench, onClose }) => {
    if (!bench) return null;

    const isAnom = bench.Anomaly_Prediction === -1;
    
    return (
        <>
            <div className={`drawer-overlay ${bench ? 'active' : ''}`} onClick={onClose}></div>
            <div className={`drawer-panel ${bench ? 'active' : ''}`}>
                <div className="drawer-header">
                    <div className="drawer-title">
                        {isAnom ? (
                            <span className="badge red pulsing-badge">
                                <svg className="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: '10px', height: '10px', marginRight: '4px'}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                Faulty Anomaly Detected
                            </span>
                        ) : (
                            <span className="badge green">
                                <svg className="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: '10px', height: '10px', marginRight: '4px'}}><polyline points="20 6 9 17 4 12"/></svg>
                                System Operating Normal
                            </span>
                        )}
                        <h3>Bench #{padBench(bench.Bench_No)}</h3>
                        <p className="drawer-subtitle-batch">Batch Number &bull; {bench.Batch_No}</p>
                    </div>
                    <button className="drawer-close" onClick={onClose} title="Close diagnostics panel">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                
                <div className="drawer-body">
                    {/* Score breakdown widget */}
                    <div className="drawer-score-card glass-panel-score">
                        <div className="score-radial-container">
                            <div className="score-radial-glow"></div>
                            <div className="score-radial">
                                <div className={`radial-ring-background`}></div>
                                <div className={`radial-ring-fill ${isAnom ? 'red' : 'green'}`}></div>
                                <div className="radial-inner">
                                    <span className="score-label">Multivariate</span>
                                    <span className="score-number">{bench.Anomaly_Score.toFixed(4)}</span>
                                    <span className="score-sub-label">Anomaly Score</span>
                                </div>
                            </div>
                        </div>
                        <div className="score-interpretation">
                            <h4>Multivariate Diagnostic Health</h4>
                            <p className={isAnom ? 'text-red' : 'text-green-sub'}>
                                {isAnom 
                                    ? 'High multivariate deviation flagged. Diagnostics suggest out-of-limits parameters.'
                                    : 'All measured features correspond precisely to standard baseline benchmarks.'}
                            </p>
                        </div>
                    </div>
                    
                    {/* Complete features z-score analysis */}
                    <div className="drawer-features-section">
                        <div className="section-header-row">
                            <h4>Parameter Diagnostics</h4>
                            <span className="features-count-tag">{bench.deviations.length} Tracked Sensors</span>
                        </div>
                        <p className="section-subtitle">Values measured against historical baselines. Highlighted features show deviations in standard deviations (&sigma;).</p>
                        
                        <div className="features-list">
                            {bench.deviations.map((dev, idx) => {
                                let zBadgeClass = 'normal';
                                let zBadgeText = 'Normal';
                                let borderClass = 'normal-border';
                                
                                if (dev.z_score > 2.0) {
                                    zBadgeClass = 'crit';
                                    zBadgeText = `Critical (+${dev.z_score.toFixed(1)}σ)`;
                                    borderClass = 'crit-border';
                                } else if (dev.z_score > 1.2) {
                                    zBadgeClass = 'warn';
                                    zBadgeText = `Warning (+${dev.z_score.toFixed(1)}σ)`;
                                    borderClass = 'warn-border';
                                }
                                
                                return (
                                    <div key={idx} className={`feature-item-modern ${borderClass}`}>
                                        <div className="feat-meta">
                                            <span className="feat-name">{formatParamName(dev.feature)}</span>
                                            <span className={`feat-zbadge-modern ${zBadgeClass}`}>{zBadgeText}</span>
                                        </div>
                                        <div className="feat-values-grid">
                                            <div className="val-box">
                                                <span className="val-label">Measured Value</span>
                                                <h5 className="val-text">{dev.value.toFixed(2)}</h5>
                                            </div>
                                            <div className="val-box-divider"></div>
                                            <div className="val-box">
                                                <span className="val-label">Baseline Mean</span>
                                                <h5 className="val-text">{dev.mean.toFixed(2)}</h5>
                                            </div>
                                            <div className="val-box-divider"></div>
                                            <div className="val-box">
                                                <span className="val-label">Standard Dev</span>
                                                <h5 className="val-text">{dev.std.toFixed(2)}</h5>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SleeperAnomalyDiagnosticDrawer;
