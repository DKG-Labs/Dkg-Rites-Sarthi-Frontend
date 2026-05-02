import JSZip from 'jszip';

/**
 * Utility for creating and downloading ZIP files on the client side
 */
export const createZip = () => {
  const zip = new JSZip();
  
  return {
    /**
     * Add a file to the ZIP archive
     * @param {string} filename - Name of the file inside the ZIP
     * @param {Blob|string} content - File content
     */
    addFile: (filename, content) => {
      zip.file(filename, content);
    },
    
    /**
     * Generate the ZIP blob and trigger download
     * @param {string} zipFilename - Name of the downloaded ZIP file
     * @returns {Promise<Blob>}
     */
    download: async (zipFilename = 'annexures.zip') => {
      const content = await zip.generateAsync({ type: 'blob' });
      
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipFilename;
      link.click();
      URL.revokeObjectURL(url);
      
      return content;
    }
  };
};

/**
 * Convenience function to zip multiple blobs and download
 * @param {Array<{name: string, content: Blob}>} files - Array of file objects
 * @param {string} zipName - Output filename
 */
export const zipAndDownload = async (files, zipName = 'annexures.zip') => {
  const zip = new JSZip();
  
  files.forEach(file => {
    zip.file(file.name, file.content);
  });
  
  const content = await zip.generateAsync({ type: 'blob' });
  
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipName;
  link.click();
  URL.revokeObjectURL(url);
  
  return content;
};
