/**
 * Verified & Open Calls Tab Component
 * Displays verified and open calls (read-only)
 */

import React, { useState, useMemo } from 'react';
import DataTable from '../../../components/DataTable';
import StatusBadge from '../../../components/StatusBadge';
import CallsFilterSection from '../../../components/common/CallsFilterSection';
import RemapIEModal from './RemapIEModal';
import SleeperRemapIEModal from './SleeperRemapIEModal';
import RailpadRemapIEModal from './RailpadRemapIEModal';
import { CALL_STATUS_CONFIG } from '../utils/constants';
import { formatDateTime } from '../utils/helpers';
import { getDetailedStatus } from '../../../utils/statusMapper';

const VerifiedOpenCallsTab = ({ callType, calls = [], kpis = {}, onViewHistory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showIEModal, setShowIEModal] = useState(false);
  const [selectedIENames, setSelectedIENames] = useState('');
  const [selectedCallNo, setSelectedCallNo] = useState('');

  // Remapping state
  const [isRemapModalOpen, setIsRemapModalOpen] = useState(false);
  const [selectedCallForRemap, setSelectedCallForRemap] = useState(null);

  // Remapping feature states for Sleeper
  const [isSleeperRemapModalOpen, setIsSleeperRemapModalOpen] = useState(false);
  const [selectedSleeperCallForRemap, setSelectedSleeperCallForRemap] = useState(null);

  // Remapping feature states for Railpad
  const [isRailpadRemapModalOpen, setIsRailpadRemapModalOpen] = useState(false);
  const [selectedRailpadCallForRemap, setSelectedRailpadCallForRemap] = useState(null);

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
      render: (_value, row) => {
        const { mainStatus, combinedText } = getDetailedStatus(row.originalStatus || row.status);
        return <StatusBadge status={mainStatus} text={combinedText} />;
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
          
          {callType === 'ERC' && (
             <button
                className="btn btn-sm btn-primary"
                style={{ marginLeft: '8px' }}
                onClick={() => {
                   setSelectedCallForRemap(row);
                   setIsRemapModalOpen(true);
                }}
             >
                🔄 Remapping
             </button>
          )}

          {callType === 'SLEEPER' && (
             <button
                className="btn btn-sm btn-primary"
                style={{ marginLeft: '8px' }}
                onClick={() => {
                   setSelectedSleeperCallForRemap(row);
                   setIsSleeperRemapModalOpen(true);
                }}
             >
                🔄 Remapping
             </button>
          )}

          {callType === 'RAILPAD' && (
             <button
                className="btn btn-sm btn-primary"
                style={{ marginLeft: '8px' }}
                onClick={() => {
                   setSelectedRailpadCallForRemap(row);
                   setIsRailpadRemapModalOpen(true);
                }}
             >
                🔄 Remapping
             </button>
          )}
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
      result = result.filter(call => {
        const selected = filters.statuses;
        const callStatus = (call.status || '').toLowerCase();
        const originalStatus = (call.originalStatus || '').toLowerCase();
        const detailed = getDetailedStatus(call.originalStatus || call.status);
        const detailedText = (detailed.combinedText || '').toLowerCase();
        const mainStatus = (detailed.mainStatus || '').toLowerCase();

        return selected.some(sel => {
          const s = (sel || '').toLowerCase();
          if (!s) return true;
          if (s === 'verified_registered') {
            return callStatus === 'verified_registered' ||
                   originalStatus.includes('verif') ||
                   originalStatus.includes('register') ||
                   detailedText.includes('registered') ||
                   detailedText.includes('verified');
          }
          if (s === 'assigned_to_ie') {
            return callStatus === 'assigned_to_ie' ||
                   originalStatus.includes('assign') ||
                   detailedText.includes('assigned');
          }
          if (s === 'scheduled') {
            return callStatus === 'scheduled' ||
                   originalStatus.includes('schedule') ||
                   detailedText.includes('scheduled');
          }
          if (s === 'under_inspection') {
            return callStatus === 'under_inspection' ||
                   originalStatus.includes('inspect') ||
                   originalStatus.includes('initiate') ||
                   originalStatus.includes('shift') ||
                   originalStatus.includes('po_details') ||
                   detailedText.includes('under inspection') ||
                   mainStatus.includes('under inspection');
          }
          if (s === 'inspection_paused') {
            return callStatus === 'inspection_paused' ||
                   originalStatus.includes('paus') ||
                   detailedText.includes('paused');
          }
          if (s === 'under_lab_testing') {
            return callStatus === 'under_lab_testing' ||
                   originalStatus.includes('lab') ||
                   detailedText.includes('lab');
          }
          if (s === 'withheld') {
            return callStatus === 'withheld' ||
                   originalStatus.includes('withheld') ||
                   detailedText.includes('withheld');
          }
          if (s === 'ic_pending') {
            return callStatus === 'ic_pending' ||
                   originalStatus.includes('ic') ||
                   originalStatus.includes('confirm') ||
                   detailedText.includes('ic');
          }
          if (s === 'billing_pending') {
            return callStatus === 'billing_pending' ||
                   originalStatus.includes('bill') ||
                   detailedText.includes('bill');
          }
          if (s === 'payment_pending') {
            return callStatus === 'payment_pending' ||
                   originalStatus.includes('payment') ||
                   originalStatus.includes('blocked') ||
                   detailedText.includes('payment');
          }
          return callStatus === s || originalStatus === s || detailedText.includes(s);
        });
      });
    }

    // Search term filter - comprehensive search across all scenarios and fields
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(call => {
        const detailed = getDetailedStatus(call.originalStatus || call.status);
        const detailedText = (detailed.combinedText || '').toLowerCase();
        
        return (
          // Call number & Request ID
          (call.callNumber && call.callNumber.toLowerCase().includes(term)) ||
          (call.id && String(call.id).toLowerCase().includes(term)) ||
          // Vendor Name & Code
          (call.vendor?.name && call.vendor.name.toLowerCase().includes(term)) ||
          (call.vendorCode && call.vendorCode.toLowerCase().includes(term)) ||
          // PO Number, Raw PO, Railway PO Sr, Item Serial, Railway Short Name, IBS Case No
          (call.poNumber && call.poNumber.toLowerCase().includes(term)) ||
          (call.rawPoNo && call.rawPoNo.toLowerCase().includes(term)) ||
          (call.rlyPoSr && call.rlyPoSr.toLowerCase().includes(term)) ||
          (call.poSerialNo && call.poSerialNo.toLowerCase().includes(term)) ||
          (call.rlyShortName && call.rlyShortName.toLowerCase().includes(term)) ||
          (call.ibsCaseNo && call.ibsCaseNo.toLowerCase().includes(term)) ||
          // Product & Stage
          (call.product && call.product.toLowerCase().includes(term)) ||
          (call.productStage && call.productStage.toLowerCase().includes(term)) ||
          (call.stage && call.stage.toLowerCase().includes(term)) ||
          // Place of Inspection / Plant ID / POI Code
          (call.placeOfInspection && call.placeOfInspection.toLowerCase().includes(term)) ||
          (call.poiCode && call.poiCode.toLowerCase().includes(term)) ||
          (call.plantId && call.plantId.toLowerCase().includes(term)) ||
          // Assigned IE & Employee code
          (call.assignedIE && call.assignedIE.toLowerCase().includes(term)) ||
          (call.assignedToUserEmployeeCode && call.assignedToUserEmployeeCode.toLowerCase().includes(term)) ||
          (call.assignedToUserName && call.assignedToUserName.toLowerCase().includes(term)) ||
          // Status fields & formatted status badge text
          (call.status && call.status.toLowerCase().includes(term)) ||
          (call.originalStatus && call.originalStatus.toLowerCase().includes(term)) ||
          detailedText.includes(term) ||
          // Dates
          (call.submissionDateTime && String(call.submissionDateTime).toLowerCase().includes(term)) ||
          (call.desiredInspectionDate && String(call.desiredInspectionDate).toLowerCase().includes(term)) ||
          (call.dpDate && call.dpDate.toLowerCase().includes(term)) ||
          (call.extDpDate && call.extDpDate.toLowerCase().includes(term)) ||
          (call.dpDates && call.dpDates.toLowerCase().includes(term))
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
      callNumbers: [],
      statuses: []
    });
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
    status_label: CALL_STATUS_CONFIG[call.status]?.label || getDetailedStatus(call.originalStatus || call.status).combinedText || call.status
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
    status_label: CALL_STATUS_CONFIG[call.status]?.label || getDetailedStatus(call.originalStatus || call.status).combinedText || call.status
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
              placeholder="Search by call no, PO, vendor, status, date..."
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
              minWidth: '200px',
              minHeight: '38px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#16a34a'}
            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
          >
            {callType === 'ERC' ? (
              <>
                <option value="">All Statuses</option>
                <option value="verified_registered">Verified & Registered</option>
                <option value="assigned_to_ie">IE Assigned</option>
                <option value="scheduled">Scheduled</option>
                <option value="under_inspection">Under Inspection</option>
                <option value="under_lab_testing">Under Lab Testing</option>
                <option value="billing_pending">Billing Pending</option>
                <option value="payment_pending">Payment Pending</option>
              </>
            ) : (
              <>
                <option value="">All Statuses</option>
                <option value="verified_registered">Verified & Registered</option>
                <option value="scheduled">Scheduled</option>
                <option value="under_inspection">Under Inspection</option>
                <option value="inspection_paused">Inspection Paused</option>
                <option value="under_lab_testing">Under Lab Testing</option>
                <option value="withheld">Withheld</option>
                <option value="ic_pending">IC Pending</option>
                <option value="billing_pending">Billing Pending</option>
                <option value="payment_pending">Payment Pending</option>
              </>
            )}
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

      {/* Remap IE Modal for ERC */}
      {isRemapModalOpen && selectedCallForRemap && (
        <RemapIEModal
          callNo={selectedCallForRemap.callNumber}
          stage={selectedCallForRemap.stage}
          onClose={() => {
            setIsRemapModalOpen(false);
            setSelectedCallForRemap(null);
          }}
          onSuccess={() => {
            setIsRemapModalOpen(false);
            setSelectedCallForRemap(null);
            setTimeout(() => window.location.reload(), 500);
          }}
        />
      )}

      {/* Remap IE Modal for Sleeper */}
      {isSleeperRemapModalOpen && selectedSleeperCallForRemap && (
        <SleeperRemapIEModal
          callNo={selectedSleeperCallForRemap.callNumber}
          plantId={selectedSleeperCallForRemap.plantId}
          currentIeUserId={selectedSleeperCallForRemap.assignedToUser}
          currentIeName={selectedSleeperCallForRemap.assignedIE || 'Assigned IE'}
          currentIeEmployeeCode={selectedSleeperCallForRemap.assignedToUserEmployeeCode}
          onClose={() => setIsSleeperRemapModalOpen(false)}
          onSuccess={() => {
            setIsSleeperRemapModalOpen(false);
            window.location.reload();
          }}
        />
      )}

      {/* Railpad IE Remap Modal */}
      {isRailpadRemapModalOpen && selectedRailpadCallForRemap && (
        <RailpadRemapIEModal
          callNo={selectedRailpadCallForRemap.callNumber}
          plantId={selectedRailpadCallForRemap.plantId}
          currentIeUserId={selectedRailpadCallForRemap.assignedToUser}
          currentIeName={selectedRailpadCallForRemap.assignedIE || 'Assigned IE'}
          currentIeEmployeeCode={selectedRailpadCallForRemap.assignedToUserEmployeeCode}
          onClose={() => setIsRailpadRemapModalOpen(false)}
          onSuccess={() => {
            setIsRailpadRemapModalOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default VerifiedOpenCallsTab;

