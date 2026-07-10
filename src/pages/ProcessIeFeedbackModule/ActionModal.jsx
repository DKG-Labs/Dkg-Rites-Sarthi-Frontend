import React, { useState } from 'react';
import axios from 'axios';
import Modal from '../../components/Modal';
import { API_BASE_URL } from '../../services/apiConfig';

const ActionModal = ({ discrepancy, actionType, onClose, onSuccess, showNotification }) => {
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userId = localStorage.getItem('userId');

  const dNo = discrepancy?.feedbackId || discrepancy?.discrepancyNo;
  const wId = discrepancy?.feedbackWorkflowTransitionId || discrepancy?.workflowTransitionId || discrepancy?.id;

  const handleSubmit = async () => {
    if ((actionType === 'resend' || actionType === 'withdraw') && !remarks) {
      showNotification('Remarks are mandatory for this action.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (actionType === 'delete') {
        // Assume ID is available
        await axios.delete(`${API_BASE_URL}/api/feedback-workflow/delete-discrepancy/${discrepancy.id}?actionBy=${userId}`);
      } else {
        // Workflow actions
        let workflowAction = '';
        if (actionType === 'accept') workflowAction = 'ACCEPT_RECTIFICATION';
        if (actionType === 'resend') workflowAction = 'RESEND_FOR_RECTIFICATION';
        if (actionType === 'withdraw') workflowAction = 'WITHDRAW_DISCREPANCY';

        const actionData = {
          workflowTransitionId: wId || 0,
          feedbackId: dNo,
          action: workflowAction,
          remarks: remarks,
          actionBy: parseInt(userId, 10) || 0
        };

        await axios.post(`${API_BASE_URL}/api/feedback-workflow/performTransitionAction`, actionData);
      }
      onSuccess();
    } catch (error) {
      console.error(`Error performing ${actionType}:`, error);
      showNotification(error.response?.data?.message || `Failed to perform ${actionType}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (actionType === 'view') {
    return (
      <Modal isOpen={true} onClose={onClose} title={`View Discrepancy: ${dNo}`}>
        <div style={{ padding: '15px' }}>
          <p style={{ marginBottom: '8px' }}><strong>Product Type:</strong> {discrepancy.productType || discrepancy.product_type}</p>
          <p style={{ marginBottom: '8px' }}><strong>PO Number:</strong> {discrepancy.poNumber || 'N/A'}</p>
          <p style={{ marginBottom: '8px' }}><strong>Category:</strong> {discrepancy.category || 'N/A'}</p>
          <p style={{ marginBottom: '8px' }}><strong>Sub Category:</strong> {discrepancy.subCategory || 'N/A'}</p>
          <p style={{ marginBottom: '8px' }}><strong>Urgency:</strong> {discrepancy.urgency || 'N/A'}</p>
          <p style={{ marginBottom: '8px' }}><strong>Description:</strong> {discrepancy.description || 'N/A'}</p>
          <p style={{ marginBottom: '8px' }}><strong>Date Raised:</strong> {discrepancy.dateOfRaising || 'N/A'}</p>
          <p style={{ marginBottom: '8px' }}><strong>Status:</strong> {discrepancy.nextStatus || discrepancy.status}</p>
          <p style={{ marginBottom: '8px' }}><strong>Remarks History:</strong> {discrepancy.remarks || 'No remarks'}</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Discrepancy`}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Confirm'}
          </button>
        </>
      }
    >
      <div style={{ padding: '15px' }}>
        <p>Are you sure you want to <strong>{actionType}</strong> this discrepancy ({dNo})?</p>
        
        <div className="form-group" style={{ marginTop: '15px' }}>
          <label className={`form-label ${(actionType === 'resend' || actionType === 'withdraw') ? 'required' : ''}`}>Remarks</label>
          <textarea 
            className="form-control" 
            rows="3" 
            value={remarks} 
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter remarks here..."
            required={actionType === 'resend' || actionType === 'withdraw'}
          ></textarea>
        </div>
      </div>
    </Modal>
  );
};

export default ActionModal;
