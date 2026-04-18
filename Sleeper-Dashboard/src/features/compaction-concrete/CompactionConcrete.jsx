import React, { useState, useMemo, useEffect } from 'react';
import { apiService } from '../../services/api';
import './CompactionConcrete.css';
import { useShift } from '../../context/ShiftContext';
import { getBatchNosForCompaction } from '../../services/workflowService';

const CompactionSubCard = ({ id, title, color, statusDetail, isActive, onClick }) => {
    const label = id === 'stats' ? 'ANALYSIS' : id === 'witnessed' ? 'HISTORY' : 'SCADA';
    return (
        <div
            className={`compaction-sub-card ${isActive ? 'active' : ''}`}
            onClick={onClick}
            style={{
                borderTop: `4px solid ${color}`,
                borderColor: isActive ? color : '#e2e8f0',
                '--active-color': color
            }}
        >
            <div className="card-top">
                <span className="card-label" style={{ color: isActive ? color : '#64748b' }}>{label}</span>
                <span className="status-dot" style={{ background: color, opacity: isActive ? 1 : 0.4 }}></span>
            </div>
            <span className="card-title">{title}</span>
            <div className="card-footer">
                {statusDetail}
            </div>
        </div>
    );
};

const CompactionConcrete = ({ 
    onBack, 
    displayMode = 'modal', 
    showForm: propsShowForm, 
    setShowForm: propsSetShowForm, 
    activeContainer, 
    loadShiftData, 
    sharedState = {} 
}) => {
    const { compactionRecords: entries = [], setAllCompactionRecords: setEntries } = sharedState;
    const { 
        vendorCode, dutyUnit, selectedShift, dutyDate, userId, vendorId,
        containers = [], allBatchDeclarations = {}, fetchCompaction 
    } = useShift();
    
    const [viewMode, setViewMode] = useState('witnessed'); 
    const [localShowForm, setLocalShowForm] = useState(false);
    const showForm = propsShowForm !== undefined ? propsShowForm : localShowForm;
    const setShowForm = propsSetShowForm !== undefined ? propsSetShowForm : setLocalShowForm;

    const [manualForm, setManualForm] = useState({
        dateOfCasting: dutyDate || new Date().toISOString().split('T')[0],
        location: activeContainer?.name || (containers[0]?.name || 'Line I'),
        batchNo: '',
        benchNo: '',
        timeOfCasting: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        minRpm: '',
        maxRpm: '',
        minDuration: '',
        maxDuration: '',
    });

    const [selectedBatch, setSelectedBatch] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [fetchedLocations, setFetchedLocations] = useState([]);
    const [batchOptions, setBatchOptions] = useState([]);
    
    // Track records added in CURRENT form session
    const [sessionRecords, setSessionRecords] = useState([]);

    useEffect(() => {
        if (loadShiftData) loadShiftData();
    }, [loadShiftData]);

    // Fetch dynamic locations for the current Unit (Plant)
    useEffect(() => {
        const fetchLocations = async () => {
            const vId = vendorId || localStorage.getItem('vendorId');
            if (dutyUnit && vId) {
                try {
                    const response = await apiService.getPlantSheds(vId, dutyUnit);
                    let locList = [];
                    const data = response?.responseData || response;
                    if (data && typeof data === 'object') {
                        Object.values(data).forEach(ids => {
                            if (Array.isArray(ids)) {
                                ids.forEach(id => locList.push(id));
                            }
                        });
                    }
                    setFetchedLocations(locList);
                    if (locList.length > 0 && !manualForm.location) {
                        setManualForm(prev => ({ ...prev, location: locList[0] }));
                    }
                } catch (err) {
                    console.error("Error fetching locations for compaction:", err);
                }
            }
        };
        fetchLocations();
    }, [dutyUnit, vendorId]);

    // Fetch batch numbers for compaction (filtered by date and location)
    useEffect(() => {
        const fetchBatches = async () => {
            // Using ISO format YYYY-MM-DD as observed in API curl
            const dateToUse = manualForm.dateOfCasting || dutyDate || new Date().toISOString().split('T')[0];
            const locationToUse = manualForm.location;

            if (dateToUse && locationToUse) {
                try {
                    const data = await getBatchNosForCompaction({ 
                        entryDate: dateToUse, 
                        location: locationToUse
                    });
                    setBatchOptions(data || []);
                } catch (err) {
                    console.error("Error fetching batch numbers for compaction:", err);
                }
            }
        };
        fetchBatches();
    }, [dutyDate, manualForm.dateOfCasting, manualForm.location, showForm]);

    // Mock SCADA Data 
    const [scadaRecords, setScadaRecords] = useState([
        { id: 101, time: '10:15', batchNo: '615', benchNo: '12', v1_rpm: 9000, v1_dur: 42, v2_rpm: 8950, v2_dur: 45, v3_rpm: 9100, v3_dur: 40, v4_rpm: 8800, v4_dur: 48, v5_rpm: 9050, v5_dur: 44, v6_rpm: 8980, v6_dur: 46, v7_rpm: 9120, v7_dur: 43, v8_rpm: 8850, v8_dur: 45 },
        { id: 102, time: '10:18', batchNo: '615', benchNo: '13', v1_rpm: 8850, v1_dur: 40, v2_rpm: 9200, v2_dur: 42, v3_rpm: 9050, v3_dur: 45, v4_rpm: 8900, v4_dur: 41, v5_rpm: 9100, v5_dur: 44, v6_rpm: 8870, v6_dur: 43, v7_rpm: 9020, v7_dur: 46, v8_rpm: 8950, v8_dur: 44 },
    ]);



    const [editingId, setEditingId] = useState(null);

    // Initial load sync for location
    useEffect(() => {
        if (activeContainer?.name) {
            setManualForm(prev => ({ ...prev, location: activeContainer.name }));
        }
    }, [activeContainer]);

    // Filter available batches based on chosen location in form
    const filteredBatchesForForm = useMemo(() => {
        if (!manualForm.location) return [];
        // Support both fetched locations (strings) and ShiftContext containers (objects)
        let matchedId = null;
        const matchedCont = containers.find(c => c.name === manualForm.location);
        if (matchedCont) {
            matchedId = matchedCont.id;
        } else {
            // Fallback for fetched locations - we might need mapping or it might work by name if allBatchDeclarations keys are names
            // However, ShiftContext uses numeric IDs for allBatchDeclarations.
            // Let's see if we can find the ID by name matching in containers
            // If it's a new location from the API that isn't in containers, we might have a problem mapping batches.
            // But usually the API locations correspond to what's in ShiftContext.
        }
        
        if (!matchedId) {
            // Check if we can find by name in all keys?
            // For now, let's assume containers covers it or we fallback to empty
            return [];
        }

        const batchesList = allBatchDeclarations[matchedId] || [];
        return [...batchesList].sort((a,b) => String(b.batchNo).localeCompare(String(a.batchNo)));
    }, [manualForm.location, allBatchDeclarations, containers]);

    const availableBatchesForLogs = useMemo(() => {
        const bSet = new Set();
        (entries || []).forEach(r => { if (r.batchNo) bSet.add(String(r.batchNo)); });
        return Array.from(bSet).sort();
    }, [entries]);

    const handleWitness = (record) => {
        const rpms = [];
        const durs = [];
        for (let i = 1; i <= 8; i++) {
            if (record[`v${i}_rpm`]) rpms.push(record[`v${i}_rpm`]);
            if (record[`v${i}_dur`]) durs.push(record[`v${i}_dur`]);
        }

        const newEntry = {
            id: Date.now(),
            date: manualForm.dateOfCasting,
            time: record.time,
            batchNo: record.batchNo,
            benchNo: record.benchNo,
            minRpm: Math.min(...rpms),
            maxRpm: Math.max(...rpms),
            minDuration: Math.min(...durs),
            maxDuration: Math.max(...durs),
            duration: Math.round(durs.reduce((a, b) => a + b, 0) / (durs.length || 1)),
            source: 'Scada',
            location: manualForm.location,
            originalScadaId: record.id
        };
        setSessionRecords(prev => [newEntry, ...prev]);
        setScadaRecords(prev => prev.filter(r => r.id !== record.id));
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to remove this record from the current session?')) {
            setSessionRecords(prev => prev.filter(e => e.id !== id));
        }
    };

    const handleDeleteLog = async (parentId) => {
        if (!parentId) return;
        if (window.confirm('Are you sure you want to delete this batch record? This will remove all associated logs for this session.')) {
            try {
                await apiService.deleteCompaction(parentId);
                if (fetchCompaction) await fetchCompaction();
                alert("Deleted successfully");
            } catch (err) {
                console.error("Delete failed:", err);
                alert("Failed to delete record: " + err.message);
            }
        }
    };

    const handleFinalSave = async () => {
        if (sessionRecords.length === 0) {
            alert("No records to save.");
            return;
        }
        if (!manualForm.batchNo) {
            alert("Please select a Batch Number.");
            return;
        }

        setIsSaving(true);
        try {
            const [y, m, d] = manualForm.dateOfCasting.split('-');
            const formattedDate = `${d}/${m}/${y}`;

            const now = new Date();
            const payload = {
                batchNo: String(manualForm.batchNo),
                sleeperType: "RT-8746", 
                entryDate: formattedDate,
                date: formattedDate,
                location: manualForm.location,
                locationType: manualForm.location.toLowerCase().includes('shed') ? 'Shed' : 'Line',
                time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
                vendorCode: vendorCode || localStorage.getItem('vendorCode'),
                plantId: dutyUnit || localStorage.getItem('dutyUnit'),
                shift: selectedShift || localStorage.getItem('selectedShift'),
                createdBy: userId || localStorage.getItem('userId'),
                updatedBy: userId || localStorage.getItem('userId'),
                scadaRecords: sessionRecords.filter(r => r.source === 'Scada').map(r => ({
                    id: 0,
                    time: (r.time && r.time.length === 5) ? `${r.time}:00` : (r.time || "00:00:00"),
                    benchNo: String(r.benchNo),
                    v1V4Rpm: parseInt(r.minRpm) || 0,
                    minDuration: parseInt(r.minDuration) || 0,
                    maxDuration: parseInt(r.maxDuration) || 0,
                    duration: parseInt(r.duration) || 0
                })),
                manualRecords: sessionRecords.filter(r => r.source === 'Manual').map(r => ({
                    id: 0,
                    benchNo: String(r.benchNo),
                    minRpm: parseInt(r.minRpm) || 0,
                    maxRpm: parseInt(r.maxRpm) || 0,
                    minDuration: parseInt(r.minDuration) || 0,
                    maxDuration: parseInt(r.maxDuration) || 0,
                    duration: parseInt(r.duration) || 0
                }))
            };

            await apiService.createCompaction(payload);
            const refresh = fetchCompaction || propsFetchCompaction || loadShiftData;
            if (refresh) await refresh();
            setShowForm(false);
            setSessionRecords([]);
            alert("Compaction session saved successfully.");
        } catch (error) {
            console.error("Save failed:", error);
            alert(`Failed to save: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveManual = () => {
        if (!manualForm.batchNo || !manualForm.benchNo) {
            alert('Batch and Bench required');
            return;
        }

        const minRpmVal = parseInt(manualForm.minRpm);
        const maxRpmVal = parseInt(manualForm.maxRpm);
        if (isNaN(minRpmVal) || isNaN(maxRpmVal) || minRpmVal < 8640 || maxRpmVal > 9360) {
            alert('Invalid RPM: Speed must be between 8640 and 9360 RPM');
            return;
        }

        const minDurVal = parseInt(manualForm.minDuration);
        const maxDurVal = parseInt(manualForm.maxDuration);
        if (isNaN(minDurVal) || isNaN(maxDurVal) || minDurVal < 120 || maxDurVal > 240) {
            alert('Invalid Duration: Cycle must be between 120 and 240 seconds');
            return;
        }

        const avgDuration = Math.round((minDurVal + maxDurVal) / 2);
        const newEntry = {
            id: editingId || Date.now(),
            date: manualForm.dateOfCasting,
            time: manualForm.timeOfCasting,
            batchNo: manualForm.batchNo,
            benchNo: manualForm.benchNo,
            minRpm: minRpmVal,
            maxRpm: maxRpmVal,
            minDuration: minDurVal,
            maxDuration: maxDurVal,
            duration: avgDuration,
            source: 'Manual',
            location: manualForm.location
        };

        if (editingId) {
            setSessionRecords(prev => prev.map(e => e.id === editingId ? newEntry : e));
            setEditingId(null);
        } else {
            setSessionRecords(prev => [newEntry, ...prev]);
        }
        
        setManualForm(prev => ({
            ...prev,
            benchNo: '',
            minRpm: '',
            maxRpm: '',
            minDuration: '',
            maxDuration: '',
            timeOfCasting: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        }));
    };

    const tabs = [
        { id: 'stats', label: 'Statistics', short: 'ANALYSIS', color: '#42818c', desc: 'Live vibration performance' },
        { id: 'witnessed', label: 'Witnessed Logs', short: 'HISTORY', color: '#10b981', desc: `${entries.length} Verified Records` },
        { id: 'scada', label: 'Scada Data', short: 'SCADA', color: '#f59e0b', desc: 'PLCs Connected' }
    ];

    const renderSubCards = () => (
        <div className="compaction-sub-grid">
            {tabs.map(tab => (
                <CompactionSubCard
                    key={tab.id}
                    id={tab.id}
                    title={tab.label}
                    color={tab.color}
                    statusDetail={tab.desc}
                    isActive={viewMode === tab.id}
                    onClick={() => setViewMode(tab.id)}
                />
            ))}
        </div>
    );

    const closeForm = () => { setShowForm(false); setEditingId(null); };

    const renderForm = () => (
        <div className="compaction-form-overlay" onClick={closeForm}>
            <div className="compaction-form-card" onClick={e => e.stopPropagation()}>
                <div className="compaction-card-header">
                    <div>
                        <h2>New Compaction Entry</h2>
                        <p className="card-subtitle">Monitoring & Assurance</p>
                    </div>
                    <button onClick={closeForm} className="close-mini-btn">✕</button>
                </div>

                <div className="compaction-card-body">
                    <div className="compaction-form-stack">
                        <section className="compaction-section section-blue">
                            <div className="section-header">
                                <span className="step-number blue-bg">1</span>
                                <h4>Initial Declaration</h4>
                            </div>
                            <div className="form-grid compact" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                                <div className="form-field">
                                    <label>Location</label>
                                    <select
                                        value={manualForm.location}
                                        onChange={e => setManualForm({ ...manualForm, location: e.target.value, batchNo: '' })}
                                        style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                                    >
                                        <option value="">-- Select --</option>
                                        {(fetchedLocations.length > 0 ? fetchedLocations : containers.map(c => c.name)).map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label>Date of Casting</label>
                                    <input 
                                        type="date" 
                                        value={manualForm.dateOfCasting} 
                                        onChange={e => setManualForm({ ...manualForm, dateOfCasting: e.target.value })} 
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Batch Number</label>
                                    <select
                                        value={manualForm.batchNo}
                                        onChange={e => setManualForm({ ...manualForm, batchNo: e.target.value })}
                                        style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                                    >
                                        <option value="">-- Select Batch --</option>
                                        {/* Use new batchOptions from API */}
                                        {batchOptions
                                            .filter(b => b.batchNumber) // Only show non-null batch numbers
                                            .map(b => <option key={b.id} value={b.batchNumber}>{b.batchNumber}</option>)
                                        }
                                        {/* Fallback to context batches if API returned nothing */}
                                        {batchOptions.length === 0 && filteredBatchesForForm.map(b => (
                                            <option key={b.id} value={b.batchNo}>{b.batchNo}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </section>

                        <section className="compaction-section section-amber">
                            <div className="section-header">
                                <span className="step-number amber-bg">2</span>
                                <h4>Scada Data Fetched</h4>
                            </div>
                            <div className="table-responsive">
                                <table className="ui-table scada-detailed-table compact-font">
                                    <thead>
                                        <tr>
                                            <th rowSpan="2">Time</th>
                                            <th rowSpan="2">Bench</th>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                <th key={i} colSpan="2">V{i}</th>
                                            ))}
                                            <th rowSpan="2">Action</th>
                                        </tr>
                                        <tr>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                <React.Fragment key={i}>
                                                    <th>R</th>
                                                    <th>D</th>
                                                </React.Fragment>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {scadaRecords.filter(r => !manualForm.batchNo || String(r.batchNo) === String(manualForm.batchNo)).length === 0 ? (
                                            <tr><td colSpan="19" className="empty-msg">No pending SCADA data found.</td></tr>
                                        ) : (
                                            scadaRecords.filter(r => !manualForm.batchNo || String(r.batchNo) === String(manualForm.batchNo)).map(r => (
                                                <tr key={r.id}>
                                                    <td>{r.time}</td>
                                                    <td><strong>{r.benchNo}</strong></td>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                        <React.Fragment key={i}>
                                                            <td>{r[`v${i}_rpm`]}</td>
                                                            <td style={{ color: '#64748b' }}>{r[`v${i}_dur`]}</td>
                                                        </React.Fragment>
                                                    ))}
                                                    <td><button className="btn-action" onClick={() => handleWitness(r)}>Witness</button></td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="compaction-section section-green">
                            <div className="section-header">
                                <span className="step-number green-bg">3</span>
                                <h4>Manual Entry Form</h4>
                            </div>
                            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
                                <div className="form-field"><label>Bench No.</label><input type="number" min="0" value={manualForm.benchNo} onChange={e => setManualForm({ ...manualForm, benchNo: e.target.value })} /></div>
                                <div className="form-field"><label>Time of Casting</label><input type="time" value={manualForm.timeOfCasting} onChange={e => setManualForm({ ...manualForm, timeOfCasting: e.target.value })} /></div>
                                <div className="form-field">
                                    <label>Min RPM <small style={{ opacity: 0.6 }}>(8640+)</small></label>
                                    <input 
                                        type="number" 
                                        value={manualForm.minRpm} 
                                        onChange={e => setManualForm({ ...manualForm, minRpm: e.target.value })} 
                                        style={(manualForm.minRpm && (parseInt(manualForm.minRpm) < 8640 || parseInt(manualForm.minRpm) > 9360)) ? { borderColor: '#ef4444', color: '#ef4444', background: '#fef2f2' } : {}}
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Max RPM <small style={{ opacity: 0.6 }}>(up to 9360)</small></label>
                                    <input 
                                        type="number" 
                                        value={manualForm.maxRpm} 
                                        onChange={e => setManualForm({ ...manualForm, maxRpm: e.target.value })} 
                                        style={(manualForm.maxRpm && (parseInt(manualForm.maxRpm) < 8640 || parseInt(manualForm.maxRpm) > 9360)) ? { borderColor: '#ef4444', color: '#ef4444', background: '#fef2f2' } : {}}
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Min Duration <small style={{ opacity: 0.6 }}>(120s+)</small></label>
                                    <input 
                                        type="number" 
                                        value={manualForm.minDuration} 
                                        onChange={e => setManualForm({ ...manualForm, minDuration: e.target.value })} 
                                        style={(manualForm.minDuration && (parseInt(manualForm.minDuration) < 120 || parseInt(manualForm.minDuration) > 240)) ? { borderColor: '#ef4444', color: '#ef4444', background: '#fef2f2' } : {}}
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Max Duration <small style={{ opacity: 0.6 }}>(up to 240s)</small></label>
                                    <input 
                                        type="number" 
                                        value={manualForm.maxDuration} 
                                        onChange={e => setManualForm({ ...manualForm, maxDuration: e.target.value })} 
                                        style={(manualForm.maxDuration && (parseInt(manualForm.maxDuration) < 120 || parseInt(manualForm.maxDuration) > 240)) ? { borderColor: '#ef4444', color: '#ef4444', background: '#fef2f2' } : {}}
                                    />
                                </div>
                            </div>
                            <div className="action-row-center" style={{ marginTop: '1rem' }}><button className="toggle-btn" onClick={handleSaveManual}>{editingId ? 'Update Record' : 'Save Manual Record'}</button></div>
                        </section>

                        <section className="compaction-section section-slate" style={{ borderBottom: 'none' }}>
                            <div className="section-header">
                                <span className="step-number slate-bg">4</span>
                                <h4>Recent Session Logs</h4>
                            </div>
                            <div className="table-responsive">
                                <table className="ui-table compact">
                                    <thead><tr><th>Source</th><th>Date</th><th>Location</th><th>Batch</th><th>Bench</th><th>RPM Range</th><th>Duration</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {sessionRecords.length === 0 ? (
                                            <tr><td colSpan="8" className="empty-msg">No entries added in this session.</td></tr>
                                        ) : (
                                            sessionRecords.map(e => (
                                                <tr key={e.id}>
                                                    <td><span className={`status-pill ${e.source === 'Manual' ? 'manual' : 'witnessed'}`}>{e.source}</span></td>
                                                    <td>{e.date && e.date.includes('-') ? e.date.split('-').reverse().join('/') : (e.date || '—')}</td>
                                                    <td>{e.location || '—'}</td>
                                                    <td>{e.batchNo}</td><td>{e.benchNo}</td><td>{e.minRpm}-{e.maxRpm}</td><td>{e.minDuration ? `${e.minDuration}-${e.maxDuration}s` : `${e.duration}s`}</td>
                                                    <td>
                                                        <div className="btn-group">
                                                            <button className="btn-action danger" onClick={() => handleDelete(e.id)}>Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="compaction-card-footer" style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#f8fafc' }}>
                    <button className="btn-action" onClick={closeForm} style={{ padding: '10px 20px' }}>Cancel</button>
                    <button
                        className="toggle-btn"
                        onClick={handleFinalSave}
                        disabled={isSaving || !manualForm.batchNo}
                        style={{
                            padding: '10px 30px',
                            background: isSaving || !manualForm.batchNo ? '#94a3b8' : '#0f172a',
                            cursor: isSaving || !manualForm.batchNo ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isSaving ? 'Processing...' : 'Save / Finish Batch'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderContent = () => (
        <div className="compaction-content">
            {showForm && renderForm()}
            <div className="view-layer">
                {displayMode === 'inline' && renderSubCards()}

                {viewMode === 'stats' && (
                    <div className="view-stats fade-in">
                        <div className="content-title-row">
                            <h3>Compaction Performance Analysis</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b' }}>Batch:</label>
                                <select className="dash-select" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                                    <option value="">-- All --</option>
                                    {availableBatchesForLogs.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        </div>

                        {(() => {
                            const filtered = (entries || []).filter(e => !selectedBatch || String(e.batchNo) === String(selectedBatch));
                            const avgRpm = filtered.length ? Math.round(filtered.reduce((acc, curr) => acc + (parseInt(curr.minRpm) + parseInt(curr.maxRpm)) / 2, 0) / filtered.length) : 0;
                            const avgDur = filtered.length ? Math.round(filtered.reduce((acc, curr) => acc + parseInt(curr.duration), 0) / filtered.length) : 0;
                            const withinRange = filtered.filter(e => e.minRpm >= 8000 && e.maxRpm <= 10000).length;
                            const consistency = filtered.length ? Math.round((withinRange / filtered.length) * 100) : 100;

                            return (
                                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                                    <div className="stats-metric-card" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', marginBottom: '0.5rem' }}>AVG VIBRATION SPEED</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>{avgRpm} <small style={{ fontSize: '0.8rem', opacity: 0.6 }}>RPM</small></div>
                                    </div>
                                    <div className="stats-metric-card" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', marginBottom: '0.5rem' }}>AVG CYCLE DURATION</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10b981' }}>{avgDur}s <small style={{ fontSize: '0.8rem', opacity: 0.6 }}>TARGET: 45s</small></div>
                                    </div>
                                    <div className="stats-metric-card" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', marginBottom: '0.5rem' }}>CONSISTENCY RATING</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: consistency > 90 ? '#10b981' : consistency > 70 ? '#f59e0b' : '#ef4444' }}>{consistency}%</div>
                                        <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                                            <div style={{ width: `${consistency}%`, height: '100%', background: consistency > 90 ? '#10b981' : consistency > 70 ? '#f59e0b' : '#ef4444', transition: 'width 0.5s ease' }}></div>
                                        </div>
                                    </div>
                                    <div className="stats-metric-card" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', marginBottom: '0.5rem' }}>TOTAL LOGS</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#3b82f6' }}>{filtered.length}</div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {viewMode === 'witnessed' && (
                    <div className="view-witnessed fade-in">
                        <div className="content-title-row">
                            <h3>Witnessed Compaction Logs</h3>
                            <button className="toggle-btn" onClick={() => {
                                setSessionRecords([]);
                                setShowForm(true);
                            }}>+ Add New Entry</button>
                        </div>

                        {(() => {
                            const filtered = (entries || []).filter(e => !selectedBatch || String(e.batchNo) === String(selectedBatch));
                            const lineRecords = filtered.filter(r => !(r.location || '').toLowerCase().includes('shed'));
                            const shedRecords = filtered.filter(r => (r.location || '').toLowerCase().includes('shed'));

                            const renderCompactionTable = (recordsSubset, title, groupColor) => (
                                <div style={{ marginBottom: '2.5rem' }}>
                                    <div style={{ padding: '8px 16px', background: `${groupColor}10`, borderLeft: `4px solid ${groupColor}`, marginBottom: '12px' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.85rem', color: groupColor, fontWeight: '800' }}>{title} ({recordsSubset.length})</h4>
                                    </div>
                                    <div className="table-outer-wrapper" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div className="table-responsive">
                                            <table className="ui-table">
                                                <thead><tr><th>Location</th><th>Shift</th><th>Source</th><th>Date</th><th>Time</th><th>Batch</th><th>Bench</th><th>Type</th><th>RPM Range</th><th>Dur Range</th><th>Actions</th></tr></thead>
                                                <tbody>
                                                    {recordsSubset.map(e => (
                                                        <tr key={e.id}>
                                                            <td style={{ fontSize: '11px', color: '#64748b' }}>{e.location || 'N/A'}</td>
                                                            <td style={{ fontSize: '11px' }}>{e.shift || '—'}</td>
                                                            <td><span className={`status-pill ${e.source === 'Manual' ? 'manual' : 'witnessed'}`}>{e.source}</span></td>
                                                            <td>{e.date && e.date.includes('-') ? e.date.split('-').reverse().join('/') : (e.date || '—')}</td>
                                                            <td>{e.time}</td><td>{e.batchNo}</td><td><strong>{e.benchNo}</strong></td><td>{e.sleeperType || '—'}</td><td>{e.minRpm}-{e.maxRpm}</td><td>{e.duration}s</td>
                                                            <td>
                                                                <button 
                                                                    className="btn-action mini danger" 
                                                                    onClick={() => handleDeleteLog(e.parentId)}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            );

                            return (
                                <>
                                    {lineRecords.length > 0 && renderCompactionTable(lineRecords, "LONG LINE COMPACTION", "#3b82f6")}
                                    {shedRecords.length > 0 && renderCompactionTable(shedRecords, "SHED COMPACTION", "#8b5cf6")}
                                    {filtered.length === 0 && (
                                        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontStyle: 'italic' }}>
                                            No records found for the selected criteria.
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}

                {viewMode === 'scada' && (
                    <div className="view-scada fade-in">
                        <div className="content-title-row">
                            <h3>Raw SCADA Vibrator Feed</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Batch:</label>
                                <select className="dash-select" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                                    <option value="">-- All --</option>
                                    {availableBatchesForLogs.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="table-outer-wrapper">
                            <div className="table-responsive">
                                <table className="ui-table scada-detailed-table">
                                    <thead>
                                        <tr>
                                            <th rowSpan="2">Time</th>
                                            <th rowSpan="2">Batch</th>
                                            <th rowSpan="2">Bench</th>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                <th key={i} colSpan="2">VIBRATOR {i}</th>
                                            ))}
                                            <th rowSpan="2">Action</th>
                                        </tr>
                                        <tr>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                <React.Fragment key={i}>
                                                    <th>RPM</th>
                                                    <th>Dur</th>
                                                </React.Fragment>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {scadaRecords
                                            .filter(r => !selectedBatch || String(r.batchNo) === String(selectedBatch))
                                            .map(r => (
                                                <tr key={r.id}>
                                                    <td>{r.time}</td>
                                                    <td>{r.batchNo}</td>
                                                    <td><strong>{r.benchNo}</strong></td>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                        <React.Fragment key={i}>
                                                            <td>{r[`v${i}_rpm`]}</td>
                                                            <td style={{ color: '#64748b' }}>{r[`v${i}_dur`]}s</td>
                                                        </React.Fragment>
                                                    ))}
                                                    <td><button className="btn-action" onClick={() => handleWitness(r)}>Witness</button></td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    if (displayMode === 'inline') return renderContent();

    return (
        <div className="modal-overlay" onClick={onBack}>
            <div className="modal-content large-modal" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <div className="header-titles">
                        <h2>Compaction & Vibration Console</h2>
                        <p className="header-subtitle">Performance Monitoring & Assurance</p>
                    </div>
                    <div className="header-actions">
                        <button className="toggle-btn mini" onClick={() => {
                            setSessionRecords([]);
                            setShowForm(true);
                        }}>+ Add New Entry</button>
                        <button className="close-btn" onClick={onBack}>✕</button>
                    </div>
                </header>

                <nav className="modal-sub-nav">
                    <div className="nav-links">
                        {tabs.map(tab => (
                            <div
                                key={tab.id}
                                className={`nav-link ${viewMode === tab.id ? 'active' : ''}`}
                                onClick={() => setViewMode(tab.id)}
                            >
                                {tab.label}
                            </div>
                        ))}
                    </div>
                </nav>

                <div className="modal-body-wrapper">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default CompactionConcrete;
