// OKLCH colour for the dive's colour worlds. Written out here (Bjorn Ottosson's OKLab) so the exact colours can be tested.
// Principles from the colour-expert skill: build in OKLCH so equal lightness looks equal, keep lightness constant and let
// hue drift slowly, take chroma as a share of what the sRGB gamut allows at that lightness and hue, and keep one warm accent.

const lin2srgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

/** OKLCH to linear sRGB. Values outside 0..1 mean the colour is outside the sRGB gamut. */
export function oklchToLinear(L, C, H) {
  const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180);
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
const inGamut = (L, C, H) => oklchToLinear(L, C, H).every((v) => v >= -1e-4 && v <= 1 + 1e-4);

const cache = new Map();
/** The most chroma sRGB can show at this lightness and hue. */
export function maxChroma(L, H) {
  const key = `${L.toFixed(3)}:${Math.round(H)}`;
  if (cache.has(key)) return cache.get(key);
  let lo = 0, hi = 0.4;
  for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (inGamut(L, mid, Math.round(H))) lo = mid; else hi = mid; }
  cache.set(key, lo);
  return lo;
}

/** WCAG relative luminance of an OKLCH colour (clamped to the gamut). */
export function luminance(L, C, H) {
  const [r, g, b] = oklchToLinear(L, C, H).map((v) => Math.min(1, Math.max(0, v)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export const contrast = (y1, y2) => { const [a, b] = y1 > y2 ? [y1, y2] : [y2, y1]; return (a + 0.05) / (b + 0.05); };
export const hexLuminance = (hex) => {
  const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
};
export const toHex = (L, C, H) => "#" + oklchToLinear(L, C, H).map((v) => Math.round(255 * Math.min(1, Math.max(0, lin2srgb(Math.min(1, Math.max(0, v)))))).toString(16).padStart(2, "0")).join("");
export const css = (L, C, H) => `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${((H % 360 + 360) % 360).toFixed(1)})`;

// Lightness steps per theme. c1 is the main colour, c2 the lighter or darker neighbour in the gradient, pop the single warm accent.
// Chosen with the contrast tests so c1 reads as text on the page background in both themes.
// `cap` keeps chroma calm: the skill's character-first guidance is that restrained chroma reads as refined, so no colour
// here asks for more than 0.15 even where the gamut would allow it.
export const STEPS = {
  dark: { c1: 0.74, c2: 0.62, pop: 0.82, chroma: 0.94, cap: 0.15 },
  light: { c1: 0.5, c2: 0.58, pop: 0.5, chroma: 0.94, cap: 0.15 },
};

/** The three colours of a chapter's world at a given hue, in OKLCH, as CSS strings. */
export function worldColors(theme, hue, palette) {
  const s = STEPS[theme] || STEPS.dark;
  const h2 = hue + palette.second;
  const ch = (L, H) => Math.min(s.cap, s.chroma * maxChroma(L, H));
  return {
    c1: css(s.c1, ch(s.c1, hue), hue),
    c2: css(s.c2, ch(s.c2, h2), h2),
    pop: css(s.pop, ch(s.pop, palette.pop), palette.pop),
  };
}
