// Citrine Space — pricing helpers. All numbers are USD per 1,000,000 tokens.
//
// Providers rarely return prices from /models (OpenRouter is the exception). For the
// others we keep a small, editable table matched by model-id substring. Values are
// approximate and meant to be corrected over time — treat as guidance, not billing truth.
// Keys are lowercased substrings; the FIRST match wins, so order longest/most-specific first.

export const KNOWN_PRICES = [
  // Anthropic
  ['claude-opus-4',        { input: 15,   output: 75 }],
  ['claude-sonnet-4',      { input: 3,    output: 15 }],
  ['claude-3-5-haiku',     { input: 0.8,  output: 4 }],
  ['claude-3-5-sonnet',    { input: 3,    output: 15 }],
  ['claude-3-opus',        { input: 15,   output: 75 }],
  ['claude-3-haiku',       { input: 0.25, output: 1.25 }],
  // OpenAI
  ['gpt-4o-mini',          { input: 0.15, output: 0.6 }],
  ['gpt-4o',               { input: 2.5,  output: 10 }],
  ['gpt-4.1-mini',         { input: 0.4,  output: 1.6 }],
  ['gpt-4.1',              { input: 2,    output: 8 }],
  ['o3-mini',              { input: 1.1,  output: 4.4 }],
  ['o3',                   { input: 2,    output: 8 }],
  ['o1-mini',              { input: 1.1,  output: 4.4 }],
  ['o1',                   { input: 15,   output: 60 }],
  // Google
  ['gemini-2.5-pro',       { input: 1.25, output: 10 }],
  ['gemini-2.5-flash',     { input: 0.3,  output: 2.5 }],
  ['gemini-2.0-flash',     { input: 0.1,  output: 0.4 }],
  ['gemini-1.5-pro',       { input: 1.25, output: 5 }],
  ['gemini-1.5-flash',     { input: 0.075, output: 0.3 }],
  // DeepSeek
  ['deepseek-reasoner',    { input: 0.55, output: 2.19 }],
  ['deepseek-chat',        { input: 0.27, output: 1.1 }],
  // Mistral
  ['mistral-large',        { input: 2,    output: 6 }],
  ['mistral-small',        { input: 0.2,  output: 0.6 }],
  // Meta / open weights (typical Groq/Together pricing)
  ['llama-3.3-70b',        { input: 0.59, output: 0.79 }],
  ['llama-3.1-8b',         { input: 0.05, output: 0.08 }],
  // xAI
  ['grok-4',               { input: 3,    output: 15 }],
  ['grok-3',               { input: 3,    output: 15 }],
];

/**
 * Resolve pricing for a model.
 * @param {string} modelId
 * @param {{input?:number,output?:number}} [live] pricing already supplied by the provider (per 1M tokens)
 * @returns {{input:number|null, output:number|null, source:'live'|'table'|'unknown'}}
 */
export function priceFor(modelId, live) {
  if (live && (typeof live.input === 'number' || typeof live.output === 'number')) {
    return { input: live.input ?? null, output: live.output ?? null, source: 'live' };
  }
  const id = String(modelId || '').toLowerCase();
  for (const [needle, price] of KNOWN_PRICES) {
    if (id.includes(needle)) return { input: price.input, output: price.output, source: 'table' };
  }
  return { input: null, output: null, source: 'unknown' };
}

/** Format a per-million price for display, e.g. "$3.00" or "—". */
export function fmtPrice(n) {
  if (n == null || Number.isNaN(n)) return '—';
  if (n === 0) return 'free';
  return '$' + (n < 1 ? n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') : n.toFixed(2));
}
