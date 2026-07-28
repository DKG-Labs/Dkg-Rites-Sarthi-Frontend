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
import { uploadSignedCertificate, saveFinalIcEditData, getFinalIcEditData, saveFinalIcSaveChanges, getFinalIcSaveChanges, validateBookSetNo } from "../../services/certificateService";
import { performTransitionAction } from "../../services/workflowService";
import { getCurrentUserId } from "../../services/workflowApiService";
import { getStoredUser } from "../../services/authService";
import reportService from "../../services/reportService";

const numberToWords = (num) => {
    if (num === 0) return "Zero";
    const a = ["", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    
    if ((num = num.toString()).length > 9) return "Overflow";
    let n = ("000000000" + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return "";
    let str = "";
    str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + "Crore " : "";
    str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + "Lakh " : "";
    str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + "Thousand " : "";
    str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + "Hundred " : "";
    str += (Number(n[5]) !== 0) ? ((str !== "") ? "and " : "") + (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]]) : "";
    return str.trim();
};

const generateQuantityRemarks = (c) => {
    const qtyNowPassed = Number(c.qtyNowPassed || 0) > Number(c.qtyOnOrder || 0) ? Number(c.qtyOnOrder || 0) : Number(c.qtyNowPassed || 0);
    const qtyRejected = Number(c.qtyNowRejected || 0);
    const words = numberToWords(qtyNowPassed).toLowerCase();
    
    let text = `Quantity Now Passed ${words} Nos only. Excluding of xxxxx Nos consumed in destructive testing.\n`;
    
    if (c.lotDetails && c.lotDetails.length > 0) {
        let markings = c.lotDetails.map(l => `${l.lotNo || ''}, H No - ${l.heatNo || ''}`).join(' & ');
        text += `\nMarking - ${markings}\n`;
    }
    
    if (qtyNowPassed > 0) {
        let bagsOf50 = Math.floor(qtyNowPassed / 50);
        let rem = qtyNowPassed % 50;
        let packText = [];
        if (bagsOf50 > 0) packText.push(`${bagsOf50.toString().padStart(2, '0')} Bags x 50 Nos`);
        if (rem > 0) packText.push(`01 Bag x ${rem} Nos`);
        if (packText.length > 0) {
            text += `\nPacking - ${packText.join(', ')}\n`;
        }
    }

    if (c.rmIcNo || c.processIcNo) {
        let rmDateStr = c.rmIcDate ? ` Date- ${c.rmIcDate}` : "";
        let processDateStr = c.processIcDate ? ` Date- ${c.processIcDate}` : "";
        let rmText = c.rmIcNo ? `RM IC No-${c.rmIcNo}${rmDateStr}` : "";
        let processText = c.processIcNo ? `Process IC No-${c.processIcNo}${processDateStr}` : "";

        if (rmText && processText) {
            text += `\nRM Inspection and Process Inspection Accepted against Vide\n${rmText}\n& ${processText}\n`;
        } else if (rmText) {
            text += `\nRM Inspection Accepted against Vide\n${rmText}\n`;
        } else if (processText) {
            text += `\nProcess Inspection Accepted against Vide\n${processText}\n`;
        }
    }
    
    if (qtyRejected > 0 && qtyNowPassed === 0) {
        text += `\nMaterial is Non-conforming as per Lab Report No. [FILL_LAB_REPORT]. In the chemical test, the observed value was [OBSERVED], which exceeds the specified limit.\n`;
    }
    
    return text;
};

export default function FinalProductCertificate({ call = {}, onBack }) {
  const printAreaRef = useRef();
  const [isEditing, setIsEditing] = useState(false);
  const [isESigning, setIsESigning] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [bookSetValidation, setBookSetValidation] = useState({ isValid: false, message: null, isValidating: false });

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
        maNumberAndDate: "",
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
      qtyNowPassed: Number(c.qtyNowPassed || 0) > Number(c.qtyOnOrder || 0) ? Number(c.qtyOnOrder || 0) : Number(c.qtyNowPassed || 0),
      qtyNowRejected: c.qtyNowRejected || 0,
      qtyStillDue: c.qtyStillDue || 0,
      noOfItemsChecked: c.noOfItemsChecked || "",
      dateOfCall: c.dateOfCall || "",
      noOfVisits: c.noOfVisits || "",
      datesOfInspection: c.inspectionDates || c.datesOfInspection || "",
      trRecDate: c.trRecDate || "",
      quantityNowPassedText: c.quantityNowPassedText || generateQuantityRemarks(c),
      sealingPattern: c.sealingPattern || "",
      facsimileText: c.facsimileText || "",
      reasonsForRejection: c.reasonsForRejection || "Not Applicable",
      inspectingEngineer: c.inspectingEngineer || "",
      lotDetails: c.lotDetails || [],
      remarks: c.remarks || "",
      maNumberAndDate: c.maNumberAndDate || "",
    };
  };

  const [data, setData] = useState(transformCallToIC(call));

  useEffect(() => {
    const initializeData = async () => {
      if (call && Object.keys(call).length > 0) {
        let initialData = transformCallToIC(call);
        const icNumber = initialData.certificateNo || call.icNo || call.call_no;
        if (icNumber) {
          let savedEdit = await getFinalIcSaveChanges(icNumber);
          if (!savedEdit) {
            savedEdit = await getFinalIcEditData(icNumber);
          }
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
              maNumberAndDate: savedEdit.maNumberAndDate || initialData.maNumberAndDate,
              purchasingAuthority: savedEdit.purchasingAuthority || initialData.purchasingAuthority,
              description: savedEdit.description || initialData.description,
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
        setData(initialData);
      }
    };
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call]);

  const handleFieldChange = (fieldName, value) => {
    setData(prev => ({ ...prev, [fieldName]: value }));
    if (fieldName === 'bookNo' || fieldName === 'setNo') {
      setBookSetValidation({ isValid: false, message: null, isValidating: false });
    }
  };

  const handleSaveChanges = async () => {
    try {
      setNotification({ open: true, message: "Saving draft changes...", severity: 'info' });
      await saveFinalIcSaveChanges({
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
          maNumberAndDate: data.maNumberAndDate,
          purchasingAuthority: data.purchasingAuthority,
          description: data.description,
          trRecDate: data.trRecDate,
          noOfVisits: data.noOfVisits,
          datesOfInspection: data.datesOfInspection,
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

  const handleVerifyBookSet = async () => {
    if (!data.bookNo || !data.setNo) {
      setNotification({ open: true, message: "Please fill in both Book No. and Set No. before verifying.", severity: 'warning' });
      return;
    }
    
    setBookSetValidation(prev => ({ ...prev, isValidating: true }));
    try {
      const empNo = getStoredUser()?.employeeCode || "UNKNOWN";
      // For Final Product, STATUS is "F"
      const result = await validateBookSetNo(empNo, data.bookNo, data.setNo, "F");
      
      if (result.resultFlag === 1) {
        setBookSetValidation({ isValid: true, message: null, isValidating: false });
        setNotification({ open: true, message: "Book No. and Set No. are valid.", severity: 'success' });
      } else {
        setBookSetValidation({ isValid: false, message: result.message, isValidating: false });
        setNotification({ open: true, message: result.message || "Invalid Book/Set No.", severity: 'error' });
        // Clear invalid values
        setData(prev => ({ ...prev, bookNo: '', setNo: '' }));
      }
    } catch (error) {
      setBookSetValidation({ isValid: false, message: "Verification failed.", isValidating: false });
      setNotification({ open: true, message: "Error verifying Book/Set No: " + error.message, severity: 'error' });
      // Clear invalid values on error too
      setData(prev => ({ ...prev, bookNo: '', setNo: '' }));
    }
  };

  const handleExport = async () => {
    if (!printAreaRef.current) return;
    if (isEditing) {
      setIsEditing(false);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
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

      if (!bookSetValidation.isValid) {
          console.warn("⚠️ Validation failed: Book No or Set No has not been verified.");
          setNotification({ open: true, message: "Please Verify the Book No. and Set No. before signing.", severity: 'warning' });
          setIsESigning(false);
          return;
      }

      setNotification({ open: true, message: "Saving edited data...", severity: 'info' });
      
      if (isEditing) {
          setIsEditing(false);
          await new Promise(resolve => setTimeout(resolve, 300));
      }

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
          maNumberAndDate: data.maNumberAndDate,
          purchasingAuthority: data.purchasingAuthority,
          description: data.description,
          trRecDate: data.trRecDate,
          noOfVisits: data.noOfVisits,
          datesOfInspection: data.datesOfInspection,
          createdBy: getCurrentUserId()?.toString(),
          updatedBy: getCurrentUserId()?.toString()
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
            <cood>410,80</cood>
            <size>150,50</size>
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
            onClick={isEditing ? handleSaveChanges : () => setIsEditing(true)}
            className={isEditing ? "btn btn-primary" : "btn btn-outline"}
            disabled={isESigning}
          >
            {isEditing ? "Save Changes" : "✎ Edit"}
          </button>
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
          <button 
            onClick={handleExport} 
            className="btn btn-primary"
            disabled={isESigning || isEditing}
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="certificate-print-wrapper" ref={printAreaRef}>
        <div className="certificate-page">
          <ErcFinalIc 
            data={data} 
            isEditing={isEditing} 
            isBusy={isESigning} 
            onFieldChange={handleFieldChange} 
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
