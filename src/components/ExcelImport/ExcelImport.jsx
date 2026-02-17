import { useRef } from 'react';
import './ExcelImport.css';

/**
 * Reusable Excel/CSV Import Component
 * - Download Template: Downloads a pre-defined template with exact row count
 * - Import: Uploads filled template and parses data
 *
 * @param {string} templateName - Name for the downloaded template (e.g., "LOT-001_ToeLoad_1stSampling")
 * @param {number} sampleSize - Number of rows in template (dynamic based on lot's sample size)
 * @param {string} valueLabel - Label for the value column (e.g., "Toe Load (N)", "Weight (g)")
 * @param {Function} onImport - Callback with array of values (strings)
 */
const ExcelImport = ({ templateName = 'template', sampleSize = 10, valueLabel = 'Value', onImport }) => {
  const fileInputRef = useRef(null);

  /* Generate and download CSV template with exact sample size */
  const handleDownloadTemplate = () => {
    const headers = `Sample No.,${valueLabel}`;
    const rows = Array(sampleSize).fill('').map((_, idx) => `${idx + 1},`);
    const csvContent = [headers, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${templateName}_${sampleSize}samples.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  /* Parse uploaded CSV file and extract values */
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        alert('Invalid file: No data rows found');
        return;
      }

      /* Extract values from 2nd column (index 1) */
      const values = [];
      for (let i = 1; i < lines.length && i <= sampleSize; i++) {
        const cols = lines[i].split(',');
        values.push(cols[1]?.trim() || '');
      }

      /* Pad with empty strings if fewer rows than sample size */
      while (values.length < sampleSize) {
        values.push('');
      }

      if (onImport) onImport(values);
      alert(`Successfully imported ${values.filter(v => v !== '').length} values`);
    };

    reader.onerror = () => alert('Error reading file');
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="excel-import">
      <button
        type="button"
        className="excel-import__btn excel-import__btn--download"
        onClick={handleDownloadTemplate}
        title={`Download template with ${sampleSize} rows`}
      >
        📥 Template ({sampleSize})
      </button>
      <button
        type="button"
        className="excel-import__btn excel-import__btn--import"
        onClick={() => fileInputRef.current?.click()}
        title="Import filled CSV"
      >
        📤 Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="excel-import__input"
      />
    </div>
  );
};

export default ExcelImport;

