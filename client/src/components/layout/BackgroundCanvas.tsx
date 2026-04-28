import { useRef, useEffect, useCallback } from 'react';
import { ParticleSystem } from '@/lib/particleSystem';
import { useMixerStore } from '@/hooks/useSoundMixer';
import { getSoundById } from '@/constants/sounds';

interface GradientBlob {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  color: string;
  speed: number;
}

const DEFAULT_COLORS = ['#4f46e5', '#7c3aed', '#0891b2', '#059669'];

export function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystem = useRef(new ParticleSystem());
  const blobsRef = useRef<GradientBlob[]>([]);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const getActiveColors = useCallback(() => {
    const activeSounds = useMixerStore.getState().activeSounds;
    const ids = Object.keys(activeSounds);
    if (ids.length === 0) return DEFAULT_COLORS;
    const colors: string[] = [];
    for (const id of ids) {
      const def = getSoundById(id);
      if (def) {
        colors.push(def.color, def.gradientFrom, def.gradientTo);
      }
    }
    return colors.length > 0 ? colors : DEFAULT_COLORS;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ps = particleSystem.current;
    const reduced = prefersReducedMotion.current;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      canvas!.style.width = `${window.innerWidth}px`;
      canvas!.style.height = `${window.innerHeight}px`;
      ctx!.scale(dpr, dpr);
      ps.resize(window.innerWidth, window.innerHeight);
    }

    resize();
    window.addEventListener('resize', resize);

    // Initialize blobs
    blobsRef.current = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      targetX: Math.random() * window.innerWidth,
      targetY: Math.random() * window.innerHeight,
      radius: 200 + Math.random() * 300,
      color: DEFAULT_COLORS[i % DEFAULT_COLORS.length]!,
      speed: 0.3 + Math.random() * 0.4,
    }));

    let frameCount = 0;

    function animate(time: number) {
      frameCount++;
      // Run at ~30fps
      if (frameCount % 2 !== 0) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx!.clearRect(0, 0, w, h);

      // Draw background gradient
      const bgGrad = ctx!.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#0a0e1a');
      bgGrad.addColorStop(1, '#1a1040');
      ctx!.fillStyle = bgGrad;
      ctx!.fillRect(0, 0, w, h);

      const colors = getActiveColors();
      const blobs = blobsRef.current;

      // Update blob colors to match active sounds
      for (let i = 0; i < blobs.length; i++) {
        const blob = blobs[i]!;
        blob.color = colors[i % colors.length]!;
      }

      if (!reduced) {
        // Update + draw blobs
        ctx!.globalCompositeOperation = 'lighter';
        for (const blob of blobs) {
          const dx = blob.targetX - blob.x;
          const dy = blob.targetY - blob.y;
          blob.x += dx * blob.speed * dt;
          blob.y += dy * blob.speed * dt;

          if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
            blob.targetX = Math.random() * w;
            blob.targetY = Math.random() * h;
          }

          const gradient = ctx!.createRadialGradient(
            blob.x, blob.y, 0,
            blob.x, blob.y, blob.radius
          );
          gradient.addColorStop(0, blob.color + '18');
          gradient.addColorStop(0.5, blob.color + '08');
          gradient.addColorStop(1, 'transparent');
          ctx!.fillStyle = gradient;
          ctx!.fillRect(blob.x - blob.radius, blob.y - blob.radius, blob.radius * 2, blob.radius * 2);
        }
        ctx!.globalCompositeOperation = 'source-over';

        // Particles
        const particleColors = colors.map(c => c + '60');
        ps.update(dt, particleColors);
        ps.render(ctx!);
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [getActiveColors]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
