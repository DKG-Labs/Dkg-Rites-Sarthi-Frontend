import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Exports a DOM element to A4 PDF.
 * Uses the same print-ready layout as window.print()
 * element: DOM node (should be .certificate-print-wrapper or .cs-a4)
 * filename: string
 */
export async function exportToPdf(element, filename = "certificate.pdf") {
  if (!element) return;

  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn("Font readiness check failed:", e);
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 300));

  const certificatePage = element.querySelector('.certificate-page') || element.querySelector('.cs-a4') || element;

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

      const clonedElement = clonedDoc.querySelector('.certificate-page') || clonedDoc.querySelector('.cs-a4') || clonedDoc.body;
      clonedElement.style.width = '210mm';
      clonedElement.style.maxWidth = '210mm';
      clonedElement.style.margin = '0 auto';
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

  const certificatePage = element.querySelector('.certificate-page') || element.querySelector('.cs-a4') || element;

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

      const clonedElement = clonedDoc.querySelector('.certificate-page') || clonedDoc.querySelector('.cs-a4') || clonedDoc.body;
      clonedElement.style.width = '210mm';
      clonedElement.style.maxWidth = '210mm';
      clonedElement.style.margin = '0 auto';
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
export function calculateSignatureCoords(containerElement, defaultCood = "395,145", defaultSize = "170,36") {
  try {
    if (!containerElement) return { cood: defaultCood, size: defaultSize };

    const certPage = containerElement.querySelector('.certificate-page') || containerElement;
    if (!certPage) return { cood: defaultCood, size: defaultSize };

    // Target the Inspecting Engineer container element by class or text content
    let targetEl = certPage.querySelector('.ie-signature-box');
    if (!targetEl) {
      const allDivs = Array.from(certPage.querySelectorAll('div, td, span'));
      targetEl = allDivs.find(el => el.textContent && (el.textContent.includes('Inspecting Engineer') || el.textContent.includes('निरीक्षण अभियंता')));
    }

    if (!targetEl) return { cood: defaultCood, size: defaultSize };

    const pageRect = certPage.getBoundingClientRect();
    const ieRect = targetEl.getBoundingClientRect();

    if (!pageRect.width || !pageRect.height) return { cood: defaultCood, size: defaultSize };

    // A4 dimensions in PDF points (72 points per inch)
    const pdfWidth = 595.28;
    const pdfHeight = 841.89;

    // Convert pixel proportions to PDF point coordinates
    const leftRatio = (ieRect.left - pageRect.left) / pageRect.width;
    const widthRatio = ieRect.width / pageRect.width;
    const bottomRatio = (pageRect.bottom - ieRect.bottom) / pageRect.height;
    const heightRatio = ieRect.height / pageRect.height;

    // PDF X coordinate (from left edge)
    const pdfX = Math.round(leftRatio * pdfWidth) + 4;

    // PDF Y coordinate (from bottom edge)
    const pdfY = Math.round(bottomRatio * pdfHeight) + 4;

    // Stamp dimensions
    const pdfW = Math.max(100, Math.round(widthRatio * pdfWidth) - 8);
    const pdfH = Math.max(30, Math.round(heightRatio * pdfHeight) - 8);

    console.log(`📐 Dynamic Signature Coords Calculated: cood="${pdfX},${pdfY}", size="${pdfW},${pdfH}"`);

    return {
      cood: `${pdfX},${pdfY}`,
      size: `${pdfW},${pdfH}`
    };
  } catch (e) {
    console.error("Error calculating dynamic signature coords:", e);
    return { cood: defaultCood, size: defaultSize };
  }
}

