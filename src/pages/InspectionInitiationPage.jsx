import React, { useState, useEffect, useCallback } from 'react';
import InspectionInitiationFormContent from '../components/InspectionInitiationFormContent';
import { saveInspectionInitiation } from '../services/vendorInspectionService';
import { markAsUnderInspection, markAsWithheld } from '../services/callStatusService';
import { getStoredUser } from '../services/authService';
import { performTransitionAction } from '../services/workflowService';
import '../styles/inspectionInitiationPage.css';

// Helper to check if call is Process or Final Product (mock mode)
// Handle multiple product type formats: "PROCESS_MATERIAL", "ERC Process", "Process", "FINAL_PRODUCT", "Final Product"
const isProcessOrFinalProduct = (productType) => {
  if (!productType) return false;
  return (
    productType === 'PROCESS_MATERIAL' ||
    productType === 'FINAL_PRODUCT' ||
    productType.includes('Process') ||
    productType.includes('Final')
  );
};

// Reason options for withheld/cancel call
const CALL_ACTION_REASONS = [
  { value: '', label: 'Select Reason *' },
  { value: 'MATERIAL_NOT_AVAILABLE', label: 'Full quantity of material not available with firm at the time of inspection' },
  { value: 'PLACE_NOT_AS_PER_PO', label: 'Place of inspection is not as per the PO' },
  { value: 'VENDOR_WITHDRAWN', label: 'Vendor has withdrawn the inspection call' },
  { value: 'ANY_OTHER', label: 'Any other' },
];

// Storage key for persisting form state
const STORAGE_KEY = 'inspection_initiation_form';

const InspectionInitiationPage = ({ call, onProceed, onBack, onShiftChange, onSelectedLinesChange, onProductionLinesChange }) => {
  // Helper to get storage key for current call
  const getStorageKey = useCallback(() => `${STORAGE_KEY}_${call?.call_no || 'unknown'}`, [call?.call_no]);

  // Load saved state from sessionStorage
  const loadSavedState = useCallback(() => {
    try {
      const saved = sessionStorage.getItem(getStorageKey());
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading saved form state:', e);
    }
    return null;
  }, [getStorageKey]);

  // Sanitize production lines to ensure rawMaterialICs contains only strings
  const sanitizeProductionLines = (lines) => {
    if (!Array.isArray(lines)) return [{ lineNumber: 1, icNumber: '', poNumber: '', rawMaterialICs: [], productType: '' }];
    return lines.map(line => ({
      ...line,
      rawMaterialICs: Array.isArray(line.rawMaterialICs)
        ? line.rawMaterialICs.map(ic => typeof ic === 'object' ? (ic.heatNo || ic.icNo || String(ic)) : String(ic))
        : []
    }));
  };

  // Initialize state with saved values or defaults
  const savedState = loadSavedState();

  const [shiftOfInspection, setShiftOfInspection] = useState(savedState?.shiftOfInspection || '');
  const [offeredQty, setOfferedQty] = useState(savedState?.offeredQty ?? call.call_qty);
  const [cmApproval, setCmApproval] = useState(savedState?.cmApproval || false);
  const [dateOfInspection, setDateOfInspection] = useState(savedState?.dateOfInspection || new Date().toISOString().split('T')[0]);
  const [multipleLinesActive, setMultipleLinesActive] = useState(savedState?.multipleLinesActive || false);
  const [productionLines, setProductionLines] = useState(sanitizeProductionLines(savedState?.productionLines));
  const [sectionAVerified, setSectionAVerified] = useState(savedState?.sectionAVerified || false);
  const [sectionAStatus, setSectionAStatus] = useState(savedState?.sectionAStatus || '');
  const [sectionBVerified, setSectionBVerified] = useState(savedState?.sectionBVerified || false);
  const [sectionBStatus, setSectionBStatus] = useState(savedState?.sectionBStatus || '');
  const [sectionCVerified, setSectionCVerified] = useState(savedState?.sectionCVerified || false);
  const [sectionCStatus, setSectionCStatus] = useState(savedState?.sectionCStatus || '');
  const [sectionDVerified, setSectionDVerified] = useState(savedState?.sectionDVerified || false);
  const [showSectionA] = useState(true);
  const [showSectionB] = useState(true);
  // State for fetched data from mock (for logging/debugging)
  // eslint-disable-next-line no-unused-vars
  const [fetchedPoData, setFetchedPoData] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [fetchedSubPoData, setFetchedSubPoData] = useState(null);
  const currentDateTime = new Date('2025-11-14T17:00:00').toLocaleString();

  // Save form state to sessionStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      shiftOfInspection,
      offeredQty,
      cmApproval,
      dateOfInspection,
      multipleLinesActive,
      productionLines,
      sectionAVerified,
      sectionAStatus,
      sectionBVerified,
      sectionBStatus,
      sectionCVerified,
      sectionCStatus,
      sectionDVerified,
    };
    try {
      sessionStorage.setItem(getStorageKey(), JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Error saving form state:', e);
    }
  }, [
    shiftOfInspection, offeredQty, cmApproval, dateOfInspection,
    multipleLinesActive, productionLines,
    sectionAVerified, sectionAStatus, sectionBVerified, sectionBStatus, sectionCVerified, sectionCStatus, sectionDVerified,
    getStorageKey
  ]);

  // scroll to top when page mounts so navigation positions at the start
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch (e) {
      // ignore when not running in a browser
    }
  }, []);

  // When Section B shift changes, inform parent so Process Parameters grid uses it
  useEffect(() => {
    if (onShiftChange && shiftOfInspection) {
      try { onShiftChange(shiftOfInspection); } catch (e) { /* no-op */ }
    }
  }, [shiftOfInspection, onShiftChange]);


  // Check if all required sections are verified (only those that are shown)
  // Safe check for product_type to avoid "includes" on undefined
  const productType = call?.product_type || '';
  // Section C is only required for Raw Material, NOT for Process or Final Product
  const isSectionCRequired = (productType === 'Raw Material');
  // Section D (Production Lines) verification is NOT required as checkboxes were removed
  // eslint-disable-next-line no-unused-vars
  const isSectionDRequired = false;
  const allSectionsVerified = sectionAVerified && sectionBVerified && (!isSectionCRequired || sectionCVerified);

  // eslint-disable-next-line no-unused-vars
  const canProceed = shiftOfInspection && (offeredQty === call.call_qty || (offeredQty > call.call_qty && cmApproval)) && allSectionsVerified;

  // production line helpers removed (currently unused)

  // State for showing validation errors (red blinking borders)
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const formData = {
    shiftOfInspection,
    offeredQty,
    cmApproval,
    dateOfInspection,
    multipleLinesActive,
    productionLines,
    sectionAVerified,
    sectionAStatus,
    sectionBVerified,
    sectionBStatus,
    sectionCVerified,
    sectionCStatus,
    sectionDVerified,
    showValidationErrors,
  };

  const onFormDataChange = (updates) => {
    if (updates.shiftOfInspection !== undefined) setShiftOfInspection(updates.shiftOfInspection);
    if (updates.offeredQty !== undefined) setOfferedQty(updates.offeredQty);
    if (updates.cmApproval !== undefined) setCmApproval(updates.cmApproval);
    if (updates.dateOfInspection !== undefined) setDateOfInspection(updates.dateOfInspection);
    if (updates.multipleLinesActive !== undefined) setMultipleLinesActive(updates.multipleLinesActive);
    if (updates.productionLines !== undefined) setProductionLines(updates.productionLines);
    if (updates.sectionAVerified !== undefined) setSectionAVerified(updates.sectionAVerified);
    if (updates.sectionAStatus !== undefined) setSectionAStatus(updates.sectionAStatus);
    if (updates.sectionBVerified !== undefined) setSectionBVerified(updates.sectionBVerified);
    if (updates.sectionBStatus !== undefined) setSectionBStatus(updates.sectionBStatus);
    if (updates.sectionCVerified !== undefined) setSectionCVerified(updates.sectionCVerified);
    if (updates.sectionCStatus !== undefined) setSectionCStatus(updates.sectionCStatus);
    if (updates.sectionDVerified !== undefined) setSectionDVerified(updates.sectionDVerified);
    // Handle fetched data from mock (passed up from InspectionInitiationFormContent)
    if (updates.fetchedPoData !== undefined) setFetchedPoData(updates.fetchedPoData);
    if (updates.fetchedSubPoData !== undefined) setFetchedSubPoData(updates.fetchedSubPoData);
  };

  // Bubble up selected lines for Process modules
  useEffect(() => {
    try {
      const lines = (productionLines || []).map(l => `Line-${l.lineNumber}`);
      if (onSelectedLinesChange && lines.length > 0) onSelectedLinesChange(lines);
    } catch (e) { /* no-op */ }
  }, [productionLines, onSelectedLinesChange]);

  // Bubble up production lines for Process modules
  useEffect(() => {
    try {
      if (onProductionLinesChange && productionLines && productionLines.length > 0) {
        onProductionLinesChange(productionLines);
      }
    } catch (e) { /* no-op */ }
  }, [productionLines, onProductionLinesChange]);

  // State for saving status
  const [isSaving, setIsSaving] = useState(false);

  // State for call action modal (withheld/cancel)
  const [showCallActionModal, setShowCallActionModal] = useState(false);
  const [callActionType, setCallActionType] = useState('');
  const [callActionReason, setCallActionReason] = useState('');
  const [callActionRemarks, setCallActionRemarks] = useState('');
  const [callActionError, setCallActionError] = useState('');

  // State for initiate inspection modal
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [initiateError, setInitiateError] = useState('');

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

  // Submit call action (withheld/cancel)
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
          workflowTransitionId: call.workflowTransitionId || call.id,
          requestId: call.call_no,
          action: 'VERIFY_MATERIAL_AVAILABILITY',
          remarks: finalRemarks,
          actionBy: userId,
          pincode: call.pincode || '560001',
          materialAvailable: 'NO'
        };

        console.log('Workflow Action Data:', workflowActionData);

        try {
          await performTransitionAction(workflowActionData);
          console.log('✅ Workflow transition successful');
          alert(`Call ${call.call_no} cancelled successfully`);
        } catch (workflowError) {
          console.error('❌ Workflow API error:', workflowError);
          throw new Error(workflowError.message || 'Failed to cancel call via workflow');
        }
      } else {
        // WITHHELD - use workflow API for Process/Final Product, or existing logic for Raw Material
        const actionData = {
          inspectionRequestId: call.api_id || null,
          callNo: call.call_no,
          poNo: call.po_no,
          actionType: callActionType,
          reason: callActionReason,
          remarks: finalRemarks,
          status: callActionType,
          actionDate: new Date().toISOString()
        };

        // Call workflow API for Process/Final Product
        if (isProcessOrFinalProduct(call.product_type)) {
          console.log('🏭 Process/Final Product: Calling workflow API for withheld...');

          const workflowActionData = {
            workflowTransitionId: call.workflowTransitionId || call.id,
            requestId: call.call_no,
            action: 'VERIFY_MATERIAL_AVAILABILITY',
            remarks: finalRemarks,
            actionBy: userId,
            pincode: call.pincode || '560001',
            materialAvailable: 'NO'
          };

          console.log('Workflow Action Data:', workflowActionData);

          try {
            await performTransitionAction(workflowActionData);
            console.log('✅ Workflow transition successful for Process/Final Product');
            alert(`✅ Call withheld successfully`);
          } catch (workflowError) {
            console.error('❌ Workflow API error:', workflowError);
            throw new Error(workflowError.message || 'Failed to withheld call via workflow');
          }
        } else {
          // Raw Material: Call real API
          await saveInspectionInitiation(actionData);
          alert(`Call withheld successfully`);
        }

        // Mark call as withheld in local storage
        markAsWithheld(call.call_no, finalRemarks);
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
    // Check if any required section is not verified
    // Section D verification removed as checkboxes were removed
    const hasValidationErrors =
      !sectionAVerified ||
      !sectionBVerified ||
      (isSectionCRequired && !sectionCVerified);

    if (hasValidationErrors) {
      // Show validation errors (red blinking borders) on incomplete sections
      setShowValidationErrors(true);
      return;
    }

    // All sections verified, proceed to modal
    setShowValidationErrors(false);
    setInitiateError('');
    setShowInitiateModal(true);
  };

  // Close initiate inspection modal
  const handleCloseInitiateModal = () => {
    setShowInitiateModal(false);
    setInitiateError('');
  };

  // Submit initiate inspection
  const handleSubmitInitiation = async () => {
    if (!shiftOfInspection) {
      setInitiateError('Please select Shift of Inspection');
      return;
    }
    if (!dateOfInspection) {
      setInitiateError('Please select Date of Inspection');
      return;
    }

    setIsSaving(true);
    try {
      // Get current user for actionBy field
      const currentUser = getStoredUser();
      const userId = currentUser?.userId || 0;

      // Use the workflow transition ID from the call object
      const workflowTransitionId = call.id || call.workflowTransitionId || null;
      console.log(`📍 Using workflowTransitionId: ${workflowTransitionId} for ${call.call_no}`);

      const initiationData = {
        inspectionRequestId: call.api_id || null,
        callNo: call.call_no,
        poNo: call.po_no,
        shiftOfInspection,
        dateOfInspection,
        offeredQty,
        cmApproval,
        sectionAVerified,
        sectionBVerified,
        sectionCVerified,
        sectionDVerified,
        multipleLinesActive,
        productionLines,
        productType: call.product_type,
        status: 'INITIATED',
        workflowTransitionId: workflowTransitionId,
        actionBy: userId
      };

      console.log('💾 Saving inspection initiation...', initiationData);
      await saveInspectionInitiation(initiationData);
      console.log('✅ Inspection initiation saved successfully');


      // Mark call as under inspection in local storage
      markAsUnderInspection(call.call_no, { shiftOfInspection, dateOfInspection });

      handleCloseInitiateModal();
      onProceed(call.product_type, shiftOfInspection, dateOfInspection);
    } catch (error) {
      console.error('Error saving inspection initiation:', error);
      setInitiateError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="inspection-initiation-page">
      <div className="breadcrumb">
        <div className="breadcrumb-item breadcrumb-item--clickable" onClick={onBack}>Landing Page</div>
        <span className="breadcrumb-separator">/</span>
        <div className="breadcrumb-item breadcrumb-active">Inspection Initiation</div>
      </div>

      <div className="inspection-page-header">
        <h1 className="inspection-page-header__title">Inspection Initiation for {call.call_no}</h1>
        <div className="inspection-page-header__datetime">{currentDateTime}</div>
      </div>

      <div className="inspection-form-container">
        <InspectionInitiationFormContent
          call={call}
          formData={formData}
          onFormDataChange={onFormDataChange}
          showSectionA={showSectionA}
          showSectionB={showSectionB}
        />
      </div>

      <div className="inspection-action-buttons">
        <button className="btn btn-secondary inspection-action-buttons__btn" onClick={onBack} disabled={isSaving}>
          Back to Landing Page
        </button>
        <div className="inspection-action-buttons__group">
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
          <button
            type="button"
            className="btn btn-success inspection-action-buttons__btn"
            onClick={handleOpenInitiateModal}
            disabled={isSaving}
          >
            Initiate Inspection
          </button>
        </div>
      </div>

      {showCallActionModal && (
        <div className="modal-overlay" onClick={handleCloseCallActionModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {callActionType === 'WITHHELD' ? 'Withheld Call' : 'Cancel Call'}
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

      {showInitiateModal && (
        <div className="modal-overlay" onClick={handleCloseInitiateModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Initiate Inspection</h3>
              <button className="modal-close" onClick={handleCloseInitiateModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Shift of Inspection <span className="required">*</span></label>
                <select
                  className="modal-select"
                  value={shiftOfInspection}
                  onChange={(e) => {
                    setShiftOfInspection(e.target.value);
                    setInitiateError('');
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
                <label className="modal-label">Desired Inspection Date</label>
                <input
                  type="text"
                  className="modal-input"
                  value={call.desired_inspection_date ? new Date(call.desired_inspection_date).toLocaleDateString('en-GB') : '-'}
                  disabled
                />
              </div>

              <div className="modal-field">
                <label className="modal-label">Date of Inspection <span className="required">*</span></label>
                <input
                  type="date"
                  className="modal-input"
                  value={dateOfInspection}
                  min={call.desired_inspection_date ? new Date(call.desired_inspection_date).toISOString().split('T')[0] : ''}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => { setDateOfInspection(e.target.value); setInitiateError(''); }}
                />
                <span className="modal-hint">
                  Select a date between the desired date and today
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

export default InspectionInitiationPage;
