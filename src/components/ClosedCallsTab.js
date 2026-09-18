import React, { useState, useEffect, useMemo, useRef } from 'react';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';
import Notification from './Notification';
import { getProductTypeDisplayName, formatDate } from '../utils/helpers';
import CallsFilterSection from './common/CallsFilterSection';
import { getDetailedStatus } from '../utils/statusMapper';
import { viewSignedCertificate } from '../services/certificateService';
import { fetchClosedCallsForIC, getCurrentUserId } from '../services/workflowApiService';
import AnnexureLoader from './annexures/AnnexureLoader';
import Modal from './Modal';

const ClosedCallsTab = ({ setSelectedCall, setCurrentPage }) => {
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

  const [closedCalls, setClosedCalls] = useState([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(true);
  const [selectedIbsDetail, setSelectedIbsDetail] = useState(null);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const loadCalls = async () => {
      if (hasFetchedRef.current) return;
      try {
        setIsLoadingCalls(true);
        const userId = getCurrentUserId();
        if (!userId) {
          setClosedCalls([]);
          return;
        }
        const fetched = await fetchClosedCallsForIC(userId);
        setClosedCalls(fetched);
      } catch (err) {
        console.error('Error fetching closed calls:', err);
        setNotificationType('error');
        setNotificationMessage('Failed to load closed calls from server.');
      } finally {
        setIsLoadingCalls(false);
        hasFetchedRef.current = true;
      }
    };
    loadCalls();
  }, []);

  // Apply filters to data
  const filteredCalls = useMemo(() => {
    let result = [...closedCalls];

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
  }, [closedCalls, filters, globalSearchTerm]);

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

  const renderIbsStatusBadge = (row) => {
    const rawStatus = (row.ibsStatus || '').toUpperCase().trim();
    let bg = '#fef3c7';
    let color = '#b45309';
    let label = 'PENDING';

    if (rawStatus.includes('SUCCESS') || rawStatus === 'OK') {
      bg = '#dcfce7';
      color = '#15803d';
      label = 'SUCCESS';
    } else if (rawStatus.includes('FAIL') || rawStatus.includes('ERROR') || rawStatus === 'NOK') {
      bg = '#fee2e2';
      color = '#b91c1c';
      label = 'FAIL';
    } else {
      bg = '#fef3c7';
      color = '#b45309';
      label = 'PENDING';
    }

    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            backgroundColor: bg,
            color: color,
            padding: '3px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {label}
        </span>
        {row.ibsReason && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIbsDetail(row);
            }}
            title="View IBS Details"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              padding: 0,
              lineHeight: 1
            }}
          >
            ℹ️
          </button>
        )}
      </div>
    );
  };

  const columns = [
    { key: 'call_no', label: 'Call No.' },
    { key: 'po_no', label: 'PO No.' },
    { key: 'ibsCaseNo', label: 'IBS Case Number' },
    { key: 'vendor_name', label: 'Vendor Name' },
    { key: 'product_type', label: 'Product Type', render: (val) => getProductTypeDisplayName(val) },
    { key: 'requested_date', label: 'Date', render: (val) => formatDate(val) },
    {
      key: 'status',
      label: 'Status',
      render: (_val, row) => {
        const { mainStatus, combinedText } = getDetailedStatus(row.status);
        return <StatusBadge status={mainStatus} text={combinedText} />;
      }
    },
    {
      key: 'ibsStatus',
      label: 'IBS Status',
      render: (_val, row) => renderIbsStatusBadge(row)
    }
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

  const actions = (row) => {
    return (
      <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', alignItems: 'center' }}>
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
  };

  return (
    <div>
      <CallsFilterSection
        allCalls={closedCalls}
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
        summaryLabel="closed calls"
        globalSearchTerm={globalSearchTerm}
        setGlobalSearchTerm={setGlobalSearchTerm}
      />

      {/* Loading State */}
      {isLoadingCalls && (
        <AnnexureLoader
          title="Fetching Closed Calls"
          subtitle="Gathering calls submitted to IBS..."
        />
      )}

      {/* No Data State */}
      {!isLoadingCalls && closedCalls.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-32)' }}>
          <p>No closed calls found.</p>
        </div>
      )}

      {/* Notification Message */}
      <Notification
        message={notificationMessage}
        type={notificationType}
        autoClose={notificationType !== 'info'}
        autoCloseDelay={5000}
        onClose={() => setNotificationMessage('')}
      />

      {!isLoadingCalls && closedCalls.length > 0 && (
        <DataTable
          columns={columns}
          data={filteredCalls}
          actions={actions}
          initialPageSize={10}
          hidePageSize={true}
          hideSearch={true}
        />
      )}

      {/* IBS Detail Modal */}
      {selectedIbsDetail && (
        <Modal
          isOpen={Boolean(selectedIbsDetail)}
          onClose={() => setSelectedIbsDetail(null)}
          title={`IBS Status Details - ${selectedIbsDetail.call_no}`}
          footer={
            <button className="btn btn-secondary" onClick={() => setSelectedIbsDetail(null)}>
              Close
            </button>
          }
        >
          <div style={{ padding: '8px 0', fontSize: '14px' }}>
            <div style={{ marginBottom: '12px' }}>
              <strong>IBS Status: </strong>
              <span>{selectedIbsDetail.ibsStatus || 'N/A'}</span>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>IBS Case Number: </strong>
              <span>{selectedIbsDetail.ibsCaseNo || 'N/A'}</span>
            </div>
            {selectedIbsDetail.ibsReason && (
              <div style={{
                background: '#f8fafc',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}>
                <strong>Response / Reason:</strong>
                <p style={{ margin: '6px 0 0 0', whiteSpace: 'pre-wrap', color: '#334155' }}>
                  {selectedIbsDetail.ibsReason}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ClosedCallsTab;
