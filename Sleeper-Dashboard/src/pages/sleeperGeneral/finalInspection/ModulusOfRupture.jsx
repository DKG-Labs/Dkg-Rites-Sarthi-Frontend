import React, { useState, useMemo, useEffect } from 'react';
import EnhancedDataTable from '../../../components/common/EnhancedDataTable';
import CollapsibleSection from '../../../components/common/CollapsibleSection';
import TrendChart from '../../../components/common/TrendChart';
import { apiService } from '../../../services/api';
import { useShift } from '../../../context/ShiftContext';

const ModulusOfRupture = () => {
    const { dutyUnit, vendorCode, selectedShift, userId, dutyDate } = useShift();
    const [viewMode, setViewMode] = useState('statistics'); // 'statistics', 'declared', 'tested'
    const [showDeclareModal, setShowDeclareModal] = useState(false);
    const [showTestModal, setShowTestModal] = useState(false);
    const [selectedSample, setSelectedSample] = useState(null);
    const [isModifying, setIsModifying] = useState(false);
    const [loading, setLoading] = useState(false);

    // API Data
    const [declaredSamples, setDeclaredSamples] = useState([]);
    const [testedSamples, setTestedSamples] = useState([]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const activePlantId = dutyUnit || localStorage.getItem('dutyUnit');
            const [samplesRes, testsRes] = await Promise.all([
                apiService.getAllMORSamples(),
                apiService.getAllMORTests()
            ]);

            const currentUserId = parseInt(userId || localStorage.getItem('userId') || '0', 10);
            const filteredSamples = (samplesRes.responseData || [])
                .filter(s => s.plantId === activePlantId && s.createdBy === currentUserId);
            const filteredTests = (testsRes.responseData || [])
                .filter(t => t.plantId === activePlantId && t.createdBy === currentUserId);

            setDeclaredSamples(filteredSamples);
            setTestedSamples(filteredTests);
        } catch (error) {
            console.error('Failed to fetch MOR data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Statistics Calculation
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
            lastSamplingDate: declaredSamples.length > 0 ? declaredSamples[0].samplingDate : 'N/A',
            lastTestDate: testedSamples.length > 0 ? testedSamples[0].testingDate : 'N/A'
        };
    }, [declaredSamples, testedSamples]);

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
            if (isModifying) {
                await apiService.updateMORSample(selectedSample.id, {
                    ...formData,
                    plantId: dutyUnit || localStorage.getItem('dutyUnit'),
                    vendorCode: vendorCode || localStorage.getItem('vendorCode'),
                    shift: selectedShift || 'General',
                    updatedBy: parseInt(userId || localStorage.getItem('userId') || '118', 10)
                });
            } else {
                await apiService.createMORSample({
                    ...formData,
                    plantId: dutyUnit || localStorage.getItem('dutyUnit'),
                    vendorCode: vendorCode || localStorage.getItem('vendorCode'),
                    shift: selectedShift || 'General',
                    createdBy: parseInt(userId || localStorage.getItem('userId') || '118', 10)
                });
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
            const payload = {
                ...testData,
                morSampleId: selectedSample.morSampleId || selectedSample.id,
                plantId: dutyUnit || localStorage.getItem('dutyUnit'),
                vendorCode: vendorCode || localStorage.getItem('vendorCode'),
                shift: selectedShift || 'General',
                createdBy: parseInt(userId || localStorage.getItem('userId') || '118', 10),
                samplingDate: selectedSample.samplingDate,
                concreteGrade: selectedSample.concreteGrade,
                sampleIdentificationNumber: selectedSample.sampleIdentificationNumber
            };

            if (selectedSample.isTestRecord) {
                await apiService.updateMORTest(selectedSample.testId, payload);
            } else {
                await apiService.createMORTest(payload);
            }
            setShowTestModal(false);
            fetchData();
        } catch (error) {
            alert('Failed to save test results: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Derived Data
    const pendingSamples = useMemo(() => {
        return declaredSamples.filter(s => !testedSamples.some(t => t.morSampleId === s.id));
    }, [declaredSamples, testedSamples]);

    const isActionable = (dateString) => {
        if (!dateString) return true;
        const diff = Date.now() - new Date(dateString).getTime();
        return diff < (8 * 60 * 60 * 1000);
    };

    const handleDeleteRecord = async (id, isTest) => {
        if (!window.confirm(`Are you sure you want to delete this ${isTest ? 'test record' : 'sample declaration'}?`)) return;
        setLoading(true);
        try {
            if (isTest) {
                await apiService.deleteMORTest(id);
                alert('Test record deleted. Sample is now pending again.');
                setViewMode('declared');
            } else {
                await apiService.deleteMORSample(id);
                alert('Sample declaration deleted successfully.');
                setViewMode('declared');
            }
            fetchData();
            setShowViewModal(false);
        } catch (error) {
            console.error('Failed to delete MOR record:', error);
            alert('Delete failed.');
        } finally {
            setLoading(false);
        }
    };

    const [showViewModal, setShowViewModal] = useState(false);

    const isAgedForTesting = (samplingDate) => {
        if (!samplingDate) return false;
        const sampling = new Date(samplingDate);
        const today = new Date();
        const diffTime = today - sampling;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 15;
    };

    const columnsDeclared = [
        { key: 'samplingDate', label: 'Date of Sampling' },
        { key: 'concreteGrade', label: 'Concrete Grade' },
        { key: 'location', label: 'Location' },
        { key: 'sampleIdentificationNumber', label: 'Sample ID' },
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
        { key: 'samplingDate', label: 'Date of Sampling', render: (_, row) => {
            const val = row.samplingDate || declaredSamples.find(s => s.id === row.morSampleId)?.samplingDate;
            return val || '-';
        }},
        { key: 'testingDate', label: 'Date of Testing' },
        { key: 'sampleIdentificationNumber', label: 'Sample ID', render: (_, row) => {
            const val = row.sampleIdentificationNumber || declaredSamples.find(s => s.id === row.morSampleId)?.sampleIdentificationNumber;
            return val || '-';
        }},
        { key: 'concreteGrade', label: 'Grade', render: (_, row) => {
            const val = row.concreteGrade || declaredSamples.find(s => s.id === row.morSampleId)?.concreteGrade;
            return val || '-';
        }},
        { key: 'weight', label: 'Weight (Kg)' },
        { key: 'loadKn', label: 'Load (N)' },
        { key: 'strength', label: 'Strength (N/mm²)' },
        { key: 'result', label: 'Result', render: (val) => (
            <span style={{ color: (val || '').toLowerCase() === 'pass' ? '#059669' : '#dc2626', fontWeight: '800', fontSize: '11px' }}>{val || 'FAIL'}</span>
        )},
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <button 
                    className="btn-verify" 
                    style={{ fontSize: '10px', padding: '6px 14px' }} 
                    onClick={() => { 
                        const sampleInfo = declaredSamples.find(s => s.id === row.morSampleId);
                        setSelectedSample({ ...sampleInfo, ...row, testId: row.id, morSampleId: row.morSampleId, isTestRecord: true }); 
                        setShowViewModal(true); 
                    }}
                >
                    View Details
                </button>
            )
        }
    ];

    return (
        <div className="mor-module cement-forms-scope">
            <header style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#13343b', margin: 0 }}>Modulus of Rupture (MOR)</h2>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Quality monitoring for flexural strength</p>
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

            <div className="tab-content">
                {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>}
                
                {viewMode === 'statistics' && !loading && (
                    <div className="fade-in">
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '12px',
                            marginBottom: '32px'
                        }}>
                            <StatCard label="Total Samples" value={declaredSamples.length} />
                            <StatCard label="Tests Completed" value={testedSamples.length} />
                            <StatCard label="Avg. Strength" value={stats.avgStrength} unit="N/mm²" />
                            <StatCard label="Pass Rate" value={stats.passRate} unit="%" />
                            <StatCard label="Min / Max" value={`${stats.minStrength} / ${stats.maxStrength}`} />
                            <StatCard label="Std. Deviation" value={stats.sd} />
                        </div>
                        <TrendChart
                            data={testedSamples}
                            xKey="testingDate"
                            lines={[
                                { key: 'strength', color: '#3b82f6', label: 'Flexural Strength' }
                            ]}
                            title="Modulus of Rupture Trend"
                            description="Historical flexural strength results (N/mm²)"
                        />
                    </div>
                )}

                {viewMode === 'declared' && !loading && (
                    <div className="section-card fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                            <h4 style={{ margin: 0, color: '#475569' }}>MOR Samples Pending Testing</h4>
                            <button className="btn-verify" onClick={handleAddSample}>+ Declare New Sample</button>
                        </div>
                        <EnhancedDataTable columns={columnsDeclared} data={pendingSamples} />
                    </div>
                )}

                {viewMode === 'tested' && !loading && (
                    <div className="section-card fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h4 style={{ margin: 0, color: '#475569' }}>MOR Analysis Log</h4>
                        </div>
                        <EnhancedDataTable columns={columnsTested} data={testedSamples} />
                    </div>
                )}
            </div>

            {showViewModal && (
                <MORDetailsModal
                    sample={selectedSample}
                    onClose={() => setShowViewModal(false)}
                    onModify={() => {
                        setShowViewModal(false);
                        if (selectedSample.isTestRecord) {
                            // Currently we don't have isModifying for tests modeled, but we'll open the modal
                            setShowTestModal(true);
                        } else {
                            setIsModifying(true);
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
                <MORSampleDeclarationModal
                    sample={selectedSample}
                    isModifying={isModifying}
                    onClose={() => setShowDeclareModal(false)}
                    onSave={saveDeclaration}
                    saving={loading}
                />
            )}

            {showTestModal && (
                <MORTestDetailsModal
                    sample={selectedSample}
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

const MORSampleDeclarationModal = ({ sample, isModifying, onClose, onSave, saving }) => {
    const { vendorId, dutyUnit, vendorCode } = useShift();
    const [locations, setLocations] = useState({});

    useEffect(() => {
        const fetchLocations = async () => {
            const vId = vendorId || localStorage.getItem('vendorId');
            const pId = dutyUnit || localStorage.getItem('dutyUnit');
            if (!vId || !pId) return;
            try {
                const res = await apiService.getPlantSheds(vId, pId);
                if (res?.responseData) {
                    setLocations(res.responseData);
                } else if (res && typeof res === 'object') {
                    setLocations(res);
                }
            } catch (err) {
                console.error("Failed to fetch locations:", err);
            }
        };
        fetchLocations();
    }, [vendorId, dutyUnit]);

    const [formData, setFormData] = useState(sample ? {
        samplingDate: sample.samplingDate,
        concreteGrade: sample.concreteGrade,
        location: sample.location || sample.shedLine || `${sample.plantType || ''} - ${sample.shedLine || ''}`.replace(/^- | - $/g, ''),
        sampleIdentificationNumber: sample.sampleIdentificationNumber
    } : {
        samplingDate: new Date().toISOString().split('T')[0],
        concreteGrade: '',
        location: '',
        sampleIdentificationNumber: ''
    });

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">{isModifying ? 'Modify' : 'Declare'} MOR Sample</span>
                    <button className="form-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="form-modal-body">
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
                        <div className="input-group">
                            <label>Date of Sampling</label>
                            <input type="date" value={formData.samplingDate} onChange={e => setFormData({ ...formData, samplingDate: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Concrete Grade</label>
                            <select value={formData.concreteGrade} onChange={e => setFormData({ ...formData, concreteGrade: e.target.value })}>
                                <option value="">Select Grade</option>
                                <option>M-55</option>
                                <option>M-60</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Location (Plant / Shed)</label>
                            <select value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}>
                                <option value="">Select Location</option>
                                {Object.entries(locations).map(([plantType, sheds]) => (
                                    <optgroup key={plantType} label={plantType}>
                                        {Array.isArray(sheds) && sheds.map(shed => (
                                            <option key={`${plantType} - ${shed}`} value={`${plantType} - ${shed}`}>{shed}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Sample Identification Number</label>
                            <input type="text" value={formData.sampleIdentificationNumber} onChange={e => setFormData({ ...formData, sampleIdentificationNumber: e.target.value })} placeholder="e.g. MOR-2026-XYZ" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '32px', flexWrap: 'wrap' }}>
                        <button className="btn-verify" disabled={saving} style={{ flex: '1 1 200px' }} onClick={() => {
                            if (!formData.concreteGrade || !formData.location || !formData.sampleIdentificationNumber) {
                                alert("Please fill in all mandatory fields (Grade, Location, and ID).");
                                return;
                            }
                            // Backend might still expect plantType and shedLine, or we can send location.
                            // If backend schema isn't changed, we can send location mapped to shedLine, or split it.
                            // The backend update was requested, so we'll send it as location.
                            const payload = { ...formData };
                            if (formData.location.includes(' - ')) {
                                const parts = formData.location.split(' - ');
                                payload.plantType = parts[0];
                                payload.shedLine = parts[1];
                            } else {
                                payload.shedLine = formData.location;
                            }
                            onSave(payload);
                        }}>{saving ? 'Saving...' : (isModifying ? 'Update Sample' : 'Save Declaration')}</button>
                        <button className="btn-save" style={{ flex: '1 1 200px', background: '#f1f5f9', color: '#64748b', border: 'none' }} onClick={onClose}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MORTestDetailsModal = ({ sample, onClose, onSave, saving }) => {
    const [testData, setTestData] = useState({
        testingDate: sample.testingDate || new Date().toISOString().split('T')[0],
        weight: sample.weight || '',
        loadKn: sample.loadKn || '', // Representing "Load A (Newton)"
        strength: sample.strength || '', // Representing "Strength C (N/mm²)"
        remarks: sample.remarks || ''
    });

    let result = 'PENDING';
    if (testData.strength) {
        const cVal = parseFloat(testData.strength);
        const gradeStr = (sample.concreteGrade || '').toUpperCase().replace(/[-\s]/g, '');
        
        if (!isNaN(cVal)) {
            if (gradeStr === 'M60') {
                result = cVal >= 5.5 ? 'Pass' : 'Fail';
            } else {
                // M55 or default fallback
                result = cVal >= 5.2 ? 'Pass' : 'Fail';
            }
        }
    }

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">Enter MOR Test Details: {sample.sampleIdentificationNumber}</span>
                    <button className="form-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="form-modal-body">
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                            <div><span style={{ fontSize: '10px', color: '#64748b' }}>Sampling Date</span><div style={{ fontWeight: '700' }}>{sample.samplingDate}</div></div>
                            <div><span style={{ fontSize: '10px', color: '#64748b' }}>Grade</span><div style={{ fontWeight: '700' }}>{sample.concreteGrade}</div></div>
                            <div><span style={{ fontSize: '10px', color: '#64748b' }}>Identification</span><div style={{ fontWeight: '700' }}>{sample.sampleIdentificationNumber}</div></div>
                        </div>
                    </div>

                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label>Date of Testing</label>
                            <input type="date" value={testData.testingDate} onChange={e => setTestData({ ...testData, testingDate: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Weight (in Kgs) <span className="required">*</span></label>
                            <input type="number" step="0.01" value={testData.weight} onChange={e => setTestData({ ...testData, weight: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Load A (Newton) <span className="required">*</span></label>
                            <input type="number" step="0.01" value={testData.loadKn} onChange={e => setTestData({ ...testData, loadKn: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Strength C (N/mm²) <span className="required">*</span></label>
                            <input type="number" step="0.01" value={testData.strength} onChange={e => setTestData({ ...testData, strength: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Result (Auto)</label>
                            <input readOnly value={testData.strength ? result : 'PENDING'} style={{ color: result === 'Pass' ? '#059669' : '#dc2626', fontWeight: '800', background: '#f8fafc' }} />
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label>Remarks</label>
                            <textarea value={testData.remarks} onChange={e => setTestData({ ...testData, remarks: e.target.value })} style={{ minHeight: '60px', padding: '12px' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
                        <button className="btn-verify" disabled={saving} style={{ flex: '1 1 200px' }} onClick={() => {
                            if (!testData.weight || !testData.loadKn || !testData.strength) {
                                alert("Mandatory Data Missing: Please enter Weight, Load, and Strength before saving.");
                                return;
                            }
                            onSave({ ...testData, result });
                        }}>{saving ? 'Saving...' : 'Save Test Results'}</button>
                        <button className="btn-save" style={{ flex: '1 1 200px', background: '#f1f5f9', color: '#64748b', border: 'none' }} onClick={onClose}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MORDetailsModal = ({ sample, onClose, onModify, onEnterTest, onDelete }) => {
    if (!sample) return null;

    const createdTime = sample.createdDate ? new Date(sample.createdDate) : new Date();
    const canModifyOrDelete = (Date.now() - createdTime.getTime()) <= (8 * 60 * 60 * 1000);

    const details = [
        { label: 'Sample ID', value: sample.sampleIdentificationNumber },
        { label: 'Grade', value: sample.concreteGrade },
        { label: 'Location', value: sample.location || sample.shedLine || '-' },
        { label: 'Sampling Date', value: sample.samplingDate },
        ...(sample.isTestRecord ? [
            { label: 'Testing Date', value: sample.testingDate },
            { label: 'Weight', value: `${sample.weight} Kg` },
            { label: 'Load', value: `${sample.loadKn} N` },
            { label: 'Strength', value: `${sample.strength} N/mm²` },
            { label: 'Result', value: sample.result }
        ] : []),
        { label: 'Log Created', value: `${createdTime.toLocaleDateString('en-GB')} ${createdTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` }
    ];

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">MOR Test Details</span>
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

export default ModulusOfRupture;
