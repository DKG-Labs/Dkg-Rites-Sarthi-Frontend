import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import './PlantDeclarationVerification.css';

const BenchMouldUpdateModal = ({ row, onClose, onDone }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        apiService.getBenchMouldStressLongLineById(row.requestId)
            .then(res => setData(res?.responseData ?? res))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [row.requestId]);

    const handleSave = async () => {
        if (!data) return;
        setSaving(true);
        try {
            const payload = {
                id: data.id,
                plantType: data.plantType,
                category: data.category,
                subCategory: data.subCategory,
                drawingNo: data.drawingNo,
                vendorCode: data.vendorCode,
                plantId: data.plantId,
                createdBy: data.createdBy,
                details: data.details.map(item => ({
                    id: item.id,
                    sleeperCode: item.sleeperCode,
                    sleeperDrawingNo: item.sleeperDrawingNo,
                    declarationMode: item.declarationMode,
                    benchFrom: item.benchFrom,
                    benchTo: item.benchTo,
                    benchNumber: item.benchNumber,
                    gangFrom: item.gangFrom || 0,
                    gangTo: item.gangTo || 0,
                    gangNumber: item.gangNumber || 0,
                    noOfMoulds: item.noOfMoulds
                }))
            };
            await apiService.updateBenchMouldStressLongLine(data.id, payload);
            alert("Record Updated Succesfully.");
            
            // Perform the Verification transition automatically after update? 
            // Or let the IE click Verify separately? 
            // Usually, these integrated updates are used for correction-and-verification.
            onDone();
            onClose();
        } catch (err) {
            alert("Failed to update record: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading || !data) return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <div className="pdv-spinner-inline" style={{ marginBottom: '10px' }}></div>
            Fetching record details...
        </div>
    );

    return (
        <>
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(15,23,42,0.55)',
                    backdropFilter: 'blur(3px)',
                    zIndex: 1210,
                }}
            />
            <div
                style={{
                    position: 'fixed',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1211,
                    background: '#fff',
                    borderRadius: '16px',
                    width: '95%',
                    maxWidth: '800px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: '1px solid #f1f5f9',
                    position: 'sticky', top: 0, background: '#fff', zIndex: 1,
                    borderRadius: '16px 16px 0 0',
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                            Update Bench & Mould Declaration: {data?.plantType}
                        </h3>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Request ID: #{row.requestId} | {data?.vendorCode}</div>
                    </div>
                    <button onClick={onClose} className="pdv-view-mini" style={{ padding: '6px 12px' }}>✕</button>
                </div>

                <div style={{ padding: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                        <div className="input-field">
                            <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Category</label>
                            <input value={data.category || ''} readOnly style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }} />
                        </div>
                        <div className="input-field">
                            <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Sub-Category</label>
                            <input value={data.subCategory || ''} readOnly style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }} />
                        </div>
                        <div className="input-field">
                            <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Drawing No.</label>
                            <input value={data.drawingNo || ''} readOnly style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }} />
                        </div>
                    </div>

                    <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '16px', borderBottom: '2px solid #7c3aed', width: 'fit-content', paddingBottom: '4px' }}>Declaration Details</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                            <tr style={{ background: '#f1f5f9' }}>
                                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Bench(es)</th>
                                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Gang Range</th>
                                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Moulds/Bench</th>
                                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Mode</th>
                                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Sleeper Code</th>
                                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Drawing No</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.details?.map((item, idx) => (
                                <tr key={item.id || idx}>
                                    <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>
                                        {item.benchNumber ? `Bench ${item.benchNumber}` : (item.benchFrom && item.benchTo ? `${item.benchFrom} - ${item.benchTo}` : '-')}
                                    </td>
                                    <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>
                                        {item.gangNumber ? `Gang ${item.gangNumber}` : (item.gangFrom && item.gangTo ? `${item.gangFrom} - ${item.gangTo}` : '-')}
                                    </td>
                                    <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>
                                        <input 
                                            type="number"
                                            value={item.noOfMoulds || 0}
                                            style={{ width: '70px', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                                            onChange={(e) => {
                                                const newDetails = [...data.details];
                                                newDetails[idx].noOfMoulds = parseInt(e.target.value) || 0;
                                                setData({...data, details: newDetails});
                                            }}
                                        />
                                    </td>
                                    <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{item.declarationMode}</td>
                                    <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{item.sleeperCode}</td>
                                    <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{item.sleeperDrawingNo}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                        <button 
                            disabled={saving}
                            onClick={handleSave}
                            style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '10px', background: '#7c3aed', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
                        >
                            {saving ? 'Updating...' : 'Save & Close'}
                        </button>
                        <button 
                            onClick={onClose}
                            style={{ flex: 1, padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#fff', fontWeight: '700', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BenchMouldUpdateModal;
