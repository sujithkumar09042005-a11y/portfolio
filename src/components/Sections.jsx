// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { CERTIFICATIONS, CHIPS, EXPERIENCE, FACTS, PROJECTS, STATEMENT } from "../data.js";
import { Rise, TiltCard, Title } from "./Interactive.jsx";

const Arrow = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
);

export function About() {
  return (
    <section className="section" id="about" data-hue="205" data-int="0.9">
      <Title>About</Title>
      <Rise as="p" className="statement">{STATEMENT}</Rise>
      <div className="about-cols">
        <Rise as="dl" className="facts">
          {FACTS.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </Rise>
        <Rise as="ul" className="chips" delay={120} aria-label="Tools">
          {CHIPS.map((c) => <li key={c}>{c}</li>)}
        </Rise>
      </div>
    </section>
  );
}

export function Projects() {
  return (
    <section className="section" id="work" data-hue="150" data-int="1.1">
      <Title>Selected work</Title>
      <ul className="projects">
        {PROJECTS.map((p, i) => (
          <li key={p.title}>
            <TiltCard className={"project p" + (i + 1)}>
              <span className="spot" aria-hidden="true" />
              <span className="num" aria-hidden="true">0{i + 1}</span>
              <h3><a href={p.href} target="_blank" rel="noopener" className="stretch">{p.title}<Arrow /></a></h3>
              <p>{p.desc}</p>
              <ul className="tags">{p.meta.map((m) => <li key={m}>{m}</li>)}</ul>
            </TiltCard>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Experience() {
  return (
    <section className="section" id="experience" data-hue="25" data-int="1">
      <Title>Experience</Title>
      <ol className="timeline">
        {EXPERIENCE.map((j, i) => (
          <Rise as="li" key={j.title} delay={i * 90} className={"job" + (j.when === "Current" ? " now" : "")}>
            <span className="when">{j.when}</span>
            <div>
              <h3>{j.title}<span className="org">, {j.org}</span></h3>
              {j.desc && <p>{j.desc}</p>}
              {j.tags.length > 0 && <ul className="tags">{j.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
            </div>
          </Rise>
        ))}
      </ol>
      <Rise className="certs">
        <h3>Certifications</h3>
        <ul>{CERTIFICATIONS.map((c) => <li key={c}>{c}</li>)}</ul>
      </Rise>
    </section>
  );
}
