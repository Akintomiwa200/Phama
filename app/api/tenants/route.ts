import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { TenantModel } from '@/lib/models';
import { apiSuccess, apiError, apiPaginated, getPaginationSkip } from '@/utils/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const TenantSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['wholesaler', 'retailer']),
  subdomain: z.string().min(2).regex(/^[a-z0-9-]+$/),
  plan: z.enum(['starter', 'professional', 'enterprise']).default('starter'),
  licenseNumber: z.string().optional(),
  address: z.object({ street: z.string(), city: z.string(), state: z.string(), country: z.string(), zipCode: z.string() }).optional(),
  contact: z.object({ name: z.string().optional(), email: z.string().optional(), phone: z.string() }).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;
    if (user.role !== 'super_admin') return apiError('Forbidden', 403);

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || '';
    const search = searchParams.get('search') || '';

    const query: Record<string, unknown> = {};
    if (type) query.type = type;
    if (search) query.name = { $regex: search, $options: 'i' };

    const skip = getPaginationSkip(page, limit);
    const [tenants, total] = await Promise.all([
      TenantModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      TenantModel.countDocuments(query),
    ]);
    return apiPaginated(tenants, total, page, limit);
  } catch {
    return apiError('Failed to fetch tenants', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    if ((session.user as any).role !== 'super_admin') return apiError('Forbidden', 403);

    await connectDB();
    const body = await req.json();
    const data = TenantSchema.parse(body);

    const exists = await TenantModel.findOne({ subdomain: data.subdomain });
    if (exists) return apiError('Subdomain already taken', 409);

    const tenant = await TenantModel.create(data);
    return apiSuccess(tenant, 201);
  } catch (err) {
    if (err instanceof z.ZodError) return apiError(err.errors[0].message, 422);
    return apiError('Failed to create tenant', 500);
  }
}
