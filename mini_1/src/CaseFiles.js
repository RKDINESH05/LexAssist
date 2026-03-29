import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './CaseFiles.css';
import { deleteFromCloudinary } from './cloudinaryUpload';
import ChatWidget from './ChatWidget';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

const CASE_TYPES = [
  'Accident / Motor Vehicle', 'Theft / Robbery', 'Fraud / Cheating',
  'Domestic Violence', 'Murder / Assault', 'Cyber Crime',
  'Property Dispute', 'Other'
];

const SECTIONS = [
  { key: 'FIR',           label: 'FIR Copy',        accept: '.pdf,.jpg,.jpeg,.png', canSummarise: false, desc: 'First Information Report copies',      isNotes: false },
  { key: 'VIDEO',         label: 'Video Evidence',   accept: 'video/*,.mp4,.avi',    canSummarise: false, desc: 'Video evidence files',                 isNotes: false },
  { key: 'CASE_FILE',     label: 'Case Documents',   accept: '.pdf,.txt',            canSummarise: true,  desc: 'Legal documents - AI can summarise',   isNotes: false },
  { key: 'HEARING_NOTES', label: 'Hearing Notes',    accept: '',                     canSummarise: false, desc: 'Manual notes from court hearings',     isNotes: true  },
  { key: 'PERSONAL',      label: 'Personal Details', accept: '.pdf,.txt,.docx',      canSummarise: false, desc: 'Personal affidavits and documents',    isNotes: false },
];

export default function CaseFiles() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const authFetch = async (url, options = {}) => {
    const res = await fetch(url, { ...options, headers: { ...getHeaders(), ...options.headers } });
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      navigate('/');
      return null;
    }
    return res;
  };

  const [view,          setView]          = useState('list');
  const [cases,         setCases]         = useState([]);
  const [openCase,      setOpenCase]      = useState(null);
  const [activeSection, setActiveSection] = useState('FIR');
  const [caseFiles,     setCaseFiles]     = useState([]);  // [{fileName, secure_url, public_id, resource_type, uploadedAt}]
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');
  const [creating,      setCreating]      = useState(false);
  const [folderUploading, setFolderUploading] = useState(false);
  const [uploadProgress,  setUploadProgress]  = useState(0);

  const [newCase, setNewCase] = useState({ caseName: '', caseType: CASE_TYPES[0], description: '', clientName: '', clientPhone: '', clientEmail: '' });
  const [selectedFiles, setSelectedFiles] = useState({ FIR: [], VIDEO: [], CASE_FILE: [], PERSONAL: [] });

  const [hearingNotes,  setHearingNotes]  = useState([]);
  const [noteForm,      setNoteForm]      = useState({ title: '', hearingDate: '', content: '' });
  const [editingNote,   setEditingNote]   = useState(null); // note object being edited
  const [showNoteForm,  setShowNoteForm]  = useState(false);
  const [noteSaving,    setNoteSaving]    = useState(false);

  const [notifyModal,   setNotifyModal]   = useState(false);
  const [notifyForm,    setNotifyForm]    = useState({ nextHearingDate: '', message: '' });
  const [notifySending, setNotifySending] = useState(false);

  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInput,   setPhoneInput]   = useState('');

  const [editModal,    setEditModal]    = useState(false);
  const [editForm,     setEditForm]     = useState({});
  const [editSaving,   setEditSaving]   = useState(false);

  const [previewFile,  setPreviewFile]  = useState(null); // { fileName, url, type }

  const [profileOpen, setProfileOpen] = useState(false);

  const fileRefs      = useRef({});
  const folderFileRef = useRef();

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/'); return; }
    fetchCases();
  }, []);

  useEffect(() => {
    if (!openCase) return;
    if (activeSection === 'HEARING_NOTES') fetchHearingNotes(openCase.id);
    else fetchCaseFiles(openCase.id);
  }, [activeSection, openCase]);

  const fetchCases = async () => {
    try {
      const res = await authFetch(`${BACKEND_URL}/cases`);
      if (res && res.ok) setCases(await res.json());
    } catch { setError('Failed to load cases.'); }
  };

  const fetchCaseFiles = async (caseId) => {
    try {
      const res = await authFetch(`${BACKEND_URL}/cases/${caseId}/files/category?category=${activeSection}`);
      if (res && res.ok) setCaseFiles(await res.json());
    } catch {}
  };

  const fetchHearingNotes = async (caseId) => {
    try {
      const res = await authFetch(`${BACKEND_URL}/cases/${caseId}/notes`);
      if (res && res.ok) setHearingNotes(await res.json());
    } catch {}
  };

  const handleSaveDetails = async () => {
    if (!editForm.caseName?.trim()) { setError('Case name is required.'); return; }
    setEditSaving(true); setError('');
    try {
      const res = await authFetch(`${BACKEND_URL}/cases/${openCase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res) return;
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed to update case.'); return; }
      setOpenCase(d);
      setCases(prev => prev.map(c => c.id === d.id ? d : c));
      setEditModal(false);
      setSuccess('Case details updated.');
    } catch { setError('Server not reachable.'); }
    finally { setEditSaving(false); }
  };

  const handleSavePhone = async () => {
    if (!phoneInput.trim()) { setError('Phone number cannot be empty.'); return; }
    try {
      const res = await authFetch(`${BACKEND_URL}/cases/${openCase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientPhone: phoneInput.trim() }),
      });
      if (!res) return;
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed to update phone.'); return; }
      setOpenCase(d);
      setCases(prev => prev.map(c => c.id === d.id ? d : c));
      setEditingPhone(false);
      setSuccess('Phone number updated.');
    } catch { setError('Server not reachable.'); }
  };

  const handleSendNotification = async () => {
    if (!notifyForm.nextHearingDate) { setError('Please select the next hearing date.'); return; }
    setNotifySending(true); setError('');
    try {
      const res = await authFetch(`${BACKEND_URL}/cases/${openCase.id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifyForm),
      });
      if (!res) return;
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed to send notification.'); return; }
      setSuccess(d.message || 'Notification sent!');
      setNotifyModal(false);
      setNotifyForm({ nextHearingDate: '', message: '' });
    } catch { setError('Failed to send notification.'); }
    finally { setNotifySending(false); }
  };

  const handleSaveNote = async () => {
    if (!noteForm.title.trim() || !noteForm.content.trim()) {
      setError('Title and content are required.'); return;
    }
    setNoteSaving(true); setError('');
    try {
      const url    = editingNote
        ? `${BACKEND_URL}/cases/${openCase.id}/notes/${editingNote.id}`
        : `${BACKEND_URL}/cases/${openCase.id}/notes`;
      const method = editingNote ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteForm),
      });
      if (!res) return;
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed to save note.'); return; }
      setSuccess(editingNote ? 'Note updated.' : 'Note added.');
      setNoteForm({ title: '', hearingDate: '', content: '' });
      setEditingNote(null); setShowNoteForm(false);
      fetchHearingNotes(openCase.id);
    } catch { setError('Failed to save note.'); }
    finally { setNoteSaving(false); }
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setNoteForm({ title: note.title, hearingDate: note.hearingDate, content: note.content });
    setShowNoteForm(true); setError(''); setSuccess('');
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      const res = await authFetch(`${BACKEND_URL}/cases/${openCase.id}/notes/${noteId}`, { method: 'DELETE' });
      if (res && res.ok) { setSuccess('Note deleted.'); fetchHearingNotes(openCase.id); }
      else if (res) setError('Delete failed.');
    } catch { setError('Delete failed.'); }
  };

  const handleSelectFiles = (sectionKey, files) => {
    setSelectedFiles(prev => ({ ...prev, [sectionKey]: [...prev[sectionKey], ...Array.from(files)] }));
  };

  const handleRemoveFile = (sectionKey, index) => {
    setSelectedFiles(prev => ({ ...prev, [sectionKey]: prev[sectionKey].filter((_, i) => i !== index) }));
  };

  const handleCreateCase = async () => {
    if (!newCase.caseName.trim()) { setError('Case name is required.'); return; }
    setError(''); setCreating(true);
    try {
      const res = await authFetch(`${BACKEND_URL}/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCase),
      });
      if (!res) return;
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed to create case.'); return; }
      const createdCase = await res.json();
      for (const section of SECTIONS.filter(s => !s.isNotes)) {
        for (const file of selectedFiles[section.key]) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            await authFetch(`${BACKEND_URL}/cases/${createdCase.id}/upload?category=${section.key}`, {
              method: 'POST', body: formData,
            });
          } catch (err) { console.error(`Failed to upload ${file.name}:`, err.message); }
        }
      }
      setNewCase({ caseName: '', caseType: CASE_TYPES[0], description: '', clientName: '', clientPhone: '', clientEmail: '' });
      setSelectedFiles({ FIR: [], VIDEO: [], CASE_FILE: [], PERSONAL: [] });
      await fetchCases();
      setView('list');
      setSuccess(`Case folder "${createdCase.caseName}" created successfully.`);
    } catch (err) { setError('Failed to create case: ' + err.message); }
    finally { setCreating(false); }
  };

  const handleFolderUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !openCase) return;
    setFolderUploading(true); setUploadProgress(0); setError(''); setSuccess('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await authFetch(`${BACKEND_URL}/cases/${openCase.id}/upload?category=${activeSection}`, {
        method: 'POST', body: formData,
      });
      setSuccess(`"${file.name}" uploaded to Cloudinary successfully.`);
      setUploadProgress(100);
      fetchCaseFiles(openCase.id);
    } catch (err) { setError('Upload failed: ' + err.message); }
    finally { setFolderUploading(false); setUploadProgress(0); folderFileRef.current.value = ''; }
  };

  const handleDownload = (url, fileName) => {
    const a = document.createElement('a');
    a.href = url; a.download = fileName; a.target = '_blank'; a.click();
  };

  const handleDeleteFile = async (fileId, fileName) => {
    if (!window.confirm(`Delete "${fileName}"?`)) return;
    try {
      const res = await authFetch(`${BACKEND_URL}/vault/delete/${fileId}`, { method: 'DELETE' });
      if (res && res.ok) { setSuccess('File deleted.'); fetchCaseFiles(openCase.id); }
      else if (res) setError('Delete failed.');
    } catch { setError('Delete failed.'); }
  };

  const handleDeleteCase = async (id, name) => {
    if (!window.confirm(`Delete case "${name}"?`)) return;
    try {
      const res = await authFetch(`${BACKEND_URL}/cases/${id}`, { method: 'DELETE' });
      if (res && res.ok) { fetchCases(); setSuccess('Case deleted.'); }
    } catch { setError('Delete failed.'); }
  };

  const handleOpenCase = (c) => {
    setOpenCase(c); setActiveSection('FIR');
    setCaseFiles([]); setHearingNotes([]); setError(''); setSuccess('');
    setShowNoteForm(false); setEditingNote(null);
    setView('folder');
  };

  const formatDate = (dt) => new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const getFileType = (fileName) => {
    const ext = (fileName || '').split('.').pop().toLowerCase();
    if (['mp4','avi','mov','webm','mkv'].includes(ext)) return 'video';
    if (['jpg','jpeg','png','gif','webp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    return 'other';
  };

  const caseTypeColor = (type) => ({
    'Accident / Motor Vehicle': '#e65100', 'Theft / Robbery': '#6a1b9a',
    'Fraud / Cheating': '#1565c0',         'Domestic Violence': '#c62828',
    'Murder / Assault': '#b71c1c',         'Cyber Crime': '#00838f',
    'Property Dispute': '#2e7d32',         'Other': '#555',
  }[type] || '#555');

  const activeSec     = SECTIONS.find(s => s.key === activeSection);
  const totalSelected = Object.values(selectedFiles).reduce((a, b) => a + b.length, 0);

  const Navbar = () => (
    <nav className="cf-nav">
      <span className="cf-brand">LexAssist</span>
      <div className="cf-nav-links">
        <button onClick={() => navigate('/dashboard')} className="cf-nav-btn">Dashboard</button>
        <button onClick={() => { setView('list'); setOpenCase(null); fetchCases(); }} className="cf-nav-btn active">Case Files</button>
        <button onClick={() => navigate('/vault')} className="cf-nav-btn">Vault</button>
        <button onClick={() => navigate('/chat')} className="cf-nav-btn">AI Chat</button>
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
  );

  // LIST
  if (view === 'list') return (
    <div className="cf-container">
      <Navbar />
      <div className="cf-body">
        <div className="cf-page-header">
          <div>
            <h2>My Case Files</h2>
            <p>{cases.length} case folder{cases.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="cf-new-btn" onClick={() => { setView('create'); setError(''); setSuccess(''); }}>
            New Case Folder
          </button>
        </div>
        {error   && <div className="cf-alert error">{error}</div>}
        {success && <div className="cf-alert success">{success}</div>}
        {cases.length === 0 ? (
          <div className="cf-empty-state">
            <div style={{ fontSize: 48, color: '#aaa' }}>[ ]</div>
            <h3>No case folders yet</h3>
            <p>Create your first case folder to organise your legal documents.</p>
            <button className="cf-new-btn" onClick={() => setView('create')}>Create Case Folder</button>
          </div>
        ) : (
          <div className="cf-folder-grid">
            {cases.map(c => (
              <div key={c.id} className="cf-folder-card" onClick={() => handleOpenCase(c)}>
                <div className="cf-folder-top">
                  <span className="cf-folder-icon">[ ]</span>
                  <button className="cf-folder-del"
                    onClick={e => { e.stopPropagation(); handleDeleteCase(c.id, c.caseName); }}>Delete</button>
                </div>
                <div className="cf-folder-name">{c.caseName}</div>
                <div className="cf-folder-type" style={{ color: caseTypeColor(c.caseType) }}>{c.caseType}</div>
                {c.clientName && <div className="cf-folder-client">{c.clientName}{c.clientPhone ? ` · ${c.clientPhone}` : ''}</div>}
                {c.description && <div className="cf-folder-desc">{c.description}</div>}
                <div className="cf-folder-sections">
                  {SECTIONS.map(s => <span key={s.key} className="cf-folder-sec-dot">{s.label.split(' ')[0]}</span>)}
                </div>
                <div className="cf-folder-date">Cloudinary - {formatDate(c.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ChatWidget />
    </div>
  );

  // CREATE
  if (view === 'create') return (
    <div className="cf-container">
      <Navbar />
      <div className="cf-body">
        <div className="cf-page-header">
          <div>
            <button className="cf-back-btn" onClick={() => { setView('list'); setError(''); }}>Back to Cases</button>
            <h2>New Case Folder</h2>
            <p>Files will be stored in Cloudinary</p>
          </div>
        </div>
        {error && <div className="cf-alert error">{error}</div>}
        <div className="cf-create-layout">
          <div className="cf-create-details">
            <h3 className="cf-create-section-title">Case Details</h3>
            <div className="cf-form-group">
              <label>Case Name *</label>
              <input type="text" placeholder="e.g. Road Accident - NH44 - Jan 2025"
                value={newCase.caseName} onChange={e => setNewCase({ ...newCase, caseName: e.target.value })} />
            </div>
            <div className="cf-form-group">
              <label>Case Type *</label>
              <select value={newCase.caseType} onChange={e => setNewCase({ ...newCase, caseType: e.target.value })}>
                {CASE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="cf-form-group">
              <label>Description (optional)</label>
              <textarea placeholder="Brief description of the case..."
                value={newCase.description} rows={3}
                onChange={e => setNewCase({ ...newCase, description: e.target.value })} />
            </div>
            <div className="cf-form-group">
              <label>Client Name *</label>
              <input type="text" placeholder="e.g. Rajesh Kumar"
                value={newCase.clientName} onChange={e => setNewCase({ ...newCase, clientName: e.target.value })} />
            </div>
            <div className="cf-form-group">
              <label>Client Phone *</label>
              <input type="tel" placeholder="e.g. 9876543210"
                value={newCase.clientPhone} onChange={e => setNewCase({ ...newCase, clientPhone: e.target.value })} />
            </div>
            <div className="cf-form-group">
              <label>Client Email *</label>
              <input type="email" placeholder="e.g. client@gmail.com"
                value={newCase.clientEmail} onChange={e => setNewCase({ ...newCase, clientEmail: e.target.value })} />
            </div>
            <div className="cf-create-summary-box">
              <div className="cf-create-summary-title">Files selected</div>
              {SECTIONS.filter(s => !s.isNotes).map(s => (
                <div key={s.key} className="cf-create-summary-row">
                  <span>{s.label}</span>
                  <span className={`cf-create-count ${selectedFiles[s.key].length > 0 ? 'has-files' : ''}`}>
                    {selectedFiles[s.key].length} file{selectedFiles[s.key].length !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
            <div className="cf-form-actions">
              <button className="cf-cancel-btn" onClick={() => setView('list')}>Cancel</button>
              <button className="cf-create-btn" onClick={handleCreateCase}
                disabled={creating || !newCase.caseName.trim()}>
                {creating ? 'Uploading...' : `Create${totalSelected > 0 ? ` & Upload ${totalSelected} File${totalSelected !== 1 ? 's' : ''}` : ''}`}
              </button>
            </div>
          </div>
          <div className="cf-create-uploads">
            <h3 className="cf-create-section-title">Upload Documents</h3>
            <p className="cf-create-upload-hint">Files will be stored in Cloudinary</p>
            {SECTIONS.filter(s => !s.isNotes).map(s => (
              <div key={s.key} className="cf-upload-zone">
                <div className="cf-upload-zone-header">
                  <div>
                    <div className="cf-upload-zone-label">{s.label}</div>
                    <div className="cf-upload-zone-desc">{s.desc}</div>
                  </div>
                  <button className="cf-upload-zone-btn" onClick={() => fileRefs.current[s.key].click()}>
                    Add Files
                  </button>
                  <input type="file" accept={s.accept} multiple style={{ display: 'none' }}
                    ref={el => fileRefs.current[s.key] = el}
                    onChange={e => handleSelectFiles(s.key, e.target.files)} />
                </div>
                {selectedFiles[s.key].length > 0 && (
                  <div className="cf-selected-files">
                    {selectedFiles[s.key].map((file, idx) => (
                      <div key={idx} className="cf-selected-file">
                        <span className="cf-selected-file-name">{file.name}</span>
                        <button className="cf-selected-file-remove" onClick={() => handleRemoveFile(s.key, idx)}>X</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <ChatWidget />
    </div>
  );

  // FOLDER VIEW
  return (
    <div className="cf-container">
      <Navbar />
      <div className="cf-body">
        <div className="cf-breadcrumb">
          <button className="cf-back-btn" onClick={() => { setView('list'); setOpenCase(null); }}>All Cases</button>
          <span className="cf-breadcrumb-sep">›</span>
          <span className="cf-breadcrumb-current">{openCase?.caseName}</span>
          <span className="cf-case-type-tag"
            style={{ background: caseTypeColor(openCase?.caseType) + '22', color: caseTypeColor(openCase?.caseType) }}>
            {openCase?.caseType}
          </span>
          <span className="cf-firebase-badge">Cloudinary</span>
          <button className="cf-phone-edit" style={{ marginLeft: 'auto' }}
            onClick={() => {
              setEditForm({
                caseName: openCase.caseName, caseType: openCase.caseType,
                description: openCase.description || '', clientName: openCase.clientName || '',
                clientPhone: openCase.clientPhone || '', clientEmail: openCase.clientEmail || ''
              });
              setEditModal(true); setError(''); setSuccess('');
            }}>Edit Details</button>
        </div>
        {openCase?.description && <div className="cf-case-desc-bar">{openCase.description}</div>}
        {(openCase?.clientName || openCase?.clientPhone) && (
          <div className="cf-case-client-bar">
            <strong>{openCase.clientName}</strong>
            {editingPhone ? (
              <>
                <span style={{ color: '#888', margin: '0 4px' }}>·</span>
                <input
                  className="cf-phone-input"
                  type="tel"
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSavePhone(); if (e.key === 'Escape') setEditingPhone(false); }}
                  autoFocus
                />
                <button className="cf-phone-save" onClick={handleSavePhone}>Save</button>
                <button className="cf-phone-cancel" onClick={() => setEditingPhone(false)}>✕</button>
              </>
            ) : (
              <>
                {openCase.clientPhone && <span style={{ color: '#555' }}>· {openCase.clientPhone}</span>}
                {openCase.clientEmail && <span style={{ color: '#555' }}>· {openCase.clientEmail}</span>}
                <button className="cf-phone-edit" onClick={() => { setPhoneInput(openCase.clientPhone || ''); setEditingPhone(true); setError(''); setSuccess(''); }} title="Edit phone">Edit</button>
              </>
            )}
            {!editingPhone && openCase.clientPhone && (
              <button className="cf-notify-btn" onClick={() => { setNotifyModal(true); setError(''); setSuccess(''); }}>
                Notify Client
              </button>
            )}
          </div>
        )}
        {editModal && (
          <div className="cf-modal-overlay" onClick={() => setEditModal(false)}>
            <div className="cf-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, width: '95%' }}>
              <div className="cf-modal-head">
                <h3>Edit Case Details</h3>
                <button onClick={() => setEditModal(false)}>✕</button>
              </div>
              <div className="cf-modal-body">
                {error && <div className="cf-alert error" style={{ marginBottom: 12 }}>{error}</div>}
                <div className="cf-form-group">
                  <label>Case Name *</label>
                  <input type="text" value={editForm.caseName || ''}
                    onChange={e => setEditForm({ ...editForm, caseName: e.target.value })} />
                </div>
                <div className="cf-form-group">
                  <label>Case Type</label>
                  <select value={editForm.caseType || ''}
                    onChange={e => setEditForm({ ...editForm, caseType: e.target.value })}>
                    {CASE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="cf-form-group">
                  <label>Description</label>
                  <textarea rows={3} value={editForm.description || ''}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
                <div className="cf-form-group">
                  <label>Client Name</label>
                  <input type="text" value={editForm.clientName || ''}
                    onChange={e => setEditForm({ ...editForm, clientName: e.target.value })} />
                </div>
                <div className="cf-form-group">
                  <label>Client Phone</label>
                  <input type="tel" value={editForm.clientPhone || ''}
                    onChange={e => setEditForm({ ...editForm, clientPhone: e.target.value })} />
                </div>
                <div className="cf-form-group">
                  <label>Client Email</label>
                  <input type="email" value={editForm.clientEmail || ''}
                    onChange={e => setEditForm({ ...editForm, clientEmail: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '14px 20px' }}>
                <button className="cf-cancel-btn" onClick={() => setEditModal(false)}>Cancel</button>
                <button className="cf-create-btn" style={{ flex: 'unset', padding: '10px 24px' }}
                  onClick={handleSaveDetails} disabled={editSaving}>
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
        {notifyModal && (
          <div className="cf-modal-overlay" onClick={() => setNotifyModal(false)}>
            <div className="cf-modal cf-notify-modal" onClick={e => e.stopPropagation()}>
              <div className="cf-modal-head">
                <h3>Send Hearing Notification</h3>
                <button onClick={() => setNotifyModal(false)}>✕</button>
              </div>
              <div className="cf-modal-body">
                <p className="cf-notify-to">Email to: <strong>{openCase.clientEmail || 'No email on file'}</strong></p>
                {error && <div className="cf-alert error" style={{ marginBottom: 12 }}>{error}</div>}
                <div className="cf-form-group">
                  <label>Next Hearing Date *</label>
                  <input type="date" value={notifyForm.nextHearingDate}
                    onChange={e => setNotifyForm({ ...notifyForm, nextHearingDate: e.target.value })} />
                </div>
                <div className="cf-form-group" style={{ marginTop: 12 }}>
                  <label>Additional Message (optional)</label>
                  <textarea rows={3} placeholder="e.g. Please bring all original documents..."
                    value={notifyForm.message}
                    onChange={e => setNotifyForm({ ...notifyForm, message: e.target.value })} />
                </div>
              </div>
              <div className="cf-modal-disc" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '14px 20px' }}>
                <button className="cf-cancel-btn" onClick={() => setNotifyModal(false)}>Cancel</button>
                <button className="cf-create-btn" style={{ flex: 'unset', padding: '10px 24px' }}
                  onClick={handleSendNotification} disabled={notifySending}>
                  {notifySending ? 'Sending...' : 'Send Notification'}
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="cf-tabs">
          {SECTIONS.map(s => (
            <button key={s.key}
              className={`cf-tab ${activeSection === s.key ? 'active' : ''}`}
              onClick={() => { setActiveSection(s.key); setError(''); setSuccess(''); }}>
              <span className="cf-tab-label">{s.label}</span>
            </button>
          ))}
        </div>
        <div className="cf-section-panel">
          <div className="cf-section-top">
            <div className="cf-section-info">
              <div>
                <h3>{activeSec.label}</h3>
                <p>{activeSec.desc}</p>
              </div>
            </div>
            {activeSection === 'HEARING_NOTES' ? (
              <button className="cf-upload-btn" onClick={() => {
                setShowNoteForm(true); setEditingNote(null);
                setNoteForm({ title: '', hearingDate: '', content: '' }); setError(''); setSuccess('');
              }}>Add Note</button>
            ) : (
              <>
                <button className="cf-upload-btn" onClick={() => folderFileRef.current.click()} disabled={folderUploading}>
                  {folderUploading ? `Uploading ${uploadProgress}%` : 'Upload File'}
                </button>
                <input ref={folderFileRef} type="file" accept={activeSec.accept}
                  style={{ display: 'none' }} onChange={handleFolderUpload} />
              </>
            )}
          </div>
          {folderUploading && (
            <div className="cf-progress-wrap">
              <div className="cf-progress-bar">
                <div className="cf-progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
              <span>{uploadProgress}% uploading to Cloudinary</span>
            </div>
          )}
          {error   && <div className="cf-alert error">{error}</div>}
          {success && <div className="cf-alert success">{success}</div>}

          {activeSection === 'HEARING_NOTES' ? (
            <div className="cf-notes-panel">
              {showNoteForm ? (
                <div className="cf-note-form">
                  <h4>{editingNote ? 'Edit Note' : 'New Hearing Note'}</h4>
                  <div className="cf-form-group">
                    <label>Title *</label>
                    <input type="text" placeholder="e.g. First Hearing - Jan 2025"
                      value={noteForm.title}
                      onChange={e => setNoteForm({ ...noteForm, title: e.target.value })} />
                  </div>
                  <div className="cf-form-group">
                    <label>Hearing Date</label>
                    <input type="date"
                      value={noteForm.hearingDate}
                      onChange={e => setNoteForm({ ...noteForm, hearingDate: e.target.value })} />
                  </div>
                  <div className="cf-form-group">
                    <label>Notes *</label>
                    <textarea rows={6} placeholder="Write your hearing notes here..."
                      value={noteForm.content}
                      onChange={e => setNoteForm({ ...noteForm, content: e.target.value })} />
                  </div>
                  <div className="cf-form-actions">
                    <button className="cf-cancel-btn" onClick={() => {
                      setShowNoteForm(false); setEditingNote(null);
                      setNoteForm({ title: '', hearingDate: '', content: '' }); setError('');
                    }}>Cancel</button>
                    <button className="cf-create-btn" onClick={handleSaveNote} disabled={noteSaving}>
                      {noteSaving ? 'Saving...' : editingNote ? 'Update Note' : 'Save Note'}
                    </button>
                  </div>
                </div>
              ) : (
                hearingNotes.length === 0 ? (
                  <div className="cf-empty">
                    <p>No hearing notes yet</p>
                    <p className="cf-empty-sub">Click "Add Note" to record your first hearing</p>
                  </div>
                ) : (
                  <div className="cf-notes-list">
                    {hearingNotes.map(note => (
                      <div key={note.id} className="cf-note-card">
                        <div className="cf-note-header">
                          <div>
                            <div className="cf-note-title">{note.title}</div>
                            {note.hearingDate && <div className="cf-note-date">{note.hearingDate}</div>}
                          </div>
                          <div className="cf-note-actions">
                            <button className="cf-btn dl" onClick={() => handleEditNote(note)}>Edit</button>
                            <button className="cf-btn del" onClick={() => handleDeleteNote(note.id)}>Delete</button>
                          </div>
                        </div>
                        <div className="cf-note-content">{note.content}</div>
                        <div className="cf-note-meta">Added {formatDate(note.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          ) : (
            caseFiles.length === 0 ? (
              <div className="cf-empty">
                <p>No {activeSec.label} uploaded yet</p>
                <p className="cf-empty-sub">Click "Upload File" to add files</p>
              </div>
            ) : (
              <div className="cf-file-grid">
                {caseFiles.map((file, idx) => (
                  <div key={file.id || idx} className="cf-file-card">
                    <div className="cf-file-top">
                      <div className="cf-file-meta">
                        <div className="cf-file-name" title={file.fileName}>{file.fileName}</div>
                        <div className="cf-file-date">{formatDate(file.uploadedAt)}</div>
                        <div className="cf-firebase-tag">Cloudinary</div>
                      </div>
                    </div>
                    <div className="cf-file-actions">
                      <button className="cf-btn dl"
                        onClick={() => setPreviewFile({ fileName: file.fileName, url: file.s3Url || `${BACKEND_URL}/vault/download/${file.id}` })}>View</button>
                      <button className="cf-btn dl"
                        onClick={() => handleDownload(
                          file.s3Url || `${BACKEND_URL}/vault/download/${file.id}`,
                          file.fileName
                        )}>Download</button>
                      <button className="cf-btn del"
                        onClick={() => handleDeleteFile(file.id, file.fileName)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
      <ChatWidget />
      {previewFile && (
        <div className="cf-modal-overlay" onClick={() => setPreviewFile(null)}>
          <div className="cf-modal cf-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="cf-modal-head">
              <h3 style={{ fontSize: 14, maxWidth: '85%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {previewFile.fileName}
              </h3>
              <button onClick={() => setPreviewFile(null)}>✕</button>
            </div>
            <div className="cf-preview-body">
              {getFileType(previewFile.fileName) === 'video' && (
                <video controls style={{ width: '100%', maxHeight: '70vh', borderRadius: 8 }}>
                  <source src={previewFile.url} />
                  Your browser does not support video.
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
                  <button className="cf-upload-btn" style={{ marginTop: 16 }}
                    onClick={() => handleDownload(previewFile.url, previewFile.fileName)}>Download File</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
