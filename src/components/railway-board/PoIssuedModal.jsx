import React, { useState, useMemo } from 'react';
import './PoIssuedModal.css';

const PoIssuedModal = ({ isOpen, onClose, data, title, isLoading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedZone, setSelectedZone] = useState('all');

    // Get unique zones for filter
    const zones = useMemo(() => {
        if (!data) return ['all'];
        const validData = data.filter(item => !(item.poNumber || '').toLowerCase().includes('dummy'));
        const uniqueZones = [...new Set(validData.map(item => item.railwayZone))].filter(Boolean);
        return ['all', ...uniqueZones.sort()];
    }, [data]);

    // Filtered data
    const filteredData = useMemo(() => {
        if (!data) return [];
        return data.filter(item => {
            if ((item.poNumber || '').toLowerCase().includes('dummy')) {
                return false;
            }

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
                    <button className="btn-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
                </div>
                
                <div className="modal-filters">
                    <div className="search-box">
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input 
                            type="text" 
                            placeholder="Search PO No or Vendor..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="filter-group">
                        <select 
                            value={selectedZone} 
                            onChange={(e) => setSelectedZone(e.target.value)}
                            className="modal-select"
                            disabled={isLoading}
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
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="skeleton-row">
                                        <td><div className="skeleton-cell" style={{ width: '20px' }}></div></td>
                                        <td><div className="skeleton-cell" style={{ width: '40px' }}></div></td>
                                        <td><div className="skeleton-cell" style={{ width: '120px' }}></div></td>
                                        <td><div className="skeleton-cell" style={{ width: '80px' }}></div></td>
                                        <td><div className="skeleton-cell" style={{ width: '150px' }}></div></td>
                                        <td className="text-right"><div className="skeleton-cell" style={{ width: '80px', marginLeft: 'auto' }}></div></td>
                                        <td className="text-right"><div className="skeleton-cell" style={{ width: '80px', marginLeft: 'auto' }}></div></td>
                                        <td className="text-right"><div className="skeleton-cell" style={{ width: '80px', marginLeft: 'auto' }}></div></td>
                                    </tr>
                                ))
                            ) : filteredData.length > 0 ? (
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
