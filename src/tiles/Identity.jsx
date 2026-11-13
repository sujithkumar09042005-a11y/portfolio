// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useRef } from "react";
import { STATUS_FACTS } from "../data.js";
import { useFrame, ptr } from "../engine.js";

const FIRST = "Sujith";
const LAST = "Kumar";
const CHIPS = ["Java", "Spring Boot", "React", "TypeScript", "MySQL"];

/** h1 whose letters swell toward the pointer, with an idle travelling wave when nobody is near. */
export function Name() {
  const root = useRef(null);
  const letters = useRef([]);
  const vals = useRef([]);
  useFrame(root, (t, dt, still) => {
    const els = letters.current;
    const near = ptr.on && ptr.fine;
    els.forEach((el, i) => {
      if (!el) return;
      let target = 0.38 + 0.2 * Math.sin(t * 1.3 - i * 0.55);
      if (still) target = 0.55;
      if (near) {
        const r = el.getBoundingClientRect();
        const d = Math.hypot(ptr.sx - (r.left + r.width / 2), ptr.sy - (r.top + r.height / 2));
        target = Math.max(target, Math.max(0, 1 - d / 190) ** 1.5);
      }
      const v = vals.current[i] ?? target;
      const nv = still ? target : v + (target - v) * Math.min(1, dt * 9);
      vals.current[i] = nv;
      el.style.fontVariationSettings = `"wght" ${Math.round(300 + nv * 520)}, "wdth" ${Math.round(100 - nv * 12)}`;
      el.style.transform = `translateY(${(-nv * 7).toFixed(2)}px)`;
      el.style.color = `color-mix(in oklch, var(--ink) ${Math.round(100 - nv * 80)}%, var(--ac-text))`;
    });
  });
  let k = 0;
  const word = (w) => (
    <span className="word" aria-hidden="true">
      {w.split("").map((c) => { const i = k++; return <span key={i} className="ch" ref={(e) => (letters.current[i] = e)}>{c}</span>; })}
    </span>
  );
  return (
    <h1 className="name" ref={root} aria-label="Sujith Kumar">
      {word(FIRST)}{" "}{word(LAST)}
    </h1>
  );
}

/** Status line that types and erases real facts. DOM is written directly so React never re-renders. */
export function Status() {
  const root = useRef(null);
  const out = useRef(null);
  const s = useRef({ i: 0, n: 0, phase: "type", wait: 0, acc: 0 });
  useFrame(root, (t, dt, still) => {
    const st = s.current;
    if (still) { out.current.textContent = STATUS_FACTS[0]; return; }
    const full = STATUS_FACTS[st.i];
    st.acc += dt;
    if (st.phase === "type") {
      while (st.acc > 0.045 && st.n < full.length) { st.acc -= 0.045; st.n++; }
      if (st.n >= full.length) { st.phase = "hold"; st.wait = 2.2; st.acc = 0; }
    } else if (st.phase === "hold") {
      st.wait -= dt;
      if (st.wait <= 0) { st.phase = "erase"; st.acc = 0; }
    } else {
      while (st.acc > 0.02 && st.n > 0) { st.acc -= 0.02; st.n--; }
      if (st.n <= 0) { st.phase = "type"; st.i = (st.i + 1) % STATUS_FACTS.length; st.acc = 0; }
    }
    const txt = full.slice(0, st.n);
    if (out.current.textContent !== txt) out.current.textContent = txt;
  });
  return (
    <p className="status" ref={root}>
      <span className="dot" aria-hidden="true" />
      <span className="sr">{STATUS_FACTS.join(". ")}</span>
      <span className="typed" ref={out} aria-hidden="true" />
      <span className="caret" aria-hidden="true" />
    </p>
  );
}

export function IdentityBody() {
  return (
    <div className="id">
      <p className="eyebrow">Full-stack developer</p>
      <Name />
      <Status />
      <ul className="chips" aria-label="Main stack">
        {CHIPS.map((c) => <li key={c}>{c}</li>)}
      </ul>
      <div className="blobs" aria-hidden="true"><i /><i /><i /></div>
    </div>
  );
}
