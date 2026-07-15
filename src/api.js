const BASE_URL = '/api';

export const api = {
  // SMTP Config
  getSmtpConfig: () => fetch(`${BASE_URL}/smtp-config`).then(r => r.json()),
  saveSmtpConfig: (data) =>
    fetch(`${BASE_URL}/smtp-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),
  testSmtp: () =>
    fetch(`${BASE_URL}/smtp-test`, { method: 'POST' }).then(r => r.json()),

  // Templates
  getTemplates: () => fetch(`${BASE_URL}/templates`).then(r => r.json()),

  // Send Email
  sendEmail: (data) =>
    fetch(`${BASE_URL}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  // Logs
  getLogs: () => fetch(`${BASE_URL}/logs`).then(r => r.json()),
  clearLogs: () => fetch(`${BASE_URL}/logs`, { method: 'DELETE' }).then(r => r.json()),
};
