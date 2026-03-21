import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { PrescriptionModel } from '@/lib/models';
import { apiSuccess, apiError } from '@/utils/server';
import { auth } from '@/lib/auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    await connectDB();
    const rx = await PrescriptionModel.findById(id)
      .populate('patientId', 'name email phone')
      .lean();
    if (!rx) return apiError('Not found', 404);
    return apiSuccess(rx);
  } catch { return apiError('Failed', 500); }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;
    await connectDB();

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.isVerified !== undefined) {
      updates.isVerified = body.isVerified;
      if (body.isVerified) {
        updates.verifiedBy = user.id;
        updates.verifiedAt = new Date();
      }
    }

    if (body.isActive !== undefined) updates.isActive = body.isActive;
    if (body.notes) updates.notes = body.notes;

    const rx = await PrescriptionModel.findByIdAndUpdate(id, updates, { new: true });
    if (!rx) return apiError('Not found', 404);
    return apiSuccess(rx);
  } catch { return apiError('Failed', 500); }
}

// Dispense a specific drug from the prescription
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;
    if (!['pharmacist', 'tenant_admin', 'cashier'].includes(user.role)) return apiError('Forbidden', 403);

    await connectDB();
    const { drugIndex } = await req.json();

    const rx = await PrescriptionModel.findById(id);
    if (!rx) return apiError('Not found', 404);
    if (!rx.isVerified) return apiError('Prescription must be verified before dispensing', 400);

    const drug = (rx.drugs as any[])[drugIndex];
    if (!drug) return apiError('Drug not found in prescription', 404);
    if (drug.isDispensed) return apiError('Already dispensed', 400);

    drug.isDispensed = true;
    drug.dispensedAt = new Date();
    drug.dispensedBy = user.id;

    // Increment refill count if all drugs dispensed
    const allDispensed = (rx.drugs as any[]).every((d: any) => d.isDispensed);
    if (allDispensed) rx.refillsUsed = (rx.refillsUsed || 0) + 1;

    await rx.save();
    return apiSuccess(rx);
  } catch { return apiError('Failed to dispense', 500); }
}
