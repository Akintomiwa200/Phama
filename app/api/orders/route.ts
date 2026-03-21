import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { OrderModel, InventoryModel, NotificationModel } from '@/lib/models';
import { apiSuccess, apiError, apiPaginated, getPaginationSkip, generateOrderNumber } from '@/utils/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const OrderItemSchema = z.object({
  drugId: z.string(),
  inventoryItemId: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  discount: z.number().default(0),
  batchNumber: z.string(),
});

const CreateOrderSchema = z.object({
  type: z.enum(['consumer_to_retailer', 'retailer_to_wholesaler', 'pos']),
  sellerId: z.string(),
  items: z.array(OrderItemSchema).min(1),
  payment: z.object({
    method: z.enum(['cash', 'card', 'bank_transfer', 'mobile_money', 'credit']),
  }),
  delivery: z.object({
    address: z.object({
      street: z.string(), city: z.string(), state: z.string(),
      country: z.string(), zipCode: z.string(),
    }).optional(),
    method: z.enum(['standard', 'express', 'same_day', 'pickup']).optional(),
  }).optional(),
  prescription: z.string().optional(),
  notes: z.string().optional(),
  discount: z.number().default(0),
  deliveryFee: z.number().default(0),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';

    const query: Record<string, unknown> = {};

    // Scope by role
    if (user.role === 'consumer') {
      query.buyerId = user.id;
    } else if (user.tenantId) {
      query.tenantId = user.tenantId;
    }

    if (status) query.status = status;
    if (type) query.type = type;
    if (from || to) {
      query.createdAt = {};
      if (from) (query.createdAt as any).$gte = new Date(from);
      if (to) (query.createdAt as any).$lte = new Date(to);
    }

    const skip = getPaginationSkip(page, limit);

    const [orders, total] = await Promise.all([
      OrderModel.find(query)
        .populate('buyerId', 'name email phone')
        .populate('items.drugId', 'name genericName form strength')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrderModel.countDocuments(query),
    ]);

    return apiPaginated(orders, total, page, limit);
  } catch (err) {
    console.error('[GET /api/orders]', err);
    return apiError('Failed to fetch orders', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;

    await connectDB();
    const body = await req.json();
    const data = CreateOrderSchema.parse(body);

    // Calculate totals
    let subtotal = 0;
    const enrichedItems = [];

    for (const item of data.items) {
      // Check inventory
      const invItem = await InventoryModel.findById(item.inventoryItemId);
      if (!invItem) return apiError(`Inventory item not found: ${item.inventoryItemId}`, 404);
      if (invItem.quantity < item.quantity) {
        return apiError(`Insufficient stock for item ${item.inventoryItemId}. Available: ${invItem.quantity}`, 400);
      }

      const lineTotal = (item.unitPrice * item.quantity) - item.discount;
      subtotal += lineTotal;
      enrichedItems.push({ ...item, total: lineTotal });
    }

    const taxRate = 0.08; // 8% default, should come from tenant settings
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const total = subtotal + tax - data.discount + data.deliveryFee;

    // Create order
    const order = await OrderModel.create({
      orderNumber: generateOrderNumber(),
      tenantId: user.tenantId || data.sellerId,
      type: data.type,
      buyerId: user.id,
      sellerId: data.sellerId,
      items: enrichedItems,
      status: data.type === 'pos' ? 'delivered' : 'pending',
      payment: {
        ...data.payment,
        status: data.type === 'pos' && data.payment.method === 'cash' ? 'paid' : 'pending',
        paidAt: data.type === 'pos' ? new Date() : undefined,
      },
      delivery: data.delivery ? {
        ...data.delivery,
        trackingCode: 'TRK-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
      } : undefined,
      prescription: data.prescription,
      subtotal,
      tax,
      discount: data.discount,
      deliveryFee: data.deliveryFee,
      total,
      notes: data.notes,
      statusHistory: [{
        status: data.type === 'pos' ? 'delivered' : 'pending',
        changedAt: new Date(),
        changedBy: user.id,
        note: data.type === 'pos' ? 'POS sale' : 'Order placed',
      }],
    });

    // Reserve inventory
    for (const item of data.items) {
      await InventoryModel.findByIdAndUpdate(item.inventoryItemId, {
        $inc: { reservedQuantity: item.quantity },
        ...(data.type === 'pos' ? { $inc: { quantity: -item.quantity, reservedQuantity: 0 } } : {}),
      });
    }

    // Notify seller
    await NotificationModel.create({
      userId: data.sellerId,
      tenantId: user.tenantId || data.sellerId,
      type: 'order',
      title: 'New Order Received',
      message: `New order #${order.orderNumber} for $${total.toFixed(2)}`,
      data: { orderId: order._id },
    });

    return apiSuccess(order, 201);
  } catch (err) {
    if (err instanceof z.ZodError) return apiError(err.errors[0].message, 422);
    console.error('[POST /api/orders]', err);
    return apiError('Failed to create order', 500);
  }
}
