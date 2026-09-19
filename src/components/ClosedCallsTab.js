import React, { useState, useEffect, useMemo, useRef } from 'react';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';
import Notification from './Notification';
import { getProductTypeDisplayName, formatDate } from '../utils/helpers';
import CallsFilterSection from './common/CallsFilterSection';
import { getDetailedStatus } from '../utils/statusMapper';
import { viewSignedCertificate } from '../services/certificateService';
import { fetchClosedCallsForIC, getCurrentUserId } from '../services/workflowApiService';
import AnnexureLoader from './annexures/AnnexureLoader';
import CorrectionSlipModal from './CorrectionSlipModal';
import Modal from './Modal';
import axios from 'axios';
import { getAuthHeaders, getStoredUser } from '../services/authService';
import { API_BASE_URL } from '../services/apiConfig';
import { generateCallLetterPDF } from '../call-desk-module/src/utils/generateCallLetterPDF';
import { fetchCallLetterDetails } from '../call-desk-module/src/services/callLetterApi';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import AttachmentRoundedIcon from '@mui/icons-material/AttachmentRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';

const ClosedCallsTab = ({ setSelectedCall, setCurrentPage }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Call Number');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('error');
  const [filters, setFilters] = useState({
    productTypes: [],
    vendors: [],
    dateFrom: '',
    dateTo: '',
    poNumbers: [],
    stage: '',
    callNumbers: []
  });

  const [closedCalls, setClosedCalls] = useState([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(true);
  const [selectedIbsDetail, setSelectedIbsDetail] = useState(null);
  const [selectedActionCall, setSelectedActionCall] = useState(null);
  const [showCorrectionSlipModal, setShowCorrectionSlipModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [tcPdfLoading, setTcPdfLoading] = useState(false);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const loadCalls = async () => {
      if (hasFetchedRef.current) return;
      try {
        setIsLoadingCalls(true);
        const userId = getCurrentUserId();
        if (!userId) {
          setClosedCalls([]);
          return;
        }
        const fetched = await fetchClosedCallsForIC(userId);
        setClosedCalls(fetched);
      } catch (err) {
        console.error('Error fetching closed calls:', err);
        setNotificationType('error');
        setNotificationMessage('Failed to load closed calls from server.');
      } finally {
        setIsLoadingCalls(false);
        hasFetchedRef.current = true;
      }
    };
    loadCalls();
  }, []);

  // Apply filters to data
  const filteredCalls = useMemo(() => {
    let result = [...closedCalls];

    if (filters.productTypes.length > 0) {
      result = result.filter(call => filters.productTypes.includes(call.product_type));
    }
    if (filters.vendors.length > 0) {
      result = result.filter(call => filters.vendors.includes(call.vendor_name));
    }
    if (filters.dateFrom) {
      result = result.filter(call => new Date(call.requested_date) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      result = result.filter(call => new Date(call.requested_date) <= new Date(filters.dateTo));
    }
    if (filters.poNumbers.length > 0) {
      result = result.filter(call => filters.poNumbers.includes(call.po_no));
    }
    if (filters.stage) {
      result = result.filter(call => call.stage === filters.stage);
    }
    if (filters.callNumbers.length > 0) {
      result = result.filter(call => filters.callNumbers.includes(call.call_no));
    }

    if (globalSearchTerm) {
      const lowerSearch = globalSearchTerm.toLowerCase();
      result = result.filter(call => 
        (call.call_no && call.call_no.toLowerCase().includes(lowerSearch)) ||
        (call.po_no && call.po_no.toLowerCase().includes(lowerSearch)) ||
        (call.vendor_name && call.vendor_name.toLowerCase().includes(lowerSearch))
      );
    }

    return result;
  }, [closedCalls, filters, globalSearchTerm]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleMultiSelectToggle = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      productTypes: [],
      vendors: [],
      dateFrom: '',
      dateTo: '',
      poNumbers: [],
      stage: '',
      callNumbers: []
    });
  };

  const renderIbsStatusBadge = (row) => {
    const rawStatus = (row.ibsStatus || '').toUpperCase().trim();
    let bg = '#fef3c7';
    let color = '#b45309';
    let label = 'PENDING';

    if (rawStatus.includes('SUCCESS') || rawStatus === 'OK') {
      bg = '#dcfce7';
      color = '#15803d';
      label = 'SUCCESS';
    } else if (rawStatus.includes('FAIL') || rawStatus.includes('ERROR') || rawStatus === 'NOK') {
      bg = '#fee2e2';
      color = '#b91c1c';
      label = 'FAIL';
    } else {
      bg = '#fef3c7';
      color = '#b45309';
      label = 'PENDING';
    }

    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            backgroundColor: bg,
            color: color,
            padding: '3px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {label}
        </span>
        {row.ibsReason && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIbsDetail(row);
            }}
            title="View IBS Details"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              padding: 0,
              lineHeight: 1
            }}
          >
            ℹ️
          </button>
        )}
      </div>
    );
  };

  const columns = [
    { key: 'call_no', label: 'Call No.' },
    { key: 'po_no', label: 'PO No.' },
    { key: 'ibsCaseNo', label: 'IBS Case Number' },
    { key: 'vendor_name', label: 'Vendor Name' },
    { key: 'product_type', label: 'Product Type', render: (val) => getProductTypeDisplayName(val) },
    { key: 'requested_date', label: 'Date', render: (val) => formatDate(val) },
    {
      key: 'status',
      label: 'Status',
      render: (_val, row) => {
        const { mainStatus, combinedText } = getDetailedStatus(row.status);
        return <StatusBadge status={mainStatus} text={combinedText} />;
      }
    },
    {
      key: 'ibsStatus',
      label: 'IBS Status',
      render: (_val, row) => renderIbsStatusBadge(row)
    }
  ];

  const handleViewAnnexures = (row) => {
    if (setSelectedCall) setSelectedCall(row);
    if (setCurrentPage) setCurrentPage('annexure');
  };

  const handleViewIC = async (row) => {
    try {
      const icNumber = row.ic_number || row.icNo || row.call_no;
      if (!icNumber) {
        setNotificationType('error');
        setNotificationMessage('The Inspection Certificate (IC) number was not found for this call.');
        return;
      }
      
      setNotificationType('info');
      setNotificationMessage('Retrieving signed Inspection Certificate...');
      
      const { signedData } = await viewSignedCertificate(icNumber);
      
      const byteCharacters = atob(signedData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      
      setNotificationMessage(''); // Clear notification on success
    } catch (err) {
      console.error(err);
      setNotificationType('error');
      const errMsg = err.message || '';
      if (errMsg.includes('download') || errMsg.includes('Azure') || errMsg.includes('fetch')) {
        setNotificationMessage('The signed Inspection Certificate is temporarily unavailable. Please try again in a few moments.');
      } else if (errMsg.includes('No signed certificate found')) {
        setNotificationMessage('The signed Inspection Certificate is not yet available for this call.');
      } else {
        setNotificationMessage(errMsg || 'Unable to retrieve the signed Inspection Certificate. Please try again.');
      }
    }
  };

  const handleDownloadLetter = async (call) => {
    if (!call?.call_no && !call?.callNumber) {
      setNotificationType('error');
      setNotificationMessage('Call ID not found. Cannot generate PDF.');
      return;
    }
    const callNumber = call.call_no || call.callNumber;
    setPdfLoading(true);
    try {
      const pdfCallData = {
        ...call,
        callNumber: callNumber,
        poNumber: call.po_no || call.poNumber,
        vendorName: call.vendor_name || call.vendorName
      };
      
      const details = await fetchCallLetterDetails(callNumber);
      const user = getStoredUser();
      const enrichedCall = { 
        ...pdfCallData, 
        ...details,
        rio: details.rio || pdfCallData.rio || user?.rio 
      };
      
      generateCallLetterPDF(enrichedCall);
    } catch (err) {
      console.error('Failed to generate Call Letter PDF:', err);
      setNotificationType('error');
      setNotificationMessage('Failed to generate Call Letter PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  const downloadPoDoc = async (call) => {
    const rawPoNo = call.po_no || call.poNumber || call.rawPoNo;
    if (!rawPoNo) {
      setNotificationType('error');
      setNotificationMessage('No PO number available for this call.');
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendor/po-pdf-path`, {
        params: { rawPoNo },
        headers: getAuthHeaders()
      });
      const pdfPath = response.data?.responseData;
      if (!pdfPath) {
        setNotificationType('error');
        setNotificationMessage('No PO document found for this PO.');
        return;
      }
      if (pdfPath.startsWith('http') || pdfPath.includes('ireps.gov.in')) {
        const proxyUrl = `${API_BASE_URL}/api/vendor/proxy-pdf?url=${encodeURIComponent(pdfPath)}`;
        const a = document.createElement('a');
        a.href = proxyUrl;
        a.download = `PO_${rawPoNo}.pdf`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        window.open(pdfPath, '_blank');
      }
    } catch (err) {
      console.error('Error downloading PO document:', err);
      setNotificationType('error');
      setNotificationMessage('Failed to download PO document.');
    }
  };

  const downloadTCDoc = async (call) => {
    const callNumber = call.call_no || call.callNumber || call.icNumber;
    if (!callNumber) {
      setNotificationType('error');
      setNotificationMessage('Call ID not found. Cannot download TC Document.');
      return;
    }
    
    setTcPdfLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendor/inspection-calls/tc-docs/${callNumber}`, {
        headers: getAuthHeaders(),
        responseType: 'blob'
      });
      
      if (response.status === 200) {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `TC_Documents_${callNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to download TC document:', err);
      let errorMessage = 'Failed to download TC document. It may not be available yet.';
      if (err.response && err.response.status === 404) {
          errorMessage = 'No TC Documents found for this call number.';
      }
      setNotificationType('info');
      setNotificationMessage(errorMessage);
    } finally {
      setTcPdfLoading(false);
    }
  };

  const actions = (row) => {
    return (
      <button
        className="btn btn-sm btn-primary"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedActionCall(row);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          fontWeight: 600,
          borderRadius: '6px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          whiteSpace: 'nowrap'
        }}
        title="View Call Actions"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        View Actions
      </button>
    );
  };

  return (
    <div>
      <CallsFilterSection
        allCalls={closedCalls}
        filteredCalls={filteredCalls}
        filters={filters}
        setFilters={setFilters}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        filterSearch={filterSearch}
        setFilterSearch={setFilterSearch}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        clearAllFilters={clearAllFilters}
        handleFilterChange={handleFilterChange}
        handleMultiSelectToggle={handleMultiSelectToggle}
        summaryLabel="closed calls"
        globalSearchTerm={globalSearchTerm}
        setGlobalSearchTerm={setGlobalSearchTerm}
      />

      {/* Loading State */}
      {isLoadingCalls && (
        <AnnexureLoader
          title="Fetching Closed Calls"
          subtitle="Gathering calls submitted to IBS..."
        />
      )}

      {/* No Data State */}
      {!isLoadingCalls && closedCalls.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-32)' }}>
          <p>No closed calls found.</p>
        </div>
      )}

      {/* Notification Message */}
      <Notification
        message={notificationMessage}
        type={notificationType}
        autoClose={notificationType !== 'info'}
        autoCloseDelay={5000}
        onClose={() => setNotificationMessage('')}
      />

      {!isLoadingCalls && closedCalls.length > 0 && (
        <DataTable
          columns={columns}
          data={filteredCalls}
          actions={actions}
          initialPageSize={10}
          hidePageSize={true}
          hideSearch={true}
        />
      )}

      {/* Inspection Call Details Modal */}
      {selectedActionCall && (
        <div 
          className="modal-overlay" 
          onClick={() => setSelectedActionCall(null)} 
          style={{ zIndex: 9999, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '960px', 
              width: '95%', 
              borderRadius: '16px', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
              backgroundColor: '#ffffff'
            }}
          >
            <div className="modal-header" style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 className="modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#0ea5e9' }}>📋</span> Inspection Call Details - <span style={{ color: '#334155' }}>{selectedActionCall.call_no || selectedActionCall.callNumber}</span>
              </h2>
              <button 
                className="modal-close" 
                onClick={() => setSelectedActionCall(null)}
                style={{
                  background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%',
                  width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s ease', color: '#64748b', fontSize: '1.2rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fecaca'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
              >×</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto', padding: '32px 24px' }}>
              {/* Top Summary Section */}
              <div style={{ 
                background: 'linear-gradient(to right, #ffffff, #f8fafc)', 
                padding: '20px', 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #0ea5e9', 
                marginBottom: '32px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Call Number</label>
                    <div style={{ fontWeight: '600', fontSize: '16px', color: '#0f172a' }}>{selectedActionCall.call_no || selectedActionCall.callNumber || '-'}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Vendor Name</label>
                    <div style={{ fontWeight: '600', fontSize: '16px', color: '#0f172a' }}>{selectedActionCall.vendor_name || selectedActionCall.vendorName || '-'}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>PO Number</label>
                    <div style={{ fontWeight: '600', fontSize: '16px', color: '#0f172a' }}>{selectedActionCall.po_no || selectedActionCall.poNumber || '-'}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Product Type</label>
                    <div style={{ display: 'inline-block', background: '#e0f2fe', color: '#0284c7', padding: '4px 10px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
                      {getProductTypeDisplayName(selectedActionCall.product_type) || selectedActionCall.product_type || 'Final'}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Status</label>
                    <div style={{ display: 'inline-block', background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
                      Closed - Sent to IBS
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>IBS Status</label>
                    <div>
                      {renderIbsStatusBadge(selectedActionCall)}
                    </div>
                  </div>
                  {(selectedActionCall.ibsCaseNo || selectedActionCall.caseNo) && (
                    <div>
                      <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>IBS Case Number</label>
                      <div style={{ fontWeight: '600', fontSize: '15px', color: '#0f172a' }}>
                        {selectedActionCall.ibsCaseNo || selectedActionCall.caseNo}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#f59e0b' }}>⚡</span> Actions & Documents
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                {/* 1. View IC */}
                <button
                  onClick={() => {
                    const row = selectedActionCall;
                    setSelectedActionCall(null);
                    handleViewIC(row);
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    padding: '24px 16px', background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
                    border: '1px solid #a5f3fc', borderRadius: '16px',
                    cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    color: '#0891b2', width: '100%',
                    boxShadow: '0 4px 6px -1px rgba(8, 145, 178, 0.1), 0 2px 4px -1px rgba(8, 145, 178, 0.06)'
                  }}
                  onMouseEnter={(e) => { 
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(8, 145, 178, 0.2), 0 4px 6px -2px rgba(8, 145, 178, 0.1)'; 
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(8, 145, 178, 0.1), 0 2px 4px -1px rgba(8, 145, 178, 0.06)'; 
                  }}
                >
                  <div style={{ width: '48px', height: '48px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <PictureAsPdfRoundedIcon style={{ fontSize: '26px', color: '#0891b2' }} />
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '15px' }}>View IC</span>
                </button>

                {/* 2. Correction Slip */}
                <button
                  onClick={() => {
                    setShowCorrectionSlipModal(true);
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    padding: '24px 16px', background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                    border: '1px solid #fed7aa', borderRadius: '16px',
                    cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    color: '#ea580c', width: '100%',
                    boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.1), 0 2px 4px -1px rgba(234, 88, 12, 0.06)'
                  }}
                  onMouseEnter={(e) => { 
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(234, 88, 12, 0.2), 0 4px 6px -2px rgba(234, 88, 12, 0.1)'; 
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(234, 88, 12, 0.1), 0 2px 4px -1px rgba(234, 88, 12, 0.06)'; 
                  }}
                >
                  <div style={{ width: '48px', height: '48px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <EditNoteRoundedIcon style={{ fontSize: '26px', color: '#ea580c' }} />
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '15px' }}>Correction Slip</span>
                </button>

                {/* 3. Annexures */}
                <button
                  onClick={() => {
                    const row = selectedActionCall;
                    setSelectedActionCall(null);
                    handleViewAnnexures(row);
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    padding: '24px 16px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    border: '1px solid #bbf7d0', borderRadius: '16px',
                    cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    color: '#16a34a', width: '100%',
                    boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.1), 0 2px 4px -1px rgba(22, 163, 74, 0.06)'
                  }}
                  onMouseEnter={(e) => { 
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(22, 163, 74, 0.2), 0 4px 6px -2px rgba(22, 163, 74, 0.1)'; 
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(22, 163, 74, 0.1), 0 2px 4px -1px rgba(22, 163, 74, 0.06)'; 
                  }}
                >
                  <div style={{ width: '48px', height: '48px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <AttachmentRoundedIcon style={{ fontSize: '26px', color: '#16a34a' }} />
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '15px' }}>Annexures</span>
                </button>

                {/* 4. Call Letter */}
                <button
                  onClick={() => handleDownloadLetter(selectedActionCall)}
                  disabled={pdfLoading}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    padding: '24px 16px', background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
                    border: '1px solid #a5f3fc', borderRadius: '16px',
                    cursor: pdfLoading ? 'not-allowed' : 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    color: '#0891b2', width: '100%',
                    boxShadow: '0 4px 6px -1px rgba(8, 145, 178, 0.1), 0 2px 4px -1px rgba(8, 145, 178, 0.06)'
                  }}
                  onMouseEnter={(e) => { 
                    if(!pdfLoading) { 
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(8, 145, 178, 0.2), 0 4px 6px -2px rgba(8, 145, 178, 0.1)'; 
                    }
                  }}
                  onMouseLeave={(e) => { 
                    if(!pdfLoading) { 
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(8, 145, 178, 0.1), 0 2px 4px -1px rgba(8, 145, 178, 0.06)'; 
                    }
                  }}
                >
                  <div style={{ width: '48px', height: '48px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <FileDownloadRoundedIcon style={{ fontSize: '26px', color: '#0891b2' }} />
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '15px' }}>{pdfLoading ? 'Generating...' : 'Call Letter'}</span>
                </button>

                {/* 5. PO & MA */}
                <button
                  onClick={() => downloadPoDoc(selectedActionCall)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    padding: '24px 16px', background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                    border: '1px solid #d8b4fe', borderRadius: '16px',
                    cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    color: '#7e22ce', width: '100%',
                    boxShadow: '0 4px 6px -1px rgba(126, 34, 206, 0.1), 0 2px 4px -1px rgba(126, 34, 206, 0.06)'
                  }}
                  onMouseEnter={(e) => { 
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(126, 34, 206, 0.2), 0 4px 6px -2px rgba(126, 34, 206, 0.1)'; 
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(126, 34, 206, 0.1), 0 2px 4px -1px rgba(126, 34, 206, 0.06)'; 
                  }}
                >
                  <div style={{ width: '48px', height: '48px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <DescriptionRoundedIcon style={{ fontSize: '26px', color: '#7e22ce' }} />
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '15px' }}>PO & MA</span>
                </button>

                {/* 6. Document (TC) */}
                <button
                  onClick={() => downloadTCDoc(selectedActionCall)}
                  disabled={tcPdfLoading}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    padding: '24px 16px', background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                    border: '1px solid #86efac', borderRadius: '16px',
                    cursor: tcPdfLoading ? 'not-allowed' : 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    color: '#15803d', width: '100%',
                    boxShadow: '0 4px 6px -1px rgba(21, 128, 61, 0.1), 0 2px 4px -1px rgba(21, 128, 61, 0.06)',
                    opacity: tcPdfLoading ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => { 
                    if (!tcPdfLoading) {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(21, 128, 61, 0.2), 0 4px 6px -2px rgba(21, 128, 61, 0.1)'; 
                    }
                  }}
                  onMouseLeave={(e) => { 
                    if (!tcPdfLoading) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(21, 128, 61, 0.1), 0 2px 4px -1px rgba(21, 128, 61, 0.06)'; 
                    }
                  }}
                >
                  <div style={{ width: '48px', height: '48px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <DescriptionRoundedIcon style={{ fontSize: '26px', color: '#15803d' }} />
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '15px' }}>{tcPdfLoading ? 'Downloading...' : 'TC Document'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Correction Slip Modal */}
      {showCorrectionSlipModal && selectedActionCall && (
        <CorrectionSlipModal
          isOpen={showCorrectionSlipModal}
          onClose={() => setShowCorrectionSlipModal(false)}
          callNumber={selectedActionCall.call_no || selectedActionCall.callNumber || selectedActionCall.icNumber}
          row={selectedActionCall}
        />
      )}

      {/* IBS Detail Modal */}
      {selectedIbsDetail && (
        <Modal
          isOpen={Boolean(selectedIbsDetail)}
          onClose={() => setSelectedIbsDetail(null)}
          title={`IBS Status Details - ${selectedIbsDetail.call_no}`}
          footer={
            <button className="btn btn-secondary" onClick={() => setSelectedIbsDetail(null)}>
              Close
            </button>
          }
        >
          <div style={{ padding: '8px 0', fontSize: '14px' }}>
            <div style={{ marginBottom: '12px' }}>
              <strong>IBS Status: </strong>
              <span>{selectedIbsDetail.ibsStatus || 'N/A'}</span>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>IBS Case Number: </strong>
              <span>{selectedIbsDetail.ibsCaseNo || 'N/A'}</span>
            </div>
            {selectedIbsDetail.ibsReason && (
              <div style={{
                background: '#f8fafc',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}>
                <strong>Response / Reason:</strong>
                <p style={{ margin: '6px 0 0 0', whiteSpace: 'pre-wrap', color: '#334155' }}>
                  {selectedIbsDetail.ibsReason}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ClosedCallsTab;
