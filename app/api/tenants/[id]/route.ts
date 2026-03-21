import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { TenantModel } from '@/lib/models';
import { apiSuccess, apiError } from '@/utils/server';
import { auth } from '@/lib/auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    await connectDB();
    const tenant = await TenantModel.findById(id).lean();
    if (!tenant) return apiError('Not found', 404);
    return apiSuccess(tenant);
  } catch { return apiError('Failed', 500); }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    if ((session.user as any).role !== 'super_admin') return apiError('Forbidden', 403);
    await connectDB();
    const body = await req.json();
    const tenant = await TenantModel.findByIdAndUpdate(id, body, { new: true });
    if (!tenant) return apiError('Not found', 404);
    return apiSuccess(tenant);
  } catch { return apiError('Failed', 500); }
}
