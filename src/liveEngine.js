import { PROFILES, burst, idle, isStill, reaction, spring } from "./live.js";
import { pointer, startPointer } from "./pointer.js";

// One loop drives every live unit in the dive. Components register groups of units (the letters of the name, the words of a title,
// the letters of a giant word, ...) with a gate that says when the group is on screen and interactive. Each frame: first read every
// position that is needed, then write every transform, so the browser never has to redo layout in between.

const DPR = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
const groups = new Set();
let raf = 0, last = 0, lastClick = 0, resizeBound = false;
const ZERO = { x: 0, y: 0, rot: 0, s: 1, f: 0 }, NO_IDLE = { y: 0, rot: 0 };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const fresh = () => ({ x: 0, y: 0, vx: 0, vy: 0, r: 0, vr: 0, s: 1, vs: 0, cx: 0, cy: 0, sc: 1, lift: 0, moving: false });

function measure(u, perFrame) {
  const r = u.el.getBoundingClientRect(), q = u.st;
  // text that flies in 3D is scaled by perspective, so a push in local px shows up scaled on screen
  q.sc = perFrame ? clamp(r.width / ((u.el.offsetWidth || r.width || 1) * q.s), 0.2, 3) : 1;
  q.cx = r.left + r.width / 2 - q.x * q.sc;
  q.cy = r.top + r.height / 2 - q.y * q.sc;
}

function reset(el) {
  el.style.transform = ""; el.style.fontVariationSettings = ""; el.style.removeProperty("--lift"); el.classList.remove("is-moving");
}

function frame(now) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 1 / 30); last = now;
  if (document.hidden) return;
  const click = pointer.clickAt > lastClick;
  if (click) lastClick = pointer.clickAt;

  // phase 1: reads
  const live = [];
  for (const g of groups) {
    const on = g.gate();
    g.on = on;
    // a group that is no longer on screen is let go: its units are reset, so none of them keeps its own graphics layer for nothing
    if (!on && g.wasOn) { g.units.forEach((u) => { if (u.st.moving) { reset(u.el); } Object.assign(u.st, { x: 0, y: 0, vx: 0, vy: 0, r: 0, vr: 0, s: 1, vs: 0, lift: 0, moving: false }); }); g.moving = false; }
    if (!on) { g.wasOn = false; continue; }
    if (on && (g.perFrame || !g.wasOn || g.dirty)) { for (const u of g.units) measure(u, g.perFrame); g.dirty = false; }
    g.wasOn = on; live.push(g);
  }

  // phase 2: writes
  for (const g of live) {
    const p = g.p; let any = false;
    for (let i = 0; i < g.units.length; i++) {
      const u = g.units[i], q = u.st, sc = q.sc;
      const want = g.on && pointer.on ? reaction(q.cx - pointer.x, q.cy - pointer.y, p) : ZERO;
      if (g.on && click) { const b = burst(q.cx - pointer.downX, q.cy - pointer.downY, p); q.vx += b.vx / sc; q.vy += b.vy / sc; q.vr += (b.vx / sc) * 0.05; }
      const id = g.on && p.idleY ? idle(i, now, p) : NO_IDLE, calm = 1 - Math.min(1, want.f * 3);   // the idle breath fades out under the pointer
      [q.x, q.vx] = spring(q.x, q.vx, want.x / sc, dt);
      [q.y, q.vy] = spring(q.y, q.vy, want.y / sc + id.y * calm, dt);
      [q.r, q.vr] = spring(q.r, q.vr, want.rot + id.rot * calm, dt);
      [q.s, q.vs] = spring(q.s, q.vs, want.s, dt);
      if (isStill(q)) {
        if (q.moving) { reset(u.el); q.moving = false; q.lift = 0; }
      } else {
        any = true;
        const el = u.el;
        if (!q.moving) { el.classList.add("is-moving"); q.moving = true; }   // a unit only gets its own layer while it moves, so it is crisp at rest
        // body text snaps to whole device pixels and never rotates or scales, so it stays as sharp as ordinary text
        const tx = p.snap ? Math.round(q.x * DPR) / DPR : q.x, ty = p.snap ? Math.round(q.y * DPR) / DPR : q.y;
        el.style.transform = p.snap ? `translate3d(${tx}px, ${ty}px, 0)` : `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) rotate(${q.r.toFixed(2)}deg) scale(${q.s.toFixed(4)})`;
        if (p.wght) el.style.fontVariationSettings = `"wght" ${Math.round(500 + want.f * p.wght)}, "wdth" 100`;
        if (Math.abs(want.f - q.lift) > 0.02) { q.lift = want.f; el.style.setProperty("--lift", want.f.toFixed(2)); }   // lets CSS lift the colour near the pointer
      }
    }
    g.moving = any;
  }
}

/** Register a group of elements. kind picks the profile; gate() says when the group is on screen and interactive; perFrame is for
 *  text that moves by itself (it is measured every frame). Returns a function that removes the group. */
export function registerGroup({ kind, units, gate, perFrame = false }) {
  startPointer();
  const g = { p: PROFILES[kind], units: units.map((el) => ({ el, st: fresh() })), gate, perFrame, wasOn: false, on: false, moving: false, dirty: true };
  groups.add(g);
  if (!resizeBound) {
    resizeBound = true;
    const dirty = () => groups.forEach((x) => { x.dirty = true; });
    window.addEventListener("resize", dirty);
    document.fonts?.ready.then(dirty);          // letters move when the web font arrives, so measure them again
  }
  if (!raf) { last = performance.now(); lastClick = pointer.clickAt; raf = requestAnimationFrame(frame); }
  return () => {
    groups.delete(g);
    g.units.forEach((u) => reset(u.el));
    if (!groups.size && raf) { cancelAnimationFrame(raf); raf = 0; }
  };
}
