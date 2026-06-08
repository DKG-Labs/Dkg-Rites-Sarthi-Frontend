import React, { useState, useMemo } from 'react';
import './PoIssuedModal.css';

const PoIssuedModal = ({ isOpen, onClose, data, title }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedZone, setSelectedZone] = useState('all');

    // Get unique zones for filter
    const zones = useMemo(() => {
        if (!data) return ['all'];
        const uniqueZones = [...new Set(data.map(item => item.railwayZone))].filter(Boolean);
        return ['all', ...uniqueZones.sort()];
    }, [data]);

    // Filtered data
    const filteredData = useMemo(() => {
        if (!data) return [];
        return data.filter(item => {
            const matchesSearch = 
                (item.poNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.vendor || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesZone = selectedZone === 'all' || item.railwayZone === selectedZone;
            
            return matchesSearch && matchesZone;
        });
    }, [data, searchTerm, selectedZone]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-large fade-in" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title} - PO Issued Details</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                
                <div className="modal-filters">
                    <div className="filter-group">
                        <label>Search</label>
                        <input 
                            type="text" 
                            placeholder="Search PO No or Vendor..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="modal-search-input"
                        />
                    </div>
                    <div className="filter-group">
                        <label>Railway Zone</label>
                        <select 
                            value={selectedZone} 
                            onChange={(e) => setSelectedZone(e.target.value)}
                            className="modal-select"
                        >
                            {zones.map(zone => (
                                <option key={zone} value={zone}>
                                    {zone === 'all' ? 'All Zones' : zone}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="modal-table-container">
                    <table className="modal-table">
                        <thead>
                            <tr>
                                <th>Sl No.</th>
                                <th>Railway Zone</th>
                                <th>PO Number</th>
                                <th>PO Date</th>
                                <th>Vendor</th>
                                <th className="text-right">PO Quantity</th>
                                <th className="text-right">Accepted Qty After Final Inspection</th>
                                <th className="text-right">Balance Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length > 0 ? (
                                filteredData.map((item, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{item.railwayZone}</td>
                                        <td>{item.poNumber}</td>
                                        <td>{item.poDate ? new Date(item.poDate).toLocaleDateString('en-GB') : '-'}</td>
                                        <td>{item.vendor}</td>
                                        <td className="text-right">{item.poQuantity?.toLocaleString()} {item.uom}</td>
                                        <td className="text-right">{(item.acceptedQtyAfterFinalInspection ?? 0).toLocaleString()} {item.uom}</td>
                                        <td className="text-right">{(item.balanceQuantity ?? 0).toLocaleString()} {item.uom}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center">No records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="modal-footer">
                    <span>Total Records: {filteredData.length}</span>
                    <button className="btn-close-modal" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default PoIssuedModal;
