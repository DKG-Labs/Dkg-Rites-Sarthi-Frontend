import React from 'react';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, totalCount, startIndex, endIndex, onPageChange, theme = 'teal' }) => {
  if (totalPages <= 1) return null;
  
  return (
    <div className={`pg-wrapper pg-theme-${theme}`}>
      <div className="pg-count">
        Showing {startIndex + 1} to {Math.min(endIndex, totalCount)} of {totalCount} entries
      </div>
      <div className="pg-buttons">
        <button 
          className="pg-btn" 
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          ‹ Prev
        </button>
        <span className="pg-page-info">
          Page {currentPage} of {totalPages}
        </span>
        <button 
          className="pg-btn" 
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next ›
        </button>
      </div>
    </div>
  );
};

export default Pagination;
