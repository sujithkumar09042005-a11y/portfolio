// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { CERTS, EXPERIENCE, FACTS, HERO_LINE, PROJECTS, RESUME, STACK, STATEMENT } from "../data.js";

const Arrow = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
);

export function Hero({ goto }) {
  return (
    <section className="chap" id="home" data-stop aria-labelledby="h-home">
      <div className="copy">
        <p className="eyebrow">Full-stack developer</p>
        <h1 id="h-home" aria-label="Sujith Kumar V">Sujith<br />Kumar</h1>
        <p className="lead">{HERO_LINE}</p>
        <div className="actions">
          <a className="btn solid" href={RESUME} target="_blank" rel="noopener">Resume <Arrow /></a>
          <a className="btn line" href="#projects" onClick={(e) => goto(e, "projects")}>See the work</a>
        </div>
        <p className="hint" aria-hidden="true"><span className="hint-line" />Scroll to travel</p>
      </div>
    </section>
  );
}

export function About() {
  return (
    <section className="chap r" id="about" data-stop aria-labelledby="h-about">
      <div className="copy">
        <p className="eyebrow">01 About</p>
        <h2 id="h-about">Backends that hold, interfaces that feel quick.</h2>
        <p className="lead">{STATEMENT}</p>
        <dl className="facts">
          {FACTS.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
        </dl>
      </div>
    </section>
  );
}

export function Stack() {
  return (
    <section className="chap" id="stack" data-stop aria-labelledby="h-stack">
      <div className="copy">
        <p className="eyebrow">02 Stack</p>
        <h2 id="h-stack">The tools in orbit.</h2>
        {STACK.map((g) => (
          <div className="group" key={g.label}>
            <h3>{g.label}</h3>
            <ul className="chips">{g.items.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Projects() {
  return (
    <>
      {PROJECTS.map((p, i) => (
        <section className={"chap" + (i === 1 ? " r" : "")} id={i === 0 ? "projects" : undefined} data-stop key={p.title} aria-labelledby={`h-p${i}`}>
          <div className="copy">
            <p className="eyebrow">03 Project {i + 1} of {PROJECTS.length}</p>
            <h2 id={`h-p${i}`} className="proj-title">{p.title}</h2>
            <p className="lead">{p.desc}</p>
            <ul className="chips">{p.meta.flatMap((m) => m.split(",")).map((m) => <li key={m}>{m.trim()}</li>)}</ul>
            <a className="btn line" href={p.href} target="_blank" rel="noopener">View {p.title} on GitHub <Arrow /></a>
          </div>
        </section>
      ))}
    </>
  );
}

export function Experience() {
  return (
    <>
      {EXPERIENCE.map((e, i) => (
        <section className={"chap" + (i === 1 ? " r" : "")} id={i === 0 ? "experience" : undefined} data-stop key={e.org} aria-labelledby={`h-e${i}`}>
          <div className="copy">
            <p className="eyebrow">04 {e.when}</p>
            <h2 id={`h-e${i}`} className="sm">{e.title}</h2>
            <p className="org">{e.org}</p>
            <p className="lead">{e.desc}</p>
            {e.tags.length > 0 && <ul className="chips">{e.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
            {i === 2 && <p className="cert"><strong>Certifications.</strong> {CERTS}</p>}
          </div>
        </section>
      ))}
    </>
  );
}
