import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { PrescriptionModel } from '@/lib/models';
import { apiSuccess, apiError, apiPaginated, getPaginationSkip } from '@/utils/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const CreatePrescriptionSchema = z.object({
  doctorName: z.string().min(1),
  doctorLicense: z.string().optional(),
  hospitalName: z.string().optional(),
  drugs: z.array(z.object({
    drugName: z.string().min(1),
    genericName: z.string().optional(),
    strength: z.string().optional(),
    form: z.string().optional(),
    dosage: z.string().min(1),
    frequency: z.string().min(1),
    duration: z.string().min(1),
    quantity: z.number().min(1),
    instructions: z.string().optional(),
  })).min(1),
  imageUrl: z.string().optional(),
  imagePublicId: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  refillsAllowed: z.number().default(0),
  issuedAt: z.string().optional(),
  expiresAt: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: Record<string, unknown> = {};

    if (user.role === 'consumer') {
      query.patientId = user.id;
    } else if (['pharmacist', 'cashier', 'tenant_admin'].includes(user.role)) {
      query.tenantId = user.tenantId;
    }

    const skip = getPaginationSkip(page, limit);
    const [prescriptions, total] = await Promise.all([
      PrescriptionModel.find(query)
        .populate('patientId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PrescriptionModel.countDocuments(query),
    ]);

    return apiPaginated(prescriptions, total, page, limit);
  } catch {
    return apiError('Failed to fetch prescriptions', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;

    await connectDB();
    const body = await req.json();
    const data = CreatePrescriptionSchema.parse(body);

    const prescription = await PrescriptionModel.create({
      ...data,
      patientId: user.id,
      expiresAt: new Date(data.expiresAt),
      issuedAt: data.issuedAt ? new Date(data.issuedAt) : new Date(),
    });

    return apiSuccess(prescription, 201);
  } catch (err) {
    if (err instanceof z.ZodError) return apiError(err.errors[0].message, 422);
    return apiError('Failed to create prescription', 500);
  }
}
