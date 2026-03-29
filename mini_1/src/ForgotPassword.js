import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email) { setError('Please enter your email.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/reset-password', { state: { email } });
      } else {
        setError(data.message || 'Failed to send OTP.');
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
          <h1 className="lg-headline">Reset Your<br />Password</h1>
          <p className="lg-sub">Enter your registered email and we'll send you an OTP to reset your password.</p>
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
            <h2>Forgot Password</h2>
            <p>Enter your email to receive an OTP</p>
          </div>

          {error && <div className="lg-error">{error}</div>}

          <div className="lg-field">
            <label>Email Address</label>
            <div className="lg-input-wrap">
              <span className="lg-input-icon">@</span>
              <input type="email" placeholder="Enter your registered email"
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendOtp()} />
            </div>
          </div>

          <button className="lg-btn-primary" onClick={handleSendOtp} disabled={loading}>
            {loading ? <span className="lg-spinner" /> : 'Send OTP'}
          </button>

          <div className="lg-divider"><span>or</span></div>

          <button className="lg-btn-secondary" onClick={() => navigate('/')}>
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
