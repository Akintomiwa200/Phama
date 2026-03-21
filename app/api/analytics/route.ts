import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { OrderModel, InventoryModel, UserModel, SymptomLogModel, DrugModel } from '@/lib/models';
import { apiSuccess, apiError } from '@/utils/server';
import { auth } from '@/lib/auth';
import { subDays, startOfDay, format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const period = parseInt(searchParams.get('period') || '30');
    const tenantId = user.role === 'super_admin'
      ? (searchParams.get('tenantId') || undefined)
      : user.tenantId;

    const startDate = subDays(new Date(), period);
    const prevStartDate = subDays(new Date(), period * 2);

    const orderQuery: Record<string, unknown> = {
      createdAt: { $gte: startDate },
    };
    if (tenantId) orderQuery.tenantId = tenantId;

    const prevOrderQuery = {
      ...orderQuery,
      createdAt: { $gte: prevStartDate, $lt: startDate },
    };

    // --- Aggregations in parallel ---
    const [
      currentOrders,
      prevOrders,
      inventoryStats,
      topDrugs,
      revenueByDay,
      ordersByStatus,
      newUsers,
      symptomFrequency,
    ] = await Promise.all([
      // Current period orders
      OrderModel.aggregate([
        { $match: orderQuery },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),

      // Previous period orders
      OrderModel.aggregate([
        { $match: prevOrderQuery },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),

      // Inventory stats
      InventoryModel.aggregate([
        ...(tenantId ? [{ $match: { tenantId } }] : []),
        {
          $group: {
            _id: null,
            totalItems: { $sum: 1 },
            lowStock: { $sum: { $cond: [{ $lte: ['$quantity', '$reorderLevel'] }, 1, 0] } },
            expiringSoon: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $lte: ['$expiryDate', new Date(Date.now() + 90 * 86400000)] },
                      { $gte: ['$expiryDate', new Date()] },
                    ],
                  },
                  1, 0,
                ],
              },
            },
            expired: { $sum: { $cond: [{ $lt: ['$expiryDate', new Date()] }, 1, 0] } },
          },
        },
      ]),

      // Top drugs by revenue
      OrderModel.aggregate([
        { $match: orderQuery },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.drugId',
            revenue: { $sum: '$items.total' },
            quantity: { $sum: '$items.quantity' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'drugs',
            localField: '_id',
            foreignField: '_id',
            as: 'drug',
          },
        },
        { $unwind: '$drug' },
        {
          $project: {
            name: '$drug.name',
            revenue: 1,
            quantity: 1,
            orders: 1,
          },
        },
      ]),

      // Revenue by day
      OrderModel.aggregate([
        { $match: orderQuery },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Orders by status
      OrderModel.aggregate([
        { $match: orderQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // New users
      UserModel.countDocuments({
        createdAt: { $gte: startDate },
        ...(tenantId ? { tenantId } : {}),
      }),

      // Top symptoms
      SymptomLogModel.aggregate([
        { $match: { loggedAt: { $gte: startDate } } },
        { $unwind: '$symptoms' },
        { $group: { _id: '$symptoms', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const current = currentOrders[0] || { total: 0, count: 0 };
    const prev = prevOrders[0] || { total: 0, count: 1 };
    const inventory = inventoryStats[0] || { totalItems: 0, lowStock: 0, expiringSoon: 0, expired: 0 };

    const revenueGrowth = prev.total > 0
      ? ((current.total - prev.total) / prev.total) * 100
      : 0;
    const ordersGrowth = prev.count > 0
      ? ((current.count - prev.count) / prev.count) * 100
      : 0;

    // Fill missing days
    const dayMap: Record<string, { revenue: number; orders: number }> = {};
    revenueByDay.forEach((d: any) => { dayMap[d._id] = { revenue: d.revenue, orders: d.orders }; });

    const filledDays = Array.from({ length: period }, (_, i) => {
      const date = format(subDays(new Date(), period - 1 - i), 'yyyy-MM-dd');
      return {
        label: date,
        value: dayMap[date]?.revenue || 0,
        secondary: dayMap[date]?.orders || 0,
      };
    });

    return apiSuccess({
      totalRevenue: current.total,
      totalOrders: current.count,
      totalCustomers: newUsers,
      totalProducts: inventory.totalItems,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      ordersGrowth: Math.round(ordersGrowth * 10) / 10,
      topDrugs: topDrugs.map((d: any) => ({
        id: d._id,
        name: d.name,
        value: d.revenue,
        change: 0,
        quantity: d.quantity,
      })),
      revenueByDay: filledDays,
      ordersByStatus: ordersByStatus.map((s: any) => ({ label: s._id, value: s.count })),
      inventoryAlerts: inventory.lowStock + inventory.expiringSoon + inventory.expired,
      lowStockItems: inventory.lowStock,
      expiringSoon: inventory.expiringSoon,
      expiredItems: inventory.expired,
      topSymptoms: symptomFrequency.map((s: any) => ({ label: s._id, value: s.count })),
    });
  } catch (err) {
    console.error('[GET /api/analytics]', err);
    return apiError('Failed to fetch analytics', 500);
  }
}
