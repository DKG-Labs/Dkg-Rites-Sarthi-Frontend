import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser, storeAuthData, isAuthenticated, getStoredUser } from '../services/authService';
import { ROUTES } from '../routes';
import './LoginPage.css';

/**
 * Login Page Component
 * Handles user authentication with userId and password
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated - based on role
  // Use useEffect to avoid calling navigate during render
  useEffect(() => {
    if (isAuthenticated()) {
      const currentUser = getStoredUser();
      let redirectPath = ROUTES.LANDING;

      if (currentUser?.roleName === 'CM') {
        redirectPath = ROUTES.CM_DASHBOARD;
      } else if (currentUser?.roleName === 'CALL_DESK') {
        redirectPath = ROUTES.CALL_DESK;
      } else if (currentUser?.roleName === 'Finance') {
        redirectPath = ROUTES.FINANCE;
      } else {
        redirectPath = location.state?.from?.pathname || ROUTES.LANDING;
      }

      navigate(redirectPath, { replace: true });
    }
  }, [navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
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
      // loginUser returns responseData directly (userId, userName, roleName, token)
      const userData = await loginUser(userId, password);
      storeAuthData(userData);

      // Redirect based on user role
      let redirectPath = ROUTES.LANDING;

      if (userData.roleName === 'CM') {
        // CM user - redirect to CM Dashboard
        redirectPath = ROUTES.CM_DASHBOARD;
      } else if (userData.roleName === 'CALL_DESK') {
        // Call Desk user - redirect to Call Desk
        redirectPath = ROUTES.CALL_DESK;
      } else if (userData.roleName === 'Finance') {
        // Finance user - redirect to Finance Dashboard
        redirectPath = ROUTES.FINANCE;
      } else {
        // IE user - redirect to landing page or intended destination
        redirectPath = location.state?.from?.pathname || ROUTES.LANDING;
      }

      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">SARTHI</div>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to continue to Inspection Dashboard</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="login-error">
                <span className="login-error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="login-form-group">
              <label className="login-label" htmlFor="userId">
                User ID <span className="login-required">*</span>
              </label>
              <input
                type="text"
                id="userId"
                className="login-input"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your User ID"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div className="login-form-group">
              <label className="login-label" htmlFor="password">
                Password <span className="login-required">*</span>
              </label>
              <div className="login-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="login-spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p className="login-footer-text">
              © 2025 SARTHI - Inspection Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

