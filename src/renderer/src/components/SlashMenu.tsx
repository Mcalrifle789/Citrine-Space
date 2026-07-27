import { useEffect, useRef } from 'react';
import type { Command } from '../commands';

// Floating command palette shown while the input starts with '/'. Presentational:
// the parent owns filtering + keyboard nav and passes the active index.
export function SlashMenu({
  commands, activeIndex, onPick,
}: { commands: Command[]; activeIndex: number; onPick: (c: Command) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.querySelector('.row.focus')?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (commands.length === 0) return null;
  return (
    <div ref={ref} className="modal" style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, right: 0, width: 'auto', maxHeight: 300 }}>
      <div className="content" style={{ padding: 6 }}>
        <div className="rowlist">
          {commands.map((c, i) => (
            <div key={c.name} className={`row ${i === activeIndex ? 'focus' : ''}`} onMouseDown={(e) => { e.preventDefault(); onPick(c); }}>
              <span className="name" style={{ color: 'var(--accent)' }}>{c.name}{c.args ? ` ${c.args}` : ''}</span>
              <span className="meta">{c.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
