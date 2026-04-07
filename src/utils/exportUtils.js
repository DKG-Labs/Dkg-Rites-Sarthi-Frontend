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

  // Capture with optimized settings for A4 (Scale 1.5 balances quality vs size)
  const canvas = await html2canvas(certificatePage, {
    scale: 1.5,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    scrollY: -window.scrollY,
    scrollX: -window.scrollX,
    windowWidth: 1200, // Explicit virtual width for stable layout capture
    onclone: (clonedDoc) => {
      const clonedElement = clonedDoc.querySelector('.certificate-page') || clonedDoc.body;
      clonedElement.style.width = '210mm';
      clonedElement.style.height = 'auto';
    },
    removeContainer: true,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.75);
  const pdf = new jsPDF("p", "mm", "a4");

  // A4 dimensions: 210mm x 297mm
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Calculate image dimensions to fit A4 while maintaining aspect ratio
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  // If content is taller than A4, scale it to fit
  if (imgHeight > pdfHeight) {
    const scaledWidth = (canvas.width * pdfHeight) / canvas.height;
    pdf.addImage(imgData, "JPEG", (pdfWidth - scaledWidth) / 2, 0, scaledWidth, pdfHeight, undefined, "FAST");
  } else {
    // Center vertically if shorter than A4
    pdf.addImage(imgData, "JPEG", 0, (pdfHeight - imgHeight) / 2, imgWidth, imgHeight, undefined, "FAST");
  }

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
    scale: 1.5,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    scrollY: -window.scrollY,
    scrollX: -window.scrollX,
    windowWidth: 1200,
    onclone: (clonedDoc) => {
      const clonedElement = clonedDoc.querySelector('.certificate-page') || clonedDoc.body;
      clonedElement.style.width = '210mm';
      clonedElement.style.height = 'auto';
    },
    removeContainer: true,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.75);
  const pdf = new jsPDF("p", "mm", "a4");

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  if (imgHeight > pdfHeight) {
    const scaledWidth = (canvas.width * pdfHeight) / canvas.height;
    pdf.addImage(imgData, "JPEG", (pdfWidth - scaledWidth) / 2, 0, scaledWidth, pdfHeight, undefined, "FAST");
  } else {
    pdf.addImage(imgData, "JPEG", 0, (pdfHeight - imgHeight) / 2, pdfWidth, imgHeight, undefined, "FAST");
  }

  // If filename is provided, download the PDF
  if (filename) {
    pdf.save(filename);
  }

  // Return base64 string without the prefix
  const base64String = pdf.output('datauristring').split(',')[1];
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
