import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { InventoryModel } from '@/lib/models';
import { apiSuccess, apiError, apiPaginated, getPaginationSkip } from '@/utils/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const InventorySchema = z.object({
  drugId: z.string(),
  quantity: z.number().min(0),
  batchNumber: z.string(),
  lotNumber: z.string().optional(),
  expiryDate: z.string().transform(s => new Date(s)),
  manufacturingDate: z.string().optional().transform(s => s ? new Date(s) : undefined),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  wholesalePrice: z.number().optional(),
  reorderLevel: z.number().default(10),
  maxLevel: z.number().default(500),
  location: z.string().optional(),
  supplierId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const tenantId = (session.user as any).tenantId;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const lowStock = searchParams.get('lowStock') === 'true';
    const expiringSoon = searchParams.get('expiringSoon') === 'true';
    const expired = searchParams.get('expired') === 'true';

    const query: Record<string, unknown> = { tenantId };

    if (lowStock) {
      query.$expr = { $lte: ['$quantity', '$reorderLevel'] };
    }

    if (expiringSoon) {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() + 90);
      query.expiryDate = { $lte: threshold, $gte: new Date() };
    }

    if (expired) {
      query.expiryDate = { $lt: new Date() };
    }

    const skip = getPaginationSkip(page, limit);

    const [items, total] = await Promise.all([
      InventoryModel.find(query)
        .populate('drugId', 'name genericName brand form strength images')
        .sort({ expiryDate: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InventoryModel.countDocuments(query),
    ]);

    // Add search filter on populated data
    const filtered = search
      ? items.filter((item: any) =>
          item.drugId?.name?.toLowerCase().includes(search.toLowerCase()) ||
          item.batchNumber?.toLowerCase().includes(search.toLowerCase())
        )
      : items;

    return apiPaginated(filtered, total, page, limit);
  } catch (err) {
    console.error('[GET /api/inventory]', err);
    return apiError('Failed to fetch inventory', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const tenantId = (session.user as any).tenantId;
    const role = (session.user as any).role;
    if (!['super_admin', 'tenant_admin', 'inventory_manager'].includes(role)) {
      return apiError('Forbidden', 403);
    }

    await connectDB();
    const body = await req.json();
    const data = InventorySchema.parse(body);

    // Check if same drug+batch exists for this tenant
    const existing = await InventoryModel.findOne({
      tenantId,
      drugId: data.drugId,
      batchNumber: data.batchNumber,
    });

    if (existing) {
      // Update quantity
      existing.quantity += data.quantity;
      await existing.save();
      return apiSuccess(existing);
    }

    const item = await InventoryModel.create({ ...data, tenantId });
    return apiSuccess(item, 201);
  } catch (err) {
    if (err instanceof z.ZodError) return apiError(err.errors[0].message, 422);
    return apiError('Failed to create inventory item', 500);
  }
}
