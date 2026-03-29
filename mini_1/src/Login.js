import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async () => {
    if (!form.username || !form.password) { setError('Please enter username and password.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch {
      setError('Cannot connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg-root">
      {/* Left panel */}
      <div className="lg-left">
        <div className="lg-left-content">
          <div className="lg-logo">
            <span className="lg-logo-icon">⚖️</span>
            <span className="lg-logo-text">LexAssist</span>
          </div>
          <h1 className="lg-headline">Your AI-Powered<br />Legal Assistant</h1>
          <p className="lg-sub">Manage cases, store documents securely, and get AI-driven legal insights — all in one place.</p>
          <div className="lg-features">
            <div className="lg-feature">Smart Case Management</div>
            <div className="lg-feature">Secure Document Vault</div>
            <div className="lg-feature">AI Legal Analysis</div>
            <div className="lg-feature">Hearing Reminders</div>
          </div>
        </div>
        <div className="lg-left-circles">
          <div className="lg-circle lg-c1" />
          <div className="lg-circle lg-c2" />
          <div className="lg-circle lg-c3" />
        </div>
      </div>

      {/* Right panel */}
      <div className="lg-right">
        <div className="lg-form-wrap">
          <div className="lg-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your LexAssist account</p>
          </div>

          {error && <div className="lg-error">{error}</div>}

          <div className="lg-field">
            <label>Username</label>
            <div className="lg-input-wrap">
              <span className="lg-input-icon">@</span>
              <input
                type="text" name="username" placeholder="Enter your username"
                value={form.username} onChange={handleChange}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>

          <div className="lg-field">
            <label>Password</label>
            <div className="lg-input-wrap">
              <span className="lg-input-icon">#</span>
              <input
                type={showPass ? 'text' : 'password'} name="password" placeholder="Enter your password"
                value={form.password} onChange={handleChange}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <button className="lg-eye" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="lg-forgot">
            <button onClick={() => navigate('/forgot-password')}>Forgot password?</button>
          </div>

          <button className="lg-btn-primary" onClick={handleLogin} disabled={loading}>
            {loading ? <span className="lg-spinner" /> : 'Sign In'}
          </button>

          <div className="lg-divider"><span>or</span></div>

          <button className="lg-btn-secondary" onClick={() => navigate('/register')}>
            Create New Account
          </button>
        </div>
      </div>
    </div>
  );
}
