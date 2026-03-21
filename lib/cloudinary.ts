import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  extractedText?: string;
}

export async function uploadImage(
  file: string | Buffer,
  folder: string,
  options: Record<string, unknown> = {}
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(
    typeof file === 'string' ? file : `data:image/jpeg;base64,${file.toString('base64')}`,
    {
      folder: `pharmaconnect/${folder}`,
      resource_type: 'image',
      ...options,
    }
  );

  return {
    publicId: result.public_id,
    url: result.url,
    secureUrl: result.secure_url,
    format: result.format,
    width: result.width,
    height: result.height,
  };
}

export async function uploadDrugImage(
  file: string,
  drugName: string
): Promise<UploadResult> {
  return uploadImage(file, 'drugs', {
    public_id: `drug_${drugName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
    transformation: [
      { width: 800, height: 800, crop: 'fill', quality: 'auto' },
      { format: 'webp' },
    ],
  });
}

export async function uploadPrescription(
  file: string,
  patientId: string
): Promise<UploadResult> {
  return uploadImage(file, `prescriptions/${patientId}`, {
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  });
}

export async function scanDrugWithOCR(
  imageUrl: string
): Promise<{ text: string; confidence: number }> {
  // Use Cloudinary's OCR add-on if available, otherwise extract text from URL
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'pharmaconnect/scans',
      ocr: 'adv_ocr',
    });

    const ocrData = result.info?.ocr?.adv_ocr?.data?.[0];
    const extractedText = ocrData?.fullTextAnnotation?.text || '';
    const confidence = ocrData?.fullTextAnnotation?.pages?.[0]?.confidence || 0;

    return { text: extractedText, confidence };
  } catch {
    return { text: '', confidence: 0 };
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export function getOptimizedUrl(
  publicId: string,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: options.quality || 'auto',
    width: options.width,
    height: options.height,
    crop: options.width && options.height ? 'fill' : undefined,
    secure: true,
  });
}

export function getTenantFolder(tenantId: string): string {
  return `pharmaconnect/tenants/${tenantId}`;
}

export default cloudinary;
