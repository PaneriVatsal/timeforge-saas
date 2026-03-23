import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Timer, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../LoginPage/LoginPage.css';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);
    
    const result = await updatePassword(password);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-branding">
        <div className="branding-content">
          <Timer size={32} />
          <h1 className="branding-title">New Password</h1>
          <p className="branding-tagline">Secure your account with a fresh password.</p>
        </div>
      </div>
      <div className="login-form-panel">
        <div className="login-form-wrapper">
          <div className="form-header">
            <h2>Reset Password</h2>
            <p>Enter your new secure password below</p>
          </div>

          {success ? (
            <div className="success-state animate-fade-in">
              <CheckCircle2 size={64} className="text-accent center-icon" />
              <h3>Password Updated!</h3>
              <p>Your password has been changed successfully. Redirecting to login...</p>
              <Link to="/login" className="btn btn-primary mt-4">Login Now</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              {error && <div className="form-error">{error}</div>}

              <div className="form-group">
                <label htmlFor="password-reset">New Password</label>
                <div className="input-password-wrapper">
                  <input
                    id="password-reset"
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password-confirm">Confirm Password</label>
                <input
                  id="password-confirm"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-accent btn-lg login-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    Update Password
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
