// Best-effort swatch colour for a product colour name (which usually arrives without a hex
// code). Catalog colour names are far more varied than a short list can cover (charcoal,
// stone, ash grey, ink blue, ...), so anything not in this map falls back to a deterministic
// hash-based hue instead of one flat grey - otherwise many genuinely different colours would
// all render as the same indistinguishable dot. The name should still be shown in text/title
// alongside the swatch, so meaning is never carried by colour alone.
const COLOR_SWATCH_MAP = {
  black: '#111827', jet: '#0a0a0a', onyx: '#171717', charcoal: '#374151', graphite: '#3f3f46',
  slate: '#475569', 'slate grey': '#475569', gunmetal: '#3a3f44',
  white: '#ffffff', ivory: '#fffff0', cream: '#fdf6e3', 'off white': '#f5f5f0',
  grey: '#9ca3af', gray: '#9ca3af', 'ash grey': '#b2beb5', 'stone grey': '#928e85',
  stone: '#928e85', silver: '#c0c0c0', pearl: '#eae6e1',
  red: '#ef4444', maroon: '#7f1d1d', wine: '#722f37', burgundy: '#800020', crimson: '#dc143c', rust: '#b7410e',
  blue: '#3b82f6', navy: '#1e3a5f', 'navy blue': '#1e3a5f', 'ink blue': '#1e3a8a', 'royal blue': '#4169e1',
  cobalt: '#0047ab',
  sky: '#87ceeb', 'sky blue': '#87ceeb', denim: '#1560bd', teal: '#14b8a6', cyan: '#06b6d4', turquoise: '#40e0d0',
  green: '#22c55e', olive: '#808000', forest: '#228b22', 'forest green': '#228b22', emerald: '#50c878',
  mint: '#98ff98', sage: '#9caf88', khaki: '#bdb76b',
  yellow: '#eab308', gold: '#d4af37', mustard: '#e1ad01', amber: '#ffbf00',
  orange: '#f97316', peach: '#ffcba4', coral: '#ff7f50', tan: '#d2b48c', beige: '#e8dcc8', camel: '#c19a6b', brown: '#92400e',
  purple: '#a855f7', lavender: '#e6e6fa', lilac: '#c8a2c8', indigo: '#4b0082', magenta: '#ff00ff',
  pink: '#ec4899', rose: '#ff007f', fuchsia: '#ff00ff',
};

// Cheap deterministic string hash -> HSL hue, so unmapped colour names still land on visually
// distinct (if approximate) swatches instead of collapsing onto the same grey.
const hashHue = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 360;
  }
  return hash;
};

export const swatchColor = (name) => {
  const key = (name || '').trim().toLowerCase();
  if (COLOR_SWATCH_MAP[key]) return COLOR_SWATCH_MAP[key];
  if (!key) return '#d1d5db';
  return `hsl(${hashHue(key)}, 45%, 55%)`;
};
