import { useState, useEffect, useRef } from 'react';
import { loginUser, storeAuthData, isAuthenticated, sendForgotPasswordOtp, resetPassword } from '../services/authService';
import { fetchMappedPlantIds } from '../services/workflowService';
import './LoginPage.css';

/**
 * Redesigned Login Page Component for Rites-Sleeper
 * Matches the Sarthi landing page UI
 */
const LoginPage = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loginType] = useState('IE');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState('ID'); // 'ID' or 'OTP'
  const [forgotOtpValue, setForgotOtpValue] = useState('');
  const [forgotTransactionId, setForgotTransactionId] = useState('');
  const [forgotResendCountdown, setForgotResendCountdown] = useState(0);
  const [forgotOtpNotice, setForgotOtpNotice] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Resend OTP countdown for Forgot Password
  useEffect(() => {
    let timer;
    if (forgotResendCountdown > 0) {
      timer = setInterval(() => {
        setForgotResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [forgotResendCountdown]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [pointerRatio, setPointerRatio] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [isFilled, setIsFilled] = useState({ userId: false, password: false });

  const heroRef = useRef(null);

  const slides = [
    {
      kicker: 'Automated QA Platform',
      title: 'Build quality at source.',
      highlight: 'Deliver safety on track.',
      description: 'Smart checks from material approval to final dispatch with complete digital traceability.',
      image: '/login-assets/WhatsApp Image 2026-02-18 at 5.29.08 PM.jpeg'
    },
    {
      kicker: 'Inspection Intelligence',
      title: 'Catch issues early',
      highlight: 'with real-time inspection.',
      description: 'Drive compliance decisions faster with live alerts, clear records, and accountable workflows.',
      image: '/login-assets/WhatsApp Image 2026-02-18 at 5.29.08 PM (1).jpeg'
    },
    {
      kicker: 'Safety Visibility',
      title: 'One platform for rails',
      highlight: 'clips, sleepers, and pads.',
      description: 'Role-based access and auditable logs keep every quality checkpoint secure and transparent.',
      image: '/login-assets/WhatsApp Image 2026-02-18 at 5.29.08 PM.jpeg'
    }
  ];

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      window.location.reload();
    }
  }, []);

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

  const isVendorIdentifier = (id) => {
    if (!id) return false;
    const clean = String(id).trim().toLowerCase();
    return clean.startsWith(':') || clean.startsWith('ven_') || clean.startsWith('vendor');
  };

  const handleSendForgotOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setResetSuccess('');

    if (!userId.trim()) {
      setError('Please enter your Employee Code or Username');
      return;
    }

    if (isVendorIdentifier(userId)) {
      setError('Forgot password is only available for IE (Inspection Engineers). Vendors cannot reset password here. Please contact administrator.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendForgotPasswordOtp(userId.trim());
      setForgotTransactionId(res?.transactionId || '');
      setForgotOtpValue('');
      setForgotResendCountdown(30);
      setForgotOtpNotice(res?.noticeMessage || 'OTP sent to your registered mobile number.');
      setForgotPasswordStep('OTP');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please verify your Employee Code or Username.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');

    if (isVendorIdentifier(userId)) {
      setError('Forgot password is only available for IE (Inspection Engineers). Vendors cannot reset password here.');
      return;
    }

    if (!forgotOtpValue.trim() || forgotOtpValue.trim().length !== 6) {
      setError('Please enter the 6-digit OTP sent to your registered mobile number.');
      return;
    }

    if (!newPassword.trim()) {
      setError('Please enter New Password');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(userId.trim(), newPassword, forgotTransactionId, forgotOtpValue.trim());
      setResetSuccess('Password reset successfully! You can now login with your new password.');
      setShowForgotPassword(false);
      setForgotPasswordStep('ID');
      setNewPassword('');
      setConfirmPassword('');
      setForgotOtpValue('');
      setForgotTransactionId('');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
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
      const userData = await loginUser(userId, password, loginType);
      storeAuthData(userData);
      
      try {
        await fetchMappedPlantIds(userData.userId, 'Main IE');
      } catch (cacheErr) {
        console.error('Failed to pre-cache mapped plant IDs', cacheErr);
      }

      window.location.reload();
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'userId') {
      setUserId(value);
      setIsFilled({ ...isFilled, userId: value.length > 0 });
    } else if (field === 'password') {
      setPassword(value);
      setIsFilled({ ...isFilled, password: value.length > 0 });
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
                  LOGIN
                </div>

                {showForgotPassword ? (
                  <form className="dashboard-form" id="forgotPasswordForm" onSubmit={forgotPasswordStep === 'ID' ? handleSendForgotOtp : handleForgotPasswordSubmit}>
                    <div className="form-header" style={{marginBottom: '20px'}}>
                      <h2 style={{fontSize: '1.25rem', color: '#1a1a1a'}}>{forgotPasswordStep === 'ID' ? 'Forgot Password (IE Portal)' : 'Verify OTP & Reset Password'}</h2>
                      <p style={{fontSize: '0.875rem', color: '#666'}}>{forgotPasswordStep === 'ID' ? 'Enter your Employee Code to receive an OTP' : 'Enter the OTP sent to your mobile and your new password'}</p>
                    </div>

                    {error && (
                      <div className="login-error-toast">
                        <span>⚠️ {error}</span>
                      </div>
                    )}
                    {resetSuccess && (
                      <div className="login-error-toast" style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9' }}>
                        <span>✓ {resetSuccess}</span>
                      </div>
                    )}

                    {forgotPasswordStep === 'ID' ? (
                      <>
                        <div className="form-group">
                          <label htmlFor="username">Username or Employee Code</label>
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
                              placeholder="Enter your Employee Code (e.g. 100412)"
                              className={isFilled.userId ? 'is-filled' : ''}
                              value={userId}
                              onChange={(e) => handleInputChange('userId', e.target.value)}
                              required
                              autoFocus
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="submit-btn js-ripple"
                          disabled={isLoading}
                        >
                          Send Verification OTP
                        </button>

                        <div className="dashboard-options" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                          <button
                            type="button"
                            className="forgot-link"
                            onClick={() => {
                              setShowForgotPassword(false);
                              setForgotPasswordStep('ID');
                              setError('');
                              setResetSuccess('');
                            }}
                          >
                            Back to Login
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{
                          margin: '8px 0 16px',
                          padding: '10px 14px',
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          borderRadius: '10px',
                          fontSize: '0.85rem',
                          color: '#1e40af',
                          lineHeight: '1.4',
                          fontWeight: '600'
                        }}>
                          📱 {forgotOtpNotice}
                        </div>

                        <div className="form-group">
                          <label htmlFor="forgotOtp">Enter 6-Digit OTP</label>
                          <div className="input-field-shell">
                            <input
                              type="text"
                              id="forgotOtp"
                              maxLength={6}
                              placeholder="------"
                              value={forgotOtpValue}
                              onChange={(e) => setForgotOtpValue(e.target.value.replace(/\D/g, ''))}
                              style={{ letterSpacing: '8px', fontSize: '1.2rem', fontWeight: '800', textAlign: 'center' }}
                              autoFocus
                              required
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', fontSize: '0.82rem' }}>
                          <span style={{ color: '#64748b' }}>
                            {forgotResendCountdown > 0 ? `Resend OTP in ${forgotResendCountdown}s` : "Didn't receive OTP?"}
                          </span>
                          <button
                            type="button"
                            onClick={handleSendForgotOtp}
                            disabled={forgotResendCountdown > 0}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: forgotResendCountdown > 0 ? '#94a3b8' : '#2563eb',
                              fontWeight: '700',
                              cursor: forgotResendCountdown > 0 ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Resend OTP
                          </button>
                        </div>

                        <div className="form-group">
                          <label htmlFor="newPassword">New Password</label>
                          <div className="input-field-shell">
                            <span className="input-icon" aria-hidden="true">
                              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                                <path d="M17 9h-1V7a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4Zm2 10.75A1.75 1.75 0 1 1 13.75 16 1.75 1.75 0 0 1 12 17.75Z"></path>
                              </svg>
                            </span>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              id="newPassword"
                              placeholder="Enter new password (min. 6 chars)"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="confirmPassword">Confirm Password</label>
                          <div className="input-field-shell">
                            <span className="input-icon" aria-hidden="true">
                              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                                <path d="M17 9h-1V7a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4Zm2 10.75A1.75 1.75 0 1 1 13.75 16 1.75 1.75 0 0 1 12 17.75Z"></path>
                              </svg>
                            </span>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              id="confirmPassword"
                              placeholder="Confirm new password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="dashboard-options">
                          <label className="remember-me" htmlFor="showPassword">
                            <input type="checkbox" id="showPassword" checked={showPassword} onChange={() => setShowPassword(!showPassword)} />
                            <span>Show Passwords</span>
                          </label>
                        </div>

                        <button
                          type="submit"
                          className="submit-btn js-ripple"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Resetting Password...' : 'Verify OTP & Reset Password'}
                        </button>

                        <div className="dashboard-options" style={{ justifyContent: 'space-between', marginTop: '1rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="forgot-link"
                            onClick={() => { setForgotPasswordStep('ID'); setError(''); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                          >
                            ← Change ID
                          </button>
                          <button
                            type="button"
                            className="forgot-link"
                            onClick={() => {
                              setShowForgotPassword(false);
                              setForgotPasswordStep('ID');
                              setError('');
                              setResetSuccess('');
                            }}
                          >
                            Back to Login
                          </button>
                        </div>
                      </>
                    )}
                  </form>
                ) : (
                  <form className="dashboard-form" id="loginForm" onSubmit={handleSubmit}>
                    {error && (
                      <div className="login-error-toast">
                        <span>⚠️ {error}</span>
                      </div>
                    )}
                    {resetSuccess && (
                      <div className="login-error-toast" style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9' }}>
                        <span>✓ {resetSuccess}</span>
                      </div>
                    )}

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

export default LoginPage;
