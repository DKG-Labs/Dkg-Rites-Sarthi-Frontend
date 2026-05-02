import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Standard utility to capture a DOM element and convert it to a PDF blob.
 * Optimized for pixel-perfect matching with the frontend widescreen view.
 * 
 * @param {HTMLElement} element - The DOM element to capture
 * @param {Object} options - { orientation, unit, format }
 * @returns {Promise<Blob>}
 */
/**
 * Internal helper to capture a single element and add it to a PDF instance.
 * Shared between single-page and multi-page capture logic.
 */
const addElementToPdf = async (element, pdf, options) => {
  const { scale = 2.5 } = options;

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: 1600, // Force high width capture
    windowWidth: 1700,
    onclone: (clonedDoc) => {
      // Expand stage
      clonedDoc.body.style.width = '1700px';
      clonedDoc.body.style.overflow = 'visible';

      // Select ALL layouts to ensure consistency across pages
      const layouts = clonedDoc.querySelectorAll('.annexure-layout');
      layouts.forEach(layout => {
        layout.style.width = '1600px';
        layout.style.minWidth = '1600px';
        layout.style.padding = '40px';
        layout.style.margin = '0';
        layout.style.background = '#ffffff';
        layout.style.backgroundColor = '#ffffff';

        // Stabilize Table within this layout
        const table = layout.querySelector('table');
        if (table) {
          table.style.width = '100%';
          table.style.tableLayout = 'fixed';
          table.style.borderCollapse = 'collapse';

          // Enforce padding and alignment in PDF
          const cells = table.querySelectorAll('th, td');
          cells.forEach(cell => {
            cell.style.padding = '10px 5px';
            cell.style.verticalAlign = 'middle';
            cell.style.textAlign = 'center';
            cell.style.lineHeight = '1.4';
          });
        }

        // Stabilize Rotated Headers
        const rotatedHeaders = layout.querySelectorAll('.annexure-th.rotated-header');
        rotatedHeaders.forEach(th => {
          th.style.width = '45px';
          th.style.minWidth = '45px';
          th.style.height = '140px';
          th.style.position = 'relative';

          const span = th.querySelector('.rotated-text');
          if (span) {
            span.style.display = 'block';
            span.style.width = '140px';
            span.style.whiteSpace = 'nowrap';
            span.style.position = 'absolute';
            span.style.left = '50%';
            span.style.top = '50%';
            span.style.transform = 'translate(-50%, -50%) rotate(-90deg)';
            span.style.transformOrigin = 'center center';
            span.style.writingMode = 'horizontal-tb';
            span.style.textAlign = 'left';
            span.style.paddingLeft = '5px';
            span.style.fontWeight = 'bold';
          }
        });
      });
    }
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  if (imgHeight > pdfHeight) {
    const scaledWidth = (canvas.width * pdfHeight) / canvas.height;
    pdf.addImage(imgData, "JPEG", (pdfWidth - scaledWidth) / 2, 0, scaledWidth, pdfHeight, undefined, "FAST");
  } else {
    pdf.addImage(imgData, "JPEG", 0, (pdfHeight - imgHeight) / 2, imgWidth, imgHeight, undefined, "FAST");
  }
};

/**
 * Standard utility to capture a DOM element and convert it to a PDF blob.
 * Optimized for pixel-perfect matching and supports Multi-Page generation.
 * 
 * @param {HTMLElement} element - The root container to capture
 * @param {Object} options - { orientation, unit, format }
 * @returns {Promise<Blob>}
 */
export const captureElementToPdfBlob = async (element, options = {}) => {
  const {
    orientation = 'landscape',
    unit = 'mm',
    format = 'a4'
  } = options;

  console.log(`[PDF Utility] Executing Smart Multi-Page Capture...`);

  try {
    const pdf = new jsPDF(orientation, unit, format);

    // Check if we have multiple individual layouts (Multi-Annexure report)
    const layouts = Array.from(element.querySelectorAll('.annexure-layout'));

    if (layouts.length > 0) {
      console.log(`[PDF Utility] Detected ${layouts.length} individual layouts. Generating multi-page PDF...`);

      for (let i = 0; i < layouts.length; i++) {
        if (i > 0) pdf.addPage(format, orientation);
        await addElementToPdf(layouts[i], pdf, options);
      }
    } else {
      // Fallback to legacy single-element capture for standard reports
      console.log(`[PDF Utility] No individual layouts found. Defaulting to single-element capture.`);
      await addElementToPdf(element, pdf, options);
    }

    console.log('[PDF Utility] Smart conversion complete.');
    return pdf.output('blob');
  } catch (error) {
    console.error('[PDF Utility] Capture error:', error);
    throw error;
  }
};
