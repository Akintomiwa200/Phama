import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { UserModel } from '@/lib/models';
import { ConsultationModel, SubscriptionModel, PLAN_FEATURES } from '@/lib/consultationModels';
import { apiSuccess, apiError, apiPaginated, getPaginationSkip } from '@/utils/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const CreateSchema = z.object({
  consultationType:  z.enum(['doctor', 'pharmacist', 'nurse']),
  chiefComplaint:    z.string().min(5),
  symptoms:          z.array(z.string()).default([]),
  bodyParts:         z.array(z.string()).default([]),
  severity:          z.number().min(1).max(10).optional(),
  channel:           z.enum(['video', 'audio', 'chat', 'in_person']).default('chat'),
  scheduledAt:       z.string().optional(),
  doctorId:          z.string().optional(),
  pharmacistId:      z.string().optional(),
  nurseId:           z.string().optional(),
});

// ─────────────────────────────────────────────
// GET — list consultations for current user
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page  = parseInt(searchParams.get('page')  || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';

    const query: Record<string, unknown> = {};
    if      (user.role === 'consumer')    query.patientId    = user.id;
    else if (user.role === 'doctor')      query.doctorId     = user.id;
    else if (user.role === 'pharmacist')  query.pharmacistId = user.id;
    else if (user.role === 'nurse')       query.nurseId      = user.id;
    else if (user.tenantId)              query.tenantId      = user.tenantId;

    if (status) query.status = status;

    const skip = getPaginationSkip(page, limit);
    const [docs, total] = await Promise.all([
      ConsultationModel.find(query)
        .populate('patientId',    'name email phone avatar')
        .populate('doctorId',     'name email avatar')
        .populate('pharmacistId', 'name email avatar')
        .populate('nurseId',      'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit).lean(),
      ConsultationModel.countDocuments(query),
    ]);

    return apiPaginated(docs, total, page, limit);
  } catch (err) {
    console.error('[GET /api/consultations]', err);
    return apiError('Failed to fetch consultations', 500);
  }
}

// ─────────────────────────────────────────────
// POST — book a consultation (subscription-gated)
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;
    await connectDB();

    const body = await req.json();
    const data = CreateSchema.parse(body);

    // ── Subscription gate ──────────────────────────────────────
    const subscription = await SubscriptionModel.findOne({
      userId: user.id,
      status: { $in: ['active', 'trial'] },
    }).lean() as any;

    const plan = (subscription?.plan || 'basic') as keyof typeof PLAN_FEATURES;
    const features = PLAN_FEATURES[plan];

    const featureMap: Record<string, boolean> = {
      doctor:     features.doctorConsultations,
      pharmacist: features.pharmacistConsultations,
      nurse:      features.nurseConsultations,
    };

    if (!featureMap[data.consultationType]) {
      const requiredPlan = data.consultationType === 'doctor' || data.consultationType === 'nurse' ? 'pro' : 'basic';
      return apiError(
        `${data.consultationType.charAt(0).toUpperCase() + data.consultationType.slice(1)} consultations require the ${requiredPlan.toUpperCase()} plan. Please upgrade to book this consultation.`,
        403
      );
    }

    // ── Check monthly limit ────────────────────────────────────
    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

    const usedThisMonth = await ConsultationModel.countDocuments({
      patientId: user.id,
      createdAt: { $gte: startOfMonth },
      status:    { $nin: ['cancelled'] },
    });

    if (usedThisMonth >= features.maxConsultationsPerMonth) {
      return apiError(
        `You have reached your monthly consultation limit (${features.maxConsultationsPerMonth}) for the ${plan.toUpperCase()} plan. Upgrade for more consultations.`,
        403
      );
    }

    // ── Auto-assign provider if none specified ─────────────────
    let assignedDoctor     = data.doctorId;
    let assignedPharmacist = data.pharmacistId;
    let assignedNurse      = data.nurseId;

    if (data.consultationType === 'doctor' && !assignedDoctor) {
      const available = await UserModel.findOne({ role: 'doctor', isActive: true }).lean() as any;
      assignedDoctor = available?._id?.toString();
    }
    if (data.consultationType === 'pharmacist' && !assignedPharmacist) {
      const available = await UserModel.findOne({ role: 'pharmacist', isActive: true }).lean() as any;
      assignedPharmacist = available?._id?.toString();
    }
    if (data.consultationType === 'nurse' && !assignedNurse) {
      const available = await UserModel.findOne({ role: 'nurse' as any, isActive: true }).lean() as any;
      assignedNurse = available?._id?.toString();
    }

    // ── Create consultation ────────────────────────────────────
    const consultation = await ConsultationModel.create({
      patientId:        user.id,
      doctorId:         assignedDoctor,
      pharmacistId:     assignedPharmacist,
      nurseId:          assignedNurse,
      consultationType: data.consultationType,
      chiefComplaint:   data.chiefComplaint,
      symptoms:         data.symptoms,
      bodyParts:        data.bodyParts,
      severity:         data.severity,
      channel:          data.channel,
      scheduledAt:      data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      status:           'pending',
      fee:              data.consultationType === 'doctor' ? 25 : data.consultationType === 'nurse' ? 15 : 10,
      planRequired:     plan,
      roomId:           `room-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tenantId:         user.tenantId,
    });

    return apiSuccess(consultation, 201);
  } catch (err) {
    if (err instanceof z.ZodError) return apiError(err.errors[0].message, 422);
    console.error('[POST /api/consultations]', err);
    return apiError('Failed to book consultation', 500);
  }
}
