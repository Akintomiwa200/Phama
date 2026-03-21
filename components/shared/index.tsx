'use client';

import { cn, formatCurrency, formatNumber, formatPercent } from '@/utils';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

// ---- Stat Card ----
interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  prefix?: string;
  suffix?: string;
  loading?: boolean;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  className?: string;
}

const colorMap = {
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export function StatCard({ label, value, change, icon, prefix, suffix, loading, color = 'blue', className }: StatCardProps) {
  if (loading) return <div className={cn('stat-card', className)}><div className="skeleton h-20 w-full rounded-xl" /></div>;

  return (
    <div className={cn('stat-card group', className)}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        {icon && (
          <div className={cn('p-2.5 rounded-xl', colorMap[color])}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-display font-bold">
            {prefix}{typeof value === 'number' ? formatNumber(value) : value}{suffix}
          </p>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1 mt-1 text-xs font-medium', change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-500' : 'text-muted-foreground')}>
              {change > 0 ? <TrendingUp className="w-3 h-3" /> : change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              <span>{formatPercent(change)} vs last period</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Status Badge ----
const statusConfig: Record<string, { label: string; class: string; icon: React.ComponentType<{className?:string}> }> = {
  pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  confirmed: { label: 'Confirmed', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle },
  processing: { label: 'Processing', class: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: Clock },
  packed: { label: 'Packed', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: CheckCircle },
  dispatched: { label: 'Dispatched', class: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', icon: CheckCircle },
  out_for_delivery: { label: 'Out for Delivery', class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: Clock },
  delivered: { label: 'Delivered', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  refunded: { label: 'Refunded', class: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: Minus },
  paid: { label: 'Paid', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  failed: { label: 'Failed', class: 'bg-red-100 text-red-700', icon: XCircle },
  active: { label: 'Active', class: 'bg-green-100 text-green-700', icon: CheckCircle },
  inactive: { label: 'Inactive', class: 'bg-gray-100 text-gray-600', icon: Minus },
  low: { label: 'Low', class: 'bg-green-100 text-green-700', icon: CheckCircle },
  medium: { label: 'Medium', class: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  high: { label: 'High', class: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

export function StatusBadge({ status, showIcon = false }: { status: string; showIcon?: boolean }) {
  const config = statusConfig[status] || { label: status, class: 'bg-gray-100 text-gray-600', icon: Minus };
  const Icon = config.icon;
  return (
    <span className={cn('badge-status', config.class)}>
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  );
}

// ---- Empty State ----
export function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
}

// ---- Loading Spinner ----
export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div className={cn('animate-spin rounded-full border-2 border-current border-t-transparent text-pharma-500', sizeMap[size], className)} />
  );
}

// ---- Page Header ----
export function PageHeader({ title, subtitle, actions, breadcrumb }: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
}) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        {breadcrumb && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span>/</span>}
                {b.href ? <a href={b.href} className="hover:text-foreground">{b.label}</a> : <span>{b.label}</span>}
              </span>
            ))}
          </div>
        )}
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

// ---- Alert Banner ----
export function AlertBanner({ type, message, onDismiss }: {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  onDismiss?: () => void;
}) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
  };

  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-xl border text-sm', styles[type])}>
      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="flex-shrink-0 opacity-60 hover:opacity-100">
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ---- Data Table ----
interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  keyField?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns, data, loading, onRowClick, keyField = '_id',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="border rounded-2xl overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              {columns.map((col) => (
                <th key={col.key} className={cn('px-4 py-3 text-left font-medium text-muted-foreground', col.className)}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                  No records found
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row[keyField] || JSON.stringify(row)}
                  className={cn('table-row', onRowClick && 'cursor-pointer hover:bg-muted/50')}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Pagination ----
export function Pagination({ page, totalPages, onPageChange }: {
  page: number; totalPages: number; onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 hover:bg-muted transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 hover:bg-muted transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ---- Modal ----
export function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  if (!open) return null;
  const sizeMap = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-card border rounded-2xl shadow-2xl w-full', sizeMap[size])}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-display font-bold text-xl">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[75vh]">{children}</div>
      </div>
    </div>
  );
}
