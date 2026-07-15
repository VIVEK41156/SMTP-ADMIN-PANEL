import React, { useState, useEffect } from 'react';
import {
  LayoutTemplate, FileText, Eye, Mail, AlignLeft,
  ChevronRight, Info
} from 'lucide-react';
import { api } from '../api';

const TEMPLATE_LUCIDE = {
  welcome:            <Mail size={18} />,
  password_reset:     <FileText size={18} />,
  order_confirmation: <FileText size={18} />,
  newsletter:         <AlignLeft size={18} />,
  invoice:            <FileText size={18} />,
  custom:             <FileText size={18} />,
};

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    api.getTemplates().then(res => setTemplates(res.templates || []));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="page-header-icon">
            <LayoutTemplate size={22} />
          </div>
          <div>
            <h1>Email Templates</h1>
            <p>Browse and preview all predefined email templates.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Template List */}
        <div className="card" style={{ padding: 16 }}>
          <div className="card-title" style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <div className="card-title-icon"><LayoutTemplate size={15} /></div>
            Templates
            <span className="badge badge-accent" style={{ marginLeft: 'auto', fontSize: 11 }}>
              {templates.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {templates.map(tpl => (
              <button key={tpl.id} id={`preview-template-${tpl.id}`}
                onClick={() => setSelected(tpl)}
                className={`nav-btn ${selected?.id === tpl.id ? 'active' : ''}`}
                style={{ borderRadius: 'var(--radius-sm)', padding: '10px 12px', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 'var(--radius-xs)',
                  background: selected?.id === tpl.id ? 'rgba(99,132,255,0.2)' : 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: selected?.id === tpl.id ? 'var(--accent)' : 'var(--text-dim)',
                  flexShrink: 0, transition: 'all 0.2s ease',
                }}>
                  {TEMPLATE_LUCIDE[tpl.id] || <FileText size={15} />}
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{tpl.name}</div>
                  <div style={{
                    fontSize: 11, color: 'var(--text-dim)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {tpl.subject}
                  </div>
                </div>
                {selected?.id === tpl.id && (
                  <ChevronRight size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="card">
          {selected ? (
            <>
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <div className="card-title-icon"><Eye size={15} /></div>
                    {selected.name}
                  </div>
                  <div className="card-subtitle">Template preview — read only</div>
                </div>
                <span className="readonly-badge">Read Only</span>
              </div>

              {/* Subject */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={11} /> Subject Line
                </label>
                <div className="input-wrapper has-icon">
                  <span className="input-icon"><Mail size={14} /></span>
                  <input type="text" readOnly value={selected.subject}
                    style={{ cursor: 'default', opacity: 0.75 }} />
                </div>
              </div>

              {/* Body */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label><AlignLeft size={11} /> Email Body</label>
                <textarea readOnly value={selected.body}
                  style={{
                    minHeight: 280, fontFamily: 'monospace',
                    fontSize: 12.5, cursor: 'default', opacity: 0.75,
                    lineHeight: 1.75
                  }} />
              </div>

              {/* CTA Banner */}
              <div className="info-banner">
                <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  Want to send this template? Go to{' '}
                  <strong>Send Email</strong> in the sidebar — you can select it there and{' '}
                  <strong>edit the subject & body</strong> before sending.
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Eye size={28} />
              </div>
              <h3>Select a Template</h3>
              <p>Click any template on the left to preview it here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
