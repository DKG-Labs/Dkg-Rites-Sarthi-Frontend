import React from "react";

const SleeperFinalIc = ({ data = {}, isEditing = false, isBusy = false, onFieldChange = () => {}, onVerifyBookSet, bookSetValidation }) => {
  const allowedFields = [
    "bookNo", "setNo", "offeredInstNo", "passedInstNo", "contractRef",
    "billPayingOfficer", "consignee", "purchasingAuthority", "itemNo",
    "descriptionOfStores", "qtyOnOrder", "qtyOfferedPreviously",
    "qtyPassedPreviously", "qtyNowOffered", "qtyNowPassed", "qtyNowRejected",
    "qtyStillDue", "quantityNowPassedText", "noOfItemsChecked", "dateOfCall",
    "noOfVisits", "datesOfInspection", "trRecDate", "sealingPattern",
    "reasonsForRejection", "inspectingEngineer", "certificateNo", "certificateDate"
  ];

  const {
    certificateNo = "",
    certificateDate = "",
    bookNo = "",
    setNo = "",
    offeredInstNo = "",
    passedInstNo = "",
    contractor = "",
    placeOfInspection = "",
    poNo = "",
    contractRef = "",
    billPayingOfficer = "",
    consignee = "",
    purchasingAuthority = "",
    itemNo = "1",
    descriptionOfStores = "SL. NO. 1 - ORDINARY SLEEPER T-2496",
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
    reasonsForRejection = "",
    inspectingEngineer = ""
  } = data;

  const displayCertificateNo = (certificateNo || "")
    .replace(/^(\/[^\/]+)/, "")
    .trim();

  const EditableField = ({ value, fieldName, placeholder = "", style = {}, type = "text", disabled = false, maxLength }) => {
    const safeValue = value !== null && value !== undefined ? String(value) : "";
    
    if (isEditing && allowedFields.includes(fieldName)) {
      if (type === "textarea") {
        return (
          <textarea
            value={safeValue}
            onChange={(e) => onFieldChange(fieldName, e.target.value)}
            placeholder={placeholder}
            style={{ width: '100%', padding: '4px', border: '1px solid #60a5fa', backgroundColor: '#eff6ff', fontSize: '11px', boxSizing: 'border-box', ...style }}
            rows={2}
            disabled={disabled || isBusy}
          />
        );
      }
      return (
        <input
          type="text"
          value={safeValue}
          onChange={(e) => onFieldChange(fieldName, e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          style={{ width: '100%', padding: '2px', border: '1px solid #60a5fa', backgroundColor: '#eff6ff', fontSize: '11px', boxSizing: 'border-box', ...style }}
          disabled={disabled || isBusy}
        />
      );
    }

    return <span style={style}>{safeValue}</span>;
  };

  const tableStyle = { width: '100%', borderCollapse: 'collapse', border: '1px solid black', backgroundColor: '#fff', color: '#000', fontSize: '10px', fontFamily: 'Arial, sans-serif' };
  const thStyle = { border: '1px solid black', padding: '2px 4px', textAlign: 'center', fontWeight: 'bold' };
  const tdStyle = { border: '1px solid black', padding: '4px', verticalAlign: 'top' };
  const tdCenterStyle = { ...tdStyle, textAlign: 'center' };

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', minHeight: '1000px', margin: '0 auto' }}>
      
      {/* HEADER SECTION */}
      <div style={{ textAlign: 'center', marginBottom: '10px', position: 'relative' }}>
        <table style={{ margin: '0 auto', borderCollapse: 'collapse', border: '2px solid black', width: '180px' }}>
          <tbody>
            <tr>
              <td style={{ border: '2px solid black', padding: '2px', fontWeight: 'bold', fontSize: '9px', textAlign: 'center', borderBottom: '1px solid black' }}>
                बुक सं. Book No.
              </td>
              <td style={{ border: '2px solid black', padding: '2px', fontWeight: 'bold', fontSize: '9px', textAlign: 'center', borderBottom: '1px solid black' }}>
                सेट सं. Set No.
              </td>
            </tr>
            <tr>
              <td style={{ border: '2px solid black', padding: '2px', textAlign: 'center', height: '20px' }}>
                <EditableField value={bookNo} fieldName="bookNo" style={{ fontWeight: 'bold', fontSize: '12px' }} maxLength={10} disabled={isBusy} />
              </td>
              <td style={{ border: '2px solid black', padding: '2px', textAlign: 'center', height: '20px' }}>
                <EditableField value={setNo} fieldName="setNo" style={{ fontWeight: 'bold', fontSize: '12px' }} maxLength={3} disabled={isBusy} />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Verify Book & Set No Button and Warnings (Hidden in PDF) */}
        {isEditing && (
          <div className="no-print" style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                onClick={onVerifyBookSet} 
                disabled={isBusy || bookSetValidation?.isValidating}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: isBusy || bookSetValidation?.isValidating ? 'not-allowed' : 'pointer'
                }}
              >
                {bookSetValidation?.isValidating ? "Validating..." : "Verify Book & Set No."}
              </button>
              {bookSetValidation && !bookSetValidation.isValidating && (
                <span style={{ fontSize: '10px', fontWeight: 'bold' }}>
                  {bookSetValidation.isValid ? (
                    <span style={{ color: '#16a34a' }}>✅ Valid</span>
                  ) : (
                    <span style={{ color: '#dc2626' }}>❌ {bookSetValidation.message || "Invalid"}</span>
                  )}
                </span>
              )}
            </div>

            {bookNo && String(bookNo).trim().length > 0 && String(bookNo).trim().length < 4 && (
              <div style={{
                fontSize: '9px',
                fontWeight: 'bold',
                color: '#92400e',
                backgroundColor: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '4px',
                padding: '4px 8px',
                textAlign: 'center',
                maxWidth: '240px',
                lineHeight: '1.2'
              }}>
                ⚠️ Book Number is generally of 4 characters. Please ensure that the correct Book Number has been entered.
              </div>
            )}
          </div>
        )}

        <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '10px' }}>
          RITES LTD, CENTRAL REGION, BHILAI
        </div>
        
        <div style={{ position: 'absolute', right: '0', bottom: '0', textAlign: 'right', fontSize: '9px', fontWeight: 'bold', lineHeight: '1.2' }}>
          <div>निरंतरता पत्रक शामिल</div>
          <div>Contains 0 Continuation Sheets</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0px' }}>
        <table style={{ borderCollapse: 'collapse', border: '1px solid black', borderBottom: 'none', width: '70%', fontSize: '10px' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid black', borderBottom: 'none', padding: '4px', textAlign: 'center', width: '40%', verticalAlign: 'middle' }}>
                <div style={{ fontWeight: 'bold', fontSize: '9px' }}>प्रमाणपत्र पत्र सं. Certificate No.</div>
                <div style={{ fontWeight: 'bold', fontSize: '11px', marginTop: '2px', wordBreak: 'break-all' }}>
                  <EditableField value={displayCertificateNo || certificateNo} fieldName="certificateNo" style={{ textAlign: 'center', fontWeight: 'bold' }} />
                </div>
              </td>
              <td style={{ border: '1px solid black', borderBottom: 'none', padding: '4px', textAlign: 'center', width: '20%', verticalAlign: 'middle' }}>
                <div style={{ fontWeight: 'bold', fontSize: '9px' }}>दिनांक Date</div>
                <div style={{ fontWeight: 'bold', fontSize: '11px', marginTop: '2px' }}>
                  <EditableField value={certificateDate} fieldName="certificateDate" style={{ textAlign: 'center', fontWeight: 'bold' }} />
                </div>
              </td>
              <td style={{ border: '1px solid black', borderBottom: 'none', padding: '4px 8px', width: '40%', verticalAlign: 'middle', fontWeight: 'bold', fontSize: '9px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>प्रस्तावित किस्त सं.<br/>Offered Instt. No.</span>
                  <EditableField value={offeredInstNo} fieldName="offeredInstNo" style={{ fontSize: '11px', minWidth: '40px', display: 'inline-block' }} />
                </div>
                <div style={{ borderTop: '1px dotted gray', paddingTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>किस्त स. पारित Passed Instt. No.</span>
                  <EditableField value={passedInstNo} fieldName="passedInstNo" style={{ fontSize: '11px', minWidth: '40px', display: 'inline-block' }} />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* MAIN DATA TABLE */}
      <table style={tableStyle}>
        <tbody>
          <tr>
            <td colSpan="4" style={{ ...tdStyle, width: '45%' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9px' }}>ठेकेदार Contractor</div>
              <div style={{ marginTop: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <EditableField value={contractor} fieldName="contractor" type="textarea" style={{textTransform: 'uppercase', fontWeight: 'bold'}} />
              </div>
            </td>
            <td colSpan="5" style={{ ...tdStyle, width: '55%' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9px' }}>निरीक्षण का स्थान Place of Inspection</div>
              <div style={{ marginTop: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <EditableField value={placeOfInspection} fieldName="placeOfInspection" type="textarea" style={{textTransform: 'uppercase', fontWeight: 'bold'}} />
              </div>
            </td>
          </tr>

          <tr>
            <td colSpan="4" style={tdStyle}>
              <div style={{ fontWeight: 'bold', fontSize: '9px' }}>संविदा संदर्भ Contract References</div>
              <div style={{ marginTop: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                PO NO. - {poNo}
              </div>
              <div style={{ marginTop: '2px' }}>
                <EditableField value={contractRef} fieldName="contractRef" type="textarea" style={{fontWeight: 'bold'}} />
              </div>
            </td>
            <td colSpan="5" style={tdStyle}>
              <div style={{ fontWeight: 'bold', fontSize: '9px' }}>बिल अदायगी अधिकारी Bill Paying Officer</div>
              <div style={{ marginTop: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <EditableField value={billPayingOfficer} fieldName="billPayingOfficer" type="textarea" style={{textTransform: 'uppercase', fontWeight: 'bold'}} />
              </div>
            </td>
          </tr>

          <tr>
            <td colSpan="4" style={tdStyle}>
              <div style={{ fontWeight: 'bold', fontSize: '9px' }}>प्रेषिती Consignee</div>
              <div style={{ marginTop: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <EditableField value={consignee} fieldName="consignee" type="textarea" style={{textTransform: 'uppercase', fontWeight: 'bold'}} />
              </div>
            </td>
            <td colSpan="5" style={tdStyle}>
              <div style={{ fontWeight: 'bold', fontSize: '9px' }}>क्रय प्राधिकारी Purchasing Authority</div>
              <div style={{ marginTop: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <EditableField value={purchasingAuthority} fieldName="purchasingAuthority" type="textarea" style={{textTransform: 'uppercase', fontWeight: 'bold'}} />
              </div>
            </td>
          </tr>

          {/* QUANTITY HEADERS */}
          <tr style={{ backgroundColor: '#fff' }}>
            <th style={{...thStyle, width: '4%', fontSize: '9px'}}>मद सं<br/>Item No.</th>
            <th style={{...thStyle, width: '28%', fontSize: '9px'}}>भंडार का विवरण<br/>Description of stores</th>
            <th style={{...thStyle, width: '9%', fontSize: '9px'}}>आदेशित मात्रा<br/>Quantity on<br/>Order</th>
            <th style={{...thStyle, width: '13%', fontSize: '9px'}}>पहले प्रस्तावित<br/>संचयी मात्रा<br/>Cumulative Qty<br/>Offered Previously</th>
            <th style={{...thStyle, width: '9%', fontSize: '9px'}}>पहले स्वीकृत<br/>मात्रा<br/>Qty Prev<br/>Passed</th>
            <th style={{...thStyle, width: '9%', fontSize: '9px'}}>अब प्रस्तावित<br/>मात्रा<br/>Qty Now<br/>Offered</th>
            <th style={{...thStyle, width: '9%', fontSize: '9px'}}>अब स्वीकृत<br/>मात्रा<br/>Qty Now<br/>Passed</th>
            <th style={{...thStyle, width: '9%', fontSize: '9px'}}>अब अस्वीकृत<br/>मात्रा<br/>Qty Now<br/>Rejected</th>
            <th style={{...thStyle, width: '10%', fontSize: '9px'}}>बकाया मात्रा<br/>Qty still Due</th>
          </tr>
          <tr>
            <td style={tdCenterStyle}><strong>1</strong></td>
            <td style={tdCenterStyle}><strong>2</strong></td>
            <td style={tdCenterStyle}><strong>3</strong></td>
            <td style={tdCenterStyle}><strong>4</strong></td>
            <td style={tdCenterStyle}><strong>5</strong></td>
            <td style={tdCenterStyle}><strong>6</strong></td>
            <td style={tdCenterStyle}><strong>7</strong></td>
            <td style={tdCenterStyle}><strong>8</strong></td>
            <td style={tdCenterStyle}><strong>9</strong></td>
          </tr>

          {/* QUANTITY DATA (Rowspan for Col 1 and 2) */}
          <tr>
            <td rowSpan="2" style={{...tdCenterStyle, verticalAlign: 'top', paddingTop: '10px'}}>
              <EditableField value={itemNo} fieldName="itemNo" style={{fontWeight: 'bold'}} />
            </td>
            <td rowSpan="2" style={{...tdStyle, verticalAlign: 'top', paddingTop: '10px', fontWeight: 'bold'}}>
              <EditableField value={descriptionOfStores} fieldName="descriptionOfStores" type="textarea" style={{fontWeight: 'bold', textTransform: 'uppercase'}} />
            </td>
            <td style={{...tdCenterStyle, verticalAlign: 'top', paddingTop: '10px'}}>
              <EditableField value={qtyOnOrder} fieldName="qtyOnOrder" style={{fontWeight: 'bold'}} /><br/><br/><span style={{fontSize:'8px', fontWeight: 'bold'}}>NOS.</span>
            </td>
            <td style={{...tdCenterStyle, verticalAlign: 'top', paddingTop: '10px'}}>
              <EditableField value={qtyOfferedPreviously} fieldName="qtyOfferedPreviously" style={{fontWeight: 'bold'}} /><br/><br/><span style={{fontSize:'8px', fontWeight: 'bold'}}>NOS.</span>
            </td>
            <td style={{...tdCenterStyle, verticalAlign: 'top', paddingTop: '10px'}}>
              <EditableField value={qtyPassedPreviously} fieldName="qtyPassedPreviously" style={{fontWeight: 'bold'}} /><br/><br/><span style={{fontSize:'8px', fontWeight: 'bold'}}>NOS.</span>
            </td>
            <td style={{...tdCenterStyle, verticalAlign: 'top', paddingTop: '10px'}}>
              <EditableField value={qtyNowOffered} fieldName="qtyNowOffered" style={{fontWeight: 'bold'}} /><br/><br/><span style={{fontSize:'8px', fontWeight: 'bold'}}>NOS.</span>
            </td>
            <td style={{...tdCenterStyle, verticalAlign: 'top', paddingTop: '10px'}}>
              <EditableField value={qtyNowPassed} fieldName="qtyNowPassed" style={{fontWeight: 'bold'}} /><br/><br/><span style={{fontSize:'8px', fontWeight: 'bold'}}>NOS.</span>
            </td>
            <td style={{...tdCenterStyle, verticalAlign: 'top', paddingTop: '10px'}}>
              <EditableField value={qtyNowRejected} fieldName="qtyNowRejected" style={{fontWeight: 'bold'}} /><br/><br/><span style={{fontSize:'8px', fontWeight: 'bold'}}>NOS.</span>
            </td>
            <td style={{...tdCenterStyle, verticalAlign: 'top', paddingTop: '10px'}}>
              <EditableField value={qtyStillDue} fieldName="qtyStillDue" style={{fontWeight: 'bold'}} /><br/><br/><span style={{fontSize:'8px', fontWeight: 'bold'}}>NOS.</span>
            </td>
          </tr>

          {/* QUANTITY IN WORDS (Spans cols 3 to 9) */}
          <tr>
            <td colSpan="7" style={{ ...tdCenterStyle, padding: '10px', verticalAlign: 'top', minHeight: '60px' }}>
              <div style={{ border: '1px solid black', padding: '6px', textAlign: 'left', fontWeight: 'bold', textTransform: 'uppercase', minHeight: '40px', fontSize: '9px' }}>
                <EditableField
                  value={quantityNowPassedText}
                  fieldName="quantityNowPassedText"
                  placeholder="QUANTITY NOW PASSED: (In words and details...)"
                  type="textarea"
                  style={{fontWeight: 'bold', textTransform: 'uppercase'}}
                />
              </div>
            </td>
          </tr>

          {/* INSPECTION DETAILS */}
          <tr>
            <td colSpan="2" style={{...tdStyle}}>
              <div style={{ fontWeight: 'bold', fontSize: '9px' }}>जांच की गयी इकाइयों की सं.<br/>No. of items checked</div>
              <div style={{ marginTop: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <EditableField value={noOfItemsChecked} fieldName="noOfItemsChecked" />
              </div>
            </td>
            <td colSpan="2" style={{...tdStyle}}>
              <div style={{ fontWeight: 'bold', fontSize: '9px' }}>बुलावे की तारीख<br/>Date of call</div>
              <div style={{ marginTop: '2px', fontWeight: 'bold' }}>
                <EditableField value={dateOfCall} fieldName="dateOfCall" />
              </div>
            </td>
            <td colSpan="2" style={{...tdStyle}}>
              <div style={{ fontWeight: 'bold', fontSize: '9px' }}>दौरों की संख्या<br/>No. of Visits</div>
              <div style={{ marginTop: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <EditableField value={noOfVisits} fieldName="noOfVisits" />
              </div>
            </td>
            <td colSpan="2" style={{...tdStyle}}>
              <div style={{ fontWeight: 'bold', fontSize: '9px' }}>निरीक्षण की तारीखें<br/>Date(s) of Inspection</div>
              <div style={{ marginTop: '2px', fontWeight: 'bold' }}>
                <EditableField value={datesOfInspection} fieldName="datesOfInspection" />
              </div>
            </td>
            <td colSpan="1" style={{...tdStyle, textAlign: 'right'}}>
              <div style={{ fontWeight: 'bold', fontSize: '9px' }}>TR Rec. dt.</div>
              <div style={{ marginTop: '2px', fontStyle: 'italic', fontWeight: 'bold' }}>
                <EditableField value={trRecDate} fieldName="trRecDate" placeholder="" />
              </div>
            </td>
          </tr>

          {/* SEALING DETAILS */}
          <tr>
            <td colSpan="4" style={{...tdStyle, verticalAlign: 'top', height: '60px'}}>
              <div style={{ fontWeight: 'bold', fontSize: '9px' }}>सील बंदी/मोहर बंदी का स्वरूप और सील मोहर का स्थान<br/>Pattern of sealing/stamping & location of seal/stamp/sticker</div>
              <div style={{ marginTop: '2px', fontWeight: 'bold', fontSize: '9px' }}>
                <EditableField value={sealingPattern} fieldName="sealingPattern" type="textarea" />
              </div>
            </td>
            <td colSpan="2" style={{...tdStyle, verticalAlign: 'top'}}>
              <div style={{ fontWeight: 'bold', fontSize: '9px' }}>मुहर / स्टाम्प की प्रतिकृति<br/>Facsimile of seal/stamp/sticker</div>
              <div style={{ marginTop: '2px', fontStyle: 'italic' }}>
                <EditableField value={facsimileText} fieldName="facsimileText" type="textarea" />
              </div>
            </td>
            <td colSpan="3" style={{...tdStyle, verticalAlign: 'top', position: 'relative'}}>
              <div style={{ fontWeight: 'bold', fontSize: '9px' }}>निरीक्षण अभियंता<br/>Inspecting Engineer</div>
              <div style={{ position: 'absolute', bottom: '4px', right: '4px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'right', fontSize: '8px' }}>
                <EditableField value={inspectingEngineer} fieldName="inspectingEngineer" />
              </div>
            </td>
          </tr>

          {/* REASON FOR REJECTION */}
          <tr>
            <td colSpan="9" style={tdStyle}>
              <div style={{ fontWeight: 'bold', fontSize: '9px' }}>अस्वीकृति का कारण Reason of rejection</div>
              <div style={{ marginTop: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <EditableField value={reasonsForRejection} fieldName="reasonsForRejection" type="textarea" style={{fontWeight: 'bold', textTransform: 'uppercase'}} />
              </div>
            </td>
          </tr>

          {/* FOOTER */}
          <tr>
            <td colSpan="4" style={{ border: '1px solid black', padding: '4px', fontSize: '8px', lineHeight: '1.2' }}>
              सामग्री को शीघ्र अति शीघ्र भेजा जाना चाहिए। प्रेषण एवं सामग्री भेजने के लिए 30 दिन तक मान्य है। सभी प्रकार के पीएससी स्लीपर के लिए यह प्रमाणपत्र 90 दिनों तक मान्य रहेगा।
            </td>
            <td colSpan="5" style={{ border: '1px solid black', padding: '4px', fontSize: '8px', lineHeight: '1.2' }}>
              The material should be dispatched as early as possible. The certificate is valid for a period of 30 days for dispatch of stores. However, in the case of all types of PSC Sleepers, the certificate is valid for 90 days.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default SleeperFinalIc;
