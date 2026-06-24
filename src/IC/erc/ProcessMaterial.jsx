// src/IC/erc/ProcessMaterialCertificate.jsx

import React, { useRef, useState, useEffect } from "react";
import { 
    Button, 
    CircularProgress, 
    Snackbar, 
    Alert,
    Box
} from "@mui/material";
import { formatDate } from "../../utils/helpers";
import ErcProcessIc from "./ErcProcessIc";
import { exportToPdf, generatePdfBase64 } from "../../utils/exportUtils";
import { uploadSignedCertificate, saveProcessIcEditData, getProcessIcEditData, saveProcessIcSaveChanges, getProcessIcSaveChanges, validateBookSetNo } from "../../services/certificateService";
import { performTransitionAction } from "../../services/workflowService";
import { getCurrentUserId } from "../../services/workflowApiService";
import { getStoredUser } from "../../services/authService";

export default function ProcessMaterialCertificate({ call = {}, onBack }) {
  const printAreaRef = useRef();
  const [isEditing, setIsEditing] = useState(false);
  const [isESigning, setIsESigning] = useState(false);
  const [editableData, setEditableData] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [bookSetValidation, setBookSetValidation] = useState({ isValid: false, message: null, isValidating: false });

  // Removed pki-status event listener as we no longer use DSC e-sign for Process IC

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
      contractRef: formatContractRef(c.contractRef) || "",
      poDetails: c.poDetails || c.contractorPo || c.poNo || c.po_no || "",
      billPayingOfficer: c.billPayingOfficer || c.billOfficer || "",
      consigneeRailway: c.consigneeRailway || c.consignee || "",
      consigneeManufacturer: c.consigneeManufacturer || c.consigneeFinished || "",
      purchasingAuthority: c.purchasingAuthority || "",
      description: c.description || c.productDescription || c.productType || "",
      drgNo: (() => {
        const ercType = c.ercType || c.productType || '';
        const drawingMap = { 'mk-iii': 'RT-3701', 'mk-v': 'T-5919', 'erc mk-iii': 'RT-3701', 'erc mk-v': 'T-5919' };
        return `${ercType} : ${drawingMap[ercType.toLowerCase()] || ercType}`;
      })(),
      specNo: c.specNo || "",
      qapNo: c.qapNo || "",
      inspectionType: c.inspectionType || "",
      chpClause: c.chpClause || "",
      lots: c.lots || [],
      reference: c.reference || "",
      callDate: c.callDate || c.dateOfCall || "",
      inspectionDate: c.inspectionDate || c.dateOfInspection || "",
      manDays: c.manDays || "",
      sealingPattern: c.sealingPattern || "",
      inspectingEngineer: c.inspectingEngineer || ""
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
            initialData = {
              ...initialData,
              bookNo: savedEdit.bookNo || initialData.bookNo,
              setNo: savedEdit.setNo || initialData.setNo,
              offeredInstNo: savedEdit.offeredInstallmentNo || initialData.offeredInstNo,
              passedInstNo: savedEdit.passedInstallmentNo || initialData.passedInstNo,
              consigneeRailway: savedEdit.consignee || initialData.consigneeRailway,
              contractRef: savedEdit.contractRef || initialData.contractRef,
              maNumberAndDate: savedEdit.maNumberAndDate || initialData.maNumberAndDate,
              billPayingOfficer: savedEdit.billPayingOfficer || initialData.billPayingOfficer,
              purchasingAuthority: savedEdit.purchasingAuthority || initialData.purchasingAuthority,
              description: savedEdit.description || initialData.description,
              qapNo: savedEdit.qapNo || initialData.qapNo,
            };
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
  const handleSaveChanges = async () => {
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
          qapNo: dataToPass.qapNo,
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

  const dataToPass = editableData || transformCallToIC(call);

  const handleVerifyBookSet = async () => {
    if (!dataToPass.bookNo || !dataToPass.setNo) {
      setNotification({ open: true, message: "Please fill in both Book No. and Set No. before verifying.", severity: 'warning' });
      return;
    }
    
    setBookSetValidation(prev => ({ ...prev, isValidating: true }));
    try {
      const empNo = getStoredUser()?.employeeCode || "UNKNOWN";
      const result = await validateBookSetNo(empNo, dataToPass.bookNo, dataToPass.setNo, "S");
      
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

  const handleExport = async () => {
    if (!printAreaRef.current) return;
    const sanitizedFilename = (dataToPass.certificateNo || "ProcessMaterialIC").replace(/[/\\?%*:|"<>]/g, '-');
    await exportToPdf(printAreaRef.current, `${sanitizedFilename}.pdf`);
  };

  const handleSaveIC = async () => {
    try {
      setIsESigning(true);
      
      // 1. Mandatory Validations
      if (!dataToPass.bookNo || !dataToPass.setNo) {
          setNotification({ open: true, message: "Please fill in the 'Book No.' and 'Set No.' before saving.", severity: 'warning' });
          setIsESigning(false);
          return;
      }
      
      // if (!bookSetValidation.isValid) {
      //     console.warn("⚠️ Validation failed: Book No or Set No has not been verified.");
      //     setNotification({ open: true, message: "Please Verify the Book No. and Set No. before saving.", severity: 'warning' });
      //     setIsESigning(false);
      //     return;
      // }

      setNotification({ open: true, message: "Saving edited data...", severity: 'info' });
      // 2. Save Edited Data to DB
      await saveProcessIcEditData({
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
          qapNo: dataToPass.qapNo,
          createdBy: getCurrentUserId()?.toString(),
          updatedBy: getCurrentUserId()?.toString()
      });

      // 3. Generate PDF Snapshot from Frontend (Bypasses PE-02 Backend parsing issues)
      const base64Pdf = await generatePdfBase64(printAreaRef.current);

      if (!base64Pdf || !base64Pdf.startsWith("JVBER")) {
          throw new Error("Failed to generate PDF snapshot from UI.");
      }

      // 4. Upload the generated PDF directly to Azure without DSC signing
      const icNumber = dataToPass.certificateNo || call.icNo || call.call_no || "ProcessMaterial_IC";
      const fileName = icNumber + ".pdf";
      
      setNotification({ open: true, message: "Uploading certificate to Azure...", severity: "info" });
      await uploadSignedCertificate({
          icNumber: icNumber,
          signedData: base64Pdf, // uploading the unsigned base64 PDF
          fileName: fileName,
          uploadedBy: "Inspecting Engineer"
      });
      setNotification({ open: true, message: "Certificate successfully saved to Azure!", severity: "success" });
      
      // 5. Update workflow status
      try {
          console.log('🔄 Calling performTransitionAction to update status to DSC_SIGN_IC');
          await performTransitionAction({
              workflowTransitionId: call?.id || call?.transitionId,
              requestId: typeof call?.call_no === 'string' && call.call_no.includes('/') ? call.call_no.split('/')[1] : call?.call_no,
              action: 'DSC_SIGN_IC',
              remarks: 'Process IC saved and stored in Azure',
              actionBy: getCurrentUserId()
          });

          console.log('✅ Workflow status updated. Redirecting to Completed Calls Tab.');
          sessionStorage.setItem('ie_landing_active_tab', 'completed');
          
          window.location.href = '/';
      } catch (workflowErr) {
          console.error('⚠️ Failed to update workflow status to DSC_SIGN_IC:', workflowErr);
          setNotification({ open: true, message: "Saved successfully, but workflow transition failed: " + workflowErr.message, severity: "error" });
      }

    } catch (error) {
        console.error("Saving Error:", error);
        setNotification({ open: true, message: error.message || "Failed to save document.", severity: 'error' });
    } finally {
        setIsESigning(false);
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={onBack} className="btn btn-outline">← Back</button>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant="outlined" 
            color="primary" 
            size="small" 
            onClick={isEditing ? handleSaveChanges : () => setIsEditing(true)}
            disabled={isESigning}
          >
            {isEditing ? "Save Changes" : "Edit Certificate"}
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            size="small" 
            onClick={handleSaveIC} 
            disabled={isESigning}
            startIcon={isESigning ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isESigning ? "SAVING..." : "💾 SAVE IC"}
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            size="small" 
            onClick={handleExport} 
            disabled={isESigning}
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
            isBusy={isESigning} 
            onChange={handleDataChange} 
            onArrayChange={handleArrayDataChange}
            onVerifyBookSet={handleVerifyBookSet}
            bookSetValidation={bookSetValidation}
          />
        </div>
      </div>
    </Box>
  );
}
