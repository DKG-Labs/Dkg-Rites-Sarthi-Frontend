// src/IC/erc/RawMaterialCertificate.jsx

import React, { useRef, useState, useEffect } from "react";
import { 
    Button, 
    CircularProgress,
    Snackbar,
    Alert,
    Box
} from "@mui/material";
import { exportToPdf, generatePdfBase64 } from "../../utils/exportUtils";
import { uploadSignedCertificate, saveRmIcEditData, getRmIcEditData, validateBookSetNo } from "../../services/certificateService";
import { performTransitionAction } from "../../services/workflowService";
import { getCurrentUserId } from "../../services/workflowApiService";
import { getStoredUser } from "../../services/authService";
import ErcRmIC from "./ErcRmIc";
import { fetchPoDataForSections } from "../../services/poDataService";

export default function RawMaterialCertificate({ call = {}, onBack }) {
  const printAreaRef = useRef();
  const [poDetails, setPoDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isESigning, setIsESigning] = useState(false);
  const [editableData, setEditableData] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [bookSetValidation, setBookSetValidation] = useState({ isValid: false, message: null, isValidating: false });

  useEffect(() => {
    if (call?.po_no && call?.call_no) {
      // Remove spaces around slashes for the API call (e.g., "SCR / 123" -> "SCR/123")
      const cleanPoNo = typeof call.po_no === 'string' ? call.po_no.replace(/\s*\/\s*/g, '/') : call.po_no;
      fetchPoDataForSections(cleanPoNo, call.call_no)
        .then(res => setPoDetails(res))
        .catch(err => console.error("Failed to load PO Details:", err));
    }
  }, [call?.po_no, call?.call_no]);

  useEffect(() => {
    const handlePkiStatus = async (event) => {
      const { status, message, signedData, certificateNo, fileName } = event.detail;
      setNotification({ open: true, message, severity: status });
      
      if (status === 'success' && signedData) {
          try {
              setNotification({ open: true, message: "Uploading signed certificate to Azure...", severity: "info" });
              await uploadSignedCertificate({
                  icNumber: certificateNo,
                  signedData: signedData,
                  fileName: fileName,
                  uploadedBy: "Inspecting Engineer"
              });
              setNotification({ open: true, message: "Signed certificate successfully saved to Azure!", severity: "success" });
              
              try {
                  console.log('🔄 Calling performTransitionAction to update status to DSC_SIGN_IC');
                      await performTransitionAction({
                          workflowTransitionId: call?.id || call?.transitionId,
                          requestId: typeof call?.call_no === 'string' && call.call_no.includes('/') ? call.call_no.split('/')[1] : call?.call_no,
                          action: 'DSC_SIGN_IC',
                          remarks: 'Digital signature applied and IC stored in Azure',
                          actionBy: getCurrentUserId()
                      });
                      
                      console.log('✅ Workflow status updated. Redirecting to Completed Calls Tab.');
                      sessionStorage.setItem('ie_landing_active_tab', 'completed');
                      
                      // Using window.location to trigger a navigation to the landing page
                      window.location.href = '/';
              } catch (workflowErr) {
                  console.error('⚠️ Failed to update workflow status to DSC_SIGN_IC:', workflowErr);
              }
          } catch (err) {
              console.error("Upload error:", err);
              setNotification({ open: true, message: "Signed successfully, but failed to save to Azure. " + err.message, severity: "error" });
          }
      }
    };
    window.addEventListener('pki-status', handlePkiStatus);
    return () => window.removeEventListener('pki-status', handlePkiStatus);
  }, [call?.call_no, call?.id, call?.transitionId]);

  const handleCloseNotification = () => setNotification({ ...notification, open: false });

  const transformCallToIC = (c, po) => {
    if (!c || Object.keys(c).length === 0) return {};
    let updatedContractRef = c.contractRef || "";
    if (po && po.rlyShortName && po.poSerialNo) {
      const datePart = updatedContractRef.includes("dated") ? updatedContractRef.split("dated")[1].trim() : po.poDate || "";
      const basePoString = po.poSerialNo.includes(po.poNo) ? `${po.rlyShortName} / ${po.poSerialNo}` : `${po.rlyShortName} / ${po.poNo} / ${po.poSerialNo}`;
      updatedContractRef = datePart ? `${basePoString} dated ${datePart}` : basePoString;
    }

    const vendorName = c.contractor || c.vendorName || c.vendor_name || "";
    const inspPlace = po?.placeOfInspection || po?.inspPlace || c.placeOfInspection || "";
    // Always use place of inspection as default (overrides old stored vendor name for old ICs too)
    const storedConsigneeManuf = c.consigneeManufacturer || c.consigneeFinished || "";
    const consigneeManufacturerDefault = inspPlace || storedConsigneeManuf;

    return {
      certificateNo: c.certificateNo || c.icNo || "",
      certificateDate: c.certificateDate || "",
      offeredInstNo: c.offeredInstNo || "",
      passedInstNo: c.passedInstNo || "",
      contractor: vendorName,
      manufacturer: c.manufacturer || "",
      placeOfInspection: inspPlace,
      contractRef: updatedContractRef,
      contractorPo: c.contractorPo || c.poNo || c.po_no || "",
      billPayingOfficer: c.billPayingOfficer || c.billOfficer || "",
      consigneeRailway: c.consigneeRailway || c.consignee || "",
      purchasingAuthority: c.purchasingAuthority || "",
      consigneeManufacturer: consigneeManufacturerDefault,
      description: c.description || c.productDescription || "",
      drgNo: c.drgNo || "",
      specNo: c.specNo || "",
      qapNo: c.qapNo || "",
      inspectionType: c.inspectionType || "",
      inspectionDetails: c.inspectionDetails || "",
      chpClause: c.chpClause || "",
      contractChpReq: c.contractChpReq || "",
      result: c.result || "",
      clearedQty: (() => {
        if (c.heatDetails && Array.isArray(c.heatDetails) && c.heatDetails.length > 0) {
          let totalMt = 0;
          const lines = c.heatDetails.filter(h => ["ACCEPTED", "PARTIALLY_ACCEPTED"].includes(h.status)).map(h => {
              const val = parseFloat(h.weightAcceptedMt || 0);
              totalMt += val;
              return `Heat no -${h.heatNo}- Qty ${val.toFixed(3)} MT`;
          });
          return lines.length > 0 ? `${lines.join(",\n")},\nTotal Qty -${totalMt.toFixed(3)} MT` : "";
        }
        return c.clearedQty || "";
      })(),
      qtyRejected: (() => {
        if (c.heatDetails && Array.isArray(c.heatDetails) && c.heatDetails.length > 0) {
          let totalMt = 0;
          const lines = c.heatDetails.filter(h => ["REJECTED", "PARTIALLY_ACCEPTED"].includes(h.status)).map(h => {
              const val = parseFloat(h.weightRejectedMt || 0);
              totalMt += val;
              return `Heat no -${h.heatNo}- Qty ${val.toFixed(3)} MT`;
          });
          return lines.length > 0 ? `${lines.join(",\n")},\nTotal Qty -${totalMt.toFixed(3)} MT` : "Nil";
        }
        return c.qtyRejected || "Nil";
      })(),
      remarks: c.remarks || "",
      callDate: c.dateOfCall || "",
      visitsNo: c.noOfVisits || "",
      inspectionDate: c.dateOfInspection || "",
      sealingPattern: c.sealingPattern || "",
      sealFacsimile: c.sealFacsimile || c.facsimile || "",
      inspectingEngineer: c.inspectingEngineer || ""
    };
  };

  useEffect(() => {
    const initializeData = async () => {
      if (call && Object.keys(call).length > 0) {
        let initialData = transformCallToIC(call, poDetails);
        const icNumber = initialData.certificateNo || call.icNo || call.call_no;
        if (icNumber) {
          const savedEdit = await getRmIcEditData(icNumber);
          if (savedEdit) {
            initialData = {
              ...initialData,
              bookNo: savedEdit.bookNo || initialData.bookNo,
              setNo: savedEdit.setNo || initialData.setNo,
              offeredInstNo: savedEdit.offeredInstallmentNo || initialData.offeredInstNo,
              passedInstNo: savedEdit.passedInstallmentNo || initialData.passedInstNo,
              drgNo: savedEdit.drawingNo || initialData.drgNo,
            };
          }
        }
        setEditableData(initialData);
      }
    };
    initializeData();
  }, [call, poDetails]);

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

  const dataToPass = editableData || transformCallToIC(call, poDetails);

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
    const sanitizedFilename = (dataToPass.certificateNo || "RawMaterialIC").replace(/[/\\?%*:|"<>]/g, '-');
    await exportToPdf(printAreaRef.current, `${sanitizedFilename}.pdf`);
  };

  const handleESign = async () => {
    console.log("📝 handleESign triggered");
    try {
      setIsESigning(true);
      
      // 1. Mandatory Validations
      console.log("🔍 Validating mandatory fields... dataToPass:", dataToPass);
      if (!dataToPass.bookNo || !dataToPass.setNo) {
          console.warn("⚠️ Validation failed: Book No or Set No is missing.");
          setNotification({ open: true, message: "Please fill in the 'Book No.' and 'Set No.' before signing.", severity: 'warning' });
          setIsESigning(false);
          return;
      }
      
      // if (!bookSetValidation.isValid) {
      //     console.warn("⚠️ Validation failed: Book No or Set No has not been verified.");
      //     setNotification({ open: true, message: "Please Verify the Book No. and Set No. before signing.", severity: 'warning' });
      //     setIsESigning(false);
      //     return;
      // }

      console.log("✅ Validation passed. Preparing to save edited data...");
      setNotification({ open: true, message: "Saving edited data...", severity: 'info' });
      // 2. Save Edited Data to DB
      const payloadToSave = {
          icNumber: dataToPass.certificateNo || call.icNo || call.call_no || "RawMaterial_IC",
          certificateId: null, // Depending on backend, pass null if not strictly needed
          bookNo: dataToPass.bookNo,
          setNo: dataToPass.setNo,
          offeredInstallmentNo: dataToPass.offeredInstNo,
          passedInstallmentNo: dataToPass.passedInstNo,
          drawingNo: dataToPass.drgNo,
          createdBy: getCurrentUserId()?.toString()
      };
      console.log("📤 Sending payload to saveRmIcEditData:", payloadToSave);
      
      await saveRmIcEditData(payloadToSave);
      console.log("✅ saveRmIcEditData completed successfully.");

      // 3. Generate PDF Snapshot from Frontend (Bypasses PE-02 Backend parsing issues)
      const base64Pdf = await generatePdfBase64(printAreaRef.current);

      if (!base64Pdf || !base64Pdf.startsWith("JVBER")) {
          throw new Error("Failed to generate PDF snapshot from UI.");
      }

      // 4. Construct Capricorn XML (STRICT pkiNetworkSign SCHEMA)
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}+05:30`;
      const txn = Math.random().toString(16).slice(2, 10).toUpperCase();

      const xmlRequest = `
        <request>
          <command>pkiNetworkSign</command>
          <ts>${timestamp}</ts>
          <txn>${txn}</txn>
          <certificate>
            <attribute name='CN'></attribute>
            <attribute name='O'></attribute>
            <attribute name='OU'></attribute>
            <attribute name='T'></attribute>
            <attribute name='E'></attribute>
            <attribute name='SN'></attribute>
            <attribute name='CA'></attribute>
            <attribute name='TC'>SG</attribute>
            <attribute name='AP'>1</attribute>
          </certificate>
          <file>
            <attribute name='type'>pdf</attribute>
          </file>
          <pdf>
            <page>1</page>
            <cood>410,80</cood>
            <size>150,50</size>
          </pdf>
          <data>${base64Pdf}</data>
        </request>
      `.replace(/>\s+</g, "><").trim();

      // 5. Trigger Local Bridge
      if (typeof window.abc === 'function') {
          const fileName = (dataToPass.certificateNo || "RawMaterial_IC") + ".pdf";
          window.abc(xmlRequest, dataToPass.certificateNo || call.icNo || call.call_no || "RawMaterial_IC", fileName);
      } else {
          throw new Error("Digital signature bridge (abc.js) not found.");
      }

    } catch (error) {
        console.error("Signing Error:", error);
        setNotification({ open: true, message: error.message || "Failed to sign document.", severity: 'error' });
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
            onClick={() => setIsEditing(!isEditing)}
            disabled={isESigning}
          >
            {isEditing ? "Save Changes" : "Edit Certificate"}
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            size="small" 
            onClick={handleESign} 
            disabled={isESigning}
            startIcon={isESigning ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isESigning ? "SIGNING..." : "✒ E SIGN"}
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

      <div className="certificate-print-wrapper" ref={printAreaRef}>
        <div className="certificate-page">
          <ErcRmIC 
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
    </Box>
  );
}
