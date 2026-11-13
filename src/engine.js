// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
// Shared animation engine: one rAF ticker, one visibility observer, one pointer/scroll world loop.
import { useEffect, useRef } from "react";
import { useReducedMotion } from "./hooks.js";

/* ---------- visibility: elements know whether they are on screen ---------- */
const watching = new Map();
let io;
export function watch(el) {
  io ||= new IntersectionObserver((entries) => {
    for (const e of entries) { e.target.__live = e.isIntersecting; e.target.dataset.live = e.isIntersecting ? "1" : "0"; }
  }, { rootMargin: "120px" });
  const n = watching.get(el) || 0;
  if (!n) { el.__live = true; io.observe(el); }
  watching.set(el, n + 1);
  return () => {
    const m = (watching.get(el) || 1) - 1;
    if (m) watching.set(el, m); else { watching.delete(el); io.unobserve(el); }
  };
}

/* ---------- ticker: pauses when the tab is hidden or the element is offscreen ---------- */
const subs = new Set();
let raf = 0;
const t0 = performance.now();
export const counters = { frames: 0 };
function loop(now) {
  raf = 0;
  if (!subs.size || document.hidden) return;
  const t = (now - t0) / 1000;
  counters.frames++;
  for (const s of subs) {
    if (s.el && s.el.__live === false) { s.last = 0; continue; }
    const dt = s.last ? Math.min(0.1, t - s.last) : 0.016;
    s.last = t;
    s.cb(t, dt);
  }
  raf = requestAnimationFrame(loop);
}
function kick() { if (!raf && subs.size && !document.hidden) raf = requestAnimationFrame(loop); }
export function subscribe(el, cb) {
  const s = { el, cb, last: 0 };
  const un = el ? watch(el) : null;
  subs.add(s); kick();
  return () => { subs.delete(s); un?.(); };
}
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    document.documentElement.toggleAttribute("data-hidden", document.hidden);
    if (!document.hidden) kick();
  });
}

/** Per-frame callback for an element. Under reduced motion it runs once with a fixed time (final state). */
export function useFrame(ref, cb, staticT = 0) {
  const reduce = useReducedMotion();
  const latest = useRef(cb);
  useEffect(() => { latest.current = cb; });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) { latest.current(staticT, 0, true); return; }
    return subscribe(el, (t, dt) => { if (ref.current) latest.current(t, dt, false); });
  }, [reduce, ref, staticT]);
}

/* ---------- global pointer state (smoothed) ---------- */
export const ptr = { x: -9999, y: -9999, sx: -9999, sy: -9999, on: false, fine: false };

/** Pointer position relative to an element: normalised -1..1 and whether it is inside. */
export function local(el) {
  const r = el.getBoundingClientRect();
  const x = ptr.sx - r.left, y = ptr.sy - r.top;
  return {
    x, y, w: r.width, h: r.height,
    nx: (x / r.width - 0.5) * 2, ny: (y / r.height - 0.5) * 2,
    on: ptr.on && ptr.fine,
    inside: ptr.on && ptr.fine && x >= 0 && y >= 0 && x <= r.width && y <= r.height,
  };
}

const TILT = 4.5;
const tiles = new WeakMap();
let dirty = true;
let lastScroll = -1;
let lenisRef = null;
export function setLenis(l) { lenisRef = l; }
export function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 76;
  if (lenisRef) lenisRef.scrollTo(y, { duration: 1.3 });
  else window.scrollTo({ top: y });
}

/** Starts pointer glow, tilt and scroll parallax on [data-tile] elements. Returns a cleanup. */
export function startWorld(root) {
  ptr.fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const onMove = (e) => {
    ptr.x = e.clientX; ptr.y = e.clientY;
    ptr.fine = e.pointerType !== "touch";
    if (!ptr.on) { ptr.sx = ptr.x; ptr.sy = ptr.y; }
    ptr.on = true; dirty = true;
  };
  const onLeave = () => { ptr.on = false; dirty = true; };
  const onDirty = () => { dirty = true; };
  window.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
  window.addEventListener("scroll", onDirty, { passive: true });
  window.addEventListener("resize", onDirty);

  const un = subscribe(null, () => {
    const modal = root.classList.contains("modal-open");
    const dx = ptr.x - ptr.sx, dy = ptr.y - ptr.sy;
    let busy = ptr.on && (Math.abs(dx) + Math.abs(dy) > 0.15);
    if (ptr.on) { ptr.sx += dx * 0.22; ptr.sy += dy * 0.22; }
    const list = document.querySelectorAll("[data-tile]");
    const sy = window.scrollY;
    const scrolled = sy !== lastScroll;
    if (!dirty && !busy && !scrolled) return;
    lastScroll = sy;
    if (ptr.on && !modal) {
      root.style.setProperty("--mx", ptr.sx.toFixed(1) + "px");
      root.style.setProperty("--my", ptr.sy.toFixed(1) + "px");
      root.style.setProperty("--spot", "1");
    } else root.style.setProperty("--spot", "0");
    const vh = innerHeight;
    list.forEach((el) => {
      if (el.__live === false) return;
      const s = tiles.get(el) || { rx: 0, ry: 0, h: 0 };
      tiles.set(el, s);
      const r = el.getBoundingClientRect();
      const lx = ptr.sx - r.left, ly = ptr.sy - r.top;
      const inside = !modal && ptr.on && ptr.fine && lx >= 0 && ly >= 0 && lx <= r.width && ly <= r.height;
      el.style.setProperty("--lx", lx.toFixed(0) + "px");
      el.style.setProperty("--ly", ly.toFixed(0) + "px");
      const k = Math.min(1, 520 / Math.max(r.width, r.height)) * TILT;
      const trx = inside ? -((ly / r.height) - 0.5) * 2 * k : 0;
      const try_ = inside ? ((lx / r.width) - 0.5) * 2 * k : 0;
      s.rx += (trx - s.rx) * 0.13; s.ry += (try_ - s.ry) * 0.13;
      s.h += ((inside ? 1 : 0) - s.h) * 0.14;
      el.style.setProperty("--rx", s.rx.toFixed(3) + "deg");
      el.style.setProperty("--ry", s.ry.toFixed(3) + "deg");
      el.style.setProperty("--hov", s.h.toFixed(3));
      if (Math.abs(s.rx - trx) > 0.01 || Math.abs(s.ry - try_) > 0.01 || Math.abs(s.h - (inside ? 1 : 0)) > 0.01) busy = true;
      const depth = parseFloat(el.dataset.depth || "0");
      if (depth) {
        // scroll-linked parallax: tiles in different bands drift at different rates
        const centre = r.top + r.height / 2 - vh / 2;
        const py = Math.max(-10, Math.min(10, centre * depth * 0.6));
        el.style.setProperty("--py", py.toFixed(1) + "px");
      }
    });
    dirty = busy;
  });
  return () => {
    un();
    window.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("scroll", onDirty);
    window.removeEventListener("resize", onDirty);
  };
}

/** Tiles that have already played their entrance (so remounts after a morph do not replay it). */
export const revealed = new Set();

/** Fades tiles in with a stagger as they first enter the viewport. */
export function revealTiles(reduce) {
  const els = [...document.querySelectorAll("[data-tile]")];
  const mark = (e, d) => { e.style.setProperty("--d", d + "ms"); e.classList.add("in"); revealed.add(e.dataset.tile); };
  if (reduce) { els.forEach((e) => mark(e, 0)); return () => {}; }
  const obs = new IntersectionObserver((entries) => {
    let n = 0;
    entries.filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
      .forEach((e) => { mark(e.target, n++ * 90); obs.unobserve(e.target); });
  }, { threshold: 0.06 });
  els.forEach((e) => { if (!revealed.has(e.dataset.tile)) obs.observe(e); });
  return () => obs.disconnect();
}
