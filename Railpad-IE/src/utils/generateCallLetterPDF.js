import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates the official Online Inspection Call Letter PDF matching Railpad Vendor requested calls format.
 * 
 * @param {Object} call - The inspection call object or summary object
 * @param {boolean} shouldDownload - Whether to trigger auto-download
 */
export const generateRailpadCallLetterPDF = (call, shouldDownload = true) => {
    if (!call) return;

    const merged = { ...call };
    const callNo = merged.callNo || merged.call_no || merged.callNumber || merged.requestId || 'CALL_LETTER';

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth(); // 210
    const margin = 12;
    const tableW = pageW - margin * 2; // 186
    const darkText = [15, 23, 42];

    const callTypeUpper = (merged.callType || merged.typeOfCall || (String(callNo).startsWith('RPP') ? 'PROCESS' : 'FINAL')).toUpperCase();

    // Vendor / From details
    const vendorName = merged.vendorName || merged.companyName || merged.firmDetails || merged.vendor_name || '';
    const vendorAddress = merged.unitAddress || merged.placeOfInspection || merged.vendorAddress || merged.location || '';

    // RIO To address resolution
    const getRioDetails = (rioCode) => {
        const code = String(rioCode || '').trim().toUpperCase();
        if (code === 'CRIO' || code === 'CR' || code.includes('CENTRAL')) {
            return {
                code: 'CRIO',
                region: 'Central Region',
                officeName: 'CENTRAL REGION INSPECTION OFFICE',
                address: '50, EXPANSION BUIDING,BHILAI STEEL PLANT AREA\nBHILAI -490001',
                contactInfo: '0788-2227365, sbu.cinsp@rites.com'
            };
        } else if (code === 'ERIO' || code === 'ER' || (code.includes('ER') && !code.includes('SERVER'))) {
            return {
                code: 'ERIO',
                region: 'Eastern Region',
                officeName: 'EASTERN REGION INSPECTION OFFICE',
                address: 'OJAS BHAWAN, 7TH FLOOR, PLOT NO. DJ/20, STREET NO.326,\nACTION AREA 1D, NEW TOWN, KOLKATA - 700 156',
                contactInfo: '033-23572946, sbu.einsp@rites.com'
            };
        } else if (code === 'NRIO' || code === 'NR' || (code.includes('NR') && code !== 'NWR')) {
            return {
                code: 'NRIO',
                region: 'Northern Region',
                officeName: 'NORTHERN REGION INSPECTION OFFICE',
                address: '12TH FLOOR, CORE-2, SCOPE MINAR,\nLAXMI NAGAR, DELHI-110092',
                contactInfo: '011-22402502, sbu.ninsp@rites.com'
            };
        } else if (code === 'WRIO' || code === 'WR' || code === 'SWR' || code === 'WCR' || (code.endsWith('WR') && code !== 'NWR')) {
            return {
                code: 'WRIO',
                region: 'Western Region',
                officeName: 'WESTERN REGION INSPECTION OFFICE',
                address: '5TH FLOOR, REGENT CHAMBER, ABOVE STATUS RESTAURANT,\nNARIMAN POINT, MUMBAI - 400021',
                contactInfo: '022-22026130, sbu.winsp@rites.com'
            };
        } else if (code === 'SRIO' || code === 'SR' || code.includes('SOUTHERN')) {
            return {
                code: 'SRIO',
                region: 'Southern Region',
                officeName: 'SOUTHERN REGION INSPECTION OFFICE',
                address: 'CTS BUILDING - 2ND FLOOR, BSNL COMPLEX, NO. 16,\nGREAMS ROAD CHENNAI - 600006',
                contactInfo: '044-28292728, sbu.sinsp@rites.com'
            };
        }
        return {
            code: 'NRIO',
            region: 'Northern Region',
            officeName: 'NORTHERN REGION INSPECTION OFFICE',
            address: '12TH FLOOR, CORE-2, SCOPE MINAR,\nLAXMI NAGAR, DELHI-110092',
            contactInfo: '011-22402502, sbu.ninsp@rites.com'
        };
    };

    const scrCodeToRio = {
        'ECR': 'ERIO', 'ER': 'ERIO', 'SER': 'ERIO', 'ECOR': 'ERIO',
        'NR':  'NRIO', 'NWR': 'NRIO', 'NFR': 'NRIO', 'NER': 'NRIO',
        'NCR': 'CRIO', 'CR': 'CRIO', 'WCR': 'CRIO',
        'WR':  'WRIO', 'SWR': 'WRIO',
        'SR':  'SRIO', 'SCR': 'SRIO',
    };

    const rawScrCode = String(merged.scrCode || merged.rlyShortName || '').trim().toUpperCase();
    const rioFromScr = rawScrCode ? (scrCodeToRio[rawScrCode] || null) : null;
    const rawRioCode = merged.rio || merged.rioCode || merged.rioName || rioFromScr || merged.region;
    const rio = getRioDetails(rawRioCode);

    // Call Date
    const rawCallDate = merged.inspectionDate || merged.created_at || merged.callDate || new Date().toLocaleDateString('en-GB');
    const formattedCallDate = typeof rawCallDate === 'string' && rawCallDate.includes('T') ? rawCallDate.split('T')[0] : String(rawCallDate);

    // Contact info
    const contactPhone = merged.contactMobile || merged.mobile || merged.phone || merged.contactPhone || '-';
    const contactEmail = merged.contactEmail || merged.email || '';
    const ieName = merged.ieAssignedName || merged.assignedIeName || merged.ieName || merged.assignedIE || '-';

    // PO details
    const poNo = merged.poNo || merged.rlyPoSr || merged.poNumber || merged.rlyPoNo || merged.po_no || '';
    const poDate = merged.poDate || '';
    const purchaser = merged.purchaserDetail || merged.purchaser || merged.purchasingAuthority || '';

    // Item details
    let itemDescStr = merged.itemDesc || merged.itemDescription || (merged.drawingNo ? `COMPOSITE GROOVED RUBBER SOLE PLATES 10 MM THICK FOR WIDER PSC SLEEPERS TO USE WITH 60KG (UIC) & 52KG RAILS TO RDSO DRG NO ${merged.drawingNo}, WITH LATEST ALTERATION IF ANY, SPECIFICATION: IRS T 55-2025 WITH LATEST ALTERATIONS.` : '10.00mm CGRSP');

    const consigneeVal = merged.consigneeDetail || merged.consignee || '-';

    const isProcess = callTypeUpper === 'PROCESS' || String(callNo).startsWith('RPP');
    let effectiveUom = 'Nos.';
    let effectiveOfferedQty = merged.totalOfferedQty || merged.totalQty || merged.qtyOffered || merged.quantityNowOffered || merged.quantity || '';
    let effectiveOrderQty = merged.poSrQty || merged.poQty || merged.orderQty || merged.qtyOnOrder || merged.totalQty || '';

    const dpPeriod = merged.deliveryDate || merged.origDp || merged.dpDate || merged.extDp || '-';
    const billPayOfficer = merged.billPayOffDesc || merged.billPayingOfficer || merged.billPayingAuthority || '-';

    const redTextColor = [220, 38, 38]; // #DC2626
    const labelTextColor = [30, 41, 59]; // #1E293B
    const borderLineColor = [156, 163, 175]; // #9CA3AF / silver grey

    const now = new Date();
    const formattedGenDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toLowerCase()}`;

    // Header Top Bar
    const topBarText = `Generated on: ${formattedGenDate}  |  Call No: ${callNo}  |  System: RITES Sarthi`;
    
    autoTable(doc, {
        startY: margin,
        margin: { left: margin, right: margin },
        tableWidth: tableW,
        body: [[{ content: topBarText, styles: { halign: 'center', fontSize: 7.5, textColor: [71, 85, 105] } }]],
        theme: 'plain',
        styles: {
            fillColor: [248, 250, 252],
            lineWidth: 0.15,
            lineColor: borderLineColor,
            cellPadding: 1.5,
            font: 'helvetica'
        }
    });

    let currentY = doc.lastAutoTable.finalY + 1;

    // Main Title Block
    autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        tableWidth: tableW,
        body: [[{ content: 'Online Inspection Call Letter', styles: { halign: 'center', fontStyle: 'bold', fontSize: 11, textColor: labelTextColor } }]],
        theme: 'plain',
        styles: {
            fillColor: [241, 245, 249],
            lineWidth: 0.15,
            lineColor: borderLineColor,
            cellPadding: 2.5,
            font: 'helvetica'
        }
    });

    currentY = doc.lastAutoTable.finalY + 1;

    const redVal = (text, fallback = '-') => {
        const str = text !== null && text !== undefined && String(text).trim() !== '' ? String(text) : fallback;
        return { content: str, styles: { textColor: redTextColor, fontStyle: 'bold' } };
    };

    const redValNormal = (text, fallback = '-') => {
        const str = text !== null && text !== undefined && String(text).trim() !== '' ? String(text) : fallback;
        return { content: str, styles: { textColor: redTextColor, fontStyle: 'normal' } };
    };

    const displayFrom = `${vendorName}${vendorAddress ? ' - ' + vendorAddress : ''}`;
    const displayTo = `(SBU Head/${rio.code || 'NRIO'})\n${rio.officeName || 'NORTHERN REGION INSPECTION OFFICE'}\nRITES LTD. (A Govt. of India Enterprise)\n${rio.address}${rio.contactInfo ? '\n' + rio.contactInfo : ''}`;
    const displayPoNoDate = `${merged.rlyPoNoSerial || merged.rlyPoNo || poNo}\nDate of PO: ${poDate || '-'}`;
    
    const stageDisplay = isProcess ? 'Process Inspection' : (merged.stageOfInspection || 'Final Inspection');

    const uomText = merged.unit || effectiveUom || 'Nos.';
    const poQtyDisplay = merged.poQty || merged.poSrQty || effectiveOrderQty ? `${merged.poQty || merged.poSrQty || effectiveOrderQty} ${uomText}` : '-';
    const callQtyDisplay = effectiveOfferedQty ? `${effectiveOfferedQty} ${uomText}` : '-';

    const origDpDisplay = merged.origDp || merged.deliveryDate || dpPeriod || '-';
    const extDpDisplay = merged.extDp || '-';
    const desiredInspDate = formattedCallDate || '-';

    const purchaserDisplay = merged.purchasingAuthority || purchaser || '-';
    const consigneeDisplay = merged.consignee || consigneeVal || '-';
    const bpoDisplay = merged.billPayingOfficer || billPayOfficer || '-';
    const manufacturerDisplay = merged.manufacturerName || vendorName || '-';

    const finalAccQty = merged.finalAcceptedQty ? `${merged.finalAcceptedQty} ${uomText}` : `0 ${uomText}`;
    const rawTotalPoQty = merged.totalPoQty || merged.poQty || merged.poSrQty || effectiveOrderQty;
    const totalPoQtyVal = rawTotalPoQty
        ? (String(rawTotalPoQty).match(/[a-zA-Z]/) ? rawTotalPoQty : `${rawTotalPoQty} ${uomText}`)
        : '-';
    const totalPoValDisplay = merged.totalPoValue || merged.poValue || '-';
    const prodSelectedVendor = merged.productSelectedByVendor || merged.railPadType || merged.product || merged.productType || '10.00mm CGRSP';

    const mainTableBody = [
        ['From', redVal(displayFrom)],
        ['Date', redVal(formattedCallDate)],
        ['To', redValNormal(displayTo)],
        [{ content: 'Dear Sir,\nPlease arrange to inspect following goods lying ready with us. It is certified that the stores offered conform to governing specifications.', colSpan: 2, styles: { fontSize: 8, fontStyle: 'normal', textColor: labelTextColor } }],
        ['Inspection Call Number', redVal(callNo)],
        ['IE', redValNormal(ieName || '-')],
        ['Stage of Inspection', { content: stageDisplay, styles: { textColor: [30, 41, 59], fontStyle: 'normal' } }],
        ['PO Number & Date', redVal(displayPoNoDate)],
        ['PO Sr. No Item Description', redValNormal(itemDescStr)],
        ['Product Selected By Vendor', redValNormal(prodSelectedVendor)],
        ['PO Sr. No. Qty', redVal(poQtyDisplay)],
        ['Call Qty', redVal(callQtyDisplay)],
        ['Orignal DP Date', redVal(origDpDisplay)],
        ['Ext DP Date', redValNormal(extDpDisplay)],
        ['Desired Date of Inspection', redVal(desiredInspDate)],
        ['Purchaser', redVal(purchaserDisplay)],
        ['Consignee', redVal(consigneeDisplay)],
        ['Bill Paying Authority', redValNormal(bpoDisplay)],
        ['Manufacturer\'s Name', redVal(manufacturerDisplay)],
        ['Final Accepted Qty of this PO Sr. No.', redVal(finalAccQty)],
        ['Total PO Quantity', redVal(totalPoQtyVal)],
        ['Total PO Value', redVal(totalPoValDisplay)],
        [{ content: 'I hereby accept all the Terms and Conditions.', colSpan: 2, styles: { fontSize: 8.5, textColor: labelTextColor } }],
        [{ content: 'Thanking you,', colSpan: 2, styles: { fontSize: 8.5, textColor: labelTextColor } }],
        [{ content: 'Yours Faithfully,', colSpan: 2, styles: { fontSize: 8.5, textColor: labelTextColor } }],
        ['Name', redVal(vendorName)],
        ['Mobile', redValNormal(contactPhone)],
        ['Vendor Email', redValNormal(contactEmail ? `:${contactEmail}` : '-')]
    ];

    autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        tableWidth: tableW,
        body: mainTableBody,
        theme: 'plain',
        styles: {
            textColor: labelTextColor,
            cellPadding: 2,
            lineWidth: 0.15,
            lineColor: borderLineColor,
            font: 'helvetica',
            fontSize: 8.5,
            valign: 'middle'
        },
        columnStyles: {
            0: { cellWidth: 70, fontStyle: 'normal', textColor: labelTextColor },
            1: { cellWidth: tableW - 70 }
        }
    });

    if (shouldDownload) {
        const cleanCallNo = String(callNo || 'CALL_LETTER').replace(/[^a-zA-Z0-9-_]/g, '_');
        doc.save(`Call_Letter_${cleanCallNo}.pdf`);
    }
    return doc;
};
