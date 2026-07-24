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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const numberToWords = (num) => {
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

export default function RailpadFinalProductCertificate({ call = {}, onBack, isViewOnly = false }) {
  const printAreaRef = useRef();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isESigning, setIsESigning] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const [bookSetValidation, setBookSetValidation] = useState({ isValid: false, message: null, isValidating: false });

  const user = getStoredUser();
  const isProcessCall = call?.callType === 'PROCESS' || call?.requestId?.startsWith('RPP-') || call?.callNo?.startsWith('RPP-');

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
          showToast("Uploading signed certificate...", "info");
          await uploadSignedCertificate({
            icNumber: certificateNo,
            signedData: signedData,
            fileName: fileName,
            uploadedBy: "Inspecting Engineer"
          });
          
          showToast("Signed certificate stored successfully!", "success");
          await delay(1000);

          try {
            console.log('🔄 Triggering workflow transition to IC_ISSUE');
            await performTransitionAction({
              workflowTransitionId: call?.workflowTransitionId || call?.id,
              requestId: call?.requestId || call?.call_no,
              action: 'IC_ISSUE',
              remarks: 'Digital signature applied (Mocked)',
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
  }, [call, user]);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        const callNo = call.callNo || call.call_no || call.requestId;
        if (!callNo) {
            throw new Error("No Call No provided.");
        }
        const fetchedData = await generateRailpadIcDetails(callNo);
        
        // Map backend DTO to frontend props if needed or pass directly if keys match.
        // If keys are different, map them here. The DTO uses camelCase keys matching the frontend mostly.
        const mappedData = {
            certificateNo: fetchedData.certificateNo || "", // from somewhere else or hardcoded
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
            sealingPattern: "RITES HOLOGRAM FROM SL NO. C0000599 TO C0001604 HAS BEEN AFFIXED ON THE LEAD SEAL ,TIED WITH SEALING WIRE TO THE PACKING STRIP OF EACH CORRUGATED BOX",
            facsimileText: "RITES HOLOGRAM SEAL",
            reasonsForRejection: fetchedData.reasonOfRejection || "Not Applicable",
            inspectingEngineer: user?.userName || "IE User",
            // Lot details could be fetched from call if needed, otherwise empty.
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
                mappedData.lotNo = `${processData.lotRangeFrom} to ${processData.lotRangeTo}`;
              } else {
                mappedData.lotNo = "N/A";
              }
              
              if (processData.remarks) {
                mappedData.quantityNowPassedText = processData.remarks;
              }
              if (processData.reasonForRejection) {
                mappedData.reasonsForRejection = processData.reasonForRejection;
              }
            }

            const summaryData = await getInspectionCallSummary(callNo);
            if (summaryData) {
              if (summaryData.drawingNo) {
                mappedData.drgNo = summaryData.drawingNo;
              }
            }

            // Default dummy values for Spec. No. and QAP No. (user can edit manually)
            mappedData.specNo = mappedData.specNo || "IRS T-55-2025 Rev.1";
            mappedData.qapNo = mappedData.qapNo || "QAP/MG/CGRSP, REV-01 Effective Date: 14.01.2026";
            mappedData.offeredInstNo = mappedData.offeredInstNo || "2nd & Final";
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
          // Map installmentNo back to offeredInstNo for the component
          if (savedEdit && savedEdit.installmentNo) {
            savedEdit.offeredInstNo = savedEdit.installmentNo;
          }
        } else {
          savedEdit = await getFinalIcSaveChanges(callNo);
          if (!savedEdit) {
            savedEdit = await getFinalIcEditData(callNo);
          }
        }

        if (savedEdit) {
            // Merge saved fields
            mappedData.bookNo = savedEdit.bookNo || mappedData.bookNo;
            mappedData.setNo = savedEdit.setNo || mappedData.setNo;
            mappedData.offeredInstNo = savedEdit.offeredInstNo || mappedData.offeredInstNo;
            mappedData.passedInstNo = savedEdit.passedInstNo || mappedData.passedInstNo;
            mappedData.contractRef = savedEdit.contractRef || mappedData.contractRef;
            mappedData.billPayingOfficer = savedEdit.billPayingOfficer || mappedData.billPayingOfficer;
            mappedData.consignee = savedEdit.consignee || mappedData.consignee;
            mappedData.purchasingAuthority = savedEdit.purchasingAuthority || mappedData.purchasingAuthority;
            mappedData.description = savedEdit.description || mappedData.description;
            mappedData.qtyOfferedPreviously = savedEdit.qtyOfferedPreviously || mappedData.qtyOfferedPreviously;
            mappedData.qtyPassedPreviously = savedEdit.qtyPassedPreviously || mappedData.qtyPassedPreviously;
            mappedData.qtyNowRejected = savedEdit.qtyNowRejected || mappedData.qtyNowRejected;
            mappedData.qtyStillDue = savedEdit.qtyStillDue || mappedData.qtyStillDue;
            mappedData.quantityNowPassedText = savedEdit.quantityNowPassedText || mappedData.quantityNowPassedText;
            mappedData.noOfItemsChecked = savedEdit.noOfItemsChecked || mappedData.noOfItemsChecked;
            mappedData.datesOfInspection = savedEdit.datesOfInspection || mappedData.datesOfInspection;
            mappedData.trRecDate = savedEdit.trRecDate || mappedData.trRecDate;
            mappedData.sealingPattern = savedEdit.sealingPattern || mappedData.sealingPattern;
            mappedData.facsimileText = savedEdit.facsimileText || mappedData.facsimileText;
            mappedData.reasonsForRejection = savedEdit.reasonsForRejection || mappedData.reasonsForRejection;
            mappedData.inspectingEngineer = savedEdit.inspectingEngineer || mappedData.inspectingEngineer;
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

  const handleSaveChanges = async () => {
    try {
      showToast("Saving draft...", "info");
      const callNo = call.callNo || call.call_no || call.requestId;
      if (isProcessCall) {
        await saveProcessIcSaveChanges({ ...data, icNumber: callNo, installmentNo: data.offeredInstNo });
      } else {
        await saveFinalIcSaveChanges({ ...data, icNumber: callNo });
      }
      showToast("Draft saved successfully!", "success");
      setIsEditing(false);
    } catch (error) {
      console.error("Save Changes Error:", error);
      showToast("Failed to save changes: " + error.message, "error");
    }
  };

  const handleVerifyBookSet = async () => {
    if (!data.bookNo || !data.setNo) {
      showToast("Please fill Book No. and Set No. first.", "warning");
      return;
    }
    
    setBookSetValidation(prev => ({ ...prev, isValidating: true }));
    try {
      const empNo = user?.employeeCode || "IE-AVINISH";
      const result = await validateBookSetNo(empNo, data.bookNo, data.setNo, "F");
      
      if (result.resultFlag === 1) {
        setBookSetValidation({ isValid: true, message: null, isValidating: false });
        showToast("Book and Set number validated successfully!", "success");
      } else {
        setBookSetValidation({ isValid: false, message: result.message, isValidating: false });
        showToast(result.message || "Invalid Book/Set No.", "error");
        setData(prev => ({ ...prev, bookNo: '', setNo: '' }));
      }
    } catch (error) {
      setBookSetValidation({ isValid: false, message: "Verification failed.", isValidating: false });
      showToast("Verification failed: " + error.message, "error");
      setData(prev => ({ ...prev, bookNo: '', setNo: '' }));
    }
  };

  const handleExport = async () => {
    if (!printAreaRef.current) return;
    try {
      showToast("Generating PDF export...", "info");
      const element = printAreaRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      
      const certificateNo = data.certificateNo || "Railpad_IC";
      const sanitizedFilename = certificateNo.replace(/[/\\?%*:|"<>]/g, '-');
      pdf.save(`${sanitizedFilename}.pdf`);
      showToast("PDF downloaded successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to export PDF", "error");
    }
  };

  const handleESign = async () => {
    try {
      setIsESigning(true);
      
      if (!data.bookNo || !data.setNo) {
        showToast("Please enter Book No. and Set No. before signing.", "warning");
        setIsESigning(false);
        return;
      }

      const callNo = call.callNo || call.call_no || call.requestId;

      showToast("Saving final certificate details...", "info");
      if (isProcessCall) {
        await saveProcessIcEditData({ ...data, icNumber: callNo, installmentNo: data.offeredInstNo });
      } else {
        await saveFinalIcEditData({ ...data, icNumber: callNo });
      }

      showToast("Generating PDF snapshot...", "info");
      
      // Delay slightly for render cycles
      await delay(300);
      
      const element = printAreaRef.current;
      const canvas = await html2canvas(element, { scale: 1.5, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      
      const pdfOutput = pdf.output('datauristring');
      const base64Pdf = pdfOutput.split(',')[1];

      if (!base64Pdf || !base64Pdf.startsWith("JVBER")) {
        throw new Error("Invalid PDF snapshot generated.");
      }

      // Generate Capricorn signing XML
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}+05:30`;
      const txn = "SARTHI" + Math.random().toString(16).slice(2, 10).toUpperCase();

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
            <cood>425,175</cood>
            <size>110,40</size>
          </pdf>
          <data>${base64Pdf}</data>
        </request>
      `.replace(/>\s+</g, "><").trim();

      // Trigger local bridge, or simulate if not loaded
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
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

        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Edit / Save Draft Toggle */}
          <button
            onClick={isEditing ? handleSaveChanges : () => setIsEditing(true)}
            disabled={isESigning}
            style={{
              padding: '8px 16px',
              border: isEditing ? '1px solid #2563eb' : '1px solid #cbd5e1',
              borderRadius: '6px',
              background: isEditing ? '#2563eb' : 'white',
              color: isEditing ? 'white' : '#334155',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {isEditing ? (isViewOnly ? "💾 Save Book/Set No" : "💾 Save Changes") : (isViewOnly ? "✎ Edit Book/Set No" : "✎ Edit IC Details")}
          </button>

          {/* E-sign Button */}
          {!isViewOnly && (
            <button
              onClick={handleESign}
              disabled={isESigning || isEditing}
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
                  Signing...
                </>
              ) : "✒️ E-SIGN IC"}
            </button>
          )}

          {/* Export PDF Button */}
          <button
            onClick={handleExport}
            disabled={isESigning || isEditing}
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
