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

  // Find the actual certificate page inside the wrapper
  const certificatePage = element.querySelector('.certificate-page') || element;

  // Capture with optimized settings for A4 (Scale 2 for crisp print quality)
  const canvas = await html2canvas(certificatePage, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    scrollY: -window.scrollY,
    scrollX: -window.scrollX,
    windowWidth: 1200, // Explicit virtual width for stable layout capture
    onclone: (clonedDoc) => {
      const clonedElement = clonedDoc.querySelector('.certificate-page') || clonedDoc.body;
      clonedElement.style.width = '210mm';
      clonedElement.style.maxWidth = '210mm';
      clonedElement.style.margin = '0 auto';
      clonedElement.style.padding = '45mm 7mm 15mm 7mm';
      clonedElement.style.boxSizing = 'border-box';
    },
    removeContainer: true,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF("p", "mm", "a4");

  // A4 dimensions: 210mm x 297mm
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Render full A4 page (210mm x 297mm) with 45mm top space, 15mm bottom space, 7mm side margins
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

  const certificatePage = element.querySelector('.certificate-page') || element;

  const canvas = await html2canvas(certificatePage, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    scrollY: -window.scrollY,
    scrollX: -window.scrollX,
    windowWidth: 1200,
    onclone: (clonedDoc) => {
      const clonedElement = clonedDoc.querySelector('.certificate-page') || clonedDoc.body;
      clonedElement.style.width = '210mm';
      clonedElement.style.maxWidth = '210mm';
      clonedElement.style.margin = '0 auto';
      clonedElement.style.padding = '45mm 7mm 15mm 7mm';
      clonedElement.style.boxSizing = 'border-box';
    },
    removeContainer: true,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF("p", "mm", "a4");

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

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
