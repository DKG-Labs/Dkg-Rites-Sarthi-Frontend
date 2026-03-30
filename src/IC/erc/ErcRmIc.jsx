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

const ErcRmIC = ({ data = {}, isEditing = false, onChange = () => {} }) => {
  const {
    certificateNo = "",
    certificateDate = "",
    offeredInstNo = "",
    passedInstNo = "",
    contractor = "",
    manufacturer = "",
    placeOfInspection = "",
    contractRef = "",
    contractorPo = "",
    billPayingOfficer = "",
    consigneeRailway = "",
    consigneeManufacturer = "",
    purchasingAuthority = "",
    description = "",
    drgNo = "",
    specNo = "",
    qapNo = "",
    inspectionType = "",
    chpClause = "",
    contractChpReq = "",
    inspectionDetails = "",
    result = "",
    clearedQty = "",
    qtyRejected = "",
    remarks = "",
    callDate = "",
    visitsNo = "",
    inspectionDate = "",
    sealingPattern = "",
    sealFacsimile = "",
    inspectingEngineer = "",
    bookNo = "",
    setNo = "",
  } = data;

  const displayCertificateNo = (certificateNo || '')
    .replace(/[\uFEFF\u200B]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();

  return (
    <div className="a4-page">
      <div className="certificate-container border border-black">
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

        {/* Contractor / Manufacturer + Place of inspection */}
        <div className="grid grid-cols-2 border-b border-black md:min-h-[40px]">
          <div className="border-r border-black p-1">
            <div className="font-semibold text-[10px]">ठेकेदार / Contractor</div>
            <EditableField isEditing={isEditing} type="textarea" value={contractor} onChange={(val) => onChange("contractor", val)} className="break-words dynamic-text leading-tight" />
          </div>
          <div className="p-1">
            <div className="font-semibold text-[10px]">उत्पादक / Manufacturer</div>
            <EditableField isEditing={isEditing} type="textarea" value={manufacturer} onChange={(val) => onChange("manufacturer", val)} className="break-words dynamic-text leading-tight" />
            <div className="mt-0.5 font-semibold text-[10px]">
              निरीक्षण का स्थान / Place of Inspection
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={placeOfInspection} onChange={(val) => onChange("placeOfInspection", val)} className="break-words dynamic-text leading-tight" />
          </div>
        </div>

        {/* Contract ref / Bill officer */}
        <div className="grid grid-cols-2 border-b border-black md:min-h-[40px]">
          <div className="border-r border-black p-1">
            <div className="font-semibold text-[10px]">
              संविदा संदर्भ एवं दिनांक (रेलवे) / Contract Ref. & Date (Rly.)
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={contractRef} onChange={(val) => onChange("contractRef", val)} className="dynamic-text leading-tight" />
            <div className="mt-0.5 font-semibold text-[10px]">
              खरीद आदेश सं. एवं दिनांक (ठेकेदार) / PO No. & Date (Contractor)
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={contractorPo} onChange={(val) => onChange("contractorPo", val)} className="dynamic-text leading-tight" />
          </div>
          <div className="p-1">
            <div className="font-semibold text-[10px]">
              बिल अदायगी अधिकारी / Bill Paying officer
            </div>
            <EditableField isEditing={isEditing} value={billPayingOfficer} onChange={(val) => onChange("billPayingOfficer", val)} className="break-words dynamic-text leading-tight" />
          </div>
        </div>

        {/* Consignee / Purchasing authority */}
        <div className="grid grid-cols-2 border-b border-black md:min-h-[40px]">
          <div className="border-r border-black p-1">
            <div className="font-semibold text-[10px]">
              प्रेषिती (रेलवे) / Consignee (Railway) Non Railway
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={consigneeRailway} onChange={(val) => onChange("consigneeRailway", val)} className="break-words dynamic-text leading-tight" />
            <div className="mt-0.5 font-semibold text-[10px]">
              प्रेषिती (निर्मित उत्पाद निर्माता) / Consignee (Manufacturer of Finished Product)
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={consigneeManufacturer} onChange={(val) => onChange("consigneeManufacturer", val)} className="break-words dynamic-text leading-tight" />
          </div>
          <div className="p-1">
            <div className="font-semibold text-[10px]">
              क्रय प्राधिकारी (रेलवे) / Purchasing Authority (Railway) Non Railway
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={purchasingAuthority} onChange={(val) => onChange("purchasingAuthority", val)} className="break-words dynamic-text leading-tight" />
          </div>
        </div>

        {/* Description / Drg / Spec / QAP */}
        <div className="grid grid-cols-3 border-b border-black md:min-h-[40px]">
          <div className="border-r border-black p-1">
            <div className="font-semibold text-[10px]">विवरण / Description</div>
            <EditableField isEditing={isEditing} type="textarea" value={description} onChange={(val) => onChange("description", val)} className="break-words dynamic-text leading-tight" />
          </div>
          <div className="border-r border-black p-1">
            <div className="font-semibold text-[10px]">ड्रॉइंग सं. / Drg. No.</div>
            <EditableField isEditing={isEditing} value={drgNo} onChange={(val) => onChange("drgNo", val)} className="leading-tight" />
            <div className="mt-0.5 font-semibold text-[10px]">विनिर्देश सं. / Specn. No.</div>
            <EditableField isEditing={isEditing} value={specNo} onChange={(val) => onChange("specNo", val)} className="leading-tight" />
          </div>
          <div className="p-1">
            <div className="font-semibold text-[10px]">
              गुणवत्ता आश्वासन योजना सं / QAP No.
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={qapNo} onChange={(val) => onChange("qapNo", val)} className="dynamic-text leading-tight text-[10px]" />
          </div>
        </div>

        {/* Type of inspection/tests conducted */}
        <div className="border-b border-black p-1 md:min-h-[30px]">
          <div className="font-semibold text-[10px]">
            किए गए निरीक्षण/परीक्षण विवरण / Type of inspection/tests conducted:
          </div>
          <EditableField isEditing={isEditing} type="textarea" value={inspectionType} onChange={(val) => onChange("inspectionType", val)} className="break-words dynamic-text leading-tight" />
        </div>

        {/* CHP table */}
        <div className="border-b border-black">
          <div className="grid grid-cols-[1.2fr_1fr_1.2fr_0.8fr_1fr_0.8fr] border-b border-black bg-gray-100 font-semibold text-center text-sm">
            <div className="border-r border-black py-1 px-2">
              सी.एच.पी. क्लॉज सं.<br />CHP CL. NO. OF QAP
            </div>
            <div className="border-r border-black py-1 px-2">
              परीक्षण के लिए अनुबंध सीएचपी आवश्यकताएँ<br />
              Contract CHP requirement for test
            </div>
            <div className="border-r border-black py-1 px-2">
              आयोजित निरीक्षण परीक्षण का विवरण<br />
              Details of Inspection / tests conducted
            </div>
            <div className="border-r border-black py-1 px-2">
              परिणाम<br />Result
            </div>
            <div className="border-r border-black py-1 px-2">
              स्वीकृत चरण की मात्रा<br />
              Qty. for which stage is cleared
            </div>
            <div className="py-1 px-2">
              अस्वीकृत मात्रा<br />
              Qty. rejected
            </div>
          </div>

          <div className="grid grid-cols-[1.2fr_1fr_1.2fr_0.8fr_1fr_0.8fr] text-left border-b border-black">
            <EditableField isEditing={isEditing} type="textarea" value={chpClause} onChange={(val) => onChange("chpClause", val)} className="border-r border-black py-1 px-2 break-words dynamic-text" />
            <EditableField isEditing={isEditing} type="textarea" value={contractChpReq} onChange={(val) => onChange("contractChpReq", val)} className="border-r border-black py-1 px-2 break-words dynamic-text" />
            <EditableField isEditing={isEditing} type="textarea" value={inspectionDetails} onChange={(val) => onChange("inspectionDetails", val)} className="border-r border-black py-1 px-2 break-words dynamic-text" />
            <EditableField isEditing={isEditing} type="textarea" value={result} onChange={(val) => onChange("result", val)} className="border-r border-black py-1 px-2 break-words" />
            <EditableField isEditing={isEditing} type="textarea" value={clearedQty} onChange={(val) => onChange("clearedQty", val)} className="border-r border-black py-1 px-2 break-words" />
            <EditableField isEditing={isEditing} type="textarea" value={qtyRejected} onChange={(val) => onChange("qtyRejected", val)} className="py-1 px-2 break-words" />
          </div>
        </div>

        {/* Remarks */}
        <div className="border-b border-black p-2">
          <span className="font-semibold">टिप्पणी / Remarks: </span>
          <span className="break-words dynamic-text">{remarks}</span>
        </div>

        {/* Call date / visits / inspection date */}
        <div className="grid grid-cols-3 border-b border-black">
          <div className="border-r border-black p-2">
            <span className="font-semibold">कॉल दिनांक / Date of call: </span>
            <EditableField isEditing={isEditing} value={callDate} onChange={(val) => onChange("callDate", val)} className="" />
          </div>
          <div className="border-r border-black p-2">
            <span className="font-semibold">दौरों की संख्या / No. of visits: </span>
            <EditableField isEditing={isEditing} value={visitsNo} onChange={(val) => onChange("visitsNo", val)} className="" />
          </div>
          <div className="p-2">
            <span className="font-semibold">
              निरीक्षण की तिथि / Date of inspection:{" "}
            </span>
            <EditableField isEditing={isEditing} value={inspectionDate} onChange={(val) => onChange("inspectionDate", val)} className="" />
          </div>
        </div>

        {/* Sealing / facsimile / engineer */}
        <div className="grid grid-cols-3 border-b border-black md:min-h-[40px]">
          <div className="border-r border-black p-1">
            <div className="font-semibold text-[10px]">
              सील/स्टैंपिंग तथा पहचान की विधि / Pattern of sealing/stamping or
              identification
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={sealingPattern} onChange={(val) => onChange("sealingPattern", val)} className="break-words dynamic-text leading-tight text-[10px]" />
          </div>
          <div className="border-r border-black p-1">
            <div className="font-semibold text-[10px]">
              सील/स्टैम्प की प्रतिकृति / Facsimile of seal/stamp
            </div>
            <EditableField isEditing={isEditing} type="textarea" value={sealFacsimile} onChange={(val) => onChange("sealFacsimile", val)} className="break-words leading-tight text-[10px]" />
          </div>
          <div className="p-1 flex flex-col justify-between">
            <div className="font-semibold text-[10px]">निरीक्षण अभियंता / Inspecting Engineer</div>
            <EditableField isEditing={isEditing} value={inspectingEngineer} onChange={(val) => onChange("inspectingEngineer", val)} className="mt-2 text-right font-semibold" />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-black p-2 text-center">
          <div className="font-semibold">
            It is certified that material is cleared for the next stage.
          </div>
          <div className="mt-1 text-sm break-words">
            Distribution: Manufacturer Office copy with case, RITES Bill Copy,
            Contractor, Purchaser (Railway), Consignee (Railway), Consignee
            (Manufacturer of finished product), RITES Office copy, RITES for
            final IC
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErcRmIC;

