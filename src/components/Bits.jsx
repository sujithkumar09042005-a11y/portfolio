// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useEffect, useLayoutEffect, useRef } from "react";
import { clamp, spring, subscribe } from "../engine.js";
import { useInView, useOnScreen, useReducedMotion } from "../hooks.js";

const GLYPHS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** Decode `text` into `el`, resolving left to right. Returns a cancel function. */
function scrambleTo(el, text, ms) {
  let id = 0;
  const start = performance.now();
  const step = (now) => {
    const p = clamp((now - start) / ms, 0, 1);
    const upto = Math.floor(p * text.length);
    let out = "";
    for (let i = 0; i < text.length; i++) {
      out += text[i] === " " || i < upto ? text[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) id = requestAnimationFrame(step);
  };
  id = requestAnimationFrame(step);
  return () => { cancelAnimationFrame(id); el.textContent = text; };
}

/** Text that decodes when its parent link or button is hovered or focused. */
export function Scramble({ text }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    el.textContent = text;
    if (reduce) return;
    const host = el.closest("a,button") || el;
    let cancel = null;
    const run = () => { cancel?.(); cancel = scrambleTo(el, text, 480); };
    host.addEventListener("pointerenter", run);
    host.addEventListener("focus", run);
    return () => { cancel?.(); host.removeEventListener("pointerenter", run); host.removeEventListener("focus", run); };
  }, [text, reduce]);
  return (
    <>
      <span className="sr">{text}</span>
      <span className="scr" aria-hidden="true" ref={ref}>{text}</span>
    </>
  );
}

/** Section heading, text rises out of a mask when scrolled into view. */
export function Title({ children, id }) {
  const [ref, seen] = useInView();
  return (
    <h2 className="section-title skewy" id={id}>
      <span ref={ref} className={"mask" + (seen ? " visible" : "")}><span>{children}</span></span>
    </h2>
  );
}

/** Paragraph whose lines slide up out of masks one after another. */
export function Lines({ text, as: Tag = "p", className = "" }) {
  const [ref, seen] = useInView({ threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      let line = -1, top = null;
      el.querySelectorAll(".w").forEach((w) => {
        const t = w.parentElement.offsetTop;
        if (top === null || Math.abs(t - top) > 4) { line++; top = t; }
        w.style.setProperty("--ln", line);
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  const words = text.split(" ");
  return (
    <Tag ref={ref} className={`lines ${className}` + (seen ? " visible" : "")}>
      {words.map((w, i) => (
        <span key={i}>
          <span className="wm"><span className="w">{w}</span></span>{i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}

/** Number that counts up the first time it is seen. */
export function Counter({ to }) {
  const reduce = useReducedMotion();
  const [ref, seen] = useInView({ threshold: 0.6 });
  useEffect(() => {
    if (!seen || reduce) return;
    let controls;
    let dead = false;
    import("motion").then(({ animate }) => {
      if (dead) return;
      controls = animate(0, to, { duration: 1.6, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => { if (ref.current) ref.current.textContent = Math.round(v); } });
    });
    return () => { dead = true; controls?.stop(); };
  }, [seen, reduce, to, ref]);
  return <span ref={ref}>{to}</span>;
}

/**
 * Display text whose letters swell in weight and width near the pointer, with a slow idle wave
 * and extra weight while scrolling. Each letter is spring-smoothed.
 */
export function VarText({ text, className = "", radius = 1.4, wave = 1, ...rest }) {
  const reduce = useReducedMotion();
  const [vis, visible] = useOnScreen();
  const words = text.split(" ");
  let n = -1;
  useEffect(() => {
    if (reduce) return;
    const root = vis.current;
    const els = [...root.querySelectorAll(".l")];
    const sw = els.map(() => ({ x: 420, v: 0 }));
    const sd = els.map(() => ({ x: 88, v: 0 }));
    const lw = els.map(() => -1);
    const ld = els.map(() => -1);
    let fs = parseFloat(getComputedStyle(root).fontSize) || 100;
    const ro = new ResizeObserver(() => { fs = parseFloat(getComputedStyle(root).fontSize) || 100; });
    ro.observe(root);
    const off = subscribe((t, dt, st) => {
      if (!visible.current) return;
      const rects = els.map((e) => e.getBoundingClientRect());
      const boost = Math.min(1, Math.abs(st.vel) * 0.35);
      for (let i = 0; i < els.length; i++) {
        const r = rects[i];
        const dx = st.px - (r.left + r.width / 2);
        const dy = st.py - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) / (fs * radius);
        const f = st.hasPointer ? Math.exp(-d * d) : 0;
        const w = Math.sin(t * 0.0016 - i * 0.62) * 0.5 + 0.5;
        const idle = w * 0.4 * wave * (1 - f * 0.6);
        spring(sw[i], 300 + 500 * clamp(f + idle + boost * 0.5, 0, 1), dt);
        spring(sd[i], 76 + 24 * clamp(f * 1.1 + idle * 0.9, 0, 1), dt, 150, 15);
        const a = Math.round(sw[i].x), b = Math.round(sd[i].x * 2) / 2;
        if (a !== lw[i] || b !== ld[i]) {
          lw[i] = a; ld[i] = b;
          els[i].style.fontVariationSettings = `"wght" ${a}, "wdth" ${b}`;
        }
      }
    });
    return () => { off(); ro.disconnect(); };
  }, [reduce, radius, wave, vis, visible]);

  return (
    <span className={"vt " + className} ref={vis} {...rest}>
      <span className="sr">{text}</span>
      <span aria-hidden="true" className="vt-in">
        {words.map((word, wi) => (
          <span className="vw" key={wi}>
            {word.split("").map((ch) => { n++; return <span className="l" key={n} style={{ "--i": n }}>{ch}</span>; })}
            {wi < words.length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    </span>
  );
}
