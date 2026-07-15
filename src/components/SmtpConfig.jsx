import React, { useState, useEffect } from 'react';
import {
  Server, Hash, User, Lock, ShieldCheck, Mail, UserCircle,
  Save, Plug, Eye, EyeOff, CheckCircle2, AlertCircle, Pencil, Info
} from 'lucide-react';
import { api } from '../api';

export default function SmtpConfig({ onConfigSaved }) {
  const [form, setForm] = useState({
    host: '', port: '587', username: '', password: '',
    encryption: 'TLS', senderName: '', senderEmail: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [testing, setTesting]   = useState(false);
  const [alert, setAlert]       = useState(null);
  const [isEditing, setIsEditing] = useState(true);

  useEffect(() => {
    api.getSmtpConfig().then(res => {
      if (res.config) { setForm(res.config); setIsEditing(false); }
    }).catch(() => {});
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const validate = () => {
    const { host, port, username, password, senderEmail } = form;
    if (!host.trim())        return 'SMTP Host is required.';
    if (!port || isNaN(port)) return 'SMTP Port must be a valid number.';
    if (!username.trim())    return 'SMTP Username is required.';
    if (!password.trim())    return 'SMTP Password is required.';
    if (!senderEmail.trim()) return 'Sender Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) return 'Sender Email is invalid.';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) return showAlert('error', err);
    setLoading(true);
    try {
      const res = await api.saveSmtpConfig(form);
      if (res.success) {
        showAlert('success', res.message);
        setIsEditing(false);
        onConfigSaved && onConfigSaved(true);
      } else showAlert('error', res.message);
    } catch { showAlert('error', 'Failed to save. Is the server running?'); }
    finally { setLoading(false); }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await api.testSmtp();
      showAlert(res.success ? 'success' : 'error', res.message);
    } catch { showAlert('error', 'Test failed. Is the backend server running?'); }
    finally { setTesting(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-inner">
          <div className="page-header-icon">
            <Server size={22} />
          </div>
          <div>
            <h1>SMTP Configuration</h1>
            <p>Configure your outgoing mail server settings securely.</p>
          </div>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          <span className="alert-icon">
            {alert.type === 'success' ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
          </span>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Configured Banner */}
      {!isEditing && (
        <div className="info-banner" style={{ marginBottom: 20 }}>
          <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            SMTP is currently configured. Click <strong>Edit Settings</strong> below to make changes.
          </span>
        </div>
      )}

      {/* Config Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <div className="card-title-icon"><Server size={15} /></div>
              Server Settings
            </div>
            <div className="card-subtitle">Enter your SMTP server credentials</div>
          </div>
          {!isEditing && (
            <button id="edit-smtp-btn" className="btn btn-ghost btn-sm" onClick={() => setIsEditing(true)}>
              <Pencil size={14} /> Edit Settings
            </button>
          )}
        </div>

        <div className="form-grid">
          {/* Host */}
          <div className="form-group">
            <label htmlFor="smtp-host"><Server size={11} /> SMTP Host</label>
            <div className="input-wrapper has-icon">
              <span className="input-icon"><Server size={14} /></span>
              <input id="smtp-host" type="text" placeholder="smtp.gmail.com"
                value={form.host} disabled={!isEditing}
                onChange={e => set('host', e.target.value)} />
            </div>
          </div>

          {/* Port */}
          <div className="form-group">
            <label htmlFor="smtp-port"><Hash size={11} /> SMTP Port</label>
            <div className="input-wrapper has-icon">
              <span className="input-icon"><Hash size={14} /></span>
              <input id="smtp-port" type="number" placeholder="587"
                value={form.port} disabled={!isEditing}
                onChange={e => set('port', e.target.value)} />
            </div>
          </div>

          {/* Username */}
          <div className="form-group">
            <label htmlFor="smtp-user"><User size={11} /> SMTP Username</label>
            <div className="input-wrapper has-icon">
              <span className="input-icon"><User size={14} /></span>
              <input id="smtp-user" type="text" placeholder="your@email.com"
                value={form.username} disabled={!isEditing}
                onChange={e => set('username', e.target.value)} />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="smtp-pass"><Lock size={11} /> SMTP Password</label>
            <div className="input-wrapper has-icon">
              <span className="input-icon"><Lock size={14} /></span>
              <input id="smtp-pass"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={form.password} disabled={!isEditing}
                onChange={e => set('password', e.target.value)}
                style={{ paddingRight: 42 }} />
              <button type="button" className="eye-btn" onClick={() => setShowPass(s => !s)}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Encryption */}
          <div className="form-group">
            <label htmlFor="smtp-enc"><ShieldCheck size={11} /> Encryption Type</label>
            <div className="input-wrapper has-icon">
              <span className="input-icon"><ShieldCheck size={14} /></span>
              <select id="smtp-enc" value={form.encryption} disabled={!isEditing}
                onChange={e => set('encryption', e.target.value)}>
                <option value="TLS">TLS (Recommended)</option>
                <option value="SSL">SSL</option>
                <option value="None">None</option>
              </select>
            </div>
          </div>

          {/* Sender Name */}
          <div className="form-group">
            <label htmlFor="smtp-sender-name"><UserCircle size={11} /> Sender Name</label>
            <div className="input-wrapper has-icon">
              <span className="input-icon"><UserCircle size={14} /></span>
              <input id="smtp-sender-name" type="text" placeholder="My Application"
                value={form.senderName} disabled={!isEditing}
                onChange={e => set('senderName', e.target.value)} />
            </div>
          </div>

          {/* Sender Email */}
          <div className="form-group full-width">
            <label htmlFor="smtp-sender-email"><Mail size={11} /> Sender Email</label>
            <div className="input-wrapper has-icon">
              <span className="input-icon"><Mail size={14} /></span>
              <input id="smtp-sender-email" type="email" placeholder="noreply@myapp.com"
                value={form.senderEmail} disabled={!isEditing}
                onChange={e => set('senderEmail', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="btn-group">
          {isEditing ? (
            <>
              <button id="save-smtp-btn" className="btn btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? <><span className="spinner" /> Saving…</> : <><Save size={15} /> Save Configuration</>}
              </button>
              {form.host && (
                <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              )}
            </>
          ) : null}

          <button id="test-smtp-btn" className="btn btn-secondary" onClick={handleTest}
            disabled={testing || !form.host}>
            {testing
              ? <><span className="spinner" /> Testing Connection…</>
              : <><Plug size={15} /> Test Connection</>}
          </button>
        </div>
      </div>

      {/* Tips Card */}
      <div className="card" style={{ borderColor: 'rgba(251,191,36,0.15)', background: 'rgba(251,191,36,0.04)' }}>
        <div className="card-title" style={{ color: 'var(--warning)', marginBottom: 14 }}>
          <div className="card-title-icon" style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <Info size={15} style={{ color: 'var(--warning)' }} />
          </div>
          Quick Reference
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { provider: 'Gmail',   host: 'smtp.gmail.com',       port: '587', enc: 'TLS' },
            { provider: 'Outlook', host: 'smtp.office365.com',   port: '587', enc: 'TLS' },
            { provider: 'Yahoo',   host: 'smtp.mail.yahoo.com',  port: '587', enc: 'TLS' },
            { provider: 'Mailtrap',host: 'sandbox.smtp.mailtrap.io', port: '2525', enc: 'TLS' },
          ].map(p => (
            <div key={p.provider} style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px'
            }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>{p.provider}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                <div>Host: <span style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{p.host}</span></div>
                <div>Port: <span style={{ color: 'var(--accent)' }}>{p.port}</span> · {p.enc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
