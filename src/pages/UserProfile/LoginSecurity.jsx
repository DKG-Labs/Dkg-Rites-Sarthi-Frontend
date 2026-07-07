import React, { useState } from 'react';
import { Typography, Switch, FormControlLabel, Box, Button, CircularProgress, Divider, Paper } from '@mui/material';
import { updateSecuritySettings } from '../../services/userProfileService';

const LoginSecurity = ({ loginSecurityEnabled, onSecurityUpdated, onError }) => {
    const [enabled, setEnabled] = useState(loginSecurityEnabled || false);
    const [saving, setSaving] = useState(false);

    const handleChange = (event) => {
        setEnabled(event.target.checked);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSecuritySettings({ loginSecurityEnabled: enabled });
            onSecurityUpdated(enabled);
        } catch (error) {
            onError('Unable to update your security settings.');
            // Revert on error
            setEnabled(loginSecurityEnabled);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box className="login-security-container" sx={{ px: 2, maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom color="primary">
                Login Security Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Additional Security
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                    Enable login security to add an extra layer of protection to your account. 
                    (Note: Advanced features like OTP or MFA will be integrated here in the future).
                </Typography>
                
                <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={enabled}
                                onChange={handleChange}
                                color="primary"
                            />
                        }
                        label={enabled ? "Login Security Enabled" : "Login Security Disabled"}
                    />
                    
                    {enabled !== loginSecurityEnabled && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSave}
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={20} /> : null}
                        >
                            {saving ? 'Saving...' : 'Apply Changes'}
                        </Button>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

export default LoginSecurity;
