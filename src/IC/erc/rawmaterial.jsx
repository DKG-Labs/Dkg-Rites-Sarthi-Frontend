import { useRef, useState, useEffect } from "react";
import ErcRmIC from "./ErcRmIc";
import { exportToPdf } from "../../utils/exportUtils";
import { fetchPoDataForSections } from "../../services/poDataService";

/**
 * RAW MATERIAL CERTIFICATE (Wrapper)
 * Shows EMPTY layout by default and renders API data when provided.
 *
 * - NO mock data
 * - NO default values
 * - Layout NEVER changes
 * - API integration becomes trivial
 */
export default function RawMaterialCertificate({ call = {}, onBack }) {
  const printAreaRef = useRef();
  const [poDetails, setPoDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState(null);

  useEffect(() => {
    if (call?.po_no && call?.call_no) {
      fetchPoDataForSections(call.po_no, call.call_no)
        .then(res => setPoDetails(res))
        .catch(err => console.error("Failed to load PO Details for Certificate:", err));
    }
  }, [call?.po_no, call?.call_no]);

  /**
   * Transform API response to component format.
   * KEEP IT MINIMAL: Do NOT insert default values.
   */
  const transformCallToIC = (c, po) => {
    if (!c || Object.keys(c).length === 0) return {};

    // Build proper contract ref format if po data is available
    let updatedContractRef = c.contractRef || "";
    if (po && po.rlyShortName && po.poSerialNo) {
      // Find date part from existing contractRef or fallback to poDate
      const datePart = updatedContractRef.includes("dated")
        ? updatedContractRef.split("dated")[1].trim()
        : po.poDate || "";
      // Check if poSerialNo already includes the poNo (e.g. "60256836107122/020")
      // If so, just use rlyShortName / poSerialNo
      const basePoString = po.poSerialNo.includes(po.poNo)
        ? `${po.rlyShortName} / ${po.poSerialNo}`
        : `${po.rlyShortName} / ${po.poNo} / ${po.poSerialNo}`;

      if (datePart) {
        updatedContractRef = `${basePoString} dated ${datePart}`;
      } else {
        updatedContractRef = basePoString;
      }
    }

    return {
      certificateNo: c.certificateNo || c.icNo || "",
      certificateDate: c.certificateDate || "",
      offeredInstNo: c.offeredInstNo || "",
      passedInstNo: c.passedInstNo || "",

      contractor: c.contractor || c.vendorName || c.vendor_name || "",
      manufacturer: c.manufacturer || "",
      placeOfInspection: c.placeOfInspection || c.inspectionPlace || c.place_of_inspection || "",
      contractRef: updatedContractRef,
      contractorPo: c.contractorPo || c.poNo || c.po_no || "",
      billPayingOfficer: c.billPayingOfficer || c.billOfficer || "",
      consigneeRailway: c.consigneeRailway || c.consignee || "",
      purchasingAuthority: c.purchasingAuthority || "",
      consigneeManufacturer: c.consigneeManufacturer || c.consigneeFinished || "",

      description: c.description || c.productDescription || c.productType || "",
      drgNo: c.drgNo || "",
      specNo: c.specNo || "",
      qapNo: c.qapNo || "",
      inspectionType: c.inspectionType || "",
      inspectionDetails: c.inspectionDetails || c.detailsOfInspection || "",
      chpClause: c.chpClause || "",
      contractChpReq: c.contractChpReq || "",

      result: c.result || "",

      clearedQty: (() => {
        if (c.heatDetails && Array.isArray(c.heatDetails) && c.heatDetails.length > 0) {
          let totalMt = 0;
          const lines = [];
          c.heatDetails.forEach((h) => {
            const isAccepted = h.status === "ACCEPTED" || h.status === "PARTIALLY_ACCEPTED";
            const val = parseFloat(h.weightAcceptedMt || 0);
            if (isAccepted && val > 0) {
              lines.push(`Heat no -${h.heatNo}- Qty ${val.toFixed(3)} MT`);
              totalMt += val;
            }
          });
          if (lines.length > 0) {
            return `${lines.join(",\n")},\nTotal Qty -${totalMt.toFixed(3)} MT`;
          }
        }
        return c.clearedQty || c.qtyCleared || "";
      })(),

      qtyRejected: (() => {
        if (c.heatDetails && Array.isArray(c.heatDetails) && c.heatDetails.length > 0) {
          let totalMt = 0;
          const lines = [];
          c.heatDetails.forEach((h) => {
            const isRejected = h.status === "REJECTED" || h.status === "PARTIALLY_ACCEPTED";
            const val = parseFloat(h.weightRejectedMt || 0);
            if (isRejected && val > 0) {
              lines.push(`Heat no -${h.heatNo}- Qty ${val.toFixed(3)} MT`);
              totalMt += val;
            }
          });
          if (lines.length > 0) {
            return `${lines.join(",\n")},\nTotal Qty -${totalMt.toFixed(3)} MT`;
          }
          // Only return 'Nil' if process is done, else fallback
          const hasProcessed = c.heatDetails.some(h => ["ACCEPTED", "REJECTED", "PARTIALLY_ACCEPTED"].includes(h.status));
          if (hasProcessed) return "Nil";
        }
        return c.qtyRejected || "Nil";
      })(),

      remarks: c.remarks || "",
      callDate: c.dateOfCall || "",
      visitsNo: c.noOfVisits || "",
      inspectionDate: c.dateOfInspection || "",
      sealingPattern: c.sealingPattern || "",
      sealFacsimile: c.sealFacsimile || c.facsimile || "",
      inspectingEngineer: c.inspectingEngineer || ""
    };
  };

  // Initialize editable data whenever the underlying API data or PO details change
  useEffect(() => {
    if (call && Object.keys(call).length > 0) {
      setEditableData(transformCallToIC(call, poDetails));
    }
  }, [call, poDetails]);

  const handleDataChange = (field, value) => {
    setEditableData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayDataChange = (arrayField, index, field, value) => {
    setEditableData((prev) => {
      const newArray = [...(prev[arrayField] || [])];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [arrayField]: newArray };
    });
  };

  // FINAL DATA: use locally edited data if available, else fallback to API
  const dataToPass = editableData || transformCallToIC(call, poDetails);

  const handleExport = async () => {
    if (!printAreaRef.current) return;

    // Use certificate number as filename, fallback to default if not available
    const certificateNo = dataToPass.certificateNo || "RawMaterialIC";
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
            className={`btn ${isEditing ? "btn-success" : "btn-outline"}`}
          >
            {isEditing ? "Save Changes" : "Edit Certificate"}
          </button>
          <button onClick={() => window.print()} className="btn btn-outline">Print</button>
          <button onClick={handleExport} className="btn btn-primary">Export PDF</button>
        </div>
      </div>

      {/* Printable content - Wrapped for proper print isolation */}
      <div className="certificate-print-wrapper" ref={printAreaRef}>
        <div className="certificate-page">
          <ErcRmIC
            data={dataToPass}
            isEditing={isEditing}
            onChange={handleDataChange}
            onArrayChange={handleArrayDataChange}
          />
        </div>
      </div>
    </div>
  );
}
