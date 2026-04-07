// src/IC/erc/RawMaterialCertificate.jsx

import React, { useRef, useState, useEffect } from "react";
import { 
    Button, 
    CircularProgress,
    Snackbar,
    Alert,
    Box
} from "@mui/material";
import ErcRmIC from "./ErcRmIc";
import { exportToPdf, generatePdfBase64 } from "../../utils/exportUtils";
import { fetchPoDataForSections } from "../../services/poDataService";
import { getICReportData } from "../../services/finalInspectionSubmoduleService";
import { getISTDateOnly } from "../../utils/helpers";

export default function RawMaterialCertificate({ call = {}, onBack }) {
  const printAreaRef = useRef();
  const [poDetails, setPoDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isESigning, setIsESigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [editableData, setEditableData] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    if (call?.po_no && call?.call_no) {
      fetchPoDataForSections(call.po_no, call.call_no)
        .then(res => setPoDetails(res))
        .catch(err => console.error("Failed to load PO Details:", err));
    }
  }, [call?.po_no, call?.call_no]);

  useEffect(() => {
    const handlePkiStatus = (event) => {
      const { status, message } = event.detail;
      setNotification({ open: true, message, severity: status });
    };
    window.addEventListener('pki-status', handlePkiStatus);
    return () => window.removeEventListener('pki-status', handlePkiStatus);
  }, []);

  const handleCloseNotification = () => setNotification({ ...notification, open: false });

  const transformCallToIC = (c, po) => {
    if (!c || Object.keys(c).length === 0) return {};
    let updatedContractRef = c.contractRef || "";
    if (po && po.rlyShortName && po.poSerialNo) {
      const datePart = updatedContractRef.includes("dated") ? updatedContractRef.split("dated")[1].trim() : po.poDate || "";
      const basePoString = po.poSerialNo.includes(po.poNo) ? `${po.rlyShortName} / ${po.poSerialNo}` : `${po.rlyShortName} / ${po.poNo} / ${po.poSerialNo}`;
      updatedContractRef = datePart ? `${basePoString} dated ${datePart}` : basePoString;
    }

    return {
      certificateNo: c.certificateNo || c.icNo || "",
      certificateDate: c.certificateDate || "",
      offeredInstNo: c.offeredInstNo || "",
      passedInstNo: c.passedInstNo || "",
      contractor: c.contractor || c.vendorName || c.vendor_name || "",
      manufacturer: c.manufacturer || "",
      placeOfInspection: (po?.placeOfInspection || po?.inspPlace) || c.placeOfInspection || "",
      contractRef: updatedContractRef,
      contractorPo: c.contractorPo || c.poNo || c.po_no || "",
      billPayingOfficer: c.billPayingOfficer || c.billOfficer || "",
      consigneeRailway: c.consigneeRailway || c.consignee || "",
      purchasingAuthority: c.purchasingAuthority || "",
      consigneeManufacturer: c.consigneeManufacturer || c.consigneeFinished || "",
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
    if (call && Object.keys(call).length > 0) setEditableData(transformCallToIC(call, poDetails));
  }, [call, poDetails]);

  const handleDataChange = (field, value) => setEditableData((prev) => ({ ...prev, [field]: value }));
  const handleArrayDataChange = (arrayField, index, field, value) => {
    setEditableData((prev) => {
      const newArray = [...(prev[arrayField] || [])];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [arrayField]: newArray };
    });
  };

  const dataToPass = editableData || transformCallToIC(call, poDetails);

  const handleExport = async () => {
    if (!printAreaRef.current) return;
    const sanitizedFilename = (dataToPass.certificateNo || "RawMaterialIC").replace(/[/\\?%*:|"<>]/g, '-');
    await exportToPdf(printAreaRef.current, `${sanitizedFilename}.pdf`);
  };

  const handleESign = async () => {
    const datetimeStr = call.updated_at || call.createdAt || new Date().toISOString();
    if (datetimeStr.split("T")[0] !== getISTDateOnly() && ["M", "U", "S", "W"].includes(call.status || "")) {
      setNotification({ open: true, message: "First, the IC must be saved on today’s date.", severity: 'warning' });
      return;
    }

    // 2. Mandatory Certificate Fields Validation (Book & Set No)
    if (!dataToPass.bookNo || !dataToPass.setNo) {
        setNotification({ open: true, message: "Please fill in the 'Book No.' and 'Set No.' before signing.", severity: 'warning' });
        return;
    }

    try {
      setIsESigning(true);

      // 3. Wait 500ms for UI to show "SIGNING..." and visual signature stamp
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Generate PDF Base64 from current view
      const sanitizedFilename = (dataToPass.certificateNo || "RawMaterialIC").replace(/[/\\?%*:|"<>]/g, '-');
      const pdfBase64 = await generatePdfBase64(printAreaRef.current, `${sanitizedFilename}.pdf`);
      if (!pdfBase64) {
          throw new Error("Failed to generate PDF snapshot for signing.");
      }

      const payload = {
        CaseNO: call.case_no || call.icNo || call.icNumber || "",
        Call_Recv_Dt: call.call_recv_dt || call.callRecvDt || call.createdAt || new Date().toISOString(),
        CallSNo: call.call_no || call.callSNo || call.call_sno || "",
        Consignee_CD: call.consignee_cd || call.consigneeCode || "",
        Region: call.region || "",
        BkNo: dataToPass.bookNo || "",
        SetNo: dataToPass.setNo || "",
        type: "RM",
        date: new Date().toISOString(),
        isDigitallySign: true,
        pdfBase64: pdfBase64
      };

      const response = await getICReportData(payload);
      if (response?.responseText) {
        if (typeof window.abc === 'function') {
          window.abc(response.responseText, (dataToPass.certificateNo || `${payload.CaseNO}_${payload.CallSNo}`) + ".pdf");
          setIsSigned(true);
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
          <ErcRmIC data={dataToPass} isEditing={isEditing} isBusy={isESigning} isSigned={isSigned} onChange={handleDataChange} onArrayChange={handleArrayDataChange} />
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
