import React, { useState } from 'react';
import {
  uploadSignedCertificateFile,
  viewSignedCertificate,
  checkSignedCertificateExists,
  deleteSignedCertificate
} from '../../services/certificateService';
import { getStoredUser } from '../../services/authService';

export const CertificateStorageManager = ({ onNotify }) => {
  const currentUser = getStoredUser();
  const defaultUploader = currentUser?.fullName || currentUser?.username || 'Admin';

  // Upload Form State
  const [icNumber, setIcNumber] = useState('');
  const [uploader, setUploader] = useState(defaultUploader);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
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
      } else {
        notify('Please select a valid PDF file.', 'error');
      }
    }
  };

  // Upload Handler
  const handleUpload = async (e) => {
    e.preventDefault();
    const cleanIc = icNumber.trim();
    if (!cleanIc) {
      notify('Please provide an IC Number or Call Number.', 'warning');
      return;
    }
    if (!selectedFile) {
      notify('Please select a PDF certificate file to upload.', 'warning');
      return;
    }

    setUploadLoading(true);
    setUploadResult(null);

    try {
      const response = await uploadSignedCertificateFile(selectedFile, cleanIc, uploader.trim());
      setUploadResult(response);
      notify(`Certificate for '${cleanIc}' uploaded successfully!`, 'success');
      
      // Auto populate search with uploaded IC to show result
      setSearchIc(cleanIc);
    } catch (error) {
      console.error('Upload failed:', error);
      notify(`Upload failed: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setUploadLoading(false);
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

    if (!window.confirm(`Are you sure you want to permanently delete the certificate for "${cleanIc}" from Azure Storage and Database?`)) {
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f4c81 0%, #1e293b 100%)',
        color: '#ffffff',
        padding: '24px 28px',
        borderRadius: '16px',
        marginBottom: '28px',
        boxShadow: '0 8px 24px rgba(15, 76, 129, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '24px' }}>🛡️</span>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px' }}>
              Certificate Storage & Management
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.4 }}>
            Directly upload, inspect, update, or remove digital Inspection Certificates (ICs) stored in Azure Cloud Storage.
          </p>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '12.5px',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          Admin Tool
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        {/* Card 1: Upload / Replace Certificate */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>📤</span>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
              Upload / Overwrite Certificate
            </h3>
          </div>

          <form onSubmit={handleUpload} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            {/* IC Number Input */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', color: '#334155', marginBottom: '6px' }}>
                Inspection Certificate (IC) or Call Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. IC/2024/001 or N/24/0001"
                value={icNumber}
                onChange={(e) => setIcNumber(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Uploader Name */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', color: '#334155', marginBottom: '6px' }}>
                Uploaded By / Designation
              </label>
              <input
                type="text"
                placeholder="e.g. Admin / Inspecting Engineer"
                value={uploader}
                onChange={(e) => setUploader(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* File Dropzone */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', color: '#334155', marginBottom: '6px' }}>
                Certificate PDF File <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${isDragOver ? '#0f4c81' : '#cbd5e1'}`,
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  background: isDragOver ? '#f0fdfa' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
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
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>📄</div>
                {selectedFile ? (
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>
                      {selectedFile.name}
                    </p>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px' }}>
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for upload
                    </p>
                    <span style={{ display: 'inline-block', marginTop: '8px', color: '#0f4c81', fontSize: '12px', textDecoration: 'underline' }}>
                      Click to change file
                    </span>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: '#334155', fontSize: '14px' }}>
                      Drag & Drop your PDF Certificate here
                    </p>
                    <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '12px' }}>
                      or click to browse from device (PDF only)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
              <button
                type="submit"
                disabled={uploadLoading || !selectedFile || !icNumber.trim()}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  background: uploadLoading ? '#94a3b8' : 'linear-gradient(135deg, #0f4c81 0%, #0369a1 100%)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '14.5px',
                  border: 'none',
                  cursor: uploadLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(15, 76, 129, 0.2)',
                  transition: 'all 0.2s'
                }}
              >
                {uploadLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Uploading to Azure Storage...
                  </>
                ) : (
                  <>
                    <span>🚀</span> Upload Certificate to Azure
                  </>
                )}
              </button>
            </div>

            {/* Success Upload Card */}
            {uploadResult && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '13px',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '12px'
              }}>
                <div>
                  <strong>Upload Successful:</strong> {uploadResult.fileName || uploadResult.message}
                </div>
                {uploadResult.url && (
                  <a
                    href={uploadResult.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#0f4c81', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    View Blob ↗
                  </a>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Card 2: Search, Verify & Manage Existing */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>🔍</span>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
              Search & Inspect Existing Certificate
            </h3>
          </div>

          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            {/* Search Input */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Enter IC Number or Call Number..."
                value={searchIc}
                onChange={(e) => setSearchIc(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="submit"
                disabled={searchLoading || !searchIc.trim()}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: '#0f4c81',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '14px',
                  border: 'none',
                  cursor: searchLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Certificate Details / Preview */}
            {certificateData ? (
              <div style={{
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
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
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      textTransform: 'uppercase'
                    }}>
                      Stored in Azure
                    </span>
                    <h4 style={{ margin: '6px 0 2px', fontSize: '16px', color: '#0f172a' }}>
                      {certificateData.icNumber || searchIc}
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                      File: <strong>{certificateData.fileName || 'certificate.pdf'}</strong>
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleReplaceExisting}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        border: '1px solid #bae6fd',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ✏️ Edit / Replace
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                        fontSize: '12px',
                        fontWeight: 600,
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
                    borderRadius: '8px',
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
                        padding: '8px 16px',
                        borderRadius: '6px',
                        background: '#0f4c81',
                        color: '#fff',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
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
                borderRadius: '12px',
                margin: 'auto 0'
              }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🔍</span>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>
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
