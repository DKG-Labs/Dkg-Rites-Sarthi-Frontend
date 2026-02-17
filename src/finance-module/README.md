# Finance Module

## Overview
The Finance Module is a comprehensive financial management system for RITES ERC that handles vendor payments, billing, and financial record-keeping with complete audit trail capabilities.

## Features

### 1. Vendor Payments - Pending Finance Approval
- View all payments pending finance approval
- Approve payments with optional remarks
- Return payments for rectification with mandatory reason
- Track resubmitted payments
- SLA monitoring and breach alerts
- Real-time status updates

### 2. Inspection Calls Pending Billing
- View inspection calls ready for billing (IC issued)
- Generate bills with automatic GST calculation (18%)
- Handle "Under Suspense" cases
- Track billing SLA compliance
- Separate inspection and testing amounts

### 3. Bills Generated - Payment Pending
- View all generated bills awaiting payment
- Record payment details (UTR, date, mode)
- Mark bills as cleared after payment verification
- Track payment status transitions
- Multiple payment modes support (NEFT, RTGS, IMPS, Cheque, DD)

### 4. Bills Cleared
- Read-only view of all cleared bills
- Complete payment history
- Reference for audit and compliance
- Export capabilities for reporting

### 5. Historical Financial Records & Audit Trail
- Complete end-to-end traceability
- All financial transactions logged
- Status change tracking
- User action history
- Export to CSV for analysis

## Architecture

### Components
```
src/finance-module/
├── src/
│   ├── components/
│   │   ├── FinanceDashboard.js          # Main dashboard with tabs
│   │   ├── VendorPaymentsTab.js         # Section 1
│   │   ├── PendingBillingTab.js         # Section 2
│   │   ├── PendingPaymentTab.js         # Section 3
│   │   ├── BillsClearedTab.js           # Section 4
│   │   └── HistoricalRecordsTab.js      # Section 5
│   ├── hooks/
│   │   ├── useFinanceData.js            # Data management hook
│   │   ├── usePaymentActions.js         # Payment actions hook
│   │   └── useBillingActions.js         # Billing actions hook
│   ├── utils/
│   │   ├── constants.js                 # Constants and enums
│   │   ├── helpers.js                   # Helper functions
│   │   └── mockData.js                  # Mock data for testing
│   ├── styles/
│   │   └── FinanceDashboard.css         # Styling
│   └── index.js                         # Module exports
└── README.md
```

### Data Flow
1. **useFinanceData** hook fetches and manages all financial data
2. **usePaymentActions** hook handles payment approval/return operations
3. **useBillingActions** hook handles bill generation and payment recording
4. Components consume hooks and render UI
5. User actions trigger hook functions
6. Data refreshes automatically after actions

## Usage

### Basic Integration
```javascript
import { FinanceDashboard } from './finance-module';

function App() {
  return <FinanceDashboard />;
}
```

### Using Individual Components
```javascript
import { 
  VendorPaymentsTab,
  useFinanceData,
  usePaymentActions 
} from './finance-module';

function CustomFinanceView() {
  const { pendingPayments } = useFinanceData();
  const { approvePayment, returnPayment } = usePaymentActions();
  
  return (
    <VendorPaymentsTab
      payments={pendingPayments}
      onApprove={approvePayment}
      onReturn={returnPayment}
    />
  );
}
```

## Key Workflows

### Payment Approval Workflow
1. Finance user views pending payments
2. Reviews payment details and documents
3. Either approves with optional remarks OR returns with mandatory reason
4. System updates status and logs action
5. Notification sent to relevant parties

### Billing Workflow
1. IC issued by inspection team
2. Record appears in "Pending Billing" tab
3. Finance generates bill with amount details
4. System calculates GST automatically
5. Bill moves to "Pending Payment" tab
6. Payment recorded when received
7. Bill marked as cleared after verification
8. Complete audit trail maintained

### Suspense Handling
1. Payment issues identified (e.g., outstanding dues)
2. Record marked as "Under Suspense"
3. Suspense reason documented
4. Billing blocked until issue resolved
5. Clear audit trail of suspense period

## SLA Tracking
- **Payment Approval**: 3 days from submission
- **Bill Generation**: 5 days from IC issuance
- **Payment Recording**: 2 days from payment receipt
- Color-coded indicators: Green (On Time), Orange (Due Soon), Red (Breached)

## Status Definitions

### Payment Status
- **PENDING_FINANCE_APPROVAL**: Awaiting finance team review
- **APPROVED**: Payment approved by finance
- **RETURNED**: Returned for rectification
- **RESUBMITTED**: Resubmitted after corrections

### Bill Status
- **BILLING_PENDING**: IC issued, ready for billing
- **UNDER_SUSPENSE**: Billing on hold
- **BILL_GENERATED**: Bill created and sent
- **PAYMENT_PENDING**: Awaiting payment from vendor
- **PAYMENT_RECORDED**: Payment received and recorded
- **BILL_CLEARED**: Payment verified and cleared

## Mock Data
Comprehensive mock data is provided for testing all scenarios:
- 5 pending payments (various statuses)
- 3 pending billing records (including suspense case)
- 3 generated bills (different payment states)
- 2 cleared bills
- 5 audit trail entries

## Future Enhancements
- Integration with accounting systems
- Automated payment reconciliation
- Advanced analytics and reporting
- Email notifications
- Document management system integration
- Multi-currency support
- Automated SLA alerts

## Support
For issues or questions, contact the development team.

