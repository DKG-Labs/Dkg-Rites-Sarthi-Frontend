import React, { useState, useMemo } from 'react';
import { apiService } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import './CriticalDimensionForm.css'; // Reusing styles if applicable or ensuring consistency

const VisualInspectionForm = ({ batch, onSave, onCancel, shift }) => {
    const toast = useToast();
    // Sleeper data from batch details (handle production declaration gangs/chambers if sleepers array is missing)
    const initialSleepers = useMemo(() => {
        let rawList = batch?.sleepers || batch?.sleeperCheckDto || [];

        // FALLBACK: If sleepers array is empty, reconstruct from gangs/chambers (Production Declaration structure)
        if (rawList.length === 0) {
            const reconstructed = [];
            const seenSleeperIds = new Set();

            // Long Line / Gangs
            if (batch?.gangs && Array.isArray(batch.gangs)) {
                batch.gangs.forEach(gang => {
                    gang.sleepers?.forEach(s => {
                        if (s && !seenSleeperIds.has(s)) {
                            seenSleeperIds.add(s);
                            reconstructed.push({
                                sleeperId: s,
                                sleeperNo: s,
                                status: 'pending',
                                benchNo: String(gang.gangNo || '')
                            });
                        }
                    });
                });
            }

            // Stress Bench / Chambers
            if (batch?.chambers && Array.isArray(batch.chambers)) {
                batch.chambers.forEach(chamber => {
                    chamber.benchGroups?.forEach(group => {
                        group.sleepers?.forEach(s => {
                            if (s && !seenSleeperIds.has(s)) {
                                seenSleeperIds.add(s);
                                reconstructed.push({
                                    sleeperId: s,
                                    sleeperNo: s,
                                    status: 'pending',
                                    benchNo: String(group.benchNo || '')
                                });
                            }
                        });
                    });
                });
            }
            rawList = reconstructed;
        }

        const mapped = rawList.map(s => {
            const statusUpper = s.status?.toUpperCase() || 'PENDING';
            return {
                ...s,
                id: s.sleeperId || s.sleeperNo,
                displayNo: s.sleeperNo || s.sleeperId,
                status: statusUpper === 'REJECTED' ? 'rejected' : 
                        (statusUpper === 'OK' || statusUpper === 'PASSED' ? 'passed' : 'pending')
            };
        });

        // Deduplicate by sleeperNo to handle cases where production_sleeper table
        // has duplicate rows (e.g., double-submit on production declaration).
        // Note: duplicate rows have DIFFERENT sleeperId (DB ids) but same sleeperNo.
        const seen = new Set();
        return mapped.filter(s => {
            const key = s.displayNo || s.id;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [batch]);

    const [sleepers, setSleepers] = useState(initialSleepers);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSleepers, setSelectedSleepers] = useState(() => 
        // Select both passed AND rejected sleepers for re-inspection by default
        initialSleepers.filter(s => s.status === 'passed' || s.status === 'rejected').map(s => s.id)
    );
    const [saving, setSaving] = useState(false);

    const filteredSleepers = useMemo(() => {
        if (!searchTerm) return sleepers;
        const lowTerm = searchTerm.toLowerCase();
        return sleepers.filter(s => s.displayNo?.toString().toLowerCase().includes(lowTerm));
    }, [sleepers, searchTerm]);

    const renderSleeperList = (list, type) => {
        const typeLower = batch?.sleeperType?.toLowerCase() || '';
        const isSingleBenchType = ['pnc', 'turnout', 'dc', 'scc', 'curved', 'dcs', 'ds'].some(kw => typeLower.includes(kw));
        const defaultBenchName = batch?.benchNo || batch?.gangs?.[0]?.gangNo || batch?.chambers?.[0]?.benchNo || '1';

        const groups = {};
        list.forEach(s => {
            let b;
            if (isSingleBenchType) {
                b = defaultBenchName;
            } else {
                const derivedBench = s.displayNo ? String(s.displayNo).match(/^\d+/)?.[0] : null;
                b = s.benchNo || derivedBench || 'Batch Items';
            }
            if (!groups[b]) groups[b] = [];
            groups[b].push(s);
        });

        const sortedBenches = Object.keys(groups).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        if (list.length === 0) return <div style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', padding: '10px' }}>No sleepers found</div>;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {sortedBenches.map(bench => (
                    <div key={bench}>
                        <div style={{ fontSize: '9px', fontWeight: '800', color: type === 'rejected' ? '#ef4444' : type === 'passed' ? '#15803d' : '#64748b', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid currentColor', paddingBottom: '2px', opacity: 0.7 }}>
                            Bench: {bench} ({groups[bench].length})
                        </div>
                        <div 
                            className="custom-scrollbar"
                            style={{ 
                                display: 'flex', 
                                flexWrap: 'wrap', 
                                gap: '6px', 
                                paddingBottom: '8px'
                            }}
                        >
                            {groups[bench]
                                .sort((a, b) => {
                                    const valA = (a.displayNo || '').toString();
                                    const valB = (b.displayNo || '').toString();
                                    const isNumA = /^\d+$/.test(valA);
                                    const isNumB = /^\d+$/.test(valB);
                                    
                                    if (!isNumA && isNumB) return -1;
                                    if (isNumA && !isNumB) return 1;
                                    
                                    return valA.localeCompare(valB, undefined, { numeric: true });
                                })
                                .map(s => {
                                    const isSelected = selectedSleepers.includes(s.id);
                                    let bg = '#fff';
                                    let fg = type === 'rejected' ? '#b91c1c' : type === 'passed' ? '#15803d' : '#475569';
                                    let border = type === 'rejected' ? '#fca5a5' : type === 'passed' ? '#86efac' : '#cbd5e1';

                                    if (isSelected) {
                                        bg = type === 'rejected' ? '#ef4444' : type === 'passed' ? '#22c55e' : '#42818c';
                                        fg = '#fff';
                                        border = 'transparent';
                                    }

                                    return (
                                        <div
                                            key={s.id}
                                            onClick={() => !saving && toggleSleeperSelection(s.id)}
                                            style={{
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer',
                                                background: bg, color: fg, border: `1px solid ${border}`,
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                minWidth: '32px', textAlign: 'center',
                                                flexShrink: 0
                                            }}
                                        >
                                            {s.displayNo}
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const toggleSleeperSelection = async (id) => {
        const sleeper = sleepers.find(s => s.id === id);
        const isCurrentlySelected = selectedSleepers.includes(id);

        if (isCurrentlySelected) {
            // DESELECTING: If it's already inspected (status passed/rejected), 
            // check if it belongs to this specific module (1 for Visual)
            if (sleeper.status !== 'pending') {
                if (sleeper.moduleId !== 1) {
                    const moduleMap = { 2: 'Critical Dimensions', 3: 'Non-Critical Dimensions', 4: 'Demoulding' };
                    alert(`Cannot deselect: This sleeper was inspected in ${moduleMap[sleeper.moduleId] || 'another module'}. You can only deselect Visual and Check Measurements sleepers here.`);
                    return;
                }

                const confirmReset = window.confirm(`Deselecting will reset Sleeper ${sleeper.displayNo} to PENDING. Continue?`);
                if (!confirmReset) return;

                try {
                    setSaving(true);
                    const payload = {
                        batchId: batch.batchId,
                        moduleId: 1,
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
                    
                    setSleepers(prev => prev.map(s => s.id === id ? { ...s, status: 'pending', moduleId: null } : s));
                    setSelectedSleepers(prev => prev.filter(sid => sid !== id));
                } catch (error) {
                    toast.error('Failed to reset sleeper status: ' + error.message);
                } finally {
                    setSaving(false);
                }
            } else {
                // If it's just a newly selected pending sleeper, hide it from current selection
                setSelectedSleepers(prev => prev.filter(sid => sid !== id));
            }
        } else {
            // Selecting: Just add to current selection state
            setSelectedSleepers(prev => [...prev, id]);
        }
    };

    const filteredPendingSleepers = useMemo(() => filteredSleepers.filter(s => s.status === 'pending'), [filteredSleepers]);
    const allPendingSelected = useMemo(() => {
        if (filteredPendingSleepers.length === 0) return false;
        return filteredPendingSleepers.every(s => selectedSleepers.includes(s.id));
    }, [filteredPendingSleepers, selectedSleepers]);

    const handleSelectAllPending = (e) => {
        const checked = e.target.checked;
        if (checked) {
            const idsToAdd = filteredPendingSleepers.map(s => s.id);
            setSelectedSleepers(prev => [...new Set([...prev, ...idsToAdd])]);
        } else {
            const idsToRemove = filteredPendingSleepers.map(s => s.id);
            setSelectedSleepers(prev => prev.filter(id => !idsToRemove.includes(id)));
        }
    };

    const sections = [
        { id: 'visual', label: 'Visual Checking', section: 'Section 1' },
        { id: 'dimension', label: 'Dimension Checking', section: 'Section 2' },
        { id: 'ftc', label: 'FTC', section: 'Section 3' },
    ];

    const [sectionStates, setSectionStates] = useState(() => {
        return sections.reduce((acc, s) => ({
            ...acc,
            [s.id]: {
                allChecked: initialSleepers.some(sl => sl.status === 'passed' || sl.status === 'rejected'),
                result: 'all-ok',
                failedSleepers: [],
                rejectionDetails: {},
                globalReason: '',
                globalSubReason: ''
            }
        }), {});
    });

    const handleSectionChange = (sectionId, field, value) => {
        setSectionStates(prev => {
            const newState = {
                ...prev,
                [sectionId]: {
                    ...prev[sectionId],
                    [field]: value
                }
            };

            // If switching to all-rejected, automatically fail all selected sleepers
            if (field === 'result' && value === 'all-rejected') {
                newState[sectionId].failedSleepers = selectedSleepers.filter(id => {
                    const sl = sleepers.find(item => item.id === id);
                    // Only include in failure list if not already rejected in another module
                    return sl && (sl.status !== 'rejected' || sl.moduleId === 1);
                });
            } else if (field === 'result' && value === 'all-ok') {
                newState[sectionId].failedSleepers = [];
            }

            return newState;
        });

        // Update sleeper statuses based on all sections
        if (field !== 'globalReason' && field !== 'globalSubReason' && field !== 'rejectionDetails') {
            updateSleeperStatuses(sectionId, field, value);
        }
    };

    const handleSleeperRejectionUpdate = (sectionId, sleeperId, field, value) => {
        setSectionStates(prev => ({
            ...prev,
            [sectionId]: {
                ...prev[sectionId],
                rejectionDetails: {
                    ...prev[sectionId].rejectionDetails,
                    [sleeperId]: {
                        ...(prev[sectionId].rejectionDetails[sleeperId] || { reason: '', subReason: '' }),
                        [field]: value
                    }
                }
            }
        }));
    };

    const updateSleeperStatuses = (changedSectionId, field, value) => {
        setSleepers(prevSleepers => {
            return prevSleepers.map(sleeper => {
                let isRejected = false;
                let isAllChecked = true;

                sections.forEach(s => {
                    const state = s.id === changedSectionId ? { ...sectionStates[s.id], [field]: value } : sectionStates[s.id];

                    if (!state.allChecked) isAllChecked = false;

                    if (state.result === 'all-rejected') {
                        isRejected = true;
                    } else if (state.result === 'partial-ok' && state.failedSleepers.includes(sleeper.id)) {
                        isRejected = true;
                    }
                });

                if (isRejected) return { ...sleeper, status: 'rejected' };
                
                // ROBUST UI RULE: If a sleeper was already rejected (in any module), 
                // it must stay visually rejected. It can only be cleared by explicitly 
                // resetting it to Pending via the confirmation toggle.
                const originalSleeper = initialSleepers.find(s => s.id === sleeper.id);
                if (originalSleeper?.status === 'rejected') {
                    return { ...sleeper, status: 'rejected' };
                }

                // FIX: Only sleepers currently selected for verification can move to 'passed'
                if (selectedSleepers.includes(sleeper.id)) {
                    return { ...sleeper, status: 'passed' };
                }

                // If not selected and not rejected, it stays in its original state (usually 'pending')
                return { 
                    ...sleeper, 
                    status: originalSleeper?.status?.toLowerCase() === 'passed' ? 'passed' : 'pending' 
                };
            });
        });
    };

    const getStatusColor = (status, isSelected) => {
        if (!isSelected) return '#d1d5db'; // Greyed out if not selected
        switch (status) {
            case 'passed': return '#22c55e'; // Green
            case 'rejected': return '#ef4444'; // Red
            default: return '#f59e0b'; // Yellow (Pending)
        }
    };

    const getRejectionOptions = (sectionId) => {
        if (sectionId === 'visual') return [
            'Surface Defect',
            'Honeycomb',
            'Crack',
            'Insert Missing / Tilt / Sink',
            'Dowel Missing / Tilt / Sink'
        ];
        if (sectionId === 'dimension') return [
            'Outer Gauge'
        ];
        return null;
    };

    const getSubReasons = (sectionId, reason) => {
        if (!reason) return [];
        if (sectionId === 'visual') {
            switch (reason) {
                case 'Surface Defect': return ['Rail Seat Damage', 'End Damage', 'Surface damage'];
                case 'Honeycomb': return ['Rail Seat Honeycomb', 'End Honeycomb'];
                case 'Crack': return ['Horizontal Crack', 'Vertical Crack'];
                case 'Insert Missing / Tilt / Sink': return ['Insert Missing', 'Insert Tilt', 'Insert Sink'];
                case 'Dowel Missing / Tilt / Sink': return ['Dowel Missing', 'Dowel Tilt', 'Dowel Sink', 'Dowel Jam'];
                default: return ['Others'];
            }
        }
        if (sectionId === 'dimension') {
            switch (reason) {
                case 'Outer Gauge': return ['Outer Gauge (+)', 'Outer Gauge (-)'];
                case 'Depth': return ['Depth (+)', 'Depth (-)'];
                case 'Width': return ['Width (+)', 'Width (-)'];
                case 'Length of Sleeper': return ['Length (+)', 'Length (-)'];
                case 'Wind Gauge': return ['Wind Gauge (+)', 'Wind Gauge (-)'];
                case 'Camber Check': return ['Camber Check (+)', 'Camber Check (-)'];
                default: return ['+ve Deviation', '-ve Deviation'];
            }
        }
        return ['General Defect'];
    };

    const handleSave = async () => {
        if (selectedSleepers.length === 0) {
            toast.error('Please select at least one sleeper for testing.');
            return;
        }

        let hasMissingReason = false;
        sections.forEach(sect => {
            const sectState = sectionStates[sect.id];
            if (sectState.result === 'all-rejected' || sectState.result === 'partial-ok') {
                sectState.failedSleepers.forEach(fid => {
                     if (sect.id === 'ftc') return; // FTC defaults to NFTC payload, no validation needed
                     const details = sectState.rejectionDetails[fid] || {};
                     if (!details.reason) hasMissingReason = true;
                     else {
                         const subs = getSubReasons(sect.id, details.reason);
                         if (subs.length > 0 && !details.subReason) hasMissingReason = true;
                     }
                });
            }
        });

        if (hasMissingReason) {
            toast.error('Please provide a Reason and Sub-Reason for all rejected sleepers.');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                batchId: batch.batchId,
                moduleId: 1,
                sleeperType: batch.sleeperType,
                shift: shift || 'General',
                createdBy: parseInt(localStorage.getItem('userId') || '118', 10),
                sleepers: sleepers.filter(s => {
                    if (!selectedSleepers.includes(s.id)) return false;
                    if (s.moduleId && s.moduleId !== 1) return false;
                    
                    const currentIsRejected = sections.some(sect => {
                        const sectState = sectionStates[sect.id];
                        return sectState.result === 'all-rejected' || sectState.failedSleepers.includes(s.id);
                    });

                    // PREVENT OVERWRITING REJECTED SLEEPERS TO OK:
                    // If a sleeper was already rejected and has not been explicitly re-rejected in this session,
                    // we skip sending it. It will maintain its rejected state and reason in the database.
                    if (s.status === 'rejected' && !currentIsRejected) return false;
                    
                    return true;
                }).map(s => {
                    const currentIsRejected = sections.some(sect => {
                        const sectState = sectionStates[sect.id];
                        return sectState.result === 'all-rejected' || sectState.failedSleepers.includes(s.id);
                    });

                    const sleeperParams = sections.map((sect, idx) => {
                        const sectState = sectionStates[sect.id];
                        let paramResult = 'OK';
                        if (sectState.result === 'all-rejected') paramResult = 'REJECTED';
                        else if (sectState.result === 'partial-ok' && sectState.failedSleepers.includes(s.id)) paramResult = 'REJECTED';

                        return {
                            parameterId: idx + 1,
                            result: paramResult
                        };
                    });

                    let rejectionReason = '';
                    sections.forEach(sect => {
                        const sectState = sectionStates[sect.id];
                        if (sectState.failedSleepers.includes(s.id)) {
                            const details = sectState.rejectionDetails[s.id] || {};
                            let reason = details.reason || (sectState.result === 'all-rejected' ? sectState.globalReason : '');
                            let subReason = details.subReason || (sectState.result === 'all-rejected' ? sectState.globalSubReason : '');
                            
                            if (sect.id === 'ftc') {
                                reason = 'NFTC';
                                subReason = '';
                            }

                            if (reason) {
                                rejectionReason += `${sect.label}: ${reason}${subReason ? ' (' + subReason + ')' : ''}; `;
                            } else {
                                rejectionReason += `${sect.label}: Rejected; `;
                            }
                        }
                    });

                    return {
                        sleeperId: s.id,
                        sleeperNo: s.displayNo,
                        result: currentIsRejected ? 'REJECTED' : 'OK',
                        rejectionReason: rejectionReason.trim().replace(/;$/, ''),
                        parameters: sleeperParams
                    };
                })
            };

            await apiService.saveFinalInspection(payload);
            toast.success('Visual Inspection results saved successfully.');
            onSave();
        } catch (error) {
            console.error('Save failed:', error);
            toast.error('Failed to save inspection results');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="visual-inspection-form critical-dimension-form">
            <div className="critical-form-body">
                {/* 1. Initial Declaration */}
                <section className="critical-section">
                    <h4 className="section-label">1. Initial Declaration</h4>
                    <div className="declaration-grid">
                        <div className="declaration-item">
                            <span className="item-label">BATCH NUMBER</span>
                            <span className="item-value">{batch.batchNumber}</span>
                        </div>
                        <div className="declaration-item">
                            <span className="item-label">DATE OF CASTING</span>
                            <span className="item-value">{batch.castingDate || '-'}</span>
                        </div>
                        <div className="declaration-item">
                            <span className="item-label">SLEEPER TYPE</span>
                            <span className="item-value">{batch.sleeperType || 'N/A'}</span>
                        </div>
                        <div className="declaration-item">
                            <span className="item-label">TOTAL IN BATCH</span>
                            <span className="item-value">{batch.totalSleepers ?? batch.noOfSleepers ?? batch.totalBatchQty ?? '—'}</span>
                        </div>
                    </div>
                </section>

                {/* 2. Sleeper Pool (Grouped Divisions) */}
                <section className="critical-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 className="section-label" style={{ margin: 0 }}>2. Sleeper Pool & Verification Status</h4>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="text"
                                placeholder="Search Sleeper No..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    padding: '6px 12px 6px 30px',
                                    fontSize: '12px',
                                    borderRadius: '20px',
                                    border: '1px solid #cbd5e1',
                                    width: '200px',
                                    outline: 'none',
                                    background: '#fff'
                                }}
                            />
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8' }}>🔍</span>
                        </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        
                        {/* Column 1: Rejected Sleepers */}
                        <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fee2e2', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c', fontWeight: '700', fontSize: '11px', marginBottom: '15px', borderBottom: '1px solid #fecaca', paddingBottom: '4px' }}>
                                <span>REJECTED SLEEPERS</span>
                                <span>{sleepers.filter(s => s.status === 'rejected').length}</span>
                            </div>
                            <div style={{ height: '300px', overflowY: 'auto', paddingRight: '4px' }} className="custom-scrollbar">
                                {renderSleeperList(filteredSleepers.filter(s => s.status === 'rejected'), 'rejected')}
                            </div>
                        </div>

                        {/* Column 2: Verified Sleepers */}
                        <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #dcfce7', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', fontWeight: '700', fontSize: '11px', marginBottom: '15px', borderBottom: '1px solid #bbf7d0', paddingBottom: '4px' }}>
                                <span>VERIFIED / PASSED</span>
                                <span>{sleepers.filter(s => s.status === 'passed').length}</span>
                            </div>
                            <div style={{ height: '300px', overflowY: 'auto', paddingRight: '4px' }} className="custom-scrollbar">
                                {renderSleeperList(filteredSleepers.filter(s => s.status === 'passed'), 'passed')}
                            </div>
                        </div>

                        {/* Column 3: Pending Sleepers */}
                        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontWeight: '700', fontSize: '11px', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={allPendingSelected} 
                                        onChange={handleSelectAllPending}
                                        title="Select All Pending"
                                        style={{ cursor: 'pointer', width: '13px', height: '13px' }}
                                    />
                                    <span>PENDING INSPECTION</span>
                                </div>
                                <span>{sleepers.filter(s => s.status === 'pending').length}</span>
                            </div>
                            <div style={{ height: '300px', overflowY: 'auto', paddingRight: '4px' }} className="custom-scrollbar">
                                {renderSleeperList(filteredPendingSleepers, 'pending')}
                            </div>
                        </div>

                    </div>
                    <div style={{ marginTop: '12px', fontSize: '11px', color: '#64748b', display: 'flex', gap: '15px' }}>
                        <span>• Click a sleeper to select/deselect for your current session.</span>
                        <span style={{ color: '#42818c', fontWeight: '700' }}>Selected: {selectedSleepers.length}</span>
                    </div>
                </section>

                {/* 3. Inspection Sections */}
                <section className="critical-section-white">
                    <h4 className="section-label">3. Inspection Checkpoints</h4>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="ui-table" style={{ fontSize: '12px' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th style={{ width: '200px' }}>Data Field</th>
                                    <th style={{ width: '100px' }}>Source</th>
                                    <th>Inspection Results</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sections.map(s => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: '600', color: '#1e293b' }}>{s.label}</td>
                                        <td style={{ color: '#64748b' }}>{s.section}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={sectionStates[s.id].allChecked}
                                                            onChange={(e) => handleSectionChange(s.id, 'allChecked', e.target.checked)}
                                                            disabled={selectedSleepers.length === 0}
                                                        />
                                                        All Sleepers Checked
                                                    </label>

                                                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
                                                        {[
                                                            { id: 'all-ok', label: 'All OK' },
                                                            { id: 'partial-ok', label: 'Partially OK' },
                                                            { id: 'all-rejected', label: 'All Rejected' }
                                                        ].map(opt => (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => handleSectionChange(s.id, 'result', opt.id)}
                                                                disabled={selectedSleepers.length === 0 || saving}
                                                                style={{
                                                                    padding: '4px 12px',
                                                                    fontSize: '10px',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    background: sectionStates[s.id].result === opt.id ? '#42818c' : 'transparent',
                                                                    color: sectionStates[s.id].result === opt.id ? '#fff' : '#64748b',
                                                                    cursor: 'pointer',
                                                                    fontWeight: '600',
                                                                    opacity: selectedSleepers.length === 0 ? 0.5 : 1
                                                                }}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {(sectionStates[s.id].result === 'all-rejected' || sectionStates[s.id].result === 'partial-ok') && (
                                                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginTop: '8px' }}>
                                                        <div style={{ marginBottom: '12px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                                <span style={{ color: '#42818c', fontWeight: '700', fontSize: '11px' }}>
                                                                    {sectionStates[s.id].result === 'all-rejected' ? 'All Sleepers Rejected' : 'Select Rejected Sleepers:'}
                                                                </span>
                                                                <span style={{ fontSize: '10px', color: '#94a3b8' }}>{sectionStates[s.id].failedSleepers.length} Sleeper(s)</span>
                                                            </div>
                                                            
                                                            {sectionStates[s.id].result === 'partial-ok' && (
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                                    {sleepers.filter(sl => {
                                                                        if (!selectedSleepers.includes(sl.id)) return false;
                                                                        const originalSleeper = initialSleepers.find(x => x.id === sl.id);
                                                                        return originalSleeper && originalSleeper.status === 'pending';
                                                                    }).map(sl => {
                                                                        const isRejectedElsewhere = sections.some(otherSect => 
                                                                            otherSect.id !== s.id && 
                                                                            (sectionStates[otherSect.id].result === 'all-rejected' || sectionStates[otherSect.id].failedSleepers.includes(sl.id))
                                                                        );
                                                                        const isCurrentlyRejected = sectionStates[s.id].failedSleepers.includes(sl.id);
                                                                        return (
                                                                            <div
                                                                                key={sl.id}
                                                                                onClick={() => {
                                                                                    if (isRejectedElsewhere) return;
                                                                                    const failed = sectionStates[s.id].failedSleepers;
                                                                                    const newVal = failed.includes(sl.id) ? failed.filter(fid => fid !== sl.id) : [...failed, sl.id];
                                                                                    handleSectionChange(s.id, 'failedSleepers', newVal);
                                                                                }}
                                                                                style={{
                                                                                    padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600',
                                                                                    cursor: isRejectedElsewhere ? 'not-allowed' : 'pointer',
                                                                                    border: '1px solid',
                                                                                    borderColor: isCurrentlyRejected ? '#ef4444' : '#e2e8f0',
                                                                                    background: isCurrentlyRejected ? '#fee2e2' : isRejectedElsewhere ? '#f1f5f9' : '#fff',
                                                                                    color: isCurrentlyRejected ? '#b91c1c' : isRejectedElsewhere ? '#94a3b8' : '#64748b'
                                                                                }}
                                                                            >
                                                                                {sl.displayNo}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {sectionStates[s.id].failedSleepers.length > 0 && (
                                                            <div style={{ marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                                                                    <thead>
                                                                        <tr style={{ color: '#64748b', textAlign: 'left' }}>
                                                                            <th style={{ padding: '4px' }}>Sleeper</th>
                                                                            <th style={{ padding: '4px' }}>Reason</th>
                                                                            <th style={{ padding: '4px' }}>Sub-Reason</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {sectionStates[s.id].failedSleepers.map(fid => {
                                                                            const sl = sleepers.find(item => item.id === fid);
                                                                            const details = sectionStates[s.id].rejectionDetails[fid] || { reason: '', subReason: '' };
                                                                            return (
                                                                                <tr key={fid} style={{ borderBottom: '1px dotted #f1f5f9' }}>
                                                                                    <td style={{ padding: '4px', fontWeight: '700', color: '#334155' }}>#{sl?.displayNo}</td>
                                                                                    <td style={{ padding: '4px' }}>
                                                                                        {s.id === 'ftc' ? (
                                                                                            <span style={{ fontWeight: '600', color: '#b91c1c' }}>NFTC</span>
                                                                                        ) : (
                                                                                            <select 
                                                                                                style={{ width: '100%', padding: '4px', fontSize: '10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                                                                                                value={details.reason}
                                                                                                onChange={(e) => handleSleeperRejectionUpdate(s.id, fid, 'reason', e.target.value)}
                                                                                            >
                                                                                                <option value="">-- Reason --</option>
                                                                                                {getRejectionOptions(s.id)?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                                                            </select>
                                                                                        )}
                                                                                    </td>
                                                                                    <td style={{ padding: '4px' }}>
                                                                                        {s.id === 'ftc' ? (
                                                                                            <span style={{ color: '#94a3b8', fontSize: '10px', fontStyle: 'italic' }}>No sub-reason</span>
                                                                                        ) : getSubReasons(s.id, details.reason).length > 0 ? (
                                                                                            <select 
                                                                                                style={{ width: '100%', padding: '4px', fontSize: '10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                                                                                                value={details.subReason}
                                                                                                onChange={(e) => handleSleeperRejectionUpdate(s.id, fid, 'subReason', e.target.value)}
                                                                                                disabled={!details.reason}
                                                                                            >
                                                                                                <option value="">-- Sub Reason --</option>
                                                                                                {getSubReasons(s.id, details.reason).map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                                                                            </select>
                                                                                        ) : (
                                                                                            <span style={{ color: '#94a3b8', fontSize: '10px', fontStyle: 'italic' }}>No sub-reason</span>
                                                                                        )}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap', padding: '0 32px 32px 32px' }}>
                <button
                    className="btn-verify"
                    style={{ flex: '1 1 200px', height: '44px', opacity: (saving || selectedSleepers.length === 0) ? 0.7 : 1 }}
                    onClick={handleSave}
                    disabled={saving || selectedSleepers.length === 0}
                >
                    {saving ? 'Saving...' : 'Save Visual Inspection Results'}
                </button>
                <button 
                    className="btn-save" 
                    style={{ flex: '1 1 200px', background: '#f1f5f9', color: '#64748b', border: 'none', height: '44px' }} 
                    onClick={onCancel} 
                    disabled={saving}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default VisualInspectionForm;
