// The physics of live text: every unit (a letter or a word) is a small spring that the pointer pushes around. Pure maths, so it
// can be tested without a browser. Each kind of text has a profile sized to its font, so a 200px headline and an 18px paragraph
// both feel right.

export const PROFILES = {
  //        reach  push  tilt  swell  weight  idle: y rot   click   lift
  name:  { sigma: 170, push: 26, rot: 9,   scale: 0.14, wght: 230, idleY: 3, idleRot: 0.8, burst: 420 },
  giant: { sigma: 560, push: 70, rot: 6,   scale: 0.07, wght: 0,   idleY: 6, idleRot: 0.5, burst: 520 },
  float: { sigma: 260, push: 36, rot: 6,   scale: 0.1,  wght: 0,   idleY: 0, idleRot: 0,   burst: 320 },
  title: { sigma: 190, push: 11, rot: 3.5, scale: 0.05, wght: 0,   idleY: 0, idleRot: 0,   burst: 200 },
  body:  { sigma: 150, push: 3.5, rot: 0,   scale: 0,   wght: 0,   idleY: 0, idleRot: 0,   burst: 55, snap: true },
};

export const STIFFNESS = 170, DAMPING = 14.3;   // damping ratio about 0.55: a little springy

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** 0 to 1: how strongly the pointer affects a unit at distance d. A Gaussian that is faded to exactly zero at 3 sigma, so units
 *  out of reach rest perfectly still (and stay pixel-sharp) instead of creeping by fractions of a pixel for ever. */
export const influence = (d, sigma) => (d >= 3 * sigma ? 0 : Math.exp(-(d * d) / (2 * sigma * sigma)) * (1 - d / (3 * sigma)));

/** Where the pointer wants a unit to be. dx, dy run from the pointer to the unit's resting centre, in screen px. */
export function reaction(dx, dy, p) {
  const d = Math.hypot(dx, dy), f = influence(d, p.sigma);
  const ease = Math.min(1, d / (p.sigma * 0.24));        // no push exactly under the pointer, where the direction is undefined
  const k = d > 0.001 ? (f * p.push * ease) / d : 0;
  return { x: dx * k, y: dy * k * 0.8, rot: clamp(dx / p.sigma, -1, 1) * f * p.rot, s: 1 + f * p.scale, f };
}

/** A slow breathing wave through the units when nothing is touching them. i is the unit's index, t the time in ms. */
export const idle = (i, t, p) => ({ y: Math.sin(t / 900 + i * 0.6) * p.idleY, rot: Math.sin(t / 1300 + i * 0.9) * p.idleRot });

/** The velocity (px/s) a click gives a unit. */
export function burst(dx, dy, p) {
  const d = Math.hypot(dx, dy) || 0.001, f = influence(d, p.sigma * 1.8);
  return { vx: (dx / d) * p.burst * f, vy: (dy / d) * p.burst * f * 0.8 };
}

/** One step of a damped spring on a single value. Returns the new [position, velocity]. */
export function spring(x, v, target, dt) {
  const h = Math.min(dt, 1 / 30);
  const a = STIFFNESS * (target - x) - DAMPING * v;
  const nv = v + a * h;
  return [x + nv * h, nv];
}

/** True when a unit has settled, so its transform can be removed and the text is drawn pixel-sharp again. */
export const isStill = (q) => Math.abs(q.x) < 0.01 && Math.abs(q.y) < 0.01 && Math.abs(q.r) < 0.01 && Math.abs(q.s - 1) < 0.0005;
