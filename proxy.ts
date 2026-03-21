import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/onboarding',
  '/api/auth',
  '/api/health',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/sw.js',
  '/robots.txt',
  '/sitemap.xml',
  '/images',
  '/models',
];

const ROLE_PREFIX_MAP: Record<string, string[]> = {
  super_admin: ['/admin', '/wholesaler', '/retailer', '/consumer', '/api'],
  tenant_admin: ['/wholesaler', '/retailer', '/api'],
  pharmacist: ['/retailer', '/api/drugs', '/api/prescriptions', '/api/orders'],
  cashier: ['/retailer/pos', '/retailer/dashboard', '/api/orders', '/api/drugs'],
  inventory_manager: ['/retailer/stock', '/wholesaler/inventory', '/api/inventory'],
  driver: ['/api/delivery'],
  consumer: ['/consumer', '/api/orders', '/api/drugs', '/api/symptoms', '/api/ai'],
  doctor: ['/api/prescriptions', '/api/drugs'],
};

// Rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) return false;

  record.count++;
  return true;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isFileRequest = /\.[a-zA-Z0-9]+$/.test(pathname);

  // ✅ Always allow static/public files
  if (isFileRequest) {
    return NextResponse.next();
  }

  // ✅ Public routes
  if (pathname === '/' || PUBLIC_ROUTES.some(route => route !== '/' && pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // ✅ Rate limiting
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const isApiRoute = pathname.startsWith('/api');
  const limit = isApiRoute ? 200 : 100;

  if (!rateLimit(ip, limit, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  const role = token.role as string;
  const userId = token.id as string;
  const tenantId = token.tenantId as string;

  // ✅ RBAC
  const allowedPrefixes = ROLE_PREFIX_MAP[role] || [];
  const isSuperAdmin = role === 'super_admin';

  if (!isSuperAdmin) {
    const allowed = allowedPrefixes.some(prefix =>
      pathname.startsWith(prefix)
    );

    if (!allowed) {
      if (isApiRoute) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const dashboardMap: Record<string, string> = {
        tenant_admin: '/wholesaler/dashboard',
        pharmacist: '/retailer/dashboard',
        cashier: '/retailer/pos',
        inventory_manager: '/retailer/stock',
        driver: '/consumer/home',
        consumer: '/consumer/home',
        doctor: '/consumer/home',
      };

      return NextResponse.redirect(
        new URL(dashboardMap[role] || '/auth/login', request.url)
      );
    }
  }

  // ✅ Add headers
  const response = NextResponse.next();

  response.headers.set('x-user-id', userId || '');
  response.headers.set('x-user-role', role);
  response.headers.set('x-tenant-id', tenantId || '');

  // ✅ Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
