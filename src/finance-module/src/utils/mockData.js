/**
 * Finance Module Mock Data
 * Comprehensive mock data for all Finance Dashboard sections
 */

import { PAYMENT_STATUS, BILL_STATUS, PAYMENT_TYPES, PRODUCT_TYPES, INSPECTION_STAGES } from './constants';

// Mock Vendors
export const MOCK_VENDORS = [
  { id: 'V001', name: 'ABC Steel Industries', code: 'ABC-001' },
  { id: 'V002', name: 'XYZ Manufacturing Ltd', code: 'XYZ-002' },
  { id: 'V003', name: 'PQR Engineering Works', code: 'PQR-003' },
  { id: 'V004', name: 'LMN Fabricators Pvt Ltd', code: 'LMN-004' },
  { id: 'V005', name: 'RST Industries', code: 'RST-005' }
];

// Mock Dashboard KPIs
export const MOCK_DASHBOARD_KPIS = {
  pendingFinanceApproval: {
    count: 9,
    amount: 1025000, // 3 Advance (580k) + 3 Cancellation (75k) + 3 Rejection (115k) = 770k + returned/resubmitted (255k)
    slaBreached: 1
  },
  pendingBilling: {
    count: 8,
    amount: 1850000,
    underSuspense: 2
  },
  billsGenerated: {
    count: 15,
    amount: 3750000,
    paymentPending: 15
  },
  billsCleared: {
    count: 45,
    amount: 12500000,
    thisMonth: 8
  },
  totalRevenue: {
    amount: 20550000,
    thisMonth: 4250000,
    growth: 12.5
  }
};

// Section 1: Vendor Payments - Pending Finance Approval
export const MOCK_PENDING_PAYMENTS = [
  // ADVANCE_PAYMENT samples (3 payments)
  {
    id: 'PAY-001',
    callNumber: 'CALL-2025-001',
    vendor: { id: 'V001', name: 'ABC Steel Industries' },
    poNumber: 'PO-2024-1001',
    productType: PRODUCT_TYPES.ERC,
    stage: INSPECTION_STAGES.FINAL,
    paymentType: PAYMENT_TYPES.ADVANCE_PAYMENT,
    amount: 250000,
    submissionDate: '2025-01-20T10:30:00',
    submittedBy: 'IE - Rajesh Kumar',
    paymentStatus: PAYMENT_STATUS.PAYMENT_SUBMITTED,
    remarks: 'Advance payment request - 40% of total contract value for upcoming final inspection',
    documents: ['advance_request.pdf', 'contract_copy.pdf', 'po_copy.pdf'],
    slaBreached: false
  },
  {
    id: 'PAY-002',
    callNumber: 'CALL-2025-002',
    vendor: { id: 'V005', name: 'RST Industries' },
    poNumber: 'PO-2024-1002',
    productType: PRODUCT_TYPES.SLEEPER,
    stage: INSPECTION_STAGES.RAW_MATERIAL,
    paymentType: PAYMENT_TYPES.ADVANCE_PAYMENT,
    amount: 180000,
    submissionDate: '2025-01-21T14:15:00',
    submittedBy: 'IE - Vikram Singh',
    paymentStatus: PAYMENT_STATUS.PAYMENT_SUBMITTED,
    remarks: 'Advance payment for raw material inspection - 35% of estimated charges',
    documents: ['advance_request.pdf', 'contract_agreement.pdf'],
    slaBreached: false
  },
  {
    id: 'PAY-003',
    callNumber: 'CALL-2025-003',
    vendor: { id: 'V003', name: 'PQR Engineering Works' },
    poNumber: 'PO-2024-1003',
    productType: PRODUCT_TYPES.GRSP,
    stage: INSPECTION_STAGES.PROCESS,
    paymentType: PAYMENT_TYPES.ADVANCE_PAYMENT,
    amount: 150000,
    submissionDate: '2025-01-15T09:00:00',
    submittedBy: 'IE - Amit Patel',
    paymentStatus: PAYMENT_STATUS.RETURNED,
    remarks: 'Advance payment request - documentation incomplete',
    returnReason: 'Contract copy missing. Please attach signed contract agreement and resubmit.',
    returnedBy: 'Finance - Suresh Menon',
    returnedDate: '2025-01-17T11:30:00',
    documents: ['advance_request.pdf'],
    slaBreached: false
  },

  // CALL_CANCELLATION_CHARGES samples (3 payments)
  {
    id: 'PAY-004',
    callNumber: 'CALL-2025-004',
    vendor: { id: 'V002', name: 'XYZ Manufacturing Ltd' },
    poNumber: 'PO-2024-1004',
    productType: PRODUCT_TYPES.ERC,
    stage: INSPECTION_STAGES.FINAL,
    paymentType: PAYMENT_TYPES.CALL_CANCELLATION_CHARGES,
    amount: 28000,
    submissionDate: '2025-01-19T11:30:00',
    submittedBy: 'IE - Priya Sharma',
    paymentStatus: PAYMENT_STATUS.RETURNED,
    remarks: 'Call cancellation charges - vendor cancelled after IE assignment',
    returnReason: 'Charge calculation incorrect. Please revise as per contract clause 5.2 and resubmit.',
    returnedBy: 'Finance - Suresh Menon',
    returnedDate: '2025-01-21T10:00:00',
    documents: ['cancellation_notice.pdf', 'charge_calculation.pdf'],
    slaBreached: true
  },
  {
    id: 'PAY-005',
    callNumber: 'CALL-2025-005',
    vendor: { id: 'V004', name: 'LMN Fabricators Pvt Ltd' },
    poNumber: 'PO-2024-1005',
    productType: PRODUCT_TYPES.SLEEPER,
    stage: INSPECTION_STAGES.RAW_MATERIAL,
    paymentType: PAYMENT_TYPES.CALL_CANCELLATION_CHARGES,
    amount: 22000,
    submissionDate: '2025-01-23T13:45:00',
    submittedBy: 'IE - Neha Gupta',
    paymentStatus: PAYMENT_STATUS.RESUBMITTED,
    remarks: 'Resubmitted with corrected charge calculation - late cancellation by vendor',
    originalSubmissionDate: '2025-01-18T10:00:00',
    documents: ['cancellation_notice.pdf', 'charge_calculation_revised.pdf', 'expense_breakdown.pdf'],
    slaBreached: false
  },
  {
    id: 'PAY-006',
    callNumber: 'CALL-2025-006',
    vendor: { id: 'V001', name: 'ABC Steel Industries' },
    poNumber: 'PO-2024-1006',
    productType: PRODUCT_TYPES.GRSP,
    stage: INSPECTION_STAGES.PROCESS,
    paymentType: PAYMENT_TYPES.CALL_CANCELLATION_CHARGES,
    amount: 25000,
    submissionDate: '2025-01-22T15:30:00',
    submittedBy: 'IE - Rajesh Kumar',
    paymentStatus: PAYMENT_STATUS.RESUBMITTED,
    remarks: 'Resubmitted - call cancelled less than 24 hours before scheduled inspection',
    originalSubmissionDate: '2025-01-16T14:00:00',
    documents: ['cancellation_notice.pdf', 'charge_invoice_revised.pdf', 'travel_expenses.pdf'],
    slaBreached: false
  },

  // CALL_REJECTION_CHARGES samples (3 payments)
  {
    id: 'PAY-007',
    callNumber: 'CALL-2025-007',
    vendor: { id: 'V003', name: 'PQR Engineering Works' },
    poNumber: 'PO-2024-1007',
    productType: PRODUCT_TYPES.ERC,
    stage: INSPECTION_STAGES.FINAL,
    paymentType: PAYMENT_TYPES.CALL_REJECTION_CHARGES,
    amount: 45000,
    submissionDate: '2025-01-20T11:15:00',
    submittedBy: 'IE - Amit Patel',
    paymentStatus: PAYMENT_STATUS.PENDING_FINANCE_APPROVAL,
    remarks: 'Material rejected during final inspection - charges for additional visits and re-inspection',
    documents: ['rejection_report.pdf', 'charge_invoice.pdf', 'visit_log.pdf'],
    slaBreached: false
  },
  {
    id: 'PAY-008',
    callNumber: 'CALL-2025-008',
    vendor: { id: 'V005', name: 'RST Industries' },
    poNumber: 'PO-2024-1008',
    productType: PRODUCT_TYPES.SLEEPER,
    stage: INSPECTION_STAGES.PROCESS,
    paymentType: PAYMENT_TYPES.CALL_REJECTION_CHARGES,
    amount: 38000,
    submissionDate: '2025-01-24T09:30:00',
    submittedBy: 'IE - Vikram Singh',
    paymentStatus: PAYMENT_STATUS.PENDING_FINANCE_APPROVAL,
    remarks: 'Multiple rejections during process inspection - charges for three additional visits',
    documents: ['rejection_report.pdf', 'visit_log.pdf', 'charge_breakdown.pdf'],
    slaBreached: false
  },
  {
    id: 'PAY-009',
    callNumber: 'CALL-2025-009',
    vendor: { id: 'V002', name: 'XYZ Manufacturing Ltd' },
    poNumber: 'PO-2024-1009',
    productType: PRODUCT_TYPES.GRSP,
    stage: INSPECTION_STAGES.RAW_MATERIAL,
    paymentType: PAYMENT_TYPES.CALL_REJECTION_CHARGES,
    amount: 32000,
    submissionDate: '2025-01-22T14:00:00',
    submittedBy: 'IE - Priya Sharma',
    paymentStatus: PAYMENT_STATUS.PENDING_FINANCE_APPROVAL,
    remarks: 'Raw material rejected - charges for re-inspection and additional testing',
    documents: ['rejection_report.pdf', 'charge_invoice.pdf'],
    slaBreached: false
  }
];

// Section 2: Inspection Calls Pending Billing
export const MOCK_PENDING_BILLING = [
  {
    id: 'IC-001',
    callNumber: 'CALL-2025-010',
    vendor: { id: 'V001', name: 'ABC Steel Industries' },
    poNumber: 'PO-2024-1010',
    productType: PRODUCT_TYPES.ERC,
    stage: INSPECTION_STAGES.FINAL,
    icIssuedDate: '2025-01-15T10:00:00',
    icNumber: 'IC-2025-001',
    inspectionAmount: 125000,
    testingAmount: 35000,
    totalAmount: 160000,
    billStatus: BILL_STATUS.IC_ISSUED_BILLING_PENDING,
    assignedTo: 'Finance - Suresh Menon',
    remarks: 'IC issued, ready for billing',
    slaBreached: true,
    paymentHistory: [
      {
        timestamp: '2025-01-15T10:00:00.000Z',
        action: 'IC_ISSUED',
        description: 'Inspection Certificate issued after successful final inspection',
        performedBy: 'IE - Rajesh Kumar',
        status: 'ic_issued_billing_pending'
      }
    ]
  },
  {
    id: 'IC-002',
    callNumber: 'CALL-2025-011',
    vendor: { id: 'V002', name: 'XYZ Manufacturing Ltd' },
    poNumber: 'PO-2024-1011',
    productType: PRODUCT_TYPES.SLEEPER,
    stage: INSPECTION_STAGES.PROCESS,
    icIssuedDate: '2025-01-20T14:30:00',
    icNumber: 'IC-2025-002',
    inspectionAmount: 95000,
    testingAmount: 0,
    totalAmount: 95000,
    billStatus: BILL_STATUS.REJECTED_BILLING_PENDING,
    assignedTo: 'Finance - Suresh Menon',
    remarks: 'Rejected call, billing for rejection charges',
    slaBreached: false,
    paymentHistory: [
      {
        timestamp: '2025-01-20T14:30:00.000Z',
        action: 'CALL_REJECTED',
        description: 'Call rejected due to quality issues - rejection charges applicable',
        performedBy: 'IE - Vikram Singh',
        status: 'rejected_billing_pending'
      }
    ]
  },
  {
    id: 'IC-003',
    callNumber: 'CALL-2025-012',
    vendor: { id: 'V003', name: 'PQR Engineering Works' },
    poNumber: 'PO-2024-1012',
    productType: PRODUCT_TYPES.GRSP,
    stage: INSPECTION_STAGES.RAW_MATERIAL,
    icIssuedDate: '2025-01-22T11:00:00',
    icNumber: 'IC-2025-003',
    inspectionAmount: 75000,
    testingAmount: 25000,
    totalAmount: 100000,
    billStatus: BILL_STATUS.ADVANCE_SUSPENSE,
    assignedTo: 'Finance - Suresh Menon',
    remarks: 'Advance payment on hold',
    suspenseReason: 'Vendor has outstanding payment of ₹2,50,000 from previous billing cycle',
    suspenseDate: '2025-01-21T09:00:00',
    slaBreached: false,
    paymentHistory: [
      {
        timestamp: '2025-01-18T09:30:00.000Z',
        action: 'ADVANCE_PAYMENT_RECEIVED',
        description: 'Advance payment received from vendor',
        amount: 100000,
        performedBy: 'Vendor - PQR Engineering Works',
        status: 'advance_payment_received'
      },
      {
        timestamp: '2025-01-21T09:00:00.000Z',
        action: 'STATUS_CHANGED',
        description: 'Payment placed under suspense - Vendor has outstanding payment of ₹2,50,000 from previous billing cycle',
        performedBy: 'Finance - Suresh Menon',
        status: 'advance_suspense'
      }
    ]
  }
];

// Section 3: Pending Payment - Bills Generated Awaiting Payment
export const MOCK_BILLS_GENERATED = [
  {
    id: 'BILL-001',
    billNumber: 'BILL-202501-0001',
    callNumber: 'CALL-2025-020',
    vendor: { id: 'V001', name: 'ABC Steel Industries' },
    poNumber: 'PO-2024-1020',
    productType: PRODUCT_TYPES.ERC,
    stage: INSPECTION_STAGES.FINAL,
    billDate: '2025-01-10T10:00:00',
    billAmount: 185000,
    gstAmount: 33300,
    totalAmount: 218300,
    billStatus: BILL_STATUS.PAYMENT_PENDING,
    generatedBy: 'Finance - Suresh Menon',
    dueDate: '2025-01-24T23:59:59',
    remarks: 'Bill sent to vendor',
    documents: ['bill_202501_0001.pdf'],
    slaBreached: false,
    paymentHistory: [
      {
        timestamp: '2025-01-08T10:00:00.000Z',
        action: 'IC_ISSUED',
        description: 'Inspection Certificate issued after successful final inspection',
        performedBy: 'IE - Rajesh Kumar',
        status: 'ic_issued_billing_pending'
      },
      {
        timestamp: '2025-01-10T10:00:00.000Z',
        action: 'BILL_GENERATED',
        description: 'Bill generated and sent to vendor',
        amount: 218300,
        billNumber: 'BILL-202501-0001',
        performedBy: 'Finance - Suresh Menon',
        status: 'bill_generated'
      }
    ]
  },
  {
    id: 'BILL-002',
    billNumber: 'BILL-202501-0002',
    callNumber: 'CALL-2025-021',
    vendor: { id: 'V002', name: 'XYZ Manufacturing Ltd' },
    poNumber: 'PO-2024-1021',
    productType: PRODUCT_TYPES.SLEEPER,
    stage: INSPECTION_STAGES.PROCESS,
    billDate: '2025-01-08T14:30:00',
    billAmount: 125000,
    gstAmount: 22500,
    totalAmount: 147500,
    billStatus: BILL_STATUS.PAYMENT_PENDING,
    generatedBy: 'Finance - Suresh Menon',
    dueDate: '2025-01-22T23:59:59',
    remarks: 'Awaiting payment',
    documents: ['bill_202501_0002.pdf'],
    slaBreached: true
  },
  {
    id: 'BILL-003',
    billNumber: 'BILL-202501-0003',
    callNumber: 'CALL-2025-022',
    vendor: { id: 'V004', name: 'LMN Fabricators Pvt Ltd' },
    poNumber: 'PO-2024-1022',
    productType: PRODUCT_TYPES.ERC,
    stage: INSPECTION_STAGES.RAW_MATERIAL,
    billDate: '2025-01-12T09:15:00',
    billAmount: 95000,
    gstAmount: 17100,
    totalAmount: 112100,
    billStatus: BILL_STATUS.PAYMENT_RECORDED,
    generatedBy: 'Finance - Suresh Menon',
    dueDate: '2025-01-26T23:59:59',
    paymentDate: '2025-01-23T15:30:00',
    paymentReference: 'UTR-2025012300123',
    paymentMode: 'NEFT',
    recordedBy: 'Finance - Suresh Menon',
    remarks: 'Payment received and recorded',
    documents: ['bill_202501_0003.pdf', 'payment_proof.pdf'],
    slaBreached: false
  }
];

// Section 4: Bills Cleared
export const MOCK_BILLS_CLEARED = [
  {
    id: 'BILL-CLR-001',
    billNumber: 'BILL-202412-0045',
    callNumber: 'CALL-2024-150',
    vendor: { id: 'V001', name: 'ABC Steel Industries' },
    poNumber: 'PO-2024-0950',
    productType: PRODUCT_TYPES.ERC,
    stage: INSPECTION_STAGES.FINAL,
    billDate: '2024-12-15T10:00:00',
    billAmount: 150000,
    gstAmount: 27000,
    totalAmount: 177000,
    billStatus: BILL_STATUS.BILL_CLEARED,
    paymentDate: '2024-12-28T14:30:00',
    paymentReference: 'UTR-2024122800456',
    paymentMode: 'RTGS',
    clearedDate: '2024-12-29T10:00:00',
    clearedBy: 'Finance - Suresh Menon',
    remarks: 'Payment cleared successfully',
    documents: ['bill_202412_0045.pdf', 'payment_proof.pdf'],
    paymentHistory: [
      {
        timestamp: '2024-12-12T10:00:00.000Z',
        action: 'IC_ISSUED',
        description: 'Inspection Certificate issued after successful final inspection',
        performedBy: 'IE - Rajesh Kumar',
        status: 'ic_issued_billing_pending'
      },
      {
        timestamp: '2024-12-15T10:00:00.000Z',
        action: 'BILL_GENERATED',
        description: 'Bill generated and sent to vendor',
        amount: 177000,
        billNumber: 'BILL-202412-0045',
        performedBy: 'Finance - Suresh Menon',
        status: 'bill_generated'
      },
      {
        timestamp: '2024-12-28T14:30:00.000Z',
        action: 'PAYMENT_RECORDED',
        description: 'Payment received from vendor via RTGS',
        amount: 177000,
        paymentReference: 'UTR-2024122800456',
        performedBy: 'Finance - Suresh Menon',
        status: 'payment_recorded'
      },
      {
        timestamp: '2024-12-29T10:00:00.000Z',
        action: 'BILL_CLEARED',
        description: 'Bill cleared and transaction completed',
        performedBy: 'Finance - Suresh Menon',
        status: 'bill_cleared'
      }
    ]
  },
  {
    id: 'BILL-CLR-002',
    billNumber: 'BILL-202412-0046',
    callNumber: 'CALL-2024-151',
    vendor: { id: 'V003', name: 'PQR Engineering Works' },
    poNumber: 'PO-2024-0951',
    productType: PRODUCT_TYPES.GRSP,
    stage: INSPECTION_STAGES.PROCESS,
    billDate: '2024-12-18T11:30:00',
    billAmount: 120000,
    gstAmount: 21600,
    totalAmount: 141600,
    billStatus: BILL_STATUS.BILL_CLEARED,
    paymentDate: '2025-01-05T16:00:00',
    paymentReference: 'UTR-2025010500789',
    paymentMode: 'NEFT',
    clearedDate: '2025-01-06T09:30:00',
    clearedBy: 'Finance - Suresh Menon',
    remarks: 'Payment cleared',
    documents: ['bill_202412_0046.pdf', 'payment_proof.pdf']
  }
];

// Section 5: Historical Financial Records & Audit Trail
export const MOCK_AUDIT_TRAIL = [
  {
    id: 'AUD-FIN-001',
    callNumber: 'CALL-2025-001',
    billNumber: 'BILL-202501-0001',
    action: 'Payment Approved',
    performedBy: 'Finance - Suresh Menon',
    timestamp: '2025-01-21T10:30:00',
    remarks: 'Payment approved after verification',
    amount: 125000,
    previousStatus: PAYMENT_STATUS.PENDING_FINANCE_APPROVAL,
    newStatus: PAYMENT_STATUS.APPROVED
  },
  {
    id: 'AUD-FIN-002',
    callNumber: 'CALL-2025-002',
    action: 'Payment Returned',
    performedBy: 'Finance - Suresh Menon',
    timestamp: '2025-01-19T16:00:00',
    remarks: 'Incorrect documentation - invoice amount mismatch',
    amount: 85000,
    previousStatus: PAYMENT_STATUS.PENDING_FINANCE_APPROVAL,
    newStatus: PAYMENT_STATUS.RETURNED
  },
  {
    id: 'AUD-FIN-003',
    callNumber: 'CALL-2025-010',
    billNumber: 'BILL-202501-0010',
    action: 'Bill Generated',
    performedBy: 'Finance - Suresh Menon',
    timestamp: '2025-01-16T14:00:00',
    remarks: 'Bill generated for IC-2025-001',
    amount: 160000,
    previousStatus: BILL_STATUS.BILLING_PENDING,
    newStatus: BILL_STATUS.BILL_GENERATED
  },
  {
    id: 'AUD-FIN-004',
    callNumber: 'CALL-2025-020',
    billNumber: 'BILL-202501-0001',
    action: 'Payment Recorded',
    performedBy: 'Finance - Suresh Menon',
    timestamp: '2025-01-23T15:30:00',
    remarks: 'Payment received via NEFT - UTR-2025012300123',
    amount: 218300,
    previousStatus: BILL_STATUS.PAYMENT_PENDING,
    newStatus: BILL_STATUS.PAYMENT_RECORDED
  },
  {
    id: 'AUD-FIN-005',
    callNumber: 'CALL-2024-150',
    billNumber: 'BILL-202412-0045',
    action: 'Bill Cleared',
    performedBy: 'Finance - Suresh Menon',
    timestamp: '2024-12-29T10:00:00',
    remarks: 'Payment cleared and reconciled',
    amount: 177000,
    previousStatus: BILL_STATUS.PAYMENT_RECORDED,
    newStatus: BILL_STATUS.BILL_CLEARED
  }
];

