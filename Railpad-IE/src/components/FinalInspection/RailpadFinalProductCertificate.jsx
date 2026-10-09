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
import { generatePdfBase64, calculateSignatureCoords, exportToPdf } from "../../utils/exportUtils";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to format Lot No (e.g. if '1 to 1', display as '1')
export const formatLotNo = (val) => {
  if (!val) return "";
  const str = String(val).trim();
  const match = str.match(/^(.+?)\s+to\s+(.+)$/i);
  if (match) {
    const from = match[1].trim();
    const to = match[2].trim();
    if (from.toLowerCase() === to.toLowerCase()) {
      return from;
    }
  }
  return str;
};

// Helper to aggregate rejection reasons by reason and count without batch numbers and leading '#'
export const aggregateRejectionReasons = (reasonStr) => {
  if (!reasonStr) return "Not Applicable";
  let cleaned = String(reasonStr).trim();
  if (['NOT APPLICABLE', 'N/A', 'NA', 'NONE', ''].includes(cleaned.toUpperCase())) {
    return "Not Applicable";
  }

  if (cleaned.startsWith('#')) {
    cleaned = cleaned.substring(1).trim();
  }
  if (cleaned.toLowerCase().startsWith('reason of rejection:')) {
    cleaned = cleaned.substring('reason of rejection:'.length).trim();
  } else if (cleaned.toLowerCase().startsWith('reasons for rejection:')) {
    cleaned = cleaned.substring('reasons for rejection:'.length).trim();
  }

  const countsMap = new Map();
  const pattern1 = /([A-Za-z0-9\s/_\-]+?)\s*\(\s*(\d+)(?:\s*(?:Nos|nos|nos\.|Qty|qty|units|pieces|pcs))?\s*\)/gi;
  let match;
  let matchedCount = 0;

  while ((match = pattern1.exec(cleaned)) !== null) {
    let rawReason = match[1].trim();
    const qty = parseInt(match[2], 10);

    rawReason = rawReason.replace(/^[\[\]|:;\s]+/, '');
    rawReason = rawReason.replace(/^Drawing\s+[^:\s|\[\]()]+:\s*/i, '').trim();

    if (rawReason && !rawReason.toLowerCase().startsWith('batch') && !isNaN(qty)) {
      const key = rawReason.toLowerCase();
      if (countsMap.has(key)) {
        countsMap.get(key).count += qty;
      } else {
        countsMap.set(key, { name: rawReason, count: qty });
      }
      matchedCount++;
    }
  }

  if (matchedCount === 0) {
    const pattern2 = /:\s*(\d+)\s*(?:Nos|nos)?\s*-\s*\[(.*?)\]/gi;
    while ((match = pattern2.exec(cleaned)) !== null) {
      const qty = parseInt(match[1], 10);
      let rawReason = match[2].trim();
      rawReason = rawReason.replace(/^Drawing\s+[^:\s|\[\]()]+:\s*/i, '').trim();
      if (rawReason && !isNaN(qty)) {
        const key = rawReason.toLowerCase();
        if (countsMap.has(key)) {
          countsMap.get(key).count += qty;
        } else {
          countsMap.set(key, { name: rawReason, count: qty });
        }
        matchedCount++;
      }
    }
  }

  if (countsMap.size > 0) {
    return Array.from(countsMap.values())
      .map(item => `${item.name} (${item.count})`)
      .join(', ');
  }

  return cleaned || "Not Applicable";
};

const cleanRejectionReasonDrawing = (reasonStr) => {
  return aggregateRejectionReasons(reasonStr);
};

export default function RailpadFinalProductCertificate({ call = {}, onBack, isViewOnly = false }) {
  const printAreaRef = useRef();
  const [data, setData] = useState({});
  const [backupData, setBackupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isESigning, setIsESigning] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const [bookSetValidation, setBookSetValidation] = useState({ isValid: null, message: null, isValidating: false });
  const [bookWarningModal, setBookWarningModal] = useState({ show: false, onProceed: null });
  const [showSignMethodModal, setShowSignMethodModal] = useState(false);
  const [showManualUploadModal, setShowManualUploadModal] = useState(false);
  const [selectedManualFile, setSelectedManualFile] = useState(null);
  const [isUploadingManual, setIsUploadingManual] = useState(false);
  const [manualUploadError, setManualUploadError] = useState(null);
  const [isDraggingManualFile, setIsDraggingManualFile] = useState(false);
  const manualFileInputRef = useRef(null);

  const user = getStoredUser();
  const callIdentifier = String(call?.requestId || call?.callNo || call?.call_no || '');
  const isProcessCall = (call?.callType && String(call.callType).toUpperCase() === 'PROCESS') || callIdentifier.toUpperCase().startsWith('RPP-');

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
          const targetIcNo = certificateNo || currentData.certificateNo || callNo;
          if (isProcessCall) {
            await saveProcessIcEditData({
              ...currentData,
              icNumber: targetIcNo,
              installmentNo: currentData.offeredInstNo,
              offeredInstNo: currentData.offeredInstNo,
              passedInstNo: currentData.passedInstNo
            });
          } else {
            await saveFinalIcEditData({ ...currentData, icNumber: targetIcNo });
          }

          // Extract clean base64 data for Azure upload
          const cleanBase64 = typeof signedData === 'string' && signedData.includes(',') ? signedData.split(',')[1] : signedData;

          // =========================================================================
          // Auto-download disabled: users can download from Completed Calls tab
          // if (cleanBase64 && cleanBase64.startsWith('JVBER')) {
          //   try {
          //     const byteCharacters = atob(cleanBase64);
          //     const byteNumbers = new Array(byteCharacters.length);
          //     for (let i = 0; i < byteCharacters.length; i++) {
          //       byteNumbers[i] = byteCharacters.charCodeAt(i);
          //     }
          //     const byteArray = new Uint8Array(byteNumbers);
          //     const blob = new Blob([byteArray], { type: 'application/pdf' });
          //     const blobUrl = URL.createObjectURL(blob);
          //     const downloadLink = document.createElement('a');
          //     downloadLink.href = blobUrl;
          //     downloadLink.download = fileName || `${(certificateNo || callNo).replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
          //     document.body.appendChild(downloadLink);
          //     downloadLink.click();
          //     document.body.removeChild(downloadLink);
          //     setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          //     showToast("E-Signed IC PDF downloaded successfully!", "success");
          //   } catch (dlErr) {
          //     console.warn("⚠️ Auto-download PDF error:", dlErr);
          //   }
          // }
          // =========================================================================

          // Step 2: Store the valid PDF in Azure Blob Storage
          showToast("Uploading signed certificate to Azure...", "info");
          await uploadSignedCertificate({
            icNumber: certificateNo || callNo,
            signedData: cleanBase64,
            fileName: fileName || `${(certificateNo || callNo).replace(/[/\\?%*:|"<>]/g, '_')}.pdf`,
            uploadedBy: user?.userName || getStoredUser()?.username || "Inspecting Engineer"
          });
          
          showToast("Signed certificate stored successfully in Azure!", "success");
          await delay(800);

          // Step 3: Perform workflow transaction API
          try {
            console.log('🔄 Triggering workflow transition to GENERATE_IC');
            await performTransitionAction({
              workflowTransitionId: call?.workflowTransitionId || call?.id,
              requestId: call?.requestId || call?.call_no || call?.callNo,
              action: 'GENERATE_IC',
              remarks: 'Digital signature applied and stored in Azure',
              actionBy: user?.userId || getStoredUser()?.userId || 1
            });

            showToast("Workflow status updated successfully!", "success");
            await delay(1000);
            onBack();
          } catch (workflowErr) {
            console.error('⚠️ Workflow update failed:', workflowErr);
            showToast("Signature uploaded, but workflow transition failed: " + workflowErr.message, "error");
          }
        } catch (err) {
          console.error("Upload error:", err);
          showToast("Signed successfully, but failed to save: " + err.message, "error");
        } finally {
          setIsESigning(false);
        }
      } else {
        // E-Sign failed, was rejected or cancelled -> do NOT save edits or perform transition
        setIsESigning(false);
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
            manufacturer: fetchedData.manufacturer || fetchedData.contractorName || "",
            consigneeManufacturer: fetchedData.consigneeManufacturer || fetchedData.manufacturer || fetchedData.contractorName || "",
            placeOfInspection: fetchedData.placeOfInspection || fetchedData.manufacturer || fetchedData.contractorName || "",
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
            qapNo: fetchedData.qapNo || "",
            drgNo: fetchedData.drgNo || "",
            specNo: fetchedData.specNo || "IRS T-55-2025 Rev.1",
            inspectingEngineer: "",
            region: fetchedData.region || "",
            lotDetails: []
        };

        // Fetch region dynamically from API matching ERC
        try {
          const regionRes = await fetch(`${getBaseUrl()}/api/reports/region?callNo=${encodeURIComponent(callNo)}`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
            }
          });
          if (regionRes.ok) {
            const regionJson = await regionRes.json();
            if (regionJson && regionJson.responseData) {
              mappedData.region = regionJson.responseData;
            }
          }
        } catch (e) {
          console.error("Failed to fetch region dynamically:", e);
        }

        if (isProcessCall) {
          try {
            const processData = await getProcessInspectionResult(callNo);
            if (processData) {
              const mfg = processData.totalManufacturedQty || 0;
              const rej = processData.totalRejectedQty || 0;
              const maxAcc = Math.max(0, mfg - rej);
              const acc = (processData.totalAcceptedQty !== undefined && processData.totalAcceptedQty !== null)
                ? processData.totalAcceptedQty
                : maxAcc;
              const finalAcc = (rej > 0 && acc > maxAcc) ? maxAcc : acc;

              mappedData.qtyNowOffered = mfg;
              mappedData.qtyNowPassed = finalAcc;
              mappedData.qtyNowRejected = rej;
              mappedData.offeredSets = processData.offeredSets;
              mappedData.acceptedSets = processData.acceptedSets;
              mappedData.rejectedSets = processData.rejectedSets;
              
              if (processData.lotRangeFrom && processData.lotRangeTo) {
                if (String(processData.lotRangeFrom).trim().toLowerCase() === String(processData.lotRangeTo).trim().toLowerCase()) {
                  mappedData.lotNo = String(processData.lotRangeFrom).trim();
                } else {
                  mappedData.lotNo = `${String(processData.lotRangeFrom).trim()} to ${String(processData.lotRangeTo).trim()}`;
                }
              } else if (processData.lotRangeFrom) {
                mappedData.lotNo = String(processData.lotRangeFrom).trim();
              } else {
                mappedData.lotNo = "N/A";
              }
              mappedData.lotNo = formatLotNo(mappedData.lotNo);
              
              if (processData.remarks) {
                mappedData.quantityNowPassedText = processData.remarks;
              }
              if (processData.reasonForRejection) {
                mappedData.reasonsForRejection = aggregateRejectionReasons(processData.reasonForRejection);
              }
            }

            const summaryData = await getInspectionCallSummary(callNo);
            if (summaryData) {
              if (summaryData.drawingNo) {
                mappedData.drgNo = summaryData.drawingNo;
              }
            }

            mappedData.specNo = mappedData.specNo || "IRS T-55-2025 Rev.1";
            mappedData.qapNo = fetchedData?.qapNo || mappedData.qapNo || "";
            mappedData.offeredInstNo = mappedData.offeredInstNo || "";
            mappedData.passedInstNo = mappedData.passedInstNo || "";
            mappedData.sealingPattern = "NA";
          } catch (err) {
            console.error("Failed to fetch process inspection result details:", err);
          }
        }

        // Attempt to fetch saved draft or final edit
        const lookupIcNo = mappedData.certificateNo || callNo;
        let savedEdit = null;
        if (isProcessCall) {
          savedEdit = await getProcessIcSaveChanges(lookupIcNo);
          if (!savedEdit && lookupIcNo !== callNo) {
            savedEdit = await getProcessIcSaveChanges(callNo);
          }
          if (!savedEdit) {
            savedEdit = await getProcessIcEditData(lookupIcNo);
          }
          if (!savedEdit && lookupIcNo !== callNo) {
            savedEdit = await getProcessIcEditData(callNo);
          }
        } else {
          savedEdit = await getFinalIcSaveChanges(lookupIcNo);
          if (!savedEdit && lookupIcNo !== callNo) {
            savedEdit = await getFinalIcSaveChanges(callNo);
          }
          if (!savedEdit) {
            savedEdit = await getFinalIcEditData(lookupIcNo);
          }
          if (!savedEdit && lookupIcNo !== callNo) {
            savedEdit = await getFinalIcEditData(callNo);
          }
        }

        const HARDCODED_SEAL = "RITES HOLOGRAM FROM SL NO. C0000599 TO C0001604 HAS BEEN AFFIXED ON THE LEAD SEAL ,TIED WITH SEALING WIRE TO THE PACKING STRIP OF EACH CORRUGATED BOX";

        if (savedEdit) {
            mappedData.bookNo = savedEdit.bookNo || mappedData.bookNo;
            mappedData.setNo = savedEdit.setNo || mappedData.setNo;
            mappedData.certificateDate = savedEdit.certificateDate || mappedData.certificateDate;
            mappedData.contractor = savedEdit.contractor || mappedData.contractor;
            mappedData.manufacturer = savedEdit.manufacturer || mappedData.manufacturer;
            mappedData.consigneeManufacturer = savedEdit.consigneeManufacturer || mappedData.consigneeManufacturer;
            mappedData.placeOfInspection = savedEdit.placeOfInspection || mappedData.placeOfInspection;
            mappedData.offeredInstNo = savedEdit.offeredInstNo || savedEdit.installmentNo || mappedData.offeredInstNo;
            mappedData.passedInstNo = savedEdit.passedInstNo || mappedData.passedInstNo;
            if (savedEdit.contractRef) {
              let sRef = savedEdit.contractRef;
              if (fetchedData?.contractReferences) {
                const sRefLines = sRef.split('\n');
                const firstLine = sRefLines[0] || "";
                if (firstLine.toUpperCase().startsWith("PO NO.") || !firstLine.includes('/') || (fetchedData.contractReferences.includes('/') && !firstLine.startsWith(fetchedData.contractReferences.split('/')[0]))) {
                  sRefLines[0] = fetchedData.contractReferences;
                  sRef = sRefLines.join('\n');
                }
              }
              mappedData.contractRef = sRef;
            }
            mappedData.billPayingOfficer = savedEdit.billPayingOfficer || mappedData.billPayingOfficer;
            mappedData.consignee = savedEdit.consignee || mappedData.consignee;
            mappedData.purchasingAuthority = savedEdit.purchasingAuthority || mappedData.purchasingAuthority;
            mappedData.description = savedEdit.description || mappedData.description;
            mappedData.drgNo = savedEdit.drgNo || mappedData.drgNo;
            if (savedEdit.qapNo) {
              let finalQap = savedEdit.qapNo;
              if (!finalQap.toUpperCase().includes("EFFECTIVE DATE") && fetchedData?.qapNo && fetchedData.qapNo.toUpperCase().includes("EFFECTIVE DATE")) {
                const effMatch = fetchedData.qapNo.match(/Effective Date:\s*[\d./-]+/i);
                if (effMatch) {
                  finalQap = `${finalQap.replace(/,\s*$/, '')}, ${effMatch[0]}`;
                }
              }
              mappedData.qapNo = finalQap;
            }
            mappedData.chpClNo = savedEdit.chpClNo || mappedData.chpClNo;
            mappedData.lotNo = formatLotNo(savedEdit.lotNo || mappedData.lotNo);
            mappedData.qtyNowOffered = savedEdit.qtyNowOffered ?? mappedData.qtyNowOffered;
            mappedData.qtyNowPassed = savedEdit.qtyNowPassed ?? mappedData.qtyNowPassed;
            mappedData.qtyOfferedPreviously = savedEdit.qtyOfferedPreviously ?? mappedData.qtyOfferedPreviously;
            mappedData.qtyPassedPreviously = savedEdit.qtyPassedPreviously ?? mappedData.qtyPassedPreviously;
            mappedData.qtyNowRejected = savedEdit.qtyNowRejected ?? mappedData.qtyNowRejected;
            mappedData.qtyStillDue = savedEdit.qtyStillDue ?? mappedData.qtyStillDue;
            mappedData.quantityNowPassedText = savedEdit.quantityNowPassedText || mappedData.quantityNowPassedText;
            mappedData.noOfItemsChecked = savedEdit.noOfItemsChecked || mappedData.noOfItemsChecked;
            mappedData.datesOfInspection = savedEdit.datesOfInspection || mappedData.datesOfInspection;
            mappedData.dateOfCall = savedEdit.dateOfCall || mappedData.dateOfCall;
            mappedData.noOfVisits = savedEdit.noOfVisits ?? mappedData.noOfVisits;
            mappedData.trRecDate = savedEdit.trRecDate || mappedData.trRecDate;
            if (savedEdit.sealingPattern && savedEdit.sealingPattern !== HARDCODED_SEAL) {
                mappedData.sealingPattern = savedEdit.sealingPattern;
            }
            mappedData.facsimileText = savedEdit.facsimileText || mappedData.facsimileText;
            mappedData.reasonsForRejection = savedEdit.reasonsForRejection || mappedData.reasonsForRejection;
            mappedData.inspectingEngineer = savedEdit.inspectingEngineer || mappedData.inspectingEngineer;
            mappedData.region = savedEdit.region || mappedData.region;
        }

        const possibleCallIds = Array.from(new Set([
          callNo,
          call?.callNo,
          call?.call_no,
          call?.requestId,
          call?.id ? String(call.id) : null
        ].filter(Boolean)));

        let savedNcrOffered = null;
        let savedNcrAccepted = null;
        let savedNcrRejected = null;
        for (const cid of possibleCallIds) {
          const o = localStorage.getItem(`railpad_ncr_sets_offered_${cid}`);
          const a = localStorage.getItem(`railpad_ncr_sets_accepted_${cid}`);
          const r = localStorage.getItem(`railpad_ncr_sets_rejected_${cid}`);
          if (o !== null && o !== '' && !savedNcrOffered) savedNcrOffered = o;
          if (a !== null && a !== '' && !savedNcrAccepted) savedNcrAccepted = a;
          if (r !== null && r !== '' && !savedNcrRejected) savedNcrRejected = r;
        }

        const callSets = call?.noOfSets || call?.no_of_sets || fetchedData?.noOfSets || fetchedData?.no_of_sets;
        if (!savedNcrOffered && callSets) {
          savedNcrOffered = String(callSets);
        }

        const isNcrgrspCall = (mappedData.description && (mappedData.description.toUpperCase().includes("NCR") || mappedData.description.toUpperCase().includes("NYLON CORD") || mappedData.description.toUpperCase().includes("9790"))) ||
          (call?.railPadType && (call.railPadType.toUpperCase().includes("NCR") || call.railPadType.toUpperCase().includes("NYLON CORD"))) ||
          (call?.railpadType && (call.railpadType.toUpperCase().includes("NCR") || call.railpadType.toUpperCase().includes("NYLON CORD"))) ||
          (fetchedData?.railPadType && (fetchedData.railPadType.toUpperCase().includes("NCR") || fetchedData.railPadType.toUpperCase().includes("NYLON CORD"))) ||
          (fetchedData?.ercType && (fetchedData.ercType.toUpperCase().includes("NCR") || fetchedData.ercType.toUpperCase().includes("NYLON CORD"))) ||
          (callSets !== undefined && callSets !== null && callSets !== '' && callSets !== 0 && callSets !== '0') ||
          Boolean(savedNcrOffered);

        if (isNcrgrspCall) {
          mappedData.isNCRGRSP = true;
          mappedData.unit = "Set";
          if (!isProcessCall) {
            if (savedNcrOffered !== null && savedNcrOffered !== '') {
              mappedData.qtyNowOffered = savedNcrOffered;
            }
            if (savedNcrAccepted !== null && savedNcrAccepted !== '') {
              mappedData.qtyNowPassed = savedNcrAccepted;
            }
            if (savedNcrRejected !== null && savedNcrRejected !== '') {
              mappedData.qtyNowRejected = savedNcrRejected;
            }
          } else {
            if (mappedData.offeredSets === undefined || mappedData.offeredSets === null) {
              if (savedNcrOffered !== null && savedNcrOffered !== '') mappedData.offeredSets = savedNcrOffered;
              else if (callSets) mappedData.offeredSets = String(callSets);
            }
            if (mappedData.acceptedSets === undefined || mappedData.acceptedSets === null) {
              if (savedNcrAccepted !== null && savedNcrAccepted !== '') mappedData.acceptedSets = savedNcrAccepted;
            }
            if (mappedData.rejectedSets === undefined || mappedData.rejectedSets === null) {
              if (savedNcrRejected !== null && savedNcrRejected !== '') mappedData.rejectedSets = savedNcrRejected;
            }
          }
        }

        if (isProcessCall && mappedData.reasonsForRejection) {
          mappedData.reasonsForRejection = aggregateRejectionReasons(mappedData.reasonsForRejection);
        }
        if (mappedData.lotNo) {
          mappedData.lotNo = formatLotNo(mappedData.lotNo);
        }

        const effectiveCaseNo = fetchedData.caseNo || mappedData.caseNo;
        if (effectiveCaseNo && mappedData.quantityNowPassedText && !mappedData.quantityNowPassedText.toUpperCase().includes("CASE NO")) {
          const caseText = `, (CASE NO. ${effectiveCaseNo})`;
          mappedData.quantityNowPassedText = mappedData.quantityNowPassedText.trim() + caseText;
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
      setBookSetValidation({ isValid: null, message: null, isValidating: false });
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
      const targetIcNo = data.certificateNo || callNo;
      if (isProcessCall) {
        await saveProcessIcSaveChanges({
          ...data,
          icNumber: targetIcNo,
          installmentNo: data.offeredInstNo,
          offeredInstNo: data.offeredInstNo,
          passedInstNo: data.passedInstNo
        });
      } else {
        await saveFinalIcSaveChanges({ ...data, icNumber: targetIcNo });
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
      const targetIcNo = data.certificateNo || callNo;
      if (isProcessCall) {
        await saveProcessIcEditData({
          ...data,
          icNumber: targetIcNo,
          installmentNo: data.offeredInstNo,
          offeredInstNo: data.offeredInstNo,
          passedInstNo: data.passedInstNo
        });
      } else {
        await saveFinalIcEditData({ ...data, icNumber: targetIcNo });
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

  const executeVerifyBookSet = async () => {
    const bookNo = data.bookNo || '';
    const setNo = data.setNo || '';

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

  const handleVerifyBookSet = () => {
    const bookNo = data.bookNo || '';
    const setNo = data.setNo || '';

    if (!bookNo || !setNo) {
      showToast("Please fill in both Book No. and Set No. before verifying.", "warning");
      return;
    }

    if (!/^\d{3}$/.test(setNo)) {
      showToast("Set No. must be exactly 3 digits.", "warning");
      return;
    }

    if (bookNo.trim().length < 4) {
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

      const imgData = canvas.toDataURL('image/jpeg', 0.80);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'SLOW');
      
      const certificateNo = data.certificateNo || "Railpad_IC";
      const sanitizedFilename = certificateNo.replace(/[/\\?%*:|"<>]/g, '-');
      pdf.save(`${sanitizedFilename}.pdf`);
      showToast("PDF downloaded successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to export PDF: " + err.message, "error");
    }
  };

  const executeProcessSaveIc = async () => {
    try {
      setIsESigning(true);
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

  const handleProcessSaveIc = () => {
    const bookNo = data.bookNo || '';
    const setNo = data.setNo || '';

    if (!bookNo || !setNo) {
      showToast("Please enter Book No. and Set No. before saving IC.", "warning");
      return;
    }

    if (!/^\d{3}$/.test(setNo)) {
      showToast("Set No. must be exactly 3 digits.", "warning");
      return;
    }

    if (!bookSetValidation?.isValid) {
      showToast("Please Verify the Book No. and Set No. before saving.", "warning");
      return;
    }

    if (bookNo.trim().length < 4) {
      setBookWarningModal({
        show: true,
        onProceed: executeProcessSaveIc
      });
      return;
    }

    executeProcessSaveIc();
  };

  const executeESign = async () => {
    try {
      setIsESigning(true);
      showToast("Generating PDF snapshot...", "info");
      await delay(300);
      
      const element = printAreaRef.current;
      const base64Pdf = await generatePdfBase64(element);
      if (!base64Pdf || !base64Pdf.startsWith('JVBER')) {
        throw new Error('Failed to generate PDF snapshot from UI.');
      }

      const callNo = call.callNo || call.call_no || call.requestId;
      const certificateNo = data.certificateNo || "Railpad_IC";
      const sanitizedFilename = certificateNo.replace(/[/\\?%*:|"<>]/g, '-') + '.pdf';
      
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}+05:30`;
      const txn = Math.random().toString(16).slice(2, 10).toUpperCase();

      const sigCoords = calculateSignatureCoords(element, "395,160", "170,36");

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

      if (typeof window.abc === 'function') {
        showToast("Please complete the digital signature in the Capricorn bridge...", "info");
        window.abc(xmlRequest, certificateNo || callNo, sanitizedFilename);
      } else {
        throw new Error("Digital signature bridge (abc.js) not found. Please ensure the Capricorn client is running.");
      }

    } catch (error) {
      console.error("E-Sign error:", error);
      showToast("Failed to prepare document for signing: " + error.message, "error");
      setIsESigning(false);
    }
  };

  const handleDownloadForSigning = async () => {
    if (!printAreaRef.current) return;
    try {
      showToast("Generating unsigned Process IC PDF...", "info");
      const targetIcNo = data.certificateNo || call.callNo || call.requestId || "ProcessMaterialIC";
      const sanitizedFilename = targetIcNo.replace(/[/\\?%*:|"<>]/g, '-');
      await exportToPdf(printAreaRef.current, `${sanitizedFilename}_unsigned.pdf`);
      showToast("Process IC downloaded. Please sign and upload below.", "success");
    } catch (err) {
      console.error("PDF generation error:", err);
      showToast("Failed to download PDF for signing: " + err.message, "error");
    }
  };

  const handleManualFileSelect = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setManualUploadError("Only PDF files (.pdf) are supported.");
      setSelectedManualFile(null);
      return;
    }
    if (file.size === 0) {
      setManualUploadError("Selected file is empty.");
      setSelectedManualFile(null);
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setManualUploadError("File size exceeds 25MB limit.");
      setSelectedManualFile(null);
      return;
    }
    setManualUploadError(null);
    setSelectedManualFile(file);
  };

  const handleFinalizeManualSignedIC = async () => {
    if (!selectedManualFile) {
      setManualUploadError("Please select a signed PDF file before submitting.");
      return;
    }

    if (!data?.bookNo || !data?.setNo) {
      setManualUploadError("Please ensure both Book No. and Set No. are filled before finalizing.");
      return;
    }

    setIsUploadingManual(true);
    setManualUploadError(null);

    try {
      const callNo = call?.callNo || call?.call_no || call?.requestId;
      const targetIcNo = data.certificateNo || callNo || "Railpad_Process_IC";
      const fileName = `${targetIcNo.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;

      // 1. Save IC edit details in backend
      showToast("Saving IC details to database...", "info");
      await saveProcessIcEditData({
        ...data,
        icNumber: targetIcNo,
        installmentNo: data.offeredInstNo,
        offeredInstNo: data.offeredInstNo,
        passedInstNo: data.passedInstNo
      });

      // 2. Read file as base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(selectedManualFile);
      });

      const cleanBase64 = typeof base64Data === 'string' && base64Data.includes(',') 
        ? base64Data.split(',')[1] 
        : base64Data;

      // 3. Upload to Azure Blob Storage
      showToast("Uploading signed Process IC to Azure...", "info");
      await uploadSignedCertificate({
        icNumber: targetIcNo,
        signedData: cleanBase64,
        fileName: fileName,
        uploadedBy: user?.userName || getStoredUser()?.username || "Inspecting Engineer"
      });

      // 4. Auto-download signed copy for IE's records
      try {
        const blob = new Blob([selectedManualFile], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } catch (e) {
        console.warn("Auto-download error:", e);
      }

      // 5. Workflow transition
      showToast("Updating workflow status...", "info");
      try {
        await performTransitionAction({
          workflowTransitionId: call?.workflowTransitionId || call?.id,
          requestId: call?.requestId || call?.call_no || call?.callNo,
          action: 'GENERATE_IC',
          remarks: 'Manual Process IC uploaded and stored in Azure',
          actionBy: user?.userId || getStoredUser()?.userId || 1
        });

        showToast("Process IC uploaded & workflow updated successfully!", "success");
        setShowManualUploadModal(false);
        await delay(800);
        onBack();
      } catch (workflowErr) {
        console.error('Workflow update failed:', workflowErr);
        showToast("Certificate saved, but workflow transition failed: " + workflowErr.message, "error");
      }
    } catch (err) {
      console.error("Manual IC upload error:", err);
      setManualUploadError(err.message || "Failed to upload manual IC.");
      showToast("Failed to upload manual IC: " + err.message, "error");
    } finally {
      setIsUploadingManual(false);
    }
  };

  const handleESign = () => {
    const bookNo = data.bookNo || '';
    const setNo = data.setNo || '';

    if (!bookNo || !setNo) {
      showToast("Please enter Book No. and Set No. before signing.", "warning");
      return;
    }

    if (!/^\d{3}$/.test(setNo)) {
      showToast("Set No. must be exactly 3 digits.", "warning");
      return;
    }

    if (!bookSetValidation?.isValid) {
      showToast("Please Verify the Book No. and Set No. before signing.", "warning");
      return;
    }

    const startSignFlow = () => {
      if (isProcessCall) {
        setShowSignMethodModal(true);
      } else {
        executeESign();
      }
    };

    if (bookNo.trim().length < 4) {
      setBookWarningModal({
        show: true,
        onProceed: startSignFlow
      });
      return;
    }

    startSignFlow();
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

      {/* Styles for E-sign Tooltip */}
      <style>{`
        .esign-tooltip-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .esign-tooltip {
          visibility: hidden;
          opacity: 0;
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background-color: #1e293b;
          color: #ffffff;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          z-index: 9999;
          transition: opacity 0.2s ease, visibility 0.2s ease, transform 0.2s ease;
          pointer-events: none;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .esign-tooltip::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: #1e293b transparent transparent transparent;
        }
        .esign-tooltip-wrapper:hover .esign-tooltip {
          visibility: visible;
          opacity: 1;
          transform: translateX(-50%) translateY(-2px);
        }
      `}</style>

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

              {/* E-sign Button (For both Process IC and Final IC) */}
              {!isViewOnly && (
                (() => {
                  const hasBookAndSet = Boolean(
                    data?.bookNo && String(data.bookNo).trim().length > 0 &&
                    data?.setNo && String(data.setNo).trim().length > 0
                  );
                  const isESignDisabled = isESigning || !hasBookAndSet;

                  return (
                    <div className="esign-tooltip-wrapper">
                      <button
                        onClick={handleESign}
                        disabled={isESignDisabled}
                        style={{
                          padding: '8px 16px',
                          border: 'none',
                          borderRadius: '6px',
                          background: isESignDisabled ? '#94a3b8' : '#059669',
                          color: 'white',
                          fontWeight: '700',
                          cursor: isESignDisabled ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          opacity: isESignDisabled ? 0.75 : 1,
                          transition: 'all 0.2s ease',
                          boxShadow: isESignDisabled ? 'none' : '0 2px 4px rgba(5, 150, 105, 0.2)'
                        }}
                        title={!hasBookAndSet ? "Book No. and Set No. are required to E-Sign." : ""}
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
                            Signing...
                          </>
                        ) : (
                          "✒️ E-SIGN IC"
                        )}
                      </button>

                      {!hasBookAndSet && !isESigning && (
                        <div className="esign-tooltip">
                          <span>⚠️</span>
                          <span>Please enter Book No. & Set No. before E-Signing</span>
                        </div>
                      )}
                    </div>
                  );
                })()
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

      {/* ─── Modal 1: Select Signing Method (Digital vs Manual) ─── */}
      {showSignMethodModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '560px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            animation: 'fadeInUp 0.25s ease-out'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(to right, #f8fafc, #ffffff)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '18px' }}>✒️</span>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                    Choose Signing Method
                  </h3>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#0284c7',
                    background: '#e0f2fe',
                    padding: '2px 8px',
                    borderRadius: '9999px'
                  }}>
                    Process IC
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                  Select how you want to sign and finalize this Inspection Certificate
                </p>
              </div>
              <button
                onClick={() => setShowSignMethodModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            {/* Options Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Option 1: Digital Sign */}
              <div
                onClick={() => {
                  setShowSignMethodModal(false);
                  executeESign();
                }}
                style={{
                  padding: '18px 20px',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  background: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#0284c7';
                  e.currentTarget.style.background = '#f0f9ff';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(2, 132, 199, 0.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                }}
              >
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)'
                }}>
                  ✒️
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: '800', color: '#0f172a' }}>
                      Digital Sign (DSC / PKI)
                    </h4>
                    <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#059669', background: '#d1fae5', padding: '1px 6px', borderRadius: '4px' }}>
                      Automated
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                    Apply your digital signature directly via Capricorn PKI bridge and hardware USB Token.
                  </p>
                </div>
                <div style={{ fontSize: '18px', color: '#94a3b8' }}>➔</div>
              </div>

              {/* Option 2: Manual Sign */}
              <div
                onClick={() => {
                  setShowSignMethodModal(false);
                  setShowManualUploadModal(true);
                }}
                style={{
                  padding: '18px 20px',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  background: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#059669';
                  e.currentTarget.style.background = '#f0fdf4';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                }}
              >
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(5, 150, 105, 0.25)'
                }}>
                  📄
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: '800', color: '#0f172a' }}>
                      Manual Sign (Upload Signed IC)
                    </h4>
                    <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#d97706', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px' }}>
                      Upload PDF
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                    Download the Process IC PDF, sign it manually or externally, and upload the signed document.
                  </p>
                </div>
                <div style={{ fontSize: '18px', color: '#94a3b8' }}>➔</div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowSignMethodModal(false)}
                style={{
                  padding: '8px 18px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Manual Sign & Upload Modal ─── */}
      {showManualUploadModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '620px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeInUp 0.25s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(to right, #f8fafc, #ffffff)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>📄</span>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                    Upload Manually Signed Process IC
                  </h3>
                </div>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  IC No: <strong style={{ color: '#0284c7' }}>{data.certificateNo || call.callNo || call.requestId}</strong> | Book No: <strong>{data.bookNo}</strong> / Set No: <strong>{data.setNo}</strong>
                </p>
              </div>
              <button
                onClick={() => {
                  if (!isUploadingManual) {
                    setShowManualUploadModal(false);
                    setSelectedManualFile(null);
                    setManualUploadError(null);
                  }
                }}
                disabled={isUploadingManual}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#94a3b8',
                  cursor: isUploadingManual ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Step 1: Download IC for Signing */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                    fontWeight: '800',
                    flexShrink: 0
                  }}>
                    1
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                      Download Process IC PDF
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#64748b' }}>
                      Download the Process IC containing current details to sign manually or externally.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadForSigning}
                  disabled={isUploadingManual}
                  style={{
                    padding: '8px 14px',
                    background: '#ffffff',
                    border: '1px solid #0284c7',
                    color: '#0284c7',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                  onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                >
                  <span>⬇️</span> Download PDF
                </button>
              </div>

              {/* Step 2: Upload Signed IC */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#f0fdf4',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                    fontWeight: '800',
                    flexShrink: 0
                  }}>
                    2
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                      Upload Signed Process IC Document
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#64748b' }}>
                      Upload the signed PDF copy. This will be stored as the official final Process IC.
                    </p>
                  </div>
                </div>

                {/* Dropzone */}
                <input
                  type="file"
                  ref={manualFileInputRef}
                  accept=".pdf,application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleManualFileSelect(e.target.files[0]);
                    }
                  }}
                />

                <div
                  onClick={() => manualFileInputRef.current && manualFileInputRef.current.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingManualFile(true);
                  }}
                  onDragLeave={() => setIsDraggingManualFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingManualFile(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleManualFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  style={{
                    border: isDraggingManualFile ? '2px dashed #0284c7' : '2px dashed #cbd5e1',
                    background: isDraggingManualFile ? '#f0f9ff' : '#f8fafc',
                    borderRadius: '12px',
                    padding: '28px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>📄</div>
                  <p style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: '#1e293b' }}>
                    Click to browse or drag &amp; drop signed PDF here
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#94a3b8' }}>
                    Supports PDF format only (Max 25MB)
                  </p>
                </div>

                {/* Selected File Card */}
                {selectedManualFile && (
                  <div style={{
                    marginTop: '12px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <span style={{ fontSize: '20px' }}>✅</span>
                      <div style={{ overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#166534', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {selectedManualFile.name}
                        </p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#15803d' }}>
                          {(selectedManualFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedManualFile(null);
                      }}
                      disabled={isUploadingManual}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        fontSize: '16px',
                        cursor: 'pointer',
                        padding: '4px',
                        fontWeight: 'bold'
                      }}
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Error Banner */}
                {manualUploadError && (
                  <div style={{
                    marginTop: '12px',
                    background: '#fee2e2',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#991b1b',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>⚠️</span>
                    <span>{manualUploadError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <button
                type="button"
                onClick={() => {
                  if (!isUploadingManual) {
                    setShowManualUploadModal(false);
                    setSelectedManualFile(null);
                    setManualUploadError(null);
                  }
                }}
                disabled={isUploadingManual}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: isUploadingManual ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleFinalizeManualSignedIC}
                disabled={isUploadingManual || !selectedManualFile}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: (isUploadingManual || !selectedManualFile)
                    ? '#94a3b8'
                    : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '13.5px',
                  cursor: (isUploadingManual || !selectedManualFile) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: (isUploadingManual || !selectedManualFile) ? 'none' : '0 4px 12px rgba(5, 150, 105, 0.25)',
                  transition: 'all 0.2s'
                }}
              >
                {isUploadingManual ? (
                  <>
                    <span style={{
                      border: '2px solid #ffffff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      width: '14px',
                      height: '14px',
                      display: 'inline-block',
                      animation: 'spin 1s linear infinite'
                    }}></span>
                    Uploading &amp; Finalizing...
                  </>
                ) : (
                  <>
                    <span>📤</span> Submit &amp; Finalize Process IC
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
