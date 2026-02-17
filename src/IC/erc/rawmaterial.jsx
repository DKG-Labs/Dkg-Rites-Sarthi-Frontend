// src/IC/erc/RawMaterialCertificate.jsx

import { useRef } from "react";
import ErcRmIC from "./ErcRmIc";
import { exportToPdf } from "../../utils/exportUtils";

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

  /**
   * Transform API response to component format.
   * KEEP IT MINIMAL: Do NOT insert default values.
   */
  const transformCallToIC = (c) => {
    if (!c || Object.keys(c).length === 0) return {};

    return {
      certificateNo: c.certificateNo || c.icNo || "",
      certificateDate: c.certificateDate || "",
      offeredInstNo: c.offeredInstNo || "",
      passedInstNo: c.passedInstNo || "",

      contractor: c.contractor || c.vendorName || c.vendor_name || "",
      manufacturer: c.manufacturer || "",
      placeOfInspection: c.placeOfInspection || c.inspectionPlace || c.place_of_inspection || "",
      contractRef: c.contractRef || "",
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
      clearedQty: c.clearedQty || c.qtyCleared || "",
      qtyRejected: c.qtyRejected || "",

      remarks: c.remarks || "",
      callDate: c.dateOfCall || "",
      visitsNo: c.noOfVisits || "",
      inspectionDate: c.dateOfInspection || "",
      sealingPattern: c.sealingPattern || "",
      sealFacsimile: c.sealFacsimile || c.facsimile || "",
      inspectingEngineer: c.inspectingEngineer || ""
    };
  };

  // FINAL DATA: empty layout OR API populated
  const data = transformCallToIC(call);

  const handleExport = async () => {
    if (!printAreaRef.current) return;

    // Use certificate number as filename, fallback to default if not available
    const certificateNo = data.certificateNo || "RawMaterialIC";
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
          <button onClick={() => window.print()} className="btn btn-outline">Print</button>
          <button onClick={handleExport} className="btn btn-primary">Export PDF</button>
        </div>
      </div>

      {/* Printable content - Wrapped for proper print isolation */}
      <div className="certificate-print-wrapper" ref={printAreaRef}>
        <div className="certificate-page">
          <ErcRmIC data={data} />
        </div>
      </div>
    </div>
  );
}
