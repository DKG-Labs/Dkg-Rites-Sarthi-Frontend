import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../services/apiConfig';
import { getStoredUser } from '../services/authService';
import { viewSignedCertificate } from '../services/certificateService';
import { generateCallLetterPDF } from '../call-desk-module/src/utils/generateCallLetterPDF';
import { fetchCallLetterDetails } from '../call-desk-module/src/services/callLetterApi';
import { generateInspectionPhotosPDF } from '../utils/generateInspectionPhotosPDF';
import { annexureService } from '../services/annexureService';
import { captureElementToPdfBlob } from '../utils/annexurePdfUtils';
import { ANNEXURE_LIST } from '../data/annexureList';
import { 
  fetchCaseLetterMetadata, 
  fetchSavedCaseLetterInfo,
  mergePreviewCaseLetter, 
  saveCaseLetter, 
  viewSavedCaseLetterPdf, 
  downloadSavedCaseLetterPdf,
  deleteSavedCaseLetter
} from '../services/caseLetterService';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import MergeTypeRoundedIcon from '@mui/icons-material/MergeTypeRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import CircularProgress from '@mui/material/CircularProgress';


// Master document definitions matching the exact 17-item specification for ERC
export const MASTER_DOC_DEFINITIONS = [
  { srNo: 1, key: 'CALL_LETTER', name: 'Call Letter', currentSource: 'System Generated', finalSource: 'System Generated', er: true, ep: true, ef: true, isAutoFetch: true, isSystem: true },
  { srNo: 2, key: 'PO', name: 'PO', currentSource: 'IREPS', finalSource: 'IREPS', er: true, ep: true, ef: true, isAutoFetch: true, isSystem: true },
  { srNo: 3, key: 'MA', name: 'MA', currentSource: 'Upload PDF', finalSource: 'IREPS', er: true, ep: true, ef: true, isAutoFetch: false, isSystem: false },
  { srNo: 4, key: 'QAP', name: 'QAP', currentSource: 'System Generated', finalSource: 'Plant wise Stationary Document to be uploaded by Vendor', er: true, ep: true, ef: true, isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 5, key: 'FIRMS_APPROVAL', name: "Firms Approval Letter", currentSource: 'System Generated', finalSource: 'Calibration Module', er: true, ep: true, ef: true, isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 6, key: 'GAUGE_APPROVAL', name: 'Gauge Approval Letter', currentSource: 'System Generated', finalSource: 'Calibration Module', er: true, ep: true, ef: true, isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 7, key: 'CALIBRATION_CERT', name: 'Instrument & Equipment Calibration Certificate', currentSource: 'System Generated', finalSource: 'Calibration Module', er: true, ep: true, ef: true, isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 8, key: 'RAW_MATERIAL_TC', name: 'Raw Material TC', currentSource: 'Inventory Entries (Auto-Fetched)', finalSource: 'Uploaded by Vendor', er: true, ep: false, ef: false, isAutoFetch: true, isSystem: true, remarks: 'in case of RM IC' },
  { srNo: 9, key: 'INTERNAL_TEST_CERT', name: 'Internal Test Certificate', currentSource: 'System Generated', finalSource: 'Uploaded by Vendor', er: true, ep: false, ef: true, isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 10, key: 'INTERNAL_DIMENSION_REPORT', name: 'Internal Dimension Report', currentSource: 'System Generated', finalSource: 'Uploaded by Vendor', er: true, ep: false, ef: true, isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 11, key: 'OFFER_LETTER', name: 'Offer Letter', currentSource: 'System Generated', finalSource: 'Uploaded by Vendor', er: true, ep: true, ef: true, isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 12, key: 'PHOTO_PDF', name: 'Photo pdf', currentSource: 'System Generated', finalSource: 'System Generated', er: true, ep: true, ef: true, isAutoFetch: true, isSystem: true, remarks: '6 pic on page' },
  { srNo: 13, key: 'IC_RM', name: 'IC - RM', currentSource: 'System Generated', finalSource: 'System Generated', er: false, ep: true, ef: true, isAutoFetch: true, isSystem: true, remarks: 'Linked RM IC' },
  { srNo: 14, key: 'IC_PROCESS', name: 'IC - Process', currentSource: 'System Generated', finalSource: 'System Generated', er: false, ep: false, ef: true, isAutoFetch: true, isSystem: true, remarks: 'Linked Process IC' },
  { srNo: 15, key: 'ANNEXURES', name: 'Relevant Annexures as per stage of Inspection', currentSource: 'System Generated', finalSource: 'System Generated', er: true, ep: true, ef: true, isAutoFetch: true, isSystem: true },
  { srNo: 16, key: 'ITP', name: 'Inspection Test Plan (ITP) / Annexure (IE needs to upload in addition to System Generated Annexures)', currentSource: 'Upload PDF', finalSource: 'Uploaded by IE', er: true, ep: true, ef: true, isItp: true, isMandatory: true, isAutoFetch: false, isSystem: false, remarks: 'Mandatory' },
  { srNo: 17, key: 'IC', name: 'Inspection Certificate IC', currentSource: 'Auto-Fetched', finalSource: 'System Generated', er: true, ep: true, ef: true, isAutoFetch: true, isSystem: true },
];

// Master document definitions for Railpad module
export const RAILPAD_DOC_DEFINITIONS = [
  { srNo: 1, key: 'CALL_LETTER', name: 'Call Letter', currentSource: 'System Generated', finalSource: 'System Generated', rpp: true, rpf: true, isAutoFetch: true, isSystem: true },
  { srNo: 2, key: 'PO', name: 'PO', currentSource: 'IREPS', finalSource: 'IREPS', rpp: true, rpf: true, isAutoFetch: true, isSystem: true },
  { srNo: 3, key: 'MA', name: 'MA', currentSource: 'Upload PDF', finalSource: 'IREPS', rpp: true, rpf: true, isAutoFetch: false, isSystem: false },
  { srNo: 4, key: 'QAP', name: 'QAP', currentSource: 'System Generated', finalSource: 'Plant wise Stationary Document to be uploaded by Vendor', rpp: true, rpf: true, isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 5, key: 'FIRMS_APPROVAL', name: "Firms Approval Letter", currentSource: 'System Generated', finalSource: 'Calibration Module', rpp: true, rpf: true, isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 6, key: 'GAUGE_APPROVAL', name: 'Gauge Approval Letter', currentSource: 'System Generated', finalSource: 'Calibration Module', rpp: true, rpf: true, isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 7, key: 'CALIBRATION_CERT', name: 'Instrument & Equipment Calibration Certificate', currentSource: 'System Generated', finalSource: 'Calibration Module', rpp: true, rpf: true, isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 8, key: 'RUBBER_LICENCE_PURCHASER', name: 'Rubber Licence Purchaser', currentSource: 'System Generated', finalSource: 'Calibration Module', rpp: true, rpf: true, isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 9, key: 'RUBBER_LICENCE_MANUFACTURER', name: 'Rubber Licence Manufacturer', currentSource: 'System Generated', finalSource: 'Calibration Module', rpp: true, rpf: true, isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 10, key: 'MTC_TEST_CERT', name: 'MTC Test Certificate', currentSource: 'System Generated', finalSource: 'Uploaded by Vendor', rpp: true, rpf: false, isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 11, key: 'OFFER_LETTER', name: 'Offer Letter', currentSource: 'System Generated', finalSource: 'Uploaded by Vendor', rpp: true, rpf: true, isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 12, key: 'PHOTO_PDF', name: 'Photo pdf', currentSource: 'System Generated', finalSource: 'System Generated', rpp: true, rpf: true, isAutoFetch: true, isSystem: true, remarks: '6 pic on page' },
  { srNo: 13, key: 'IC_PROCESS', name: 'IC - Process', currentSource: 'System Generated', finalSource: 'System Generated', rpp: false, rpf: true, isAutoFetch: true, isSystem: true, remarks: 'Linked Process IC' },
  { srNo: 14, key: 'RELEVANT_ANNEXURES', name: 'Relevant Annexures as per stage of Inspection', currentSource: 'System Generated', finalSource: 'Uploaded by IE', rpp: true, rpf: true, isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 15, key: 'ITP', name: 'Inspection Test Plan (ITP) / Annexure (IE needs to upload in addition to System Generated Annexures)', currentSource: 'Upload PDF', finalSource: 'Uploaded by IE', rpp: true, rpf: true, isItp: true, isMandatory: true, isAutoFetch: false, isSystem: false, remarks: 'Mandatory' },
  { srNo: 16, key: 'IC', name: 'Inspection Certificate IC', currentSource: 'Auto-Fetched', finalSource: 'System Generated', rpp: true, rpf: true, isAutoFetch: true, isSystem: true },
];

// Master document definitions for Sleeper module matching matrix (25 items)
export const SLEEPER_DOC_DEFINITIONS = [
  { srNo: 1, key: 'CALL_LETTER', name: 'Call Letter', currentSource: 'System Generated', finalSource: 'System Generated', isAutoFetch: true, isSystem: true },
  { srNo: 2, key: 'PO', name: 'PO', currentSource: 'IREPS', finalSource: 'IREPS', isAutoFetch: true, isSystem: true },
  { srNo: 3, key: 'MA', name: 'MA', currentSource: 'Upload PDF', finalSource: 'IREPS', isAutoFetch: false, isSystem: false },
  { srNo: 4, key: 'QAP', name: 'QAP', currentSource: 'System Generated', finalSource: 'Plant wise Stationary Document to be uploaded by Vendor', isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 5, key: 'CSP_APPROVAL', name: 'CSP Approval Letter', currentSource: 'System Generated', finalSource: 'Calibration Module', isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 6, key: 'MIX_DESIGN_APPROVAL', name: 'Mix Design Approval Letter', currentSource: 'System Generated', finalSource: 'Calibration Module', isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 7, key: 'GAUGE_APPROVAL', name: 'Gauge Approval Letter', currentSource: 'System Generated', finalSource: 'Calibration Module', isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 8, key: 'RM_SUPPLIER_APPROVAL', name: 'RM Supplier/Source Approval letter', currentSource: 'System Generated', finalSource: 'Calibration Module', isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 9, key: 'INSTRUMENT_CALIBRATION_CERT', name: 'Instrument Calibration Certificate', currentSource: 'System Generated', finalSource: 'Calibration Module', isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 10, key: 'EQUIPMENT_CALIBRATION_CERT', name: 'Equipment Calibration Certificate', currentSource: 'System Generated', finalSource: 'Calibration Module', isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 11, key: 'CALIBRATION_BATCHING_PLANT', name: 'Calibration of Batching of Plant, Water meter, SBT, CCTM, Tensioning Jack & CMTM', currentSource: 'System Generated', finalSource: 'Uploaded by Vendor with each Call', isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 12, key: 'EXTERNAL_TEST_REPORT', name: 'External Test Report (Cement, Aggregates)', currentSource: 'System Generated', finalSource: 'Calibration Module', isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 13, key: 'RM_TEST_CERT_INVOICE', name: 'RM Test Certificate & Invoice', currentSource: 'System Generated', finalSource: 'Uploaded by Vendor with each Call', isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 14, key: 'RM_PERIODIC_TEST_REPORT', name: 'RM Periodic Test Report', currentSource: 'System Generated', finalSource: 'Uploaded by Vendor with each Call', isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 15, key: 'RM_INVENTORY_ACCOUNTAL_REPORT', name: 'RM Inventory Accountal Report', currentSource: 'System Generated', finalSource: 'Uploaded by Vendor with each Call', isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 16, key: 'RDSO_REGISTERS', name: 'RDSO Registers', currentSource: 'Upload PDF', finalSource: 'Uploaded by Vendor with each Call', isAutoFetch: false, isSystem: false },
  { srNo: 17, key: 'PROCESS_SHIFTWISE_REPORT', name: 'Process Shiftwise (A, B, C, G) Report', currentSource: 'System Generated', finalSource: 'Uploaded by Vendor with each Call', isAutoFetch: false, isSystem: true, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 18, key: 'OFFER_LETTER', name: 'Offer Letter', currentSource: 'System Generated', finalSource: 'Uploaded by Vendor', isAutoFetch: false, isSystem: true },
  { srNo: 19, key: 'PHOTO_PDF', name: 'Photo pdf', currentSource: 'System Generated', finalSource: 'System Generated', isAutoFetch: true, isSystem: true, remarks: '6 pic on page' },
  { srNo: 20, key: 'RM_IC_HTS_WIRE', name: 'RM IC HTS Wire', currentSource: 'Upload PDF', finalSource: 'System Generated', isAutoFetch: false, isSystem: false, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 21, key: 'RM_IC_SGCI_INSERT', name: 'RM IC SGCI Insert', currentSource: 'Upload PDF', finalSource: 'System Generated', isAutoFetch: false, isSystem: false, isDisabled: true, remarks: 'To be Developed' },
  { srNo: 22, key: 'RELEVANT_ANNEXURES', name: 'Relevant Annexures as per stage of inspection (Critical & General Dimension Report, Visual Check Report, FTC, SBT(MR, MF) Test)', currentSource: 'Autofetched', finalSource: 'Auto Generated', isAutoFetch: true, isSystem: true },
  { srNo: 23, key: 'ITP', name: 'Inspection Test Plan (ITP) / Annexure (IE needs to upload in addition to System Generated Annexures)', currentSource: 'Upload PDF', finalSource: 'Uploaded by IE', isItp: true, isMandatory: true, isAutoFetch: false, isSystem: false, remarks: 'Mandatory' },
  { srNo: 24, key: 'ANNEXURE_TO_IC', name: 'Annexure to IC', currentSource: 'Upload PDF', finalSource: 'System Generated', isAutoFetch: false, isSystem: false },
  { srNo: 25, key: 'IC', name: 'Inspection Certificate IC', currentSource: 'Auto-Fetched', finalSource: 'System Generated', isAutoFetch: true, isSystem: true }
];

const GenerateCaseLetterModal = ({
  isOpen,
  onClose,
  call,
  onCaseLetterSaved
}) => {
  const [stage, setStage] = useState('ER'); // 'ER' | 'EP' | 'EF' | 'RPP' | 'RPF' | 'SF'
  const [docList, setDocList] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState({}); // docKey -> { file, name, size, blobUrl }
  const [systemDocBlobs, setSystemDocBlobs] = useState({}); // docKey -> Blob
  const [loadingItems, setLoadingItems] = useState({}); // docKey -> boolean
  const [fetchFailed, setFetchFailed] = useState({}); // docKey -> boolean
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

  // Annexure compilation states
  const [annexureDataMap, setAnnexureDataMap] = useState({});
  const hiddenAnnexuresRef = useRef(null);

  const fileInputRefs = useRef({});

  const callNo = call?.call_no || call?.callNumber || call?.requestId || '';
  const icNumber = call?.ic_number || call?.icNo || call?.certificateNo || callNo;
  const poNumber = call?.po_no || call?.poNumber || call?.rawPoNo || '-';
  const vendorName = call?.vendor_name || call?.vendorName || call?.manufacturer || '-';
  const rawProductType = (call?.product_type || call?.moduleType || call?.productType || 'ERC').toUpperCase();
  const moduleType = (rawProductType.includes('SLEEPER') || stage === 'SF' || String(callNo).toUpperCase().startsWith('SF') || String(callNo).toUpperCase().startsWith('SL')) ? 'SLEEPER' : ((rawProductType.includes('RAILPAD') || stage === 'RPP' || stage === 'RPF' || String(callNo).toUpperCase().startsWith('RP')) ? 'RAILPAD' : 'ERC');

  // Get maximum upload file size in MB: 20 MB for ERC & Railpad (ITP/Annexure), 50 MB for Sleeper, 3 MB for rest
  const getMaxUploadSizeMb = (key) => {
    const isItpOrAnnexure = 
      key === 'ITP' || 
      key === 'ANNEXURES' || 
      key === 'RELEVANT_ANNEXURES' || 
      key === 'ANNEXURE_TO_IC' ||
      docList.find(d => d.key === key)?.isItp;

    if (isItpOrAnnexure) {
      if (moduleType === 'SLEEPER') {
        return 50; // 50 MB for Sleeper
      }
      return 20; // 20 MB for ERC & Railpad
    }
    return 3; // 3 MB for all other documents
  };

  // Detect stage (ER, EP, EF for ERC, SF for Sleeper, RPP/RPF for Railpad)
  const detectStage = useCallback((callObj) => {
    if (!callObj) return 'ER';
    const candidates = [
      callObj?.stage,
      callObj?.call_stage,
      callObj?.callType,
      callObj?.call_type,
      callObj?.inspectionStage,
      callObj?.productType,
      callObj?.product_type,
      callObj?.call_no,
      callObj?.callNumber,
      callObj?.ic_number,
      callObj?.icNo,
      callObj?.certificateNo,
      callObj?.requestId
    ].filter(Boolean);

    for (const c of candidates) {
      const upper = String(c).toUpperCase().trim();
      if (upper.startsWith('SF') || upper.startsWith('SL') || upper.includes('SLEEPER')) return 'SF';
      if (upper === 'RPP' || upper.startsWith('RPP-') || upper.startsWith('RPP_') || upper.includes('/RPP-') || upper.includes('_RPP-')) return 'RPP';
      if (upper === 'RPF' || upper.startsWith('RPF-') || upper.startsWith('RPF_') || upper.includes('/RPF-') || upper.includes('_RPF-')) return 'RPF';
      if (upper === 'ER' || upper.startsWith('ER-') || upper.startsWith('ER_') || upper.includes('/ER-') || upper.includes('_ER-')) return 'ER';
      if (upper === 'EP' || upper.startsWith('EP-') || upper.startsWith('EP_') || upper.includes('/EP-') || upper.includes('_EP-')) return 'EP';
      if (upper === 'EF' || upper.startsWith('EF-') || upper.startsWith('EF_') || upper.includes('/EF-') || upper.includes('_EF-')) return 'EF';
    }

    const rawType = (callObj?.product_type || callObj?.moduleType || callObj?.productType || '').toUpperCase();
    if (rawType.includes('SLEEPER')) return 'SF';
    if (rawType.includes('RAILPAD')) {
      const stageStr = String(callObj?.stage || callObj?.call_stage || callObj?.callType || callObj?.call_type || '').toUpperCase();
      if (stageStr.includes('PROCESS') || stageStr.includes('RPP')) return 'RPP';
      return 'RPF';
    }

    return 'ER';
  }, []);

  // Filter documents based on stage and module type
  const getDocumentDefinitions = useCallback((currentStage, modType) => {
    const isSleeper = modType === 'SLEEPER' || currentStage === 'SF';
    if (isSleeper) {
      return SLEEPER_DOC_DEFINITIONS;
    }

    const isRailpad = modType === 'RAILPAD' || currentStage === 'RPP' || currentStage === 'RPF';
    if (isRailpad) {
      return RAILPAD_DOC_DEFINITIONS.filter(doc => {
        if (currentStage === 'RPP') return doc.rpp;
        if (currentStage === 'RPF') return doc.rpf;
        return true;
      });
    }

    // ERC Stages
    return MASTER_DOC_DEFINITIONS.filter(doc => {
      if (currentStage === 'ER') {
        return doc.er;
      }
      if (currentStage === 'EP') {
        return doc.ep;
      }
      if (currentStage === 'EF') {
        return doc.ef;
      }
      return true;
    });
  }, []);

  // Initialize on modal open
  useEffect(() => {
    if (!isOpen || !callNo) return;
    const currentStage = detectStage(call);
    const rawType = (call?.product_type || call?.moduleType || call?.productType || '').toUpperCase();
    const resolvedModule = (rawType.includes('SLEEPER') || currentStage === 'SF' || String(callNo).toUpperCase().startsWith('SF') || String(callNo).toUpperCase().startsWith('SL')) ? 'SLEEPER' : ((rawType.includes('RAILPAD') || currentStage === 'RPP' || currentStage === 'RPF' || String(callNo).toUpperCase().startsWith('RP')) ? 'RAILPAD' : 'ERC');

    setStage(currentStage);
    const filteredDocs = getDocumentDefinitions(currentStage, resolvedModule);
    setDocList(filteredDocs);
    setUploadedFiles({});
    setSystemDocBlobs({});
    // Pre-populate loading items for all auto-fetched documents so upload button is not shown initially
    const initialLoading = {};
    filteredDocs.forEach(d => {
      if (d.isAutoFetch && !d.isDisabled) {
        initialLoading[d.key] = true;
      }
    });
    setLoadingItems(initialLoading);
    setFetchFailed({});
    setPreviewBlobUrl(null);
    setViewingDocUrl(null);
    setErrorMessage('');
    setSuccessMessage('');
    setShowConfirmDialog(false);
    setOrderDirection('bottom-to-top');

    // Auto-fetch metadata and all system documents
    loadAllDocuments(callNo, currentStage, filteredDocs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, call, callNo, detectStage, getDocumentDefinitions]);

  const getAuthToken = () => {
    return localStorage.getItem('authToken') || localStorage.getItem('token') || '';
  };

  // Helper to fetch data for single annexure
  const fetchSingleAnnexureData = async (annexureId, cNo) => {
    try {
      if (annexureId === 'chemical-analysis') {
        return await annexureService.getChemicalAnalysis(cNo);
      } else if (annexureId === 'dimensional-check') {
        return await annexureService.getDimensionalCheck(cNo);
      } else if (annexureId === 'final-chemical-analysis') {
        const res = await annexureService.getFinalChemicalAnalysis(cNo);
        return res?.responseData || res || [];
      } else if (annexureId === 'hardness-test') {
        return await annexureService.getFinalHardnessTest(cNo);
      } else if (annexureId === 'toe-load-test') {
        return await annexureService.getFinalToeLoadTest(cNo);
      } else if (annexureId === 'weight-test') {
        return await annexureService.getFinalWeightTest(cNo);
      } else if (annexureId === 'dimension-test') {
        const res = await annexureService.getFinalDimensionalInspection(cNo);
        return res?.responseData || res || [];
      } else if (annexureId === 'final-inspection') {
        return await annexureService.getDimensionalCheck(cNo);
      } else if (annexureId === 'inclusion-rating') {
        const res = await annexureService.getFinalInclusion(cNo);
        return res?.responseData || res || [];
      } else if (annexureId === 'application-deflection') {
        const res = await annexureService.getFinalApplicationDeflection(cNo);
        return res?.responseData || res || [];
      } else if (annexureId === 'process-inspection') {
        const res = await annexureService.getProcessInspectionRegister(cNo);
        return res || [];
      }
    } catch (err) {
      console.warn(`Could not fetch data for annexure ${annexureId}:`, err);
    }
    return [];
  };

  // Main loader for all documents
  const loadAllDocuments = async (cNo, currentStage, activeDocList) => {
    setLoadingDocs(true);
    const filteredDocs = activeDocList || getDocumentDefinitions(currentStage, moduleType);

    // 0. Metadata & Existing Case Letter
    try {
      const meta = await fetchCaseLetterMetadata(cNo, moduleType);
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
        const details = await fetchCallLetterDetails(cNo);
        const user = getStoredUser();
        const enrichedCall = {
          ...call,
          ...details,
          callNumber: cNo,
          poNumber: call?.po_no || call?.poNumber || poNumber,
          vendorName: call?.vendor_name || call?.vendorName || vendorName,
          rio: details?.rio || call?.rio || user?.rio || ''
        };
        const doc = generateCallLetterPDF(enrichedCall, false);
        if (doc) {
          const letterBlob = doc.output('blob');
          setSystemDocBlobs(prev => ({ ...prev, CALL_LETTER: letterBlob }));
        } else {
          setFetchFailed(prev => ({ ...prev, CALL_LETTER: true }));
        }
      } catch (clErr) {
        console.warn('Call letter generation error:', clErr);
        setFetchFailed(prev => ({ ...prev, CALL_LETTER: true }));
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
        let foundPdfBlob = null;

        for (const candidate of allCandidates) {
          if (!candidate || candidate === '-') continue;
          try {
            const poPathRes = await axios.get(`${API_BASE_URL}/api/vendor/po-pdf-path`, {
              params: { rawPoNo: candidate },
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const pdfPath = poPathRes.data?.responseData;
            if (pdfPath && typeof pdfPath === 'string') {
              if (pdfPath.startsWith('http') || pdfPath.includes('ireps.gov.in') || pdfPath.includes('blob.core.windows.net')) {
                const proxyRes = await axios.get(`${API_BASE_URL}/api/vendor/proxy-pdf`, {
                  params: { url: pdfPath },
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                  responseType: 'blob'
                });
                if (proxyRes.status === 200 && proxyRes.data && proxyRes.data.size > 0) {
                  foundPdfBlob = proxyRes.data;
                  break;
                }
              }
            }
          } catch (e) {
            // try next candidate
          }
        }

        if (foundPdfBlob) {
          setSystemDocBlobs(prev => ({ ...prev, PO: foundPdfBlob }));
        } else {
          setFetchFailed(prev => ({ ...prev, PO: true }));
        }
      } catch (poErr) {
        console.warn('PO fetch error:', poErr);
        setFetchFailed(prev => ({ ...prev, PO: true }));
      } finally {
        setLoadingItems(prev => ({ ...prev, PO: false }));
      }
    })();

    // 3. Fetch Raw Material TC (SR 8 in ERC) - ER only
    if (filteredDocs.some(d => d.key === 'RAW_MATERIAL_TC' && d.isAutoFetch)) {
      (async () => {
        setLoadingItems(prev => ({ ...prev, RAW_MATERIAL_TC: true }));
        try {
          const token = getAuthToken();
          const cleanCall = cNo.includes('-') ? cNo.substring(cNo.indexOf('-') + 1).trim() : cNo;
          const candidates = [
            cNo,
            cleanCall,
            call?.call_no,
            call?.callNumber,
            icNumber,
            call?.ic_number,
            call?.icNo
          ].filter(Boolean);

          const uniqueCandidates = Array.from(new Set(candidates));
          let foundTc = false;
          for (const cand of uniqueCandidates) {
            try {
              const tcRes = await axios.get(`${API_BASE_URL}/api/vendor/inspection-calls/tc-docs`, {
                params: { callNumber: cand },
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                responseType: 'blob'
              });
              if (tcRes.status === 200 && tcRes.data && tcRes.data.size > 0) {
                setSystemDocBlobs(prev => ({ ...prev, RAW_MATERIAL_TC: tcRes.data }));
                foundTc = true;
                break;
              }
            } catch (e) {
              // try next candidate
            }
          }
          if (!foundTc) {
            setFetchFailed(prev => ({ ...prev, RAW_MATERIAL_TC: true }));
          }
        } catch (tcErr) {
          console.warn('TC fetch error:', tcErr);
          setFetchFailed(prev => ({ ...prev, RAW_MATERIAL_TC: true }));
        } finally {
          setLoadingItems(prev => ({ ...prev, RAW_MATERIAL_TC: false }));
        }
      })();
    }

    // 4. Fetch Inspection Photo PDF (SR 12 in ERC - 6 pic on page)
    if (filteredDocs.some(d => d.key === 'PHOTO_PDF' && d.isAutoFetch)) {
      (async () => {
        setLoadingItems(prev => ({ ...prev, PHOTO_PDF: true }));
        try {
          const token = getAuthToken();
          let images = [];
          try {
            const res = await axios.get(`${API_BASE_URL}/api/images/call/${encodeURIComponent(cNo)}`, {
              params: { typeOfCall: 'ERC' },
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const dataObj = res?.data || res;
            images = Array.isArray(dataObj) ? dataObj : (dataObj?.responseData || dataObj?.images || []);
          } catch (fetchErr) {
            console.warn('Could not fetch inspection images:', fetchErr);
          }

          if (images && images.length > 0) {
            const formattedImages = images.map(img => {
              let url = img.preview || img.base64Data || img.url || img;
              if (typeof url === 'string' && url.startsWith('/api/')) {
                url = `${API_BASE_URL.replace(/\/api$/, '')}${url}`;
              } else if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('http')) {
                url = `${API_BASE_URL}${url}`;
              }
              return {
                ...img,
                url,
                caption: img.caption || img.label || 'Inspection Photo',
                timestamp: img.timestamp || img.createdAt || ''
              };
            });

            const photoBlob = await generateInspectionPhotosPDF(formattedImages, {
              ...call,
              callNumber: cNo,
              callNo: cNo,
              requestId: cNo,
              poNumber,
              vendorName
            });
            if (photoBlob) {
              setSystemDocBlobs(prev => ({ ...prev, PHOTO_PDF: photoBlob }));
            } else {
              setFetchFailed(prev => ({ ...prev, PHOTO_PDF: true }));
            }
          } else {
            setFetchFailed(prev => ({ ...prev, PHOTO_PDF: true }));
          }
        } catch (photoErr) {
          console.warn('Photo PDF generation error:', photoErr);
          setFetchFailed(prev => ({ ...prev, PHOTO_PDF: true }));
        } finally {
          setLoadingItems(prev => ({ ...prev, PHOTO_PDF: false }));
        }
      })();
    }

    // 5. Fetch IC - RM (SR 13 in ERC) - EP & EF stages
    if (filteredDocs.some(d => d.key === 'IC_RM' && d.isAutoFetch)) {
      (async () => {
        setLoadingItems(prev => ({ ...prev, IC_RM: true }));
        try {
          const rmCandidates = [
            call?.rm_ic_number,
            call?.rmIcNo,
            call?.rawMaterialIcNo,
            call?.raw_material_ic_no,
            call?.rmCallNo,
            call?.rm_call_no,
            call?.linkedRmCallNo
          ].filter(Boolean);

          let signedBlob = null;
          for (const cand of rmCandidates) {
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
            setSystemDocBlobs(prev => ({ ...prev, IC_RM: signedBlob }));
          } else {
            setFetchFailed(prev => ({ ...prev, IC_RM: true }));
          }
        } catch (rmErr) {
          console.warn('RM IC fetch error:', rmErr);
          setFetchFailed(prev => ({ ...prev, IC_RM: true }));
        } finally {
          setLoadingItems(prev => ({ ...prev, IC_RM: false }));
        }
      })();
    }

    // 6. Fetch IC - Process (SR 14 in ERC) - EF stage
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
          } else {
            setFetchFailed(prev => ({ ...prev, IC_PROCESS: true }));
          }
        } catch (procErr) {
          console.warn('Process IC fetch error:', procErr);
          setFetchFailed(prev => ({ ...prev, IC_PROCESS: true }));
        } finally {
          setLoadingItems(prev => ({ ...prev, IC_PROCESS: false }));
        }
      })();
    }

    // 7. Fetch & Compile Relevant Annexures (SR 15 in ERC) - ERC Auto-Fetch
    if (filteredDocs.some(d => d.key === 'ANNEXURES' && d.isAutoFetch)) {
      (async () => {
        setLoadingItems(prev => ({ ...prev, ANNEXURES: true }));
        try {
          // Step A: Determine applicable annexures for this stage
          let applicableAnnexures = [];
          if (currentStage === 'ER') {
            applicableAnnexures = ANNEXURE_LIST.filter(a => a.id === 'chemical-analysis' || a.id === 'dimensional-check');
          } else if (currentStage === 'EP') {
            applicableAnnexures = ANNEXURE_LIST.filter(a => a.id === 'process-inspection');
          } else {
            // EF Final
            applicableAnnexures = ANNEXURE_LIST.filter(a =>
              a.id === 'final-chemical-analysis' ||
              a.id === 'hardness-test' ||
              a.id === 'toe-load-test' ||
              a.id === 'weight-test' ||
              a.id === 'dimension-test' ||
              a.id === 'inclusion-rating' ||
              a.id === 'application-deflection'
            );
          }

          // Step B: Fetch data for each annexure
          const dataMap = {};
          for (const ann of applicableAnnexures) {
            const resData = await fetchSingleAnnexureData(ann.id, cNo);
            dataMap[ann.id] = resData;
          }
          setAnnexureDataMap(dataMap);

          // Step C: Render and capture annexures into a single PDF blob
          setTimeout(async () => {
            try {
              if (hiddenAnnexuresRef.current) {
                const annexurePdfBlob = await captureElementToPdfBlob(hiddenAnnexuresRef.current, {
                  orientation: 'landscape'
                });
                if (annexurePdfBlob && annexurePdfBlob.size > 0) {
                  setSystemDocBlobs(prev => ({ ...prev, ANNEXURES: annexurePdfBlob }));
                } else {
                  setFetchFailed(prev => ({ ...prev, ANNEXURES: true }));
                }
              } else {
                setFetchFailed(prev => ({ ...prev, ANNEXURES: true }));
              }
            } catch (renderErr) {
              console.warn('Error capturing annexure PDF:', renderErr);
              setFetchFailed(prev => ({ ...prev, ANNEXURES: true }));
            } finally {
              setLoadingItems(prev => ({ ...prev, ANNEXURES: false }));
            }
          }, 1000);

        } catch (annErr) {
          console.warn('Annexures compilation error:', annErr);
          setFetchFailed(prev => ({ ...prev, ANNEXURES: true }));
          setLoadingItems(prev => ({ ...prev, ANNEXURES: false }));
        }
      })();
    }

    // 8. Fetch IC (Inspection Certificate - SR 17 in ERC)
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
        } else {
          setFetchFailed(prev => ({ ...prev, IC: true }));
        }
      } catch (icErr) {
        console.warn('IC fetch error:', icErr);
        setFetchFailed(prev => ({ ...prev, IC: true }));
      } finally {
        setLoadingItems(prev => ({ ...prev, IC: false }));
      }
    })();

    setLoadingDocs(false);
  };

  // Handle individual user file upload
  const handleFileUpload = (docKey, file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage(`"${file.name}" is not a PDF. Only PDF files are allowed.`);
      return;
    }

    const maxMb = getMaxUploadSizeMb(docKey);
    const maxBytes = maxMb * 1024 * 1024;
    if (file.size > maxBytes) {
      const selectedMb = (file.size / (1024 * 1024)).toFixed(2);
      const docName = docList.find(d => d.key === docKey)?.name || docKey;
      setErrorMessage(`"${file.name}" exceeds maximum allowed file size of ${maxMb} MB for ${docName} (Selected file: ${selectedMb} MB).`);
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

  // Get sequence of documents based on orderDirection (bottom-to-top matches UI display 1..N)
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
      setSuccessMessage(`Successfully merged ${attachedCount} documents! Review the preview below.`);
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
      formData.append('moduleType', moduleType);
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

  // Get list of annexures to render in hidden container
  const getApplicableAnnexureList = () => {
    if (stage === 'ER') {
      return ANNEXURE_LIST.filter(a => a.id === 'chemical-analysis' || a.id === 'dimensional-check');
    } else if (stage === 'EP') {
      return ANNEXURE_LIST.filter(a => a.id === 'process-inspection');
    } else {
      return ANNEXURE_LIST.filter(a =>
        a.id === 'final-chemical-analysis' ||
        a.id === 'hardness-test' ||
        a.id === 'toe-load-test' ||
        a.id === 'weight-test' ||
        a.id === 'dimension-test' ||
        a.id === 'inclusion-rating' ||
        a.id === 'application-deflection'
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '96%',
        maxWidth: '1350px',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
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
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '0.5px'
              }}>
                {moduleType} • {stage}
              </span>
              <h2 style={{ fontSize: '19px', fontWeight: '700', margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PictureAsPdfRoundedIcon style={{ color: '#60a5fa', fontSize: '24px' }} />
                Upload/ Generate Inspection Call Documents
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
            <CloseRoundedIcon fontSize="small" />
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
                  Accepted format: PDF only. Max size: {moduleType === 'SLEEPER' ? '50 MB' : '20 MB'} for ITP/Annexure, 3 MB for other documents.
                </span>
              </div>
            </div>

            {/* TABLE */}
            <div style={{
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              maxHeight: '480px',
              overflowY: 'auto',
              opacity: savedCaseLetter ? 0.85 : 1
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
                  {[...docList].reverse().map((doc, index) => {
                    const available = isDocAvailable(doc);
                    const uploaded = uploadedFiles[doc.key];
                    const isLoadingThis = loadingItems[doc.key];
                    const isFetched = Boolean(systemDocBlobs[doc.key]);
                    const isFailed = Boolean(fetchFailed[doc.key]);
                    const maxMb = getMaxUploadSizeMb(doc.key);

                    // Show upload only if:
                    // 1. Not disabled
                    // 2. Not fetched by system
                    // 3. Not currently loading
                    // 4. User already uploaded OR it's a manual upload doc (!doc.isAutoFetch) OR auto-fetch failed
                    const canUpload = !doc.isDisabled && !isFetched && !isLoadingThis && (uploaded || !doc.isAutoFetch || isFailed);

                    return (
                      <tr
                        key={doc.key}
                        style={{
                          borderBottom: index !== docList.length - 1 ? '1px solid #f1f5f9' : 'none',
                          background: available ? '#f0fdf4' : (doc.isDisabled ? '#fafafa' : (index % 2 === 0 ? '#ffffff' : '#f8fafc')),
                          opacity: doc.isDisabled ? 0.75 : 1,
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
                            fontSize: '11px',
                            fontWeight: '700'
                          }}>
                            {index + 1}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                            <span>{doc.name}</span>
                            {doc.isMandatory && (
                              <span style={{ fontSize: '10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                Mandatory
                              </span>
                            )}
                            {doc.isDisabled && (
                              <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
                                To be Developed
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            {uploaded ? (
                              <span style={{ color: '#059669', fontWeight: '600' }}>
                                📁 {uploaded.name} ({(uploaded.size / (1024 * 1024)).toFixed(2)} MB)
                              </span>
                            ) : (
                              <span>
                                Final Source: {doc.finalSource} {doc.remarks && !doc.isDisabled ? `(${doc.remarks})` : ''}
                                {!doc.isDisabled && (
                                  <span style={{ marginLeft: '6px', color: '#94a3b8' }}>
                                    • Max {maxMb} MB
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#475569', fontSize: '12px' }}>
                          <span style={{
                            display: 'inline-block',
                            background: doc.isDisabled ? '#f1f5f9' : (doc.isSystem ? '#e0f2fe' : '#f1f5f9'),
                            color: doc.isDisabled ? '#94a3b8' : (doc.isSystem ? '#0369a1' : '#475569'),
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
                              <CircularProgress size={12} color="inherit" /> Fetching...
                            </span>
                          ) : available ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              background: '#dcfce7', color: '#166534',
                              padding: '3px 8px', borderRadius: '6px',
                              fontSize: '11px', fontWeight: '700'
                            }}>
                              <CheckCircleRoundedIcon style={{ fontSize: '14px' }} /> Available
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
                                <VisibilityRoundedIcon style={{ fontSize: '13px' }} /> View PDF
                              </button>
                            )}

                            {/* Disabled rows show To be Developed message */}
                            {doc.isDisabled ? (
                              <span style={{
                                fontSize: '11px',
                                color: '#94a3b8',
                                fontStyle: 'italic',
                                padding: '4px 8px',
                                background: '#f8fafc',
                                borderRadius: '4px',
                                border: '1px dashed #cbd5e1'
                              }}>
                                To be Developed
                              </span>
                            ) : isLoadingThis ? (
                              <span style={{
                                fontSize: '11px',
                                color: '#64748b',
                                fontStyle: 'italic',
                                padding: '4px 8px'
                              }}>
                                Fetching...
                              </span>
                            ) : isFetched ? (
                              /* Documents fetched from system should not provide a replace button */
                              null
                            ) : canUpload ? (
                              /* Active rows provide Upload / Replace / Remove functionality */
                              <>
                                <div>
                                  <input
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    disabled={merging || saving || Boolean(savedCaseLetter)}
                                    ref={el => (fileInputRefs.current[doc.key] = el)}
                                    style={{ display: 'none' }}
                                    onChange={e => handleFileUpload(doc.key, e.target.files?.[0])}
                                  />
                                  <button
                                    disabled={merging || saving || Boolean(savedCaseLetter)}
                                    onClick={() => !savedCaseLetter && !merging && !saving && fileInputRefs.current[doc.key]?.click()}
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
                                    title={savedCaseLetter ? 'Case Letter already saved. Delete current Case Letter to upload replacements.' : (uploaded ? `Replace PDF (Max ${maxMb} MB)` : `Upload PDF (Max ${maxMb} MB)`)}
                                  >
                                    <CloudUploadRoundedIcon style={{ fontSize: '13px' }} />
                                    {uploaded ? 'Replace' : 'Upload'}
                                  </button>
                                </div>

                                {/* Remove Upload Button */}
                                {uploaded && (
                                  <button
                                    disabled={merging || saving || Boolean(savedCaseLetter)}
                                    onClick={() => handleRemoveUploadedFile(doc.key)}
                                    style={{
                                      padding: '5px 8px',
                                      background: '#fee2e2',
                                      color: '#991b1b',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      cursor: merging || saving || savedCaseLetter ? 'not-allowed' : 'pointer',
                                      opacity: merging || saving || savedCaseLetter ? 0.4 : 1
                                    }}
                                    title={savedCaseLetter ? 'Case Letter already saved. Delete current Case Letter to modify documents.' : 'Remove uploaded document'}
                                  >
                                    <DeleteOutlineRoundedIcon style={{ fontSize: '13px' }} />
                                  </button>
                                )}
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
                      boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
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

          {/* RIGHT: MERGED PDF PREVIEWER */}
          {previewBlobUrl && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#f8fafc',
              height: '100%',
              minHeight: '500px'
            }}>
              <div style={{
                padding: '10px 16px',
                background: '#f1f5f9',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PictureAsPdfRoundedIcon style={{ fontSize: '16px', color: '#2563eb' }} />
                  Merged Case Letter Preview
                </span>
                <a
                  href={previewBlobUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '12px', color: '#2563eb', fontWeight: '600', textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  Full Screen <OpenInNewRoundedIcon style={{ fontSize: '14px' }} />
                </a>
              </div>
              <iframe
                src={previewBlobUrl}
                title="Merged Case Letter Preview"
                style={{ width: '100%', height: '520px', border: 'none', flex: 1 }}
              />
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div style={{
          padding: '14px 24px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            disabled={merging || saving}
            onClick={onClose}
            style={{
              padding: '8px 18px',
              background: '#ffffff',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: merging || saving ? 'not-allowed' : 'pointer',
              opacity: merging || saving ? 0.5 : 1
            }}
          >
            Cancel
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            {/* MERGE BUTTON */}
            <button
              onClick={handleMergePdfs}
              disabled={merging || loadingDocs || Boolean(savedCaseLetter)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '9px 20px',
                background: (merging || savedCaseLetter) ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: (merging || loadingDocs || savedCaseLetter) ? 'not-allowed' : 'pointer',
                boxShadow: (merging || savedCaseLetter) ? 'none' : '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
                opacity: savedCaseLetter ? 0.6 : (merging || loadingDocs ? 0.7 : 1)
              }}
              title={savedCaseLetter ? 'Case Letter already saved. Delete current Case Letter below to re-merge.' : 'Merge all available documents'}
            >
              <MergeTypeRoundedIcon style={{ fontSize: '18px' }} />
              {merging ? 'Merging Documents...' : (savedCaseLetter ? '🔒 Dossier Already Merged' : 'Merge & Preview')}
            </button>

            {/* SAVE BUTTON */}
            {previewBlobUrl && !savedCaseLetter && (
              <button
                onClick={() => setShowConfirmDialog(true)}
                disabled={saving || merging || loadingDocs}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '9px 22px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: saving || merging || loadingDocs ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
                  opacity: saving || merging || loadingDocs ? 0.7 : 1
                }}
              >
                <SaveRoundedIcon style={{ fontSize: '18px' }} />
                {saving ? 'Compressing & Saving...' : 'Save Case Letter'}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* SINGLE DOCUMENT PREVIEW MODAL */}
      {viewingDocUrl && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '30px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '16px',
            width: '90%', maxWidth: '1050px', height: '88vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{
              padding: '12px 20px', background: '#0f172a', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{ fontWeight: '700', fontSize: '14px' }}>{viewingDocTitle}</span>
              <button
                onClick={() => {
                  URL.revokeObjectURL(viewingDocUrl);
                  setViewingDocUrl(null);
                }}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <iframe
              src={viewingDocUrl}
              title={viewingDocTitle}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        </div>
      )}

      {/* ACKNOWLEDGEMENT / CONFIRMATION SAVE DIALOG */}
      {showConfirmDialog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10001, padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '16px',
            width: '100%', maxWidth: '460px',
            padding: '24px', textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              width: '52px', height: '52px', background: '#ecfdf5', color: '#059669',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '26px', margin: '0 auto 14px'
            }}>
              💾
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px' }}>
              {savedCaseLetter ? 'Confirm Update Case Letter' : 'Confirm Save Case Letter'}
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 20px', lineHeight: '1.5' }}>
              {savedCaseLetter ? (
                <>
                  An active Case Letter is already on record for Call <strong>{callNo}</strong>.
                  <br /><br />
                  Saving will merge the current documents into a <strong>new updated version</strong> and supersede the existing Case Letter.
                </>
              ) : (
                <>
                  Are you sure you want to save the final Case Letter for Call <strong>{callNo}</strong>?
                  <br /><br />
                  All available documents will be merged and saved as the official Case Letter dossier for this call.
                </>
              )}
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowConfirmDialog(false)}
                style={{
                  padding: '9px 18px', background: '#f1f5f9', color: '#475569',
                  border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                style={{
                  padding: '9px 22px', background: '#059669', color: '#ffffff',
                  border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.2)'
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

      {/* HIDDEN CONTAINER FOR RENDERING AND CAPTURING ANNEXURES */}
      <div
        ref={hiddenAnnexuresRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '1600px',
          background: '#ffffff',
          padding: '20px'
        }}
      >
        {getApplicableAnnexureList().map(ann => {
          const Comp = ann.component;
          const data = annexureDataMap[ann.id] || [];
          return (
            <div key={ann.id} style={{ pageBreakAfter: 'always', marginBottom: '40px' }}>
              <div style={{ padding: '10px 0', borderBottom: '2px solid #000', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', textTransform: 'uppercase' }}>{ann.title}</h3>
                <span style={{ fontSize: '12px', color: '#555' }}>Inspection Call: {callNo}</span>
              </div>
              <Comp
                inspectionData={call}
                callDetails={call}
                data={data}
                initialData={data}
                readOnly={true}
                hideActions={true}
              />
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default GenerateCaseLetterModal;
