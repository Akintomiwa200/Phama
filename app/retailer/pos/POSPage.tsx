'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Printer, CheckCircle, ScanLine, AlertTriangle, X } from 'lucide-react';
import { cn, formatCurrency } from '@/utils';
import { Spinner } from '@/components/shared';
import toast from 'react-hot-toast';

interface CartItem {
  inventoryId: string;
  drugId: string;
  name: string;
  genericName: string;
  strength: string;
  form: string;
  batchNumber: string;
  expiryDate: string;
  price: number;
  quantity: number;
  maxQuantity: number;
  requiresPrescription: boolean;
}

const TAX_RATE = 0.08;

export function POSPage() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile_money'>('cash');
  const [cashGiven, setCashGiven] = useState('');
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const change = paymentMethod === 'cash' ? parseFloat(cashGiven || '0') - total : 0;

  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['pos-inventory', search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];
      const res = await fetch(`/api/inventory?search=${encodeURIComponent(search)}&limit=12`);
      const d = await res.json();
      return d.data || [];
    },
    enabled: search.length >= 2,
  });

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.inventoryId === item._id);
    if (existing) {
      if (existing.quantity >= existing.maxQuantity) {
        toast.error(`Only ${existing.maxQuantity} in stock`);
        return;
      }
      setCart(prev => prev.map(c => c.inventoryId === item._id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart(prev => [...prev, {
        inventoryId: item._id,
        drugId: item.drugId?._id || item.drugId,
        name: item.drugId?.name || 'Unknown',
        genericName: item.drugId?.genericName || '',
        strength: item.drugId?.strength || '',
        form: item.drugId?.form || '',
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        price: item.sellingPrice,
        quantity: 1,
        maxQuantity: item.quantity,
        requiresPrescription: item.drugId?.requiresPrescription || false,
      }]);
    }
    setSearch('');
    searchRef.current?.focus();
    toast.success(`${item.drugId?.name || 'Item'} added`);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.inventoryId !== id) return c;
      const newQty = c.quantity + delta;
      if (newQty <= 0) return null as any;
      if (newQty > c.maxQuantity) { toast.error(`Only ${c.maxQuantity} in stock`); return c; }
      return { ...c, quantity: newQty };
    }).filter(Boolean));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.inventoryId !== id));

  const processPayment = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    if (paymentMethod === 'cash' && parseFloat(cashGiven || '0') < total) {
      toast.error('Insufficient cash given');
      return;
    }

    const prescriptionRequired = cart.some(i => i.requiresPrescription);
    if (prescriptionRequired) {
      const confirmed = window.confirm('Some items require a prescription. Confirm prescription has been verified?');
      if (!confirmed) return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pos',
          sellerId: 'current-tenant-id',
          items: cart.map(i => ({
            drugId: i.drugId,
            inventoryItemId: i.inventoryId,
            quantity: i.quantity,
            unitPrice: i.price,
            discount: 0,
            batchNumber: i.batchNumber,
          })),
          payment: { method: paymentMethod },
          discount: 0,
          deliveryFee: 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReceipt({ ...data.data, cart, cashGiven: parseFloat(cashGiven || '0'), change, paymentMethod });
        setCart([]);
        setCashGiven('');
        toast.success('Sale completed!');
      } else {
        toast.error(data.error || 'Payment failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setProcessing(false);
    }
  };

  const printReceipt = () => window.print();

  return (
    <div className="pos-grid gap-4 -m-6 p-6" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', height: 'calc(100vh - 80px)' }}>
      {/* Left - Product search */}
      <div className="flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center gap-3">
          <h1 className="font-display font-bold text-2xl">Point of Sale</h1>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">● Live</span>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search drug name, barcode, SKU..."
            className="w-full pl-12 pr-4 py-3.5 bg-card border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pharma-500/30"
            autoFocus
          />
          <ScanLine className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        </div>

        {/* Results grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}
          {search.length >= 2 && !isLoading && inventoryData?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">No items found for "{search}"</div>
          )}
          {inventoryData && inventoryData.length > 0 && (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {inventoryData.map((item: any) => {
                const inCart = cart.find(c => c.inventoryId === item._id);
                const isLow = item.quantity <= 5;
                const isExpired = new Date(item.expiryDate) < new Date();
                return (
                  <button
                    key={item._id}
                    onClick={() => !isExpired && addToCart(item)}
                    disabled={isExpired || item.quantity === 0}
                    className={cn(
                      'bg-card border rounded-2xl p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5 relative',
                      inCart ? 'border-pharma-500 bg-pharma-500/5' : '',
                      (isExpired || item.quantity === 0) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    )}
                  >
                    {inCart && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-pharma-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                        {inCart.quantity}
                      </div>
                    )}
                    <div className="font-semibold text-sm mb-0.5 leading-tight">{item.drugId?.name}</div>
                    <div className="text-xs text-muted-foreground mb-2">{item.drugId?.genericName} • {item.drugId?.strength}</div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-pharma-600">{formatCurrency(item.sellingPrice)}</span>
                      <span className={cn('text-xs font-medium', isLow ? 'text-red-500' : 'text-muted-foreground')}>
                        {item.quantity} left
                      </span>
                    </div>
                    {item.drugId?.requiresPrescription && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
                        <AlertTriangle className="w-3 h-3" /> Rx Required
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {!search && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <Search className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Search for a drug to begin sale</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Type at least 2 characters</p>
            </div>
          )}
        </div>
      </div>

      {/* Right - Cart & Payment */}
      <div className="bg-card border rounded-2xl flex flex-col overflow-hidden">
        {/* Cart header */}
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <span className="font-display font-bold">Cart</span>
            {cart.length > 0 && (
              <span className="bg-pharma-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
            )}
          </div>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Cart is empty</p>
            </div>
          ) : cart.map(item => (
            <div key={item.inventoryId} className="flex items-center gap-3 bg-muted/40 rounded-xl p-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.strength} • {formatCurrency(item.price)}</div>
                {item.requiresPrescription && (
                  <div className="text-xs text-orange-500 flex items-center gap-1 mt-0.5">
                    <AlertTriangle className="w-3 h-3" />Rx
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => updateQty(item.inventoryId, -1)} className="w-7 h-7 rounded-lg bg-background border flex items-center justify-center hover:bg-muted transition-colors">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => updateQty(item.inventoryId, 1)} className="w-7 h-7 rounded-lg bg-background border flex items-center justify-center hover:bg-muted transition-colors">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="text-right min-w-[60px]">
                <div className="font-bold text-sm">{formatCurrency(item.price * item.quantity)}</div>
                <button onClick={() => removeFromCart(item.inventoryId)} className="text-red-400 hover:text-red-500 mt-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Totals & payment */}
        <div className="border-t p-4 space-y-4">
          {/* Summary */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
              <span className="text-pharma-600">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {([['cash', 'Cash', Banknote], ['card', 'Card', CreditCard], ['mobile_money', 'Mobile', ShoppingCart]] as const).map(([method, label, Icon]) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={cn('flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all',
                    paymentMethod === method ? 'bg-pharma-500/10 border-pharma-500 text-pharma-600' : 'hover:bg-muted border-border'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Cash given */}
          {paymentMethod === 'cash' && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Cash Given</label>
              <input
                type="number"
                value={cashGiven}
                onChange={e => setCashGiven(e.target.value)}
                placeholder={formatCurrency(total)}
                className="input-field"
              />
              {cashGiven && change >= 0 && (
                <div className="flex justify-between mt-2 text-sm font-semibold text-emerald-600">
                  <span>Change</span>
                  <span>{formatCurrency(change)}</span>
                </div>
              )}
            </div>
          )}

          {/* Process button */}
          <button
            onClick={processPayment}
            disabled={cart.length === 0 || processing}
            className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? <Spinner size="sm" /> : <CheckCircle className="w-5 h-5" />}
            {processing ? 'Processing...' : `Complete Sale • ${formatCurrency(total)}`}
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-pharma-500 to-emerald-500 p-6 text-white text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-2" />
              <h2 className="font-display font-bold text-xl">Sale Complete!</h2>
              <p className="text-white/80 text-sm">#{receipt.orderNumber}</p>
            </div>
            <div className="p-5 space-y-3 font-mono text-sm">
              <div className="space-y-1 border-b pb-3">
                {receipt.cart?.map((item: CartItem, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span className="truncate">{item.name} ×{item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>{formatCurrency(tax)}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>{formatCurrency(total)}</span></div>
              {receipt.paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between text-muted-foreground"><span>Cash</span><span>{formatCurrency(receipt.cashGiven)}</span></div>
                  <div className="flex justify-between font-bold text-emerald-600"><span>Change</span><span>{formatCurrency(receipt.change)}</span></div>
                </>
              )}
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={printReceipt} className="flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-xl text-sm hover:bg-muted transition-colors">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={() => setReceipt(null)} className="flex-1 btn-primary py-2.5 text-sm">New Sale</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
