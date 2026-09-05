import React, { useState, useEffect, useMemo, useCallback } from 'react';
import EnhancedDataTable from '../../../components/common/EnhancedDataTable';
import { useShift } from '../../../context/ShiftContext';
import { apiService } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { formatToIST } from '../../../utils/helpers';

const DESIRED_VALUES = {
    centreTop: 450,
    centreBottom: 550,
    railSeat: 650
};

const MomentOfResistance = () => {
    const { vendorCode, dutyUnit, selectedShift, dutyDate, userId } = useShift();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('declaration');
    const [batches, setBatches] = useState([]);
    const [declaredRecords, setDeclaredRecords] = useState([]);
    const [historicalTests, setHistoricalTests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDeclareModal, setShowDeclareModal] = useState(false);
    const [showTestModal, setShowTestModal] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);

    const getCommonParams = useCallback(() => {
        const dateObj = new Date(dutyDate || new Date());
        const d = String(dateObj.getDate()).padStart(2, '0');
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const y = dateObj.getFullYear();
        const formattedDate = `${d}/${m}/${y}`;

        return {
            plantId: dutyUnit || localStorage.getItem('dutyUnit'),
            vendorCode: vendorCode || localStorage.getItem('vendorCode'),
            shift: selectedShift || localStorage.getItem('selectedShift'),
            createdBy: userId || localStorage.getItem('userId'),
            date: formattedDate
        };
    }, [dutyDate, dutyUnit, vendorCode, selectedShift, userId]);

    const fetchMRData = useCallback(async () => {
        setLoading(true);
        try {
            const params = getCommonParams();

            // 1. Fetch all data in parallel
            const [vResponse, allProdResponse, waterTestsResponse, mrResponse, testResponse] = await Promise.all([
                apiService.getAllVerifedWaterBatchs(params).catch(() => []),
                apiService.getAllProductionDeclarations().catch(() => []),
                apiService.getAllWaterCubeTests().catch(() => []),
                apiService.getAllMRRecords().catch(() => []),
                apiService.getAllMRTests().catch(() => [])
            ]);

            const vData = vResponse?.responseData || vResponse || [];
            const allProdData = allProdResponse?.responseData || allProdResponse || [];
            const waterTests = waterTestsResponse?.responseData || waterTestsResponse || [];
            const mrData = mrResponse?.responseData || mrResponse || [];
            const testData = testResponse?.responseData || testResponse || [];
            
            const isSamePlant = (itemPlant, targetPlant) => {
                if (!targetPlant || !itemPlant) return true;
                return String(itemPlant).replace(':', '').trim() === String(targetPlant).replace(':', '').trim();
            };

            const completedWaterBatchNos = new Set(
                (Array.isArray(waterTests) ? waterTests : [])
                    .filter(t => isSamePlant(t.plantId, params.plantId))
                    .map(t => String(t.batchNumber || t.batchNo).trim())
            );

            // Build exhaustive production declaration map for all batches
            const normKey = (s) => String(s || '').replace(/[\s-_]/g, '').trim().toLowerCase();
            const allBatches = [...(Array.isArray(allProdData) ? allProdData : []), ...(Array.isArray(vData) ? vData : [])];
            const vBatchMap = new Map();
            const vBatchIdMap = new Map();
            allBatches.forEach(v => {
                if (v && v.batchNumber) {
                    const exact = String(v.batchNumber).trim();
                    const norm = normKey(v.batchNumber);
                    if (!vBatchMap.has(exact)) vBatchMap.set(exact, v);
                    if (!vBatchMap.has(norm)) vBatchMap.set(norm, v);
                    if (!vBatchIdMap.has(exact)) vBatchIdMap.set(exact, v.id);
                    if (!vBatchIdMap.has(norm)) vBatchIdMap.set(norm, v.id);
                }
            });

            // Batches that have completed testing (Pass or Fail)
            const passedBatchNos = new Set(
                testData
                    .filter(t => isSamePlant(t.plantId, params.plantId) && String(t.testResult).toLowerCase() === 'pass')
                    .map(t => String(t.batchNumber).trim())
            );
            const failedBatchNos = new Set(
                testData
                    .filter(t => isSamePlant(t.plantId, params.plantId) && String(t.testResult).toLowerCase() === 'fail')
                    .map(t => String(t.batchNumber).trim())
            );
            const completedBatchNos = new Set([...passedBatchNos, ...failedBatchNos]);

            // Map Verified Batches
            const mappedVerified = vData
                .filter(item => isSamePlant(item.plantId, params.plantId))
                .map(item => {
                    const samplesToTest = item.mrSamplesRequired || (item.condition2 ? 2 : 1);
                    const bNo = String(item.batchNumber).trim();
                    const isWaterDone = Boolean(item.waterCubeTestStatus) && completedWaterBatchNos.has(bNo);
                    const batchMatch = vBatchMap.get(bNo) || vBatchMap.get(normKey(bNo));
                    const actualSleeperType = item.sleeperType || item.drawingNo || batchMatch?.sleeperType || batchMatch?.drawingNo || item.mixDesignReference || 'N/A';
                    return {
                        id: item.id,
                        productionDeclarationId: item.id,
                        batchNo: item.batchNumber,
                        sleeperCategory: item.sleeperCategory,
                        sleeperType: actualSleeperType,
                        castingDate: item.castingDate || batchMatch?.castingDate || item.dateOfCasting || 'N/A',
                        waterCubeStatus: isWaterDone ? 'Completed' : 'Not Completed',
                        mrSamplesNeeded: samplesToTest, 
                        mrTestType: 'Fresh',
                        status: 'Pending Declaration',
                        originalData: item
                    };
                });

            // Map Declared Records (Pending Results)
            const mappedDeclared = mrData
                .filter(item => isSamePlant(item.plantId, params.plantId))
                .filter(item => (!item.testResult || item.testResult === 'Pending') && !completedBatchNos.has(String(item.batchNumber).trim()))
                .map(item => {
                    const bList = String(item.benchNumber || '').split(',').map(s => s.trim());
                    const sList = String(item.sleeperNo || '').split(',').map(s => s.trim());
                    const samples = (sList.length > 0 && sList[0] !== '') 
                        ? sList.map((no, idx) => ({
                            bench: bList[idx] || bList[0] || '',
                            no: no
                          }))
                        : [{ bench: item.benchNumber || '', no: item.sleeperNo || '' }];

                    const bNo = String(item.batchNumber).trim();
                    const batchMatch = vBatchMap.get(bNo) || vBatchMap.get(normKey(bNo));
                    const pId = item.productionDeclarationId || batchMatch?.id || vBatchIdMap.get(bNo);
                    const actualCastingDate = batchMatch?.castingDate || item.castingDate || item.dateOfCasting || 'N/A';
                    const actualSleeperType = item.sleeperType || batchMatch?.sleeperType || batchMatch?.drawingNo || batchMatch?.mixDesignReference || 'N/A';

                    return {
                        ...item,
                        productionDeclarationId: pId,
                        batchNo: item.batchNumber,
                        sleeperCategory: item.sleeperCategory,
                        sleeperType: actualSleeperType,
                        declaredSamples: samples,
                        castingDate: actualCastingDate, 
                        status: 'Testing Pending',
                        mrTestType: item.mrTestType || 'Fresh',
                        isTestRecord: false
                    };
                });

            // Map Completed Tests (Historical)
            const mappedHistorical = testData
                .filter(item => isSamePlant(item.plantId, params.plantId))
                .map(item => {
                    const bNo = String(item.batchNumber).trim();
                    const batchMatch = vBatchMap.get(bNo) || vBatchMap.get(normKey(bNo));
                    const declaredMatch = mrData.find(d => String(d.batchNumber).trim() === bNo || d.id === item.monmentOfResistanceId);
                    const bench = item.benchNumber || declaredMatch?.benchNumber || 'N/A';
                    const sleeper = item.sleeperNo || declaredMatch?.sleeperNo || 'N/A';
                    const pId = item.productionDeclarationId || batchMatch?.id || vBatchIdMap.get(bNo);
                    const actualCastingDate = batchMatch?.castingDate || declaredMatch?.castingDate || item.castingDate || item.dateOfCasting || 'N/A';
                    const actualSleeperType = item.sleeperType || declaredMatch?.sleeperType || batchMatch?.sleeperType || batchMatch?.drawingNo || batchMatch?.mixDesignReference || 'N/A';

                    return {
                        ...item,
                        productionDeclarationId: pId,
                        batchNo: item.batchNumber,
                        sleeperCategory: item.sleeperCategory,
                        sleeperType: actualSleeperType,
                        benchNumber: bench,
                        sleeperNo: sleeper,
                        declaredSamples: item.declaredSamples || [{ bench: bench, no: sleeper }],
                        castingDate: actualCastingDate,
                        dateOfTesting: item.createdDate ? item.createdDate.split('T')[0] : (item.dateOfTesting || 'N/A'),
                        status: item.testResult || 'Pass',
                        isTestRecord: true
                    };
                });
            
            // Map Retest Batches (Items with Retest status that need re-declaration of 2 samples)
            const pendingBatchNos = new Set(
                mrData
                    .filter(d => isSamePlant(d.plantId, params.plantId) && (!d.testResult || d.testResult === 'Pending'))
                    .map(d => String(d.batchNumber).trim())
            );

            const retestBatches = [...testData, ...mrData]
                .filter(item => isSamePlant(item.plantId, params.plantId))
                .filter(item => String(item.testResult || '').toLowerCase() === 'retest')
                .filter(item => !pendingBatchNos.has(String(item.batchNumber).trim()) && !passedBatchNos.has(String(item.batchNumber).trim()))
                .map(item => {
                    const bNo = String(item.batchNumber).trim();
                    const batchMatch = vBatchMap.get(bNo) || vBatchMap.get(normKey(bNo));
                    const pId = item.productionDeclarationId || batchMatch?.id || vBatchIdMap.get(bNo);
                    const actualCastingDate = batchMatch?.castingDate || item.castingDate || item.dateOfCasting || 'N/A';
                    const actualSleeperType = item.sleeperType || batchMatch?.sleeperType || batchMatch?.drawingNo || batchMatch?.mixDesignReference || 'N/A';

                    return {
                        id: pId || item.monmentOfResistanceId || item.id,
                        productionDeclarationId: pId,
                        batchNo: item.batchNumber,
                        sleeperCategory: item.sleeperCategory || 'Plain',
                        sleeperType: actualSleeperType,
                        castingDate: actualCastingDate,
                        waterCubeStatus: 'Completed',
                        mrSamplesNeeded: 2,
                        mrTestType: 'Retest',
                        status: 'Pending Declaration',
                        originalData: item,
                        isRetest: true
                    };
                });

            // Deduplicate retest batches by batchNo
            const uniqueRetestMap = new Map();
            retestBatches.forEach(b => {
                if (!uniqueRetestMap.has(b.batchNo)) {
                    uniqueRetestMap.set(b.batchNo, b);
                }
            });
            const uniqueRetestBatches = Array.from(uniqueRetestMap.values());

            setBatches([...uniqueRetestBatches, ...mappedVerified]);
            setDeclaredRecords(mappedDeclared);
            setHistoricalTests(mappedHistorical);
        } catch (error) {
            console.error("Failed to fetch MR data:", error);
            toast.error("Error fetching MR data.");
        } finally {
            setLoading(false);
        }
    }, [getCommonParams, toast]);

    useEffect(() => {
        fetchMRData();
    }, [fetchMRData]);

    // Filtered lists for tabs
    const declarationList = useMemo(() => batches.filter(b => b.status === 'Pending Declaration' && b.waterCubeStatus !== 'Rejected'), [batches]);
    const testingList = useMemo(() => declaredRecords, [declaredRecords]);
    const historicalList = useMemo(() => historicalTests, [historicalTests]);

    const handleDeclareSamples = async (batch, samples) => {
        setLoading(true);
        try {
            const currentUserId = parseInt(userId || localStorage.getItem('userId'), 10) || 0;
            const params = getCommonParams();

            if (batch.id && batch.status === 'Testing Pending') {
                // UPDATE if existing record
                const payload = {
                    batchNumber: String(batch.batchNumber || batch.batchNo),
                    sleeperType: batch.sleeperType,
                    castingDate: batch.castingDate,
                    benchNumber: Array.from(new Set(samples.map(s => s.bench).filter(Boolean))).join(', '),
                    sleeperNo: samples.map(s => s.no).filter(Boolean).join(', '),
                    testResult: batch.testResult || 'Pending',
                    remarks: batch.remarks || 'Declaration Updated',
                    vendorCode: params.vendorCode,
                    plantId: params.plantId,
                    shift: params.shift,
                    createdBy: batch.createdBy || currentUserId,
                    updatedBy: currentUserId
                };
                await apiService.updateMRRecord(batch.id, payload);
                toast.success("Declaration updated successfully!");
            } else {
                // CREATE ONE entry with combined samples
                const benchNos = Array.from(new Set(samples.map(s => s.bench).filter(Boolean))).join(', ');
                const sleeperNos = samples.map(s => s.no).filter(Boolean).join(', ');
                const payload = {
                    batchNumber: String(batch.batchNo),
                    sleeperType: batch.sleeperType,
                    castingDate: batch.castingDate,
                    benchNumber: benchNos,
                    sleeperNo: sleeperNos,
                    testResult: 'Pending',
                    mrTestType: batch.mrTestType || 'Fresh',
                    remarks: `Declared for MR ${batch.mrTestType || 'Fresh'} Testing (${samples.length} Sleeper${samples.length > 1 ? 's' : ''})`,
                    vendorCode: params.vendorCode,
                    plantId: params.plantId,
                    shift: params.shift,
                    createdBy: currentUserId,
                    updatedBy: currentUserId
                };

                await apiService.createMRRecord(payload);
                toast.success("Samples declared successfully!");
            }
            
            setActiveTab('testing');
            await fetchMRData();
            setShowDeclareModal(false);
        } catch (error) {
            console.error("Failed to declare MR samples:", error);
            toast.error("Failed to save declaration.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTestResults = async (record, results) => {
        setLoading(true);
        try {
            const currentUserId = parseInt(userId || localStorage.getItem('userId'), 10) || 0;
            const params = getCommonParams();
            const testResultStatus = results.result; // 'Pass', 'Retest', 'Fail'

            const payload = {
                batchNumber: String(record.batchNo),
                sleeperType: record.sleeperType,
                benchNumber: String(record.benchNumber || record.declaredSamples?.[0]?.bench || results.results?.[0]?.bench || ''),
                sleeperNo: String(record.sleeperNo || record.declaredSamples?.map(s => s.no).join(', ') || results.results?.[0]?.no || ''),
                castingDate: record.castingDate || params.date,
                testResult: testResultStatus,
                vendorCode: params.vendorCode,
                plantId: params.plantId,
                shift: params.shift,
                createdBy: record.createdBy || currentUserId,
                updatedBy: currentUserId,
                monmentOfResistanceId: record.monmentOfResistanceId || record.id,
                details: results.results.map(r => ({
                    dataType: r.isScada ? 'SCADA' : 'MANUAL',
                    ct: parseFloat(r.ct) || 0,
                    cb: parseFloat(r.cb) || 0,
                    rs1: parseFloat(r.rs1) || 0,
                    rs2: parseFloat(r.rs2) || 0
                }))
            };

            if (record.isTestRecord) {
                // UPDATE existing test entry in history
                await apiService.updateMRTest(record.id, payload);
            } else {
                // CREATE new test entry
                await apiService.createMRTest(payload);
            }

            if (testResultStatus === 'Pass') {
                toast.success("MR Test Passed! Entry shifted to completed testing.");
                setActiveTab('historical');
            } else if (testResultStatus === 'Fail') {
                toast.error(`MR Test Failed! All sleepers of drawing / batch ${record.batchNo} (${record.sleeperType}) rejected.`);
                setActiveTab('historical');
            } else if (testResultStatus === 'Retest') {
                toast.warning(`MR Test set to Retest. Entry moved back to pending list for Retest (2 sleepers required).`);
                if (record.id) {
                    try {
                        await apiService.updateMRRecord(record.id, {
                            ...record,
                            testResult: 'Retest',
                            mrTestType: 'Retest',
                            mrSamplesNeeded: 2,
                            remarks: 'Retest Required (2 Sleepers needed)'
                        });
                    } catch (e) {
                        console.warn("MR record retest update notice:", e);
                    }
                }
                setActiveTab('declaration');
            }

            await fetchMRData();
            setShowTestModal(false);
        } catch (error) {
            console.error("Failed to save MR test results:", error);
            toast.error("Failed to save test results.");
        } finally {
            setLoading(false);
        }
    };

    const columnsDeclaration = [
        { key: 'batchNo', label: 'Batch Number' },
        { key: 'sleeperType', label: 'Dwg. no.' },
        { key: 'castingDate', label: 'Date of Casting' },
        {
            key: 'waterCubeStatus',
            label: 'Water Cube Testing',
            render: (val) => (
                <span style={{
                    padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700',
                    background: val === 'Completed' ? '#ecfdf5' : '#fff7ed',
                    color: val === 'Completed' ? '#059669' : '#c2410c'
                }}>
                    {val}
                </span>
            )
        },
        { key: 'mrSamplesNeeded', label: 'Samples to Test' },
        { key: 'mrTestType', label: 'MR Test Type' },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <button
                    className="btn-verify"
                    disabled={row.waterCubeStatus !== 'Completed'}
                    onClick={() => { setSelectedBatch(row); setShowDeclareModal(true); }}
                    style={{ opacity: row.waterCubeStatus === 'Completed' ? 1 : 0.5 }}
                >
                    Declare Samples
                </button>
            )
        }
    ];

    const handleDeleteLog = async (id, isTest) => {
        if (!window.confirm(`Are you sure you want to delete this ${isTest ? 'test result' : 'sample declaration'}?`)) return;
        setLoading(true);
        try {
            if (isTest) {
                // If deleting a test, call the MR Record update to reset status
                // OR delete the test record and the item should reappear if backend links it
                await apiService.deleteMRTest(id);
                toast.success("Test record deleted. Sample is now pending result again.");
                setActiveTab('testing');
            } else {
                await apiService.deleteMRRecord(id);
                toast.success("Declaration deleted. Batch is now pending declaration.");
                setActiveTab('declaration');
            }
            await fetchMRData();
            setShowViewModal(false);
        } catch (error) {
            console.error("Failed to delete MR record:", error);
            toast.error("Failed to delete record.");
        } finally {
            setLoading(false);
        }
    };

    const [showViewModal, setShowViewModal] = useState(false); // No longer purely used by button, but keeping for state consistency if needed or remove

    const isActionable = (createdDate) => {
        if (!createdDate) return true;
        const created = new Date(createdDate);
        const now = new Date();
        const diffHours = (now - created) / (1000 * 60 * 60);
        return diffHours <= 8;
    };

    const columnsTesting = [
        { key: 'batchNo', label: 'Batch Number' },
        { key: 'sleeperType', label: 'Dwg. no.' },
        {
            key: 'declaredSamples',
            label: 'Sleeper Number',
            render: (val) => val?.map(s => s.no).join(', ')
        },
        { key: 'castingDate', label: 'Date of Casting' },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <button 
                    className="btn-verify" 
                    style={{ fontSize: '10px', padding: '6px 14px' }} 
                    onClick={() => { setSelectedBatch(row); setShowViewModal(true); }}
                >
                    View Details
                </button>
            )
        }
    ];

    const columnsHistorical = [
        { key: 'batchNo', label: 'Batch Number' },
        { key: 'sleeperType', label: 'Dwg. no.' },
        { key: 'sleeperNo', label: 'Sleeper No.' },
        { key: 'castingDate', label: 'Date of Casting' },
        { key: 'dateOfTesting', label: 'Date of Testing' },
        {
            key: 'testResult',
            label: 'Test Result',
            render: (val, row) => {
                const res = val || row.status || 'Pass';
                return (
                    <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '800',
                        background: res === 'Pass' ? '#ecfdf5' : (res === 'Retest' ? '#fff7ed' : '#fee2e2'),
                        color: res === 'Pass' ? '#059669' : (res === 'Retest' ? '#c2410c' : '#b91c1c')
                    }}>
                        {res}
                    </span>
                );
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <button 
                    className="btn-verify" 
                    style={{ fontSize: '10px', padding: '6px 14px' }} 
                    onClick={() => { setSelectedBatch(row); setShowViewModal(true); }}
                >
                    View Details
                </button>
            )
        }
    ];

    const handleDeleteTest = async (id) => {
        if (!window.confirm("Are you sure you want to delete this test result?")) return;
        setLoading(true);
        try {
            await apiService.deleteMRTest(id);
            toast.success("Test record deleted");
            await fetchMRData();
        } catch (error) {
            console.error("Failed to delete MR test:", error);
            toast.error("Failed to delete record.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mr-module cement-forms-scope">
            <header style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#13343b', margin: 0 }}>Moment of Resistance (Final Inspection)</h2>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Structural integrity testing for concrete sleepers</p>
            </header>

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
                    { id: 'declaration', label: 'Sample Declaration' },
                    { id: 'testing', label: 'Enter Test Results' },
                    { id: 'historical', label: 'Historical Records' }
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
                    <div className="section-card">
                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, color: '#475569' }}>Pending MR Sample Declaration</h4>
                            <button 
                                className="toggle-btn mini" 
                                onClick={fetchMRData}
                                disabled={loading}
                            >
                                {loading ? 'Refreshing...' : '↻ Refresh Data'}
                            </button>
                        </div>
                        <EnhancedDataTable columns={columnsDeclaration} data={declarationList} loading={loading} />
                    </div>
                )}
                {activeTab === 'testing' && (
                    <div className="section-card">
                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                            <h4 style={{ margin: 0, color: '#475569' }}>Samples Declared (Pending Testing)</h4>
                        </div>
                        <EnhancedDataTable columns={columnsTesting} data={testingList} />
                    </div>
                )}
                {activeTab === 'historical' && (
                    <div className="section-card">
                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                            <h4 style={{ margin: 0, color: '#475569' }}>Recent Testing Results</h4>
                        </div>
                        <EnhancedDataTable columns={columnsHistorical} data={historicalList} />
                    </div>
                )}
            </div>

            {showViewModal && (
                <MRDetailsModal
                    batch={selectedBatch}
                    onClose={() => setShowViewModal(false)}
                    onModify={() => {
                        setShowViewModal(false);
                        if (selectedBatch.isTestRecord) {
                            setShowTestModal(true);
                        } else {
                            setShowDeclareModal(true);
                        }
                    }}
                    onDelete={(id) => handleDeleteLog(id, selectedBatch.isTestRecord)}
                    onEnterTest={() => {
                        setShowViewModal(false);
                        setShowTestModal(true);
                    }}
                />
            )}

            {showDeclareModal && (
                <DeclareSampleModal
                    batch={selectedBatch}
                    onClose={() => setShowDeclareModal(false)}
                    onSave={handleDeclareSamples}
                    isEdit={selectedBatch?.status === 'Testing Pending'}
                />
            )}

            {showTestModal && (
                <TestDetailsModal
                    batch={selectedBatch}
                    onClose={() => setShowTestModal(false)}
                    onSave={handleSaveTestResults}
                />
            )}
        </div>
    );
};

const DeclareSampleModal = ({ batch, onClose, onSave, isEdit }) => {
    const [samples, setSamples] = useState(
        isEdit 
            ? batch.declaredSamples 
            : Array.from({ length: batch.mrSamplesNeeded || 1 }, () => ({ bench: '', no: '' }))
    );
    const [isSaving, setIsSaving] = useState(false);
    const [availableSleepers, setAvailableSleepers] = useState([]);
    const [isLoadingSleepers, setIsLoadingSleepers] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeDropdownIdx, setActiveDropdownIdx] = useState(null);

    useEffect(() => {
        const fetchSleepers = async () => {
            const batchNo = batch?.batchNo || batch?.batchNumber;
            if (!batchNo) return;
            setIsLoadingSleepers(true);
            try {
                const list = [];

                // Method 1: Fetch sleepers directly by batch number
                try {
                    const sleepersRes = await apiService.getAllProductionSleepers(batchNo);
                    const sleepersList = sleepersRes?.responseData || sleepersRes || [];
                    if (Array.isArray(sleepersList) && sleepersList.length > 0) {
                        sleepersList.forEach(item => {
                            const s = typeof item === 'string' ? item : (item.sleeperNo || item.id);
                            if (!s) return;
                            const match = String(s).match(/^(\d+)/);
                            const benchNo = match ? match[1] : '1';
                            list.push({
                                bench: benchNo,
                                no: String(s),
                                label: String(s)
                            });
                        });
                    }
                } catch (e) {
                    console.warn("getAllProductionSleepers failed, falling back to ID fetch:", e);
                }

                // Method 2: Fallback to declaration record by ID if list is empty
                if (list.length === 0) {
                    const declId = batch?.productionDeclarationId || batch?.declarationId || batch?.id;
                    if (declId) {
                        const response = await apiService.getProductionDeclarationRecordById(declId);
                        const data = response?.responseData || response;
                        
                        // Case 1: Stress Bench (Chambers/BenchGroups)
                        if (data?.chambers) {
                            data.chambers.forEach(chamber => {
                                chamber.benchGroups?.forEach(group => {
                                    const sList = group.sleeperList || group.sleepers || [];
                                    sList.forEach(item => {
                                        const s = typeof item === 'string' ? item : (item.sleeperNo || item.id);
                                        if (!s) return;
                                        list.push({
                                            bench: String(group.benchNo || ''),
                                            no: String(s),
                                            label: String(s)
                                        });
                                    });
                                });
                            });
                        }
                        // Case 2: Long Line (Gangs)
                        if (data?.gangs) {
                            data.gangs.forEach(gang => {
                                const sList = gang.sleeperList || gang.sleepers || [];
                                sList.forEach(item => {
                                    const s = typeof item === 'string' ? item : (item.sleeperNo || item.id);
                                    if (!s) return;
                                    list.push({
                                        bench: String(gang.gangNo || ''),
                                        no: String(s),
                                        label: String(s)
                                    });
                                });
                            });
                        }
                    }
                }

                setAvailableSleepers(list);
            } catch (error) {
                console.error("Error fetching sleepers for declaration:", error);
            } finally {
                setIsLoadingSleepers(false);
            }
        };
        fetchSleepers();
    }, [batch]);

    const handleUpdate = (idx, sleeperObj) => {
        const updated = [...samples];
        updated[idx] = { bench: sleeperObj.bench, no: sleeperObj.no };
        setSamples(updated);
        setActiveDropdownIdx(null);
        setSearchTerm('');
    };

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">Declare Sleeper Sample for MR Testing</span>
                    <button className="form-modal-close" onClick={onClose}>×</button>
                </div>
                <div className="form-modal-body">
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                        <div className="form-grid">
                            <div className="input-group"><label>Batch</label><input readOnly value={batch?.batchNo} className="readOnly" /></div>
                            <div className="input-group"><label>Dwg. no.</label><input readOnly value={batch?.sleeperType} className="readOnly" /></div>
                        </div>
                    </div>

                    <h4 style={{ fontSize: '13px', color: '#42818c', marginBottom: '16px', fontWeight: '700' }}>
                        Select Sleeper Details ({batch.mrSamplesNeeded} needed)
                    </h4>

                    {samples.map((s, idx) => (
                        <div key={idx} style={{ 
                            marginBottom: '16px', background: '#fff', padding: '16px', borderRadius: '12px', 
                            border: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' 
                        }}>
                            <div className="input-group" style={{ position: 'relative' }}>
                                <label>Search & Select Sleeper <span className="required">*</span></label>
                                <div className="searchable-dropdown-wrapper">
                                    <input 
                                        type="text" 
                                        placeholder={isLoadingSleepers ? "Loading sleepers..." : "Type to search sleeper (e.g. 100A)..."}
                                        value={activeDropdownIdx === idx ? searchTerm : (s.no || '')}
                                        onFocus={() => {
                                            setActiveDropdownIdx(idx);
                                            setSearchTerm('');
                                        }}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ 
                                            paddingRight: '36px',
                                            borderColor: activeDropdownIdx === idx ? '#42818c' : '#cbd5e1'
                                        }}
                                    />
                                    <div style={{ 
                                        position: 'absolute', 
                                        right: '12px', 
                                        top: '50%', 
                                        transform: 'translateY(15%)', // Centering relative to the input, accounting for label space
                                        color: '#64748b',
                                        pointerEvents: 'none'
                                    }}>
                                        {isLoadingSleepers ? (
                                            <div className="spinner-mini"></div>
                                        ) : (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M6 9l6 6 6-6"/>
                                            </svg>
                                        )}
                                    </div>

                                    {activeDropdownIdx === idx && (
                                        <div className="dropdown-options-list" style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                                            background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px',
                                            marginTop: '4px', maxHeight: '200px', overflowY: 'auto',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                        }}>
                                            {availableSleepers.length === 0 ? (
                                                <div style={{ padding: '12px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                                                    {isLoadingSleepers ? 'Fetching sleepers...' : 'No sleepers found for this batch'}
                                                </div>
                                            ) : (
                                                <>
                                                    {availableSleepers
                                                        .filter(item => item.label.toLowerCase().includes(searchTerm.toLowerCase()))
                                                        .slice(0, 50) // Limit for performance
                                                        .map((item, sIdx) => (
                                                            <div 
                                                                key={sIdx} 
                                                                style={{ 
                                                                    padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                                                                    fontSize: '13px', color: '#334155'
                                                                }}
                                                                onMouseDown={() => handleUpdate(idx, item)}
                                                                onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                                                                onMouseLeave={(e) => e.target.style.background = 'white'}
                                                            >
                                                                {item.label}
                                                            </div>
                                                        ))
                                                    }
                                                    {availableSleepers.filter(item => item.label.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                                                        <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                                                            No matches found
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button 
                            className="btn-verify" 
                            style={{ 
                                flex: 1, 
                                opacity: isSaving || isLoadingSleepers ? 0.7 : 1, 
                                cursor: (isSaving || isLoadingSleepers) ? 'not-allowed' : 'pointer' 
                            }} 
                            disabled={isSaving || isLoadingSleepers}
                            onClick={() => {
                                if (samples.some(s => !s.bench || !s.no)) {
                                    alert("Please select a sleeper for MR testing.");
                                    return;
                                }
                                setIsSaving(true);
                                onSave(batch, samples);
                            }}
                        >
                            {isSaving ? 'Saving...' : 'Save Declaration'}
                        </button>
                        <button className="btn-save" style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none' }} onClick={onClose}>Cancel</button>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .dropdown-options-list::-webkit-scrollbar { width: 6px; }
                .dropdown-options-list::-webkit-scrollbar-track { background: #f1f5f9; }
                .dropdown-options-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .spinner-mini {
                    width: 14px;
                    height: 14px;
                    border: 2px solid #e2e8f0;
                    border-top: 2px solid #42818c;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

const TestDetailsModal = ({ batch, onClose, onSave }) => {
    const [selectedTestResult, setSelectedTestResult] = useState('Pass');
    const [manualResults, setManualResults] = useState(() => {
        if (batch.details && batch.details.length > 0) {
            return batch.details.map(d => ({
                ...d,
                bench: batch.benchNumber,
                no: batch.sleeperNo,
                ct: d.ct || '',
                cb: d.cb || '',
                rs1: d.rs1 || d.rs || '',
                rs2: d.rs2 || d.rs || '',
                isScada: d.dataType === 'SCADA'
            }));
        }
        return (batch.declaredSamples || [{ bench: batch.benchNumber || '', no: batch.sleeperNo || '' }]).map(s => ({
            ...s,
            ct: '',
            cb: '',
            rs1: '',
            rs2: '',
            date: new Date().toISOString().split('T')[0]
        }));
    });
    const [isSaving, setIsSaving] = useState(false);
    const [witnessed, setWitnessed] = useState(manualResults.map(r => !!r.isScada));

    const mockScadaData = useMemo(() => {
        return (batch.declaredSamples || [{ bench: batch.benchNumber || '', no: batch.sleeperNo || '' }]).map(() => ({
            ct: Math.floor(460 + Math.random() * 100),
            cb: Math.floor(560 + Math.random() * 100),
            rs1: Math.floor(650 + Math.random() * 100),
            rs2: Math.floor(650 + Math.random() * 100)
        }));
    }, [batch]);

    const handleWitness = (idx) => {
        const updatedManual = [...manualResults];
        updatedManual[idx] = { 
            ...updatedManual[idx], 
            ct: mockScadaData[idx].ct, 
            cb: mockScadaData[idx].cb, 
            rs1: mockScadaData[idx].rs1, 
            rs2: mockScadaData[idx].rs2,
            isScada: true 
        };
        setManualResults(updatedManual);

        const updatedWitnessed = [...witnessed];
        updatedWitnessed[idx] = true;
        setWitnessed(updatedWitnessed);
    };

    const handleUpdateManual = (idx, field, val) => {
        if (witnessed[idx]) return;
        const updated = [...manualResults];
        updated[idx][field] = val;
        setManualResults(updated);
    };

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">Enter MR Test Details - Batch {batch.batchNo}</span>
                    <button className="form-modal-close" onClick={onClose}>×</button>
                </div>
                <div className="form-modal-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    {/* Section 1: Sample Details */}
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                        <div className="form-grid">
                            <div className="input-group"><label>Batch</label><input readOnly value={batch?.batchNo} className="readOnly" /></div>
                            <div className="input-group"><label>Dwg. no.</label><input readOnly value={batch?.sleeperType} className="readOnly" /></div>
                            <div className="input-group"><label>Casting Date</label><input readOnly value={batch?.castingDate} className="readOnly" /></div>
                        </div>
                    </div>

                    {/* Section 2 & 3: SCADA & Manual Entry */}
                    {manualResults.map((res, idx) => (
                        <div key={idx} style={{ marginBottom: '24px', padding: '20px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h4 style={{ margin: 0, color: '#42818c' }}>Test for Sleeper #{idx + 1}: {res.bench ? `Bench ${res.bench} - ` : ''}Sleeper {res.no}</h4>
                                <button className="btn-verify" style={{ fontSize: '11px' }} onClick={() => handleWitness(idx)}>Witness through SCADA</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
                                {/* SCADA View */}
                                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>MR SCADA DATA</span>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '8px' }}>
                                        <div><div style={{ fontSize: '9px', color: '#64748b', fontWeight: '600' }}>CT</div><div style={{ fontWeight: '800', color: '#1e293b', fontSize: '13px' }}>{mockScadaData[idx]?.ct}</div></div>
                                        <div><div style={{ fontSize: '9px', color: '#64748b', fontWeight: '600' }}>CB</div><div style={{ fontWeight: '800', color: '#1e293b', fontSize: '13px' }}>{mockScadaData[idx]?.cb}</div></div>
                                        <div><div style={{ fontSize: '9px', color: '#64748b', fontWeight: '600' }}>RS1</div><div style={{ fontWeight: '800', color: '#1e293b', fontSize: '13px' }}>{mockScadaData[idx]?.rs1}</div></div>
                                        <div><div style={{ fontSize: '9px', color: '#64748b', fontWeight: '600' }}>RS2</div><div style={{ fontWeight: '800', color: '#1e293b', fontSize: '13px' }}>{mockScadaData[idx]?.rs2}</div></div>
                                    </div>
                                </div>

                                {/* Manual Form */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                    <div className="input-group">
                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>CT (KN)</label>
                                        <input type="number" readOnly={witnessed[idx]} value={res.ct} onChange={(e) => handleUpdateManual(idx, 'ct', e.target.value)} placeholder="e.g. 469" />
                                    </div>
                                    <div className="input-group">
                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>CB (KN)</label>
                                        <input type="number" readOnly={witnessed[idx]} value={res.cb} onChange={(e) => handleUpdateManual(idx, 'cb', e.target.value)} placeholder="e.g. 560" />
                                    </div>
                                    <div className="input-group">
                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>RS1 (KN)</label>
                                        <input type="number" readOnly={witnessed[idx]} value={res.rs1} onChange={(e) => handleUpdateManual(idx, 'rs1', e.target.value)} placeholder="e.g. 695" />
                                    </div>
                                    <div className="input-group">
                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>RS2 (KN)</label>
                                        <input type="number" readOnly={witnessed[idx]} value={res.rs2} onChange={(e) => handleUpdateManual(idx, 'rs2', e.target.value)} placeholder="e.g. 695" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Manual Test Result Selection Dropdown for IE */}
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                        <div className="input-group">
                            <label style={{ fontSize: '11px', fontWeight: '800', color: '#13343b', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>
                                Select MR Test Result <span className="required" style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <select
                                value={selectedTestResult}
                                onChange={(e) => setSelectedTestResult(e.target.value)}
                                style={{
                                    width: '100%',
                                    height: '46px',
                                    minHeight: '46px',
                                    padding: '0 14px',
                                    borderRadius: '8px',
                                    border: '1.5px solid #cbd5e1',
                                    fontSize: '14px',
                                    fontWeight: '800',
                                    lineHeight: '46px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    background: selectedTestResult === 'Pass' ? '#f0fdf4' : (selectedTestResult === 'Retest' ? '#fff7ed' : '#fef2f2'),
                                    color: selectedTestResult === 'Pass' ? '#166534' : (selectedTestResult === 'Retest' ? '#c2410c' : '#991b1b'),
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="Pass" style={{ color: '#166534', background: '#ffffff', fontWeight: '700' }}>Pass</option>
                                <option value="Retest" style={{ color: '#c2410c', background: '#ffffff', fontWeight: '700' }}>Retest</option>
                                <option value="Fail" style={{ color: '#991b1b', background: '#ffffff', fontWeight: '700' }}>Fail</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button 
                            className="btn-verify" 
                            style={{ 
                                flex: 1,
                                opacity: isSaving ? 0.7 : 1,
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                background: selectedTestResult === 'Pass' ? '#42818c' : (selectedTestResult === 'Retest' ? '#f59e0b' : '#ef4444')
                            }} 
                            disabled={isSaving}
                            onClick={() => {
                                setIsSaving(true);
                                onSave(batch, { results: manualResults, result: selectedTestResult });
                            }}
                        >
                            {isSaving ? 'Processing...' : `Confirm results: ${selectedTestResult}`}
                        </button>
                        <button className="btn-save" style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none' }} onClick={onClose}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MRDetailsModal = ({ batch, onClose, onModify, onEnterTest, onDelete }) => {
    if (!batch) return null;

    const createdTime = batch.createdDate ? new Date(batch.createdDate) : new Date();
    const diffMs = Date.now() - createdTime.getTime();
    const hoursPassed = diffMs / (1000 * 60 * 60);
    const canModifyOrDelete = hoursPassed <= 8;

    const details = [
        { label: 'Batch No', value: batch.batchNo },
        { label: 'Dwg. no.', value: batch.sleeperType },
        { label: 'Casting Date', value: batch.castingDate },
        { label: 'Sleeper Info', value: batch.isTestRecord ? batch.sleeperNo : batch.declaredSamples?.map(s => s.no).join(', ') },
        { label: 'Log Created', value: `${createdTime.toLocaleDateString('en-GB')} ${createdTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` }
    ];

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">MR Test Details</span>
                    <button className="form-modal-close" onClick={onClose}>×</button>
                </div>
                <div className="form-modal-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px' }}>
                        {details.map((detail, idx) => (
                            <div key={idx} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>{detail.label}</div>
                                <div style={{ fontSize: '14px', fontWeight: '800', color: '#13343b' }}>{detail.value}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                        {!batch.isTestRecord ? (
                            <button 
                                className="btn-verify" 
                                style={{ flex: '1 1 120px', borderRadius: '25px', padding: '10px' }} 
                                onClick={onEnterTest}
                            >
                                Enter Test Details
                            </button>
                        ) : null}
                        
                        <button
                            className="btn-save"
                            style={{ 
                                flex: '1 1 80px', 
                                background: '#f8fafc', 
                                border: '1px solid #e2e8f0', 
                                color: '#475569', 
                                borderRadius: '25px',
                                opacity: canModifyOrDelete ? 1 : 0.6,
                                padding: '10px',
                                cursor: canModifyOrDelete ? 'pointer' : 'not-allowed',
                                fontWeight: '700'
                            }}
                            disabled={!canModifyOrDelete}
                            onClick={onModify}
                        >
                            Modify
                        </button>
                        
                        <button
                            className="btn-save"
                            style={{ 
                                flex: '1 1 80px', 
                                background: '#f8fafc', 
                                border: '1px solid #e2e8f0', 
                                color: '#475569', 
                                borderRadius: '25px',
                                opacity: canModifyOrDelete ? 1 : 0.6,
                                padding: '10px',
                                cursor: canModifyOrDelete ? 'pointer' : 'not-allowed',
                                fontWeight: '700'
                            }}
                            disabled={!canModifyOrDelete}
                            onClick={() => onDelete(batch.id)}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MomentOfResistance;
