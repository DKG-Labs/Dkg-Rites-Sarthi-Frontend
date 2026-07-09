import React, { useState, useMemo, useEffect, useCallback } from 'react';
import './CMDashboard.css';
import '../RailwayBoardDashboardProfessional.css';
import useReportData from '../../hooks/useReportData';
import reportService from '../../services/reportService';
import ProfessionalCardSection from '../../components/railway-board/ProfessionalCardSection';
import { Level1Row } from '../../components/railway-board/LevelRows';
import Pagination from '../../components/Pagination';
import { formatDate } from '../../utils/helpers';

const REPORT_NAME_TO_SLUG = {
  'PO Wise Monthly Progress Report': 'mpr',
  'Monthly Progress Report': 'mpr',
  'Monthly Analysis of Units': 'mau',
  'Lot Wise Closed Loop': 'lwcl',
  'Shift Wise Production Report': 'swp',
  'Vendor Wise Process Quality Report': 'mpia',
  'PO Wise Quality Report': 'pwmr',
  'Quality of Rubber Pad Report': 'qrp'
};

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

// eslint-disable-next-line no-unused-vars
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
    docs: { ic: false, po: true, itp: true, annexure: true, calibration: true },
    inspectionStartDate: '',
    inspectionCompletionDate: ''
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
    docs: { ic: false, po: true, itp: true, annexure: false, calibration: true },
    inspectionStartDate: '',
    inspectionCompletionDate: ''
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
    docs: { ic: false, po: true, itp: true, annexure: true, calibration: false },
    inspectionStartDate: '2026-05-22',
    inspectionCompletionDate: ''
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
    docs: { ic: false, po: true, itp: true, annexure: true, calibration: true },
    inspectionStartDate: '2026-05-14',
    inspectionCompletionDate: '2026-05-18'
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
    docs: { ic: true, po: true, itp: true, annexure: true, calibration: true },
    inspectionStartDate: '2026-04-30',
    inspectionCompletionDate: '2026-05-04'
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
    docs: { ic: false, po: true, itp: false, annexure: true, calibration: false },
    inspectionStartDate: '',
    inspectionCompletionDate: ''
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
    docs: { ic: false, po: true, itp: true, annexure: true, calibration: true },
    inspectionStartDate: '',
    inspectionCompletionDate: ''
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
    docs: { ic: false, po: true, itp: true, annexure: false, calibration: true },
    inspectionStartDate: '2026-05-18',
    inspectionCompletionDate: ''
  },
  {
    id: 'CALL-2026-109',
    callNumber: 'CALL-2026-109',
    product: 'ERC',
    stage: 'Final',
    poNumber: 'CR-93428947-009',
    dpDate: '2026-04-10',
    extDpDate: '2026-04-18',
    materialValue: 1250000,
    vendorName: 'Global Materials Corp',
    desiredInspectionDate: '2026-04-12',
    callDate: '2026-04-25',
    ieName: 'Rajesh Kumar',
    cmName: 'S. K. Verma',
    ritesRio: 'RIO North',
    status: 'Completed',
    subStatus: 'IC Issued',
    remarks: 'IC issued successfully after delay resolution.',
    docs: { ic: true, po: true, itp: true, annexure: true, calibration: true },
    inspectionStartDate: '2026-04-26',
    inspectionCompletionDate: '2026-04-28'
  },
  {
    id: 'CALL-2026-110',
    callNumber: 'CALL-2026-110',
    product: 'Sleeper',
    stage: 'Final',
    poNumber: 'CR-93428947-010',
    dpDate: '2026-04-20',
    extDpDate: '2026-04-28',
    materialValue: 2420000,
    vendorName: 'Premium Materials Inc',
    desiredInspectionDate: '2026-04-22',
    callDate: '2026-04-24',
    ieName: 'Rajesh Kumar',
    cmName: 'S. K. Verma',
    ritesRio: 'RIO North',
    status: 'Completed',
    subStatus: 'Accepted',
    remarks: 'Visual checks ok. Accepted.',
    docs: { ic: true, po: true, itp: true, annexure: true, calibration: true },
    inspectionStartDate: '2026-04-24',
    inspectionCompletionDate: '2026-04-25'
  },
  {
    id: 'CALL-2026-111',
    callNumber: 'CALL-2026-111',
    product: 'Rail Pad',
    stage: 'Final',
    poNumber: 'CR-93428947-011',
    dpDate: '2026-04-15',
    extDpDate: '2026-04-22',
    materialValue: 940000,
    vendorName: 'Steel Industries Ltd',
    desiredInspectionDate: '2026-04-16',
    callDate: '2026-04-18',
    ieName: 'Priya Sharma',
    cmName: 'S. K. Verma',
    ritesRio: 'RIO North',
    status: 'Completed',
    subStatus: 'Rejected',
    remarks: 'Dimensions failed standard criteria. Rejected.',
    docs: { ic: false, po: true, itp: true, annexure: true, calibration: true },
    inspectionStartDate: '2026-04-18',
    inspectionCompletionDate: '2026-04-20'
  },
  {
    id: 'CALL-2026-112',
    callNumber: 'CALL-2026-112',
    product: 'ERC',
    stage: 'RM',
    poNumber: 'CR-93428947-012',
    dpDate: '2026-04-05',
    extDpDate: '2026-04-12',
    materialValue: 1450000,
    vendorName: 'Quality Forge Pvt Ltd',
    desiredInspectionDate: '2026-04-06',
    callDate: '2026-04-20',
    ieName: 'Priya Sharma',
    cmName: 'S. K. Verma',
    ritesRio: 'RIO North',
    status: 'Completed',
    subStatus: 'Withheld',
    remarks: 'Hardness deviations detected. Withheld for lab verification.',
    docs: { ic: false, po: true, itp: true, annexure: true, calibration: true },
    inspectionStartDate: '2026-04-20',
    inspectionCompletionDate: '2026-04-22'
  },
  {
    id: 'CALL-2026-113',
    callNumber: 'CALL-2026-113',
    product: 'Sleeper',
    stage: 'Process',
    poNumber: 'CR-93428947-013',
    dpDate: '2026-04-02',
    extDpDate: '2026-04-12',
    materialValue: 3100000,
    vendorName: 'Precision Engineering Co',
    desiredInspectionDate: '2026-04-04',
    callDate: '2026-04-06',
    ieName: 'Amit Patel',
    cmName: 'A. K. Gupta',
    ritesRio: 'RIO East',
    status: 'Completed',
    subStatus: 'Partially Accepted',
    remarks: 'Line 2 passed, Line 3 rejected.',
    docs: { ic: true, po: true, itp: true, annexure: true, calibration: true },
    inspectionStartDate: '2026-04-06',
    inspectionCompletionDate: '2026-04-08'
  },
  {
    id: 'CALL-2026-114',
    callNumber: 'CALL-2026-114',
    product: 'Rail Pad',
    stage: 'Process',
    poNumber: 'CR-93428947-014',
    dpDate: '2026-03-25',
    extDpDate: '2026-04-02',
    materialValue: 840000,
    vendorName: 'Global Materials Corp',
    desiredInspectionDate: '2026-03-26',
    callDate: '2026-04-10',
    ieName: 'Amit Patel',
    cmName: 'A. K. Gupta',
    ritesRio: 'RIO East',
    status: 'Completed',
    subStatus: 'Cancelled',
    remarks: 'Vendor raw material failed. Call cancelled.',
    docs: { ic: false, po: true, itp: false, annexure: true, calibration: false },
    inspectionStartDate: '2026-04-10',
    inspectionCompletionDate: '2026-04-12'
  },
  {
    id: 'CALL-2026-115',
    callNumber: 'CALL-2026-115',
    product: 'ERC',
    stage: 'Final',
    poNumber: 'CR-93428947-015',
    dpDate: '2026-03-10',
    extDpDate: '2026-03-20',
    materialValue: 1650000,
    vendorName: 'Premium Materials Inc',
    desiredInspectionDate: '2026-03-12',
    callDate: '2026-03-14',
    ieName: 'Sneha Reddy',
    cmName: 'V. S. Rao',
    ritesRio: 'RIO South',
    status: 'Completed',
    subStatus: 'Accepted',
    remarks: 'Inspection successfully completed.',
    docs: { ic: true, po: true, itp: true, annexure: true, calibration: true },
    inspectionStartDate: '2026-03-14',
    inspectionCompletionDate: '2026-03-16'
  },
  {
    id: 'CALL-2026-116',
    callNumber: 'CALL-2026-116',
    product: 'Sleeper',
    stage: 'RM',
    poNumber: 'CR-93428947-016',
    dpDate: '2026-03-20',
    extDpDate: '2026-03-28',
    materialValue: 4300000,
    vendorName: 'Steel Industries Ltd',
    desiredInspectionDate: '2026-03-22',
    callDate: '2026-04-05',
    ieName: 'Sneha Reddy',
    cmName: 'V. S. Rao',
    ritesRio: 'RIO South',
    status: 'Completed',
    subStatus: 'IC Issued',
    remarks: 'IC issued after delayed clearances.',
    docs: { ic: true, po: true, itp: true, annexure: true, calibration: true },
    inspectionStartDate: '2026-04-05',
    inspectionCompletionDate: '2026-04-07'
  },
  {
    id: 'CALL-2026-117',
    callNumber: 'CALL-2026-117',
    product: 'Rail Pad',
    stage: 'Final',
    poNumber: 'CR-93428947-017',
    dpDate: '2026-03-15',
    extDpDate: '2026-03-22',
    materialValue: 880000,
    vendorName: 'Quality Forge Pvt Ltd',
    desiredInspectionDate: '2026-03-16',
    callDate: '2026-03-18',
    ieName: 'Vikram Singh',
    cmName: 'M. K. Deshmukh',
    ritesRio: 'RIO West',
    status: 'Completed',
    subStatus: 'Cancelled',
    remarks: 'Vendor plant breakdown. Call cancelled.',
    docs: { ic: false, po: true, itp: true, annexure: true, calibration: true },
    inspectionStartDate: '2026-03-18',
    inspectionCompletionDate: '2026-03-20'
  },
  {
    id: 'CALL-2026-118',
    callNumber: 'CALL-2026-118',
    product: 'Sleeper',
    stage: 'Final',
    poNumber: 'CR-93428947-018',
    dpDate: '2026-03-05',
    extDpDate: '2026-03-12',
    materialValue: 2700000,
    vendorName: 'Precision Engineering Co',
    desiredInspectionDate: '2026-03-06',
    callDate: '2026-03-20',
    ieName: 'Vikram Singh',
    cmName: 'M. K. Deshmukh',
    ritesRio: 'RIO West',
    status: 'Completed',
    subStatus: 'Partially Accepted',
    remarks: 'Partial material clearance.',
    docs: { ic: true, po: true, itp: true, annexure: true, calibration: true },
    inspectionStartDate: '2026-03-20',
    inspectionCompletionDate: '2026-03-22'
  }
];

const INITIAL_APPROVALS = [
  { id: 'APR-001', callNumber: 'CALL-2026-102', type: 'Quantity Enhancement', ie: 'Priya Sharma', vendor: 'Premium Materials Inc', product: 'Sleeper (Final)', requestedDate: '2026-05-22', status: 'pending', priority: 'High', details: 'Request to increase sleeper casting inspection volume by 120 units due to production run consolidation.' },
  { id: 'APR-002', callNumber: 'CALL-2026-101', type: 'Rescheduling', ie: 'Rajesh Kumar', vendor: 'Global Materials Corp', product: 'ERC (Process)', requestedDate: '2026-05-25', status: 'pending', priority: 'Medium', details: 'Delay in process testing equipment calibration. Requesting shift from May 24 to May 30.' },
  { id: 'APR-003', callNumber: 'CALL-2026-103', type: 'Discrepancy Approval', ie: 'Amit Patel', vendor: 'Steel Industries Ltd', product: 'Rail Pad (Final)', requestedDate: '2026-05-26', status: 'pending', priority: 'Low', details: 'Slight chemical makeup variation in GRSP batch. Within tolerance bounds but requires CM sign-off.' },
  { id: 'APR-004', callNumber: 'CALL-2026-106', type: 'Withholding Request', ie: 'Rajesh Kumar', vendor: 'Global Materials Corp', product: 'Rail Pad (Process)', requestedDate: '2026-05-26', status: 'pending', priority: 'Critical', details: 'Repeated failing dimensions in thickness test. Inspector requests formal withholding of batch.' }
];

const getSidebarReportsByProduct = (product) => {
  if (product === 'Sleeper') {
    return [
      'Monthly Progress Report',
      'Monthly Analysis of Units',
      'Lot Wise Closed Loop',
      'Shift Wise Production Report'
    ];
  } else if (product === 'Rail Pad') {
    return [
      'Monthly Progress Report',
      'Monthly Analysis of Units',
      'Lot Wise Closed Loop',
      'Shift Wise Production Report',
      'Quality of Rubber Pad Report'
    ];
  } else {
    return [
      'PO Wise Monthly Progress Report',
      'Monthly Analysis of Units',
      'Lot Wise Closed Loop',
      'Shift Wise Production Report',
      'Vendor Wise Process Quality Report',
      'PO Wise Quality Report'
    ];
  }
};

const MANDAY_VENDORS = [
  { id: 'V001', name: 'Global Materials Corp' },
  { id: 'V002', name: 'Premium Materials Inc' },
  { id: 'V003', name: 'Steel Industries Ltd' },
  { id: 'V004', name: 'Quality Forge Pvt Ltd' },
  { id: 'V005', name: 'Precision Engineering Co' }
];

const MANDAY_UNITS = {
  'Global Materials Corp': ['Unit-I (Delhi)', 'Unit-II (Jaipur)', 'Plant-3 (Gujarat)'],
  'Premium Materials Inc': ['Plant-A (Noida)', 'Plant-B (Mohali)'],
  'Steel Industries Ltd': ['Main Works (Jamshedpur)', 'Rolling Mill (Kharagpur)'],
  'Quality Forge Pvt Ltd': ['Forge Shop (Chennai)', 'Machining Div (Hosur)'],
  'Precision Engineering Co': ['Unit-1 (Pune)', 'Unit-2 (Aurangabad)']
};

export const CMDashboardPage = ({ isEmbedded = false, activeTabFromProps = null, activeCallFilterFromProps = null, activeReportTabFromProps = null }) => {
  // Navigation tabs state matching SRS options exactly
  const [activeTab, setActiveTab] = useState('Dashboard');
  
  useEffect(() => {
    if (isEmbedded && activeTabFromProps) {
      setActiveTab(activeTabFromProps);
    }
  }, [isEmbedded, activeTabFromProps]);

  const [activeCallFilter, setActiveCallFilter] = useState(null); // Clicked KPI filter: all, pending, under_inspection, ic_pending, completed, overdue
  const [callMenuOpen, setCallMenuOpen] = useState(false); // Call Monitoring submenu toggle
  const [ieMenuOpen, setIeMenuOpen] = useState(false); // IE Monitoring submenu toggle
  const [vendorMenuOpen, setVendorMenuOpen] = useState(false); // Vendor Quality Monitoring submenu toggle
  const [reportsMenuOpen, setReportsMenuOpen] = useState(false); // Reports submenu toggle
  const [activeReportTab, setActiveReportTab] = useState('PO Wise Monthly Progress Report'); // Active sub-report
  const [callPopupData, setCallPopupData] = useState(null); // Drill-down popup data for calls: { ieName, type, calls }

  useEffect(() => {
    if (isEmbedded && activeCallFilterFromProps) {
      setActiveCallFilter(activeCallFilterFromProps);
    }
  }, [isEmbedded, activeCallFilterFromProps]);

  useEffect(() => {
    if (isEmbedded && activeReportTabFromProps) {
      setActiveReportTab(activeReportTabFromProps);
    }
  }, [isEmbedded, activeReportTabFromProps]);

  // --- Process Inspection Manday Calculation States ---
  const [mandayProduct, setMandayProduct] = useState(''); // 'ERC', 'Sleeper', 'Rail Pad'
  const [mandayPreference, setMandayPreference] = useState(''); // 'Vendor Wise', 'Call Wise'
  const [mandayVendor, setMandayVendor] = useState('');
  const [mandayUnit, setMandayUnit] = useState('');
  const [mandayStartDate, setMandayStartDate] = useState('');
  const [mandayEndDate, setMandayEndDate] = useState('');
  const [mandayCallNumber, setMandayCallNumber] = useState('');
  const [showMandayReport, setShowMandayReport] = useState(false);

  // States for interactive Sleeper Call-Wise calculations
  const [sleeperCastApril, setSleeperCastApril] = useState(12000);
  const [sleeperDaysApril, setSleeperDaysApril] = useState(80);
  const [sleeperCastMay, setSleeperCastMay] = useState(15000);
  const [sleeperDaysMay, setSleeperDaysMay] = useState(100);

  // States for interactive IE Billing Sheet calculations (reserved for future Billing Sheet feature)
  // eslint-disable-next-line no-unused-vars
  const [ieBillingData, setIeBillingData] = useState({
    'IE001': { base: 18, travel: 4, rate: 2500 },
    'IE002': { base: 15, travel: 3, rate: 2500 },
    'IE003': { base: 20, travel: 5, rate: 2500 },
    'IE004': { base: 12, travel: 2, rate: 2500 },
    'IE005': { base: 16, travel: 4, rate: 2500 }
  });

  // eslint-disable-next-line no-unused-vars
  const handleIeBillingChange = (ieId, field, value) => {
    setIeBillingData(prev => ({
      ...prev,
      [ieId]: {
        ...prev[ieId],
        [field]: Number(value)
      }
    }));
  };

  // --- Railway Board Reports Integration States & Hooks ---
  const [selectedReportProduct, setSelectedReportProduct] = useState('ERC');
  const [selectedReportZone, setSelectedReportZone] = useState('all');
  const [selectedReportRio, setSelectedReportRio] = useState('all');

  const handleProductChange = (newProduct) => {
    setSelectedReportProduct(newProduct);
    if (newProduct === 'ERC') {
      if (activeReportTab === 'Monthly Progress Report' || activeReportTab === 'Quality of Rubber Pad Report') {
        setActiveReportTab('PO Wise Monthly Progress Report');
      }
    } else if (newProduct === 'Sleeper') {
      if (
        activeReportTab === 'PO Wise Monthly Progress Report' ||
        activeReportTab === 'Vendor Wise Process Quality Report' ||
        activeReportTab === 'PO Wise Quality Report' ||
        activeReportTab === 'Quality of Rubber Pad Report'
      ) {
        setActiveReportTab('Monthly Progress Report');
      }
    } else if (newProduct === 'Rail Pad') {
      if (
        activeReportTab === 'PO Wise Monthly Progress Report' ||
        activeReportTab === 'Vendor Wise Process Quality Report' ||
        activeReportTab === 'PO Wise Quality Report'
      ) {
        setActiveReportTab('Monthly Progress Report');
      }
    }
  };

  // Quality Charts States & Data Fetching
  const [selectedChartsProduct, setSelectedChartsProduct] = useState('ERC');
  // SQC & SCADA States
  const [selectedSqcProduct, setSelectedSqcProduct] = useState('ERC');
  const [selectedScadaProduct, setSelectedScadaProduct] = useState('ERC');
  const [chartsFromDate, setChartsFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [chartsToDate, setChartsToDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const chartsFilters = useMemo(() => ({
    startDate: chartsFromDate,
    endDate: chartsToDate,
    product: selectedChartsProduct,
    rio: undefined,
    zone: undefined,
    vendor: undefined
  }), [chartsFromDate, chartsToDate, selectedChartsProduct]);

  const chartsTrendParams = useMemo(() => ({
    startDate: chartsFromDate,
    endDate: chartsToDate,
    product: selectedChartsProduct
  }), [chartsFromDate, chartsToDate, selectedChartsProduct]);

  // Fetch live Quality datasets
  const { data: qQualityRejectionData } = useReportData(reportService.getQualityRejection, activeTab === 'Charts' ? chartsFilters : undefined);
  const { data: qManufacturerRejectionData } = useReportData(reportService.getManufacturerRejection, activeTab === 'Charts' ? chartsFilters : undefined);
  const { data: qStepWiseRejectionData } = useReportData(reportService.getManufacturingStepWiseRejection, activeTab === 'Charts' ? chartsFilters : undefined);
  const { data: qProcessPerformanceData } = useReportData(reportService.getProcessPerformance, activeTab === 'Charts' ? chartsFilters : undefined);
  const { data: qParetoAnalysisData } = useReportData(reportService.getParetoAnalysis, activeTab === 'Charts' ? chartsFilters : undefined);
  const { data: qMonthlyRejectionTrendData } = useReportData(reportService.getMonthlyRejectionTrend, activeTab === 'Charts' ? chartsTrendParams : undefined);
  const { data: qInspectionDetailsData } = useReportData(reportService.getInspectionDetails, activeTab === 'Charts' ? chartsTrendParams : undefined);

  // PO Lifecycle States & Data Fetching
  const [selectedLifecycleProduct, setSelectedLifecycleProduct] = useState('ERC');
  const [expandedPo, setExpandedPo] = useState(null);
  const [expandedSerial, setExpandedSerial] = useState(null);
  const [expandedCall, setExpandedCall] = useState(null);

  const [poSearch, setPoSearch] = useState('');
  const [poSort, setPoSort] = useState({ key: 'poNo', direction: 'asc' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const lcFromDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }, []);

  const lcToDate = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  const lifecycleFilters = useMemo(() => ({
    startDate: lcFromDate,
    endDate: lcToDate,
    product: selectedLifecycleProduct,
    rio: undefined,
    zone: undefined,
    vendor: undefined
  }), [lcFromDate, lcToDate, selectedLifecycleProduct]);

  // Fetch Level 1 data for PO Lifecycle
  const { data: reportData = [] } = useReportData(
    reportService.getLevel1Report,
    activeTab === 'PO Lifecycle' ? lifecycleFilters : undefined
  );

  // Fetch IE Wise Call Status Data
  const cmEmpId = localStorage.getItem('employeeCode') || localStorage.getItem('loginId') || localStorage.getItem('userId') || '10431';

  // Accordion row togglers
  const togglePo = useCallback((poNo) => {
    if (expandedPo === poNo) {
      setExpandedPo(null);
      setExpandedSerial(null);
      setExpandedCall(null);
    } else {
      setExpandedPo(poNo);
      setExpandedSerial(null);
    }
  }, [expandedPo]);

  const toggleSerial = useCallback((poNo, serialId) => {
    const compositeId = `${poNo}_${serialId}`;
    if (expandedSerial === compositeId) {
      setExpandedSerial(null);
      setExpandedCall(null);
    } else {
      setExpandedSerial(compositeId);
      setExpandedCall(null);
    }
  }, [expandedSerial]);

  const toggleCall = useCallback((callId) => {
    if (expandedCall === callId) {
      setExpandedCall(null);
    } else {
      setExpandedCall(callId);
    }
  }, [expandedCall]);

  const handleChangePage = useCallback((newPage) => setPage(newPage), []);
  const handleChangeRowsPerPage = useCallback((newRows) => setRowsPerPage(newRows), []);

  // Reset page to 0 when search changes
  useEffect(() => {
    setPage(0);
  }, [poSearch]);

  // Filtered & Sorted PO Data (Client-side)
  const displayPoData = useMemo(() => {
    let result = [...(reportData || [])];

    // Filter by Item Category Description based on selected product
    result = getFilteredRecordsByProduct(result, selectedLifecycleProduct);

    // Search filter
    if (poSearch) {
      const query = poSearch.toLowerCase();
      result = result.filter(po =>
        (po.rly || '').toLowerCase().includes(query) ||
        (po.poNo || '').toLowerCase().includes(query) ||
        (po.vendor || '').toLowerCase().includes(query) ||
        (po.region || '').toLowerCase().includes(query)
      );
    }

    // Sorting
    if (poSort.key) {
      result.sort((a, b) => {
        let aVal = a[poSort.key];
        let bVal = b[poSort.key];

        // Handle numbers
        const numA = parseFloat(aVal);
        const numB = parseFloat(bVal);
        if (!isNaN(numA) && !isNaN(numB)) {
          return poSort.direction === 'asc' ? numA - numB : numB - numA;
        }

        // Handle strings
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
        if (aVal < bVal) return poSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return poSort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [reportData, poSearch, poSort, selectedLifecycleProduct]);

  const count = displayPoData.length;
  const paginatedData = displayPoData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const handlePoSort = useCallback((key) => {
    setPoSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const renderSortIcon = useCallback((key) => {
    if (poSort.key !== key) return <span style={{ opacity: 0.3, marginLeft: '5px', fontSize: '11px' }}>↕</span>;
    return <span style={{ marginLeft: '5px', color: '#10b981', fontSize: '11px' }}>{poSort.direction === 'asc' ? '▲' : '▼'}</span>;
  }, [poSort]);

  // poTable construct memoized
  const poTable = useMemo(() => (
    <div className="content-card-integrated">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
        <div className="prof-search-wrapper" style={{ position: 'relative', width: '300px' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}></i>
          <input
            type="text"
            placeholder="Search POs, Vendors..."
            className="prof-search"
            style={{ width: '100%', paddingLeft: '35px' }}
            value={poSearch}
            onChange={(e) => setPoSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="table-responsive">
        <table className="prof-table main-table level-1-table">
          <thead>
            <tr className="sortable-header">
              <th style={{ width: '40px' }}></th>
              <th onClick={() => handlePoSort('rly')} style={{ cursor: 'pointer' }}>Rly {renderSortIcon('rly')}</th>
              <th onClick={() => handlePoSort('poNo')} style={{ cursor: 'pointer' }}>PO No. {renderSortIcon('poNo')}</th>
              <th onClick={() => handlePoSort('poDate')} style={{ cursor: 'pointer' }}>PO Date {renderSortIcon('poDate')}</th>
              <th onClick={() => handlePoSort('vendor')} style={{ cursor: 'pointer' }}>Vendor {renderSortIcon('vendor')}</th>
              <th onClick={() => handlePoSort('region')} style={{ cursor: 'pointer' }}>Region {renderSortIcon('region')}</th>
              <th className="text-right" onClick={() => handlePoSort('poQuantityNos')} style={{ cursor: 'pointer' }}>PO Qty {renderSortIcon('poQuantityNos')}</th>
              <th className="text-right" onClick={() => handlePoSort('acceptedQty')} style={{ cursor: 'pointer' }}>Acc Qty {renderSortIcon('acceptedQty')}</th>
              <th className="text-right" onClick={() => handlePoSort('balanceQty')} style={{ cursor: 'pointer' }}>Bal Qty {renderSortIcon('balanceQty')}</th>
              <th className="text-right" onClick={() => handlePoSort('rawMaterialRejectionPercentage')} style={{ cursor: 'pointer' }}>RM % {renderSortIcon('rawMaterialRejectionPercentage')}</th>
              <th className="text-right" onClick={() => handlePoSort('processInspectionRejectionPercentage')} style={{ cursor: 'pointer' }}>Proc % {renderSortIcon('processInspectionRejectionPercentage')}</th>
              <th className="text-right" onClick={() => handlePoSort('finalInspectionRejectionPercentage')} style={{ cursor: 'pointer' }}>Final % {renderSortIcon('finalInspectionRejectionPercentage')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((po, index) => (
              <Level1Row
                key={po.poNo || po.id}
                po={po}
                index={(page * rowsPerPage) + index}
                expandedPo={expandedPo} togglePo={togglePo}
                expandedSerial={expandedSerial} toggleSerial={toggleSerial}
                expandedCall={expandedCall} toggleCall={toggleCall}
              />
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={page} totalPages={Math.ceil(count / rowsPerPage)}
        start={page * rowsPerPage} end={Math.min((page + 1) * rowsPerPage, count)}
        totalCount={count} onPageChange={handleChangePage}
        rows={rowsPerPage} onRowsChange={handleChangeRowsPerPage}
      />
    </div>
  ), [paginatedData, page, rowsPerPage, count, expandedPo, expandedSerial, expandedCall, poSearch, renderSortIcon, togglePo, toggleSerial, toggleCall, handlePoSort, handleChangePage, handleChangeRowsPerPage]);

  const [reportFromDate, setReportFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [reportToDate, setReportToDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const reportDashboardFilters = useMemo(() => ({
    startDate: reportFromDate, endDate: reportToDate, product: selectedReportProduct,
    rio: selectedReportRio !== 'all' ? selectedReportRio : undefined,
    zone: selectedReportZone !== 'all' ? selectedReportZone : undefined
  }), [reportFromDate, reportToDate, selectedReportProduct, selectedReportRio, selectedReportZone]);

  const [mprPage, setMprPage] = useState(0);
  const [mprRowsPerPage, setMprRowsPerPage] = useState(10);
  const mprParams = useMemo(() => ({
    page: 0, size: 10000, ...reportDashboardFilters
  }), [reportDashboardFilters]);

  const { data: mprData, pagination: mprPagination, loading: mprLoading } = useReportData(
    selectedReportProduct === 'Sleeper' ? reportService.getSleeperMonthlyProgressReport : reportService.getMonthlyProgressReport,
    activeTab === 'All Reports' && REPORT_NAME_TO_SLUG[activeReportTab] === 'mpr' ? mprParams : undefined
  );

  const [mauPage, setMauPage] = useState(0);
  const [mauRowsPerPage, setMauRowsPerPage] = useState(10);
  const mauParams = useMemo(() => ({
    page: 0, size: 10000, ...reportDashboardFilters
  }), [reportDashboardFilters]);

  const { data: mauData, pagination: mauPagination, loading: mauLoading } = useReportData(
    selectedReportProduct === 'Sleeper'
      ? reportService.getSleeperMonthlyAnalysis
      : selectedReportProduct === 'Rail Pad'
        ? reportService.getRailPadMonthlyAnalysisOfUnits
        : reportService.getMonthlyAnalysisOfUnits,
    activeTab === 'All Reports' && REPORT_NAME_TO_SLUG[activeReportTab] === 'mau' ? mauParams : undefined
  );

  const [mpiaPage, setMpiaPage] = useState(0);
  const [mpiaRowsPerPage, setMpiaRowsPerPage] = useState(10);
  const mpiaParams = useMemo(() => ({
    page: 0, size: 10000, ...reportDashboardFilters
  }), [reportDashboardFilters]);

  const { data: mpiaData, pagination: mpiaPagination, loading: mpiaLoading } = useReportData(
    reportService.getManufactureProcessAnalysis, activeTab === 'All Reports' && REPORT_NAME_TO_SLUG[activeReportTab] === 'mpia' ? mpiaParams : undefined
  );

  const [lwclCallNo, setLwclCallNo] = useState('');
  const [lwclLotNo, setLwclLotNo] = useState('');
  const [lwclRequestIds, setLwclRequestIds] = useState([]);
  const [lwclLotNumbers, setLwclLotNumbers] = useState([]);
  const [lwclManufacturer, setLwclManufacturer] = useState('');
  const [lwclManufacturersList, setLwclManufacturersList] = useState([]);
  const [lwclPoNo, setLwclPoNo] = useState('');
  const [lwclPoNumbersList, setLwclPoNumbersList] = useState([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await reportService.getAllCompanies();
        const data = response.responseData || response;
        if (data && Array.isArray(data)) setLwclManufacturersList(data);
      } catch (error) { console.error("Error fetching companies:", error); }
    };
    if (activeTab === 'All Reports') fetchCompanies();
  }, [activeTab]);

  useEffect(() => {
    const fetchPoNumbers = async () => {
      if (!lwclManufacturer) {
        setLwclPoNumbersList([]);
        setLwclPoNo('');
        return;
      }
      try {
        const response = await reportService.getPoNumbersByManufacturer(lwclManufacturer);
        const data = response.responseData || response;
        if (data && Array.isArray(data)) setLwclPoNumbersList(data);
      } catch (error) { console.error("Error fetching PO numbers:", error); }
    };
    fetchPoNumbers();
  }, [lwclManufacturer]);

  useEffect(() => {
    const fetchCallNumbers = async () => {
      if (!lwclPoNo || !lwclManufacturer) {
        setLwclRequestIds([]);
        setLwclCallNo('');
        return;
      }
      try {
        const response = await reportService.getCallNumbersByPoAndManufacturer(lwclPoNo, lwclManufacturer);
        const data = response.responseData || response;
        if (data && Array.isArray(data)) {
          const filteredData = data.filter(id => id && typeof id === 'string' && id.startsWith('EP-'));
          setLwclRequestIds(filteredData);
        }
      } catch (error) { console.error("Error fetching call numbers:", error); }
    };
    fetchCallNumbers();
  }, [lwclPoNo, lwclManufacturer]);

  useEffect(() => {
    const fetchLots = async () => {
      if (!lwclCallNo) { setLwclLotNumbers([]); setLwclLotNo(''); return; }
      try {
        const response = await reportService.getLotNumbers(lwclCallNo);
        const data = response.responseData || response;
        if (data && Array.isArray(data)) setLwclLotNumbers(data);
      } catch (error) { console.error("Error fetching lot numbers:", error); }
    };
    fetchLots();
  }, [lwclCallNo]);

  const lwclParams = useMemo(() => ({ callNo: lwclCallNo, lotNo: lwclLotNo }), [lwclCallNo, lwclLotNo]);
  const fetchLwclData = useCallback(async (params) => {
    if (!params || !params.callNo || !params.lotNo) return { responseStatus: { statusCode: 0 }, responseData: [] };
    return reportService.getLotClosedLoop(params);
  }, []);
  const { data: lwclData, loading: lwclLoading } = useReportData(fetchLwclData, activeTab === 'All Reports' && REPORT_NAME_TO_SLUG[activeReportTab] === 'lwcl' ? lwclParams : undefined);

  const [level4Data, setLevel4Data] = useState([]);
  const [level4Loading, setLevel4Loading] = useState(false);

  useEffect(() => {
    const fetchLevel4Report = async () => {
      if (!lwclCallNo) { setLevel4Data([]); return; }
      try {
        setLevel4Loading(true);
        const response = await reportService.getLevel4Report(lwclCallNo);
        const data = response.responseData || response;
        if (data && Array.isArray(data)) setLevel4Data(data); else setLevel4Data([]);
      } catch (error) { console.error("Error fetching 4th Level Report:", error); setLevel4Data([]); } finally { setLevel4Loading(false); }
    };
    if (activeTab === 'All Reports' && REPORT_NAME_TO_SLUG[activeReportTab] === 'lwcl') fetchLevel4Report();
  }, [lwclCallNo, activeTab, activeReportTab]);

  // Reset pages when filters change
  useEffect(() => {
    setMprPage(0);
    setMauPage(0);
    setMpiaPage(0);
  }, [reportDashboardFilters]);
  // --- End of Railway Board Reports States & Hooks ---

  // Collapsible sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Data states
  const [calls, setCalls] = useState([]);
  const [overdueCalls, setOverdueCalls] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [callsLoading, setCallsLoading] = useState(false);
  const [approvals, setApprovals] = useState(INITIAL_APPROVALS);
  const [notification, setNotification] = useState(null);

  const handleOpenCallDetailsModal = (ieName, type, callsList) => {
    setCallPopupData({
      ieName,
      type,
      calls: callsList
    });
  };

  // Global Filters states
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedIEs, setSelectedIEs] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState(['ERC', 'Sleeper', 'Rail Pad']);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [selectedStages, setSelectedStages] = useState([]);
  const [selectedCMs, setSelectedCMs] = useState([]);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  // Fetch IE Wise Call Status Data (requires selectedProducts to be initialized)
  const { data: ieWiseCallStatusData = [] } = useReportData(
    reportService.getCmIeWiseCallStatus,
    activeTab === 'IE wise Call Status' && selectedProducts.includes('ERC') ? cmEmpId : undefined
  );

  const { data: sleeperIeWiseCallStatusData = [] } = useReportData(
    reportService.getCmSleeperIeWiseCallStatus,
    activeTab === 'IE wise Call Status' && selectedProducts.includes('Sleeper') ? cmEmpId : undefined
  );

  // Fetch IE Performance Monitoring Data (requires selectedProducts to be initialized)
  const { data: cmCompletedCallsAnalysisData = [] } = useReportData(
    reportService.getCmCompletedCallsAnalysis,
    activeTab === 'IE Performance Monitoring' && selectedProducts.includes('ERC') ? cmEmpId : undefined
  );

  const { data: sleeperCompletedCallsAnalysisData = [] } = useReportData(
    reportService.getCmSleeperCompletedCallsAnalysis,
    activeTab === 'IE Performance Monitoring' && selectedProducts.includes('Sleeper') ? cmEmpId : undefined
  );

  useEffect(() => {
    const fetchCalls = async () => {
      setCallsLoading(true);
      try {
        let data = [];
        const fetchErc = true;
        const fetchSleeper = true;

        if (fetchErc) {
          try {
            const resErc = await reportService.getCmInspectionCalls({ startDate, endDate });
            if (resErc.responseData) data = [...data, ...resErc.responseData];
          } catch (err) { console.error("Error fetching ERC calls", err); }
        }

        if (fetchSleeper) {
          try {
            const resSleeper = await reportService.getCmSleeperInspectionCalls({ startDate, endDate });
            if (resSleeper.responseData) data = [...data, ...resSleeper.responseData];
          } catch (err) { console.error("Error fetching Sleeper calls", err); }
        }

        const formatNameWithId = (rawName) => {
          if (!rawName) return '';
          const parts = String(rawName).split('-');
          if (parts.length === 2) {
            const p1 = parts[0].trim();
            const p2 = parts[1].trim();
            if (/^\d+$/.test(p1)) {
              return `${p1} - ${p2}`;
            } else if (/^\d+$/.test(p2)) {
              return `${p2} - ${p1}`;
            }
          }
          return String(rawName).trim();
        };

        const mappedCalls = data.map((item, index) => {
          // Use the raw status coming directly from the API
          let mappedStatus = item.status || 'Pending';
          let mappedSubStatus = '';

          let prodType = 'ERC';
          if (item.callNumber?.startsWith('ER') || item.callNumber?.startsWith('EP') || item.callNumber?.startsWith('EF')) prodType = 'ERC';
          else if (item.callNumber?.startsWith('SR') || item.callNumber?.startsWith('SP') || item.callNumber?.startsWith('SF')) prodType = 'Sleeper';
          else if (item.callNumber?.startsWith('RR') || item.callNumber?.startsWith('RP') || item.callNumber?.startsWith('RF')) prodType = 'Rail Pad';

          return {
            id: item.callNumber + '-' + index,
            callNumber: item.callNumber,
            product: prodType,
            stage: item.productAndStageOfInspection || 'Process',
            poNumber: item.poNumber,
            dpDate: item.deliveryDate || '',
            extDpDate: item.expectedDeliveryDate || '',
            vendorName: item.vendorName,
            desiredInspectionDate: item.inspectionDesiredDate,
            callDate: item.callDate,
            ieName: item.ieName ? item.ieName.split(',').map(ie => formatNameWithId(ie.trim())).join(', ') : '',
            cmName: formatNameWithId(item.cmName),
            ritesRio: item.ritesRio,
            status: mappedStatus,
            subStatus: mappedSubStatus,
            docs: { ic: false, po: !!item.poNumber, itp: false, annexure: false, calibration: false },
            inspectionStartDate: '',
            inspectionCompletionDate: ''
          };
        });

        setCalls(mappedCalls);

        // Fetch overdue calls dynamically based on selected products
        let overdueDataRaw = [];
        if (fetchErc) {
          try {
            const overdueResponseErc = await reportService.getCmErcOverdueCalls({ startDate, endDate });
            if (overdueResponseErc.responseData) overdueDataRaw = [...overdueDataRaw, ...overdueResponseErc.responseData];
          } catch (err) { console.error("Error fetching ERC overdue calls", err); }
        }

        if (fetchSleeper) {
          try {
            const overdueResponseSleeper = await reportService.getCmSleeperOverdueCalls({ startDate, endDate });
            if (overdueResponseSleeper.responseData) overdueDataRaw = [...overdueDataRaw, ...overdueResponseSleeper.responseData];
          } catch (err) { console.error("Error fetching Sleeper overdue calls", err); }
        }

        const mappedOverdue = overdueDataRaw.map((item, index) => {
          let prodType = 'ERC';
          if (item.callNumber?.startsWith('ER') || item.callNumber?.startsWith('EP') || item.callNumber?.startsWith('EF')) prodType = 'ERC';
          else if (item.callNumber?.startsWith('SR') || item.callNumber?.startsWith('SP') || item.callNumber?.startsWith('SF')) prodType = 'Sleeper';
          else if (item.callNumber?.startsWith('RR') || item.callNumber?.startsWith('RP') || item.callNumber?.startsWith('RF')) prodType = 'Rail Pad';
          return {
            id: 'overdue-' + item.callNumber + '-' + index,
            callNumber: item.callNumber,
            product: prodType,
            stage: item.productAndStageOfInspection || 'Process',
            poNumber: item.poNumber,
            dpDate: item.deliveryDate || '',
            extDpDate: item.expectedDeliveryDate || '',
            vendorName: item.vendorName,
            desiredInspectionDate: item.inspectionDesiredDate,
            callDate: item.callDate,
            ieName: item.ieName ? item.ieName.split(',').map(ie => formatNameWithId(ie.trim())).join(', ') : '',
            cmName: formatNameWithId(item.cmName),
            ritesRio: item.ritesRio,
            status: item.status || 'Pending',
            subStatus: '',
            docs: { ic: false, po: !!item.poNumber, itp: false, annexure: false, calibration: false },
          };
        });
        setOverdueCalls(mappedOverdue);

      } catch (error) {
        console.error("Error fetching CM inspection calls:", error);
      } finally {
        setCallsLoading(false);
      }
    };

    fetchCalls();
  }, [startDate, endDate]);

  // Expand/collapse global filters panel
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [ieSearchQuery, setIeSearchQuery] = useState('');
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');

  const dynamicFilterOptions = useMemo(() => {
    const allCalls = [...calls, ...overdueCalls];
    const regions = new Set();
    const ies = new Set();
    const vendors = new Set();
    const stages = new Set();
    const cms = new Set();

    // Ensure the logged-in CM is always an option in the dropdown, even if they have 0 calls
    const loggedInEmpCode = localStorage.getItem('employeeCode');
    const loggedInUserName = localStorage.getItem('userName');
    const roleName = localStorage.getItem('roleName') || '';
    
    // Only add the logged-in user if they are an actual CM (not an Admin)
    if (!roleName.includes('Admin')) {
      if (loggedInEmpCode && loggedInUserName) {
        cms.add(`${loggedInEmpCode} - ${loggedInUserName.toUpperCase()}`);
      } else if (loggedInEmpCode) {
        cms.add(`${loggedInEmpCode}`);
      }
    }

    allCalls.forEach(call => {
      if (call.ritesRio) regions.add(call.ritesRio);
      if (call.ieName) {
        call.ieName.split(',').forEach(ie => ies.add(ie.trim()));
      }
      if (call.vendorName) vendors.add(call.vendorName);
      if (call.stage) stages.add(call.stage);
      if (call.cmName) cms.add(call.cmName);
    });

    return {
      regions: Array.from(regions).sort(),
      ies: Array.from(ies).sort(),
      vendors: Array.from(vendors).sort(),
      stages: Array.from(stages).sort(),
      cms: Array.from(cms).sort()
    };
  }, [calls, overdueCalls]);

  // Pre-select all dropdown options by default when calls data is loaded
  useEffect(() => {
    if (calls.length > 0 && !hasAutoSelected) {
      setSelectedRegions(dynamicFilterOptions.regions);
      setSelectedIEs(dynamicFilterOptions.ies);
      setSelectedVendors(dynamicFilterOptions.vendors);
      setSelectedStages(dynamicFilterOptions.stages);

      const uniqueProducts = Array.from(new Set(calls.map(c => c.product)));
      if (uniqueProducts.length > 0) {
        setSelectedProducts(uniqueProducts);
      }

      // Auto-select logged-in CM, or fall back to all CMs if no match is found
      const loggedInEmpCode = localStorage.getItem('employeeCode');
      const roleName = localStorage.getItem('roleName') || '';
      const code = String(loggedInEmpCode || '').trim().toLowerCase();
      
      let match = null;
      if (code) {
        match = dynamicFilterOptions.cms.find(cm => String(cm).trim().toLowerCase().startsWith(code));
      }

      // If user is an Admin, they should see all CMs by default
      if (match && !roleName.includes('Admin')) {
        setSelectedCMs([match]);
      } else {
        setSelectedCMs(dynamicFilterOptions.cms);
      }

      setHasAutoSelected(true);
    }
  }, [calls, dynamicFilterOptions, hasAutoSelected]);

  // Filter preview string helpers
  const getCMsPreview = () => {
    if (dynamicFilterOptions.cms.length > 0 && selectedCMs.length === dynamicFilterOptions.cms.length) return 'All CMs';
    if (selectedCMs.length === 0) return 'None Selected';
    if (selectedCMs.length === 1) return selectedCMs[0];
    return `${selectedCMs[0]} (+${selectedCMs.length - 1})`;
  };

  const getRegionsPreview = () => {
    if (dynamicFilterOptions.regions.length > 0 && selectedRegions.length === dynamicFilterOptions.regions.length) return 'All Regions';
    if (selectedRegions.length === 0) return 'None Selected';
    if (selectedRegions.length === 1) return selectedRegions[0];
    return `${selectedRegions[0]} (+${selectedRegions.length - 1})`;
  };

  const getIEsPreview = () => {
    if (dynamicFilterOptions.ies.length > 0 && selectedIEs.length === dynamicFilterOptions.ies.length) return 'All Engineers';
    if (selectedIEs.length === 0) return 'None Selected';
    if (selectedIEs.length === 1) return selectedIEs[0].split(' ')[0]; // Show only first name if space-constrained
    return `${selectedIEs[0].split(' ')[0]} (+${selectedIEs.length - 1})`;
  };

  const getProductsPreview = () => {
    if (selectedProducts.length === 3) return 'All Products';
    if (selectedProducts.length === 0) return 'None Selected';
    if (selectedProducts.length === 1) return selectedProducts[0];
    return `${selectedProducts[0]} (+${selectedProducts.length - 1})`;
  };

  const getVendorsPreview = () => {
    if (dynamicFilterOptions.vendors.length > 0 && selectedVendors.length === dynamicFilterOptions.vendors.length) return 'All Vendors';
    if (selectedVendors.length === 0) return 'None Selected';
    if (selectedVendors.length === 1) return selectedVendors[0].split(' ')[0];
    return `${selectedVendors[0].split(' ')[0]} (+${selectedVendors.length - 1})`;
  };

  const getStagesPreview = () => {
    if (dynamicFilterOptions.stages.length > 0 && selectedStages.length === dynamicFilterOptions.stages.length) return 'All Stages';
    if (selectedStages.length === 0) return 'None Selected';
    if (selectedStages.length === 1) return selectedStages[0];
    return `${selectedStages[0]} (+${selectedStages.length - 1})`;
  };

  const getDatesPreview = () => {
    if (!startDate && !endDate) return 'All Dates';
    if (startDate && endDate) return `${formatDate(startDate)} to ${formatDate(endDate)}`;
    if (startDate) return `From ${formatDate(startDate)}`;
    return `To ${formatDate(endDate)}`;
  };

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

  // Removed dynamic isOverdue calculation as it will be fetched from a separate API later
  const isOverdue = (call) => false;

  // Helper trigger to show custom alert message
  const triggerNotification = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filter and sort the inspection calls list
  const filteredCalls = useMemo(() => {
    const sourceCalls = activeCallFilter === 'overdue' ? overdueCalls : calls;
    return sourceCalls.filter(call => {
      // Global Text Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          call.callNumber.toLowerCase().includes(query) ||
          call.poNumber.toLowerCase().includes(query) ||
          call.vendorName.toLowerCase().includes(query) ||
          (call.ieName && call.ieName.toLowerCase().includes(query)) ||
          (call.cmName && call.cmName.toLowerCase().includes(query)) ||
          call.ritesRio.toLowerCase().includes(query);

        if (!matchesQuery) return false;
      }

      // CM Filter
      if (selectedCMs.length > 0 && !selectedCMs.includes(call.cmName)) return false;

      // Region Filter
      if (selectedRegions.length > 0 && !selectedRegions.includes(call.ritesRio)) return false;

      // IE Filter
      if (selectedIEs.length > 0) {
        const callIEs = call.ieName ? call.ieName.split(',').map(ie => ie.trim()) : [];
        if (!callIEs.some(ie => selectedIEs.includes(ie))) return false;
      }

      // Product Filter
      if (selectedProducts.length > 0 && !selectedProducts.includes(call.product)) return false;

      // Vendor Filter
      if (selectedVendors.length > 0 && !selectedVendors.includes(call.vendorName)) return false;

      // Inspection Stage Filter
      if (selectedStages.length > 0 && !selectedStages.includes(call.stage)) return false;

      // Date Range Filter
      if (startDate && call.callDate < startDate) return false;
      // Append T23:59:59 to endDate so calls on that day are included
      if (endDate && call.callDate > `${endDate}T23:59:59`) return false;

      // Clicking KPI Card Filtering / Subsection Filtering
      const sLower = (call.status || '').toLowerCase();
      if (activeCallFilter === 'pending') {
        return (sLower.includes('pending') && !/\bic\b/.test(sLower)) || sLower.includes('returned');
      } else if (activeCallFilter === 'under_inspection') {
        return sLower.includes('under inspection');
      } else if (activeCallFilter === 'ic_pending') {
        return /\bic\b/.test(sLower) && sLower.includes('pending');
      } else if (activeCallFilter === 'completed') {
        return sLower.includes('completed');
      } else if (activeCallFilter === 'overdue') {
        return true; // We already switched sourceCalls to overdueCalls, so return all of them
      }

      return true;
    });
  }, [calls, overdueCalls, searchQuery, selectedCMs, selectedRegions, selectedIEs, selectedProducts, selectedVendors, selectedStages, activeCallFilter, startDate, endDate]);

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
      if (selectedCMs.length > 0 && !selectedCMs.includes(call.cmName)) return false;
      if (selectedRegions.length > 0 && !selectedRegions.includes(call.ritesRio)) return false;
      if (selectedIEs.length > 0) {
        const callIEs = call.ieName ? call.ieName.split(',').map(ie => ie.trim()) : [];
        if (!callIEs.some(ie => selectedIEs.includes(ie))) return false;
      }
      if (selectedProducts.length > 0 && !selectedProducts.includes(call.product)) return false;
      if (selectedVendors.length > 0 && !selectedVendors.includes(call.vendorName)) return false;
      if (selectedStages.length > 0 && !selectedStages.includes(call.stage)) return false;
      if (startDate && call.callDate < startDate) return false;
      if (endDate && call.callDate > endDate) return false;
      return true;
    });

    const total = baseList.length;
    const pending = baseList.filter(c => {
      const sLower = (c.status || '').toLowerCase();
      return (sLower.includes('pending') && !/\bic\b/.test(sLower)) || sLower.includes('returned');
    }).length;

    const underInspection = baseList.filter(c => {
      const sLower = (c.status || '').toLowerCase();
      return sLower.includes('under inspection');
    }).length;

    const icPending = baseList.filter(c => {
      const sLower = (c.status || '').toLowerCase();
      return /\bic\b/.test(sLower) && sLower.includes('pending');
    }).length;

    const completed = baseList.filter(c => {
      const sLower = (c.status || '').toLowerCase();
      return sLower.includes('completed');
    }).length;

    const baseOverdueList = overdueCalls.filter(call => {
      if (selectedCMs.length > 0 && !selectedCMs.includes(call.cmName)) return false;
      if (selectedRegions.length > 0 && !selectedRegions.includes(call.ritesRio)) return false;
      if (selectedIEs.length > 0) {
        const callIEs = call.ieName ? call.ieName.split(',').map(ie => ie.trim()) : [];
        if (!callIEs.some(ie => selectedIEs.includes(ie))) return false;
      }
      if (selectedProducts.length > 0 && !selectedProducts.includes(call.product)) return false;
      if (selectedVendors.length > 0 && !selectedVendors.includes(call.vendorName)) return false;
      if (selectedStages.length > 0 && !selectedStages.includes(call.stage)) return false;
      if (startDate && call.callDate < startDate) return false;
      if (endDate && call.callDate > `${endDate}T23:59:59`) return false;
      return true;
    });
    const overdue = baseOverdueList.length;

    return { total, pending, underInspection, icPending, completed, overdue };
  }, [calls, overdueCalls, selectedCMs, selectedRegions, selectedIEs, selectedProducts, selectedVendors, selectedStages, startDate, endDate]);

  // Handle document PDF mock downloading
  const handleDownloadPdf = (callNumber, docType) => {
    triggerNotification(`Downloading ${docType} document for ${callNumber} in sequence...`, 'info');

    // Simulate file generation & download
    setTimeout(() => {
      triggerNotification(`${docType} document downloaded successfully!`, 'success');
    }, 800);
  };

  // Handle downloading all available documents as one consolidated package
  const handleDownloadAllDocs = (callNumber, docs) => {
    const availableDocs = Object.entries(docs || {})
      .filter(([_, val]) => val)
      .map(([key, _]) => key.toUpperCase());

    if (availableDocs.length === 0) {
      triggerNotification(`No documents available for ${callNumber}.`, 'warning');
      return;
    }

    triggerNotification(`Downloading all documents (${availableDocs.join(', ')}) as one package for ${callNumber}...`, 'info');

    setTimeout(() => {
      triggerNotification(`All documents for ${callNumber} downloaded as one package successfully!`, 'success');
    }, 1000);
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
      setter(selectedList.filter(item => item !== option));
    } else {
      setter([...selectedList, option]);
    }
    setCurrentPage(1);
  };

  // Reset all global filters to defaults
  const handleResetFilters = () => {
    setSelectedRegions(dynamicFilterOptions.regions);
    setSelectedIEs(dynamicFilterOptions.ies);
    const uniqueProducts = Array.from(new Set(calls.map(c => c.product)));
    setSelectedProducts(uniqueProducts.length > 0 ? uniqueProducts : ['ERC', 'Sleeper', 'Rail Pad']);
    setSelectedVendors(dynamicFilterOptions.vendors);
    setSelectedStages(dynamicFilterOptions.stages);

    const loggedInEmpCode = localStorage.getItem('employeeCode');
    const code = String(loggedInEmpCode || '').trim().toLowerCase();
    
    let match = null;
    if (code) {
      match = dynamicFilterOptions.cms.find(cm => String(cm).trim().toLowerCase().startsWith(code));
    }

    if (match) {
      setSelectedCMs([match]);
    } else {
      setSelectedCMs(dynamicFilterOptions.cms);
    }

    setSearchQuery('');

    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    setStartDate(d.toISOString().split('T')[0]);

    const d2 = new Date();
    setEndDate(d2.toISOString().split('T')[0]);

    setActiveCallFilter(activeTab === 'Dashboard' ? null : 'all');
    setCurrentPage(1);
    triggerNotification('Global filters reset to CM default limits.', 'info');
  };

  // Handle Approvals actions (reserved for future Notification & Approval feature)
  // eslint-disable-next-line no-unused-vars
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



  // Approval Pending Count
  const pendingApprovalsCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <div className={`cm-dashboard-container ${isSidebarCollapsed || isEmbedded ? 'sidebar-collapsed' : ''}`} style={isEmbedded ? {height: '100%', minHeight: '80vh', overflow: 'hidden'} : {}}>
      {/* Floating toggle tab — sticks to right edge of sidebar, below app header */}
      {!isEmbedded && (
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
      )}

      {/* Sidebar — no header, just nav */}
      {!isEmbedded && (
      <aside className={`cm-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>

        <nav style={{ paddingBottom: '20px', paddingTop: '10px' }}>
          {/* Dashboard (Direct Item) */}
          <div className="cm-menu-group">
            <div
              className={`cm-menu-item ${activeTab === 'Dashboard' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('Dashboard');
                setActiveCallFilter(null);
                setCallMenuOpen(false);
                setIeMenuOpen(false);
                setVendorMenuOpen(false);
                setReportsMenuOpen(false);
              }}
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
                setIeMenuOpen(false);
                setVendorMenuOpen(false);
                setReportsMenuOpen(false);
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
                setCallMenuOpen(false);
                setVendorMenuOpen(false);
                setReportsMenuOpen(false);
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
                setActiveTab('Charts');
                setVendorMenuOpen(!vendorMenuOpen);
                setCallMenuOpen(false);
                setIeMenuOpen(false);
                setReportsMenuOpen(false);
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

                {getSidebarReportsByProduct(selectedReportProduct).map(reportName => (
                  <div
                    key={reportName}
                    className={`cm-submenu-link ${activeTab === 'All Reports' && activeReportTab === reportName ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab('All Reports');
                      setActiveReportTab(reportName);
                    }}
                    style={{ fontSize: '11.5px', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <i className="fa-solid fa-file-lines" style={{ fontSize: '11px', opacity: 0.8 }}></i>
                    <span style={{ lineHeight: '1.2' }}>{reportName}</span>
                  </div>
                ))}

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
              onClick={() => {
                setActiveTab('PO Lifecycle');
                setCallMenuOpen(false);
                setIeMenuOpen(false);
                setVendorMenuOpen(false);
                setReportsMenuOpen(false);
              }}
            >
              <i className="cm-menu-item-icon fa-solid fa-file-contract"></i>
              {!isSidebarCollapsed && <span>PO Lifecycle</span>}
            </div>
          </div>

          {/* Reports (Collapsible Menu) */}
          <div className="cm-menu-group">
            <div
              className={`cm-menu-item ${['Mandays Calculation', 'Billing Sheet'].includes(activeTab) ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('Mandays Calculation');
                setReportsMenuOpen(!reportsMenuOpen);
                setCallMenuOpen(false);
                setIeMenuOpen(false);
                setVendorMenuOpen(false);
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
                  style={{ fontSize: '11.5px', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <i className="fa-solid fa-calculator" style={{ fontSize: '11px', opacity: 0.8 }} />
                  <span style={{ lineHeight: '1.2' }}>Process Inspection Mandays Calculation</span>
                </div>
                <div
                  className={`cm-submenu-link ${activeTab === 'Billing Sheet' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Billing Sheet')}
                  style={{ fontSize: '11.5px', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <i className="fa-solid fa-file-invoice-dollar" style={{ fontSize: '11px', opacity: 0.8 }} />
                  <span style={{ lineHeight: '1.2' }}>Billing Sheet</span>
                </div>
              </div>
            )}
          </div>

          {/* Notification & Approval (Direct Item) */}
          <div className="cm-menu-group">
            <div
              className={`cm-menu-item ${activeTab === 'Notification & Approval' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('Notification & Approval');
                setCallMenuOpen(false);
                setIeMenuOpen(false);
                setVendorMenuOpen(false);
                setReportsMenuOpen(false);
              }}
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
      )}

      {/* Main Panel Content Area */}
      <main className="cm-main-panel" style={isEmbedded ? { marginLeft: 0, width: '100%', padding: '10px' } : {}}>

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

        {/* Shared Header for Core CM & IE Monitoring Tabs */}
        {['Dashboard', 'Call Monitoring', 'IE wise Call Status', 'IE Performance Monitoring'].includes(activeTab) && (
          <div className="cm-panel-header">
            <div className="cm-panel-title-area">
              <h1 className="cm-panel-title">
                {activeTab === 'Dashboard' ? 'Controlling Manager Dashboard' :
                  activeTab === 'Call Monitoring' ? 'Call Monitoring Center' :
                    activeTab === 'IE wise Call Status' ? 'Inspection Engineers Wise Call Status' :
                      'Inspection Engineers Performance Monitoring'}
              </h1>
              <p className="cm-panel-subtitle">
                {activeTab === 'Dashboard' || activeTab === 'Call Monitoring' ?
                  'Live monitoring, validation, and analytics of ERC, Sleeper, and Rail Pad inspection assignments.' :
                  activeTab === 'IE wise Call Status' ?
                    'Performance breakdown and current operational assignment statuses of assigned IEs.' :
                    'SLA compliance logs, average completed call statistics, and workload capacity ratings.'}
              </p>
            </div>
            <button className="btn btn--outline" onClick={handleResetFilters}>
              <i className="fa-solid fa-rotate-left" style={{ marginRight: '6px' }}></i> Reset Filters
            </button>
          </div>
        )}

        {/* KPI Cards Layered Grid - only for Dashboard */}
        {activeTab === 'Dashboard' && (
          <section className="cm-kpi-layer-container">
            {/* First Row: 3 Cards */}
            <div className="cm-kpi-row cm-kpi-row-1">
              <div
                className={`cm-kpi-card card-light-green ${activeCallFilter === 'all' ? 'active' : ''}`}
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
                className={`cm-kpi-card card-light-blue ${activeCallFilter === 'under_inspection' ? 'active' : ''}`}
                onClick={() => { setActiveCallFilter('under_inspection'); setCurrentPage(1); }}
              >
                <div className="cm-kpi-header">
                  <span className="cm-kpi-title">Under Inspection Calls</span>
                  <i className="cm-kpi-icon fa-solid fa-sliders"></i>
                </div>
                <div className="cm-kpi-value">{kpiStats.underInspection}</div>
                <div className="cm-kpi-footer">Initiated but not completed</div>
              </div>
            </div>

            {/* Second Row: 3 Cards */}
            <div className="cm-kpi-row cm-kpi-row-2">
              <div
                className={`cm-kpi-card card-light-indigo ${activeCallFilter === 'ic_pending' ? 'active' : ''}`}
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
            </div>
          </section>
        )}

        {/* Global Filters Panel — Premium Redesign (shared across core tabs) */}
        {((activeTab === 'Dashboard' && activeCallFilter !== null) || ['Call Monitoring', 'IE wise Call Status', 'IE Performance Monitoring'].includes(activeTab)) && (
          <section style={{ background: '#fff', borderRadius: '12px', border: '1px solid #d1fae5', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'visible' }}>
            {/* Sleek Minimalist Header Bar */}
            <div
              onClick={() => { setFiltersExpanded(!filtersExpanded); setOpenDropdown(null); }}
              style={{
                background: '#ffffff',
                borderLeft: '4px solid #166534',
                padding: '10px 16px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                userSelect: 'none',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px',
                borderBottomLeftRadius: filtersExpanded ? '0' : '12px',
                borderBottomRightRadius: filtersExpanded ? '0' : '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-sliders" style={{ color: '#166534', fontSize: '13px' }} />
                <span style={{ color: '#166534', fontWeight: '700', fontSize: '12px', letterSpacing: '0.3px' }}>Global Controls &amp; Filters</span>
                <span style={{ background: '#f0fdf4', color: '#166534', borderRadius: '12px', padding: '2px 8px', fontSize: '10px', fontWeight: '700', border: '1px solid #bbf7d0', marginLeft: '6px' }}>
                  {selectedCMs.length + selectedRegions.length + selectedIEs.length + selectedProducts.length + selectedVendors.length + selectedStages.length + (startDate || endDate ? 1 : 0)} active
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b6b4b', fontSize: '11px', fontWeight: '500' }}>
                <span>{filtersExpanded ? 'Click to collapse' : 'Click to expand'}</span>
                <i className={`fa-solid ${filtersExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ fontSize: '10px' }} />
              </div>
            </div>

            {/* Click-outside popover manager */}
            {openDropdown && (
              <div
                onClick={() => setOpenDropdown(null)}
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
              />
            )}

            {filtersExpanded && (
              <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', background: '#fafafa', borderTop: '1px solid #f0fdf4', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                {/* Inline Popover Selectors */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>

                  {/* CM Select */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === 'cm' ? null : 'cm')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '6px',
                        background: selectedCMs.length < dynamicFilterOptions.cms.length ? '#f0fdf4' : '#fff',
                        border: `1px solid ${selectedCMs.length < dynamicFilterOptions.cms.length ? '#bbf7d0' : '#e2e8f0'}`,
                        color: selectedCMs.length < dynamicFilterOptions.cms.length ? '#166534' : '#4b5563',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <i className="fa-solid fa-user-gear" style={{ color: '#166534', opacity: 0.8 }} />
                      <span>CM: {getCMsPreview()}</span>
                      <i className="fa-solid fa-chevron-down" style={{ fontSize: '9px', opacity: 0.7, transform: openDropdown === 'cm' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    </button>

                    {openDropdown === 'cm' && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '6px',
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        zIndex: 999,
                        minWidth: '180px',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <div style={{ padding: '4px 8px', fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter by CM</div>
                        {dynamicFilterOptions.cms.map(cm => {
                          const on = selectedCMs.includes(cm);
                          return (
                            <div
                              key={cm}
                              onClick={() => toggleFilterOption(cm, selectedCMs, setSelectedCMs)}
                              className={`cm-filter-dropdown-item ${on ? 'selected cm' : ''}`}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '3px',
                                  border: `1px solid ${on ? '#166534' : '#cbd5e1'}`,
                                  background: on ? '#166534' : '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontSize: '9px'
                                }}>
                                  {on && <i className="fa-solid fa-check" />}
                                </div>
                                {cm}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Region Select */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === 'region' ? null : 'region')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '6px',
                        background: selectedRegions.length < 4 ? '#f0fdf4' : '#fff',
                        border: `1px solid ${selectedRegions.length < 4 ? '#bbf7d0' : '#e2e8f0'}`,
                        color: selectedRegions.length < 4 ? '#166534' : '#4b5563',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <i className="fa-solid fa-location-dot" style={{ color: '#166534', opacity: 0.8 }} />
                      <span>Region: {getRegionsPreview()}</span>
                      <i className="fa-solid fa-chevron-down" style={{ fontSize: '9px', opacity: 0.7, transform: openDropdown === 'region' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    </button>

                    {openDropdown === 'region' && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '6px',
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        zIndex: 999,
                        minWidth: '180px',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <div style={{ padding: '4px 8px', fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter by Region</div>
                        {dynamicFilterOptions.regions.map(rio => {
                          const on = selectedRegions.includes(rio);
                          return (
                            <div
                              key={rio}
                              onClick={() => toggleFilterOption(rio, selectedRegions, setSelectedRegions)}
                              className={`cm-filter-dropdown-item ${on ? 'selected region' : ''}`}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '3px',
                                  border: `1px solid ${on ? '#166534' : '#cbd5e1'}`,
                                  background: on ? '#166534' : '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontSize: '9px'
                                }}>
                                  {on && <i className="fa-solid fa-check" />}
                                </div>
                                {rio}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* IE Select */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => {
                        setOpenDropdown(openDropdown === 'ie' ? null : 'ie');
                        setIeSearchQuery('');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '6px',
                        background: selectedIEs.length < INITIAL_IES.length ? '#eff6ff' : '#fff',
                        border: `1px solid ${selectedIEs.length < INITIAL_IES.length ? '#bfdbfe' : '#e2e8f0'}`,
                        color: selectedIEs.length < INITIAL_IES.length ? '#1d4ed8' : '#4b5563',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <i className="fa-solid fa-user-tie" style={{ color: '#1d4ed8', opacity: 0.8 }} />
                      <span>IE: {getIEsPreview()}</span>
                      <i className="fa-solid fa-chevron-down" style={{ fontSize: '9px', opacity: 0.7, transform: openDropdown === 'ie' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    </button>

                    {openDropdown === 'ie' && (() => {
                      const filteredIEs = dynamicFilterOptions.ies.filter(ie =>
                        ie.toLowerCase().includes(ieSearchQuery.toLowerCase())
                      );
                      const areAllFilteredSelected = filteredIEs.length > 0 && filteredIEs.every(ie => selectedIEs.includes(ie));

                      const handleSelectAllIEs = () => {
                        if (areAllFilteredSelected) {
                          // Deselect all filtered IEs
                          setSelectedIEs(prev => prev.filter(name => !filteredIEs.includes(name)));
                        } else {
                          // Select all filtered IEs (union)
                          setSelectedIEs(prev => {
                            const union = new Set([...prev, ...filteredIEs]);
                            return Array.from(union);
                          });
                        }
                        setCurrentPage(1);
                      };

                      return (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          marginTop: '6px',
                          background: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                          zIndex: 999,
                          minWidth: '220px',
                          padding: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          <div style={{ padding: '4px 8px', fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter by Engineer</div>

                          {/* Search Input inside Dropdown */}
                          <div style={{ padding: '2px 4px', marginBottom: '4px' }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '8px', color: '#94a3b8', fontSize: '10px' }} />
                              <input
                                type="text"
                                placeholder="Search engineers..."
                                value={ieSearchQuery}
                                onChange={(e) => setIeSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()} /* Prevents closing or side effects */
                                style={{
                                  width: '100%',
                                  padding: '5px 8px 5px 24px',
                                  fontSize: '11px',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '4px',
                                  outline: 'none',
                                  fontFamily: 'inherit'
                                }}
                              />
                              {ieSearchQuery && (
                                <i
                                  className="fa-solid fa-xmark"
                                  onClick={(e) => { e.stopPropagation(); setIeSearchQuery(''); }}
                                  style={{ position: 'absolute', right: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '10px' }}
                                />
                              )}
                            </div>
                          </div>

                          {filteredIEs.length === 0 ? (
                            <div style={{ padding: '8px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                              No engineers found
                            </div>
                          ) : (
                            <>
                              {/* Select All Option */}
                              <div
                                onClick={handleSelectAllIEs}
                                className={`cm-filter-dropdown-item ${areAllFilteredSelected ? 'selected ie' : ''}`}
                                style={{
                                  borderBottom: '1px solid #f1f5f9',
                                  paddingBottom: '6px',
                                  marginBottom: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                                  <div style={{
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '3px',
                                    border: `1px solid ${areAllFilteredSelected ? '#1d4ed8' : '#cbd5e1'}`,
                                    background: areAllFilteredSelected ? '#1d4ed8' : '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '9px'
                                  }}>
                                    {areAllFilteredSelected && <i className="fa-solid fa-check" />}
                                  </div>
                                  Select All {ieSearchQuery && `(${filteredIEs.length})`}
                                </span>
                              </div>

                              {/* Filtered List */}
                              <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {filteredIEs.map(ie => {
                                  const on = selectedIEs.includes(ie);
                                  return (
                                    <div
                                      key={ie}
                                      onClick={() => toggleFilterOption(ie, selectedIEs, setSelectedIEs)}
                                      className={`cm-filter-dropdown-item ${on ? 'selected ie' : ''}`}
                                    >
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                          width: '14px',
                                          height: '14px',
                                          borderRadius: '3px',
                                          border: `1px solid ${on ? '#1d4ed8' : '#cbd5e1'}`,
                                          background: on ? '#1d4ed8' : '#fff',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          color: '#fff',
                                          fontSize: '9px'
                                        }}>
                                          {on && <i className="fa-solid fa-check" />}
                                        </div>
                                        {ie}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Product Select */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === 'product' ? null : 'product')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '6px',
                        background: selectedProducts.length < 3 ? '#faf5ff' : '#fff',
                        border: `1px solid ${selectedProducts.length < 3 ? '#e9d5ff' : '#e2e8f0'}`,
                        color: selectedProducts.length < 3 ? '#7c3aed' : '#4b5563',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <i className="fa-solid fa-cubes" style={{ color: '#7c3aed', opacity: 0.8 }} />
                      <span>Product: {getProductsPreview()}</span>
                      <i className="fa-solid fa-chevron-down" style={{ fontSize: '9px', opacity: 0.7, transform: openDropdown === 'product' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    </button>

                    {openDropdown === 'product' && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '6px',
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        zIndex: 999,
                        minWidth: '160px',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <div style={{ padding: '4px 8px', fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter by Product</div>
                        {['ERC', 'Sleeper', 'Rail Pad'].map(prod => {
                          const on = selectedProducts.includes(prod);
                          return (
                            <div
                              key={prod}
                              onClick={() => toggleFilterOption(prod, selectedProducts, setSelectedProducts)}
                              className={`cm-filter-dropdown-item ${on ? 'selected product' : ''}`}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '3px',
                                  border: `1px solid ${on ? '#7c3aed' : '#cbd5e1'}`,
                                  background: on ? '#7c3aed' : '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontSize: '9px'
                                }}>
                                  {on && <i className="fa-solid fa-check" />}
                                </div>
                                {prod}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Vendor Select */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => {
                        setOpenDropdown(openDropdown === 'vendor' ? null : 'vendor');
                        setVendorSearchQuery('');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '6px',
                        background: selectedVendors.length < INITIAL_VENDORS.length ? '#fffbeb' : '#fff',
                        border: `1px solid ${selectedVendors.length < INITIAL_VENDORS.length ? '#fde68a' : '#e2e8f0'}`,
                        color: selectedVendors.length < INITIAL_VENDORS.length ? '#b45309' : '#4b5563',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <i className="fa-solid fa-industry" style={{ color: '#d97706', opacity: 0.8 }} />
                      <span>Vendor: {getVendorsPreview()}</span>
                      <i className="fa-solid fa-chevron-down" style={{ fontSize: '9px', opacity: 0.7, transform: openDropdown === 'vendor' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    </button>

                    {openDropdown === 'vendor' && (() => {
                      const filteredVendors = dynamicFilterOptions.vendors.filter(v =>
                        v.toLowerCase().includes(vendorSearchQuery.toLowerCase())
                      );
                      const areAllFilteredSelected = filteredVendors.length > 0 && filteredVendors.every(v => selectedVendors.includes(v));

                      const handleSelectAllVendors = () => {
                        if (areAllFilteredSelected) {
                          // Deselect all filtered Vendors
                          setSelectedVendors(prev => prev.filter(name => !filteredVendors.includes(name)));
                        } else {
                          // Select all filtered Vendors (union)
                          setSelectedVendors(prev => {
                            const union = new Set([...prev, ...filteredVendors]);
                            return Array.from(union);
                          });
                        }
                        setCurrentPage(1);
                      };

                      return (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          marginTop: '6px',
                          background: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                          zIndex: 999,
                          minWidth: '240px',
                          padding: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          <div style={{ padding: '4px 8px', fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter by Vendor</div>

                          {/* Search Input inside Dropdown */}
                          <div style={{ padding: '2px 4px', marginBottom: '4px' }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '8px', color: '#94a3b8', fontSize: '10px' }} />
                              <input
                                type="text"
                                placeholder="Search vendors..."
                                value={vendorSearchQuery}
                                onChange={(e) => setVendorSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()} /* Prevents closing or side effects */
                                style={{
                                  width: '100%',
                                  padding: '5px 8px 5px 24px',
                                  fontSize: '11px',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '4px',
                                  outline: 'none',
                                  fontFamily: 'inherit'
                                }}
                              />
                              {vendorSearchQuery && (
                                <i
                                  className="fa-solid fa-xmark"
                                  onClick={(e) => { e.stopPropagation(); setVendorSearchQuery(''); }}
                                  style={{ position: 'absolute', right: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '10px' }}
                                />
                              )}
                            </div>
                          </div>

                          {filteredVendors.length === 0 ? (
                            <div style={{ padding: '8px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                              No vendors found
                            </div>
                          ) : (
                            <>
                              {/* Select All Option */}
                              <div
                                onClick={handleSelectAllVendors}
                                className={`cm-filter-dropdown-item ${areAllFilteredSelected ? 'selected vendor' : ''}`}
                                style={{
                                  borderBottom: '1px solid #f1f5f9',
                                  paddingBottom: '6px',
                                  marginBottom: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                                  <div style={{
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '3px',
                                    border: `1px solid ${areAllFilteredSelected ? '#b45309' : '#cbd5e1'}`,
                                    background: areAllFilteredSelected ? '#b45309' : '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '9px'
                                  }}>
                                    {areAllFilteredSelected && <i className="fa-solid fa-check" />}
                                  </div>
                                  Select All {vendorSearchQuery && `(${filteredVendors.length})`}
                                </span>
                              </div>

                              {/* Filtered List */}
                              <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {filteredVendors.map(v => {
                                  const on = selectedVendors.includes(v);
                                  return (
                                    <div
                                      key={v}
                                      onClick={() => toggleFilterOption(v, selectedVendors, setSelectedVendors)}
                                      className={`cm-filter-dropdown-item ${on ? 'selected vendor' : ''}`}
                                    >
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                          width: '14px',
                                          height: '14px',
                                          borderRadius: '3px',
                                          border: `1px solid ${on ? '#b45309' : '#cbd5e1'}`,
                                          background: on ? '#b45309' : '#fff',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          color: '#fff',
                                          fontSize: '9px'
                                        }}>
                                          {on && <i className="fa-solid fa-check" />}
                                        </div>
                                        {v}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Stage Select */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === 'stage' ? null : 'stage')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '6px',
                        background: selectedStages.length < 3 ? '#fff7ed' : '#fff',
                        border: `1px solid ${selectedStages.length < 3 ? '#fed7aa' : '#e2e8f0'}`,
                        color: selectedStages.length < 3 ? '#c2410c' : '#4b5563',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <i className="fa-solid fa-layer-group" style={{ color: '#ea580c', opacity: 0.8 }} />
                      <span>Stage: {getStagesPreview()}</span>
                      <i className="fa-solid fa-chevron-down" style={{ fontSize: '9px', opacity: 0.7, transform: openDropdown === 'stage' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    </button>

                    {openDropdown === 'stage' && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '6px',
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        zIndex: 999,
                        minWidth: '150px',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <div style={{ padding: '4px 8px', fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter by Stage</div>
                        {dynamicFilterOptions.stages.map(stg => {
                          const on = selectedStages.includes(stg);
                          return (
                            <div
                              key={stg}
                              onClick={() => toggleFilterOption(stg, selectedStages, setSelectedStages)}
                              className={`cm-filter-dropdown-item ${on ? 'selected stage' : ''}`}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '3px',
                                  border: `1px solid ${on ? '#c2410c' : '#cbd5e1'}`,
                                  background: on ? '#c2410c' : '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontSize: '9px'
                                }}>
                                  {on && <i className="fa-solid fa-check" />}
                                </div>
                                {stg}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Date Range Select */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '6px',
                        background: (startDate || endDate) ? '#fef2f2' : '#fff',
                        border: `1px solid ${(startDate || endDate) ? '#fca5a5' : '#e2e8f0'}`,
                        color: (startDate || endDate) ? '#991b1b' : '#4b5563',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <i className="fa-solid fa-calendar-days" style={{ color: '#ef4444', opacity: 0.8 }} />
                      <span>Dates: {getDatesPreview()}</span>
                      <i className="fa-solid fa-chevron-down" style={{ fontSize: '9px', opacity: 0.7, transform: openDropdown === 'date' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    </button>

                    {openDropdown === 'date' && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '6px',
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        zIndex: 999,
                        minWidth: '220px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter by Date Range</div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '10px', fontWeight: '600', color: '#4b5563' }}>Start Date</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                            style={{ padding: '6px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff', color: '#1a2e1a', outline: 'none', width: '100%', fontFamily: 'inherit' }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '10px', fontWeight: '600', color: '#4b5563' }}>End Date</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                            style={{ padding: '6px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff', color: '#1a2e1a', outline: 'none', width: '100%', fontFamily: 'inherit' }}
                          />
                        </div>

                        {(startDate || endDate) && (
                          <button
                            onClick={() => { setStartDate(''); setEndDate(''); setCurrentPage(1); }}
                            style={{
                              marginTop: '4px',
                              padding: '6px',
                              background: '#fef2f2',
                              border: '1px solid #fee2e2',
                              borderRadius: '4px',
                              color: '#ef4444',
                              fontSize: '10px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Clear Dates
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={handleResetFilters}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 12px',
                      borderRadius: '6px',
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      color: '#ef4444',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    className="filter-reset-btn"
                  >
                    <i className="fa-solid fa-rotate-left" style={{ fontSize: '10px' }} />
                    <span>Reset</span>
                  </button>

                </div>
              </div>
            )}
          </section>
        )}

        {/* Date Range Picker - Show only for Call Monitoring */}
        {activeTab === 'Call Monitoring' && (
          <div style={{ marginBottom: '10px', display: 'flex' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', background: '#fff', padding: '10px 20px', borderRadius: '12px', border: '1px solid #bbf7d0', width: 'fit-content' }}>
              <span style={{ fontWeight: '700', color: '#166534', fontSize: '13px' }}>FROM</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#f0fdf4', color: '#166534', fontSize: '14px', outline: 'none', cursor: 'pointer', fontWeight: '500' }}
                />
              </div>
              <span style={{ fontWeight: '700', color: '#166534', fontSize: '13px' }}>TO</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#f0fdf4', color: '#166534', fontSize: '14px', outline: 'none', cursor: 'pointer', fontWeight: '500' }}
                />
              </div>
            </div>
          </div>
        )}

        {((activeTab === 'Dashboard' && activeCallFilter !== null) || activeTab === 'Call Monitoring') && (
          <>
            {/* Calls Table Section */}
            <section className="cm-list-card">
              <div className="cm-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="cm-list-info">
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', margin: 0 }}>
                    Inspection Calls Details List
                    <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#4b6b4b', marginLeft: '8px' }}>
                      ({!activeCallFilter ? 'All Calls' : activeCallFilter === 'all' ? 'All Calls' : `${activeCallFilter.toUpperCase().replace('_', ' ')}`})
                    </span>
                  </h3>
                  <span className="cm-list-count-badge">
                    {sortedCalls.length} of {calls.length} entries
                  </span>
                </div>

                {/* Table Header Global Search Bar */}
                <div style={{ position: 'relative', width: '360px' }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#166534', fontSize: '13px', opacity: 0.7 }} />
                  <input
                    type="text"
                    placeholder="Search in table..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      borderRadius: '6px',
                      border: '1px solid #bbf7d0',
                      background: '#fff',
                      fontSize: '13px',
                      color: '#1a2e1a',
                      outline: 'none',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.15s ease'
                    }}
                  />
                  {searchQuery && (
                    <i
                      className="fa-solid fa-xmark"
                      onClick={() => setSearchQuery('')}
                      style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px', cursor: 'pointer' }}
                    />
                  )}
                </div>
              </div>

              <div className="cm-table-wrapper">
                <table className="cm-table">
                  <thead>
                    <tr>
                      <th className="sortable" style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('callNumber')}>Call Number</th>
                      <th className="sortable" onClick={() => handleSort('product')}>Product & Stage of Inspection</th>
                      <th className="sortable" onClick={() => handleSort('poNumber')}>PO Number</th>
                      <th className="sortable" style={{ minWidth: '130px' }} onClick={() => handleSort('dpDate')}>DP Date & EXT DP Date</th>
                      <th className="sortable" onClick={() => handleSort('vendorName')}>Vendor Name</th>
                      <th className="sortable" style={{ minWidth: '120px' }} onClick={() => handleSort('desiredInspectionDate')}>Inspection Desired Date</th>
                      <th className="sortable" style={{ minWidth: '100px' }} onClick={() => handleSort('callDate')}>Call Date</th>
                      <th className="sortable" onClick={() => handleSort('ieName')}>IE Name</th>
                      <th>CM Name</th>
                      <th className="sortable" onClick={() => handleSort('ritesRio')}>RITES RIO</th>
                      <th className="sortable" onClick={() => handleSort('status')}>Status</th>
                      <th>Documents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCalls.length > 0 ? (
                      paginatedCalls.flatMap((call) => {
                        const ies = call.ieName ? call.ieName.split(',').map(ie => ie.trim()) : ['Unassigned'];
                        return ies.map((singleIeName, ieIndex) => {
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
                            <tr key={`${call.id}-${ieIndex}`} style={{ background: overdueFlag ? '#fef2f2' : '' }}>
                              {/* Call Number */}
                              <td style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                {call.callNumber}
                                {overdueFlag && <span style={{ color: '#ef4444', marginLeft: '4px' }} title="Overdue Warning">⚠️</span>}
                              </td>

                              {/* Product & Stage of Inspection (eg. ERC- Process, Sleeper- Final…) */}
                              <td className="wrap-cell">{`${call.product}- ${call.stage}`}</td>

                              {/* PO Number - hyperlink to download PO */}
                              <td className="wrap-cell">
                                <a
                                  href="#download-po"
                                  className="cm-table-link"
                                  onClick={(e) => { e.preventDefault(); handleDownloadPdf(call.callNumber, 'PO'); }}
                                >
                                  {call.poNumber}
                                </a>
                              </td>

                              {/* DP Date & Ext DP Date */}
                              <td className="wrap-cell">
                                <div>{formatDate(call.dpDate)}</div>
                                {call.extDpDate && <div style={{ fontSize: '11px', color: '#4b6b4b' }}>({formatDate(call.extDpDate)})</div>}
                              </td>

                              {/* Vendor Name */}
                              <td className="vendor-cell">{call.vendorName}</td>

                              {/* Inspection Desired Date */}
                              <td style={{ whiteSpace: 'nowrap' }}>{formatDate(call.desiredInspectionDate)}</td>

                              {/* Call Date */}
                              <td style={{ whiteSpace: 'nowrap' }}>{formatDate(call.callDate)}</td>

                              {/* IE Name */}
                              <td className="wrap-cell">{singleIeName}</td>

                              {/* CM Name */}
                              <td className="wrap-cell">{call.cmName}</td>

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

                              {/* Documents (Download single pdf sequence) */}
                              <td>
                                <div className="cm-doc-download-bar" style={{ justifyContent: 'center' }}>
                                  <button
                                    className="cm-doc-link"
                                    title="Download all documents as one PDF"
                                    onClick={() => handleDownloadAllDocs(call.callNumber, call.docs)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '4px',
                                      height: '24px',
                                      padding: '0 8px',
                                      fontSize: '11px',
                                      fontWeight: 'bold',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <i className="fa-solid fa-download"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })
                    ) : (
                      <tr>
                        <td colSpan="12">
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
            <section className="cm-list-card">
              <div className="cm-list-header">
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', margin: 0 }}>
                  IE Wise Call Status Allocations &amp; Workload Summary
                </h3>
              </div>
              <div className="cm-table-wrapper">
                <table className="cm-table cm-table-centered">
                  <thead>
                    <tr>
                      <th>IE ID</th>
                      <th>IE Name</th>
                      <th>No. of Calls Pending</th>
                      <th>No. of Calls Under Inspection</th>
                      <th>No. of Call Pending for IC</th>
                      <th>No. of Calls Overdue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedProducts.includes('ERC') ? ieWiseCallStatusData : selectedProducts.includes('Sleeper') ? sleeperIeWiseCallStatusData : INITIAL_IES).filter(ie => selectedIEs.length === 0 || selectedIEs.includes(ie.ieName || ie.name)).map((ie, idx) => {
                      const isApiData = selectedProducts.includes('ERC') || selectedProducts.includes('Sleeper');
                      const ieName = ie.ieName || ie.name;
                      const ieId = ie.ieId || ie.id;
                      const ieCalls = filteredCalls.filter(c => c.ieName === ieName);

                      let pending = 0, underInspection = 0, icPending = 0, overdue = 0;
                      if (isApiData) {
                        pending = ie.noOfCallsPending || 0;
                        underInspection = ie.noOfCallsUnderInspection || 0;
                        icPending = ie.noOfCallsPendingForIc || 0;
                        overdue = ie.noOfCallsOverdue || 0;
                      } else {
                        pending = ieCalls.filter(c => c.status === 'Pending').length;
                        underInspection = ieCalls.filter(c => c.status === 'Under Inspection').length;
                        icPending = ieCalls.filter(c => c.status === 'IC Issuance Pending').length;
                        overdue = ieCalls.filter(c => isOverdue(c)).length;
                      }

                      return (
                        <tr key={ieId || idx}>
                          <td style={{ fontWeight: 'bold' }}>{ieId}</td>
                          <td style={{ fontWeight: '600', color: '#15803d' }}>{ieName}</td>
                          <td style={{ fontWeight: '600', color: pending > 0 ? '#d97706' : 'inherit' }}>
                            {pending > 0 ? (
                              <span
                                className="cm-table-link"
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => handleOpenCallDetailsModal(ieName, 'Pending', ieCalls.filter(c => c.status === 'Pending'))}
                              >
                                {pending}
                              </span>
                            ) : (
                              pending
                            )}
                          </td>
                          <td style={{ fontWeight: '600', color: underInspection > 0 ? '#ea580c' : 'inherit' }}>
                            {underInspection > 0 ? (
                              <span
                                className="cm-table-link"
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => handleOpenCallDetailsModal(ieName, 'Under Inspection', ieCalls.filter(c => c.status === 'Under Inspection'))}
                              >
                                {underInspection}
                              </span>
                            ) : (
                              underInspection
                            )}
                          </td>
                          <td style={{ fontWeight: '600', color: icPending > 0 ? '#4338ca' : 'inherit' }}>
                            {icPending > 0 ? (
                              <span
                                className="cm-table-link"
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => handleOpenCallDetailsModal(ieName, 'Pending for IC', ieCalls.filter(c => c.status === 'IC Issuance Pending'))}
                              >
                                {icPending}
                              </span>
                            ) : (
                              icPending
                            )}
                          </td>
                          <td style={{ fontWeight: 'bold', color: overdue > 0 ? '#ef4444' : 'inherit' }}>
                            {overdue > 0 ? (
                              <span
                                className="cm-table-link"
                                style={{ cursor: 'pointer', textDecoration: 'underline', color: '#ef4444' }}
                                onClick={() => handleOpenCallDetailsModal(ieName, 'Overdue', ieCalls.filter(c => isOverdue(c)))}
                              >
                                {overdue}
                                <span style={{ color: '#ef4444', marginLeft: '4px' }} title="Desired Date crossed by 7 Days">⚠️</span>
                              </span>
                            ) : (
                              overdue
                            )}
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
            <section className="cm-list-card">
              <div className="cm-list-header">
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', margin: 0 }}>
                  IE Operational SLA Performance Summary (Completed Calls Analysis)
                </h3>
              </div>
              <div className="cm-table-wrapper">
                <table className="cm-performance-table">
                  <thead>
                    <tr>
                      <th className="col-perf-ie-id">IE ID</th>
                      <th className="col-perf-ie-name">IE Name</th>
                      <th className="col-perf-number">Total Calls</th>
                      <th className="col-perf-number-wide">Overdue Calls Attended</th>
                      <th className="col-perf-number">Calls Cancelled</th>
                      <th className="col-perf-number">Calls Accepted</th>
                      <th className="col-perf-number">Calls Rejected</th>
                      <th className="col-perf-number-wide">Calls Partially Accepted &amp; Rejected</th>
                      <th className="col-perf-number">Calls Withheld</th>
                      <th className="col-perf-number">IC Issued</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedProducts.includes('ERC') ? cmCompletedCallsAnalysisData : selectedProducts.includes('Sleeper') ? sleeperCompletedCallsAnalysisData : INITIAL_IES).filter(ie => selectedIEs.length === 0 || selectedIEs.includes(ie.ieName || ie.name)).map((ie, idx) => {
                      const isApiData = selectedProducts.includes('ERC') || selectedProducts.includes('Sleeper');
                      if (isApiData) {
                        return (
                          <tr key={ie.ieId || idx}>
                            <td className="col-perf-ie-id" style={{ fontWeight: 'bold' }}>{ie.ieId}</td>
                            <td className="col-perf-ie-name" style={{ fontWeight: '600', color: '#15803d' }}>{ie.ieName}</td>
                            <td className="col-perf-number" style={{ fontWeight: '600' }}>{ie.totalCalls || 0}</td>
                            <td className="col-perf-number-wide" style={{ fontWeight: 'bold', color: ie.overdueCallsAttended > 0 ? '#ef4444' : 'inherit' }}>{ie.overdueCallsAttended || 0}</td>
                            <td className="col-perf-number" style={{ fontWeight: '600', color: ie.callsCancelled > 0 ? '#64748b' : 'inherit' }}>{ie.callsCancelled || 0}</td>
                            <td className="col-perf-number" style={{ fontWeight: 'bold', color: ie.callsAccepted > 0 ? '#15803d' : 'inherit' }}>{ie.callsAccepted || 0}</td>
                            <td className="col-perf-number" style={{ fontWeight: 'bold', color: ie.callsRejected > 0 ? '#ef4444' : 'inherit' }}>{ie.callsRejected || 0}</td>
                            <td className="col-perf-number-wide" style={{ fontWeight: '600', color: ie.callsPartiallyAcceptedRejected > 0 ? '#d97706' : 'inherit' }}>{ie.callsPartiallyAcceptedRejected || 0}</td>
                            <td className="col-perf-number" style={{ fontWeight: '600', color: ie.callsWithheld > 0 ? '#ea580c' : 'inherit' }}>{ie.callsWithheld || 0}</td>
                            <td className="col-perf-number" style={{ fontWeight: 'bold', color: ie.icIssued > 0 ? '#4338ca' : 'inherit' }}>{ie.icIssued || 0}</td>
                          </tr>
                        );
                      }

                      const completedCalls = filteredCalls.filter(c => c.ieName === ie.name && c.status === 'Completed');
                      const total = completedCalls.length;

                      const overdueAttended = completedCalls.filter(c => {
                        const desired = new Date(c.desiredInspectionDate);
                        const callDate = new Date(c.callDate);
                        const diffTime = callDate - desired;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays > 7;
                      }).length;

                      const cancelled = completedCalls.filter(c => c.subStatus === 'Cancelled').length;
                      const accepted = completedCalls.filter(c => c.subStatus === 'Accepted').length;
                      const rejected = completedCalls.filter(c => c.subStatus === 'Rejected').length;
                      const partial = completedCalls.filter(c => c.subStatus === 'Partially Accepted').length;
                      const withheld = completedCalls.filter(c => c.subStatus === 'Withheld').length;
                      const icIssued = completedCalls.filter(c => c.subStatus === 'IC Issued').length;

                      return (
                        <tr key={ie.id}>
                          <td style={{ fontWeight: 'bold' }}>{ie.id}</td>
                          <td style={{ fontWeight: '600', color: '#15803d' }}>{ie.name}</td>
                          <td style={{ fontWeight: 'bold' }}>{total}</td>
                          <td style={{ fontWeight: '600', color: overdueAttended > 0 ? '#ef4444' : 'inherit' }}>{overdueAttended}</td>
                          <td style={{ color: cancelled > 0 ? '#64748b' : 'inherit' }}>{cancelled}</td>
                          <td style={{ color: accepted > 0 ? '#15803d' : 'inherit', fontWeight: '500' }}>{accepted}</td>
                          <td style={{ color: rejected > 0 ? '#ef4444' : 'inherit', fontWeight: '500' }}>{rejected}</td>
                          <td style={{ color: partial > 0 ? '#ea580c' : 'inherit' }}>{partial}</td>
                          <td style={{ color: withheld > 0 ? '#d97706' : 'inherit' }}>{withheld}</td>
                          <td style={{ color: icIssued > 0 ? '#16a34a' : 'inherit', fontWeight: '600' }}>{icIssued}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
                        <td className="vendor-cell" style={{ fontWeight: 'bold' }}>{v.name}</td>
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
          <div className="prof-dashboard-wrapper" style={{ marginTop: '-15px', display: 'block', width: '100%', minHeight: 'auto', background: 'transparent' }}>
            <div className="prof-layout-container" style={{ minHeight: 'auto', background: 'transparent' }}>
              <div id="prof-main" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, marginLeft: 0, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>

                {/* GLOBAL PRODUCT SELECTION */}
                <div className="sub-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                  <button className={`sub-tab-btn ${selectedChartsProduct === 'ERC' ? 'active' : ''}`} onClick={() => setSelectedChartsProduct('ERC')}>ERC</button>
                  <button className={`sub-tab-btn ${selectedChartsProduct === 'Sleeper' ? 'active' : ''}`} onClick={() => setSelectedChartsProduct('Sleeper')}>Sleeper</button>
                  <button className={`sub-tab-btn ${selectedChartsProduct === 'Rail Pad' ? 'active' : ''}`} onClick={() => setSelectedChartsProduct('Rail Pad')}>Rail Pad</button>
                </div>

                {/* CONTENT AREA */}
                <div id="prof-content-area" style={{ width: '100%' }}>
                  <ProfessionalCardSection
                    activeMainCard="quality"
                    selectedProduct={selectedChartsProduct}
                    setSelectedProduct={setSelectedChartsProduct}
                    fromDate={chartsFromDate}
                    toDate={chartsToDate}
                    setFromDate={setChartsFromDate}
                    setToDate={setChartsToDate}
                    qualityRejectionData={qQualityRejectionData}
                    manufacturerRejectionData={qManufacturerRejectionData}
                    stepWiseRejectionData={qStepWiseRejectionData}
                    processPerformanceData={qProcessPerformanceData}
                    paretoAnalysisData={qParetoAnalysisData}
                    monthlyRejectionTrendData={qMonthlyRejectionTrendData}
                    inspectionDetailsData={qInspectionDetailsData}
                  />
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 5. SQC Analysis view */}
        {activeTab === 'SQC Analysis' && (
          <div className="prof-dashboard-wrapper" style={{ marginTop: '-15px', display: 'block', width: '100%', minHeight: 'auto', background: 'transparent' }}>
            <div className="prof-layout-container" style={{ minHeight: 'auto', background: 'transparent' }}>
              <div id="prof-main" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, marginLeft: 0, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>

                {/* GLOBAL PRODUCT SELECTION */}
                <div className="sub-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                  <button className={`sub-tab-btn ${selectedSqcProduct === 'ERC' ? 'active' : ''}`} onClick={() => setSelectedSqcProduct('ERC')}>ERC</button>
                  <button className={`sub-tab-btn ${selectedSqcProduct === 'Sleeper' ? 'active' : ''}`} onClick={() => setSelectedSqcProduct('Sleeper')}>Sleeper</button>
                  <button className={`sub-tab-btn ${selectedSqcProduct === 'Rail Pad' ? 'active' : ''}`} onClick={() => setSelectedSqcProduct('Rail Pad')}>Rail Pad</button>
                </div>

                {/* CONTENT AREA */}
                <div id="prof-content-area" style={{ width: '100%' }}>
                  <ProfessionalCardSection
                    activeMainCard="sqc"
                    selectedProduct={selectedSqcProduct}
                    setSelectedProduct={setSelectedSqcProduct}
                  />
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 6. SCADA Monitoring view */}
        {activeTab === 'SCADA Monitoring' && (
          <div className="prof-dashboard-wrapper" style={{ marginTop: '-15px', display: 'block', width: '100%', minHeight: 'auto', background: 'transparent' }}>
            <div className="prof-layout-container" style={{ minHeight: 'auto', background: 'transparent' }}>
              <div id="prof-main" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, marginLeft: 0, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>

                {/* GLOBAL PRODUCT SELECTION */}
                <div className="sub-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                  <button className={`sub-tab-btn ${selectedScadaProduct === 'ERC' ? 'active' : ''}`} onClick={() => setSelectedScadaProduct('ERC')}>ERC</button>
                  <button className={`sub-tab-btn ${selectedScadaProduct === 'Sleeper' ? 'active' : ''}`} onClick={() => setSelectedScadaProduct('Sleeper')}>Sleeper</button>
                  <button className={`sub-tab-btn ${selectedScadaProduct === 'Rail Pad' ? 'active' : ''}`} onClick={() => setSelectedScadaProduct('Rail Pad')}>Rail Pad</button>
                </div>

                {/* CONTENT AREA */}
                <div id="prof-content-area" style={{ width: '100%' }}>
                  <ProfessionalCardSection
                    activeMainCard="scada"
                    selectedProduct={selectedScadaProduct}
                    setSelectedProduct={setSelectedScadaProduct}
                  />
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 7. PO Lifecycle view */}
        {activeTab === 'PO Lifecycle' && (
          <div className="prof-dashboard-wrapper" style={{ marginTop: '-15px', display: 'block', width: '100%', minHeight: 'auto', background: 'transparent' }}>
            <div className="prof-layout-container" style={{ minHeight: 'auto', background: 'transparent' }}>
              <div id="prof-main" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, marginLeft: 0, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>

                {/* GLOBAL PRODUCT SELECTION */}
                <div className="sub-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                  <button className={`sub-tab-btn ${selectedLifecycleProduct === 'ERC' ? 'active' : ''}`} onClick={() => setSelectedLifecycleProduct('ERC')}>ERC</button>
                  <button className={`sub-tab-btn ${selectedLifecycleProduct === 'Sleeper' ? 'active' : ''}`} onClick={() => setSelectedLifecycleProduct('Sleeper')}>Sleeper</button>
                  <button className={`sub-tab-btn ${selectedLifecycleProduct === 'Rail Pad' ? 'active' : ''}`} onClick={() => setSelectedLifecycleProduct('Rail Pad')}>Rail Pad</button>
                </div>

                {/* CONTENT AREA */}
                <div id="prof-content-area" style={{ width: '100%' }}>
                  <ProfessionalCardSection
                    activeMainCard="lifecycle"
                    selectedProduct={selectedLifecycleProduct}
                    poTable={poTable}
                    setSelectedProduct={setSelectedLifecycleProduct}
                  />
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 8. All Reports view */}
        {activeTab === 'All Reports' && (
          <div className="prof-dashboard-wrapper" style={{ marginTop: '-15px', display: 'block', width: '100%', minHeight: 'auto', background: 'transparent' }}>
            <div className="prof-layout-container" style={{ minHeight: 'auto', background: 'transparent' }}>
              <div id="prof-main" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, marginLeft: 0, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>

                {/* GLOBAL PRODUCT SELECTION */}
                <div className="sub-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                  <button className={`sub-tab-btn ${selectedReportProduct === 'ERC' ? 'active' : ''}`} onClick={() => handleProductChange('ERC')}>ERC</button>
                  <button className={`sub-tab-btn ${selectedReportProduct === 'Sleeper' ? 'active' : ''}`} onClick={() => handleProductChange('Sleeper')}>Sleeper</button>
                  <button className={`sub-tab-btn ${selectedReportProduct === 'Rail Pad' ? 'active' : ''}`} onClick={() => handleProductChange('Rail Pad')}>Rail Pad</button>
                </div>

                {/* TOPBAR / FILTERS */}
                {!(REPORT_NAME_TO_SLUG[activeReportTab] === 'swp' && selectedReportProduct === 'ERC') && (
                  <div id="prof-topbar" style={{ borderRadius: '12px', background: '#fff', border: '1px solid #d1fae5', padding: '12px 20px', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534' }}>From</label>
                    <input type="date" value={reportFromDate} onChange={(e) => setReportFromDate(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #d1fae5', borderRadius: '8px', background: '#f0fdf4', fontSize: '12px' }} />
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534' }}>To</label>
                    <input type="date" value={reportToDate} onChange={(e) => setReportToDate(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #d1fae5', borderRadius: '8px', background: '#f0fdf4', fontSize: '12px' }} />

                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534' }}>Zone</label>
                    <select value={selectedReportZone} onChange={(e) => setSelectedReportZone(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #d1fae5', borderRadius: '8px', background: '#f0fdf4', fontSize: '12px' }}>
                      <option value="all">All Zones</option>
                      <option value="Northern Railway">Northern Railway</option>
                      <option value="Western Railway">Western Railway</option>
                    </select>

                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534' }}>RIO</label>
                    <select value={selectedReportRio} onChange={(e) => setSelectedReportRio(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #d1fae5', borderRadius: '8px', background: '#f0fdf4', fontSize: '12px' }}>
                      <option value="all">All RITES RIOs</option>
                      <option value="CRIO">CRIO</option>
                      <option value="NRIO">NRIO</option>
                      <option value="ERIO">ERIO</option>
                      <option value="WRIO">WRIO</option>
                      <option value="SRIO">SRIO</option>
                    </select>

                    <button className="btn-apply" style={{ padding: '6px 15px', background: '#15803d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}><i className="fa-solid fa-magnifying-glass" style={{ marginRight: '4px' }}></i>Apply</button>
                    <button className="btn-reset" onClick={() => {
                      setReportFromDate(`${new Date().getFullYear()}-01-01`);
                      setReportToDate(new Date().toISOString().split('T')[0]);
                      setSelectedReportProduct('ERC'); setSelectedReportZone('all'); setSelectedReportRio('all');
                    }} style={{ padding: '6px 15px', background: '#fff', border: '1px solid #d1fae5', color: '#166534', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Reset</button>
                  </div>
                )}

                {/* REPORT VIEWER CONTENT */}
                <div id="prof-content-area" style={{ width: '100%' }}>
                  <ProfessionalCardSection
                    activeMainCard="reports"
                    selectedProduct={selectedReportProduct}
                    mprData={mprData} mprLoading={mprLoading} mprPagination={mprPagination}
                    mprPage={mprPage} setMprPage={setMprPage}
                    mprRowsPerPage={mprRowsPerPage} setMprRowsPerPage={setMprRowsPerPage}
                    mauData={mauData} mauLoading={mauLoading} mauPagination={mauPagination}
                    mauPage={mauPage} setMauPage={setMauPage}
                    mauRowsPerPage={mauRowsPerPage} setMauRowsPerPage={setMauRowsPerPage}
                    mpiaData={mpiaData} mpiaLoading={mpiaLoading} mpiaPagination={mpiaPagination}
                    mpiaPage={mpiaPage} setMpiaPage={setMpiaPage}
                    mpiaRowsPerPage={mpiaRowsPerPage} setMpiaRowsPerPage={setMpiaRowsPerPage}
                    lwclData={lwclData} lwclLoading={lwclLoading}
                    lwclCallNo={lwclCallNo} setLwclCallNo={setLwclCallNo}
                    lwclLotNo={lwclLotNo} setLwclLotNo={setLwclLotNo}
                    lwclRequestIds={lwclRequestIds} lwclLotNumbers={lwclLotNumbers}
                    lwclManufacturer={lwclManufacturer} setLwclManufacturer={setLwclManufacturer}
                    lwclManufacturersList={lwclManufacturersList}
                    lwclPoNo={lwclPoNo} setLwclPoNo={setLwclPoNo}
                    lwclPoNumbersList={lwclPoNumbersList}
                    level4Data={level4Data} level4Loading={level4Loading}
                    activeReportFromParent={REPORT_NAME_TO_SLUG[activeReportTab]}
                    onReportTabChange={(reportSlug) => {
                      const reportName = Object.keys(REPORT_NAME_TO_SLUG).find(key => REPORT_NAME_TO_SLUG[key] === reportSlug);
                      if (reportName) setActiveReportTab(reportName);
                    }}
                    setSelectedProduct={setSelectedReportProduct}
                    fromDate={reportFromDate}
                    toDate={reportToDate}
                    setFromDate={setReportFromDate}
                    setToDate={setReportToDate}
                  />
                </div>

              </div>
            </div>
          </div>
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

        {/* 10. Process Inspection Manday Calculation view */}
        {activeTab === 'Mandays Calculation' && (
          <>
            <div className="cm-panel-header">
              <div className="cm-panel-title-area">
                <h1 className="cm-panel-title">Process Inspection Manday Calculation</h1>
                <p className="cm-panel-subtitle">Dynamic calculation of IE workdays, shift-wise fractional deployments, and sleeper manpower metrics.</p>
              </div>
            </div>

            {/* Top-level Primary Filters Card */}
            <section className="cm-filters-card" style={{ marginBottom: '20px' }} id="manday-filters-container">
              <div className="cm-filters-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f0fdf4', paddingBottom: '8px' }}>
                <i className="fa-solid fa-calculator" style={{ color: '#166534' }} />
                <span>Primary Filter Criteria</span>
              </div>
              <div className="cm-filters-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', borderTop: 'none', paddingTop: '0', marginTop: '4px' }}>

                {/* Product Dropdown */}
                <div className="cm-filter-group">
                  <label className="cm-filter-label" htmlFor="manday-product-select">Product Type</label>
                  <select
                    id="manday-product-select"
                    value={mandayProduct}
                    className="cm-filter-select"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1fae5', background: '#f0fdf4', borderRadius: '8px', color: '#1a2e1a', fontWeight: '600' }}
                    onChange={(e) => {
                      setMandayProduct(e.target.value);
                      setShowMandayReport(false);
                      // Clear sub-filters when product changes
                      setMandayVendor('');
                      setMandayUnit('');
                      setMandayCallNumber('');
                    }}
                  >
                    <option value="">-- Select Product --</option>
                    <option value="ERC">ERC</option>
                    <option value="Sleeper">Sleeper</option>
                    <option value="Rail Pad">Rail Pad</option>
                  </select>
                </div>

                {/* Calculation Preference Dropdown */}
                <div className="cm-filter-group">
                  <label className="cm-filter-label" htmlFor="manday-pref-select">Calculation Preference</label>
                  <select
                    id="manday-pref-select"
                    value={mandayPreference}
                    className="cm-filter-select"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1fae5', background: '#f0fdf4', borderRadius: '8px', color: '#1a2e1a', fontWeight: '600' }}
                    onChange={(e) => {
                      setMandayPreference(e.target.value);
                      setShowMandayReport(false);
                      // Clear sub-filters when preference changes
                      setMandayVendor('');
                      setMandayUnit('');
                      setMandayCallNumber('');
                    }}
                  >
                    <option value="">-- Select Calculation Preference --</option>
                    <option value="Vendor Wise">Vendor Wise</option>
                    <option value="Call Wise">Call Wise</option>
                  </select>
                </div>

              </div>
            </section>

            {/* Sub-Filters Section - displays once primary filters are chosen */}
            {mandayProduct && mandayPreference && (
              <section className="cm-filters-card" style={{ marginBottom: '20px', borderLeft: '4px solid #16a34a' }} id="manday-subfilters-container">
                <div className="cm-filters-title" style={{ color: '#166534' }}>
                  <i className="fa-solid fa-sliders" />
                  <span>Configure {mandayProduct} ({mandayPreference}) Sub-filters</span>
                </div>

                <div className="cm-filters-grid" style={{ borderTop: '1px solid #f0fdf4', paddingTop: '12px', marginTop: '4px' }}>
                  {mandayPreference === 'Vendor Wise' ? (
                    <>
                      {/* Vendor Selection Dropdown */}
                      <div className="cm-filter-group">
                        <label className="cm-filter-label" htmlFor="manday-vendor-select">Vendor Name</label>
                        <select
                          id="manday-vendor-select"
                          value={mandayVendor}
                          className="cm-filter-select"
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                          onChange={(e) => {
                            setMandayVendor(e.target.value);
                            setMandayUnit(''); // reset unit
                          }}
                        >
                          <option value="">-- Choose Vendor --</option>
                          {MANDAY_VENDORS.map(v => (
                            <option key={v.id} value={v.name}>{v.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Unit Selection Dropdown (dependent on vendor) */}
                      <div className="cm-filter-group">
                        <label className="cm-filter-label" htmlFor="manday-unit-select">Vendor Unit</label>
                        <select
                          id="manday-unit-select"
                          value={mandayUnit}
                          className="cm-filter-select"
                          disabled={!mandayVendor}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', background: mandayVendor ? '#fff' : '#f1f5f9', borderRadius: '6px', cursor: mandayVendor ? 'pointer' : 'not-allowed' }}
                          onChange={(e) => setMandayUnit(e.target.value)}
                        >
                          <option value="">-- Choose Unit --</option>
                          {mandayVendor && MANDAY_UNITS[mandayVendor]?.map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </div>

                      {/* Date Range Fields */}
                      <div className="cm-filter-group">
                        <label className="cm-filter-label" htmlFor="manday-start-date">Start Date</label>
                        <input
                          id="manday-start-date"
                          type="date"
                          value={mandayStartDate}
                          style={{ padding: '7px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                          onChange={(e) => setMandayStartDate(e.target.value)}
                        />
                      </div>

                      <div className="cm-filter-group">
                        <label className="cm-filter-label" htmlFor="manday-end-date">End Date</label>
                        <input
                          id="manday-end-date"
                          type="date"
                          value={mandayEndDate}
                          style={{ padding: '7px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                          onChange={(e) => setMandayEndDate(e.target.value)}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Call Wise - Single text input for Call Number */}
                      <div className="cm-filter-group" style={{ gridColumn: 'span 2' }}>
                        <label className="cm-filter-label" htmlFor="manday-call-input">Call Number</label>
                        <input
                          id="manday-call-input"
                          type="text"
                          placeholder="Enter call number e.g. CALL-2026-101"
                          value={mandayCallNumber}
                          style={{ width: '100%', padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', outline: 'none', fontSize: '13px', letterSpacing: '0.5px' }}
                          onChange={(e) => setMandayCallNumber(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Calculate/Action Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f0fdf4', paddingTop: '12px', marginTop: '8px' }}>
                  <button
                    className="btn btn--primary"
                    id="manday-calc-button"
                    style={{ padding: '10px 24px', background: '#166534', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                    onClick={() => {
                      if (mandayPreference === 'Vendor Wise' && (!mandayVendor || !mandayUnit || !mandayStartDate || !mandayEndDate)) {
                        triggerNotification('Please fill all sub-filters (Vendor, Unit, Date Range) to calculate.', 'warning');
                        return;
                      }
                      if (mandayPreference === 'Call Wise' && !mandayCallNumber) {
                        triggerNotification('Please select or input a Call Reference Number to fetch details.', 'warning');
                        return;
                      }
                      setShowMandayReport(true);
                      triggerNotification(`Successfully loaded process inspection mandays for ${mandayProduct}!`, 'success');
                    }}
                  >
                    <i className="fa-solid fa-calculator" />
                    <span>Calculate Mandays &amp; Generate Sheets</span>
                  </button>
                </div>
              </section>
            )}

            {/* Helper alert shown when filters are selected but report hasn't been loaded yet */}
            {(!mandayProduct || !mandayPreference || !showMandayReport) && (
              <div style={{
                background: '#fff',
                border: '1px dashed #166534',
                borderRadius: '12px',
                padding: '40px 20px',
                textAlign: 'center',
                color: '#4b6b4b',
                boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
              }} id="manday-placeholder-alert">
                <i className="fa-solid fa-calculator" style={{ fontSize: '32px', color: '#166534', marginBottom: '16px', opacity: 0.8 }} />
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#14532d', margin: '0 0 8px 0' }}>Calculation Worksheet Ready</h3>
                <p style={{ margin: 0, fontSize: '12.5px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.5' }}>
                  {!mandayProduct || !mandayPreference
                    ? 'Please select a Product (ERC, Sleeper, Rail Pad) and your desired Calculation Preference in the filter controls above.'
                    : 'Filters have been configured. Click the "Calculate Mandays & Generate Sheets" button to run fractional duty splits and generate the attendance ledger below.'
                  }
                </p>
              </div>
            )}

            {/* Calculated Report Sheets Display */}
            {showMandayReport && mandayProduct && mandayPreference && (
              <section className="cm-list-card" style={{ animation: 'fadeIn 0.4s ease' }} id="manday-report-output">

                {/* Header detailing selection parameters */}
                <div className="cm-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#14532d', margin: 0 }}>
                      📋 Manday Attendance Sheet &amp; Cost Ledger
                    </h3>
                    <div style={{ fontSize: '11.5px', color: '#4b6b4b', marginTop: '4px', fontWeight: '600' }}>
                      Product: <span style={{ color: '#15803d' }}>{mandayProduct}</span> |
                      Preference: <span style={{ color: '#15803d', marginLeft: '4px' }}>{mandayPreference}</span>
                      {mandayPreference === 'Vendor Wise' ? (
                        <>
                          | Vendor: <span style={{ color: '#15803d', marginLeft: '4px' }}>{mandayVendor}</span> |
                          Unit: <span style={{ color: '#15803d', marginLeft: '4px' }}>{mandayUnit}</span> |
                          Period: <span style={{ color: '#15803d', marginLeft: '4px' }}>{mandayStartDate} to {mandayEndDate}</span>
                        </>
                      ) : (
                        <>
                          | Call Ref: <span style={{ color: '#15803d', marginLeft: '4px' }}>{mandayCallNumber}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn btn--outline"
                    style={{ fontSize: '11px', padding: '6px 12px' }}
                    onClick={() => handleDownloadPdf(mandayCallNumber || 'VENDOR_MANDAYS', 'PDF')}
                  >
                    <i className="fa-solid fa-file-pdf" style={{ marginRight: '6px', color: '#b91c1c' }} /> Download Report
                  </button>
                </div>

                {/* COMBINATION 1: ERC - Vendor Wise */}
                {mandayProduct === 'ERC' && mandayPreference === 'Vendor Wise' && (
                  <div className="cm-table-wrapper">
                    <table className="cm-mandays-table">
                      <thead>
                        <tr>
                          <th className="col-sno">S.No.</th>
                          <th className="col-date">Date</th>
                          <th className="col-day">Day</th>
                          <th className="col-number">No. of Shifts worked</th>
                          <th className="col-number">No. of Inspection Calls worked upon</th>
                          <th>IEs Worked (Name &amp; Employee Code)</th>
                          <th className="col-number" style={{ fontWeight: 'bold' }}>No. of Mandays deployed</th>
                          <th className="col-number">Total Pieces Processed (Shearing Production)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="col-sno">1</td>
                          <td className="col-date">2026-05-25</td>
                          <td className="col-day">Monday</td>
                          <td className="col-number">3 Shifts (A, B, C)</td>
                          <td className="col-number">5 Calls</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span>• Rajesh Kumar (IE001)</span>
                              <span>• Priya Sharma (IE002)</span>
                            </div>
                          </td>
                          <td className="col-number" style={{ fontWeight: 'bold', color: '#15803d' }}>2.0 Mandays</td>
                          <td className="col-number" style={{ fontWeight: 'bold' }}>12,500 pcs</td>
                        </tr>
                        <tr>
                          <td className="col-sno">2</td>
                          <td className="col-date">2026-05-26</td>
                          <td className="col-day">Tuesday</td>
                          <td className="col-number">2 Shifts (A, B)</td>
                          <td className="col-number">3 Calls</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span>• Rajesh Kumar (IE001)</span>
                            </div>
                          </td>
                          <td className="col-number" style={{ fontWeight: 'bold', color: '#15803d' }}>1.0 Mandays</td>
                          <td className="col-number" style={{ fontWeight: 'bold' }}>8,200 pcs</td>
                        </tr>
                        <tr>
                          <td className="col-sno">3</td>
                          <td className="col-date">2026-05-27</td>
                          <td className="col-day">Wednesday</td>
                          <td className="col-number">3 Shifts (A, B, C)</td>
                          <td className="col-number">6 Calls</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span>• Priya Sharma (IE002)</span>
                              <span>• Vikram Singh (IE005)</span>
                            </div>
                          </td>
                          <td className="col-number" style={{ fontWeight: 'bold', color: '#15803d' }}>3.0 Mandays</td>
                          <td className="col-number" style={{ fontWeight: 'bold' }}>15,400 pcs</td>
                        </tr>
                        <tr>
                          <td className="col-sno">4</td>
                          <td className="col-date">2026-05-28</td>
                          <td className="col-day">Thursday</td>
                          <td className="col-number">1 Shift (A)</td>
                          <td className="col-number">1 Call</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span>• Amit Patel (IE003)</span>
                            </div>
                          </td>
                          <td className="col-number" style={{ fontWeight: 'bold', color: '#15803d' }}>1.0 Mandays</td>
                          <td className="col-number" style={{ fontWeight: 'bold' }}>4,800 pcs</td>
                        </tr>
                        {/* Summary Row */}
                        <tr style={{ background: '#f0fdf4', fontWeight: 'bold', borderTop: '2px solid #16a34a' }}>
                          <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold', color: '#14532d' }}>Consolidated Totals:</td>
                          <td className="col-number">9 Shifts</td>
                          <td className="col-number">15 Inspection Calls</td>
                          <td>4 Unique Engineers</td>
                          <td className="col-number" style={{ color: '#15803d', fontWeight: '900' }}>7.0 Mandays</td>
                          <td className="col-number" style={{ color: '#15803d', fontWeight: '900' }}>40,900 pieces</td>
                        </tr>
                      </tbody>
                    </table>

                    <div style={{ padding: '16px', background: '#fafafa', borderTop: '1px solid #cbd5e1', fontSize: '11.5px', color: '#4b6b4b' }}>
                      📝 <b>ERC Vendor-Wise Mandays Rule:</b> Count of Unique IE &amp; Shift on that day. Shifts include any log where login and work were successfully recorded (even clicking on "no production" represents recorded work).
                    </div>
                  </div>
                )}

                {/* COMBINATION 2: ERC - Call Wise */}
                {mandayProduct === 'ERC' && mandayPreference === 'Call Wise' && (
                  <div>
                    <div className="cm-table-wrapper">
                      <table className="cm-mandays-table">
                        <thead>
                          <tr>
                            <th className="col-sno">S.No.</th>
                            <th className="col-date">Date</th>
                            <th className="col-day">Day</th>
                            <th className="col-number">No. of Shifts</th>
                            <th style={{ fontWeight: 'bold', background: '#f0fdf4' }}>Mandays deployed in this Call<br /><span style={{ fontWeight: 'normal', fontSize: '10px', opacity: 0.8 }}>(Unique IE-Shift ÷ No. of calls worked in that shift, summed across shifts)</span></th>
                            <th className="col-number">Total Pieces Processed (Shearing Production)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="col-sno">1</td>
                            <td className="col-date">2026-05-27</td>
                            <td className="col-day">Wednesday</td>
                            <td className="col-number">3 (A, B, C)</td>
                            <td style={{ fontWeight: 'bold', color: '#15803d' }}>3.00 Mandays<br /><span style={{ fontWeight: 'normal', fontSize: '10px', color: '#4b6b4b' }}>A: 0.5+1.0 = 1.5 | B: 1.0 | C: 0.5</span></td>
                            <td className="col-number" style={{ fontWeight: 'bold' }}>18,500 pcs</td>
                          </tr>
                          <tr style={{ background: '#f0fdf4', fontWeight: 'bold', borderTop: '1px solid #16a34a' }}>
                            <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold', color: '#14532d' }}>Total Mandays Deployed:</td>
                            <td className="col-number">3 Shifts</td>
                            <td style={{ color: '#15803d', fontWeight: '900' }}>3.00 Mandays</td>
                            <td className="col-number" style={{ color: '#15803d', fontWeight: '900' }}>18,500 pieces</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Highly Professional visual explanation box illustrating the fractional formula */}
                    <div style={{ padding: '20px', background: '#fafafa', borderTop: '1px solid #cbd5e1' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#14532d', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 12px 0' }}>
                        🔍 Shift-wise Fractional Manday Calculations for {mandayCallNumber}
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                          <span style={{ background: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700' }}>Shift A</span>
                          <p style={{ margin: '8px 0 0 0', fontSize: '11px', lineHeight: '1.4', color: '#4b5563' }}>
                            2 IEs logged in and worked:<br />
                            • <b>IE 1</b> worked on Call 1 &amp; 2: <span style={{ color: '#15803d', fontWeight: 'bold' }}>0.5 mandays</span><br />
                            • <b>IE 2</b> worked on Call 1 only: <span style={{ color: '#15803d', fontWeight: 'bold' }}>1.0 mandays</span><br />
                            <b>Shift Total:</b> 0.5 + 1.0 = <span style={{ fontWeight: 'bold' }}>1.50</span>
                          </p>
                        </div>

                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700' }}>Shift B</span>
                          <p style={{ margin: '8px 0 0 0', fontSize: '11px', lineHeight: '1.4', color: '#4b5563' }}>
                            1 IE logged in and worked:<br />
                            • <b>IE 3</b> worked on Call 1 only: <span style={{ color: '#15803d', fontWeight: 'bold' }}>1.0 mandays</span><br />
                            <b>Shift Total:</b> = <span style={{ fontWeight: 'bold' }}>1.00</span>
                          </p>
                        </div>

                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                          <span style={{ background: '#faf5ff', color: '#6b21a8', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700' }}>Shift C</span>
                          <p style={{ margin: '8px 0 0 0', fontSize: '11px', lineHeight: '1.4', color: '#4b5563' }}>
                            1 IE logged in and worked:<br />
                            • <b>IE 4</b> worked on Call 1 &amp; 2: <span style={{ color: '#15803d', fontWeight: 'bold' }}>0.5 mandays</span><br />
                            <b>Shift Total:</b> = <span style={{ fontWeight: 'bold' }}>0.50</span>
                          </p>
                        </div>
                      </div>

                      <div style={{ marginTop: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11.5px', color: '#166534', fontWeight: '600' }}>
                          🧮 <b>Total Deployed Mandays (Sum of Shifts):</b> 1.50 (A) + 1.00 (B) + 0.50 (C)
                        </span>
                        <span style={{ fontSize: '13px', color: '#14532d', fontWeight: '800', background: '#fff', padding: '4px 10px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                          = 3.00 Mandays
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* COMBINATION 3: Sleeper - Vendor Wise */}
                {mandayProduct === 'Sleeper' && mandayPreference === 'Vendor Wise' && (
                  <div className="cm-table-wrapper">
                    <table className="cm-mandays-table">
                      <thead>
                        <tr>
                          <th className="col-sno">S.No.</th>
                          <th className="col-date">Date</th>
                          <th className="col-day">Day</th>
                          <th className="col-number">No. of Shifts active (duty started &amp; completed)</th>
                          <th>IEs Worked (Name &amp; Employee Code)</th>
                          <th className="col-number" style={{ fontWeight: 'bold' }}>No. of Mandays deployed</th>
                          <th className="col-number">No. of Batches produced</th>
                          <th className="col-number">No. of Sleepers Produced</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="col-sno">1</td>
                          <td className="col-date">2026-05-25</td>
                          <td className="col-day">Monday</td>
                          <td className="col-number">2 (Shift A, B)</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span>• Amit Patel (IE003)</span>
                              <span>• Sneha Reddy (IE004)</span>
                            </div>
                          </td>
                          <td className="col-number" style={{ fontWeight: 'bold', color: '#15803d' }}>2.0 Mandays</td>
                          <td className="col-number">4 Batches</td>
                          <td className="col-number" style={{ fontWeight: 'bold' }}>1,600 Sleepers</td>
                        </tr>
                        <tr>
                          <td className="col-sno">2</td>
                          <td className="col-date">2026-05-26</td>
                          <td className="col-day">Tuesday</td>
                          <td className="col-number">3 (Shift A, B, C)</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span>• Amit Patel (IE003)</span>
                              <span>• Vikram Singh (IE005)</span>
                            </div>
                          </td>
                          <td className="col-number" style={{ fontWeight: 'bold', color: '#15803d' }}>3.0 Mandays</td>
                          <td className="col-number">6 Batches</td>
                          <td className="col-number" style={{ fontWeight: 'bold' }}>2,400 Sleepers</td>
                        </tr>
                        <tr>
                          <td className="col-sno">3</td>
                          <td className="col-date">2026-05-27</td>
                          <td className="col-day">Wednesday</td>
                          <td className="col-number">1 (Shift A)</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span>• Sneha Reddy (IE004)</span>
                            </div>
                          </td>
                          <td className="col-number" style={{ fontWeight: 'bold', color: '#15803d' }}>1.0 Mandays</td>
                          <td className="col-number">2 Batches</td>
                          <td className="col-number" style={{ fontWeight: 'bold' }}>800 Sleepers</td>
                        </tr>
                        {/* Summary Row */}
                        <tr style={{ background: '#f0fdf4', fontWeight: 'bold', borderTop: '2px solid #16a34a' }}>
                          <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold', color: '#14532d' }}>Consolidated Totals:</td>
                          <td className="col-number">6 Shifts</td>
                          <td>3 Unique Engineers</td>
                          <td className="col-number" style={{ color: '#15803d', fontWeight: '900' }}>6.0 Mandays</td>
                          <td className="col-number">12 Batches</td>
                          <td className="col-number" style={{ color: '#15803d', fontWeight: '900' }}>4,800 sleepers</td>
                        </tr>
                      </tbody>
                    </table>

                    <div style={{ padding: '16px', background: '#fafafa', borderTop: '1px solid #cbd5e1', fontSize: '11.5px', color: '#4b6b4b' }}>
                      📝 <b>Sleeper Vendor-Wise Mandays Rule:</b> Counts shifts for which duty has been successfully started and completed. Multiple duty starts/logins by the same IE for the same shift are strictly deduplicated and considered as one (1.0).
                    </div>
                  </div>
                )}

                {/* COMBINATION 4: Sleeper - Call Wise */}
                {mandayProduct === 'Sleeper' && mandayPreference === 'Call Wise' && (
                  <div style={{ padding: '20px' }}>

                    {/* Upper metrics row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>

                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '10.5px', color: '#166534', fontWeight: '700', textTransform: 'uppercase' }}>No. of Batches in Call</span>
                        <h4 style={{ fontSize: '22px', fontWeight: '900', color: '#14532d', margin: '4px 0 0 0' }}>5 Batches</h4>
                        <span style={{ fontSize: '10.5px', color: '#4b6b4b' }}>Batches for which call has been raised</span>
                      </div>

                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '10.5px', color: '#166534', fontWeight: '700', textTransform: 'uppercase' }}>No. of Sleepers in Call</span>
                        <h4 style={{ fontSize: '22px', fontWeight: '900', color: '#14532d', margin: '4px 0 0 0' }}>2,000 Sleepers</h4>
                        <span style={{ fontSize: '10.5px', color: '#4b6b4b' }}>Sleepers offered under {mandayCallNumber}</span>
                      </div>

                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569', fontWeight: '700', textTransform: 'uppercase' }}>Casting Months Involved</span>
                        <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: '8px 0 0 0' }}>April 2026, May 2026</h4>
                        <span style={{ fontSize: '10.5px', color: '#64748b' }}>Assigned batches casting month list</span>
                      </div>

                    </div>

                    {/* Casting Month Calculation Ledger Table */}
                    <h4 style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#14532d', margin: '0 0 8px 0' }}>
                      📊 Casting Monthly Manpower Cost Allocation Sheet (Editable Inputs)
                    </h4>

                    <div className="table-responsive" style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                      <table className="cm-mandays-table" style={{ width: '100%' }}>
                        <thead>
                          <tr style={{ background: '#0f172a' }}>
                            <th className="col-date">Casting Month</th>
                            <th className="col-number">Total Sleepers Casted this month (a)</th>
                            <th className="col-number">No. of Mandays Deployed this month (b)</th>
                            <th className="col-number">Manpower Cost per Sleeper (c) = b ÷ a</th>
                            <th className="col-number">Sleepers in this Call belonging to month</th>
                            <th style={{ fontWeight: 'bold' }}>Manpower Cost of Sleepers for batches (d) = c × Sleepers in Call</th>
                          </tr>
                        </thead>
                        <tbody>

                          {/* April 2026 row */}
                          <tr>
                            <td className="col-date" style={{ fontWeight: 'bold' }}>April 2026</td>
                            <td className="col-number">
                              <input
                                type="number"
                                value={sleeperCastApril}
                                style={{ width: '100px', padding: '6px', border: '1px solid #d1fae5', background: '#f0fdf4', borderRadius: '6px', fontWeight: 'bold', outline: 'none', textAlign: 'center' }}
                                onChange={(e) => setSleeperCastApril(Number(e.target.value))}
                              />
                            </td>
                            <td className="col-number">
                              <input
                                type="number"
                                value={sleeperDaysApril}
                                style={{ width: '80px', padding: '6px', border: '1px solid #d1fae5', background: '#f0fdf4', borderRadius: '6px', fontWeight: 'bold', outline: 'none', textAlign: 'center' }}
                                onChange={(e) => setSleeperDaysApril(Number(e.target.value))}
                              />
                            </td>
                            <td className="col-number" style={{ fontWeight: 'bold', color: '#1e40af' }}>
                              {(sleeperCastApril > 0 ? (sleeperDaysApril / sleeperCastApril) : 0).toFixed(4)} mandays/sleeper
                            </td>
                            <td className="col-number" style={{ fontWeight: '600' }}>800 Sleepers</td>
                            <td style={{ fontWeight: 'bold', color: '#15803d' }}>
                              {(sleeperCastApril > 0 ? (sleeperDaysApril / sleeperCastApril) * 800 : 0).toFixed(2)} mandays
                            </td>
                          </tr>

                          {/* May 2026 row */}
                          <tr>
                            <td className="col-date" style={{ fontWeight: 'bold' }}>May 2026</td>
                            <td className="col-number">
                              <input
                                type="number"
                                value={sleeperCastMay}
                                style={{ width: '100px', padding: '6px', border: '1px solid #d1fae5', background: '#f0fdf4', borderRadius: '6px', fontWeight: 'bold', outline: 'none', textAlign: 'center' }}
                                onChange={(e) => setSleeperCastMay(Number(e.target.value))}
                              />
                            </td>
                            <td className="col-number">
                              <input
                                type="number"
                                value={sleeperDaysMay}
                                style={{ width: '80px', padding: '6px', border: '1px solid #d1fae5', background: '#f0fdf4', borderRadius: '6px', fontWeight: 'bold', outline: 'none', textAlign: 'center' }}
                                onChange={(e) => setSleeperDaysMay(Number(e.target.value))}
                              />
                            </td>
                            <td className="col-number" style={{ fontWeight: 'bold', color: '#1e40af' }}>
                              {(sleeperCastMay > 0 ? (sleeperDaysMay / sleeperCastMay) : 0).toFixed(4)} mandays/sleeper
                            </td>
                            <td className="col-number" style={{ fontWeight: '600' }}>1,200 Sleepers</td>
                            <td style={{ fontWeight: 'bold', color: '#15803d' }}>
                              {(sleeperCastMay > 0 ? (sleeperDaysMay / sleeperCastMay) * 1200 : 0).toFixed(2)} mandays
                            </td>
                          </tr>

                          {/* Total Row */}
                          <tr style={{ background: '#f0fdf4', borderTop: '2px solid #15803d', fontWeight: 'bold' }}>
                            <td colSpan="4" style={{ textAlign: 'right', fontWeight: 'bold', color: '#14532d' }}>
                              Total Manpower Cost of All Sleepers Offered (sum of d):
                            </td>
                            <td className="col-number" style={{ fontWeight: 'bold' }}>2,000 Sleepers</td>
                            <td style={{ color: '#166534', fontWeight: '900', background: '#dcfce7' }}>
                              {(
                                (sleeperCastApril > 0 ? (sleeperDaysApril / sleeperCastApril) * 800 : 0) +
                                (sleeperCastMay > 0 ? (sleeperDaysMay / sleeperCastMay) * 1200 : 0)
                              ).toFixed(2)} mandays
                            </td>
                          </tr>

                        </tbody>
                      </table>
                    </div>

                    <div style={{ marginTop: '16px', border: '1px dashed #cbd5e1', background: '#fafafa', padding: '12px', borderRadius: '8px', fontSize: '11.5px', color: '#4b5563', lineHeight: '1.4' }}>
                      💡 <b>How it works:</b> Edit the month's <i>Total Sleepers Casted (a)</i> or <i>No. of Mandays Deployed (b)</i> directly in the table. The casting month ratio (c = a/b) and the allocated manpower cost (d = c * sleepers in call) will instantly recalculate.
                    </div>

                  </div>
                )}

                {/* COMBINATION 5 & 6: Rail Pad - Vendor Wise & Call Wise */}
                {mandayProduct === 'Rail Pad' && (
                  <div className="cm-table-wrapper">
                    {mandayPreference === 'Vendor Wise' ? (
                      <table className="cm-mandays-table">
                        <thead>
                          <tr>
                            <th className="col-sno">S.No.</th>
                            <th className="col-date">Date</th>
                            <th className="col-day">Day</th>
                            <th className="col-number">No. of Shifts worked</th>
                            <th>IEs Worked (Name &amp; Employee Code)</th>
                            <th className="col-number" style={{ fontWeight: 'bold' }}>No. of Mandays deployed</th>
                            <th className="col-number">Total Rubber Pads Inspected</th>
                            <th className="col-number">Pads Passed</th>
                            <th className="col-number">Pads Rejected</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="col-sno">1</td>
                            <td className="col-date">2026-05-25</td>
                            <td className="col-day">Monday</td>
                            <td className="col-number">2 Shifts</td>
                            <td>• Priya Sharma (IE002)</td>
                            <td className="col-number" style={{ fontWeight: 'bold', color: '#15803d' }}>1.0 Manday</td>
                            <td className="col-number" style={{ fontWeight: 'bold' }}>18,000 pads</td>
                            <td className="col-number" style={{ color: '#15803d', fontWeight: 'bold' }}>17,600 pads</td>
                            <td className="col-number" style={{ color: '#ef4444', fontWeight: 'bold' }}>400 pads (2.2%)</td>
                          </tr>
                          <tr>
                            <td className="col-sno">2</td>
                            <td className="col-date">2026-05-26</td>
                            <td className="col-day">Tuesday</td>
                            <td className="col-number">2 Shifts</td>
                            <td>• Sneha Reddy (IE004)</td>
                            <td className="col-number" style={{ fontWeight: 'bold', color: '#15803d' }}>1.0 Manday</td>
                            <td className="col-number" style={{ fontWeight: 'bold' }}>15,000 pads</td>
                            <td className="col-number" style={{ color: '#15803d', fontWeight: 'bold' }}>14,750 pads</td>
                            <td className="col-number" style={{ color: '#ef4444', fontWeight: 'bold' }}>250 pads (1.7%)</td>
                          </tr>
                          {/* Summary Row */}
                          <tr style={{ background: '#f0fdf4', fontWeight: 'bold', borderTop: '2px solid #16a34a' }}>
                            <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold', color: '#14532d' }}>Consolidated Totals:</td>
                            <td className="col-number">4 Shifts</td>
                            <td>2 Unique Engineers</td>
                            <td className="col-number" style={{ color: '#15803d', fontWeight: '900' }}>2.0 Mandays</td>
                            <td className="col-number" style={{ color: '#15803d', fontWeight: '900' }}>33,000 pads</td>
                            <td className="col-number" style={{ color: '#15803d', fontWeight: '900' }}>32,350 pads</td>
                            <td className="col-number" style={{ color: '#ef4444', fontWeight: '900' }}>650 pads (1.9%)</td>
                          </tr>
                        </tbody>
                      </table>
                    ) : (
                      <table className="cm-mandays-table">
                        <thead>
                          <tr>
                            <th className="col-sno">S.No.</th>
                            <th className="col-date">Date</th>
                            <th className="col-day">Day</th>
                            <th className="col-number">No. of Shifts active</th>
                            <th className="col-number" style={{ fontWeight: 'bold' }}>Mandays deployed in this Call</th>
                            <th className="col-number">Total Rubber Pads Inspected</th>
                            <th>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="col-sno">1</td>
                            <td className="col-date">2026-05-26</td>
                            <td className="col-day">Tuesday</td>
                            <td className="col-number">1 Shift</td>
                            <td className="col-number" style={{ fontWeight: 'bold', color: '#15803d' }}>1.00 Mandays</td>
                            <td className="col-number" style={{ fontWeight: 'bold' }}>15,000 pads</td>
                            <td>Completed Visual inspection successfully.</td>
                          </tr>
                          <tr style={{ background: '#f0fdf4', fontWeight: 'bold', borderTop: '1px solid #16a34a' }}>
                            <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold', color: '#14532d' }}>Total Mandays Deployed:</td>
                            <td className="col-number">1 Shift</td>
                            <td className="col-number" style={{ color: '#15803d', fontWeight: '900' }}>1.00 Mandays</td>
                            <td className="col-number" style={{ color: '#15803d', fontWeight: '900' }}>15,000 pads</td>
                            <td>IC Certificate Issued.</td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

              </section>
            )}
          </>
        )}

        {/* 10.1 IE Billing Sheet view */}
        {activeTab === 'Billing Sheet' && (
          <>
            <div className="cm-panel-header">
              <div className="cm-panel-title-area">
                <h1 className="cm-panel-title">Inspection Engineers Billing Sheet</h1>
                <p className="cm-panel-subtitle">Manage base workdays, travel logs, day rates, and dispatch consolidated billing amounts for assigned IEs.</p>
              </div>
            </div>

            <section className="cm-list-card" style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', border: '1px dashed #ea580c', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)' }} id="billing-under-dev-container">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', justifyContent: 'center' }}>
                <i className="fa-solid fa-person-digging" style={{ fontSize: '48px', color: '#ea580c' }} />
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#9a3412', margin: '0 0 8px 0' }}>Billing Sheet Under Development</h3>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#7c2d12', maxWidth: '520px', lineHeight: '1.6', marginLeft: 'auto', marginRight: 'auto' }}>
                    This module is currently being configured with the core RITES billing ledger and payment gateway service. Dynamic travel vouchers, daily base rates, and automatic payment dispatch metrics will be active in the next release.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* 11. Verification / Notification & Approval view */}
        {activeTab === 'Notification & Approval' && (
          <>
            <div className="cm-panel-header">
              <div className="cm-panel-title-area">
                <h1 className="cm-panel-title">Notification &amp; Approval</h1>
                <p className="cm-panel-subtitle">Escalate, review, validate, approve, or reject special inspection engineering triggers.</p>
              </div>
            </div>

            <section className="cm-list-card" style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', border: '1px dashed #ea580c', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)' }} id="approval-under-dev-container">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', justifyContent: 'center' }}>
                <i className="fa-solid fa-person-digging" style={{ fontSize: '48px', color: '#ea580c' }} />
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#9a3412', margin: '0 0 8px 0' }}>Notification &amp; Approval Under Development</h3>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#7c2d12', maxWidth: '520px', lineHeight: '1.6', marginLeft: 'auto', marginRight: 'auto' }}>
                    This module is currently being configured with the RITES approval workflow engine and notification dispatch services. Escalation chains, approval thresholds, and audit trail logging will be active in the next release.
                  </p>
                </div>
              </div>
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

      {/* Drill-down Call Details Modal */}
      {callPopupData && (
        <div className="cm-modal-overlay" onClick={() => setCallPopupData(null)}>
          <div
            className="cm-modal cm-modal-wide"
            style={{ maxWidth: '900px', width: '95%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px' }}>
              <div className="cm-modal-title" style={{ fontSize: '15px', fontWeight: 'bold', color: '#14532d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-list-check" style={{ color: '#166534' }}></i>
                <span>{callPopupData.type} Call Details for {callPopupData.ieName} ({callPopupData.calls.length})</span>
              </div>
              <button
                onClick={() => setCallPopupData(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '24px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s', padding: '0 4px', lineHieght: 1 }}
              >
                &times;
              </button>
            </div>

            <div className="cm-modal-content" style={{ marginTop: '16px' }}>
              <div className="cm-table-wrapper" style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                <table className="cm-table cm-table-centered" style={{ minWidth: '800px' }}>
                  <thead>
                    <tr style={{ background: '#1e3a8a' }}>
                      <th style={{ background: '#1e3a8a', color: '#fff', padding: '10px 8px', fontWeight: 'bold', fontSize: '12px', border: '1px solid #cbd5e1' }}>Call Number</th>
                      <th style={{ background: '#1e3a8a', color: '#fff', padding: '10px 8px', fontWeight: 'bold', fontSize: '12px', border: '1px solid #cbd5e1' }}>Vendor Name</th>
                      <th style={{ background: '#1e3a8a', color: '#fff', padding: '10px 8px', fontWeight: 'bold', fontSize: '12px', border: '1px solid #cbd5e1' }}>PO Number</th>
                      <th style={{ background: '#1e3a8a', color: '#fff', padding: '10px 8px', fontWeight: 'bold', fontSize: '12px', border: '1px solid #cbd5e1' }}>Desired Inspection Date</th>
                      <th style={{ background: '#1e3a8a', color: '#fff', padding: '10px 8px', fontWeight: 'bold', fontSize: '12px', border: '1px solid #cbd5e1' }}>Call Date</th>
                      <th style={{ background: '#1e3a8a', color: '#fff', padding: '10px 8px', fontWeight: 'bold', fontSize: '12px', border: '1px solid #cbd5e1' }}>Inspection Start Date</th>
                      <th style={{ background: '#1e3a8a', color: '#fff', padding: '10px 8px', fontWeight: 'bold', fontSize: '12px', border: '1px solid #cbd5e1' }}>Inspection Completion Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {callPopupData.calls.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '13px' }}>
                          No calls available in this category.
                        </td>
                      </tr>
                    ) : (
                      callPopupData.calls.map(call => (
                        <tr key={call.id}>
                          <td style={{ fontWeight: 'bold', color: '#0f172a', border: '1px solid #cbd5e1' }}>{call.callNumber}</td>
                          <td className="vendor-cell" style={{ border: '1px solid #cbd5e1' }}>{call.vendorName}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '11px', color: '#475569', border: '1px solid #cbd5e1' }}>{call.poNumber}</td>
                          <td style={{ fontWeight: '500', border: '1px solid #cbd5e1' }}>{call.desiredInspectionDate ? formatDate(call.desiredInspectionDate) : ''}</td>
                          <td style={{ border: '1px solid #cbd5e1' }}>{call.callDate ? formatDate(call.callDate) : ''}</td>
                          <td style={{ fontWeight: '500', color: call.inspectionStartDate ? '#166534' : 'inherit', border: '1px solid #cbd5e1' }}>
                            {call.inspectionStartDate ? formatDate(call.inspectionStartDate) : ''}
                          </td>
                          <td style={{ fontWeight: '500', color: call.inspectionCompletionDate ? '#166534' : 'inherit', border: '1px solid #cbd5e1' }}>
                            {call.inspectionCompletionDate ? formatDate(call.inspectionCompletionDate) : ''}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="cm-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #f0fdf4', paddingTop: '16px' }}>
              <button
                className="btn btn--primary"
                style={{ padding: '8px 20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px' }}
                onClick={() => setCallPopupData(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CMDashboardPage;

// Helper: map product tab name to database item_cat_descr value
const PRODUCT_TO_ITEM_CAT = {
  'ERC': 'Elastic Rail Clips',
  'Sleeper': 'PSC Mainline Sleeper',
  'Rail Pad': 'Rail Pads',
};

// Helper function to filter records by the correct item category for the selected product
const getFilteredRecordsByProduct = (data, product) => {
  if (!data || !Array.isArray(data)) return [];
  const category = PRODUCT_TO_ITEM_CAT[product] || 'Elastic Rail Clips';
  return data.filter(po => po.itemCatDescr === category);
};
