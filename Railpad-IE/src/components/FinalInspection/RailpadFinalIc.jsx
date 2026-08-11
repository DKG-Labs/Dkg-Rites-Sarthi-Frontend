import React from "react";

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

const RailpadFinalIc = ({ data = {}, isEditing = false, isBusy = false, isViewOnly = false, onFieldChange = () => { }, onVerifyBookSet, bookSetValidation }) => {

  const {
    certificateNo = "",
    certificateDate = "",
    offeredInstNo = "",
    passedInstNo = "",
    contractor = "",
    placeOfInspection = "",
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
    sealingPattern = "RITES HOLOGRAM HAS BEEN AFFIXED ON THE LEAD SEAL ,TIED WITH SEALING WIRE TO THE PACKING STRIP OF EACH CORRUGATED BOX",
    facsimileText = "",
    reasonsForRejection = "N/A",
    inspectingEngineer = "",
    bookNo = "",
    setNo = "",
    contractRef = "",
  } = data;

  const allowedFields = [
    "bookNo", "setNo", "offeredInstNo", "passedInstNo", "contractRef",
    "billPayingOfficer", "consignee", "purchasingAuthority", "description",
    "quantityNowPassedText", "noOfItemsChecked", "datesOfInspection",
    "trRecDate", "reasonsForRejection", "sealingPattern", "contractor",
    "placeOfInspection", "certificateDate", "inspectingEngineer"
  ];

  const isBookSetEntered = Boolean(bookNo && bookNo.trim().length === 4 && setNo && /^\d{3}$/.test(setNo.trim()));

  const fieldProps = {
    isEditing,
    isViewOnly,
    isBusy,
    isBookSetEntered,
    allowedFields,
    onFieldChange
  };

  const displayCertificateNo = (certificateNo || '')
    .replace(/[\uFEFF\u200B]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    border: '1px solid black',
    backgroundColor: '#fff',
    color: '#000',
    fontSize: '10px',
    fontFamily: 'Arial, sans-serif',
    tableLayout: 'fixed'
  };

  const thStyle = {
    border: '1px solid black',
    padding: '2px 3px',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '9px',
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
    fontSize: '10px'
  };

  const tdCenterStyle = {
    ...tdStyle,
    textAlign: 'center'
  };

  return (
    <div className="certificate-page" style={{
      width: '800px',
      margin: '0 auto',
      padding: '16px 20px',
      background: 'white',
      color: 'black',
      fontFamily: "Arial, Helvetica, sans-serif",
      boxSizing: 'border-box',
      border: '1px solid #cbd5e1',
      fontSize: '10px',
      lineHeight: '1.25'
    }}>

      {/* Top spacing to match RITES letterhead margin exactly (matching ERC 35mm) */}
      <div style={{ height: '35mm' }}></div>

      {/* Book & Set Number Container */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '8px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', border: '1px solid black', width: '180px', background: 'white' }}>
            <div style={{ flex: 1, borderRight: '1px solid black', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                borderBottom: '1px solid black',
                padding: '3px',
                fontWeight: 'bold',
                textAlign: 'center',
                fontSize: '9px',
                background: '#ffffff'
              }}>
                बुक सं Book No.
              </div>
              <div style={{ padding: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '22px' }}>
                <EditableField value={bookNo} fieldName="bookNo" maxLength={4} disabled={isBusy} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }} {...fieldProps} />
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{
                borderBottom: '1px solid black',
                padding: '3px',
                fontWeight: 'bold',
                textAlign: 'center',
                fontSize: '9px',
                background: '#ffffff'
              }}>
                सेट सं Set No.
              </div>
              <div style={{ padding: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '22px' }}>
                <EditableField value={setNo} fieldName="setNo" maxLength={3} disabled={isBusy} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }} {...fieldProps} />
              </div>
            </div>
          </div>
          {isEditing && (
            <div style={{ marginTop: '4px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={onVerifyBookSet}
                disabled={isBusy || bookSetValidation?.isValidating}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '8.5px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
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
          )}
        </div>
      </div>

      {/* RITES BHILAI HEADLINE HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        width: '100%',
        paddingBottom: '6px',
        marginBottom: '12px'
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
          RITES LTD, CENTRAL REGION, BHILAI
        </div>
        <div style={{
          flex: 1,
          textAlign: 'right',
          lineHeight: '1.1',
          fontSize: '8.5px',
          fontWeight: 'bold'
        }}>
          <div>निरंतरता पत्रक शामिल</div>
          <div style={{ fontSize: '7.5px' }}>Contains 0 Continuation Sheets</div>
        </div>
      </div>

      {/* Certificate Info Row — 75% width aligned right, matching Sleeper IC design exactly */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0px', width: '100%' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.8fr 1fr 2.7fr',
          border: '1px solid black',
          borderBottom: 'none',
          width: '75%',
          fontSize: '10px'
        }}>
          {/* Col 1: Certificate No */}
          <div style={{ borderRight: '1px solid black', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '8px', textTransform: 'uppercase' }}>प्रमाणपत्र पत्र सं. Certificate No.</div>
            <div style={{ fontWeight: 'bold', fontSize: '9.5px', marginTop: '4px', wordBreak: 'break-all', lineHeight: '1.2' }}>
              {displayCertificateNo || certificateNo}
            </div>
          </div>

          {/* Col 2: Date */}
          <div style={{ borderRight: '1px solid black', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '8px', textTransform: 'uppercase' }}>दिनांक Date</div>
            <div style={{ fontWeight: 'bold', fontSize: '9.5px', marginTop: '4px' }}>
              <EditableField value={certificateDate} fieldName="certificateDate" style={{ textAlign: 'center', fontWeight: 'bold' }} {...fieldProps} />
            </div>
          </div>

          {/* Col 3: Offered / Passed Instt. No */}
          <div style={{ padding: '4px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left', lineHeight: '1.1', fontSize: '9px', fontWeight: 'bold' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div>प्रस्तावित किस्त सं.</div>
                <div>Offered Instt. No.</div>
              </div>
              <div style={{ fontSize: '11px', paddingRight: '32px' }}>
                <EditableField value={offeredInstNo} fieldName="offeredInstNo" style={{ textAlign: 'right', fontWeight: 'bold' }} {...fieldProps} />
              </div>
            </div>
            <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px dotted #999', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ paddingBottom: '4px' }}>किस्त सं. पारित Passed Instt. No.</div>
              <div style={{ fontSize: '11px', paddingRight: '32px', paddingBottom: '4px' }}>
                <EditableField value={passedInstNo} fieldName="passedInstNo" style={{ textAlign: 'right', fontWeight: 'bold' }} {...fieldProps} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Consolidated Data Table */}
      <table style={tableStyle}>
        <colgroup>
          <col style={{ width: '7%' }} />
          <col style={{ width: '28%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>
        <tbody>
          {/* Contractor & Place of Inspection */}
          <tr>
            <td colSpan="4" style={{ ...tdStyle, verticalAlign: 'top' }}>
              <div style={{ height: '6px' }} />
              <div style={{ fontWeight: '600', fontSize: '8.5px' }}>ठेकेदार Contractor</div>
              <div style={{ marginTop: '2px', fontWeight: 'bold', wordBreak: 'break-words', textTransform: 'uppercase', lineHeight: '1.3' }}>
                <EditableField value={contractor} fieldName="contractor" type="textarea" {...fieldProps} />
              </div>
            </td>
            <td colSpan="5" style={{ ...tdStyle, verticalAlign: 'top' }}>
              <div style={{ height: '6px' }} />
              <div style={{ fontWeight: '600', fontSize: '8.5px' }}>निरीक्षण का स्थान Place of Inspection</div>
              <div style={{ marginTop: '2px', fontWeight: 'bold', wordBreak: 'break-words', textTransform: 'uppercase', lineHeight: '1.3' }}>
                <EditableField value={placeOfInspection} fieldName="placeOfInspection" type="textarea" {...fieldProps} />
              </div>
            </td>
          </tr>

          {/* Contract Ref & Bill Paying Officer */}
          <tr>
            <td colSpan="4" style={{ ...tdStyle, verticalAlign: 'top' }}>
              <div style={{ height: '6px' }} />
              <div style={{ fontWeight: '600', fontSize: '8.5px' }}>संविदा संदर्भ Contract References</div>
              <div style={{ fontSize: '9.5px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', gap: '1px', marginTop: '2px' }}>
                <EditableField
                  value={contractRef}
                  fieldName="contractRef"
                  type="textarea"
                  placeholder="PO NO..."
                  style={{ fontSize: '9.5px', marginTop: '2px', fontWeight: 'bold', minHeight: '60px' }}
                  customRender={(val) => {
                    if (!val) return null;
                    return val.split('\n').map((line, idx) => {
                      const match = line.match(/^(.*?)\s+dated\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s*$/);
                      if (match) {
                        return (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1px' }}>
                            <span>{match[1].trim()}</span>
                            <span style={{ paddingRight: '10px' }}>{match[2]}</span>
                          </div>
                        );
                      }
                      return <div key={idx} style={{ marginTop: '1px' }}>{line}</div>;
                    });
                  }}
                  {...fieldProps}
                />
              </div>
            </td>
            <td colSpan="5" style={{ ...tdStyle, verticalAlign: 'top' }}>
              <div style={{ height: '6px' }} />
              <div style={{ fontWeight: '600', fontSize: '8.5px' }}>वित्त प्रदायगी अधिकारी Bill Paying Officer</div>
              <div style={{ marginTop: '2px', fontWeight: 'bold', wordBreak: 'break-words', textTransform: 'uppercase', lineHeight: '1.3' }}>
                <EditableField value={billPayingOfficer} fieldName="billPayingOfficer" type="textarea" style={{ fontSize: '9.5px', fontWeight: 'bold' }} {...fieldProps} />
              </div>
            </td>
          </tr>

          {/* Consignee & Purchasing Authority */}
          <tr>
            <td colSpan="4" style={{ ...tdStyle, verticalAlign: 'top' }}>
              <div style={{ height: '6px' }} />
              <div style={{ fontWeight: '600', fontSize: '8.5px' }}>प्रेषिती Consignee</div>
              <div style={{ marginTop: '2px', fontWeight: 'bold', wordBreak: 'break-words', textTransform: 'uppercase', lineHeight: '1.3' }}>
                <EditableField value={consignee} fieldName="consignee" type="textarea" style={{ fontSize: '10px' }} {...fieldProps} />
              </div>
            </td>
            <td colSpan="5" style={{ ...tdStyle, verticalAlign: 'top' }}>
              <div style={{ height: '6px' }} />
              <div style={{ fontWeight: '600', fontSize: '8.5px' }}>क्रय अधिकारी Purchasing Authority</div>
              <div style={{ marginTop: '2px', fontWeight: 'bold', wordBreak: 'break-words', textTransform: 'uppercase', lineHeight: '1.3' }}>
                <EditableField value={purchasingAuthority} fieldName="purchasingAuthority" type="textarea" style={{ fontSize: '10px' }} {...fieldProps} />
              </div>
            </td>
          </tr>

          {/* STORES TABLE HEADERS */}
          <tr style={{ background: '#ffffff' }}>
            <th style={{ ...thStyle, borderBottom: 'none' }}>मद सं<br />Item<br />No.</th>
            <th style={{ ...thStyle, textAlign: 'left', borderBottom: 'none' }}>भंडार का विवरण<br />Description of Stores</th>
            <th style={{ ...thStyle, borderBottom: 'none' }}>आदेशित मात्रा<br />Quantity on<br />Order</th>
            <th style={{ ...thStyle, borderBottom: 'none' }}>पहले प्रस्तावित<br />संचयी मात्रा<br />Cumulative<br />Qty Offered<br />Previously</th>
            <th style={{ ...thStyle, borderBottom: 'none' }}>पहले स्वीकृत<br />मात्रा<br />Qty Prev<br />Passed</th>
            <th style={{ ...thStyle, borderBottom: 'none' }}>अब प्रस्तावित<br />मात्रा<br />Qty Now<br />Offered</th>
            <th style={{ ...thStyle, borderBottom: 'none' }}>अब स्वीकृत<br />मात्रा<br />Qty Now<br />Passed</th>
            <th style={{ ...thStyle, borderBottom: 'none' }}>अब अस्वीकृत<br />मात्रा<br />Qty Now<br />Rejected</th>
            <th style={{ ...thStyle, borderBottom: 'none' }}>बकाया मात्रा<br />Qty Still<br />Due</th>
          </tr>

          <tr style={{ textAlign: 'center', height: '18px', fontWeight: 'bold', background: '#ffffff' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <td key={num} style={{ ...tdCenterStyle, borderTop: 'none' }}>{num}</td>
            ))}
          </tr>

          {/* STORES DATA ROWS */}
          <tr>
            <td rowSpan={3} style={{ ...tdCenterStyle, paddingTop: '15px', verticalAlign: 'top', borderBottom: 'none' }}>{itemNo}</td>
            <td rowSpan={3} style={{ ...tdStyle, padding: '8px', fontSize: '8.5px', lineHeight: '1.25', verticalAlign: 'top', borderBottom: 'none' }}>
              <EditableField value={description} fieldName="description" type="textarea" style={{ fontSize: '8.5px' }} {...fieldProps} />
            </td>
            <td style={{ ...tdCenterStyle, paddingTop: '15px', borderBottom: 'none' }}>
              <div>{qtyOnOrder}</div>
              <div style={{ fontWeight: 'normal', fontSize: '8px', color: '#475569', marginTop: '2px' }}>Nos.</div>
            </td>
            <td style={{ ...tdCenterStyle, paddingTop: '15px', borderBottom: 'none' }}>
              <div>{qtyOfferedPreviously}</div>
              <div style={{ fontWeight: 'normal', fontSize: '8px', color: '#475569', marginTop: '2px' }}>Nos.</div>
            </td>
            <td style={{ ...tdCenterStyle, paddingTop: '15px', borderBottom: 'none' }}>
              <div>{qtyPassedPreviously}</div>
              <div style={{ fontWeight: 'normal', fontSize: '8px', color: '#475569', marginTop: '2px' }}>Nos.</div>
            </td>
            <td style={{ ...tdCenterStyle, paddingTop: '15px', borderBottom: 'none' }}>
              <div>{qtyNowOffered}</div>
              <div style={{ fontWeight: 'normal', fontSize: '8px', color: '#475569', marginTop: '2px' }}>Nos.</div>
            </td>
            <td style={{ ...tdCenterStyle, paddingTop: '15px', borderBottom: 'none' }}>
              <div>{qtyNowPassed}</div>
              <div style={{ fontWeight: 'normal', fontSize: '8px', color: '#475569', marginTop: '2px' }}>Nos.</div>
            </td>
            <td style={{ ...tdCenterStyle, paddingTop: '15px', borderBottom: 'none' }}>
              <div>{qtyNowRejected}</div>
              <div style={{ fontWeight: 'normal', fontSize: '8px', color: '#475569', marginTop: '2px' }}>Nos.</div>
            </td>
            <td style={{ ...tdCenterStyle, paddingTop: '15px', borderBottom: 'none' }}>
              <div>{qtyStillDue}</div>
              <div style={{ fontWeight: 'normal', fontSize: '8px', color: '#475569', marginTop: '2px' }}>Nos.</div>
            </td>
          </tr>

          {/* FILLER ROW ABOVE TEXT BOX */}
          <tr>
            <td style={{ ...tdCenterStyle, borderTop: 'none', borderBottom: 'none', padding: 0 }}>
              <div style={{ minHeight: '20px' }}></div>
            </td>
            <td style={{ ...tdCenterStyle, borderTop: 'none', borderBottom: 'none' }}></td>
            <td style={{ ...tdCenterStyle, borderTop: 'none', borderBottom: 'none' }}></td>
            <td style={{ ...tdCenterStyle, borderTop: 'none', borderBottom: 'none' }}></td>
            <td style={{ ...tdCenterStyle, borderTop: 'none', borderBottom: 'none' }}></td>
            <td style={{ ...tdCenterStyle, borderTop: 'none', borderBottom: 'none' }}></td>
            <td style={{ ...tdCenterStyle, borderTop: 'none', borderBottom: 'none' }}></td>
          </tr>
          <tr style={{ height: '1px' }}>
            <td colSpan={7} style={{
              ...tdStyle,
              padding: '0',
              boxSizing: 'border-box',
              border: 'none',
              background: 'white'
            }}>
              <div style={{
                border: '1px solid black',
                padding: '8px 12px',
                textAlign: 'left',
                fontSize: '8px',
                fontWeight: 'bold',
                lineHeight: '1.4',
                textTransform: 'uppercase',
                boxSizing: 'border-box',
                width: 'calc(100% - 12px)',
                minHeight: '80px',
                margin: '0 0 0 12px'
              }}>
                <EditableField value={quantityNowPassedText} fieldName="quantityNowPassedText" type="textarea" style={{ fontSize: '8px', fontWeight: 'bold' }} {...fieldProps} />
              </div>
            </td>
          </tr>

          {/* FILLER ROW */}
          <tr style={{ height: '100%' }}>
            <td style={{ ...tdCenterStyle, borderTop: 'none', padding: 0 }}>
              <div style={{ minHeight: '70px' }}></div>
            </td>
            <td style={{ ...tdCenterStyle, borderTop: 'none' }}></td>
            <td style={{ ...tdCenterStyle, borderTop: 'none' }}></td>
            <td style={{ ...tdCenterStyle, borderTop: 'none' }}></td>
            <td style={{ ...tdCenterStyle, borderTop: 'none' }}></td>
            <td style={{ ...tdCenterStyle, borderTop: 'none' }}></td>
            <td style={{ ...tdCenterStyle, borderTop: 'none' }}></td>
          </tr>

          {/* INSPECTION DETAILS */}
          <tr>
            <td colSpan="9" style={{ padding: 0, border: '1px solid black' }}>
              <div style={{ display: 'flex', width: '100%' }}>
                <div style={{ width: '20%', padding: '4px', borderRight: '1px solid black', fontSize: '9px' }}>
                  <div style={{ fontWeight: 'bold', lineHeight: '1.2' }}>जाँच की गयी इकाइयों की सं.<br />No. of items checked</div>
                  <div style={{ marginTop: '8px', fontWeight: 'bold', fontSize: '10px' }}>
                    <EditableField value={noOfItemsChecked} fieldName="noOfItemsChecked" style={{ fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }} {...fieldProps} />
                  </div>
                </div>
                <div style={{ width: '15%', padding: '4px', borderRight: '1px solid black', fontSize: '9px' }}>
                  <div style={{ fontWeight: 'bold', lineHeight: '1.2' }}>बुलावे की तारीख<br />Date of call</div>
                  <div style={{ marginTop: '8px', fontWeight: 'bold', fontSize: '10px' }}>
                    <EditableField value={dateOfCall} fieldName="dateOfCall" style={{ fontSize: '10px', fontWeight: 'bold' }} {...fieldProps} />
                  </div>
                </div>
                <div style={{ width: '10%', padding: '4px', borderRight: '1px solid black', fontSize: '9px' }}>
                  <div style={{ fontWeight: 'bold', lineHeight: '1.2' }}>दौरों की संख्या<br />No. of Visits</div>
                  <div style={{ marginTop: '8px', fontWeight: 'bold', fontSize: '10px' }}>
                    <EditableField value={noOfVisits} fieldName="noOfVisits" style={{ fontSize: '10px', fontWeight: 'bold' }} {...fieldProps} />
                  </div>
                </div>
                <div style={{ width: '45%', padding: '4px', borderRight: '1px solid black', fontSize: '9px', overflow: 'hidden' }}>
                  <div style={{ fontWeight: 'bold', lineHeight: '1.2' }}>निरीक्षण की तारीखें<br />Date(s) of inspection</div>
                  <div style={{ marginTop: '6px', fontWeight: 'bold', fontSize: '9px', lineHeight: '1.2', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    <EditableField value={datesOfInspection} fieldName="datesOfInspection" type="textarea" style={{ fontSize: '9px', fontWeight: 'bold' }} {...fieldProps} />
                  </div>
                </div>
                <div style={{ width: '10%', padding: '4px', fontSize: '9px' }}>
                  <div style={{ fontWeight: 'bold', lineHeight: '1.2' }}>TR Rec. dt.</div>
                  <div style={{ marginTop: '8px', fontWeight: 'bold', fontSize: '10px' }}>
                    <EditableField value={trRecDate} fieldName="trRecDate" placeholder="TR Date" style={{ width: '60px' }} {...fieldProps} />
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
                    <td style={{ width: '40%', padding: '4px', borderRight: '1px solid black', borderBottom: '1px solid black', fontSize: '9px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 'bold', lineHeight: '1.2' }}>सील बंदी मोहर बंदी का स्वरूप और सील मोहर का स्थान<br />Pattern of sealing/stamping &amp; location of seal/stamp/sticker</div>
                      <div style={{ marginTop: '4px', fontWeight: 'bold', fontSize: '8px', lineHeight: '1.25', textTransform: 'uppercase' }}>
                        <EditableField value={sealingPattern} fieldName="sealingPattern" type="textarea" style={{ fontSize: '8px', fontWeight: 'bold' }} {...fieldProps} />
                      </div>
                    </td>
                    <td style={{ width: '30%', padding: '4px', borderRight: '1px solid black', borderBottom: '1px solid black', fontSize: '9px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 'bold', lineHeight: '1.2' }}>मुहर / स्टाम्प की प्रतिकृति<br />Facsimile of seal/stamp/sticker</div>
                      <div style={{ marginTop: '4px', fontStyle: 'italic', fontSize: '8px', lineHeight: '1.25' }}>
                        <EditableField value={facsimileText} fieldName="facsimileText" type="textarea" style={{ fontSize: '8px' }} {...fieldProps} />
                      </div>
                    </td>
                    <td rowSpan="2" className="ie-signature-box" style={{ width: '30%', padding: '4px', fontSize: '9px', verticalAlign: 'top', display: 'table-cell' }}>
                      <div style={{ fontWeight: 'bold', lineHeight: '1.2' }}>निरीक्षण अभियंता<br />Inspecting Engineer</div>
                      <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '9px', textTransform: 'uppercase', marginTop: '30px' }}>
                        <EditableField value={inspectingEngineer} fieldName="inspectingEngineer" style={{ textAlign: 'right', fontWeight: 'bold' }} {...fieldProps} />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="2" style={{ padding: '4px 6px', fontSize: '10px', verticalAlign: 'top', borderRight: '1px solid black' }}>
                      <span style={{ fontWeight: 'bold' }}>अस्वीकृति का कारण &nbsp;Reason of rejection: </span>
                      <span style={{ fontStyle: 'italic' }}>
                        <EditableField value={reasonsForRejection} fieldName="reasonsForRejection" style={{ display: 'inline-block', width: '300px' }} {...fieldProps} />
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* FOOTER DISCLAIMERS */}
          <tr>
            <td colSpan="4" style={{ border: '1px solid black', padding: '4px', fontSize: '7.5px', lineHeight: '1.25', fontWeight: '500', color: '#000' }}>
              सामग्री को शीघ्र अति शीघ्र भेजा जाना चाहिए। प्रमाण पत्र सामग्री भेजने के लिए 30 दिन तक मान्य है। सभी प्रकार के पीएससी स्लीपर के लिए यह प्रमाणपत्र 90 दिनों तक मान्य रहेगा।
            </td>
            <td colSpan="5" style={{ border: '1px solid black', padding: '4px', fontSize: '7.5px', lineHeight: '1.25', fontWeight: '500', color: '#000' }}>
              The material should be dispatched as early as possible. The certificate is valid for a period of 30 days for dispatch of stores. However, in the case of all types of PSC Sleepers, the certificate is valid for 90 days.
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer spacing */}
      <div style={{ minHeight: '15mm' }}></div>

    </div>
  );
};

export default RailpadFinalIc;
