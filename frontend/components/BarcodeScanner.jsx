import { useState, useRef, useCallback, useEffect } from 'react';

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

// Barcode Scanner component using native BarcodeDetector API + OpenFoodFacts
export default function BarcodeScanner({ onFoodFound, onClose }) {
  const [status, setStatus] = useState('idle'); // idle | scanning | loading | found | error | manual
  const [error, setError] = useState('');
  const [foundFood, setFoundFood] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [scannedCode, setScannedCode] = useState('');
  const [savedAsCustom, setSavedAsCustom] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanningRef = useRef(false);
  const manualRef = useRef(null);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const lookupBarcode = useCallback(async (code) => {
    setScannedCode(code);
    setStatus('loading');
    try {
      // Try Open Food Facts first
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      if (data.status !== 1 || !data.product) {
        throw new Error(`No product found for barcode ${code}`);
      }
      const p = data.product;
      const n = p.nutriments || {};

      // Prefer per-serving values; fall back to per-100g
      const cal = Math.round(n['energy-kcal_serving'] ?? n['energy-kcal_100g'] ?? 0);
      const food = {
        id: `barcode-${code}`,
        name: p.product_name_en || p.product_name || 'Unknown Product',
        calories: cal,
        macros: {
          protein: +(parseFloat(n.proteins_serving ?? n.proteins_100g ?? 0)).toFixed(1),
          carbs: +(parseFloat(n.carbohydrates_serving ?? n.carbohydrates_100g ?? 0)).toFixed(1),
          fat: +(parseFloat(n.fat_serving ?? n.fat_100g ?? 0)).toFixed(1),
          fats: +(parseFloat(n.fat_serving ?? n.fat_100g ?? 0)).toFixed(1),
          fiber: +(parseFloat(n.fiber_serving ?? n.fiber_100g ?? 0)).toFixed(1),
          sugar: +(parseFloat(n.sugars_serving ?? n.sugars_100g ?? 0)).toFixed(1),
          sodium: +(parseFloat(((n.sodium_serving ?? n.sodium_100g ?? 0) * 1000))).toFixed(1),
          saturated_fat: +(parseFloat(n['saturated-fat_serving'] ?? n['saturated-fat_100g'] ?? 0)).toFixed(1),
          cholesterol: +(parseFloat(((n.cholesterol_serving ?? n.cholesterol_100g ?? 0) * 1000))).toFixed(1),
          serving_size: p.serving_size || '',
        },
        serving_size: p.serving_size || '',
        brand: p.brands || '',
        barcode: code,
        image: p.image_front_small_url || p.image_small_url || p.image_url || '',
      };
      setFoundFood(food);
      setStatus('found');
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Failed to look up product');
    }
  }, []);

  const startScanning = useCallback(async () => {
    setStatus('scanning');
    setError('');

    if (!('BarcodeDetector' in window)) {
      setStatus('manual');
      setError('Your browser does not support camera barcode scanning. Try Chrome on Android/desktop, or enter the barcode manually.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'] });
      scanningRef.current = true;

      const scan = async () => {
        if (!scanningRef.current || !videoRef.current) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            stopCamera();
            await lookupBarcode(code);
            return;
          }
        } catch {}
        if (scanningRef.current) requestAnimationFrame(scan);
      };
      requestAnimationFrame(scan);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setStatus('manual');
        setError('Camera permission denied. Enter the barcode manually.');
      } else {
        setStatus('manual');
        setError('Could not start camera. Enter the barcode manually.');
      }
    }
  }, [stopCamera, lookupBarcode]);

  // Auto-start scanning on mount
  useEffect(() => {
    startScanning();
    return () => stopCamera();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus manual input when switching to manual mode
  useEffect(() => {
    if (status === 'manual') {
      setTimeout(() => manualRef.current?.focus(), 100);
    }
  }, [status]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (code) lookupBarcode(code);
  };

  const handleAddFood = () => {
    if (foundFood && onFoodFound) onFoodFound(foundFood);
  };

  const reset = () => {
    setFoundFood(null);
    setScannedCode('');
    setManualCode('');
    setError('');
    setSavedAsCustom(false);
    startScanning();
  };

  const saveAsCustomFood = async () => {
    if (!foundFood) return;
    try {
      const body = {
        name: foundFood.brand ? `${foundFood.name} (${foundFood.brand})` : foundFood.name,
        calories: foundFood.calories,
        protein: foundFood.macros.protein,
        carbs: foundFood.macros.carbs,
        fats: foundFood.macros.fat,
        serving_size: foundFood.serving_size || '',
        notes: `Barcode: ${scannedCode}`,
      };
      // Save to localStorage via custom foods format (no auth needed for local storage approach)
      const key = 'boilerfuel_custom_foods';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push({ ...body, id: `custom-${Date.now()}`, createdAt: Date.now() });
      localStorage.setItem(key, JSON.stringify(existing));
      setSavedAsCustom(true);
    } catch {
      setSavedAsCustom(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/70"
      onClick={onClose}
      style={{ animation: `fadeInTooltip 0.15s ${EASE} both` }}>
      <div className="bg-theme-bg-primary border border-theme-text-primary/20 w-full sm:max-w-md sm:mx-4 max-h-[92vh] overflow-y-auto sm:rounded-none rounded-t-xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-theme-text-primary/10">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-theme-text-tertiary">
              <rect x="2" y="4" width="20" height="16" rx="1" /><line x1="6" y1="8" x2="6" y2="16" /><line x1="9" y1="8" x2="9" y2="16" strokeWidth="1" /><line x1="11" y1="8" x2="11" y2="16" /><line x1="14" y1="8" x2="14" y2="16" strokeWidth="1" /><line x1="16" y1="8" x2="16" y2="16" /><line x1="18" y1="8" x2="18" y2="16" strokeWidth="1" />
            </svg>
            <span className="text-sm font-bold tracking-wide">Barcode Scanner</span>
          </div>
          <button onClick={onClose} className="p-1 text-theme-text-tertiary hover:text-theme-text-primary transition-colors" title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-4">

          {/* Scanning state — camera view */}
          {status === 'scanning' && (
            <div className="space-y-3">
              <div className="relative bg-black overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-52 h-36">
                    {/* Corner marks */}
                    {[['top-0 left-0', 'border-t-2 border-l-2'], ['top-0 right-0', 'border-t-2 border-r-2'], ['bottom-0 left-0', 'border-b-2 border-l-2'], ['bottom-0 right-0', 'border-b-2 border-r-2']].map(([pos, border], i) => (
                      <div key={i} className={`absolute ${pos} ${border} border-white w-5 h-5`} />
                    ))}
                    {/* Scan line */}
                    <div className="absolute left-0 right-0 h-0.5 bg-yellow-400/70"
                      style={{ top: '50%', animation: 'scanLine 2s ease-in-out infinite' }} />
                  </div>
                </div>
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <span className="text-[11px] text-white/60">Point camera at barcode</span>
                </div>
              </div>
              <button onClick={() => { stopCamera(); setStatus('manual'); }}
                className="w-full text-xs text-theme-text-tertiary hover:text-theme-text-primary transition-colors py-1 underline underline-offset-2">
                Enter barcode manually instead
              </button>
            </div>
          )}

          {/* Manual entry */}
          {status === 'manual' && (
            <div className="space-y-3">
              {error && (
                <div className="text-[11px] text-theme-text-tertiary bg-theme-bg-secondary/50 px-3 py-2 border border-theme-text-primary/10">
                  {error}
                </div>
              )}
              <div className="text-xs text-theme-text-tertiary mb-2">Enter the barcode number from the product packaging:</div>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  ref={manualRef}
                  type="text"
                  inputMode="numeric"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  placeholder="e.g. 012345678901"
                  className="flex-1 px-3 py-2 bg-theme-bg-secondary border border-theme-text-primary/20 text-theme-text-primary text-sm font-mono focus:outline-none focus:border-theme-text-primary/50 tracking-widest"
                />
                <button type="submit" disabled={!manualCode.trim()}
                  className="px-4 py-2 border border-theme-text-primary text-theme-text-primary text-xs font-bold uppercase tracking-wider hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  Look Up
                </button>
              </form>
              {'BarcodeDetector' in (typeof window !== 'undefined' ? window : {}) && (
                <button onClick={startScanning}
                  className="text-xs text-theme-text-tertiary hover:text-theme-text-primary transition-colors underline underline-offset-2">
                  Try camera again
                </button>
              )}
            </div>
          )}

          {/* Loading */}
          {status === 'loading' && (
            <div className="text-center py-10 space-y-2">
              <div className="text-xs text-theme-text-tertiary animate-pulse">Looking up product...</div>
              {scannedCode && <div className="text-[10px] font-mono text-theme-text-tertiary/50">{scannedCode}</div>}
            </div>
          )}

          {/* Found */}
          {status === 'found' && foundFood && (
            <div className="space-y-4" style={{ animation: `fadeInTooltip 0.2s ${EASE} both` }}>
              {/* Product header */}
              <div className="flex gap-3 items-start">
                {foundFood.image ? (
                  <img src={foundFood.image} alt="" className="w-16 h-16 object-contain border border-theme-text-primary/10 shrink-0 bg-white" />
                ) : (
                  <div className="w-16 h-16 border border-theme-text-primary/10 shrink-0 flex items-center justify-center bg-theme-bg-secondary">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-theme-text-tertiary/30">
                      <rect x="2" y="4" width="20" height="16" rx="1" /><line x1="6" y1="8" x2="6" y2="16" /><line x1="9" y1="8" x2="9" y2="16" strokeWidth="1" /><line x1="11" y1="8" x2="11" y2="16" /><line x1="14" y1="8" x2="14" y2="16" strokeWidth="1" /><line x1="16" y1="8" x2="16" y2="16" /><line x1="18" y1="8" x2="18" y2="16" strokeWidth="1" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-theme-text-primary leading-tight">{foundFood.name}</div>
                  {foundFood.brand && <div className="text-[11px] text-theme-text-tertiary mt-0.5">{foundFood.brand}</div>}
                  {foundFood.serving_size && <div className="text-[10px] text-theme-text-tertiary/60 mt-1">Per serving: {foundFood.serving_size}</div>}
                </div>
              </div>

              {/* Macro grid */}
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {[
                  { label: 'Cal', val: foundFood.calories, unit: '' },
                  { label: 'Protein', val: foundFood.macros.protein, unit: 'g' },
                  { label: 'Carbs', val: foundFood.macros.carbs, unit: 'g' },
                  { label: 'Fat', val: foundFood.macros.fat, unit: 'g' },
                ].map(m => (
                  <div key={m.label} className="border border-theme-text-primary/10 bg-theme-bg-secondary/50 px-2 py-2">
                    <div className="text-[9px] uppercase tracking-widest text-theme-text-tertiary/60">{m.label}</div>
                    <div className="text-base font-bold tabular-nums leading-tight mt-0.5">{m.val}<span className="text-[10px] text-theme-text-tertiary">{m.unit}</span></div>
                  </div>
                ))}
              </div>

              {/* Secondary macros */}
              {(foundFood.macros.fiber > 0 || foundFood.macros.sugar > 0 || foundFood.macros.sodium > 0) && (
                <div className="flex gap-3 text-[10px] text-theme-text-tertiary tabular-nums">
                  {foundFood.macros.fiber > 0 && <span>Fiber: <b>{foundFood.macros.fiber}g</b></span>}
                  {foundFood.macros.sugar > 0 && <span>Sugar: <b>{foundFood.macros.sugar}g</b></span>}
                  {foundFood.macros.sodium > 0 && <span>Sodium: <b>{foundFood.macros.sodium}mg</b></span>}
                </div>
              )}

              {scannedCode && (
                <div className="text-[9px] font-mono text-theme-text-tertiary/40">Barcode: {scannedCode}</div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button onClick={handleAddFood}
                  className="flex-1 px-3 py-2.5 border border-theme-text-primary bg-theme-text-primary text-theme-bg-primary text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">
                  Add to Log
                </button>
                <button onClick={reset}
                  className="px-3 py-2.5 border border-theme-text-primary/30 text-theme-text-tertiary text-xs hover:text-theme-text-primary hover:border-theme-text-primary/60 transition-colors">
                  Scan Another
                </button>
              </div>
              <button
                onClick={saveAsCustomFood}
                disabled={savedAsCustom}
                className={`w-full mt-1.5 py-1.5 border text-[10px] uppercase tracking-widest font-bold transition-colors ${
                  savedAsCustom
                    ? 'border-green-500/30 text-green-500/60 cursor-default'
                    : 'border-theme-text-primary/15 text-theme-text-tertiary/60 hover:text-theme-text-primary hover:border-theme-text-primary/30'
                }`}>
                {savedAsCustom ? '✓ Saved to custom foods' : 'Save as custom food'}
              </button>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="border border-red-500/30 bg-red-500/5 px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-red-500/80 mb-1">Not Found</div>
                <div className="text-xs text-theme-text-tertiary">{error}</div>
                {scannedCode && <div className="text-[9px] font-mono text-theme-text-tertiary/50 mt-1">Barcode: {scannedCode}</div>}
              </div>
              <div className="flex gap-2">
                <button onClick={reset}
                  className="flex-1 px-3 py-2 border border-theme-text-primary text-theme-text-primary text-xs font-bold uppercase tracking-wider hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors">
                  Scan Again
                </button>
                <button onClick={() => { setStatus('manual'); setError(''); setManualCode(scannedCode); }}
                  className="flex-1 px-3 py-2 border border-theme-text-primary/30 text-theme-text-tertiary text-xs hover:text-theme-text-primary transition-colors">
                  Edit Manually
                </button>
              </div>
            </div>
          )}

        </div>

        <div className="px-4 py-2 border-t border-theme-text-primary/10 flex items-center justify-between">
          <span className="text-[9px] text-theme-text-tertiary/40">Powered by OpenFoodFacts</span>
          {status === 'scanning' && (
            <span className="text-[9px] text-yellow-500/60 animate-pulse">Scanning...</span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { transform: translateY(-28px); opacity: 0.4; }
          50% { transform: translateY(28px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
