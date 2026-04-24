import React, { useState, useMemo, useEffect, useRef } from 'react';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';
import AnnexureLoader from './annexures/AnnexureLoader';

import Notification from './Notification';
import { getProductTypeDisplayName, formatDate } from '../utils/helpers';
import CallsFilterSection from './common/CallsFilterSection';
import { generateRawMaterialCertificate, generateProcessMaterialCertificate, generateFinalProductCertificate, generateFinalCertificate } from '../services/certificateService';
import { fetchCompletedCallsForIC, getCurrentUserId } from '../services/workflowApiService';



const IssuanceOfICTab = ({ calls, setSelectedCall, setCurrentPage }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Call Number');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [isLoadingCertificate, setIsLoadingCertificate] = useState(false);
  const [completedCalls, setCompletedCalls] = useState([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);
  const [filters, setFilters] = useState({
    productTypes: [],
    vendors: [],
    dateFrom: '',
    dateTo: '',
    poNumbers: [],
    stage: '',
    callNumbers: []
  });


  // Helper function to show notifications
  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 5000);
  };

  // Fetch completed calls from API on component mount only if parent didn't provide them.
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    // If parent already passed `calls` prop (from IELandingPage), use that and skip fetching.
    if (Array.isArray(calls) && calls.length > 0) {
      setCompletedCalls(calls);
      hasFetchedRef.current = true;
      return;
    }

    const loadCompletedCalls = async () => {
      if (hasFetchedRef.current) return; // already fetched
      try {
        setIsLoadingCalls(true);
        const userId = getCurrentUserId();

        if (!userId) {
          console.warn('⚠️ User ID not found, cannot fetch completed calls');
          setCompletedCalls([]);
          return;
        }

        const fetched = await fetchCompletedCallsForIC(userId);
        setCompletedCalls(fetched);
        console.log('✅ Loaded completed calls:', fetched);
      } catch (error) {
        console.error('❌ Failed to load completed calls:', error);
        showNotification('Failed to load completed calls. Please refresh the page.', 'error');
        setCompletedCalls([]);
      } finally {
        setIsLoadingCalls(false);
        hasFetchedRef.current = true;
      }
    };

    loadCompletedCalls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calls]);

  // Use completed calls from API instead of filtering from props
  const icCalls = completedCalls;

  // Apply filters to data
  const filteredCalls = useMemo(() => {
    let result = [...icCalls];

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
  }, [icCalls, filters]);

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
    // Commented out: IC Number column removed as requested
    // { key: 'icNo', label: 'IC Number' },
    { key: 'po_no', label: 'PO No.' },
    { key: 'vendor_name', label: 'Vendor Name' },
    { key: 'product_type', label: 'Product Type', render: (val) => getProductTypeDisplayName(val) },
    { key: 'requested_date', label: 'Inspection Date', render: (val) => formatDate(val) },
    { key: 'stage', label: 'Stage' },
    {
      key: 'status',
      label: 'IC Status',
      render: (_val, row) => <StatusBadge status={row.displayStatus || 'IC Pending'} />
    },
  ];



  /**
   * Extract core IC number (call number) from formatted certificate number
   * Examples:
   *   - "N/RM-IC-1767618858167/RAJK" -> "RM-IC-1767618858167"
   *   - "N/ER-01080001/" -> "ER-01080001"
   *   - "RM-IC-1767772023499" -> "RM-IC-1767772023499"
   *   - "ER-01080001" -> "ER-01080001"
   */
  const extractCoreIcNumber = (icNumber) => {
    if (!icNumber) return null;

    // If IC number contains slashes, extract the middle part
    // Pattern: N/CALL-NUMBER/SUFFIX -> CALL-NUMBER
    if (icNumber.includes('/')) {
      const parts = icNumber.split('/');
      // The call number is typically the middle part (index 1)
      // N/ER-01080001/ -> parts = ['N', 'ER-01080001', '']
      // N/RM-IC-1767618858167/RAJK -> parts = ['N', 'RM-IC-1767618858167', 'RAJK']
      if (parts.length >= 2 && parts[1]) {
        return parts[1].trim();
      }
    }

    // If no slashes, return as-is (already in correct format)
    return icNumber;
  };

  /**
   * Handle Issue IC button click
   * Fetches certificate data from backend and navigates to certificate page
   */
  const handleIssueIC = async (row) => {
    try {
      setIsLoadingCertificate(true);
      showNotification('Loading certificate data...', 'info');

      // Try to get IC number from the row data
      const rawIcNumber = row.icNo || row.ic_number || row.call_no;

      if (!rawIcNumber) {
        throw new Error('IC Number not found for this call');
      }

      // Extract core IC number (remove N/ prefix and /RAJK suffix if present)
      const coreIcNumber = extractCoreIcNumber(rawIcNumber);

      console.log('🔍 Raw IC Number:', rawIcNumber);
      console.log('🔍 Core IC Number for API:', coreIcNumber);
      console.log('🔍 Stage:', row.stage);
      console.log('🔍 Checking if EP prefix:', coreIcNumber?.toUpperCase().startsWith('EP-'));
      console.log('🔍 Checking if process stage:', row.stage?.toLowerCase().includes('process'));

      // Call the appropriate certificate generation API based on IC number prefix or stage
      let certificateData;
      if (coreIcNumber?.toUpperCase().startsWith('FINAL-IC-') || row.stage?.toLowerCase().includes('final')) {
        console.log('📋 Generating Final Material certificate for FINAL-IC/final call...');
        certificateData = await generateFinalCertificate(coreIcNumber);
      } else if (coreIcNumber?.toUpperCase().startsWith('FP-') || row.stage?.toLowerCase().includes('final')) {
        console.log('📋 Generating Final Product certificate for FP/final call (legacy)...');
        certificateData = await generateFinalProductCertificate(coreIcNumber);
      } else if (coreIcNumber?.toUpperCase().startsWith('PROC-IC-') || row.stage?.toLowerCase().includes('process')) {
        console.log('📋 Generating Process Material certificate for PROC-IC/process call...');
        certificateData = await generateProcessMaterialCertificate(coreIcNumber);
      } else if (coreIcNumber?.toUpperCase().startsWith('EP-') || row.stage?.toLowerCase().includes('process')) {
        console.log('📋 Generating Process Material certificate for EP/process call (legacy)...');
        certificateData = await generateProcessMaterialCertificate(coreIcNumber);
      } else {
        console.log('📋 Generating Raw Material certificate for non-EP call...');
        certificateData = await generateRawMaterialCertificate(coreIcNumber);
      }

      console.log('✅ Certificate data received:', certificateData);
      console.log('📋 Certificate Number from backend:', certificateData.certificateNo);

      // Merge API data with row data for the certificate component
      // Use certificate number from backend (fetched from inspection_complete_details table)
      const enrichedCallData = {
        ...row,
        ...certificateData,
        // Keep the original IC number
        icNo: rawIcNumber,
        ic_number: rawIcNumber,
        call_no: rawIcNumber
      };

      // Set the selected call with enriched data and navigate to the appropriate IC page
      if (setSelectedCall) setSelectedCall(enrichedCallData);
      if (setCurrentPage) setCurrentPage(getICPageForStage(row.stage, rawIcNumber));

      showNotification('Certificate loaded successfully!', 'success');
    } catch (error) {
      console.error('❌ Error loading certificate:', error);
      showNotification(
        error.message || 'Failed to load certificate data. Please try again.',
        'error'
      );
    } finally {
      setIsLoadingCertificate(false);
    }
  };

  /**
   * Handle View Annexures button click
   */
  const handleViewAnnexures = (row) => {
    if (setSelectedCall) setSelectedCall(row);
    if (setCurrentPage) setCurrentPage('annexure');
  };




  const getICPageForStage = (stage, icNumber) => {
    // First check IC number prefix for EP- (process material)
    if (icNumber?.toUpperCase().includes('EP-')) {
      return 'ic-processmaterial';
    }

    // Then check stage
    if (stage?.toLowerCase().includes('raw')) {
      return 'ic-rawmaterial';
    } else if (stage?.toLowerCase().includes('process')) {
      return 'ic-processmaterial';
    } else if (stage?.toLowerCase().includes('final')) {
      return 'ic-finalproduct';
    }
    return 'ic-rawmaterial'; // default fallback
  };

  const actions = (row) => (
    <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
      <button
        className="btn btn-sm btn-primary"
        onClick={(e) => {
          e.stopPropagation();
          handleIssueIC(row);
        }}
        disabled={isLoadingCertificate}
      >
        {isLoadingCertificate ? 'Loading...' : 'Issue IC'}
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
    <div style={{ padding: 'var(--space-20) 0' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-24)',
        flexWrap: 'wrap',
        gap: 'var(--space-20)'
      }}>
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h2 style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: '700',
            marginBottom: 'var(--space-4)',
            color: 'var(--color-text)'
          }}>
            Issuance of IC & Annexures
          </h2>
          <p style={{
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-base)',
            margin: 0,
            maxWidth: '600px'
          }}>
            Manage inspection certificates and track technical annexures for completed calls in one place.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingCalls && (
        <AnnexureLoader
          title="Fetching Ready Certificates & Annexures"
          subtitle="Gathering inspection data for IC issuance and Annexures..."
        />
      )}

      {/* No Data State */}
      {!isLoadingCalls && icCalls.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-32)' }}>
          <p>No completed calls found for IC issuance.</p>
        </div>
      )}

      {/* Data Display */}
      {!isLoadingCalls && icCalls.length > 0 && (
        <>
          <CallsFilterSection
            allCalls={icCalls}
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
            summaryLabel="IC-ready calls"
          />
          {/* Certificate Generation Notification */}
          {notification.show && (
            <Notification
              message={notification.message}
              type={notification.type}
              autoClose={true}
              autoCloseDelay={5000}
              onClose={() => setNotification({ show: false, message: '', type: '' })}
            />
          )}

          <DataTable
            columns={columns}
            data={filteredCalls}
            actions={actions}
            initialPageSize={10}
            hidePageSize={true}
          />
        </>
      )}

    </div>
  );
};


export default IssuanceOfICTab;