import { useRef, type ReactNode, type MouseEvent } from 'react';

// Button with a magnetic hover: it drifts toward the cursor and eases back on leave.
export function MagneticButton({
  children, onClick, className = '', title, strength = 0.4,
}: { children: ReactNode; onClick?: () => void; className?: string; title?: string; strength?: number }) {
  const ref = useRef<HTMLButtonElement>(null);

  const move = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) * strength;
    const dy = (e.clientY - (r.top + r.height / 2)) * strength;
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  const reset = () => { if (ref.current) ref.current.style.transform = 'translate(0,0)'; };

  return (
    <button
      ref={ref}
      title={title}
      className={`mag ${className}`}
      onMouseMove={move}
      onMouseLeave={reset}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
