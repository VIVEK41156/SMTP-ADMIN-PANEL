import React, { useState, useEffect } from 'react';
import './index.css';
import { api } from './api';
import {
  Server, LayoutTemplate, Send, ClipboardList,
  Mail, Wifi, WifiOff, Zap
} from 'lucide-react';
import SmtpConfig from './components/SmtpConfig';
import SendEmail  from './components/SendEmail';
import Templates  from './components/Templates';
import EmailLogs  from './components/EmailLogs';
import Preloader  from './components/Preloader';

const NAV = [
  { id: 'smtp',      label: 'SMTP Config',      sub: 'Server settings',  Icon: Server },
  { id: 'templates', label: 'Templates',         sub: 'Browse templates', Icon: LayoutTemplate },
  { id: 'send',      label: 'Send Email',        sub: 'Compose & send',   Icon: Send },
  { id: 'logs',      label: 'Email Logs',        sub: 'History & status', Icon: ClipboardList },
];

export default function App() {
  const [page, setPage]               = useState('smtp');
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    api.getSmtpConfig()
      .then(res => setSmtpConfigured(!!res.config))
      .catch(() => {});
  }, []);

  const renderPage = () => {
    switch (page) {
      case 'smtp':      return <SmtpConfig onConfigSaved={setSmtpConfigured} />;
      case 'templates': return <Templates />;
      case 'send':      return <SendEmail />;
      case 'logs':      return <EmailLogs />;
      default:          return <SmtpConfig onConfigSaved={setSmtpConfigured} />;
    }
  };

  return (
    <>
      {isAppLoading && <Preloader onFinish={() => setIsAppLoading(false)} />}
      
      <div className="app-shell" style={{ opacity: isAppLoading ? 0 : 1, transition: 'opacity 0.5s ease' }}>
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-logo">
            <Mail size={20} color="#fff" />
          </div>
          <h2>SMTP Admin</h2>
          <p>Email Configuration Panel</p>
        </div>

        {/* Nav */}
        <nav className="nav-section">
          <div className="nav-section-label">Main Menu</div>
          {NAV.map(({ id, label, sub, Icon }) => (
            <button key={id} id={`nav-${id}`}
              className={`nav-btn ${page === id ? 'active' : ''}`}
              onClick={() => setPage(id)}>
              <Icon size={17} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left' }}>
                <span style={{ fontSize: 13.5, lineHeight: 1 }}>{label}</span>
                <span style={{ fontSize: 10.5, color: page === id ? 'rgba(99,132,255,0.7)' : 'var(--text-dim)', lineHeight: 1, fontWeight: 400 }}>
                  {sub}
                </span>
              </div>
            </button>
          ))}
        </nav>

        {/* Footer Status */}
        <div className="sidebar-footer">
          <div className="smtp-status-card">
            {smtpConfigured
              ? <Wifi size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
              : <WifiOff size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
            }
            <div className="smtp-status-text">
              <div className="label">
                {smtpConfigured ? 'SMTP Ready' : 'Not Configured'}
              </div>
              <div className="sub">
                {smtpConfigured ? 'Server connected' : 'Setup required'}
              </div>
            </div>
            <div className={`status-dot ${smtpConfigured ? 'configured' : 'not-configured'}`}
              style={{ marginLeft: 'auto' }} />
          </div>

          <div style={{
            marginTop: 12, padding: '8px 12px',
            background: 'var(--gradient-brand-soft)',
            border: '1px solid rgba(99,132,255,0.15)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <Zap size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Powered by <strong style={{ color: 'var(--accent)' }}>Nodemailer</strong>
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────── */}
      <main className="main-content">
        {renderPage()}
      </main>

      {/* ── Mobile Bottom Navigation ──────────────────────── */}
      <nav className="mobile-bottom-nav">
        {NAV.map(({ id, label, Icon }) => (
          <button key={`mob-${id}`}
            className={`mob-nav-btn ${page === id ? 'active' : ''}`}
            onClick={() => setPage(id)}>
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  </>
  );
}
