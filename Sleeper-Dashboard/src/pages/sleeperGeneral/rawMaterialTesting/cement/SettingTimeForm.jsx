import React, { useEffect, useState, useRef } from "react";
import { useShift } from "../../../../context/ShiftContext";
import { useToast } from "../../../../context/ToastContext";
import { getStoredUser } from "../../../../services/authService";
import { saveCementSettingTime, getCementSettingTimeByReqId, getCementSettingTimeById } from "../../../../services/workflowService";

const emptyRow = { time: "", needle: "", spot: "" };

export default function SettingTimeForm({ onSave, onCancel, inventoryData = [], initialType = "New consignment", activeRequestId, activeConsignmentNo, sharedNC, editId, editData }) {
    const { selectedShift, dutyDate, dutyLocation } = useShift();
    const toast = useToast();
    const user = getStoredUser();
    const hasNotifiedRef = useRef(false);

    const [loading, setLoading] = useState(false);
    const [header, setHeader] = useState({
        type: initialType,
        consignment: activeConsignmentNo || "",
        temp: "",
        weight: "400", // Default 400g for setting time
        nc: "",
        waterQty: "",
        waterAddTime: "",
        mouldTime: ""
    });

    const [rows, setRows] = useState([{ ...emptyRow }]);

    const [initialTime, setInitialTime] = useState(null);
    const [finalTime, setFinalTime] = useState(null);
    const [result, setResult] = useState("");
    const [editIdState, setEditIdState] = useState(editId || null);

    useEffect(() => {
        if (editId) setEditIdState(editId);
    }, [editId]);

    // Auto-fetch Normal Consistency if available
    useEffect(() => {
        if (sharedNC && (!header.nc || header.nc !== sharedNC)) {
            const ncVal = parseFloat(sharedNC);
            const weight = parseFloat(header.weight) || 400;
            const water = ((ncVal * 0.85 * weight) / 100).toFixed(1);
            setHeader(prev => ({ ...prev, nc: sharedNC, waterQty: water }));
        }
    }, [sharedNC, header.weight]);

    useEffect(() => {
        console.log("SettingTimeForm Props:", { initialType, editId, editData, activeConsignmentNo });
        const handleRecord = (record) => {
            if (!record) return;
            setHeader(prev => ({
                ...prev,
                type: record.typeOfTesting || prev.type,
                consignment: record.consignmentNo || record.consignment || activeConsignmentNo || prev.consignment,
                temp: record.roomTemp || record.temp || prev.temp,
                weight: record.weight || prev.weight || "400",
                nc: record.normalConsistency || prev.nc,
                waterQty: record.waterAdded || prev.waterQty,
                waterAddTime: record.timeOfAddingWater ? record.timeOfAddingWater.substring(0, 5) : prev.waterAddTime,
                mouldTime: record.mouldReadyAt ? record.mouldReadyAt.substring(0, 5) : prev.mouldTime
            }));
            if (record.observations && record.observations.length > 0) {
                const mapped = record.observations.map(o => ({
                    time: o.readingTime ? o.readingTime.substring(0, 5) : "",
                    needle: o.needlePenetration || "",
                    spot: o.finalSpot || ""
                }));
                setRows(mapped.length > 0 ? mapped : [{ ...emptyRow }]);
            }
        };

        if (activeRequestId) {
            getCementSettingTimeByReqId(activeRequestId).then(record => {
                if (record && (record.id || record.consignmentNo)) {
                    setEditIdState(record.id || null);
                    handleRecord(record);
                } else {
                    if (activeConsignmentNo) {
                        setHeader(prev => ({ ...prev, consignment: activeConsignmentNo }));
                    }
                    if (!hasNotifiedRef.current) {
                        toast.info("No previous Setting Time data found. You can start entering new test results.");
                        hasNotifiedRef.current = true;
                    }
                }
            });
        } else if (initialType === "Periodic" && (editId || editData)) {
            // Priority 1: Use pre-loaded data
            if (editData && (editData.consignmentNo || editData.timeOfAddingWater || editData.observations)) {
                handleRecord(editData);
            }
            
            // Priority 2: Fetch by ID
            if (editId) {
                getCementSettingTimeById(editId).then(record => {
                    if (record) {
                        handleRecord(record);
                    } else {
                        toast.info("No existing record found in history for this test.");
                    }
                });
            }
        }
    }, [activeRequestId, editId, editData, initialType]);

    const updateRow = (i, field, val) => {
        const copy = [...rows];
        copy[i][field] = val;
        setRows(copy);
    };

    // Calculate difference in minutes
    const diffMinutes = (t1, t2) => {
        if (!t1 || !t2) return null;
        const [h1, m1] = t1.split(":").map(Number);
        const [h2, m2] = t2.split(":").map(Number);
        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff < 0) diff += 1440; // Add 24 hours in minutes
        return diff;
    };

    useEffect(() => {
        if (!header.waterAddTime) return;

        let init = null;
        let fin = null;

        rows.forEach((r, idx) => {
            const mins = diffMinutes(header.waterAddTime, r.time);
            const needleVal = parseFloat(r.needle);

            // IST: Needle reading 5 +/- 0.5 mm
            if (init === null && !isNaN(needleVal) && needleVal >= 4.5 && needleVal <= 5.5 && mins >= 0) {
                init = mins;
            }

            // FST: Time where spot column is selected as "Yes" (C) - Time of adding water (A)
            if (fin === null && (r.spot?.toLowerCase() === 'yes') && r.time) {
                // Final Setting Time = C (observation time) - A (water add time)
                fin = diffMinutes(header.waterAddTime, r.time);
            }

        });

        setInitialTime(init);
        setFinalTime(fin);

        if (init !== null && fin !== null) {
            // Standard: IST >= 60, FST <= 600
            if (init >= 60 && fin <= 600) setResult("OK");
            else setResult("NOT OK");
        } else {
            setResult("");
        }
    }, [rows, header.waterAddTime]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                testDate: header.testDate || new Date().toISOString().split('T')[0],
                typeOfTesting: header.type,
                consignmentNo: header.consignment,
                roomTemp: parseFloat(header.temp),
                weight: parseFloat(header.weight),
                normalConsistency: parseFloat(header.nc),
                waterAdded: parseFloat(header.waterQty),
                timeOfAddingWater: header.waterAddTime ? `${header.waterAddTime}:00` : null,
                mouldReadyAt: header.mouldTime ? `${header.mouldTime}:00` : null,
                initialSettingTime: initialTime,
                finalSettingTime: finalTime,
                result: result,
                shift: selectedShift || 'General',
                lineNo: dutyLocation || 'N/A',
                dateOfInspection: dutyDate,
                requestId: activeRequestId || null,
                createdBy: user?.userId || 0,
                observations: rows
                    .filter(r => r.time) 
                    .map(r => ({
                        readingTime: `${r.time}:00`,
                        needlePenetration: r.needle ? parseFloat(r.needle) : 0, 
                        finalSpot: r.spot || "" 
                    }))
            };

            const resultSaved = await saveCementSettingTime(payload, editIdState);
            if (onSave) onSave(resultSaved || header.consignment);
            
            toast.success(`Setting Time Test record ${editIdState ? 'updated' : 'saved'} successfully!`);
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
                <h2>Setting Time Test – Cement</h2>
            </div>

            <div className="form-body">
                {/* HEADER */}
                <div className="form-grid">
                    <div className="input-group">
                        <label>Date <span className="required">*</span></label>
                        <input type="text" value={new Date().toLocaleDateString('en-GB')} readOnly style={{ background: '#f8fafc' }} />
                    </div>

                    <div className="input-group">
                        <label>Type <span className="required">*</span></label>
                        <select 
                            value={header.type}
                            onChange={(e) => setHeader({ ...header, type: e.target.value })}
                            required
                        >
                            <option value="">-- Select --</option>
                            <option value="New consignment">New consignment</option>
                            <option value="Periodic">Periodic</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Consignment No <span className="required">*</span></label>
                        {activeRequestId ? (
                            <input 
                                type="text"
                                value={header.consignment}
                                readOnly
                                style={{ background: '#f8fafc' }}
                            />
                        ) : header.type === 'Periodic' ? (
                            <input 
                                type="text"
                                placeholder="Enter Consignment No"
                                value={header.consignment}
                                onChange={(e) => setHeader({ ...header, consignment: e.target.value })}
                                required
                            />
                        ) : (
                            <select 
                                value={header.consignment}
                                onChange={(e) => setHeader({ ...header, consignment: e.target.value })}
                                required
                            >
                                <option value="">-- Select --</option>
                                {inventoryData.map(c => (
                                    <option key={c.consignmentNo} value={c.consignmentNo}>{c.consignmentNo} ({c.vendor})</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="input-group">
                        <label>Room Temp (°C)</label>
                        <input 
                            type="number" 
                            step="0.1"
                            placeholder="°C" 
                            value={header.temp}
                            onChange={(e) => setHeader({ ...header, temp: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Weight (gms)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            placeholder="gms" 
                            value={header.weight}
                            onChange={(e) => setHeader({ ...header, weight: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Normal Consistency (%)</label>
                        <input 
                            type="number" 
                            step="0.1"
                            placeholder="%" 
                            value={header.nc}
                            onChange={(e) => setHeader({ ...header, nc: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Water Added (ml)</label>
                        <input 
                            type="number" 
                            step="0.1"
                            placeholder="ml" 
                            value={header.waterQty}
                            onChange={(e) => setHeader({ ...header, waterQty: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Time of Adding Water</label>
                        <input 
                            type="time" 
                            value={header.waterAddTime}
                            onChange={(e) => setHeader({ ...header, waterAddTime: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Mould Ready at</label>
                        <input 
                            type="time" 
                            value={header.mouldTime}
                            onChange={(e) => setHeader({ ...header, mouldTime: e.target.value })}
                            required
                        />
                    </div>
                </div>

                {/* TABLE */}
                <div className="section-title">Observations</div>
                <div className="section-subtitle">Monitor needle penetration at regular intervals</div>

                <div className="table-container" style={{ maxHeight: "400px", overflowY: "auto" }}>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Reading Time</th>
                                <th>Needle (mm)</th>
                                <th>Final Spot?</th>
                            </tr>
                        </thead>

                        <tbody>
                            {(() => {
                                let istFoundGlobal = false;
                                return rows.map((r, i) => {
                                    const needleVal = parseFloat(r.needle);
                                    const isRowAfterIST = istFoundGlobal;
                                    
                                    // Check if this row is the IST row to hide subsequent ones for NEEDLE
                                    if (!istFoundGlobal && !isNaN(needleVal) && needleVal >= 4.5 && needleVal <= 5.5) {
                                        istFoundGlobal = true;
                                    }

                                    return (
                                        <tr key={i}>
                                            <td data-label="#" style={{ textAlign: 'center', fontWeight: 'bold' }}>{i + 1}</td>
                                            <td data-label="Reading Time">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input
                                                        type="time"
                                                        value={r.time}
                                                        onChange={(e) => updateRow(i, "time", e.target.value)}
                                                    />
                                                    <button 
                                                        type="button"
                                                        className="btn-action mini"
                                                        style={{ padding: '2px 8px', borderRadius: '4px', background: '#10b981', borderColor: '#10b981' }}
                                                        onClick={() => {
                                                            const newRows = [...rows];
                                                            newRows.splice(i + 1, 0, { ...emptyRow });
                                                            setRows(newRows);
                                                        }}
                                                        title="Add row below"
                                                    >
                                                        +
                                                    </button>
                                                    {rows.length > 1 && (
                                                        <button 
                                                            type="button"
                                                            className="btn-action mini danger"
                                                            style={{ padding: '2px 7px', borderRadius: '4px' }}
                                                            onClick={() => {
                                                                const newRows = rows.filter((_, idx) => idx !== i);
                                                                setRows(newRows);
                                                            }}
                                                            title="Delete row"
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td data-label="Needle (mm)">
                                                {!isRowAfterIST ? (
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={r.needle}
                                                        onChange={(e) => updateRow(i, "needle", e.target.value)}
                                                        placeholder="mm"
                                                    />
                                                ) : (
                                                    <div style={{ color: '#94a3b8', fontSize: '11px', fontStyle: 'italic', padding: '8px' }}>
                                                        IST Reached
                                                    </div>
                                                )}
                                            </td>

                                            <td data-label="Final Spot?">
                                                <select
                                                    value={r.spot}
                                                    onChange={(e) => updateRow(i, "spot", e.target.value)}
                                                >
                                                    <option value="">-- Select --</option>
                                                    <option value="yes">Yes</option>
                                                    <option value="no">No</option>
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                });
                            })()}
                        </tbody>
                    </table>
                </div>

                {/* RESULTS */}
                <div className="info-section">
                    <div className="info-title">Calculated Setting Times</div>
                    <div className="info-grid">
                        <div className="info-card">
                            <div className="info-card-label">Initial Setting Time</div>
                            <div className="info-card-value">{initialTime !== null ? `${initialTime} min` : "-"}</div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-label">Final Setting Time</div>
                            <div className="info-card-value">{finalTime !== null ? `${finalTime} min` : "-"}</div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-label">Overall Result</div>
                            <div className="info-card-value" style={{ color: result === "OK" ? "#10b981" : "#ef4444" }}>
                                {result || "-"}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="btn-group" style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <button type="submit" className="btn-save" disabled={loading}>
                        {loading ? "Saving..." : editIdState ? "Update Test Report" : "Submit Test Report"}
                    </button>
                    <button type="button" className="btn-save" style={{ background: '#64748b' }} onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            </div>
        </form>
    );
}
