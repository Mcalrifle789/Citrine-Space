// Citrine Space — built-in background themes. Each theme is a set of CSS variables plus
// a `swatch` gradient used as the thumbnail in the /themes popup. `starfield` toggles the
// animated cosmic canvas. Backgrounds Plus (paid) unlocks the `plus: true` entries.

export interface Theme {
  id: string;
  name: string;
  starfield: boolean;
  plus?: boolean;
  swatch: string;
  vars: Record<string, string>;
}

const base = {
  '--accent': '#3fb6ff',
  '--accent-soft': 'rgba(63,182,255,0.14)',
  '--glow': '0 0 12px rgba(63,182,255,0.45)',
  '--text': '#d6ecff',
  '--text-dim': '#6f86a8',
  '--panel': 'rgba(12,20,38,0.62)',
  '--border': 'rgba(63,182,255,0.22)',
};

export const THEMES: Theme[] = [
  {
    id: 'deep-space', name: 'Deep Space', starfield: true,
    swatch: 'radial-gradient(circle at 30% 30%, #1a2c5a, #05070f 70%)',
    vars: { ...base, '--bg': '#05070f', '--bg2': '#0a1024' },
  },
  {
    id: 'citrine-crystal', name: 'Citrine Crystal', starfield: false,
    swatch: 'linear-gradient(135deg, #3a2a06, #b9852a 60%, #f2c14e)',
    vars: {
      ...base, '--bg': '#140f04', '--bg2': '#241802',
      '--accent': '#f2c14e', '--accent-soft': 'rgba(242,193,78,0.16)',
      '--glow': '0 0 12px rgba(242,193,78,0.5)', '--text': '#f6e8c4', '--text-dim': '#9c8043',
      '--panel': 'rgba(36,26,4,0.6)', '--border': 'rgba(242,193,78,0.28)',
    },
  },
  {
    id: 'midnight-terminal', name: 'Midnight Terminal', starfield: false,
    swatch: 'linear-gradient(135deg, #000, #001a06 70%, #00ff66)',
    vars: {
      ...base, '--bg': '#000300', '--bg2': '#001206',
      '--accent': '#28ff8f', '--accent-soft': 'rgba(40,255,143,0.14)',
      '--glow': '0 0 12px rgba(40,255,143,0.5)', '--text': '#8dffbf', '--text-dim': '#2f7a53',
      '--panel': 'rgba(0,18,6,0.65)', '--border': 'rgba(40,255,143,0.25)',
    },
  },
  {
    id: 'soft-aurora', name: 'Soft Aurora', starfield: true,
    swatch: 'linear-gradient(135deg, #0b1f2a, #1e6f6f 55%, #7ce0c0)',
    vars: {
      ...base, '--bg': '#07141b', '--bg2': '#0e2a30',
      '--accent': '#6fe3c4', '--accent-soft': 'rgba(111,227,196,0.14)',
      '--glow': '0 0 12px rgba(111,227,196,0.45)', '--text': '#d3f5ec', '--text-dim': '#5b8f86',
      '--panel': 'rgba(14,42,48,0.58)', '--border': 'rgba(111,227,196,0.24)',
    },
  },
  {
    id: 'minimal-paper', name: 'Minimal Paper', starfield: false,
    swatch: 'linear-gradient(135deg, #f4f1ea, #d9d2c4)',
    vars: {
      ...base, '--bg': '#f4f1ea', '--bg2': '#e8e3d7',
      '--accent': '#c2612a', '--accent-soft': 'rgba(194,97,42,0.12)',
      '--glow': 'none', '--text': '#2b2822', '--text-dim': '#8a8478',
      '--panel': 'rgba(255,255,255,0.7)', '--border': 'rgba(43,40,34,0.16)',
    },
  },
  {
    id: 'cyberpunk-rain', name: 'Cyberpunk Rain', starfield: false,
    swatch: 'linear-gradient(135deg, #14031f, #4a0a52 55%, #ff2fd0)',
    vars: {
      ...base, '--bg': '#0b0316', '--bg2': '#1a0730',
      '--accent': '#ff45d5', '--accent-soft': 'rgba(255,69,213,0.14)',
      '--glow': '0 0 14px rgba(255,69,213,0.55)', '--text': '#f4d0ff', '--text-dim': '#8a5a9c',
      '--panel': 'rgba(26,7,48,0.6)', '--border': 'rgba(255,69,213,0.26)',
    },
  },
  {
    id: 'warm-library', name: 'Warm Library', starfield: false,
    swatch: 'linear-gradient(135deg, #1c1109, #4a2f18 60%, #caa06a)',
    vars: {
      ...base, '--bg': '#160d06', '--bg2': '#291a0e',
      '--accent': '#d9a566', '--accent-soft': 'rgba(217,165,102,0.14)',
      '--glow': '0 0 10px rgba(217,165,102,0.4)', '--text': '#ecd8bd', '--text-dim': '#8a7255',
      '--panel': 'rgba(41,26,14,0.62)', '--border': 'rgba(217,165,102,0.24)',
    },
  },
  {
    id: 'ocean-depths', name: 'Ocean Depths', starfield: false,
    swatch: 'linear-gradient(135deg, #01121f, #033a5c 60%, #22a7d6)',
    vars: {
      ...base, '--bg': '#020c16', '--bg2': '#042435',
      '--accent': '#2fb6e6', '--accent-soft': 'rgba(47,182,230,0.14)',
      '--glow': '0 0 12px rgba(47,182,230,0.45)', '--text': '#cdeefb', '--text-dim': '#4d7d93',
      '--panel': 'rgba(4,36,53,0.6)', '--border': 'rgba(47,182,230,0.24)',
    },
  },
  {
    id: 'gradient-mesh', name: 'Abstract Gradient Mesh', starfield: false,
    swatch: 'conic-gradient(from 120deg, #6a3cff, #2fd6c4, #ff5da2, #6a3cff)',
    vars: {
      ...base, '--bg': '#0a0820', '--bg2': '#1a1440',
      '--accent': '#8f7bff', '--accent-soft': 'rgba(143,123,255,0.16)',
      '--glow': '0 0 14px rgba(143,123,255,0.5)', '--text': '#e4deff', '--text-dim': '#726a9c',
      '--panel': 'rgba(26,20,64,0.55)', '--border': 'rgba(143,123,255,0.26)',
    },
  },
  {
    id: 'mono-contrast', name: 'High-Contrast Monochrome', starfield: false,
    swatch: 'linear-gradient(135deg, #000, #fff)',
    vars: {
      ...base, '--bg': '#000000', '--bg2': '#0b0b0b',
      '--accent': '#ffffff', '--accent-soft': 'rgba(255,255,255,0.12)',
      '--glow': '0 0 10px rgba(255,255,255,0.4)', '--text': '#f2f2f2', '--text-dim': '#8a8a8a',
      '--panel': 'rgba(20,20,20,0.7)', '--border': 'rgba(255,255,255,0.22)',
    },
  },
  // ── Backgrounds Plus (paid) ──
  {
    id: 'nebula-bloom', name: 'Nebula Bloom', starfield: true, plus: true,
    swatch: 'radial-gradient(circle at 40% 40%, #ff6ad5, #7c3cff 45%, #05070f 80%)',
    vars: {
      ...base, '--bg': '#07041a', '--bg2': '#1a0b3a',
      '--accent': '#c77dff', '--accent-soft': 'rgba(199,125,255,0.16)',
      '--glow': '0 0 16px rgba(199,125,255,0.55)', '--text': '#efdcff', '--text-dim': '#7a6aa0',
      '--panel': 'rgba(26,11,58,0.55)', '--border': 'rgba(199,125,255,0.28)',
    },
  },
  {
    id: 'solar-flare', name: 'Solar Flare', starfield: true, plus: true,
    swatch: 'radial-gradient(circle at 50% 60%, #ffcf5c, #ff5b2e 45%, #1a0600 80%)',
    vars: {
      ...base, '--bg': '#150500', '--bg2': '#2e0d02',
      '--accent': '#ff8a3d', '--accent-soft': 'rgba(255,138,61,0.16)',
      '--glow': '0 0 16px rgba(255,138,61,0.55)', '--text': '#ffe3c9', '--text-dim': '#a06a48',
      '--panel': 'rgba(46,13,2,0.6)', '--border': 'rgba(255,138,61,0.28)',
    },
  },
];

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(theme.vars)) root.style.setProperty(k, v);
  root.dataset.theme = theme.id;
  root.dataset.starfield = String(theme.starfield);
}
