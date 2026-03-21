import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { DrugModel } from '@/lib/models';
import { apiSuccess, apiError, apiPaginated, getPaginationSkip } from '@/utils/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const DrugSchema = z.object({
  name: z.string().min(1),
  genericName: z.string().optional(),
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  category: z.array(z.string()).default([]),
  description: z.string().optional(),
  symptoms: z.array(z.string()).default([]),
  indications: z.array(z.string()).default([]),
  contraindications: z.array(z.string()).default([]),
  sideEffects: z.array(z.string()).default([]),
  interactions: z.array(z.object({
    drugName: z.string(),
    severity: z.enum(['mild', 'moderate', 'severe', 'contraindicated']),
    description: z.string(),
  })).default([]),
  dosage: z.array(z.object({
    ageGroup: z.string(),
    dose: z.string(),
    frequency: z.string(),
    route: z.string(),
    notes: z.string().optional(),
  })).default([]),
  requiresPrescription: z.boolean().default(false),
  isControlled: z.boolean().default(false),
  controlledSchedule: z.string().optional(),
  sku: z.string().optional(),
  activeIngredients: z.array(z.string()).default([]),
  strength: z.string().optional(),
  form: z.enum(['tablet','capsule','liquid','injection','topical','inhaler','patch','drops']).optional(),
  storageInstructions: z.string().optional(),
  barcode: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const requiresPrescription = searchParams.get('requiresPrescription');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const query: Record<string, unknown> = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { symptoms: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) query.category = { $in: [category] };
    if (requiresPrescription !== null && requiresPrescription !== undefined) {
      query.requiresPrescription = requiresPrescription === 'true';
    }

    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = getPaginationSkip(page, limit);

    const [drugs, total] = await Promise.all([
      DrugModel.find(query).sort(sort).skip(skip).limit(limit).lean(),
      DrugModel.countDocuments(query),
    ]);

    return apiPaginated(drugs, total, page, limit);
  } catch (err) {
    console.error('[GET /api/drugs]', err);
    return apiError('Failed to fetch drugs', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const role = (session.user as any).role;
    if (!['super_admin', 'tenant_admin', 'inventory_manager'].includes(role)) {
      return apiError('Forbidden', 403);
    }

    await connectDB();
    const body = await req.json();
    const data = DrugSchema.parse(body);

    if (!data.sku) {
      data.sku = 'SKU-' + Date.now().toString(36).toUpperCase();
    }

    const drug = await DrugModel.create(data);
    return apiSuccess(drug, 201);
  } catch (err) {
    if (err instanceof z.ZodError) return apiError(err.errors[0].message, 422);
    console.error('[POST /api/drugs]', err);
    return apiError('Failed to create drug', 500);
  }
}
