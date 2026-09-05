/**
 * Pending Verification Tab Component
 * Displays pending verification calls with action buttons
 */

import React, { useState, useMemo } from 'react';
import DataTable from '../../../components/DataTable';
import StatusBadge from '../../../components/StatusBadge';
import CallsFilterSection from '../../../components/common/CallsFilterSection';
import { formatDateTime } from '../utils/helpers';
import { getDetailedStatus } from '../../../utils/statusMapper';

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
      key: 'rlyPoSr',
      label: 'Rly / PO / Sr. No.',
      sortable: true,
      render: (value, row) => (
        <a href="#!" onClick={(e) => { e.preventDefault(); console.log('Download PO for', row.poNumber); }} className="text-blue-600 hover:underline">
          {value}
        </a>
      )
    },
    {
      key: 'productStage',
      label: 'Stage of Inspection',
      sortable: true
    },
    {
      key: 'desiredInspectionDate',
      label: 'Desired Inspection Date',
      sortable: true,
      render: (value) => formatDateTime(value).split(' ')[0]
    },
    {
      key: 'dpDates',
      label: 'DP & Ext. DP Date',
      sortable: true
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
        const isMultiple = typeof value === 'string' && value.includes(',');
        if (isMultiple) {
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
        if (!value || value === '-' || value === 'null') {
          return <span style={{ color: '#d97706', fontSize: '11px', fontWeight: 500 }}>Please contact admin to do mapping</span>;
        }
        return value;
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (_value, row) => {
        const { mainStatus, combinedText } = getDetailedStatus(row.originalStatus || row.status);
        return <StatusBadge status={mainStatus} text={combinedText} />;
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
            className="btn btn-sm btn-primary"
            onClick={() => onViewDetails(row)}
            title="View Details & Take Action"
          >
            👁️ View Details
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
  const callsForFilter = calls.map(call => ({
    ...call,
    product_type: call.product,
    vendor_name: call.vendor?.name,
    po_no: call.poNumber,
    call_no: call.callNumber,
    requested_date: call.submissionDateTime
  }));

  return (
    <div className="calldesk-tab-content">
      {/* KPI Tiles */}
      <div className="calldesk-kpi-grid">
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
        initialSortColumn="submissionDateTime"
        initialSortDirection="desc"
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

export default PendingVerificationTab;

