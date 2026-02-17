import React from "react";

const ErcRmIC = ({ data = {} }) => { 
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
  } = data;

  const displayCertificateNo = (certificateNo || '')
    .replace(/[\uFEFF\u200B]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();

  return (
    <div className="a4-page">
      <div className="certificate-container border border-black">
        {/* Header row: empty, certificate, date, offered/passed */}
        <div className="grid grid-cols-[1fr_2fr_1.5fr_1.5fr] border-b border-black font-semibold">
        <div className="border-r border-black py-1" />
        <div className="border-r border-black flex flex-col justify-center py-1 text-center">
          <div>प्रमाणपत्र सं. / Certificate No.</div>
          <div className="font-normal text-sm break-words">{displayCertificateNo}</div>
        </div>
        <div className="border-r border-black flex flex-col justify-center py-1 text-center">
          <div>दिनांक / Date</div>
          <div className="font-normal text-sm">
            {certificateDate || ""}
          </div>
        </div>
        <div className="flex flex-col justify-center py-1 px-2 text-sm">
          <div className="font-normal">
            <span className="font-semibold">
              प्रस्तावित किस्त सं. / Offered Instt No.
            </span>{" "}
            <span>{offeredInstNo}</span>
          </div>
          <div className="font-normal">
            <span className="font-semibold">
              परित किस्त सं. / Passed Instt No.
            </span>{" "}
            <span>{passedInstNo}</span>
          </div>
        </div>
      </div>

      {/* Contractor / Manufacturer + Place of inspection */}
      <div className="grid grid-cols-2 border-b border-black">
        <div className="border-r border-black p-2">
          <div className="font-semibold">ठेकेदार / Contractor</div>
          <div className="break-words dynamic-text">{contractor}</div>
        </div>
        <div className="p-2">
          <div className="font-semibold">उत्पादक / Manufacturer</div>
          <div className="break-words dynamic-text">{manufacturer}</div>
          <div className="mt-1 font-semibold">
            निरीक्षण का स्थान / Place of Inspection
          </div>
          <div className="break-words dynamic-text">{placeOfInspection}</div>
        </div>
      </div>

      {/* Contract ref / Bill officer */}
      <div className="grid grid-cols-2 border-b border-black">
        <div className="border-r border-black p-2">
          <div className="font-semibold">
            संविदा संदर्भ एवं दिनांक (रेलवे) / Contract Ref. & Date (Rly.)
          </div>
          <div className="dynamic-text">{contractRef}</div>
          <div className="mt-1 font-semibold">
            खरीद आदेश सं. एवं दिनांक (ठेकेदार) / PO No. & Date (Contractor)
          </div>
          <div className="dynamic-text">{contractorPo}</div>
        </div>
        <div className="p-2">
          <div className="font-semibold">
            बिल अदायगी अधिकारी / Bill Paying officer
          </div>
          <div className="break-words dynamic-text">{billPayingOfficer}</div>
        </div>
      </div>

      {/* Consignee / Purchasing authority */}
      <div className="grid grid-cols-2 border-b border-black">
        <div className="border-r border-black p-2">
          <div className="font-semibold">
            प्रेषिती (रेलवे) / Consignee (Railway) Non Railway
          </div>
          <div className="break-words dynamic-text">{consigneeRailway}</div>
          <div className="mt-1 font-semibold">
            प्रेषिती (निर्मित उत्पाद निर्माता) / Consignee (Manufacturer of Finished Product)
          </div>
          <div className="break-words dynamic-text">{consigneeManufacturer}</div>
        </div>
        <div className="p-2">
          <div className="font-semibold">
            क्रय प्राधिकारी (रेलवे) / Purchasing Authority (Railway) Non Railway
          </div>
          <div className="break-words dynamic-text">{purchasingAuthority}</div>
        </div>
      </div>

      {/* Description / Drg / Spec / QAP */}
      <div className="grid grid-cols-3 border-b border-black">
        <div className="border-r border-black p-2">
          <div className="font-semibold">विवरण / Description</div>
          <div className="break-words dynamic-text">{description}</div>
        </div>
        <div className="border-r border-black p-2">
          <div className="font-semibold">ड्रॉइंग सं. / Drg. No.</div>
          <div>{drgNo}</div>
          <div className="mt-1 font-semibold">मानक सं. / Specn. No.</div>
          <div>{specNo}</div>
        </div>
        <div className="p-2">
          <div className="font-semibold">
            गुणवत्ता आश्वासन योजना सं / QAP No.
          </div>
          <div className="dynamic-text">{qapNo}</div>
        </div>
      </div>

      {/* Type of inspection/tests conducted */}
      <div className="border-b border-black p-2">
        <div className="font-semibold">
          किए गए निरीक्षण/परीक्षण विवरण / Type of inspection/tests conducted:
        </div>
        <div className="break-words dynamic-text">{inspectionType}</div>
      </div>

      {/* CHP table */}
      <div className="border-b border-black">
        <div className="grid grid-cols-[1.2fr_1fr_1.2fr_0.8fr_1fr_0.8fr] border-b border-black bg-gray-100 font-semibold text-center text-sm">
          <div className="border-r border-black py-1 px-2">
            क्यूएपी के सीएचपी की क्लॉज़ संख्या<br />CHP CL. NO. OF QAP
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
          <div className="border-r border-black py-1 px-2 break-words dynamic-text">{chpClause}</div>
          <div className="border-r border-black py-1 px-2 break-words dynamic-text">{contractChpReq}</div>
          <div className="border-r border-black py-1 px-2 break-words dynamic-text">{inspectionDetails}</div>
          <div className="border-r border-black py-1 px-2 break-words">{result}</div>
          <div className="border-r border-black py-1 px-2 break-words">{clearedQty}</div>
          <div className="py-1 px-2 break-words">{qtyRejected}</div>
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
          <div>{callDate}</div>
        </div>
        <div className="border-r border-black p-2">
          <span className="font-semibold">दौरों की संख्या / No. of visits: </span>
          <div>{visitsNo}</div>
        </div>
        <div className="p-2">
          <span className="font-semibold">
            निरीक्षण की तिथि / Date of inspection:{" "}
          </span>
          <div>{inspectionDate}</div>
        </div>
      </div>

      {/* Sealing / facsimile / engineer */}
      <div className="grid grid-cols-3 border-b border-black">
        <div className="border-r border-black p-2">
          <div className="font-semibold">
            सील/स्टैंपिंग तथा पहचान की विधि / Pattern of sealing/stamping or
            identification
          </div>
          <div className="break-words dynamic-text">{sealingPattern}</div>
        </div>
        <div className="border-r border-black p-2">
          <div className="font-semibold">
            सील/स्टैम्प की प्रतिकृति / Facsimile of seal/stamp
          </div>
          <div className="break-words">{sealFacsimile}</div>
        </div>
        <div className="p-2">
          <div className="font-semibold">निरीक्षण अभियंता / Inspecting Engineer</div>
          <div className="mt-4 text-right">{inspectingEngineer}</div>
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

