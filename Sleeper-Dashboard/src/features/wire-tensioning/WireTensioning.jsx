import React, { useState, useEffect, useMemo } from 'react';
// Updated for 24-hour validity check
import { apiService } from '../../services/api';
import WireTensionStats from './components/WireTensionStats';
import CollapsibleSection from '../../components/common/CollapsibleSection';
import { useWireTensionStats } from '../../hooks/useStats';
import { useShift } from '../../context/ShiftContext';

/**
 * WireTensioning Feature
 * Handles integration of SCADA tensioning data and manual pressure logs.
 */
const TensionSubCard = ({ id, title, color, statusDetail, isActive, onClick }) => {
    const label = id === 'stats' ? 'OVERVIEW' : id === 'witnessed' ? 'HISTORY' : 'SCADA';
    return (
        <div
            onClick={onClick}
            style={{
                flex: '1 1 200px',
                padding: '16px 20px',
                background: isActive ? '#fff' : '#f8fafc',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderTopWidth: '4px',
                borderTopColor: color,
                borderRightColor: isActive ? color : '#e2e8f0',
                borderBottomColor: isActive ? color : '#e2e8f0',
                borderLeftColor: isActive ? color : '#e2e8f0',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isActive ? `0 4px 12px ${color}20` : 'none',
                transform: isActive ? 'translateY(-2px)' : 'none',
                position: 'relative',
                minHeight: '100px'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: isActive ? color : '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, opacity: isActive ? 1 : 0.4 }}></span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>{title}</span>
            <div style={{ marginTop: 'auto', fontSize: '10px', color: '#64748b', fontWeight: '600' }}>
                {statusDetail}
            </div>
        </div>
    );
};

const WireTensioning = ({ onBack, batches = [], sharedState, displayMode = 'modal', showForm: propsShowForm, setShowForm: propsSetShowForm, loadShiftData, activeContainer }) => {
    const { tensionRecords, setTensionRecords } = sharedState;
    const { vendorCode, dutyUnit, selectedShift, dutyDate, userId, vendorId } = useShift();
    const [viewMode, setViewMode] = useState('witnessed'); // Default to History/Logs
    const [localShowForm, setLocalShowForm] = useState(false);

    const showForm = propsShowForm !== undefined ? propsShowForm : localShowForm;
    const setShowForm = propsSetShowForm !== undefined ? propsSetShowForm : setLocalShowForm;
    const [selectedBatch, setSelectedBatch] = useState('');

    useEffect(() => {
        if (loadShiftData) {
            loadShiftData();
        }
    }, [loadShiftData]);

    const [scadaRecords, setScadaRecords] = useState([]);

    const wireTensionStats = useWireTensionStats(tensionRecords, selectedBatch);
    const [wiresPerSleeper] = useState(18);
    const [editId, setEditId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editOnly, setEditOnly] = useState(false);
    const [editParentId, setEditParentId] = useState(null);

    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dynamicBatches, setDynamicBatches] = useState([]);
    const [scadaData, setScadaData] = useState(null);
    const [manualDrafts, setManualDrafts] = useState([]);

    const [formData, setFormData] = useState({
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        batchNo: '',
        benchNo: '',
        wireLength: '',
        crossSection: '',
        modulus: '195',
        measuredElongation: '',
        forceElongation: '',
        totalLoad: '',
        finalLoad: '',
        type: 'RT-8746',
        noOfWires: 18
    });

    const isEditable = (record) => {
        if (!record) return false;
        
        // Use entry.date (from parent batch) and entry.time (from record itself)
        const dateStr = record.date || record.entryDate || record.timestamp;
        if (!dateStr) return true; // Default to true if no date info
        
        try {
            // Normalize date to yyyy-MM-dd
            let ymd = "";
            if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts[2].length === 4) {
                    ymd = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                } else {
                    ymd = `20${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            } else if (dateStr.includes('-')) {
                const parts = dateStr.split('T')[0].split('-');
                if (parts[0].length === 4) {
                    ymd = dateStr.split('T')[0];
                } else {
                    ymd = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            } else {
                const d = new Date(dateStr);
                if (isNaN(d.getTime())) return true;
                ymd = d.toISOString().split('T')[0];
            }
            
            const timeStr = record.time || "00:00";
            const combinedDateTime = new Date(`${ymd}T${timeStr}`);
            
            const now = new Date();
            const diffMs = now - combinedDateTime;
            const diffHours = diffMs / (1000 * 60 * 60);
            
            return diffHours <= 24;
        } catch (e) {
            console.error("Error checking editability:", e);
            return true; 
        }
    };

    // Dynamic Batch List: Merge declared batches with those found in SCADA or existing logs
    const availableBatches = useMemo(() => {
        const bSet = new Set();
        // From declaration prop or dynamic fetch
        const allSources = [...(Array.isArray(batches) ? batches : []), ...(Array.isArray(dynamicBatches) ? dynamicBatches : [])];
        allSources.forEach(b => {
            const bNo = typeof b === 'string' ? b : (b.batchNumber || b.batchNo);
            if (bNo) bSet.add(String(bNo));
        });

        // From raw Scada feed
        if (scadaRecords) {
            scadaRecords.forEach(r => { if (r.batchNo) bSet.add(String(r.batchNo)); });
        }
        // From existing logs
        if (tensionRecords) {
            tensionRecords.forEach(r => { if (r.batchNo) bSet.add(String(r.batchNo)); });
        }

        return Array.from(bSet).sort();
    }, [batches, scadaRecords, tensionRecords, dynamicBatches]);


    // Keep formData batch in sync with selection
    useEffect(() => {
        setFormData(prev => ({ ...prev, batchNo: selectedBatch }));
    }, [selectedBatch]);

    // Fetch Locations on mount
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const vId = vendorId || userId || localStorage.getItem('vendorId') || localStorage.getItem('userId');
                const pId = dutyUnit || localStorage.getItem('dutyUnit');
                if (vId && pId) {
                    const response = await apiService.getPlantSheds(vId, pId);
                    const data = response?.responseData || {};
                    
                    let locList = [];
                    if (typeof data === 'object' && data !== null) {
                        // Robustly flatten all arrays from the grouped response (Longline, Stress Bench, etc.)
                        Object.values(data).forEach((arr) => {
                            if (Array.isArray(arr)) {
                                arr.forEach(val => locList.push(String(val)));
                            }
                        });
                    }
                    setLocations(locList);
                }
            } catch (error) {
                console.error('Error fetching locations:', error);
            }
        };
        fetchLocations();
    }, [vendorId, userId, dutyUnit]);

    // Fetch Batches based on Location and Date
    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const vId = vendorId || userId || localStorage.getItem('vendorId') || localStorage.getItem('userId');
                const pId = dutyUnit || localStorage.getItem('dutyUnit');
                
                if (vId && pId && selectedLocation && selectedDate) {
                    // Format date to DD/MM/YYYY for the API
                    const [y, m, d] = selectedDate.split('-');
                    const formattedDate = `${d}/${m}/${y}`;
                    
                    const response = await apiService.getAllProductionBatches(vId, formattedDate, pId, selectedLocation);
                    setDynamicBatches(response?.responseData || []);
                }
            } catch (error) {
                console.error('Error fetching dynamic batches:', error);
            }
        };
        fetchBatches();
    }, [vendorId, userId, dutyUnit, selectedLocation, selectedDate]);

    // Reset selection when context changes
    useEffect(() => {
        setSelectedBatch('');
        setScadaData(null);
    }, [selectedLocation, selectedDate]);

    // Fetch SCADA Data based on Section 1
    useEffect(() => {
        if (selectedLocation && selectedDate && selectedBatch) {
            // Simulate fetching SCADA data or call an API if available
            // For now, we search in scadaRecords
            const found = scadaRecords.find(r => 
                String(r.batchNo) === String(selectedBatch)
            );
            setScadaData(found || null);
        } else {
            setScadaData(null);
        }
    }, [selectedLocation, selectedDate, selectedBatch, scadaRecords]);

    useEffect(() => {
        if (formData.benchNo) {
            // Suggesting type can be done here if needed, but it's a dropdown now
        }
    }, [formData.benchNo]);

    // Reset form when opened via toolbar for New Entry (not edit)
    useEffect(() => {
        if (showForm && !editId) {
            setFormData(prev => ({
                ...prev,
                benchNo: '',
                wireLength: '',
                crossSection: '',
                modulus: '',
                measuredElongation: '',
                forceElongation: '',
                totalLoad: '',
                finalLoad: '',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
            }));
        }
    }, [showForm, editId]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleWitness = (record) => {
        const newEntry = {
            ...record,
            id: Date.now(),
            timestamp: new Date().toISOString(),
            source: 'Scada',
            location: activeContainer?.name || 'N/A',
            wires: wiresPerSleeper,
            loadPerWire: (parseFloat(record.finalLoad) / wiresPerSleeper).toFixed(2),
            type: 'RT-1234'
        };
        setTensionRecords(prev => [newEntry, ...prev]);
        setScadaRecords(prev => prev.filter(r => r.id !== record.id));
        alert(`Record for Bench ${record.benchNo} witnessed for ${activeContainer?.name || 'Location'}.`);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;

        // Find the record before removing from state
        const recordToDelete = tensionRecords.find(r => r.id === id);

        // Remove locally
        setTensionRecords(prev => prev.filter(r => r.id !== id));

        // Background sync with backend
        const syncDelete = async () => {
            try {
                const batchNo = recordToDelete.batchNo;
                // Use the parent record stored in local state if available, or just the ID
                const parentId = recordToDelete.parentId; // Assuming we have parentId
                if (parentId) {
                    const batchData = { ...recordToDelete.fullBatchData }; // Assuming we store this
                    if (batchData) {
                        batchData.manualRecords = (batchData.manualRecords || []).filter(r => r.id !== id);
                        await apiService.updateWireTensioning(parentId, batchData);
                    }
                } else {
                    // Fallback to fetching ONLY if needed, but in background
                    const allResponse = await apiService.getAllWireTensioning();
                    const existingBatch = (allResponse?.responseData || []).find(b => String(b.batchNo) === String(batchNo));
                    if (existingBatch) {
                        const payload = {
                            ...existingBatch,
                            manualRecords: (existingBatch.manualRecords || []).filter(r => r.id !== id)
                        };
                        await apiService.updateWireTensioning(existingBatch.id, payload);
                    }
                }
                if (loadShiftData) loadShiftData().catch(() => { });
            } catch (error) {
                console.error('Delete sync failed:', error);
            }
        };

        syncDelete();
    };


    const handleFinalSave = async () => {
        if (!selectedBatch) {
            alert("Please select a batch first.");
            return;
        }

        setIsSaving(true);
        try {
            // 1. Prepare records for this batch
            const batchTensionRecords = tensionRecords.filter(r => String(r.batchNo) === String(selectedBatch));

            const manualRecords = batchTensionRecords
                .filter(r => r.source === 'Manual')
                .map(r => ({
                    id: typeof r.id === 'string' || r.id > 1000000000 ? 0 : r.id, // Use 0 for new local records (Date.now() are usually large)
                    batchNo: String(r.batchNo),
                    benchNo: String(r.benchNo),
                    time: r.time,
                    wireLength: parseFloat(r.wireLength) || 0,
                    crossSection: parseFloat(r.crossSection) || 0,
                    youngsModulus: parseFloat(r.youngsModulus || r.modulus) || 0,
                    measuredElongation: parseFloat(r.measuredElongation) || 0,
                    forceElongation: parseFloat(r.forceElongation) || 0,
                    totalLoad: parseFloat(r.totalLoad) || 0,
                    finalLoad: parseFloat(r.finalLoad) || 0
                }));

            const witnessedScadaRecords = batchTensionRecords
                .filter(r => r.source === 'Scada')
                .map(r => ({
                    id: typeof r.id === 'string' || r.id > 1000000000 ? 0 : r.id,
                    plcTime: r.time,
                    benchNo: String(r.benchNo),
                    wireLength: parseFloat(r.wireLength) || 0,
                    crossSection: parseFloat(r.crossSection) || 0,
                    youngsModulus: parseFloat(r.youngsModulus || r.modulus) || 0,
                    measuredElongation: parseFloat(r.measuredElongation) || 0,
                    forceElongation: parseFloat(r.forceElongation) || 0,
                    totalLoad: parseFloat(r.totalLoad) || 0,
                    finalLoad: parseFloat(r.finalLoad) || 0
                }));

            const [y, m, d] = (dutyDate || new Date().toISOString().split('T')[0]).split('-');
            const formattedDate = `${d}/${m}/${y}`;

            const payload = {
                batchNo: String(selectedBatch),
                sleeperType: "RT-1234",
                wiresPerSleeper: parseInt(wiresPerSleeper),
                targetLoadKn: 730,
                location: activeContainer?.name || 'Line I',
                locationType: (activeContainer?.name || 'Line I').toLowerCase().includes('shed') ? 'Shed' : 'Line',
                vendorCode: vendorCode || localStorage.getItem('vendorCode'),
                plantId: dutyUnit || localStorage.getItem('dutyUnit'),
                shift: selectedShift || localStorage.getItem('selectedShift'),
                date: formattedDate,
                entryDate: formattedDate,
                createdBy: userId || localStorage.getItem('userId'),
                updatedBy: userId || localStorage.getItem('userId'),
                manualRecords,
                scadaRecords: witnessedScadaRecords
            };

            // Directly trigger create – avoids slow historical list fetch
            await apiService.createWireTensioning(payload);

            // Immediate UI feedback
            setShowForm(false);
            if (loadShiftData) loadShiftData().catch(console.error);

            alert("Batch tensioning synced successfully.");
        } catch (error) {
            console.error("Save failed:", error);
            alert(`Failed to save: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };


    const handleSaveManual = async () => {
        if (!formData.batchNo || !formData.finalLoad) {
            alert('Required fields missing');
            return;
        }

        const newEntry = {
            ...formData,
            id: editId || Date.now(),
            location: activeContainer?.name || 'N/A',
            timestamp: new Date().toISOString(),
            source: 'Manual',
            wires: wiresPerSleeper,
            loadPerWire: (parseFloat(formData.finalLoad) / wiresPerSleeper).toFixed(2)
        };

        if (editId) {
            try {
                // If this is a backend-linked record (has parentId), update via Batch API
                if (editParentId) {
                    const batchResult = await apiService.getWireTensioningById(editParentId);
                    const batchData = batchResult?.responseData;

                    if (batchData) {
                        // Update individual record in list
                        batchData.manualRecords = (batchData.manualRecords || []).map(m => {
                            if (m.id === editId) {
                                return {
                                    ...m,
                                    batchNo: String(formData.batchNo),
                                    benchNo: String(formData.benchNo),
                                    time: formData.time,
                                    wireLength: parseFloat(formData.wireLength) || 0,
                                    crossSection: parseFloat(formData.crossSection) || 0,
                                    youngsModulus: parseFloat(formData.modulus) || 0,
                                    measuredElongation: parseFloat(formData.measuredElongation) || 0,
                                    forceElongation: parseFloat(formData.forceElongation) || 0,
                                    totalLoad: parseFloat(formData.totalLoad) || 0,
                                    finalLoad: parseFloat(formData.finalLoad) || 0
                                };
                            }
                            return m;
                        });

                        // Ensure keys match Swagger DTO
                        await apiService.updateWireTensioning(editParentId, batchData);
                    }
                } else {
                    // This was a purely local session record, handle accordingly (maybe call creation if we wanted, 
                    // but for now we just update local state if no parent exists)
                    console.warn("Editing local record without parentId. Updating state only.");
                }

                setTensionRecords(prev => prev.map(r => r.id === editId ? newEntry : r));
                alert('Record updated successfully');
                if (loadShiftData) loadShiftData().catch(console.error);
            } catch (error) {
                console.error('Update failed:', error);
                alert(`Failed to update: ${error.message}`);
            } finally {
                setEditId(null);
                setEditParentId(null);
                setEditOnly(false);
                setShowForm(false);
            }
        } else {
            setTensionRecords(prev => [newEntry, ...prev]);
        }

        setFormData(prev => ({
            ...prev,
            benchNo: '',
            wireLength: '',
            crossSection: '',
            modulus: '',
            measuredElongation: '',
            forceElongation: '',
            totalLoad: '',
            finalLoad: '',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        }));
    };

    const handleEdit = async (record) => {
        try {
            // Use parentId (Batch ID) for API call, if it exists
            const fetchId = record.parentId || record.id;
            const response = await apiService.getWireTensioningById(fetchId);
            const fetchedBatch = response?.responseData;

            // If we fetched a batch, find the record in it
            let targetRecord = record;
            if (fetchedBatch) {
                const foundInManual = (fetchedBatch.manualRecords || []).find(m => m.id === record.id);
                if (foundInManual) {
                    targetRecord = { 
                        ...foundInManual, 
                        parentId: fetchedBatch.id, // Ensure we keep track of the batch ID
                        batchNo: fetchedBatch.batchNo // Ensure batch info is kept
                    };
                }
            }

            setFormData({
                time: targetRecord.time,
                batchNo: targetRecord.batchNo,
                benchNo: targetRecord.benchNo,
                wireLength: targetRecord.wireLength || '',
                crossSection: targetRecord.crossSection || '',
                modulus: targetRecord.youngsModulus || targetRecord.modulus || '',
                measuredElongation: targetRecord.measuredElongation || '',
                forceElongation: targetRecord.forceElongation || '',
                totalLoad: targetRecord.totalLoad || '',
                finalLoad: targetRecord.finalLoad,
                type: targetRecord.sleeperType || 'RT-1234'
            });
            setEditId(targetRecord.id);
            setEditParentId(targetRecord.parentId || null);
        } catch (error) {
            console.error('Fetch failed, using local data:', error);
            setFormData({
                time: record.time,
                batchNo: record.batchNo,
                benchNo: record.benchNo,
                wireLength: record.wireLength || '',
                crossSection: record.crossSection || '',
                modulus: record.modulus || '',
                measuredElongation: record.measuredElongation || '',
                forceElongation: record.forceElongation || '',
                totalLoad: record.totalLoad || '',
                finalLoad: record.finalLoad,
                type: record.type || 'RT-1234'
            });
            setEditId(record.id);
            setEditParentId(record.parentId || null);
        }
        setEditOnly(true);
        if (setShowForm) setShowForm(true); else setViewMode('form');
    };

    const renderCards = () => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '2rem' }}>
            {[
                { id: 'stats', label: 'Statistics', color: '#3b82f6', desc: 'View tensioning distribution and variations.' },
                { id: 'witnessed', label: 'Current Witness Logs', color: '#10b981', desc: 'Manage witnessed and manual records.' },
                { id: 'scada', label: 'Scada Data', color: '#f59e0b', desc: 'Raw data from PLC tensioning system.' }
            ].map(tab => (
                <TensionSubCard
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

    const closeForm = () => { setShowForm(false); setEditOnly(false); setEditId(null); };

    const renderForm = () => (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={closeForm}>
            <div className="fade-in" style={{ width: '100%', maxWidth: '950px', maxHeight: '95vh', background: '#fff', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ background: '#42818c', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Wire Tensioning Form</h2>
                        <p style={{ margin: '2px 0 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>Long line wire pressure monitoring & verification</p>
                    </div>
                    <button onClick={closeForm} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', fontSize: '16px' }}>✕</button>
                </div>

                <div style={{ padding: '1.5rem', overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Section 1: Initial Declaration */}
                    <section style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', background: '#f8fafc' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#42818c', fontWeight: '800', borderBottom: '2px solid #42818c22', paddingBottom: '8px' }}>Section 1: Initial Declaration</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                            <div className="form-field">
                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>Location (Line / Shed)</label>
                                <select 
                                    value={selectedLocation} 
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                >
                                    <option value="">-- Select --</option>
                                    {/* Handle flattened array from effect */}
                                    {Array.isArray(locations) && locations.map((loc, idx) => (
                                        <option key={idx} value={loc}>{loc}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>Date of Casting</label>
                                <input 
                                    type="date" 
                                    value={selectedDate} 
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                            <div className="form-field">
                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>Batch Number</label>
                                <select 
                                    value={selectedBatch} 
                                    onChange={(e) => setSelectedBatch(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                >
                                    <option value="">-- Select --</option>
                                    {availableBatches.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: SCADA Fetched */}
                    <section style={{ border: '1px solid #fcd34d', borderRadius: '12px', padding: '1.25rem', background: '#fffbeb' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#b45309', fontWeight: '800', borderBottom: '2px solid #fcd34d66', paddingBottom: '8px' }}>Section 2: SCADA Fetched</h4>
                        {scadaData ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                                <div style={{ background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fef3c7' }}>
                                    <span style={{ fontSize: '10px', color: '#92400e' }}>PLC Time</span>
                                    <div style={{ fontWeight: '700' }}>{scadaData.time}</div>
                                </div>
                                <div style={{ background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fef3c7' }}>
                                    <span style={{ fontSize: '10px', color: '#92400e' }}>Bench No.</span>
                                    <div style={{ fontWeight: '700' }}>{scadaData.benchNo}</div>
                                </div>
                                <div style={{ background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fef3c7' }}>
                                    <span style={{ fontSize: '10px', color: '#92400e' }}>Final Load</span>
                                    <div style={{ fontWeight: '700' }}>{scadaData.finalLoad} KN</div>
                                </div>
                                <div style={{ background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fef3c7' }}>
                                    <span style={{ fontSize: '10px', color: '#92400e' }}>Status</span>
                                    <div style={{ fontWeight: '700', color: '#059669' }}>Fetched Successfully</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '1rem', color: '#d97706', fontWeight: '600', fontSize: '14px' }}>
                                ⚠️ No Scada Data found
                            </div>
                        )}
                    </section>

                    {/* Section 3: Manual Data Entry */}
                    <section style={{ border: '1px solid #86efac', borderRadius: '12px', padding: '1.25rem', background: '#f0fdf4' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#166534', fontWeight: '800', borderBottom: '2px solid #86efac66', paddingBottom: '8px' }}>Section 3: Manual Data Entry</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                            <div className="form-field">
                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>Bench No.</label>
                                <input 
                                    type="number" 
                                    name="benchNo"
                                    value={formData.benchNo}
                                    onChange={handleFormChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                            <div className="form-field">
                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>Time of Tensioning</label>
                                <input 
                                    type="time" 
                                    name="time"
                                    value={formData.time}
                                    onChange={handleFormChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                            <div className="form-field">
                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>Type of Sleeper</label>
                                <select 
                                    name="type"
                                    value={formData.type}
                                    onChange={handleFormChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                >
                                    <option value="RT-8746">RT-8746</option>
                                    <option value="RT-2496">RT-2496</option>
                                </select>
                            </div>
                            <div className="form-field">
                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>No. of Wires</label>
                                <input 
                                    type="number" 
                                    name="noOfWires"
                                    value={formData.noOfWires}
                                    onChange={handleFormChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                            <div className="form-field">
                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>Final Load (in KN)</label>
                                <input 
                                    type="number" 
                                    name="finalLoad"
                                    value={formData.finalLoad}
                                    onChange={handleFormChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                            <div className="form-field">
                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>Load Per Wire (in KN)</label>
                                <div style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: '700', color: '#42818c' }}>
                                    {formData.finalLoad && formData.noOfWires ? (parseFloat(formData.finalLoad) / parseInt(formData.noOfWires)).toFixed(2) : '0.00'}
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                            <button 
                                onClick={() => {
                                    if (!formData.benchNo || !formData.finalLoad) {
                                        alert('Please fill all manual entry fields');
                                        return;
                                    }
                                    const draft = {
                                        ...formData,
                                        id: Date.now(),
                                        loadPerWire: (parseFloat(formData.finalLoad) / parseInt(formData.noOfWires)).toFixed(2),
                                        source: 'Manual'
                                    };
                                    setManualDrafts(prev => [...prev, draft]);
                                    // Reset manual fields for next entry
                                    setFormData(prev => ({ ...prev, benchNo: '', finalLoad: '', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }));
                                }}
                                style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                            >
                                Move to Summary
                            </button>
                        </div>
                    </section>

                    {/* Section 4: Summary / Draft Save */}
                    <section style={{ border: '1px solid #94a3b8', borderRadius: '12px', padding: '1.25rem', background: '#f1f5f9' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#475569', fontWeight: '800', borderBottom: '2px solid #94a3b866', paddingBottom: '8px' }}>Section 4: Summary / Draft Save</h4>
                        <div className="table-responsive">
                            <table className="ui-table" style={{ background: '#fff' }}>
                                <thead>
                                    <tr>
                                        <th>Bench</th>
                                        <th>Time</th>
                                        <th>Sleeper Type</th>
                                        <th>Wires</th>
                                        <th>Final Load</th>
                                        <th>Load / Wire</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {manualDrafts.length === 0 ? (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>No records in draft summary.</td></tr>
                                    ) : (
                                        manualDrafts.map(draft => (
                                            <tr key={draft.id}>
                                                <td><strong>{draft.benchNo}</strong></td>
                                                <td>{draft.time}</td>
                                                <td>{draft.type}</td>
                                                <td>{draft.noOfWires}</td>
                                                <td>{draft.finalLoad} KN</td>
                                                <td style={{ fontWeight: '700', color: '#42818c' }}>{draft.loadPerWire} KN</td>
                                                <td>
                                                    <button 
                                                        onClick={() => setManualDrafts(prev => prev.filter(d => d.id !== draft.id))}
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '600' }}
                                                    >Remove</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                </div>

                {/* Footer Actions */}
                <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button onClick={closeForm} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                    <button 
                        onClick={async () => {
                            if (manualDrafts.length === 0) {
                                alert('Please add at least one record to summary');
                                return;
                            }
                            setIsSaving(true);
                            try {
                                const [y, m, d] = (selectedDate || new Date().toISOString().split('T')[0]).split('-');
                                const formattedDate = `${d}/${m}/${y}`;
                                
                                const payload = {
                                    batchNo: String(selectedBatch),
                                    location: selectedLocation,
                                    locationType: selectedLocation.toLowerCase().includes('shed') ? 'Shed' : 'Line',
                                    vendorCode: vendorCode || localStorage.getItem('vendorCode'),
                                    plantId: dutyUnit || localStorage.getItem('dutyUnit'),
                                    shift: selectedShift || localStorage.getItem('selectedShift'),
                                    date: formattedDate,
                                    entryDate: formattedDate,
                                    createdBy: userId || localStorage.getItem('userId'),
                                    manualRecords: manualDrafts.map(d => ({
                                        batchNo: String(selectedBatch),
                                        benchNo: String(d.benchNo),
                                        time: d.time,
                                        finalLoad: parseFloat(d.finalLoad),
                                        sleeperType: d.type,
                                        noOfWires: parseInt(d.noOfWires),
                                        loadPerWire: parseFloat(d.loadPerWire),
                                        source: 'Manual'
                                    }))
                                };
                                await apiService.createWireTensioning(payload);
                                alert('Records committed successfully');
                                setManualDrafts([]);
                                setShowForm(false);
                                if (loadShiftData) loadShiftData();
                            } catch (error) {
                                alert(`Failed to save: ${error.message}`);
                            } finally {
                                setIsSaving(false);
                            }
                        }}
                        disabled={isSaving || manualDrafts.length === 0}
                        style={{ 
                            padding: '10px 32px', 
                            borderRadius: '8px', 
                            border: 'none', 
                            background: '#42818c', 
                            color: '#fff', 
                            fontWeight: '800', 
                            cursor: (isSaving || manualDrafts.length === 0) ? 'not-allowed' : 'pointer',
                            opacity: (isSaving || manualDrafts.length === 0) ? 0.7 : 1
                        }}
                    >
                        {isSaving ? 'Processing...' : 'Commit Historical Logs'}
                    </button>
                </div>

            </div>
        </div>
    );

    const tabs = [
        { id: 'stats', label: 'Statistics', color: '#3b82f6' },
        { id: 'witnessed', label: 'Current Witness Logs', color: '#10b981' },
        { id: 'scada', label: 'Scada Data', color: '#f59e0b' }
    ];

    if (displayMode === 'inline') {
        return (
            <div className="wire-tension-inline" style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    {/* The Add New Entry button is now managed by the parent console */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {tabs.map((tab) => (
                            <TensionSubCard
                                key={tab.id}
                                id={tab.id}
                                title={tab.label}
                                color={tab.color}
                                statusDetail={
                                    tab.id === 'stats' ? 'Live Monitoring' :
                                        tab.id === 'witnessed' ? `${tensionRecords.length} Verified Entries` :
                                            'PLCs Connected'
                                }
                                isActive={viewMode === tab.id}
                                onClick={() => setViewMode(tab.id)}
                            />
                        ))}
                    </div>
                </div>

                <div className="inline-body" style={{ flexGrow: 1 }}>
                    {viewMode === 'stats' && (
                        <div className="fade-in">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>Select Batch:</label>
                                <select className="dash-select" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {availableBatches.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <WireTensionStats stats={wireTensionStats} />
                        </div>
                    )}

                    {viewMode === 'witnessed' && (
                        <div className="fade-in">
                            <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontWeight: '800' }}>Current Witness Logs</h4>
                            
                            {(() => {
                                const lineRecords = tensionRecords.filter(r => !(r.location || '').toLowerCase().includes('shed'));
                                const shedRecords = tensionRecords.filter(r => (r.location || '').toLowerCase().includes('shed'));

                                const renderTensionTable = (recordsSubset, title, groupColor) => (
                                    <div style={{ marginBottom: '2.5rem' }}>
                                        <div style={{ padding: '8px 16px', background: `${groupColor}10`, borderLeft: `4px solid ${groupColor}`, marginBottom: '12px' }}>
                                            <h4 style={{ margin: 0, fontSize: '0.85rem', color: groupColor, fontWeight: '800' }}>{title} ({recordsSubset.length})</h4>
                                        </div>
                                        <div className="table-outer-wrapper" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                            <table className="ui-table">
                                                <thead>
                                                    <tr>
                                                        <th>Location</th>
                                                        <th>Source</th>
                                                        <th>Time</th>
                                                        <th>Batch</th>
                                                        <th>Bench</th>
                                                        <th>Wire Length</th>
                                                        <th>Cross Section</th>
                                                        <th>Modulus</th>
                                                        <th>Measured Elong.</th>
                                                        <th>Force (Elong.)</th>
                                                        <th>Total Load</th>
                                                        <th>Final Load</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recordsSubset.map(entry => (
                                                        <tr key={entry.id}>
                                                            <td style={{ fontSize: '11px', color: '#64748b' }}>{entry.location || 'N/A'}</td>
                                                            <td><span className={`status-pill ${entry.source === 'Manual' ? 'manual' : 'witnessed'}`}>{entry.source}</span></td>
                                                            <td>{entry.time}</td>
                                                            <td>{entry.batchNo}</td>
                                                            <td><strong>{entry.benchNo}</strong></td>
                                                            <td>{entry.wireLength || '-'}</td>
                                                            <td>{entry.crossSection || '-'}</td>
                                                            <td>{entry.modulus || '-'}</td>
                                                            <td>{entry.measuredElongation || '-'}</td>
                                                            <td>{entry.forceElongation || '-'}</td>
                                                            <td>{entry.totalLoad || '-'}</td>
                                                            <td><strong>{entry.finalLoad} KN</strong></td>
                                                            <td>
                                                                {(() => {
                                                                    const canEdit = isEditable(entry);
                                                                    
                                                                    if (canEdit) {
                                                                        return (
                                                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                                                {entry.source === 'Manual' && <button className="btn-action mini" onClick={() => handleEdit(entry)}>Edit</button>}
                                                                                <button className="btn-action mini danger" style={{ background: '#fee2e2', color: '#ef4444', border: 'none' }} onClick={() => handleDelete(entry.id)}>Delete</button>
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', display: 'block', textAlign: 'center' }}>Locked</span>;
                                                                })()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );

                                return (
                                    <>
                                        {lineRecords.length > 0 && renderTensionTable(lineRecords, "LONG LINE TENSIONING", "#3b82f6")}
                                        {shedRecords.length > 0 && renderTensionTable(shedRecords, "SHED TENSIONING", "#8b5cf6")}
                                        {tensionRecords.length === 0 && (
                                            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontStyle: 'italic' }}>
                                                No records logged yet.
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    {viewMode === 'scada' && (
                        <div className="fade-in">
                            <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <label style={{ marginRight: '10px', fontSize: '0.8rem', fontWeight: 'bold' }}>Filter Batch:</label>
                                        <select className="dash-select" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                                            <option value="">-- All Batches --</option>
                                            {availableBatches.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                                        <span style={{ color: '#10b981' }}>● Verified By Witness</span> | <span style={{ color: '#f59e0b' }}>● Pending Validation</span>
                                    </div>
                                </div>
                                <table className="ui-table">
                                    <thead>
                                        <tr>
                                            <th>PLC Time</th>
                                            <th>Bench</th>
                                            <th>Wire Length</th>
                                            <th>Cross Section</th>
                                            <th>Modulus</th>
                                            <th>Measured Elongation</th>
                                            <th>Force (Elong.)</th>
                                            <th>Total Load</th>
                                            <th>Final Load</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            ...scadaRecords.map(r => ({ ...r, status: 'PENDING' })),
                                            ...(tensionRecords || []).filter(r => r.source === 'Scada').map(r => ({ ...r, status: 'VERIFIED' }))
                                        ]
                                            .filter(r => !selectedBatch || String(r.batchNo) === String(selectedBatch))
                                            .sort((a, b) => b.id - a.id)
                                            .map((r, idx) => (
                                                <tr key={idx}>
                                                    <td>{r.time || r.plcTime}</td>
                                                    <td><strong>{r.benchNo}</strong></td>
                                                    <td>{r.wireLength || '-'}</td>
                                                    <td>{r.crossSection || '-'}</td>
                                                    <td>{r.modulus || r.youngsModulus || '-'}</td>
                                                    <td>{r.measuredElongation || '-'}</td>
                                                    <td>{r.forceElongation || '-'}</td>
                                                    <td>{r.totalLoad || '-'}</td>
                                                    <td style={{ fontWeight: '700', color: '#42818c' }}>{r.finalLoad} KN</td>
                                                    <td>
                                                        {r.status === 'PENDING' ? (
                                                            <button className="btn-action" onClick={() => handleWitness(r)}>Witness</button>
                                                        ) : (
                                                            <span style={{
                                                                fontSize: '10px',
                                                                color: '#10b981',
                                                                fontWeight: 'bold',
                                                                padding: '2px 8px',
                                                                borderRadius: '10px',
                                                                background: '#ecfdf5',
                                                                border: '1px solid #10b98130'
                                                            }}>Verified ✓</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        {scadaRecords.length === 0 && tensionRecords.filter(r => r.source === 'Scada').length === 0 && (
                                            <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No SCADA data available.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {showForm && renderForm()}
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onBack}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '1600px', width: '98%', height: '90vh', display: 'flex', flexDirection: 'column' }}>
                <header className="modal-header">
                    <div>
                        <h2 style={{ margin: 0 }}>Wire Tensioning Control Console</h2>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Precision Load Integration & Assurance</p>
                    </div>
                    <button className="close-btn" onClick={onBack}>X</button>
                </header>

                <div className="modal-body" style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                        <button
                            className="toggle-btn"
                            onClick={() => {
                                setEditId(null);
                                setShowForm(true);
                            }}
                            style={{ 
                                fontSize: '0.75rem', 
                                padding: '6px 14px', 
                                background: '#0f172a', 
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: '8px', 
                                fontWeight: '700', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            <span style={{ fontSize: '1.1rem', fontWeight: '400' }}>+</span> Add New Analysis
                        </button>
                    </div>

                    {renderCards()}

                    {viewMode === 'stats' && (
                        <div className="fade-in">
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem', fontWeight: '800' }}>Tensioning Statistical Overview</h3>
                            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#64748b' }}>Select Batch:</label>
                                <select className="dash-select" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {availableBatches.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <WireTensionStats stats={wireTensionStats} />
                        </div>
                    )}

                    {viewMode === 'witnessed' && (
                        <div className="fade-in">
                            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', fontWeight: '800' }}>Current Witness Logs</h3>
                            <div className="table-outer-wrapper" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem' }}>
                                <table className="ui-table">
                                    <thead>
                                        <tr>
                                            <th>Source</th>
                                            <th>Time</th>
                                            <th>Batch</th>
                                            <th>Bench</th>
                                            <th>Wire Length</th>
                                            <th>Cross Section</th>
                                            <th>Modulus</th>
                                            <th>Measured Elong.</th>
                                            <th>Force (Elong.)</th>
                                            <th>Total Load</th>
                                            <th>Final Load</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tensionRecords.length === 0 ? (
                                            <tr><td colSpan="12" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No records logged yet.</td></tr>
                                        ) : (
                                            tensionRecords.map(entry => (
                                                <tr key={entry.id}>
                                                    <td><span className={`status-pill ${entry.source === 'Manual' ? 'manual' : 'witnessed'}`}>{entry.source}</span></td>
                                                    <td>{entry.time}</td>
                                                    <td>{entry.batchNo}</td>
                                                    <td>{entry.benchNo}</td>
                                                    <td>{entry.wireLength || '-'}</td>
                                                    <td>{entry.crossSection || '-'}</td>
                                                    <td>{entry.modulus || '-'}</td>
                                                    <td>{entry.measuredElongation || '-'}</td>
                                                    <td>{entry.forceElongation || '-'}</td>
                                                    <td>{entry.totalLoad || '-'}</td>
                                                    <td><strong style={{ color: '#0f172a' }}>{entry.finalLoad} KN</strong></td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            {entry.source === 'Manual' && <button className="btn-action mini" onClick={() => handleEdit(entry)}>Edit</button>}
                                                            <button className="btn-action mini danger" style={{ background: '#fee2e2', color: '#ef4444', border: 'none' }} onClick={() => handleDelete(entry.id)}>Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {viewMode === 'scada' && (
                        <div className="fade-in">
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem', fontWeight: '800' }}>Scada Data (Raw Feed)</h3>
                            <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <label style={{ marginRight: '10px', fontSize: '0.8125rem', fontWeight: '700', color: '#64748b' }}>Filter Batch:</label>
                                        <select className="dash-select" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                                            <option value="">-- All Batches --</option>
                                            {availableBatches.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                                        <span style={{ color: '#10b981' }}>● Verified By Witness</span> | <span style={{ color: '#f59e0b' }}>● Pending Validation</span>
                                    </div>
                                </div>
                                <table className="ui-table">
                                    <thead>
                                        <tr>
                                            <th>PLC Time</th>
                                            <th>Batch No.</th>
                                            <th>Bench</th>
                                            <th>Total Load</th>
                                            <th>Final Load</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            ...scadaRecords.map(r => ({ ...r, status: 'PENDING' })),
                                            ...(tensionRecords || []).filter(r => r.source === 'Scada').map(r => ({ ...r, status: 'VERIFIED' }))
                                        ]
                                            .filter(r => !selectedBatch || String(r.batchNo) === String(selectedBatch))
                                            .sort((a, b) => b.id - a.id)
                                            .map((r, idx) => (
                                                <tr key={idx}>
                                                    <td>{r.time || r.plcTime}</td>
                                                    <td>{r.batchNo}</td>
                                                    <td><strong>{r.benchNo}</strong></td>
                                                    <td>{r.totalLoad}</td>
                                                    <td style={{ fontWeight: '700' }}>{r.finalLoad} KN</td>
                                                    <td>
                                                        <span style={{
                                                            fontSize: '10px',
                                                            color: r.status === 'VERIFIED' ? '#10b981' : '#f59e0b',
                                                            fontWeight: 'bold',
                                                            padding: '2px 8px',
                                                            borderRadius: '10px',
                                                            background: r.status === 'VERIFIED' ? '#ecfdf5' : '#fffbeb',
                                                            border: `1px solid ${r.status === 'VERIFIED' ? '#10b98130' : '#f59e0b30'}`
                                                        }}>
                                                            {r.status === 'VERIFIED' ? 'VERIFIED' : 'PENDING WITNESS'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        {scadaRecords.length === 0 && tensionRecords.filter(r => r.source === 'Scada').length === 0 && (
                                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No SCADA data available.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {showForm && renderForm()}
                </div>
            </div>
        </div>
    );
};

export default WireTensioning;
