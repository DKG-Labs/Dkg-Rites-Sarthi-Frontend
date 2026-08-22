/**
 * Online Inspection Call Letter PDF Generator
 * Generates a properly formatted PDF matching the official call letter format.
 * Uses jsPDF for PDF generation.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Helper: safely get a value or fallback string
 */
const val = (v, fallback = '-') => (v !== null && v !== undefined && v !== '' ? String(v) : fallback);

/**
 * Check if the call is a Railpad call
 */
const isRailpadCall = (c) => {
    if (!c) return false;
    const callNum = String(c.callNumber || c.callNo || c.call_no || c.requestId || '').toUpperCase();
    if (callNum.startsWith('RPP-') || callNum.startsWith('RPF-') || callNum.includes('RPP') || callNum.includes('RPF')) {
        return true;
    }
    const type = String(c.callType || c.itemType || c.productType || c.railPadType || c.ercType || '').toUpperCase();
    if (type.includes('RAILPAD') || type.includes('RAIL_PAD') || type.includes('GRSP') || type.includes('CGRSP') || type.includes('NCRGRSP')) {
        return true;
    }
    return false;
};

/**
 * Generates the official Online Inspection Call Letter PDF matching Railpad Vendor format.
 
*/
export const generateRailpadCallLetterPDF = (call, shouldDownload = true) => {
    if (!call) return;

    const merged = { ...call };
    const callNo = merged.callNumber || merged.callNo || merged.call_no || merged.requestId || 'CALL_LETTER';

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth(); // 210
    const margin = 12;
    const tableW = pageW - margin * 2; // 186
    const lightBlueBorder = [186, 214, 251]; // #bad6fb
    const darkText = [15, 23, 42];

    const callTypeUpper = (merged.callType || merged.typeOfCall || (String(callNo).startsWith('RPP') ? 'PROCESS' : 'FINAL')).toUpperCase();
    const stageText = `STAGE CALL(${callTypeUpper})`;

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
            code: 'CRIO',
            region: 'Central Region',
            officeName: 'CENTRAL REGION INSPECTION OFFICE',
            address: '50, EXPANSION BUIDING,BHILAI STEEL PLANT AREA\nBHILAI -490001',
            contactInfo: '0788-2227365, sbu.cinsp@rites.com'
        };
    };

    // Mapping of Railway SCR codes to RITES RIO regions
    // Used as fallback when rio/rioCode is not returned by backend API
    const scrCodeToRio = {
        'ECR': 'ERIO', 'ER': 'ERIO', 'SER': 'ERIO', 'ECOR': 'ERIO',
        'NR': 'NRIO', 'NWR': 'NRIO', 'NFR': 'NRIO', 'NER': 'NRIO',
        'NCR': 'CRIO', 'CR': 'CRIO', 'WCR': 'CRIO',
        'WR': 'WRIO', 'SWR': 'WRIO',
        'SR': 'SRIO', 'SCR': 'SRIO',
    };

    const rawScrCode = String(merged.scrCode || merged.rlyShortName || '').trim().toUpperCase();
    const rioFromScr = rawScrCode ? (scrCodeToRio[rawScrCode] || null) : null;

    const rawRioCode = merged.rio || merged.rioCode || merged.rioName || rioFromScr || merged.region;
    const rio = getRioDetails(rawRioCode);

    // Call Serial & Date
    const rawCallDate = merged.inspectionDate || merged.created_at || merged.callDate || new Date().toLocaleDateString('en-GB');
    const formattedCallDate = typeof rawCallDate === 'string' && rawCallDate.includes('T') ? rawCallDate.split('T')[0] : String(rawCallDate);

    // Contact info
    const contactName = merged.contactPersonName || merged.contactPerson || merged.vendorName || merged.companyName || '';
    const contactPhone = merged.contactMobile || merged.mobile || merged.phone || '';
    const contactEmail = merged.contactEmail || merged.email || '';
    const ieName = merged.ieAssignedName || merged.assignedIeName || merged.ieName || merged.assignedIE || '';

    // PO & Case details
    const poNo = merged.poNo || merged.rlyPoSr || merged.poNumber || merged.rlyPoNo || '';
    const poDate = merged.poDate || '';
    const poFullNo = poNo ? (poDate ? `${poNo} Dated:${poDate}` : poNo) : '';
    const purchaser = merged.purchaserDetail || merged.purchaser || merged.purchasingAuthority || '';
    const caseNo = merged.caseNo || merged.callNo || merged.call_no || '';

    // Item details / Description of stores
    let itemDescStr = merged.itemDesc || merged.itemDescription || (merged.drawingNo ? `COMPOSITE GROOVED RUBBER SOLE PLATES 10 MM THICK FOR WIDER PSC SLEEPERS TO USE WITH 60KG (UIC) & 52KG RAILS TO RDSO DRG NO ${merged.drawingNo}, WITH LATEST ALTERATION IF ANY, SPECIFICATION: IRS T 55-2025 WITH LATEST ALTERATIONS.` : (merged.railPadType ? `RAIL PAD - ${merged.railPadType}` : 'RAIL PAD INSPECTION'));

    const consigneeVal = merged.consigneeDetail || merged.consignee || '';

    // Determine UOM and Quantities:
    const isProcessCall = (merged.callType || '').toUpperCase() === 'PROCESS' || String(callNo || '').startsWith('RPP-');
    let effectiveUom = 'Nos.';
    let effectiveOfferedQty = merged.totalOfferedQty || merged.totalQty || merged.qtyOffered || merged.quantityNowOffered || '';
    let effectiveOrderQty = merged.poSrQty || merged.poQty || merged.orderQty || merged.qtyOnOrder || merged.totalQty || '';

    if (isProcessCall) {
        effectiveUom = 'Nos.';
        effectiveOfferedQty = merged.totalQty || merged.totalOfferedQty || merged.qtyOffered || '';
    } else {
        const rawUom = merged.uom || merged.poUom || '';
        if (rawUom) {
            effectiveUom = rawUom.trim();
        } else if (merged.noOfSets && Number(merged.noOfSets) > 0) {
            effectiveUom = 'Set';
        } else {
            effectiveUom = 'Nos.';
        }

        if (effectiveUom.toUpperCase().includes('SET')) {
            if (merged.noOfSets && Number(merged.noOfSets) > 0) {
                effectiveOfferedQty = merged.noOfSets;
            } else if (merged.totalSets && Number(merged.totalSets) > 0) {
                effectiveOfferedQty = merged.totalSets;
            }
        }
    }

    const formatQtyWithUom = (q) => {
        if (!q && q !== 0) return '-';
        const num = Number(q);
        return isNaN(num) ? `${q} ${effectiveUom}` : `${num.toLocaleString()} ${effectiveUom}`;
    };

    const dpPeriod = merged.deliveryDate || merged.origDp || merged.dpDate || merged.extDp || '';
    const billPayOfficer = merged.billPayOffDesc || merged.billPayingOfficer || merged.billPayingAuthority || '';

    // Extract PO Item Serial No (Sr. No.) strictly prioritizing the call's stored PO Serial
    const resolvePoSrNo = (obj, fallbackIdx = 1) => {
        const target = obj || merged;

        // 1. Check if call's po_no / poNo is composite (e.g. "60265359103833/001" or "60265359103833 / 001")
        const callPo = String(target.po_no || target.poNo || merged.po_no || merged.poNo || '');
        if (callPo.includes('/')) {
            const parts = callPo.split('/').map(p => p.trim()).filter(Boolean);
            const last = parts[parts.length - 1];
            if (last && last.length <= 6 && !isNaN(Number(last))) {
                return last;
            }
        }

        // 2. Check call's dedicated po_sr / poSr / poSrNo / poSerialNo field
        const callSr = target.po_sr || target.poSr || target.poSrNo || target.poSerialNo ||
            merged.po_sr || merged.poSr || merged.poSrNo || merged.poSerialNo;
        if (callSr && String(callSr).trim() !== '' && String(callSr).trim() !== 'null' && String(callSr).trim() !== 'undefined') {
            let str = String(callSr).trim();
            if (str.includes('/')) {
                const parts = str.split('/').map(p => p.trim()).filter(Boolean);
                str = parts[parts.length - 1];
            }
            return str;
        }

        // 3. Check composite rlyPoSr (e.g. "SER / 60265359103833 / 001")
        const rawRlyPo = String(target.rlyPoSr || target.rlyPoNo || target.poNumber ||
            merged.rlyPoSr || merged.rlyPoNo || merged.poNumber || '');
        if (rawRlyPo.includes('/')) {
            const parts = rawRlyPo.split('/').map(p => p.trim()).filter(Boolean);
            const last = parts[parts.length - 1];
            if (last && last.length <= 6 && !isNaN(Number(last))) {
                return last;
            }
        }

        // 4. Check item level itemSrNo / srNo if distinct item
        if (target.itemSrNo && String(target.itemSrNo).trim() !== '' && String(target.itemSrNo).trim() !== 'null') {
            return String(target.itemSrNo).trim();
        }
        if (target.srNo && String(target.srNo).trim() !== '' && String(target.srNo).trim() !== 'null') {
            return String(target.srNo).trim();
        }

        return String(fallbackIdx);
    };

    // Build Annexure-1 rows (PO Item Details)
    const items = (Array.isArray(merged.items) && merged.items.length > 0)
        ? merged.items
        : (Array.isArray(merged.poItems) && merged.poItems.length > 0)
            ? merged.poItems
            : [];

    let annexureRows = [];

    if (items.length > 0) {
        annexureRows = items.map((item, idx) => [
            resolvePoSrNo(item, idx + 1),
            item.consignee || consigneeVal,
            item.description || item.itemDesc || itemDescStr,
            formatQtyWithUom(item.orderQty || item.poQty || effectiveOrderQty),
            String(item.passedQty || '&'),
            formatQtyWithUom(item.offeredQty || item.qtyOffered || effectiveOfferedQty),
            item.deliveryPeriod || item.deliveryDate || dpPeriod,
            item.bpo || item.billPayOfficer || billPayOfficer,
            ''
        ]);
    } else {
        annexureRows = [
            [
                resolvePoSrNo(merged, 1),
                consigneeVal,
                itemDescStr,
                formatQtyWithUom(effectiveOrderQty),
                '&',
                formatQtyWithUom(effectiveOfferedQty),
                dpPeriod,
                billPayOfficer,
                ''
            ]
        ];
    }

    // ─────────────────────────────────────────────────────────────────
    // FORMAT 2: SARTHI ONLINE INSPECTION CALL LETTER (Images 3 & 4 Style)
    // ─────────────────────────────────────────────────────────────────

    const redTextColor = [220, 38, 38]; // #DC2626
    const labelTextColor = [30, 41, 59]; // #1E293B
    const borderLineColor = [156, 163, 175]; // #9CA3AF / silver grey

    // Format current timestamp for top bar
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

    // Formatting helpers
    const redVal = (text, fallback = '-') => {
        const str = text !== null && text !== undefined && String(text).trim() !== '' ? String(text) : fallback;
        return { content: str, styles: { textColor: redTextColor, fontStyle: 'bold' } };
    };

    const redValNormal = (text, fallback = '-') => {
        const str = text !== null && text !== undefined && String(text).trim() !== '' ? String(text) : fallback;
        return { content: str, styles: { textColor: redTextColor, fontStyle: 'normal' } };
    };

    // Calculate dynamic values from merged API responses
    const displayFrom = `${vendorName}${vendorAddress ? ' - ' + vendorAddress : ''}`;
    const displayTo = `(SBU Head/${rio.code || 'NRIO'})\n${rio.officeName || 'NORTHERN REGION INSPECTION OFFICE'}\nRITES LTD. (A Govt. of India Enterprise)\n${rio.address}${rio.contactInfo ? '\n' + rio.contactInfo : ''}`;
    const displayPoNoDate = `${merged.rlyPoNoSerial || merged.rlyPoNo || poNo}\nDate of PO: ${poDate || '-'}`;

    // Stage text
    const isProcess = callTypeUpper === 'PROCESS' || String(callNo).startsWith('RPP');
    const stageDisplay = isProcess ? 'Process Inspection' : (merged.stageOfInspection || 'Final Inspection');

    // Quantities & Units
    const uomText = merged.unit || effectiveUom || 'Nos.';
    const poQtyDisplay = merged.poQty || merged.poSrQty || effectiveOrderQty ? `${merged.poQty || merged.poSrQty || effectiveOrderQty} ${uomText}` : '-';
    const callQtyDisplay = effectiveOfferedQty ? `${effectiveOfferedQty} ${uomText}` : '-';

    // Dates
    const origDpDisplay = merged.origDp || merged.deliveryDate || dpPeriod || '-';
    const extDpDisplay = merged.extDp || '-';
    const desiredInspDate = formattedCallDate || '-';

    // Additional fields
    const purchaserDisplay = merged.purchasingAuthority || purchaser || '-';
    const consigneeDisplay = merged.consignee || consigneeVal || '-';
    const bpoDisplay = merged.billPayingOfficer || billPayOfficer || '-';
    const manufacturerDisplay = merged.manufacturerName || vendorName || '-';

    const rawMatPassed = merged.rawMaterialQtyPassed ? `${merged.rawMaterialQtyPassed} MT` : '0.000 MT';
    const finalAccQty = merged.finalAcceptedQty ? `${merged.finalAcceptedQty} ${uomText}` : `0 ${uomText}`;
    const rawTotalPoQty = merged.totalPoQty || merged.poQty || merged.poSrQty || effectiveOrderQty;
    const totalPoQtyVal = rawTotalPoQty
        ? (String(rawTotalPoQty).match(/[a-zA-Z]/) ? rawTotalPoQty : `${rawTotalPoQty} ${uomText}`)
        : '-';
    const totalPoValDisplay = merged.totalPoValue || merged.poValue || '-';
    const rawMatDetailsDisplay = merged.rawMaterialDetails || '-';
    const prodSelectedVendor = merged.productSelectedByVendor || merged.ercType || merged.type_of_erc || merged.erc_type || merged.product || merged.productType || merged.railPadType || '-';

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

/**
 * Main function to generate and download the Call Letter PDF (ERC & Generic Calls)
 * @param {object} call - Call data object from the dashboard
 */
export const generateCallLetterPDF = (call, shouldDownload = true) => {
    if (!call) return;

    // If it's a Railpad call, delegate to generateRailpadCallLetterPDF (keeps ERC untouched)
    if (isRailpadCall(call)) {
        return generateRailpadCallLetterPDF(call, shouldDownload);
    }

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
     * Draw a two-column table row
     * @param {string} label     - left column text
     * @param {string|Array} value  - right column text(s). Pass array for multicolour segments [{text, color}]
     * @param {object} opts
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
        const valueFn = opts.valueFn || null; // custom render fn

        // Row background
        if (opts.bg) {
            doc.setFillColor(...opts.bg);
            doc.rect(margin, y, tableWidth, rowH, 'F');
        }

        // Draw cell borders
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.2);
        doc.rect(margin, y, col1W, rowH); // label cell
        doc.rect(margin + col1W, y, col2W, rowH); // value cell

        // Label text - split to fit within label column
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
            // Segments with different colours
            let xOff = margin + col1W + 2;
            value.forEach(seg => {
                setFont('normal', 9, seg.color || RED);
                doc.text(seg.text, xOff, y + rowH / 2 + 1.5);
                xOff += doc.getTextWidth(seg.text) + 1;
            });
        } else {
            setFont('normal', 9, typeof value === 'object' && value?.color ? value.color : RED);
            // Clip long text within cell
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
     * Draw a full-width row spanning both columns (used for body text)
     */
    const drawFullRow = (text, opts = {}) => {
        const rowH = opts.rowH || 10;
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
        doc.setFillColor(...GRAY_BG);
        doc.rect(margin, y, tableWidth, rowH, 'F');
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.2);
        doc.rect(margin, y, tableWidth, rowH);
        setFont('bold', 11, BLACK);
        doc.text(text, pageW / 2, y + rowH / 2 + 1.5, { align: 'center' });
        y += rowH;
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

    // ═══════════════════════════════════════════════════════════════════
    // HEADER SECTION
    // ═══════════════════════════════════════════════════════════════════

    // Current date/time
    const printDateTime = new Date().toLocaleString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    // Header info line (Generated on | Call No | System)
    setFont('normal', 7.5, [100, 100, 100]);
    doc.text(
        `Generated on: ${printDateTime}  |  Call No: ${val(call.callNumber)}  |  System: RITES Sarthi`,
        pageW / 2,
        y + 5,
        { align: 'center' }
    );
    y += 8;

    // Title row
    drawTitleRow('Online Inspection Call Letter');

    // Empty spacer row
    y += 2;

    // FROM row
    const vendorNameStr = call.vendorName || call.vendor?.name || '-';
    const fromValue = [
        vendorNameStr !== '-' ? vendorNameStr : null,
        call.vendor?.location ? ` + ${call.vendor.location}` : null,
        call.vendor?.address ? ` + ${call.vendor.address}` : null
    ].filter(Boolean).join('');
    drawRow('From', fromValue || '-', { rowH: 9 });

    // DATE row
    const submissionDateStr = call.submissionDateTime || call.callDate || call.submissionDate || call.created_at || call.createdAt || call.desiredInspectionDate;
    const callRaisedDate = submissionDateStr
        ? new Date(submissionDateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '-';
    drawRow('Date', callRaisedDate !== 'Invalid Date' ? callRaisedDate : String(submissionDateStr).split('T')[0], { rowH: 9 });

    // TO row – multi-line needs extra height
    const getRioAddress = () => {
        let rioName = call.rio;
        switch (String(rioName).toUpperCase()) {
            case 'ERIO':
                return [
                    '(SBU Head, ERIO)',
                    'Eastern Region Inspection Office',
                    'RITES LTD. (A Govt. of India Enterprise)',
                    'OJAS BHAWAN, 7TH FLOOR, PLOT NO. DJ/20, STREET NO.326,',
                    'ACTION AREA 1D, NEW TOWN, KOLKATA - 700 156',
                    '033-22348912, sbu.einsp@rites.com'
                ].join('\n');
            case 'NRIO':
                return [
                    '(SBU Head/NRIO)',
                    'NORTHERN REGION INSPECTION OFFICE',
                    'RITES LTD. (A Govt. of India Enterprise)',
                    '12TH FLOOR, CORE-2, SCOPE MINAR,',
                    'LAXMI NAGAR, DELHI-110092',
                    '011-22402502, sbu.ninsp@rites.com'
                ].join('\n');
            case 'WRIO':
                return [
                    '(SBU Head/WRIO)',
                    'WESTERN REGION INSPECTION OFFICE',
                    'RITES LTD. (A Govt. of India Enterprise)',
                    '5TH FLOOR, REGENT CHAMBER, ABOVE STATUS',
                    'RESTAURANT, NARIMAN POINT, MUMBAI -400021',
                    '+91-22-68943400/68943445',
                    'wrinspn@rites.com'
                ].join('\n');
            case 'CRIO':
                return [
                    '(SBU Head/CRIO)',
                    'CENTRAL REGION INSPECTION OFFICE',
                    '50, EXPANSION BUILDING, BHILAI STEEL PLANT AREA',
                    'BHILAI -490001',
                    '+91-788-2227304/2226457, +91-788-2227305',
                    'crinspn@rites.com'
                ].join('\n');
            case 'SRIO':
                return [
                    '(SBU Head/SRIO)',
                    'SOUTHERN REGION INSPECTION OFFICE',
                    'RITES LTD. (A Govt. of India Enterprise)',
                    'CTS BUILDING - 2ND FLOOR, BSNL COMPLEX, NO. 16,',
                    'GREAMS ROAD CHENNAI-600006',
                    '+91-44-28290356, 28292807, 28292817',
                    '+91-44-28290359'
                ].join('\n');
            default:
                return [
                    `SBU Head Designation`,
                    `RIO Name: ${val(rioName)}`,
                    `RIO Address: ${val(rioName)} Regional Inspection Office`
                ].join('\n');
        }
    };
    const toValue = getRioAddress();
    drawRow('To', toValue);

    // ─── Body text block ─────────────────────────────────────────────
    y += 1;
    const bodyText =
        'Dear Sir,\nPlease arrange to inspect following goods lying ready with us. It is certified that the stores offered conform to governing specifications.';
    const bodyRowH = 14;
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, tableWidth, bodyRowH);
    setFont('normal', 9, DARK);
    const bodyLines = doc.splitTextToSize(bodyText, tableWidth - 4);
    bodyLines.forEach((line, i) => {
        doc.text(line, margin + 2, y + 4 + i * 4.5);
    });
    y += bodyRowH;

    // ═══════════════════════════════════════════════════════════════════
    // INSPECTION CALL DETAILS TABLE
    // ═══════════════════════════════════════════════════════════════════

    // Inspection Call Number
    drawRow('Inspection Call Number', val(call.callNumber), { rowH: 9 });

    // IE (empty until verified)
    const assignedIeStr = call.assignedIeName || call.ieName || call.assignedIE;
    const isIeAssigned = assignedIeStr && assignedIeStr !== 'Not Assigned' && assignedIeStr !== '-';

    const ieMobile = call.assignedIeMobile || call.ieMobile;
    const ieValue = isIeAssigned
        ? `${assignedIeStr}${ieMobile ? ' - ' + ieMobile : ''}`
        : ' ';
    drawRow('IE', ieValue, { rowH: 9 });

    // Stage of Inspection
    let stageDisplay = call.stage || call.productStage || call.typeOfCall || call.productType || '';
    const icNoStr = val(call.callNumber || call.requestId || call.icNumber || call.callNo, '').toUpperCase();
    if (icNoStr.startsWith('EP') || icNoStr.startsWith('RPP') || icNoStr.includes('-EP') || String(stageDisplay).toLowerCase().includes('process')) {
        stageDisplay = 'Process Inspection';
    } else if (icNoStr.startsWith('EF') || icNoStr.startsWith('RPF') || icNoStr.startsWith('RFF') || icNoStr.includes('-EF') || String(stageDisplay).toLowerCase().includes('final')) {
        stageDisplay = 'Final Inspection';
    } else if (icNoStr.startsWith('ER') || icNoStr.startsWith('RMC') || icNoStr.includes('-ER') || String(stageDisplay).toLowerCase().includes('raw')) {
        stageDisplay = 'Raw Material Inspection';
    } else if (!stageDisplay || stageDisplay === '-') {
        stageDisplay = 'Raw Material Inspection';
    }
    drawRow('Stage of Inspection', { text: stageDisplay, color: BLACK }, { rowH: 9 });

    checkPageBreak(50);

    // PO Number & Date
    // Use the raw composite string from backend (e.g. "WR / 26255265205057 / 012") as primary source.
    // Fall back to assembling from parts only if rlyPoSr is unavailable.
    let poBase;
    if (call.rlyPoSr && call.rlyPoSr !== '-') {
        poBase = call.rlyPoSr;
    } else {
        const parts = [
            call.rlyShortName && call.rlyShortName !== '-' ? call.rlyShortName : null,
            call.poNumber && call.poNumber !== '-' ? call.poNumber : null,
            call.poSerialNo && call.poSerialNo !== '-' ? call.poSerialNo : null
        ].filter(Boolean);
        poBase = parts.join(' / ') || '-';
    }
    const poValue = [
        poBase,
        call.poDate ? `Date of PO: ${call.poDate}` : ''
    ].filter(Boolean).join('\n');
    drawRow('PO Number & Date', poValue);

    // PO Sr. No Item Description - uses itemDesc from CallLetterDetailsDto
    const itemDescText = val(call.itemDesc || call.itemDescription || call.itemCatDescr);
    drawRow('PO Sr. No Item Description', itemDescText);

    checkPageBreak(60);

    // ─── Product & Quantity details ──────────────────────────────────
    drawRow('Product Selected By Vendor', val(call.product), { rowH: 9 });

    // PO Sr. No. Qty — uses poQty + uom from CallLetterDetailsDto
    const poSrNoQty = call.poQty
        ? `${call.poQty}${call.uom ? ' ' + call.uom : ''}`
        : (call.quantity ? `${call.quantity} MT` : '-');
    drawRow('PO Sr. No. Qty', poSrNoQty, { rowH: 9 });

    // Call Qty — uses callQty + callUnit from CallLetterDetailsDto
    const callQtyStr = call.callQty
        ? `${call.callQty}${call.callUnit ? ' ' + call.callUnit : ''}`
        : (call.subPoQuantity ? `${call.subPoQuantity} MT` : '-');
    drawRow('Call Qty', callQtyStr, { rowH: 9 });

    // DP Dates — uses deliveryDate / extendedDeliveryDate from CallLetterDetailsDto (pre-formatted dd.MM.yyyy by backend)
    drawRow('Orignal DP Date', val(call.deliveryDate || call.originalDeliveryDate || call.dpDate), { rowH: 9 });
    drawRow('Ext DP Date', val(call.extendedDeliveryDate || call.extDpDate), { rowH: 9 });
    drawRow('Desired Date of Inspection', val(call.desiredInspectionDate), { rowH: 9 });
    // Purchaser / Consignee / Bill Paying Authority — from CallLetterDetailsDto
    const formatTildeStr = (str) => {
        if (!str) return '-';
        return str.includes('~')
            ? str.split('~').map(s => s.trim()).filter(s => s && s !== '#').join(', ')
            : str;
    };
    drawRow('Purchaser', formatTildeStr(call.purchaserDetail || call.purchasingAuthority), { rowH: 9 });
    drawRow('Consginee', formatTildeStr(call.consigneeDetail || call.consigneeName || call.billPayingOfficer), { rowH: 9 });
    drawRow('Bill Paying Authority', formatTildeStr(call.billPayOffDesc || call.billPayingOfficer), { rowH: 9 });
    // Manufacturer — uses manufacturerName from CallLetterDetailsDto
    drawRow("Manufacturer's Name", val(call.manufacturerName || call.vendor?.name || call.manufacturerOfMaterial), { rowH: 9 });
    const formatPoi = (str) => {
        if (!str) return '-';
        const parts = str.split(',').map(s => s.trim());
        const uniqueParts = [];
        parts.forEach(p => {
            if (p && !uniqueParts.includes(p)) {
                uniqueParts.push(p);
            }
        });
        return uniqueParts.join(', ');
    };
    drawRow('Place of Inspection', formatPoi(call.placeOfInspection), { rowH: 9 });
    drawRow('Offered Installment Number', val(call.submissionCount || '1'), { rowH: 9 });

    checkPageBreak(50);

    drawRow('Raw Material Qty Already Passed for this PO Sr. No.', val(call.rawMaterialQtyPassed), { rowH: 12 });
    drawRow('Final Accepted Qty of this PO Sr. No.', val(call.finalAcceptedQty), { rowH: 12 });
    drawRow('Total PO Quantity', val(call.poQuantity), { rowH: 9 });
    drawRow('Total PO Value', val(call.poValue), { rowH: 9 });

    // Raw Material Details to be offered
    checkPageBreak(30);
    const heatDetails = call.heatDetails && call.heatDetails.length > 0
        ? call.heatDetails.map(h =>
            `Heat No.: ${val(h.heatNo)}, TC No. - ${val(h.tcNo)}, Qty Offered: ${val(h.qtyOffered)} MT`
        ).join('\n') +
        `\n\nTotal Qty Offered - ${call.subPoQuantity || call.quantity || '-'} MT`
        : call.tcNumber
            ? `Heat No.: -, TC No. - ${val(call.tcNumber)}, Qty Offered: ${val(call.subPoQuantity || call.quantity)} MT\n\nTotal Qty Offered - ${val(call.subPoQuantity || call.quantity)} MT`
            : '-';
    drawRow('Raw Material Details to be offered', heatDetails);

    // ─── Terms & Closing ─────────────────────────────────────────────
    checkPageBreak(40);

    drawFullRow('I hereby accept all the Terms and Conditions.', { rowH: 8, bold: false });

    y += 3; // small gap

    drawFullRow('Thanking you,', { rowH: 7 });
    drawFullRow('Yours Faithfully,', { rowH: 7 });

    drawRow('Name', val(call.contactPersonName || call.vendor?.name || call.vendorName), { rowH: 9 });
    drawRow('Mobile', val(call.contactMobile || call.vendor?.contact), { rowH: 9 });
    drawRow('Vendor Email', val(call.contactEmail || call.vendor?.email), { rowH: 9 });

    // ─── Save the PDF ─────────────────────────────────────────────────
    if (shouldDownload) {
        const filename = `Call_Letter_${val(call.callNumber, 'UNKNOWN').replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
        doc.save(filename);
    }
    return doc;
};
