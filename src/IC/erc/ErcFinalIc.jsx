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
  const EditableField = ({ value, fieldName, placeholder = "", className = "", type = "text" }) => {
    if (isEditing) {
      if (type === "textarea") {
        return (
          <textarea
            value={value || ""}
            onChange={(e) => onFieldChange(fieldName, e.target.value)}
            placeholder={placeholder}
            className={`w-full p-1 border border-blue-400 bg-blue-50 text-sm`}
            rows={2}
          />
        );
      }
      return (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onFieldChange(fieldName, e.target.value)}
          placeholder={placeholder}
          className={`w-full p-0 border border-blue-400 bg-blue-50 text-sm`}
          style={type === "inline" ? { display: "inline-block", width: "80px" } : {}}
        />
      );
    }
    return type === "inline" ? <span className={className}>{value}</span> : <div className={className}>{value}</div>;
  };

  return (
    <div className="a4-page">
      <div className="certificate-container border border-black flex-grow">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_2fr_1.5fr_1.5fr] border-b border-black font-semibold min-h-[50px]">
          <div className="border-r border-black py-1" />
          <div className="border-r border-black flex flex-col justify-center py-1 text-center">
            <div className="text-[10px]">प्रमाण पत्र सं. / Certificate No.</div>
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
              <EditableField value={offeredInstNo} fieldName="offeredInstNo" type="inline" />
            </div>
            <div className="font-normal mt-1 pt-1 border-t border-dotted border-gray-400">
              <span className="font-semibold block leading-tight">पारित किस्त सं. / Passed Instt No.</span>{" "}
              <EditableField value={passedInstNo} fieldName="passedInstNo" type="inline" />
            </div>
          </div>
        </div>

        {/* Contractor & Place of Inspection Row */}
        <div className="grid grid-cols-2 border-b border-black flex-grow min-h-[60px]">
          <div className="border-r border-black p-2 flex flex-col items-start">
            <div className="font-semibold text-[10px]">ठेकेदार / Contractor</div>
            <EditableField value={contractor} fieldName="contractor" type="textarea" className="break-words dynamic-text text-black uppercase text-xs font-bold leading-tight" />
          </div>
          <div className="p-2 flex flex-col items-start">
            <div className="font-semibold text-[10px]">निरीक्षण का स्थान / Place of Inspection</div>
            <EditableField value={placeOfInspection} fieldName="placeOfInspection" type="textarea" className="break-words dynamic-text text-black uppercase text-xs font-bold leading-tight" />
          </div>
        </div>

        {/* Contract Ref & Bill Paying Officer Row */}
        <div className="grid grid-cols-2 border-b border-black flex-grow min-h-[80px]">
          <div className="border-r border-black p-2 flex flex-col items-start">
            <div className="font-semibold text-[10px]">संविदा संदर्भ एवं Contract Reference</div>
            <EditableField value={contractRef} fieldName="contractRef" type="textarea" className="dynamic-text text-black text-xs mb-1 font-bold" />

            <div className="font-semibold mt-auto text-[10px]">दिनांक Date</div>
            <div className="dynamic-text text-black text-xs italic font-bold">
              <EditableField value={contractRefDate} fieldName="contractRefDate" placeholder="PO Date" />
            </div>
          </div>
          <div className="p-2 flex flex-col items-start">
            <div className="font-semibold text-[10px]">बिल अदायगी अधिकारी Bill Paying Officer</div>
            <EditableField value={billPayingOfficer} fieldName="billPayingOfficer" type="textarea" className="break-words dynamic-text text-black text-xs font-bold" />
          </div>
        </div>

        {/* Consignee & Purchasing Authority Row */}
        <div className="grid grid-cols-2 border-b border-black flex-grow min-h-[60px]">
          <div className="border-r border-black p-2 flex flex-col items-start">
            <div className="font-semibold text-[10px]">प्रेषिती / Consignee</div>
            <EditableField value={consignee} fieldName="consignee" type="textarea" className="break-words dynamic-text text-black text-xs font-bold uppercase" />
          </div>
          <div className="p-2 flex flex-col items-start">
            <div className="font-semibold text-[10px]">क्रय प्राधिकारी / Purchasing Authority</div>
            <EditableField value={purchasingAuthority} fieldName="purchasingAuthority" type="textarea" className="break-words dynamic-text text-black text-xs font-bold uppercase" />
          </div>
        </div>

        {/* Store Details Table Section */}
        <div className="flex flex-col border-b border-black flex-grow">
          {/* Table Header Row 1 */}
          <div className="grid grid-cols-[0.5fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-black bg-gray-50 font-bold text-center text-[9px] leading-[1.1] items-stretch min-h-[65px] text-black">
            <div className="border-r border-black p-1.5 flex flex-col justify-center"><span>मद सं</span><span>Item No.</span></div>
            <div className="border-r border-black p-1.5 flex flex-col justify-center"><span>भंडार का विवरण</span><span>Description of Stores</span></div>
            <div className="border-r border-black p-1.5 flex flex-col justify-center"><span>आदेशित मात्रा</span><span>Quantity on order</span></div>
            <div className="border-r border-black p-1.5 flex flex-col justify-center"><span>पहले प्रस्तुत संचयी मात्रा</span><span>Cumulative qty. offered previously</span></div>
            <div className="border-r border-black p-1.5 flex flex-col justify-center"><span>पहले स्वीकृत मात्रा</span><span>Quantity previously passed</span></div>
            <div className="border-r border-black p-1.5 flex flex-col justify-center"><span>अब प्रस्तुत मात्रा</span><span>Qty now offered</span></div>
            <div className="border-r border-black p-1.5 flex flex-col justify-center"><span>अब स्वीकृत मात्रा</span><span>Qty now passed</span></div>
            <div className="border-r border-black p-1.5 flex flex-col justify-center"><span>अब अस्वीकृत मात्रा</span><span>Qty now rejected</span></div>
            <div className="p-1.5 flex flex-col justify-center"><span>बकाया मात्रा</span><span>Qty still due</span></div>
          </div>

          {/* Table Header Row 2 (Column Numbers) */}
          <div className="grid grid-cols-[0.5fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-black text-center text-[9px] font-bold bg-white items-stretch min-h-[25px] text-black">
            <div className="border-r border-black py-1 flex items-center justify-center">1</div>
            <div className="border-r border-black py-1 flex items-center justify-center">2</div>
            <div className="border-r border-black py-1 flex items-center justify-center">3</div>
            <div className="border-r border-black py-1 flex items-center justify-center">4</div>
            <div className="border-r border-black py-1 flex items-center justify-center">5</div>
            <div className="border-r border-black py-1 flex items-center justify-center">6</div>
            <div className="border-r border-black py-1 flex items-center justify-center">7</div>
            <div className="border-r border-black py-1 flex items-center justify-center">8</div>
            <div className="py-1 flex items-center justify-center">9</div>
          </div>

          {/* Table Data Row */}
          <div className="grid grid-cols-[0.5fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] text-center text-[10px] items-stretch border-b border-black flex-grow min-h-[100px]">
            <EditableField value={itemNo} fieldName="itemNo" className="border-r border-black p-1 flex items-center justify-center font-bold" />
            <div className="border-r border-black p-2 text-left break-words flex flex-col justify-center font-bold">
              <EditableField value={description} fieldName="description" type="textarea" className="uppercase" />
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
              <div key={idx} className={`${idx === 6 ? "" : "border-r"} border-black p-1 flex flex-col items-center justify-center`}>
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
              className="font-bold text-black block leading-normal uppercase italic"
            />
          </div>
        </div>

        {/* Inspection Details Section (5-column grid) */}
        <div className="grid grid-cols-5 border-b border-black text-[9px] flex-grow min-h-[60px]">
          <div className="border-r border-black p-1 flex flex-col">
            <div className="font-bold leading-tight">जाँची गई इकाइयों की संख्या<br />No. of items checked</div>
            <div className="mt-2 text-left">
              <EditableField value={noOfItemsChecked} fieldName="noOfItemsChecked" className="text-black font-bold uppercase" />
            </div>
          </div>
          <div className="border-r border-black p-1 flex flex-col">
            <div className="font-bold leading-tight">बुलावे की तिथि<br />Date of call</div>
            <div className="mt-2 text-left">
              <EditableField value={dateOfCall} fieldName="dateOfCall" className="text-black font-bold" />
            </div>
          </div>
          <div className="border-r border-black p-1 flex flex-col">
            <div className="font-bold leading-tight">दौरों की संख्या<br />No. of visits</div>
            <div className="mt-2 text-left">
              <EditableField value={noOfVisits} fieldName="noOfVisits" className="text-black font-bold uppercase" />
            </div>
          </div>
          <div className="border-r border-black p-1 flex flex-col">
            <div className="font-bold leading-tight">निरीक्षण की तिथि (तिथियाँ) /<br />Date(s) of inspection</div>
            <div className="mt-2 text-left">
              <EditableField value={datesOfInspection} fieldName="datesOfInspection" className="text-black font-bold text-[9px] leading-tight" />
            </div>
          </div>
          <div className="p-1 flex flex-col">
            <div className="font-bold leading-tight">TR Rec. Dt.</div>
            <div className="mt-2 text-left text-black font-bold italic">
              <EditableField value={trRecDate} fieldName="trRecDate" placeholder="TR Date" />
            </div>
          </div>
        </div>

        {/* Sealing & Facsimile Section Row */}
        <div className="grid grid-cols-3 border-b border-black text-[9px] flex-grow min-h-[80px]">
          <div className="border-r border-black p-2 col-span-1 flex flex-col">
            <div className="font-bold leading-tight mb-1">सील / स्टैम्पिंग तथा स्थान / Pattern of sealing/stamping and location of seal/stamp/sticker</div>
            <EditableField value={sealingPattern} fieldName="sealingPattern" type="textarea" className="text-black font-bold break-words italic text-[9px] leading-snug flex-grow" />
          </div>
          <div className="border-r border-black p-2 col-span-1 flex flex-col">
            <div className="font-bold leading-tight mb-1">मुहर / स्टैम्प की प्रतिकृति / Facsimile of seal/stamp/sticker</div>
            <EditableField value={facsimileText} fieldName="facsimileText" type="textarea" className="text-black break-words italic flex-grow" />
          </div>
          <div className="p-2 col-span-1 flex flex-col">
            <div className="font-bold leading-tight mb-auto">निरीक्षण अभियंता / Inspecting Engineer</div>
            <EditableField value={inspectingEngineer} fieldName="inspectingEngineer" className="text-right font-bold uppercase text-[11px]" />
          </div>
        </div>

        {/* Reasons for Rejection row */}
        <div className="border-b border-black p-2 text-[10px] flex-grow min-h-[40px]">
          <div className="font-semibold">अस्वीकृति का कारण / Reasons for rejection:</div>
          <EditableField value={reasonsForRejection} fieldName="reasonsForRejection" type="textarea" className="mt-1 italic" />
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
