import { useState, useRef, useCallback, useEffect } from 'react';

// Barcode Scanner component using native BarcodeDetector API + OpenFoodFacts
export default function BarcodeScanner({ onFoodFound, onClose }) {
  const [status, setStatus] = useState('idle'); // idle | scanning | loading | found | error | manual
  const [error, setError] = useState('');
  const [foundFood, setFoundFood] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanningRef = useRef(false);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const lookupBarcode = useCallback(async (code) => {
    setStatus('loading');
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
      if (!res.ok) throw new Error('Product not found');
      const data = await res.json();
      if (data.status !== 1 || !data.product) {
        setStatus('error');
        setError(`No product found for barcode: ${code}`);
        return;
      }
      const p = data.product;
      const n = p.nutriments || {};
      const food = {
        id: `barcode-${code}`,
        name: p.product_name || p.product_name_en || 'Unknown Product',
        calories: Math.round(n['energy-kcal_serving'] || n['energy-kcal_100g'] || 0),
        macros: {
          protein: parseFloat(n.proteins_serving || n.proteins_100g || 0).toFixed(1),
          carbs: parseFloat(n.carbohydrates_serving || n.carbohydrates_100g || 0).toFixed(1),
          fat: parseFloat(n.fat_serving || n.fat_100g || 0).toFixed(1),
          fats: parseFloat(n.fat_serving || n.fat_100g || 0).toFixed(1),
          fiber: parseFloat(n.fiber_serving || n.fiber_100g || 0).toFixed(1),
          sugar: parseFloat(n.sugars_serving || n.sugars_100g || 0).toFixed(1),
          sodium: parseFloat(((n.sodium_serving || n.sodium_100g || 0) * 1000).toFixed(1)),
          saturated_fat: parseFloat(n['saturated-fat_serving'] || n['saturated-fat_100g'] || 0).toFixed(1),
          cholesterol: parseFloat(((n.cholesterol_serving || n.cholesterol_100g || 0) * 1000).toFixed(1)),
        },
        serving_size: p.serving_size || '',
        brand: p.brands || '',
        barcode: code,
        image: p.image_small_url || p.image_url || '',
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

    // Check for BarcodeDetector support
    if (!('BarcodeDetector' in window)) {
      setStatus('manual');
      setError('Camera barcode scanning is not supported in this browser. Enter the barcode manually.');
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
      setStatus('manual');
      setError('Camera access denied. Enter the barcode manually.');
    }
  }, [stopCamera, lookupBarcode]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      lookupBarcode(manualCode.trim());
    }
  };

  const handleAddFood = () => {
    if (foundFood && onFoodFound) {
      onFoodFound(foundFood);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-theme-bg-primary border border-theme-text-primary/20 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-theme-text-primary/10">
          <span className="text-sm font-bold tracking-wide text-theme-text-primary">Barcode Scanner</span>
          <button onClick={onClose} className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {/* Idle state */}
          {status === 'idle' && (
            <div className="text-center space-y-4">
              <div className="text-theme-text-tertiary text-xs">
                Scan a barcode to look up nutrition info from OpenFoodFacts
              </div>
              <button onClick={startScanning}
                className="px-4 py-2 bg-theme-text-primary text-theme-bg-primary text-xs font-bold tracking-wide hover:opacity-80 transition-opacity">
                Start Scanning
              </button>
              <div className="text-theme-text-tertiary text-[10px]">— or —</div>
              <button onClick={() => setStatus('manual')}
                className="text-xs text-theme-text-tertiary hover:text-theme-text-primary transition-colors underline">
                Enter barcode manually
              </button>
            </div>
          )}

          {/* Scanning state */}
          {status === 'scanning' && (
            <div className="space-y-3">
              <div className="relative bg-black aspect-video">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-32 border-2 border-white/50" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)' }} />
                </div>
              </div>
              <div className="text-center text-xs text-theme-text-tertiary">
                Point camera at a barcode
              </div>
              <div className="flex gap-2 justify-center">
                <button onClick={() => { stopCamera(); setStatus('manual'); }}
                  className="text-xs text-theme-text-tertiary hover:text-theme-text-primary transition-colors underline">
                  Enter manually instead
                </button>
              </div>
            </div>
          )}

          {/* Manual entry */}
          {status === 'manual' && (
            <div className="space-y-3">
              {error && <div className="text-[10px] text-theme-text-tertiary">{error}</div>}
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  placeholder="Enter barcode number..."
                  className="flex-1 px-3 py-2 bg-theme-bg-secondary border border-theme-text-primary/20 text-theme-text-primary text-xs font-mono focus:outline-none focus:border-theme-text-primary/40"
                  autoFocus
                />
                <button type="submit"
                  className="px-3 py-2 bg-theme-text-primary text-theme-bg-primary text-xs font-bold tracking-wide hover:opacity-80 transition-opacity">
                  Look Up
                </button>
              </form>
            </div>
          )}

          {/* Loading */}
          {status === 'loading' && (
            <div className="text-center py-8">
              <div className="text-xs text-theme-text-tertiary animate-pulse">Looking up product...</div>
            </div>
          )}

          {/* Found */}
          {status === 'found' && foundFood && (
            <div className="space-y-3">
              <div className="flex gap-3">
                {foundFood.image && (
                  <img src={foundFood.image} alt="" className="w-16 h-16 object-contain border border-theme-text-primary/10" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-theme-text-primary">{foundFood.name}</div>
                  {foundFood.brand && <div className="text-[10px] text-theme-text-tertiary">{foundFood.brand}</div>}
                  {foundFood.serving_size && <div className="text-[10px] text-theme-text-tertiary">Serving: {foundFood.serving_size}</div>}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-theme-bg-secondary p-2">
                  <div className="text-xs font-bold text-theme-text-primary tabular-nums">{foundFood.calories}</div>
                  <div className="text-[9px] text-theme-text-tertiary">cal</div>
                </div>
                <div className="bg-theme-bg-secondary p-2">
                  <div className="text-xs font-bold text-theme-text-primary tabular-nums">{foundFood.macros.protein}g</div>
                  <div className="text-[9px] text-theme-text-tertiary">protein</div>
                </div>
                <div className="bg-theme-bg-secondary p-2">
                  <div className="text-xs font-bold text-theme-text-primary tabular-nums">{foundFood.macros.carbs}g</div>
                  <div className="text-[9px] text-theme-text-tertiary">carbs</div>
                </div>
                <div className="bg-theme-bg-secondary p-2">
                  <div className="text-xs font-bold text-theme-text-primary tabular-nums">{foundFood.macros.fat}g</div>
                  <div className="text-[9px] text-theme-text-tertiary">fat</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddFood}
                  className="flex-1 px-3 py-2 bg-theme-text-primary text-theme-bg-primary text-xs font-bold tracking-wide hover:opacity-80 transition-opacity">
                  Add to Log
                </button>
                <button onClick={() => { setStatus('idle'); setFoundFood(null); }}
                  className="px-3 py-2 border border-theme-text-primary/20 text-theme-text-tertiary text-xs hover:text-theme-text-primary transition-colors">
                  Scan Another
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="text-center space-y-3">
              <div className="text-xs text-red-500">{error}</div>
              <div className="flex gap-2 justify-center">
                <button onClick={() => { setStatus('idle'); setError(''); }}
                  className="px-3 py-2 border border-theme-text-primary/20 text-theme-text-tertiary text-xs hover:text-theme-text-primary transition-colors">
                  Try Again
                </button>
                <button onClick={() => { setStatus('manual'); setError(''); }}
                  className="px-3 py-2 border border-theme-text-primary/20 text-theme-text-tertiary text-xs hover:text-theme-text-primary transition-colors">
                  Enter Manually
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-theme-text-primary/10 text-[9px] text-theme-text-tertiary text-center">
          Powered by OpenFoodFacts · Data may vary
        </div>
      </div>
    </div>
  );
}
