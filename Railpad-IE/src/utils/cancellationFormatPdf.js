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
        const publicUrl = '';
        img.src = `${publicUrl}${url}`;
      });
    };

    // Load exact template images from public directory (or fallback text)
    let page1 = null;
    let page2 = null;
    try {
      page1 = await loadImageData('/cancellation-templates/page1.png');
      page2 = await loadImageData('/cancellation-templates/page2.png');
    } catch (imgErr) {
      console.warn('Template images not found in public folder, generating vector template', imgErr);
    }

    if (page1 && page2) {
      const initialOrientation = page1.aspect > 1 ? 'landscape' : 'portrait';
      const doc = new jsPDF({ orientation: initialOrientation, unit: 'mm', format: 'a4' });

      const addImageFitted = (imgData, isFirstPage = false) => {
        const targetOrientation = imgData.aspect > 1 ? 'landscape' : 'portrait';
        if (!isFirstPage) {
          doc.addPage('a4', targetOrientation);
        }
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 5;
        const maxW = pageW - margin * 2;
        const maxH = pageH - margin * 2;
        let w = maxW;
        let h = w / imgData.aspect;
        if (h > maxH) {
          h = maxH;
          w = h * imgData.aspect;
        }
        const x = (pageW - w) / 2;
        const y = (pageH - h) / 2;
        doc.addImage(imgData.dataUrl, 'PNG', x, y, w, h, undefined, 'FAST');
      };

      addImageFitted(page1, true);
      addImageFitted(page2, false);

      const callNo = call.call_no || call.callNumber || 'Blank';
      doc.save(`Call_Cancellation_Blank_Format_${callNo}.pdf`);
    } else {
      // Vector template fallback
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.setFontSize(14);
      doc.text('RITES LTD - QA DIVISION', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text('FORMAT FOR CALL CANCELLATION LETTER (F/7.5/1/5)', 105, 30, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Call No: ${call.call_no || call.callNumber || '________'}`, 20, 45);
      doc.text(`PO No: ${call.po_no || call.poNumber || '________'}`, 20, 55);
      doc.text(`Vendor: ${call.vendor_name || call.vendorName || '________'}`, 20, 65);
      doc.text('Reason for Cancellation: _________________________________', 20, 80);
      doc.text('Signature of IE: ____________________', 20, 120);
      const callNo = call.call_no || call.callNumber || 'Blank';
      doc.save(`Call_Cancellation_Format_${callNo}.pdf`);
    }
  } catch (err) {
    console.error('Error generating cancellation format PDF:', err);
    throw err;
  }
};
