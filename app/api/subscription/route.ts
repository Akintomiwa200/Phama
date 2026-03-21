import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { SubscriptionModel, PLAN_PRICES, PLAN_FEATURES } from '@/lib/consultationModels';
import { apiSuccess, apiError } from '@/utils/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const UpgradeSchema = z.object({
  plan: z.enum(['basic', 'pro', 'enterprise']),
  paymentMethodId: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;
    await connectDB();

    const subscription = await SubscriptionModel.findOne({
      userId: user.id,
      status: { $in: ['active', 'trial'] },
    }).lean();

    // Return current plan with features
    const plan = (subscription as any)?.plan || 'basic';
    return apiSuccess({
      subscription,
      plan,
      features: PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES],
      pricing: PLAN_PRICES,
      allFeatures: PLAN_FEATURES,
    });
  } catch { return apiError('Failed', 500); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;
    await connectDB();

    const body = await req.json();
    const { plan } = UpgradeSchema.parse(body);

    // Cancel existing subscription
    await SubscriptionModel.updateMany(
      { userId: user.id, status: { $in: ['active', 'trial'] } },
      { status: 'cancelled', cancelAtPeriodEnd: true }
    );

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const features = PLAN_FEATURES[plan];
    const subscription = await SubscriptionModel.create({
      userId: user.id,
      tenantId: user.tenantId,
      plan,
      status: PLAN_PRICES[plan] === 0 ? 'active' : 'active',
      features,
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
    });

    return apiSuccess({
      subscription,
      plan,
      features,
      message: `Successfully upgraded to ${plan.toUpperCase()} plan`,
    }, 201);
  } catch (err) {
    if (err instanceof z.ZodError) return apiError(err.errors[0].message, 422);
    return apiError('Failed to upgrade plan', 500);
  }
}
