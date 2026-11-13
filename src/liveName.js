// The physics of the dive's name: each letter is a small spring that the pointer pushes around. Pure maths, so it can be tested.

export const SIGMA = 170;        // reach of the pointer, in px
export const MAX_PUSH = 26;      // how far a letter is pushed, in px
export const MAX_ROT = 9;        // degrees
export const MAX_SCALE = 0.14;
export const STIFFNESS = 170, DAMPING = 14.3;   // damping ratio about 0.55: a little springy
export const BURST = 420;        // px/s of velocity given to a letter beside a click

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** 0 to 1: how strongly the pointer affects a letter at distance d. A Gaussian that is faded to exactly zero at 3 sigma, so
 *  letters out of reach rest perfectly still (and stay pixel-sharp) instead of creeping by fractions of a pixel for ever. */
export const influence = (d, sigma = SIGMA) => (d >= 3 * sigma ? 0 : Math.exp(-(d * d) / (2 * sigma * sigma)) * (1 - d / (3 * sigma)));

/** Where the pointer wants a letter to be. dx, dy run from the pointer to the letter's resting centre. */
export function reaction(dx, dy) {
  const d = Math.hypot(dx, dy), f = influence(d);
  const ease = Math.min(1, d / 40);                   // no push exactly under the pointer, where the direction is undefined
  const k = d > 0.001 ? (f * MAX_PUSH * ease) / d : 0;
  return { x: dx * k, y: dy * k * 0.8, rot: clamp(dx / SIGMA, -1, 1) * f * MAX_ROT, s: 1 + f * MAX_SCALE, f };
}

/** A slow breathing wave through the letters when nothing is touching them. i is the letter's index, t the time in ms. */
export const idle = (i, t) => ({ y: Math.sin(t / 900 + i * 0.6) * 3, rot: Math.sin(t / 1300 + i * 0.9) * 0.8 });

/** The velocity a click gives a letter. */
export function burst(dx, dy) {
  const d = Math.hypot(dx, dy) || 0.001, f = influence(d, SIGMA * 1.8);
  return { vx: (dx / d) * BURST * f, vy: (dy / d) * BURST * f * 0.8 };
}

/** One step of a damped spring on a single value. Returns the new [position, velocity]. */
export function spring(x, v, target, dt) {
  const h = Math.min(dt, 1 / 30);
  const a = STIFFNESS * (target - x) - DAMPING * v;
  const nv = v + a * h;
  return [x + nv * h, nv];
}
