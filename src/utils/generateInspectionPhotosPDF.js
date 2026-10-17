import jsPDF from 'jspdf';

/**
 * Generate a formatted Photo PDF containing inspection photos (6 photos per page: 2 columns x 3 rows)
 * @param {Array} images - Array of image objects or URLs
 * @param {object} call - Inspection call details (callNo, vendorName, etc.)
 * @returns {Promise<Blob>} Merged Photo PDF Blob
 */
export const generateInspectionPhotosPDF = async (images = [], call = {}) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;

  const callNo = call?.requestId || call?.call_no || call?.callNo || call?.callNumber || 'N/A';
  const vendorName = call?.vendorName || call?.vendor_name || 'N/A';
  const poNo = call?.po_no || call?.poNo || call?.rlyPoSrNo || 'N/A';

  const validImages = Array.isArray(images) ? images.filter(Boolean) : [];

  if (validImages.length === 0) {
    // Generate a placeholder page if no photos are captured
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('RITES LIMITED - INSPECTION PHOTO DOSSIER', pageW / 2, 25, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Call No: ${callNo} | PO No: ${poNo}`, pageW / 2, 33, { align: 'center' });
    doc.text(`Vendor: ${vendorName}`, pageW / 2, 39, { align: 'center' });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, 44, pageW - margin, 44);

    doc.setFontSize(13);
    doc.setTextColor(148, 163, 184);
    doc.text('No live inspection photos were captured or attached for this call.', pageW / 2, pageH / 2, { align: 'center' });

    return doc.output('blob');
  }

  // Layout: 2 columns x 3 rows = 6 photos per page
  const cols = 2;
  const rows = 3;
  const photosPerPage = cols * rows;

  const contentTop = 38;
  const contentW = pageW - margin * 2;
  const contentH = pageH - contentTop - margin;

  const cellW = (contentW - 8) / cols;
  const cellH = (contentH - 12) / rows;
  const imgW = cellW;
  const imgH = cellH - 10;

  // Helper to load image as Base64 Data URL
  const loadImageData = async (src) => {
    if (!src) return null;
    if (typeof src === 'string' && src.startsWith('data:image')) {
      return src;
    }
    // Attempt 1: Fetch as blob to avoid canvas CORS / tainting issues
    try {
      const resp = await fetch(src);
      if (resp.ok) {
        const blob = await resp.blob();
        if (blob && blob.size > 0) {
          return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        }
      }
    } catch (e) {
      // Fallback to Image element
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 400;
          canvas.height = img.naturalHeight || img.height || 300;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  };

  const totalPages = Math.ceil(validImages.length / photosPerPage);

  for (let p = 0; p < totalPages; p++) {
    if (p > 0) doc.addPage();

    // Page Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('RITES LIMITED - INSPECTION PHOTO DOSSIER', pageW / 2, 16, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Call No: ${callNo}  |  PO No: ${poNo}  |  Vendor: ${vendorName}`, pageW / 2, 22, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${p + 1} of ${totalPages} (6 Photos per Page)`, pageW / 2, 27, { align: 'center' });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(margin, 30, pageW - margin, 30);

    const startIndex = p * photosPerPage;
    const pagePhotos = validImages.slice(startIndex, startIndex + photosPerPage);

    for (let i = 0; i < pagePhotos.length; i++) {
      const item = pagePhotos[i];
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = margin + col * (cellW + 8);
      const y = contentTop + row * (cellH + 6);

      const photoSrc = item?.url || item?.photoUrl || item?.preview || item?.base64Data || item?.src || (typeof item === 'string' ? item : null);
      const photoLabel = item?.label || item?.stageName || item?.caption || `Inspection Photo #${startIndex + i + 1}`;
      const timestamp = item?.timestamp || item?.capturedAt || '';

      // Draw photo container border
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, cellW, cellH, 2, 2, 'FD');

      if (photoSrc) {
        try {
          const base64Img = await loadImageData(photoSrc);
          if (base64Img) {
            const format = base64Img.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            doc.addImage(base64Img, format, x + 1, y + 1, imgW - 2, imgH - 2, undefined, 'NONE');
          } else {
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text('[Image not accessible]', x + cellW / 2, y + imgH / 2, { align: 'center' });
          }
        } catch (imgErr) {
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text('[Image error]', x + cellW / 2, y + imgH / 2, { align: 'center' });
        }
      }

      // Caption & Timestamp label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      const safeLabel = doc.splitTextToSize(photoLabel, cellW - 4)[0] || photoLabel;
      doc.text(safeLabel, x + 2, y + imgH + 4);

      if (timestamp) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(String(timestamp), x + 2, y + imgH + 8);
      }
    }
  }

  return doc.output('blob');
};
