import { useEffect, useRef, useState } from "react";
import { CHIPS, FACTS, STATEMENT, STATS } from "../data.js";
import { useInView, useReducedMotion, useScroll } from "../hooks.js";
import { Rule, Title } from "./Reveal.jsx";

/** Words fill in from faint to full colour as the paragraph scrolls through the viewport. */
function Statement() {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const words = STATEMENT.split(/\s+/);
  const [n, setN] = useState(0);
  useScroll(() => {
    const r = ref.current.getBoundingClientRect();
    const p = (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35);
    setN(Math.round(Math.max(0, Math.min(1, p)) * words.length));
  });
  return (
    <p className="statement" ref={ref}>
      {words.map((w, i) => (
        <span key={i}>
          <span className={"w" + (reduce || i < n ? " on" : "")}>{w}</span>{i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}

function Counter({ to, label, delay }) {
  const reduce = useReducedMotion();
  const [val, setVal] = useState(0);
  const [ref, seen] = useInView({ threshold: 0.4 });
  useEffect(() => {
    if (!seen) return;
    if (reduce) { setVal(to); return; }
    let raf;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / 1600, 1);
      setVal(Math.round(to * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, reduce]);
  return (
    <div ref={ref} className={"stat" + (seen ? " in" : "")} style={{ transitionDelay: `${delay}ms` }}>
      <b>{val}</b><span>{label}</span>
    </div>
  );
}

export default function About() {
  return (
    <section className="section" id="about">
      <Title>About</Title>
      <div className="about-grid">
        <Statement />
        <dl className="facts">
          {FACTS.map(([k, v], i) => (
            <Rule key={k} index={i}><dt>{k}</dt><dd>{v}</dd></Rule>
          ))}
        </dl>
      </div>
      <div className="stats">
        {STATS.map((s, i) => <Counter key={s.label} to={s.to} label={s.label} delay={i * 120} />)}
      </div>
      <ul className="chips" aria-label="Tools">
        {CHIPS.map((c, i) => <li key={c} style={{ "--d": i }}>{c}</li>)}
      </ul>
    </section>
  );
}
