// src/IC/erc/FinalProductCertificate.jsx

import React, { useState, useEffect, useRef } from "react";
import { 
    Button, 
    CircularProgress,
    Snackbar,
    Alert,
    Box
} from '@mui/material';
import { formatDate, getISTDateOnly } from "../../utils/helpers";
import ErcFinalIc from "./ErcFinalIc";
import { exportToPdf, generatePdfBase64 } from "../../utils/exportUtils";
import { getICReportData } from "../../services/finalInspectionSubmoduleService";

export default function FinalProductCertificate({ call = {}, onBack }) {
  const printAreaRef = useRef();
  const [isEditing, setIsEditing] = useState(false);
  const [isESigning, setIsESigning] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
      const handlePkiStatus = (event) => {
          const { status, message } = event.detail;
          setNotification({ open: true, message, severity: status });
      };

      window.addEventListener('pki-status', handlePkiStatus);
      return () => window.removeEventListener('pki-status', handlePkiStatus);
  }, []);

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
    const datetimeStr = call.updated_at || call.createdAt || new Date().toISOString();
    const callStatus = call.status || "";
    
    // 1. Mandatory Date Validation
    if (datetimeStr.split("T")[0] !== getISTDateOnly() && ["M", "U", "S", "W"].includes(callStatus)) {
      setNotification({ open: true, message: "First, the IC must be saved on today’s date. This is mandatory.", severity: 'warning' });
      return;
    }

    // 2. Mandatory Certificate Fields Validation (Book & Set No)
    if (!data.bookNo || !data.setNo) {
        setNotification({ open: true, message: "Please fill in the 'Book No.' and 'Set No.' before signing.", severity: 'warning' });
        return;
    }

    try {
      setIsESigning(true);
      
      // 3. Wait 500ms for UI to show "SIGNING..."
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Generate PDF Base64 from current view (No filename here to prevent local download before signing)
      const pdfBase64 = await generatePdfBase64(printAreaRef.current);
      if (!pdfBase64) {
          throw new Error("Failed to generate PDF snapshot for signing.");
      }

      const payload = {
        CaseNO: call.case_no || call.icNo || call.icNumber || "",
        Call_Recv_Dt: call.call_recv_dt || call.callRecvDt || call.createdAt || new Date().toISOString(),
        CallSNo: call.call_no || call.callSNo || call.call_sno || "",
        Consignee_CD: call.consignee_cd || call.consigneeCode || "",
        Region: call.region || "",
        BkNo: data.bookNo || "",
        SetNo: data.setNo || "",
        type: "FM",
        date: new Date().toISOString(),
        isDigitallySign: true,
        pdfBase64: pdfBase64
      };

      const response = await getICReportData(payload);
      if (response?.responseText) {
          if (typeof window.abc === 'function') {
              window.abc(response.responseText, (data.certificateNo || `${payload.CaseNO}_${payload.CallSNo}`) + ".pdf");
          } else {
              setNotification({ open: true, message: "Digital signature client not detected.", severity: 'error' });
          }
      }
    } catch (error) {
        setNotification({ open: true, message: "Failed to fetch report data for signing.", severity: 'error' });
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
