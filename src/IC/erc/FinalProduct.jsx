// src/IC/erc/FinalProductCertificate.jsx

import { useRef, useState } from "react";
import ErcFinalIc from "./ErcFinalIc";
import { exportToPdf } from "../../utils/exportUtils";

/**
 * FINAL PRODUCT CERTIFICATE (Wrapper)
 * Displays blank certificate with certificate number and date.
 * All fields are editable.
 *
 * - NO API calls
 * - Editable fields
 * - Print and Export functionality
 */
export default function FinalProductCertificate({ call = {}, onBack }) {
  const printAreaRef = useRef();
  const [isEditing, setIsEditing] = useState(false);
  /**
   * Transform API response to component format.
   */
  const transformCallToIC = (c) => {
    if (!c || Object.keys(c).length === 0) {
      return {
        certificateNo: call.icNo || "",
        certificateDate: new Date().toLocaleDateString('en-GB'),
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
      };
    }

    return {
      certificateNo: c.certificateNo || c.icNo || "",
      certificateDate: c.certificateDate || new Date().toLocaleDateString('en-GB'),
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
      qtyOnOrder: c.qtyOnOrder || "",
      qtyOfferedPreviously: c.qtyOfferedPreviously || "",
      qtyPassedPreviously: c.qtyPassedPreviously || "",
      qtyNowOffered: c.totalOfferedQty || c.qtyNowOffered || "",
      qtyNowPassed: c.totalAcceptedQty || c.qtyNowPassed || "",
      qtyNowRejected: c.totalRejectedQty || c.qtyNowRejected || "",
      qtyStillDue: c.qtyStillDue || "",

      noOfItemsChecked: c.noOfItemsChecked || "",
      dateOfCall: c.dateOfCall || "",
      noOfVisits: c.noOfVisits || "",
      datesOfInspection: c.datesOfInspection || "",
      trRecDate: c.trRecDate || "",
      quantityNowPassedText: c.quantityNowPassedText || "",
      sealingPattern: c.sealingPattern || "",
      facsimileText: c.facsimileText || "",
      reasonsForRejection: c.reasonsForRejection || "Not Applicable",
      inspectingEngineer: c.inspectingEngineer || "",

      lotDetails: c.lotDetails || [],
      remarks: c.remarks || "",
    };
  };

  const [data, setData] = useState(transformCallToIC(call));

  // Handle field changes when editing
  const handleFieldChange = (fieldName, value) => {
    setData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleExport = async () => {
    if (!printAreaRef.current) return;

    // Use certificate number as filename, fallback to default if not available
    const certificateNo = data.certificateNo || "FinalProductIC";
    // Sanitize filename: remove special characters that are invalid in filenames
    const sanitizedFilename = certificateNo.replace(/[/\\?%*:|"<>]/g, '-');

    await exportToPdf(printAreaRef.current, `${sanitizedFilename}.pdf`);
  };

  return (
    <div style={{ padding: 18 }}>
      {/* Top Buttons - Hidden during print */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={onBack} className="btn btn-outline">← Back</button>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={isEditing ? "btn btn-primary" : "btn btn-outline"}
          >
            {isEditing ? "✓ Done Editing" : "✎ Edit"}
          </button>
          <button onClick={() => window.print()} className="btn btn-outline">Print</button>
          <button onClick={handleExport} className="btn btn-primary">Export PDF</button>
        </div>
      </div>

      {/* Edit Mode Info */}
      {isEditing && (
        <div className="no-print" style={{ padding: 12, backgroundColor: "#fff3cd", borderRadius: 4, marginBottom: 12 }}>
          <p style={{ margin: 0, color: "#856404" }}>✎ Edit mode enabled - Click fields to edit certificate data</p>
        </div>
      )}

      {/* Printable content - Wrapped for proper print isolation */}
      <div className="certificate-print-wrapper" ref={printAreaRef}>
        <div className="certificate-page">
          <ErcFinalIc data={data} isEditing={isEditing} onFieldChange={handleFieldChange} />
        </div>
      </div>
    </div>
  );
}

