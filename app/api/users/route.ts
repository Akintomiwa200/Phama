import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { UserModel } from '@/lib/models';
import { apiSuccess, apiError } from '@/utils/server';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  role: z.enum(['consumer', 'pharmacist', 'cashier', 'inventory_manager', 'driver', 'doctor']).default('consumer'),
  tenantId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const data = RegisterSchema.parse(body);

    const exists = await UserModel.findOne({ email: data.email });
    if (exists) return apiError('Email already registered', 409);

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await UserModel.create({
      ...data,
      password: hashedPassword,
    });

    return apiSuccess({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }, 201);
  } catch (err) {
    if (err instanceof z.ZodError) return apiError(err.errors[0].message, 422);
    return apiError('Registration failed', 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const currentUser = session.user as any;

    if (!['super_admin', 'tenant_admin'].includes(currentUser.role)) {
      return apiError('Forbidden', 403);
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const tenantId = currentUser.role === 'super_admin'
      ? searchParams.get('tenantId')
      : currentUser.tenantId;

    const query: Record<string, unknown> = tenantId ? { tenantId } : {};
    const role = searchParams.get('role');
    if (role) query.role = role;

    const users = await UserModel.find(query)
      .select('-password -twoFactorSecret')
      .sort({ createdAt: -1 })
      .lean();

    return apiSuccess(users);
  } catch {
    return apiError('Failed to fetch users', 500);
  }
}
