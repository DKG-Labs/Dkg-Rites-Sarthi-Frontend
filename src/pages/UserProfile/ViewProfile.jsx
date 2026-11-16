import React, { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../../services/authService';
import { API_BASE_URL } from '../../services/apiConfig';
import { formatRoleList } from '../../utils/roleDisplay';
import { Typography, Box, Avatar, Button } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ApartmentIcon from '@mui/icons-material/Apartment';
import ContactPhoneOutlinedIcon from '@mui/icons-material/ContactPhoneOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

/* ── palette: white on deep navy glass, blue / teal / sky accents (no purple) ── */
const C = {
    white: '#ffffff',
    text: 'rgba(255,255,255,0.92)',
    sub: 'rgba(255,255,255,0.95)',
    faint: 'rgba(255,255,255,0.72)',
    line: 'rgba(255,255,255,0.09)',
    sky: '#7dd3fc',
    teal: '#2dd4bf',
    blue: '#3b82f6',
    green: '#4ade80',
    red: '#f87171',
};

const reduce = '@media (prefers-reduced-motion: reduce)';

/* frosted glass surface */
const glass = {
    position: 'relative',
    background: 'linear-gradient(135deg, rgba(30,64,110,0.50) 0%, rgba(14,40,78,0.58) 60%, rgba(10,60,80,0.55) 100%)',
    backdropFilter: 'blur(28px) saturate(170%)',
    WebkitBackdropFilter: 'blur(28px) saturate(170%)',
    border: '1px solid rgba(255,255,255,0.16)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(255,255,255,0.04)',
};

/* 3D entrance: panels flip up into place */
const flipIn = (delay = 0) => ({
    '@keyframes flipIn': {
        from: { opacity: 0, transform: 'perspective(1200px) rotateX(18deg) translateY(36px) scale(0.97)' },
        to: { opacity: 1, transform: 'perspective(1200px) rotateX(0) translateY(0) scale(1)' },
    },
    opacity: 0,
    animation: `flipIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms forwards`,
    [reduce]: { animation: 'none', opacity: 1 },
});

/* ── helpers ─────────────────────────────────────────── */
const has = (v) => v !== null && v !== undefined && String(v).trim() !== '';
const clean = (v) => (has(v) ? String(v).trim() : null);
const titleCase = (s) => {
    const v = clean(s);
    if (!v) return null;
    return v === v.toUpperCase() ? v.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : v;
};
const fmtDOB = (v) => {
    if (!has(v)) return null;
    const p = String(v).split('-');
    if (p.length === 3 && p[0].length === 4) {
        const d = new Date(`${p[0]}-${p[1]}-${p[2]}T00:00:00`);
        if (!isNaN(d)) return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return String(v);
};
const fmtDate = (v, withTime = false) => {
    if (!has(v)) return null;
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    if (!withTime) return date;
    return `${date}, ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).toUpperCase()}`;
};

/* ── 3D tilt: mouse position -> CSS variables (no re-render) ── */
const useTilt = (max = 6) => {
    const ref = useRef(null);
    const onMove = useCallback((e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', `${(x - 0.5) * max * 2}deg`);
        el.style.setProperty('--rx', `${(0.5 - y) * max * 2}deg`);
        el.style.setProperty('--gx', `${x * 100}%`);
        el.style.setProperty('--gy', `${y * 100}%`);
        el.style.setProperty('--glare', '1');
    }, [max]);
    const onLeave = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        el.style.setProperty('--ry', '0deg');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--glare', '0');
    }, []);
    return { ref, onMouseMove: onMove, onMouseLeave: onLeave };
};

const tiltSurface = {
    '--rx': '0deg', '--ry': '0deg', '--gx': '50%', '--gy': '50%', '--glare': '0',
    transform: 'perspective(1200px) rotateX(var(--rx)) rotateY(var(--ry))',
    transformStyle: 'preserve-3d',
    transition: 'transform 0.25s ease-out, box-shadow 0.3s ease',
    willChange: 'transform',
    /* cursor-following glare */
    '&::after': {
        content: '""', position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
        background: 'radial-gradient(600px circle at var(--gx) var(--gy), rgba(255,255,255,0.14), transparent 45%)',
        opacity: 'var(--glare)', transition: 'opacity 0.3s ease',
    },
    [reduce]: { transform: 'none' },
};

/* ── building blocks ─────────────────────────────────── */
const Row = ({ label, value, href, tone }) => {
    const v = clean(value);
    return (
        <Box sx={{
            display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '150px 1fr' }, gap: { xs: 0.25, sm: 2 },
            py: 1.35, borderTop: `1px solid ${C.line}`, '&:first-of-type': { borderTop: 'none' },
        }}>
            <Typography sx={{ fontSize: '13px', color: C.sub }}>{label}</Typography>
            {v ? (
                href ? (
                    <Typography component="a" href={href} sx={{
                        fontSize: '14px', fontWeight: 500, color: C.sky, textDecoration: 'none', width: 'fit-content',
                        wordBreak: 'break-word', transition: 'color .15s, text-shadow .15s',
                        '&:hover': { color: C.white, textShadow: '0 0 12px rgba(125,211,252,0.6)' },
                    }}>{v}</Typography>
                ) : (
                    <Typography sx={{ fontSize: '14px', fontWeight: 500, color: tone || C.text, wordBreak: 'break-word' }}>{v}</Typography>
                )
            ) : (
                <Typography sx={{ fontSize: '14px', color: C.faint }}>Not provided</Typography>
            )}
        </Box>
    );
};

const GlassSection = ({ title, Icon, delay, children }) => {
    const tilt = useTilt(3);
    return (
        <Box sx={{ ...flipIn(delay), height: '100%' }}>
            <Box {...tilt} sx={{
                ...glass, ...tiltSurface,
                height: '100%', borderRadius: '20px', overflow: 'hidden',
                p: { xs: 2.5, md: '26px 30px' },
                /* light sheen sweeping across on hover */
                '&::before': {
                    content: '""', position: 'absolute', top: 0, bottom: 0, left: '-60%', width: '40%',
                    background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.10), transparent)',
                    transform: 'skewX(-18deg)', transition: 'left 0.9s ease', pointerEvents: 'none',
                },
                '&:hover': { boxShadow: '0 30px 70px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.28)' },
                '&:hover::before': { left: '120%' },
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1, transform: 'translateZ(30px)' }}>
                    <Icon sx={{ fontSize: 20, color: C.sky, filter: 'drop-shadow(0 0 8px rgba(125,211,252,0.5))' }} />
                    <Typography sx={{ fontSize: '15.5px', fontWeight: 600, color: C.white, letterSpacing: '-0.01em' }}>
                        {title}
                    </Typography>
                </Box>
                <Box sx={{ transform: 'translateZ(18px)' }}>{children}</Box>
            </Box>
        </Box>
    );
};

const Fact = ({ label, value, delay }) => {
    const v = clean(value);
    if (!v) return null;
    return (
        <Box sx={{
            ...flipIn(delay),
            px: 2, py: 1.25, borderRadius: '14px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
            transition: 'background .2s, transform .2s',
            '&:hover': { background: 'rgba(255,255,255,0.11)', transform: 'translateY(-2px)' },
        }}>
            <Typography sx={{ fontSize: '11.5px', color: C.sub, mb: 0.25 }}>{label}</Typography>
            <Typography sx={{ fontSize: '14.5px', color: C.white, fontWeight: 600 }}>{v}</Typography>
        </Box>
    );
};

/* ── page ────────────────────────────────────────────── */
const ViewProfile = ({ profileData }) => {
    const navigate = useNavigate();
    const heroTilt = useTilt(4);
    if (!profileData) return null;

    const storedUser = getStoredUser();
    const activeRole = formatRoleList(storedUser?.roleName || profileData.activeRole || '') || null;
    const roles = has(profileData.assignedRoles)
        ? formatRoleList(profileData.assignedRoles).split(',').map(r => r.trim()).filter(Boolean)
        : (activeRole ? [activeRole] : []);

    const name = titleCase(profileData.fullName) || 'User';
    const initials = name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const photo = profileData.profilePhotoPath
        ? (profileData.profilePhotoPath.startsWith('data:')
            ? profileData.profilePhotoPath
            : `${API_BASE_URL}${profileData.profilePhotoPath.startsWith('/') ? '' : '/'}${profileData.profilePhotoPath}`)
        : undefined;

    const status = clean(profileData.userStatus) || 'Active';
    const isActive = status.toLowerCase() === 'active';
    const mobile = clean(profileData.registeredMobileNumber);
    const altMobile = clean(profileData.alternateMobileNumber);
    const email = clean(profileData.emailAddress);
    const subtitle = [clean(profileData.designation), clean(profileData.department)].filter(Boolean).join(' · ');

    return (
        <Box sx={{ px: { xs: 2, md: '24px' }, pb: 6 }}>

            {/* ══════════ HERO (glass, 3D tilt) ══════════ */}
            <Box sx={{ ...flipIn(0), mt: '-60px', mb: 3 }}>
                <Box {...heroTilt} sx={{
                    ...glass, ...tiltSurface,
                    borderRadius: '26px', overflow: 'hidden',
                    background: 'linear-gradient(135deg, rgba(30,64,110,0.50) 0%, rgba(14,40,78,0.58) 60%, rgba(10,60,80,0.55) 100%)',
                }}>
                    <Box sx={{
                        p: { xs: 3, md: '34px 40px' },
                        display: 'flex', alignItems: 'center', gap: { xs: 2.5, md: 4 }, flexWrap: 'wrap',
                    }}>
                        {/* avatar: floating, with rotating glow ring */}
                        <Box sx={{
                            position: 'relative', flexShrink: 0, transform: 'translateZ(60px)',
                            '@keyframes float': { '0%,100%': { translate: '0 0' }, '50%': { translate: '0 -6px' } },
                            animation: 'float 5s ease-in-out infinite',
                            [reduce]: { animation: 'none' },
                        }}>
                            <Box sx={{
                                position: 'absolute', inset: -6, borderRadius: '50%',
                                background: `conic-gradient(from 0deg, ${C.blue}, ${C.teal}, ${C.sky}, ${C.blue})`,
                                filter: 'blur(6px)', opacity: 0.85,
                                '@keyframes spin': { to: { transform: 'rotate(360deg)' } },
                                animation: 'spin 7s linear infinite',
                                [reduce]: { animation: 'none' },
                            }} />
                            <Avatar src={photo} sx={{
                                position: 'relative', width: 92, height: 92,
                                border: '3px solid rgba(255,255,255,0.85)',
                                background: 'linear-gradient(145deg, #1e3a8a 0%, #2563eb 55%, #0e7490 100%)',
                                fontSize: '30px', fontWeight: 600, color: '#fff',
                                boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
                            }}>
                                {initials}
                            </Avatar>
                            {isActive && (
                                <Box sx={{
                                    position: 'absolute', bottom: 6, right: 6, width: 15, height: 15, borderRadius: '50%',
                                    bgcolor: '#22c55e', border: '2.5px solid #0b2447',
                                    '@keyframes ping': {
                                        '0%': { boxShadow: '0 0 0 0 rgba(34,197,94,0.6)' },
                                        '80%,100%': { boxShadow: '0 0 0 10px rgba(34,197,94,0)' },
                                    },
                                    animation: 'ping 2.4s ease-out infinite',
                                    [reduce]: { animation: 'none' },
                                }} />
                            )}
                        </Box>

                        {/* identity */}
                        <Box sx={{ flex: '1 1 320px', minWidth: 0, transform: 'translateZ(40px)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                <Typography sx={{
                                    fontSize: { xs: '24px', md: '30px' }, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15,
                                    background: 'linear-gradient(90deg, #ffffff 0%, #dbeafe 60%, #a5f3fc 100%)',
                                    WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                                }}>
                                    {name}
                                </Typography>
                                <Box sx={{
                                    display: 'inline-flex', alignItems: 'center', gap: 0.7, px: 1.2, py: 0.3, borderRadius: '999px',
                                    fontSize: '12px', fontWeight: 600,
                                    color: isActive ? C.green : C.red,
                                    background: isActive ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                                    border: `1px solid ${isActive ? 'rgba(74,222,128,0.35)' : 'rgba(248,113,113,0.35)'}`,
                                }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor' }} />
                                    {status}
                                </Box>
                            </Box>
                            {subtitle && <Typography sx={{ fontSize: '15px', color: C.sub, mt: 0.6 }}>{subtitle}</Typography>}
                            {roles.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                                    {roles.map((r) => {
                                        const current = r === activeRole;
                                        return (
                                            <Box key={r} sx={{
                                                px: 1.4, py: 0.45, borderRadius: '10px', fontSize: '12.5px', fontWeight: 600,
                                                color: current ? C.white : C.text,
                                                background: current ? 'linear-gradient(90deg, rgba(59,130,246,0.55), rgba(45,212,191,0.45))' : 'rgba(255,255,255,0.08)',
                                                border: `1px solid ${current ? 'rgba(125,211,252,0.55)' : 'rgba(255,255,255,0.14)'}`,
                                                boxShadow: current ? '0 0 18px rgba(59,130,246,0.35)' : 'none',
                                            }}>
                                                {r}
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )}
                        </Box>

                        {/* action */}
                        <Button
                            onClick={() => navigate('?tab=1')}
                            startIcon={<EditOutlinedIcon sx={{ fontSize: 18 }} />}
                            sx={{
                                ml: 'auto', transform: 'translateZ(50px)',
                                textTransform: 'none', fontWeight: 600, fontSize: '14px', color: C.white,
                                px: 2.5, py: 1, borderRadius: '12px',
                                background: 'rgba(255,255,255,0.10)',
                                border: '1px solid rgba(255,255,255,0.22)',
                                backdropFilter: 'blur(10px)',
                                transition: 'all .2s ease',
                                '&:hover': {
                                    background: 'rgba(255,255,255,0.18)',
                                    borderColor: 'rgba(125,211,252,0.6)',
                                    boxShadow: '0 0 22px rgba(125,211,252,0.35)',
                                },
                            }}
                        >
                            Edit profile
                        </Button>
                    </Box>

                    {/* key facts (real values only) */}
                    <Box sx={{
                        px: { xs: 3, md: '40px' }, pb: { xs: 3, md: '30px' },
                        display: 'flex', flexWrap: 'wrap', gap: 1.5, transform: 'translateZ(25px)',
                    }}>
                        <Fact label="Employee code" value={profileData.employeeCode || profileData.employeeNumber} delay={250} />
                        <Fact label="Region / SBU" value={profileData.region} delay={320} />
                        <Fact label="Organization" value={profileData.organization} delay={390} />
                        <Fact label="Last login" value={fmtDate(profileData.lastLoginDate, true)} delay={460} />
                    </Box>
                </Box>
            </Box>

            {/* ══════════ DETAIL PANELS ══════════ */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                gap: 3,
            }}>
                <GlassSection title="Personal" Icon={PersonOutlineIcon} delay={200}>
                    <Row label="Full name" value={name} />
                    <Row label="Employee code" value={profileData.employeeCode} />
                    <Row label="Date of birth" value={fmtDOB(profileData.dateOfBirth)} />
                    <Row label="Designation" value={profileData.designation} />
                    <Row label="Discipline" value={profileData.discipline || profileData.department} />
                    <Row label="Employment type" value={profileData.employmentType} />
                </GlassSection>

                <GlassSection title="Organization" Icon={ApartmentIcon} delay={300}>
                    <Row label="Organization" value={profileData.organization} />
                    <Row label="Department" value={profileData.department} />
                    <Row label="Region / SBU" value={profileData.region} />
                    <Row label="Product type" value={profileData.productType} />
                    <Row label="Zonal railway" value={profileData.zonalRailway} />
                    <Row label="Office location" value={profileData.officeLocation} />
                </GlassSection>

                <GlassSection title="Contact" Icon={ContactPhoneOutlinedIcon} delay={400}>
                    <Row label="Mobile" value={mobile} href={mobile ? `tel:${mobile}` : undefined} />
                    <Row label="Alternate mobile" value={altMobile} href={altMobile ? `tel:${altMobile}` : undefined} />
                    <Row label="Email" value={email} href={email ? `mailto:${email}` : undefined} />
                    <Row label="Office address" value={profileData.officeAddress} />
                </GlassSection>

                <GlassSection title="Account" Icon={ShieldOutlinedIcon} delay={500}>
                    <Row label="Assigned roles" value={roles.join(', ')} />
                    <Row label="Signed in as" value={activeRole} />
                    <Row label="Status" value={status} tone={isActive ? C.green : C.red} />
                    <Row label="Account created" value={fmtDate(profileData.accountCreationDate)} />
                    <Row label="Last updated" value={fmtDate(profileData.updatedDate || profileData.updatedAt, true)} />
                </GlassSection>
            </Box>
        </Box>
    );
};

export default ViewProfile;
