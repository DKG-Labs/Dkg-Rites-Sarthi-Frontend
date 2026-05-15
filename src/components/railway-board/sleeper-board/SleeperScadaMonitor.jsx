import React, { useState, useEffect } from 'react';
import './SleeperSummary.css';

const SCADA_MANUFACTURERS = [
    { label: 'Patil Rail Infrastructure Pvt. Ltd.', value: 'PRIL' }
];

const SCADA_UNITS = [
    { label: 'Wadiyaram Unit', value: 'WDM-U1' }
];

const SCADA_LINES = [
    { label: 'Line 1', value: 'L1' }
];

const SCADA_STAGES = [
    { label: 'VIBRATOR', value: 'VIBRATOR' },
    { label: 'STEAM CUBE', value: 'STEAM CUBE' },
    { label: 'CHAMBER', value: 'CHAMBER' },
    { label: 'WATER CUBE', value: 'WATER CUBE' },
    { label: 'TENSIONING', value: 'TENSIONING' }
];

const ExportButton = ({ onClick }) => (
    <button 
        onClick={onClick}
        style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
        }}
    >
        <i className="fa-solid fa-file-excel"></i> Export Excel
    </button>
);

const Pagination = ({ currentPage, totalPages, start, end, totalCount, onPageChange }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
        <div style={{ fontSize: '13px', color: '#64748b' }}>
            Showing {start + 1} to {end} of {totalCount} entries
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
            <button 
                disabled={currentPage === 0}
                onClick={() => onPageChange(currentPage - 1)}
                style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#fff', cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}
            >
                Prev
            </button>
            <span style={{ padding: '5px 15px', borderRadius: '4px', background: '#10b981', color: '#fff', fontWeight: 'bold' }}>
                {currentPage + 1}
            </span>
            <button 
                disabled={totalPages <= currentPage + 1}
                onClick={() => onPageChange(currentPage + 1)}
                style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#fff', cursor: totalPages <= currentPage + 1 ? 'not-allowed' : 'pointer' }}
            >
                Next
            </button>
        </div>
    </div>
);

const SleeperScadaMonitor = ({ selectedProduct }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [manufacturer, setManufacturer] = useState('');
    const [unit, setUnit] = useState('');
    const [line, setLine] = useState('');
    const [stage, setStage] = useState('');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('No Data');
    const [lastTimestamp, setLastTimestamp] = useState('N/A');

    useEffect(() => {
        const fetchScadaData = async () => {
            if (!manufacturer || !unit || !line || !stage) {
                setData([]);
                setStatus('No Data');
                setLastTimestamp('N/A');
                return;
            }
            
            setLoading(true);
            setError(null);
            
            const apiType = 'SPLR';
            
            const params = new URLSearchParams({
                type: apiType,
                plant: manufacturer,
                plantUnit: unit,
                line: line,
                machine: stage,
                page: currentPage.toString(),
                size: '30'
            });
            
            const baseUrls = ['http://20.168.13.113:8080'];
                
            let success = false;
            let finalData = [];
            
            for (const baseUrl of baseUrls) {
                try {
                    const fullUrl = `${baseUrl}/api/scada/scada-data?${params.toString()}`;
                    const response = await fetch(fullUrl, {
                        headers: {
                            'Content-Type': 'application/json',
                            ...(localStorage.getItem('authToken') && { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` })
                        }
                    });
                    
                    if (response.ok) {
                        const resData = await response.json();
                        finalData = Array.isArray(resData) ? resData : (resData.content || []);
                        success = true;
                        break;
                    }
                } catch (err) {
                    // silent fail to try next URL
                }
            }
            
            if (success) {
                setData(finalData);
                setStatus(finalData.length > 0 ? 'Live' : 'No Data');
                setLastTimestamp(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
            } else {
                setError('Failed to connect to SCADA servers.');
                setStatus('No Data');
                setData([]);
            }
            setLoading(false);
        };

        fetchScadaData();
    }, [manufacturer, unit, line, stage, currentPage]);

    const STAGE_CONFIGS = {
        'VIBRATOR': {
            order: ['time', 'Batch_No', 'Bench_No', 'Running_Bench', 'Vibrator1_RPM', 'Vibrator1_Time', 'Vibrator2_RPM', 'Vibrator2_Time', 'Vibrator3_RPM', 'Vibrator3_Time', 'Vibrator4_RPM', 'Vibrator4_Time', 'Vibrator5_RPM', 'Vibrator5_Time', 'Vibrator6_RPM', 'Vibrator6_Time', 'Vibrator7_RPM', 'Vibrator7_Time', 'Vibrator8_RPM', 'Vibrator8_Time'],
            labels: { 'time': 'Time', 'Batch_No': 'Batch No', 'Bench_No': 'Bench No', 'Running_Bench': 'Running Bench', 'Vibrator1_RPM': 'Vibrator 1 RPM', 'Vibrator1_Time': 'Vibrator 1 Time', 'Vibrator2_RPM': 'Vibrator 2 RPM', 'Vibrator2_Time': 'Vibrator 2 Time', 'Vibrator3_RPM': 'Vibrator 3 RPM', 'Vibrator3_Time': 'Vibrator 3 Time', 'Vibrator4_RPM': 'Vibrator 4 RPM', 'Vibrator4_Time': 'Vibrator 4 Time', 'Vibrator5_RPM': 'Vibrator 5 RPM', 'Vibrator5_Time': 'Vibrator 5 Time', 'Vibrator6_RPM': 'Vibrator 6 RPM', 'Vibrator6_Time': 'Vibrator 6 Time', 'Vibrator7_RPM': 'Vibrator 7 RPM', 'Vibrator7_Time': 'Vibrator 7 Time', 'Vibrator8_RPM': 'Vibrator 8 RPM', 'Vibrator8_Time': 'Vibrator 8 Time' }
        },
        'STEAM CUBE': {
            order: ['time', 'Batch_No', 'Date_Of_Casting', 'LBC_Time', 'Cube_No', 'Type_of_Sleeper', 'Chamber_No', 'Age', 'Weight', 'Load(KN)', 'Strength'],
            labels: { 'time': 'Time', 'Batch_No': 'Batch No', 'Date_Of_Casting': 'Date of Casting', 'LBC_Time': 'LBC Time', 'Cube_No': 'Cube No', 'Type_of_Sleeper': 'Type of Sleeper', 'Chamber_No': 'Chamber No', 'Age': 'Age', 'Weight': 'Weight', 'Load(KN)': 'Load(KN)', 'Strength': 'Strength' }
        },
        'CHAMBER': {
            order: ['time', 'Batch_No', 'Chamber_No', 'Set_Temp', 'Act_Temp', 'Start_Time', 'Cycle_Status'],
            labels: { 'time': 'Time', 'Batch_No': 'Batch No', 'Chamber_No': 'Chamber No', 'Set_Temp': 'Set Temp', 'Act_Temp': 'Act Temp', 'Start_Time': 'Start Time', 'Cycle_Status': 'Cycle Status' }
        },
        'WATER CUBE': {
            order: ['time', 'Batch_No', 'Date_Of_Casting', 'LBC_Time', 'Cube_No', 'Type_of_Sleeper', 'Age', 'Weight', 'Load(KN)', 'Strength'],
            labels: { 'time': 'Time', 'Batch_No': 'Batch No', 'Date_Of_Casting': 'Date of Casting', 'LBC_Time': 'LBC Time', 'Cube_No': 'Cube No', 'Type_of_Sleeper': 'Type of Sleeper', 'Age': 'Age', 'Weight': 'Weight', 'Load(KN)': 'Load(KN)', 'Strength': 'Strength' }
        },
        'TENSIONING': {
            order: ['time', 'Batch_No', 'Bench_No', 'Wire_Length', 'Total_Cross_Section', 'Young_Modulus', '10%_LU', '10%_LL', '10%_RU', '10%_RL', '100%_LU', '100%_LL', '100%_RU', '100%_RL', 'Measured_Elongation', 'Pressed_Load', 'Total_Pressed_Load', 'Final_Load'],
            labels: { 'time': 'Time', 'Batch_No': 'Batch No', 'Bench_No': 'Bench No', 'Wire_Length': 'Wire Length', 'Total_Cross_Section': 'Total Cross Section', 'Young_Modulus': 'Young Modulus', '10%_LU': '10% LU', '10%_LL': '10% LL', '10%_RU': '10% RU', '10%_RL': '10% RL', '100%_LU': '100% LU', '100%_LL': '100% LL', '100%_RU': '100% RU', '100%_RL': '100% RL', 'Measured_Elongation': 'Measured Elongation', 'Pressed_Load': 'Pressed Load', 'Total_Pressed_Load': 'Total Pressed Load', 'Final_Load': 'Final Load' }
        }
    };

    const currentConfig = STAGE_CONFIGS[stage] || { order: ['time'], labels: { 'time': 'Time' } };
    const COLUMN_ORDER = currentConfig.order;
    const COLUMN_LABELS = currentConfig.labels;
    const EXCLUDED_COLUMNS = ['line', 'module', 'plant', 'topic', 'machine', 'host', 'result', 'table'];

    const rawKeys = data.length > 0 
        ? Object.keys(data[0]).filter(key => !EXCLUDED_COLUMNS.includes(key)) 
        : [];

    const columns = [];
    // First, add columns in the specified order
    COLUMN_ORDER.forEach(orderedKey => {
        // Try exact match or case-insensitive match
        const actualKey = rawKeys.find(rk => rk === orderedKey || rk.toLowerCase() === orderedKey.toLowerCase());
        if (actualKey) {
            columns.push(actualKey);
        }
    });

    // Then add any other columns that are not in the order list
    rawKeys.forEach(k => {
        if (!columns.includes(k)) {
            columns.push(k);
        }
    });

    const rowsPerPage = 30;
    const totalPages = data.length === 30 ? currentPage + 2 : currentPage + 1;
    const start = currentPage * rowsPerPage;
    const end = start + data.length;
    const totalElements = data.length === 30 ? (currentPage + 2) * 30 : (currentPage * 30 + data.length);

    const formatTimestamp = (val) => {
        if (!val) return 'N/A';
        return new Date(val).toLocaleString('en-IN', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit', 
            hour12: true 
        });
    };

    const downloadExcel = (data, columns, filename) => {
        if (!data || data.length === 0) return;
        const headers = columns.map(col => COLUMN_LABELS[col] || COLUMN_LABELS[col.toLowerCase()] || col).join(',');
        const rows = data.map(row => 
            columns.map(col => {
                let val = row[col];
                if (col.toLowerCase() === 'time') val = formatTimestamp(val);
                return `"${String(val || '').replace(/"/g, '""')}"`;
            }).join(',')
        ).join('\n');
        
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="sleeper-summary-container fade-in" style={{ padding: '10px 0' }}>
            <div className="prof-card mb" style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #d1fae5', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#166534', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '12px' }}>
                        <i className="fa-solid fa-tower-broadcast" style={{ color: '#10b981' }}></i>
                    </div>
                    SCADA Live Monitor - Sleeper Board
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div className="filter-group">
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Manufacturer</label>
                        <select 
                            value={manufacturer} 
                            onChange={(e) => { setManufacturer(e.target.value); setCurrentPage(0); }}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '13px', color: '#1e293b', fontWeight: '600', outline: 'none' }}
                        >
                            <option value="">Select Manufacturer</option>
                            {SCADA_MANUFACTURERS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unit</label>
                        <select 
                            value={unit} 
                            onChange={(e) => { setUnit(e.target.value); setCurrentPage(0); }}
                            disabled={!manufacturer}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: manufacturer ? '#f8fafc' : '#f1f5f9', fontSize: '13px', color: '#1e293b', fontWeight: '600', outline: 'none', cursor: manufacturer ? 'pointer' : 'not-allowed' }}
                        >
                            <option value="">Select Unit</option>
                            {SCADA_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Line</label>
                        <select 
                            value={line} 
                            onChange={(e) => { setLine(e.target.value); setCurrentPage(0); }}
                            disabled={!unit}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: unit ? '#f8fafc' : '#f1f5f9', fontSize: '13px', color: '#1e293b', fontWeight: '600', outline: 'none', cursor: unit ? 'pointer' : 'not-allowed' }}
                        >
                            <option value="">Select Line</option>
                            {SCADA_LINES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Acquisition Stage</label>
                        <select 
                            value={stage} 
                            onChange={(e) => { setStage(e.target.value); setCurrentPage(0); }}
                            disabled={!line}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: line ? '#f8fafc' : '#f1f5f9', fontSize: '13px', color: '#1e293b', fontWeight: '600', outline: 'none', cursor: line ? 'pointer' : 'not-allowed' }}
                        >
                            <option value="">Select Stage</option>
                            {SCADA_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: status === 'Live' ? '#f0fdf4' : '#f8fafc', borderRadius: '50px' }}>
                            <span style={{
                                width: '10px', height: '10px', borderRadius: '50%', 
                                background: status === 'Live' ? '#22c55e' : '#cbd5e1',
                                display: 'inline-block',
                                animation: status === 'Live' ? 'pulse-green 2s infinite' : 'none'
                            }}></span>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: status === 'Live' ? '#166534' : '#64748b', textTransform: 'uppercase' }}>{status}</span>
                        </div>
                        {status === 'Live' && (
                            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
                                <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '6px' }}></i>
                                Last Feed: <span style={{ color: '#1e293b' }}>{lastTimestamp}</span>
                            </div>
                        )}
                    </div>
                    {data.length > 0 && (
                        <ExportButton 
                            onClick={() => downloadExcel(data, columns, `SCADA_Live_Feed_Sleeper_${stage}_Page_${currentPage + 1}`)}
                        />
                    )}
                </div>
            </div>

            {loading ? (
                <div className="prof-card" style={{ background: '#fff', padding: '60px', borderRadius: '16px', border: '1px solid #d1fae5', textAlign: 'center' }}>
                    <div className="loading-spinner" style={{ width: '48px', height: '48px', border: '5px solid #f0fdf4', borderTopColor: '#10b981', margin: '0 auto 20px' }}></div>
                    <div style={{ fontSize: '16px', color: '#1e293b', fontWeight: '700' }}>Syncing with SCADA Gateway...</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '5px' }}>Fetching real-time industrial data feeds</div>
                </div>
            ) : error ? (
                <div className="prof-card" style={{ background: '#fff', padding: '60px', borderRadius: '16px', border: '1px solid #fee2e2', textAlign: 'center' }}>
                    <div style={{ background: '#fef2f2', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '32px', color: '#ef4444' }}></i>
                    </div>
                    <div style={{ fontSize: '16px', color: '#991b1b', fontWeight: '700' }}>{error}</div>
                    <p style={{ fontSize: '13px', color: '#b91c1c', marginTop: '5px' }}>The SCADA server could not be reached. Please check network connectivity.</p>
                </div>
            ) : data.length > 0 ? (
                <div className="prof-card" style={{ background: '#fff', padding: '0', borderRadius: '16px', border: '1px solid #d1fae5', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="prof-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {columns.map(col => (
                                        <th key={col} style={{ background: '#f8fafc', color: '#64748b', padding: '16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'left', fontWeight: '800', borderBottom: '1px solid #e2e8f0' }}>
                                            {COLUMN_LABELS[col] || COLUMN_LABELS[col.toLowerCase()] || col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, idx) => (
                                    <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                        {columns.map(col => (
                                            <td key={col} style={{ padding: '14px 16px', fontSize: '13px', color: col.toLowerCase() === 'time' ? '#64748b' : '#1e293b', fontWeight: (col === 'PO_No' || col === 'Batch_No') ? '700' : '500' }}>
                                                {col.toLowerCase() === 'time' 
                                                    ? formatTimestamp(row[col]) 
                                                    : typeof row[col] === 'object' 
                                                        ? JSON.stringify(row[col]) 
                                                        : String(row[col])}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#fcfdfd' }}>
                        <Pagination
                            currentPage={currentPage} totalPages={totalPages}
                            start={start} end={end}
                            totalCount={totalElements} onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            ) : (
                <div className="prof-card" style={{ background: '#fff', padding: '80px', borderRadius: '16px', border: '1px solid #d1fae5', textAlign: 'center' }}>
                    <div style={{ background: '#f0fdf4', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <i className="fa-solid fa-microchip" style={{ fontSize: '40px', color: '#10b981' }}></i>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Waiting for Data Source</div>
                    <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '450px', margin: '0 auto' }}>
                        Please select the plant configuration parameters above to initiate the live data stream from the manufacturing floor.
                    </p>
                </div>
            )}

            <style>{`
                @keyframes pulse-green {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                }
                .prof-table tr:hover { background-color: #f0fdf4 !important; }
            `}</style>
        </div>
    );
};

export default SleeperScadaMonitor;
