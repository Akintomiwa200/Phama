import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { NotificationModel } from '@/lib/models';
import { apiSuccess, apiError } from '@/utils/server';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;
    await connectDB();

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: Record<string, unknown> = { userId: user.id };
    if (unreadOnly) query.isRead = false;

    const notifications = await NotificationModel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await NotificationModel.countDocuments({ userId: user.id, isRead: false });

    return apiSuccess({ notifications, unreadCount });
  } catch { return apiError('Failed', 500); }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;
    await connectDB();

    const { id, markAllRead } = await req.json();

    if (markAllRead) {
      await NotificationModel.updateMany({ userId: user.id, isRead: false }, { isRead: true });
      return apiSuccess({ markedRead: true });
    }

    if (id) {
      await NotificationModel.findByIdAndUpdate(id, { isRead: true });
      return apiSuccess({ markedRead: true });
    }

    return apiError('Provide id or markAllRead', 400);
  } catch { return apiError('Failed', 500); }
}
