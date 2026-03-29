import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import ChatWidget from './ChatWidget';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export default function Profile() {
  const navigate  = useNavigate();
  const token     = localStorage.getItem('token');
  const username  = localStorage.getItem('username');
  const headers   = { Authorization: `Bearer ${token}` };

  const [tab,       setTab]       = useState('info');
  const [profile,   setProfile]   = useState({ fullName: '', email: '', username: '' });
  const [infoForm,  setInfoForm]  = useState({ fullName: '', email: '' });
  const [passForm,  setPassForm]  = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [showPass,  setShowPass]  = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetchProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/profile`, { headers });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setInfoForm({ fullName: data.fullName, email: data.email });
      }
    } catch { setError('Failed to load profile.'); }
  };

  const handleUpdateInfo = async () => {
    if (!infoForm.fullName.trim() || !infoForm.email.trim()) {
      setError('Name and email are required.'); return;
    }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/profile`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(infoForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Update failed.'); return; }
      setSuccess('Profile updated successfully.');
      fetchProfile();
    } catch { setError('Update failed.'); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async () => {
    if (!passForm.currentPassword || !passForm.newPassword || !passForm.confirmPassword) {
      setError('All fields are required.'); return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      setError('New passwords do not match.'); return;
    }
    if (passForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters.'); return;
    }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/profile/password`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Password change failed.'); return; }
      setSuccess('Password changed successfully.');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch { setError('Password change failed.'); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const toggle = (field) => setShowPass(p => ({ ...p, [field]: !p[field] }));

  return (
    <div className="profile-container">
      <nav className="profile-nav">
        <span className="profile-brand" onClick={() => navigate('/dashboard')}>LexAssist</span>
        <div className="profile-nav-links">
          <button className="profile-nav-btn" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button className="profile-nav-btn" onClick={() => navigate('/casefiles')}>Case Files</button>
          <button className="profile-nav-btn" onClick={() => navigate('/vault')}>Vault</button>
        </div>
        <span className="profile-nav-user">{username}</span>
      </nav>

      <div className="profile-body">
        <div className="profile-sidebar">
          <div className="profile-avatar">
            {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : username?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-sidebar-name">{profile.fullName || username}</div>
          <div className="profile-sidebar-username">@{username}</div>
          <div className="profile-sidebar-email">{profile.email}</div>

          <div className="profile-sidebar-menu">
            <button className={`profile-menu-btn ${tab === 'info' ? 'active' : ''}`} onClick={() => { setTab('info'); setError(''); setSuccess(''); }}>
              Edit Profile
            </button>
            <button className={`profile-menu-btn ${tab === 'password' ? 'active' : ''}`} onClick={() => { setTab('password'); setError(''); setSuccess(''); }}>
              Change Password
            </button>
            <button className="profile-menu-btn logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="profile-main">
          {error   && <div className="profile-alert error">{error}</div>}
          {success && <div className="profile-alert success">{success}</div>}

          {tab === 'info' && (
            <div className="profile-card">
              <h3>Edit Profile</h3>
              <p className="profile-card-sub">Update your name and email address</p>

              <div className="profile-form-group">
                <label>Username</label>
                <input type="text" value={profile.username} disabled className="profile-input disabled" />
                <span className="profile-hint">Username cannot be changed</span>
              </div>
              <div className="profile-form-group">
                <label>Full Name</label>
                <input type="text" placeholder="Your full name"
                  value={infoForm.fullName}
                  onChange={e => setInfoForm({ ...infoForm, fullName: e.target.value })} />
              </div>
              <div className="profile-form-group">
                <label>Email Address</label>
                <input type="email" placeholder="your@email.com"
                  value={infoForm.email}
                  onChange={e => setInfoForm({ ...infoForm, email: e.target.value })} />
              </div>
              <button className="profile-save-btn" onClick={handleUpdateInfo} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {tab === 'password' && (
            <div className="profile-card">
              <h3>Change Password</h3>
              <p className="profile-card-sub">Make sure your new password is at least 6 characters</p>

              <div className="profile-form-group">
                <label>Current Password</label>
                <div className="profile-pass-wrap">
                  <input type={showPass.current ? 'text' : 'password'} placeholder="Enter current password"
                    value={passForm.currentPassword}
                    onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })} />
                  <button className="profile-eye-btn" onClick={() => toggle('current')}>
                    {showPass.current ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="profile-form-group">
                <label>New Password</label>
                <div className="profile-pass-wrap">
                  <input type={showPass.new ? 'text' : 'password'} placeholder="Enter new password"
                    value={passForm.newPassword}
                    onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} />
                  <button className="profile-eye-btn" onClick={() => toggle('new')}>
                    {showPass.new ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="profile-form-group">
                <label>Confirm New Password</label>
                <div className="profile-pass-wrap">
                  <input type={showPass.confirm ? 'text' : 'password'} placeholder="Confirm new password"
                    value={passForm.confirmPassword}
                    onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })} />
                  <button className="profile-eye-btn" onClick={() => toggle('confirm')}>
                    {showPass.confirm ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button className="profile-save-btn" onClick={handleChangePassword} disabled={loading}>
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          )}
        </div>
      </div>
      <ChatWidget />
    </div>
  );
}
