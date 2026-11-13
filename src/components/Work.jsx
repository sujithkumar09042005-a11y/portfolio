// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useEffect, useRef } from "react";
import { PROJECTS } from "../data.js";
import { clamp, state, subscribe } from "../engine.js";
import { useMedia, useReducedMotion } from "../hooks.js";
import { Scramble } from "./Bits.jsx";

const TONES = ["sc", "sa", "sb"];

function Panel({ p, i, n }) {
  return (
    <article className={"panel " + TONES[i % 3]} data-i={i}>
      <p className="p-num mono">0{i + 1} / 0{n}</p>
      <h3 className="p-title">
        <a href={p.href} target="_blank" rel="noopener" data-cursor="open">
          <span className="p-type">{p.title}</span>
        </a>
      </h3>
      <div className="plate" aria-hidden="true">
        <div className="plate-in"><span className="p-type p-copy">{p.title}</span></div>
      </div>
      <div className="p-card">
        <p>{p.desc}</p>
        <ul className="tags">{p.meta.map((m) => <li key={m}>{m}</li>)}</ul>
        <a className="btn" href={p.href} target="_blank" rel="noopener" aria-label={`Open ${p.title} on GitHub`} data-cursor="open">
          <Scramble text="Open project" />
        </a>
      </div>
    </article>
  );
}

export default function Work() {
  const reduce = useReducedMotion();
  const wide = useMedia("(min-width: 900px)", true);
  const pinned = wide && !reduce;
  const sec = useRef(null);
  const track = useRef(null);
  const n = PROJECTS.length;

  useEffect(() => {
    if (!pinned) return;
    const s = sec.current, t = track.current;
    const panels = [...t.children];
    const range = () => Math.max(1, s.offsetHeight - innerHeight);
    return subscribe(() => {
      const top = s.getBoundingClientRect().top;
      if (top > innerHeight || top < -s.offsetHeight) return;
      const p = clamp(-top / range(), 0, 1);
      const travel = t.scrollWidth - innerWidth;
      t.style.transform = `translate3d(${-p * travel}px,0,0)`;
      s.style.setProperty("--p", p.toFixed(4));
      panels.forEach((el, i) => {
        // local position: 0 when the panel is centred, +-1 one screen away
        const local = (i / (n - 1) - p) * (n - 1);
        el.style.setProperty("--l", local.toFixed(3));
        el.style.setProperty("--a", Math.min(1, Math.abs(local)).toFixed(3));
      });
    });
  }, [pinned, n]);

  // keyboard: focusing a link in the pinned gallery scrolls the page to bring its panel to centre
  function onFocus(e) {
    if (!pinned) return;
    const panel = e.target.closest(".panel");
    if (!panel) return;
    const i = Number(panel.dataset.i);
    const s = sec.current;
    const y = window.scrollY + s.getBoundingClientRect().top + (i / (n - 1)) * (s.offsetHeight - innerHeight);
    window.scrollTo({ top: y, behavior: "instant" });
  }

  return (
    <section
      className={"work " + (pinned ? "pinned" : "native") + (reduce ? " stack" : "")}
      id="work" ref={sec} aria-labelledby="work-h"
      style={pinned ? { height: `${n * 100}vh` } : undefined}
      onFocus={onFocus}
    >
      <h2 id="work-h" className="sr">Selected work</h2>
      <div className="pin">
        <div className="track" ref={track} tabIndex={pinned ? undefined : 0} role={pinned ? undefined : "group"} aria-label={pinned ? undefined : "Projects, scroll sideways"}>
          {PROJECTS.map((p, i) => <Panel key={p.title} p={p} i={i} n={n} />)}
        </div>
      </div>
    </section>
  );
}

export { state };
