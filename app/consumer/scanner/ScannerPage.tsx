'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { PageHeader, AlertBanner, Spinner } from '@/components/shared';
import { ScanLine, Camera, Upload, RotateCcw, AlertTriangle, CheckCircle, X, Info, Package } from 'lucide-react';
import { cn } from '@/utils';
import toast from 'react-hot-toast';

interface ScanResult {
  name: string;
  genericName: string;
  manufacturer: string;
  strength: string;
  form: string;
  indications: string[];
  dosage: { group: string; dose: string; frequency: string }[];
  sideEffects: string[];
  warnings: string[];
  interactions: string[];
  requiresPrescription: boolean;
  storageInstructions: string;
  expiryInfo?: string;
  isSuspicious: boolean;
  suspicionReason?: string;
  imageUrl?: string;
}

export function ScannerPage() {
  const [mode, setMode] = useState<'upload' | 'camera'>('upload');
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'dosage' | 'warnings' | 'interactions'>('overview');
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error('Camera is not supported on this device');
        return;
      }

      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCameraActive(true);
    } catch {
      toast.error('Camera access denied');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => stopCamera, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
    setPreview(dataUrl);
    stopCamera();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image'); return; }
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file?.type.startsWith('image/')) { toast.error('Image files only'); return; }
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const scan = async () => {
    if (!preview) { toast.error('No image to scan'); return; }
    setScanning(true);
    setResult(null);
    try {
      // Convert dataUrl to blob for upload
      const res = await fetch(preview);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('image', blob, 'scan.jpg');
      formData.append('mode', 'auto');

      const response = await fetch('/api/ai/scanner', { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        toast.success('Scan complete!');
      } else {
        toast.error(data.error || 'Scan failed');
      }
    } catch {
      toast.error('Scan error');
    } finally {
      setScanning(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    stopCamera();
  };

  const TABS = ['overview', 'dosage', 'warnings', 'interactions'] as const;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="AI Drug Scanner"
        subtitle="Photograph any medication packaging to get instant AI-powered drug information"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Panel */}
        <div className="space-y-4">
          {/* Mode toggle */}
          {!result && (
            <div className="flex bg-muted rounded-xl p-1 gap-1">
              {(['upload', 'camera'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); if (m === 'camera') startCamera(); else stopCamera(); }}
                  className={cn('flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
                    mode === m ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {m === 'upload' ? <Upload className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                  {m === 'upload' ? 'Upload Image' : 'Use Camera'}
                </button>
              ))}
            </div>
          )}

          {/* Camera view */}
          {mode === 'camera' && cameraActive && !preview && (
            <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              <canvas ref={canvasRef} className="hidden" />
              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-40 border-2 border-pharma-400 rounded-xl relative">
                  <div className="absolute inset-0 border-8 border-transparent" style={{ borderImage: 'linear-gradient(#0ea5e9,#0ea5e9) 30 / 20px / 0 stretch' }} />
                  <div className="absolute top-2 left-0 right-0 flex justify-center">
                    <span className="text-xs text-pharma-300 bg-black/50 px-2 py-0.5 rounded">Align packaging here</span>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-4 inset-x-0 flex justify-center gap-4">
                <button onClick={stopCamera} className="p-3 bg-white/10 backdrop-blur rounded-full border border-white/20 text-white hover:bg-white/20 transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <button onClick={capturePhoto} className="p-4 bg-pharma-500 rounded-full shadow-lg hover:bg-pharma-600 transition-colors">
                  <Camera className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          )}

          {/* Upload dropzone */}
          {mode === 'upload' && !preview && (
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-pharma-400 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-muted/30 hover:bg-pharma-500/5"
              style={{ aspectRatio: '4/3' }}
            >
              <div className="w-16 h-16 rounded-2xl bg-pharma-500/10 flex items-center justify-center mb-4">
                <ScanLine className="w-8 h-8 text-pharma-500" />
              </div>
              <h3 className="font-semibold mb-1">Drop drug image here</h3>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <p className="text-xs text-muted-foreground">Supports JPG, PNG, WEBP up to 10MB</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="relative rounded-2xl overflow-hidden bg-muted" style={{ aspectRatio: '4/3' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Drug scan" className="w-full h-full object-contain" />
              {scanning && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-pharma-500/30 border-t-pharma-500 animate-spin" />
                    <ScanLine className="absolute inset-0 m-auto w-7 h-7 text-pharma-400" />
                  </div>
                  <p className="text-white font-medium">Analyzing with AI...</p>
                  <p className="text-white/60 text-sm">Extracting drug information</p>
                </div>
              )}
              <button
                onClick={reset}
                className="absolute top-3 right-3 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            {preview && !result && (
              <button onClick={scan} disabled={scanning} className="flex-1 btn-primary flex items-center justify-center gap-2 py-3">
                {scanning ? <Spinner size="sm" /> : <ScanLine className="w-4 h-4" />}
                {scanning ? 'Scanning...' : 'Scan Drug'}
              </button>
            )}
            {result && (
              <button onClick={reset} className="flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl hover:bg-muted transition-colors text-sm font-medium">
                <RotateCcw className="w-4 h-4" />
                Scan Another
              </button>
            )}
          </div>

          <AlertBanner type="info" message="For best results: ensure good lighting, hold camera steady, and include the full front label." />
        </div>

        {/* Results Panel */}
        <div>
          {!result && !scanning && (
            <div className="bg-card border rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-64">
              <Package className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="font-semibold text-muted-foreground mb-1">Scan results will appear here</h3>
              <p className="text-sm text-muted-foreground/60">Upload or capture a drug package image</p>
            </div>
          )}

          {result && (
            <div className="bg-card border rounded-2xl overflow-hidden">
              {/* Drug header */}
              <div className={cn('p-5 border-b', result.isSuspicious ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gradient-to-r from-pharma-500/10 to-emerald-500/10')}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display font-bold text-xl">{result.name}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{result.genericName} • {result.manufacturer}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-background border px-2 py-0.5 rounded-full">{result.strength}</span>
                      <span className="text-xs bg-background border px-2 py-0.5 rounded-full capitalize">{result.form}</span>
                      {result.requiresPrescription && (
                        <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />Prescription Required
                        </span>
                      )}
                    </div>
                  </div>
                  {result.isSuspicious ? (
                    <div className="flex items-center gap-1.5 text-red-600 bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Suspicious
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Verified
                    </div>
                  )}
                </div>
                {result.isSuspicious && result.suspicionReason && (
                  <div className="mt-3 text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {result.suspicionReason}
                  </div>
                )}
                {result.expiryInfo && (
                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                    <Info className="w-3 h-3" /> Expiry: {result.expiryInfo}
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex border-b overflow-x-auto">
                {TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn('px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors capitalize',
                      activeTab === tab ? 'border-pharma-500 text-pharma-600 dark:text-pharma-400' : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {tab}
                    {tab === 'warnings' && result.warnings.length > 0 && (
                      <span className="ml-1.5 bg-yellow-100 text-yellow-700 text-xs px-1.5 rounded-full">{result.warnings.length}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-5 max-h-80 overflow-y-auto">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Indications</h4>
                      <ul className="space-y-1">
                        {result.indications.map((ind, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            {ind}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Storage</h4>
                      <p className="text-sm text-muted-foreground">{result.storageInstructions}</p>
                    </div>
                  </div>
                )}
                {activeTab === 'dosage' && (
                  <div className="space-y-3">
                    {result.dosage.map((d, i) => (
                      <div key={i} className="bg-muted/50 rounded-xl p-4">
                        <div className="font-semibold text-sm mb-2">{d.group}</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-muted-foreground">Dose: </span><span className="font-medium">{d.dose}</span></div>
                          <div><span className="text-muted-foreground">Frequency: </span><span className="font-medium">{d.frequency}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'warnings' && (
                  <div className="space-y-2">
                    {result.warnings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No specific warnings listed.</p>
                    ) : result.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-800 dark:text-yellow-300">{w}</p>
                      </div>
                    ))}
                    <div className="pt-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Side Effects</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.sideEffects.map((se, i) => (
                          <span key={i} className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2.5 py-1 rounded-full">{se}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'interactions' && (
                  <div className="space-y-2">
                    {result.interactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No known interactions listed.</p>
                    ) : result.interactions.map((inter, i) => (
                      <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-xl p-3 text-sm">
                        <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                        {inter}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
