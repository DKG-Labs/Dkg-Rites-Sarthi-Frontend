/**
 * Verified & Open Calls Tab Component
 * Displays verified and open calls (read-only)
 */

import React, { useState, useMemo } from 'react';
import DataTable from '../../../components/DataTable';
import StatusBadge from '../../../components/StatusBadge';
import CallsFilterSection from '../../../components/common/CallsFilterSection';
import { CALL_STATUS_CONFIG } from '../utils/constants';
import { formatDateTime } from '../utils/helpers';

const VerifiedOpenCallsTab = ({ calls = [], kpis = {}, onViewHistory }) => {
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
    callNumbers: [],
    statuses: []
  });


  // KPI tiles data
  const kpiTiles = [
    {
      label: 'Verified & Registered',
      value: kpis.verifiedRegistered || 0,
      color: '#22c55e',
      icon: '✅'
    },
    {
      label: 'IE Assignment Pending',
      value: kpis.ieAssignmentPending || 0,
      color: '#f59e0b',
      icon: '⏳'
    },
    {
      label: 'Assigned to IE',
      value: kpis.assignedToIE || 0,
      color: '#3b82f6',
      icon: '👤'
    },
    {
      label: 'Scheduled',
      value: kpis.scheduled || 0,
      color: '#eab308',
      icon: '📅'
    },
    {
      label: 'Under Inspection',
      value: kpis.underInspection || 0,
      color: '#f97316',
      icon: '🔍'
    },
    {
      label: 'Under Lab Testing',
      value: kpis.underLabTesting || 0,
      color: '#a855f7',
      icon: '🧪'
    },
    {
      label: 'IC Pending',
      value: kpis.icPending || 0,
      color: '#ef4444',
      icon: '📄'
    },
    {
      label: 'Billing Pending',
      value: kpis.billingPending || 0,
      color: '#a855f7',
      icon: '💰'
    },
    {
      label: 'Payment Pending',
      value: kpis.paymentPending || 0,
      color: '#6b7280',
      icon: '💳'
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
        ) : value || '-';
      }
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
      key: 'assignedIE',
      label: 'Assigned IE',
      render: (value) => value || '-'
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
            📜 View History
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

    // Status filter
    if (filters.statuses.length > 0) {
      result = result.filter(call => filters.statuses.includes(call.status));
    }

    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(call =>
        call.callNumber?.toLowerCase().includes(term) ||
        call.vendor?.name?.toLowerCase().includes(term) ||
        call.poNumber?.toLowerCase().includes(term) ||
        call.placeOfInspection?.toLowerCase().includes(term) ||
        call.assignedIE?.toLowerCase().includes(term)
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
      callNumbers: [],
      statuses: []
    });
  };

  // Status mapping for KPI tiles to facilitate filtering
  const statusKeyMap = {
    'Verified & Registered': 'verified_registered',
    'IE Assignment Pending': 'ie_assignment_pending',
    'Assigned to IE': 'assigned_to_ie',
    'Scheduled': 'scheduled',
    'Under Inspection': 'under_inspection',
    'Under Lab Testing': 'under_lab_testing',
    'IC Pending': 'ic_pending',
    'Billing Pending': 'billing_pending',
    'Payment Pending': 'payment_pending'
  };

  const handleKpiClick = (label) => {
    const statusKey = statusKeyMap[label];
    if (statusKey) {
      handleMultiSelectToggle('statuses', statusKey);
    }
  };

  // Prepare data for CallsFilterSection - map Call Desk data structure to expected format
  const callsForFilter = useMemo(() => calls.map(call => ({
    product_type: call.product,
    vendor_name: call.vendor?.name,
    po_no: call.poNumber,
    call_no: call.callNumber,
    requested_date: call.submissionDateTime,
    stage: call.stage,
    status: call.status,
    status_label: CALL_STATUS_CONFIG[call.status]?.label || call.status
  })), [calls]);

  // Map filtered calls for CallsFilterSection
  const filteredCallsForFilter = useMemo(() => filteredCalls.map(call => ({
    product_type: call.product,
    vendor_name: call.vendor?.name,
    po_no: call.poNumber,
    call_no: call.callNumber,
    requested_date: call.submissionDateTime,
    stage: call.stage,
    status: call.status,
    status_label: CALL_STATUS_CONFIG[call.status]?.label || call.status
  })), [filteredCalls]);

  return (
    <div className="calldesk-tab-content">
      {/* KPI Tiles */}
      <div className="calldesk-kpi-grid">
        {kpiTiles.map((kpi, index) => {
          const statusKey = statusKeyMap[kpi.label];
          const isActive = filters.statuses.includes(statusKey);

          return (
            <div
              key={index}
              className={`stat-card ${isActive ? 'active' : ''}`}
              onClick={() => handleKpiClick(kpi.label)}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon" style={{ color: kpi.color }}>
                {kpi.icon}
              </div>
              <div className="stat-content">
                <div className="stat-label">{kpi.label}</div>
                <div className="stat-value" style={{ color: kpi.color }}>
                  {kpi.value}
                </div>
              </div>
              {isActive && (
                <div className="active-indicator" style={{ backgroundColor: kpi.color }}></div>
              )}
            </div>
          );
        })}
      </div>

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
        summaryLabel="verified & open calls"
      />

      {/* Info Message */}
      <div className="info-message">
        <span className="info-icon">ℹ️</span>
        <span>This is a read-only view of verified and open calls. Actions are managed by respective departments.</span>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredCalls}
        emptyMessage="No verified and open calls found"
        initialSortColumn="submissionDateTime"
        initialSortDirection="desc"
      />
    </div>
  );
};

export default VerifiedOpenCallsTab;

