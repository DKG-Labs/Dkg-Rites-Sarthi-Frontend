/**
 * CMIEWorkloadTab Component
 * IE workload monitoring and assignment control
 */

import React, { useState } from 'react';
import useCMData from '../../../hooks/cm/useCMData';
import DataTable from '../../../components/DataTable';
import Modal from '../../../components/Modal';
import { formatDate } from '../../../utils/helpers';

const CMIEWorkloadTab = () => {
  const { ies, loading, getCallsByIE, reassignCall } = useCMData();
  const [selectedIE, setSelectedIE] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [targetIEId, setTargetIEId] = useState('');

  const columns = [
    { key: 'employeeId', label: 'Employee ID' },
    { key: 'name', label: 'IE Name' },
    { key: 'assignedCalls', label: 'Assigned Calls' },
    { key: 'pendingInspections', label: 'Pending Inspections' },
    { key: 'underInspection', label: 'Under Inspection' },
    { key: 'icPending', label: 'IC Pending' },
    { key: 'completedThisMonth', label: 'Completed (Month)' },
    { 
      key: 'workloadStatus', 
      label: 'Workload Status',
      render: (val) => {
        let color = '#22c55e';
        let bgColor = '#f0fdf4';
        let borderColor = '#bbf7d0';
        
        if (val === 'Overloaded') {
          color = '#ef4444';
          bgColor = '#fef2f2';
          borderColor = '#fecaca';
        } else if (val === 'High') {
          color = '#f59e0b';
          bgColor = '#fffbeb';
          borderColor = '#fde68a';
        }
        
        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            background: bgColor,
            color: color,
            border: `1px solid ${borderColor}`
          }}>
            {val}
          </span>
        );
      }
    },
  ];

  // Handle View Details click
  const handleViewDetails = (ie) => {
    setSelectedIE(ie);
    setShowDetailsModal(true);
  };

  // Handle Reassign click for a specific call
  const handleReassignClick = (call) => {
    setSelectedCall(call);
    setTargetIEId('');
    setShowReassignModal(true);
  };

  // Handle Reassign submission
  const handleReassignSubmit = () => {
    if (!selectedCall || !targetIEId) return;

    reassignCall(selectedCall.id, targetIEId);
    setShowReassignModal(false);
    setSelectedCall(null);
    setTargetIEId('');

    // Refresh the details modal if it's open
    if (selectedIE) {
      // The modal will automatically update due to React re-render
    }
  };

  const actions = (row) => (
    <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
      <button
        className="btn btn-sm btn-secondary"
        onClick={() => handleViewDetails(row)}
      >
        View Details
      </button>
    </div>
  );

  if (loading) {
    return <div>Loading IE workload data...</div>;
  }

  // Get assigned calls for selected IE
  const assignedCalls = selectedIE ? getCallsByIE(selectedIE.id) : [];

  // Columns for the assigned calls table in the modal
  const callColumns = [
    { key: 'callNumber', label: 'Call Number' },
    {
      key: 'vendor',
      label: 'Vendor',
      render: (val) => val?.name || '-'
    },
    { key: 'product', label: 'Product Type' },
    { key: 'stage', label: 'Inspection Stage' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => {
        const statusColors = {
          'Assigned': { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
          'Under Inspection': { bg: '#dbeafe', color: '#2563eb', border: '#bfdbfe' },
          'IC Pending': { bg: '#fed7aa', color: '#ea580c', border: '#fdba74' },
          'Billing Pending': { bg: '#e0e7ff', color: '#6366f1', border: '#c7d2fe' },
          'Payment Pending': { bg: '#fce7f3', color: '#db2777', border: '#fbcfe8' },
          'Completed': { bg: '#d1fae5', color: '#059669', border: '#a7f3d0' }
        };
        const style = statusColors[val] || { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' };
        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            background: style.bg,
            color: style.color,
            border: `1px solid ${style.border}`
          }}>
            {val}
          </span>
        );
      }
    },
    {
      key: 'scheduledDate',
      label: 'Scheduled Date',
      render: (val) => val ? formatDate(val) : '-'
    },
    {
      key: 'daysPending',
      label: 'Days Pending',
      render: (val) => val || 0
    },
    {
      key: 'slaBreached',
      label: 'SLA Status',
      render: (val) => (
        <span style={{
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500',
          background: val ? '#fee2e2' : '#d1fae5',
          color: val ? '#dc2626' : '#059669',
          border: `1px solid ${val ? '#fecaca' : '#a7f3d0'}`
        }}>
          {val ? 'Breached' : 'On Track'}
        </span>
      )
    }
  ];

  // Actions for each call in the modal
  const callActions = (call) => (
    <button
      className="btn btn-sm btn-secondary"
      onClick={() => handleReassignClick(call)}
    >
      Reassign
    </button>
  );

  return (
    <div>
      {/* Summary Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-label">Total IEs</div>
          <div className="stat-value">{ies.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overloaded IEs</div>
          <div className="stat-value">
            {ies.filter(ie => ie.workloadStatus === 'Overloaded').length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Average Pending per IE</div>
          <div className="stat-value">
            {ies.length > 0
              ? Math.round(ies.reduce((sum, ie) => sum + (ie.pendingInspections || 0), 0) / ies.length)
              : 0
            }
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Pending Calls</div>
          <div className="stat-value">
            {ies.reduce((sum, ie) => sum + (ie.pendingInspections || 0), 0)}
          </div>
        </div>
      </div>

      {/* IE Workload Table */}
      <DataTable
        columns={columns}
        data={ies}
        actions={actions}
        selectable={false}
      />

      {/* View Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        title={`IE Workload Details - ${selectedIE?.name || ''}`}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedIE(null);
        }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedIE(null);
              }}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedIE && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-20)' }}>
            {/* IE Summary Section */}
            <div>
              <h4 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '8px'
              }}>IE Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)' }}>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280' }}>Employee ID:</strong>
                    <br />
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>{selectedIE.employeeId}</span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280' }}>Name:</strong>
                    <br />
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>{selectedIE.name}</span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280' }}>Total Assigned Calls:</strong>
                    <br />
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>{selectedIE.assignedCalls}</span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280' }}>Workload Status:</strong>
                    <br />
                    <span style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '600',
                      background: selectedIE.workloadStatus === 'Overloaded' ? '#fef2f2' :
                                 selectedIE.workloadStatus === 'High' ? '#fffbeb' : '#f0fdf4',
                      color: selectedIE.workloadStatus === 'Overloaded' ? '#ef4444' :
                             selectedIE.workloadStatus === 'High' ? '#f59e0b' : '#22c55e',
                      border: `1px solid ${selectedIE.workloadStatus === 'Overloaded' ? '#fecaca' :
                                          selectedIE.workloadStatus === 'High' ? '#fde68a' : '#bbf7d0'}`
                    }}>
                      {selectedIE.workloadStatus}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Assigned Calls Section */}
            <div>
              <h4 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '8px'
              }}>Assigned Calls ({assignedCalls.length})</h4>

              {assignedCalls.length > 0 ? (
                <DataTable
                  columns={callColumns}
                  data={assignedCalls}
                  actions={callActions}
                  selectable={false}
                  hideSearch={false}
                  emptyMessage="No calls assigned to this IE"
                />
              ) : (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#9ca3af',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px dashed #e5e7eb'
                }}>
                  <p style={{ margin: 0, fontSize: '14px' }}>No calls currently assigned to this IE</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reassign Call Modal */}
      <Modal
        isOpen={showReassignModal}
        title="Reassign Call"
        onClose={() => {
          setShowReassignModal(false);
          setSelectedCall(null);
          setTargetIEId('');
        }}
        footer={
          <div style={{ display: 'flex', gap: 'var(--space-12)', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowReassignModal(false);
                setSelectedCall(null);
                setTargetIEId('');
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleReassignSubmit}
              disabled={!targetIEId}
            >
              Reassign
            </button>
          </div>
        }
      >
        {selectedCall && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
            {/* Call Information */}
            <div>
              <h4 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '8px'
              }}>Call Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)' }}>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280' }}>Call Number:</strong>
                    <br />
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>{selectedCall.callNumber}</span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280' }}>Vendor:</strong>
                    <br />
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>{selectedCall.vendor?.name || '-'}</span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280' }}>Current IE:</strong>
                    <br />
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>{selectedCall.ie?.name || '-'}</span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280' }}>Status:</strong>
                    <br />
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>{selectedCall.status}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Select New IE */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Select New IE <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                className="form-control"
                value={targetIEId}
                onChange={(e) => setTargetIEId(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">-- Select IE --</option>
                {ies
                  .filter(ie => ie.id !== selectedCall.ie?.id)
                  .map(ie => (
                    <option key={ie.id} value={ie.id}>
                      {ie.name} ({ie.employeeId}) - {ie.assignedCalls} calls - {ie.workloadStatus}
                    </option>
                  ))
                }
              </select>
              <p style={{
                margin: '8px 0 0 0',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                Select an IE to reassign this call. Consider workload status when selecting.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CMIEWorkloadTab;

