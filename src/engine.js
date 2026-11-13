// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
// One shared frame loop: Lenis smooth scroll, pointer position and smoothed scroll velocity.
import Lenis from "lenis";

export const state = { px: 0, py: 0, hasPointer: false, vel: 0, dir: 1, y: 0, t: 0 };
const subs = new Set();
let lenis = null;
let raf = 0;
let last = 0;
let lastY = 0;
let targetDir = 1;

export const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Semi-implicit spring step on {x, v}. */
export function spring(s, target, dt, k = 170, c = 17) {
  const d = Math.min(dt, 32) / 1000;
  s.v += (k * (target - s.x) - c * s.v) * d;
  s.x += s.v * d;
}

export function scrollToEl(el) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration: 1.4 });
  else el.scrollIntoView();
}
export function scrollTop() {
  if (lenis) lenis.scrollTo(0, { duration: 1.4 });
  else window.scrollTo(0, 0);
}

function tick(time) {
  const dt = Math.min(64, time - last) || 16;
  last = time;
  if (lenis) lenis.raf(time);
  const y = window.scrollY;
  const v = (y - lastY) / dt; // px per ms
  lastY = y;
  state.y = y;
  state.vel += (v - state.vel) * Math.min(1, dt / 90);
  if (Math.abs(v) > 0.05) targetDir = v > 0 ? 1 : -1;
  state.dir += (targetDir - state.dir) * Math.min(1, dt / 240);
  state.t = time;
  subs.forEach((f) => f(time, dt, state));
  raf = requestAnimationFrame(tick);
}

function onMove(e) { state.px = e.clientX; state.py = e.clientY; state.hasPointer = e.pointerType !== "touch"; }
function onLeave() { state.hasPointer = false; }

/** Start the loop (only when motion is allowed). Returns a stop function. */
export function startEngine() {
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
  lastY = window.scrollY;
  last = performance.now();
  window.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    lenis.destroy();
    lenis = null;
    window.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    state.vel = 0;
    state.hasPointer = false;
  };
}
