import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Paper,
  Divider,
  Alert
} from '@mui/material';
import CalibrationHeatRow from './CalibrationHeatRow';
import HeatToggle from './HeatToggle';

const STORAGE_KEY = 'calibration_draft_data';

/**
 * Calibration & Document Verification Sub Module
 * Inside ERC Raw Material Inspection Main Module
 *
 * This page covers the calibration information of all the instruments used during
 * the inspection of Raw Material & document verification of that particular vendor
 */
const CalibrationSubModule = ({ preInspectionHeats = [], vendorLadleValues: vendorLadleProp = null, inspectionCallNo = '' }) => {
  const [activeHeatIndex, setActiveHeatIndex] = useState(0);

  // Load draft data from localStorage or initialize empty
  const loadDraftData = useCallback(() => {
    const storageKey = `${STORAGE_KEY}_${inspectionCallNo}`;
    const savedDraft = localStorage.getItem(storageKey);
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (e) {
        console.error('Error parsing draft data:', e);
      }
    }
    return null;
  }, [inspectionCallNo]);

  const [formData, setFormData] = useState(() => {
    const draft = loadDraftData();
    if (draft) {
      return draft;
    }
    return {
      rdsoApprovalValidity: {
        approvalId: '',
        validFrom: '',
        validTo: ''
      },
      heats: [],
      gaugesAvailable: false,
      vendorVerification: {
        verified: false,
        verifiedBy: '',
        verifiedAt: ''
      }
    };
  });

  // Store vendor ladle values separately (read-only, from database)
  const [vendorLadleValues, setVendorLadleValues] = useState([]);

  const [errors, setErrors] = useState({});

  // Initialize heats from pre-inspection data and vendor ladle values from prop
  useEffect(() => {
    if (preInspectionHeats && preInspectionHeats.length > 0) {
      // Filter out empty heats
      const validHeats = preInspectionHeats.filter(heat => heat && (heat.heatNo || heat.heat_no));

      if (validHeats.length === 0) {
        return;
      }

      // Use vendor ladle values from prop (fetched from database)
      // These are the same values for all heats as stored at PO level
      const ladleData = validHeats.map(heat => ({
        heatNo: heat.heatNo || heat.heat_no || heat,
        percentC: vendorLadleProp?.percentC ?? null,
        percentSi: vendorLadleProp?.percentSi ?? null,
        percentMn: vendorLadleProp?.percentMn ?? null,
        percentS: vendorLadleProp?.percentS ?? null,
        percentP: vendorLadleProp?.percentP ?? null
      }));
      setVendorLadleValues(ladleData);

      // Initialize product values (IE input) only if no draft exists
      if (formData.heats.length === 0) {
        const initialHeats = validHeats.map(heat => ({
          heatNo: heat.heatNo || heat.heat_no || heat,
          percentC: '',
          percentSi: '',
          percentMn: '',
          percentP: '',
          percentS: ''
        }));
        setFormData(prev => ({ ...prev, heats: initialHeats }));
      }
    }
  }, [preInspectionHeats, vendorLadleProp, formData.heats.length]);

  // Auto-save to localStorage on formData change (persist while switching tabs/submodules)
  useEffect(() => {
    const storageKey = `${STORAGE_KEY}_${inspectionCallNo}`;
    localStorage.setItem(storageKey, JSON.stringify(formData));
  }, [formData, inspectionCallNo]);

  const handleRDSOChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      rdsoApprovalValidity: {
        ...prev.rdsoApprovalValidity,
        [field]: value
      }
    }));
  };

  const handleHeatUpdate = (index, field, value) => {
    const updatedHeats = [...formData.heats];
    updatedHeats[index] = {
      ...updatedHeats[index],
      [field]: value
    };
    setFormData(prev => ({ ...prev, heats: updatedHeats }));
  };

  // eslint-disable-next-line no-unused-vars
  const handleRemoveHeat = (index) => {
    const updatedHeats = formData.heats.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, heats: updatedHeats }));
  };

  const handleGaugesChange = (event) => {
    setFormData(prev => ({ ...prev, gaugesAvailable: event.target.checked }));
  };

  // Validation will be called from parent component during Save Draft or Submit
  // eslint-disable-next-line no-unused-vars
  const validateForm = () => {
    const newErrors = {};
    
    // Validate each heat
    formData.heats.forEach((heat, index) => {
      if (!heat.percentC || heat.percentC === '') {
        newErrors[`heat_${index}_percentC`] = 'Required';
      }
      if (!heat.percentSi || heat.percentSi === '') {
        newErrors[`heat_${index}_percentSi`] = 'Required';
      }
      if (!heat.percentMn || heat.percentMn === '') {
        newErrors[`heat_${index}_percentMn`] = 'Required';
      }
      if (!heat.percentP || heat.percentP === '') {
        newErrors[`heat_${index}_percentP`] = 'Required';
      }
      if (!heat.percentS || heat.percentS === '') {
        newErrors[`heat_${index}_percentS`] = 'Required';
      }

      // Range validations
      const c = parseFloat(heat.percentC);
      if (!isNaN(c) && (c < 0.5 || c > 0.6)) {
        newErrors[`heat_${index}_percentC`] = 'Value must be between 0.500 and 0.600 (inclusive).';
      }

      const si = parseFloat(heat.percentSi);
      if (!isNaN(si) && (si < 1.5 || si > 2.0)) {
        newErrors[`heat_${index}_percentSi`] = 'Value must be between 1.500 and 2.000 (inclusive).';
      }

      const mn = parseFloat(heat.percentMn);
      if (!isNaN(mn) && (mn < 0.8 || mn > 1.0)) {
        newErrors[`heat_${index}_percentMn`] = 'Value must be between 0.800 and 1.000 (inclusive).';
      }

      const p = parseFloat(heat.percentP);
      if (!isNaN(p) && p > 0.030) {
        newErrors[`heat_${index}_percentP`] = 'Value cannot exceed 0.030.';
      }

      const s = parseFloat(heat.percentS);
      if (!isNaN(s) && s > 0.030) {
        newErrors[`heat_${index}_percentS`] = 'Value cannot exceed 0.030.';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      {/* Section Header */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
        Calibration & Document 
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        This page covers the calibration information of all the instruments used during the inspection
        of Raw Material & document verification of that particular vendor
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* RDSO Approval & Validity */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          RDSO approval & its Validity
        </Typography>
        <Typography variant="caption" color="success.main" sx={{ display: 'block', mb: 2 }}>
          ✓ Verified (filled by Vendor before Call Request)
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Approval ID"
              value={formData.rdsoApprovalValidity.approvalId}
              onChange={(e) => handleRDSOChange('approvalId', e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Valid From"
              type="date"
              value={formData.rdsoApprovalValidity.validFrom}
              onChange={(e) => handleRDSOChange('validFrom', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Valid To"
              type="date"
              value={formData.rdsoApprovalValidity.validTo}
              onChange={(e) => handleRDSOChange('validTo', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Heat Rows */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Ladle Analysis of Each Heat as per TC
          </Typography>
        </Box>

        {formData.heats.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No heats available. Ensure pre-inspection data is entered.
          </Alert>
        )}

        {/* Heat Toggle - Switch between heats */}
        {formData.heats.length > 0 && (
          <HeatToggle
            heats={formData.heats}
            activeHeatIndex={activeHeatIndex}
            onHeatChange={setActiveHeatIndex}
          />
        )}

        {/* Show only the selected heat */}
        {formData.heats.length > 0 && formData.heats[activeHeatIndex] && (
          <CalibrationHeatRow
            key={activeHeatIndex}
            heat={formData.heats[activeHeatIndex]}
            index={activeHeatIndex}
            onUpdate={handleHeatUpdate}
            ladleValues={vendorLadleValues[activeHeatIndex] || {}}
          />
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Availability of RDSO approved Gauges */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Availability of RDSO approved Gauges
        </Typography>
        <Typography variant="caption" color="success.main" sx={{ display: 'block', mb: 2 }}>
          ✓ Verified (filled by Vendor before Call Request)
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={formData.gaugesAvailable}
              onChange={handleGaugesChange}
              color="primary"
            />
          }
          label={formData.gaugesAvailable ? 'Yes - RDSO approved Gauges Available' : 'No - RDSO approved Gauges Not Available'}
        />
      </Box>

      {/* Error Summary */}
      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mt: 3 }}>
          Please fix {Object.keys(errors).length} validation error(s) before saving.
        </Alert>
      )}
    </Paper>
  );
};

export default CalibrationSubModule;

