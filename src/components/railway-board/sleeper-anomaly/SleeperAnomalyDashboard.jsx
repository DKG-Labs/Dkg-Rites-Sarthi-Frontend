import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const padBench = (num) => String(num).padStart(3, '0');

const SleeperAnomalyDashboard = ({ metrics, benches, logs, onClearLogs }) => {
    
    // Sort benches for chart
    const sorted = [...benches].sort((a, b) => a.Bench_No - b.Bench_No);
    const labels = sorted.map(b => `BENCH-${padBench(b.Bench_No)}`);
    const dataPoints = sorted.map(b => b.Anomaly_Score);
    const colors = sorted.map(b => b.Anomaly_Prediction === -1 ? 'rgba(239, 68, 68, 1)' : 'rgba(59, 130, 246, 0.7)');
    const radius = sorted.map(b => b.Anomaly_Prediction === -1 ? 5 : 2);

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Anomaly Score',
                data: dataPoints,
                borderColor: '#3b82f6',
                borderWidth: 1.5,
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.18)');
                    gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.05)');
                    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.00)');
                    return gradient;
                },
                fill: true,
                pointBackgroundColor: colors,
                pointBorderColor: colors,
                pointRadius: radius,
                pointHoverRadius: 7,
                tension: 0.2
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0f172a',
                titleFont: { family: 'Outfit', size: 13 },
                bodyFont: { family: 'Inter', size: 12 },
                borderColor: 'rgba(255, 255, 255, 0.08)',
                borderWidth: 1,
                displayColors: false,
                callbacks: {
                    label: function(context) {
                        const index = context.dataIndex;
                        const bench = sorted[index];
                        if (!bench) return [];
                        const status = bench.Anomaly_Prediction === -1 ? 'ANOMALY' : 'NORMAL';
                        return [
                            `Score: ${context.parsed.y.toFixed(4)}`,
                            `Status: ${status}`,
                            `Batch No: ${bench.Batch_No}`
                        ];
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(15, 23, 42, 0.04)' },
                ticks: { color: '#64748b', font: { size: 9, family: 'Fira Code' }, maxTicksLimit: 30 }
            },
            y: {
                grid: { color: 'rgba(15, 23, 42, 0.04)' },
                ticks: { color: '#64748b', font: { size: 10, family: 'Inter' } }
            }
        }
    };

    return (
        <section className="panel active" id="panel-dashboard">
            <div className="stats-grid">
                <div className="stat-card glass-panel" id="stat-total-benches">
                    <div className="stat-icon blue">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    </div>
                    <div className="stat-content">
                        <p className="stat-title">TOTAL BENCHES</p>
                        <h3 className="stat-value">{metrics ? metrics.total_benches : '—'}</h3>
                        <p className="stat-desc">Historical processed benches</p>
                    </div>
                </div>
                
                <div className="stat-card glass-panel" id="stat-anomalies-detected">
                    <div className="stat-icon red">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div className="stat-content">
                        <p className="stat-title">ANOMALIES DETECTED</p>
                        <h3 className="stat-value text-red">{metrics ? metrics.anomalies : '—'}</h3>
                        <p className="stat-desc text-red-sub">{metrics ? `${metrics.anomaly_rate.toFixed(2)}% Defect Ratio` : '0.00% Defect Ratio'}</p>
                    </div>
                </div>
                
                <div className="stat-card glass-panel" id="stat-normal-benches">
                    <div className="stat-icon green">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div className="stat-content">
                        <p className="stat-title">NORMAL STATE</p>
                        <h3 className="stat-value text-green">{metrics ? metrics.normal : '—'}</h3>
                        <p className="stat-desc text-green-sub">Benches operating normally</p>
                    </div>
                </div>
                
                <div className="stat-card glass-panel" id="stat-anomaly-rate">
                    <div className="stat-icon orange">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                    </div>
                    <div className="stat-content">
                        <p className="stat-title">ANOMALY INDEX</p>
                        <h3 className="stat-value text-orange">{metrics ? `${metrics.anomaly_rate.toFixed(2)}%` : '—'}</h3>
                        <p className="stat-desc text-orange-sub">Isolation Forest contamination</p>
                    </div>
                </div>
            </div>
            
            <div className="dashboard-grid">
                <div className="grid-card glass-panel col-span-2">
                    <div className="card-header">
                        <h3>Isolation Forest Anomaly Score Distribution</h3>
                        <span className="badge blue">Historical Overview</span>
                    </div>
                    <div className="card-body chart-container-large">
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>
                
                <div className="grid-card glass-panel">
                    <div className="card-header">
                        <h3>System Alarms Console</h3>
                        <button className="clear-terminal-btn" onClick={onClearLogs} title="Clear logs">Clear</button>
                    </div>
                    <div className="card-body">
                        <div className="terminal-log" id="console-logs">
                            {logs.map((log, i) => (
                                <div key={i} className={`log-line ${log.type}`}>{log.message}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="basis-panel glass-panel">
                <div className="card-header">
                    <h3>Anomaly Detection Scientific Basis & Mathematical Model</h3>
                    <span className="badge orange">Engine Methodology</span>
                </div>
                <div className="card-body basis-grid">
                    <div className="basis-card">
                        <div className="basis-icon blue">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V3a2.5 2.5 0 0 1 2.5-2.5H20v19H6.5a2.5 2.5 0 0 0-2.5 2.5z"/></svg>
                        </div>
                        <div className="basis-content">
                            <h4>1. Unsupervised Isolation Forest Model</h4>
                            <p>Anomalies are isolated using decision trees. Rather than building a profile of normal data, the <strong>Isolation Forest</strong> isolates anomalies by randomly selecting a feature and then randomly selecting a split value between the maximum and minimum values of that feature.</p>
                            <div className="basis-math">
                                <span className="formula">s(x, n) = 2<sup>-E(h(x)) / c(n)</sup></span>
                                <span className="desc">Where <em>E(h(x))</em> is the average path length of point <em>x</em> in trees, and <em>c(n)</em> is the average path length of an unsuccessful search. Anomaly scores close to 1 indicate early tree isolation (fewer partition splits required), flagging abnormal multi-dimensional parameters.</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="basis-card">
                        <div className="basis-icon red">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        </div>
                        <div className="basis-content">
                            <h4>2. Multi-sensor Statistical Z-Scores (&sigma; Deviation)</h4>
                            <p>Once a bench is isolated as an anomaly, standard deviations (&sigma;) are computed across all 32 parameters (RPMs, tension loading, pressed load, final load, etc.) against baseline averages from the historical dataset.</p>
                            <div className="basis-math">
                                <span className="formula">Z = | x - &mu; | / &sigma;</span>
                                <span className="desc">Where <em>&mu;</em> is baseline historical feature mean and <em>&sigma;</em> is baseline standard deviation. Parameter levels operating at <strong>Z &gt; 1.5&sigma;</strong> trigger a warning threshold, and levels at <strong>Z &gt; 2.0&sigma;</strong> trigger a critical fault alert.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SleeperAnomalyDashboard;
