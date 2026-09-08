/**
 * Online Inspection Call Letter PDF Generator for Sleeper IE
 * Generates a properly formatted PDF matching the official RITES call letter format.
 * Uses jsPDF directly for robust formatting and reliable rendering.
 */

import jsPDF from 'jspdf';

/**
 * Helper: safely get a value or fallback string
 */
const val = (v, fallback = '-') => (v !== null && v !== undefined && String(v).trim() !== '' ? String(v).trim() : fallback);

/**
 * Main function to generate and download the Call Letter PDF
 * @param {object} call - Call data object from the dashboard
 * @param {boolean} shouldDownload - Whether to trigger browser download immediately
 */
export const generateCallLetterPDF = (call, shouldDownload = true) => {
    if (!call) return null;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;
    const tableWidth = pageW - margin * 2;
    const col1W = 70;
    const col2W = tableWidth - col1W;

    // ─── Colour palette ───────────────────────────────────────────────
    const BLACK = [0, 0, 0];
    const RED = [180, 0, 0];
    const DARK = [30, 30, 30];
    const GRAY_BG = [245, 245, 245];
    const BORDER = [180, 180, 180];

    let y = margin; // current Y cursor

    // ─── Utility helpers ─────────────────────────────────────────────
    const setFont = (style = 'normal', size = 9, color = BLACK) => {
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        doc.setTextColor(...color);
    };

    /**
     * Check remaining page space and add new page if needed
     */
    const checkPageBreak = (needed = 20) => {
        if (y + needed > pageH - margin) {
            doc.addPage();
            y = margin;
        }
    };

    /**
     * Draw a two-column table row
     */
    const drawRow = (label, value, opts = {}) => {
        const labelLines = doc.splitTextToSize(label, col1W - 4);

        let valLinesCount = 1;
        const textVal = typeof value === 'object' && !Array.isArray(value) ? (value?.text || '') : val(value);
        if (textVal && !opts.valueFn) {
            valLinesCount = doc.splitTextToSize(textVal, col2W - 4).length;
        }

        const maxLines = Math.max(labelLines.length, valLinesCount);
        const calculatedH = maxLines * 4.5 + 4.5;
        const rowH = Math.max(opts.rowH || 9, calculatedH);

        const labelBold = opts.labelBold || false;
        const valueFn = opts.valueFn || null;

        checkPageBreak(rowH + 2);

        // Row background
        if (opts.bg) {
            doc.setFillColor(...opts.bg);
            doc.rect(margin, y, tableWidth, rowH, 'F');
        }

        // Draw cell borders
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.2);
        doc.rect(margin, y, col1W, rowH);
        doc.rect(margin + col1W, y, col2W, rowH);

        // Label text
        setFont(labelBold ? 'bold' : 'normal', 9, DARK);
        const labelLineH = 4.5;
        const labelBlockH = labelLines.length * labelLineH;
        const labelStartY = y + (rowH - labelBlockH) / 2 + 3.0;
        labelLines.forEach((line, i) => {
            doc.text(line, margin + 2, labelStartY + i * labelLineH);
        });

        // Value text
        if (valueFn) {
            valueFn(margin + col1W + 2, y + rowH / 2 + 1.5);
        } else if (Array.isArray(value)) {
            let xOff = margin + col1W + 2;
            value.forEach(seg => {
                setFont('normal', 9, seg.color || RED);
                doc.text(seg.text, xOff, y + rowH / 2 + 1.5);
                xOff += doc.getTextWidth(seg.text) + 1;
            });
        } else {
            setFont('normal', 9, typeof value === 'object' && value?.color ? value.color : RED);
            const maxW = col2W - 4;
            const lines = doc.splitTextToSize(textVal, maxW);
            const lineH = 4.5;
            const valBlockH = lines.length * lineH;
            const valStartY = y + (rowH - valBlockH) / 2 + 3.0;
            lines.forEach((line, i) => {
                doc.text(line, margin + col1W + 2, valStartY + i * lineH);
            });
        }

        y += rowH;
    };

    /**
     * Draw a full-width row spanning both columns
     */
    const drawFullRow = (text, opts = {}) => {
        const rowH = opts.rowH || 10;
        checkPageBreak(rowH + 2);

        if (opts.bg) {
            doc.setFillColor(...opts.bg);
            doc.rect(margin, y, tableWidth, rowH, 'F');
        }
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.2);
        doc.rect(margin, y, tableWidth, rowH);
        setFont(opts.bold ? 'bold' : 'normal', opts.size || 9, opts.color || DARK);
        const lines = doc.splitTextToSize(text, tableWidth - 4);
        let ty = y + 3.5;
        lines.forEach(line => {
            doc.text(line, margin + 2, ty);
            ty += 4.5;
        });
        y += rowH;
    };

    /**
     * Draw a bold centered title row
     */
    const drawTitleRow = (text) => {
        const rowH = 11;
        checkPageBreak(rowH + 2);
        doc.setFillColor(...GRAY_BG);
        doc.rect(margin, y, tableWidth, rowH, 'F');
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.2);
        doc.rect(margin, y, tableWidth, rowH);
        setFont('bold', 11, BLACK);
        doc.text(text, pageW / 2, y + rowH / 2 + 1.5, { align: 'center' });
        y += rowH;
    };

    // ═══════════════════════════════════════════════════════════════════
    // HEADER SECTION
    // ═══════════════════════════════════════════════════════════════════
    const now = new Date();
    const printDateTime = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toLowerCase()}`;
    const callNumberStr = val(call.callNumber || call.callNo || call.call_no || call.requestId);

    setFont('normal', 7.5, [100, 100, 100]);
    doc.text(
        `Generated on: ${printDateTime}  |  Call No: ${callNumberStr}  |  System: RITES Sarthi`,
        pageW / 2,
        y + 5,
        { align: 'center' }
    );
    y += 8;

    drawTitleRow('Online Inspection Call Letter');
    y += 2;

    // FROM row
    const vendorNameStr = call.vendorName || call.companyName || call.firmDetails || call.vendor_name || '-';
    const rawAddress = call.unitAddress || call.vendorAddress || call.location || '';
    const fromValue = (rawAddress && rawAddress !== vendorNameStr && !String(vendorNameStr).toLowerCase().includes(String(rawAddress).toLowerCase()))
        ? `${vendorNameStr} - ${rawAddress}`
        : vendorNameStr;
    drawRow('From', fromValue || '-', { rowH: 9 });

    // DATE row
    const rawDate = call.submissionDateTime || call.callDate || call.submissionDate || call.created_at || call.desiredInspectionDate;
    const formattedDate = rawDate
        ? (String(rawDate).includes('T') ? String(rawDate).split('T')[0] : String(rawDate))
        : new Date().toLocaleDateString('en-GB');
    drawRow('Date', formattedDate, { rowH: 9 });

    // TO row
    const getRioAddress = () => {
        const scrCodeToRio = {
            'ECR': 'ERIO', 'ER': 'ERIO', 'SER': 'ERIO', 'ECOR': 'ERIO',
            'NR':  'NRIO', 'NWR': 'NRIO', 'NFR': 'NRIO', 'NER': 'NRIO',
            'NCR': 'CRIO', 'CR': 'CRIO', 'WCR': 'CRIO',
            'WR':  'WRIO', 'SWR': 'WRIO',
            'SR':  'SRIO', 'SCR': 'SRIO',
        };
        const rawScrCode = String(call.scrCode || call.rlyShortName || '').trim().toUpperCase();
        const rioFromScr = rawScrCode ? (scrCodeToRio[rawScrCode] || null) : null;
        let rioName = String(call.rio || call.rioCode || call.rioName || rioFromScr || 'CRIO').toUpperCase();

        if (rioName.includes('CRIO') || rioName.includes('CR') || rioName.includes('CENTRAL')) {
            return [
                '(SBU Head/CRIO)',
                'CENTRAL REGION INSPECTION OFFICE',
                'RITES LTD. (A Govt. of India Enterprise)',
                '50, EXPANSION BUIDING,BHILAI STEEL PLANT AREA',
                'BHILAI -490001',
                '0788-2227365, sbu.cinsp@rites.com'
            ].join('\n');
        } else if (rioName.includes('ERIO') || rioName.includes('ER')) {
            return [
                '(SBU Head, ERIO)',
                'Eastern Region Inspection Office',
                'RITES LTD. (A Govt. of India Enterprise)',
                'OJAS BHAWAN, 7TH FLOOR, PLOT NO. DJ/20, STREET NO.326,',
                'ACTION AREA 1D, NEW TOWN, KOLKATA - 700 156',
                '033-23572946, sbu.einsp@rites.com'
            ].join('\n');
        } else if (rioName.includes('WRIO') || rioName.includes('WR')) {
            return [
                '(SBU Head/WRIO)',
                'WESTERN REGION INSPECTION OFFICE',
                'RITES LTD. (A Govt. of India Enterprise)',
                '5TH FLOOR, REGENT CHAMBER, ABOVE STATUS RESTAURANT,',
                'NARIMAN POINT, MUMBAI - 400021',
                '022-22026130, sbu.winsp@rites.com'
            ].join('\n');
        } else if (rioName.includes('SRIO') || rioName.includes('SR')) {
            return [
                '(SBU Head/SRIO)',
                'SOUTHERN REGION INSPECTION OFFICE',
                'RITES LTD. (A Govt. of India Enterprise)',
                'CTS BUILDING - 2ND FLOOR, BSNL COMPLEX, NO. 16,',
                'GREAMS ROAD CHENNAI - 600006',
                '044-28292728, sbu.sinsp@rites.com'
            ].join('\n');
        }
        return [
            '(SBU Head/NRIO)',
            'NORTHERN REGION INSPECTION OFFICE',
            'RITES LTD. (A Govt. of India Enterprise)',
            '12TH FLOOR, CORE-2, SCOPE MINAR,',
            'LAXMI NAGAR, DELHI-110092',
            '011-22402502, sbu.ninsp@rites.com'
        ].join('\n');
    };
    drawRow('To', getRioAddress(), { color: DARK });

    // Body text block
    y += 1;
    const bodyText = 'Dear Sir,\nPlease arrange to inspect following goods lying ready with us. It is certified that the stores offered conform to governing specifications.';
    drawFullRow(bodyText, { rowH: 12 });

    // Inspection Call Number
    drawRow('Inspection Call Number', callNumberStr, { rowH: 9 });

    // Case Number
    drawRow('Case No.', val(call.caseNo || call.case_no), { rowH: 9 });

    // IE
    const rawIeName = call.assignedIeName || call.ieName || call.assignedIE;
    const isIeAssigned = rawIeName && rawIeName !== 'Not Assigned' && rawIeName !== '-';
    const ieMobile = call.assignedIeMobile || call.ieMobile;
    const ieValue = isIeAssigned
        ? `${rawIeName}${ieMobile ? ' (' + ieMobile + ')' : ''}`
        : '-';
    drawRow('IE', ieValue, { rowH: 9 });

    // Stage of Inspection
    drawRow('Stage of Inspection', { text: 'Final Inspection', color: DARK }, { rowH: 9 });

    // PO Number & Date
    let poBase;
    if (call.rlyPoSr && call.rlyPoSr !== '-') {
        poBase = call.rlyPoSr;
    } else {
        const parts = [
            call.rlyShortName && call.rlyShortName !== '-' ? call.rlyShortName : null,
            (call.poNumber || call.poNo) && (call.poNumber || call.poNo) !== '-' ? (call.poNumber || call.poNo) : null,
            (call.poSerialNo || call.srNo || call.itemSrNo) && (call.poSerialNo || call.srNo || call.itemSrNo) !== '-' ? (call.poSerialNo || call.srNo || call.itemSrNo) : null
        ].filter(Boolean);
        poBase = parts.join(' / ') || (call.poNumber || call.poNo || '-');
    }
    const poValue = [
        poBase,
        call.poDate ? `Date of PO: ${call.poDate}` : ''
    ].filter(Boolean).join('\n');
    drawRow('PO Number & Date', poValue);

    // PO Sr. No Item Description
    const itemDescText = val(call.itemDesc || call.itemDescription || 'MANUFACTURE AND SUPPLY OF PRESTRESSED MONO-BLOCK CONCRETE LINE SLEEPERS (RT-8746) (PRETENSIONED TYPE) FOR BROAD GAUGE(1673 MM)');
    drawRow('PO Sr. No Item Description', itemDescText);

    // Product Selected By Vendor
    const prodName = call.productType || call.productSelectedByVendor || call.product || call.sleeperType || 'Prestressed Concrete Sleepers';
    drawRow('Product Selected By Vendor', val(prodName), { rowH: 9 });

    // Quantity formatter
    const uomText = call.uom || call.unit || call.callUnit || 'Nos.';
    const formatQtyWithUom = (qtyVal, defaultUom = uomText) => {
        if (qtyVal === null || qtyVal === undefined || String(qtyVal).trim() === '') return '-';
        const str = String(qtyVal).trim();
        if (/[a-zA-Z]/.test(str)) return str;
        return `${str} ${defaultUom}`;
    };

    // PO Sr. No. Qty
    drawRow('PO Sr. No. Qty', formatQtyWithUom(call.poQty || call.poSrQty || call.poQuantity), { rowH: 9 });

    // Call Qty
    drawRow('Call Qty', formatQtyWithUom(call.callQty || call.totalOffered || call.qtyOffered), { rowH: 9 });

    // DP Dates
    drawRow('Orignal DP Date', val(call.deliveryDate || call.originalDeliveryDate || call.origDp || call.dpDate), { rowH: 9 });
    drawRow('Ext DP Date', val(call.extendedDeliveryDate || call.extDp || call.extDpDate), { rowH: 9 });
    drawRow('Desired Date of Inspection', val(call.desiredInspectionDate || call.callDate || formattedDate), { rowH: 9 });

    // Purchaser / Consignee / Bill Paying Authority
    const formatTildeStr = (str) => {
        if (!str) return '-';
        return String(str).includes('~')
            ? String(str).split('~').map(s => s.trim()).filter(s => s && s !== '#').join(', ')
            : String(str);
    };
    drawRow('Purchaser', formatTildeStr(call.purchaserDetail || call.purchasingAuthority), { rowH: 9 });
    drawRow('Consignee', formatTildeStr(call.consigneeDetail || call.consignee || call.consigneeName), { rowH: 9 });
    drawRow('Bill Paying Authority', formatTildeStr(call.billPayOffDesc || call.billPayingOfficer || call.billPayingAuthority), { rowH: 9 });

    // Manufacturer
    drawRow("Manufacturer's Name", val(call.manufacturerName || call.vendorName || call.vendor?.name), { rowH: 9 });

    // Place of Inspection
    const poiVal = call.placeOfInspection || call.plantName || call.plantId || rawAddress || '-';
    drawRow('Place of Inspection', val(poiVal), { rowH: 9 });

    // Offered Installment Number
    drawRow('Offered Installment Number', val(call.submissionCount || call.offeredInstallmentNo || '1'), { rowH: 9 });

    // Raw Material & Accepted Qty
    drawRow('Raw Material Qty Already Passed for this PO Sr. No.', val(call.rawMaterialQtyPassed, 'N/A'), { rowH: 9 });
    drawRow('Final Accepted Qty of this PO Sr. No.', formatQtyWithUom(call.finalAcceptedQty || call.acceptedTillNow || '0'), { rowH: 9 });
    drawRow('Total PO Quantity', formatQtyWithUom(call.totalPoQty || call.poQuantity || call.poQty), { rowH: 9 });
    drawRow('Total PO Value', val(call.totalPoValue || call.poValue), { rowH: 9 });

    // Batches Details
    let batchDisplay = '-';
    if (call.heatDetails && call.heatDetails.length > 0) {
        batchDisplay = call.heatDetails.map(h =>
            `${h.heatNo || 'Batch'}: ${val(h.tcNo)}, Qty: ${val(h.qtyOffered)} Nos.`
        ).join('\n');
    } else if (call.batchesSelected && call.batchesSelected.length > 0) {
        batchDisplay = call.batchesSelected.map(b =>
            `Batch ${b.batchNo}: Good: ${b.goodSleepers ? (Array.isArray(b.goodSleepers) ? b.goodSleepers.length : b.goodSleepers) : 0}${b.badSleepers && (Array.isArray(b.badSleepers) ? b.badSleepers.length > 0 : b.badSleepers > 0) ? ' | Rejected: ' + (Array.isArray(b.badSleepers) ? b.badSleepers.length : b.badSleepers) : ''}`
        ).join('\n');
    } else if (call.batches) {
        batchDisplay = `Total Batches Offered: ${call.batches} | Total Sleepers: ${call.qtyOffered || call.totalOffered || '-'}`;
    }
    drawRow('Batches / Stores Details to be offered', batchDisplay);

    // Remarks
    drawRow('Remarks', val(call.remarks || call.remark), { rowH: 9 });

    // Terms & Closing
    drawFullRow('I hereby accept all the Terms and Conditions.', { rowH: 8, bold: false });
    y += 2;
    drawFullRow('Thanking you,', { rowH: 7 });
    drawFullRow('Yours Faithfully,', { rowH: 7 });

    drawRow('Name', val(call.contactPersonName || call.vendorName || call.vendor?.name), { rowH: 9 });
    drawRow('Mobile', val(call.contactMobile || call.mobile || call.contactPhone), { rowH: 9 });
    drawRow('Vendor Email', val(call.contactEmail || call.email), { rowH: 9 });

    // Save
    if (shouldDownload) {
        const filename = `Call_Letter_${String(callNumberStr).replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
        doc.save(filename);
    }
    return doc;
};

export default generateCallLetterPDF;
