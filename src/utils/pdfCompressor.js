import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

// Set up pdfjs worker using unpkg or local worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
}

/**
 * Compress a PDF File or ArrayBuffer using Canvas rendering & JPEG re-encoding.
 * @param {File|Blob|ArrayBuffer} file - Original PDF
 * @param {Object} options - Compression options
 * @param {Function} onProgress - Progress callback (percent, statusText)
 * @returns {Promise<File>} Compressed File object
 */
export async function compressPdfFile(file, options = {}, onProgress = () => {}) {
  const {
    quality = 0.75, // JPEG quality (0.0 to 1.0)
    scale = 1.5      // Render scale factor for sharpness
  } = options;

  try {
    onProgress(10, 'Reading PDF document...');
    const arrayBuffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);

    const loadingTask = pdfjsLib.getDocument({ data: typedArray });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    if (numPages === 0) {
      throw new Error('PDF has no pages.');
    }

    let pdf = null;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const progressPercent = Math.round(15 + ((pageNum - 1) / numPages) * 75);
      onProgress(progressPercent, `Compressing page ${pageNum} of ${numPages}...`);

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Fill with white background (in case of transparency)
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;

      // Convert page canvas to high-efficiency JPEG
      const imgDataUrl = canvas.toDataURL('image/jpeg', quality);

      // Initialize jsPDF document on first page with proper dimensions & orientation
      const orientation = viewport.width > viewport.height ? 'landscape' : 'portrait';
      const format = [viewport.width * 0.75, viewport.height * 0.75]; // points

      if (pageNum === 1) {
        pdf = new jsPDF({
          orientation,
          unit: 'pt',
          format
        });
        pdf.addImage(imgDataUrl, 'JPEG', 0, 0, format[0], format[1], undefined, 'FAST');
      } else {
        pdf.addPage(format, orientation);
        pdf.addImage(imgDataUrl, 'JPEG', 0, 0, format[0], format[1], undefined, 'FAST');
      }

      // Cleanup canvas memory
      canvas.width = 0;
      canvas.height = 0;
    }

    onProgress(95, 'Finalizing compressed PDF...');
    const pdfBlob = pdf.output('blob');

    const originalName = file.name || 'certificate.pdf';
    const compressedFile = new File([pdfBlob], originalName, {
      type: 'application/pdf',
      lastModified: Date.now()
    });

    onProgress(100, 'Compression complete');
    return compressedFile;

  } catch (error) {
    console.warn('PDF canvas compression fallback error:', error);
    // If worker/rendering fails, return the original file
    return file;
  }
}
