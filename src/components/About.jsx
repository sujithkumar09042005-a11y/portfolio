// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { FACTS, STATEMENT, STATS } from "../data.js";
import { useInView } from "../hooks.js";

function Stat({ to, label }) {
  const [ref, seen] = useInView();
  return (
    <li ref={ref} className={"stat" + (seen ? " seen" : "")}>
      <b style={{ "--to": to }} aria-label={String(to)}><span aria-hidden="true" className="count" /></b>
      <span>{label}</span>
    </li>
  );
}

export default function About() {
  const words = STATEMENT.split(" ");
  return (
    <div className="about">
      <h2 className="section-title">About</h2>
      <p className="statement">
        {words.map((w, i) => <span key={i} className="w" style={{ "--i": i / words.length }}>{w} </span>)}
      </p>
      <div className="about-grid">
        <dl className="facts">
          {FACTS.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
        <ul className="stats">{STATS.map((s) => <Stat key={s.label} {...s} />)}</ul>
      </div>
    </div>
  );
}
