import React, { useState, useEffect, useRef } from "react";
import SleeperFinalIc from "./SleeperFinalIc";

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
      certificateNo: call?.certificateNo || call?.icNo || "C/SECR/C26060000/HKS",
      certificateDate: new Date().toLocaleDateString('en-GB'),
      bookNo: "051",
      setNo: "014",
      offeredInstNo: "1",
      passedInstNo: "1",
      purchasingAuthority: call?.purchasingAuthority || "M/s HILL BROW METALLICS & CONSTRUCTION PVT. LTD./RAIGARH",
      poNo: call?.poNo || call?.po_no || "HILL-BROW/IRCON/25-26/39",
      contractRef: "Upto Latest 4 Amendments\nSECR/HQ/Engg/TS/Stores/UV/WD Sleeper 24/02/2026\nUN/BC/220426-I 22/04/2026\nSECR/HQ/Engg/TS/PSC/UV/Pvt.Supply/Pt.III/ 13/04/2026\nMCR/HQ/Engg/TS/CSO/B-20201R 29/02/2026",
      billPayingOfficer: "HILL BROW METALLICS & CONSTRUCTIONS PVT. LTD./RAIGARH (NOTE INSPECTION FEES TO BE BORNE BY SECR/BILASPUR)",
      contractor: call?.vendorName || call?.vendorCode || call?.contractor || "M/S UNIVAN SLEEPERS PVT LTD BADHINA TOLA NEAR RPF BARRACK DONGARGARH 491445 RAJNANDGAON",
      placeOfInspection: call?.placeOfInspection || "M/S UNIVAN SLEEPERS PVT LTD BADHINA TOLA NEAR RPF BARRACK DONGARGARH 491445 RAJNANDGAON",
      consignee: call?.consignee || "HILL BROW METALLICS & CONSTRUCTION PVT. LTD./RAIGARH",
      itemNo: "1",
      descriptionOfStores: call?.description || "SL. NO. 1 - ORDINARY SLEEPER T-2496",
      qtyOnOrder: call?.qtyOnOrder || "10000",
      qtyOfferedPreviously: call?.qtyOfferedPreviously || "NIL",
      qtyPassedPreviously: call?.qtyPassedPreviously || "NIL",
      qtyNowOffered: call?.qtyNowOffered || call?.qty || "960",
      qtyNowPassed: call?.qtyNowPassed || call?.accepted || "959",
      qtyNowRejected: call?.qtyNowRejected || call?.rejected || "1",
      qtyStillDue: call?.qtyStillDue || "9041",
      quantityNowPassedText: "QUANTITY NOW PASSED NINE HUNDRED FIFTY NINE NUMBERS ONLY AND ONE NUMBER IS REJECTED DURING INSPECTION AS DETAILED IN ANNEXURE - I TO IC ATTACHED. CASTING BATCH NO. 2474, 2478, 2480, 2482, 2486, 2489, 2491, 2496, 2499, 2502, 2504, 2513, 2514, 2519, 2520, 2521, 2524, 2526, 2528, 2530, 2534, 2536, 2539, 2540, 2542, 2544.",
      noOfItemsChecked: "ONE",
      dateOfCall: "26/04/2026, 27/04/2026",
      noOfVisits: "ONE",
      datesOfInspection: "30/04/2026",
      trRecDate: "",
      sealingPattern: "RITES STENCIL \"R T-L.S\" MARKED ON THE TOP SURFACE OF EACH PSC SLEEPER IN PRESENCE OF VENDOR..",
      facsimileText: "",
      reasonsForRejection: "ONE NUMBER IS REJECTED DURING INSPECTION AS DETAILED IN ANNEXURE - I TO IC ATTACHED.",
      inspectingEngineer: ""
  });

  // Update data when call object is loaded
  useEffect(() => {
      if (call && Object.keys(call).length > 0) {
          setData(prev => ({
              ...prev,
              certificateNo: call.certificateNo || call.icNo || (call.workflowTransitionId ? `C/SECR/C${call.workflowTransitionId}/HKS` : prev.certificateNo),
              certificateDate: prev.certificateDate,
              poNo: call.poNo || call.po_no || call.po || prev.poNo,
              contractor: call.vendorName || call.vendorCode || call.contractor || prev.contractor,
              qtyNowOffered: call.qtyNowOffered || call.qty || prev.qtyNowOffered,
              qtyNowPassed: call.qtyNowPassed || call.accepted || prev.qtyNowPassed,
              qtyNowRejected: call.qtyNowRejected || call.rejected || prev.qtyNowRejected,
          }));
      }
  }, [call]);

  const handleFieldChange = (fieldName, value) => {
    setData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleExport = async () => {
    window.print();
  };

  const handleBack = () => {
    const event = new CustomEvent('navigate', { detail: { target: 'AttendingCallDashboard' } });
    window.dispatchEvent(event);
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
            onClick={() => { setNotification({ open: true, message: 'Digital signature not yet configured for Sleeper IE', severity: 'warning' }) }}
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
