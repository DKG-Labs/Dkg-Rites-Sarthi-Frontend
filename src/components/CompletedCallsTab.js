import React, { useState, useEffect, useMemo, useRef } from 'react';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';
import Notification from './Notification';
import { getProductTypeDisplayName, formatDate } from '../utils/helpers';
import CallsFilterSection from './common/CallsFilterSection';
import { getDetailedStatus } from '../utils/statusMapper';
import { viewSignedCertificate } from '../services/certificateService';
import { fetchSignedCallsForIC, getCurrentUserId, deleteEsignTransition } from '../services/workflowApiService';
import { performTransitionAction } from '../services/workflowService';
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
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';

const CompletedCallsTab = ({ setSelectedCall, setCurrentPage, onCallSentToIbs }) => {
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

  const [completedCalls, setCompletedCalls] = useState([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(true);
  const [selectedActionCall, setSelectedActionCall] = useState(null);
  const [correctionSlipRow, setCorrectionSlipRow] = useState(null);
  const [sendIbsCallRow, setSendIbsCallRow] = useState(null);
  const [isSendingIbs, setIsSendingIbs] = useState(false);
  const [revertIcCallRow, setRevertIcCallRow] = useState(null);
  const [isRevertingIc, setIsRevertingIc] = useState(false);
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
          setCompletedCalls([]);
          return;
        }
        const fetched = await fetchSignedCallsForIC(userId);
        // Keep completed / signed / cancelled calls
        const validCalls = fetched.filter(c => 
          c.status === 'Completed' || 
          c.status === 'DSC_SIGN_IC' || 
          c.originalStatus === 'DSC_SIGN_IC' ||
          (c.status || '').toUpperCase().includes('CANCEL') ||
          (c.originalStatus || '').toUpperCase().includes('CANCEL')
        );
        setCompletedCalls(validCalls);
      } catch (err) {
        console.error('Error fetching completed calls:', err);
        setNotificationType('error');
        setNotificationMessage('Failed to load completed calls from server.');
      } finally {
        setIsLoadingCalls(false);
        hasFetchedRef.current = true;
      }
    };
    loadCalls();
  }, []);

  // Apply filters to data
  const filteredCalls = useMemo(() => {
    let result = [...completedCalls];

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
  }, [completedCalls, filters, globalSearchTerm]);

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

  const handleConfirmSendToIbs = async () => {
    if (!sendIbsCallRow) return;
    try {
      setIsSendingIbs(true);
      const userId = getCurrentUserId();
      const payload = {
        workflowTransitionId: sendIbsCallRow.id || sendIbsCallRow.transitionId,
        requestId: sendIbsCallRow.call_no,
        action: 'SEND_CALL_TO_IBS',
        remarks: 'Send call to IBS confirmed by IE',
        actionBy: userId
      };

      await performTransitionAction(payload);
      setNotificationType('success');
      setNotificationMessage(`Call ${sendIbsCallRow.call_no} has been successfully sent to IBS!`);
      
      // Remove from completedCalls list
      setCompletedCalls(prev => prev.filter(c => c.call_no !== sendIbsCallRow.call_no && c.id !== sendIbsCallRow.id));
      setSendIbsCallRow(null);

      if (typeof onCallSentToIbs === 'function') {
        onCallSentToIbs();
      }
    } catch (err) {
      console.error('Error sending call to IBS:', err);
      setNotificationType('error');
      setNotificationMessage(err.message || 'Failed to send call to IBS. Please try again.');
    } finally {
      setIsSendingIbs(false);
    }
  };

  const handleConfirmRevertIc = async () => {
    if (!revertIcCallRow) return;
    try {
      setIsRevertingIc(true);
      const userId = getCurrentUserId();
      const callNumber = revertIcCallRow.call_no || revertIcCallRow.callNumber;

      await deleteEsignTransition(callNumber, userId);
      setNotificationType('success');
      setNotificationMessage(`Call ${callNumber} has been successfully moved back to Issuance of IC & Annexures.`);

      // Remove from completedCalls list
      setCompletedCalls(prev => prev.filter(c => (c.call_no || c.callNumber) !== callNumber && c.id !== revertIcCallRow.id));
      setRevertIcCallRow(null);

      if (typeof onCallSentToIbs === 'function') {
        onCallSentToIbs();
      }
    } catch (err) {
      console.error('Error reverting call to IC issuance:', err);
      setNotificationType('error');
      setNotificationMessage(err.message || 'Failed to move call back to IC issuance. Please try again.');
    } finally {
      setIsRevertingIc(false);
    }
  };

  const actions = (row) => {
    const isCancelled = (row.status || '').toUpperCase().includes('CANCEL') || (row.originalStatus || '').toUpperCase().includes('CANCEL');

    if (isCancelled) {
      return (
        <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '13px', backgroundColor: '#fee2e2', padding: '4px 10px', borderRadius: '12px', display: 'inline-block' }}>
          Call Cancelled
        </span>
      );
    }

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
        allCalls={completedCalls}
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
        summaryLabel="completed calls"
        globalSearchTerm={globalSearchTerm}
        setGlobalSearchTerm={setGlobalSearchTerm}
      />

      {/* Loading State */}
      {isLoadingCalls && (
        <AnnexureLoader
          title="Fetching Completed Calls"
          subtitle="Gathering your signed inspection certificates..."
        />
      )}

      {/* No Data State */}
      {!isLoadingCalls && completedCalls.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-32)' }}>
          <p>No signed/completed calls found.</p>
        </div>
      )}

      {/* Selection Notification Message */}
      <Notification
        message={notificationMessage}
        type={notificationType}
        autoClose={notificationType !== 'info'}
        autoCloseDelay={5000}
        onClose={() => setNotificationMessage('')}
      />

      {!isLoadingCalls && completedCalls.length > 0 && (
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
                      {getDetailedStatus(selectedActionCall.status || selectedActionCall.originalStatus).combinedText || (selectedActionCall.status ? selectedActionCall.status.replace(/_/g, ' ') : 'Completed')}
                    </div>
                  </div>
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

                {/* 2. Annexures */}
                <button
                  onClick={() => {
                    const row = selectedActionCall;
                    setSelectedActionCall(null);
                    handleViewAnnexures(row);
                  }}
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
                    <AssignmentRoundedIcon style={{ fontSize: '26px', color: '#7e22ce' }} />
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '15px' }}>Annexures</span>
                </button>

                {/* 3. Correction Slip */}
                <button
                  onClick={() => {
                    const row = selectedActionCall;
                    setSelectedActionCall(null);
                    setCorrectionSlipRow(row);
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    padding: '24px 16px', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                    border: '1px solid #fde68a', borderRadius: '16px',
                    cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    color: '#d97706', width: '100%',
                    boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.1), 0 2px 4px -1px rgba(217, 119, 6, 0.06)'
                  }}
                  onMouseEnter={(e) => { 
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(217, 119, 6, 0.2), 0 4px 6px -2px rgba(217, 119, 6, 0.1)'; 
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(217, 119, 6, 0.1), 0 2px 4px -1px rgba(217, 119, 6, 0.06)'; 
                  }}
                >
                  <div style={{ width: '48px', height: '48px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <EditNoteRoundedIcon style={{ fontSize: '26px', color: '#d97706' }} />
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '15px' }}>Correction Slip</span>
                </button>

                {/* 4. Send call to IBS */}
                <button
                  onClick={() => {
                    const row = selectedActionCall;
                    setSelectedActionCall(null);
                    setSendIbsCallRow(row);
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    padding: '24px 16px', background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                    border: '1px solid #86efac', borderRadius: '16px',
                    cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    color: '#15803d', width: '100%',
                    boxShadow: '0 4px 6px -1px rgba(21, 128, 61, 0.1), 0 2px 4px -1px rgba(21, 128, 61, 0.06)'
                  }}
                  onMouseEnter={(e) => { 
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(21, 128, 61, 0.2), 0 4px 6px -2px rgba(21, 128, 61, 0.1)'; 
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(21, 128, 61, 0.1), 0 2px 4px -1px rgba(21, 128, 61, 0.06)'; 
                  }}
                >
                  <div style={{ width: '48px', height: '48px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <SendRoundedIcon style={{ fontSize: '26px', color: '#15803d' }} />
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '15px' }}>Send call to IBS</span>
                </button>

                {/* 5. Call Letter */}
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

                {/* 6. PO & MA */}
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

                {/* 7. Document (TC) */}
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
                    <AttachmentRoundedIcon style={{ fontSize: '26px', color: '#15803d' }} />
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '15px' }}>{tcPdfLoading ? 'Downloading...' : 'Document (TC)'}</span>
                </button>

                {/* 8. Back to issuance of IC */}
                <button
                  onClick={() => {
                    const row = selectedActionCall;
                    setSelectedActionCall(null);
                    setRevertIcCallRow(row);
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    padding: '24px 16px', background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                    border: '1px solid #fecdd3', borderRadius: '16px',
                    cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    color: '#be123c', width: '100%',
                    boxShadow: '0 4px 6px -1px rgba(190, 18, 60, 0.1), 0 2px 4px -1px rgba(190, 18, 60, 0.06)'
                  }}
                  onMouseEnter={(e) => { 
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(190, 18, 60, 0.2), 0 4px 6px -2px rgba(190, 18, 60, 0.1)'; 
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(190, 18, 60, 0.1), 0 2px 4px -1px rgba(190, 18, 60, 0.06)'; 
                  }}
                >
                  <div style={{ width: '48px', height: '48px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <AssignmentReturnRoundedIcon style={{ fontSize: '26px', color: '#be123c' }} />
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '15px' }}>Back to issuance of IC</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Correction Slip Modal */}
      {correctionSlipRow && (
        <CorrectionSlipModal
          row={correctionSlipRow}
          onClose={() => setCorrectionSlipRow(null)}
        />
      )}

      {/* Send Call to IBS Confirmation Modal */}
      {sendIbsCallRow && (
        <Modal
          isOpen={Boolean(sendIbsCallRow)}
          onClose={() => !isSendingIbs && setSendIbsCallRow(null)}
          title="Send Call to IBS Confirmation"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSendIbsCallRow(null)}
                disabled={isSendingIbs}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{
                  backgroundColor: '#059669',
                  borderColor: '#059669',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={handleConfirmSendToIbs}
                disabled={isSendingIbs}
              >
                {isSendingIbs ? 'Sending to IBS...' : 'Confirm & Send to IBS'}
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: '#ecfdf5',
              borderRadius: '8px',
              border: '1px solid #a7f3d0'
            }}>
              <span style={{ fontSize: '18px', marginTop: '1px' }}>ℹ️</span>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: '#065f46', fontSize: '14px' }}>
                  Are you sure the IC data is correct?
                </p>
                <p style={{ margin: '2px 0 0 0', color: '#047857', fontSize: '13px' }}>
                  The call will be sent directly to IBS and moved to Closed Calls.
                </p>
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '14px',
                fontSize: '13px'
              }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                    Call Number
                  </span>
                  <strong style={{ color: '#0f172a', fontSize: '14px' }}>{sendIbsCallRow.call_no}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                    PO Number
                  </span>
                  <strong style={{ color: '#0f172a', fontSize: '14px' }}>{sendIbsCallRow.po_no || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                    Vendor Name
                  </span>
                  <strong style={{ color: '#0f172a', fontSize: '13px' }}>{sendIbsCallRow.vendor_name || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                    Product Type
                  </span>
                  <strong style={{ color: '#0f172a', fontSize: '13px' }}>
                    {getProductTypeDisplayName(sendIbsCallRow.product_type)}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Revert Call to IC Issuance Confirmation Modal */}
      {revertIcCallRow && (
        <Modal
          isOpen={Boolean(revertIcCallRow)}
          onClose={() => !isRevertingIc && setRevertIcCallRow(null)}
          title="Revert to Issuance of IC"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setRevertIcCallRow(null)}
                disabled={isRevertingIc}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{
                  backgroundColor: '#be123c',
                  borderColor: '#be123c',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={handleConfirmRevertIc}
                disabled={isRevertingIc}
              >
                {isRevertingIc ? 'Reverting...' : 'Confirm & Revert to IC'}
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: '#fff1f2',
              borderRadius: '8px',
              border: '1px solid #fecdd3'
            }}>
              <span style={{ fontSize: '18px', marginTop: '1px' }}>⚠️</span>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: '#9f1239', fontSize: '14px' }}>
                  Are you sure you want to move this call back to Issuance of IC?
                </p>
                <p style={{ margin: '2px 0 0 0', color: '#be123c', fontSize: '13px' }}>
                  This will remove the current digital signature (E-Sign) transition and allow you to re-edit/re-sign the IC in the Issuance of IC & Annexures tab.
                </p>
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '14px',
                fontSize: '13px'
              }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                    Call Number
                  </span>
                  <strong style={{ color: '#0f172a', fontSize: '14px' }}>{revertIcCallRow.call_no || revertIcCallRow.callNumber}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                    PO Number
                  </span>
                  <strong style={{ color: '#0f172a', fontSize: '14px' }}>{revertIcCallRow.po_no || revertIcCallRow.poNumber || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                    Vendor Name
                  </span>
                  <strong style={{ color: '#0f172a', fontSize: '13px' }}>{revertIcCallRow.vendor_name || revertIcCallRow.vendorName || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                    Product Type
                  </span>
                  <strong style={{ color: '#0f172a', fontSize: '13px' }}>
                    {getProductTypeDisplayName(revertIcCallRow.product_type)}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CompletedCallsTab;

