'use client';

import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, DataTable, Modal, StatCard, EmptyState } from '@/components/shared';
import { Database, Plus, Search, Upload, Pill, Edit, Trash2, Eye, CheckCircle, X } from 'lucide-react';
import { cn, formatDate } from '@/utils';
import toast from 'react-hot-toast';

const DRUG_FORMS = ['tablet', 'capsule', 'liquid', 'injection', 'topical', 'inhaler', 'patch', 'drops'];
const CATEGORIES = ['analgesic','antibiotic','antiviral','antifungal','antihistamine','antihypertensive','antidiabetic','cardiovascular','gastrointestinal','respiratory','neurological','psychiatric','hormone','vitamin','supplement','topical','ophthalmic','vaccine','other'];

export function AdminDrugsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [viewDrug, setViewDrug] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: '', genericName: '', brand: '', manufacturer: '', strength: '',
    form: 'tablet', description: '', activeIngredients: '',
    symptoms: '', indications: '', sideEffects: '',
    requiresPrescription: false, isControlled: false,
    category: [] as string[], storageInstructions: '', images: [] as any[],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-drugs', search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/drugs?${params}`);
      return (await res.json()).data || [];
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'drug');
      fd.append('name', form.name || 'drug');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setForm(p => ({ ...p, images: [...p.images, data.data] }));
        toast.success('Image uploaded');
      }
    } catch { toast.error('Upload failed'); }
    finally { setUploadingImg(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        symptoms: form.symptoms.split(',').map(s => s.trim()).filter(Boolean),
        indications: form.indications.split(',').map(s => s.trim()).filter(Boolean),
        sideEffects: form.sideEffects.split(',').map(s => s.trim()).filter(Boolean),
        activeIngredients: form.activeIngredients.split(',').map(s => s.trim()).filter(Boolean),
      };
      const res = await fetch('/api/drugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Drug added to database');
        qc.invalidateQueries({ queryKey: ['admin-drugs'] });
        setAddOpen(false);
      } else toast.error(data.error);
    } catch { toast.error('Failed to save drug'); }
    finally { setSaving(false); }
  };

  const deleteDrug = async (id: string) => {
    if (!confirm('Soft-delete this drug?')) return;
    await fetch(`/api/drugs/${id}`, { method: 'DELETE' });
    qc.invalidateQueries({ queryKey: ['admin-drugs'] });
    toast.success('Drug removed from catalog');
  };

  const toggleCategory = (cat: string) =>
    setForm(p => ({ ...p, category: p.category.includes(cat) ? p.category.filter(c => c !== cat) : [...p.category, cat] }));

  return (
    <div>
      <PageHeader
        title="Drug Database"
        subtitle="Master pharmaceutical catalog — manage all drugs on the platform"
        actions={
          <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />Add Drug
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Drugs" value={data?.length || 0} icon={<Database className="w-4 h-4" />} color="blue" />
        <StatCard label="Require Prescription" value={data?.filter((d: any) => d.requiresPrescription).length || 0} icon={<Pill className="w-4 h-4" />} color="orange" />
        <StatCard label="Controlled Substances" value={data?.filter((d: any) => d.isControlled).length || 0} icon={<Pill className="w-4 h-4" />} color="red" />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search drugs by name, generic name, or symptom..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pharma-500/30" />
      </div>

      <DataTable
        loading={isLoading}
        data={data || []}
        onRowClick={setViewDrug}
        columns={[
          { key: 'drug', label: 'Drug', render: r => (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pharma-500/10 flex items-center justify-center flex-shrink-0">
                {r.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.images[0].secureUrl} alt={r.name} className="w-8 h-8 rounded-lg object-cover" />
                ) : <Pill className="w-4 h-4 text-pharma-500" />}
              </div>
              <div>
                <div className="font-medium text-sm">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.genericName}</div>
              </div>
            </div>
          )},
          { key: 'strength', label: 'Strength/Form', render: r => <span className="text-sm">{r.strength} {r.form}</span> },
          { key: 'manufacturer', label: 'Manufacturer', render: r => <span className="text-sm text-muted-foreground">{r.manufacturer || '—'}</span> },
          { key: 'category', label: 'Categories', render: r => (
            <div className="flex flex-wrap gap-1">
              {r.category?.slice(0,2).map((c: string) => <span key={c} className="text-xs bg-muted px-1.5 py-0.5 rounded capitalize">{c}</span>)}
              {r.category?.length > 2 && <span className="text-xs text-muted-foreground">+{r.category.length-2}</span>}
            </div>
          )},
          { key: 'rx', label: 'Rx / Ctrl', render: r => (
            <div className="flex gap-1.5">
              {r.requiresPrescription && <span className="badge-status bg-orange-100 text-orange-700">Rx</span>}
              {r.isControlled && <span className="badge-status bg-red-100 text-red-700">Ctrl</span>}
              {!r.requiresPrescription && !r.isControlled && <span className="badge-status bg-green-100 text-green-700">OTC</span>}
            </div>
          )},
          { key: 'sku', label: 'SKU', render: r => <span className="font-mono text-xs text-muted-foreground">{r.sku}</span> },
          { key: 'actions', label: '', render: r => (
            <div className="flex gap-1">
              <button onClick={e => { e.stopPropagation(); setViewDrug(r); }} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Eye className="w-3.5 h-3.5" /></button>
              <button onClick={e => { e.stopPropagation(); deleteDrug(r._id); }} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )},
        ]}
      />

      {/* View drug modal */}
      <Modal open={!!viewDrug} onClose={() => setViewDrug(null)} title={viewDrug?.name} size="lg">
        {viewDrug && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[['Generic Name', viewDrug.genericName],['Brand', viewDrug.brand],['Manufacturer', viewDrug.manufacturer],['Strength', viewDrug.strength],['Form', viewDrug.form],['SKU', viewDrug.sku]].map(([l,v]) => (
                <div key={l} className="bg-muted/50 rounded-xl p-3">
                  <div className="text-xs text-muted-foreground mb-0.5">{l}</div>
                  <div className="font-medium">{v || '—'}</div>
                </div>
              ))}
            </div>
            {viewDrug.description && <p className="text-muted-foreground">{viewDrug.description}</p>}
            <div className="space-y-2">
              {[['Symptoms', viewDrug.symptoms],['Indications', viewDrug.indications],['Side Effects', viewDrug.sideEffects],['Active Ingredients', viewDrug.activeIngredients]].map(([label, arr]) => arr?.length > 0 && (
                <div key={label}>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</div>
                  <div className="flex flex-wrap gap-1.5">{arr.map((item: string) => <span key={item} className="text-xs bg-muted px-2 py-0.5 rounded-full">{item}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Add drug modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Drug to Database" size="xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium mb-1.5 block">Brand Name *</label><input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="input-field" required /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Generic (INN) Name</label><input value={form.genericName} onChange={e => setForm(p => ({...p, genericName: e.target.value}))} className="input-field" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Brand</label><input value={form.brand} onChange={e => setForm(p => ({...p, brand: e.target.value}))} className="input-field" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Manufacturer</label><input value={form.manufacturer} onChange={e => setForm(p => ({...p, manufacturer: e.target.value}))} className="input-field" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Strength *</label><input value={form.strength} onChange={e => setForm(p => ({...p, strength: e.target.value}))} placeholder="e.g. 500mg" className="input-field" required /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Form *</label>
              <select value={form.form} onChange={e => setForm(p => ({...p, form: e.target.value}))} className="input-field">
                {DRUG_FORMS.map(f => <option key={f} value={f} className="capitalize">{f}</option>)}
              </select>
            </div>
          </div>

          <div><label className="text-sm font-medium mb-1.5 block">Description</label><textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} rows={3} className="input-field resize-none" /></div>

          <div className="grid grid-cols-1 gap-3">
            {[['Active Ingredients', 'activeIngredients', 'Paracetamol, Caffeine'],['Symptoms it treats', 'symptoms', 'Headache, Fever, Pain'],['Indications', 'indications', 'Mild to moderate pain relief'],['Side Effects', 'sideEffects', 'Nausea, Dizziness']].map(([label, key, ph]) => (
              <div key={key}><label className="text-sm font-medium mb-1.5 block">{label} <span className="text-muted-foreground font-normal">(comma-separated)</span></label><input value={(form as any)[key]} onChange={e => setForm(p => ({...p, [key]: e.target.value}))} placeholder={ph} className="input-field" /></div>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Categories</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button type="button" key={cat} onClick={() => toggleCategory(cat)}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize',
                    form.category.includes(cat) ? 'bg-pharma-500 text-white border-pharma-500' : 'border-border hover:bg-muted'
                  )}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.requiresPrescription} onChange={e => setForm(p => ({...p, requiresPrescription: e.target.checked}))} className="w-4 h-4 accent-pharma-500" />
              <span className="text-sm">Requires Prescription</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isControlled} onChange={e => setForm(p => ({...p, isControlled: e.target.checked}))} className="w-4 h-4 accent-pharma-500" />
              <span className="text-sm">Controlled Substance</span>
            </label>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Drug Images</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingImg}
                className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm hover:bg-muted transition-colors disabled:opacity-50">
                <Upload className="w-4 h-4" />
                {uploadingImg ? 'Uploading...' : 'Upload Image'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              {form.images.map((img, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.secureUrl} alt="drug" className="w-12 h-12 rounded-lg object-cover border" />
                  <button type="button" onClick={() => setForm(p => ({...p, images: p.images.filter((_, j) => j !== i)}))}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center text-xs">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setAddOpen(false)} className="flex-1 py-2.5 border rounded-xl text-sm hover:bg-muted">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5 disabled:opacity-50">{saving ? 'Saving...' : 'Add Drug'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
