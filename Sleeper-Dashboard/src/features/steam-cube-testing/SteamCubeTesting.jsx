import React, { useState, useMemo, useEffect } from 'react';
import EnhancedDataTable from '../../components/common/EnhancedDataTable';
import { apiService } from '../../services/api';
import { useShift } from '../../context/ShiftContext';
import './SteamCubeTesting.css';
import { formatDateForBackend } from '../../utils/helpers';

const SteamCubeTesting = ({ onBack, testedRecords: propTestedRecords, setTestedRecords: propSetTestedRecords, activeContainer }) => {
    const [viewMode, setViewMode] = useState('statistics'); // 'statistics', 'declared', 'tested'
    const [showDeclareModal, setShowDeclareModal] = useState(false);
    const [showTestModal, setShowTestModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedSample, setSelectedSample] = useState(null);
    const [isModifying, setIsModifying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Initial data for samples declared but not yet tested
    const [declaredSamples, setDeclaredSamples] = useState([]);
    const [localTestedRecords, setLocalTestedRecords] = useState([]);

    const DateUtils = {
        formatToBackend: (dateStr) => {
            if (!dateStr || String(dateStr).toLowerCase() === 'string') return new Date().toLocaleDateString('en-GB');
            if (/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr))) {
                const [y, m, d] = String(dateStr).split('-');
                return `${d}/${m}/${y}`;
            }
            return String(dateStr);
        },
        formatFromBackend: (dateStr) => {
            if (!dateStr) return null;
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
                const [d, m, y] = dateStr.split('/');
                return `${y}-${m}-${d}`;
            }
            return dateStr;
        }
    };

    const testedRecords = propTestedRecords || localTestedRecords;
    const setTestedRecords = propSetTestedRecords || setLocalTestedRecords;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const response = await apiService.getAllSteamCubes();
            if (response && response.responseData) {
                // Normalize dates from backend (dd/mm/yyyy) to internal (yyyy-mm-dd)
                // Process all records to handle dates and status
                const allRecords = response.responseData.map(r => {
                    // A record is "tested" if it has strength data
                    const isTested = !!r.avgStrength || (r.cubeResults && r.cubeResults.some(cr => cr.strength && cr.strength !== ""));
                    
                    // Normalize creation timestamp for 8-hour window logic
                    // If backend doesn't provide time, we assume 00:00 or current time for new logs
                    const createdTimeStr = r.createdTime || r.lbcTime || '00:00';
                    const createdAt = new Date(`${DateUtils.formatFromBackend(r.entryDate || r.castingDate)}T${createdTimeStr}`);

                    return {
                        ...r,
                        status: isTested ? 'Completed' : 'Testing Pending',
                        isTested: isTested,
                        createdAt: createdAt,
                        castingDate: DateUtils.formatFromBackend(r.castingDate),
                        testDate: DateUtils.formatFromBackend(r.testDate),
                        cubeResults: (r.cubeResults || []).map(cr => ({
                            ...cr,
                            testDate: DateUtils.formatFromBackend(cr.testDate)
                        }))
                    };
                });
                
                const tested = allRecords.filter(r => r.isTested);
                const declared = allRecords.filter(r => !r.isTested);

                setDeclaredSamples(declared);
                setTestedRecords(tested);
            }
        } catch (error) {
            console.error('Error loading Steam Cube data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Statistics Calculation
    const stats = useMemo(() => {
        const allTests = testedRecords;
        const totalTests = allTests.length;
        const avgStrengths = allTests.map(r => parseFloat(r.avgStrength)).filter(s => !isNaN(s));

        const avgStrength = avgStrengths.length > 0 ? (avgStrengths.reduce((a, b) => a + b, 0) / avgStrengths.length).toFixed(2) : '0.00';
        const minStrength = avgStrengths.length > 0 ? Math.min(...avgStrengths).toFixed(2) : '0.00';
        const maxStrength = avgStrengths.length > 0 ? Math.max(...avgStrengths).toFixed(2) : '0.00';
        const passRate = totalTests > 0 ? ((allTests.filter(t => t.result === 'OK').length / totalTests) * 100).toFixed(1) : '0.0';

        return {
            totalDeclared: declaredSamples.length,
            totalTests,
            avgStrength,
            minStrength,
            maxStrength,
            passRate,
            lastTest: (allTests.length > 0 && allTests[0].testDate) ? allTests[0].testDate.split('-').reverse().join('/') : 'N/A'
        };
    }, [declaredSamples, testedRecords]);



    const handleAddSample = () => {
        setSelectedSample(null);
        setIsModifying(false);
        setShowDeclareModal(true);
    };

    const handleModifySample = async (sample) => {
        // Enforce 8-hour restriction for modification
        const declarationTime = new Date(sample.castingDate + 'T' + (sample.lbcTime || '00:00'));
        const diffMs = Date.now() - declarationTime.getTime();
        const hoursPassed = diffMs / (1000 * 60 * 60);

        if (hoursPassed > 8) {
            alert("This record is more than 8 hours old and cannot be modified.");
            return;
        }

        try {
            let fetchedData = sample;
            // Only fetch from backend if ID is a real numeric ID (not a local timestamp or string)
            if (sample.id && !isNaN(sample.id) && !String(sample.id).includes('-')) {
                const response = await apiService.getSteamCubeById(sample.id);
                if (response?.responseData) {
                    fetchedData = {
                        ...response.responseData,
                        castingDate: DateUtils.formatFromBackend(response.responseData.castingDate),
                        testDate: DateUtils.formatFromBackend(response.responseData.testDate),
                        cubeResults: (response.responseData.cubeResults || []).map(cr => ({
                            ...cr,
                            testDate: DateUtils.formatFromBackend(cr.testDate)
                        }))
                    };
                }
            }
            setSelectedSample(fetchedData);
            setIsModifying(true);
            setShowDeclareModal(true);
        } catch (error) {
            console.error("Error fetching steam cube declaration details:", error);
            setSelectedSample(sample);
            setIsModifying(true);
            setShowDeclareModal(true);
        }
    };


    const handleEnterTestDetails = (sample) => {
        setSelectedSample(sample);
        setShowTestModal(true);
        setShowDetailsModal(false);
    };

    const handleOpenDetails = (sample) => {
        setSelectedSample(sample);
        setShowDetailsModal(true);
    };

    const saveDeclaration = async (formData) => {
        try {
            // Mapping to the user-provided DTO structure
            const payload = {
                lineNo: formData.lineNo || null,
                shedNo: formData.shedNo || null,
                location: formData.lineNo || formData.shedNo,
                castingDate: DateUtils.formatToBackend(formData.castingDate),
                lbcTime: formData.lbcTime,
                batchNo: String(formData.batchNo),
                concreteGrade: formData.concreteGrade,
                chamberNo: formData.chamberNo || null,
                cubes: (formData.cubes || []).map(cube => ({
                    benchNo: String(cube.benchNo)
                })),
                otherBenches: (formData.otherBenches || []).map(b => ({
                    sleeperSequence: b.sleeperSequence || "",
                    cubeCode: b.cubeCode || "",
                    benchNo: String(b.benchNo)
                }))
            };

            // Non-blocking save
            if (isModifying) {
                await apiService.updateSteamCube(selectedSample.id, payload);
            } else {
                await apiService.createSteamCube(payload);
            }

            // Immediate UI feedback
            setShowDeclareModal(false);

            // Background refresh without blocking the UI
            loadData().catch(console.error);
        } catch (error) {
            console.error('Error saving declaration:', error);
            alert('Failed to save declaration: ' + error.message);
        }
    };

    const saveTestDetails = async (testData) => {
        try {
            const completedTest = {
                ...selectedSample,
                ...testData,
                castingDate: DateUtils.formatToBackend(selectedSample.castingDate),
                testDate: DateUtils.formatToBackend(testData.testDate),
                cubeResults: (testData.cubeResults || []).map(cube => ({
                    ...cube,
                    testDate: DateUtils.formatToBackend(cube.testDate)
                }))
            };
            
            // Map back to backend structure if needed
            const payload = {
                ...completedTest,
                batchNo: String(completedTest.batchNo)
            };

            await apiService.updateSteamCube(selectedSample.id, payload);

            // Immediate UI closure
            setShowTestModal(false);
            setIsModifying(false);

            // Background refresh
            loadData().catch(console.error);
        } catch (error) {
            console.error('Error saving test details:', error);
            alert('Failed to save test details: ' + error.message);
        }
    };

    const handleDeleteTest = async (id, sampleData) => {
        if (!id) return;

        // Check 8-hour window based on creation time
        const diffMs = Date.now() - new Date(sampleData.createdAt).getTime();
        const hoursPassed = diffMs / (1000 * 60 * 60);

        if (hoursPassed > 8) {
            alert("This action is only allowed within 8 hours of log creation.");
            return;
        }

        const msg = sampleData.isTested 
            ? "Are you sure you want to remove this test result and move it back to 'Pending'?" 
            : "Are you sure you want to delete this sample declaration?";

        if (window.confirm(msg)) {
            try {
                if (sampleData.isTested) {
                    // "Delete" for tested records means resetting the test data
                    const payload = {
                        ...sampleData,
                        avgStrength: null,
                        result: null,
                        testDate: null,
                        cubeResults: (sampleData.cubeResults || []).map(cr => ({
                            ...cr,
                            strength: "",
                            load: "",
                            weight: "",
                            testDate: null
                        }))
                    };
                    await apiService.updateSteamCube(id, payload);
                } else {
                    // "Delete" for declared records is a hard delete
                    await apiService.deleteSteamCube(id);
                }
                
                alert('Action success.');
                loadData();
            } catch (error) {
                console.error('Error in delete action:', error);
                alert('Failed: ' + error.message);
            }
        }
    };



    const getColumnsDeclared = () => [
        { 
            key: 'location', 
            label: 'Location (Line/Shed)',
            render: (_, row) => row.location || row.lineNo || row.shedNo || '-'
        },
        { key: 'batchNo', label: 'Batch No.' },
        { 
            key: 'castingDateTime', 
            label: 'Date & Time of Casting',
            render: (_, row) => {
                const rawDate = row.castingDate || row.date || row.entryDate;
                const date = rawDate ? (rawDate.includes('-') ? rawDate.split('-').reverse().join('/') : rawDate) : '-';
                const time = row.lbcTime || '-';
                return `${date} ${time}`;
            }
        },
        { key: 'concreteGrade', label: 'Concrete Grade', render: (_, row) => row.concreteGrade || row.grade || '-' },
        {
            key: 'createdAt',
            label: 'Date & Time of Log Created',
            render: (_, row) => {
                if (!row.createdAt) return '-';
                const d = new Date(row.createdAt);
                if (isNaN(d.getTime())) return '-';
                return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
            }
        },
        { 
            key: 'noOfCubes', 
            label: 'No. of Cubes', 
            render: (_, row) => (row.cubes || row.cubeResults)?.length || 0 
        },
        { 
            key: 'gangs', 
            label: 'Gangs/Benches', 
            render: (_, row) => {
                const benches = (row.otherBenches || []).map(b => b.benchNo).filter(Boolean);
                return benches.length > 0 ? benches.join(', ') : '-';
            }
        },
        {
            key: 'status',
            label: 'Status',
            render: (_, row) => (
                <span className="status-pill manual" style={{ 
                    background: row.status === 'Completed' ? '#ecfdf5' : '#3b82f615', 
                    color: row.status === 'Completed' ? '#059669' : '#3b82f6', 
                    border: `1px solid ${row.status === 'Completed' ? '#059669' : '#3b82f630'}` 
                }}>
                    {row.status || 'Testing Pending'}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-verify" style={{ height: '28px', padding: '4px 12px', fontSize: '11px' }} onClick={() => handleOpenDetails(row)}>View Details</button>
                </div>
            )
        }
    ];

    const columnsTested = [
        { 
            key: 'location', 
            label: 'Location (Shed/Line)', 
            render: (_, row) => row.location || row.shedNo || row.lineNo || '-'
        },
        { key: 'batchNo', label: 'Batch No.' },
        { 
            key: 'castingDate', 
            label: 'Date of Casting',
            render: (val, row) => {
                const rawDate = val || row.date || row.entryDate;
                return rawDate ? (rawDate.includes('-') ? rawDate.split('-').reverse().join('/') : rawDate) : '-';
            }
        },
        { key: 'concreteGrade', label: 'Concrete Grade', render: (_, row) => row.concreteGrade || row.grade || '-' },
        {
            key: 'createdAt',
            label: 'Date & Time of Log Created',
            render: (_, row) => {
                if (!row.createdAt) return '-';
                const d = new Date(row.createdAt);
                if (isNaN(d.getTime())) return '-';
                return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
            }
        },
        { 
            key: 'testDateTime', 
            label: 'Date & Time of Testing', 
            render: (_, row) => {
                const date = row.testDate ? (row.testDate.includes('-') ? row.testDate.split('-').reverse().join('/') : row.testDate) : '-';
                const time = row.testTime || '-';
                return `${date} ${time}`;
            }
        },
        {
            key: 'avgStrength',
            label: 'Avg Strength (N/mm²)',
            render: (val) => <strong>{val ? parseFloat(val).toFixed(2) : '-'}</strong>
        },
        {
            key: 'result',
            label: 'Result',
            render: (val) => (
                <span className={`status-pill ${val === 'OK' ? 'witnessed' : 'manual'}`}>{val || 'PENDING'}</span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-verify" style={{ height: '28px', padding: '4px 12px', fontSize: '11px' }} onClick={() => handleOpenDetails(row)}>View Details</button>
                </div>
            )
        }
    ];

    return (
        <div className="steam-cube-testing-module cement-forms-scope">
            <header style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#13343b', margin: 0 }}>Steam Cube Testing Record</h2>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Transfer strength verification for steam cured sleepers</p>
            </header>

            <div className="nav-tabs" style={{
                marginBottom: '24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
            }}>
                <div
                    className={`nav-tab-card ${viewMode === 'statistics' ? 'active' : ''}`}
                    onClick={() => setViewMode('statistics')}
                    style={cardTabStyle(viewMode === 'statistics', '#10b981')}
                >
                    <span style={{ fontSize: '10px', fontWeight: '700', opacity: 0.8 }}>ANALYSIS</span>
                    <span style={{ fontSize: '14px', fontWeight: '800' }}>Statistics Dashboard</span>
                </div>
                <div
                    className={`nav-tab-card ${viewMode === 'declared' ? 'active' : ''}`}
                    onClick={() => setViewMode('declared')}
                    style={cardTabStyle(viewMode === 'declared', '#3b82f6')}
                >
                    <span style={{ fontSize: '10px', fontWeight: '700', opacity: 0.8 }}>PENDING</span>
                    <span style={{ fontSize: '14px', fontWeight: '800' }}>Testing Pending</span>
                </div>
                <div
                    className={`nav-tab-card ${viewMode === 'tested' ? 'active' : ''}`}
                    onClick={() => setViewMode('tested')}
                    style={cardTabStyle(viewMode === 'tested', '#f59e0b')}
                >
                    <span style={{ fontSize: '10px', fontWeight: '700', opacity: 0.8 }}>COMPLETED</span>
                    <span style={{ fontSize: '14px', fontWeight: '800' }}>Witnessed Testing Log</span>
                </div>
            </div>

            <div className="tab-content" style={{ animation: 'fadeIn 0.3s ease', position: 'relative' }}>
                {isLoading && (
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(255,255,255,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        borderRadius: '12px'
                    }}>
                        <div className="loading-spinner">Loading...</div>
                    </div>
                )}
                {viewMode === 'statistics' && (
                    <div className="fade-in">
                        <div className="steam-cube-stats-grid">
                            <StatCard label="Total Declared" value={stats.totalDeclared} />
                            <StatCard label="Total Tests" value={stats.totalTests} />
                            <StatCard label="Avg Strength" value={stats.avgStrength} unit="N/mm²" />
                            <StatCard label="Pass Rate" value={stats.passRate} unit="%" color={parseFloat(stats.passRate) > 95 ? '#10b981' : '#f59e0b'} />
                            <StatCard label="Min Strength" value={stats.minStrength} unit="N/mm²" />
                            <StatCard label="Max Strength" value={stats.maxStrength} unit="N/mm²" />
                            <StatCard label="Last Test Date" value={stats.lastTest} />
                        </div>

                        <div className="steam-cube-charts-grid">
                            <div className="steam-cube-chart-card">
                                <h4 style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#1e293b', fontWeight: '800' }}>Strength Trend (Last 10 Tests)</h4>
                                <div className="steam-cube-bar-chart-container">
                                    {[45, 52, 48, 55, 60, 58, 49, 53, 57, 51].map((h, i) => (
                                        <div key={i} className="steam-cube-bar" style={{ height: `${(h / 70) * 100}%` }}>
                                            <span className="steam-cube-bar-label">{h}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="steam-cube-chart-card" style={{ justifyContent: 'center', alignItems: 'center' }}>
                                <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: `conic-gradient(#10b981 ${stats.passRate}%, #e2e8f0 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{stats.passRate}%</span>
                                        <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>PASS RATE</span>
                                    </div>
                                </div>
                                <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '2px' }}></span><span style={{ fontSize: '12px', fontWeight: '600' }}>Pass</span></div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', background: '#e2e8f0', borderRadius: '2px' }}></span><span style={{ fontSize: '12px', fontWeight: '600' }}>Fail</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'declared' && (
                    <div className="fade-in">
                        <div className="section-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h4 style={{ margin: 0, color: '#10b981', fontWeight: '800' }}>DECLARED SAMPLES</h4>
                                <button className="btn-verify" style={{ height: '32px', padding: '0 16px', fontSize: '11px', borderRadius: '16px' }} onClick={handleAddSample}>+ Add Declaration</button>
                            </div>
                            <EnhancedDataTable 
                                columns={getColumnsDeclared()} 
                                data={declaredSamples} 
                                selectable={false}
                            />
                        </div>
                    </div>
                )}

                {viewMode === 'tested' && (
                    <div className="section-card fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h4 style={{ margin: 0, color: '#475569' }}>Witnessed Log Table</h4>
                        </div>
                        <EnhancedDataTable columns={columnsTested} data={testedRecords} selectable={false} />
                    </div>
                )}
            </div>

            {showDetailsModal && (
                <SteamCubeDetailsModal
                    sample={selectedSample}
                    onClose={() => setShowDetailsModal(false)}
                    onModify={() => {
                        setShowDetailsModal(false);
                        if (selectedSample.isTested) {
                            handleEnterTestDetails(selectedSample);
                        } else {
                            handleModifySample(selectedSample);
                        }
                    }}
                    onDelete={(id) => {
                        setShowDetailsModal(false);
                        handleDeleteTest(id, selectedSample);
                    }}
                    onEnterTest={() => handleEnterTestDetails(selectedSample)}
                />
            )}

            {showDeclareModal && (
                <SampleDeclarationModal
                    sample={selectedSample}
                    isModifying={isModifying}
                    onClose={() => setShowDeclareModal(false)}
                    onSave={saveDeclaration}
                    onDelete={(id) => {
                        setShowDeclareModal(false);
                        handleDeleteTest(id, selectedSample);
                    }}
                    activeContainer={activeContainer}
                />
            )}

            {showTestModal && (
                <TestDetailsModal
                    sample={selectedSample}
                    onClose={() => setShowTestModal(false)}
                    onSave={saveTestDetails}
                    onDelete={(id) => {
                        setShowTestModal(false);
                        handleDeleteTest(id, selectedSample);
                    }}
                    isModifying={isModifying}
                    activeContainer={activeContainer}
                />
            )}

        </div>
    );
};

const cardTabStyle = (active, color) => ({
    flex: '1 1 200px',
    padding: '16px 20px',
    background: active ? '#fff' : '#f8fafc',
    border: `1px solid ${active ? color : '#e2e8f0'}`,
    borderTop: `4px solid ${color}`,
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: active ? `0 4px 12px ${color}20` : 'none',
    transform: active ? 'translateY(-2px)' : 'none'
});

const StatCard = ({ label, value, unit = '', color = '#1e293b' }) => (
    <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
        <div style={{ fontSize: '18px', fontWeight: '800', color }}>{value} <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>{unit}</span></div>
    </div>
);

const SteamCubeDetailsModal = ({ sample, onClose, onModify, onEnterTest, onDelete }) => {
    if (!sample) return null;

    const details = [
        { label: 'Status', value: sample.status || 'Testing Pending' },
        { label: 'Location (Line/Shed)', value: sample.location || sample.lineNo || sample.shedNo || '-' },
        { label: 'Batch No.', value: sample.batchNo || '-' },
        { 
            label: 'Date & Time of Casting', 
            value: `${sample.castingDate ? sample.castingDate.split('-').reverse().join('/') : '-'} ${sample.lbcTime || '-'}`
        },
        { label: 'Concrete Grade', value: sample.concreteGrade || sample.grade || '-' },
        { label: 'No. of Cubes', value: (sample.cubes || sample.cubeResults)?.length || 0 },
        { 
            label: 'Gangs/Benches', 
            value: (sample.otherBenches || []).map(b => b.benchNo).filter(Boolean).join(', ') || '-'
        }
    ];

    const createdTime = sample.createdAt ? new Date(sample.createdAt) : new Date();
    const diffMs = Date.now() - createdTime.getTime();
    const hoursPassed = diffMs / (1000 * 60 * 60);
    const canModifyOrDelete = hoursPassed <= 8;

    const summaryDetails = sample.isTested ? [
        { label: 'Avg Strength', value: `${parseFloat(sample.avgStrength || 0).toFixed(2)} N/mm²` },
        { label: 'Result', value: sample.result || 'PENDING' },
        { label: 'Date of Testing', value: `${sample.testDate ? sample.testDate.split('-').reverse().join('/') : '-'} ${sample.testTime || ''}` },
        { label: 'Log Created', value: `${createdTime.toLocaleDateString('en-GB')} ${createdTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` }
    ] : [
        { label: 'Log Created', value: `${createdTime.toLocaleDateString('en-GB')} ${createdTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` }
    ];

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">Steam Cube Details</span>
                    <button className="form-modal-close" onClick={onClose}>X</button>
                </div>
                <div className="form-modal-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                        {details.map((detail, idx) => (
                            <div key={idx}>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{detail.label}</div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{detail.value}</div>
                            </div>
                        ))}
                        {summaryDetails.map((detail, idx) => (
                            <div key={`sum-${idx}`} style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                                <div style={{ fontSize: '11px', color: '#42818c', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{detail.label}</div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#13343b' }}>{detail.value}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button 
                            className="btn-delete-entry" 
                            style={{ 
                                padding: '8px 24px', fontSize: '12px', height: '36px', width: 'auto', 
                                background: canModifyOrDelete ? '#fee2e2' : '#f8fafc', 
                                color: canModifyOrDelete ? '#ef4444' : '#cbd5e1', 
                                border: '1.5px solid #e2e8f0', cursor: canModifyOrDelete ? 'pointer' : 'not-allowed', 
                                marginTop: 0 
                            }} 
                            disabled={!canModifyOrDelete}
                            onClick={() => onDelete(sample.id)}
                            title={!canModifyOrDelete ? "Deletions only allowed within 8 hours" : ""}
                        >
                            Delete
                        </button>
                        <button 
                            className="btn-save" 
                            style={{ 
                                padding: '8px 24px', fontSize: '12px', height: '36px', width: 'auto', 
                                background: canModifyOrDelete ? '#f1f5f9' : '#f8fafc', 
                                color: canModifyOrDelete ? '#64748b' : '#cbd5e1', 
                                cursor: canModifyOrDelete ? 'pointer' : 'not-allowed',
                                marginTop: 0 
                            }} 
                            disabled={!canModifyOrDelete}
                            onClick={onModify}
                            title={!canModifyOrDelete ? "Modifications only allowed within 8 hours" : ""}
                        >
                            Modify
                        </button>
                        <button 
                            className="btn-verify" 
                            style={{ padding: '8px 24px', fontSize: '12px', height: '36px', width: 'auto' }} 
                            onClick={onEnterTest}
                        >
                            {sample.isTested ? 'Review Test Results' : 'Enter Test Details'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const SampleDeclarationModal = ({ sample, isModifying, onClose, onSave, onDelete, activeContainer }) => {
    const [moistureReports, setMoistureReports] = useState([]);
    const [availableLocations, setAvailableLocations] = useState([]);
    const { vendorId, dutyUnit, userId } = useShift();
    const effectiveVendorId = userId || vendorId || localStorage.getItem('userId');
    const effectivePlantId = dutyUnit || localStorage.getItem('dutyUnit');
    
    const [formData, setFormData] = useState({
        lineNo: sample?.lineNo || (activeContainer?.type !== 'Shed' ? activeContainer?.name : null) || (sample?.location && !sample?.shedNo ? sample.location : ''),
        shedNo: sample?.shedNo || (activeContainer?.type === 'Shed' ? activeContainer?.name : null) || (sample?.location && sample?.shedNo ? sample.location : ''),
        castingDate: sample?.castingDate || sample?.date || sample?.entryDate || new Date().toISOString().split('T')[0],
        lbcTime: sample?.lbcTime || (new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })),
        batchNo: sample?.batchNo || '',
        concreteGrade: sample?.concreteGrade || sample?.grade || 'M60',
        chamberNo: sample?.chamberNo || '',
        cubes: sample?.cubes || sample?.cubeResults || [],
        otherBenches: sample?.otherBenches || []
    });

    const [currentCube, setCurrentCube] = useState({ benchNo: '', sleeperSequence: '', cubeCode: '' });

    // Fetch dynamic locations for the current plant
    useEffect(() => {
        const fetchLocations = async () => {
            if (effectivePlantId && effectiveVendorId) {
                try {
                    const response = await apiService.getPlantSheds(effectiveVendorId, effectivePlantId);
                    let locList = [];
                    const data = response?.responseData || response;
                    
                    if (Array.isArray(data)) {
                        data.forEach(item => { if (item && !locList.includes(item)) locList.push(String(item)); });
                    } else if (typeof data === 'object' && data !== null) {
                        Object.values(data).forEach((val) => {
                            if (Array.isArray(val)) {
                                val.forEach(id => { if (id && !locList.includes(id)) locList.push(String(id)); });
                            } else if (typeof val === 'string' && val && !locList.includes(val)) {
                                locList.push(val);
                            }
                        });
                    }
                    setAvailableLocations(locList);
                } catch (err) {
                    console.error("Error fetching locations in steam cube form:", err);
                }
            }
        };
        fetchLocations();
    }, [effectivePlantId, effectiveVendorId]);

    // Fetch batch numbers from moisture reports
    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await apiService.getLastFiveMoisture();
                if (res?.responseData) {
                    setMoistureReports(res.responseData);
                }
            } catch (err) {
                console.error("Failed to fetch batches:", err);
            }
        };
        fetchReports();
    }, []);

    // Auto-generate Cube Code when bench or sequence changes
    useEffect(() => {
        if (currentCube.benchNo && currentCube.sleeperSequence) {
            setCurrentCube(prev => ({ 
                ...prev, 
                cubeCode: `${prev.benchNo}/${prev.sleeperSequence}` 
            }));
        }
    }, [currentCube.benchNo, currentCube.sleeperSequence]);


    const handleLocationChange = (e) => {
        const val = e.target.value;
        // In the new API structure, locations are simple strings (Shed No or Line No)
        // We set lineNo by default, or shedNo if the value suggests it's a shed
        if (String(val).toLowerCase().includes('shed')) {
            setFormData({ ...formData, shedNo: val, lineNo: null });
        } else {
            setFormData({ ...formData, lineNo: val, shedNo: null });
        }
    };

    const addCube = () => {
        if (currentCube.benchNo) {
            setFormData({
                ...formData,
                cubes: [...formData.cubes, { benchNo: String(currentCube.benchNo) }],
                otherBenches: [...formData.otherBenches, {
                    benchNo: String(currentCube.benchNo),
                    sleeperSequence: currentCube.sleeperSequence || "",
                    cubeCode: currentCube.cubeCode || ""
                }]
            });
            setCurrentCube({ benchNo: '', sleeperSequence: '', cubeCode: '' });
        }
    };

    const removeCube = (index) => {
        setFormData({
            ...formData,
            cubes: formData.cubes.filter((_, i) => i !== index),
            otherBenches: formData.otherBenches.filter((_, i) => i !== index)
        });
    };

    // Removal of selectedContainerId as it was tied to the old containers list which is no longer used.

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">{isModifying ? 'Modify' : 'New'} Sample Declaration</span>
                    <button className="form-modal-close" onClick={onClose}>X</button>
                </div>
                <div className="form-modal-body">
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="input-group">
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Location (Line/Shed)</label>
                            <select 
                                value={formData.lineNo || formData.shedNo || ''} 
                                onChange={handleLocationChange}
                                style={{
                                    width: '100%',
                                    padding: '0 12px',
                                    height: '42px',
                                    borderRadius: '8px',
                                    border: '1.5px solid #e2e8f0',
                                    fontSize: '14px',
                                    color: '#1e293b',
                                    background: '#fff',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="">-- Select Location --</option>
                                {availableLocations.map((loc, i) => (
                                    <option key={i} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Date of Casting</label>
                            <input 
                                type="date" 
                                value={formData.castingDate} 
                                onChange={e => setFormData({ ...formData, castingDate: e.target.value })} 
                                style={{ width: '100%', padding: '0 12px', height: '42px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '14px', color: '#1e293b', outline: 'none' }}
                            />
                        </div>
                        <div className="input-group">
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Batch No. (From Moisture Reports)</label>
                            <select 
                                value={formData.batchNo} 
                                onChange={e => setFormData({ ...formData, batchNo: e.target.value })}
                                style={{ width: '100%', padding: '0 12px', height: '42px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '14px', color: '#1e293b', outline: 'none', background: '#fff' }}
                            >
                                <option value="">-- Select Batch --</option>
                                {moistureReports.map(report => (
                                    <option key={report.id} value={report.batchNo}>{report.batchNo}</option>
                                ))}
                                {formData.batchNo && !moistureReports.find(r => String(r.batchNo) === String(formData.batchNo)) && (
                                    <option value={formData.batchNo}>{formData.batchNo}</option>
                                )}
                            </select>
                        </div>

                        <div className="input-group">
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>LBC Time</label>
                            <input 
                                type="time" 
                                value={formData.lbcTime} 
                                onChange={e => setFormData({ ...formData, lbcTime: e.target.value })} 
                                style={{ width: '100%', padding: '0 12px', height: '42px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '14px', color: '#1e293b', outline: 'none' }}
                            />
                        </div>
                        <div className="input-group">
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Concrete Grade</label>
                            <select 
                                value={formData.concreteGrade} 
                                onChange={e => setFormData({ ...formData, concreteGrade: e.target.value })}
                                style={{ width: '100%', padding: '0 12px', height: '42px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '14px', color: '#1e293b', outline: 'none' }}
                            >
                                <option value="">-- Select --</option>
                                <option>M-55</option>
                                <option>M-60</option>
                            </select>
                        </div>
                    </div>

                    {/* Cube Addition Section */}
                    <div style={{ marginTop: '24px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#475569', fontWeight: '700' }}>Add Cubes</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Bench/Gang No.</label>
                                <input
                                    type="text"
                                    value={currentCube.benchNo}
                                    onChange={e => setCurrentCube({ ...currentCube, benchNo: e.target.value })}
                                    placeholder="e.g., 401"
                                    style={{ padding: '0 10px', height: '38px', borderRadius: '6px', border: '1.5px solid #e2e8f0', fontSize: '13px', color: '#1e293b', outline: 'none' }}
                                />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Sleeper Sequence</label>
                                <select 
                                    value={currentCube.sleeperSequence} 
                                    onChange={e => setCurrentCube({ ...currentCube, sleeperSequence: e.target.value })}
                                    style={{ padding: '0 10px', height: '38px', borderRadius: '6px', border: '1.5px solid #e2e8f0', fontSize: '13px', color: '#1e293b', outline: 'none', background: '#fff' }}
                                >
                                    <option value="">-- Select --</option>
                                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Cube Code (Auto)</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={currentCube.cubeCode}
                                    placeholder="Auto-generated"
                                    style={{ padding: '0 10px', height: '38px', borderRadius: '6px', border: '1.5px solid #e2e8f0', fontSize: '13px', color: '#475569', outline: 'none', background: '#f8fafc' }}
                                />
                            </div>

                            <button 
                                className="btn-verify" 
                                onClick={addCube} 
                                style={{ height: '32px', padding: '0 16px', borderRadius: '16px', fontSize: '11px', fontWeight: '700' }}
                            >
                                + Add
                            </button>
                        </div>

                        {/* Display Added Cubes */}
                        {formData.otherBenches.length > 0 && (
                            <div style={{ marginTop: '16px' }}>
                                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '8px', display: 'block' }}>Added Cubes:</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {formData.otherBenches.map((cube, idx) => (
                                        <div key={idx} style={{
                                            background: '#fff',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <span style={{ fontWeight: '700', color: '#42818c' }}>{cube.cubeCode}</span>
                                            <button
                                                onClick={() => removeCube(idx)}
                                                style={{
                                                    background: '#fee2e2',
                                                    color: '#ef4444',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '2px 6px',
                                                    fontSize: '10px',
                                                    cursor: 'pointer',
                                                    fontWeight: '700'
                                                }}
                                            >×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>


                    <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end' }}>
                        <button
                            className="btn-verify"
                            style={{ padding: '8px 24px', fontSize: '12px', height: '36px', width: 'auto' }}
                            onClick={() => onSave(formData)}
                            disabled={!formData.batchNo || !formData.concreteGrade || formData.cubes.length === 0}
                        >
                            {isModifying ? 'Update Declaration' : 'Save Declaration'}
                        </button>
                        <button 
                            className="btn-save" 
                            style={{ padding: '8px 24px', fontSize: '12px', height: '36px', width: 'auto', background: '#f1f5f9', color: '#64748b', marginTop: 0 }} 
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

const TestDetailsModal = ({ sample, onClose, onSave, onDelete, isModifying, activeContainer }) => {
    const isShed = activeContainer?.type === 'Shed';
    const [testData, setTestData] = useState({
        testDate: sample.testDate || new Date().toISOString().split('T')[0],
        testTime: sample.testTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        cubeResults: sample.cubeResults?.length ? sample.cubeResults.map(cr => ({
            ...cr,
            testDate: cr.testDate || new Date().toISOString().split('T')[0],
            testTime: cr.testTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        })) : (sample.cubes || []).map(cube => ({
            cubeNo: cube.benchNo,
            weight: '',
            load: '',
            strength: '',
            ageHrs: '0.0',
            testDate: new Date().toISOString().split('T')[0],
            testTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        }))
    });

    const addCubeRow = () => {
        setTestData(prev => ({
            ...prev,
            cubeResults: [
                ...prev.cubeResults,
                {
                    cubeNo: '',
                    weight: '',
                    load: '',
                    strength: '',
                    ageHrs: '0.0',
                    testDate: new Date().toISOString().split('T')[0],
                    testTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                }
            ]
        }));
    };

    const removeCubeRow = (idx) => {
        setTestData(prev => ({
            ...prev,
            cubeResults: prev.cubeResults.filter((_, i) => i !== idx)
        }));
    };

    const calculateAge = (castDate, castTime, testDate, testTime) => {
        if (!castDate || !castTime || !testDate || !testTime) return '0.0';
        const cast = new Date(`${castDate}T${castTime}`);
        const test = new Date(`${testDate}T${testTime}`);
        const diffMs = test - cast;
        return (diffMs / (1000 * 60 * 60)).toFixed(1);
    };

    // Initialize ageHrs for all cubes on mount (or if sample changes)
    useEffect(() => {
        setTestData(prev => ({
            ...prev,
            cubeResults: prev.cubeResults.map(cube => ({
                ...cube,
                ageHrs: calculateAge(sample.castingDate, sample.lbcTime, cube.testDate, cube.testTime)
            }))
        }));
    }, []); // Run once on mount

    const updateCubeData = (index, field, value) => {
        const newCubeResults = [...testData.cubeResults];
        newCubeResults[index][field] = value;

        // Auto-calculate strength when load changes
        if (field === 'load' && value && !isNaN(value)) {
            newCubeResults[index].strength = (parseFloat(value) / 22.5).toFixed(2);
        }

        // Recalculate age if date or time changes
        if (field === 'testDate' || field === 'testTime') {
            const currentCube = newCubeResults[index];
            newCubeResults[index].ageHrs = calculateAge(
                sample.castingDate,
                sample.lbcTime,
                currentCube.testDate,
                currentCube.testTime
            );
        }

        setTestData({ ...testData, cubeResults: newCubeResults });
    };

    // Calculate average strength
    const avgStrength = useMemo(() => {
        const strengths = testData.cubeResults
            .map(c => parseFloat(c.strength))
            .filter(s => !isNaN(s));

        if (strengths.length === 0) return 0;
        return (strengths.reduce((a, b) => a + b, 0) / strengths.length).toFixed(2);
    }, [testData.cubeResults]);

    // Determine result
    const threshold = (sample.concreteGrade || sample.grade) === 'M-55' ? 40 : 50;
    const allStrengths = testData.cubeResults.map(c => parseFloat(c.strength)).filter(s => !isNaN(s));
    const result = (allStrengths.length > 0 && allStrengths.every(s => s >= threshold)) ? 'OK' : 'Not OK';

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '1200px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">Test Form - Batch {sample.batchNo}</span>
                    <button className="form-modal-close" onClick={onClose}>X</button>
                </div>
                <div className="form-modal-body">
                    {/* Pre-filled Information */}
                    <div style={{ marginBottom: '20px' }}>
                        <label className="mini-label" style={{ color: '#42818c', fontSize: '11px' }}>PRE-FILLED INFORMATION</label>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                            <div><div style={{ fontSize: '10px', color: '#64748b' }}>Location</div><div style={{ fontWeight: '700', fontSize: '13px', color: '#13343b' }}>{sample.shedNo || sample.lineNo}</div></div>
                            <div><div style={{ fontSize: '10px', color: '#64748b' }}>Date of Casting</div><div style={{ fontWeight: '700', fontSize: '13px' }}>{sample.castingDate ? sample.castingDate.split('-').reverse().join('/') : ''}</div></div>
                            <div><div style={{ fontSize: '10px', color: '#64748b' }}>Batch No.</div><div style={{ fontWeight: '700', fontSize: '13px' }}>{sample.batchNo}</div></div>
                            <div><div style={{ fontSize: '10px', color: '#64748b' }}>LBC Time</div><div style={{ fontWeight: '700', fontSize: '13px' }}>{sample.lbcTime}</div></div>
                            <div><div style={{ fontSize: '10px', color: '#64748b' }}>Concrete Grade</div><div style={{ fontWeight: '700', fontSize: '13px' }}>{sample.concreteGrade}</div></div>
                        </div>
                    </div>

                    {/* Cube Testing Table */}
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#475569', fontWeight: '700' }}>Individual Cube Testing</h4>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '700', color: '#64748b', fontSize: '11px' }}>Cube No.</th>
                                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '700', color: '#64748b', fontSize: '11px', minWidth: '130px' }}>Date of Testing</th>
                                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '700', color: '#64748b', fontSize: '11px', minWidth: '90px' }}>Time</th>
                                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '700', color: '#64748b', fontSize: '11px' }}>Age (Hrs)</th>
                                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '700', color: '#64748b', fontSize: '11px' }}>Weight (Kgs)</th>
                                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '700', color: '#64748b', fontSize: '11px' }}>Load (KN)</th>
                                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '700', color: '#64748b', fontSize: '11px' }}>Strength (N/mm²)</th>
                                        <th style={{ padding: '12px 8px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {testData.cubeResults.map((cube, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '6px 8px' }}>
                                                <input
                                                    type="text"
                                                    value={cube.cubeNo}
                                                    onChange={e => updateCubeData(idx, 'cubeNo', e.target.value)}
                                                    placeholder="e.g. 401"
                                                    style={{ width: '100%', padding: '8px 6px', border: '1.5px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: '800', color: '#13343b', outline: 'none' }}
                                                />
                                            </td>
                                            <td style={{ padding: '6px 8px' }}>
                                                <input
                                                    type="date"
                                                    value={cube.testDate}
                                                    onChange={e => updateCubeData(idx, 'testDate', e.target.value)}
                                                    style={{ width: '100%', padding: '8px 6px', border: '1.5px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', color: '#13343b', fontWeight: '500', outline: 'none' }}
                                                />
                                            </td>
                                            <td style={{ padding: '6px 8px' }}>
                                                <input
                                                    type="time"
                                                    value={cube.testTime}
                                                    onChange={e => updateCubeData(idx, 'testTime', e.target.value)}
                                                    style={{ width: '100%', padding: '8px 6px', border: '1.5px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', color: '#13343b', fontWeight: '500', outline: 'none' }}
                                                />
                                            </td>
                                            <td style={{ padding: '6px 8px' }}>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={cube.ageHrs}
                                                    style={{ width: '100%', padding: '8px 6px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', background: '#f8fafc', fontWeight: '700', color: '#13343b', textAlign: 'center' }}
                                                />
                                            </td>
                                            <td style={{ padding: '6px 8px' }}>
                                                <input
                                                    type="number"
                                                    value={cube.weight}
                                                    onChange={e => updateCubeData(idx, 'weight', e.target.value)}
                                                    placeholder="0.00"
                                                    style={{ width: '100%', padding: '8px 6px', border: '1.5px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', color: '#13343b', fontVariantNumeric: 'tabular-nums', fontWeight: '600', outline: 'none' }}
                                                />
                                            </td>
                                            <td style={{ padding: '6px 8px' }}>
                                                <input
                                                    type="number"
                                                    value={cube.load}
                                                    onChange={e => updateCubeData(idx, 'load', e.target.value)}
                                                    placeholder="0.0"
                                                    style={{ width: '100%', padding: '8px 6px', border: '1.5px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', color: '#13343b', fontVariantNumeric: 'tabular-nums', fontWeight: '600', outline: 'none' }}
                                                />
                                            </td>
                                            <td style={{ padding: '6px 8px' }}>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={cube.strength}
                                                    style={{ width: '100%', padding: '8px 6px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f0fdf4', fontWeight: '800', color: '#166534', fontSize: '14px', textAlign: 'center' }}
                                                />
                                            </td>
                                            <td style={{ padding: '6px 8px' }}>
                                                <button onClick={() => removeCubeRow(idx)} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontWeight: '700' }}>×</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={addCubeRow} style={{ marginTop: '12px', background: '#f5f3ff', color: '#7c3aed', border: '1px dashed #7c3aed', borderRadius: '16px', padding: '6px 16px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', height: '32px', display: 'flex', alignItems: 'center' }}>+ Add Cube</button>
                    </div>

                    {/* Summary Section */}
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '2px solid #42818c', marginBottom: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'block', marginBottom: '8px' }}>Avg. Strength (N/mm²)</label>
                                <div style={{
                                    padding: '12px',
                                    background: '#fff',
                                    borderRadius: '8px',
                                    fontSize: '20px',
                                    fontWeight: '800',
                                    color: '#42818c',
                                    textAlign: 'center'
                                }}>{avgStrength}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'block', marginBottom: '8px' }}>Result of Testing</label>
                                <div style={{
                                    padding: '12px',
                                    background: result === 'OK' ? '#ecfdf5' : '#fee2e2',
                                    borderRadius: '8px',
                                    fontSize: '20px',
                                    fontWeight: '800',
                                    color: result === 'OK' ? '#059669' : '#dc2626',
                                    textAlign: 'center',
                                    border: `2px solid ${result === 'OK' ? '#059669' : '#dc2626'}`
                                }}>{result}</div>
                            </div>
                        </div>
                        <p style={{ fontSize: '10px', color: '#64748b', marginTop: '12px', marginBottom: 0, textAlign: 'center' }}>
                            Threshold: {(sample.concreteGrade || sample.grade) === 'M-55' ? '≥ 40 N/mm²' : '≥ 50 N/mm²'} for all cubes
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                        <button
                            className="btn-verify"
                            style={{ padding: '8px 24px', fontSize: '12px', height: '36px', width: 'auto' }}
                            onClick={() => onSave({
                                ...testData,
                                avgStrength,
                                result,
                                castingDate: sample.castingDate || sample.date || sample.entryDate,
                                lbcTime: sample.lbcTime,
                                lineNo: sample.lineNo || (sample.location && !sample.shedNo ? sample.location : null),
                                shedNo: sample.shedNo || (sample.location && sample.shedNo ? sample.location : null),
                                location: sample.location || sample.lineNo || sample.shedNo,
                                batchNo: sample.batchNo,
                                chamberNo: sample.chamberNo,
                                concreteGrade: sample.concreteGrade || sample.grade
                            })}
                        >
                            Complete Test & Archive
                        </button>
                        <button 
                            className="btn-save" 
                            style={{ padding: '8px 24px', fontSize: '12px', height: '36px', width: 'auto', background: '#f1f5f9', color: '#64748b', marginTop: 0 }} 
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

export default SteamCubeTesting;
