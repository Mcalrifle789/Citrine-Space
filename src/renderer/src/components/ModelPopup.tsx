import { useEffect, useMemo, useState } from 'react';
import { Modal } from './Modal';
import { api, type ModelGroup } from '../lib/api';

const fmt = (n: number | null) => (n == null ? '—' : n === 0 ? 'free' : '$' + (n < 1 ? n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') : n.toFixed(2)));

// /model — every model from every connected provider, newest first, with pricing.
export function ModelPopup({
  active, onPick, onClose,
}: { active: { provider: string; model: string } | null; onPick: (provider: string, model: string) => void; onClose: () => void }) {
  const [groups, setGroups] = useState<ModelGroup[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.allModels()
      .then((r) => { if (alive) { setGroups(r.groups); setErrors(r.errors); } })
      .catch((e) => alive && setErrors([String(e.message)]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return groups
      .map((g) => ({ ...g, models: g.models.filter((m) => m.id.toLowerCase().includes(needle) || g.name.toLowerCase().includes(needle)) }))
      .filter((g) => g.models.length);
  }, [groups, q]);

  return (
    <Modal title="/model" sub="Pick the active model · price per 1M tokens (in / out)" onClose={onClose}>
      <input className="search" autoFocus placeholder="Filter models…" value={q} onChange={(e) => setQ(e.target.value)} />
      {loading && <div className="note">Loading models from your providers…</div>}
      {errors.length > 0 && <div className="note" style={{ color: 'var(--text-dim)' }}>Some providers didn’t respond: {errors.join(' · ')}</div>}
      {filtered.map((g) => (
        <div key={g.provider} style={{ marginBottom: 14 }}>
          <div className="meta" style={{ textTransform: 'uppercase', letterSpacing: 1, margin: '6px 4px', color: 'var(--accent)' }}>
            {g.name} <span style={{ color: 'var(--text-dim)' }}>· {g.models.length}</span>
          </div>
          <div className="rowlist">
            {g.models.slice(0, 200).map((m) => {
              const on = active?.provider === g.provider && active?.model === m.id;
              return (
                <div key={m.id} className={`row ${on ? 'focus' : ''}`} onClick={() => onPick(g.provider, m.id)}>
                  <span className="check">{on ? '◆' : ''}</span>
                  <span className="name">{m.id}</span>
                  <span className="price">{fmt(m.price.input)} / {fmt(m.price.output)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {!loading && filtered.length === 0 && <div className="note">No models match “{q}”.</div>}
    </Modal>
  );
}
