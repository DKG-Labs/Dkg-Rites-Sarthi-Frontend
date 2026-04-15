import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import { useShift } from '../../../context/ShiftContext';

/**
 * ManualDataEntry Component
 * Provides a form for manual batch result entry and displays a log of all witnessed records.
 */
const ManualDataEntry = ({ batches, witnessedRecords, onSave, hideHistory = false, onlyHistory = false, activeContainer, onDelete, small = false, globalConfig }) => {
    const defaultFormData = {
        date: globalConfig?.castingDate || new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        batchNo: globalConfig?.batchNo || '',
        ca1: '', ca2: '', fa: '', cement: '', water: '', admixture: '',
        ca1Set: '', ca2Set: '', faSet: '', cementSet: '', waterSet: '', admixtureSet: '',
        isSameAsAdjusted: false
    };

    const [formData, setFormData] = useState(defaultFormData);
    const [totalWeight, setTotalWeight] = useState(0);

    // Sync with global header changes
    useEffect(() => {
        if (globalConfig) {
            setFormData(prev => ({
                ...prev,
                date: globalConfig.castingDate || prev.date,
                batchNo: globalConfig.batchNo || prev.batchNo
            }));
        }
    }, [globalConfig]);

    // Calculate Total
    useEffect(() => {
        const sum = (parseFloat(formData.ca1) || 0) + 
                    (parseFloat(formData.ca2) || 0) + 
                    (parseFloat(formData.fa) || 0) + 
                    (parseFloat(formData.cement) || 0) + 
                    (parseFloat(formData.water) || 0) + 
                    (parseFloat(formData.admixture) || 0);
        setTotalWeight(sum);
    }, [formData]);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [recentBatches, setRecentBatches] = useState([]);

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const res = await apiService.getLastFiveMoisture();
                if (res?.responseData) {
                    setRecentBatches(res.responseData);
                }
            } catch (err) {
                console.error("Failed to fetch last 5 batches:", err);
            }
        };
        fetchBatches();
    }, []);



    const getFieldValidation = (field, value) => {
        if (!value) return false;
        const limit = (field === 'cement') ? 0.02 : 0.03;
        const selectedBatch = batches.find(b => String(b.batchNo) === String(formData.batchNo)) || 
                             recentBatches.find(b => String(b.batchNo) === String(formData.batchNo));
        if (selectedBatch?.adjustedWeights) {
            const refVal = parseFloat(selectedBatch.adjustedWeights[field]) || 0;
            const curVal = parseFloat(value) || 0;
            if (refVal > 0) {
                return (Math.abs(curVal - refVal) / refVal) > limit;
            }
        }
        return false;
    };

    const handleChange = async (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    // Automatically autofill actual values AND store set values from moisture adjusted weights
    useEffect(() => {
        if (formData.batchNo) {
            const batchToUse = batches.find(b => String(b.batchNo) === String(formData.batchNo)) || 
                             recentBatches.find(b => String(b.batchNo) === String(formData.batchNo));
            if (batchToUse?.adjustedWeights) {
                const adj = batchToUse.adjustedWeights;
                
                // Only autofill if the current fields are empty so we don't overwrite user edits
                // user edits can be modified AFTER auto-filling
                setFormData(prev => {
                    const nextSt = { ...prev };
                    
                    // Store set values
                    nextSt.ca1Set = adj.ca1 || '';
                    nextSt.ca2Set = adj.ca2 || '';
                    nextSt.faSet = adj.fa || '';
                    nextSt.cementSet = adj.cement || '';
                    nextSt.waterSet = adj.water || '';
                    nextSt.admixtureSet = adj.admixture || '';

                    // Autofill actual values if empty or if 'isSameAsAdjusted' triggered it
                    if (prev.isSameAsAdjusted || (!prev.ca1 && !prev.ca2 && !prev.cement)) {
                        nextSt.ca1 = adj.ca1 || '';
                        nextSt.ca2 = adj.ca2 || '';
                        nextSt.fa = adj.fa || '';
                        nextSt.cement = adj.cement || '';
                        nextSt.water = adj.water || '';
                        nextSt.admixture = adj.admixture || '';
                    }

                    return nextSt;
                });
            }
        }
    }, [formData.batchNo, formData.isSameAsAdjusted, batches, recentBatches]);

    const handleEdit = async (record) => {
        try {
            let fetchedData = { ...record };
            const lookupId = record.parentId || record.id;
            
            // Only fetch from backend if ID is a real numeric ID (not a local timestamp or string)
            if (lookupId && !isNaN(lookupId) && !String(lookupId).includes('-')) {
                const response = await apiService.getBatchWeighmentById(lookupId);
                if (response?.responseData) {
                    // Find the specific nested record if available
                    const batchData = response.responseData;
                    const combinedRecords = [
                        ...(batchData.scadaRecords || []).map(r => ({ ...r, source: 'Scada' })),
                        ...(batchData.manualRecords || []).map(r => ({ ...r, source: 'Manual' }))
                    ];
                    
                    const specificRecord = combinedRecords.find(r => r.id === record.id) || record;
                    fetchedData = {
                        ...specificRecord,
                        parentId: batchData.id,
                        entryDate: batchData.entryDate // Keep parent date context
                    };
                }
            }

            // Normalize Date for internal use (Dash/ISO) from DD/MM/YYYY
            const internalDate = (fetchedData.date && fetchedData.date.includes('/')) 
                ? fetchedData.date.split('/').reverse().join('-')
                : (fetchedData.date || new Date().toISOString().split('T')[0]);

            setFormData({
                date: internalDate,
                time: fetchedData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                batchNo: fetchedData.batchNo || '',
                ca1: fetchedData.ca1Actual || fetchedData.ca1 || '',
                ca2: fetchedData.ca2Actual || fetchedData.ca2 || '',
                fa: fetchedData.faActual || fetchedData.fa || '',
                cement: fetchedData.cementActual || fetchedData.cement || '',
                water: fetchedData.waterActual || fetchedData.water || '',
                admixture: fetchedData.admixtureActual || fetchedData.admixture || '',
                ca1Set: fetchedData.ca1Set || '',
                ca2Set: fetchedData.ca2Set || '',
                faSet: fetchedData.faSet || '',
                cementSet: fetchedData.cementSet || '',
                waterSet: fetchedData.waterSet || '',
                admixtureSet: fetchedData.admixtureSet || '',
            });
            setEditingId(fetchedData.id);
            // Attach parent ID to form context if available
            setFormData(prev => ({ ...prev, parentId: fetchedData.parentId }));

            // Scroll to form and add visual highlight
            setTimeout(() => {
                const manualSection = document.getElementById('manual-entry-section');
                if (manualSection) {
                    manualSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Add temporary highlight
                    manualSection.style.border = '3px solid #fbbf24';
                    manualSection.style.borderRadius = '12px';
                    setTimeout(() => {
                        manualSection.style.border = '';
                        manualSection.style.borderRadius = '';
                    }, 2000);
                }
            }, 100);
        } catch (error) {
            console.error("Error fetching batch weighment details:", error);
            // Fallback
            setFormData({
                date: record.date || new Date().toISOString().split('T')[0],
                time: record.time,
                batchNo: record.batchNo,
                ca1: record.ca1, ca2: record.ca2, fa: record.fa,
                cement: record.cement, water: record.water, admixture: record.admixture
            });
            setEditingId(record.id);
        }
    };

    const handleSave = async () => {
        if (!formData.batchNo || !formData.cement) {
            alert('Required fields missing');
            return;
        }

        // --- NEW VALIDATION: Allowed Error Check ---
        const selectedBatch = batches.find(b => String(b.batchNo) === String(formData.batchNo)) || recentBatches.find(b => String(b.batchNo) === String(formData.batchNo));
        if (selectedBatch && selectedBatch.adjustedWeights) {
            const adj = selectedBatch.adjustedWeights;
            
            const checks = [
                { name: 'Cement', current: formData.cement, ref: adj.cement, limit: 0.02 },
                { name: 'CA1', current: formData.ca1, ref: adj.ca1, limit: 0.03 },
                { name: 'CA2', current: formData.ca2, ref: adj.ca2, limit: 0.03 },
                { name: 'FA', current: formData.fa, ref: adj.fa, limit: 0.03 },
                { name: 'Water', current: formData.water, ref: adj.water, limit: 0.03 },
                { name: 'Admixture', current: formData.admixture, ref: adj.admixture, limit: 0.03 }
            ];

            const errors = [];
            checks.forEach(check => {
                const currentVal = parseFloat(check.current) || 0;
                const refVal = parseFloat(check.ref) || 0;
                
                if (refVal > 0) {
                    const dev = Math.abs(currentVal - refVal) / refVal;
                    if (dev > check.limit) {
                        errors.push(`${check.name}: Error ±${(dev * 100).toFixed(2)}% (Limit ±${check.limit * 100}%)`);
                    }
                }
            });

            if (errors.length > 0) {
                alert(`Manual Result Validation Failed:\n\n${errors.join('\n')}\n\nPlease verify weights compared to adjusted values.`);
                return;
            }
        }
        // --- END VALIDATION ---

        setSaving(true);
        // Using batchRef to avoid redeclaration conflict
        const batchRef = batches.find(b => String(b.batchNo) === String(formData.batchNo)) || recentBatches.find(b => String(b.batchNo) === String(formData.batchNo));
        const adj = batchRef?.adjustedWeights || {};

        const record = {
            ...formData,
            id: editingId || Date.now(),
            source: 'Manual',
            timestamp: new Date().toISOString(),
            location: activeContainer?.name || 'N/A',
            // Store Set values for later display in the log
            ca1Set: formData.ca1Set || adj.ca1 || 0,
            ca2Set: formData.ca2Set || adj.ca2 || 0,
            faSet: formData.faSet || adj.fa || 0,
            cementSet: formData.cementSet || adj.cement || 0,
            waterSet: formData.waterSet || adj.water || 0,
            admixtureSet: formData.admixtureSet || adj.admixture || 0,
            total: totalWeight
        };

        onSave(record);
        setFormData(defaultFormData);
        setEditingId(null);
        setSaving(false);
    };

    const isRecordEditable = (timestamp) => {
        if (!timestamp) return true;
        const diffMs = Date.now() - new Date(timestamp).getTime();
        return diffMs < (12 * 60 * 60 * 1000); // 12-hour shift window
    };

    return (
        <div className="manual-batch-controls" id="manual-entry-section">
            {(!onlyHistory || editingId) && (
                <div style={{ background: '#f8fafc', padding: small ? '1rem' : '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editingId ? '1rem' : 0 }}>
                        <h4 style={{ margin: 0, color: '#1e293b', fontSize: small ? '0.85rem' : '1rem' }}>{editingId ? 'Edit Manual Batch Result' : 'Add Manual Batch Result'}</h4>
                        {editingId && (
                            <span style={{ fontSize: '0.75rem', color: '#d97706', background: '#fef3c7', padding: '4px 12px', borderRadius: '6px', fontWeight: '700' }}>
                                Editing Record ID: {editingId}
                            </span>
                        )}
                    </div>
                    <div className="form-grid" style={{ gap: small ? '1rem' : '1.25rem 2rem' }}>

                        <div className="form-field">
                            <label htmlFor="manual-date" style={{ fontSize: small ? '0.65rem' : '0.725rem' }}>Date</label>
                            <input 
                                id="manual-date" 
                                name="date" 
                                type="text" 
                                readOnly 
                                value={formData.date ? formData.date.split('-').reverse().join('/') : ''} 
                                style={{ height: small ? '28px' : '32px', fontSize: small ? '0.75rem' : '0.8rem', background: '#f1f5f9', color: '#64748b', border: '1.5px solid #e2e8f0', fontWeight: '600' }} 
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="manual-time" style={{ fontSize: small ? '0.65rem' : '0.725rem' }}>Time</label>
                            <input id="manual-time" type="time" name="time" value={formData.time} onChange={handleChange} style={{ height: small ? '28px' : '32px', fontSize: small ? '0.75rem' : '0.8rem' }} />
                        </div>
                        <div className="form-field">
                            <label htmlFor="manual-batch" style={{ fontSize: small ? '0.65rem' : '0.725rem' }}>Batch No.</label>
                            <input 
                                id="manual-batch" 
                                name="batchNo" 
                                type="text" 
                                readOnly 
                                value={formData.batchNo} 
                                style={{ height: small ? '28px' : '32px', fontSize: small ? '0.75rem' : '0.8rem', background: '#f1f5f9', fontWeight: '800', border: '1.5px solid #cbd5e1', color: '#1e293b' }} 
                            />
                        </div>
                        <div className="form-field" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '10px', color: '#64748b', visibility: 'hidden' }}>-</label>
                            <div 
                                onClick={() => handleChange({ target: { name: 'isSameAsAdjusted', type: 'checkbox', checked: !formData.isSameAsAdjusted } })}
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '10px', 
                                    height: small ? '28px' : '32px',
                                    cursor: 'pointer',
                                    userSelect: 'none'
                                }}
                            >
                                <div style={{ 
                                    width: '18px', 
                                    height: '18px', 
                                    borderRadius: '4px', 
                                    border: formData.isSameAsAdjusted ? 'none' : '2px solid #cbd5e1',
                                    background: formData.isSameAsAdjusted ? '#3b82f6' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: formData.isSameAsAdjusted ? '0 2px 4px rgba(59, 130, 246, 0.3)' : 'none'
                                }}>
                                    {formData.isSameAsAdjusted && (
                                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </div>
                                <span style={{ 
                                    fontSize: '9px', 
                                    fontWeight: '900', 
                                    color: formData.isSameAsAdjusted ? '#1e40af' : '#64748b',
                                    letterSpacing: '0.4px'
                                }}>
                                    {formData.isSameAsAdjusted ? 'ADOPTED ADJUSTED' : 'ADOPT ADJUSTED'}
                                </span>
                            </div>
                        </div>



                        <div className="form-field">
                            <label htmlFor="manual-ca1" style={{ fontSize: small ? '0.65rem' : '0.725rem' }}>CA1 (±3%)</label>
                            <input 
                                id="manual-ca1" 
                                type="number" 
                                name="ca1" 
                                value={formData.ca1} 
                                onChange={handleChange} 
                                placeholder="Kgs" 
                                style={{ 
                                    height: small ? '28px' : '32px', 
                                    fontSize: small ? '0.75rem' : '0.8rem',
                                    background: getFieldValidation('ca1', formData.ca1) ? '#fecaca' : '#fff'
                                }} 
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="manual-ca2" style={{ fontSize: small ? '0.65rem' : '0.725rem' }}>CA2 (±3%)</label>
                            <input 
                                id="manual-ca2" 
                                type="number" 
                                name="ca2" 
                                value={formData.ca2} 
                                onChange={handleChange} 
                                placeholder="Kgs" 
                                style={{ 
                                    height: small ? '28px' : '32px', 
                                    fontSize: small ? '0.75rem' : '0.8rem',
                                    background: getFieldValidation('ca2', formData.ca2) ? '#fecaca' : '#fff'
                                }} 
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="manual-fa" style={{ fontSize: small ? '0.65rem' : '0.725rem' }}>SAND (±3%)</label>
                            <input 
                                id="manual-fa" 
                                type="number" 
                                name="fa" 
                                value={formData.fa} 
                                onChange={handleChange} 
                                placeholder="Kgs" 
                                style={{ 
                                    height: small ? '28px' : '32px', 
                                    fontSize: small ? '0.75rem' : '0.8rem',
                                    background: getFieldValidation('fa', formData.fa) ? '#fecaca' : '#fff'
                                }} 
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="manual-cement" style={{ fontSize: small ? '0.65rem' : '0.725rem' }}>CEMENT (±2%)</label>
                            <input 
                                id="manual-cement" 
                                type="number" 
                                name="cement" 
                                value={formData.cement} 
                                onChange={handleChange} 
                                placeholder="Kgs" 
                                style={{ 
                                    height: small ? '28px' : '32px', 
                                    fontSize: small ? '0.75rem' : '0.8rem',
                                    background: getFieldValidation('cement', formData.cement) ? '#fecaca' : '#fff'
                                }} 
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="manual-water" style={{ fontSize: small ? '0.65rem' : '0.725rem' }}>WATER (±3%)</label>
                            <input 
                                id="manual-water" 
                                type="number" 
                                name="water" 
                                value={formData.water} 
                                onChange={handleChange} 
                                placeholder="Kgs" 
                                style={{ 
                                    height: small ? '28px' : '32px', 
                                    fontSize: small ? '0.75rem' : '0.8rem',
                                    background: getFieldValidation('water', formData.water) ? '#fecaca' : '#fff'
                                }} 
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="manual-admix" style={{ fontSize: small ? '0.65rem' : '0.725rem' }}>ADMIX (±3%)</label>
                            <input 
                                id="manual-admix" 
                                type="number" 
                                name="admixture" 
                                value={formData.admixture} 
                                onChange={handleChange} 
                                placeholder="Kgs" 
                                style={{ 
                                    height: small ? '28px' : '32px', 
                                    fontSize: small ? '0.75rem' : '0.8rem',
                                    background: getFieldValidation('admixture', formData.admixture) ? '#fecaca' : '#fff'
                                }} 
                            />
                        </div>
                        <div className="form-field">
                            <label style={{ fontSize: small ? '0.65rem' : '0.725rem', fontWeight: '800', color: '#1e3a8a' }}>TOTAL CALCULATED (Kg)</label>
                            <div style={{ 
                                height: small ? '28px' : '32px', 
                                fontSize: small ? '0.75rem' : '0.9rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                padding: '0 12px', 
                                background: '#f1f5f9', 
                                borderRadius: '6px', 
                                border: '1.5px solid #cbd5e1',
                                fontWeight: '900',
                                color: '#0f172a'
                            }}>
                                {totalWeight.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div className="form-actions-center" style={{ marginTop: '1rem' }}>
                        {editingId && <button className="toggle-btn secondary" onClick={() => { setFormData(defaultFormData); setEditingId(null); }} style={{ height: small ? '32px' : '36px', fontSize: small ? '0.75rem' : '0.8125rem' }}>Cancel</button>}
                        <button className="toggle-btn" onClick={handleSave} disabled={saving} style={{ marginLeft: editingId ? '1rem' : '0', height: small ? '32px' : '36px', fontSize: small ? '0.75rem' : '0.8125rem' }}>
                            {saving ? 'Saving...' : editingId ? 'Update Entry' : 'Confirm Entry'}
                        </button>
                    </div>
                </div>
            )}

            {/* Historical Table */}
            {!hideHistory && (
                <div className="table-outer-wrapper" style={{ marginTop: small ? '1rem' : '1.5rem', background: 'transparent', border: 'none', padding: 0 }}>
                    <div style={{ padding: small ? '0.5rem 1rem' : '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '4px', height: small ? '12px' : '16px', background: '#10b981', borderRadius: '2px' }}></span>
                            <h4 style={{ margin: 0, color: '#1e293b', fontSize: small ? '0.75rem' : '0.9rem', fontWeight: '800' }}>Historical Witnessed Logs</h4>
                        </div>
                        <span style={{ fontSize: small ? '0.65rem' : '0.75rem', color: '#64748b', fontWeight: '700', background: '#fff', padding: small ? '2px 8px' : '4px 12px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                            {witnessedRecords.length} {witnessedRecords.length === 1 ? 'Record' : 'Records'} Found
                        </span>
                    </div>

                    {(() => {
                        const renderTable = (recordsSubset, title, groupColor) => (
                            <div style={{ marginBottom: '2.5rem' }}>
                                <div className="table-responsive" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                                    <table className="ui-table" style={{ borderCollapse: 'collapse', minWidth: '950px', width: '100%' }}>
                                        <thead>
                                            <tr>
                                                <th rowSpan="2" style={{ fontSize: '9px', padding: '4px' }}>S.No</th>
                                                <th rowSpan="2" style={{ fontSize: '9px', padding: '4px' }}>Date</th>
                                                <th rowSpan="2" style={{ fontSize: '9px', padding: '4px' }}>Time</th>
                                                <th rowSpan="2" style={{ fontSize: '9px', padding: '4px' }}>Batch</th>
                                                <th colSpan="2" style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '9px', padding: '4px' }}>20mm</th>
                                                <th colSpan="2" style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '9px', padding: '4px' }}>10mm</th>
                                                <th colSpan="2" style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '9px', padding: '4px' }}>SAND</th>
                                                <th colSpan="2" style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '9px', padding: '4px' }}>CEMENT</th>
                                                <th colSpan="2" style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '9px', padding: '4px' }}>WATER</th>
                                                <th colSpan="2" style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '9px', padding: '4px' }}>ADMIX</th>
                                                <th rowSpan="2" style={{ fontSize: '9px', padding: '4px' }}>Total</th>
                                                <th rowSpan="2" style={{ fontSize: '9px', padding: '4px' }}>Source</th>
                                                <th rowSpan="2" style={{ textAlign: 'center', fontSize: '9px', padding: '4px' }}>Actions</th>
                                            </tr>
                                            <tr>
                                                <th style={{ fontSize: '8px', padding: '2px' }}>Set</th>
                                                <th style={{ fontSize: '8px', padding: '2px' }}>Act</th>
                                                <th style={{ fontSize: '8px', padding: '2px' }}>Set</th>
                                                <th style={{ fontSize: '8px', padding: '2px' }}>Act</th>
                                                <th style={{ fontSize: '8px', padding: '2px' }}>Set</th>
                                                <th style={{ fontSize: '8px', padding: '2px' }}>Act</th>
                                                <th style={{ fontSize: '8px', padding: '2px' }}>Set</th>
                                                <th style={{ fontSize: '8px', padding: '2px' }}>Act</th>
                                                <th style={{ fontSize: '8px', padding: '2px' }}>Set</th>
                                                <th style={{ fontSize: '8px', padding: '2px' }}>Act</th>
                                                <th style={{ fontSize: '8px', padding: '2px' }}>Set</th>
                                                <th style={{ fontSize: '8px', padding: '2px' }}>Act</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recordsSubset.map((record, idx) => (
                                                 record.isHeader ? (
                                                     <tr key={record.id} style={{ background: '#f8fafc', borderLeft: '4px solid #3b82f6' }}>
                                                         <td style={{ fontSize: '10px', padding: '4px' }}>{idx + 1}</td>
                                                         <td style={{ fontSize: '10px', padding: '4px' }}>{record.date}</td>
                                                         <td style={{ fontSize: '10px', padding: '4px' }}>{record.time}</td>
                                                         <td colSpan="13" style={{ fontSize: '10px', fontWeight: '700', color: '#1e3a8a', padding: '4px' }}>
                                                             SESSION START: {record.remarks}
                                                         </td>
                                                         <td style={{ padding: '4px' }}>
                                                             <span className="status-pill session" style={{ fontSize: '8px', background: '#e0f2fe', color: '#0369a1', padding: '2px 4px' }}>
                                                                 {record.source}
                                                             </span>
                                                         </td>
                                                         <td style={{ textAlign: 'center', padding: '4px' }}>-</td>
                                                     </tr>
                                                 ) : (
                                                     <tr key={record.id} className="hover-row">
                                                          <td style={{ fontSize: '10px', padding: '4px' }}>{idx + 1}</td>
                                                          <td style={{ fontSize: '10px', padding: '4px' }}>{record.date ? (record.date.includes('-') ? record.date.split('-').reverse().join('/') : record.date) : ''}</td>
                                                          <td style={{ fontSize: '10px', padding: '4px' }}>{record.time}</td>
                                                          <td style={{ fontSize: '10px', padding: '4px' }}><strong>{record.batchNo}</strong></td>
                                                          
                                                          <td style={{ fontSize: '10px', color: '#64748b', padding: '4px' }}>{record.ca1Set ?? '-'}</td>
                                                          <td style={{ fontSize: '10px', padding: '4px' }}>{record.ca1 ?? record.ca1Actual ?? '-'}</td>
                                                          
                                                          <td style={{ fontSize: '10px', color: '#64748b', padding: '4px' }}>{record.ca2Set ?? '-'}</td>
                                                          <td style={{ fontSize: '10px', padding: '4px' }}>{record.ca2 ?? record.ca2Actual ?? '-'}</td>
                                                          
                                                          <td style={{ fontSize: '10px', color: '#64748b', padding: '4px' }}>{record.faSet ?? '-'}</td>
                                                          <td style={{ fontSize: '10px', padding: '4px' }}>{record.fa ?? record.faActual ?? '-'}</td>
                                                          
                                                          <td style={{ fontSize: '10px', color: '#64748b', padding: '4px' }}>{record.cementSet ?? '-'}</td>
                                                          <td style={{ fontSize: '10px', fontWeight: '700', padding: '4px' }}>{record.cement ?? record.cementActual ?? '-'}</td>
                                                          
                                                          <td style={{ fontSize: '10px', color: '#64748b', padding: '4px' }}>{record.waterSet ?? '-'}</td>
                                                          <td style={{ fontSize: '10px', padding: '4px' }}>{record.water ?? record.waterActual ?? '-'}</td>
                                                          
                                                          <td style={{ fontSize: '10px', color: '#64748b', padding: '4px' }}>{record.admixtureSet ?? '-'}</td>
                                                          <td style={{ fontSize: '10px', padding: '4px' }}>{record.admixture ?? record.admixtureActual ?? '-'}</td>
                                                          
                                                          <td style={{ fontSize: '10px', fontWeight: '800', padding: '4px' }}>{record.total ? parseFloat(record.total).toFixed(1) : '-'}</td>
                                                          
                                                          <td style={{ padding: '4px' }}>
                                                              <span className={`status-pill ${record.source?.toLowerCase().includes('scada') ? 'witnessed' : 'manual'}`} style={{ fontSize: '8px', padding: '2px 4px' }}>
                                                                  {record.source}
                                                              </span>
                                                          </td>
                                                          <td style={{ textAlign: 'center', padding: '4px' }}>
                                                              <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                                                                  <button onClick={() => handleEdit(record)} className="btn-action mini" style={{ background: '#3b82f6', color: '#fff', fontSize: '8px', padding: '2px 4px' }}>Edit</button>
                                                                  <button onClick={() => onDelete(record.id)} className="btn-action danger mini" style={{ background: '#ef4444', color: '#fff', fontSize: '8px', padding: '2px 4px' }}>Del</button>
                                                              </div>
                                                          </td>
                                                      </tr>
                                                 )
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );

                        const sortedRecords = [...witnessedRecords].sort((a, b) => {
                            const dateA = (a.date && a.date.includes('/')) ? a.date.split('/').reverse().join('-') : (a.date || '');
                            const dateB = (b.date && b.date.includes('/')) ? b.date.split('/').reverse().join('-') : (b.date || '');
                            
                            if (dateA !== dateB) return dateB.localeCompare(dateA);
                            return String(b.time || '').localeCompare(String(a.time || ''));
                        });

                        return (
                            <>
                                {sortedRecords.length > 0 ? (
                                    renderTable(sortedRecords, "BATCH WEIGHMENT LOGS", "#10b981")

                                ) : (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        No witnessed declarations found.
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

export default ManualDataEntry;
