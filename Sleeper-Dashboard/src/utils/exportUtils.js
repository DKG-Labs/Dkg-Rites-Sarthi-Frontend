// Sleeper-Dashboard/src/utils/exportUtils.js

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Exports a DOM element to A4 PDF.
 * Uses the same print-ready layout as window.print()
 * element: DOM node (should be .certificate-print-wrapper)
 * filename: string
 */
export async function exportToPdf(element, filename = "certificate.pdf") {
  if (!element) return;

  // Wait for all fonts to be ready
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn("Font readiness check failed:", e);
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Find the actual certificate page inside the wrapper
  const certificatePage = element.querySelector('.certificate-page') || element;

  // Capture with optimized settings for A4 (Scale 2 for crisp print quality)
  const canvas = await html2canvas(certificatePage, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    scrollY: 0,
    scrollX: 0,
    onclone: (clonedDoc) => {
      const hostStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
      hostStyles.forEach((styleTag) => {
        try {
          clonedDoc.head.appendChild(styleTag.cloneNode(true));
        } catch (e) {
          // Ignore if already present
        }
      });

      const clonedElement = clonedDoc.querySelector('.certificate-page') || clonedDoc.querySelector('.sleeper-ic-page') || clonedDoc.body;
      clonedElement.style.width = '210mm';
      clonedElement.style.maxWidth = '210mm';
      clonedElement.style.margin = '0 auto';
      clonedElement.style.padding = '0mm 7mm 15mm 7mm';
      clonedElement.style.boxSizing = 'border-box';
      clonedElement.style.backgroundColor = '#ffffff';
    },
    removeContainer: true,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF("p", "mm", "a4");

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
  pdf.save(filename);
}

/**
 * Captures a DOM element and returns an A4 PDF as a Base64 string.
 * Optionally downloads the PDF if a filename is provided.
 * Used for E-Sign flow where the frontend provides the layout.
 */
export async function generatePdfBase64(element, filename = null) {
  if (!element) return null;

  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn("Font readiness check failed:", e);
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 300));

  const certificatePage = element.querySelector('.certificate-page') || element;

  const canvas = await html2canvas(certificatePage, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    scrollY: 0,
    scrollX: 0,
    onclone: (clonedDoc) => {
      const hostStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
      hostStyles.forEach((styleTag) => {
        try {
          clonedDoc.head.appendChild(styleTag.cloneNode(true));
        } catch (e) {
          // Ignore if already present
        }
      });

      const clonedElement = clonedDoc.querySelector('.certificate-page') || clonedDoc.querySelector('.sleeper-ic-page') || clonedDoc.body;
      clonedElement.style.width = '210mm';
      clonedElement.style.maxWidth = '210mm';
      clonedElement.style.margin = '0 auto';
      clonedElement.style.padding = '0mm 7mm 15mm 7mm';
      clonedElement.style.boxSizing = 'border-box';
      clonedElement.style.backgroundColor = '#ffffff';
    },
    removeContainer: true,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF("p", "mm", "a4");

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

  if (filename) {
    pdf.save(filename);
  }

  const base64String = pdf.output('datauristring').split(',')[1].replace(/\s/g, '');
  return base64String;
}

/** Optional: export to PNG */
export async function exportToImage(element, filename = "certificate.png") {
  if (!element) return;
  const canvas = await html2canvas(element, { scale: 2, useCORS: true });
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

/**
 * Dynamically calculates the PDF (cood, size) coordinates for the eSign stamp
 * based on the actual rendered DOM position of the Inspecting Engineer box.
 */
export function calculateSignatureCoords(containerElement, defaultCood = "410,165", defaultSize = "155,34") {
  try {
    if (!containerElement) return { cood: defaultCood, size: defaultSize };

    const certPage = containerElement.querySelector('.certificate-page') || containerElement;
    if (!certPage) return { cood: defaultCood, size: defaultSize };

    let targetEl = certPage.querySelector('.ie-signature-box');
    if (!targetEl) {
      const allDivs = Array.from(certPage.querySelectorAll('div, td, span'));
      targetEl = allDivs.find(el => el.textContent && (el.textContent.includes('Inspecting Engineer') || el.textContent.includes('निरीक्षण अभियंता')));
    }

    if (!targetEl) return { cood: defaultCood, size: defaultSize };

    const pageRect = certPage.getBoundingClientRect();
    const ieRect = targetEl.getBoundingClientRect();

    if (!pageRect.width || !pageRect.height) return { cood: defaultCood, size: defaultSize };

    // A4 dimensions in PDF points (72 points per inch) -> 595.28 x 841.89
    const pdfWidth = 595.28;
    const pdfHeight = 841.89;

    const leftRatio = (ieRect.left - pageRect.left) / pageRect.width;
    const widthRatio = ieRect.width / pageRect.width;
    const bottomRatio = (pageRect.bottom - ieRect.bottom) / pageRect.height;
    const heightRatio = ieRect.height / pageRect.height;

    const boxWidthInPoints = widthRatio * pdfWidth;
    const boxHeightInPoints = heightRatio * pdfHeight;

    // Standard eSign stamp size
    const pdfW = Math.min(155, Math.max(120, Math.round(boxWidthInPoints - 16)));
    const pdfH = 34;

    // Center horizontally inside the Inspecting Engineer cell
    const pdfX = Math.round(leftRatio * pdfWidth) + Math.max(8, Math.round((boxWidthInPoints - pdfW) / 2));
    
    // Elevate vertically into the middle of the cell so it stays comfortably inside and never overflows the bottom border
    const verticalElevation = Math.max(18, Math.round(boxHeightInPoints * 0.22));
    const pdfY = Math.round(bottomRatio * pdfHeight) + verticalElevation;

    console.log(`📐 Dynamic Signature Coords Calculated: cood="${pdfX},${pdfY}", size="${pdfW},${pdfH}" (elevation: +${verticalElevation}pt)`);

    return {
      cood: `${pdfX},${pdfY}`,
      size: `${pdfW},${pdfH}`
    };
  } catch (e) {
    console.warn("⚠️ Signature coordinate calculation failed, falling back to defaults:", e);
    return { cood: defaultCood, size: defaultSize };
  }
}
