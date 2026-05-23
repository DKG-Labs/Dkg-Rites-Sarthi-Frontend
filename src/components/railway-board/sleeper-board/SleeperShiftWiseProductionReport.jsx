import React, { useState } from 'react';
import { ExportButton, downloadExcel, SearchableDropdown } from '../SharedComponents';

const SleeperShiftWiseProductionReport = () => {
    const [manufacturer, setManufacturer] = useState('All Manufacturers');
    const [plant, setPlant] = useState('All Plants');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const mockManufacturers = ['All Manufacturers', 'STP Ltd.', 'Indian Hume Pipe', 'Vekas Sleeper', 'Kusum Sleepers'];
    const mockPlants = ['All Plants', 'Plant-1 (Kolkata)', 'Plant-2 (Raipur)', 'Plant-3 (Hyderabad)'];

    const manufacturerOptions = mockManufacturers.map(m => ({ label: m, value: m }));
    const plantOptions = mockPlants.map(p => ({ label: p, value: p }));

    const mockData = [
        { 
            date: '2024-05-10', 
            shift: 'Shift-A', 
            lineShed: 'Line-01', 
            batches: 12, 
            totalSleepers: 480, 
            types: 'W-60 (240), W-52 (240)', 
            rejProcess: 5, 
            rejFinal: 2, 
            etSleepers: 10 
        },
        { 
            date: '2024-05-10', 
            shift: 'Shift-B', 
            lineShed: 'Line-01', 
            batches: 10, 
            totalSleepers: 400, 
            types: 'W-60 (400)', 
            rejProcess: 8, 
            rejFinal: 4, 
            etSleepers: 15 
        },
        { 
            date: '2024-05-11', 
            shift: 'Shift-A', 
            lineShed: 'Line-02', 
            batches: 15, 
            totalSleepers: 600, 
            types: 'W-60 (300), W-RT (300)', 
            rejProcess: 3, 
            rejFinal: 1, 
            etSleepers: 5 
        },
    ];

    return (
        <div className="report-content fade-in">
            <div className="prof-card" style={{ marginBottom: '20px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div className="sec-title" style={{ color: '#1e40af', fontWeight: 'bold', fontSize: '16px', margin: 0 }}>
                        Record - Shift Wise Production (Sleeper)
                    </div>
                    <ExportButton onClick={() => {
                        const headers = [
                            { label: 'Date', key: 'date' },
                            { label: 'Shift', key: 'shift' },
                            { label: 'Line / Shed No.', key: 'lineShed' },
                            { label: 'No. of Batches', key: 'batches' },
                            { label: 'No. of Sleepers', key: 'totalSleepers' },
                            { label: 'Sleeper Types & Counts', key: 'types' },
                            { label: 'Rej. (Process)', key: 'rejProcess' },
                            { label: 'Rej. (Final)', key: 'rejFinal' },
                            { label: 'ET Sleepers', key: 'etSleepers' }
                        ];
                        downloadExcel(mockData, headers, 'Sleeper_Shift_Wise_Production_Report');
                    }} />
                </div>
                
                {/* Filters Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Manufacturer</label>
                        <SearchableDropdown 
                            value={manufacturer}
                            onChange={(val) => setManufacturer(val)}
                            options={manufacturerOptions}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Plant</label>
                        <SearchableDropdown 
                            value={plant}
                            onChange={(val) => setPlant(val)}
                            options={plantOptions}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>From Date</label>
                        <input 
                            type="date" 
                            className="prof-search" 
                            style={{ width: '100%', height: '38px' }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>To Date</label>
                        <input 
                            type="date" 
                            className="prof-search" 
                            style={{ width: '100%', height: '38px' }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="prof-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Shift</th>
                                <th>Line / Shed No.</th>
                                <th className="text-right">No. of Batches</th>
                                <th className="text-right">No. of Sleepers</th>
                                <th>Sleeper Types & Counts</th>
                                <th className="text-right">Rej. (Process)</th>
                                <th className="text-right">Rej. (Final)</th>
                                <th className="text-right">ET Sleepers</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockData.map((row, i) => (
                                <tr key={i} className={i % 2 === 0 ? 'row-odd' : 'row-even'}>
                                    <td>{row.date}</td>
                                    <td><span className="prof-badge" style={{ background: '#eff6ff', color: '#1e40af' }}>{row.shift}</span></td>
                                    <td style={{ fontWeight: '600' }}>{row.lineShed}</td>
                                    <td className="text-right">{row.batches}</td>
                                    <td className="text-right" style={{ fontWeight: 'bold' }}>{row.totalSleepers}</td>
                                    <td style={{ fontSize: '12px', color: '#475569' }}>{row.types}</td>
                                    <td className="text-right" style={{ color: '#dc2626' }}>{row.rejProcess}</td>
                                    <td className="text-right" style={{ color: '#b91c1c', fontWeight: 'bold' }}>{row.rejFinal}</td>
                                    <td className="text-right" style={{ color: '#0891b2' }}>{row.etSleepers}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SleeperShiftWiseProductionReport;
