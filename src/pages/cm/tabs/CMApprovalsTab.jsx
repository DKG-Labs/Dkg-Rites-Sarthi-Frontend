/**
 * CMApprovalsTab Component
 * Approvals queue for CM with action buttons and comprehensive filters
 */

import React, { useState, useMemo } from 'react';
import useCMData from '../../../hooks/cm/useCMData';
import useApprovals from '../../../hooks/cm/useApprovals';
import DataTable from '../../../components/DataTable';
import Modal from '../../../components/Modal';
import { formatDate } from '../../../utils/helpers';
import { APPROVAL_TYPES } from '../../../utils/cm/constants';

const CMApprovalsTab = () => {
  const { approvals, loading } = useCMData();
  const { approveRequest, rejectRequest, forwardRequest } = useApprovals();
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [remarks, setRemarks] = useState('');

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Trigger Type');
  const [filters, setFilters] = useState({
    triggerTypes: [],
    productTypes: [],
    stages: [],
    ies: [],
    vendors: [],
    priorities: [],
    dateFrom: '',
    dateTo: ''
  });

  // Filter categories for sidebar
  const filterCategories = [
    'Trigger Type',
    'Product Type',
    'Stage',
    'IE',
    'Vendor',
    'Priority',
    'Date Range'
  ];

  // Memoize safeApprovals to prevent dependency issues in other useMemo hooks
  const safeApprovals = useMemo(() => approvals || [], [approvals]);

  // Filter handling functions
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleMultiSelectToggle = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      triggerTypes: [],
      productTypes: [],
      stages: [],
      ies: [],
      vendors: [],
      priorities: [],
      dateFrom: '',
      dateTo: ''
    });
    setFilterSearch('');
  };

  // Apply filters to approvals
  const filteredApprovals = useMemo(() => {
    let result = safeApprovals;

    // Trigger Type filter
    if (filters.triggerTypes.length > 0) {
      result = result.filter(approval => filters.triggerTypes.includes(approval.type));
    }

    // Product Type filter
    if (filters.productTypes.length > 0) {
      result = result.filter(approval => {
        const productType = approval.product?.split(' - ')[0];
        return filters.productTypes.includes(productType);
      });
    }

    // Stage filter
    if (filters.stages.length > 0) {
      result = result.filter(approval => {
        const stage = approval.product?.split(' - ')[1];
        return filters.stages.includes(stage);
      });
    }

    // IE filter
    if (filters.ies.length > 0) {
      result = result.filter(approval => filters.ies.includes(approval.ie?.id));
    }

    // Vendor filter
    if (filters.vendors.length > 0) {
      result = result.filter(approval => filters.vendors.includes(approval.vendor?.name));
    }

    // Priority filter
    if (filters.priorities.length > 0) {
      result = result.filter(approval => filters.priorities.includes(approval.priority));
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      result = result.filter(approval => {
        const approvalDate = new Date(approval.requestedDate);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

        if (fromDate && approvalDate < fromDate) return false;
        if (toDate && approvalDate > toDate) return false;
        return true;
      });
    }

    return result;
  }, [safeApprovals, filters]);

  // Get unique values for filters
  const uniqueTriggerTypes = useMemo(() => {
    return [...new Set(safeApprovals.map(a => a.type))].filter(Boolean);
  }, [safeApprovals]);

  const uniqueProductTypes = useMemo(() => {
    return [...new Set(safeApprovals.map(a => a.product?.split(' - ')[0]))].filter(Boolean);
  }, [safeApprovals]);

  const uniqueStages = useMemo(() => {
    return [...new Set(safeApprovals.map(a => a.product?.split(' - ')[1]))].filter(Boolean);
  }, [safeApprovals]);

  const uniqueIEs = useMemo(() => {
    const ies = safeApprovals.map(a => a.ie).filter(Boolean);
    return [...new Map(ies.map(ie => [ie.id, ie])).values()];
  }, [safeApprovals]);

  const uniqueVendors = useMemo(() => {
    return [...new Set(safeApprovals.map(a => a.vendor?.name))].filter(Boolean);
  }, [safeApprovals]);

  const uniquePriorities = useMemo(() => {
    return [...new Set(safeApprovals.map(a => a.priority))].filter(Boolean);
  }, [safeApprovals]);

  const handleAction = (approval, action) => {
    setSelectedApproval(approval);
    setActionType(action);

    if (action === 'view') {
      setShowViewModal(true);
    } else {
      setShowModal(true);
      setRemarks('');
    }
  };

  const handleSubmitAction = async () => {
    if (!selectedApproval) return;

    try {
      if (actionType === 'approve') {
        await approveRequest(selectedApproval.id, remarks);
      } else if (actionType === 'reject') {
        await rejectRequest(selectedApproval.id, remarks);
      } else if (actionType === 'forward') {
        await forwardRequest(selectedApproval.id, remarks);
      }
      setShowModal(false);
      setSelectedApproval(null);
      setRemarks('');
    } catch (error) {
      console.error('Error processing approval:', error);
    }
  };

  const columns = [
    { key: 'callNumber', label: 'Call Number' },
    {
      key: 'type',
      label: 'Trigger Type',
      render: (val) => {
        const config = APPROVAL_TYPES[val] || {};
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
    { key: 'ie', label: 'IE Name', render: (val) => val?.name || '-' },
    { key: 'vendor', label: 'Vendor', render: (val) => val?.name || '-' },
    { key: 'product', label: 'Product & Stage' },
    {
      key: 'priority',
      label: 'Priority',
      render: (val) => {
        const priorityConfig = {
          critical: { label: 'Critical', color: '#dc2626', bgColor: 'rgba(220, 38, 38, 0.15)', borderColor: 'rgba(220, 38, 38, 0.25)' },
          high: { label: 'High', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)', borderColor: 'rgba(249, 115, 22, 0.25)' },
          medium: { label: 'Medium', color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.15)', borderColor: 'rgba(234, 179, 8, 0.25)' },
          low: { label: 'Low', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.25)' }
        };
        const config = priorityConfig[val] || {};
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
    { key: 'requestedDate', label: 'Requested Date', render: (val) => formatDate(val) },
  ];

  const actions = (row) => (
    <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
      <button className="btn btn-sm btn-secondary" onClick={() => handleAction(row, 'view')}>
        View
      </button>
      <button className="btn btn-sm btn-primary" onClick={() => handleAction(row, 'approve')}>
        Approve
      </button>
      <button className="btn btn-sm btn-danger" onClick={() => handleAction(row, 'reject')}>
        Reject
      </button>
      <button className="btn btn-sm btn-secondary" onClick={() => handleAction(row, 'forward')}>
        Forward
      </button>
    </div>
  );

  // Get active filter tags
  const getActiveFilters = () => {
    const activeFilters = [];

    filters.triggerTypes.forEach(type => {
      const config = APPROVAL_TYPES[type] || {};
      activeFilters.push({
        key: `trigger-${type}`,
        label: 'Trigger Type',
        value: config.label || type,
        color: config.color || '#3b82f6',
        onRemove: () => handleMultiSelectToggle('triggerTypes', type)
      });
    });

    filters.productTypes.forEach(type => {
      activeFilters.push({
        key: `product-${type}`,
        label: 'Product',
        value: type,
        color: '#3b82f6',
        onRemove: () => handleMultiSelectToggle('productTypes', type)
      });
    });

    filters.stages.forEach(stage => {
      activeFilters.push({
        key: `stage-${stage}`,
        label: 'Stage',
        value: stage,
        color: '#f59e0b',
        onRemove: () => handleMultiSelectToggle('stages', stage)
      });
    });

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

    filters.priorities.forEach(priority => {
      const priorityLabels = {
        critical: 'Critical',
        high: 'High',
        medium: 'Medium',
        low: 'Low'
      };
      activeFilters.push({
        key: `priority-${priority}`,
        label: 'Priority',
        value: priorityLabels[priority] || priority,
        color: '#dc2626',
        onRemove: () => handleMultiSelectToggle('priorities', priority)
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

  // Render filter content based on selected category
  const renderFilterContent = () => {
    switch (selectedCategory) {
      case 'Trigger Type':
        return (
          <div>
            <h4 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937'
            }}>Trigger Type</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {uniqueTriggerTypes.map(type => {
                const config = APPROVAL_TYPES[type] || {};
                return (
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
                      checked={filters.triggerTypes.includes(type)}
                      onChange={() => handleMultiSelectToggle('triggerTypes', type)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <span>{config.label || type}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );

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
              {uniqueProductTypes.map(type => (
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

      case 'Stage':
        return (
          <div>
            <h4 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937'
            }}>Stage</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {uniqueStages.map(stage => (
                <label
                  key={stage}
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
                    checked={filters.stages.includes(stage)}
                    onChange={() => handleMultiSelectToggle('stages', stage)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <span>{stage}</span>
                </label>
              ))}
            </div>
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

      case 'Vendor':
        return (
          <div>
            <h4 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937'
            }}>Vendor</h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
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

      case 'Priority':
        return (
          <div>
            <h4 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937'
            }}>Priority</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {uniquePriorities.map(priority => {
                const priorityLabels = {
                  critical: 'Critical',
                  high: 'High',
                  medium: 'Medium',
                  low: 'Low'
                };
                return (
                  <label
                    key={priority}
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
                      checked={filters.priorities.includes(priority)}
                      onChange={() => handleMultiSelectToggle('priorities', priority)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <span>{priorityLabels[priority] || priority}</span>
                  </label>
                );
              })}
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
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render modal-based filter panel matching Call Monitoring design
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

  if (loading) {
    return <div>Loading approvals...</div>;
  }

  const activeFilters = getActiveFilters();

  return (
    <div>
      {/* Filter Section */}
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
            Showing <strong style={{ color: 'var(--color-primary)' }}>{filteredApprovals.length}</strong> of <strong>{safeApprovals.length}</strong> pending approvals
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
                    fontWeight: 'bold'
                  }}
                  title="Remove filter"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              onClick={clearAllFilters}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                border: '1px solid #dc2626',
                borderRadius: '16px',
                background: 'rgba(220, 38, 38, 0.1)',
                color: '#dc2626',
                cursor: 'pointer',
                fontWeight: '500'
              }}
              title="Clear all filters"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Modal Filter Panel */}
        {showFilters && renderFilterModal()}
      </div>

      <DataTable
        columns={columns}
        data={filteredApprovals}
        actions={actions}
        selectable={false}
      />

      {/* View Modal - Read-only detailed information */}
      <Modal
        isOpen={showViewModal}
        title="Approval Request Details"
        onClose={() => setShowViewModal(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setShowViewModal(false)}>
              Close
            </button>
          </div>
        }
      >
        {selectedApproval && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-20)' }}>
            {/* Basic Information Section */}
            <div>
              <h4 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '8px'
              }}>Basic Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)' }}>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280' }}>Call Number:</strong>
                    <br />
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>{selectedApproval.callNumber}</span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280' }}>Request ID:</strong>
                    <br />
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>{selectedApproval.id}</span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280' }}>Requested Date:</strong>
                    <br />
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>{formatDate(selectedApproval.requestedDate)}</span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280' }}>Priority:</strong>
                    <br />
                    <span style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '600',
                      background: selectedApproval.priority === 'critical' ? '#fee2e2' :
                                 selectedApproval.priority === 'high' ? '#fed7aa' :
                                 selectedApproval.priority === 'medium' ? '#fef3c7' : '#d1fae5',
                      color: selectedApproval.priority === 'critical' ? '#dc2626' :
                             selectedApproval.priority === 'high' ? '#ea580c' :
                             selectedApproval.priority === 'medium' ? '#d97706' : '#059669'
                    }}>
                      {selectedApproval.priority?.charAt(0).toUpperCase() + selectedApproval.priority?.slice(1)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Approval Type Section */}
            <div>
              <h4 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '8px'
              }}>Approval Type & Trigger</h4>
              <div>
                <p style={{ margin: '8px 0', fontSize: '14px' }}>
                  <strong style={{ color: '#6b7280' }}>Trigger Type:</strong>
                  <br />
                  <span style={{
                    display: 'inline-block',
                    marginTop: '4px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    background: APPROVAL_TYPES[selectedApproval.type]?.color + '20' || '#f3f4f6',
                    color: APPROVAL_TYPES[selectedApproval.type]?.color || '#6b7280',
                    border: `1px solid ${APPROVAL_TYPES[selectedApproval.type]?.color}40` || '#e5e7eb'
                  }}>
                    {APPROVAL_TYPES[selectedApproval.type]?.label || selectedApproval.type}
                  </span>
                </p>
                <p style={{ margin: '12px 0 8px 0', fontSize: '14px' }}>
                  <strong style={{ color: '#6b7280' }}>Description:</strong>
                  <br />
                  <span style={{ color: '#4b5563', fontSize: '14px', lineHeight: '1.6' }}>
                    {APPROVAL_TYPES[selectedApproval.type]?.description || 'No description available'}
                  </span>
                </p>
              </div>
            </div>

            {/* Vendor & IE Information Section */}
            <div>
              <h4 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '8px'
              }}>Vendor & Inspection Engineer</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)' }}>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280' }}>Vendor:</strong>
                    <br />
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>{selectedApproval.vendor?.name || '-'}</span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong style={{ color: '#6b7280' }}>Inspection Engineer:</strong>
                    <br />
                    <span style={{ color: '#1f2937', fontSize: '15px' }}>
                      {selectedApproval.ie?.name} ({selectedApproval.ie?.employeeId})
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Product & Stage Information Section */}
            <div>
              <h4 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '8px'
              }}>Product & Inspection Stage</h4>
              <div>
                <p style={{ margin: '8px 0', fontSize: '14px' }}>
                  <strong style={{ color: '#6b7280' }}>Product & Stage:</strong>
                  <br />
                  <span style={{ color: '#1f2937', fontSize: '15px' }}>{selectedApproval.product}</span>
                </p>
              </div>
            </div>

            {/* Status Section */}
            <div>
              <h4 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '8px'
              }}>Current Status</h4>
              <div>
                <p style={{ margin: '8px 0', fontSize: '14px' }}>
                  <strong style={{ color: '#6b7280' }}>Status:</strong>
                  <br />
                  <span style={{
                    display: 'inline-block',
                    marginTop: '4px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: '#fef3c7',
                    color: '#d97706'
                  }}>
                    {selectedApproval.status?.charAt(0).toUpperCase() + selectedApproval.status?.slice(1)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Action Modal - For Approve/Reject/Forward actions */}
      <Modal
        isOpen={showModal}
        title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Approval`}
        onClose={() => setShowModal(false)}
        footer={
          <div style={{ display: 'flex', gap: 'var(--space-12)', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmitAction}>
              Submit
            </button>
          </div>
        }
      >
        <p><strong>Call Number:</strong> {selectedApproval?.callNumber}</p>
        <p><strong>Type:</strong> {APPROVAL_TYPES[selectedApproval?.type]?.label}</p>

        <div style={{ marginTop: 'var(--space-16)' }}>
          <label className="form-label">Remarks</label>
          <textarea
            className="form-input"
            rows="4"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter remarks..."
          />
        </div>
      </Modal>
    </div>
  );
};

export default CMApprovalsTab;

