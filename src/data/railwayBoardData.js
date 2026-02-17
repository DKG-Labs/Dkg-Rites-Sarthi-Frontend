/**
 * Mock Data for Railway Board Dashboard (5-Level Drill Down)
 * Matches the structure from 'Day to Day ERC Report(PO List wise).csv'
 */

// KPI Cards Data
export const KPI_METRICS = [
    { id: 'total_po', label: 'Total PO Qty', value: '5,24,555', subtext: 'Across 4 Zones', trend: '+5%', status: 'neutral' },
    { id: 'accepted', label: 'Accepted Qty', value: '3,85,912', subtext: '73.5% Completion', trend: '+12%', status: 'success' },
    { id: 'rm_rej', label: 'RM Rejection', value: '1.8%', subtext: 'Target: <2%', trend: '-0.2%', status: 'success' },
    { id: 'proc_rej', label: 'Process Rej', value: '4.2%', subtext: 'Target: <3.5%', trend: '+0.7%', status: 'warning' },
    { id: 'final_rej', label: 'Final Rej', value: '0.5%', subtext: 'Target: <1%', trend: '0%', status: 'success' },
    { id: 'pending', label: 'Pending Calls', value: '12', subtext: 'Critical: 3', trend: '', status: 'warning' },
];

// Level 1: PO Wise List
export const PO_WISE_LIST = [
    { id: 1, railway: 'WR', po_no: '987667', po_date: '2025-02-01', vendor: 'Prakash Metallics', region: 'CRIO', po_qty: 50340, accepted_qty: 25087, balance_qty: 25253, rm_rej: 2.5, process_rej: 2.4, final_rej: 0.2, status: 'Running' },
    { id: 2, railway: 'WR', po_no: '987665', po_date: '2025-03-05', vendor: 'Prakash Metallics', region: 'CRIO', po_qty: 124555, accepted_qty: 89844, balance_qty: 34711, rm_rej: 1.2, process_rej: 4.5, final_rej: 0.5, status: 'Running' },
    { id: 3, railway: 'CR', po_no: '789222', po_date: '2025-06-09', vendor: 'Kalimata', region: 'ERIO', po_qty: 103455, accepted_qty: 32424, balance_qty: 71031, rm_rej: 1.3, process_rej: 3.4, final_rej: 0.4, status: 'Running' },
    { id: 4, railway: 'CR', po_no: '785566', po_date: '2025-06-09', vendor: 'Royal', region: 'ERIO', po_qty: 98889, accepted_qty: 98776, balance_qty: 113, rm_rej: 1.5, process_rej: 2.5, final_rej: 0.2, status: 'Closed with Short Quantity' },
    { id: 5, railway: 'WR', po_no: '987660', po_date: '2025-01-15', vendor: 'Royal', region: 'WRIO', po_qty: 75000, accepted_qty: 30000, balance_qty: 45000, rm_rej: 1.1, process_rej: 2.2, final_rej: 0.3, status: 'Running' },
    { id: 6, railway: 'SR', po_no: '554433', po_date: '2025-05-20', vendor: 'Kalimata', region: 'SRIO', po_qty: 88000, accepted_qty: 88000, balance_qty: 0, rm_rej: 1.4, process_rej: 2.1, final_rej: 0.1, status: 'Closed' },
    { id: 7, railway: 'NR', po_no: '332211', po_date: '2025-07-01', vendor: 'Prakash Metallics', region: 'NRIO', po_qty: 60000, accepted_qty: 10000, balance_qty: 50000, rm_rej: 1.9, process_rej: 3.1, final_rej: 0.2, status: 'Running' },
    { id: 8, railway: 'SER', po_no: '445566', po_date: '2025-08-10', vendor: 'Royal', region: 'SERIO', po_qty: 40000, accepted_qty: 39000, balance_qty: 1000, rm_rej: 1.2, process_rej: 1.8, final_rej: 0.4, status: 'Running' }
];

// Level 2: PO Serial Wise List (Mapped by PO No)
export const PO_SERIAL_LIST = {
    '987667': [
        { id: '1-1', rly_po_sr_no: 'WR-987667-001', consignee: 'SSE/MUMBAI', dp_date: '2025-09-12', ext_dp_date: null, qty: 25170, balance: 12626, ic_issued: 5, last_ic_date: '2025-08-15', rm_acc: 26000, rm_rej_pct: 2.5, proc_acc: 25500, proc_rej_pct: 2.4, final_acc: 12544, final_rej_pct: 0.2 },
        { id: '1-2', rly_po_sr_no: 'WR-987667-002', consignee: 'SSE/AHMEDABAD', dp_date: '2025-09-12', ext_dp_date: null, qty: 25170, balance: 12627, ic_issued: 5, last_ic_date: '2025-08-16', rm_acc: 26000, rm_rej_pct: 2.5, proc_acc: 25500, proc_rej_pct: 2.4, final_acc: 12543, final_rej_pct: 0.2 }
    ],
    '987665': [
        { id: '2-1', rly_po_sr_no: 'WR-987665-001', consignee: 'SSE/VADODARA', dp_date: '2025-10-10', ext_dp_date: null, qty: 62277, balance: 10000, ic_issued: 3, last_ic_date: '2025-09-01', rm_acc: 65000, rm_rej_pct: 1.1, proc_acc: 64000, proc_rej_pct: 4.2, final_acc: 62277, final_rej_pct: 0.4 },
        { id: '2-2', rly_po_sr_no: 'WR-987665-002', consignee: 'SSE/RAJKOT', dp_date: '2025-10-10', ext_dp_date: null, qty: 62278, balance: 24711, ic_issued: 2, last_ic_date: '2025-09-02', rm_acc: 65000, rm_rej_pct: 1.3, proc_acc: 64000, proc_rej_pct: 4.8, final_acc: 27567, final_rej_pct: 0.6 }
    ],
    '785566': [
        { id: '4-1', rly_po_sr_no: 'CR-785566-001', consignee: 'SSE/KOTA', dp_date: '2025-09-12', ext_dp_date: null, qty: 24722, balance: 0, ic_issued: 10, last_ic_date: '2025-08-20', rm_acc: 29, rm_rej_pct: 0.2, proc_acc: 25217, proc_rej_pct: 1.5, final_acc: 24722, final_rej_pct: 0.6 },
        { id: '4-2', rly_po_sr_no: 'CR-785566-002', consignee: 'SSE/JABALPUR', dp_date: '2025-09-09', ext_dp_date: null, qty: 19778, balance: 0, ic_issued: 14, last_ic_date: '2025-08-22', rm_acc: 25, rm_rej_pct: 0.2, proc_acc: 21739, proc_rej_pct: 1.7, final_acc: 19778, final_rej_pct: 0.5 },
        { id: '4-3', rly_po_sr_no: 'CR-785566-003', consignee: 'SSE/JABALPUR', dp_date: '2025-09-10', ext_dp_date: '2025-12-09', qty: 34611, balance: 50, ic_issued: 13, last_ic_date: '2025-10-24', rm_acc: 41, rm_rej_pct: 0.2, proc_acc: 35652, proc_rej_pct: 1.4, final_acc: 34561, final_rej_pct: 0.7 }
    ],
    '987660': [
        { id: '5-1', rly_po_sr_no: 'WR-987660-001', consignee: 'SSE/SURAT', dp_date: '2025-11-20', ext_dp_date: null, qty: 75000, balance: 45000, ic_issued: 4, last_ic_date: '2025-10-15', rm_acc: 80000, rm_rej_pct: 0.9, proc_acc: 78000, proc_rej_pct: 2.1, final_acc: 30000, final_rej_pct: 0.3 }
    ]
};

// Level 3: Inspection Call Wise List (Mapped by Rly PO Sr No)
export const INSPECTION_CALL_LIST = {
    'CR-785566-003': [
        { id: 'IC-1', call_no: 'ER-030725-0001', stage: 'Raw Material', desired_date: '2025-07-09', start_date: '2025-07-16', end_date: '2025-07-16', visits: 1, offered: '9 MT', accepted: '8.5 MT', balance: '-', rej_pct: 6, reason: 'Visual- Straightness, Visual - Cracks', ic_number: 'C-ER-030725-0001-HS', type: 'RM' },
        { id: 'IC-2', call_no: 'ER-030825-0041', stage: 'Raw Material', desired_date: '2025-08-10', start_date: '2025-08-17', end_date: '2025-08-20', visits: 2, offered: '33 MT', accepted: '32.5 MT', balance: '-', rej_pct: 2, reason: 'Visual- Cracks', ic_number: 'C-ER-030825-0041-HS', type: 'RM' },
        { id: 'IC-3', call_no: 'EP-070825-0031', stage: 'Process', desired_date: '2025-08-01', start_date: '2025-08-08', end_date: '2025-08-23', visits: 30, offered: '15000', accepted: '14500', balance: '-', rej_pct: 3.3, reason: 'Shearing - Cut Bar Length, Forging - Stabilisation', ic_number: 'C-EP-070825-0031-HS', type: 'Process' },
        { id: 'IC-4', call_no: 'EP-250825-0012', stage: 'Process', desired_date: '2025-09-01', start_date: '2025-09-08', end_date: '2025-09-23', visits: 30, offered: '15000', accepted: '14000', balance: '-', rej_pct: 6.7, reason: 'Forging - Improper Forging, Final Check - Dimension', ic_number: 'C-EP-250825-0012-HS', type: 'Process' },
        { id: 'IC-5', call_no: 'EF-300825-0008', stage: 'Final', desired_date: '2025-09-07', start_date: '2025-09-14', end_date: '2025-09-16', visits: 2, offered: '20500', accepted: '20000', balance: '14561', rej_pct: 2.4, reason: 'Visual - Marking', ic_number: 'C-EF-300825-0008-HS', type: 'Final' }
    ],
    'WR-987667-001': [
        { id: 'IC-6', call_no: 'WP-120225-0001', stage: 'Process', desired_date: '2025-02-01', start_date: '2025-02-05', end_date: '2025-02-20', visits: 15, offered: '12000', accepted: '11800', balance: '-', rej_pct: 1.6, reason: 'Minor Shearing Issues', ic_number: 'C-WP-120225-0001-HS', type: 'Process' },
        { id: 'IC-7', call_no: 'WF-150225-0002', stage: 'Final', desired_date: '2025-02-25', start_date: '2025-02-28', end_date: '2025-03-02', visits: 2, offered: '11800', accepted: '11750', balance: '13420', rej_pct: 0.4, reason: 'OK', ic_number: 'C-WF-150225-0002-HS', type: 'Final' }
    ],
    'WR-987660-001': [
        { id: 'IC-8', call_no: 'WP-101025-0005', stage: 'Process', desired_date: '2025-10-05', start_date: '2025-10-10', end_date: '2025-10-25', visits: 15, offered: '30000', accepted: '29500', balance: '-', rej_pct: 1.7, reason: 'Turning Issues', ic_number: 'C-WP-101025-0005-HS', type: 'Process' }
    ]
};

// Level 4: Shift-wise Results (Mapped by Process Call No)
export const SHIFT_RESULTS = {
    'EP-250825-0012': [
        { id: 'S-1', date: '2026-01-01', shift: 'A', lot_no: 'MF/5/65', accepted_qty: 848, total_rej: 119, shearing: { prod: 877, rej: 45 }, turning: { prod: 984, rej: 34 }, mpi: { prod: 983, rej: 10 }, forging: { prod: 890, rej: 36 }, quenching: { prod: 811, rej: 19 }, tempering: { prod: 848, rej: 14 }, defects: { shearing_len: 14, turning_ovality: 3, turning_sharp: 8, mpi: 11, forging_temp: 13, quenching_hardness: 19, dimensional_box: 11, visual_surface: 9, testing_toe_load: 4 } },
        { id: 'S-2', date: '2026-01-01', shift: 'B', lot_no: 'MF/5/66', accepted_qty: 839, total_rej: 139, shearing: { prod: 860, rej: 35 }, turning: { prod: 829, rej: 23 }, mpi: { prod: 848, rej: 13 }, forging: { prod: 809, rej: 38 }, quenching: { prod: 842, rej: 9 }, tempering: { prod: 839, rej: 2 }, defects: { shearing_len: 9, turning_ovality: 15, turning_sharp: 14, mpi: 5, forging_temp: 15, quenching_hardness: 19, dimensional_box: 10, visual_surface: 16, testing_toe_load: 12 } }
    ],
    'WP-120225-0001': [
        { id: 'S-3', date: '2025-02-05', shift: 'A', lot_no: 'L-001', accepted_qty: 1200, total_rej: 20, shearing: { prod: 1220, rej: 10 }, turning: { prod: 1210, rej: 5 }, mpi: { prod: 1205, rej: 3 }, forging: { prod: 1202, rej: 2 }, quenching: { prod: 1200, rej: 0 }, tempering: { prod: 1200, rej: 0 }, defects: { shearing_len: 10, turning_ovality: 5 } }
    ],
    'WP-101025-0005': [
        { id: 'S-4', date: '2025-10-10', shift: 'A', lot_no: 'N/10/01', accepted_qty: 1500, total_rej: 50, shearing: { prod: 1550, rej: 20 }, turning: { prod: 1530, rej: 15 }, mpi: { prod: 1515, rej: 5 }, forging: { prod: 1510, rej: 5 }, quenching: { prod: 1505, rej: 5 }, tempering: { prod: 1500, rej: 0 }, defects: { shearing_len: 20, turning_ovality: 15, mpi: 5, forging_temp: 5, quenching_hardness: 5 } }
    ]
};

// Level 5: Annexures
export const ANNEXURES = {
    'S-1': [
        { name: 'Production Register_Shift_A.pdf', type: 'PDF' },
        { name: 'Heat_Treatment_Graph.png', type: 'IMG' }
    ],
    'IC-1': [
        { name: 'RM_Test_Certificate.pdf', type: 'PDF' },
        { name: 'Spectro_Analysis_Report.pdf', type: 'PDF' }
    ],
    'IC-5': [
        { name: 'Final_Inspection_Certificate.pdf', type: 'PDF' },
        { name: 'Wagon_Loading_Plan.jpg', type: 'IMG' }
    ],
    'S-4': [
        { name: 'Shift_Log_WP_101025.pdf', type: 'PDF' }
    ]
};
