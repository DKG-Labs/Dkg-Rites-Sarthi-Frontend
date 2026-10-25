import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCode } from 'antd';
import { loginUser, verifyOtp, initiateAuthenticatorSession, checkAuthenticatorStatus, storeAuthData, isAuthenticated, getStoredUser, resetPassword, logoutUser } from '../services/authService';
import { API_BASE_URL } from '../services/apiConfig';
import { ROUTES, ROLE_LANDING_ROUTE } from '../routes';
import './LoginPage.css';

/**
 * Redesigned Login Page Component
 * Matches the requested landing page UI
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [pointerRatio, setPointerRatio] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [isFilled, setIsFilled] = useState({ userId: false, password: false, otp: false });
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [roleOptions, setRoleOptions] = useState([]);
  const [pendingUserData, setPendingUserData] = useState(null);

  // OTP Verification state
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [mfaTransactionId, setMfaTransactionId] = useState('');
  const [otpInfoMessage, setOtpInfoMessage] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // QR Authenticator (Biometric & Location verification) state
  const [showQrScreen, setShowQrScreen] = useState(false);
  const [qrPayload, setQrPayload] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [authSessionId, setAuthSessionId] = useState('');
  const [authStatus, setAuthStatus] = useState('PENDING'); // PENDING, SCANNED, AUTHENTICATED, EXPIRED, FAILED
  const [qrCountdown, setQrCountdown] = useState(180);
  const [isQrLoading, setIsQrLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [authSuccessData, setAuthSuccessData] = useState(null);
  const [qrMode, setQrMode] = useState('AUTH'); // 'AUTH' | 'DOWNLOAD'
  const apkDownloadUrl = (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    ? `${window.location.origin}/download/sarthi-authenticator.apk`
    : 'https://expo.dev/artifacts/eas/d23ebQfQAg6N6zgKwUUmTkxvLMQlyErwWSF70KnGop8.apk';
  const qrPollingRef = useRef(null);
  const qrTimerRef = useRef(null);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const heroRef = useRef(null);

  // Resend OTP countdown timer
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const slides = [
    {
      kicker: 'Automated QA Platform',
      title: 'Build quality at source.',
      highlight: 'Deliver safety on track.',
      description: 'Smart checks from material approval to final dispatch with complete digital traceability.',
      image: '/login-assets/slide1.jpg'
    },
    {
      kicker: 'Inspection Intelligence',
      title: 'Catch issues early',
      highlight: 'with real-time inspection.',
      description: 'Drive compliance decisions faster with live alerts, clear records, and accountable workflows.',
      image: '/login-assets/slide2.jpg'
    },
    {
      kicker: 'Safety Visibility',
      title: 'One platform for rails',
      highlight: 'clips, sleepers, and pads.',
      description: 'Role-based access and auditable logs keep every quality checkpoint secure and transparent.',
      image: '/login-assets/slide1.jpg'
    }
  ];

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      const currentUser = getStoredUser();

      if (!currentUser?.roleName || !currentUser?.userId) {
        logoutUser();
        return;
      }

      // Special redirection for Sleeper roles (Sleeper Process IE or Main IE)
      const roleName = currentUser?.roleName;
      if (isSleeperRole(roleName)) {
        window.location.href = '/sleeper/';
        return;
      }

      if (isRailpadRole(roleName)) {
        if (!window.location.pathname.startsWith('/railpad')) {
          window.location.href = '/railpad/';
        }
        return;
      }

      let redirectPath = ROLE_LANDING_ROUTE[roleName] || location.state?.from?.pathname || ROUTES.LANDING;
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, location]);

  // Slider Autoplay
  useEffect(() => {
    if (isInteracting) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [isInteracting, slides.length]);

  // Scroll Handler for Header Compact State
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePointerMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setPointerRatio({ x: Math.max(-0.5, Math.min(0.5, x)), y: Math.max(-0.5, Math.min(0.5, y)) });
  };

  const handlePointerLeave = () => {
    setPointerRatio({ x: 0, y: 0 });
  };

  /**
   * Unified redirection logic based on role
   */
  const handleRoleRedirection = (userData) => {
    storeAuthData(userData);

    // Special redirection for Sleeper roles
    const roleName = userData.roleName;
    if (isSleeperRole(roleName)) {
      window.location.href = '/sleeper/';
      return;
    }

    if (isRailpadRole(roleName)) {
      if (!window.location.pathname.startsWith('/railpad')) {
        window.location.href = '/railpad/';
      }
      return;
    }

    const redirectPath = ROLE_LANDING_ROUTE[roleName] || location.state?.from?.pathname || ROUTES.LANDING;
    navigate(redirectPath, { replace: true });
  };

  /**
   * Handle selection from multiple roles
   */
  const PROCESS_ROLES = new Set([
    'process ie',
    'sleeper process ie',
    'rail process ie',
    'railpad process ie',
    'erc process ie'
  ]);

  const isProcessRole = (roleToStore) =>
    String(roleToStore || '')
      .split(',')
      .some(r => PROCESS_ROLES.has(r.trim().toLowerCase()));

  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  const handleSelectRole = (selectedOption, alreadyAuthenticated = false) => {
    if (!pendingUserData) return;
    const finalUserData = { ...pendingUserData, roleName: selectedOption.roleToStore };
    setShowRoleSelection(false);
    if (!alreadyAuthenticated && isProcessRole(selectedOption.roleToStore)) {
      setPendingUserData(finalUserData);
      setShowQrScreen(true);
      startQrSession(finalUserData);
    } else {
      handleRoleRedirection(finalUserData);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');

    if (!userId.trim()) {
      setError('Please enter Username or Email');
      return;
    }
    if (!newPassword.trim()) {
      setError('Please enter New Password');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(userId, newPassword);
      setResetSuccess('Password reset successfully. You can now login.');
      setShowForgotPassword(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Process successful authentication (Direct or post-OTP verification)
   * @param {boolean} alreadyAuthenticated - true when called after QR/OTP auth; skips re-triggering QR
   */
  const processLoginSuccess = (userData, alreadyAuthenticated = false) => {
    // Handle the new list based roleName response
    const roles = Array.isArray(userData.roleName) ? userData.roleName : [userData.roleName];

    const options = [];
    const seenConsolidated = new Set();

    // Consolidate "CM", "Control Manager", "Controlling Manager" into "Controlling Manager Dashboard"
    if (roles.some(r => r === 'CM' || r === 'Control Manager' || r === 'Controlling Manager')) {
      const foundRole = roles.find(r => r === 'CM' || r === 'Control Manager' || r === 'Controlling Manager');
      options.push({
        id: 'cm_option',
        label: 'Controlling Manager Dashboard',
        description: 'Access Controlling Manager modules',
        icon: '📊',
        roleToStore: foundRole
      });
      seenConsolidated.add('CM');
      seenConsolidated.add('Control Manager');
      seenConsolidated.add('Controlling Manager');
    }

    // Handle "SBU Head" as a separate option
    if (roles.includes('SBU Head')) {
      options.push({
        id: 'sbu_head_option',
        label: 'SBU Head Dashboard',
        description: 'Access SBU Head modules',
        icon: '🏢',
        roleToStore: 'SBU Head'
      });
      seenConsolidated.add('SBU Head');
    }

    // Consolidate "IE" and "Process IE" into one "IE Dashboard" option
    // Prefer "Process IE" over "IE" so QR auth triggers correctly when both roles exist
    if (roles.some(r => r === 'IE' || r === 'Process IE')) {
      const ieRole = roles.includes('Process IE') ? 'Process IE' : 'IE';
      options.push({
        id: 'ie_option',
        label: 'IE Dashboard',
        description: 'Access IE and Process IE modules',
        icon: '🛠️',
        roleToStore: ieRole
      });
      seenConsolidated.add('IE');
      seenConsolidated.add('Process IE');
    }

    // Consolidate "RIO Help Desk" into "Call Desk Dashboard"
    if (roles.includes('RIO Help Desk')) {
      options.push({
        id: 'rio_option',
        label: 'Call Desk Dashboard',
        description: 'Access RIO Help Desk / Call Desk modules',
        icon: '📞',
        roleToStore: 'RIO Help Desk'
      });
      seenConsolidated.add('RIO Help Desk');
    }

    // Handle Sleeper Roles
    if (roles.some(r => r === 'Sleeper Process IE' || r === 'Main IE')) {
      options.push({
        id: 'sleeper_option',
        label: 'Sleeper Dashboard',
        description: 'Access Sleeper Process modules',
        icon: '🚄',
        roleToStore: roles.includes('Main IE') ? 'Main IE' : 'Sleeper Process IE'
      });
      seenConsolidated.add('Sleeper Process IE');
      seenConsolidated.add('Main IE');
    }

    // Handle Railpad Role
    if (roles.some(r => r === 'Railpad IE' || r === 'Rail Process IE' || r === 'Rail Main IE')) {
      const isProcessOnly = roles.includes('Rail Process IE') && !roles.includes('Railpad IE') && !roles.includes('Rail Main IE');
      const isDual = (roles.includes('Rail Main IE') || roles.includes('Main IE')) && (roles.includes('Rail Process IE') || roles.includes('Process IE'));
      const railpadRoles = roles.filter(r => r === 'Railpad IE' || r === 'Rail Process IE' || r === 'Rail Main IE');

      options.push({
        id: 'railpad_option',
        label: isDual ? 'Railpad Main & Process IE Dashboard' : (isProcessOnly ? 'Railpad Process IE Dashboard' : 'Railpad Dashboard'),
        description: isDual ? 'Access Railpad Main IE & Process IE modules' : (isProcessOnly ? 'Access Railpad Process IE platform' : 'Access Railpad IE modules'),
        icon: '🛤️',
        roleToStore: (railpadRoles.length > 0 ? railpadRoles : ['Railpad IE']).join(',')
      });
      seenConsolidated.add('Railpad IE');
      seenConsolidated.add('Rail Process IE');
      seenConsolidated.add('Rail Main IE');
    }

    // Handle any other roles that aren't part of the specific consolidation requirement
    roles.forEach(r => {
      if (!seenConsolidated.has(r) && r) {
        let label = `${r} Dashboard`;
        let description = `Access ${r} platform`;
        let icon = '👤';
        if (r === 'Rites Admin' || r === 'Rites ADMin') {
          label = 'Railway Board Dashboard';
          description = 'Access Railway Board Dashboard as Administrator';
          icon = '🛤️';
        } else if (r === 'RAILWAY_BOARD' || r === 'ZONAL RAILWAY' || r === 'Zonal Railway') {
          label = 'Railway Board Dashboard';
          description = 'Access Railway Board Dashboard';
          icon = '🛤️';
        }
        options.push({
          id: r,
          label: label,
          description: description,
          icon: icon,
          roleToStore: r
        });
      }
    });

    if (options.length > 1) {
      // Multiple valid dashboard options found, show selection UI
      setRoleOptions(options);
      setPendingUserData(userData);
      setShowRoleSelection(true);
    } else if (options.length === 1) {
      // Single option - check if process role needs authenticator (skip if already post-QR)
      userData.roleName = options[0].roleToStore;
      if (!alreadyAuthenticated && isProcessRole(options[0].roleToStore)) {
        setPendingUserData(userData);
        setShowQrScreen(true);
        startQrSession(userData);
      } else {
        handleRoleRedirection(userData);
      }
    } else {
      // No roles found or fallback for existing behavior if list is empty
      handleRoleRedirection(userData);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');

    if (!userId.trim()) {
      setError('Please enter User ID');
      return;
    }
    if (!password.trim()) {
      setError('Please enter Password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginUser(userId, password);

      // Check if MFA OTP is required
      if (response && response.mfaRequired) {
        setMfaTransactionId(response.transactionId);
        setOtpInfoMessage(response.message || 'OTP sent to your registered mobile number.');
        setShowOtpScreen(true);
        setResendCountdown(30);
        setOtpValue('');
        return;
      }

      // Direct login (if non-MFA or hardcoded user)
      processLoginSuccess(response);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup QR polling & timers on unmount
  useEffect(() => {
    return () => {
      if (qrPollingRef.current) clearInterval(qrPollingRef.current);
      if (qrTimerRef.current) clearInterval(qrTimerRef.current);
    };
  }, []);

  const startQrSession = async (userData) => {
    setIsQrLoading(true);
    setError('');
    setAuthStatus('PENDING');
    setAuthSuccessData(null);
    try {
      const res = await initiateAuthenticatorSession(
        userData.userId || userId,
        userData.userName || '',
        mfaTransactionId || ''
      );
      setAuthSessionId(res.sessionId);
      let payloadToUse = res.qrData;
      try {
        const parsed = JSON.parse(res.qrData);
        // Inject serverUrl into QR payload so the mobile app knows where to send verification.
        // When running locally, use the localtunnel public URL (bypasses Windows Firewall on LAN).
        if (!parsed.serverUrl) {
          if (API_BASE_URL && !API_BASE_URL.includes('localhost') && !API_BASE_URL.includes('127.0.0.1')) {
            // Production/Azure: use API_BASE_URL directly
            parsed.serverUrl = API_BASE_URL;
          } else {
            // Local dev: use localtunnel so phone can reach the PC backend
            parsed.serverUrl = 'https://sarthi-auth.loca.lt/sarthi-backend';
          }
          payloadToUse = JSON.stringify(parsed);
        }
      } catch (e) {
        // use raw qrData
      }
      setQrPayload(payloadToUse);
      setQrCountdown(res.expiresInSeconds || 180);

      // Start countdown
      if (qrTimerRef.current) clearInterval(qrTimerRef.current);
      qrTimerRef.current = setInterval(() => {
        setQrCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(qrTimerRef.current);
            setAuthStatus('EXPIRED');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start polling status
      if (qrPollingRef.current) clearInterval(qrPollingRef.current);
      qrPollingRef.current = setInterval(async () => {
        try {
          const statusRes = await checkAuthenticatorStatus(res.sessionId);
          if (statusRes.status === 'AUTHENTICATED') {
            clearInterval(qrPollingRef.current);
            clearInterval(qrTimerRef.current);
            setAuthStatus('AUTHENTICATED');
            setAuthSuccessData(statusRes);
            setTimeout(() => {
              setShowQrScreen(false);
              processLoginSuccess(userData, true);
            }, 1200);
          } else if (statusRes.status === 'SCANNED') {
            setAuthStatus('SCANNED');
          } else if (statusRes.status === 'EXPIRED') {
            clearInterval(qrPollingRef.current);
            clearInterval(qrTimerRef.current);
            setAuthStatus('EXPIRED');
          }
        } catch (pollErr) {
          console.warn('Authenticator poll error:', pollErr);
        }
      }, 2000);

    } catch (err) {
      setError(err.message || 'Failed to start authenticator session');
      setAuthStatus('FAILED');
    } finally {
      setIsQrLoading(false);
    }
  };

  const handleRefreshQr = () => {
    if (pendingUserData) {
      startQrSession(pendingUserData);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!otpValue.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const userData = await verifyOtp(mfaTransactionId, otpValue);
      userData.loginId = userId;
      setShowOtpScreen(false);
      setPendingUserData(userData);
      processLoginSuccess(userData, false);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isLoading) return;
    setError('');
    setIsLoading(true);
    try {
      const response = await loginUser(userId, password);
      if (response && response.transactionId) {
        setMfaTransactionId(response.transactionId);
        setOtpInfoMessage(response.message || 'New OTP sent to your registered mobile number.');
        setResendCountdown(30);
        setResetSuccess('OTP resent successfully.');
      }
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    if (qrPollingRef.current) clearInterval(qrPollingRef.current);
    if (qrTimerRef.current) clearInterval(qrTimerRef.current);
    setShowOtpScreen(false);
    setShowQrScreen(false);
    setOtpValue('');
    setError('');
    setResetSuccess('');
  };

  const handleInputChange = (field, value) => {
    if (field === 'userId') {
      setUserId(value);
      setIsFilled({ ...isFilled, userId: value.length > 0 });
    } else if (field === 'password') {
      setPassword(value);
      setIsFilled({ ...isFilled, password: value.length > 0 });
    } else if (field === 'otp') {
      // Numbers only, max 6 digits
      const cleaned = value.replace(/\D/g, '').slice(0, 6);
      setOtpValue(cleaned);
      setIsFilled({ ...isFilled, otp: cleaned.length > 0 });
    }
  };

  const parallaxX = pointerRatio.x * 16;
  const scrollShift = Math.max(-16, Math.min(22, -scrollY * 0.08));
  const parallaxY = scrollShift + (pointerRatio.y * 12);

  return (
    <div className="login-redesign-wrapper">
      <header className={`site-header ${scrollY > 8 ? 'is-compact' : ''}`} id="siteHeader">
        <div className="header-shell">
          <a className="brand" href="#home" aria-label="SARTHI home">
            <span className="brand-mark" aria-hidden="true">
              <img className="brand-rites-logo" src="/logo-sarthi.png" alt="SARTHI logo" />
            </span>
            <span className="brand-text">
              <span className="brand-title-row">
                <span className="brand-title">SARTHI</span>
              </span>
              <span className="brand-fullform">System for Automated Review Tracking &amp; Holistic Inspection</span>
            </span>
          </a>
        </div>
      </header>

      <main>
        <section
          className="hero"
          id="home"
          aria-label="SARTHI hero slider"
          ref={heroRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <div
            className="hero-slider"
            id="heroSlider"
            aria-live="polite"
            aria-atomic="true"
            onMouseEnter={() => setIsInteracting(true)}
            onMouseLeave={() => setIsInteracting(false)}
          >
            {slides.map((slide, index) => (
              <article
                key={index}
                className={`hero-slide ${index === currentSlide ? 'is-active' : ''}`}
                aria-hidden={index !== currentSlide}
                style={{ zIndex: index === currentSlide ? 2 : 1 }}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  style={{
                    '--parallax-x': `${index === currentSlide ? parallaxX : 0}px`,
                    '--parallax-y': `${index === currentSlide ? parallaxY : 0}px`
                  }}
                />
              </article>
            ))}
          </div>

          <div className="hero-overlay" aria-hidden="true"></div>

          <div className="hero-content-shell">
            <div className="hero-grid">
              <article className="hero-copy-card is-revealed reveal-up" id="overview">
                <p className="slide-kicker">{slides[currentSlide].kicker}</p>
                <h1 className="slide-title">
                  {slides[currentSlide].title}
                  <span> {slides[currentSlide].highlight}</span>
                </h1>
                <p className="slide-description">
                  {slides[currentSlide].description}
                </p>
              </article>

              <aside className="dashboard-panel is-revealed" id="dashboardPanel">
                {/* Branding Section */}
                <header className="branding-section">
                  <div className="branding-logo-box">
                    <img className="branding-logo-img" src="/logo-sarthi.png" alt="SARTHI logo" />
                  </div>
                  <h2 className="branding-title">SARTHI</h2>
                  <p className="branding-tagline">System for Automated Review Tracking &amp; Holistic Inspection</p>
                </header>

                <div className="dashboard-login-chip">
                  {showRoleSelection ? 'SELECT ROLE' : showQrScreen ? 'AUTHENTICATOR' : showOtpScreen ? 'VERIFY OTP' : 'LOGIN'}
                </div>

                {showRoleSelection ? (
                  <div className="role-selection-container">
                    <p className="role-selection-hint">More than one workspace is associated with your account. Please select a dashboard to continue.</p>
                    <div className="role-options-grid">
                      {roleOptions.map(option => (
                        <button
                          key={option.id}
                          className="role-option-card"
                          onClick={() => handleSelectRole(option)}
                        >
                          <div className="role-option-icon">{option.icon}</div>
                          <div className="role-option-info">
                            <span className="role-option-label">{option.label}</span>
                            <span className="role-option-desc">{option.description}</span>
                          </div>
                          <div className="role-option-arrow">→</div>
                        </button>
                      ))}
                    </div>
                    <button
                      className="role-back-btn"
                      onClick={() => setShowRoleSelection(false)}
                    >
                      ← Back to Login
                    </button>
                  </div>
                ) : showQrScreen ? (
                  <div className="dashboard-form authenticator-qr-container" style={{ marginTop: '0.2rem', textAlign: 'center', width: '100%' }}>
                    <div className="form-header" style={{ marginBottom: '0.75rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        border: '1.5px solid #bfdbfe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 6px',
                        boxShadow: '0 3px 10px rgba(37, 99, 235, 0.15)'
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                          <circle cx="12" cy="11" r="3"></circle>
                          <path d="M12 14v3"></path>
                        </svg>
                      </div>
                      <h2 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0f2246', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                        SARTHI Authenticator
                      </h2>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 auto', maxWidth: '300px', lineHeight: '1.4' }}>
                        {qrMode === 'DOWNLOAD'
                          ? 'Scan with your Phone Camera to download and install the app.'
                          : 'Scan with SARTHI Authenticator App to verify your live GPS location and selfie.'}
                      </p>
                    </div>

                    {error && <div className="error-banner" style={{ padding: '6px 10px', fontSize: '0.78rem', marginBottom: '0.65rem' }}>{error}</div>}

                    {/* Mode Switcher: Login QR vs Download App QR */}
                    <div className="qr-mode-switcher" style={{
                      display: 'inline-flex',
                      background: '#f1f5f9',
                      padding: '3px',
                      borderRadius: '24px',
                      border: '1px solid #cbd5e1',
                      margin: '0 auto 0.75rem',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      <button
                        type="button"
                        onClick={() => setQrMode('AUTH')}
                        style={{
                          padding: '5px 14px',
                          fontSize: '0.74rem',
                          fontWeight: '700',
                          borderRadius: '20px',
                          border: 'none',
                          cursor: 'pointer',
                          background: qrMode === 'AUTH' ? '#ffffff' : 'transparent',
                          color: qrMode === 'AUTH' ? '#0f2246' : '#64748b',
                          boxShadow: qrMode === 'AUTH' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        🔐 Scan to Login
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrMode('DOWNLOAD')}
                        style={{
                          padding: '5px 14px',
                          fontSize: '0.74rem',
                          fontWeight: '700',
                          borderRadius: '20px',
                          border: 'none',
                          cursor: 'pointer',
                          background: qrMode === 'DOWNLOAD' ? '#2563eb' : 'transparent',
                          color: qrMode === 'DOWNLOAD' ? '#ffffff' : '#64748b',
                          boxShadow: qrMode === 'DOWNLOAD' ? '0 2px 6px rgba(37,99,235,0.25)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        📲 Scan to Download App
                      </button>
                    </div>

                    {/* QR Code Container */}
                    <div className="qr-box" style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      border: qrMode === 'DOWNLOAD' ? '2px solid #3b82f6' : authStatus === 'AUTHENTICATED' ? '2px solid #22c55e' : '1.5px solid #e2e8f0',
                      boxShadow: '0 8px 24px rgba(15, 34, 70, 0.08)',
                    }}>
                      {qrMode === 'DOWNLOAD' ? (
                        <>
                          <QRCode
                            value={apkDownloadUrl}
                            size={180}
                            bordered={false}
                          />
                          <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#2563eb', marginTop: '6px' }}>
                            📥 Scan with Phone Camera
                          </span>
                        </>
                      ) : authStatus === 'AUTHENTICATED' ? (
                        <div style={{ width: '180px', height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: '#dcfce7',
                            border: '2px solid #22c55e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '8px'
                          }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#16a34a' }}>Authenticated!</span>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Unlocking dashboard...</span>
                        </div>
                      ) : (
                        <QRCode
                          value={qrPayload || 'https://ritesqasarthi.com'}
                          size={180}
                          bordered={false}
                          status={authStatus === 'EXPIRED' ? 'expired' : (isQrLoading ? 'loading' : 'active')}
                          onRefresh={handleRefreshQr}
                        />
                      )}
                    </div>

                    {/* Status Pill */}
                    <div className="qr-status-pill" style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '7px 12px',
                      background: qrMode === 'DOWNLOAD'
                        ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
                        : authStatus === 'AUTHENTICATED'
                        ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
                        : authStatus === 'SCANNED'
                        ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
                        : authStatus === 'EXPIRED'
                        ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      border: qrMode === 'DOWNLOAD'
                        ? '1px solid #93c5fd'
                        : authStatus === 'AUTHENTICATED'
                        ? '1px solid #86efac'
                        : authStatus === 'SCANNED'
                        ? '1px solid #93c5fd'
                        : authStatus === 'EXPIRED'
                        ? '1px solid #fca5a5'
                        : '1px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      color: qrMode === 'DOWNLOAD'
                        ? '#1d4ed8'
                        : authStatus === 'AUTHENTICATED'
                        ? '#15803d'
                        : authStatus === 'SCANNED'
                        ? '#1d4ed8'
                        : authStatus === 'EXPIRED'
                        ? '#b91c1c'
                        : '#475569',
                      marginBottom: '0.75rem'
                    }}>
                      {qrMode === 'DOWNLOAD' ? (
                        <span>📲 Open Camera or Google Lens to download APK</span>
                      ) : authStatus === 'AUTHENTICATED' ? (
                        <span>Verified! Proceeding to Dashboard...</span>
                      ) : authStatus === 'SCANNED' ? (
                        <span>Mobile connected! Submitting location & selfie...</span>
                      ) : authStatus === 'EXPIRED' ? (
                        <span>QR Expired. Click to refresh.</span>
                      ) : (
                        <span>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb', marginRight: '6px', animation: 'pulse 1.5s infinite' }}></span>
                          Waiting for scan... (Expires in <strong>{`${Math.floor(qrCountdown / 60)}:${qrCountdown % 60 < 10 ? '0' : ''}${qrCountdown % 60}`}</strong>)
                        </span>
                      )}
                    </div>

                    {/* Instruction Box */}
                    {qrMode === 'DOWNLOAD' ? (
                      <div className="qr-instruction-box" style={{
                        textAlign: 'left',
                        padding: '8px 12px',
                        background: 'rgba(239, 246, 255, 0.85)',
                        borderRadius: '10px',
                        border: '1px solid #bfdbfe',
                        fontSize: '0.72rem',
                        color: '#1e3a8a',
                        marginBottom: '0.85rem'
                      }}>
                        <div style={{ fontWeight: 800, color: '#1e40af', marginBottom: '4px' }}>How to Install:</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{ color: '#2563eb', fontWeight: '800' }}>1.</span> Open normal <strong>Phone Camera</strong> or <strong>Google Lens</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{ color: '#2563eb', fontWeight: '800' }}>2.</span> Point at QR code & tap the download prompt
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#2563eb', fontWeight: '800' }}>3.</span> Tap "Install", then click <strong>"Scan to Login"</strong> above
                        </div>
                        <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #93c5fd', textAlign: 'center' }}>
                          <a
                            href="/download/sarthi-authenticator.apk"
                            download="sarthi-authenticator.apk"
                            style={{
                              color: '#1d4ed8',
                              fontWeight: '700',
                              textDecoration: 'none',
                              fontSize: '0.72rem'
                            }}
                          >
                            💻 Or click here to download APK file directly on PC
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="qr-instruction-box" style={{
                        textAlign: 'left',
                        padding: '8px 12px',
                        background: 'rgba(248, 250, 252, 0.85)',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.72rem',
                        color: '#475569',
                        marginBottom: '0.85rem'
                      }}>
                        <div style={{ fontWeight: 800, color: '#0f2246', marginBottom: '4px' }}>Steps to Authenticate:</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{ color: '#2563eb', fontWeight: '800' }}>1.</span> Open <strong>SARTHI Authenticator</strong> app on phone
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{ color: '#2563eb', fontWeight: '800' }}>2.</span> Scan the QR code displayed above
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#2563eb', fontWeight: '800' }}>3.</span> Allow GPS location & take a live selfie
                        </div>
                        <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setQrMode('DOWNLOAD')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#2563eb',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.72rem',
                              padding: 0
                            }}
                          >
                            📲 <u>Don't have the app? Scan Download QR</u>
                          </button>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                      {qrMode === 'DOWNLOAD' ? (
                        <button
                          type="button"
                          onClick={() => setQrMode('AUTH')}
                          style={{
                            background: '#2563eb',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontSize: '0.76rem',
                            fontWeight: '700',
                            color: '#ffffff',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
                          }}
                        >
                          🔐 Switch to Login QR
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRefreshQr}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '0.76rem',
                            fontWeight: '700',
                            color: '#334155',
                            cursor: 'pointer'
                          }}
                        >
                          🔄 Refresh QR
                        </button>
                      )}
                      {isLocalhost && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowQrScreen(false);
                            processLoginSuccess(pendingUserData, true);
                          }}
                          style={{
                            background: '#fef3c7',
                            border: '1px solid #fcd34d',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '0.76rem',
                            fontWeight: '700',
                            color: '#92400e',
                            cursor: 'pointer'
                          }}
                          title="Skip authenticator (available on localhost only)"
                        >
                          ⚡ Skip (Dev Mode)
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleBackToLogin}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          fontSize: '0.76rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        ← Back to Login
                      </button>
                    </div>
                  </div>
                ) : showOtpScreen ? (
                  <form className="dashboard-form otp-verification-form" onSubmit={handleOtpSubmit} style={{ marginTop: '0.25rem' }}>
                    <div className="form-header" style={{ textAlign: 'center', marginBottom: '0.85rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        border: '1px solid #bfdbfe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 6px',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.12)'
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </div>
                      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f2246', margin: '0 0 4px', letterSpacing: '-0.01em' }}>Two-Factor Verification</h2>
                      <div style={{
                        marginTop: '4px',
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.95) 0%, rgba(219, 234, 254, 0.9) 100%)',
                        border: '1px solid #bfdbfe',
                        borderRadius: '10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(37, 99, 235, 0.08)'
                      }}>
                        <span style={{ fontSize: '0.85rem' }}>📱</span>
                        <p style={{
                          fontSize: '0.78rem',
                          color: '#1e3a8a',
                          fontWeight: '600',
                          lineHeight: '1.35',
                          margin: 0
                        }}>
                          {otpInfoMessage ? (
                            otpInfoMessage.includes('ending with') ? (
                              <span>
                                {otpInfoMessage.split('ending with')[0]} ending with{' '}
                                <strong style={{ 
                                  color: '#1d4ed8', 
                                  fontWeight: '800', 
                                  background: '#ffffff', 
                                  padding: '2px 6px', 
                                  borderRadius: '6px', 
                                  border: '1px solid #93c5fd',
                                  letterSpacing: '0.04em',
                                  display: 'inline-block'
                                }}>
                                  {otpInfoMessage.split('ending with')[1].replace('.', '')}
                                </strong>
                              </span>
                            ) : (
                              otpInfoMessage
                            )
                          ) : (
                            'Enter the 6-digit OTP sent to your registered mobile number.'
                          )}
                        </p>
                      </div>
                    </div>

                    {error && <div className="error-banner" style={{ padding: '6px 10px', fontSize: '0.78rem', marginBottom: '0.65rem' }}>{error}</div>}
                    {resetSuccess && <div className="error-banner" style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9', padding: '6px 10px', fontSize: '0.78rem', marginBottom: '0.65rem' }}>{resetSuccess}</div>}

                    {/* 6-Digit Pin Input Grid */}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '8px',
                        margin: '0 auto 4px',
                        maxWidth: '290px'
                      }}>
                        {[0, 1, 2, 3, 4, 5].map((index) => {
                          const digit = otpValue[index] || '';
                          const isFocused = otpValue.length === index || (index === 5 && otpValue.length === 6);
                          return (
                            <div
                              key={index}
                              onClick={() => {
                                const input = document.getElementById('hiddenOtpInput');
                                if (input) input.focus();
                              }}
                              style={{
                                width: '38px',
                                height: '44px',
                                borderRadius: '10px',
                                background: digit ? 'rgba(255, 255, 255, 0.95)' : 'rgba(248, 250, 252, 0.85)',
                                border: digit 
                                  ? '2px solid #2563eb' 
                                  : isFocused 
                                    ? '2px solid #3b82f6' 
                                    : '1.5px solid #cbd5e1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                fontWeight: '800',
                                color: '#0f2246',
                                cursor: 'text',
                                boxShadow: digit 
                                  ? '0 3px 8px rgba(37, 99, 235, 0.15)' 
                                  : '0 1px 3px rgba(0, 0, 0, 0.02)',
                                transition: 'all 0.15s ease',
                                transform: digit ? 'scale(1.03)' : 'scale(1)'
                              }}
                            >
                              {digit}
                            </div>
                          );
                        })}
                      </div>

                      {/* Hidden actual input for accessibility, mobile keypad and paste */}
                      <input
                        type="text"
                        id="hiddenOtpInput"
                        name="otp"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="one-time-code"
                        maxLength={6}
                        autoFocus
                        value={otpValue}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                          setOtpValue(val);
                          setIsFilled((prev) => ({ ...prev, otp: Boolean(val) }));
                        }}
                        style={{
                          position: 'absolute',
                          opacity: 0,
                          pointerEvents: 'none',
                          width: '1px',
                          height: '1px'
                        }}
                      />
                    </div>

                    {/* Resend OTP Bar */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 10px',
                      background: 'rgba(241, 245, 249, 0.85)',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.78rem',
                      marginBottom: '0.85rem'
                    }}>
                      <span style={{ color: '#475569', fontWeight: '600' }}>
                        {resendCountdown > 0 ? (
                          <span>Resend in: <strong style={{ color: '#2563eb', fontFamily: 'monospace', fontSize: '0.88rem' }}>{`00:${resendCountdown < 10 ? '0' : ''}${resendCountdown}`}</strong></span>
                        ) : (
                          <span>Didn't receive code?</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resendCountdown > 0 || isLoading}
                        style={{
                          background: resendCountdown > 0 ? 'transparent' : '#2563eb',
                          color: resendCountdown > 0 ? '#94a3b8' : '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontWeight: '700',
                          fontSize: '0.75rem',
                          cursor: resendCountdown > 0 ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: resendCountdown > 0 ? 'none' : '0 2px 4px rgba(37, 99, 235, 0.2)'
                        }}
                      >
                        {isLoading ? 'Sending...' : 'Resend OTP'}
                      </button>
                    </div>

                    {/* Verify & Log In Button */}
                    <button
                      type="submit"
                      disabled={isVerifyingOtp || otpValue.length !== 6}
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: '10px',
                        border: 'none',
                        background: otpValue.length === 6 && !isVerifyingOtp
                          ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)'
                          : '#cbd5e1',
                        color: '#ffffff',
                        fontSize: '0.92rem',
                        fontWeight: '800',
                        letterSpacing: '0.01em',
                        cursor: otpValue.length === 6 && !isVerifyingOtp ? 'pointer' : 'not-allowed',
                        boxShadow: otpValue.length === 6 && !isVerifyingOtp
                          ? '0 4px 12px rgba(37, 99, 235, 0.3)'
                          : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isVerifyingOtp ? 'Verifying OTP...' : 'Verify & Log In'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={handleBackToLogin}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        ← Back to Login
                      </button>
                    </div>
                  </form>
                ) : showForgotPassword ? (
                  <form className="dashboard-form forgot-password-form" onSubmit={handleForgotPasswordSubmit}>
                    <div className="form-header">
                      <h2>Reset Password</h2>
                      <p>Enter your details to change your password</p>
                    </div>

                    {error && <div className="error-banner">{error}</div>}

                    <div className="form-group">
                      <label htmlFor="userId">Username or Employee Code</label>
                      <div className="input-field-shell">
                        <input
                          type="text"
                          id="userId"
                          placeholder="Enter username or employee code"
                          value={userId}
                          onChange={(e) => setUserId(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword">New Password</label>
                      <div className="input-field-shell">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="newPassword"
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="password-toggle-redesign"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm Password</label>
                      <div className="input-field-shell">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="password-toggle-redesign"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      className="submit-btn js-ripple"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                    
                    <div className="dashboard-options" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                      <button type="button" className="forgot-link" onClick={() => { setShowForgotPassword(false); setError(''); setResetSuccess(''); }}>Back to Login</button>
                    </div>
                  </form>
                ) : (
                  <form className="dashboard-form" onSubmit={handleSubmit}>
                    <div className="form-header" style={{ display: 'none' }}>
                    </div>

                    {error && <div className="error-banner">{error}</div>}
                    {resetSuccess && <div className="error-banner" style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9' }}>{resetSuccess}</div>}

                    <div className="form-group">
                      <label htmlFor="username">Username or Email</label>
                      <div className="input-field-shell">
                        <span className="input-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                            <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.1 0-8 2.1-8 5v1h16v-1c0-2.9-3.9-5-8-5Z"></path>
                          </svg>
                        </span>
                        <input
                          type="text"
                          id="username"
                          name="username"
                          placeholder="Enter your username or email"
                          className={isFilled.userId ? 'is-filled' : ''}
                          value={userId}
                          onChange={(e) => handleInputChange('userId', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="password">Password</label>
                      <div className="input-field-shell">
                        <span className="input-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                            <path d="M17 9h-1V7a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4Zm2 10.75A1.75 1.75 0 1 1 13.75 16 1.75 1.75 0 0 1 12 17.75Z"></path>
                          </svg>
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          placeholder="Enter your password"
                          className={isFilled.password ? 'is-filled' : ''}
                          value={password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="password-toggle-redesign"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <div className="dashboard-options">
                      <label className="remember-me" htmlFor="rememberMe">
                        <input type="checkbox" id="rememberMe" name="rememberMe" />
                        <span>Remember me</span>
                      </label>
                      <button type="button" className="forgot-link" onClick={(e) => { e.preventDefault(); setShowForgotPassword(true); setError(''); setResetSuccess(''); }}>Forgot password?</button>
                    </div>

                    <button
                      type="submit"
                      className="submit-btn js-ripple"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
                )}
              </aside>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

/**
 * Helper to identify if a role belongs to the Sleeper Dashboard
 * Added at the bottom for better code readability as requested
 */
const isSleeperRole = (role) => {
  if (!role) return false;
  // If it's a Rail-related role, it belongs to Railpad, not Sleeper
  if (typeof role === 'string' && role.includes('Rail')) return false;

  const sleeperRoles = ['Sleeper Process IE', 'Main IE'];
  return sleeperRoles.some(r =>
    role === r || (typeof role === 'string' && role.includes(r))
  );
};

/**
 * Helper to identify if a role belongs to the Railpad Dashboard
 */
const isRailpadRole = (role) => {
  if (!role) return false;
  const railpadRoles = ['Railpad IE', 'Rail Process IE', 'Rail Main IE'];
  return railpadRoles.some(r =>
    role === r || (typeof role === 'string' && role.includes(r))
  );
};

export default LoginPage;


