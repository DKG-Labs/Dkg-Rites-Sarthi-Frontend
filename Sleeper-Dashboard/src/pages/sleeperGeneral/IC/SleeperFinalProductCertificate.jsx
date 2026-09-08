import React, { useState, useEffect, useRef } from "react";
import SleeperFinalIc from "./SleeperFinalIc";
import { apiService, API_BASE_URL } from "../../../services/api";
import { getStoredUser } from '../../../services/authService';
import { exportToPdf, generatePdfBase64, calculateSignatureCoords } from "../../../utils/exportUtils";
import { 
  uploadSignedCertificate, 
  saveFinalIcEditData, 
  saveFinalIcSaveChanges, 
  getFinalIcSaveChanges, 
  getFinalIcEditData 
} from "../../../services/certificateService";

const numberToWords = (num) => {
    num = parseFloat(num) || 0;
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

const formatDate = (val) => {
    if (!val) return "";
    if (typeof val === 'string' && /^\d{2}\.\d{2}\.\d{4}$/.test(val.trim())) return val.trim();
    try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return String(val);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    } catch {
        return String(val);
    }
};

const extractNumber = (val, fallback = "") => {
    if (val === null || val === undefined || val === "") return fallback;
    if (typeof val === 'number') return Math.round(val).toString();
    const str = String(val).trim();
    const parts = str.split('-');
    const numPart = parts.length > 1 ? parts[parts.length - 1].trim() : str;
    const parsed = parseFloat(numPart.replace(/[^0-9.-]/g, ''));
    if (isNaN(parsed)) return str.replace(/\D/g, '') || fallback;
    return Math.round(parsed).toString();
};

const resolveSleeperCaseNo = (rawCaseNo, rio) => {
    if (!rawCaseNo || !String(rawCaseNo).trim()) return null;
    const parts = String(rawCaseNo).split(',').map(s => s.trim()).filter(Boolean);
    const cleanRio = (rio || (typeof localStorage !== 'undefined' ? (localStorage.getItem('plantRio') || localStorage.getItem('rio')) : '')) || '';
    if (cleanRio && String(cleanRio).trim()) {
        const firstLetter = String(cleanRio).trim().charAt(0).toUpperCase();
        const matched = parts.find(p => p.toUpperCase().startsWith(firstLetter));
        if (matched) return matched;
    }
    return parts[0] || null;
};

export default function SleeperFinalProductCertificate() {
  const printAreaRef = useRef();
  const [isEditing, setIsEditing] = useState(false);
  const [isESigning, setIsESigning] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [bookSetValidation, setBookSetValidation] = useState({ isValid: null, message: null, isValidating: false });
  const [bookWarningModal, setBookWarningModal] = useState({ show: false, onProceed: null });
  const [call, setCall] = useState({});

  useEffect(() => {
    try {
        const storedCallStr = localStorage.getItem('selectedICCall') || sessionStorage.getItem('activeInspectionCall');
        if (storedCallStr) {
            setCall(JSON.parse(storedCallStr));
        }
    } catch (e) {
        console.error('Error parsing stored call:', e);
    }
  }, []);

  const handleCloseNotification = () => setNotification({ ...notification, open: false });

  const transformCallToIC = (c, ic = null) => {
    const qtyOnOrder = extractNumber(ic?.quantityOnOrder, c?.qtyOnOrder || c?.poQty || "");
    const qtyOfferedPreviously = extractNumber(ic?.cumulativeQtyOfferedPreviously, c?.qtyOfferedPreviously || "0");
    const qtyPassedPreviously = extractNumber(ic?.quantityPreviouslyPassed, c?.qtyPassedPreviously || "0");
    const qtyNowPassed = extractNumber(ic?.qtyNowPassed, c?.qtyNowPassed || c?.accepted || c?.totalAccepted || "");
    const qtyNowRejected = extractNumber(ic?.qtyNowRejected, c?.qtyNowRejected || c?.rejected || c?.totalRejected || "0");
    const sumOffered = (parseFloat(qtyNowPassed || 0) + parseFloat(qtyNowRejected || 0));
    const fallbackOffered = sumOffered > 0 ? String(sumOffered) : (c?.qtyNowOffered || c?.qtyOfferedNow || c?.totalOfferedQuantity || c?.total_offered_quantity || c?.totalOffered || c?.qty || "");
    const qtyNowOffered = extractNumber(ic?.qtyNowOffered, c?.qtyNowOffered || fallbackOffered);

    const numOrder = parseFloat(qtyOnOrder) || 0;
    const numPrevPassed = parseFloat(qtyPassedPreviously) || 0;
    const numNowPassed = parseFloat(qtyNowPassed) || 0;
    const calculatedStillDue = Math.max(0, numOrder - numPrevPassed - numNowPassed);
    const qtyStillDue = extractNumber(ic?.qtyStillDue, String(calculatedStillDue));

    // Date of call + Desired date
    let dateOfCall = ic?.dateOfCall || c?.dateOfCall || "";
    if (!dateOfCall || !dateOfCall.includes("Desired Date:")) {
        const cDate = c?.callDate || c?.createdDate || c?.date || new Date().toISOString();
        const dDate = c?.desiredInspectionDate || c?.desiredDate || cDate;
        const fmtCDate = formatDate(cDate);
        const fmtDDate = formatDate(dDate);
        dateOfCall = `${fmtCDate}, Desired Date: ${fmtDDate}`;
    }

    // Date of inspection
    let datesOfInspection = ic?.dateOfInspection || ic?.datesOfInspection || c?.datesOfInspection || c?.dateOfInspection || c?.inspectionDate || "";
    if (datesOfInspection) {
        datesOfInspection = formatDate(datesOfInspection);
    } else {
        datesOfInspection = formatDate(new Date().toISOString());
    }

    const numPassed = parseFloat(qtyNowPassed) || 0;
    const numRejected = parseFloat(qtyNowRejected) || 0;
    const mfCount = parseFloat(c?.mfCount || c?.mfTestingQty || (Array.isArray(c?.mfSleepers) ? c.mfSleepers.length : 0) || ic?.mfCount || 0) || 0;

    let batchStr = "";
    if (ic?.quantityNowPassedBatchNos) {
        batchStr = ic.quantityNowPassedBatchNos;
    } else if (c?.batchNos) {
        batchStr = c.batchNos;
    } else if (Array.isArray(c?.batches) && c.batches.length > 0) {
        batchStr = c.batches.map(b => (typeof b === 'object' ? (b.batchNo || b.batch_no || '') : b)).filter(Boolean).join(', ');
    }

    const passedWords = numberToWords(numPassed);
    let defaultQtyPassedText = `Quantity Now Passed- ${passedWords} numbers only`;
    if (mfCount > 0) {
        const mfWords = numberToWords(mfCount).toLowerCase();
        defaultQtyPassedText += ` including ${mfWords} numbers destroyed during MFT Testing. `;
    } else {
        defaultQtyPassedText += `. `;
    }

    if (numRejected > 0) {
        const rejWords = numberToWords(numRejected);
        defaultQtyPassedText += `${rejWords} numbers rejected during inspection as detailed in Annexure–I to IC attached.`;
    } else {
        defaultQtyPassedText += `Nil numbers rejected during inspection.`;
    }

    if (batchStr && String(batchStr).trim().length > 0) {
        defaultQtyPassedText += ` Casting Batch No ${batchStr.trim()}`;
    }

    const rawCaseNo = ic?.caseNo || c?.caseNo || c?.ibsCaseNo || c?.poCaseNo || "";
    const effectiveRio = ic?.rio || c?.rio || c?.plantRio || localStorage.getItem('plantRio') || "";
    const resolvedCaseNo = resolveSleeperCaseNo(rawCaseNo, effectiveRio);
    if (resolvedCaseNo && String(resolvedCaseNo).trim().length > 0) {
        defaultQtyPassedText += ` (CASE NO. ${String(resolvedCaseNo).trim()})`;
    }

    let defaultRejectionReason = "Not Applicable";
    if (numRejected > 0) {
        const rejWords = numberToWords(numRejected);
        if (mfCount > 0) {
            const mfWords = numberToWords(mfCount).toLowerCase();
            defaultRejectionReason = `${rejWords} numbers rejected during inspection and ${mfWords} number destroyed during MFT as detailed in Annexure-I to IC attached.`;
        } else {
            defaultRejectionReason = `${rejWords} numbers rejected during inspection as detailed in Annexure-I to IC attached.`;
        }
    }

    let itemSr = ic?.itemNo || c?.itemNo || c?.srNo || "001";
    try {
        if (/^\d+$/.test(String(itemSr).trim())) {
            itemSr = String(itemSr).trim().padStart(3, '0');
        }
    } catch (_) {}

    let rawDesc = ic?.descriptionOfStores || c?.descriptionOfStores || c?.description || "MANUFACTURE AND SUPPLY OF PRESTRESSED MONO-BLOCK CONCRETE LINE SLEEPERES (RT-8746) (PRETENSIONED TYPE) FOR BROAD GAUGE(1673 MM)";
    
    // Strip any legacy prefix including call numbers or old prefixes
    let cleanDesc = rawDesc
        .replace(/^CALL NO:\s*[^,]+,\s*PO SR NO:\s*\S+\s*-\s*/i, '')
        .replace(/^[A-Z0-9-]+\/\d+\s*-\s*/i, '')
        .replace(/^PO SR NO:?\s*\d+\s*-\s*/i, '')
        .replace(/^PO SR NO\s+\d+\s*-\s*/i, '');

    let finalDesc = `PO SR NO ${itemSr} - ${cleanDesc}`;

    return {
        certificateNo: ic?.certificateNo || c?.certificateNo || c?.icNo || "",
        certificateDate: ic?.date || c?.certificateDate || formatDate(new Date().toISOString()),
        bookNo: ic?.bookNo || c?.bookNo || "",
        setNo: ic?.setNo || c?.setNo || "",
        offeredInstNo: ic?.offeredInstallmentNumber ? String(ic.offeredInstallmentNumber) : (c?.offeredInstNo || "1"),
        passedInstNo: ic?.passedInstallmentNumber ? String(ic.passedInstallmentNumber) : (c?.passedInstNo || "1"),
        contractor: ic?.contractor || c?.vendorName || c?.vendorCode || c?.contractor || "",
        placeOfInspection: ic?.placeOfInspection || c?.placeOfInspection || c?.vendorName || "",
        contractRef: ic?.contractRefAndDate || c?.contractRef || (c?.poNo ? `PO NO. - ${c.poNo}` : ""),
        maNumberAndDate: ic?.maNumberAndDate || c?.maNumberAndDate || c?.maNo || "",
        billPayingOfficer: ic?.billPayingOffice || ic?.billPayingOfficer || c?.billPayingOfficer || c?.billPayOffDesc || "",
        consignee: ic?.consignee || c?.consignee || "",
        purchasingAuthority: ic?.purchasingAuthority || c?.purchasingAuthority || "",
        itemNo: itemSr,
        description: finalDesc,
        qtyOnOrder,
        qtyOfferedPreviously,
        qtyPassedPreviously,
        qtyNowOffered,
        qtyNowPassed,
        qtyNowRejected,
        qtyStillDue,
        noOfItemsChecked: ic?.noOfItemsChecked || c?.noOfItemsChecked || "1",
        dateOfCall,
        noOfVisits: ic?.noOfVisits ? String(ic.noOfVisits) : (c?.noOfVisits || "1"),
        datesOfInspection,
        trRecDate: ic?.trRecDate || c?.trRecDate || "",
        quantityNowPassedText: ic?.quantityNowPassedText || c?.quantityNowPassedText || defaultQtyPassedText,
        sealingPattern: ic?.sealingPattern || c?.sealingPattern || "RITES Stencil R↑I 12 marked on the top surface of each PSC sleeper in presence of vendor.",
        facsimileText: ic?.facsimileText || c?.facsimileText || "",
        reasonsForRejection: ic?.reasonsForRejection || c?.reasonsForRejection || defaultRejectionReason,
        inspectingEngineer: ic?.inspectingEngineer || c?.inspectingEngineer || "",
        region: ic?.region || c?.region || "RITES LIMITED, CENTRAL REGION, BHILAI"
    };
  };

  const [data, setData] = useState(() => transformCallToIC(call));

  // Fetch IC data from backend and any draft edits
  useEffect(() => {
      const fetchICData = async (requestId) => {
          try {
              const res = await apiService.getSleeperIc(requestId);
              const icData = res.data || res.responseData || res;

              let savedEdit = null;
              try {
                savedEdit = await getFinalIcSaveChanges(requestId);
                if (!savedEdit) {
                  savedEdit = await getFinalIcEditData(requestId);
                }
              } catch (_) {}

              if (icData || savedEdit) {
                  setData(prev => {
                      const updated = transformCallToIC(call, icData);
                      if (savedEdit) {
                        let cleanSavedDesc = savedEdit.description;
                        if (cleanSavedDesc && (cleanSavedDesc.includes('/') || /^[A-Z0-9-]+\/\d+/i.test(cleanSavedDesc))) {
                          cleanSavedDesc = cleanSavedDesc
                            .replace(/^CALL NO:\s*[^,]+,\s*PO SR NO:\s*\S+\s*-\s*/i, '')
                            .replace(/^[A-Z0-9-]+\/\d+\s*-\s*/i, '')
                            .replace(/^PO SR NO:?\s*\d+\s*-\s*/i, '')
                            .replace(/^PO SR NO\s+\d+\s*-\s*/i, '');
                          cleanSavedDesc = `PO SR NO ${updated.itemNo || "001"} - ${cleanSavedDesc}`;
                        }

                        return {
                          ...prev,
                          ...updated,
                          bookNo: savedEdit.bookNo || updated.bookNo || prev.bookNo,
                          setNo: savedEdit.setNo || updated.setNo || prev.setNo,
                          offeredInstNo: savedEdit.offeredInstallmentNo || updated.offeredInstNo || prev.offeredInstNo,
                          passedInstNo: savedEdit.passedInstallmentNo || updated.passedInstNo || prev.passedInstNo,
                          consignee: savedEdit.consignee || updated.consignee || prev.consignee,
                          qtyOfferedPreviously: savedEdit.cummQtyOfferedPrev || updated.qtyOfferedPreviously || prev.qtyOfferedPreviously,
                          qtyPassedPreviously: savedEdit.qtyPrevPassed || updated.qtyPassedPreviously || prev.qtyPassedPreviously,
                          qtyStillDue: savedEdit.qtyStillDue || updated.qtyStillDue || prev.qtyStillDue,
                          maNumberAndDate: savedEdit.maNumberAndDate || updated.maNumberAndDate || prev.maNumberAndDate,
                          purchasingAuthority: savedEdit.purchasingAuthority || updated.purchasingAuthority || prev.purchasingAuthority,
                          description: cleanSavedDesc || updated.description || prev.description,
                          trRecDate: savedEdit.trRecDate || updated.trRecDate || prev.trRecDate,
                          noOfVisits: savedEdit.noOfVisits || updated.noOfVisits || prev.noOfVisits,
                          datesOfInspection: savedEdit.datesOfInspection || updated.datesOfInspection || prev.datesOfInspection,
                          sealingPattern: savedEdit.sealingPattern || updated.sealingPattern || prev.sealingPattern,
                          reasonsForRejection: (savedEdit.reasonsForRejection && savedEdit.reasonsForRejection !== 'Not Applicable') ? savedEdit.reasonsForRejection : (updated.reasonsForRejection || prev.reasonsForRejection),
                        };
                      }
                      return {
                          ...prev,
                          ...updated,
                          certificateNo: updated.certificateNo || prev.certificateNo,
                          certificateDate: updated.certificateDate || prev.certificateDate,
                          bookNo: updated.bookNo || prev.bookNo,
                          setNo: updated.setNo || prev.setNo,
                      };
                  });
              }
          } catch (e) {
              console.error('Failed to fetch IC data:', e);
          }
      };

      if (call && Object.keys(call).length > 0) {
          setData(prev => ({
              ...prev,
              ...transformCallToIC(call)
          }));

          const requestId = call.requestId || call.callNo || call.call_no;
          if (requestId) {
              fetchICData(requestId);
          }
      }
  }, [call]);

  // PKI Digital Signature Status Listener
  useEffect(() => {
    const handlePkiStatus = async (event) => {
      const { status, message, signedData, certificateNo, fileName } = event.detail;
      setNotification({ open: true, message, severity: status === 'success' ? 'success' : 'error' });

      if (status === 'success' && signedData) {
        try {
          const user = getStoredUser();
          const targetIcNo = certificateNo || data.certificateNo || call.callNo || call.call_no || call.requestId;
          const cleanBase64 = typeof signedData === 'string' && signedData.includes(',') ? signedData.split(',')[1] : signedData;
          const outFileName = fileName || `${(targetIcNo || "Sleeper_IC").replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;

          // Step 1: Auto-download the signed IC PDF locally
          if (cleanBase64 && cleanBase64.startsWith('JVBER')) {
            try {
              const byteCharacters = atob(cleanBase64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'application/pdf' });
              const blobUrl = URL.createObjectURL(blob);
              const downloadLink = document.createElement('a');
              downloadLink.href = blobUrl;
              downloadLink.download = outFileName;
              document.body.appendChild(downloadLink);
              downloadLink.click();
              document.body.removeChild(downloadLink);
              setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            } catch (dlErr) {
              console.warn("⚠️ Auto-download PDF error:", dlErr);
            }
          }

          // Step 2: Save IC edit changes to DB
          setNotification({ open: true, message: "Saving IC details...", severity: "info" });
          try {
            await saveFinalIcEditData({
              icNumber: targetIcNo,
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
              manufacturer: data.contractor || data.placeOfInspection,
              trRecDate: data.trRecDate,
              noOfVisits: data.noOfVisits,
              datesOfInspection: data.datesOfInspection,
              sealingPattern: data.sealingPattern,
              reasonsForRejection: data.reasonsForRejection,
              facsimileText: data.facsimileText,
              inspectingEngineer: data.inspectingEngineer,
              createdBy: user?.userId ? String(user.userId) : "Inspecting Engineer",
              updatedBy: user?.userId ? String(user.userId) : "Inspecting Engineer"
            });
          } catch (saveErr) {
            console.warn("⚠️ Failed to persist final IC edits:", saveErr);
          }

          // Step 3: Trigger workflow transition API to IC_GENERATION
          setNotification({ open: true, message: "Updating workflow status...", severity: "info" });
          console.log('🔄 Triggering workflow transition to IC_GENERATION');
          const payload = {
            workflowTransitionId: call.id || call.workflowTransitionId || call.transitionId,
            moduleId: call.moduleId || 0,
            requestId: call.requestId || call.callNo || call.call_no,
            action: 'IC_GENERATION',
            bookNo: data.bookNo,
            setNo: data.setNo,
            remarks: 'Digital signature applied and IC generated',
            actionBy: Number(user?.userId || 0)
          };
          await apiService.performTransitionAction(payload);
          console.log('✅ Workflow transition to IC_GENERATION succeeded');

          // Step 4: When workflow API is successful, save signed PDF to Azure Blob Storage
          setNotification({ open: true, message: "Workflow updated. Storing signed certificate in Azure...", severity: "info" });
          await uploadSignedCertificate({
            icNumber: targetIcNo,
            signedData: cleanBase64,
            fileName: outFileName,
            uploadedBy: user?.fullName || user?.loginId || user?.employeeCode || "Inspecting Engineer"
          });

          setNotification({ open: true, message: "Certificate e-Signed, Generated & Saved to Azure Successfully!", severity: "success" });

          setTimeout(() => {
            sessionStorage.setItem('attendingCallActiveTab', 'completed');
            const navEvent = new CustomEvent('navigate', { detail: { target: 'Completed Calls' } });
            window.dispatchEvent(navEvent);
          }, 1500);
        } catch (err) {
          console.error("E-Sign processing error:", err);
          setNotification({ open: true, message: "Failed during E-Sign processing: " + err.message, severity: "error" });
        } finally {
          setIsESigning(false);
        }
      } else {
        setIsESigning(false);
      }
    };

    window.addEventListener('pki-status', handlePkiStatus);
    return () => window.removeEventListener('pki-status', handlePkiStatus);
  }, [call, data]);

  const handleFieldChange = (fieldName, value) => {
    setData(prev => {
      const updated = { ...prev, [fieldName]: value };
      if (['qtyOnOrder', 'qtyPassedPreviously', 'qtyNowPassed', 'qtyOfferedPreviously'].includes(fieldName)) {
        const order = parseFloat(updated.qtyOnOrder) || 0;
        const prevPassed = parseFloat(updated.qtyPassedPreviously) || 0;
        const nowPassed = parseFloat(updated.qtyNowPassed) || 0;
        updated.qtyStillDue = String(Math.max(0, order - prevPassed - nowPassed));
      }
      return updated;
    });

    if (fieldName === 'bookNo' || fieldName === 'setNo') {
      setBookSetValidation({ isValid: null, message: null, isValidating: false });
    }
  };

  const handleVerifyBookSet = async () => {
    if (!data.bookNo || !data.setNo) {
      setNotification({ open: true, message: "Please fill in both Book No. and Set No. before verifying.", severity: 'warning' });
      return;
    }

    if (!/^\d{3}$/.test(data.setNo)) {
      setNotification({ open: true, message: "Set No. must be exactly 3 digits (e.g. 001).", severity: 'warning' });
      return;
    }

    setBookSetValidation(prev => ({ ...prev, isValidating: true }));
    try {
      const user = getStoredUser();
      const empNo = user?.employeeCode || "UNKNOWN";
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/ibs-validation/validate-book-set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          EMP_NO: empNo,
          BK_NO: data.bookNo,
          SET_NO: data.setNo,
          STATUS: "F"
        })
      });
      
      const resData = await response.json().catch(() => ({ resultFlag: 1, message: "Valid" }));
      if (resData.resultFlag === 1 || resData.status === 'SUCCESS' || resData.valid) {
        setBookSetValidation({ isValid: true, message: null, isValidating: false });
        setNotification({ open: true, message: "Book No. and Set No. are valid.", severity: 'success' });
      } else {
        setBookSetValidation({ isValid: false, message: resData.message || "Invalid Book/Set No.", isValidating: false });
        setNotification({ open: true, message: resData.message || "Invalid Book/Set No.", severity: 'error' });
      }
    } catch (e) {
      setBookSetValidation({ isValid: true, message: null, isValidating: false });
      setNotification({ open: true, message: "Book No. and Set No. format verified.", severity: 'success' });
    }
  };

  const handleSaveChanges = async () => {
    try {
      const user = getStoredUser();
      const icNo = data.certificateNo || call.requestId || call.callNo || call.call_no || "Sleeper_IC";
      await saveFinalIcSaveChanges({
        icNumber: icNo,
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
        manufacturer: data.contractor || data.placeOfInspection,
        trRecDate: data.trRecDate,
        noOfVisits: data.noOfVisits,
        datesOfInspection: data.datesOfInspection,
        sealingPattern: data.sealingPattern,
        reasonsForRejection: data.reasonsForRejection,
        facsimileText: data.facsimileText,
        inspectingEngineer: data.inspectingEngineer,
        createdBy: user?.userId ? String(user.userId) : "Inspecting Engineer",
        updatedBy: user?.userId ? String(user.userId) : "Inspecting Engineer"
      });
      setNotification({ open: true, message: "Changes saved successfully as draft!", severity: 'success' });
      setIsEditing(false);
    } catch (e) {
      console.error("Failed to save changes:", e);
      setNotification({ open: true, message: "Failed to save draft changes: " + e.message, severity: 'error' });
    }
  };

  const handleExport = async () => {
    if (!printAreaRef.current) return;
    try {
      if (isEditing) {
        setIsEditing(false);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      setNotification({ open: true, message: "Exporting PDF...", severity: 'info' });
      const certificateNo = data.certificateNo || call.requestId || call.callNo || "Sleeper_IC";
      const sanitizedFilename = certificateNo.replace(/[/\\?%*:|"<>]/g, '-') + '.pdf';
      await exportToPdf(printAreaRef.current, sanitizedFilename);
      setNotification({ open: true, message: "PDF downloaded successfully!", severity: 'success' });
    } catch (err) {
      console.error("Export error:", err);
      window.print();
    }
  };

  const handleBack = () => {
    sessionStorage.setItem('attendingCallActiveTab', 'issuance');
    const event = new CustomEvent('navigate', { detail: { target: 'Issuance of IC' } });
    window.dispatchEvent(event);
  };

  const executeESign = async () => {
    setBookWarningModal({ show: false, onProceed: null });
    try {
      setIsESigning(true);

      if (isEditing) {
        setIsEditing(false);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setNotification({ open: true, message: "Generating PDF snapshot for digital signature...", severity: 'info' });
      await new Promise(resolve => setTimeout(resolve, 300));

      const element = printAreaRef.current;
      const base64Pdf = await generatePdfBase64(element);
      if (!base64Pdf || !base64Pdf.startsWith('JVBER')) {
        throw new Error('Failed to generate PDF snapshot from UI.');
      }

      const callNo = call.requestId || call.callNo || call.call_no || "Sleeper_IC";
      const certificateNo = data.certificateNo || callNo;
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
        setNotification({ open: true, message: "Please complete digital signature in Capricorn bridge...", severity: 'info' });
        window.abc(xmlRequest, certificateNo || callNo, sanitizedFilename);
      } else {
        throw new Error("Digital signature bridge (abc.js) not found. Please ensure the PKI client is running.");
      }

    } catch (error) {
      console.error("E-Sign error:", error);
      setNotification({ open: true, message: "Failed to initiate digital signature: " + error.message, severity: 'error' });
      setIsESigning(false);
    }
  };

  const isBookNoPresent = Boolean(data.bookNo && String(data.bookNo).trim());
  const isSetNoPresent = Boolean(data.setNo && String(data.setNo).trim());
  const isESignDisabled = isESigning || isEditing || !isBookNoPresent || !isSetNoPresent;

  const handleESign = () => {
    if (isESignDisabled) return;

    if (!data.bookNo || !data.setNo) {
      setNotification({ open: true, message: "Please fill in both 'Book No.' and 'Set No.' before signing.", severity: 'warning' });
      return;
    }

    if (!/^\d{3}$/.test(data.setNo)) {
      setNotification({ open: true, message: "Set No. must be exactly 3 digits (e.g. 001).", severity: 'warning' });
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

  return (
    <div style={{ padding: '24px', maxWidth: '850px', margin: '0 auto' }}>
      <style>
        {`
          @media print {
            @page { size: A4 portrait; margin: 10mm 8mm 15mm 8mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print, .main-header, .sidebar { display: none !important; }
            .certificate-print-wrapper { padding: 0 !important; box-shadow: none !important; margin: 0 !important; }
            .sleeper-ic-page { padding: 0 !important; width: 100% !important; }
            .main-content-wrapper, .main-content { padding: 0 !important; margin: 0 !important; overflow: visible !important; }
          }
        `}
      </style>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={handleBack} className="btn btn-outline" style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', background: 'white' }}>← Back</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={isEditing ? handleSaveChanges : () => setIsEditing(true)}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '4px', 
              border: isEditing ? '1px solid #2563eb' : '1px solid #ccc', 
              cursor: isESigning ? 'not-allowed' : 'pointer', 
              background: isEditing ? '#2563eb' : 'white', 
              color: isEditing ? 'white' : '#374151',
              fontWeight: 'bold' 
            }}
            disabled={isESigning}
          >
            {isEditing ? "Save Changes" : "✎ Edit"}
          </button>
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid #ef4444',
                cursor: isESigning ? 'not-allowed' : 'pointer',
                background: 'white',
                color: '#ef4444',
                fontWeight: 'bold'
              }}
              disabled={isESigning}
            >
              Cancel
            </button>
          )}
          <button 
            disabled={isESignDisabled}
            onClick={handleESign}
            style={{
              padding: '8px 18px',
              borderRadius: '4px',
              border: 'none',
              background: isESignDisabled ? '#94a3b8' : '#15803d',
              color: 'white',
              cursor: isESignDisabled ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isESignDisabled ? 'none' : '0 2px 4px rgba(21, 128, 61, 0.3)'
            }}
            title={
              isEditing ? "Cannot sign while in Edit mode" :
              !isBookNoPresent || !isSetNoPresent ? "Book No. and Set No. are required for E-Sign" :
              "Digitally sign Certificate"
            }
          >
            {isESigning ? "SIGNING..." : "✒ E SIGN"}
          </button>
          <button 
            onClick={handleExport} 
            style={{ 
              padding: '8px 16px', 
              borderRadius: '4px', 
              border: 'none', 
              background: isESigning || isEditing ? '#94a3b8' : '#2563eb', 
              color: 'white', 
              cursor: isESigning || isEditing ? 'not-allowed' : 'pointer', 
              fontWeight: 'bold' 
            }}
            disabled={isESigning || isEditing}
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="certificate-print-wrapper" ref={printAreaRef} style={{ background: 'white', padding: '24px 32px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
        <div className="certificate-page">
          <SleeperFinalIc 
            data={data} 
            isEditing={isEditing} 
            isBusy={isESigning} 
            onFieldChange={handleFieldChange} 
            onVerifyBookSet={handleVerifyBookSet}
            bookSetValidation={bookSetValidation}
          />
        </div>
      </div>

      {/* Book Warning Confirmation Modal */}
      {bookWarningModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
              ⚠️ Confirm Book Number
            </h3>
            <p style={{ margin: '0 0 20px 0', color: '#374151', fontSize: '14px', lineHeight: '1.5' }}>
              Book Number is generally of 4 characters (you entered <strong>{data.bookNo}</strong>). Are you sure you want to proceed with this Book Number?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setBookWarningModal({ show: false, onProceed: null })}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (bookWarningModal.onProceed) {
                    bookWarningModal.onProceed();
                  }
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#2563eb',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {notification.open && (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 24px',
            background: notification.severity === 'warning' ? '#f59e0b' : notification.severity === 'error' ? '#ef4444' : notification.severity === 'info' ? '#3b82f6' : '#10b981',
            color: 'white',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 9999,
            fontWeight: '600',
            fontSize: '14px'
        }}>
          {notification.message}
          <button 
            onClick={handleCloseNotification}
            style={{ marginLeft: '16px', background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
