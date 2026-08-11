import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import RailpadFinalIc from "./RailpadFinalIc";
import RailpadProcessIc from "./RailpadProcessIc";
import AnnexureLoader from '../annexures/AnnexureLoader';
import {
  generateRailpadIcDetails,
  saveFinalIcEditData,
  getFinalIcEditData,
  saveFinalIcSaveChanges,
  getFinalIcSaveChanges,
  validateBookSetNo,
  uploadSignedCertificate,
  getProcessInspectionResult,
  getInspectionCallSummary,
  getProcessIcSaveChanges,
  saveProcessIcSaveChanges,
  getProcessIcEditData,
  saveProcessIcEditData
} from "../../services/certificateService";
import { performTransitionAction } from "../../services/workflowService";
import { getStoredUser } from "../../services/authService";
import { finalInspectionLotResultsService } from "../../services/finalInspectionLotResultsService";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const cleanRejectionReasonDrawing = (reasonStr) => {
  if (!reasonStr) return "Not Applicable";
  const matches = reasonStr.match(/Drawing\s+[^:\s|\[\]()]+/gi);
  if (matches && matches.length > 0) {
    const uniqueDrawings = new Set(matches.map(m => m.replace(/Drawing\s+/i, '').trim().toUpperCase()));
    if (uniqueDrawings.size === 1) {
      return reasonStr
        .replace(/\s*-\s*Drawing\s+[^:\s|\[\]()]+:\s*/gi, ': ')
        .replace(/\s*Drawing\s+[^:\s|\[\]()]+:\s*/gi, ': ')
        .replace(/\s*\(Drawing\s+[^:\s|\[\]()]+\)/gi, '')
        .replace(/\s*Drawing\s+[^:\s|\[\]()]+\s*/gi, ' ')
        .replace(/\s*:\s*:\s*/g, ': ')
        .trim();
    }
  }
  return reasonStr;
};

export default function RailpadFinalProductCertificate({ call = {}, onBack, isViewOnly = false }) {
  const printAreaRef = useRef();
  const [data, setData] = useState({});
  const [backupData, setBackupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isESigning, setIsESigning] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const [bookSetValidation, setBookSetValidation] = useState({ isValid: false, message: null, isValidating: false });

  const user = getStoredUser();
  const isProcessCall = call?.callType === 'PROCESS' || call?.requestId?.startsWith('RPP-') || call?.callNo?.startsWith('RPP-');

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const showToast = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  useEffect(() => {
    const handlePkiStatus = async (event) => {
      const { status, message, signedData, certificateNo, fileName } = event.detail;
      showToast(message, status === 'success' ? 'success' : 'error');
      
      if (status === 'success' && signedData) {
        try {
          const callNo = call?.callNo || call?.call_no || call?.requestId;
          const currentData = dataRef.current;

          showToast("Saving IC edit details...", "info");
          if (isProcessCall) {
            await saveProcessIcEditData({
              ...currentData,
              icNumber: callNo,
              installmentNo: currentData.offeredInstNo,
              offeredInstNo: currentData.offeredInstNo,
              passedInstNo: currentData.passedInstNo
            });
          } else {
            await saveFinalIcEditData({ ...currentData, icNumber: callNo });
          }

          showToast("Uploading signed certificate...", "info");
          await uploadSignedCertificate({
            icNumber: certificateNo || callNo,
            signedData: signedData,
            fileName: fileName || `${callNo}.pdf`,
            uploadedBy: user?.userName || "Inspecting Engineer"
          });
          
          showToast("Signed certificate stored successfully!", "success");
          await delay(1000);

          try {
            console.log('🔄 Triggering workflow transition to IC_ISSUE');
            await performTransitionAction({
              workflowTransitionId: call?.workflowTransitionId || call?.id,
              requestId: call?.requestId || call?.call_no || call?.callNo,
              action: 'IC_ISSUE',
              remarks: 'Digital signature applied',
              actionBy: user?.userId || 1
            });

            showToast("Workflow status updated to IC_ISSUE!", "success");
            await delay(1000);
            onBack();
          } catch (workflowErr) {
            console.error('⚠️ Workflow update failed:', workflowErr);
            showToast("Signature uploaded, but workflow transition failed: " + workflowErr.message, "error");
          }
        } catch (err) {
          console.error("Upload error:", err);
          showToast("Signed successfully, but failed to save: " + err.message, "error");
        }
      }
    };

    window.addEventListener('pki-status', handlePkiStatus);
    return () => window.removeEventListener('pki-status', handlePkiStatus);
  }, [call, user, isProcessCall, onBack]);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        const callNo = call.callNo || call.call_no || call.requestId;
        if (!callNo) {
            throw new Error("No Call No provided.");
        }
        const fetchedData = await generateRailpadIcDetails(callNo);
        
        let dynamicSealingPattern = "";
        if (!isProcessCall) {
          try {
            const lotResults = await finalInspectionLotResultsService.getByCallNo(callNo);
            if (lotResults && lotResults.length > 0) {
              const holograms = lotResults
                .map(l => l.hologram)
                .filter(Boolean)
                .join(', ');
              if (holograms) {
                if (holograms.toUpperCase().includes("RITES HOLOGRAM")) {
                  dynamicSealingPattern = holograms;
                } else {
                  dynamicSealingPattern = `RITES HOLOGRAM FROM SL NO. ${holograms} HAS BEEN AFFIXED ON THE LEAD SEAL ,TIED WITH SEALING WIRE TO THE PACKING STRIP OF EACH CORRUGATED BOX`;
                }
              }
            }
          } catch (err) {
            console.error("Failed to fetch final inspection lot results for holograms:", err);
          }
        }

        const mappedData = {
            certificateNo: fetchedData.certificateNo || "",
            certificateDate: fetchedData.certificateDate,
            bookNo: fetchedData.bookNo || "",
            setNo: fetchedData.setNo || "",
            offeredInstNo: fetchedData.offeredInsttNo || "",
            passedInstNo: fetchedData.passedInsttNo || "",
            contractor: fetchedData.contractorName || "",
            placeOfInspection: fetchedData.placeOfInspection || "",
            contractRef: fetchedData.contractReferences + (fetchedData.latest4Amendments && fetchedData.latest4Amendments.length > 0 ? "\nUpto Latest 4 Amendments\n" + fetchedData.latest4Amendments.join("\n") : "\nUpto Latest 4 Amendments\nN/A"),
            billPayingOfficer: fetchedData.billPayingOfficer || "",
            consignee: fetchedData.consignee || "",
            purchasingAuthority: fetchedData.purchasingAuthority || "",
            itemNo: fetchedData.itemNo || "",
            description: fetchedData.descriptionOfStores || "",
            qtyOnOrder: fetchedData.quantityOnOrder || 0,
            qtyOfferedPreviously: fetchedData.cumulativeQtyOfferedPreviously || 0,
            qtyPassedPreviously: fetchedData.qtyPrevPassed || 0,
            qtyNowOffered: fetchedData.qtyNowOffered || 0,
            qtyNowPassed: fetchedData.qtyNowPassed || 0,
            qtyNowRejected: fetchedData.qtyNowRejected || 0,
            qtyStillDue: fetchedData.qtyStillDue || 0,
            noOfItemsChecked: fetchedData.noOfItemsChecked || "ONE",
            dateOfCall: fetchedData.dateOfCall || "",
            noOfVisits: fetchedData.noOfVisits || "",
            datesOfInspection: fetchedData.dateOfInspection || "",
            trRecDate: fetchedData.trRecDt || "",
            quantityNowPassedText: fetchedData.quantityNowPassedInWords || "",
            sealingPattern: dynamicSealingPattern || "RITES HOLOGRAM HAS BEEN AFFIXED ON THE LEAD SEAL ,TIED WITH SEALING WIRE TO THE PACKING STRIP OF EACH CORRUGATED BOX",
            facsimileText: "RITES HOLOGRAM SEAL",
            reasonsForRejection: fetchedData.reasonOfRejection || "Not Applicable",
            inspectingEngineer: user?.userName || "IE User",
            lotDetails: []
        };

        if (isProcessCall) {
          try {
            const processData = await getProcessInspectionResult(callNo);
            if (processData) {
              mappedData.qtyNowOffered = processData.totalManufacturedQty || 0;
              mappedData.qtyNowPassed = processData.totalAcceptedQty || 0;
              mappedData.qtyNowRejected = processData.totalRejectedQty || 0;
              
              if (processData.lotRangeFrom && processData.lotRangeTo) {
                if (String(processData.lotRangeFrom).trim() === String(processData.lotRangeTo).trim()) {
                  mappedData.lotNo = String(processData.lotRangeFrom).trim();
                } else {
                  mappedData.lotNo = `${String(processData.lotRangeFrom).trim()} to ${String(processData.lotRangeTo).trim()}`;
                }
              } else if (processData.lotRangeFrom) {
                mappedData.lotNo = String(processData.lotRangeFrom).trim();
              } else {
                mappedData.lotNo = "N/A";
              }
              
              if (processData.remarks) {
                mappedData.quantityNowPassedText = processData.remarks;
              }
              if (processData.reasonForRejection) {
                mappedData.reasonsForRejection = cleanRejectionReasonDrawing(processData.reasonForRejection);
              }
            }

            const summaryData = await getInspectionCallSummary(callNo);
            if (summaryData) {
              if (summaryData.drawingNo) {
                mappedData.drgNo = summaryData.drawingNo;
              }
            }

            mappedData.specNo = mappedData.specNo || "IRS T-55-2025 Rev.1";
            mappedData.qapNo = mappedData.qapNo || "QAP/MG/CGRSP, REV-01 Effective Date: 14.01.2026";
            mappedData.offeredInstNo = mappedData.offeredInstNo || "";
            mappedData.passedInstNo = mappedData.passedInstNo || "";
            mappedData.sealingPattern = "NA";
          } catch (err) {
            console.error("Failed to fetch process inspection result details:", err);
          }
        }

        // Attempt to fetch saved draft or final edit
        let savedEdit = null;
        if (isProcessCall) {
          savedEdit = await getProcessIcSaveChanges(callNo);
          if (!savedEdit) {
            savedEdit = await getProcessIcEditData(callNo);
          }
        } else {
          savedEdit = await getFinalIcSaveChanges(callNo);
          if (!savedEdit) {
            savedEdit = await getFinalIcEditData(callNo);
          }
        }

        const HARDCODED_SEAL = "RITES HOLOGRAM FROM SL NO. C0000599 TO C0001604 HAS BEEN AFFIXED ON THE LEAD SEAL ,TIED WITH SEALING WIRE TO THE PACKING STRIP OF EACH CORRUGATED BOX";

        if (savedEdit) {
            mappedData.bookNo = savedEdit.bookNo || mappedData.bookNo;
            mappedData.setNo = savedEdit.setNo || mappedData.setNo;
            mappedData.offeredInstNo = savedEdit.offeredInstNo || savedEdit.installmentNo || mappedData.offeredInstNo;
            mappedData.passedInstNo = savedEdit.passedInstNo || mappedData.passedInstNo;
            mappedData.contractRef = savedEdit.contractRef || mappedData.contractRef;
            mappedData.billPayingOfficer = savedEdit.billPayingOfficer || mappedData.billPayingOfficer;
            mappedData.consignee = savedEdit.consignee || mappedData.consignee;
            mappedData.purchasingAuthority = savedEdit.purchasingAuthority || mappedData.purchasingAuthority;
            mappedData.description = savedEdit.description || mappedData.description;
            mappedData.drgNo = savedEdit.drgNo || mappedData.drgNo;
            mappedData.specNo = savedEdit.specNo || mappedData.specNo;
            mappedData.qapNo = savedEdit.qapNo || mappedData.qapNo;
            mappedData.chpClNo = savedEdit.chpClNo || mappedData.chpClNo;
            mappedData.lotNo = savedEdit.lotNo || mappedData.lotNo;
            mappedData.qtyNowOffered = savedEdit.qtyNowOffered || mappedData.qtyNowOffered;
            mappedData.qtyNowPassed = savedEdit.qtyNowPassed || mappedData.qtyNowPassed;
            mappedData.qtyOfferedPreviously = savedEdit.qtyOfferedPreviously || mappedData.qtyOfferedPreviously;
            mappedData.qtyPassedPreviously = savedEdit.qtyPassedPreviously || mappedData.qtyPassedPreviously;
            mappedData.qtyNowRejected = savedEdit.qtyNowRejected || mappedData.qtyNowRejected;
            mappedData.qtyStillDue = savedEdit.qtyStillDue || mappedData.qtyStillDue;
            mappedData.quantityNowPassedText = savedEdit.quantityNowPassedText || mappedData.quantityNowPassedText;
            mappedData.noOfItemsChecked = savedEdit.noOfItemsChecked || mappedData.noOfItemsChecked;
            mappedData.datesOfInspection = savedEdit.datesOfInspection || mappedData.datesOfInspection;
            mappedData.dateOfCall = savedEdit.dateOfCall || mappedData.dateOfCall;
            mappedData.noOfVisits = savedEdit.noOfVisits || mappedData.noOfVisits;
            mappedData.trRecDate = savedEdit.trRecDate || mappedData.trRecDate;
            if (savedEdit.sealingPattern && savedEdit.sealingPattern !== HARDCODED_SEAL) {
                mappedData.sealingPattern = savedEdit.sealingPattern;
            }
            mappedData.facsimileText = savedEdit.facsimileText || mappedData.facsimileText;
            mappedData.reasonsForRejection = savedEdit.reasonsForRejection || mappedData.reasonsForRejection;
            mappedData.inspectingEngineer = savedEdit.inspectingEngineer || mappedData.inspectingEngineer;
        }

        if (isProcessCall && mappedData.reasonsForRejection) {
          mappedData.reasonsForRejection = cleanRejectionReasonDrawing(mappedData.reasonsForRejection);
        }

        setData(mappedData);
      } catch (error) {
        console.error("Error loading certificate:", error);
        showToast("Failed to load certificate details.", "error");
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, [call]);

  const handleFieldChange = (fieldName, value) => {
    setData(prev => ({ ...prev, [fieldName]: value }));
    if (fieldName === 'bookNo' || fieldName === 'setNo') {
      setBookSetValidation({ isValid: false, message: null, isValidating: false });
    }
  };

  const handleStartEdit = () => {
    setBackupData({ ...data });
    setIsEditing(true);
  };

  const handleSaveChanges = async () => {
    try {
      showToast("Saving draft changes...", "info");
      const callNo = call.callNo || call.call_no || call.requestId;
      if (isProcessCall) {
        await saveProcessIcSaveChanges({
          ...data,
          icNumber: callNo,
          installmentNo: data.offeredInstNo,
          offeredInstNo: data.offeredInstNo,
          passedInstNo: data.passedInstNo
        });
      } else {
        await saveFinalIcSaveChanges({ ...data, icNumber: callNo });
      }
      showToast("Draft changes saved successfully!", "success");
      setIsEditing(false);
    } catch (error) {
      console.error("Save Changes Error:", error);
      showToast("Failed to save changes: " + error.message, "error");
    }
  };

  const handleSaveIc = async () => {
    try {
      showToast("Saving IC details...", "info");
      const callNo = call.callNo || call.call_no || call.requestId;
      if (isProcessCall) {
        await saveProcessIcEditData({
          ...data,
          icNumber: callNo,
          installmentNo: data.offeredInstNo,
          offeredInstNo: data.offeredInstNo,
          passedInstNo: data.passedInstNo
        });
      } else {
        await saveFinalIcEditData({ ...data, icNumber: callNo });
      }
      showToast("IC saved successfully!", "success");
      setIsEditing(false);
    } catch (error) {
      console.error("Save IC Error:", error);
      showToast("Failed to save IC: " + error.message, "error");
    }
  };

  const handleCancelChanges = () => {
    if (backupData) {
      setData(backupData);
    }
    setIsEditing(false);
    showToast("Changes cancelled.", "info");
  };

  const handleVerifyBookSet = async () => {
    const bookNo = data.bookNo || '';
    const setNo = data.setNo || '';

    if (!bookNo || !setNo) {
      showToast("Please fill in both Book No. and Set No. before verifying.", "warning");
      return;
    }

    if (bookNo.length !== 4) {
      showToast("Book No. must be exactly 4 characters long.", "warning");
      return;
    }
    if (!/^\d{3}$/.test(setNo)) {
      showToast("Set No. must be exactly 3 digits.", "warning");
      return;
    }
    
    setBookSetValidation(prev => ({ ...prev, isValidating: true }));
    try {
      const empNo = user?.employeeCode || getStoredUser()?.employeeCode || "UNKNOWN";
      const statusParam = isProcessCall ? "S" : "F";
      const result = await validateBookSetNo(empNo, bookNo, setNo, statusParam);
      
      if (result.resultFlag === 1) {
        setBookSetValidation({ isValid: true, message: null, isValidating: false });
        showToast("Book No. and Set No. are valid.", "success");
      } else {
        setBookSetValidation({ isValid: false, message: result.message, isValidating: false });
        showToast(result.message || "Invalid Book/Set No.", "error");
        // Clear invalid values
        setData(prev => ({ ...prev, bookNo: '', setNo: '' }));
      }
    } catch (error) {
      setBookSetValidation({ isValid: false, message: "Verification failed.", isValidating: false });
      showToast("Error verifying Book/Set No: " + error.message, "error");
      // Clear invalid values on error too
      setData(prev => ({ ...prev, bookNo: '', setNo: '' }));
    }
  };

  const handleExport = async () => {
    if (!printAreaRef.current) return;
    try {
      showToast("Generating PDF export...", "info");
      const element = printAreaRef.current;
      const certificatePage = element.querySelector('.certificate-page') || element;

      const canvas = await html2canvas(certificatePage, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollY: -window.scrollY,
        scrollX: -window.scrollX,
        windowWidth: 1200,
        removeContainer: true,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      const certificateNo = data.certificateNo || "Railpad_IC";
      const sanitizedFilename = certificateNo.replace(/[/\\?%*:|"<>]/g, '-');
      pdf.save(`${sanitizedFilename}.pdf`);
      showToast("PDF downloaded successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to export PDF: " + err.message, "error");
    }
  };

  const handleProcessSaveIc = async () => {
    try {
      setIsESigning(true);
      
      const bookNo = data.bookNo || '';
      const setNo = data.setNo || '';

      if (!bookNo || !setNo) {
        showToast("Please enter Book No. and Set No. before saving IC.", "warning");
        setIsESigning(false);
        return;
      }

      if (bookNo.length !== 4) {
        showToast("Book No. must be exactly 4 characters long.", "warning");
        setIsESigning(false);
        return;
      }

      if (!/^\d{3}$/.test(setNo)) {
        showToast("Set No. must be exactly 3 digits.", "warning");
        setIsESigning(false);
        return;
      }

      const callNo = call.callNo || call.call_no || call.requestId;

      showToast("Saving Process IC details...", "info");
      await saveProcessIcEditData({
        ...data,
        icNumber: callNo,
        installmentNo: data.offeredInstNo,
        offeredInstNo: data.offeredInstNo,
        passedInstNo: data.passedInstNo
      });

      showToast("Process IC data saved! Updating workflow...", "info");
      await delay(500);

      try {
        console.log('🔄 Triggering workflow transition to IC_ISSUE');
        await performTransitionAction({
          workflowTransitionId: call?.workflowTransitionId || call?.id,
          requestId: call?.requestId || call?.call_no || call?.callNo,
          action: 'IC_ISSUE',
          remarks: 'Process IC Saved and Issued',
          actionBy: user?.userId || 1
        });

        showToast("Process IC saved and workflow updated successfully!", "success");
        await delay(1000);
        onBack();
      } catch (workflowErr) {
        console.error('⚠️ Workflow update failed:', workflowErr);
        showToast("IC saved, but workflow transition failed: " + workflowErr.message, "error");
      }
    } catch (error) {
      console.error("Save Process IC Error:", error);
      showToast("Failed to save Process IC: " + error.message, "error");
    } finally {
      setIsESigning(false);
    }
  };

  const handleESign = async () => {
    try {
      setIsESigning(true);
      
      const bookNo = data.bookNo || '';
      const setNo = data.setNo || '';

      if (!bookNo || !setNo) {
        showToast("Please enter Book No. and Set No. before signing.", "warning");
        setIsESigning(false);
        return;
      }

      if (bookNo.length !== 4) {
        showToast("Book No. must be exactly 4 characters long.", "warning");
        setIsESigning(false);
        return;
      }

      if (!/^\d{3}$/.test(setNo)) {
        showToast("Set No. must be exactly 3 digits.", "warning");
        setIsESigning(false);
        return;
      }

      const callNo = call.callNo || call.call_no || call.requestId;

      showToast("Saving final certificate details...", "info");
      if (isProcessCall) {
        await saveProcessIcEditData({
          ...data,
          icNumber: callNo,
          installmentNo: data.offeredInstNo,
          offeredInstNo: data.offeredInstNo,
          passedInstNo: data.passedInstNo
        });
      } else {
        await saveFinalIcEditData({ ...data, icNumber: callNo });
      }

      showToast("Generating PDF snapshot...", "info");
      await delay(300);
      
      const element = printAreaRef.current;
      const certificatePage = element.querySelector('.certificate-page') || element;

      const canvas = await html2canvas(certificatePage, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollY: -window.scrollY,
        scrollX: -window.scrollX,
        windowWidth: 1200,
        removeContainer: true,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      const pdfOutput = pdf.output('datauristring');
      const base64Pdf = pdfOutput.split(',')[1];

      if (!base64Pdf || !base64Pdf.startsWith("JVBER")) {
        throw new Error("Invalid PDF snapshot generated.");
      }

      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}+05:30`;
      const txn = "SARTHI" + Math.random().toString(16).slice(2, 10).toUpperCase();

      let sigCood = "405,118";
      let sigSize = "160,38";
      try {
        const certPage = element?.querySelector('.certificate-page') || element;
        let ieEl = certPage?.querySelector('.ie-signature-box');
        if (!ieEl && certPage) {
          const allElements = Array.from(certPage.querySelectorAll('td, div, span'));
          ieEl = allElements.find(el => el.textContent && (el.textContent.includes('Inspecting Engineer') || el.textContent.includes('निरीक्षण अभियंता')));
        }
        if (ieEl && certPage) {
          const pageRect = certPage.getBoundingClientRect();
          const ieRect = ieEl.getBoundingClientRect();
          const pdfWidth = 595.28;
          const pdfHeight = 841.89;
          const leftRatio = (ieRect.left - pageRect.left) / pageRect.width;
          const widthRatio = ieRect.width / pageRect.width;
          const bottomRatio = (pageRect.bottom - ieRect.bottom) / pageRect.height;
          const heightRatio = ieRect.height / pageRect.height;
          const pdfX = Math.round(leftRatio * pdfWidth) + 4;
          const pdfY = Math.round(bottomRatio * pdfHeight) + 4;
          const pdfW = Math.max(100, Math.round(widthRatio * pdfWidth) - 8);
          const pdfH = Math.max(30, Math.round(heightRatio * pdfHeight) - 8);
          sigCood = `${pdfX},${pdfY}`;
          sigSize = `${pdfW},${pdfH}`;
        }
      } catch (err) {
        console.error("Dynamic signature calc error:", err);
      }

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
            <cood>${sigCood}</cood>
            <size>${sigSize}</size>
          </pdf>
          <data>${base64Pdf}</data>
        </request>
      `.replace(/>\s+</g, "><").trim();

      if (typeof window.abc === 'function') {
        const fileName = (data.certificateNo || "Railpad_IC") + ".pdf";
        window.abc(xmlRequest, data.certificateNo || call.requestId || "Railpad_IC", fileName);
      } else {
        console.warn("abc signature bridge not detected. Falling back to local E-sign simulator...");
        showToast("Bridge not detected. Simulating digital signature process...", "info");
        await delay(2000);
        
        const mockEvent = new CustomEvent('pki-status', {
          detail: {
            status: 'success',
            message: 'Simulated Digital signature applied successfully!',
            signedData: 'MOCK_SIGNED_BASE64_DATA_JVBER...',
            certificateNo: data.certificateNo || "C/SECR/C26030056/AI01",
            fileName: (data.certificateNo || "Railpad_IC") + ".pdf"
          }
        });
        window.dispatchEvent(mockEvent);
      }

    } catch (error) {
      console.error("Signing Error:", error);
      showToast("Failed to sign: " + error.message, "error");
    } finally {
      setIsESigning(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <AnnexureLoader 
          title="Loading Inspection Certificate"
          subtitle="Fetching certificate data from Sarthi workflow..."
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      
      {/* Toast Notification Alert Banner */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 24px',
          borderRadius: '8px',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '14px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: notification.type === 'success' ? '#10b981' : 
                           notification.type === 'error' ? '#ef4444' : 
                           notification.type === 'warning' ? '#f59e0b' : '#3b82f6'
        }}>
          <span>{notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span>{notification.message}</span>
          <button 
            onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            style={{ background: 'none', border: 'none', color: 'white', marginLeft: '12px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Top action header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
        <button 
          onClick={onBack} 
          style={{
            padding: '8px 16px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            background: 'white',
            color: '#334155',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          ← Back to List
        </button>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!isEditing ? (
            <>
              {/* Edit Button */}
              <button
                onClick={handleStartEdit}
                disabled={isESigning}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #2563eb',
                  borderRadius: '6px',
                  background: '#2563eb',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ✎ Edit
              </button>

              {/* E-sign / Save IC Button */}
              {!isViewOnly && (
                <button
                  onClick={isProcessCall ? handleProcessSaveIc : handleESign}
                  disabled={isESigning}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    background: '#059669',
                    color: 'white',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isESigning ? (
                    <>
                      <span style={{
                        border: '2px solid #ffffff',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        width: '12px',
                        height: '12px',
                        display: 'inline-block',
                        animation: 'spin 1s linear infinite'
                      }}></span>
                      {isProcessCall ? "Saving IC..." : "Signing..."}
                    </>
                  ) : (
                    isProcessCall ? "💾 SAVE IC" : "✒️ E-SIGN IC"
                  )}
                </button>
              )}

              {/* Export PDF Button */}
              <button
                onClick={handleExport}
                disabled={isESigning}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#4f46e5',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📥 Export PDF
              </button>
            </>
          ) : (
            <>
              {/* Save Changes Button */}
              <button
                onClick={handleSaveChanges}
                disabled={isESigning}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #0284c7',
                  borderRadius: '6px',
                  background: '#0284c7',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                💾 Save Changes
              </button>

              {/* Save IC Button */}
              <button
                onClick={handleSaveIc}
                disabled={isESigning}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #059669',
                  borderRadius: '6px',
                  background: '#059669',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                💾 Save IC
              </button>

              {/* Cancel Changes Button */}
              <button
                onClick={handleCancelChanges}
                disabled={isESigning}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #dc2626',
                  borderRadius: '6px',
                  background: '#dc2626',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ❌ Cancel Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Print Container Wrapper */}
      <div 
        style={{
          background: '#e2e8f0',
          padding: '24px 0',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'center',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
          overflowX: 'auto'
        }}
      >
        <div ref={printAreaRef} style={{ background: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {isProcessCall ? (
            <RailpadProcessIc
              data={data}
              isEditing={isEditing}
              isBusy={isESigning}
              isViewOnly={isViewOnly}
              onFieldChange={handleFieldChange}
              onVerifyBookSet={handleVerifyBookSet}
              bookSetValidation={bookSetValidation}
            />
          ) : (
            <RailpadFinalIc
              data={data}
              isEditing={isEditing}
              isBusy={isESigning}
              isViewOnly={isViewOnly}
              onFieldChange={handleFieldChange}
              onVerifyBookSet={handleVerifyBookSet}
              bookSetValidation={bookSetValidation}
            />
          )}
        </div>
      </div>

    </div>
  );
}
