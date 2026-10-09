import React from 'react';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  getViewCorrectionSlipPdfByIdUrl,
  getDownloadCorrectionSlipPdfByIdUrl
} from '../services/correctionSlipService';

const CorrectionSlipListModal = ({
  isOpen,
  onClose,
  callNo,
  icNumber,
  documents = [],
  onIssueNew
}) => {
  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ea580c'
                }}
              >
                <PictureAsPdfRoundedIcon style={{ fontSize: '20px' }} />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Correction Slips
              </h3>
              <span
                style={{
                  background: '#fef3c7',
                  color: '#b45309',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid #fde68a'
                }}
              >
                {documents.length} {documents.length === 1 ? 'Slip' : 'Slips'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 46px', fontSize: '13px', color: '#64748b' }}>
              Call No: <strong style={{ color: '#334155' }}>{callNo}</strong>
              {icNumber && <> &bull; IC: <strong style={{ color: '#334155' }}>{icNumber}</strong></>}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e8f0')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <CloseRoundedIcon style={{ fontSize: '20px' }} />
          </button>
        </div>

        {/* Slips List */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {documents.length === 0 ? (
            <div
              style={{
                padding: '36px 20px',
                textAlign: 'center',
                color: '#64748b',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px dashed #cbd5e1'
              }}
            >
              <PictureAsPdfRoundedIcon style={{ fontSize: '40px', color: '#cbd5e1', marginBottom: '8px' }} />
              <p style={{ margin: 0, fontWeight: 600, fontSize: '15px', color: '#475569' }}>
                No Correction Slips Found
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                Click below to issue the first correction slip for this call.
              </p>
            </div>
          ) : (
            documents.map((doc, idx) => {
              const slipNumber = doc.slipNumber || idx + 1;
              const viewUrl = doc.id ? getViewCorrectionSlipPdfByIdUrl(doc.id) : null;
              const downloadUrl = doc.id ? getDownloadCorrectionSlipPdfByIdUrl(doc.id) : null;

              return (
                <div
                  key={doc.id || idx}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#fdba74';
                    e.currentTarget.style.boxShadow = '0 6px 12px -2px rgba(234, 88, 12, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.03)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: '#fff7ed',
                        border: '1px solid #ffedd5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ea580c',
                        flexShrink: 0
                      }}
                    >
                      <PictureAsPdfRoundedIcon style={{ fontSize: '24px' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>
                          Correction Slip {slipNumber}
                        </span>
                        {doc.stage && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: '6px',
                              background: doc.stage === 'SIGNED' ? '#dcfce7' : '#e0e7ff',
                              color: doc.stage === 'SIGNED' ? '#166534' : '#4338ca',
                              border: doc.stage === 'SIGNED' ? '1px solid #bbf7d0' : '1px solid #c7d2fe'
                            }}
                          >
                            {doc.stage}
                          </span>
                        )}
                        {doc.fileSizeCompressed && (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            ({formatFileSize(doc.fileSizeCompressed)})
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                        <span>Issued: {formatDate(doc.uploadedAt)}</span>
                        {doc.uploadedBy && (
                          <span style={{ marginLeft: '10px' }}>&bull; By: {doc.uploadedBy}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {viewUrl && (
                      <a
                        href={viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          borderRadius: '8px',
                          fontWeight: 600,
                          fontSize: '13px',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#2563eb';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#eff6ff';
                          e.currentTarget.style.color = '#2563eb';
                        }}
                        title="View Correction Slip PDF inline"
                      >
                        <VisibilityRoundedIcon style={{ fontSize: '16px' }} />
                        View
                      </a>
                    )}
                    {downloadUrl && (
                      <a
                        href={downloadUrl}
                        download={`Correction_Slip_${callNo}_${slipNumber}.pdf`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          background: '#f8fafc',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontWeight: 600,
                          fontSize: '13px',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#334155';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f8fafc';
                          e.currentTarget.style.color = '#475569';
                        }}
                        title="Download Correction Slip PDF"
                      >
                        <FileDownloadRoundedIcon style={{ fontSize: '16px' }} />
                        Download
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <button
            onClick={() => {
              onClose();
              if (onIssueNew) onIssueNew();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.25)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <AddCircleOutlineRoundedIcon style={{ fontSize: '18px' }} />
            Issue New Correction Slip
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#ffffff',
              color: '#64748b',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.color = '#334155';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CorrectionSlipListModal;
