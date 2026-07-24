import React from "react";

const RailpadProcessIc = ({ data = {}, isEditing = false, isBusy = false, isViewOnly = false, onFieldChange = () => { }, onVerifyBookSet, bookSetValidation }) => {

  const {
    certificateNo = "",
    certificateDate = "",
    offeredInstNo = "", // Used for Installment in Process IC
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
    qtyNowOffered = "", // Used for Total Processed Qty
    qtyNowPassed = "",  // Used for Accepted Qty
    qtyNowRejected = "",// Used for Rejected Qty
    quantityNowPassedText = "", // Used for Remark
    reasonsForRejection = "Short moulding, bubble/blister, uneven edges, improper clean-cut side, surface roughness, surface blemish & pit.",
    dateOfCall = "",
    noOfVisits = "", // Man-days
    datesOfInspection = "",
    sealingPattern = "Marking:\n1. Manufacturer Initial: MG\n2. First 2 digit for the month and last 2 digit for year: 05-26, 06-26\n3. Drawing Number: RT-8747",
    inspectingEngineer = "",
    bookNo = "",
    setNo = "",
    contractRef = "",
  } = data;

  const allowedFields = [
    "bookNo", "setNo",
    "certificateNo", "certificateDate", "offeredInstNo", "contractor", "manufacturer",
    "contractRef", "billPayingOfficer", "consignee", "consigneeManufacturer", "purchasingAuthority", 
    "description", "drgNo", "specNo", "qapNo", "typeOfInspection", "chpClNo", "lotNo",
    "qtyNowOffered", "qtyNowPassed", "qtyNowRejected", "quantityNowPassedText", "reasonsForRejection",
    "dateOfCall", "noOfVisits", "datesOfInspection", "sealingPattern", "inspectingEngineer"
  ];

  const EditableField = ({ value, fieldName, placeholder = "", style = {}, type = "text", disabled = false }) => {
    const canEdit = isEditing && (isViewOnly ? ["bookNo", "setNo"].includes(fieldName) : allowedFields.includes(fieldName));
    if (canEdit) {
      if (type === "textarea") {
        return (
          <textarea
            value={value || ""}
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
            ...style
          }}
          disabled={disabled || isBusy}
        />
      );
    }

    if (type === "textarea") {
      return <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', ...style }}>{value}</div>;
    }
    return <span style={{ wordBreak: 'break-word', ...style }}>{value}</span>;
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    border: '1px solid black',
    backgroundColor: '#fff',
    color: '#000',
    fontSize: '10.5px',
    fontFamily: '"Times New Roman", Times, serif', // Looks like Times New Roman in the screenshot
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
    <div style={{
      width: '800px',
      margin: '0 auto',
      padding: '20px',
      background: 'white',
      color: 'black',
      fontFamily: '"Times New Roman", Times, serif',
      boxSizing: 'border-box',
      border: '1px solid #cbd5e1',
      fontSize: '10.5px',
    }}>
      
      {/* Top spacing to match RITES letterhead margin exactly */}
      <div style={{ height: '150px' }}></div>

      {/* Book & Set Number Container */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '30px', marginBottom: '15px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', border: '1px solid black', width: '180px', background: 'white' }}>
            <div style={{ flex: 1, borderRight: '1px solid black', display: 'flex', flexDirection: 'column' }}>
              <div style={{ borderBottom: '1px solid black', padding: '3px', fontWeight: 'bold', textAlign: 'center', fontSize: '9px' }}>
                बुक सं Book No.
              </div>
              <div style={{ padding: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '22px' }}>
                <EditableField value={bookNo} fieldName="bookNo" style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }} />
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ borderBottom: '1px solid black', padding: '3px', fontWeight: 'bold', textAlign: 'center', fontSize: '9px' }}>
                सेट सं Set No.
              </div>
              <div style={{ padding: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '22px' }}>
                <EditableField value={setNo} fieldName="setNo" style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }} />
              </div>
            </div>
          </div>
          {isEditing && (
            <div style={{ marginTop: '4px', display: 'flex', gap: '6px', alignItems: 'center' }}>
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
          )}
        </div>
      </div>

      {/* RITES BHILAI HEADLINE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', paddingBottom: '6px', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}></div>
        <div style={{ flex: 3, textAlign: 'center', fontWeight: 'bold', fontSize: '13px', letterSpacing: '0.2px', textTransform: 'uppercase' }}>
          RITES LTD, CENTRAL REGION, BHILAI
        </div>
        <div style={{ flex: 1, textAlign: 'right', lineHeight: '1.1', fontSize: '8.5px', fontWeight: 'bold' }}>
        </div>
      </div>

      {/* Certificate Info Row — 75% width aligned right */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0px', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 2.7fr', border: '1px solid black', borderBottom: 'none', width: '75%', fontSize: '10px' }}>
          {/* Col 1: Certificate No */}
          <div style={{ borderRight: '1px solid black', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '8px', textTransform: 'uppercase' }}>प्रमाणपत्र पत्र सं. Certificate No.</div>
            <div style={{ fontWeight: 'bold', fontSize: '9.5px', marginTop: '4px', wordBreak: 'break-all', lineHeight: '1.2' }}>
              <EditableField value={certificateNo} fieldName="certificateNo" style={{ textAlign: 'center', fontWeight: 'bold' }} />
            </div>
          </div>
          {/* Col 2: Date */}
          <div style={{ borderRight: '1px solid black', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '8px', textTransform: 'uppercase' }}>दिनांक Date</div>
            <div style={{ fontWeight: 'bold', fontSize: '9.5px', marginTop: '4px' }}>
              <EditableField value={certificateDate} fieldName="certificateDate" style={{ textAlign: 'center', fontWeight: 'bold' }} />
            </div>
          </div>
          {/* Col 3: Installment */}
          <div style={{ padding: '4px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left', lineHeight: '1.1', fontSize: '9px', fontWeight: 'bold' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div>किस्त सं.</div>
                <div>Installment No.</div>
              </div>
              <div style={{ fontSize: '11px', paddingRight: '32px' }}>
                <EditableField value={offeredInstNo} fieldName="offeredInstNo" style={{ textAlign: 'right', fontWeight: 'bold' }} placeholder="e.g. 1st" />
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
                <EditableField value={contractor} fieldName="contractor" type="textarea" />
              </div>
            </td>
            <td colSpan="1" style={{ ...tdStyle, width: '50%' }}>
              <div style={{ fontWeight: 'bold' }}>Manufacturer:</div>
              <div style={{ textTransform: 'uppercase', marginTop: '2px' }}>
                <EditableField value={contractor} fieldName="manufacturer" type="textarea" />
              </div>
            </td>
          </tr>

          {/* Contract Ref & Bill Paying Officer Row */}
          <tr>
            <td colSpan="2" style={{ ...tdStyle, width: '50%' }}>
              <div style={{ fontWeight: 'bold' }}>Contract Ref.</div>
              <div style={{ marginTop: '2px' }}>
                <EditableField value={contractRef} fieldName="contractRef" type="textarea" />
              </div>
            </td>
            <td colSpan="1" style={{ ...tdStyle, width: '50%' }}>
              <div style={{ fontWeight: 'bold' }}>Bill Paying Officer:</div>
              <div style={{ textTransform: 'uppercase', marginTop: '2px' }}>
                <EditableField value={billPayingOfficer} fieldName="billPayingOfficer" type="textarea" />
              </div>
            </td>
          </tr>

          {/* Consignee & Purchasing Authority Row */}
          <tr>
            <td colSpan="2" style={{ ...tdStyle, width: '50%' }}>
              <div style={{ fontWeight: 'bold' }}>Consignee (Railway):</div>
              <div style={{ textTransform: 'uppercase', marginTop: '2px' }}>
                <EditableField value={consignee} fieldName="consignee" type="textarea" />
              </div>
              <div style={{ fontWeight: 'bold', marginTop: '8px' }}>Consignee (Manufacturer of finished Product):</div>
              <div style={{ textTransform: 'uppercase', marginTop: '2px' }}>
                <EditableField value={contractor} fieldName="consigneeManufacturer" type="textarea" />
              </div>
            </td>
            <td colSpan="1" style={{ ...tdStyle, width: '50%' }}>
              <div style={{ fontWeight: 'bold' }}>Purchasing Authority (Railway):</div>
              <div style={{ textTransform: 'uppercase', marginTop: '2px' }}>
                <EditableField value={purchasingAuthority} fieldName="purchasingAuthority" type="textarea" />
              </div>
            </td>
          </tr>

          {/* Description & Drg/Spec/QAP Row — flex for true 50/50 split */}
          <tr>
            <td colSpan="3" style={{ padding: 0, border: '1px solid black' }}>
              <div style={{ display: 'flex', width: '100%' }}>
                {/* Left: Description */}
                <div style={{ width: '50%', padding: '4px 6px', borderRight: '1px solid black', boxSizing: 'border-box' }}>
                  <div style={{ fontWeight: 'bold' }}>Description:</div>
                  <div style={{ marginTop: '2px', textAlign: 'justify' }}>
                    <EditableField value={description} fieldName="description" type="textarea" />
                  </div>
                </div>
                {/* Right: Drg/Spec | QAP split 40/60 */}
                <div style={{ width: '50%', display: 'flex', boxSizing: 'border-box' }}>
                  <div style={{ width: '40%', padding: '4px 6px', borderRight: '1px solid black', boxSizing: 'border-box' }}>
                    <div style={{ fontWeight: 'bold' }}>Drg. No.:</div>
                    <div><EditableField value={drgNo} fieldName="drgNo" /></div>
                    <div style={{ fontWeight: 'bold', marginTop: '6px' }}>Spec. No.</div>
                    <div><EditableField value={specNo} fieldName="specNo" /></div>
                  </div>
                  <div style={{ width: '60%', padding: '4px 6px', boxSizing: 'border-box' }}>
                    <div style={{ fontWeight: 'bold' }}>QAP No.:</div>
                    <div style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                      <EditableField value={qapNo} fieldName="qapNo" />
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
              <EditableField value={typeOfInspection} fieldName="typeOfInspection" type="textarea" style={{ display: 'inline' }} />
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
                      <EditableField value={chpClNo} fieldName="chpClNo" type="textarea" />
                    </td>
                    <td style={{ ...tdStyle, borderBottom: 'none' }}>
                      <EditableField value={lotNo} fieldName="lotNo" style={{ textAlign: 'center' }} />
                    </td>
                    <td style={{ ...tdStyle, borderBottom: 'none', textAlign: 'center' }}>
                      <EditableField value={qtyNowOffered} fieldName="qtyNowOffered" style={{ textAlign: 'center' }} />
                    </td>
                    <td style={{ ...tdStyle, borderBottom: 'none', textAlign: 'center' }}>
                      <EditableField value={qtyNowPassed} fieldName="qtyNowPassed" style={{ textAlign: 'center' }} />
                    </td>
                    <td style={{ ...tdStyle, borderRight: 'none', borderBottom: 'none', textAlign: 'center' }}>
                      <EditableField value={qtyNowRejected} fieldName="qtyNowRejected" style={{ textAlign: 'center' }} />
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
                <EditableField value={quantityNowPassedText} fieldName="quantityNowPassedText" type="textarea" style={{ display: 'inline' }} />
              </div>
              <div style={{ marginTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}># Reason of Rejection: </span>
                <EditableField value={reasonsForRejection} fieldName="reasonsForRejection" type="textarea" style={{ display: 'inline' }} />
              </div>
            </td>
          </tr>

          {/* Date, Man-days, Date of inspection */}
          <tr>
            <td style={{ ...tdStyle, textAlign: 'center', width: '33%' }}>
              <div style={{ fontWeight: 'bold' }}>Date of call</div>
              <div style={{ marginTop: '4px' }}>
                <EditableField value={dateOfCall} fieldName="dateOfCall" style={{ textAlign: 'center' }} />
              </div>
            </td>
            <td style={{ ...tdStyle, textAlign: 'center', width: '33%' }}>
              <div style={{ fontWeight: 'bold' }}>Total No. of Man-days engaged</div>
              <div style={{ marginTop: '4px' }}>
                <EditableField value={noOfVisits} fieldName="noOfVisits" style={{ textAlign: 'center' }} />
              </div>
            </td>
            <td style={{ ...tdStyle, textAlign: 'center', width: '34%' }}>
              <div style={{ fontWeight: 'bold' }}>Date of inspection</div>
              <div style={{ marginTop: '4px' }}>
                <EditableField value={datesOfInspection} fieldName="datesOfInspection" style={{ textAlign: 'center' }} />
              </div>
            </td>
          </tr>

          {/* Sealing & Inspecting Engineer */}
          <tr>
            <td colSpan="2" style={{ ...tdStyle, verticalAlign: 'top', width: '66%' }}>
              <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Pattern of sealing/stamping or identification:</div>
              <div style={{ marginTop: '4px' }}>
                <EditableField value={sealingPattern} fieldName="sealingPattern" type="textarea" />
              </div>
            </td>
            <td colSpan="1" style={{ ...tdStyle, verticalAlign: 'top', textAlign: 'center', width: '34%' }}>
              <div style={{ fontWeight: 'bold' }}>Inspecting Engineer</div>
              <div style={{ marginTop: '40px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <EditableField value={inspectingEngineer} fieldName="inspectingEngineer" style={{ textAlign: 'center', fontWeight: 'bold' }} />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer Text */}
      <div style={{ marginTop: '16px', textAlign: 'center', fontWeight: 'bold', fontSize: '10.5px' }}>
        <div>It is certified that the process inspection of the rail pads has been carried out satisfactorily and the material is cleared for final inspection.</div>
        <div style={{ marginTop: '4px' }}>Distribution: Manufacturer Office Copy, Purchaser (Railway), RITES Bill Copy, RITES for Final IC Copy</div>
      </div>

    </div>
  );
};

export default RailpadProcessIc;
