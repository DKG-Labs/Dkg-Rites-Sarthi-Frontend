import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getBaseUrl } from '../services/apiConfig';
import { getStoredUser } from '../services/authService';
import { viewSignedCertificate } from '../services/certificateService';
import { generateRailpadCallLetterPDF } from '../utils/generateCallLetterPDF';
import { 
  fetchCaseLetterMetadata, 
  fetchSavedCaseLetterInfo,
  mergePreviewCaseLetter, 
  saveCaseLetter, 
  viewSavedCaseLetterPdf, 
  downloadSavedCaseLetterPdf,
  deleteSavedCaseLetter
} from '../services/caseLetterService';

const MAX_FILE_SIZE_MB = 3;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Master document definitions for Railpad module
const RAILPAD_DOC_DEFINITIONS = [
  { srNo: 1, key: 'CALL_LETTER', name: 'Call Letter', currentSource: 'System Generated', finalSource: 'System Generated', rpp: true, rpf: true, isAutoFetch: true, isSystem: true },
  { srNo: 2, key: 'PO', name: 'PO', currentSource: 'IREPS', finalSource: 'IREPS', rpp: true, rpf: true, isAutoFetch: true, isSystem: true },
  { srNo: 3, key: 'MA', name: 'MA', currentSource: 'Upload PDF', finalSource: 'IREPS', rpp: true, rpf: true, isAutoFetch: false, isSystem: false },
  { srNo: 4, key: 'QAP', name: 'QAP', currentSource: 'Upload PDF', finalSource: 'Plant wise Stationary Document to be uploaded by Vendor', rpp: true, rpf: true, isAutoFetch: false, isSystem: false },
  { srNo: 5, key: 'FIRMS_APPROVAL', name: "Firms Approval Letter", currentSource: 'Upload PDF', finalSource: 'Calibration Module', rpp: true, rpf: true, isAutoFetch: false, isSystem: false },
  { srNo: 6, key: 'GAUGE_APPROVAL', name: 'Gauge Approval Letter', currentSource: 'Upload PDF', finalSource: 'Calibration Module', rpp: true, rpf: true, isAutoFetch: false, isSystem: false },
  { srNo: 7, key: 'CALIBRATION_CERT', name: 'Instrument & Equipment Calibration Certificate', currentSource: 'Upload PDF', finalSource: 'Calibration Module', rpp: true, rpf: true, isAutoFetch: false, isSystem: false },
  { srNo: 8, key: 'RUBBER_LICENCE_PURCHASER', name: 'Rubber Licence Purchaser', currentSource: 'Upload PDF', finalSource: 'Calibration Module', rpp: true, rpf: true, isAutoFetch: false, isSystem: false },
  { srNo: 9, key: 'RUBBER_LICENCE_MANUFACTURER', name: 'Rubber Licence Manufacturer', currentSource: 'Upload PDF', finalSource: 'Calibration Module', rpp: true, rpf: true, isAutoFetch: false, isSystem: false },
  { srNo: 10, key: 'MTC_TEST_CERT', name: 'MTC Test Certificate', currentSource: 'Upload PDF', finalSource: 'Uploaded by Vendor', rpp: true, rpf: false, isAutoFetch: false, isSystem: false },
  { srNo: 11, key: 'INTERNAL_TEST_CERT', name: 'Internal Test Certificate', currentSource: 'Upload PDF', finalSource: 'Uploaded by Vendor', rpp: false, rpf: true, isAutoFetch: false, isSystem: false },
  { srNo: 14, key: 'OFFER_LETTER', name: 'Offer Letter', currentSource: 'Upload PDF', finalSource: 'Uploaded by Vendor', rpp: true, rpf: true, isAutoFetch: false, isSystem: false },
  { srNo: 15, key: 'ANNEXURES', name: 'Relevant Annexures as per stage of Inspection', currentSource: 'Upload PDF', finalSource: 'Uploaded by IE', rpp: true, rpf: true, isAutoFetch: false, isSystem: false },
  { srNo: 16, key: 'ITP', name: 'Inspection Test Plan (ITP)', currentSource: 'Upload PDF', finalSource: 'Uploaded by IE', rpp: true, rpf: true, isItp: true, isAutoFetch: false, isSystem: false },
  { srNo: 17, key: 'IC', name: 'Inspection Certificate IC', currentSource: 'System Generated', finalSource: 'System Generated', rpp: true, rpf: true, isAutoFetch: true, isSystem: true },
  { srNo: 18, key: 'IC_PROCESS', name: 'IC - Process', currentSource: 'System Generated', finalSource: 'System Generated', rpp: false, rpf: true, isAutoFetch: true, isSystem: true },
];

const GenerateCaseLetterModal = ({
  isOpen,
  onClose,
  call,
  onCaseLetterSaved
}) => {
  const [stage, setStage] = useState('RPF'); // 'RPP' | 'RPF'
  const [docList, setDocList] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [systemDocBlobs, setSystemDocBlobs] = useState({});
  const [loadingItems, setLoadingItems] = useState({});
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [merging, setMerging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingCaseLetter, setDeletingCaseLetter] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [viewingDocUrl, setViewingDocUrl] = useState(null);
  const [viewingDocTitle, setViewingDocTitle] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [savedCaseLetter, setSavedCaseLetter] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [orderDirection, setOrderDirection] = useState('bottom-to-top');

  const fileInputRefs = useRef({});

  const callNo = call?.requestId || call?.call_no || call?.callNo || call?.callNumber || '';
  const icNumber = call?.ic_number || call?.icNo || call?.certificateNo || callNo;
  const poNumber = call?.rlyPoSrNo || call?.po_no || call?.poNo || call?.poNumber || call?.rawPoNo || '-';
  const vendorName = call?.vendorName || call?.vendor_name || call?.vendorCode || '-';
  const moduleType = 'RAILPAD';

  // Detect stage (RPP or RPF)
  const detectStage = useCallback((callObj) => {
    if (!callObj) return 'RPF';
    const candidates = [
      callObj?.stage,
      callObj?.call_stage,
      callObj?.callType,
      callObj?.call_type,
      callObj?.inspectionStage,
      callObj?.railPadType,
      callObj?.productType,
      callObj?.call_no,
      callObj?.callNo,
      callObj?.requestId
    ].filter(Boolean);

    for (const c of candidates) {
      const upper = String(c).toUpperCase().trim();
      if (upper === 'RPP' || upper.startsWith('RPP-') || upper.startsWith('RPP_') || upper.includes('/RPP-') || upper.includes('_RPP-') || upper.includes('PROCESS')) {
        return 'RPP';
      }
      if (upper === 'RPF' || upper.startsWith('RPF-') || upper.startsWith('RPF_') || upper.includes('/RPF-') || upper.includes('_RPF-') || upper.includes('FINAL')) {
        return 'RPF';
      }
    }
    return 'RPF';
  }, []);

  // Filter documents based on stage
  const getDocumentDefinitions = useCallback((currentStage) => {
    return RAILPAD_DOC_DEFINITIONS.filter(doc => {
      if (currentStage === 'RPP') return doc.rpp;
      if (currentStage === 'RPF') return doc.rpf;
      return true;
    });
  }, []);

  // Initialize on modal open
  useEffect(() => {
    if (!isOpen || !callNo) return;
    const currentStage = detectStage(call);
    setStage(currentStage);
    const filteredDocs = getDocumentDefinitions(currentStage);
    setDocList(filteredDocs);
    setUploadedFiles({});
    setSystemDocBlobs({});
    setLoadingItems({});
    setPreviewBlobUrl(null);
    setViewingDocUrl(null);
    setErrorMessage('');
    setSuccessMessage('');
    setShowConfirmDialog(false);
    setOrderDirection('bottom-to-top');

    // Auto-fetch metadata and all system documents
    loadAllDocuments(callNo, currentStage, filteredDocs);
  }, [isOpen, call, callNo, detectStage, getDocumentDefinitions]);

  const getAuthToken = () => {
    return localStorage.getItem('authToken') || localStorage.getItem('token') || '';
  };

  // Main loader for all auto-fetched documents
  const loadAllDocuments = async (cNo, currentStage, activeDocList) => {
    setLoadingDocs(true);
    const filteredDocs = activeDocList || getDocumentDefinitions(currentStage);

    // 0. Metadata & Existing Case Letter
    try {
      const meta = await fetchCaseLetterMetadata(cNo, 'RAILPAD');
      if (meta?.existingCaseLetter) {
        setSavedCaseLetter(meta.existingCaseLetter);
      } else {
        try {
          const info = await fetchSavedCaseLetterInfo(cNo);
          if (info && (info.id || info.originalFileName || info.blobFileName)) {
            setSavedCaseLetter(info);
          }
        } catch (infoErr) {
          // ignore
        }
      }
    } catch (e) {
      console.warn('Metadata check error:', e);
      try {
        const info = await fetchSavedCaseLetterInfo(cNo);
        if (info && (info.id || info.originalFileName || info.blobFileName)) {
          setSavedCaseLetter(info);
        }
      } catch (infoErr) {
        // ignore
      }
    }

    // 1. Fetch Call Letter (SR 1)
    (async () => {
      setLoadingItems(prev => ({ ...prev, CALL_LETTER: true }));
      try {
        const user = getStoredUser();
        const enrichedCall = {
          ...call,
          callNumber: cNo,
          callNo: cNo,
          requestId: cNo,
          poNumber: poNumber,
          vendorName: vendorName,
          rio: call?.rio || user?.rio || ''
        };
        const doc = generateRailpadCallLetterPDF(enrichedCall, false);
        if (doc) {
          const letterBlob = doc.output('blob');
          setSystemDocBlobs(prev => ({ ...prev, CALL_LETTER: letterBlob }));
        }
      } catch (clErr) {
        console.warn('Call letter generation error:', clErr);
      } finally {
        setLoadingItems(prev => ({ ...prev, CALL_LETTER: false }));
      }
    })();

    // 2. Fetch PO Document (SR 2)
    (async () => {
      setLoadingItems(prev => ({ ...prev, PO: true }));
      try {
        const candidates = [
          poNumber,
          call?.po_no,
          call?.poNo,
          call?.poNumber,
          call?.rawPoNo
        ].filter(Boolean);

        const allCandidates = [];
        candidates.forEach(c => {
          allCandidates.push(c);
          if (c.includes('/')) {
            c.split('/').forEach(part => {
              const trimmed = part.trim();
              if (trimmed && !allCandidates.includes(trimmed)) {
                allCandidates.push(trimmed);
              }
            });
          }
        });

        const token = getAuthToken();
        const baseUrl = getBaseUrl();
        let foundPdfBlob = null;

        for (const candidate of allCandidates) {
          if (!candidate || candidate === '-') continue;
          try {
            const poPathRes = await fetch(`${baseUrl}/vendor/po-pdf-path?rawPoNo=${encodeURIComponent(candidate)}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (poPathRes.ok) {
              const poPathData = await poPathRes.json();
              const pdfPath = poPathData?.responseData;
              if (pdfPath && typeof pdfPath === 'string') {
                if (pdfPath.startsWith('http') || pdfPath.includes('ireps.gov.in') || pdfPath.includes('blob.core.windows.net')) {
                  const proxyRes = await fetch(`${baseUrl}/vendor/proxy-pdf?url=${encodeURIComponent(pdfPath)}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                  });
                  if (proxyRes.ok) {
                    const blob = await proxyRes.blob();
                    if (blob && blob.size > 0) {
                      foundPdfBlob = blob;
                      break;
                    }
                  }
                }
              }
            }
          } catch (e) {
            // try next candidate
          }
        }

        if (foundPdfBlob) {
          setSystemDocBlobs(prev => ({ ...prev, PO: foundPdfBlob }));
        }
      } catch (poErr) {
        console.warn('PO fetch error:', poErr);
      } finally {
        setLoadingItems(prev => ({ ...prev, PO: false }));
      }
    })();

    // 3. Fetch IC (Inspection Certificate - SR 17)
    (async () => {
      setLoadingItems(prev => ({ ...prev, IC: true }));
      try {
        const icCandidates = [
          icNumber,
          call?.ic_number,
          call?.icNo,
          call?.certificateNo,
          cNo
        ].filter(Boolean);

        let signedBlob = null;
        for (const candidate of icCandidates) {
          try {
            const { signedData } = await viewSignedCertificate(candidate);
            if (signedData) {
              const byteCharacters = atob(signedData);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              signedBlob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });
              break;
            }
          } catch (e) {
            // try next
          }
        }

        if (signedBlob) {
          setSystemDocBlobs(prev => ({ ...prev, IC: signedBlob }));
        }
      } catch (icErr) {
        console.warn('IC fetch error:', icErr);
      } finally {
        setLoadingItems(prev => ({ ...prev, IC: false }));
      }
    })();

    // 4. Fetch Process IC (SR 18) - Auto-fetch for Railpad RPF
    if (filteredDocs.some(d => d.key === 'IC_PROCESS' && d.isAutoFetch)) {
      (async () => {
        setLoadingItems(prev => ({ ...prev, IC_PROCESS: true }));
        try {
          const processCandidates = [
            call?.process_ic_number,
            call?.processIcNo,
            call?.processCallNo,
            call?.process_call_no,
            call?.linkedProcessCallNo,
            call?.linked_process_call_no,
            call?.processCallNumber
          ].filter(Boolean);

          let signedBlob = null;
          for (const cand of processCandidates) {
            try {
              const { signedData } = await viewSignedCertificate(cand);
              if (signedData) {
                const byteCharacters = atob(signedData);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                signedBlob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });
                break;
              }
            } catch (e) {
              // try next candidate
            }
          }

          if (signedBlob) {
            setSystemDocBlobs(prev => ({ ...prev, IC_PROCESS: signedBlob }));
          }
        } catch (procErr) {
          console.warn('Process IC fetch error:', procErr);
        } finally {
          setLoadingItems(prev => ({ ...prev, IC_PROCESS: false }));
        }
      })();
    }

    setLoadingDocs(false);
  };

  // Handle individual user file upload
  const handleFileUpload = (docKey, file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage(`"${file.name}" is not a PDF. Only PDF files are allowed.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`File exceeds maximum allowed size of ${MAX_FILE_SIZE_MB} MB. (Selected: ${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
      return;
    }

    setErrorMessage('');
    const blobUrl = URL.createObjectURL(file);
    setUploadedFiles(prev => ({
      ...prev,
      [docKey]: {
        file,
        name: file.name,
        size: file.size,
        blobUrl,
        isUploaded: true
      }
    }));
  };

  const handleRemoveUploadedFile = (docKey) => {
    setUploadedFiles(prev => {
      const copy = { ...prev };
      if (copy[docKey]?.blobUrl) {
        URL.revokeObjectURL(copy[docKey].blobUrl);
      }
      delete copy[docKey];
      return copy;
    });
  };

  // View individual document
  const handleViewIndividualDoc = (doc) => {
    const uploaded = uploadedFiles[doc.key];
    if (uploaded?.blobUrl) {
      setViewingDocTitle(doc.name);
      setViewingDocUrl(uploaded.blobUrl);
      return;
    }

    const systemBlob = systemDocBlobs[doc.key];
    if (systemBlob) {
      const url = URL.createObjectURL(systemBlob);
      setViewingDocTitle(doc.name);
      setViewingDocUrl(url);
      return;
    }

    setErrorMessage(`"${doc.name}" is not available yet. Please upload or generate it.`);
  };

  // Check if document is available
  const isDocAvailable = (doc) => {
    if (uploadedFiles[doc.key]) return true;
    if (systemDocBlobs[doc.key]) return true;
    return false;
  };

  // Get sequence of documents based on orderDirection
  const getOrderedDocuments = useCallback(() => {
    const copy = [...docList];
    if (orderDirection === 'bottom-to-top') {
      return copy.reverse();
    }
    return copy;
  }, [docList, orderDirection]);

  // Merge All Available Documents
  const handleMergePdfs = async () => {
    try {
      setMerging(true);
      setErrorMessage('');
      setSuccessMessage('');

      const orderedList = getOrderedDocuments();
      const formData = new FormData();
      let attachedCount = 0;

      for (let i = 0; i < orderedList.length; i++) {
        const doc = orderedList[i];
        const uploaded = uploadedFiles[doc.key];
        const systemBlob = systemDocBlobs[doc.key];
        const filePrefix = String(i + 1).padStart(2, '0');

        if (uploaded?.file) {
          formData.append('files', uploaded.file, `${filePrefix}_${doc.srNo}_${doc.key}.pdf`);
          attachedCount++;
        } else if (systemBlob) {
          const file = new File([systemBlob], `${filePrefix}_${doc.srNo}_${doc.key}.pdf`, { type: 'application/pdf' });
          formData.append('files', file);
          attachedCount++;
        }
      }

      if (attachedCount === 0) {
        setErrorMessage('No documents are currently available to merge. Please ensure at least one document is available or uploaded.');
        setMerging(false);
        return;
      }

      const mergedPdfBlob = await mergePreviewCaseLetter(formData);
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
      const url = URL.createObjectURL(mergedPdfBlob);
      setPreviewBlobUrl(url);
      setSuccessMessage(`Successfully merged ${attachedCount} documents in ${orderDirection === 'bottom-to-top' ? 'Bottom-to-Top' : 'Top-to-Bottom'} sequence! Review the preview below.`);
    } catch (err) {
      console.error('Merge error:', err);
      setErrorMessage(err.message || 'Failed to merge documents into Case Letter PDF.');
    } finally {
      setMerging(false);
    }
  };

  // Confirm and Save to Azure Blob Storage
  const handleConfirmSave = async () => {
    setShowConfirmDialog(false);
    try {
      setSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      const orderedList = getOrderedDocuments();
      const formData = new FormData();
      formData.append('callNo', callNo);
      formData.append('icNumber', icNumber || '');
      formData.append('moduleType', 'RAILPAD');
      formData.append('stage', stage);
      formData.append('uploadedBy', localStorage.getItem('username') || localStorage.getItem('userName') || 'Inspecting Engineer');

      let attachedCount = 0;
      for (let i = 0; i < orderedList.length; i++) {
        const doc = orderedList[i];
        const uploaded = uploadedFiles[doc.key];
        const systemBlob = systemDocBlobs[doc.key];
        const filePrefix = String(i + 1).padStart(2, '0');

        if (uploaded?.file) {
          formData.append('files', uploaded.file, `${filePrefix}_${doc.srNo}_${doc.key}.pdf`);
          attachedCount++;
        } else if (systemBlob) {
          const file = new File([systemBlob], `${filePrefix}_${doc.srNo}_${doc.key}.pdf`, { type: 'application/pdf' });
          formData.append('files', file);
          attachedCount++;
        }
      }

      if (attachedCount === 0) {
        setErrorMessage('Cannot save empty case letter. Please upload or merge at least one document.');
        setSaving(false);
        return;
      }

      const res = await saveCaseLetter(formData);
      if (res && res.status === 'success') {
        setSavedCaseLetter(res.data);
        setSuccessMessage(`Case Letter for call ${callNo} has been merged and saved successfully!`);
        if (onCaseLetterSaved) {
          onCaseLetterSaved(res.data);
        }
      } else {
        setErrorMessage(res?.message || 'Failed to save Case Letter.');
      }
    } catch (err) {
      console.error('Save Case Letter error:', err);
      setErrorMessage(err.message || 'Error occurred while saving Case Letter. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Delete saved Case Letter and unlock matrix
  const handleDeleteCaseLetter = async () => {
    setShowDeleteConfirmDialog(false);
    try {
      setDeletingCaseLetter(true);
      setErrorMessage('');
      setSuccessMessage('');
      await deleteSavedCaseLetter(callNo);
      setSavedCaseLetter(null);
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(null);
      }
      setSuccessMessage(`Case Letter for call ${callNo} deleted successfully. Document matrix is now unlocked.`);
      if (onCaseLetterSaved) {
        onCaseLetterSaved(null);
      }
    } catch (err) {
      console.error('Delete Case Letter error:', err);
      setErrorMessage(err.message || 'Failed to delete Case Letter.');
    } finally {
      setDeletingCaseLetter(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 99999, padding: '20px'
      }}
      onClick={e => {
        if (e.target === e.currentTarget && !merging && !saving) {
          onClose();
        }
      }}
    >
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '96%',
        maxWidth: '1350px',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        
        {/* MODAL HEADER */}
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #334155'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '0.5px'
              }}>
                RAILPAD • {stage}
              </span>
              <h2 style={{ fontSize: '19px', fontWeight: '700', margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Generate Case Letter (Merge Dossier)
              </h2>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Call No: <strong style={{ color: '#e2e8f0' }}>{callNo}</strong> | 
              PO No: <strong style={{ color: '#e2e8f0' }}>{poNumber}</strong> | 
              IC No: <strong style={{ color: '#e2e8f0' }}>{icNumber}</strong> | 
              Vendor: <strong style={{ color: '#e2e8f0' }}>{vendorName}</strong>
            </p>
          </div>

          <button
            disabled={merging || saving}
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: merging || saving ? 'not-allowed' : 'pointer',
              opacity: merging || saving ? 0.4 : 1,
              fontSize: '18px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => {
              if (!merging && !saving) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={e => {
              if (!merging && !saving) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            title={merging || saving ? 'Please wait, operation in progress...' : 'Close Modal'}
          >
            ✕
          </button>
        </div>

        {/* NOTIFICATIONS */}
        {errorMessage && (
          <div style={{
            background: '#fef2f2', color: '#991b1b',
            borderLeft: '4px solid #ef4444',
            padding: '10px 24px', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <span>⚠️</span> <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div style={{
            background: '#f0fdf4', color: '#166534',
            borderLeft: '4px solid #22c55e',
            padding: '10px 24px', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <span>✅</span> <span>{successMessage}</span>
          </div>
        )}

        {/* MODAL BODY (TWO COLUMN LAYOUT) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: previewBlobUrl ? '1.15fr 1fr' : '1fr',
          gap: '20px',
          padding: '20px 24px',
          overflowY: 'auto',
          flex: 1
        }}>
          
          {/* LEFT: DOCUMENT CHECKLIST TABLE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* LOCKED BANNER WHEN CASE LETTER EXISTS */}
            {savedCaseLetter && (
              <div style={{
                background: '#f0fdf4',
                border: '1px dashed #86efac',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '22px' }}>🔒</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#166534' }}>
                    Case Letter already generated & saved for this call
                  </div>
                  <div style={{ fontSize: '12px', color: '#15803d', marginTop: '2px' }}>
                    Document upload and merging are disabled. You can preview, view, or download the active Case Letter below. To upload new documents or re-merge, delete the current Case Letter first.
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📋</span> Required Document Matrix ({docList.length} Items)
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Upload limit: 3 MB per document (PDF only). Documents will be compiled in the specified merge order.
                </span>
              </div>

              {/* Merge Sequence Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#334155', fontWeight: '700', fontSize: '12px' }}>
                  Merge Sequence:
                </span>
                <select
                  value={orderDirection}
                  onChange={e => setOrderDirection(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#0f172a',
                    cursor: 'pointer'
                  }}
                >
                  <option value="bottom-to-top">⬇️ Bottom to Top (Recommended)</option>
                  <option value="top-to-bottom">⬆️ Top to Bottom</option>
                </select>
              </div>
            </div>

            {/* TABLE */}
            <div style={{
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              maxHeight: '480px',
              overflowY: 'auto'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                    <th style={{ padding: '10px 12px', width: '60px', textAlign: 'center' }}>SR NO</th>
                    <th style={{ padding: '10px 12px' }}>Name of Document</th>
                    <th style={{ padding: '10px 12px', width: '140px' }}>Current Source</th>
                    <th style={{ padding: '10px 12px', width: '110px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '10px 12px', width: '190px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {docList.map((doc, index) => {
                    const available = isDocAvailable(doc);
                    const uploaded = uploadedFiles[doc.key];
                    const isLoadingThis = loadingItems[doc.key];

                    return (
                      <tr
                        key={doc.key}
                        style={{
                          borderBottom: index !== docList.length - 1 ? '1px solid #f1f5f9' : 'none',
                          background: available ? '#f0fdf4' : (index % 2 === 0 ? '#ffffff' : '#fafafa'),
                          transition: 'background 0.2s'
                        }}
                      >
                        <td style={{ padding: '10px 12px', fontWeight: '700', color: '#64748b', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            width: '24px',
                            height: '24px',
                            lineHeight: '24px',
                            borderRadius: '50%',
                            background: '#e2e8f0',
                            color: '#1e293b',
                            fontSize: '11px'
                          }}>
                            {doc.srNo}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {doc.name}
                            {doc.isItp && (
                              <span style={{ fontSize: '10px', background: '#dbeafe', color: '#1d4ed8', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                ≤3MB
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            {uploaded ? (
                              <span style={{ color: '#059669', fontWeight: '600' }}>
                                📁 {uploaded.name} ({(uploaded.size / (1024 * 1024)).toFixed(2)} MB)
                              </span>
                            ) : (
                              <span>Final Source: {doc.finalSource}</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#475569', fontSize: '12px' }}>
                          <span style={{
                            display: 'inline-block',
                            background: doc.isSystem ? '#e0f2fe' : '#f1f5f9',
                            color: doc.isSystem ? '#0369a1' : '#475569',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '11px'
                          }}>
                            {doc.currentSource}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {isLoadingThis ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              background: '#eff6ff', color: '#1d4ed8',
                              padding: '3px 8px', borderRadius: '6px',
                              fontSize: '11px', fontWeight: '600'
                            }}>
                              Fetching...
                            </span>
                          ) : available ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              background: '#dcfce7', color: '#166534',
                              padding: '3px 8px', borderRadius: '6px',
                              fontSize: '11px', fontWeight: '700'
                            }}>
                              ✓ Available
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              background: '#f1f5f9', color: '#64748b',
                              padding: '3px 8px', borderRadius: '6px',
                              fontSize: '11px', fontWeight: '600'
                            }}>
                              Pending
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {/* View PDF Button */}
                            {available && (
                              <button
                                onClick={() => handleViewIndividualDoc(doc)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  padding: '5px 10px',
                                  background: '#3b82f6',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                                title="View document in viewer"
                              >
                                View PDF
                              </button>
                            )}

                            {/* Auto-Fetched documents hide the Upload/Replace buttons */}
                            {doc.isAutoFetch ? (
                              !available && (
                                <span style={{
                                  fontSize: '11px',
                                  color: '#64748b',
                                  fontStyle: 'italic',
                                  padding: '4px 8px',
                                  background: '#f8fafc',
                                  borderRadius: '4px',
                                  border: '1px dashed #cbd5e1'
                                }}>
                                  {isLoadingThis ? 'Fetching...' : 'Auto-Fetched'}
                                </span>
                              )
                            ) : (
                              /* Manual Upload documents show Upload / Replace / Remove */
                              <>
                                <div>
                                  <input
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    ref={el => (fileInputRefs.current[doc.key] = el)}
                                    style={{ display: 'none' }}
                                    disabled={merging || saving || Boolean(savedCaseLetter)}
                                    onChange={e => handleFileUpload(doc.key, e.target.files?.[0])}
                                  />
                                  <button
                                    disabled={merging || saving || Boolean(savedCaseLetter)}
                                    onClick={() => !savedCaseLetter && fileInputRefs.current[doc.key]?.click()}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                                      padding: '5px 10px',
                                      background: uploaded ? '#f8fafc' : '#ffffff',
                                      color: '#334155',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      cursor: merging || saving || savedCaseLetter ? 'not-allowed' : 'pointer',
                                      opacity: merging || saving || savedCaseLetter ? 0.4 : 1
                                    }}
                                    title={savedCaseLetter ? 'Case Letter already saved. Delete current Case Letter to upload replacements.' : (uploaded ? 'Replace PDF' : 'Upload PDF')}
                                  >
                                    {uploaded ? 'Replace' : 'Upload'}
                                  </button>
                                </div>

                                {/* Remove Upload Button */}
                                {uploaded && (
                                  <button
                                    disabled={merging || saving || Boolean(savedCaseLetter)}
                                    onClick={() => handleRemoveUploadedFile(doc.key)}
                                    style={{
                                      background: '#fee2e2',
                                      color: '#b91c1c',
                                      border: '1px solid #fecaca',
                                      borderRadius: '6px',
                                      padding: '5px 8px',
                                      cursor: merging || saving || savedCaseLetter ? 'not-allowed' : 'pointer',
                                      opacity: merging || saving || savedCaseLetter ? 0.4 : 1,
                                      fontSize: '11px'
                                    }}
                                    title={savedCaseLetter ? 'Case Letter already saved. Delete current Case Letter to modify documents.' : 'Remove uploaded file'}
                                  >
                                    🗑️
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ACTION TOOLBAR */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginTop: '4px'
            }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                  Available to Merge: {docList.filter(d => isDocAvailable(d)).length} of {docList.length}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  disabled={merging || Boolean(savedCaseLetter)}
                  onClick={handleMergePdfs}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '10px 18px',
                    background: (merging || savedCaseLetter) ? '#94a3b8' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: (merging || savedCaseLetter) ? 'not-allowed' : 'pointer',
                    boxShadow: (merging || savedCaseLetter) ? 'none' : '0 4px 12px rgba(2, 132, 199, 0.25)',
                    opacity: savedCaseLetter ? 0.6 : 1
                  }}
                  title={savedCaseLetter ? 'Case Letter already saved. Delete current Case Letter below to re-merge.' : 'Merge all available documents'}
                >
                  {merging ? 'Merging Documents...' : (savedCaseLetter ? '🔒 Dossier Already Merged' : 'Merge & Preview (Bottom-to-Top)')}
                </button>

                {previewBlobUrl && !savedCaseLetter && (
                  <button
                    disabled={saving}
                    onClick={() => setShowConfirmDialog(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '10px 18px',
                      background: saving ? '#94a3b8' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                    }}
                  >
                    {saving ? 'Compressing & Saving...' : 'Save Case Letter'}
                  </button>
                )}
              </div>
            </div>

            {/* SAVED CASE LETTER INFO CARD */}
            {savedCaseLetter && (
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '1px solid #86efac',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.08)'
              }}>
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#16a34a', fontWeight: '700', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📁</span> Saved Case Letter Available
                    </span>
                    <span style={{ fontSize: '11px', background: '#bbf7d0', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                      ACTIVE
                    </span>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#15803d' }}>
                    File: <strong>{savedCaseLetter.originalFileName || savedCaseLetter.blobFileName || `Case_Letter_${callNo}.pdf`}</strong> | 
                    Size: <strong>{((savedCaseLetter.fileSizeCompressed || savedCaseLetter.fileSizeOriginal || 0) / (1024 * 1024)).toFixed(2)} MB</strong> | 
                    Saved On: <strong>{new Date(savedCaseLetter.uploadedAt || Date.now()).toLocaleString('en-GB')}</strong>
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: '#166534' }}>
                    To upload replacements or generate a fresh Case Letter, click <strong>Delete</strong> below.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={async () => {
                      try {
                        setErrorMessage('');
                        const blob = await viewSavedCaseLetterPdf(callNo);
                        if (previewBlobUrl) {
                          URL.revokeObjectURL(previewBlobUrl);
                        }
                        const url = URL.createObjectURL(blob);
                        setPreviewBlobUrl(url);
                        setSuccessMessage('Loaded saved Case Letter into preview panel.');
                      } catch (e) {
                        setErrorMessage('Could not load saved Case Letter PDF.');
                      }
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '7px 13px',
                      background: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                    }}
                  >
                    👁️ Preview Dossier
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        const blob = await viewSavedCaseLetterPdf(callNo);
                        const url = URL.createObjectURL(blob);
                        setViewingDocTitle(`Saved Case Letter: ${callNo}`);
                        setViewingDocUrl(url);
                      } catch (e) {
                        setErrorMessage('Could not load saved Case Letter PDF.');
                      }
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '7px 13px',
                      background: '#ffffff',
                      color: '#166534',
                      border: '1px solid #86efac',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    🔍 Fullscreen
                  </button>

                  <button
                    onClick={() => downloadSavedCaseLetterPdf(callNo)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '7px 13px',
                      background: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
                    }}
                  >
                    ⬇️ Download
                  </button>

                  <button
                    disabled={deletingCaseLetter}
                    onClick={() => setShowDeleteConfirmDialog(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '7px 13px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: deletingCaseLetter ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 4px rgba(220, 38, 38, 0.1)'
                    }}
                    title="Delete current Case Letter to unlock matrix"
                  >
                    🗑️ {deletingCaseLetter ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: PDF PREVIEW PANEL */}
          {previewBlobUrl && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              overflow: 'hidden',
              height: '100%',
              minHeight: '520px'
            }}>
              <div style={{
                padding: '10px 16px',
                background: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📄 Case Letter Dossier Preview
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => window.open(previewBlobUrl, '_blank')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Open New Tab ↗
                  </button>
                  <button
                    onClick={() => setPreviewBlobUrl(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '16px',
                      cursor: 'pointer',
                      padding: '0 4px'
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <iframe
                src={previewBlobUrl}
                title="Case Letter PDF Preview"
                style={{ width: '100%', height: '100%', flex: 1, border: 'none' }}
              />
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{
          padding: '12px 24px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Module: <strong>Railpad ({stage})</strong> • Case Letter Dossier
          </span>
          <button
            disabled={merging || saving}
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontWeight: '700',
              fontSize: '13px',
              cursor: merging || saving ? 'not-allowed' : 'pointer',
              opacity: merging || saving ? 0.5 : 1
            }}
          >
            Close
          </button>
        </div>

      </div>

      {/* INDIVIDUAL DOCUMENT VIEWER MODAL */}
      {viewingDocUrl && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100000, padding: '24px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '1100px',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '14px 20px',
              background: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                📄 {viewingDocTitle}
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => window.open(viewingDocUrl, '_blank')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Open in New Tab ↗
                </button>
                <button
                  onClick={() => {
                    setViewingDocUrl(null);
                    setViewingDocTitle('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '18px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <iframe
              src={viewingDocUrl}
              title={viewingDocTitle}
              style={{ width: '100%', height: '100%', flex: 1, border: 'none' }}
            />
          </div>
        </div>
      )}

      {/* CONFIRMATION SAVE DIALOG */}
      {showConfirmDialog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100001, padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
              {savedCaseLetter ? 'Confirm Update Case Letter' : 'Confirm Save Case Letter'}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#475569', lineHeight: '1.5' }}>
              {savedCaseLetter ? (
                <>
                  An active Case Letter is already on record for call <strong>{callNo}</strong>.
                  <br /><br />
                  Saving will merge the current documents into a <strong>new updated version</strong> and supersede the existing Case Letter.
                </>
              ) : (
                <>
                  Are you sure you want to save the final Case Letter for call <strong>{callNo}</strong>?
                  <br /><br />
                  All available documents will be merged and saved as the official Case Letter dossier for this call.
                </>
              )}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowConfirmDialog(false)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#16a34a',
                  color: '#ffffff',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Yes, Save Case Letter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DELETE DIALOG */}
      {showDeleteConfirmDialog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100002, padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '460px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              width: '48px', height: '48px', background: '#fee2e2', color: '#dc2626',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', margin: '0 auto 12px'
            }}>
              🗑️
            </div>
            <h3 style={{ margin: '0 0 10px', fontSize: '17px', fontWeight: '700', color: '#0f172a', textAlign: 'center' }}>
              Delete Saved Case Letter?
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#475569', lineHeight: '1.5', textAlign: 'center' }}>
              Are you sure you want to delete the active Case Letter for call <strong>{callNo}</strong>?
              <br /><br />
              This will remove the current Case Letter and unlock the document matrix so you can upload or merge a new Case Letter.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                disabled={deletingCaseLetter}
                onClick={() => setShowDeleteConfirmDialog(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                disabled={deletingCaseLetter}
                onClick={handleDeleteCaseLetter}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: deletingCaseLetter ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.25)'
                }}
              >
                {deletingCaseLetter ? 'Deleting...' : 'Yes, Delete Case Letter'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GenerateCaseLetterModal;
