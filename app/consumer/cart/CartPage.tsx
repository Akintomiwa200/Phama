'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, EmptyState, AlertBanner } from '@/components/shared';
import { ShoppingCart, Plus, Minus, Trash2, MapPin, CreditCard, Truck, Package, CheckCircle, Sparkles } from 'lucide-react';
import { formatCurrency, cn } from '@/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// Zustand cart store
interface CartItem {
  id: string;
  drugId: string;
  name: string;
  genericName: string;
  price: number;
  quantity: number;
  image?: string;
  requiresPrescription: boolean;
  pharmacyId: string;
  pharmacyName: string;
  inventoryId: string;
  batchNumber: string;
  maxQty: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find(i => i.id === item.id);
        if (existing) {
          set(s => ({ items: s.items.map(i => i.id === item.id ? { ...i, quantity: Math.min(i.quantity + 1, i.maxQty) } : i) }));
        } else {
          set(s => ({ items: [...s.items, item] }));
        }
      },
      removeItem: (id) => set(s => ({ items: s.items.filter(i => i.id !== id) })),
      updateQty: (id, qty) => {
        if (qty <= 0) { set(s => ({ items: s.items.filter(i => i.id !== id) })); return; }
        set(s => ({ items: s.items.map(i => i.id === id ? { ...i, quantity: qty } : i) }));
      },
      clear: () => set({ items: [] }),
    }),
    { name: 'pharma-cart' }
  )
);

const TAX_RATE = 0.08;
const DELIVERY_FEE = 4.99;

export function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQty, clear } = useCartStore();
  const [step, setStep] = useState<'cart' | 'delivery' | 'payment' | 'success'>('cart');
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express' | 'same_day' | 'pickup'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'mobile_money'>('card');
  const [address, setAddress] = useState({ street: '', city: '', state: '', country: '', zipCode: '' });

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const fee = deliveryMethod === 'pickup' ? 0 : DELIVERY_FEE;
  const total = subtotal + tax + fee;

  const hasPrescriptionItems = items.some(i => i.requiresPrescription);

  const placeOrder = async () => {
    if (!items.length) return;
    setPlacing(true);
    try {
      const pharmacyId = items[0]?.pharmacyId || 'default-pharmacy';
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'consumer_to_retailer',
          sellerId: pharmacyId,
          items: items.map(i => ({
            drugId: i.drugId,
            inventoryItemId: i.inventoryId,
            quantity: i.quantity,
            unitPrice: i.price,
            discount: 0,
            batchNumber: i.batchNumber,
          })),
          payment: { method: paymentMethod },
          delivery: { address, method: deliveryMethod },
          deliveryFee: fee,
          discount: 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderId(data.data.orderNumber);
        clear();
        setStep('success');
      } else toast.error(data.error || 'Order failed');
    } catch { toast.error('Network error'); }
    finally { setPlacing(false); }
  };

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="font-display text-3xl font-bold mb-2">Order Placed!</h2>
        <p className="text-muted-foreground mb-2">Order #{orderId}</p>
        <p className="text-muted-foreground text-sm mb-8">Your pharmacy has been notified and will prepare your order shortly.</p>
        <div className="flex flex-col gap-3">
          <Link href="/consumer/orders" className="btn-primary py-3">Track My Order</Link>
          <Link href="/consumer/home" className="py-3 border rounded-xl text-sm hover:bg-muted transition-colors">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Shopping Cart" subtitle={`${items.length} item${items.length !== 1 ? 's' : ''} in your cart`} />

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8">
        {(['cart', 'delivery', 'payment'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
              step === s ? 'bg-pharma-500 text-white' : ['cart','delivery','payment'].indexOf(step) > i ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
            )}>
              {['cart','delivery','payment'].indexOf(step) > i ? '✓' : i + 1}
            </div>
            <span className={cn('text-sm font-medium capitalize hidden sm:block', step === s ? 'text-foreground' : 'text-muted-foreground')}>{s}</span>
            {i < 2 && <div className="flex-1 h-px bg-border" />}
          </div>
        ))}
      </div>

      {items.length === 0 && step === 'cart' ? (
        <EmptyState
          icon={<ShoppingCart className="w-8 h-8" />}
          title="Your cart is empty"
          description="Browse pharmacies and add medications to your cart"
          action={<Link href="/consumer/pharmacy" className="btn-primary">Find Medications</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            {step === 'cart' && (
              <>
                {hasPrescriptionItems && (
                  <AlertBanner type="warning" message="Some items require a valid prescription. Please have it ready when your order is processed." />
                )}
                {items.map(item => (
                  <div key={item.id} className="bg-card border rounded-2xl p-4 flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      <Package className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-sm">{item.name}</h3>
                          <p className="text-xs text-muted-foreground">{item.genericName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">📍 {item.pharmacyName}</p>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-500 flex-shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-7 h-7 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, Math.min(item.quantity + 1, item.maxQty))} className="w-7 h-7 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(item.price * item.quantity)}</div>
                          <div className="text-xs text-muted-foreground">{formatCurrency(item.price)} each</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {step === 'delivery' && (
              <div className="space-y-4">
                <div className="bg-card border rounded-2xl p-5">
                  <h3 className="font-semibold mb-4">Delivery Method</h3>
                  <div className="space-y-3">
                    {[
                      { value: 'standard', label: 'Standard Delivery', desc: '3-5 business days', price: '$4.99', icon: Truck },
                      { value: 'express', label: 'Express Delivery', desc: 'Next business day', price: '$9.99', icon: Truck },
                      { value: 'same_day', label: 'Same Day Delivery', desc: 'Within 4 hours', price: '$14.99', icon: Truck },
                      { value: 'pickup', label: 'Pickup In-Store', desc: 'Ready within 2 hours', price: 'Free', icon: MapPin },
                    ].map(opt => (
                      <button key={opt.value} onClick={() => setDeliveryMethod(opt.value as any)}
                        className={cn('w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                          deliveryMethod === opt.value ? 'border-pharma-500 bg-pharma-500/5' : 'border-border hover:border-pharma-300'
                        )}>
                        <opt.icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.desc}</div>
                        </div>
                        <span className="text-sm font-semibold text-pharma-600">{opt.price}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {deliveryMethod !== 'pickup' && (
                  <div className="bg-card border rounded-2xl p-5">
                    <h3 className="font-semibold mb-4 flex items-center gap-2"><MapPin className="w-4 h-4" />Delivery Address</h3>
                    <div className="space-y-3">
                      <input value={address.street} onChange={e => setAddress(p => ({ ...p, street: e.target.value }))} placeholder="Street address *" className="input-field" required />
                      <div className="grid grid-cols-2 gap-3">
                        <input value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} placeholder="City *" className="input-field" required />
                        <input value={address.state} onChange={e => setAddress(p => ({ ...p, state: e.target.value }))} placeholder="State *" className="input-field" required />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input value={address.country} onChange={e => setAddress(p => ({ ...p, country: e.target.value }))} placeholder="Country *" className="input-field" required />
                        <input value={address.zipCode} onChange={e => setAddress(p => ({ ...p, zipCode: e.target.value }))} placeholder="ZIP Code *" className="input-field" required />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 'payment' && (
              <div className="bg-card border rounded-2xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4" />Payment Method</h3>
                <div className="space-y-3">
                  {[
                    { value: 'card', label: 'Credit / Debit Card', icon: '💳' },
                    { value: 'mobile_money', label: 'Mobile Money', icon: '📱' },
                    { value: 'cash', label: 'Cash on Delivery', icon: '💵' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setPaymentMethod(opt.value as any)}
                      className={cn('w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                        paymentMethod === opt.value ? 'border-pharma-500 bg-pharma-500/5' : 'border-border hover:border-pharma-300'
                      )}>
                      <span className="text-2xl">{opt.icon}</span>
                      <span className="font-medium text-sm">{opt.label}</span>
                      {paymentMethod === opt.value && <CheckCircle className="w-4 h-4 text-pharma-500 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <div className="space-y-4">
            <div className="bg-card border rounded-2xl p-5">
              <h3 className="font-display font-bold text-lg mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm mb-4">
                {items.map(i => (
                  <div key={i.id} className="flex justify-between text-muted-foreground">
                    <span className="truncate pr-2">{i.name} ×{i.quantity}</span>
                    <span className="flex-shrink-0">{formatCurrency(i.price * i.quantity)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 space-y-1.5">
                  <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Tax (8%)</span><span>{formatCurrency(tax)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span>{fee === 0 ? 'Free' : formatCurrency(fee)}</span></div>
                  <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span className="text-pharma-600">{formatCurrency(total)}</span></div>
                </div>
              </div>

              {step === 'cart' && (
                <button onClick={() => setStep('delivery')} className="w-full btn-primary py-3">Continue to Delivery</button>
              )}
              {step === 'delivery' && (
                <div className="space-y-2">
                  <button onClick={() => setStep('payment')} disabled={deliveryMethod !== 'pickup' && !address.street} className="w-full btn-primary py-3 disabled:opacity-50">Continue to Payment</button>
                  <button onClick={() => setStep('cart')} className="w-full py-2.5 border rounded-xl text-sm hover:bg-muted transition-colors">Back</button>
                </div>
              )}
              {step === 'payment' && (
                <div className="space-y-2">
                  <button onClick={placeOrder} disabled={placing} className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                    {placing ? 'Placing...' : <><CheckCircle className="w-4 h-4" />Place Order</>}
                  </button>
                  <button onClick={() => setStep('delivery')} className="w-full py-2.5 border rounded-xl text-sm hover:bg-muted transition-colors">Back</button>
                </div>
              )}
            </div>

            <div className="bg-muted/50 rounded-2xl p-4 text-xs text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" />Secure encrypted checkout</div>
              <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" />Licensed pharmacies only</div>
              <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" />Free returns within 7 days</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
