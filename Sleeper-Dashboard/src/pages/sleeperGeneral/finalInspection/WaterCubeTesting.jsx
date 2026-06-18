import React, { useState, useEffect, useMemo } from 'react';
import EnhancedDataTable from '../../../components/common/EnhancedDataTable';
import WaterCuredCubeForm from './WaterCuredCubeForm';
import { 
    getProductionDeclarations, 
    saveWaterCubeSample, 
    getWaterCubeSamples, 
    deleteWaterCubeSample,
    saveWaterCubeTestResult,
    getWaterCubeTestResultsByUser,
    getAllWaterCubeTests,
    deleteWaterCubeTest,
    updateWaterCubeTest,
    getProductionDeclarationById
} from '../../../services/workflowService';
import { getStoredUser } from '../../../services/authService';
import { useShift } from '../../../context/ShiftContext';

// Helper to handle DD/MM/YYYY or YYYY-MM-DD
const parseDate = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') return null;
    if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/').map(Number);
        return new Date(y, m - 1, d);
    }
    return new Date(dateStr);
};

// Helper to check 15 day eligibility
const checkEligibility = (castingDate) => {
    // Temporary override: allow testing immediately
    return true;
};

// Mock Data for Batches pending declaration
// const MOCK_PENDING_DECLARATION = [
//     { batchNo: 'B-801', date: '2026-01-28', grade: 'M55', sleepers: 160, typesCount: 1 },
//     { batchNo: 'B-802', date: '2026-01-29', grade: 'M60', sleepers: 160, typesCount: 2 },
//     { batchNo: 'B-803', date: '2026-01-30', grade: 'M55', sleepers: 80, typesCount: 1 },
// ];

export const WaterCubeStats = () => {
    const [filters, setFilters] = useState({ batch: '', grade: 'All', dateRange: '' });

    const stats = {
        readyBatches: 14,
        pendingSamples: 6,
        avgStrength: 59.2,
        minStrength: 51.5,
        maxStrength: 65.8,
        deviation: 3.8
    };

    return (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Cube Integrity Analytics</h3>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0' }}>Real-time strength metrics and testing readiness tracking</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                {[
                    { label: 'Ready for Testing', sub: '(>15 Days)', value: stats.readyBatches, color: '#42818c' },
                    { label: 'Samples Pending', sub: 'In Queue', value: stats.pendingSamples, color: '#f59e0b' },
                    { label: 'Avg. Strength', sub: 'N/mm²', value: stats.avgStrength, color: '#1e293b' },
                    { label: 'Min Strength', sub: 'Critical', value: stats.minStrength, color: '#ef4444' },
                    { label: 'Max Strength', sub: 'Peak', value: stats.maxStrength, color: '#10b981' },
                    { label: 'Deviation %', sub: 'Consistency', value: `${stats.deviation}%`, color: '#6366f1' },
                ].map((s, idx) => (
                    <div key={idx} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                        <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '8px' }}>{s.sub}</div>
                        <div style={{ fontSize: '20px', fontWeight: '900', color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const WaterCubeTesting = () => {
    const [activeTab, setActiveTab] = useState('pending'); // 'declaration', 'pending', 'done'
    const [isModifying, setIsModifying] = useState(false);
    const { selectedShift, dutyLocation, dutyUnit, vendorCode } = useShift();
    
    // Live Data State
    const [pendingDeclarations, setPendingDeclarations] = useState([]);
    const [loadingDeclarations, setLoadingDeclarations] = useState(false);
    
    // Active declarations (saved to DB)
    const [activeDeclarations, setActiveDeclarations] = useState([]);
    const [loadingActive, setLoadingActive] = useState(false);

    const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null); 
    const [selectedPendingBatches, setSelectedPendingBatches] = useState([]);

    useEffect(() => {
        fetchDeclarations();
        fetchActiveDeclarations();
    }, []);

    const fetchDeclarations = async () => {
        setLoadingDeclarations(true);
        try {
            const currentUser = getStoredUser();
            const currentUserId = currentUser?.userId;

            if (!currentUserId) {
                setPendingDeclarations([]);
                return [];
            }

            // Fetch active declarations first to filter out already declared batches
            const activeData = await fetchActiveDeclarations();
            const activeDeclarationIds = activeData.map(d => d.productionDeclarationId);

            // Fast API: only fetches declarations for this user at the DB level
            const data = await getProductionDeclarations();
            if (data && data.length > 0) {
                const mappedData = data
                    .filter(d => d.plantId === (dutyUnit || localStorage.getItem('dutyUnit')))
                    .map(d => ({
                        id: d.id,
                        batchNo: d.batchNumber || 'N/A',
                        date: d.castingDate || 'N/A',
                        grade: d.mixDesignReference || 'N/A',
                        sleepers: d.totalCastedSleepers || 0,
                        typesCount: d.totalSleeperTypes || 0,
                        raw: d
                    }))
                    .filter(d => !activeDeclarationIds.includes(d.id)); // Filter out declared batches
                setPendingDeclarations(mappedData);
            } else {
                setPendingDeclarations([]);
            }
        } catch (error) {
            console.error("Error fetching declarations:", error);
            setPendingDeclarations([]);
        } finally {
            setLoadingDeclarations(false);
        }
    };

    const fetchActiveDeclarations = async () => {
        setLoadingActive(true);
        try {
            const currentUser = getStoredUser();
            const currentUserId = currentUser?.userId;

            if (!currentUserId) {
                setActiveDeclarations([]);
                return [];
            }

            // Fetch both in parallel to filter out completed tests
            const [data, testResults] = await Promise.all([
                getWaterCubeSamples(),
                getWaterCubeTestResultsByUser(currentUserId).catch(() => []) 
            ]);

            const completedTestIds = new Set(
                 (testResults || [])
                    .map(tr => tr.waterCubeSampleDeclarationId)
                    .filter(id => id != null)
            );

            if (data && data.length > 0) {
                const mappedData = data
                    .filter(d => !completedTestIds.has(d.id))
                    .filter(d => d.plantId === (dutyUnit || localStorage.getItem('dutyUnit')))
                    .map(d => ({
                    id: d.id,
                    productionDeclarationId: d.productionDeclarationId,
                    batchNo: d.batchNumber,
                    grade: d.concreteGrade,
                    castingDate: d.castingDate,
                    shift: d.shift,
                    lineNo: d.lineNo,
                    sample1Raw: d.details?.filter(det => det.sampleNumber === 1).sort((a,b) => a.cubeNumber - b.cubeNumber).map(det => ({ id: det.id, bench: det.benchNumber, seq: det.sequence })) || [],
                    sample2Raw: d.details?.filter(det => det.sampleNumber === 2).sort((a,b) => a.cubeNumber - b.cubeNumber).map(det => ({ id: det.id, bench: det.benchNumber, seq: det.sequence })) || [],
                    sample1: d.details?.filter(det => det.sampleNumber === 1).map(det => `${det.benchNumber}${det.sequence}`) || [],
                    sample2: d.details?.filter(det => det.sampleNumber === 2).map(det => `${det.benchNumber}${det.sequence}`) || [],
                    status: 'Testing Pending',
                    raw: d
                }));
                
                // Grouping logic based on exact identical sample 1 & sample 2 arrays
                const groups = {};
                mappedData.forEach(item => {
                    const groupKey = JSON.stringify({ s1: item.sample1, s2: item.sample2 });
                    if (!groups[groupKey]) {
                        groups[groupKey] = [];
                    }
                    groups[groupKey].push(item);
                });

                const groupedData = Object.values(groups).map(groupItems => {
                    if (groupItems.length === 1) {
                        return { ...groupItems[0], groupedBatches: [groupItems[0]] };
                    }
                    // Aggregate multiple items
                    const first = groupItems[0];
                    return {
                        ...first,
                        batchNo: groupItems.map(g => g.batchNo).join(', '),
                        id: groupItems.map(g => g.id).join(','), // comma-separated IDs
                        groupedBatches: groupItems
                    };
                });
                
                setActiveDeclarations(groupedData);
                return mappedData;
            } else {
                setActiveDeclarations([]);
                return [];
            }

        } catch (error) {
            console.error("Error fetching active water cube samples:", error);
            setActiveDeclarations([]);
            return [];
        } finally {
            setLoadingActive(false);
        }
    };

    const handleFinalizeSample = async (formData) => {
        try {
            const currentUser = getStoredUser();
            const currentUserId = currentUser?.userId;

            if (!currentUserId) {
                alert("User not authenticated.");
                return;
            }

            const batchesToProcess = formData.batches;
            const promises = batchesToProcess.map(batch => {
                const payload = {
                    productionDeclarationId: batch.productionDeclarationId || batch.id,
                    castingDate: batch.date || batch.castingDate,
                    batchNumber: batch.batchNo || batch.batchNumber,
                    plantId: dutyUnit || localStorage.getItem('dutyUnit'),
                    vendorCode: vendorCode || localStorage.getItem('vendorCode'),
                    shift: selectedShift || 'General',
                    lineNo: dutyLocation || 'N/A',
                    concreteGrade: batch.grade || batch.concreteGrade,
                    details: [
                        ...formData.sample1Raw.map((c, i) => ({ id: isModifying ? (batch.sample1Raw?.[i]?.id || 0) : 0, sampleNumber: 1, cubeNumber: i + 1, benchNumber: c.bench, sequence: c.seq })),
                        ...formData.sample2Raw.map((c, i) => ({ id: isModifying ? (batch.sample2Raw?.[i]?.id || 0) : 0, sampleNumber: 2, cubeNumber: i + 1, benchNumber: c.bench, sequence: c.seq }))
                    ],
                    createdBy: currentUserId
                };

                let declId = null;
                if (isModifying && batch.id && batch.productionDeclarationId) {
                    declId = batch.id;
                }
                
                if (declId) {
                    return saveWaterCubeSample(payload, declId);
                } else {
                    return saveWaterCubeSample(payload);
                }
            });

            await Promise.all(promises);
            alert("Sample declaration saved successfully!");
            
            setSelectedPendingBatches([]);
            setIsSampleModalOpen(false);
            fetchActiveDeclarations(); // Refresh the list of active declarations
            fetchDeclarations(); // Refresh pending declarations as one might have been moved
        } catch (error) {
            console.error("Error saving sample declaration:", error);
            alert("Failed to save sample declaration.");
            throw error;
        }
    };
    const handleDeleteSample = async (sampleId) => {
        if (window.confirm("Are you sure you want to delete this sample declaration? This action cannot be undone.")) {
            try {
                const ids = String(sampleId).split(',');
                await Promise.all(ids.map(id => deleteWaterCubeSample(id)));
                alert("Sample declaration deleted successfully.");
                fetchActiveDeclarations();
                fetchDeclarations(); // Refresh pending declarations
            } catch (err) {
                console.error("Error deleting sample declaration:", err);
                alert("Failed to delete sample declaration.");
            }
        }
    };

    const [showTestModal, setShowTestModal] = useState(false);
    const [showTestForm, setShowTestForm] = useState(false);
    const [doneTests, setDoneTests] = useState([]);
    const [isModifyingTest, setIsModifyingTest] = useState(false);
    const [selectedTestRecord, setSelectedTestRecord] = useState(null);

    // Fetch done tests on mount or when active tab changes
    const fetchDoneTests = async () => {
        try {
            const results = await getAllWaterCubeTests();
            if (results && results.length > 0) {
                const mapped = results
                    .filter(r => r.plantId === (dutyUnit || localStorage.getItem('dutyUnit')))
                    .map(r => ({
                        ...r,
                        batchNo: r.batchNumber,
                        castingDate: r.castingDate,
                        testDate: r.createdDate ? new Date(r.createdDate).toISOString().split('T')[0] : '',
                        sample1Results: r.details?.filter(d => d.sampleNumber === 1).map(d => d.strengthNmm2) || [],
                        sample2Results: r.details?.filter(d => d.sampleNumber === 2).map(d => d.strengthNmm2) || [],
                        avgStrength: r.avgX,
                        status: r.finalTestResult,
                        raw: r
                    }));
                setDoneTests(mapped);
            } else {
                setDoneTests([]);
            }
        } catch (error) {
            console.error("Failed to fetch done tests:", error);
            setDoneTests([]);
        }
    };

    useEffect(() => {
        fetchDoneTests();
    }, [activeTab]);

    const handleSaveTestData = async (data) => {
        try {
            const batchesToSave = selectedBatch.groupedBatches || [selectedBatch];
            const promises = batchesToSave.map(batch => {
                const payload = {
                    waterCubeSampleDeclarationId: batch.id,
                    productionDeclarationId: batch.productionDeclarationId,
                    castingDate: batch.castingDate,
                    testDate: data.testDate,
                    shift: batch.shift,
                    lineNo: batch.lineNo,
                    concreteGrade: batch.grade || batch.concreteGrade,
                    batchNumber: batch.batchNo || batch.batchNumber,
                    avgStrength: data.avgStrength,
                    status: data.status,
                    plantId: dutyUnit || localStorage.getItem('dutyUnit'),
                    vendorCode: vendorCode || localStorage.getItem('vendorCode'),
                    details: [
                        ...data.sample1Results.map((r, i) => ({
                            id: isModifyingTest ? (batch.raw?.details?.find(d => d.sampleNumber === 1 && d.cubeNumber === i + 1)?.id || 0) : 0,
                            sampleNumber: 1,
                            cubeNumber: i + 1,
                            cubeId: batch.sample1?.[i] || '',
                            weight: r.weight,
                            load: r.load,
                            strength: r.strength
                        })),
                        ...data.sample2Results.map((r, i) => ({
                            id: isModifyingTest ? (batch.raw?.details?.find(d => d.sampleNumber === 2 && d.cubeNumber === i + 1)?.id || 0) : 0,
                            sampleNumber: 2,
                            cubeNumber: i + 1,
                            cubeId: batch.sample2?.[i] || '',
                            weight: r.weight,
                            load: r.load,
                            strength: r.strength
                        }))
                    ]
                };

                if (isModifyingTest && selectedTestRecord?.id) {
                    return saveWaterCubeTestResult(payload, selectedTestRecord.id);
                } else {
                    return saveWaterCubeTestResult(payload);
                }
            });

            await Promise.all(promises);
            
            alert(`Test record${promises.length > 1 ? 's' : ''} saved successfully!`);
            setShowTestForm(false);
            fetchDoneTests();
            fetchActiveDeclarations(); // Refresh active list to remove tested batches
        } catch (error) {
            console.error("Error saving test result:", error);
            alert("Failed to save test result.");
        }
    };

    // const [declaredBatches, setDeclaredBatches] = useState([ // Removed, now using activeDeclarations
    //     {
    //         batchNo: 'B-701', grade: 'M55', castingDate: '2026-01-15',
    //         declarationTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    //         sample1Raw: [{ bench: '201', seq: 'A' }, { bench: '210', seq: 'B' }, { bench: '315', seq: 'D' }],
    //         sample2Raw: [{ bench: '209', seq: 'D' }, { bench: '415', seq: 'B' }, { bench: '410', seq: 'B' }],
    //         sample1: ['201A', '210B', '315D'], sample2: ['209D', '415B', '410B'],
    //         status: 'Testing Pending'
    //     },
    //     {
    //         batchNo: 'B-750', grade: 'M60', castingDate: new Date().toISOString().split('T')[0],
    //         declarationTime: new Date().toISOString(),
    //         sample1Raw: [{ bench: '101', seq: 'A' }, { bench: '102', seq: 'A' }, { bench: '103', seq: 'A' }],
    //         sample2Raw: [{ bench: '104', seq: 'A' }, { bench: '105', seq: 'A' }, { bench: '106', seq: 'A' }],
    //         sample1: ['101A', '102A', '103A'], sample2: ['104A', '105A', '106A'],
    //         status: 'Not Eligible for Testing'
    //     }
    // ]);

    const declarationColumns = [
        { key: 'batchNo', label: 'Batch No' },
        { key: 'date', label: 'Date of Casting' },
        { key: 'grade', label: 'Grade' },
        { key: 'sleepers', label: 'Sleepers in Batch' },
        { key: 'typesCount', label: 'Total No of Sleeper Type' }
    ];

    const pendingColumns = [
        { key: 'batchNo', label: 'Batch Number' },
        { key: 'grade', label: 'Grade' },
        { key: 'castingDate', label: 'Date of Casting' },
        {
            key: 'sample1',
            label: 'Sample 1 - 3 Cubes',
            render: (val) => <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>{val.join(', ')}</span>
        },
        {
            key: 'sample2',
            label: 'Sample 2 - 3 Cubes',
            render: (val) => <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>{val.join(', ')}</span>
        },
        {
            key: 'status',
            label: 'Status',
            render: (val, row) => {
                const isEligible = checkEligibility(row.castingDate);
                const displayStatus = isEligible ? 'Testing Pending' : 'Not Eligible for Testing';
                return (
                    <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '800',
                        background: isEligible ? '#ecfdf5' : '#fff7ed',
                        color: isEligible ? '#059669' : '#c2410c'
                    }}>
                        {displayStatus}
                    </span>
                );
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => {
                const canModify = (new Date() - new Date(row.raw?.createdDate || row.declarationTime)) < (8 * 60 * 60 * 1000);
                const isEligible = checkEligibility(row.castingDate);
                return (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className="btn-save"
                            style={{ fontSize: '10px', padding: '4px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}
                            onClick={() => { setSelectedBatch(row); setShowTestModal(true); }}
                        >
                            View Details
                        </button>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="water-cube-module cement-forms-scope">
            <header style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#13343b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Water Cured Cube Strength</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>SUB CARD- 4</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>FINAL INSPECTION PROFILE</span>
                </div>
            </header>

            <WaterCubeStats />

            <div className="nav-tabs" style={{
                marginBottom: '32px',
                display: 'flex',
                gap: '8px',
                background: '#f1f5f9',
                padding: '6px',
                borderRadius: '14px',
                width: 'fit-content',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0'
            }}>
                {[
                    { id: 'declaration', label: 'Declare Samples for Testing' },
                    { id: 'pending', label: 'Declared Samples' },
                    { id: 'done', label: 'List of Testing Done' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                        style={{
                            border: 'none',
                            padding: '10px 24px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: activeTab === tab.id ? '800' : '600',
                            background: activeTab === tab.id ? '#fff' : 'transparent',
                            color: activeTab === tab.id ? '#13343b' : '#64748b',
                            boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0, 0, 0, 0.08)' : 'none',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transform: activeTab === tab.id ? 'scale(1.02)' : 'scale(1)',
                        }}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="tab-content">
                {activeTab === 'declaration' && (
                    <div className="fade-in" style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <h4 style={{ margin: 0, color: '#1e293b', fontWeight: '800' }}>Batches Pending Declaration</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Source: SCADA / Vendor Inventory</span>
                                <button
                                    className="btn-verify"
                                    disabled={selectedPendingBatches.length === 0}
                                    style={{ opacity: selectedPendingBatches.length === 0 ? 0.5 : 1 }}
                                    onClick={() => { setSelectedBatch(selectedPendingBatches); setIsModifying(false); setIsSampleModalOpen(true); }}
                                >
                                    Declare Samples ({selectedPendingBatches.length})
                                </button>
                            </div>
                        </div>
                        <EnhancedDataTable 
                            columns={declarationColumns} 
                            data={pendingDeclarations} 
                            selectable={true} 
                            onSelectionChange={setSelectedPendingBatches}
                            loading={loadingDeclarations} 
                        />
                    </div>
                )}

                {activeTab === 'pending' && (
                    <div className="fade-in" style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <h4 style={{ margin: 0, color: '#1e293b', fontWeight: '800' }}>Batches with Active Declarations</h4>
                        </div>
                        <EnhancedDataTable columns={pendingColumns} data={activeDeclarations} selectable={false} loading={loadingActive} />
                    </div>
                )}

                {activeTab === 'done' && (
                    <div className="fade-in" style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, color: '#1e293b', fontWeight: '800' }}>Historical Strength Logs</h4>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>Individual cube strengths shown in detail</div>
                        </div>
                        <EnhancedDataTable
                            columns={[
                                { key: 'batchNo', label: 'Batch' },
                                { key: 'castingDate', label: 'Cast Date' },
                                { key: 'testDate', label: 'Test Date' },
                                {
                                    key: 's1Strengths',
                                    label: 'Sample 1 Strengths',
                                    render: (_, row) => (
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {row.sample1Results?.map((s, i) => (
                                                <span key={i} style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>{s.toFixed(1)}</span>
                                            ))}
                                        </div>
                                    )
                                },
                                {
                                    key: 's2Strengths',
                                    label: 'Sample 2 Strengths',
                                    render: (_, row) => (
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {row.sample2Results?.map((s, i) => (
                                                <span key={i} style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>{s.toFixed(1)}</span>
                                            ))}
                                        </div>
                                    )
                                },
                                { key: 'avgStrength', label: 'Avg Strength', render: (val) => <strong>{val.toFixed(2)}</strong> },
                                {
                                    key: 'status',
                                    label: 'Result',
                                    render: (val) => (
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontSize: '10px',
                                            fontWeight: '800',
                                            background: val === 'PASS' ? '#ecfdf5' : '#fee2e2',
                                            color: val === 'PASS' ? '#059669' : '#b91c1c'
                                        }}>
                                            {val}
                                        </span>
                                    )
                                },
                                {
                                    key: 'actions',
                                    label: 'Actions',
                                    render: (_, row) => (
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button
                                                className="btn-save"
                                                style={{ fontSize: '10px', padding: '4px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}
                                                onClick={() => {
                                                    const mockBatchObj = {
                                                        id: row.waterCubeSampleDeclarationId,
                                                        productionDeclarationId: row.productionDeclarationId,
                                                        batchNo: row.batchNumber,
                                                        grade: row.concreteGrade,
                                                        castingDate: row.castingDate,
                                                        shift: row.shift,
                                                        lineNo: row.lineNo,
                                                        sample1: row.details?.filter(d => d.sampleNumber === 1).map(d => d.cubeId) || [],
                                                        sample2: row.details?.filter(d => d.sampleNumber === 2).map(d => d.cubeId) || [],
                                                        isTested: true, // Mark it as tested
                                                        raw: row 
                                                    };
                                                    setSelectedBatch(mockBatchObj);
                                                    setSelectedTestRecord(row);
                                                    setShowTestModal(true);
                                                }}
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    )
                                }
                            ]}
                            data={doneTests}
                            selectable={false}
                        />
                    </div>
                )}
            </div>

            {/* Declaration Modal */}
            {isSampleModalOpen && (
                <SampleDeclarationModal
                    batches={Array.isArray(selectedBatch) ? selectedBatch : (selectedBatch?.groupedBatches || [selectedBatch])}
                    isModifying={isModifying}
                    onClose={() => setIsSampleModalOpen(false)}
                    onSave={handleFinalizeSample}
                />
            )}

            {/* Test Detail Pop-up (Detailed View with 2 Buttons) */}
            {showTestModal && (
                <TestDetailPopup
                    batch={selectedBatch}
                    onClose={() => setShowTestModal(false)}
                    onDelete={(id) => {
                        handleDeleteSample(id);
                        setShowTestModal(false);
                    }}
                    onModify={() => {
                        setIsModifying(true);
                        setShowTestModal(false);
                        setIsSampleModalOpen(true);
                    }}
                    onSaveTest={() => {
                        setShowTestModal(false);
                        setIsModifyingTest(selectedBatch?.isTested);
                        setSelectedTestRecord(selectedBatch?.isTested ? selectedBatch.raw : null);
                        setShowTestForm(true);
                    }}
                    onDeleteTest={async (id) => {
                        try {
                            await deleteWaterCubeTest(id);
                            alert("Test record deleted successfully.");
                            fetchDoneTests();
                            fetchActiveDeclarations();
                            setShowTestModal(false);
                        } catch (err) {
                            alert("Failed to delete test record.");
                        }
                    }}
                />
            )}

            {/* Actual Save Test Data Form Modal */}
            {showTestForm && (
                <div className="form-modal-overlay">
                    <div className="form-modal-container" style={{ maxWidth: '1200px', width: '98%' }}>
                        <div className="form-modal-header">
                            <span className="form-modal-header-title">Enter Cube Strength Data - Batch {selectedBatch.batchNo}</span>
                            <button className="form-modal-close" onClick={() => setShowTestForm(false)}>✕</button>
                        </div>
                        <div className="form-modal-body" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
                            <WaterCuredCubeForm
                                batch={selectedBatch}
                                preFillData={selectedTestRecord}
                                onSave={handleSaveTestData}
                                onCancel={() => setShowTestForm(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Sub-Components ---

// --- Sub-Components ---

const SearchableSleeperDropdown = ({ value, options, onChange, label, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = React.useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(opt => 
            opt.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    return (
        <div className="dropdown-container" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
            <label style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.025em' }}>{label}</label>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    value={isOpen ? searchTerm : (value || '')}
                    placeholder={isOpen ? "Type to filter..." : (placeholder || "Select sleeper...")}
                    style={{ 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid #e2e8f0',
                        background: '#fff',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        outline: 'none',
                        boxShadow: isOpen ? '0 0 0 3px rgba(66, 129, 140, 0.15)' : 'none',
                        borderColor: isOpen ? '#42818c' : '#e2e8f0',
                        color: (isOpen && !searchTerm) ? '#94a3b8' : '#1e293b'
                    }}
                    onFocus={() => { setIsOpen(true); setSearchTerm(''); }}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div style={{ 
                    position: 'absolute', 
                    right: '14px', 
                    top: '50%', 
                    transform: `translateY(-50%) rotate(${isOpen ? '180deg' : '0deg'})`, 
                    pointerEvents: 'none', 
                    opacity: 0.6,
                    transition: 'transform 0.3s ease'
                }}>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1.5L5 4.5L9 1.5" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
            </div>
            {isOpen && (
                <ul style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    margin: 0,
                    padding: '6px',
                    listStyle: 'none',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    animation: 'slideDown 0.2s ease-out'
                }}>
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt, i) => (
                            <li 
                                key={i}
                                style={{
                                    padding: '10px 14px',
                                    fontSize: '12.5px',
                                    fontWeight: '700',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    color: opt === value ? '#42818c' : '#334155',
                                    background: opt === value ? '#f0f9fa' : 'transparent',
                                    marginBottom: '2px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => { 
                                    if (opt !== value) e.target.style.background = '#f8fafc'; 
                                    e.target.style.color = '#13343b';
                                }}
                                onMouseLeave={(e) => { 
                                    e.target.style.background = opt === value ? '#f0f9fa' : 'transparent'; 
                                    e.target.style.color = opt === value ? '#42818c' : '#334155';
                                }}
                                onClick={() => {
                                    onChange(opt);
                                    setIsOpen(false);
                                    setSearchTerm('');
                                }}
                            >
                                {opt}
                                {opt === value && (
                                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 5L4.5 8.5L11 1.5" stroke="#42818c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                )}
                            </li>
                        ))
                    ) : (
                        <li style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                            No sleepers found matching "{searchTerm}"
                        </li>
                    )}
                </ul>
            )}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    );
};

const SampleDeclarationModal = ({ batches, isModifying, onClose, onSave }) => {
    const [fullDeclarations, setFullDeclarations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // For modifying, we assume all grouped batches have the identical sample info, so we take the first.
    const referenceBatch = batches[0];
    
    const [form, setForm] = useState({
        sample1: isModifying ? referenceBatch.sample1Raw : [{ bench: '', seq: '' }, { bench: '', seq: '' }, { bench: '', seq: '' }],
        sample2: isModifying ? referenceBatch.sample2Raw : [{ bench: '', seq: '' }, { bench: '', seq: '' }, { bench: '', seq: '' }]
    });

    useEffect(() => {
        const fetchAllFullData = async () => {
            setLoading(true);
            try {
                const promises = batches.map(b => b.id ? getProductionDeclarationById(b.id) : Promise.resolve(b.raw));
                const results = await Promise.all(promises);
                setFullDeclarations(results.filter(Boolean));
            } catch (err) {
                console.error("Error fetching full declarations:", err);
            } finally {
                setLoading(false);
            }
        };
        if (batches?.length > 0) {
            fetchAllFullData();
        }
    }, [batches]);

    // Build a map of Bench Number -> Available Sleeper Suffixes from live API data
    const benchToSleepers = useMemo(() => {
        const map = {};
        if (!fullDeclarations || fullDeclarations.length === 0) return map;

        fullDeclarations.forEach(rawData => {
            // Handle Stress Bench (Chambers -> BenchGroups -> Sleepers)
            if (rawData.chambers && rawData.chambers.length > 0) {
                rawData.chambers.forEach(chamber => {
                chamber.benchGroups?.forEach(group => {
                    const bNo = String(group.benchNo);
                    if (!map[bNo]) map[bNo] = [];
                    
                    // Support both group.sleepers (strings) and group.sleeperList (objects)
                    const sList = group.sleeperList || group.sleepers || [];
                    sList.forEach(item => {
                        const s = typeof item === 'string' ? item : (item.sleeperNo || item.id);
                        if (!s) return;
                        const suffix = s.startsWith(bNo) ? s.substring(bNo.length) : s;
                        map[bNo].push({ full: s, suffix: suffix });
                    });
                });
                });
            }
            
            // Handle Long Line (Gangs -> Sleepers)
            if (rawData.gangs && rawData.gangs.length > 0) {
                rawData.gangs.forEach(gang => {
                     const bNo = String(gang.gangNo);
                     if (!map[bNo]) map[bNo] = [];
                     const sList = gang.sleeperList || gang.sleepers || [];
                     sList.forEach(item => {
                         const s = typeof item === 'string' ? item : (item.sleeperNo || item.id);
                         if (!s) return;
                         const suffix = s.startsWith(bNo) ? s.substring(bNo.length) : s;
                         map[bNo].push({ full: s, suffix: suffix });
                     });
                });
            }
        });

        return map;
    }, [fullDeclarations]);

    // Flatten map into a single list of all unique available sleepers for searchable dropdown
    const allSleeperOptions = useMemo(() => {
        const unique = new Set();
        Object.values(benchToSleepers).forEach(sleepers => {
            sleepers.forEach(s => unique.add(s.full));
        });
        return Array.from(unique).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }, [benchToSleepers]);

    const selectedSleeperIds = useMemo(() => {
        const ids = [];
        [...form.sample1, ...form.sample2].forEach(c => {
            if (c.bench || c.seq) ids.push(`${c.bench}${c.seq}`);
        });
        return ids;
    }, [form]);

    const handleUpdateSleeper = (sampleIdx, cubeIdx, val) => {
        const key = `sample${sampleIdx + 1}`;
        const updated = [...form[key]];
        
        // Match bench and seq from the selected sleeper string
        let identifiedBench = "";
        let identifiedSeq = "";
        
        // Identify which bench this sleeper belongs to
        const knownBenches = Object.keys(benchToSleepers);
        // Find bench that prefixes the value AND has this exact sleeper in its list
        const matchedBench = knownBenches.find(b => {
            if (!val.startsWith(b)) return false;
            return benchToSleepers[b].some(s => s.full === val);
        });

        if (matchedBench) {
            identifiedBench = matchedBench;
            identifiedSeq = val.substring(matchedBench.length);
        } else {
            // Partial typing or invalid
            const match = val.match(/^(\d+)(.*)$/);
            if (match) {
                identifiedBench = match[1];
                identifiedSeq = match[2];
            } else {
                identifiedBench = val;
            }
        }
        
        updated[cubeIdx].bench = identifiedBench;
        updated[cubeIdx].seq = identifiedSeq;
        setForm({ ...form, [key]: updated });
    };

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">{isModifying ? 'Modify Sample Details' : 'Sample Declaration Form'}</span>
                    <button className="form-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="form-modal-body" style={{ background: '#f8fafc' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Fetching batch details...</div>
                    ) : (
                        <>
                            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                                    <div className="input-group"><label>Selected Batches</label><input readOnly value={batches.map(b => b.batchNo).join(', ')} className="readOnly" /></div>
                                    <div className="input-group"><label>Date of Casting</label><input readOnly value={referenceBatch?.date || referenceBatch?.castingDate} className="readOnly" /></div>
                                    <div className="input-group"><label>Concrete Grade</label><input readOnly value={referenceBatch?.grade} className="readOnly" /></div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                                {[0, 1].map(sIdx => (
                                    <div key={sIdx} style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <h4 style={{ fontSize: '13px', color: '#42818c', margin: 0, fontWeight: '800', textTransform: 'uppercase' }}>
                                                Sample {sIdx + 1}
                                            </h4>
                                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>3 Cubes Required</span>
                                        </div>
                                        {form[`sample${sIdx + 1}`].map((c, cIdx) => (
                                            <div key={cIdx} style={{ marginBottom: '16px' }}>
                                                <SearchableSleeperDropdown
                                                    label={`Cube ${cIdx + 1} - Sleeper ID`}
                                                    placeholder="Search Sleeper..."
                                                    value={c.bench || c.seq ? `${c.bench}${c.seq}` : ''}
                                                    options={allSleeperOptions.filter(opt => !selectedSleeperIds.includes(opt) || opt === `${c.bench}${c.seq}`)}
                                                    onChange={(val) => handleUpdateSleeper(sIdx, cIdx, val)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                                <button className="btn-verify" style={{ flex: 1, padding: '14px' }} onClick={async () => {
                                    if (saving) return;
                                    const allCubes = [...form.sample1, ...form.sample2];
                                    
                                    // 1. Check all filled
                                    if (allCubes.some(c => !c.bench || !c.seq)) {
                                        alert("Please select exactly 6 sleepers for testing.");
                                        return;
                                    }
                                    
                                    // 2. Validation: Must be from the list
                                    const invalid = allCubes.filter(c => !allSleeperOptions.includes(`${c.bench}${c.seq}`));
                                    if (invalid.length > 0) {
                                        alert(`Invalid selection: ${invalid.map(c => `${c.bench}${c.seq}`).join(', ')} do not belong to this batch.`);
                                        return;
                                    }

                                    // 3. Check for duplicates
                                    const combinations = allCubes.map(c => `${c.bench}${c.seq}`);
                                    const uniqueCombinations = new Set(combinations);
                                    if (uniqueCombinations.size !== combinations.length) {
                                        alert("Duplicate sleepers selected. Each of the 6 cubes must be a unique sleeper.");
                                        return;
                                    }
                                    
                                    setSaving(true);
                                    try {
                                        await onSave({
                                            batches: batches,
                                            sample1Raw: form.sample1,
                                            sample2Raw: form.sample2,
                                            sample1: form.sample1.map(c => `${c.bench}${c.seq}`),
                                            sample2: form.sample2.map(c => `${c.bench}${c.seq}`),
                                        });
                                    } catch (err) {
                                        setSaving(false);
                                    }
                                }}>
                                    {saving ? 'Processing...' : (isModifying ? 'Update Declaration' : 'Finalize Declaration')}
                                </button>
                                <button className="btn-save" style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none' }} onClick={onClose} disabled={saving}>Cancel</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const TestDetailPopup = ({ batch, onClose, onModify, onSaveTest, onDelete, onDeleteTest }) => {
    const isEligible = checkEligibility(batch.castingDate);
    // 8 hour restriction logic
    const createdTime = new Date(batch.raw?.updatedDate || batch.raw?.createdDate || Date.now());
    const hoursElapsed = (new Date() - createdTime) / (1000 * 60 * 60);
    const canModifyOrDelete = hoursElapsed < 8;

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">Batch Test Readiness</span>
                    <button className="form-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="form-modal-body">
                    <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            <div><label style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>BATCH NO</label><div style={{ fontWeight: '800' }}>{batch.batchNo}</div></div>
                            <div><label style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>GRADE</label><div style={{ fontWeight: '800' }}>{batch.grade}</div></div>
                            <div><label style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>CASTING DATE</label><div style={{ fontWeight: '800' }}>{batch.castingDate}</div></div>
                            <div><label style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>STATUS</label><div style={{ fontWeight: '800', color: isEligible ? '#10b981' : '#c2410c' }}>{isEligible ? 'Testing Pending' : 'Wait Required'}</div></div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', display: 'block', marginBottom: '8px' }}>DECLARED SAMPLES</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1, background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '9px', fontWeight: '700', color: '#42818c' }}>SAMPLE 1</div>
                                    <div style={{ fontSize: '13px', fontWeight: '800' }}>{batch.sample1.join(', ')}</div>
                                </div>
                                <div style={{ flex: 1, background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '9px', fontWeight: '700', color: '#42818c' }}>SAMPLE 2</div>
                                    <div style={{ fontSize: '13px', fontWeight: '800' }}>{batch.sample2.join(', ')}</div>
                                </div>
                            </div>
                        </div>

                        {batch.isTested && batch.raw && (
                            <div style={{ marginBottom: '24px', background: '#eef2ff', padding: '16px', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
                                <label style={{ fontSize: '10px', color: '#4338ca', fontWeight: '800', display: 'block', marginBottom: '12px' }}>TESTING DONE DETAILS</label>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                    <div>
                                        <div style={{ fontSize: '9px', fontWeight: '700', color: '#4f46e5', marginBottom: '4px' }}>SAMPLE 1 STRENGTHS (N/mm²)</div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {batch.raw.sample1Results?.map((s, i) => (
                                                <span key={i} style={{ background: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '800', border: '1px solid #a5b4fc', color: '#312e81' }}>{s.toFixed(1)}</span>
                                            )) || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '9px', fontWeight: '700', color: '#4f46e5', marginBottom: '4px' }}>SAMPLE 2 STRENGTHS (N/mm²)</div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {batch.raw.sample2Results?.map((s, i) => (
                                                <span key={i} style={{ background: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '800', border: '1px solid #a5b4fc', color: '#312e81' }}>{s.toFixed(1)}</span>
                                            )) || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid #c7d2fe', paddingTop: '16px' }}>
                                    <div>
                                        <div style={{ fontSize: '9px', fontWeight: '700', color: '#6366f1', marginBottom: '4px' }}>MEAN STRENGTH (N/mm²)</div>
                                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#312e81' }}>{batch.raw.avgStrength?.toFixed(2) || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '9px', fontWeight: '700', color: '#6366f1', marginBottom: '4px' }}>CONDITION SATISFIED</div>
                                        <div style={{ 
                                            fontSize: '14px', 
                                            fontWeight: '800', 
                                            color: batch.raw.status === 'PASS' ? '#059669' : '#dc2626'
                                        }}>
                                            {batch.raw.status || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isEligible && !batch.isTested && (
                            <div style={{ background: '#fff7ed', padding: '12px', borderRadius: '8px', border: '1px solid #ffedd5', color: '#c2410c', fontSize: '11px', fontWeight: '700', marginBottom: '20px' }}>
                                {(() => {
                                    const castDate = parseDate(batch.castingDate);
                                    if (!castDate || isNaN(castDate.getTime())) return "Check casting date format";
                                    const eligibleDate = new Date(castDate.getTime() + 15 * 24 * 60 * 60 * 1000);
                                    return `Testing will become eligible on ${eligibleDate.toLocaleDateString('en-GB')}`;
                                })()}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
                            {!batch.isTested && (
                                <button
                                    className="btn-verify"
                                    style={{ 
                                        opacity: isEligible ? 1 : 0.5, 
                                        cursor: isEligible ? 'pointer' : 'not-allowed', 
                                        flex: 1, 
                                        padding: '12px 24px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        borderRadius: '25px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                        minWidth: '120px',
                                        transition: 'all 0.2s'
                                    }}
                                    disabled={!isEligible}
                                    onClick={onSaveTest}
                                >
                                    Enter Test Detail
                                </button>
                            )}
                            
                             <button
                                className="btn-save"
                                style={{ 
                                    opacity: canModifyOrDelete ? 1 : 0.5, 
                                    cursor: canModifyOrDelete ? 'pointer' : 'not-allowed',
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    color: '#475569',
                                    flex: 1,
                                    padding: '12px 24px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    borderRadius: '25px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    minWidth: '100px',
                                    transition: 'all 0.2s'
                                }}
                                disabled={!canModifyOrDelete}
                                onClick={onModify}
                            >
                                Modify {!canModifyOrDelete && ' (Exp.)'}
                            </button>
                            <button
                                className="btn-delete"
                                style={{ 
                                    opacity: canModifyOrDelete ? 1 : 0.5, 
                                    cursor: canModifyOrDelete ? 'pointer' : 'not-allowed',
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    color: '#475569',
                                    flex: 1,
                                    padding: '12px 24px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    borderRadius: '25px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    minWidth: '100px',
                                    transition: 'all 0.2s'
                                }}
                                disabled={!canModifyOrDelete}
                                onClick={() => {
                                    if (window.confirm("Delete this record? The sample will return to the previous stage.")) {
                                        if (batch.isTested) {
                                            onDeleteTest && onDeleteTest(batch.raw.id);
                                        } else {
                                            onDelete && onDelete(batch.id);
                                        }
                                    }
                                }}
                            >
                                Delete {!canModifyOrDelete && ' (Exp.)'}
                            </button>
                        </div>           
                            {!canModifyOrDelete && (
                                <p style={{ fontSize: '10px', color: '#94a3b8', margin: '8px 0 0 0', textAlign: 'center' }}>
                                    Note: Modify and Delete are only available for 8 hours after declaration.
                                </p>
                            )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaterCubeTesting;
