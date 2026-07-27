// Citrine Space — shared catalog of providers, search engines, audio MCPs and app MCPs.
// Plain ESM so both the Electron main process (TS) and the zero-build CLI (.mjs) can import it.

/**
 * kind:
 *  - "openai"    → OpenAI-compatible /v1/chat/completions + /v1/models
 *  - "anthropic" → Anthropic Messages API
 *  - "google"    → Google AI Studio (Gemini) generateContent
 * baseUrl is the default; routers/custom providers let the user override it.
 */
export const PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter',       kind: 'openai',    baseUrl: 'https://openrouter.ai/api/v1',              keyHint: 'sk-or-...',  editableBaseUrl: false, notes: 'Aggregator — hundreds of models, one key.' },
  { id: 'openai',     name: 'OpenAI',           kind: 'openai',    baseUrl: 'https://api.openai.com/v1',                 keyHint: 'sk-...',     editableBaseUrl: false },
  { id: 'anthropic',  name: 'Anthropic',        kind: 'anthropic', baseUrl: 'https://api.anthropic.com/v1',              keyHint: 'sk-ant-...', editableBaseUrl: false },
  { id: 'google',     name: 'Google AI Studio', kind: 'google',    baseUrl: 'https://generativelanguage.googleapis.com', keyHint: 'AIza...',    editableBaseUrl: false },
  { id: 'opencode',   name: 'OpenCode',         kind: 'openai',    baseUrl: 'https://opencode.ai/v1',                    keyHint: 'oc-...',     editableBaseUrl: true },
  { id: 'kilo',       name: 'Kilo',             kind: 'openai',    baseUrl: 'https://api.kilocode.ai/v1',                keyHint: '',           editableBaseUrl: true },
  { id: 'litellm',    name: 'LiteLLM',          kind: 'openai',    baseUrl: 'http://localhost:4000/v1',                  keyHint: 'sk-...',     editableBaseUrl: true, notes: 'Point at your own LiteLLM proxy.' },
  { id: 'mistral',    name: 'Mistral AI',       kind: 'openai',    baseUrl: 'https://api.mistral.ai/v1',                 keyHint: '',           editableBaseUrl: false },
  { id: 'deepseek',   name: 'DeepSeek',         kind: 'openai',    baseUrl: 'https://api.deepseek.com/v1',               keyHint: 'sk-...',     editableBaseUrl: false },
  { id: 'groq',       name: 'Groq',             kind: 'openai',    baseUrl: 'https://api.groq.com/openai/v1',            keyHint: 'gsk_...',    editableBaseUrl: false },
  { id: 'together',   name: 'Together AI',      kind: 'openai',    baseUrl: 'https://api.together.xyz/v1',               keyHint: '',           editableBaseUrl: false },
  { id: 'fireworks',  name: 'Fireworks AI',     kind: 'openai',    baseUrl: 'https://api.fireworks.ai/inference/v1',     keyHint: 'fw_...',     editableBaseUrl: false },
  { id: 'deepinfra',  name: 'DeepInfra',        kind: 'openai',    baseUrl: 'https://api.deepinfra.com/v1/openai',       keyHint: '',           editableBaseUrl: false },
  { id: 'cerebras',   name: 'Cerebras',         kind: 'openai',    baseUrl: 'https://api.cerebras.ai/v1',                keyHint: 'csk-...',    editableBaseUrl: false },
  { id: 'novita',     name: 'Novita',           kind: 'openai',    baseUrl: 'https://api.novita.ai/v3/openai',           keyHint: '',           editableBaseUrl: false },
  { id: 'nvidia',     name: 'NVIDIA NIM',       kind: 'openai',    baseUrl: 'https://integrate.api.nvidia.com/v1',       keyHint: 'nvapi-...',  editableBaseUrl: false },
  { id: 'xai',        name: 'xAI (Grok)',       kind: 'openai',    baseUrl: 'https://api.x.ai/v1',                       keyHint: 'xai-...',    editableBaseUrl: false },
  { id: 'custom',     name: 'Custom / Router',  kind: 'openai',    baseUrl: '',                                          keyHint: '',           editableBaseUrl: true, custom: true, notes: 'Any OpenAI-compatible endpoint. We auto-detect models from the key.' },
];

export const SEARCH_PROVIDERS = [
  { id: 'brave',         name: 'Brave Search',    keyHint: 'BSA...' },
  { id: 'tavily',        name: 'Tavily',          keyHint: 'tvly-...' },
  { id: 'exa',           name: 'Exa',             keyHint: '' },
  { id: 'serper',        name: 'Serper',          keyHint: '' },
  { id: 'perplexity',    name: 'Perplexity',      keyHint: 'pplx-...' },
  { id: 'you',           name: 'You.com',         keyHint: '' },
  { id: 'duckduckgo',    name: 'DuckDuckGo',      keyHint: '', noKey: true,      notes: 'Free instant-answer API — no key needed.' },
  { id: 'parallel',      name: 'Parallel',        keyHint: '',                    notes: 'Parallel.ai search API.' },
  { id: 'parallel-free', name: 'Parallel (Free)', keyHint: '', optionalKey: true, notes: 'Free tier — API key optional.' },
  { id: 'custom',        name: 'Custom / Other',  keyHint: '', custom: true, editableBaseUrl: true, notes: 'Any search API — name it, add the endpoint & key.' },
];

export const AUDIO_MCPS = [
  { id: 'elevenlabs', name: 'ElevenLabs', keyHint: '', notes: 'Voice synthesis & cloning.' },
  { id: 'deepgram',   name: 'Deepgram',   keyHint: '', notes: 'Speech-to-text & transcription.' },
  { id: 'suno',       name: 'Suno',       keyHint: '', notes: 'AI music generation.' },
];

// App MCPs surfaced by /MCP and the App MCP Bookshelf. Connected via OAuth or API key.
export const APP_MCPS = [
  { id: 'figma',      name: 'Figma',      auth: 'oauth',  icon: 'figma' },
  { id: 'canva',      name: 'Canva',      auth: 'oauth',  icon: 'canva' },
  { id: 'trello',     name: 'Trello',     auth: 'apikey', icon: 'trello' },
  { id: 'higgsfield', name: 'Higgsfield', auth: 'apikey', icon: 'higgsfield' },
  { id: 'notion',     name: 'Notion',     auth: 'oauth',  icon: 'notion' },
  { id: 'github',     name: 'GitHub',     auth: 'oauth',  icon: 'github' },
  { id: 'slack',      name: 'Slack',      auth: 'oauth',  icon: 'slack' },
  { id: 'gmail',      name: 'Gmail',      auth: 'oauth',  icon: 'gmail' },
  { id: 'gdrive',     name: 'Google Drive', auth: 'oauth', icon: 'gdrive' },
  { id: 'linear',     name: 'Linear',     auth: 'oauth',  icon: 'linear' },
];

export function providerById(id) {
  return PROVIDERS.find((p) => p.id === id);
}
