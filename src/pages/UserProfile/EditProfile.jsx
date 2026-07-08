import React, { useState } from 'react';
import { 
    Grid, Typography, TextField, Button, Box, CircularProgress, 
    Divider, Paper, Avatar, IconButton
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { API_BASE_URL } from '../../services/apiConfig';
import { updateProfile } from '../../services/userProfileService';

const CustomLabel = ({ text, required }) => (
    <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#64748b', mb: 1, display: 'flex', gap: 0.5 }}>
        {text} {required && <Typography component="span" sx={{ color: '#ef4444', fontWeight: 600 }}>*</Typography>}
    </Typography>
);

const customInputStyles = {
    width: '100%',
    display: 'flex',
    '& .MuiOutlinedInput-root': {
        width: '100%',
        borderRadius: '6px',
        backgroundColor: '#fff',
        '& fieldset': {
            borderColor: '#e2e8f0',
        },
        '&:hover fieldset': {
            borderColor: '#cbd5e1',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#0ea5e9',
            borderWidth: '1px',
        }
    },
    '& .MuiOutlinedInput-input': {
        padding: '12px 14px',
        fontSize: '14px',
        color: '#334155',
        width: '100%',
        '&::placeholder': {
            color: '#94a3b8',
            opacity: 1
        }
    }
};

const EditProfile = ({ profileData, onProfileUpdated, onError }) => {
    const [formData, setFormData] = useState({
        mobileNumber: profileData?.registeredMobileNumber || '',
        alternateMobileNumber: profileData?.alternateMobileNumber || '',
        emailAddress: profileData?.emailAddress || '',
        designation: profileData?.designation || '',
        notificationPreferences: profileData?.notificationPreferences || '',
        profilePhotoPath: profileData?.profilePhotoPath || '',
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    if (!profileData) return null;

    const validate = () => {
        let tempErrors = {};
        if (!formData.mobileNumber) {
            tempErrors.mobileNumber = 'Mobile number is required.';
        } else if (!/^\d{10}$/.test(formData.mobileNumber)) {
            tempErrors.mobileNumber = 'Please enter a valid 10-digit mobile number.';
        }

        if (!formData.emailAddress) {
            tempErrors.emailAddress = 'Email address is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) {
            tempErrors.emailAddress = 'Please enter a valid email address.';
        }

        if (!formData.designation) {
            tempErrors.designation = 'Designation cannot be empty.';
        }

        if (formData.alternateMobileNumber && !/^\d{10}$/.test(formData.alternateMobileNumber)) {
            tempErrors.alternateMobileNumber = 'Please enter a valid 10-digit mobile number.';
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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, profilePhotoPath: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSaving(true);
        try {
            const updatedProfile = await updateProfile(formData);
            onProfileUpdated(updatedProfile);
        } catch (error) {
            onError('Unable to update your profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ backgroundColor: '#ffffff', minHeight: '100%', pb: 6 }}>
            <Box sx={{ px: { xs: 2, sm: 3, md: '24px' } }}>
                <Paper 
                    elevation={0}
                    sx={{
                        width: '100%',
                        mt: '-72px',
                        mb: 4,
                        position: 'relative',
                        zIndex: 10,
                        borderRadius: '20px',
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        boxShadow: '0 12px 40px rgba(15,76,129,0.06), 0 4px 12px rgba(0,0,0,0.04)',
                        p: { xs: 3, sm: '32px 40px' },
                    }}
                >
                    {/* Header mimicking ViewProfile layout */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'center', sm: 'flex-start' },
                        gap: { xs: 2.5, sm: 3.5 },
                        mb: 4
                    }}>
                        {/* Avatar */}
                        <Box sx={{ position: 'relative', flexShrink: 0 }}>
                            <Avatar
                                src={
                                    formData.profilePhotoPath?.startsWith('data:')
                                    ? formData.profilePhotoPath
                                    : (formData.profilePhotoPath ? `${API_BASE_URL}${formData.profilePhotoPath.startsWith('/') ? '' : '/'}${formData.profilePhotoPath}` : undefined)
                                }
                                alt={profileData.fullName}
                                sx={{
                                    width: 90,
                                    height: 90,
                                    fontSize: '34px',
                                    fontWeight: 800,
                                    background: 'linear-gradient(135deg, #0F4C81 0%, #2563eb 100%)',
                                    color: '#fff',
                                    border: '3px solid #fff',
                                    boxShadow: '0 4px 20px rgba(37,99,235,0.28)',
                                }}
                            >
                                {profileData.fullName ? profileData.fullName.charAt(0).toUpperCase() : 'U'}
                            </Avatar>
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="icon-button-file"
                                type="file"
                                onChange={handleImageChange}
                            />
                            <label htmlFor="icon-button-file">
                                <IconButton
                                    color="primary"
                                    aria-label="upload picture"
                                    component="span"
                                    sx={{
                                        position: 'absolute',
                                        bottom: -4,
                                        right: -4,
                                        backgroundColor: '#fff',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                        '&:hover': { backgroundColor: '#f8fafc' },
                                        padding: '5px'
                                    }}
                                >
                                    <PhotoCamera sx={{ fontSize: '18px', color: '#2563eb' }} />
                                </IconButton>
                            </label>
                        </Box>

                        {/* Title block */}
                        <Box sx={{ flex: 1, width: '100%', pt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <Typography sx={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                                    Editing Profile
                                </Typography>
                                <EditOutlinedIcon sx={{ color: '#2563eb', fontSize: '22px' }} />
                            </Box>
                            <Typography sx={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>
                                Update your contact details, designation, and notification preferences below.
                            </Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 4, borderColor: '#e2e8f0', borderStyle: 'dashed' }} />

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={4}>
                            
                            {/* Mobile Number */}
                            <Grid item xs={12} md={6}>
                                <CustomLabel text="Mobile Number" required />
                                <TextField
                                    fullWidth
                                    placeholder="10-digit mobile number"
                                    name="mobileNumber"
                                    value={formData.mobileNumber}
                                    onChange={handleChange}
                                    error={!!errors.mobileNumber}
                                    helperText={errors.mobileNumber}
                                    required
                                    sx={customInputStyles}
                                />
                            </Grid>

                            {/* Alternate Mobile */}
                            <Grid item xs={12} md={6}>
                                <CustomLabel text="Alternate Mobile" />
                                <TextField
                                    fullWidth
                                    placeholder="Alternate mobile number"
                                    name="alternateMobileNumber"
                                    value={formData.alternateMobileNumber}
                                    onChange={handleChange}
                                    error={!!errors.alternateMobileNumber}
                                    helperText={errors.alternateMobileNumber}
                                    sx={customInputStyles}
                                />
                            </Grid>

                            {/* Email Address */}
                            <Grid item xs={12} md={6}>
                                <CustomLabel text="Email Address" required />
                                <TextField
                                    fullWidth
                                    placeholder="official.email@rites.com"
                                    name="emailAddress"
                                    type="email"
                                    value={formData.emailAddress}
                                    onChange={handleChange}
                                    error={!!errors.emailAddress}
                                    helperText={errors.emailAddress}
                                    required
                                    sx={customInputStyles}
                                />
                            </Grid>

                            {/* Designation */}
                            <Grid item xs={12} md={6}>
                                <CustomLabel text="Designation" />
                                <TextField
                                    fullWidth
                                    select
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleChange}
                                    error={!!errors.designation}
                                    helperText={errors.designation}
                                    sx={{ ...customInputStyles, width: '100%' }}
                                    SelectProps={{ native: true }}
                                >
                                    <option value="" disabled style={{ color: '#94a3b8' }}>Select Designation</option>
                                    <option value="Technical Assistant">Technical Assistant</option>
                                    <option value="Senior Technical Assistant">Senior Technical Assistant</option>
                                    <option value="Assistant Engineer">Assistant Engineer</option>
                                    <option value="Engineer">Engineer</option>
                                    <option value="Assistant Manager">Assistant Manager</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Senior Manager">Senior Manager</option>
                                    <option value="DGM">DGM</option>
                                    <option value="JGM">JGM</option>
                                    <option value="AGM">AGM</option>
                                    <option value="GM">GM</option>
                                    <option value="GGM">GGM</option>
                                    <option value="ED">ED</option>
                                </TextField>
                            </Grid>

                            {/* Notification Preferences */}
                            <Grid item xs={12} md={6}>
                                <CustomLabel text="Notification Prefs" />
                                <TextField
                                    fullWidth
                                    select
                                    name="notificationPreferences"
                                    value={formData.notificationPreferences}
                                    onChange={handleChange}
                                    sx={{ ...customInputStyles, width: '100%' }}
                                    SelectProps={{ native: true }}
                                >
                                    <option value="" disabled style={{ color: '#94a3b8' }}>Select Notification Prefs</option>
                                    <option value="Email Only">Email Only</option>
                                    <option value="SMS Only">SMS Only</option>
                                    <option value="Both Email & SMS">Both Email & SMS</option>
                                </TextField>
                            </Grid>

                            {/* Submit Button */}
                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={saving}
                                    startIcon={saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <SaveIcon sx={{ fontSize: '18px' }} />}
                                    sx={{
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                        color: '#fff',
                                        borderRadius: '12px',
                                        textTransform: 'none',
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        px: 5,
                                        py: 1.4,
                                        letterSpacing: '0.01em',
                                        boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                            boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
                                            transform: 'translateY(-2px) scale(1.015)',
                                        },
                                        '&:disabled': {
                                            background: '#cbd5e1',
                                            color: '#94a3b8',
                                            boxShadow: 'none',
                                            transform: 'none'
                                        }
                                    }}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            </Box>
        </Box>
    );
};

export default EditProfile;
