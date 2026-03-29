import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import ChatWidget from './ChatWidget';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export default function Dashboard() {
  const navigate  = useNavigate();
  const token     = localStorage.getItem('token');
  const username  = localStorage.getItem('username');
  const headers   = { Authorization: `Bearer ${token}` };

  const [stats,       setStats]       = useState({ total: 0, FIR: 0, VIDEO: 0, CASE_FILE: 0, AADHAAR: 0, PERSONAL: 0 });
  const [profileOpen, setProfileOpen] = useState(false);
  const [recentFiles, setRecentFiles] = useState([]);
  const [cases,       setCases]       = useState([]);
  const [selectedCase,setSelectedCase]= useState('');
  const [prediction,  setPrediction]  = useState('');
  const [predLoading, setPredLoading] = useState(false);
  const [winPct,      setWinPct]      = useState(null);
  const [caseDetail,  setCaseDetail]  = useState(null);

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetchStats();
    fetchRecent();
    fetchCases();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/vault/stats`, { headers });
      if (res.ok) setStats(await res.json());
    } catch {}
  };

  const fetchRecent = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/vault/files`, { headers });
      if (res.ok) setRecentFiles((await res.json()).slice(0, 5));
    } catch {}
  };

  const fetchCases = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/cases`, { headers });
      if (res.ok) setCases(await res.json());
    } catch {}
  };

  const handleCaseSelect = (caseId) => {
    setSelectedCase(caseId);
    setPrediction('');
    setWinPct(null);
    setCaseDetail(null);
    if (caseId) {
      const c = cases.find(c => String(c.id) === String(caseId));
      if (c) setCaseDetail(c);
    }
  };

  const handlePredict = async () => {
    if (!selectedCase) return;
    setPredLoading(true);
    setPrediction('');
    setWinPct(null);
    try {
      const res = await fetch(`${BACKEND_URL}/cases/${selectedCase}/predict`, {
        method: 'POST', headers,
      });
      const data = await res.json();
      if (res.ok) {
        setPrediction(data.prediction);
        const match = data.prediction.match(/(\d{1,3})\s*%/);
        if (match) setWinPct(Math.min(parseInt(match[1]), 100));
      } else {
        setPrediction(data.error || 'Prediction failed.');
      }
    } catch {
      setPrediction('Could not connect. Make sure backend and Ollama are running.');
    } finally {
      setPredLoading(false);
    }
  };

  const formatDate = (dt) => new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const catLabel   = (cat) => ({ FIR: 'FIR', VIDEO: 'Video', CASE_FILE: 'Case Doc', AADHAAR: 'Aadhaar', PERSONAL: 'Personal' }[cat] || cat);
  const catIcon = (cat) => ({ FIR: 'FIR', VIDEO: 'VID', CASE_FILE: 'DOC', AADHAAR: 'ID', PERSONAL: 'PER' }[cat] || 'FILE');
  const winColor   = winPct >= 70 ? '#2e7d32' : winPct >= 40 ? '#e65100' : '#c62828';
  const winLabel   = winPct >= 70 ? 'Strong Case' : winPct >= 40 ? 'Moderate Case' : 'Weak Case';

  const caseTypeColor = (type) => ({
    'Accident / Motor Vehicle': '#e65100', 'Theft / Robbery': '#6a1b9a',
    'Fraud / Cheating': '#1565c0',         'Domestic Violence': '#c62828',
    'Murder / Assault': '#b71c1c',         'Cyber Crime': '#00838f',
    'Property Dispute': '#2e7d32',         'Other': '#555',
  }[type] || '#555');

  return (
    <div className="dash-container">
      <nav className="dash-nav">
        <span className="dash-brand">LexAssist</span>
        <div className="dash-nav-links">
          <button onClick={() => navigate('/dashboard')} className="nav-link active">Dashboard</button>
          <button onClick={() => navigate('/casefiles')} className="nav-link">Case Files</button>
          <button onClick={() => navigate('/vault')}     className="nav-link">Vault</button>
          <button onClick={() => navigate('/chat')}      className="nav-link">AI Chat</button>

        </div>
        <div className="nav-profile-wrap">
          <button className="nav-profile-btn" onClick={() => setProfileOpen(o => !o)}>
            <span className="nav-avatar">{username?.charAt(0).toUpperCase()}</span>
            <span className="nav-username">{username}</span>
            <span className="nav-caret">{profileOpen ? '▲' : '▼'}</span>
          </button>
          {profileOpen && (
            <div className="nav-dropdown">
              <button className="nav-dd-item" onClick={() => { setProfileOpen(false); navigate('/profile'); }}>Edit Profile</button>
              <button className="nav-dd-item" onClick={() => { setProfileOpen(false); navigate('/profile'); }}>Change Password</button>
              <div className="nav-dd-divider" />
              <button className="nav-dd-item logout" onClick={() => { localStorage.clear(); navigate('/'); }}>Logout</button>
            </div>
          )}
        </div>
      </nav>

      <div className="dash-body">

        <div className="dash-welcome">
          <div>
            <h2>Good day, {username}!</h2>
            <p>Here's your legal case overview</p>
          </div>
          <button className="dash-action-btn" onClick={() => navigate('/casefiles')}>
            New Case Folder
          </button>
        </div>

        <div className="stats-grid">
          {[
            { label: 'Total Files',    value: stats.total,     color: '#1877f2', bg: '#e8f0fe' },
            { label: 'FIR Copies',     value: stats.FIR,       color: '#e65100', bg: '#fff3e0' },
            { label: 'Case Documents', value: stats.CASE_FILE, color: '#2e7d32', bg: '#e8f5e9' },
            { label: 'Video Evidence', value: stats.VIDEO,     color: '#6a1b9a', bg: '#f3e5f5' },
            { label: 'Aadhaar IDs',    value: stats.AADHAAR,   color: '#00838f', bg: '#e0f7fa' },
            { label: 'Personal Docs',  value: stats.PERSONAL,  color: '#c62828', bg: '#fdecea' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ '--card-color': s.color, '--card-bg': s.bg }}>
              <div className="stat-info">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="dash-row">

          <div className="dash-card predict-card">
            <div className="card-header">
              <h3>Case Win Prediction</h3>
              <span className="card-sub">AI analysis of your case data</span>
            </div>

            <div className="predict-case-select-wrap">
              <label className="predict-label">Select a Case to Analyse</label>
              {cases.length === 0 ? (
                <div className="predict-no-cases">
                  No case folders found.{' '}
                  <span className="predict-link" onClick={() => navigate('/casefiles')}>
                    Create a case folder first
                  </span>
                </div>
              ) : (
                <select className="predict-select" value={selectedCase}
                  onChange={e => handleCaseSelect(e.target.value)}>
                  <option value="">Choose a case</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.caseName} ({c.caseType})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {caseDetail && (
              <div className="predict-case-info">
                <div className="predict-case-info-row">
                  <span className="predict-case-name">{caseDetail.caseName}</span>
                  <span className="predict-case-type-tag"
                    style={{ background: caseTypeColor(caseDetail.caseType) + '22', color: caseTypeColor(caseDetail.caseType) }}>
                    {caseDetail.caseType}
                  </span>
                </div>
                {caseDetail.description && (
                  <div className="predict-case-desc">{caseDetail.description}</div>
                )}
                <div className="predict-case-hint">
                  AI will analyse all uploaded documents, summaries, and case details to predict the outcome.
                </div>
              </div>
            )}

            <button className="predict-btn" onClick={handlePredict}
              disabled={predLoading || !selectedCase}>
              {predLoading ? 'Analysing case data...' : 'Predict Win Probability'}
            </button>

            {predLoading && (
              <div className="predict-loading-bar">
                <div className="predict-loading-fill" />
              </div>
            )}

            {winPct !== null && (
              <div className="win-meter">
                <div className="win-meter-top">
                  <div className="win-meter-label">
                    <span>Win Probability</span>
                    <span className="win-pct-badge" style={{ background: winColor }}>
                      {winPct}% — {winLabel}
                    </span>
                  </div>
                </div>
                <div className="win-meter-bar">
                  <div className="win-meter-fill"
                    style={{ width: `${winPct}%`, background: `linear-gradient(90deg, ${winColor}99, ${winColor})` }} />
                </div>
                <div className="win-meter-tags">
                  <span style={{ color: '#c62828' }}>Weak (0-40%)</span>
                  <span style={{ color: '#e65100' }}>Moderate (40-70%)</span>
                  <span style={{ color: '#2e7d32' }}>Strong (70-100%)</span>
                </div>
              </div>
            )}

            {prediction && (
              <div className="predict-result">
                {prediction.split('\n').map((line, i) => (
                  <span key={i}>{line}<br /></span>
                ))}
              </div>
            )}
          </div>

          <div className="dash-right-col">
            <div className="dash-card">
              <div className="card-header">
                <div>
                  <h3>My Cases</h3>
                  <span className="card-sub">Your active case folders</span>
                </div>
                <button className="card-link" onClick={() => navigate('/casefiles')}>View All →</button>
              </div>
              {cases.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"></div>
                  <div className="empty-text">No case folders yet.</div>
                  <button className="empty-action" onClick={() => navigate('/casefiles')}>Create a Case</button>
                </div>
              ) : (
                <div className="cases-list">
                  {cases.slice(0, 4).map(c => (
                    <div key={c.id} className="case-item" onClick={() => navigate('/casefiles')}>
                      <div className="case-item-avatar" style={{ background: caseTypeColor(c.caseType) + '18', color: caseTypeColor(c.caseType) }}>⚖️</div>
                      <div className="case-item-info">
                        <div className="case-item-name">{c.caseName}</div>
                        <div className="case-item-type" style={{ color: caseTypeColor(c.caseType) }}>{c.caseType}</div>
                      </div>
                      <button className="case-predict-btn"
                        onClick={e => { e.stopPropagation(); handleCaseSelect(String(c.id)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                        Predict
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="dash-card">
              <div className="card-header">
                <div>
                  <h3>Recent Files</h3>
                  <span className="card-sub">Latest uploaded documents</span>
                </div>
                <button className="card-link" onClick={() => navigate('/vault')}>View All →</button>
              </div>
              {recentFiles.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"></div>
                  <div className="empty-text">No files uploaded yet.</div>
                </div>
              ) : (
                <div className="recent-list">
                  {recentFiles.map(f => (
                    <div key={f.id} className="recent-item">
                      <div className="recent-file-icon">{catIcon(f.category)}</div>
                      <div className="recent-info">
                        <div className="recent-name">{f.fileName}</div>
                        <div className="recent-meta">
                          <span className="recent-cat-tag">{catLabel(f.category)}</span>
                          <span>{formatDate(f.uploadedAt)}</span>
                        </div>
                      </div>
                      {f.summary && <span className="recent-summary-dot" title="Has summary">●</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dash-disclaimer">
          Win predictions are AI estimates based on uploaded case data. This is not legal advice. Consult a qualified lawyer.
        </div>
      </div>
      <ChatWidget />
    </div>
  );
}
