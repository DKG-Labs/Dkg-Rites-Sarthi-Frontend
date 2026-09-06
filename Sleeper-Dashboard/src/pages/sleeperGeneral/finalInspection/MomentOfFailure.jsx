import React, { useState, useMemo, useEffect } from 'react';
import EnhancedDataTable from '../../../components/common/EnhancedDataTable';
import { apiService } from '../../../services/api';
import { useShift } from '../../../context/ShiftContext';

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

    const fetchData = async () => {
        try {
            setLoading(true);
            const activePlantId = dutyUnit || localStorage.getItem('dutyUnit');
            const [samplesRes, testsRes, prodRes] = await Promise.all([
                apiService.getAllMFSamples().catch(() => ({ responseData: [] })),
                apiService.getAllMFTests().catch(() => ({ responseData: [] })),
                apiService.getAllProductionDeclarations().catch(() => ({ responseData: [] }))
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

            setDeclaredSamples(filteredSamples);
            setTestedSamples(filteredTests);
            setProductionDeclarations(filteredProds);
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
            const basePayload = {
                modulusOfFailureId: selectedSample.isTestRecord ? selectedSample.modulusOfFailureId : selectedSample.id,
                testingDate: testData.testingDate,
                strength: parseFloat(testData.strength) || 0,
                result: testData.result,
                remarks: testData.remarks || "",
                updatedBy: currentUserId,
                shift: selectedShift || localStorage.getItem('selectedShift'),
                vendorCode: vendorCode || localStorage.getItem('vendorCode'),
                plantId: dutyUnit || localStorage.getItem('dutyUnit'),
                batchNo: selectedSample.batchNo,
                castingDate: selectedSample.castingDate,
                sampleIdentification: selectedSample.sampleIdentification,
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
        { key: 'samplingDate', label: 'Date of Sampling' },
        { key: 'batchNo', label: 'Batch Number' },
        { key: 'castingDate', label: 'Date of Casting' },
        { 
            key: 'concreteGrade', 
            label: 'Concrete Grade',
            render: (val, row) => {
                if (val) return val;
                const match = (productionDeclarations || []).find(p => 
                    String(p.batchNumber || p.batchNo || '').trim().toLowerCase() === String(row.batchNo || '').trim().toLowerCase()
                );
                return match?.mixDesignReference || match?.concreteGrade || '-';
            }
        },
        { key: 'shedLineNumber', label: 'Shed/Line No.' },
        { 
            key: 'sleeperType', 
            label: 'Drawing No.',
            render: (val, row) => {
                if (val) return val;
                const match = (productionDeclarations || []).find(p => 
                    String(p.batchNumber || p.batchNo || '').trim().toLowerCase() === String(row.batchNo || '').trim().toLowerCase()
                );
                return match?.drawingNo || match?.sleeperType || '-';
            }
        },
        { key: 'sampleIdentification', label: 'Sample Identification' },
        { key: 'sampleType', label: 'Type' },
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
        { key: 'sampleIdentification', label: 'Identification', render: (_, row) => {
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
        { key: 'strength', label: 'Strength' },
        { key: 'finalStrength', label: 'Final Strength' },
        { key: 'result', label: 'Result', render: (val) => (
            <span style={{ color: (val || '').toLowerCase() === 'pass' ? '#059669' : '#dc2626', fontWeight: '800', fontSize: '11px' }}>{val || 'FAIL'}</span>
        )},
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

const MFSampleDeclarationModal = ({ sample, isModifying, onClose, onSave, saving, productionDeclarations = [] }) => {
    const [localDeclarations, setLocalDeclarations] = useState(productionDeclarations || []);

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
        samplingDate: formatDateToInput(sample.samplingDate) || new Date().toISOString().split('T')[0],
        concreteGrade: sample.concreteGrade || '',
        plantType: sample.plantType || '',
        shedLineNumber: sample.shedLineNumber || '',
        batchNo: sample.batchNo || '',
        castingDate: formatDateToInput(sample.castingDate) || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        benchGangNumber: sample.benchGangNumber || '',
        mouldNo: sample.mouldNo || '',
        result: sample.result || 'PENDING',
        sampleType: sample.sampleType || '',
        sleeperType: sample.sleeperType || ''
    } : {
        samplingDate: new Date().toISOString().split('T')[0],
        concreteGrade: '',
        plantType: '',
        shedLineNumber: '',
        batchNo: '',
        castingDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        benchGangNumber: '',
        mouldNo: '',
        result: 'PENDING',
        sampleType: '',
        sleeperType: 'RT-8746'
    });

    const batchOptions = useMemo(() => {
        if (!localDeclarations || !Array.isArray(localDeclarations)) return [];
        const seen = new Set();
        return localDeclarations.filter(p => {
            const bNo = String(p.batchNumber || p.batchNo || '').trim();
            if (!bNo || seen.has(bNo.toLowerCase())) return false;
            seen.add(bNo.toLowerCase());
            return true;
        });
    }, [localDeclarations]);

    const handleBatchChange = (batchVal, matchedOpt) => {
        const updated = { ...formData, batchNo: batchVal };
        const cleanVal = String(batchVal || '').trim().toLowerCase();

        const match = matchedOpt || (localDeclarations || []).find(p => 
            String(p.batchNumber || p.batchNo || '').trim().toLowerCase() === cleanVal
        );

        if (match) {
            // Concrete Grade (mixDesignReference or concreteGrade)
            const grade = match.mixDesignReference || match.concreteGrade;
            if (grade) updated.concreteGrade = grade;

            // Drawing No. (Sleeper Type) (drawingNo or sleeperType)
            const drwg = match.drawingNo || match.sleeperType;
            if (drwg) updated.sleeperType = drwg;

            // Date of Casting
            if (match.castingDate) {
                updated.castingDate = formatDateToInput(match.castingDate);
            }

            // Plant Type
            if (match.plantType) {
                updated.plantType = match.plantType;
            }

            // Shed/Line Number
            const unit = match.productionUnit || match.lineNo || match.shedLineNumber;
            if (unit) {
                updated.shedLineNumber = unit;
            }
        }
        setFormData(updated);
    };

    const identification = `${formData.shedLineNumber || ''} + ${formData.benchGangNumber || ''} + ${formData.mouldNo || ''}`;

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">{isModifying ? 'Modify' : 'Enter'} Sample Details</span>
                    <button className="form-modal-close" onClick={onClose}>×</button>
                </div>
                <div className="form-modal-body">
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="input-group">
                            <label>Date of Sampling</label>
                            <input type="date" value={formData.samplingDate} onChange={e => setFormData({ ...formData, samplingDate: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Batch No.</label>
                            <BatchSearchableSelect
                                value={formData.batchNo}
                                onChange={handleBatchChange}
                                options={batchOptions}
                            />
                        </div>
                        <div className="input-group">
                            <label>Plant – Long Line / Stress Bench</label>
                            <select value={formData.plantType} onChange={e => setFormData({ ...formData, plantType: e.target.value })}>
                                <option value="">Select Plant</option>
                                <option value="Long Line">Long Line</option>
                                <option value="Stress Bench">Stress Bench</option>
                                <option value="General">General</option>
                                {formData.plantType && !['Long Line', 'Stress Bench', 'General'].includes(formData.plantType) && (
                                    <option value={formData.plantType}>{formData.plantType}</option>
                                )}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Shed/ Line Number</label>
                            <select value={formData.shedLineNumber} onChange={e => setFormData({ ...formData, shedLineNumber: e.target.value })}>
                                <option value="">Select Shed/Line</option>
                                <option value="Shed 1">Shed 1</option>
                                <option value="Shed 2">Shed 2</option>
                                <option value="Line 1">Line 1</option>
                                <option value="Line 2">Line 2</option>
                                <option value="N/A">N/A</option>
                                {formData.shedLineNumber && !['Shed 1', 'Shed 2', 'Line 1', 'Line 2', 'N/A'].includes(formData.shedLineNumber) && (
                                    <option value={formData.shedLineNumber}>{formData.shedLineNumber}</option>
                                )}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Concrete Grade</label>
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
                        <div className="input-group">
                            <label>Date of Casting</label>
                            <input type="date" value={formData.castingDate} onChange={e => setFormData({ ...formData, castingDate: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Bench / Gang Number</label>
                            <input type="text" value={formData.benchGangNumber} onChange={e => setFormData({ ...formData, benchGangNumber: e.target.value })} placeholder="e.g. 405" />
                        </div>
                        <div className="input-group">
                            <label>Mould No. (A to H)</label>
                            <select value={formData.mouldNo} onChange={e => setFormData({ ...formData, mouldNo: e.target.value })}>
                                <option value="">Select Mould</option>
                                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label>Sample Identification (Shed/ Line No. + Bench / Gang No. + Mould No. (A-H))</label>
                            <input readOnly value={identification} style={{ background: '#f8fafc', fontWeight: '800', color: '#42818c', fontSize: '15px' }} />
                        </div>
                        <div className="input-group">
                            <label>Result of MR for the Batch</label>
                            <input type="text" value={formData.result} onChange={e => setFormData({ ...formData, result: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Drawing No. (Sleeper Type)</label>
                            <input 
                                type="text" 
                                readOnly 
                                value={formData.sleeperType || ''} 
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
                        <div className="input-group">
                            <label>Type of Sample (Retest/ Fresh)</label>
                            <select value={formData.sampleType} onChange={e => setFormData({ ...formData, sampleType: e.target.value })}>
                                <option value="">Select Type</option>
                                <option value="Fresh">Fresh</option>
                                <option value="Retest">Retest</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                        <button className="btn-verify" disabled={saving} style={{ flex: 1 }} onClick={() => {
                            if (!formData.concreteGrade || !formData.plantType || !formData.shedLineNumber || !formData.mouldNo || !formData.sampleType || !formData.batchNo || !formData.benchGangNumber || !formData.sleeperType) {
                                alert("Please fill in all mandatory fields (Batch No., Plant, Shed/Line, Bench, Mould, Type, Concrete Grade, and Drawing No.).");
                                return;
                            }
                            onSave({ ...formData, sampleIdentification: identification });
                        }}>{saving ? 'Saving...' : (isModifying ? 'Update Sample Detail' : 'Save Sample Detail')}</button>
                        <button className="btn-save" style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none' }} onClick={onClose}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MFTestDetailsModal = ({ sample, onClose, onSave, saving, productionDeclarations = [] }) => {
    const [testData, setTestData] = useState({
        testingDate: sample?.testingDate || new Date().toISOString().split('T')[0],
        strength: sample?.strength || '',
        result: sample?.result && sample.result !== 'PENDING' ? sample.result : 'PASS',
        remarks: sample?.remarks || ''
    });

    const matchedProd = (productionDeclarations || []).find(p => 
        String(p.batchNumber || p.batchNo || '').trim().toLowerCase() === String(sample.batchNo || '').trim().toLowerCase()
    );

    const resolvedDrawingNo = sample.sleeperType || matchedProd?.drawingNo || matchedProd?.sleeperType || 'RT-8746';
    const resolvedConcreteGrade = sample.concreteGrade || matchedProd?.mixDesignReference || matchedProd?.concreteGrade || '-';

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">Enter MF Test Details: {sample.benchGangNumber}-{sample.mouldNo}</span>
                    <button className="form-modal-close" onClick={onClose}>×</button>
                </div>
                <div className="form-modal-body">
                    <h5 style={{ margin: '0 0 16px 0', color: '#42818c', fontSize: '14px' }}>Declaration Summary</h5>
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                            <div><span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Batch No</span><div style={{ fontWeight: '700' }}>{sample.batchNo}</div></div>
                            <div><span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Casting Date</span><div style={{ fontWeight: '700' }}>{sample.castingDate}</div></div>
                            <div><span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Grade</span><div style={{ fontWeight: '700' }}>{resolvedConcreteGrade}</div></div>
                            <div><span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Drawing No</span><div style={{ fontWeight: '700', color: '#7c3aed' }}>{resolvedDrawingNo}</div></div>
                            <div style={{ gridColumn: 'span 3' }}><span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Sample Identification</span><div style={{ fontWeight: '800', color: '#42818c' }}>{sample.sampleIdentification}</div></div>
                        </div>
                    </div>

                    <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '20px' }}>
                        <div className="input-group">
                            <label>Date of Testing</label>
                            <input type="date" value={testData.testingDate} onChange={e => setTestData({ ...testData, testingDate: e.target.value })} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="input-group">
                                <label>Strength (N/mm²)</label>
                                <input type="number" step="0.01" value={testData.strength} onChange={e => setTestData({ ...testData, strength: e.target.value })} placeholder="0.00" />
                            </div>
                            <div className="input-group">
                                <label>Result</label>
                                <select
                                    value={testData.result}
                                    onChange={e => setTestData({ ...testData, result: e.target.value })}
                                    style={{
                                        fontWeight: '700',
                                        color: testData.result?.toUpperCase() === 'PASS' ? '#059669' : (testData.result?.toUpperCase() === 'FAIL' ? '#dc2626' : '#1e293b')
                                    }}
                                >
                                    <option value="PASS">PASS</option>
                                    <option value="FAIL">FAIL</option>
                                </select>
                            </div>
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
                                    alert("Please select a Result (PASS/FAIL).");
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

    const resolvedDrawingNo = sample.sleeperType || matchedProd?.drawingNo || matchedProd?.sleeperType || '-';
    const resolvedConcreteGrade = sample.concreteGrade || matchedProd?.mixDesignReference || matchedProd?.concreteGrade || '-';

    // Logic: 8-hour window from creation (only if createdDate is provided by server)
    const createdTime = sample.createdDate ? new Date(sample.createdDate) : null;
    const canModifyOrDelete = !createdTime || (Date.now() - createdTime.getTime()) <= (8 * 60 * 60 * 1000);

    const details = sample.isTestRecord ? [
        { label: 'Batch No', value: sample.batchNo || '-' },
        { label: 'Grade', value: resolvedConcreteGrade },
        { label: 'Sample ID', value: sample.sampleIdentification },
        { label: 'Testing Date', value: sample.testingDate },
        { label: 'Strength', value: `${sample.strength} N/mm²` },
        { label: 'Result', value: sample.result },
        { label: 'Remarks', value: sample.remarks || 'None' }
    ] : [
        { label: 'Batch No', value: sample.batchNo },
        { label: 'Drawing No. (Sleeper Type)', value: resolvedDrawingNo },
        { label: 'Grade', value: resolvedConcreteGrade },
        { label: 'Casting Date', value: sample.castingDate },
        { label: 'Sample ID', value: sample.sampleIdentification }
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
