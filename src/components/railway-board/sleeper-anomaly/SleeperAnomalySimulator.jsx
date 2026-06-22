import React from 'react';

const padBench = (num) => String(num).padStart(3, '0');

const SleeperAnomalySimulator = ({ 
    simRunning, 
    simCount, 
    totalBenches, 
    simAnomalies, 
    streamHistory, 
    simSpeed, 
    setSimSpeed,
    onStart, 
    onPause, 
    onStep, 
    onReset,
    onInspect
}) => {
    return (
        <section className="panel active" id="panel-simulator">
            <div className="simulator-layout">
                {/* Simulation Controls */}
                <div className="sim-ctrl-card glass-panel">
                    <div className="sim-brand">
                        <span className="badge red blinking" id="sim-live-tag">LIVE FEED</span>
                        <h3>SCADA Stream Simulator</h3>
                        <p>Simulate real-time sensor streams and Isolation Forest inspection scoring.</p>
                    </div>
                    
                    <div className="sim-stats-mini">
                        <div className="mini-stat">
                            <span>STREAM COUNT</span>
                            <h4>{simCount} / {totalBenches || 0}</h4>
                        </div>
                        <div className="mini-stat">
                            <span>SIMULATOR STATUS</span>
                            <h4 className={simRunning ? "text-green blinking" : "text-secondary"}>
                                {simRunning ? "STREAMING" : "PAUSED"}
                            </h4>
                        </div>
                        <div className="mini-stat">
                            <span>SIM ANOMALIES</span>
                            <h4 className="text-red">{simAnomalies}</h4>
                        </div>
                    </div>
                    
                    {/* Control Knobs */}
                    <div className="sim-actions">
                        {!simRunning ? (
                            <button className="sim-btn play" onClick={onStart} title="Start simulation">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>
                                <span>Start Feed</span>
                            </button>
                        ) : (
                            <button className="sim-btn pause" onClick={onPause} title="Pause simulation">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                <span>Pause Feed</span>
                            </button>
                        )}
                        <button className="sim-btn step" onClick={onStep} title="Stream next bench manually">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
                            <span>Step</span>
                        </button>
                        <button className="sim-btn reset" onClick={onReset} title="Restart simulation from bench 0">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                            <span>Reset</span>
                        </button>
                    </div>
                    
                    {/* Speed and Settings */}
                    <div className="sim-settings">
                        <div className="setting-item">
                            <label htmlFor="select-sim-speed">Stream Interval (ms)</label>
                            <select 
                                id="select-sim-speed" 
                                value={simSpeed}
                                onChange={(e) => setSimSpeed(parseInt(e.target.value))}
                            >
                                <option value="200">200ms (Fast)</option>
                                <option value="500">500ms (Normal)</option>
                                <option value="1000">1000ms (Slow)</option>
                                <option value="2000">2000ms (Demo)</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                {/* Simulation Stream Output */}
                <div className="sim-feed-card glass-panel">
                    <div className="card-header">
                        <h3>Streaming Bench Feed</h3>
                        <span className={simRunning ? "badge green pulsing" : "badge orange"}>
                            {simRunning ? "FEED ACTIVE" : "FEED PAUSED"}
                        </span>
                    </div>
                    <div className="card-body">
                        <div className="stream-container" id="simulation-stream-list">
                            {streamHistory.length === 0 ? (
                                <div className="stream-empty-state">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="14" y2="15"/><line x1="12" y1="9" x2="12" y2="11"/></svg>
                                    <p>Click "Start Feed" or "Step" to stream SCADA benches in real-time.</p>
                                </div>
                            ) : (
                                streamHistory.map((item, idx) => {
                                    const { timeStr, bench } = item;
                                    const isAnom = bench.Anomaly_Prediction === -1;
                                    
                                    let alertText = 'Operating within tolerances.';
                                    if (isAnom && bench.deviations.length > 0) {
                                        const top = bench.deviations[0];
                                        alertText = `Out-of-bounds: ${top.feature} (${top.value.toFixed(1)} vs Mean: ${top.mean.toFixed(1)})`;
                                    }

                                    return (
                                        <div key={idx} className="stream-row">
                                            <span className="stream-time">{timeStr}</span>
                                            <span>
                                                <span className={`bench-badge ${isAnom ? 'anomaly-highlight' : ''}`}>BENCH-{padBench(bench.Bench_No)}</span>
                                            </span>
                                            <span className="stream-batch-id">Batch {bench.Batch_No}</span>
                                            <span className={`stream-score font-mono ${isAnom ? 'text-red' : ''}`}>{bench.Anomaly_Score.toFixed(4)}</span>
                                            <span className="stream-alert-msg">{alertText}</span>
                                            <button className="stream-btn-inspect" onClick={() => onInspect(bench.Batch_No, bench.Bench_No)}>Inspect Drawer</button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SleeperAnomalySimulator;
