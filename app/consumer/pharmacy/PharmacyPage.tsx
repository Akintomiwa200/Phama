'use client'

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, EmptyState, Spinner } from '@/components/shared';
import { Store, Search, MapPin, Star, Clock, ShoppingCart, Pill, Filter, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn, formatCurrency } from '@/utils';
import { useCartStore } from '../cart/CartPage';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Mock pharmacy data (in production would come from /api/tenants with geo search)
const DEMO_PHARMACIES = [
  { id: '1', name: 'MediCare Pharmacy', address: '123 Health St, Downtown', rating: 4.8, reviews: 124, hours: 'Open 24h', distance: '0.3 km', type: 'retailer' },
  { id: '2', name: 'City Health Pharmacy', address: '456 Wellness Ave', rating: 4.6, reviews: 89, hours: 'Open until 10 PM', distance: '0.7 km', type: 'retailer' },
  { id: '3', name: 'QuickMeds Express', address: '789 Rapid Road', rating: 4.5, reviews: 67, hours: 'Open until 9 PM', distance: '1.2 km', type: 'retailer' },
];

export function PharmacyPage() {
  const [searchDrug, setSearchDrug] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const addItem = useCartStore(s => s.addItem);
  const cartItems = useCartStore(s => s.items);

  const { data: drugs, isLoading } = useQuery({
    queryKey: ['drugs-browse', searchDrug, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '24' });
      if (searchDrug) params.set('search', searchDrug);
      if (categoryFilter) params.set('category', categoryFilter);
      const res = await fetch(`/api/drugs?${params}`);
      return (await res.json()).data || [];
    },
    enabled: searchDrug.length >= 2 || !!categoryFilter,
  });

  const CATEGORIES = ['analgesic', 'antibiotic', 'antihistamine', 'vitamin', 'antihypertensive', 'gastrointestinal', 'respiratory'];

  const handleAddToCart = (drug: any) => {
    addItem({
      id: drug._id,
      drugId: drug._id,
      name: drug.name,
      genericName: drug.genericName || '',
      price: 12.99, // In real app: from inventory by pharmacy
      quantity: 1,
      requiresPrescription: drug.requiresPrescription,
      pharmacyId: selectedPharmacy || DEMO_PHARMACIES[0].id,
      pharmacyName: DEMO_PHARMACIES.find(p => p.id === selectedPharmacy)?.name || 'Pharmacy',
      inventoryId: 'demo-inv-' + drug._id,
      batchNumber: 'BATCH001',
      maxQty: 10,
    });
    toast.success(`${drug.name} added to cart`);
  };

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <div>
      <PageHeader
        title="Find Pharmacy & Medications"
        subtitle="Browse nearby pharmacies and order your medications online"
        actions={
          <Link href="/consumer/cart" className="btn-primary flex items-center gap-2 relative">
            <ShoppingCart className="w-4 h-4" />
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>
        }
      />

      {/* Nearby pharmacies */}
      <div className="mb-8">
        <h2 className="font-display font-bold text-xl mb-4">Nearby Pharmacies</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEMO_PHARMACIES.map(pharmacy => (
            <button
              key={pharmacy.id}
              onClick={() => setSelectedPharmacy(pharmacy.id === selectedPharmacy ? null : pharmacy.id)}
              className={cn(
                'bg-card border rounded-2xl p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5',
                selectedPharmacy === pharmacy.id ? 'border-pharma-500 bg-pharma-500/5 shadow-md shadow-pharma-500/10' : 'border-border'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-pharma-500/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-pharma-500" />
                </div>
                {selectedPharmacy === pharmacy.id && <CheckCircle className="w-5 h-5 text-pharma-500" />}
              </div>
              <h3 className="font-semibold mb-1">{pharmacy.name}</h3>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{pharmacy.address}</div>
                <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{pharmacy.hours}</div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{pharmacy.rating}</span>
                  <span>{pharmacy.reviews} reviews</span>
                  <span className="font-medium text-pharma-500">{pharmacy.distance}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Drug search */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xl">Browse Medications</h2>
          {selectedPharmacy && (
            <span className="text-sm text-pharma-500 bg-pharma-500/10 px-3 py-1 rounded-full">
              📍 {DEMO_PHARMACIES.find(p => p.id === selectedPharmacy)?.name}
            </span>
          )}
        </div>

        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchDrug}
              onChange={e => setSearchDrug(e.target.value)}
              placeholder="Search medications by name or symptom..."
              className="w-full pl-10 pr-4 py-2.5 bg-card border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pharma-500/30"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)}
                className={cn('px-3 py-2 rounded-xl text-xs font-medium border transition-all capitalize',
                  categoryFilter === cat ? 'bg-pharma-500 text-white border-pharma-500' : 'border-border hover:bg-muted'
                )}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {!searchDrug && !categoryFilter ? (
          <div className="text-center py-16">
            <Pill className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-muted-foreground mb-1">Search for medications</h3>
            <p className="text-sm text-muted-foreground/60">Enter a drug name, symptom, or select a category</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !drugs?.length ? (
          <EmptyState icon={<Search className="w-8 h-8" />} title="No medications found" description={`Try a different search term`} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {drugs.map((drug: any) => {
              const inCart = cartItems.some(i => i.drugId === drug._id);
              return (
                <div key={drug._id} className="bg-card border rounded-2xl overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 duration-200">
                  <div className="h-32 bg-gradient-to-br from-pharma-50 to-pharma-100 dark:from-pharma-900/20 dark:to-pharma-800/20 flex items-center justify-center">
                    {drug.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={drug.images[0].secureUrl} alt={drug.name} className="h-full w-full object-cover" />
                    ) : (
                      <Pill className="w-10 h-10 text-pharma-400" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm leading-tight">{drug.name}</h3>
                      {drug.requiresPrescription && <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{drug.genericName}</p>
                    <p className="text-xs text-muted-foreground mb-3">{drug.strength} · {drug.form}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-pharma-600">{formatCurrency(12.99)}</span>
                      <button
                        onClick={() => handleAddToCart(drug)}
                        className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                          inCart ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-pharma-500/10 text-pharma-600 hover:bg-pharma-500/20'
                        )}
                      >
                        {inCart ? <><CheckCircle className="w-3.5 h-3.5" />Added</> : <><ShoppingCart className="w-3.5 h-3.5" />Add</>}
                      </button>
                    </div>
                    {drug.requiresPrescription && (
                      <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />Prescription required
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
