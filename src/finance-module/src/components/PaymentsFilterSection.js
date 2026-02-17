/**
 * Payments Filter Section Component
 * Reusable filter component for Finance Module payment tables
 * Follows the same pattern as CallsFilterSection from Call Desk Module
 */

import React from 'react';
import { PAYMENT_STATUS_CONFIG } from '../utils/constants';

const PaymentsFilterSection = ({
  allPayments = [],
  filteredPayments = [],
  filters,
  setFilters,
  showFilters,
  setShowFilters,
  filterSearch,
  setFilterSearch,
  selectedCategory,
  setSelectedCategory,
  clearAllFilters,
  handleFilterChange,
  handleMultiSelectToggle,
  summaryLabel = 'payments'
}) => {
  const effectivePayments = Array.isArray(allPayments) ? allPayments : [];

  const safeSetFilter = (key, value) => {
    if (typeof handleFilterChange === 'function') {
      handleFilterChange(key, value);
    } else if (typeof setFilters === 'function') {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const safeToggleMulti = (field, value) => {
    if (typeof handleMultiSelectToggle === 'function') {
      handleMultiSelectToggle(field, value);
    } else if (typeof setFilters === 'function') {
      setFilters(prev => {
        const arr = Array.isArray(prev[field]) ? prev[field] : [];
        const exists = arr.includes(value);
        return { ...prev, [field]: exists ? arr.filter(x => x !== value) : [...arr, value] };
      });
    }
  };

  // Extract unique values for filters
  const paymentTypesList = [...new Set(effectivePayments.map(p => p.paymentType).filter(Boolean))].sort();
  const vendorsList = [...new Set(effectivePayments.map(p => p.vendor?.name).filter(Boolean))].sort();
  const statusesList = [...new Set(effectivePayments.map(p => p.paymentStatus).filter(Boolean))].sort();

  // Build active filters array
  const activeFilters = [];

  (filters?.paymentTypes || []).forEach(type => {
    activeFilters.push({
      key: `paymentType-${type}`,
      label: 'Payment Type',
      value: type?.replace(/_/g, ' ').toUpperCase(),
      color: '#10b981',
      onRemove: () => safeToggleMulti('paymentTypes', type)
    });
  });

  (filters?.vendors || []).forEach(vendor => {
    activeFilters.push({
      key: `vendor-${vendor}`,
      label: 'Vendor',
      value: vendor,
      color: '#0ea5e9',
      onRemove: () => safeToggleMulti('vendors', vendor)
    });
  });

  (filters?.statuses || []).forEach(status => {
    const statusConfig = PAYMENT_STATUS_CONFIG[status] || { label: status };
    activeFilters.push({
      key: `status-${status}`,
      label: 'Status',
      value: statusConfig.label,
      color: '#8b5cf6',
      onRemove: () => safeToggleMulti('statuses', status)
    });
  });

  if (filters?.dateFrom || filters?.dateTo) {
    const dateLabel = filters.dateFrom && filters.dateTo
      ? `${filters.dateFrom} to ${filters.dateTo}`
      : filters.dateFrom
      ? `From ${filters.dateFrom}`
      : `To ${filters.dateTo}`;
    activeFilters.push({
      key: 'dateRange',
      label: 'Date Range',
      value: dateLabel,
      color: '#f59e0b',
      onRemove: () => {
        safeSetFilter('dateFrom', '');
        safeSetFilter('dateTo', '');
      }
    });
  }

  // Filter options based on search within filter panel
  const getFilteredOptions = (list) => {
    if (!filterSearch) return list;
    return list.filter(item =>
      String(item).toLowerCase().includes(filterSearch.toLowerCase())
    );
  };

  const categories = [
    { id: 'Payment Type', label: 'Payment Type', count: paymentTypesList.length },
    { id: 'Vendor', label: 'Vendor', count: vendorsList.length },
    { id: 'Status', label: 'Status', count: statusesList.length },
    { id: 'Date Range', label: 'Date Range', count: 0 }
  ];

  return (
    <>
      {/* Active Filter Chips - Show above the filter toggle */}
      {activeFilters.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '12px'
        }}>
          {activeFilters.map(filter => (
            <div
              key={filter.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: `${filter.color}15`,
                border: `1px solid ${filter.color}40`,
                borderRadius: '16px',
                fontSize: '13px',
                color: filter.color
              }}
            >
              <span style={{ fontWeight: '500' }}>{filter.label}:</span>
              <span>{filter.value}</span>
              <button
                onClick={filter.onRemove}
                style={{
                  background: 'none',
                  border: 'none',
                  color: filter.color,
                  cursor: 'pointer',
                  padding: '0 4px',
                  fontSize: '16px',
                  lineHeight: '1'
                }}
                title="Remove filter"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={clearAllFilters}
            style={{
              padding: '6px 12px',
              border: '1px solid #ef4444',
              borderRadius: '16px',
              backgroundColor: 'white',
              color: '#ef4444',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
            }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Filter Toggle - Matches Call Desk Module exactly */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn btn-outline"
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '44px' }}
          >
            <span style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </button>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Showing {filteredPayments.length} of {effectivePayments.length} {summaryLabel}
          </div>
        </div>
      </div>

      {/* Filter Panel Modal */}
      {showFilters && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={() => setShowFilters(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '900px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                Filter Payments
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Sidebar - Categories */}
              <div style={{
                width: '200px',
                borderRight: '1px solid #e5e7eb',
                overflowY: 'auto'
              }}>
                {categories.map(category => (
                  <div
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      backgroundColor: selectedCategory === category.id ? '#f3f4f6' : 'transparent',
                      borderLeft: selectedCategory === category.id ? '3px solid #3b82f6' : '3px solid transparent',
                      fontSize: '14px',
                      fontWeight: selectedCategory === category.id ? '600' : '400',
                      color: selectedCategory === category.id ? '#111827' : '#6b7280',
                      transition: 'all 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCategory !== category.id) {
                        e.target.style.backgroundColor = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCategory !== category.id) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span>{category.label}</span>
                    {category.count > 0 && (
                      <span style={{
                        fontSize: '12px',
                        color: '#9ca3af',
                        backgroundColor: '#f3f4f6',
                        padding: '2px 8px',
                        borderRadius: '10px'
                      }}>
                        {category.count}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Main Content - Filter Options */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Filter Options */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                  {/* Payment Type Filter */}
                  {selectedCategory === 'Payment Type' && (
                    <div>
                      <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        Select Payment Types
                      </div>
                      {getFilteredOptions(paymentTypesList).length > 0 ? (
                        getFilteredOptions(paymentTypesList).map(type => (
                          <label
                            key={type}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '10px 12px',
                              cursor: 'pointer',
                              borderRadius: '6px',
                              transition: 'background-color 0.2s',
                              marginBottom: '4px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <input
                              type="checkbox"
                              checked={(filters?.paymentTypes || []).includes(type)}
                              onChange={() => safeToggleMulti('paymentTypes', type)}
                              style={{ marginRight: '12px', width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '14px', color: '#374151' }}>
                              {type?.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </label>
                        ))
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                          No payment types found
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vendor Filter */}
                  {selectedCategory === 'Vendor' && (
                    <div>
                      <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        Select Vendors
                      </div>
                      {getFilteredOptions(vendorsList).length > 0 ? (
                        getFilteredOptions(vendorsList).map(vendor => (
                          <label
                            key={vendor}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '10px 12px',
                              cursor: 'pointer',
                              borderRadius: '6px',
                              transition: 'background-color 0.2s',
                              marginBottom: '4px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <input
                              type="checkbox"
                              checked={(filters?.vendors || []).includes(vendor)}
                              onChange={() => safeToggleMulti('vendors', vendor)}
                              style={{ marginRight: '12px', width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '14px', color: '#374151' }}>
                              {vendor}
                            </span>
                          </label>
                        ))
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                          No vendors found
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Filter */}
                  {selectedCategory === 'Status' && (
                    <div>
                      <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        Select Payment Statuses
                      </div>
                      {getFilteredOptions(statusesList).length > 0 ? (
                        getFilteredOptions(statusesList).map(status => {
                          const statusConfig = PAYMENT_STATUS_CONFIG[status] || { label: status };
                          return (
                            <label
                              key={status}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '10px 12px',
                                cursor: 'pointer',
                                borderRadius: '6px',
                                transition: 'background-color 0.2s',
                                marginBottom: '4px'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <input
                                type="checkbox"
                                checked={(filters?.statuses || []).includes(status)}
                                onChange={() => safeToggleMulti('statuses', status)}
                                style={{ marginRight: '12px', width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: '14px', color: '#374151' }}>
                                {statusConfig.label}
                              </span>
                            </label>
                          );
                        })
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                          No statuses found
                        </div>
                      )}
                    </div>
                  )}

                  {/* Date Range Filter */}
                  {selectedCategory === 'Date Range' && (
                    <div>
                      <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        Select Date Range
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#6b7280' }}>
                            From Date
                          </label>
                          <input
                            type="date"
                            value={filters?.dateFrom || ''}
                            onChange={(e) => safeSetFilter('dateFrom', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#6b7280' }}>
                            To Date
                          </label>
                          <input
                            type="date"
                            value={filters?.dateTo || ''}
                            onChange={(e) => safeSetFilter('dateTo', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={clearAllFilters}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f9fafb';
                  e.target.style.borderColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#e5e7eb';
                }}
              >
                Clear Filter
              </button>
              <button
                onClick={() => setShowFilters(false)}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#16a34a',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#15803d'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#16a34a'}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentsFilterSection;

