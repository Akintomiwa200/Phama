import { NextRequest } from 'next/server';
import { scanDrugFromText, scanDrugFromImage } from '@/lib/claude';
import { scanDrugWithOCR, uploadImage } from '@/lib/cloudinary';
import { apiSuccess, apiError } from '@/utils/server';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError('Unauthorized', 401);

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('image') as File | null;
      const mode = formData.get('mode') as string || 'auto';

      if (!file) return apiError('No image provided', 400);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      const dataUri = `data:${file.type};base64,${base64}`;

      let result = null;

      if (mode === 'vision' || mode === 'auto') {
        // Direct vision scan
        result = await scanDrugFromImage(base64);
      }

      if (!result && (mode === 'ocr' || mode === 'auto')) {
        // Upload to Cloudinary and use OCR
        const uploaded = await uploadImage(dataUri, 'scans');
        const ocr = await scanDrugWithOCR(uploaded.secureUrl);
        if (ocr.text) {
          result = await scanDrugFromText(ocr.text);
          if (result) {
            (result as any).ocrConfidence = ocr.confidence;
            (result as any).imageUrl = uploaded.secureUrl;
          }
        }
      }

      if (!result) return apiError('Could not extract drug information from image', 422);
      return apiSuccess(result);

    } else {
      // JSON body with text or URL
      const body = await req.json();

      if (body.text) {
        const result = await scanDrugFromText(body.text);
        if (!result) return apiError('Could not parse drug information', 422);
        return apiSuccess(result);
      }

      if (body.imageBase64) {
        const result = await scanDrugFromImage(body.imageBase64);
        if (!result) return apiError('Could not analyze image', 422);
        return apiSuccess(result);
      }

      return apiError('Provide image file, text, or base64 image', 400);
    }
  } catch (err) {
    console.error('[POST /api/ai/scanner]', err);
    return apiError('Scanner failed', 500);
  }
}
