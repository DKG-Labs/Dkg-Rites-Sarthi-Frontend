import React, { useState, useEffect } from 'react';
import { ExportButton, downloadExcel } from '../SharedComponents';
import Pagination from '../../Pagination';
import './RailPadSummary.css';

const RailPadMauReport = ({ mauData = [], loading = false }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Reset pagination when search query changes
    useEffect(() => {
        setCurrentPage(0);
    }, [searchQuery]);

    if (loading) {
        return (
            <div className="railpad-report-container animate-up" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                <div className="text-center">
                    <div className="spinner-border text-emerald-600 mb-3" style={{ width: '3rem', height: '3rem' }}></div>
                    <p className="text-slate-500 font-medium">Fetching Monthly Analysis of Units (MAU)...</p>
                </div>
            </div>
        );
    }

    const data = Array.isArray(mauData) ? mauData : [];

    // Filter data based on search query
    const filteredData = data.filter((row) => {
        const query = searchQuery.toLowerCase();
        return (
            (row.plantName || '').toLowerCase().includes(query) ||
            (row.rio || '').toLowerCase().includes(query)
        );
    });

    // Paginated subset of filtered data
    const paginatedData = filteredData.slice(
        currentPage * rowsPerPage,
        (currentPage + 1) * rowsPerPage
    );

    const handleExport = () => {
        const exportColumns = [
            { label: 'Plant Name', key: 'plantName' },
            { label: 'RITES RIO', key: 'rio' },
            { label: 'Production', key: 'production' },
            { label: 'Acceptance', key: 'acceptance' },
            { label: 'Process Rejection', key: 'processRejection' },
            { label: 'Process Rej %', key: 'processRejPct' },
            { label: 'Final Rejection', key: 'finalRejection' },
            { label: 'Final Rej %', key: 'finalRejPct' },
            { label: 'Total Rej %', key: 'totalRejPct' }
        ];
        downloadExcel(filteredData, exportColumns, 'Rail_Pad_MAU_Report');
    };

    return (
        <div className="railpad-report-container animate-up">
            <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ color: '#166534', fontWeight: 'bold', fontSize: '14px' }}>Monthly Analysis of Units (MAU) - Rail Pad</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <ExportButton onClick={handleExport} />
                    <input
                        type="text"
                        placeholder="Search Plant, RIO..."
                        className="prof-search"
                        style={{ height: '36px', fontSize: '13px' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-responsive prof-card" style={{ padding: '0px', border: '1px solid #cbd5e1' }}>
                <table className="prof-table">
                    <thead>
                        <tr>
                            <th>Plant Name</th>
                            <th>RITES RIO</th>
                            <th className="text-right">Production</th>
                            <th className="text-right">Acceptance</th>
                            <th className="text-right">Process Rejection</th>
                            <th className="text-right">Process Rej %</th>
                            <th className="text-right">Final Rejection</th>
                            <th className="text-right">Final Rej %</th>
                            <th className="text-right">Total Rej %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row, idx) => (
                                <tr key={row.plantName || idx} className={idx % 2 === 0 ? 'row-odd' : 'row-even'}>
                                    <td style={{ fontWeight: '600' }}>{row.plantName}</td>
                                    <td>{row.rio}</td>
                                    <td className="text-right">{(row.production || 0).toLocaleString()} Nos.</td>
                                    <td className="text-right font-bold" style={{ color: '#16a34a' }}>{(row.acceptance || 0).toLocaleString()} Nos.</td>
                                    <td className="text-right" style={{ color: '#f59e0b' }}>{(row.processRejection || 0).toLocaleString()} Nos.</td>
                                    <td className="text-right">{(row.processRejPct || 0).toFixed(2)}%</td>
                                    <td className="text-right" style={{ color: '#ef4444' }}>{(row.finalRejection || 0).toLocaleString()} Nos.</td>
                                    <td className="text-right">{(row.finalRejPct || 0).toFixed(2)}%</td>
                                    <td className="text-right font-bold">{(row.totalRejPct || 0).toFixed(2)}%</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" className="text-center p-8 text-slate-400">
                                    No monthly analysis records found.
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

export default RailPadMauReport;
