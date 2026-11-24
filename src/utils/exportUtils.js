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
  // Same rendering as the e-sign PDF: one A4 page per .certificate-page (split ERC RM / Process ICs have several)
  await generatePdfBase64(element, filename);
}

/**
 * Captures a DOM element and returns an A4 PDF as a Base64 string.
 * Optionally downloads the PDF if a filename is provided.
 * Used for E-Sign flow where the frontend provides the layout.
 */
export async function generatePdfBase64(element, filename = null) {
  if (!element) return null;

  // Wait for all fonts to be ready
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn("Font readiness check failed:", e);
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Every .certificate-page becomes one A4 page (a split ERC RM / Process IC has several; most ICs have one)
  const foundPages = Array.from(element.querySelectorAll('.certificate-page'));
  const certificatePages = foundPages.length > 0 ? foundPages : [element];

  const pdf = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
    compress: true
  });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  for (let pageIndex = 0; pageIndex < certificatePages.length; pageIndex++) {
    const canvas = await html2canvas(certificatePages[pageIndex], {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollY: 0,
      scrollX: 0,
      onclone: (clonedDoc) => {
        // Explicitly copy all style and link tags from host document into the cloned document
        const hostStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
        hostStyles.forEach((styleTag) => {
          try {
            clonedDoc.head.appendChild(styleTag.cloneNode(true));
          } catch (e) {
            // Ignore if already present
          }
        });

        const clonedPages = clonedDoc.querySelectorAll('.certificate-page');
        const clonedElement = clonedPages[pageIndex] || clonedPages[0] || clonedDoc.body;
        clonedElement.style.width = '210mm';
        clonedElement.style.maxWidth = '210mm';
        clonedElement.style.margin = '0 auto';
        clonedElement.style.padding = '45mm 7mm 15mm 7mm';
        clonedElement.style.boxSizing = 'border-box';
        clonedElement.style.backgroundColor = '#ffffff';
      },
      removeContainer: true,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.80);
    if (pageIndex > 0) pdf.addPage("a4", "p");
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "SLOW");
  }

  // If filename is provided, download the PDF
  if (filename) {
    pdf.save(filename);
  }

  // Return clean base64 string without the prefix or spaces/newlines
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
