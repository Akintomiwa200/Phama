import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { DrugModel } from '@/lib/models';
import { apiSuccess, apiError } from '@/utils/server';
import { auth } from '@/lib/auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    await connectDB();
    const drug = await DrugModel.findById(id).lean();
    if (!drug) return apiError('Drug not found', 404);
    return apiSuccess(drug);
  } catch {
    return apiError('Failed to fetch drug', 500);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const role = (session.user as any).role;
    if (!['super_admin', 'tenant_admin', 'inventory_manager'].includes(role)) {
      return apiError('Forbidden', 403);
    }
    await connectDB();
    const body = await req.json();
    const drug = await DrugModel.findByIdAndUpdate(id, body, { new: true });
    if (!drug) return apiError('Drug not found', 404);
    return apiSuccess(drug);
  } catch {
    return apiError('Failed to update drug', 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const role = (session.user as any).role;
    if (!['super_admin'].includes(role)) return apiError('Forbidden', 403);
    await connectDB();
    await DrugModel.findByIdAndUpdate(id, { isActive: false });
    return apiSuccess({ deleted: true });
  } catch {
    return apiError('Failed to delete drug', 500);
  }
}
