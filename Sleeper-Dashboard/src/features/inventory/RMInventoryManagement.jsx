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
            // 1. Fetch stock data
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

            // 2. Fetch pending workflow transitions for procurement verification
            const pendingRes = await apiService.getAllPendingWorkflowTransitions('IE', effectiveUserId, dutyUnit);
            const pendingList = Array.isArray(pendingRes) ? pendingRes : (pendingRes?.responseData || []);
            
            const pendingCounts = {};
            pendingList.forEach(item => {
                pendingCounts[item.moduleId] = (pendingCounts[item.moduleId] || 0) + 1;
            });

            // Combine data
            const mappedData = RM_CATEGORIES.map(cat => {
                const stock = stockMap[cat.id] || 0;
                return {
                    ...cat,
                    currentStock: stock,
                    pendingProcurement: pendingCounts[cat.moduleId] || 0,
                    pendingConsumption: Math.floor(Math.random() * 3), // Mock data for missing Consumption API
                    status: stock < (cat.capacity * 0.2) ? 'Low' : 'OK'
                };
            });

            setInventoryData(mappedData);
        } catch (error) {
            console.error("Failed to load inventory data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (selectedRm) {
        return (
            <RMDrillDownView 
                rmCategory={selectedRm} 
                onBack={() => setSelectedRm(null)} 
            />
        );
    }

    if (loading) {
        return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading Inventory Data...</div>;
    }

    return (
        <div className="rm-inventory-dashboard fade-in">
            <div className="dashboard-header">
                <h3>RM Inventory Management System</h3>
                <p>Verify and approve all Raw Material procurement and consumption entries.</p>
            </div>

            <div className="rm-cards-grid">
                {inventoryData.map(item => {
                    const percentage = Math.min(100, (item.currentStock / item.capacity) * 100);
                    return (
                        <div 
                            key={item.id} 
                            className="rm-card hover-lift" 
                            style={{ borderTop: `4px solid ${item.color}` }}
                            onClick={() => setSelectedRm(item)}
                        >
                            <div className="rm-card-header">
                                <h4 className="rm-card-title">{item.name}</h4>
                                <span className={`status-badge ${item.status === 'Low' ? 'low' : 'ok'}`}>
                                    {item.status}
                                </span>
                            </div>
                            
                            <div className="rm-stock-section">
                                <div className="stock-value">
                                    {item.currentStock.toLocaleString()} <span className="unit">{item.unit}</span>
                                </div>
                                <div className="progress-bar-bg">
                                    <div className="progress-bar-fill" style={{ width: `${percentage}%`, backgroundColor: item.color }}></div>
                                </div>
                            </div>

                            <div className="rm-pending-section">
                                <div className="pending-item">
                                    <span className="pending-label">Procurement Verifications</span>
                                    <span className={`pending-count ${item.pendingProcurement > 0 ? 'active' : ''}`}>
                                        {item.pendingProcurement}
                                    </span>
                                </div>
                                <div className="pending-item">
                                    <span className="pending-label">Consumption Verifications</span>
                                    <span className={`pending-count ${item.pendingConsumption > 0 ? 'active-consumption' : ''}`}>
                                        {item.pendingConsumption}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RMInventoryManagement;
