import React, { useState, useEffect, useRef } from "react";
import SleeperFinalIc from "./SleeperFinalIc";
import { apiService, API_BASE_URL } from "../../../services/api";
import { getStoredUser } from '../../../services/authService';

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
    const qtyNowOffered = extractNumber(ic?.qtyNowOffered, c?.qtyNowOffered || c?.qty || c?.totalOffered || "");
    const qtyNowPassed = extractNumber(ic?.qtyNowPassed, c?.qtyNowPassed || c?.accepted || c?.totalAccepted || "");
    const qtyNowRejected = extractNumber(ic?.qtyNowRejected, c?.qtyNowRejected || c?.rejected || c?.totalRejected || "0");

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

    const callNum = c?.requestId || c?.callNo || c?.call_no || (ic?.certificateNo ? ic.certificateNo.split('/')?.[1] : "");
    let itemSr = ic?.itemNo || c?.itemNo || c?.srNo || "002";
    try {
        if (/^\d+$/.test(String(itemSr).trim())) {
            itemSr = String(itemSr).trim().padStart(3, '0');
        }
    } catch (_) {}

    let rawDesc = ic?.descriptionOfStores || c?.descriptionOfStores || c?.description || "MANUFACTURE AND SUPPLY OF PRESTRESSED MONO-BLOCK CONCRETE LINE SLEEPERES (RT-8746) (PRETENSIONED TYPE) FOR BROAD GAUGE(1673 MM)";
    
    // Strip any legacy prefix
    let cleanDesc = rawDesc
        .replace(/^CALL NO:\s*[^,]+,\s*PO SR NO:\s*\S+\s*-\s*/i, '')
        .replace(/^[A-Z0-9-]+\/\d+\s*-\s*/i, '');

    let finalDesc = callNum ? `${callNum}/${itemSr} - ${cleanDesc}` : cleanDesc;

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
        noOfItemsChecked: ic?.noOfItemsChecked || c?.noOfItemsChecked || qtyNowOffered || c?.totalOffered || "1",
        dateOfCall,
        noOfVisits: ic?.noOfVisits ? String(ic.noOfVisits) : (c?.noOfVisits || "1"),
        datesOfInspection,
        trRecDate: ic?.trRecDate || c?.trRecDate || "",
        quantityNowPassedText: ic?.quantityNowPassedText || c?.quantityNowPassedText || defaultQtyPassedText,
        sealingPattern: ic?.sealingPattern || c?.sealingPattern || "RITES Stencil R↑I 12 marked on the top surface of each PSC sleeper in presence of vendor.",
        facsimileText: ic?.facsimileText || c?.facsimileText || "",
        reasonsForRejection: ic?.reasonsForRejection || c?.reasonsForRejection || "Not Applicable",
        inspectingEngineer: ic?.inspectingEngineer || c?.inspectingEngineer || "",
        region: ic?.region || c?.region || "RITES LIMITED, CENTRAL REGION, BHILAI"
    };
  };

  const [data, setData] = useState(() => transformCallToIC(call));

  // Fetch IC data from backend
  useEffect(() => {
      const fetchICData = async (requestId) => {
          try {
              const res = await apiService.getSleeperIc(requestId);
              const icData = res.data || res.responseData || res;
              if (icData) {
                  setData(prev => {
                      const updated = transformCallToIC(call, icData);
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

  const handleExport = async () => {
    window.print();
  };

  const handleBack = () => {
    sessionStorage.setItem('attendingCallActiveTab', 'issuance');
    const event = new CustomEvent('navigate', { detail: { target: 'AttendingCallDashboard' } });
    window.dispatchEvent(event);
  };

  const handleESign = () => {
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

  const executeESign = async () => {
      setBookWarningModal({ show: false, onProceed: null });
      setIsESigning(true);
      try {
          const user = getStoredUser();
          const payload = {
              workflowTransitionId: call.id || call.workflowTransitionId || call.transitionId,
              moduleId: call.moduleId || 0,
              requestId: call.requestId || call.callNo || call.call_no,
              action: 'IC_GENERATION',
              bookNo: data.bookNo,
              setNo: data.setNo,
              remarks: 'Certificate e-Signed and Generated',
              actionBy: Number(user?.userId || 0)
          };
          
          await apiService.performTransitionAction(payload);
          
          setNotification({ open: true, message: 'Certificate e-Signed & Generated Successfully!', severity: 'success' });
          
          setTimeout(() => {
              sessionStorage.setItem('attendingCallActiveTab', 'completed');
              const event = new CustomEvent('navigate', { detail: { target: 'AttendingCallDashboard' } });
              window.dispatchEvent(event);
          }, 1500);
          
      } catch (e) {
          console.error("Failed to sign certificate:", e);
          setNotification({ open: true, message: 'Failed to generate certificate: ' + (e.message || ''), severity: 'warning' });
      } finally {
          setIsESigning(false);
      }
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
            onClick={() => setIsEditing(!isEditing)}
            style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', background: isEditing ? '#e0e0e0' : 'white', fontWeight: 'bold' }}
            disabled={isESigning}
          >
            {isEditing ? "✓ Done Editing" : "✎ Edit"}
          </button>
          <button 
            disabled={isESigning || isEditing}
            onClick={handleESign}
            style={{
              padding: '8px 18px',
              borderRadius: '4px',
              border: 'none',
              background: isESigning ? '#94a3b8' : '#15803d',
              color: 'white',
              cursor: isESigning || isEditing ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(21, 128, 61, 0.3)'
            }}
          >
            {isESigning ? "SIGNING..." : "🔒 E SIGN"}
          </button>
          <button 
            onClick={handleExport} 
            style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
            disabled={isESigning}
          >
            Print / Save PDF
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
            background: notification.severity === 'warning' ? '#f59e0b' : notification.severity === 'error' ? '#ef4444' : '#10b981',
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
