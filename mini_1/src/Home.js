import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

const WELCOME_MSG = {
  from: 'bot',
  text: 'Hello! I am your Indian Legal AI Assistant.\n\nI can help you with:\n- IPC sections & punishments\n- Road accident laws\n- Theft, fraud, domestic violence\n- Motor Vehicles Act\n- IT Act violations\n\nAsk me anything like: "punishment for rash driving"'
};

const SUGGESTIONS = ['Punishment for rash driving', 'What is IPC 420?', 'Domestic violence law', 'Motor Vehicles Act fine'];

export default function Home() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const [profileOpen, setProfileOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const sendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    setMessages(prev => [...prev, { from: 'user', text: trimmed }]);
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(prev => [...prev, { from: 'bot', text: data.response || data.reply || 'No response.' }]);
    } catch {
      setMessages(prev => [...prev, {
        from: 'bot',
        text: `Could not reach the server.\n\nMake sure:\n1. Backend is running\n2. Ollama is running: ollama run llama3`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderText = (text) =>
    text.split('\n').map((line, i) => (
      <span key={i}>{line}{i < text.split('\n').length - 1 && <br />}</span>
    ));

  return (
    <div className="chat-page">
      <nav className="chat-nav">
        <span className="chat-brand" onClick={() => navigate('/dashboard')}>LexAssist</span>
        <div className="chat-nav-links">
          <button className="chat-nav-btn" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button className="chat-nav-btn" onClick={() => navigate('/casefiles')}>Case Files</button>
          <button className="chat-nav-btn" onClick={() => navigate('/vault')}>Vault</button>
          <button className="chat-nav-btn active">AI Chat</button>
        </div>
        <div className="chat-nav-profile-wrap">
          <button className="chat-nav-profile-btn" onClick={() => setProfileOpen(o => !o)}>
            <span className="chat-nav-avatar">{username?.charAt(0).toUpperCase()}</span>
            <span>{username}</span>
            <span style={{ fontSize: 9, opacity: 0.8 }}>{profileOpen ? '▲' : '▼'}</span>
          </button>
          {profileOpen && (
            <div className="chat-nav-dropdown">
              <button className="chat-dd-item" onClick={() => { setProfileOpen(false); navigate('/profile'); }}>Edit Profile</button>
              <button className="chat-dd-item" onClick={() => { setProfileOpen(false); navigate('/profile'); }}>Change Password</button>
              <div className="chat-dd-divider" />
              <button className="chat-dd-item logout" onClick={() => { localStorage.clear(); navigate('/'); }}>Logout</button>
            </div>
          )}
        </div>
      </nav>

      <div className="chat-page-body">
        <div className="chat-page-sidebar">
          <div className="chat-sidebar-header">
            <div className="chat-sidebar-icon">⚖️</div>
            <div className="chat-sidebar-title">Legal AI Assistant</div>
            <div className="chat-sidebar-sub">Indian Law · IPC Sections</div>
          </div>
          <div className="chat-sidebar-section">
            <div className="chat-sidebar-label">Quick Questions</div>
            {SUGGESTIONS.map(q => (
              <button key={q} className="chat-sidebar-chip"
                onClick={() => { setMessage(q); inputRef.current?.focus(); }}>
                {q}
              </button>
            ))}
          </div>
          <div className="chat-sidebar-section">
            <div className="chat-sidebar-label">Topics Covered</div>
            {['IPC Sections', 'Motor Vehicles Act', 'IT Act', 'Domestic Violence', 'Property Law', 'Cyber Crime'].map(t => (
              <div key={t} className="chat-sidebar-topic">• {t}</div>
            ))}
          </div>
          <button className="chat-sidebar-clear" onClick={() => setMessages([WELCOME_MSG])}>
            Clear Chat
          </button>
          <div className="chat-sidebar-disclaimer">
            For legal awareness only. Not legal advice. Consult a qualified lawyer.
          </div>
        </div>

        <div className="chat-page-main">
          <div className="chat-page-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-row ${msg.from}`}>
                {msg.from === 'bot' && <div className="chat-av bot-av">AI</div>}
                <div className={`chat-bubble ${msg.from}`}>
                  {renderText(msg.text)}
                </div>
                {msg.from === 'user' && <div className="chat-av user-av">You</div>}
              </div>
            ))}
            {loading && (
              <div className="chat-row bot">
                <div className="chat-av bot-av">AI</div>
                <div className="chat-bubble bot loading-bubble">
                  <span className="dot" /><span className="dot" /><span className="dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-page-input">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about IPC sections, punishments, legal rights..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              disabled={loading}
            />
            <button onClick={sendMessage} disabled={loading || !message.trim()} className="chat-send-btn">
              {loading ? '...' : '➤'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
