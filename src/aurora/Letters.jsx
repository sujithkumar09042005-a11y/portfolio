// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
// Per-letter variable-font reaction: weight/width follow pointer proximity, with an optional idle "breath".
import { useEffect, useRef } from "react";
import { live, onFrame } from "../live.js";

const items = new Set();
let running = false, off = null;

function measure() {
  items.forEach((it) => {
    const r = it.el.getBoundingClientRect();
    it.cx = r.left + r.width / 2 + scrollX;
    it.cy = r.top + r.height / 2 + scrollY;
  });
}

function tick(t) {
  const vh = innerHeight, sy = scrollY, sx = scrollX;
  const ptr = live.seen && live.active > 0.01;
  items.forEach((it) => {
    const y = it.cy - sy;
    if (y < -300 || y > vh + 300) return;
    let p = 0;
    if (ptr) {
      const dx = it.cx - sx - live.sx, dy = y - live.sy;
      p = Math.exp(-(dx * dx + dy * dy) / (it.r * it.r));
    }
    const breath = it.breath ? 0.5 + 0.5 * Math.sin(t * 0.9 - it.i * 0.55) : 0;
    const k = Math.max(p, breath * 0.55);
    const w = Math.round((it.lo + (it.hi - it.lo) * k) / 4) * 4;
    const wd = Math.round(it.wlo + (100 - it.wlo) * k);
    const key = w * 1000 + wd;
    if (key !== it.key) {
      it.key = key;
      it.el.style.fontVariationSettings = `"wght" ${w}, "wdth" ${wd}`;
    }
  });
}

function ensure() {
  if (running) return;
  running = true;
  measure();
  off = onFrame(tick);
  addEventListener("resize", measure);
  document.fonts?.ready.then(measure);
}
function release() {
  if (items.size || !running) return;
  running = false; off?.(); removeEventListener("resize", measure);
}

/**
 * Splits `text` into words and letters. Pass `live` false to render static letters (reduced motion).
 * The wrapper is aria-hidden spans; give the parent heading an aria-label if needed.
 */
export function Letters({ text, lo = 360, hi = 800, wlo = 78, radius = 170, breath = false, enabled = true }) {
  const root = useRef(null);
  useEffect(() => {
    if (!enabled) return;
    const spans = [...root.current.querySelectorAll("[data-l]")];
    const mine = spans.map((el, i) => ({ el, i, lo, hi, wlo, r: radius, breath, key: 0, cx: 0, cy: 0 }));
    mine.forEach((m) => items.add(m));
    ensure();
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    return () => { ro.disconnect(); mine.forEach((m) => items.delete(m)); release(); };
  }, [enabled, lo, hi, wlo, radius, breath]);

  let n = 0;
  return (
    <span ref={root} className="letters" aria-hidden="true" style={{ "--lo": lo, "--wlo": wlo }}>
      {text.split(" ").map((w, wi, arr) => (
        <span className="word" key={wi}>
          {[...w].map((c, ci) => <span className="ch" data-l key={ci} data-i={n++}>{c}</span>)}
          {wi < arr.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
