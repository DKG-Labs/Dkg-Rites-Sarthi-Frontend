import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import EnhancedDataTable from '../../../../components/common/EnhancedDataTable';
import TrendChart from '../../../../components/common/TrendChart';
import { useToast } from '../../../../context/ToastContext';
import { apiService } from '../../../../services/api';
import '../cement/CementForms.css';

const SubCard = ({ id, title, color, count, label, isActive, onClick }) => (
    <div
        className={`asset-card ${isActive ? 'active' : ''}`}
        onClick={onClick}
        style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderTopWidth: '4px',
            borderTopColor: color,
            borderRightColor: isActive ? color : '#e2e8f0',
            borderBottomColor: isActive ? color : '#e2e8f0',
            borderLeftColor: isActive ? color : '#e2e8f0',
            '--active-color-alpha': `${color}15`,
            cursor: 'pointer',
            flex: '1',
            minWidth: '200px'
        }}
    >
        <div className="asset-card-header">
            <div>
                <h4 className="asset-card-title" style={{ color: '#64748b', fontSize: '10px' }}>{title}</h4>
                <div className="asset-card-count" style={{ fontSize: count === 'N/A' ? '1.1rem' : '1.5rem', margin: '4px 0', fontWeight: count === 'N/A' ? '400' : '700' }}>{count}</div>
            </div>
        </div>
        <div className="asset-card-label" style={{ color: color, fontSize: '9px', fontWeight: '700' }}>{label}</div>
    </div>
);

const WaterTesting = ({ onBack }) => {
    const [viewMode, setViewMode] = useState('history');
    const [showForm, setShowForm] = useState(false);
    const toast = useToast();
    const [history, setHistory] = useState([]);
    const [editId, setEditId] = useState(null);
    const userId = parseInt(localStorage.getItem('userId') || '119', 10);

    const fetchHistory = async () => {
        try {
            const res = await apiService.waterQuality.getByUser(userId);
            if (res?.responseData) {
                setHistory(res.responseData);
            } else if (Array.isArray(res)) {
                setHistory(res);
            }
        } catch (error) {
            toast.error("Failed to fetch water quality history.");
        }
    };

    useEffect(() => {
        if (userId) fetchHistory();
    }, [userId]);

    // Water dummy data as requested for inventory
    const waterSources = [
        { id: 'W-01', vendor: 'Borewell No 1', receivedDate: '2026-01-01', status: 'Verified' },
        { id: 'W-02', vendor: 'Borewell No 2', receivedDate: '2026-01-01', status: 'Verified' },
        { id: 'W-03', vendor: 'Municipal Supply', receivedDate: '2026-01-01', status: 'Verified' }
    ];

    const pendingStocks = waterSources;

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            testDate: new Date().toISOString().split('T')[0],
            phValue: '',
            tdsResult: ''
        }
    });

    const canModify = (createdAt) => {
        if (!createdAt) return false;

        let diffLocal, diffUTC;
        const now = Date.now();

        // Check if Spring Boot serialized LocalDateTime as an array like [2026, 4, 20, 14, 45, 0]
        if (Array.isArray(createdAt)) {
            const [year, month, day, hr = 0, min = 0, sec = 0] = createdAt;
            diffLocal = Math.abs(now - new Date(year, month - 1, day, hr, min, sec).getTime());
            diffUTC = Math.abs(now - Date.UTC(year, month - 1, day, hr, min, sec));
        } else {
            let dateStr = String(createdAt);
            diffLocal = Math.abs(now - new Date(dateStr).getTime());
            // Fake formatting to UTC to see if server meant UTC
            if (!dateStr.endsWith('Z')) dateStr += 'Z';
            diffUTC = Math.abs(now - new Date(dateStr).getTime());
        }

        // Accept whichever interpretation is closer to real-time, solving timezone mismatch from Azure
        const diff = Math.min(diffLocal, diffUTC);
        return diff < (60 * 60 * 1000); // 1 hour window
    };

    const onSubmit = async (data) => {
        try {
            const ph = parseFloat(data.phValue);
            const tds = parseFloat(data.tdsResult);
            const isPass = ph >= 6 && ph <= 8 && tds <= 2000;
            
            const payload = {
                testDate: data.testDate,
                phValue: ph,
                tdsResult: tds,
                result: isPass ? 'PASS' : 'FAIL',
                createdBy: userId
            };

            if (editId) {
                await apiService.waterQuality.update(editId, payload);
                toast.success("Water quality test record updated successfully!");
            } else {
                await apiService.waterQuality.create(payload);
                toast.success("Water quality test record saved successfully!");
            }
            
            fetchHistory();
            setShowForm(false);
            setEditId(null);
            reset();
        } catch (error) {
            toast.error(error.message || "Failed to save water test record.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this water test record?')) {
            try {
                await apiService.waterQuality.delete(id);
                toast.success("Record deleted successfully!");
                fetchHistory();
            } catch (error) {
                toast.error("Failed to delete record.");
            }
        }
    };

    const inventoryColumns = [
        { key: 'vendor', label: 'Water Source' },
        { key: 'id', label: 'Source ID', isHeaderHighlight: true },
        { key: 'receivedDate', label: 'Last Check Date' },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <button
                    className="btn-action mini"
                    onClick={() => {
                        setEditId(null);
                        reset();
                        setShowForm(true);
                    }}
                >
                    Add Test Detail
                </button>
            )
        }
    ];

    const historyColumns = [
        { key: 'testDate', label: 'Date', render: (val) => val ? val.split('-').reverse().join('/') : '' },
        { key: 'phValue', label: 'PH Value' },
        { key: 'tdsResult', label: 'TDS Result', render: (val) => `${val || ''} ppm` },
        { 
            key: 'result', 
            label: 'Result',
            render: (val, row) => {
                const ph = parseFloat(row.phValue);
                const tds = parseFloat(row.tdsResult);
                const status = val || ( (!isNaN(ph) && ph >= 6 && ph <= 8 && !isNaN(tds) && tds <= 2000) ? 'PASS' : 'FAIL' );
                return (
                    <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: status === 'PASS' ? '#dcfce7' : '#fee2e2',
                        color: status === 'PASS' ? '#166534' : '#991b1b'
                    }}>
                        {status}
                    </span>
                );
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => {
                const editable = canModify(row.createdDate || row.createdAt);
                // Also allowing modification if there's no creation date for safety, but with API there will be.
                return (
                    <div className="btn-group-center" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                            className={`btn-action mini ${!editable ? 'disabled-btn' : ''}`}
                            disabled={!editable}
                            onClick={() => {
                                setEditId(row.id);
                                reset({
                                    testDate: row.testDate,
                                    phValue: row.phValue,
                                    tdsResult: row.tdsResult
                                });
                                setShowForm(true);
                            }}
                        >
                            Modify
                        </button>
                        <button
                            className={`btn-action mini danger ${!editable ? 'disabled-btn' : ''}`}
                            disabled={!editable}
                            onClick={() => handleDelete(row.id)}
                        >
                            Delete
                        </button>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="water-testing-root cement-forms-scope fade-in">
            <div className="content-title-row" style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: 0 }}>Water Quality Testing</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="toggle-btn mini" onClick={() => { setEditId(null); reset(); setShowForm(true); }}>+ Add New (Periodic)</button>
                    <button className="toggle-btn secondary mini" onClick={onBack}>Back to Dashboard</button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
                <SubCard id="stats" title="Analytics" color="#42818c" count="N/A" label="Statistics" isActive={viewMode === 'stats'} onClick={() => setViewMode('stats')} />
                <SubCard id="history" title="Historical" color="#10b981" count={history.length} label="Test Logs" isActive={viewMode === 'history'} onClick={() => setViewMode('history')} />
            </div>

            <div className="view-layer">
                {viewMode === 'stats' && (
                    <div className="table-outer-wrapper fade-in" style={{ padding: '24px' }}>
                        <TrendChart
                            data={history.map(h => ({
                                ...h,
                                tdsNum: parseFloat(h.tdsResult) || 0,
                                phNum: parseFloat(h.phValue) || 0
                            }))}
                            xKey="testDate"
                            lines={[
                                { key: 'phNum', color: '#3b82f6', label: 'pH Value' },
                                { key: 'tdsNum', color: '#10b981', label: 'TDS (ppm)' }
                            ]}
                            title="Water Quality Analytics"
                            description="Historical pH and TDS trends"
                            yAxisLabel=""
                        />
                    </div>
                )}


                {viewMode === 'history' && (
                    <div className="table-outer-wrapper fade-in">
                        <EnhancedDataTable columns={historyColumns} data={history} />
                    </div>
                )}
            </div>

            {showForm && (
                <div className="form-modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="form-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '80%', width: '80%' }}>
                        <div className="form-modal-header">
                            <span className="form-modal-header-title">Water Quality Test Record</span>
                            <button className="form-modal-close" onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <div className="form-modal-body" style={{ background: '#f8fafc' }}>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>Date of Testing <span className="required">*</span></label>
                                        <input type="date" {...register('testDate', { required: true })} style={{ background: '#f1f5f9' }} />
                                    </div>
                                    <div className="input-group">
                                        <label>pH Value <span className="required">*</span></label>
                                        <input type="number" step="0.01" {...register('phValue', { required: true })} placeholder="6.0–8.0" />
                                        <span style={{ fontSize: '10px', color: '#64748b' }}>Required: 6 to 8</span>
                                    </div>
                                    <div className="input-group">
                                        <label>TDS (ppm) <span className="required">*</span></label>
                                        <input type="number" {...register('tdsResult', { required: true })} placeholder="Max 2000" />
                                        <span style={{ fontSize: '10px', color: '#64748b' }}>Required: Max 2000 PPM</span>
                                    </div>
                                </div>
                                <div className="form-modal-footer" style={{ borderTop: 'none', padding: '24px 0 0' }}>
                                    <button type="submit" className="btn-save">{editId ? 'Update Result' : 'Save Result'}</button>
                                    <button type="button" className="btn-save" style={{ background: '#64748b' }} onClick={() => setShowForm(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WaterTesting;
