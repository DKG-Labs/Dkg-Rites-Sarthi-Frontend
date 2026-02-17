/**
 * Routes Configuration
 * Centralized route definitions for the application
 */

// Route paths constants
export const ROUTES = {
  // Auth
  LOGIN: '/login',

  // Landing
  LANDING: '/',

  // Inspection Initiation
  INITIATION: '/inspection/initiation',
  MULTI_INITIATION: '/inspection/multi-initiation',

  // Raw Material Routes
  RAW_MATERIAL: '/raw-material',
  RAW_MATERIAL_CALIBRATION: '/raw-material/calibration-documents',
  RAW_MATERIAL_VISUAL: '/raw-material/visual-inspection',
  RAW_MATERIAL_DIMENSIONAL: '/raw-material/dimensional-check',
  RAW_MATERIAL_TESTING: '/raw-material/material-testing',
  RAW_MATERIAL_PACKING: '/raw-material/packing-storage',
  RAW_MATERIAL_SUMMARY: '/raw-material/summary-reports',

  // Process Routes
  PROCESS: '/process',
  PROCESS_CALIBRATION: '/process/calibration-documents',
  PROCESS_STATIC_CHECK: '/process/static-periodic-check',
  PROCESS_OIL_TANK: '/process/oil-tank-counter',
  PROCESS_PARAMETERS: '/process/parameters-grid',
  PROCESS_SUMMARY: '/process/summary-reports',

  // Final Product Routes
  FINAL_PRODUCT: '/final-product',
  FINAL_CALIBRATION: '/final-product/calibration-documents',
  FINAL_VISUAL_DIMENSIONAL: '/final-product/visual-dimensional',
  FINAL_CHEMICAL: '/final-product/chemical-analysis',
  FINAL_HARDNESS: '/final-product/hardness-test',
  FINAL_INCLUSION: '/final-product/inclusion-rating',
  FINAL_DEFLECTION: '/final-product/application-deflection',
  FINAL_TOE_LOAD: '/final-product/toe-load-test',
  FINAL_WEIGHT: '/final-product/weight-test',
  FINAL_REPORTS: '/final-product/reports',

  // IC (Inspection Certificate) Routes
  IC_RAW_MATERIAL: '/ic/raw-material',
  IC_PROCESS: '/ic/process-material',
  IC_FINAL_PRODUCT: '/ic/final-product',

  // CM (Controlling Manager) Routes
  CM_DASHBOARD: '/cm',
  CM_APPROVALS: '/cm/approvals',
  CM_WORKLOAD: '/cm/workload',
  CM_PERFORMANCE: '/cm/performance',

  // Call Desk Routes
  CALL_DESK: '/call-desk',

  // Finance Routes
  FINANCE: '/finance',

  // Railway Board Routes
  RAILWAY_BOARD_DASHBOARD: '/railway-board',
};

/**
 * Mapping from old page IDs to new routes
 * Used during migration to convert setCurrentPage calls to navigate
 */
export const PAGE_TO_ROUTE_MAP = {
  'landing': ROUTES.LANDING,
  'initiation': ROUTES.INITIATION,
  'multi-initiation': ROUTES.MULTI_INITIATION,
  'raw-material': ROUTES.RAW_MATERIAL,
  'calibration-documents': ROUTES.RAW_MATERIAL_CALIBRATION,
  'visual-inspection': ROUTES.RAW_MATERIAL_VISUAL,
  'dimensional-check': ROUTES.RAW_MATERIAL_DIMENSIONAL,
  'material-testing': ROUTES.RAW_MATERIAL_TESTING,
  'packing-storage': ROUTES.RAW_MATERIAL_PACKING,
  'summary-reports': ROUTES.RAW_MATERIAL_SUMMARY,
  'process': ROUTES.PROCESS,
  'process-calibration-documents': ROUTES.PROCESS_CALIBRATION,
  'process-static-periodic-check': ROUTES.PROCESS_STATIC_CHECK,
  'process-oil-tank-counter': ROUTES.PROCESS_OIL_TANK,
  'process-parameters-grid': ROUTES.PROCESS_PARAMETERS,
  'process-summary-reports': ROUTES.PROCESS_SUMMARY,
  'final-product': ROUTES.FINAL_PRODUCT,
  'final-calibration-documents': ROUTES.FINAL_CALIBRATION,
  'final-visual-dimensional': ROUTES.FINAL_VISUAL_DIMENSIONAL,
  'final-chemical-analysis': ROUTES.FINAL_CHEMICAL,
  'final-hardness-test': ROUTES.FINAL_HARDNESS,
  'final-inclusion-rating': ROUTES.FINAL_INCLUSION,
  'final-application-deflection': ROUTES.FINAL_DEFLECTION,
  'final-toe-load-test': ROUTES.FINAL_TOE_LOAD,
  'final-weight-test': ROUTES.FINAL_WEIGHT,
  'final-reports': ROUTES.FINAL_REPORTS,
  'ic-rawmaterial': ROUTES.IC_RAW_MATERIAL,
  'ic-processmaterial': ROUTES.IC_PROCESS,
  'ic-finalproduct': ROUTES.IC_FINAL_PRODUCT,
};

/**
 * Get route path from old page ID
 */
export const getRouteFromPageId = (pageId) => {
  return PAGE_TO_ROUTE_MAP[pageId] || ROUTES.LANDING;
};

/**
 * Submodule route mappings for navigation components
 */
export const RAW_MATERIAL_SUBMODULE_ROUTES = {
  'calibration-documents': ROUTES.RAW_MATERIAL_CALIBRATION,
  'visual-inspection': ROUTES.RAW_MATERIAL_VISUAL,
  'dimensional-check': ROUTES.RAW_MATERIAL_DIMENSIONAL,
  'material-testing': ROUTES.RAW_MATERIAL_TESTING,
  'packing-storage': ROUTES.RAW_MATERIAL_PACKING,
  'summary-reports': ROUTES.RAW_MATERIAL_SUMMARY,
};

export const PROCESS_SUBMODULE_ROUTES = {
  'process-calibration-documents': ROUTES.PROCESS_CALIBRATION,
  'process-static-periodic-check': ROUTES.PROCESS_STATIC_CHECK,
  'process-oil-tank-counter': ROUTES.PROCESS_OIL_TANK,
  'process-parameters-grid': ROUTES.PROCESS_PARAMETERS,
  'process-summary-reports': ROUTES.PROCESS_SUMMARY,
};

export const FINAL_PRODUCT_SUBMODULE_ROUTES = {
  'final-calibration-documents': ROUTES.FINAL_CALIBRATION,
  'final-visual-dimensional': ROUTES.FINAL_VISUAL_DIMENSIONAL,
  'final-chemical-analysis': ROUTES.FINAL_CHEMICAL,
  'final-hardness-test': ROUTES.FINAL_HARDNESS,
  'final-inclusion-rating': ROUTES.FINAL_INCLUSION,
  'final-application-deflection': ROUTES.FINAL_DEFLECTION,
  'final-toe-load-test': ROUTES.FINAL_TOE_LOAD,
  'final-weight-test': ROUTES.FINAL_WEIGHT,
  'final-reports': ROUTES.FINAL_REPORTS,
};


export const ROLE_LANDING_ROUTE = {
  IE: ROUTES.LANDING,
  'Process IE': ROUTES.LANDING,
  CM: ROUTES.CM_DASHBOARD,
  CALL_DESK: ROUTES.CALL_DESK,
  'RIO Help Desk': ROUTES.CALL_DESK,
  Finance: ROUTES.FINANCE,
  RAILWAY_BOARD: ROUTES.RAILWAY_BOARD_DASHBOARD,
};