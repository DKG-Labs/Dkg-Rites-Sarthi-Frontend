import React, { useState, useMemo, useEffect } from 'react';
import EnhancedDataTable from '../../../components/common/EnhancedDataTable';
import { apiService } from '../../../services/api';
import { useShift } from '../../../context/ShiftContext';

// Helper to get today's date in local timezone YYYY-MM-DD
const getTodayLocalDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to format date string to ISO (yyyy-MM-dd) for HTML date inputs and LocalDate parsing
const formatDateToInput = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') return '';
    const str = String(dateStr).trim();
    if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
            const [d, m, y] = parts;
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
    }
    if (str.includes('-')) {
        return str.split('T')[0];
    }
    return str;
};

const isGrade = (val) => /^M\s*[-]?\s*\d+/i.test(String(val || '').trim());

const extractDrawingNo = (item) => {
    if (!item) return 'RT-8746';
    const candidates = [
        item.drawingNo,
        item.sleeperType,
    ];
    for (const cand of candidates) {
        if (cand && typeof cand === 'string' && cand.trim() && cand !== 'N/A' && !isGrade(cand)) {
            return cand.trim();
        }
    }
    if (Array.isArray(item.chambers)) {
        for (const ch of item.chambers) {
            if (Array.isArray(ch.benchGroups)) {
                for (const bg of ch.benchGroups) {
                    if (bg.sleeperType && !isGrade(bg.sleeperType)) return bg.sleeperType.trim();
                }
            }
        }
    }
    if (Array.isArray(item.gangs)) {
        for (const g of item.gangs) {
            if (g.sleeperType && !isGrade(g.sleeperType)) return g.sleeperType.trim();
        }
    }
    return item.sleeperType || item.drawingNo || 'RT-8746';
};

const normalizePlantType = (val) => {
    if (!val) return 'Long Line';
    const s = String(val).toLowerCase().trim();
    if (s.includes('stress')) return 'Stress Bench';
    return 'Long Line';
};

const MomentOfFailure = () => {
    const { dutyUnit, vendorCode, selectedShift, userId, dutyDate } = useShift();
    const [viewMode, setViewMode] = useState('statistics'); // 'statistics', 'declared', 'tested'
    const [showDeclareModal, setShowDeclareModal] = useState(false);
    const [showTestModal, setShowTestModal] = useState(false);
    const [selectedSample, setSelectedSample] = useState(null);
    const [isModifying, setIsModifying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedSleeperType, setSelectedSleeperType] = useState('RT-1234');

    // API Data
    const [declaredSamples, setDeclaredSamples] = useState([]);
    const [testedSamples, setTestedSamples] = useState([]);
    const [productionDeclarations, setProductionDeclarations] = useState([]);
    const [mrTests, setMrTests] = useState([]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const activePlantId = dutyUnit || localStorage.getItem('dutyUnit');
            const [samplesRes, testsRes, prodRes, mrRes] = await Promise.all([
                apiService.getAllMFSamples().catch(() => ({ responseData: [] })),
                apiService.getAllMFTests().catch(() => ({ responseData: [] })),
                apiService.getAllProductionDeclarations().catch(() => ({ responseData: [] })),
                apiService.getAllMRTests().catch(() => ({ responseData: [] }))
            ]);

            const filteredSamples = (samplesRes.responseData || [])
                .filter(s => s.plantId === activePlantId || !s.plantId);
            const filteredTests = (testsRes.responseData || [])
                .filter(t => t.plantId === activePlantId || !t.plantId);

            const rawProds = prodRes?.responseData || prodRes?.data?.responseData || prodRes?.data || (Array.isArray(prodRes) ? prodRes : []);
            const filteredProds = (Array.isArray(rawProds) ? rawProds : []).filter(p => {
                if (!activePlantId || !p.plantId) return true;
                const cleanItemPlant = String(p.plantId).replace(':', '').trim();
                const cleanTargetPlant = String(activePlantId).replace(':', '').trim();
                return cleanItemPlant === cleanTargetPlant;
            });

            const rawMr = mrRes?.responseData || mrRes?.data || (Array.isArray(mrRes) ? mrRes : []);

            setDeclaredSamples(filteredSamples);
            setTestedSamples(filteredTests);
            setProductionDeclarations(filteredProds);
            setMrTests(Array.isArray(rawMr) ? rawMr : []);
        } catch (error) {
            console.error('Failed to fetch MF data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Statistics Calculation filtered by sleeper type
    const stats = useMemo(() => {
        const totalSampling = declaredSamples.length;
        const totalTests = testedSamples.length;
        const strengths = testedSamples.map(s => parseFloat(s.strength)).filter(s => !isNaN(s) && s > 0);
        const avgStrength = strengths.length > 0 ? (strengths.reduce((a, b) => a + b, 0) / strengths.length).toFixed(2) : 0;
        const minStrength = strengths.length > 0 ? Math.min(...strengths) : 0;
        const maxStrength = strengths.length > 0 ? Math.max(...strengths) : 0;
        const passRate = totalTests > 0 ? ((testedSamples.filter(s => s.result?.toLowerCase() === 'pass').length / totalTests) * 100).toFixed(1) : 0;

        let sd = 0;
        if (strengths.length > 1) {
            const mean = parseFloat(avgStrength);
            const squareDiffs = strengths.map(s => Math.pow(s - mean, 2));
            sd = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / strengths.length).toFixed(2);
        }

        return {
            totalSampling,
            totalTests,
            avgStrength,
            minStrength,
            maxStrength,
            passRate,
            sd,
            lastTestDate: testedSamples.length > 0 ? testedSamples[0].testingDate : 'N/A',
            sleepersSinceLastTest: 245, // Static for now as per design
            retestPending: declaredSamples.filter(s => s.sampleType === 'Retest').length
        };
    }, [declaredSamples, testedSamples, selectedSleeperType]);

    const handleAddSample = () => {
        setSelectedSample(null);
        setIsModifying(false);
        setShowDeclareModal(true);
    };

    const handleModifySample = (sample) => {
        setSelectedSample(sample);
        setIsModifying(true);
        setShowDeclareModal(true);
    };

    const handleEnterTestDetails = (sample) => {
        setSelectedSample(sample);
        setShowTestModal(true);
    };

    const saveDeclaration = async (formData) => {
        try {
            setLoading(true);
            const payload = {
                ...formData,
                samplingDate: formData.samplingDate || getTodayLocalDate(),
                result: isModifying ? (selectedSample.result || 'PENDING') : (formData.result || 'PENDING'),
                plantId: dutyUnit || localStorage.getItem('dutyUnit'),
                vendorCode: vendorCode || localStorage.getItem('vendorCode'),
                shift: selectedShift || localStorage.getItem('selectedShift'),
                createdBy: isModifying ? undefined : (parseInt(userId || localStorage.getItem('userId')) || 0),
                updatedBy: isModifying ? (parseInt(userId || localStorage.getItem('userId')) || 0) : undefined,
            };

            if (isModifying) {
                await apiService.updateMFSample(selectedSample.id, payload);
            } else {
                await apiService.createMFSample(payload);
            }
            setShowDeclareModal(false);
            fetchData();
        } catch (error) {
            alert('Failed to save declaration: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const saveTestDetails = async (testData) => {
        try {
            setLoading(true);
            const currentUserId = parseInt(userId || localStorage.getItem('userId')) || 0;
            const loadNum = parseFloat(testData.loadKn ?? testData.strength) || 0;
            const rs1Num = parseFloat(testData.rs1) || 0;
            const rs2Num = parseFloat(testData.rs2) || 0;
            const basePayload = {
                modulusOfFailureId: selectedSample.isTestRecord ? selectedSample.modulusOfFailureId : selectedSample.id,
                testingDate: testData.testingDate,
                strength: loadNum,
                loadKn: loadNum,
                finalStrength: rs2Num,
                rs1: rs1Num,
                rs2: rs2Num,
                result: testData.result,
                remarks: testData.remarks || "",
                updatedBy: currentUserId,
                shift: selectedShift || localStorage.getItem('selectedShift'),
                vendorCode: vendorCode || localStorage.getItem('vendorCode'),
                plantId: dutyUnit || localStorage.getItem('dutyUnit'),
                batchNo: selectedSample.batchNo,
                castingDate: selectedSample.castingDate,
                sampleIdentification: selectedSample.sampleIdentification || selectedSample.sleeperNo,
                concreteGrade: selectedSample.concreteGrade
            };
            
            if (isModifying && selectedSample.isTestRecord) {
                await apiService.updateMFTest(selectedSample.id, basePayload);
            } else {
                await apiService.createMFTest({
                    ...basePayload,
                    createdBy: currentUserId
                });
            }
            setShowTestModal(false);
            fetchData();
        } catch (error) {
            alert('Failed to save test results: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const isActionable = (dateString) => {
        if (!dateString) return true;
        const diff = Date.now() - new Date(dateString).getTime();
        return diff < (8 * 60 * 60 * 1000);
    };

    const pendingSamples = useMemo(() => {
        // Only samples that haven't been tested yet
        return declaredSamples.filter(s => !testedSamples.some(t => t.modulusOfFailureId === s.id));
    }, [declaredSamples, testedSamples]);

    const handleDeleteRecord = async (id, isTest) => {
        if (!window.confirm(`Are you sure you want to delete this ${isTest ? 'test record' : 'sample declaration'}?`)) return;
        setLoading(true);
        try {
            if (isTest) {
                await apiService.deleteMFTest(id);
            } else {
                await apiService.deleteMFSample(id);
            }
            alert('Record deleted successfully');
            fetchData();
            setShowViewModal(false);
        } catch (error) {
            console.error('Failed to delete MF record:', error.message);
            alert('Delete failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const [showViewModal, setShowViewModal] = useState(false);

    const columnsDeclared = [
        { 
            key: 'plantType', 
            label: 'Plant',
            render: (val, row) => {
                if (val) return val;
                const match = (productionDeclarations || []).find(p => 
                    String(p.batchNumber || p.batchNo || '').trim().toLowerCase() === String(row.batchNo || '').trim().toLowerCase()
                );
                return match?.plantType || 'Long Line';
            }
        },
        { key: 'castingDate', label: 'Date of Casting' },
        { key: 'batchNo', label: 'Batch No.' },
        {
            key: 'mrResult',
            label: 'Result of MR',
            render: (val) => {
                const res = (val || 'PENDING').toUpperCase();
                let color = '#d97706';
                if (res === 'PASS') color = '#059669';
                if (res === 'FAIL') color = '#dc2626';
                return (
                    <span style={{ color, fontWeight: '800', fontSize: '11px', padding: '2px 8px', background: `${color}15`, borderRadius: '6px' }}>
                        {res}
                    </span>
                );
            }
        },
        { 
            key: 'concreteGrade', 
            label: 'Grade of Concrete',
            render: (val, row) => {
                if (val) return val;
                const match = (productionDeclarations || []).find(p => 
                    String(p.batchNumber || p.batchNo || '').trim().toLowerCase() === String(row.batchNo || '').trim().toLowerCase()
                );
                return match?.mixDesignReference || match?.concreteGrade || '-';
            }
        },
        { 
            key: 'sleeperType', 
            label: 'Drawing No.',
            render: (val, row) => {
                if (val && !isGrade(val)) return val;
                const match = (productionDeclarations || []).find(p => 
                    String(p.batchNumber || p.batchNo || '').trim().toLowerCase() === String(row.batchNo || '').trim().toLowerCase()
                );
                return extractDrawingNo(match) || match?.drawingNo || match?.sleeperType || '-';
            }
        },
        { key: 'sampleIdentification', label: 'Sample Identification', render: (val, row) => val || row.sleeperNo || '-' },
        { key: 'sampleType', label: 'Type of Sample' },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <button 
                    className="btn-verify" 
                    style={{ fontSize: '10px', padding: '6px 14px' }} 
                    onClick={() => { setSelectedSample(row); setShowViewModal(true); }}
                >
                    View Details
                </button>
            )
        }
    ];

    const columnsTested = [
        { key: 'testingDate', label: 'Date of Testing' },
        { key: 'sampleIdentification', label: 'Sleeper ID', render: (_, row) => {
            const val = row.sampleIdentification || declaredSamples.find(s => s.id === row.modulusOfFailureId)?.sampleIdentification;
            return val || '-';
        }},
        { key: 'batchNo', label: 'Batch No.', render: (_, row) => {
            const val = row.batchNo || declaredSamples.find(s => s.id === row.modulusOfFailureId)?.batchNo;
            return val || '-';
        }},
        { key: 'castingDate', label: 'Casting Date', render: (_, row) => {
            const val = row.castingDate || declaredSamples.find(s => s.id === row.modulusOfFailureId)?.castingDate;
            return val || '-';
        }},
        { key: 'concreteGrade', label: 'Grade', render: (_, row) => {
            const sample = declaredSamples.find(s => s.id === row.modulusOfFailureId);
            const val = row.concreteGrade || sample?.concreteGrade;
            if (val) return val;
            const bNo = row.batchNo || sample?.batchNo;
            const match = (productionDeclarations || []).find(p => 
                String(p.batchNumber || p.batchNo || '').trim().toLowerCase() === String(bNo || '').trim().toLowerCase()
            );
            return match?.mixDesignReference || match?.concreteGrade || '-';
        }},
        { key: 'loadKn', label: 'Load (KN)', render: (val, row) => {
            const loadVal = val !== undefined && val !== null ? val : (row.strength !== undefined && row.strength !== null ? row.strength : null);
            return loadVal !== null && loadVal !== '' ? `${loadVal} KN` : '-';
        }},
        { key: 'rs1', label: 'RS 1 (KN)', render: (val) => (val !== undefined && val !== null && val !== '' ? `${val} KN` : '-') },
        { key: 'rs2', label: 'RS 2 (KN)', render: (val) => (val !== undefined && val !== null && val !== '' ? `${val} KN` : '-') },
        { key: 'result', label: 'Result', render: (val) => {
            const res = (val || 'FAIL').toUpperCase();
            let color = '#dc2626';
            if (res === 'PASS') color = '#059669';
            if (res === 'RETEST') color = '#d97706';
            return (
                <span style={{ color, fontWeight: '800', fontSize: '11px', padding: '2px 8px', background: `${color}15`, borderRadius: '6px' }}>
                    {res}
                </span>
            );
        }},
        { key: 'remarks', label: 'Remarks' },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <button 
                    className="btn-verify" 
                    style={{ fontSize: '10px', padding: '6px 14px' }} 
                    onClick={() => { 
                        const sample = declaredSamples.find(s => s.id === row.modulusOfFailureId);
                        setSelectedSample({ ...row, ...sample, isTestRecord: true }); 
                        setShowViewModal(true); 
                    }}
                >
                    View Details
                </button>
            )
        }
    ];

    return (
        <div className="mof-module cement-forms-scope fade-in">
            <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#13343b', margin: 0 }}>Modulus of Failure (MF)</h2>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Structural integrity monitoring and failure limits</p>
                </div>
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
                    { id: 'statistics', label: 'Analytics' },
                    { id: 'declared', label: 'Sample Declared for Testing' },
                    { id: 'tested', label: 'Testing Completed' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`nav-tab ${viewMode === tab.id ? 'active' : ''}`}
                        style={{
                            border: 'none',
                            padding: '10px 24px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: viewMode === tab.id ? '800' : '600',
                            background: viewMode === tab.id ? '#fff' : 'transparent',
                            color: viewMode === tab.id ? '#13343b' : '#64748b',
                            boxShadow: viewMode === tab.id ? '0 4px 12px rgba(0, 0, 0, 0.08)' : 'none',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transform: viewMode === tab.id ? 'scale(1.02)' : 'scale(1)',
                        }}
                        onClick={() => setViewMode(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="tab-content" style={{ animation: 'fadeIn 0.3s ease' }}>
                {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>}

                {viewMode === 'statistics' && !loading && (
                    <div className="fade-in">
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                            {['RT-8746', 'RT-1234', 'RT-5678', 'RT-9012'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedSleeperType(type)}
                                    style={{
                                        padding: '6px 16px',
                                        borderRadius: '20px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        background: selectedSleeperType === type ? '#42818c' : '#fff',
                                        color: selectedSleeperType === type ? '#fff' : '#64748b',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '12px',
                            marginBottom: '24px'
                        }}>
                            <StatCard label="Total MF Sampling" value={stats.totalSampling} />
                            <StatCard label="Total MF Tests" value={stats.totalTests} />
                            <StatCard label="Average MF Value" value={stats.avgStrength} unit="N/mm²" />
                            <StatCard label="Pass Rate (%)" value={stats.passRate} unit="%" color={parseFloat(stats.passRate) > 95 ? '#10b981' : '#f59e0b'} />
                            <StatCard label="Minimum MF" value={stats.minStrength} unit="N/mm²" />
                            <StatCard label="Maximum MF" value={stats.maxStrength} unit="N/mm²" />
                            <StatCard label="Standard Deviation" value={stats.sd} />
                            <StatCard label="No. of Retest Pending" value={stats.retestPending} color={stats.retestPending > 0 ? '#ef4444' : '#1e293b'} />
                            <StatCard label="Last Test Date" value={stats.lastTestDate} />
                            <StatCard label="Sleepers Since Last Test" value={stats.sleepersSinceLastTest} color="#6366f1" />
                        </div>
                    </div>
                )}

                {viewMode === 'declared' && !loading && (
                    <div className="section-card fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h4 style={{ margin: 0, color: '#475569' }}>Pending Samples for MF Testing</h4>
                            <button className="btn-verify" onClick={handleAddSample}>+ Add New Sample</button>
                        </div>
                        <EnhancedDataTable columns={columnsDeclared} data={pendingSamples} />
                    </div>
                )}

                {viewMode === 'tested' && !loading && (
                    <div className="section-card fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h4 style={{ margin: 0, color: '#475569' }}>MF Test Record Archive</h4>
                        </div>
                        <EnhancedDataTable columns={columnsTested} data={testedSamples} />
                    </div>
                )}
            </div>

            {showViewModal && (
                <MFDetailsModal
                    sample={selectedSample}
                    productionDeclarations={productionDeclarations}
                    onClose={() => setShowViewModal(false)}
                    onModify={() => {
                        setShowViewModal(false);
                        setIsModifying(true);
                        if (selectedSample.isTestRecord) {
                            setShowTestModal(true);
                        } else {
                            setShowDeclareModal(true);
                        }
                    }}
                    onDelete={(id) => handleDeleteRecord(id, selectedSample.isTestRecord)}
                    onEnterTest={() => {
                        setShowViewModal(false);
                        setShowTestModal(true);
                    }}
                />
            )}

            {showDeclareModal && (
                <MFSampleDeclarationModal
                    sample={selectedSample}
                    isModifying={isModifying}
                    productionDeclarations={productionDeclarations}
                    mrTests={mrTests}
                    onClose={() => setShowDeclareModal(false)}
                    onSave={saveDeclaration}
                    saving={loading}
                />
            )}

            {showTestModal && (
                <MFTestDetailsModal
                    sample={selectedSample}
                    productionDeclarations={productionDeclarations}
                    onClose={() => setShowTestModal(false)}
                    onSave={saveTestDetails}
                    saving={loading}
                />
            )}
        </div>
    );
};

const StatCard = ({ label, value, unit = '', color = '#1e293b' }) => (
    <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
        <div style={{ fontSize: '18px', fontWeight: '800', color }}>{value} <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>{unit}</span></div>
    </div>
);

const BatchSearchableSelect = ({ value, onChange, options = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value || '');
    const containerRef = React.useRef(null);

    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        const q = searchTerm.toLowerCase().trim();
        return options.filter(opt => {
            const bNum = String(opt.batchNumber || opt.batchNo || '').toLowerCase();
            const drw = String(opt.drawingNo || opt.sleeperType || '').toLowerCase();
            const gr = String(opt.mixDesignReference || opt.concreteGrade || '').toLowerCase();
            return bNum.includes(q) || drw.includes(q) || gr.includes(q);
        });
    }, [options, searchTerm]);

    const handleSelect = (opt) => {
        const bNo = opt.batchNumber || opt.batchNo;
        setSearchTerm(bNo);
        onChange(bNo, opt);
        setIsOpen(false);
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        const match = options.find(opt => 
            String(opt.batchNumber || opt.batchNo || '').trim().toLowerCase() === String(val || '').trim().toLowerCase()
        );
        onChange(val, match);
        setIsOpen(true);
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search or enter Batch No..."
                    style={{
                        width: '100%',
                        paddingRight: '36px'
                    }}
                    autoComplete="off"
                />
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    zIndex: 1050
                }}>
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt, idx) => {
                            const bNo = opt.batchNumber || opt.batchNo;
                            const drw = opt.drawingNo || opt.sleeperType;
                            const gr = opt.mixDesignReference || opt.concreteGrade;
                            const isSelected = String(value || '').trim().toLowerCase() === String(bNo || '').trim().toLowerCase();

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleSelect(opt)}
                                    style={{
                                        padding: '10px 14px',
                                        cursor: 'pointer',
                                        background: isSelected ? '#f0f9fa' : 'transparent',
                                        borderBottom: idx < filteredOptions.length - 1 ? '1px solid #f1f5f9' : 'none',
                                        transition: 'background 0.15s ease'
                                    }}
                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '700', fontSize: '13px', color: '#13343b' }}>{bNo}</span>
                                        {gr && (
                                             <span style={{
                                                fontSize: '10px',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                background: '#e0f2fe',
                                                color: '#0369a1',
                                                fontWeight: '700'
                                            }}>
                                                {gr}
                                            </span>
                                        )}
                                    </div>
                                    {drw && (
                                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                            Drawing: <span style={{ color: '#475569', fontWeight: '600' }}>{drw}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ padding: '14px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                            No matching batch found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const MFSampleDeclarationModal = ({ sample, isModifying, onClose, onSave, saving, productionDeclarations = [], mrTests = [] }) => {
    const [localDeclarations, setLocalDeclarations] = useState(productionDeclarations || []);
    const [availableSleepers, setAvailableSleepers] = useState([]);
    const [isLoadingSleepers, setIsLoadingSleepers] = useState(false);

    useEffect(() => {
        if (productionDeclarations && productionDeclarations.length > 0) {
            setLocalDeclarations(productionDeclarations);
        } else {
            apiService.getAllProductionDeclarations().then(res => {
                const data = res?.responseData || res?.data?.responseData || res?.data || (Array.isArray(res) ? res : []);
                if (Array.isArray(data)) setLocalDeclarations(data);
            }).catch(err => console.error("Error fetching production declarations:", err));
        }
    }, [productionDeclarations]);

    const [formData, setFormData] = useState(sample ? {
        plantType: normalizePlantType(sample.plantType),
        castingDate: formatDateToInput(sample.castingDate) || getTodayLocalDate(),
        batchNo: sample.batchNo || '',
        mrResult: sample.mrResult || 'PENDING',
        concreteGrade: sample.concreteGrade || '',
        sleeperType: sample.sleeperType || '',
        sleeperId: sample.sleeperNo || sample.sampleIdentification || '',
        sampleIdentification: sample.sampleIdentification || sample.sleeperNo || '',
        sampleType: sample.sampleType || 'Fresh'
    } : {
        plantType: 'Long Line',
        castingDate: getTodayLocalDate(),
        batchNo: '',
        mrResult: 'PENDING',
        concreteGrade: '',
        sleeperType: '',
        sleeperId: '',
        sampleIdentification: '',
        sampleType: 'Fresh'
    });

    // Batches filtered by Date of Casting if date is provided
    const batchOptions = useMemo(() => {
        if (!localDeclarations || !Array.isArray(localDeclarations)) return [];
        const seen = new Set();
        return localDeclarations.filter(p => {
            const bNo = String(p.batchNumber || p.batchNo || '').trim();
            if (!bNo || seen.has(bNo.toLowerCase())) return false;
            if (formData.castingDate) {
                const pDate = formatDateToInput(p.castingDate || p.dateOfCasting);
                if (pDate && pDate !== formData.castingDate) return false;
            }
            seen.add(bNo.toLowerCase());
            return true;
        });
    }, [localDeclarations, formData.castingDate]);

    // Fetch sleepers whenever batchNo changes or modal mounts with a batch
    useEffect(() => {
        const fetchSleepersForBatch = async () => {
            if (!formData.batchNo) {
                setAvailableSleepers([]);
                return;
            }

            setIsLoadingSleepers(true);
            try {
                const cleanBatch = String(formData.batchNo).trim();
                let list = [];

                // Method 1: getAllProductionSleepers API
                try {
                    const sleepersRes = await apiService.getAllProductionSleepers(cleanBatch);
                    const data = sleepersRes?.responseData || sleepersRes?.data || sleepersRes;
                    if (Array.isArray(data) && data.length > 0) {
                        data.forEach(s => {
                            const num = typeof s === 'string' ? s : (s.sleeperNo || s.sleeperId || s.id);
                            if (num) {
                                list.push({
                                    bench: s.benchNo || s.gangNo || '',
                                    mould: s.mouldNo || '',
                                    no: String(num),
                                    label: String(num)
                                });
                            }
                        });
                    }
                } catch (e) {
                    console.warn("getAllProductionSleepers failed, attempting declaration fallback:", e);
                }

                // Method 2: fallback to matching declaration in localDeclarations
                if (list.length === 0) {
                    const match = (localDeclarations || []).find(p => 
                        String(p.batchNumber || p.batchNo || '').trim().toLowerCase() === cleanBatch.toLowerCase()
                    );
                    const declId = match?.id;
                    if (declId) {
                        try {
                            const response = await apiService.getProductionDeclarationRecordById(declId);
                            const data = response?.responseData || response;
                            if (data?.chambers) {
                                data.chambers.forEach(ch => {
                                    ch.benchGroups?.forEach(bg => {
                                        const sList = bg.sleeperList || bg.sleepers || [];
                                        sList.forEach(item => {
                                            const s = typeof item === 'string' ? item : (item.sleeperNo || item.id);
                                            if (!s) return;
                                            list.push({
                                                bench: String(bg.benchNo || ''),
                                                mould: String(item.mouldNo || ''),
                                                no: String(s),
                                                label: String(s)
                                            });
                                        });
                                    });
                                });
                            }
                            if (data?.gangs) {
                                data.gangs.forEach(g => {
                                    const sList = g.sleeperList || g.sleepers || [];
                                    sList.forEach(item => {
                                        const s = typeof item === 'string' ? item : (item.sleeperNo || item.id);
                                        if (!s) return;
                                        list.push({
                                            bench: String(g.gangNo || ''),
                                            mould: String(item.mouldNo || ''),
                                            no: String(s),
                                            label: String(s)
                                        });
                                    });
                                });
                            }
                        } catch (err) {
                            console.warn("getProductionDeclarationRecordById error:", err);
                        }
                    }
                }

                setAvailableSleepers(list);
            } catch (err) {
                console.error("Error fetching sleepers for MF sample:", err);
            } finally {
                setIsLoadingSleepers(false);
            }
        };

        fetchSleepersForBatch();
    }, [formData.batchNo, localDeclarations]);

    const handleBatchChange = (batchVal, matchedOpt) => {
        const updated = { ...formData, batchNo: batchVal };
        const cleanVal = String(batchVal || '').trim().toLowerCase();

        const match = matchedOpt || (localDeclarations || []).find(p => 
            String(p.batchNumber || p.batchNo || '').trim().toLowerCase() === cleanVal
        );

        if (match) {
            // Concrete Grade (Auto fetch)
            const grade = match.mixDesignReference || match.concreteGrade;
            if (grade) updated.concreteGrade = grade;

            // Drawing No. (Sleeper Type) (Auto fetch)
            const drwg = extractDrawingNo(match);
            if (drwg) updated.sleeperType = drwg;

            // Date of Casting (Auto sync if batch has castingDate)
            if (match.castingDate || match.dateOfCasting) {
                updated.castingDate = formatDateToInput(match.castingDate || match.dateOfCasting);
            }

            // Plant Type (Longline / Stress Bench)
            if (match.plantType) {
                updated.plantType = normalizePlantType(match.plantType);
            } else if (match.chambers) {
                updated.plantType = 'Stress Bench';
            } else if (match.gangs) {
                updated.plantType = 'Long Line';
            }
        }

        // Auto-fetch MR Result for this batch from mrTests
        const matchedMr = (mrTests || []).find(m => 
            String(m.batchNo || m.batchNumber || '').trim().toLowerCase() === cleanVal
        );
        if (matchedMr) {
            updated.mrResult = (matchedMr.testResult || matchedMr.result || matchedMr.status || 'PASS').toUpperCase();
        } else {
            updated.mrResult = 'PENDING';
        }

        setFormData(updated);
    };

    const handleSleeperIdSelect = (val) => {
        const selectedObj = availableSleepers.find(s => String(s.no) === String(val));
        let sampleIdent = val;
        if (selectedObj && selectedObj.bench && selectedObj.mould) {
            const lineStr = selectedObj.line || 'Shed 1';
            sampleIdent = `${lineStr} + ${selectedObj.bench} + ${selectedObj.mould}`;
        }
        setFormData(prev => ({
            ...prev,
            sleeperId: val,
            sampleIdentification: sampleIdent || val
        }));
    };

    const handleCastingDateChange = (newDate) => {
        setFormData(prev => {
            const updated = { ...prev, castingDate: newDate };
            // Check if current batch is still valid for this casting date
            if (prev.batchNo) {
                const match = (localDeclarations || []).find(p => 
                    String(p.batchNumber || p.batchNo || '').trim().toLowerCase() === String(prev.batchNo).trim().toLowerCase()
                );
                if (match) {
                    const matchDate = formatDateToInput(match.castingDate || match.dateOfCasting);
                    if (matchDate && matchDate !== newDate) {
                        updated.batchNo = '';
                        updated.concreteGrade = '';
                        updated.sleeperType = '';
                        updated.sleeperId = '';
                        updated.sampleIdentification = '';
                    }
                }
            }
            return updated;
        });
    };

    const handleSubmit = () => {
        if (!formData.plantType || !formData.castingDate || !formData.batchNo || !formData.concreteGrade || !formData.sleeperType || !formData.sleeperId || !formData.sampleType) {
            alert("Please fill in all mandatory fields.");
            return;
        }

        const sIdent = formData.sampleIdentification || formData.sleeperId;

        const payload = {
            ...formData,
            plantType: normalizePlantType(formData.plantType),
            sampleIdentification: sIdent,
            sleeperNo: formData.sleeperId || sIdent,
            mrResult: formData.mrResult || 'PENDING',
            result: isModifying ? (selectedSample.result || 'PENDING') : 'PENDING'
        };

        onSave(payload);
    };

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">{isModifying ? 'Modify' : 'Enter'} Sample Details</span>
                    <button className="form-modal-close" onClick={onClose}>×</button>
                </div>
                <div className="form-modal-body">
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* 1. Plant (Longline/ Stress Bench) */}
                        <div className="input-group">
                            <label>1. Plant – Long Line / Stress Bench <span style={{ color: '#ef4444' }}>*</span></label>
                            <select 
                                value={normalizePlantType(formData.plantType)} 
                                onChange={e => setFormData({ ...formData, plantType: e.target.value })}
                            >
                                <option value="Long Line">Long Line</option>
                                <option value="Stress Bench">Stress Bench</option>
                            </select>
                        </div>

                        {/* 2. Date of Casting */}
                        <div className="input-group">
                            <label>2. Date of Casting <span style={{ color: '#ef4444' }}>*</span></label>
                            <input 
                                type="date" 
                                value={formData.castingDate} 
                                onChange={e => handleCastingDateChange(e.target.value)} 
                            />
                        </div>

                        {/* 3. Batch No. */}
                        <div className="input-group">
                            <label>3. Batch No. <span style={{ color: '#ef4444' }}>*</span></label>
                            <BatchSearchableSelect
                                value={formData.batchNo}
                                onChange={handleBatchChange}
                                options={batchOptions}
                            />
                        </div>

                        {/* 4. Result of MR for the Batch */}
                        <div className="input-group">
                            <label>4. Result of MR for the Batch</label>
                            <select
                                value={formData.mrResult || 'PENDING'}
                                onChange={e => setFormData({ ...formData, mrResult: e.target.value })}
                                style={{
                                    fontWeight: '700',
                                    color: (formData.mrResult || '').toUpperCase() === 'PASS' 
                                        ? '#059669' 
                                        : ((formData.mrResult || '').toUpperCase() === 'FAIL' ? '#dc2626' : '#d97706')
                                }}
                            >
                                <option value="PENDING">PENDING</option>
                                <option value="PASS">PASS</option>
                                <option value="FAIL">FAIL</option>
                                <option value="RETEST">RETEST</option>
                            </select>
                        </div>

                        {/* 5. Grade of Concrete - Auto Fetch */}
                        <div className="input-group">
                            <label>5. Concrete Grade (Auto-fetch)</label>
                            <input 
                                type="text" 
                                readOnly 
                                value={formData.concreteGrade || ''} 
                                placeholder="Auto-populated from Batch"
                                style={{ 
                                    background: '#f8fafc', 
                                    color: '#1e293b', 
                                    cursor: 'not-allowed', 
                                    fontWeight: '700',
                                    border: '1px solid #e2e8f0'
                                }} 
                            />
                        </div>

                        {/* 6. Drawing No. (Sleeper Type) - Auto fetch */}
                        <div className="input-group">
                            <label>6. Drawing No. (Sleeper Type) (Auto-fetch)</label>
                            <input 
                                type="text" 
                                readOnly 
                                value={formData.sleeperType || ''} 
                                placeholder="Auto-populated from Batch"
                                style={{ 
                                    background: '#f8fafc', 
                                    color: '#7c3aed', 
                                    cursor: 'not-allowed', 
                                    fontWeight: '700',
                                    border: '1px solid #e2e8f0'
                                }} 
                            />
                        </div>

                        {/* 7. Sleeper ID (can be selected from dropdown) */}
                        <div className="input-group">
                            <label>7. Sleeper ID <span style={{ color: '#ef4444' }}>*</span></label>
                            {availableSleepers.length > 0 ? (
                                <select
                                    value={formData.sleeperId}
                                    onChange={e => handleSleeperIdSelect(e.target.value)}
                                    style={{ fontWeight: '600' }}
                                >
                                    <option value="">Select Sleeper ID</option>
                                    {availableSleepers.map((s, idx) => (
                                        <option key={idx} value={s.no}>
                                            {s.no}{s.bench ? ` (Bench/Gang: ${s.bench}${s.mould ? `, Mould: ${s.mould}` : ''})` : ''}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={formData.sleeperId}
                                    onChange={e => handleSleeperIdSelect(e.target.value)}
                                    placeholder={isLoadingSleepers ? "Loading sleepers..." : (formData.batchNo ? "Enter or select Sleeper ID" : "Select Batch first")}
                                />
                            )}
                        </div>

                        {/* 8. Sample Identification (Auto-fetch) */}
                        <div className="input-group">
                            <label>8. Sample Identification (Auto-fetch)</label>
                            <input 
                                type="text" 
                                readOnly
                                value={formData.sampleIdentification || ''} 
                                placeholder="Auto-populated from Sleeper ID"
                                style={{ 
                                    background: '#f8fafc', 
                                    color: '#13343b', 
                                    cursor: 'not-allowed', 
                                    fontWeight: '700',
                                    border: '1px solid #e2e8f0'
                                }}
                            />
                        </div>

                        {/* 9. Type of Sample (Retest/ Fresh) */}
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label>9. Type of Sample (Retest / Fresh) <span style={{ color: '#ef4444' }}>*</span></label>
                            <select 
                                value={formData.sampleType} 
                                onChange={e => setFormData({ ...formData, sampleType: e.target.value })}
                                style={{ fontWeight: '600' }}
                            >
                                <option value="Fresh">Fresh</option>
                                <option value="Retest">Retest</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                        <button 
                            className="btn-verify" 
                            disabled={saving} 
                            style={{ flex: 1 }} 
                            onClick={handleSubmit}
                        >
                            {saving ? 'Saving...' : (isModifying ? 'Update Sample Detail' : 'Save Sample Detail')}
                        </button>
                        <button 
                            className="btn-save" 
                            style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none' }} 
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MFTestDetailsModal = ({ sample, onClose, onSave, saving, productionDeclarations = [] }) => {
    const [testData, setTestData] = useState({
        testingDate: formatDateToInput(sample?.testingDate) || getTodayLocalDate(),
        loadKn: sample?.loadKn !== undefined && sample?.loadKn !== null ? sample.loadKn : (sample?.strength !== undefined && sample?.strength !== null ? sample.strength : ''),
        rs1: sample?.rs1 !== undefined && sample?.rs1 !== null ? sample.rs1 : '',
        rs2: sample?.rs2 !== undefined && sample?.rs2 !== null ? sample.rs2 : '',
        result: sample?.result && sample.result !== 'PENDING' ? sample.result : 'PASS',
        remarks: sample?.remarks || ''
    });

    const matchedProd = (productionDeclarations || []).find(p => 
        String(p.batchNumber || p.batchNo || '').trim().toLowerCase() === String(sample.batchNo || '').trim().toLowerCase()
    );

    const resolvedDrawingNo = extractDrawingNo(sample) || extractDrawingNo(matchedProd);
    const resolvedConcreteGrade = sample.concreteGrade || matchedProd?.mixDesignReference || matchedProd?.concreteGrade || '-';

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">Enter MF Test Details: {sample.sampleIdentification || sample.sleeperNo || sample.batchNo}</span>
                    <button className="form-modal-close" onClick={onClose}>×</button>
                </div>
                <div className="form-modal-body">
                    <h5 style={{ margin: '0 0 16px 0', color: '#42818c', fontSize: '14px' }}>Declaration Summary</h5>
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                            <div><span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Plant</span><div style={{ fontWeight: '700' }}>{sample.plantType || 'Long Line'}</div></div>
                            <div><span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Date of Casting</span><div style={{ fontWeight: '700' }}>{sample.castingDate || '-'}</div></div>
                            <div><span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Batch No</span><div style={{ fontWeight: '700' }}>{sample.batchNo}</div></div>
                            <div><span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Grade</span><div style={{ fontWeight: '700' }}>{resolvedConcreteGrade}</div></div>
                            <div><span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Drawing No</span><div style={{ fontWeight: '700', color: '#7c3aed' }}>{resolvedDrawingNo}</div></div>
                            <div><span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Type of Sample</span><div style={{ fontWeight: '700' }}>{sample.sampleType || 'Fresh'}</div></div>
                            <div><span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Result of MR</span><div style={{ fontWeight: '700', color: (sample.mrResult || '').toUpperCase() === 'PASS' ? '#059669' : '#d97706' }}>{sample.mrResult || 'PENDING'}</div></div>
                            <div style={{ gridColumn: 'span 2' }}><span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Sample Identification</span><div style={{ fontWeight: '800', color: '#42818c', fontSize: '15px' }}>{sample.sampleIdentification || sample.sleeperNo || '-'}</div></div>
                        </div>
                    </div>

                    <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '20px' }}>
                        <div className="input-group">
                            <label>Date of Testing</label>
                            <input 
                                type="date" 
                                readOnly
                                value={testData.testingDate} 
                                style={{ 
                                    width: '100%', 
                                    background: '#f8fafc', 
                                    color: '#1e293b', 
                                    cursor: 'not-allowed', 
                                    fontWeight: '700', 
                                    border: '1px solid #e2e8f0' 
                                }}
                            />
                        </div>

                        {/* Three Readings: Load (KN), RS 1, RS 2 */}
                        <div style={{ 
                            background: '#f8fafc', 
                            padding: '16px', 
                            borderRadius: '10px', 
                            border: '1px solid #e2e8f0' 
                        }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#13343b' }}>Load (KN) <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        value={testData.loadKn} 
                                        onChange={e => setTestData({ ...testData, loadKn: e.target.value })} 
                                        placeholder="0.00" 
                                    />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#13343b' }}>RS 1 <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        value={testData.rs1} 
                                        onChange={e => setTestData({ ...testData, rs1: e.target.value })} 
                                        placeholder="0.00" 
                                    />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#13343b' }}>RS 2 <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        value={testData.rs2} 
                                        onChange={e => setTestData({ ...testData, rs2: e.target.value })} 
                                        placeholder="0.00" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Result</label>
                            <select
                                value={testData.result}
                                onChange={e => setTestData({ ...testData, result: e.target.value })}
                                style={{
                                    fontWeight: '800',
                                    color: testData.result?.toUpperCase() === 'PASS' 
                                        ? '#059669' 
                                        : (testData.result?.toUpperCase() === 'FAIL' ? '#dc2626' : '#d97706')
                                }}
                            >
                                <option value="PASS">PASS</option>
                                <option value="FAIL">FAIL</option>
                                <option value="RETEST">RETEST</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label>Remarks</label>
                            <textarea value={testData.remarks} onChange={e => setTestData({ ...testData, remarks: e.target.value })} placeholder="Enter observations..." style={{ minHeight: '80px', padding: '12px' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                        <button 
                            className="btn-verify" 
                            disabled={saving} 
                            style={{ flex: 1 }} 
                            onClick={() => {
                                if (!testData.result) {
                                    alert("Please select a Result (PASS/FAIL/RETEST).");
                                    return;
                                }
                                onSave(testData);
                            }}
                        >
                            {saving ? 'Saving...' : 'Save & Finalize Test'}
                        </button>
                        <button className="btn-save" style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none' }} onClick={onClose}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MFDetailsModal = ({ sample, onClose, onModify, onEnterTest, onDelete, productionDeclarations = [] }) => {
    if (!sample) return null;

    const matchedProd = (productionDeclarations || []).find(p => 
        String(p.batchNumber || p.batchNo || '').trim().toLowerCase() === String(sample.batchNo || '').trim().toLowerCase()
    );

    const resolvedDrawingNo = extractDrawingNo(sample) || extractDrawingNo(matchedProd);
    const resolvedConcreteGrade = sample.concreteGrade || matchedProd?.mixDesignReference || matchedProd?.concreteGrade || '-';

    // Logic: 8-hour window from creation (only if createdDate is provided by server)
    const createdTime = sample.createdDate ? new Date(sample.createdDate) : null;
    const canModifyOrDelete = !createdTime || (Date.now() - createdTime.getTime()) <= (8 * 60 * 60 * 1000);

    const loadDisplay = sample.loadKn !== undefined && sample.loadKn !== null ? `${sample.loadKn} KN` : (sample.strength !== undefined && sample.strength !== null ? `${sample.strength} KN` : '-');
    const rs1Display = sample.rs1 !== undefined && sample.rs1 !== null && sample.rs1 !== '' ? `${sample.rs1} KN` : '-';
    const rs2Display = sample.rs2 !== undefined && sample.rs2 !== null && sample.rs2 !== '' ? `${sample.rs2} KN` : '-';

    const details = sample.isTestRecord ? [
        { label: 'Plant', value: sample.plantType || 'Long Line' },
        { label: 'Date of Casting', value: sample.castingDate || '-' },
        { label: 'Batch No.', value: sample.batchNo || '-' },
        { label: 'Result of MR', value: sample.mrResult || 'PENDING' },
        { label: 'Grade of Concrete', value: resolvedConcreteGrade },
        { label: 'Drawing No. (Sleeper Type)', value: resolvedDrawingNo },
        { label: 'Sleeper ID', value: sample.sleeperNo || sample.sampleIdentification || '-' },
        { label: 'Sample Identification', value: sample.sampleIdentification || sample.sleeperNo || '-' },
        { label: 'Type of Sample', value: sample.sampleType || 'Fresh' },
        { label: 'Date of Testing', value: sample.testingDate },
        { label: 'Load (KN)', value: loadDisplay },
        { label: 'RS 1', value: rs1Display },
        { label: 'RS 2', value: rs2Display },
        { label: 'Result', value: sample.result },
        { label: 'Remarks', value: sample.remarks || 'None' }
    ] : [
        { label: 'Plant', value: sample.plantType || 'Long Line' },
        { label: 'Date of Casting', value: sample.castingDate || '-' },
        { label: 'Batch No.', value: sample.batchNo },
        { label: 'Result of MR', value: sample.mrResult || 'PENDING' },
        { label: 'Grade of Concrete', value: resolvedConcreteGrade },
        { label: 'Drawing No. (Sleeper Type)', value: resolvedDrawingNo },
        { label: 'Sleeper ID', value: sample.sleeperNo || sample.sampleIdentification || '-' },
        { label: 'Sample Identification', value: sample.sampleIdentification || sample.sleeperNo || '-' },
        { label: 'Type of Sample', value: sample.sampleType || 'Fresh' }
    ];

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">MF Test Details</span>
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

                    <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
                        {!sample.isTestRecord ? (
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
                                background: canModifyOrDelete ? '#f8fafc' : '#f1f5f9', 
                                border: '1px solid #e2e8f0', 
                                color: canModifyOrDelete ? '#475569' : '#94a3b8', 
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
                                background: canModifyOrDelete ? '#fff1f2' : '#f1f5f9', 
                                border: '1px solid #fecaca', 
                                color: canModifyOrDelete ? '#be123c' : '#94a3b8', 
                                borderRadius: '25px',
                                opacity: canModifyOrDelete ? 1 : 0.6,
                                padding: '10px',
                                cursor: canModifyOrDelete ? 'pointer' : 'not-allowed',
                                fontWeight: '700'
                            }}
                            disabled={!canModifyOrDelete}
                            onClick={() => onDelete(sample.id)}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MomentOfFailure;
