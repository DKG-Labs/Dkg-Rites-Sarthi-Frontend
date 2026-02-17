/**
 * CMCallMonitoringTab Component
 * Call monitoring tab with KPI tiles and inspection calls table
 */

import React, { useState, useMemo, useCallback } from 'react';
import useCMData from '../../../hooks/cm/useCMData';
import DataTable from '../../../components/DataTable';
import Modal from '../../../components/Modal';
import { formatDate } from '../../../utils/helpers';
import { CALL_STATUS_CONFIG, PRODUCT_TYPES, INSPECTION_STAGES } from '../../../utils/cm/constants';

const CMCallMonitoringTab = ({ dashboardKPIs }) => {
  const { inspectionCalls, inspectionEngineers } = useCMData();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedKPI, setSelectedKPI] = useState(null); // Track selected KPI tile
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    productTypes: [],
    stage: '',
    ies: [],
    vendors: [],
    statuses: [],
    dateFrom: '',
    dateTo: ''
  });

  // Filter handler functions
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
      stage: '',
      ies: [],
      vendors: [],
      statuses: [],
      dateFrom: '',
      dateTo: ''
    });
    setFilterSearch('');
  };

  // Handle View Details
  const handleViewDetails = (call) => {
    setSelectedCall(call);
    setShowDetailsModal(true);
  };

  // Helper function to calculate days between two dates
  const calculateDaysDifference = (date1, date2) => {
    if (!date1 || !date2) return '-';
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper function to calculate delay from a date to today
  const calculateDelayFromDate = (date) => {
    if (!date) return '-';
    const today = new Date();
    const targetDate = new Date(date);
    const diffTime = today - targetDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Filter calls based on selected KPI
  const getFilteredCallsByKPI = useCallback((calls) => {
    if (!selectedKPI) return calls;

    switch (selectedKPI) {
      case 'Total Inspection Calls':
        return calls;

      case 'Pending Inspections':
        return calls.filter(call =>
          call.status === 'assigned' || call.status === 'scheduled'
        );

      case 'Under Inspection':
        return calls.filter(call => call.status === 'under_inspection');

      case 'Pending ICs':
        return calls.filter(call => call.status === 'ic_pending');

      case 'Calls Pending for Billing':
        return calls.filter(call => call.status === 'billing_pending');

      case 'Calls Pending for Payment':
        return calls.filter(call => call.status === 'payment_pending');

      case 'SLA Breached Calls':
        return calls.filter(call => call.slaBreached === true);

      default:
        return calls;
    }
  }, [selectedKPI]);

  // Apply filters to inspection calls
  const filteredCalls = useMemo(() => {
    // First filter by KPI selection
    let result = getFilteredCallsByKPI(inspectionCalls);

    // Product Type filter
    if (filters.productTypes.length > 0) {
      result = result.filter(call => filters.productTypes.includes(call.product));
    }

    // Stage filter
    if (filters.stage) {
      result = result.filter(call => call.stage === filters.stage);
    }

    // IE filter
    if (filters.ies.length > 0) {
      result = result.filter(call => filters.ies.includes(call.ie?.id));
    }

    // Vendor filter
    if (filters.vendors.length > 0) {
      result = result.filter(call => filters.vendors.includes(call.vendor?.name));
    }

    // Status filter
    if (filters.statuses.length > 0) {
      result = result.filter(call => filters.statuses.includes(call.status));
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      result = result.filter(call => {
        const callDate = new Date(call.scheduledDate);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

        if (fromDate && callDate < fromDate) return false;
        if (toDate && callDate > toDate) return false;
        return true;
      });
    }

    return result;
  }, [inspectionCalls, filters, getFilteredCallsByKPI]);

  // KPI Tiles
  const kpiTiles = [
    {
      label: 'Total Inspection Calls',
      value: dashboardKPIs.totalCalls || 0,
      description: 'All calls assigned to IEs',
      icon: '📊',
      onClick: () => setSelectedKPI('Total Inspection Calls')
    },
    {
      label: 'Pending Inspections',
      value: dashboardKPIs.pendingInspections || 0,
      description: 'Assigned + Not Started',
      icon: '⏳',
      onClick: () => setSelectedKPI('Pending Inspections')
    },
    {
      label: 'Under Inspection',
      value: dashboardKPIs.underInspection || 0,
      description: 'Currently in progress',
      icon: '🔍',
      onClick: () => setSelectedKPI('Under Inspection')
    },
    {
      label: 'Pending ICs',
      value: dashboardKPIs.pendingICs || 0,
      description: 'Awaiting IC issuance',
      icon: '📄',
      onClick: () => setSelectedKPI('Pending ICs')
    },
    {
      label: 'Calls Pending for Billing',
      value: dashboardKPIs.callsUnderBilling || 0,
      description: 'In billing stage',
      icon: '💰',
      onClick: () => setSelectedKPI('Calls Pending for Billing')
    },
    {
      label: 'Calls Pending for Payment',
      value: dashboardKPIs.callsPendingPayment || 0,
      description: 'Awaiting payment',
      icon: '💳',
      onClick: () => setSelectedKPI('Calls Pending for Payment')
    },
    {
      label: 'Calls Disposed',
      value: dashboardKPIs.callsDisposedThisMonth || 0,
      description: 'Payment completed calls',
      icon: '✅',
      onClick: () => setSelectedKPI('Calls Disposed')
    },
    {
      label: 'SLA Breached Calls',
      value: dashboardKPIs.slaBreachedCalls || 0,
      description: 'Requires immediate attention',
      icon: '⚠️',
      onClick: () => setSelectedKPI('SLA Breached Calls')
    },
  ];

  // Get unique values for filters
  const uniqueVendors = useMemo(() => {
    return [...new Set(inspectionCalls.map(call => call.vendor?.name).filter(Boolean))].sort();
  }, [inspectionCalls]);

  const uniqueIEs = useMemo(() => {
    return inspectionEngineers || [];
  }, [inspectionEngineers]);

  // Date range presets
  const getDatePreset = (preset) => {
    const today = new Date();
    const from = new Date();

    switch(preset) {
      case 'today':
        return { dateFrom: today.toISOString().split('T')[0], dateTo: today.toISOString().split('T')[0] };
      case 'week':
        from.setDate(today.getDate() - 7);
        return { dateFrom: from.toISOString().split('T')[0], dateTo: today.toISOString().split('T')[0] };
      case 'month':
        from.setMonth(today.getMonth() - 1);
        return { dateFrom: from.toISOString().split('T')[0], dateTo: today.toISOString().split('T')[0] };
      case 'last30':
        from.setDate(today.getDate() - 30);
        return { dateFrom: from.toISOString().split('T')[0], dateTo: today.toISOString().split('T')[0] };
      default:
        return { dateFrom: '', dateTo: '' };
    }
  };

  const applyDatePreset = (preset) => {
    const dates = getDatePreset(preset);
    setFilters(prev => ({ ...prev, ...dates }));
  };

  // Common columns for all tables
  const commonColumns = useMemo(() => [
    { key: 'callNumber', label: 'Call No.' },
    { key: 'vendor', label: 'Vendor Name', render: (val) => val?.name || '-' },
    { key: 'product', label: 'Product' },
    { key: 'stage', label: 'Stage' },
    { key: 'ie', label: 'IE Assigned', render: (val) => val?.name || '-' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => {
        const config = CALL_STATUS_CONFIG[val] || {};
        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            background: config.bgColor || '#f3f4f6',
            color: config.color || '#1f2937',
            border: `1px solid ${config.borderColor || '#e5e7eb'}`
          }}>
            {config.label || val}
          </span>
        );
      }
    },
  ], []);

  // Get dynamic columns based on selected KPI
  const getDynamicColumns = useCallback(() => {
    const baseColumns = [...commonColumns];

    // Add View Details action column
    const viewDetailsColumn = {
      key: 'actions',
      label: 'Actions',
      render: (val, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetails(row);
          }}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            border: '1px solid #3b82f6',
            borderRadius: '4px',
            background: 'white',
            color: '#3b82f6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#3b82f6';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'white';
            e.target.style.color = '#3b82f6';
          }}
        >
          👁️ View
        </button>
      )
    };

    if (!selectedKPI) {
      // Default columns when no KPI is selected
      return [
        ...baseColumns,
        { key: 'scheduledDate', label: 'Scheduled Date', render: (val) => formatDate(val) },
        { key: 'daysPending', label: 'Days Pending' },
        viewDetailsColumn
      ];
    }

    switch (selectedKPI) {
      case 'Pending Inspections':
        return [
          ...baseColumns,
          {
            key: 'desiredInspectionDate',
            label: 'Desired Date of Inspection',
            render: (val, row) => row.stage === 'Process' ? '-' : formatDate(val || row.scheduledDate)
          },
          {
            key: 'scheduledDate',
            label: 'Date of Inspection Scheduled',
            render: (val, row) => row.stage === 'Process' ? '-' : formatDate(val)
          },
          {
            key: 'rescheduleCount',
            label: 'No. of Reschedules',
            render: (val, row) => row.stage === 'Process' ? '-' : (val || 0)
          },
          {
            key: 'delayInInspection',
            label: 'Delay in Inspection (Days)',
            render: (val, row) => {
              if (row.stage === 'Process') return '-';
              const desired = row.desiredInspectionDate || row.scheduledDate;
              const scheduled = row.scheduledDate;
              return calculateDaysDifference(desired, scheduled);
            }
          },
          viewDetailsColumn
        ];

      case 'Under Inspection':
        return [
          ...baseColumns,
          {
            key: 'desiredInspectionDate',
            label: 'Desired Date of Inspection',
            render: (val, row) => row.stage === 'Process' ? '-' : formatDate(val || row.scheduledDate)
          },
          {
            key: 'inspectionInitiationDate',
            label: 'Date of Inspection Initiation',
            render: (val, row) => formatDate(val || row.scheduledDate)
          },
          viewDetailsColumn
        ];

      case 'Pending ICs':
        return [
          ...baseColumns,
          {
            key: 'inspectionInitiationDate',
            label: 'Date of Inspection Initiation',
            render: (val, row) => formatDate(val || row.scheduledDate)
          },
          {
            key: 'inspectionCompletionDate',
            label: 'Date of Inspection Completion',
            render: (val, row) => formatDate(val || row.scheduledDate)
          },
          {
            key: 'delayInICPending',
            label: 'Delay in IC Pending (Days)',
            render: (val, row) => {
              const completionDate = row.inspectionCompletionDate || row.scheduledDate;
              return calculateDelayFromDate(completionDate);
            }
          },
          viewDetailsColumn
        ];

      case 'Calls Pending for Billing':
        return [
          ...baseColumns,
          {
            key: 'icIssuanceDate',
            label: 'Date of IC Issuance',
            render: (val, row) => formatDate(val || row.scheduledDate)
          },
          {
            key: 'billingDate',
            label: 'Date of Billing',
            render: (val) => formatDate(val) || '-'
          },
          {
            key: 'delayInBilling',
            label: 'Delay in Billing (Days)',
            render: (val, row) => {
              const icDate = row.icIssuanceDate || row.scheduledDate;
              return calculateDelayFromDate(icDate);
            }
          },
          viewDetailsColumn
        ];

      case 'Calls Pending for Payment':
        return [
          ...baseColumns,
          {
            key: 'billingDate',
            label: 'Date of Billing',
            render: (val, row) => formatDate(val || row.scheduledDate)
          },
          {
            key: 'delayInPayment',
            label: 'Delay in Payment (Days)',
            render: (val, row) => {
              const billing = row.billingDate || row.scheduledDate;
              return calculateDelayFromDate(billing);
            }
          },
          viewDetailsColumn
        ];

      case 'Total Inspection Calls':
      case 'SLA Breached Calls':
        return [
          ...baseColumns,
          {
            key: 'slaBreached',
            label: 'SLA Breached',
            render: (val) => (
              <span style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                background: val ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                color: val ? '#ef4444' : '#22c55e',
                border: `1px solid ${val ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)'}`
              }}>
                {val ? 'Yes' : 'No'}
              </span>
            )
          },
          viewDetailsColumn
        ];

      default:
        return [
          ...baseColumns,
          { key: 'scheduledDate', label: 'Scheduled Date', render: (val) => formatDate(val) },
          { key: 'daysPending', label: 'Days Pending' },
          viewDetailsColumn
        ];
    }
  }, [selectedKPI, commonColumns]);

  // Get columns based on selected KPI
  const columns = useMemo(() => getDynamicColumns(), [getDynamicColumns]);

  // Get active filter tags
  const getActiveFilters = () => {
    const activeFilters = [];

    filters.productTypes.forEach(type => {
      activeFilters.push({
        key: `product-${type}`,
        label: 'Product',
        value: type,
        color: '#3b82f6',
        onRemove: () => handleMultiSelectToggle('productTypes', type)
      });
    });

    if (filters.stage) {
      const stageLabels = { 'RM': 'Raw Material', 'Process': 'Process', 'Final': 'Final' };
      activeFilters.push({
        key: 'stage',
        label: 'Stage',
        value: stageLabels[filters.stage] || filters.stage,
        color: '#f59e0b',
        onRemove: () => handleFilterChange('stage', '')
      });
    }

    filters.ies.forEach(ieId => {
      const ie = uniqueIEs.find(i => i.id === ieId);
      activeFilters.push({
        key: `ie-${ieId}`,
        label: 'IE',
        value: ie ? `${ie.name} (${ie.employeeId})` : ieId,
        color: '#8b5cf6',
        onRemove: () => handleMultiSelectToggle('ies', ieId)
      });
    });

    filters.vendors.forEach(vendor => {
      activeFilters.push({
        key: `vendor-${vendor}`,
        label: 'Vendor',
        value: vendor,
        color: '#10b981',
        onRemove: () => handleMultiSelectToggle('vendors', vendor)
      });
    });

    filters.statuses.forEach(status => {
      const config = CALL_STATUS_CONFIG[status] || {};
      activeFilters.push({
        key: `status-${status}`,
        label: 'Status',
        value: config.label || status,
        color: config.color || '#6b7280',
        onRemove: () => handleMultiSelectToggle('statuses', status)
      });
    });

    if (filters.dateFrom || filters.dateTo) {
      activeFilters.push({
        key: 'dateRange',
        label: 'Date',
        value: `${filters.dateFrom || 'Start'} to ${filters.dateTo || 'End'}`,
        color: '#f97316',
        onRemove: () => {
          handleFilterChange('dateFrom', '');
          handleFilterChange('dateTo', '');
        }
      });
    }

    return activeFilters;
  };

  // Render comprehensive filters section
  const renderFiltersSection = () => {
    const activeFilters = getActiveFilters();

    return (
      <div style={{ marginBottom: 'var(--space-16)' }}>
        {/* Filter Toggle Button and Summary */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-12)',
          flexWrap: 'wrap',
          gap: 'var(--space-8)'
        }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-8)'
            }}
          >
            <span>{showFilters ? '▼' : '▶'}</span>
            <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
            {activeFilters.length > 0 && (
              <span style={{
                background: '#3b82f6',
                color: 'white',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {activeFilters.length}
              </span>
            )}
          </button>

          <div style={{
            fontSize: '14px',
            color: 'var(--color-text-secondary)',
            fontWeight: '500'
          }}>
            Showing <strong style={{ color: 'var(--color-primary)' }}>{filteredCalls.length}</strong> of <strong>{inspectionCalls.length}</strong> calls
          </div>
        </div>

        {/* Active Filter Tags */}
        {activeFilters.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-8)',
            marginBottom: 'var(--space-12)',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              fontWeight: '500'
            }}>
              Active Filters:
            </span>
            {activeFilters.map(filter => (
              <span
                key={filter.key}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '500',
                  background: `${filter.color}15`,
                  color: filter.color,
                  border: `1px solid ${filter.color}40`
                }}
              >
                <span style={{ fontSize: '11px', opacity: 0.8 }}>{filter.label}:</span>
                <span>{filter.value}</span>
                <button
                  onClick={filter.onRemove}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: filter.color,
                    cursor: 'pointer',
                    padding: '0',
                    marginLeft: '2px',
                    fontSize: '14px',
                    lineHeight: '1',
                    opacity: 0.7
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '1'}
                  onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                >
                  ×
                </button>
              </span>
            ))}
            <button
              onClick={clearAllFilters}
              style={{
                background: 'none',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '4px 12px',
                fontSize: '12px',
                color: '#6b7280',
                cursor: 'pointer',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f9fafb';
                e.target.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'none';
                e.target.style.borderColor = '#e5e7eb';
              }}
            >
              Clear All
            </button>
          </div>
        )}

        {/* Modal Filter Panel */}
        {showFilters && renderFilterModal()}
      </div>
    );
  };

  // Filter categories for sidebar
  const [selectedCategory, setSelectedCategory] = useState('Product Type');

  const filterCategories = [
    'Product Type',
    'Vendor',
    'Stage',
    'IE',
    'Status',
    'Date Range'
  ];

  // Render modal-based filter panel matching reference design
  const renderFilterModal = () => {
    return (
      <>
        {/* Modal Overlay */}
        <div
          onClick={() => setShowFilters(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            animation: 'fadeIn 0.2s ease-out'
          }}
        />

        {/* Modal Content */}
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '700px',
          maxHeight: '85vh',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {/* Modal Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937'
            }}>Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '0',
                lineHeight: '1',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.background = 'none'}
            >
              ×
            </button>
          </div>

          {/* Search Bar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
                fontSize: '18px'
              }}>🔍</span>
              <input
                type="search"
                placeholder="Search across filters..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>

          {/* Modal Body with Sidebar and Content */}
          <div style={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden',
            minHeight: 0
          }}>
            {/* Sidebar */}
            <div style={{
              width: '160px',
              borderRight: '1px solid #e5e7eb',
              overflowY: 'auto',
              backgroundColor: '#f9fafb'
            }}>
              {filterCategories.map(cat => (
                <div
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '14px 20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: selectedCategory === cat ? '600' : '400',
                    color: selectedCategory === cat ? '#16a34a' : '#4b5563',
                    backgroundColor: selectedCategory === cat ? '#f0fdf4' : 'transparent',
                    borderLeft: selectedCategory === cat ? '3px solid #16a34a' : '3px solid transparent',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== cat) {
                      e.target.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== cat) {
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {cat}
                </div>
              ))}
            </div>

            {/* Content Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 24px'
            }}>
              {renderFilterContent()}
            </div>
          </div>

          {/* Modal Footer */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: '12px',
            justifyContent: 'space-between'
          }}>
            <button
              onClick={clearAllFilters}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: 'white',
                color: '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f9fafb';
                e.target.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
                e.target.style.borderColor = '#e5e7eb';
              }}
            >
              Clear Filter
            </button>
            <button
              onClick={() => setShowFilters(false)}
              style={{
                padding: '10px 32px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '8px',
                background: '#16a34a',
                color: 'white',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#15803d'}
              onMouseLeave={(e) => e.target.style.background = '#16a34a'}
            >
              Apply
            </button>
          </div>
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translate(-50%, -45%);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%);
            }
          }
        `}</style>
      </>
    );
  };

  // Render filter content based on selected category
  const renderFilterContent = () => {
    switch (selectedCategory) {
      case 'Product Type':
        return (
          <div>
            <h4 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937'
            }}>Product Type</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.values(PRODUCT_TYPES).map(type => (
                <label
                  key={type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    transition: 'background 0.2s',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <input
                    type="checkbox"
                    checked={filters.productTypes.includes(type)}
                    onChange={() => handleMultiSelectToggle('productTypes', type)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'Vendor':
        return (
          <div>
            <h4 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937'
            }}>Vendor</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {uniqueVendors.map(vendor => (
                <label
                  key={vendor}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    transition: 'background 0.2s',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <input
                    type="checkbox"
                    checked={filters.vendors.includes(vendor)}
                    onChange={() => handleMultiSelectToggle('vendors', vendor)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <span>{vendor}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'Stage':
        return (
          <div>
            <h4 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937'
            }}>Stage</h4>
            <select
              value={filters.stage}
              onChange={(e) => handleFilterChange('stage', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="">All Stages</option>
              <option value={INSPECTION_STAGES.RAW_MATERIAL}>Raw Material (RM)</option>
              <option value={INSPECTION_STAGES.PROCESS}>Process</option>
              <option value={INSPECTION_STAGES.FINAL}>Final</option>
            </select>
          </div>
        );

      case 'IE':
        return (
          <div>
            <h4 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937'
            }}>Inspection Engineer (IE)</h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {uniqueIEs.map(ie => (
                <label
                  key={ie.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    transition: 'background 0.2s',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <input
                    type="checkbox"
                    checked={filters.ies.includes(ie.id)}
                    onChange={() => handleMultiSelectToggle('ies', ie.id)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <span>{ie.name} ({ie.employeeId})</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'Status':
        return (
          <div>
            <h4 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937'
            }}>Status</h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {Object.entries(CALL_STATUS_CONFIG).map(([status, config]) => (
                <label
                  key={status}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    transition: 'background 0.2s',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <input
                    type="checkbox"
                    checked={filters.statuses.includes(status)}
                    onChange={() => handleMultiSelectToggle('statuses', status)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: config.bgColor,
                    color: config.color,
                    fontWeight: '500',
                    border: `1px solid ${config.borderColor}`
                  }}>
                    {config.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'Date Range':
        return (
          <div>
            <h4 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937'
            }}>Date Range</h4>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <span style={{ color: '#6b7280', fontSize: '14px' }}>to</span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px'
            }}>
              {[
                { label: 'Today', value: 'today' },
                { label: 'This Week', value: 'week' },
                { label: 'This Month', value: 'month' },
                { label: 'Last 30 Days', value: 'last30' }
              ].map(preset => (
                <button
                  key={preset.value}
                  onClick={() => applyDatePreset(preset.value)}
                  style={{
                    padding: '10px 16px',
                    fontSize: '13px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    color: '#4b5563',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f3f4f6';
                    e.target.style.borderColor = '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.borderColor = '#e5e7eb';
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {/* KPI Tiles Grid */}
      <div style={{ marginBottom: 'var(--space-16)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-12)'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Key Performance Indicators</h3>
          {selectedKPI && (
            <button
              onClick={() => setSelectedKPI(null)}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer',
                color: '#6b7280',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
              }}
            >
              ✕ Clear Selection
            </button>
          )}
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {kpiTiles.map((tile, index) => {
            const isSelected = selectedKPI === tile.label;
            return (
              <div
                key={index}
                className="stat-card"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'white',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
                onClick={tile.onClick}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {tile.icon && <span style={{ fontSize: '20px' }}>{tile.icon}</span>}
                  <div className="stat-label" style={{ color: isSelected ? '#3b82f6' : undefined }}>
                    {tile.label}
                  </div>
                </div>
                <div className="stat-value" style={{ color: isSelected ? '#3b82f6' : undefined }}>
                  {tile.value}
                </div>
                {tile.description && (
                  <div style={{
                    fontSize: 'var(--font-size-xs)',
                    color: isSelected ? '#3b82f6' : 'var(--color-text-secondary)',
                    marginTop: 'var(--space-4)',
                    opacity: isSelected ? 0.8 : 1
                  }}>
                    {tile.description}
                  </div>
                )}
                {isSelected && (
                  <div style={{
                    marginTop: '8px',
                    padding: '4px 8px',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    SELECTED
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selectedKPI && (
          <div style={{
            marginTop: 'var(--space-12)',
            padding: '12px 16px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#1e40af',
            fontWeight: '500'
          }}>
            📊 Showing data for: <strong>{selectedKPI}</strong>
          </div>
        )}
      </div>

      {/* Filters Section */}
      {renderFiltersSection()}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredCalls}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        selectable={false}
      />

      {/* View Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        title={`Call Details - ${selectedCall?.callNumber || ''}`}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedCall(null);
        }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-12)' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedCall(null);
              }}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedCall && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
            {/* Call Information Section */}
            <div>
              <h4 style={{
                margin: '0 0 16px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '20px' }}>📋</span>
                Call Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-16)' }}>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Call Number:</strong>
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>{selectedCall.callNumber}</span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Status:</strong>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      background: CALL_STATUS_CONFIG[selectedCall.status]?.bgColor || '#f3f4f6',
                      color: CALL_STATUS_CONFIG[selectedCall.status]?.color || '#1f2937',
                      border: `1px solid ${CALL_STATUS_CONFIG[selectedCall.status]?.borderColor || '#e5e7eb'}`
                    }}>
                      {CALL_STATUS_CONFIG[selectedCall.status]?.label || selectedCall.status}
                    </span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Product Type:</strong>
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>{selectedCall.product}</span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Inspection Stage:</strong>
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>{selectedCall.stage}</span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>SLA Status:</strong>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      background: selectedCall.slaBreached ? '#fee2e2' : '#d1fae5',
                      color: selectedCall.slaBreached ? '#dc2626' : '#059669',
                      border: `1px solid ${selectedCall.slaBreached ? '#fecaca' : '#a7f3d0'}`
                    }}>
                      {selectedCall.slaBreached ? '⚠️ Breached' : '✓ On Track'}
                    </span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Days Pending:</strong>
                    <span style={{
                      color: selectedCall.daysPending > 10 ? '#dc2626' : '#1f2937',
                      fontSize: '15px',
                      fontWeight: selectedCall.daysPending > 10 ? '600' : '400'
                    }}>
                      {selectedCall.daysPending} days
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Vendor Information Section */}
            <div>
              <h4 style={{
                margin: '0 0 16px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '20px' }}>🏢</span>
                Vendor Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-16)' }}>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Vendor Name:</strong>
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>{selectedCall.vendor?.name || '-'}</span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Location:</strong>
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>{selectedCall.vendor?.location || '-'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* IE Assignment Section */}
            <div>
              <h4 style={{
                margin: '0 0 16px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '20px' }}>👤</span>
                Inspection Engineer Assignment
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-16)' }}>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>IE Name:</strong>
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>{selectedCall.ie?.name || '-'}</span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Employee ID:</strong>
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>{selectedCall.ie?.employeeId || '-'}</span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Current Workload:</strong>
                    <span style={{
                      color: selectedCall.ie?.workload > 80 ? '#dc2626' : '#1f2937',
                      fontSize: '15px',
                      fontWeight: selectedCall.ie?.workload > 80 ? '600' : '400'
                    }}>
                      {selectedCall.ie?.workload || '-'}%
                    </span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Assigned Calls:</strong>
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>{selectedCall.ie?.assignedCalls || '-'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Important Dates Section */}
            <div>
              <h4 style={{
                margin: '0 0 16px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '20px' }}>📅</span>
                Important Dates
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-16)' }}>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Desired Inspection Date:</strong>
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>
                      {selectedCall.desiredInspectionDate ? formatDate(selectedCall.desiredInspectionDate) : '-'}
                    </span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Scheduled Date:</strong>
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>
                      {selectedCall.scheduledDate ? formatDate(selectedCall.scheduledDate) : '-'}
                    </span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Inspection Initiation:</strong>
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>
                      {selectedCall.inspectionInitiationDate ? formatDate(selectedCall.inspectionInitiationDate) : '-'}
                    </span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Inspection Completion:</strong>
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>
                      {selectedCall.inspectionCompletionDate ? formatDate(selectedCall.inspectionCompletionDate) : '-'}
                    </span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>IC Issuance Date:</strong>
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>
                      {selectedCall.icIssuanceDate ? formatDate(selectedCall.icIssuanceDate) : '-'}
                    </span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Billing Date:</strong>
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>
                      {selectedCall.billingDate ? formatDate(selectedCall.billingDate) : '-'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div>
              <h4 style={{
                margin: '0 0 16px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '20px' }}>ℹ️</span>
                Additional Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-16)' }}>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Reschedule Count:</strong>
                    <span style={{
                      color: selectedCall.rescheduleCount > 1 ? '#dc2626' : '#1f2937',
                      fontSize: '15px',
                      fontWeight: selectedCall.rescheduleCount > 1 ? '600' : '400'
                    }}>
                      {selectedCall.rescheduleCount} {selectedCall.rescheduleCount === 1 ? 'time' : 'times'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CMCallMonitoringTab;

