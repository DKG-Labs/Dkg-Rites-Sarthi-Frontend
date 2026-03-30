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
      <div className="certificate-container flex flex-col flex-grow">
        {/* Row 1: Centered Book No & Set No Box - FLOATING */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="grid grid-cols-2 border border-black w-[180px]">
            <div className="border-r border-black flex flex-col">
              <div className="border-b border-black p-0.5 font-bold text-center text-[9px] leading-tight">बुक सं. Book No.</div>
              <div className="p-0.5 flex items-center justify-center min-h-[20px]">
                <EditableField isEditing={isEditing} value={bookNo} onChange={(val) => onChange("bookNo", val)} className="text-center font-bold text-[11px]" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="border-b border-black p-0.5 font-bold text-center text-[9px] leading-tight">सेट सं. Set No.</div>
              <div className="p-0.5 flex items-center justify-center min-h-[20px]">
                <EditableField isEditing={isEditing} value={setNo} onChange={(val) => onChange("setNo", val)} className="text-center font-bold text-[11px]" />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Regional Branding + Continuation Sheets - FLOATING */}
        <div className="relative py-1 flex justify-center items-center min-h-[30px]">
          <div className="font-bold text-[12px] uppercase">RITES LTD, NORTHERN REGION, DELHI</div>
          <div className="absolute right-0 bottom-0 text-right pr-4 leading-tight">
            <div className="text-[10px] font-bold">निरंतरता पत्रक शामिल</div>
            <div className="text-[9px] font-bold">Contains 0 Continuation Sheets</div>
          </div>
        </div>

        {/* Row 3: Certificate No, Date, Instances - FLOATING / RIGHT-ALIGNED */}
        <div className="flex justify-end pb-1">
          <div className="grid grid-cols-[1.8fr_1fr_2.7fr] border border-black text-[10px] items-stretch w-[75%]">
            {/* Col 1: Certificate No */}
            <div className="border-r border-black p-1 flex flex-col items-center justify-center text-center">
              <div className="font-bold text-[9px] uppercase">प्रमाणपत्र पत्र सं. Certificate No.</div>
              <div className="font-bold break-all text-[11px] leading-tight mt-1">{displayCertificateNo}</div>
            </div>

            {/* Col 2: Date */}
            <div className="border-r border-black p-1 flex flex-col items-center justify-center text-center">
              <div className="font-bold text-[9px] uppercase">दिनांक Date</div>
              <div className="font-bold text-[11px] mt-1">{certificateDate}</div>
            </div>

            {/* Col 3: Instances */}
            <div className="p-1 px-3 flex flex-col justify-center text-left leading-[1.1] text-[9px] font-bold">
              <div className="flex justify-between items-center">
                <div>
                  <div>प्रस्तावित किस्त सं.</div>
                  <div>Offered Instt. No.</div>
                </div>
                <div className="text-[11px] pr-8"><EditableField isEditing={isEditing} value={offeredInstNo} onChange={(val) => onChange("offeredInstNo", val)} type="inline" /></div>
              </div>
              <div className="mt-1 pt-1 border-t border-dotted border-gray-400 flex justify-between items-center">
                <div>
                  <div>किस्त स. पारित Passed Instt. No.</div>
                </div>
                <div className="text-[11px] pr-8"><EditableField isEditing={isEditing} value={passedInstNo} onChange={(val) => onChange("passedInstNo", val)} type="inline" /></div>
              </div>
            </div>
          </div>
        </div>

        {/* Contractor / Manufacturer - START FULL-WIDTH BOX */}
        <div className="grid grid-cols-2 border border-black md:min-h-[40px]">
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
        <div className="grid grid-cols-2 border-x border-b border-black md:min-h-[40px]">
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
        <div className="grid grid-cols-2 border-x border-b border-black md:min-h-[40px]">
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
        <div className="grid grid-cols-3 border-x border-b border-black md:min-h-[40px]">
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
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] border-b border-black bg-gray-100 font-semibold text-center text-[9px] leading-tight">
          <div className="border-r border-black p-1">
            सी.एच.पी. क्लॉज सं.<br />CHP CL. NO. OF QAP
          </div>
          <div className="border-r border-black p-1">
            हीट नंबर / लॉट नंबर<br />HEAT No. / Lot No.
          </div>
          <div className="border-r border-black p-1">
            कुल उत्पादित मात्रा (संख्या में)<br />Total Processed Qty (Nos.)
          </div>
          <div className="border-r border-black p-1">
            स्वीकृत मात्रा (संख्या में)<br />Accepted Qty (Nos.)
          </div>
          <div className="p-1">
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
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] font-semibold border-x border-b border-black">
          <div className="border-r border-black py-1 px-2 text-center">TOTAL</div>
          <div className="border-r border-black py-1 px-2 text-center"></div>
          <EditableField isEditing={isEditing} value={totalProcessed} onChange={(val) => onChange("totalProcessed", val)} className="border-r border-black py-1 px-2 text-center" />
          <EditableField isEditing={isEditing} value={totalAccepted} onChange={(val) => onChange("totalAccepted", val)} className="border-r border-black py-1 px-2 text-center" />
          <EditableField isEditing={isEditing} value={totalRejected} onChange={(val) => onChange("totalRejected", val)} className="py-1 px-2 text-center" />
        </div>

        {/* Reference row */}
        <div className="border-x border-b border-black p-2">
          <span className="font-semibold">संदर्भ / Reference: </span>
          <span className="dynamic-text">{reference}</span>
        </div>

        {/* Call date / inspection date / man-days */}
        <div className="grid grid-cols-3 border-x border-b border-black md:min-h-[30px]">
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
        <div className="grid grid-cols-2 border-x border-b border-black md:min-h-[40px]">
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

