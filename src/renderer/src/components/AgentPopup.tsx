import { useState } from 'react';
import { Modal } from './Modal';
import { api } from '../lib/api';
import { MagneticButton } from './MagneticButton';

export interface Agent { id: string; name: string; description: string; model?: string; provider?: string; }

// /agent-x — select multiple agents to collaborate. Also creates new agents.
export function AgentPopup({
  agents, selected, active, onToggle, onCreated, onClose,
}: {
  agents: Agent[]; selected: Set<string>; active: { provider: string; model: string } | null;
  onToggle: (id: string) => void; onCreated: () => void; onClose: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.createAgent({ name: name.trim(), description: desc.trim(), model: active?.model, provider: active?.provider });
      setName(''); setDesc(''); setCreating(false); onCreated();
    } finally { setBusy(false); }
  }

  return (
    <Modal
      title="/agent-x"
      sub="Select agents to collaborate — they’ll talk to each other to finish the task"
      onClose={onClose}
      footer={creating
        ? <>
            <MagneticButton className="icon" strength={0.25} onClick={() => setCreating(false)}>Cancel</MagneticButton>
            <MagneticButton className="primary" strength={0.25} onClick={create}>{busy ? 'Building…' : 'Create agent'}</MagneticButton>
          </>
        : <MagneticButton className="primary" strength={0.25} onClick={() => setCreating(true)}>+ New agent</MagneticButton>}
    >
      {!creating && (
        <div className="rowlist">
          {agents.length === 0 && <div className="note">No agents yet. Create one to get started.</div>}
          {agents.map((a) => {
            const on = selected.has(a.id);
            return (
              <div key={a.id} className={`row ${on ? 'focus' : ''}`} onClick={() => onToggle(a.id)}>
                <span className="check">{on ? '◉' : '◯'}</span>
                <span className="name">{a.name}<div className="meta">{a.description || 'No description'}</div></span>
                <span className="meta">{a.model || 'default model'}</span>
              </div>
            );
          })}
        </div>
      )}
      {creating && (
        <div>
          <div className="field">
            <label>Agent name</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Researcher" />
          </div>
          <div className="field">
            <label>What does it do?</label>
            <textarea rows={4} value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe the agent’s job. Your chosen model will use this to build it." />
          </div>
          <p className="note">On creation the agent is built by your active model{active ? ` (${active.model})` : ''} and saved to your config. In a later pass each agent opens in its own runner window.</p>
        </div>
      )}
    </Modal>
  );
}
