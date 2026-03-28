'use client'

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, StatCard, DataTable, Modal } from '@/components/shared';
import { RevenueChart, SalesBarChart } from '@/components/charts';
import { DollarSign, TrendingUp, TrendingDown, FileText, Download, Plus, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/utils';
import toast from 'react-hot-toast';

export function AccountingPage() {
  const [tab, setTab] = useState<'overview' | 'transactions' | 'invoices'>('overview');
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [period, setPeriod] = useState(30);

  const { data: analytics } = useQuery({
    queryKey: ['accounting-analytics', period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?period=${period}`);
      const d = await res.json();
      return d.data;
    },
  });

  const { data: orders } = useQuery({
    queryKey: ['accounting-orders', period],
    queryFn: async () => {
      const res = await fetch(`/api/orders?limit=100&status=delivered`);
      const d = await res.json();
      return d.data || [];
    },
  });

  // Compute P&L from delivered orders
  const revenue = orders?.reduce((s: number, o: any) => s + o.total, 0) || 0;
  const taxCollected = orders?.reduce((s: number, o: any) => s + o.tax, 0) || 0;
  const discountsGiven = orders?.reduce((s: number, o: any) => s + o.discount, 0) || 0;
  const grossProfit = revenue * 0.32; // mock 32% margin
  const expenses = revenue * 0.15; // mock 15% overheads
  const netProfit = grossProfit - expenses;

  // Generate transaction ledger from orders
  const transactions = orders?.flatMap((o: any) => ([
    {
      _id: `${o._id}-sale`,
      date: o.updatedAt || o.createdAt,
      type: 'sale',
      description: `Sale — Order #${o.orderNumber}`,
      reference: o.orderNumber,
      debit: 0,
      credit: o.total,
      balance: 0,
    },
    o.tax > 0 && {
      _id: `${o._id}-tax`,
      date: o.updatedAt || o.createdAt,
      type: 'tax',
      description: `Tax — Order #${o.orderNumber}`,
      reference: o.orderNumber,
      debit: o.tax,
      credit: 0,
      balance: 0,
    },
  ])).filter(Boolean) || [];

  const exportLedger = () => {
    const rows = [
      ['Date', 'Type', 'Description', 'Reference', 'Debit', 'Credit'],
      ...transactions.map((t: any) => [
        formatDate(t.date), t.type, t.description, t.reference,
        t.debit.toFixed(2), t.credit.toFixed(2),
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ledger_${Date.now()}.csv`; a.click();
  };

  const TABS = [
    { key: 'overview', label: 'P&L Overview' },
    { key: 'transactions', label: 'Ledger' },
    { key: 'invoices', label: 'Invoices' },
  ] as const;

  return (
    <div>
      <PageHeader
        title="Accounting & Finance"
        subtitle="Financial overview, transaction ledger, and invoice management"
        actions={
          <div className="flex gap-2">
            <select value={period} onChange={e => setPeriod(Number(e.target.value))} className="input-field py-2 w-36">
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last 1 year</option>
            </select>
            <button onClick={exportLedger} className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm hover:bg-muted transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Revenue" value={revenue} prefix="$" change={analytics?.revenueGrowth} icon={<TrendingUp className="w-4 h-4" />} color="blue" />
        <StatCard label="Gross Profit" value={grossProfit} prefix="$" icon={<DollarSign className="w-4 h-4" />} color="green" />
        <StatCard label="Net Profit" value={netProfit} prefix="$" icon={<TrendingUp className="w-4 h-4" />} color="purple" />
        <StatCard label="Tax Collected" value={taxCollected} prefix="$" icon={<FileText className="w-4 h-4" />} color="orange" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6 w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all',
              tab === t.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border rounded-2xl p-6">
              <h2 className="font-display font-bold text-lg mb-1">Revenue Trend</h2>
              <p className="text-sm text-muted-foreground mb-6">Daily revenue over selected period</p>
              <RevenueChart data={analytics?.revenueByDay || []} height={220} />
            </div>

            {/* P&L summary */}
            <div className="bg-card border rounded-2xl p-6">
              <h2 className="font-display font-bold text-lg mb-6">Profit & Loss Summary</h2>
              <div className="space-y-4">
                {[
                  { label: 'Gross Revenue', value: revenue, type: 'income', pct: 100 },
                  { label: 'Discounts Given', value: -discountsGiven, type: 'expense', pct: (discountsGiven / revenue) * 100 },
                  { label: 'Tax Liability', value: -taxCollected, type: 'expense', pct: (taxCollected / revenue) * 100 },
                  { label: 'Gross Profit', value: grossProfit, type: 'income', pct: (grossProfit / revenue) * 100, bold: true },
                  { label: 'Operating Expenses', value: -expenses, type: 'expense', pct: (expenses / revenue) * 100 },
                  { label: 'Net Profit', value: netProfit, type: netProfit >= 0 ? 'income' : 'expense', pct: (netProfit / revenue) * 100, bold: true },
                ].map((row, i) => (
                  <div key={i} className={cn('flex items-center justify-between py-2', row.bold ? 'border-t font-bold' : '')}>
                    <div className="flex items-center gap-3">
                      {row.type === 'income'
                        ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                        : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                      <span className={cn('text-sm', row.bold ? 'font-bold text-base' : '')}>{row.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {isFinite(row.pct) ? `${Math.abs(row.pct).toFixed(1)}%` : '—'}
                      </span>
                      <span className={cn('font-mono text-sm font-semibold w-28 text-right', row.value >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                        {row.value < 0 ? '-' : ''}{formatCurrency(Math.abs(row.value))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Orders breakdown */}
          <div className="bg-card border rounded-2xl p-6">
            <h2 className="font-display font-bold text-lg mb-2">Orders by Status</h2>
            <p className="text-sm text-muted-foreground mb-6">Revenue distribution across order statuses</p>
            <SalesBarChart data={analytics?.ordersByStatus?.map((s: any) => ({ label: s.label, value: s.value })) || []} height={200} />
          </div>
        </div>
      )}

      {/* Ledger tab */}
      {tab === 'transactions' && (
        <DataTable
          data={transactions}
          keyField="_id"
          columns={[
            { key: 'date', label: 'Date', render: r => <span className="text-sm text-muted-foreground">{formatDate(r.date)}</span> },
            { key: 'type', label: 'Type', render: r => (
              <span className={cn('badge-status capitalize', r.type === 'sale' ? 'bg-green-100 text-green-700' : r.type === 'tax' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700')}>
                {r.type}
              </span>
            )},
            { key: 'description', label: 'Description', render: r => <span className="text-sm">{r.description}</span> },
            { key: 'reference', label: 'Reference', render: r => <span className="font-mono text-xs text-muted-foreground">#{r.reference}</span> },
            { key: 'debit', label: 'Debit', render: r => r.debit > 0 ? <span className="text-red-500 font-medium text-sm">-{formatCurrency(r.debit)}</span> : <span className="text-muted-foreground">—</span> },
            { key: 'credit', label: 'Credit', render: r => r.credit > 0 ? <span className="text-emerald-600 font-medium text-sm">+{formatCurrency(r.credit)}</span> : <span className="text-muted-foreground">—</span> },
          ]}
        />
      )}

      {/* Invoices tab */}
      {tab === 'invoices' && (
        <div>
          <div className="flex justify-between mb-4">
            <p className="text-sm text-muted-foreground">{orders?.length || 0} invoices generated from delivered orders</p>
          </div>
          <DataTable
            data={orders || []}
            onRowClick={setSelectedInvoice}
            columns={[
              { key: 'orderNumber', label: 'Invoice #', render: r => <span className="font-mono font-medium">INV-{r.orderNumber}</span> },
              { key: 'buyer', label: 'Bill To', render: r => <span className="text-sm">{r.buyerId?.name || 'Customer'}</span> },
              { key: 'createdAt', label: 'Date', render: r => <span className="text-sm text-muted-foreground">{formatDate(r.createdAt)}</span> },
              { key: 'total', label: 'Amount', render: r => <span className="font-bold">{formatCurrency(r.total)}</span> },
              { key: 'payment', label: 'Status', render: r => (
                <span className={cn('badge-status', r.payment?.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                  {r.payment?.status || 'pending'}
                </span>
              )},
            ]}
          />
        </div>
      )}

      {/* Invoice detail modal */}
      <Modal open={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title={`Invoice INV-${selectedInvoice?.orderNumber}`} size="lg">
        {selectedInvoice && (
          <div className="space-y-5 font-mono">
            <div className="flex justify-between text-sm">
              <div>
                <p className="font-bold text-lg font-sans">PharmaConnect</p>
                <p className="text-muted-foreground font-sans">wholesale@pharmaconnect.com</p>
              </div>
              <div className="text-right">
                <p className="font-bold">INV-{selectedInvoice.orderNumber}</p>
                <p className="text-muted-foreground text-xs">{formatDate(selectedInvoice.createdAt)}</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-sm">
              <p className="text-xs text-muted-foreground mb-1">BILL TO</p>
              <p className="font-semibold">{selectedInvoice.buyerId?.name}</p>
              <p className="text-muted-foreground">{selectedInvoice.buyerId?.email}</p>
            </div>
            <div className="space-y-2">
              {selectedInvoice.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.drugId?.name || 'Drug'} ×{item.quantity}</span>
                  <span>{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(selectedInvoice.subtotal)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>{formatCurrency(selectedInvoice.tax)}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total Due</span><span>{formatCurrency(selectedInvoice.total)}</span></div>
            </div>
            <button onClick={() => window.print()} className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 font-sans">
              <Download className="w-4 h-4" /> Print / Download Invoice
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
