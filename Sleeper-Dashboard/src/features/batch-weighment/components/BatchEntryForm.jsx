import React, { useState } from 'react';
import InitialDeclaration from './InitialDeclaration';
import WeightBatching from './WeightBatching';
import ManualDataEntry from './ManualDataEntry';
import BatchLogs from './BatchLogs';

import { apiService } from '../../../services/api';
import { useShift } from '../../../context/ShiftContext';

const BatchEntryForm = ({
    setShowForm,
    batchDeclarations,
    setBatchDeclarations,
    witnessedRecords,
    handleSaveWitness,
    activeContainer,
    handleDelete,
    selectedBatchNo,
    loadShiftData,
    sessionConfig,
    setSessionConfig
}) => {
    const { vendorCode, dutyUnit, selectedShift, dutyDate, userId } = useShift();
    const [formSections, setFormSections] = useState({ declaration: true, scada: true, manual: true, witness: true });
    const [isSaving, setIsSaving] = useState(false);
    const [witnessInfo, setWitnessInfo] = useState({ verifiedBy: '', remarks: '' });
    const [sensorConfig, setSensorConfig] = useState(sessionConfig || { sensorStatus: 'working', sandType: 'River Sand' });
    const [activeBatchDeclarations, setActiveBatchDeclarations] = useState([]);
    const [sessionRecordIds, setSessionRecordIds] = useState([]);

    // Locally intercept witnessed record additions to track session history
    const handleLocalWitnessSave = (record) => {
        if (!sessionRecordIds.includes(record.id)) {
            setSessionRecordIds(prev => [...prev, record.id]);
        }
        handleSaveWitness(record);
    };

    // Logic to handle internal updates and also update the parent state
    const handleBatchUpdate = (newBatches) => {
        setActiveBatchDeclarations(newBatches);
        // We still update the global state so other modules (like stats) can see it
        // but we only display 'newBatches' in these form sections.
        setBatchDeclarations(prev => {
            const current = Array.isArray(prev) ? prev : [];
            const newBatchNos = newBatches.map(b => String(b.batchNo));
            const filteredPrev = current.filter(b => !newBatchNos.includes(String(b.batchNo)));
            return [...filteredPrev, ...newBatches];
        });
    };

    const handleFinalSave = async () => {
        setIsSaving(true);
        try {
            const [y, m, d] = (dutyDate || new Date().toISOString().split('T')[0]).split('-');
            const formattedDate = `${d}/${m}/${y}`;

            const currentUserIdStr = userId || localStorage.getItem('userId') || "0";
            const currentUserId = parseInt(currentUserIdStr, 10) || 0;

            const payload = {
                lineNo: activeContainer?.name || "Line I",
                entryDate: formattedDate,
                sandType: sensorConfig.sandType || "River Sand",
                moistureSensorStatus: (sensorConfig.sensorStatus || "WORKING").toUpperCase(),
                verifiedBy: witnessInfo.verifiedBy || "Operator",
                remarks: witnessInfo.remarks || "Batch session sync",
                entryMode: "MIXED",
                createdBy: currentUserId,
                updatedBy: currentUserId,
                vendorCode: vendorCode || localStorage.getItem('vendorCode'),
                plantId: dutyUnit || localStorage.getItem('dutyUnit'),
                shift: selectedShift || localStorage.getItem('selectedShift'),
                batchDetails: activeBatchDeclarations.map(d => ({
                    id: (typeof d.id === 'number' && d.id < 1000000) ? d.id : 0,
                    batchNo: String(d.batchNo || "0"),
                    proportionStatus: d.proportionMatch || "OK",
                    ca1Ref: parseFloat(d.adjustedWeights?.ca1) || 0,
                    ca2Ref: parseFloat(d.adjustedWeights?.ca2) || 0,
                    faRef: parseFloat(d.adjustedWeights?.fa) || 0,
                    cementRef: parseFloat(d.adjustedWeights?.cement) || 0,
                    waterRef: parseFloat(d.adjustedWeights?.water) || 0,
                    admixtureRef: parseFloat(d.adjustedWeights?.admixture) || 0,
                    ca1Set: parseFloat(d.setValues?.ca1) || 0,
                    ca2Set: parseFloat(d.setValues?.ca2) || 0,
                    faSet: parseFloat(d.setValues?.fa) || 0,
                    cementSet: parseFloat(d.setValues?.cement) || 0,
                    waterSet: parseFloat(d.setValues?.water) || 0,
                    admixtureSet: parseFloat(d.setValues?.admixture) || 0
                })),
                scadaRecords: witnessedRecords.filter(r => sessionRecordIds.includes(r.id) && r.source?.toLowerCase().includes('scada')).map(r => ({
                    id: (typeof r.id === 'number' && r.id < 1000000) ? r.id : 0,
                    batchNo: String(r.batchNo || "0"),
                    date: (r.date && String(r.date).includes('-')) ? r.date.split('-').reverse().join('/') : (String(r.date).includes('/') ? r.date : formattedDate),
                    time: (r.time && String(r.time).length >= 5) ? String(r.time).substring(0, 5) : "00:00",
                    ca1Set: parseFloat(r.ca1Set || r.mm20_set) || 0,
                    ca1Actual: parseFloat(r.ca1Actual || r.ca1) || 0,
                    ca2Set: parseFloat(r.ca2Set || r.mm10_set) || 0,
                    ca2Actual: parseFloat(r.ca2Actual || r.ca2) || 0,
                    faSet: parseFloat(r.faSet || r.sand_set) || 0,
                    faActual: parseFloat(r.faActual || r.fa) || 0,
                    cementSet: parseFloat(r.cementSet || r.cement_set) || 0,
                    cementActual: parseFloat(r.cementActual || r.cement) || 0,
                    waterSet: parseFloat(r.waterSet || r.water_set) || 0,
                    waterActual: parseFloat(r.waterActual || r.water) || 0,
                    admixtureSet: parseFloat(r.admixtureSet || r.admix_set) || 0,
                    admixtureActual: parseFloat(r.admixtureActual || r.admixture) || 0,
                    total: parseFloat(r.total) || 0
                })),
                manualRecords: witnessedRecords.filter(r => sessionRecordIds.includes(r.id) && r.source?.toLowerCase().includes('manual')).map(r => ({
                    id: (typeof r.id === 'number' && r.id < 1000000) ? r.id : 0,
                    batchNo: String(r.batchNo || "0"),
                    date: (r.date && String(r.date).includes('-')) ? r.date.split('-').reverse().join('/') : (String(r.date).includes('/') ? r.date : formattedDate),
                    time: (r.time && String(r.time).length >= 5) ? String(r.time).substring(0, 5) : "00:00",
                    ca1Set: parseFloat(r.ca1Set) || 0,
                    ca2Set: parseFloat(r.ca2Set) || 0,
                    faSet: parseFloat(r.faSet) || 0,
                    cementSet: parseFloat(r.cementSet) || 0,
                    waterSet: parseFloat(r.waterSet) || 0,
                    admixtureSet: parseFloat(r.admixtureSet) || 0,
                    ca1Actual: parseFloat(r.ca1Actual || r.ca1) || 0,
                    ca2Actual: parseFloat(r.ca2Actual || r.ca2) || 0,
                    faActual: parseFloat(r.faActual || r.fa) || 0,
                    cementActual: parseFloat(r.cementActual || r.cement) || 0,
                    waterActual: parseFloat(r.waterActual || r.water) || 0,
                    admixtureActual: parseFloat(r.admixtureActual || r.admixture) || 0
                }))
            };

            await apiService.createBatchWeighment(payload);

            if (loadShiftData) await loadShiftData();
            setShowForm(false);
        } catch (error) {
            console.error("Session save failed:", error);
            alert(`Failed to save session: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };


    const toggleSection = (section) => {
        setFormSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowForm(false)}>
            <div className="fade-in" style={{ width: '100%', maxWidth: '1250px', maxHeight: '92vh', background: '#fff', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>

                {/* Header - Cream Background */}
                <div style={{ background: '#FFF8E7', padding: '1rem 1.5rem', borderBottom: '1px solid #F3E8FF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#1e293b', letterSpacing: '-0.5px' }}>New Batch Entry</h2>
                        <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '10px', fontWeight: '700' }}>{new Date().toLocaleDateString('en-GB')} | Record weights & verify SCADA data</p>
                    </div>
                    <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', width: '28px', height: '28px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', fontSize: '14px' }}>✕</button>
                </div>

                {/* Scrollable Body */}
                <div style={{ padding: '1.5rem', overflowY: 'auto', flexGrow: 1, overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Section 1: Initial Declaration */}
                        <div style={{ background: '#eff6ff', borderRadius: '8px', border: '1px solid #dbeafe', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                            <div
                                onClick={() => toggleSection('declaration')}
                                style={{ padding: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: formSections.declaration ? 'transparent' : '#eff6ff' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ background: '#3b82f6', color: '#fff', fontSize: '0.75rem', fontWeight: '800', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e3a8a', fontWeight: '800' }}>Initial Declaration</h3>
                                </div>
                                <span style={{ transition: 'transform 0.2s', transform: formSections.declaration ? 'rotate(180deg)' : 'rotate(0deg)', color: '#3b82f6' }}>▼</span>
                            </div>
                            {formSections.declaration && (
                                <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderTop: '1px solid #dbeafe', paddingTop: '1.5rem' }}>
                                    <InitialDeclaration
                                        batches={activeBatchDeclarations}
                                        onBatchUpdate={handleBatchUpdate}
                                        onSensorUpdate={setSensorConfig}
                                        activeContainer={activeContainer}
                                        loadShiftData={loadShiftData}
                                        initialSensors={sensorConfig}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Section 2: SCADA Data */}
                        <div style={{ background: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                            <div
                                onClick={() => toggleSection('scada')}
                                style={{ padding: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ background: '#d97706', color: '#fff', fontSize: '0.75rem', fontWeight: '800', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#78350f', fontWeight: '800' }}>SCADA Data Fetched</h3>
                                </div>
                                <span style={{ transition: 'transform 0.2s', transform: formSections.scada ? 'rotate(180deg)' : 'rotate(0deg)', color: '#d97706' }}>▼</span>
                            </div>
                            {formSections.scada && (
                                <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderTop: '1px solid #fcd34d', paddingTop: '1.5rem' }}>
                                    <WeightBatching onWitness={handleLocalWitnessSave} batches={activeBatchDeclarations} selectedBatchNo={activeBatchDeclarations[0]?.batchNo || selectedBatchNo} />
                                </div>
                            )}
                        </div>

                        {/* Section 3: Manual Verification */}
                        <div style={{ background: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                            <div
                                onClick={() => toggleSection('manual')}
                                style={{ padding: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ background: '#10b981', color: '#fff', fontSize: '0.75rem', fontWeight: '800', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#064e3b', fontWeight: '800' }}>Manual Verification</h3>
                                </div>
                                <span style={{ transition: 'transform 0.2s', transform: formSections.manual ? 'rotate(180deg)' : 'rotate(0deg)', color: '#10b981' }}>▼</span>
                            </div>
                            {formSections.manual && (
                                <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderTop: '1px solid #86efac', paddingTop: '1.5rem' }}>
                                    <ManualDataEntry batches={activeBatchDeclarations} witnessedRecords={witnessedRecords} onSave={handleLocalWitnessSave} activeContainer={activeContainer} onDelete={handleDelete} hideHistory={true} globalConfig={sensorConfig} />
                                </div>
                            )}
                        </div>

                        {/* Section 4: Summary for Review */}
                        <div style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                            <div
                                onClick={() => toggleSection('witness')}
                                style={{ padding: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ background: '#64748b', color: '#fff', fontSize: '0.75rem', fontWeight: '800', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>4</span>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: '800' }}>Review Witnessed Records</h3>
                                </div>
                                <span style={{ transition: 'transform 0.2s', transform: formSections.witness ? 'rotate(180deg)' : 'rotate(0deg)', color: '#64748b' }}>▼</span>
                            </div>
                            {formSections.witness && (
                                <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                                    <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Below are the records captured in Sections 2 and 3. Verify all weights before final confirmation.</p>
                                    </div>
                                    <BatchLogs 
                                        batchDeclarations={batchDeclarations}
                                        witnessedRecords={witnessedRecords.filter(r => sessionRecordIds.includes(r.id))} 
                                        handleDelete={handleDelete} 
                                        small={true}
                                    />

                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* Fixed Footer for Save Action */}
                <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button onClick={() => setShowForm(false)} style={{ padding: '0 1.5rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '700', color: '#64748b', cursor: 'pointer' }}>Cancel</button>
                    <button
                        className="toggle-btn"
                        disabled={isSaving}
                        onClick={handleFinalSave}
                        style={{ padding: '0 1.5rem', height: '40px', fontSize: '0.85rem', background: isSaving ? '#94a3b8' : '#1e293b' }}
                    >
                        {isSaving ? 'Processing...' : 'Confirm & Save Batch Records'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BatchEntryForm;
