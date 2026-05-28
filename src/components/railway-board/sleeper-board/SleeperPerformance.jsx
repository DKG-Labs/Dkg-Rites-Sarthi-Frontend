import React, { useState, useMemo, useEffect } from 'react';
import './SleeperSummary.css';
import reportService from '../../../services/reportService';
import { ExportButton, downloadExcel } from '../SharedComponents';

const SleeperPerformance = ({ fromDate, toDate }) => {
    const [performanceData, setPerformanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRio, setSelectedRio] = useState('All');
    const [selectedStage, setSelectedStage] = useState('All');
    const [selectedIe, setSelectedIe] = useState('All');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Format suryaprakash.baghel to Suryaprakash Baghel
    const formatIeName = (name) => {
        if (!name || name === 'N/A' || name === 'null') return 'N/A';
        return name
            .split('.')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Load data from API when dates change
    useEffect(() => {
        const fetchPerformanceData = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await reportService.getSleeperEmployeePerformance({
                    startDate: fromDate,
                    endDate: toDate
                });
                
                const rawList = response.responseData || response || [];
                const mappedData = rawList.map((row, idx) => ({
                    id: idx + 1,
                    companyName: row.companyName || "N/A",
                    plantName: row.plantName || row.companyName || "Unassigned Plant",
                    plantId: row.plantId || "N/A",
                    rio: row.rio || "N/A",
                    ieName: formatIeName(row.ieName),
                    stage: row.stageOfInspection || "Process",
                    shift: row.shift || "N/A",
                    shiftsWorked: row.shiftsWorked ?? 0,
                    rejectedQty: row.rejectedSleepers ?? 0
                }));
                
                setPerformanceData(mappedData);
            } catch (err) {
                console.error("Failed to fetch sleeper employee performance matrix:", err);
                setError(err.message || "Failed to retrieve performance monitoring matrix data.");
            } finally {
                setLoading(false);
            }
        };

        if (fromDate && toDate) {
            fetchPerformanceData();
        }
    }, [fromDate, toDate]);

    // Extract unique filter items dynamically
    const uniqueRios = useMemo(() => {
        const rios = performanceData.map(d => d.rio).filter(rio => rio && rio !== 'N/A');
        return ["All", ...new Set(rios)];
    }, [performanceData]);

    const uniqueStages = useMemo(() => {
        const stages = performanceData.map(d => d.stage).filter(stg => stg && stg !== 'N/A');
        return ["All", ...new Set(stages)];
    }, [performanceData]);

    const uniqueIes = useMemo(() => {
        const ies = performanceData.map(d => d.ieName).filter(ie => ie && ie !== 'N/A');
        return ["All", ...new Set(ies)];
    }, [performanceData]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filter and sort computation
    const processedData = useMemo(() => {
        let result = [...performanceData];

        // 1. Text Search Filter
        if (searchTerm) {
            const lowerSearch = searchTerm.trim().toLowerCase();
            result = result.filter(d => 
                String(d.companyName || '').toLowerCase().includes(lowerSearch) ||
                String(d.plantName || '').toLowerCase().includes(lowerSearch) ||
                String(d.plantId || '').toLowerCase().includes(lowerSearch) ||
                String(d.ieName || '').toLowerCase().includes(lowerSearch) ||
                String(d.rio || '').toLowerCase().includes(lowerSearch) ||
                String(d.stage || '').toLowerCase().includes(lowerSearch) ||
                String(d.shift || '').toLowerCase().includes(lowerSearch)
            );
        }

        // 2. Dropdown Filters
        if (selectedRio !== 'All') {
            result = result.filter(d => d.rio === selectedRio);
        }
        if (selectedStage !== 'All') {
            result = result.filter(d => d.stage === selectedStage);
        }
        if (selectedIe !== 'All') {
            result = result.filter(d => d.ieName === selectedIe);
        }

        // 3. Sort logic
        if (sortConfig.key !== null) {
            result.sort((a, b) => {
                let valA = a[sortConfig.key];
                let valB = b[sortConfig.key];

                if (typeof valA === 'string') {
                    valA = valA.toLowerCase();
                    valB = valB.toLowerCase();
                }

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [performanceData, searchTerm, selectedRio, selectedStage, selectedIe, sortConfig]);

    // KPI Metrics calculation
    const totalShifts = useMemo(() => processedData.reduce((sum, d) => sum + d.shiftsWorked, 0), [processedData]);
    const totalRejections = useMemo(() => processedData.reduce((sum, d) => sum + d.rejectedQty, 0), [processedData]);
    const averageRejections = useMemo(() => {
        if (totalShifts === 0) return 0;
        return (totalRejections / totalShifts).toFixed(2);
    }, [totalShifts, totalRejections]);

    if (loading) {
        return (
            <div className="sleeper-report-container animate-up" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px' }}>
                <div className="text-center">
                    <div className="spinner-border text-emerald-600 mb-3" style={{ width: '3rem', height: '3rem' }}></div>
                    <p className="text-slate-500 font-medium">Fetching Performance Monitoring Matrix...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="sleeper-report-container animate-up" style={{ padding: '20px' }}>
                <div className="alert alert-danger" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', padding: '15px', borderRadius: '8px' }}>
                    <h5 style={{ fontWeight: 'bold', marginBottom: '8px' }}>⚠️ Data Fetch Error</h5>
                    <p style={{ margin: 0, fontSize: '14px' }}>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="sleeper-report-container animate-up">
            {/* Header section */}
            <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span>Performance Monitoring Matrix (Sleeper)</span>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <ExportButton onClick={() => {
                        const headers = [
                            { label: 'S.No.', key: 'id' },
                            { label: 'Company Name', key: 'companyName' },
                            { label: 'PSC Sleeper Plant', key: 'plantName' },
                            { label: 'Plant ID', key: 'plantId' },
                            { label: 'RITES RIO', key: 'rio' },
                            { label: 'IE Name', key: 'ieName' },
                            { label: 'Stage of Inspection', key: 'stage' },
                            { label: 'Shift', key: 'shift' },
                            { label: 'No. of Shifts Worked', key: 'shiftsWorked' },
                            { label: 'No. of Sleepers Rejected', key: 'rejectedQty' }
                        ];
                        downloadExcel(processedData, headers, 'Sleeper_Performance_Monitoring_Matrix');
                    }} />
                    <input 
                        type="text" 
                        placeholder="Search Plant, IE..." 
                        className="prof-search" 
                        style={{ height: '36px', fontSize: '13px' }} 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Filters section */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px', background: '#f8fafc', padding: '12px 20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#166534' }}>RITES RIO:</label>
                    <select 
                        value={selectedRio} 
                        onChange={(e) => setSelectedRio(e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid #bbf7d0', borderRadius: '4px', background: '#ecfdf5', color: '#166534', outline: 'none', cursor: 'pointer' }}
                    >
                        {uniqueRios.map(rio => <option key={rio} value={rio}>{rio === 'All' ? 'All RIOs' : rio}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#166534' }}>IE NAME:</label>
                    <select 
                        value={selectedIe} 
                        onChange={(e) => setSelectedIe(e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid #bbf7d0', borderRadius: '4px', background: '#ecfdf5', color: '#166534', outline: 'none', cursor: 'pointer' }}
                    >
                        {uniqueIes.map(ie => <option key={ie} value={ie}>{ie === 'All' ? 'All Engineers' : ie}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#166534' }}>STAGE:</label>
                    <select 
                        value={selectedStage} 
                        onChange={(e) => setSelectedStage(e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid #bbf7d0', borderRadius: '4px', background: '#ecfdf5', color: '#166534', outline: 'none', cursor: 'pointer' }}
                    >
                        {uniqueStages.map(stg => <option key={stg} value={stg}>{stg === 'All' ? 'All Stages' : stg}</option>)}
                    </select>
                </div>
                <button 
                    onClick={() => { setSearchTerm(''); setSelectedRio('All'); setSelectedStage('All'); setSelectedIe('All'); setSortConfig({ key: null, direction: 'asc' }); }}
                    style={{ padding: '6px 14px', background: '#dcfce3', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', marginLeft: 'auto' }}
                >
                    Reset Filters
                </button>
            </div>

            {/* Table wrapper */}
            <div className="table-responsive prof-card mb">
                <table className="prof-table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px', textAlign: 'center' }}>S.NO.</th>
                            <th style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'center' }} onClick={() => handleSort('companyName')}>
                                COMPANY NAME {sortConfig.key === 'companyName' ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                            </th>
                            <th style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'center' }} onClick={() => handleSort('plantName')}>
                                PSC SLEEPER PLANT {sortConfig.key === 'plantName' ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                            </th>
                            <th style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'center' }} onClick={() => handleSort('plantId')}>
                                PLANT ID {sortConfig.key === 'plantId' ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                            </th>
                            <th style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'center' }} onClick={() => handleSort('rio')}>
                                RITES RIO {sortConfig.key === 'rio' ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                            </th>
                            <th style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', textAlign: 'center' }} onClick={() => handleSort('ieName')}>
                                IE NAME {sortConfig.key === 'ieName' ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                            </th>
                            <th style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'center' }} onClick={() => handleSort('stage')}>
                                STAGE OF INSPECTION {sortConfig.key === 'stage' ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                            </th>
                            <th style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'center' }} onClick={() => handleSort('shift')}>
                                SHIFT {sortConfig.key === 'shift' ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                            </th>
                            <th style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'center' }} onClick={() => handleSort('shiftsWorked')}>
                                NO. OF SHIFTS WORKED {sortConfig.key === 'shiftsWorked' ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                            </th>
                            <th style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'center' }} onClick={() => handleSort('rejectedQty')}>
                                NO. OF SLEEPERS REJECTED {sortConfig.key === 'rejectedQty' ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedData.length > 0 ? (
                            processedData.map((row, idx) => (
                                <tr key={row.id} className={idx % 2 === 0 ? 'row-odd' : 'row-even'}>
                                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                    <td style={{ textAlign: 'center' }}>{row.companyName}</td>
                                    <td style={{ textAlign: 'center' }}><strong>{row.plantName}</strong></td>
                                    <td style={{ textAlign: 'center' }}><code style={{ fontSize: '11px' }}>{row.plantId}</code></td>
                                    <td style={{ textAlign: 'center' }}><span className="prof-badge" style={{ background: '#f0fdf4', color: '#166534' }}>{row.rio}</span></td>
                                    <td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>👤 {row.ieName}</td>
                                    <td style={{ textAlign: 'center' }}><span className="prof-badge" style={{ background: '#f0f9ff', color: '#075985' }}>{row.stage}</span></td>
                                    <td style={{ textAlign: 'center' }}><span className="prof-badge" style={{ background: '#eff6ff', color: '#1e40af' }}>{row.shift}</span></td>
                                    <td style={{ textAlign: 'center' }} className="font-medium">{row.shiftsWorked}</td>
                                    <td style={{ textAlign: 'center' }} className="font-bold text-red-600">{row.rejectedQty?.toLocaleString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="10" className="text-center p-8 text-slate-400">No performance records found matching the filter criteria.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Summary statistics KPI box */}
            <div className="mt-4 p-4 prof-card" style={{ background: '#ecfdf5', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    <div className="text-center">
                        <div style={{ color: '#065f46', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Shifts Worked</div>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#047857', marginTop: '4px' }}>
                            {totalShifts}
                        </div>
                    </div>
                    <div style={{ width: '1px', height: '35px', background: '#a7f3d0' }}></div>
                    <div className="text-center">
                        <div style={{ color: '#991b1b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Sleepers Rejected</div>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#b91c1c', marginTop: '4px' }}>
                            {totalRejections.toLocaleString()}
                        </div>
                    </div>
                    <div style={{ width: '1px', height: '35px', background: '#a7f3d0' }}></div>
                    <div className="text-center">
                        <div style={{ color: '#1e40af', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Rejections / Shift</div>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#1d4ed8', marginTop: '4px' }}>
                            {averageRejections}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SleeperPerformance;

/**
 * ============================================================================
 * SLEEPER DASHBOARD - EMPLOYEE WISE PERFORMANCE MATRIX API INTEGRATION NOTES
 * ============================================================================
 * 
 * Endpoint:
 *   GET /api/sleeper-dashboard/employee-wise-performance
 * 
 * Query Parameters:
 *   - startDate (String, Format: "dd/MM/yyyy") (Required)
 *   - endDate (String, Format: "dd/MM/yyyy") (Required)
 * 
 * Expected JSON Response Schema:
 *   {
 *     "responseStatus": {
 *       "statusCode": 200,
 *       "message": "SUCCESS"
 *     },
 *     "responseData": [
 *       {
 *         "companyName": "PATIL RAIL INFRASTRUCTURE PVT LTD",
 *         "plantName": "PATIL HYDERABAD PLANT 1",
 *         "plantId": ":41647/waidiyaram",
 *         "rio": "South",
 *         "ieName": "suryaprakash.baghel",
 *         "stageOfInspection": "Process",
 *         "shift": "A",
 *         "rejectedSleepers": 48,
 *         "shiftsWorked": 5
 *       },
 *       ...
 *     ]
 *   }
 * 
 * Mapped Fields for Component Render:
 *   - S.No. => Row Index + 1
 *   - PSC SLEEPER PLANT => row.plantName || row.companyName || "Unassigned Plant"
 *   - RITES RIO => row.rio || "N/A"
 *   - IE NAME => Formatted row.ieName (capitalized words, dot replaced by space)
 *   - STAGE OF INSPECTION => row.stageOfInspection || "Process"
 *   - NO. OF SHIFTS WORKED => row.shiftsWorked (Fallback: 0)
 *   - NO. OF SLEEPERS REJECTED => row.rejectedSleepers (Fallback: 0)
 * 
 * Export to Excel Columns:
 *   - S.No., PSC Sleeper Plant, RITES RIO, IE Name, Stage of Inspection, Shift, No. of Shifts Worked, No. of Sleepers Rejected
 */
