import React, { useState, useEffect, useRef } from "react";
import { useShift } from "../../../../context/ShiftContext";
import { useToast } from "../../../../context/ToastContext";
import { getStoredUser } from "../../../../services/authService";
import { saveCement7DayStrength, getCement7DayStrengthByReqId, getCement7DayStrengthById } from "../../../../services/workflowService";

export default function SevenDayStrengthForm({ onSave, onCancel, inventoryData = [], initialType = "New consignment", activeRequestId, activeConsignmentNo, sharedNC, editId, editData }) {
    const { selectedShift, dutyDate, dutyLocation } = useShift();
    const toast = useToast();
    const user = getStoredUser();
    const hasNotifiedRef = useRef(false);

    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        typeOfTesting: initialType,
        consignmentNo: activeConsignmentNo || "",
        roomTemp: "",
        normalConsistency: "",
        waterRequired: 0,
        area: 4984.36, // Cross-sectional area in mm2
        cubes: [
            { castDate: "", castTime: "", testDate: "", testTime: "", loadNewton: "", strength: "", status: "Pending" },
            { castDate: "", castTime: "", testDate: "", testTime: "", loadNewton: "", strength: "", status: "Pending" },
            { castDate: "", castTime: "", testDate: "", testTime: "", loadNewton: "", strength: "", status: "Pending" }
        ],
        avgStrength: "",
        initialAvgStrength: "",
        validationRange: "",
        validationStatus: "",
        isValidTest: true,
        cubeResult: "",
        soundness: "",
        soundnessResult: ""
    });
    const [editIdState, setEditIdState] = useState(editId || null);

    useEffect(() => {
        if (editId) setEditIdState(editId);
    }, [editId]);

    // Auto-fetch Normal Consistency if available
    useEffect(() => {
        if (sharedNC && (!form.normalConsistency || form.normalConsistency !== sharedNC)) {
            setForm(prev => ({ ...prev, normalConsistency: sharedNC }));
        }
    }, [sharedNC]);

    useEffect(() => {
        console.log("SevenDayStrengthForm Props:", { initialType, editId, editData, activeConsignmentNo });
        const extractDate = (d) => {
            if (!d) return "";
            if (d.includes('T')) return d.split('T')[0];
            return d;
        };

        const handleRecord = (record) => {
            if (!record) return;
            setForm(prev => ({
                ...prev,
                typeOfTesting: record.typeOfTesting || prev.typeOfTesting,
                consignmentNo: record.consignmentNo || record.consignment || activeConsignmentNo || prev.consignmentNo,
                roomTemp: record.roomTemp || record.temp || prev.roomTemp,
                normalConsistency: record.normalConsistency || prev.normalConsistency,
                waterRequired: record.waterRequired || prev.waterRequired,
                area: record.area || prev.area || 4984.36,
                avgStrength: record.minStrength !== undefined && record.minStrength !== null ? record.minStrength : (record.avgStrength || prev.avgStrength),
                isValidTest: record.isValidTest !== undefined ? record.isValidTest : prev.isValidTest,
                cubeResult: record.cubeResult || prev.cubeResult,
                soundness: record.soundness || prev.soundness,
                soundnessResult: record.soundnessResult || prev.soundnessResult,
                cubes: record.cubes && record.cubes.length > 0 ? record.cubes.map(c => ({
                    castDate: extractDate(c.castDate),
                    castTime: c.castTime ? c.castTime.substring(0, 5) : "",
                    testDate: extractDate(c.testDate),
                    testTime: c.testTime ? c.testTime.substring(0, 5) : "",
                    loadNewton: c.loadNewton || (c.loadKn ? c.loadKn * 1000 : ""),
                    strength: c.strengthNmm2 || ""
                })) : prev.cubes
            }));
        };

        if (activeRequestId) {
            getCement7DayStrengthByReqId(activeRequestId).then(record => {
                if (record && (record.id || record.consignmentNo)) {
                    setEditIdState(record.id || null);
                    handleRecord(record);
                } else {
                    if (activeConsignmentNo) {
                        setForm(prev => ({ ...prev, consignmentNo: activeConsignmentNo }));
                    }
                    if (!hasNotifiedRef.current) {
                        toast.info("No previous 7-Day Strength data found. You can start entering new test results.");
                        hasNotifiedRef.current = true;
                    }
                }
            });
        } else if (initialType === "Periodic" && (editId || editData)) {
            // Priority 1: Use pre-loaded data
            if (editData && (editData.consignmentNo || editData.avgStrength || editData.cubeResult)) {
                handleRecord(editData);
            }
            
            // Priority 2: Fetch by ID
            if (editId) {
                getCement7DayStrengthById(editId).then(record => {
                    if (record) {
                        handleRecord(record);
                    } else {
                        toast.info("No existing record found in history for this test.");
                    }
                });
            }
        }
    }, [activeRequestId, editId, editData, initialType]);

    // Auto calculate water required
    useEffect(() => {
        if (form.normalConsistency) {
            const pVal = parseFloat(form.normalConsistency) || 0;
            const water = ((pVal / 4) + 3) * 800 / 100;
            setForm(prev => ({ ...prev, waterRequired: water.toFixed(2) }));
        }
    }, [form.normalConsistency]);

    // Auto calculate strength & validations
    useEffect(() => {
        const updatedCubes = form.cubes.map(c => {
            const loadN = parseFloat(c.loadNewton);
            const area = parseFloat(form.area) || 4984.36;
            if (!isNaN(loadN) && area > 0) {
                return { ...c, strength: (loadN / area).toFixed(2) };
            }
            return { ...c, strength: "" };
        });

        const strengths = updatedCubes
            .map(c => parseFloat(c.strength))
            .filter(v => !isNaN(v));

        if (strengths.length === 3) {
            const fc = strengths.reduce((a, b) => a + b, 0) / 3;
            const fca = 0.10 * fc; // 10% limit
            const rangeMin = (fc - fca).toFixed(2);
            const rangeMax = (fc + fca).toFixed(2);
            
            // Determine status for each cube based on range limits
            let acceptedCount = 0;
            const cubesWithStatus = updatedCubes.map(c => {
                const s = parseFloat(c.strength);
                if (!isNaN(s)) {
                    const isWithin = Math.abs(s - fc) <= fca;
                    if (isWithin) {
                        acceptedCount++;
                        return { ...c, status: "Accepted" };
                    } else {
                        return { ...c, status: "Discarded" };
                    }
                }
                return { ...c, status: "Pending" };
            });

            // Calculate final average of accepted strengths only
            const acceptedStrengths = cubesWithStatus
                .filter(c => c.status === "Accepted")
                .map(c => parseFloat(c.strength));

            const fcf = acceptedStrengths.length > 0
                ? acceptedStrengths.reduce((a, b) => a + b, 0) / acceptedStrengths.length
                : 0;

            const allWithinRange = acceptedCount === 3;
            let validationMsg = "";
            if (acceptedCount === 3) {
                validationMsg = "All cubes within 10% range of initial average.";
            } else if (acceptedCount === 2) {
                const discardedIndex = cubesWithStatus.findIndex(c => c.status === "Discarded");
                validationMsg = `Cube ${discardedIndex + 1} discarded (outside range). Average based on remaining 2 cubes.`;
            } else if (acceptedCount === 1) {
                const acceptedIndex = cubesWithStatus.findIndex(c => c.status === "Accepted");
                validationMsg = `2 cubes discarded (outside range). Accepted strength based on Cube ${acceptedIndex + 1} only.`;
            } else {
                validationMsg = "All cubes outside range. Test is unreliable.";
            }

            setForm(prev => ({
                ...prev,
                cubes: cubesWithStatus,
                initialAvgStrength: fc.toFixed(2),
                avgStrength: fcf.toFixed(2),
                isValidTest: acceptedCount > 0,
                validationRange: `${rangeMin} to ${rangeMax} N/mm²`,
                validationStatus: validationMsg,
                cubeResult: (fcf >= 37 && acceptedCount > 0) ? "Satisfactory" : 
                            (acceptedCount === 0) ? "Unreliable (Invalid)" : "Not Satisfactory"
            }));
        } else {
            // Only update strengths if not all 3 loads are present
            const cubesWithPending = updatedCubes.map(c => ({
                ...c,
                status: c.loadNewton ? "Calculated" : "Pending"
            }));
            
            const currentStr = JSON.stringify(form.cubes.map(c => ({ strength: c.strength, status: c.status })));
            const newStr = JSON.stringify(cubesWithPending.map(c => ({ strength: c.strength, status: c.status })));
            if (currentStr !== newStr) {
                setForm(prev => ({ 
                    ...prev, 
                    cubes: cubesWithPending,
                    initialAvgStrength: "",
                    validationRange: "",
                    validationStatus: "Pending inputs",
                    cubeResult: ""
                }));
            }
        }
    }, [form.cubes.map(c => c.loadNewton).join(','), form.area]);

    const updateCube = (index, field, value) => {
        const updated = [...form.cubes];
        updated[index][field] = value;
        setForm({ ...form, cubes: updated });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                testDate: form.testDate || new Date().toISOString().split('T')[0],
                typeOfTesting: form.typeOfTesting,
                consignmentNo: form.consignmentNo,
                roomTemp: parseFloat(form.roomTemp),
                normalConsistency: parseFloat(form.normalConsistency),
                waterRequired: parseFloat(form.waterRequired),
                area: parseFloat(form.area),
                minStrength: parseFloat(form.avgStrength),
                avgStrength: parseFloat(form.avgStrength),
                isValidTest: form.isValidTest,
                cubeResult: form.cubeResult,
                soundness: parseFloat(form.soundness),
                soundnessResult: form.soundnessResult,
                shift: selectedShift || 'General',
                lineNo: dutyLocation || 'N/A', // Using dutyLocation as shown in the screenshot pill
                dateOfInspection: dutyDate,
                requestId: activeRequestId || null,
                createdBy: user?.userId || 0,
                cubes: form.cubes.map(c => ({
                    castDate: c.castDate || null,
                    castTime: c.castTime ? `${c.castTime}:00` : null,
                    testDate: c.testDate || null,
                    testTime: c.testTime ? `${c.testTime}:00` : null,
                    loadKn: parseFloat(c.loadNewton) / 1000,
                    loadNewton: parseFloat(c.loadNewton),
                    strengthNmm2: parseFloat(c.strength)
                }))
            };

            const resultSaved = await saveCement7DayStrength(payload, editIdState);
            if (onSave) onSave(resultSaved || payload);

            toast.success(`Cement 7-Day Strength record ${editIdState ? 'updated' : 'saved'} successfully!`);
        } catch (error) {
            console.error("Save failed:", error);
            toast.error(error.message || "Unable to save test record. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="form-card" onSubmit={handleFormSubmit}>
            <div className="form-header">
                <h2>7 Day Compressive Strength of Cement Mortar Cubes</h2>
            </div>

            <div className="form-body">
                {/* Header Fields */}
                <div className="form-grid">
                    <div className="input-group">
                        <label>Date of Testing <span className="required">*</span></label>
                        <input type="text" value={new Date().toLocaleDateString('en-GB')} readOnly style={{ background: '#f8fafc' }} />
                    </div>
                    <div className="input-group">
                        <label>Type of Testing <span className="required">*</span></label>
                        <select
                            value={form.typeOfTesting}
                            onChange={e => setForm({ ...form, typeOfTesting: e.target.value })}
                            required
                        >
                            <option value="">-- Select --</option>
                            <option value="New consignment">New consignment</option>
                            <option value="Periodic">Periodic</option>
                        </select>
                        <div className="hint-text">Select testing category</div>
                    </div>

                    <div className="input-group">
                        <label>Consignment No <span className="required">*</span></label>
                        {activeRequestId ? (
                            <input 
                                type="text"
                                value={form.consignmentNo}
                                readOnly
                                style={{ background: '#f8fafc' }}
                            />
                        ) : form.typeOfTesting === 'Periodic' ? (
                            <input 
                                type="text"
                                placeholder="Enter Consignment No"
                                value={form.consignmentNo}
                                onChange={(e) => setForm({ ...form, consignmentNo: e.target.value })}
                                required
                            />
                        ) : (
                            <select
                                value={form.consignmentNo}
                                onChange={e => setForm({ ...form, consignmentNo: e.target.value })}
                                required
                            >
                                <option value="">-- Select --</option>
                                {inventoryData.map(c => (
                                    <option key={c.consignmentNo} value={c.consignmentNo}>{c.consignmentNo} ({c.vendor})</option>
                                ))}
                            </select>
                        )}
                        <div className="hint-text">Select verified consignment</div>
                    </div>

                    <div className="input-group">
                        <label>Room Temp (°C)</label>
                        <input
                            type="number"
                            step="0.1"
                            placeholder="°C"
                            value={form.roomTemp}
                            onChange={e => setForm({ ...form, roomTemp: e.target.value })}
                        />
                    </div>

                    <div className="input-group">
                        <label>Normal Consistency (%)</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="%"
                            value={form.normalConsistency}
                            onChange={e => setForm({ ...form, normalConsistency: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label>Cross-sectional Area (A) (mm²)</label>
                        <input
                            type="number"
                            value={form.area}
                            onChange={e => setForm({ ...form, area: e.target.value })}
                        />
                    </div>
                </div>

                <div className="info-section">
                    <div className="info-title">Calculated Parameters & Formula</div>
                    <div style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '13px', color: '#475569' }}>
                            <div><strong>P</strong> = Standard Consistency = <span style={{ color: '#0f766e', fontWeight: 'bold' }}>{form.normalConsistency || '0.00'}%</span></div>
                            <div><strong>A</strong> = Standard Sand Weight = <span style={{ color: '#0f766e', fontWeight: 'bold' }}>600 gm</span></div>
                            <div><strong>B</strong> = Cement Weight = <span style={{ color: '#0f766e', fontWeight: 'bold' }}>200 gm</span></div>
                            <div><strong>C</strong> = Total Weight (A + B) = <span style={{ color: '#0f766e', fontWeight: 'bold' }}>800 gm</span></div>
                        </div>
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '13px', color: '#1e293b' }}>
                            <div>
                                <strong>Water Required Formula:</strong>
                                <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', border: '1px solid #e2e8f0' }}>
                                    [(P/4 + 3) × (Mass of Cement + Sand weight)] / 100
                                </span>
                            </div>
                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>Calculation:</span>
                                <span style={{ fontFamily: 'monospace', color: '#64748b' }}>
                                    [({form.normalConsistency || 'P'}/4 + 3) × 800] / 100 = 
                                </span>
                                <strong style={{ color: '#0f766e', fontSize: '15px' }}>{form.waterRequired || '0.00'} ml</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cube Table */}
                <div className="section-title">Cube Test Details</div>
                <div className="section-subtitle">Enter measurements for each cube</div>
                <div className="table-container">
                    <table>
                        <thead>
                                <tr>
                                    <th>Cast Date</th>
                                    <th>Cast Time</th>
                                    <th>Test Date</th>
                                    <th>Test Time</th>
                                    <th>Load (Newton)</th>
                                    <th>Strength (N/mm²)</th>
                                    <th>Sample Status</th>
                                </tr>
                        </thead>
                        <tbody>
                            {form.cubes.map((cube, i) => (
                                <tr key={i}>
                                    <td data-label="Cast Date"><input type="date" value={cube.castDate} onChange={e => updateCube(i, "castDate", e.target.value)} /></td>
                                    <td data-label="Cast Time"><input type="time" value={cube.castTime} onChange={e => updateCube(i, "castTime", e.target.value)} /></td>
                                    <td data-label="Test Date"><input type="date" value={cube.testDate} onChange={e => updateCube(i, "testDate", e.target.value)} /></td>
                                    <td data-label="Test Time"><input type="time" value={cube.testTime} onChange={e => updateCube(i, "testTime", e.target.value)} /></td>
                                    <td data-label="Load (Newton)"><input type="number" step="1" placeholder="N" value={cube.loadNewton} onChange={e => updateCube(i, "loadNewton", e.target.value)} /></td>
                                    <td data-label="Strength (N/mm²)"><input type="number" value={cube.strength} readOnly style={{ background: '#f8fafc' }} /></td>
                                    <td data-label="Sample Status">
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            background: cube.status === 'Accepted' ? '#dcfce7' : cube.status === 'Discarded' ? '#fee2e2' : '#f3f4f6',
                                            color: cube.status === 'Accepted' ? '#15803d' : cube.status === 'Discarded' ? '#b91c1c' : '#4b5563'
                                        }}>
                                            {cube.status || 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Results Section */}
                <div className="info-section">
                    <div className="info-title">Test Calculations & Validation</div>
                    <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                        <div className="info-card">
                            <div className="info-card-label">Initial Avg Strength (fc)</div>
                            <div className="info-card-value" style={{ color: '#475569' }}>
                                {form.initialAvgStrength ? `${form.initialAvgStrength} N/mm²` : '-'}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Average of all 3 cubes</div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-label">10% Range Limit (fc ± 10%)</div>
                            <div className="info-card-value" style={{ fontSize: '0.85rem', color: '#475569' }}>
                                {form.validationRange ? (
                                    <div style={{ fontSize: '12px', lineHeight: '1.4', textAlign: 'left' }}>
                                        <div style={{ fontWeight: '600' }}>Range: {form.validationRange}</div>
                                        <div style={{ color: '#0369a1', fontSize: '11px', marginTop: '2px' }}>
                                            Min Limit (fc - fca) = {form.validationRange.split(' to ')[0]}
                                        </div>
                                        <div style={{ color: '#b91c1c', fontSize: '11px' }}>
                                            Max Limit (fc + fca) = {form.validationRange.split(' to ')[1]}
                                        </div>
                                    </div>
                                ) : '-'}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Allowed strength limit</div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-label">Final Accepted Strength (fcf)</div>
                            <div className="info-card-value" style={{ color: parseFloat(form.avgStrength) >= 37 ? "#10b981" : "#ef4444" }}>
                                {form.avgStrength ? `${form.avgStrength} N/mm²` : '-'}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Average of Accepted cubes only</div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-label">OPC 53 Overall Result</div>
                            <div className="info-card-value" style={{ color: form.cubeResult === "Satisfactory" ? "#10b981" : "#ef4444" }}>
                                {form.cubeResult || '-'}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Satisfactory if fcf ≥ 37 N/mm²</div>
                        </div>
                    </div>
                    {form.validationStatus && (
                        <div style={{
                            marginTop: '16px',
                            padding: '12px 16px',
                            background: form.isValidTest ? '#f0fdf4' : '#fef2f2',
                            border: `1px solid ${form.isValidTest ? '#bbf7d0' : '#fecaca'}`,
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: form.isValidTest ? '#166534' : '#991b1b',
                            fontWeight: '500'
                        }}>
                            📢 <strong>Validation Status:</strong> {form.validationStatus}
                        </div>
                    )}
                </div>

                <div className="section-divider"></div>

                {/* Soundness */}
                <div className="section-title">Soundness of Cement</div>
                <div className="section-subtitle">Measure the expansion of cement</div>

                <div className="form-grid">
                    <div className="input-group">
                        <label>Expansion (mm) <span className="required">*</span></label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Enter expansion"
                            value={form.soundness}
                            required
                            onChange={e =>
                                setForm({
                                    ...form,
                                    soundness: e.target.value,
                                    soundnessResult: e.target.value && e.target.value <= 5 ? "Satisfactory" : "Not Satisfactory"
                                })
                            }
                        />
                    </div>
                    <div className="input-group">
                        <label>Soundness Result</label>
                        <input value={form.soundnessResult} disabled style={{ background: '#f1f5f9' }} />
                    </div>
                </div>

                <div className="btn-group" style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <button type="submit" className="btn-save" disabled={loading}>
                        {loading ? "Saving..." : editIdState ? "Update Inspection Report" : "Save Inspection Report"}
                    </button>
                    <button type="button" className="btn-save" style={{ background: '#64748b' }} onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            </div>
        </form>
    );
}
