/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Send, Users, CheckCircle2, XCircle, AlertCircle,
  X, Mail, AlignLeft, AtSign, Eye, EyeOff, Monitor
} from 'lucide-react';
import { api } from '../api';



function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function SendEmail() {
  const [templates, setTemplates]           = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [subject, setSubject]               = useState('');
  const [body, setBody]                     = useState('');
  const [recipients, setRecipients]         = useState([]);
  const [inputVal, setInputVal]             = useState('');
  const [sending, setSending]               = useState(false);
  const [alert, setAlert]                   = useState(null);
  const [results, setResults]               = useState([]);
  const [previewHtml, setPreviewHtml]       = useState('');
  const [showPreview, setShowPreview]       = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    api.getTemplates().then(res => setTemplates(res.templates || []));
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 6000);
  };

  const fetchPreview = async (subj, bod) => {
    if (!subj && !bod) return;
    setLoadingPreview(true);
    try {
      const res = await fetch('/api/preview-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subj, body: bod }),
      }).then(r => r.json());
      if (res.success) setPreviewHtml(res.html);
    } catch { /* ignore */ }
    finally { setLoadingPreview(false); }
  };

  const selectTemplate = (tpl) => {
    setSelectedTemplate(tpl.id);
    setSubject(tpl.subject);
    setBody(tpl.body);
    setResults([]);
    setShowPreview(false);
    fetchPreview(tpl.subject, tpl.body);
  };

  const addEmails = (raw) => {
    const parts = raw.split(/[,\n]+/).map(e => e.trim()).filter(Boolean);
    const added = [];
    parts.forEach(email => {
      if (!recipients.find(r => r.email === email)) {
        added.push({ email, valid: validateEmail(email) });
      }
    });
    if (added.length) setRecipients(prev => [...prev, ...added]);
  };

  const handleKeyDown = (e) => {
    if (['Enter', ',', 'Tab'].includes(e.key)) {
      e.preventDefault();
      if (inputVal.trim()) { addEmails(inputVal); setInputVal(''); }
    }
    if (e.key === 'Backspace' && !inputVal && recipients.length)
      setRecipients(prev => prev.slice(0, -1));
  };

  const handlePaste = (e) => {
    e.preventDefault();
    addEmails(e.clipboardData.getData('text'));
    setInputVal('');
  };

  const handleSend = async () => {
    if (!recipients.length) return showAlert('error', 'Please add at least one recipient.');
    const invalid = recipients.filter(r => !r.valid);
    if (invalid.length) return showAlert('error', `Fix invalid email(s): ${invalid.map(r => r.email).join(', ')}`);
    if (!subject.trim()) return showAlert('error', 'Email subject is required.');
    if (!body.trim())    return showAlert('error', 'Email body is required.');

    setSending(true); setResults([]);
    try {
      const res = await api.sendEmail({
        recipients: recipients.map(r => r.email),
        templateId: selectedTemplate,
        subject, body,
      });
      if (res.success) {
        setResults(res.results);
        const ok  = res.results.filter(r => r.status === 'Success').length;
        const bad = res.results.filter(r => r.status === 'Failed').length;
        showAlert(bad === 0 ? 'success' : 'warning',
          `${ok} sent successfully${bad > 0 ? `, ${bad} failed` : ''}.`);
      } else showAlert('error', res.message);
    } catch { showAlert('error', 'Send failed. Is the backend server running?'); }
    finally { setSending(false); }
  };

  const completedSteps = [
    selectedTemplate !== null,
    subject.trim() !== '' && body.trim() !== '',
    recipients.length > 0 && recipients.every(r => r.valid),
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="page-header-icon">
            <Send size={22} />
          </div>
          <div>
            <h1>Send Email</h1>
            <p>Select a template, compose your message, add recipients, and send.</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 28, alignItems: 'center'
      }}>
        {['Select Template', 'Compose', 'Recipients'].map((s, i) => (
          <React.Fragment key={s}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              opacity: completedSteps[i] ? 1 : 0.5
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: completedSteps[i] ? 'var(--gradient-brand)' : 'var(--bg-elevated)',
                border: `1px solid ${completedSteps[i] ? 'transparent' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: completedSteps[i] ? '#fff' : 'var(--text-dim)',
                boxShadow: completedSteps[i] ? '0 2px 8px rgba(99,132,255,0.35)' : 'none',
                transition: 'all 0.3s ease',
              }}>
                {completedSteps[i] ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: completedSteps[i] ? 'var(--accent)' : 'var(--text-dim)' }}>
                {s}
              </span>
            </div>
            {i < 2 && (
              <div style={{
                flex: 1, height: 1,
                background: completedSteps[i] ? 'var(--accent)' : 'var(--border)',
                transition: 'background 0.3s ease',
                maxWidth: 60,
              }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          <span className="alert-icon">
            {alert.type === 'success' ? <CheckCircle2 size={17} /> :
             alert.type === 'warning' ? <AlertCircle size={17} /> :
             <XCircle size={17} />}
          </span>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Step 1: Templates */}
      <div className="card">
        <div className="step-header">
          <div className="step-number">1</div>
          <div>
            <div className="step-title">Select Email Template</div>
            <div className="step-subtitle">Choose a predefined template to get started</div>
          </div>
        </div>
        <div className="templates-grid">
          {templates.map(tpl => (
              <div key={tpl.id} id={`template-${tpl.id}`}
                className={`template-card ${selectedTemplate === tpl.id ? 'selected' : ''}`}
                onClick={() => selectTemplate(tpl)}>
                {selectedTemplate === tpl.id && (
                  <div className="template-check">
                    <CheckCircle2 size={12} color="#fff" />
                  </div>
                )}
                <div className="template-card-icon">
                  <FileText size={18} />
                </div>
                <div className="template-card-name">{tpl.name}</div>
                <div className="template-card-subject">{tpl.subject}</div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Step 2: Edit Content */}
      {selectedTemplate && (
        <div className="card" style={{ animation: 'alertIn 0.3s ease' }}>
          <div className="step-header">
            <div className="step-number">2</div>
            <div>
              <div className="step-title">Compose Message</div>
              <div className="step-subtitle">Edit the subject and body — replace placeholders with real values</div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label htmlFor="email-subject"><Mail size={11} /> Subject Line</label>
            <div className="input-wrapper has-icon">
              <span className="input-icon"><Mail size={14} /></span>
              <input id="email-subject" type="text"
                value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="Enter email subject…" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email-body">
              <AlignLeft size={11} /> Email Body
              <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-dim)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                · Replace <code style={{ color: 'var(--accent)', background: 'var(--accent-soft)', padding: '1px 5px', borderRadius: 3 }}>{'{{name}}'}</code> with actual values
              </span>
            </label>
            <textarea id="email-body" rows={10}
              value={body} onChange={e => setBody(e.target.value)}
              placeholder="Email body…" />
          </div>

          {/* Preview Toggle Button */}
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              id="preview-email-btn"
              className="btn btn-secondary btn-sm"
              onClick={async () => {
                if (!showPreview) { await fetchPreview(subject, body); }
                setShowPreview(p => !p);
              }}
              disabled={loadingPreview}
            >
              {loadingPreview
                ? <><span className="spinner" /> Generating…</>
                : showPreview
                  ? <><EyeOff size={14} /> Hide Preview</>
                  : <><Eye size={14} /> Preview Email</>
              }
            </button>
            {previewHtml && !showPreview && (
              <span style={{ fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle2 size={13} /> Preview ready
              </span>
            )}
          </div>

          {/* HTML Preview Iframe */}
          {showPreview && previewHtml && (
            <div style={{ marginTop: 16, animation: 'alertIn 0.3s ease' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                padding: '10px 14px',
                background: 'linear-gradient(135deg, rgba(99,132,255,0.08), rgba(139,92,246,0.08))',
                border: '1px solid rgba(99,132,255,0.2)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <Monitor size={15} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)' }}>
                  Live Email Preview — Web Digital Mantra Branded Template
                </span>
                <span style={{
                  marginLeft: 'auto', fontSize: 11, color: 'var(--text-dim)',
                  background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 99,
                  border: '1px solid var(--border)'
                }}>
                  Actual email appearance
                </span>
              </div>
              <div style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}>
                {/* Browser chrome */}
                <div style={{
                  background: 'var(--bg-elevated)', padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['#f87171','#fbbf24','#34d399'].map(c => (
                      <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                    ))}
                  </div>
                  <div style={{
                    flex: 1, background: 'var(--bg-primary)', borderRadius: 4,
                    padding: '4px 12px', fontSize: 11, color: 'var(--text-dim)',
                    fontFamily: 'monospace', border: '1px solid var(--border)'
                  }}>
                    📧 Email Client Preview
                  </div>
                </div>
                <iframe
                  title="Email Preview"
                  srcDoc={previewHtml}
                  style={{
                    width: '100%', height: 620, border: 'none',
                    background: '#f0f4f8', display: 'block',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}


      {/* Step 3: Recipients */}
      {selectedTemplate && (
        <div className="card" style={{ animation: 'alertIn 0.3s ease' }}>
          <div className="step-header">
            <div className="step-number">3</div>
            <div>
              <div className="step-title">Add Recipients</div>
              <div className="step-subtitle">Type or paste email addresses</div>
            </div>
            {recipients.length > 0 && (
              <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>
                <Users size={11} /> {recipients.length} added
              </span>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 10 }}>
            <label><AtSign size={11} /> Email Addresses</label>
            <div className="tag-input-wrapper"
              onClick={() => inputRef.current?.focus()}>
              {recipients.map(r => (
                <span key={r.email} className={`email-tag ${r.valid ? '' : 'invalid'}`}>
                  {!r.valid && <AlertCircle size={11} />}
                  {r.email}
                  <button className="tag-remove"
                    onClick={e => { e.stopPropagation(); setRecipients(p => p.filter(x => x.email !== r.email)); }}>
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input ref={inputRef} className="tag-input"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onBlur={() => { if (inputVal.trim()) { addEmails(inputVal); setInputVal(''); } }}
                placeholder={recipients.length === 0 ? 'Type email and press Enter or comma…' : ''} />
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            Press <kbd>Enter</kbd> or <kbd>,</kbd> to add · Paste multiple comma-separated emails at once
          </p>

          <div className="btn-group">
            <button id="send-email-btn" className="btn btn-success"
              onClick={handleSend}
              disabled={sending || recipients.length === 0 || !completedSteps[2]}>
              {sending
                ? <><span className="spinner" /> Sending…</>
                : <><Send size={15} /> Send to {recipients.length} Recipient{recipients.length !== 1 ? 's' : ''}</>}
            </button>
            {recipients.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => setRecipients([])}>
                <X size={13} /> Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="card" style={{ animation: 'alertIn 0.3s ease' }}>
          <div className="card-header">
            <div className="card-title">
              <div className="card-title-icon"><CheckCircle2 size={15} /></div>
              Send Results
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="badge badge-success">
                <CheckCircle2 size={11} /> {results.filter(r => r.status === 'Success').length} Success
              </span>
              {results.filter(r => r.status === 'Failed').length > 0 && (
                <span className="badge badge-danger">
                  <XCircle size={11} /> {results.filter(r => r.status === 'Failed').length} Failed
                </span>
              )}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-dim)', width: 40 }}>{i + 1}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{r.email}</td>
                    <td>
                      <span className={`badge ${r.status === 'Success' ? 'badge-success' : 'badge-danger'}`}>
                        {r.status === 'Success' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        {r.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.error || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
