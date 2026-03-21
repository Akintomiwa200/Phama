import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { DeliveryModel, OrderModel } from '@/lib/models';
import { apiSuccess, apiError } from '@/utils/server';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;
    await connectDB();

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const trackingCode = searchParams.get('trackingCode');

    const query: Record<string, unknown> = {};
    if (orderId) query.orderId = orderId;
    if (trackingCode) query['delivery.trackingCode'] = trackingCode;
    if (user.role === 'driver') query.driverId = user.id;
    else if (user.tenantId) query.tenantId = user.tenantId;

    const deliveries = await DeliveryModel.find(query)
      .populate('orderId', 'orderNumber total buyerId')
      .populate('driverId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return apiSuccess(deliveries);
  } catch { return apiError('Failed to fetch deliveries', 500); }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;
    await connectDB();

    const body = await req.json();
    const { deliveryId, status, currentLocation, temperature } = body;

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (currentLocation) {
      updates.currentLocation = currentLocation;
      updates.$push = { route: { ...currentLocation, timestamp: new Date() } };
    }
    if (temperature !== undefined) {
      updates.$push = { ...(updates.$push as any), temperature: { value: temperature, recordedAt: new Date(), isAlert: temperature > 25 || temperature < 2 } };
    }
    if (status === 'delivered') updates.actualDelivery = new Date();

    const delivery = await DeliveryModel.findByIdAndUpdate(deliveryId, updates, { new: true });
    if (!delivery) return apiError('Delivery not found', 404);

    // Sync order status
    if (status === 'delivered') {
      await OrderModel.findByIdAndUpdate(delivery.orderId, { status: 'delivered', 'delivery.deliveredAt': new Date() });
    }

    return apiSuccess(delivery);
  } catch { return apiError('Failed to update delivery', 500); }
}
