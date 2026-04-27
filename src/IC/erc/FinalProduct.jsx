// src/IC/erc/FinalProductCertificate.jsx

import React, { useState, useEffect, useRef } from "react";
import { 
    Button, 
    CircularProgress,
    Snackbar,
    Alert,
    Box
} from '@mui/material';
import { formatDate } from "../../utils/helpers";
import ErcFinalIc from "./ErcFinalIc";
import { exportToPdf, generatePdfBase64 } from "../../utils/exportUtils";
import { uploadSignedCertificate, saveFinalIcEditData, getFinalIcEditData } from "../../services/certificateService";
import { performTransitionAction } from "../../services/workflowService";
import { getCurrentUserId } from "../../services/workflowApiService";

export default function FinalProductCertificate({ call = {}, onBack }) {
  const printAreaRef = useRef();
  const [isEditing, setIsEditing] = useState(false);
  const [isESigning, setIsESigning] = useState(false);
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
                          requestId: call?.call_no,
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
    if (!c || Object.keys(c).length === 0) {
      return {
        certificateNo: call.icNo || "",
        certificateDate: formatDate(new Date().toISOString()),
        offeredInstNo: "",
        passedInstNo: "",
        contractor: "",
        placeOfInspection: "",
        contractRef: "",
        contractRefDate: "",
        billPayingOfficer: "",
        consignee: "",
        purchasingAuthority: "",
        description: "",
        qtyOnOrder: "",
        qtyOfferedPreviously: "",
        qtyPassedPreviously: "",
        qtyNowOffered: "",
        qtyNowPassed: "",
        qtyNowRejected: "",
        qtyStillDue: "",
        noOfItemsChecked: "",
        dateOfCall: "",
        noOfVisits: "",
        datesOfInspection: "",
        trRecDate: "",
        sealingPattern: "",
        facsimileText: "",
        reasonsForRejection: "Not Applicable",
        inspectingEngineer: "",
        lotDetails: [],
        remarks: "",
      };
    }

    return {
      certificateNo: c.certificateNo || c.icNo || "",
      certificateDate: c.certificateDate || formatDate(new Date().toISOString()),
      offeredInstNo: c.offeredInstNo || "",
      passedInstNo: c.passedInstNo || "",
      contractor: c.contractor || "",
      placeOfInspection: c.placeOfInspection || "",
      contractRef: c.contractRef || "",
      contractRefDate: c.contractRefDate || "",
      billPayingOfficer: c.billPayingOfficer || "",
      consignee: c.consigneeRailway || c.consignee || "",
      purchasingAuthority: c.purchasingAuthority || "",
      description: c.description || "",
      qtyOnOrder: c.qtyOnOrder || 0,
      qtyOfferedPreviously: c.qtyOfferedPreviously || 0,
      qtyPassedPreviously: c.qtyPassedPreviously || 0,
      qtyNowOffered: c.qtyNowOffered || 0,
      qtyNowPassed: c.qtyNowPassed || 0,
      qtyNowRejected: c.qtyNowRejected || 0,
      qtyStillDue: c.qtyStillDue || 0,
      noOfItemsChecked: c.noOfItemsChecked || "",
      dateOfCall: c.dateOfCall || "",
      noOfVisits: c.noOfVisits || "",
      datesOfInspection: c.inspectionDates || c.datesOfInspection || "",
      trRecDate: c.trRecDate || "",
      quantityNowPassedText: c.quantityNowPassedText || "",
      sealingPattern: c.sealingPattern || "",
      facsimileText: c.facsimileText || "",
      reasonsForRejection: c.reasonsForRejection || "Not Applicable",
      inspectingEngineer: c.inspectingEngineer || "",
      lotDetails: c.lotDetails || [],
      remarks: c.remarks || "",
    };
  };

  const [data, setData] = useState(transformCallToIC(call));

  useEffect(() => {
    const initializeData = async () => {
      if (call && Object.keys(call).length > 0) {
        let initialData = transformCallToIC(call);
        const icNumber = initialData.certificateNo || call.icNo || call.call_no;
        if (icNumber) {
          const savedEdit = await getFinalIcEditData(icNumber);
          if (savedEdit) {
            initialData = {
              ...initialData,
              bookNo: savedEdit.bookNo || initialData.bookNo,
              setNo: savedEdit.setNo || initialData.setNo,
              offeredInstNo: savedEdit.offeredInstallmentNo || initialData.offeredInstNo,
              passedInstNo: savedEdit.passedInstallmentNo || initialData.passedInstNo,
              consignee: savedEdit.consignee || initialData.consignee,
              qtyOfferedPreviously: savedEdit.cummQtyOfferedPrev || initialData.qtyOfferedPreviously,
              qtyPassedPreviously: savedEdit.qtyPrevPassed || initialData.qtyPassedPreviously,
              qtyStillDue: savedEdit.qtyStillDue || initialData.qtyStillDue,
            };
          }
        }
        setData(initialData);
      }
    };
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call]);

  const handleFieldChange = (fieldName, value) => {
    setData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleExport = async () => {
    if (!printAreaRef.current) return;
    const certificateNo = data.certificateNo || "FinalProductIC";
    const sanitizedFilename = certificateNo.replace(/[/\\?%*:|"<>]/g, '-');
    await exportToPdf(printAreaRef.current, `${sanitizedFilename}.pdf`);
  };

  const handleESign = async () => {
    try {
      setIsESigning(true);
      
      // 1. Mandatory Validations
      if (!data.bookNo || !data.setNo) {
          setNotification({ open: true, message: "Please fill in the 'Book No.' and 'Set No.' before signing.", severity: 'warning' });
          setIsESigning(false);
          return;
      }

      setNotification({ open: true, message: "Saving edited data...", severity: 'info' });
      // 2. Save Edited Data to DB
      await saveFinalIcEditData({
          icNumber: data.certificateNo || call.icNo || call.call_no || "FinalProduct_IC",
          certificateId: null,
          bookNo: data.bookNo,
          setNo: data.setNo,
          offeredInstallmentNo: data.offeredInstNo,
          passedInstallmentNo: data.passedInstNo,
          consignee: data.consignee,
          cummQtyOfferedPrev: data.qtyOfferedPreviously,
          qtyPrevPassed: data.qtyPassedPreviously,
          qtyStillDue: data.qtyStillDue,
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
            <cood>425,175</cood>
            <size>110,40</size>
          </pdf>
          <data>${base64Pdf}</data>
        </request>
      `.replace(/>\s+</g, "><").trim();

      // 4. Trigger Local Bridge
      if (typeof window.abc === 'function') {
          const fileName = (data.certificateNo || "FinalProduct_IC") + ".pdf";
          window.abc(xmlRequest, data.certificateNo || call.icNo || call.call_no || "FinalProduct_IC", fileName);
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
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={isEditing ? "btn btn-primary" : "btn btn-outline"}
            disabled={isESigning}
          >
            {isEditing ? "✓ Done Editing" : "✎ Edit"}
          </button>
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
          <button 
            onClick={handleExport} 
            className="btn btn-primary"
            disabled={isESigning}
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="certificate-print-wrapper" ref={printAreaRef}>
        <div className="certificate-page">
          <ErcFinalIc data={data} isEditing={isEditing} isBusy={isESigning} onFieldChange={handleFieldChange} />
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
