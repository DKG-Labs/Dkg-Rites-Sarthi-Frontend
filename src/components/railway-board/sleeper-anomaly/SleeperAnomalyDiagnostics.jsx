import React, { useState, useEffect, useRef } from 'react';
import SleeperAnomalyDashboard from './SleeperAnomalyDashboard';
import SleeperAnomalySimulator from './SleeperAnomalySimulator';
import SleeperAnomalyExplorer from './SleeperAnomalyExplorer';
import SleeperAnomalyUplink from './SleeperAnomalyUplink';
import SleeperAnomalyDiagnosticDrawer from './SleeperAnomalyDiagnosticDrawer';
import './SleeperAnomaly.css';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal
    ? 'http://localhost:8085'
    : 'https://scadaai-b9anhdd9h0hxd2gc.canadacentral-01.azurewebsites.net';

const SCADA_PLANTS = [
    { label: 'Patil Rail (PRIL)', value: 'PRIL' }
];

const SCADA_UNITS = [
    { label: 'Wadiyaram (WDM-U1)', value: 'WDM-U1' },
    { label: 'Thirumangalam', value: 'Thirumangalam' }
];

const SCADA_LINES = [
    { label: 'Line 1 (L1)', value: 'L1' }
];

const getFetchOptions = () => {
    const token = localStorage.getItem('authToken');
    return {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
};

function SleeperAnomalyDiagnostics() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [metrics, setMetrics] = useState(null);
    const [benches, setBenches] = useState([]);
    const [datasets, setDatasets] = useState([]);
    const [activeDataset, setActiveDataset] = useState('');
    const [testConfig, setTestConfig] = useState(null);

    // Dashboard Logs
    const [logs, setLogs] = useState([
        { message: '[SYSTEM] Ready for SCADA monitoring dashboard connection...', type: 'system' }
    ]);

    // Drawer State
    const [inspectedBench, setInspectedBench] = useState(null);

    // Simulator State
    const [simRunning, setSimRunning] = useState(false);
    const [simCount, setSimCount] = useState(0);
    const [simAnomalies, setSimAnomalies] = useState(0);
    const [streamHistory, setStreamHistory] = useState([]);
    const [simSpeed, setSimSpeed] = useState(500);
    const simIntervalRef = useRef(null);

    // Telemetry Ingestion State
    const [selectedPlant, setSelectedPlant] = useState('PRIL');
    const [selectedUnit, setSelectedUnit] = useState('WDM-U1');
    const [selectedLine, setSelectedLine] = useState('L1');
    const [fromDate, setFromDate] = useState(() => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const year = yesterday.getFullYear();
        const month = String(yesterday.getMonth() + 1).padStart(2, '0');
        const day = String(yesterday.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [toDate, setToDate] = useState(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [uploading, setUploading] = useState(false);

    // Uplink State
    const [testRunning, setTestRunning] = useState(false);
    const [testResults, setTestResults] = useState(null);

    const handleApiIngestion = async () => {
        // Validate date range
        if (!fromDate || !toDate) {
            logToConsole('Please select both From and To dates before fetching.', 'faulty');
            return;
        }
        if (toDate < fromDate) {
            logToConsole(`Invalid date range: "To" date (${toDate}) cannot be before "From" date (${fromDate}).`, 'faulty');
            return;
        }

        setUploading(true);
        const plantLabel = SCADA_PLANTS.find(p => p.value === selectedPlant)?.label || selectedPlant;
        const unitLabel = SCADA_UNITS.find(u => u.value === selectedUnit)?.label || selectedUnit;
        const lineLabel = SCADA_LINES.find(l => l.value === selectedLine)?.label || selectedLine;

        const formatLogDate = (dStr) => {
            if (!dStr) return '';
            const parts = dStr.split('-');
            if (parts.length === 3 && parts[0].length === 4) {
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            return dStr;
        };

        const friendlyFrom = formatLogDate(fromDate);
        const friendlyTo = formatLogDate(toDate);
        const isSingleDay = fromDate === toDate;
        const rangeLabel = isSingleDay ? friendlyFrom : `${friendlyFrom} to ${friendlyTo}`;

        logToConsole(`Initiating live telemetry sync: ${plantLabel} - ${unitLabel} (${lineLabel}) | Range: ${rangeLabel}`, 'system');
        logToConsole('Fetching all pages from SCADA API in parallel (this may take ~20s)...', 'system');

        // Progress heartbeat — shows user the fetch is ongoing
        let step = 0;
        const progressSteps = [
            'Parallel page fetch in progress — VIBRATOR data...',
            'Parallel page fetch in progress — TENSIONING data...',
            'Applying client-side date filter for selected range...',
            'Running Isolation Forest anomaly inference...',
            'Building dataset and computing metrics...'
        ];
        const progressInterval = setInterval(() => {
            if (step < progressSteps.length) {
                logToConsole(progressSteps[step], 'system');
                step++;
            }
        }, 3500);

        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_BASE}/api/ingest-from-api`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    plant: selectedPlant,
                    plantUnit: selectedUnit,
                    line: selectedLine,
                    fromDate: fromDate,
                    toDate: toDate
                })
            });

            clearInterval(progressInterval);

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to ingest data from SCADA API');
            }

            const data = await res.json();
            logToConsole(`Date filter applied — dataset ready: "${data.dataset}"`, 'normal');
            logToConsole(`Telemetry sync complete for ${rangeLabel}. Loading dashboard...`, 'normal');

            // Switch to new dataset and reload stats
            setActiveDataset(data.dataset);
            await fetchDatasets();
            await fetchSystemData(true);

        } catch (err) {
            clearInterval(progressInterval);
            logToConsole(`API Ingestion Error: ${err.message}`, 'faulty');
        } finally {
            setUploading(false);
        }
    };

    const logToConsole = (message, type = 'system') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { message: `[${timestamp}] ${message}`, type }]);
    };

    const showNotification = (message, type = 'success') => {
        console.log(`[${type.toUpperCase()}] ${message}`);
    };

    const fetchSystemData = async (isRefresh = false) => {
        logToConsole('Synchronizing SCADA registry metrics with server...', 'system');
        try {
            const metricsRes = await fetch(`${API_BASE}/api/metrics`, getFetchOptions());
            if (!metricsRes.ok) throw new Error('Failed to fetch system metrics');
            const m = await metricsRes.json();
            setMetrics(m);

            const benchesRes = await fetch(`${API_BASE}/api/benches`, getFetchOptions());
            if (!benchesRes.ok) throw new Error('Failed to fetch SCADA bench list');
            const b = await benchesRes.json();
            setBenches(b);

            logToConsole(`Successfully synchronized metrics for ${b.length} processed benches.`, 'normal');

            if (isRefresh) {
                showNotification('System synchronized successfully!', 'success');
            }
        } catch (err) {
            logToConsole(`Sync Error: ${err.message}`, 'faulty');
        }
    };

    const fetchDatasets = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/datasets`, getFetchOptions());
            if (!res.ok) throw new Error('Failed to fetch datasets list');
            const data = await res.json();
            setDatasets(data.available || []);
            setActiveDataset(data.active || '');
        } catch (err) {
            console.error('Failed to load datasets:', err);
        }
    };

    const fetchTestConfig = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/test-config`, getFetchOptions());
            if (!res.ok) throw new Error('Failed to fetch test config');
            const data = await res.json();
            setTestConfig(data);
        } catch (err) {
            console.error('Failed to load test configuration:', err);
        }
    };

    useEffect(() => {
        fetchSystemData();
        fetchDatasets();
        fetchTestConfig();
        return () => {
            if (simIntervalRef.current) clearInterval(simIntervalRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (activeTab === 'uplink') {
            fetchTestConfig();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const handleDatasetChange = async (newDataset) => {
        setActiveDataset(newDataset);
        logToConsole(`Switching active dataset to: ${newDataset}...`, 'system');
        try {
            const res = await fetch(`${API_BASE}/api/select-dataset?name=${encodeURIComponent(newDataset)}`, getFetchOptions());
            if (!res.ok) throw new Error('Failed to switch dataset');
            const data = await res.json();

            logToConsole(`Active dataset successfully changed to ${data.active}. Loaded ${data.total_benches} benches.`, 'normal');

            await resetSimulation();
            await fetchSystemData();
            await fetchTestConfig();

        } catch (err) {
            logToConsole(`Failed to change dataset: ${err.message}`, 'faulty');
            fetchDatasets();
        }
    };

    // Simulator Functions
    const triggerNextSimulationStep = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/simulate-next`, getFetchOptions());
            if (!res.ok) throw new Error('Simulation stream error');
            const data = await res.json();

            const bench = data.bench;
            setSimCount(data.index);

            if (bench.Anomaly_Prediction === -1) {
                setSimAnomalies(prev => prev + 1);
            }

            const timeStr = new Date().toLocaleTimeString();

            setStreamHistory(prev => {
                const newList = [{ timeStr, bench }, ...prev];
                if (newList.length > 40) newList.pop();
                return newList;
            });

            let alertText = 'Operating within tolerances.';
            if (bench.Anomaly_Prediction === -1 && bench.deviations.length > 0) {
                const top = bench.deviations[0];
                alertText = `Out-of-bounds: ${top.feature} (${top.value.toFixed(1)} vs Mean: ${top.mean.toFixed(1)})`;
                logToConsole(`[FAULT ALARM] BENCH-${String(bench.Bench_No).padStart(3, '0')} in Batch ${bench.Batch_No} failed Isolation Forest inspect. Score: ${bench.Anomaly_Score.toFixed(4)}. Cause: ${alertText}`, 'faulty');
            } else {
                logToConsole(`[FEED] BENCH-${String(bench.Bench_No).padStart(3, '0')} in Batch ${bench.Batch_No} verified NORMAL. Score: ${bench.Anomaly_Score.toFixed(4)}`, 'normal');
            }
        } catch (err) {
            logToConsole(`Simulation step error: ${err.message}`, 'faulty');
        }
    };

    const startSimulation = () => {
        if (simRunning) return;
        setSimRunning(true);
        simIntervalRef.current = setInterval(triggerNextSimulationStep, simSpeed);
        logToConsole('SCADA Real-Time Simulation Feed started successfully.', 'system');
    };

    const pauseSimulation = () => {
        if (!simRunning) return;
        setSimRunning(false);
        if (simIntervalRef.current) clearInterval(simIntervalRef.current);
        logToConsole('SCADA Real-Time Simulation Feed paused.', 'warn');
    };

    const resetSimulation = async () => {
        pauseSimulation();
        try {
            await fetch(`${API_BASE}/api/simulate-next?reset=true`, getFetchOptions());
            setSimCount(0);
            setSimAnomalies(0);
            setStreamHistory([]);
            logToConsole('SCADA Simulation counters reset to bench index 0.', 'system');
        } catch (err) {
            logToConsole(`Failed to reset simulator: ${err.message}`, 'faulty');
        }
    };

    useEffect(() => {
        if (simRunning) {
            if (simIntervalRef.current) clearInterval(simIntervalRef.current);
            simIntervalRef.current = setInterval(triggerNextSimulationStep, simSpeed);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [simSpeed]);

    // Uplink Function
    const runDefectUplinkPipeline = async () => {
        if (testRunning) return;
        setTestRunning(true);
        logToConsole('Executing live SCADA defect extraction pipeline against raw CSV telemetry sheets...', 'system');

        try {
            const res = await fetch(`${API_BASE}/api/test-data`, getFetchOptions());
            if (!res.ok) throw new Error('Model inference failed or telemetry CSV missing');
            const data = await res.json();
            setTestResults(data);
            logToConsole(`Defect inference pipeline run complete. Processed ${data.metrics.total_benches} raw benches. Found ${data.metrics.anomalies} anomalies. Anomaly index: ${data.metrics.anomaly_rate.toFixed(2)}%`, 'normal');
        } catch (err) {
            logToConsole(`Defect inference failure: ${err.message}. Please verify raw sleeper CSVs are correctly placed in the "testing/" folder.`, 'faulty');
        } finally {
            setTestRunning(false);
        }
    };

    // Inspect Drawer
    const openDiagnosticDrawer = (batchNo, benchNo) => {
        let bench = benches.find(b => b.Batch_No === batchNo && b.Bench_No === benchNo);
        if (!bench && testResults) {
            bench = testResults.benches.find(b => b.Batch_No === batchNo && b.Bench_No === benchNo);
        }
        if (bench) {
            setInspectedBench(bench);
        }
    };

    // Header Titles
    const headers = {
        dashboard: { title: 'Control Center', desc: 'Overview of historical SCADA anomaly detection and quality analysis.' },
        simulator: { title: 'Live Stream Simulator', desc: 'Real-time simulated SCADA sensor feed and dynamic anomaly scoring.' },
        explorer: { title: 'Defect Registry Explorer', desc: 'Search, filter, and inspect detailed parameters of all physical benches.' },
        uplink: { title: 'Defect Inference Uplink', desc: 'Execute real-time Isolation Forest inference against new telemetry files.' }
    };
    const headerInfo = headers[activeTab] || headers.dashboard;

    return (
        <div className="sleeper-anomaly-app">
            {/* Sub Header */}
            <div className="local-header">
                <div className="local-header-title">
                    <h1>{headerInfo.title}</h1>
                    <p>{headerInfo.desc}</p>
                </div>
                <div className="local-header-actions">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Dataset:</span>
                        <select
                            className="local-dataset-select"
                            value={activeDataset}
                            onChange={(e) => handleDatasetChange(e.target.value)}
                        >
                            {datasets.map(ds => (
                                <option key={ds} value={ds}>{ds}</option>
                            ))}
                        </select>
                    </div>
                    <button className="local-action-btn" onClick={() => fetchSystemData(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ marginRight: '4px' }}><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" /></svg>
                        <span>Sync System</span>
                    </button>
                </div>
            </div>

            {/* SCADA Telemetry API Ingestion Panel */}
            <div className="scada-pull-panel">
                <div className="scada-pull-panel-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ marginRight: '4px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                    <span>Fetch Live SCADA Telemetry</span>
                </div>
                <div className="scada-pull-controls">
                    <div className="scada-control-group">
                        <span className="scada-control-label">Plant</span>
                        <select
                            className="local-dataset-select"
                            value={selectedPlant}
                            onChange={(e) => setSelectedPlant(e.target.value)}
                        >
                            {SCADA_PLANTS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="scada-control-group">
                        <span className="scada-control-label">Unit</span>
                        <select
                            className="local-dataset-select"
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                        >
                            {SCADA_UNITS.map(u => (
                                <option key={u.value} value={u.value}>{u.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="scada-control-group">
                        <span className="scada-control-label">Line</span>
                        <select
                            className="local-dataset-select"
                            value={selectedLine}
                            onChange={(e) => setSelectedLine(e.target.value)}
                        >
                            {SCADA_LINES.map(l => (
                                <option key={l.value} value={l.value}>{l.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="scada-control-group">
                        <span className="scada-control-label">From</span>
                        <input
                            type="date"
                            className="local-date-input"
                            value={fromDate}
                            max={toDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>
                    <div className="scada-control-group">
                        <span className="scada-control-label">To</span>
                        <input
                            type="date"
                            className="local-date-input"
                            value={toDate}
                            min={fromDate}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>
                    <button className="local-action-btn primary" onClick={handleApiIngestion} disabled={uploading}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ marginRight: '4px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                        <span>{uploading ? 'Fetching Telemetry...' : 'Fetch SCADA Telemetry'}</span>
                    </button>
                </div>
            </div>

            {/* Sub Navigation Tabs */}
            <div className="local-tabs">
                <button className={`local-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                    <i className="fa-solid fa-chart-pie"></i> Control Center
                </button>
                <button className={`local-tab-btn ${activeTab === 'simulator' ? 'active' : ''}`} onClick={() => setActiveTab('simulator')}>
                    <i className="fa-solid fa-play"></i> Live Simulator
                </button>
                <button className={`local-tab-btn ${activeTab === 'explorer' ? 'active' : ''}`} onClick={() => setActiveTab('explorer')}>
                    <i className="fa-solid fa-magnifying-glass"></i> Defect Explorer
                </button>
                <button className={`local-tab-btn ${activeTab === 'uplink' ? 'active' : ''}`} onClick={() => setActiveTab('uplink')}>
                    <i className="fa-solid fa-file-arrow-up"></i> Test Uplink
                </button>
            </div>

            {/* Content Panels */}
            <div className="panels-container" style={{ padding: '0' }}>
                {activeTab === 'dashboard' && (
                    <SleeperAnomalyDashboard
                        metrics={metrics}
                        benches={benches}
                        logs={logs}
                        onClearLogs={() => setLogs([{ message: '[SYSTEM] Ready for SCADA monitoring dashboard connection...', type: 'system' }])}
                    />
                )}

                {activeTab === 'simulator' && (
                    <SleeperAnomalySimulator
                        simRunning={simRunning}
                        simCount={simCount}
                        totalBenches={benches.length}
                        simAnomalies={simAnomalies}
                        streamHistory={streamHistory}
                        simSpeed={simSpeed}
                        setSimSpeed={setSimSpeed}
                        onStart={startSimulation}
                        onPause={pauseSimulation}
                        onStep={triggerNextSimulationStep}
                        onReset={resetSimulation}
                        onInspect={openDiagnosticDrawer}
                    />
                )}

                {activeTab === 'explorer' && (
                    <SleeperAnomalyExplorer
                        benches={benches}
                        onInspect={openDiagnosticDrawer}
                    />
                )}

                {activeTab === 'uplink' && (
                    <SleeperAnomalyUplink
                        testConfig={testConfig}
                        testRunning={testRunning}
                        testResults={testResults}
                        onExecute={runDefectUplinkPipeline}
                    />
                )}
            </div>

            {/* Detail Slide Drawer */}
            <SleeperAnomalyDiagnosticDrawer
                bench={inspectedBench}
                onClose={() => setInspectedBench(null)}
            />
        </div>
    );
}

export default SleeperAnomalyDiagnostics;
