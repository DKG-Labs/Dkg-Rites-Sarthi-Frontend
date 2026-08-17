import jsPDF from 'jspdf';

/**
 * Generate and download a 2-page PDF containing the EXACT scanned official format images.
 * Dynamically fits each image maintaining exact aspect ratio to prevent any stretching or cropping.
 * 
 * Page 1: FORMAT OF REQUEST FOR CHANGE IN DOCUMENTS (F/4.2/3/2)
 * Page 2: FORMAT FOR CALL CANCELLATION LETTER (F/7.5/1/5)
 * 
 * @param {Object} call - Current call details (optional)
 */
export const generateCancellationBlankFormatPDF = async (call = {}) => {
  try {
    // Function to load image URL into Base64 Data URL + extract natural dimensions
    const loadImageData = (url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve({
            dataUrl: canvas.toDataURL('image/png'),
            width: canvas.width,
            height: canvas.height,
            aspect: canvas.width / canvas.height
          });
        };
        img.onerror = (err) => reject(err);
        const publicUrl = process.env.PUBLIC_URL || '';
        img.src = `${publicUrl}${url}`;
      });
    };

    // Load exact template images from public directory
    const page1 = await loadImageData('/cancellation-templates/page1.png');
    const page2 = await loadImageData('/cancellation-templates/page2.png');

    // Create PDF document - choose orientation dynamically to match image aspect ratio
    const initialOrientation = page1.aspect > 1 ? 'landscape' : 'portrait';
    const doc = new jsPDF({ orientation: initialOrientation, unit: 'mm', format: 'a4' });

    // Helper: Add image fitted proportionally to page without stretching or clipping
    const addImageFitted = (imgData, isFirstPage = false) => {
      const targetOrientation = imgData.aspect > 1 ? 'landscape' : 'portrait';

      if (!isFirstPage) {
        doc.addPage('a4', targetOrientation);
      }

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      // 5mm safety margin to prevent any boundary clipping
      const margin = 5;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;

      let renderW = maxW;
      let renderH = renderW / imgData.aspect;

      if (renderH > maxH) {
        renderH = maxH;
        renderW = renderH * imgData.aspect;
      }

      // Center horizontally and vertically
      const x = (pageW - renderW) / 2;
      const y = (pageH - renderH) / 2;

      doc.addImage(imgData.dataUrl, 'PNG', x, y, renderW, renderH);
    };

    // Render Page 1 (Request for Change format)
    addImageFitted(page1, true);

    // Render Page 2 (Call Cancellation Letter format)
    addImageFitted(page2, false);

    // Save PDF
    const filename = `Call_Cancellation_Blank_Formats_${call.call_no || call.callNumber || 'Doc'}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF from exact images:', error);

    // Fallback: direct download links if canvas dataUrl fails
    const link1 = document.createElement('a');
    link1.href = '/cancellation-templates/page1.png';
    link1.download = 'Cancellation_Format_Page1.png';
    link1.click();

    setTimeout(() => {
      const link2 = document.createElement('a');
      link2.href = '/cancellation-templates/page2.png';
      link2.download = 'Cancellation_Format_Page2.png';
      link2.click();
    }, 500);
  }
};
