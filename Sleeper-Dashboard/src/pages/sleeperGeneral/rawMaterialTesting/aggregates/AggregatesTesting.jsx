
import React, { useState } from 'react';
import { useShift } from '../../../../context/ShiftContext';
import { useToast } from '../../../../context/ToastContext';
import EnhancedDataTable from '../../../../components/common/EnhancedDataTable';
import CrushingImpactAbrasion10mm from './CrushingImpactAbrasion10mm';
import CrushingImpactAbrasion20mm from './CrushingImpactAbrasion20mm';
import CombinedFlakinessElongation from './CombinedFlakinessElongation';
import CombinedGranulometricCurve from './CombinedGranulometricCurve';
import SoundnessTestForm from './SoundnessTestForm';
import { MOCK_INVENTORY, MOCK_AGGREGATES_HISTORY } from '../../../../utils/rawMaterialMockData';
import { 
    getAggregateBulkStatus, 
    getAggregate10mmQualityByReqId, 
    getAggregate20mmQualityByReqId,
    getPeriodicAggregate10mmQuality,
    getPeriodicAggregate20mmQuality,
    getPeriodicAggregateFlakiness,
    getPeriodicAggregateGranulometric,
    getPeriodicAggregateSoundness,
    deletePeriodicRecord
} from '../../../../services/workflowService';
import TrendChart from '../../../../components/common/TrendChart';
import '../cement/CementForms.css';

const AGGREGATE_TABS = [
    { id: 1, label: '10mm Quality' },
    { id: 2, label: '20mm Quality' },
    { id: 3, label: 'Flakiness & Elongation' },
    { id: 4, label: 'Granulometric Curve' },
    { id: 5, label: 'Soundness Test' }
];

const SubCard = ({ id, title, color, count, label, isActive, onClick }) => (
    <div
        className={`asset-card ${isActive ? 'active' : ''}`}
        onClick={onClick}
        style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderTopWidth: '4px',
            borderTopColor: color,
            borderRightColor: isActive ? color : '#e2e8f0',
            borderBottomColor: isActive ? color : '#e2e8f0',
            borderLeftColor: isActive ? color : '#e2e8f0',
            '--active-color-alpha': `${color}15`,
            cursor: 'pointer',
            flex: '1',
            minWidth: '200px'
        }}
    >
        <div className="asset-card-header">
            <div>
                <h4 className="asset-card-title" style={{ color: '#64748b', fontSize: '10px' }}>{title}</h4>
                <div className="asset-card-count" style={{ fontSize: count === 'N/A' ? '1.1rem' : '1.5rem', margin: '4px 0', fontWeight: count === 'N/A' ? '400' : '700' }}>{count}</div>
            </div>
        </div>
        <div className="asset-card-label" style={{ color: color, fontSize: '9px', fontWeight: '700' }}>{label}</div>
    </div>
);

const AggregateTesting = ({ onBack, inventoryData = [] }) => {
    const toast = useToast();
    const [viewMode, setViewMode] = useState('new-stocks');
    const [showForm, setShowForm] = useState(false);
    const [activeFormSection, setActiveFormSection] = useState(1);
    const [initialType, setInitialType] = useState("New Inventory");
    const [history, setHistory] = useState(MOCK_AGGREGATES_HISTORY.map(item => ({
        ...item,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    })));

    const pendingStocks = inventoryData;

    const [periodicHistory, setPeriodicHistory] = useState([]);

    const [statusMap, setStatusMap] = useState({});
    const [activeRequestId, setActiveRequestId] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editItem, setEditItem] = useState(null);

    React.useEffect(() => {
        const fetchStatus = async () => {
            if (pendingStocks.length > 0) {
                const reqIds = pendingStocks.map(s => s.requestId);
                const statuses = await getAggregateBulkStatus(reqIds);
                setStatusMap(statuses);

                const fetchedHistory = [];
                for (const stock of pendingStocks) {
                    if (statuses[stock.requestId] === 'Completed') {
                        const agg10 = await getAggregate10mmQualityByReqId(stock.requestId);
                        const agg20 = await getAggregate20mmQualityByReqId(stock.requestId);
                        fetchedHistory.push({
                            id: stock.requestId,
                            requestId: stock.requestId,
                            testDate: (agg10?.testDate || agg20?.testDate || new Date().toISOString()).substring(0, 10),
                            consignmentNo: stock.consignmentNo,
                            lotNo: stock.lotNo || (stock.details?.batchDetails && stock.details.batchDetails[0]?.mtcNo) || 'N/A',
                            crushing: agg10?.crushingValue || agg20?.crushingValue || '-',
                            impact: agg10?.impactValue || agg20?.impactValue || '-',
                            testType: 'New Inventory',
                            createdAt: agg10?.createdAt || agg20?.createdAt || new Date().toISOString()
                        });
                    }
                }
                
                if (fetchedHistory.length > 0) {
                    setHistory(prev => {
                        const existingIds = new Set(prev.map(p => p.id));
                        const newRecords = fetchedHistory.filter(f => !existingIds.has(f.id));
                        const combined = [...newRecords, ...prev];
                        return combined.sort((a,b) => {
                            const dateA = new Date(a.testDate || 0);
                            const dateB = new Date(b.testDate || 0);
                            if (dateB - dateA !== 0) return dateB - dateA;
                            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                        });
                    });
                }
            }
        };
        fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingStocks]);

    React.useEffect(() => {
        const fetchPeriodic = async () => {
            try {
                const [agg10, agg20, flakiness, granulometric, soundness] = await Promise.all([
                    getPeriodicAggregate10mmQuality(),
                    getPeriodicAggregate20mmQuality(),
                    getPeriodicAggregateFlakiness(),
                    getPeriodicAggregateGranulometric(),
                    getPeriodicAggregateSoundness()
                ]);

                // Consolidation logic: Group by consignmentNo and testDate
                const consolidated = {};

                const processList = (list, sourceId) => {
                    list.forEach(item => {
                        const key = `${item.consignmentNo}_${(item.testDate || '').substring(0, 10)}`;
                        if (!consolidated[key]) {
                            consolidated[key] = {
                                id: item.id,
                                consignmentNo: item.consignmentNo,
                                testDate: item.testDate,
                                testType: 'Periodic',
                                createdAt: item.createdAt,
                                formEntries: {}
                            };
                        }
                        consolidated[key].formEntries[sourceId] = item;
                        
                        // Summary fields mapping
                        if (sourceId === 1) consolidated[key].crushing10 = item.crushingValue || item.impactValue || item.abrasionValue || '-';
                        if (sourceId === 2) consolidated[key].crushing20 = item.crushingValue || item.impactValue || item.abrasionValue || '-';
                        if (sourceId === 3) {
                            const v10 = item.combinedIndex10mm;
                            const v20 = item.combinedIndex20mm;
                            if (v10 && v20) consolidated[key].flakiness = `${v10}% / ${v20}%`;
                            else consolidated[key].flakiness = v10 || v20 || item.combinedIndex || item.flakiness || '-';
                        }
                        if (sourceId === 5) consolidated[key].soundness = item.result || item.soundness || '-';
                    });
                };

                processList(agg10, 1);
                processList(agg20, 2);
                processList(flakiness, 3);
                processList(granulometric, 4);
                processList(soundness, 5);

                setPeriodicHistory(Object.values(consolidated).sort((a,b) => {
                    const dateA = new Date(a.testDate || 0);
                    const dateB = new Date(b.testDate || 0);
                    if (dateB - dateA !== 0) return dateB - dateA;
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                }));
            } catch (err) {
                console.error("Failed to fetch aggregate periodic data:", err);
            }
        };
        fetchPeriodic();
    }, []);

    const canModify = (createdAt) => {
        if (!createdAt) return false;
        const entryTime = new Date(createdAt).getTime();
        const now = new Date().getTime();
        return (now - entryTime) < (24 * 60 * 60 * 1000); // 24 hours for testing
    };

    const handleSaveTest = (completedSectionId, savedData) => {
        if (initialType === "Periodic") {
            let currentRecord = editItem;
            
            // If new but consignment already exists in history, pick it up
            if (!currentRecord && savedData?.consignmentNo) {
                const existing = periodicHistory.find(h => h.consignmentNo === savedData.consignmentNo);
                if (existing) currentRecord = existing;
            }

            const updatedEntries = { ...(currentRecord?.formEntries || {}) };
            if (savedData) updatedEntries[completedSectionId] = savedData;

            const updatedData = {
                testDate: savedData?.testDate || currentRecord?.testDate || new Date().toISOString().split('T')[0],
                consignmentNo: savedData?.consignmentNo || currentRecord?.consignmentNo || 'N/A',
                createdAt: currentRecord?.createdAt || new Date().toISOString(),
                formEntries: updatedEntries
            };

            // Map aggregate form summary results
            if (completedSectionId === 1) {
                const cVal = savedData?.crushingValue10 || savedData?.crushingValue || '-';
                updatedData.crushing10 = String(cVal).replace('%', '') + '%';
            }
            if (completedSectionId === 2) {
                const cVal = savedData?.crushingValue20 || savedData?.crushingValue || '-';
                updatedData.crushing20 = String(cVal).replace('%', '') + '%';
            }
            if (completedSectionId === 3) {
                const fVal = savedData?.combinedIndex20mm || savedData?.combinedIndex || savedData?.flakiness || '-';
                updatedData.flakiness = String(fVal).replace('%', '') + '%';
            }
            if (completedSectionId === 5) updatedData.soundness = savedData?.result || savedData?.soundness || '-';

            if (currentRecord && currentRecord.id) {
                setPeriodicHistory(prev => {
                    const updated = prev.map(r => r.id === currentRecord.id ? { ...r, ...updatedData } : r);
                    return updated.sort((a,b) => {
                        const dateA = new Date(a.testDate || 0);
                        const dateB = new Date(b.testDate || 0);
                        if (dateB - dateA !== 0) return dateB - dateA;
                        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                    });
                });
                setEditItem({ ...currentRecord, ...updatedData });
            } else {
                const newRecord = {
                    id: Date.now(),
                    testType: 'Periodic',
                    crushing10: '-', crushing20: '-', flakiness: '-', soundness: '-',
                    ...updatedData
                };
                setPeriodicHistory(prev => {
                    const combined = [newRecord, ...prev];
                    return combined.sort((a,b) => {
                        const dateA = new Date(a.testDate || 0);
                        const dateB = new Date(b.testDate || 0);
                        if (dateB - dateA !== 0) return dateB - dateA;
                        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                    });
                });
                setEditItem(newRecord);
            }
        }
 
        // Standardized routing to next section or close if last
        const sectionId = Number(completedSectionId);
        const currentIndex = AGGREGATE_TABS.findIndex(s => s.id === sectionId);

        console.log(`Aggregates Save Triggered - Section: ${completedSectionId} (Mapped ID: ${sectionId}), Index: ${currentIndex}`);

        if (currentIndex !== -1 && currentIndex < AGGREGATE_TABS.length - 1) {
            const nextSectionId = AGGREGATE_TABS[currentIndex + 1].id;
            console.log(`Routing from aggregates section ${sectionId} to ${nextSectionId}`);
            setActiveFormSection(nextSectionId);
        } else if (currentIndex !== -1) {
            console.log(`Final aggregates section ${sectionId} completed. Closing form.`);
            setShowForm(false);
            setEditItem(null);
            setInitialType("New Inventory");
        } else {
            console.warn(`Could not determine next section for aggregates sectionId: ${completedSectionId}. Staying on current section.`);
        }
    };

    const handleDelete = async (row, isPeriodic = false) => {
        if (window.confirm('Are you sure you want to delete this record?')) {
            try {
                if (isPeriodic) {
                    const deletePromises = [];
                    const endpointMap = {
                        1: 'aggregate-10mm-quality',
                        2: 'aggregate-20mm-quality',
                        3: 'aggregate-flakiness',
                        4: 'aggregate-granulometric',
                        5: 'aggregate-soundness'
                    };
                    
                    Object.keys(row.formEntries || {}).forEach(sectionId => {
                        const id = row.formEntries[sectionId].id;
                        if (id) {
                            deletePromises.push(deletePeriodicRecord(endpointMap[sectionId], id));
                        }
                    });
                    
                    await Promise.all(deletePromises);
                    setPeriodicHistory(prev => prev.filter(h => h.id !== row.id));
                    toast.success("Periodic record deleted successfully.");
                } else {
                    setHistory(prev => prev.filter(h => h.id !== row.id));
                    toast.info("Inventory record removed from local history.");
                }
            } catch (err) {
                console.error("Deletion error:", err);
                toast.error(err.message || "Failed to delete record. Please try again.");
            }
        }
    };

    const inventoryColumns = [
        { key: 'vendor', label: 'Registered Vendor' },
        { key: 'consignmentNo', label: 'Challan No.', isHeaderHighlight: true },
        { 
            key: 'aggregateType', 
            label: 'Material Type',
            render: (_, row) => row.details?.gradeSpec || row.aggregateType || 'N/A'
        },
        { key: 'receivedDate', label: 'Arrival Date' },
        {
            key: 'testingStatus',
            label: 'Status',
            render: (_, row) => {
                const status = statusMap[row.requestId] || 'Pending';
                const color = status === 'Completed' ? '#10b981' : '#f59e0b';
                return <span style={{ color, fontWeight: 'bold' }}>{status}</span>;
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => {
                const status = statusMap[row.requestId] || 'Pending';
                return (
                    <button
                        className="btn-action mini"
                        onClick={() => {
                            setActiveRequestId(row.requestId);
                            setEditItem(null); // Clear periodic state
                            setInitialType("New Inventory");
                            setActiveFormSection(1);
                            setShowForm(true);
                            setEditMode(false);
                        }}
                    >
                        {status === 'Completed' ? 'Modify test details' : 'Add Test Detail'}
                    </button>
                );
            }
        }
    ];

    const historyColumns = [
        { key: 'testDate', label: 'Date', render: (val) => val ? val.split('-').reverse().join('/') : '' },
        { key: 'consignmentNo', label: 'Consignment' },
        { key: 'lotNo', label: 'Lot' },
        { key: 'crushing', label: 'Crushing (%)' },
        { key: 'impact', label: 'Impact (%)' },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => {
                const editable = canModify(row.createdAt);
                return (
                    <div className="btn-group-center" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                            className={`btn-action mini ${!editable ? 'disabled-btn' : ''}`}
                            disabled={!editable}
                            onClick={() => {
                                setActiveRequestId(row.requestId);
                                setEditItem(null); // Clear periodic state
                                setActiveFormSection(1);
                                setInitialType("New Inventory");
                                setShowForm(true);
                                setEditMode(true);
                            }}
                        >
                            Modify
                        </button>
                        <button
                            className={`btn-action mini danger ${!editable ? 'disabled-btn' : ''}`}
                            disabled={!editable}
                            onClick={() => handleDelete(row)}
                        >
                            Delete
                        </button>
                    </div>
                );
            }
        }
    ];

    const periodicColumns = [
        { key: 'testDate', label: 'Date', render: (val) => val ? val.split('-').reverse().join('/') : '' },
        { key: 'consignmentNo', label: 'Consignment' },
        { 
            key: 'crushing10', 
            label: 'Crushing 10mm',
            render: (_, row) => {
                const val = row.crushingValue10 || row.crushing10 || (row.formEntries?.[1]?.crushingValue);
                if (!val) return '-';
                return `${String(val).replace('%', '')}%`;
            }
        },
        { 
            key: 'crushing20', 
            label: 'Crushing 20mm',
            render: (_, row) => {
                const val = row.crushingValue20 || row.crushing20 || (row.formEntries?.[2]?.crushingValue);
                if (!val) return '-';
                return `${String(val).replace('%', '')}%`;
            }
        },
        { 
            key: 'flakiness', 
            label: 'Flakiness (%)',
            render: (_, row) => {
                const val = row.combinedIndex20mm || row.combinedIndex || row.flakiness;
                if (!val) return '-';
                return `${String(val).replace('%', '')}%`;
            }
        },
        { 
            key: 'soundness', 
            label: 'Soundness',
            render: (_, row) => row.soundness || row.result || '-'
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <div className="btn-group-center" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                        className="btn-action mini"
                        onClick={() => {
                            setInitialType("Periodic");
                            setActiveRequestId(null); // Clear inventory state
                            setActiveFormSection(1);
                            setEditItem(row);
                            setEditMode(true);
                            setShowForm(true);
                        }}
                    >
                        Modify
                    </button>
                    <button
                        className="btn-action mini danger"
                        onClick={() => handleDelete(row, true)}
                    >
                        Delete
                    </button>
                </div>
            )
        }
    ];

    const renderActiveForm = () => {
        const props = {
            inventoryData,
            onSave: (data) => handleSaveTest(activeFormSection, data),
            onCancel: () => setShowForm(false),
            initialType: initialType,
            activeRequestId: activeRequestId,
        };

        const fallbackData = editItem ? { ...editItem, id: undefined } : null;

        switch (activeFormSection) {
            case 1: 
                return (
                    <CrushingImpactAbrasion10mm 
                        key={activeFormSection}
                        {...props} 
                        onSave={(data) => handleSaveTest(1, data)}
                        editId={initialType === "Periodic" ? editItem?.formEntries?.[1]?.id : null} 
                        editData={initialType === "Periodic" ? (editItem?.formEntries?.[1] || fallbackData) : fallbackData} 
                    />
                );
            case 2: 
                return (
                    <CrushingImpactAbrasion20mm 
                        key={activeFormSection}
                        {...props} 
                        onSave={(data) => handleSaveTest(2, data)}
                        editId={initialType === "Periodic" ? editItem?.formEntries?.[2]?.id : null} 
                        editData={initialType === "Periodic" ? (editItem?.formEntries?.[2] || fallbackData) : fallbackData} 
                    />
                );
            case 3: 
                return (
                    <CombinedFlakinessElongation 
                        key={activeFormSection}
                        {...props} 
                        onSave={(data) => handleSaveTest(3, data)}
                        editId={initialType === "Periodic" ? editItem?.formEntries?.[3]?.id : null} 
                        editData={initialType === "Periodic" ? (editItem?.formEntries?.[3] || fallbackData) : fallbackData} 
                    />
                );
            case 4: 
                return (
                    <CombinedGranulometricCurve 
                        key={activeFormSection}
                        {...props} 
                        onSave={(data) => handleSaveTest(4, data)}
                        editId={initialType === "Periodic" ? editItem?.formEntries?.[4]?.id : null} 
                        editData={initialType === "Periodic" ? (editItem?.formEntries?.[4] || fallbackData) : fallbackData} 
                    />
                );
            case 5: 
                return (
                    <SoundnessTestForm 
                        key={activeFormSection}
                        {...props} 
                        onSave={(data) => handleSaveTest(5, data)}
                        editId={initialType === "Periodic" ? editItem?.formEntries?.[5]?.id : null} 
                        editData={initialType === "Periodic" ? (editItem?.formEntries?.[5] || fallbackData) : fallbackData} 
                    />
                );
            default: return null;
        }
    };


    return (
        <div className="aggregate-testing-root cement-forms-scope fade-in">
            <div className="content-title-row" style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: 0 }}>Aggregate Quality Control</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="toggle-btn mini" onClick={() => { 
                        setInitialType("Periodic");
                        setActiveRequestId(null); // Clear inventory state
                        setActiveFormSection(1); 
                        setEditMode(false);
                        setEditItem(null);
                        setShowForm(true); 
                    }}>+ Add New (Periodic)</button>
                    <button className="toggle-btn secondary mini" onClick={onBack}>Back to Dashboard</button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
                <SubCard id="stats" title="Analytics" color="#42818c" count="N/A" label="Statistics" isActive={viewMode === 'stats'} onClick={() => setViewMode('stats')} />
                <SubCard
                    id="new-stocks"
                    title="Inventory"
                    color="#f59e0b"
                    count={pendingStocks.filter(s => statusMap[s.requestId] !== 'Completed').length}
                    label="Pending for Test"
                    isActive={viewMode === 'new-stocks'}
                    onClick={() => setViewMode('new-stocks')}
                />
                <SubCard id="history" title="Historical" color="#10b981" count={history.length} label="Quality Logs" isActive={viewMode === 'history'} onClick={() => setViewMode('history')} />
                <SubCard id="periodic" title="Periodic Testing" color="#8b5cf6" count={periodicHistory.length} label="Periodic Logs" isActive={viewMode === 'periodic'} onClick={() => setViewMode('periodic')} />
            </div>

            <div className="view-layer">
                {viewMode === 'stats' && (
                    <div className="table-outer-wrapper fade-in" style={{ padding: '24px' }}>
                        <TrendChart
                            data={history}
                            xKey="testDate"
                            lines={[
                                { key: 'crushing', color: '#ef4444', label: 'Crushing Value' },
                                { key: 'impact', color: '#f59e0b', label: 'Impact Value' }
                            ]}
                            title="Aggregate Quality Trends"
                            description="Historical crushing and impact resistance (%)"
                            yAxisLabel="%"
                        />
                    </div>
                )}

                {viewMode === 'new-stocks' && (
                    <div className="table-outer-wrapper fade-in">
                        <div className="content-title-row" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', marginBottom: 0 }}>
                            <h4 style={{ margin: 0 }}>Verified Inventory Pending Testing</h4>
                        </div>
                        <EnhancedDataTable columns={inventoryColumns.filter(c => c.key !== 'testingStatus')} data={pendingStocks.filter(s => statusMap[s.requestId] !== 'Completed')} />
                    </div>
                )}

                {viewMode === 'history' && (
                    <div className="table-outer-wrapper fade-in">
                        <div className="content-title-row" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', marginBottom: 0 }}>
                            <h4 style={{ margin: 0 }}>Historical Aggregate Quality Logs</h4>
                        </div>
                        <EnhancedDataTable columns={historyColumns} data={history} />
                    </div>
                )}

                {viewMode === 'periodic' && (
                    <div className="table-outer-wrapper fade-in">
                        <div className="content-title-row" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', marginBottom: 0 }}>
                            <h4 style={{ margin: 0 }}>Periodic Testing Logs</h4>
                        </div>
                        <EnhancedDataTable columns={periodicColumns} data={periodicHistory} />
                    </div>
                )}
            </div>

            {showForm && (
                <div className="form-modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="form-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '80%', width: '80%' }}>
                        <div className="form-modal-header">
                            <span className="form-modal-header-title">Aggregate Quality Test Record</span>
                            <button className="form-modal-close" onClick={() => setShowForm(false)}>✕</button>
                        </div>

                        <div style={{ background: '#ffffff', padding: '12px 24px', borderBottom: '1px solid #e5e7eb' }}>
                            <div className="nav-tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
                                {AGGREGATE_TABS.map(s => (
                                    <button
                                        key={s.id}
                                        className={`nav-tab ${activeFormSection === s.id ? 'active' : ''}`}
                                        onClick={() => setActiveFormSection(s.id)}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-modal-body" style={{ background: '#f8fafc' }}>
                            {renderActiveForm()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AggregateTesting;
