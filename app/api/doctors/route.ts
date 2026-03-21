import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { DoctorProfileModel } from '@/lib/consultationModels';
import { UserModel } from '@/lib/models';
import { apiSuccess, apiError, apiPaginated, getPaginationSkip } from '@/utils/server';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const specialization = searchParams.get('specialization') || '';
    const available = searchParams.get('available');

    const query: Record<string, unknown> = { isVerified: true };
    if (specialization) query.specialization = { $in: [specialization] };
    if (available === 'true') query.isAvailable = true;

    const skip = getPaginationSkip(page, limit);
    const [profiles, total] = await Promise.all([
      DoctorProfileModel.find(query)
        .populate('userId', 'name email avatar')
        .sort({ rating: -1, reviewCount: -1 })
        .skip(skip).limit(limit).lean(),
      DoctorProfileModel.countDocuments(query),
    ]);

    return apiPaginated(profiles, total, page, limit);
  } catch { return apiError('Failed', 500); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;
    if (user.role !== 'doctor') return apiError('Only doctors can create profiles', 403);

    await connectDB();
    const body = await req.json();

    const existing = await DoctorProfileModel.findOne({ userId: user.id });
    if (existing) {
      const updated = await DoctorProfileModel.findByIdAndUpdate(existing._id, body, { new: true });
      return apiSuccess(updated);
    }

    const profile = await DoctorProfileModel.create({ ...body, userId: user.id });
    return apiSuccess(profile, 201);
  } catch { return apiError('Failed', 500); }
}
