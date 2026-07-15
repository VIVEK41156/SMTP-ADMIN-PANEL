import React, { useState, useEffect } from 'react';
import {
  ClipboardList, CheckCircle2, XCircle, RotateCcw,
  Trash2, Mail, FileText, Calendar, TrendingUp
} from 'lucide-react';
import { api } from '../api';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

export default function EmailLogs() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [filter, setFilter]   = useState('All');
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchLogs = () => {
    setLoading(true);
    api.getLogs()
      .then(res => {
        setLogs(res.logs || []);
        setSelectedIds([]);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleClear = async () => {
    if (!window.confirm('Clear all email logs? This cannot be undone.')) return;
    setClearing(true);
    await api.clearLogs();
    setLogs([]);
    setSelectedIds([]);
    setClearing(false);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected log(s) permanently?`)) return;
    setClearing(true);
    await api.clearLogs(selectedIds);
    setLogs(prev => prev.filter(l => !selectedIds.includes(l.id)));
    setSelectedIds([]);
    setClearing(false);
  };

  const successCount = logs.filter(l => l.status === 'Success').length;
  const failCount    = logs.filter(l => l.status === 'Failed').length;
  const filtered     = filter === 'All' ? logs : logs.filter(l => l.status === filter);

  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(filtered.map(l => l.id));
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(i => i !== id));
    else setSelectedIds(prev => [...prev, id]);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="page-header-icon">
            <ClipboardList size={22} />
          </div>
          <div>
            <h1>Email Logs</h1>
            <p>Complete history of all emails sent with delivery status.</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon blue"><TrendingUp size={20} /></div>
          <div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>{logs.length}</div>
            <div className="stat-label">Total Sent</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle2 size={20} /></div>
          <div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{successCount}</div>
            <div className="stat-label">Successful</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><XCircle size={20} /></div>
          <div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{failCount}</div>
            <div className="stat-label">Failed</div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card">
        {/* Card Header */}
        <div className="card-header">
          <div>
            <div className="card-title">
              <div className="card-title-icon"><ClipboardList size={15} /></div>
              Log History
              <span className="badge badge-accent" style={{ fontSize: 11 }}>
                {filtered.length}
              </span>
            </div>
            <div className="card-subtitle">All outgoing email activity</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Filter Tabs */}
            <div className="filter-tabs">
              {['All', 'Success', 'Failed'].map(f => (
                <button key={f} id={`filter-${f.toLowerCase()}-btn`}
                  className={`filter-tab ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}>
                  {f === 'Success' && <CheckCircle2 size={11} style={{ marginRight: 4 }} />}
                  {f === 'Failed'  && <XCircle      size={11} style={{ marginRight: 4 }} />}
                  {f}
                </button>
              ))}
            </div>

            <button id="refresh-logs-btn" className="btn btn-ghost btn-sm" onClick={fetchLogs}>
              <RotateCcw size={13} /> Refresh
            </button>
            {selectedIds.length > 0 ? (
              <button className="btn btn-danger btn-sm" onClick={handleDeleteSelected} disabled={clearing}>
                {clearing ? <><span className="spinner" /> Deleting…</> : <><Trash2 size={13} /> Delete ({selectedIds.length})</>}
              </button>
            ) : (
              <button id="clear-logs-btn" className="btn btn-danger btn-sm"
                onClick={handleClear} disabled={clearing || logs.length === 0}>
                {clearing ? <><span className="spinner" /> Clearing…</> : <><Trash2 size={13} /> Clear All</>}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px', width: 28, height: 28, borderWidth: 3 }} />
            <p>Loading email logs…</p>
          </div>

        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <ClipboardList size={30} />
            </div>
            <h3>No Logs Found</h3>
            <p>{filter !== 'All' ? `No ${filter.toLowerCase()} emails found.` : 'No emails have been sent yet.'}</p>
          </div>

        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} style={{ cursor: 'pointer' }} />
                  </th>
                  <th><Mail size={11} style={{ marginRight: 6, verticalAlign: 'middle' }} />Recipient</th>
                  <th><FileText size={11} style={{ marginRight: 6, verticalAlign: 'middle' }} />Template</th>
                  <th>Subject</th>
                  <th><Calendar size={11} style={{ marginRight: 6, verticalAlign: 'middle' }} />Sent At</th>
                  <th>Status</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr key={log.id} style={{ background: selectedIds.includes(log.id) ? 'rgba(99,132,255,0.05)' : 'transparent' }}>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={selectedIds.includes(log.id)} onChange={() => toggleSelect(log.id)} style={{ cursor: 'pointer' }} />
                    </td>

                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {log.recipient}
                    </td>

                    <td>
                      <span className="badge badge-accent" style={{ fontSize: 11 }}>
                        {log.templateId || 'custom'}
                      </span>
                    </td>

                    <td style={{
                      maxWidth: 220, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: 'var(--text-secondary)'
                    }}>
                      {log.subject}
                    </td>

                    <td style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {formatDate(log.sentAt)}
                    </td>

                    <td>
                      {log.status === 'Success' ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={11} /> Success
                        </span>
                      ) : (
                        <span className="badge badge-danger">
                          <XCircle size={11} /> Failed
                        </span>
                      )}
                    </td>

                    <td style={{ color: 'var(--danger)', fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.error || <span style={{ color: 'var(--text-dim)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
