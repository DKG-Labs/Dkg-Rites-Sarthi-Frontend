import { useState, useEffect, useCallback } from 'react';
/* eslint-disable no-unused-vars */
import {
  Box,
  Typography,
  Paper,
  // These are currently unused because the section is commented out
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Divider,
  Alert
} from '@mui/material';

const STORAGE_KEY = 'calibration_draft_data';

// Helper to get current shift from sessionStorage for shift-specific storage
const getShiftSuffix = () => {
  const shift = sessionStorage.getItem('inspectionShift');
  return shift ? `_${shift}` : '';
};

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
    const storageKey = `${STORAGE_KEY}_${inspectionCallNo}${getShiftSuffix()}`;
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

  // Auto-save to localStorage
  useEffect(() => {
    const storageKey = `${STORAGE_KEY}_${inspectionCallNo}${getShiftSuffix()}`;
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
      {/* Commented out as per user request
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
        Calibration & Document
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        This page covers the calibration information of all the instruments used during the inspection
        of Raw Material & document verification of that particular vendor
      </Typography>

      <Divider sx={{ mb: 3 }} />

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

      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mt: 3 }}>
          Please fix {Object.keys(errors).length} validation error(s) before saving.
        </Alert>
      )}
      */}

      {/* Work in Progress UI */}
      <Box sx={{ textAlign: 'center', py: 8, px: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography sx={{ fontSize: '64px', mb: 3, animation: 'bounce 2s infinite' }}>📄</Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
          Calibration Module Under Development
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b', fontSize: '1.1rem', maxWidth: 500, mx: 'auto', mb: 5, lineHeight: 1.6 }}>
          We are currently refactoring the Calibration & Document submodule to support dynamic instrument tracking and automated validity alerts.
        </Typography>
        
        <Box sx={{ 
          p: 2, 
          px: 4, 
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
          border: '1px solid #bae6fd', 
          borderRadius: 3,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
          color: '#0369a1',
          fontWeight: 600,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <span style={{ fontSize: '20px' }}>⏳</span>
          Coming Soon: Real-time Instrument Validation
        </Box>
      </Box>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </Paper>
  );
};

export default CalibrationSubModule;

