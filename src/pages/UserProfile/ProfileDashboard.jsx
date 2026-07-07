import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Box, Alert, Snackbar } from '@mui/material';
import { getUserProfile } from '../../services/userProfileService';

import ViewProfile from './ViewProfile';
import EditProfile from './EditProfile';
import ChangePassword from './ChangePassword';
import './UserProfile.css';
import logo from '../../sms-module/assets/images/logo.svg';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`profile-tabpanel-${index}`}
            aria-labelledby={`profile-tab-${index}`}
            {...other}
            style={{ padding: 0 }}
        >
            {value === index && (
                <Box>
                    {children}
                </Box>
            )}
        </div>
    );
}

const ProfileDashboard = () => {

    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    const tabIndex = tabParam ? parseInt(tabParam, 10) : 0;
    
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const data = await getUserProfile();
            setProfileData(data);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to load profile.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const showNotification = (message, severity = 'success') => {
        setNotification({ open: true, message, severity });
    };

    const handleCloseNotification = () => {
        setNotification(prev => ({ ...prev, open: false }));
    };

    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: '#ffffff'
            }}>
                <Paper elevation={0} sx={{
                    p: 5,
                    borderRadius: '24px',
                    background: 'rgba(255,255,255,0.98)',
                    boxShadow: '0 8px 32px rgba(15,76,129,0.06), 0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: '380px'
                }}>
                    <Box sx={{ position: 'relative', mb: 4, width: 84, height: 84, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Box sx={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            border: '3px solid transparent',
                            borderTopColor: '#0F4C81',
                            borderRightColor: '#2563eb',
                            animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
                            '@keyframes spin': {
                                '0%': { transform: 'rotate(0deg)' },
                                '100%': { transform: 'rotate(360deg)' }
                            }
                        }} />
                        <img src={logo} alt="RITES Logo" style={{ width: '48px', objectFit: 'contain' }} />
                    </Box>
                    <Typography sx={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em', mb: 1 }}>
                        Syncing Profile Information
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#64748b', fontWeight: 500, textAlign: 'center' }}>
                        Updating your profile details from Sarthi workflow...
                    </Typography>
                </Paper>
            </Box>
        );
    }

    if (error && !profileData) {
        return (
            <Container maxWidth={false} sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    const getTabName = (index) => {
        switch(index) {
            case 0: return 'View Profile';
            case 1: return 'Edit Profile';
            case 2: return 'Login & Security';
            default: return 'View Profile';
        }
    };

    return (
        <Container maxWidth={false} className="profile-dashboard-container">
            <Box className="profile-banner-section">
                <Box className="profile-banner-content">
                    <Typography variant="h4" className="profile-page-title">
                        User Profile Management
                    </Typography>
                    <Typography variant="body2" className="profile-breadcrumb">
                        Home &nbsp;&gt;&nbsp; Profile &nbsp;&gt;&nbsp; {getTabName(tabIndex)}
                    </Typography>
                </Box>
            </Box>

            <Paper elevation={3} className="profile-paper">
                <Box className="profile-content-area">
                    <TabPanel value={tabIndex} index={0}>
                        <ViewProfile profileData={profileData} />
                    </TabPanel>
                    
                    <TabPanel value={tabIndex} index={1}>
                        <EditProfile 
                            profileData={profileData} 
                            onProfileUpdated={(updatedData) => {
                                setProfileData(updatedData);
                                showNotification('Your profile information has been updated successfully.');
                                navigate('?tab=0'); // Switch to View Profile
                            }}
                            onError={(msg) => showNotification(msg, 'error')}
                        />
                    </TabPanel>
                    
                    <TabPanel value={tabIndex} index={2}>
                        <ChangePassword 
                            onSuccess={() => showNotification('Your password has been updated successfully.')}
                            onError={(msg) => showNotification(msg, 'error')}
                        />
                    </TabPanel>
                    
                    {/* Hiding Login Security per user request
                    <TabPanel value={tabIndex} index={3}>
                        <LoginSecurity 
                            loginSecurityEnabled={profileData.loginSecurityEnabled}
                            onSecurityUpdated={(isEnabled) => {
                                setProfileData(prev => ({ ...prev, loginSecurityEnabled: isEnabled }));
                                showNotification('Login security settings updated successfully.');
                            }}
                            onError={(msg) => showNotification(msg, 'error')}
                        />
                    </TabPanel>
                    */}
                </Box>
            </Paper>

            <Snackbar 
                open={notification.open} 
                autoHideDuration={6000} 
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ProfileDashboard;
