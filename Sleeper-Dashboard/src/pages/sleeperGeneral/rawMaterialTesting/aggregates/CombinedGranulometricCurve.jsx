import React, { useState, useEffect } from "react";
import { useShift } from "../../../../context/ShiftContext";
import { useToast } from "../../../../context/ToastContext";
import { saveAggregateGranulometric, getAggregateGranulometricByReqId, getAggregateGranulometricCurveById } from "../../../../services/workflowService";
import TrendChart from "../../../../components/common/TrendChart";

const SieveTable = ({ title, sectionType, sieveSizes, sampleWeight, weights, onWtChange }) => {
    // Derive the calculated values on every render
    const rows = React.useMemo(() => {
        let cumulative = 0;
        const A = Number(sampleWeight) > 0 ? Number(sampleWeight) : 0;
        
        return sieveSizes.map((size, idx) => {
            const wtRetained = weights[idx] || 0;
            cumulative += wtRetained;
            
            // Formula: % Retained = (Cumm. Wt. Retained / Sample Weight) * 100
            const pctRetained = A > 0 ? (cumulative / A) * 100 : 0;
            // Formula: % Passing = 100 - % Retained
            const pctPassing = A > 0 ? Math.max(0, 100 - pctRetained) : 100;

            return {
                sieveSize: size,
                wtRetained,
                cummWtRetained: cumulative,
                pctRetained,
                pctPassing
            };
        });
    }, [weights, sampleWeight, sieveSizes]);

    return (
        <div style={{ marginBottom: '2rem' }}>
            <div className="section-title" style={{ background: 'white', border: '1px solid #e2e8f0', padding: '10px 16px', borderRadius: '8px', color: '#101828', fontWeight: 700, marginBottom: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                {title}
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Sieve Size</th>
                            <th>Wt. Retained (gms)</th>
                            <th>Cumm. Wt. Retained</th>
                            <th>% Retained</th>
                            <th>% Passing</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => (
                            <tr key={idx}>
                                <td data-label="Sieve Size" style={{ fontWeight: 600 }}>{row.sieveSize}</td>
                                <td data-label="Wt. Retained (gms)"><input type="number" min="0" step="0.01" value={row.wtRetained || ''} onChange={(e) => onWtChange(idx, e.target.value)} /></td>
                                <td data-label="Cumm. Wt. Retained" className="readOnly">{row.cummWtRetained.toFixed(2)}</td>
                                <td data-label="% Retained" className="readOnly">{row.pctRetained.toFixed(2)}%</td>
                                <td data-label="% Passing" className="readOnly">{row.pctPassing.toFixed(2)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default function CombinedGranulometricCurve({ onSave, onCancel, inventoryData = [], initialType = "New Inventory", activeRequestId, editId, editData }) {
    const { selectedShift, dutyLocation, dutyDate } = useShift();
    const toast = useToast();
    const sieveSizes = [
        "20 mm", "10 mm", "4.75 mm", "2.36 mm", "1.18 mm",
        "0.60 mm", "0.30 mm", "0.15 mm"
    ];

    const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
    const [consignmentNo, setConsignmentNo] = useState("");
    
    // Sample Weights
    const [wtCA1, setWtCA1] = useState("");
    const [wtCA2, setWtCA2] = useState("");
    const [wtFA, setWtFA] = useState("");

    // Mix Design %
    const [mixCA1, setMixCA1] = useState("");
    const [mixCA2, setMixCA2] = useState("");
    const [mixFA, setMixFA] = useState("");

    // Weights per section
    const [weightsCA1, setWeightsCA1] = useState(Array(8).fill(0));
    const [weightsCA2, setWeightsCA2] = useState(Array(8).fill(0));
    const [weightsFA, setWeightsFA] = useState(Array(8).fill(0));

    // Grading Ranges manually defined or fetched
    const [limits, setLimits] = useState(sieveSizes.map(() => ({ lower: 0, upper: 100 })));

    const [submitting, setSubmitting] = useState(false);
    const [editIdState, setEditIdState] = useState(editId || null);

    useEffect(() => {
        if (editId) setEditIdState(editId);
    }, [editId]);

    // Helper to map weights back from observations
    const mapObsToWeights = (obs, sizeList) => sizeList.map(size => {
        const match = obs.find(o => o.sieveSize === size);
        return match ? match.wtRetained : 0;
    });

    useEffect(() => {
        console.log("GranulometricForm Props:", { initialType, editId, editData });

        const handleRecord = (record) => {
            if (!record) return;
            console.log("Processing Granulometric Record:", record);
            if (record.id) setEditIdState(record.id);
            setConsignmentNo(record.consignmentNo || record.consignment || consignmentNo);
            setTestDate(record.testDate ? record.testDate.substring(0, 10) : new Date().toISOString().split('T')[0]);
            setMixCA1(record.mixCa1 || record.mixCA1 || "");
            setMixCA2(record.mixCa2 || record.mixCA2 || "");
            setMixFA(record.mixFa || record.mixFA || "");
            setWtCA1(record.wtCa1 || record.wtCA1 || "");
            setWtCA2(record.wtCa2 || record.wtCA2 || "");
            setWtFA(record.wtFa || record.wtFA || "");

            if (record.observations && record.observations.length > 0) {
                setWeightsCA1(mapObsToWeights(record.observations.filter(o => o.sectionType === 'CA1'), sieveSizes));
                setWeightsCA2(mapObsToWeights(record.observations.filter(o => o.sectionType === 'CA2'), sieveSizes));
                setWeightsFA(mapObsToWeights(record.observations.filter(o => o.sectionType === 'FA'), sieveSizes));
            } else if (record.formEntries) {
                const relevantEntry = record.formEntries[4];
                if (relevantEntry && relevantEntry.observations) {
                    setWeightsCA1(mapObsToWeights(relevantEntry.observations.filter(o => o.sectionType === 'CA1'), sieveSizes));
                    setWeightsCA2(mapObsToWeights(relevantEntry.observations.filter(o => o.sectionType === 'CA2'), sieveSizes));
                    setWeightsFA(mapObsToWeights(relevantEntry.observations.filter(o => o.sectionType === 'FA'), sieveSizes));
                }
            }
        };

        if (activeRequestId) {
            const row = inventoryData.find(i => i.requestId === activeRequestId);
            if (row) setConsignmentNo(row.consignmentNo);

            getAggregateGranulometricByReqId(activeRequestId).then(record => {
                if (record) handleRecord(record);
            });
        } else if (initialType === "Periodic" && (editId || editData)) {
            // Priority 1: Immediate population (Props)
            if (editData && (editData.consignmentNo || editData.mixCa1 || editData.wtCa1)) {
                handleRecord(editData);
            }
            // Priority 2: Backend Sync (Latest from DB)
            if (editId) {
                getAggregateGranulometricCurveById(editId).then(record => {
                    if (record) handleRecord(record);
                });
            }
        }
    }, [activeRequestId, editId, editData, initialType, inventoryData]);

    const handleLimitChange = (idx, field, val) => {
        const newLimits = [...limits];
        newLimits[idx][field] = Number(val);
        setLimits(newLimits);
    };

    // Calculate percent passing for each section
    const getPctPassing = (sectionWeights, sampleWt) => {
        const A = Number(sampleWt) > 0 ? Number(sampleWt) : 0;
        let cumulative = 0;
        return sectionWeights.map(wt => {
            cumulative += Number(wt);
            const pctRetained = A > 0 ? (cumulative / A) * 100 : 0;
            return A > 0 ? Math.max(0, 100 - pctRetained) : 100;
        });
    };

    const pctPassingCA1 = getPctPassing(weightsCA1, wtCA1);
    const pctPassingCA2 = getPctPassing(weightsCA2, wtCA2);
    const pctPassingFA = getPctPassing(weightsFA, wtFA);

    // Calculate Combined Data for Graph
    const combinedGraphData = sieveSizes.map((size, idx) => {
        const n = Number(mixCA1) || 0;
        const o = Number(mixCA2) || 0;
        const p = Number(mixFA) || 0;

        const Q = (pctPassingCA1[idx] * n) / 100;
        const R = (pctPassingCA2[idx] * o) / 100;
        const S = (pctPassingFA[idx] * p) / 100;
        const T = Q + R + S;

        return {
            sieveSize: size,
            combined: Number(T.toFixed(2)),
            lower: limits[idx].lower,
            upper: limits[idx].upper
        };
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!consignmentNo) {
            toast.warning("Please select a consignment");
            return;
        }

        setSubmitting(true);
        try {
            const generateObs = (sectionType, sectionWeights, sampleWt, sectionPctPassing) => {
                const A = Number(sampleWt) > 0 ? Number(sampleWt) : 0;
                let cumulative = 0;
                return sieveSizes.map((size, idx) => {
                    const wtRetained = Number(sectionWeights[idx]) || 0;
                    cumulative += wtRetained;
                    const pctRetained = A > 0 ? (cumulative / A) * 100 : 0;
                    return {
                        sectionType,
                        sieveSize: size,
                        wtRetained,
                        cummWtRetained: cumulative,
                        pctRetained,
                        pctPassing: sectionPctPassing[idx]
                    };
                });
            };

            const obs = [
                ...generateObs('CA1', weightsCA1, wtCA1, pctPassingCA1),
                ...generateObs('CA2', weightsCA2, wtCA2, pctPassingCA2),
                ...generateObs('FA', weightsFA, wtFA, pctPassingFA)
            ];

            const payload = {
                testDate,
                consignmentNo,
                typeOfTesting: activeRequestId ? "New Inventory" : "Periodic",
                mixCa1: Number(mixCA1),
                mixCa2: Number(mixCA2),
                mixFa: Number(mixFA),
                wtCa1: Number(wtCA1),
                wtCa2: Number(wtCA2),
                wtFa: Number(wtFA),
                observations: obs,
                shift: selectedShift || 'General',
                lineNo: dutyLocation || 'N/A',
                dateOfInspection: dutyDate || new Date().toISOString().split('T')[0],
                requestId: activeRequestId || null,
                createdBy: parseInt(localStorage.getItem('userId') || '1', 10)
            };

            await saveAggregateGranulometric(payload, editIdState);
            toast.success(`Granulometric report ${editIdState ? 'updated' : 'saved'}!`);
            onSave && onSave(payload);
        } catch (error) {
            console.error("Error saving granulometric data:", error);
            toast.error("Failed to save Granulometric report.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="cement-forms-scope">
            <div className="form-card">
                <div className="form-header">
                    <h2>Combined Granulometric Curve</h2>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Sieve Analysis & Grading Range Mapping</p>
                </div>
                <div className="form-body">
                    
                    {/* Basic Info & Sample Weights */}
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                        <div className="form-grid" style={{ marginBottom: '16px' }}>
                            <div className="input-group">
                                <label>Date of Testing <span className="required">*</span></label>
                                <input type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <label>Consignment No. <span className="required">*</span></label>
                                {activeRequestId ? (
                                    <input type="text" value={consignmentNo} readOnly className="readOnly" style={{ background: '#f8fafc' }} />
                                ) : initialType === "Periodic" ? (
                                    <input type="text" value={consignmentNo} placeholder="Enter Consignment No" onChange={(e) => setConsignmentNo(e.target.value)} required />
                                ) : (
                                    <select value={consignmentNo} onChange={(e) => setConsignmentNo(e.target.value)} required>
                                        <option value="">-- Select --</option>
                                        {inventoryData.map((c, i) => (
                                            <option key={i} value={c.consignmentNo}>{c.consignmentNo} ({c.vendor})</option>
                                        ))}
                                        <option value="PERIODIC">-- Periodic Testing --</option>
                                    </select>
                                )}
                            </div>
                        </div>

                        <div className="section-title" style={{ fontSize: '12px', color: '#475569', marginBottom: '10px' }}>Initial Sample Weights (Grams)</div>
                        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                            <div className="input-group">
                                <label>Weight of 20mm (CA1) [A]</label>
                                <input type="number" placeholder="Grams" value={wtCA1} onChange={(e) => setWtCA1(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <label>Weight of 10mm (CA2) [B]</label>
                                <input type="number" placeholder="Grams" value={wtCA2} onChange={(e) => setWtCA2(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <label>Weight of Fine Agg (FA) [C]</label>
                                <input type="number" placeholder="Grams" value={wtFA} onChange={(e) => setWtFA(e.target.value)} required />
                            </div>
                        </div>
                    </div>

                    <SieveTable 
                        title="🟡 SUB-SECTION 1: CA1" 
                        sectionType="CA1" 
                        sieveSizes={sieveSizes} 
                        sampleWeight={wtCA1} 
                        weights={weightsCA1}
                        onWtChange={(idx, val) => {
                            const newWeights = [...weightsCA1];
                            newWeights[idx] = Number(val);
                            setWeightsCA1(newWeights);
                        }}
                    />
                    <SieveTable 
                        title="🟡 SUB-SECTION 2: CA2" 
                        sectionType="CA2" 
                        sieveSizes={sieveSizes} 
                        sampleWeight={wtCA2} 
                        weights={weightsCA2}
                        onWtChange={(idx, val) => {
                            const newWeights = [...weightsCA2];
                            newWeights[idx] = Number(val);
                            setWeightsCA2(newWeights);
                        }}
                    />
                    <SieveTable 
                        title="🟡 SUB-SECTION 3: FA (Fine Aggregate)" 
                        sectionType="FA" 
                        sieveSizes={sieveSizes} 
                        sampleWeight={wtFA} 
                        weights={weightsFA}
                        onWtChange={(idx, val) => {
                            const newWeights = [...weightsFA];
                            newWeights[idx] = Number(val);
                            setWeightsFA(newWeights);
                        }}
                    />

                    <div className="section-title" style={{ background: 'white', border: '1px solid #e2e8f0', padding: '10px 16px', borderRadius: '8px', color: '#101828', fontWeight: 700, marginBottom: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        🟡 SUB-SECTION 4: COMBINED PASSING TABLE
                    </div>
                    
                    <div style={{ background: '#f0f9ff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <strong style={{ fontSize: '12px', color: '#0369a1' }}>Mix Design Proportions (%):</strong>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <label style={{ fontSize: '11px', fontWeight: 700 }}>CA1 (N)</label>
                            <input type="number" style={{ width: '80px', padding: '4px' }} placeholder="%" value={mixCA1} onChange={(e) => setMixCA1(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <label style={{ fontSize: '11px', fontWeight: 700 }}>CA2 (O)</label>
                            <input type="number" style={{ width: '80px', padding: '4px' }} placeholder="%" value={mixCA2} onChange={(e) => setMixCA2(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <label style={{ fontSize: '11px', fontWeight: 700 }}>FA (P)</label>
                            <input type="number" style={{ width: '80px', padding: '4px' }} placeholder="%" value={mixFA} onChange={(e) => setMixFA(e.target.value)} />
                        </div>
                    </div>

                    <div className="table-container" style={{ marginBottom: '24px' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Sieve Size</th>
                                    <th>Q = (ExN)/100</th>
                                    <th>R = (IxO)/100</th>
                                    <th>S = (MxP)/100</th>
                                    <th style={{ background: '#ecfdf5', color: '#065f46' }}>Combined Passing (T)</th>
                                    <th>Grading Range (Lower % - Upper %)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sieveSizes.map((size, idx) => {
                                    const n = Number(mixCA1) || 0;
                                    const o = Number(mixCA2) || 0;
                                    const p = Number(mixFA) || 0;

                                    const Q = (pctPassingCA1[idx] * n) / 100;
                                    const R = (pctPassingCA2[idx] * o) / 100;
                                    const S = (pctPassingFA[idx] * p) / 100;
                                    const T = Q + R + S;

                                    return (
                                        <tr key={idx}>
                                            <td data-label="Sieve" style={{ fontWeight: 600 }}>{size}</td>
                                            <td data-label="Q" className="readOnly" style={{ color: '#64748b' }}>{Q.toFixed(2)}</td>
                                            <td data-label="R" className="readOnly" style={{ color: '#64748b' }}>{R.toFixed(2)}</td>
                                            <td data-label="S" className="readOnly" style={{ color: '#64748b' }}>{S.toFixed(2)}</td>
                                            <td data-label="Combined" className="readOnly" style={{ fontWeight: 800, background: '#f0fdf4', color: '#059669' }}>
                                                {T.toFixed(2)}%
                                            </td>
                                            <td data-label="Range" style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                <input type="number" style={{ width: '60px', padding: '2px 4px', fontSize: '11px' }} value={limits[idx].lower} onChange={(e) => handleLimitChange(idx, 'lower', e.target.value)} />
                                                <span style={{ color: '#94a3b8' }}>-</span>
                                                <input type="number" style={{ width: '60px', padding: '2px 4px', fontSize: '11px' }} value={limits[idx].upper} onChange={(e) => handleLimitChange(idx, 'upper', e.target.value)} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Chart Visualization */}
                    <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#334155' }}>Granulometric Curve Visualization</h4>
                        <TrendChart
                            data={combinedGraphData}
                            xKey="sieveSize"
                            lines={[
                                { key: 'combined', color: '#059669', label: 'Actual Combined % (T)' },
                                { key: 'upper', color: '#ef4444', label: 'Upper Limit' },
                                { key: 'lower', color: '#f59e0b', label: 'Lower Limit' }
                            ]}
                            title=""
                            description=""
                            yAxisLabel="% Passing"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button type="submit" className="btn-save" style={{ minWidth: '200px' }} disabled={submitting}>
                            {submitting ? 'Saving...' : editIdState ? 'Update Curve Report' : 'Submit Curve Report'}
                        </button>
                        {onCancel && <button type="button" onClick={onCancel} className="btn-save" style={{ background: '#f1f5f9', color: '#64748b', border: 'none', minWidth: '120px' }} disabled={submitting}>Cancel</button>}
                    </div>
                </div>
            </div>
        </form>
    );
}
