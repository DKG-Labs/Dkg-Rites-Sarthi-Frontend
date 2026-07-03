import { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * Inspection Context - Provides shared state across all inspection pages
 * Handles: selectedCall, heats, productModel, processLines, etc.
 */

const InspectionContext = createContext(null);

const STABLE_NOT_CACHED = { isCached: false };

export const InspectionProvider = ({ children }) => {
  // Selected call from landing page
  const [selectedCall, setSelectedCall] = useState(() => {
    const saved = sessionStorage.getItem('selectedCall');
    return saved ? JSON.parse(saved) : null;
  });

  // Multiple calls for batch inspection
  const [selectedCalls, setSelectedCalls] = useState(() => {
    const saved = sessionStorage.getItem('selectedCalls');
    return saved ? JSON.parse(saved) : [];
  });

  // Active inspection type: 'raw-material', 'process', 'final-product'
  const [activeInspectionType, setActiveInspectionType] = useState(() => {
    return sessionStorage.getItem('activeInspectionType') || null;
  });

  // Inspection shift and date (from Initiation page)
  const [inspectionShift, setInspectionShift] = useState(() => {
    return sessionStorage.getItem('inspectionShift') || '';
  });

  const [inspectionDate, setInspectionDate] = useState(() => {
    return sessionStorage.getItem('inspectionDate') || '';
  });

  // Raw Material shared state
  const [rmHeats, setRmHeats] = useState(() => {
    const saved = sessionStorage.getItem('rmHeats');
    return saved ? JSON.parse(saved) : [{ heatNo: '', weight: '' }];
  });

  const [rmProductModel, setRmProductModel] = useState(() => {
    return sessionStorage.getItem('rmProductModel') || 'MK-III';
  });

  // Raw Material Ladle Values (vendor chemical composition from database)
  const [rmLadleValues, setRmLadleValues] = useState(() => {
    const saved = sessionStorage.getItem('rmLadleValues');
    return saved ? JSON.parse(saved) : null;
  });

  // ==================== PERFORMANCE OPTIMIZATION: Data Caching ====================
  // Cache fetched PO data to avoid re-fetching on navigation
  const [rmPoDataCache, setRmPoDataCache] = useState(() => {
    const saved = sessionStorage.getItem('rmPoDataCache');
    return saved ? JSON.parse(saved) : {};
  });

  // Cache fetched call data
  const [rmCallDataCache, setRmCallDataCache] = useState(() => {
    const saved = sessionStorage.getItem('rmCallDataCache');
    return saved ? JSON.parse(saved) : {};
  });

  // Cache fetched heat data
  const [rmHeatDataCache, setRmHeatDataCache] = useState(() => {
    const saved = sessionStorage.getItem('rmHeatDataCache');
    return saved ? JSON.parse(saved) : {};
  });

  // Cache timestamp to track when data was last fetched
  const [rmDataCacheTimestamp, setRmDataCacheTimestamp] = useState(() => {
    const saved = sessionStorage.getItem('rmDataCacheTimestamp');
    return saved ? JSON.parse(saved) : {};
  });

  // ==================== FINAL PRODUCT DATA CACHING ====================
  // Cache fetched Final Product dashboard data to avoid re-fetching on navigation
  const [fpDashboardDataCache, setFpDashboardDataCache] = useState(() => {
    const saved = sessionStorage.getItem('fpDashboardDataCache');
    return saved ? JSON.parse(saved) : {};
  });

  // Cache timestamp for Final Product data
  const [fpDataCacheTimestamp, setFpDataCacheTimestamp] = useState(() => {
    const saved = sessionStorage.getItem('fpDataCacheTimestamp');
    return saved ? JSON.parse(saved) : {};
  });

  // ==================== DOWNLOAD IC & ANNEXURES CACHING ====================
  const [icAnnexuresCache, setIcAnnexuresCache] = useState(() => {
    const saved = sessionStorage.getItem('icAnnexuresCache');
    return saved ? JSON.parse(saved) : {};
  });

  const [icAnnexuresCacheTimestamp, setIcAnnexuresCacheTimestamp] = useState(() => {
    const saved = sessionStorage.getItem('icAnnexuresCacheTimestamp');
    return saved ? JSON.parse(saved) : {};
  });

  // Memory cache for completed calls (for IE landing page certificates tab)
  const [completedCallsCache, setCompletedCallsCache] = useState(null);

  // Process shared state
  const [processShift, setProcessShift] = useState(() => {
    return sessionStorage.getItem('processShift') || 'A';
  });

  const [processSelectedLines, setProcessSelectedLines] = useState(() => {
    const saved = sessionStorage.getItem('processSelectedLines');
    return saved ? JSON.parse(saved) : ['Line-1'];
  });

  const [processProductionLines, setProcessProductionLines] = useState(() => {
    const saved = sessionStorage.getItem('processProductionLines');
    return saved ? JSON.parse(saved) : [];
  });

  const [processLotNumbers] = useState(['LOT-001', 'LOT-002', 'LOT-003']);

  // Landing page active tab
  const [landingActiveTab, setLandingActiveTab] = useState('pending');

  // Persist to sessionStorage on change
  const updateSelectedCall = useCallback((call) => {
    setSelectedCall(call);
    if (call) {
      sessionStorage.setItem('selectedCall', JSON.stringify(call));
    } else {
      sessionStorage.removeItem('selectedCall');
    }
  }, []);

  const updateSelectedCalls = useCallback((calls) => {
    setSelectedCalls(calls);
    if (calls.length > 0) {
      sessionStorage.setItem('selectedCalls', JSON.stringify(calls));
    } else {
      sessionStorage.removeItem('selectedCalls');
    }
  }, []);

  const updateActiveInspectionType = useCallback((type) => {
    setActiveInspectionType(type);
    if (type) {
      sessionStorage.setItem('activeInspectionType', type);
    } else {
      sessionStorage.removeItem('activeInspectionType');
    }
  }, []);

  const updateRmHeats = useCallback((heats) => {
    setRmHeats(heats);
    sessionStorage.setItem('rmHeats', JSON.stringify(heats));
  }, []);

  const updateRmProductModel = useCallback((model) => {
    setRmProductModel(model);
    sessionStorage.setItem('rmProductModel', model);
  }, []);

  const updateRmLadleValues = useCallback((values) => {
    setRmLadleValues(values);
    if (values) {
      sessionStorage.setItem('rmLadleValues', JSON.stringify(values));
    } else {
      sessionStorage.removeItem('rmLadleValues');
    }
  }, []);

  // ==================== Cache Management Functions ====================

  /**
   * Update RM PO data cache for a specific call
   * @param {string} callNo - Inspection call number
   * @param {object} poData - PO data to cache
   */
  const updateRmPoDataCache = useCallback((callNo, poData) => {
    setRmPoDataCache(prev => {
      const updated = { ...prev, [callNo]: poData };
      sessionStorage.setItem('rmPoDataCache', JSON.stringify(updated));
      return updated;
    });
    // Update timestamp
    setRmDataCacheTimestamp(prev => {
      const updated = { ...prev, [callNo]: Date.now() };
      sessionStorage.setItem('rmDataCacheTimestamp', JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * Update RM call data cache
   */
  const updateRmCallDataCache = useCallback((callNo, callData) => {
    setRmCallDataCache(prev => {
      const updated = { ...prev, [callNo]: callData };
      sessionStorage.setItem('rmCallDataCache', JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * Update RM heat data cache
   */
  const updateRmHeatDataCache = useCallback((callNo, heatData) => {
    setRmHeatDataCache(prev => {
      const updated = { ...prev, [callNo]: heatData };
      sessionStorage.setItem('rmHeatDataCache', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Memoize RM cache return to ensure stable reference
  const getRmCachedData = useCallback((callNo) => {
    const timestamp = rmDataCacheTimestamp[callNo];
    const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

    if (timestamp && (Date.now() - timestamp) < CACHE_DURATION) {
      if (rmPoDataCache[callNo] || rmCallDataCache[callNo] || rmHeatDataCache[callNo]) {
        return {
          poData: rmPoDataCache[callNo],
          callData: rmCallDataCache[callNo],
          heatData: rmHeatDataCache[callNo],
          isCached: true
        };
      }
    }

    return STABLE_NOT_CACHED;
  }, [rmDataCacheTimestamp, rmPoDataCache, rmCallDataCache, rmHeatDataCache]);

  /**
   * Clear cache for a specific call or all caches
   */
  const clearRmCache = useCallback((callNo = null) => {
    if (callNo) {
      // Clear specific call cache
      setRmPoDataCache(prev => {
        const updated = { ...prev };
        delete updated[callNo];
        sessionStorage.setItem('rmPoDataCache', JSON.stringify(updated));
        return updated;
      });
      setRmCallDataCache(prev => {
        const updated = { ...prev };
        delete updated[callNo];
        sessionStorage.setItem('rmCallDataCache', JSON.stringify(updated));
        return updated;
      });
      setRmHeatDataCache(prev => {
        const updated = { ...prev };
        delete updated[callNo];
        sessionStorage.setItem('rmHeatDataCache', JSON.stringify(updated));
        return updated;
      });
      setRmDataCacheTimestamp(prev => {
        const updated = { ...prev };
        delete updated[callNo];
        sessionStorage.setItem('rmDataCacheTimestamp', JSON.stringify(updated));
        return updated;
      });
    } else {
      // Clear all caches
      setRmPoDataCache({});
      setRmCallDataCache({});
      setRmHeatDataCache({});
      setRmDataCacheTimestamp({});
      sessionStorage.removeItem('rmPoDataCache');
      sessionStorage.removeItem('rmCallDataCache');
      sessionStorage.removeItem('rmHeatDataCache');
      sessionStorage.removeItem('rmDataCacheTimestamp');
    }
  }, []);

  /**
   * Update Final Product dashboard data cache for a specific call
   * @param {string} callNo - Inspection call number
   * @param {object} dashboardData - Dashboard data to cache
   */
  const updateFpDashboardDataCache = useCallback((callNo, dashboardData) => {
    setFpDashboardDataCache(prev => {
      // Add isCached flag and dashboardData self-reference for backward compatibility
      // This ensures callers expecting { isCached, dashboardData } are satisfied
      const cachedEntry = {
        ...dashboardData,
        isCached: true,
        dashboardData: dashboardData
      };
      const updated = { ...prev, [callNo]: cachedEntry };
      sessionStorage.setItem('fpDashboardDataCache', JSON.stringify(updated));
      return updated;
    });
    // Update timestamp
    setFpDataCacheTimestamp(prev => {
      const updated = { ...prev, [callNo]: Date.now() };
      sessionStorage.setItem('fpDataCacheTimestamp', JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * Get cached Final Product dashboard data for a specific call
   * Returns null if cache is expired (older than 15 minutes)
   */
  const getFpCachedData = useCallback((callNo) => {
    const timestamp = fpDataCacheTimestamp[callNo];
    const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

    // Check if cache exists and is not expired
    if (timestamp && (Date.now() - timestamp) < CACHE_DURATION) {
      const entry = fpDashboardDataCache[callNo];
      if (entry && !entry.isCached) {
        // Handle old cache format for backward compatibility
        return { ...entry, isCached: true, dashboardData: entry };
      }
      return entry || STABLE_NOT_CACHED;
    }

    return STABLE_NOT_CACHED;
  }, [fpDataCacheTimestamp, fpDashboardDataCache]);

  const clearFpCache = useCallback((callNo = null) => {
    if (callNo) {
      // Clear specific call cache
      setFpDashboardDataCache(prev => {
        const updated = { ...prev };
        delete updated[callNo];
        sessionStorage.setItem('fpDashboardDataCache', JSON.stringify(updated));
        return updated;
      });
      setFpDataCacheTimestamp(prev => {
        const updated = { ...prev };
        delete updated[callNo];
        sessionStorage.setItem('fpDataCacheTimestamp', JSON.stringify(updated));
        return updated;
      });
    } else {
      // Clear all caches
      setFpDashboardDataCache({});
      setFpDataCacheTimestamp({});
      sessionStorage.removeItem('fpDashboardDataCache');
      sessionStorage.removeItem('fpDataCacheTimestamp');
    }
  }, []);

  /**
   * Update IC & Annexures cache for a specific product
   * @param {string} product - Product type ('ERC', 'Sleeper', 'Rail Pad')
   * @param {array} records - Records list to cache
   */
  const updateIcAnnexuresCache = useCallback((product, records) => {
    setIcAnnexuresCache(prev => {
      const updated = { ...prev, [product]: records };
      sessionStorage.setItem('icAnnexuresCache', JSON.stringify(updated));
      return updated;
    });
    setIcAnnexuresCacheTimestamp(prev => {
      const updated = { ...prev, [product]: Date.now() };
      sessionStorage.setItem('icAnnexuresCacheTimestamp', JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * Get cached IC & Annexures data for a specific product
   * Returns null/isCached=false if cache is expired (older than 5 minutes)
   */
  const getIcAnnexuresCachedData = useCallback((product) => {
    const timestamp = icAnnexuresCacheTimestamp[product];
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    if (timestamp && (Date.now() - timestamp) < CACHE_DURATION) {
      if (icAnnexuresCache[product]) {
        return {
          records: icAnnexuresCache[product],
          isCached: true
        };
      }
    }

    return STABLE_NOT_CACHED;
  }, [icAnnexuresCache, icAnnexuresCacheTimestamp]);

  /**
   * Clear IC & Annexures cache for a specific product or all caches
   */
  const clearIcAnnexuresCache = useCallback((product = null) => {
    if (product) {
      setIcAnnexuresCache(prev => {
        const updated = { ...prev };
        delete updated[product];
        sessionStorage.setItem('icAnnexuresCache', JSON.stringify(updated));
        return updated;
      });
      setIcAnnexuresCacheTimestamp(prev => {
        const updated = { ...prev };
        delete updated[product];
        sessionStorage.setItem('icAnnexuresCacheTimestamp', JSON.stringify(updated));
        return updated;
      });
    } else {
      setIcAnnexuresCache({});
      setIcAnnexuresCacheTimestamp({});
      sessionStorage.removeItem('icAnnexuresCache');
      sessionStorage.removeItem('icAnnexuresCacheTimestamp');
    }
  }, []);

  const updateProcessShift = useCallback((shift) => {
    setProcessShift(shift);
    sessionStorage.setItem('processShift', shift);
  }, []);

  const updateProcessSelectedLines = useCallback((lines) => {
    setProcessSelectedLines(lines);
    sessionStorage.setItem('processSelectedLines', JSON.stringify(lines));
  }, []);

  const updateProcessProductionLines = useCallback((lines) => {
    setProcessProductionLines(lines);
    sessionStorage.setItem('processProductionLines', JSON.stringify(lines));
  }, []);

  const updateInspectionShift = useCallback((shift) => {
    setInspectionShift(shift);
    if (shift) {
      sessionStorage.setItem('inspectionShift', shift);
    } else {
      sessionStorage.removeItem('inspectionShift');
    }
  }, []);

  const updateInspectionDate = useCallback((date) => {
    setInspectionDate(date);
    if (date) {
      sessionStorage.setItem('inspectionDate', date);
    } else {
      sessionStorage.removeItem('inspectionDate');
    }
  }, []);

  // Clear all inspection data (on logout or navigation reset)
  const clearInspectionData = useCallback(() => {
    setSelectedCall(null);
    setSelectedCalls([]);
    setActiveInspectionType(null);
    setInspectionShift('');
    setInspectionDate('');
    setRmHeats([{ heatNo: '', weight: '' }]);
    setRmProductModel('MK-III');
    setRmLadleValues(null);
    setProcessShift('A');
    setProcessSelectedLines(['Line-1']);
    setProcessProductionLines([]);
    setLandingActiveTab('pending');

    sessionStorage.removeItem('selectedCall');
    sessionStorage.removeItem('selectedCalls');
    sessionStorage.removeItem('activeInspectionType');
    sessionStorage.removeItem('inspectionShift');
    sessionStorage.removeItem('inspectionDate');
    sessionStorage.removeItem('rmHeats');
    sessionStorage.removeItem('rmProductModel');
    sessionStorage.removeItem('rmLadleValues');
    sessionStorage.removeItem('processShift');
    sessionStorage.removeItem('processSelectedLines');
    sessionStorage.removeItem('processProductionLines');

    // Clear all caches
    clearRmCache();
    clearFpCache();
    clearIcAnnexuresCache();
    setCompletedCallsCache(null);
  }, [clearRmCache, clearFpCache, clearIcAnnexuresCache, setCompletedCallsCache]);

  // Save call_no separately for easier fallback access in submodules
  useEffect(() => {
    if (selectedCall?.call_no) {
      sessionStorage.setItem('selectedCallNo', selectedCall.call_no);
    }
  }, [selectedCall?.call_no]);

  const value = {
    selectedCall,
    selectedCalls,
    activeInspectionType,
    inspectionShift,
    inspectionDate,
    rmHeats,
    rmProductModel,
    rmLadleValues,
    processShift,
    processSelectedLines,
    processProductionLines,
    processLotNumbers,
    landingActiveTab,
    setSelectedCall: updateSelectedCall,
    setSelectedCalls: updateSelectedCalls,
    setActiveInspectionType: updateActiveInspectionType,
    setInspectionShift: updateInspectionShift,
    setInspectionDate: updateInspectionDate,
    setRmHeats: updateRmHeats,
    setRmProductModel: updateRmProductModel,
    setRmLadleValues: updateRmLadleValues,
    setProcessShift: updateProcessShift,
    setProcessSelectedLines: updateProcessSelectedLines,
    setProcessProductionLines: updateProcessProductionLines,
    setLandingActiveTab,
    clearInspectionData,
    // Cache management functions - Raw Material
    updateRmPoDataCache,
    updateRmCallDataCache,
    updateRmHeatDataCache,
    getRmCachedData,
    clearRmCache,
    // Cache management functions - Final Product
    updateFpDashboardDataCache,
    getFpCachedData,
    clearFpCache,
    // Cache management functions - Download IC & Annexures
    updateIcAnnexuresCache,
    getIcAnnexuresCachedData,
    clearIcAnnexuresCache,
    // Completed calls cache for IE Landing Page
    completedCallsCache,
    setCompletedCallsCache,
  };

  return (
    <InspectionContext.Provider value={value}>
      {children}
    </InspectionContext.Provider>
  );
};

export const useInspection = () => {
  const context = useContext(InspectionContext);
  if (!context) {
    throw new Error('useInspection must be used within an InspectionProvider');
  }
  return context;
};

export default InspectionContext;

