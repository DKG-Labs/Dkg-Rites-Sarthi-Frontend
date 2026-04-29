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
import { uploadSignedCertificate, saveProcessIcEditData, getProcessIcEditData } from "../../services/certificateService";
import { performTransitionAction } from "../../services/workflowService";
import { getCurrentUserId } from "../../services/workflowApiService";

export default function ProcessMaterialCertificate({ call = {}, onBack }) {
  const printAreaRef = useRef();
  const [isEditing, setIsEditing] = useState(false);
  const [isESigning, setIsESigning] = useState(false);
  const [editableData, setEditableData] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

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
      description: c.productDescription || c.productType || "",
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
          const savedEdit = await getProcessIcEditData(icNumber);
          if (savedEdit) {
            initialData = {
              ...initialData,
              bookNo: savedEdit.bookNo || initialData.bookNo,
              setNo: savedEdit.setNo || initialData.setNo,
              offeredInstNo: savedEdit.offeredInstallmentNo || initialData.offeredInstNo,
              passedInstNo: savedEdit.passedInstallmentNo || initialData.passedInstNo,
              consigneeRailway: savedEdit.consignee || initialData.consigneeRailway,
            };
          }
        }
        setEditableData(initialData);
      }
    };
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call]);

  const handleDataChange = (field, value) => setEditableData((prev) => ({ ...prev, [field]: value }));
  const handleArrayDataChange = (arrayField, index, field, value) => {
    setEditableData((prev) => {
      const newArray = [...(prev[arrayField] || [])];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [arrayField]: newArray };
    });
  };

  const dataToPass = editableData || transformCallToIC(call);

  const handleExport = async () => {
    if (!printAreaRef.current) return;
    const sanitizedFilename = (dataToPass.certificateNo || "ProcessMaterialIC").replace(/[/\\?%*:|"<>]/g, '-');
    await exportToPdf(printAreaRef.current, `${sanitizedFilename}.pdf`);
  };

  const handleESign = async () => {
    try {
      setIsESigning(true);
      
      // 1. Mandatory Validations
      if (!dataToPass.bookNo || !dataToPass.setNo) {
          setNotification({ open: true, message: "Please fill in the 'Book No.' and 'Set No.' before signing.", severity: 'warning' });
          setIsESigning(false);
          return;
      }

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
          createdBy: getCurrentUserId()?.toString()
      });

      // 2. Generate PDF Snapshot from Frontend (Bypasses PE-02 Backend parsing issues)
      const base64Pdf = await generatePdfBase64(printAreaRef.current);

      if (!base64Pdf || !base64Pdf.startsWith("JVBER")) {
          throw new Error("Failed to generate PDF snapshot from UI.");
      }

      // 3. Construct Capricorn XML (STRICT pkiNetworkSign SCHEMA)
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
            <cood>425,135</cood>
            <size>110,40</size>
          </pdf>
          <data>${base64Pdf}</data>
        </request>
      `.replace(/>\s+</g, "><").trim();

      // 4. Trigger Local Bridge
      if (typeof window.abc === 'function') {
          const fileName = (dataToPass.certificateNo || "ProcessMaterial_IC") + ".pdf";
          window.abc(xmlRequest, dataToPass.certificateNo || call.icNo || call.call_no || "ProcessMaterial_IC", fileName);
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
          <ErcProcessIc data={dataToPass} isEditing={isEditing} isBusy={isESigning} onChange={handleDataChange} onArrayChange={handleArrayDataChange} />
        </div>
      </div>
    </Box>
  );
}
