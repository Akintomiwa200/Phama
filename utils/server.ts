import 'server-only';
import type { ApiResponse } from '@/types';
import { NextResponse } from 'next/server';

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data } as ApiResponse<T>, { status });
}

export function apiError(message: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error: message } as ApiResponse, { status });
}

export function apiPaginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  } as ApiResponse<T[]>);
}

export async function createAuditLog(params: {
  userId: string;
  tenantId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  const { AuditLogModel } = await import('@/lib/models');
  const { connectDB } = await import('@/lib/db');
  await connectDB();
  await AuditLogModel.create(params);
}

export { getPaginationSkip, generateOrderNumber, generateTrackingCode } from '@/utils';
