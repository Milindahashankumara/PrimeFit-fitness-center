const nodemailer = require("nodemailer");

const isEmailConfigured = () =>
  Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS,
  );

const normalizePassword = (value = "") =>
  String(value).replace(/\s+/g, "").trim();

const getTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: normalizePassword(process.env.SMTP_PASS),
    },
  });

const getFromAddress = () =>
  process.env.SMTP_FROM ||
  (process.env.SMTP_USER
    ? `PrimeFit <${process.env.SMTP_USER}>`
    : "PrimeFit <no-reply@primefit.local>");

const sanitizeText = (value = "") =>
  String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const buildMessageEmail = ({ senderName, subject, content, appUrl }) => `
  <div style="font-family: Arial, sans-serif; background: #111; color: #fff; padding: 24px;">
    <div style="max-width: 640px; margin: 0 auto; background: #1c1c1c; border-radius: 16px; padding: 24px; border: 1px solid rgba(255,255,255,0.08);">
      <h2 style="margin: 0 0 12px; color: #ff4d4d;">New message from ${senderName}</h2>
      <p style="color: #bbb; margin: 0 0 8px;"><strong>Subject:</strong> ${subject}</p>
      <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 16px; margin: 16px 0; line-height: 1.6; color: #eee;">
        ${content.replace(/\n/g, "<br />")}
      </div>
      <a href="${appUrl}" style="display: inline-block; background: #ff4d4d; color: white; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: bold;">Open PrimeFit</a>
    </div>
  </div>
`;

const buildAnnouncementEmail = ({ senderName, subject, content, appUrl }) => `
  <div style="font-family: Arial, sans-serif; background: #111; color: #fff; padding: 24px;">
    <div style="max-width: 640px; margin: 0 auto; background: #1c1c1c; border-radius: 16px; padding: 24px; border: 1px solid rgba(255,255,255,0.08);">
      <h2 style="margin: 0 0 12px; color: #ffb020;">Announcement from ${senderName}</h2>
      <p style="color: #bbb; margin: 0 0 8px;"><strong>Subject:</strong> ${subject}</p>
      <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 16px; margin: 16px 0; line-height: 1.6; color: #eee;">
        ${content.replace(/\n/g, "<br />")}
      </div>
      <a href="${appUrl}" style="display: inline-block; background: #ffb020; color: #111; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: bold;">Open PrimeFit</a>
    </div>
  </div>
`;

const sendEmail = async ({ to, subject, text, html, attachments = [] }) => {
  if (!isEmailConfigured()) {
    return { skipped: true };
  }

  const transporter = getTransporter();
  return transporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    text: sanitizeText(text || subject),
    html,
    attachments,
  });
};

module.exports = {
  sendEmail,
  buildMessageEmail,
  buildAnnouncementEmail,
  isEmailConfigured,
};
