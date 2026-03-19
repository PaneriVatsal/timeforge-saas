import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Mail, Lock, User, Building2, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import './RegisterPage.css';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, signInWithSocial } = useAuth();
  const navigate = useNavigate();

  const handleSocialLogin = (provider) => {
    signInWithSocial(provider);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPending(true);

    const result = await register(email, password, fullName, companyName);
    
    setPending(false);
    if (result.success) {
      setSuccess(true);
      // If email confirmation is off, we could navigate to dashboard
      // navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  if (success) {
    return (
      <div className="register-page">
        <div className="register-card card animate-scale-in">
          <div className="success-icon">
            <ShieldCheck size={48} className="text-accent" />
          </div>
          <h2>Registration Successful!</h2>
          <p>
            Welcome to TimeForge, {fullName.split(' ')[0]}! 
            Your account has been created successfully. You can now head to the login page to sign in.
          </p>
          <button className="btn btn-accent full-width" onClick={() => navigate('/login')}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-info animate-fade-in">
          <div className="brand">
            <div className="brand-logo">T</div>
            <span className="brand-name">TimeForge</span>
          </div>
          <h1>Join the next generation of time tracking.</h1>
          <p>Smart insights, automated reports, and professional project management in one place.</p>
          
          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-dot" />
              <span>Real-time team productivity tracking</span>
            </div>
            <div className="feature-item">
              <div className="feature-dot" />
              <span>Automated project budget alerts</span>
            </div>
            <div className="feature-item">
              <div className="feature-dot" />
              <span>Invite-only secure company workspaces</span>
            </div>
          </div>
        </div>

        <div className="register-card-wrapper animate-slide-in-right">
          <div className="register-card card">
            <h2>Create Your Account</h2>
            <p className="card-subtitle">Get started with TimeForge today</p>

            {error && <div className="error-banner animate-shake">{error}</div>}

            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    className="input"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    className="input"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <div className="input-password-wrapper" style={{ flex: 1 }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-divider">
                <span>Company Details</span>
              </div>

              <div className="form-group">
                <label>Company Name (optional if invited)</label>
                <div className="input-with-icon">
                  <Building2 size={18} className="input-icon" />
                  <input
                    type="text"
                    className="input"
                    placeholder="Acme Inc."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <p className="input-hint">If you've been invited, this will be ignored.</p>
              </div>

              <button 
                type="submit" 
                className="btn btn-accent full-width" 
                disabled={pending}
              >
                {pending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Sign Up
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="register-footer">
              Already have an account? <Link to="/login">Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
