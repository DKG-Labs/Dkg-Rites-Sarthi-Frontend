import React, { useState } from 'react';
import {
  uploadSignedCertificateFile,
  viewSignedCertificate,
  checkSignedCertificateExists,
  deleteSignedCertificate
} from '../../services/certificateService';
import { compressPdfFile } from '../../utils/pdfCompressor';

export const CertificateStorageManager = ({ onNotify }) => {
  // Upload Form State - Empty default uploader (mandatory field)
  const [icNumber, setIcNumber] = useState('');
  const [uploader, setUploader] = useState('');
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
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      const response = await uploadSignedCertificateFile(fileToUpload, cleanIc, cleanUploader);
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
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const cleanIc = searchIc.trim();
    if (!cleanIc) {
      notify('Please enter an IC Number to search.', 'warning');
      return;
    }

    setSearchLoading(true);
    setCertificateData(null);
    setPdfPreviewUrl(null);

    try {
      const exists = await checkSignedCertificateExists(cleanIc);
      if (!exists) {
        notify(`No certificate found for IC / Call No: '${cleanIc}'`, 'warning');
        setSearchLoading(false);
        return;
      }

      const cert = await viewSignedCertificate(cleanIc);
      setCertificateData(cert);

      if (cert.signedData) {
        const cleanBase64 = cert.signedData.startsWith('data:') 
          ? cert.signedData 
          : `data:application/pdf;base64,${cert.signedData}`;
        setPdfPreviewUrl(cleanBase64);
      } else if (cert.url || cert.blobUrl) {
        setPdfPreviewUrl(cert.url || cert.blobUrl);
      }

      notify(`Certificate found for '${cleanIc}'!`, 'success');
    } catch (error) {
      console.error('Search failed:', error);
      notify(`Failed to fetch certificate: ${error.message}`, 'error');
    } finally {
      setSearchLoading(false);
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
      // Open file browser automatically
      const fileInput = document.getElementById('cert-file-input');
      if (fileInput) {
        fileInput.click();
      }
      notify(`Loaded '${targetIc}' into the form. Select the new PDF file to overwrite.`, 'info');
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '16px' }}>
      {/* Modern Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #f0fdf4 50%, #eff6ff 100%)',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '24px 28px',
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
              Easily upload, search, view, and manage digital Inspection Certificates for all calls.
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
            Admin Module
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        {/* Card 1: Upload / Replace Certificate */}
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
              Upload & Overwrite
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

            {/* Uploader Name (Mandatory & Empty by Default) */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13.5px', color: '#334155', marginBottom: '6px' }}>
                <span>👤</span> Uploaded By / Designation <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Enter your name & designation (e.g. R. K. Sharma / IE)"
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
                      Drag & Drop your PDF Certificate here
                    </p>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px' }}>
                      Supports standard PDF files • Max limit: <strong>2.0 MB</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Compression Progress & Ratio Details */}
            {compressProgressText && (
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '12.5px',
                color: '#1e40af',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '14px', height: '14px' }}></span>
                <span>{compressProgressText}</span>
              </div>
            )}

            {compressedFileInfo && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '10px',
                padding: '9px 14px',
                fontSize: '12px',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>⚡ Auto-Compression: <strong>{compressedFileInfo.original} MB ➔ {compressedFileInfo.compressed} MB</strong></span>
                <span style={{ fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>-{compressedFileInfo.ratio}%</span>
              </div>
            )}

            {/* Submit Button */}
            <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
              <button
                type="submit"
                disabled={uploadLoading || !selectedFile || !icNumber.trim() || !uploader.trim()}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: '10px',
                  background: (uploadLoading || !selectedFile || !icNumber.trim() || !uploader.trim())
                    ? '#e2e8f0'
                    : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: (uploadLoading || !selectedFile || !icNumber.trim() || !uploader.trim()) ? '#94a3b8' : '#ffffff',
                  fontWeight: 700,
                  fontSize: '14.5px',
                  border: 'none',
                  cursor: (uploadLoading || !selectedFile || !icNumber.trim() || !uploader.trim()) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: (uploadLoading || !selectedFile || !icNumber.trim() || !uploader.trim()) ? 'none' : '0 4px 14px rgba(2, 132, 199, 0.3)',
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
                border: '1px solid #bbf7d0',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '13px',
                color: '#166534',
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
                Search & View Certificate
              </h3>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
              Quick Search
            </span>
          </div>

          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
            {/* Search Input */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Enter IC Number or Call Number..."
                value={searchIc}
                onChange={(e) => setSearchIc(e.target.value)}
                style={{
                  flex: 1,
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
              <button
                type="submit"
                disabled={searchLoading || !searchIc.trim()}
                style={{
                  padding: '11px 22px',
                  borderRadius: '10px',
                  background: searchLoading || !searchIc.trim() ? '#e2e8f0' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: searchLoading || !searchIc.trim() ? '#94a3b8' : '#ffffff',
                  fontWeight: 700,
                  fontSize: '14px',
                  border: 'none',
                  cursor: searchLoading || !searchIc.trim() ? 'not-allowed' : 'pointer',
                  boxShadow: searchLoading || !searchIc.trim() ? 'none' : '0 4px 12px rgba(2, 132, 199, 0.25)',
                  transition: 'all 0.2s'
                }}
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Certificate Details / Preview */}
            {certificateData ? (
              <div style={{
                border: '1.5px solid #e2e8f0',
                borderRadius: '14px',
                padding: '18px',
                background: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      textTransform: 'uppercase'
                    }}>
                      Stored Certificate
                    </span>
                    <h4 style={{ margin: '6px 0 2px', fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>
                      {certificateData.icNumber || searchIc}
                    </h4>
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                      File: <strong>{certificateData.fileName || 'certificate.pdf'}</strong>
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
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
                  </div>
                </div>

                {/* PDF Viewer / Embed */}
                {pdfPreviewUrl && (
                  <div style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    height: '280px',
                    overflow: 'hidden',
                    background: '#e2e8f0'
                  }}>
                    <iframe
                      src={pdfPreviewUrl}
                      title="Certificate Preview"
                      width="100%"
                      height="100%"
                      style={{ border: 'none' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {pdfPreviewUrl && (
                    <a
                      href={pdfPreviewUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={`${(certificateData.icNumber || searchIc).replace(/[/\\?%*:|"<>]/g, '_')}.pdf`}
                      style={{
                        padding: '9px 18px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: '#fff',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)'
                      }}
                    >
                      <span>📥</span> Open Full PDF in New Tab
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#94a3b8',
                border: '1.5px dashed #cbd5e1',
                borderRadius: '14px',
                margin: 'auto 0',
                background: '#f8fafc'
              }}>
                <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>🔍</span>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b', fontWeight: 600 }}>
                  Search for an IC number above to preview, download, or replace its certificate.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateStorageManager;
