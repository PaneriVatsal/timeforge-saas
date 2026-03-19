import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Timer, ArrowRight, Loader2, Eye, EyeOff, Github } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, signInWithSocial, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleSocialLogin = (provider) => {
    signInWithSocial(provider);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="login-page">
      {/* Left Panel — Branding */}
      <div className="login-branding">
        <div className="branding-content">
          <div className="branding-logo">
            <Timer size={32} />
          </div>
          <h1 className="branding-title">TimeForge</h1>
          <p className="branding-tagline">
            Precision time tracking for teams that ship.
          </p>
          <div className="branding-features">
            <div className="feature-item animate-fade-in-up stagger-1">
              <div className="feature-dot" />
              <span>Real-time project timer</span>
            </div>
            <div className="feature-item animate-fade-in-up stagger-2">
              <div className="feature-dot" />
              <span>Team assignment management</span>
            </div>
            <div className="feature-item animate-fade-in-up stagger-3">
              <div className="feature-dot" />
              <span>Detailed hour analytics</span>
            </div>
          </div>
        </div>
        <div className="branding-bg-grid" />
      </div>

      {/* Right Panel — Login Form */}
      <div className="login-form-panel">
        <div className="login-form-wrapper">
          <div className="form-header">
            <h2>Welcome back</h2>
            <p>Sign in to continue tracking your work</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" id="login-form">
            {error && (
              <div className="form-error animate-fade-in">
                {error}
              </div>
            )}



            <div className="form-group">
              <label htmlFor="email-input">Email</label>
              <input
                id="email-input"
                type="email"
                className="input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password-input">Password</label>
              <div className="input-password-wrapper">
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-accent btn-lg login-submit"
              id="login-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="login-separator">
              <span>Or manage with</span>
            </div>

            <div className="social-login-grid">
              <button
                type="button"
                className="btn btn-outline social-btn"
                onClick={() => handleSocialLogin('google')}
              >
                <img src="https://uid-auth.netlify.app/google.svg" alt="Google" width={18} height={18} />
                Google
              </button>
              <button
                type="button"
                className="btn btn-outline social-btn"
                onClick={() => handleSocialLogin('github')}
              >
                <Github size={18} />
                GitHub
              </button>
            </div>

            <p className="form-hint">
              Don't have an account? <Link to="/register">Create one here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
