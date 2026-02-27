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

const STORAGE_KEY = 'calibration_draft_data';

/**
 * Calibration & Document Verification Sub Module
 * Inside ERC Raw Material Inspection Main Module
 *
 * This page covers the calibration information of all the instruments used during
 * the inspection of Raw Material & document verification of that particular vendor
 */
const CalibrationSubModule = ({ inspectionCallNo = '' }) => {
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
    const defaults = {
      rdsoApprovalValidity: {
        approvalId: 'RDSO/2023/ERC-001',
        validFrom: '2023-04-01',
        validTo: '2026-03-31'
      },
      gaugesAvailable: false,
      vendorVerification: {
        verified: false,
        verifiedBy: '',
        verifiedAt: ''
      }
    };
    if (draft) {
      // Merge: use saved draft but fill in any empty RDSO fields with defaults
      return {
        ...defaults,
        ...draft,
        rdsoApprovalValidity: {
          approvalId: draft.rdsoApprovalValidity?.approvalId || defaults.rdsoApprovalValidity.approvalId,
          validFrom: draft.rdsoApprovalValidity?.validFrom || defaults.rdsoApprovalValidity.validFrom,
          validTo: draft.rdsoApprovalValidity?.validTo || defaults.rdsoApprovalValidity.validTo,
        }
      };
    }
    return defaults;
  });

  const [errors, setErrors] = useState({});

  // Auto-save to localStorage on formData change (persist while switching tabs/submodules)
  useEffect(() => {
    const storageKey = `${STORAGE_KEY}_${inspectionCallNo}`;
    localStorage.setItem(storageKey, JSON.stringify(formData));
  }, [formData, inspectionCallNo]);

  // eslint-disable-next-line no-unused-vars
  const handleRDSOChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      rdsoApprovalValidity: {
        ...prev.rdsoApprovalValidity,
        [field]: value
      }
    }));
  };

  const handleGaugesChange = (event) => {
    setFormData(prev => ({ ...prev, gaugesAvailable: event.target.checked }));
  };

  // Validation will be called from parent component during Save Draft or Submit
  // eslint-disable-next-line no-unused-vars
  const validateForm = () => {
    const newErrors = {};

    // No validations needed currently as Ladle Analysis is removed

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
              size="small"
              InputProps={{ readOnly: true }}
              sx={{ '& .MuiInputBase-input': { backgroundColor: '#f5f5f5', cursor: 'default' } }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Valid From"
              type="date"
              value={formData.rdsoApprovalValidity.validFrom}
              size="small"
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
              sx={{ '& .MuiInputBase-input': { backgroundColor: '#f5f5f5', cursor: 'default' } }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Valid To"
              type="date"
              value={formData.rdsoApprovalValidity.validTo}
              size="small"
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
              sx={{ '& .MuiInputBase-input': { backgroundColor: '#f5f5f5', cursor: 'default' } }}
            />
          </Grid>
        </Grid>
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

