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
import { exportToPdf, generatePdfBase64, calculateSignatureCoords } from "../../utils/exportUtils";
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
    str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + (Number(n[1][1]) ? "-" + a[n[1][1]] : " ")) + "Crore " : "";
    str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + (Number(n[2][1]) ? "-" + a[n[2][1]] : " ")) + "Lakh " : "";
    str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + (Number(n[3][1]) ? "-" + a[n[3][1]] : " ")) + "Thousand " : "";
    str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + (Number(n[4][1]) ? "-" + a[n[4][1]] : " ")) + "Hundred " : "";
    str += (Number(n[5]) !== 0) ? ((str !== "") ? "and " : "") + (a[Number(n[5])] || b[n[5][0]] + (Number(n[5][1]) ? "-" + a[n[5][1]] : " ")) : "";
    return str.trim();
};

const digitWords = {
    '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four',
    '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine'
};

const decimalNumberToWords = (num) => {
    const str = typeof num === 'number' ? num.toFixed(3) : String(num);
    const parts = str.split('.');
    const intPart = parseInt(parts[0], 10) || 0;
    const intWords = numberToWords(intPart).trim();
    
    if (parts.length > 1 && parts[1]) {
        let decStr = parts[1].slice(0, 3);
        const decWords = decStr.split('').map(d => digitWords[d] || d).join(' ');
        return `${intWords} Point ${decWords}`;
    }
    return intWords;
};

const getErcKFactor = (callOrType) => {
    // 1. Direct explicit ercType check if object
    if (callOrType && typeof callOrType === "object" && callOrType.ercType) {
        const explicitType = String(callOrType.ercType).toLowerCase().trim();
        if (explicitType.includes("mk-iii") || explicitType.includes("mk iii") || explicitType.includes("3701")) return 0.91;
        if (explicitType.includes("j-type") || explicitType.includes("j type") || explicitType.includes("erc-j") || explicitType.includes("4158")) return 0.915;
        if (explicitType.includes("mk-v") || explicitType.includes("mk v") || explicitType.includes("5919")) return 1.088;
    }

    let searchStr = "";
    if (typeof callOrType === "string") {
        searchStr = callOrType;
    } else if (callOrType && typeof callOrType === "object") {
        searchStr = [
            callOrType.ercType,
            callOrType.productType,
            callOrType.product_type,
            callOrType.typeOfErc,
            callOrType.drgNo,
            callOrType.drawingNo,
            callOrType.drg_no,
            callOrType.description,
            callOrType.productDescription,
            callOrType.product_description,
            callOrType.remarks,
            callOrType.specNo,
            callOrType.specificationNo,
            callOrType.spec_no
        ].filter(Boolean).join(" ");
    }

    const lower = searchStr.toLowerCase();

    // MK-III: 0.91
    if (
        lower.includes("mk-iii") ||
        lower.includes("mk iii") ||
        lower.includes("mark iii") ||
        lower.includes("mark 3") ||
        lower.includes("mk 3") ||
        lower.includes("mkiii") ||
        lower.includes("3701") ||
        lower.includes("rt-3701") ||
        lower.includes("t-3701")
    ) {
        return 0.91;
    }

    // J Type / ERC-J: 0.915
    if (
        lower.includes("j-type") ||
        lower.includes("j type") ||
        lower.includes("j_type") ||
        lower.includes("erc-j") ||
        lower.includes("erc j") ||
        lower.includes("j-clip") ||
        lower.includes("j clip") ||
        lower.includes("4158") ||
        lower.includes("rt-4158") ||
        lower.includes("8258") ||
        lower.includes("t-8258")
    ) {
        return 0.915;
    }

    // MK-V: 1.088
    if (
        lower.includes("mk-v") ||
        lower.includes("mk v") ||
        lower.includes("mark v") ||
        lower.includes("mark 5") ||
        lower.includes("mk 5") ||
        lower.includes("mkv") ||
        lower.includes("5919") ||
        lower.includes("rt-5919") ||
        lower.includes("t-5919") ||
        lower.includes("t5919") ||
        lower.includes("6025")
    ) {
        return 1.088;
    }

    return 1.088;
};

const generateQuantityRemarks = (c) => {
    const rawErcType = c.ercType || c.productType || c.description || c.drgNo || "";
    const kFactor = getErcKFactor(c || rawErcType);

    const qtyNowOffered = Number(c.qtyNowOffered || 0);
    const qtyNowRejected = Number(c.qtyNowRejected || 0);
    
    // Calculate total erc_used_for_testing sum from call or lot details
    let ercUsedCount = 0;
    if (c.ercUsedForTesting !== undefined && c.ercUsedForTesting !== null) {
        ercUsedCount = Number(c.ercUsedForTesting);
    } else if (c.erc_used_for_testing !== undefined && c.erc_used_for_testing !== null) {
        ercUsedCount = Number(c.erc_used_for_testing);
    } else if (c.lotDetails && Array.isArray(c.lotDetails) && c.lotDetails.length > 0) {
        ercUsedCount = c.lotDetails.reduce((sum, l) => sum + (Number(l.ercUsedForTesting || l.erc_used_for_testing || l.ercUsed || l.erc_used || l.noOfErcUsed || l.no_of_erc_used || l.testingQty) || 0), 0);
    } else if (c.finalLotDetails && Array.isArray(c.finalLotDetails) && c.finalLotDetails.length > 0) {
        ercUsedCount = c.finalLotDetails.reduce((sum, l) => sum + (Number(l.ercUsedForTesting || l.erc_used_for_testing || l.ercUsed || l.erc_used || l.noOfErcUsed || l.no_of_erc_used || l.testingQty) || 0), 0);
    }
    
    // Accepted quantity = passed qty (or offered - rejected - ercUsedCount if offered > 0)
    let qtyNowAccepted = 0;
    if (c.qtyNowPassed !== undefined && c.qtyNowPassed !== null && c.qtyNowPassed !== "") {
        qtyNowAccepted = Number(String(c.qtyNowPassed).replace(/\*/g, '')) || 0;
    } else if (qtyNowOffered > 0) {
        qtyNowAccepted = Math.max(0, qtyNowOffered - qtyNowRejected - ercUsedCount);
    }
    
    const acceptedMt = (Math.round(((qtyNowAccepted * kFactor) / 1000) * 1000 + Number.EPSILON) / 1000);
    const acceptedMtWords = decimalNumberToWords(acceptedMt);
    const acceptedNosFormatted = Number(qtyNowAccepted).toLocaleString('en-IN');

    let text = `Quantity now passed ${acceptedMtWords} Mt Only Total Quantity is ${acceptedNosFormatted} Nos, `;
    
    if (qtyNowAccepted > 0) {
        let bagsOf50 = Math.floor(qtyNowAccepted / 50);
        let rem = qtyNowAccepted % 50;
        let packText = [];
        if (bagsOf50 > 0) packText.push(`${bagsOf50} Bags X 50 Nos per bag`);
        if (rem > 0) packText.push(`01 Bag X ${rem.toString().padStart(2, '0')} Nos`);
        if (packText.length > 0) {
            text += `Packed in ${packText.join(', ')}. `;
        }
    }

    if (c.lotDetails && c.lotDetails.length > 0) {
        let markings = c.lotDetails.map(l => `${l.lotNo || ''}, HNO - ${l.heatNo || ''}`).filter(Boolean).join(' & ');
        if (markings) {
            text += `Marking: ${markings} `;
        }
    }
    
    if (ercUsedCount > 0) {
        text += `Note: ${ercUsedCount} Nos. ERC consumed in Destructive Testing are extra offer `;
    }

    let stageIcText = "";
    if (c.rmIcNo) {
        let rmDateStr = c.rmIcDate ? ` Dt: ${c.rmIcDate}` : "";
        let bookSetStr = (c.bookNo && c.setNo) ? ` Book No.${c.bookNo} Set No. ${c.setNo}` : "";
        stageIcText += `Note: Raw Material Pre-Inspected by RITES vide Stage I.C. No. ${c.rmIcNo}${rmDateStr}${bookSetStr}`;
    }
    
    if (c.processIcNo) {
        let processDateStr = c.processIcDate ? ` Dt: ${c.processIcDate}` : "";
        stageIcText += `${stageIcText ? ", " : ""}Note: Process Inspection carried out by RITES vide Stage I.C. No. ${c.processIcNo}${processDateStr}`;
    } else {
        stageIcText += `${stageIcText ? ", " : ""}Note: Process Inspection carried out by RITES as per the Railway Board Letter No. 2024/RS(G)/779/12`;
    }

    if (stageIcText) {
        text += `${stageIcText} `;
    }

    if (c.ibsCaseNo && c.ibsCaseNo !== '-') {
        text += `(IBS Case No: ${c.ibsCaseNo})\n`;
    } else {
        text += `\n`;
    }

    if (qtyNowRejected > 0 && qtyNowAccepted === 0) {
        text += `\nMaterial is Non-conforming as per Lab Report No. [FILL_LAB_REPORT]. In the chemical test, the observed value was [OBSERVED], which exceeds the specified limit.\n`;
    } else {
        text += `NOTE: THE SAMPLES REJECTED DURING INSPECTION HAVE SUBSEQUENTLY BEEN USED FOR DESTRUCTIVE TESTING.`;
    }
    
    return text;
};

const generateReasonsForRejection = (c) => {
    let totalRejected = Number(c.qtyNowRejected || 0);
    if (totalRejected === 0 && c.lotDetails && Array.isArray(c.lotDetails) && c.lotDetails.length > 0) {
        totalRejected = c.lotDetails.reduce((sum, l) => sum + (Number(l.totalRejectedQty || l.rejectedQty) || 0), 0);
    }
    
    if (!totalRejected || totalRejected <= 0) {
        return "Not Applicable";
    }
    
    const words = numberToWords(totalRejected);
    return `${words} (${totalRejected}) Nos. of ERC rejected due to dimensional non-conformity and/or visual surface defects such as deep dents, bends, cracks, or other specified defects and Dimension Inspection /Hardness Test/Decarburisation/ Freedom from defect /Micro-Structure/Application and Diflection Test/Toe Load Test .`;
};

export default function FinalProductCertificate({ call = {}, onBack }) {
  const printAreaRef = useRef();
  const [isEditing, setIsEditing] = useState(false);
  const [isESigning, setIsESigning] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [bookSetValidation, setBookSetValidation] = useState({ isValid: false, message: null, isValidating: false });
  const [bookWarningModal, setBookWarningModal] = useState({ show: false, onProceed: null });

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

    const ercTestingCount = c.ercUsedForTesting ?? c.erc_used_for_testing ?? (
      c.lotDetails && Array.isArray(c.lotDetails) && c.lotDetails.length > 0
        ? c.lotDetails.reduce((sum, l) => sum + (Number(l.ercUsedForTesting || l.erc_used_for_testing || l.ercUsed || l.erc_used || l.noOfErcUsed || l.no_of_erc_used || l.testingQty) || 0), 0)
        : (c.finalLotDetails && Array.isArray(c.finalLotDetails) && c.finalLotDetails.length > 0
            ? c.finalLotDetails.reduce((sum, l) => sum + (Number(l.ercUsedForTesting || l.erc_used_for_testing || l.ercUsed || l.erc_used || l.noOfErcUsed || l.no_of_erc_used || l.testingQty) || 0), 0)
            : 0)
    );

    const calculatedAccepted = (c.qtyNowPassed !== undefined && c.qtyNowPassed !== null && c.qtyNowPassed !== "")
      ? (Number(String(c.qtyNowPassed).replace(/\*/g, '')) || 0)
      : (Number(c.qtyNowOffered || 0) > 0 ? Math.max(0, Number(c.qtyNowOffered || 0) - Number(c.qtyNowRejected || 0) - ercTestingCount) : 0);

    const passedVal = calculatedAccepted;
    const stillDueVal = (c.qtyStillDue !== undefined && c.qtyStillDue !== null && c.qtyStillDue !== "")
      ? c.qtyStillDue
      : Math.max(0, Number(c.qtyOnOrder || 0) - Number(c.qtyPassedPreviously || 0) - passedVal);

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
      qtyNowPassed: passedVal,
      qtyNowRejected: c.qtyNowRejected || 0,
      qtyStillDue: stillDueVal,
      ercUsedForTesting: ercTestingCount,
      noOfItemsChecked: c.noOfItemsChecked || "",
      dateOfCall: c.dateOfCall || "",
      noOfVisits: c.noOfVisits || "",
      datesOfInspection: c.inspectionDates || c.datesOfInspection || "",
      trRecDate: c.trRecDate || "",
      quantityNowPassedText: c.quantityNowPassedText || generateQuantityRemarks(c),
      sealingPattern: c.sealingPattern || "",
      facsimileText: c.facsimileText || "",
      reasonsForRejection: (c.reasonsForRejection && c.reasonsForRejection !== "Not Applicable") ? c.reasonsForRejection : generateReasonsForRejection(c),
      inspectingEngineer: c.inspectingEngineer || "",
      lotDetails: c.lotDetails || [],
      remarks: c.ibsCaseNo && c.ibsCaseNo !== '-' ? `IBS Case No: ${c.ibsCaseNo}\n${c.remarks || ""}`.trim() : (c.remarks || ""),
      maNumberAndDate: c.maNumberAndDate || "",
      ercType: c.ercType || c.productType || c.product_type || c.typeOfErc || "",
      drgNo: c.drgNo || c.drawingNo || c.drg_no || "",
      specNo: c.specNo || c.specificationNo || c.spec_no || "",
      productDescription: c.productDescription || c.product_description || "",
      rmIcNo: c.rmIcNo || "",
      rmIcDate: c.rmIcDate || "",
      processIcNo: c.processIcNo || "",
      processIcDate: c.processIcDate || "",
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
    setData(prev => {
      const updated = { ...prev, [fieldName]: value };
      if (['qtyOnOrder', 'qtyPassedPreviously', 'qtyNowPassed', 'qtyNowOffered', 'qtyNowRejected', 'ercUsedForTesting'].includes(fieldName)) {
        const order = parseFloat(updated.qtyOnOrder) || 0;
        const prevPassed = parseFloat(updated.qtyPassedPreviously) || 0;
        const nowOffered = parseFloat(updated.qtyNowOffered) || 0;
        const nowRejected = parseFloat(updated.qtyNowRejected) || 0;
        const ercTesting = parseFloat(updated.ercUsedForTesting) || 0;
        const rawAccepted = (updated.qtyNowPassed !== undefined && updated.qtyNowPassed !== null && updated.qtyNowPassed !== "")
          ? (parseFloat(String(updated.qtyNowPassed).replace(/\*/g, '')) || 0)
          : (nowOffered > 0 ? Math.max(0, nowOffered - nowRejected - ercTesting) : 0);
        updated.qtyStillDue = Math.max(0, order - prevPassed - rawAccepted);
      }
      return updated;
    });
    if (fieldName === 'bookNo' || fieldName === 'setNo') {
      setBookSetValidation({ isValid: false, message: null, isValidating: false });
    }
  };

  const executeSaveChanges = async () => {
    if (!/^\d{3}$/.test(data.setNo)) {
      setNotification({ open: true, message: "Set No. must be exactly 3 digits.", severity: 'warning' });
      return;
    }

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
          manufacturer: data.manufacturer,
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

  const handleSaveChanges = () => {
    if (!data.bookNo || !data.setNo) {
      setNotification({ open: true, message: "Please fill in both Book No. and Set No. before saving.", severity: 'warning' });
      return;
    }

    if (data.bookNo.trim().length < 4) {
      setBookWarningModal({
        show: true,
        onProceed: executeSaveChanges
      });
      return;
    }

    executeSaveChanges();
  };

  const executeVerifyBookSet = async () => {
    if (!/^\d{3}$/.test(data.setNo)) {
      setNotification({ open: true, message: "Set No. must be exactly 3 digits.", severity: 'warning' });
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

  const handleVerifyBookSet = () => {
    if (!data.bookNo || !data.setNo) {
      setNotification({ open: true, message: "Please fill in both Book No. and Set No. before verifying.", severity: 'warning' });
      return;
    }

    if (!/^\d{3}$/.test(data.setNo)) {
      setNotification({ open: true, message: "Set No. must be exactly 3 digits.", severity: 'warning' });
      return;
    }

    if (data.bookNo.trim().length < 4) {
      setBookWarningModal({
        show: true,
        onProceed: executeVerifyBookSet
      });
      return;
    }

    executeVerifyBookSet();
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

  const executeESign = async () => {
    try {
      setIsESigning(true);
      
      if (!/^\d{3}$/.test(data.setNo)) {
          setNotification({ open: true, message: "Set No. must be exactly 3 digits.", severity: 'warning' });
          setIsESigning(false);
          return;
      }
      
      if (data.icType === 'new' && !bookSetValidation.isValid) {
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
          manufacturer: data.manufacturer,
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

      const sigCoords = calculateSignatureCoords(printAreaRef.current, "395,160", "170,36");

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
            <cood>${sigCoords.cood}</cood>
            <size>${sigCoords.size}</size>
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

  const handleESign = () => {
    if (!data.bookNo || !data.setNo) {
        setNotification({ open: true, message: "Please fill in the 'Book No.' and 'Set No.' before signing.", severity: 'warning' });
        return;
    }

    if (data.bookNo.trim().length < 4) {
      setBookWarningModal({
        show: true,
        onProceed: executeESign
      });
      return;
    }

    executeESign();
  };

  const handleCancelChanges = async () => {
    setIsEditing(false);
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
    }
    setData(initialData);
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
          <button
            onClick={isEditing ? handleSaveChanges : () => setIsEditing(true)}
            className={isEditing ? "btn btn-primary" : "btn btn-outline"}
            disabled={isESigning}
          >
            {isEditing ? "Save Changes" : "✎ Edit"}
          </button>
          {isEditing && (
            <button
              onClick={handleCancelChanges}
              className="btn btn-outline border-red-500 text-red-600 hover:bg-red-50"
              disabled={isESigning}
            >
              Cancel Changes
            </button>
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
    </Box>
  );
}
