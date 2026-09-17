import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Helper to get readable active tab label
 */
export const getActiveTabLabel = (activeMainCard, activeReport = '') => {
    switch (activeMainCard) {
        case 'summary':
            return 'Dashboard Summary';
        case 'quality':
            return 'Quality Analysis';
        case 'lifecycle':
            return 'PO Lifecycle';
        case 'performance':
            return 'Performance Matrix';
        case 'reports':
            switch (activeReport) {
                case 'mpr':
                    return 'Monthly Progress Report (MPR)';
                case 'mau':
                    return 'Monthly Analysis of Units (MAU)';
                case 'lwcl':
                    return 'Lot Wise Closed Loop (LWCL)';
                case 'swp':
                    return 'Shift Wise Production (SWP)';
                case 'qrp':
                    return 'Quality of Rubber Pad Report';
                case 'mpia':
                case 'vwpqr':
                    return 'Vendor Wise Process Quality Report';
                case 'pwmr':
                    return 'PO Wise Quality Report';
                case 'sqr':
                    return 'Quality of PSC Sleepers Report';
                case 'ic_annexures':
                    return 'Download IC & Annexures';
                default:
                    return 'Reports';
            }
        case 'sqc':
            return 'SQC Analysis';
        case 'scada':
            return 'SCADA Monitor';
        case 'feedback':
            return 'Feedback Management';
        case 'sleeper-anomaly':
            return 'AI Anomaly Engine';
        case 'cm-module':
            return 'Controlling Manager Module';
        default:
            return 'Railway Board Dashboard';
    }
};

/**
 * Exports the complete dashboard screen as a 1-page professional Landscape A4 PDF.
 *
 * @param {HTMLElement|string} elementOrId - DOM Element or ID to capture
 * @param {Object} metadata - Context metadata (product, activeTab, filters, etc.)
 */
export async function exportDashboardScreenToPdf(elementOrId, metadata = {}) {
    const {
        product = 'ERC',
        activeMainCard = 'summary',
        activeReport = '',
        fromDate = '',
        toDate = '',
        zone = 'all',
        rio = 'all',
        customFileName = null,
    } = metadata;

    const element = typeof elementOrId === 'string'
        ? document.getElementById(elementOrId)
        : elementOrId;

    if (!element) {
        throw new Error('Dashboard element not found for export.');
    }

    // Ensure all web fonts are loaded
    if (document.fonts && document.fonts.ready) {
        try {
            await document.fonts.ready;
        } catch (e) {
            console.warn('Font readiness check warning:', e);
        }
    }

    // Pause to allow charts and animations to settle
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Capture using html2canvas with high DPI and explicit print cleanup
    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: Math.max(element.scrollWidth || 1350, 1350),
        onclone: (clonedDoc) => {
            // Re-inject host stylesheets to preserve all base formatting
            const hostStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
            hostStyles.forEach((styleTag) => {
                try {
                    clonedDoc.head.appendChild(styleTag.cloneNode(true));
                } catch {
                    // Ignore duplicate styles
                }
            });

            // Target cloned element and normalize dimensions
            const clonedEl = clonedDoc.getElementById(element.id) || clonedDoc.body;
            if (clonedEl) {
                clonedEl.style.overflow = 'visible';
                clonedEl.style.height = 'auto';
                clonedEl.style.maxHeight = 'none';
                clonedEl.style.background = '#ffffff';
                clonedEl.style.padding = '10px';
            }

            // Inject targeted print style fixes for clean rasterization & hiding filter bar
            const printFixStyle = clonedDoc.createElement('style');
            printFixStyle.innerHTML = `
                /* HIDE TOP FILTER BOX COMPLETELY IN PDF */
                .global-filters,
                #prof-topbar,
                .filter-bar,
                .sub-tabs,
                .global-filters-container,
                [class*="global-filters"],
                .no-pdf-export,
                .sidebar-toggle-btn-small,
                .btn-apply,
                .btn-reset,
                .ant-pagination-options {
                    display: none !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    height: 0 !important;
                    min-height: 0 !important;
                    visibility: hidden !important;
                }

                /* Disable all transitions and animations so numbers never render at partial opacity or offset */
                *, *::before, *::after {
                    animation: none !important;
                    transition: none !important;
                    -webkit-animation: none !important;
                    -webkit-transition: none !important;
                    transform: none !important;
                    -webkit-transform: none !important;
                    box-shadow: none !important;
                    text-shadow: none !important;
                }

                .fade-in, .animate-up, .fadeIn, .slideUp {
                    opacity: 1 !important;
                    transform: none !important;
                }

                /* Ensure card values and labels never get clipped by line-height or overflow */
                .prof-card {
                    overflow: visible !important;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
                }

                .prof-card * {
                    overflow: visible !important;
                }

                .kpi-lbl {
                    font-size: 13px !important;
                    font-weight: 700 !important;
                    line-height: 1.3 !important;
                    overflow: visible !important;
                    opacity: 0.9 !important;
                    margin-bottom: 2px !important;
                }

                .kpi-val {
                    font-size: 28px !important;
                    font-weight: 800 !important;
                    line-height: 1.25 !important;
                    overflow: visible !important;
                    text-overflow: clip !important;
                    white-space: normal !important;
                    display: block !important;
                    padding: 2px 0 !important;
                    margin: 2px 0 !important;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
                }

                .kpi-sub {
                    font-size: 11px !important;
                    font-weight: 600 !important;
                    line-height: 1.2 !important;
                    overflow: visible !important;
                }

                /* Solid High-Contrast Card Colors for Print */
                .card-dark-green {
                    background: #064e3b !important;
                    background-color: #064e3b !important;
                    color: #ffffff !important;
                }
                .card-dark-green .kpi-lbl,
                .card-dark-green .kpi-val,
                .card-dark-green .kpi-sub,
                .card-dark-green div,
                .card-dark-green span {
                    color: #ffffff !important;
                    opacity: 1 !important;
                }

                .card-ocean {
                    background: #0369a1 !important;
                    background-color: #0369a1 !important;
                    color: #ffffff !important;
                }
                .card-ocean .kpi-lbl,
                .card-ocean .kpi-val,
                .card-ocean .kpi-sub,
                .card-ocean div,
                .card-ocean span {
                    color: #ffffff !important;
                    opacity: 1 !important;
                }

                .card-indigo {
                    background: #4338ca !important;
                    background-color: #4338ca !important;
                    color: #ffffff !important;
                }
                .card-indigo .kpi-lbl,
                .card-indigo .kpi-val,
                .card-indigo .kpi-sub,
                .card-indigo div,
                .card-indigo span {
                    color: #ffffff !important;
                    opacity: 1 !important;
                }

                /* Ensure scrollable table containers are fully expanded in clone */
                .table-responsive, .prof-table-container, [style*="overflow-x"] {
                    overflow: visible !important;
                    width: 100% !important;
                    max-width: 100% !important;
                }
            `;
            clonedDoc.head.appendChild(printFixStyle);
        },
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas rendering produced an empty image.');
    }

    // Initialize jsPDF in Landscape A4 (297mm x 210mm)
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();   // 297 mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 210 mm

    const marginX = 10;        // 10mm left and right margin
    const usableWidth = pageWidth - (marginX * 2); // 277 mm

    const p1HeaderSpace = 18;  // mm top space for header
    const footerSpace = 10;    // mm bottom space for footer

    const usableHeight = pageHeight - p1HeaderSpace - footerSpace; // 182 mm

    const tabLabel = getActiveTabLabel(activeMainCard, activeReport);
    const dateFormatted = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    // Draw official SARTHI header
    pdf.setFillColor(20, 83, 45); // Forest green #14532d
    pdf.rect(marginX, 5, 3, 8, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(20, 83, 45);
    pdf.text('SARTHI - Railway Board Dashboard', marginX + 5, 10);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(75, 107, 75);
    
    let filterDetails = `Product: ${product} | Section: ${tabLabel}`;
    if (zone && zone !== 'all') filterDetails += ` | Zone: ${zone}`;
    if (rio && rio !== 'all') filterDetails += ` | RIO: ${rio}`;
    if (fromDate && toDate) filterDetails += ` | Period: ${fromDate} to ${toDate}`;

    pdf.text(filterDetails, marginX + 5, 14.5);

    // Right side timestamp
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Generated: ${dateFormatted}`, pageWidth - marginX, 10, { align: 'right' });

    // Green divider line
    pdf.setDrawColor(34, 197, 94);
    pdf.setLineWidth(0.4);
    pdf.line(marginX, 16.5, pageWidth - marginX, 16.5);

    // Draw footer
    const footerY = pageHeight - 5;
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(marginX, pageHeight - 8, pageWidth - marginX, pageHeight - 8);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text('Confidential - For Official Use Only | System for Automated Review, Tracking & Holistic Inspection (SARTHI)', marginX, footerY);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(55, 65, 81);
    pdf.text('Page 1 of 1', pageWidth - marginX, footerY, { align: 'right' });

    // Fit strictly onto 1 page proportionally
    const scaleFactor = Math.min(usableWidth / canvas.width, usableHeight / canvas.height);
    const finalWidth = canvas.width * scaleFactor;
    const finalHeight = canvas.height * scaleFactor;

    const posX = marginX + (usableWidth - finalWidth) / 2;
    const posY = p1HeaderSpace + 1 + (usableHeight - finalHeight) / 2;

    const imgData = canvas.toDataURL('image/jpeg', 0.96);
    pdf.addImage(imgData, 'JPEG', posX, posY, finalWidth, finalHeight, undefined, 'FAST');

    // Filename generation
    const sanitizedTab = tabLabel.replace(/[^a-zA-Z0-9]/g, '_');
    const todayStr = new Date().toISOString().split('T')[0];
    const fileName = customFileName || `RailwayBoard_${product}_${sanitizedTab}_${todayStr}.pdf`;

    pdf.save(fileName);
    return fileName;
}
