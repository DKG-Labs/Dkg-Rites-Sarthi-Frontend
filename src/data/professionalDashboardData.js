export const PROFESSIONAL_MAIN_CARDS = [
    { id: 'summary', title: 'Summary', icon: '📊', color: '#dc2626' },
    { id: 'quality', title: 'Quality Surveillance', icon: '🛡️', color: '#166534' },
    { id: 'lifecycle', title: 'PO Lifecycle', icon: '🔄', color: '#1e40af' },
    { id: 'performance', title: 'Performance Matrix', icon: '📈', color: '#f59e0b' },
    { id: 'reports', title: 'Reports', icon: '📑', color: '#3b82f6' },
];

export const SUMMARY_DATA = {
    erc: {
        kpis: [
            { id: 'erc-po-issued', label: 'PO Issued', value: '412', icon: '📦', color: 'red' },
            { id: 'erc-po-qty', label: 'PO Quantity', value: '95,210', icon: '📈', color: 'green', subtext: 'Nos / MT', progress: 68 },
            { id: 'erc-final-inspection', label: 'Final Inspection Quantity', value: '64,780', icon: '✅', color: 'orange', subtext: 'Nos / MT', progress: 68, gradient: true }
        ],
        production: [
            { label: 'Avg Production / Day', value: '947', unit: 'Units', color: 'emerald' },
            { label: 'Process Rejection %', value: '4.2%', progress: 42, color: 'amber' },
            { label: 'Final Rejection %', value: '1.8%', progress: 18, color: 'red' },
            { label: 'Raw Material Rejection %', value: '3.2%', progress: 32, color: 'orange' }
        ]
    },
    sleeper: {
        kpis: [
            { id: 'sleeper-po-issued', label: 'PO Issued', value: '428', icon: '📦', color: 'red' },
            { id: 'sleeper-po-qty', label: 'PO Quantity', value: '94,720', icon: '📈', color: 'green', subtext: 'Nos / MT', progress: 67 },
            { id: 'sleeper-final-inspection', label: 'Final Inspection Quantity', value: '63,280', icon: '✅', color: 'orange', subtext: 'Nos / MT', progress: 67, gradient: true }
        ],
        production: [
            { label: 'Avg Production / Day', value: '942', unit: 'Units', color: 'emerald' },
            { label: 'Process Rejection %', value: '4.4%', progress: 44, color: 'amber' },
            { label: 'Final Rejection %', value: '2.0%', progress: 20, color: 'red' },
            { label: 'Raw Material Rejection %', value: '3.5%', progress: 35, color: 'orange' }
        ]
    },
    railpad: {
        kpis: [
            { id: 'railpad-po-issued', label: 'PO Issued', value: '408', icon: '📦', color: 'red' },
            { id: 'railpad-po-qty', label: 'PO Quantity', value: '94,720', icon: '📈', color: 'green', subtext: 'Nos / MT', progress: 68 },
            { id: 'railpad-final-inspection', label: 'Final Inspection Quantity', value: '64,280', icon: '✅', color: 'orange', subtext: 'Nos / MT', progress: 68, gradient: true }
        ],
        production: [
            { label: 'Avg Production / Day', value: '953', unit: 'Units', color: 'emerald' },
            { label: 'Process Rejection %', value: '4.1%', progress: 41, color: 'amber' },
            { label: 'Final Rejection %', value: '1.7%', progress: 17, color: 'red' },
            { label: 'Raw Material Rejection %', value: '3.0%', progress: 30, color: 'orange' }
        ]
    }
};

export const QUALITY_DATA = {
    summary: [
        { label: 'Overall Rejection %', value: '1.34%', color: 'red' },
        { label: 'Top Defect', value: 'Turning Length', color: 'blue' },
        { label: 'Worst Performing Plant', value: 'Adinath Industries', color: 'orange' },
        { label: 'Total Defects Recorded', value: '380', color: 'gray' }
    ],
    stageRejection: [
        { name: 'Raw Material', value: 0.8, color: '#2563eb' },
        { name: 'Process', value: 1.6, color: '#f59e0b' },
        { name: 'Final', value: 0.9, color: '#ef4444' },
    ],
    pareto: [
        { name: 'Turning Length', count: 120, cumulative: 30 },
        { name: 'Cut Bar Length', count: 95, cumulative: 55 },
        { name: 'Forging', count: 80, cumulative: 70 },
        { name: 'Dimensional', count: 60, cumulative: 80 },
        { name: 'Embossing', count: 50, cumulative: 88 },
        { name: 'MPI', count: 40, cumulative: 93 },
        { name: 'Hardness', count: 35, cumulative: 96 },
        { name: 'Visual', count: 30, cumulative: 98 },
        { name: 'Taper Length', count: 20, cumulative: 100 },
    ],
    defectDistribution: [
        { name: 'Shearing', value: 15, color: '#2563eb' },
        { name: 'Turning', value: 25, color: '#f59e0b' },
        { name: 'MPI', value: 10, color: '#8b5cf6' },
        { name: 'Forging', value: 20, color: '#ef4444' },
        { name: 'Quenching', value: 12, color: '#10b981' },
        { name: 'Tempering', value: 10, color: '#06b6d4' },
        { name: 'Final Testing', value: 8, color: '#3b82f6' },
    ],
    rmManufacturerRejection: [
        { name: 'JSPL', value: 0.9, color: '#10b981' },
        { name: 'RINL', value: 1.2, color: '#10b981' },
        { name: 'Nova Jaiswal', value: 1.8, color: '#ef4444' },
        { name: 'Bhushan', value: 1.1, color: '#10b981' },
        { name: 'Surya', value: 0.7, color: '#10b981' },
    ],
    monthlyTrend: [
        { month: 'Sep', value: 1.4 },
        { month: 'Oct', value: 1.2 },
        { month: 'Nov', value: 1.5 },
        { month: 'Dec', value: 1.3 },
        { month: 'Jan', value: 1.1 },
        { month: 'Feb', value: 0.95 },
    ],
    stageVsDefect: [
        { name: 'Stage 1', turning: 25, dimensional: 18, visual: 12 },
        { name: 'Stage 2', turning: 35, dimensional: 28, visual: 22 },
        { name: 'Stage 3', turning: 20, dimensional: 15, visual: 10 },
    ]
};


export const REPORTS_DATA = {
    tabs: [
        { id: 'mpr', label: 'Monthly Progress Report' },
        { id: 'mau', label: 'Monthly Analysis of Units' },
        { id: 'lwcl', label: 'Lot Wise Closed Loop' },
        { id: 'qmr', label: 'Quality Monitoring Report' }
    ],
    mpr: [
        { rly: 'NR', poNo: 'NR/2025/ERC/0145', manufacturer: 'JSPL', poQty: '120,000', monthlyRM: '8,500', monthlyProcess: '7,900', monthlyFinal: '7,850', totalInspected: '65,200', poBalance: '54,800' },
        { rly: 'WR', poNo: 'WR/2025/ERC/0082', manufacturer: 'RINL', poQty: '95,000', monthlyRM: '6,200', monthlyProcess: '6,050', monthlyFinal: '6,000', totalInspected: '48,700', poBalance: '46,300' },
        { rly: 'CR', poNo: 'CR/2025/ERC/0219', manufacturer: 'Neco Jaiswal', poQty: '75,000', monthlyRM: '5,100', monthlyProcess: '4,900', monthlyFinal: '4,850', totalInspected: '39,450', poBalance: '35,550' },
        { rly: 'SR', poNo: 'SR/2025/ERC/0111', manufacturer: 'Bhushan Steel', poQty: '110,000', monthlyRM: '7,400', monthlyProcess: '7,100', monthlyFinal: '7,000', totalInspected: '60,800', poBalance: '49,200' },
    ],
    mau: {
        table: [
            { manufacturer: 'JSPL', manufactured: '28,500', inspected: '27,800', rejected: '320', rmRej: '0.8%', processRej: '1.2%', finalRej: '0.9%' },
            { manufacturer: 'RINL', manufactured: '24,200', inspected: '23,900', rejected: '290', rmRej: '0.7%', processRej: '0.9%', finalRej: '1.3%' },
            { manufacturer: 'Neco Jaiswal', manufactured: '19,800', inspected: '19,300', rejected: '410', rmRej: '1.4%', processRej: '0.8%', finalRej: '1.0%' },
            { manufacturer: 'Bhushan Steel', manufactured: '22,600', inspected: '22,200', rejected: '260', rmRej: '0.6%', processRej: '0.7%', finalRej: '0.8%' },
        ],
        production: [
            { name: 'JSPL', value: 28500 },
            { name: 'RINL', value: 24200 },
            { name: 'Neco Jaiswal', value: 19800 },
            { name: 'Bhushan Steel', value: 22600 },
        ],
        rejectionRadar: [
            { subject: 'JSPL', A: 1.1, fullMark: 1.5 },
            { subject: 'RINL', A: 1.3, fullMark: 1.5 },
            { subject: 'Neco Jaiswal', A: 1.4, fullMark: 1.5 },
            { subject: 'Bhushan Steel', A: 0.8, fullMark: 1.5 },
        ]
    },
    lwcl: {
        poNumbers: ['PO-145', 'PO-182'],
        lots: ['Lot-01', 'Lot-02'],
        table: [
            { date: '11-02-2026', shift: 'A', accepted: '1,250', rejected: '45', shearing: 5, turning: 10, mpi: 8, forging: 7, quenching: 6, tempering: 5, testing: 4 },
            { date: '11-02-2026', shift: 'B', accepted: '1,180', rejected: '52', shearing: 6, turning: 12, mpi: 9, forging: 8, quenching: 7, tempering: 5, testing: 5 },
        ],
        pareto: [
            { name: 'Turning', value: 22 },
            { name: 'MPI', value: 17 },
            { name: 'Forging', value: 15 },
            { name: 'Shearing', value: 11 },
            { name: 'Quenching', value: 9 },
            { name: 'Tempering', value: 7 },
            { name: 'Testing', value: 5 },
        ]
    },
    qmr: [
        { parameter: "Length of cut bar", rm: 12, process: 8, final: 5, overallNos: 25, overallPct: "0.15%" },
        { parameter: "Ovality / Improper Dia at end", rm: 15, process: 10, final: 7, overallNos: 32, overallPct: "0.18%" },
        { parameter: "Sharp Edges", rm: 8, process: 5, final: 3, overallNos: 16, overallPct: "0.10%" },
        { parameter: "Cracked Edges", rm: 5, process: 3, final: 2, overallNos: 10, overallPct: "0.05%" },
        { parameter: "Parallel Length", rm: 10, process: 7, final: 4, overallNos: 21, overallPct: "0.12%" },
        { parameter: "Full Turning Length", rm: 25, process: 20, final: 15, overallNos: 60, overallPct: "0.35%" },
        { parameter: "Turning Dia", rm: 18, process: 14, final: 10, overallNos: 42, overallPct: "0.25%" },
        { parameter: "MPI Rejection", rm: 30, process: 25, final: 20, overallNos: 75, overallPct: "0.45%" },
        { parameter: "Forging Temp.", rm: 0, process: 15, final: 0, overallNos: 15, overallPct: "0.09%" },
        { parameter: "Forging Stabilisation Rejection", rm: 0, process: 10, final: 0, overallNos: 10, overallPct: "0.06%" }
    ]
};


export const PERFORMANCE_DATA = {
    summary: [
        { label: 'Total Inspected', value: '5,684', color: 'blue' },
        { label: 'Accepted', value: '5,456', color: 'emerald' },
        { label: 'Rejected', value: '228', color: 'red' },
        { label: 'Avg Rejection %', value: '4.01%', color: 'purple' },
    ],
    filters: {
        vendors: ['Technical Solutions Pvt. Ltd.', 'Metro Components Ltd.', 'Apex Engineering Corp.'],
        inspectors: ['Vijay Verma', 'Rajesh Kumar', 'Suresh Patel'],
        stages: ['Raw Material', 'Process', 'Final']
    },
    records: [
        { id: 1, manufacturer: 'Technical Solutions Pvt. Ltd.', inspector: 'Vijay Verma', stage: 'Raw Material', inspected: '1,914', accepted: '1,855', rejected: '59', rejectionRate: '3.08%', reason: 'Chemical composition out of specification' },
        { id: 2, manufacturer: 'Metro Components Ltd.', inspector: 'Rajesh Kumar', stage: 'Final', inspected: '2,431', accepted: '2,367', rejected: '64', rejectionRate: '2.63%', reason: 'Improper heat treatment' },
        { id: 3, manufacturer: 'Apex Engineering Corp.', inspector: 'Suresh Patel', stage: 'Process', inspected: '1,339', accepted: '1,234', rejected: '105', rejectionRate: '7.84%', reason: 'Dimensional variation beyond tolerance' },
    ]
};
