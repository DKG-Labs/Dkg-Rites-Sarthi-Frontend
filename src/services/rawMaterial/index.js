/**
 * Raw Material Services Index
 * 
 * Exports all raw material related services for easy importing.
 * 
 * Usage:
 * import { fetchAllRawMaterialCalls, fetchHeatQuantitiesByCallId } from 'services/rawMaterial';
 */

export {
    // Inspection Call APIs
    fetchAllRawMaterialCalls,
    fetchRawMaterialCallsByStatus,
    fetchInspectionCallById,
    fetchInspectionCallByCallNo,
    
    // RM Inspection Details APIs
    fetchRmDetailsByCallId,
    
    // Heat Quantity APIs
    fetchHeatQuantitiesByCallId,
    fetchHeatQuantityById,
    
    // Chemical Analysis APIs
    fetchChemicalAnalysesByHeatId,
    fetchChemicalAnalysesByCallId,
    
    // Data Transformation
    formatValue,
    transformToLandingPageFormat,
    fetchTransformedRawMaterialCalls,
    fetchPendingRawMaterialCalls
} from './rawMaterialApiService';

