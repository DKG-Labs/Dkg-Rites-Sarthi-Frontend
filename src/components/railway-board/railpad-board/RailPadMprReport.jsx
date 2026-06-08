import React, { useState, useEffect } from 'react';
import { ExportButton, downloadExcel } from '../SharedComponents';
import Pagination from '../../Pagination';
import './RailPadSummary.css';

const RailPadMprReport = ({ mprData = [], loading = false }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Format manufacturer name (take the first part before ~)
    const formatManufacturer = (name) => {
        if (!name) return 'N/A';
        return name.split('~')[0];
    };

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(0);
    }, [searchQuery]);

    if (loading) {
        return (
            <div className="railpad-report-container animate-up" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                <div className="text-center">
                    <div className="spinner-border text-emerald-600 mb-3" style={{ width: '3rem', height: '3rem' }}></div>
                    <p className="text-slate-500 font-medium">Fetching PO Wise Monthly Progress Report...</p>
                </div>
            </div>
        );
    }

    const data = Array.isArray(mprData) ? mprData : [];

    // Filter data based on search query
    const filteredData = data.filter((row) => {
        const query = searchQuery.toLowerCase();
        return (
            (row.rly || '').toLowerCase().includes(query) ||
            (row.poNo || '').toLowerCase().includes(query) ||
            (row.manufacturer || '').toLowerCase().includes(query)
        );
    });

    // Paginated subset of filtered data
    const paginatedData = filteredData.slice(
        currentPage * rowsPerPage,
        (currentPage + 1) * rowsPerPage
    );

    const handleExport = () => {
        const exportColumns = [
            { label: 'Rly', key: 'rly' },
            { label: 'PO Number', key: 'poNo' },
            { label: 'Manufacturer', key: 'manufacturer' },
            { label: 'PO Qty', key: 'poQty' },
            { label: 'UOM', key: 'uom' },
            { label: 'Dispatched (Monthly)', key: 'dispatchedMonthly' },
            { label: 'Total Dispatched', key: 'totalDispatched' },
            { label: 'Balance', key: 'balance' }
        ];
        downloadExcel(filteredData, exportColumns, 'PO_Wise_Monthly_Progress_Report_Rail_Pad');
    };

    return (
        <div className="railpad-report-container animate-up">
            <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ color: '#166534', fontWeight: 'bold', fontSize: '14px' }}>PO Wise Monthly Progress Report</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <ExportButton onClick={handleExport} />
                    <input
                        type="text"
                        placeholder="Search PO, Rly..."
                        className="prof-search"
                        style={{ height: '36px', fontSize: '13px' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-responsive prof-card" style={{ padding: '0px', border: '1px solid #cbd5e1' }}>
                <table className="prof-table mpr-equal-table">
                    <thead>
                        <tr>
                            <th>Rly + PO Number</th>
                            <th>Manufacturer</th>
                            <th className="text-right">PO Qty</th>
                            <th className="text-right">Dispatched (Monthly)</th>
                            <th className="text-right">Total Dispatched</th>
                            <th className="text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row, idx) => (
                                <tr key={row.poNo || idx} className={idx % 2 === 0 ? 'row-odd' : 'row-even'}>
                                    <td style={{ fontWeight: '600' }}>
                                        {row.rly} / {row.poNo}
                                    </td>
                                    <td>{formatManufacturer(row.manufacturer)}</td>
                                    <td className="text-right">
                                        {row.poQty?.toLocaleString()} {row.uom || 'Nos.'}
                                    </td>
                                    <td className="text-right font-bold" style={{ color: '#0369a1' }}>
                                        +{row.dispatchedMonthly?.toLocaleString() || 0}
                                    </td>
                                    <td className="text-right font-bold" style={{ color: '#16a34a' }}>
                                        {row.totalDispatched?.toLocaleString() || 0}
                                    </td>
                                    <td className="text-right font-bold" style={{ color: row.balance === 0 ? '#10b981' : '#dc2626' }}>
                                        {row.balance?.toLocaleString() || 0}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center p-8 text-slate-400">
                                    No progress report data found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {filteredData.length > 0 && (
                <div className="mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredData.length / rowsPerPage)}
                        start={currentPage * rowsPerPage}
                        end={Math.min((currentPage + 1) * rowsPerPage, filteredData.length)}
                        totalCount={filteredData.length}
                        onPageChange={setCurrentPage}
                        rows={rowsPerPage}
                        onRowsChange={setRowsPerPage}
                    />
                </div>
            )}
        </div>
    );
};

export default RailPadMprReport;
