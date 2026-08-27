// Helper to format Lot No (e.g. if '1 to 1', display as '1')
export const formatLotNo = (val) => {
  if (!val) return "";
  const str = String(val).trim();
  const match = str.match(/^(.+?)\s+to\s+(.+)$/i);
  if (match) {
    const from = match[1].trim();
    const to = match[2].trim();
    if (from.toLowerCase() === to.toLowerCase()) {
      return from;
    }
  }
  return str;
};

// Helper to aggregate rejection reasons by reason and count without batch numbers and leading '#'
export const aggregateRejectionReasons = (reasonStr) => {
  if (!reasonStr) return "Not Applicable";
  let cleaned = String(reasonStr).trim();
  if (['NOT APPLICABLE', 'N/A', 'NA', 'NONE', ''].includes(cleaned.toUpperCase())) {
    return "Not Applicable";
  }

  if (cleaned.startsWith('#')) {
    cleaned = cleaned.substring(1).trim();
  }
  if (cleaned.toLowerCase().startsWith('reason of rejection:')) {
    cleaned = cleaned.substring('reason of rejection:'.length).trim();
  } else if (cleaned.toLowerCase().startsWith('reasons for rejection:')) {
    cleaned = cleaned.substring('reasons for rejection:'.length).trim();
  }

  const countsMap = new Map();
  const pattern1 = /([A-Za-z0-9\s/_\-]+?)\s*\(\s*(\d+)(?:\s*(?:Nos|nos|nos\.|Qty|qty|units|pieces|pcs))?\s*\)/gi;
  let match;
  let matchedCount = 0;

  while ((match = pattern1.exec(cleaned)) !== null) {
    let rawReason = match[1].trim();
    const qty = parseInt(match[2], 10);

    rawReason = rawReason.replace(/^[\[\]|:;\s]+/, '');
    rawReason = rawReason.replace(/^Drawing\s+[^:\s|\[\]()]+:\s*/i, '').trim();

    if (rawReason && !rawReason.toLowerCase().startsWith('batch') && !isNaN(qty)) {
      const key = rawReason.toLowerCase();
      if (countsMap.has(key)) {
        countsMap.get(key).count += qty;
      } else {
        countsMap.set(key, { name: rawReason, count: qty });
      }
      matchedCount++;
    }
  }

  if (matchedCount === 0) {
    const pattern2 = /:\s*(\d+)\s*(?:Nos|nos)?\s*-\s*\[(.*?)\]/gi;
    while ((match = pattern2.exec(cleaned)) !== null) {
      const qty = parseInt(match[1], 10);
      let rawReason = match[2].trim();
      rawReason = rawReason.replace(/^Drawing\s+[^:\s|\[\]()]+:\s*/i, '').trim();
      if (rawReason && !isNaN(qty)) {
        const key = rawReason.toLowerCase();
        if (countsMap.has(key)) {
          countsMap.get(key).count += qty;
        } else {
          countsMap.set(key, { name: rawReason, count: qty });
        }
        matchedCount++;
      }
    }
  }

  if (countsMap.size > 0) {
    return Array.from(countsMap.values())
      .map(item => `${item.name} (${item.count})`)
      .join(', ');
  }

  return cleaned || "Not Applicable";
};

// Top-level EditableField component to prevent focus loss during typing
const EditableField = ({
  value,
  fieldName,
  placeholder = "",
  style = {},
  type = "text",
  disabled = false,
  maxLength = undefined,
  customRender = null,
  isEditing = false,
  isViewOnly = false,
  isBusy = false,
  isBookSetEntered = false,
  allowedFields = [],
  onFieldChange = () => {}
}) => {
  const isBookOrSet = fieldName === "bookNo" || fieldName === "setNo";
  const canEdit = isEditing && allowedFields.includes(fieldName) && (isBookOrSet || isBookSetEntered);
  
  if (canEdit) {
    if (type === "textarea") {
      return (
        <textarea
          value={value || ""}
          maxLength={maxLength}
          onChange={(e) => onFieldChange(fieldName, e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '4px',
            border: '1px solid #3b82f6',
            borderRadius: '4px',
            backgroundColor: '#eff6ff',
            fontSize: '11px',
            color: 'black',
            resize: 'vertical',
            fontFamily: 'sans-serif',
            boxSizing: 'border-box',
            ...style
          }}
          rows={3}
          disabled={disabled || isBusy}
        />
      );
    }
    return (
      <input
        type="text"
        value={value || ""}
        maxLength={maxLength}
        onChange={(e) => onFieldChange(fieldName, e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '3px 6px',
          border: '1px solid #3b82f6',
          borderRadius: '4px',
          backgroundColor: '#eff6ff',
          fontSize: '11px',
          color: 'black',
          fontFamily: 'sans-serif',
          boxSizing: 'border-box',
          ...style
        }}
        disabled={disabled || isBusy}
      />
    );
  }

  if (customRender) {
    return <div style={{ ...style }}>{customRender(value)}</div>;
  }

  if (type === "textarea") {
    return <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', ...style }}>{value}</div>;
  }
  return <span style={{ wordBreak: 'break-word', ...style }}>{value}</span>;
};

const RailpadProcessIc = ({
  data = {},
  isEditing = false,
  isBusy = false,
  isViewOnly = false,
  onFieldChange = () => {},
  onVerifyBookSet,
  bookSetValidation
}) => {
  const {
    certificateNo = "",
    certificateDate = "",
    offeredInstNo = "",
    passedInstNo = "",
    contractor = "",
    manufacturer = "",
    placeOfInspection = "",
    billPayingOfficer = "",
    consignee = "",
    consigneeManufacturer = "",
    purchasingAuthority = "",
    itemNo = "1",
    description = "",
    drgNo = "",
    specNo = "",
    qapNo = "",
    typeOfInspection = "Verification of Invoices of Raw materials, weighment of Raw material, witnessing the activities during mixing at Kneader & mixing mill, sheeting/sizing, rheometer test, verification of mould dimensions & surface, monitoring of moulding activities at hydraulic press & finishing as per the frequency specified in PIO detailed under Annexure-A of Rly. Bd. Letter No. 2024/RS(G)/779/12 Dtd.16.10.2025",
    chpClNo = "Process inspection as per PIO detailed under Annexure-A of Rly. Bd. Letter No. 2024/RS(G)/779/12 Dtd.16.10.2025 & Approved QAP",
    lotNo = "",
    qtyNowOffered = "",
    qtyNowPassed = "",
    qtyNowRejected = "",
    quantityNowPassedText = "",
    reasonsForRejection = "Not Applicable",
    dateOfCall = "",
    noOfVisits = "",
    datesOfInspection = "",
    sealingPattern = "NA",
    inspectingEngineer = "",
    bookNo = "",
    setNo = "",
    contractRef = "",
  } = data;

  const allowedFields = [
    "bookNo", "setNo",
    "certificateDate", "offeredInstNo", "passedInstNo", "contractor", "manufacturer",
    "contractRef", "billPayingOfficer", "consignee", "consigneeManufacturer", "purchasingAuthority", 
    "description", "drgNo", "specNo", "qapNo", "typeOfInspection", "chpClNo",
    "quantityNowPassedText", "reasonsForRejection",
    "dateOfCall", "noOfVisits", "datesOfInspection", "sealingPattern", "inspectingEngineer"
  ];

  const isBookSetEntered = Boolean(bookNo && bookNo.trim().length > 0 && setNo && /^\d{3}$/.test(setNo.trim()));

  const fieldProps = {
    isEditing,
    isViewOnly,
    isBusy,
    isBookSetEntered,
    allowedFields,
    onFieldChange
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    border: '1px solid black',
    backgroundColor: '#fff',
    color: '#000',
    fontSize: '10.5px',
    fontFamily: '"Times New Roman", Times, serif',
    tableLayout: 'fixed',
    lineHeight: '1.2'
  };
  
  const thStyle = {
    border: '1px solid black',
    padding: '4px 6px',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '10.5px',
    background: '#ffffff',
    verticalAlign: 'middle',
  };
  
  const tdStyle = {
    border: '1px solid black',
    padding: '4px 6px',
    verticalAlign: 'top',
    fontSize: '10.5px'
  };

  return (
    <div className="certificate-page" style={{
      width: '800px',
      margin: '0 auto',
      padding: '16px 20px',
      background: 'white',
      color: 'black',
      fontFamily: '"Times New Roman", Times, serif',
      boxSizing: 'border-box',
      border: '1px solid #cbd5e1',
      fontSize: '10px',
      lineHeight: '1.25'
    }}>
      
      {/* Top spacing to match RITES letterhead margin exactly (adjusted to 42mm for clean separation) */}
      <div style={{ height: '42mm' }}></div>

      {/* Book & Set Number Container */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '12px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', border: '1px solid black', width: '180px', background: 'white' }}>
            <div style={{ flex: 1, borderRight: '1px solid black', display: 'flex', flexDirection: 'column' }}>
              <div style={{ borderBottom: '1px solid black', padding: '3px', fontWeight: 'bold', textAlign: 'center', fontSize: '9px' }}>
                बुक सं Book No.
              </div>
              <div style={{ padding: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '22px' }}>
                <EditableField value={bookNo} fieldName="bookNo" maxLength={10} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }} {...fieldProps} />
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ borderBottom: '1px solid black', padding: '3px', fontWeight: 'bold', textAlign: 'center', fontSize: '9px' }}>
                सेट सं Set No.
              </div>
              <div style={{ padding: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '22px' }}>
                <EditableField value={setNo} fieldName="setNo" maxLength={3} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }} {...fieldProps} />
              </div>
            </div>
          </div>
          {isEditing && (
            <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={onVerifyBookSet}
                  disabled={isBusy || bookSetValidation?.isValidating}
                  style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '2px 6px', borderRadius: '3px', fontSize: '8.5px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {bookSetValidation?.isValidating ? "Validating..." : "Verify Book & Set"}
                </button>
                {bookSetValidation && !bookSetValidation.isValidating && (
                  <span style={{ fontSize: '8.5px', fontWeight: 'bold' }}>
                    {bookSetValidation.isValid ? (
                      <span style={{ color: '#16a34a' }}>✅ Valid</span>
                    ) : (
                      <span style={{ color: '#dc2626' }}>❌ Invalid</span>
                    )}
                  </span>
                )}
              </div>
              
              {bookNo && String(bookNo).trim().length > 0 && String(bookNo).trim().length < 4 && (
                <div style={{
                  fontSize: '8px',
                  color: '#854d0e',
                  background: '#fefce8',
                  border: '1px solid #fef08a',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  textAlign: 'center',
                  fontWeight: '700',
                  lineHeight: '1.2',
                  maxWidth: '220px'
                }}>
                  ⚠️ Book Number is generally of 4 characters. Please ensure that the correct Book Number has been entered.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RITES BHILAI HEADLINE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginTop: '14px', marginBottom: '18px', paddingBottom: '6px' }}>
        <div style={{ flex: 1 }}></div>
        <div style={{ flex: 3, textAlign: 'center', fontWeight: 'bold', fontSize: '13px', letterSpacing: '0.2px', textTransform: 'uppercase' }}>
          {data?.region || "RITES LIMITED, NORTHERN REGION, DELHI"}
        </div>
        <div style={{ flex: 1, textAlign: 'right', lineHeight: '1.1', fontSize: '8.5px', fontWeight: 'bold' }}>
          <div>निरंतरता पत्रक शामिल</div>
          <div style={{ fontSize: '7.5px' }}>Contains 0 Continuation Sheets</div>
        </div>
      </div>

      {/* Spacer to give clear separation above Certificate Info Row */}
      <div style={{ height: '6px' }} />

      {/* Certificate Info Row — 75% width aligned right */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0px', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 2.7fr', border: '1px solid black', borderBottom: 'none', width: '75%', fontSize: '10px' }}>
          {/* Col 1: Certificate No */}
          <div style={{ borderRight: '1px solid black', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '8px', textTransform: 'uppercase' }}>प्रमाणपत्र पत्र सं. CERTIFICATE NO.</div>
            <div style={{ fontWeight: 'bold', fontSize: '9.5px', marginTop: '4px', wordBreak: 'break-all', lineHeight: '1.2' }}>
              {certificateNo}
            </div>
          </div>
          {/* Col 2: Date */}
          <div style={{ borderRight: '1px solid black', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '8px', textTransform: 'uppercase' }}>दिनांक DATE</div>
            <div style={{ fontWeight: 'bold', fontSize: '9.5px', marginTop: '4px' }}>
              <EditableField value={certificateDate} fieldName="certificateDate" style={{ textAlign: 'center', fontWeight: 'bold' }} {...fieldProps} />
            </div>
          </div>
          {/* Col 3: Installment (2-row view matching reference) */}
          <div style={{ padding: '4px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left', lineHeight: '1.2', fontSize: '8.5px', fontWeight: 'bold' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dotted #94a3b8', paddingBottom: '3px', marginBottom: '3px' }}>
              <div>
                <div>प्रस्तावित किस्त सं.</div>
                <div>Offered Instt. No.</div>
              </div>
              <div style={{ fontSize: '10.5px', minWidth: '45px', textAlign: 'right' }}>
                <EditableField value={offeredInstNo} fieldName="offeredInstNo" style={{ textAlign: 'right', fontWeight: 'bold' }} placeholder="10" {...fieldProps} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1px' }}>
              <div>
                <div>किस्त स. पारित Passed Instt. No.</div>
              </div>
              <div style={{ fontSize: '10.5px', minWidth: '45px', textAlign: 'right' }}>
                <EditableField value={passedInstNo} fieldName="passedInstNo" style={{ textAlign: 'right', fontWeight: 'bold' }} placeholder="6" {...fieldProps} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <table style={tableStyle}>
        <tbody>

          {/* Contractor & Manufacturer Row */}
          <tr>
            <td colSpan="2" style={{ ...tdStyle, width: '50%' }}>
              <div style={{ fontWeight: 'bold' }}>Contractor:</div>
              <div style={{ textTransform: 'uppercase', marginTop: '2px' }}>
                <EditableField value={contractor} fieldName="contractor" type="textarea" {...fieldProps} />
              </div>
            </td>
            <td colSpan="1" style={{ ...tdStyle, width: '50%' }}>
              <div style={{ fontWeight: 'bold' }}>Manufacturer:</div>
              <div style={{ textTransform: 'uppercase', marginTop: '2px' }}>
                <EditableField value={manufacturer || contractor} fieldName="manufacturer" type="textarea" {...fieldProps} />
              </div>
            </td>
          </tr>

          {/* Contract Ref & Bill Paying Officer Row */}
          <tr>
            <td colSpan="2" style={{ ...tdStyle, width: '50%' }}>
              <div style={{ fontWeight: 'bold' }}>Contract Ref.</div>
              <div style={{ marginTop: '2px' }}>
                <EditableField value={contractRef} fieldName="contractRef" type="textarea" {...fieldProps} />
              </div>
            </td>
            <td colSpan="1" style={{ ...tdStyle, width: '50%' }}>
              <div style={{ fontWeight: 'bold' }}>Bill Paying Officer:</div>
              <div style={{ textTransform: 'uppercase', marginTop: '2px' }}>
                <EditableField value={billPayingOfficer} fieldName="billPayingOfficer" type="textarea" {...fieldProps} />
              </div>
            </td>
          </tr>

          {/* Consignee & Purchasing Authority Row */}
          <tr>
            <td colSpan="2" style={{ ...tdStyle, width: '50%' }}>
              <div style={{ fontWeight: 'bold' }}>Consignee (Railway):</div>
              <div style={{ textTransform: 'uppercase', marginTop: '2px' }}>
                <EditableField value={consignee} fieldName="consignee" type="textarea" {...fieldProps} />
              </div>
              <div style={{ fontWeight: 'bold', marginTop: '8px' }}>Consignee (Manufacturer of finished Product):</div>
              <div style={{ textTransform: 'uppercase', marginTop: '2px' }}>
                <EditableField value={consigneeManufacturer || contractor} fieldName="consigneeManufacturer" type="textarea" {...fieldProps} />
              </div>
            </td>
            <td colSpan="1" style={{ ...tdStyle, width: '50%' }}>
              <div style={{ fontWeight: 'bold' }}>Purchasing Authority (Railway):</div>
              <div style={{ textTransform: 'uppercase', marginTop: '2px' }}>
                <EditableField value={purchasingAuthority} fieldName="purchasingAuthority" type="textarea" {...fieldProps} />
              </div>
            </td>
          </tr>

          {/* Description & Drg/Spec/QAP Row */}
          <tr>
            <td colSpan="3" style={{ padding: 0, border: '1px solid black' }}>
              <div style={{ display: 'flex', width: '100%' }}>
                {/* Left: Description */}
                <div style={{ width: '50%', padding: '4px 6px', borderRight: '1px solid black', boxSizing: 'border-box' }}>
                  <div style={{ fontWeight: 'bold' }}>Description:</div>
                  <div style={{ marginTop: '2px', textAlign: 'justify' }}>
                    <EditableField value={description} fieldName="description" type="textarea" {...fieldProps} />
                  </div>
                </div>
                {/* Right: Drg/Spec | QAP split 40/60 */}
                <div style={{ width: '50%', display: 'flex', boxSizing: 'border-box' }}>
                  <div style={{ width: '40%', padding: '4px 6px', borderRight: '1px solid black', boxSizing: 'border-box' }}>
                    <div style={{ fontWeight: 'bold' }}>Drg. No.:</div>
                    <div><EditableField value={drgNo} fieldName="drgNo" {...fieldProps} /></div>
                    <div style={{ fontWeight: 'bold', marginTop: '6px' }}>Spec. No.</div>
                    <div><EditableField value={specNo} fieldName="specNo" {...fieldProps} /></div>
                  </div>
                  <div style={{ width: '60%', padding: '4px 6px', boxSizing: 'border-box' }}>
                    <div style={{ fontWeight: 'bold' }}>QAP No.:</div>
                    <div style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                      <EditableField value={qapNo} fieldName="qapNo" {...fieldProps} />
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          {/* Type of inspection */}
          <tr>
            <td colSpan="3" style={{ ...tdStyle, textAlign: 'justify' }}>
              <span style={{ fontWeight: 'bold' }}>Type of inspection/tests conducted: </span>
              <EditableField value={typeOfInspection} fieldName="typeOfInspection" type="textarea" style={{ display: 'inline' }} {...fieldProps} />
            </td>
          </tr>

          {/* Sub-table Headers */}
          <tr>
            <td colSpan="3" style={{ padding: 0, borderBottom: 'none' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: '30%', borderLeft: 'none', borderTop: 'none' }}>CHP CL. No. Of QAP</th>
                    <th style={{ ...thStyle, width: '20%', borderTop: 'none' }}>Lot No.</th>
                    <th style={{ ...thStyle, width: '15%', borderTop: 'none' }}>Total Processed Qty<br/>(Nos.)</th>
                    <th style={{ ...thStyle, width: '15%', borderTop: 'none' }}>Accepted Qty<br/>(Nos.)</th>
                    <th style={{ ...thStyle, width: '20%', borderRight: 'none', borderTop: 'none' }}>Rejected Qty<br/>(Nos.)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ ...tdStyle, borderLeft: 'none', borderBottom: 'none' }}>
                      <EditableField value={chpClNo} fieldName="chpClNo" type="textarea" {...fieldProps} />
                    </td>
                    <td style={{ ...tdStyle, borderBottom: 'none', textAlign: 'center' }}>
                      {formatLotNo(lotNo)}
                    </td>
                    <td style={{ ...tdStyle, borderBottom: 'none', textAlign: 'center' }}>
                      {qtyNowOffered}
                    </td>
                    <td style={{ ...tdStyle, borderBottom: 'none', textAlign: 'center' }}>
                      {qtyNowPassed}
                    </td>
                    <td style={{ ...tdStyle, borderRight: 'none', borderBottom: 'none', textAlign: 'center' }}>
                      {qtyNowRejected}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* Remarks & Rejection */}
          <tr>
            <td colSpan="3" style={{ ...tdStyle, textAlign: 'justify' }}>
              <div style={{ marginTop: '4px' }}>
                <span style={{ fontWeight: 'bold' }}>Remark: </span>
                <EditableField value={quantityNowPassedText} fieldName="quantityNowPassedText" type="textarea" style={{ display: 'inline' }} {...fieldProps} />
              </div>
              <div style={{ marginTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Reason of Rejection: </span>
                <EditableField value={aggregateRejectionReasons(reasonsForRejection)} fieldName="reasonsForRejection" type="textarea" style={{ display: 'inline' }} {...fieldProps} />
              </div>
            </td>
          </tr>

          {/* Date, Man-days, Date of inspection */}
          <tr>
            <td style={{ ...tdStyle, textAlign: 'center', width: '33%' }}>
              <div style={{ fontWeight: 'bold' }}>Date of call</div>
              <div style={{ marginTop: '4px' }}>
                <EditableField value={dateOfCall} fieldName="dateOfCall" style={{ textAlign: 'center' }} {...fieldProps} />
              </div>
            </td>
            <td style={{ ...tdStyle, textAlign: 'center', width: '33%' }}>
              <div style={{ fontWeight: 'bold' }}>Total No. of Man-days engaged</div>
              <div style={{ marginTop: '4px' }}>
                <EditableField value={noOfVisits} fieldName="noOfVisits" style={{ textAlign: 'center' }} {...fieldProps} />
              </div>
            </td>
            <td style={{ ...tdStyle, textAlign: 'center', width: '34%' }}>
              <div style={{ fontWeight: 'bold' }}>Date of inspection</div>
              <div style={{ marginTop: '4px' }}>
                <EditableField value={datesOfInspection} fieldName="datesOfInspection" style={{ textAlign: 'center' }} {...fieldProps} />
              </div>
            </td>
          </tr>

          {/* Sealing & Inspecting Engineer */}
          <tr>
            <td colSpan="2" style={{ ...tdStyle, verticalAlign: 'top', width: '66%' }}>
              <div style={{ fontWeight: 'bold' }}>Pattern of sealing/stamping or identification:</div>
              <div style={{ marginTop: '4px', textAlign: 'center' }}>
                <EditableField value={sealingPattern} fieldName="sealingPattern" type="textarea" style={{ textAlign: 'center' }} {...fieldProps} />
              </div>
            </td>
            <td colSpan="1" className="ie-signature-box" style={{ ...tdStyle, verticalAlign: 'top', textAlign: 'center', width: '34%' }}>
              <div style={{ fontWeight: 'bold' }}>Inspecting Engineer</div>
              <div style={{ minHeight: '40px' }}></div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer Text */}
      <div style={{ marginTop: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '9.5px', lineHeight: '1.3' }}>
        <div>It is certified that the process inspection of the rail pads has been carried out satisfactorily and the material is cleared for final inspection.</div>
        <div style={{ marginTop: '3px', fontSize: '8.5px', color: '#334155' }}>Distribution: Manufacturer Office Copy, Purchaser (Railway), RITES Bill Copy, RITES for Final IC Copy</div>
      </div>
      <div style={{ minHeight: '15mm' }}></div>

    </div>
  );
};

export default RailpadProcessIc;
