import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useShift } from '../../context/ShiftContext';
import RMDrillDownView from './RMDrillDownView';
import './RMInventoryManagement.css';

const RM_CATEGORIES = [
    { id: 'cement', name: 'Cement (OPC-53)', moduleId: 6, unit: 'MT', color: '#8b5cf6', capacity: 500 },
    { id: 'hts', name: 'HTS Wire', moduleId: 5, unit: 'Coils', color: '#ef4444', capacity: 100 },
    { id: 'aggregate', name: 'Aggregates', moduleId: 8, unit: 'MT', color: '#3b82f6', capacity: 1200 },
    { id: 'sgci', name: 'SGCI Inserts', moduleId: 9, unit: 'Nos', color: '#10b981', capacity: 10000 },
    { id: 'dowel', name: 'Dowels', moduleId: 10, unit: 'Nos', color: '#f59e0b', capacity: 5000 },
    { id: 'admixture', name: 'Admixture', moduleId: 7, unit: 'L', color: '#eab308', capacity: 5000 }
];

const RMInventoryManagement = () => {
    const { dutyUnit, userId } = useShift();
    const effectiveUserId = userId || localStorage.getItem('userId');
    const [loading, setLoading] = useState(false);
    const [inventoryData, setInventoryData] = useState([]);
    const [pendingVerifications, setPendingVerifications] = useState({});
    const [selectedRm, setSelectedRm] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Fetch stock data (fast)
            const [cementRes, htsRes, aggregateRes, sgciRes] = await Promise.all([
                apiService.getAllCementInventory().catch(() => ({ responseData: [] })),
                apiService.getAllHtsWireInventory().catch(() => ({ responseData: [] })),
                apiService.getAllAggregateInventory().catch(() => ({ responseData: [] })),
                apiService.getAllSgciInventory().catch(() => ({ responseData: [] })),
            ]);

            const calcStock = (res) => {
                const items = res?.responseData || [];
                return items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
            };

            const stockMap = {
                'cement': calcStock(cementRes),
                'hts': calcStock(htsRes),
                'aggregate': calcStock(aggregateRes),
                'sgci': calcStock(sgciRes),
                'dowel': 4500, // Mock for missing API
                'admixture': 2300 // Mock for missing API
            };

            // Set initial data with stocks (pending = 0)
            const initialData = RM_CATEGORIES.map(cat => {
                const stock = stockMap[cat.id] || 0;
                return {
                    ...cat,
                    currentStock: stock,
                    pendingProcurement: 0,
                    pendingConsumption: Math.floor(Math.random() * 3), // Mock data for missing Consumption API
                    status: stock < (cat.capacity * 0.2) ? 'Low' : 'OK'
                };
            });
            setInventoryData(initialData);
            setLoading(false); // Render immediately!

            // 2. Fetch pending workflow transitions asynchronously
            (async () => {
                try {
                    const pendingRes = await apiService.getAllPendingWorkflowTransitions('IE', effectiveUserId, dutyUnit);
                    const pendingList = Array.isArray(pendingRes) ? pendingRes : (pendingRes?.responseData || []);
                    
                    const pendingCounts = {};
                    pendingList.forEach(item => {
                        pendingCounts[item.moduleId] = (pendingCounts[item.moduleId] || 0) + 1;
                    });

                    setInventoryData(prev => prev.map(cat => ({
                        ...cat,
                        pendingProcurement: pendingCounts[cat.moduleId] || 0
                    })));
                } catch (error) {
                    console.error("Failed to load pending transitions:", error);
                }
            })();

        } catch (error) {
            console.error("Failed to load inventory data:", error);
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading Inventory Data...</div>;
    }

    return (
        <div className="rm-inventory-dashboard fade-in">
            <div className="dashboard-header">
                <h3>RM Inventory Management System</h3>
            </div>

            <div className="ie-sub-nav-grid scrollbar-hide" style={{ paddingBottom: '16px', borderBottom: 'none', marginBottom: selectedRm ? '24px' : '0', display: 'flex', overflowX: 'auto', flexWrap: 'nowrap', gap: '16px' }}>
                {inventoryData.map(item => {
                    const isActive = selectedRm?.id === item.id;
                    return (
                        <div 
                            key={item.id} 
                            className={`ie-sub-nav-card ${isActive ? 'active' : ''}`} 
                            style={{ borderLeft: `4px solid ${item.color}`, flex: 1, minWidth: 0, padding: '10px 12px' }}
                            onClick={() => setSelectedRm(isActive ? null : item)}
                        >
                            <div className="card-icon-wrapper" style={{ background: `${item.color}15`, color: item.color }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                            </div>
                            
                            <div className="card-info" style={{ flexGrow: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h3 className="ie-sub-nav-card-title" style={{ fontSize: '0.75rem' }}>{item.name}</h3>
                                    <span className={`status-badge ${item.status === 'Low' ? 'low' : 'ok'}`} style={{ fontSize: '0.55rem' }}>
                                        {item.status}
                                    </span>
                                </div>
                                
                                <div className="stock-value" style={{ margin: '4px 0', fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>
                                    {item.currentStock.toLocaleString()} <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '600' }}>{item.unit}</span>
                                </div>

                                <div className="pv-card-stats" style={{ marginTop: '0' }}>
                                    <div className="pv-stat-row-summary" style={{ gap: '12px' }}>
                                        <span className="stat-v" style={{ color: item.pendingProcurement > 0 ? '#d97706' : '#64748b' }}>
                                            Proc: {item.pendingProcurement}
                                        </span>
                                        <span className="stat-p" style={{ color: item.pendingConsumption > 0 ? '#1d4ed8' : '#64748b' }}>
                                            Cons: {item.pendingConsumption}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedRm && (
                <div className="fade-in" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                    <RMDrillDownView 
                        rmCategory={selectedRm} 
                        onBack={() => setSelectedRm(null)} 
                    />
                </div>
            )}
        </div>
    );
};

export default RMInventoryManagement;
