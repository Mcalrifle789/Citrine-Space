// Citrine Space — `citrine space setup`. A guided 5-step wizard: account, API providers,
// search providers, audio MCPs, finish. Arrow keys navigate; the focused option glows white.

import { header, menu, input, say, pause, c } from './tui.mjs';
import { PROVIDERS, SEARCH_PROVIDERS, AUDIO_MCPS, providerById } from '../shared/catalog.mjs';
import { loadConfig, saveConfig, encryptSecret, hashPassword } from '../shared/config.mjs';
import { detectCustomProvider } from '../shared/providerClient.mjs';

const TOTAL = 5;

export async function runSetup() {
  const cfg = loadConfig();

  // ── Step 1 — Account ────────────────────────────────────────────────
  header(1, TOTAL, 'Account');
  say(c.grey('Create the local account that unlocks Citrine Space.\n'));
  const username = await input({ label: 'Username', placeholder: 'e.g. mcalrifle' });
  header(1, TOTAL, 'Account');
  say(c.green('✓ ') + c.grey('Username: ') + c.white(username) + '\n');
  const password = await input({ label: 'Password', mask: true, allowToggle: true, placeholder: 'choose a password' });
  cfg.account = { username: username.trim() || 'user', password: hashPassword(password) };

  // ── Step 2 — API Providers ──────────────────────────────────────────
  header(2, TOTAL, 'API Providers');
  say(c.grey('Select every provider you want to use. Space toggles, enter confirms.\n'));
  const picks = await menu({
    multi: true,
    items: PROVIDERS.map((p) => ({ label: p.name, hint: p.notes || p.keyHint })),
  });
  cfg.providers = cfg.providers || {};
  for (const idx of picks) {
    const p = PROVIDERS[idx];
    header(2, TOTAL, 'API Providers');
    say(c.cyan('◆ ') + c.white(p.name) + '\n');
    let baseUrl = p.baseUrl;
    if (p.editableBaseUrl || p.custom) {
      baseUrl = (await input({ label: `Base URL for ${p.name}`, value: p.baseUrl, placeholder: 'https://…/v1' })).trim() || p.baseUrl;
    }
    const key = (await input({ label: `API key for ${p.name}`, mask: true, allowToggle: true, placeholder: p.keyHint || 'paste key' })).trim();

    let name = p.name;
    let detected = null;
    if (p.custom && key) {
      say('\n  ' + c.dim('Detecting provider from key…'));
      try {
        detected = await detectCustomProvider({ baseUrl, key });
        say(c.green(`  ✓ Detected ${detected.count} models`) + c.dim(` (e.g. ${detected.models.slice(0, 3).join(', ')})`));
        const guess = guessName(detected.models);
        if (guess) { name = guess; say(c.grey('  Looks like: ') + c.white(name)); }
      } catch (e) {
        say(c.amberSafe('  ! Could not auto-detect: ') + c.grey(String(e.message).slice(0, 80)));
      }
    }
    cfg.providers[p.id] = { id: p.id, name, kind: p.kind, baseUrl, key: encryptSecret(key), enabled: true };
    if (!cfg.settings.activeModel && detected?.models?.length) {
      cfg.settings.activeModel = { provider: p.id, model: detected.models[0] };
    }
  }

  // ── Step 3 — Search Providers ───────────────────────────────────────
  header(3, TOTAL, 'Search Providers');
  say(c.grey('Optional. Pick search backends the agents can use for live web results.\n'));
  const sPicks = await menu({ multi: true, items: SEARCH_PROVIDERS.map((s) => ({ label: s.name, hint: s.keyHint })) });
  cfg.search = cfg.search || {};
  for (const idx of sPicks) {
    const s = SEARCH_PROVIDERS[idx];
    header(3, TOTAL, 'Search Providers');
    const key = (await input({ label: `API key for ${s.name}`, mask: true, allowToggle: true, placeholder: s.keyHint || 'paste key' })).trim();
    cfg.search[s.id] = { id: s.id, name: s.name, key: encryptSecret(key) };
  }

  // ── Step 4 — AI Music / Audio MCPs (optional) ───────────────────────
  header(4, TOTAL, 'AI Music / Audio MCPs');
  say(c.grey('Optional. Connect audio & music tools. Select any you want.\n'));
  const aPicks = await menu({ multi: true, items: AUDIO_MCPS.map((a) => ({ label: a.name, hint: a.notes })) });
  cfg.audio = cfg.audio || {};
  for (const idx of aPicks) {
    const a = AUDIO_MCPS[idx];
    header(4, TOTAL, 'AI Music / Audio MCPs');
    const key = (await input({ label: `API key for ${a.name}`, mask: true, allowToggle: true, placeholder: 'paste key' })).trim();
    cfg.audio[a.id] = { id: a.id, name: a.name, key: encryptSecret(key), connected: true };
  }

  saveConfig(cfg);

  // ── Step 5 — Finish ─────────────────────────────────────────────────
  header(5, TOTAL, 'Finish');
  const nProv = Object.keys(cfg.providers).length;
  const nSearch = Object.keys(cfg.search).length;
  const nAudio = Object.keys(cfg.audio).length;
  say(c.glow("You're finished. ✨") + '\n');
  say(c.grey('Account:  ') + c.white(cfg.account.username));
  say(c.grey('Providers: ') + c.white(String(nProv)) + c.dim(`  (${Object.values(cfg.providers).map((p) => p.name).join(', ')})`));
  say(c.grey('Search:    ') + c.white(String(nSearch)));
  say(c.grey('Audio MCP: ') + c.white(String(nAudio)));
  say('\n' + c.cyan('Launch the app with ') + c.glow('citrine space') + c.cyan('.'));
  await pause('Press enter to close setup');
  process.stdout.write('\n');
}

function guessName(models) {
  const j = models.join(' ').toLowerCase();
  if (j.includes('claude')) return 'Anthropic (via router)';
  if (j.includes('gpt') || j.includes('o1') || j.includes('o3')) return 'OpenAI (via router)';
  if (j.includes('gemini')) return 'Google (via router)';
  if (j.includes('llama')) return 'Meta Llama (via router)';
  if (j.includes('deepseek')) return 'DeepSeek (via router)';
  return null;
}

// small safety shim in case a color helper is referenced before defined
c.amberSafe = c.amber;
