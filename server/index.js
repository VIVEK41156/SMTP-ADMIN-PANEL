const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');
const fs         = require('fs');
const path       = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// ── Paths ────────────────────────────────────────────────────────────────────
const DATA_DIR   = path.join(__dirname, 'data');
const SMTP_FILE  = path.join(DATA_DIR, 'smtp_config.json');
const LOGS_FILE  = path.join(DATA_DIR, 'email_logs.json');
const LOGO_FILE  = path.join(DATA_DIR, 'logo_b64.txt');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Helpers ──────────────────────────────────────────────────────────────────
// ── In-Memory Fallback for Vercel (Read-Only FS) ──────────────────────────
const memoryStore = {};

function readJSON(filePath, defaultVal) {
  if (memoryStore[filePath]) return memoryStore[filePath];
  try {
    if (!fs.existsSync(filePath)) return defaultVal;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    return defaultVal;
  }
}

function writeJSON(filePath, data) {
  memoryStore[filePath] = data; // Always save in memory
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Ignore EROFS (Read-Only File System) errors on Vercel
    console.warn(`Vercel Read-Only FS warning: Could not write to ${filePath}. Stored in memory instead.`);
  }
}
const getLogoB64 = () => { try { return fs.existsSync(LOGO_FILE) ? fs.readFileSync(LOGO_FILE,'utf-8').trim() : ''; } catch { return ''; } };

// ── Company Branding ─────────────────────────────────────────────────────────
const COMPANY = {
  name:    'Web Digital Mantra',
  tagline: 'IT Services Private Limited',
  website: 'https://www.webdigitalmantra.com',
  email:   'info@webdigitalmantra.com',
  phone:   '+91 98765 43210',
  address: 'India',
  primaryColor:   '#c0392b',
  secondaryColor: '#1a3a6e',
  accentColor:    '#e74c3c',
};

// ── HTML Email Builder (CID logo + fully mobile responsive) ─────────────────
function buildHtmlEmail(subject, bodyText, logoSrc) {

  // Using the exact company logo image provided
  const inlineLogo = `<table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="background:#ffffff;border-radius:12px;padding:12px 18px;display:inline-block;">
        <img src="${logoSrc}" alt="Web Digital Mantra" style="height:55px;max-width:220px;object-fit:contain;display:block;" />
      </td>
    </tr></table>`;

  // Convert body text to styled HTML
  const bodyHtml = bodyText.split('\n').map(line => {
    if (!line.trim()) return '<div style="height:10px;"></div>';
    if (/^[•\-]/.test(line.trim()))
      return `<p style="margin:0 0 7px 0;padding-left:14px;color:#374151;line-height:1.75;font-size:14px;font-family:Arial,sans-serif;">&#8226; ${line.replace(/^[•\-]\s*/,'')}</p>`;
    if (/^─+$/.test(line.trim()))
      return `<hr style="border:none;border-top:1px dashed #e5e7eb;margin:10px 0;"/>`;
    return `<p style="margin:0 0 10px 0;color:#374151;line-height:1.75;font-size:14px;font-family:Arial,sans-serif;">${line}</p>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>${subject}</title>
  <style type="text/css">
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
    body{margin:0!important;padding:0!important;background:#f0f4f8;}
    @media only screen and (max-width:620px){
      .wrap{width:100%!important;border-radius:0!important;}
      .hpad{padding:20px 18px 16px!important;}
      .bpad{padding:24px 18px 20px!important;}
      .fpad{padding:18px 18px 24px!important;}
      .cpad{padding:0 18px 22px!important;}
      .dpad{padding:0 18px!important;}
      .h1{font-size:17px!important;}
      .cta{display:block!important;text-align:center!important;width:100%!important;box-sizing:border-box!important;}
      .fl{display:block!important;padding-right:0!important;margin-bottom:6px!important;}
    }
    @media only screen and (max-width:400px){.h1{font-size:15px!important;}}
  </style>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f4f8;padding:20px 10px;">
<tr><td align="center" valign="top">

  <!-- Card -->
  <table role="presentation" class="wrap" cellpadding="0" cellspacing="0" border="0"
         style="max-width:620px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 28px rgba(0,0,0,0.12);">

    <!-- HEADER -->
    <tr>
      <td style="background:linear-gradient(135deg,${COMPANY.secondaryColor} 0%,${COMPANY.primaryColor} 100%);padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <!-- Logo -->
          <tr><td class="hpad" style="padding:22px 30px 16px;">${inlineLogo}</td></tr>
          <!-- Title -->
          <tr>
            <td class="hpad" style="padding:0 30px 24px;">
              <p style="margin:0 0 5px;font-size:10px;color:rgba(255,255,255,0.7);letter-spacing:0.12em;text-transform:uppercase;font-weight:700;font-family:Arial,sans-serif;">${COMPANY.tagline}</p>
              <h1 class="h1" style="margin:0;font-size:20px;color:#ffffff;font-weight:800;line-height:1.3;font-family:Arial,sans-serif;">${subject}</h1>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ACCENT BAR -->
    <tr><td style="height:4px;background:linear-gradient(90deg,${COMPANY.primaryColor},#f39c12,${COMPANY.primaryColor});"></td></tr>

    <!-- BODY -->
    <tr><td class="bpad" style="padding:30px 32px 22px;">${bodyHtml}</td></tr>

    <!-- CTA -->
    <tr>
      <td class="cpad" style="padding:0 32px 30px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr><td align="center">
            <a href="${COMPANY.website}" target="_blank" class="cta"
               style="display:inline-block;padding:13px 30px;background:linear-gradient(135deg,${COMPANY.secondaryColor},${COMPANY.primaryColor});color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;border-radius:8px;font-family:Arial,sans-serif;">
              &#127760;&nbsp; Visit Our Website
            </a>
          </td></tr>
        </table>
      </td>
    </tr>

    <!-- DIVIDER -->
    <tr><td class="dpad" style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"/></td></tr>

    <!-- FOOTER -->
    <tr>
      <td class="fpad" style="padding:20px 32px 26px;background:#f8fafc;">
        <p style="margin:0 0 3px;font-size:14px;font-weight:800;color:${COMPANY.secondaryColor};font-family:Arial,sans-serif;">${COMPANY.name}</p>
        <p style="margin:0 0 12px;font-size:11px;color:#6b7280;font-family:Arial,sans-serif;">${COMPANY.tagline}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="fl" style="padding-right:18px;">
              <a href="mailto:${COMPANY.email}" style="color:${COMPANY.primaryColor};text-decoration:none;font-size:12px;font-family:Arial,sans-serif;">&#9993; ${COMPANY.email}</a>
            </td>
            <td class="fl">
              <a href="${COMPANY.website}" target="_blank" style="color:${COMPANY.secondaryColor};text-decoration:none;font-size:12px;font-family:Arial,sans-serif;">&#127760; ${COMPANY.website}</a>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
          <tr><td style="border-top:1px solid #e5e7eb;padding-top:14px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.7;font-family:Arial,sans-serif;">
              &copy; ${new Date().getFullYear()} ${COMPANY.name}. All rights reserved.<br/>
              You received this because you are a valued client or subscriber.<br/>
              <a href="#" style="color:${COMPANY.primaryColor};text-decoration:none;">Unsubscribe</a>
              &nbsp;&middot;&nbsp;
              <a href="#" style="color:${COMPANY.primaryColor};text-decoration:none;">Privacy Policy</a>
            </p>
          </td></tr>
        </table>
      </td>
    </tr>

  </table>
  <!-- /Card -->

  <!-- Tagline below card -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;width:100%;margin-top:12px;">
    <tr><td style="text-align:center;padding:0 16px 20px;">
      <p style="margin:0;font-size:11px;color:#9ca3af;font-family:Arial,sans-serif;">
        Sent via <strong style="color:${COMPANY.secondaryColor};">${COMPANY.name} SMTP Admin</strong>
      </p>
    </td></tr>
  </table>

</td></tr>
</table>
</body>
</html>`;
}
// ── Predefined Email Templates ───────────────────────────────────────────────
const EMAIL_TEMPLATES = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to Web Digital Mantra! 🎉',
    body: `Dear {{name}},

Welcome aboard! We are absolutely thrilled to have you as part of the Web Digital Mantra family.

Your journey with us begins now — and we promise to make it exceptional. Our team of dedicated IT professionals is here to help you every step of the way.

Here's what you can expect from us:
• World-class IT services tailored to your needs
• 24/7 dedicated support whenever you need us
• Cutting-edge digital solutions for your business
• Transparent communication at every stage

If you have any questions or need assistance getting started, don't hesitate to reach out to our support team.

We look forward to building something great together!

Warm regards,
The Web Digital Mantra Team`,
  },
  {
    id: 'password_reset',
    name: 'Password Reset',
    subject: 'Password Reset Request — Web Digital Mantra',
    body: `Dear {{name}},

We received a request to reset the password for your Web Digital Mantra account.

To reset your password, click the link below:

{{reset_link}}

⚠️ Important Security Notice:
• This link will expire in 24 hours
• If you did not request a password reset, please ignore this email
• Your account remains secure — no action is needed
• Never share this link with anyone

If you continue to experience issues, please contact our support team immediately at info@webdigitalmantra.com.

Stay secure,
Web Digital Mantra Security Team`,
  },
  {
    id: 'project_proposal',
    name: 'Project Proposal',
    subject: 'Project Proposal — Web Digital Mantra IT Services',
    body: `Dear {{client_name}},

Thank you for your interest in partnering with Web Digital Mantra IT Services Private Limited.

We are pleased to present our proposal for your project: {{project_name}}

Project Overview:
• Scope of Work: {{project_scope}}
• Estimated Timeline: {{timeline}}
• Investment: {{budget}}

Why Choose Web Digital Mantra?
✅ 10+ years of IT industry experience
✅ Certified team of professionals
✅ On-time delivery guaranteed
✅ Post-launch support included
✅ Competitive & transparent pricing

Our team has carefully reviewed your requirements and we are confident in delivering a solution that exceeds your expectations.

Please review the attached detailed proposal and feel free to schedule a call with us to discuss further.

We look forward to working with you!

Best regards,
Business Development Team
Web Digital Mantra IT Services Pvt. Ltd.`,
  },
  {
    id: 'newsletter',
    name: 'Monthly Newsletter',
    subject: '{{month}} {{year}} — Web Digital Mantra Newsletter',
    body: `Dear Valued Client,

Welcome to the {{month}} {{year}} edition of the Web Digital Mantra Newsletter!

🚀 This Month's Highlights:

🔹 New Service Launch
We are excited to announce our latest service — {{new_service}}. Designed to help businesses scale faster with smarter technology.

🔹 Industry Insights
The digital landscape continues to evolve rapidly. Here's what's trending in IT services this month and how Web Digital Mantra is staying ahead of the curve.

🔹 Client Success Story
We recently helped {{client_name}} achieve {{achievement}} — a testament to our team's commitment to excellence.

🔹 Upcoming Events
Join us for our upcoming webinar: "{{webinar_title}}" on {{webinar_date}}. Register now to secure your spot!

📞 Let's Connect
Have a project in mind? We'd love to hear from you. Schedule a free consultation today.

Thank you for being a valued part of our community!

Warm regards,
The Web Digital Mantra Marketing Team`,
  },
  {
    id: 'invoice',
    name: 'Invoice',
    subject: 'Invoice #{{invoice_number}} — Web Digital Mantra IT Services',
    body: `Dear {{client_name}},

Please find below the invoice details for services rendered by Web Digital Mantra IT Services Private Limited.

────────────────────────────────────
INVOICE DETAILS
────────────────────────────────────
Invoice Number : #{{invoice_number}}
Invoice Date   : {{invoice_date}}
Due Date       : {{due_date}}
Project        : {{project_name}}
Amount Due     : ₹{{amount}} (Incl. GST)
────────────────────────────────────

Services Rendered:
• {{service_1}}
• {{service_2}}
• {{service_3}}

Payment Methods Accepted:
🏦 Bank Transfer — Account details attached
💳 UPI — webdigitalmantra@upi
🌐 Online Payment — Pay via our website

Please ensure payment is made by {{due_date}} to avoid any late charges.

For any queries regarding this invoice, please contact our accounts team at accounts@webdigitalmantra.com.

Thank you for your business!

Regards,
Accounts & Finance Department
Web Digital Mantra IT Services Pvt. Ltd.`,
  },
  {
    id: 'custom',
    name: 'Custom Message',
    subject: 'Message from Web Digital Mantra IT Services',
    body: `Dear Valued Client,

Greetings from Web Digital Mantra IT Services Private Limited!

[Write your custom message here]

We remain committed to providing you with the highest quality IT services and look forward to our continued partnership.

If you have any questions or need assistance, please don't hesitate to reach out to us.

Best regards,
Web Digital Mantra Team`,
  },
];

// ── SMTP Config ──────────────────────────────────────────────────────────────
app.get('/api/smtp-config', (req, res) => {
  res.json({ success: true, config: readJSON(SMTP_FILE, null) });
});

app.post('/api/smtp-config', (req, res) => {
  const { host, port, username, password, encryption, senderName, senderEmail } = req.body;
  if (!host || !port || !username || !password || !senderEmail)
    return res.status(400).json({ success: false, message: 'All SMTP fields are required.' });
  writeJSON(SMTP_FILE, { host, port: Number(port), username, password, encryption, senderName, senderEmail });
  res.json({ success: true, message: 'SMTP configuration saved successfully.' });
});

app.post('/api/smtp-test', async (req, res) => {
  const config = readJSON(SMTP_FILE, null);
  if (!config) return res.status(400).json({ success: false, message: 'No SMTP configuration found.' });
  try {
    const t = nodemailer.createTransport({
      host: config.host, port: config.port,
      secure: config.encryption === 'SSL',
      auth: { user: config.username, pass: config.password },
      tls: config.encryption === 'TLS' ? { rejectUnauthorized: false } : undefined,
    });
    await t.verify();
    res.json({ success: true, message: '✅ SMTP connection verified successfully!' });
  } catch (err) {
    res.status(400).json({ success: false, message: `Connection failed: ${err.message}` });
  }
});

// ── Templates ────────────────────────────────────────────────────────────────
app.get('/api/templates', (req, res) => {
  res.json({ success: true, templates: EMAIL_TEMPLATES });
});

// ── Send Email ───────────────────────────────────────────────────────────────
app.post('/api/send-email', async (req, res) => {
  const { recipients, templateId, subject, body } = req.body;
  if (!recipients?.length) return res.status(400).json({ success: false, message: 'At least one recipient required.' });
  if (!subject || !body)   return res.status(400).json({ success: false, message: 'Subject and body are required.' });

  const config = readJSON(SMTP_FILE, null);
  if (!config)             return res.status(400).json({ success: false, message: 'SMTP not configured.' });

  const transporter = nodemailer.createTransport({
    host: config.host, port: config.port,
    secure: config.encryption === 'SSL',
    auth: { user: config.username, pass: config.password },
    tls: config.encryption === 'TLS' ? { rejectUnauthorized: false } : undefined,
  });

  const htmlContent = buildHtmlEmail(subject, body, 'cid:logo');
  const logoB64 = getLogoB64();

  const logs = readJSON(LOGS_FILE, []);
  const results = [];

  for (const recipient of recipients) {
    const logEntry = {
      id: uuidv4(), recipient: recipient.trim(),
      templateId, subject,
      sentAt: new Date().toISOString(),
      status: 'Pending', error: null,
    };
    try {
      await transporter.sendMail({
        from: `"${config.senderName || COMPANY.name}" <${config.senderEmail}>`,
        to: recipient.trim(),
        subject,
        text: body,        // Plain text fallback
        html: htmlContent, // Beautiful HTML version
        attachments: logoB64 ? [{
          filename: 'logo.jpg',
          content: logoB64,
          encoding: 'base64',
          cid: 'logo' // same cid value as in the html img src
        }] : []
      });
      logEntry.status = 'Success';
      results.push({ email: recipient.trim(), status: 'Success' });
    } catch (err) {
      logEntry.status = 'Failed';
      logEntry.error  = err.message;
      results.push({ email: recipient.trim(), status: 'Failed', error: err.message });
    }
    logs.unshift(logEntry);
  }

  writeJSON(LOGS_FILE, logs);
  res.json({ success: true, results });
});

// ── Logs ─────────────────────────────────────────────────────────────────────
app.get('/api/logs',    (req, res) => res.json({ success: true, logs: readJSON(LOGS_FILE, []) }));
app.delete('/api/logs', (req, res) => { writeJSON(LOGS_FILE, []); res.json({ success: true, message: 'Logs cleared.' }); });

// ── HTML Preview ──────────────────────────────────────────────────────────────
app.post('/api/preview-email', (req, res) => {
  const { subject, body } = req.body;
  const logoB64 = getLogoB64();
  const logoSrc = logoB64 ? `data:image/jpeg;base64,${logoB64}` : '';
  const html = buildHtmlEmail(subject || 'Email Preview', body || '', logoSrc);
  res.json({ success: true, html });
});

// ── Start ─────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`SMTP Admin Server running → http://localhost:${PORT}`));
}

// Export for Vercel Serverless Functions
module.exports = app;
