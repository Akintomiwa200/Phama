import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { OrderModel, InventoryModel, NotificationModel } from '@/lib/models';
import { apiSuccess, apiError } from '@/utils/server';
import { auth } from '@/lib/auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    await connectDB();

    const order = await OrderModel.findById(id)
      .populate('buyerId', 'name email phone')
      .populate('items.drugId', 'name genericName brand form strength images')
      .populate('delivery.driverId', 'name phone')
      .lean();

    if (!order) return apiError('Order not found', 404);
    return apiSuccess(order);
  } catch {
    return apiError('Failed to fetch order', 500);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;

    await connectDB();
    const body = await req.json();
    const { status, note, driverId, paymentStatus } = body;

    const order = await OrderModel.findById(id);
    if (!order) return apiError('Order not found', 404);

    const updates: Record<string, unknown> = {};

    if (status) {
      updates.status = status;
      updates.$push = {
        statusHistory: {
          status,
          changedAt: new Date(),
          changedBy: user.id,
          note,
        },
      };

      // Deduct inventory when confirmed/processing
      if (status === 'confirmed') {
        for (const item of order.items) {
          await InventoryModel.findByIdAndUpdate(item.inventoryItemId, {
            $inc: { quantity: -item.quantity, reservedQuantity: -item.quantity },
          });
        }
      }

      // Set delivery times
      if (status === 'delivered') {
        updates['delivery.deliveredAt'] = new Date();
        updates['payment.status'] = 'paid';
        updates['payment.paidAt'] = new Date();
      }
    }

    if (driverId) {
      updates['delivery.driverId'] = driverId;
    }

    if (paymentStatus) {
      updates['payment.status'] = paymentStatus;
      if (paymentStatus === 'paid') updates['payment.paidAt'] = new Date();
    }

    const updated = await OrderModel.findByIdAndUpdate(id, updates, { new: true });

    // Send notification to buyer
    if (status) {
      await NotificationModel.create({
        userId: order.buyerId,
        type: 'order',
        title: `Order ${status.replace('_', ' ')}`,
        message: `Your order #${order.orderNumber} is now ${status.replace('_', ' ')}.`,
        data: { orderId: order._id },
      });
    }

    return apiSuccess(updated);
  } catch {
    return apiError('Failed to update order', 500);
  }
}
