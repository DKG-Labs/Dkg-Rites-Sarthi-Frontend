import React from "react";
import "./SleeperFinalIc.css";

// Allowed fields for editing (Certificate No, Date, Column 3, Column 6, Column 7, Column 8 are strictly NOT editable)
const allowedFields = [
  "bookNo", "setNo", "offeredInstNo", "passedInstNo", "contractor", "placeOfInspection",
  "contractRef", "maNumberAndDate", "billPayingOfficer", "consignee", "purchasingAuthority",
  "itemNo", "description", "qtyOfferedPreviously", "qtyPassedPreviously", "qtyStillDue", "trRecDate",
  "quantityNowPassedText", "noOfVisits", "datesOfInspection", "sealingPattern", "facsimileText",
  "reasonsForRejection", "inspectingEngineer", "noOfItemsChecked", "dateOfCall", "icType"
];

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
  isBusy = false,
  isBookSetEntered = false,
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
            padding: '3px 4px',
            border: '1px solid #3b82f6',
            borderRadius: '3px',
            backgroundColor: '#eff6ff',
            fontSize: '9.5px',
            color: 'black',
            resize: 'vertical',
            fontFamily: 'Arial, sans-serif',
            boxSizing: 'border-box',
            ...style
          }}
          rows={2}
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
          padding: '2px 4px',
          border: '1px solid #3b82f6',
          borderRadius: '3px',
          backgroundColor: '#eff6ff',
          fontSize: '9.5px',
          color: 'black',
          fontFamily: 'Arial, sans-serif',
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

const SleeperFinalIc = ({
  data = {},
  isEditing = false,
  isBusy = false,
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
    placeOfInspection = "",
    contractRef = "",
    maNumberAndDate = "",
    billPayingOfficer = "",
    consignee = "",
    purchasingAuthority = "",
    itemNo = "002",
    description = "MANUFACTURE AND SUPPLY OF PRESTRESSED MONO-BLOCK CONCRETE LINE SLEEPERES (RT-8746) (PRETENSIONED TYPE) FOR BROAD GAUGE(1673 MM)",
    qtyOnOrder = "",
    qtyOfferedPreviously = "",
    qtyPassedPreviously = "",
    qtyNowOffered = "",
    qtyNowPassed = "",
    qtyNowRejected = "",
    qtyStillDue = "",
    noOfItemsChecked = "1",
    dateOfCall = "",
    noOfVisits = "1",
    datesOfInspection = "",
    trRecDate = "",
    quantityNowPassedText = "",
    sealingPattern = "RITES Stencil R↑I 12 marked on the top surface of each PSC sleeper in presence of vendor.",
    facsimileText = "",
    reasonsForRejection = "Not Applicable",
    inspectingEngineer = "",
    bookNo = "",
    setNo = "",
    region = "RITES LTD, CENTRAL REGION, BHILAI"
  } = data;

  const isBookSetEntered = Boolean(bookNo && bookNo.trim().length > 0 && setNo && /^\d{3}$/.test(setNo.trim()));

  const fieldProps = {
    isEditing,
    isBusy,
    isBookSetEntered,
    onFieldChange
  };

  const displayCertificateNo = (certificateNo || "")
    .replace(/^(\/[^\/]+)/, "")
    .replace(/[\uFEFF\u200B]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();

  const isOldIcValid = Boolean(data?.bookNo && String(data?.bookNo).trim().length > 0 && /^\d{3}$/.test(data?.setNo));
  const isFormLocked = isEditing && (
    (data?.icType === 'new' && !bookSetValidation?.isValid) ||
    (data?.icType !== 'new' && !isOldIcValid)
  );

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    border: '1.5px solid black',
    backgroundColor: '#fff',
    color: '#000',
    fontSize: '10px',
    fontFamily: 'Arial, sans-serif',
    tableLayout: 'fixed'
  };

  const thStyle = {
    border: '1px solid black',
    padding: '3px 2px',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '8.5px',
    background: '#ffffff',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    verticalAlign: 'middle',
    lineHeight: '1.2'
  };

  const tdStyle = {
    border: '1px solid black',
    padding: '4px',
    verticalAlign: 'top',
    fontSize: '9.5px'
  };

  const tdCenterStyle = {
    ...tdStyle,
    textAlign: 'center'
  };

  const unitText = (data?.unit || 'NOS.').toUpperCase();

  return (
    <div className="sleeper-ic-page" style={{
      width: '800px',
      margin: '0 auto',
      padding: '16px 24px',
      background: 'white',
      color: 'black',
      fontFamily: "Arial, Helvetica, sans-serif",
      boxSizing: 'border-box',
      fontSize: '10px',
      lineHeight: '1.25'
    }}>

      {/* Top spacing to match RITES letterhead margin exactly (42mm for clean letterhead separation) */}
      <div style={{ height: '42mm' }} className="sleeper-ic-letterhead-spacer"></div>

      {/* Book & Set Number Centered Container */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* Old / New IC Toggle */}
          {isEditing && (
            <div className="no-print" style={{ display: 'flex', gap: '16px', marginBottom: '6px', fontSize: '11px', fontWeight: 'bold' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="icTypeSleeper" 
                  value="old" 
                  checked={data?.icType !== 'new'} 
                  onChange={() => onFieldChange("icType", "old")} 
                /> Old IC
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="icTypeSleeper" 
                  value="new" 
                  checked={data?.icType === 'new'} 
                  onChange={() => onFieldChange("icType", "new")} 
                /> New IC
              </label>
            </div>
          )}

          <div style={{ display: 'flex', border: '2px solid black', width: '180px', background: 'white' }}>
            <div style={{ flex: 1, borderRight: '2px solid black', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                borderBottom: '2px solid black',
                padding: '3px',
                fontWeight: 'bold',
                textAlign: 'center',
                fontSize: '9px',
                lineHeight: '1.1',
                background: '#ffffff'
              }}>
                बुक सं. Book No.
              </div>
              <div style={{ padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '22px' }}>
                <EditableField value={bookNo} fieldName="bookNo" maxLength={10} disabled={isBusy} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase' }} {...fieldProps} />
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{
                borderBottom: '2px solid black',
                padding: '3px',
                fontWeight: 'bold',
                textAlign: 'center',
                fontSize: '9px',
                lineHeight: '1.1',
                background: '#ffffff'
              }}>
                सेट सं. Set No.
              </div>
              <div style={{ padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '22px' }}>
                <EditableField value={setNo} fieldName="setNo" maxLength={3} disabled={isBusy} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }} {...fieldProps} />
              </div>
            </div>
          </div>

          {isEditing && data?.icType === 'new' && (
            <div className="no-print" style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={onVerifyBookSet}
                  disabled={isBusy || bookSetValidation?.isValidating}
                  style={{
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {bookSetValidation?.isValidating ? "Validating..." : "Verify Book & Set No."}
                </button>
                {bookSetValidation && !bookSetValidation.isValidating && (
                  <span style={{ fontSize: '10px', fontWeight: 'bold' }}>
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
                  fontSize: '9px',
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

      {/* RITES REGION HEADER ROW */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        width: '100%',
        marginTop: '6px',
        marginBottom: '10px',
        padding: '0 4px'
      }}>
        <div style={{ flex: 1 }}></div>
        <div style={{
          flex: 3,
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '13px',
          letterSpacing: '0.2px',
          textTransform: 'uppercase'
        }}>
          {region || "RITES LIMITED, CENTRAL REGION, BHILAI"}
        </div>
        <div style={{
          flex: 1,
          textAlign: 'right',
          lineHeight: '1.15',
          fontWeight: 'bold'
        }}>
          <div style={{ fontSize: '9.5px' }}>निरंतरता पत्रक शामिल</div>
          <div style={{ fontSize: '8.5px' }}>Contains 0 Continuation Sheets</div>
        </div>
      </div>

      {/* Physical Spacer */}
      <div style={{ height: '4px' }} />

      {/* Form Lock Fieldset */}
      <fieldset disabled={isFormLocked} style={{ border: 0, padding: 0, margin: 0, minWidth: 0, width: '100%', opacity: isFormLocked ? 0.5 : 1, pointerEvents: isFormLocked ? 'none' : 'auto' }}>
        
        {/* Certificate Info Row — 75% width aligned right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0px', width: '100%' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.8fr 1fr 2.7fr',
            border: '1px solid black',
            borderBottom: 'none',
            width: '75%',
            fontSize: '10px'
          }}>
            {/* Col 1: Certificate No (NON-EDITABLE) */}
            <div style={{ borderRight: '1px solid black', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9px', textTransform: 'uppercase' }}>प्रमाणपत्र पत्र सं. Certificate No.</div>
              <div style={{ fontWeight: 'bold', fontSize: '11px', marginTop: '2px', wordBreak: 'break-all', lineHeight: '1.2' }}>
                {displayCertificateNo || certificateNo}
              </div>
            </div>

            {/* Col 2: Date (NON-EDITABLE) */}
            <div style={{ borderRight: '1px solid black', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9px', textTransform: 'uppercase' }}>दिनांक Date</div>
              <div style={{ fontWeight: 'bold', fontSize: '11px', marginTop: '2px' }}>
                {certificateDate}
              </div>
            </div>

            {/* Col 3: Offered / Passed Instt. No */}
            <div style={{ padding: '3px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left', lineHeight: '1.1', fontSize: '9px', fontWeight: 'bold' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div>प्रस्तावित किस्त सं.</div>
                  <div>Offered Instt. No.</div>
                </div>
                <div style={{ fontSize: '11px', paddingRight: '20px' }}>
                  <EditableField value={offeredInstNo} fieldName="offeredInstNo" style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '11px' }} {...fieldProps} />
                </div>
              </div>
              <div style={{ marginTop: '3px', paddingTop: '3px', borderTop: '1px dotted #999', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ paddingBottom: '2px' }}>किस्त स. पारित Passed Instt. No.</div>
                <div style={{ fontSize: '11px', paddingRight: '20px', paddingBottom: '2px' }}>
                  <EditableField value={passedInstNo} fieldName="passedInstNo" style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '11px' }} {...fieldProps} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Consolidated Data Table */}
        <table style={tableStyle}>
          <colgroup>
            <col style={{ width: '6%' }} />
            <col style={{ width: '28%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '9%' }} />
          </colgroup>
          <tbody>
            {/* Contractor & Place of Inspection */}
            <tr>
              <td colSpan="4" style={{ ...tdStyle, verticalAlign: 'top', padding: '6px 8px' }}>
                <div style={{ fontWeight: '600', fontSize: '9px' }}>ठेकेदार / Contractor</div>
                <div style={{ marginTop: '2px', fontWeight: 'bold', wordBreak: 'break-words', textTransform: 'uppercase', lineHeight: '1.25', fontSize: '10px' }}>
                  <EditableField value={contractor} fieldName="contractor" type="textarea" style={{ fontSize: '10px', fontWeight: 'bold' }} {...fieldProps} />
                </div>
              </td>
              <td colSpan="5" style={{ ...tdStyle, verticalAlign: 'top', padding: '6px 8px' }}>
                <div style={{ fontWeight: '600', fontSize: '9px' }}>निरीक्षण का स्थान / Place of Inspection</div>
                <div style={{ marginTop: '2px', fontWeight: 'bold', wordBreak: 'break-words', textTransform: 'uppercase', lineHeight: '1.25', fontSize: '10px' }}>
                  <EditableField value={placeOfInspection} fieldName="placeOfInspection" type="textarea" style={{ fontSize: '10px', fontWeight: 'bold' }} {...fieldProps} />
                </div>
              </td>
            </tr>

            {/* Contract Ref & Bill Paying Officer */}
            <tr>
              <td colSpan="4" style={{ ...tdStyle, verticalAlign: 'top', padding: '6px 8px' }}>
                <div style={{ fontWeight: '600', fontSize: '9px' }}>संविदा संदर्भ एवं Contract Reference</div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', gap: '1px', marginTop: '2px' }}>
                  <EditableField
                    value={contractRef}
                    fieldName="contractRef"
                    type="textarea"
                    placeholder="PO NO..."
                    style={{ fontSize: '10px', marginTop: '2px', fontWeight: 'bold', minHeight: '36px' }}
                    customRender={(val) => {
                      if (!val) return null;
                      return val.split('\n').map((line, idx) => (
                        <div key={idx} style={{ marginTop: '1px' }}>{line}</div>
                      ));
                    }}
                    {...fieldProps}
                  />
                  {maNumberAndDate && (
                    <div style={{ fontStyle: 'italic', fontWeight: 'bold', marginTop: '2px', fontSize: '10px' }}>
                      <EditableField value={maNumberAndDate} fieldName="maNumberAndDate" placeholder="MA Number & Date" style={{ fontSize: '10px' }} {...fieldProps} />
                    </div>
                  )}
                </div>
              </td>
              <td colSpan="5" style={{ ...tdStyle, verticalAlign: 'top', padding: '6px 8px' }}>
                <div style={{ fontWeight: '600', fontSize: '9px' }}>बिल अदायगी अधिकारी Bill Paying Officer</div>
                <div style={{ marginTop: '2px', fontWeight: 'bold', wordBreak: 'break-words', textTransform: 'uppercase', lineHeight: '1.25', fontSize: '10px' }}>
                  <EditableField value={billPayingOfficer} fieldName="billPayingOfficer" type="textarea" style={{ fontSize: '10px', fontWeight: 'bold' }} {...fieldProps} />
                </div>
              </td>
            </tr>

            {/* Consignee & Purchasing Authority */}
            <tr>
              <td colSpan="4" style={{ ...tdStyle, verticalAlign: 'top', padding: '6px 8px' }}>
                <div style={{ fontWeight: '600', fontSize: '9px' }}>प्रेषिती / Consignee</div>
                <div style={{ marginTop: '2px', fontWeight: 'bold', wordBreak: 'break-words', textTransform: 'uppercase', lineHeight: '1.25', fontSize: '10px' }}>
                  <EditableField value={consignee} fieldName="consignee" type="textarea" style={{ fontSize: '10px', fontWeight: 'bold' }} {...fieldProps} />
                </div>
              </td>
              <td colSpan="5" style={{ ...tdStyle, verticalAlign: 'top', padding: '6px 8px' }}>
                <div style={{ fontWeight: '600', fontSize: '9px' }}>क्रय प्राधिकारी / Purchasing Authority</div>
                <div style={{ marginTop: '2px', fontWeight: 'bold', wordBreak: 'break-words', textTransform: 'uppercase', lineHeight: '1.25', fontSize: '10px' }}>
                  <EditableField value={purchasingAuthority} fieldName="purchasingAuthority" type="textarea" style={{ fontSize: '10px', fontWeight: 'bold' }} {...fieldProps} />
                </div>
              </td>
            </tr>

            {/* STORES TABLE HEADERS */}
            <tr style={{ background: '#f8fafc', minHeight: '40px' }}>
              <th style={{ ...thStyle, borderBottom: 'none', fontSize: '8.5px' }}>मद<br />सं<br /><span style={{ fontSize: '8.5px' }}>Item<br />No.</span></th>
              <th style={{ ...thStyle, textAlign: 'center', borderBottom: 'none', fontSize: '8.5px' }}>भंडार का विवरण<br /><span style={{ fontSize: '8.5px' }}>Description of stores</span></th>
              <th style={{ ...thStyle, borderBottom: 'none', fontSize: '8.5px' }}>आदेशित<br />मात्रा<br /><span style={{ fontSize: '8.5px' }}>Quantity on<br />order</span></th>
              <th style={{ ...thStyle, borderBottom: 'none', fontSize: '8.5px' }}>पहले प्रस्तुत<br />संचयी मात्रा<br /><span style={{ fontSize: '8.5px' }}>Cumulative qty.<br />offered<br />previously</span></th>
              <th style={{ ...thStyle, borderBottom: 'none', fontSize: '8.5px' }}>पहले स्वीकृत<br />मात्रा<br /><span style={{ fontSize: '8.5px' }}>Quantity<br />previously passed</span></th>
              <th style={{ ...thStyle, borderBottom: 'none', fontSize: '8.5px' }}>अब प्रस्तुत<br />मात्रा<br /><span style={{ fontSize: '8.5px' }}>Qty now<br />offered</span></th>
              <th style={{ ...thStyle, borderBottom: 'none', fontSize: '8.5px' }}>अब स्वीकृत<br />मात्रा<br /><span style={{ fontSize: '8.5px' }}>Qty now<br />passed</span></th>
              <th style={{ ...thStyle, borderBottom: 'none', fontSize: '8.5px' }}>अब अस्वीकृत<br />मात्रा<br /><span style={{ fontSize: '8.5px' }}>Qty now<br />rejected</span></th>
              <th style={{ ...thStyle, borderBottom: 'none', fontSize: '8.5px' }}>बकाया मात्रा<br /><span style={{ fontSize: '8.5px' }}>Qty still<br />due</span></th>
            </tr>

            {/* STORES NUMBERING ROW 1 TO 9 */}
            <tr style={{ textAlign: 'center', height: '22px', fontWeight: 'bold', background: '#ffffff' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <td key={num} style={{ ...tdCenterStyle, borderTop: 'none', padding: '2px 0', fontSize: '9px' }}>{num}</td>
              ))}
            </tr>

            {/* STORES DATA ROW */}
            <tr>
              <td rowSpan={2} style={{ ...tdCenterStyle, paddingTop: '10px', verticalAlign: 'top', borderBottom: '1px solid black', fontWeight: 'bold', fontSize: '10px' }}>
                <EditableField value={itemNo} fieldName="itemNo" style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '10px' }} {...fieldProps} />
              </td>
              <td rowSpan={2} style={{ ...tdStyle, padding: '6px 8px', fontSize: '8.5px', lineHeight: '1.2', verticalAlign: 'top', borderBottom: '1px solid black', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <EditableField value={description} fieldName="description" type="textarea" style={{ fontSize: '8.5px', fontWeight: 'bold' }} {...fieldProps} />
              </td>
              <td style={{ ...tdCenterStyle, paddingTop: '10px', borderBottom: 'none', fontWeight: 'bold', fontSize: '12px' }}>
                {qtyOnOrder}
              </td>
              <td style={{ ...tdCenterStyle, paddingTop: '10px', borderBottom: 'none', fontWeight: 'bold', fontSize: '12px' }}>
                <EditableField value={qtyOfferedPreviously} fieldName="qtyOfferedPreviously" style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }} {...fieldProps} />
              </td>
              <td style={{ ...tdCenterStyle, paddingTop: '10px', borderBottom: 'none', fontWeight: 'bold', fontSize: '12px' }}>
                <EditableField value={qtyPassedPreviously} fieldName="qtyPassedPreviously" style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }} {...fieldProps} />
              </td>
              <td style={{ ...tdCenterStyle, paddingTop: '10px', borderBottom: 'none', fontWeight: 'bold', fontSize: '12px' }}>
                {qtyNowOffered}
              </td>
              <td style={{ ...tdCenterStyle, paddingTop: '10px', borderBottom: 'none', fontWeight: 'bold', fontSize: '12px' }}>
                {qtyNowPassed}
              </td>
              <td style={{ ...tdCenterStyle, paddingTop: '10px', borderBottom: 'none', fontWeight: 'bold', fontSize: '12px' }}>
                {qtyNowRejected}
              </td>
              <td style={{ ...tdCenterStyle, paddingTop: '10px', borderBottom: 'none', fontWeight: 'bold', fontSize: '12px' }}>
                <EditableField value={qtyStillDue} fieldName="qtyStillDue" style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }} {...fieldProps} />
              </td>
            </tr>

            {/* UNITS ROW (NOS. / SET) */}
            <tr>
              {[3, 4, 5, 6, 7, 8, 9].map((colIdx) => (
                <td key={colIdx} style={{ ...tdCenterStyle, borderTop: 'none', borderBottom: '1px solid black', padding: '2px 0 6px 0', fontSize: '8.5px', color: '#1e293b' }}>
                  {unitText}
                </td>
              ))}
            </tr>

            {/* QUANTITY NOW PASSED BANNER / TEXT BOX */}
            <tr>
              <td colSpan={9} style={{
                ...tdStyle,
                padding: '6px 10px',
                borderTop: 'none',
                borderBottom: '1px solid black',
                background: 'white'
              }}>
                <div style={{
                  border: '1px solid black',
                  padding: '6px 10px',
                  textAlign: 'left',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  fontStyle: 'italic',
                  lineHeight: '1.35',
                  minHeight: '26px'
                }}>
                  <EditableField value={quantityNowPassedText} fieldName="quantityNowPassedText" type="textarea" style={{ fontSize: '10px', fontWeight: 'bold', fontStyle: 'italic' }} {...fieldProps} />
                </div>
              </td>
            </tr>

            {/* INSPECTION DETAILS ROW */}
            <tr>
              <td colSpan="9" style={{ padding: 0, border: '1px solid black' }}>
                <div style={{ display: 'flex', width: '100%' }}>
                  <div style={{ width: '20%', padding: '4px', borderRight: '1px solid black', fontSize: '9px' }}>
                    <div style={{ fontWeight: 'bold', lineHeight: '1.2' }}>जाँचे गये की संख्या<br />No. of checked</div>
                    <div style={{ marginTop: '4px', fontWeight: 'bold', fontSize: '10px', textAlign: 'center' }}>
                      <EditableField value={noOfItemsChecked && noOfItemsChecked !== "1" ? noOfItemsChecked : (qtyNowOffered || noOfItemsChecked || "1")} fieldName="noOfItemsChecked" style={{ fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }} {...fieldProps} />
                    </div>
                  </div>
                  <div style={{ width: '22%', padding: '4px', borderRight: '1px solid black', fontSize: '9px' }}>
                    <div style={{ fontWeight: 'bold', lineHeight: '1.2' }}>बुलावे की तिथि<br />Date of call</div>
                    <div style={{ marginTop: '4px', fontWeight: 'bold', fontSize: '10px' }}>
                      <EditableField value={dateOfCall} fieldName="dateOfCall" style={{ fontSize: '10px', fontWeight: 'bold' }} {...fieldProps} />
                    </div>
                  </div>
                  <div style={{ width: '12%', padding: '4px', borderRight: '1px solid black', fontSize: '9px' }}>
                    <div style={{ fontWeight: 'bold', lineHeight: '1.2' }}>दौरों की संख्या<br />No. of visits</div>
                    <div style={{ marginTop: '4px', fontWeight: 'bold', fontSize: '10px', textAlign: 'center' }}>
                      <EditableField value={noOfVisits} fieldName="noOfVisits" style={{ fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }} {...fieldProps} />
                    </div>
                  </div>
                  <div style={{ width: '32%', padding: '4px', borderRight: '1px solid black', fontSize: '9px', overflow: 'hidden' }}>
                    <div style={{ fontWeight: 'bold', lineHeight: '1.2' }}>निरीक्षण की तिथि<br />Date(s) of inspection</div>
                    <div style={{ marginTop: '4px', fontWeight: 'bold', fontSize: '10px', lineHeight: '1.2', wordBreak: 'break-word' }}>
                      <EditableField value={datesOfInspection} fieldName="datesOfInspection" type="textarea" style={{ fontSize: '10px', fontWeight: 'bold' }} {...fieldProps} />
                    </div>
                  </div>
                  <div style={{ width: '14%', padding: '4px', fontSize: '9px' }}>
                    <div style={{ fontWeight: 'bold', lineHeight: '1.2' }}>TR Rec. Dt.</div>
                    <div style={{ marginTop: '4px', fontWeight: 'bold', fontSize: '10px', fontStyle: 'italic' }}>
                      <EditableField value={trRecDate} fieldName="trRecDate" placeholder="TR Date" style={{ width: '60px', fontSize: '10px' }} {...fieldProps} />
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            {/* SEALING + REJECTION */}
            <tr>
              <td colSpan="9" style={{ padding: 0, border: '1px solid black' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '45%', padding: '4px', borderRight: '1px solid black', borderBottom: '1px solid black', fontSize: '9px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 'bold', lineHeight: '1.2' }}>सील बंदी/मोहर बंदी का स्वरूप और सील मोहर का स्थान<br />Pattern of sealing/stamping &amp; location of seal/stamp/sticker</div>
                        <div style={{ marginTop: '4px', fontWeight: 'bold', fontSize: '9px', lineHeight: '1.25', textTransform: 'uppercase' }}>
                          <EditableField value={sealingPattern} fieldName="sealingPattern" type="textarea" style={{ fontSize: '9px', fontWeight: 'bold' }} {...fieldProps} />
                        </div>
                      </td>
                      <td style={{ width: '25%', padding: '4px', borderRight: '1px solid black', borderBottom: '1px solid black', fontSize: '9px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 'bold', lineHeight: '1.2' }}>मुहर / स्टाम्प की प्रतिकृति<br />Facsimile of seal/stamp/sticker</div>
                        <div style={{ marginTop: '4px', fontStyle: 'italic', fontSize: '9px', lineHeight: '1.25' }}>
                          <EditableField value={facsimileText} fieldName="facsimileText" type="textarea" style={{ fontSize: '9px' }} {...fieldProps} />
                        </div>
                      </td>
                      <td rowSpan="2" style={{ width: '30%', padding: '4px', verticalAlign: 'top' }}>
                        <div className="ie-signature-box" style={{
                          minHeight: '90px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          height: '100%',
                          position: 'relative'
                        }}>
                          <div style={{ fontWeight: 'bold', lineHeight: '1.2', fontSize: '9.5px' }}>
                            निरीक्षण अभियंता<br />Inspecting Engineer
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%', marginTop: '4px' }}>
                            <EditableField value={inspectingEngineer} fieldName="inspectingEngineer" style={{ textAlign: 'right', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10px' }} {...fieldProps} />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="2" style={{ padding: '4px 6px', fontSize: '10px', verticalAlign: 'top', borderRight: '1px solid black' }}>
                        <span style={{ fontWeight: '600' }}>अस्वीकृति का कारण / Reasons for rejection: </span>
                        <span style={{ fontStyle: 'italic' }}>
                          <EditableField value={reasonsForRejection} fieldName="reasonsForRejection" style={{ display: 'inline-block', width: '260px', fontSize: '10px' }} {...fieldProps} />
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* FOOTER DISCLAIMERS */}
            <tr>
              <td colSpan="9" style={{ padding: 0, borderTop: '1px solid black' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '8.5px', lineHeight: '1.2', fontWeight: 'bold', fontStyle: 'italic' }}>
                  <div style={{ borderRight: '1px solid black', padding: '4px 6px', textAlign: 'center' }}>
                    सामग्री को शीघ्र अति शीघ्र भेजा जाना चाहिए। प्रेषण एवं सामग्री भेजने के लिए 30 दिन तक मान्य है। सभी प्रकार के पीएससी स्लीपर के लिए यह प्रमाणपत्र 90 दिनों तक मान्य रहेगा।
                  </div>
                  <div style={{ padding: '4px 6px', textAlign: 'center' }}>
                    The material should be dispatched as early as possible. The certificate is valid for a period of 30 days for dispatch of stores. However, in the case of all types of PSC Sleepers, the certificate is valid for 90 days.
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

      </fieldset>
    </div>
  );
};

export default SleeperFinalIc;
