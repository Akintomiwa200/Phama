import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { SymptomLogModel, UserModel } from '@/lib/models';
import { getDrugRecommendations } from '@/lib/claude';
import { apiSuccess, apiError } from '@/utils/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const RecommendSchema = z.object({
  bodyParts: z.array(z.string()).min(1),
  symptoms: z.array(z.string()).min(1),
  severity: z.number().min(1).max(10).default(5),
  duration: z.string().optional(),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;

    await connectDB();
    const body = await req.json();
    const data = RecommendSchema.parse(body);

    // Get patient profile for personalized recommendations
    const dbUser = await UserModel.findById(user.id).select('healthProfile').lean() as any;
    const profile = dbUser?.healthProfile;

    // Get AI recommendations
    const recommendations = await getDrugRecommendations({
      bodyParts: data.bodyParts,
      symptoms: data.symptoms,
      severity: data.severity,
      patientAge: profile?.dateOfBirth
        ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
        : undefined,
      allergies: profile?.allergies,
      conditions: profile?.conditions,
      currentMedications: profile?.currentMedications,
    });

    // Save symptom log to DB
    const log = await SymptomLogModel.create({
      userId: user.id,
      bodyParts: data.bodyParts,
      symptoms: data.symptoms,
      severity: data.severity,
      duration: data.duration,
      description: data.description,
      aiRecommendations: recommendations,
      loggedAt: new Date(),
    });

    return apiSuccess({ recommendations, logId: log._id });
  } catch (err) {
    if (err instanceof z.ZodError) return apiError(err.errors[0].message, 422);
    console.error('[POST /api/ai/recommend]', err);
    return apiError('Failed to get recommendations', 500);
  }
}
