import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, TextField, Button, Box, CircularProgress, Avatar, MenuItem } from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import ContactPhoneOutlinedIcon from '@mui/icons-material/ContactPhoneOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import { API_BASE_URL } from '../../services/apiConfig';
import { updateProfile } from '../../services/userProfileService';

/* ── glass theme (same palette as ViewProfile; no purple) ── */
const C = {
    white: '#ffffff',
    text: 'rgba(255,255,255,0.92)',
    sub: 'rgba(255,255,255,0.92)',
    faint: 'rgba(255,255,255,0.72)',
    line: 'rgba(255,255,255,0.10)',
    sky: '#7dd3fc',
    teal: '#2dd4bf',
    blue: '#3b82f6',
    error: '#fca5a5',
};
const reduce = '@media (prefers-reduced-motion: reduce)';

const glass = {
    position: 'relative',
    background: 'linear-gradient(135deg, rgba(30,64,110,0.50) 0%, rgba(14,40,78,0.58) 60%, rgba(10,60,80,0.55) 100%)',
    backdropFilter: 'blur(28px) saturate(170%)',
    WebkitBackdropFilter: 'blur(28px) saturate(170%)',
    border: '1px solid rgba(255,255,255,0.16)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.22)',
};

const flipIn = (delay = 0) => ({
    '@keyframes flipIn': {
        from: { opacity: 0, transform: 'perspective(1200px) rotateX(16deg) translateY(30px) scale(0.98)' },
        to: { opacity: 1, transform: 'perspective(1200px) rotateX(0) translateY(0) scale(1)' },
    },
    opacity: 0,
    animation: `flipIn 0.85s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms forwards`,
    [reduce]: { animation: 'none', opacity: 1 },
});

/* glass text field (works for plain and native-select fields) */
const inputSx = {
    width: '100%',
    '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        backgroundColor: 'rgba(4,16,36,0.30)',
        color: C.white,
        transition: 'background-color .2s, box-shadow .2s',
        '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.32)' },
        '&.Mui-focused': {
            backgroundColor: 'rgba(255,255,255,0.10)',
            boxShadow: '0 0 0 4px rgba(125,211,252,0.15)',
        },
        '&.Mui-focused fieldset': { borderColor: C.sky, borderWidth: '1px' },
        '&.Mui-error fieldset': { borderColor: 'rgba(248,113,113,0.7)' },
    },
    '& .MuiOutlinedInput-input': {
        padding: '13px 15px',
        fontSize: '14.5px',
        color: C.white,
        '&::placeholder': { color: C.faint, opacity: 1 },
        '&:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 100px rgba(15,40,75,0.95) inset',
            WebkitTextFillColor: C.white,
            caretColor: C.white,
        },
    },
    '& .MuiNativeSelect-icon, & .MuiSelect-icon': { color: C.sub },
    '& .MuiFormHelperText-root': { color: C.error, mx: 0.5, mt: 0.75, fontSize: '12.5px' },
};

/* native <option>s use the OS dropdown — keep them dark-on-white so they stay readable */
const DESIGNATIONS = ['Technical Assistant', 'Senior Technical Assistant', 'Assistant Engineer', 'Engineer',
    'Assistant Manager', 'Manager', 'Senior Manager', 'DGM', 'JGM', 'AGM', 'GM', 'GGM', 'ED'];
const NOTIFICATION_PREFS = ['Email Only', 'SMS Only', 'Both Email & SMS'];

/* dropdown menu in the same frosted-navy glass as the card */
const glassMenu = {
    MenuProps: {
        PaperProps: {
            sx: {
                mt: 1, borderRadius: '14px', py: 0.5,
                background: 'linear-gradient(160deg, rgba(14,36,70,0.96), rgba(8,24,48,0.97))',
                backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                border: '1px solid rgba(255,255,255,0.14)',
                boxShadow: '0 22px 50px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)',
                color: '#fff', maxHeight: 320,
                '& .MuiMenuItem-root': {
                    fontSize: '14px', py: 1.1, px: 1.5, mx: 0.75, my: 0.25, borderRadius: '9px',
                    transition: 'background-color .15s',
                    '&:hover': { backgroundColor: 'rgba(125,211,252,0.12)' },
                    '&.Mui-selected': { backgroundColor: 'rgba(59,130,246,0.32)', fontWeight: 600 },
                    '&.Mui-selected:hover': { backgroundColor: 'rgba(59,130,246,0.40)' },
                    '&.Mui-focusVisible': { backgroundColor: 'rgba(125,211,252,0.16)' },
                },
            },
        },
    },
};
/* empty value shows a muted placeholder instead of looking like a real choice */
const withPlaceholder = (placeholder) => ({
    ...glassMenu,
    displayEmpty: true,
    renderValue: (v) => (v ? v : <Box component="span" sx={{ color: 'rgba(255,255,255,0.58)' }}>{placeholder}</Box>),
});

const Label = ({ text, required, htmlFor }) => (
    <Typography component="label" htmlFor={htmlFor} sx={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: C.white, mb: 0.9, textShadow: '0 1px 3px rgba(0,0,0,0.55)' }}>
        {text}
        {required && <Box component="span" sx={{ color: C.sky, ml: 0.5 }}>*</Box>}
    </Typography>
);

const Group = ({ title, Icon, delay, children }) => (
    <Box sx={{ ...flipIn(delay) }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1, mb: 2 }}>
            <Icon sx={{ fontSize: 19, color: C.sky, filter: 'drop-shadow(0 0 8px rgba(125,211,252,0.5))' }} />
            <Typography sx={{ fontSize: '15px', fontWeight: 600, color: C.white }}>{title}</Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 2.5, md: 3 } }}>
            {children}
        </Box>
    </Box>
);

const EditProfile = ({ profileData, onProfileUpdated, onError }) => {
    const navigate = useNavigate();
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

    const photo = formData.profilePhotoPath?.startsWith('data:')
        ? formData.profilePhotoPath
        : (formData.profilePhotoPath ? `${API_BASE_URL}${formData.profilePhotoPath.startsWith('/') ? '' : '/'}${formData.profilePhotoPath}` : undefined);
    const initial = profileData.fullName ? profileData.fullName.trim().charAt(0).toUpperCase() : 'U';

    return (
        <Box sx={{ px: { xs: 2, md: '24px' }, pb: 6 }}>
            <Box sx={{ ...flipIn(0), mt: '-60px' }}>
                <Box sx={{ ...glass, borderRadius: '26px', overflow: 'hidden' }}>

                    {/* ── header ── */}
                    <Box sx={{
                        p: { xs: 3, md: '32px 40px' },
                        display: 'flex', alignItems: 'center', gap: { xs: 2.5, md: 3.5 }, flexWrap: 'wrap',
                        borderBottom: `1px solid ${C.line}`,
                    }}>
                        {/* avatar with glow ring + photo picker */}
                        <Box sx={{ position: 'relative', flexShrink: 0 }}>
                            <Box sx={{
                                position: 'absolute', inset: -6, borderRadius: '50%',
                                background: `conic-gradient(from 0deg, ${C.blue}, ${C.teal}, ${C.sky}, ${C.blue})`,
                                filter: 'blur(6px)', opacity: 0.85,
                                '@keyframes spin': { to: { transform: 'rotate(360deg)' } },
                                animation: 'spin 7s linear infinite',
                                [reduce]: { animation: 'none' },
                            }} />
                            <Avatar src={photo} alt={profileData.fullName} sx={{
                                position: 'relative', width: 88, height: 88,
                                border: '3px solid rgba(255,255,255,0.85)',
                                background: 'linear-gradient(145deg, #1e3a8a 0%, #2563eb 55%, #0e7490 100%)',
                                fontSize: '32px', fontWeight: 600, color: '#fff',
                                boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
                            }}>
                                {initial}
                            </Avatar>
                            <input accept="image/*" style={{ display: 'none' }} id="icon-button-file" type="file" onChange={handleImageChange} />
                            <Box component="label" htmlFor="icon-button-file" title="Change photo" sx={{
                                position: 'absolute', bottom: -2, right: -2, width: 34, height: 34, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                background: 'rgba(15,40,75,0.75)', backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255,255,255,0.35)',
                                boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
                                transition: 'transform .2s, box-shadow .2s',
                                '&:hover': { transform: 'scale(1.08)', boxShadow: '0 0 18px rgba(125,211,252,0.55)' },
                            }}>
                                <PhotoCameraOutlinedIcon sx={{ fontSize: 17, color: C.sky }} />
                            </Box>
                        </Box>

                        <Box sx={{ flex: '1 1 280px', minWidth: 0 }}>
                            <Typography sx={{
                                fontSize: { xs: '23px', md: '27px' }, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2,
                                background: 'linear-gradient(90deg, #ffffff 0%, #dbeafe 60%, #a5f3fc 100%)',
                                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                            }}>
                                Edit profile
                            </Typography>
                            <Typography sx={{ fontSize: '14.5px', color: C.sub, mt: 0.6 }}>
                                Update your contact details, designation and notification preferences.
                            </Typography>
                            <Box component="label" htmlFor="icon-button-file" sx={{
                                display: 'inline-block', mt: 1.2, fontSize: '13px', fontWeight: 600, color: C.sky, cursor: 'pointer',
                                '&:hover': { color: C.white },
                            }}>
                                Change photo
                            </Box>
                        </Box>
                    </Box>

                    {/* ── form ── */}
                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ p: { xs: 3, md: '32px 40px' }, display: 'grid', gap: 4 }}>
                        <Group title="Contact" Icon={ContactPhoneOutlinedIcon} delay={120}>
                            <Box>
                                <Label text="Mobile number" required htmlFor="ep-mobile" />
                                <TextField
                                    id="ep-mobile" name="mobileNumber" placeholder="10-digit mobile number"
                                    value={formData.mobileNumber} onChange={handleChange}
                                    error={!!errors.mobileNumber} helperText={errors.mobileNumber}
                                    inputProps={{ inputMode: 'numeric', maxLength: 10 }}
                                    sx={inputSx}
                                />
                            </Box>
                            <Box>
                                <Label text="Alternate mobile" htmlFor="ep-alt" />
                                <TextField
                                    id="ep-alt" name="alternateMobileNumber" placeholder="Optional"
                                    value={formData.alternateMobileNumber} onChange={handleChange}
                                    error={!!errors.alternateMobileNumber} helperText={errors.alternateMobileNumber}
                                    inputProps={{ inputMode: 'numeric', maxLength: 10 }}
                                    sx={inputSx}
                                />
                            </Box>
                            <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                                <Label text="Email address" required htmlFor="ep-email" />
                                <TextField
                                    id="ep-email" name="emailAddress" type="email" placeholder="official.email@rites.com"
                                    value={formData.emailAddress} onChange={handleChange}
                                    error={!!errors.emailAddress} helperText={errors.emailAddress}
                                    sx={inputSx}
                                />
                            </Box>
                        </Group>

                        <Group title="Work & preferences" Icon={WorkOutlineIcon} delay={220}>
                            <Box>
                                <Label text="Designation" required htmlFor="ep-designation" />
                                <TextField
                                    id="ep-designation" select name="designation"
                                    value={formData.designation} onChange={handleChange}
                                    error={!!errors.designation} helperText={errors.designation}
                                    SelectProps={withPlaceholder('Select designation')}
                                    sx={inputSx}
                                >
                                    {DESIGNATIONS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                                </TextField>
                            </Box>
                            <Box>
                                <Label text="Notification preference" htmlFor="ep-notif" />
                                <TextField
                                    id="ep-notif" select name="notificationPreferences"
                                    value={formData.notificationPreferences} onChange={handleChange}
                                    SelectProps={withPlaceholder('Select preference')}
                                    sx={inputSx}
                                >
                                    {NOTIFICATION_PREFS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                                </TextField>
                            </Box>
                        </Group>

                        {/* ── actions ── */}
                        <Box sx={{
                            ...flipIn(320),
                            display: 'flex', justifyContent: 'flex-end', gap: 1.5, flexWrap: 'wrap',
                            pt: 3, borderTop: `1px solid ${C.line}`,
                        }}>
                            <Button
                                type="button" onClick={() => navigate('?tab=0')} disabled={saving}
                                sx={{
                                    textTransform: 'none', fontWeight: 600, fontSize: '14px', color: C.text,
                                    px: 2.75, py: 1.1, borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.06)',
                                    '&:hover': { background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.35)' },
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit" disabled={saving}
                                startIcon={saving ? <CircularProgress size={17} sx={{ color: '#fff' }} /> : <SaveOutlinedIcon sx={{ fontSize: 18 }} />}
                                sx={{
                                    textTransform: 'none', fontWeight: 700, fontSize: '14px', color: '#fff',
                                    px: 3.25, py: 1.1, borderRadius: '12px',
                                    background: 'linear-gradient(90deg, #2563eb 0%, #0ea5e9 55%, #14b8a6 100%)',
                                    boxShadow: '0 10px 26px rgba(14,165,233,0.35), inset 0 1px 0 rgba(255,255,255,0.3)',
                                    transition: 'transform .2s, box-shadow .2s, filter .2s',
                                    '&:hover': {
                                        background: 'linear-gradient(90deg, #2563eb 0%, #0ea5e9 55%, #14b8a6 100%)',
                                        transform: 'translateY(-2px)',
                                        filter: 'brightness(1.08)',
                                        boxShadow: '0 14px 32px rgba(14,165,233,0.45), inset 0 1px 0 rgba(255,255,255,0.35)',
                                    },
                                    '&.Mui-disabled': { color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.14)', boxShadow: 'none' },
                                }}
                            >
                                {saving ? 'Saving…' : 'Save changes'}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default EditProfile;
