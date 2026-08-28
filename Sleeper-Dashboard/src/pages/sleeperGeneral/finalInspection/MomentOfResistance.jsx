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

            // 1. Fetch Verified Water Batches (Potential Declarations)
            const vResponse = await apiService.getAllVerifedWaterBatchs(params);
            const vData = vResponse?.responseData || vResponse || [];
            
            // 2. Fetch Declared MR Records (Pending Testing)
            const mrResponse = await apiService.getMRTodayRecords(params);
            const mrData = mrResponse?.responseData || mrResponse || [];

            // 3. Fetch Completed MR Tests (Historical)
            const testResponse = await apiService.getMRTestTodayRecords(params);
            const testData = testResponse?.responseData || testResponse || [];

            // Map Verified Batches
            const mappedVerified = vData
                .filter(item => item.plantId === params.plantId)
                .map(item => ({
                id: item.id,
                batchNo: item.batchNumber,
                sleeperCategory: item.sleeperCategory,
                sleeperType: item.mixDesignReference || 'N/A',
                castingDate: item.castingDate,
                waterCubeStatus: item.waterCubeTestStatus ? 'Completed' : 'Not Completed',
                mrSamplesNeeded: 1, 
                mrTestType: 'Fresh',
                status: 'Pending Declaration',
                originalData: item
            }));

            // Map Declared Records (Pending Results)
            const mappedDeclared = mrData
                .filter(item => item.plantId === params.plantId)
                .filter(item => !item.testResult || item.testResult === 'Pending')
                .map(item => ({
                ...item,
                batchNo: item.batchNumber,
                sleeperCategory: item.sleeperCategory,
                sleeperType: item.sleeperType,
                declaredSamples: [{ bench: item.benchNumber, no: item.sleeperNo }],
                castingDate: item.createdDate?.split('T')[0], 
                status: 'Testing Pending',
                mrTestType: 'Fresh',
                isTestRecord: false
            }));

            // Map Completed Tests (Historical)
            const mappedHistorical = testData
                .filter(item => item.plantId === params.plantId)
                .map(item => ({
                ...item,
                batchNo: item.batchNumber,
                sleeperCategory: item.sleeperCategory,
                sleeperType: item.sleeperType,
                declaredSamples: [{ bench: item.benchNumber || 'N/A', no: item.sleeperNo || '' }],
                castingDate: item.castingDate,
                dateOfTesting: item.createdDate?.split('T')[0],
                status: 'Pass',
                isTestRecord: true
            }));
            
            setBatches(mappedVerified);
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
                    benchNumber: String(samples[0].bench),
                    sleeperNo: samples[0].no,
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
                // CREATE for each sample
                const promises = samples.map(s => {
                    const payload = {
                        batchNumber: String(batch.batchNo),
                        sleeperType: batch.sleeperType,
                        benchNumber: String(s.bench),
                        sleeperNo: s.no,
                        testResult: 'Pending',
                        remarks: 'Declared for MR Testing',
                        vendorCode: params.vendorCode,
                        plantId: params.plantId,
                        shift: params.shift,
                        createdBy: currentUserId,
                        updatedBy: currentUserId
                    };
                    return apiService.createMRRecord(payload);
                });

                await Promise.all(promises);
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

            const payload = {
                batchNumber: String(record.batchNo),
                sleeperType: record.sleeperType,
                castingDate: record.castingDate || params.date,
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
                    rs: parseFloat(r.rs) || 0
                }))
            };

            if (record.isTestRecord) {
                // UPDATE existing test entry in history
                await apiService.updateMRTest(record.id, payload);
                toast.success("Test record updated successfully!");
            } else {
                // CREATE new test entry
                await apiService.createMRTest(payload);
                toast.success("Test results saved successfully!");
            }

            setActiveTab('historical');
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
        { key: 'sleeperType', label: 'Sleeper Type' },
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
        { key: 'sleeperType', label: 'Sleeper Type' },
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
        { key: 'sleeperType', label: 'Sleeper Type' },
        { key: 'benchNumber', label: 'Bench Number' },
        { key: 'sleeperNo', label: 'Sleeper No.' },
        { key: 'castingDate', label: 'Date of Casting' },
        { key: 'dateOfTesting', label: 'Date of Testing' },
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
            if (!batch?.id) return;
            setIsLoadingSleepers(true);
            try {
                // Use the provided API to fetch declaration details
                // Corrected API function name
                const response = await apiService.getProductionDeclarationRecordById(batch.id);
                const data = response?.responseData || response;
                
                const list = [];
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
                            <div className="input-group"><label>Sleeper Type</label><input readOnly value={batch?.sleeperType} className="readOnly" /></div>
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
    const [manualResults, setManualResults] = useState(() => {
        if (batch.details && batch.details.length > 0) {
            return batch.details.map(d => ({
                ...d,
                bench: batch.benchNumber,
                no: batch.sleeperNo,
                isScada: d.dataType === 'SCADA'
            }));
        }
        return batch.declaredSamples.map(s => ({ ...s, ct: '', cb: '', rs: '', date: new Date().toISOString().split('T')[0] }));
    });
    const [isSaving, setIsSaving] = useState(false);
    const [witnessed, setWitnessed] = useState(manualResults.map(r => !!r.isScada));

    const mockScadaData = useMemo(() => {
        return batch.declaredSamples.map(() => ({
            ct: Math.floor(460 + Math.random() * 100),
            cb: Math.floor(560 + Math.random() * 100),
            rs: Math.floor(660 + Math.random() * 100)
        }));
    }, [batch]);

    const handleWitness = (idx) => {
        const updatedManual = [...manualResults];
        updatedManual[idx] = { 
            ...updatedManual[idx], 
            ct: mockScadaData[idx].ct, 
            cb: mockScadaData[idx].cb, 
            rs: mockScadaData[idx].rs,
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

    const calculateResult = () => {
        const results = manualResults.map(r => {
            const pass = r.ct >= DESIRED_VALUES.centreTop && r.rs >= DESIRED_VALUES.railSeat;
            return pass;
        });

        if (batch.mrTestType === 'Fresh') {
            if (manualResults.length === 1) {
                return results[0] ? 'Pass' : 'Retest';
            } else {
                return results.every(r => r) ? 'Pass' : 'Fail';
            }
        } else { // Retest
            return results.every(r => r) ? 'Pass' : 'Fail';
        }
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
                            <div className="input-group"><label>Sleeper Type</label><input readOnly value={batch?.sleeperType} className="readOnly" /></div>
                            <div className="input-group"><label>Casting Date</label><input readOnly value={batch?.castingDate} className="readOnly" /></div>
                        </div>
                    </div>

                    {/* Section 2 & 3: SCADA & Manual Entry */}
                    {manualResults.map((res, idx) => (
                        <div key={idx} style={{ marginBottom: '24px', padding: '20px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h4 style={{ margin: 0, color: '#42818c' }}>Test for Sleeper: {res.bench}{res.no}</h4>
                                <button className="btn-verify" style={{ fontSize: '11px' }} onClick={() => handleWitness(idx)}>Witness through SCADA</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                {/* SCADA View */}
                                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>MR SCADA DATA</span>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                                        <div><div style={{ fontSize: '9px' }}>CT</div><div style={{ fontWeight: '700' }}>{mockScadaData[idx].ct}</div></div>
                                        {/* <div><div style={{ fontSize: '9px' }}>CB</div><div style={{ fontWeight: '700' }}>{mockScadaData[idx].cb}</div></div> */}
                                        <div><div style={{ fontSize: '9px' }}>RS</div><div style={{ fontWeight: '700' }}>{mockScadaData[idx].rs}</div></div>
                                    </div>
                                </div>

                                {/* Manual Form */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div className="input-group">
                                        <label>CT (KN)</label>
                                        <input type="number" readOnly={witnessed[idx]} value={res.ct} onChange={(e) => handleUpdateManual(idx, 'ct', e.target.value)} />
                                    </div>
                                    {/* <div className="input-group">
                                        <label>CB (KN)</label>
                                        <input type="number" readOnly={witnessed[idx]} value={res.cb} onChange={(e) => handleUpdateManual(idx, 'cb', e.target.value)} />
                                    </div> */}
                                    <div className="input-group">
                                        <label>RS (KN)</label>
                                        <input type="number" readOnly={witnessed[idx]} value={res.rs} onChange={(e) => handleUpdateManual(idx, 'rs', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button 
                            className="btn-verify" 
                            style={{ 
                                flex: 1,
                                opacity: isSaving ? 0.7 : 1,
                                cursor: isSaving ? 'not-allowed' : 'pointer'
                            }} 
                            disabled={isSaving}
                            onClick={() => {
                                setIsSaving(true);
                                onSave(batch, { results: manualResults, result: calculateResult() });
                            }}
                        >
                            {isSaving ? 'Processing...' : `Confirm results: ${calculateResult()}`}
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
        { label: 'Sleeper Type', value: batch.sleeperType },
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
