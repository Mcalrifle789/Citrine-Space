// Citrine Space — local gateway. A tiny HTTP server on 127.0.0.1 that owns the config
// and secrets and proxies provider calls, so API keys never reach the renderer. Started
// by the Electron main process; `citrine space` boots the app which boots this.
//
// Security: binds to loopback only and requires a bearer token minted at startup and
// handed to the renderer through the preload bridge. No dependencies beyond node stdlib.

import http from 'node:http';
import crypto from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { loadConfig, saveConfig, decryptSecret, encryptSecret, verifyPassword } from './config.mjs';
import { PROVIDERS, SEARCH_PROVIDERS, AUDIO_MCPS, APP_MCPS, providerById } from './catalog.mjs';
import { listModels, streamChat } from './providerClient.mjs';

const json = (res, code, obj) => {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) });
  res.end(body);
};

function resolveProviderCfg(cfg, id) {
  const stored = cfg.providers?.[id];
  if (!stored) return null;
  const meta = providerById(id) || {};
  return {
    id,
    name: stored.name || meta.name || id,
    kind: stored.kind || meta.kind || 'openai',
    baseUrl: stored.baseUrl || meta.baseUrl || '',
    key: decryptSecret(stored.key),
  };
}

/** Public, secret-free view of config for the renderer. */
function sanitize(cfg) {
  const providers = Object.fromEntries(Object.entries(cfg.providers || {}).map(([id, p]) => [id, {
    id, name: p.name, kind: p.kind, baseUrl: p.baseUrl, enabled: p.enabled !== false, hasKey: !!p.key,
  }]));
  const mask = (obj) => Object.fromEntries(Object.entries(obj || {}).map(([id, v]) => [id, { id, name: v.name, connected: !!v.connected || !!v.key, hasKey: !!v.key }]));
  return {
    account: cfg.account ? { username: cfg.account.username } : null,
    providers,
    search: mask(cfg.search),
    audio: mask(cfg.audio),
    appMcps: mask(cfg.appMcps),
    agents: cfg.agents || [],
    settings: cfg.settings || {},
  };
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}

export function createGateway() {
  const token = crypto.randomBytes(24).toString('hex');

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const path = url.pathname;

    // Health check is unauthenticated so the launcher can poll readiness.
    if (path === '/health') return json(res, 200, { ok: true });

    // Everything else requires the bearer token.
    const auth = req.headers.authorization || '';
    if (auth !== `Bearer ${token}`) return json(res, 401, { error: 'unauthorized' });

    try {
      // --- catalog (for setup-less popups) ---
      if (path === '/api/catalog' && req.method === 'GET') {
        return json(res, 200, { providers: PROVIDERS, search: SEARCH_PROVIDERS, audio: AUDIO_MCPS, appMcps: APP_MCPS });
      }

      // --- config ---
      if (path === '/api/config' && req.method === 'GET') {
        return json(res, 200, sanitize(loadConfig()));
      }

      if (path === '/api/login' && req.method === 'POST') {
        const { username, password } = await readBody(req);
        const cfg = loadConfig();
        const ok = cfg.account && cfg.account.username === username && verifyPassword(password, cfg.account.password);
        return json(res, ok ? 200 : 401, { ok: !!ok });
      }

      if (path === '/api/settings' && req.method === 'POST') {
        const patch = await readBody(req);
        const cfg = loadConfig();
        cfg.settings = { ...cfg.settings, ...patch };
        saveConfig(cfg);
        return json(res, 200, { ok: true, settings: cfg.settings });
      }

      // --- models ---
      if (path === '/api/models' && req.method === 'GET') {
        const id = url.searchParams.get('provider');
        const pcfg = resolveProviderCfg(loadConfig(), id);
        if (!pcfg) return json(res, 404, { error: 'provider not configured' });
        const models = await listModels(pcfg);
        return json(res, 200, { provider: id, models });
      }

      if (path === '/api/models/all' && req.method === 'GET') {
        const cfg = loadConfig();
        const enabled = Object.keys(cfg.providers || {}).filter((id) => cfg.providers[id].enabled !== false);
        const results = await Promise.allSettled(enabled.map(async (id) => {
          const models = await listModels(resolveProviderCfg(cfg, id));
          return { provider: id, name: cfg.providers[id].name, models };
        }));
        return json(res, 200, {
          groups: results.filter((r) => r.status === 'fulfilled').map((r) => r.value),
          errors: results.filter((r) => r.status === 'rejected').map((r) => String(r.reason?.message || r.reason)),
        });
      }

      // --- chat (SSE stream) ---
      if (path === '/api/chat' && req.method === 'POST') {
        const { provider, model, messages } = await readBody(req);
        const pcfg = resolveProviderCfg(loadConfig(), provider);
        if (!pcfg) return json(res, 404, { error: 'provider not configured' });
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
        const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        const controller = new AbortController();
        req.on('close', () => controller.abort());
        try {
          await streamChat(pcfg, { model, messages, signal: controller.signal }, (chunk) => send('delta', { text: chunk }));
          send('done', { ok: true });
        } catch (err) {
          send('error', { message: String(err?.message || err) });
        }
        return res.end();
      }

      // --- agents ---
      if (path === '/api/agents' && req.method === 'POST') {
        const { name, description, model, provider } = await readBody(req);
        const cfg = loadConfig();
        const agent = { id: randomUUID(), name: name || 'Untitled Agent', description: description || '', model: model || null, provider: provider || null, createdAt: new Date().toISOString() };
        cfg.agents = [...(cfg.agents || []), agent];
        saveConfig(cfg);
        return json(res, 200, { ok: true, agent });
      }

      // --- app MCP connect (stub: records connection; OAuth flow wired in a later pass) ---
      if (path === '/api/mcp/connect' && req.method === 'POST') {
        const { id, key } = await readBody(req);
        const meta = APP_MCPS.find((m) => m.id === id);
        if (!meta) return json(res, 404, { error: 'unknown mcp' });
        const cfg = loadConfig();
        cfg.appMcps = cfg.appMcps || {};
        cfg.appMcps[id] = { id, name: meta.name, connected: true, key: key ? encryptSecret(key) : '' };
        saveConfig(cfg);
        return json(res, 200, { ok: true, mcp: { id, name: meta.name, connected: true } });
      }

      return json(res, 404, { error: 'not found', path });
    } catch (err) {
      return json(res, 500, { error: String(err?.message || err) });
    }
  });

  function listen() {
    return new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const { port } = server.address();
        resolve({ port, token });
      });
    });
  }

  return { server, token, listen, close: () => new Promise((r) => server.close(r)) };
}
