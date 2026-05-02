import React, { useState, useEffect, useMemo, useRef } from 'react';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';
import Notification from './Notification';
import { getProductTypeDisplayName, formatDate } from '../utils/helpers';
import CallsFilterSection from './common/CallsFilterSection';
import { createStageValidationHandler } from '../utils/stageValidation';
import { viewSignedCertificate } from '../services/certificateService';
import { fetchSignedCallsForIC, getCurrentUserId } from '../services/workflowApiService';
import AnnexureLoader from './annexures/AnnexureLoader';

const CompletedCallsTab = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Call Number');
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectionError, setSelectionError] = useState('');
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
        setSelectionError('Failed to load completed calls from server.');
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

    return result;
  }, [completedCalls, filters]);

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

  const selectedCompletedCalls = filteredCalls.filter(call => selectedRows.includes(call.id));

  // Handler to validate and update selection - prevents selecting calls from different stages
  const handleSelectionChange = createStageValidationHandler(
    filteredCalls,
    selectedRows,
    setSelectedRows,
    setSelectionError
  );

  const handleBulkViewPO = () => {
    console.log('View POs for:', selectedCompletedCalls.map(call => call.po_no));
  };

  const handleBulkDownloadPO = () => {
    console.log('Download POs for:', selectedCompletedCalls.map(call => call.po_no));
  };

  const handleViewIC = async (row) => {
    try {
      const icNumber = row.ic_number || row.icNo || row.call_no;
      if (!icNumber) {
        setSelectionError('IC Number not found for this call.');
        return;
      }
      // Using selectionError state to show loading message temporarily
      setSelectionError('Fetching signed IC from Azure...');
      
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
      
      setSelectionError(''); // Clear notification on success
    } catch (err) {
      console.error(err);
      setSelectionError(err.message || 'Failed to fetch IC.');
    }
  };

  const actions = (row) => (
    <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
      <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); handleViewIC(row); }}>
        View IC
      </button>
      {selectedRows.length === 1 && selectedRows.includes(row.id) && (
        <>
          <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); console.log('View PO:', row.po_no); }}>
            View PO
          </button>
          <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); console.log('Download PO:', row.po_no); }}>
            Download PO
          </button>
        </>
      )}
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

      {/* Selection Error Message */}
      <Notification
        message={selectionError}
        type="error"
        autoClose={true}
        autoCloseDelay={5000}
        onClose={() => setSelectionError('')}
      />

      {selectedRows.length > 1 && (
        <div className="pending-calls-bulk-actions" style={{
          marginBottom: 'var(--space-16)',
          padding: 'var(--space-16)',
          background: 'var(--color-bg-1)',
          borderRadius: 'var(--radius-base)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
            {selectedRows.length} completed calls selected
          </div>
          <div className="pending-calls-bulk-actions-buttons" style={{ display: 'flex', gap: 'var(--space-12)' }}>
            <button className="btn btn-secondary" onClick={handleBulkViewPO} style={{ minHeight: '44px' }}>
              VIEW SELECTED PO
            </button>
            <button className="btn btn-primary" onClick={handleBulkDownloadPO} style={{ minHeight: '44px' }}>
              DOWNLOAD SELECTED PO
            </button>
          </div>
        </div>
      )}

      {!isLoadingCalls && completedCalls.length > 0 && (
        <DataTable
          columns={columns}
          data={filteredCalls}
          actions={actions}
          selectable
          selectedRows={selectedRows}
          onSelectionChange={handleSelectionChange}
          initialPageSize={10}
          hidePageSize={true}
        />
      )}
    </div>
  );
};

export default CompletedCallsTab;
