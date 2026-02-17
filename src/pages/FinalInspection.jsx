import React, { useState } from 'react';
import { MOCK_PO_DATA } from '../data/mockData';
import { formatDate } from '../utils/helpers';

const FinalInspection = ({ call, onBack }) => {
  const [sectionAExpanded, setSectionAExpanded] = useState(true);
  const [sectionBExpanded, setSectionBExpanded] = useState(false);
  const [acceptedQty, setAcceptedQty] = useState('');
  const [rejectedQty, setRejectedQty] = useState('');
  const [remarks, setRemarks] = useState('');
  const [sectionAVerified, setSectionAVerified] = useState(false);
  const [sectionBVerified, setSectionBVerified] = useState(false);

  // Static header data (auto-fetched)
  const poData = (MOCK_PO_DATA && call?.po_no && MOCK_PO_DATA[call.po_no]) || {};

  /* Auto-expand next section when current section is verified */
  const handleSectionAVerify = (checked) => {
    setSectionAVerified(checked);
    if (checked) {
      setSectionBExpanded(true);
    }
  };

  return (
    <div>
      <div className="breadcrumb">
        <div className="breadcrumb-item" onClick={onBack} style={{ cursor: 'pointer' }}>Landing Page</div>
        <span className="breadcrumb-separator">/</span>
        <div className="breadcrumb-item" onClick={onBack} style={{ cursor: 'pointer' }}>Inspection Initiation</div>
        <span className="breadcrumb-separator">/</span>
        <div className="breadcrumb-item breadcrumb-active">Final Inspection</div>
      </div>

      <h1>Final Inspection for {call.call_no}</h1>

      {/* Header with Static Data — same as Raw Material and Process */}
      <div className="card" style={{ background: 'var(--color-gray-100)', marginBottom: 'var(--space-24)' }}>
        <div className="card-header">
          <h3 className="card-title">Inspection Details (Static Data)</h3>
          <p className="card-subtitle">Auto-fetched from PO/Sub PO information</p>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">PO Number</label>
            <input type="text" className="form-input" value={poData.sub_po_no || poData.po_no || ''} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">PO  Date</label>
            <input type="text" className="form-input" value={poData.sub_po_date ? formatDate(poData.sub_po_date) : (poData.po_date ? formatDate(poData.po_date) : '')} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Contractor Name</label>
            <input type="text" className="form-input" value={poData.contractor || ''} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Manufacturer</label>
            <input type="text" className="form-input" value={poData.manufacturer || ''} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Place of Inspection</label>
            <input type="text" className="form-input" value={poData.place_of_inspection || ''} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Stage of Inspection</label>
            <input type="text" className="form-input" value="Final Inspection" disabled />
          </div>
        </div>
      </div>

      {/* SECTION A: Final Inspection Details */}
      <div className="card" style={{ marginTop: 'var(--space-16)' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">SECTION A: Final Inspection Details</h3>
          <button type="button" className="btn btn-secondary" onClick={() => setSectionAExpanded(!sectionAExpanded)}>
            {sectionAExpanded ? '-' : '+'}
          </button>
        </div>
        {sectionAExpanded && (
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Inspection Call No.</label>
              <input className="form-input" type="text" value={call.call_no} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Call Qty</label>
              <input className="form-input" type="text" value={call.call_qty} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Accepted Qty</label>
              <input className="form-input" type="number" value={acceptedQty} onChange={(e) => setAcceptedQty(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Rejected Qty</label>
              <input className="form-input" type="number" value={rejectedQty} onChange={(e) => setRejectedQty(e.target.value)} />
            </div>

            {/* Section A Verification */}
            <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: 'var(--space-16)', padding: 'var(--space-16)', background: 'var(--color-gray-100)', borderRadius: 'var(--border-radius)', border: '1px solid var(--color-gray-300)' }}>
              <div className="checkbox-item">
                <input id="final-section-a-verify" type="checkbox" checked={sectionAVerified} onChange={(e) => handleSectionAVerify(e.target.checked)} />
                <label htmlFor="final-section-a-verify" style={{ fontWeight: 'var(--font-weight-medium)', marginLeft: '8px' }}>
                  I verify that Section A details are correct
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION B: Disposition & Remarks */}
      <div className="card" style={{ marginTop: 'var(--space-16)' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">SECTION B: Disposition & Remarks</h3>
          <button type="button" className="btn btn-secondary" onClick={() => setSectionBExpanded(!sectionBExpanded)}>
            {sectionBExpanded ? '-' : '+'}
          </button>
        </div>
        {sectionBExpanded && (
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Remarks</label>
              <textarea className="form-textarea" rows="3" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>

            {/* Section B Verification */}
            <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: 'var(--space-16)', padding: 'var(--space-16)', background: 'var(--color-gray-100)', borderRadius: 'var(--border-radius)', border: '1px solid var(--color-gray-300)' }}>
              <div className="checkbox-item">
                <input id="final-section-b-verify" type="checkbox" checked={sectionBVerified} onChange={(e) => setSectionBVerified(e.target.checked)} />
                <label htmlFor="final-section-b-verify" style={{ fontWeight: 'var(--font-weight-medium)', marginLeft: '8px' }}>
                  I verify that Section B details are correct
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-16)', marginTop: 'var(--space-24)' }}>
        <button className="btn btn-secondary" onClick={onBack} style={{ minHeight: 48 }}>Back</button>
        <button className="btn btn-primary" disabled={!(sectionAVerified && sectionBVerified)} style={{ minHeight: 48 }}>
          {sectionAVerified && sectionBVerified ? 'Submit Final Inspection' : 'Verify Both Sections to Submit'}
        </button>
      </div>
    </div>
  );
};

export default FinalInspection;
