import React, { useState, useRef, useEffect } from 'react';
import './ChatWidget.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export default function ChatWidget() {
  const [open,    setOpen]    = useState(false);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I\'m your Legal AI assistant. Ask me anything about Indian law, IPC sections, or your case.' }
  ]);
  const bottomRef = useRef();

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.response || data.message || 'No response.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: '⚠️ Could not connect to AI. Make sure the backend is running.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  return (
    <div className="cw-wrap">
      {open && (
        <div className="cw-panel">
          <div className="cw-header">
            <div className="cw-header-info">
              <div className="cw-header-avatar">⚖️</div>
              <div>
                <div className="cw-header-title">Legal AI</div>
                <div className="cw-header-sub">Ask anything about Indian law</div>
              </div>
            </div>
            <button className="cw-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="cw-messages">
            {messages.map((m, i) => (
              <div key={i} className={`cw-msg ${m.role}`}>
                {m.role === 'bot' && <div className="cw-bot-avatar">⚖️</div>}
                <div className="cw-bubble">
                  {m.text.split('\n').map((line, j) => <span key={j}>{line}<br /></span>)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="cw-msg bot">
                <div className="cw-bot-avatar">⚖️</div>
                <div className="cw-bubble cw-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="cw-input-row">
            <textarea
              className="cw-input"
              rows={1}
              placeholder="Ask a legal question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button className="cw-send" onClick={sendMessage} disabled={loading || !input.trim()}>
              ➤
            </button>
          </div>
          <div className="cw-disclaimer">Not legal advice. Consult a qualified lawyer.</div>
        </div>
      )}

      <button className="cw-fab" onClick={() => setOpen(o => !o)} title="Legal AI Chat">
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}
