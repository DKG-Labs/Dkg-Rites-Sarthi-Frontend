import React, { useState } from 'react';
import { 
    Grid, Typography, TextField, Button, Box, CircularProgress, 
    Divider, Paper, InputAdornment, IconButton 
} from '@mui/material';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { changePassword } from '../../services/userProfileService';

const ChangePassword = ({ onSuccess, onError }) => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        let tempErrors = {};
        if (!formData.currentPassword) {
            tempErrors.currentPassword = 'Please enter your current password.';
        }
        
        if (!formData.newPassword) {
            tempErrors.newPassword = 'New password is required.';
        } else {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(formData.newPassword)) {
                tempErrors.newPassword = 'Must contain at least 8 chars (1 uppercase, 1 lowercase, 1 number, 1 special char).';
            }
        }

        if (formData.newPassword !== formData.confirmPassword) {
            if (!formData.confirmPassword) {
                tempErrors.confirmPassword = 'Confirm password is required.';
            } else {
                tempErrors.confirmPassword = 'Passwords do not match.';
            }
        }

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSaving(true);
        try {
            await changePassword(formData);
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            onSuccess();
        } catch (error) {
            const msg = error.message || '';
            const isValidationError = msg.includes('incorrect') || msg.includes('match') || msg.includes('characters');
            onError(isValidationError ? msg : 'Unable to change your password. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box className="change-password-container" sx={{ width: '100%', position: 'relative', px: { xs: 2, sm: 4, lg: 6 }, display: 'flex', justifyContent: 'center' }}>
            <Paper 
                elevation={0}
                sx={{
                    width: '100%',
                    maxWidth: 650,
                    mt: '-72px',
                    mb: 4,
                    position: 'relative',
                    zIndex: 10,
                    p: { xs: 3, sm: '36px 48px' },
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.9)',
                    background: 'rgba(255,255,255,0.97)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    boxShadow: '0 8px 40px rgba(15,76,129,0.10), 0 2px 8px rgba(0,0,0,0.05)'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                    <Box sx={{ 
                        p: 1.5, 
                        borderRadius: '14px', 
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        display: 'flex',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                    }}>
                        <LockResetOutlinedIcon fontSize="medium" />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
                            Update Password
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
                            Ensure your account is using a strong password to stay secure.
                        </Typography>
                    </Box>
                </Box>
                
                <Divider sx={{ mb: 4, borderColor: 'rgba(226,232,240,0.8)' }} />

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3.5}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                type={showCurrent ? 'text' : 'password'}
                                label="Current Password"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                error={!!errors.currentPassword}
                                helperText={errors.currentPassword}
                                required
                                sx={{ 
                                    '& .MuiOutlinedInput-root': { 
                                        borderRadius: '12px', 
                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                        transition: 'all 0.2s',
                                        '&:hover': { backgroundColor: '#ffffff' },
                                        '&.Mui-focused': { backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(15,76,129,0.05)' }
                                    } 
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <VpnKeyOutlinedIcon sx={{ color: '#94a3b8' }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowCurrent(!showCurrent)} edge="end" size="small">
                                                {showCurrent ? <VisibilityOff sx={{ color: '#94a3b8' }} /> : <Visibility sx={{ color: '#94a3b8' }} />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                type={showNew ? 'text' : 'password'}
                                label="New Password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                error={!!errors.newPassword}
                                helperText={errors.newPassword}
                                required
                                sx={{ 
                                    '& .MuiOutlinedInput-root': { 
                                        borderRadius: '12px', 
                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                        transition: 'all 0.2s',
                                        '&:hover': { backgroundColor: '#ffffff' },
                                        '&.Mui-focused': { backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(16,185,129,0.08)' }
                                    } 
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <KeyOutlinedIcon sx={{ color: '#10b981' }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowNew(!showNew)} edge="end" size="small">
                                                {showNew ? <VisibilityOff sx={{ color: '#94a3b8' }} /> : <Visibility sx={{ color: '#94a3b8' }} />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                type={showConfirm ? 'text' : 'password'}
                                label="Confirm New Password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                error={!!errors.confirmPassword}
                                helperText={errors.confirmPassword}
                                required
                                sx={{ 
                                    '& .MuiOutlinedInput-root': { 
                                        borderRadius: '12px', 
                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                        transition: 'all 0.2s',
                                        '&:hover': { backgroundColor: '#ffffff' },
                                        '&.Mui-focused': { backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(16,185,129,0.08)' }
                                    } 
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <KeyOutlinedIcon sx={{ color: '#10b981' }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" size="small">
                                                {showConfirm ? <VisibilityOff sx={{ color: '#94a3b8' }} /> : <Visibility sx={{ color: '#94a3b8' }} />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sx={{ mt: 3, mb: 1 }}>
                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                disabled={saving}
                                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : null}
                                sx={{ 
                                    py: 1.8,
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    letterSpacing: '0.01em',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.35)',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                        boxShadow: '0 8px 32px rgba(16, 185, 129, 0.45)',
                                        transform: 'translateY(-2px) scale(1.01)',
                                    },
                                    '&.Mui-disabled': {
                                        background: '#e2e8f0',
                                        color: '#94a3b8'
                                    }
                                }}
                            >
                                {saving ? 'Updating Password...' : 'Save New Password'}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
};

export default ChangePassword;

