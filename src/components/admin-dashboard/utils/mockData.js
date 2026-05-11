/**
 * Admin Module Mock Data
 * Mock data for Users, Masters, and Calibration
 */

// User Roles
export const USER_ROLES = [
    'Super Admin',
    'Admin',
    'Railway Board',
    'Zonal Railway',
    'CRIS/IREPS Integration',
    'Vendor',
    'Inspection Desk',
    'Controlling Manager',
    'RITES Finance',
    'Inspecting Engineer',
    'Process Inspecting Engineer - ERC',
    'Process Inspecting Engineer - PSC Sleeper',
    'RITES Management',
    'SBU Head'
];

// Regions/RIOs
export const REGIONS = [
    'NRIO',
    'WRIO',
    'SRIO',
    'ERIO',
    'CRIO'
];

// Designations
export const DESIGNATIONS = [
    'Technical Assistant',
    'Senior Technical Assistant',
    'Assistant Engineer',
    'Engineer',
    'Assistant Manager',
    'Manager',
    'Senior Manager',
    'DGM',
    'JGM',
    'AGM',
    'GM',
    'GGM',
    'ED'
];

// Disciplines
export const DISCIPLINES = [
    'Mechanical',
    'M&C',
    'Civil',
    'Electrical'
];

// Mock Users Data
export const mockUsers = [
    {
        id: 1,
        rritesEmployeeCode: 'RITES001',
        name: 'Rajesh Kumar',
        shortName: 'RK',
        dateOfBirth: '15/05/1985',
        role: 'Admin',
        rio: 'Northern Region',
        cm: 'CM001',
        email: 'rajesh.kumar@rites.com',
        mobileNo: '9876543210',
        discipline: 'M&C',
        status: 'Active'
    },
    {
        id: 2,
        rritesEmployeeCode: 'RITES002',
        name: 'Priya Singh',
        shortName: 'PS',
        dateOfBirth: '22/08/1990',
        role: 'Inspecting Engineer',
        rio: 'Southern Region',
        cm: 'CM002',
        email: 'priya.singh@rites.com',
        mobileNo: '9876543211',
        discipline: 'E&I',
        status: 'Active'
    },
    {
        id: 3,
        rritesEmployeeCode: 'RITES003',
        name: 'Amit Patel',
        shortName: 'AP',
        dateOfBirth: '10/03/1988',
        role: 'Controlling Manager',
        rio: 'Western Region',
        cm: 'CM003',
        email: 'amit.patel@rites.com',
        mobileNo: '9876543212',
        discipline: 'M&C',
        status: 'Active'
    },
    {
        id: 4,
        rritesEmployeeCode: 'RITES004',
        name: 'Neha Gupta',
        shortName: 'NG',
        dateOfBirth: '05/12/1992',
        role: 'Inspection Desk',
        rio: 'Eastern Region',
        cm: 'CM004',
        email: 'neha.gupta@rites.com',
        mobileNo: '9876543213',
        discipline: 'QA',
        status: 'Inactive'
    }
];

// Mock Masters Data
export const mockMasters = [
    {
        id: 1,
        masterType: 'Vendor',
        masterName: 'ABC Manufacturing Ltd',
        masterCode: 'VENDOR001',
        vendor: 'ABC Manufacturing',
        status: 'Active',
        createdDate: '01/01/2024',
        createdBy: 'Admin'
    },
    {
        id: 2,
        masterType: 'BPO',
        masterName: 'XYZ Logistics',
        masterCode: 'BPO001',
        vendor: 'XYZ Logistics',
        status: 'Active',
        createdDate: '05/01/2024',
        createdBy: 'Admin'
    },
    {
        id: 3,
        masterType: 'Consignee',
        masterName: 'Railway Board Delhi',
        masterCode: 'CONS001',
        vendor: 'Railway Board',
        status: 'Active',
        createdDate: '10/01/2024',
        createdBy: 'Admin'
    },
    {
        id: 4,
        masterType: 'Item',
        masterName: 'Steel Rails',
        masterCode: 'ITEM001',
        vendor: 'ABC Manufacturing',
        status: 'Pending Approval',
        createdDate: '15/01/2024',
        createdBy: 'Vendor'
    }
];

// Mock Calibration Data
export const mockCalibrations = [
    {
        id: 1,
        productName: 'Pressure Gauge',
        instrumentCode: 'PG001',
        lastCalibrationDate: '01/12/2023',
        nextCalibrationDate: '01/12/2024',
        calibrationCertificate: 'CERT001',
        status: 'Valid',
        vendor: 'ABC Manufacturing'
    },
    {
        id: 2,
        productName: 'Temperature Sensor',
        instrumentCode: 'TS001',
        lastCalibrationDate: '15/11/2023',
        nextCalibrationDate: '15/11/2024',
        calibrationCertificate: 'CERT002',
        status: 'Valid',
        vendor: 'XYZ Logistics'
    },
    {
        id: 3,
        productName: 'Flow Meter',
        instrumentCode: 'FM001',
        lastCalibrationDate: '20/10/2023',
        nextCalibrationDate: '20/10/2024',
        calibrationCertificate: 'CERT003',
        status: 'Expired',
        vendor: 'ABC Manufacturing'
    }
];

// Mock IE Mapping Data
export const mockIEMappings = [
    {
        id: 1,
        rio: 'Northern Region',
        cm: 'CM001',
        ie: 'RITES002',
        ieName: 'Priya Singh',
        poiCode: 'POI001',
        poiName: 'Delhi Plant',
        status: 'Active'
    },
    {
        id: 2,
        rio: 'Southern Region',
        cm: 'CM002',
        ie: 'RITES003',
        ieName: 'Amit Patel',
        poiCode: 'POI002',
        poiName: 'Chennai Plant',
        status: 'Active'
    }
];
