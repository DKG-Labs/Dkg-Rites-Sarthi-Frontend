import { useRef } from 'react';
import './ExcelImport.css';

/**
 * Reusable Excel/CSV Import & Export Component
 * - Download Template: Downloads a pre-defined template with exact row count
 * - Export: Downloads entered sample data as CSV
 * - Import: Uploads filled template and parses data
 *
 * @param {string} templateName - Name for the downloaded template (e.g., "LOT-001_ToeLoad_1stSampling")
 * @param {number} sampleSize - Number of rows in template (dynamic based on lot's sample size)
 * @param {string} valueLabel - Label for the value column (e.g., "Toe Load (N)", "Weight (g)")
 * @param {Array} currentValues - Array of user-entered values to export
 * @param {Function} onImport - Callback with array of values (strings)
 */
const ExcelImport = ({ templateName = 'template', sampleSize = 10, valueLabel = 'Value', currentValues = [], onImport, onNotification }) => {
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

  /* Generate and download CSV with user-entered data */
  const handleExportData = () => {
    const headers = `Sample No.,${valueLabel}`;
    const valuesArray = Array.isArray(currentValues) ? currentValues : [];
    const rows = Array(sampleSize).fill('').map((_, idx) => {
      const val = valuesArray[idx] !== undefined && valuesArray[idx] !== null ? valuesArray[idx] : '';
      return `${idx + 1},${val}`;
    });
    const csvContent = [headers, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${templateName}_entered_data.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    const filledCount = valuesArray.filter(v => v !== '' && v !== null && v !== undefined).length;
    if (onNotification) {
      onNotification(`Exported ${filledCount} entered values to CSV`, 'success');
    }
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
        if (onNotification) onNotification('Invalid file: No data rows found', 'error');
        else alert('Invalid file: No data rows found');
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
      
      const importedCount = values.filter(v => v !== '').length;
      if (onNotification) {
        onNotification(`Successfully imported ${importedCount} values`, 'success');
      } else {
        alert(`Successfully imported ${importedCount} values`);
      }
    };

    reader.onerror = () => {
      if (onNotification) onNotification('Error reading file', 'error');
      else alert('Error reading file');
    };
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
        className="excel-import__btn excel-import__btn--export"
        onClick={handleExportData}
        title={`Export current entered data (${sampleSize} rows) to CSV`}
      >
        📤 Export
      </button>
      <button
        type="button"
        className="excel-import__btn excel-import__btn--import"
        onClick={() => fileInputRef.current?.click()}
        title="Import filled CSV"
      >
        📥 Import
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

