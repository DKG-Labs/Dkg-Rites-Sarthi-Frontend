import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useShift } from "../../../../context/ShiftContext";
import { useToast } from "../../../../context/ToastContext";
import { saveAggregate20mmQuality, getAggregate20mmQualityByReqId, getAggregate20mmQualityById } from "../../../../services/workflowService";

export default function CrushingImpactAbrasion20mm({ onSave, onCancel, inventoryData = [], initialType = "New Inventory", activeRequestId, editId, editData }) {
    const { selectedShift, dutyDate, dutyLocation } = useShift();
    const toast = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [editIdState, setEditIdState] = useState(editId || null);

    const { register, watch, setValue, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            testDate: new Date().toISOString().split('T')[0],
            typeOfTesting: initialType
        }
    });

    useEffect(() => {
        console.log("Crushing20mmForm Props:", { initialType, editId, editData });
        
        const handleRecord = (record) => {
            if (!record) return;
            console.log("Processing Crushing 20mm Record:", record);
            if (record.id) setEditIdState(record.id);
            reset({
                ...record,
                abrasionCoarserWt: record.abrasionPassingWt, // Map DB value back to frontend field
                typeOfTesting: record.typeOfTesting || "Periodic",
                consignmentNo: record.consignmentNo || record.consignment || watch("consignmentNo"),
                testDate: record.testDate ? record.testDate.substring(0, 10) : new Date().toISOString().split('T')[0]
            });
        };

        if (activeRequestId) {
            const row = inventoryData.find(i => i.requestId === activeRequestId);
            if (row) setValue("consignmentNo", row.consignmentNo);
            
            getAggregate20mmQualityByReqId(activeRequestId).then(record => {
                if (record && (record.id || record.consignmentNo)) {
                    handleRecord(record);
                } else {
                    toast.info("No previous 20mm Quality data found. You can start entering new test results.");
                }
            });
        } else if (initialType === "Periodic" && (editId || editData)) {
            // Priority 1: Immediate data (props)
            if (editData && (editData.consignmentNo || editData.crushingValue)) {
                handleRecord(editData);
            }
            // Priority 2: Sync with latest from DB
            if (editId) {
                getAggregate20mmQualityById(editId).then(record => {
                    if (record) {
                        handleRecord(record);
                    } else {
                        toast.info("No existing record found in history for this test.");
                    }
                });
            }
        }
    }, [activeRequestId, editId, editData, initialType, reset, setValue, inventoryData]);

    // Sections toggle state
    const [expanded, setExpanded] = useState({
        crushing: true,
        impact: false,
        abrasion: false
    });

    const toggle = (section) => setExpanded(prev => ({ ...prev, [section]: !prev[section] }));

    // Watch fields for calculations
    const cMouldWt = watch("crushingMouldWt");
    const cMouldSampleWt = watch("crushingMouldSampleWt");
    const cPassingWt = watch("crushingPassingWt");

    const iMouldWt = watch("impactMouldWt");
    const iMouldSampleWt = watch("impactMouldSampleWt");
    const iPassingWt = watch("impactPassingWt");

    const aSampleWt = watch("abrasionSampleWt");
    const aCoarserWt = watch("abrasionCoarserWt");

    // Crushing Calculations
    useEffect(() => {
        if (cMouldWt && cMouldSampleWt) {
            const sampleWt = Number(cMouldSampleWt) - Number(cMouldWt);
            setValue("crushingSampleWt", sampleWt.toFixed(2));
            if (cPassingWt && sampleWt > 0) {
                const val = (Number(cPassingWt) / sampleWt) * 100;
                setValue("crushingValue", val.toFixed(2));
                setValue("crushingResult", val <= 30 ? "Satisfactory" : "Unsatisfactory");
            }
        }
    }, [cMouldWt, cMouldSampleWt, cPassingWt, setValue]);

    // Impact Calculations
    useEffect(() => {
        if (iMouldWt && iMouldSampleWt) {
            const sampleWt = Number(iMouldSampleWt) - Number(iMouldWt);
            setValue("impactSampleWt", sampleWt.toFixed(2));
            if (iPassingWt && sampleWt > 0) {
                const val = (Number(iPassingWt) / sampleWt) * 100;
                setValue("impactValue", val.toFixed(2));
                setValue("impactResult", val <= 30 ? "Satisfactory" : "Unsatisfactory");
            }
        }
    }, [iMouldWt, iMouldSampleWt, iPassingWt, setValue]);

    // Abrasion Calculations (A = {(B-C)/B} * 100)
    useEffect(() => {
        if (aSampleWt && aCoarserWt) {
            const B = Number(aSampleWt);
            const C = Number(aCoarserWt);
            if (B > 0) {
                const val = ((B - C) / B) * 100;
                setValue("abrasionValue", val.toFixed(2));
                setValue("abrasionResult", val <= 30 ? "Satisfactory" : "Unsatisfactory");
            }
        }
    }, [aSampleWt, aCoarserWt, setValue]);

    const onSubmit = async (formData) => {
        setSubmitting(true);
        try {
            const payload = { ...formData };
            payload.shift = selectedShift || 'General';
            payload.lineNo = dutyLocation || 'N/A';
            payload.dateOfInspection = dutyDate;
            payload.requestId = activeRequestId || null;
            payload.createdBy = parseInt(localStorage.getItem('userId') || '1', 10);
            if (formData.abrasionCoarserWt !== undefined && formData.abrasionCoarserWt !== null && formData.abrasionCoarserWt !== "") {
                payload.abrasionPassingWt = parseFloat(formData.abrasionCoarserWt);
            }

            const resultSaved = await saveAggregate20mmQuality(payload, editIdState);
            if (onSave) onSave(resultSaved || payload);
            
            toast.success(`Test Report for 20mm Quality ${editIdState ? 'updated' : 'saved'} successfully!`);
        } catch (error) {
            console.error("Error saving 20mm quality data:", error);
            toast.error(error.message || "Failed to save 20mm Quality report. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="cement-forms-scope">
            <div className="form-card">
                <div className="form-header">
                    <h2>Aggregate – Raw Material Testing: 20mm Crushing, Impact and Abrasion</h2>
                </div>

                <div className="form-body">
                    <div className="form-grid">
                        <div className="input-group">
                            <label>Date of Testing <span className="required">*</span></label>
                            <input type="date" {...register("testDate", { required: "Required" })} />
                        </div>

                        <div className="input-group">
                            <label>Consignment No. <span className="required">*</span></label>
                            {activeRequestId ? (
                                <input
                                    type="text"
                                    readOnly
                                    className="readOnly"
                                    style={{ background: '#f8fafc' }}
                                    {...register("consignmentNo")}
                                />
                            ) : watch("typeOfTesting") === 'Periodic' ? (
                                <input
                                    type="text"
                                    placeholder="Enter Consignment No"
                                    {...register("consignmentNo", { required: "Required" })}
                                />
                            ) : (
                                <select {...register("consignmentNo", { required: "Required" })}>
                                    <option value="">-- Select --</option>
                                    {inventoryData.map((c, i) => (
                                        <option key={i} value={c.consignmentNo}>{c.consignmentNo} ({c.vendor})</option>
                                    ))}
                                </select>
                            )}
                            {errors.consignmentNo && <span className="hint-text" style={{ color: 'red' }}>{errors.consignmentNo.message}</span>}
                        </div>

                        <div className="input-group">
                            <label>Type of Testing</label>
                            <select {...register("typeOfTesting")}>
                                <option value="New Inventory">New Inventory</option>
                                <option value="Periodic">Periodic</option>
                            </select>
                        </div>
                    </div>

                    {/* Section 1: Crushing */}
                    <div className="section-divider"></div>
                    <div className="section-title" onClick={() => toggle('crushing')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {expanded.crushing ? '▼' : '▶'} Section 1: Crushing Test (Max 30%)
                    </div>
                    {expanded.crushing && (
                        <div className="form-grid" style={{ marginTop: '1rem' }}>
                            <div className="input-group">
                                <label>Weight of Mould (gms) <span className="required">*</span></label>
                                <input type="number" step="0.01" {...register("crushingMouldWt", { required: "Required" })} />
                            </div>
                            <div className="input-group">
                                <label>Weight of Mould + Sample (gms) <span className="required">*</span></label>
                                <input type="number" step="0.01" {...register("crushingMouldSampleWt", { required: "Required" })} />
                            </div>
                            <div className="input-group">
                                <label>Weight of Sample (gms)</label>
                                <input type="number" readOnly className="readOnly" {...register("crushingSampleWt")} />
                            </div>
                            <div className="input-group">
                                <label>Passing through 2.36mm sieve (gms) <span className="required">*</span></label>
                                <input type="number" step="0.01" {...register("crushingPassingWt", { required: "Required" })} />
                            </div>
                            <div className="input-group">
                                <label>Aggregate Crushing Value (%)</label>
                                <input type="number" readOnly className="readOnly" {...register("crushingValue")} />
                            </div>
                            <div className="input-group">
                                <label>Result of Crushing Test</label>
                                <input type="text" readOnly className="readOnly" {...register("crushingResult")} />
                            </div>
                        </div>
                    )}

                    {/* Section 2: Impact */}
                    <div className="section-divider"></div>
                    <div className="section-title" onClick={() => toggle('impact')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {expanded.impact ? '▼' : '▶'} Section 2: Impact Test (Max 30%)
                    </div>
                    {expanded.impact && (
                        <div className="form-grid" style={{ marginTop: '1rem' }}>
                            <div className="input-group">
                                <label>Weight of Mould (gms) <span className="required">*</span></label>
                                <input type="number" step="0.01" {...register("impactMouldWt", { required: "Required" })} />
                            </div>
                            <div className="input-group">
                                <label>Weight of Mould + Sample (gms) <span className="required">*</span></label>
                                <input type="number" step="0.01" {...register("impactMouldSampleWt", { required: "Required" })} />
                            </div>
                            <div className="input-group">
                                <label>Weight of Sample (gms)</label>
                                <input type="number" readOnly className="readOnly" {...register("impactSampleWt")} />
                            </div>
                            <div className="input-group">
                                <label>Passing through 2.36mm sieve (gms) <span className="required">*</span></label>
                                <input type="number" step="0.01" {...register("impactPassingWt", { required: "Required" })} />
                            </div>
                            <div className="input-group">
                                <label>Aggregate Impact Value (%)</label>
                                <input type="number" readOnly className="readOnly" {...register("impactValue")} />
                            </div>
                            <div className="input-group">
                                <label>Result of Impact Test</label>
                                <input type="text" readOnly className="readOnly" {...register("impactResult")} />
                            </div>
                        </div>
                    )}

                    {/* Section 3: Abrasion */}
                    <div className="section-divider"></div>
                    <div className="section-title" onClick={() => toggle('abrasion')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {expanded.abrasion ? '▼' : '▶'} Section 3: Abrasion Test (Max 30%)
                    </div>
                    {expanded.abrasion && (
                        <div className="form-grid" style={{ marginTop: '1rem' }}>
                            <div className="input-group">
                                <label>Weight of Sample (gms) [B] <span className="required">*</span></label>
                                <input type="number" step="0.01" {...register("abrasionSampleWt", { required: "Required" })} />
                            </div>
                            <div className="input-group">
                                <label>Weight of material Coarser than 1.7 mm Size (gms) [C] <span className="required">*</span></label>
                                <input type="number" step="0.01" {...register("abrasionCoarserWt", { required: "Required" })} />
                                <span className="hint-text" style={{ fontSize: '10px', color: '#64748b' }}>Formula: (B - C) / B × 100</span>
                            </div>
                            <div className="input-group">
                                <label>Aggregate Abrasion Value (%) [A]</label>
                                <input type="number" readOnly className="readOnly" {...register("abrasionValue")} />
                            </div>
                            <div className="input-group">
                                <label>Result of Abrasion Test</label>
                                <input type="text" readOnly className="readOnly" {...register("abrasionResult")} />
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn-save" disabled={submitting}>
                            {submitting ? 'Saving...' : editIdState ? 'Update Test Report' : 'Submit Test Report'}
                        </button>
                        {onCancel && <button type="button" onClick={onCancel} className="btn-save" style={{ background: '#64748b' }} disabled={submitting}>Cancel</button>}
                    </div>
                </div>
            </div>
        </form>
    );
}
