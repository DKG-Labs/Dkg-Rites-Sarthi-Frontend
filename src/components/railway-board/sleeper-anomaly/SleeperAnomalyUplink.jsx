import React from 'react';

const padBench = (num) => String(num).padStart(3, '0');

const SleeperAnomalyUplink = ({ testConfig, testRunning, testResults, onExecute }) => {
    return (
        <section className="panel active" id="panel-uplink">
            <div className="uplink-grid">
                
                {/* Uplink Control Console */}
                <div className="uplink-console-card glass-panel">
                    <div className="uplink-intro">
                        <div className="uplink-globe">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                                <polyline points="2 17 12 22 22 17"/>
                                <polyline points="2 12 12 17 22 12"/>
                            </svg>
                        </div>
                        <h3>Defect Inference Pipeline</h3>
                        <p>Process raw files from the <code>{testConfig?.test_dir || 'testing/'}/</code> folder dynamically through the Isolation Forest model.</p>
                    </div>
                    
                    <div className="uplink-files-info">
                        <h4>DETECTION TARGETS</h4>
                        <div className="file-tag">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <div>
                                <span>{testConfig ? `${testConfig.test_dir}/${testConfig.vib_file}` : 'Loading...'}</span>
                                <small>Raw vibrator sensors</small>
                            </div>
                        </div>
                        <div className="file-tag">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <div>
                                <span>{testConfig ? `${testConfig.test_dir}/${testConfig.ten_file}` : 'Loading...'}</span>
                                <small>Raw tension sensors</small>
                            </div>
                        </div>
                    </div>
                    
                    <button className="uplink-btn" onClick={onExecute} disabled={testRunning}>
                        {testRunning ? (
                            <span className="blinking">Running Defect Diagnostics...</span>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                <span>Execute Pipeline</span>
                            </>
                        )}
                    </button>
                </div>
                
                {/* Pipeline Test Result Summary */}
                {testResults ? (
                    <div className="uplink-result-card glass-panel" id="uplink-result-panel">
                        <div className="card-header">
                            <h3>Pipeline Results Summary</h3>
                            <span className="badge red pulsing">TEST FEED COMPLETED</span>
                        </div>
                        <div className="card-body">
                            <div className="stats-grid mini">
                                <div className="stat-card glass-panel mini">
                                    <span className="mini-title">TESTED BENCHES</span>
                                    <h4 className="mini-value">{testResults.metrics.total_benches}</h4>
                                </div>
                                <div className="stat-card glass-panel mini">
                                    <span className="mini-title text-red">ANOMALIES FOUND</span>
                                    <h4 className="mini-value text-red">{testResults.metrics.anomalies}</h4>
                                </div>
                                <div className="stat-card glass-panel mini">
                                    <span className="mini-title text-green">NORMAL STATE</span>
                                    <h4 className="mini-value text-green">{testResults.metrics.normal}</h4>
                                </div>
                                <div className="stat-card glass-panel mini">
                                    <span className="mini-title text-orange">ANOMALY INDEX</span>
                                    <h4 className="mini-value text-orange">{testResults.metrics.anomaly_rate.toFixed(2)}%</h4>
                                </div>
                            </div>
                            
                            <div className="table-container list-mini">
                                <table className="registry-table mini">
                                    <thead>
                                        <tr>
                                            <th>BENCH</th>
                                            <th>BATCH</th>
                                            <th>STATUS</th>
                                            <th>SCORE</th>
                                            <th>PRIMARY FAULT DIAGNOSTICS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {testResults.benches.map((b, idx) => {
                                            const isAnom = b.Anomaly_Prediction === -1;
                                            let primaryFault = 'Tolerances acceptable.';
                                            if (isAnom && b.deviations.length > 0) {
                                                const top = b.deviations[0];
                                                primaryFault = <span className="text-red font-weight-500">{top.feature}: {top.value.toFixed(1)} (Z: {top.z_score.toFixed(1)}&sigma;)</span>;
                                            }

                                            return (
                                                <tr key={idx}>
                                                    <td><span className={`bench-badge ${isAnom ? 'anomaly-highlight' : ''}`}>BENCH-{padBench(b.Bench_No)}</span></td>
                                                    <td>Batch {b.Batch_No}</td>
                                                    <td>
                                                        {isAnom ? (
                                                            <span className="badge red">
                                                                <svg className="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: '12px', height: '12px', marginRight: '4px'}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                                                ANOMALY
                                                            </span>
                                                        ) : (
                                                            <span className="badge green">
                                                                <svg className="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: '12px', height: '12px', marginRight: '4px'}}><polyline points="20 6 9 17 4 12"/></svg>
                                                                NORMAL
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className={`font-mono ${isAnom ? 'text-red' : ''}`}>{b.Anomaly_Score.toFixed(4)}</td>
                                                    <td className="text-secondary">{primaryFault}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="uplink-result-placeholder glass-panel">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                        <p>Awaiting pipeline execution. Click "Execute Pipeline" to run dynamic defect assessment on raw testing csv sheets.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default SleeperAnomalyUplink;
