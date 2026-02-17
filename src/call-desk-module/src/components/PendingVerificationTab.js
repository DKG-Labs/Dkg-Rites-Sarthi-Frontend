/**
 * Pending Verification Tab Component
 * Displays pending verification calls with action buttons
 */

import React, { useState, useMemo } from 'react';
import DataTable from '../../../components/DataTable';
import StatusBadge from '../../../components/StatusBadge';
import CallsFilterSection from '../../../components/common/CallsFilterSection';
import { CALL_STATUS_CONFIG } from '../utils/constants';
import { formatDateTime } from '../utils/helpers';

const PendingVerificationTab = ({
  calls = [],
  kpis = {},
  onVerifyAccept,
  onReturn,
  onReroute,
  onViewHistory,
  onViewDetails
}) => {
  const [searchTerm] = useState('');

  // Filter state
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

  // KPI tiles data
  const kpiTiles = [
    {
      label: 'Total Pending',
      value: kpis.total || 0,
      color: '#3b82f6',
      icon: '📋'
    },
    {
      label: 'Fresh Submissions',
      value: kpis.fresh || 0,
      color: '#22c55e',
      icon: '🆕'
    },
    {
      label: 'Resubmissions',
      value: kpis.resubmissions || 0,
      color: '#8b5cf6',
      icon: '🔄'
    },
    {
      label: 'Returned Calls',
      value: kpis.returned || 0,
      color: '#ef4444',
      icon: '↩️'
    }
  ];

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
      render: (value) => value?.name || '-'
    },
    {
      key: 'submissionDateTime',
      label: 'Submission Date/Time',
      sortable: true,
      render: (value) => formatDateTime(value)
    },
    {
      key: 'poNumber',
      label: 'PO Number',
      sortable: true
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
      label: 'Place of Inspection',
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const config = CALL_STATUS_CONFIG[value];
        return config ? (
          <StatusBadge 
            label={config.label}
            color={config.color}
            bgColor={config.bgColor}
            borderColor={config.borderColor}
          />
        ) : null;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="action-buttons">
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => onViewHistory(row)}
            title="View Call History"
          >
            📜 History
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => onViewDetails(row)}
            title="View Full Details"
          >
            👁️ Details
          </button>
          <button
            className="btn btn-sm btn-success"
            onClick={() => onVerifyAccept(row)}
            title="Verify & Accept"
          >
            ✅ Verify
          </button>
          <button
            className="btn btn-sm btn-warning"
            onClick={() => onReturn(row)}
            title="Return for Rectification"
          >
            ↩️ Return
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => onReroute(row)}
            title="Re-route to Another RIO"
          >
            🔀 Re-route
          </button>
        </div>
      )
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

    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(call =>
        call.callNumber?.toLowerCase().includes(term) ||
        call.vendor?.name?.toLowerCase().includes(term) ||
        call.poNumber?.toLowerCase().includes(term) ||
        call.placeOfInspection?.toLowerCase().includes(term)
      );
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
  const callsForFilter = calls.map(call => ({
    ...call,
    product_type: call.product,
    vendor_name: call.vendor?.name,
    po_no: call.poNumber,
    call_no: call.callNumber,
    requested_date: call.submissionDateTime
  }));

  return (

    <div className="tab-content">
      {/* KPI Tiles */}
      <div className="kpi-grid">
        {kpiTiles.map((kpi, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ color: kpi.color }}>
              {kpi.icon}
            </div>
            <div className="stat-content">
              <div className="stat-label">{kpi.label}</div>
              <div className="stat-value" style={{ color: kpi.color }}>
                {kpi.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Section */}
      <CallsFilterSection
        allCalls={callsForFilter}
        filteredCalls={filteredCalls.map(call => ({
          ...call,
          product_type: call.product,
          vendor_name: call.vendor?.name,
          po_no: call.poNumber,
          call_no: call.callNumber,
          requested_date: call.submissionDateTime
        }))}
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
        summaryLabel="pending verification calls"
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredCalls}
        emptyMessage="No pending verification calls found"
      />
    </div>
  );
};

export default PendingVerificationTab;

