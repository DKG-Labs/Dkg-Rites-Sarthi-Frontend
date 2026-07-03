import React, { useState, useEffect, useMemo, useRef } from 'react';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';
import Notification from './Notification';
import { getProductTypeDisplayName, formatDate } from '../utils/helpers';
import CallsFilterSection from './common/CallsFilterSection';
import { viewSignedCertificate } from '../services/certificateService';
import { fetchSignedCallsForIC, getCurrentUserId } from '../services/workflowApiService';
import AnnexureLoader from './annexures/AnnexureLoader';

const CompletedCallsTab = ({ setSelectedCall, setCurrentPage }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Call Number');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('error');
  const [filters, setFilters] = useState({
    productTypes: [],
    vendors: [],
    dateFrom: '',
    dateTo: '',
    poNumbers: [],
    stage: '',
    callNumbers: []
  });

  const [completedCalls, setCompletedCalls] = useState([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(true);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const loadCalls = async () => {
      if (hasFetchedRef.current) return;
      try {
        setIsLoadingCalls(true);
        const userId = getCurrentUserId();
        if (!userId) {
          setCompletedCalls([]);
          return;
        }
        const fetched = await fetchSignedCallsForIC(userId);
        // Keep only completed / signed calls
        const validCalls = fetched.filter(c => c.status === 'Completed' || c.status === 'DSC_SIGN_IC' || c.originalStatus === 'DSC_SIGN_IC');
        setCompletedCalls(validCalls);
      } catch (err) {
        console.error('Error fetching completed calls:', err);
        setNotificationType('error');
        setNotificationMessage('Failed to load completed calls from server.');
      } finally {
        setIsLoadingCalls(false);
        hasFetchedRef.current = true;
      }
    };
    loadCalls();
  }, []);

  // Apply filters to data
  const filteredCalls = useMemo(() => {
    let result = [...completedCalls];

    if (filters.productTypes.length > 0) {
      result = result.filter(call => filters.productTypes.includes(call.product_type));
    }
    if (filters.vendors.length > 0) {
      result = result.filter(call => filters.vendors.includes(call.vendor_name));
    }
    if (filters.dateFrom) {
      result = result.filter(call => new Date(call.requested_date) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      result = result.filter(call => new Date(call.requested_date) <= new Date(filters.dateTo));
    }
    if (filters.poNumbers.length > 0) {
      result = result.filter(call => filters.poNumbers.includes(call.po_no));
    }
    if (filters.stage) {
      result = result.filter(call => call.stage === filters.stage);
    }
    if (filters.callNumbers.length > 0) {
      result = result.filter(call => filters.callNumbers.includes(call.call_no));
    }

    if (globalSearchTerm) {
      const lowerSearch = globalSearchTerm.toLowerCase();
      result = result.filter(call => 
        (call.call_no && call.call_no.toLowerCase().includes(lowerSearch)) ||
        (call.po_no && call.po_no.toLowerCase().includes(lowerSearch)) ||
        (call.vendor_name && call.vendor_name.toLowerCase().includes(lowerSearch))
      );
    }

    return result;
  }, [completedCalls, filters, globalSearchTerm]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleMultiSelectToggle = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      productTypes: [],
      vendors: [],
      dateFrom: '',
      dateTo: '',
      poNumbers: [],
      stage: '',
      callNumbers: []
    });
  };

  const columns = [
    { key: 'call_no', label: 'Call No.' },
    { key: 'po_no', label: 'PO No.' },
    { key: 'vendor_name', label: 'Vendor Name' },
    { key: 'product_type', label: 'Product Type', render: (val) => getProductTypeDisplayName(val) },
    { key: 'requested_date', label: 'Date', render: (val) => formatDate(val) },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ];

  const handleViewAnnexures = (row) => {
    if (setSelectedCall) setSelectedCall(row);
    if (setCurrentPage) setCurrentPage('annexure');
  };

  const handleViewIC = async (row) => {
    try {
      const icNumber = row.ic_number || row.icNo || row.call_no;
      if (!icNumber) {
        setNotificationType('error');
        setNotificationMessage('The Inspection Certificate (IC) number was not found for this call.');
        return;
      }
      
      setNotificationType('info');
      setNotificationMessage('Retrieving signed Inspection Certificate...');
      
      const { signedData } = await viewSignedCertificate(icNumber);
      
      const byteCharacters = atob(signedData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      
      setNotificationMessage(''); // Clear notification on success
    } catch (err) {
      console.error(err);
      setNotificationType('error');
      const errMsg = err.message || '';
      if (errMsg.includes('download') || errMsg.includes('Azure') || errMsg.includes('fetch')) {
        setNotificationMessage('The signed Inspection Certificate is temporarily unavailable. Please try again in a few moments.');
      } else if (errMsg.includes('No signed certificate found')) {
        setNotificationMessage('The signed Inspection Certificate is not yet available for this call.');
      } else {
        setNotificationMessage(errMsg || 'Unable to retrieve the signed Inspection Certificate. Please try again.');
      }
    }
  };

  const actions = (row) => (
    <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
      <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); handleViewIC(row); }}>
        View IC
      </button>
      <button
        className="btn btn-sm btn-outline"
        onClick={(e) => {
          e.stopPropagation();
          handleViewAnnexures(row);
        }}
        title="View Technical Annexures"
      >
        Annexures
      </button>
    </div>
  );

  return (
    <div>
      <CallsFilterSection
        allCalls={completedCalls}
        filteredCalls={filteredCalls}
        filters={filters}
        setFilters={setFilters}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        filterSearch={filterSearch}
        setFilterSearch={setFilterSearch}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        clearAllFilters={clearAllFilters}
        handleFilterChange={handleFilterChange}
        handleMultiSelectToggle={handleMultiSelectToggle}
        summaryLabel="completed calls"
        globalSearchTerm={globalSearchTerm}
        setGlobalSearchTerm={setGlobalSearchTerm}
      />

      {/* Loading State */}
      {isLoadingCalls && (
        <AnnexureLoader
          title="Fetching Completed Calls"
          subtitle="Gathering your signed inspection certificates..."
        />
      )}

      {/* No Data State */}
      {!isLoadingCalls && completedCalls.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-32)' }}>
          <p>No signed/completed calls found.</p>
        </div>
      )}

      {/* Selection Notification Message */}
      <Notification
        message={notificationMessage}
        type={notificationType}
        autoClose={notificationType !== 'info'}
        autoCloseDelay={5000}
        onClose={() => setNotificationMessage('')}
      />

      {!isLoadingCalls && completedCalls.length > 0 && (
        <DataTable
          columns={columns}
          data={filteredCalls}
          actions={actions}
          initialPageSize={10}
          hidePageSize={true}
          hideSearch={true}
        />
      )}
    </div>
  );
};

export default CompletedCallsTab;
