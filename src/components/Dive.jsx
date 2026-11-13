import { useEffect, useRef, useState } from "react";
import { CHIPS, DIVE_CHAPTERS, DIVE_INTRO, FACTS, HERO_LINES, STATS } from "../data.js";
import { useReducedMotion, useScroll } from "../hooks.js";

// World units are CSS pixels along z. The camera moves forward by `s`; an object at world z sits at z + s on screen.
const N = DIVE_CHAPTERS.length;
const GAP = 1200;                  // distance between chapter cards
const FIRST = 1.6;                 // the first card starts 1.6 gaps away, so the opening is just the name and the tunnel
const D = (FIRST + N - 1) * GAP;   // total travel: the last card ends at the camera plane
const RING_GAP = 250;
const RINGS = Math.ceil((D + 2400) / RING_GAP);
const VH_PER_PX = 0.0833;          // scroll length per world pixel: about 0.75 screen pixels of scrolling per pixel of travel
const SECTION_VH = Math.round(100 + D * VH_PER_PX);

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
// Fades in from far away, full while near, fades out as it passes the camera.
const seen = (z) => smooth(-2400, -600, z) * (1 - smooth(0, 350, z));

const cardZ = (i) => -(FIRST + i) * GAP;
// The chapter text follows whichever card is actually on screen, so words and picture never disagree.
function activeAt(s) {
  let a = -1, m = 0;
  for (let i = 0; i < N; i++) { const v = seen(cardZ(i) + s); if (v > m) { m = v; a = i; } }
  if (m < 0.4) return -1;
  if (a === 0 && m < 0.9 && cardZ(0) + s < -300) return -1;   // the intro holds until the first card is nearly here
  return a;
}
// Where along the page's scroll a chapter is centred, as a fraction of the pinned travel (used for #anchors).
const anchorFraction = (i) => ((FIRST + i) * GAP - 300) / D;

function Panel({ head, foot = "Sample data", children }) {
  return (
    <>
      <div className="dc-head">{head}</div>
      <div className="dc-body">{children}</div>
      <div className="dc-foot">{foot}</div>
    </>
  );
}

/** Real figures from the resume; they count up once the card becomes the active one. */
function Numbers({ run }) {
  const [t, setT] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (!run || done.current) return;
    done.current = true;
    let raf;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / 1100, 1);
      setT(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run]);
  return (
    <div className="dc-stats">
      {STATS.map((s) => (
        <div key={s.label}><b className="dc-num">{Math.round(s.to * (done.current ? t : 1))}</b><span>{s.label}</span></div>
      ))}
    </div>
  );
}

const cardFor = (i, active) => {
  switch (i) {
    case 0: return (
      <Panel head="Client / React">
        <code>GET /api/orders</code>
        <span className="dc-btn">Place order</span>
      </Panel>);
    case 1: return (
      <Panel head="Server / Spring Boot">
        <ul className="dc-chain"><li>OrderController</li><li>OrderService</li><li>OrderRepository</li></ul>
      </Panel>);
    case 2: return (
      <Panel head="Database / MySQL">
        <table className="dc-table">
          <thead><tr><th>id</th><th>item</th><th>status</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>Margherita pizza</td><td>Delivered</td></tr>
            <tr><td>2</td><td>Veg biryani</td><td>Preparing</td></tr>
            <tr><td>3</td><td>Cold coffee</td><td>Placed</td></tr>
          </tbody>
        </table>
      </Panel>);
    case 3: return (
      <Panel head="Response / 200 OK">
        <code>200 OK, 3 orders</code>
        <ul className="dc-list"><li>Margherita pizza</li><li>Veg biryani</li><li>Cold coffee</li></ul>
      </Panel>);
    case 4: return (
      <Panel head="About / Sujith" foot="From my resume">
        <dl className="dc-facts">{FACTS.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      </Panel>);
    case 5: return (
      <Panel head="Skills" foot="From my resume">
        <ul className="dc-chips">{CHIPS.map((c) => <li key={c}>{c}</li>)}</ul>
      </Panel>);
    default: return (
      <Panel head="Numbers" foot="From my resume"><Numbers run={active === i} /></Panel>);
  }
};

// The real content behind a chapter's card. Read by screen readers always, and shown in full in the plain (reduced-motion) version.
function Details({ index }) {
  if (index === 4) return <dl className="dive-details dc-facts">{FACTS.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>;
  if (index === 5) return <ul className="dive-details dc-chips">{CHIPS.map((c) => <li key={c}>{c}</li>)}</ul>;
  if (index === 6) return <ul className="dive-details dc-plain">{STATS.map((s) => <li key={s.label}>{s.to} {s.label.toLowerCase()}</li>)}</ul>;
  return null;
}

/**
 * The opening and the about story: scrolling flies the camera forward through a tunnel, one card per chapter.
 * Built from CSS 3D only. Reduced-motion visitors get every chapter as plain stacked content.
 */
export default function Dive() {
  const reduce = useReducedMotion();
  const sec = useRef(null);
  const world = useRef(null);
  const bar = useRef(null);
  const rings = useRef([]);
  const cards = useRef([]);
  const name = useRef(null);
  const [active, setActive] = useState(-1);

  useScroll(() => {
    if (reduce || !sec.current) return;
    const travel = sec.current.offsetHeight - innerHeight;
    const p = travel > 0 ? clamp(-sec.current.getBoundingClientRect().top / travel, 0, 1) : 0;
    const s = p * D;
    world.current.style.transform = `translateZ(${s.toFixed(1)}px)`;
    bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
    name.current.style.opacity = String(1 - smooth(0, 350, s));
    rings.current.forEach((el, k) => { if (el) el.style.opacity = (seen(-k * RING_GAP + s) * 0.6).toFixed(3); });
    cards.current.forEach((el, i) => { if (el) el.style.opacity = seen(cardZ(i) + s).toFixed(3); });
    setActive(activeAt(s));
  });

  const label = active < 0 ? "Start" : DIVE_CHAPTERS[active].label;
  const tab = (i) => (reduce || active === i ? 0 : -1);

  return (
    <section
      className={"dive" + (reduce ? " is-static" : "")}
      id="home" ref={sec} aria-label="Introduction and about"
      style={{ "--dive-h": `${SECTION_VH}vh`, "--dive-h-m": `${Math.round(100 + D * 0.0688)}vh` }}
    >
      {/* in-page anchors for the nav, placed along the pinned scroll at each chapter's position */}
      {!reduce && DIVE_CHAPTERS.map((c, i) => c.anchor && (
        <span key={c.anchor} id={c.anchor} className="dive-anchor" style={{ "--f": anchorFraction(i) }} />
      ))}
      <div className="dive-stage">
        <div className="dive-view">
          <div className="dive-world" ref={world}>
            {Array.from({ length: RINGS }, (_, k) => (
              <i key={k} className={"dive-ring" + (k % 4 === 0 ? " is-accent" : "")} aria-hidden="true"
                ref={(el) => { rings.current[k] = el; }}
                style={{ "--z": `${-k * RING_GAP}px`, "--r": `${k * 5}deg` }} />
            ))}
            <h1 className="dive-name" ref={name}>
              {HERO_LINES.map((l, i) => <span key={l}>{l}{i < HERO_LINES.length - 1 ? " " : ""}</span>)}
            </h1>
            {DIVE_CHAPTERS.map((_, i) => (
              <div key={i} className="dive-card" aria-hidden="true" ref={(el) => { cards.current[i] = el; }} style={{ "--z": `${cardZ(i)}px` }}>
                {cardFor(i, active)}
              </div>
            ))}
          </div>
        </div>

        <div className="dive-ui">
          <ol className="dive-copy">
            <li data-on={active === -1}>
              <p className="dive-title">{DIVE_INTRO}</p>
            </li>
            {DIVE_CHAPTERS.map((c, i) => (
              <li key={c.label} data-on={active === i} id={reduce ? c.anchor : undefined}>
                <h2 className="dive-title">{c.title}</h2>
                <p>{c.text}</p>
                <Details index={i} />
                {c.cta && (
                  <div className="dive-cta">
                    <a href="#work" className="btn solid" tabIndex={tab(i)}><span>See my work</span></a>
                    <a href="#contact" className="btn line" tabIndex={tab(i)}><span>Get in touch</span></a>
                  </div>
                )}
              </li>
            ))}
          </ol>
          <div className="dive-hud">
            <p><span className="muted">Chapter</span> <b>{active + 1}</b> of {N} <span className="muted">&middot;</span> {label}</p>
            <span className="dive-track"><span ref={bar} /></span>
            <a href="#work" className="dive-skip">Skip to my work</a>
          </div>
        </div>
      </div>
    </section>
  );
}
