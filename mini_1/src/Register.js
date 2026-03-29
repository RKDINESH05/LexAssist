import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', fullName: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async () => {
    if (!form.email || !form.fullName || !form.username || !form.password) {
      setError('All fields are required.'); return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Account created! Redirecting to login...');
        setTimeout(() => navigate('/'), 1500);
      } else {
        setError(data.message || 'Registration failed.');
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
          <h1 className="lg-headline">Join LexAssist<br />Today</h1>
          <p className="lg-sub">Create your account and start managing your legal cases with the power of AI.</p>
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

      <div className="lg-right">
        <div className="lg-form-wrap">
          <div className="lg-form-header">
            <h2>Create Account</h2>
            <p>Fill in your details to get started</p>
          </div>

          {error   && <div className="lg-error">{error}</div>}
          {success && <div className="lg-success">{success}</div>}

          <div className="lg-field">
            <label>Full Name</label>
            <div className="lg-input-wrap">
              <span className="lg-input-icon">@</span>
              <input type="text" name="fullName" placeholder="Enter your full name"
                value={form.fullName} onChange={handleChange} />
            </div>
          </div>

          <div className="lg-field">
            <label>Email</label>
            <div className="lg-input-wrap">
              <span className="lg-input-icon">@</span>
              <input type="email" name="email" placeholder="Enter your email"
                value={form.email} onChange={handleChange} />
            </div>
          </div>

          <div className="lg-field">
            <label>Username</label>
            <div className="lg-input-wrap">
              <span className="lg-input-icon">#</span>
              <input type="text" name="username" placeholder="Choose a username"
                value={form.username} onChange={handleChange} />
            </div>
          </div>

          <div className="lg-field">
            <label>Password</label>
            <div className="lg-input-wrap">
              <span className="lg-input-icon">#</span>
              <input type={showPass ? 'text' : 'password'} name="password" placeholder="Create a password"
                value={form.password} onChange={handleChange}
                onKeyDown={e => e.key === 'Enter' && handleRegister()} />
              <button className="lg-eye" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button className="lg-btn-primary" onClick={handleRegister} disabled={loading}>
            {loading ? <span className="lg-spinner" /> : 'Create Account'}
          </button>

          <div className="lg-divider"><span>or</span></div>

          <button className="lg-btn-secondary" onClick={() => navigate('/')}>
            Already have an account? Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
