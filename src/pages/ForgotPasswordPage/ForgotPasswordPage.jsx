import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Timer, ArrowLeft, Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../LoginPage/LoginPage.css'; // Reuse login styles

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const result = await resetPassword(email);
    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="login-page">
        <div className="login-branding">
          <div className="branding-content">
            <Timer size={32} />
            <h1 className="branding-title">Check your email</h1>
            <p className="branding-tagline">We've sent a password reset link to {email}.</p>
          </div>
        </div>
        <div className="login-form-panel">
          <div className="login-form-wrapper" style={{ textAlign: 'center' }}>
            <div className="success-icon-wrapper">
              <CheckCircle2 size={64} className="text-accent" />
            </div>
            <h2>Email Sent</h2>
            <p style={{ margin: 'var(--space-4) 0 var(--space-8)' }}>
              Check your inbox (and spam folder) for a link to reset your password.
            </p>
            <Link to="/login" className="btn btn-primary">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-branding">
        <div className="branding-content">
          <Timer size={32} />
          <h1 className="branding-title">Restore Access</h1>
          <p className="branding-tagline">Enter your email and we'll help you get back into TimeForge.</p>
        </div>
      </div>
      <div className="login-form-panel">
        <div className="login-form-wrapper">
          <div className="form-header">
            <Link to="/login" className="back-link">
              <ArrowLeft size={16} /> Back to Login
            </Link>
            <h2>Forgot Password</h2>
            <p>We'll send you a secure link to reset your password</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="form-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="email-input">Email Address</label>
              <div className="input-icon-wrapper">
                <input
                  id="email-input"
                  type="email"
                  className="input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-accent btn-lg login-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Sending Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
