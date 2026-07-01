import React from 'react';

const CallsFilterSection = ({
    allCalls,
    filteredCalls,
    filters,
    setFilters,
    showFilters,
    setShowFilters,
    filterSearch,
    setFilterSearch,
    selectedCategory,
    setSelectedCategory,
    clearAllFilters,
    handleFilterChange,
    handleMultiSelectToggle,
    summaryLabel
}) => {
    return (
        <div className="filter-section" style={{ padding: '16px', background: '#fff', marginBottom: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3>Filter {summaryLabel}</h3>
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        minHeight: '40px',
                        padding: '0 16px',
                        backgroundColor: showFilters ? '#0f766e' : '#0d9488', 
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        boxShadow: '0 2px 4px rgba(13, 148, 136, 0.2)',
                        transition: 'background-color 0.2s'
                    }}
                >
                    <span style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>▾</span>
                    <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                </button>
            </div>

            {showFilters && (
                <div className="filter-controls">
                    <div style={{ marginBottom: '10px' }}>
                        <input
                            type="text"
                            placeholder="Search filters..."
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                            style={{ padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={clearAllFilters} style={{ padding: '4px 8px' }}>Clear All</button>
                        {/* Add more filter controls here as needed */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CallsFilterSection;
