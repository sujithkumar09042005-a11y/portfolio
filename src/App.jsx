// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { ViewTransition, startTransition, useCallback, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { CERTIFICATIONS, EXPERIENCE, GITHUB, NAME, NAV, PROJECTS, RESUME, STACK_NODES, TILE_COPY } from "./data.js";
import { useReducedMotion, useTheme } from "./hooks.js";
import { revealTiles, revealed, scrollToId, setLenis, startWorld, subscribe } from "./engine.js";
import { IdentityBody } from "./tiles/Identity.jsx";
import Clock from "./tiles/Clock.jsx";
import Stack from "./tiles/Stack.jsx";
import Feast from "./tiles/Feast.jsx";
import Voyager from "./tiles/Voyager.jsx";
import Split from "./tiles/Split.jsx";
import Contact from "./components/Contact.jsx";

const P = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));
const VIS = { feastflow: Feast, voyager: Voyager, splitwise: Split };
const DETAIL_IDS = ["stack", "career", "feastflow", "voyager", "splitwise"];

const Arrow = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
);
const Sun = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
const Moon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" /></svg>
);

function Header() {
  const [theme, toggle] = useTheme();
  const go = (id) => (e) => {
    e.preventDefault();
    scrollToId(id);
  };
  return (
    <header className="bar">
      <a href="#about" className="mono" aria-label={`${NAME}, back to top`} onClick={(e) => { e.preventDefault(); scrollToId("top"); }}>SK</a>
      <nav aria-label="Primary">
        <ul>
          {NAV.map((n) => <li key={n.id}><a href={`#${n.id}`} onClick={go(n.id)}>{n.label}</a></li>)}
        </ul>
      </nav>
      <button className="theme" type="button" onClick={toggle} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
        {theme === "dark" ? <Sun /> : <Moon />}
      </button>
    </header>
  );
}

/** One bento tile. Openable tiles carry a stretched button inside their heading and a shared-element name. */
function Tile({ id, anchor, cls, hue, depth = 0, kicker, title, openable, open, onOpen, notilt, children, h = "h2", label }) {
  const Heading = h;
  const inner = (
    <article
      className={"tile " + cls + (revealed.has(id) ? " in" : "") + (openable ? " openable" : "")}
      id={anchor} data-tile={id} data-depth={depth || undefined} data-notilt={notilt ? "1" : undefined}
      style={{ "--h": hue }}
    >
      <span className="edge" aria-hidden="true" />
      <span className="shine" aria-hidden="true" />
      {title && (
        <Heading className="t-title">
          {kicker && <span className="kicker">{kicker}</span>}
          {openable
            ? <button type="button" className="open" data-open={id} onClick={() => onOpen(id)} aria-label={`${title}: open details`}>{title}<span className="go" aria-hidden="true"><Arrow /></span></button>
            : title}
        </Heading>
      )}
      {children}
    </article>
  );
  if (!openable) return inner;
  if (open === id) return <div className={"tile ghost " + cls} aria-hidden="true" />;
  return <ViewTransition name={`t-${id}`} share="morph" default="none">{inner}</ViewTransition>;
}

function Career({ full }) {
  return (
    <ol className={"timeline" + (full ? " full" : "")}>
      <span className="spine" aria-hidden="true" />
      {EXPERIENCE.map((e, i) => (
        <li key={e.id} className={e.current ? "now" : ""} style={{ "--i": i }}>
          <span className="node" aria-hidden="true">{e.current && <i />}</span>
          <p className="when">{e.when}</p>
          <p className="what">{full ? e.title : e.short}</p>
          {full && <p className="org">{e.org}</p>}
          {full && <p className="desc">{e.desc}</p>}
          {full && <ul className="tags">{e.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
        </li>
      ))}
    </ol>
  );
}

function ProjectCopy({ p, full }) {
  return (
    <>
      <p className="desc">{p.desc}</p>
      {full && (
        <>
          <ul className="tags">{p.meta.flatMap((m) => m.split(", ")).map((t) => <li key={t}>{t}</li>)}</ul>
          <a className="pill-link" href={p.href} target="_blank" rel="noopener">View on GitHub <Arrow /></a>
        </>
      )}
    </>
  );
}

function Detail({ id, onClose }) {
  const panel = useRef(null);
  const close = useRef(null);
  useEffect(() => {
    close.current?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key !== "Tab") return;
      const f = [...panel.current.querySelectorAll("a[href], button:not([disabled])")];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  let title, hue, body;
  if (id === "stack") {
    title = "The stack"; hue = 290;
    body = (
      <>
        <div className="d-vis"><Stack /></div>
        <p className="desc">{TILE_COPY.stack}</p>
        <ul className="tags">{STACK_NODES.flatMap((n) => n.tech.split(", ")).concat(["Git"]).map((t) => <li key={t}>{t}</li>)}</ul>
      </>
    );
  } else if (id === "career") {
    title = "Career"; hue = 80;
    body = (<><Career full /><p className="desc certs"><strong>Certifications. </strong>{CERTIFICATIONS}</p><a className="pill-link" href={RESUME} target="_blank" rel="noopener">Open resume <Arrow /></a></>);
  } else {
    const p = P[id]; const V = VIS[id];
    title = p.title; hue = { feastflow: 45, voyager: 200, splitwise: 150 }[id];
    body = (<><div className="d-vis"><V /></div><ProjectCopy p={p} full /></>);
  }
  return (
    <>
      <ViewTransition enter="auto" exit="auto" default="none"><div className="backdrop" onClick={onClose} aria-hidden="true" /></ViewTransition>
      <div className="dialog-wrap">
        <ViewTransition name={`t-${id}`} share="morph" default="none">
          <section className="tile detail in" ref={panel} role="dialog" aria-modal="true" aria-labelledby="dlg-title" style={{ "--h": hue }} data-lenis-prevent>
            <span className="edge" aria-hidden="true" />
            <button ref={close} type="button" className="x" onClick={onClose} aria-label="Close details"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
            <h2 id="dlg-title" className="t-title d-title">{title}</h2>
            <div className="d-body">{body}</div>
          </section>
        </ViewTransition>
      </div>
    </>
  );
}

export default function App() {
  const reduce = useReducedMotion();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(() => {
    const h = location.hash.slice(1);
    return DETAIL_IDS.includes(h) ? h : null;
  });
  const lastOpen = useRef(null);

  const openTile = useCallback((id) => {
    history.pushState({ m: 1 }, "", "#" + id);
    startTransition(() => setOpen(id));
  }, []);
  const closeTile = useCallback(() => {
    if (history.state?.m) history.back();
    else { history.replaceState(null, "", location.pathname + location.search); startTransition(() => setOpen(null)); }
  }, []);

  useEffect(() => {
    const sync = () => {
      const h = location.hash.slice(1);
      startTransition(() => setOpen(DETAIL_IDS.includes(h) ? h : null));
    };
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => { window.removeEventListener("popstate", sync); window.removeEventListener("hashchange", sync); };
  }, []);

  // smooth scroll
  const lenis = useRef(null);
  useEffect(() => {
    if (reduce) return;
    const l = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95 });
    lenis.current = l; setLenis(l);
    const un = subscribe(null, () => l.raf(performance.now()));
    return () => { un(); l.destroy(); setLenis(null); lenis.current = null; };
  }, [reduce]);
  useEffect(() => {
    document.documentElement.classList.toggle("modal-open", !!open);
    if (open) lenis.current?.stop(); else lenis.current?.start();
  }, [open]);

  // pointer light, tilt and parallax; staggered entrance
  useEffect(() => startWorld(document.documentElement), []);
  useEffect(() => revealTiles(reduce), [reduce, open]);

  // focus returns to the tile's button when the detail closes
  useEffect(() => {
    if (open) { lastOpen.current = open; return; }
    const id = lastOpen.current;
    lastOpen.current = null;
    if (id) requestAnimationFrame(() => document.querySelector(`[data-open="${id}"]`)?.focus({ preventScroll: true }));
  }, [open]);

  const t = { open, onOpen: openTile };
  return (
    <>
      <div className="spot" aria-hidden="true" />
      <div className="app" inert={open ? true : undefined}>
        <Header />
        <main id="top">
          <div className="bento">
            <Tile id="identity" anchor="about" cls="t-identity" hue={270} depth={0.01}><IdentityBody /></Tile>
            <Tile id="clock" cls="t-clock" hue={235} depth={0.025} title="Your time" kicker="Live"><Clock /></Tile>
            <Tile id="stack" cls="t-stack" hue={290} depth={0.02} title="The stack" kicker="Architecture" openable {...t}>
              <Stack />
              <p className="foot">Java, Spring Boot, React, TypeScript, MySQL</p>
            </Tile>
            <Tile id="career" anchor="experience" cls="t-career" hue={80} depth={0.03} title="Career" kicker="Timeline" openable {...t}><Career /><p className="foot cert-line">Plus certifications: full-stack bootcamp (Udemy, 62 hours) and Claude Academy courses.</p></Tile>
            <Tile id="feastflow" anchor="work" cls="t-feast" hue={45} depth={0.015} title="FeastFlow" kicker="Food delivery" openable {...t}>
              <Feast /><ProjectCopy p={P.feastflow} />
            </Tile>
            <Tile id="voyager" cls="t-voyager" hue={200} depth={0.03} title="Voyager" kicker="AI travel" openable {...t}>
              <Voyager /><ProjectCopy p={P.voyager} />
            </Tile>
            <Tile id="splitwise" cls="t-split" hue={150} depth={0.02} title="SplitWise" kicker="Bill splitting" openable {...t}>
              <Split /><ProjectCopy p={P.splitwise} />
            </Tile>
            <Tile id="contact" anchor="contact" cls="t-contact" hue={350} depth={0.01} title="Let's work together" kicker="Contact" notilt>
              <Contact />
            </Tile>
          </div>
        </main>
        <footer className="foot-bar">
          <p>{NAME}</p>
          <a href={GITHUB} target="_blank" rel="noopener">GitHub</a>
        </footer>
      </div>
      {open && <Detail id={open} onClose={closeTile} />}
    </>
  );
}
