import { NextRequest } from 'next/server';
import { generateDemandForecast } from '@/lib/claude';
import { apiSuccess, apiError } from '@/utils/server';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;
    if (!['super_admin', 'tenant_admin'].includes(user.role)) return apiError('Forbidden', 403);

    const body = await req.json();
    const { symptomTrends, currentInventory, region } = body;

    const forecast = await generateDemandForecast({ symptomTrends, currentInventory, region });
    return apiSuccess(forecast);
  } catch (err) {
    console.error('[POST /api/ai/forecast]', err);
    return apiError('Forecast failed', 500);
  }
}
