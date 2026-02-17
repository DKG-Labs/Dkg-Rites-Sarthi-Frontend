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

  // Capture with high quality settings for A4
  // Let html2canvas determine the height based on actual content
  const canvas = await html2canvas(certificatePage, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    // Remove fixed dimensions to capture full content
    scrollY: -window.scrollY,
    scrollX: -window.scrollX,
  });

  const imgData = canvas.toDataURL("image/png");
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
    pdf.addImage(imgData, "PNG", (pdfWidth - scaledWidth) / 2, 0, scaledWidth, pdfHeight);
  } else {
    // Center vertically if shorter than A4
    pdf.addImage(imgData, "PNG", 0, (pdfHeight - imgHeight) / 2, imgWidth, imgHeight);
  }

  pdf.save(filename);
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
