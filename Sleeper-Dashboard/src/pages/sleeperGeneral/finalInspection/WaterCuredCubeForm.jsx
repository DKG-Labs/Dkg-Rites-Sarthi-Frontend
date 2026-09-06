import React, { useState, useEffect } from 'react';
import './WaterCuredCubeForm.css';

const WaterCuredCubeForm = ({ batch, preFillData, onSave, onCancel }) => {
    // Area for 150mm cube is 22500 mm2
    const AREA = 22500;
    const FCK = batch.grade === 'M55' ? 55 : (batch.grade === 'M60' ? 60 : 55);

    const [testDate, setTestDate] = useState(() => {
        if (preFillData?.testDate) return preFillData.testDate;
        if (preFillData?.details?.[0]?.testingDate) return preFillData.details[0].testingDate;
        return new Date().toISOString().split('T')[0];
    });
    const [testTime, setTestTime] = useState(() => {
        if (preFillData?.details?.[0]?.testingTime) return preFillData.details[0].testingTime;
        return new Date().toTimeString().slice(0, 5);
    });

    const initialCubes = [
        { id: 1, sample: 1, weight: '', load: '', strength: 0 },
        { id: 2, sample: 1, weight: '', load: '', strength: 0 },
        { id: 3, sample: 1, weight: '', load: '', strength: 0 },
        { id: 4, sample: 2, weight: '', load: '', strength: 0 },
        { id: 5, sample: 2, weight: '', load: '', strength: 0 },
        { id: 6, sample: 2, weight: '', load: '', strength: 0 },
    ];

    const [cubes, setCubes] = useState(() => {
        if (preFillData?.details && preFillData.details.length === 6) {
            return preFillData.details.sort((a,b) => (a.sampleNumber - b.sampleNumber) || (a.cubeIndex - b.cubeIndex)).map((d, idx) => ({
                id: idx + 1,
                sample: d.sampleNumber,
                weight: d.weightKg || '',
                load: d.loadKn || '',
                strength: d.strengthNmm2 || 0,
            }));
        }
        return initialCubes;
    });
    const [results, setResults] = useState({
        s1Avg: 0,
        s2Avg: 0,
        x: 0,
        y: 0,
        condition1: false,
        condition2: false,
        condition3: false,
        s1Variation: 0,
        s2Variation: 0,
        mrSamples: 0,
        testResult: 'Pending'
    });
    const [saving, setSaving] = useState(false);

    const calculateAge = (castingDate, currentTestDate) => {
        if (!castingDate) return 0;
        const cast = new Date(castingDate);
        const test = currentTestDate ? new Date(currentTestDate) : new Date();
        const diffTime = Math.abs(test - cast);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const age = calculateAge(batch.castingDate, testDate);

    useEffect(() => {
        // Calculate Averages based on current cubes state
        const s1Cubes = cubes.filter(c => c.sample === 1 && c.strength > 0);
        const s2Cubes = cubes.filter(c => c.sample === 2 && c.strength > 0);

        const s1Avg = s1Cubes.length > 0 ? s1Cubes.reduce((acc, c) => acc + c.strength, 0) / s1Cubes.length : 0;
        const s2Avg = s2Cubes.length > 0 ? s2Cubes.reduce((acc, c) => acc + c.strength, 0) / s2Cubes.length : 0;

        // X = Avg of Sample 1 Avg & Sample 2 Avg
        const x = (s1Avg > 0 && s2Avg > 0) ? (s1Avg + s2Avg) / 2 : 0;

        // Y = minimum of (Avg S1, Avg S2)
        const y = (s1Avg > 0 && s2Avg > 0) ? Math.min(s1Avg, s2Avg) : 0;

        const allStrengths = cubes.filter(c => c.strength > 0).map(c => c.strength);

        // Variations calculation
        const calcVariation = (sampleCubes, avg) => {
            if (sampleCubes.length < 3 || avg === 0) return 0;
            const variations = sampleCubes.map(c => Math.abs((c.strength - avg) / avg) * 100);
            return Math.max(...variations);
        };

        const s1Variation = calcVariation(s1Cubes, s1Avg);
        const s2Variation = calcVariation(s2Cubes, s2Avg);

        // Excessive variation rule: If Sample 1 or Sample 2 variation > 15%, the batch fails.
        const hasExcessiveVariation = (s1Cubes.length === 3 && s1Variation > 15) || (s2Cubes.length === 3 && s2Variation > 15);

        // Conditions
        // Condition 1: X >= (Fck + 3) && Y >= (Fck - 3)
        const condition1 = allStrengths.length === 6 && x >= (FCK + 3) && y >= (FCK - 3);

        // Condition 2: 63 > X >= 60 AND/OR 57 > Y >= 55 (with X >= FCK and Y >= FCK - 5)
        const condition2 = allStrengths.length === 6 && !condition1 && (x >= FCK && y >= (FCK - 5)) && (
            ((x < FCK + 3) && (x >= FCK)) ||
            ((y < FCK - 3) && (y >= FCK - 5))
        );

        const condition3 = allStrengths.length === 6 && !condition1 && !condition2 && (
            (x < FCK) || (y < FCK - 5)
        );

        let mrSamples = 0;
        let testResult = 'Pending';

        if (allStrengths.length === 6) {
            if (hasExcessiveVariation) {
                mrSamples = 0;
                testResult = 'FAIL';
            } else if (condition1) {
                mrSamples = 1;
                testResult = 'PASS';
            } else if (condition2) {
                mrSamples = 2;
                testResult = 'PASS';
            } else if (condition3) {
                mrSamples = 0;
                testResult = 'FAIL';
            }
        }

        setResults({
            s1Avg, s2Avg, x, y,
            condition1, condition2, condition3,
            s1Variation, s2Variation, hasExcessiveVariation, mrSamples, testResult
        });
    }, [cubes, FCK]);

    const handleCubeChange = (id, field, value) => {
        setCubes(prev => prev.map(c => {
            if (c.id === id) {
                const updated = { ...c, [field]: value };
                // Auto-calculate strength from load: strength (N/mm²) = (Load kN × 1000) / Area (22500 mm²)
                if (field === 'load') {
                    const loadKN = parseFloat(value) || 0;
                    updated.strength = parseFloat(((loadKN * 1000) / AREA).toFixed(2));
                }
                return updated;
            }
            return c;
        }));
    };

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const sample1Results = cubes.filter(c => c.sample === 1).map(c => ({
                ...c,
                date: testDate,
                time: testTime
            }));
            const sample2Results = cubes.filter(c => c.sample === 2).map(c => ({
                ...c,
                date: testDate,
                time: testTime
            }));
            await onSave({
                testDate: testDate || new Date().toISOString().split('T')[0],
                ageDays: age,
                avgStrength: results.x,
                s1Avg: results.s1Avg,
                s2Avg: results.s2Avg,
                avgX: results.x,
                minY: results.y,
                s1Variation: results.s1Variation,
                s2Variation: results.s2Variation,
                condition1: results.condition1,
                condition2: results.condition2,
                condition3: results.condition3,
                mrSamples: results.mrSamples,
                status: results.testResult,
                sample1Results,
                sample2Results
            });
        } catch (err) {
            setSaving(false);
        }
    };

    return (
        <div className="water-cube-form">
            <div className="form-summary-card">
                <div className="summary-grid">
                    <div className="summary-item">
                        <label>Batch No</label>
                        <span className="summary-val">{batch.batchNo}</span>
                    </div>
                    <div className="summary-item">
                        <label>Concrete Grade</label>
                        <span className="summary-val grade-badge">{batch.grade}</span>
                    </div>
                    <div className="summary-item">
                        <label>Casting Date</label>
                        <span className="summary-val">{batch.castingDate}</span>
                    </div>
                    <div className="summary-item interactive">
                        <label>Date of Testing</label>
                        <input type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
                    </div>
                    <div className="summary-item interactive">
                        <label>Testing Time</label>
                        <input type="time" value={testTime} onChange={(e) => setTestTime(e.target.value)} />
                    </div>
                    <div className="summary-item">
                        <label>Age (Days)</label>
                        <span className="summary-val">{age} Days</span>
                    </div>
                    <div className="summary-item">
                        <label>Fck (Target)</label>
                        <span className="summary-val">{FCK} N/mm²</span>
                    </div>
                </div>
            </div>

            <div className="cubes-grid">
                <div className="sample-section">
                    <div className="sample-card-header">
                        <div className="sample-header-left">
                            <span className="sample-number-badge">Sample 1</span>
                            <span className="sample-cubes-list">
                                Declared: <strong>{batch.sample1?.join(', ') || 'N/A'}</strong>
                            </span>
                        </div>
                    </div>
                    <div className="table-container">
                        <table className="cubes-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '22%' }}>Cube #</th>
                                    <th style={{ width: '26%' }}>Weight (kg)</th>
                                    <th style={{ width: '26%' }}>Load (kN)</th>
                                    <th style={{ width: '26%', textAlign: 'right' }}>Strength (N/mm²)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cubes.filter(c => c.sample === 1).map((cube, idx) => (
                                    <tr key={cube.id}>
                                        <td>
                                            <div className="cube-identity-pill">
                                                <span className="cube-code">{batch.sample1?.[idx] || `1-${idx + 1}`}</span>
                                                <span className="cube-sub">Index: 1-{idx + 1}</span>
                                            </div>
                                        </td>
                                        <td><input type="number" step="0.01" placeholder="e.g. 8.25" value={cube.weight} onChange={(e) => handleCubeChange(cube.id, 'weight', e.target.value)} /></td>
                                        <td><input type="number" step="0.1" placeholder="e.g. 1350" value={cube.load} onChange={(e) => handleCubeChange(cube.id, 'load', e.target.value)} /></td>
                                        <td>
                                            <div className={`strength-badge-display ${cube.strength >= FCK ? 'pass' : (cube.strength > 0 ? 'fail' : '')}`}>
                                                {cube.strength > 0 ? cube.strength.toFixed(2) : '—'}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="avg-row">
                                    <td colSpan="3">Sample 1 Average Strength</td>
                                    <td className="avg-value">{results.s1Avg > 0 ? `${results.s1Avg.toFixed(2)} N/mm²` : '0.00'}</td>
                                </tr>
                                <tr className={`variation-row ${results.s1Variation > 15 ? 'excessive' : ''}`}>
                                    <td colSpan="3">Sample 1 Max Variation %</td>
                                    <td>
                                        <div className="variation-value-container">
                                            <span style={{ fontWeight: '800', color: results.s1Variation > 15 ? '#dc2626' : '#166534' }}>
                                                {results.s1Variation.toFixed(2)}%
                                            </span>
                                            {cubes.filter(c => c.sample === 1 && c.strength > 0).length === 3 && (
                                                <span className={`var-pill ${results.s1Variation > 15 ? 'fail' : 'pass'}`}>
                                                    {results.s1Variation > 15 ? 'FAIL (>15%)' : 'PASS (≤15%)'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="sample-section">
                    <div className="sample-card-header">
                        <div className="sample-header-left">
                            <span className="sample-number-badge sample-2">Sample 2</span>
                            <span className="sample-cubes-list">
                                Declared: <strong>{batch.sample2?.join(', ') || 'N/A'}</strong>
                            </span>
                        </div>
                    </div>
                    <div className="table-container">
                        <table className="cubes-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '22%' }}>Cube #</th>
                                    <th style={{ width: '26%' }}>Weight (kg)</th>
                                    <th style={{ width: '26%' }}>Load (kN)</th>
                                    <th style={{ width: '26%', textAlign: 'right' }}>Strength (N/mm²)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cubes.filter(c => c.sample === 2).map((cube, idx) => (
                                    <tr key={cube.id}>
                                        <td>
                                            <div className="cube-identity-pill">
                                                <span className="cube-code">{batch.sample2?.[idx] || `2-${idx + 1}`}</span>
                                                <span className="cube-sub">Index: 2-{idx + 1}</span>
                                            </div>
                                        </td>
                                        <td><input type="number" step="0.01" placeholder="e.g. 8.25" value={cube.weight} onChange={(e) => handleCubeChange(cube.id, 'weight', e.target.value)} /></td>
                                        <td><input type="number" step="0.1" placeholder="e.g. 1350" value={cube.load} onChange={(e) => handleCubeChange(cube.id, 'load', e.target.value)} /></td>
                                        <td>
                                            <div className={`strength-badge-display ${cube.strength >= FCK ? 'pass' : (cube.strength > 0 ? 'fail' : '')}`}>
                                                {cube.strength > 0 ? cube.strength.toFixed(2) : '—'}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="avg-row">
                                    <td colSpan="3">Sample 2 Average Strength</td>
                                    <td className="avg-value">{results.s2Avg > 0 ? `${results.s2Avg.toFixed(2)} N/mm²` : '0.00'}</td>
                                </tr>
                                <tr className={`variation-row ${results.s2Variation > 15 ? 'excessive' : ''}`}>
                                    <td colSpan="3">Sample 2 Max Variation %</td>
                                    <td>
                                        <div className="variation-value-container">
                                            <span style={{ fontWeight: '800', color: results.s2Variation > 15 ? '#dc2626' : '#166534' }}>
                                                {results.s2Variation.toFixed(2)}%
                                            </span>
                                            {cubes.filter(c => c.sample === 2 && c.strength > 0).length === 3 && (
                                                <span className={`var-pill ${results.s2Variation > 15 ? 'fail' : 'pass'}`}>
                                                    {results.s2Variation > 15 ? 'FAIL (>15%)' : 'PASS (≤15%)'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="cube-strengths-summary-card">
                <div className="cube-strengths-summary-title">
                    <span>Individual Cube Strengths Overview</span>
                </div>
                <div className="cube-strengths-summary-grid">
                    {cubes.map((c, idx) => {
                        const cubeName = c.sample === 1 
                            ? (batch.sample1?.[idx] || `1-${idx + 1}`) 
                            : (batch.sample2?.[idx - 3] || `2-${idx - 2}`);
                        const isTested = c.strength > 0;
                        const isPass = c.strength >= FCK;
                        return (
                            <div key={c.id} className={`cube-strength-pill ${isTested ? (isPass ? 'tested-pass' : 'tested-fail') : ''}`}>
                                <span className="cube-name">#{cubeName}</span>
                                <span className="cube-val">{c.strength ? c.strength.toFixed(2) : '—'}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="results-analysis">
                <h3>Statistical Analysis & Compliance</h3>
                <div className="analysis-grid">
                    <div className={`analysis-card ${results.x > 0 ? 'active' : ''}`}>
                        <label>X (Avg of S1 & S2)</label>
                        <div className="value">{results.x.toFixed(2)} <span className="unit">N/mm²</span></div>
                    </div>
                    <div className={`analysis-card ${results.y > 0 ? 'active' : ''}`}>
                        <label>Y (Min of Avg S1 & S2)</label>
                        <div className="value">{results.y.toFixed(2)} <span className="unit">N/mm²</span></div>
                    </div>
                    <div className={`analysis-card condition ${results.hasExcessiveVariation ? 'error' : (cubes.filter(c => c.strength > 0).length === 6 ? 'true' : '')}`}>
                        <label>Variation Check (≤ 15%)</label>
                        <div className="status" style={{ color: results.hasExcessiveVariation ? '#ef4444' : (cubes.filter(c => c.strength > 0).length === 6 ? '#10b981' : '#94a3b8') }}>
                            {results.hasExcessiveVariation ? 'FALSE' : (cubes.filter(c => c.strength > 0).length === 6 ? 'TRUE' : 'PENDING')}
                        </div>
                        <div className="desc">Max S1 & S2 Var ≤ 15%</div>
                    </div>
                    <div className={`analysis-card condition ${results.condition1 ? 'true' : ''}`}>
                        <label>Condition 1</label>
                        <div className="status">{results.condition1 ? 'TRUE' : 'FALSE'}</div>
                        <div className="desc">X ≥ {FCK + 3} & Y ≥ {FCK - 3}</div>
                    </div>
                    <div className={`analysis-card condition ${results.condition2 ? 'true' : ''}`}>
                        <label>Condition 2</label>
                        <div className="status">{results.condition2 ? 'TRUE' : 'FALSE'}</div>
                        <div className="desc">{FCK + 3} &gt; X ≥ {FCK} AND/OR {FCK - 3} &gt; Y ≥ {FCK - 5}</div>
                    </div>
                    <div className={`analysis-card condition ${results.condition3 ? 'error' : ''}`}>
                        <label>Condition 3</label>
                        <div className="status">{results.condition3 ? 'TRUE' : 'FALSE'}</div>
                        <div className="desc">X &lt; {FCK} OR Y &lt; {FCK - 5}</div>
                    </div>
                </div>

                {results.hasExcessiveVariation && (
                    <div className="variation-alert-box">
                        <span style={{ fontSize: '20px' }}>⚠️</span>
                        <div>
                            <div className="alert-title">BATCH FAILED: CUBE STRENGTH VARIATION EXCEEDS 15% LIMIT</div>
                            <div className="alert-subtitle">
                                Sample 1 Max Variation: {results.s1Variation.toFixed(2)}% | Sample 2 Max Variation: {results.s2Variation.toFixed(2)}%. Max allowable variation is 15%.
                            </div>
                        </div>
                    </div>
                )}

                <div className="final-verdict">
                    <div className="verdict-item">
                        <label>MR Test Samples Required</label>
                        <div className="verdict-value">{results.mrSamples} Sleeper(s) per lot</div>
                    </div>
                    <div className={`verdict-item result ${results.testResult.toLowerCase()}`}>
                        <label>Final Test Result</label>
                        <div className="verdict-value">{results.testResult}</div>
                    </div>
                </div>
            </div>

            <div className="form-actions">
                <button className="btn-save" onClick={handleSave} disabled={results.testResult === 'Pending' || saving}>
                    {saving ? 'Saving...' : 'Save Test Details'}
                </button>
                <button className="btn-cancel" onClick={onCancel} disabled={saving}>Cancel</button>
            </div>
        </div>
    );
};

export default WaterCuredCubeForm;
