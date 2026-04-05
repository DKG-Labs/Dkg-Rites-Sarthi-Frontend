import React, { useState, useMemo } from 'react';
import { apiService } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import './CriticalDimensionForm.css';

const CriticalDimensionForm = ({ batch, onSave, onCancel, shift }) => {
    const toast = useToast();
    // List of all sleepers in the batch
    const allSleepersPool = useMemo(() => {
        return (batch?.sleepers || [])
            .map(s => {
                const isAlreadyRejected = s.status?.toUpperCase() === 'REJECTED';
                return {
                    ...s,
                    id: s.sleeperId,
                    displayNo: s.sleeperNo,
                    isRejected: isAlreadyRejected,
                    isAlreadyPassed: s.status?.toUpperCase() === 'OK' || s.status?.toUpperCase() === 'PASSED'
                };
            });
    }, [batch]);

    const [selectedSleepers, setSelectedSleepers] = useState(() => 
        // Initial select: both OK and REJECTED ones.
        allSleepersPool.filter(s => s.isAlreadyPassed || s.isRejected).map(s => s.id)
    );

    const [displaySleepers, setDisplaySleepers] = useState(() => {
        return allSleepersPool.map(s => ({
            ...s,
            currentStatus: s.isRejected ? 'rejected' : (s.isAlreadyPassed ? 'passed' : 'pending')
        }));
    });

    React.useEffect(() => {
        setDisplaySleepers(allSleepersPool.map(s => ({
            ...s,
            currentStatus: s.isRejected ? 'rejected' : (s.isAlreadyPassed ? 'passed' : 'pending')
        })));
    }, [allSleepersPool]);

    const [saving, setSaving] = useState(false);

    const toggleSleeperSelection = async (id) => {
        const sleeper = allSleepersPool.find(s => s.id === id);
        const isCurrentlySelected = selectedSleepers.includes(id);

        if (isCurrentlySelected) {
            // DESELECTING: If it's already inspected (status passed/rejected), 
            // check if it belongs to this specific module (2 for Critical)
            if (sleeper.isAlreadyPassed || sleeper.isRejected) {
                if (sleeper.moduleId !== 2) {
                    const moduleMap = { 1: 'Visual and Check Measurements', 3: 'Non-Critical Dimensions', 4: 'Demoulding' };
                    toast.error(`Cannot deselect: This sleeper was inspected in ${moduleMap[sleeper.moduleId] || 'another module'}. You can only deselect Critical Dimensions here.`);
                    return;
                }

                const confirmReset = window.confirm(`Deselecting will reset Sleeper ${sleeper.displayNo} to PENDING. Continue?`);
                if (!confirmReset) return;

                try {
                    setSaving(true);
                    const payload = {
                        batchId: batch.batchId,
                        moduleId: 2,
                        sleeperType: batch.sleeperType,
                        shift: shift || 'General',
                        createdBy: parseInt(localStorage.getItem('userId') || '118', 10),
                        sleepers: [{
                            sleeperId: id,
                            sleeperNo: sleeper.displayNo,
                            result: 'PENDING',
                            rejectionReason: '',
                            parameters: []
                        }]
                    };
                    await apiService.updateInspectionSleepers(payload);
                    
                    // Reset selection locally (re-calling onSave to refresh from API is also an option)
                    setSelectedSleepers(prev => prev.filter(sid => sid !== id));
                    setDisplaySleepers(prev => prev.map(s => s.id === id ? { ...s, currentStatus: 'pending' } : s));
                    // Note: In this component, we rely on the parent (onSave/refresh) to truly clear status 
                    // or we'd need to convert allSleepersPool into state. 
                    // Let's force a refresh by alerting user and closing? 
                    // Better: The User will see it moved out of selection, and next time we open the form, it's pending.
                    toast.success(`Sleeper ${sleeper.displayNo} reset successfully.`);
                } catch (error) {
                    toast.error('Failed to reset sleeper status: ' + error.message);
                } finally {
                    setSaving(false);
                }
            } else {
                setSelectedSleepers(prev => prev.filter(sid => sid !== id));
                setDisplaySleepers(prev => prev.map(s => s.id === id ? { ...s, currentStatus: 'pending' } : s));
            }
        } else {
            setSelectedSleepers(prev => [...prev, id]);
        }
    };

    const parametersToCheck = [
        { id: 7, label: 'ToeGap' },
        { id: 10, label: 'Location of Inserts' },
        { id: 8, label: 'Dist b/w Inserts (Rail Seat)' },
        { id: 11, label: 'Dist b/w Outer Most Inserts' },
        { id: 9, label: 'Slope Gauge' }
    ];

    const [checklistState, setChecklistState] = useState(
        parametersToCheck.reduce((acc, p) => ({ 
            ...acc, 
            [p.label]: allSleepersPool.some(s => s.isAlreadyPassed) // Pre-check if any passed
        }), {})
    );

    const [overallResult, setOverallResult] = useState('ok');
    const [rejectionDetails, setRejectionDetails] = useState({});

    const isChecklistComplete = parametersToCheck.every(p => checklistState[p.label]);

    const handleChecklistChange = (param) => {
        setChecklistState(prev => ({ ...prev, [param]: !prev[param] }));
    };

    const handleResultChange = (result) => {
        if (!isChecklistComplete) return;
        setOverallResult(result);
        
        let newRejectionDetails = { ...rejectionDetails };
        if (result === 'ok') {
            newRejectionDetails = {};
            setRejectionDetails({});
        } else if (result === 'all-rejected') {
            const allRejected = {};
            selectedSleepers.forEach(id => {
                const sleeper = allSleepersPool.find(s => s.id === id);
                // Only include in rejection list if not already rejected in another module
                if (sleeper && (!sleeper.isRejected || sleeper.moduleId === 2)) {
                    allRejected[id] = rejectionDetails[id] || { mainReason: '', subReason: '' };
                }
            });
            newRejectionDetails = allRejected;
            setRejectionDetails(allRejected);
        }

        setDisplaySleepers(prev => prev.map(sleeper => {
            if (sleeper.isRejected) return { ...sleeper, currentStatus: 'rejected' };
            if (!selectedSleepers.includes(sleeper.id)) return sleeper;

            if (result === 'all-rejected') return { ...sleeper, currentStatus: 'rejected', moduleId: 2 };
            if (result === 'ok') return { ...sleeper, currentStatus: 'passed' };
            
            if (result === 'partial-ok') {
                 if (newRejectionDetails[sleeper.id]) return { ...sleeper, currentStatus: 'rejected', moduleId: 2 };
                 return { ...sleeper, currentStatus: 'passed' };
            }
            return sleeper;
        }));
    };

    const handleRejectionChange = (sleeperId, field, value) => {
        setRejectionDetails(prev => ({
            ...prev,
            [sleeperId]: {
                ...prev[sleeperId],
                [field]: value
            }
        }));
    };

    const toggleRejection = (sleeperId) => {
        setRejectionDetails(prev => {
            const newState = { ...prev };
            let isNowRejected = false;
            if (newState[sleeperId]) {
                delete newState[sleeperId];
            } else {
                newState[sleeperId] = { mainReason: '', subReason: '' };
                isNowRejected = true;
            }

            setDisplaySleepers(disp => disp.map(s => {
                if (s.id === sleeperId) {
                   return { ...s, currentStatus: isNowRejected ? 'rejected' : 'passed', moduleId: isNowRejected ? 2 : s.moduleId };
                }
                return s;
            }));

            return newState;
        });
    };

    const getSubReasons = (mainReason) => {
        switch (mainReason) {
            case 'ToeGap': return ['ToeGap(LT) - Inner', 'ToeGap (LT) - Outer', 'ToeGap (RT)-Inner', 'ToeGap (RT) - Outer'];
            case 'Slope Gauge': return ['Slope Gauge (LT)', 'Slope Gauge (RT)'];
            case 'Dist b/w Inserts (Rail Seat)': return ['Dist b/w Inserts (LT)', 'Dist b/w Inserts (RT)'];
            case 'Location of Inserts': return ['Position Error (LT)', 'Position Error (RT)', 'Skewed / Tilted Insert'];
            case 'Dist b/w Outer Most Inserts': return ['Distance Error (LT)', 'Distance Error (RT)', 'Total Outer-to-Outer Error'];
            default: return [];
        }
    };

    const targetPercentage = useMemo(() => {
        const spec = batch?.designSpec || 'T-39';
        return spec === 'T-39' ? '10%' : '20%';
    }, [batch]);

    const handleSave = async () => {
        if (selectedSleepers.length === 0) {
            toast.error('Please select at least one sleeper for testing.');
            return;
        }

        if (overallResult === 'all-rejected' || overallResult === 'partial-ok') {
            const hasMissingReason = Object.keys(rejectionDetails).some(sid => {
                const sDetails = rejectionDetails[sid];
                if (!sDetails.mainReason) return true;
                const availableSubReasons = getSubReasons(sDetails.mainReason);
                if (availableSubReasons.length > 0 && !sDetails.subReason) return true;
                return false;
            });
            
            if (hasMissingReason) {
                toast.error('Please select both Main Reason and Sub Reason for all rejected sleepers.');
                return;
            }
        }

        try {
            setSaving(true);
            const payload = {
                batchId: batch.batchId,
                moduleId: 2,
                sleeperType: batch.sleeperType,
                shift: shift || 'General',
                createdBy: parseInt(localStorage.getItem('userId') || '118', 10),
                sleepers: selectedSleepers
                    .filter(sid => {
                        const s = allSleepersPool.find(x => x.id === sid);
                        return s && (!s.moduleId || s.moduleId === 2);
                    })
                    .map(sid => {
                    const sleeper = allSleepersPool.find(s => s.id === sid);
                    
                    // A sleeper is rejected if it's currently marked as rejected in the form UI,
                    // OR if it was already rejected and has not been explicitly reset to Pending.
                    let isRejected = !!rejectionDetails[sid] || (sleeper.isRejected);
                    let rejectionMsg = isRejected ? (rejectionDetails[sid]?.mainReason ? `${rejectionDetails[sid].mainReason}: ${rejectionDetails[sid].subReason}` : (sleeper.rejectionReason || 'Previously Rejected')) : '';

                    const sleeperParams = parametersToCheck.map(p => ({
                        parameterId: p.id,
                        result: isRejected && (rejectionDetails[sid]?.mainReason === p.label) ? 'REJECTED' : 'OK'
                    }));

                    return {
                        sleeperId: sid,
                        sleeperNo: sleeper.displayNo,
                        result: isRejected ? 'REJECTED' : 'OK',
                        rejectionReason: rejectionMsg,
                        parameters: sleeperParams
                    };
                })
            };

            await apiService.saveFinalInspection(payload);
            toast.success('Critical Dimension results saved successfully.');
            onSave();
        } catch (error) {
            console.error('Save failed:', error);
            toast.error('Failed to save inspection results');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="critical-dimension-form">
            <header className="critical-form-header">
                <h2>Critical Dimensions - Full Inspection Form</h2>
                <button onClick={onCancel} className="close-btn" disabled={saving}>✕</button>
            </header>

            <div className="critical-form-body">
                <section className="critical-section">
                    <h4 className="section-label">1. Initial Declaration</h4>
                    <div className="declaration-grid">
                        <div className="declaration-item"><span className="item-label">BATCH NUMBER</span><span className="item-value">{batch.batchNumber}</span></div>
                        <div className="declaration-item"><span className="item-label">SLEEPER TYPE</span><span className="item-value">{batch.sleeperType || 'N/A'}</span></div>
                        <div className="declaration-item"><span className="item-label">TOTAL IN BATCH</span><span className="item-value">{batch.totalSleepers ?? batch.noOfSleepers ?? batch.totalBatchQty ?? '—'}</span></div>
                        <div className="declaration-item"><span className="item-label">TARGET REQ.</span><span className="item-value">{targetPercentage}</span></div>
                    </div>
                </section>

                {/* 2. Sleeper Pool (Grouped Divisions) */}
                <section className="critical-section">
                    <h4 className="section-label">2. Sleeper Pool & Verification Status</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', minHeight: '150px' }}>
                        
                        {/* Column 1: Rejected Sleepers (Grouped by Module) */}
                        <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c', fontWeight: '700', fontSize: '11px', marginBottom: '15px', borderBottom: '1px solid #fecaca', paddingBottom: '4px' }}>
                                <span>REJECTED SLEEPERS</span>
                                <span>{displaySleepers.filter(s => s.currentStatus === 'rejected').length}</span>
                            </div>

                            {[
                                { id: 1, label: 'Visual and Check Measurements' },
                                { id: 2, label: 'Critical Dimensions' },
                                { id: 3, label: 'Non-Critical Dimensions' },
                                { id: 4, label: 'Demoulding' }
                            ].map(group => {
                                const groupSleepers = displaySleepers.filter(s => s.currentStatus === 'rejected' && s.moduleId === group.id);
                                if (groupSleepers.length === 0) return null;
                                return (
                                    <div key={group.id} style={{ marginBottom: '12px' }}>
                                        <div style={{ fontSize: '9px', fontWeight: '800', color: '#ef4444', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                                            {group.label} ({groupSleepers.length})
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {groupSleepers.map(s => {
                                                const isSelected = selectedSleepers.includes(s.id);
                                                return (
                                                    <div
                                                        key={s.id}
                                                        onClick={() => !saving && toggleSleeperSelection(s.id)}
                                                        style={{
                                                            padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer',
                                                            background: isSelected ? '#ef4444' : '#fff',
                                                            color: isSelected ? '#fff' : '#b91c1c',
                                                            border: `1px solid ${isSelected ? 'transparent' : '#fca5a5'}`,
                                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                        }}
                                                    >
                                                        {s.displayNo}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                            {displaySleepers.filter(s => s.currentStatus === 'rejected').length === 0 && <div style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>No rejections found</div>}
                        </div>

                        {/* Column 2: Verified Sleepers */}
                        <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', fontWeight: '700', fontSize: '11px', marginBottom: '10px' }}>
                                <span>VERIFIED / PASSED</span>
                                <span>{displaySleepers.filter(s => s.currentStatus === 'passed').length}</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {displaySleepers.filter(s => s.currentStatus === 'passed').map(s => {
                                    const isSelected = selectedSleepers.includes(s.id);
                                    return (
                                        <div
                                            key={s.id}
                                            onClick={() => !saving && toggleSleeperSelection(s.id)}
                                            style={{
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer',
                                                background: isSelected ? '#15803d' : '#fff',
                                                color: isSelected ? '#fff' : '#15803d',
                                                border: `1px solid ${isSelected ? 'transparent' : '#86efac'}`,
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            {s.displayNo}
                                        </div>
                                    );
                                })}
                                {displaySleepers.filter(s => s.currentStatus === 'passed').length === 0 && <div style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>None</div>}
                            </div>
                        </div>

                        {/* Column 3: Pending Sleepers */}
                        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontWeight: '700', fontSize: '11px', marginBottom: '10px' }}>
                                <span>PENDING INSPECTION</span>
                                <span>{displaySleepers.filter(s => s.currentStatus === 'pending').length}</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {displaySleepers.filter(s => s.currentStatus === 'pending').map(s => {
                                    const isSelected = selectedSleepers.includes(s.id);
                                    return (
                                        <div
                                            key={s.id}
                                            onClick={() => !saving && toggleSleeperSelection(s.id)}
                                            style={{
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer',
                                                background: isSelected ? '#42818c' : '#fff',
                                                color: isSelected ? '#fff' : '#475569',
                                                border: `1px solid ${isSelected ? 'transparent' : '#cbd5e1'}`,
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            {s.displayNo}
                                        </div>
                                    );
                                })}
                                {displaySleepers.filter(s => s.currentStatus === 'pending').length === 0 && <div style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>None</div>}
                            </div>
                        </div>

                    </div>
                    <div style={{ marginTop: '12px', fontSize: '11px', color: '#64748b', display: 'flex', gap: '15px' }}>
                        <span>• Click a sleeper to select/deselect for your current session.</span>
                        <span style={{ color: '#42818c', fontWeight: '700' }}>Selected: {selectedSleepers.length}</span>
                    </div>
                </section>

                <section className="critical-section-white">
                    <h4 className="section-label">3. Critical Parameters to be Checked</h4>
                    <div className="parameters-checklist-grid">
                        {parametersToCheck.map(p => (
                            <label key={p.id} className={`parameter-checkbox-card ${checklistState[p.label] ? 'checked' : ''}`} style={{ borderColor: checklistState[p.label] ? '#10b981' : '#e2e8f0' }}>
                                <input
                                    type="checkbox"
                                    checked={checklistState[p.label]}
                                    onChange={() => !saving && handleChecklistChange(p.label)}
                                    disabled={saving}
                                />
                                <span className="param-label">{p.label}</span>
                            </label>
                        ))}
                    </div>
                </section>

                <section className={`critical-section-white ${!isChecklistComplete ? 'locked' : ''}`}>
                    <h4 className="section-label">4. Result of Checking</h4>
                    <div className="result-options-row">
                        {[
                            { id: 'ok', label: 'All OK', color: '#10b981' },
                            { id: 'partial-ok', label: 'Partially OK', color: '#f59e0b' },
                            { id: 'all-rejected', label: 'All Rejected', color: '#ef4444' }
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => handleResultChange(opt.id)}
                                disabled={!isChecklistComplete || saving}
                                className="result-btn"
                                style={{
                                    background: overallResult === opt.id ? opt.color : '#f1f5f9',
                                    color: overallResult === opt.id ? '#fff' : '#64748b',
                                    opacity: (!isChecklistComplete || saving) ? 0.5 : 1
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {(overallResult === 'partial-ok' || overallResult === 'all-rejected') && (
                        <div className="rejection-table-section fade-in">
                            <h5 className="rejection-title">
                                Details of Rejected Sleepers
                                {overallResult === 'partial-ok' && <span className="rejection-subtitle"> (Select sleepers to mark as rejected)</span>}
                            </h5>

                            {overallResult === 'partial-ok' && (
                                <div className="rejection-sleepers-row">
                                    {selectedSleepers.filter(sid => {
                                        const s = allSleepersPool.find(x => x.id === sid);
                                        return s && !s.isAlreadyPassed && !s.isRejected;
                                    }).map(sid => {
                                        const isRejected = !!rejectionDetails[sid];
                                        return (
                                            <button
                                                key={sid}
                                                onClick={() => !saving && toggleRejection(sid)}
                                                disabled={saving}
                                                className={`rejection-chip ${isRejected ? 'rejected' : ''}`}
                                                style={{
                                                    borderColor: isRejected ? '#ef4444' : '#cbd5e1',
                                                    background: isRejected ? '#fecaca' : '#fff',
                                                    color: isRejected ? '#991b1b' : '#64748b'
                                                }}
                                            >
                                                {allSleepersPool.find(s => s.id === sid)?.displayNo}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="table-wrapper">
                                <table className="ui-table">
                                    <thead>
                                        <tr>
                                            <th>Sleeper No</th>
                                            <th>Main Reason</th>
                                            <th>Sub Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(rejectionDetails).map(sid => (
                                            <tr key={sid}>
                                                <td data-label="Sleeper No" className="fw-700">{allSleepersPool.find(s => String(s.id) === String(sid))?.displayNo}</td>
                                                <td data-label="Main Reason">
                                                    <select
                                                        value={rejectionDetails[sid].mainReason}
                                                        onChange={(e) => handleRejectionChange(sid, 'mainReason', e.target.value)}
                                                        className="ui-select"
                                                        disabled={saving}
                                                    >
                                                        <option value="">-- Select --</option>
                                                        {parametersToCheck.map(p => <option key={p.id} value={p.label}>{p.label}</option>)}
                                                    </select>
                                                </td>
                                                <td data-label="Sub Reason">
                                                    <select
                                                        value={rejectionDetails[sid].subReason}
                                                        onChange={(e) => handleRejectionChange(sid, 'subReason', e.target.value)}
                                                        disabled={!rejectionDetails[sid].mainReason || saving}
                                                        className="ui-select"
                                                    >
                                                        <option value="">-- Select --</option>
                                                        {getSubReasons(rejectionDetails[sid].mainReason).map(sub => (
                                                            <option key={sub} value={sub}>{sub}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            <footer className="critical-form-footer">
                <button
                    onClick={handleSave}
                    disabled={selectedSleepers.length === 0 || saving}
                    className="footer-btn footer-btn-primary"
                    style={{ opacity: (selectedSleepers.length === 0 || saving) ? 0.7 : 1 }}
                >
                    {saving ? 'Saving...' : 'Save Critical Inspection'}
                </button>
                <button onClick={onCancel} className="footer-btn footer-btn-secondary" disabled={saving}>Cancel</button>
            </footer>
        </div>
    );
};

export default CriticalDimensionForm;
