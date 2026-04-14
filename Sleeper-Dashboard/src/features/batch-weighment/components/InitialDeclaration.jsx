import React, { useState, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext';
import { apiService } from '../../../services/api';
import { useShift } from '../../../context/ShiftContext';

/**
 * InitialDeclaration Component
 * Configures sensors and batch set values for the shift.
 */
const InitialDeclaration = ({ batches: externalBatches, onBatchUpdate, onSensorUpdate, activeContainer, loadShiftData, initialSensors }) => {
    const { vendorCode, dutyUnit, selectedShift, dutyDate, userId, vendorId } = useShift();
    const [sensors, setSensors] = useState(initialSensors || {
        sensorStatus: 'Working', 
        sandType: '',
        location: '',
        castingDate: new Date().toISOString().split('T')[0],
        batchNo: ''
    });

    const [batches, setBatches] = useState([]);
    const [saving, setSaving] = useState(false);
    const [lastFiveMoisture, setLastFiveMoisture] = useState([]);
    const [availableLocations, setAvailableLocations] = useState([]);
    const [selectedMoistureReportId, setSelectedMoistureReportId] = useState('');
    const [fetchingMoistureDetail, setFetchingMoistureDetail] = useState(false);

    // Deriving IDs safely from Context or Storage
    const effectiveVendorId = vendorId || userId || localStorage.getItem('vendorId') || localStorage.getItem('userId') || vendorCode?.replace(':', '');
    const effectivePlantId = dutyUnit || localStorage.getItem('dutyUnit');
    console.log("Batch IDs:", { effectiveVendorId, effectivePlantId });

    // Fetch dynamic locations for the current plant
    useEffect(() => {
        const fetchLocations = async () => {
            if (effectivePlantId && effectiveVendorId) {
                try {
                    const response = await apiService.getPlantSheds(effectiveVendorId, effectivePlantId);
                    console.log("Plant Profile Response:", response);
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
                    console.error("Error fetching locations in batch form:", err);
                }
            }
        };
        fetchLocations();
    }, [effectivePlantId, effectiveVendorId]);

    // Fetch last five moisture reports on mount
    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await apiService.getLastFiveMoisture();
                if (res?.responseData) {
                    setLastFiveMoisture(res.responseData);
                }
            } catch (err) {
                console.error("Failed to fetch last 5 moisture reports:", err);
            }
        };
        fetchReports();
    }, []);

    // Handle Moisture Report Selection
    const handleMoistureReportSelect = async (e) => {
        const id = e.target.value;
        setSelectedMoistureReportId(id);
        if (!id) {
            setBatches([]);
            return;
        }

        const report = lastFiveMoisture.find(r => String(r.id) === String(id));
        
        setFetchingMoistureDetail(true);
        try {
            const res = await apiService.getMoistureAnalysisById(id);
            // Handle both {responseData: ...} and direct data responses
            const detail = res?.responseData || res;
            
            if (detail) {
                // Set Values (Dry Weights / Target Weights before moisture correction)
                const ca1Set = detail.actualCA1 ?? ca1S?.batchWtDry ?? 0;
                const ca2Set = detail.actualCA2 ?? ca2S?.batchWtDry ?? 0;
                const faSet = detail.actualFA ?? faS?.batchWtDry ?? 0;

                // Adjusted Weights (Adopted Weights after moisture correction)
                const ca1Adj = detail.wtAdoptedCa1 ?? ca1S?.adoptedWeight ?? 0;
                const ca2Adj = detail.wtAdoptedCa2 ?? ca2S?.adoptedWeight ?? 0;
                const faAdj = detail.wtAdoptedFa ?? faS?.adoptedWeight ?? 0;

                // Initialize/Update the batch card for this specific report
                setBatches([{
                    id: 1, 
                    batchNo: detail.batchNo || report?.batchNo || "",
                    parentId: id,
                    setValues: { 
                        ca1: ca1Set, 
                        ca2: ca2Set, 
                        fa: faSet, 
                        cement: detail.actualCement ?? detail.designCement ?? 0, 
                        water: detail.actualWater ?? detail.designWater ?? 0, 
                        admixture: detail.actualAdmix ?? detail.designAdmix ?? 1.44 
                    },
                    adjustedWeights: { 
                        ca1: ca1Adj, 
                        ca2: ca2Adj, 
                        fa: faAdj, 
                        cement: detail.actualCement ?? detail.designCement ?? 0, 
                        water: detail.adjustedWaterWt ?? detail.actualWater ?? 0, 
                        admixture: detail.actualAdmix ?? detail.designAdmix ?? 1.44 
                    },
                    proportionMatch: 'NOT OK'
                }]);
            }
        } catch (err) {
            console.error("Failed to fetch moisture details:", err);
        } finally {
            setFetchingMoistureDetail(false);
        }
    };

    // Note: Automatic synchronization from externalBatches is removed to enforce manual selection from the Lab Reports dropdown as requested.

    const handleSensorChange = (e) => {
        const { name, value, type } = e.target;
        setSensors(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBatchChange = (id, section, field, value) => {
        setBatches(prev => prev.map(batch => {
            if (batch.id === id) {
                const updatedBatch = { ...batch };
                if (section === 'batchNo') {
                    updatedBatch.batchNo = value;
                } else if (section === 'setValues') {
                    updatedBatch.setValues = { ...batch.setValues, [field]: parseFloat(value) || 0 };
                }

                const isMatch = Object.keys(updatedBatch.setValues).every(ing => {
                    const setVal = updatedBatch.setValues[ing];
                    const adjVal = updatedBatch.adjustedWeights[ing];
                    return adjVal > 0 ? (Math.abs(setVal - adjVal) / adjVal <= 0.01) : (setVal === 0);
                });
                updatedBatch.proportionMatch = isMatch ? 'OK' : 'NOT OK';
                return updatedBatch;
            }
            return batch;
        }));
    };

    const removeBatch = (id) => {
        setBatches([]);
        setSelectedMoistureReportId('');
    };

    const handleSaveDeclaration = async () => {
        if (batches.length === 0 || !selectedMoistureReportId) {
            alert("No Batch Selected. Please select a Batch Number from the dropdown above to start configuration.");
            return;
        }
        setSaving(true);
        try {
            // Priority: Use user-selected casting date, fallback to dutyDate or today
            const baseDate = sensors.castingDate || dutyDate || new Date().toISOString().split('T')[0];
            const [y, m, d] = (baseDate).split('-');
            const formattedDate = `${d}/${m}/${y}`;

            const selectedLocation = sensors.location || activeContainer?.name || 'Line I';
            const locationType = String(selectedLocation).toLowerCase().includes('shed') ? 'Shed' : 'Line';

            const currentUserIdStr = userId || localStorage.getItem('userId') || "0";
            const currentUserId = parseInt(currentUserIdStr, 10) || 0;

            const payload = {
                lineNo: selectedLocation,
                entryDate: formattedDate,
                sandType: sensors.sandType || "River Sand",
                moistureSensorStatus: String(sensors.sensorStatus || "WORKING").toUpperCase(),
                verifiedBy: "Operator",
                remarks: "Initial declaration",
                entryMode: "MANUAL",
                createdBy: currentUserId,
                updatedBy: currentUserId,
                vendorCode: vendorCode || localStorage.getItem('vendorCode'),
                plantId: dutyUnit || localStorage.getItem('dutyUnit'),
                shift: selectedShift || localStorage.getItem('selectedShift'),
                batchDetails: batches.map(b => ({
                    batchNo: String(sensors.batchNo || b.batchNo || "0"),
                    proportionStatus: b.proportionMatch || "OK",
                    ca1Ref: parseFloat(b.adjustedWeights?.ca1) || 0,
                    ca2Ref: parseFloat(b.adjustedWeights?.ca2) || 0,
                    faRef: parseFloat(b.adjustedWeights?.fa) || 0,
                    cementRef: parseFloat(b.adjustedWeights?.cement) || 0,
                    waterRef: parseFloat(b.adjustedWeights?.water) || 0,
                    admixtureRef: parseFloat(b.adjustedWeights?.admixture) || 0,
                    ca1Set: parseFloat(b.setValues?.ca1) || 0,
                    ca2Set: parseFloat(b.setValues?.ca2) || 0,
                    faSet: parseFloat(b.setValues?.fa) || 0,
                    cementSet: parseFloat(b.setValues?.cement) || 0,
                    waterSet: parseFloat(b.setValues?.water) || 0,
                    admixtureSet: parseFloat(b.setValues?.admixture) || 0
                })),
                scadaRecords: [],
                manualRecords: []
            };

            await apiService.createBatchWeighment(payload);

            if (loadShiftData) loadShiftData().catch(() => { });
            alert("Declaration deployed successfully!");
            if (onBatchUpdate) onBatchUpdate(batches);

        } catch (error) {
            console.error("Save error:", error);
            alert(`Failed to save to backend: ${error.message}. Data preserved in local session.`);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            onBatchUpdate(batches);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [batches, onBatchUpdate]);

    useEffect(() => {
        if (onSensorUpdate) {
            onSensorUpdate(sensors);
        }
    }, [sensors, onSensorUpdate]);

    return (
        <div className="declaration-flow">
            <div className="form-section-header">
                <h4>Sensor & Lab Integration</h4>
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(6, 1fr)', 
                gap: '8px', 
                alignItems: 'end',
                background: '#fff',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '1rem'
            }}>
                <div className="input-group">
                    <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '2px', display: 'block' }}>Sensor</label>
                    <select 
                        name="sensorStatus" 
                        value={sensors.sensorStatus} 
                        onChange={handleSensorChange}
                        style={{ width: '100%', height: '32px', borderRadius: '4px', border: '1.5px solid #e2e8f0', fontSize: '11px', padding: '0 4px' }}
                    >
                        <option value="Not available">Not available</option>
                        <option value="Working">Working</option>
                        <option value="Not Working">Not Working</option>
                    </select>
                </div>

                <div className="input-group">
                    <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '2px', display: 'block' }}>Sand Type</label>
                    <select 
                        name="sandType" 
                        value={sensors.sandType} 
                        onChange={handleSensorChange}
                        style={{ width: '100%', height: '32px', borderRadius: '4px', border: '1.5px solid #e2e8f0', fontSize: '11px', padding: '0 4px' }}
                    >
                        <option value="">-- Select --</option>
                        <option value="M-Sand">M-Sand</option>
                        <option value="Natural Sand">Natural Sand</option>
                    </select>
                </div>

                <div className="input-group">
                    <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '2px', display: 'block' }}>Location</label>
                    <select 
                        name="location" 
                        value={sensors.location} 
                        onChange={handleSensorChange}
                        style={{ width: '100%', height: '32px', borderRadius: '4px', border: '1.5px solid #e2e8f0', fontSize: '11px', padding: '0 4px' }}
                    >
                        <option value="">-- Select --</option>
                        {availableLocations.map((loc, i) => <option key={i} value={loc}>{loc}</option>)}
                    </select>
                </div>

                <div className="input-group">
                    <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '2px', display: 'block' }}>Moisture Analysis</label>
                    <select 
                        value={selectedMoistureReportId} 
                        onChange={handleMoistureReportSelect}
                        style={{ 
                            width: '100%', 
                            height: '32px', 
                            borderRadius: '4px', 
                            border: (selectedMoistureReportId ? '1.5px solid #42818c' : '1.5px solid #ef4444'),
                            fontSize: '10px',
                            fontWeight: '600',
                            padding: '0 4px'
                        }}
                    >
                        <option value="">-- Choose Lab Report --</option>
                        {lastFiveMoisture.map(report => (
                            <option key={report.id} value={report.id}>
                                Batch #{report.batchNo} ({report.entryDate} {report.time || ''})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="input-group">
                    <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '2px', display: 'block' }}>Date of Casting</label>
                    <input 
                        type="date"
                        name="castingDate"
                        value={sensors.castingDate}
                        onChange={handleSensorChange}
                        style={{ width: '100%', height: '32px', borderRadius: '4px', border: '1.5px solid #e2e8f0', fontSize: '11px', padding: '0 4px' }}
                    />
                </div>

                <div className="input-group">
                    <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '2px', display: 'block' }}>Batch Number</label>
                    <input 
                        type="text"
                        name="batchNo"
                        value={sensors.batchNo}
                        onChange={handleSensorChange}
                        placeholder="e.g. 101"
                        style={{ width: '100%', height: '32px', borderRadius: '4px', border: '1.5px solid #e2e8f0', fontSize: '11px', padding: '0 8px' }}
                    />
                </div>
            </div>

            {(!selectedMoistureReportId || batches.length === 0) && !fetchingMoistureDetail && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #cbd5e1', color: '#64748b' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1.5rem', opacity: 0.5 }}>📊</div>
                    <h5 style={{ margin: '0 0 8px 0', color: '#334155', fontSize: '1.1rem', fontWeight: '800' }}>No Batch Selected</h5>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>Please select a Batch Number from the dropdown above to start configuration.</p>
                </div>
            )}

            {batches.map((batch) => (
                <div key={batch.id} className="batch-card fade-in" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#42818c', color: 'white', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.2rem' }}>
                                <span style={{ margin: 'auto' }}>{batch.batchNo.slice(-1) || 'B'}</span>
                            </div>
                            <div>
                                <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: '#1e293b' }}>Batch Configuration: #{batch.batchNo}</h5>
                                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Verified and Adjusted from Lab Analysis</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div className="mini-label">Status</div>
                                <div style={{
                                    fontSize: '0.65rem', fontWeight: '800', padding: '4px 12px', borderRadius: '50px',
                                    border: `1px solid ${batch.proportionMatch === 'OK' ? '#059669' : '#dc2626'}`,
                                    color: batch.proportionMatch === 'OK' ? '#059669' : '#dc2626',
                                    background: batch.proportionMatch === 'OK' ? '#f0fdf4' : '#fef2f2'
                                }}>{batch.proportionMatch}</div>
                            </div>
                            <button className="toggle-btn secondary" onClick={() => removeBatch(batch.id)} style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Clear Selection</button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: '#f0f9fa', borderRadius: '8px', fontSize: '0.8rem', color: '#42818c', border: '1px solid #c8e2e6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#42818c' }}></div>
                        <strong>Active Calibration:</strong> Lab Report #{lastFiveMoisture.find(r => String(r.id) === String(selectedMoistureReportId))?.batchNo}
                    </div>

                    <div className="calculated-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
                        {Object.keys(batch.setValues).map(ing => {
                            const adjVal = batch.adjustedWeights[ing];
                            return (
                                <div key={ing} className="calc-card" style={{ padding: '0.4rem', border: '1px solid #e2e8f0', background: '#fff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                                        <span className="calc-label" style={{ textTransform: 'uppercase', fontSize: '10px' }}>{ing}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <div className="calc-value" style={{ height: '28px', display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', padding: '0 8px', borderRadius: '4px', background: '#f8fafc', fontSize: '11px', fontWeight: '700' }}>{adjVal}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            <div className="form-actions-center" style={{ marginTop: '1rem', flexWrap: 'wrap', gap: '12px', display: 'none' }}>
                {/* Deploy Configuration button removed as requested */}
            </div>
        </div>
    );
};

export default InitialDeclaration;
