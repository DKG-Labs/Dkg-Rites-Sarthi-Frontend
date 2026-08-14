import React, { useState } from 'react';
import axios from 'axios';
import { getAuthHeaders, getStoredUser } from '../services/authService';
import { API_BASE_URL } from '../services/apiConfig';
import { generateCallLetterPDF } from '../call-desk-module/src/utils/generateCallLetterPDF';
import { fetchCallLetterDetails } from '../call-desk-module/src/services/callLetterApi';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import AttachmentRoundedIcon from '@mui/icons-material/AttachmentRounded';

import { message } from 'antd';
import { performTransitionAction } from '../services/workflowService';
import CallCancellationModal from './CallCancellationModal';

const PendingCallDetailsModal = ({
  isOpen,
  onClose,
  call,
  showNotification,
  availableActions = [],
  onSchedule,
  onReschedule,
  onStart,
  onEnterShiftDetails,
  onDone
}) => {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [tcPdfLoading, setTcPdfLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const notify = (msg, type = 'success') => {
    if (showNotification) {
      showNotification(msg, type);
    } else {
      if (type === 'error') {
        message.error(msg);
      } else if (type === 'info') {
        message.info(msg);
      } else {
        message.success(msg);
      }
    }
  };



  if (!isOpen || !call) return null;

  // Resolve Call Letter details fetcher
  const handleDownloadLetter = async () => {
    if (!call?.call_no && !call?.callNumber) {
      notify('Call ID not found. Cannot generate PDF.', 'error');
      return;
    }
    const callNumber = call.call_no || call.callNumber;
    setPdfLoading(true);
    try {
      // Basic call data mapping for PDF generator
      const pdfCallData = {
        ...call,
        callNumber: callNumber,
        poNumber: call.po_no || call.poNumber,
        vendorName: call.vendor_name || call.vendorName
      };
      
      // Fetch enriched details (PO Header, PO Item, type-specific fields)
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
      notify('Failed to generate Call Letter PDF.', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  const downloadPoDoc = async () => {
    const rawPoNo = call.po_no || call.poNumber || call.rawPoNo;
    if (!rawPoNo) {
      notify('No PO number available for this call.', 'error');
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendor/po-pdf-path`, {
        params: { rawPoNo },
        headers: getAuthHeaders()
      });
      const pdfPath = response.data?.responseData;
      if (!pdfPath) {
        notify('No PO document found for this PO.', 'error');
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
      notify('Failed to download PO document.', 'error');
    }
  };

  const downloadTCDoc = async () => {
    const callNumber = call.call_no || call.callNumber || call.icNumber;
    if (!callNumber) {
      notify('Call ID not found. Cannot download TC Document.', 'error');
      return;
    }
    
    setTcPdfLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendor/inspection-calls/tc-docs/${callNumber}`, {
        headers: getAuthHeaders(),
        responseType: 'blob'
      });
      
      // Axios treats 404/500 as an error automatically, but just in case:
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
      // Try to parse the blob error message if possible
      let errorMessage = 'Failed to download TC document. It may not be available yet.';
      if (err.response && err.response.status === 404) {
          errorMessage = 'No TC Documents found for this call number.';
      }
      notify(errorMessage, 'info');
    } finally {
      setTcPdfLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}>
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
            <span style={{ color: '#0ea5e9' }}>📋</span> Inspection Call Details - <span style={{ color: '#334155' }}>{call.call_no || call.callNumber}</span>
          </h2>
          <button 
            className="modal-close" 
            onClick={onClose}
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
                <div style={{ fontWeight: '600', fontSize: '16px', color: '#0f172a' }}>{call.call_no || call.callNumber || '-'}</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Vendor Name</label>
                <div style={{ fontWeight: '600', fontSize: '16px', color: '#0f172a' }}>{call.vendor_name || call.vendorName || '-'}</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>PO Number</label>
                <div style={{ fontWeight: '600', fontSize: '16px', color: '#0f172a' }}>{call.po_no || call.poNumber || '-'}</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Product Type</label>
                <div style={{ display: 'inline-block', background: '#e0f2fe', color: '#0284c7', padding: '4px 10px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
                  {call.product_type || call.productType || '-'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Status</label>
                <div style={{ display: 'inline-block', background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
                  {call.status ? call.status.replace(/_/g, ' ') : '-'}
                </div>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#3b82f6' }}>⚡</span> Actions & Documents
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
            {availableActions.includes('schedule') && (
              <button className="btn btn-secondary" onClick={onSchedule} style={{ width: '100%', height: '100%', minHeight: '80px', borderRadius: '16px', fontWeight: 'bold' }}>SCHEDULE</button>
            )}
            {availableActions.includes('reschedule') && (
              <button className="btn btn-secondary" onClick={onReschedule} style={{ width: '100%', height: '100%', minHeight: '80px', borderRadius: '16px', fontWeight: 'bold' }}>RESCHEDULE</button>
            )}
            {availableActions.includes('start') && (
              <button className="btn btn-primary" onClick={onStart} style={{ width: '100%', height: '100%', minHeight: '80px', borderRadius: '16px', fontWeight: 'bold' }}>START</button>
            )}
            {availableActions.includes('resume') && (
              <button className="btn btn-primary" onClick={() => onEnterShiftDetails(true)} style={{ width: '100%', height: '100%', minHeight: '80px', borderRadius: '16px', fontWeight: 'bold' }}>RESUME</button>
            )}
            {availableActions.includes('enterShiftDetails') && (
              <button className="btn btn-primary" onClick={() => onEnterShiftDetails(false)} style={{ width: '100%', height: '100%', minHeight: '80px', borderRadius: '16px', fontWeight: 'bold' }}>ENTER SHIFT DETAILS</button>
            )}

            {call.status !== 'CANCELLED' ? (
              <button 
                className="btn btn-danger" 
                onClick={() => setShowCancelModal(true)} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  minHeight: '80px', 
                  borderRadius: '16px', 
                  fontWeight: 'bold', 
                  background: '#ef4444', 
                  color: '#ffffff', 
                  border: 'none', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)'
                }}
              >
                CANCEL CALL
              </button>
            ) : (
              <div 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  minHeight: '80px', 
                  borderRadius: '16px', 
                  fontWeight: '800', 
                  background: '#fef2f2', 
                  color: '#dc2626', 
                  border: '1px solid #fecaca', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px'
                }}
              >
                🚫 CALL CANCELLED
              </div>
            )}

            <button
              onClick={handleDownloadLetter}
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

            <button
              onClick={downloadPoDoc}
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

            <button
              onClick={downloadTCDoc}
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
          </div>
        </div>
      </div>

      <CallCancellationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        call={call}
        showNotification={showNotification}
        onSuccess={() => {
          if (onDone) onDone();
          if (onClose) onClose();
        }}
      />
    </div>
  );
};

export default PendingCallDetailsModal;
