import React, { useState, useEffect, useRef } from "react";
import SleeperFinalIc from "./SleeperFinalIc";
import { apiService } from "../../../services/api";
import { getStoredUser } from '../../../services/authService';

export default function SleeperFinalProductCertificate() {
  const printAreaRef = useRef();
  const [isEditing, setIsEditing] = useState(false);
  const [isESigning, setIsESigning] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
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
                      purchasingAuthority: icData.purchasingAuthority || prev.purchasingAuthority,
                      consignee: icData.consignee || prev.consignee,
                      qtyNowOffered: icData.qtyNowOffered ? icData.qtyNowOffered.replace(/\D/g, '') : prev.qtyNowOffered, // Extract number from "Nos. - 2"
                      qtyNowRejected: icData.qtyNowRejected ? icData.qtyNowRejected.replace(/\D/g, '') : prev.qtyNowRejected,
                      qtyNowPassed: icData.qtyNowPassed ? icData.qtyNowPassed.replace(/\D/g, '') : prev.qtyNowPassed,
                      qtyStillDue: icData.qtyStillDue ? icData.qtyStillDue.replace(/\D/g, '') : prev.qtyStillDue,
                      contractor: icData.contractor || prev.contractor,
                      noOfVisits: icData.noOfVisits ? icData.noOfVisits.toString() : prev.noOfVisits,
                      dateOfCall: icData.dateOfCall || prev.dateOfCall,
                      offeredInstNo: icData.offeredInstallmentNumber ? icData.offeredInstallmentNumber.toString() : prev.offeredInstNo,
                      passedInstNo: icData.passedInstallmentNumber ? icData.passedInstallmentNumber.toString() : prev.passedInstNo,
                      contractRef: icData.contractRefAndDate || prev.contractRef,
                      billPayingOfficer: icData.billPayingOffice || prev.billPayingOfficer,
                      descriptionOfStores: icData.descriptionOfStores || prev.descriptionOfStores,
                      qtyPassedPreviously: icData.quantityPreviouslyPassed ? icData.quantityPreviouslyPassed.replace(/\D/g, '') : prev.qtyPassedPreviously,
                      qtyOfferedPreviously: icData.cumulativeQtyOfferedPreviously ? icData.cumulativeQtyOfferedPreviously.replace(/\D/g, '') : prev.qtyOfferedPreviously,
                      qtyOnOrder: icData.quantityOnOrder ? icData.quantityOnOrder.replace(/\D/g, '') : prev.qtyOnOrder,
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
  };

  const handleExport = async () => {
    window.print();
  };

  const handleBack = () => {
    sessionStorage.setItem('attendingCallActiveTab', 'issuance');
    const event = new CustomEvent('navigate', { detail: { target: 'AttendingCallDashboard' } });
    window.dispatchEvent(event);
  };

  const handleESign = async () => {
      setIsESigning(true);
      try {
          const user = getStoredUser();
          const payload = {
              workflowTransitionId: call.id || call.workflowTransitionId || call.transitionId,
              moduleId: call.moduleId || 0,
              requestId: call.requestId || call.callNo,
              action: 'IC_GENERATION',
              remarks: 'Certificate e-Signed and Generated',
              actionBy: Number(user?.userId || 0)
          };
          
          await apiService.performTransitionAction(payload);
          
          setNotification({ open: true, message: 'Certificate Generated Successfully!', severity: 'success' });
          
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
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
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
        <button onClick={handleBack} className="btn btn-outline" style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}>← Back</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', background: isEditing ? '#e0e0e0' : 'white' }}
            disabled={isESigning}
          >
            {isEditing ? "✓ Done Editing" : "✎ Edit"}
          </button>
          <button 
            disabled={isESigning}
            onClick={handleESign}
            style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#2e7d32', color: 'white', cursor: 'pointer' }}
          >
            {isESigning ? "SIGNING..." : "✒ E SIGN"}
          </button>
          <button 
            onClick={handleExport} 
            style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#1976d2', color: 'white', cursor: 'pointer' }}
            disabled={isESigning}
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      <div className="certificate-print-wrapper" ref={printAreaRef} style={{ background: 'white', padding: '40px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
        <div className="certificate-page">
          <SleeperFinalIc data={data} isEditing={isEditing} isBusy={isESigning} onFieldChange={handleFieldChange} />
        </div>
      </div>

      {notification.open && (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px',
            background: notification.severity === 'warning' ? '#ff9800' : '#4caf50',
            color: 'white',
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            zIndex: 9999
        }}>
            {notification.message}
            <button onClick={handleCloseNotification} style={{ marginLeft: '12px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
        </div>
      )}
    </div>
  );
}
