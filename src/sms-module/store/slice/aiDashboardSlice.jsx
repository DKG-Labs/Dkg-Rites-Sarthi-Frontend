/* eslint-disable */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Search criteria
  searchCriteria: {
    timePeriod: 'shift',
    startDate: '',
    weekStartDate: '',
    weekEndDate: '',
    inspectionShift: ''
  },
  
  // Dashboard data
  dashboardData: {
    summaryCards: [],
    allData: [], // All fetched data for pagination
    paginatedData: [], // Current page data
    totalRailIds: 0,
    avgPrecisionSurfaceDefect: '',
    avgRecallSurfaceDefect: '',
    avgPrecisionDimensionalVariation: '',
    avgRecallDimensionalVariation: '',
    ocrAccuracy: ''
  },
  
  // Pagination state
  pagination: {
    currentPage: 1,
    pageSize: 50,
    totalElements: 0
  },
  
  // UI state
  loading: false,
  error: null,
  hasData: false, // Flag to track if we have fetched data
  lastFetchTime: null // Track when data was last fetched
};

const aiDashboardSlice = createSlice({
  name: 'aiDashboard',
  initialState,
  reducers: {
    // Search criteria actions
    setSearchCriteria: (state, action) => {
      state.searchCriteria = { ...state.searchCriteria, ...action.payload };
    },
    
    resetSearchCriteria: (state) => {
      state.searchCriteria = initialState.searchCriteria;
    },
    
    // Dashboard data actions
    setDashboardData: (state, action) => {
      const { summaryCards, allData, ...otherData } = action.payload;
      
      state.dashboardData = {
        ...state.dashboardData,
        ...otherData,
        summaryCards: summaryCards || [],
        allData: allData || []
      };
      
      // Update pagination data for first page
      state.pagination.totalElements = allData ? allData.length : 0;
      state.pagination.currentPage = 1;
      
      // Set paginated data for first page
      const startIndex = 0;
      const endIndex = state.pagination.pageSize;
      state.dashboardData.paginatedData = allData ? allData.slice(startIndex, endIndex) : [];
      
      state.hasData = true;
      state.lastFetchTime = Date.now();
      state.error = null;
    },
    
    // Pagination actions
    setPaginationData: (state, action) => {
      const { currentPage, pageSize } = action.payload;
      const { allData } = state.dashboardData;
      
      state.pagination.currentPage = currentPage;
      if (pageSize) {
        state.pagination.pageSize = pageSize;
      }
      
      // Calculate paginated data
      const startIndex = (currentPage - 1) * state.pagination.pageSize;
      const endIndex = startIndex + state.pagination.pageSize;
      state.dashboardData.paginatedData = allData.slice(startIndex, endIndex);
    },
    
    // Loading and error actions
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    // Reset all data (for reset button)
    resetDashboard: (state) => {
      return {
        ...initialState,
        searchCriteria: state.searchCriteria // Keep search criteria but reset data
      };
    },
    
    // Complete reset (including search criteria)
    resetAll: () => {
      return initialState;
    }
  }
});

export const {
  setSearchCriteria,
  resetSearchCriteria,
  setDashboardData,
  setPaginationData,
  setLoading,
  setError,
  clearError,
  resetDashboard,
  resetAll
} = aiDashboardSlice.actions;

export default aiDashboardSlice.reducer;
