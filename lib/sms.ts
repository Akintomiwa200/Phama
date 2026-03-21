// ─────────────────────────────────────────────
// Core send function with error handling (Textbelt Free SMS)
// ─────────────────────────────────────────────
// Note: Textbelt provides 1 free SMS per day per IP address using the "textbelt" key.
// For higher volume, you would need to use a paid key or another provider.

async function sendSMS(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    // Normalize number — ensure starts with +
    const normalized = to.startsWith('+') ? to : `+${to}`;

    // Call Textbelt API
    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: normalized,
        message: body,
        key: 'textbelt', // Free tier key
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log(`[SMS SUCCESS] Sent to ${normalized} via Textbelt — ID: ${data.textId}`);
      return { success: true, sid: data.textId };
    } else {
      console.error(`[SMS FAILED] Textbelt Error: ${data.error}`);
      return { success: false, error: data.error };
    }
  } catch (err: any) {
    console.error(`[SMS Error]`, err.message);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// SMS templates
// ─────────────────────────────────────────────

export async function sendWelcomeSMS(phone: string, name: string) {
  return sendSMS(phone, `Welcome to PharmaConnect, ${name}! 💊 Your account is ready. Download the app or visit pharmaconnect.com`);
}

export async function sendOtpSMS(phone: string, code: string) {
  return sendSMS(phone, `PharmaConnect: Your verification code is ${code}. Expires in 10 minutes. Do not share this code.`);
}

export async function sendOrderConfirmationSMS(phone: string, orderNumber: string, total: number) {
  return sendSMS(phone, `PharmaConnect ✅ Order #${orderNumber} confirmed. Total: $${total.toFixed(2)}. Track your order at pharmaconnect.com/consumer/orders`);
}

export async function sendOrderStatusSMS(phone: string, orderNumber: string, status: string, trackingCode?: string) {
  const statusMsg: Record<string, string> = {
    confirmed: '✅ confirmed',
    processing: '🔄 being prepared',
    packed: '📦 packed',
    dispatched: '🚀 dispatched',
    out_for_delivery: '🚚 out for delivery',
    delivered: '✅ delivered',
    cancelled: '❌ cancelled',
  };
  const msg = statusMsg[status] || status;
  const tracking = trackingCode ? ` Tracking: ${trackingCode}.` : '';
  return sendSMS(phone, `PharmaConnect: Order #${orderNumber} is now ${msg}.${tracking} pharmaconnect.com/consumer/orders`);
}

export async function sendDeliveryArrivingSMS(phone: string, driverName: string, eta: string) {
  return sendSMS(phone, `PharmaConnect 🚚 Your delivery is arriving in ~${eta}. Driver: ${driverName}. Please be available to receive your order.`);
}

export async function sendDeliveryProofSMS(phone: string, orderNumber: string) {
  return sendSMS(phone, `PharmaConnect ✅ Order #${orderNumber} has been delivered. Thank you for choosing PharmaConnect!`);
}

export async function sendLowStockSMS(phone: string, drugName: string, quantity: number) {
  return sendSMS(phone, `PharmaConnect ⚠️ LOW STOCK ALERT: ${drugName} is down to ${quantity} units. Reorder immediately at pharmaconnect.com/retailer/stock`);
}

export async function sendExpiryWarningSMS(phone: string, drugName: string, batchNumber: string, daysLeft: number) {
  return sendSMS(phone, `PharmaConnect 🗓️ EXPIRY WARNING: ${drugName} (Batch ${batchNumber}) expires in ${daysLeft} days. Take action at pharmaconnect.com/retailer/stock`);
}

export async function sendPrescriptionReadySMS(phone: string, rxNumber: string, pharmacyName: string) {
  return sendSMS(phone, `PharmaConnect 💊 Prescription #${rxNumber} is verified and ready at ${pharmacyName}. Visit or order online at pharmaconnect.com`);
}

export async function sendNewOrderSMS(phone: string, orderNumber: string, total: number, itemCount: number) {
  return sendSMS(phone, `PharmaConnect 🛒 NEW ORDER #${orderNumber}: ${itemCount} item(s), $${total.toFixed(2)}. Confirm at pharmaconnect.com/retailer/dashboard`);
}

export async function sendPasswordResetSMS(phone: string, code: string) {
  return sendSMS(phone, `PharmaConnect 🔑 Password reset code: ${code}. Expires in 15 minutes. Ignore if you did not request this.`);
}

export async function sendSecurityAlertSMS(phone: string, action: string, location?: string) {
  return sendSMS(phone, `PharmaConnect 🔐 Security alert: ${action}${location ? ` from ${location}` : ''}. If this wasn't you, secure your account immediately.`);
}

export async function sendBulkPromoSMS(phones: string[], message: string) {
  const results = await Promise.allSettled(phones.map(phone => sendSMS(phone, message)));
  const success = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
  return { sent: success, failed: phones.length - success, total: phones.length };
}
