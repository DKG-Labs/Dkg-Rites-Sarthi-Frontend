/**
 * Disposed Calls Tab Component
 * Displays disposed calls (read-only)
 */

import React, { useState, useMemo } from 'react';
import DataTable from '../../../components/DataTable';
import StatusBadge from '../../../components/StatusBadge';
import CallsFilterSection from '../../../components/common/CallsFilterSection';
import { getDetailedStatus } from '../../../utils/statusMapper';
import { formatDateTime } from '../utils/helpers';

const DisposedCallsTab = ({ calls = [], onViewHistory }) => {
  const [searchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Product Type');
  const [filters, setFilters] = useState({
    productTypes: [],
    vendors: [],
    dateFrom: '',
    dateTo: '',
    poNumbers: [],
    stage: '',
    callNumbers: []
  });



  // Table columns
  const columns = [
    {
      key: 'callNumber',
      label: 'Call Number',
      sortable: true,
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'vendor',
      label: 'Vendor Name',
      sortable: true,
      render: (value) => <span className="text-sm font-medium">{value?.name || '-'}</span>
    },
    {
      key: 'submissionDateTime',
      label: 'Call Status Date',
      sortable: true,
      render: (value) => <span className="text-xs">{formatDateTime(value)}</span>
    },
    {
      key: 'poNumber',
      label: 'PO Number',
      sortable: true,
      render: (value, row) => (
        <div className="text-xs">
          <div>{value}</div>
          <div className="text-gray-500 font-medium">{row.rlyShortName || '-'}</div>
        </div>
      )
    },
    {
      key: 'productStage',
      label: 'Product Type - Stage',
      sortable: true
    },
    {
      key: 'desiredInspectionDate',
      label: 'Desired Inspection Date',
      sortable: true,
      render: (value) => formatDateTime(value).split(' ')[0]
    },
    {
      key: 'placeOfInspection',
      label: 'Place Of Inspection',
      sortable: true,
      render: (value) => <span className="text-xs font-semibold text-gray-700">{value}</span>
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_value, row) => {
        const { mainStatus, combinedText } = getDetailedStatus(row.originalStatus || row.status);
        return <StatusBadge status={mainStatus} text={combinedText} />;
      }
    },
    {
      key: 'disposalReason',
      label: 'Disposal Reason',
      render: (value) => (
        <span className="text-sm" title={value}>
          {value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : '-'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        return (
          <div className="action-buttons" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => onViewHistory(row)}
              title="View Call History"
            >
              📜 View History
            </button>
          </div>
        );
      }
    }
  ];

  // Apply filters to data - convert Call Desk data structure to match filter expectations
  const filteredCalls = useMemo(() => {
    let result = [...calls];

    // Product Type filter
    if (filters.productTypes.length > 0) {
      result = result.filter(call => filters.productTypes.includes(call.product));
    }

    // Vendor filter
    if (filters.vendors.length > 0) {
      result = result.filter(call => filters.vendors.includes(call.vendor?.name));
    }

    // Date range filter (using submissionDateTime)
    if (filters.dateFrom) {
      result = result.filter(call => new Date(call.submissionDateTime) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      result = result.filter(call => new Date(call.submissionDateTime) <= new Date(filters.dateTo));
    }

    // PO Number filter
    if (filters.poNumbers.length > 0) {
      result = result.filter(call => filters.poNumbers.includes(call.poNumber));
    }

    // Stage filter
    if (filters.stage) {
      result = result.filter(call => call.stage === filters.stage);
    }

    // Call Number filter
    if (filters.callNumbers.length > 0) {
      result = result.filter(call => filters.callNumbers.includes(call.callNumber));
    }

    // Search term filter - comprehensive search across all fields
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(call => {
        const detailed = getDetailedStatus(call.originalStatus || call.status);
        const detailedText = (detailed.combinedText || '').toLowerCase();

        return (
          (call.callNumber && call.callNumber.toLowerCase().includes(term)) ||
          (call.id && String(call.id).toLowerCase().includes(term)) ||
          (call.vendor?.name && call.vendor.name.toLowerCase().includes(term)) ||
          (call.vendorCode && call.vendorCode.toLowerCase().includes(term)) ||
          (call.poNumber && call.poNumber.toLowerCase().includes(term)) ||
          (call.rawPoNo && call.rawPoNo.toLowerCase().includes(term)) ||
          (call.rlyPoSr && call.rlyPoSr.toLowerCase().includes(term)) ||
          (call.rlyShortName && call.rlyShortName.toLowerCase().includes(term)) ||
          (call.ibsCaseNo && call.ibsCaseNo.toLowerCase().includes(term)) ||
          (call.product && call.product.toLowerCase().includes(term)) ||
          (call.productStage && call.productStage.toLowerCase().includes(term)) ||
          (call.stage && call.stage.toLowerCase().includes(term)) ||
          (call.placeOfInspection && call.placeOfInspection.toLowerCase().includes(term)) ||
          (call.poiCode && call.poiCode.toLowerCase().includes(term)) ||
          (call.plantId && call.plantId.toLowerCase().includes(term)) ||
          (call.assignedIE && call.assignedIE.toLowerCase().includes(term)) ||
          (call.status && call.status.toLowerCase().includes(term)) ||
          (call.originalStatus && call.originalStatus.toLowerCase().includes(term)) ||
          (call.disposalReason && call.disposalReason.toLowerCase().includes(term)) ||
          detailedText.includes(term) ||
          (call.submissionDateTime && String(call.submissionDateTime).toLowerCase().includes(term))
        );
      });
    }

    return result;
  }, [calls, filters, searchTerm]);

  // Filter handlers
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

  // Prepare data for CallsFilterSection - map Call Desk data structure to expected format
  const callsForFilter = useMemo(() => calls.map(call => ({
    product_type: call.product,
    vendor_name: call.vendor?.name,
    po_no: call.poNumber,
    call_no: call.callNumber,
    requested_date: call.submissionDateTime,
    stage: call.stage
  })), [calls]);

  // Map filtered calls for CallsFilterSection
  const filteredCallsForFilter = useMemo(() => filteredCalls.map(call => ({
    product_type: call.product,
    vendor_name: call.vendor?.name,
    po_no: call.poNumber,
    call_no: call.callNumber,
    requested_date: call.submissionDateTime,
    stage: call.stage
  })), [filteredCalls]);

  return (
    <div className="calldesk-tab-content">
      {/* Filter Section */}
      <CallsFilterSection
        allCalls={callsForFilter}
        filteredCalls={filteredCallsForFilter}
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
        summaryLabel="disposed calls"
      />

      {/* Info Message */}
      <div className="info-message">
        <span className="info-icon">ℹ️</span>
        <span>This is a read-only archive of disposed calls for reference and audit purposes.</span>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredCalls}
        emptyMessage="No disposed calls found"
        initialSortColumn="submissionDateTime"
        initialSortDirection="desc"
      />
    </div>
  );
};

export default DisposedCallsTab;

