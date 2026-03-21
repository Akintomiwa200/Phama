import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { SymptomLogModel } from '@/lib/models';
import { apiSuccess, apiError, apiPaginated, getPaginationSkip } from '@/utils/server';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: Record<string, unknown> = { userId: user.id };
    const skip = getPaginationSkip(page, limit);

    const [logs, total] = await Promise.all([
      SymptomLogModel.find(query).sort({ loggedAt: -1 }).skip(skip).limit(limit).lean(),
      SymptomLogModel.countDocuments(query),
    ]);

    return apiPaginated(logs, total, page, limit);
  } catch { return apiError('Failed', 500); }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    await connectDB();
    const { id, isResolved } = await req.json();
    const log = await SymptomLogModel.findByIdAndUpdate(id, { isResolved, resolvedAt: isResolved ? new Date() : undefined }, { new: true });
    return apiSuccess(log);
  } catch { return apiError('Failed', 500); }
}
