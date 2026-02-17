import React from "react";

const ErcFinalIc = ({ data = {}, isEditing = false, onFieldChange = () => { } }) => {
  const {
    certificateNo = "",
    certificateDate = "",
    offeredInstNo = "",
    passedInstNo = "",
    contractor = "",
    placeOfInspection = "",
    contractRef = "",
    contractRefDate = "",
    billPayingOfficer = "",
    consignee = "",
    purchasingAuthority = "",
    itemNo = "1",
    description = "",
    qtyOnOrder = "",
    qtyOfferedPreviously = "",
    qtyPassedPreviously = "",
    qtyNowOffered = "",
    qtyNowPassed = "",
    qtyNowRejected = "",
    qtyStillDue = "",
    noOfItemsChecked = "",
    dateOfCall = "",
    noOfVisits = "",
    datesOfInspection = "",
    trRecDate = "",
    quantityNowPassedText = "",
    sealingPattern = "",
    facsimileText = "",
    reasonsForRejection = "Not Applicable",
    inspectingEngineer = ""
  } = data;

  // Sanitize certificate number for display
  const displayCertificateNo = (certificateNo || '')
    .replace(/[\uFEFF\u200B]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();

  // Editable field component
  const EditableField = ({ value, fieldName, placeholder = "", className = "" }) => {
    if (isEditing) {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onFieldChange(fieldName, e.target.value)}
          placeholder={placeholder}
          className={`w-full p-0 border border-gray-300 rounded text-inherit font-inherit ${className}`}
        />
      );
    }
    return <span className={`text-black ${className}`}>{value}</span>;
  };

  return (
    <div className="a4-page">
      <div className="certificate-container border border-black flex-grow">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_2fr_1.5fr_1.5fr] border-b border-black font-semibold min-h-[50px]">
          <div className="border-r border-black py-1" />
          <div className="border-r border-black flex flex-col justify-center py-1 text-center">
            <div className="text-[10px]">प्रमाणपत्र सं. / Certificate No.</div>
            <div className="font-normal text-xs break-all leading-tight">
              <EditableField value={displayCertificateNo} fieldName="certificateNo" />
            </div>
          </div>
          <div className="border-r border-black flex flex-col justify-center py-1 text-center">
            <div className="text-[10px]">दिनांक / Date</div>
            <div className="font-normal text-xs">
              <EditableField value={certificateDate} fieldName="certificateDate" />
            </div>
          </div>
          <div className="flex flex-col justify-center py-1 px-2 text-[10px] leading-tight">
            <div className="font-normal">
              <span className="font-semibold block sm:inline">Instt No.</span>{" "}
              <span>{offeredInstNo}</span>
            </div>
            <div className="font-normal mt-1 pt-1 border-t border-dotted border-gray-400">
              <span className="font-semibold block leading-tight">परित किस्त सं. / Passed Instt No.</span>{" "}
              <span>{passedInstNo}</span>
            </div>
          </div>
        </div>

        {/* Contractor & Place of Inspection Row */}
        <div className="grid grid-cols-2 border-b border-black flex-grow min-h-[60px]">
          <div className="border-r border-black p-2 flex flex-col items-start">
            <div className="font-semibold text-[10px]">ठेकेदार / Contractor</div>
            <div className="break-words dynamic-text text-black uppercase text-xs font-bold leading-tight">{contractor}</div>
          </div>
          <div className="p-2 flex flex-col items-start">
            <div className="font-semibold text-[10px]">निरीक्षण का स्थान / Place of Inspection</div>
            <div className="break-words dynamic-text text-black uppercase text-xs font-bold leading-tight">{placeOfInspection}</div>
          </div>
        </div>

        {/* Contract Ref & Bill Paying Officer Row */}
        <div className="grid grid-cols-2 border-b border-black flex-grow min-h-[80px]">
          <div className="border-r border-black p-2 flex flex-col items-start">
            <div className="font-semibold text-[10px]">संविदा संदर्भ एवं Contract Reference</div>
            <div className="dynamic-text text-black text-xs mb-1 font-bold">{contractRef}</div>

            <div className="font-semibold mt-auto text-[10px]">दिनांक Date</div>
            <div className="dynamic-text text-black text-xs italic font-bold">
              <EditableField value={contractRefDate} fieldName="contractRefDate" placeholder="PO Date" />
            </div>
          </div>
          <div className="p-2 flex flex-col items-start">
            <div className="font-semibold text-[10px]">बिल अदायगी अधिकारी Bill Paying Officer</div>
            <div className="break-words dynamic-text text-black text-xs font-bold">{billPayingOfficer}</div>
          </div>
        </div>

        {/* Consignee & Purchasing Authority Row */}
        <div className="grid grid-cols-2 border-b border-black flex-grow min-h-[60px]">
          <div className="border-r border-black p-2 flex flex-col items-start">
            <div className="font-semibold text-[10px]">प्रेषिती / Consignee</div>
            <div className="break-words dynamic-text text-black text-xs font-bold uppercase">{consignee}</div>
          </div>
          <div className="p-2 flex flex-col items-start">
            <div className="font-semibold text-[10px]">क्रय प्राधिकारी / Purchasing Authority</div>
            <div className="break-words dynamic-text text-black text-xs font-bold uppercase">{purchasingAuthority}</div>
          </div>
        </div>

        {/* Store Details Table Section */}
        <div className="flex flex-col border-b border-black flex-grow">
          {/* Table Header Row 1 */}
          <div className="grid grid-cols-[0.5fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-black bg-gray-50 font-bold text-center text-[9px] leading-tight items-stretch">
            <div className="border-r border-black p-1 flex flex-col justify-center"><span>मद सं</span><span>Item No.</span></div>
            <div className="border-r border-black p-1 flex flex-col justify-center"><span>भंडार का विवरण</span><span>Description of Stores</span></div>
            <div className="border-r border-black p-1 flex flex-col justify-center"><span>आदेशित मात्रा</span><span>Quantity on order</span></div>
            <div className="border-r border-black p-1 flex flex-col justify-center"><span>पहले प्रस्तुत संचयी मात्रा</span><span>Cumulative qty. offered previously</span></div>
            <div className="border-r border-black p-1 flex flex-col justify-center"><span>पहले स्वीकृत मात्रा</span><span>Quantity previously passed</span></div>
            <div className="border-r border-black p-1 flex flex-col justify-center"><span>अब प्रस्तुत मात्रा</span><span>Qty now offered</span></div>
            <div className="border-r border-black p-1 flex flex-col justify-center"><span>अब स्वीकृत मात्रा</span><span>Qty now passed</span></div>
            <div className="border-r border-black p-1 flex flex-col justify-center"><span>अब अस्वीकृत मात्रा</span><span>Qty now rejected</span></div>
            <div className="p-1 flex flex-col justify-center"><span>बकाया मात्रा</span><span>Qty still due</span></div>
          </div>

          {/* Table Header Row 2 (Column Numbers) */}
          <div className="grid grid-cols-[0.5fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-black text-center text-[9px] font-bold bg-white">
            <div className="border-r border-black">1</div>
            <div className="border-r border-black">2</div>
            <div className="border-r border-black">3</div>
            <div className="border-r border-black">4</div>
            <div className="border-r border-black">5</div>
            <div className="border-r border-black">6</div>
            <div className="border-r border-black">7</div>
            <div className="border-r border-black">8</div>
            <div className="">9</div>
          </div>

          {/* Table Data Row */}
          <div className="grid grid-cols-[0.5fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] text-center text-[10px] items-stretch border-b border-black flex-grow min-h-[100px]">
            <div className="border-r border-black p-1 flex items-start justify-center pt-2 font-bold">{itemNo}</div>
            <div className="border-r border-black p-2 text-left break-words flex flex-col items-start font-bold">
              <span className="uppercase">{description}</span>
            </div>
            
            {/* Units and Values for cols 3-9 */}
            {[
              { val: qtyOnOrder, field: "qtyOnOrder" },
              { val: qtyOfferedPreviously, field: "qtyOfferedPreviously" },
              { val: qtyPassedPreviously, field: "qtyPassedPreviously" },
              { val: qtyNowOffered, field: "qtyNowOffered" },
              { val: qtyNowPassed, field: "qtyNowPassed" },
              { val: qtyNowRejected, field: "qtyNowRejected" },
              { val: qtyStillDue, field: "qtyStillDue" }
            ].map((col, idx) => (
              <div key={idx} className={`${idx === 6 ? "" : "border-r"} border-black p-1 flex flex-col items-center pt-2`}>
                <span className="mb-1 font-semibold text-[9px]"></span>
                <EditableField value={col.val} fieldName={col.field} className="font-bold text-sm" />
              </div>
            ))}
          </div>

          {/* Quantity in Words Row */}
          <div className="p-2 text-[10px] bg-white border-b border-black min-h-[40px]">
            <EditableField 
              value={quantityNowPassedText} 
              fieldName="quantityNowPassedText" 
              placeholder="QUANTITY NOW PASSED: (In words and details...)" 
              className="font-bold text-red-600 block leading-normal uppercase italic" 
            />
          </div>
        </div>

        {/* Inspection Details Section (5-column grid) */}
        <div className="grid grid-cols-5 border-b border-black text-[9px] flex-grow min-h-[60px]">
          <div className="border-r border-black p-1 flex flex-col justify-between">
            <div className="font-bold leading-tight">जाँची गई इकाइयों की संख्या<br />No. of items checked</div>
            <div className="text-black font-bold uppercase">{noOfItemsChecked}</div>
          </div>
          <div className="border-r border-black p-1 flex flex-col justify-between">
            <div className="font-bold leading-tight">बुलावे की तिथि<br />Date of call</div>
            <div className="text-black font-bold">{dateOfCall}</div>
          </div>
          <div className="border-r border-black p-1 flex flex-col justify-between text-center">
            <div className="font-bold leading-tight">दौरों की संख्या<br />No. of visits</div>
            <div className="text-black font-bold uppercase">{noOfVisits}</div>
          </div>
          <div className="border-r border-black p-1 flex flex-col justify-between">
            <div className="font-bold leading-tight">निरीक्षण की तिथि (तिथियाँ) /<br />Date(s) of inspection</div>
            <div className="text-red-500 font-bold text-[8px] leading-tight">{datesOfInspection}</div>
          </div>
          <div className="p-1 flex flex-col justify-between">
            <div className="font-bold leading-tight">TR Rec. Dt.</div>
            <div className="text-black font-bold italic">
              <EditableField value={trRecDate} fieldName="trRecDate" placeholder="TR Date" />
            </div>
          </div>
        </div>

        {/* Sealing & Facsimile Section Row */}
        <div className="grid grid-cols-3 border-b border-black text-[9px] flex-grow min-h-[80px]">
          <div className="border-r border-black p-2 col-span-1 flex flex-col">
            <div className="font-bold leading-tight mb-1">सील / स्टैम्पिंग तथा स्थान / Pattern of sealing/stamping and location of seal/stamp/sticker</div>
            <div className="text-red-500 break-words italic text-[8px] leading-snug flex-grow">{sealingPattern}</div>
          </div>
          <div className="border-r border-black p-2 col-span-1 flex flex-col">
            <div className="font-bold leading-tight mb-1">मुहर / स्टैम्प की प्रतिकृति / Facsimile of seal/stamp/sticker</div>
            <div className="text-black break-words italic flex-grow">{facsimileText}</div>
          </div>
          <div className="p-2 col-span-1 flex flex-col">
            <div className="font-bold leading-tight mb-auto">निरीक्षण अभियंता / Inspecting Engineer</div>
            <div className="text-right font-bold uppercase text-[11px]">{inspectingEngineer}</div>
          </div>
        </div>

        {/* Reasons for Rejection row */}
        <div className="border-b border-black p-2 text-[10px] flex-grow min-h-[40px]">
          <div className="font-semibold">अस्वीकृति का कारण / Reasons for rejection:</div>
          <div className="mt-1 italic">{reasonsForRejection}</div>
        </div>

        {/* Sub-Footer row */}
        <div className="border-b border-black p-1 text-center font-bold text-[11px] italic">
          It is certified that material is cleared for the next stage.
        </div>

        {/* Bottom Footer row */}
        <div className="p-2 text-center text-[9px] text-gray-700 leading-tight">
          <div className="font-semibold">Distribution:</div>
          <div>Manufacturer Office copy with case, RITES Bill Copy, Contractor, Purchaser (Railway), Consignee (Railway), Consignee (Manufacturer of finished product), RITES Office copy, RITES for final IC</div>
        </div>
      </div>
    </div>
  );
};

export default ErcFinalIc;
