import React, { useState } from 'react';
import {
  uploadSignedCertificateFile,
  viewSignedCertificate,
  checkSignedCertificateExists,
  deleteSignedCertificate,
  updateCertificateDate
} from '../../services/certificateService';
import { compressPdfFile } from '../../utils/pdfCompressor';
import { getStoredUser } from '../../services/authService';

export const CertificateStorageManager = ({ onNotify, currentUser: propUser, isSuperAdmin: propIsSuperAdmin }) => {
  // Determine if the current user has Super Admin / Rites Admin privileges vs regular Admin (View Only)
  const currentUser = propUser || getStoredUser();
  const rawRoles = Array.isArray(currentUser?.roleName)
    ? currentUser.roleName
    : (typeof currentUser?.roleName === 'string'
        ? currentUser.roleName.split(',').map(r => r.trim())
        : (currentUser?.roleName ? [currentUser.roleName] : []));

  const isSuperAdmin = propIsSuperAdmin !== undefined
    ? propIsSuperAdmin
    : rawRoles.some(r => {
        const lower = String(r || '').trim().toLowerCase();
        return lower === 'super admin' || lower === 'superadmin' || lower === 'super_admin' || lower.includes('super') || lower === 'rites admin' || lower === 'rites_admin';
      });

  // Upload Form State - Empty default uploader (mandatory field)
  const [icNumber, setIcNumber] = useState('');
  const [uploader, setUploader] = useState('');
  const [icDate, setIcDate] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [compressedFileInfo, setCompressedFileInfo] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [compressProgressText, setCompressProgressText] = useState('');
  const [uploadResult, setUploadResult] = useState(null);

  // Search & View State
  const [searchIc, setSearchIc] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  const [editIcDate, setEditIcDate] = useState('');
  const [updatingDate, setUpdatingDate] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Recent Searches in LocalStorage
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('recent_ic_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try { localStorage.removeItem('recent_ic_searches'); } catch {}
  };

  const handleCopyIc = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      notify(`Copied '${text}' to clipboard!`, 'info');
    }
  };

  const handleResetSearch = () => {
    setSearchIc('');
    setCertificateData(null);
    setPdfPreviewUrl(null);
    setEditIcDate('');
  };

  // Notifications
  const notify = (message, severity = 'info') => {
    if (onNotify) {
      onNotify(message, severity);
    } else {
      alert(`${severity.toUpperCase()}: ${message}`);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setSelectedFile(file);
        setCompressedFileInfo(null);
      } else {
        notify('Please select a valid PDF file.', 'error');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setSelectedFile(file);
        setCompressedFileInfo(null);
      } else {
        notify('Please select a valid PDF file.', 'error');
      }
    }
  };

  // Upload Handler with automatic compression & 2MB limit enforcement
  const handleUpload = async (e) => {
    e.preventDefault();
    const cleanIc = icNumber.trim();
    const cleanUploader = uploader.trim();

    if (!cleanIc) {
      notify('Please provide an IC Number or Call Number.', 'warning');
      return;
    }
    if (!cleanUploader) {
      notify('Please provide Uploaded By / Designation.', 'warning');
      return;
    }
    if (!selectedFile) {
      notify('Please select a PDF certificate file to upload.', 'warning');
      return;
    }

    setUploadLoading(true);
    setUploadResult(null);
    setCompressProgressText('');

    try {
      let fileToUpload = selectedFile;
      const MAX_BYTES = 2 * 1024 * 1024; // 2MB limit

      // Compress if file is > 1.2 MB or if user wants compression
      if (selectedFile.size > 1.2 * 1024 * 1024) {
        setCompressProgressText('Optimizing & compressing PDF for upload...');
        fileToUpload = await compressPdfFile(
          selectedFile,
          { quality: 0.75, scale: 1.5 },
          (pct, text) => {
            setCompressProgressText(`${text} (${pct}%)`);
          }
        );

        const originalMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
        const compressedMB = (fileToUpload.size / (1024 * 1024)).toFixed(2);
        setCompressedFileInfo({
          original: originalMB,
          compressed: compressedMB,
          ratio: Math.round((1 - fileToUpload.size / selectedFile.size) * 100)
        });
      }

      // Check 2MB limit
      if (fileToUpload.size > MAX_BYTES) {
        const currentMB = (fileToUpload.size / (1024 * 1024)).toFixed(2);
        notify(`File size (${currentMB} MB) exceeds maximum allowed limit of 2.0 MB. Please select a smaller document.`, 'error');
        setUploadLoading(false);
        return;
      }

      setCompressProgressText('Uploading Certificate...');
      const response = await uploadSignedCertificateFile(fileToUpload, cleanIc, cleanUploader, icDate);
      setUploadResult(response);
      notify(`Certificate for '${cleanIc}' uploaded successfully (${(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB)!`, 'success');

      // Auto populate search with uploaded IC to show result
      setSearchIc(cleanIc);
    } catch (error) {
      console.error('Upload failed:', error);
      notify(`Upload failed: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setUploadLoading(false);
      setCompressProgressText('');
    }
  };

  // Search Handler
  const handleSearch = async (e, overrideQuery) => {
    if (e) e.preventDefault();
    const cleanIc = (overrideQuery !== undefined ? overrideQuery : searchIc).trim();
    if (!cleanIc) {
      notify('Please enter an IC Number or Call Number to search.', 'warning');
      return;
    }
    if (overrideQuery !== undefined) {
      setSearchIc(cleanIc);
    }

    setSearchLoading(true);
    setCertificateData(null);
    setPdfPreviewUrl(null);
    setEditIcDate('');

    try {
      const exists = await checkSignedCertificateExists(cleanIc);
      if (!exists) {
        notify(`No certificate found for IC / Call No: '${cleanIc}'`, 'warning');
        setSearchLoading(false);
        return;
      }

      const cert = await viewSignedCertificate(cleanIc);
      setCertificateData(cert);
      setEditIcDate(cert.icDate || '');

      if (cert.signedData) {
        const cleanBase64 = cert.signedData.startsWith('data:')
          ? cert.signedData
          : `data:application/pdf;base64,${cert.signedData}`;
        setPdfPreviewUrl(cleanBase64);
      } else if (cert.url || cert.blobUrl) {
        setPdfPreviewUrl(cert.url || cert.blobUrl);
      }

      // Add to recent searches
      setRecentSearches(prev => {
        const updated = [cleanIc, ...prev.filter(item => item !== cleanIc)].slice(0, 5);
        try { localStorage.setItem('recent_ic_searches', JSON.stringify(updated)); } catch {}
        return updated;
      });

      notify(`Certificate found for '${cleanIc}'!`, 'success');
    } catch (error) {
      console.error('Search failed:', error);
      notify(`Failed to fetch certificate: ${error.message}`, 'error');
    } finally {
      setSearchLoading(false);
    }
  };

  // Update IC Date Handler
  const handleUpdateIcDate = async () => {
    const cleanIc = (certificateData?.icNumber || searchIc).trim();
    if (!cleanIc) {
      notify('Please specify an IC number.', 'warning');
      return;
    }
    if (!editIcDate) {
      notify('Please select a valid IC Date.', 'warning');
      return;
    }

    setUpdatingDate(true);
    try {
      await updateCertificateDate(cleanIc, editIcDate);
      setCertificateData(prev => ({ ...prev, icDate: editIcDate }));
      notify(`IC Date successfully updated to '${editIcDate}' across records!`, 'success');
    } catch (error) {
      console.error('Failed to update IC date:', error);
      notify(`Failed to update IC date: ${error.message}`, 'error');
    } finally {
      setUpdatingDate(false);
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    const cleanIc = (certificateData?.icNumber || searchIc).trim();
    if (!cleanIc) return;

    if (!window.confirm(`Are you sure you want to delete the certificate for "${cleanIc}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteSignedCertificate(cleanIc);
      notify(`Certificate for '${cleanIc}' has been deleted.`, 'success');
      setCertificateData(null);
      setPdfPreviewUrl(null);
      setEditIcDate('');
    } catch (error) {
      console.error('Delete failed:', error);
      notify(`Failed to delete certificate: ${error.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Replace existing handler (prefills the upload form and opens file picker)
  const handleReplaceExisting = () => {
    const targetIc = (certificateData?.icNumber || searchIc).trim();
    if (targetIc) {
      setIcNumber(targetIc);
      if (certificateData?.uploadedBy) {
        setUploader(certificateData.uploadedBy);
      }
      if (certificateData?.icDate) {
        setIcDate(certificateData.icDate);
      }
      // Open file browser automatically
      const fileInput = document.getElementById('cert-file-input');
      if (fileInput) {
        fileInput.click();
      }
      notify(`Loaded '${targetIc}' into the form. Select the new PDF file to overwrite.`, 'info');
    }
  };

  return (
    <div style={{ maxWidth: isSuperAdmin ? '1380px' : '1020px', margin: '0 auto', padding: '16px' }}>
      {/* Responsive Grid Styles */}
      <style>{`
        @media (max-width: 960px) {
          .ic-management-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Modern Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #f0fdf4 50%, #eff6ff 100%)',
        border: '1px solid #cbd5e1',
        borderRadius: '20px',
        padding: '22px 28px',
        marginBottom: '24px',
        boxShadow: '0 4px 24px -2px rgba(15, 23, 42, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
            boxShadow: '0 8px 16px -2px rgba(2, 132, 199, 0.35)',
            color: '#ffffff',
            flexShrink: 0
          }}>
            🛡️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '21px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px' }}>
                Inspection Certificate (IC) Management
              </h2>
              <span style={{
                background: '#dcfce7',
                color: '#15803d',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '12px',
                border: '1px solid #bbf7d0',
                letterSpacing: '0.3px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }}></span>
                Official Records
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#64748b', lineHeight: 1.4 }}>
              {isSuperAdmin
                ? 'Easily upload, search, view, and manage digital Inspection Certificates for all calls.'
                : 'Search, preview, and download digital Inspection Certificates with authorized audit access.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: '#ffffff',
            color: '#0369a1',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            border: '1px solid #bae6fd',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }}></span>
            {isSuperAdmin ? (currentUser?.roleName || 'Super Admin') : 'Admin (View Only)'}
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div
        className="ic-management-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: isSuperAdmin ? 'repeat(auto-fit, minmax(460px, 1fr))' : '1fr',
          maxWidth: isSuperAdmin ? '100%' : '960px',
          margin: isSuperAdmin ? '0' : '0 auto',
          gap: '24px',
          alignItems: 'start'
        }}
      >
        {/* Card 1: Upload / Replace Certificate (Only visible to Super Admin / Rites Admin) */}
        {isSuperAdmin && (
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #f1f5f9',
              background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#eff6ff',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  📤
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Upload or Replace Certificate
                </h3>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                Upload &amp; Overwrite
              </span>
            </div>

            <form onSubmit={handleUpload} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
              {/* IC Number Input */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13.5px', color: '#334155', marginBottom: '6px' }}>
                  <span>📄</span> Inspection Certificate (IC) or Call Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. IC/2024/001 or N/24/0001"
                  value={icNumber}
                  onChange={(e) => setIcNumber(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '14px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0284c7';
                    e.target.style.background = '#ffffff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.background = '#f8fafc';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Uploader Name */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13.5px', color: '#334155', marginBottom: '6px' }}>
                  <span>👤</span> Uploaded By / Designation <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your name &amp; designation (e.g. R. K. Sharma / IE)"
                  value={uploader}
                  onChange={(e) => setUploader(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '14px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0284c7';
                    e.target.style.background = '#ffffff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.background = '#f8fafc';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* IC Date Input */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13.5px', color: '#334155', marginBottom: '6px' }}>
                  <span>📅</span> IC Date <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 400 }}>(Sets date across inspection &amp; IBS records)</span>
                </label>
                <input
                  type="date"
                  value={icDate}
                  onChange={(e) => setIcDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '14px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0284c7';
                    e.target.style.background = '#ffffff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.background = '#f8fafc';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* File Dropzone */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13.5px', color: '#334155', marginBottom: '6px' }}>
                  <span>📑</span> Certificate PDF File <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${isDragOver ? '#0284c7' : '#93c5fd'}`,
                    borderRadius: '14px',
                    padding: '24px 20px',
                    textAlign: 'center',
                    background: isDragOver ? '#e0f2fe' : '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onClick={() => document.getElementById('cert-file-input').click()}
                >
                  <input
                    id="cert-file-input"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: '#eff6ff',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    margin: '0 auto 10px'
                  }}>
                    ☁️
                  </div>
                  {selectedFile ? (
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                        {selectedFile.name}
                      </p>
                      <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px' }}>
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.size > 2 * 1024 * 1024 ? '⚡ Will be auto-compressed under 2 MB' : 'Ready for upload'}
                      </p>
                      <span style={{ display: 'inline-block', marginTop: '8px', color: '#0284c7', fontSize: '12px', fontWeight: 700, textDecoration: 'underline' }}>
                        Click to change selected file
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '14px' }}>
                        Drag &amp; Drop your PDF Certificate here
                      </p>
                      <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px' }}>
                        Supports standard PDF files • Max limit: <strong>2.0 MB</strong>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Compression alert */}
              {compressedFileInfo && (
                <div style={{
                  padding: '10px 14px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>⚡</span>
                  <div>
                    <strong>Auto-Compressed:</strong> {compressedFileInfo.original} MB reduced to <strong>{compressedFileInfo.compressed} MB</strong> ({compressedFileInfo.ratio}% reduction).
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={uploadLoading || !selectedFile || !icNumber.trim() || !uploader.trim()}
                  style={{
                    width: '100%',
                    padding: '13px 20px',
                    borderRadius: '12px',
                    background: uploadLoading || !selectedFile || !icNumber.trim() || !uploader.trim()
                      ? '#e2e8f0'
                      : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: uploadLoading || !selectedFile || !icNumber.trim() || !uploader.trim()
                      ? '#94a3b8'
                      : '#ffffff',
                    fontWeight: 700,
                    fontSize: '14px',
                    border: 'none',
                    cursor: uploadLoading || !selectedFile || !icNumber.trim() || !uploader.trim() ? 'not-allowed' : 'pointer',
                    boxShadow: uploadLoading || !selectedFile || !icNumber.trim() || !uploader.trim()
                      ? 'none'
                      : '0 4px 14px rgba(2, 132, 199, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {uploadLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      {compressProgressText || 'Uploading Certificate...'}
                    </>
                  ) : (
                    <>
                      <span>🚀</span> Upload Inspection Certificate
                    </>
                  )}
                </button>
              </div>

              {/* Success Upload Card */}
              {uploadResult && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '13px',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <strong>✅ Upload Successful:</strong> {uploadResult.fileName || uploadResult.message}
                  </div>
                  {uploadResult.url && (
                    <a
                      href={uploadResult.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'underline' }}
                    >
                      View Document ↗
                    </a>
                  )}
                </div>
              )}
            </form>
          </div>
        )}

        {/* Card 2: Search, Verify & Manage Existing */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '18px 24px',
            borderBottom: '1px solid #f1f5f9',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#eff6ff',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                🔍
              </div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Search &amp; View Certificate
              </h3>
            </div>
            {certificateData ? (
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '3px 10px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                🟢 Record Loaded
              </span>
            ) : (
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                Quick Search
              </span>
            )}
          </div>

          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
            {/* Search Input */}
            <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
                <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '14px', color: '#94a3b8', fontSize: '15px', pointerEvents: 'none' }}>
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Enter IC Number or Call Number (e.g. EP-1028260006)..."
                    value={searchIc}
                    onChange={(e) => setSearchIc(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 38px 12px 40px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      background: '#f8fafc',
                      fontSize: '14px',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0284c7';
                      e.target.style.background = '#ffffff';
                      e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.background = '#f8fafc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {searchIc && (
                    <button
                      type="button"
                      onClick={() => setSearchIc('')}
                      title="Clear text"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: '#e2e8f0',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        color: '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={searchLoading || !searchIc.trim()}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    background: searchLoading || !searchIc.trim() ? '#e2e8f0' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: searchLoading || !searchIc.trim() ? '#94a3b8' : '#ffffff',
                    fontWeight: 700,
                    fontSize: '14px',
                    border: 'none',
                    cursor: searchLoading || !searchIc.trim() ? 'not-allowed' : 'pointer',
                    boxShadow: searchLoading || !searchIc.trim() ? 'none' : '0 4px 12px rgba(2, 132, 199, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {searchLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>

              <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '4px' }}>
                <span>💡</span>
                <span>Press <strong>Enter ↵</strong> to search • Case-insensitive lookup across all official IC and Call records</span>
              </div>

              {/* Quick Search Examples & Recents */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingTop: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Quick Examples:</span>
                  {['EP-1028260006', 'ER-1026260003', 'EF-0929260001'].map(sample => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => handleSearch(null, sample)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        color: '#0f172a',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#e0f2fe';
                        e.currentTarget.style.borderColor = '#0284c7';
                        e.currentTarget.style.color = '#0369a1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f1f5f9';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.color = '#0f172a';
                      }}
                    >
                      {sample}
                    </button>
                  ))}
                </div>

                {recentSearches.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Recent:</span>
                    {recentSearches.slice(0, 3).map(item => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleSearch(null, item)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          color: '#1d4ed8',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        🕒 {item}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      title="Clear recent searches"
                      style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', padding: '0 4px' }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </form>

            {/* Certificate Details / Preview */}
            {certificateData ? (
              <div style={{
                border: '1.5px solid #e2e8f0',
                borderRadius: '16px',
                padding: '20px',
                background: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }}></span>
                      Verified Document
                    </span>
                    <h4 style={{ margin: 0, fontSize: '17px', color: '#0f172a', fontWeight: 700 }}>
                      {certificateData.icNumber || searchIc}
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleCopyIc(certificateData.icNumber || searchIc)}
                      title="Copy IC Number"
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: copied ? '#dcfce7' : '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        color: copied ? '#15803d' : '#475569',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {copied ? '✓ Copied' : '📋 Copy'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleResetSearch}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: '#ffffff',
                        color: '#64748b',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      🔄 Search Another
                    </button>

                    {isSuperAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={handleReplaceExisting}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: '#e0f2fe',
                            color: '#0369a1',
                            border: '1px solid #bae6fd',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          ✏️ Overwrite
                        </button>
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={isDeleting}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fecaca',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: isDeleting ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {isDeleting ? 'Deleting...' : '🗑️ Delete'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 4 Metadata Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '10px'
                }}>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>📅 IC Date</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                      {certificateData.icDate || 'Not specified'}
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>👤 Uploaded By</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {certificateData.uploadedBy || 'RITES Inspection Officer'}
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>📁 File Name</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {certificateData.fileName || 'certificate.pdf'}
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>🛡️ Authenticity</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a', marginTop: '2px' }}>
                      Verified &amp; Sealed
                    </div>
                  </div>
                </div>

                {/* IC Date & Quick Edit Section (Super Admin only) */}
                {isSuperAdmin && (
                  <div style={{
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>📅</span>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                          Edit Official IC Date
                        </span>
                        <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                          {certificateData.icDate ? certificateData.icDate : 'Not specified'}
                        </strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="date"
                        value={editIcDate}
                        onChange={(e) => setEditIcDate(e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '13px',
                          color: '#0f172a',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleUpdateIcDate}
                        disabled={updatingDate || !editIcDate}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          background: (updatingDate || !editIcDate) ? '#e2e8f0' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          color: (updatingDate || !editIcDate) ? '#94a3b8' : '#ffffff',
                          border: 'none',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: (updatingDate || !editIcDate) ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: (updatingDate || !editIcDate) ? 'none' : '0 2px 6px rgba(2, 132, 199, 0.25)'
                        }}
                      >
                        {updatingDate ? 'Updating...' : 'Update Date'}
                      </button>
                    </div>
                  </div>
                )}

                {/* PDF Viewer Frame */}
                {pdfPreviewUrl && (
                  <div style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#334155',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)'
                  }}>
                    <div style={{
                      padding: '8px 14px',
                      background: '#1e293b',
                      color: '#e2e8f0',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📄</span>
                        <span>Official Signed PDF Document</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Built-in Viewer</span>
                    </div>

                    <iframe
                      src={pdfPreviewUrl}
                      title="Certificate Preview"
                      width="100%"
                      height="560px"
                      style={{ border: 'none', display: 'block', background: '#fff' }}
                    />
                  </div>
                )}

                {/* Viewer Action Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Document verified against RITES digital records archive.
                  </span>
                  {pdfPreviewUrl && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <a
                        href={pdfPreviewUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '9px 16px',
                          borderRadius: '8px',
                          background: '#ffffff',
                          color: '#0f172a',
                          border: '1.5px solid #cbd5e1',
                          textDecoration: 'none',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>↗️</span> Open in New Tab
                      </a>
                      <a
                        href={pdfPreviewUrl}
                        download={`${(certificateData.icNumber || searchIc).replace(/[/\\?%*:|"<>]/g, '_')}.pdf`}
                        style={{
                          padding: '9px 18px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          color: '#ffffff',
                          textDecoration: 'none',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)'
                        }}
                      >
                        <span>📥</span> Download PDF
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Enhanced Empty State */
              <div style={{
                textAlign: 'center',
                padding: '52px 24px',
                background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
                border: '1.5px dashed #cbd5e1',
                borderRadius: '16px',
                margin: 'auto 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #e0f2fe 0%, #eff6ff 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  boxShadow: '0 8px 16px -4px rgba(2, 132, 199, 0.15)'
                }}>
                  📄
                </div>
                <div style={{ maxWidth: '460px' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '16.5px', fontWeight: 700, color: '#0f172a' }}>
                    Search Digital Inspection Certificates
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                    {isSuperAdmin
                      ? 'Enter an IC number or Call number above to preview, download, or replace its certificate.'
                      : 'Enter an IC number or Call number above to view the signed document, verify official metadata, and download the PDF.'}
                  </p>
                </div>

                {/* 3 Step Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '12px',
                  width: '100%',
                  maxWidth: '480px',
                  marginTop: '8px'
                }}>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', marginBottom: '4px' }}>🏷️</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>1. Reference</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Enter IC or Call No</div>
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', marginBottom: '4px' }}>⚡</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>2. Verification</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Instant DB lookup</div>
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', marginBottom: '4px' }}>📑</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>3. Preview</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Read &amp; download PDF</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateStorageManager;
