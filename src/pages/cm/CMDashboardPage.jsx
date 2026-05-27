import React, { useState, useMemo } from 'react';
import './CMDashboard.css';

// Rich Mock Data satisfying the SRS requirements
const INITIAL_IES = [
  { id: 'IE001', name: 'Rajesh Kumar', region: 'RIO North', activeCalls: 5, workload: 82, slaCompliance: 96, avgDays: 2.1, status: 'Normal' },
  { id: 'IE002', name: 'Priya Sharma', region: 'RIO North', activeCalls: 3, workload: 68, slaCompliance: 98, avgDays: 1.8, status: 'Normal' },
  { id: 'IE003', name: 'Amit Patel', region: 'RIO East', activeCalls: 7, workload: 94, slaCompliance: 88, avgDays: 3.2, status: 'Overloaded' },
  { id: 'IE004', name: 'Sneha Reddy', region: 'RIO South', activeCalls: 2, workload: 45, slaCompliance: 99, avgDays: 1.5, status: 'Normal' },
  { id: 'IE005', name: 'Vikram Singh', region: 'RIO West', activeCalls: 6, workload: 88, slaCompliance: 92, avgDays: 2.6, status: 'High' }
];

const INITIAL_VENDORS = [
  { id: 'V001', name: 'Global Materials Corp', region: 'RIO North', rating: 4.8, activeCalls: 12, rejectionRate: 2.4, inspections: 48 },
  { id: 'V002', name: 'Premium Materials Inc', region: 'RIO North', rating: 4.5, activeCalls: 8, rejectionRate: 3.1, inspections: 35 },
  { id: 'V003', name: 'Steel Industries Ltd', region: 'RIO East', rating: 3.9, activeCalls: 15, rejectionRate: 7.8, inspections: 62 },
  { id: 'V004', name: 'Quality Forge Pvt Ltd', region: 'RIO South', rating: 4.7, activeCalls: 5, rejectionRate: 1.2, inspections: 22 },
  { id: 'V005', name: 'Precision Engineering Co', region: 'RIO West', rating: 4.2, activeCalls: 10, rejectionRate: 4.0, inspections: 41 }
];

const INITIAL_CALLS = [
  {
    id: 'CALL-2026-101',
    callNumber: 'CALL-2026-101',
    product: 'ERC',
    stage: 'Process',
    poNumber: 'CR-93428947-001',
    dpDate: '2026-06-05',
    extDpDate: '2026-06-12',
    materialValue: 1850000,
    vendorName: 'Global Materials Corp',
    desiredInspectionDate: '2026-05-24', // Crossed desired date by 3 days
    callDate: '2026-05-18',
    ieName: 'Rajesh Kumar',
    cmName: 'S. K. Verma',
    ritesRio: 'RIO North',
    status: 'Pending',
    subStatus: 'IE assigned',
    remarks: 'Ready for process inspection of batch 45.',
    docs: { ic: false, po: true, itp: true, annexure: true, calibration: true }
  },
  {
    id: 'CALL-2026-102',
    callNumber: 'CALL-2026-102',
    product: 'Sleeper',
    stage: 'Final',
    poNumber: 'CR-93428947-002',
    dpDate: '2026-05-10',
    extDpDate: '2026-05-18',
    materialValue: 3420000,
    vendorName: 'Premium Materials Inc',
    desiredInspectionDate: '2026-05-12', // Crossed by 15 days (Pending + 7 days crossed -> Overdue)
    callDate: '2026-05-05',
    ieName: 'Priya Sharma',
    cmName: 'S. K. Verma',
    ritesRio: 'RIO North',
    status: 'Pending',
    subStatus: 'Raised',
    remarks: 'Visual inspection pending for concrete sleepers.',
    docs: { ic: false, po: true, itp: true, annexure: false, calibration: true }
  },
  {
    id: 'CALL-2026-103',
    callNumber: 'CALL-2026-103',
    product: 'Rail Pad',
    stage: 'Final',
    poNumber: 'CR-93428947-003',
    dpDate: '2026-05-28',
    extDpDate: '2026-06-05',
    materialValue: 920000,
    vendorName: 'Steel Industries Ltd',
    desiredInspectionDate: '2026-05-26',
    callDate: '2026-05-20',
    ieName: 'Amit Patel',
    cmName: 'A. K. Gupta',
    ritesRio: 'RIO East',
    status: 'Under Inspection',
    subStatus: 'Initiated',
    remarks: 'Hardness testing under process in Lab B.',
    docs: { ic: false, po: true, itp: true, annexure: true, calibration: false }
  },
  {
    id: 'CALL-2026-104',
    callNumber: 'CALL-2026-104',
    product: 'ERC',
    stage: 'RM',
    poNumber: 'CR-93428947-004',
    dpDate: '2026-05-20',
    extDpDate: '2026-05-25',
    materialValue: 1250000,
    vendorName: 'Quality Forge Pvt Ltd',
    desiredInspectionDate: '2026-05-16',
    callDate: '2026-05-12',
    ieName: 'Sneha Reddy',
    cmName: 'V. S. Rao',
    ritesRio: 'RIO South',
    status: 'IC Issuance Pending',
    subStatus: 'Completed',
    remarks: 'All lab reports passed. Drafting inspection certificate.',
    docs: { ic: false, po: true, itp: true, annexure: true, calibration: true }
  },
  {
    id: 'CALL-2026-105',
    callNumber: 'CALL-2026-105',
    product: 'Sleeper',
    stage: 'Process',
    poNumber: 'CR-93428947-005',
    dpDate: '2026-05-02',
    extDpDate: '2026-05-12',
    materialValue: 2800000,
    vendorName: 'Precision Engineering Co',
    desiredInspectionDate: '2026-05-04',
    callDate: '2026-04-28',
    ieName: 'Vikram Singh',
    cmName: 'M. K. Deshmukh',
    ritesRio: 'RIO West',
    status: 'Completed',
    subStatus: 'IC Issued',
    remarks: 'IC dispatched and billed successfully.',
    docs: { ic: true, po: true, itp: true, annexure: true, calibration: true }
  },
  {
    id: 'CALL-2026-106',
    callNumber: 'CALL-2026-106',
    product: 'Rail Pad',
    stage: 'Process',
    poNumber: 'CR-93428947-006',
    dpDate: '2026-05-15',
    extDpDate: '2026-05-22',
    materialValue: 740000,
    vendorName: 'Global Materials Corp',
    desiredInspectionDate: '2026-05-14', // Crossed by 13 days and still not initiated -> Overdue
    callDate: '2026-05-06',
    ieName: 'Rajesh Kumar',
    cmName: 'S. K. Verma',
    ritesRio: 'RIO North',
    status: 'Pending',
    subStatus: 'Raised',
    remarks: 'Waiting for vendor raw material clearance certificate.',
    docs: { ic: false, po: true, itp: false, annexure: true, calibration: false }
  },
  {
    id: 'CALL-2026-107',
    callNumber: 'CALL-2026-107',
    product: 'ERC',
    stage: 'Final',
    poNumber: 'CR-93428947-007',
    dpDate: '2026-06-10',
    extDpDate: '2026-06-20',
    materialValue: 1550000,
    vendorName: 'Premium Materials Inc',
    desiredInspectionDate: '2026-05-29',
    callDate: '2026-05-24',
    ieName: 'Priya Sharma',
    cmName: 'S. K. Verma',
    ritesRio: 'RIO North',
    status: 'Pending',
    subStatus: 'Scheduled',
    remarks: 'Process schedule finalized for next week.',
    docs: { ic: false, po: true, itp: true, annexure: true, calibration: true }
  },
  {
    id: 'CALL-2026-108',
    callNumber: 'CALL-2026-108',
    product: 'Sleeper',
    stage: 'RM',
    poNumber: 'CR-93428947-008',
    dpDate: '2026-05-25',
    extDpDate: '2026-06-02',
    materialValue: 4100000,
    vendorName: 'Steel Industries Ltd',
    desiredInspectionDate: '2026-05-22',
    callDate: '2026-05-15',
    ieName: 'Amit Patel',
    cmName: 'A. K. Gupta',
    ritesRio: 'RIO East',
    status: 'Under Inspection',
    subStatus: 'Initiated',
    remarks: 'Visual checks complete, physical testing in progress.',
    docs: { ic: false, po: true, itp: true, annexure: false, calibration: true }
  }
];

const INITIAL_APPROVALS = [
  { id: 'APR-001', callNumber: 'CALL-2026-102', type: 'Quantity Enhancement', ie: 'Priya Sharma', vendor: 'Premium Materials Inc', product: 'Sleeper (Final)', requestedDate: '2026-05-22', status: 'pending', priority: 'High', details: 'Request to increase sleeper casting inspection volume by 120 units due to production run consolidation.' },
  { id: 'APR-002', callNumber: 'CALL-2026-101', type: 'Rescheduling', ie: 'Rajesh Kumar', vendor: 'Global Materials Corp', product: 'ERC (Process)', requestedDate: '2026-05-25', status: 'pending', priority: 'Medium', details: 'Delay in process testing equipment calibration. Requesting shift from May 24 to May 30.' },
  { id: 'APR-003', callNumber: 'CALL-2026-103', type: 'Discrepancy Approval', ie: 'Amit Patel', vendor: 'Steel Industries Ltd', product: 'Rail Pad (Final)', requestedDate: '2026-05-26', status: 'pending', priority: 'Low', details: 'Slight chemical makeup variation in GRSP batch. Within tolerance bounds but requires CM sign-off.' },
  { id: 'APR-004', callNumber: 'CALL-2026-106', type: 'Withholding Request', ie: 'Rajesh Kumar', vendor: 'Global Materials Corp', product: 'Rail Pad (Process)', requestedDate: '2026-05-26', status: 'pending', priority: 'Critical', details: 'Repeated failing dimensions in thickness test. Inspector requests formal withholding of batch.' }
];

export const CMDashboardPage = () => {
  // Navigation tabs state matching SRS options exactly
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [activeCallFilter, setActiveCallFilter] = useState('all'); // Clicked KPI filter: all, pending, under_inspection, ic_pending, completed, overdue
  const [callMenuOpen, setCallMenuOpen] = useState(true); // Call Monitoring submenu toggle
  const [ieMenuOpen, setIeMenuOpen] = useState(true); // IE Monitoring submenu toggle
  const [vendorMenuOpen, setVendorMenuOpen] = useState(true); // Vendor Quality Monitoring submenu toggle
  const [reportsMenuOpen, setReportsMenuOpen] = useState(true); // Reports submenu toggle
  const [allReportsMenuOpen, setAllReportsMenuOpen] = useState(true); // All Reports submenu toggle
  const [activeReportTab, setActiveReportTab] = useState('Monthly Progress Report'); // Active sub-report

  // Collapsible sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Data states
  const [calls] = useState(INITIAL_CALLS);
  const [approvals, setApprovals] = useState(INITIAL_APPROVALS);
  const [notification, setNotification] = useState(null);

  // Global Filters states
  const [selectedRegions, setSelectedRegions] = useState(['RIO North']); // Default CM belongs to RIO North
  const [selectedIEs, setSelectedIEs] = useState(['Rajesh Kumar', 'Priya Sharma']); // Belonging to CM by default
  const [selectedProducts, setSelectedProducts] = useState(['ERC', 'Sleeper', 'Rail Pad']);
  const [selectedVendors, setSelectedVendors] = useState(['Global Materials Corp', 'Premium Materials Inc', 'Steel Industries Ltd', 'Quality Forge Pvt Ltd', 'Precision Engineering Co']);
  const [selectedStages, setSelectedStages] = useState(['RM', 'Process', 'Final']);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Expand/collapse global filters panel
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  // Sorting & Pagination states
  const [sortField, setSortField] = useState('callNumber');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Approvals workflow modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeApproval, setActiveApproval] = useState(null);
  const [modalAction, setModalAction] = useState(''); // 'approve', 'reject', 'forward'
  const [remarksInput, setRemarksInput] = useState('');

  // Dynamically calculate "Overdue Calls" (Pending calls where crossed Desired Date by 7 days and still not initiated)
  const isOverdue = (call) => {
    if (call.status !== 'Pending') return false;
    const desired = new Date(call.desiredInspectionDate);
    const current = new Date('2026-05-27'); // Given current system date
    const diffTime = current - desired;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 7;
  };

  // Helper trigger to show custom alert message
  const triggerNotification = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filter and sort the inspection calls list
  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      // Global Text Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesQuery = 
          call.callNumber.toLowerCase().includes(query) ||
          call.poNumber.toLowerCase().includes(query) ||
          call.vendorName.toLowerCase().includes(query) ||
          (call.ieName && call.ieName.toLowerCase().includes(query)) ||
          call.ritesRio.toLowerCase().includes(query);
        
        if (!matchesQuery) return false;
      }

      // Region Filter
      if (selectedRegions.length > 0 && !selectedRegions.includes(call.ritesRio)) return false;

      // IE Filter
      if (selectedIEs.length > 0 && !selectedIEs.includes(call.ieName)) return false;

      // Product Filter
      if (selectedProducts.length > 0 && !selectedProducts.includes(call.product)) return false;

      // Vendor Filter
      if (selectedVendors.length > 0 && !selectedVendors.includes(call.vendorName)) return false;

      // Inspection Stage Filter
      if (selectedStages.length > 0 && !selectedStages.includes(call.stage)) return false;

      // Clicking KPI Card Filtering / Subsection Filtering
      if (activeCallFilter === 'pending') {
        return call.status === 'Pending';
      } else if (activeCallFilter === 'under_inspection') {
        return call.status === 'Under Inspection';
      } else if (activeCallFilter === 'ic_pending') {
        return call.status === 'IC Issuance Pending';
      } else if (activeCallFilter === 'completed') {
        return call.status === 'Completed';
      } else if (activeCallFilter === 'overdue') {
        return isOverdue(call);
      }

      return true;
    });
  }, [calls, searchQuery, selectedRegions, selectedIEs, selectedProducts, selectedVendors, selectedStages, activeCallFilter]);

  // Sort Call list
  const sortedCalls = useMemo(() => {
    const sorted = [...filteredCalls];
    sorted.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle nested values or custom mappings
      if (sortField === 'status') {
        valA = `${a.status}-${a.subStatus}`;
        valB = `${b.status}-${b.subStatus}`;
      }

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        return sortDirection === 'asc' 
          ? valA - valB 
          : valB - valA;
      }
    });
    return sorted;
  }, [filteredCalls, sortField, sortDirection]);

  // Paginated Call list
  const paginatedCalls = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCalls.slice(start, start + pageSize);
  }, [sortedCalls, currentPage, pageSize]);

  // Total pages
  const totalPages = Math.ceil(sortedCalls.length / pageSize) || 1;

  // KPI Dynamic Sum Calculations (Based strictly on the overall loaded calls + global filters)
  const kpiStats = useMemo(() => {
    const baseList = calls.filter(call => {
      if (selectedRegions.length > 0 && !selectedRegions.includes(call.ritesRio)) return false;
      if (selectedIEs.length > 0 && !selectedIEs.includes(call.ieName)) return false;
      if (selectedProducts.length > 0 && !selectedProducts.includes(call.product)) return false;
      if (selectedVendors.length > 0 && !selectedVendors.includes(call.vendorName)) return false;
      if (selectedStages.length > 0 && !selectedStages.includes(call.stage)) return false;
      return true;
    });

    const total = baseList.length;
    const pending = baseList.filter(c => c.status === 'Pending').length;
    const underInspection = baseList.filter(c => c.status === 'Under Inspection').length;
    const icPending = baseList.filter(c => c.status === 'IC Issuance Pending').length;
    const completed = baseList.filter(c => c.status === 'Completed').length;
    const overdue = baseList.filter(c => isOverdue(c)).length;

    return { total, pending, underInspection, icPending, completed, overdue };
  }, [calls, selectedRegions, selectedIEs, selectedProducts, selectedVendors, selectedStages]);

  // Handle document PDF mock downloading
  const handleDownloadPdf = (callNumber, docType) => {
    triggerNotification(`Downloading ${docType} document for ${callNumber} in sequence...`, 'info');
    
    // Simulate file generation & download
    setTimeout(() => {
      triggerNotification(`${docType} document downloaded successfully!`, 'success');
    }, 800);
  };

  // Handle header sorting click
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Switch to specific Call Monitoring subsection
  const handleCallMonitoringTab = (subFilter) => {
    setActiveTab('Call Monitoring');
    setActiveCallFilter(subFilter);
    setCurrentPage(1);
  };

  // Multi-select helper toggle
  const toggleFilterOption = (option, selectedList, setter) => {
    if (selectedList.includes(option)) {
      if (selectedList.length === 1) {
        triggerNotification('At least one filter item must remain selected.', 'warning');
        return;
      }
      setter(selectedList.filter(item => item !== option));
    } else {
      setter([...selectedList, option]);
    }
    setCurrentPage(1);
  };

  // Reset all global filters to defaults
  const handleResetFilters = () => {
    setSelectedRegions(['RIO North']);
    setSelectedIEs(['Rajesh Kumar', 'Priya Sharma']);
    setSelectedProducts(['ERC', 'Sleeper', 'Rail Pad']);
    setSelectedVendors(['Global Materials Corp', 'Premium Materials Inc', 'Steel Industries Ltd', 'Quality Forge Pvt Ltd', 'Precision Engineering Co']);
    setSelectedStages(['RM', 'Process', 'Final']);
    setSearchQuery('');
    setActiveCallFilter('all');
    setCurrentPage(1);
    triggerNotification('Global filters reset to CM default limits.', 'info');
  };

  // Handle Approvals actions
  const openApprovalModal = (approval, action) => {
    setActiveApproval(approval);
    setModalAction(action);
    setRemarksInput('');
    setModalOpen(true);
  };

  const submitApprovalAction = () => {
    if (!remarksInput.trim()) {
      triggerNotification('Remarks are mandatory for audit trail logs.', 'warning');
      return;
    }

    // Update approval status local state
    setApprovals(prev => prev.map(item => {
      if (item.id === activeApproval.id) {
        return {
          ...item,
          status: modalAction === 'approve' ? 'approved' : modalAction === 'reject' ? 'rejected' : 'forwarded',
          remarks: remarksInput
        };
      }
      return item;
    }));

    // Trigger toast notification
    const actionLabel = modalAction === 'approve' ? 'approved' : modalAction === 'reject' ? 'rejected' : 'forwarded to senior management';
    triggerNotification(`Request ${activeApproval.id} has been successfully ${actionLabel}!`, 'success');
    
    setModalOpen(false);
    setActiveApproval(null);
  };

  // Format Currencies (Material Values)
  const formatIndianCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Approval Pending Count
  const pendingApprovalsCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <div className={`cm-dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Floating toggle tab — sticks to right edge of sidebar, below app header */}
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        style={{
          position: 'fixed',
          top: '220px',
          left: isSidebarCollapsed ? '56px' : '206px',
          zIndex: 200,
          width: '26px',
          height: '26px',
          borderRadius: '0 6px 6px 0',
          background: '#14532d',
          border: 'none',
          color: '#fff',
          fontSize: '11px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '2px 2px 6px rgba(0,0,0,0.2)',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <i className={`fa-solid ${isSidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
      </button>

      {/* Sidebar — no header, just nav */}
      <aside className={`cm-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>

        <nav style={{ paddingBottom: '20px', paddingTop: '10px' }}>
          {/* Dashboard (Direct Item) */}
          <div className="cm-menu-group">
            <div 
              className={`cm-menu-item ${activeTab === 'Dashboard' ? 'active' : ''}`}
              onClick={() => { setActiveTab('Dashboard'); setActiveCallFilter('all'); }}
            >
              <i className="cm-menu-item-icon fa-solid fa-chart-pie"></i>
              {!isSidebarCollapsed && <span>Dashboard</span>}
            </div>
          </div>

          {/* Call Monitoring (Collapsible Menu) */}
          <div className="cm-menu-group">
            <div 
              className={`cm-menu-item ${activeTab === 'Call Monitoring' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('Call Monitoring');
                setActiveCallFilter('all');
                setCallMenuOpen(!callMenuOpen);
              }}
              style={!isSidebarCollapsed ? { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } : undefined}
            >
              {!isSidebarCollapsed ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="cm-menu-item-icon fa-solid fa-phone"></i>
                    <span>Call Monitoring</span>
                  </div>
                  <i className={`fa-solid fa-xs ${callMenuOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ opacity: 0.6 }}></i>
                </>
              ) : (
                <i className="cm-menu-item-icon fa-solid fa-phone"></i>
              )}
            </div>
            
            {callMenuOpen && !isSidebarCollapsed && (
              <div className="cm-submenu">
                <div 
                  className={`cm-submenu-link ${activeTab === 'Call Monitoring' && activeCallFilter === 'all' ? 'active' : ''}`}
                  onClick={() => handleCallMonitoringTab('all')}
                >
                  <i className="fa-solid fa-phone" style={{ marginRight: '8px', fontSize: '11px' }}></i>
                  All Calls
                </div>
                <div 
                  className={`cm-submenu-link ${activeTab === 'Call Monitoring' && activeCallFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => handleCallMonitoringTab('pending')}
                >
                  <i className="fa-solid fa-hourglass-half" style={{ marginRight: '8px', fontSize: '11px' }}></i>
                  Pending Calls
                </div>
                <div 
                  className={`cm-submenu-link ${activeTab === 'Call Monitoring' && activeCallFilter === 'under_inspection' ? 'active' : ''}`}
                  onClick={() => handleCallMonitoringTab('under_inspection')}
                >
                  <i className="fa-solid fa-sliders" style={{ marginRight: '8px', fontSize: '11px' }}></i>
                  Under Inspection Calls
                </div>
                <div 
                  className={`cm-submenu-link ${activeTab === 'Call Monitoring' && activeCallFilter === 'ic_pending' ? 'active' : ''}`}
                  onClick={() => handleCallMonitoringTab('ic_pending')}
                >
                  <i className="fa-solid fa-file-invoice" style={{ marginRight: '8px', fontSize: '11px' }}></i>
                  IC Issuance Pending
                </div>
                <div 
                  className={`cm-submenu-link ${activeTab === 'Call Monitoring' && activeCallFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => handleCallMonitoringTab('completed')}
                >
                  <i className="fa-solid fa-circle-check" style={{ marginRight: '8px', fontSize: '11px' }}></i>
                  Completed Calls
                </div>
                <div 
                  className={`cm-submenu-link ${activeTab === 'Call Monitoring' && activeCallFilter === 'overdue' ? 'active' : ''}`}
                  onClick={() => handleCallMonitoringTab('overdue')}
                >
                  <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px', fontSize: '11px' }}></i>
                  Overdue Calls
                </div>
              </div>
            )}
          </div>

          {/* IE Monitoring (Collapsible Menu) */}
          <div className="cm-menu-group">
            <div 
              className={`cm-menu-item ${['IE wise Call Status', 'IE Performance Monitoring'].includes(activeTab) ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('IE wise Call Status');
                setIeMenuOpen(!ieMenuOpen);
              }}
              style={!isSidebarCollapsed ? { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } : undefined}
            >
              {!isSidebarCollapsed ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="cm-menu-item-icon fa-solid fa-users-viewfinder"></i>
                    <span>IE Monitoring</span>
                  </div>
                  <i className={`fa-solid fa-xs ${ieMenuOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ opacity: 0.6 }}></i>
                </>
              ) : (
                <i className="cm-menu-item-icon fa-solid fa-users-viewfinder"></i>
              )}
            </div>
            
            {ieMenuOpen && !isSidebarCollapsed && (
              <div className="cm-submenu">
                <div 
                  className={`cm-submenu-link ${activeTab === 'IE wise Call Status' ? 'active' : ''}`}
                  onClick={() => setActiveTab('IE wise Call Status')}
                >
                  <i className="fa-solid fa-map-pin" style={{ marginRight: '8px', fontSize: '11px' }}></i>
                  IE wise Call Status
                </div>
                <div 
                  className={`cm-submenu-link ${activeTab === 'IE Performance Monitoring' ? 'active' : ''}`}
                  onClick={() => setActiveTab('IE Performance Monitoring')}
                >
                  <i className="fa-solid fa-trophy" style={{ marginRight: '8px', fontSize: '11px' }}></i>
                  IE Performance Monitoring
                </div>
              </div>
            )}
          </div>

          {/* Vendor Quality Monitoring (Collapsible Menu) */}
          <div className="cm-menu-group">
            <div 
              className={`cm-menu-item ${['Vendor Quality Monitoring', 'Charts', 'All Reports', 'SQC Analysis', 'SCADA Monitoring'].includes(activeTab) ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('Vendor Quality Monitoring');
                setVendorMenuOpen(!vendorMenuOpen);
              }}
              style={!isSidebarCollapsed ? { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } : undefined}
            >
              {!isSidebarCollapsed ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="cm-menu-item-icon fa-solid fa-industry"></i>
                    <span>Vendor Quality Monitoring</span>
                  </div>
                  <i className={`fa-solid fa-xs ${vendorMenuOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ opacity: 0.6 }}></i>
                </>
              ) : (
                <i className="cm-menu-item-icon fa-solid fa-industry"></i>
              )}
            </div>
            
            {vendorMenuOpen && !isSidebarCollapsed && (
              <div className="cm-submenu">
                <div 
                  className={`cm-submenu-link ${activeTab === 'Charts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Charts')}
                >
                  <i className="fa-solid fa-chart-column" style={{ marginRight: '8px', fontSize: '11px' }}></i>
                  Charts
                </div>
                <div 
                  className={`cm-submenu-link ${activeTab === 'All Reports' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('All Reports');
                    setAllReportsMenuOpen(!allReportsMenuOpen);
                  }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <i className="fa-solid fa-clipboard-list" style={{ marginRight: '8px', fontSize: '11px' }}></i>
                    <span>All Reports</span>
                  </div>
                  <i className={`fa-solid fa-xs ${allReportsMenuOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ opacity: 0.6 }}></i>
                </div>

                {allReportsMenuOpen && activeTab === 'All Reports' && (
                  <div className="cm-nested-submenu" style={{ paddingLeft: '12px', borderLeft: '1.5px solid rgba(21, 128, 61, 0.25)', marginLeft: '16px', marginTop: '4px', marginBottom: '8px' }}>
                    {[
                      'Monthly Progress Report',
                      'Monthly Analysis of Units',
                      'Lot Wise Closed Loop',
                      'Shift Wise Production Report',
                      'Vendor wise Monthly Report',
                      'PO Wise Monthly Report'
                    ].map(reportName => (
                      <div 
                        key={reportName}
                        className={`cm-submenu-link ${activeReportTab === reportName ? 'active' : ''}`}
                        onClick={() => {
                          setActiveTab('All Reports');
                          setActiveReportTab(reportName);
                        }}
                        style={{ fontSize: '12px', padding: '6px 10px', whiteSpace: 'normal', height: 'auto', display: 'block', margin: '4px 0' }}
                      >
                        {reportName}
                      </div>
                    ))}
                  </div>
                )}
                <div 
                  className={`cm-submenu-link ${activeTab === 'SQC Analysis' ? 'active' : ''}`}
                  onClick={() => setActiveTab('SQC Analysis')}
                >
                  <i className="fa-solid fa-chart-line" style={{ marginRight: '8px', fontSize: '11px' }}></i>
                  SQC Analysis
                </div>
                <div 
                  className={`cm-submenu-link ${activeTab === 'SCADA Monitoring' ? 'active' : ''}`}
                  onClick={() => setActiveTab('SCADA Monitoring')}
                >
                  <i className="fa-solid fa-desktop" style={{ marginRight: '8px', fontSize: '11px' }}></i>
                  SCADA Monitoring
                </div>
              </div>
            )}
          </div>

          {/* PO Lifecycle (Direct Item) */}
          <div className="cm-menu-group">
            <div 
              className={`cm-menu-item ${activeTab === 'PO Lifecycle' ? 'active' : ''}`}
              onClick={() => setActiveTab('PO Lifecycle')}
            >
              <i className="cm-menu-item-icon fa-solid fa-diagram-project"></i>
              {!isSidebarCollapsed && <span>PO Lifecycle</span>}
            </div>
          </div>

          {/* Reports (Collapsible Menu) */}
          <div className="cm-menu-group">
            <div 
              className={`cm-menu-item ${['Reports', 'Mandays Calculation'].includes(activeTab) ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('Reports');
                setReportsMenuOpen(!reportsMenuOpen);
              }}
              style={!isSidebarCollapsed ? { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } : undefined}
            >
              {!isSidebarCollapsed ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="cm-menu-item-icon fa-solid fa-download"></i>
                    <span>Reports</span>
                  </div>
                  <i className={`fa-solid fa-xs ${reportsMenuOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ opacity: 0.6 }}></i>
                </>
              ) : (
                <i className="cm-menu-item-icon fa-solid fa-download"></i>
              )}
            </div>
            
            {reportsMenuOpen && !isSidebarCollapsed && (
              <div className="cm-submenu">
                <div 
                  className={`cm-submenu-link ${activeTab === 'Mandays Calculation' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Mandays Calculation')}
                >
                  <i className="fa-solid fa-calculator" style={{ marginRight: '8px', fontSize: '11px' }}></i>
                  Mandays Calculation
                </div>
              </div>
            )}
          </div>

          {/* Notification & Approval (Direct Item) */}
          <div className="cm-menu-group">
            <div 
              className={`cm-menu-item ${activeTab === 'Notification & Approval' ? 'active' : ''}`}
              onClick={() => setActiveTab('Notification & Approval')}
            >
              <i className="cm-menu-item-icon fa-solid fa-key"></i>
              {!isSidebarCollapsed && (
                <span>
                  Notification & Approval 
                  {pendingApprovalsCount > 0 && (
                    <span style={{
                      marginLeft: '8px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      padding: '2px 7px',
                      borderRadius: '20px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>{pendingApprovalsCount}</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Panel Content Area */}
      <main className="cm-main-panel">
        
        {/* Custom Notifications Toast */}
        {notification && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: notification.type === 'success' ? '#15803d' : notification.type === 'error' ? '#b91c1c' : '#1d4ed8',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            zIndex: 2000,
            fontWeight: '500',
            transition: 'all 0.3s ease'
          }}>
            {notification.text}
          </div>
        )}

        {/* Global CM Dashboard and Call Monitoring Tabs */}
        {(activeTab === 'Dashboard' || activeTab === 'Call Monitoring') && (
          <>
            {/* Header Area */}
            <div className="cm-panel-header">
              <div className="cm-panel-title-area">
                <h1 className="cm-panel-title">
                  {activeTab === 'Dashboard' ? 'Controlling Manager Dashboard' : 'Call Monitoring Center'}
                </h1>
                <p className="cm-panel-subtitle">
                  Live monitoring, validation, and analytics of ERC, Sleeper, and Rail Pad inspection assignments.
                </p>
              </div>
              <button className="btn btn--outline" onClick={handleResetFilters}>
                <i className="fa-solid fa-rotate-left" style={{ marginRight: '6px' }}></i> Reset Filters
              </button>
            </div>

            {/* KPI Cards Grid - CLICKABLE triggers Call table filter, Styled exactly matching RB professional cards */}
            <section className="cm-kpi-grid">
              <div 
                className={`cm-kpi-card card-dark-green ${activeCallFilter === 'all' ? 'active' : ''}`}
                onClick={() => { setActiveCallFilter('all'); setCurrentPage(1); }}
              >
                <div className="cm-kpi-header">
                  <span className="cm-kpi-title">Total Calls</span>
                  <i className="cm-kpi-icon fa-solid fa-list-check"></i>
                </div>
                <div className="cm-kpi-value">{kpiStats.total}</div>
                <div className="cm-kpi-footer">Calls in current view</div>
              </div>

              <div 
                className={`cm-kpi-card card-amber ${activeCallFilter === 'pending' ? 'active' : ''}`}
                onClick={() => { setActiveCallFilter('pending'); setCurrentPage(1); }}
              >
                <div className="cm-kpi-header">
                  <span className="cm-kpi-title">Pending Calls</span>
                  <i className="cm-kpi-icon fa-solid fa-hourglass-half"></i>
                </div>
                <div className="cm-kpi-value">{kpiStats.pending}</div>
                <div className="cm-kpi-footer">Raised & uninitiated by IE</div>
              </div>

              <div 
                className={`cm-kpi-card card-ocean ${activeCallFilter === 'under_inspection' ? 'active' : ''}`}
                onClick={() => { setActiveCallFilter('under_inspection'); setCurrentPage(1); }}
              >
                <div className="cm-kpi-header">
                  <span className="cm-kpi-title">Under Inspection Calls</span>
                  <i className="cm-kpi-icon fa-solid fa-sliders"></i>
                </div>
                <div className="cm-kpi-value">{kpiStats.underInspection}</div>
                <div className="cm-kpi-footer">Initiated but not completed</div>
              </div>

              <div 
                className={`cm-kpi-card card-indigo ${activeCallFilter === 'ic_pending' ? 'active' : ''}`}
                onClick={() => { setActiveCallFilter('ic_pending'); setCurrentPage(1); }}
              >
                <div className="cm-kpi-header">
                  <span className="cm-kpi-title">IC Issuance Pending</span>
                  <i className="cm-kpi-icon fa-solid fa-file-invoice"></i>
                </div>
                <div className="cm-kpi-value">{kpiStats.icPending}</div>
                <div className="cm-kpi-footer">Pending IC issuance</div>
              </div>

              <div 
                className={`cm-kpi-card card-spring-green ${activeCallFilter === 'completed' ? 'active' : ''}`}
                onClick={() => { setActiveCallFilter('completed'); setCurrentPage(1); }}
              >
                <div className="cm-kpi-header">
                  <span className="cm-kpi-title">Completed Calls</span>
                  <i className="cm-kpi-icon fa-solid fa-circle-check"></i>
                </div>
                <div className="cm-kpi-value">{kpiStats.completed}</div>
                <div className="cm-kpi-footer">Finished & IC Dispatched</div>
              </div>

              <div 
                className={`cm-kpi-card card-ruby ${activeCallFilter === 'overdue' ? 'active' : ''}`}
                onClick={() => { setActiveCallFilter('overdue'); setCurrentPage(1); }}
              >
                <div className="cm-kpi-header">
                  <span className="cm-kpi-title">Overdue Calls</span>
                  <i className="cm-kpi-icon fa-solid fa-triangle-exclamation"></i>
                </div>
                <div className="cm-kpi-value">{kpiStats.overdue}</div>
                <div className="cm-kpi-footer">Crossed desired date by 7d</div>
              </div>
            </section>

            {/* Global Filters Panel — Premium Redesign */}
            <section style={{ background: '#fff', borderRadius: '12px', border: '1px solid #d1fae5', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              {/* Header Bar */}
              <div
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                style={{
                  background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fa-solid fa-sliders" style={{ color: '#fff', fontSize: '13px' }} />
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: '700', fontSize: '13px', letterSpacing: '0.3px' }}>Global Controls &amp; Filters</div>
                    <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px' }}>
                      {filtersExpanded ? 'Click to collapse' : `${selectedRegions.length + selectedIEs.length + selectedProducts.length + selectedVendors.length + selectedStages.length} filters active`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: '700' }}>
                    {selectedRegions.length + selectedIEs.length + selectedProducts.length + selectedVendors.length + selectedStages.length} active
                  </div>
                  <i className={`fa-solid ${filtersExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }} />
                </div>
              </div>

              {filtersExpanded && (
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>

                    {/* Region */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fa-solid fa-location-dot" style={{ fontSize: '10px', color: '#15803d' }} />
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#4b6b4b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Region (RIO)</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {['RIO North', 'RIO East', 'RIO South', 'RIO West'].map(rio => {
                          const on = selectedRegions.includes(rio);
                          return (
                            <div key={rio} onClick={() => toggleFilterOption(rio, selectedRegions, setSelectedRegions)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', transition: 'all 0.2s', background: on ? '#14532d' : '#f0fdf4', color: on ? '#fff' : '#14532d', border: `1px solid ${on ? '#14532d' : '#bbf7d0'}`, boxShadow: on ? '0 2px 6px rgba(21,128,61,0.25)' : 'none' }}>
                              {on && <i className="fa-solid fa-check" style={{ fontSize: '9px' }} />}
                              {rio}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* IE */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fa-solid fa-user-tie" style={{ fontSize: '10px', color: '#1d4ed8' }} />
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#4b6b4b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Engineer (IE)</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {INITIAL_IES.map(ie => {
                          const on = selectedIEs.includes(ie.name);
                          return (
                            <div key={ie.id} onClick={() => toggleFilterOption(ie.name, selectedIEs, setSelectedIEs)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', transition: 'all 0.2s', background: on ? '#1d4ed8' : '#eff6ff', color: on ? '#fff' : '#1d4ed8', border: `1px solid ${on ? '#1d4ed8' : '#bfdbfe'}`, boxShadow: on ? '0 2px 6px rgba(29,78,216,0.25)' : 'none' }}>
                              {on && <i className="fa-solid fa-check" style={{ fontSize: '9px' }} />}
                              {ie.name}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Product */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fa-solid fa-cubes" style={{ fontSize: '10px', color: '#7c3aed' }} />
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#4b6b4b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {['ERC', 'Sleeper', 'Rail Pad'].map(prod => {
                          const on = selectedProducts.includes(prod);
                          return (
                            <div key={prod} onClick={() => toggleFilterOption(prod, selectedProducts, setSelectedProducts)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', transition: 'all 0.2s', background: on ? '#7c3aed' : '#faf5ff', color: on ? '#fff' : '#7c3aed', border: `1px solid ${on ? '#7c3aed' : '#e9d5ff'}`, boxShadow: on ? '0 2px 6px rgba(124,58,237,0.25)' : 'none' }}>
                              {on && <i className="fa-solid fa-check" style={{ fontSize: '9px' }} />}
                              {prod}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Vendor */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fa-solid fa-industry" style={{ fontSize: '10px', color: '#d97706' }} />
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#4b6b4b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vendor</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {INITIAL_VENDORS.map(v => {
                          const on = selectedVendors.includes(v.name);
                          return (
                            <div key={v.id} onClick={() => toggleFilterOption(v.name, selectedVendors, setSelectedVendors)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', transition: 'all 0.2s', background: on ? '#d97706' : '#fffbeb', color: on ? '#fff' : '#92400e', border: `1px solid ${on ? '#d97706' : '#fde68a'}`, boxShadow: on ? '0 2px 6px rgba(217,119,6,0.25)' : 'none' }}>
                              {on && <i className="fa-solid fa-check" style={{ fontSize: '9px' }} />}
                              {v.name}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stage */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fa-solid fa-layer-group" style={{ fontSize: '10px', color: '#ea580c' }} />
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#4b6b4b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stage</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {['RM', 'Process', 'Final'].map(stg => {
                          const on = selectedStages.includes(stg);
                          return (
                            <div key={stg} onClick={() => toggleFilterOption(stg, selectedStages, setSelectedStages)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', transition: 'all 0.2s', background: on ? '#ea580c' : '#fff7ed', color: on ? '#fff' : '#c2410c', border: `1px solid ${on ? '#ea580c' : '#fed7aa'}`, boxShadow: on ? '0 2px 6px rgba(234,88,12,0.25)' : 'none' }}>
                              {on && <i className="fa-solid fa-check" style={{ fontSize: '9px' }} />}
                              {stg}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Search + Reset Row */}
                  <div style={{ borderTop: '1px solid #f0fdf4', paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px' }} />
                      <input
                        type="text"
                        placeholder="Search by Call no., PO, Vendor, IE or CM name..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1px solid #d1fae5', background: '#f0fdf4', fontSize: '12px', color: '#1a2e1a', outline: 'none', fontFamily: 'inherit' }}
                      />
                    </div>
                    <button
                      onClick={handleResetFilters}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: '#fff', border: '1px solid #d1fae5', color: '#14532d', fontSize: '11px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      <i className="fa-solid fa-rotate-left" style={{ fontSize: '10px' }} />
                      Reset All
                    </button>
                  </div>
                </div>
              )}
            </section>


            {/* Calls Table Section */}
            <section className="cm-list-card">
              <div className="cm-list-header">
                <div className="cm-list-info">
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', margin: 0 }}>
                    Inspection Calls Details List 
                    <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#4b6b4b', marginLeft: '8px' }}>
                      ({activeCallFilter === 'all' ? 'All Calls' : `${activeCallFilter.toUpperCase().replace('_', ' ')}`})
                    </span>
                  </h3>
                  <span className="cm-list-count-badge">
                    {sortedCalls.length} of {calls.length} entries
                  </span>
                </div>
              </div>

              <div className="cm-table-wrapper">
                <table className="cm-table">
                  <thead>
                    <tr>
                      <th className="sortable" onClick={() => handleSort('callNumber')}>Call Number</th>
                      <th className="sortable" onClick={() => handleSort('product')}>Product & Stage of Inspection</th>
                      <th className="sortable" onClick={() => handleSort('poNumber')}>PO Number</th>
                      <th className="sortable" onClick={() => handleSort('dpDate')}>DP Date & Ext DP Date</th>
                      <th className="sortable" onClick={() => handleSort('materialValue')}>Material Value</th>
                      <th className="sortable" onClick={() => handleSort('vendorName')}>Vendor Name</th>
                      <th className="sortable" onClick={() => handleSort('desiredInspectionDate')}>Inspection Desired Date</th>
                      <th className="sortable" onClick={() => handleSort('callDate')}>Call Date</th>
                      <th className="sortable" onClick={() => handleSort('ieName')}>IE Name</th>
                      <th>CM Name</th>
                      <th className="sortable" onClick={() => handleSort('ritesRio')}>RITES RIO</th>
                      <th className="sortable" onClick={() => handleSort('status')}>Status</th>
                      <th>Documents</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCalls.length > 0 ? (
                      paginatedCalls.map((call) => {
                        // Concatenated status is formatted exactly as `${call.status}-${call.subStatus}` (e.g. Pending-Raised)
                        const concatenatedStatus = `${call.status}-${call.subStatus}`;
                        
                        let statusColor = '#3b82f6';
                        let statusBg = 'rgba(59, 130, 246, 0.1)';
                        if (call.status === 'Pending') {
                          statusColor = '#d97706';
                          statusBg = '#fef3c7';
                        } else if (call.status === 'Under Inspection') {
                          statusColor = '#ea580c';
                          statusBg = '#ffedd5';
                        } else if (call.status === 'IC Issuance Pending') {
                          statusColor = '#ef4444';
                          statusBg = '#fee2e2';
                        } else if (call.status === 'Completed') {
                          statusColor = '#15803d';
                          statusBg = '#dcfce7';
                        }

                        const overdueFlag = isOverdue(call);

                        return (
                          <tr key={call.id} style={{ background: overdueFlag ? '#fef2f2' : '' }}>
                            {/* Call Number */}
                            <td style={{ fontWeight: 'bold' }}>
                              {call.callNumber}
                              {overdueFlag && <span style={{ color: '#ef4444', marginLeft: '4px' }} title="Overdue Warning">⚠️</span>}
                            </td>
                            
                            {/* Product & Stage of Inspection (eg. ERC- Process, Sleeper- Final…) */}
                            <td>{`${call.product}- ${call.stage}`}</td>
                            
                            {/* PO Number - hyperlink to download PO */}
                            <td>
                              <a 
                                href="#download-po" 
                                className="cm-table-link"
                                onClick={(e) => { e.preventDefault(); handleDownloadPdf(call.callNumber, 'PO'); }}
                              >
                                {call.poNumber}
                              </a>
                            </td>
                            
                            {/* DP Date & Ext DP Date */}
                            <td>
                              <div>{call.dpDate}</div>
                              <div style={{ fontSize: '9px', color: '#4b6b4b' }}>Ext: {call.extDpDate}</div>
                            </td>
                            
                            {/* Material Value */}
                            <td style={{ fontWeight: '600' }}>{formatIndianCurrency(call.materialValue)}</td>
                            
                            {/* Vendor Name */}
                            <td>{call.vendorName}</td>
                            
                            {/* Inspection Desired Date */}
                            <td>{call.desiredInspectionDate || 'N/A'}</td>
                            
                            {/* Call Date */}
                            <td>{call.callDate}</td>
                            
                            {/* IE Name */}
                            <td>{call.ieName || 'Unassigned'}</td>
                            
                            {/* CM Name */}
                            <td>{call.cmName}</td>
                            
                            {/* RITES RIO */}
                            <td>{call.ritesRio}</td>
                            
                            {/* Concatenated Status */}
                            <td>
                              <span 
                                className="cm-status-badge" 
                                style={{ color: statusColor, background: statusBg, border: `1px solid ${statusColor}` }}
                              >
                                {concatenatedStatus}
                              </span>
                            </td>
                            
                            {/* Documents (Download single pdf sequence: IC, PO, ITP, Annexures, Calibration Reports) */}
                            <td>
                              <div className="cm-doc-download-bar">
                                <span 
                                  className={`cm-doc-link ${call.docs.ic ? '' : 'missing'}`} 
                                  title={call.docs.ic ? "Download IC Document" : "IC Document Unavailable"}
                                  onClick={() => call.docs.ic && handleDownloadPdf(call.callNumber, 'IC')}
                                >
                                  IC
                                </span>
                                <span 
                                  className={`cm-doc-link ${call.docs.po ? '' : 'missing'}`} 
                                  title={call.docs.po ? "Download PO Document" : "PO Document Unavailable"}
                                  onClick={() => call.docs.po && handleDownloadPdf(call.callNumber, 'PO')}
                                >
                                  PO
                                </span>
                                <span 
                                  className={`cm-doc-link ${call.docs.itp ? '' : 'missing'}`} 
                                  title={call.docs.itp ? "Download ITP Document" : "ITP Document Unavailable"}
                                  onClick={() => call.docs.itp && handleDownloadPdf(call.callNumber, 'ITP')}
                                >
                                  ITP
                                </span>
                                <span 
                                  className={`cm-doc-link ${call.docs.annexure ? '' : 'missing'}`} 
                                  title={call.docs.annexure ? "Download Annexures PDF" : "Annexures PDF Unavailable"}
                                  onClick={() => call.docs.annexure && handleDownloadPdf(call.callNumber, 'Annexures')}
                                >
                                  ANX
                                </span>
                                <span 
                                  className={`cm-doc-link ${call.docs.calibration ? '' : 'missing'}`} 
                                  title={call.docs.calibration ? "Download Calibration Certificate" : "Calibration Certificate Unavailable"}
                                  onClick={() => call.docs.calibration && handleDownloadPdf(call.callNumber, 'Calibration')}
                                >
                                  CAL
                                </span>
                              </div>
                            </td>
                            
                            {/* Remarks */}
                            <td style={{ minWidth: '150px', fontSize: '10.5px' }}>{call.remarks || '-'}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="14">
                          <div className="cm-empty-state">
                            <i className="cm-empty-icon fa-solid fa-folder-open"></i>
                            <h4>No matching inspection calls found</h4>
                            <p>Try clearing some filters or searching with a different term.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              <div className="cm-pagination">
                <div className="cm-pagination-info">
                  Showing <b>{paginatedCalls.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</b> to <b>{Math.min(currentPage * pageSize, sortedCalls.length)}</b> of <b>{sortedCalls.length}</b> inspection calls
                </div>
                <div className="cm-pagination-controls">
                  <span style={{ marginRight: '12px' }}>Rows per page:</span>
                  <select 
                    value={pageSize} 
                    className="cm-filter-select" 
                    style={{ width: '70px', padding: '4px 8px', border: '1px solid #d1fae5', background: '#f0fdf4', borderRadius: '6px' }}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                  <button 
                    className="cm-pagination-btn" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    ◀ Prev
                  </button>
                  <span className="cm-pagination-page">Page {currentPage} of {totalPages}</span>
                  <button 
                    className="cm-pagination-btn" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    Next ▶
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {/* 1. IE wise Call Status view */}
        {activeTab === 'IE wise Call Status' && (
          <>
            <div className="cm-panel-header">
              <div className="cm-panel-title-area">
                <h1 className="cm-panel-title">Inspection Engineers Wise Call Status</h1>
                <p className="cm-panel-subtitle">Performance breakdown and current operational assignment statuses of assigned IEs.</p>
              </div>
            </div>

            <section className="cm-list-card">
              <div className="cm-table-wrapper">
                <table className="cm-table">
                  <thead>
                    <tr>
                      <th>IE ID</th>
                      <th>IE Name</th>
                      <th>RITES RIO</th>
                      <th>Total Assigned</th>
                      <th>Pending (Raised)</th>
                      <th>Under Inspection</th>
                      <th>IC Issuance Pending</th>
                      <th>Completed</th>
                      <th>Workload Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INITIAL_IES.map((ie) => {
                      const ieCalls = calls.filter(c => c.ieName === ie.name);
                      return (
                        <tr key={ie.id}>
                          <td style={{ fontWeight: 'bold' }}>{ie.id}</td>
                          <td>{ie.name}</td>
                          <td>{ie.region}</td>
                          <td style={{ fontWeight: 'bold' }}>{ieCalls.length}</td>
                          <td>{ieCalls.filter(c => c.status === 'Pending').length}</td>
                          <td>{ieCalls.filter(c => c.status === 'Under Inspection').length}</td>
                          <td>{ieCalls.filter(c => c.status === 'IC Issuance Pending').length}</td>
                          <td>{ieCalls.filter(c => c.status === 'Completed').length}</td>
                          <td>
                            <span 
                              className="cm-status-badge" 
                              style={{ 
                                color: ie.status === 'Overloaded' ? '#ef4444' : ie.status === 'High' ? '#ea580c' : '#15803d', 
                                background: ie.status === 'Overloaded' ? '#fee2e2' : ie.status === 'High' ? '#ffedd5' : '#dcfce7',
                                border: ie.status === 'Overloaded' ? '1px solid #ef4444' : ie.status === 'High' ? '1px solid #ea580c' : '1px solid #15803d'
                              }}
                            >
                              {ie.status} ({ie.workload}%)
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* 2. IE Performance Monitoring view */}
        {activeTab === 'IE Performance Monitoring' && (
          <>
            <div className="cm-panel-header">
              <div className="cm-panel-title-area">
                <h1 className="cm-panel-title">Inspection Engineers Performance Monitoring</h1>
                <p className="cm-panel-subtitle">SLA compliance logs, average inspection delays, and workload capacity ratings.</p>
              </div>
            </div>

            <section className="cm-approval-grid">
              {INITIAL_IES.map((ie) => (
                <div key={ie.id} className="prof-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <div className="cm-perf-avatar">{ie.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#14532d' }}>{ie.name}</div>
                      <div style={{ fontSize: '11px', color: '#4b6b4b' }}>{ie.region} • ID: {ie.id}</div>
                    </div>
                  </div>

                  <div className="cm-perf-progress-container">
                    <div className="cm-perf-progress-label">
                      <span>SLA Compliance Rate</span>
                      <span>{ie.slaCompliance}%</span>
                    </div>
                    <div className="cm-perf-progress-bar-bg">
                      <div 
                        className="cm-perf-progress-bar-fg" 
                        style={{ 
                          width: `${ie.slaCompliance}%`,
                          background: ie.slaCompliance > 95 ? '#15803d' : ie.slaCompliance > 90 ? '#3b82f6' : '#f59e0b' 
                        }}
                      />
                    </div>
                  </div>

                  <div className="cm-perf-progress-container" style={{ marginTop: '12px' }}>
                    <div className="cm-perf-progress-label">
                      <span>Workload Threshold</span>
                      <span>{ie.workload}%</span>
                    </div>
                    <div className="cm-perf-progress-bar-bg">
                      <div 
                        className="cm-perf-progress-bar-fg" 
                        style={{ 
                          width: `${ie.workload}%`,
                          background: ie.workload > 90 ? '#ef4444' : ie.workload > 75 ? '#ea580c' : '#15803d' 
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px', borderTop: '1px solid #f0fdf4', paddingTop: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#4b6b4b' }}>Avg Response Time</div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#14532d' }}>{ie.avgDays} Days</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#4b6b4b' }}>Active Allocations</div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#14532d' }}>{ie.activeCalls} Calls</div>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        {/* 3. Vendor Quality Monitoring view */}
        {activeTab === 'Vendor Quality Monitoring' && (
          <>
            <div className="cm-panel-header">
              <div className="cm-panel-title-area">
                <h1 className="cm-panel-title">Vendor Quality Monitoring</h1>
                <p className="cm-panel-subtitle">Comprehensive logs of vendor ratings, testing pass/rejection metrics, and alert audits.</p>
              </div>
            </div>

            <section className="cm-list-card">
              <div className="cm-table-wrapper">
                <table className="cm-table">
                  <thead>
                    <tr>
                      <th>Vendor Name</th>
                      <th>Region Location</th>
                      <th>Inspections Done</th>
                      <th>Active Inspection Calls</th>
                      <th>Rejection Rate (%)</th>
                      <th>Process Parameter Compliance</th>
                      <th>Quality Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INITIAL_VENDORS.map((v) => (
                      <tr key={v.id}>
                        <td style={{ fontWeight: 'bold' }}>{v.name}</td>
                        <td>{v.region}</td>
                        <td>{v.inspections} tests</td>
                        <td>{v.activeCalls} calls</td>
                        <td>
                          <span 
                            className="cm-status-badge"
                            style={{
                              color: v.rejectionRate > 5 ? '#ef4444' : v.rejectionRate > 2.5 ? '#ea580c' : '#15803d',
                              background: v.rejectionRate > 5 ? '#fee2e2' : v.rejectionRate > 2.5 ? '#ffedd5' : '#dcfce7',
                              border: v.rejectionRate > 5 ? '1px solid #ef4444' : v.rejectionRate > 2.5 ? '1px solid #ea580c' : '1px solid #15803d'
                            }}
                          >
                            {v.rejectionRate}% Rejection
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '11px', color: '#4b6b4b' }}>
                              ⚡ PLC Calibration: <span style={{ color: '#15803d', fontWeight: 'bold' }}>COMPLIANT</span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#4b6b4b' }}>
                              🌡️ Tempering: <span style={{ color: '#15803d', fontWeight: 'bold' }}>OK (142°C)</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '13px' }}>
                            {'★'.repeat(Math.floor(v.rating))}
                            {v.rating % 1 !== 0 ? '½' : ''}
                            <span style={{ color: '#4b6b4b', fontSize: '11px', marginLeft: '6px' }}>({v.rating})</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* 4. Performance Charts View */}
        {activeTab === 'Charts' && (
          <>
            <div className="cm-panel-header">
              <div className="cm-panel-title-area">
                <h1 className="cm-panel-title">Inspection Analytics Charts</h1>
                <p className="cm-panel-subtitle">Visual summaries of product workloads, regional response rates, and SLA compliance metrics.</p>
              </div>
            </div>

            <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="prof-card">
                <div className="sec-title">Product-wise Active Allocations</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
                  {['ERC', 'Sleeper', 'Rail Pad'].map(prod => {
                    const count = calls.filter(c => c.product === prod).length;
                    const pct = Math.round((count / calls.length) * 100);
                    return (
                      <div key={prod} className="cm-perf-progress-container">
                        <div className="cm-perf-progress-label">
                          <span style={{ fontWeight: 'bold', color: '#14532d' }}>{prod} Inspections</span>
                          <span>{count} Calls ({pct}%)</span>
                        </div>
                        <div className="cm-perf-progress-bar-bg" style={{ height: '14px' }}>
                          <div 
                            className="cm-perf-progress-bar-fg" 
                            style={{ 
                              width: `${pct}%`,
                              background: prod === 'ERC' ? '#1e3a8a' : prod === 'Sleeper' ? '#15803d' : '#4338ca'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="prof-card">
                <div className="sec-title">Status Breakdown Overview</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-around', padding: '16px 0' }}>
                  {[
                    { label: 'Pending', count: kpiStats.pending, color: '#f59e0b' },
                    { label: 'Under Insp.', count: kpiStats.underInspection, color: '#ea580c' },
                    { label: 'IC Pending', count: kpiStats.icPending, color: '#ef4444' },
                    { label: 'Completed', count: kpiStats.completed, color: '#15803d' }
                  ].map(stat => (
                    <div key={stat.label} style={{ textAlign: 'center', minWidth: '80px' }}>
                      <div style={{ fontSize: '32px', fontWeight: '900', color: stat.color }}>{stat.count}</div>
                      <div style={{ fontSize: '11px', color: '#4b6b4b', fontWeight: '700', marginTop: '4px', textTransform: 'uppercase' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* 5. SQC Analysis view */}
        {activeTab === 'SQC Analysis' && (
          <>
            <div className="cm-panel-header">
              <div className="cm-panel-title-area">
                <h1 className="cm-panel-title">Statistical Quality Control (SQC) Analysis</h1>
                <p className="cm-panel-subtitle">Real-time control boundaries, process variance limits, and automated warning logs.</p>
              </div>
            </div>

            <section className="cm-filters-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 'bold', color: '#14532d', margin: 0 }}>📈 Statistical Control Bounds Check</h3>
                <span className="cm-status-badge" style={{ color: '#15803d', background: '#dcfce7', border: '1px solid #15803d' }}>
                  PROCESS IN CONTROL
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#4b6b4b' }}>
                System scanning critical product tests (Concrete Sleeper hardness, GRSP Pad dimensional thickness bounds) against Upper Control Limit (UCL) and Lower Control Limit (LCL) of 3-Sigma parameters.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '12px' }}>
                <div style={{ border: '1px solid #d1fae5', borderRadius: '8px', padding: '16px', background: '#f0fdf4' }}>
                  <div style={{ fontSize: '11px', color: '#4b6b4b', fontWeight: '700' }}>SLEEPER CASTING HARDNESS</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#14532d', margin: '6px 0' }}>56.4 HRB</div>
                  <div style={{ fontSize: '11px', color: '#4b6b4b' }}>Bound Limits: <b>UCL: 60.0</b> | <b>LCL: 52.0</b></div>
                </div>

                <div style={{ border: '1px solid #d1fae5', borderRadius: '8px', padding: '16px', background: '#f0fdf4' }}>
                  <div style={{ fontSize: '11px', color: '#4b6b4b', fontWeight: '700' }}>GRSP PAD THICKNESS VARIANCE</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#14532d', margin: '6px 0' }}>6.04 mm</div>
                  <div style={{ fontSize: '11px', color: '#4b6b4b' }}>Bound Limits: <b>UCL: 6.20</b> | <b>LCL: 5.80</b></div>
                </div>

                <div style={{ border: '1px solid #d1fae5', borderRadius: '8px', padding: '16px', background: '#f0fdf4' }}>
                  <div style={{ fontSize: '11px', color: '#4b6b4b', fontWeight: '700' }}>ERC SPRING SHAPE COMPRESSION</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#14532d', margin: '6px 0' }}>14.2 kN</div>
                  <div style={{ fontSize: '11px', color: '#4b6b4b' }}>Bound Limits: <b>UCL: 15.0</b> | <b>LCL: 13.5</b></div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* 6. SCADA Monitoring view */}
        {activeTab === 'SCADA Monitoring' && (
          <>
            <div className="cm-panel-header">
              <div className="cm-panel-title-area">
                <h1 className="cm-panel-title">SCADA Live Automation Feed</h1>
                <p className="cm-panel-subtitle">Real-time automation telemetry logs directly mirrored from plant PLC manufacturing systems.</p>
              </div>
            </div>

            <section className="scada-grid">
              <div className="scada-plant-card">
                <div className="scada-plant-header">
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#14532d' }}>Line 1 - Concrete Sleeper Plant</div>
                  <div className="scada-status-indicator">
                    <span className="scada-pulse" />
                    <span>ONLINE</span>
                  </div>
                </div>
                <div className="cm-filters-grid" style={{ border: 'none', paddingTop: 0 }}>
                  <div className="scada-metric-card">
                    <span className="scada-metric-label">Hydraulic Compression</span>
                    <span className="scada-metric-value">420 kN</span>
                  </div>
                  <div className="scada-metric-card">
                    <span className="scada-metric-label">Curing Temperature</span>
                    <span className="scada-metric-value">142 °C</span>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#4b6b4b' }}>
                  📡 Modbus PLC Node ID: <b>0x10A</b> | Last Ping: <b>Just Now</b>
                </div>
              </div>

              <div className="scada-plant-card">
                <div className="scada-plant-header">
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#14532d' }}>Line 2 - ERC Forging Plant</div>
                  <div className="scada-status-indicator">
                    <span className="scada-pulse" />
                    <span>ONLINE</span>
                  </div>
                </div>
                <div className="cm-filters-grid" style={{ border: 'none', paddingTop: 0 }}>
                  <div className="scada-metric-card">
                    <span className="scada-metric-label">Quenching Oil Tank Temp</span>
                    <span className="scada-metric-value">58 °C</span>
                  </div>
                  <div className="scada-metric-card">
                    <span className="scada-metric-label">Stamping Pressure</span>
                    <span className="scada-metric-value">85 Bar</span>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#4b6b4b' }}>
                  📡 Modbus PLC Node ID: <b>0x10B</b> | Last Ping: <b>Just Now</b>
                </div>
              </div>
            </section>
          </>
        )}

        {/* 7. PO Lifecycle view */}
        {activeTab === 'PO Lifecycle' && (
          <>
            <div className="cm-panel-header">
              <div className="cm-panel-title-area">
                <h1 className="cm-panel-title">Purchase Order Lifecycle Tracking</h1>
                <p className="cm-panel-subtitle">Comprehensive stepper tracking of PO stages, milestones, and dispatch cycles.</p>
              </div>
            </div>

            <section className="cm-filters-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontWeight: 'bold', color: '#14532d', margin: 0 }}>📋 Track PO Lifecycle: PO-2026-ERC-9921</h3>
                <span className="cm-status-badge" style={{ color: '#d97706', background: '#fef3c7', border: '1px solid #d97706' }}>
                  STAGE 4: UNDER INSPECTION
                </span>
              </div>

              <div className="po-timeline">
                <div className="po-timeline-node">
                  <div className="po-timeline-bullet completed" />
                  <div className="po-timeline-content">
                    <div>
                      <div className="po-timeline-title">Stage 1: Purchase Order Issued</div>
                      <div style={{ fontSize: '11px', color: '#4b6b4b' }}>Contract reference: <b>CR-93428947-001</b></div>
                    </div>
                    <span className="po-timeline-date">2026-04-15</span>
                  </div>
                </div>

                <div className="po-timeline-node">
                  <div className="po-timeline-bullet completed" />
                  <div className="po-timeline-content">
                    <div>
                      <div className="po-timeline-title">Stage 2: Inspection Call Raised by Vendor</div>
                      <div style={{ fontSize: '11px', color: '#4b6b4b' }}>Call generated reference: <b>CALL-2026-101</b></div>
                    </div>
                    <span className="po-timeline-date">2026-05-18</span>
                  </div>
                </div>

                <div className="po-timeline-node">
                  <div className="po-timeline-bullet completed" />
                  <div className="po-timeline-content">
                    <div>
                      <div className="po-timeline-title">Stage 3: Inspection Engineer Assigned by CM</div>
                      <div style={{ fontSize: '11px', color: '#4b6b4b' }}>Assigned to: <b>Rajesh Kumar</b></div>
                    </div>
                    <span className="po-timeline-date">2026-05-19</span>
                  </div>
                </div>

                <div className="po-timeline-node">
                  <div className="po-timeline-bullet active" />
                  <div className="po-timeline-content" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div>
                      <div className="po-timeline-title">Stage 4: Under Inspection Check</div>
                      <div style={{ fontSize: '11px', color: '#4b6b4b' }}>Ongoing laboratory compression & visual check tests.</div>
                    </div>
                    <span className="po-timeline-date">In Progress</span>
                  </div>
                </div>

                <div className="po-timeline-node">
                  <div className="po-timeline-bullet" />
                  <div className="po-timeline-content" style={{ opacity: 0.5 }}>
                    <div>
                      <div className="po-timeline-title">Stage 5: Certificate Issued & Payment Dispatched</div>
                      <div style={{ fontSize: '11px', color: '#4b6b4b' }}>Final billing dispatch.</div>
                    </div>
                    <span className="po-timeline-date">-</span>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* 8. All Reports view */}
        {activeTab === 'All Reports' && (
          <>
            <div className="cm-panel-header">
              <div className="cm-panel-title-area">
                <h1 className="cm-panel-title">
                  {activeReportTab}
                </h1>
                <p className="cm-panel-subtitle">
                  Synchronized live Controlling Manager reports and parameters mirrored to the Railway Board.
                </p>
              </div>
              <button 
                className="btn btn--primary"
                onClick={() => triggerNotification(`Force sync data for ${activeReportTab} initiated!`, 'success')}
              >
                ⚡ Force Sync Sync Log
              </button>
            </div>

            {/* Render 1. Monthly Progress Report */}
            {activeReportTab === 'Monthly Progress Report' && (
              <section className="cm-list-card">
                <div className="cm-list-header">
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', margin: 0 }}>
                    Monthly Progress & Completion Audit Log (2026)
                  </h3>
                </div>
                <div className="cm-table-wrapper">
                  <table className="cm-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>RITES RIO Region</th>
                        <th>Total Calls Initiated</th>
                        <th>Inspections Completed</th>
                        <th>Overdue Actions Pending</th>
                        <th>SLA Compliance Target</th>
                        <th>Sync Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>May 2026 (Mtd)</td>
                        <td>RIO North</td>
                        <td>38 Calls</td>
                        <td>31 Completed</td>
                        <td><span style={{ color: '#ef4444', fontWeight: 'bold' }}>2 Overdue</span></td>
                        <td style={{ fontWeight: 'bold', color: '#15803d' }}>97.4% Met</td>
                        <td><span className="cm-status-badge" style={{ color: '#15803d', background: '#dcfce7', border: '1px solid #15803d' }}>SYNCED</span></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>April 2026</td>
                        <td>RIO North</td>
                        <td>45 Calls</td>
                        <td>44 Completed</td>
                        <td><span style={{ color: '#15803d' }}>0 Pending</span></td>
                        <td style={{ fontWeight: 'bold', color: '#15803d' }}>98.2% Met</td>
                        <td><span className="cm-status-badge" style={{ color: '#15803d', background: '#dcfce7', border: '1px solid #15803d' }}>SYNCED</span></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>March 2026</td>
                        <td>RIO North</td>
                        <td>41 Calls</td>
                        <td>40 Completed</td>
                        <td><span style={{ color: '#15803d' }}>0 Pending</span></td>
                        <td style={{ fontWeight: 'bold', color: '#15803d' }}>96.8% Met</td>
                        <td><span className="cm-status-badge" style={{ color: '#15803d', background: '#dcfce7', border: '1px solid #15803d' }}>SYNCED</span></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>February 2026</td>
                        <td>RIO North</td>
                        <td>35 Calls</td>
                        <td>35 Completed</td>
                        <td><span style={{ color: '#15803d' }}>0 Pending</span></td>
                        <td style={{ fontWeight: 'bold', color: '#15803d' }}>100% Met</td>
                        <td><span className="cm-status-badge" style={{ color: '#15803d', background: '#dcfce7', border: '1px solid #15803d' }}>SYNCED</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Render 2. Monthly Analysis of Units */}
            {activeReportTab === 'Monthly Analysis of Units' && (
              <section className="cm-list-card">
                <div className="cm-list-header">
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', margin: 0 }}>
                    Product Units Inspected, Passed & Defect Log
                  </h3>
                </div>
                <div className="cm-table-wrapper">
                  <table className="cm-table">
                    <thead>
                      <tr>
                        <th>Product Type</th>
                        <th>Inspected Volume (MT / Pcs)</th>
                        <th>Approved & Stamped</th>
                        <th>Rejected / Withheld</th>
                        <th>Defect Ratio (%)</th>
                        <th>Key Defect Observations</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>Elastic Rail Clip (ERC)</td>
                        <td>54,200 Pcs</td>
                        <td>52,890 Pcs</td>
                        <td><span style={{ color: '#ef4444', fontWeight: 'bold' }}>1,310 Pcs</span></td>
                        <td style={{ fontWeight: 'bold', color: '#ea580c' }}>2.41%</td>
                        <td>Slight spring diameter variation in raw material stock.</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>Concrete Sleeper</td>
                        <td>12,450 Units</td>
                        <td>12,060 Units</td>
                        <td><span style={{ color: '#ef4444', fontWeight: 'bold' }}>390 Units</span></td>
                        <td style={{ fontWeight: 'bold', color: '#ea580c' }}>3.13%</td>
                        <td>Crater defects on casting base plates during thermal cycle.</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>Grooved Rubber Sole Pad (GRSP)</td>
                        <td>88,500 Pcs</td>
                        <td>87,440 Pcs</td>
                        <td><span style={{ color: '#ef4444', fontWeight: 'bold' }}>1,060 Pcs</span></td>
                        <td style={{ fontWeight: 'bold', color: '#15803d' }}>1.20%</td>
                        <td>Lab test indentation deviations outside limits.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Render 3. Lot Wise Closed Loop */}
            {activeReportTab === 'Lot Wise Closed Loop' && (
              <section className="cm-list-card">
                <div className="cm-list-header">
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', margin: 0 }}>
                    Lot Inspection Actions & NCR Closed Loop Status
                  </h3>
                </div>
                <div className="cm-table-wrapper">
                  <table className="cm-table">
                    <thead>
                      <tr>
                        <th>Lot Code</th>
                        <th>Vendor Name</th>
                        <th>NCR Raised Date</th>
                        <th>Inspection Discrepancy Found</th>
                        <th>Clearance Date</th>
                        <th>Closed Loop Resolution Type</th>
                        <th>Sync to RB</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>LOT-2026-ERC-902</td>
                        <td>Global Materials Corp</td>
                        <td>2026-05-12</td>
                        <td>Hardness test parameters slightly below grade.</td>
                        <td>2026-05-20</td>
                        <td><span style={{ color: '#15803d', fontWeight: 'bold' }}>Cleared after Re-tempering</span></td>
                        <td><span className="cm-status-badge" style={{ color: '#15803d', background: '#dcfce7', border: '1px solid #15803d' }}>SYNCED</span></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>LOT-2026-SLP-441</td>
                        <td>Premium Materials Inc</td>
                        <td>2026-05-04</td>
                        <td>Cores not fitting calibration templates.</td>
                        <td>2026-05-14</td>
                        <td><span style={{ color: '#15803d', fontWeight: 'bold' }}>Closed via dimensional recheck</span></td>
                        <td><span className="cm-status-badge" style={{ color: '#15803d', background: '#dcfce7', border: '1px solid #15803d' }}>SYNCED</span></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>LOT-2026-PAD-082</td>
                        <td>Steel Industries Ltd</td>
                        <td>2026-05-18</td>
                        <td>Severe curing compression variances.</td>
                        <td><span style={{ color: '#ef4444', fontWeight: 'bold' }}>Ongoing NCR</span></td>
                        <td><span style={{ color: '#ea580c', fontWeight: 'bold' }}>Awaiting lab validation reports</span></td>
                        <td><span className="cm-status-badge" style={{ color: '#ea580c', background: '#ffedd5', border: '1px solid #ea580c' }}>PENDING</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Render 4. Shift Wise Production Report */}
            {activeReportTab === 'Shift Wise Production Report' && (
              <section className="cm-list-card">
                <div className="cm-list-header">
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', margin: 0 }}>
                    Shift Wise Production Operations & Telemetry Metrics
                  </h3>
                </div>
                <div className="cm-table-wrapper">
                  <table className="cm-table">
                    <thead>
                      <tr>
                        <th>Shift Name</th>
                        <th>Manufacturing Line / Node</th>
                        <th>Operating Efficiency (%)</th>
                        <th>Total Inspected Output</th>
                        <th>Quality Stamping Pass Rate</th>
                        <th>PLC Telemetry Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>Shift A (06:00 - 14:00)</td>
                        <td>Line 1 - Concrete Sleeper Plant</td>
                        <td>94.8%</td>
                        <td>4,200 Pcs</td>
                        <td style={{ fontWeight: 'bold', color: '#15803d' }}>98.5%</td>
                        <td><span className="cm-status-badge" style={{ color: '#15803d', background: '#dcfce7', border: '1px solid #15803d' }}>ONLINE</span></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>Shift B (14:00 - 22:00)</td>
                        <td>Line 1 - Concrete Sleeper Plant</td>
                        <td>91.2%</td>
                        <td>3,850 Pcs</td>
                        <td style={{ fontWeight: 'bold', color: '#15803d' }}>97.8%</td>
                        <td><span className="cm-status-badge" style={{ color: '#15803d', background: '#dcfce7', border: '1px solid #15803d' }}>ONLINE</span></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>Shift C (22:00 - 06:00)</td>
                        <td>Line 2 - ERC Forging Plant</td>
                        <td>88.6%</td>
                        <td>3,100 Pcs</td>
                        <td style={{ fontWeight: 'bold', color: '#ea580c' }}>94.2%</td>
                        <td><span className="cm-status-badge" style={{ color: '#15803d', background: '#dcfce7', border: '1px solid #15803d' }}>ONLINE</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Render 5. Vendor wise Monthly Report */}
            {activeReportTab === 'Vendor wise Monthly Report' && (
              <section className="cm-list-card">
                <div className="cm-list-header">
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', margin: 0 }}>
                    Vendor wise Performance Ratings & Rejection Analysis
                  </h3>
                </div>
                <div className="cm-table-wrapper">
                  <table className="cm-table">
                    <thead>
                      <tr>
                        <th>Vendor Name</th>
                        <th>Lots Inspected</th>
                        <th>Completed Deliveries</th>
                        <th>Average Inspection Lead Time</th>
                        <th>Monthly Rejection Rate</th>
                        <th>Quality Rating Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>Global Materials Corp</td>
                        <td>18 Lots</td>
                        <td>16 Lots</td>
                        <td>2.1 Days</td>
                        <td style={{ fontWeight: 'bold', color: '#15803d' }}>2.4%</td>
                        <td style={{ fontWeight: 'bold', color: '#15803d' }}>Grade A+ (★★★★★)</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>Premium Materials Inc</td>
                        <td>12 Lots</td>
                        <td>11 Lots</td>
                        <td>1.8 Days</td>
                        <td style={{ fontWeight: 'bold', color: '#ea580c' }}>3.1%</td>
                        <td style={{ fontWeight: 'bold', color: '#15803d' }}>Grade A (★★★★☆)</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>Steel Industries Ltd</td>
                        <td>22 Lots</td>
                        <td>19 Lots</td>
                        <td>3.2 Days</td>
                        <td style={{ fontWeight: 'bold', color: '#ef4444' }}>7.8%</td>
                        <td style={{ fontWeight: 'bold', color: '#ea580c' }}>Grade B (★★★☆☆)</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>Quality Forge Pvt Ltd</td>
                        <td>8 Lots</td>
                        <td>8 Lots</td>
                        <td>1.2 Days</td>
                        <td style={{ fontWeight: 'bold', color: '#15803d' }}>1.2%</td>
                        <td style={{ fontWeight: 'bold', color: '#15803d' }}>Grade A+ (★★★★★)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Render 6. PO Wise Monthly Report */}
            {activeReportTab === 'PO Wise Monthly Report' && (
              <section className="cm-list-card">
                <div className="cm-list-header">
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', margin: 0 }}>
                    Active Purchase Order Progress & Value Milestones
                  </h3>
                </div>
                <div className="cm-table-wrapper">
                  <table className="cm-table">
                    <thead>
                      <tr>
                        <th>PO Reference</th>
                        <th>Material Specification</th>
                        <th>Total PO Volume</th>
                        <th>Inspected Volume</th>
                        <th>Remaining Balance</th>
                        <th>Material Value Synced</th>
                        <th>Milestone Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>CR-93428947-001</td>
                        <td>Elastic Rail Clip (ERC)</td>
                        <td>150,000 Pcs</td>
                        <td>122,000 Pcs</td>
                        <td>28,000 Pcs</td>
                        <td style={{ fontWeight: 'bold' }}>{formatIndianCurrency(1850000)}</td>
                        <td><span className="cm-status-badge" style={{ color: '#15803d', background: '#dcfce7', border: '1px solid #15803d' }}>81.3% COMPLETE</span></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>CR-93428947-002</td>
                        <td>Concrete Sleeper</td>
                        <td>25,000 Units</td>
                        <td>18,200 Units</td>
                        <td>6,800 Units</td>
                        <td style={{ fontWeight: 'bold' }}>{formatIndianCurrency(3420000)}</td>
                        <td><span className="cm-status-badge" style={{ color: '#15803d', background: '#dcfce7', border: '1px solid #15803d' }}>72.8% COMPLETE</span></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>CR-93428947-003</td>
                        <td>Grooved Rubber Sole Pad</td>
                        <td>200,000 Pcs</td>
                        <td>192,000 Pcs</td>
                        <td>8,000 Pcs</td>
                        <td style={{ fontWeight: 'bold' }}>{formatIndianCurrency(920000)}</td>
                        <td><span className="cm-status-badge" style={{ color: '#15803d', background: '#dcfce7', border: '1px solid #15803d' }}>96.0% COMPLETE</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}

        {/* 9. Reports Download view */}
        {activeTab === 'Reports' && (
          <>
            <div className="cm-panel-header">
              <div className="cm-panel-title-area">
                <h1 className="cm-panel-title">Reports & Downloads Console</h1>
                <p className="cm-panel-subtitle">Generate, compile, and download audit logs, call files, and mandays calculations.</p>
              </div>
            </div>

            <section className="cm-filters-card">
              <h3 style={{ fontWeight: 'bold', color: '#14532d', margin: 0 }}>Download Consolidated Files</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '12px' }}>
                <div style={{ border: '1px solid #d1fae5', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f0fdf4' }}>
                  <div>
                    <h4 style={{ fontWeight: 'bold', color: '#14532d', margin: 0 }}>Active Calls Logs</h4>
                    <span style={{ fontSize: '11px', color: '#4b6b4b' }}>Consolidated Excel log of all live assignments.</span>
                  </div>
                  <button className="btn btn--primary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleDownloadPdf('ALL_CALLS', 'XLS')}>⬇️ Download XLS</button>
                </div>

                <div style={{ border: '1px solid #d1fae5', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f0fdf4' }}>
                  <div>
                    <h4 style={{ fontWeight: 'bold', color: '#14532d', margin: 0 }}>IE Billing Summary</h4>
                    <span style={{ fontSize: '11px', color: '#4b6b4b' }}>Travel, mandays, and base rate logs.</span>
                  </div>
                  <button className="btn btn--primary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleDownloadPdf('IE_BILLING', 'PDF')}>⬇️ Download PDF</button>
                </div>

                <div style={{ border: '1px solid #d1fae5', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f0fdf4' }}>
                  <div>
                    <h4 style={{ fontWeight: 'bold', color: '#14532d', margin: 0 }}>Vendor Quality Audits</h4>
                    <span style={{ fontSize: '11px', color: '#4b6b4b' }}>Rejection rates and PLC process logs.</span>
                  </div>
                  <button className="btn btn--primary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleDownloadPdf('VENDOR_AUDIT', 'XLS')}>⬇️ Download XLS</button>
                </div>
              </div>
            </section>
          </>
        )}

        {/* 10. Mandays Calculation view */}
        {activeTab === 'Mandays Calculation' && (
          <>
            <div className="cm-panel-header">
              <div className="cm-panel-title-area">
                <h1 className="cm-panel-title">Mandays Calculation Calculator</h1>
                <p className="cm-panel-subtitle">Dynamic calculation of IE workdays, travel logs, base billing rates, and costs.</p>
              </div>
            </div>

            <section className="cm-list-card">
              <div className="cm-table-wrapper">
                <table className="cm-table">
                  <thead>
                    <tr>
                      <th>IE Name</th>
                      <th>RITES RIO</th>
                      <th>Days Spent (Base)</th>
                      <th>Travel Days</th>
                      <th>Total Mandays</th>
                      <th>Base Rate (/Day)</th>
                      <th>Consolidated Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INITIAL_IES.map((ie) => (
                      <tr key={ie.id}>
                        <td style={{ fontWeight: 'bold' }}>{ie.name}</td>
                        <td>{ie.region}</td>
                        <td>
                          <input 
                            type="number" 
                            defaultValue="18" 
                            style={{ width: '80px', padding: '4px 8px', border: '1px solid #d1fae5', background: '#f0fdf4', borderRadius: '6px' }}
                            onChange={() => triggerNotification('Recomputing dynamic mandays rates...', 'info')}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            defaultValue="4" 
                            style={{ width: '80px', padding: '4px 8px', border: '1px solid #d1fae5', background: '#f0fdf4', borderRadius: '6px' }}
                            onChange={() => triggerNotification('Recomputing travel logistics charges...', 'info')}
                          />
                        </td>
                        <td style={{ fontWeight: 'bold' }}>22 Mandays</td>
                        <td>{formatIndianCurrency(2500)}</td>
                        <td style={{ fontWeight: 'bold', color: '#15803d' }}>
                          {formatIndianCurrency(22 * 2500)}
                        </td>
                        <td>
                          <button 
                            className="btn btn--outline"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => triggerNotification(`Mandays billing dispatched for ${ie.name}!`, 'success')}
                          >
                            📁 Dispatch
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* 11. Verification / Notification & Approval view */}
        {activeTab === 'Notification & Approval' && (
          <>
            <div className="cm-panel-header">
              <div className="cm-panel-title-area">
                <h1 className="cm-panel-title">Controlling Manager Approvals Desk</h1>
                <p className="cm-panel-subtitle">Escalate, review, validate, approve, or reject special inspection engineering triggers.</p>
              </div>
            </div>

            <section className="cm-approval-grid">
              {approvals.map((req) => {
                let priorityColor = '#3b82f6';
                if (req.priority === 'Critical') priorityColor = '#b91c1c';
                else if (req.priority === 'High') priorityColor = '#ef4444';
                else if (req.priority === 'Medium') priorityColor = '#f59e0b';

                return (
                  <div key={req.id} className="cm-approval-card" style={{ borderTop: `4px solid ${priorityColor}` }}>
                    <div className="cm-approval-card-header">
                      <div>
                        <div className="cm-approval-type">{req.type}</div>
                        <div style={{ fontSize: '11px', color: '#4b6b4b', marginTop: '2px' }}>
                          ID: <b>{req.id}</b> | Call Ref: <b>{req.callNumber}</b>
                        </div>
                      </div>
                      <span className="cm-approval-priority" style={{ background: priorityColor }}>
                        {req.priority}
                      </span>
                    </div>

                    <p style={{ fontSize: '12.5px', margin: '0', color: '#4b6b4b', lineHeight: '1.4' }}>
                      {req.details}
                    </p>

                    <div className="cm-approval-details">
                      <div className="cm-approval-row">
                        <span className="cm-approval-label">Requesting IE:</span>
                        <span className="cm-approval-value">{req.ie}</span>
                      </div>
                      <div className="cm-approval-row">
                        <span className="cm-approval-label">Vendor Name:</span>
                        <span className="cm-approval-value">{req.vendor}</span>
                      </div>
                      <div className="cm-approval-row">
                        <span className="cm-approval-label">Product Specs:</span>
                        <span className="cm-approval-value">{req.product}</span>
                      </div>
                      <div className="cm-approval-row">
                        <span className="cm-approval-label">Requested On:</span>
                        <span className="cm-approval-value">{req.requestedDate}</span>
                      </div>
                      <div className="cm-approval-row">
                        <span className="cm-approval-label">Status:</span>
                        <span 
                          className="cm-approval-value"
                          style={{ 
                            textTransform: 'uppercase', 
                            fontWeight: 'bold', 
                            color: req.status === 'pending' ? '#f59e0b' : req.status === 'approved' ? '#15803d' : req.status === 'rejected' ? '#ef4444' : '#3b82f6'
                          }}
                        >
                          {req.status}
                        </span>
                      </div>
                      {req.remarks && (
                        <div style={{ marginTop: '8px', padding: '6px 10px', background: '#f0fdf4', border: '1px solid #d1fae5', borderRadius: '6px', fontSize: '11px' }}>
                          <b>Audit Trail Remark:</b> {req.remarks}
                        </div>
                      )}
                    </div>

                    {req.status === 'pending' && (
                      <div className="cm-approval-actions">
                        <button className="cm-approval-btn approve" onClick={() => openApprovalModal(req, 'approve')}>✓ Approve</button>
                        <button className="cm-approval-btn reject" onClick={() => openApprovalModal(req, 'reject')}>✗ Reject</button>
                        <button className="cm-approval-btn forward" onClick={() => openApprovalModal(req, 'forward')}>➡️ Escalate</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          </>
        )}

      </main>

      {/* Approvals Action Remarks Dialog Modal */}
      {modalOpen && activeApproval && (
        <div className="cm-modal-overlay">
          <div className="cm-modal">
            <div className="cm-modal-title">
              {modalAction === 'approve' ? 'Approve Request' : modalAction === 'reject' ? 'Reject Request' : 'Escalate Request'}
            </div>
            
            <div className="cm-modal-content">
              <div style={{ fontSize: '12.5px', color: '#4b6b4b' }}>
                You are performing an audit action on request <b>{activeApproval.id}</b> ({activeApproval.type}) submitted by IE <b>{activeApproval.ie}</b>.
              </div>

              <div className="cm-filter-group" style={{ marginTop: '8px' }}>
                <label className="cm-filter-label">Audit Remarks / Justifications (Mandatory)</label>
                <textarea 
                  placeholder="Enter remarks for audit trail and tracking logs..." 
                  className="cm-modal-textarea"
                  value={remarksInput}
                  onChange={(e) => setRemarksInput(e.target.value)}
                />
              </div>
            </div>

            <div className="cm-modal-actions">
              <button 
                className="btn btn--outline" 
                style={{ padding: '6px 12px', fontSize: '11px' }}
                onClick={() => { setModalOpen(false); setActiveApproval(null); }}
              >
                Cancel
              </button>
              <button 
                className={`btn btn--sm ${modalAction === 'approve' ? 'btn-success' : modalAction === 'reject' ? 'btn-danger' : 'btn-warning'}`}
                onClick={submitApprovalAction}
              >
                {modalAction === 'approve' ? 'Confirm Approval' : modalAction === 'reject' ? 'Confirm Rejection' : 'Confirm Escalation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CMDashboardPage;
