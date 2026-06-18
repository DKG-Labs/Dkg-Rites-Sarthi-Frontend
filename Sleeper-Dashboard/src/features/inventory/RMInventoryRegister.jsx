import React, { useState, useEffect } from 'react';
import './RMInventoryRegister.css';

const MOCK_LEDGER_DATA = [
    { id: 'L001', date: '2026-06-01', subType: 'OPC-53', procured: 500, used: 0, balance: 500 },
    { id: 'L002', date: '2026-06-05', subType: 'OPC-53', procured: 0, used: 100, balance: 400 },
    { id: 'L003', date: '2026-06-10', subType: 'OPC-53', procured: 0, used: 100.5, balance: 299.5 },
    { id: 'L004', date: '2026-06-12', subType: 'OPC-53', procured: 200, used: 0, balance: 499.5 },
    { id: 'L005', date: '2026-06-15', subType: 'OPC-53', procured: 0, used: 121, balance: 378.5 },
];

const RMInventoryRegister = ({ rmCategory }) => {
    const [loading, setLoading] = useState(false);
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterSubType, setFilterSubType] = useState('');

    // Simulate API fetch
    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [rmCategory, filterStartDate, filterEndDate, filterSubType]);

    // Apply filters
    const filteredData = MOCK_LEDGER_DATA.filter(row => {
        if (filterStartDate && row.date < filterStartDate) return false;
        if (filterEndDate && row.date > filterEndDate) return false;
        if (filterSubType && row.subType !== filterSubType) return false;
        return true;
    });

    return (
        <div className="rm-inventory-register fade-in">
            <header className="reg-header">
                <div>
                    <h2>{rmCategory.name} Inventory Register</h2>
                    <p>Official inventory ledger tracking verified quantities procured vs used.</p>
                </div>
                <div className="reg-filters">
                    <div className="filter-group">
                        <label>From Date</label>
                        <input 
                            type="date" 
                            value={filterStartDate} 
                            onChange={(e) => setFilterStartDate(e.target.value)} 
                        />
                    </div>
                    <div className="filter-group">
                        <label>To Date</label>
                        <input 
                            type="date" 
                            value={filterEndDate} 
                            onChange={(e) => setFilterEndDate(e.target.value)} 
                        />
                    </div>
                    <div className="filter-group">
                        <label>Sub-Type</label>
                        <select 
                            value={filterSubType} 
                            onChange={(e) => setFilterSubType(e.target.value)}
                        >
                            <option value="">All Sub-Types</option>
                            <option value="OPC-53">OPC-53</option>
                            <option value="PPC">PPC</option>
                        </select>
                    </div>
                    <button className="clear-filter-btn" onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setFilterSubType(''); }}>
                        Clear
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="loading-state">Loading ledger...</div>
            ) : (
                <div className="table-container">
                    <table className="reg-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Raw Material & Type</th>
                                <th className="num-col">Quantity Procured</th>
                                <th className="num-col">Quantity Used</th>
                                <th className="num-col">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                                        No verified transactions found.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map(row => (
                                    <tr key={row.id}>
                                        <td>{row.date}</td>
                                        <td>{rmCategory.name} - {row.subType}</td>
                                        <td className="num-col positive">
                                            {row.procured > 0 ? `+${row.procured} ${rmCategory.unit}` : '-'}
                                        </td>
                                        <td className="num-col negative">
                                            {row.used > 0 ? `-${row.used} ${rmCategory.unit}` : '-'}
                                        </td>
                                        <td className="num-col balance-col">
                                            {row.balance} {rmCategory.unit}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default RMInventoryRegister;
