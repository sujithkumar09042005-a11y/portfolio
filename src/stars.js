// The star and dust field behind the whole page: pure maths, so it can be tested without a browser.
// Three depth layers stream outward from the dive's vanishing point as you scroll; the far layer is slowest and the near layer
// fastest (parallax). Stars are normalised, so a resize only changes how they are projected.

export const LAYERS = [
  { share: 0.58, speed: 0.35, size: [0.5, 1.0], alpha: [0.35, 0.7] },   // far
  { share: 0.3, speed: 0.9, size: [0.8, 1.5], alpha: [0.45, 0.85] },    // middle
  { share: 0.12, speed: 2.2, size: [1.2, 2.4], alpha: [0.55, 1.0] },    // near
];
export const SCROLL_PER_CYCLE = 2500;   // px of scrolling for the far layer to move one full cycle at speed 1
export const IDLE_DRIFT = 0.00005;      // cycles per millisecond, so the field is never completely still
export const VANISH_Y = 0.46;           // same vanishing point as the dive's perspective origin
// How bright the field may be outside the dive, where text sits straight on it. Chosen so a star behind a letter keeps the
// letter at 3:1 or better (see the contrast test).
export const DIM_MIN = 0.22;
export const MAX_ALPHA = { dark: 1, light: 0.5 };

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function rng(seed) {   // mulberry32
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** How many stars for a viewport. Fewer on small screens. */
export const starCount = (W, H) => Math.round(Math.min(260, Math.max(90, (W * H) / 9000)) * (W < 640 ? 0.6 : 1));

/** kind: 0 neutral (white in dark, ink in light), 1 the chapter's main colour, 2 the single warm accent. */
export function makeStars(n, seed = 7) {
  const r = rng(seed), out = [];
  LAYERS.forEach((L, layer) => {
    const count = Math.round(n * L.share);
    for (let i = 0; i < count; i++) {
      const k = r();
      out.push({
        layer, kind: k < 0.7 ? 0 : k < 0.92 ? 1 : 2,
        a: r() * Math.PI * 2, r: 0.04 + 0.96 * Math.sqrt(r()), p: r(),
        size: L.size[0] + r() * (L.size[1] - L.size[0]), alpha: L.alpha[0] + r() * (L.alpha[1] - L.alpha[0]),
        tw: 0.0006 + r() * 0.0014, ph: r() * Math.PI * 2,
      });
    }
  });
  return out;
}

// The camera looks where you point: the vanishing point steers toward the pointer, the near layer most (parallax).
export const STEER = [0.5, 1, 1.8], STEER_MAX = 0.14;
export function steerOffset(px, py, W, H) {
  return { x: (px / W - 0.5) * 2 * W * STEER_MAX, y: (py / H - 0.5) * 2 * H * STEER_MAX * 0.7 };
}
// Light bends around the pointer: stars near it are pushed outward and brightened.
export const LENS_R = 190, LENS_PUSH = 46;
export function lens(x, y, px, py) {
  const dx = x - px, dy = y - py, d = Math.hypot(dx, dy);
  if (d >= LENS_R || d < 0.001) return { x, y, f: 0 };
  const f = Math.pow(1 - d / LENS_R, 2), k = (f * LENS_PUSH) / d;
  return { x: x + dx * k, y: y + dy * k, f };
}
// A click sends a ring outward through the stars.
export const RIPPLE_MS = 1400, RIPPLE_SPEED = 620, RIPPLE_AMP = 34, RIPPLE_BAND = 46;
export function ripple(x, y, rp, now) {
  const age = (now - rp.t0) / RIPPLE_MS;
  if (age < 0 || age > 1) return { x, y, f: 0 };
  const dx = x - rp.x, dy = y - rp.y, d = Math.hypot(dx, dy) || 0.001;
  const u = (d - age * (RIPPLE_MS / 1000) * RIPPLE_SPEED) / RIPPLE_BAND, band = Math.exp(-u * u);
  const amp = RIPPLE_AMP * Math.pow(1 - age, 1.5) * band;
  return { x: x + (dx / d) * amp, y: y + (dy / d) * amp, f: band * (1 - age) };
}

/** Where a star is on screen for a given travel (in cycles). Returns null when it is off screen or invisible.
 *  ox, oy move the vanishing point (px). */
export function project(st, travel, W, H, ox = 0, oy = 0) {
  const L = LAYERS[st.layer];
  let t = (st.p + travel * L.speed) % 1; if (t < 0) t += 1;
  const R = Math.hypot(W / 2, H / 2) * 1.05, rho = st.r * Math.pow(t, 1.7) * R;
  const x = W / 2 + ox + Math.cos(st.a) * rho, y = H * VANISH_Y + oy + Math.sin(st.a) * rho;
  if (x < -6 || x > W + 6 || y < -6 || y > H + 6) return null;
  const fade = smooth(0, 0.1, t) * (1 - smooth(0.9, 1, t));
  if (fade <= 0.01) return null;
  return { x, y, size: st.size * (0.55 + 1.5 * t), alpha: st.alpha * fade, t };
}

/** Travel in cycles from the page scroll position and the clock. */
export const travelAt = (scrollY, ms) => scrollY / SCROLL_PER_CYCLE + ms * IDLE_DRIFT;
/** Gentle twinkle, 0.75 to 1. */
export const twinkle = (st, ms) => 0.75 + 0.25 * Math.sin(ms * st.tw + st.ph);
