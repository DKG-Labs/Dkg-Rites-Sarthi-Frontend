import React, { useState, useEffect, useRef, useCallback } from 'react';
import { uploadAnnexureDocument, getAnnexureDocuments, deleteAnnexureDocument, viewAnnexureDocument } from '../services/certificateService';

const AnnexureUploadModal = ({
  isOpen,
  onClose,
  callNo,
  icNumber,
  moduleType = 'SLEEPER',
  uploadedBy = 'Inspecting Engineer',
  onUploadSuccess,
  mode = 'upload' // 'upload' | 'view'
}) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewingDocId, setViewingDocId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  const normalizedModule = (moduleType || 'ERC').toUpperCase();
  const maxMb = normalizedModule === 'SLEEPER' ? 50 : 20;
  const maxBytes = maxMb * 1024 * 1024;
  const isViewMode = mode === 'view';

  const loadDocuments = useCallback(async () => {
    if (!callNo) return;
    try {
      setLoading(true);
      setErrorMessage('');
      const res = await getAnnexureDocuments(callNo, normalizedModule);
      if (res && res.success) {
        setDocuments(res.data || []);
      } else {
        setDocuments([]);
        if (res && res.message) setErrorMessage(res.message);
      }
    } catch (err) {
      console.error('Failed to load annexures:', err);
      setDocuments([]);
      setErrorMessage(err.message || 'Failed to load attached documents');
    } finally {
      setLoading(false);
    }
  }, [callNo, normalizedModule]);

  useEffect(() => {
    if (isOpen && callNo) {
      setDocuments([]);
      setErrorMessage('');
      setSuccessMessage('');
      setDeleteConfirmDoc(null);
      loadDocuments();
    }
  }, [isOpen, callNo, loadDocuments]);

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Only PDF documents (.pdf) are allowed.');
      return;
    }

    if (file.size > maxBytes) {
      setErrorMessage(`File exceeds maximum allowed size of ${maxMb} MB for ${normalizedModule}. Selected file: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
      return;
    }

    try {
      setUploading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const res = await uploadAnnexureDocument(file, callNo, icNumber, normalizedModule, uploadedBy);
      if (res && res.success) {
        setSuccessMessage(`"${file.name}" uploaded successfully.`);
        await loadDocuments();
        if (onUploadSuccess) onUploadSuccess();
      } else {
        setErrorMessage(res.message || 'Failed to upload document');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setErrorMessage(err.message || 'Error uploading document');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmDoc) return;
    try {
      setDeleting(true);
      setLoading(true);
      const res = await deleteAnnexureDocument(deleteConfirmDoc.id, uploadedBy);
      if (res && res.success) {
        setSuccessMessage(`Document deleted successfully.`);
        setDeleteConfirmDoc(null);
        await loadDocuments();
        if (onUploadSuccess) onUploadSuccess();
      } else {
        setErrorMessage(res?.message || 'Failed to delete document');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setErrorMessage(err.message || 'Failed to delete document');
    } finally {
      setDeleting(false);
      setLoading(false);
    }
  };

  const handleView = async (doc) => {
    try {
      setViewingDocId(doc.id);
      setErrorMessage('');
      await viewAnnexureDocument(doc.id, doc.originalFileName);
    } catch (err) {
      console.error('View error:', err);
      setErrorMessage(err.message || 'Failed to open document');
    } finally {
      setViewingDocId(null);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (!isOpen) return null;

  const hasUploadedDoc = documents.length > 0;

  return (
    <div style={{
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
      zIndex: 99999,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, #0f3a5e 0%, #1e293b 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', letterSpacing: '-0.01em', color: '#ffffff' }}>
              {isViewMode ? '📁 Uploaded Annexures & Supporting Documents' : '📁 Upload Annexures & Supporting Documents'}
            </h3>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              Call No: <b style={{ color: '#38bdf8' }}>{callNo}</b> {icNumber ? `| IC No: ${icNumber}` : ''} | Module: <b style={{ color: '#4ade80' }}>{normalizedModule}</b>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#ffffff',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, position: 'relative' }}>
          {/* Notifications */}
          {errorMessage && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              ⚠️ {errorMessage}
            </div>
          )}

          {successMessage && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              ✅ {successMessage}
            </div>
          )}

          {/* Upload Dropzone (Only in Upload mode when NO document is attached yet) */}
          {!isViewMode && (
            hasUploadedDoc ? (
              <div style={{
                background: '#f0fdf4',
                border: '1px dashed #86efac',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <span style={{ fontSize: '24px' }}>🔒</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#166534' }}>
                    Document already uploaded for this call
                  </div>
                  <div style={{ fontSize: '12px', color: '#15803d', marginTop: '2px' }}>
                    You can view or delete the attached document below. To upload a replacement, delete the current document first.
                  </div>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); if (!uploading) setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (!uploading) handleFileSelect(e.dataTransfer.files);
                }}
                onClick={() => !uploading && fileInputRef.current && fileInputRef.current.click()}
                style={{
                  border: `2px dashed ${isDragOver ? '#0284c7' : '#cbd5e1'}`,
                  borderRadius: '12px',
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: uploading ? '#f8fafc' : (isDragOver ? '#f0f9ff' : '#fafafa'),
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '20px',
                  position: 'relative'
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileSelect(e.target.files)}
                  accept=".pdf,application/pdf"
                  style={{ display: 'none' }}
                  disabled={uploading}
                />

                {uploading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 0' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      border: '3px solid #e2e8f0',
                      borderTopColor: '#0284c7',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      marginBottom: '12px'
                    }} />
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f3a5e' }}>
                      Uploading Document...
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Please wait a moment while your document is being uploaded
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '30px', marginBottom: '6px' }}>
                      📄
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                      Click to Browse or Drag & Drop PDF File
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      PDF Documents only (.pdf) | <b>Max Allowed Size: {maxMb} MB</b>
                    </div>
                  </>
                )}
              </div>
            )
          )}

          {/* Attached Documents List */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '8px'
            }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f3a5e' }}>
                {isViewMode ? `Uploaded Documents (${documents.length})` : `Attached Annexures (${documents.length})`}
              </span>
            </div>

            {loading && documents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid #e2e8f0',
                  borderTopColor: '#0284c7',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <span>Loading attached documents...</span>
              </div>
            ) : documents.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '24px',
                color: '#94a3b8',
                fontSize: '13px',
                background: '#f8fafc',
                borderRadius: '8px'
              }}>
                No annexures or supporting documents uploaded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {documents.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, overflow: 'hidden' }}>
                      <span style={{ fontSize: '20px' }}>
                        {doc.originalFileName?.toLowerCase().endsWith('.pdf') ? '📄' : '📎'}
                      </span>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {doc.originalFileName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                          <span>Size: {formatSize(doc.fileSizeOriginal || doc.fileSizeCompressed)}</span>
                          <span>•</span>
                          <span>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginLeft: '12px' }}>
                      {/* View button is ALWAYS available for uploaded document */}
                      <button
                        onClick={() => handleView(doc)}
                        disabled={viewingDocId === doc.id}
                        style={{
                          padding: '6px 14px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          color: '#0284c7',
                          background: '#e0f2fe',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: viewingDocId === doc.id ? 'wait' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {viewingDocId === doc.id ? '⏳ Opening...' : '👁️ View'}
                      </button>

                      {/* Delete button is ONLY available in upload mode */}
                      {!isViewMode && (
                        <button
                          onClick={() => setDeleteConfirmDoc({ id: doc.id, fileName: doc.originalFileName })}
                          style={{
                            padding: '6px 10px',
                            fontSize: '11px',
                            fontWeight: '700',
                            color: '#dc2626',
                            background: '#fee2e2',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                          title="Delete Annexure"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: '700',
              color: '#475569',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

        {/* Custom UI Delete Confirmation Dialog */}
        {deleteConfirmDoc && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              textAlign: 'center',
              animation: 'fadeInScale 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                margin: '0 auto 16px'
              }}>
                🗑️
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                Delete Document?
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b', lineHeight: '1.5', wordBreak: 'break-word' }}>
                Are you sure you want to delete <b style={{ color: '#1e293b' }}>"{deleteConfirmDoc.fileName}"</b>? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={() => setDeleteConfirmDoc(null)}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: deleting ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)',
                    transition: 'all 0.15s'
                  }}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global animation style for spinners */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fadeInScale {
            0% { opacity: 0; transform: scale(0.92); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AnnexureUploadModal;
