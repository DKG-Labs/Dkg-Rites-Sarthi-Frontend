import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './SleeperSummary.css';

const SleeperMauReport = () => {
    const [selectedPlant, setSelectedPlant] = useState(null);

    // Mock Data
    const mauData = [
        { id: 1, plantName: 'Patil Industry - Kargi Road', inspectedBy: 'CRIO', production: 25000, acceptance: 24200, processRej: 300, finalRej: 500, rejPct: 3.2 },
        { id: 2, plantName: 'Patil Industry - Wadiyaram', inspectedBy: 'SRIO', production: 18000, acceptance: 17500, processRej: 200, finalRej: 300, rejPct: 2.8 },
        { id: 3, plantName: 'Concrete Sleepers India', inspectedBy: 'NRIO', production: 32000, acceptance: 31000, processRej: 400, finalRej: 600, rejPct: 3.1 },
    ];

    const defectData = [
        { name: 'Visual Demoulding', value: 35, color: '#10b981' },
        { name: 'Dimension Demoulding', value: 25, color: '#3b82f6' },
        { name: 'Final Visual', value: 20, color: '#f59e0b' },
        { name: 'Final Critical', value: 10, color: '#ef4444' },
        { name: 'Other', value: 10, color: '#8b5cf6' },
    ];

    const monthlyData = [
        { month: 'April 2024', prod: 8500, acc: 8250, rej: 250 },
        { month: 'May 2024', prod: 9200, acc: 8900, rej: 300 },
        { month: 'June 2024', prod: 7300, acc: 7050, rej: 250 },
    ];

    const openModal = (plant) => setSelectedPlant(plant);
    const closeModal = () => setSelectedPlant(null);

    return (
        <div className="sleeper-report-container animate-up">
            <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span>Monthly Analysis of Units (Sleeper)</span>
                <input type="text" placeholder="Search Plant..." className="prof-search" style={{ height: '36px', fontSize: '13px' }} />
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
                            <tr key={row.id} className={idx % 2 === 0 ? 'row-odd' : 'row-even'} onClick={() => openModal(row)} style={{ cursor: 'pointer' }}>
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

            {/* Modal Overlay */}
            {selectedPlant && (
                <div className="prof-modal-overlay fade-in" onClick={closeModal}>
                    <div className="prof-modal-content slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Analysis for {selectedPlant.plantName}</h3>
                            <button className="close-btn" onClick={closeModal}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="g2">
                                <div className="prof-card">
                                    <h4 className="card-title-sm">Defect Analysis Contribution</h4>
                                    <div style={{ width: '100%', height: '250px' }}>
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie
                                                    data={defectData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {defectData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="prof-card">
                                    <h4 className="card-title-sm">Monthly Production Profile</h4>
                                    <div className="table-responsive mt-2">
                                        <table className="prof-table sm">
                                            <thead>
                                                <tr>
                                                    <th>MONTH</th>
                                                    <th className="text-right">PROD</th>
                                                    <th className="text-right">ACC</th>
                                                    <th className="text-right">REJ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {monthlyData.map((m, i) => (
                                                    <tr key={i}>
                                                        <td>{m.month}</td>
                                                        <td className="text-right">{m.prod.toLocaleString()}</td>
                                                        <td className="text-right text-emerald-600">{m.acc.toLocaleString()}</td>
                                                        <td className="text-right text-red-500">{m.rej}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-reset" onClick={closeModal}>Close Analysis</button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .prof-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                }
                .prof-modal-content {
                    background: white;
                    border-radius: 20px;
                    width: 80%;
                    max-width: 900px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    padding: 24px;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #f1f5f9;
                }
                .modal-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1e293b;
                }
                .close-btn {
                    background: #f1f5f9;
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    font-size: 20px;
                    cursor: pointer;
                    color: #64748b;
                }
                .prof-table.sm th, .prof-table.sm td {
                    padding: 8px 12px;
                    font-size: 12px;
                }
            `}} />
        </div>
    );
};

export default SleeperMauReport;
