import { NextRequest } from 'next/server';
import { uploadImage, uploadPrescription, uploadDrugImage } from '@/lib/cloudinary';
import { apiSuccess, apiError } from '@/utils/server';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);
    const user = session.user as any;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string || 'general';
    const name = formData.get('name') as string || '';

    if (!file) return apiError('No file provided', 400);

    // Validate file type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      return apiError('File type not supported', 400);
    }

    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return apiError('File size exceeds 10MB limit', 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    let result;
    switch (type) {
      case 'prescription':
        result = await uploadPrescription(dataUri, user.id);
        break;
      case 'drug':
        result = await uploadDrugImage(dataUri, name);
        break;
      case 'avatar':
        result = await uploadImage(dataUri, `avatars`, {
          public_id: `avatar_${user.id}`,
          transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
        });
        break;
      default:
        result = await uploadImage(dataUri, `general/${user.id}`);
    }

    return apiSuccess(result, 201);
  } catch (err) {
    console.error('[POST /api/upload]', err);
    return apiError('Upload failed', 500);
  }
}
