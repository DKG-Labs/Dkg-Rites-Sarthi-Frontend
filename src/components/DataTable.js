import React, { useState, useMemo } from 'react';

// Helper function to check if a string is a date-like value
const isDateLike = (str) => {
  if (!str || typeof str !== 'string') return false;
  // Check for common date formats: YYYY-MM-DD, DD/MM/YYYY, etc. with optional time
  return /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}(\s\d{1,2}:\d{1,2}(:\d{1,2})?)?$/.test(str) ||
    /^\d{4}-\d{1,2}-\d{1,2}/.test(str) ||
    !isNaN(Date.parse(str));
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
        `${day}-${month}-${year}`,  // DD-MM-YYYY
        `${year}-${month}-${day}`,  // YYYY-MM-DD
        `${day}/${month}`,          // DD/MM
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

// Helper function to robustly parse dates including DD/MM/YYYY
const parseRobustDate = (val) => {
  if (!val) return new Date(0);
  if (val instanceof Date) return val;

  // If it's a number, assume timestamp
  if (typeof val === 'number') return new Date(val);

  const str = String(val).trim();

  // Try standard parsing first
  let d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  // Try DD/MM/YYYY HH:mm:ss
  const regex = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/;
  const match = str.match(regex);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    const hour = match[5] ? parseInt(match[5], 10) : 0;
    const minute = match[6] ? parseInt(match[6], 10) : 0;
    const second = match[7] ? parseInt(match[7], 10) : 0;
    return new Date(year, month, day, hour, minute, second);
  }

  return new Date(0);
};

const DataTable = ({ columns, data, onRowClick, actions, selectable, selectedRows, onSelectionChange, hideSearch = false, hidePageSize = false, initialPageSize = 5, emptyMessage = 'No data available', initialSortColumn = null, initialSortDirection = 'asc' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(initialSortColumn);
  const [sortDirection, setSortDirection] = useState(initialSortDirection);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Reset page to 1 when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];

        // Improve date sorting - if it looks like a date, compare as dates
        if (isDateLike(aVal) && isDateLike(bVal)) {
          const dateA = parseRobustDate(aVal);
          const dateB = parseRobustDate(bVal);

          if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
            return sortDirection === 'asc'
              ? dateA.getTime() - dateB.getTime()
              : dateB.getTime() - dateA.getTime();
          }
        }

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


  return (
    <div className="data-table-wrapper">
      {(!hideSearch || !hidePageSize) && (
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
      )}

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              {selectable && (
                <th style={{ width: '50px' }}>
                  {/* Header checkbox removed */}
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
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    <div style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '50%',
                      padding: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
                    }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                        {emptyMessage === 'No data available' ? 'No Data Found' : emptyMessage}
                      </div>
                      <div style={{ fontSize: '14px', color: '#64748b', maxWidth: '400px', margin: '0 auto', lineHeight: '1.5' }}>
                        {searchTerm 
                          ? `We couldn't find any results matching "${searchTerm}". Try adjusting your search or filters.` 
                          : 'There are currently no records to display in this table. New records will appear here once they are added.'}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-pagination">
        <div className="pagination-info">
          {filteredData.length === 0 
            ? 'Showing 0 of 0 entries'
            : `Showing ${((currentPage - 1) * pageSize) + 1} to ${Math.min(currentPage * pageSize, filteredData.length)} of ${filteredData.length} entries`
          }
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
            disabled={currentPage === 1 || totalPages === 0}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>
          <span>Page {totalPages === 0 ? 0 : currentPage} of {totalPages}</span>
          <button
            className="btn btn-sm btn-outline"
            disabled={currentPage === totalPages || totalPages === 0}
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
