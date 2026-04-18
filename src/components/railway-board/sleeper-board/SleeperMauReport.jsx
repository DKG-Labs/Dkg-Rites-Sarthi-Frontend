import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import './SleeperSummary.css';

// Reuse common components if possible, otherwise define them locally
const ExportButton = ({ label, onClick, disabled, variant = 'green' }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        style={{
            background: disabled ? '#e2e8f0' : (variant === 'green' ? '#10b981' : '#ffffff'),
            color: disabled ? '#94a3b8' : (variant === 'green' ? 'white' : '#1e293b'),
            border: variant === 'green' ? 'none' : '1px solid #e2e8f0',
            padding: '10px 20px',
            borderRadius: '50px',
            fontWeight: 'bold',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            fontSize: '13px',
            transition: 'all 0.2s'
        }}
    >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        {label}
    </button>
);

const SleeperReportPage = ({ plantName }) => {
    // These would typically come from an API, but using consistent mock for UI/UX
    const mockDefectAgg = [
        { name: 'Visual Demoulding', value: 35, color: '#10b981', rate: 1.25 },
        { name: 'Dimension Demoulding', value: 25, color: '#3b82f6', rate: 0.95 },
        { name: 'Final Visual', value: 20, color: '#f59e0b', rate: 0.75 },
        { name: 'Final Critical', value: 10, color: '#ef4444', rate: 0.35 },
        { name: 'Other', value: 10, color: '#8b5cf6', rate: 0.35 },
    ];
    const mockMonthlyPerformance = [
        { month: 'JAN 2026', inspected: 25000, rejected: 800, rejPct: 3.20 },
        { month: 'FEB 2026', inspected: 18000, rejected: 504, rejPct: 2.80 },
        { month: 'MAR 2026', inspected: 32000, rejected: 1000, rejPct: 3.12 },
    ];
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className="bg-white px-8 pb-12 pt-8 shadow-sm rounded-lg mx-auto print-container" style={{ maxWidth: '1000px', background: 'white', borderRadius: '12px', marginBottom: '20px' }}>
            <div className="text-center mb-10">
                <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '-0.5px', marginBottom: '4px' }}>{plantName}</h2>
                <p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Manufacturer Performance Analysis (Monthly)</p>
                <div style={{ height: '4px', width: '40px', background: '#10b981', margin: '16px auto', borderRadius: '2px' }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '20px' }}>Process Defect Distribution</h3>
                    <div style={{ width: '400px', height: '300px' }}>
                        <PieChart width={400} height={300} margin={{ left: 5, right: 5 }}>
                            <Pie
                                data={mockDefectAgg}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={8}
                                dataKey="value"
                                isAnimationActive={false}
                                label={({ cx, cy, midAngle, outerRadius, name, rate }) => {
                                    const RADIAN = Math.PI / 180;
                                    const radius = outerRadius + 15;
                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                    return (
                                        <text x={x} y={y} fill="#64748b" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="8" fontWeight="700">
                                            {`${name} ${rate}%`}
                                        </text>
                                    );
                                }}
                                labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                            >
                                {mockDefectAgg.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </div>
                    <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', width: '100%' }}>
                        {mockDefectAgg.map((d, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '600', color: '#64748b' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i] }}></div>
                                <span>{d.name}: {d.value} Nos. ({((d.value / 100) * 100).toFixed(0)}%)</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '20px' }}>Monthly Performance</h3>
                    <div style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead style={{ background: '#1e293b', color: 'white' }}>
                                <tr>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>MONTH</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>INSPECTED (NOS.)</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>REJECTED (NOS.)</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>% REJ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockMonthlyPerformance.map((m, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px', fontWeight: '700', color: '#1e293b' }}>{m.month}</td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>{m.inspected.toLocaleString()}</td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>{m.rejected.toLocaleString()}</td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                            <span style={{ padding: '2px 8px', background: '#fef2f2', color: '#b91c1c', borderRadius: '4px', fontWeight: '800' }}>{m.rejPct.toFixed(2)}%</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '30px' }}>
                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                            <p style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>Inspected (Nos.)</p>
                            <p style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b' }}>38,710</p>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                            <p style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>Rejected (Nos.)</p>
                            <p style={{ fontSize: '16px', fontWeight: '900', color: '#dc2626' }}>504</p>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                            <p style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>Avg% Rej</p>
                            <p style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b' }}>1.30%</p>
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ marginTop: '50px', paddingTop: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#cbd5e1', fontWeight: '700' }}>
                <span>SARTHI RAILWAY DASHBOARD - CONFIDENTIAL</span>
                <span>GENERATED ON: {new Date().toLocaleDateString()}</span>
            </div>
        </div>
    );
};

const SleeperMauReport = () => {
    const [selectedPlant, setSelectedPlant] = useState(null);
    const [batchReportData, setBatchReportData] = useState(null);
    const [isPreparingBatchPdf, setIsPreparingBatchPdf] = useState(false);
    const [batchProgress, setBatchProgress] = useState(0);

    // Mock Data for the Main Table
    // Excel Export Utility
    const downloadExcel = (data, headers, filename) => {
        if (!data || data.length === 0) return;
        const headerRow = headers.map(h => h.label).join(',');
        const dataRows = data.map(row => {
            return headers.map(header => {
                let val = row[header.key] ?? '';
                const stringValue = String(val).replace(/"/g, '""');
                return stringValue.includes(',') || stringValue.includes('\n') ? `"${stringValue}"` : stringValue;
            }).join(',');
        });
        const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const mauData = [
        { id: 1, plantName: 'Patil Industry - Kargi Road', inspectedBy: 'CRIO', production: 25000, acceptance: 24200, processRej: 300, finalRej: 500, rejPct: 3.2 },
        { id: 2, plantName: 'Patil Industry - Wadiyaram', inspectedBy: 'SRIO', production: 18000, acceptance: 17500, processRej: 200, finalRej: 300, rejPct: 2.8 },
        { id: 3, plantName: 'Concrete Sleepers India', inspectedBy: 'NRIO', production: 32000, acceptance: 31000, processRej: 400, finalRej: 600, rejPct: 3.1 },
    ];

    // Handle Batch PDF Printing
    useEffect(() => {
        if (batchReportData && batchReportData.length > 0) {
            const timer = setTimeout(() => {
                window.print();
                setTimeout(() => {
                    setBatchReportData(null);
                    setIsPreparingBatchPdf(false);
                }, 1000);
            }, 1800);
            return () => clearTimeout(timer);
        }
    }, [batchReportData]);

    const handleBatchPrint = async () => {
        setIsPreparingBatchPdf(true);
        setBatchProgress(0);

        // Prepare data for all companies instantly
        const batches = mauData.map((m, idx) => {
            setBatchProgress(idx + 1);
            return { plantName: m.plantName };
        });

        setBatchReportData(batches);
    };

    if (selectedPlant) {
        return <SleeperReportPageWrapper plantName={selectedPlant.plantName} onBack={() => setSelectedPlant(null)} />;
    }

    return (
        <>
            <div className={`sleeper-report-container animate-up ${batchReportData ? 'no-print' : ''}`}>
                <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <span>Monthly Analysis of Units (Sleeper)</span>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <ExportButton
                            label="Download Summary"
                            variant="white"
                            onClick={() => downloadExcel(
                                mauData,
                                [
                                    { label: 'Plant Name', key: 'plantName' },
                                    { label: 'Inspected By', key: 'inspectedBy' },
                                    { label: 'Production', key: 'production' },
                                    { label: 'Acceptance', key: 'acceptance' },
                                    { label: 'Process Rejection', key: 'processRej' },
                                    { label: 'Final Rejection', key: 'finalRej' },
                                    { label: '% Rejection', key: 'rejPct' }
                                ],
                                'Sleeper_MAU_Summary'
                            )}
                        />
                        <ExportButton
                            label={isPreparingBatchPdf ? `Preparing (${batchProgress}/${mauData.length})...` : "Batch PDF Report"}
                            disabled={isPreparingBatchPdf}
                            variant="green"
                            onClick={handleBatchPrint}
                        />
                        <input type="text" placeholder="Search Plant..." className="prof-search" style={{ height: '36px', fontSize: '13px' }} />
                    </div>
                </div>

                <div className="table-responsive prof-card">
                    <table className="prof-table">
                        <thead>
                            <tr>
                                <th>S.NO.</th>
                                <th>PLANT NAME</th>
                                <th>INSPECTED BY</th>
                                <th className="text-right">PRODUCTION (NOS.)</th>
                                <th className="text-right">ACCEPTANCE (NOS.)</th>
                                <th className="text-right">PROCESS REJECTION</th>
                                <th className="text-right">FINAL REJECTION</th>
                                <th className="text-right">% REJECTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mauData.map((row, idx) => (
                                <tr key={row.id} className={idx % 2 === 0 ? 'row-odd' : 'row-even'} onClick={() => setSelectedPlant(row)} style={{ cursor: 'pointer' }}>
                                    <td>{idx + 1}</td>
                                    <td className="font-bold text-blue-700">{row.plantName}</td>
                                    <td><span className="prof-badge" style={{ background: '#f0f9ff', color: '#075985' }}>{row.inspectedBy}</span></td>
                                    <td className="text-right">{row.production.toLocaleString()}</td>
                                    <td className="text-right text-emerald-600 font-bold">{row.acceptance.toLocaleString()}</td>
                                    <td className="text-right">{row.processRej.toLocaleString()}</td>
                                    <td className="text-right">{row.finalRej.toLocaleString()}</td>
                                    <td className="text-right">
                                        <span className="prof-badge" style={{ background: '#fff7ed', color: '#9a3412' }}>{row.rejPct}%</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hidden Batch Print Viewport - Always rendered but hidden by CSS in normal view */}
            {batchReportData && (
                <div className="mpia-batch-print-viewport">
                    {batchReportData.map((item, idx) => (
                        <SleeperReportPage key={idx} plantName={item.plantName} />
                    ))}
                </div>
            )}
        </>
    );
};

// Extracted the report page content to reuse in batch and single view
const SleeperReportPageWrapper = ({ plantName, onBack }) => {
    return (
        <div className="bg-slate-50 p-6 min-h-screen fade-in">
            <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center no-print">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all font-medium"
                    style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', background: 'white', cursor: 'pointer' }}
                >
                    <span style={{ fontSize: '18px' }}>←</span> Back to Summary
                </button>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-bold shadow-lg"
                    style={{ background: '#059669', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    PDF Download Report
                </button>
            </div>
            <SleeperReportPage plantName={plantName} />
        </div>
    );
};

// Update component tree:
// Change "return <SleeperReportPage ... />" to use the wrapper in single view
// But first I need to redefine SleeperMauReport to handle the switch correctly.
// I'll wrap the logic within SleeperMauReport.

export default SleeperMauReport;


