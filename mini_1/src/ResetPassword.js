import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [form, setForm] = useState({ otp: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleReset = async () => {
    if (!form.otp || !form.newPassword || !form.confirmPassword) {
      setError('All fields are required.'); return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.'); return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetch('http://localhost:8080/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: form.otp, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/', { state: { message: 'Password reset successful! Please log in.' } });
      } else {
        setError(data.message || 'Reset failed.');
      }
    } catch {
      setError('Cannot connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg-root">
      <div className="lg-left">
        <div className="lg-left-content">
          <div className="lg-logo">
            <span className="lg-logo-icon">⚖️</span>
            <span className="lg-logo-text">LexAssist</span>
          </div>
          <h1 className="lg-headline">Create New<br />Password</h1>
          <p className="lg-sub">Enter the OTP sent to <strong style={{color:'#fff'}}>{email || 'your email'}</strong> and set your new password.</p>
        </div>
        <div className="lg-left-circles">
          <div className="lg-circle lg-c1" />
          <div className="lg-circle lg-c2" />
          <div className="lg-circle lg-c3" />
        </div>
      </div>

      <div className="lg-right">
        <div className="lg-form-wrap">
          <div className="lg-form-header">
            <h2>Reset Password</h2>
            <p>OTP sent to {email || 'your email'}</p>
          </div>

          {error && <div className="lg-error">{error}</div>}

          <div className="lg-field">
            <label>OTP Code</label>
            <div className="lg-input-wrap">
              <span className="lg-input-icon">#</span>
              <input type="text" name="otp" placeholder="Enter OTP"
                value={form.otp} onChange={handleChange} />
            </div>
          </div>

          <div className="lg-field">
            <label>New Password</label>
            <div className="lg-input-wrap">
              <span className="lg-input-icon">#</span>
              <input type={showPass ? 'text' : 'password'} name="newPassword" placeholder="Enter new password"
                value={form.newPassword} onChange={handleChange} />
              <button className="lg-eye" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="lg-field">
            <label>Confirm Password</label>
            <div className="lg-input-wrap">
              <span className="lg-input-icon">#</span>
              <input type={showPass ? 'text' : 'password'} name="confirmPassword" placeholder="Confirm new password"
                value={form.confirmPassword} onChange={handleChange}
                onKeyDown={e => e.key === 'Enter' && handleReset()} />
            </div>
          </div>

          <button className="lg-btn-primary" onClick={handleReset} disabled={loading}>
            {loading ? <span className="lg-spinner" /> : 'Reset Password'}
          </button>

          <div className="lg-divider"><span>or</span></div>

          <button className="lg-btn-secondary" onClick={() => navigate('/forgot-password')}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
