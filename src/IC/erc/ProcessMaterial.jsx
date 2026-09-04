// src/IC/erc/ProcessMaterialCertificate.jsx

import React, { useRef, useState, useEffect } from "react";
import { 
    Button, 
    CircularProgress, 
    Snackbar, 
    Alert,
    Box,
    Tooltip
} from "@mui/material";
import { formatDate } from "../../utils/helpers";
import ErcProcessIc from "./ErcProcessIc";
import { exportToPdf } from "../../utils/exportUtils";
import { uploadSignedCertificate, saveProcessIcEditData, getProcessIcEditData, saveProcessIcSaveChanges, getProcessIcSaveChanges, validateBookSetNo } from "../../services/certificateService";
import { performTransitionAction } from "../../services/workflowService";
import { getCurrentUserId } from "../../services/workflowApiService";
import { getStoredUser } from "../../services/authService";
import reportService from "../../services/reportService";


export default function ProcessMaterialCertificate({ call = {}, onBack }) {
  const printAreaRef = useRef();
  const fileInputRef = useRef();
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [bookSetValidation, setBookSetValidation] = useState({ isValid: false, message: null, isValidating: false });
  const [bookWarningModal, setBookWarningModal] = useState({ show: false, onProceed: null });

  // Upload E-Signed IC Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedSignedFile, setSelectedSignedFile] = useState(null);
  const [isUploadingSigned, setIsUploadingSigned] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const handleCloseNotification = () => setNotification({ ...notification, open: false });

  const transformCallToIC = (c) => {
    if (!c || Object.keys(c).length === 0) return {};
    const certificateDate = formatDate(new Date().toISOString());

    const formatContractRef = (contractRef) => {
      if (!contractRef) return "";
      if (typeof contractRef === 'string' && contractRef.includes('RB L. No.') && contractRef.includes('Dt.')) return contractRef;
      if (Array.isArray(contractRef)) return contractRef.join('\n');
      if (typeof contractRef === 'string') {
        const datedMatch = contractRef.match(/(.+?)\s+dated\s+(.+)/i);
        if (datedMatch) return `RB L. No. ${datedMatch[1].trim()}, Dt. ${datedMatch[2].trim()}`;
        return contractRef;
      }
      return contractRef;
    };

    return {
      certificateNo: c.icNo || "",
      certificateDate: certificateDate,
      offeredInstNo: c.offeredInstNo || "",
      passedInstNo: c.passedInstNo || "",
      contractor: c.contractor || c.vendorName || c.vendor_name || "",
      manufacturer: c.manufacturer || "",
      placeOfInspection: c.placeOfInspection || "",
      contractRef: formatContractRef(c.contractRef) || "",
      poDetails: c.poDetails || c.contractorPo || c.poNo || c.po_no || "",
      billPayingOfficer: c.billPayingOfficer || c.billOfficer || "",
      consigneeRailway: c.consigneeRailway || c.consignee || "",
      consigneeManufacturer: c.consigneeManufacturer || c.consigneeFinished || "",
      purchasingAuthority: c.purchasingAuthority || "",
      description: c.description || c.productDescription || c.productType || "",
      ercType: c.ercType || c.productType || c.product_type || c.typeOfErc || "",
      uom: c.uom || c.unit || c.poUom || c.itemUom || c.poQtyUnit || "",
      drgNo: (() => {
        const ercType = c.ercType || c.productType || '';
        const drawingMap = { 'mk-iii': 'RT-3701', 'mk-v': 'T-5919', 'erc mk-iii': 'RT-3701', 'erc mk-v': 'T-5919' };
        return `${ercType} : ${drawingMap[ercType.toLowerCase()] || ercType}`;
      })(),
      specNo: c.specNo || "",
      qapNo: c.qapNo || "",
      inspectionType: c.inspectionType || "",
      chpClause: (!c.chpClause || c.chpClause === "Clause No. of QAP") 
        ? "process inspection as per PIO detailed under Annexure-A of Rly. Bd. Letter No. 2024/RS (G)/779/12 (E3482675) Dtd.06.01.2025" 
        : c.chpClause,
      lots: c.lots || [],
      reference: (() => {
        let refStr = c.reference ? c.reference.replace(/Mr\.?\s/gi, "") : "";
        if (c.ibsCaseNo && c.ibsCaseNo !== '-') {
          if (refStr) {
            refStr += `, (IBS Case No: ${c.ibsCaseNo})`;
          } else {
            refStr = `(IBS Case No: ${c.ibsCaseNo})`;
          }
        }
        return refStr;
      })(),
      callDate: c.callDate || c.dateOfCall || "",
      inspectionDate: c.inspectionDate || c.dateOfInspection || "",
      manDays: c.manDays || "",
      sealingPattern: c.sealingPattern || "NA",
      inspectingEngineer: c.inspectingEngineer ? c.inspectingEngineer.replace(/Mr\.?\s/gi, "") : ""
    };
  };

  useEffect(() => {
    const initializeData = async () => {
      if (call && Object.keys(call).length > 0) {
        let initialData = transformCallToIC(call);
        const icNumber = initialData.certificateNo || call.icNo || call.call_no;
        if (icNumber) {
          let savedEdit = await getProcessIcSaveChanges(icNumber);
          if (!savedEdit) {
            savedEdit = await getProcessIcEditData(icNumber);
          }
          if (savedEdit) {
            let restoredLots = initialData.lots;
            if (savedEdit.lotDetails) {
              try {
                const parsedLots = JSON.parse(savedEdit.lotDetails);
                if (Array.isArray(parsedLots) && parsedLots.length > 0) {
                  restoredLots = parsedLots;
                }
              } catch (e) {
                console.error("Failed to parse saved lot details", e);
              }
            }

            initialData = {
              ...initialData,
              qapNo: savedEdit.qapNo || initialData.qapNo,
              chpClause: savedEdit.chpClause || initialData.chpClause,
              inspectionDate: savedEdit.inspectionDate || initialData.inspectionDate,
              offeredInstNo: savedEdit.offeredInstallmentNo || initialData.offeredInstNo,
              passedInstNo: savedEdit.passedInstallmentNo || initialData.passedInstNo,
              consigneeRailway: savedEdit.consignee || initialData.consigneeRailway,
              contractRef: savedEdit.contractRef || initialData.contractRef,
              maNumberAndDate: savedEdit.maNumberAndDate || initialData.maNumberAndDate,
              bookNo: savedEdit.bookNo || initialData.bookNo,
              setNo: savedEdit.setNo || initialData.setNo,
              billPayingOfficer: savedEdit.billPayingOfficer || initialData.billPayingOfficer,
              purchasingAuthority: savedEdit.purchasingAuthority || initialData.purchasingAuthority,
              description: savedEdit.description || initialData.description,
              placeOfInspection: savedEdit.placeOfInspection || initialData.placeOfInspection,
              lots: restoredLots,
            };
          }
          
          try {
              const region = await reportService.getRegionByCallNo(icNumber);
              if (region && region.responseData) {
                  initialData.region = region.responseData;
              }
          } catch (e) {
              console.error("Failed to fetch region dynamically:", e);
              setNotification({ 
                  open: true, 
                  message: "Could not fetch region details. Defaulting to standard region.", 
                  severity: "warning" 
              });
          }
        }
        setEditableData(initialData);
      }
    };
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call]);

  const handleDataChange = (field, value) => {
    setEditableData((prev) => ({ ...prev, [field]: value }));
    if (field === 'bookNo' || field === 'setNo') {
      setBookSetValidation({ isValid: false, message: null, isValidating: false });
    }
  };
  const handleArrayDataChange = (arrayField, index, field, value) => {
    setEditableData((prev) => {
      const newArray = [...(prev[arrayField] || [])];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [arrayField]: newArray };
    });
  };
  const dataToPass = editableData || transformCallToIC(call);
  const hasBookAndSetNo = Boolean(
    dataToPass?.bookNo && 
    String(dataToPass.bookNo).trim() !== "" && 
    dataToPass?.setNo && 
    String(dataToPass.setNo).trim() !== ""
  );

  const executeSaveChanges = async () => {
    const setNo = dataToPass?.setNo || '';

    if (!setNo || !/^\d{3}$/.test(setNo)) {
      setNotification({ open: true, message: "Set No. must be exactly 3 digits.", severity: 'warning' });
      return;
    }

    try {
      setNotification({ open: true, message: "Saving draft changes...", severity: 'info' });
      await saveProcessIcSaveChanges({
          icNumber: dataToPass.certificateNo || call.icNo || call.call_no || "ProcessMaterial_IC",
          certificateId: null,
          bookNo: dataToPass.bookNo,
          setNo: dataToPass.setNo,
          offeredInstallmentNo: dataToPass.offeredInstNo,
          passedInstallmentNo: dataToPass.passedInstNo,
          consignee: dataToPass.consigneeRailway,
          contractRef: dataToPass.contractRef,
          maNumberAndDate: dataToPass.maNumberAndDate,
          billPayingOfficer: dataToPass.billPayingOfficer,
          purchasingAuthority: dataToPass.purchasingAuthority,
          description: dataToPass.description,
          manufacturer: dataToPass.manufacturer,
          qapNo: dataToPass.qapNo,
          chpClause: dataToPass.chpClause,
          inspectionDate: dataToPass.inspectionDate,
          manDays: dataToPass.manDays,
          lotDetails: JSON.stringify(dataToPass.lots || []),
          createdBy: getCurrentUserId()?.toString(),
          updatedBy: getCurrentUserId()?.toString()
      });
      setNotification({ open: true, message: "Changes saved successfully as draft!", severity: 'success' });
      setIsEditing(false);
    } catch (error) {
      console.error("Save Changes Error:", error);
      setNotification({ open: true, message: error.message || "Failed to save draft changes.", severity: 'error' });
    }
  };

  const handleSaveChanges = () => {
    const bookNo = dataToPass?.bookNo || '';
    const setNo = dataToPass?.setNo || '';

    if (!bookNo || !setNo) {
      setNotification({ open: true, message: "Please fill in both Book No. and Set No. before saving.", severity: 'warning' });
      return;
    }

    if (bookNo.trim().length < 4) {
      setBookWarningModal({
        show: true,
        onProceed: executeSaveChanges
      });
      return;
    }

    executeSaveChanges();
  };

  const executeVerifyBookSet = async () => {
    const bookNo = dataToPass?.bookNo || '';
    const setNo = dataToPass?.setNo || '';

    if (!/^\d{3}$/.test(setNo)) {
      setNotification({ open: true, message: "Set No. must be exactly 3 digits.", severity: 'warning' });
      return;
    }
    
    setBookSetValidation(prev => ({ ...prev, isValidating: true }));
    try {
      const empNo = getStoredUser()?.employeeCode || "UNKNOWN";
      const result = await validateBookSetNo(empNo, bookNo, setNo, "S");
      
      if (result.resultFlag === 1) {
        setBookSetValidation({ isValid: true, message: null, isValidating: false });
        setNotification({ open: true, message: "Book No. and Set No. are valid.", severity: 'success' });
      } else {
        setBookSetValidation({ isValid: false, message: result.message, isValidating: false });
        setNotification({ open: true, message: result.message || "Invalid Book/Set No.", severity: 'error' });
        // Clear invalid values
        setEditableData(prev => ({ ...prev, bookNo: '', setNo: '' }));
      }
    } catch (error) {
      setBookSetValidation({ isValid: false, message: "Verification failed.", isValidating: false });
      setNotification({ open: true, message: "Error verifying Book/Set No: " + error.message, severity: 'error' });
      // Clear invalid values on error too
      setEditableData(prev => ({ ...prev, bookNo: '', setNo: '' }));
    }
  };

  const handleVerifyBookSet = () => {
    const bookNo = dataToPass?.bookNo || '';
    const setNo = dataToPass?.setNo || '';

    if (!bookNo || !setNo) {
      setNotification({ open: true, message: "Please fill in both Book No. and Set No. before verifying.", severity: 'warning' });
      return;
    }

    if (!/^\d{3}$/.test(setNo)) {
      setNotification({ open: true, message: "Set No. must be exactly 3 digits.", severity: 'warning' });
      return;
    }

    if (bookNo.trim().length < 4) {
      setBookWarningModal({
        show: true,
        onProceed: executeVerifyBookSet
      });
      return;
    }

    executeVerifyBookSet();
  };

  const handleOpenUploadModal = () => {
    const bookNo = dataToPass?.bookNo || '';
    const setNo = dataToPass?.setNo || '';

    if (!bookNo || !setNo) {
      setNotification({ open: true, message: "Please fill in both Book No. and Set No. before uploading signed IC.", severity: 'warning' });
      return;
    }

    if (!/^\d{3}$/.test(setNo)) {
      setNotification({ open: true, message: "Set No. must be exactly 3 digits.", severity: 'warning' });
      return;
    }

    if (bookNo.trim().length < 4) {
      setBookWarningModal({
        show: true,
        onProceed: () => setShowUploadModal(true)
      });
      return;
    }

    setShowUploadModal(true);
  };

  const handleExport = async () => {
    if (!printAreaRef.current) return;
    if (isEditing) {
      setIsEditing(false);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    const sanitizedFilename = (dataToPass.certificateNo || "ProcessMaterialIC").replace(/[/\\?%*:|"<>]/g, '-');
    await exportToPdf(printAreaRef.current, `${sanitizedFilename}.pdf`);
  };

  /**
   * Download the generated IC PDF so the IE can sign it externally
   */
  const handleDownloadForSigning = async () => {
    if (!printAreaRef.current) return;
    try {
      const sanitizedFilename = (dataToPass.certificateNo || "ProcessMaterialIC").replace(/[/\\?%*:|"<>]/g, '-');
      await exportToPdf(printAreaRef.current, `${sanitizedFilename}_unsigned.pdf`);
      setNotification({ open: true, message: "IC downloaded. Please sign with your digital signature and upload below.", severity: "info" });
    } catch (err) {
      console.error("PDF generation error:", err);
      setNotification({ open: true, message: "Failed to download PDF for signing.", severity: "error" });
    }
  };

  /**
   * Handle File Selection for E-Signed IC
   */
  const handleSignedFileSelect = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Only PDF files (.pdf) are supported.");
      setSelectedSignedFile(null);
      return;
    }
    if (file.size === 0) {
      setUploadError("Selected file is empty.");
      setSelectedSignedFile(null);
      return;
    }
    if (file.size > 25 * 1024 * 1024) { // 25MB max
      setUploadError("File size exceeds 25MB limit.");
      setSelectedSignedFile(null);
      return;
    }
    setUploadError(null);
    setSelectedSignedFile(file);
  };

  /**
   * Finalize and Upload the E-Signed IC
   * Sequence:
   * 1. Save in IC Edit (POST /api/process-ic-edit)
   * 2. Storage of IC (POST /api/certificate-storage/upload)
   * 3. Workflow Transition (POST /api/workflow/transition)
   */
  const handleFinalizeSignedIC = async () => {
    if (!selectedSignedFile) {
      setUploadError("Please select a signed PDF file before submitting.");
      return;
    }

    if (!dataToPass?.bookNo || !dataToPass?.setNo) {
      setUploadError("Please ensure both Book No. and Set No. are filled before finalizing.");
      return;
    }

    setIsUploadingSigned(true);
    setUploadError(null);

    try {
      const icNumber = dataToPass.certificateNo || call.icNo || call.call_no || "ProcessMaterial_IC";
      const fileName = icNumber + ".pdf";

      // 1. First: Save in IC Edit (POST /api/process-ic-edit)
      setNotification({ open: true, message: "Saving IC details to database...", severity: "info" });
      await saveProcessIcEditData({
          icNumber: icNumber,
          certificateId: null,
          bookNo: dataToPass.bookNo,
          setNo: dataToPass.setNo,
          offeredInstallmentNo: dataToPass.offeredInstNo,
          passedInstallmentNo: dataToPass.passedInstNo,
          consignee: dataToPass.consigneeRailway,
          contractRef: dataToPass.contractRef,
          maNumberAndDate: dataToPass.maNumberAndDate,
          billPayingOfficer: dataToPass.billPayingOfficer,
          purchasingAuthority: dataToPass.purchasingAuthority,
          description: dataToPass.description,
          manufacturer: dataToPass.manufacturer,
          qapNo: dataToPass.qapNo,
          chpClause: dataToPass.chpClause,
          inspectionDate: dataToPass.inspectionDate,
          manDays: dataToPass.manDays,
          lotDetails: JSON.stringify(dataToPass.lots || []),
          createdBy: getCurrentUserId()?.toString(),
          updatedBy: getCurrentUserId()?.toString()
      });

      // Convert file to base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(selectedSignedFile);
      });

      // Extract raw base64 string if prefixed with data URI
      const cleanBase64 = typeof base64Data === 'string' && base64Data.includes(',') 
        ? base64Data.split(',')[1] 
        : base64Data;

      // 2. Second: Storage of IC (POST /api/certificate-storage/upload)
      setNotification({ open: true, message: "Uploading final e-signed certificate to Azure Storage...", severity: "info" });

      await uploadSignedCertificate({
        icNumber: icNumber,
        signedData: cleanBase64,
        fileName: fileName,
        uploadedBy: getStoredUser()?.name || "Inspecting Engineer"
      });

      setNotification({ open: true, message: "E-signed certificate successfully saved!", severity: "success" });

      // 3. Third: Workflow Transaction (POST /api/workflow/transition)
      try {
        console.log('🔄 Calling performTransitionAction to update status to DSC_SIGN_IC');
        await performTransitionAction({
          workflowTransitionId: call?.id || call?.transitionId,
          requestId: typeof call?.call_no === 'string' && call.call_no.includes('/') ? call.call_no.split('/')[1] : call?.call_no,
          action: 'DSC_SIGN_IC',
          remarks: 'E-signed Process IC uploaded and stored in Azure',
          actionBy: getCurrentUserId()
        });

        console.log('✅ Workflow status updated. Redirecting to Completed Calls Tab.');
        sessionStorage.setItem('ie_landing_active_tab', 'completed');
        setShowUploadModal(false);
        
        window.location.href = '/';
      } catch (workflowErr) {
        console.error('⚠️ Failed to update workflow status to DSC_SIGN_IC:', workflowErr);
        setNotification({ open: true, message: "Certificate saved, but workflow transition failed: " + workflowErr.message, severity: "error" });
      }

    } catch (error) {
      console.error("Upload E-Signed IC Error:", error);
      setUploadError(error.message || "Failed to upload e-signed certificate.");
      setNotification({ open: true, message: error.message || "Failed to upload e-signed certificate.", severity: 'error' });
    } finally {
      setIsUploadingSigned(false);
    }
  };

  const handleCancelChanges = async () => {
    setIsEditing(false);
    let initialData = transformCallToIC(call);
    const icNumber = initialData.certificateNo || call.icNo || call.call_no;
    if (icNumber) {
      let savedEdit = await getProcessIcSaveChanges(icNumber);
      if (!savedEdit) {
        savedEdit = await getProcessIcEditData(icNumber);
      }
      if (savedEdit) {
        let restoredLots = initialData.lots;
        if (savedEdit.lotDetails) {
          try {
            const parsedLots = JSON.parse(savedEdit.lotDetails);
            if (Array.isArray(parsedLots) && parsedLots.length > 0) {
              restoredLots = parsedLots;
            }
          } catch (e) {
            console.error("Failed to parse saved lot details", e);
          }
        }

        initialData = {
          ...initialData,
          qapNo: savedEdit.qapNo || initialData.qapNo,
          chpClause: savedEdit.chpClause || initialData.chpClause,
          inspectionDate: savedEdit.inspectionDate || initialData.inspectionDate,
          offeredInstNo: savedEdit.offeredInstallmentNo || initialData.offeredInstNo,
          passedInstNo: savedEdit.passedInstallmentNo || initialData.passedInstNo,
          consigneeRailway: savedEdit.consignee || initialData.consigneeRailway,
          contractRef: savedEdit.contractRef || initialData.contractRef,
          maNumberAndDate: savedEdit.maNumberAndDate || initialData.maNumberAndDate,
          bookNo: savedEdit.bookNo || initialData.bookNo,
          setNo: savedEdit.setNo || initialData.setNo,
          billPayingOfficer: savedEdit.billPayingOfficer || initialData.billPayingOfficer,
          purchasingAuthority: savedEdit.purchasingAuthority || initialData.purchasingAuthority,
          description: savedEdit.description || initialData.description,
          lots: restoredLots,
        };
      }
    }
    setEditableData(initialData);
    setNotification({ open: true, message: "Edited changes cancelled.", severity: 'info' });
  };

  return (
    <Box sx={{ padding: 3 }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <Button
          variant="outlined"
          onClick={onBack}
          sx={{
            backgroundColor: '#ffffff',
            color: '#334155',
            borderColor: '#cbd5e1',
            fontWeight: 700,
            fontSize: '0.8125rem',
            px: 2.5,
            py: 0.75,
            borderRadius: '6px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#f8fafc',
              borderColor: '#94a3b8',
              color: '#0f172a',
            }
          }}
        >
          ← Back
        </Button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button
            variant="outlined" 
            color="primary" 
            size="small" 
            onClick={isEditing ? handleSaveChanges : () => setIsEditing(true)}
            disabled={isUploadingSigned}
          >
            {isEditing ? "Save Changes" : "Edit Certificate"}
          </Button>
          {isEditing && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleCancelChanges}
              disabled={isUploadingSigned}
            >
              Cancel Changes
            </Button>
          )}
          <Tooltip title={!hasBookAndSetNo ? "Please enter Book No. and Set No. before uploading signed IC" : ""}>
            <span>
              <Button
                variant="contained"
                color="secondary"
                size="small"
                onClick={handleOpenUploadModal}
                disabled={isEditing || isUploadingSigned || !hasBookAndSetNo}
                sx={{ 
                  backgroundColor: '#6366f1', 
                  fontWeight: 700, 
                  px: 2,
                  '&:hover': { backgroundColor: '#4f46e5' } 
                }}
              >
                📤 Upload Signed IC
              </Button>
            </span>
          </Tooltip>
          <Button 
            variant="outlined" 
            color="primary" 
            size="small" 
            onClick={handleExport} 
            disabled={isEditing || isUploadingSigned}
          >
            Export PDF
          </Button>
        </div>
      </div>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} variant="filled">
          {notification.message}
        </Alert>
      </Snackbar>

      <div className="certificate-print-wrapper" ref={printAreaRef}>
        <div className="certificate-page">
          <ErcProcessIc 
            data={dataToPass} 
            isEditing={isEditing} 
            isBusy={isUploadingSigned} 
            onChange={handleDataChange} 
            onArrayChange={handleArrayDataChange}
            onVerifyBookSet={handleVerifyBookSet}
            bookSetValidation={bookSetValidation}
          />
        </div>
      </div>

      {/* Book Number Warning & Acknowledgment Modal */}
      {bookWarningModal.show && (
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
          zIndex: 100000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '28px 32px',
            maxWidth: '460px',
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            textAlign: 'center',
            border: '1px solid #fef08a'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fefce8',
              border: '2px solid #fef08a',
              color: '#ca8a04',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 16px'
            }}>
              ⚠️
            </div>
            
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#854d0e', marginBottom: '8px' }}>
              Book Number Notice
            </h3>
            
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5', marginBottom: '24px', fontWeight: '500' }}>
              Book Number is generally of 4 characters. Please ensure that the correct Book Number has been entered.
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setBookWarningModal({ show: false, onProceed: null })}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: '700',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Check Again
              </button>
              
              <button
                onClick={() => {
                  const proceedFn = bookWarningModal.onProceed;
                  setBookWarningModal({ show: false, onProceed: null });
                  if (proceedFn) proceedFn();
                }}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
                  transition: 'all 0.2s'
                }}
              >
                Acknowledge &amp; Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload E-Signed IC Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '16px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '560px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📤</span> Upload E-Signed Process IC
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  IC No: <strong style={{ color: '#38bdf8' }}>{dataToPass?.certificateNo || call?.icNo || call?.call_no || "Process IC"}</strong>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedSignedFile(null);
                  setUploadError(null);
                }}
                disabled={isUploadingSigned}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '18px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Step 1: Download IC for Signing */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: '800',
                    flexShrink: 0
                  }}>
                    1
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                      Download Process IC
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#64748b' }}>
                      Download current IC with updated Book &amp; Set No. to apply your digital signature.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadForSigning}
                  disabled={isUploadingSigned}
                  style={{
                    padding: '8px 14px',
                    background: '#ffffff',
                    border: '1px solid #0284c7',
                    color: '#0284c7',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>⬇️</span> Download PDF
                </button>
              </div>

              {/* Step 2: Upload Signed IC */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#f0fdf4',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: '800',
                    flexShrink: 0
                  }}>
                    2
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                      Upload Signed IC Document
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#64748b' }}>
                      Select or drop the signed PDF file. Only the signed file will be saved as the final IC.
                    </p>
                  </div>
                </div>

                {/* Dropzone */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleSignedFileSelect(e.target.files[0]);
                    }
                  }}
                />

                <div
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleSignedFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  style={{
                    border: isDraggingFile ? '2px dashed #2563eb' : '2px dashed #cbd5e1',
                    background: isDraggingFile ? '#eff6ff' : '#f8fafc',
                    borderRadius: '12px',
                    padding: '28px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
                  <p style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: '#1e293b' }}>
                    Click to browse or drag &amp; drop signed PDF here
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#94a3b8' }}>
                    Supports PDF format only (Max 25MB)
                  </p>
                </div>

                {/* File Preview Box if File Selected */}
                {selectedSignedFile && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px 16px',
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <span style={{ fontSize: '20px' }}>✅</span>
                      <div style={{ overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#15803d', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {selectedSignedFile.name}
                        </p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#166534' }}>
                          {(selectedSignedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSignedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      disabled={isUploadingSigned}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#dc2626',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: '4px 8px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Error Box */}
                {uploadError && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px 14px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#b91c1c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>⚠️</span> {uploadError}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedSignedFile(null);
                  setUploadError(null);
                }}
                disabled={isUploadingSigned}
                style={{
                  padding: '10px 18px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleFinalizeSignedIC}
                disabled={!selectedSignedFile || isUploadingSigned}
                style={{
                  padding: '10px 22px',
                  background: !selectedSignedFile || isUploadingSigned ? '#94a3b8' : '#16a34a',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '13.5px',
                  cursor: !selectedSignedFile || isUploadingSigned ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: !selectedSignedFile || isUploadingSigned ? 'none' : '0 4px 12px rgba(22, 163, 74, 0.35)',
                  transition: 'all 0.2s'
                }}
              >
                {isUploadingSigned ? (
                  <>
                    <CircularProgress size={18} color="inherit" />
                    <span>Uploading &amp; Finalizing...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Upload &amp; Finalize IC</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
}
