
import React, { useState } from 'react';
import EnhancedDataTable from '../../../../components/common/EnhancedDataTable';
import SpecificSurfaceForm from './SpecificSurfaceForm';
import SettingTimeForm from './SettingTimeForm';
import NormalConsistencyForm from './NormalConsistencyForm';
import SevenDayStrengthForm from './SevenDayStrengthForm';
import FinenessTestForm from './FinenessTestForm';
import { MOCK_INVENTORY, MOCK_CEMENT_HISTORY } from '../../../../utils/rawMaterialMockData';
import { 
    getCementBulkStatus, 
    getCementSpecificSurfaceByReqId, 
    getCementNormalConsistencyByReqId, 
    getCementFinenessByReqId,
    getPeriodicCement7DayStrength,
    getPeriodicCementNormalConsistency,
    getPeriodicCementSpecificSurface,
    getPeriodicCementSettingTime,
    getPeriodicCementFineness,
    deletePeriodicRecord
} from '../../../../services/workflowService';
import { useToast } from '../../../../context/ToastContext';
import CollectionAwaitingInspection from '../../../../components/CollectionAwaitingInspection';
import TrendChart from '../../../../components/common/TrendChart';
import './CementForms.css';

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

const CEMENT_TABS = [
    { id: 2, label: 'Normal Consistency' },
    { id: 3, label: 'Specific Surface' },
    { id: 4, label: 'Setting Time' },
    { id: 5, label: 'Fineness Test' },
    { id: 1, label: '7 Day Strength' }
];

const CementTesting = ({ onBack, inventoryData = [] }) => {
    const toast = useToast();
    const [viewMode, setViewMode] = useState('new-stocks'); // Default to new stocks
    const [showForm, setShowForm] = useState(false);
    
    const [activeFormSection, setActiveFormSection] = useState(1);
    const [initialType, setInitialType] = useState("New consignment");
    const [cementHistory, setCementHistory] = useState(MOCK_CEMENT_HISTORY.filter(h => h.testType !== 'Periodic').map(item => ({
        ...item,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    })));
    const [periodicHistory, setPeriodicHistory] = useState([]);

    const [sharedNC, setSharedNC] = useState(null);

    // inventoryData is now passed from parent, already filtered by moduleId and accessibility
    const pendingStocks = inventoryData;

    const [statusMap, setStatusMap] = useState({});
    const [activeRequestId, setActiveRequestId] = useState(null);
    const [editItem, setEditItem] = useState(null);

    React.useEffect(() => {
        const fetchStatus = async () => {
            if (pendingStocks.length > 0) {
                const reqIds = pendingStocks.map(s => s.requestId);
                const statuses = await getCementBulkStatus(reqIds);
                setStatusMap(statuses);

                const fetchedHistory = [];
                for (const stock of pendingStocks) {
                    if (statuses[stock.requestId] === 'Completed') {
                        const nc = await getCementNormalConsistencyByReqId(stock.requestId);
                        const ss = await getCementSpecificSurfaceByReqId(stock.requestId);
                        const fn = await getCementFinenessByReqId(stock.requestId);
                        fetchedHistory.push({
                            id: stock.requestId,
                            requestId: stock.requestId,
                            testDate: (nc?.testDate || ss?.testDate || fn?.testDate || new Date().toISOString()).substring(0, 10),
                            consignmentNo: stock.consignmentNo,
                            lotNo: stock.lotNo || (stock.details?.batchDetails && stock.details.batchDetails[0]?.mtcNo) || 'N/A',
                            surface: ss?.specificSurfaceInfo || '-',
                            consistency: nc?.consistency || '-',
                            soundness: '-', // Placeholder since Soundness API is unlinked
                            fineness: fn?.finenessPercentage || '-',
                            testType: 'New consignment',
                            createdAt: nc?.createdAt || ss?.createdAt || new Date().toISOString()
                        });
                    }
                }
                
                if (fetchedHistory.length > 0) {
                    setCementHistory(prev => {
                        const existingIds = new Set(prev.map(p => p.id));
                        const newRecords = fetchedHistory.filter(f => !existingIds.has(f.id));
                        const combined = [...newRecords, ...prev];
                        // Sort by testDate DESC, then createdAt DESC
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
                const [strength, consistency, surface, setting, fineness] = await Promise.all([
                    getPeriodicCement7DayStrength(),
                    getPeriodicCementNormalConsistency(),
                    getPeriodicCementSpecificSurface(),
                    getPeriodicCementSettingTime(),
                    getPeriodicCementFineness()
                ]);

                // Consolidation logic: Group by consignmentNo and testDate
                const consolidated = {};

                const processList = (list, sourceId) => {
                    list.forEach(item => {
                        const key = `${item.consignmentNo}_${(item.testDate || '').substring(0, 10)}`;
                        if (!consolidated[key]) {
                            consolidated[key] = {
                                id: item.id, // Primary ID for first found record
                                consignmentNo: item.consignmentNo,
                                lotNo: item.lotNo || 'N/A',
                                testDate: item.testDate,
                                testType: 'Periodic',
                                createdAt: item.createdAt,
                                formEntries: {}
                            };
                        }
                        // Store the full item in formEntries by the sourceId for editing
                        consolidated[key].formEntries[sourceId] = item;
                        console.log(`Consolidation [${key}] - Source ${sourceId}: Set ID ${item.id}`);
                        
                        // Map summary fields
                        if (sourceId === 1) consolidated[key].strength = item.cubeResult || item.avgStrength || '-';
                        if (sourceId === 2) {
                            // First try direct field, then fallback to calculating from observations
                            const directVal = item.normalConsistency;
                            if (directVal) {
                                consolidated[key].consistency = directVal;
                            } else if (item.observations && item.observations.length > 0) {
                                // Find the observation where needle reading is 5-7mm
                                const target = item.observations.find(o => o.needleReading >= 5 && o.needleReading <= 7);
                                if (target) consolidated[key].consistency = target.percentWaterAdded;
                            }
                        }
                        if (sourceId === 3) consolidated[key].surface = item.specificSurfaceFm || item.specificSurfaceInfo || '-';
                        if (sourceId === 4) consolidated[key].settingTime = `${item.initialSettingTime || '-'}/${item.finalSettingTime || '-'}`;
                        if (sourceId === 5) consolidated[key].fineness = item.percentageFineness || item.finenessPercentage || '-';
                    });
                };

                processList(strength, 1);
                processList(consistency, 2);
                processList(surface, 3);
                processList(setting, 4);processList(fineness, 5);

                console.log("Final Consolidated Periodic Data:", consolidated);
                const sorted = Object.values(consolidated).sort((a,b) => {
                    const dateA = new Date(a.testDate || 0);
                    const dateB = new Date(b.testDate || 0);
                    if (dateB - dateA !== 0) return dateB - dateA;
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                });
                setPeriodicHistory(sorted);
            } catch (err) {
                console.error("Failed to fetch periodic data:", err);
            }
        };
        fetchPeriodic();
    }, []);

    // Rule: Modify/Delete allowed only for 24 hours from entering
    const canModify = (createdAt) => {
        if (!createdAt) return false;
        const entryTime = new Date(createdAt).getTime();
        const now = new Date().getTime();
        return (now - entryTime) < (24 * 60 * 60 * 1000); 
    };

    const handleSaveTest = (completedSectionId, savedData) => {
        if (initialType === "Periodic") {
            let currentRecord = editItem;
            
            // If no editItem (New Periodic), check if a record for this consignment already exists in history
            if (!currentRecord && savedData?.consignmentNo) {
                const existing = periodicHistory.find(h => h.consignmentNo === savedData.consignmentNo);
                if (existing) currentRecord = existing;
            }

            const updatedEntries = { ...(currentRecord?.formEntries || {}) };
            if (savedData) updatedEntries[completedSectionId] = savedData;

            const updatedData = {
                testDate: savedData?.testDate || currentRecord?.testDate || new Date().toISOString().split('T')[0],
                consignmentNo: savedData?.consignmentNo || currentRecord?.consignmentNo || 'N/A',
                lotNo: savedData?.lotNo || currentRecord?.lotNo || 'N/A',
                createdAt: currentRecord?.createdAt || new Date().toISOString(),
                formEntries: updatedEntries
            };

            // Maintain summary fields for the table columns
            if (completedSectionId === 2) {
                const cVal = savedData?.normalConsistency || savedData?.consistency || '-';
                updatedData.consistency = String(cVal).replace('%', '') + '%';
            }
            if (completedSectionId === 3) updatedData.surface = savedData?.surfaceArea || savedData?.specificSurfaceInfo || '-';
            if (completedSectionId === 4) {
                const it = savedData?.initialSettingTime || savedData?.initialSetting;
                const ft = savedData?.finalSettingTime || savedData?.finalSetting;
                updatedData.settingTime = (it && ft) ? `${it}/${ft}` : (savedData?.settingTime || '-');
            }
            if (completedSectionId === 5) {
                const fVal = savedData?.finenessPercentage || savedData?.finenessPercent || savedData?.fineness || '-';
                updatedData.fineness = String(fVal).replace('%', '') + '%';
            }
            if (completedSectionId === 1) updatedData.strength = savedData?.cubeResult || savedData?.strength7Day || savedData?.strength || '-';

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
                    surface: '-', consistency: '-', settingTime: '-', fineness: '-', strength: '-',
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
 
        // Route to next section or close if last
        const sectionId = Number(completedSectionId);
        const currentIndex = CEMENT_TABS.findIndex(s => s.id === sectionId);
        
        console.log(`Cement Save Triggered - Section: ${completedSectionId} (Mapped ID: ${sectionId}), Index: ${currentIndex}`);

        if (currentIndex !== -1 && currentIndex < CEMENT_TABS.length - 1) {
            const nextSectionId = CEMENT_TABS[currentIndex + 1].id;
            console.log(`Routing from cement section ${sectionId} to ${nextSectionId}`);
            setActiveFormSection(nextSectionId);
        } else if (currentIndex !== -1) {
            console.log(`Final cement section ${sectionId} completed. Closing form.`);
            setShowForm(false);
            setEditItem(null);
            setInitialType("New consignment");
        } else {
            console.warn(`Could not determine next section for cement sectionId: ${completedSectionId}. Staying on current section.`);
        }
    };

    const handleDelete = async (row, isPeriodic = false) => {
        if (window.confirm('Are you sure you want to delete this test record?')) {
            try {
                if (isPeriodic) {
                    // Delete from all available form entries
                    const deletePromises = [];
                    const endpointMap = {
                        1: 'cement-7-day-strength',
                        2: 'cement-normal-consistency',
                        3: 'cement-specific-surface',
                        4: 'cement-setting-time',
                        5: 'cement-fineness'
                    };
                    
                    Object.keys(row.formEntries || {}).forEach(sectionId => {
                        const id = row.formEntries[sectionId].id;
                        if (id) {
                            deletePromises.push(deletePeriodicRecord(endpointMap[sectionId], id));
                        }
                    });
                    
                    await Promise.all(deletePromises);
                    setPeriodicHistory(prev => prev.filter(h => h.id !== row.id));
                    toast.success("Periodic test record deleted successfully.");
                } else {
                    // For "New consignment", we usually don't delete the workflow call here, 
                    // but if it's a test record delete logic:
                    setCementHistory(prev => prev.filter(item => item.id !== row.id));
                    toast.info("Record removed from local history view.");
                }
            } catch (err) {
                console.error("Deletion error:", err);
                toast.error(err.message || "Failed to delete record. Please try again.");
            }
        }
    };

    const inventoryColumns = [
        { key: 'vendor', label: 'Registered Vendor' },
        { key: 'consignmentNo', label: 'Consignment No.', isHeaderHighlight: true },
        {
            key: 'lotNo',
            label: 'Lot / Batch No.',
            render: (_, row) => {
                const batches = row.details?.batchDetails || [];
                if (batches.length > 0) {
                    return batches.map(b => b.mtcNo).join(', ');
                }
                return row.lotNo || row.batchNo || 'N/A';
            }
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
                            setInitialType("New consignment");
                            setActiveFormSection(1);
                            setShowForm(true);
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
        { key: 'surface', label: 'Surface' },
        { key: 'consistency', label: 'Consistency' },
        { key: 'soundness', label: 'Soundness' },
        { key: 'fineness', label: 'Fineness (%)' },
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
                                setInitialType("New consignment");
                                setShowForm(true);
                            }}
                            title={!editable ? "Action expired (24-hour limit)" : ""}
                        >
                            Modify
                        </button>
                        <button
                            className={`btn-action mini danger ${!editable ? 'disabled-btn' : ''}`}
                            disabled={!editable}
                            onClick={() => handleDelete(row)}
                            title={!editable ? "Action expired (24-hour limit)" : ""}
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
            key: 'surface', 
            label: 'Surface',
            render: (_, row) => row.surfaceArea || row.specificSurfaceInfo || row.surface || row.formEntries?.[3]?.surfaceArea || '-'
        },
        { 
            key: 'consistency', 
            label: 'Consistency',
            render: (_, row) => {
                const val = row.normalConsistency || row.consistency || row.percentWaterAdded || row.formEntries?.[2]?.normalConsistency || row.formEntries?.[2]?.consistency;
                if (!val) return '-';
                return `${String(val).replace('%', '')}%`;
            }
        },
        { 
            key: 'settingTime', 
            label: 'Initial/Final ST',
            render: (_, row) => {
                const it = row.initialSettingTime || row.initialSetting || row.formEntries?.[4]?.initialSettingTime;
                const ft = row.finalSettingTime || row.finalSetting || row.formEntries?.[4]?.finalSettingTime;
                if (it && ft) return `${it}/${ft}`;
                return row.settingTime || '-';
            }
        },
        { 
            key: 'fineness', 
            label: 'Fineness (%)',
            render: (_, row) => {
                const val = row.finenessPercentage || row.finenessPercent || row.fineness || row.formEntries?.[5]?.finenessPercentage || row.formEntries?.[5]?.finenessPercent;
                if (!val) return '-';
                return `${String(val).replace('%', '')}%`;
            }
        },
        { 
            key: 'strength', 
            label: '7-Day Strength',
            render: (_, row) => row.cubeResult || row.strength7Day || row.strength || row.formEntries?.[1]?.cubeResult || row.formEntries?.[1]?.strength7Day || '-'
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
                            setActiveFormSection(2); // Start with Consistency
                            setEditItem(row);
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
        const activeConsignment = activeRequestId 
            ? pendingStocks.find(s => s.requestId === activeRequestId)
            : null;

        const commonProps = {
            onSave: handleSaveTest,
            onCancel: () => setShowForm(false),
            inventoryData: pendingStocks,
            initialType: initialType,
            activeRequestId: activeRequestId,
            activeConsignmentNo: activeConsignment?.consignmentNo || null
        };

        switch (activeFormSection) {
            case 2:
                return (
                    <NormalConsistencyForm 
                        key={activeFormSection}
                        {...commonProps}
                        onSave={(data) => handleSaveTest(2, data)}
                        editId={initialType === "Periodic" ? editItem?.formEntries?.[2]?.id : null} 
                        editData={initialType === "Periodic" ? (editItem?.formEntries?.[2] || editItem) : editItem} 
                        onValueChange={(val) => setSharedNC(val)} 
                    />
                );
            case 3:
                return (
                    <SpecificSurfaceForm 
                        key={activeFormSection}
                        {...commonProps}
                        onSave={(data) => handleSaveTest(3, data)}
                        editId={initialType === "Periodic" ? editItem?.formEntries?.[3]?.id : null} 
                        editData={initialType === "Periodic" ? (editItem?.formEntries?.[3] || editItem) : editItem} 
                    />
                );
            case 4:
                return (
                    <SettingTimeForm 
                        key={activeFormSection}
                        {...commonProps}
                        onSave={(data) => handleSaveTest(4, data)}
                        editId={initialType === "Periodic" ? editItem?.formEntries?.[4]?.id : null} 
                        editData={initialType === "Periodic" ? (editItem?.formEntries?.[4] || editItem) : editItem} 
                        sharedNC={sharedNC} 
                    />
                );
            case 5:
                return (
                    <FinenessTestForm 
                        key={activeFormSection}
                        {...commonProps}
                        onSave={(data) => handleSaveTest(5, data)}
                        editId={initialType === "Periodic" ? editItem?.formEntries?.[5]?.id : null} 
                        editData={initialType === "Periodic" ? (editItem?.formEntries?.[5] || editItem) : editItem} 
                    />
                );
            case 1:
                return (
                    <SevenDayStrengthForm 
                        key={activeFormSection}
                        {...commonProps}
                        onSave={(data) => handleSaveTest(1, data)}
                        editId={initialType === "Periodic" ? editItem?.formEntries?.[1]?.id : null} 
                        editData={initialType === "Periodic" ? (editItem?.formEntries?.[1] || editItem) : editItem} 
                        sharedNC={sharedNC} 
                    />
                );
            default:
                return null;
        }
    };


    return (
        <div className="cement-testing-root cement-forms-scope fade-in">
            <div className="content-title-row" style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: 0 }}>Cement Quality Control</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="toggle-btn mini" onClick={() => { 
                        setInitialType("Periodic");
                        setActiveRequestId(null); // Clear inventory state
                        setActiveFormSection(2); // Reset to first tab for Periodic
                        setEditItem(null);
                        setShowForm(true); 
                    }}>+ Add New (Periodic)</button>
                    <button className="toggle-btn secondary mini" onClick={onBack}>Back to Dashboard</button>
                </div>
            </div>

            {/* Sub-Card Navigation */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
                <SubCard
                    id="stats"
                    title="Analytics"
                    color="#42818c"
                    count="N/A"
                    label="Statistics"
                    isActive={viewMode === 'stats'}
                    onClick={() => setViewMode('stats')}
                />
                <SubCard
                    id="new-stocks"
                    title="Inventory"
                    color="#f59e0b"
                    count={pendingStocks.filter(s => statusMap[s.requestId] !== 'Completed').length}
                    label="Pending for Test"
                    isActive={viewMode === 'new-stocks'}
                    onClick={() => setViewMode('new-stocks')}
                />
                <SubCard
                    id="periodic"
                    title="Periodic Testing"
                    color="#8b5cf6"
                    count={periodicHistory.length}
                    label="Periodic Logs"
                    isActive={viewMode === 'periodic'}
                    onClick={() => setViewMode('periodic')}
                />
                <SubCard
                    id="history"
                    title="Historical"
                    color="#10b981"
                    count={cementHistory.length}
                    label="Quality Logs"
                    isActive={viewMode === 'history'}
                    onClick={() => setViewMode('history')}
                />
            </div>

            {/* Dynamic Content */}
            <div className="view-layer">
                {viewMode === 'stats' && (
                    <div className="table-outer-wrapper fade-in" style={{ padding: '24px' }}>
                        <TrendChart
                            data={cementHistory}
                            xKey="testDate"
                            lines={[
                                { key: 'surface', color: '#3b82f6', label: 'Specific Surface' },
                                { key: 'initialSetting', color: '#8b5cf6', label: 'Initial Setting Time' }
                            ]}
                            title="Cement Quality Performance"
                            description="Historical specific surface and setting time analysis"
                            yAxisLabel=""
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
                            <h4 style={{ margin: 0 }}>Historical Cement Quality Logs</h4>
                        </div>
                        <EnhancedDataTable columns={historyColumns} data={cementHistory} />
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

            {/* Form Modal */}
            {showForm && (
                <div className="form-modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="form-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '80%', width: '80%' }}>
                        <div className="form-modal-header">
                            <span className="form-modal-header-title">Cement Quality Test Record</span>
                            <button className="form-modal-close" onClick={() => setShowForm(false)}>✕</button>
                        </div>

                        <div style={{ background: '#ffffff', padding: '12px 24px', borderBottom: '1px solid #e5e7eb' }}>
                            <div className="nav-tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
                                {CEMENT_TABS.map(s => (
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


export default CementTesting;
