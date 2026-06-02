import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
  Collapse,
  Button,
  TextField,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import { 
  fetchVendorCalibrations, 
  lookupVendorCodeByName, 
  saveIeCalibrationInspection,
  fetchIeCalibrationInspection 
} from '../services/ieCalibrationService';

const getShiftSuffix = () => {
  const shift = sessionStorage.getItem('inspectionShift');
  return shift ? `_${shift}` : '';
};

/**
 * Calibration & Document Verification Sub Module
 * Used inside ERC Raw Material, Process, and Final Inspection modules.
 *
 * Fetches live vendor calibration data via the backend API and displays
 * instrument calibration status, certificates, and validity information.
 *
 * @param {string} vendorCode - The vendor code to fetch calibrations for
 * @param {string} vendorName - The manufacturer/vendor name to lookup vendor code
 * @param {string} inspectionCallNo - The current inspection call number
 * @param {string} poNo - The purchase order number
 */
const CalibrationSubModule = ({ vendorCode = '', vendorName = '', inspectionCallNo = '', poNo = '' }) => {
  const [calibrationData, setCalibrationData] = useState(() => {
    if (inspectionCallNo) {
      const cached = localStorage.getItem(`calibration_instruments_${inspectionCallNo}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.error('Error parsing cached calibration instruments:', e);
        }
      }
    }
    return [];
  });

  const [loading, setLoading] = useState(() => {
    if (inspectionCallNo) {
      const cached = localStorage.getItem(`calibration_instruments_${inspectionCallNo}`);
      if (cached) return false;
    }
    return true;
  });

  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [resolvedVendorCode, setResolvedVendorCode] = useState(vendorCode);
  
  // Verification states
  const [verifications, setVerifications] = useState(() => {
    if (inspectionCallNo) {
      const calKeyMain = `calibration_draft_data_${inspectionCallNo}`;
      const calKeyShift = `calibration_draft_data_${inspectionCallNo}${getShiftSuffix()}`;
      const draftRaw = localStorage.getItem(calKeyShift) || localStorage.getItem(calKeyMain);
      if (draftRaw) {
        try {
          const draftData = JSON.parse(draftRaw);
          if (Array.isArray(draftData)) {
            const savedInspectionMap = {};
            draftData.forEach(item => {
              const key = `${item.instrumentName}_${item.serialNumber}`;
              savedInspectionMap[key] = {
                status: item.inspectionStatus || 'OK',
                remark: item.inspectionRemark || ''
              };
            });
            return savedInspectionMap;
          }
        } catch (e) {
          console.error('Error parsing cached calibration verifications:', e);
        }
      }
    }
    return {};
  });

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadCalibrations = useCallback(async (forceReload = false) => {
    const cachedInstrumentsRaw = localStorage.getItem(`calibration_instruments_${inspectionCallNo}`);
    const calKeyMain = `calibration_draft_data_${inspectionCallNo}`;
    const calKeyShift = `calibration_draft_data_${inspectionCallNo}${getShiftSuffix()}`;
    const draftRaw = localStorage.getItem(calKeyShift) || localStorage.getItem(calKeyMain);

    // If we have both cached instruments AND draft verification in localStorage, AND we are not forcing a reload:
    // We can skip ALL API calls (both vendor calibrations and IE saved verifications) because everything is in localStorage.
    if (cachedInstrumentsRaw && draftRaw && !forceReload) {
      console.log('🔧 CalibrationSubModule: Skipping all API calls, using cached data from localStorage');
      setLoading(false);
      return;
    }

    let resolvedCode = vendorCode;
    setLoading(true);
    setError(null);

    try {
      let instruments = [];

      // Step 1: Get instruments (either from cache or API)
      if (cachedInstrumentsRaw && !forceReload) {
        console.log('🔧 CalibrationSubModule: Using cached instruments from localStorage');
        try {
          instruments = JSON.parse(cachedInstrumentsRaw);
        } catch (e) {
          console.error('Error parsing cached instruments:', e);
        }
      }

      // If parsing failed or we don't have cached instruments, fetch them
      if (!instruments || instruments.length === 0) {
        if (vendorName) {
          console.log('🔧 CalibrationSubModule: Looking up vendor code for manufacturer:', vendorName);
          const lookupRes = await lookupVendorCodeByName(vendorName);
          if (lookupRes.success && lookupRes.vendorCode) {
            resolvedCode = lookupRes.vendorCode;
            setResolvedVendorCode(resolvedCode);
            console.log('🔧 CalibrationSubModule: Successfully resolved vendor code:', resolvedCode);
          } else {
            console.warn('⚠️ CalibrationSubModule: Could not resolve vendor code for manufacturer:', vendorName, lookupRes.error);
          }
        }

        if (!resolvedCode) {
          setError('No vendor code or manufacturer name available');
          setCalibrationData([]);
          setLoading(false);
          return;
        }

        if (!vendorName) {
          setResolvedVendorCode(resolvedCode);
        }

        console.log('🔧 CalibrationSubModule: Fetching vendor calibrations from API');
        const result = await fetchVendorCalibrations(resolvedCode);
        if (result.success) {
          instruments = result.data;
          // Cache active instruments to localStorage
          localStorage.setItem(`calibration_instruments_${inspectionCallNo}`, JSON.stringify(result.data));
        } else {
          setError(result.error);
          setCalibrationData([]);
          setLoading(false);
          return;
        }
      }

      setCalibrationData(instruments);

      // Auto-expand all categories
      const categories = {};
      instruments.forEach(row => {
        categories[row.category] = true;
      });
      setExpandedCategories(categories);

      // Step 2: Load verifications (either from draftRaw or backend)
      let savedInspectionMap = {};
      if (draftRaw && !forceReload) {
        try {
          const draftData = JSON.parse(draftRaw);
          if (Array.isArray(draftData)) {
            console.log('🔧 CalibrationSubModule: Loaded calibration from localStorage draft:', draftData);
            draftData.forEach(item => {
              const key = `${item.instrumentName}_${item.serialNumber}`;
              savedInspectionMap[key] = {
                status: item.inspectionStatus || 'OK',
                remark: item.inspectionRemark || ''
              };
            });
          }
        } catch (e) {
          console.error('Error parsing localStorage calibration draft:', e);
        }
      } else if (inspectionCallNo) {
        console.log('🔧 CalibrationSubModule: Fetching saved inspection from backend for call:', inspectionCallNo);
        const savedRes = await fetchIeCalibrationInspection(inspectionCallNo);
        if (savedRes.success && savedRes.data && savedRes.data.details) {
          console.log('🔧 CalibrationSubModule: Loaded saved verifications from backend:', savedRes.data.details);
          savedRes.data.details.forEach(detail => {
            const key = `${detail.instrumentName}_${detail.serialNumber}`;
            savedInspectionMap[key] = {
              status: detail.inspectionStatus || 'OK',
              remark: detail.inspectionRemark || ''
            };
          });
        }
      }

      // Initialize verifications state
      const initialVerifications = {};
      instruments.forEach(row => {
        const key = `${row.instrumentName}_${row.serialNumber}`;
        if (savedInspectionMap[key]) {
          initialVerifications[key] = savedInspectionMap[key];
        } else {
          // Default to 'OK' if the computed status is 'Valid' or 'Expiring Soon', else 'NOT OK'
          const defaultStatus = row.calibrationStatus === 'Expired' ? 'NOT OK' : 'OK';
          initialVerifications[key] = {
            status: defaultStatus,
            remark: ''
          };
        }
      });
      setVerifications(initialVerifications);

      // Auto-save IE calibration inspection snapshot if not already saved in localStorage and backend
      if (inspectionCallNo && Object.keys(savedInspectionMap).length === 0) {
        console.log(`🔧 CalibrationSubModule: Auto-saving initial inspection snapshot for call: ${inspectionCallNo}`);
        const currentPoNo = poNo || 'N/A';
        saveIeCalibrationInspection({
          callNo: inspectionCallNo,
          poNumber: currentPoNo,
          vendorCode: resolvedCode || vendorCode,
          details: instruments.map(row => {
            const defaultStatus = row.calibrationStatus === 'Expired' ? 'NOT OK' : 'OK';
            return {
              instrumentName: row.instrumentName,
              capacity: row.capacity,
              serialNumber: row.serialNumber,
              calibrationCertificateNo: row.calibrationCertificateNo,
              inspectionStatus: defaultStatus,
              inspectionRemark: ''
            };
          })
        }).catch(err => {
          console.error('❌ CalibrationSubModule: Error auto-saving inspection snapshot:', err);
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load calibration data');
      setCalibrationData([]);
    } finally {
      setLoading(false);
    }
  }, [vendorCode, vendorName, inspectionCallNo, poNo]);

  useEffect(() => {
    loadCalibrations();
  }, [loadCalibrations]);

  // Auto-save verifications state to local storage on change
  useEffect(() => {
    if (inspectionCallNo && calibrationData.length > 0 && Object.keys(verifications).length > 0) {
      const calKeyMain = `calibration_draft_data_${inspectionCallNo}`;
      const calKeyShift = `calibration_draft_data_${inspectionCallNo}${getShiftSuffix()}`;
      
      const localStorageData = calibrationData.map(row => {
        const key = `${row.instrumentName}_${row.serialNumber}`;
        const ver = verifications[key] || { status: 'OK', remark: '' };
        return {
          instrumentName: row.instrumentName,
          capacity: row.capacity,
          serialNumber: row.serialNumber,
          calibrationCertificateNo: row.calibrationCertificateNo,
          inspectionStatus: ver.status,
          inspectionRemark: ver.remark,
          calibrationStatus: ver.status === 'OK' ? 'Valid' : 'Expired'
        };
      });
      
      localStorage.setItem(calKeyMain, JSON.stringify(localStorageData));
      localStorage.setItem(calKeyShift, JSON.stringify(localStorageData));
      
      // Dispatch storage event to notify other windows/components
      window.dispatchEvent(new Event('storage'));
      console.log('🔧 CalibrationSubModule: Auto-saved to localStorage:', localStorageData);
    }
  }, [verifications, calibrationData, inspectionCallNo]);

  const handleStatusChange = (key, newStatus) => {
    setVerifications(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        status: newStatus
      }
    }));
    setSaveSuccess(false);
  };

  const handleRemarkChange = (key, newRemark) => {
    setVerifications(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        remark: newRemark
      }
    }));
    setSaveSuccess(false);
  };

  const handleSaveVerification = async () => {
    setSaveLoading(true);
    setSaveSuccess(false);
    setError(null);

    try {
      // Build the details payload for the API
      const detailsPayload = calibrationData.map(row => {
        const key = `${row.instrumentName}_${row.serialNumber}`;
        const ver = verifications[key] || { status: 'OK', remark: '' };
        return {
          instrumentName: row.instrumentName,
          capacity: row.capacity,
          serialNumber: row.serialNumber,
          calibrationCertificateNo: row.calibrationCertificateNo,
          inspectionStatus: ver.status,
          inspectionRemark: ver.remark
        };
      });

      const payload = {
        callNo: inspectionCallNo,
        poNumber: poNo || 'N/A',
        vendorCode: resolvedVendorCode || vendorCode,
        details: detailsPayload
      };

      const saveRes = await saveIeCalibrationInspection(payload);
      if (saveRes.success) {
        setSaveSuccess(true);
        // Save to local storage for the dashboard to pick up!
        const calKeyMain = `calibration_draft_data_${inspectionCallNo}`;
        const calKeyShift = `calibration_draft_data_${inspectionCallNo}${getShiftSuffix()}`;
        
        // Convert to format suitable for validateCalibrationHeat
        const localStorageData = detailsPayload.map(item => ({
          ...item,
          calibrationStatus: item.inspectionStatus === 'OK' ? 'Valid' : 'Expired'
        }));
        
        localStorage.setItem(calKeyMain, JSON.stringify(localStorageData));
        localStorage.setItem(calKeyShift, JSON.stringify(localStorageData));
        
        // Dispatch storage event to notify other windows/components
        window.dispatchEvent(new Event('storage'));
        
        console.log('✅ IE Calibration: Saved to backend and local storage:', localStorageData);
      } else {
        throw new Error(saveRes.error || 'Failed to save verification');
      }
    } catch (err) {
      setError(err.message || 'Error saving verification data');
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getStatusChip = (status, daysLeft) => {
    if (status === 'Valid') {
      return (
        <Chip
          label={`Valid (${daysLeft}d)`}
          size="small"
          sx={{
            backgroundColor: '#dcfce7',
            color: '#166534',
            fontWeight: 600,
            fontSize: '11px',
            borderRadius: '6px',
          }}
        />
      );
    }
    if (status === 'Expiring Soon') {
      return (
        <Chip
          label={`Expiring (${daysLeft}d)`}
          size="small"
          sx={{
            backgroundColor: '#fef3c7',
            color: '#92400e',
            fontWeight: 600,
            fontSize: '11px',
            borderRadius: '6px',
          }}
        />
      );
    }
    return (
      <Chip
        label="Expired"
        size="small"
        sx={{
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          fontWeight: 600,
          fontSize: '11px',
          borderRadius: '6px',
        }}
      />
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Group rows by category
  const groupedData = calibrationData.reduce((acc, row) => {
    const cat = row.category || 'Instrument';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(row);
    return acc;
  }, {});

  const getCategoryIcon = (category) => {
    const lc = (category || '').toLowerCase();
    if (lc.includes('instrument')) return '🔧';
    if (lc.includes('approval')) return '📋';
    if (lc.includes('gauge')) return '📏';
    return '📄';
  };

  const getCategoryStats = (rows) => {
    const valid = rows.filter(r => r.calibrationStatus === 'Valid').length;
    const expiring = rows.filter(r => r.calibrationStatus === 'Expiring Soon').length;
    const expired = rows.filter(r => r.calibrationStatus === 'Expired').length;
    return { valid, expiring, expired, total: rows.length };
  };

  // ----------- RENDER -----------

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Loading vendor calibration data...
        </Typography>
      </Paper>
    );
  }

  if (!vendorCode) {
    return (
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '48px', mb: 2 }}>🔧</Typography>
        <Typography variant="h6" color="text.secondary">
          No vendor information available
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Vendor code could not be determined from the inspection call.
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Unable to load calibration records for vendor: <strong>{resolvedVendorCode || vendorCode}</strong>.
          The vendor may not have uploaded calibration data yet.
        </Typography>
      </Paper>
    );
  }

  if (calibrationData.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '48px', mb: 2 }}>📋</Typography>
        <Typography variant="h6" color="text.secondary">
          No calibration records found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Vendor <strong>{resolvedVendorCode || vendorCode}</strong> has not uploaded any calibration instrument data yet.
        </Typography>
      </Paper>
    );
  }

  // Summary counts
  const allStats = getCategoryStats(calibrationData);

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 0, 
        overflow: 'hidden',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        background: '#ffffff',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* Header */}
      <Box sx={{
        p: 3,
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '18px' }}>
              Vendor Calibration Records
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => loadCalibrations(true)} 
              disabled={loading}
              title="Reload from Server"
              sx={{ color: '#64748b', '&:hover': { color: '#2563eb' } }}
            >
              <RefreshIcon sx={{ fontSize: '18px' }} />
            </IconButton>
            <Chip 
              label="Live Data" 
              size="small" 
              sx={{ 
                height: 18, 
                fontSize: '10px', 
                fontWeight: 700, 
                backgroundColor: '#e0f2fe', 
                color: '#0369a1',
                border: '1px solid #bae6fd',
                px: 0.5
              }} 
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontSize: '13px' }}>
            Check and verify the manufacturer's instruments and gauges for this inspection call.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Vendor Code & Call Details Pills */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            px: 1.8,
            py: 0.8,
          }}>
            <Typography sx={{ fontSize: '12.5px', color: '#1e40af', fontWeight: 500 }}>
              Vendor: <strong style={{ color: '#1d4ed8' }}>{vendorName || (resolvedVendorCode || vendorCode).replace(/^:/, '')}</strong>
            </Typography>
            <Box sx={{ height: '12px', width: '1px', backgroundColor: '#bfdbfe' }} />
            <Typography sx={{ fontSize: '12.5px', color: '#1e40af', fontWeight: 500 }}>
              Call: <strong style={{ color: '#1d4ed8' }}>{inspectionCallNo || '—'}</strong>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={`${allStats.valid} Valid`} 
              size="small" 
              sx={{ 
                backgroundColor: '#dcfce7', 
                color: '#166534', 
                border: '1px solid #bbf7d0', 
                fontWeight: 600,
                fontSize: '12px'
              }} 
            />
            {allStats.expired > 0 && (
              <Chip 
                label={`${allStats.expired} Expired`} 
                size="small" 
                sx={{ 
                  backgroundColor: '#fee2e2', 
                  color: '#991b1b', 
                  border: '1px solid #fecaca', 
                  fontWeight: 600,
                  fontSize: '12px'
                }} 
              />
            )}
            <Chip 
              label={`${allStats.total} Total`} 
              size="small" 
              sx={{ 
                backgroundColor: '#f1f5f9', 
                color: '#475569', 
                border: '1px solid #e2e8f0', 
                fontWeight: 600,
                fontSize: '12px'
              }} 
            />
          </Box>
        </Box>
      </Box>

      {/* Category Sections */}
      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {Object.entries(groupedData).map(([category, rows]) => {
          const stats = getCategoryStats(rows);
          const isExpanded = expandedCategories[category] !== false;
          
          const getCategoryAccentColor = (catName) => {
            const lc = catName.toLowerCase();
            if (lc.includes('instrument')) return '#3b82f6';
            if (lc.includes('approval')) return '#8b5cf6';
            if (lc.includes('gauge')) return '#06b6d4';
            return '#64748b';
          };
          
          const accentColor = getCategoryAccentColor(category);

          return (
            <Box 
              key={category} 
              sx={{ 
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                borderLeft: `4px solid ${accentColor}`,
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Category Header */}
              <Box
                onClick={() => toggleCategory(category)}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  cursor: 'pointer',
                  backgroundColor: '#f8fafc',
                  borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                  '&:hover': { backgroundColor: '#f1f5f9' },
                  transition: 'background-color 0.2s'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ fontSize: '20px' }}>{getCategoryIcon(category)}</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>
                    {category}
                  </Typography>
                  <Chip 
                    label={`${stats.total}`} 
                    size="small" 
                    sx={{ 
                      height: 20, 
                      fontSize: '11px', 
                      fontWeight: 600,
                      backgroundColor: '#e2e8f0', 
                      color: '#475569' 
                    }} 
                  />
                  <Box sx={{ display: 'flex', gap: 1, ml: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                      <Typography sx={{ fontSize: '11px', color: '#64748b' }}>{stats.valid} OK</Typography>
                    </Box>
                    {stats.expired > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                        <Typography sx={{ fontSize: '11px', color: '#64748b' }}>{stats.expired} Expired</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
                <IconButton size="small" sx={{ color: '#64748b' }}>
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              {/* Category Table */}
              <Collapse in={isExpanded}>
                <TableContainer>
                  <Table size="medium">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#475569', width: '40px', py: 1.5 }}></TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#475569', py: 1.5 }}>Instrument Details</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#475569', py: 1.5 }}>Capacity</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#475569', py: 1.5 }}>Serial No.</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#475569', py: 1.5 }}>Certificate No.</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#475569', py: 1.5 }}>Calibration Dates</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#475569', py: 1.5 }}>Lab / Agency</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#475569', textAlign: 'center', py: 1.5 }}>Validity</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#475569', textAlign: 'center', width: '180px', py: 1.5 }}>IE Verification</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#475569', width: '220px', py: 1.5 }}>Remarks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row, idx) => {
                        const key = `${row.instrumentName}_${row.serialNumber}`;
                        const currentVer = verifications[key] || { status: 'OK', remark: '' };
                        const isOk = currentVer.status === 'OK';
                        const isExpired = row.calibrationStatus === 'Expired';

                        return (
                          <TableRow
                            key={row.detailId || idx}
                            sx={{
                              transition: 'background-color 0.2s',
                              '&:hover': { backgroundColor: '#f8fafc' },
                              backgroundColor: isExpired ? 'rgba(239, 68, 68, 0.01)' : 'inherit',
                              borderLeft: isExpired ? '3px solid #ef4444' : 'none',
                            }}
                          >
                            <TableCell sx={{ fontSize: '12px', color: '#94a3b8', py: 1.5 }}>{idx + 1}</TableCell>
                            <TableCell sx={{ py: 1.5 }}>
                              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                                {row.instrumentName}
                              </Typography>
                              {row.description && (
                                <Typography sx={{ fontSize: '11px', color: '#64748b', mt: 0.5 }}>
                                  {row.description}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ fontSize: '12.5px', color: '#334155', py: 1.5 }}>{row.capacity || '—'}</TableCell>
                            <TableCell sx={{ fontSize: '12.5px', color: '#334155', py: 1.5 }}>
                              <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#475569' }}>
                                {row.serialNumber || '—'}
                              </code>
                            </TableCell>
                            <TableCell sx={{ py: 1.5 }}>
                              <Tooltip title={row.calibrationCertificateNo || ''}>
                                <Typography sx={{ fontSize: '12px', color: '#2563eb', fontWeight: 500, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {row.calibrationCertificateNo || '—'}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ py: 1.5 }}>
                              <Box>
                                <Typography sx={{ fontSize: '12px', color: '#334155' }}>
                                  Cal: <strong>{formatDate(row.calibrationDate)}</strong>
                                </Typography>
                                <Typography sx={{ fontSize: '11px', color: isExpired ? '#ef4444' : '#64748b', mt: 0.5 }}>
                                  Due: <strong>{formatDate(row.calibrationDueDate)}</strong>
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ py: 1.5 }}>
                              <Typography sx={{ fontSize: '12px', color: '#334155', fontWeight: 500 }}>
                                {row.certifyingLabName || '—'}
                              </Typography>
                              {row.accreditationAgency && (
                                <Typography sx={{ fontSize: '10px', color: '#64748b', mt: 0.5 }}>
                                  Accred: {row.accreditationAgency}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center', py: 1.5 }}>
                              {getStatusChip(row.calibrationStatus, row.daysLeft)}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center', py: 1.5 }}>
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                <Button
                                  size="small"
                                  variant={isOk ? "contained" : "outlined"}
                                  onClick={() => handleStatusChange(key, 'OK')}
                                  sx={{
                                    minWidth: '70px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    py: 0.5,
                                    px: 1,
                                    borderRadius: '6px',
                                    textTransform: 'none',
                                    backgroundColor: isOk ? '#dcfce7' : 'transparent',
                                    color: isOk ? '#166534' : '#64748b',
                                    borderColor: isOk ? '#bbf7d0' : '#e2e8f0',
                                    boxShadow: 'none',
                                    '&:hover': {
                                      backgroundColor: isOk ? '#bbf7d0' : '#f1f5f9',
                                      borderColor: isOk ? '#86efac' : '#cbd5e1',
                                      boxShadow: 'none',
                                    },
                                  }}
                                  startIcon={<CheckIcon sx={{ fontSize: '14px !important', color: isOk ? '#166534' : '#64748b' }} />}
                                >
                                  Valid
                                </Button>
                                <Button
                                  size="small"
                                  variant={!isOk ? "contained" : "outlined"}
                                  onClick={() => handleStatusChange(key, 'NOT OK')}
                                  sx={{
                                    minWidth: '80px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    py: 0.5,
                                    px: 1,
                                    borderRadius: '6px',
                                    textTransform: 'none',
                                    backgroundColor: !isOk ? '#fee2e2' : 'transparent',
                                    color: !isOk ? '#991b1b' : '#64748b',
                                    borderColor: !isOk ? '#fecaca' : '#e2e8f0',
                                    boxShadow: 'none',
                                    '&:hover': {
                                      backgroundColor: !isOk ? '#fecaca' : '#f1f5f9',
                                      borderColor: !isOk ? '#fca5a5' : '#cbd5e1',
                                      boxShadow: 'none',
                                    },
                                  }}
                                  startIcon={<ClearIcon sx={{ fontSize: '14px !important', color: !isOk ? '#991b1b' : '#64748b' }} />}
                                >
                                  Invalid
                                </Button>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ py: 1.5 }}>
                              <TextField
                                size="small"
                                value={currentVer.remark || ''}
                                onChange={(e) => handleRemarkChange(key, e.target.value)}
                                placeholder="Enter verification notes..."
                                fullWidth
                                sx={{
                                  '& .MuiInputBase-root': {
                                    fontSize: '12px',
                                    borderRadius: '6px',
                                    backgroundColor: '#ffffff',
                                  },
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#cbd5e1',
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#94a3b8',
                                  },
                                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#3b82f6',
                                    borderWidth: '1.5px',
                                  }
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
            </Box>
          );
        })}
      </Box>

      {/* Footer Actions */}
      <Box sx={{
        p: 2.5,
        backgroundColor: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
            Verification Progress: <strong>{Object.keys(verifications).length}</strong> / <strong>{calibrationData.length}</strong> checked
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Chip 
              label={`${Object.values(verifications).filter(v => v.status === 'OK').length} Valid`} 
              size="small" 
              sx={{ 
                backgroundColor: '#dcfce7', 
                color: '#166534', 
                border: '1px solid #bbf7d0', 
                fontWeight: 600, 
                fontSize: '11px',
              }} 
            />
            <Chip 
              label={`${Object.values(verifications).filter(v => v.status === 'NOT OK').length} Invalid`} 
              size="small" 
              sx={{ 
                backgroundColor: '#fee2e2', 
                color: '#991b1b', 
                border: '1px solid #fecaca', 
                fontWeight: 600, 
                fontSize: '11px',
              }} 
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {saveSuccess && (
            <Alert 
              severity="success" 
              sx={{ 
                py: 0, 
                px: 1.5, 
                fontSize: '13px', 
                fontWeight: 600,
                alignItems: 'center',
                backgroundColor: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                borderRadius: '6px',
                '& .MuiAlert-icon': { fontSize: '18px', mr: 1 }
              }}
            >
              Verification saved successfully!
            </Alert>
          )}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                py: 0, 
                px: 1.5, 
                fontSize: '13px', 
                fontWeight: 600,
                alignItems: 'center',
                borderRadius: '6px',
                '& .MuiAlert-icon': { fontSize: '18px', mr: 1 }
              }}
            >
              {error}
            </Alert>
          )}
          <Button
            variant="contained"
            onClick={handleSaveVerification}
            disabled={saveLoading}
            startIcon={saveLoading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '13px',
              textTransform: 'none',
              px: 3,
              py: 1,
              borderRadius: '6px',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#2563eb',
                boxShadow: 'none',
              },
              '&.Mui-disabled': {
                backgroundColor: '#cbd5e1',
                color: '#94a3b8'
              }
            }}
          >
            {saveLoading ? 'Saving...' : 'Save Calibration Verification'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default CalibrationSubModule;
