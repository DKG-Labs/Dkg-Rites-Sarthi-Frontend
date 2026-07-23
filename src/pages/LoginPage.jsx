import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser, storeAuthData, isAuthenticated, getStoredUser, resetPassword } from '../services/authService';
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
  const [isFilled, setIsFilled] = useState({ userId: false, password: false });
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [roleOptions, setRoleOptions] = useState([]);
  const [pendingUserData, setPendingUserData] = useState(null);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const heroRef = useRef(null);

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
  const handleSelectRole = (selectedOption) => {
    if (!pendingUserData) return;
    const finalUserData = { ...pendingUserData, roleName: selectedOption.roleToStore };
    handleRoleRedirection(finalUserData);
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
      const userData = await loginUser(userId, password);

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
      if (roles.some(r => r === 'IE' || r === 'Process IE')) {
        options.push({
          id: 'ie_option',
          label: 'IE Dashboard',
          description: 'Access IE and Process IE modules',
          icon: '🛠️',
          roleToStore: roles.find(r => r === 'IE' || r === 'Process IE') // Use the first matching role
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
        const isProcessRole = roles.includes('Rail Process IE') && !roles.includes('Railpad IE') && !roles.includes('Rail Main IE');
        options.push({
          id: 'railpad_option',
          label: isProcessRole ? 'Railpad Process IE Dashboard' : 'Railpad Dashboard',
          description: isProcessRole ? 'Access Railpad Process IE platform' : 'Access Railpad IE modules',
          icon: '🛤️',
          roleToStore: roles.includes('Rail Main IE') ? 'Rail Main IE' : (roles.includes('Railpad IE') ? 'Railpad IE' : 'Rail Process IE')
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
        // Single option - route directly
        userData.roleName = options[0].roleToStore;
        handleRoleRedirection(userData);
      } else {
        // No roles found or fallback for existing behavior if list is empty
        handleRoleRedirection(userData);
      }
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
                  {showRoleSelection ? 'SELECT ROLE' : 'LOGIN'}
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


