import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Vault.css';
import ChatWidget from './ChatWidget';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

const CATEGORIES = [
  { key: 'ALL',       label: 'All Files'       },
  { key: 'FIR',       label: 'FIR Copy'        },
  { key: 'VIDEO',     label: 'Video Evidence'  },
  { key: 'CASE_FILE', label: 'Case Documents'  },
  { key: 'AADHAAR',   label: 'Aadhaar ID'      },
  { key: 'PERSONAL',  label: 'Personal Details'},
];

const CAT_ICON = { FIR: 'FIR', VIDEO: 'VID', CASE_FILE: 'DOC', AADHAAR: 'ID', PERSONAL: 'PER' };
const CAT_COLOR = { FIR: '#e65100', VIDEO: '#6a1b9a', CASE_FILE: '#1565c0', AADHAAR: '#00838f', PERSONAL: '#2e7d32' };

const caseTypeColor = (type) => ({
  'Accident / Motor Vehicle': '#e65100', 'Theft / Robbery': '#6a1b9a',
  'Fraud / Cheating': '#1565c0',         'Domestic Violence': '#c62828',
  'Murder / Assault': '#b71c1c',         'Cyber Crime': '#00838f',
  'Property Dispute': '#2e7d32',         'Other': '#555',
}[type] || '#1877f2');

export default function Vault() {
  const navigate = useNavigate();
  const token    = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const headers  = { Authorization: `Bearer ${token}` };

  const [allFiles,     setAllFiles]     = useState([]);
  const [cases,        setCases]        = useState([]);
  const [caseMap,      setCaseMap]      = useState({});   // { caseId -> case object }
  const [activeTab,    setActiveTab]    = useState('ALL');
  const [search,       setSearch]       = useState('');
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [previewFile,  setPreviewFile]  = useState(null);
  const [profileOpen,  setProfileOpen]  = useState(false);

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [filesRes, casesRes] = await Promise.all([
        fetch(`${BACKEND_URL}/vault/files`, { headers }),
        fetch(`${BACKEND_URL}/cases`,       { headers }),
      ]);
      if (filesRes.ok) setAllFiles(await filesRes.json());
      if (casesRes.ok) {
        const casesData = await casesRes.json();
        setCases(casesData);
        const map = {};
        casesData.forEach(c => { map[c.id] = c; });
        setCaseMap(map);
      }
    } catch { setError('Failed to load files.'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (fileId, fileName) => {
    if (!window.confirm(`Delete "${fileName}"?`)) return;
    try {
      const res = await fetch(`${BACKEND_URL}/vault/delete/${fileId}`, { method: 'DELETE', headers });
      if (res.ok) { setSuccess('File deleted.'); setAllFiles(prev => prev.filter(f => f.id !== fileId)); }
      else setError('Delete failed.');
    } catch { setError('Delete failed.'); }
  };

  const handleDownload = (file) => {
    const url = file.s3Url || `${BACKEND_URL}/vault/download/${file.id}`;
    const a = document.createElement('a');
    a.href = url; a.download = file.fileName; a.target = '_blank'; a.click();
  };

  const getFileType = (fileName) => {
    const ext = (fileName || '').split('.').pop().toLowerCase();
    if (['mp4','avi','mov','webm','mkv'].includes(ext)) return 'video';
    if (['jpg','jpeg','png','gif','webp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    return 'other';
  };

  const formatDate = (dt) => new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const filtered = allFiles.filter(f => {
    const matchCat  = activeTab === 'ALL' || f.category === activeTab;
    const matchSearch = !search || f.fileName.toLowerCase().includes(search.toLowerCase())
      || (caseMap[f.caseId]?.caseName || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="vault-container">
      <nav className="vault-nav">
        <span className="vault-brand" onClick={() => navigate('/dashboard')}>LexAssist</span>
        <div className="vault-nav-links">
          <button className="vault-nav-btn" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button className="vault-nav-btn" onClick={() => navigate('/casefiles')}>Case Files</button>
          <button className="vault-nav-btn active">Vault</button>
          <button className="vault-nav-btn" onClick={() => navigate('/chat')}>AI Chat</button>
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

      <div className="vault-page-body">

        {/* ── Header Banner ── */}
        <div className="vault-banner">
          <div>
            <h2>Document Vault</h2>
            <p>{allFiles.length} file{allFiles.length !== 1 ? 's' : ''} across {cases.length} case{cases.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="vault-banner-btn" onClick={() => navigate('/casefiles')}>
            + Upload Files
          </button>
        </div>

        {error   && <div className="vault-alert error">{error}</div>}
        {success && <div className="vault-alert success">{success}</div>}

        {/* ── Filter Bar ── */}
        <div className="vault-filter-bar">
          <div className="vault-cat-tabs">
            {CATEGORIES.map(c => (
              <button key={c.key}
                className={`vault-cat-tab ${activeTab === c.key ? 'active' : ''}`}
                onClick={() => setActiveTab(c.key)}>
                {c.key !== 'ALL' && <span>{CAT_ICON[c.key]}</span>}
                {c.label}
                <span className="vault-cat-count">
                  {c.key === 'ALL' ? allFiles.length : allFiles.filter(f => f.category === c.key).length}
                </span>
              </button>
            ))}
          </div>
          <input
            className="vault-search"
            type="text"
            placeholder="Search files or cases..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* ── File Grid ── */}
        {loading ? (
          <div className="vault-loading">Loading files...</div>
        ) : filtered.length === 0 ? (
          <div className="vault-empty-state">
            <div className="vault-empty-icon"></div>
            <h3>{search ? 'No files match your search' : 'No files yet'}</h3>
            <p>{search ? 'Try a different search term' : 'Upload files from Case Files to see them here'}</p>
            {!search && <button className="vault-banner-btn" onClick={() => navigate('/casefiles')}>Go to Case Files</button>}
          </div>
        ) : (
          <div className="vault-unified-grid">
            {filtered.map((file, idx) => {
              const caseObj = caseMap[file.caseId];
              const catColor = CAT_COLOR[file.category] || '#1877f2';
              return (
                <div key={file.id || idx} className="vault-file-card">
                  <div className="vfc-top">
                    <div className="vfc-icon" style={{ background: catColor + '18', color: catColor }}>
                      {CAT_ICON[file.category] || 'FILE'}
                    </div>
                    <div className="vfc-info">
                      <div className="vfc-name" title={file.fileName}>{file.fileName}</div>
                      <div className="vfc-date">{formatDate(file.uploadedAt)}</div>
                    </div>
                  </div>

                  <div className="vfc-tags">
                    <span className="vfc-cat-tag" style={{ background: catColor + '18', color: catColor }}>
                      {CAT_ICON[file.category]} {CATEGORIES.find(c => c.key === file.category)?.label || file.category}
                    </span>
                    {caseObj && (
                      <span className="vfc-case-tag" style={{ background: caseTypeColor(caseObj.caseType) + '15', color: caseTypeColor(caseObj.caseType) }}>
                        {caseObj.caseName}
                      </span>
                    )}
                  </div>

                  <div className="vfc-actions">
                    <button className="vfc-btn view"
                      onClick={() => setPreviewFile({ fileName: file.fileName, url: file.s3Url || `${BACKEND_URL}/vault/download/${file.id}` })}>
                      View
                    </button>
                    <button className="vfc-btn download" onClick={() => handleDownload(file)}>
                      Download
                    </button>
                    <button className="vfc-btn delete" onClick={() => handleDelete(file.id, file.fileName)}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Preview Modal ── */}
      {previewFile && (
        <div className="modal-overlay" onClick={() => setPreviewFile(null)}>
          <div className="modal-box preview-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: 14, maxWidth: '85%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {previewFile.fileName}
              </h3>
              <button className="modal-close" onClick={() => setPreviewFile(null)}>✕</button>
            </div>
            <div className="preview-body">
              {getFileType(previewFile.fileName) === 'video' && (
                <video controls style={{ width: '100%', maxHeight: '70vh', borderRadius: 8 }}>
                  <source src={previewFile.url} />
                </video>
              )}
              {getFileType(previewFile.fileName) === 'image' && (
                <img src={previewFile.url} alt={previewFile.fileName}
                  style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }} />
              )}
              {getFileType(previewFile.fileName) === 'pdf' && (
                <iframe src={previewFile.url} title={previewFile.fileName}
                  style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8 }} />
              )}
              {getFileType(previewFile.fileName) === 'other' && (
                <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
                  <div style={{ fontSize: 16, color: '#aaa', marginBottom: 8 }}>No preview available</div>
                  <p style={{ marginTop: 12 }}>Preview not available for this file type.</p>
                  <button className="upload-btn" style={{ marginTop: 16 }}
                    onClick={() => handleDownload(previewFile)}>Download File</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ChatWidget />
    </div>
  );
}
