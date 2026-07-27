// Citrine Space — config store + secret encryption.
// Shared by the CLI (writes) and the gateway (reads). Plain ESM.
//
// Layout: ~/.citrine-space/
//   config.json   — non-secret settings + encrypted secret blobs
//   master.key    — 32 random bytes, chmod 600, encrypts every secret with AES-256-GCM
//
// Secrets (API keys, OAuth tokens) are never written in plaintext. The account
// password is stored only as a scrypt hash. This is at-rest protection for a local
// single-user app — not a defense against an attacker who already has your files.

import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const DIR = process.env.CITRINE_HOME || path.join(os.homedir(), '.citrine-space');
const CONFIG_PATH = path.join(DIR, 'config.json');
const KEY_PATH = path.join(DIR, 'master.key');

export function paths() {
  return { dir: DIR, config: CONFIG_PATH, key: KEY_PATH };
}

export function ensureDir() {
  fs.mkdirSync(DIR, { recursive: true });
  try { fs.chmodSync(DIR, 0o700); } catch { /* windows */ }
}

function getMasterKey() {
  ensureDir();
  if (!fs.existsSync(KEY_PATH)) {
    const key = crypto.randomBytes(32);
    fs.writeFileSync(KEY_PATH, key);
    try { fs.chmodSync(KEY_PATH, 0o600); } catch { /* windows */ }
    return key;
  }
  return fs.readFileSync(KEY_PATH);
}

/** Encrypt a UTF-8 string → opaque token "v1:iv:tag:cipher" (base64 parts). */
export function encryptSecret(plain) {
  if (plain == null || plain === '') return '';
  const key = getMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

/** Decrypt a token from encryptSecret back to the original string, or '' on failure. */
export function decryptSecret(token) {
  if (!token) return '';
  try {
    const [ver, ivB, tagB, dataB] = String(token).split(':');
    if (ver !== 'v1') return '';
    const key = getMasterKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(dataB, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
}

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(pw), salt, 64);
  return { salt: salt.toString('base64'), hash: hash.toString('base64') };
}

export function verifyPassword(pw, rec) {
  if (!rec || !rec.salt || !rec.hash) return false;
  const hash = crypto.scryptSync(String(pw), Buffer.from(rec.salt, 'base64'), 64);
  const stored = Buffer.from(rec.hash, 'base64');
  return hash.length === stored.length && crypto.timingSafeEqual(hash, stored);
}

export function defaultConfig() {
  return {
    version: 1,
    account: null,
    providers: {},
    search: {},
    audio: {},
    appMcps: {},
    agents: [],
    settings: { theme: 'deep-space', activeModel: null, backgroundsPlus: false },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function loadConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return { ...defaultConfig(), ...JSON.parse(raw) };
  } catch {
    return defaultConfig();
  }
}

export function saveConfig(cfg) {
  ensureDir();
  cfg.updatedAt = new Date().toISOString();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
  try { fs.chmodSync(CONFIG_PATH, 0o600); } catch { /* windows */ }
  return cfg;
}

export function isConfigured() {
  const c = loadConfig();
  return !!(c.account && Object.keys(c.providers || {}).length > 0);
}
