import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { api } from '../lib/api';
import { MagneticButton } from './MagneticButton';

interface McpMeta { id: string; name: string; auth: 'oauth' | 'apikey'; }

// /MCP — dropdown of available app MCPs. Connecting runs the OAuth / API-key flow.
// (OAuth is stubbed for v1: we record the connection and expose it on the bookshelf.)
export function McpPopup({
  connected, onConnected, onClose,
}: { connected: Record<string, { connected: boolean }>; onConnected: () => void; onClose: () => void }) {
  const [list, setList] = useState<McpMeta[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [keyFor, setKeyFor] = useState<string | null>(null);
  const [keyVal, setKeyVal] = useState('');

  useEffect(() => { api.catalog().then((c) => setList(c.appMcps)).catch(() => {}); }, []);

  async function connect(m: McpMeta) {
    if (m.auth === 'apikey' && keyFor !== m.id) { setKeyFor(m.id); setKeyVal(''); return; }
    setBusy(m.id);
    try { await api.connectMcp(m.id, m.auth === 'apikey' ? keyVal : undefined); onConnected(); setKeyFor(null); }
    finally { setBusy(null); }
  }

  return (
    <Modal title="/MCP" sub="Connect an app so the model can use it" onClose={onClose}>
      <div className="rowlist">
        {list.map((m) => {
          const isOn = connected[m.id]?.connected;
          return (
            <div key={m.id}>
              <div className="row">
                <span className="name">{m.name}</span>
                <span className="meta">{m.auth === 'oauth' ? 'OAuth' : 'API key'}</span>
                {isOn ? <span className="price">connected ◆</span> : (
                  <MagneticButton className="icon" strength={0.25} onClick={() => connect(m)}>
                    {busy === m.id ? '…' : 'Connect'}
                  </MagneticButton>
                )}
              </div>
              {keyFor === m.id && (
                <div className="field" style={{ padding: '4px 12px 10px' }}>
                  <input autoFocus type="password" placeholder={`${m.name} API key`} value={keyVal}
                    onChange={(e) => setKeyVal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && connect(m)} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="note" style={{ marginTop: 10 }}>OAuth apps open a browser window to authorize (wired in a later pass). API-key apps connect instantly.</p>
    </Modal>
  );
}
