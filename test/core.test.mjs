// Headless tests for the parts that don't need Electron: crypto round-trip,
// password hashing, pricing lookup, and catalog integrity. Run: npm run test:core
import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

// Point config at a throwaway home so we never touch the real one.
process.env.CITRINE_HOME = path.join(os.tmpdir(), 'citrine-test-' + Date.now());

const { encryptSecret, decryptSecret, hashPassword, verifyPassword, defaultConfig, saveConfig, loadConfig } = await import('../shared/config.mjs');
const { priceFor, fmtPrice } = await import('../shared/pricing.mjs');
const { PROVIDERS, providerById } = await import('../shared/catalog.mjs');

test('secret encryption round-trips and is not plaintext', () => {
  const secret = 'sk-super-secret-key-123';
  const enc = encryptSecret(secret);
  assert.ok(enc.startsWith('v1:'));
  assert.ok(!enc.includes(secret));
  assert.equal(decryptSecret(enc), secret);
});

test('empty secret encrypts to empty', () => {
  assert.equal(encryptSecret(''), '');
  assert.equal(decryptSecret(''), '');
});

test('tampered ciphertext fails closed to empty string', () => {
  const enc = encryptSecret('hello');
  const tampered = enc.slice(0, -4) + 'AAAA';
  assert.equal(decryptSecret(tampered), '');
});

test('password hashing verifies correct and rejects wrong', () => {
  const rec = hashPassword('correct horse');
  assert.ok(rec.salt && rec.hash);
  assert.equal(verifyPassword('correct horse', rec), true);
  assert.equal(verifyPassword('wrong', rec), false);
});

test('config persists and reloads', () => {
  const c = defaultConfig();
  c.account = { username: 'tester', password: hashPassword('pw') };
  c.providers.openai = { id: 'openai', name: 'OpenAI', kind: 'openai', baseUrl: 'x', key: encryptSecret('k'), enabled: true };
  saveConfig(c);
  const back = loadConfig();
  assert.equal(back.account.username, 'tester');
  assert.equal(decryptSecret(back.providers.openai.key), 'k');
});

test('pricing table matches known models and formats', () => {
  assert.equal(priceFor('claude-sonnet-4-5').input, 3);
  assert.equal(priceFor('gpt-4o-mini').output, 0.6);
  assert.equal(priceFor('totally-unknown-model').source, 'unknown');
  assert.equal(fmtPrice(3), '$3.00');
  assert.equal(fmtPrice(0.15), '$0.15');
  assert.equal(fmtPrice(null), '—');
});

test('live pricing overrides the table', () => {
  const p = priceFor('gpt-4o', { input: 1.23, output: 4.56 });
  assert.equal(p.source, 'live');
  assert.equal(p.input, 1.23);
});

test('catalog has the spec-required providers and unique ids', () => {
  for (const id of ['openrouter', 'openai', 'anthropic', 'google', 'custom']) {
    assert.ok(providerById(id), `missing provider ${id}`);
  }
  const ids = PROVIDERS.map((p) => p.id);
  assert.equal(ids.length, new Set(ids).size, 'provider ids must be unique');
});

test.after(() => { try { fs.rmSync(process.env.CITRINE_HOME, { recursive: true, force: true }); } catch {} });
