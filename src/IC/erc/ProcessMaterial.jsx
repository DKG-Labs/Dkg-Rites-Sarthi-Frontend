// src/IC/erc/ProcessMaterialCertificate.jsx

import React, { useRef, useState, useEffect } from "react";
import { 
    Button, 
    CircularProgress, 
    Snackbar, 
    Alert,
    Box 
} from "@mui/material";
import { formatDate, getISTDateOnly } from "../../utils/helpers";
import ErcProcessIc from "./ErcProcessIc";
import { exportToPdf } from "../../utils/exportUtils";
import { getICReportData } from "../../services/finalInspectionSubmoduleService";

export default function ProcessMaterialCertificate({ call = {}, onBack }) {
  const printAreaRef = useRef();
  const [isEditing, setIsEditing] = useState(false);
  const [isESigning, setIsESigning] = useState(false);
  const [editableData, setEditableData] = useState(null);
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
    if (call && Object.keys(call).length > 0) {
      setEditableData(transformCallToIC(call));
    }
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
    const datetimeStr = call.updated_at || call.createdAt || new Date().toISOString();
    if (datetimeStr.split("T")[0] !== getISTDateOnly() && ["M", "U", "S", "W"].includes(call.status || "")) {
      setNotification({ open: true, message: "First, the IC must be saved on today’s date.", severity: 'warning' });
      return;
    }

    const currentUserEmail = localStorage.getItem('userEmail');
    const assignedIEEmail = call.ie_email || call.inspectingEngineerEmail || "";
    if (currentUserEmail && assignedIEEmail && currentUserEmail.toLowerCase() !== assignedIEEmail.toLowerCase()) {
      setNotification({ open: true, message: "Only the assigned Inspecting Engineer is authorized to E-Sign.", severity: 'error' });
      return;
    }

    // 3. Mandatory Certificate Fields Validation (Book & Set No)
    if (!dataToPass.bookNo || !dataToPass.setNo) {
        setNotification({ open: true, message: "Please fill in the 'Book No.' and 'Set No.' before signing.", severity: 'warning' });
        return;
    }

    try {
      setIsESigning(true);
      const payload = {
        CaseNO: call.icNo || call.icNumber || call.case_no || "",
        Call_Recv_Dt: call.call_recv_dt || call.callRecvDt || call.createdAt || new Date().toISOString(),
        CallSNo: call.call_no || call.callSNo || call.call_sno || "",
        Consignee_CD: call.consignee_cd || call.consigneeCode || "",
        Region: call.region || "",
        BkNo: dataToPass.bookNo || "",
        SetNo: dataToPass.setNo || "",
        type: "PM",
        date: new Date().toISOString(),
        isDigitallySign: true
      };

      const response = await getICReportData(payload);
      if (response?.responseText) {
        if (typeof window.abc === 'function') {
          window.abc(response.responseText, `${payload.CaseNO}_${payload.CallSNo}.pdf`);
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
