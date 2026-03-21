import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.EMAIL_FROM || 'noreply@pharmaconnect.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pharmaconnect.com';

// ─────────────────────────────────────────────
// HTML email base template
// ─────────────────────────────────────────────
function baseTemplate(content: string, preheader = ''): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PharmaConnect</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9,#0369a1);padding:32px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:12px;">
                <div style="background:rgba(255,255,255,0.2);border-radius:12px;width:44px;height:44px;line-height:44px;text-align:center;font-size:22px;">💊</div>
                <span style="color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">PharmaConnect</span>
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="color:#94a3b8;font-size:12px;margin:0 0 8px;">
                © ${new Date().getFullYear()} PharmaConnect. All rights reserved.
              </p>
              <p style="color:#94a3b8;font-size:11px;margin:0;">
                <a href="${APP_URL}/privacy" style="color:#0ea5e9;text-decoration:none;">Privacy Policy</a> &nbsp;·&nbsp;
                <a href="${APP_URL}/terms" style="color:#0ea5e9;text-decoration:none;">Terms of Service</a> &nbsp;·&nbsp;
                <a href="${APP_URL}/unsubscribe" style="color:#0ea5e9;text-decoration:none;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function btn(text: string, url: string, color = '#0ea5e9') {
  return `<a href="${url}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;margin:8px 0;">${text}</a>`;
}

function h1(text: string) {
  return `<h1 style="color:#0f172a;font-size:28px;font-weight:800;margin:0 0 8px;letter-spacing:-0.5px;">${text}</h1>`;
}

function p(text: string, muted = false) {
  return `<p style="color:${muted ? '#64748b' : '#334155'};font-size:16px;line-height:1.7;margin:0 0 16px;">${text}</p>`;
}

// ─────────────────────────────────────────────
// Email templates
// ─────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string, role: string) {
  const dashboardUrl = `${APP_URL}/${role === 'consumer' ? 'consumer/home' : role === 'pharmacist' ? 'retailer/dashboard' : 'wholesaler/dashboard'}`;
  const content = `
    ${h1('Welcome to PharmaConnect! 🎉')}
    ${p(`Hi <strong>${name}</strong>, your account is ready.`)}
    ${p(`You've joined as a <strong>${role.replace('_', ' ')}</strong>. Here's what you can do:`)}
    <ul style="color:#334155;font-size:15px;line-height:2;padding-left:20px;margin:0 0 24px;">
      ${role === 'consumer' ? `
        <li>Use the 3D Body Map to get AI drug recommendations</li>
        <li>Scan any medication with the AI Drug Scanner</li>
        <li>Order medications from nearby pharmacies</li>
        <li>Track your health history and prescriptions</li>
      ` : role === 'pharmacist' ? `
        <li>Manage your pharmacy inventory and stock</li>
        <li>Verify and dispense prescriptions digitally</li>
        <li>Process sales through the POS system</li>
      ` : `
        <li>Manage wholesale inventory and orders</li>
        <li>Analyse sales with AI-powered demand forecasting</li>
        <li>Manage retailer relationships and pricing</li>
      `}
    </ul>
    <div style="text-align:center;margin:32px 0;">
      ${btn('Go to Dashboard', dashboardUrl)}
    </div>
    ${p('If you have any questions, reply to this email — we\'re here to help.', true)}
  `;
  return resend.emails.send({
    from: `PharmaConnect <${FROM}>`,
    to,
    subject: `Welcome to PharmaConnect, ${name}! 🎉`,
    html: baseTemplate(content, `Welcome, ${name}! Your account is ready.`),
  });
}

export async function sendOrderConfirmationEmail(to: string, name: string, order: {
  orderNumber: string; items: { name: string; quantity: number; price: number }[]; total: number; status: string;
}) {
  const rows = order.items.map(i =>
    `<tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#334155;">${i.name} ×${i.quantity}</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;color:#0f172a;">$${(i.price * i.quantity).toFixed(2)}</td></tr>`
  ).join('');
  const content = `
    ${h1('Order Confirmed ✅')}
    ${p(`Hi <strong>${name}</strong>, your order has been placed successfully.`)}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0;font-size:14px;color:#166534;"><strong>Order #${order.orderNumber}</strong> · Status: ${order.status}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      ${rows}
      <tr>
        <td style="padding:14px 0;font-weight:800;font-size:18px;color:#0f172a;">Total</td>
        <td style="padding:14px 0;text-align:right;font-weight:800;font-size:18px;color:#0ea5e9;">$${order.total.toFixed(2)}</td>
      </tr>
    </table>
    <div style="text-align:center;margin:24px 0;">
      ${btn('Track My Order', `${APP_URL}/consumer/orders`)}
    </div>
  `;
  return resend.emails.send({
    from: `PharmaConnect <${FROM}>`,
    to,
    subject: `Order Confirmed — #${order.orderNumber}`,
    html: baseTemplate(content, `Your order #${order.orderNumber} is confirmed.`),
  });
}

export async function sendOrderStatusEmail(to: string, name: string, orderNumber: string, status: string, trackingCode?: string) {
  const statusMessages: Record<string, { title: string; body: string; color: string }> = {
    confirmed: { title: 'Order Confirmed 👍', body: 'Your pharmacy has confirmed your order and is preparing it.', color: '#3b82f6' },
    processing: { title: 'Order Being Prepared 🔄', body: 'Your medications are being carefully prepared and packed.', color: '#8b5cf6' },
    dispatched: { title: 'Order Dispatched 🚀', body: 'Your order is on its way!', color: '#06b6d4' },
    out_for_delivery: { title: 'Out for Delivery 🚚', body: 'Your order is out for delivery. Expect it shortly.', color: '#f59e0b' },
    delivered: { title: 'Order Delivered ✅', body: 'Your order has been delivered. We hope you\'re feeling better soon!', color: '#10b981' },
    cancelled: { title: 'Order Cancelled ❌', body: 'Your order has been cancelled. A refund will be processed if applicable.', color: '#ef4444' },
  };
  const msg = statusMessages[status] || { title: `Order Update`, body: `Your order status has been updated to: ${status}`, color: '#0ea5e9' };
  const content = `
    ${h1(msg.title)}
    ${p(`Hi <strong>${name}</strong>,`)}
    ${p(msg.body)}
    <div style="background:#f8fafc;border-left:4px solid ${msg.color};padding:16px 20px;margin:16px 0 24px;border-radius:0 12px 12px 0;">
      <p style="margin:0;font-size:14px;color:#334155;"><strong>Order #${orderNumber}</strong>${trackingCode ? ` · Tracking: <strong>${trackingCode}</strong>` : ''}</p>
    </div>
    <div style="text-align:center;">
      ${btn('View Order Details', `${APP_URL}/consumer/orders`, msg.color)}
    </div>
  `;
  return resend.emails.send({
    from: `PharmaConnect <${FROM}>`,
    to,
    subject: `Order #${orderNumber} — ${msg.title}`,
    html: baseTemplate(content),
  });
}

export async function sendLowStockAlertEmail(to: string, tenantName: string, items: { name: string; quantity: number; reorderLevel: number }[]) {
  const rows = items.slice(0, 10).map(i =>
    `<tr><td style="padding:10px;border-bottom:1px solid #fef3c7;color:#334155;">${i.name}</td><td style="padding:10px;border-bottom:1px solid #fef3c7;text-align:center;color:${i.quantity <= 5 ? '#ef4444' : '#f59e0b'};font-weight:700;">${i.quantity}</td><td style="padding:10px;border-bottom:1px solid #fef3c7;text-align:center;color:#94a3b8;">${i.reorderLevel}</td></tr>`
  ).join('');
  const content = `
    ${h1('⚠️ Low Stock Alert')}
    ${p(`<strong>${tenantName}</strong> has ${items.length} product(s) below reorder level. Immediate restocking is recommended.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;background:#fffbeb;border-radius:12px;overflow:hidden;">
      <tr style="background:#fef3c7;">
        <th style="padding:12px 10px;text-align:left;font-size:13px;color:#92400e;">Product</th>
        <th style="padding:12px 10px;text-align:center;font-size:13px;color:#92400e;">In Stock</th>
        <th style="padding:12px 10px;text-align:center;font-size:13px;color:#92400e;">Reorder At</th>
      </tr>
      ${rows}
    </table>
    <div style="text-align:center;">
      ${btn('Manage Inventory', `${APP_URL}/retailer/stock`, '#f59e0b')}
    </div>
  `;
  return resend.emails.send({
    from: `PharmaConnect Alerts <${FROM}>`,
    to,
    subject: `⚠️ Low Stock Alert — ${items.length} item(s) need restocking`,
    html: baseTemplate(content, `${items.length} products are running low.`),
  });
}

export async function sendExpiryAlertEmail(to: string, tenantName: string, items: { name: string; batch: string; expiryDate: string; quantity: number }[]) {
  const rows = items.slice(0, 10).map(i =>
    `<tr><td style="padding:10px;border-bottom:1px solid #fee2e2;color:#334155;">${i.name}</td><td style="padding:10px;border-bottom:1px solid #fee2e2;font-family:monospace;color:#64748b;">${i.batch}</td><td style="padding:10px;border-bottom:1px solid #fee2e2;text-align:center;color:#ef4444;font-weight:700;">${i.expiryDate}</td><td style="padding:10px;border-bottom:1px solid #fee2e2;text-align:center;">${i.quantity}</td></tr>`
  ).join('');
  const content = `
    ${h1('🗓️ Expiry Alert')}
    ${p(`<strong>${tenantName}</strong> has ${items.length} batch(es) expiring within the next 90 days.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;background:#fff5f5;border-radius:12px;overflow:hidden;">
      <tr style="background:#fee2e2;">
        <th style="padding:12px 10px;text-align:left;font-size:13px;color:#991b1b;">Product</th>
        <th style="padding:12px 10px;text-align:left;font-size:13px;color:#991b1b;">Batch</th>
        <th style="padding:12px 10px;text-align:center;font-size:13px;color:#991b1b;">Expiry Date</th>
        <th style="padding:12px 10px;text-align:center;font-size:13px;color:#991b1b;">Units</th>
      </tr>
      ${rows}
    </table>
    <div style="text-align:center;">
      ${btn('View Inventory', `${APP_URL}/retailer/stock`, '#ef4444')}
    </div>
  `;
  return resend.emails.send({
    from: `PharmaConnect Alerts <${FROM}>`,
    to,
    subject: `🗓️ Expiry Alert — ${items.length} batch(es) expiring soon`,
    html: baseTemplate(content),
  });
}

export async function sendPrescriptionVerifiedEmail(to: string, patientName: string, rxNumber: string, pharmacyName: string) {
  const content = `
    ${h1('Prescription Verified ✅')}
    ${p(`Hi <strong>${patientName}</strong>, great news!`)}
    ${p(`Your prescription <strong>#${rxNumber}</strong> has been verified by <strong>${pharmacyName}</strong> and is ready for dispensing.`)}
    <div style="text-align:center;margin:32px 0;">
      ${btn('View Prescription', `${APP_URL}/consumer/health-history`)}
    </div>
    ${p('Please visit the pharmacy or place an online order to receive your medications.', true)}
  `;
  return resend.emails.send({
    from: `PharmaConnect <${FROM}>`,
    to,
    subject: `Prescription #${rxNumber} Verified ✅`,
    html: baseTemplate(content),
  });
}

export async function sendPasswordResetEmail(to: string, name: string, resetToken: string) {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${resetToken}`;
  const content = `
    ${h1('Reset Your Password 🔑')}
    ${p(`Hi <strong>${name}</strong>, we received a request to reset your password.`)}
    ${p('Click the button below to create a new password. This link expires in <strong>1 hour</strong>.')}
    <div style="text-align:center;margin:32px 0;">
      ${btn('Reset Password', resetUrl, '#8b5cf6')}
    </div>
    <div style="background:#fef9c3;border-radius:12px;padding:16px;margin-top:24px;">
      ${p('If you did not request a password reset, please ignore this email or contact support immediately.', true)}
    </div>
  `;
  return resend.emails.send({
    from: `PharmaConnect Security <${FROM}>`,
    to,
    subject: `Reset your PharmaConnect password`,
    html: baseTemplate(content, 'Reset your password — link expires in 1 hour.'),
  });
}

export async function sendTwoFactorEmail(to: string, name: string, code: string) {
  const content = `
    ${h1('Your Login Code 🔐')}
    ${p(`Hi <strong>${name}</strong>, here is your verification code:`)}
    <div style="text-align:center;margin:32px 0;">
      <div style="display:inline-block;background:#f0f9ff;border:2px solid #0ea5e9;border-radius:16px;padding:20px 40px;">
        <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#0ea5e9;font-family:monospace;">${code}</span>
      </div>
    </div>
    ${p('This code expires in <strong>10 minutes</strong>. Never share it with anyone.')}
    ${p('If you did not attempt to log in, secure your account immediately.', true)}
  `;
  return resend.emails.send({
    from: `PharmaConnect Security <${FROM}>`,
    to,
    subject: `${code} — Your PharmaConnect Login Code`,
    html: baseTemplate(content, `Your one-time login code: ${code}`),
  });
}

export async function sendAIRecommendationEmail(to: string, name: string, symptoms: string[], recs: { drugName: string; dosage: string; isOTC: boolean }[]) {
  const rows = recs.slice(0, 5).map(r =>
    `<tr><td style="padding:12px 10px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#0f172a;">${r.drugName}</td><td style="padding:12px 10px;border-bottom:1px solid #f1f5f9;color:#64748b;">${r.dosage}</td><td style="padding:12px 10px;border-bottom:1px solid #f1f5f9;text-align:center;"><span style="background:${r.isOTC ? '#dcfce7' : '#fef3c7'};color:${r.isOTC ? '#166534' : '#92400e'};padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700;">${r.isOTC ? 'OTC' : 'Rx'}</span></td></tr>`
  ).join('');
  const content = `
    ${h1('Your AI Drug Recommendations 🤖')}
    ${p(`Hi <strong>${name}</strong>, here are your personalized recommendations based on your reported symptoms: <em>${symptoms.join(', ')}</em>.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
      <tr style="background:#f8fafc;"><th style="padding:12px 10px;text-align:left;font-size:13px;color:#475569;">Drug</th><th style="padding:12px 10px;text-align:left;font-size:13px;color:#475569;">Dosage</th><th style="padding:12px 10px;text-align:center;font-size:13px;color:#475569;">Type</th></tr>
      ${rows}
    </table>
    <div style="background:#fffbeb;border:1px solid #fed7aa;border-radius:12px;padding:16px;margin-bottom:24px;">
      ${p('⚠️ These are AI-generated suggestions only. Always consult a licensed pharmacist or doctor before taking any medication.', true)}
    </div>
    <div style="text-align:center;">
      ${btn('View Full Recommendations', `${APP_URL}/consumer/health-history`)}
    </div>
  `;
  return resend.emails.send({
    from: `PharmaConnect AI <${FROM}>`,
    to,
    subject: `Your AI Drug Recommendations are ready`,
    html: baseTemplate(content),
  });
}

export { resend };
