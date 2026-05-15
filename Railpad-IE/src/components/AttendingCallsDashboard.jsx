import React, { useState, useEffect } from 'react';
import { fetchPendingWorkflowTransitions, fetchCompletedCalls, performTransitionAction } from '../services/workflowService';
import { scheduleInspection } from '../services/scheduleService';
import Notification from './Notification';
import { getStoredUser } from '../services/authService';

import ShiftDutyForm from './ShiftDutyForm';

const AttendingCallsDashboard = ({ onStart, onResume }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCall, setSelectedCall] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleReason, setScheduleReason] = useState('');
  const [notification, setNotification] = useState({ message: '', type: 'info' });
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [callToResume, setCallToResume] = useState(null);
  const [remarks, setRemarks] = useState('');
  const user = getStoredUser();

  useEffect(() => {
    loadCalls();
  }, [activeTab]);

  const loadCalls = async () => {
    setLoading(true);
    try {
      let data = [];
      if (activeTab === 'pending') {
        data = await fetchPendingWorkflowTransitions('Rail Main IE');
      } else if (activeTab === 'completed') {
        data = await fetchCompletedCalls();
      } else if (activeTab === 'certificates') {
        data = await fetchPendingWorkflowTransitions('Rail Main IE');
        data = data.filter(c => c.status === 'INSPECTION_DONE' || c.status === 'CERTIFICATE_PENDING');
      }
      setCalls(data);
    } catch (error) {
      console.error('Error loading calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (call) => {
    setSelectedCall(call);
    setRemarks('');
    setShowDetailsModal(true);
  };

  const handleOpenSchedule = (call) => {
    setSelectedCall(call);
    setScheduleDate('');
    setScheduleReason('');
    setShowScheduleModal(true);
  };

  const onScheduleSubmit = async () => {
    if (!scheduleDate) {
      setNotification({ message: 'Please select a date', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Store schedule details
      await scheduleInspection({
        callNo: selectedCall.requestId,
        scheduleDate: scheduleDate,
        reason: scheduleReason,
        createdBy: user.employeeCode || user.userId.toString()
      });

      // 2. Perform workflow transition
      const actionData = {
        workflowTransitionId: selectedCall.workflowTransitionId,
        requestId: selectedCall.requestId,
        action: 'MAIN_IE_SCHEDULE_CALL',
        remarks: `Inspection scheduled for ${scheduleDate}. ${scheduleReason}`,
        actionBy: user.userId
      };

      const result = await performTransitionAction(actionData);
      if (result.responseStatus?.statusCode === 0) {
        setNotification({ message: 'Inspection scheduled successfully!', type: 'success' });
        setShowScheduleModal(false);
        loadCalls();
      } else {
        setNotification({ message: result.responseStatus?.message || 'Failed to update workflow', type: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartInspection = async (call) => {
    setIsSubmitting(true);
    try {
      const actionData = {
        workflowTransitionId: call.workflowTransitionId,
        requestId: call.requestId,
        action: 'INITIATE_CALL',
        remarks: 'Inspection initiation started by IE',
        actionBy: user.userId
      };

      const result = await performTransitionAction(actionData);
      
      if (result.responseStatus?.statusCode === 0) {
        // Pass the updated transition ID to the next page
        const updatedCall = {
          ...call,
          workflowTransitionId: result.responseData?.workflowTransitionId || call.workflowTransitionId
        };
        onStart(updatedCall);
      } else {
        setNotification({ 
          message: result.responseStatus?.message || 'Failed to initiate inspection workflow', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Error starting inspection:', error);
      setNotification({ message: 'Error: ' + error.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResumeClick = (call) => {
    setCallToResume(call);
    setShowResumeModal(true);
  };

  const handleResumeSubmit = (shiftData) => {
    setShowResumeModal(false);
    if (onResume) {
      onResume(callToResume, shiftData);
    }
  };

  const handleAction = async (action) => {
    if (!selectedCall) return;
    
    setIsSubmitting(true);
    try {
      const actionData = {
        workflowTransitionId: selectedCall.workflowTransitionId,
        requestId: selectedCall.requestId,
        action: action,
        remarks: remarks,
        actionBy: user.userId
      };
      
      const result = await performTransitionAction(actionData);
    if (result.responseStatus?.statusCode === 0) {
        setNotification({ message: 'Action performed successfully!', type: 'success' });
        setShowDetailsModal(false);
        loadCalls();
      } else {
        setNotification({ message: result.responseStatus?.message || 'Failed to perform action', type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'Error performing action', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Notification Component */}
      <Notification 
        message={notification.message}
        type={notification.type}
        autoClose={true}
        onClose={() => setNotification({ ...notification, message: '' })}
      />
      
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
          Attending the Call Raised
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
          Manage and process inspection calls for Railpad
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '1px' }}>
        {[
          { id: 'pending', label: 'List of Calls Pending' },
          { id: 'certificates', label: 'Issuance of IC' },
          { id: 'completed', label: 'Completed Calls' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              color: activeTab === tab.id ? '#3b82f6' : '#64748b',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Search by Request ID, Vendor, or Plant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px 10px 40px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              background: '#fff',
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          />
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '0' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="skeleton-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 100px' }}>
                <div className="skeleton-item" style={{ width: '60%' }}></div>
                <div className="skeleton-item" style={{ width: '80%' }}></div>
                <div className="skeleton-item" style={{ width: '70%' }}></div>
                <div className="skeleton-item" style={{ width: '90%' }}></div>
                <div className="skeleton-item" style={{ width: '60%' }}></div>
                <div className="skeleton-item" style={{ width: '80%' }}></div>
                <div className="skeleton-item" style={{ width: '80px' }}></div>
              </div>
            ))}
          </div>
        ) : calls.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            No calls found in this category.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['TRANSITION ID', 'REQUEST ID', 'VENDOR CODE', 'PLANT ID', 'POI CODE', 'CREATED DATE', 'STATUS', 'ACTIONS'].map(header => (
                  <th key={header} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calls.filter(call => 
                (call.status !== 'CREATED' && call.jobStatus !== 'CREATED') && (
                  (call.requestId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                  (call.vendorCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                  (call.plantId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                )
              ).map((call, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{call.workflowTransitionId}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{call.requestId}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{call.vendorCode}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{call.plantId}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{call.poiCode}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                    {call.createdDate ? new Date(call.createdDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: '700',
                      background: call.jobStatus === 'CREATED' ? '#eff6ff' : '#f0fdf4',
                      color: call.jobStatus === 'CREATED' ? '#1e40af' : '#166534',
                      border: `1px solid ${call.jobStatus === 'CREATED' ? '#bfdbfe' : '#bbf7d0'}`
                    }}>
                      {call.jobStatus || call.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {/* DETAILS button removed per user request */}
                      {call.jobStatus === 'RIO_VERIFIED' && (
                        <button 
                          onClick={() => handleOpenSchedule(call)}
                          style={{ 
                            padding: '6px 12px', 
                            borderRadius: '6px', 
                            border: '1px solid #bbf7d0', 
                            background: '#f0fdf4', 
                            color: '#166534', 
                            fontSize: '11px', 
                            fontWeight: '700', 
                            cursor: 'pointer' 
                          }}
                        >
                          SCHEDULE
                        </button>
                      )}
                      {(call.jobStatus === 'SCHEDULED' || call.status === 'SCHEDULED') && (
                        <button 
                          onClick={() => handleStartInspection(call)}
                          disabled={isSubmitting}
                          style={{ 
                            padding: '6px 12px', 
                            borderRadius: '6px', 
                            border: '1px solid #bfdbfe', 
                            background: isSubmitting ? '#f1f5f9' : '#eff6ff', 
                            color: isSubmitting ? '#94a3b8' : '#1e40af', 
                            fontSize: '11px', 
                            fontWeight: '700', 
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            minWidth: '60px'
                          }}
                        >
                          {isSubmitting ? '...' : 'START'}
                        </button>
                      )}
                      {(call.jobStatus === 'PO_VERIFICATION' || call.status === 'PO_VERIFICATION') && (
                        <button 
                          onClick={() => handleResumeClick(call)}
                          style={{ 
                            padding: '6px 12px', 
                            borderRadius: '6px', 
                            border: '1px solid #fde68a', 
                            background: '#fffbeb', 
                            color: '#92400e', 
                            fontSize: '11px', 
                            fontWeight: '700', 
                            cursor: 'pointer' 
                          }}
                        >
                          RESUME
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Resume Modal */}
      {showResumeModal && (
        <ShiftDutyForm
          hideCompanyAndUnit={true}
          initialData={{
            company: callToResume?.vendorCode || '', 
            unit: callToResume?.plantId || ''
          }}
          onSubmit={handleResumeSubmit}
          onCancel={() => setShowResumeModal(false)}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedCall && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Workflow Details: {selectedCall.requestId}</h2>
              <button onClick={() => setShowDetailsModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#94a3b8', cursor: 'pointer' }}>×</button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                {[
                  { label: 'Transition ID', value: selectedCall.workflowTransitionId },
                  { label: 'Request ID', value: selectedCall.requestId },
                  { label: 'Action', value: selectedCall.action },
                  { label: 'Status', value: selectedCall.status },
                  { label: 'Current Role', value: selectedCall.currentRole },
                  { label: 'Next Role', value: selectedCall.nextRole },
                  { label: 'Shift', value: selectedCall.shift },
                  { label: 'Vendor Code', value: selectedCall.vendorCode },
                  { label: 'Plant ID', value: selectedCall.plantId },
                  { label: 'POI Code', value: selectedCall.poiCode },
                  { label: 'RIO', value: selectedCall.rio || 'N/A' },
                  { label: 'Job Status', value: selectedCall.jobStatus },
                  { label: 'Created By', value: selectedCall.createdBy },
                  { label: 'Created Date', value: new Date(selectedCall.createdDate).toLocaleString() },
                  { label: 'Accessible User IDs', value: selectedCall.accessibleUserIds?.join(', ') || 'N/A' }
                ].map(item => (
                  <div key={item.label}>
                    <label style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '0.025em' }}>{item.label}</label>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', display: 'block', marginBottom: '8px' }}>Action Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks for this action..."
                  style={{ width: '100%', height: '80px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'none', background: '#f9fafb' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                {activeTab === 'pending' && selectedCall.status === 'CREATED' && (
                  <>
                    <button
                      onClick={() => handleAction('VERIFY')}
                      disabled={isSubmitting}
                      style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1, transition: 'all 0.2s' }}
                    >
                      {isSubmitting ? 'Processing...' : 'VERIFY & ACCEPT'}
                    </button>
                    <button
                      onClick={() => handleAction('RETURN')}
                      disabled={isSubmitting}
                      style={{ flex: 1, padding: '12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1, transition: 'all 0.2s' }}
                    >
                      RETURN
                    </button>
                  </>
                )}
                {activeTab === 'pending' && selectedCall.status === 'VERIFIED' && (
                  <button
                    onClick={() => handleAction('INITIATE_INSPECTION')}
                    disabled={isSubmitting}
                    style={{ flex: 1, padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1, transition: 'all 0.2s' }}
                  >
                    {isSubmitting ? 'Processing...' : 'INITIATE INSPECTION'}
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  style={{ padding: '12px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Schedule Modal */}
      {showScheduleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Schedule Inspection
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              Request ID: <span style={{ fontWeight: '700', color: '#334155' }}>{selectedCall?.requestId}</span>
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                Inspection Date
              </label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px'
                }}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                Reason / Remarks (Optional)
              </label>
              <textarea
                value={scheduleReason}
                onChange={(e) => setScheduleReason(e.target.value)}
                placeholder="Enter any specific instructions or reasons..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px',
                  minHeight: '100px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowScheduleModal(false)}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  fontWeight: '600',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={onScheduleSubmit}
                disabled={isSubmitting || !scheduleDate}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isSubmitting || !scheduleDate ? '#94a3b8' : '#3b82f6',
                  fontWeight: '600',
                  color: 'white',
                  cursor: isSubmitting || !scheduleDate ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Scheduling...' : 'Confirm Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendingCallsDashboard;
