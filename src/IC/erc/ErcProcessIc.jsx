import React from "react";

const EditableField = ({ isEditing, value, onChange, className = "", type = "text" }) => {
  if (!isEditing) {
    return type === "inline" ? <span className={className}>{value}</span> : <div className={className}>{value}</div>;
  }
  if (type === "textarea") {
    return (
      <textarea
        className={`${className} w-full p-1 border border-blue-400 bg-blue-50 text-sm`}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    );
  }
  return (
    <input
      type="text"
      className={`${className} w-full p-1 border border-blue-400 bg-blue-50 text-sm`}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      style={type === "inline" ? { display: "inline-block", width: "80px" } : {}}
    />
  );
};

const ErcProcessIC = ({ data = {}, isEditing = false, onChange = () => { }, onArrayChange = () => { } }) => {
  const {
    certificateNo = "",
    certificateDate = "",
    offeredInstNo = "",
    passedInstNo = "",
    contractor = "",
    manufacturer = "",
    contractRef = "",
    poDetails = "",
    billPayingOfficer = "",
    consigneeRailway = "",
    consigneeManufacturer = "",
    purchasingAuthority = "",
    description = "",
    chpClause = "",
    drgNo = "",
    specNo = "",
    qapNo = "",
    inspectionType = "",
    lots = [],
    reference = "",
    callDate = "",
    inspectionDate = "",
    manDays = "",
    sealingPattern = "",
    inspectingEngineer = "",
  } = data;

  // Sanitize certificate number for display (remove BOM / zero-width chars)
  const displayCertificateNo = (certificateNo || '')
    .replace(/[\uFEFF\u200B]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();

  const totalProcessed = lots.reduce((s, l) => s + (l.totalProcessed || 0), 0);
  const totalAccepted = lots.reduce((s, l) => s + (l.acceptedQty || 0), 0);
  const totalRejected = lots.reduce((s, l) => s + (l.rejectedQty || 0), 0);

  return (
    <div className="a4-page">
      <div className="certificate-container border border-black">
        {/* top row */}
        <div className="grid grid-cols-[1fr_2fr_1.5fr_1.5fr] font-semibold border-b border-black">
          <div className="border-r border-b border-black flex items-center justify-center py-1">
            <span></span>
          </div>
          <div className="border-r border-b border-black flex items-center justify-center py-1">
            <span className="break-words">प्रमाण पत्र सं. / Certificate No. {displayCertificateNo}</span>
          </div>
          <div className="border-r border-b border-black flex items-center justify-center py-1">
            <span>दिनांक / Date {certificateDate}</span>
          </div>
          <div className="border-b border-black flex flex-col justify-center py-1 px-2 text-sm">
            <div className="font-normal">
              <span className="font-semibold">
                प्रस्तावित किस्त सं. / Offered Instt No.
              </span>{" "}
              <EditableField isEditing={isEditing} type="inline" value={offeredInstNo} onChange={(val) => onChange("offeredInstNo", val)} />
            </div>
            <div className="font-normal">
              <span className="font-semibold">
                पारित किस्त सं. / Passed Instt No.
              </span>{" "}
              <EditableField isEditing={isEditing} type="inline" value={passedInstNo} onChange={(val) => onChange("passedInstNo", val)} />
            </div>
          </div>
        </div>

        {/* Contractor / Manufacturer */}
        <div className="grid grid-cols-2 border-b border-black">
          <div className="border-r border-black p-2">
            <div className="font-semibold">ठेकेदार / Contractor</div>
            <EditableField isEditing={isEditing} type="textarea" value={contractor} onChange={(val) => onChange("contractor", val)} className="break-words dynamic-text" />
          </div>
          <div className="p-2">
            <div className="font-semibold">उत्पादक / Manufacturer</div>
            <EditableField isEditing={isEditing} type="textarea" value={manufacturer} onChange={(val) => onChange("manufacturer", val)} className="break-words dynamic-text" />
          </div>
        </div>

        {/* Contract ref / PO / Bill officer */}
        <div className="grid grid-cols-2 border-b border-black">
          <div className="border-r border-black p-2">
            <div className="font-semibold">
              संविदा संदर्भ एवं दिनांक (रेलवे) / Contract Ref. & Date (Rly.)
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={contractRef} onChange={(val) => onChange("contractRef", val)} className="dynamic-text" />
            <div className="mt-1 font-semibold">
              खरीद आदेश सं. एवं दिनांक (ठेकेदार) / PO No. & Date (Contractor)
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={poDetails} onChange={(val) => onChange("poDetails", val)} className="dynamic-text" />
          </div>
          <div className="p-2">
            <div className="font-semibold">
              बिल अदायगी अधिकारी / Bill Paying Officer
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={billPayingOfficer} onChange={(val) => onChange("billPayingOfficer", val)} className="dynamic-text" />
          </div>
        </div>

        {/* Consignee / Purchasing authority */}
        <div className="grid grid-cols-2 border-b border-black">
          <div className="border-r border-black p-2">
            <div className="font-semibold">
              प्रेषिती (रेलवे) / Consignee (Railway)
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={consigneeRailway} onChange={(val) => onChange("consigneeRailway", val)} className="break-words dynamic-text" />
            <div className="mt-1 font-semibold">
              प्रेषिती (निर्मित उत्पाद निर्माता) / Consignee (Manufacturer of Finished Product)
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={consigneeManufacturer} onChange={(val) => onChange("consigneeManufacturer", val)} className="break-words dynamic-text" />
          </div>
          <div className="p-2">
            <div className="font-semibold">
              क्रय प्राधिकारी (रेलवे) / Purchasing Authority (Railway)
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={purchasingAuthority} onChange={(val) => onChange("purchasingAuthority", val)} className="break-words dynamic-text" />
          </div>
        </div>

        {/* Description / Drg / Spec / QAP */}
        <div className="grid grid-cols-3 border-b border-black">
          <div className="border-r border-black p-2">
            <div className="font-semibold">
              विवरण / Description (PO Sr. No. 001)
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={description} onChange={(val) => onChange("description", val)} className="break-words dynamic-text" />
          </div>
          <div className="border-r border-black p-2">
            <div>
              <span className="font-semibold">ड्रॉइंग सं. / Drg. No. </span>
              <EditableField isEditing={isEditing} value={drgNo} onChange={(val) => onChange("drgNo", val)} className="" />
            </div>
            <div className="mt-1">
              <span className="font-semibold">विनिर्देश सं. / Specn. No. </span>
              <EditableField isEditing={isEditing} value={specNo} onChange={(val) => onChange("specNo", val)} className="" />
            </div>
          </div>
          <div className="p-2">
            <div className="font-semibold">
              गुणवत्ता आश्वासन योजना सं. / QAP No.
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={qapNo} onChange={(val) => onChange("qapNo", val)} className="dynamic-text" />
          </div>
        </div>

        {/* Type of inspection */}
        <div className="border-b border-black p-2">
          <div className="font-semibold">
            किए गए निरीक्षण/परीक्षण विवरण / Type of inspection/tests conducted:
          </div>
          <EditableField isEditing={isEditing} type="textarea" value={inspectionType} onChange={(val) => onChange("inspectionType", val)} className="break-words dynamic-text" />
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] border-b border-black bg-gray-100 font-semibold text-center text-sm">
          <div className="border-r border-black py-1 px-2">
            सी.एच.पी. क्लॉज सं.<br />CHP CL. NO. OF QAP
          </div>
          <div className="border-r border-black py-1 px-2">
            हीट नंबर / लॉट नंबर<br />HEAT No. / Lot No.
          </div>
          <div className="border-r border-black py-1 px-2">
            कुल उत्पादित मात्रा (संख्या में)<br />Total Processed Qty (Nos.)
          </div>
          <div className="border-r border-black py-1 px-2">
            स्वीकृत मात्रा (संख्या में)<br />Accepted Qty (Nos.)
          </div>
          <div className="py-1 px-2">
            अस्वीकृत मात्रा (संख्या में)<br />Rejected Qty (Nos.)
          </div>
        </div>

        {/* Body rows */}
        {lots.map((lot, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] text-center border-b border-black last:border-b-0"
          >
            <div className="border-r border-black py-1 px-2 text-sm">
              {chpClause || (idx === 0 ? "PROCESS INSPECTION OF ELASTIC RAIL CLIP MK-V" : "")}
            </div>
            <div className="border-r border-black py-1 px-2">{lot.heatNo}</div>
            <div className="border-r border-black py-1 px-2">{lot.totalProcessed}</div>
            <div className="border-r border-black py-1 px-2">{lot.acceptedQty}</div>
            <div className="py-1 px-2">{lot.rejectedQty}</div>
          </div>
        ))}

        {/* TOTAL row */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] font-semibold border-b border-black">
          <div className="border-r border-black py-1 px-2 text-center">TOTAL</div>
          <div className="border-r border-black py-1 px-2 text-center"></div>
          <EditableField isEditing={isEditing} value={totalProcessed} onChange={(val) => onChange("totalProcessed", val)} className="border-r border-black py-1 px-2 text-center" />
          <EditableField isEditing={isEditing} value={totalAccepted} onChange={(val) => onChange("totalAccepted", val)} className="border-r border-black py-1 px-2 text-center" />
          <EditableField isEditing={isEditing} value={totalRejected} onChange={(val) => onChange("totalRejected", val)} className="py-1 px-2 text-center" />
        </div>

        {/* Reference row */}
        <div className="border-b border-black p-2">
          <span className="font-semibold">संदर्भ / Reference: </span>
          <span className="dynamic-text">{reference}</span>
        </div>

        {/* Call date / inspection date / man-days */}
        <div className="grid grid-cols-3 border-b border-black">
          <div className="border-r border-black p-2">
            <span className="font-semibold">
              कॉल दिनांक / Date of call:{" "}
            </span>
            <EditableField isEditing={isEditing} value={callDate} onChange={(val) => onChange("callDate", val)} className="" />
          </div>
          <div className="border-r border-black p-2">
            <span className="font-semibold">
              निरीक्षण की तिथि / Date of inspection:{" "}
            </span>
            <EditableField isEditing={isEditing} value={inspectionDate} onChange={(val) => onChange("inspectionDate", val)} className="" />
          </div>
          <div className="p-2">
            <span className="font-semibold">
              कार्यरत मानव-दिनों की कुल संख्या / Total No. of Man-days engaged:{" "}
            </span>
            <EditableField isEditing={isEditing} value={manDays} onChange={(val) => onChange("manDays", val)} className="" />
          </div>
        </div>

        {/* Sealing pattern / Inspecting engineer */}
        <div className="grid grid-cols-2 border-b border-black">
          <div className="border-r border-black p-2">
            <div className="font-semibold">
              सील/स्टैंपिंग तथा पहचान की विधि / Pattern of sealing/stamping or identification
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={sealingPattern} onChange={(val) => onChange("sealingPattern", val)} className="dynamic-text" />
          </div>
          <div className="p-2 flex flex-col justify-between">
            <div className="font-semibold">Inspecting Engineer</div>
            <EditableField isEditing={isEditing} value={inspectingEngineer} onChange={(val) => onChange("inspectingEngineer", val)} className="mt-4 text-right" />
          </div>
        </div>

        {/* Footer certification */}
        <div className="border-t border-black p-2 text-center">
          <div className="font-semibold">
            It is certified that Process Inspection of ERCs carried out satisfactorily
            and Material cleared for Product Inspection.
          </div>
          <div className="mt-1 text-sm">
            Distribution: Manufacturer office copy, Purchaser (Railway), RITES Bill
            Copy, RITES for final IC incorporate
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErcProcessIC;

