import React from "react";

const EditableField = ({ isEditing, value, onChange, className = "", type = "text", disabled = false, maxLength }) => {

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
        maxLength={maxLength}
      />
    );
  }
  return (
    <input
      type="text"
      className={`${className} w-full p-1 border border-blue-400 bg-blue-50 text-sm ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      maxLength={maxLength}
      style={type === "inline" ? { display: "inline-block", width: "80px" } : {}}
    />
  );
};

const ErcProcessIC = ({ data = {}, isEditing = false, isBusy = false, onChange = () => { }, onArrayChange = () => { }, onVerifyBookSet, bookSetValidation }) => {
  const {
    certificateNo = "",
    certificateDate = "",
    offeredInstNo = "",
    passedInstNo = "",
    contractor = "",
    manufacturer = "",
    contractRef = "",
    poDetails = "",
    maNumberAndDate = "",
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

  const numberToWords = (num) => {
    if (!num || isNaN(num) || num === 0) return "Zero";
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    
    if ((num = num.toString()).length > 9) return "Overflow";
    let n = ("000000000" + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return "";
    let str = "";
    str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + " Crore " : "";
    str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + " Lakh " : "";
    str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + " Thousand " : "";
    str += (Number(n[4]) !== 0) ? a[Number(n[4])] + " Hundred " : "";
    str += (Number(n[5]) !== 0) ? ((str !== "") ? " " : "") + (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]]) : "";
    return str.trim();
  };

  const formatCleanNum = (val) => {
    const n = Number(val || 0);
    if (isNaN(n)) return "0";
    return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3)));
  };

  const getErcKFactor = (typeStr) => {
    if (!typeStr) return 0.91;
    const lower = String(typeStr).toLowerCase().trim();

    // MK-V: 1.088
    if (
      lower.includes('mk-v') ||
      lower.includes('mk v') ||
      lower.includes('mark v') ||
      lower.includes('mark 5') ||
      lower.includes('mk 5') ||
      lower.includes('mkv') ||
      lower === '6025'
    ) {
      return 1.088;
    }

    // J Type: 0.915
    if (
      lower.includes('erc-j') ||
      lower.includes('erc j') ||
      lower.includes('j-type') ||
      lower.includes('j type') ||
      lower.includes('jtype')
    ) {
      return 0.915;
    }

    // MK-III: 0.91
    if (
      lower.includes('mk-iii') ||
      lower.includes('mk iii') ||
      lower.includes('mark iii') ||
      lower.includes('mark 3') ||
      lower.includes('mk 3') ||
      lower.includes('mkiii') ||
      lower === '3701'
    ) {
      return 0.91;
    }

    return 0.91;
  };

  const rawErcType = data?.ercType || data?.productType || data?.description || data?.drgNo || "";
  const kFactor = getErcKFactor(rawErcType);

  const formatNosWithMt = (nos) => {
    const n = Number(nos || 0);
    const cleanNos = formatCleanNum(n);
    const mt = (Math.round(((n * kFactor) / 1000) * 1000 + Number.EPSILON) / 1000).toFixed(3);
    return `${cleanNos} Nos. ~ (${mt} MT)`;
  };

  const numTotalProcessed = lots.reduce((s, l) => s + Number(l.totalProcessed || 0), 0);
  const numTotalRejected = lots.reduce((s, l) => s + Number(l.rejectedQty || 0), 0);
  const numTotalAccepted = Math.max(0, numTotalProcessed - numTotalRejected);

  const totalProcessed = formatNosWithMt(numTotalProcessed);
  const totalAccepted = formatNosWithMt(numTotalAccepted);
  const totalRejected = formatNosWithMt(numTotalRejected);

  const displayReference = (() => {
    if (!reference) return "";
    const acceptedInt = Math.round(numTotalAccepted);
    const words = numberToWords(acceptedInt);
    if (/^Quantity\s+.*?Nos\./i.test(reference)) {
      return reference.replace(/^Quantity\s+.*?Nos\./i, `Quantity ${words} Nos.`);
    }
    return reference;
  })();

  const extractPoSrNo = (refStr) => {
    if (!refStr) return "001";
    const refPart = refStr.split(/dated/i)[0].trim();
    const parts = refPart.split('/');
    if (parts.length > 1) {
      return parts[parts.length - 1];
    }
    return "001";
  };
  const poSrNoStr = extractPoSrNo(contractRef);

  const isOldIcValid = Boolean(data?.bookNo && String(data?.bookNo).trim().length > 0 && /^\d{3}$/.test(data?.setNo));
  const isFormLocked = isEditing && (
    (data?.icType === 'new' && !bookSetValidation?.isValid) ||
    (data?.icType !== 'new' && !isOldIcValid)
  );

  return (
    <div className="a4-page">
      <div className="certificate-container flex flex-col flex-grow">
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
                    name="icTypeProcess"
                    value="old"
                    checked={data?.icType !== 'new'}
                    onChange={() => onChange("icType", "old")}
                  /> Old IC
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="icTypeProcess"
                    value="new"
                    checked={data?.icType === 'new'}
                    onChange={() => onChange("icType", "new")}
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
                  <EditableField isEditing={isEditing} disabled={isBusy} value={bookNo} onChange={(val) => onChange("bookNo", val)} className="text-center font-bold text-[12px]" maxLength={10} />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="border-b-2 border-black p-1 font-bold text-center text-[9px] leading-tight">
                  <div className="h-[2px]" />
                  सेट सं. Set No.
                  <div className="h-[2px]" />
                </div>
                <div className="p-1 flex items-center justify-center min-h-[22px]">
                  <EditableField isEditing={isEditing} disabled={isBusy} value={setNo} onChange={(val) => onChange("setNo", val)} className="text-center font-bold text-[12px]" maxLength={3} />
                </div>
              </div>
            </div>

            {/* Verify Book & Set No Button (Hidden in PDF) */}
            {isEditing && data?.icType === 'new' && (
              <div className="no-print mt-1 flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
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

                {bookNo && String(bookNo).trim().length > 0 && String(bookNo).trim().length < 4 && (
                  <div className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-300 rounded px-2 py-1 text-center max-w-[220px] leading-tight">
                    ⚠️ Book Number is generally of 4 characters. Please ensure that the correct Book Number has been entered.
                  </div>
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
              <div className="border-r border-black p-1.5 pb-2.5 flex flex-col items-center justify-center text-center">
                <div className="font-bold text-[9px] uppercase">प्रमाणपत्र पत्र सं. Certificate No.</div>
                <div className="font-bold break-all text-[11px] leading-tight mt-1">{displayCertificateNo}</div>
              </div>

              {/* Col 2: Date */}
              <div className="border-r border-black p-1.5 pb-2.5 flex flex-col items-center justify-center text-center">
                <div className="font-bold text-[9px] uppercase">दिनांक Date</div>
                <div className="font-bold text-[11px] mt-1">{certificateDate}</div>
              </div>

              {/* Col 3: Instances */}
              <div className="p-1.5 pb-2.5 px-3 flex flex-col justify-center text-left leading-[1.1] text-[9px] font-bold">
                <div className="flex justify-between items-center">
                  <div>
                    <div>प्रस्तावित किस्त सं.</div>
                    <div>Offered Instt. No.</div>
                  </div>
                  <div className="text-[11px] pr-8"><EditableField isEditing={isEditing} value={offeredInstNo} onChange={(val) => onChange("offeredInstNo", val)} type="inline" /></div>
                </div>
                <div className="mt-1 pt-1 border-t border-dotted border-gray-400 flex justify-between items-center">
                  <div className="pb-1">
                    <div>किस्त स. पारित Passed Instt. No.</div>
                  </div>
                  <div className="text-[11px] pr-8 pb-1"><EditableField isEditing={isEditing} value={passedInstNo} onChange={(val) => onChange("passedInstNo", val)} type="inline" /></div>
                </div>
              </div>
            </div>
          </div>

          {/* Contractor / Manufacturer - START FULL-WIDTH BOX */}
          <div className="grid grid-cols-2 border border-black min-h-[48px]">
            <div className="border-r border-black p-2 pb-3.5">
              <div className="h-1.5" />
              <div className="font-semibold text-[10px]">ठेकेदार / Contractor</div>
              <EditableField isEditing={false} type="textarea" value={contractor} onChange={(val) => onChange("contractor", val)} className="break-words dynamic-text leading-tight mt-0.5" />
            </div>
            <div className="p-2 pb-3.5">
              <div className="h-1.5" />
              <div className="font-semibold text-[10px]">उत्पादक / Manufacturer</div>
              <EditableField isEditing={isEditing} type="textarea" value={manufacturer} onChange={(val) => onChange("manufacturer", val)} className="break-words dynamic-text leading-tight mt-0.5" />
              <div className="mt-1.5 font-semibold text-[10px] pt-1">
                निरीक्षण का स्थान / Place of Inspection
              </div>
              <EditableField isEditing={false} type="textarea" value={data.placeOfInspection || ''} onChange={(val) => onChange("placeOfInspection", val)} className="break-words dynamic-text leading-tight mt-0.5" />
            </div>
          </div>

          {/* Contract ref / PO / Bill officer */}
          <div className="grid grid-cols-2 border-x border-b border-black min-h-[48px]">
            <div className="border-r border-black p-2 pb-3.5">
              <div className="h-1.5" />
              <div className="font-semibold text-[10px]">
                संविदा संदर्भ एवं दिनांक (रेलवे) / Contract Ref. & Date (Rly.)
              </div>
              <EditableField isEditing={isEditing} type="textarea" value={contractRef} onChange={(val) => onChange("contractRef", val)} className="dynamic-text leading-tight mt-0.5" />
              <div className="mt-1.5 font-semibold text-[10px] pt-1">
                खरीद आदेश सं. एवं दिनांक (ठेकेदार) / PO No. & Date (Contractor)
              </div>
              <EditableField isEditing={false} type="textarea" value={poDetails} onChange={(val) => onChange("poDetails", val)} className="dynamic-text leading-tight mt-0.5" />
              <div className="dynamic-text text-black italic font-bold leading-tight mt-1.5">
                <EditableField isEditing={isEditing} value={maNumberAndDate} onChange={(val) => onChange("maNumberAndDate", val)} placeholder="MA Number & Date" />
              </div>
            </div>
            <div className="p-2 pb-3.5">
              <div className="h-1.5" />
              <div className="font-semibold text-[10px]">
                बिल अदायगी अधिकारी / Bill Paying Officer
              </div>
              <EditableField isEditing={isEditing} type="textarea" value={billPayingOfficer} onChange={(val) => onChange("billPayingOfficer", val)} className="dynamic-text leading-tight mt-0.5" />
            </div>
          </div>

          {/* Consignee / Purchasing authority */}
          <div className="grid grid-cols-2 border-x border-b border-black min-h-[48px]">
            <div className="border-r border-black p-2 pb-3.5">
              <div className="font-semibold text-[10px] pt-1">
                प्रेषिती (रेलवे) / Consignee (Railway)
              </div>
              <EditableField isEditing={isEditing} type="textarea" value={consigneeRailway} onChange={(val) => onChange("consigneeRailway", val)} className="break-words dynamic-text leading-tight mt-0.5" />
              <div className="mt-1.5 font-semibold text-[10px] pt-1">
                प्रेषिती (निर्मित उत्पाद निर्माता) / Consignee (Manufacturer of Finished Product)
              </div>
              <EditableField isEditing={false} type="textarea" value={consigneeManufacturer} onChange={(val) => onChange("consigneeManufacturer", val)} className="break-words dynamic-text leading-tight mt-0.5" />
            </div>
            <div className="p-2 pb-3.5">
              <div className="font-semibold text-[10px] pt-1">
                क्रय प्राधिकारी (रेलवे) / Purchasing Authority (Railway)
              </div>
              <EditableField isEditing={isEditing} type="textarea" value={purchasingAuthority} onChange={(val) => onChange("purchasingAuthority", val)} className="break-words dynamic-text leading-tight mt-0.5" />
            </div>
          </div>

          {/* Description / Drg / Spec / QAP */}
          <div className="grid grid-cols-3 border-x border-b border-black min-h-[48px]">
            <div className="border-r border-black p-1.5 pb-3.5">
              <div className="font-semibold text-[10px]">
                विवरण / Description (PO Sr. No. {poSrNoStr})
              </div>
              <EditableField isEditing={isEditing} type="textarea" value={description} onChange={(val) => onChange("description", val)} className="break-words dynamic-text leading-tight mt-0.5" />
            </div>
            <div className="border-r border-black p-1.5 pb-3.5">
              <div>
                <span className="font-semibold text-[10px]">ड्रॉइंग सं. / Drg. No. </span>
                <EditableField isEditing={false} value={drgNo} onChange={(val) => onChange("drgNo", val)} className="leading-tight mt-0.5" />
              </div>
              <div className="mt-1.5">
                <span className="font-semibold text-[10px]">विनिर्देश सं. / Specn. No. </span>
                <EditableField isEditing={false} value={specNo} onChange={(val) => onChange("specNo", val)} className="leading-tight mt-0.5" />
              </div>
            </div>
            <div className="p-1.5 pb-3.5">
              <div className="font-semibold text-[10px]">
                गुणवत्ता आश्वासन योजना सं. / QAP No.
              </div>
              <EditableField isEditing={isEditing} type="textarea" value={qapNo} onChange={(val) => onChange("qapNo", val)} className="dynamic-text leading-tight text-[10px] mt-0.5" />
            </div>
          </div>

          {/* Type of inspection */}
          <div className="border-x border-b border-black p-1.5 pb-3.5 min-h-[36px]">
            <div className="font-semibold text-[10px]">
              किए गए निरीक्षण/परीक्षण विवरण / Type of inspection/tests conducted:
            </div>
            <EditableField isEditing={false} type="textarea" value={inspectionType} onChange={(val) => onChange("inspectionType", val)} className="break-words dynamic-text leading-tight mt-0.5" />
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] border-x border-b border-black bg-gray-100 font-semibold text-center text-[9px] leading-tight items-stretch">
            <div className="border-r border-black p-1.5 pb-2 flex flex-col justify-center items-center">
              सी.एच.पी. क्लॉज सं.<br />CHP CL. NO. OF QAP
            </div>
            <div className="border-r border-black p-1.5 pb-2 flex flex-col justify-center items-center">
              हीट नंबर / लॉट नंबर<br />HEAT No. / Lot No.
            </div>
            <div className="border-r border-black p-1.5 pb-2 flex flex-col justify-center items-center">
              कुल उत्पादित मात्रा (संख्या में)<br />Total Processed Qty (Nos.)
            </div>
            <div className="border-r border-black p-1.5 pb-2 flex flex-col justify-center items-center">
              स्वीकृत मात्रा (संख्या में)<br />Accepted Qty (Nos.)
            </div>
            <div className="p-1.5 pb-2 flex flex-col justify-center items-center">
              अस्वीकृत मात्रा (संख्या में)<br />Rejected Qty (Nos.)
            </div>
          </div>

          {/* Body rows */}
          {lots.map((lot, idx) => {
            const proc = Number(lot.totalProcessed || 0);
            const rej = Number(lot.rejectedQty || 0);
            const acc = Math.max(0, proc - rej);

            const displayProc = formatCleanNum(proc);
            const displayAcc = formatCleanNum(acc);
            const displayRej = formatCleanNum(rej);

            return (
              <div
                key={idx}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] text-center border-x border-b border-black items-stretch text-[10px]"
              >
                <div className="border-r border-black py-2.5 px-2 pb-3.5 flex items-center justify-center">
                  {idx === 0 ? (
                    <EditableField
                      isEditing={isEditing}
                      type="textarea"
                      value={chpClause}
                      onChange={(val) => onChange("chpClause", val)}
                      className="w-full text-center text-[9.5px] leading-snug"
                    />
                  ) : (
                    ""
                  )}
                </div>
                <div className="border-r border-black py-2.5 px-2 pb-3.5 flex items-center justify-center font-bold text-[10px]">
                  {(() => {
                    const rawHeatStr = lot.heatNo || "";
                    let heatPart = rawHeatStr;
                    let lotPart = lot.lotNo || "";

                    if (rawHeatStr.includes(" - ")) {
                      const parts = rawHeatStr.split(" - ");
                      heatPart = parts[0];
                      if (lot.lotNo === undefined) {
                        lotPart = parts.slice(1).join(" - ");
                      }
                    }

                    if (!isEditing) {
                      return `${heatPart}${lotPart ? " - " + lotPart : ""}`;
                    }

                    return (
                      <div className="flex items-center justify-center gap-1 w-full">
                        <span>{heatPart}{heatPart ? " - " : ""}</span>
                        <input
                          type="text"
                          className="p-1 border border-blue-400 bg-blue-50 text-xs font-bold text-center w-24 rounded"
                          value={lot.lotNo !== undefined ? lot.lotNo : lotPart}
                          onChange={(e) => {
                            const newLotVal = e.target.value;
                            onArrayChange("lots", idx, "lotNo", newLotVal);
                            onArrayChange("lots", idx, "heatNo", `${heatPart}${heatPart ? " - " : ""}${newLotVal}`);
                          }}
                        />
                      </div>
                    );
                  })()}
                </div>
                <div className="border-r border-black py-2.5 px-2 pb-3.5 flex items-center justify-center font-bold">{displayProc}</div>
                <div className="border-r border-black py-2.5 px-2 pb-3.5 flex items-center justify-center font-bold">{displayAcc}</div>
                <div className="py-2.5 px-2 pb-3.5 flex items-center justify-center font-bold">{displayRej}</div>
              </div>
            );
          })}

          {/* TOTAL row */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] font-semibold border-x border-b border-black text-[9.5px] min-h-[38px] items-stretch">
            <div className="border-r border-black py-2.5 px-2 pb-3 text-center flex items-center justify-center">TOTAL</div>
            <div className="border-r border-black py-2.5 px-2 pb-3 text-center flex items-center justify-center"></div>
            <div className="border-r border-black py-2.5 px-1 pb-3 text-center flex items-center justify-center">
              <EditableField isEditing={false} value={totalProcessed} onChange={(val) => onChange("totalProcessed", val)} className="text-center" />
            </div>
            <div className="border-r border-black py-2.5 px-1 pb-3 text-center flex items-center justify-center">
              <EditableField isEditing={false} value={totalAccepted} onChange={(val) => onChange("totalAccepted", val)} className="text-center" />
            </div>
            <div className="py-2.5 px-1 pb-3 text-center flex items-center justify-center">
              <EditableField isEditing={false} value={totalRejected} onChange={(val) => onChange("totalRejected", val)} className="text-center" />
            </div>
          </div>

          {/* Reference row */}
          <div className="border-x border-b border-black p-2.5 pb-4 leading-normal text-[10px]">
            <span className="font-semibold">संदर्भ / Reference: </span>
            <span className="dynamic-text">{displayReference}</span>
          </div>

          {/* Call date / inspection date / man-days */}
          <div className="grid grid-cols-3 border-x border-b border-black min-h-[36px] items-stretch">
            <div className="border-r border-black p-2 pb-3 flex flex-col justify-center">
              <div>
                <span className="font-semibold text-[10px]">
                  कॉल दिनांक / Date of call:{" "}
                </span>
                <EditableField isEditing={false} value={callDate} onChange={(val) => onChange("callDate", val)} className="inline-block" />
              </div>
            </div>
            <div className="border-r border-black p-2 pb-3 flex flex-col justify-center">
              <div>
                <span className="font-semibold text-[10px]">
                  निरीक्षण की तिथि / Date of inspection:{" "}
                </span>
                <EditableField isEditing={isEditing} value={inspectionDate} onChange={(val) => onChange("inspectionDate", val)} className="inline-block" />
              </div>
            </div>
            <div className="p-2 pb-3 flex flex-col justify-center">
              <div>
                <span className="font-semibold text-[10px]">
                  कार्यरत मानव-दिनों की संख्या / Total Man-days:{" "}
                </span>
                <EditableField isEditing={isEditing} value={manDays} onChange={(val) => onChange("manDays", val)} className="inline-block" />
              </div>
            </div>
          </div>

          {/* Sealing pattern / Inspecting engineer */}
          <div className="grid grid-cols-2 border-x border-b border-black min-h-[50px] items-stretch">
            <div className="border-r border-black p-2 pb-3.5">
              <div className="font-semibold text-[10px]">
                सील/स्टैंपिंग तथा पहचान की विधि / Pattern of sealing/stamping or identification
              </div>
              <EditableField isEditing={false} type="textarea" value={sealingPattern || "NA"} onChange={(val) => onChange("sealingPattern", val)} className="dynamic-text leading-tight text-[10px] font-bold mt-1" />
            </div>
            <div className="p-2 pb-3.5 flex flex-col justify-between min-h-[90px]">
              <div className="font-semibold text-[10px]">Inspecting Engineer</div>
              <EditableField isEditing={false} value={inspectingEngineer} onChange={(val) => onChange("inspectingEngineer", val)} className="mt-2 text-right font-semibold" />
            </div>
          </div>

          {/* Footer certification */}
          <div className="border-x border-b border-black p-3 pb-4 text-center">
            <div className="font-semibold text-[11px] italic mb-1">
              It is certified that Process Inspection of ERCs carried out satisfactorily
              and Material cleared for Product Inspection.
            </div>
            <div className="mt-1 text-[10px] leading-snug text-gray-700">
              <span className="font-bold">Distribution: </span>
              Manufacturer office copy, Purchaser (Railway), RITES Bill
              Copy, RITES for final IC incorporate
            </div>
            <div className="h-4" />
          </div>
        </fieldset>
        {/* Bottom spacer — reserves space for physical printer footer */}
        <div style={{ minHeight: '30mm' }} />
      </div>
    </div>
  );
};

export default ErcProcessIC;

