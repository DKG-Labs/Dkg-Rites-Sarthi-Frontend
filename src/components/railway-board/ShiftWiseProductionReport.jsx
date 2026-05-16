import React, { useState } from 'react';
import { ExportButton, downloadExcel } from './SharedComponents';

const ShiftWiseProductionReport = () => {
    const [manufacturer, setManufacturer] = useState('All Manufacturers');
    const [place, setPlace] = useState('All Places');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const mockManufacturers = ['All Manufacturers', 'Adinath Industries', 'Calcutta Springs', 'Prakash Metallic', 'Royal Fasteners'];
    const mockPlaces = ['All Places', 'Kolkata', 'Raipur', 'Hyderabad', 'Chennai'];

    const mockData = [
        { date: '2024-05-10', shift: 'Shift-A', rlyPoSr: 'NR - RP-2024-001 - 01', lot: 'LOT-55', prodShearing: 5000, prodTempering: 4800, accTempering: 4750, rejShift: 50 },
        { date: '2024-05-10', shift: 'Shift-B', rlyPoSr: 'NR - RP-2024-001 - 01', lot: 'LOT-55', prodShearing: 4500, prodTempering: 4400, accTempering: 4350, rejShift: 50 },
        { date: '2024-05-11', shift: 'Shift-A', rlyPoSr: 'WR - RP-2024-005 - 02', lot: 'LOT-62', prodShearing: 6000, prodTempering: 5900, accTempering: 5800, rejShift: 100 },
        { date: '2024-05-11', shift: 'Shift-C', rlyPoSr: 'SR - RP-2024-012 - 03', lot: 'LOT-18', prodShearing: 3000, prodTempering: 2950, accTempering: 2900, rejShift: 50 },
    ];

    return (
        <div className="report-content fade-in">
            <div className="prof-card" style={{ marginBottom: '20px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div className="sec-title" style={{ color: '#166534', fontWeight: 'bold', fontSize: '16px', margin: 0 }}>
                        Shift Wise Production Report - ERC
                    </div>
                    <ExportButton onClick={() => {
                        const headers = [
                            { label: 'Date', key: 'date' },
                            { label: 'Shift', key: 'shift' },
                            { label: 'Rly + PO Number + Sr.No.', key: 'rlyPoSr' },
                            { label: 'Lot No.', key: 'lot' },
                            { label: 'Production in Shearing', key: 'prodShearing' },
                            { label: 'Production in Tempering', key: 'prodTempering' },
                            { label: 'Accepted Quantity in Tempering', key: 'accTempering' },
                            { label: 'Total Rejection', key: 'rejShift' }
                        ];
                        downloadExcel(mockData, headers, 'Shift_Wise_Production_Report');
                    }} />
                </div>
                
                {/* Filters Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Manufacturer</label>
                        <select 
                            className="prof-select" 
                            style={{ width: '100%' }}
                            value={manufacturer}
                            onChange={(e) => setManufacturer(e.target.value)}
                        >
                            {mockManufacturers.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Place of Inspection</label>
                        <select 
                            className="prof-select" 
                            style={{ width: '100%' }}
                            value={place}
                            onChange={(e) => setPlace(e.target.value)}
                        >
                            {mockPlaces.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
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
                                <th>Rly + PO Number + Sr.No.</th>
                                <th>Lot No.</th>
                                <th className="text-right">Production in Shearing</th>
                                <th className="text-right">Production in Tempering</th>
                                <th className="text-right">Accepted Quantity in Tempering</th>
                                <th className="text-right">Total Rejection</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockData.map((row, i) => (
                                <tr key={i} className={i % 2 === 0 ? 'row-odd' : 'row-even'}>
                                    <td>{row.date}</td>
                                    <td><span className="prof-badge" style={{ background: '#f0f9ff', color: '#075985' }}>{row.shift}</span></td>
                                    <td style={{ fontWeight: '600' }}>{row.rlyPoSr}</td>
                                    <td>{row.lot}</td>
                                    <td className="text-right">{row.prodShearing.toLocaleString()}</td>
                                    <td className="text-right">{row.prodTempering.toLocaleString()}</td>
                                    <td className="text-right" style={{ color: '#16a34a', fontWeight: 'bold' }}>{row.accTempering.toLocaleString()}</td>
                                    <td className="text-right" style={{ color: '#dc2626' }}>{row.rejShift.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ShiftWiseProductionReport;
