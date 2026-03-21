import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { ConsultationModel } from '@/lib/consultationModels';
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

    const doc = await ConsultationModel.findById(id)
      .populate('patientId', 'name email phone avatar healthProfile')
      .populate('doctorId', 'name email avatar')
      .populate('pharmacistId', 'name email avatar')
      .populate('nurseId', 'name email avatar')
      .populate('prescriptionId')
      .lean();

    if (!doc) return apiError('Consultation not found', 404);
    return apiSuccess(doc);
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
    const { status, doctorNotes, diagnosis, treatment, vitals, followUpDate, followUpNotes, message, rating, feedback } = body;

    const consultation = await ConsultationModel.findById(id);
    if (!consultation) return apiError('Not found', 404);

    const updates: Record<string, unknown> = {};

    if (status) {
      updates.status = status;
      if (status === 'in_progress' && !consultation.startedAt) updates.startedAt = new Date();
      if (status === 'completed') {
        updates.completedAt = new Date();
        if (consultation.startedAt) {
          updates.durationMins = Math.round((Date.now() - consultation.startedAt.getTime()) / 60000);
        }
      }
    }

    if (doctorNotes !== undefined) updates.doctorNotes = doctorNotes;
    if (diagnosis !== undefined) updates.diagnosis = diagnosis;
    if (treatment !== undefined) updates.treatment = treatment;
    if (vitals) updates.vitals = vitals;
    if (followUpDate) updates.followUpDate = new Date(followUpDate);
    if (followUpNotes) updates.followUpNotes = followUpNotes;
    if (rating) updates.rating = rating;
    if (feedback) updates.feedback = feedback;

    // Append a chat message
    if (message) {
      const msg = {
        senderId: user.id,
        senderRole: user.role,
        content: message.content,
        type: message.type || 'text',
        fileUrl: message.fileUrl,
        sentAt: new Date(),
        isRead: false,
      };
      await ConsultationModel.findByIdAndUpdate(id, { $push: { messages: msg } });
      const updated = await ConsultationModel.findById(id).lean();
      return apiSuccess(updated);
    }

    const updated = await ConsultationModel.findByIdAndUpdate(id, updates, { new: true })
      .populate('patientId', 'name email phone avatar')
      .populate('doctorId', 'name email avatar')
      .lean();

    return apiSuccess(updated);
  } catch { return apiError('Failed', 500); }
}

// Issue prescription during consultation
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;

    if (!['doctor', 'pharmacist'].includes(user.role)) return apiError('Only doctors/pharmacists can prescribe', 403);

    await connectDB();
    const consultation = await ConsultationModel.findById(id);
    if (!consultation) return apiError('Not found', 404);

    const body = await req.json();
    const { drugs, diagnosis, notes } = body;

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6);

    const prescription = await PrescriptionModel.create({
      patientId: consultation.patientId,
      doctorName: user.name,
      doctorLicense: body.licenseNumber || 'PENDING',
      drugs: drugs || [],
      diagnosis,
      notes,
      isVerified: user.role === 'pharmacist',
      refillsAllowed: body.refillsAllowed || 0,
      issuedAt: new Date(),
      expiresAt,
    });

    await ConsultationModel.findByIdAndUpdate(id, {
      prescriptionId: prescription._id,
      status: 'completed',
      completedAt: new Date(),
      doctorNotes: notes,
      diagnosis,
    });

    return apiSuccess(prescription, 201);
  } catch { return apiError('Failed to issue prescription', 500); }
}
