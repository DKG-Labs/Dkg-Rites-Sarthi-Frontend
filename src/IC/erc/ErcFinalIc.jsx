import React from "react";

// Allowed fields from Excel specs
const allowedFields = [
  "bookNo", "setNo", "offeredInstNo", "passedInstNo", "maNumberAndDate",
  "consignee", "purchasingAuthority", "description", 
  "qtyOfferedPreviously", "qtyPassedPreviously", "qtyStillDue", "trRecDate",
  "quantityNowPassedText", "noOfVisits", "datesOfInspection"
];

// Editable field component moved outside to prevent re-mounting
const EditableField = ({ value, fieldName, placeholder = "", className = "", type = "text", disabled = false, isEditing, onFieldChange, isBusy, maxLength }) => {
  if (isEditing && allowedFields.includes(fieldName)) {
    if (type === "textarea") {
      return (
        <textarea
          value={value || ""}
          onChange={(e) => onFieldChange(fieldName, e.target.value)}
          placeholder={placeholder}
          className={`w-full p-1 border border-blue-400 bg-blue-50 text-sm`}
          rows={2}
          disabled={disabled || isBusy}
          maxLength={maxLength}
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
        disabled={disabled || isBusy}
        maxLength={maxLength}
      />
    );
  }

  return type === "inline" ? <span className={className}>{value}</span> : <div className={className}>{value}</div>;
};


const ErcFinalIc = ({ data = {}, isEditing = false, isBusy = false, onFieldChange = () => { }, onVerifyBookSet, bookSetValidation }) => {

  const {
    certificateNo = "",
    certificateDate = "",
    offeredInstNo = "",
    passedInstNo = "",
    contractor = "",
    placeOfInspection = "",
    contractRef = "",
    maNumberAndDate = "",
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
    inspectingEngineer = "",
    bookNo = "",
    setNo = "",
  } = data;

  // Still Due Qty = Order Qty - Previously Passed Qty - Now Passed Qty
  const numQtyOnOrder = parseFloat(qtyOnOrder) || 0;
  const numQtyPassedPreviously = parseFloat(qtyPassedPreviously) || 0;
  const numQtyNowPassed = parseFloat(qtyNowPassed) || 0;
  const calculatedQtyStillDue = Math.max(0, numQtyOnOrder - numQtyPassedPreviously - numQtyNowPassed);
  const displayQtyStillDue = (numQtyOnOrder > 0 || numQtyPassedPreviously > 0 || numQtyNowPassed > 0)
    ? String(calculatedQtyStillDue)
    : (qtyStillDue || "0");

  // Sanitize certificate number for display
  const displayCertificateNo = (certificateNo || '')
    .replace(/[\uFEFF\u200B]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();

  const isOldIcValid = data?.bookNo?.length === 4 && /^\d{3}$/.test(data?.setNo);
  const isFormLocked = isEditing && (
    (data?.icType === 'new' && !bookSetValidation?.isValid) ||
    (data?.icType !== 'new' && !isOldIcValid)
  );

  return (
    <div className="a4-page text-black">
      <div className="certificate-container flex flex-col flex-grow text-black">
        {/* Row 1 & 2: RE-CENTERED HEADER UNIT (Red-Marked Design) */}
        <div className="flex flex-col items-center pt-2 w-full">
          {/* Centered Box */}
          <div className="flex flex-col items-center pt-7">
            
            {/* Old / New IC Toggle */}
            {isEditing && (
              <div className="flex gap-4 mb-2 no-print text-[12px] font-bold">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input 
                    type="radio" 
                    name="icTypeFinal" 
                    value="old" 
                    checked={data?.icType !== 'new'} 
                    onChange={() => onFieldChange("icType", "old")} 
                  /> Old IC
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input 
                    type="radio" 
                    name="icTypeFinal" 
                    value="new" 
                    checked={data?.icType === 'new'} 
                    onChange={() => onFieldChange("icType", "new")} 
                  /> New IC
                </label>
              </div>
            )}

            <div className="grid grid-cols-2 border-2 border-black w-[180px] bg-white">
              <div className="border-r-2 border-black flex flex-col">
                <div className="border-b-2 border-black p-1 font-bold text-center text-[9px] leading-tight">
                  <div className="h-[2px]" />
                  बुक सं. Book No.
                  <div className="h-[2px]" />
                </div>
                <div className="p-1 flex items-center justify-center min-h-[22px]">
                  <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={bookNo} fieldName="bookNo" disabled={isBusy} className="text-center font-bold text-[12px]" maxLength={4} />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="border-b-2 border-black p-1 font-bold text-center text-[9px] leading-tight">
                  <div className="h-[2px]" />
                  सेट सं. Set No.
                  <div className="h-[2px]" />
                </div>
                <div className="p-1 flex items-center justify-center min-h-[22px]">
                  <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={setNo} fieldName="setNo" disabled={isBusy} className="text-center font-bold text-[12px]" maxLength={3} />
                </div>
              </div>
            </div>
            
            {/* Verify Book & Set No Button (Hidden in PDF) */}
            {isEditing && data?.icType === 'new' && (
              <div className="no-print mt-1 flex items-center gap-2">
                <button 
                  onClick={onVerifyBookSet} 
                  disabled={isBusy || bookSetValidation?.isValidating}
                  className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {bookSetValidation?.isValidating ? "Validating..." : "Verify Book & Set No."}
                </button>
                {bookSetValidation && !bookSetValidation.isValidating && (
                  <span className="text-[10px] font-bold">
                    {bookSetValidation.isValid ? (
                      <span className="text-green-600" title="Valid Book & Set No">✅ Valid</span>
                    ) : (
                      <span className="text-red-600" title={bookSetValidation.message || "Invalid"}>❌ Invalid</span>
                    )}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Height-Aware Branding Row (3-column grid for perfect centering) */}
          <div className="w-full grid grid-cols-[1fr_auto_1fr] items-end mt-3 px-4">
            <div className="empty-col"></div>
            <div className="text-center font-bold text-[13px] uppercase">
              {data?.region || "RITES LIMITED, NORTHERN REGION, DELHI"}
            </div>
            <div className="text-right leading-tight">
              <div className="text-[9.5px] font-bold">निरंतरता पत्रक शामिल</div>
              <div className="text-[8.5px] font-bold">Contains 0 Continuation Sheets</div>
            </div>
          </div>
        </div>

        {/* Physical Spacer to prevent Row 3 overlap in PDF */}
        <div className="h-4" />

        {/* Row 3: Certificate No, Date, Instances - STABILIZED */}
        <fieldset disabled={isFormLocked} className={`border-0 p-0 m-0 min-w-0 w-full transition-opacity duration-300 ${isFormLocked ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
        <div className="flex justify-end">
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
                <div className="text-[11px] pr-8"><EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={offeredInstNo} fieldName="offeredInstNo" type="inline" /></div>
              </div>
              <div className="mt-1 pt-1 border-t border-dotted border-gray-400 flex justify-between items-center">
                <div className="pb-1">
                  <div>किस्त स. पारित Passed Instt. No.</div>
                </div>
                <div className="text-[11px] pr-8 pb-1"><EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={passedInstNo} fieldName="passedInstNo" type="inline" /></div>
              </div>
            </div>
          </div>
        </div>

        {/* Contractor & Place of Inspection Row - START FULL-WIDTH BOX */}
        <div className="grid grid-cols-2 border border-black min-h-[35px]">
          <div className="border-r border-black p-2 flex flex-col items-start text-[10px]">
            <div className="h-1.5" />
            <div className="font-semibold text-[9px]">ठेकेदार / Contractor</div>
            <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={contractor} fieldName="contractor" type="textarea" className="break-words dynamic-text text-black uppercase font-bold leading-tight" />
          </div>
          <div className="p-2 flex flex-col items-start text-[10px]">
            <div className="h-1.5" />
            <div className="font-semibold text-[9px]">निरीक्षण का स्थान / Place of Inspection</div>
            <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={placeOfInspection} fieldName="placeOfInspection" type="textarea" className="break-words dynamic-text text-black uppercase font-bold leading-tight" />
          </div>
        </div>

        {/* Contract Ref & Bill Paying Officer Row */}
        <div className="grid grid-cols-2 border-x border-b border-black min-h-[35px]">
          <div className="border-r border-black p-2 flex flex-col items-start text-[10px]">
            <div className="h-1.5" />
            <div className="font-semibold text-[9px]">संविदा संदर्भ एवं Contract Reference</div>
            <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={contractRef} fieldName="contractRef" type="textarea" className="dynamic-text text-black font-bold leading-tight" />
            <div className="dynamic-text text-black italic font-bold leading-tight mt-1">
              <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={maNumberAndDate} fieldName="maNumberAndDate" placeholder="MA Number & Date" />
            </div>
          </div>
          <div className="p-2 flex flex-col items-start text-[10px]">
            <div className="h-1.5" />
            <div className="font-semibold text-[9px]">बिल अदायगी अधिकारी Bill Paying Officer</div>
            <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={billPayingOfficer} fieldName="billPayingOfficer" type="textarea" className="break-words dynamic-text text-black font-bold leading-tight" />
          </div>
        </div>

        {/* Consignee & Purchasing Authority Row */}
        <div className="grid grid-cols-2 border-x border-b border-black min-h-[35px]">
          <div className="border-r border-black p-2 flex flex-col items-start text-[10px]">
            <div className="font-semibold text-[9px] pt-1">प्रेषिती / Consignee</div>
            <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={consignee} fieldName="consignee" type="textarea" className="break-words dynamic-text text-black font-bold uppercase leading-tight" />
          </div>
          <div className="p-2 flex flex-col items-start text-[10px]">
            <div className="font-semibold text-[9px] pt-1">क्रय प्राधिकारी / Purchasing Authority</div>
            <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={purchasingAuthority} fieldName="purchasingAuthority" type="textarea" className="break-words dynamic-text text-black font-bold uppercase leading-tight" />
          </div>
        </div>

        {/* Store Details Table Section */}
        <div className="flex flex-col border-x border-b border-black">
          {/* Table Header Row 1 */}
          <div className="grid grid-cols-[0.4fr_3.8fr_0.75fr_0.75fr_0.75fr_0.75fr_0.75fr_0.75fr_0.75fr] border-b border-black bg-gray-50 font-bold text-center text-[8.5px] leading-[1.1] items-stretch min-h-[40px] text-black">
            <div className="border-r border-black p-1 flex flex-col justify-center"><span>मद सं</span><span>Item No.</span></div>
            <div className="border-r border-black p-1.5 flex flex-col justify-center"><span>भंडार का विवरण</span><span>Description of Stores</span></div>
            <div className="border-r border-black p-1 flex flex-col justify-center"><span>आदेशित मात्रा</span><span>Quantity on order</span></div>
            <div className="border-r border-black p-1 flex flex-col justify-center"><span>पहले प्रस्तुत संचयी मात्रा</span><span>Cumulative qty. offered previously</span></div>
            <div className="border-r border-black p-1 flex flex-col justify-center"><span>पहले स्वीकृत मात्रा</span><span>Quantity previously passed</span></div>
            <div className="border-r border-black p-1 flex flex-col justify-center"><span>अब प्रस्तुत मात्रा</span><span>Qty now offered</span></div>
            <div className="border-r border-black p-1 flex flex-col justify-center"><span>अब स्वीकृत मात्रा</span><span>Qty now passed</span></div>
            <div className="border-r border-black p-1 flex flex-col justify-center"><span>अब अस्वीकृत मात्रा</span><span>Qty now rejected</span></div>
            <div className="p-1 flex flex-col justify-center"><span>बकाया मात्रा</span><span>Qty still due</span></div>
          </div>

          {/* Table Header Row 2 (Column Numbers) */}
          <div className="grid grid-cols-[0.4fr_3.8fr_0.75fr_0.75fr_0.75fr_0.75fr_0.75fr_0.75fr_0.75fr] border-b border-black text-center text-[9px] font-bold bg-white items-stretch min-h-[22px] text-black">
            <div className="border-r border-black py-0.5 flex items-center justify-center">1</div>
            <div className="border-r border-black py-0.5 flex items-center justify-center">2</div>
            <div className="border-r border-black py-0.5 flex items-center justify-center">3</div>
            <div className="border-r border-black py-0.5 flex items-center justify-center">4</div>
            <div className="border-r border-black py-0.5 flex items-center justify-center">5</div>
            <div className="border-r border-black py-0.5 flex items-center justify-center">6</div>
            <div className="border-r border-black py-0.5 flex items-center justify-center">7</div>
            <div className="border-r border-black py-0.5 flex items-center justify-center">8</div>
            <div className="py-0.5 flex items-center justify-center">9</div>
          </div>

          {/* Table Data Row */}
          <div className="grid grid-cols-[0.4fr_3.8fr_0.75fr_0.75fr_0.75fr_0.75fr_0.75fr_0.75fr_0.75fr] text-center text-[10px] items-stretch border-b border-black min-h-[40px]">
            <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={itemNo} fieldName="itemNo" className="border-r border-black p-1 flex items-center justify-center font-bold" />
            <div className="border-r border-black p-1.5 text-left break-words flex flex-col justify-center font-bold">
              <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={description} fieldName="description" type="textarea" className="uppercase text-[8.5px] leading-[1.2] tracking-tight" />
            </div>

            {/* Units and Values for cols 3-9 */}
            {[
              { val: qtyOnOrder, field: "qtyOnOrder" },
              { val: qtyOfferedPreviously, field: "qtyOfferedPreviously" },
              { val: qtyPassedPreviously, field: "qtyPassedPreviously" },
              { val: qtyNowOffered, field: "qtyNowOffered" },
              { val: qtyNowPassed, field: "qtyNowPassed" },
              { val: qtyNowRejected, field: "qtyNowRejected" },
              { val: displayQtyStillDue, field: "qtyStillDue" }
            ].map((col, idx) => (
              <div key={idx} className={`${idx === 6 ? "" : "border-r"} border-black p-1 flex flex-col items-center justify-center`}>
                <span className="mb-1 font-semibold text-[9px]"></span>
                <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={col.val} fieldName={col.field} className="font-bold text-xs whitespace-nowrap text-center" />
              </div>
            ))}
          </div>

          {/* Quantity in Words Row */}
          <div className="p-2 text-[10px] bg-white border-b border-black min-h-[40px]">
            <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy}
              value={quantityNowPassedText}
              fieldName="quantityNowPassedText"
              type="textarea"
              placeholder="QUANTITY NOW PASSED: (In words and details...)"
              className="font-bold text-black block leading-normal uppercase italic"
            />
          </div>
        </div>

        {/* Inspection Details Section (5-column grid) */}
        <div className="grid grid-cols-5 border-x border-b border-black text-[9px] min-h-[40px]">
          <div className="border-r border-black p-1 flex flex-col">
            <div className="font-bold leading-tight">जाँची गई इकाइयों की संख्या / No. of checked</div>
            <div className="mt-1">
              <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={noOfItemsChecked} fieldName="noOfItemsChecked" className="text-black font-bold uppercase" />
            </div>
          </div>
          <div className="border-r border-black p-1 flex flex-col">
            <div className="font-bold leading-tight">बुलावे की तिथि / Date of call</div>
            <div className="mt-1">
              <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={dateOfCall} fieldName="dateOfCall" className="text-black font-bold" />
            </div>
          </div>
          <div className="border-r border-black p-1 flex flex-col">
            <div className="font-bold leading-tight">दौरों की संख्या / No. of visits</div>
            <div className="mt-1">
              <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={noOfVisits} fieldName="noOfVisits" className="text-black font-bold uppercase" />
            </div>
          </div>
          <div className="border-r border-black p-1 flex flex-col">
            <div className="font-bold leading-tight">निरीक्षण की तिथि / Date(s) of inspection</div>
            <div className="mt-1">
              <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={datesOfInspection} fieldName="datesOfInspection" className="text-black font-bold leading-tight text-[9px]" />
            </div>
          </div>
          <div className="p-1 flex flex-col">
            <div className="font-bold leading-tight">TR Rec. Dt.</div>
            <div className="mt-1 text-black font-bold italic">
              <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={trRecDate} fieldName="trRecDate" placeholder="TR Date" />
            </div>
          </div>
        </div>

        {/* Sealing & Facsimile Section Row */}
        <div className="grid grid-cols-3 border-x border-b border-black text-[9px] min-h-[40px]">
          <div className="border-r border-black p-1 flex flex-col">
            <div className="font-bold leading-tight">Seal/Stamping Pattern</div>
            <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={sealingPattern} fieldName="sealingPattern" type="textarea" className="text-black font-bold italic text-[9px] leading-tight flex-grow" />
          </div>
          <div className="border-r border-black p-1 flex flex-col">
            <div className="font-bold leading-tight">Facsimile of seal</div>
            <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={facsimileText} fieldName="facsimileText" type="textarea" className="text-black italic leading-tight flex-grow" />
          </div>
          <div className="p-1 flex flex-col justify-between min-h-[90px] relative">
            <div className="font-bold leading-tight text-[9.5px]">Inspecting Engineer</div>
            <div className="flex flex-col items-end w-full mt-1">
              <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={inspectingEngineer} fieldName="inspectingEngineer" className="text-right font-bold uppercase text-[10px]" />
            </div>
          </div>
        </div>

        {/* Reasons for Rejection row */}
        <div className="border-x border-b border-black p-1 text-[10px] min-h-[30px]">
          <div className="font-semibold">अस्वीकृति का कारण / Reasons for rejection:</div>
          <EditableField isEditing={isEditing} onFieldChange={onFieldChange} isBusy={isBusy} value={reasonsForRejection} fieldName="reasonsForRejection" type="textarea" className="italic leading-tight" />
        </div>

        {/* Static Bilingual Validity Statement for Final IC */}
        <div className="grid grid-cols-2 border-x border-b border-black text-[8.5px] leading-tight font-bold italic">
          <div className="border-r border-black p-1 text-center">
            सामग्री को शीघ्र अति शीघ्र भेजा जाना चाहिए। प्रमाण पत्र सामग्री भेजने के लिए ३० दिन तक मान्य है। सभी प्रकार के पीएससी स्लीपर के लिए यह प्रमाणपत्र ९० दिनों तक मान्य रहेगा।
          </div>
          <div className="p-1 text-center">
            The material should be dispatched as early as possible. The certificate is valid for a period of 30 days for dispatch of stores. However, in the case of all types of PSC Sleepers, the certificate is valid for 90 days.
          </div>
        </div>
        </fieldset>
        {/* Bottom spacer — reserves space for physical printer footer */}
        <div style={{ minHeight: '20mm' }} />
      </div>
    </div>
  );
};

export default ErcFinalIc;
