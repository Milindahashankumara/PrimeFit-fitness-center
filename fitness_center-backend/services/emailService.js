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

const buildBookingCancellationEmailToCoach = ({
  customerName,
  sessionType,
  date,
  time,
  cancellationReason,
  appUrl,
}) => {
  const reasonBlock = cancellationReason
    ? `<p style="color: #bbb; margin: 16px 0 0;"><strong>Reason:</strong> ${cancellationReason}</p>`
    : "";

  return `
  <div style="font-family: Arial, sans-serif; background: #111; color: #fff; padding: 24px;">
    <div style="max-width: 640px; margin: 0 auto; background: #1c1c1c; border-radius: 16px; padding: 24px; border: 1px solid rgba(255,255,255,0.08);">
      <h2 style="margin: 0 0 12px; color: #ff4d4d;">Session Cancelled</h2>
      <p style="color: #eee; line-height: 1.6;">
        <strong>${customerName}</strong> has cancelled their ${sessionType} session scheduled for
        <strong>${date}</strong> at <strong>${time}</strong>.
      </p>
      ${reasonBlock}
      <a href="${appUrl}/dashboard/coach/requests" style="display: inline-block; background: #ff4d4d; color: white; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: bold; margin-top: 20px;">View Coach Dashboard</a>
    </div>
  </div>
`;
};

const buildBookingCancellationEmailToCustomer = ({
  coachName,
  sessionType,
  date,
  time,
  appUrl,
}) => `
  <div style="font-family: Arial, sans-serif; background: #111; color: #fff; padding: 24px;">
    <div style="max-width: 640px; margin: 0 auto; background: #1c1c1c; border-radius: 16px; padding: 24px; border: 1px solid rgba(255,255,255,0.08);">
      <h2 style="margin: 0 0 12px; color: #ff4d4d;">Booking Cancelled</h2>
      <p style="color: #eee; line-height: 1.6;">
        Your ${sessionType} session with <strong>${coachName}</strong> on
        <strong>${date}</strong> at <strong>${time}</strong> has been cancelled.
      </p>
      <p style="color: #bbb; margin-top: 16px;">This is your cancellation confirmation.</p>
      <a href="${appUrl}/dashboard/customer/bookings" style="display: inline-block; background: #ff4d4d; color: white; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: bold; margin-top: 20px;">View My Bookings</a>
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

const buildBookingEmailTemplate = ({ recipientName, title, messageLines, bookingDetails, status, actionUrl, actionText }) => {
  const detailsHtml = bookingDetails.map(d => `
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 10px 0; color: #a0a0a0; width: 150px; font-weight: 600;">${d.label}:</td>
      <td style="padding: 10px 0; color: #ffffff;">${d.value}</td>
    </tr>
  `).join('');

  return `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0c10; color: #ffffff; padding: 40px 10px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1f2833; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
      <!-- Logo Header -->
      <div style="background-color: #0b0c10; border-bottom: 2px solid #ff4d4d; padding: 25px; text-align: center;">
        <span style="color: #ff4d4d; font-size: 26px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">PrimeFit</span>
      </div>
      
      <!-- Content Body -->
      <div style="padding: 30px 24px;">
        <h2 style="margin-top: 0; margin-bottom: 15px; color: #ffffff; font-size: 20px; font-weight: 600;">Hello ${recipientName},</h2>
        <p style="color: #c5c6c7; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
          ${messageLines.join('<br/>')}
        </p>
        
        <!-- Table Card -->
        <div style="background-color: #0b0c10; border-radius: 8px; padding: 20px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 25px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tbody>
              ${detailsHtml}
              <tr>
                <td style="padding: 10px 0; color: #a0a0a0; font-weight: 600;">Status:</td>
                <td style="padding: 10px 0;">
                  <span style="background-color: ${status === 'Cancelled' ? 'rgba(255,77,77,0.15)' : 'rgba(255,176,32,0.15)'}; color: ${status === 'Cancelled' ? '#ff4d4d' : '#ffb020'}; border: 1px solid ${status === 'Cancelled' ? '#ff4d4d' : '#ffb020'}; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${status}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        ${actionUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${actionUrl}" style="display: inline-block; background-color: #ff4d4d; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; transition: background-color 0.2s;">
            ${actionText}
          </a>
        </div>
        ` : ''}
        
        <!-- Divider -->
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0 20px 0;" />
        
        <!-- Footer Thank You -->
        <p style="margin: 0; color: #888888; font-size: 13px; line-height: 1.5; text-align: center;">
          Thank you for choosing <strong>PrimeFit</strong>.<br/>
          This is an automated notification. Please do not reply directly to this email.
        </p>
      </div>
    </div>
  </div>
  `;
};

const sendCustomerCancellationEmail = async (booking, cancellationReason) => {
  if (!booking) throw new Error("Booking exists check failed: Booking is required");
  
  const User = require("../models/User");
  const [coach, customer] = await Promise.all([
    User.findById(booking.coachId),
    User.findById(booking.customerId)
  ]);
  
  if (!coach) throw new Error("Coach exists check failed: Coach not found");
  if (!customer) throw new Error("Customer exists check failed: Customer not found");
  
  const recipientEmail = coach.email;
  if (!recipientEmail || !recipientEmail.includes("@")) {
    throw new Error("Recipient email address is invalid");
  }

  const appUrl = process.env.CLIENT_URL?.split(",")[0]?.trim() || "http://localhost:3000";
  
  const messageLines = [
    `Greeting! We are writing to inform you that your client, <strong>${customer.name}</strong>, has cancelled their booking.`,
    `Below are the details of the cancelled session.`
  ];

  const bookingDetails = [
    { label: "Customer Name", value: customer.name },
    { label: "Coach Name", value: coach.name },
    { label: "Session Date", value: booking.date },
    { label: "Session Time", value: booking.time },
    { label: "Session Type", value: booking.sessionType || booking.type || "personal" }
  ];

  if (cancellationReason) {
    bookingDetails.push({ label: "Cancellation Reason", value: cancellationReason });
  }

  const html = buildBookingEmailTemplate({
    recipientName: coach.name,
    title: "Booking Cancelled by Customer",
    messageLines,
    bookingDetails,
    status: "Cancelled",
    actionUrl: `${appUrl}/dashboard/coach/requests`,
    actionText: "View Coach Dashboard"
  });

  return sendEmail({
    to: recipientEmail,
    subject: "Booking Cancelled by Customer",
    html
  });
};

const sendCustomerRescheduleEmail = async (booking, oldDate, oldTime, newDate, newTime) => {
  if (!booking) throw new Error("Booking exists check failed: Booking is required");
  
  const User = require("../models/User");
  const [coach, customer] = await Promise.all([
    User.findById(booking.coachId),
    User.findById(booking.customerId)
  ]);
  
  if (!coach) throw new Error("Coach exists check failed: Coach not found");
  if (!customer) throw new Error("Customer exists check failed: Customer not found");
  
  const recipientEmail = coach.email;
  if (!recipientEmail || !recipientEmail.includes("@")) {
    throw new Error("Recipient email address is invalid");
  }

  const appUrl = process.env.CLIENT_URL?.split(",")[0]?.trim() || "http://localhost:3000";
  
  const messageLines = [
    `Greeting! We are writing to inform you that your client, <strong>${customer.name}</strong>, has requested to reschedule their session.`,
    `Please review the request details below.`
  ];

  const bookingDetails = [
    { label: "Customer Name", value: customer.name },
    { label: "Old Date & Time", value: `${oldDate} at ${oldTime}` },
    { label: "New Date & Time", value: `${newDate} at ${newTime}` },
    { label: "Session Type", value: booking.sessionType || booking.type || "personal" }
  ];

  const html = buildBookingEmailTemplate({
    recipientName: coach.name,
    title: "Booking Rescheduled by Customer",
    messageLines,
    bookingDetails,
    status: "Reschedule Pending",
    actionUrl: `${appUrl}/dashboard/coach/requests`,
    actionText: "Review Reschedule Request"
  });

  return sendEmail({
    to: recipientEmail,
    subject: "Booking Rescheduled by Customer",
    html
  });
};

const sendCoachCancellationEmail = async (booking) => {
  if (!booking) throw new Error("Booking exists check failed: Booking is required");
  
  const User = require("../models/User");
  const [coach, customer] = await Promise.all([
    User.findById(booking.coachId),
    User.findById(booking.customerId)
  ]);
  
  if (!coach) throw new Error("Coach exists check failed: Coach not found");
  if (!customer) throw new Error("Customer exists check failed: Customer not found");
  
  const recipientEmail = customer.email || booking.customerEmail;
  if (!recipientEmail || !recipientEmail.includes("@")) {
    throw new Error("Recipient email address is invalid");
  }

  const appUrl = process.env.CLIENT_URL?.split(",")[0]?.trim() || "http://localhost:3000";
  
  const messageLines = [
    `We regret to inform you that coach <strong>${coach.name}</strong> has cancelled your scheduled training session.`,
    `Please see the details of the cancelled session below.`
  ];

  const bookingDetails = [
    { label: "Coach Name", value: coach.name },
    { label: "Session Date", value: booking.date },
    { label: "Session Time", value: booking.time },
    { label: "Session Type", value: booking.sessionType || booking.type || "personal" }
  ];

  const html = buildBookingEmailTemplate({
    recipientName: customer.name,
    title: "Your Training Session Has Been Cancelled",
    messageLines,
    bookingDetails,
    status: "Cancelled",
    actionUrl: `${appUrl}/dashboard/customer/bookings`,
    actionText: "View My Bookings"
  });

  return sendEmail({
    to: recipientEmail,
    subject: "Your Training Session Has Been Cancelled",
    html
  });
};

const sendCoachRescheduleEmail = async (booking, oldDate, oldTime, newDate, newTime) => {
  if (!booking) throw new Error("Booking exists check failed: Booking is required");
  
  const User = require("../models/User");
  const [coach, customer] = await Promise.all([
    User.findById(booking.coachId),
    User.findById(booking.customerId)
  ]);
  
  if (!coach) throw new Error("Coach exists check failed: Coach not found");
  if (!customer) throw new Error("Customer exists check failed: Customer not found");
  
  const recipientEmail = customer.email || booking.customerEmail;
  if (!recipientEmail || !recipientEmail.includes("@")) {
    throw new Error("Recipient email address is invalid");
  }

  const appUrl = process.env.CLIENT_URL?.split(",")[0]?.trim() || "http://localhost:3000";
  
  const messageLines = [
    `We are writing to confirm that coach <strong>${coach.name}</strong> has updated/rescheduled your training session.`,
    `Below are the updated session details.`
  ];

  const bookingDetails = [
    { label: "Coach Name", value: coach.name },
    { label: "Old Date & Time", value: `${oldDate} at ${oldTime}` },
    { label: "New Date & Time", value: `${newDate} at ${newTime}` },
    { label: "Session Type", value: booking.sessionType || booking.type || "personal" }
  ];

  const html = buildBookingEmailTemplate({
    recipientName: customer.name,
    title: "Your Training Session Has Been Rescheduled",
    messageLines,
    bookingDetails,
    status: "Rescheduled",
    actionUrl: `${appUrl}/dashboard/customer/bookings`,
    actionText: "View My Bookings"
  });

  return sendEmail({
    to: recipientEmail,
    subject: "Your Training Session Has Been Rescheduled",
    html
  });
};

// Email Verification Template

const buildEmailVerificationEmail = ({ name, verifyUrl }) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0c10; color: #ffffff; padding: 40px 10px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1f2833; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
      <div style="background-color: #0b0c10; border-bottom: 2px solid #ff4d4d; padding: 25px; text-align: center;">
        <span style="color: #ff4d4d; font-size: 26px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">PrimeFit</span>
      </div>
      <div style="padding: 30px 24px;">
        <h2 style="margin-top: 0; margin-bottom: 15px; color: #ffffff; font-size: 20px;">Hello ${name},</h2>
        <p style="color: #c5c6c7; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
          Welcome to PrimeFit! Please verify your email address to complete your registration.
          This link will expire in <strong>24 hours</strong>.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="display: inline-block; background-color: #ff4d4d; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 15px; text-transform: uppercase; letter-spacing: 1px;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #888888; font-size: 13px; line-height: 1.5;">
          If you did not create a PrimeFit account, you can safely ignore this email.
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 16px; word-break: break-all;">
          Or copy this link: ${verifyUrl}
        </p>
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0 20px 0;" />
        <p style="margin: 0; color: #888888; font-size: 13px; text-align: center;">
          Thank you for choosing <strong>PrimeFit</strong>.<br/>
          This is an automated notification. Please do not reply directly to this email.
        </p>
      </div>
    </div>
  </div>
`;

// Password Reset Template

const buildPasswordResetEmail = ({ name, resetUrl }) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0c10; color: #ffffff; padding: 40px 10px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1f2833; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
      <div style="background-color: #0b0c10; border-bottom: 2px solid #ff4d4d; padding: 25px; text-align: center;">
        <span style="color: #ff4d4d; font-size: 26px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">PrimeFit</span>
      </div>
      <div style="padding: 30px 24px;">
        <h2 style="margin-top: 0; margin-bottom: 15px; color: #ffffff; font-size: 20px;">Hello ${name},</h2>
        <p style="color: #c5c6c7; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
          We received a request to reset your PrimeFit password.
          Click the button below to set a new password. This link will expire in <strong>1 hour</strong>.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #ff4d4d; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 15px; text-transform: uppercase; letter-spacing: 1px;">
            Reset Password
          </a>
        </div>
        <p style="color: #888888; font-size: 13px; line-height: 1.5;">
          If you did not request a password reset, please ignore this email. Your password will not change.
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 16px; word-break: break-all;">
          Or copy this link: ${resetUrl}
        </p>
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0 20px 0;" />
        <p style="margin: 0; color: #888888; font-size: 13px; text-align: center;">
          Thank you for choosing <strong>PrimeFit</strong>.<br/>
          This is an automated notification. Please do not reply directly to this email.
        </p>
      </div>
    </div>
  </div>
`;

// Send Helpers

/**
 * Send email verification email to a newly registered user.
 * @param {Object} user   - Mongoose user document { name, email }
 * @param {string} rawToken - The raw (un-hashed) verification token
 */
const sendVerificationEmail = async (user, rawToken) => {
  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  const verifyUrl = `${appUrl}/auth/verify-email?token=${rawToken}`;

  return sendEmail({
    to: user.email,
    subject: "Verify Your PrimeFit Email Address",
    html: buildEmailVerificationEmail({ name: user.name, verifyUrl }),
  });
};

/**
 * Send password reset email.
 * @param {Object} user   - Mongoose user document { name, email }
 * @param {string} rawToken - The raw (un-hashed) reset token
 */
const sendPasswordResetEmail = async (user, rawToken) => {
  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  const resetUrl = `${appUrl}/auth/reset-password?token=${rawToken}`;

  return sendEmail({
    to: user.email,
    subject: "Reset Your PrimeFit Password",
    html: buildPasswordResetEmail({ name: user.name, resetUrl }),
  });
};

module.exports = {
  sendEmail,
  buildMessageEmail,
  buildAnnouncementEmail,
  buildBookingCancellationEmailToCoach,
  buildBookingCancellationEmailToCustomer,
  isEmailConfigured,
  sendCustomerCancellationEmail,
  sendCustomerRescheduleEmail,
  sendCoachCancellationEmail,
  sendCoachRescheduleEmail,
  // New exports
  buildEmailVerificationEmail,
  buildPasswordResetEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
