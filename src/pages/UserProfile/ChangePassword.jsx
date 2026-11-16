import React, { useState, useEffect, useRef } from 'react';
import { Typography, TextField, Button, Box, CircularProgress, InputAdornment, IconButton } from '@mui/material';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import { changePassword, requestChangePasswordOtp } from '../../services/userProfileService';

/* ── glass theme (same as View / Edit profile; no purple) ── */
const C = {
    white: '#ffffff',
    text: 'rgba(255,255,255,0.92)',
    sub: 'rgba(255,255,255,0.95)',
    faint: 'rgba(255,255,255,0.72)',
    line: 'rgba(255,255,255,0.10)',
    sky: '#7dd3fc',
    teal: '#2dd4bf',
    blue: '#3b82f6',
    green: '#4ade80',
    amber: '#fbbf24',
    red: '#f87171',
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

const inputSx = {
    width: '100%',
    '& .MuiOutlinedInput-root': {
        borderRadius: '10px',
        backgroundColor: 'rgba(4,16,36,0.30)',
        color: C.white,
        transition: 'background-color .2s, box-shadow .2s',
        '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.32)' },
        '&.Mui-focused': { backgroundColor: 'rgba(255,255,255,0.10)', boxShadow: '0 0 0 4px rgba(125,211,252,0.15)' },
        '&.Mui-focused fieldset': { borderColor: C.sky, borderWidth: '1px' },
        '&.Mui-error fieldset': { borderColor: 'rgba(248,113,113,0.7)' },
    },
    '& .MuiOutlinedInput-input': {
        padding: '10px 13px', fontSize: '14px', color: C.white,
        '&::placeholder': { color: C.faint, opacity: 1 },
        '&:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 100px rgba(15,40,75,0.95) inset',
            WebkitTextFillColor: C.white, caretColor: C.white,
        },
    },
    '& .MuiFormHelperText-root': { color: C.error, mx: 0.5, mt: 0.75, fontSize: '12.5px' },
};

/* password rules — same as the backend check */
const ALLOWED = /^[A-Za-z\d@$!%*?&]*$/;
const RULES = [
    { key: 'len', label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { key: 'upper', label: 'One uppercase letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
    { key: 'lower', label: 'One lowercase letter (a–z)', test: (p) => /[a-z]/.test(p) },
    { key: 'num', label: 'One number (0–9)', test: (p) => /\d/.test(p) },
    { key: 'special', label: 'One special character (@ $ ! % * ? &)', test: (p) => /[@$!%*?&]/.test(p) },
    { key: 'allowed', label: 'No spaces or other symbols', test: (p) => p.length > 0 && ALLOWED.test(p) },
];

const OTP_LEN = 6;
const RESEND_SECONDS = 30;

const Label = ({ text, htmlFor }) => (
    <Typography component="label" htmlFor={htmlFor} sx={{
        display: 'block', fontSize: '12.5px', fontWeight: 600, color: C.white, mb: 0.6,
        textShadow: '0 1px 3px rgba(0,0,0,0.55)',
    }}>
        {text} <Box component="span" sx={{ color: C.sky }}>*</Box>
    </Typography>
);

const Check = ({ ok, children }) => (
    <Box sx={{
        display: 'flex', alignItems: 'center', gap: 0.75, fontSize: '12px',
        color: ok ? C.green : C.faint, transition: 'color .2s',
    }}>
        {ok
            ? <CheckCircleRoundedIcon sx={{ fontSize: 15, color: C.green, filter: 'drop-shadow(0 0 6px rgba(74,222,128,0.5))' }} />
            : <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 15, color: 'rgba(255,255,255,0.35)' }} />}
        <span>{children}</span>
    </Box>
);

const PasswordField = ({ id, name, label, value, onChange, show, onToggle, error, autoComplete, disabled }) => (
    <Box>
        <Label text={label} htmlFor={id} />
        <TextField
            id={id} name={name} type={show ? 'text' : 'password'} value={value} onChange={onChange}
            error={!!error} helperText={error} autoComplete={autoComplete} disabled={disabled}
            sx={inputSx}
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                        <IconButton onClick={onToggle} edge="end" size="small" aria-label={show ? 'Hide password' : 'Show password'}>
                            {show ? <VisibilityOff sx={{ color: C.faint }} /> : <Visibility sx={{ color: C.faint }} />}
                        </IconButton>
                    </InputAdornment>
                ),
            }}
        />
    </Box>
);

const primaryBtn = {
    textTransform: 'none', fontWeight: 700, fontSize: '14.5px', color: '#fff',
    px: 2.75, py: 0.9, borderRadius: '10px',
    background: 'linear-gradient(90deg, #2563eb 0%, #0ea5e9 55%, #14b8a6 100%)',
    boxShadow: '0 10px 26px rgba(14,165,233,0.35), inset 0 1px 0 rgba(255,255,255,0.3)',
    transition: 'transform .2s, box-shadow .2s, filter .2s',
    '&:hover': {
        background: 'linear-gradient(90deg, #2563eb 0%, #0ea5e9 55%, #14b8a6 100%)',
        transform: 'translateY(-2px)', filter: 'brightness(1.08)',
        boxShadow: '0 14px 32px rgba(14,165,233,0.45), inset 0 1px 0 rgba(255,255,255,0.35)',
    },
    '&.Mui-disabled': { color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.12)', boxShadow: 'none' },
};

const ChangePassword = ({ onSuccess, onError }) => {
    const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [show, setShow] = useState({ current: false, next: false, confirm: false });
    const [errors, setErrors] = useState({});

    // OTP step
    const [otpSent, setOtpSent] = useState(false);
    const [transactionId, setTransactionId] = useState('');
    const [notice, setNotice] = useState('');
    const [otp, setOtp] = useState(Array(OTP_LEN).fill(''));
    const [cooldown, setCooldown] = useState(0);
    const [sending, setSending] = useState(false);
    const [saving, setSaving] = useState(false);
    const otpRefs = useRef([]);

    useEffect(() => {
        if (cooldown <= 0) return undefined;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const pwd = formData.newPassword;
    const ruleState = RULES.map((r) => ({ ...r, ok: r.test(pwd) }));
    const passed = ruleState.filter((r) => r.ok).length;
    const allRules = passed === RULES.length;
    const matches = formData.confirmPassword.length > 0 && formData.confirmPassword === pwd;
    const canSendOtp = !!formData.currentPassword && allRules && matches;
    const otpValue = otp.join('');

    const strength = passed <= 2 ? { label: 'Weak', color: C.red } : passed <= 4 ? { label: 'Fair', color: C.amber } : passed === 5 ? { label: 'Good', color: C.sky } : { label: 'Strong', color: C.green };

    const resetOtpStep = () => {
        setOtpSent(false); setTransactionId(''); setNotice(''); setOtp(Array(OTP_LEN).fill('')); setCooldown(0);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
        // the OTP was issued for the previous values — ask for a fresh one
        if (otpSent) resetOtpStep();
    };

    const sendOtp = async () => {
        if (!formData.currentPassword) { setErrors({ ...errors, currentPassword: 'Please enter your current password.' }); return; }
        if (!canSendOtp) return;
        setSending(true);
        try {
            const res = await requestChangePasswordOtp(formData);
            setTransactionId(res?.transactionId ? String(res.transactionId) : '');
            setNotice(res?.noticeMessage || 'OTP sent to your registered mobile number.');
            setOtp(Array(OTP_LEN).fill(''));
            setOtpSent(true);
            setCooldown(RESEND_SECONDS);
            setTimeout(() => otpRefs.current[0]?.focus(), 50);
        } catch (error) {
            const msg = error?.message || '';
            if (/current password/i.test(msg)) setErrors({ ...errors, currentPassword: msg });
            onError(msg || 'Unable to send OTP. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const setOtpAt = (i, v) => setOtp((prev) => { const n = [...prev]; n[i] = v; return n; });
    const onOtpChange = (i, e) => {
        const digits = e.target.value.replace(/\D/g, '');
        if (!digits) { setOtpAt(i, ''); return; }
        if (digits.length > 1) {                       // paste / autofill of several digits
            const n = [...otp];
            for (let k = 0; k < digits.length && i + k < OTP_LEN; k++) n[i + k] = digits[k];
            setOtp(n);
            otpRefs.current[Math.min(i + digits.length, OTP_LEN - 1)]?.focus();
            return;
        }
        setOtpAt(i, digits);
        if (i < OTP_LEN - 1) otpRefs.current[i + 1]?.focus();
    };
    const onOtpKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
        if (e.key === 'ArrowLeft' && i > 0) otpRefs.current[i - 1]?.focus();
        if (e.key === 'ArrowRight' && i < OTP_LEN - 1) otpRefs.current[i + 1]?.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!otpSent) { sendOtp(); return; }
        if (otpValue.length !== OTP_LEN) return;
        setSaving(true);
        try {
            await changePassword({ ...formData, transactionId, otp: otpValue });
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            resetOtpStep();
            onSuccess();
        } catch (error) {
            const msg = error?.message || '';
            onError(msg || 'Unable to change your password. Please try again.');
            if (/OTP/i.test(msg)) { setOtp(Array(OTP_LEN).fill('')); otpRefs.current[0]?.focus(); }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ px: { xs: 2, md: '24px' }, pb: 6, display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ ...flipIn(0), mt: '-60px', width: '100%', maxWidth: 560 }}>
                <Box sx={{ ...glass, borderRadius: '26px', overflow: 'hidden' }}>

                    {/* header */}
                    <Box sx={{ p: { xs: 2.5, md: '20px 28px' }, display: 'flex', alignItems: 'center', gap: 1.75, borderBottom: `1px solid ${C.line}` }}>
                        <Box sx={{
                            width: 42, height: 42, borderRadius: '13px', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'linear-gradient(135deg, rgba(59,130,246,0.55), rgba(45,212,191,0.45))',
                            border: '1px solid rgba(125,211,252,0.55)',
                            boxShadow: '0 0 24px rgba(59,130,246,0.35)',
                        }}>
                            <LockResetOutlinedIcon sx={{ color: '#fff', fontSize: 22 }} />
                        </Box>
                        <Box>
                            <Typography sx={{
                                fontSize: { xs: '19px', md: '21px' }, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2,
                                background: 'linear-gradient(90deg, #ffffff 0%, #dbeafe 60%, #a5f3fc 100%)',
                                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                            }}>
                                Change password
                            </Typography>
                            <Typography sx={{ fontSize: '12.5px', color: C.sub, mt: 0.25 }}>
                                For your security, we'll send an OTP to your registered mobile to confirm the change.
                            </Typography>
                        </Box>
                    </Box>

                    <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="off" sx={{ p: { xs: 2.5, md: '20px 28px' }, display: 'grid', gap: 1.75 }}>
                        <Box sx={{ ...flipIn(100) }}>
                            <PasswordField id="cp-current" name="currentPassword" label="Current password" autoComplete="current-password"
                                value={formData.currentPassword} onChange={handleChange} error={errors.currentPassword}
                                show={show.current} onToggle={() => setShow({ ...show, current: !show.current })} />
                        </Box>

                        <Box sx={{ ...flipIn(160), display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.75 }}>
                            <PasswordField id="cp-new" name="newPassword" label="New password" autoComplete="new-password"
                                value={formData.newPassword} onChange={handleChange} error={errors.newPassword}
                                show={show.next} onToggle={() => setShow({ ...show, next: !show.next })} />
                            <Box>
                                <PasswordField id="cp-confirm" name="confirmPassword" label="Confirm new password" autoComplete="new-password"
                                    value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword}
                                    show={show.confirm} onToggle={() => setShow({ ...show, confirm: !show.confirm })} />
                                {formData.confirmPassword && (
                                    <Box sx={{ mt: 1 }}>
                                        <Check ok={matches}>{matches ? 'Passwords match' : 'Passwords do not match yet'}</Check>
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        {/* live password checklist */}
                        <Box sx={{
                            ...flipIn(220),
                            p: 1.5, borderRadius: '12px',
                            background: 'rgba(4,16,36,0.25)', border: '1px solid rgba(255,255,255,0.10)',
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.9 }}>
                                <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: C.white }}>Password must have</Typography>
                                {pwd && <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: strength.color }}>{strength.label}</Typography>}
                            </Box>
                            <Box sx={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.10)', overflow: 'hidden', mb: 1.1 }}>
                                <Box sx={{
                                    height: '100%', width: `${(passed / RULES.length) * 100}%`,
                                    background: `linear-gradient(90deg, ${C.red}, ${C.amber}, ${C.sky}, ${C.green})`,
                                    backgroundSize: `${(RULES.length / Math.max(passed, 1)) * 100}% 100%`,
                                    transition: 'width .35s ease', borderRadius: 99,
                                }} />
                            </Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, rowGap: 0.5, columnGap: 1.5 }}>
                                {ruleState.map((r) => <Check key={r.key} ok={r.ok}>{r.label}</Check>)}
                            </Box>
                        </Box>

                        {/* OTP step */}
                        {otpSent && (
                            <Box sx={{
                                ...flipIn(0),
                                p: { xs: 1.75, md: 2 }, borderRadius: '12px',
                                background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(125,211,252,0.30)',
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mb: 2 }}>
                                    <SmsOutlinedIcon sx={{ color: C.sky, fontSize: 21, mt: '1px' }} />
                                    <Box>
                                        <Typography sx={{ fontSize: '14px', fontWeight: 600, color: C.white }}>Enter the 6-digit OTP</Typography>
                                        <Typography sx={{ fontSize: '13px', color: C.sub, mt: 0.25 }}>{notice}</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, flexWrap: 'wrap' }}>
                                    {otp.map((d, i) => (
                                        <Box
                                            key={i} component="input"
                                            ref={(el) => { otpRefs.current[i] = el; }}
                                            value={d}
                                            onChange={(e) => onOtpChange(i, e)}
                                            onKeyDown={(e) => onOtpKeyDown(i, e)}
                                            inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'}
                                            maxLength={OTP_LEN} aria-label={`OTP digit ${i + 1}`}
                                            sx={{
                                                width: { xs: 38, sm: 44 }, height: { xs: 44, sm: 48 }, textAlign: 'center',
                                                fontSize: '20px', fontWeight: 700, color: C.white, outline: 'none',
                                                borderRadius: '12px', border: `1px solid ${d ? 'rgba(125,211,252,0.6)' : 'rgba(255,255,255,0.20)'}`,
                                                background: 'rgba(4,16,36,0.35)', caretColor: C.sky,
                                                transition: 'border-color .15s, box-shadow .15s, transform .15s',
                                                '&:focus': { borderColor: C.sky, boxShadow: '0 0 0 4px rgba(125,211,252,0.18)', transform: 'translateY(-1px)' },
                                            }}
                                        />
                                    ))}
                                </Box>
                                <Box sx={{ mt: 1.75, fontSize: '13px', color: C.sub }}>
                                    Didn't receive it?{' '}
                                    {cooldown > 0 ? (
                                        <Box component="span" sx={{ color: C.faint }}>Resend in {cooldown}s</Box>
                                    ) : (
                                        <Box component="button" type="button" onClick={sendOtp} disabled={sending} sx={{
                                            background: 'none', border: 'none', p: 0, cursor: 'pointer', font: 'inherit',
                                            color: C.sky, fontWeight: 600, '&:hover': { color: C.white },
                                        }}>
                                            {sending ? 'Sending…' : 'Resend OTP'}
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        )}

                        {/* actions */}
                        <Box sx={{ ...flipIn(280), display: 'flex', justifyContent: 'flex-end', pt: 1.75, borderTop: `1px solid ${C.line}` }}>
                            {!otpSent ? (
                                <Button type="button" onClick={sendOtp} disabled={!canSendOtp || sending}
                                    startIcon={sending ? <CircularProgress size={17} sx={{ color: '#fff' }} /> : <SmsOutlinedIcon sx={{ fontSize: 18 }} />}
                                    sx={primaryBtn}>
                                    {sending ? 'Sending OTP…' : 'Send OTP'}
                                </Button>
                            ) : (
                                <Button type="submit" disabled={otpValue.length !== OTP_LEN || saving}
                                    startIcon={saving ? <CircularProgress size={17} sx={{ color: '#fff' }} /> : <LockResetOutlinedIcon sx={{ fontSize: 18 }} />}
                                    sx={primaryBtn}>
                                    {saving ? 'Updating password…' : 'Update password'}
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default ChangePassword;
