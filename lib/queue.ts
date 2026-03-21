import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import {
  sendWelcomeEmail, sendOrderConfirmationEmail, sendOrderStatusEmail,
  sendLowStockAlertEmail, sendExpiryAlertEmail, sendPrescriptionVerifiedEmail,
  sendAIRecommendationEmail, sendTwoFactorEmail,
} from './email';
import {
  sendWelcomeSMS, sendOrderConfirmationSMS, sendOrderStatusSMS,
  sendLowStockSMS, sendExpiryWarningSMS, sendPrescriptionReadySMS,
  sendNewOrderSMS, sendDeliveryArrivingSMS,
} from './sms';
import { connectDB } from './db';
import { InventoryModel, UserModel, TenantModel } from './models';

// ─────────────────────────────────────────────
// Redis connection
// ─────────────────────────────────────────────
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  password: process.env.REDIS_PASSWORD,
});

// ─────────────────────────────────────────────
// Queue definitions
// ─────────────────────────────────────────────
export const notificationQueue = new Queue('notifications', { connection });
export const inventoryQueue = new Queue('inventory-checks', { connection });
export const analyticsQueue = new Queue('analytics', { connection });
export const emailQueue = new Queue('emails', { connection });
export const smsQueue = new Queue('sms', { connection });

// ─────────────────────────────────────────────
// Job type definitions
// ─────────────────────────────────────────────
export type NotificationJob =
  | { type: 'welcome'; userId: string; email: string; phone?: string; name: string; role: string }
  | { type: 'order_confirmed'; userId: string; email: string; phone?: string; name: string; orderNumber: string; total: number; items: any[] }
  | { type: 'order_status'; userId: string; email: string; phone?: string; name: string; orderNumber: string; status: string; trackingCode?: string }
  | { type: 'prescription_verified'; patientId: string; email: string; phone?: string; name: string; rxNumber: string; pharmacyName: string }
  | { type: 'ai_recommendations'; userId: string; email: string; name: string; symptoms: string[]; recs: any[] }
  | { type: 'two_factor'; email: string; phone?: string; name: string; code: string; channel: 'email' | 'sms' | 'both' }
  | { type: 'delivery_arriving'; phone: string; driverName: string; eta: string }
  | { type: 'new_order_for_seller'; phone: string; orderNumber: string; total: number; itemCount: number };

// ─────────────────────────────────────────────
// Job helpers
// ─────────────────────────────────────────────
export async function queueNotification(job: NotificationJob, opts?: { delay?: number; priority?: number }) {
  return notificationQueue.add(job.type, job, {
    delay: opts?.delay,
    priority: opts?.priority ?? 5,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
}

export async function queueEmail(template: string, data: Record<string, any>) {
  return emailQueue.add(template, data, { attempts: 3, backoff: { type: 'fixed', delay: 5000 } });
}

export async function queueSMS(phone: string, message: string) {
  return smsQueue.add('send', { phone, message }, { attempts: 2, backoff: { type: 'fixed', delay: 3000 } });
}

// ─────────────────────────────────────────────
// Scheduled jobs (called from cron or at startup)
// ─────────────────────────────────────────────
export async function scheduleInventoryChecks() {
  // Run every day at 8 AM
  await inventoryQueue.add('daily-check', {}, {
    repeat: { cron: '0 8 * * *' },
    attempts: 2,
  });
}

export async function scheduleExpiryChecks() {
  await inventoryQueue.add('expiry-check', {}, {
    repeat: { cron: '0 9 * * *' },
    attempts: 2,
  });
}

// ─────────────────────────────────────────────
// Workers (run in a separate process or via server)
// ─────────────────────────────────────────────
let workersStarted = false;

export function startWorkers() {
  if (workersStarted) return;
  workersStarted = true;

  // Notification worker
  const notifWorker = new Worker('notifications', async (job: Job) => {
    const data = job.data as NotificationJob;
    console.log(`[Queue] Processing notification: ${data.type}`);

    switch (data.type) {
      case 'welcome':
        await Promise.allSettled([
          sendWelcomeEmail(data.email, data.name, data.role),
          data.phone ? sendWelcomeSMS(data.phone, data.name) : Promise.resolve(),
        ]);
        break;

      case 'order_confirmed':
        await Promise.allSettled([
          sendOrderConfirmationEmail(data.email, data.name, {
            orderNumber: data.orderNumber,
            items: data.items,
            total: data.total,
            status: 'confirmed',
          }),
          data.phone ? sendOrderConfirmationSMS(data.phone, data.orderNumber, data.total) : Promise.resolve(),
        ]);
        break;

      case 'order_status':
        await Promise.allSettled([
          sendOrderStatusEmail(data.email, data.name, data.orderNumber, data.status, data.trackingCode),
          data.phone ? sendOrderStatusSMS(data.phone, data.orderNumber, data.status, data.trackingCode) : Promise.resolve(),
        ]);
        break;

      case 'prescription_verified':
        await Promise.allSettled([
          sendPrescriptionVerifiedEmail(data.email, data.name, data.rxNumber, data.pharmacyName),
          data.phone ? sendPrescriptionReadySMS(data.phone, data.rxNumber, data.pharmacyName) : Promise.resolve(),
        ]);
        break;

      case 'ai_recommendations':
        await sendAIRecommendationEmail(data.email, data.name, data.symptoms, data.recs);
        break;

      case 'two_factor':
        if (data.channel === 'email' || data.channel === 'both') {
          await sendTwoFactorEmail(data.email, data.name, data.code);
        }
        if ((data.channel === 'sms' || data.channel === 'both') && data.phone) {
          const { sendOtpSMS } = await import('./sms');
          await sendOtpSMS(data.phone, data.code);
        }
        break;

      case 'delivery_arriving':
        await sendDeliveryArrivingSMS(data.phone, data.driverName, data.eta);
        break;

      case 'new_order_for_seller':
        await sendNewOrderSMS(data.phone, data.orderNumber, data.total, data.itemCount);
        break;
    }
  }, { connection, concurrency: 5 });

  // Inventory worker — daily checks
  const invWorker = new Worker('inventory-checks', async (job: Job) => {
    if (job.name === 'daily-check') await checkLowStock();
    if (job.name === 'expiry-check') await checkExpiry();
  }, { connection, concurrency: 2 });

  notifWorker.on('failed', (job, err) => console.error(`[Queue] Job ${job?.id} failed:`, err.message));
  invWorker.on('failed', (job, err) => console.error(`[Queue] Inventory job ${job?.id} failed:`, err.message));
  console.log('[Queue] Workers started');
}

// ─────────────────────────────────────────────
// Inventory check functions
// ─────────────────────────────────────────────
async function checkLowStock() {
  await connectDB();
  const tenants = await TenantModel.find({ isActive: true }).lean();

  for (const tenant of tenants) {
    const lowItems = await InventoryModel.find({
      tenantId: tenant._id,
      $expr: { $lte: ['$quantity', '$reorderLevel'] },
    }).populate('drugId', 'name').lean() as any[];

    if (lowItems.length > 0) {
      // Find tenant admin email
      const admin = await UserModel.findOne({ tenantId: tenant._id, role: { $in: ['tenant_admin', 'inventory_manager'] } }).lean() as any;
      if (admin?.email) {
        await sendLowStockAlertEmail(admin.email, (tenant as any).name, lowItems.map((i: any) => ({
          name: i.drugId?.name || 'Unknown',
          quantity: i.quantity,
          reorderLevel: i.reorderLevel,
        })));
        if (admin.phone) {
          await sendLowStockSMS(admin.phone, `${lowItems.length} products`, lowItems[0].quantity);
        }
      }
    }
  }
}

async function checkExpiry() {
  await connectDB();
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + 90);
  const tenants = await TenantModel.find({ isActive: true }).lean();

  for (const tenant of tenants) {
    const expiringItems = await InventoryModel.find({
      tenantId: tenant._id,
      expiryDate: { $lte: threshold, $gte: new Date() },
    }).populate('drugId', 'name').lean() as any[];

    if (expiringItems.length > 0) {
      const admin = await UserModel.findOne({ tenantId: tenant._id, role: { $in: ['tenant_admin', 'inventory_manager'] } }).lean() as any;
      if (admin?.email) {
        await sendExpiryAlertEmail(admin.email, (tenant as any).name, expiringItems.map((i: any) => ({
          name: i.drugId?.name || 'Unknown',
          batch: i.batchNumber,
          expiryDate: new Date(i.expiryDate).toLocaleDateString(),
          quantity: i.quantity,
        })));
      }
    }
  }
}

export default { notificationQueue, inventoryQueue, emailQueue, smsQueue, queueNotification };
