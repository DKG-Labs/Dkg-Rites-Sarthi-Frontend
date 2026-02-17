import React, { useState, useMemo } from 'react';

// Helper function to check if a string is a date-like value
const isDateLike = (str) => {
  if (!str) return false;
  // Check for common date formats: DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY, etc.
  return /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}$/.test(str) ||
    /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str) ||
    /^\d{4}-\d{1,2}-\d{1,2}$/.test(str);
};

// Helper function to normalize date for comparison
const normalizeDateForSearch = (dateStr) => {
  if (!dateStr) return '';

  // Remove any time portion if present
  const datePart = dateStr.split(' ')[0];

  // Try to parse and normalize the date
  try {
    const date = new Date(datePart);
    if (!isNaN(date.getTime())) {
      // Return multiple formats for flexible matching
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      return [
        `${day}/${month}/${year}`,  // DD/MM/YYYY
        `${month}/${day}/${year}`,  // MM/DD/YYYY
        `${year}-${month}-${day}`,  // YYYY-MM-DD
        `${day}/${month}`,          // DD/MM (for partial search)
        `${month}/${day}`,          // MM/DD (for partial search)
        datePart                    // Original format
      ].join('|');
    }
  } catch (e) {
    // If parsing fails, return the original string
  }

  return datePart;
};

// Helper function to recursively search through nested objects and arrays
const deepSearch = (obj, searchText) => {
  if (obj === null || obj === undefined) {
    return false;
  }

  // If it's a primitive value, convert to string and search
  if (typeof obj !== 'object') {
    const strValue = String(obj).toLowerCase();

    // Check if this looks like a date and the search term is date-like
    if (isDateLike(strValue) && isDateLike(searchText)) {
      const normalizedDate = normalizeDateForSearch(strValue);
      const normalizedSearch = searchText.toLowerCase();
      return normalizedDate.toLowerCase().includes(normalizedSearch);
    }

    // Standard string search
    return strValue.includes(searchText);
  }

  // If it's an array, search each element
  if (Array.isArray(obj)) {
    return obj.some(item => deepSearch(item, searchText));
  }

  // If it's an object, search all values recursively
  return Object.values(obj).some(val => deepSearch(val, searchText));
};

const DataTable = ({ columns, data, onRowClick, actions, selectable, selectedRows, onSelectionChange, hideSearch = false, hidePageSize = false, initialPageSize = 5, emptyMessage = 'No data available' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Helper function to get rendered text from a column
  const getRenderedText = (row, column) => {
    if (!column.render) {
      return String(row[column.key] || '');
    }

    try {
      const rendered = column.render(row[column.key], row);
      // If it's a React element, try to extract text
      if (rendered && typeof rendered === 'object' && rendered.props) {
        // For StatusBadge and similar components, extract the text content
        if (rendered.props.children) {
          return String(rendered.props.children).toLowerCase();
        }
      }
      // If it's a string, return it
      if (typeof rendered === 'string') {
        return rendered.toLowerCase();
      }
    } catch (e) {
      // If render function fails, fall back to raw value
    }

    return String(row[column.key] || '');
  };

  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchTerm) {
      const searchText = searchTerm.toLowerCase();
      result = result.filter(row => {
        // First try searching the raw data
        if (deepSearch(row, searchText)) {
          return true;
        }

        // Also search rendered column values (for status badges, formatted dates, etc.)
        return columns.some(column => {
          const renderedText = getRenderedText(row, column);
          return renderedText.includes(searchText);
        });
      });
    }

    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, sortColumn, sortDirection, columns]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = paginatedData.map(row => row.id);
      onSelectionChange(allIds);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (rowId) => {
    if (selectedRows.includes(rowId)) {
      onSelectionChange(selectedRows.filter(id => id !== rowId));
    } else {
      onSelectionChange([...selectedRows, rowId]);
    }
  };

  // Handle row click - if selectable, toggle selection; otherwise call onRowClick
  const handleRowClick = (row, e) => {
    // Don't handle row click if clicking on action buttons or other interactive elements
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }

    if (selectable) {
      // Toggle selection when row is clicked
      handleSelectRow(row.id);
    } else if (onRowClick) {
      // Only call onRowClick if not selectable
      onRowClick(row);
    }
  };

  const isAllSelected = selectable && paginatedData.length > 0 && paginatedData.every(row => selectedRows.includes(row.id));

  return (
    <div className="data-table-wrapper">
      <div className="table-controls">
        {!hideSearch && (
          <input
            type="text"
            className="form-control search-box"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        )}
        {!hidePageSize && (
          <select
            className="form-control"
            style={{ width: '120px' }}
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={15}>15 / page</option>
            <option value={20}>20 / page</option>
          </select>
        )}
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              {selectable && (
                <th style={{ width: '50px' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map(col => (
                <th key={col.key} onClick={() => handleSort(col.key)}>
                  {col.label} {sortColumn === col.key && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
              ))}
              {actions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => {
              const isSelected = selectable && selectedRows.includes(row.id);
              return (
                <tr
                  key={idx}
                  onClick={(e) => handleRowClick(row, e)}
                  className={isSelected ? 'selected' : ''}
                  style={{ cursor: selectable ? 'pointer' : 'default' }}
                >
                  {selectable && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                      />
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={col.key} data-label={col.label}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {actions && <td data-label="Actions">{actions(row)}</td>}
                </tr>
              );
            })}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-pagination">
        <div className="pagination-info">
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
        </div>
        <div className="pagination-controls">
          <select
            className="form-control"
            style={{ width: '110px', height: '34px', padding: '0 10px', fontSize: '13px', minHeight: '34px' }}
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={15}>15 / page</option>
            <option value={20}>20 / page</option>
          </select>
          <button
            className="btn btn-sm btn-outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            className="btn btn-sm btn-outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
