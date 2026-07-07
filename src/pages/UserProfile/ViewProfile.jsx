import React from 'react';
import { getStoredUser } from '../../services/authService';
import { Grid, Typography, Box, Paper, Chip, Avatar } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BadgeIcon from '@mui/icons-material/Badge';
import LocationOnIcon from '@mui/icons-material/LocationOn';

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
const na = (val) =>
    val && String(val).trim() !== '' ? String(val).trim() : 'N/A';

const formatRoles = (val) => {
    if (!val) return 'N/A';
    return String(val)
        .replace(/Rail Process IE/gi, 'Railpad Process IE')
        .replace(/Rail Main IE/gi, 'Railpad Main IE');
};

const fmtDOB = (val) => {
    if (!val) return 'N/A';
    const parts = val.split('-');
    return parts.length === 3 ? parts.reverse().join('-') : val;
};

const fmtDateTime = (val) => {
    if (!val) return 'First time login';
    try { return new Date(val).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }); }
    catch { return val; }
};

/* ─────────────────────────────────────────────────────────
   Field
───────────────────────────────────────────────────────── */
const Field = ({ label, value, statusColor }) => (
    <Box sx={{ mb: 1.5 }}>
        <Typography sx={{
            fontSize: '9px', color: '#94a3b8', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.3,
        }}>
            {label}
        </Typography>
        <Typography sx={{
            fontSize: '11.5px', color: statusColor || '#0f172a',
            fontWeight: 600, lineHeight: 1.3, wordBreak: 'break-word',
        }}>
            {na(value)}
        </Typography>
    </Box>
);

const FieldGrid = ({ left, right }) => (
    <Grid container spacing={1}>
        <Grid item xs={6}>
            {left.map(([label, value, color], i) => (
                <Field key={`l-${i}`} label={label} value={value} statusColor={color} />
            ))}
        </Grid>
        <Grid item xs={6}>
            {right.map(([label, value, color], i) => (
                <Field key={`r-${i}`} label={label} value={value} statusColor={color} />
            ))}
        </Grid>
    </Grid>
);

/* ─────────────────────────────────────────────────────────
   Info Card
───────────────────────────────────────────────────────── */
const InfoCard = ({ title, Icon, children }) => (
    <Paper elevation={0} sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        borderRadius: '16px',
        border: '1px solid #e8edf3',
        background: '#fff',
        boxShadow: '0 1px 8px rgba(15,76,129,0.05)',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 10px 32px rgba(15,76,129,0.10)',
        },
    }}>
        <Box sx={{
            px: 2.5, py: 1.8,
            display: 'flex', alignItems: 'center', gap: 1.5,
            borderBottom: '1px solid #f1f5f9',
            background: 'linear-gradient(135deg, #f8faff 0%, #fff 100%)',
        }}>
            <Box sx={{
                width: 30, height: 30, borderRadius: '8px',
                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 1px 4px rgba(37,99,235,0.15)',
            }}>
                <Icon sx={{ fontSize: '15px', color: '#2563eb' }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '12.5px', color: '#1e293b' }}>
                {title}
            </Typography>
        </Box>
        <Box sx={{ px: 2.5, py: 2, flexGrow: 1 }}>
            {children}
        </Box>
    </Paper>
);

/* ─────────────────────────────────────────────────────────
   Quick Stat Tile
───────────────────────────────────────────────────────── */
const QuickStat = ({ icon: Icon, label, value, accent = '#2563eb' }) => (
    <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5,
        px: 2.5, py: 1.5, flex: '1 1 140px',
        borderRight: '1px solid #f1f5f9',
        '&:last-child': { borderRight: 'none' },
    }}>
        <Box sx={{
            width: 34, height: 34, borderRadius: '10px', flexShrink: 0,
            background: `${accent}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <Icon sx={{ fontSize: '16px', color: accent }} />
        </Box>
        <Box>
            <Typography sx={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.3 }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#0f172a', fontWeight: 700, lineHeight: 1.2 }}>
                {na(value)}
            </Typography>
        </Box>
    </Box>
);

/* ─────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────── */
const ViewProfile = ({ profileData }) => {
    if (!profileData) return null;

    // Active role = currently logged-in role from localStorage
    const storedUser = getStoredUser();
    const activeRole = formatRoles(storedUser?.roleName || profileData.activeRole || profileData.assignedRoles);

    const initials = profileData.fullName
        ? profileData.fullName.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    // Parse multiple roles into chips
    const roleChips = profileData.assignedRoles
        ? formatRoles(profileData.assignedRoles).split(',').map(r => r.trim()).filter(Boolean)
        : [];

    return (
        <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100%' }}>

            {/* ══════════════════ PROFILE HEADER CARD (floats over parent banner) ══════════════════ */}
            <Box sx={{ px: { xs: 2, md: '24px' } }}>
                <Paper elevation={0} sx={{
                    mt: '-72px',
                    mb: 3,
                    position: 'relative',
                    zIndex: 10,
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    boxShadow: '0 12px 40px rgba(15,76,129,0.08), 0 4px 12px rgba(0,0,0,0.04)',
                    p: { xs: 3, sm: '28px 36px' },
                }}>
                    {/* Avatar + info row */}
                    <Box sx={{ px: 0, pb: 0, mt: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2.5, flexWrap: 'wrap', mb: 2 }}>
                            {/* Avatar */}
                            <Box sx={{ position: 'relative', flexShrink: 0 }}>
                                <Avatar
                                    src={profileData.profilePhotoPath}
                                    sx={{
                                        width: 76, height: 76,
                                        background: 'linear-gradient(135deg, #0f4c81 0%, #2563eb 100%)',
                                        fontSize: '26px', fontWeight: 800, color: '#fff',
                                        border: '4px solid #fff',
                                        boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
                                    }}
                                >
                                    {initials}
                                </Avatar>
                                <Box sx={{
                                    position: 'absolute', bottom: 5, right: 2,
                                    width: 13, height: 13, borderRadius: '50%',
                                    bgcolor: '#22c55e', border: '2px solid #fff',
                                }} />
                            </Box>

                            {/* Name / role / designation */}
                            <Box sx={{ mb: 0.5 }}>
                                <Typography sx={{
                                    fontSize: '19px', fontWeight: 800, color: '#0f172a',
                                    letterSpacing: '-0.02em', lineHeight: 1.2,
                                }}>
                                    {na(profileData.fullName)}
                                </Typography>
                                <Typography sx={{ fontSize: '12.5px', color: '#2563eb', fontWeight: 600, mb: 1 }}>
                                    {na(profileData.designation)}
                                    {profileData.department ? ` · ${profileData.department}` : ''}
                                </Typography>
                                {/* Role chips */}
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.7 }}>
                                    {roleChips.map((role, i) => (
                                        <Chip
                                            key={i}
                                            label={role}
                                            size="small"
                                            sx={{
                                                height: '22px',
                                                fontSize: '10.5px', fontWeight: 700,
                                                backgroundColor: '#eff6ff',
                                                color: '#1d4ed8',
                                                border: '1px solid #bfdbfe',
                                                borderRadius: '6px',
                                                '& .MuiChip-label': { px: 1 },
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        </Box>

                        {/* Quick stats bar */}
                        <Box sx={{
                            display: 'flex', flexWrap: 'wrap',
                            border: '1px solid #f1f5f9',
                            borderRadius: '12px',
                            background: '#fafbfc',
                            overflow: 'hidden',
                        }}>
                            <QuickStat icon={BadgeIcon}           label="Employee Code"  value={profileData.employeeCode || profileData.employeeNumber} accent="#2563eb" />
                            <QuickStat icon={BusinessCenterIcon}  label="Department"     value={profileData.department}    accent="#0891b2" />
                            <QuickStat icon={PersonIcon}          label="Organization"   value={profileData.organization}  accent="#7c3aed" />
                            <QuickStat icon={LocationOnIcon}      label="Region / SBU"   value={profileData.region}        accent="#059669" />
                            <QuickStat icon={AdminPanelSettingsIcon} label="Active Role" value={activeRole} accent="#d97706" />
                            <QuickStat icon={PhoneInTalkIcon}     label="Last Login"     value={fmtDateTime(profileData.lastLoginDate)} accent="#dc2626" />
                        </Box>
                    </Box>
                </Paper>
            </Box>

            {/* ══════════════════ INFO CARDS  2 × 2 ══════════════════ */}
            <Box sx={{ px: { xs: 2, md: '24px' }, pb: 4 }}>
                <Grid container spacing={2.5}>

                    {/* Basic Information */}
                    <Grid item xs={12} md={6}>
                        <InfoCard title="Basic Information" Icon={PersonIcon}>
                            <FieldGrid
                                left={[
                                    ['Full Name', profileData.fullName],
                                    ['Employee Code', profileData.employeeCode],
                                    ['Date of Birth', fmtDOB(profileData.dateOfBirth)],
                                ]}
                                right={[
                                    ['Designation', profileData.designation],
                                    ['Discipline', profileData.department],
                                    ['Employment Type', profileData.employmentType || 'Regular'],
                                ]}
                            />
                        </InfoCard>
                    </Grid>

                    {/* Organization Information */}
                    <Grid item xs={12} md={6}>
                        <InfoCard title="Organization Information" Icon={BusinessCenterIcon}>
                            <FieldGrid
                                left={[
                                    ['Organization', profileData.organization],
                                    ['Department', profileData.department],
                                    ['Region', profileData.region],
                                ]}
                                right={[
                                    ['Product Type', profileData.productType],
                                    ['Zonal Railway', profileData.zonalRailway || profileData.organization],
                                    ['Office Location', profileData.officeLocation],
                                ]}
                            />
                        </InfoCard>
                    </Grid>

                    {/* Contact Information */}
                    <Grid item xs={12} md={6}>
                        <InfoCard title="Contact Information" Icon={PhoneInTalkIcon}>
                            <FieldGrid
                                left={[
                                    ['Mobile Number', profileData.registeredMobileNumber],
                                    ['Alternate Mobile', profileData.alternateMobileNumber],
                                ]}
                                right={[
                                    ['Email Address', profileData.emailAddress],
                                    ['Office Address', profileData.officeAddress],
                                ]}
                            />
                        </InfoCard>
                    </Grid>

                    {/* System Information */}
                    <Grid item xs={12} md={6}>
                        <InfoCard title="System Information" Icon={AdminPanelSettingsIcon}>
                            <FieldGrid
                                left={[
                                    ['Assigned Role(s)', formatRoles(profileData.assignedRoles)],
                                    ['Active Role', activeRole],
                                    ['User Status', profileData.userStatus || 'Active',
                                        (profileData.userStatus || 'Active').toLowerCase() === 'active'
                                            ? '#16a34a' : '#dc2626'],
                                ]}
                                right={[
                                    ['Account Creation Date', profileData.accountCreationDate],
                                    ['Last Login Date', fmtDateTime(profileData.lastLoginDate)],
                                    ['Updated Date', profileData.updatedDate || profileData.updatedAt],
                                ]}
                            />
                        </InfoCard>
                    </Grid>

                </Grid>
            </Box>
        </Box>
    );
};

export default ViewProfile;
