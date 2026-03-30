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
    bookNo = "",
    setNo = "",
  } = data;

  // Sanitize certificate number for display (remove BOM / zero-width chars)
  const displayCertificateNo = (certificateNo || '')
    .replace(/[\uFEFF\u200B]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();

  const totalProcessed = lots.reduce((s, l) => s + (l.totalProcessed || 0), 0).toFixed(3);
  const totalAccepted = lots.reduce((s, l) => s + (l.acceptedQty || 0), 0).toFixed(3);
  const totalRejected = lots.reduce((s, l) => s + (l.rejectedQty || 0), 0).toFixed(3);

  return (
    <div className="a4-page">
      <div className="certificate-container border border-black">
        {/* top row */}
        {/* Header Row: 5-Column Single Row Layout as per requested image */}
        <div className="grid grid-cols-[1fr_1fr_2fr_1.2fr_2fr] border-b border-black text-[11px]">
          {/* Col 1: Book No */}
          <div className="border-r border-black flex flex-col justify-between">
            <div className="border-b border-black p-1 font-semibold text-center flex-grow flex items-center justify-center">
              बुक सं. /Book No.
            </div>
            <div className="p-1 flex items-center justify-center min-h-[25px]">
              <EditableField isEditing={isEditing} value={bookNo} onChange={(val) => onChange("bookNo", val)} className="text-center" />
            </div>
          </div>

          {/* Col 2: Set No */}
          <div className="border-r border-black flex flex-col justify-between">
            <div className="border-b border-black p-1 font-semibold text-center flex-grow flex items-center justify-center">
              सेट सं. /Set No.
            </div>
            <div className="p-1 flex items-center justify-center min-h-[25px]">
              <EditableField isEditing={isEditing} value={setNo} onChange={(val) => onChange("setNo", val)} className="text-center" />
            </div>
          </div>

          {/* Col 3: Certificate No */}
          <div className="border-r border-black p-1 flex flex-col items-center justify-center text-center">
            <div className="font-semibold">प्रमाण पत्र सं. / Certificate No.</div>
            <div className="break-words">{displayCertificateNo}</div>
          </div>

          {/* Col 4: Date */}
          <div className="border-r border-black p-1 flex flex-col items-center justify-center text-center">
            <div className="font-semibold">दिनांक / Date</div>
            <div>{certificateDate}</div>
          </div>

          {/* Col 5: Offered/Passed Instt No */}
          <div className="p-2 flex flex-col justify-center text-left leading-tight">
            <div>
              <span className="font-semibold">प्रस्तावित किस्त सं. / Offered Instt No.</span>{" "}
              <EditableField isEditing={isEditing} type="inline" value={offeredInstNo} onChange={(val) => onChange("offeredInstNo", val)} />
            </div>
            <div className="mt-1">
              <span className="font-semibold">पारित किस्त सं. / Passed Instt No.</span>{" "}
              <EditableField isEditing={isEditing} type="inline" value={passedInstNo} onChange={(val) => onChange("passedInstNo", val)} />
            </div>
          </div>
        </div>

        {/* Contractor / Manufacturer */}
        <div className="grid grid-cols-2 border-b border-black md:min-h-[40px]">
          <div className="border-r border-black p-1">
            <div className="font-semibold text-[10px]">ठेकेदार / Contractor</div>
            <EditableField isEditing={isEditing} type="textarea" value={contractor} onChange={(val) => onChange("contractor", val)} className="break-words dynamic-text leading-tight" />
          </div>
          <div className="p-1">
            <div className="font-semibold text-[10px]">उत्पादक / Manufacturer</div>
            <EditableField isEditing={isEditing} type="textarea" value={manufacturer} onChange={(val) => onChange("manufacturer", val)} className="break-words dynamic-text leading-tight" />
          </div>
        </div>

        {/* Contract ref / PO / Bill officer */}
        <div className="grid grid-cols-2 border-b border-black md:min-h-[40px]">
          <div className="border-r border-black p-1">
            <div className="font-semibold text-[10px]">
              संविदा संदर्भ एवं दिनांक (रेलवे) / Contract Ref. & Date (Rly.)
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={contractRef} onChange={(val) => onChange("contractRef", val)} className="dynamic-text leading-tight" />
            <div className="mt-0.5 font-semibold text-[10px]">
              खरीद आदेश सं. एवं दिनांक (ठेकेदार) / PO No. & Date (Contractor)
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={poDetails} onChange={(val) => onChange("poDetails", val)} className="dynamic-text leading-tight" />
          </div>
          <div className="p-1">
            <div className="font-semibold text-[10px]">
              बिल अदायगी अधिकारी / Bill Paying Officer
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={billPayingOfficer} onChange={(val) => onChange("billPayingOfficer", val)} className="dynamic-text leading-tight" />
          </div>
        </div>

        {/* Consignee / Purchasing authority */}
        <div className="grid grid-cols-2 border-b border-black md:min-h-[40px]">
          <div className="border-r border-black p-1">
            <div className="font-semibold text-[10px]">
              प्रेषिती (रेलवे) / Consignee (Railway)
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={consigneeRailway} onChange={(val) => onChange("consigneeRailway", val)} className="break-words dynamic-text leading-tight" />
            <div className="mt-0.5 font-semibold text-[10px]">
              प्रेषिती (निर्मित उत्पाद निर्माता) / Consignee (Manufacturer of Finished Product)
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={consigneeManufacturer} onChange={(val) => onChange("consigneeManufacturer", val)} className="break-words dynamic-text leading-tight" />
          </div>
          <div className="p-1">
            <div className="font-semibold text-[10px]">
              क्रय प्राधिकारी (रेलवे) / Purchasing Authority (Railway)
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={purchasingAuthority} onChange={(val) => onChange("purchasingAuthority", val)} className="break-words dynamic-text leading-tight" />
          </div>
        </div>

        {/* Description / Drg / Spec / QAP */}
        <div className="grid grid-cols-3 border-b border-black md:min-h-[40px]">
          <div className="border-r border-black p-1">
            <div className="font-semibold text-[10px]">
              विवरण / Description (PO Sr. No. 001)
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={description} onChange={(val) => onChange("description", val)} className="break-words dynamic-text leading-tight" />
          </div>
          <div className="border-r border-black p-1">
            <div>
              <span className="font-semibold text-[10px]">ड्रॉइंग सं. / Drg. No. </span>
              <EditableField isEditing={isEditing} value={drgNo} onChange={(val) => onChange("drgNo", val)} className="leading-tight" />
            </div>
            <div className="mt-0.5">
              <span className="font-semibold text-[10px]">विनिर्देश सं. / Specn. No. </span>
              <EditableField isEditing={isEditing} value={specNo} onChange={(val) => onChange("specNo", val)} className="leading-tight" />
            </div>
          </div>
          <div className="p-1">
            <div className="font-semibold text-[10px]">
              गुणवत्ता आश्वासन योजना सं. / QAP No.
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={qapNo} onChange={(val) => onChange("qapNo", val)} className="dynamic-text leading-tight text-[10px]" />
          </div>
        </div>

        {/* Type of inspection */}
        <div className="border-b border-black p-1 md:min-h-[30px]">
          <div className="font-semibold text-[10px]">
            किए गए निरीक्षण/परीक्षण विवरण / Type of inspection/tests conducted:
          </div>
          <EditableField isEditing={isEditing} type="textarea" value={inspectionType} onChange={(val) => onChange("inspectionType", val)} className="break-words dynamic-text leading-tight" />
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
        <div className="grid grid-cols-3 border-b border-black md:min-h-[30px]">
          <div className="border-r border-black p-1">
            <span className="font-semibold text-[10px]">
              कॉल दिनांक / Date of call:{" "}
            </span>
            <EditableField isEditing={isEditing} value={callDate} onChange={(val) => onChange("callDate", val)} className="inline-block" />
          </div>
          <div className="border-r border-black p-1">
            <span className="font-semibold text-[10px]">
              निरीक्षण की तिथि / Date of inspection:{" "}
            </span>
            <EditableField isEditing={isEditing} value={inspectionDate} onChange={(val) => onChange("inspectionDate", val)} className="inline-block" />
          </div>
          <div className="p-1">
            <span className="font-semibold text-[10px]">
              कार्यरत मानव-दिनों की संख्या / Total Man-days:{" "}
            </span>
            <EditableField isEditing={isEditing} value={manDays} onChange={(val) => onChange("manDays", val)} className="inline-block" />
          </div>
        </div>

        {/* Sealing pattern / Inspecting engineer */}
        <div className="grid grid-cols-2 border-b border-black md:min-h-[40px]">
          <div className="border-r border-black p-1">
            <div className="font-semibold text-[10px]">
              सील/स्टैंपिंग तथा पहचान की विधि / Pattern of sealing/stamping or identification
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={sealingPattern} onChange={(val) => onChange("sealingPattern", val)} className="dynamic-text leading-tight text-[10px]" />
          </div>
          <div className="p-1 flex flex-col justify-between">
            <div className="font-semibold text-[10px]">Inspecting Engineer</div>
            <EditableField isEditing={isEditing} value={inspectingEngineer} onChange={(val) => onChange("inspectingEngineer", val)} className="mt-2 text-right font-semibold" />
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

