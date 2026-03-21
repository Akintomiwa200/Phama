import { NextRequest } from 'next/server';
import { chatWithPharmacist } from '@/lib/claude';
import { UserModel } from '@/lib/models';
import { connectDB } from '@/lib/db';
import { apiSuccess, apiError } from '@/utils/server';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return apiError('messages array required', 400);
    }

    await connectDB();
    const dbUser = await UserModel.findById(user.id).select('healthProfile').lean() as any;
    const profile = dbUser?.healthProfile;

    const reply = await chatWithPharmacist(messages, {
      allergies: profile?.allergies,
      conditions: profile?.conditions,
      medications: profile?.currentMedications,
    });

    return apiSuccess({ reply });
  } catch (err) {
    console.error('[POST /api/ai/chat]', err);
    return apiError('Chat failed', 500);
  }
}
