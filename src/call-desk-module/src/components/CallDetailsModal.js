import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '../../../services/authService';
import { API_BASE_URL } from '../../../services/apiConfig';
import { formatDateTime } from '../utils/helpers';

const CallDetailsModal = ({
  isOpen,
  onClose,
  call,
  allIEs = [],
  onVerifyAccept,
  onReturn,
  onReroute,
  onDownloadLetter
}) => {
  const [changeIE, setChangeIE] = useState(false);
  const [selectedIE, setSelectedIE] = useState('');
  const [remarks, setRemarks] = useState('');
  
  const [mappedIEs, setMappedIEs] = useState([]);
  const [isLoadingIEs, setIsLoadingIEs] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setChangeIE(false);
      setSelectedIE('');
      setRemarks('');
      setMappedIEs([]);
      
      const fetchMappedIEs = async () => {
        if (!call?.callNumber) return;
        try {
          setIsLoadingIEs(true);
          const response = await axios.get(`${API_BASE_URL}/api/auth/employee-codes/${call.callNumber}`, {
            headers: getAuthHeaders()
          });
          if (response.data && response.data.responseData) {
            const ieList = response.data.responseData;
            setMappedIEs(ieList);
            if (ieList.length === 1) {
              setSelectedIE(ieList[0]);
            }
          }
        } catch (error) {
          console.error("Failed to fetch Mapped IEs", error);
        } finally {
          setIsLoadingIEs(false);
        }
      };
      
      fetchMappedIEs();
    }
  }, [isOpen, call]);

  if (!isOpen || !call) return null;

  const displayValue = (value, fallback = '-') => value || fallback;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '1000px', width: '95%' }}
      >
        <div className="modal-header">
          <h2 className="modal-title">Inspection Call Details - {call.callNumber}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto', padding: '20px' }}>

          {/* Top Summary Section */}
          <div className="summary-banner mb-6" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">Call Number</label>
                <div className="font-bold text-lg">{call.callNumber}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">Vendor Name</label>
                <div className="font-semibold">{call.vendor?.name}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">Place of Inspection</label>
                <div className="font-semibold">{call.placeOfInspection}</div>
              </div>
            </div>
          </div>

          {/* IE Assignment Section */}
          <div className="ie-assignment-section mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="text-blue-800 font-bold mb-3 flex items-center">
              <span className="mr-2">👷</span> IE Assignment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name of IE mapped in System</label>
                {isLoadingIEs ? (
                  <div className="font-semibold p-2 bg-white rounded border border-blue-200">
                    Loading...
                  </div>
                ) : mappedIEs.length === 1 ? (
                  <div className="font-semibold p-2 bg-white rounded border border-blue-200">
                    {mappedIEs[0]}
                  </div>
                ) : mappedIEs.length > 1 ? (
                  <select
                    className="form-control w-full p-2 rounded border border-blue-200 bg-white"
                    value={selectedIE}
                    onChange={(e) => setSelectedIE(e.target.value)}
                  >
                    <option value="">-- Select IE --</option>
                    {mappedIEs.map((ie, index) => (
                      <option key={index} value={ie}>{ie}</option>
                    ))}
                  </select>
                ) : (
                  <div className="font-semibold p-2 bg-white rounded border border-blue-200">
                    {call.assignedIeName || 'System Assigned'}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {/* 
                <label className="flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="mr-2 h-4 w-4"
                    checked={changeIE}
                    onChange={(e) => setChangeIE(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">Do you want to change the IE for this call?</span>
                </label>

                {changeIE && (
                  <div className="animate-fade-in">
                    <label className="block text-xs text-gray-500 mb-1 uppercase font-bold">Select New IE</label>
                    <select
                      className="form-control w-full p-2 rounded border border-blue-300"
                      value={selectedIE}
                      onChange={(e) => setSelectedIE(e.target.value)}
                    >
                      <option value="">-- Select IE --</option>
                      {allIEs.map(ie => (
                        <option key={ie.id} value={ie.id}>{ie.name} ({ie.shortName})</option>
                      ))}
                    </select>
                  </div>
                )}
                */}
              </div>
            </div>
          </div>

          {/* Details Tabs/Sections */}
          <div className="details-container grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* PO Details */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="font-bold border-b pb-2 mb-3 text-gray-700 uppercase text-sm">📄 PO Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between border-b border-gray-50 py-1">
                  <label className="text-gray-500 text-sm">PO Number:</label>
                  <span className="font-medium">{displayValue(call.poNumber)}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 py-1">
                  <label className="text-gray-500 text-sm">Railway:</label>
                  <span className="font-medium">{displayValue(call.rlyShortName)}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 py-1">
                  <label className="text-gray-500 text-sm">Serial No:</label>
                  <span className="font-medium">{displayValue(call.poSerialNo)}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 py-1">
                  <label className="text-gray-500 text-sm">Item Type:</label>
                  <span className="font-medium">{displayValue(call.product)}</span>
                </div>
              </div>
            </div>

            {/* Inspection Details */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="font-bold border-b pb-2 mb-3 text-gray-700 uppercase text-sm">🔍 Call Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between border-b border-gray-50 py-1">
                  <label className="text-gray-500 text-sm">Desired Date:</label>
                  <span className="font-medium">{displayValue(call.desiredInspectionDate)}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 py-1">
                  <label className="text-gray-500 text-sm">Original DP:</label>
                  <span className="font-medium">{displayValue(call.dpDate)}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 py-1">
                  <label className="text-gray-500 text-sm">Extended DP:</label>
                  <span className="font-medium">{displayValue(call.extDpDate)}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 py-1">
                  <label className="text-gray-500 text-sm">Submission:</label>
                  <span className="font-medium">{formatDateTime(call.submissionDateTime)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Remarks Section */}
          <div className="mt-8">
            <label className="block text-sm font-bold text-gray-700 mb-2">Remarks / Observations</label>
            <textarea
              className="form-control w-full p-3 rounded border border-gray-300 focus:border-blue-500"
              rows="3"
              placeholder="Enter remarks for the selected action..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer flex flex-wrap gap-2 justify-between">
          <div className="footer-left">
            <button
              className="btn btn-secondary border-gray-300 hover:bg-gray-50"
              onClick={() => onDownloadLetter(call)}
            >
              📥 Download Call Letter
            </button>
          </div>

          <div className="footer-right flex gap-2">
            <button
              className="btn bg-gray-600 text-white hover:bg-gray-700"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="btn bg-orange-500 text-white hover:bg-orange-600"
              onClick={() => onReroute(call, remarks)}
            >
              🔀 Reroute
            </button>
            <button
              className="btn bg-red-600 text-white hover:bg-red-700"
              onClick={() => onReturn(call, remarks)}
            >
              ↩️ Return
            </button>
            <button
              className="btn bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => {
                let ieId = null;
                if (selectedIE) {
                  const match = String(selectedIE).match(/^(\d+)/);
                  ieId = match ? match[1] : null;
                }
                onVerifyAccept(call, remarks, ieId);
              }}
            >
              ✅ Verify
            </button>
            {call.isVerified && (
              <button
                className="btn bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={() => console.log('Modify Mapping')}
              >
                ✏️ Modify Mapping
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallDetailsModal;

