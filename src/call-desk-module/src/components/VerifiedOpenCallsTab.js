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
  const [searchTerm, setSearchTerm] = useState('');
  const [showIEModal, setShowIEModal] = useState(false);
  const [selectedIENames, setSelectedIENames] = useState('');
  const [selectedCallNo, setSelectedCallNo] = useState('');

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


  // KPI tiles data (hidden from UI, commented out to avoid unused-vars warning)
  /*
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
  */


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
      render: (value, row) => {
        if (row.product === 'Process' && value && value !== '-') {
          return (
            <button 
              className="btn btn-sm"
              onClick={() => {
                setSelectedIENames(value);
                setSelectedCallNo(row.callNumber);
                setShowIEModal(true);
              }}
              style={{ 
                fontSize: '11px', 
                padding: '4px 10px', 
                backgroundColor: '#4f46e5', 
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#4338ca'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#4f46e5'}
            >
              👁️ View Assigned IE
            </button>
          );
        }
        return value || '-';
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

  // Status mapping for KPI tiles to facilitate filtering (commented out to avoid unused-vars warning)
  /*
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
  */

  /*
  const handleKpiClick = (label) => {
    const statusKey = statusKeyMap[label];
    if (statusKey) {
      handleMultiSelectToggle('statuses', statusKey);
    }
  };
  */

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
      {/* Global Search and Status Dropdown Controls */}
      <div className="calldesk-controls-bar" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '16px',
        padding: '16px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          {/* Global Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
            <span style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
              fontSize: '14px'
            }}>🔍</span>
            <input
              type="text"
              placeholder="Search calls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'white',
                transition: 'all 0.2s',
                minHeight: '38px'
              }}
              onFocus={(e) => e.target.style.borderColor = '#16a34a'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={filters.statuses[0] || ''}
            onChange={(e) => {
              const val = e.target.value;
              handleFilterChange('statuses', val ? [val] : []);
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white',
              minWidth: '180px',
              minHeight: '38px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#16a34a'}
            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
          >
            <option value="">All Statuses</option>
            <option value="assigned_to_ie">IE Assigned</option>
            <option value="scheduled">Scheduled</option>
            <option value="under_inspection">Under Inspection</option>
            <option value="withdrawn">Upheld</option>
            <option value="ic_pending">IC Issuance</option>
          </select>
        </div>
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
      <div className="info-message" style={{ marginTop: '8px' }}>
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
        hideSearch={true}
      />

      {/* Assigned IE Modal for Process Calls */}
      {showIEModal && (
        <div className="modal-overlay" onClick={() => setShowIEModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Assigned Inspectors - {selectedCallNo}</h3>
              <button className="modal-close" onClick={() => setShowIEModal(false)}>×</button>
            </div>
            <div className="modal-body p-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                <p className="text-xs text-blue-700 uppercase font-bold mb-2 tracking-wide">Assigned IEs:</p>
                <div className="space-y-2">
                  {selectedIENames.split(',').map((name, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded border border-blue-50 shadow-sm">
                      <span className="text-blue-500">👤</span>
                      <span className="font-medium text-gray-800">{name.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400 italic">This list includes all inspectors assigned to this process inspection call.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowIEModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifiedOpenCallsTab;

