# Citrine Space — Design (2026-07-26)

## Goal
A local-first personal AI agent desktop app (a Citrine variant). Bring-your-own-keys; use any
model from any configured provider. Launched by `citrine s`, configured by `citrine s setup`.

## Scope decision
The full spec spans several subsystems. v1 is a **runnable vertical slice**: `citrine s`
launches the app; the 5-step setup wizard works; real providers connect; models list newest→
oldest with per-million pricing; real streaming chat with a thinking indicator; `/themes`,
`/model`, `/MCP`, `/agent-x` popups; MCP + Agent bookshelves; drag-drop; magnetic buttons.
Deepened later: app-MCP OAuth, multi-window agent runners with agent-to-agent messaging, audio
generation, image generation, Backgrounds Plus payment.

## Architecture
- **Electron** shell (frameless window, custom title bar). Stack: Electron + React + TS + Vite
  via **electron-vite**.
- **Gateway** — a zero-dependency Node HTTP server started *inside* the main process. Owns the
  config and secrets; proxies provider calls (models + streaming chat via SSE). Binds to
  127.0.0.1 and requires a per-launch bearer token given to the renderer through preload.
  Keys never reach the renderer.
- **CLI** (`bin/citrine.mjs`) — plain Node, no build step. `s` launches the app; `s setup` runs
  a raw-mode arrow-key wizard (focused option glows white; Tab toggles password visibility).
- **shared/** ESM modules imported by both the bundled main process and the CLI:
  `catalog` (providers/search/audio/app-MCPs), `pricing`, `config` (store + AES-256-GCM secret
  encryption + scrypt password), `providerClient` (OpenAI/Anthropic/Google list+stream),
  `gateway`.

## Data & secrets
- `~/.citrine-space/config.json` — non-secret settings + encrypted secret blobs.
- `~/.citrine-space/master.key` — 32 random bytes (chmod 600) encrypting every secret with
  AES-256-GCM. Password stored as scrypt hash only. Both git-ignored.

## Provider integration
Three API shapes: OpenAI-compatible (`/models`, `/chat/completions` SSE), Anthropic (`/models`,
`/messages` SSE), Google AI Studio (`/v1beta/models`, `:streamGenerateContent`). Models sorted
newest-first by `created` (version-sort fallback). Pricing: live when supplied (OpenRouter),
else a maintained substring table; unknown → "—". Custom provider: list `/models` with the
pasted key to detect real model names.

## Renderer
- Cosmic/cyan terminal aesthetic driven by CSS variables; themes swap the variable set and an
  optional animated starfield canvas.
- Components: TitleBar, Starfield, Chat (welcome + messages + thinking), Composer (input, slash
  palette, drag-drop, status bar, magnetic send), SlashMenu, Bookshelf (MCP + Agents), Modal,
  ModelPopup, ThemePopup, McpPopup, AgentPopup, MagneticButton.
- Slash palette from `commands.ts`; spec-critical commands wired, others registered.

## Testing / verification
- Headless `node --test`: crypto round-trip + fail-closed, scrypt verify, config persistence,
  pricing lookup + live override, catalog integrity.
- Gateway smoke: health, 401 without token, sanitized config (no secret leakage), login,
  catalog.
- `npm run typecheck` (main + renderer) and `npm run build` (main+preload+renderer bundle).

## Open items / later passes
App-MCP OAuth flows; agent multi-window runners + real collaboration transport; audio MCPs
(Suno/Deepgram/ElevenLabs); image generation; Backgrounds Plus payment; per-message token
accounting; encrypted config unlock with the account password.

## Security note
The original spec doc contained a live GitHub PAT in plaintext. It must be treated as
compromised and rotated; it is **not** stored anywhere in this repo.
