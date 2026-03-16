import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { companies } from '../../data/mockData';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('arjun@technova.io');
  const [password, setPassword] = useState('password');
  const [companyId, setCompanyId] = useState('c1');
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password, companyId);
    if (success) {
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
              <label htmlFor="company-select">Company</label>
              <select
                id="company-select"
                className="select"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

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
              <input
                id="password-input"
                type="password"
                className="input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
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

            <p className="form-hint">
              Demo: Use <strong>arjun@technova.io</strong> to sign in as Admin
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
