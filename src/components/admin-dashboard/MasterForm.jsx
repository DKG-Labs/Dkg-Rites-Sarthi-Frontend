import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/helpers';

export const MasterForm = ({ master, onSubmit, onCancel }) => {
    const masterTypes = ['Vendor', 'BPO', 'Consignee', 'Item', 'Plant', 'Instrument'];
    const statuses = ['Active', 'Inactive', 'Pending Approval'];

    const [formData, setFormData] = useState({
        masterType: '',
        masterName: '',
        masterCode: '',
        vendor: '',
        status: 'Active',
        createdDate: formatDate(new Date().toISOString()),
        createdBy: 'Admin'
    });

    useEffect(() => {
        if (master) {
            setFormData(master);
        }
    }, [master]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Master Type</label>
                    <select
                        name="masterType"
                        className="form-control"
                        value={formData.masterType}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Master Type</option>
                        {masterTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Master Code</label>
                    <input
                        type="text"
                        name="masterCode"
                        className="form-control"
                        value={formData.masterCode}
                        onChange={handleChange}
                        required
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Master Name</label>
                    <input
                        type="text"
                        name="masterName"
                        className="form-control"
                        value={formData.masterName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Vendor</label>
                    <input
                        type="text"
                        name="vendor"
                        className="form-control"
                        value={formData.vendor}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                        name="status"
                        className="form-control"
                        value={formData.status}
                        onChange={handleChange}
                    >
                        {statuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Created Date</label>
                    <input
                        type="date"
                        name="createdDate"
                        className="form-control"
                        value={formData.createdDate}
                        onChange={handleChange}
                        disabled
                    />
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Created By</label>
                <input
                    type="text"
                    name="createdBy"
                    className="form-control"
                    value={formData.createdBy}
                    onChange={handleChange}
                    disabled
                />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                    {master ? 'Update Master' : 'Create Master'}
                </button>
            </div>
        </form>
    );
};
