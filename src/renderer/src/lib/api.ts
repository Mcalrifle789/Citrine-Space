// Citrine Space — renderer-side gateway client. Talks to the loopback gateway using
// the port + bearer token handed over by the preload bridge. Keys never live here.

export interface ModelInfo {
  id: string;
  label: string;
  created: number | null;
  price: { input: number | null; output: number | null; source: string };
}
export interface ModelGroup { provider: string; name: string; models: ModelInfo[]; }
export interface AppConfig {
  account: { username: string } | null;
  providers: Record<string, { id: string; name: string; kind: string; baseUrl: string; enabled: boolean; hasKey: boolean }>;
  search: Record<string, { id: string; name: string; connected: boolean }>;
  audio: Record<string, { id: string; name: string; connected: boolean }>;
  appMcps: Record<string, { id: string; name: string; connected: boolean }>;
  agents: Array<{ id: string; name: string; description: string; model?: string; provider?: string }>;
  settings: { theme?: string; activeModel?: { provider: string; model: string } | null; backgroundsPlus?: boolean };
}
export interface ChatMsg { role: 'system' | 'user' | 'assistant'; content: string; }

let base = '';
let token = '';

export async function initApi(): Promise<{ ok: boolean; version?: string }> {
  const boot = await window.citrine.bootstrap();
  if (!boot.port || !boot.token) return { ok: false };
  base = `http://127.0.0.1:${boot.port}`;
  token = boot.token;
  return { ok: true, version: boot.version };
}

function headers(): Record<string, string> {
  return { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
}

async function getJSON<T>(path: string): Promise<T> {
  const r = await fetch(base + path, { headers: headers() });
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json();
}
async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(base + path, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json();
}

export const api = {
  config: () => getJSON<AppConfig>('/api/config'),
  catalog: () => getJSON<any>('/api/catalog'),
  models: (provider: string) => getJSON<{ provider: string; models: ModelInfo[] }>(`/api/models?provider=${encodeURIComponent(provider)}`),
  allModels: () => getJSON<{ groups: ModelGroup[]; errors: string[] }>('/api/models/all'),
  saveSettings: (patch: Record<string, unknown>) => postJSON<any>('/api/settings', patch),
  createAgent: (a: { name: string; description: string; model?: string; provider?: string }) => postJSON<any>('/api/agents', a),
  connectMcp: (id: string, key?: string) => postJSON<any>('/api/mcp/connect', { id, key }),

  /** Stream a chat completion; calls handlers as SSE events arrive. */
  async chat(
    req: { provider: string; model: string; messages: ChatMsg[] },
    on: { delta: (t: string) => void; done: () => void; error: (m: string) => void },
    signal?: AbortSignal,
  ): Promise<void> {
    const r = await fetch(base + '/api/chat', { method: 'POST', headers: headers(), body: JSON.stringify(req), signal });
    if (!r.ok || !r.body) { on.error(`chat → ${r.status}`); return; }
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const frames = buf.split('\n\n');
      buf = frames.pop() || '';
      for (const frame of frames) {
        const evLine = frame.split('\n').find((l) => l.startsWith('event:'));
        const dataLine = frame.split('\n').find((l) => l.startsWith('data:'));
        if (!evLine || !dataLine) continue;
        const ev = evLine.slice(6).trim();
        const data = JSON.parse(dataLine.slice(5).trim());
        if (ev === 'delta') on.delta(data.text);
        else if (ev === 'done') on.done();
        else if (ev === 'error') on.error(data.message);
      }
    }
  },
};
