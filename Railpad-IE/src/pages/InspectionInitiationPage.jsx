import React, { useState, useEffect } from 'react';
import { getStoredUser } from '../services/authService';
import { performTransitionAction } from '../services/workflowService';
import { fetchInspectionCallSummary } from '../services/inspectionService';
import ShiftDutyForm from '../components/ShiftDutyForm';
import Notification from '../components/Notification';
import { getBaseUrl, getDefaultHeaders } from '../services/apiConfig';
import CustomSelect from '../components/common/CustomSelect';
import './InspectionInitiationPage.css';

const RAIL_PAD_OPTIONS = [
  "6.00mm GRSP",
  "10.00mm GRSP",
  "6.20mm CGRSP",
  "10.00mm CGRSP",
  "6.00mm NCRGRSP",
  "10.00mm NCRGRSP"
];

const InspectionInitiationPage = ({ call, onProceed, onBack, onUpdateCall }) => {
  const [loading, setLoading] = useState(true);
  const [fetchedDetails, setFetchedDetails] = useState(null);
  const [sectionAStatus, setSectionAStatus] = useState('pending'); // 'pending', 'approved', 'rejected'
  const [sectionBStatus, setSectionBStatus] = useState('pending');
  const [isSectionBVisible, setIsSectionBVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'info' });
  const [showShiftModal, setShowShiftModal] = useState(false);  // Controls ShiftDutyForm popup

  const [sectionAExpanded, setSectionAExpanded] = useState(true);
  const [sectionBExpanded, setSectionBExpanded] = useState(false);

  const [formState, setFormState] = useState({
    railPadType: '6.00mm GRSP',
    callQty: call?.callQty || '',
    qtyUnit: 'Nos',
    remarks: ''
  });

  useEffect(() => {
    const loadSummary = async () => {
      if (!call?.requestId) return;
      try {
        setLoading(true);
        const data = await fetchInspectionCallSummary(call.requestId);
        setFetchedDetails(data);
        
        // Pre-fill some form state if available in data
        if (data) {
          setFormState(prev => ({
            ...prev,
            railPadType: data.ercType || prev.railPadType,
            callQty: data.totalOfferedQty || prev.callQty,   // RailPoSummaryDto uses totalOfferedQty
            qtyUnit: data.unit || prev.qtyUnit
          }));

          // Update parent call object for header display
          if (onUpdateCall) {
            onUpdateCall({
              ...data,
              rlyPoSrNo: data.rlyPoNoSerial, // Map summary field to header field
              railPadType: data.ercType   // Map summary field to header field
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch call summary:', error);
        setNotification({ message: 'Failed to load call details from server', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [call?.requestId]);

  if (!call) {
    return (
      <div className="initiation-page-container">
        <div className="loading-state">
          <h3>No inspection call selected</h3>
          <button className="back-btn" onClick={onBack}>BACK TO DASHBOARD</button>
        </div>
      </div>
    );
  }

  const user = getStoredUser();

  const handleSectionAApprove = () => {
    setSectionAStatus('approved');
    setIsSectionBVisible(true);
    setSectionBExpanded(true);
    setSectionAExpanded(false);
    setNotification({ message: 'PO Information verified', type: 'success' });
  };

  const handleSectionAReject = () => {
    setSectionAStatus('rejected');
    setNotification({ message: 'PO Information rejected', type: 'error' });
  };

  const handleSectionBApprove = () => {
    setSectionBStatus('approved');
    setNotification({ message: 'Inspection Call details verified', type: 'success' });
  };

  const handleSectionBReject = () => {
    setSectionBStatus('rejected');
    setNotification({ message: 'Inspection Call details rejected', type: 'error' });
  };

  // Section A / B OK → local state only, no API call
  // (sectionAStatus and sectionBStatus are already set in the handlers below)

  /**
   * Opens the ShiftDutyForm popup.
   * Called when the IE officer clicks "OPEN & VERIFY FORM".
   * Both sections must be approved first.
   */
  const handleOpenVerifyForm = () => {
    if (sectionAStatus !== 'approved' || sectionBStatus !== 'approved') {
      setNotification({ message: 'Please verify both sections first', type: 'warning' });
      return;
    }
    setShowShiftModal(true);
  };

  /**
   * Called when the ShiftDutyForm is submitted.
   * 1. Saves Section A + B data + shift details to backend.
   * 2. Fires PO_VERIFICATION workflow transition.
   * 3. On success → navigate forward.
   */
  const handleVerifyAndSubmit = async (shiftData) => {
    setShowShiftModal(false);
    setIsSubmitting(true);
    const user = getStoredUser();

    try {
      // ---- Step 1: Save Section A & B + shift data ----
      const verificationPayload = {
        callNo: call.requestId,

        // Section A
        rlyPoNo:            fetchedDetails?.rlyPoNo,
        poNo:               fetchedDetails?.poNo,
        poDate:             fetchedDetails?.poDate,
        poQty:              fetchedDetails?.poQty,
        poSrQty:            fetchedDetails?.poSrQty,
        vendorName:         fetchedDetails?.vendorName,
        vendorCode:         fetchedDetails?.vendorCode,
        maNo:               fetchedDetails?.maNo,
        maDate:             fetchedDetails?.maDate,
        purchasingAuthority: fetchedDetails?.purchasingAuthority,
        billPayingOfficer:  fetchedDetails?.billPayingOfficer,
        sectionAStatus,

        // Section B
        rlyPoNoSerial:      fetchedDetails?.rlyPoNoSerial,
        itemDesc:           fetchedDetails?.itemDesc,
        ercType:            formState.railPadType,
        unit:               formState.qtyUnit,
        consignee:          fetchedDetails?.consignee,
        origDp:             fetchedDetails?.origDp,
        extDp:              fetchedDetails?.extDp,
        callQty:            String(formState.callQty),
        qtyUnit:            formState.qtyUnit,
        placeOfInspection:  fetchedDetails?.placeOfInspection,
        remarks:            formState.remarks,
        sectionBStatus,

        // Shift details from the modal
        shift:              shiftData.shift,
        company:            shiftData.company,
        castingDate:        shiftData.date,
        productionUnit:     shiftData.unit,

        verifiedBy:         user?.userId
      };

      const saveResp = await fetch(
        `${getBaseUrl()}/rail-initiation-verification/submit`,
        {
          method: 'POST',
          headers: getDefaultHeaders(user?.token),
          body: JSON.stringify(verificationPayload)
        }
      );
      const saveData = await saveResp.json();

      if (saveData.responseStatus?.statusCode !== 0) {
        setNotification({ message: saveData.responseStatus?.message || 'Failed to save verification data', type: 'error' });
        setIsSubmitting(false);
        return;
      }

      // ---- Step 2: Trigger PO_VERIFICATION workflow transition ----
      const poVerifyData = {
        workflowTransitionId: call.workflowTransitionId,
        requestId:            call.requestId,
        action:               'PO_VERIFICATION',
        remarks:              'PO and Call details verified by IE',
        actionBy:             user?.userId
      };

      const poResult = await performTransitionAction(poVerifyData);

      if (poResult.responseStatus?.statusCode === 0) {
        setNotification({ message: 'Verification saved and PO verified successfully!', type: 'success' });
        setTimeout(() => onProceed(shiftData), 1500);
      } else {
        // Data saved but transition failed — still proceed with a warning
        setNotification({
          message: 'Data saved. Workflow transition: ' + (poResult.responseStatus?.message || 'pending'),
          type: 'warning'
        });
        setTimeout(() => onProceed(shiftData), 2000);
      }
    } catch (error) {
      console.error('Error during verification submit:', error);
      setNotification({ message: 'Error: ' + error.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const DataSkeleton = ({ count = 8 }) => (
    <div className="data-grid-2col">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="data-item">
          <div className="skeleton-box skeleton-label"></div>
          <div className="skeleton-box skeleton-value"></div>
        </div>
      ))}
    </div>
  );

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="initiation-page-container">
      <Notification 
        message={notification.message}
        type={notification.type}
        autoClose={true}
        onClose={() => setNotification({ ...notification, message: '' })}
      />

      <div className="initiation-header">
        <div className="breadcrumb">
          <span onClick={onBack} className="breadcrumb-link">Dashboard</span>
          <span className="separator">/</span>
          <span className="current">Inspection Initiation</span>
        </div>
        <div className="header-content">
          <h1>Inspection Initiation for {call.requestId}</h1>
          <div className="datetime">{new Date().toLocaleString()}</div>
        </div>
      </div>

      <div className="sections-container">
        {/* SECTION A: PO Information */}
        <div className={`initiation-card ${sectionAStatus === 'rejected' ? 'rejected-border' : ''}`}>
          <div className="card-header" onClick={() => setSectionAExpanded(!sectionAExpanded)}>
            <div className="header-left">
              <span className={`status-dot ${sectionAStatus}`}></span>
              <h3>SECTION A: Main PO Information - {loading ? <div className="skeleton-box skeleton-header-id"></div> : (call.poNo || 'N/A')}</h3>
            </div>
            <button className="expand-btn">{sectionAExpanded ? '−' : '+'}</button>
          </div>
          
          {sectionAExpanded && (
            <div className="card-body">
              {loading ? (
                <DataSkeleton count={8} />
              ) : (
                <div className="data-grid-2col">
                  <div className="data-item">
                    <label>RLY + PO_NO</label>
                    <div className="value-mock">{fetchedDetails?.rlyPoNo || 'N/A'}</div>
                  </div>
                  <div className="data-item">
                    <label>PO DATE</label>
                    <div className="value-mock">{fetchedDetails?.poDate || 'N/A'}</div>
                    <span className="date-check">✓ PO Date ≤ Today</span>
                  </div>
                  <div className="data-item">
                    <label>PO_QTY</label>
                    <div className="value-mock">{fetchedDetails?.poQty || 'N/A'}</div>
                  </div>
                   <div className="data-item">
                    <label>VENDOR_NAME</label>
                    <div className="value-mock">{fetchedDetails?.vendorName || 'N/A'}</div>
                  </div>
                  <div className="data-item">
                    <label>MA_NO</label>
                    <div className="value-mock">{fetchedDetails?.maNo || 'N/A'}</div>
                  </div>
                  <div className="data-item">
                    <label>MA_DATE</label>
                    <div className="value-mock">{fetchedDetails?.maDate || 'N/A'}</div>
                  </div>
                  <div className="data-item">
                    <label>PURCHASING AUTHORITY</label>
                    <div className="value-mock">{fetchedDetails?.purchasingAuthority || 'N/A'}</div>
                  </div>
                  <div className="data-item">
                    <label>BILL PAYING OFFICER</label>
                    <div className="value-mock">{fetchedDetails?.billPayingOfficer || 'N/A'}</div>
                  </div>
                </div>
              )}

              <div className="section-status-actions">
                <button 
                  className={`btn-status-not-ok ${sectionAStatus === 'rejected' ? 'active' : ''}`}
                  onClick={handleSectionAReject}
                >
                  Not OK
                </button>
                <button 
                  className={`btn-status-ok ${sectionAStatus === 'approved' ? 'active' : ''}`}
                  onClick={handleSectionAApprove}
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SECTION B: Inspection Call Details */}
        {isSectionBVisible && (
          <div className={`initiation-card ${sectionBStatus === 'rejected' ? 'rejected-border' : ''}`}>
            <div className="card-header" onClick={() => setSectionBExpanded(!sectionBExpanded)}>
              <div className="header-left">
                <span className={`status-dot ${sectionBStatus}`}></span>
                <h3>SECTION B: Inspection Call Details - {loading ? <div className="skeleton-box skeleton-header-id"></div> : call.requestId}</h3>
              </div>
              <button className="expand-btn">{sectionBExpanded ? '−' : '+'}</button>
            </div>

            {sectionBExpanded && (
              <div className="card-body">
                {loading ? (
                  <DataSkeleton count={10} />
                ) : (
                  <div className="data-grid-2col">
                    <div className="data-item">
                      <label>INSPECTION CALL NO.</label>
                      <div className="value-mock">{call.requestId}</div>
                    </div>
                    <div className="data-item">
                      <label>INSPECTION CALL DATE</label>
                      <div className="value-mock">{formatDate(call.createdDate)}</div>
                    </div>
                    <div className="data-item">
                      <label>INSPECTION DESIRED DATE</label>
                      <div className="value-mock">{formatDate(call.desiredDate || call.createdDate)}</div>
                    </div>
                    <div className="data-item">
                      <label>RLY + PO_NO + PO_SR</label>
                      <div className="value-mock">{fetchedDetails?.rlyPoNoSerial || `${call.poNo} / ${call.poSr || '001'}`}</div>
                    </div>
                    <div className="data-item full-width">
                      <label>ITEM DESC</label>
                      <div className="value-mock text-wrap">{fetchedDetails?.itemDesc || call.itemDesc || 'Rail Pad for 60 Kg UIC/ 52 Kg Rail Section'}</div>
                    </div>
                    <div className="data-item">
                      <label>PRODUCT TYPE</label>
                      <div className="value-mock">Rail Pad</div>
                    </div>
                    <div className="data-item">
                      <label>Type of Rail Pad</label>
                      <CustomSelect
                        options={RAIL_PAD_OPTIONS}
                        value={formState.railPadType}
                        onChange={(val) => setFormState({...formState, railPadType: val})}
                      />
                    </div>
                    <div className="data-item">
                      <label>PO_SR_QTY + UNIT</label>
                      <div className="value-mock">{fetchedDetails?.poSrQty || call.poSrQty || 'N/A'} {fetchedDetails?.unit || 'Nos.'}</div>
                    </div>
                    <div className="data-item">
                      <label>CONSIGNEE</label>
                      <div className="value-mock">{fetchedDetails?.consignee || call.consignee || 'N/A'}</div>
                    </div>
                    <div className="data-item">
                      <label>ORIG_DP</label>
                      <div className="value-mock">{fetchedDetails?.origDp || formatDate(call.origDp)}</div>
                    </div>
                    <div className="data-item">
                      <label>EXT_DP</label>
                      <div className="value-mock">{fetchedDetails?.extDp || formatDate(call.extDp)}</div>
                    </div>
                    <div className="data-item">
                      <label>STAGE OF INSPECTION</label>
                      <div className="value-mock">Final</div>
                    </div>
                    <div className="data-item">
                      <label>Call Qty (Nos/Set/RMT)</label>
                      <div className="qty-input-group">
                        <input 
                          type="text"
                          className="input-mock qty-val"
                          value={formState.callQty}
                          onChange={(e) => setFormState({...formState, callQty: e.target.value})}
                        />
                        <select 
                          className="input-mock qty-unit"
                          value={formState.qtyUnit}
                          onChange={(e) => setFormState({...formState, qtyUnit: e.target.value})}
                        >
                          <option value="Nos">Nos</option>
                          <option value="Set">Set</option>
                          <option value="RMT">RMT</option>
                        </select>
                      </div>
                    </div>
                    <div className="data-item">
                      <label>PLACE OF INSPECTION</label>
                      <div className="value-mock">{fetchedDetails?.placeOfInspection || call.placeOfInspection || call.plantId}</div>
                    </div>
                    <div className="data-item full-width">
                      <label>REMARKS</label>
                      <textarea 
                        className="input-mock remarks-area"
                        value={formState.remarks}
                        onChange={(e) => setFormState({...formState, remarks: e.target.value})}
                        placeholder="Enter inspection remarks..."
                      />
                    </div>
                  </div>
                )}

                <div className="section-status-actions">
                  <button 
                    className={`btn-status-not-ok ${sectionBStatus === 'rejected' ? 'active' : ''}`}
                    onClick={handleSectionBReject}
                  >
                    Not OK
                  </button>
                  <button 
                    className={`btn-status-ok ${sectionBStatus === 'approved' ? 'active' : ''}`}
                    onClick={handleSectionBApprove}
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="page-footer">
        <button className="back-btn" onClick={onBack}>BACK TO DASHBOARD</button>
        <div className="right-buttons">
          <button className="withheld-btn">WITHHELD CALL</button>
          <button className="cancel-btn">CANCEL CALL</button>
          <button
            className="initiate-btn"
            onClick={handleOpenVerifyForm}
            disabled={isSubmitting || sectionBStatus !== 'approved'}
          >
            {isSubmitting ? 'VERIFYING...' : 'OPEN & VERIFY FORM'}
          </button>
        </div>
      </div>

      {/* Shift Details Modal — opens when IE clicks "OPEN & VERIFY FORM" */}
      {showShiftModal && (
        <ShiftDutyForm
          hideCompanyAndUnit={true}
          initialData={{
            company: fetchedDetails?.vendorName || '',
            unit: fetchedDetails?.placeOfInspection || call?.plantId || ''
          }}
          onSubmit={handleVerifyAndSubmit}
          onCancel={() => setShowShiftModal(false)}
        />
      )}
    </div>
  );
};

export default InspectionInitiationPage;
