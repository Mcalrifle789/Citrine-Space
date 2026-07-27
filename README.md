# Citrine Space chat

A **local-first personal AI agent** desktop app. Bring your own API keys, use any model
from any provider, connect apps via MCP, and spin up collaborating agents — all running on
your machine. Built with Electron + React + TypeScript, with a small loopback **gateway**
that holds your keys so they never reach the UI layer.

```
 citrine> Ask anything. Automate anything. Connect anything.
```

## Quick start

```bash
npm install          # installs Electron, Vite, React (approve electron & esbuild scripts if prompted)
npm run setup        # or: node bin/citrine.mjs space setup   → 5-step wizard
npm run build        # bundle main + preload + renderer
npm run space        # or: node bin/citrine.mjs space          → launch the app
```

During development you can skip the build and run with hot reload:

```bash
npm run dev
```

## The `citrine space` command

- **`citrine space setup`** — a guided 5-step terminal wizard. Arrow keys navigate; the focused
  option glows white; `Tab` toggles password visibility.
  1. **Account** — username + password (stored as a scrypt hash).
  2. **API providers** — pick any of ~18 providers (OpenRouter, OpenAI, Anthropic, Google
     AI Studio, OpenCode, Kilo, LiteLLM, Mistral, DeepSeek, Groq, …) or a **custom router**.
     For a custom provider, pasting a key triggers **auto-detection** of the real model names.
  3. **Search providers** — Brave, Tavily, Exa, Serper, Perplexity, You.com.
  4. **AI music / audio MCPs** — Suno, Deepgram, ElevenLabs.
  5. **Finish** — "You're finished."
- **`citrine space`** — starts the gateway (inside the Electron main process) and opens the app.

To link `citrine` globally: `npm link` (then `citrine space setup` works anywhere).

## Features

- **Models & pricing** — every model from each connected provider, **newest → oldest**, with
  **price per million tokens** (input / output). Live pricing when the provider supplies it
  (OpenRouter), else a maintained table. Open with `/model`.
- **Real streaming chat** with a "thinking…" indicator, across OpenAI-compatible, Anthropic,
  and Google APIs.
- **App MCPs** — `/MCP` connects apps (Figma, Canva, Trello, Higgsfield, Notion, GitHub, …).
  The **App MCP Bookshelf** (right rail) lists connected apps; click one to insert it into the
  chat context.
- **Agents** — the **Agent Bookshelf** lists your agents. `/agent-x` selects multiple agents to
  collaborate; active agents glow while working. Create agents with a name + description.
- **Drag & drop** — drop text/markdown/code/CSV/JSON files into the composer and their contents
  are read into context (images, PDFs, and folders are attached by reference in this build).
- **Themes** — `/themes` shows ~10 built-in backgrounds with live thumbnails. **Backgrounds
  Plus** (suggested **$4.99 one-time** or $2/mo) unlocks extra backgrounds + "create your own".
- **Magnetic buttons**, a custom title bar, and an animated cosmic starfield on space themes.

## Security & privacy

- API keys / tokens are encrypted at rest with **AES-256-GCM** using a machine-local
  `master.key` (chmod 600). The account password is stored only as a **scrypt** hash.
- The gateway binds to **127.0.0.1** only and requires a per-launch **bearer token** handed to
  the renderer through the preload bridge. Keys never enter the renderer.
- Config lives in `~/.citrine-space/` and is git-ignored.

## Project layout

```
bin/citrine.mjs          # CLI launcher (citrine space / citrine space setup)
cli/                     # zero-dep terminal UI + 5-step setup wizard
shared/                  # catalog, pricing, config+crypto, provider client, gateway (ESM)
src/main/                # Electron main — boots gateway, creates window
src/preload/             # secure IPC bridge
src/renderer/            # React UI (chat, composer, popups, bookshelves, themes)
test/                    # headless tests (crypto, pricing, catalog, config)
docs/superpowers/specs/  # design document
```

## Scripts

| Command | Does |
| --- | --- |
| `npm run setup` | Run the setup wizard |
| `npm run dev` | Dev mode with hot reload |
| `npm run build` | Production bundle |
| `npm run space` | Launch the built app |
| `npm run typecheck` | Type-check main + renderer |
| `npm run test:core` | Headless backend tests |

## Status

This is a working **v1 vertical slice**: real setup, real providers, real streaming chat,
model pricing, themes, bookshelves, and command palette. Deepened in later passes: live
OAuth for app MCPs, multi-window agent runners with true agent-to-agent messaging, audio-MCP
generation (Suno/ElevenLabs/Deepgram), image generation, and the Backgrounds Plus payment flow.
