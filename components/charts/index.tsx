'use client';

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { formatCurrency, formatNumber } from '@/utils';

const COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '12px',
  fontSize: '12px',
  color: 'hsl(var(--foreground))',
};

// ---- Revenue Line Chart ----
export function RevenueChart({ data, height = 300 }: { data: { label: string; value: number; secondary?: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${formatNumber(v)}`, 'Revenue']} />
        <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} fill="url(#revenueGrad)" name="Revenue" />
        {data[0]?.secondary !== undefined && (
          <Area type="monotone" dataKey="secondary" stroke="#10b981" strokeWidth={2} fill="url(#ordersGrad)" name="Orders" />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ---- Bar Chart ----
export function SalesBarChart({ data, height = 260 }: { data: { label: string; value: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="Value" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---- Donut Chart ----
export function DonutChart({ data, height = 240 }: { data: { label: string; value: number }[]; height?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={height} height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatNumber(v), '']} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2 flex-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-xs text-muted-foreground capitalize">{d.label}</span>
            </div>
            <div className="text-xs font-medium">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Top Items List ----
export function TopItemsList({ items, valuePrefix = '$' }: {
  items: { id: string; name: string; value: number; change?: number }[];
  valuePrefix?: string;
}) {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={item.id} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
              <span className="font-medium truncate max-w-[200px]">{item.name}</span>
            </span>
            <span className="text-muted-foreground font-mono text-xs">
              {valuePrefix}{formatNumber(item.value)}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pharma-500 to-pharma-400 transition-all duration-500"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Metric Trend ----
export function MiniSparkline({ data, color = '#0ea5e9' }: { data: number[]; color?: string }) {
  const chartData = data.map((v, i) => ({ v, i }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
