// src/IC/erc/ProcessMaterialCertificate.jsx

import { useRef } from "react";
import ErcProcessIc from "./ErcProcessIc";
import { exportToPdf } from "../../utils/exportUtils";

/**
 * PROCESS MATERIAL CERTIFICATE (Wrapper)
 * Shows EMPTY layout by default and renders API data when provided.
 *
 * - NO mock data
 * - NO default values
 * - Layout NEVER changes
 * - API integration becomes trivial
 */
export default function ProcessMaterialCertificate({ call = {}, onBack }) {
  const printAreaRef = useRef();

  const transformCallToIC = (c) => {
    if (!c || Object.keys(c).length === 0) return {};

    // Format today's date for certificate date
    const today = new Date();
    const certificateDate = today.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Format contract reference in the expected format
    const formatContractRef = (contractRef) => {
      if (!contractRef) return "";

      // If it's already in the expected format, return as is
      if (typeof contractRef === 'string' && contractRef.includes('RB L. No.') && contractRef.includes('Dt.')) {
        return contractRef;
      }

      // Handle array of contract references
      if (Array.isArray(contractRef)) {
        return contractRef.map(ref => {
          if (typeof ref === 'string' && ref.includes('RB L. No.')) {
            return ref;
          }
          // If it's a different format, try to transform it
          // This is a placeholder transformation - adjust based on actual data structure
          return ref;
        }).join('\n');
      }

      // Handle single contract reference - transform to expected format
      if (typeof contractRef === 'string') {
        // If it contains "dated", try to extract and reformat
        const datedMatch = contractRef.match(/(.+?)\s+dated\s+(.+)/i);
        if (datedMatch) {
          const refNumber = datedMatch[1].trim();
          const date = datedMatch[2].trim();
          // Transform to RB L. No. format
          return `RB L. No. ${refNumber}, Dt. ${date}`;
        }

        // If no transformation needed, return as is
        return contractRef;
      }

      return contractRef;
    };

    return {
      certificateNo: c.icNo || "",
      certificateDate: certificateDate, // Use today's date
      offeredInstNo: c.offeredInstNo || "",
      passedInstNo: c.passedInstNo || "",

      contractor: c.contractor || c.vendorName || c.vendor_name || "",
      manufacturer: c.manufacturer || "",
      contractRef: formatContractRef(c.contractRef) || "",
      poDetails: c.poDetails || c.contractorPo || c.poNo || c.po_no || "",
      billPayingOfficer: c.billPayingOfficer || c.billOfficer || "",
      consigneeRailway: c.consigneeRailway || c.consignee || "",
      consigneeManufacturer: c.consigneeManufacturer || c.consigneeFinished || "",
      purchasingAuthority: c.purchasingAuthority || "",

      description: c.productDescription || c.productType || "",

      // Dynamically generate Drg. No. based on ERC type from inspection call
      drgNo: (() => {
        const ercType = c.ercType || c.productType || '';

        if (!ercType) return c.drgNo || "";

        // Drawing number mapping based on ERC type (case-insensitive)
        const drawingMap = {
          'mk-iii': 'RT-3701',
          'mk-v': 'T-5919',
          'erc mk-iii': 'RT-3701',
          'erc mk-v': 'T-5919',
          'MK-III': 'RT-3701',
          'MK-V': 'T-5919',
          'ERC MK-III': 'RT-3701',
          'ERC MK-V': 'T-5919'
        };

        const drawing = drawingMap[ercType] || ercType;
        return `${ercType} : ${drawing}`;
      })(),

      specNo: c.specNo || "",
      qapNo: c.qapNo || "",
      inspectionType: c.inspectionType || "",
      chpClause: c.chpClause || "",

      lots: c.lots || [],
      reference: c.reference || "",
      callDate: c.callDate || c.dateOfCall || "",
      inspectionDate: c.inspectionDate || c.dateOfInspection || "",
      manDays: c.manDays || "",
      sealingPattern: c.sealingPattern || "",
      inspectingEngineer: c.inspectingEngineer || ""
    };
  };

  // FINAL DATA: empty layout OR API populated
  const data = transformCallToIC(call);

  const handleExport = async () => {
    if (!printAreaRef.current) return;

    // Use certificate number as filename, fallback to default if not available
    const certificateNo = data.certificateNo || "ProcessMaterialIC";
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
          <ErcProcessIc data={data} />
        </div>
      </div>
    </div>
  );
}

