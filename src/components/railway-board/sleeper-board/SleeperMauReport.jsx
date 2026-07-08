import React, { useState, useEffect } from 'react';
import reportService from '../../../services/reportService';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import ExcelJS from 'exceljs/dist/exceljs.min.js';
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

const extractPlantId = (plantName) => {
    if (!plantName) return '';
    const colonIndex = plantName.indexOf(':');
    if (colonIndex !== -1) {
        return plantName.substring(colonIndex).trim();
    }
    // Fallback: split by hyphen and take last part if no colon is found
    const parts = plantName.split(' - ');
    if (parts.length > 1) {
        return parts[parts.length - 1].trim();
    }
    return plantName;
};

const getShortName = (name) => {
    if (!name) return "";
    let short = name
        .replace(/Visual Checking[:]?/gi, 'VC:')
        .replace(/Dimension Checking[:]?/gi, 'DC:')
        .replace(/Previously/gi, 'Prev')
        .replace(/Rejected/gi, 'Rej')
        .replace(/Surface/gi, 'Surf')
        .replace(/Damage/gi, 'Dmg')
        .replace(/Missing/gi, 'Miss')
        .replace(/Position/gi, 'Pos')
        .replace(/Between/gi, 'b/w')
        .replace(/ToeGap/gi, 'TG')
        .replace(/Length of Sleeper/gi, 'Len')
        .replace(/Width of Sleeper/gi, 'Wid')
        .replace(/Camber Check/gi, 'Camber')
        .replace(/Location/gi, 'Loc')
        .replace(/Checking/gi, 'Chk')
        .replace(/Sleeper/gi, 'Slp')
        .replace(/Insert/gi, 'Ins')
        .trim();
    
    short = short.replace(/^[:\s-]+/, '');
    
    // If it still has a colon, try to be even more concise
    if (short.includes(':')) {
        const parts = short.split(':');
        const prefix = parts[0].length > 3 ? parts[0].substring(0, 3) : parts[0];
        short = prefix + ':' + parts[1].trim();
    }

    if (short.length > 14) {
        return short.substring(0, 12) + "..";
    }
    return short;
};

const formatDisplayName = (name) => {
    if (!name) return "";
    // Hides code like ":41647" but keeps the location after "/"
    // Example: "PATIL... - :41647/Pahtri" -> "PATIL... - Pahtri"
    return name.replace(/:[0-9]+\//g, '').replace(/:[0-9]+/g, '');
};

const SleeperReportPage = ({ plantName }) => {
    const [performanceData, setPerformanceData] = useState([]);
    const [defectData, setDefectData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const plantId = extractPlantId(plantName);
                const [perfRes, defectRes] = await Promise.all([
                    reportService.getManufacturerPerformance(plantId),
                    reportService.getProcessDefectDistribution(plantId)
                ]);

                const perfBase = perfRes.responseData || perfRes || {};
                const defectBase = defectRes.responseData || defectRes || {};
                
                const perfArray = perfBase.monthlyPerformance || (Array.isArray(perfBase) ? perfBase : []);
                const defectArray = defectBase.defects || (Array.isArray(defectBase) ? defectBase : []);
                
                setPerformanceData(perfArray);
                setDefectData(defectArray);
                
                setSummaryData({
                    inspected: perfBase.totalInspected ?? 0,
                    rejected: perfBase.totalRejected ?? 0,
                    avgRejPct: perfBase.averageRejectionPercentage ?? 0
                });
            } catch (error) {
                console.error("Error fetching plant report data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [plantName]);

    const [summaryData, setSummaryData] = useState({ inspected: 0, rejected: 0, avgRejPct: 0 });

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

    if (loading) {
        return (
            <div className="bg-white p-20 shadow-sm rounded-lg mx-auto text-center" style={{ maxWidth: '1000px', background: 'white' }}>
                <div className="spinner-small" style={{ margin: '0 auto 15px', width: '32px', height: '32px', border: '4px solid #f3f3f3', borderTop: '4px solid #10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ color: '#64748b', fontWeight: '600' }}>Loading Performance Analysis...</p>
            </div>
        );
    }

    return (
        <div className="bg-white px-8 pb-12 pt-8 shadow-sm rounded-lg mx-auto print-container" style={{ maxWidth: '1000px', background: 'white', borderRadius: '12px', marginBottom: '20px' }}>
            <div className="text-center mb-10">
                <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '-0.5px', marginBottom: '4px' }}>{formatDisplayName(plantName)}</h2>
                <p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Manufacturer Performance Analysis (Monthly)</p>
                <div style={{ height: '4px', width: '40px', background: '#10b981', margin: '16px auto', borderRadius: '2px' }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '20px' }}>Process Defect Distribution</h3>
                    <div style={{ width: '100%', height: '420px' }}>
                        {defectData.length > 0 ? (
                            <PieChart width={400} height={420} margin={{ left: 5, right: 5 }}>
                                <Pie
                                    data={defectData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    minAngle={15}
                                    paddingAngle={2}
                                    dataKey="defectCount"
                                    nameKey="defectName"
                                    isAnimationActive={false}
                                    label={({ cx, cy, midAngle, outerRadius, defectName, percentage }) => {
                                        const RADIAN = Math.PI / 180;
                                        const radius = outerRadius + 30;
                                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                        return (
                                            <text x={x} y={y} fill="#475569" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="7.5" fontWeight="800">
                                                {`${getShortName(defectName)} ${(percentage || 0).toFixed(1)}%`}
                                            </text>
                                        );
                                    }}
                                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                                >
                                    {defectData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        ) : (
                            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
                                No defect distribution data available
                            </div>
                        )}
                    </div>
                    <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', width: '100%', padding: '0 10px' }}>
                        {defectData.map((d, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'start', gap: '6px', fontSize: '9px', fontWeight: '600', color: '#475569', lineHeight: '1.1' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: COLORS[i % COLORS.length], marginTop: '3px', flexShrink: 0 }}></div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getShortName(d.defectName)}</span>
                                    <span style={{ color: '#94a3b8', fontSize: '8px' }}>{d.defectCount} Nos ({(d.percentage || 0).toFixed(1)}%)</span>
                                </div>
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
                                {performanceData.length > 0 ? (
                                    performanceData.map((m, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px', fontWeight: '700', color: '#1e293b' }}>{m.month}</td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>{(Number(m.inspectedNos) || 0).toLocaleString()}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>{(Number(m.rejectedNos) || 0).toLocaleString()}</td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                                <span style={{ padding: '2px 8px', background: '#fef2f2', color: '#b91c1c', borderRadius: '4px', fontWeight: '800' }}>{(Number(m.rejectionPercentage) || 0).toFixed(2)}%</span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No monthly performance data</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '30px' }}>
                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                            <p style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>Inspected (Nos.)</p>
                            <p style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b' }}>{(summaryData.inspected || 0).toLocaleString()}</p>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                            <p style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>Rejected (Nos.)</p>
                            <p style={{ fontSize: '16px', fontWeight: '900', color: '#dc2626' }}>{(summaryData.rejected || 0).toLocaleString()}</p>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                            <p style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>Avg% Rej</p>
                            <p style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b' }}>{(summaryData.avgRejPct || 0).toFixed(2)}%</p>
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

const SleeperMauReport = ({ startDate, endDate, mauData: propMauData, loading: propLoading }) => {
    const [selectedPlant, setSelectedPlant] = useState(null);
    const [batchReportData, setBatchReportData] = useState(null);
    const [isPreparingBatchPdf, setIsPreparingBatchPdf] = useState(false);
    const [batchProgress, setBatchProgress] = useState(0);
    const [mauData, setMauData] = useState(propMauData || []);
    const [loading, setLoading] = useState(propLoading || false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'plantName', direction: 'asc' });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Sync state with props if provided by parent
    useEffect(() => {
        if (propMauData) setMauData(propMauData);
    }, [propMauData]);

    useEffect(() => {
        if (propLoading !== undefined) setLoading(propLoading);
    }, [propLoading]);

    useEffect(() => {
        // Only fetch locally if data isn't provided via props
        if (propMauData) return;

        const fetchMauData = async () => {
            if (!startDate || !endDate) return;
            setLoading(true);
            try {
                const response = await reportService.getSleeperMonthlyAnalysis({ startDate, endDate });
                const data = response.responseData || response || [];
                setMauData(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching sleeper MAU data:", error);
                setMauData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMauData();
    }, [startDate, endDate, propMauData]);

    // Sort data first
    const sortedData = [...mauData].sort((a, b) => {
        const { key, direction } = sortConfig;
        let valA = a[key];
        let valB = b[key];

        // Handle numeric values
        if (key === 'production' || key === 'acceptance' || key === 'processRejection' || key === 'finalRejection' || key === 'rejectionPercentage') {
            valA = Number(valA) || 0;
            valB = Number(valB) || 0;
            return direction === 'asc' ? valA - valB : valB - valA;
        }

        // Handle string values (case insensitive)
        if (key === 'plantName') {
            valA = String(formatDisplayName(valA) || '').trim().toLowerCase();
            valB = String(formatDisplayName(valB) || '').trim().toLowerCase();
        } else {
            valA = String(valA || '').trim().toLowerCase();
            valB = String(valB || '').trim().toLowerCase();
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Filtered data based on search
    const filteredData = sortedData.filter(plant =>
        (plant.plantName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plant.inspectedBy || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Mock Data for the Main Table
    // Excel Export Utility
    const downloadExcel = async (data, headers, filename) => {
        if (!data || data.length === 0) return;
        const displayTitle = filename.replace(/_/g, ' ');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Report');

        const titleRow = worksheet.addRow([displayTitle]);
        titleRow.font = { bold: true, size: 14 };
        if (headers.length > 1) {
            worksheet.mergeCells(1, 1, 1, headers.length);
        }

        worksheet.addRow([]);
        
        const headerRow = worksheet.addRow(headers.map(h => h.label));
        headerRow.font = { bold: true };
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
            cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });

        data.forEach(row => {
            const rowData = headers.map(header => {
                let val = row[header.key];
                return (val === null || val === undefined) ? '' : val;
            });
            worksheet.addRow(rowData);
        });

        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                let columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxLength) maxLength = columnLength;
            });
            column.width = maxLength < 10 ? 10 : maxLength + 2;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
                                    { label: 'Process Rejection', key: 'processRejection' },
                                    { label: 'Final Rejection', key: 'finalRejection' },
                                    { label: '% Rejection', key: 'rejectionPercentage' }
                                ],
                                'Sleeper_MAU_Summary'
                            )}
                        />
                        <ExportButton
                            label={isPreparingBatchPdf ? `Preparing (${batchProgress}/${mauData.length})...` : "Batch PDF Report"}
                            disabled={isPreparingBatchPdf || mauData.length === 0}
                            variant="green"
                            onClick={handleBatchPrint}
                        />
                        <input
                            type="text"
                            placeholder="Search Plant..."
                            className="prof-search"
                            style={{ height: '36px', fontSize: '13px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive prof-card">
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>
                            <div className="spinner-small" style={{ margin: '0 auto 10px', width: '24px', height: '24px', border: '3px solid #f3f3f3', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            Fetching Sleeper Analysis Data...
                        </div>
                    ) : (
                        <table className="prof-table">
                            <thead>
                                <tr>
                                    <th style={{ cursor: 'default' }}>S.NO.</th>
                                    <th onClick={() => handleSort('plantName')} style={{ cursor: 'pointer' }}>
                                        PLANT NAME
                                    </th>
                                    <th onClick={() => handleSort('inspectedBy')} style={{ cursor: 'pointer' }}>
                                        INSPECTED BY
                                    </th>
                                    <th onClick={() => handleSort('production')} style={{ cursor: 'pointer' }} className="text-right">
                                        PRODUCTION (NOS.)
                                    </th>
                                    <th onClick={() => handleSort('acceptance')} style={{ cursor: 'pointer' }} className="text-right">
                                        ACCEPTANCE (NOS.)
                                    </th>
                                    <th onClick={() => handleSort('processRejection')} style={{ cursor: 'pointer' }} className="text-right">
                                        PROCESS REJECTION
                                    </th>
                                    <th onClick={() => handleSort('finalRejection')} style={{ cursor: 'pointer' }} className="text-right">
                                        FINAL REJECTION
                                    </th>
                                    <th onClick={() => handleSort('rejectionPercentage')} style={{ cursor: 'pointer' }} className="text-right">
                                        % REJECTION
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length > 0 ? (
                                    filteredData.map((row, idx) => (
                                        <tr key={idx} className={idx % 2 === 0 ? 'row-odd' : 'row-even'} onClick={() => setSelectedPlant(row)} style={{ cursor: 'pointer' }}>
                                            <td>{idx + 1}</td>
                                            <td className="font-bold text-blue-700">{formatDisplayName(row.plantName)}</td>
                                            <td><span className="prof-badge" style={{ background: '#f0f9ff', color: '#075985' }}>{row.inspectedBy}</span></td>
                                            <td className="text-right">{(row.production || 0).toLocaleString()}</td>
                                            <td className="text-right text-emerald-600 font-bold">{(row.acceptance || 0).toLocaleString()}</td>
                                            <td className="text-right">{(row.processRejection || 0).toLocaleString()}</td>
                                            <td className="text-right">{(row.finalRejection || 0).toLocaleString()}</td>
                                            <td className="text-right">
                                                <span className="prof-badge" style={{ background: '#fff7ed', color: '#9a3412' }}>{Number(row.rejectionPercentage || 0).toFixed(2)}%</span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No data found for the selected dates.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                {/* CSS for spinner */}
                <style>{`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
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


