import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { UserModel } from '@/lib/models';
import { apiSuccess, apiError } from '@/utils/server';
import { auth } from '@/lib/auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    await connectDB();
    const user = await UserModel.findById(id).select('-password -twoFactorSecret').lean();
    if (!user) return apiError('Not found', 404);
    return apiSuccess(user);
  } catch { return apiError('Failed', 500); }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const currentUser = session.user as any;
    // Only self or admin can update
    if (currentUser.id !== id && !['super_admin', 'tenant_admin'].includes(currentUser.role)) {
      return apiError('Forbidden', 403);
    }
    await connectDB();
    const body = await req.json();
    // Never allow password update through this endpoint directly
    delete body.password;
    delete body.twoFactorSecret;
    const user = await UserModel.findByIdAndUpdate(id, { $set: body }, { new: true }).select('-password -twoFactorSecret').lean();
    if (!user) return apiError('Not found', 404);
    return apiSuccess(user);
  } catch { return apiError('Failed', 500); }
}
