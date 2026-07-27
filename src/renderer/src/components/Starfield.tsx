import { useEffect, useRef } from 'react';

// Lightweight animated starfield. Only paints when the active theme opts in
// (documentElement.dataset.starfield === 'true'); otherwise it clears itself.
export function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    let stars: { x: number; y: number; z: number; r: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      const count = Math.floor((window.innerWidth * window.innerHeight) / 5200);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 0.8 + 0.2,
        r: Math.random() * 1.4 + 0.2,
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    const tick = () => {
      const on = document.documentElement.dataset.starfield === 'true';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (on) {
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3fb6ff';
        for (const s of stars) {
          s.y += s.z * 0.12 * devicePixelRatio;
          if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
          const twinkle = 0.35 + Math.abs(Math.sin((Date.now() / 900) * s.z)) * 0.5;
          ctx.globalAlpha = twinkle * s.z;
          ctx.fillStyle = s.r > 1.1 ? accent : '#ffffff';
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * s.z * devicePixelRatio, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas id="starfield" ref={ref} />;
}
