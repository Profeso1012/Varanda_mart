/**
 * Email — Brevo API primary, Brevo SMTP fallback.
 * Brand: light green (#4CAF7D) primary, orange (#F97316) secondary.
 *
 * RENDER DEPLOYMENT NOTE:
 * Set these in Render's Environment Variables dashboard (not .env):
 *   BREVO_API_KEY   — your Brevo API key (primary send method)
 *   SMTP_USER       — only needed if you want SMTP fallback
 *   SMTP_PASS       — only needed if you want SMTP fallback
 *   OTP_FIXED_VALUE — set to 654321 in staging, leave empty in production
 */
const nodemailer = require('nodemailer');
const { config } = require('./env');

const isDev = config.nodeEnv !== 'production';

// ─── Dev logger — only prints in development ─────────────────────────────────
const devLog = (...args) => { if (isDev) console.log('[email:dev]', ...args); };

// ─── SMTP transporter (fallback only) ────────────────────────────────────────
let smtpTransporter = null;

const getSmtpTransporter = () => {
  if (smtpTransporter) return smtpTransporter;
  if (!config.smtpUser || !config.smtpPass) return null;

  smtpTransporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: false,
    pool: false, // fresh connection per send — avoids silent idle timeouts
    auth: { user: config.smtpUser, pass: config.smtpPass },
    tls: { rejectUnauthorized: false },
  });

  return smtpTransporter;
};

// ─── Core send function ───────────────────────────────────────────────────────

const sendEmail = async (to, subject, html) => {
  // ── Path 1: Brevo API (preferred — works without SMTP config) ──────────────
  if (config.brevoApiKey) {
    try {
      const axios = require('axios');
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: config.fromName, email: config.fromEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        },
        {
          headers: { 'api-key': config.brevoApiKey, 'Content-Type': 'application/json' },
          timeout: 12000,
        }
      );
      console.log(`[email] ✓ Sent via Brevo API → ${to} | "${subject}"`);
      return true;
    } catch (apiErr) {
      const detail = apiErr.response?.data?.message || apiErr.response?.data?.code || apiErr.message;
      console.error(`[email] ✗ Brevo API failed → ${to} | "${subject}" | ${detail}`);
      // Fall through to SMTP
    }
  }

  // ── Path 2: SMTP fallback ──────────────────────────────────────────────────
  const mailer = getSmtpTransporter();
  if (mailer) {
    try {
      await Promise.race([
        mailer.sendMail({ from: `"${config.fromName}" <${config.fromEmail}>`, to, subject, html }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP timeout')), 10000)),
      ]);
      smtpTransporter = null; // reset after each send to avoid stale connections
      console.log(`[email] ✓ Sent via SMTP → ${to} | "${subject}"`);
      return true;
    } catch (smtpErr) {
      smtpTransporter = null;
      console.error(`[email] ✗ SMTP also failed → ${to} | "${subject}" | ${smtpErr.message}`);
    }
  }

  // ── Both paths failed ──────────────────────────────────────────────────────
  console.error(`[email] ✗ ALL SEND METHODS FAILED → ${to} | "${subject}" | No BREVO_API_KEY and no SMTP credentials configured`);
  return false;
};

// ─── Base layout ──────────────────────────────────────────────────────────────

const baseLayout = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Varanda</title>
</head>
<body style="margin:0;padding:0;background:#f4f9f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f9f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="background:#4CAF7D;padding:28px 40px;text-align:center;">
          <span style="color:#ffffff;font-size:26px;font-weight:700;letter-spacing:1px;">Varanda</span>
        </td></tr>
        <tr><td style="padding:36px 40px;color:#1a1a1a;font-size:15px;line-height:1.7;">
          ${content}
        </td></tr>
        <tr><td style="background:#f4f9f6;padding:20px 40px;text-align:center;border-top:1px solid #e8f5ee;">
          <p style="margin:0;color:#888;font-size:12px;">© ${new Date().getFullYear()} Varanda Mart. All rights reserved.</p>
          <p style="margin:4px 0 0;color:#aaa;font-size:11px;">You're receiving this because you have an account on Varanda.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const otpBlock = (code) => `
  <div style="background:#f0faf5;border:1px solid #b2dfcb;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
    <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#2e7d52;">${code}</span>
  </div>`;

const ctaButton = (text, url) => `
  <div style="text-align:center;margin:28px 0;">
    <a href="${url}" style="background:#F97316;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;display:inline-block;">${text}</a>
  </div>`;

// ─── Specific senders ─────────────────────────────────────────────────────────

const sendVerificationOtp = (email, firstName, code) => {
  devLog(`OTP for ${email}: ${code}`);
  return sendEmail(email, 'Verify your Varanda email', baseLayout(`
    <p>Hi <strong>${firstName}</strong>,</p>
    <p>Welcome to Varanda! Use the code below to verify your email address:</p>
    ${otpBlock(code)}
    <p style="color:#666;font-size:13px;">This code expires in <strong>10 minutes</strong>. If you didn't create a Varanda account, you can safely ignore this email.</p>
  `));
};

const sendPasswordResetOtp = (email, firstName, code) => {
  devLog(`Password reset OTP for ${email}: ${code}`);
  return sendEmail(email, 'Reset your Varanda password', baseLayout(`
    <p>Hi <strong>${firstName}</strong>,</p>
    <p>You requested a password reset. Use the code below:</p>
    ${otpBlock(code)}
    <p style="color:#666;font-size:13px;">This code expires in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.</p>
  `));
};

const sendWelcomeSeller = (email, firstName, storeName) =>
  sendEmail(email, `Your Varanda store is ready, ${firstName}!`, baseLayout(`
    <p>Hi <strong>${firstName}</strong>,</p>
    <p>Your store <strong>${storeName}</strong> has been created on Varanda. You're all set to start selling.</p>
    ${ctaButton('Go to Dashboard', config.sellerDashboardUrl)}
  `));

const sendWelcomeSupplier = (email, firstName) =>
  sendEmail(email, 'Welcome to Varanda Marketplace', baseLayout(`
    <p>Hi <strong>${firstName}</strong>,</p>
    <p>Your supplier account is ready. You can now list products in the Varanda marketplace.</p>
    ${ctaButton('Go to Supplier Dashboard', config.sellerDashboardUrl + '/supplier')}
  `));

const sendWelcomeDeveloper = (email, firstName) =>
  sendEmail(email, 'Varanda Developer Application Received', baseLayout(`
    <p>Hi <strong>${firstName}</strong>,</p>
    <p>We've received your developer application. Our team will review it within 1–2 business days.</p>
    <p>Once approved, you'll receive an email with instructions to generate your API keys.</p>
  `));

const sendDeveloperApproval = (email, firstName, setupUrl) =>
  sendEmail(email, 'Your Varanda Developer Account is Approved', baseLayout(`
    <p>Hi <strong>${firstName}</strong>,</p>
    <p>Your developer application has been approved! You can now generate your API keys.</p>
    ${ctaButton('Set Up API Keys', setupUrl)}
  `));

const sendSubscriptionConfirmation = (email, planName, trialEndDate) =>
  sendEmail(email, `Your ${planName} plan is active`, baseLayout(`
    <p>Your <strong>${planName}</strong> subscription is now active.</p>
    ${trialEndDate ? `<p>Your free trial runs until <strong>${trialEndDate}</strong>. You won't be charged until then.</p>` : ''}
    ${ctaButton('Go to Dashboard', config.sellerDashboardUrl)}
  `));

const sendTrialExpiryWarning = (email, daysLeft, upgradeUrl) =>
  sendEmail(email, `Your Varanda trial ends in ${daysLeft} days`, baseLayout(`
    <p>Your free trial ends in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>.</p>
    <p>Upgrade before the trial ends to keep your store running without interruption.</p>
    ${ctaButton('Upgrade Now', upgradeUrl)}
  `));

const sendPaymentFailed = (email, planName, updateCardUrl) =>
  sendEmail(email, 'Payment failed — action required', baseLayout(`
    <p>We couldn't process your payment for the <strong>${planName}</strong> plan.</p>
    <p>Please update your payment details to avoid losing access to your store.</p>
    ${ctaButton('Update Payment Details', updateCardUrl)}
  `));

const sendDisputeAlert = (adminEmail, dispute) =>
  sendEmail(adminEmail, `Dispute raised — Order #${dispute.dropshipOrderNumber || dispute.dropship_order_id}`, baseLayout(`
    <p>A dispute has been raised on the platform.</p>
    <ul>
      <li><strong>Dispute ID:</strong> ${dispute.id}</li>
      <li><strong>Raised by:</strong> ${dispute.raised_by_role}</li>
      <li><strong>Reason:</strong> ${dispute.reason}</li>
    </ul>
    ${ctaButton('Review Dispute', config.sellerDashboardUrl + '/admin/disputes/' + dispute.id)}
  `));

const sendEscrowReleased = (supplierEmail, amount, orderNumber) =>
  sendEmail(supplierEmail, `Payment released — Order #${orderNumber}`, baseLayout(`
    <p>The escrow for order <strong>#${orderNumber}</strong> has been released.</p>
    <p>Amount: <strong>₦${Number(amount).toLocaleString()}</strong></p>
    <p>The funds will be transferred to your registered bank account.</p>
  `));

const sendSellerConfirmationPrompt = (sellerEmail, dropshipOrderNumber, dashboardUrl) =>
  sendEmail(sellerEmail, `Action required — Confirm delivery for order #${dropshipOrderNumber}`, baseLayout(`
    <p>Your supplier has marked order <strong>#${dropshipOrderNumber}</strong> as shipped.</p>
    <p>Please confirm delivery or raise a dispute. Escrow will be released to the supplier once you confirm.</p>
    ${ctaButton('Review Order', dashboardUrl)}
  `));

const sendOrderConfirmationToCustomer = (order, business) =>
  sendEmail(order.customer_email, `Order confirmed — #${order.order_number}`, baseLayout(`
    <p>Hi <strong>${order.customer_name}</strong>,</p>
    <p>Your order from <strong>${business.name}</strong> has been confirmed.</p>
    <p><strong>Order #${order.order_number}</strong> — Total: ₦${Number(order.total).toLocaleString()}</p>
    <p>You'll receive a shipping update once your order is on its way.</p>
  `));

const sendOrderNotificationToSeller = (order) =>
  sendEmail(order.sellerEmail, `New order received — #${order.order_number}`, baseLayout(`
    <p>You have a new order!</p>
    <p><strong>Order #${order.order_number}</strong> — ₦${Number(order.total).toLocaleString()}</p>
    ${ctaButton('View Order', config.sellerDashboardUrl + '/orders/' + order.id)}
  `));

const sendDropshipOrderToSupplier = (dropshipOrder) =>
  sendEmail(dropshipOrder.supplierEmail, `New dropship order — #${dropshipOrder.dropship_order_number}`, baseLayout(`
    <p>You have a new dropship order to fulfil.</p>
    <p><strong>Order #${dropshipOrder.dropship_order_number}</strong></p>
    ${ctaButton('View Order', config.sellerDashboardUrl + '/supplier/orders/' + dropshipOrder.id)}
  `));

const sendAbandonedCartEmail = (email, cartItems, storeUrl) =>
  sendEmail(email, 'You left something behind', baseLayout(`
    <p>You left ${cartItems.length} item${cartItems.length !== 1 ? 's' : ''} in your cart.</p>
    ${ctaButton('Complete Your Purchase', storeUrl + '/cart')}
  `));

const sendCampaignEmail = (to, subject, bodyHtml) => sendEmail(to, subject, bodyHtml);

const sendInvoiceEmail = (to, invoiceNumber, pdfUrl) =>
  sendEmail(to, `Invoice #${invoiceNumber}`, baseLayout(`
    <p>Please find your invoice below.</p>
    <p><strong>Invoice #${invoiceNumber}</strong></p>
    ${ctaButton('Download Invoice', pdfUrl)}
  `));

const sendCustomerOtp = (email, firstName, otp, storeName) =>
  sendEmail(email, `Your ${storeName} verification code`, baseLayout(`
    <p>Hi <strong>${firstName}</strong>,</p>
    <p>Your verification code for <strong>${storeName}</strong> is:</p>
    <h2 style="letter-spacing:8px;font-size:36px;text-align:center;">${otp}</h2>
    <p>This code expires in 10 minutes. Do not share it with anyone.</p>
  `));

const sendOrderConfirmation = (email, customerName, orderNumber, total) =>
  sendEmail(email, `Order confirmed — #${orderNumber}`, baseLayout(`
    <p>Hi <strong>${customerName}</strong>,</p>
    <p>Your order has been confirmed.</p>
    <p><strong>Order #${orderNumber}</strong> — Total: ₦${Number(total).toLocaleString()}</p>
    <p>You'll receive a shipping update once your order is on its way.</p>
  `));

module.exports = {
  sendEmail,
  sendVerificationOtp,
  sendPasswordResetOtp,
  sendWelcomeSeller,
  sendWelcomeSupplier,
  sendWelcomeDeveloper,
  sendDeveloperApproval,
  sendSubscriptionConfirmation,
  sendTrialExpiryWarning,
  sendPaymentFailed,
  sendDisputeAlert,
  sendEscrowReleased,
  sendSellerConfirmationPrompt,
  sendOrderConfirmationToCustomer,
  sendOrderNotificationToSeller,
  sendDropshipOrderToSupplier,
  sendAbandonedCartEmail,
  sendCampaignEmail,
  sendInvoiceEmail,
  sendCustomerOtp,
  sendOrderConfirmation,
};
