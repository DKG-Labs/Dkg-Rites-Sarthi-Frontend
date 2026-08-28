import { OFFICIAL_BLANK_PDF_BASE64 } from './cancellationTemplateData';

/**
 * Download the exact 20000102034821.pdf file directly.
 *
 * @param {Object} call - Current call details (optional)
 */
export const generateCancellationBlankFormatPDF = async (call = {}) => {
  try {
    const fileName = '20000102034821.pdf';

    // Direct blob download from embedded binary
    const base64Data = OFFICIAL_BLANK_PDF_BASE64.includes(',') 
      ? OFFICIAL_BLANK_PDF_BASE64.split(',')[1] 
      : OFFICIAL_BLANK_PDF_BASE64;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  } catch (err) {
    console.error('Error downloading 20000102034821.pdf:', err);
    throw err;
  }
};







