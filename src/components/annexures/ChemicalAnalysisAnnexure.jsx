import React from 'react';
import AnnexureTemplate from '../AnnexureTemplate';

/**
 * Chemical Analysis Annexure - Annexure-I
 * Stage Inspection for Raw material - Test Result: Chemical Analysis
 */

const ChemicalAnalysisAnnexure = ({ data = [] }) => {
  // Header configuration
  const headerData = {
    logoText: 'RITES',
    companyName: 'RITES LTD',
    division: '(QA DIVISION)',
    mainTitle: 'INSPECTION & TEST PLAN',
    productName: 'ELASTIC RAIL CLIP MK-III/MK-V',
    docNo: 'QA/WR/MECH',
    issueNo: '',
    pageNo: '9 of 18',
    effectiveDate: '',
    preparedBy: 'KJM',
    checkedBy: 'CSR',
    approvedBy: 'GM(I)/WR',
    // New fields for title and subtitle sections
    title: 'Stage Inspection for Raw material',
    subtitle: 'Test Result- Chemical Analysis',
    annexureNumber: 'Annexure-I',
    annexureCode: 'IRST-31-2025'
  };

  // Complex table headers with multi-row structure
  const tableHeaders = [
    { label: 'S. No.', rowSpan: 3, style: { width: '40px' } },
    { label: 'Date', rowSpan: 3, style: { width: '80px' } },
    { label: 'Source of Raw material name & trademark', rowSpan: 3, style: { width: '100px' } },
    { label: 'Certificate No.', rowSpan: 3, style: { width: '80px' } },
    { label: 'Cast / Heat No.', rowSpan: 3, style: { width: '80px' } },
    { label: 'Coil or code (bar Nos)', rowSpan: 3, style: { width: '80px' } },
    { label: 'Sample no.', rowSpan: 3, style: { width: '70px' } },
    
    // Chemical Analysis report - complex nested headers
    { label: 'Chemical Analysis report', colSpan: 6, style: { borderBottom: '1px solid #000' } },
    
    { label: 'Grain Size No (or finer)', rotated: true, rowSpan: 3, style: { width: '35px' } },
    { label: 'Inclusion Rating (thin) Finish 2.0 max.', rotated: true, rowSpan: 3, style: { width: '35px' } },
    { label: 'Hardness BRINELL/HV', rotated: true, rowSpan: 3, style: { width: '35px' } },
    { label: 'Depth of Decarb (d) 0.00 or 0.5 mm', rotated: true, rowSpan: 3, style: { width: '35px' } },
    { label: 'Freedom from Defects', rotated: true, rowSpan: 3, style: { width: '35px' } },
    { label: 'Accepted or Not Accepted', rotated: true, rowSpan: 3, style: { width: '35px' } },
    { label: 'Sign of Lab Supervisor', rotated: true, rowSpan: 3, style: { width: '35px' } }
  ];

  // Second row of headers for Chemical Analysis
  const chemicalHeaders = [
    { label: '%C', colSpan: 1 },
    { label: '%Mn', colSpan: 1 },
    { label: '%Si', colSpan: 1 },
    { label: '%S', colSpan: 1 },
    { label: '%P', colSpan: 1 }
  ];

  // Third row - Ladle analysis and Permissible range
  const analysisRows = [
    {
      label: 'Ladle analysis',
      values: ['0.50-0.60', '0.80-1.00', '1.50-2.00', '0.03 max.', '0.03 max.']
    },
    {
      label: 'Permissible range over ladle sample analysis',
      values: ['± 0.03', '± 0.04', '± 0.05', '± 0.005', '± 0.005']
    }
  ];

  // Generate table data rows
  const tableData = [];

  // Add header rows for chemical analysis (these will be part of thead in actual implementation)
  // For now, we'll create data rows

  // Sample data rows (4 rows as shown in image)
  const sampleRows = data.length > 0 ? data : [
    { sNo: 1, date: '', source: '', certNo: '', heatNo: '', coilCode: '', sampleNo: '', 
      c: '', mn: '', si: '', s: '', p: '', grainSize: '', inclusion: '', hardness: '', 
      decarb: '', freedom: '', accepted: '', sign: '' },
    { sNo: 2, date: '', source: '', certNo: '', heatNo: '', coilCode: '', sampleNo: '', 
      c: '', mn: '', si: '', s: '', p: '', grainSize: '', inclusion: '', hardness: '', 
      decarb: '', freedom: '', accepted: '', sign: '', 
      note: 'Stage 2C attached' },
    { sNo: 3, date: '', source: '', certNo: '', heatNo: '', coilCode: '', sampleNo: '', 
      c: '', mn: '', si: '', s: '', p: '', grainSize: '', inclusion: '', hardness: '', 
      decarb: '', freedom: '', accepted: '', sign: '' },
    { sNo: 4, date: '', source: '', certNo: '', heatNo: '', coilCode: '', sampleNo: '', 
      c: '', mn: '', si: '', s: '', p: '', grainSize: '', inclusion: '', hardness: '', 
      decarb: '', freedom: '', accepted: '', sign: '' }
  ];

  sampleRows.forEach((row) => {
    tableData.push({
      cells: [
        { value: row.sNo, isData: false },
        { value: row.date, isData: true },
        { value: row.source, isData: true },
        { value: row.certNo, isData: true },
        { value: row.heatNo, isData: true },
        { value: row.coilCode, isData: true },
        { value: row.sampleNo, isData: true },
        { value: row.c, isData: true },
        { value: row.mn, isData: true },
        { value: row.si, isData: true },
        { value: row.s, isData: true },
        { value: row.p, isData: true },
        { value: row.grainSize, isData: true },
        { value: row.inclusion, isData: true },
        { value: row.hardness, isData: true },
        { value: row.decarb, isData: true },
        { value: row.freedom, isData: true },
        { value: row.accepted, isData: true },
        { value: row.sign, isData: true }
      ]
    });
  });

  // Footer data
  // const footerData = {
  //   stampText: 'STAMP',
  //   ieName: 'Dharm Singh Fartyal',
  //   ieDesignation: 'Sr. Manager (Mech.)',
  //   ieLocation: 'RITES Ltd. / W.R. MUMBAI - 21'
  // };

  return (
    <AnnexureTemplate
      headerData={headerData}
      title="Stage Inspection for Raw material"
      subtitle="Test Result- Chemical Analysis"
      annexureNumber="Annexure-I"
      annexureCode="IRST-31 - 2025"
      tableHeaders={tableHeaders}
      tableData={tableData}
      footerData={footerData}
    />
  );
};

export default ChemicalAnalysisAnnexure;

