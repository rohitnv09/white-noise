import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioEngine } from '@/context/AudioContext';
import { useMixerStore } from '@/hooks/useSoundMixer';

const RGB_COLORS = [
  [139, 92, 246],   // violet
  [99, 102, 241],   // indigo
  [6, 182, 212],    // cyan
  [16, 185, 129],   // emerald
  [245, 158, 11],   // amber
  [244, 63, 94],    // rose
  [168, 85, 247],   // purple
] as const;

function hueShift(time: number): number {
  return (time * 0.06) % 1;
}

function lerpColor(a: readonly number[], b: readonly number[], t: number): [number, number, number] {
  return [
    Math.round(a[0]! + (b[0]! - a[0]!) * t),
    Math.round(a[1]! + (b[1]! - a[1]!) * t),
    Math.round(a[2]! + (b[2]! - a[2]!) * t),
  ];
}

function getColorAtPosition(position: number, timeOffset: number): [number, number, number] {
  const shifted = (position + timeOffset) % 1;
  const segment = shifted * (RGB_COLORS.length - 1);
  const index = Math.floor(segment);
  const t = segment - index;
  const a = RGB_COLORS[index] ?? RGB_COLORS[0]!;
  const b = RGB_COLORS[Math.min(index + 1, RGB_COLORS.length - 1)] ?? RGB_COLORS[0]!;
  return lerpColor(a, b, t);
}

const BAND_COUNT = 16;

export function MixerVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engine = useAudioEngine();
  const hasActiveSounds = useMixerStore(s => Object.keys(s.activeSounds).length > 0);
  const smoothedRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (!hasActiveSounds) {
      smoothedRef.current = null;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const canvasEl = canvas;
    const canvasCtx = ctx;

    if (!smoothedRef.current) {
      smoothedRef.current = new Float32Array(BAND_COUNT);
    }
    const smoothed = smoothedRef.current;

    let raf: number;
    const startTime = performance.now();

    function draw() {
      const elapsed = (performance.now() - startTime) / 1000;
      const width = canvasEl.offsetWidth;
      const height = canvasEl.offsetHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvasEl.width = width * dpr;
      canvasEl.height = height * dpr;
      canvasCtx.scale(dpr, dpr);
      canvasCtx.clearRect(0, 0, width, height);

      const data = engine.getAnalyserData();
      if (data.length === 0) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const binCount = data.length;
      const maxBin = Math.floor(binCount * 0.55);
      const timeShift = hueShift(elapsed);

      // Sample frequency data into bands with smoothing
      for (let i = 0; i < BAND_COUNT; i++) {
        const t = i / (BAND_COUNT - 1);
        const bin = Math.min(Math.floor(Math.pow(t, 1.4) * maxBin), binCount - 1);
        const prev = data[Math.max(bin - 1, 0)] ?? 0;
        const curr = data[bin] ?? 0;
        const next = data[Math.min(bin + 1, binCount - 1)] ?? 0;
        const raw = (prev * 0.2 + curr * 0.6 + next * 0.2) / 255;
        const target = raw * raw;
        // Fast attack, slow release for organic movement
        const current = smoothed[i] ?? 0;
        const speed = target > current ? 0.3 : 0.08;
        smoothed[i] = current + (target - current) * speed;
      }

      // Average energy
      let totalEnergy = 0;
      for (let i = 0; i < BAND_COUNT; i++) totalEnergy += smoothed[i] ?? 0;
      const avgEnergy = totalEnergy / BAND_COUNT;

      // Additive blending for natural RGB color mixing
      canvasCtx.globalCompositeOperation = 'lighter';

      // ── BOTTOM EDGE ──────────────────────────────

      // Soft ambient wash across bottom
      {
        const washH = 240 + avgEnergy * 400;
        const grad = canvasCtx.createLinearGradient(0, height, 0, height - washH);
        const [r, g, b] = getColorAtPosition(0.5, timeShift);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.05 + avgEnergy * 0.1})`);
        grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${avgEnergy * 0.04})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        canvasCtx.fillStyle = grad;
        canvasCtx.fillRect(0, height - washH, width, washH);
      }

      // Frequency-reactive glow blobs along bottom
      for (let i = 0; i < BAND_COUNT; i++) {
        const t = i / (BAND_COUNT - 1);
        const x = t * width;
        const val = smoothed[i] ?? 0;
        const [r, g, b] = getColorAtPosition(t, timeShift);

        const radius = 90 + val * 240;
        const grad = canvasCtx.createRadialGradient(x, height + 15, 0, x, height + 15, radius);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.2 + val * 0.55})`);
        grad.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${0.06 + val * 0.2})`);
        grad.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, ${val * 0.04})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        canvasCtx.fillStyle = grad;
        const x0 = Math.max(0, x - radius);
        const x1 = Math.min(width, x + radius);
        canvasCtx.fillRect(x0, Math.max(0, height - radius), x1 - x0, radius + 15);
      }

      // ── LEFT EDGE ────────────────────────────────

      // Ambient wash
      {
        const washW = 120 + avgEnergy * 220;
        const grad = canvasCtx.createLinearGradient(0, 0, washW, 0);
        const [r, g, b] = getColorAtPosition(0.2, timeShift + 0.33);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.03 + avgEnergy * 0.07})`);
        grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${avgEnergy * 0.02})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        canvasCtx.fillStyle = grad;
        canvasCtx.fillRect(0, 0, washW, height);
      }

      // Glow blobs along left edge
      for (let i = 0; i < BAND_COUNT; i++) {
        const t = i / (BAND_COUNT - 1);
        const y = height - t * height;
        const val = smoothed[i] ?? 0;
        const [r, g, b] = getColorAtPosition(t, timeShift + 0.33);

        const radius = 65 + val * 180;
        const grad = canvasCtx.createRadialGradient(-12, y, 0, -12, y, radius);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.15 + val * 0.4})`);
        grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${0.04 + val * 0.12})`);
        grad.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, ${val * 0.03})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        canvasCtx.fillStyle = grad;
        const y0 = Math.max(0, y - radius);
        const y1 = Math.min(height, y + radius);
        canvasCtx.fillRect(0, y0, radius, y1 - y0);
      }

      // ── RIGHT EDGE ───────────────────────────────

      // Ambient wash
      {
        const washW = 120 + avgEnergy * 220;
        const grad = canvasCtx.createLinearGradient(width, 0, width - washW, 0);
        const [r, g, b] = getColorAtPosition(0.8, timeShift + 0.66);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.03 + avgEnergy * 0.07})`);
        grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${avgEnergy * 0.02})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        canvasCtx.fillStyle = grad;
        canvasCtx.fillRect(width - washW, 0, washW, height);
      }

      // Glow blobs along right edge
      for (let i = 0; i < BAND_COUNT; i++) {
        const t = i / (BAND_COUNT - 1);
        const y = height - t * height;
        const val = smoothed[i] ?? 0;
        const [r, g, b] = getColorAtPosition(t, timeShift + 0.66);

        const radius = 65 + val * 180;
        const grad = canvasCtx.createRadialGradient(width + 12, y, 0, width + 12, y, radius);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.15 + val * 0.4})`);
        grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${0.04 + val * 0.12})`);
        grad.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, ${val * 0.03})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        canvasCtx.fillStyle = grad;
        const y0 = Math.max(0, y - radius);
        const y1 = Math.min(height, y + radius);
        canvasCtx.fillRect(Math.max(0, width - radius), y0, radius + 12, y1 - y0);
      }

      // ── EDGE HIGHLIGHT LINES ─────────────────────
      canvasCtx.globalCompositeOperation = 'source-over';

      // Bottom edge line
      {
        const lineGrad = canvasCtx.createLinearGradient(0, 0, width, 0);
        for (let i = 0; i <= 10; i++) {
          const pos = i / 10;
          const [r, g, b] = getColorAtPosition(pos, timeShift);
          const bandIdx = Math.floor(pos * (BAND_COUNT - 1));
          const val = smoothed[bandIdx] ?? 0;
          lineGrad.addColorStop(pos, `rgba(${r}, ${g}, ${b}, ${0.25 + val * 0.55})`);
        }
        canvasCtx.fillStyle = lineGrad;
        canvasCtx.fillRect(0, height - 2, width, 2);

        // Soft glow behind the line
        canvasCtx.globalCompositeOperation = 'lighter';
        const [cr, cg, cb] = getColorAtPosition(0.5, timeShift);
        const lineGlow = canvasCtx.createLinearGradient(0, height, 0, height - 14);
        lineGlow.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${0.1 + avgEnergy * 0.15})`);
        lineGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        canvasCtx.fillStyle = lineGlow;
        canvasCtx.fillRect(0, height - 14, width, 14);
        canvasCtx.globalCompositeOperation = 'source-over';
      }

      // Left edge line
      {
        const lineGrad = canvasCtx.createLinearGradient(0, height, 0, 0);
        for (let i = 0; i <= 10; i++) {
          const pos = i / 10;
          const [r, g, b] = getColorAtPosition(pos, timeShift + 0.33);
          const bandIdx = Math.floor(pos * (BAND_COUNT - 1));
          const val = smoothed[bandIdx] ?? 0;
          lineGrad.addColorStop(pos, `rgba(${r}, ${g}, ${b}, ${0.15 + val * 0.4})`);
        }
        canvasCtx.fillStyle = lineGrad;
        canvasCtx.fillRect(0, 0, 2, height);
      }

      // Right edge line
      {
        const lineGrad = canvasCtx.createLinearGradient(0, height, 0, 0);
        for (let i = 0; i <= 10; i++) {
          const pos = i / 10;
          const [r, g, b] = getColorAtPosition(pos, timeShift + 0.66);
          const bandIdx = Math.floor(pos * (BAND_COUNT - 1));
          const val = smoothed[bandIdx] ?? 0;
          lineGrad.addColorStop(pos, `rgba(${r}, ${g}, ${b}, ${0.15 + val * 0.4})`);
        }
        canvasCtx.fillStyle = lineGrad;
        canvasCtx.fillRect(width - 2, 0, 2, height);
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [hasActiveSounds, engine]);

  return (
    <AnimatePresence>
      {hasActiveSounds && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
