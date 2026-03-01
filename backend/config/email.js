import nodemailer from 'nodemailer';

// Escape user-supplied strings before interpolating into HTML
const escapeHtml = (str) => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

// Create transporter once at module load — reused for all sends
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
export { transporter };

export const getFromAddress = () =>
  process.env.SMTP_FROM || `"SOS Auto DZ" <${process.env.SMTP_USER}>`;

/**
 * Wrap body content in the standard SOS Auto DZ email template.
 */
const wrapTemplate = (bodyHtml) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2563eb;">SOS Auto DZ</h2>
    ${bodyHtml}
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
    <p style="color: #94a3b8; font-size: 12px;">SOS Auto DZ — Roadside assistance across Algeria</p>
  </div>
`;

/**
 * Send an email (fire-and-forget safe — errors are logged, not thrown).
 * @param {{ to: string, subject: string, html: string }} opts
 */
export const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject,
      html,
    });
  } catch (err) {
    // Email failures should never block the main flow
    console.error(`Email send error (to: ${to}, subject: ${subject}):`, err.message);
  }
};

// ─── Booking email helpers ───────────────────────────────────────────

/**
 * Notify a provider that a new booking request was received.
 */
export const sendNewBookingEmail = async ({ providerEmail, providerName, clientName, date, issue }) => {
  const formattedDate = new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  await sendEmail({
    to: providerEmail,
    subject: 'SOS Auto DZ — New Booking Request',
    html: wrapTemplate(`
      <p>Hello <strong>${escapeHtml(providerName)}</strong>,</p>
      <p>You have a new booking request:</p>
      <table style="width:100%; border-collapse:collapse; margin:12px 0;">
        <tr><td style="padding:6px 0; color:#64748b;">Client</td><td style="padding:6px 0; font-weight:600;">${escapeHtml(clientName)}</td></tr>
        <tr><td style="padding:6px 0; color:#64748b;">Date</td><td style="padding:6px 0; font-weight:600;">${formattedDate}</td></tr>
        <tr><td style="padding:6px 0; color:#64748b;">Issue</td><td style="padding:6px 0;">${escapeHtml(issue)}</td></tr>
      </table>
      <p>Log in to your dashboard to accept or decline this request.</p>
    `),
  });
};

/**
 * Notify the client/provider when a booking status changes.
 */
export const sendBookingStatusEmail = async ({ recipientEmail, recipientName, otherPartyName, status, date }) => {
  const formattedDate = new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const statusColors = {
    CONFIRMED: '#16a34a',
    COMPLETED: '#2563eb',
    CANCELLED: '#dc2626',
  };
  const color = statusColors[status] || '#64748b';

  await sendEmail({
    to: recipientEmail,
    subject: `SOS Auto DZ — Booking ${status.charAt(0) + status.slice(1).toLowerCase()}`,
    html: wrapTemplate(`
      <p>Hello <strong>${escapeHtml(recipientName)}</strong>,</p>
      <p>Your booking with <strong>${escapeHtml(otherPartyName)}</strong> on <strong>${formattedDate}</strong> has been updated:</p>
      <p style="display:inline-block; background:${color}; color:#fff; padding:8px 20px; border-radius:6px; font-weight:bold; margin:12px 0;">
        ${status}
      </p>
      <p>Log in to your dashboard for full details.</p>
    `),
  });
};
