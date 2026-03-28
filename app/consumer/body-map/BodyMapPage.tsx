'use client'

import { useState } from 'react';
import { BodyMap3D, SymptomSelector, BODY_PART_LABELS } from '@/components/three/BodyMap3D';
import { PageHeader, AlertBanner, Spinner } from '@/components/shared';
import { Pill, AlertTriangle, CheckCircle, ShoppingCart, RotateCcw, Sparkles, ChevronRight, X } from 'lucide-react';
import { cn, formatCurrency } from '@/utils';
import toast from 'react-hot-toast';
import type { BodyPart, AIRecommendation } from '@/types';

const SEVERITY_LABELS: Record<number, string> = {
  1: 'Very Mild', 2: 'Mild', 3: 'Mild-Moderate', 4: 'Moderate',
  5: 'Moderate', 6: 'Moderate-Severe', 7: 'Severe',
  8: 'Very Severe', 9: 'Intense', 10: 'Extreme',
};

export function BodyMapPage() {
  const [selectedParts, setSelectedParts] = useState<BodyPart[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState(5);
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [logId, setLogId] = useState<string | null>(null);
  const [activeBodyPart, setActiveBodyPart] = useState<BodyPart | null>(null);

  const togglePart = (part: BodyPart) => {
    setSelectedParts(prev =>
      prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]
    );
    setActiveBodyPart(part);
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const reset = () => {
    setSelectedParts([]);
    setSelectedSymptoms([]);
    setSeverity(5);
    setDuration('');
    setDescription('');
    setRecommendations([]);
    setLogId(null);
    setActiveBodyPart(null);
  };

  const getRecommendations = async () => {
    if (selectedParts.length === 0) { toast.error('Please select at least one body area'); return; }
    if (selectedSymptoms.length === 0) { toast.error('Please select at least one symptom'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bodyParts: selectedParts, symptoms: selectedSymptoms, severity, duration, description }),
      });
      const data = await res.json();
      if (data.success) {
        setRecommendations(data.data.recommendations);
        setLogId(data.data.logId);
        toast.success('AI recommendations ready!');
      } else {
        toast.error(data.error || 'Failed to get recommendations');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (drug: AIRecommendation) => {
    toast.success(`${drug.drugName} added to search`);
  };

  return (
    <div>
      <PageHeader
        title="3D Body Map"
        subtitle="Click on the affected area to get AI-powered drug recommendations"
        actions={
          selectedParts.length > 0 && (
            <button onClick={reset} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border rounded-xl px-4 py-2 hover:bg-muted transition-colors">
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 3D Map - takes 3 cols */}
        <div className="lg:col-span-3">
          <div className="bg-card border rounded-2xl overflow-hidden" style={{ height: 540 }}>
            <BodyMap3D
              selectedParts={selectedParts}
              onPartSelect={togglePart}
              className="w-full h-full"
            />
          </div>

          {/* Selected parts chips */}
          {selectedParts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedParts.map(part => (
                <span key={part} className="flex items-center gap-1.5 px-3 py-1.5 bg-pharma-500/10 text-pharma-600 dark:text-pharma-400 rounded-full text-sm border border-pharma-500/20">
                  <span>{BODY_PART_LABELS[part]}</span>
                  <button onClick={() => togglePart(part)} className="hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Controls - 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          {selectedParts.length === 0 ? (
            <div className="bg-card border rounded-2xl p-6 flex flex-col items-center justify-center text-center" style={{ minHeight: 200 }}>
              <div className="w-14 h-14 rounded-2xl bg-pharma-500/10 flex items-center justify-center mb-3">
                <Pill className="w-6 h-6 text-pharma-500" />
              </div>
              <h3 className="font-semibold mb-1">Click a body area</h3>
              <p className="text-sm text-muted-foreground">Select the region where you feel pain or discomfort</p>
            </div>
          ) : (
            <>
              {/* Symptom selectors */}
              <div className="bg-card border rounded-2xl p-5 space-y-5 max-h-64 overflow-y-auto">
                {selectedParts.map(part => (
                  <SymptomSelector
                    key={part}
                    bodyPart={part}
                    selected={selectedSymptoms}
                    onToggle={toggleSymptom}
                  />
                ))}
              </div>

              {/* Severity slider */}
              <div className="bg-card border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">Severity</label>
                  <span className={cn('text-sm font-semibold', severity >= 7 ? 'text-red-500' : severity >= 4 ? 'text-yellow-500' : 'text-green-500')}>
                    {severity}/10 — {SEVERITY_LABELS[severity]}
                  </span>
                </div>
                <input
                  type="range" min={1} max={10} value={severity}
                  onChange={e => setSeverity(Number(e.target.value))}
                  className="w-full accent-pharma-500"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Mild</span><span>Moderate</span><span>Severe</span>
                </div>
              </div>

              {/* Duration & Notes */}
              <div className="bg-card border rounded-2xl p-5 space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Duration</label>
                  <select value={duration} onChange={e => setDuration(e.target.value)} className="input-field">
                    <option value="">Select duration</option>
                    <option value="Less than 1 hour">Less than 1 hour</option>
                    <option value="A few hours">A few hours</option>
                    <option value="1-2 days">1-2 days</option>
                    <option value="3-7 days">3-7 days</option>
                    <option value="1-2 weeks">1-2 weeks</option>
                    <option value="More than 2 weeks">More than 2 weeks</option>
                    <option value="Chronic (months/years)">Chronic (months/years)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Additional notes <span className="text-muted-foreground">(optional)</span></label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe your symptoms in more detail..."
                    rows={3}
                    className="input-field resize-none"
                  />
                </div>
              </div>

              <button
                onClick={getRecommendations}
                disabled={loading || selectedSymptoms.length === 0}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Spinner size="sm" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Getting AI Recommendations...' : 'Get AI Drug Recommendations'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-pharma-500/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-pharma-500" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl">AI Recommendations</h2>
              <p className="text-sm text-muted-foreground">Based on your selected symptoms • Consult a pharmacist before use</p>
            </div>
            {logId && (
              <span className="ml-auto text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                Saved to health history
              </span>
            )}
          </div>

          <AlertBanner type="warning" message="⚕️ These are AI suggestions only. Always consult a licensed pharmacist or doctor before taking any medication." />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
            {recommendations.map((rec, i) => (
              <div key={i} className="bg-card border rounded-2xl p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-bold text-base">{rec.drugName}</h3>
                    <p className="text-xs text-muted-foreground">{rec.genericName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {rec.isOTC ? (
                      <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">OTC</span>
                    ) : (
                      <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />Rx
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{Math.round(rec.confidence * 100)}% match</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{rec.indication}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground w-16">Dosage:</span>
                    <span className="font-medium">{rec.dosage}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground w-16">Frequency:</span>
                    <span className="font-medium">{rec.frequency}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground w-16">Duration:</span>
                    <span className="font-medium">{rec.duration}</span>
                  </div>
                </div>

                {rec.warnings && rec.warnings.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 mb-4">
                    {rec.warnings.slice(0, 2).map((w, wi) => (
                      <p key={wi} className="text-xs text-yellow-700 dark:text-yellow-400 flex items-start gap-1.5">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        {w}
                      </p>
                    ))}
                  </div>
                )}

                {/* Confidence bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">AI Confidence</span>
                    <span className="font-medium">{Math.round(rec.confidence * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full">
                    <div
                      className="h-full bg-gradient-to-r from-pharma-500 to-emerald-400 rounded-full"
                      style={{ width: `${rec.confidence * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => addToCart(rec)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-sm bg-pharma-500/10 text-pharma-600 dark:text-pharma-400 hover:bg-pharma-500/20 rounded-xl transition-colors font-medium"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Find & Order
                  </button>
                  {!rec.isOTC && (
                    <button className="flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground hover:text-foreground border rounded-xl hover:bg-muted transition-colors">
                      <ChevronRight className="w-3 h-3" />
                      Rx Info
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
