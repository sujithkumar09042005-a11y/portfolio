// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
// Shared "live" state: one rAF loop, one pointer model, one Lenis instance.
import Lenis from "lenis";

export const live = {
  // raw pointer in client px, smoothed pointer, per-frame velocity (px/frame at 60fps)
  x: -9999, y: -9999, sx: -9999, sy: -9999, vx: 0, vy: 0,
  active: 0, // 0..1, drops when the pointer leaves the window
  scrollVel: 0,
  seen: false,
};

const subs = new Set();
let raf = 0, last = 0, lenis = null, started = false;

export function onFrame(fn) {
  subs.add(fn);
  start();
  return () => { subs.delete(fn); };
}

function frame(now) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
  last = now;
  if (lenis) { lenis.raf(now); live.scrollVel = lenis.velocity || 0; }
  if (live.seen) {
    const k = 1 - Math.pow(0.0008, dt); // frame-rate independent follow
    const px = live.sx, py = live.sy;
    if (px < -999) { live.sx = live.x; live.sy = live.y; }
    else { live.sx += (live.x - px) * k; live.sy += (live.y - py) * k; }
    const f = Math.max(dt * 60, 0.5);
    live.vx = (live.sx - px) / f || 0;
    live.vy = (live.sy - py) / f || 0;
  }
  subs.forEach((fn) => fn(now / 1000, dt));
}

function start() {
  if (started) return;
  started = true;
  last = performance.now();
  raf = requestAnimationFrame(frame);
  // Pause everything when the tab is hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  });
}

function onPointer(e) {
  if (e.pointerType === "touch") return;
  live.x = e.clientX; live.y = e.clientY; live.seen = true; live.active = 1;
}
export function trackPointer() {
  const leave = () => { live.active = 0; };
  addEventListener("pointermove", onPointer, { passive: true });
  addEventListener("pointerdown", onPointer, { passive: true });
  document.documentElement.addEventListener("pointerleave", leave);
  return () => {
    removeEventListener("pointermove", onPointer);
    removeEventListener("pointerdown", onPointer);
    document.documentElement.removeEventListener("pointerleave", leave);
  };
}

export function initScroll() {
  if (lenis) return () => {};
  lenis = new Lenis({ lerp: 0.1, autoRaf: false });
  start();
  return () => { lenis?.destroy(); lenis = null; live.scrollVel = 0; };
}

export function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration: 1.4 });
  else el.scrollIntoView({ behavior: "auto" });
  if (history.replaceState) history.replaceState(null, "", `#${id}`);
}
export const scrollTop = () => (lenis ? lenis.scrollTo(0, { duration: 1.4 }) : window.scrollTo(0, 0));
