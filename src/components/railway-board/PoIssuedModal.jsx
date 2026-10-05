import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from '../../services/apiConfig';
import './PoIssuedModal.css';

const PoIssuedModal = ({ isOpen, onClose, data, title, isLoading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedZone, setSelectedZone] = useState('all');
    const [downloadingPo, setDownloadingPo] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);

    const showToast = (msg, isError = false) => {
        setToastMessage({ text: msg, isError });
        setTimeout(() => setToastMessage(null), 4000);
    };

    const handleDownloadPo = async (e, item) => {
        e.preventDefault();
        e.stopPropagation();

        const rawPoNo = item.poNumber;
        if (!rawPoNo) {
            showToast('PO number not found', true);
            return;
        }

        // Clean PO number if needed (e.g. bare number before /)
        const barePoNo = rawPoNo.includes('/') ? rawPoNo.split('/')[0].trim() : rawPoNo.trim();

        setDownloadingPo(rawPoNo);
        try {
            let pdfPath = item.pdfPath;
            if (!pdfPath) {
                const response = await axios.get(`${API_BASE_URL}/api/vendor/po-pdf-path`, {
                    params: { rawPoNo: barePoNo },
                    headers: getAuthHeaders()
                });
                pdfPath = response.data?.responseData;
            }

            if (!pdfPath) {
                showToast(`No PO document found for PO #${rawPoNo}`, true);
                return;
            }

            if (pdfPath.startsWith('http') || pdfPath.includes('ireps.gov.in')) {
                const proxyUrl = `${API_BASE_URL}/api/vendor/proxy-pdf?url=${encodeURIComponent(pdfPath)}`;
                const a = document.createElement('a');
                a.href = proxyUrl;
                a.download = `PO_${barePoNo}.pdf`;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                window.open(pdfPath, '_blank');
            }
        } catch (err) {
            console.error('Error downloading PO document:', err);
            showToast(`Failed to download PO document for #${rawPoNo}`, true);
        } finally {
            setDownloadingPo(null);
        }
    };

    const formatVendorName = (vendor) => {
        if (!vendor) return '-';
        const cleaned = vendor.split('~')[0].trim();
        return cleaned || vendor;
    };

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

            const vendorClean = formatVendorName(item.vendor);
            const matchesSearch = 
                (item.poNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                vendorClean.toLowerCase().includes(searchTerm.toLowerCase());
            
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
                        {searchTerm && (
                            <button
                                type="button"
                                className="search-clear-btn"
                                onClick={() => setSearchTerm('')}
                                title="Clear search"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        )}
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
                                        <td>
                                            <button
                                                type="button"
                                                className="po-download-link"
                                                onClick={(e) => handleDownloadPo(e, item)}
                                                disabled={downloadingPo === item.poNumber}
                                                title={`Click to download PO #${item.poNumber}`}
                                            >
                                                {downloadingPo === item.poNumber ? (
                                                    <>
                                                        <i className="fa-solid fa-spinner fa-spin"></i>
                                                        <span>{item.poNumber}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>{item.poNumber}</span>
                                                        <i className="fa-solid fa-download" style={{ fontSize: '11px', opacity: 0.7 }}></i>
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td>{item.poDate ? new Date(item.poDate).toLocaleDateString('en-GB') : '-'}</td>
                                        <td title={item.vendor}>{formatVendorName(item.vendor)}</td>
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
                
                {toastMessage && (
                    <div className={`modal-toast ${toastMessage.isError ? 'error' : 'success'}`}>
                        <i className={`fa-solid ${toastMessage.isError ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
                        <span>{toastMessage.text}</span>
                    </div>
                )}

                <div className="modal-footer">
                    <span>Total Records: {filteredData.length}</span>
                    <button className="btn-close-modal" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default PoIssuedModal;
