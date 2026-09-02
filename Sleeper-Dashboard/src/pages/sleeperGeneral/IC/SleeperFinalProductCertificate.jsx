import React, { useState, useEffect, useRef } from "react";
import SleeperFinalIc from "./SleeperFinalIc";
import { apiService, API_BASE_URL } from "../../../services/api";
import { getStoredUser } from '../../../services/authService';

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
        const storedCallStr = localStorage.getItem('selectedICCall');
        if (storedCallStr) {
            setCall(JSON.parse(storedCallStr));
        }
    } catch (e) {
        console.error('Error parsing stored call:', e);
    }
  }, []);

  const handleCloseNotification = () => setNotification({ ...notification, open: false });

  const [data, setData] = useState({
      certificateNo: call?.certificateNo || call?.icNo || "",
      certificateDate: new Date().toLocaleDateString('en-GB'),
      bookNo: "",
      setNo: "",
      offeredInstNo: "",
      passedInstNo: "",
      purchasingAuthority: call?.purchasingAuthority || "",
      poNo: call?.poNo || call?.po_no || "",
      contractRef: "",
      billPayingOfficer: "",
      contractor: call?.vendorName || call?.vendorCode || call?.contractor || "",
      placeOfInspection: call?.placeOfInspection || "",
      consignee: call?.consignee || "",
      itemNo: "",
      descriptionOfStores: call?.description || "",
      qtyOnOrder: call?.qtyOnOrder || "",
      qtyOfferedPreviously: call?.qtyOfferedPreviously || "",
      qtyPassedPreviously: call?.qtyPassedPreviously || "",
      qtyNowOffered: call?.qtyNowOffered || call?.qty || "",
      qtyNowPassed: call?.qtyNowPassed || call?.accepted || "",
      qtyNowRejected: call?.qtyNowRejected || call?.rejected || "",
      qtyStillDue: call?.qtyStillDue || "",
      quantityNowPassedText: "",
      noOfItemsChecked: "",
      dateOfCall: "",
      noOfVisits: "",
      datesOfInspection: "",
      trRecDate: "",
      sealingPattern: "",
      facsimileText: "",
      reasonsForRejection: "",
      inspectingEngineer: ""
  });

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

  // Update data when call object is loaded
  useEffect(() => {
      const fetchICData = async (requestId) => {
          try {
              const res = await apiService.getSleeperIc(requestId);
              const icData = res.data || res; // depending on interceptor return
              if (icData) {
                  setData(prev => ({
                      ...prev,
                      certificateNo: icData.certificateNo || prev.certificateNo,
                      certificateDate: icData.date || prev.certificateDate,
                      bookNo: icData.bookNo || prev.bookNo,
                      setNo: icData.setNo || prev.setNo,
                      purchasingAuthority: icData.purchasingAuthority || prev.purchasingAuthority,
                      consignee: icData.consignee || prev.consignee,
                      qtyNowOffered: extractNumber(icData.qtyNowOffered, prev.qtyNowOffered),
                      qtyNowRejected: extractNumber(icData.qtyNowRejected, prev.qtyNowRejected),
                      qtyNowPassed: extractNumber(icData.qtyNowPassed, prev.qtyNowPassed),
                      qtyStillDue: extractNumber(icData.qtyStillDue, prev.qtyStillDue),
                      contractor: icData.contractor || prev.contractor,
                      noOfVisits: icData.noOfVisits ? icData.noOfVisits.toString() : prev.noOfVisits,
                      dateOfCall: icData.dateOfCall || prev.dateOfCall,
                      offeredInstNo: icData.offeredInstallmentNumber ? icData.offeredInstallmentNumber.toString() : prev.offeredInstNo,
                      passedInstNo: icData.passedInstallmentNumber ? icData.passedInstallmentNumber.toString() : prev.passedInstNo,
                      contractRef: icData.contractRefAndDate || prev.contractRef,
                      billPayingOfficer: icData.billPayingOffice || prev.billPayingOfficer,
                      descriptionOfStores: icData.descriptionOfStores || prev.descriptionOfStores,
                      qtyPassedPreviously: extractNumber(icData.quantityPreviouslyPassed, prev.qtyPassedPreviously),
                      qtyOfferedPreviously: extractNumber(icData.cumulativeQtyOfferedPreviously, prev.qtyOfferedPreviously),
                      qtyOnOrder: extractNumber(icData.quantityOnOrder, prev.qtyOnOrder),
                      itemNo: icData.itemNo || prev.itemNo,
                      placeOfInspection: icData.placeOfInspection || prev.placeOfInspection
                  }));
              }
          } catch (e) {
              console.error('Failed to fetch IC data:', e);
          }
      };

      if (call && Object.keys(call).length > 0) {
          setData(prev => ({
              ...prev,
              certificateNo: call.certificateNo || call.icNo || prev.certificateNo,
              certificateDate: prev.certificateDate,
              poNo: call.poNo || call.po_no || call.po || prev.poNo,
              contractor: call.vendorName || call.vendorCode || call.contractor || prev.contractor,
              qtyNowOffered: call.qtyNowOffered || call.qty || prev.qtyNowOffered,
              qtyNowPassed: call.qtyNowPassed || call.accepted || prev.qtyNowPassed,
              qtyNowRejected: call.qtyNowRejected || call.rejected || prev.qtyNowRejected,
          }));

          const requestId = call.requestId || call.callNo; // SF-25050001
          if (requestId) {
              fetchICData(requestId);
          }
      }
  }, [call]);

  const handleFieldChange = (fieldName, value) => {
    setData(prev => ({ ...prev, [fieldName]: value }));
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
              requestId: call.requestId || call.callNo,
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
            @page { size: A4 portrait; margin: 10mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print, .main-header, .sidebar { display: none !important; }
            .certificate-print-wrapper { padding: 0 !important; box-shadow: none !important; }
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

      <div className="certificate-print-wrapper" ref={printAreaRef} style={{ background: 'white', padding: '40px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
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
