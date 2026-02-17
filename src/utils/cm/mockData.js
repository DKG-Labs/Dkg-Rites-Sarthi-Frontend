/**
 * CM Module Mock Data
 */

import { CALL_STATUS, APPROVAL_TYPE, ALERT_PRIORITY, PRODUCT_TYPES, INSPECTION_STAGES } from './constants';

// Mock Inspection Engineers
export const MOCK_IES = [
  { id: 'IE001', employeeId: 'IE001', name: 'Rajesh Kumar', workload: 85, assignedCalls: 12, pendingInspections: 5, underInspection: 3, icPending: 2, completedThisMonth: 8, workloadStatus: 'High' },
  { id: 'IE002', employeeId: 'IE002', name: 'Priya Sharma', workload: 65, assignedCalls: 8, pendingInspections: 3, underInspection: 2, icPending: 1, completedThisMonth: 6, workloadStatus: 'Normal' },
  { id: 'IE003', employeeId: 'IE003', name: 'Amit Patel', workload: 92, assignedCalls: 15, pendingInspections: 7, underInspection: 4, icPending: 3, completedThisMonth: 10, workloadStatus: 'Overloaded' },
  { id: 'IE004', employeeId: 'IE004', name: 'Sneha Reddy', workload: 45, assignedCalls: 5, pendingInspections: 2, underInspection: 1, icPending: 0, completedThisMonth: 4, workloadStatus: 'Normal' },
  { id: 'IE005', employeeId: 'IE005', name: 'Vikram Singh', workload: 78, assignedCalls: 10, pendingInspections: 4, underInspection: 3, icPending: 2, completedThisMonth: 7, workloadStatus: 'High' }
];

// Mock Vendors
export const MOCK_VENDORS = [
  { id: 'V001', name: 'Global Materials Corp', location: 'Mumbai', rating: 4.5 },
  { id: 'V002', name: 'Premium Materials Inc', location: 'Delhi', rating: 4.2 },
  { id: 'V003', name: 'Steel Industries Ltd', location: 'Bangalore', rating: 3.8 },
  { id: 'V004', name: 'Quality Forge Pvt Ltd', location: 'Chennai', rating: 4.7 },
  { id: 'V005', name: 'Precision Engineering Co', location: 'Pune', rating: 4.0 }
];

// Mock Inspection Calls
export const MOCK_INSPECTION_CALLS = [
  {
    id: 'CALL-2025-001',
    callNumber: 'CALL-2025-001',
    ie: MOCK_IES[0],
    vendor: MOCK_VENDORS[0],
    product: PRODUCT_TYPES.ERC,
    stage: INSPECTION_STAGES.RAW_MATERIAL,
    status: CALL_STATUS.UNDER_INSPECTION,
    scheduledDate: '2025-01-15',
    desiredInspectionDate: '2025-01-10',
    inspectionInitiationDate: '2025-01-15',
    inspectionCompletionDate: null,
    icIssuanceDate: null,
    billingDate: null,
    rescheduleCount: 1,
    slaBreached: false,
    daysPending: 5
  },
  {
    id: 'CALL-2025-002',
    callNumber: 'CALL-2025-002',
    ie: MOCK_IES[1],
    vendor: MOCK_VENDORS[1],
    product: PRODUCT_TYPES.SLEEPER,
    stage: INSPECTION_STAGES.PROCESS,
    status: CALL_STATUS.IC_PENDING,
    scheduledDate: '2025-01-08',
    desiredInspectionDate: null,
    inspectionInitiationDate: '2025-01-08',
    inspectionCompletionDate: '2025-01-10',
    icIssuanceDate: null,
    billingDate: null,
    rescheduleCount: 0,
    slaBreached: true,
    daysPending: 12
  },
  {
    id: 'CALL-2025-003',
    callNumber: 'CALL-2025-003',
    ie: MOCK_IES[2],
    vendor: MOCK_VENDORS[2],
    product: PRODUCT_TYPES.GRSP,
    stage: INSPECTION_STAGES.FINAL,
    status: CALL_STATUS.ASSIGNED,
    scheduledDate: '2025-01-25',
    desiredInspectionDate: '2025-01-20',
    inspectionInitiationDate: null,
    inspectionCompletionDate: null,
    icIssuanceDate: null,
    billingDate: null,
    rescheduleCount: 2,
    slaBreached: false,
    daysPending: 0
  },
  {
    id: 'CALL-2025-004',
    callNumber: 'CALL-2025-004',
    ie: MOCK_IES[3],
    vendor: MOCK_VENDORS[3],
    product: PRODUCT_TYPES.ERC,
    stage: INSPECTION_STAGES.RAW_MATERIAL,
    status: CALL_STATUS.BILLING_PENDING,
    scheduledDate: '2024-12-25',
    desiredInspectionDate: '2024-12-20',
    inspectionInitiationDate: '2024-12-25',
    inspectionCompletionDate: '2024-12-27',
    icIssuanceDate: '2024-12-28',
    billingDate: null,
    rescheduleCount: 0,
    slaBreached: false,
    daysPending: 0
  },
  {
    id: 'CALL-2025-005',
    callNumber: 'CALL-2025-005',
    ie: MOCK_IES[4],
    vendor: MOCK_VENDORS[4],
    product: PRODUCT_TYPES.SLEEPER,
    stage: INSPECTION_STAGES.PROCESS,
    status: CALL_STATUS.SCHEDULED,
    scheduledDate: '2025-01-25',
    desiredInspectionDate: null,
    inspectionInitiationDate: null,
    inspectionCompletionDate: null,
    icIssuanceDate: null,
    billingDate: null,
    rescheduleCount: 0,
    slaBreached: false,
    daysPending: 3
  },
  {
    id: 'CALL-2025-006',
    callNumber: 'CALL-2025-006',
    ie: MOCK_IES[0],
    vendor: MOCK_VENDORS[0],
    product: PRODUCT_TYPES.GRSP,
    stage: INSPECTION_STAGES.FINAL,
    status: CALL_STATUS.DISPOSED,
    scheduledDate: '2024-11-15',
    desiredInspectionDate: '2024-11-10',
    inspectionInitiationDate: '2024-11-15',
    inspectionCompletionDate: '2024-11-18',
    icIssuanceDate: '2024-11-20',
    billingDate: '2024-11-25',
    rescheduleCount: 1,
    slaBreached: false,
    daysPending: 0
  },
  {
    id: 'CALL-2025-007',
    callNumber: 'CALL-2025-007',
    ie: MOCK_IES[1],
    vendor: MOCK_VENDORS[1],
    product: PRODUCT_TYPES.ERC,
    stage: INSPECTION_STAGES.RAW_MATERIAL,
    status: CALL_STATUS.PAYMENT_PENDING,
    scheduledDate: '2024-12-20',
    desiredInspectionDate: '2024-12-15',
    inspectionInitiationDate: '2024-12-20',
    inspectionCompletionDate: '2024-12-22',
    icIssuanceDate: '2024-12-23',
    billingDate: '2024-12-28',
    rescheduleCount: 0,
    slaBreached: false,
    daysPending: 0
  },
  {
    id: 'CALL-2025-008',
    callNumber: 'CALL-2025-008',
    ie: MOCK_IES[2],
    vendor: MOCK_VENDORS[2],
    product: PRODUCT_TYPES.SLEEPER,
    stage: INSPECTION_STAGES.PROCESS,
    status: CALL_STATUS.UNDER_INSPECTION,
    scheduledDate: '2025-01-18',
    desiredInspectionDate: null,
    inspectionInitiationDate: '2025-01-18',
    inspectionCompletionDate: null,
    icIssuanceDate: null,
    billingDate: null,
    rescheduleCount: 0,
    slaBreached: true,
    daysPending: 7
  }
];

// Mock Approval Requests
export const MOCK_APPROVALS = [
  { id: 'APR-001', callNumber: 'CALL-2025-002', type: APPROVAL_TYPE.QUANTITY_ENHANCEMENT, ie: MOCK_IES[1], vendor: MOCK_VENDORS[1], product: `${PRODUCT_TYPES.SLEEPER} - ${INSPECTION_STAGES.PROCESS}`, requestedDate: '2025-01-20', status: 'pending', priority: ALERT_PRIORITY.HIGH },
  { id: 'APR-002', callNumber: 'CALL-2025-003', type: APPROVAL_TYPE.RESCHEDULING, ie: MOCK_IES[2], vendor: MOCK_VENDORS[2], product: `${PRODUCT_TYPES.GRSP} - ${INSPECTION_STAGES.FINAL}`, requestedDate: '2025-01-21', status: 'pending', priority: ALERT_PRIORITY.MEDIUM },
  { id: 'APR-003', callNumber: 'CALL-2025-001', type: APPROVAL_TYPE.DISCREPANCY, ie: MOCK_IES[0], vendor: MOCK_VENDORS[0], product: `${PRODUCT_TYPES.ERC} - ${INSPECTION_STAGES.RAW_MATERIAL}`, requestedDate: '2025-01-22', status: 'pending', priority: ALERT_PRIORITY.LOW },
  { id: 'APR-004', callNumber: 'CALL-2025-005', type: APPROVAL_TYPE.WITHHOLDING, ie: MOCK_IES[4], vendor: MOCK_VENDORS[4], product: `${PRODUCT_TYPES.SLEEPER} - ${INSPECTION_STAGES.PROCESS}`, requestedDate: '2025-01-23', status: 'pending', priority: ALERT_PRIORITY.CRITICAL },
  { id: 'APR-005', callNumber: 'CALL-2025-006', type: APPROVAL_TYPE.QUANTITY_ENHANCEMENT, ie: MOCK_IES[3], vendor: MOCK_VENDORS[3], product: `${PRODUCT_TYPES.ERC} - ${INSPECTION_STAGES.FINAL}`, requestedDate: '2025-01-18', status: 'pending', priority: ALERT_PRIORITY.HIGH },
  { id: 'APR-006', callNumber: 'CALL-2025-007', type: APPROVAL_TYPE.RESCHEDULING, ie: MOCK_IES[0], vendor: MOCK_VENDORS[0], product: `${PRODUCT_TYPES.GRSP} - ${INSPECTION_STAGES.RAW_MATERIAL}`, requestedDate: '2025-01-19', status: 'pending', priority: ALERT_PRIORITY.LOW },
  { id: 'APR-007', callNumber: 'CALL-2025-008', type: APPROVAL_TYPE.DISCREPANCY, ie: MOCK_IES[1], vendor: MOCK_VENDORS[2], product: `${PRODUCT_TYPES.SLEEPER} - ${INSPECTION_STAGES.FINAL}`, requestedDate: '2025-01-24', status: 'pending', priority: ALERT_PRIORITY.MEDIUM },
  { id: 'APR-008', callNumber: 'CALL-2025-009', type: APPROVAL_TYPE.WITHHOLDING, ie: MOCK_IES[2], vendor: MOCK_VENDORS[1], product: `${PRODUCT_TYPES.ERC} - ${INSPECTION_STAGES.PROCESS}`, requestedDate: '2025-01-17', status: 'pending', priority: ALERT_PRIORITY.CRITICAL },
  { id: 'APR-009', callNumber: 'CALL-2025-010', type: APPROVAL_TYPE.QUANTITY_ENHANCEMENT, ie: MOCK_IES[4], vendor: MOCK_VENDORS[4], product: `${PRODUCT_TYPES.GRSP} - ${INSPECTION_STAGES.RAW_MATERIAL}`, requestedDate: '2025-01-25', status: 'pending', priority: ALERT_PRIORITY.MEDIUM },
  { id: 'APR-010', callNumber: 'CALL-2025-011', type: APPROVAL_TYPE.RESCHEDULING, ie: MOCK_IES[3], vendor: MOCK_VENDORS[3], product: `${PRODUCT_TYPES.SLEEPER} - ${INSPECTION_STAGES.RAW_MATERIAL}`, requestedDate: '2025-01-16', status: 'pending', priority: ALERT_PRIORITY.HIGH }
];

// Mock Dashboard KPIs
export const MOCK_DASHBOARD_KPIS = {
  totalCalls: 125,
  pendingInspections: 28,
  underInspection: 12,
  pendingICs: 8,
  callsUnderBilling: 15,
  callsPendingPayment: 18,
  callsDisposedThisMonth: 45,
  pendingApprovals: 10,
  slaBreachedCalls: 3,
  ieWorkloadAverage: 73,
  slaComplianceRate: 92,
  avgICIssuanceTime: 2.5,
  avgApprovalTime: 18,
  ieUtilizationRate: 73,
  vendorRejectionRate: 8,
  reschedulingRate: 12,
  overloadedIEs: 1
};

// Mock IE Performance Data
export const MOCK_IE_PERFORMANCE = MOCK_IES.map(ie => ({
  ie: ie,
  callsAssigned: Math.floor(Math.random() * 50) + 20,
  callsDisposed: Math.floor(Math.random() * 40) + 15,
  pendingInspections: Math.floor(Math.random() * 10) + 1,
  icPending: Math.floor(Math.random() * 5),
  slaCompliance: Math.floor(Math.random() * 20) + 80,
  avgResponseTime: Math.floor(Math.random() * 24) + 6
}));

