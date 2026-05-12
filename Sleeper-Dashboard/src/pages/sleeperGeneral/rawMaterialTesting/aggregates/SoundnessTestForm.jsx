import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useShift } from "../../../../context/ShiftContext";
import { useToast } from "../../../../context/ToastContext";
import { saveAggregateSoundness, getAggregateSoundnessByReqId, getAggregateSoundnessById } from "../../../../services/workflowService";

export default function SoundnessTestForm({ onSave, onCancel, inventoryData = [], initialType = "New Inventory", activeRequestId, editId, editData }) {
    const { selectedShift, dutyLocation, dutyDate } = useShift();
    const toast = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [editIdState, setEditIdState] = useState(editId || null);

    const { register, watch, setValue, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            testDate: new Date().toISOString().split('T')[0],
            cycles: 5
        }
    });

    useEffect(() => {
        console.log("SoundnessForm Props:", { initialType, editId, editData });
        
        const handleRecord = (record) => {
            if (!record) return;
            console.log("Processing Soundness Record:", record);
            if (record.id) setEditIdState(record.id);
            reset({
                ...record,
                typeOfTesting: record.typeOfTesting || "Periodic",
                consignmentNo: record.consignmentNo || record.consignment || watch("consignmentNo"),
                testDate: record.testDate ? record.testDate.substring(0, 10) : new Date().toISOString().split('T')[0]
            });
        };

        if (activeRequestId) {
            const row = inventoryData.find(i => i.requestId === activeRequestId);
            if (row) setValue("consignmentNo", row.consignmentNo);
            
            getAggregateSoundnessByReqId(activeRequestId).then(record => {
                if (record && (record.id || record.consignmentNo)) {
                    handleRecord(record);
                } else {
                    toast.info("No previous Soundness data found. You can start entering new test results.");
                }
            });
        } else if (initialType === "Periodic" && (editId || editData)) {
            // Priority 1: Immediate population (Props)
            if (editData && (editData.consignmentNo || editData.lossPercent || editData.result)) {
                handleRecord(editData);
            }
            // Priority 2: Backend Sync (Latest from DB)
            if (editId) {
                getAggregateSoundnessById(editId).then(record => {
                    if (record) {
                        handleRecord(record);
                    } else {
                        toast.info("No existing record found in history for this test.");
                    }
                });
            }
        }
    }, [activeRequestId, editId, editData, initialType, reset, setValue, inventoryData]);

    const initialWt = watch("initialWt");
    const finalWt = watch("finalWt");
    const method = watch("method");
    const materialType = watch("materialType");

    useEffect(() => {
        if (initialWt && finalWt && method && materialType) {
            const i = parseFloat(initialWt);
            const f = parseFloat(finalWt);
            if (i > 0) {
                const loss = i - f;
                const lossPercent = (loss / i) * 100;
                setValue("lossWt", loss.toFixed(2));
                setValue("lossPercent", lossPercent.toFixed(2));

                // Validation Thresholds:
                // Fine: Sodium <= 10, Magnesium <= 15
                // Coarse: Sodium <= 12, Magnesium <= 18
                let threshold = 12; // Default
                const isFine = materialType === 'Fine Aggregate';
                
                if (method === 'Sodium Sulphate') {
                    threshold = isFine ? 10 : 12;
                } else if (method === 'Magnesium Sulphate') {
                    threshold = isFine ? 15 : 18;
                }

                const isOk = lossPercent <= threshold;
                setValue("result", isOk ? "Satisfactory" : "Unsatisfactory");
            }
        }
    }, [initialWt, finalWt, method, materialType, setValue]);

    const onSubmit = async (formData) => {
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                shift: selectedShift || 'General',
                lineNo: dutyLocation || 'N/A',
                dateOfInspection: dutyDate || new Date().toISOString().split('T')[0],
                requestId: activeRequestId || null,
                createdBy: parseInt(localStorage.getItem('userId') || '1', 10)
            };

            const resultSaved = await saveAggregateSoundness(payload, editIdState);
            if (onSave) onSave(resultSaved || payload);
            
            toast.success(`Soundness Test report ${editIdState ? 'updated' : 'saved'} successfully!`);
        } catch (error) {
            console.error("Error saving soundness data:", error);
            toast.error(error.message || "Failed to save Soundness report.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="cement-forms-scope">
            <div className="form-card" style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
                <div className="form-header" style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <h2 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>Aggregate – Raw Material Testing: Soundness Test (IS 2386 Part 5)</h2>
                </div>

                <div className="form-body" style={{ padding: '24px' }}>
                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '1.5rem' }}>
                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Date of Testing <span className="required" style={{ color: 'red' }}>*</span></label>
                            <input type="date" {...register("testDate", { required: "Required" })} style={{ width: '100%', padding: '10px', height: '42px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Consignment No. <span className="required" style={{ color: 'red' }}>*</span></label>
                            {activeRequestId ? (
                                <input
                                    type="text"
                                    readOnly
                                    className="readOnly"
                                    style={{ width: '100%', padding: '10px', height: '42px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', boxSizing: 'border-box' }}
                                    {...register("consignmentNo")}
                                />
                            ) : initialType === "Periodic" ? (
                                <input
                                    type="text"
                                    placeholder="Enter Consignment No"
                                    style={{ width: '100%', padding: '10px', height: '42px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                                    {...register("consignmentNo", { required: "Required" })}
                                />
                            ) : (
                                <select
                                    {...register("consignmentNo", { required: "Required" })}
                                    style={{ width: '100%', padding: '10px', height: '42px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                                >
                                    <option value="">-- Select --</option>
                                    {inventoryData.map((c, i) => (
                                        <option key={i} value={c.consignmentNo}>{c.consignmentNo} ({c.vendor})</option>
                                    ))}
                                    <option value="PERIODIC">-- Periodic Testing --</option>
                                </select>
                            )}
                        </div>
                    </div>
                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '1.5rem' }}>
                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Material Type <span className="required" style={{ color: 'red' }}>*</span></label>
                            <select {...register("materialType", { required: "Required" })} style={{ width: '100%', padding: '10px', height: '42px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}>
                                <option value="">-- Select --</option>
                                <option value="Fine Aggregate">Fine Aggregate</option>
                                <option value="Coarse Aggregate">Coarse Aggregate</option>
                            </select>
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                                Limits (Na2SO4/MgSO4): Fine (10%/15%) | Coarse (12%/18%)
                            </div>
                        </div>
                    </div>

                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Test Method <span className="required" style={{ color: 'red' }}>*</span></label>
                            <select {...register("method", { required: "Required" })} style={{ width: '100%', padding: '10px', height: '42px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}>
                                <option value="">-- Select --</option>
                                <option value="Sodium Sulphate">Sodium Sulphate</option>
                                <option value="Magnesium Sulphate">Magnesium Sulphate</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>No. of Cycles</label>
                            <input type="number" {...register("cycles")} style={{ width: '100%', padding: '10px', height: '42px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                        </div>
                    </div>

                    <div style={{ margin: '24px 0', height: '1px', background: '#e2e8f0' }}></div>

                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Initial Weight of Sample (gms) <span className="required" style={{ color: 'red' }}>*</span></label>
                            <input type="number" step="0.01" {...register("initialWt", { required: "Required" })} style={{ width: '100%', padding: '10px', height: '42px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Weight after test (gms) <span className="required" style={{ color: 'red' }}>*</span></label>
                            <input type="number" step="0.01" {...register("finalWt", { required: "Required" })} style={{ width: '100%', padding: '10px', height: '42px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Loss in Weight (gms)</label>
                            <input type="number" readOnly className="readOnly" {...register("lossWt")} style={{ width: '100%', padding: '10px', height: '42px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', boxSizing: 'border-box' }} />
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Percentage Loss (%)</label>
                            <input type="number" readOnly className="readOnly" {...register("lossPercent")} style={{ width: '100%', padding: '10px', height: '42px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontWeight: '700', boxSizing: 'border-box' }} />
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Result</label>
                            <input type="text" readOnly className="readOnly" {...register("result")} style={{ width: '100%', padding: '10px', height: '42px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f0fdf4', color: '#166534', fontWeight: '700', boxSizing: 'border-box' }} />
                        </div>
                    </div>

                    <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
                        <button type="submit" className="btn-save" style={{ flex: 1, padding: '12px', background: '#42818c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }} disabled={submitting}>
                            {submitting ? 'Saving...' : editIdState ? 'Update Test Report' : 'Save Test Report'}
                        </button>
                        {onCancel && <button type="button" onClick={onCancel} className="btn-save" style={{ flex: 1, padding: '12px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }} disabled={submitting}>Cancel</button>}
                    </div>
                </div>
            </div>
        </form>
    );
}