import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getAuthHeaders, getStoredUser } from '../../../services/authService';
import { API_BASE_URL } from '../../../services/apiConfig';
import { formatDateTime } from '../utils/helpers';
import { Autocomplete, TextField } from '@mui/material';

const CallDetailsModal = ({
  isOpen,
  onClose,
  call,
  allIEs = [],
  onVerifyAccept,
  onReturn,
  onReroute,
  onWithdraw,
  onDownloadLetter,
  showNotification,
  onRemap
}) => {
  const notify = (msg, type = 'success') => {
    if (showNotification) {
      showNotification(msg, type);
    } else {
      console.log(`[Notification] ${type}: ${msg}`);
    }
  };

  const [selectedIE, setSelectedIE] = useState('');
  const [remarks, setRemarks] = useState('');
  const remarksRef = useRef(null);
  
  const [mappedIEs, setMappedIEs] = useState([]);
  const [currentMappedIEName, setCurrentMappedIEName] = useState(null);
  const [isLoadingIEs, setIsLoadingIEs] = useState(false);
  const [changeIE, setChangeIE] = useState(false);
  const [sleeperRemapUsers, setSleeperRemapUsers] = useState([]);
  const [railpadRemapUsers, setRailpadRemapUsers] = useState([]);

  const [isLoadingRemappingIEs, setIsLoadingRemappingIEs] = useState(false);
  const [remappingPoiCode, setRemappingPoiCode] = useState(null);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawRemarks, setWithdrawRemarks] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [validationError, setValidationError] = useState('');

  const [remapAvailableUsers, setRemapAvailableUsers] = useState([]);

  const filteredIEs = React.useMemo(() => {
    if (call?.callNumber?.startsWith('SF') || call?.callNumber?.startsWith('SR')) {
      if (sleeperRemapUsers && sleeperRemapUsers.length > 0) {
        return sleeperRemapUsers;
      }
      return (allIEs || []).filter(ie => {
        const r = (ie.roleName || ie.role || '').trim().toLowerCase();
        return r === 'main ie' || r.includes('main ie');
      });
    }
    if (call?.callNumber?.startsWith('RPF') || call?.callNumber?.startsWith('RPP') || call?.callNumber?.startsWith('RP')) {
      if (railpadRemapUsers && railpadRemapUsers.length > 0) {
        return railpadRemapUsers;
      }
      return (allIEs || []).filter(ie => {
        const r = (ie.roleName || ie.role || '').trim().toLowerCase();
        return r === 'rail main ie' || r.includes('rail main ie') || r === 'main ie';
      });
    }
    if (call?.callNumber?.startsWith('ER') || call?.callNumber?.startsWith('EF')) {
      if (remapAvailableUsers && remapAvailableUsers.length > 0) {
        return remapAvailableUsers;
      }
      return (allIEs || []).filter(ie => {
        const r = (ie.roleName || ie.role || '').trim().toLowerCase();
        return r === 'ie' || r.includes('ie');
      });
    }
    if (!allIEs || allIEs.length === 0) return [];
    if (call?.callNumber?.startsWith('EP')) {
      return allIEs.filter(ie => {
        const r = (ie.roleName || ie.role || '').trim().toLowerCase();
        return r === 'process ie' || r.includes('process ie');
      });
    }
    return allIEs.filter(ie => {
      const r = (ie.roleName || ie.role || '').trim().toLowerCase();
      return r.includes('ie');
    });
  }, [call?.callNumber, allIEs, sleeperRemapUsers, railpadRemapUsers, remapAvailableUsers]);

  const handleOpenRemapping = async () => {
    setChangeIE(true);
    setIsLoadingRemappingIEs(true);
    try {
      if (call.callNumber.startsWith('RPF') || call.callNumber.startsWith('RPP') || call.callNumber.startsWith('RP')) {
        try {
          const ieRes = await axios.get(`${API_BASE_URL}/api/railpad-workflow/remap-available-users`, { headers: getAuthHeaders() });
          const rawData = ieRes.data?.responseData || [];
          setRailpadRemapUsers(rawData.map(u => ({
            id: u.userId || u.id,
            name: u.fullName || u.name,
            employeeCode: u.employeeCode,
            roleName: u.role || 'Rail Main IE'
          })));
        } catch (e) {
          console.error("Error fetching Rail Main IE users:", e);
        }
        return;
      }

      if (call.callNumber.startsWith('SF') || call.callNumber.startsWith('SR')) {
        const ieRes = await axios.get(`${API_BASE_URL}/api/sleeper-workflow/remap-available-users`, { headers: getAuthHeaders() });
        const rawData = ieRes.data?.responseData || [];
        setSleeperRemapUsers(rawData.map(u => ({
          id: u.userId || u.id,
          name: u.fullName || u.name,
          employeeCode: u.employeeCode,
          roleName: u.role || 'Main IE'
        })));
        return;
      }

      // For ER / EF calls: Fetch all users whose role is IE
      if (call.callNumber.startsWith('ER') || call.callNumber.startsWith('EF')) {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/auth/api/users/by-role`, {
            params: { roleName: 'IE' },
            headers: getAuthHeaders()
          });
          const list = res.data?.responseData || [];
          if (list.length > 0) {
            setRemapAvailableUsers(list.map(u => ({
              id: u.userId || u.id,
              name: u.fullName || u.userName,
              employeeCode: u.employeeCode,
              roleName: u.roleName || u.role || 'IE'
            })));
          }
        } catch (e) {
          console.error("Error fetching IE users by role:", e);
        }
      }

      // 1. Fetch POI Codes and store in localStorage
      const poiRes = await axios.get(`${API_BASE_URL}/api/auth/${call.callNumber}/poi-codes`, { headers: getAuthHeaders() });
      const data = poiRes.data?.responseData || poiRes.data || [];
      const poiArray = Array.isArray(data) ? data : [data];
      localStorage.setItem('remappingData', JSON.stringify(poiArray));

      let currentPoiCode = null;
      if (poiArray.length > 0) {
        currentPoiCode = poiArray[0].poiCode || poiArray[0].poicode || poiArray[0];
      }
      if (!currentPoiCode && call.placeOfInspection) {
        currentPoiCode = call.placeOfInspection;
      }
      setRemappingPoiCode(currentPoiCode);

      if (!currentPoiCode) {
        console.warn("No POI Code found for this call");
        notify("Please contact admin to do mapping. No POI Code is available for this call.", "warning");
      } else {
        // 2. Fetch IEs based on call type
        if (call.callNumber.startsWith('ER') || call.callNumber.startsWith('EF')) {
          const ieRes = await axios.get(`${API_BASE_URL}/api/auth/getEmpBYcompany/${currentPoiCode}`, { headers: getAuthHeaders() });
          const rawData = ieRes.data?.responseData || ieRes.data || [];
          console.log("Raw ER/EF IE remapping data:", rawData);
          localStorage.setItem('remappingDataER', JSON.stringify(rawData));
        } else if (call.callNumber.startsWith('EP')) {
          const ieRes = await axios.get(`${API_BASE_URL}/api/auth/poi/${currentPoiCode}/getProcessIeByPOI`, { headers: getAuthHeaders() });
          const rawData = ieRes.data?.responseData || ieRes.data || [];
          console.log("Raw EP IE remapping data:", rawData);
          localStorage.setItem('remappingDataEP', JSON.stringify(rawData));
        }
      }
    } catch (error) {
      console.error("Error fetching remapping details:", error);
    } finally {
      setIsLoadingRemappingIEs(false);
    }
  };

  const fetchMappedIEs = React.useCallback(async () => {
    if (!call?.callNumber) return;
    try {
      setIsLoadingIEs(true);
      if (call.callNumber.startsWith('RPF') || call.callNumber.startsWith('RPP') || call.callNumber.startsWith('RP')) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/railpad-workflow/call-mapped-ie/${call.callNumber}`, {
            headers: getAuthHeaders()
          });
          if (response.data && response.data.responseData) {
            const ieList = response.data.responseData;
            if (Array.isArray(ieList) && ieList.length > 0) {
              setMappedIEs(ieList);
              setCurrentMappedIEName(ieList[0]);
            } else if (typeof ieList === 'string' && ieList.trim().length > 0) {
              setMappedIEs([ieList]);
              setCurrentMappedIEName(ieList);
            }
          }
        } catch (e) {
          console.warn("Could not fetch Railpad mapped IE:", e);
        }
      } else if (call.callNumber.startsWith('SF') || call.callNumber.startsWith('SR')) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/sleeper-workflow/call-mapped-ie/${call.callNumber}`, {
            headers: getAuthHeaders()
          });
          if (response.data && response.data.responseData) {
            const ieList = response.data.responseData;
            if (Array.isArray(ieList) && ieList.length > 0) {
              setMappedIEs(ieList);
              setCurrentMappedIEName(ieList[0]);
            } else if (typeof ieList === 'string' && ieList.trim().length > 0) {
              setMappedIEs([ieList]);
              setCurrentMappedIEName(ieList);
            }
          }
        } catch (e) {
          console.warn("Could not fetch Sleeper mapped IE:", e);
        }
      } else if (call.callNumber.startsWith('ER') || call.callNumber.startsWith('EF') || call.callNumber.startsWith('EP')) {
        const response = await axios.get(`${API_BASE_URL}/api/auth/employee-codes/${call.callNumber}`, {
          headers: getAuthHeaders()
        });
        if (response.data && response.data.responseData) {
          const ieList = response.data.responseData;
          if (Array.isArray(ieList)) {
            setMappedIEs(ieList);
            if (ieList.length > 0) {
              setCurrentMappedIEName(ieList[0]);
              if (ieList.length === 1) setSelectedIE(ieList[0]);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch Mapped IEs", error);
    } finally {
      setIsLoadingIEs(false);
    }
  }, [call?.callNumber]);

  useEffect(() => {
    if (isOpen && call?.callNumber) {
      setChangeIE(false);
      setSelectedIE('');
      setRemarks('');
      setValidationError('');
      setCurrentMappedIEName(call.assignedToUserName || call.assignedIeName || call.assignedIE || null);
      fetchMappedIEs();
    }
  }, [isOpen, call?.callNumber, fetchMappedIEs]);

  const handleSubmitRemapping = async () => {
    if (!selectedIE) {
      notify('Please select an IE to remap', 'error');
      return;
    }

    const availableIEs = filteredIEs;
    const selectedIEData = availableIEs.find(ie => String(ie.id) === String(selectedIE));
    
    if (!selectedIEData) { 
      notify('Invalid selection', 'error'); 
      return; 
    }

    const newIeName = selectedIEData.name || selectedIEData.fullName || '';

    try {
      if (call.callNumber.startsWith('RPF') || call.callNumber.startsWith('RPP') || call.callNumber.startsWith('RP')) {
        const payload = {
          callNo: call.callNumber,
          plantId: call.plantId,
          oldUserId: Number(call.assignedToUser || 0),
          newUserId: Number(selectedIEData.id)
        };
        await axios.post(`${API_BASE_URL}/api/railpad-workflow/remap-pending`, payload, { headers: getAuthHeaders() });
        notify('Rail Main IE remapped successfully', 'success');
        setCurrentMappedIEName(newIeName);
        setMappedIEs([newIeName]);
        if (call) {
          call.assignedToUserName = newIeName;
          call.assignedIE = newIeName;
          call.assignedIeName = newIeName;
        }
        fetchMappedIEs();
      } else if (call.callNumber.startsWith('SF') || call.callNumber.startsWith('SR')) {
        const payload = {
          callNo: call.callNumber,
          plantId: call.plantId,
          oldUserId: Number(call.assignedToUser || 0),
          newUserId: Number(selectedIEData.id)
        };
        await axios.post(`${API_BASE_URL}/api/sleeper-workflow/remap-submit`, payload, { headers: getAuthHeaders() });
        notify('Sleeper Main IE remapped successfully', 'success');
        setCurrentMappedIEName(newIeName);
        setMappedIEs([newIeName]);
        if (call) {
          call.assignedToUserName = newIeName;
          call.assignedIE = newIeName;
          call.assignedIeName = newIeName;
        }
        fetchMappedIEs();
      } else {
        let stageCode = 'ER';
        if (call.callNumber.startsWith('EP')) stageCode = 'EP';
        if (call.callNumber.startsWith('EF')) stageCode = 'EF';

        const poiCode = remappingPoiCode || call.placeOfInspection || '';
        if (!poiCode) {
          notify('Please contact admin to do mapping. No POI Code is available for this call.', 'warning');
          return;
        }

        const payload = {
          callNo: call.callNumber,
          poiCode: poiCode,
          previousEmpCode: '',
          newEmpCode: selectedIEData.employeeCode,
          stage: stageCode
        };

        await axios.post(`${API_BASE_URL}/api/call-desk/remap-submit`, payload, { headers: getAuthHeaders() });
        notify('Inspection Engineer reassigned successfully', 'success');
        setCurrentMappedIEName(newIeName);
        setMappedIEs([newIeName]);
        if (call) {
          call.assignedToUserName = newIeName;
          call.assignedIE = newIeName;
          call.assignedIeName = newIeName;
        }
        fetchMappedIEs();
      }
      
      setChangeIE(false);
      setSelectedIE('');
      if (onRemap) {
        onRemap();
      }
    } catch (error) {
      console.error("Error submitting remapping:", error);
      notify(error.response?.data?.message || "Failed to submit remapping. Check console for details.", 'error');
    }
  };

  const handleWithdrawSubmit = async () => {
    if (!withdrawRemarks.trim()) {
      notify("Please provide remarks for withdrawal.", 'error');
      return;
    }
    try {
      setIsWithdrawing(true);
      const user = getStoredUser();
      
      const payload = {
        workflowTransitionId: call.workflowTransitionId || call.id,
        requestId: call.callNumber,
        action: "WITHDRAW",
        remarks: withdrawRemarks.trim(),
        actionBy: Number(user?.userId || 0)
      };

      await axios.post(`${API_BASE_URL}/api/workflow/withdraw`, payload, {
        headers: getAuthHeaders()
      });
      
      notify('Inspection call successfully withdrawn.', 'success');
      setShowWithdrawModal(false);
      onClose();
      if (onWithdraw) {
        onWithdraw();
      }
    } catch (error) {
      console.error("Error withdrawing call:", error);
      notify("Failed to withdraw call. Please try again.", 'error');
    } finally {
      setIsWithdrawing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedIE('');
      setRemarks('');
      setMappedIEs([]);
      setCurrentMappedIEName(null);
      setChangeIE(false);
      setShowWithdrawModal(false);
      setShowVerifyModal(false);
      setWithdrawRemarks('');
      
      fetchMappedIEs();
    }
  }, [isOpen, call, fetchMappedIEs]);

  if (!isOpen || !call) return null;

  const isEpCall = Boolean(
    (call.callNumber && call.callNumber.startsWith('EP')) ||
    (call.stageOfInspection && call.stageOfInspection.toLowerCase() === 'process' && !call.callNumber?.startsWith('RP')) ||
    (call.productStage && call.productStage.toLowerCase() === 'process' && !call.callNumber?.startsWith('RP'))
  );

  const displayValue = (value, fallback = '-') => value || fallback;

  // Resolve Target IE for confirmation
  let targetIEDisplay = '-';
  if (selectedIE) {
    const match = filteredIEs.find(ie => String(ie.id) === String(selectedIE));
    if (match) targetIEDisplay = match.name;
    else targetIEDisplay = selectedIE;
  } else if (currentMappedIEName) {
    targetIEDisplay = currentMappedIEName;
  } else if (mappedIEs.length > 0) {
    targetIEDisplay = mappedIEs[0];
  } else if (call.assignedIeName) {
    targetIEDisplay = call.assignedIeName;
  } else if (call.assignedIE && call.assignedIE !== '-') {
    targetIEDisplay = call.assignedIE;
  } else if (call.ieName) {
    targetIEDisplay = call.ieName;
  } else if (call.assignedToUserName) {
    targetIEDisplay = call.assignedToUserName;
  }

  const downloadPoDoc = async () => {
    const rawPoNo = call.rawPoNo || (call.poNumber && call.poNumber !== '-' ? call.poNumber : '');
    if (!rawPoNo) {
      if (showNotification) showNotification('No PO number available for this call.', 'error');
      else alert('No PO number available for this call.');
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendor/po-pdf-path`, {
        params: { rawPoNo },
        headers: getAuthHeaders()
      });
      const pdfPath = response.data?.responseData;
      if (!pdfPath) {
        if (showNotification) showNotification('No PO document found for this PO.', 'error');
        else alert('No PO document found for this PO.');
        return;
      }
      if (pdfPath.startsWith('http') || pdfPath.includes('ireps.gov.in')) {
        const proxyUrl = `${API_BASE_URL}/api/vendor/proxy-pdf?url=${encodeURIComponent(pdfPath)}`;
        const a = document.createElement('a');
        a.href = proxyUrl;
        a.download = `PO_${call.poNumber || rawPoNo}.pdf`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        window.open(pdfPath, '_blank');
      }
    } catch (err) {
      console.error('Error downloading PO document:', err);
      if (showNotification) showNotification('Failed to download PO document.', 'error');
      else alert('Failed to download PO document.');
    }
  };

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
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm mb-6">
            <h4 className="font-bold border-b pb-3 mb-4 text-gray-700 uppercase text-sm flex items-center">
              <span className="mr-2 text-lg">👷</span> IE Assignment Configuration
            </h4>
            
            <div className="flex flex-col md:flex-row items-end gap-6 pb-2">
              {/* Left Column: Current IE */}
              <div className="flex-1 w-full">
                <label className="block text-xs text-gray-500 uppercase font-bold mb-2">Current System Mapped IE</label>
                {isLoadingIEs ? (
                  <div className="text-sm font-semibold text-blue-600 pt-1 animate-pulse">Loading assigned IE...</div>
                ) : (currentMappedIEName || mappedIEs.length === 1) ? (
                  <div className="font-bold text-lg text-gray-800 p-2.5 bg-gray-50 rounded border border-gray-200 w-full h-11 flex items-center">
                    {currentMappedIEName || mappedIEs[0]}
                  </div>
                ) : mappedIEs.length > 1 ? (
                  <Autocomplete
                    options={mappedIEs}
                    getOptionLabel={(option) => option}
                    renderOption={(props, option, { index }) => (
                      <li {...props} key={`mapped-ie-${index}-${option}`}>
                        {option}
                      </li>
                    )}
                    value={selectedIE || null}
                    onChange={(event, newValue) => {
                      setSelectedIE(newValue || '');
                    }}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        placeholder="Select Current IE..." 
                        variant="outlined" 
                        size="small" 
                      />
                    )}
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { backgroundColor: '#f9fafb', height: '44px' } }}
                  />
                ) : (
                  <div className={`font-bold text-sm p-2.5 rounded border w-full h-11 flex items-center ${
                    !(currentMappedIEName || (mappedIEs.length > 0) || call.assignedToUserName || call.assignedIeName || (call.assignedIE && call.assignedIE !== '-') || call.ieName)
                      ? 'bg-amber-50 border-amber-200 text-amber-700' 
                      : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}>
                    {currentMappedIEName || (mappedIEs.length > 0 ? mappedIEs[0] : null) || call.assignedToUserName || call.assignedIeName || (call.assignedIE && call.assignedIE !== '-' ? call.assignedIE : null) || call.ieName || (
                      call.callNumber?.startsWith('RP') 
                        ? 'No Railpad main IE has been mapped' 
                        : (call.callNumber?.startsWith('ER') || call.callNumber?.startsWith('EF'))
                        ? 'Please contact admin to do mapping'
                        : call.callNumber?.startsWith('EP')
                        ? 'No Process IE has been mapped'
                        : (call.callNumber?.startsWith('SF') || call.callNumber?.startsWith('SR'))
                        ? 'No Sleeper Main IE has been mapped'
                        : 'System Assigned'
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Re-assignment Options */}
              {!isEpCall && (
                <div className="w-full md:w-auto mt-4 md:mt-0 pb-1">
                  <button
                    className="w-full md:w-auto bg-indigo-600 text-white hover:bg-indigo-700 font-bold py-2.5 px-6 rounded shadow-md transition-all active:scale-95 flex items-center justify-center whitespace-nowrap h-11"
                    onClick={handleOpenRemapping}
                    disabled={isLoadingRemappingIEs}
                  >
                    <span className="mr-2">🔄</span>{isLoadingRemappingIEs ? " Loading..." : " Remapping"}
                  </button>
                </div>
              )}
            </div>

            {/* Remapping Popup Module */}
            {changeIE && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={(e) => { if(e.target === e.currentTarget) { setChangeIE(false); setSelectedIE(''); } }}>
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in mx-4 transform transition-all">
                  <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
                    <h3 className="font-bold text-indigo-900 text-lg flex items-center">
                      <span className="mr-2">🔄</span> IE Remapping
                    </h3>
                    <button 
                      className="text-gray-400 hover:text-red-600 focus:outline-none transition-colors"
                      onClick={() => { setChangeIE(false); setSelectedIE(''); }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <label className="block text-xs text-indigo-700 uppercase font-bold mb-3 tracking-wide">Select Available IE</label>
                    <Autocomplete
                      id="ie-select"
                      options={filteredIEs}
                      getOptionLabel={(option) => option ? (option.employeeCode ? `${option.name || option.fullName || ''} (${option.employeeCode})` : (option.name || option.fullName || '')) : ''}
                      renderOption={(props, option, { index }) => (
                        <li {...props} key={option.id ? `remap-ie-${option.id}-${index}` : `remap-ie-${index}`}>
                          {option.employeeCode ? `${option.name || option.fullName || ''} (${option.employeeCode})` : (option.name || option.fullName || '')}
                        </li>
                      )}
                      value={filteredIEs.find(ie => String(ie.id) === String(selectedIE)) || null}
                      onChange={(event, newValue) => {
                        setSelectedIE(newValue ? String(newValue.id) : '');
                      }}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          placeholder="Type to search available IEs..." 
                          variant="outlined" 
                          size="medium" // Slightly larger for the popup
                        />
                      )}
                      sx={{
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8fafc',
                          '&:hover fieldset': { borderColor: '#4f46e5' },
                          '&.Mui-focused fieldset': { borderColor: '#4f46e5', borderWidth: '2px' },
                        }
                      }}
                    />
                  </div>
                  
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button 
                      className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold py-2 px-6 rounded-md text-sm transition-colors shadow-sm"
                      onClick={() => { 
                        setChangeIE(false); 
                        setSelectedIE(''); 
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-md text-sm transition-colors shadow-md transform hover:-translate-y-0.5"
                      onClick={handleSubmitRemapping}
                    >
                      Remapping
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Withdraw Popup Module */}
            {showWithdrawModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={(e) => { if(e.target === e.currentTarget) { setShowWithdrawModal(false); } }}>
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in mx-4 transform transition-all">
                  <div className="bg-gradient-to-r from-red-50 to-white px-6 py-4 border-b border-red-100 flex justify-between items-center">
                    <h3 className="font-bold text-red-900 text-lg flex items-center">
                      <span className="mr-2">📥</span> Withdraw Call
                    </h3>
                    <button 
                      className="text-gray-400 hover:text-red-600 focus:outline-none transition-colors"
                      onClick={() => setShowWithdrawModal(false)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <label className="block text-xs text-red-700 uppercase font-bold mb-3 tracking-wide">Remarks <span className="text-red-500">*</span></label>
                    <textarea
                      className="form-control w-full p-3 rounded border border-gray-300 focus:border-red-500 min-h-[100px]"
                      placeholder="Please provide details for withdrawal..."
                      value={withdrawRemarks}
                      onChange={(e) => setWithdrawRemarks(e.target.value)}
                    />
                  </div>

                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button 
                      className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-2 px-6 rounded-md text-sm transition-colors shadow-sm"
                      onClick={() => setShowWithdrawModal(false)}
                      disabled={isWithdrawing}
                    >
                      Cancel
                    </button>
                    <button 
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md text-sm transition-colors shadow-md flex items-center"
                      onClick={handleWithdrawSubmit}
                      disabled={isWithdrawing}
                    >
                      {isWithdrawing ? "Withdrawing..." : "Submit"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Verify Confirmation Popup Module */}
            {showVerifyModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={(e) => { if(e.target === e.currentTarget) { setShowVerifyModal(false); } }}>
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in mx-4 transform transition-all">
                  <div className="bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-blue-100 flex justify-between items-center">
                    <h3 className="font-bold text-blue-900 text-lg flex items-center">
                      <span className="mr-2">✅</span> Verify Inspection Call
                    </h3>
                    <button 
                      className="text-gray-400 hover:text-red-600 focus:outline-none transition-colors"
                      onClick={() => setShowVerifyModal(false)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                      ℹ️
                    </div>
                    <p className="text-gray-600 mb-2">The inspection call will be verified and assigned to:</p>
                    <div className="text-xl font-bold text-gray-900 bg-gray-50 p-4 rounded-lg border border-gray-100">
                      {targetIEDisplay}
                    </div>
                    <p className="text-xs text-gray-400 mt-4 uppercase tracking-widest font-semibold italic">Please confirm to proceed</p>
                  </div>

                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button 
                      className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-2 px-6 rounded-md text-sm transition-colors shadow-sm"
                      onClick={() => setShowVerifyModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md text-sm transition-colors shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
                      onClick={() => {
                        let ieId = null;
                        if (selectedIE) {
                          const match = String(selectedIE).match(/^(\d+)/);
                          ieId = match ? match[1] : null;
                        }
                        onVerifyAccept(call, remarks, ieId);
                        setShowVerifyModal(false);
                      }}
                    >
                      Confirm Verification
                    </button>
                  </div>
                </div>
              </div>
            )}
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
              ref={remarksRef}
              className="form-control w-full p-3 rounded border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-sm"
              rows="3"
              placeholder="Enter remarks for the selected action..."
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                if (validationError) setValidationError('');
              }}
            />
            {validationError && (
              <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-500 rounded-r shadow-sm flex items-start gap-3 animate-slideDown">
                <div className="mt-0.5 text-red-500">
                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                   </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-red-700 text-sm font-bold tracking-wide">Action Required</span>
                  <p className="text-red-600 text-xs mt-0.5 leading-relaxed">{validationError}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer flex flex-wrap gap-2 justify-between">
          <div className="footer-left" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary border-gray-300 hover:bg-gray-50"
              onClick={() => onDownloadLetter(call)}
            >
              📥 Download Call Letter
            </button>
            <button
              className="btn"
              style={{ background: '#0ea5e9', color: 'white', border: 'none' }}
              onClick={downloadPoDoc}
              title="Download PO Document"
            >
              📄 Download PO
            </button>
          </div>

          <div className="footer-right flex gap-2">
            <button
              className="btn bg-orange-500 text-white hover:bg-orange-600"
              onClick={() => onReroute(call, remarks)}
            >
              🔀 Reroute
            </button>
            <button
              className="btn bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                if (!remarks.trim()) {
                  setValidationError('Remarks are mandatory for returning a call');
                  // Auto-scroll to field & focus
                  remarksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  remarksRef.current?.focus();
                } else {
                  setShowReturnModal(true);
                }
              }}
            >
              ↩️ Return
            </button>
            <div className="relative group">
              <button
                className={`btn ${
                  call.callNumber?.startsWith('RP') && !call.assignedIeName && (!mappedIEs || mappedIEs.length === 0)
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                onClick={() => {
                  if (call.callNumber?.startsWith('RP') && !call.assignedIeName && (!mappedIEs || mappedIEs.length === 0)) {
                    // Do nothing, button is disabled
                    return;
                  }
                  setShowVerifyModal(true);
                }}
                disabled={call.callNumber?.startsWith('RP') && !call.assignedIeName && (!mappedIEs || mappedIEs.length === 0)}
              >
                ✅ Verify
              </button>
              
              {call.callNumber?.startsWith('RP') && !call.assignedIeName && (!mappedIEs || mappedIEs.length === 0) && (
                <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-red-100 text-red-700 text-xs font-semibold rounded shadow-lg border border-red-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  ⚠️ Verification is disabled because no Railpad Main IE has been mapped for this vendor's POI.
                </div>
              )}
            </div>

            {/* Return Confirmation Modal */}
            {showReturnModal && (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm animate-fadeIn">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-scaleIn">
                  <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-red-700 flex items-center gap-2">
                       ↩️ Confirm Return
                    </h3>
                    <button 
                      className="text-red-300 hover:text-red-600 focus:outline-none transition-colors"
                      onClick={() => setShowReturnModal(false)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                      ⚠️
                    </div>
                    <p className="text-gray-600 mb-2">Are you sure you want to return this Inspection Call?</p>
                    <div className="text-xl font-bold text-gray-900 bg-gray-50 p-4 rounded-lg border border-gray-100 mb-2">
                      {call.callNumber}
                    </div>
                    <p className="text-sm text-gray-500 italic">"The call will be sent back to the vendor for rectification."</p>
                  </div>

                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button 
                      className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-2 px-6 rounded-md text-sm transition-colors shadow-sm"
                      onClick={() => setShowReturnModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md text-sm transition-colors shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
                      onClick={() => {
                        onReturn(call, remarks);
                        setShowReturnModal(false);
                      }}
                    >
                      Confirm Return
                    </button>
                  </div>
                </div>
              </div>
            )}
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

