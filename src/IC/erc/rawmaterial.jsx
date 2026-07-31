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
import { uploadSignedCertificate, saveRmIcEditData, getRmIcEditData, saveRmIcSaveChanges, getRmIcSaveChanges, validateBookSetNo } from "../../services/certificateService";
import { performTransitionAction } from "../../services/workflowService";
import { getCurrentUserId } from "../../services/workflowApiService";
import { getStoredUser } from "../../services/authService";
import ErcRmIC from "./ErcRmIc";
import reportService from "../../services/reportService";
import { fetchPoDataForSections } from "../../services/poDataService";
import { normalizeErcType } from "../../utils/ercUtils";

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
    let datePart = updatedContractRef.includes("dated") ? updatedContractRef.split("dated")[1].trim() : (po?.poDate || "");
    
    if (po && po.rlyShortName && po.poSerialNo) {
      const basePoString = po.poSerialNo.includes(po.poNo) ? `${po.rlyShortName} / ${po.poSerialNo}` : `${po.rlyShortName} / ${po.poNo} / ${po.poSerialNo}`;
      updatedContractRef = datePart ? `${basePoString} dated ${datePart}` : basePoString;
    }
    
    let contractorPoDisplay = c.contractorPo || c.poNo || c.po_no || "";
    if (contractorPoDisplay && datePart && !contractorPoDisplay.includes("dated")) {
      contractorPoDisplay = `${contractorPoDisplay} dated ${datePart}`;
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
      contractorPo: contractorPoDisplay,
      billPayingOfficer: c.billPayingOfficer || c.billOfficer || "",
      consigneeRailway: c.consigneeRailway || c.consignee || "",
      purchasingAuthority: c.purchasingAuthority || "",
      consigneeManufacturer: consigneeManufacturerDefault,
      description: c.description || c.productDescription || "",
      drgNo: c.drgNo || "",
      specNo: c.specNo || "",
      qapNo: c.qapNo || "",
      inspectionType: c.inspectionType || "",
      inspectionDetails: (c.inspectionDetails || c.contractChpReq || "Visual, Dimensional, Mechanical, Chemical & Metallurgical").replace(/Visual[\s,]*Dimensional[\s,]*Mechanical\s*&\s*Chemical/gi, "Visual, Dimensional, Mechanical, Chemical & Metallurgical"),
      chpClause: c.chpClause || "",
      contractChpReq: (c.contractChpReq || "Visual, Dimensional, Mechanical, Chemical & Metallurgical").replace(/Visual[\s,]*Dimensional[\s,]*Mechanical\s*&\s*Chemical/gi, "Visual, Dimensional, Mechanical, Chemical & Metallurgical"),
      result: c.result || "",
      clearedQty: (() => {
        if (c.heatDetails && Array.isArray(c.heatDetails) && c.heatDetails.length > 0) {
          let totalMt = 0;
          const lines = c.heatDetails.filter(h => ["ACCEPTED", "PARTIALLY_ACCEPTED"].includes(h.status)).map(h => {
              const val = parseFloat(h.weightAcceptedMt || 0);
              totalMt += val;
              return `${h.heatNo}\u00A0\u2011\u00A0${val.toFixed(3)}MT`;
          });
          if (lines.length > 0) {
            let resultText = "";
            
            const searchString = c.ercType || `${c.description || ''} ${c.productDescription || ''} ${c.remarks || ''}`;
            const ercType = normalizeErcType(searchString);
            
            let ercNos = 0;
            if (ercType === "MK-III") {
              ercNos = Math.floor((totalMt * 1000) / 0.928426);
            } else if (ercType === "MK-V") {
              ercNos = Math.floor((totalMt * 1000) / 1.133);
            } else if (ercType === "ERC-J") {
              ercNos = Math.floor((totalMt * 1000) / 0.928);
            }
            
            if (ercNos > 0) {
              resultText = `${lines.join("\n")}\nTotal\u00A0Qty\u00A0\u2011\u00A0${totalMt.toFixed(3)}MT\nNO\u00A0OF\u00A0ERC\u00A0=\n${ercNos}\u00A0NOs\n(Approximate)`;
            } else {
              resultText = `${lines.join("\n")}\nTotal\u00A0Qty\u00A0\u2011\u00A0${totalMt.toFixed(3)}MT`;
            }
            return resultText;
          }
          return "";
        }
        return c.clearedQty || "";
      })(),
      qtyRejected: (() => {
        if (c.heatDetails && Array.isArray(c.heatDetails) && c.heatDetails.length > 0) {
          let totalMt = 0;
          const lines = c.heatDetails.filter(h => ["REJECTED", "PARTIALLY_ACCEPTED"].includes(h.status)).map(h => {
              const val = parseFloat(h.weightRejectedMt || 0);
              totalMt += val;
              return `${h.heatNo}\u00A0\u2011\u00A0${val.toFixed(3)}MT`;
          });
          return lines.length > 0 ? `${lines.join("\n")}\nTotal\u00A0Qty\u00A0\u2011\u00A0${totalMt.toFixed(3)}MT` : "Nil";
        }
        return c.qtyRejected || "Nil";
      })(),
      remarks: c.ibsCaseNo && c.ibsCaseNo !== '-' ? `(IBS Case No: ${c.ibsCaseNo}), ${c.remarks || ""}`.trim() : (c.remarks || ""),
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
          let savedEdit = await getRmIcSaveChanges(icNumber);
          if (!savedEdit) {
            savedEdit = await getRmIcEditData(icNumber);
          }
          if (savedEdit) {
            initialData = {
              ...initialData,
              bookNo: savedEdit.bookNo || initialData.bookNo,
              setNo: savedEdit.setNo || initialData.setNo,
              offeredInstNo: savedEdit.offeredInstallmentNo || initialData.offeredInstNo,
              passedInstNo: savedEdit.passedInstallmentNo || initialData.passedInstNo,
              drgNo: savedEdit.drawingNo || initialData.drgNo,
              manufacturer: savedEdit.manufacturer || initialData.manufacturer,
              contractorPo: savedEdit.contractorPo || initialData.contractorPo,
              consigneeRailway: savedEdit.consigneeRailway || initialData.consigneeRailway,
              consigneeManufacturer: savedEdit.consigneeManufacturer || initialData.consigneeManufacturer,
              purchasingAuthority: savedEdit.purchasingAuthority || initialData.purchasingAuthority,
              description: savedEdit.description || initialData.description,
              specNo: savedEdit.specNo || initialData.specNo,
              qapNo: savedEdit.qapNo || initialData.qapNo,
              chpClause: savedEdit.chpClause || initialData.chpClause,
              trRecDate: savedEdit.trRecDate || initialData.trRecDate,
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
  const handleSaveChanges = async () => {
    if (dataToPass.bookNo.length !== 4) {
      setNotification({ open: true, message: "Book No. must be exactly 4 characters long.", severity: 'warning' });
      return;
    }
    if (!/^\d{3}$/.test(dataToPass.setNo)) {
      setNotification({ open: true, message: "Set No. must be exactly 3 digits.", severity: 'warning' });
      return;
    }

    try {
      setNotification({ open: true, message: "Saving draft changes...", severity: 'info' });
      const payloadToSave = {
          icNumber: dataToPass.certificateNo || call.icNo || call.call_no || "RawMaterial_IC",
          certificateId: null,
          bookNo: dataToPass.bookNo,
          setNo: dataToPass.setNo,
          offeredInstallmentNo: dataToPass.offeredInstNo,
          passedInstallmentNo: dataToPass.passedInstNo,
          drawingNo: dataToPass.drgNo,
          manufacturer: dataToPass.manufacturer,
          contractorPo: dataToPass.contractorPo,
          consigneeRailway: dataToPass.consigneeRailway,
          consigneeManufacturer: dataToPass.consigneeManufacturer,
          purchasingAuthority: dataToPass.purchasingAuthority,
          description: dataToPass.description,
          specNo: dataToPass.specNo,
          qapNo: dataToPass.qapNo,
          chpClause: dataToPass.chpClause,
          visitsNo: dataToPass.visitsNo,
          inspectionDate: dataToPass.inspectionDate,
          createdBy: getCurrentUserId()?.toString(),
          updatedBy: getCurrentUserId()?.toString()
      };
      await saveRmIcSaveChanges(payloadToSave);
      setNotification({ open: true, message: "Changes saved successfully as draft!", severity: 'success' });
      setIsEditing(false);
    } catch (error) {
      console.error("Save Changes Error:", error);
      setNotification({ open: true, message: error.message || "Failed to save draft changes.", severity: 'error' });
    }
  };

  const dataToPass = editableData || transformCallToIC(call, poDetails);

  const handleVerifyBookSet = async () => {
    if (!dataToPass.bookNo || !dataToPass.setNo) {
      setNotification({ open: true, message: "Please fill in both Book No. and Set No. before verifying.", severity: 'warning' });
      return;
    }

    if (dataToPass.bookNo.length !== 4) {
      setNotification({ open: true, message: "Book No. must be exactly 4 characters long.", severity: 'warning' });
      return;
    }
    if (!/^\d{3}$/.test(dataToPass.setNo)) {
      setNotification({ open: true, message: "Set No. must be exactly 3 digits.", severity: 'warning' });
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
    if (isEditing) {
      setIsEditing(false);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
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
      
      if (dataToPass.bookNo.length !== 4) {
          setNotification({ open: true, message: "Book No. must be exactly 4 characters long.", severity: 'warning' });
          setIsESigning(false);
          return;
      }
      if (!/^\d{3}$/.test(dataToPass.setNo)) {
          setNotification({ open: true, message: "Set No. must be exactly 3 digits.", severity: 'warning' });
          setIsESigning(false);
          return;
      }
      
      if (dataToPass.icType === 'new' && !bookSetValidation.isValid) {
          console.warn("⚠️ Validation failed: Book No or Set No has not been verified.");
          setNotification({ open: true, message: "Please Verify the Book No. and Set No. before signing.", severity: 'warning' });
          setIsESigning(false);
          return;
      }

      console.log("✅ Validation passed. Preparing to save edited data...");
      setNotification({ open: true, message: "Saving edited data...", severity: 'info' });
      
      if (isEditing) {
          setIsEditing(false);
          await new Promise(resolve => setTimeout(resolve, 300));
      }

      // 2. Save Edited Data to DB
      const payloadToSave = {
          icNumber: dataToPass.certificateNo || call.icNo || call.call_no || "RawMaterial_IC",
          certificateId: null, // Depending on backend, pass null if not strictly needed
          bookNo: dataToPass.bookNo,
          setNo: dataToPass.setNo,
          offeredInstallmentNo: dataToPass.offeredInstNo,
          passedInstallmentNo: dataToPass.passedInstNo,
          drawingNo: dataToPass.drgNo,
          manufacturer: dataToPass.manufacturer,
          contractorPo: dataToPass.contractorPo,
          consigneeRailway: dataToPass.consigneeRailway,
          consigneeManufacturer: dataToPass.consigneeManufacturer,
          purchasingAuthority: dataToPass.purchasingAuthority,
          description: dataToPass.description,
          specNo: dataToPass.specNo,
          qapNo: dataToPass.qapNo,
          chpClause: dataToPass.chpClause,
          visitsNo: dataToPass.visitsNo,
          inspectionDate: dataToPass.inspectionDate,
          createdBy: getCurrentUserId()?.toString(),
          updatedBy: getCurrentUserId()?.toString()
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
            <cood>390,150</cood>
            <size>160,50</size>
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


  const handleCancelChanges = async () => {
    setIsEditing(false);
    let initialData = transformCallToIC(call, poDetails);
    const icNumber = initialData.certificateNo || call.icNo || call.call_no;
    if (icNumber) {
      let savedEdit = await getRmIcSaveChanges(icNumber);
      if (!savedEdit) {
        savedEdit = await getRmIcEditData(icNumber);
      }
      if (savedEdit) {
        initialData = {
          ...initialData,
          bookNo: savedEdit.bookNo || initialData.bookNo,
          setNo: savedEdit.setNo || initialData.setNo,
          offeredInstNo: savedEdit.offeredInstallmentNo || initialData.offeredInstNo,
          passedInstNo: savedEdit.passedInstallmentNo || initialData.passedInstNo,
          consigneeRailway: savedEdit.consigneeRailway || initialData.consigneeRailway,
          consigneeManufacturer: savedEdit.consigneeManufacturer || initialData.consigneeManufacturer,
          contractRef: savedEdit.contractRef || initialData.contractRef,
          contractorPo: savedEdit.contractorPo || initialData.contractorPo,
          maNumberAndDate: savedEdit.maNumberAndDate || initialData.maNumberAndDate,
          purchasingAuthority: savedEdit.purchasingAuthority || initialData.purchasingAuthority,
          description: savedEdit.description || initialData.description,
          specNo: savedEdit.specNo || initialData.specNo,
          qapNo: savedEdit.qapNo || initialData.qapNo,
          chpClause: savedEdit.chpClause || initialData.chpClause,
          visitsNo: savedEdit.visitsNo || initialData.visitsNo,
          drgNo: savedEdit.drawingNo || initialData.drgNo,
          manufacturer: savedEdit.manufacturer || initialData.manufacturer,
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
          {isEditing && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleCancelChanges}
              disabled={isESigning}
            >
              Cancel Changes
            </Button>
          )}
          <Button 
            variant="contained" 
            color="success" 
            size="small" 
            onClick={handleESign} 
            disabled={isESigning || isEditing}
            startIcon={isESigning ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isESigning ? "SIGNING..." : "✒ E SIGN"}
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            size="small" 
            onClick={handleExport} 
            disabled={isESigning || isEditing}
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
