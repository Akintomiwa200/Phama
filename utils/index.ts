import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

// ---- Tailwind Merge ----
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---- Date Helpers ----
export function formatDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  return format(new Date(date), 'dd MMM yyyy');
}

export function formatDateTime(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  return format(new Date(date), 'dd MMM yyyy HH:mm');
}

export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isExpiringSoon(date: Date | string, days = 90): boolean {
  const d = new Date(date);
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + days);
  return d <= threshold && d > new Date();
}

export function isExpired(date: Date | string): boolean {
  return new Date(date) < new Date();
}

// ---- Currency ----
export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// ---- Number ----
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(decimals)}%`;
}

// ---- String ----
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function truncate(str: string, length = 50): string {
  return str.length > length ? str.slice(0, length) + '...' : str;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ---- Validation ----
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^\+?[\d\s\-()]{10,}$/.test(phone);
}

// ---- Pagination ----
export function getPaginationSkip(page: number, limit: number): number {
  return (Math.max(1, page) - 1) * limit;
}

// ---- Order Number ----
export function generateOrderNumber(): string {
  return 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

export function generateTrackingCode(): string {
  return 'TRK-' + Math.random().toString(36).slice(2, 10).toUpperCase();
}

// ---- Status Colors ----
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'yellow',
    confirmed: 'blue',
    processing: 'indigo',
    packed: 'purple',
    dispatched: 'cyan',
    out_for_delivery: 'orange',
    delivered: 'green',
    cancelled: 'red',
    refunded: 'gray',
    returned: 'gray',
    paid: 'green',
    failed: 'red',
    active: 'green',
    inactive: 'gray',
    low: 'green',
    medium: 'yellow',
    high: 'red',
    mild: 'green',
    moderate: 'yellow',
    severe: 'orange',
    contraindicated: 'red',
  };
  return map[status] || 'gray';
}

// ---- Encryption ----
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return local.slice(0, 2) + '***@' + domain;
}

export function maskPhone(phone: string): string {
  return phone.slice(0, 3) + '****' + phone.slice(-3);
}
