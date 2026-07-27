// Citrine Space — slash command registry surfaced by the `/` menu.
// The spec-critical commands (/themes, /mcp, /agent-x, /bookshelf, /model) are wired;
// the rest are registered so the palette feels complete and can be deepened later.

export interface Command { name: string; args?: string; desc: string; group: string; }

export const COMMANDS: Command[] = [
  // Models & providers
  { name: '/model', desc: 'Pick the active model (all providers, newest first, with pricing)', group: 'Models' },
  { name: '/models', desc: 'Browse every model across connected providers', group: 'Models' },
  { name: '/provider', desc: 'Switch the active provider', group: 'Models' },
  { name: '/pricing', desc: 'Show price per million tokens for the current model', group: 'Models' },
  // Apps & MCP
  { name: '/mcp', desc: 'Open the app MCP picker (Figma, Canva, Trello, …)', group: 'Apps & MCP' },
  { name: '/bookshelf', desc: 'Toggle the App MCP + Agent bookshelves', group: 'Apps & MCP' },
  { name: '/connect', args: '<app>', desc: 'Connect a specific app MCP', group: 'Apps & MCP' },
  // Agents
  { name: '/agent-x', desc: 'Select one or more agents to collaborate on a task', group: 'Agents' },
  { name: '/agent', args: 'new', desc: 'Create a new agent', group: 'Agents' },
  { name: '/agents', desc: 'List your agents', group: 'Agents' },
  // Appearance
  { name: '/themes', desc: 'Choose a background theme', group: 'Appearance' },
  { name: '/backgrounds-plus', desc: 'Unlock 20+ extra backgrounds + create your own', group: 'Appearance' },
  // Session
  { name: '/new', desc: 'Start a new chat session', group: 'Session' },
  { name: '/clear', desc: 'Clear the current conversation', group: 'Session' },
  { name: '/help', desc: 'Show all commands', group: 'Session' },
  // Build & automate
  { name: '/build', args: '<goal>', desc: 'Kick off a coding / automation task', group: 'Build' },
  { name: '/image', args: '<prompt>', desc: 'Generate an image with an image model', group: 'Build' },
  { name: '/search', args: '<query>', desc: 'Run a live web search', group: 'Build' },
  // Audio
  { name: '/voice', desc: 'ElevenLabs — synthesize speech', group: 'Audio' },
  { name: '/music', desc: 'Suno — generate music', group: 'Audio' },
  { name: '/transcribe', desc: 'Deepgram — transcribe audio', group: 'Audio' },
];
