// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useEffect, useRef, useState } from "react";
import {
  CERTS, CHIPS, EMAIL, EXPERIENCE, FACTS, GITHUB, LINKEDIN, MARQUEE, NAME, NAV, PHRASES, RESUME,
  ROLE, STATEMENT, STATS, TZ,
} from "../data.js";
import { scrollToEl, scrollTop, state, subscribe } from "../engine.js";
import { useMagnetic, useReducedMotion, useTheme } from "../hooks.js";
import { Counter, Lines, Scramble, Title, VarText } from "./Bits.jsx";

const Arrow = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
);

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function greeting(h) {
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Late night, welcome";
}

export function Nav() {
  const [theme, toggle] = useTheme();
  const go = (id) => (e) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    scrollToEl(el);
    history.replaceState(null, "", "#" + id);
  };
  return (
    <header className="nav">
      <a className="brand" href="#top" onClick={(e) => { e.preventDefault(); scrollTop(); }} data-cursor="top">
        <Scramble text="SK" />
      </a>
      <nav aria-label="Primary">
        <ul>
          {NAV.map((n) => (
            <li key={n.id}>
              <a href={"#" + n.id} onClick={go(n.id)}><Scramble text={n.label} /></a>
            </li>
          ))}
        </ul>
      </nav>
      <button
        className="theme" type="button" onClick={toggle}
        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        aria-pressed={theme === "light"}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
        </svg>
      </button>
    </header>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  const mag = useMagnetic();
  const now = useNow();
  const [phrase, setPhrase] = useState(0);
  const phraseRef = useRef(null);
  useEffect(() => {
    const id = setInterval(() => setPhrase((p) => (p + 1) % PHRASES.length), 2600);
    return () => clearInterval(id);
  }, []);
  const mine = now.toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const hero = useRef(null);
  useEffect(() => {
    if (reduce) return;
    // the meta block drifts against the pointer for depth
    return subscribe(() => {
      const el = hero.current;
      if (!el || !state.hasPointer) return;
      const nx = state.px / innerWidth - 0.5;
      const ny = state.py / innerHeight - 0.5;
      el.style.setProperty("--dx", (nx * -14).toFixed(2) + "px");
      el.style.setProperty("--dy", (ny * -10).toFixed(2) + "px");
    });
  }, [reduce]);
  return (
    <section className="hero sa" id="top" ref={hero}>
      <div className="hero-top">
        <p className="eyebrow">{greeting(now.getHours())}. <span className="mono">Local {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span></p>
        <p className="eyebrow mono">Sujith's time {mine} IST</p>
      </div>
      <h1 className="hero-name skewy">
        <span className="sr">{NAME}</span>
        <VarText text="Sujith" className="hn" aria-hidden="true" />
        <VarText text="Kumar" className="hn" aria-hidden="true" />
      </h1>
      <div className="hero-meta">
        <p className="role">{ROLE}<span className="role-v">, V</span></p>
        <p className="oneline">
          Java and Spring Boot backends, React frontends, and lately <em ref={phraseRef} key={phrase} className="swap">{PHRASES[phrase]}</em>.
        </p>
        <a className="btn" href={RESUME} target="_blank" rel="noopener" data-cursor="open" {...mag}>
          <Scramble text="Resume" /><Arrow />
        </a>
      </div>
      <p className="hint mono" aria-hidden="true">Move your cursor over the name</p>
    </section>
  );
}

/** One marquee row: speed rises with scroll velocity and reverses with scroll direction. */
function Row({ items, dir, base, outline }) {
  const reduce = useReducedMotion();
  const track = useRef(null);
  useEffect(() => {
    if (reduce) return;
    const el = track.current;
    let x = 0;
    return subscribe((t, dt, st) => {
      const half = el.scrollWidth / 2;
      x += dir * st.dir * (base + Math.abs(st.vel) * 140) * (dt / 16);
      x = ((x % half) + half) % half;
      el.style.transform = `translate3d(${-x}px,0,0)`;
    });
  }, [reduce, dir, base]);
  const list = (aria) => (
    <ul className="m-list" aria-hidden={aria || undefined}>
      {items.map((w, i) => (
        <li key={i} className={outline ? "o" : ""}>{w}<i aria-hidden="true">*</i></li>
      ))}
    </ul>
  );
  return (
    <div className="m-row">
      <div className="m-track" ref={track}>
        {list(false)}
        {!reduce && list(true)}
      </div>
    </div>
  );
}

export function Marquee() {
  const a = MARQUEE;
  const b = [...MARQUEE].reverse();
  return (
    <section className="marquee sc" aria-label="Skills">
      <Row items={a} dir={1} base={1.4} />
      <Row items={b} dir={-1} base={1.1} outline />
    </section>
  );
}

export function About() {
  return (
    <section className="about sb" id="about" aria-labelledby="about-h">
      <Title id="about-h">About</Title>
      <Lines text={STATEMENT} className="statement" />
      <div className="about-grid">
        <dl className="facts">
          {FACTS.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
        <ul className="stats">
          {STATS.map((s) => (
            <li key={s.label}><b><Counter to={s.to} /></b><span>{s.label}</span></li>
          ))}
        </ul>
      </div>
      <ul className="chips" aria-label="Tools">
        {CHIPS.map((c, i) => <li key={c} style={{ "--i": i }}>{c}</li>)}
      </ul>
    </section>
  );
}

export function Experience() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(0);
  return (
    <section className="exp sa" id="experience" aria-labelledby="exp-h">
      <Title id="exp-h">Experience</Title>
      <ol className="exp-list">
        {EXPERIENCE.map((e, i) => {
          const isOpen = reduce || open === i;
          return (
            <li key={e.name} className={"exp-row" + (isOpen ? " open" : "")} onPointerEnter={(ev) => { if (ev.pointerType === "mouse") setOpen(i); }}>
              <h3>
                <button type="button" aria-expanded={isOpen} aria-controls={`exp-${i}`} onClick={() => setOpen(i)} data-cursor="view">
                  <span className="when mono">{e.when}</span>
                  <span className="xname">{e.name}</span>
                  <span className="xtitle">{e.title}</span>
                </button>
              </h3>
              <div className="exp-more" id={`exp-${i}`}>
                <div>
                  <p>{e.desc}</p>
                  {e.tags.length > 0 && <ul className="tags">{e.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="certs"><span className="mono">Certifications</span> {CERTS}</p>
    </section>
  );
}

export function Footer() {
  const now = useNow();
  return (
    <footer className="foot sc">
      <p className="mono">{NAME} - {now.toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })} IST</p>
      <ul>
        <li><a href={GITHUB} target="_blank" rel="noopener" data-cursor="open"><Scramble text="GitHub" /></a></li>
        <li><a href={LINKEDIN} target="_blank" rel="noopener" data-cursor="open"><Scramble text="LinkedIn" /></a></li>
        <li><a href={`mailto:${EMAIL}`}><Scramble text="Email" /></a></li>
        <li><button type="button" onClick={scrollTop}><Scramble text="Back to top" /></button></li>
      </ul>
    </footer>
  );
}
