import React, { useState, useEffect } from 'react';
import EnhancedDataTable from '../../../components/common/EnhancedDataTable';
import { apiService } from '../../../services/api';
import { useShift } from '../../../context/ShiftContext';

// Mock data to simulate API responses for ET module
const mockBatches = [
    { batchNo: 'B-101', shedLine: 'Shed 1', castingDate: '2026-04-20', totalCasted: 100, etCount: 1, etPercent: 1.0 },
    { batchNo: 'B-102', shedLine: 'Line 2', castingDate: '2026-04-21', totalCasted: 120, etCount: 0, etPercent: 0.0 }
];

const mockLogs = [
    { id: 1, batchNo: 'B-101', shedLine: 'Shed 1', castingDate: '2026-04-20', logDate: '2026-04-21T10:00:00', sleepers: ['12A'], remark: 'Minor surface crack' }
];

const EpoxyTreatedSleepers = ({ onBack, initialShowForm = false }) => {
    const [activeTab, setActiveTab] = useState('summary'); // 'summary' or 'logs'
    const [showForm, setShowForm] = useState(initialShowForm);
    const [selectedLog, setSelectedLog] = useState(null);
    const [showLogModal, setShowLogModal] = useState(false);
    
    const [logs, setLogs] = useState(mockLogs);
    const [batches, setBatches] = useState(mockBatches);

    const summaryColumns = [
        { key: 'batchNo', label: 'Batch Number' },
        { key: 'shedLine', label: 'Shed No. / Line No.' },
        { key: 'castingDate', label: 'Date of Casting' },
        { key: 'totalCasted', label: 'Total Sleepers Casted' },
        { key: 'etCount', label: 'No. of ET Sleepers' },
        { key: 'etPercent', label: '% of ET Sleepers', render: (val) => `${val}%` }
    ];

    const logsColumns = [
        { key: 'batchNo', label: 'Batch Number' },
        { key: 'shedLine', label: 'Shed No. / Line No.' },
        { key: 'castingDate', label: 'Date of Casting' },
        { key: 'logDate', label: 'Date & Time of Log', render: (val) => new Date(val).toLocaleString('en-GB') },
        { key: 'sleepers', label: 'Sleepers Marked ET', render: (val) => val?.join(', ') || '' },
        {
            key: 'actions', label: 'Actions', render: (_, row) => (
                <button
                    className="btn-verify"
                    style={{ fontSize: '10px', padding: '6px 14px' }}
                    onClick={() => { setSelectedLog(row); setShowLogModal(true); }}
                >
                    View Details
                </button>
            )
        }
    ];

    return (
        <div className="et-module cement-forms-scope">
            <header style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#13343b', margin: 0 }}>Epoxy Treated (ET) Sleepers</h2>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Tracking minor surface defects within 1% limit</p>
            </header>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div className="nav-tabs" style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '6px', borderRadius: '14px', width: 'fit-content' }}>
                    <button className={`nav-tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'summary' ? '800' : '600', background: activeTab === 'summary' ? '#fff' : 'transparent' }}>
                        Batch Wise ET Status
                    </button>
                    <button className={`nav-tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'logs' ? '800' : '600', background: activeTab === 'logs' ? '#fff' : 'transparent' }}>
                        ET Logs
                    </button>
                </div>
                <button className="btn-verify" onClick={() => setShowForm(true)}>+ Add New Entry</button>
            </div>

            <div className="tab-content fade-in">
                {activeTab === 'summary' && (
                    <div className="section-card">
                        <EnhancedDataTable columns={summaryColumns} data={batches} />
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="section-card">
                        <EnhancedDataTable columns={logsColumns} data={logs} />
                    </div>
                )}
            </div>

            {showForm && (
                <ETDeclarationForm onClose={() => setShowForm(false)} onSave={(entry) => {
                    const newLog = { ...entry, id: Date.now(), logDate: new Date().toISOString() };
                    setLogs([newLog, ...logs]);
                    setShowForm(false);
                }} />
            )}

            {showLogModal && selectedLog && (
                <ETLogModal log={selectedLog} onClose={() => setShowLogModal(false)} onDelete={(id) => {
                    setLogs(logs.filter(l => l.id !== id));
                    setShowLogModal(false);
                }} />
            )}
        </div>
    );
};

const ETDeclarationForm = ({ onClose, onSave }) => {
    const { vendorId, dutyUnit } = useShift();
    const [formData, setFormData] = useState({
        shedLine: '',
        castingDate: new Date().toISOString().split('T')[0],
        batchNo: '',
        sleepers: [],
        sleeperType: '',
        remark: '',
        confirmed: false
    });
    const [locations, setLocations] = useState({});
    
    // Mock valid sleepers
    const mockAvailableSleepers = ['12A', '12B', '145F', '145G'];

    useEffect(() => {
        const fetchLocations = async () => {
            const vId = vendorId || localStorage.getItem('vendorId');
            const pId = dutyUnit || localStorage.getItem('dutyUnit');
            if (vId && pId) {
                try {
                    const res = await apiService.getPlantSheds(vId, pId);
                    if (res?.responseData) setLocations(res.responseData);
                    else if (res && typeof res === 'object') setLocations(res);
                } catch (e) {
                    console.error(e);
                }
            }
        };
        fetchLocations();
    }, [vendorId, dutyUnit]);

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">Declare Epoxy Treated Sleeper</span>
                    <button className="form-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="form-modal-body">
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="input-group">
                            <label>Shed No. / Line No.</label>
                            <select value={formData.shedLine} onChange={e => setFormData({ ...formData, shedLine: e.target.value })}>
                                <option value="">Select Location</option>
                                {Object.entries(locations).map(([plantType, sheds]) => (
                                    <optgroup key={plantType} label={plantType}>
                                        {Array.isArray(sheds) && sheds.map(shed => (
                                            <option key={`${plantType} - ${shed}`} value={shed}>{shed}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Date of Casting</label>
                            <input type="date" value={formData.castingDate} onChange={e => setFormData({ ...formData, castingDate: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Batch Number</label>
                            <select value={formData.batchNo} onChange={e => setFormData({ ...formData, batchNo: e.target.value })}>
                                <option value="">Select Batch</option>
                                <option value="B-101">B-101</option>
                                <option value="B-102">B-102</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Sleeper Type</label>
                            <input type="text" readOnly value={formData.sleepers.length > 0 ? 'RT-2496' : ''} placeholder="Auto-fetched" className="readOnly" />
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label>Sleeper Number(s) <span style={{fontSize:'10px', color:'#ef4444'}}>(Invalid sleepers are blocked)</span></label>
                            <select multiple style={{ height: '100px' }} value={formData.sleepers} onChange={e => {
                                const vals = Array.from(e.target.selectedOptions, option => option.value);
                                setFormData({ ...formData, sleepers: vals, sleeperType: vals.length > 0 ? 'RT-2496' : '' });
                            }}>
                                {mockAvailableSleepers.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>Hold Ctrl/Cmd to select multiple options.</span>
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label>Remark <span className="required">*</span></label>
                            <textarea value={formData.remark} onChange={e => setFormData({ ...formData, remark: e.target.value })} rows="3" placeholder="Enter notes..." />
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <input type="checkbox" checked={formData.confirmed} onChange={e => setFormData({ ...formData, confirmed: e.target.checked })} style={{ transform: 'scale(1.3)', margin: '0 4px', cursor: 'pointer', accentColor: '#13343b' }} />
                                <span style={{ fontWeight: '700', color: '#13343b', fontSize: '13px' }}>I confirm the sleeper has been physically painted/marked for ET identification.</span>
                            </label>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button className="btn-verify" style={{ flex: 1 }} onClick={() => {
                            if (!formData.shedLine || !formData.batchNo || formData.sleepers.length === 0 || !formData.remark || !formData.confirmed) {
                                alert("Please complete all mandatory fields and acknowledge the confirmation.");
                                return;
                            }
                            onSave(formData);
                        }}>Save Declaration</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ETLogModal = ({ log, onClose, onDelete }) => {
    // Lock logic: 8 hours
    const logTime = new Date(log.logDate).getTime();
    const canModify = (Date.now() - logTime) <= (8 * 60 * 60 * 1000);

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">Log Details</span>
                    <button className="form-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="form-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>BATCH NUMBER</div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#13343b' }}>{log.batchNo}</div>
                    </div>
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>LOCATION</div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#13343b' }}>{log.shedLine}</div>
                    </div>
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>SLEEPERS ET</div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#13343b' }}>{log.sleepers?.join(', ')}</div>
                    </div>
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>TIME OF LOG</div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#13343b' }}>{new Date(log.logDate).toLocaleString('en-GB')}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button className="btn-save" style={{ flex: 1, padding: '10px', opacity: canModify ? 1 : 0.5, cursor: canModify ? 'pointer' : 'not-allowed' }} disabled={!canModify}>Modify</button>
                        <button className="btn-save" style={{ flex: 1, padding: '10px', opacity: canModify ? 1 : 0.5, cursor: canModify ? 'pointer' : 'not-allowed', color: '#ef4444', border: '1px solid #fee2e2' }} disabled={!canModify} onClick={() => onDelete(log.id)}>Delete</button>
                    </div>
                    {!canModify && <p style={{ fontSize: '10px', color: '#ef4444', textAlign: 'center', margin: 0 }}>This record is locked as it was created over 8 hours ago.</p>}
                </div>
            </div>
        </div>
    );
};

export default EpoxyTreatedSleepers;
