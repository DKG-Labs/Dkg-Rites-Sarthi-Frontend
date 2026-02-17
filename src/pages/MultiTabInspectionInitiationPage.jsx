import React, { useState, useMemo } from 'react';
import InspectionInitiationFormContent from '../components/InspectionInitiationFormContent';
import { saveInspectionInitiation } from '../services/vendorInspectionService';
import { getStoredUser } from '../services/authService';
import { performTransitionAction } from '../services/workflowService';
import '../styles/inspectionInitiationPage.css';

// Reason options for withheld/cancel call
const CALL_ACTION_REASONS = [
  { value: '', label: 'Select Reason *' },
  { value: 'MATERIAL_NOT_AVAILABLE', label: 'Full quantity of material not available with firm at the time of inspection' },
  { value: 'PLACE_NOT_AS_PER_PO', label: 'Place of inspection is not as per the PO' },
  { value: 'VENDOR_WITHDRAWN', label: 'Vendor has withdrawn the inspection call' },
  { value: 'ANY_OTHER', label: 'Any other' },
];

// Responsive styles for mobile tabs
const responsiveStyles = `
  @media (max-width: 768px) {
    .multi-inspection-header h1 {
      font-size: 18px !important;
    }
    .multi-inspection-tabs {
      gap: 4px !important;
    }
    .multi-inspection-tabs > div {
      padding: 10px 12px !important;
      font-size: 13px !important;
    }
  }
`;

const MultiTabInspectionInitiationPage = ({ calls, onProceed, onBack }) => {
  // Calculate latest desired date among all calls for batch restriction
  const latestDesiredDate = useMemo(() => {
    if (!calls || calls.length === 0) return null;
    return calls.reduce((latest, call) => {
      const desiredDateStr = call.desired_inspection_date || call.desiredInspectionDate;
      if (!desiredDateStr) return latest;
      const current = new Date(desiredDateStr);
      if (!latest || current > latest) return current;
      return latest;
    }, null);
  }, [calls]);

  const latestDesiredDateStr = latestDesiredDate ? latestDesiredDate.toISOString().split('T')[0] : '';
  const latestDesiredDateFormatted = latestDesiredDate ? latestDesiredDate.toLocaleDateString('en-GB') : '-';

  const [activeCallIndex, setActiveCallIndex] = useState(0);
  const [formDataByCall, setFormDataByCall] = useState(() => {
    const initialData = {};
    const today = new Date().toISOString().split('T')[0];
    calls.forEach(call => {
      initialData[call.id] = {
        shiftOfInspection: '',
        offeredQty: call.call_qty,
        cmApproval: false,
        dateOfInspection: today,
        multipleLinesActive: false,
        productionLines: [{ lineNumber: 1, icNumber: '', poNumber: '', rawMaterialICs: [], productType: '' }],
        sectionAVerified: false,
        sectionAStatus: '',
        sectionBVerified: false,
        sectionBStatus: '',
        sectionCVerified: false,
        sectionCStatus: '',
        sectionDVerified: false,
      };
    });
    return initialData;
  });

  // Modal states
  const [showCallActionModal, setShowCallActionModal] = useState(false);
  const [callActionType, setCallActionType] = useState('');
  const [callActionReason, setCallActionReason] = useState('');
  const [callActionRemarks, setCallActionRemarks] = useState('');
  const [callActionError, setCallActionError] = useState('');
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [initiateShift, setInitiateShift] = useState('');
  const [initiateDate, setInitiateDate] = useState(new Date().toISOString().split('T')[0]);
  const [initiateError, setInitiateError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const currentCall = calls[activeCallIndex];
  const currentFormData = formDataByCall[currentCall.id];

  const updateFormData = (callId, updates) => {
    console.log(`🔄 [MultiTab] updateFormData called for callId: ${callId}`, updates);
    console.log(`🔍 [MultiTab] Current formDataByCall keys:`, Object.keys(formDataByCall));
    console.log(`🔍 [MultiTab] Does callId exist in formDataByCall?`, callId in formDataByCall);
    setFormDataByCall(prev => {
      const updated = {
        ...prev,
        [callId]: { ...prev[callId], ...updates }
      };
      console.log(`📊 [MultiTab] Updated formDataByCall for callId ${callId}:`, updated[callId]);
      return updated;
    });
  };

  const handleTabChange = (index) => {
    setActiveCallIndex(index);
  };

  // Open call action modal (withheld/cancel)
  const handleOpenCallActionModal = (actionType) => {
    setCallActionType(actionType);
    setCallActionReason('');
    setCallActionRemarks('');
    setCallActionError('');
    setShowCallActionModal(true);
  };

  // Close call action modal
  const handleCloseCallActionModal = () => {
    setShowCallActionModal(false);
    setCallActionType('');
    setCallActionReason('');
    setCallActionRemarks('');
    setCallActionError('');
  };

  // Submit call action for current call
  const handleSubmitCallAction = async () => {
    if (!callActionReason) {
      setCallActionError('Please select a reason');
      return;
    }
    if (callActionReason === 'ANY_OTHER' && !callActionRemarks.trim()) {
      setCallActionError('Please provide remarks for "Any other" reason');
      return;
    }

    setIsSaving(true);
    try {
      // Get current user
      const currentUser = getStoredUser();
      const userId = currentUser?.userId || 0;

      // Prepare remarks based on reason
      const reasonText = CALL_ACTION_REASONS.find(r => r.value === callActionReason)?.label || callActionReason;
      const finalRemarks = callActionReason === 'ANY_OTHER'
        ? callActionRemarks.trim()
        : `${reasonText}${callActionRemarks.trim() ? ': ' + callActionRemarks.trim() : ''}`;

      // If CANCELLED, trigger workflow API
      if (callActionType === 'CANCELLED') {
        console.log('🔄 Triggering workflow API for Cancel Call...');

        const workflowActionData = {
          workflowTransitionId: currentCall.workflowTransitionId || currentCall.id,
          requestId: currentCall.call_no,
          action: 'VERIFY_MATERIAL_AVAILABILITY',
          remarks: finalRemarks,
          actionBy: userId,
          pincode: currentCall.pincode || '560001',
          materialAvailable: 'NO'
        };

        console.log('Workflow Action Data:', workflowActionData);

        try {
          await performTransitionAction(workflowActionData);
          console.log('✅ Workflow transition successful');
          alert(`Call ${currentCall.call_no} cancelled successfully`);
        } catch (workflowError) {
          console.error('❌ Workflow API error:', workflowError);
          throw new Error(workflowError.message || 'Failed to cancel call via workflow');
        }
      } else {
        // WITHHELD - use existing logic
        const actionData = {
          inspectionRequestId: currentCall.api_id || null,
          callNo: currentCall.call_no,
          poNo: currentCall.po_no,
          actionType: callActionType,
          reason: callActionReason,
          remarks: finalRemarks,
          status: callActionType,
          actionDate: new Date().toISOString()
        };
        await saveInspectionInitiation(actionData);
        alert(`Call ${currentCall.call_no} withheld successfully`);
      }

      handleCloseCallActionModal();
      onBack();
    } catch (error) {
      console.error('Error saving call action:', error);
      setCallActionError(error.message || 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Open initiate inspection modal
  const handleOpenInitiateModal = () => {
    console.log('🔍 [MultiTab] handleOpenInitiateModal called');
    console.log('📋 [MultiTab] Current formDataByCall state:', formDataByCall);
    console.log('📋 [MultiTab] Calls array:', calls.map(c => ({ id: c.id, call_no: c.call_no, product_type: c.product_type })));
    console.log('📋 [MultiTab] Validating all calls...');

    // Validate all forms before opening modal
    const invalidCalls = calls.filter(call => {
      const data = formDataByCall[call.id];
      const productType = call.product_type || '';

      console.log(`🔍 [MultiTab] Checking call ${call.call_no} (id: ${call.id})`);
      console.log(`🔍 [MultiTab] Data for this call:`, data);

      // Section C is ONLY required for Raw Material, NOT for Process Material or Final Product
      // Handle multiple product type formats: "Raw Material", "PROCESS_MATERIAL", "Process", "FINAL_PRODUCT", "Final Product"
      const isSectionCRequired = productType === 'Raw Material' || productType.includes('Raw');

      console.log(`📍 [MultiTab] Validating call ${call.call_no}:`, {
        callId: call.id,
        productType: productType,
        isSectionCRequired: isSectionCRequired,
        sectionAVerified: data?.sectionAVerified,
        sectionBVerified: data?.sectionBVerified,
        sectionCVerified: data?.sectionCVerified
      });

      const isInvalid = !data?.sectionAVerified || !data?.sectionBVerified || (isSectionCRequired && !data?.sectionCVerified);

      if (isInvalid) {
        console.log(`❌ [MultiTab] Call ${call.call_no} validation FAILED:`, {
          sectionAVerified: data?.sectionAVerified,
          sectionBVerified: data?.sectionBVerified,
          sectionCRequired: isSectionCRequired,
          productType: productType,
          sectionCVerified: data?.sectionCVerified,
          reason: !data?.sectionAVerified ? 'Section A not verified' :
            !data?.sectionBVerified ? 'Section B not verified' :
              (isSectionCRequired && !data?.sectionCVerified) ? 'Section C required but not verified' : 'Unknown'
        });
      } else {
        console.log(`✅ [MultiTab] Call ${call.call_no} validation PASSED`);
      }
      return isInvalid;
    });

    if (invalidCalls.length > 0) {
      const invalidCallNos = invalidCalls.map(c => c.call_no).join(', ');
      console.log(`⚠️ [MultiTab] Validation failed for calls: ${invalidCallNos}`);
      console.log(`⚠️ [MultiTab] Invalid calls details:`, invalidCalls.map(c => ({
        call_no: c.call_no,
        id: c.id,
        formData: formDataByCall[c.id]
      })));
      alert(`Please verify all sections for: ${invalidCallNos}`);
      return;
    }

    console.log('✅ [MultiTab] All calls validated successfully');
    setInitiateShift('');
    setInitiateDate(new Date().toISOString().split('T')[0]);
    setInitiateError('');
    console.log('📂 [MultiTab] Setting showInitiateModal to true');
    setShowInitiateModal(true);
  };

  // Close initiate modal
  const handleCloseInitiateModal = () => {
    setShowInitiateModal(false);
    setInitiateShift('');
    setInitiateError('');
  };

  // Submit initiation for all calls
  const handleSubmitInitiation = async () => {
    if (!initiateShift) {
      setInitiateError('Please select a shift');
      return;
    }

    setIsSaving(true);
    try {
      // Get current user for actionBy field
      const currentUser = getStoredUser();
      const userId = currentUser?.userId || 0;

      // Track results for each call
      const successfulCalls = [];
      const failedCalls = [];

      // Save initiation for all calls
      for (const call of calls) {
        console.log(`\n📍 Processing call: ${call.call_no}`);

        try {
          // Use the workflow transition ID from the call object
          const workflowTransitionId = call.id || call.workflowTransitionId || null;
          console.log(`📍 Using workflowTransitionId: ${workflowTransitionId} for ${call.call_no}`);

          // Save inspection initiation data
          const initiationData = {
            inspectionRequestId: call.api_id || null,
            callNo: call.call_no,
            poNo: call.po_no,
            shiftOfInspection: initiateShift,
            dateOfInspection: initiateDate,
            status: 'INITIATED',
            initiatedDate: new Date().toISOString(),
            workflowTransitionId: workflowTransitionId,
            actionBy: userId
          };

          console.log('💾 Saving initiation for call:', call.call_no, initiationData);
          const result = await saveInspectionInitiation(initiationData);
          console.log('✅ Saved successfully:', call.call_no, result);

          successfulCalls.push(call.call_no);
        } catch (callError) {
          console.error(`❌ Error processing call ${call.call_no}:`, callError);
          failedCalls.push({
            callNo: call.call_no,
            error: callError.message || 'Failed to save inspection initiation'
          });
        }
      }

      // Handle results
      if (successfulCalls.length > 0) {
        let resultMessage = `Successfully initiated ${successfulCalls.length} inspection(s): ${successfulCalls.join(', ')}`;

        if (failedCalls.length > 0) {
          resultMessage += `\n\n⚠️ Failed to initiate ${failedCalls.length} call(s):\n`;
          failedCalls.forEach(failed => {
            resultMessage += `• ${failed.callNo}: ${failed.error}\n`;
          });
          console.warn('⚠️ Partial failure:', failedCalls);
          console.log(resultMessage);
        } else {
          console.log('✅ All calls initiated successfully:', resultMessage);
        }

        handleCloseInitiateModal();
        onProceed(calls[0].product_type, initiateShift, initiateDate);
      } else {
        // All calls failed
        let errorMessage = `Failed to initiate all inspections:\n`;
        failedCalls.forEach(failed => {
          errorMessage += `• ${failed.callNo}: ${failed.error}\n`;
        });
        console.error('❌ All calls failed:', failedCalls);
        setInitiateError(errorMessage);
      }
    } catch (error) {
      console.error('❌ Unexpected error in handleSubmitInitiation:', error);
      setInitiateError(`Unexpected error: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* Inject responsive styles */}
      <style>{responsiveStyles}</style>

      <div className="breadcrumb">
        <div className="breadcrumb-item" onClick={onBack} style={{ cursor: 'pointer' }}>Landing Page</div>
        <span className="breadcrumb-separator">/</span>
        <div className="breadcrumb-item breadcrumb-active">Inspection Initiation (Multiple Calls)</div>
      </div>

      <div className="multi-inspection-header" style={{ marginBottom: 'var(--space-24)' }}>
        <h1>Inspection Initiation - Multiple Calls</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-8)' }}>
          Fill out inspection details for {calls.length} inspection calls. Switch between tabs to enter data for each call.
        </p>
      </div>

      {/* Call Tabs */}
      <div className="multi-inspection-tabs" style={{
        display: 'flex',
        gap: 'var(--space-8)',
        marginBottom: 'var(--space-24)',
        borderBottom: '2px solid var(--color-border)',
        overflowX: 'auto',
        flexWrap: 'wrap',
        WebkitOverflowScrolling: 'touch'
      }}>
        {calls.map((call, index) => {
          const isValid = formDataByCall[call.id].shiftOfInspection &&
            (formDataByCall[call.id].offeredQty === call.call_qty ||
              (formDataByCall[call.id].offeredQty > call.call_qty && formDataByCall[call.id].cmApproval));

          return (
            <div
              key={call.id}
              onClick={() => handleTabChange(index)}
              style={{
                padding: 'var(--space-12) var(--space-16)',
                cursor: 'pointer',
                borderBottom: activeCallIndex === index ? '3px solid var(--color-primary)' : '3px solid transparent',
                fontWeight: activeCallIndex === index ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                color: activeCallIndex === index ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-8)',
                whiteSpace: 'nowrap',
                minHeight: '44px'
              }}
            >
              <span>{call.call_no}</span>
              {isValid && <span style={{ color: 'var(--color-success)' }}>✓</span>}
            </div>
          );
        })}
      </div>

      {/* Render the form for the active call */}
      <InspectionInitiationFormContent
        call={currentCall}
        formData={currentFormData}
        onFormDataChange={(updates) => {
          console.log(`🔔 [MultiTab] onFormDataChange callback triggered for call ${currentCall.call_no} (id: ${currentCall.id})`, updates);
          updateFormData(currentCall.id, updates);
        }}
      />

      <div className="inspection-action-buttons" style={{ marginTop: 'var(--space-24)' }}>
        <button className="btn btn-secondary inspection-action-buttons__btn" onClick={onBack} disabled={isSaving}>
          Back to Landing Page
        </button>
        <div className="inspection-action-buttons__group">
          {activeCallIndex > 0 && (
            <button className="btn btn-outline inspection-action-buttons__btn" onClick={() => setActiveCallIndex(activeCallIndex - 1)} disabled={isSaving}>
              ← Previous Call
            </button>
          )}
          {activeCallIndex < calls.length - 1 && (
            <button className="btn btn-outline inspection-action-buttons__btn" onClick={() => setActiveCallIndex(activeCallIndex + 1)} disabled={isSaving}>
              Next Call →
            </button>
          )}
          <button
            type="button"
            className="btn btn-warning inspection-action-buttons__btn"
            onClick={() => handleOpenCallActionModal('WITHHELD')}
            disabled={isSaving}
          >
            Withheld Call
          </button>
          <button
            type="button"
            className="btn btn-danger inspection-action-buttons__btn"
            onClick={() => handleOpenCallActionModal('CANCELLED')}
            disabled={isSaving}
          >
            Cancel Call
          </button>
          {activeCallIndex === calls.length - 1 && (
            <button
              className="btn btn-success inspection-action-buttons__btn"
              onClick={handleOpenInitiateModal}
              disabled={isSaving}
            >
              Initiate All Inspections
            </button>
          )}
        </div>
      </div>

      {/* Call Action Modal (Withheld/Cancel) */}
      {showCallActionModal && (
        <div className="modal-overlay" onClick={handleCloseCallActionModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {callActionType === 'WITHHELD' ? 'Withheld Call' : 'Cancel Call'} - {currentCall.call_no}
              </h3>
              <button className="modal-close" onClick={handleCloseCallActionModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Reason <span className="required">*</span></label>
                <select
                  className="modal-select"
                  value={callActionReason}
                  onChange={(e) => { setCallActionReason(e.target.value); setCallActionError(''); }}
                >
                  {CALL_ACTION_REASONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {callActionReason === 'ANY_OTHER' && (
                <div className="modal-field">
                  <label className="modal-label">Remarks <span className="required">*</span></label>
                  <textarea
                    className="modal-textarea"
                    placeholder="Please provide details..."
                    value={callActionRemarks}
                    onChange={(e) => { setCallActionRemarks(e.target.value); setCallActionError(''); }}
                  />
                </div>
              )}

              {callActionError && <div className="modal-error">{callActionError}</div>}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary modal-actions__btn" onClick={handleCloseCallActionModal} disabled={isSaving}>
                Cancel
              </button>
              <button type="button" className={`${callActionType === 'WITHHELD' ? 'btn btn-warning' : 'btn btn-danger'} modal-actions__btn`} onClick={handleSubmitCallAction} disabled={isSaving}>
                {isSaving ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Initiate All Inspections Modal */}
      {showInitiateModal && (
        <div className="modal-overlay" onClick={handleCloseInitiateModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Initiate All Inspections ({calls.length} Calls)</h3>
              <button className="modal-close" onClick={handleCloseInitiateModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Calls to Initiate</label>
                <div style={{ padding: 'var(--space-8)', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-sm)' }}>
                  {calls.map(call => (
                    <div key={call.id} style={{ padding: 'var(--space-4) 0' }}>
                      <strong>{call.call_no}</strong> - {call.po_no}
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-field">
                <label className="modal-label">Shift of Inspection <span className="required">*</span></label>
                <select
                  className="modal-select"
                  value={initiateShift}
                  onChange={(e) => {
                    setInitiateShift(e.target.value);
                    if (e.target.value) {
                      setInitiateError('');
                    }
                  }}
                >
                  <option value="">Select Shift</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="modal-field">
                <label className="modal-label">Latest Desired Inspection Date</label>
                <input
                  type="text"
                  className="modal-input"
                  value={latestDesiredDateFormatted}
                  disabled
                />
              </div>

              <div className="modal-field">
                <label className="modal-label">Date of Inspection <span className="required">*</span></label>
                <input
                  type="date"
                  className="modal-input"
                  value={initiateDate}
                  min={latestDesiredDateStr}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => { setInitiateDate(e.target.value); setInitiateError(''); }}
                />
                <span className="modal-hint">
                  Select a date between the latest desired date and today
                </span>
              </div>

              {initiateError && <div className="modal-error">{initiateError}</div>}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary modal-actions__btn" onClick={handleCloseInitiateModal} disabled={isSaving}>
                Cancel
              </button>
              <button type="button" className="btn btn-success modal-actions__btn" onClick={handleSubmitInitiation} disabled={isSaving}>
                {isSaving ? 'Initiating...' : 'Confirm & Proceed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiTabInspectionInitiationPage;
