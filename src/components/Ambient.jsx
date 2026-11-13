// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useEffect, useRef, useState } from "react";
import { TIMEZONE } from "../data.js";
import { useCanHover, useReducedMotion } from "../hooks.js";

/** Two eyes whose pupils follow the pointer, glance around when idle and blink now and then. */
export function Eyes() {
  const reduce = useReducedMotion();
  const root = useRef(null);
  useEffect(() => {
    const el = root.current;
    if (reduce || !el) return;
    const pupils = [...el.querySelectorAll(".pupil")];
    let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0, lastMove = 0;
    const look = (x, y) => { tx = x; ty = y; if (!raf) raf = requestAnimationFrame(step); };
    const step = () => {
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      pupils.forEach((p) => { p.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px)`; });
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.03 ? requestAnimationFrame(step) : 0;
    };
    const move = (e) => {
      lastMove = performance.now();
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 160) * 4;
      look((dx / d) * k, (dy / d) * k);
    };
    const glance = setInterval(() => {
      if (performance.now() - lastMove > 3000) look((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 5);
    }, 2200);
    window.addEventListener("pointermove", move, { passive: true });
    return () => { clearInterval(glance); cancelAnimationFrame(raf); window.removeEventListener("pointermove", move); };
  }, [reduce]);
  return (
    <span className="eyes" ref={root} aria-hidden="true">
      <span className="eye"><span className="pupil" /></span>
      <span className="eye" style={{ "--blink-delay": "60ms" }}><span className="pupil" /></span>
    </span>
  );
}

/** Live clock for the owner's timezone. Ticks every second, or every 20s with reduced motion. */
export function Clock() {
  const reduce = useReducedMotion();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), reduce ? 20000 : 1000);
    return () => clearInterval(t);
  }, [reduce]);
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE, hour: "2-digit", minute: "2-digit", ...(reduce ? {} : { second: "2-digit" }), hour12: false,
  });
  return (
    <p className="clock">
      <span className="live-dot" aria-hidden="true" />
      <span>Local time in India</span>
      <time dateTime={now.toISOString()}>{fmt.format(now)}</time>
    </p>
  );
}

/** Squash-and-stretch blob that trails the mouse. Decorative, ignores the pointer, mouse only. */
export function CursorBlob() {
  const reduce = useReducedMotion();
  const canHover = useCanHover();
  const el = useRef(null);
  useEffect(() => {
    const b = el.current;
    if (reduce || !canHover || !b) return;
    let x = -100, y = -100, tx = x, ty = y, raf = 0, shown = false, down = false, big = false;
    const step = () => {
      const px = x, py = y;
      x += (tx - x) * 0.2; y += (ty - y) * 0.2;
      const vx = x - px, vy = y - py, v = Math.hypot(vx, vy);
      const s = Math.min(0.9, v / 28);
      const ang = Math.atan2(vy, vx);
      const base = down ? 0.7 : big ? 2.4 : 1;
      b.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${ang.toFixed(3)}rad) scale(${(base * (1 + s)).toFixed(3)},${(base * (1 - s * 0.45)).toFixed(3)})`;
      raf = v > 0.05 || Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3 ? requestAnimationFrame(step) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    const move = (e) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX; ty = e.clientY;
      if (!shown) { shown = true; x = tx; y = ty; b.classList.add("on"); }
      const t = e.target.closest?.("a, button, input, textarea, [data-body]");
      big = !!t;
      b.classList.toggle("big", big);
      kick();
    };
    const dn = () => { down = true; kick(); };
    const up = () => { down = false; kick(); };
    const leave = () => { shown = false; b.classList.remove("on"); };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", dn);
    window.addEventListener("pointerup", up);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", dn);
      window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [reduce, canHover]);
  if (reduce || !canHover) return null;
  return <div className="blob" ref={el} aria-hidden="true" />;
}
