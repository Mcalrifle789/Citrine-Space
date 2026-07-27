// Citrine Space — provider client. Lists models (newest→oldest, with pricing) and
// streams chat completions across three API shapes: OpenAI-compatible, Anthropic, Google.
// Uses global fetch (Node 18+). Plain ESM, shared by the gateway and the CLI.

import { priceFor } from './pricing.mjs';

/** @typedef {{id:string,name:string,kind:'openai'|'anthropic'|'google',baseUrl:string,key:string}} ProviderCfg */

const UA = 'CitrineSpace/1.0';

function authHeaders(cfg) {
  if (cfg.kind === 'anthropic') {
    return { 'x-api-key': cfg.key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' };
  }
  // openai-compatible (google uses query param, handled separately)
  const h = { authorization: `Bearer ${cfg.key}`, 'content-type': 'application/json', 'user-agent': UA };
  if (cfg.id === 'openrouter') {
    h['http-referer'] = 'https://github.com/Mcalrifle789/Citrine-Space';
    h['x-title'] = 'Citrine Space';
  }
  return h;
}

/**
 * List models for a provider, newest first, with pricing resolved.
 * @param {ProviderCfg} cfg
 * @returns {Promise<Array<{id:string,label:string,created:number|null,price:{input:number|null,output:number|null,source:string}}>>}
 */
export async function listModels(cfg) {
  if (cfg.kind === 'anthropic') return listAnthropic(cfg);
  if (cfg.kind === 'google') return listGoogle(cfg);
  return listOpenAI(cfg);
}

async function listOpenAI(cfg) {
  const res = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/models`, { headers: authHeaders(cfg) });
  if (!res.ok) throw new Error(`${cfg.name}: models request failed (${res.status} ${await safeText(res)})`);
  const json = await res.json();
  const data = json.data || json.models || [];
  const out = data.map((m) => {
    // OpenRouter (and some routers) return per-token pricing as strings.
    let live;
    if (m.pricing && (m.pricing.prompt != null || m.pricing.completion != null)) {
      live = {
        input: m.pricing.prompt != null ? Number(m.pricing.prompt) * 1e6 : null,
        output: m.pricing.completion != null ? Number(m.pricing.completion) * 1e6 : null,
      };
    }
    return {
      id: m.id,
      label: m.name || m.id,
      created: typeof m.created === 'number' ? m.created : null,
      price: priceFor(m.id, live),
    };
  });
  return sortNewest(out);
}

async function listAnthropic(cfg) {
  const res = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/models?limit=1000`, { headers: authHeaders(cfg) });
  if (!res.ok) throw new Error(`Anthropic: models request failed (${res.status} ${await safeText(res)})`);
  const json = await res.json();
  const out = (json.data || []).map((m) => ({
    id: m.id,
    label: m.display_name || m.id,
    created: m.created_at ? Math.floor(new Date(m.created_at).getTime() / 1000) : null,
    price: priceFor(m.id),
  }));
  return sortNewest(out);
}

async function listGoogle(cfg) {
  const base = cfg.baseUrl.replace(/\/$/, '');
  const res = await fetch(`${base}/v1beta/models?pageSize=1000&key=${encodeURIComponent(cfg.key)}`, {
    headers: { 'user-agent': UA },
  });
  if (!res.ok) throw new Error(`Google: models request failed (${res.status} ${await safeText(res)})`);
  const json = await res.json();
  const out = (json.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).some((x) => x.includes('generateContent')))
    .map((m) => {
      const id = String(m.name || '').replace(/^models\//, '');
      return { id, label: m.displayName || id, created: null, price: priceFor(id) };
    });
  // Google gives no timestamps; version-sort so newer families float up.
  return out.sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }));
}

function sortNewest(list) {
  return list.sort((a, b) => {
    if (a.created != null && b.created != null) return b.created - a.created;
    if (a.created != null) return -1;
    if (b.created != null) return 1;
    return b.id.localeCompare(a.id, undefined, { numeric: true });
  });
}

/**
 * Stream a chat completion. Calls onDelta(textChunk) for each token.
 * @param {ProviderCfg} cfg
 * @param {{model:string, messages:Array<{role:string,content:string}>, signal?:AbortSignal, maxTokens?:number}} req
 * @param {(chunk:string)=>void} onDelta
 * @returns {Promise<{text:string}>}
 */
export async function streamChat(cfg, req, onDelta) {
  if (cfg.kind === 'anthropic') return streamAnthropic(cfg, req, onDelta);
  if (cfg.kind === 'google') return streamGoogle(cfg, req, onDelta);
  return streamOpenAI(cfg, req, onDelta);
}

async function streamOpenAI(cfg, req, onDelta) {
  const res = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: authHeaders(cfg),
    signal: req.signal,
    body: JSON.stringify({ model: req.model, messages: req.messages, stream: true }),
  });
  if (!res.ok || !res.body) throw new Error(`${cfg.name}: chat failed (${res.status} ${await safeText(res)})`);
  let text = '';
  await readSSE(res.body, (data) => {
    if (data === '[DONE]') return;
    try {
      const j = JSON.parse(data);
      const delta = j.choices?.[0]?.delta?.content;
      if (delta) { text += delta; onDelta(delta); }
    } catch { /* keepalive / partial */ }
  });
  return { text };
}

async function streamAnthropic(cfg, req, onDelta) {
  const system = req.messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const messages = req.messages.filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));
  const res = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/messages`, {
    method: 'POST',
    headers: authHeaders(cfg),
    signal: req.signal,
    body: JSON.stringify({ model: req.model, max_tokens: req.maxTokens || 4096, system: system || undefined, messages, stream: true }),
  });
  if (!res.ok || !res.body) throw new Error(`Anthropic: chat failed (${res.status} ${await safeText(res)})`);
  let text = '';
  await readSSE(res.body, (data) => {
    try {
      const j = JSON.parse(data);
      if (j.type === 'content_block_delta' && j.delta?.text) { text += j.delta.text; onDelta(j.delta.text); }
    } catch { /* ignore */ }
  });
  return { text };
}

async function streamGoogle(cfg, req, onDelta) {
  const base = cfg.baseUrl.replace(/\/$/, '');
  const system = req.messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const contents = req.messages.filter((m) => m.role !== 'system').map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const body = { contents };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  const url = `${base}/v1beta/models/${encodeURIComponent(req.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(cfg.key)}`;
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, signal: req.signal, body: JSON.stringify(body) });
  if (!res.ok || !res.body) throw new Error(`Google: chat failed (${res.status} ${await safeText(res)})`);
  let text = '';
  await readSSE(res.body, (data) => {
    try {
      const j = JSON.parse(data);
      const t = j.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
      if (t) { text += t; onDelta(t); }
    } catch { /* ignore */ }
  });
  return { text };
}

/** Read an SSE stream, invoking cb(dataString) for each `data:` payload. */
async function readSSE(body, cb) {
  const decoder = new TextDecoder();
  let buf = '';
  for await (const chunk of body) {
    buf += decoder.decode(chunk, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx).replace(/\r$/, '');
      buf = buf.slice(idx + 1);
      if (line.startsWith('data:')) cb(line.slice(5).trim());
    }
  }
  if (buf.startsWith('data:')) cb(buf.slice(5).trim());
}

async function safeText(res) {
  try { return (await res.text()).slice(0, 300); } catch { return ''; }
}

/**
 * Custom / router detection: given a key + base URL, try to list models so the app
 * can show real model names. Returns the model list or throws with a helpful message.
 * @param {{baseUrl:string, key:string}} arg
 */
export async function detectCustomProvider({ baseUrl, key }) {
  if (!baseUrl) throw new Error('A base URL is required for a custom provider.');
  const cfg = { id: 'custom', name: 'Custom', kind: 'openai', baseUrl, key };
  const models = await listModels(cfg);
  return { count: models.length, models: models.slice(0, 25).map((m) => m.id) };
}
